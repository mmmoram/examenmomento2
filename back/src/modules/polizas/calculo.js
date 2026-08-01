const AppError = require('../../shared/utils/AppError');
const { addDays, esFinDeSemana } = require('../../shared/utils/dateUtils');

const ESTADOS_POLIZA = {
  ACTIVA: 'ACTIVA',
  CANCELADA: 'CANCELADA',
  RENOVADA: 'RENOVADA',
  VENCIDA: 'VENCIDA',
};

const CAPITAL_MINIMO = 500;
const PLAZO_MINIMO_DIAS = 30;
const PLAZO_MAXIMO_DIAS = 720;
const BASE_ANUAL_DIAS = 360;
const TASA_MAXIMA = 0.08;
const RETENCION_PORCENTAJE = 0.02;
const BONIFICACION_RENOVACION = 0.002;
const DIAS_GRACIA_RENOVACION = 5;

const TASAS_POR_PLAZO = [
  { min: 30, max: 59, tasa: 0.05 },
  { min: 60, max: 89, tasa: 0.055 },
  { min: 90, max: 179, tasa: 0.06 },
  { min: 180, max: 359, tasa: 0.065 },
  { min: 360, max: 539, tasa: 0.07 },
  { min: 540, max: 720, tasa: 0.075 },
];

const BONIFICACIONES_POR_MONTO = [
  { min: 500, max: 4999.99, bonificacion: 0 },
  { min: 5000, max: 9999.99, bonificacion: 0.0015 },
  { min: 10000, max: 24999.99, bonificacion: 0.003 },
  { min: 25000, max: 49999.99, bonificacion: 0.0045 },
  { min: 50000, max: Infinity, bonificacion: 0.006 },
];

function validarCapitalYPlazo(capital, plazoDias) {
  if (!(capital >= CAPITAL_MINIMO)) {
    throw new AppError(`El capital invertido debe ser de al menos USD ${CAPITAL_MINIMO}`, 400);
  }
  if (!(plazoDias >= PLAZO_MINIMO_DIAS && plazoDias <= PLAZO_MAXIMO_DIAS)) {
    throw new AppError(
      `El plazo debe estar entre ${PLAZO_MINIMO_DIAS} y ${PLAZO_MAXIMO_DIAS} días`,
      400
    );
  }
}

function getTasaBase(plazoDias) {
  const rango = TASAS_POR_PLAZO.find((r) => plazoDias >= r.min && plazoDias <= r.max);
  if (!rango) {
    throw new AppError(`No existe una tasa definida para un plazo de ${plazoDias} días`, 400);
  }
  return rango.tasa;
}

function getBonificacionMonto(capital) {
  const rango = BONIFICACIONES_POR_MONTO.find((r) => capital >= r.min && capital <= r.max);
  return rango ? rango.bonificacion : 0;
}

function estaVencida(poliza, fechaReferencia = new Date()) {
  return poliza.estado === ESTADOS_POLIZA.ACTIVA && fechaReferencia > new Date(poliza.fechaVencimiento);
}

/**
 * Evalúa si corresponde la bonificación por renovación según las 4 condiciones del negocio.
 */
function evaluarBonificacionRenovacion({
  polizaAnterior,
  nuevoCapital,
  fechaRenovacion,
  clienteTieneObligacionesPendientes,
}) {
  if (!estaVencida(polizaAnterior, fechaRenovacion)) return false;
  if (!(nuevoCapital >= polizaAnterior.capital)) return false;
  const limiteRenovacion = addDays(polizaAnterior.fechaVencimiento, DIAS_GRACIA_RENOVACION);
  if (fechaRenovacion > limiteRenovacion) return false;
  if (clienteTieneObligacionesPendientes) return false;
  return true;
}

/**
 * Calcula todos los valores derivados de una póliza (simulación o contratación).
 */
function calcular({ capital, plazoDias, fechaInicio = new Date(), bonificacionRenovacion = 0 }) {
  validarCapitalYPlazo(capital, plazoDias);

  const tasaBase = getTasaBase(plazoDias);
  const bonificacionMonto = getBonificacionMonto(capital);
  const tasaFinal = tasaBase + bonificacionMonto + bonificacionRenovacion;
  const tasaAplicada = Math.min(tasaFinal, TASA_MAXIMA);

  const interesBruto = capital * tasaAplicada * (plazoDias / BASE_ANUAL_DIAS);
  const valorRetencion = interesBruto * RETENCION_PORCENTAJE;
  const interesNeto = interesBruto - valorRetencion;
  const montoVencimiento = capital + interesNeto;
  const rentabilidadPeriodo = (interesNeto / capital) * 100;

  const aplicaMensual = plazoDias % 30 === 0 && plazoDias >= 180;
  const numeroMeses = aplicaMensual ? plazoDias / 30 : null;
  const interesMensualEstimado = aplicaMensual ? interesNeto / numeroMeses : null;

  const fechaVencimiento = addDays(fechaInicio, plazoDias);
  const advertenciaDiaNoLaborable = esFinDeSemana(fechaVencimiento);

  return {
    tasaBase,
    bonificacionMonto,
    bonificacionRenovacion,
    tasaFinal,
    tasaAplicada,
    interesBruto,
    valorRetencion,
    interesNeto,
    montoVencimiento,
    rentabilidadPeriodo,
    numeroMeses,
    interesMensualEstimado,
    fechaInicio,
    fechaVencimiento,
    advertenciaDiaNoLaborable,
  };
}

/**
 * Cancelación anticipada: el valor entregado nunca puede ser negativo.
 */
function calcularCancelacionAnticipada({ capital, diasTranscurridos }) {
  const interesCancelacion = capital * 0.01 * (diasTranscurridos / BASE_ANUAL_DIAS);
  const cargoAdministrativo = capital * 0.005;
  const retencion = interesCancelacion * RETENCION_PORCENTAJE;
  const valorCancelacion = Math.max(0, capital + interesCancelacion - retencion - cargoAdministrativo);

  return { interesCancelacion, cargoAdministrativo, retencion, valorCancelacion };
}

/**
 * Serializa una póliza para la respuesta HTTP, mostrando VENCIDA cuando corresponde
 * (estado virtual: no se persiste, se deriva de la fecha de vencimiento).
 */
function presentarPoliza(poliza) {
  const plano = poliza.toJSON ? poliza.toJSON() : poliza;
  return { ...plano, estado: estaVencida(plano) ? ESTADOS_POLIZA.VENCIDA : plano.estado };
}

module.exports = {
  ESTADOS_POLIZA,
  CAPITAL_MINIMO,
  PLAZO_MINIMO_DIAS,
  PLAZO_MAXIMO_DIAS,
  BONIFICACION_RENOVACION,
  calcular,
  calcularCancelacionAnticipada,
  evaluarBonificacionRenovacion,
  estaVencida,
  presentarPoliza,
};
