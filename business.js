document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('[data-category]').forEach(item => { item.hidden = filter !== 'all' && item.dataset.category !== filter; if (!item.hidden) count++; });
  document.querySelector('#gallery-status').textContent = `Showing ${count} example${count === 1 ? "" : "s"}.`;
}));
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#service').value = link.dataset.service; }));
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const result = document.querySelector('.result');
  result.replaceChildren(); const title = document.createElement('strong'); title.textContent = form.dataset.resultTitle; result.append(title);
  for (const [key, value] of data.entries()) { const p = document.createElement('p'); p.textContent = `${key}: ${value}`; result.append(p); }
  const p = document.createElement('p'); p.textContent = 'Demo only. Nothing was sent, saved, or booked.'; result.append(p); result.hidden = false;
});
