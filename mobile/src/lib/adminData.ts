export const CATEGORIES = ['Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'] as const;
export type Category = (typeof CATEGORIES)[number];
export type MovementKind = 'entrada' | 'saida';
export type Attendance = 'pendente' | 'presente' | 'ausente' | 'justificada';

export type Material = { id: string; name: string; code: string; unit: string; minimum: number };
export type Movement = { id: string; materialId: string; date: string; kind: MovementKind; quantity: number; reference: string; note: string; createdAt: string };
export type Student = { id: string; name: string; category: Category; birthDate: string; guardian: string; phone: string; cpf?: string; rg?: string; active: boolean };
export type Collaborator = { id: string; name: string; role: string; phone: string; email: string; active: boolean };
export type LessonStudent = { id: string; name: string };
export type Lesson = { id: string; date: string; title: string; description: string; category: Category; instructorId: string; roster: LessonStudent[]; attendance: Record<string, Attendance> };
export type AdminData = { materials: Material[]; movements: Movement[]; students: Student[]; collaborators: Collaborator[]; lessons: Lesson[] };

export const emptyAdminData = (): AdminData => ({ materials: [], movements: [], students: [], collaborators: [], lessons: [] });
export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
export const today = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
export const dateLabel = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value;
export const quantityLabel = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
export const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function kardex(materialId: string, movements: Movement[]) {
  let balance = 0;
  return movements.filter(row => row.materialId === materialId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .map(row => ({ ...row, balance: balance += row.kind === 'entrada' ? row.quantity : -row.quantity }));
}

export function recordMovement(data: AdminData, movement: Movement): AdminData {
  if (!data.materials.some(item => item.id === movement.materialId)) throw new Error('Selecione um material cadastrado.');
  if (!validDate(movement.date)) throw new Error('Informe uma data válida no formato AAAA-MM-DD.');
  if (!Number.isFinite(movement.quantity) || movement.quantity <= 0) throw new Error('Informe uma quantidade maior que zero.');
  if (!movement.reference.trim()) throw new Error('Informe o documento ou a referência da movimentação.');
  const next = [...data.movements, movement];
  if (kardex(movement.materialId, next).some(row => row.balance < -0.000001)) throw new Error('A saída deixaria o saldo negativo nessa data. Confira o Kardex.');
  return { ...data, movements: next };
}

export function createLesson(data: AdminData, lesson: Pick<Lesson, 'id' | 'date' | 'title' | 'description' | 'category' | 'instructorId'>): Lesson {
  if (!validDate(lesson.date) || !lesson.title.trim() || !lesson.description.trim()) throw new Error('Informe data válida, título e descrição da aula.');
  const roster = data.students.filter(student => student.active && student.category === lesson.category).map(student => ({ id: student.id, name: student.name }));
  if (!roster.length) throw new Error(`Cadastre ao menos um aluno ativo da categoria ${lesson.category} antes de criar a aula.`);
  return { ...lesson, title: lesson.title.trim(), description: lesson.description.trim(), roster, attendance: Object.fromEntries(roster.map(student => [student.id, 'pendente'])) };
}

export function setAttendance(data: AdminData, lessonId: string, studentId: string, status: Attendance): AdminData {
  return { ...data, lessons: data.lessons.map(lesson => lesson.id === lessonId && lesson.roster.some(student => student.id === studentId)
    ? { ...lesson, attendance: { ...lesson.attendance, [studentId]: status } }
    : lesson) };
}

export function attendanceCounts(lesson: Lesson) {
  return lesson.roster.reduce((counts, student) => {
    const status = lesson.attendance[student.id] || 'pendente';
    counts[status] += 1;
    return counts;
  }, { pendente: 0, presente: 0, ausente: 0, justificada: 0 });
}
