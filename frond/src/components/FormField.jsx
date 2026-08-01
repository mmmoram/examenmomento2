export default function FormField({ label, error, className = '', children }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-slate-600">{label}</label>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function inputClass(hasError) {
  return `rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
  }`;
}
