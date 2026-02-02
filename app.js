// ================== STORAGE ==================
const STORAGE_KEY = "gastos";

// ================== ELEMENTOS ==================
const monthFilterEl  = document.getElementById("monthFilter");
const clearFilterBtn = document.getElementById("clearFilter");

const btnAdd     = document.getElementById("btnAdd");
const modal      = document.getElementById("modal");
const cancelBtn  = document.getElementById("cancel");
const saveBtn    = document.getElementById("save");

const dateEl     = document.getElementById("date");
const categoryEl = document.getElementById("category");
const amountEl   = document.getElementById("amount");

const bodyEl        = document.getElementById("gastosBody");
const resumenEl     = document.getElementById("resumen");
const totalGlobalEl = document.getElementById("totalGlobal");

const exportCsvBtn = document.getElementById("exportCsv");
const exportPdfBtn = document.getElementById("exportPdf");

const chartEl = document.getElementById("chartRubro");
let rubroChart = null;

// ================== INIT UI ==================
dateEl.valueAsDate = new Date();

btnAdd.onclick    = () => modal.classList.remove("hidden");
cancelBtn.onclick = () => modal.classList.add("hidden");

monthFilterEl.onchange = () => render();
clearFilterBtn.onclick = () => {
  monthFilterEl.value = "";
  render();
};

exportPdfBtn.onclick = () => window.print();

// ================== SAVE ==================
saveBtn.onclick = () => {
  const amount = Number(amountEl.value);

  if (!dateEl.value) {
    alert("Falta la fecha");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert("Monto inválido");
    return;
  }

  const gasto = {
    date: dateEl.value,
    category: categoryEl.value,
    amount
  };

  const gastos = load();
  gastos.push(gasto);
  save(gastos);

  modal.classList.add("hidden");
  amountEl.value = "";
  categoryEl.selectedIndex = 0;
  dateEl.valueAsDate = new Date();

  render();
};

// ================== STORAGE HELPERS ==================
function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ================== UTIL ==================
function money(n) {
  const v = Number(n);
  if (isNaN(v)) return "$0";
  return "$" + v.toLocaleString("es-CL");
}

function getFilteredGastos() {
  let gastos = load().filter(
    g => typeof g.amount === "number" && !isNaN(g.amount)
  );

  const month = monthFilterEl.value;
  if (month) {
    gastos = gastos.filter(g => g.date.startsWith(month));
  }

  // 🔽 más reciente primero
  gastos.sort((a, b) => b.date.localeCompare(a.date));

  return gastos;
}

// ================== CHART ==================
function buildRubroData(gastos) {
  const map = {};
  gastos.forEach(g => {
    map[g.category] = (map[g.category] || 0) + g.amount;
  });

  return {
    labels: Object.keys(map),
    values: Object.values(map)
  };
}

function renderChart(gastos) {
  const data = buildRubroData(gastos);

  if (rubroChart) {
    rubroChart.destroy();
    rubroChart = null;
  }

  if (!data.labels.length) return;

  rubroChart = new Chart(chartEl, {
    type: "doughnut",
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: [
          "#4facfe", "#43e97b", "#fa709a", "#fbc531",
          "#9c88ff", "#00cec9", "#e17055", "#fd79a8"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${money(ctx.raw)}`
          }
        }
      }
    }
  });
}

// ================== EXPORT CSV ==================
exportCsvBtn.onclick = () => {
  const gastos = getFilteredGastos();
  if (!gastos.length) {
    alert("No hay datos para exportar");
    return;
  }

  let csv = "\uFEFFFecha;Rubro;Monto\n";
  gastos.forEach(g => {
    csv += `${g.date};${g.category};${g.amount}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `gastos_${monthFilterEl.value || "todos"}.csv`;
  a.click();

  URL.revokeObjectURL(url);
};

// ================== RENDER ==================
function render() {
  const gastos = getFilteredGastos();

  bodyEl.innerHTML = "";
  resumenEl.innerHTML = "";

  let totalGlobal = 0;
  const porRubro = {};

  gastos.forEach(g => {
    totalGlobal += g.amount;
    porRubro[g.category] = (porRubro[g.category] || 0) + g.amount;

    bodyEl.innerHTML += `
      <tr>
        <td>${g.date}</td>
        <td>${g.category}</td>
        <td>${money(g.amount)}</td>
        <td>
          <button class="delete"
            data-date="${g.date}"
            data-category="${g.category}"
            data-amount="${g.amount}">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });

  // eliminar gasto (seguro incluso con filtros)
  document.querySelectorAll(".delete").forEach(btn => {
    btn.onclick = e => {
      if (!confirm("¿Eliminar este gasto?")) return;

      const { date, category, amount } = e.target.dataset;

      let all = load();
      all = all.filter(g =>
        !(g.date === date &&
          g.category === category &&
          g.amount === Number(amount))
      );

      save(all);
      render();
    };
  });

  // resumen
  for (const r in porRubro) {
    resumenEl.innerHTML += `
      <li>${r}: <strong>${money(porRubro[r])}</strong></li>
    `;
  }

  totalGlobalEl.textContent = money(totalGlobal);
  renderChart(gastos);
}

// ================== BOOT (llamado desde pin.js) ==================
window.startApp = function () {
  render();
};

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = () => {
    if (!confirm("¿Cerrar sesión?")) return;

    localStorage.removeItem("personal_unlocked");
    location.reload(); // vuelve a pedir PIN
  };
}

const exportJsonBtn = document.getElementById("exportJson");

exportJsonBtn.onclick = () => {
  const gastos = load();

  if (!gastos.length) {
    alert("No hay datos para guardar");
    return;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    total: gastos.reduce((a, g) => a + g.amount, 0),
    gastos
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = getBackupFilename();
  a.click();

  URL.revokeObjectURL(url);
};

const importJsonBtn  = document.getElementById("importJson");
const importFileEl   = document.getElementById("importFile");

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

      // 🛑 Validaciones mínimas
      if (!data.gastos || !Array.isArray(data.gastos)) {
        throw new Error("Formato inválido (no existe 'gastos')");
      }

      data.gastos.forEach(g => {
        if (
          !g.date ||
          !g.category ||
          typeof g.amount !== "number"
        ) {
          throw new Error("Estructura de gasto inválida");
        }
      });

      if (!confirm("Esto reemplazará los datos actuales. ¿Continuar?")) {
        return;
      }

      // Guardar
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.gastos));
      render();

      alert("Datos importados correctamente ✔️");

    } catch (err) {
      alert("Error al importar el archivo:\n" + err.message);
    }
  };

  reader.readAsText(file); 
};

function getBackupFilename() {
  const d = new Date();

  const pad = n => String(n).padStart(2, "0");

  const fecha = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const hora  = `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;

  return `gastos_${fecha}_${hora}.json`;
}
