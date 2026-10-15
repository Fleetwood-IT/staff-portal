let rows=[];
const msg=t=>$('msg').textContent=t;
const show=id=>['auth','rec','me'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
const creds=()=>({email:$('em').value.trim().toLowerCase(),password:$('pw').value});
const home=()=>location.href.split('#')[0].split('?')[0];
$('in').onclick=async()=>{const{error}=await sb.auth.signInWithPassword(creds());msg(error?'Wrong email or password, or the email is not confirmed yet.':'')};
$('up').onclick=async()=>{const c=creds();if(!c.email||c.password.length<8)return msg('Enter your email and a password of at least 8 characters, then press this button.');
 const{error}=await sb.auth.signUp({...c,options:{emailRedirectTo:home()}});
 msg(error?'Could not create the account. Payroll must register this email first, and you may already have set a password (use Forgot password).':'Check your email and click the confirmation link, then sign in.')};
$('fg').onclick=async()=>{const e=$('em').value.trim().toLowerCase();if(!e)return msg('Enter your email first.');await sb.auth.resetPasswordForEmail(e,{redirectTo:home()});msg('If this email is registered, a reset link has been sent.')};
$('sv').onclick=async()=>{const{error}=await sb.auth.updateUser({password:$('np').value});if(error)$('msg2').textContent=error.message;else load()};
$('out').onclick=()=>sb.auth.signOut();
$('per').onchange=()=>draw();
$('pr').onclick=()=>{$('printarea').innerHTML=$('slip').innerHTML;window.print()};
function draw(){const r=rows[+$('per').value||0];$('slip').innerHTML=r?slip(r.staff,r):''}
async function load(){show('me');
 const{data}=await sb.from('payslips').select('*,staff(name,gender)').order('created_at',{ascending:false});
 rows=data||[];$('per').innerHTML=rows.map((r,i)=>`<option value="${i}">${esc(r.period)}</option>`).join('');
 $('none').textContent=rows.length?'':'No payslips have been published for you yet.';draw()}
sb.auth.onAuthStateChange((e,s)=>{setTimeout(()=>{if(e==='PASSWORD_RECOVERY')show('rec');else if(s)load();else show('auth')},0)});
