export function formatMoney(n) {
  return `$ ${Number(n).toFixed(2)}`;
}

export function formatPercent(n) {
  return `${(Number(n) * 100).toFixed(2)}%`;
}

export function formatDate(d) {
  return new Date(d).toLocaleDateString('es-EC');
}
