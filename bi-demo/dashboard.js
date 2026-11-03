// Deterministic fictional inquiries. No customer systems or network requests.
const services = ['Plumbing', 'Electrical', 'Appliance repair'];
const sources = ['Website', 'Phone', 'Referral', 'Google Business'];
const stages = ['New inquiry', 'Estimate sent', 'Booked', 'Not proceeding'];
let seed = 3817;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
const records = [];
for (let month = 5; month <= 10; month++) {
  const total = [26, 32, 29, 37, 40, 44][month - 5];
  for (let i = 0; i < total; i++) {
    const day = String(1 + Math.floor(random() * (month === 6 || month === 9 ? 30 : 31))).padStart(2, '0');
    const service = services[Math.floor(random() * services.length)];
    const source = sources[Math.floor(random() * sources.length)];
    const score = random();
    const stage = score < .16 ? 'New inquiry' : score < .37 ? 'Estimate sent' : score < .84 ? 'Booked' : 'Not proceeding';
    const response = stage === 'New inquiry' ? null : Math.round(10 + random() * (source === 'Phone' ? 100 : 390));
    records.push({id:`INQ-${String(records.length + 1).padStart(3, '0')}`, date:`2026-${String(month).padStart(2,'0')}-${day}`, month, service, source, stage, response});
  }
}
records.sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
const $ = selector => document.querySelector(selector);
const pageSize = 10;
let page = 1;
let filtered = [];
let matching = [];
const formatResponse = minutes => minutes == null ? 'No reply yet' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
function element(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text != null) el.textContent = text; return el; }
function median(values) { if (!values.length) return null; const sorted = [...values].sort((a,b) => a-b); const half = Math.floor(sorted.length/2); return sorted.length % 2 ? sorted[half] : Math.round((sorted[half-1] + sorted[half])/2); }
function breakdown(target, categories, key) {
  const container = $(target); container.replaceChildren();
  categories.forEach(category => {
    const count = filtered.filter(row => row[key] === category).length;
    const share = filtered.length ? Math.round(count / filtered.length * 100) : 0;
    const row = element('div','breakdown-row'); const title = element('div'); title.append(element('span','',category), element('strong','',String(count)));
    const track = element('div','track'); const fill = element('span'); fill.style.width = `${share}%`; track.append(fill); track.setAttribute('aria-hidden','true');
    row.append(title,track,element('small','',`${share}% of selected inquiries`)); container.append(row);
  });
}
function updateDashboard() {
  const minimumMonth = $('#period').value === 'month' ? 10 : $('#period').value === 'quarter' ? 8 : 5;
  filtered = records.filter(row => row.month >= minimumMonth && [['service','service'],['source','source'],['stage','stage']].every(([id,key]) => $(`#${id}`).value === 'all' || row[key] === $(`#${id}`).value));
  const booked = filtered.filter(row => row.stage === 'Booked').length;
  const replied = filtered.filter(row => row.response != null);
  $('#inquiries').textContent = filtered.length;
  $('#booked').textContent = booked;
  $('#rate').textContent = filtered.length ? `${Math.round(booked / filtered.length * 100)}%` : '—';
  const typical = median(replied.map(row => row.response));
  $('#response').textContent = typical == null ? '—' : formatResponse(typical);
  $('#response').nextElementSibling.textContent = `${replied.length} replied inquiries · median response time`;
  const selections = ['period','service','source','stage'].map(id => $(`#${id}`).selectedOptions[0].textContent);
  $('#filter-summary').textContent = `${filtered.length} of ${records.length} sample inquiries · ${selections.join(' · ')}`;
  const trend = $('#trend'); trend.replaceChildren();
  const months = Array.from({length:11-minimumMonth}, (_,i) => minimumMonth+i);
  const totals = months.map(month => ({month, total:filtered.filter(row => row.month === month).length, booked:filtered.filter(row => row.month === month && row.stage === 'Booked').length}));
  const maximum = Math.max(1,...totals.map(row => row.total));
  totals.forEach(data => {
    const name = new Date(Date.UTC(2026,data.month-1,1)).toLocaleString('en-US',{month:'short',timeZone:'UTC'});
    const column = element('div','month'); column.setAttribute('aria-label',`${name}: ${data.total} inquiries, ${data.booked} booked`);
    const pair = element('div','bar-pair'); pair.setAttribute('aria-hidden','true');
    [['',data.total],['booked',data.booked]].forEach(([type,count]) => { const bar = element('div',`bar ${type}`); bar.style.height = `${count/maximum*140}px`; bar.append(element('b','',String(count))); pair.append(bar); });
    column.append(pair, element('span','',name)); trend.append(column);
  });
  breakdown('#sources',sources,'source'); breakdown('#services',services,'service');
  const pipeline = $('#pipeline'); pipeline.replaceChildren();
  stages.forEach(stage => { const tile = element('div','stage-tile'); tile.append(element('strong','',String(filtered.filter(row => row.stage === stage).length)),element('span','',stage)); pipeline.append(tile); });
  const waiting = filtered.filter(row => row.response == null).length;
  $('#attention').textContent = filtered.length ? `${waiting} selected ${waiting === 1 ? 'inquiry has' : 'inquiries have'} no recorded first reply. Select “New inquiry” above to see those records.` : 'No inquiries match these filters. Try another combination or reset the filters.';
  page = 1; updateTable(); $('#download-status').textContent = '';
}
function updateTable() {
  const query = $('#search').value.trim().toLowerCase();
  matching = filtered.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(query)));
  const pages = Math.max(1,Math.ceil(matching.length/pageSize)); page = Math.min(page,pages);
  const tbody = $('#rows'); tbody.replaceChildren();
  matching.slice((page-1)*pageSize,page*pageSize).forEach(row => {
    const tr = element('tr');
    [row.id,new Date(`${row.date}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}),row.service,row.source].forEach(value => tr.append(element('td','',value)));
    const stage = element('td'); stage.append(element('span',`stage-badge ${row.stage === 'Booked' ? 'booked' : row.stage === 'New inquiry' ? 'new' : ''}`,row.stage)); tr.append(stage,element('td','',formatResponse(row.response))); tbody.append(tr);
  });
  if (!matching.length) { const tr = element('tr'); const td = element('td','no-records','No matching records. Clear the search or change the filters.'); td.colSpan = 6; tr.append(td); tbody.append(tr); }
  $('#record-count').textContent = `${matching.length} matching records${query ? ' after record search' : ''} · showing ${matching.length ? (page-1)*pageSize+1 : 0}–${Math.min(page*pageSize,matching.length)}`;
  $('#page-label').textContent = `Page ${page} of ${pages}`;
  $('#previous').disabled = page <= 1; $('#next').disabled = page >= pages; $('#export').disabled = !matching.length;
}
$('#filters').addEventListener('submit',event => event.preventDefault());
$('#filters').addEventListener('change',updateDashboard);
$('#reset-filters').addEventListener('click',() => { $('#filters').reset(); $('#search').value = ''; updateDashboard(); });
$('#search').addEventListener('input',() => { page=1; updateTable(); $('#download-status').textContent = ''; });
$('#previous').addEventListener('click',() => { page--; updateTable(); });
$('#next').addEventListener('click',() => { page++; updateTable(); });
$('#export').addEventListener('click',() => {
  const escape = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
  const lines = [['Inquiry ID','Date received','Service','Source','Current stage','First reply (minutes)'],...matching.map(row => [row.id,row.date,row.service,row.source,row.stage,row.response])];
  const url = URL.createObjectURL(new Blob(['\uFEFF'+lines.map(line => line.map(escape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link = element('a'); link.href = url; link.download = 'hbts-fictional-business-data.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
  $('#download-status').textContent = `Downloaded ${matching.length} fictional records matching the current filters and search.`;
});
updateDashboard();
