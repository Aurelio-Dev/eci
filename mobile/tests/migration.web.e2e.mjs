// Run only against a disposable, empty database configured with these test credentials.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.ECI_WEB_URL || 'http://localhost:5502';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage();
  const local = { materials: [], movements: [], collaborators: [], lessons: [], students: [{ id: 'legacy', name: 'Aluno antigo', category: 'Sub-15', birthDate: '', guardian: 'Responsável', phone: '', active: true, motherName: 'Removido', fatherName: 'Removido' }] };
  await page.addInitScript(data => localStorage.setItem('eci_admin_operacoes_v1', JSON.stringify(data)), local);
  await page.goto(base + '/login.html');
  await page.locator('#usuario').fill('test-admin');
  await page.locator('#senha').fill('temporary-test-password');
  await page.locator('.login-submit').click();
  await page.waitForURL(/admin\.html$/);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Importar registros locais' }).click();
  await page.getByText('Dados carregados do servidor.').waitFor();
  await page.locator('.admin-nav .eci-nav-button').nth(2).click();
  await page.getByText('Aluno antigo', { exact: true }).waitFor();
  const snapshot = await page.evaluate(async () => {
    const response = await fetch('http://localhost:3333/api/data', { credentials: 'include', headers: { 'X-ECI-Request': '1' } });
    return response.json();
  });
  assert.equal(snapshot.data.students[0].guardian, 'Responsável');
  assert.equal('motherName' in snapshot.data.students[0], false);
  assert.equal('fatherName' in snapshot.data.students[0], false);
  assert.notEqual(await page.evaluate(() => localStorage.getItem('eci_admin_operacoes_v1')), null);
  console.log('Importação confirmou registros no MySQL e preservou a cópia local.');
} finally { await browser.close(); }
