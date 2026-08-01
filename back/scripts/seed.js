const { sequelize } = require('../src/shared/config/database');
const { ClienteModel, PolizaModel } = require('../src/modules/polizas/models');
const {
  ESTADOS_POLIZA,
  calcular,
  evaluarBonificacionRenovacion,
} = require('../src/modules/polizas/calculo');

function haceDias(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
}

async function crearPoliza({ clienteId, capital, plazoDias, fechaInicio, bonificacionRenovacion, polizaAnteriorId }) {
  const resultado = calcular({ capital, plazoDias, fechaInicio, bonificacionRenovacion });
  return PolizaModel.create({
    clienteId,
    capital,
    plazoDias,
    ...resultado,
    estado: ESTADOS_POLIZA.ACTIVA,
    polizaAnteriorId: polizaAnteriorId ?? null,
  });
}

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync();

  await PolizaModel.destroy({ where: {}, truncate: true, cascade: true });
  await ClienteModel.destroy({ where: {}, truncate: true, cascade: true });

  const ana = await ClienteModel.create({ nombre: 'Ana Torres', documento: '1712345678', email: 'ana@example.com', telefono: '0991234567' });
  const luis = await ClienteModel.create({ nombre: 'Luis Andrade', documento: '1798765432', email: 'luis@example.com', telefono: '0987654321' });
  const maria = await ClienteModel.create({
    nombre: 'María Puente',
    documento: '1755556666',
    email: 'maria@example.com',
    telefono: '0999999999',
    tieneObligacionesPendientes: true,
  });

  // 1) Póliza activa normal (Ana)
  await crearPoliza({ clienteId: ana.id, capital: 3000, plazoDias: 90, fechaInicio: haceDias(10) });

  // 2) Póliza activa de mayor monto, con bonificación por monto (Luis)
  await crearPoliza({ clienteId: luis.id, capital: 12000, plazoDias: 180, fechaInicio: haceDias(10) });

  // 3) Póliza vencida sin renovar todavía (María, además con obligaciones pendientes)
  await crearPoliza({ clienteId: maria.id, capital: 6000, plazoDias: 30, fechaInicio: haceDias(32) });

  // 4) Póliza cancelada anticipadamente (Luis)
  const paraCancelar = await crearPoliza({ clienteId: luis.id, capital: 4000, plazoDias: 90, fechaInicio: haceDias(40) });
  paraCancelar.estado = ESTADOS_POLIZA.CANCELADA;
  await paraCancelar.save();

  // 5) Póliza renovada: la anterior vencida hace 3 días (dentro del plazo de gracia) da paso
  //    a una nueva con bonificación por renovación, porque Ana no tiene obligaciones pendientes.
  const anteriorRenovable = await crearPoliza({ clienteId: ana.id, capital: 5000, plazoDias: 30, fechaInicio: haceDias(33) });
  const fechaRenovacion = new Date();
  const aplicaBonificacion = evaluarBonificacionRenovacion({
    polizaAnterior: anteriorRenovable,
    nuevoCapital: 5000,
    fechaRenovacion,
    clienteTieneObligacionesPendientes: ana.tieneObligacionesPendientes,
  });
  await crearPoliza({
    clienteId: ana.id,
    capital: 5000,
    plazoDias: 30,
    fechaInicio: fechaRenovacion,
    bonificacionRenovacion: aplicaBonificacion ? 0.002 : 0,
    polizaAnteriorId: anteriorRenovable.id,
  });
  anteriorRenovable.estado = ESTADOS_POLIZA.RENOVADA;
  await anteriorRenovable.save();

  console.log(
    '3 clientes y 5 pólizas: una activa simple, una activa con bonificación por monto, ' +
      'una vencida sin renovar, una cancelada anticipadamente y un par renovada -> activa.'
  );
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Error al crear datos de prueba:', err);
  process.exit(1);
});
