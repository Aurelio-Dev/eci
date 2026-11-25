import 'dotenv/config';
import mysql from 'mysql2/promise';

export const databaseName = process.env.DB_NAME || 'eci';
if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) throw new Error('DB_NAME inválido.');
export const connectionOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  timezone: 'Z',
};
export const pool = mysql.createPool({ ...connectionOptions, database: databaseName, connectionLimit: 10 });
