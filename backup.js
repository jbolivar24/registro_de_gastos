function exportBackup() {
  const data = {
    ventas: getData("ventas"),
    gastos: getData("gastos"),
    productos: getData("productos")
  };

  const filename = `respaldo_${fileStamp()}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const r = new FileReader();
  r.onload = () => {
    const d = JSON.parse(r.result);
    if (d.ventas) saveData("ventas", d.ventas);
    if (d.gastos) saveData("gastos", d.gastos);
    if (d.productos) saveData("productos", d.productos);
    location.reload();
  };
  r.readAsText(file);
}
