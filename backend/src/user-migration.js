// DDL no MySQL faz commit implícito. Cada passo é aditivo e retomável.
export async function migrateUsers(db) {
  const [columns] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='eci_users'");
  if (!columns.length) throw new Error('Tabela eci_users não encontrada. Execute setup em uma instalação nova.');
  const names = new Set(columns.map(column => column.COLUMN_NAME));
  // Antes desta migração todos os usuários eram administradores.
  if (!names.has('role')) await db.query("ALTER TABLE eci_users ADD COLUMN role ENUM('admin','operator') NOT NULL DEFAULT 'admin'");
  if (!names.has('active')) await db.query('ALTER TABLE eci_users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE');
  // Inserções futuras sem perfil explícito não devem receber privilégios elevados.
  await db.query("ALTER TABLE eci_users ALTER COLUMN role SET DEFAULT 'operator'");
}
