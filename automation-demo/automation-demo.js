let leads = [];
let sequence = 1;
const hours = { urgent:1, normal:24, low:72 };
const form = document.querySelector('#intake');
const status = document.querySelector('#status');
const timeline = document.querySelector('#timeline');
function formatDate(value) { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)); }
function showSteps(steps) { timeline.replaceChildren(); for (const [title, copy] of steps) { const li = document.createElement('li'); const strong = document.createElement('strong'); strong.textContent = title; const p = document.createElement('p'); p.textContent = copy; li.append(strong,p); timeline.append(li); } timeline.hidden = false; document.querySelector('#empty').hidden = true; }
function render() {
  document.querySelector('#lead-count').textContent = leads.length;
  document.querySelector('#pending-count').textContent = leads.filter(lead => !lead.contacted).length;
  document.querySelector('#completed-count').textContent = leads.filter(lead => lead.contacted).length;
  document.querySelector('#queue-empty').hidden = leads.length > 0;
  document.querySelector('#export').disabled = leads.length === 0;
  const list = document.querySelector('#leads'); list.replaceChildren();
  leads.forEach(lead => { const li = document.createElement('li'); const line = document.createElement('div'); line.className = 'lead-line'; const name = document.createElement('strong'); name.textContent = `${lead.customer} · ${lead.service}`; const button = document.createElement('button'); button.type = 'button'; button.textContent = lead.contacted ? 'Reopen follow-up' : 'Mark contacted'; button.setAttribute('aria-label',`${lead.contacted ? 'Reopen follow-up for' : 'Mark contacted:'} ${lead.customer}, ${lead.service}`); button.addEventListener('click', () => { lead.contacted = !lead.contacted; render(); status.textContent = `${lead.customer}: ${lead.contacted ? 'marked contacted. Follow-up completed.' : 'follow-up reopened.'}`; }); line.append(name,button); const detail = document.createElement('p'); detail.textContent = `${lead.email} · ${lead.urgency} · ${lead.contacted ? 'Contacted' : 'Due '+formatDate(lead.dueAt)}`; li.append(line,detail); list.append(li); });
}
form.addEventListener('submit', event => {
  event.preventDefault(); const data = new FormData(form); const customer = data.get('customer').trim(); const email = data.get('email').trim().toLowerCase();
  if (!customer) { status.textContent = 'Enter a fictional customer name.'; return; }
  const service = data.get('service'); const existing = leads.find(lead => lead.email === email && lead.service === service);
  if (existing) { showSteps([['Duplicate detected',`This email and service already belong to ${existing.id}.`],['Queue kept as it is','No extra record, acknowledgment, or follow-up was created.']]); status.textContent = 'Duplicate prevented. Your queue has not changed.'; return; }
  const createdAt = new Date().toISOString(); const urgency = data.get('urgency'); const dueAt = new Date(Date.parse(createdAt)+hours[urgency]*3600000).toISOString();
  const lead = {id:`DEMO-${String(sequence++).padStart(3,'0')}`,customer,email,service,urgency,channel:data.get('channel'),createdAt,dueAt,contacted:false}; leads.unshift(lead); render();
  showSteps([['Inquiry captured',`${lead.id}: ${customer} — ${service}.`],['Acknowledgment prepared',`${lead.channel}: “Thanks for your inquiry about ${service.toLowerCase()}. We have your details and will follow up.” Preview only; not sent.`],['Follow-up rule applied',`${urgency.charAt(0).toUpperCase()+urgency.slice(1)} priority → follow up in ${hours[urgency]} hour${hours[urgency]===1?'':'s'}.`],['Task added to the queue',`Contact ${customer} by ${formatDate(dueAt)}. No real reminder or calendar event was created.`]]);
  status.textContent = `${lead.id} created with a ${hours[urgency]}-hour follow-up. Nothing was sent.`;
});
document.querySelector('#reset').addEventListener('click', () => { leads = []; sequence = 1; form.reset(); render(); timeline.replaceChildren(); timeline.hidden = true; document.querySelector('#empty').hidden = false; status.textContent = 'Demo reset. All sample records cleared.'; });
document.querySelector('#export').addEventListener('click', () => {
  const cell = value => { let text = String(value); if (/^\s*[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"','""') + '"'; };
  const rows = [['Demo lead ID','Customer','Email','Service','Urgency','Follow-up due','Status'],...leads.map(lead => [lead.id,lead.customer,lead.email,lead.service,lead.urgency,lead.dueAt,lead.contacted ? 'Contacted' : 'Pending'])];
  const blob = new Blob(['\uFEFF'+rows.map(row => row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'hbts-sample-leads.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); status.textContent = 'Sample records downloaded as a CSV spreadsheet file.';
});
render();
