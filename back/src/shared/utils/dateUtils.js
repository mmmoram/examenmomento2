function startOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date, dias) {
  const result = new Date(date);
  result.setDate(result.getDate() + dias);
  return result;
}

function esFinDeSemana(date) {
  const dia = new Date(date).getDay();
  return dia === 0 || dia === 6;
}

module.exports = { startOfDay, addDays, esFinDeSemana };
