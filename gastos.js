// ================= ELEMENTOS =================
const f = document.getElementById("gastoForm");
const t = document.getElementById("tablaGastos");

const gastoDesde = document.getElementById("gastoDesde");
const gastoHasta = document.getElementById("gastoHasta");
const btnFiltrarGastos = document.getElementById("btnFiltrarGastos");

const fecha = document.getElementById("fecha");
const tipo = document.getElementById("tipo");
const netoInput = document.getElementById("neto");

// ================= DATOS =================
const usuario = getData("usuario") || {};

let gastosFiltrados = null;
let editIndex = null;

setDynamicTitle("Gastos");

// ================= RENDER =================
function render() {
  const allGastos = getData("gastos");
  const gastos = gastosFiltrados || allGastos;

  t.innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>Tipo</th>
      <th class="right">Neto</th>
      <th class="right">IVA</th>
      <th class="right">Total</th>
      <th>Acciones</th>
    </tr>
  `;

  gastos.forEach((g, i) => {
    const neto = Math.round((g.t || 0) / 1.19);
    const iva  = (g.t || 0) - neto;

    t.innerHTML += `
      <tr>
        <td>${g.f}</td>
        <td>${g.ti}</td>
        <td class="monto right" data-valor="${neto}">$0</td>
        <td class="monto right" data-valor="${iva}">$0</td>
        <td class="monto right" data-valor="${g.t}">$0</td>
        <td>
          <button class="btn-editar" onclick="editar(${i})">✏️</button>
          <button class="btn-eliminar" onclick="eliminar(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll(".monto").forEach(td => {
    animateNumber(td, Number(td.dataset.valor), 400);
  });
}

// ================= FILTRO =================
btnFiltrarGastos.onclick = () => {
  if (!gastoDesde.value || !gastoHasta.value) {
    alert("Seleccione ambas fechas");
    return;
  }

  gastosFiltrados = filterByDateRange(
    getData("gastos"),
    gastoDesde.value,
    gastoHasta.value
  );

  render();
};

// ================= GUARDAR =================
f.onsubmit = (e) => {
  e.preventDefault();

  const neto = Number(netoInput.value);
  if (neto <= 0) return;

  const total = Math.round(neto * 1.19);
  const gastos = getData("gastos");

  const gasto = {
    f: fecha.value,
    ti: tipo.value,
    t: total
  };

  if (editIndex !== null) {
    gastos[editIndex] = gasto;
    editIndex = null;
  } else {
    gastos.push(gasto);
  }

  saveData("gastos", gastos);
  f.reset();
  render();
};

// ================= ACCIONES =================
function eliminar(i) {
  if (!confirm("¿Eliminar este gasto?")) return;
  const gastos = getData("gastos");
  gastos.splice(i, 1);
  saveData("gastos", gastos);
  render();
}

function editar(i) {
  const g = getData("gastos")[i];

  fecha.value = g.f;
  tipo.value = g.ti;
  netoInput.value = Math.round((g.t || 0) / 1.19);

  editIndex = i;
}

// ================= EXPORT CSV =================
function exportGastosCSV() {
  const gastos = getData("gastos");
  if (!gastos.length) return alert("No hay gastos para exportar.");

  const header = ["Fecha", "Tipo", "Neto", "IVA", "Total"];
  const rows = gastos.map(g => {
    const neto = Math.round((g.t || 0) / 1.19);
    const iva  = (g.t || 0) - neto;
    return [g.f || "", g.ti || "", neto, iva, g.t || 0];
  });

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  downloadText(`gastos_${fileStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

// ================= EXPORT PDF =================
function exportGastosPDF() {
  const gastos = getData("gastos");
  if (!gastos.length) return alert("No hay gastos para exportar.");

  if (!usuario.razonSocial) {
    alert("Complete los datos del negocio antes de exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");

  // ===== HEADER DINÁMICO =====
  doc.setFontSize(14);
  doc.text(usuario.razonSocial, 40, 40);

  doc.setFontSize(10);
  doc.text(usuario.giro || "", 40, 58);
  doc.text(usuario.direccion || "", 40, 72);

  doc.setFontSize(12);
  doc.text("Reporte de Gastos", 40, 100);

  // ===== TABLA =====
  const body = gastos.map(g => {
    const neto = Math.round((g.t || 0) / 1.19);
    const iva  = (g.t || 0) - neto;
    return [
      g.f || "",
      g.ti || "",
      formatCLP(neto),
      formatCLP(iva),
      formatCLP(g.t || 0)
    ];
  });

  doc.autoTable({
    startY: 120,
    head: [["Fecha", "Tipo", "Neto", "IVA", "Total"]],
    body,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 220, 220] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" }
    }
  });

  doc.setFontSize(9);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-CL")}`,
    40,
    doc.lastAutoTable.finalY + 20
  );

  doc.save(`gastos_${fileStamp()}.pdf`);
}

// ================= INIT =================
render();
