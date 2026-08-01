const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/config/database');
const { ESTADOS_POLIZA } = require('./calculo');

const ClienteModel = sequelize.define(
  'Cliente',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    documento: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    tieneObligacionesPendientes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'clientes', timestamps: true, updatedAt: false }
);

const PolizaModel = sequelize.define(
  'Poliza',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clienteId: { type: DataTypes.UUID, allowNull: false },
    capital: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    plazoDias: { type: DataTypes.INTEGER, allowNull: false },
    tasaBase: { type: DataTypes.DECIMAL(6, 4), allowNull: false },
    bonificacionMonto: { type: DataTypes.DECIMAL(6, 4), allowNull: false },
    bonificacionRenovacion: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    tasaAplicada: { type: DataTypes.DECIMAL(6, 4), allowNull: false },
    interesBruto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    valorRetencion: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    interesNeto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    montoVencimiento: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    rentabilidadPeriodo: { type: DataTypes.DECIMAL(6, 3), allowNull: false },
    fechaInicio: { type: DataTypes.DATE, allowNull: false },
    fechaVencimiento: { type: DataTypes.DATE, allowNull: false },
    estado: {
      type: DataTypes.ENUM(ESTADOS_POLIZA.ACTIVA, ESTADOS_POLIZA.CANCELADA, ESTADOS_POLIZA.RENOVADA),
      allowNull: false,
      defaultValue: ESTADOS_POLIZA.ACTIVA,
    },
    polizaAnteriorId: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: 'polizas', timestamps: true, updatedAt: false, indexes: [{ fields: ['clienteId'] }] }
);

PolizaModel.belongsTo(ClienteModel, { foreignKey: 'clienteId', as: 'cliente' });
ClienteModel.hasMany(PolizaModel, { foreignKey: 'clienteId', as: 'polizas' });

module.exports = { ClienteModel, PolizaModel };
