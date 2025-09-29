// Mailto fallback per il form contatti (niente backend)
document.addEventListener('submit', (e) => {
  const form = e.target;
  if (!form.matches('#contact-form')) return;
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  const subject = encodeURIComponent(`Richiesta contatto dal sito — ${name}`);
  const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\nMessaggio:\n${message}`);
  window.location.href = `mailto:contatto@example.com?subject=${subject}&body=${body}`;
});
