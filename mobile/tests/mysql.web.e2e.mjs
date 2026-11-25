// Run only against a disposable, empty database configured with these test credentials.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.ECI_WEB_URL || 'http://localhost:5502';
if (process.env.ECI_TEST_DB_IS_DISPOSABLE !== 'yes' || !process.env.ECI_TEST_USER || !process.env.ECI_TEST_PASSWORD) throw new Error('Use banco descartável e defina ECI_TEST_DB_IS_DISPOSABLE, ECI_TEST_USER e ECI_TEST_PASSWORD.');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage();
  if (process.env.ECI_TEST_API) await page.route('http://localhost:3333/api/**', route => route.continue({ url: route.request().url().replace('http://localhost:3333', process.env.ECI_TEST_API) }));
  await page.goto(base + '/login.html');
  await page.locator('#usuario').fill(process.env.ECI_TEST_USER);
  await page.locator('#senha').fill(process.env.ECI_TEST_PASSWORD);
  await page.locator('.login-submit').click();
  await page.waitForURL(/admin\.html$/);
  await page.getByRole('heading', { name: 'Almoxarifado' }).waitFor();
  await page.getByRole('button', { name: 'Cadastrar material' }).click();
  let dialog = page.getByRole('dialog', { name: 'Cadastrar material' });
  await dialog.getByLabel('Nome do material').fill('Bola teste MySQL');
  await dialog.getByRole('button', { name: 'Salvar material' }).click();
  await page.getByRole('heading', { name: 'Bola teste MySQL' }).waitFor();
  await page.getByRole('button', { name: 'Registrar entrada / saída' }).click();
  dialog = page.getByRole('dialog', { name: 'Registrar movimentação' });
  await dialog.getByLabel('Quantidade (un)').fill('10');
  await dialog.getByLabel('Documento / referência').fill('Doação teste');
  await dialog.getByRole('button', { name: 'Lançar no Kardex' }).click();
  await page.getByText('Doação teste', { exact: true }).first().waitFor();
  await page.locator('.admin-nav .eci-nav-button').nth(2).click();
  await page.getByRole('button', { name: 'Cadastrar aluno' }).click();
  dialog = page.getByRole('dialog', { name: 'Cadastrar aluno' });
  await dialog.getByLabel('Nome completo').fill('Atleta teste MySQL');
  await dialog.getByLabel('Responsável').fill('Responsável teste');
  await dialog.getByRole('button', { name: 'Salvar aluno' }).click();
  await page.getByText('Atleta teste MySQL', { exact: true }).waitFor();
  await page.locator('.admin-nav .eci-nav-button').nth(1).click();
  await page.getByRole('button', { name: 'Criar aula' }).click();
  dialog = page.getByRole('dialog', { name: 'Criar aula' });
  await dialog.getByLabel('Título da aula').fill('Treino teste MySQL');
  await dialog.getByLabel('Descrição do trabalho').fill('Passe e domínio');
  await dialog.getByRole('button', { name: 'Criar e lançar frequências' }).click();
  const attendance = page.getByRole('group', { name: 'Frequência de Atleta teste MySQL' });
  await attendance.getByRole('button', { name: 'Presente' }).click();
  await page.getByText('Dados carregados do servidor.').waitFor();
  await page.reload();
  await page.locator('.admin-nav .eci-nav-button').nth(1).click();
  await page.getByRole('heading', { name: 'Treino teste MySQL' }).waitFor();
  assert.equal(await page.getByRole('group', { name: 'Frequência de Atleta teste MySQL' }).getByRole('button', { name: 'Presente' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.waitForURL(/login\.html$/);
  console.log('Painel web: login, material, entrada, aluno, aula, frequência e recarga passaram.');
} finally {
  await browser.close();
}
