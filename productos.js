const form = document.getElementById("productoForm");
const tabla = document.getElementById("tablaProductos");

const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");

let editIndex = null;

setDynamicTitle("Productos");

if (!localStorage.getItem("productos")) {
  saveData("productos", []);
}

function render() {
  const productos = getData("productos");

  tabla.innerHTML = `
    <tr>
      <th>Producto</th>
      <th class="right">Precio</th>
      <th>Acciones</th>
    </tr>
  `;

  productos.forEach((p, i) => {
    tabla.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td class="right monto" data-valor="${p.precio}">$0</td>
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

form.onsubmit = (e) => {
  e.preventDefault();

  const productos = getData("productos");

  const producto = {
    id: Date.now(),
    nombre: nombreInput.value.trim(),
    precio: Number(precioInput.value)
  };

  if (editIndex !== null) {
    producto.id = productos[editIndex]?.id || producto.id;
    productos[editIndex] = producto;
    editIndex = null;
  } else {
    productos.push(producto);
  }

  saveData("productos", productos);
  form.reset();
  render();
};

function editar(i) {
  const p = getData("productos")[i];
  nombreInput.value = p.nombre;
  precioInput.value = p.precio;
  editIndex = i;
}

function eliminar(i) {
  if (!confirm("¿Eliminar este producto?")) return;
  const productos = getData("productos");
  productos.splice(i, 1);
  saveData("productos", productos);
  render();
}

function exportProductosCSV() {
  const productos = getData("productos");
  if (!productos.length) return alert("No hay productos para exportar.");

  const header = ["Producto", "Precio"];
  const rows = productos.map(p => [p.nombre || "", p.precio || 0]);

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))
    .join("\n"); // ✅ línea correcta

  downloadText(`productos_${fileStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

function exportProductosPDF() {
  const productos = getData("productos");
  if (!productos.length) {
    alert("No hay productos para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");

  // ===== ENCABEZADO =====
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
  doc.text("Listado de Productos", 40, 100);

  // ===== TABLA =====
  const body = productos.map(p => [
    p.nombre,
    formatCLP(p.precio)
  ]);

  doc.autoTable({
    startY: 120,
    head: [["Producto", "Precio"]],
    body: body,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [230, 230, 230] },
    columnStyles: {
      1: { halign: "right" }
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
  doc.save(`productos_${fileStamp()}.pdf`);
}

render();
