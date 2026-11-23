/*
  FoodBridge · mapas (Leaflet + mapa de OpenStreetMap, aclarado con CSS)
  ---------------------------------------------------------------------
  · data-modo="elegir" (registro del comercio): al tocar el mapa se coloca la tienda
    y se guardan la latitud y la longitud en los campos ocultos del formulario.
  · data-modo="ver" (panel de la entidad): un punto por cada comercio con comida
    disponible; al tocarlo, su nombre, cuántos lotes tiene y un enlace para verlos.
  Si el mapa no puede cargar (sin internet), el recuadro se oculta y la web sigue igual.
*/
(function () {
  "use strict";
  var caja = document.querySelector(".mapa[data-modo]");
  if (!caja) return;
  if (!window.L) { caja.hidden = true; return; }

  var CENTRO = [40.3576, -3.9010];   // Villaviciosa de Odón
  var mapa = L.map(caja, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(CENTRO, 15);
  // Mapa libre de OpenStreetMap (sin clave). En CSS se le quita color para que encaje con la web.
  // OpenStreetMap exige saber desde qué web se pide el mapa: enviamos solo el dominio
  // (la web, por seguridad, no lo envía por defecto y entonces OSM responde «Access blocked»).
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    referrerPolicy: "strict-origin-when-cross-origin",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);
  mapa.attributionControl.setPrefix(false);

  function icono(texto) {
    return L.divIcon({ className: "pin-mapa", html: "<span>" + (texto || "") + "</span>", iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
  }
  function escapar(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  if (caja.dataset.modo === "elegir") {
    var lat = document.getElementById("id_latitud"), lon = document.getElementById("id_longitud");
    var marca = null;
    function colocar(punto) {
      if (marca) marca.setLatLng(punto); else marca = L.marker(punto, { icon: icono(""), keyboard: false }).addTo(mapa);
      lat.value = punto.lat.toFixed(6); lon.value = punto.lng.toFixed(6);
      caja.classList.add("con-punto");
    }
    if (lat.value && lon.value) { var p = L.latLng(parseFloat(lat.value), parseFloat(lon.value)); colocar(p); mapa.setView(p, 16); }
    mapa.on("click", function (e) { colocar(e.latlng); });
    return;
  }

  // Modo "ver": los comercios llegan en un bloque JSON escrito por Django.
  var datos = document.getElementById("datos-mapa");
  var comercios = datos ? JSON.parse(datos.textContent) : [];
  if (!comercios.length) { caja.hidden = true; return; }
  var grupo = [];
  comercios.forEach(function (c) {
    var m = L.marker([c.lat, c.lon], { icon: icono(c.n), title: c.nombre, alt: c.nombre }).addTo(mapa);
    m.bindPopup(
      "<b>" + escapar(c.nombre) + "</b><br>" + escapar(c.direccion) +
      '<br><a href="#' + c.ancla + '">' + c.n + (c.n === 1 ? " lote disponible" : " lotes disponibles") + " →</a>"
    );
    grupo.push([c.lat, c.lon]);
  });
  if (grupo.length > 1) mapa.fitBounds(grupo, { padding: [40, 40], maxZoom: 16 });
  else mapa.setView(grupo[0], 16);
})();
