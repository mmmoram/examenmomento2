const { Sequelize } = require('sequelize');
const { Client } = require('pg');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.nodeEnv === 'development' ? console.log : false,
});

async function ensureDatabaseExists() {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.name]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${env.db.name}"`);
    }
  } finally {
    await client.end();
  }
}

async function connectRelationalDb() {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  if (env.nodeEnv === 'development') {
    await sequelize.sync();
  }
}

module.exports = { sequelize, connectRelationalDb };
