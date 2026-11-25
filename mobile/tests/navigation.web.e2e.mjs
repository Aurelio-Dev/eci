import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.ECI_WEB_URL || 'http://localhost:5502';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const pages = ['index', 'diretoria', 'governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'elenco', 'loja', '404', 'index2', 'index3'];
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 } });
  for (const slug of pages) {
    await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    const nav = page.locator('.site-header .site-nav');
    await nav.waitFor();
    const labels = (await nav.locator(':scope > a, :scope > .group > button').allTextContents()).map(text => text.replace(/\s+expand_more\s*/g, '').trim());
    assert.deepEqual(labels, ['Início', 'O Clube', 'Base', 'Projeto Social', 'Loja', 'Contato'], slug);
    assert.equal(await nav.getByRole('link', { name: /^Loja/ }).getAttribute('href'), '/loja.html', slug);
    assert.equal(await nav.getByRole('link', { name: 'Início', exact: true }).getAttribute('href'), slug === 'index' ? '#hero' : '/index.html#hero', slug);
    await nav.getByText('O Clube', { exact: false }).first().click();
    assert.equal(await page.locator('#dropdown-clube').isVisible(), true, slug);
    assert.equal(await page.locator('#dropdown-clube a[href="/transparencia.html"]').count(), 1, slug);
    await page.keyboard.press('Escape');
    await page.locator('.site-header .site-cta').click();
    assert.equal(await page.locator('#apoie-modal').getAttribute('aria-hidden'), 'false', slug);
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of pages) {
    await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('body[data-eci-hydrated="true"]').waitFor();
    await page.locator('[data-mobile-menu-button]').click();
    await page.locator('[data-mobile-menu].is-open').waitFor();
    const nav = page.locator('[data-mobile-menu]');
    await nav.getByRole('link', { name: /^Loja/ }).waitFor();
    assert.equal(await nav.getByRole('link', { name: /^Loja/ }).count(), 1, slug);
    assert.equal(await nav.getByRole('link', { name: /^Loja/ }).getAttribute('href'), '/loja.html', slug);
    await nav.getByRole('link', { name: 'Apoie o Clube' }).click();
    assert.equal(await page.locator('#apoie-modal').getAttribute('aria-hidden'), 'false', slug);
  }
  await page.goto(`${base}/transparencia.html`);
  await page.locator('body[data-eci-hydrated="true"]').waitFor();
  await page.locator('[data-mobile-menu-button]').click();
  await page.locator('[data-mobile-menu].is-open').waitFor();
  await page.locator('[data-mobile-menu]').getByRole('link', { name: /^Loja/ }).click();
  await page.waitForURL(/loja\.html$/);
  console.log('Menus públicos verificados em 15 páginas, desktop e celular.');
} finally { await browser.close(); }
