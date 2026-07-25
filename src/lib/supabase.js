import { createClient } from '@supabase/supabase-js';

// Same project as the original app/js/config.js — frontend-safe publishable key.
const SUPABASE_URL = 'https://nudqpyxxjyxsbuxtlkrd.supabase.co';
const SUPABASE_ANON = 'sb_publishable_q48wl2upaPOJVMxmuYmFQw_F1q_zEtj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
