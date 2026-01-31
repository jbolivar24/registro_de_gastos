const productos = getData("productos") || [];

const form = document.getElementById("ventaForm");
const tablaVentas = document.getElementById("tablaVentas");
const tablaItems = document.getElementById("tablaItems");

const fecha = document.getElementById("fecha");
const factura = document.getElementById("factura");
const cliente = document.getElementById("cliente");

const productoSel = document.getElementById("producto");
const cantidadInput = document.getElementById("cantidad");
const precioInput = document.getElementById("precio");

const netoEl = document.getElementById("neto");
const ivaEl = document.getElementById("iva");
const totalEl = document.getElementById("total");

let items = [];
let editIndex = null;

productos.forEach(p => {
  const opt = document.createElement("option");
  opt.value = p.id;
  opt.textContent = `${p.nombre} (${formatCLP(p.precio)})`;
  productoSel.appendChild(opt);
});

productoSel.onchange = () => {
  const p = productos.find(x => x.id == productoSel.value);
  if (p) precioInput.value = p.precio;
};

document.getElementById("btnAgregarItem").onclick = () => {
  const p = productos.find(x => x.id == productoSel.value);
  const cantidad = Number(cantidadInput.value);
  const precio = Number(precioInput.value);

  if (!p || cantidad <= 0 || precio <= 0) return;

  items.push({
    nombre: p.nombre,
    cantidad,
    precio
  });

  cantidadInput.value = "";
  precioInput.value = "";

  renderItems();
};

function renderItems() {
  tablaItems.innerHTML = `
    <tr>
      <th>Item</th>
      <th>Cantidad</th>
      <th>Precio</th>
      <th>Subtotal</th>
      <th></th>
    </tr>
  `;

  let neto = 0;

  items.forEach((it, i) => {
    const sub = it.cantidad * it.precio;
    neto += sub;

    tablaItems.innerHTML += `
      <tr>
        <td>${it.nombre}</td>
        <td>${it.cantidad}</td>
        <td class="right">${formatCLP(it.precio)}</td>
        <td class="right">${formatCLP(sub)}</td>
        <td>
          <button class="btn-eliminar" onclick="eliminarItem(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });

  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  animateNumber(netoEl, neto, 650);
  animateNumber(ivaEl, iva, 650);
  animateNumber(totalEl, total, 650);
}

function eliminarItem(i) {
  items.splice(i, 1);
  renderItems();
}

form.onsubmit = (e) => {
  e.preventDefault();
  if (items.length === 0) return alert("Agregue al menos un item");

  const ventas = getData("ventas");

  const neto = items.reduce((a, b) => a + b.cantidad * b.precio, 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  const venta = {
    f: fecha.value,
    fa: factura.value,
    c: cliente.value,
    items,
    neto,
    iva,
    t: total
  };

  if (editIndex !== null) {
    ventas[editIndex] = venta;
    editIndex = null;
  } else {
    ventas.push(venta);
  }

  saveData("ventas", ventas);

  form.reset();
  items = [];
  renderItems();
  renderVentas();
};

function renderVentas() {
  const ventas = getData("ventas");

  tablaVentas.innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>Factura</th>
      <th>Cliente</th>
      <th class="right">Neto</th>
      <th class="right">IVA</th>
      <th class="right">Total</th>
      <th>Acciones</th>
    </tr>
  `;

  ventas.forEach((v, i) => {
    tablaVentas.innerHTML += `
      <tr>
        <td>${v.f}</td>
        <td>${v.fa}</td>
        <td>${v.c}</td>
        <td class="monto right" data-valor="${v.neto}">$0</td>
        <td class="monto right" data-valor="${v.iva}">$0</td>
        <td class="monto right" data-valor="${v.t}">$0</td>
        <td>
          <button class="btn-editar" onclick="editar(${i})">✏️</button>
          <button class="btn-eliminar" onclick="eliminar(${i})">🗑️</button>
          <button class="btn-editar" onclick="verDetalle(${i})">👁️</button>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll(".monto").forEach(td => {
    animateNumber(td, Number(td.dataset.valor), 400);
  });
}

function eliminar(i) {
  if (!confirm("¿Eliminar esta venta?")) return;
  const ventas = getData("ventas");
  ventas.splice(i, 1);
  saveData("ventas", ventas);
  renderVentas();
}

function editar(i) {
  const ventas = getData("ventas");
  const v = ventas[i];

  fecha.value = v.f;
  factura.value = v.fa;
  cliente.value = v.c;
  items = [...(v.items || [])];

  editIndex = i;
  renderItems();
}

function verDetalle(i) {
  const v = getData("ventas")[i];
  const body = document.getElementById("modalBody");

  let html = "";

  (v.items || []).forEach(it => {
    html += `
      <div class="modal-body-item">
        <span>${it.nombre} (${it.cantidad})</span>
        <span>${formatCLP(it.cantidad * it.precio)}</span>
      </div>
    `;
  });

  html += `
    <div class="modal-total">
      <div class="modal-body-item">
        <span>Neto</span>
        <span>${formatCLP(v.neto)}</span>
      </div>
      <div class="modal-body-item">
        <span>IVA 19%</span>
        <span>${formatCLP(v.iva)}</span>
      </div>
      <div class="modal-body-item">
        <span>Total</span>
        <span>${formatCLP(v.t)}</span>
      </div>
    </div>
  `;

  body.innerHTML = html;
  document.getElementById("modalDetalle").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modalDetalle").classList.add("hidden");
}

function exportVentasCSV() {
  const ventas = getData("ventas");
  if (!ventas.length) return alert("No hay ventas para exportar.");

  const header = ["Fecha","Factura","Cliente","Neto","IVA","Total","Items"];
  const rows = ventas.map(v => {
    const itemsTxt = (v.items || []).map(it => `${it.nombre} x${it.cantidad} @${it.precio}`).join(" | ");
    return [v.f||"", v.fa||"", v.c||"", v.neto||0, v.iva||0, v.t||0, itemsTxt];
  });

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(","))
    .join("\n");

  downloadText(`ventas_${fileStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

function exportVentasPDF() {
  const ventas = getData("ventas");
  if (!ventas.length) return alert("No hay ventas para exportar.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4"); // horizontal

  // ===== HEADER =====
  doc.setFontSize(14);
  doc.text("JUAN DOMINGO SIMONETTI QUEZADA", 40, 40);

  doc.setFontSize(10);
  doc.text("COMPRA Y VENTA DE PROD DE PANADERIA Y PA", 40, 58);
  doc.text(
    "GAMERO 1803 1815 EX 2303 JA RIOS · INDEPENDENCIA · STGO",
    40,
    72
  );

  doc.setFontSize(12);
  doc.text("Reporte de Ventas", 40, 100);

  // ===== TABLA =====
  const body = ventas.map(v => [
    v.f || "",
    v.fa || "",
    v.c || "",
    formatCLP(v.neto || 0),
    formatCLP(v.iva || 0),
    formatCLP(v.t || 0),
    (v.items || []).map(it => `${it.nombre} (${it.cantidad})`).join(", ")
  ]);

  doc.autoTable({
    startY: 120,
    head: [[
      "Fecha",
      "Factura",
      "Cliente",
      "Neto",
      "IVA",
      "Total",
      "Detalle"
    ]],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 220, 220] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" }
    }
  });

  // ===== FOOTER =====
  const y = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-CL")}`,
    40,
    y
  );

  // ⬇️ DESCARGA DIRECTA
  doc.save(`ventas_${fileStamp()}.pdf`);
}

renderVentas();
