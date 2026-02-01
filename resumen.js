/* =========================
   HEADER
   ========================= */

setDynamicTitle("Home");

function renderBusinessHeader() {
  const user = getData("usuario");
  if (!user) return;

  document.getElementById("bhName").textContent =
    user.razonSocial || "";

  document.getElementById("bhGiro").textContent =
    user.giro || "";

  document.getElementById("bhAddress").textContent =
    user.direccion || "";
}

/* =========================
   RESUMEN
   ========================= */

function renderResumen() {
  // 🔒 No renderizar si no hay archivo activo
  if (sessionStorage.getItem("activeFile") !== "true") return;

  const ventas = getData("ventas") || [];
  const gastos = getData("gastos") || [];

  const totalVentas = ventas.reduce((a, b) => a + (b.t || 0), 0);
  const totalGastos = gastos.reduce((a, b) => a + (b.t || 0), 0);
  const resultado   = totalVentas - totalGastos;

  const cont = document.getElementById("resumen");
  if (!cont) return;

  cont.innerHTML = `
    <div class="resumen-item">
      <span>Ventas</span>
      <strong id="vVentas">$0</strong>
    </div>

    <div class="resumen-item">
      <span>Gastos</span>
      <strong id="vGastos">$0</strong>
    </div>

    <div class="divisor"></div>

    <div class="resumen-item resultado ${resultado >= 0 ? "positivo" : "negativo"}">
      <span>Resultado</span>
      <strong id="vResultado">$0</strong>
    </div>
  `;

  requestAnimationFrame(() => {
    animateNumber(document.getElementById("vVentas"), totalVentas, 1200);
    animateNumber(document.getElementById("vGastos"), totalGastos, 1200);
    animateNumber(document.getElementById("vResultado"), resultado, 1500);
  });
}

/* =========================
   INIT APP
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     BOTONES DE SESIÓN
     ========================= */
  document.getElementById("btnExtendSession")
    ?.addEventListener("click", extendSession);

  document.getElementById("btnEndSession")
    ?.addEventListener("click", safeLogout);

  /* =========================
     BIENVENIDA
     ========================= */
  document.getElementById("btnNuevoUsuario")
    ?.addEventListener("click", () => {
      document.getElementById("modalNuevoUsuario")
        ?.classList.remove("hidden");
    });

  document.getElementById("btnCancelar")
    ?.addEventListener("click", () => {
      document.getElementById("modalNuevoUsuario")
        ?.classList.add("hidden");
    });

  document.getElementById("btnCargarDatos")
    ?.addEventListener("click", () => {
      document.getElementById("fileInputWelcome")?.click();
    });

    /* =========================
   CARGAR RESPALDO (BIENVENIDA)
   ========================= */
  document.getElementById("fileInputWelcome")
    ?.addEventListener("change", e => {

      if (!e.target.files || !e.target.files.length) return;

      importBackup(e);   // backup.js
    });

  /* =========================
     CREAR USUARIO
     ========================= */
  document.getElementById("nuevoUsuarioForm")
    ?.addEventListener("submit", e => {
      e.preventDefault();

      const user = {
        razonSocial: razonSocial.value.trim(),
        rut: rut.value.trim(),
        direccion: direccion.value.trim(),
        giro: giro.value.trim(),
        createdAt: Date.now()
      };

      saveData("usuario", user);
      saveData("ventas", []);
      saveData("gastos", []);
      saveData("productos", []);

      // 🔑 archivo activo + sesión válida
      sessionStorage.setItem("activeFile", "true");

      document.getElementById("modalNuevoUsuario")
        ?.classList.add("hidden");

      renderBusinessHeader();
      renderResumen();
      //startSessionTimer();

      enforceAppState();
    });

  /* =========================
   CERRAR SESIÓN (CON RESPALDO)
   ========================= */

  document.getElementById("btnLogout")
    ?.addEventListener("click", () => {
      document.getElementById("modalLogout")
        ?.classList.remove("hidden");
    });

  /* =========================
     ARRANQUE ÚNICO
     ========================= */
  enforceAppState();

  // Si el archivo está activo al arrancar, renderizamos
  if (sessionStorage.getItem("activeFile") === "true") {
    renderBusinessHeader();
    renderResumen();
  }
});
