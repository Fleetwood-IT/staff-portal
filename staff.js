let rows=[],me=null;
const msg=t=>$('msg').textContent=t;
const cn=t=>$('cm').textContent=t;
const show=id=>['auth','rec','me'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
const creds=()=>({email:$('em').value.trim().toLowerCase(),password:$('pw').value});
const home=()=>location.href.split('#')[0].split('?')[0];
const doIn=async()=>{const{error}=await sb.auth.signInWithPassword(creds());msg(error?'Wrong email or password, or the email is not confirmed yet.':'')};
$('in').onclick=doIn;
$('pw').onkeydown=e=>{if(e.key==='Enter')doIn()};
$('up').onclick=async()=>{const c=creds();if(!c.email||c.password.length<8)return msg('Enter your email and a password of at least 8 characters, then press this button.');
 const{error}=await sb.auth.signUp({...c,options:{emailRedirectTo:home()}});
 msg(error?'Could not create the account. Payroll must register this email first, and you may already have set a password (use Forgot password).':'Check your email and click the confirmation link, then sign in.')};
$('fg').onclick=async()=>{const e=$('em').value.trim().toLowerCase();if(!e)return msg('Enter your email first.');await sb.auth.resetPasswordForEmail(e,{redirectTo:home()});msg('If this email is registered, a reset link has been sent.')};
$('sv').onclick=async()=>{const{error}=await sb.auth.updateUser({password:$('np').value});if(error)$('msg2').textContent=error.message;else load()};
$('out').onclick=()=>sb.auth.signOut();
$('per').onchange=()=>draw();
$('pr').onclick=()=>{$('printarea').innerHTML=$('slip').innerHTML;window.print()};
function draw(){const r=rows[+$('per').value||0];$('slip').innerHTML=r?slip(r.staff,r):''}

/* ---------- Complaint conversations ---------- */
const dt=d=>{const x=new Date(d);return x.toLocaleDateString('en-GB')+' '+x.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
const bub=(cls,who,d,t)=>`<div class="b ${cls}"><div class="bh">${who} &middot; ${dt(d)}</div>${esc(t)}</div>`;
const SYS={resolved:'Payroll marked this as resolved',reopened:'Payroll reopened this complaint',closed_yes:'You closed this complaint: satisfied',closed_no:'You closed this complaint: not satisfied'};
const sysl=m=>`<div class="sys">${SYS[m.kind]||''} &middot; ${dt(m.created_at)}${m.body?`<br>${esc(m.body)}`:''}</div>`;
const tag=c=>c.status==='closed'?(c.satisfied?'<span class="tag yes">Closed &middot; satisfied</span>':'<span class="tag no">Closed &middot; not satisfied</span>'):c.status==='resolved'?'<span class="tag aw">Awaiting your feedback</span>':'<span class="tag op">Open</span>';
function card(c){
 const ms=(c.complaint_messages||[]).slice().sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
 const th=bub('me','You',c.created_at,c.message)+ms.map(m=>m.kind==='msg'?bub(m.sender==='staff'?'me':'them',m.sender==='staff'?'You':'Payroll',m.created_at,m.body):sysl(m)).join('');
 const res=c.status==='resolved';
 const act=c.status==='closed'?(c.satisfied===false?'<p class="note">You said you were not satisfied. Payroll will review this and may reopen it. You can also send a new message above.</p>':''):
 `<textarea data-r rows="2" maxlength="1000" placeholder="Write a reply" aria-label="Reply"></textarea>
<div class="row"><button class="btn p" data-act="reply" data-id="${c.id}">Send reply</button><span class="note tm" aria-live="polite"></span></div>
<details${res?' open':''}><summary>${res?'Payroll says this is resolved. Are you satisfied?':'Close this complaint'}</summary>
<div class="row"><label class="opt"><input type="radio" name="s${c.id}" value="yes"> Satisfied</label><label class="opt"><input type="radio" name="s${c.id}" value="no"> Not satisfied</label></div>
<textarea data-cr rows="2" maxlength="1000" placeholder="Your remark (optional)" aria-label="Closing remark"></textarea>
<div class="row"><button class="btn" data-act="close" data-id="${c.id}">Close complaint</button><span class="note tm" aria-live="polite"></span></div></details>`;
 return `<div class="cmt"><div class="note">${esc(c.period)} &middot; started ${dt(c.created_at)} ${tag(c)}</div><div class="thread">${th}</div>${act}</div>`}
async function loadC(){
 const{data}=await sb.from('complaints').select('*,complaint_messages(*)').eq('staff_id',me.id).order('updated_at',{ascending:false});
 const l=data||[];
 $('cl').innerHTML=l.length?l.map(card).join(''):'<p class="note">No messages yet.</p>'}
$('cs').onclick=async()=>{if(!me)return;const t=$('cmsg').value.trim();if(!t)return cn('Type your message first.');
 const{error}=await sb.from('complaints').insert({staff_id:me.id,period:$('cper').value||'General',message:t});
 if(error)return cn('Could not send. Please try again.');
 $('cmsg').value='';cn('Sent. Payroll will reply below.');loadC()};
$('cl').onclick=async e=>{const b=e.target.closest('[data-act]');if(!b||!me)return;
 const box=b.closest('.cmt'),tm=t=>{b.parentElement.querySelector('.tm').textContent=t};
 if(b.dataset.act==='reply'){
  const t=box.querySelector('[data-r]').value.trim();if(!t)return tm('Type a reply first.');
  b.disabled=true;
  const{error}=await sb.from('complaint_messages').insert({complaint_id:b.dataset.id,sender:'staff',kind:'msg',body:t});
  b.disabled=false;if(error)return tm('Could not send. Please try again.');
  return loadC()}
 if(b.dataset.act==='close'){
  const r=box.querySelector('input[type=radio]:checked');if(!r)return tm('Choose Satisfied or Not satisfied first.');
  if(!confirm('Close this complaint? You will not be able to reply after closing.'))return;
  b.disabled=true;
  const{error}=await sb.from('complaint_messages').insert({complaint_id:b.dataset.id,sender:'staff',kind:r.value==='yes'?'closed_yes':'closed_no',body:box.querySelector('[data-cr]').value.trim()});
  b.disabled=false;if(error)return tm('Could not close. Please try again.');
  return loadC()}};

async function load(){show('me');
 const{data:{user}}=await sb.auth.getUser();
 me=null;
 if(user){const r=await sb.from('staff').select('id,name').eq('user_id',user.id).maybeSingle();me=r.data||null}
 $('cp').classList.toggle('hidden',!me);
 if(!me){rows=[];$('per').innerHTML='';$('none').textContent='No staff record is linked to this sign-in. Contact payroll. (Administrators: use admin.html.)';draw();return}
 const{data}=await sb.from('payslips').select('*,staff(name,gender)').eq('staff_id',me.id).order('created_at',{ascending:false});
 rows=data||[];
 $('per').innerHTML=rows.map((r,i)=>`<option value="${i}">${esc(r.period)}</option>`).join('');
 $('cper').innerHTML=['General',...new Set(rows.map(r=>r.period))].map(p=>`<option>${esc(p)}</option>`).join('');
 $('none').textContent=rows.length?'':'No payslips have been published for you yet.';
 draw();loadC()}
sb.auth.onAuthStateChange((e,s)=>{setTimeout(()=>{if(e==='PASSWORD_RECOVERY')show('rec');else if(s)load();else show('auth')},0)});