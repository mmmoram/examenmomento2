const ESTILOS = {
  ACTIVA: 'bg-emerald-100 text-emerald-700',
  VENCIDA: 'bg-amber-100 text-amber-700',
  CANCELADA: 'bg-red-100 text-red-700',
  RENOVADA: 'bg-slate-200 text-slate-600',
};

export default function EstadoBadge({ estado }) {
  const estilo = ESTILOS[estado] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${estilo}`}>{estado}</span>
  );
}
