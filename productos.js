// ================= ELEMENTOS =================
const form = document.getElementById("productoForm");
const tabla = document.getElementById("tablaProductos");

const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");

// ================= DATOS =================
const usuario = getData("usuario") || {};

let editIndex = null;

setDynamicTitle("Productos");

// Inicialización segura
if (!localStorage.getItem("productos")) {
  saveData("productos", []);
}

// ================= RENDER =================
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

// ================= GUARDAR =================
form.onsubmit = (e) => {
  e.preventDefault();

  const nombre = nombreInput.value.trim();
  const precio = Number(precioInput.value);

  if (!nombre || precio <= 0) return;

  const productos = getData("productos");

  const producto = {
    id: Date.now(),
    nombre,
    precio
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

// ================= ACCIONES =================
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

// ================= EXPORT CSV =================
function exportProductosCSV() {
  const productos = getData("productos");
  if (!productos.length) return alert("No hay productos para exportar.");

  const header = ["Producto", "Precio"];
  const rows = productos.map(p => [p.nombre || "", p.precio || 0]);

  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  downloadText(`productos_${fileStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

// ================= EXPORT PDF =================
function exportProductosPDF() {
  const productos = getData("productos");
  if (!productos.length) {
    alert("No hay productos para exportar.");
    return;
  }

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
  doc.text("Listado de Productos", 40, 100);

  // ===== TABLA =====
  const body = productos.map(p => [
    p.nombre,
    formatCLP(p.precio)
  ]);

  doc.autoTable({
    startY: 120,
    head: [["Producto", "Precio"]],
    body,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [230, 230, 230] },
    columnStyles: {
      1: { halign: "right" }
    }
  });

  doc.setFontSize(9);
  doc.text(
    `Generado: ${new Date().toLocaleString("es-CL")}`,
    40,
    doc.lastAutoTable.finalY + 20
  );

  doc.save(`productos_${fileStamp()}.pdf`);
}

// ================= INIT =================
render();
