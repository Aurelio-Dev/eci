import { createConnection } from 'mysql2/promise';
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { connectionOptions, databaseName, pool } from './db.js';
import { migrateUsers } from './user-migration.js';

const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const connection = await createConnection(connectionOptions);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL
  ) ENGINE=InnoDB`);
  await migrateUsers(pool);
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_sessions (
    token_hash CHAR(64) PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES eci_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_revision (
    id TINYINT PRIMARY KEY, version BIGINT UNSIGNED NOT NULL
  ) ENGINE=InnoDB`);
  await pool.query('INSERT IGNORE INTO eci_revision (id, version) VALUES (1, 0)');
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_records (
    kind VARCHAR(20) NOT NULL, id VARCHAR(100) NOT NULL, payload JSON NOT NULL,
    PRIMARY KEY (kind, id)
  ) ENGINE=InnoDB`);
  const [users] = await pool.query('SELECT COUNT(*) AS total FROM eci_users');
  if (users[0].total) console.log('Banco preparado. Usuário existente preservado.');
  else {
    const username = (process.env.ECI_SETUP_USERNAME || await rl.question('Usuário administrador: ')).trim();
    const password = process.env.ECI_SETUP_PASSWORD || await rl.question('Senha inicial (mínimo 12 caracteres; ela ficará visível na digitação): ');
    if (!username || username.length > 100 || password.length < 12 || password.length > 512) throw new Error('Informe usuário de até 100 caracteres e senha de 12 a 512 caracteres.');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    await pool.execute('INSERT INTO eci_users (username, password_hash, role) VALUES (?, ?, ?)', [username, `${salt}:${hash}`, 'admin']);
    console.log('Administrador criado.');
  }
} catch (error) {
  console.error('Falha na configuração:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
