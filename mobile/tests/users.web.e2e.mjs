import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.ECI_WEB_URL || 'http://localhost:5502';
const executablePath = process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const empty = { materials: [], movements: [], students: [], collaborators: [], lessons: [] };
let role = 'admin';
let users = [{ id:'1', username:'gestor', role:'admin', active:true }];
let nextId = 2;
try {
  const page = await browser.newPage({ viewport:{ width:1280, height:800 } });
  await page.route('**/api/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const body = request.postDataJSON();
    const headers = { 'Access-Control-Allow-Origin':base, 'Access-Control-Allow-Credentials':'true', 'Access-Control-Allow-Headers':'content-type,x-eci-request', 'Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,OPTIONS' };
    if (request.method()==='OPTIONS') return route.fulfill({status:204,headers});
    let response = {};
    if (url.pathname==='/api/session') response = {usuario:'gestor',perfil:role,entradaEm:''};
    else if (url.pathname==='/api/data') response = {version:0,data:empty};
    else if (url.pathname==='/api/users' && request.method()==='GET') response = users;
    else if (url.pathname==='/api/users' && request.method()==='POST') { users.push({id:String(nextId++),username:body.username,role:body.role,active:true}); response={}; }
    else if (/\/active$/.test(url.pathname)) { const user=users.find(u=>u.id===url.pathname.split('/')[3]); user.active=body.active; response={}; }
    return route.fulfill({status:200,headers,json:response});
  });
  await page.goto(base+'/admin.html');
  await page.getByRole('heading',{name:'Almoxarifado'}).waitFor();
  await page.getByRole('button',{name:/Usuários/}).click();
  await page.getByRole('heading',{name:'Cadastrar usuário'}).waitFor();
  await page.getByLabel('Nome de acesso').fill('operador');
  await page.getByLabel('Senha inicial').fill('senha-inicial-aleatoria');
  await page.getByRole('button',{name:'Criar usuário'}).click();
  await page.getByRole('heading',{name:'operador'}).waitFor();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('article').filter({hasText:'operador'}).getByRole('button',{name:'Desativar'}).click();
  await page.locator('article').filter({hasText:'operador'}).getByText('Inativo').waitFor();
  await page.locator('article').filter({hasText:'operador'}).getByRole('button',{name:'Redefinir senha'}).click();
  await page.getByLabel('Nova senha').fill('senha-nova-aleatoria');
  await page.getByRole('button',{name:'Redefinir senha',exact:true}).last().click();
  await page.getByText('Senha redefinida. As sessões foram encerradas.').waitFor();
  role='operator'; await page.reload();
  await page.getByRole('heading',{name:'Almoxarifado'}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Usuários/}).count(),0);
  for(const label of ['Almoxarifado','Diário de classe','Cadastros']) await page.getByRole('button',{name:new RegExp(label)}).click();
  console.log('Web: cadastro, estado, redefinição e navegação por perfil passaram (API simulada).');
} finally { await browser.close(); }
