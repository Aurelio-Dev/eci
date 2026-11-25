import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.ECI_WEB_URL || 'http://localhost:5502';
const original = process.env.ECI_ORIGINAL_URL || 'http://localhost:5501';
if (process.env.ECI_TEST_DB_IS_DISPOSABLE !== 'yes' || !process.env.ECI_TEST_USER || !process.env.ECI_TEST_PASSWORD) throw new Error('Use um banco vazio e descartável e defina ECI_TEST_DB_IS_DISPOSABLE=yes, ECI_TEST_USER e ECI_TEST_PASSWORD.');
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = candidates.find(path => fs.existsSync(path));
if (!executablePath) throw new Error('Defina CHROME_PATH para executar o teste visual.');
const browser = await chromium.launch({ executablePath, headless: true });

async function box(page, selector) {
  const value = await page.locator(selector).first().boundingBox();
  assert(value, `Elemento não encontrado: ${selector}`);
  return value;
}

try {
  const context = await browser.newContext({ viewport: { width: 1536, height: 728 }, reducedMotion: 'reduce' });
  if (process.env.ECI_TEST_API) await context.route('http://localhost:3333/api/**', route => route.continue({ url: route.request().url().replace('http://localhost:3333', process.env.ECI_TEST_API) }));
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.hero-title').waitFor();
  assert.match(await page.locator('.hero-title').innerText(), /Esporte Clube/i);
  for (const selector of ['.site-header', '.hero-section', '.history-editorial', '.legends-editorial-section', '.archive-section', '#categories', '#contact', '.novo-footer']) {
    assert.equal(await page.locator(selector).count(), 1, selector);
  }
  assert.equal(await page.locator('.react-admin-entry').getAttribute('href'), '/login.html');
  assert.equal(await page.locator('script[src="https://vlibras.gov.br/app/vlibras-plugin.js"]').count(), 1);
  assert.equal(await page.locator('[vw-access-button]').count(), 1);

  const reference = await context.newPage();
  await reference.goto(`${original}/index.html`, { waitUntil: 'domcontentloaded' });
  await Promise.all([page.evaluate(() => document.fonts.ready), reference.evaluate(() => document.fonts.ready)]);
  for (const selector of ['.site-header', '.hero-section', '.hero-title', '.history-editorial']) {
    const expected = await box(reference, selector);
    const actual = await box(page, selector);
    for (const key of ['x', 'y', 'width', 'height']) {
      assert(Math.abs(expected[key] - actual[key]) < 12, `${selector}.${key}: original ${expected[key]}, React ${actual[key]}`);
    }
  }
  await page.locator('.hero-button-primary').first().click();
  assert.match(await page.locator('#apoie-modal').getAttribute('class'), /is-open/);
  await page.locator('#apoie-modal [title="Copiar chave PIX"]').click();
  await page.getByText('Copiado!').waitFor();
  await page.keyboard.press('Escape');
  assert.doesNotMatch(await page.locator('#apoie-modal').getAttribute('class'), /is-open/);
  await page.locator('.site-nav .group').first().locator('.top-nav-link').click();
  assert.match(await page.locator('#dropdown-clube').getAttribute('class'), /ativo/);
  await page.locator('#dropdown-clube a[href="/diretoria.html"]').click();
  await page.waitForURL(/diretoria\.html$/);
  assert.equal(await page.locator('main').count(), 1);

  for (const slug of ['governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'loja', 'elenco', 'index2', 'index3']) {
    const response = await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, slug);
    assert((await page.locator('body').innerText()).length > 100, slug);
    await reference.goto(`${original}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    await Promise.all([page.evaluate(() => document.fonts.ready), reference.evaluate(() => document.fonts.ready)]);
    const selector = slug === 'loja' ? '.loja-hero' : slug === 'elenco' ? '.elenco-hero' : 'main';
    const expected = await box(reference, selector);
    const actual = await box(page, selector);
    for (const key of ['x', 'y', 'width']) {
      assert(Math.abs(expected[key] - actual[key]) < 12, `${slug} ${selector}.${key}: original ${expected[key]}, React ${actual[key]}`);
    }
  }
  await reference.close();
  await page.goto(`${base}/elenco.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.btn-filtro').nth(1).click();
  assert.equal(await page.locator('#sub17').isVisible(), true);
  assert.equal(await page.locator('#sub15').isVisible(), false);
  assert.equal((await page.request.get(`${base}/codigo_etica.pdf`)).status(), 200);

  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.route('https://formsubmit.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  await page.locator('#contact-name').fill('Pessoa Teste');
  await page.locator('#contact-email').fill('teste@example.com');
  await page.locator('#contact-message').fill('Mensagem de teste automatizado');
  await page.locator('#contact-form button[type="submit"]').click();
  await page.getByText('Mensagem enviada com sucesso! Entraremos em contato em breve.').waitFor();

  await page.goto(`${base}/login.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#usuario').fill(process.env.ECI_TEST_USER);
  await page.locator('#senha').fill('incorreta');
  await page.locator('.login-submit').click();
  await page.getByText(/Usuário ou senha incorretos/).waitFor();
  await page.locator('#senha').fill(process.env.ECI_TEST_PASSWORD);
  await page.locator('.login-submit').click();
  await page.waitForURL(/admin\.html$/);
  await page.getByRole('heading', { name: 'Almoxarifado' }).waitFor();
  assert.equal(await page.locator('.admin-nav .eci-nav-button').count(), 4);
  assert.equal(await page.getByText('Agenda de jogos').count(), 0);
  await page.locator('.admin-nav .eci-nav-button').nth(1).click();
  await page.getByRole('button', { name: 'Criar aula' }).click();
  let dialog = page.getByRole('dialog', { name: 'Criar aula' });
  await dialog.getByLabel('Título da aula').fill('Treino da base');
  await dialog.getByLabel('Descrição do trabalho').fill('Circuito de passe.');
  await dialog.getByRole('button', { name: 'Criar e lançar frequências' }).click();
  await dialog.getByRole('status').getByText(/Cadastre ao menos um aluno/).waitFor();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await page.locator('.admin-nav .eci-nav-button').nth(0).click();
  await page.getByRole('button', { name: 'Cadastrar material' }).click();
  dialog = page.getByRole('dialog', { name: 'Cadastrar material' });
  await dialog.getByLabel('Nome do material').fill('Bola de campo');
  await dialog.getByLabel('Código interno').fill('ECI-BOL-01');
  await dialog.getByLabel('Estoque mínimo').fill('5');
  await dialog.getByRole('button', { name: 'Salvar material' }).click();
  await page.getByRole('heading', { name: 'Bola de campo' }).waitFor();
  await page.getByRole('button', { name: 'Registrar entrada / saída' }).click();
  dialog = page.getByRole('dialog', { name: 'Registrar movimentação' });
  await dialog.getByLabel('Quantidade (un)').fill('12');
  await dialog.getByLabel('Documento / referência').fill('NF 123');
  await dialog.getByRole('button', { name: 'Lançar no Kardex' }).click();
  await page.getByText('NF 123').waitFor();
  await page.getByRole('button', { name: 'Registrar entrada / saída' }).click();
  dialog = page.getByRole('dialog', { name: 'Registrar movimentação' });
  await dialog.getByLabel('Tipo').selectOption('saida');
  await dialog.getByLabel('Quantidade (un)').fill('4');
  await dialog.getByLabel('Documento / referência').fill('Treino Sub-15');
  await dialog.getByRole('button', { name: 'Lançar no Kardex' }).click();
  assert.match(await page.locator('.eci-balance-strip').innerText(), /8\s+un/);
  await page.getByRole('button', { name: 'Registrar entrada / saída' }).click();
  dialog = page.getByRole('dialog', { name: 'Registrar movimentação' });
  await dialog.getByLabel('Tipo').selectOption('saida');
  await dialog.getByLabel('Quantidade (un)').fill('9');
  await dialog.getByLabel('Documento / referência').fill('Retirada excedente');
  await dialog.getByRole('button', { name: 'Lançar no Kardex' }).click();
  await dialog.getByRole('status').getByText(/saldo negativo/).waitFor();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();

  await page.locator('.admin-nav .eci-nav-button').nth(2).click();
  await page.getByRole('heading', { name: 'Cadastros' }).waitFor();
  for (const name of ['Atleta A', 'Atleta B']) {
    await page.getByRole('button', { name: 'Cadastrar aluno' }).click();
    dialog = page.getByRole('dialog', { name: 'Cadastrar aluno' });
    await dialog.getByLabel('Nome completo').fill(name);
    await dialog.getByRole('button', { name: 'Salvar aluno' }).click();
  }
  await page.getByRole('tab', { name: /Colaboradores/ }).click();
  await page.getByRole('button', { name: 'Cadastrar colaborador' }).click();
  dialog = page.getByRole('dialog', { name: 'Cadastrar colaborador' });
  await dialog.getByLabel('Nome completo').fill('Treinadora da base');
  await dialog.getByLabel('Função no clube').fill('Treinadora Sub-15');
  await dialog.getByRole('button', { name: 'Salvar colaborador' }).click();
  await page.locator('.admin-nav .eci-nav-button').nth(1).click();
  await page.getByRole('button', { name: 'Criar aula' }).click();
  dialog = page.getByRole('dialog', { name: 'Criar aula' });
  await dialog.getByLabel('Título da aula').fill('Passe e domínio');
  await dialog.getByLabel('Descrição do trabalho').fill('Circuito de condução e passe com os atletas da base.');
  await dialog.getByLabel('Colaborador responsável').selectOption({ label: 'Treinadora da base · Treinadora Sub-15' });
  await dialog.getByRole('button', { name: 'Criar e lançar frequências' }).click();
  await page.getByRole('group', { name: 'Frequência de Atleta A' }).getByRole('button', { name: 'Presente' }).click();
  await page.getByRole('group', { name: 'Frequência de Atleta B' }).getByRole('button', { name: 'Ausente' }).click();
  assert.equal(await page.getByRole('group', { name: 'Frequência de Atleta A' }).getByRole('button', { name: 'Presente' }).getAttribute('aria-pressed'), 'true');
  await page.getByText('Dados carregados do servidor.').waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.admin-nav .eci-nav-button').nth(1).click();
  await page.getByRole('heading', { name: 'Passe e domínio' }).waitFor();
  assert.equal(await page.getByRole('group', { name: 'Frequência de Atleta B' }).getByRole('button', { name: 'Ausente' }).getAttribute('aria-pressed'), 'true');
  await page.locator('.admin-nav .eci-nav-button').nth(2).click();
  await page.locator('.eci-person-row').filter({ hasText: 'Atleta A' }).getByRole('button', { name: 'Arquivar' }).click();
  await page.locator('.admin-nav .eci-nav-button').nth(1).click();
  assert.equal(await page.getByRole('group', { name: 'Frequência de Atleta A' }).count(), 1);
  await page.getByRole('button', { name: 'Criar aula' }).click();
  dialog = page.getByRole('dialog', { name: 'Criar aula' });
  await dialog.getByLabel('Título da aula').fill('Finalização');
  await dialog.getByLabel('Descrição do trabalho').fill('Exercícios de chute ao gol.');
  await dialog.getByRole('button', { name: 'Criar e lançar frequências' }).click();
  assert.equal(await page.getByRole('group', { name: 'Frequência de Atleta A' }).count(), 0);
  assert.equal(await page.getByRole('group', { name: 'Frequência de Atleta B' }).count(), 1);
  await page.locator('.admin-nav .eci-nav-button').nth(0).click();
  assert.match(await page.locator('.eci-balance-strip').innerText(), /8\s+un/);
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.waitForURL(/login\.html$/);

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (process.env.ECI_TEST_API) await mobile.route('http://localhost:3333/api/**', route => route.continue({ url: route.request().url().replace('http://localhost:3333', process.env.ECI_TEST_API) }));
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(() => document.fonts.ready);
  const mobileHeroFits = await mobilePage.evaluate(() => {
    const heading = document.querySelector('.hero-title span');
    const range = document.createRange();
    range.selectNodeContents(heading);
    return range.getBoundingClientRect().right < window.innerWidth - 5;
  });
  assert(mobileHeroFits, 'O título do hero deve caber na largura móvel.');
  assert.equal(await mobilePage.locator('.hero-actions').evaluate(node => getComputedStyle(node).display), 'grid');
  await mobilePage.locator('[data-mobile-menu-button]').click();
  assert.match(await mobilePage.locator('[data-mobile-menu]').getAttribute('class'), /is-open/);
  assert.equal(await mobilePage.locator('[data-mobile-menu] a[href="/login.html"]').count(), 1);
  await mobilePage.locator('[data-mobile-menu] a[href="/login.html"]').click();
  await mobilePage.waitForURL(/login\.html$/);
  await mobilePage.locator('#usuario').fill(process.env.ECI_TEST_USER);
  await mobilePage.locator('#senha').fill(process.env.ECI_TEST_PASSWORD);
  await mobilePage.locator('.login-submit').click();
  await mobilePage.waitForURL(/admin\.html$/);
  await mobilePage.locator('.admin-topbar__menu').click();
  assert.equal(await mobilePage.locator('.admin-nav .eci-nav-button:visible').count(), 4);
  await mobilePage.locator('.admin-nav .eci-nav-button').nth(1).click();
  await mobilePage.getByRole('heading', { name: 'Diário de classe' }).waitFor();
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await mobile.close();
  await context.close();
  console.log('Teste web: visual, navegação, contato, VLibras, Kardex, diário, cadastros e menu móvel passaram.');
} finally {
  await browser.close();
}
