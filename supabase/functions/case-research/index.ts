import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ECOURTS_BASE = 'https://webapi.ecourtsindia.com';
// Read per request, not at module load. Isolates are cached, so a key added
// after this function last booted would otherwise stay invisible until a
// redeploy — the secret is live, the running copy just never looked again.
function anthropicKey(): string | undefined {
  return Deno.env.get('ANTHROPIC_API_KEY');
}
const MAX_QUERIES = 3;
const PER_QUERY = 8;
const MAX_RESULTS = 12;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

type AiResult = { text: string | null; error: string | null };

// Returns the failure reason as well as the text. A key with no credit behind
// it fails on every call, and the advocate needs to be told that rather than
// silently getting a worse search.
async function anthropic(model: string, maxTokens: number, prompt: string): Promise<AiResult> {
  const ANTHROPIC_KEY = anthropicKey();
  if (!ANTHROPIC_KEY) return { text: null, error: null };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) {
      const raw = await r.text();
      console.error('anthropic error', r.status, raw.slice(0, 300));
      let reason = `HTTP ${r.status}`;
      try {
        const msg = JSON.parse(raw)?.error?.message;
        if (typeof msg === 'string') reason = msg.slice(0, 180);
      } catch { /* keep the status code */ }
      return { text: null, error: reason };
    }
    const j = await r.json();
    return { text: j?.content?.[0]?.text ?? null, error: null };
  } catch (e) {
    console.error('anthropic call failed', e);
    return { text: null, error: 'Could not reach the Anthropic API.' };
  }
}

function firstJsonBlock(text: string): unknown {
  const m = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// Turns the advocate's plain-language matter into searchable legal phrasing.
// Falls back to the raw text so the feature still works without an AI key.
async function buildQueries(matter: string, acts: string[]): Promise<{ queries: string[]; aiUsed: boolean; aiError: string | null }> {
  const fallback = [matter.trim(), ...acts].filter(Boolean).slice(0, MAX_QUERIES);

  const out = await anthropic(
    'claude-haiku-4-5-20251001',
    400,
    `You are helping search an Indian court-records database. Convert the matter below into ${MAX_QUERIES} short keyword search queries a legal researcher would use. Use statute names and section numbers where they are implied. No boolean operators, no quotes, 4-10 words each.

Reply with only a JSON array of strings.

Matter: ${matter}
${acts.length ? `Acts already identified: ${acts.join(', ')}` : ''}`,
  );

  const parsed = out.text ? firstJsonBlock(out.text) : null;
  if (Array.isArray(parsed)) {
    const qs = parsed.filter((q) => typeof q === 'string' && q.trim()).slice(0, MAX_QUERIES);
    if (qs.length) return { queries: qs, aiUsed: true, aiError: null };
  }
  return { queries: fallback.length ? fallback : [matter], aiUsed: false, aiError: out.error };
}

type Row = Record<string, unknown>;

async function search(key: string, q: string): Promise<Row[]> {
  const url = `${ECOURTS_BASE}/api/partner/search?query=${encodeURIComponent(q)}&limit=${PER_QUERY}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!r.ok) {
    console.error('ecourts search failed', q, r.status);
    return [];
  }
  const j = await r.json().catch(() => null);
  return Array.isArray(j?.data?.results) ? j.data.results : [];
}

function title(c: Row): string {
  const p = Array.isArray(c.petitioners) ? (c.petitioners as string[]).join(', ') : '';
  const d = Array.isArray(c.respondents) ? (c.respondents as string[]).join(', ') : '';
  if (p && d) return `${p} vs ${d}`;
  return p || d || String(c.cnr ?? '');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Not authenticated' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401);

    // Precedent research is an advocate tool, and each run spends API credits.
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', userData.user.id).single();
    if (profile?.role !== 'advocate' && profile?.role !== 'admin') {
      return json({ error: 'Precedent research is available to advocates.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const matter = (body?.matter ?? '').toString().trim();
    const acts: string[] = Array.isArray(body?.acts)
      ? body.acts.filter((a: unknown) => typeof a === 'string').slice(0, 5)
      : [];

    if (matter.length < 15) {
      return json({ error: 'Describe the matter in a sentence or two so the search has something to work with.' }, 400);
    }

    const key = Deno.env.get('ECOURTS_API_KEY');
    if (!key) return json({ error: 'eCourts lookup is not configured yet.' }, 500);

    const { queries, aiUsed, aiError: queryErr } = await buildQueries(matter, acts);
    let aiError: string | null = queryErr;

    // Run the searches, then fold to one row per CNR, remembering which query
    // surfaced it and how often — repeated hits are a decent relevance signal.
    const byCnr = new Map<string, Row & { _hits: number; _via: string[] }>();
    for (const q of queries) {
      for (const row of await search(key, q)) {
        const cnr = String(row.cnr ?? '');
        if (!cnr) continue;
        const seen = byCnr.get(cnr);
        if (seen) {
          seen._hits += 1;
          if (!seen._via.includes(q)) seen._via.push(q);
        } else {
          byCnr.set(cnr, { ...row, _hits: 1, _via: [q] });
        }
      }
    }

    const ranked = [...byCnr.values()]
      .sort((a, b) => {
        // A decided case with a judgment on file is worth more than a pending one.
        const score = (r: typeof a) =>
          r._hits * 10 + (r.judgmentCount ? 5 : 0) + (r.decisionDate ? 3 : 0);
        return score(b) - score(a);
      })
      .slice(0, MAX_RESULTS);

    const results = ranked.map((c) => ({
      cnr: String(c.cnr),
      case_title: title(c),
      court_name: (c.courtName as string) || null,
      case_type: (c.caseType as string) || null,
      case_status: (c.caseStatus as string) || null,
      decision_date: (c.decisionDate as string) || null,
      filing_date: (c.filingDate as string) || null,
      judges: Array.isArray(c.judges) ? c.judges : [],
      acts_and_sections: Array.isArray(c.actsAndSections) ? c.actsAndSections : [],
      // Topic keywords the API itself derived from the judgment — shown as-is.
      topics: Array.isArray(c.aiKeywords) ? (c.aiKeywords as string[]).slice(0, 4) : [],
      judgment_count: Number(c.judgmentCount ?? 0),
      matched_queries: c._via,
      relevance: null as string | null,
    }));

    // Relevance notes, grounded only in what the API returned. The model is
    // given the rows and asked to explain them; it is never asked for cases.
    if (results.length && anthropicKey()) {
      const digest = results.map((r) => ({
        cnr: r.cnr,
        court: r.court_name,
        decided: r.decision_date,
        acts: r.acts_and_sections,
        topics: r.topics,
      }));

      const raw = await anthropic(
        'claude-sonnet-5',
        1600,
        `An advocate is researching this matter:

${matter}

Below are real case records returned by a court-records search. For each, write one sentence (max 25 words) on why it may be relevant to the matter, using ONLY the information given for that record.

Rules:
- Do not mention any case, citation, judgment or authority that is not in the list below.
- Do not invent case names, citation numbers, paragraph numbers or holdings.
- If a record looks unrelated to the matter, say so plainly.
- Refer to records only by their cnr.

Records:
${JSON.stringify(digest, null, 1)}

Reply with only a JSON array of {"cnr": "...", "why": "..."}.`,
      );

      if (raw.error) aiError = raw.error;
      const parsed = raw.text ? firstJsonBlock(raw.text) : null;
      if (Array.isArray(parsed)) {
        // Only accept notes whose CNR is one we actually retrieved. Anything
        // the model invented has no matching row and is dropped here.
        const valid = new Map(results.map((r) => [r.cnr, r]));
        for (const item of parsed) {
          const cnr = (item as Row)?.cnr;
          const why = (item as Row)?.why;
          if (typeof cnr === 'string' && typeof why === 'string' && valid.has(cnr)) {
            valid.get(cnr)!.relevance = why.trim().slice(0, 300);
          }
        }
      }
    }

    // 'off'    — no key configured
    // 'failed' — key present but the call was rejected (usually no credit)
    // 'ok'     — the AI layer did its job
    const aiStatus = !anthropicKey() ? 'off' : aiError ? 'failed' : 'ok';
    // Logged so the state is answerable from the function logs rather than by
    // guessing from what the browser happens to be rendering.
    console.log(`[case-research] ai_status=${aiStatus} key_present=${!!anthropicKey()} ai_error=${aiError ?? 'none'}`);

    return json({
      data: {
        queries,
        results,
        ai_status: aiStatus,
        ai_error: aiError,
        ai_queries_used: aiUsed,
      },
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'Precedent search failed. Please try again.' }, 500);
  }
});
