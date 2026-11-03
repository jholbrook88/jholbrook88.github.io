const buttons = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');
buttons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  buttons.forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  let count = 0;
  projects.forEach(project => { project.hidden = filter !== 'all' && project.dataset.category !== filter; if (!project.hidden) count++; });
  document.querySelector('.project-grid').classList.toggle('filtered', filter !== 'all');
  document.querySelector('#filter-status').textContent = `Showing ${count} project concept${count === 1 ? '' : 's'}.`;
}));
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#service').value = link.dataset.service; }));
document.querySelector('#estimate-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const result = document.querySelector('#form-result');
  result.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = 'Your sample inquiry is ready.';
  result.append(title);
  for (const line of [`Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Service: ${data.get('service')}`, data.has('frequency') ? `Service frequency: ${data.get('frequency')}` : `Budget: ${data.get('budget') || 'Not specified'}`, `Your idea: ${data.get('message')}`, 'Preview only — nothing has been sent or saved.']) {
    const p = document.createElement('p'); p.textContent = line; result.append(p);
  }
  result.hidden = false;
});
