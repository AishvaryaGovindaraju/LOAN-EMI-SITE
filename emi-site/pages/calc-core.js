// Shared calculator core for all loan sub-pages
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtN = n => Math.round(n).toLocaleString('en-IN');

function calcEMI(P, annualRate, months) {
  if (!P || !months) return 0;
  if (annualRate === 0) return P / months;
  const r = annualRate / 12 / 100;
  return (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function syncField(field, val) {
  const v = parseFloat(val);
  const map = { amount: ['f_amount','disp_amount',true], rate: ['f_rate','disp_rate',false], tenure: ['f_tenure','disp_tenure',false], fee: ['f_fee','disp_fee',false] };
  const [inputId, dispId, doFmt] = map[field];
  const inp = document.getElementById(inputId);
  const disp = document.getElementById(dispId);
  if (inp) inp.value = v;
  if (disp) disp.textContent = doFmt ? fmtN(v) : v;
  calculate();
}

function syncSlider(field, val) {
  const v = parseFloat(val);
  const map = { amount: 'sl_amount', rate: 'sl_rate', tenure: 'sl_tenure', fee: 'sl_fee' };
  const sl = document.getElementById(map[field]);
  if (sl) sl.value = v;
  const dispMap = { amount: 'disp_amount', rate: 'disp_rate', tenure: 'disp_tenure', fee: 'disp_fee' };
  const disp = document.getElementById(dispMap[field]);
  if (disp) disp.textContent = field === 'amount' ? fmtN(v) : v;
  calculate();
}

function applyRate(rate) {
  const f = document.getElementById('f_rate');
  const sl = document.getElementById('sl_rate');
  const d = document.getElementById('disp_rate');
  if (f) f.value = rate;
  if (sl) sl.value = rate;
  if (d) d.textContent = rate;
  calculate();
}

let amortView = 'yr';
function setAmortView(view, btn) {
  amortView = view;
  document.querySelectorAll('.vtog').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  calculate();
}

function drawDonut(P, I, F) {
  const canvas = document.getElementById('donut');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = P + I + F;
  if (!total) return;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const segs = [{v:P,c:'#6366f1'},{v:I,c:'#f43f5e'},{v:F,c:'#f59e0b'}];
  let start = -Math.PI / 2;
  segs.forEach(({v, c}) => {
    const slice = (v / total) * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    start += slice;
  });
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.56, 0, 2 * Math.PI);
  ctx.fillStyle = '#12151f'; ctx.fill();
}

function buildAmort(P, annualRate, N) {
  const tbody = document.getElementById('amort-body');
  if (!tbody) return;
  const r = annualRate / 12 / 100;
  const emi = calcEMI(P, annualRate, N);
  let balance = P;
  const rows = [];

  if (amortView === 'yr') {
    let yearData = {};
    for (let m = 1; m <= N; m++) {
      const ic = balance * r, pc = emi - ic;
      balance = Math.max(0, balance - pc);
      const yr = Math.ceil(m / 12);
      if (!yearData[yr]) yearData[yr] = {emi:0,prin:0,int:0,bal:0};
      yearData[yr].emi += emi; yearData[yr].prin += pc;
      yearData[yr].int += ic; yearData[yr].bal = balance;
    }
    Object.entries(yearData).forEach(([yr, d]) => {
      const paid = ((P - d.bal) / P * 100).toFixed(0);
      rows.push(`<tr>
        <td><strong>Year ${yr}</strong></td>
        <td>${fmt(d.emi)}</td>
        <td style="color:#6366f1">${fmt(d.prin)}</td>
        <td style="color:#f43f5e">${fmt(d.int)}</td>
        <td>${fmt(d.bal)}</td>
        <td class="progress-cell"><div class="progress-bar-wrap"><div class="progress-bg"><div class="progress-bar" style="width:${Math.min(paid,100)}%"></div></div><span style="font-size:.72rem;color:var(--text2);min-width:32px">${paid}%</span></div></td>
      </tr>`);
    });
  } else {
    const show = Math.min(N, 60);
    for (let m = 1; m <= show; m++) {
      const ic = balance * r, pc = emi - ic;
      balance = Math.max(0, balance - pc);
      const paid = ((P - balance) / P * 100).toFixed(0);
      rows.push(`<tr>
        <td>Month ${m}</td>
        <td>${fmt(emi)}</td>
        <td style="color:#6366f1">${fmt(pc)}</td>
        <td style="color:#f43f5e">${fmt(ic)}</td>
        <td>${fmt(balance)}</td>
        <td class="progress-cell"><div class="progress-bar-wrap"><div class="progress-bg"><div class="progress-bar" style="width:${Math.min(paid,100)}%"></div></div><span style="font-size:.72rem;color:var(--text2);min-width:32px">${paid}%</span></div></td>
      </tr>`);
    }
    if (N > 60) rows.push(`<tr><td colspan="6" class="empty-msg">Showing first 60 of ${N} months</td></tr>`);
  }
  tbody.innerHTML = rows.join('') || `<tr><td colspan="6" class="empty-msg">Adjust sliders above</td></tr>`;
}

function getInsight(P, rate, N, totalInt) {
  const intRatio = (totalInt / P * 100).toFixed(0);
  if (rate > 15) return `⚠️ Rate ${rate}% is high. Reducing by 2% saves approx ${fmt(P * 0.02 * N / 12)}.`;
  if (intRatio > 80) return `📌 You'll pay ${intRatio}% extra as interest. Consider a shorter tenure to reduce this.`;
  if (N <= 12) return `✅ Short tenure — total interest is minimal.`;
  return `💡 Paying 1 extra EMI/year saves ~${fmt(totalInt * 0.08)} and cuts ~${Math.round(N * 0.08)} months off your tenure.`;
}

function calculate() {
  const P = parseFloat(document.getElementById('f_amount')?.value) || 0;
  const rate = parseFloat(document.getElementById('f_rate')?.value) || 0;
  const tenureVal = parseFloat(document.getElementById('f_tenure')?.value) || 0;
  const feeP = parseFloat(document.getElementById('f_fee')?.value) || 0;
  const tenureInYears = document.getElementById('f_tenure')?.dataset.unit === 'mo' ? false : true;
  const N = tenureInYears ? tenureVal * 12 : tenureVal;
  if (!P || !N) return;

  const emi = calcEMI(P, rate, N);
  const totalPay = emi * N;
  const totalInt = totalPay - P;
  const fee = (feeP / 100) * P;
  const totalCost = totalPay + fee;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('res_emi', fmt(emi));
  set('res_p', fmt(P));
  set('res_int', fmt(totalInt));
  set('res_fee', fmt(fee));
  set('res_total', fmt(totalCost));
  set('leg_p', fmt(P));
  set('leg_i', fmt(totalInt));
  set('leg_f', fmt(fee));

  const ins = document.getElementById('insight');
  if (ins) ins.textContent = getInsight(P, rate, N, totalInt);

  drawDonut(P, totalInt, fee);
  buildAmort(P, rate, N);
}

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('nav')?.classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', calculate);

// ===== THEME TOGGLE (shared for all sub-pages) =====
function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  if (btn) btn.textContent = next === 'dark' ? '🌙 Dark' : '☀️ Light';
  localStorage.setItem('theme', next);
}
(function(){
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = saved === 'dark' ? '🌙 Dark' : '☀️ Light';
})();
