const examples = {
  auto: { name:'Alex Parker', business:'Parkside Auto Repair', service:'Brake inspection', timing:'This week, if available', message:'Hi, my car has started making a grinding noise when I brake. It’s a 2017 Honda Civic, around 95,000 miles. Could you take a look this week? Can you let me know what you’d need from me and how an estimate works? — Alex', details:'Grinding noise while braking; 2017 Honda Civic with approximately 95,000 miles. Customer requests an inspection and estimate information.', questions:['Is the vehicle parked safely, and are there any warning lights?','What is the best phone number to discuss the symptoms and safe next steps?','Which days this week could work for an inspection, subject to availability?'], friendly:'Hi Alex,\n\nThanks for contacting Parkside Auto Repair. We’ve noted the grinding noise when braking on your 2017 Civic. A message alone isn’t enough to identify the cause or confirm that the car is safe to drive.\n\nPlease call the shop so we can discuss the symptoms and how to get the vehicle to us safely. Let us know your preferred days and a callback number. We’ll check inspection availability and explain any inspection charges and the estimate process before work is authorized.\n\nThanks,\nParkside Auto Repair', brief:'Hi Alex, thanks for contacting Parkside Auto Repair. Please call us about the brake noise so we can discuss safe next steps, inspection availability, and how estimates work. Send a callback number and your preferred days. No diagnosis, price, or appointment is confirmed yet.' },
  repair: { name:'Jordan Reed', business:'Ridgeline Repair & Remodeling', service:'Drywall, paint & door repair', timing:'Before a tenant moves in next month', message:'I have a rental that needs a few things before the next tenant moves in next month. Hole in the hallway wall, bedroom needs paint, and the back door sticks. Could someone look at it? I can send pics. — Jordan', details:'Hallway drywall damage, bedroom painting, sticking back door.', questions:['What is the property address and target completion date?','How large is the drywall damage and the bedroom?','Can the customer share photos and arrange property access?'], friendly:'Hi Jordan,\n\nThanks for contacting Ridgeline. We’ve noted the hallway drywall, bedroom painting, and sticking back door. Please send photos, the property address, and the date you need the work finished.\n\nWe can then review the scope and discuss a time to look at the property. Any estimate or schedule would be confirmed after that review.\n\nThanks,\nRidgeline Repair & Remodeling', brief:'Hi Jordan, please send photos, the property address, and your target finish date for the drywall, painting, and back-door repairs. We’ll review the scope and arrange the next step. Pricing and timing are not confirmed yet.' },
  salon: { name:'Taylor Morgan', business:'Juniper Hair Studio', service:'Cut & color consultation', timing:'Saturday preferred; not yet confirmed', message:'Hi! I’m hoping to get my hair cut and maybe go a little lighter. It’s been colored before and I don’t want anything hard to keep up. Do you have Saturday appointments? What would something like that cost? — Taylor', details:'A haircut and lighter color, with low-maintenance upkeep; previously colored hair.', questions:['What is the current hair length and color history?','Can the customer share a current photo and a reference look?','Which Saturday and what times would work?'], friendly:'Hi Taylor,\n\nThanks for reaching out to Juniper. A consultation is a good place to start for a cut and a lighter color that works with your routine. Please send a current photo, a reference look if you have one, and the Saturday you had in mind.\n\nWe’ll review your color history and check appointment options before confirming the service, price, or booking.\n\nThanks,\nJuniper Hair Studio', brief:'Hi Taylor, please send a current hair photo, a reference look, your recent color history, and the Saturday you prefer. Juniper can then review service options, pricing, and availability. Nothing is booked yet.' }
};
let selected = 'auto';
const message = document.querySelector('#source-message');
const person = document.querySelector('#source-person');
const result = document.querySelector('#result');
const empty = document.querySelector('#empty');
const status = document.querySelector('#status');
let typingVersion = 0;
let fullReply = '';
const copyButton = document.querySelector('#copy');
const skipButton = document.createElement('button');
skipButton.type = 'button'; skipButton.className = 'button secondary'; skipButton.id = 'show-reply'; skipButton.textContent = 'Show full reply'; skipButton.hidden = true;
copyButton.after(skipButton);
const animationLabel = document.createElement('label'); animationLabel.className = 'animation-option';
const animationToggle = document.createElement('input'); animationToggle.type = 'checkbox'; animationToggle.checked = true; animationToggle.id = 'animate-reply';
animationLabel.append(animationToggle, document.createTextNode('Type out the sample reply'));
document.querySelector('#preview').before(animationLabel);
function stopTyping() { typingVersion++; document.querySelector('#draft').classList.remove('typing'); skipButton.hidden = true; }
function clearResult() { stopTyping(); result.hidden = true; empty.hidden = false; status.textContent = ''; }
function finishReply() { stopTyping(); document.querySelector('#draft').textContent = fullReply; copyButton.disabled = false; status.textContent = `Prepared ${examples[selected].business} example ready to review.`; }
skipButton.addEventListener('click', finishReply);
async function typeReply(text) {
  stopTyping(); fullReply = text; const version = typingVersion;
  const draft = document.querySelector('#draft'); draft.textContent = ''; copyButton.disabled = true;
  if (!animationToggle.checked) { finishReply(); return; }
  draft.classList.add('typing'); skipButton.hidden = false; status.textContent = 'Preparing the sample reply preview…';
  for (let i = 0; i < text.length; i += 4) {
    if (version !== typingVersion) return;
    draft.textContent = text.slice(0, i + 4);
    await new Promise(resolve => setTimeout(resolve, 14));
  }
  if (version === typingVersion) finishReply();
}
function loadExample() { const data = examples[selected]; message.textContent = data.message; person.textContent = `${data.name} · Fictional customer`; clearResult(); }
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.example; document.querySelectorAll('[data-example]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); loadExample(); }));
document.querySelector('#tone').addEventListener('change', clearResult);
document.querySelector('#preview').addEventListener('click', () => {
  const data = examples[selected]; const summary = document.querySelector('#summary'); summary.replaceChildren();
  for (const [label, value] of [['Customer',data.name],['Business',data.business],['Request',data.service],['Timing',data.timing],['Details',data.details]]) { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; summary.append(dt,dd); }
  const questions = document.querySelector('#questions'); questions.replaceChildren(); data.questions.forEach(question => { const li = document.createElement('li'); li.textContent = question; questions.append(li); });
  result.hidden = false; empty.hidden = true; typeReply(data[document.querySelector('#tone').value]);
});
document.querySelector('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(document.querySelector('#draft').textContent); status.textContent = 'Sample reply copied. Nothing has been sent.'; } catch { status.textContent = 'Copy is unavailable in this browser. You can select and copy the draft text.'; } });
loadExample();
