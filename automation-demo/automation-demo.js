const $ = selector => document.querySelector(selector);
const form = $('#intake');
const hours = { urgent:1, normal:24, low:72 };
const teams = {'Home repair':'Property services','Salon appointment':'Front desk','Auto service':'Service advisor','General inquiry':'Customer support'};
const samples = {
 repair:{customer:'Jordan Example',email:'jordan@example.invalid',service:'Home repair',urgency:'normal',message:'I need drywall patched and a bedroom painted before the next tenant moves in. Could someone get in touch about an estimate?'},
 salon:{customer:'Taylor Example',email:'taylor@example.invalid',service:'Salon appointment',urgency:'low',message:'I’m looking for a cut and color consultation next month. Could you send me the next steps and check your availability?'},
 auto:{customer:'Alex Example',email:'alex@example.invalid',service:'Auto service',urgency:'urgent',message:'Could a service advisor call me today? I’d like to discuss a warning light and arrange a vehicle inspection.'}
};
let leads = [], sequence = 1, clock = Date.now(), filter = 'all', running = false, animation = 0, completeAnimation = null;
function el(tag, className, text) { const item = document.createElement(tag); if(className) item.className=className; if(text != null) item.textContent=text; return item; }
function formatDate(value) { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)); }
function fields() { const data = new FormData(form); return Object.fromEntries([...data.entries()].map(([k,v])=>[k,String(v).trim()])); }
function updateRule() { const data = fields(); $('#routing-rule').textContent = `${teams[data.service]} · follow up within ${hours[data.urgency]} hour${hours[data.urgency]===1?'':'s'}`; }
function setRunState(text,state) { $('#run-state').textContent=text; $('#run-state').dataset.state=state; }
function render() {
 const open=leads.filter(lead=>!lead.contacted), due=open.filter(lead=>lead.dueAt<=clock);
 $('#lead-count').textContent=leads.length; $('#pending-count').textContent=open.length; $('#completed-count').textContent=leads.length-open.length;
 $('#pending-detail').textContent=due.length ? `${due.length} due now · ${open.length-due.length} upcoming` : open.length ? 'All open tasks are upcoming' : 'No tasks waiting';
 $('#clock-time').textContent=formatDate(clock); $('#export').disabled=!leads.length;
 const visible=leads.filter(lead=>filter==='all'||(filter==='open'?!lead.contacted:lead.contacted));
 $('#queue-count').textContent=`${visible.length} ${visible.length===1?'task':'tasks'}`; $('#queue-empty').hidden=visible.length>0;
 $('#queue-empty strong').textContent=leads.length?'No tasks in this view.':'A clear queue starts with the first inquiry.';
 $('#queue-empty p').textContent=leads.length?'Try another task filter or run another sample inquiry.':'Run an example above, then advance the clock to see a follow-up become due.';
 const list=$('#leads'); list.replaceChildren();
 visible.forEach(lead=>{
  const li=el('li','lead-card'), avatar=el('div','avatar',lead.customer.split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase()); avatar.setAttribute('aria-hidden','true');
  const main=el('div','lead-main'), name=el('div','lead-name'); name.append(el('strong','',lead.customer),el('span','',lead.id));
  const tags=el('div','lead-tags'); tags.append(el('span','',lead.service),el('span','',lead.team),el('span',lead.urgency==='urgent'?'urgent':'',`${lead.urgency[0].toUpperCase()+lead.urgency.slice(1)} priority`));
  main.append(name,tags,el('p','',`${lead.email} · Follow up by ${formatDate(lead.dueAt)}`),el('p','lead-message',lead.message));
  const action=el('div','lead-action'), isDue=lead.dueAt<=clock;
  const due=el('span',`due-badge ${lead.contacted?'done':isDue?'overdue':''}`,lead.contacted?'✓ Contacted':isDue?'● Follow-up due now':`Due in ${Math.ceil((lead.dueAt-clock)/3600000)}h`);
  const button=el('button','',lead.contacted?'Reopen task':'Mark contacted');button.type='button';button.setAttribute('aria-label',`${lead.contacted?'Reopen task for':'Mark contacted:'} ${lead.customer}, ${lead.service}`);
  button.addEventListener('click',()=>{lead.contacted=!lead.contacted;lead.contactedAt=lead.contacted?clock:null;render();$('#queue-status').textContent=`${lead.customer}: ${lead.contacted?'marked contacted; follow-up completed.':'follow-up reopened.'}`;});
  action.append(due,button);li.append(avatar,main,action);list.append(li);
 });
}
function step(title,copy) { const li=el('li'); li.append(el('strong','',title),el('p','',copy));$('#timeline').append(li); }
function replyFor(lead) {
 const next={'Home repair':'Please send the property address, a few photos, and your preferred completion date so we can review the work.','Salon appointment':'Please share your preferred days and a little about the service you have in mind so we can check appointment options.','Auto service':'Please share your vehicle’s year, make, and model, plus a callback number. A service advisor can discuss the concern and inspection options with you.','General inquiry':'Please share a little more about what you need and the best way to reach you.'}[lead.service];
 const first=lead.customer.split(/\s+/)[0];
 return lead.channel==='SMS preview'?`Hi ${first}, thanks for your ${lead.service.toLowerCase()} inquiry. ${next} We’ll review the details before confirming availability or pricing.`:`Hi ${first},\n\nThanks for getting in touch. Your request has been passed to our ${lead.team.toLowerCase()} team.\n\n${next}\n\nWe’ll review your request before confirming any price or appointment.\n\nThank you,\nThe ${lead.team} team`;
}
function beginResult() { $('#timeline').replaceChildren();$('#timeline').hidden=false;$('#empty').hidden=true;$('#reply-box').hidden=true;$('#reply').textContent='';$('#reply').classList.remove('typing');$('#copy').disabled=true;$('#status').textContent=''; }
async function play(steps,reply,lead,finalStatus) {
 const ticket=++animation;running=true;$('#run').disabled=true;$('#finish').hidden=false;setRunState('Running…','running');beginResult();
 let finished=false;
 function finish() { if(finished||ticket!==animation)return;finished=true;$('#timeline').replaceChildren();steps.forEach(([title,copy])=>step(title,copy));if(reply){$('#reply-box').hidden=false;$('#reply-recipient').textContent=`${lead.channel} · To: ${lead.email}`;$('#reply').textContent=reply;$('#reply').classList.remove('typing');$('#copy').disabled=false;}running=false;$('#run').disabled=false;$('#finish').hidden=true;setRunState('Workflow complete','complete');$('#status').textContent=finalStatus;completeAnimation=null; }
 completeAnimation=finish;
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 for(const [title,copy] of steps){await pause(380);if(finished||ticket!==animation)return;step(title,copy);}
 if(reply){$('#reply-box').hidden=false;$('#reply-recipient').textContent=`${lead.channel} · To: ${lead.email}`;$('#reply').classList.add('typing');for(let i=0;i<reply.length;i+=4){if(finished||ticket!==animation)return;$('#reply').textContent=reply.slice(0,i+4);await pause(14);}}
 finish();
}
form.addEventListener('submit',event=>{
 event.preventDefault();if(running)return;const data=fields();if(!data.customer||!data.message){$('#status').textContent='Add a sample customer name and message.';return;}data.email=data.email.toLowerCase();
 const existing=leads.find(lead=>lead.email===data.email&&lead.service===data.service);
 const lead={...data,id:existing?existing.id:`DEMO-${String(sequence++).padStart(3,'0')}`,team:teams[data.service],createdAt:clock,dueAt:clock+hours[data.urgency]*3600000,contacted:false,contactedAt:null};
 // Replaying a demo refreshes its sample task and always shows the full workflow.
 if(existing)leads=leads.filter(item=>item!==existing);
 leads.unshift(lead);render();
 play([['Inquiry captured',`${lead.id}: ${lead.customer} — ${lead.service}.`],['Assigned to the right team',`${lead.service} → ${lead.team}. Original customer message included.`],['Follow-up scheduled',`${lead.urgency[0].toUpperCase()+lead.urgency.slice(1)} priority → ${hours[lead.urgency]}-hour deadline: ${formatDate(lead.dueAt)}.`],['Reply prepared for review',`${lead.channel}. The sample reply below is a draft; nothing is sent.`]],replyFor(lead),lead,`${lead.id} is ready in the queue. Run it again to try different details, or advance the demo clock to see its follow-up become due.`);
});
document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{if(running)completeAnimation?.();const sample=samples[button.dataset.sample];Object.entries(sample).forEach(([key,value])=>{form.elements.namedItem(key).value=value;});document.querySelectorAll('[data-sample]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));updateRule();}));
form.addEventListener('change',updateRule);
form.addEventListener('input',()=>{document.querySelectorAll('[data-sample]').forEach(item=>item.setAttribute('aria-pressed','false'));});
$('#finish').addEventListener('click',()=>completeAnimation?.());
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#reply').textContent);$('#status').textContent='Sample reply copied. Nothing has been sent.';}catch{$('#status').textContent='Select and copy the sample reply text. Nothing has been sent.';}});
function advance(amount) {clock+=amount*3600000;render();const due=leads.filter(lead=>!lead.contacted&&lead.dueAt<=clock).length;$('#queue-status').textContent=`Demo clock moved forward ${amount} hour${amount===1?'':'s'}. ${due} open follow-up${due===1?' is':'s are'} due now. No reminders were sent.`;}
$('#advance-hour').addEventListener('click',()=>advance(1));$('#advance-day').addEventListener('click',()=>advance(24));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));render();}));
$('#reset-demo').addEventListener('click',()=>{animation++;completeAnimation=null;running=false;leads=[];sequence=1;clock=Date.now();filter='all';form.reset();document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.filter==='all')));document.querySelectorAll('[data-sample]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.sample==='repair')));$('#timeline').replaceChildren();$('#timeline').hidden=true;$('#empty').hidden=false;$('#reply-box').hidden=true;$('#reply').textContent='';$('#reply').classList.remove('typing');$('#run').disabled=false;$('#finish').hidden=true;$('#status').textContent='';setRunState('Ready','ready');$('#queue-status').textContent='Demo reset. Sample records and clock cleared.';updateRule();render();});
$('#export').addEventListener('click',()=>{const cell=value=>{let text=String(value??'');if(/^\s*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};const rows=[['Lead ID','Customer','Email','Service','Customer message','Assigned team','Priority','Created','Follow-up due','Status','Contacted at'],...leads.map(lead=>[lead.id,lead.customer,lead.email,lead.service,lead.message,lead.team,lead.urgency,new Date(lead.createdAt).toISOString(),new Date(lead.dueAt).toISOString(),lead.contacted?'Contacted':lead.dueAt<=clock?'Due now':'Upcoming',lead.contactedAt?new Date(lead.contactedAt).toISOString():''])];const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=el('a');a.href=url;a.download='hbts-sample-leads.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#queue-status').textContent=`Downloaded ${leads.length} sample lead records as CSV.`;});
updateRule();render();
