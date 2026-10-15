// Paste your own values from Supabase: Project Settings > API
const SUPABASE_URL='https://llwkigrwbpuqiucqnddb.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsd2tpZ3J3YnB1cWl1Y3FuZGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTgxODUsImV4cCI6MjEwNzQ3NDE4NX0.YKWDmGQ_ozbPs7xwNe4fwtvkQn60TG6zSNJG7P_p0qk'; // anon/public key only. NEVER the service_role key.
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=i=>document.getElementById(i),num=v=>Number(v)||0;
const f=n=>num(n)?num(n).toLocaleString('en-NG'):'',ft=n=>num(n).toLocaleString('en-NG');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function slip(s,p){
 const tp=num(p.gross)+num(p.bonus)+num(p.other1)+num(p.other2),td=num(p.tax)+num(p.pension)+num(p.fines);
 const R=[['Gross:',p.gross,'Tax:',p.tax],['Bonus:',p.bonus,'Pension:',p.pension],['Other payment:',p.other1,'Fines:',p.fines],['Other payment:',p.other2,'','']];
 return `<div class="ps"><div class="hd"><div class="lg"><img src="logo.png" alt="Fleetwood Lending"></div><div class="co">FLEETWOOD LENDING LIMITED</div></div>
<div class="pr">Payslip For the Month of ${esc(p.period)}</div>
<table><tr><td><b>Employee Name:</b></td><td>${esc(s.name)}</td><td><b>Paid Days:</b></td><td class="r">${esc(p.paid_days)}</td></tr><tr><td><b>Gender:</b></td><td>${esc(s.gender)}</td><td></td><td></td></tr></table>
<table class="pay"><tr><th>Earnings</th><th>Amount</th><th>Deductions</th><th>Amount</th></tr>
${R.map(r=>`<tr><td>${r[0]}</td><td class="r">${f(r[1])}</td><td>${r[2]}</td><td class="r">${f(r[3])}</td></tr>`).join('')}
<tr class="tot"><td>Total Payment</td><td class="r">${ft(tp)}</td><td>Total Deductions</td><td class="r">${ft(td)}</td></tr></table>
<table class="nt"><tr><td><b>Payable Amount:</b></td><td>${ft(tp-td)}</td></tr></table></div>`}
