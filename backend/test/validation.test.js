import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, validateData } from '../src/validation.js';

const material = { id: 'ball', name: 'Bola', code: '', unit: 'un', minimum: 2 };
const entry = { id: 'one', materialId: 'ball', date: '2026-11-25', kind: 'entrada', quantity: 5, reference: 'Compra', note: '', createdAt: '2026-11-25T12:00:00.000Z' };

test('valida Kardex e impede saldo negativo em qualquer data', () => {
  const current = { ...emptyData(), materials: [material], movements: [entry] };
  assert.deepEqual(validateData(current, emptyData()), current);
  const negative = { ...current, movements: [entry, { ...entry, id: 'two', kind: 'saida', quantity: 6 }] };
  assert.throws(() => validateData(negative, current), /saldo negativo/);
});

test('impede apagar e alterar movimentações existentes', () => {
  const current = { ...emptyData(), materials: [material], movements: [entry] };
  assert.throws(() => validateData({ ...current, movements: [] }, current), /removidos/);
  assert.throws(() => validateData({ ...current, movements: [{ ...entry, quantity: 10 }] }, current), /não podem ser alterados/);
  assert.doesNotThrow(() => validateData({ ...current, movements: [{ quantity: 5, ...entry }] }, current));
});

test('exige aluno e frequência na aula', () => {
  const data = { ...emptyData(), lessons: [{ id: 'aula', date: '2026-11-25', title: 'Passe', description: 'Treino', category: 'Sub-15', instructorId: '', roster: [{ id: 'aluno', name: 'Aluno' }], attendance: { aluno: 'presente' } }] };
  assert.throws(() => validateData(data, emptyData()), /aluno inválido/);
});
