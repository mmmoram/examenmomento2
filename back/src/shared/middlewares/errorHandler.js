const env = require('../config/env');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';

  if (!err.isOperational && env.nodeEnv === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
