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
async function loadC(){
 const{data}=await sb.from('complaints').select('*').eq('staff_id',me.id).order('created_at',{ascending:false});
 const l=data||[];
 $('cl').innerHTML=l.length?l.map(c=>`<div class="cmt"><div class="note">${new Date(c.created_at).toLocaleDateString('en-GB')} &middot; ${esc(c.period)} &middot; <b>${c.status==='resolved'?'Resolved':'Open'}</b></div><p>${esc(c.message)}</p>${c.reply?`<p class="rep"><b>Payroll reply:</b> ${esc(c.reply)}</p>`:''}</div>`).join(''):'<p class="note">No messages yet.</p>'}
$('cs').onclick=async()=>{if(!me)return;const t=$('cmsg').value.trim();if(!t)return cn('Type your message first.');
 const{error}=await sb.from('complaints').insert({staff_id:me.id,period:$('cper').value||'General',message:t});
 if(error)return cn('Could not send. Please try again.');
 $('cmsg').value='';cn('Sent. Payroll will reply here.');loadC()};
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