import { z } from 'zod';

const id = z.string().min(1).max(100);
const short = z.string().max(255);
const category = z.enum(['Sub-13', 'Sub-15', 'Sub-17', 'Sub-20']);
const attendance = z.enum(['pendente', 'presente', 'ausente', 'justificada']);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v);
const nonempty = short.refine(v => v.trim().length > 0);
const schema = z.object({
  materials: z.array(z.object({ id, name: nonempty, code: short, unit: nonempty, minimum: z.number().finite().min(0) }).strict()),
  movements: z.array(z.object({ id, materialId: id, date, kind: z.enum(['entrada','saida']), quantity: z.number().finite().positive(), reference: nonempty, note: z.string().max(4000), createdAt: z.string().datetime() }).strict()),
  students: z.array(z.object({ id, name: nonempty, category, birthDate: z.union([date, z.literal('')]), guardian: short, phone: short, cpf: short.optional(), rg: short.optional(), active: z.boolean() }).strict()),
  collaborators: z.array(z.object({ id, name: nonempty, role: nonempty, phone: short, email: short, active: z.boolean() }).strict()),
  lessons: z.array(z.object({ id, date, title: nonempty, description: z.string().min(1).max(10000), category, instructorId: z.string().max(100), roster: z.array(z.object({ id, name: nonempty }).strict()).min(1), attendance: z.record(z.string(), attendance) }).strict()),
}).strict();

export function validateData(value, previous) {
  const data = schema.parse(value);
  for (const kind of Object.keys(data)) {
    if (new Set(data[kind].map(item => item.id)).size !== data[kind].length) throw new Error('Identificadores duplicados.');
    const current = new Map(data[kind].map(item => [item.id, item]));
    for (const item of previous[kind]) {
      if (!current.has(item.id)) throw new Error('Registros existentes não podem ser removidos.');
      if (kind === 'movements' && Object.keys(item).some(key => current.get(item.id)[key] !== item[key])) throw new Error('Lançamentos do Kardex não podem ser alterados.');
    }
  }
  const materials = new Set(data.materials.map(item => item.id));
  const students = new Set(data.students.map(item => item.id));
  const collaborators = new Set(data.collaborators.map(item => item.id));
  for (const movement of data.movements) if (!materials.has(movement.materialId)) throw new Error('Material da movimentação não encontrado.');
  for (const material of data.materials) {
    let balance = 0;
    const movements = data.movements.filter(item => item.materialId === material.id).sort((a,b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    for (const item of movements) {
      balance += item.kind === 'entrada' ? item.quantity : -item.quantity;
      if (balance < -0.000001) throw new Error('Movimentação deixaria saldo negativo.');
    }
  }
  for (const lesson of data.lessons) {
    if (lesson.instructorId && !collaborators.has(lesson.instructorId)) throw new Error('Colaborador da aula não encontrado.');
    if (new Set(lesson.roster.map(item => item.id)).size !== lesson.roster.length) throw new Error('Aluno duplicado na aula.');
    for (const student of lesson.roster) if (!students.has(student.id) || !lesson.attendance[student.id]) throw new Error('Frequência ou aluno inválido.');
    if (Object.keys(lesson.attendance).some(key => !lesson.roster.some(item => item.id === key))) throw new Error('Frequência sem aluno na aula.');
  }
  return data;
}

export const emptyData = () => ({ materials: [], movements: [], students: [], collaborators: [], lessons: [] });
