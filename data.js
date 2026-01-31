function getData(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch (e) { return []; }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value || []));
}

function formatCLP(valor) {
  const n = Number(valor) || 0;
  return "$" + n.toLocaleString("es-CL");
}

function animateNumber(el, toValue, duration = 900) {
  const target = Number(toValue) || 0;
  const currentText = (el.textContent || "").replace(/[^0-9-]/g, "");
  const fromValue = currentText ? Number(currentText) : 0;

  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(fromValue + (target - fromValue) * eased);
    el.textContent = formatCLP(value);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function downloadText(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function fileStamp() {
  const now = new Date();
  const fecha = now.toISOString().slice(0, 10);
  const hora = now.toTimeString().slice(0, 8).replace(/:/g, "-");
  return `${fecha}_${hora}`;
}

function openPrintWindow(title, htmlBody) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Tu navegador bloqueó la ventana emergente. Permite pop-ups para exportar PDF.");
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#222;}
    h1{margin:0 0 8px 0;font-size:20px;text-align:center;}
    .sub{margin:0 0 16px 0;text-align:center;color:#555;font-size:12px;}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;}
    th,td{border:1px solid #ddd;padding:6px;text-align:left;vertical-align:top;}
    th{background:#f2f4f7;}
    .right{text-align:right;}
    .tot{margin-top:12px;display:flex;gap:12px;justify-content:flex-end;font-size:12px;}
    .tot div{min-width:160px;display:flex;justify-content:space-between;border:1px solid #ddd;padding:8px;border-radius:8px;background:#fafafa;}
    .muted{color:#777;}
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}
