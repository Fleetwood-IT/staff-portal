let staff=[],pay={},cs=[];
const K=['paid_days','gross','bonus','other1','other2','tax','pension','fines'];
const EM=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const net=r=>num(r.gross)+num(r.bonus)+num(r.other1)+num(r.other2)-num(r.tax)-num(r.pension)-num(r.fines);
const flash=t=>{$('fl').textContent=t};
const show=id=>['auth','app'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
async function boot(){
 const{data:{session}}=await sb.auth.getSession();if(!session)return show('auth');
 const{data}=await sb.from('admins').select('user_id').maybeSingle();
 if(!data){await sb.auth.signOut();$('msg').textContent='This account is not an administrator.';return show('auth')}
 show('app');await loadStaff();await loadPay();loadC()}
const doIn=async()=>{const{error}=await sb.auth.signInWithPassword({email:$('em').value.trim().toLowerCase(),password:$('pw').value});if(error)$('msg').textContent='Wrong email or password.';else boot()};
$('in').onclick=doIn;
$('pw').onkeydown=e=>{if(e.key==='Enter')doIn()};
$('out').onclick=async()=>{await sb.auth.signOut();show('auth')};
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{
 ['s','p','c'].forEach(t=>$('tab-'+t).classList.toggle('hidden',b.dataset.t!==t));
 if(b.dataset.t==='p')loadPay();if(b.dataset.t==='c')loadC()});

/* ---------- Staff ---------- */
async function loadStaff(){const{data}=await sb.from('staff').select('*').order('staff_no');staff=data||[];
 $('st').innerHTML=staff.map((s,i)=>`<tr data-i="${i}"><td>${esc(s.staff_no)}</td><td><input data-k="name" value="${esc(s.name)}"></td><td><select data-k="gender">${['','MALE','FEMALE'].map(o=>`<option${s.gender===o?' selected':''}>${o}</option>`).join('')}</select></td><td><input data-k="email" type="email" value="${esc(s.email)}"></td><td><input data-k="active" type="checkbox"${s.active?' checked':''}></td></tr>`).join('')}
$('st').onchange=async e=>{const tr=e.target.closest('tr'),s=staff[tr.dataset.i],k=e.target.dataset.k;
 let v=k==='active'?e.target.checked:e.target.value.trim();
 if(k==='name'&&!v){e.target.value=s.name;return flash('Name cannot be empty.')}
 if(k==='email'){v=v?v.toLowerCase():null;if(v&&!EM.test(v)){e.target.value=s.email||'';return flash('Enter a valid email address.')}}
 const{error}=await sb.from('staff').update({[k]:v}).eq('id',s.id);
 if(error){flash(error.message.includes('duplicate')?'That email is already used by another staff member.':error.message);if(k==='email')e.target.value=s.email||'';return}
 s[k]=v;flash('Saved')};
$('ab').onclick=async()=>{const name=$('an').value.trim();if(!name)return flash('Enter a name.');const em=$('ae').value.trim().toLowerCase();
 if(em&&!EM.test(em))return flash('Enter a valid email address.');
 const{error}=await sb.from('staff').insert({name,gender:$('ag').value,email:em||null});
 if(error)return flash(error.message.includes('duplicate')?'That email is already used by another staff member.':error.message);
 $('an').value=$('ae').value='';flash('Staff added');loadStaff()};

/* ---------- Payroll ---------- */
async function loadPay(){const p=$('period').value.trim();if(!p)return;const{data}=await sb.from('payslips').select('*').eq('period',p);pay={};(data||[]).forEach(r=>pay[r.staff_id]=r);
 $('pt').innerHTML=staff.filter(s=>s.active).map(s=>{const r=pay[s.id]||{};
  const st=r.id?`<label style="display:flex;gap:6px;align-items:center;margin:0;color:inherit;font-size:13px"><input type="checkbox" data-pub="${r.id}"${r.published?' checked':''}><span class="pl">${r.published?'Published':'Draft'}</span></label>`:'<span class="note">Not saved</span>';
  return`<tr data-id="${s.id}"><td>${esc(s.name)}</td>${K.map(k=>`<td><input type="number" min="0" step="any" data-k="${k}" value="${num(r[k])}"></td>`).join('')}<td class="net">${ft(net(r))}</td><td>${st}</td></tr>`}).join('')}
$('pt').oninput=e=>{if(!e.target.dataset.k)return;const tr=e.target.closest('tr'),r={};tr.querySelectorAll('input[data-k]').forEach(i=>r[i.dataset.k]=num(i.value));tr.querySelector('.net').textContent=ft(net(r))};
/* Tick or untick one person's payslip to publish or hide it */
$('pt').onchange=async e=>{const id=e.target.dataset.pub;if(!id)return;
 const v=e.target.checked,tr=e.target.closest('tr');
 const{error}=await sb.from('payslips').update({published:v}).eq('id',id);
 if(error){e.target.checked=!v;return flash(error.message)}
 const r=pay[tr.dataset.id];if(r)r.published=v;
 tr.querySelector('.pl').textContent=v?'Published':'Draft';
 flash(v?'Published to this staff member.':'Hidden from this staff member.')};
$('ld').onclick=loadPay;
$('period').onchange=loadPay;
$('sv').onclick=async()=>{const period=$('period').value.trim(),out=[];
 if(!period)return flash('Enter the pay period first.');
 $('pt').querySelectorAll('tr').forEach(tr=>{const o={staff_id:tr.dataset.id,period};let any=!!pay[o.staff_id];tr.querySelectorAll('input[data-k]').forEach(i=>{o[i.dataset.k]=num(i.value);if(num(i.value))any=true});if(any)out.push(o)});
 if(!out.length)return flash('Nothing to save.');
 const{error}=await sb.from('payslips').upsert(out,{onConflict:'staff_id,period'});flash(error?error.message:'Saved as draft. Tick Publish beside a name, or press Publish for everyone.');loadPay()};
const setPub=async v=>{const{error}=await sb.from('payslips').update({published:v}).eq('period',$('period').value.trim());flash(error?error.message:v?'Published to all staff for this period.':'Unpublished for all staff.');loadPay()};
$('pub').onclick=()=>confirm('Publish ALL saved payslips for this period to staff?')&&setPub(true);
$('unp').onclick=()=>confirm('Hide ALL payslips for this period from staff?')&&setPub(false);

/* ---------- Complaints (conversations) ---------- */
const dt=d=>{const x=new Date(d);return x.toLocaleDateString('en-GB')+' '+x.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
const bub=(cls,who,d,t)=>`<div class="b ${cls}"><div class="bh">${who} &middot; ${dt(d)}</div>${esc(t)}</div>`;
const SYS={resolved:'You marked this as resolved',reopened:'You reopened this complaint',closed_yes:'Staff closed this: satisfied',closed_no:'Staff closed this: not satisfied'};
const sysl=m=>`<div class="sys">${SYS[m.kind]||''} &middot; ${dt(m.created_at)}${m.body?`<br>${esc(m.body)}`:''}</div>`;
const msgs=c=>(c.complaint_messages||[]).slice().sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
const needs=c=>{const m=msgs(c);return c.status==='open'&&(m.length?m[m.length-1].sender:'staff')==='staff'};
const tag=c=>c.status==='closed'?(c.satisfied?'<span class="tag yes">Closed &middot; satisfied</span>':'<span class="tag no">Closed &middot; not satisfied</span>'):c.status==='resolved'?'<span class="tag aw">Awaiting staff feedback</span>':needs(c)?'<span class="tag op">Needs reply</span>':'<span class="tag aw">Waiting for staff</span>';
function cardC(c){
 const th=bub('them',esc(c.staff?c.staff.name:'Staff'),c.created_at,c.message)+msgs(c).map(m=>m.kind==='msg'?bub(m.sender==='admin'?'me':'them',m.sender==='admin'?'You':esc(c.staff?c.staff.name:'Staff'),m.created_at,m.body):sysl(m)).join('');
 const act=c.status==='closed'
  ?`<textarea rows="2" maxlength="1000" placeholder="Reason for reopening (optional)" aria-label="Reopen note"></textarea><div class="row"><button class="btn" data-act="reopen" data-id="${c.id}">Reopen</button><span class="note tm" aria-live="polite"></span></div>`
  :`<textarea rows="2" maxlength="1000" placeholder="Write a reply" aria-label="Reply"></textarea><div class="row"><button class="btn p" data-act="reply" data-id="${c.id}">Send reply</button><button class="btn" data-act="resolve" data-id="${c.id}">Mark resolved</button><span class="note tm" aria-live="polite"></span></div>`;
 return `<div class="cmt"><div><b>${esc(c.staff?c.staff.name:'')}</b> <span class="note">${esc(c.staff?c.staff.staff_no:'')} &middot; ${esc(c.period)}</span> ${tag(c)}</div><div class="thread">${th}</div>${act}</div>`}
function drawC(){const f=$('cf').value;
 const list=cs.filter(c=>f==='all'||(f==='needs'&&needs(c))||(f==='resolved'&&c.status==='resolved')||(f==='closed'&&c.status==='closed'));
 $('ct').innerHTML=list.length?list.map(cardC).join(''):'<p class="note">No complaints here.</p>'}
async function loadC(){
 const{data,error}=await sb.from('complaints').select('*,staff(name,staff_no),complaint_messages(*)').order('updated_at',{ascending:false});
 if(error)return flash(error.message);
 cs=data||[];const n=cs.filter(needs).length;
 $('tc').textContent='Complaints'+(n?` (${n})`:'');drawC()}
$('cf').onchange=drawC;
$('cr').onclick=loadC;
$('ct').onclick=async e=>{const b=e.target.closest('[data-act]');if(!b)return;
 const box=b.closest('.cmt'),tm=t=>{b.parentElement.querySelector('.tm').textContent=t};
 const act=b.dataset.act,t=box.querySelector('textarea').value.trim();
 if(act==='reply'&&!t)return tm('Type a reply first.');
 const kind=act==='resolve'?'resolved':act==='reopen'?'reopened':'msg';
 b.disabled=true;
 const{error}=await sb.from('complaint_messages').insert({complaint_id:b.dataset.id,sender:'admin',kind,body:t});
 b.disabled=false;
 if(error)return tm('Could not save: '+error.message);
 flash('Saved');await loadC()};
boot();