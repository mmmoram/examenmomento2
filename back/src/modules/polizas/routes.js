const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const AppError = require('../../shared/utils/AppError');
const { ClienteModel, PolizaModel } = require('./models');
const {
  ESTADOS_POLIZA,
  BONIFICACION_RENOVACION,
  calcular,
  calcularCancelacionAnticipada,
  evaluarBonificacionRenovacion,
  estaVencida,
  presentarPoliza,
} = require('./calculo');

const router = Router();

function validar(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return next(new AppError(errores.array({ onlyFirstError: true })[0].msg, 400));
  }
  next();
}

const capitalYPlazoValidators = [
  body('capital')
    .isFloat({ min: 500 })
    .withMessage('El capital debe ser un número mayor o igual a 500')
    .toFloat(),
  body('plazoDias')
    .isInt({ min: 30, max: 720 })
    .withMessage('El plazo debe ser un número entero entre 30 y 720 días')
    .toInt(),
];


// Clientes


router.post(
  '/clientes',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('documento').trim().notEmpty().withMessage('El documento de identidad es obligatorio'),
    body('email').optional({ nullable: true }).isEmail().withMessage('El email no es válido'),
    body('telefono').optional({ nullable: true }).trim(),
    body('tieneObligacionesPendientes').optional().isBoolean().toBoolean(),
    validar,
  ],
  async (req, res, next) => {
    try {
      const { nombre, documento, email, telefono, tieneObligacionesPendientes } = req.body;
      const existente = await ClienteModel.findOne({ where: { documento } });
      if (existente) {
        throw new AppError('Ya existe un cliente registrado con ese documento', 409);
      }
      const cliente = await ClienteModel.create({
        nombre,
        documento,
        email,
        telefono,
        tieneObligacionesPendientes,
      });
      res.status(201).json({ cliente });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/clientes', async (req, res, next) => {
  try {
    const clientes = await ClienteModel.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ clientes });
  } catch (err) {
    next(err);
  }
});

router.get('/clientes/:id', async (req, res, next) => {
  try {
    const cliente = await ClienteModel.findByPk(req.params.id, {
      include: [{ model: PolizaModel, as: 'polizas' }],
    });
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }
    const { polizas, ...datosCliente } = cliente.toJSON();
    res.status(200).json({ cliente: { ...datosCliente, polizas: polizas.map(presentarPoliza) } });
  } catch (err) {
    next(err);
  }
});


// POlizas


router.post('/polizas/simular', [...capitalYPlazoValidators, validar], (req, res, next) => {
  try {
    const { capital, plazoDias } = req.body;
    res.status(200).json({ simulacion: calcular({ capital, plazoDias }) });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/polizas',
  [body('clienteId').notEmpty().withMessage('Debe indicar el cliente'), ...capitalYPlazoValidators, validar],
  async (req, res, next) => {
    try {
      const { clienteId, capital, plazoDias } = req.body;
      const cliente = await ClienteModel.findByPk(clienteId);
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      const resultado = calcular({ capital, plazoDias });
      const poliza = await PolizaModel.create({
        clienteId,
        capital,
        plazoDias,
        ...resultado,
        estado: ESTADOS_POLIZA.ACTIVA,
      });
      res.status(201).json({ poliza: presentarPoliza(poliza) });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/polizas', async (req, res, next) => {
  try {
    const polizas = await PolizaModel.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ polizas: polizas.map(presentarPoliza) });
  } catch (err) {
    next(err);
  }
});

router.get('/polizas/:id', async (req, res, next) => {
  try {
    const poliza = await PolizaModel.findByPk(req.params.id);
    if (!poliza) {
      throw new AppError('Póliza no encontrada', 404);
    }
    res.status(200).json({ poliza: presentarPoliza(poliza) });
  } catch (err) {
    next(err);
  }
});

router.post('/polizas/:id/cancelar', async (req, res, next) => {
  try {
    const poliza = await PolizaModel.findByPk(req.params.id);
    if (!poliza) {
      throw new AppError('Póliza no encontrada', 404);
    }
    if (poliza.estado !== ESTADOS_POLIZA.ACTIVA) {
      throw new AppError('Solo se pueden cancelar pólizas activas', 400);
    }
    const fecha = new Date();
    if (estaVencida(poliza, fecha)) {
      throw new AppError('La póliza ya está vencida, no aplica cancelación anticipada', 400);
    }

    const diasTranscurridos = Math.max(0, Math.floor((fecha - new Date(poliza.fechaInicio)) / 86400000));
    const detalle = calcularCancelacionAnticipada({ capital: Number(poliza.capital), diasTranscurridos });

    poliza.estado = ESTADOS_POLIZA.CANCELADA;
    await poliza.save();

    res.status(200).json({ poliza: presentarPoliza(poliza), diasTranscurridos, ...detalle });
  } catch (err) {
    next(err);
  }
});

router.post('/polizas/:id/renovar', [...capitalYPlazoValidators, validar], async (req, res, next) => {
  try {
    const { capital, plazoDias } = req.body;
    const fecha = new Date();

    const polizaAnterior = await PolizaModel.findByPk(req.params.id);
    if (!polizaAnterior) {
      throw new AppError('Póliza a renovar no encontrada', 404);
    }
    if (!estaVencida(polizaAnterior, fecha)) {
      throw new AppError('Solo se pueden renovar pólizas vencidas', 400);
    }

    const cliente = await ClienteModel.findByPk(polizaAnterior.clienteId);
    const aplicaBonificacion = evaluarBonificacionRenovacion({
      polizaAnterior,
      nuevoCapital: capital,
      fechaRenovacion: fecha,
      clienteTieneObligacionesPendientes: cliente.tieneObligacionesPendientes,
    });
    const bonificacionRenovacion = aplicaBonificacion ? BONIFICACION_RENOVACION : 0;

    const resultado = calcular({ capital, plazoDias, fechaInicio: fecha, bonificacionRenovacion });
    const polizaNueva = await PolizaModel.create({
      clienteId: polizaAnterior.clienteId,
      capital,
      plazoDias,
      ...resultado,
      estado: ESTADOS_POLIZA.ACTIVA,
      polizaAnteriorId: polizaAnterior.id,
    });

    polizaAnterior.estado = ESTADOS_POLIZA.RENOVADA;
    await polizaAnterior.save();

    res.status(201).json({ poliza: presentarPoliza(polizaNueva), bonificacionAplicada: aplicaBonificacion });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
