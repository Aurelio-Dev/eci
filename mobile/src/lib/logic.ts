export type ContactValues = { name: string; email: string; subject: string; message: string };

export function validContact(values: ContactValues): boolean {
  return !!values.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) && !!values.message.trim();
}

export function contactForm(values: ContactValues): FormData {
  const form = new FormData();
  form.append('_captcha', 'false');
  form.append('_subject', 'Novo contato pelo site do Clube!');
  form.append('Nome', values.name.trim());
  form.append('Email', values.email.trim());
  form.append('Assunto', values.subject);
  form.append('Mensagem', values.message.trim());
  return form;
}

export function localTarget(href: string, currentSlug = 'index') {
  const [file, fragment] = href.split('#');
  const slug = file ? file.replace(/\.html$/i, '') : currentSlug;
  return { slug: slug || 'index', section: fragment || undefined };
}
