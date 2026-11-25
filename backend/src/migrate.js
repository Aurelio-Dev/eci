import { pool } from './db.js';
import { migrateUsers } from './user-migration.js';
try {
  await migrateUsers(pool);
  console.log('Migração de usuários concluída; registros existentes preservados.');
} catch (error) {
  console.error('Falha na migração:', error.message);
  process.exitCode = 1;
} finally { await pool.end(); }
