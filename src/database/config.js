require('dotenv').config();
module.exports = {
  development: {
    username: 'postgres',
    password: 'postgres',
    database: 'wood-local',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  test: {
    username: 'ilia',
    password: 'iliapassword',
    database: 'wood-local',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    host: process.env.POSTGRES_HOST,
    dialect: 'postgres',
  },
};
