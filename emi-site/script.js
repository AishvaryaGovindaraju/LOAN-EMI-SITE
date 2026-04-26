// ===== BANK DATA =====
const BANKS = {
  home: [
    {name:'SBI',rate:8.50,color:'#2563eb'},{name:'HDFC',rate:8.70,color:'#dc2626'},
    {name:'ICICI',rate:8.75,color:'#d97706'},{name:'Axis',rate:8.75,color:'#7c3aed'},
    {name:'Kotak',rate:8.75,color:'#059669'},{name:'PNB',rate:8.50,color:'#0891b2'},
    {name:'BOB',rate:8.60,color:'#db2777'},{name:'Canara',rate:8.65,color:'#65a30d'}
  ],
  personal: [
    {name:'SBI',rate:11.00,color:'#2563eb'},{name:'HDFC',rate:10.50,color:'#dc2626'},
    {name:'ICICI',rate:10.75,color:'#d97706'},{name:'Axis',rate:10.49,color:'#7c3aed'},
    {name:'Kotak',rate:10.99,color:'#059669'},{name:'Bajaj',rate:13.00,color:'#0891b2'}
  ],
  car: [
    {name:'SBI',rate:9.15,color:'#2563eb'},{name:'HDFC',rate:9.00,color:'#dc2626'},
    {name:'ICICI',rate:9.10,color:'#d97706'},{name:'Axis',rate:9.20,color:'#7c3aed'},
    {name:'Kotak',rate:8.99,color:'#059669'},{name:'BOB',rate:9.15,color:'#db2777'}
  ],
  education: [
    {name:'SBI',rate:8.15,color:'#2563eb'},{name:'PNB',rate:8.55,color:'#0891b2'},
    {name:'Canara',rate:8.50,color:'#65a30d'},{name:'Axis',rate:13.70,color:'#7c3aed'},
    {name:'HDFC',rate:9.50,color:'#dc2626'},{name:'ICICI',rate:11.00,color:'#d97706'}
  ]
};

// ===== STATE =====
let loanType = 'home';
let tenureMode = 'yr'; // 'yr' or 'mo'
let amortView = 'yr';

// ===== HELPERS =====
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtN = n => Math.round(n).toLocaleString('en-IN');
const getVal = id => parseFloat(document.getElementById(id)?.value) || 0;

function calcEMI(P, annualRate, months) {
  if (!P || !months) return 0;
  if (annualRate === 0) return P / months;
  const r = annualRate / 12 / 100;
  return (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ===== SYNC SLIDERS & INPUTS =====
function syncField(field, val) {
  const v = parseFloat(val);
  if (field === 'amount') {
    document.getElementById('f_amount').value = v;
    document.getElementById('disp_amount').textContent = fmtN(v);
  } else if (field === 'rate') {
    document.getElementById('f_rate').value = v;
    document.getElementById('disp_rate').textContent = v;
  } else if (field === 'tenure') {
    document.getElementById('f_tenure').value = v;
    document.getElementById('disp_tenure').textContent = v;
  } else if (field === 'fee') {
    document.getElementById('f_fee').value = v;
    document.getElementById('disp_fee').textContent = v;
  }
  calculate();
}

function syncSlider(field, val) {
  const v = parseFloat(val);
  if (field === 'amount') {
    document.getElementById('sl_amount').value = v;
    document.getElementById('disp_amount').textContent = fmtN(v);
  } else if (field === 'rate') {
    document.getElementById('sl_rate').value = v;
    document.getElementById('disp_rate').textContent = v;
  } else if (field === 'tenure') {
    const max = tenureMode === 'yr' ? 30 : 360;
    document.getElementById('sl_tenure').max = max;
    document.getElementById('sl_tenure').value = v;
    document.getElementById('disp_tenure').textContent = v;
  } else if (field === 'fee') {
    document.getElementById('sl_fee').value = v;
    document.getElementById('disp_fee').textContent = v;
  }
  calculate();
}

// ===== LOAN TYPE =====
function setLoanType(type, btn) {
  loanType = type;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Set default rate, amount, tenure for this loan type
  const defaults = {
    home:      { rate: 8.50, amount: 5000000, tenure: 20, fee: 0.5, slMax: 50000000, tenMax: 30 },
    personal:  { rate: 11.0, amount: 300000,  tenure: 3,  fee: 2.0, slMax: 5000000,  tenMax: 7  },
    car:       { rate: 9.15, amount: 600000,  tenure: 5,  fee: 1.0, slMax: 5000000,  tenMax: 8  },
    education: { rate: 8.15, amount: 1000000, tenure: 10, fee: 0.0, slMax: 7500000,  tenMax: 15 }
  };
  const d = defaults[type];
  const setInp = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setInp('f_rate', d.rate);   setInp('sl_rate', d.rate);   setTxt('disp_rate', d.rate);
  setInp('f_amount', d.amount); setInp('sl_amount', d.amount); setTxt('disp_amount', Math.round(d.amount).toLocaleString('en-IN'));
  setInp('f_tenure', d.tenure); setInp('sl_tenure', d.tenure); setTxt('disp_tenure', d.tenure);
  setInp('f_fee', d.fee);     setInp('sl_fee', d.fee);     setTxt('disp_fee', d.fee);

  // Update slider maxes
  const sl_a = document.getElementById('sl_amount'); if (sl_a) sl_a.max = d.slMax;
  const sl_t = document.getElementById('sl_tenure'); if (sl_t) sl_t.max = d.tenMax;

  renderQuickRates();
  calculate();
}

// ===== TENURE MODE =====
function setTenureMode(mode) {
  tenureMode = mode;
  document.getElementById('btn_yr')?.classList.toggle('active', mode === 'yr');
  document.getElementById('btn_mo')?.classList.toggle('active', mode === 'mo');
  const unit = document.getElementById('tenure_unit');
  if (unit) unit.textContent = mode === 'yr' ? 'Yrs' : 'Mo';
  const sl = document.getElementById('sl_tenure');
  if (sl) {
    if (mode === 'yr') { sl.max = 30; sl.step = 1; }
    else { sl.max = 360; sl.step = 1; }
  }
  calculate();
}

// ===== AMORT VIEW =====
function setAmortView(view, btn) {
  amortView = view;
  document.querySelectorAll('.vtog').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  calculate();
}

// ===== QUICK RATES =====
function renderQuickRates() {
  const container = document.getElementById('qr-chips');
  if (!container) return;
  const banks = BANKS[loanType] || BANKS.home;
  container.innerHTML = banks.map(b =>
    `<button class="chip" onclick="applyRate(${b.rate})" style="border-left:3px solid ${b.color}">${b.name} ${b.rate}%</button>`
  ).join('');
}

function applyRate(rate) {
  const f = document.getElementById('f_rate');
  const sl = document.getElementById('sl_rate');
  if (f) f.value = rate;
  if (sl) sl.value = rate;
  document.getElementById('disp_rate').textContent = rate;
  calculate();
}

// ===== DONUT CHART =====
function drawDonut(P, I, F) {
  const canvas = document.getElementById('donut');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = P + I + F;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const segs = [
    {v: P, c: '#6366f1'},
    {v: I, c: '#f43f5e'},
    {v: F, c: '#f59e0b'}
  ];
  let start = -Math.PI / 2;
  segs.forEach(({v, c}) => {
    const slice = (v / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
    start += slice;
  });
  // hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.56, 0, 2 * Math.PI);
  ctx.fillStyle = '#12151f';
  ctx.fill();
}

// ===== AMORTIZATION =====
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
      const intComp = balance * r;
      const prinComp = emi - intComp;
      balance = Math.max(0, balance - prinComp);
      const yr = Math.ceil(m / 12);
      if (!yearData[yr]) yearData[yr] = {emi: 0, prin: 0, int: 0, bal: 0};
      yearData[yr].emi += emi;
      yearData[yr].prin += prinComp;
      yearData[yr].int += intComp;
      yearData[yr].bal = balance;
    }
    Object.entries(yearData).forEach(([yr, d]) => {
      const paid = ((P - d.bal) / P) * 100;
      rows.push(`<tr>
        <td><strong>Year ${yr}</strong></td>
        <td>${fmt(d.emi)}</td>
        <td style="color:#6366f1">${fmt(d.prin)}</td>
        <td style="color:#f43f5e">${fmt(d.int)}</td>
        <td>${fmt(d.bal)}</td>
        <td class="progress-cell">
          <div class="progress-bar-wrap">
            <div class="progress-bg"><div class="progress-bar" style="width:${Math.min(paid,100).toFixed(0)}%"></div></div>
            <span style="font-size:.72rem;color:var(--text2);min-width:32px">${paid.toFixed(0)}%</span>
          </div>
        </td>
      </tr>`);
    });
  } else {
    const show = Math.min(N, 60); // limit to 60 months for performance
    for (let m = 1; m <= show; m++) {
      const intComp = balance * r;
      const prinComp = emi - intComp;
      balance = Math.max(0, balance - prinComp);
      const paid = ((P - balance) / P) * 100;
      rows.push(`<tr>
        <td>Month ${m}</td>
        <td>${fmt(emi)}</td>
        <td style="color:#6366f1">${fmt(prinComp)}</td>
        <td style="color:#f43f5e">${fmt(intComp)}</td>
        <td>${fmt(balance)}</td>
        <td class="progress-cell">
          <div class="progress-bar-wrap">
            <div class="progress-bg"><div class="progress-bar" style="width:${Math.min(paid,100).toFixed(0)}%"></div></div>
            <span style="font-size:.72rem;color:var(--text2);min-width:32px">${paid.toFixed(0)}%</span>
          </div>
        </td>
      </tr>`);
    }
    if (N > 60) rows.push(`<tr><td colspan="6" class="empty-msg">Showing first 60 months of ${N}</td></tr>`);
  }

  tbody.innerHTML = rows.join('') || `<tr><td colspan="6" class="empty-msg">No data</td></tr>`;
}

// ===== INSIGHT GENERATOR =====
function getInsight(P, annualRate, N, totalInt, fee) {
  const intRatio = (totalInt / P * 100).toFixed(0);
  if (annualRate > 14) return `⚠️ Rate ${annualRate}% is high. Reducing by 2% saves approx ${fmt(P * 0.02 * N / 12)}.`;
  if (intRatio > 80) return `📌 You'll pay ${intRatio}% extra as interest. Consider a shorter tenure.`;
  if (N <= 12) return `✅ Short tenure — total interest is minimal.`;
  return `💡 Paying 1 extra EMI/year can save ~${fmt(totalInt * 0.08)} and cut tenure by ~${Math.round(N * 0.08)} months.`;
}

// ===== MAIN CALCULATE =====
function calculate() {
  const P = getVal('f_amount');
  const rate = getVal('f_rate');
  const rawTenure = getVal('f_tenure');
  const feePercent = getVal('f_fee');

  const N = tenureMode === 'yr' ? rawTenure * 12 : rawTenure;
  if (!P || !N) return;

  const emi = calcEMI(P, rate, N);
  const totalPay = emi * N;
  const totalInt = totalPay - P;
  const fee = (feePercent / 100) * P;
  const totalCost = totalPay + fee;

  // Update DOM
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('res_emi', fmt(emi));
  set('res_p', fmt(P));
  set('res_int', fmt(totalInt));
  set('res_fee', fmt(fee));
  set('res_total', fmt(totalCost));
  set('leg_p', fmt(P));
  set('leg_i', fmt(totalInt));
  set('leg_f', fmt(fee));

  const ins = document.getElementById('insight');
  if (ins) ins.textContent = getInsight(P, rate, N, totalInt, fee);

  drawDonut(P, totalInt, fee);
  buildAmort(P, rate, N);
}

// ===== HAMBURGER =====
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('nav')?.classList.toggle('open');
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderQuickRates();
  calculate();
});

// ===== SHARED EXPORTS for sub-pages =====
window.BANKS = BANKS;
window.fmt = fmt;
window.calcEMI = calcEMI;
window.getVal = getVal;
