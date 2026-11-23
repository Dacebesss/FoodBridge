/* FoodBridge · equipo: al pulsar una persona se abre su ficha con lo que lleva; al volver a pulsar, se cierra. */
(function () {
  "use strict";
  var botones = Array.prototype.slice.call(document.querySelectorAll(".equipo .persona[aria-controls]"));
  botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
      var abrir = boton.getAttribute("aria-expanded") !== "true";
      botones.forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
        document.getElementById(b.getAttribute("aria-controls")).hidden = true;
      });
      if (abrir) {
        boton.setAttribute("aria-expanded", "true");
        document.getElementById(boton.getAttribute("aria-controls")).hidden = false;
      }
    });
  });
})();
