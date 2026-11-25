import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createConnection } from 'mysql2/promise';
import { connectionOptions } from '../src/db.js';
import { migrateUsers } from '../src/user-migration.js';

// A base é criada exclusivamente para este teste e nunca usa DB_NAME da aplicação.
test('migração e gestão de usuários com MySQL isolado', { skip: process.env.ECI_RUN_DB_TESTS !== '1', timeout: 60000 }, async () => {
  const name = `eci_test_${randomBytes(6).toString('hex')}`;
  const admin = `admin_${randomBytes(5).toString('hex')}`;
  const pass = randomBytes(24).toString('base64url');
  const newPass = randomBytes(24).toString('base64url');
  const operator = `operador_${randomBytes(5).toString('hex')}`;
  const root = await createConnection(connectionOptions);
  let db, server, created = false;
  try {
    await root.query(`CREATE DATABASE \`${name}\``);
    created = true;
    db = await createConnection({ ...connectionOptions, database: name });
    await db.query('CREATE TABLE eci_users (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, password_hash VARCHAR(200) NOT NULL) ENGINE=InnoDB');
    await db.query('CREATE TABLE eci_sessions (token_hash CHAR(64) PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES eci_users(id) ON DELETE CASCADE) ENGINE=InnoDB');
    await db.query('CREATE TABLE eci_revision (id TINYINT PRIMARY KEY, version BIGINT UNSIGNED NOT NULL) ENGINE=InnoDB');
    await db.query('INSERT INTO eci_revision VALUES (1, 7)');
    await db.query('CREATE TABLE eci_records (kind VARCHAR(20) NOT NULL, id VARCHAR(100) NOT NULL, payload JSON NOT NULL, PRIMARY KEY(kind,id)) ENGINE=InnoDB');
    const salt = randomBytes(16).toString('hex');
    await db.execute('INSERT INTO eci_users (username,password_hash) VALUES (?,?)', [admin, `${salt}:${scryptSync(pass,salt,64).toString('hex')}`]);
    const data = { materials: [{id:'m',name:'Bola',code:'',unit:'un',minimum:0}], movements: [{id:'v',materialId:'m',date:'2026-01-01',kind:'entrada',quantity:2,reference:'Compra',note:'',createdAt:'2026-01-01T12:00:00.000Z'}], students: [{id:'s',name:'Aluno',category:'Sub-15',birthDate:'',guardian:'',phone:'',active:true}], collaborators: [{id:'c',name:'Treinador',role:'Treinador',phone:'',email:'',active:true}], lessons: [{id:'l',date:'2026-01-01',title:'Aula',description:'Treino',category:'Sub-15',instructorId:'c',roster:[{id:'s',name:'Aluno'}],attendance:{s:'presente'}}] };
    for (const [kind, rows] of Object.entries(data)) for (const row of rows) await db.execute('INSERT INTO eci_records VALUES (?,?,?)', [kind,row.id,JSON.stringify(row)]);
    await migrateUsers(db); await migrateUsers(db);
    const [migrated] = await db.query('SELECT role,active FROM eci_users');
    assert.equal(migrated[0].role,'admin'); assert.equal(migrated[0].active,1);
    const port = 40000 + Math.floor(Math.random()*20000);
    server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, DB_NAME:name, PORT:String(port), HOST:'127.0.0.1', ALLOWED_ORIGINS:'http://localhost:5502' }, stdio:'ignore' });
    const base = `http://127.0.0.1:${port}`;
    const headers = {'Content-Type':'application/json','X-ECI-Request':'1'};
    const req = (path, method='GET', body, token) => fetch(base+path,{method,headers:{...headers,...(token?{Authorization:`Bearer ${token}`}:{})},...(body === undefined ? {} : {body:JSON.stringify(body)})});
    let online=false;
    for(let i=0;i<100;i++) { try { await req('/api/session'); online=true; break; } catch { await new Promise(resolve => setTimeout(resolve,100)); } }
    assert.ok(online, 'API não iniciou');
    const login = async (username,password) => req('/api/login','POST',{usuario:username,senha:password,native:true});
    assert.equal((await login(admin,randomBytes(16).toString('hex'))).status,401);
    const adminLogin=await login(admin,pass); assert.equal(adminLogin.status,200); const a=await adminLogin.json(); assert.equal(a.perfil,'admin');
    const before = await (await req('/api/data','GET',undefined,a.token)).json(); assert.deepEqual(before.data,data); assert.equal(before.version,7);
    assert.equal((await req('/api/users','POST',{username:operator,password:pass,role:'operator'},a.token)).status,201);
    assert.equal((await req('/api/users','POST',{username:operator,password:pass,role:'operator'},a.token)).status,409);
    assert.equal((await req('/api/users','POST',{username:'x',password:'short',role:'operator'},a.token)).status,400);
    let list=await (await req('/api/users','GET',undefined,a.token)).json();
    assert.ok(list.every(user=>Object.keys(user).sort().join(',')==='active,id,role,username'));
    const op=list.find(user=>user.username===operator), adm=list.find(user=>user.username===admin);
    assert.equal((await req(`/api/users/${adm.id}/active`,'PATCH',{active:false},a.token)).status,409);
    const opLogin=await login(operator,pass); assert.equal(opLogin.status,200); const o=await opLogin.json(); assert.equal(o.perfil,'operator');
    for (const [path,method,body] of [['/api/users','GET'],['/api/users','POST',{username:'other',password:pass,role:'admin'}],[`/api/users/${adm.id}/active`,'PATCH',{active:false}],[`/api/users/${adm.id}/password`,'POST',{password:newPass}]]) assert.equal((await req(path,method,body,o.token)).status,403);
    const snapshot=await (await req('/api/data','GET',undefined,o.token)).json(); assert.deepEqual(snapshot.data,data);
    snapshot.data.materials[0].minimum=1; snapshot.data.students[0].guardian='Responsável'; snapshot.data.lessons[0].attendance.s='ausente';
    assert.equal((await req('/api/data','PUT',snapshot,o.token)).status,200);
    assert.equal((await req(`/api/users/${op.id}/password`,'POST',{password:newPass},a.token)).status,200);
    assert.equal((await req('/api/session','GET',undefined,o.token)).status,401);
    assert.equal((await login(operator,pass)).status,401);
    const o2=await (await login(operator,newPass)).json(); assert.ok(o2.token);
    assert.equal((await req(`/api/users/${op.id}/active`,'PATCH',{active:false},a.token)).status,200);
    assert.equal((await req('/api/data','GET',undefined,o2.token)).status,401);
    assert.equal((await login(operator,newPass)).status,401);
    assert.equal((await req(`/api/users/${op.id}/active`,'PATCH',{active:true},a.token)).status,200);
    assert.equal((await req('/api/session','GET',undefined,o2.token)).status,401);
    assert.equal((await login(operator,newPass)).status,200);
    if (process.env.ECI_RUN_WEB_TESTS === '1') {
      const web = spawn(process.execPath, ['tests/mysql.web.e2e.mjs'], { cwd:'../mobile', env:{ ...process.env, ECI_WEB_URL:'http://localhost:5502', ECI_TEST_API:`http://localhost:${port}`, ECI_TEST_DB_IS_DISPOSABLE:'yes', ECI_TEST_USER:admin, ECI_TEST_PASSWORD:pass }, stdio:'inherit' });
      const exit = await new Promise((resolve,reject) => { web.once('error',reject); web.once('close',resolve); });
      assert.equal(exit,0,'Teste web integrado falhou');
    }
    const other=`admin_${randomBytes(5).toString('hex')}`;
    assert.equal((await req('/api/users','POST',{username:other,password:pass,role:'admin'},a.token)).status,201);
    list=await (await req('/api/users','GET',undefined,a.token)).json(); const otherId=list.find(user=>user.username===other).id;
    const a2=await (await login(other,pass)).json();
    const simultaneous=await Promise.all([req(`/api/users/${adm.id}/active`,'PATCH',{active:false},a2.token),req(`/api/users/${otherId}/active`,'PATCH',{active:false},a.token)]);
    assert.equal(simultaneous.filter(response=>response.status===200).length,1);
    const [remaining]=await db.query("SELECT COUNT(*) AS n FROM eci_users WHERE role='admin' AND active=1"); assert.equal(remaining[0].n,1);
    const [records]=await db.query('SELECT COUNT(*) AS n FROM eci_records'); assert.ok(records[0].n>=5);
  } finally {
    if(server) { server.kill(); await new Promise(resolve => server.once('exit',resolve)); }
    if(db) await db.end();
    if (created) await root.query(`DROP DATABASE \`${name}\``);
    await root.end();
  }
});
