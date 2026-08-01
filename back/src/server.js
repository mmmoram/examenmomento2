const app = require('./app');
const env = require('./shared/config/env');
const { connectRelationalDb } = require('./shared/config/database');

async function start() {
  try {
    await connectRelationalDb();
    console.log('Conexión a la base de datos ');

    app.listen(env.port, () => {
      console.log(`Backend de polizas escuchando en el puerto ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
