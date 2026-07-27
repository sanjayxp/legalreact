// Abstract, color-only banner for secondary-page heroes — same visual
// language as the homepage's blob shapes, no stock photography. `colors`
// picks the two brand gradients used; `layout` picks a blob arrangement so
// pages don't all look identical while staying visually consistent.
const LAYOUTS = {
  1: [
    { shape: 'blob-shape', size: 'h-72 w-72', pos: '-left-16 -top-24', opacity: 'opacity-[0.13]' },
    { shape: 'blob-shape-2', size: 'h-64 w-64', pos: '-right-20 bottom-[-3rem]', opacity: 'opacity-[0.11]' },
  ],
  2: [
    { shape: 'blob-shape-2', size: 'h-80 w-80', pos: '-right-24 -top-28', opacity: 'opacity-[0.12]' },
    { shape: 'blob-shape', size: 'h-56 w-56', pos: '-left-12 bottom-[-2.5rem]', opacity: 'opacity-[0.11]' },
  ],
  3: [
    { shape: 'blob-shape', size: 'h-64 w-[26rem]', pos: '-top-16 left-1/4', opacity: 'opacity-[0.10]' },
    { shape: 'blob-shape-2', size: 'h-48 w-48', pos: 'bottom-[-2rem] left-10', opacity: 'opacity-[0.12]' },
    { shape: 'blob-shape', size: 'h-40 w-40', pos: '-right-10 top-1/3', opacity: 'opacity-[0.10]' },
  ],
};

export default function HeroBanner({ colors = ['gradient-brand', 'gradient-sun'], layout = 1 }) {
  const blobs = LAYOUTS[layout] || LAYOUTS[1];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <div key={i} className={`${b.shape} absolute ${b.pos} ${b.size} ${b.opacity} ${colors[i % colors.length]}`} />
      ))}
    </div>
  );
}
