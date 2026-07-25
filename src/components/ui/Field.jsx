const baseInput =
  'w-full rounded-lg border border-ink-100 px-3.5 py-2.5 text-[14.5px] text-ink-900 placeholder:text-ink-300 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

export function Label({ children, required, hint }) {
  return (
    <label className="mt-4 mb-1.5 block text-[12.5px] font-bold text-ink-700 first:mt-0">
      {children} {required && <span className="text-coral-500">*</span>}
      {hint && <span className="ml-1 font-normal text-ink-300">{hint}</span>}
    </label>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`${baseInput} ${className}`} {...props} />;
}

export function Textarea({ className = '', rows = 4, ...props }) {
  return <textarea rows={rows} className={`${baseInput} resize-y ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${baseInput} bg-white ${className}`} {...props}>
      {children}
    </select>
  );
}

const colClasses = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };

export function FormRow({ children, cols = 2 }) {
  return <div className={`grid grid-cols-1 gap-3.5 ${colClasses[cols] || colClasses[2]}`}>{children}</div>;
}
