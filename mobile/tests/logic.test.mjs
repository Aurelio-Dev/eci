import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validContact, contactForm, localTarget } from '../src/lib/logic.ts';
import { emptyAdminData, recordMovement, kardex, createLesson, setAttendance, attendanceCounts } from '../src/lib/adminData.ts';

const pages = JSON.parse(readFileSync(new URL('../src/data/webPages.json', import.meta.url), 'utf8'));
const originalPlaceholders = new Set(['SUA_IMAGEM_AQUI.png', 'camisa-titular.png', 'camisa-reserva.png', 'caneca.png']);
function nodes(page) {
  const found = [];
  const walk = node => {
    if (typeof node === 'string') return;
    found.push(node);
    node.children.forEach(walk);
  };
  page.body.forEach(walk);
  return found;
}

test('contato valida e serializa os campos enviados ao FormSubmit', () => {
  const values = { name: ' Aurelio ', email: 'aurelio@example.com', subject: 'Inscrição na base', message: 'Olá!' };
  assert.equal(validContact(values), true);
  assert.equal(validContact({ ...values, email: 'inválido' }), false);
  assert.equal(validContact({ ...values, message: ' ' }), false);
  const form = contactForm(values);
  assert.equal(form.get('Nome'), 'Aurelio');
  assert.equal(form.get('Assunto'), 'Inscrição na base');
  assert.equal(form.get('Mensagem'), 'Olá!');
  assert.equal(form.get('_captcha'), 'false');
});

test('rotas antigas mantêm o destino e a âncora', () => {
  assert.deepEqual(localTarget('index.html#contact'), { slug: 'index', section: 'contact' });
  assert.deepEqual(localTarget('diretoria.html'), { slug: 'diretoria', section: undefined });
  assert.deepEqual(localTarget('#topo', 'elenco'), { slug: 'elenco', section: 'topo' });
});

test('filtro do elenco troca a categoria sem misturar atletas', () => {
  const categories = nodes(pages.elenco).filter(node => node.props.className?.includes('elenco-categoria'));
  assert.deepEqual(categories.map(node => node.props.id), ['sub15', 'sub17', 'sub20']);
  assert.ok(categories[0].children.length > 0);
  assert.ok(categories[1].children.length > 0);
});

test('Kardex calcula saldo cronológico e bloqueia saída sem estoque', () => {
  let data = { ...emptyAdminData(), materials: [{ id: 'bola', name: 'Bola de campo', code: 'ECI-01', unit: 'un', minimum: 3 }] };
  const movement = (id, date, kind, quantity) => ({ id, materialId: 'bola', date, kind, quantity, reference: 'Treino da base', note: '', createdAt: `2026-11-18T12:00:0${id}Z` });
  data = recordMovement(data, movement('1', '2026-11-17', 'entrada', 10));
  data = recordMovement(data, movement('2', '2026-11-18', 'saida', 4));
  assert.deepEqual(kardex('bola', data.movements).map(row => row.balance), [10, 6]);
  assert.throws(() => recordMovement(data, { ...movement('5', '2026-11-18', 'entrada', 1), reference: '' }), /referência/);
  assert.throws(() => recordMovement(data, movement('3', '2026-11-16', 'saida', 1)), /saldo negativo/);
  assert.throws(() => recordMovement(data, movement('4', '2026-11-18', 'saida', 7)), /saldo negativo/);
});

test('aula exige descrição e alunos da categoria e preserva frequência individual', () => {
  const students = [
    { id: 'a', name: 'Atleta A', category: 'Sub-15', active: true },
    { id: 'b', name: 'Atleta B', category: 'Sub-15', active: true },
    { id: 'c', name: 'Atleta C', category: 'Sub-17', active: true },
  ];
  const data = { ...emptyAdminData(), students };
  const input = { id: 'aula', date: '2026-11-18', title: 'Passe e domínio', description: 'Circuito com condução e passe.', category: 'Sub-15', instructorId: '' };
  assert.throws(() => createLesson(data, { ...input, description: '' }), /descrição/);
  assert.throws(() => createLesson(data, { ...input, category: 'Sub-20' }), /Cadastre ao menos um aluno/);
  const lesson = createLesson(data, input);
  assert.deepEqual(lesson.roster.map(student => student.id), ['a', 'b']);
  const updated = setAttendance({ ...data, lessons: [lesson] }, 'aula', 'a', 'presente');
  assert.deepEqual(attendanceCounts(updated.lessons[0]), { pendente: 1, presente: 1, ausente: 0, justificada: 0 });
  assert.equal(updated.lessons[0].attendance.b, 'pendente');
});

test('todas as páginas públicas, imagens e links locais foram migrados', () => {
  for (const name of ['index', 'diretoria', 'governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'elenco', 'loja', '404', 'index2', 'index3']) {
    assert.ok(pages[name]?.body.length > 0, `${name} sem conteúdo`);
  }
  for (const [slug, page] of Object.entries(pages)) {
    const tree = nodes(page);
    for (const node of tree) {
      const src = node.props.src;
      if (node.tag === 'img' && src?.startsWith('/img/') && !originalPlaceholders.has(src.split('/').pop())) assert.ok(existsSync(resolve('assets/images', src.slice(5))), `${slug}: ${src}`);
      const href = node.props.href;
      if (node.tag !== 'a' || !href || /^(https?:|mailto:|tel:|#)/.test(href)) continue;
      if (href.startsWith('/img/')) assert.ok(existsSync(resolve('assets/images', href.slice(5))));
      else if (href.endsWith('.pdf') || href.endsWith('.docx')) assert.ok(existsSync(resolve('assets/documents', decodeURIComponent(href.slice(1)))));
      else {
        const target = localTarget(href.replace(/^\//, ''), slug);
        assert.ok(pages[target.slug], `${slug}: rota ${href} ausente`);
        if (target.section) assert.ok(nodes(pages[target.slug]).some(n => n.props.id === target.section), `${slug}: âncora ${href} ausente`);
      }
    }
  }
  assert.ok(!JSON.stringify(pages.index.body).includes('BOTÕES COM O MESMO TAMANHO E MAIORES'));
});
