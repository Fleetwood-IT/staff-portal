let staff=[],pay={};
const K=['paid_days','gross','bonus','other1','other2','tax','pension','fines'];
const net=r=>num(r.gross)+num(r.bonus)+num(r.other1)+num(r.other2)-num(r.tax)-num(r.pension)-num(r.fines);
const flash=t=>{$('fl').textContent=t};
const show=id=>['auth','app'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
async function boot(){
 const{data:{session}}=await sb.auth.getSession();if(!session)return show('auth');
 const{data}=await sb.from('admins').select('user_id').maybeSingle();
 if(!data){await sb.auth.signOut();$('msg').textContent='This account is not an administrator.';return show('auth')}
 show('app');await loadStaff();await loadPay()}
$('in').onclick=async()=>{const{error}=await sb.auth.signInWithPassword({email:$('em').value.trim().toLowerCase(),password:$('pw').value});if(error)$('msg').textContent='Wrong email or password.';else boot()};
$('out').onclick=async()=>{await sb.auth.signOut();show('auth')};
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{$('tab-s').classList.toggle('hidden',b.dataset.t!=='s');$('tab-p').classList.toggle('hidden',b.dataset.t!=='p');if(b.dataset.t==='p')loadPay()});
async function loadStaff(){const{data}=await sb.from('staff').select('*').order('staff_no');staff=data||[];
 $('st').innerHTML=staff.map((s,i)=>`<tr data-i="${i}"><td>${esc(s.staff_no)}</td><td><input data-k="name" value="${esc(s.name)}"></td><td><select data-k="gender">${['','MALE','FEMALE'].map(o=>`<option${s.gender===o?' selected':''}>${o}</option>`).join('')}</select></td><td><input data-k="email" type="email" value="${esc(s.email)}"></td><td><input data-k="active" type="checkbox"${s.active?' checked':''}></td></tr>`).join('')}
$('st').onchange=async e=>{const tr=e.target.closest('tr'),s=staff[tr.dataset.i],k=e.target.dataset.k;let v=k==='active'?e.target.checked:e.target.value.trim();if(k==='email')v=v?v.toLowerCase():null;
 const{error}=await sb.from('staff').update({[k]:v}).eq('id',s.id);if(error)flash(error.message);else{s[k]=v;flash('Saved')}};
$('ab').onclick=async()=>{const name=$('an').value.trim();if(!name)return flash('Enter a name.');const em=$('ae').value.trim().toLowerCase();
 const{error}=await sb.from('staff').insert({name,gender:$('ag').value,email:em||null});if(error)return flash(error.message);$('an').value=$('ae').value='';flash('Staff added');loadStaff()};
async function loadPay(){const p=$('period').value.trim();if(!p)return;const{data}=await sb.from('payslips').select('*').eq('period',p);pay={};(data||[]).forEach(r=>pay[r.staff_id]=r);
 $('pt').innerHTML=staff.filter(s=>s.active).map(s=>{const r=pay[s.id]||{};return`<tr data-id="${s.id}"><td>${esc(s.name)}</td>${K.map(k=>`<td><input type="number" min="0" step="any" data-k="${k}" value="${num(r[k])}"></td>`).join('')}<td class="net">${ft(net(r))}</td><td>${r.published?'Published':r.id?'Draft':''}</td></tr>`}).join('')}
$('pt').oninput=e=>{const tr=e.target.closest('tr'),r={};tr.querySelectorAll('input').forEach(i=>r[i.dataset.k]=num(i.value));tr.querySelector('.net').textContent=ft(net(r))};
$('ld').onclick=loadPay;
$('sv').onclick=async()=>{const period=$('period').value.trim(),out=[];
 $('pt').querySelectorAll('tr').forEach(tr=>{const o={staff_id:tr.dataset.id,period};let any=!!pay[o.staff_id];tr.querySelectorAll('input').forEach(i=>{o[i.dataset.k]=num(i.value);if(num(i.value))any=true});if(any)out.push(o)});
 if(!out.length)return flash('Nothing to save.');
 const{error}=await sb.from('payslips').upsert(out,{onConflict:'staff_id,period'});flash(error?error.message:'Saved as draft. Press Publish when ready.');loadPay()};
const setPub=async v=>{const{error}=await sb.from('payslips').update({published:v}).eq('period',$('period').value.trim());flash(error?error.message:v?'Published to staff.':'Unpublished.');loadPay()};
$('pub').onclick=()=>confirm('Publish all saved payslips for this period to staff?')&&setPub(true);
$('unp').onclick=()=>setPub(false);
boot();
