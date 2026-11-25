import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createConnection } from 'mysql2/promise';
import { connectionOptions, pool } from '../src/db.js';

test('setup cria administrador e preserva instalação existente', { skip: process.env.ECI_RUN_DB_TESTS !== '1' }, async () => {
  const name = `eci_test_${randomBytes(6).toString('hex')}`;
  const username = `teste_${randomBytes(6).toString('hex')}`;
  const password = randomBytes(24).toString('base64url');
  const root = await createConnection(connectionOptions);
  let created = false, db;
  try {
    await root.query(`CREATE DATABASE \`${name}\``);
    created = true;
    const runSetup = () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['src/setup.js'], {
        env: { ...process.env, DB_NAME: name, ECI_SETUP_USERNAME: username, ECI_SETUP_PASSWORD: password },
        stdio: 'ignore',
      });
      child.once('error', reject);
      child.once('close', resolve);
    });
    assert.equal(await runSetup(), 0);
    db = await createConnection({ ...connectionOptions, database: name });
    const [users] = await db.query('SELECT username, role, active FROM eci_users');
    assert.deepEqual(users.map(({ username, role, active }) => ({ username, role, active })), [{ username, role: 'admin', active: 1 }]);
    await db.query('UPDATE eci_revision SET version=7 WHERE id=1');
    assert.equal(await runSetup(), 0);
    const [revision] = await db.query('SELECT version FROM eci_revision WHERE id=1');
    assert.equal(revision[0].version, 7);
    const [count] = await db.query('SELECT COUNT(*) AS total FROM eci_users');
    assert.equal(count[0].total, 1);
  } finally {
    if (db) await db.end();
    if (created) await root.query(`DROP DATABASE \`${name}\``);
    await root.end();
    await pool.end();
  }
});
