/* FoodBridge en directo · página del móvil: elegir alimento, cantidad y enviar al puente. */
(function () {
  "use strict";
  var form = document.getElementById("form-directo");
  if (!form) return;
  var unidades = 6;
  var salida = document.getElementById("dm-unidades"), kg = document.getElementById("dm-kg");
  var estado = document.getElementById("dm-estado"), boton = document.getElementById("dm-enviar");
  var hecho = document.getElementById("dm-hecho"), lote = document.getElementById("dm-lote");

  function pintar() {
    var elegido = form.querySelector("[name=producto]:checked");
    var total = unidades * parseFloat(elegido.dataset.kg);
    salida.textContent = unidades;
    kg.textContent = "≈ " + total.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " kg";
  }
  document.getElementById("dm-menos").addEventListener("click", function () { unidades = Math.max(1, unidades - 1); pintar(); });
  document.getElementById("dm-mas").addEventListener("click", function () { unidades = Math.min(20, unidades + 1); pintar(); });
  form.querySelectorAll("[name=producto]").forEach(function (r) { r.addEventListener("change", pintar); });
  pintar();

  // El nombre del comercio se recuerda en este móvil para no escribirlo en cada envío.
  var campoComercio = document.getElementById("dm-comercio");
  try { campoComercio.value = localStorage.getItem("fb-comercio") || ""; } catch (e) { /* modo privado */ }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var comercio = campoComercio.value.trim();
    if (comercio.length < 2) {
      campoComercio.parentNode.classList.add("con-error");
      estado.textContent = "Escribe el nombre de tu comercio."; estado.className = "dm-estado error";
      campoComercio.focus();
      return;
    }
    campoComercio.parentNode.classList.remove("con-error");
    try { localStorage.setItem("fb-comercio", comercio); } catch (e) { /* modo privado */ }
    boton.disabled = true;
    estado.textContent = "Cargando la furgoneta…"; estado.className = "dm-estado";
    try {
      var r = await fetch(form.dataset.enviar, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": form.querySelector("[name=csrfmiddlewaretoken]").value },
        body: JSON.stringify({ comercio: comercio, producto: form.querySelector("[name=producto]:checked").value, unidades: unidades })
      });
      var datos = await r.json();
      if (!datos.ok) throw new Error(datos.error || "No se ha podido enviar.");
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      lote.textContent = datos.texto;
      form.hidden = true; hecho.hidden = false; estado.textContent = "";
      document.getElementById("dm-otra").focus();
    } catch (err) {
      estado.textContent = err.message === "Failed to fetch" ? "Sin conexión. Prueba otra vez." : err.message;
      estado.className = "dm-estado error";
    } finally {
      boton.disabled = false;
    }
  });
  document.getElementById("dm-otra").addEventListener("click", function () { hecho.hidden = true; form.hidden = false; boton.focus(); });
})();
