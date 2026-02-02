// ================== ESTADO EN MEMORIA ==================
let gastos = [];
let categorias = new Set();

const resumenTotalEl = document.getElementById("resumenTotal");

// ================== ELEMENTOS ==================
const monthFilterEl  = document.getElementById("monthFilter");
const clearFilterBtn = document.getElementById("clearFilter");

const btnAdd    = document.getElementById("btnAdd");
const modal     = document.getElementById("modal");
const cancelBtn = document.getElementById("cancel");
const saveBtn   = document.getElementById("save");

const dateEl     = document.getElementById("date");
const categoryEl = document.getElementById("category");
const categoryListEl = document.getElementById("categoryList");
const amountEl   = document.getElementById("amount");

const bodyEl        = document.getElementById("gastosBody");
const resumenEl     = document.getElementById("resumen");
const totalGlobalEl = document.getElementById("totalGlobal");

const exportCsvBtn  = document.getElementById("exportCsv");
const exportPdfBtn  = document.getElementById("exportPdf");
const exportJsonBtn = document.getElementById("exportJson");

const importJsonBtn = document.getElementById("importJson");
const importFileEl  = document.getElementById("importFile");

const compareMonthA = document.getElementById("compareMonthA");
const compareMonthB = document.getElementById("compareMonthB");
const compareBtn    = document.getElementById("compareBtn");
const compareResult = document.getElementById("compareResult");

const chartEl = document.getElementById("chartRubro");
let rubroChart = null;

// ================== INIT ==================
dateEl.valueAsDate = new Date();

btnAdd.onclick    = () => modal.classList.remove("hidden");
cancelBtn.onclick = () => modal.classList.add("hidden");

monthFilterEl.onchange = render;
clearFilterBtn.onclick = () => {
  monthFilterEl.value = "";
  render();
};

exportPdfBtn.onclick = () => window.print();

// ================== UTIL ==================
const money = n => "$" + Number(n || 0).toLocaleString("es-CL");

const formatDateCL = iso => {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

// ================== CATEGORÍAS ==================
function rebuildCategoryList() {
  categoryListEl.innerHTML = "";
  [...categorias]
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach(c => {
      categoryListEl.innerHTML += `<option value="${c}">`;
    });
}

// ================== SAVE ==================
saveBtn.onclick = () => {
  const amount = Number(amountEl.value);
  const cat = categoryEl.value.trim();

  if (!dateEl.value || !cat || isNaN(amount) || amount <= 0) {
    alert("Datos inválidos");
    return;
  }

  gastos.push({
    date: dateEl.value,
    category: cat,
    amount
  });

  categorias.add(cat);
  rebuildCategoryList();

  modal.classList.add("hidden");
  amountEl.value = "";
  categoryEl.value = "";
  dateEl.valueAsDate = new Date();

  render();
};

// ================== FILTRO ==================
function getFilteredGastos() {
  let list = [...gastos];

  if (monthFilterEl.value) {
    list = list.filter(g => g.date.startsWith(monthFilterEl.value));
  }

  return list.sort((a, b) => b.date.localeCompare(a.date));
}

// ================== RENDER ==================
function render() {
  const list = getFilteredGastos();

  bodyEl.innerHTML = "";
  resumenEl.innerHTML = "";

  let total = 0;
  const porRubro = {};

  list.forEach((g, i) => {
    total += g.amount;
    porRubro[g.category] = (porRubro[g.category] || 0) + g.amount;

    bodyEl.innerHTML += `
      <tr>
        <td>${formatDateCL(g.date)}</td>
        <td>${g.category}</td>
        <td>${money(g.amount)}</td>
        <td><button class="delete" data-i="${i}">🗑️</button></td>
      </tr>
    `;
  });

  document.querySelectorAll(".delete").forEach(btn => {
    btn.onclick = e => {
      if (!confirm("¿Eliminar gasto?")) return;
      gastos.splice(e.target.dataset.i, 1);
      rebuildFromGastos();
      render();
    };
  });

  // 🔽 RESUMEN POR RUBRO (ORDENADO)
  Object.keys(porRubro)
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach(r => {
      resumenEl.innerHTML += `
        <li>${r}: <strong>${money(porRubro[r])}</strong></li>
      `;
    });

  totalGlobalEl.textContent = money(total);
  renderChart(list);
  buildResumenTotal();
}

// ================== CHART ==================
function renderChart(list) {
  if (rubroChart) rubroChart.destroy();
  if (!list.length) return;

  const map = {};
  list.forEach(g => map[g.category] = (map[g.category] || 0) + g.amount);

  rubroChart = new Chart(chartEl, {
    type: "doughnut",
    data: {
      labels: Object.keys(map),
      datasets: [{ data: Object.values(map) }]
    }
  });
}

// ================== EXPORT JSON ==================
exportJsonBtn.onclick = () => {
  if (!gastos.length) return alert("No hay datos");

  const payload = {
    exportedAt: new Date().toISOString(),
    categorias: [...categorias],
    gastos
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = getBackupFilename();
  a.click();
};

// ================== IMPORT JSON ==================
importJsonBtn.onclick = () => {
  importFileEl.value = "";
  importFileEl.click();
};

importFileEl.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.gastos)) throw "Formato inválido";

      gastos = data.gastos;
      rebuildFromGastos();

      monthFilterEl.value = getLastMonthWithData();
      render();

      alert("Datos cargados en memoria ✔️");
    } catch {
      alert("Error al importar JSON");
    }
  };
  reader.readAsText(file);
};

// ================== HELPERS ==================
function rebuildFromGastos() {
  categorias.clear();
  gastos.forEach(g => categorias.add(g.category));
  rebuildCategoryList();
}

function getBackupFilename() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `gastos_${p(d.getDate())}-${p(d.getMonth()+1)}-${d.getFullYear()}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}.json`;
}

function getLastMonthWithData() {
  if (!gastos.length) return "";
  return gastos
    .slice()
    .sort((a,b)=>b.date.localeCompare(a.date))[0]
    .date.slice(0,7);
}

// ================== COMPARAR ==================
compareBtn.onclick = () => {
  const m1 = compareMonthA.value;
  const m2 = compareMonthB.value;
  if (!m1 || !m2) return alert("Selecciona ambos meses");

  const t = m => gastos
    .filter(g => g.date.startsWith(m))
    .reduce((s,g)=>s+g.amount,0);

  const t1 = t(m1), t2 = t(m2);

  compareResult.innerHTML = `
    <strong>${m1}:</strong> ${money(t1)}<br>
    <strong>${m2}:</strong> ${money(t2)}<br><br>
    ${t1===t2 ? "Mismo gasto" :
      t1>t2 ? `${m1} gastó ${money(t1-t2)} más`
            : `${m2} gastó ${money(t2-t1)} más`}
  `;
};

// ================== RESUMEN HISTÓRICO ==================
function buildResumenTotal() {
  const map = {};

  gastos.forEach(g => {
    map[g.category] = (map[g.category] || 0) + g.amount;
  });

  resumenTotalEl.innerHTML = "";

  Object.keys(map)
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach(r => {
      resumenTotalEl.innerHTML += `
        <li>${r}: <strong>${money(map[r])}</strong></li>
      `;
    });
}

// ================== BOOT ==================
render();
