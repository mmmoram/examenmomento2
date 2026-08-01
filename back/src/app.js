const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./shared/config/env');
const { notFoundHandler, errorHandler } = require('./shared/middlewares/errorHandler');
const polizasRoutes = require('./modules/polizas/routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'cooperativa-polizas-backend' });
});

app.use('/api', polizasRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
