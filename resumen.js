const ventas = getData("ventas");
const gastos = getData("gastos");

const totalVentas = ventas.reduce((a, b) => a + (b.t || 0), 0);
const totalGastos = gastos.reduce((a, b) => a + (b.t || 0), 0);
const resultado = totalVentas - totalGastos;

const cont = document.getElementById("resumen");

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
  requestAnimationFrame(() => {
    animateNumber(document.getElementById("vVentas"), totalVentas, 1200);
    animateNumber(document.getElementById("vGastos"), totalGastos, 1200);
    animateNumber(document.getElementById("vResultado"), resultado, 1500);
  });
});
