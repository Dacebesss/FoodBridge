/*
  FoodBridge · escena del puente
  ------------------------------
  Aparece al tocar Villaviciosa de Odón en la Tierra (evento "foodbridge:cruzar").
  Un puente colgante (estilo Golden Gate) une el comercio (izquierda) con la entidad
  social (derecha). Por él cruzan furgonetas de reparto con el logo de FoodBridge.
  Tres furgonetas llevan una etiqueta y, al tocarlas, abren su capítulo:
    · El problema        · Nuestro objetivo        · Cómo funciona
  La cámara se mueve hacia una parte del puente distinta para cada capítulo.
  Las etiquetas son botones normales: también funcionan con teclado y lector de pantalla.
*/
(function () {
  "use strict";
  var escenaPuente = document.getElementById("escena-puente");
  var escenaTierra = document.getElementById("inicio");
  var lienzo = document.getElementById("puente");
  if (!escenaPuente || !lienzo) return;
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var etiquetas = Array.prototype.slice.call(escenaPuente.querySelectorAll(".furgo-etq"));
  var paneles = {
    problema: document.getElementById("cap-problema"),
    objetivo: document.getElementById("cap-objetivo"),
    como: document.getElementById("cap-como")
  };
  var pista = document.getElementById("pista-puente");
  var abierto = null, mostrado = false, tres = null;

  /* =========================================================
     Mostrar / ocultar la escena y los capítulos
     ========================================================= */
  function mostrarPuente(directo) {
    mostrado = true;
    escenaPuente.classList.add("visible");
    escenaPuente.setAttribute("aria-hidden", "false");
    escenaTierra.classList.add("oculta");
    if (tres) { tres.llegada(directo); tres.arrancar(); }
    etiquetas[0].focus({ preventScroll: true });
    if (!/^#directo/.test(location.hash)) { try { history.replaceState(null, "", "#puente"); } catch (e) { /* sin historial */ } }
  }
  function volverATierra() {
    cerrarCapitulo();
    pararDirecto();
    mostrado = false;
    escenaPuente.classList.remove("visible");
    escenaPuente.setAttribute("aria-hidden", "true");
    escenaTierra.classList.remove("oculta");
    if (tres) tres.parar();
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* sin historial */ }
    document.dispatchEvent(new CustomEvent("foodbridge:volver"));
    var boton = document.getElementById("ir-villa");
    if (boton) boton.focus({ preventScroll: true });
  }
  function abrirCapitulo(id) {
    if (!paneles[id]) return;
    Object.keys(paneles).forEach(function (k) { paneles[k].hidden = k !== id; });
    abierto = id;
    escenaPuente.classList.add("con-capitulo");
    etiquetas.forEach(function (b) { b.setAttribute("aria-expanded", String(b.dataset.capitulo === id)); });
    pista.hidden = true;
    paneles[id].scrollTop = 0;
    paneles[id].querySelector(".cerrar-capitulo").focus({ preventScroll: true });
    if (tres) tres.irA(id);
    document.dispatchEvent(new CustomEvent("foodbridge:capitulo", { detail: id }));
  }
  function cerrarCapitulo() {
    if (!abierto) return;
    var id = abierto;
    paneles[id].hidden = true;
    abierto = null;
    escenaPuente.classList.remove("con-capitulo");
    etiquetas.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    pista.hidden = false;
    if (tres) tres.irA(null);
    var b = escenaPuente.querySelector('.furgo-etq[data-capitulo="' + id + '"]');
    if (b && mostrado) b.focus({ preventScroll: true });
  }

  // Al final de cada capítulo, botones para saltar a los otros dos (sin tener que buscar la furgoneta).
  var NOMBRES = { problema: "El problema", objetivo: "Nuestro objetivo", como: "Cómo funciona" };
  Object.keys(paneles).forEach(function (id) {
    var pie = document.createElement("nav");
    pie.className = "otros-capitulos";
    pie.setAttribute("aria-label", "Otros capítulos");
    pie.innerHTML = "<span>Ver también</span>" + Object.keys(NOMBRES).filter(function (k) { return k !== id; }).map(function (k) {
      return '<button type="button" class="otro ' + k + '" data-capitulo="' + k + '"><span class="punto" aria-hidden="true"></span>' + NOMBRES[k] + " →</button>";
    }).join("");
    paneles[id].appendChild(pie);
    pie.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { abrirCapitulo(b.dataset.capitulo); }); });
  });

  etiquetas.forEach(function (b) {
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", function () { abrirCapitulo(b.dataset.capitulo); });
  });
  escenaPuente.querySelectorAll(".cerrar-capitulo").forEach(function (b) { b.addEventListener("click", cerrarCapitulo); });
  document.getElementById("volver-tierra").addEventListener("click", volverATierra);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !mostrado) return;
    if (abierto) cerrarCapitulo(); else volverATierra();
  });
  document.addEventListener("foodbridge:cruzar", function () { mostrarPuente(false); });

  /* =========================================================
     El dibujo en 3D
     ========================================================= */
  if (window.THREE) { try { tres = crearPuente(); } catch (e) { tres = null; } }
  if (!tres) escenaPuente.classList.add("sin-3d");

  /* =========================================================
     FoodBridge en directo (…/#directo): el público dona desde su móvil
     y en la pantalla grande sale una furgoneta por cada envío.
     …/#directo-ensayo hace lo mismo sin servidor (envíos simulados) para ensayar.
     ========================================================= */
  var directo = null;
  var panelDirecto = document.getElementById("panel-directo"), avisoHito = document.getElementById("aviso-hito");
  var cifraKg = document.getElementById("pd-kg"), cifraLotes = document.getElementById("pd-lotes");
  var HITOS = { 1: "¡Primer lote rescatado en esta sala!", 5: "¡5 lotes rescatados!", 10: "¡10 lotes rescatados!", 25: "¡25 lotes! El puente no para", 50: "¡50 lotes rescatados en esta sala!", 100: "¡100 lotes! Esto es FoodBridge" };
  function formatoKg(n) { return n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 2 }); }
  function animarCifra(el, desde, hasta, formato) {
    var t0 = performance.now();
    (function paso(t) {
      var u = Math.min(1, (t - t0) / 700), v = desde + (hasta - desde) * (1 - Math.pow(1 - u, 3));
      el.textContent = formato(v);
      if (u < 1) requestAnimationFrame(paso);
    })(t0);
  }
  function hito(texto) {
    avisoHito.textContent = texto; avisoHito.hidden = false;
    avisoHito.classList.remove("entra"); void avisoHito.offsetWidth; avisoHito.classList.add("entra");
    clearTimeout(hito.t); hito.t = setTimeout(function () { avisoHito.hidden = true; }, 3200);
  }
  function llegada(envio) {
    var kg0 = directo.kg, n0 = directo.lotes;
    directo.kg += envio.kg; directo.lotes += 1;
    animarCifra(cifraKg, kg0, directo.kg, formatoKg);
    animarCifra(cifraLotes, n0, directo.lotes, function (v) { return Math.round(v).toLocaleString("es-ES"); });
    if (HITOS[directo.lotes]) hito(HITOS[directo.lotes]);
  }
  function iniciarDirecto(ensayo) {
    if (directo) return;
    directo = { ensayo: ensayo, ultimo: -1, kg: 0, lotes: 0, temporizador: null };
    panelDirecto.hidden = false;
    escenaPuente.classList.add("en-directo");
    var url = location.origin + "/directo/";
    document.getElementById("pd-url").textContent = location.host + "/directo";
    var cajaQr = document.getElementById("pd-qr");
    try {
      var qr = window.qrcode(0, "M"); qr.addData(url); qr.make();
      cajaQr.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) {
      // Si no se puede dibujar el QR, al menos se ve la dirección para escribirla.
      cajaQr.classList.add("sin-qr");
      cajaQr.textContent = location.host + "/directo";
    }
    if (tres) { tres.alLlegar = llegada; tres.irA(null); }
    if (ensayo) simular(); else sondear();
  }
  function pararDirecto() {
    if (!directo) return;
    clearTimeout(directo.temporizador);
    directo = null;
    panelDirecto.hidden = true;
    escenaPuente.classList.remove("en-directo");
    if (tres) tres.irA(null);
  }
  function lanzar(envio) { if (tres) tres.lanzarEnvio(envio); else llegada(envio); }
  async function sondear() {
    if (!directo) return;
    try {
      var r = await fetch("/directo/estado/?desde=" + directo.ultimo, { cache: "no-store" });
      var d = await r.json();
      if (directo.ultimo < 0) {
        // Primera vez: el contador empieza con lo que ya había; solo se animan los envíos nuevos.
        directo.kg = d.total.kg - 0; directo.lotes = d.total.lotes;
        cifraKg.textContent = formatoKg(directo.kg); cifraLotes.textContent = directo.lotes.toLocaleString("es-ES");
      } else {
        d.envios.forEach(lanzar);
      }
      directo.ultimo = d.ultimo;
    } catch (e) { /* sin conexión: se reintenta */ }
    if (directo) directo.temporizador = setTimeout(sondear, 2000);
  }
  // Ensayo sin servidor: envíos inventados cada pocos segundos (para probar la pantalla).
  var EJEMPLOS = [["pan", "barras de pan", 0.25], ["yogures", "yogures", 0.125], ["fruta", "kg de fruta", 1], ["leche", "litros de leche", 1], ["bolleria", "piezas de bollería", 0.08], ["platos", "platos preparados", 0.4], ["verdura", "kg de verdura", 1], ["conservas", "latas de conserva", 0.4]];
  var COMERCIOS_ENSAYO = ["Panadería Lola", "Frutas El Huerto", "Pastelería Dulce Odón", "Lácteos La Vega", "Bar El Puente", "Mercado del Pinar"];
  var numeroEnsayo = 0;
  function simular() {
    if (!directo) return;
    var e = EJEMPLOS[Math.floor(Math.random() * EJEMPLOS.length)], u = 1 + Math.floor(Math.random() * 12), kg = Math.round(u * e[2] * 100) / 100;
    lanzar({ numero: ++numeroEnsayo, comercio: COMERCIOS_ENSAYO[Math.floor(Math.random() * COMERCIOS_ENSAYO.length)], producto: e[0], kg: kg, texto: u + " " + e[1] + " · " + kg.toLocaleString("es-ES") + " kg" });
    directo.temporizador = setTimeout(simular, 1200 + Math.random() * 2600);
  }

  // Enlaces directos: …/#puente abre el puente; …/#directo, el modo en directo.
  function segunHash() {
    if (/^#directo/.test(location.hash)) { if (!mostrado) mostrarPuente(true); iniciarDirecto(location.hash === "#directo-ensayo"); }
    else if (location.hash === "#puente") { pararDirecto(); if (!mostrado) mostrarPuente(true); }
    else if (mostrado) volverATierra();
  }
  if (location.hash) segunHash();
  window.addEventListener("hashchange", segunHash);

  function crearPuente() {
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: false });
    var pr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x03110A, 1);

    var escena = new T.Scene();
    escena.fog = new T.Fog(0x03110A, 60, 185);
    var camara = new T.PerspectiveCamera(42, 1, 0.1, 400);
    escena.add(new T.HemisphereLight(0xFFFFFF, 0x0B2619, 1.15));
    var sol = new T.DirectionalLight(0xFFFFFF, 0.9); sol.position.set(-30, 50, 40); escena.add(sol);

    var MENTA = 0x4ADE80, VERDE = 0x22A35A, AMBAR = 0xF5A524, TURQUESA = 0x2DD4BF;

    /* ---------- Medidas del puente ---------- */
    var TORRE_X = 20, TORRE_ALTO = 23, AGUA_Y = -9, ANCLA_X = 47, ANCHO = 2.4, CABLE_BAJO = 2.6;
    function alturaCable(x) {
      var ax = Math.abs(x);
      if (ax <= TORRE_X) return CABLE_BAJO + (TORRE_ALTO - CABLE_BAJO) * Math.pow(ax / TORRE_X, 2);
      var u = (ANCLA_X - ax) / (ANCLA_X - TORRE_X);
      return 0.6 + (TORRE_ALTO - 0.6) * Math.pow(Math.max(0, u), 1.7);
    }
    var lineasPuente = new T.LineBasicMaterial({ color: MENTA, transparent: true, opacity: 0.6 });
    var lineasTenues = new T.LineBasicMaterial({ color: MENTA, transparent: true, opacity: 0.32 });
    var macizo = new T.MeshBasicMaterial({ color: 0x0A2417 });
    var bordes = new T.LineBasicMaterial({ color: VERDE, transparent: true, opacity: 0.9 });
    function caja(w, h, d, x, y, z, matBorde) {
      var g = new T.BoxGeometry(w, h, d);
      var m = new T.Mesh(g, macizo); m.position.set(x, y, z); escena.add(m);
      var e = new T.LineSegments(new T.EdgesGeometry(g), matBorde || bordes); e.position.copy(m.position); escena.add(e);
    }
    [-TORRE_X, TORRE_X].forEach(function (x) {
      [-ANCHO, ANCHO].forEach(function (z) { caja(1.1, TORRE_ALTO - AGUA_Y + 1, 1.3, x, (TORRE_ALTO + AGUA_Y) / 2 + 0.5, z); });
      [-4.5, 5.5, 11.5, 17, 21.6].forEach(function (y) { caja(0.9, y > 20 ? 1.4 : 0.9, ANCHO * 2, x, y, 0); });
    });
    caja(ANCLA_X * 2 + 4, 0.7, ANCHO * 2 + 1.2, 0, -0.35, 0);
    [-1, 1].forEach(function (lado) { caja(5, 4, ANCHO * 2 + 3, lado * (ANCLA_X + 1.5), -1.6, 0); });
    var bordeComercio = new T.LineBasicMaterial({ color: AMBAR, transparent: true, opacity: 0.85 });
    var bordeEntidad = new T.LineBasicMaterial({ color: TURQUESA, transparent: true, opacity: 0.85 });
    var ORILLA = ANCLA_X + 13;
    caja(9, 6, 8, -ORILLA, 2.5, -7.5, bordeComercio);
    caja(9.6, 0.5, 3, -ORILLA, 4.2, -2.2, bordeComercio);
    caja(8, 8, 8, ORILLA, 3.5, -7.5, bordeEntidad);
    caja(5, 0.6, 5, ORILLA, 7.9, -7.5, bordeEntidad);
    // Calzadas que unen las orillas con el puente
    caja(18, 0.5, ANCHO * 2 + 1.2, -(ANCLA_X + 9), -0.3, 0);
    caja(18, 0.5, ANCHO * 2 + 1.2, ANCLA_X + 9, -0.3, 0);

    var pendolas = [];
    [-ANCHO, ANCHO].forEach(function (z) {
      var linea = [];
      for (var i = 0; i <= 240; i++) { var x = -ANCLA_X + (i / 240) * ANCLA_X * 2; linea.push(new T.Vector3(x, alturaCable(x), z)); }
      escena.add(new T.Line(new T.BufferGeometry().setFromPoints(linea), lineasPuente));
      for (var x2 = -ANCLA_X + 2; x2 <= ANCLA_X - 2; x2 += 1.6) {
        if (Math.abs(Math.abs(x2) - TORRE_X) < 0.9) continue;
        pendolas.push(x2, 0, z, x2, alturaCable(x2), z);
      }
    });
    var gP = new T.BufferGeometry(); gP.setAttribute("position", new T.Float32BufferAttribute(pendolas, 3));
    escena.add(new T.LineSegments(gP, lineasTenues));
    var lucesTablero = new T.LineBasicMaterial({ color: MENTA, transparent: true, opacity: 0.45 });
    [-2.0, 2.0].forEach(function (z) {
      escena.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-ANCLA_X - 18, 0.05, z), new T.Vector3(ANCLA_X + 18, 0.05, z)]), lucesTablero));
    });

    /* ---------- Agua de puntos y estrellas ---------- */
    var agua = [];
    for (var ax = -130; ax <= 130; ax += 1.5) for (var az = -70; az <= 45; az += 1.5) agua.push(ax, AGUA_Y, az);
    var gA = new T.BufferGeometry(); gA.setAttribute("position", new T.Float32BufferAttribute(agua, 3));
    var mAgua = new T.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { tiempo: { value: 0 }, pr: { value: pr } },
      vertexShader: "uniform float tiempo; uniform float pr; varying float vA; void main(){ vec3 p = position; float o = sin(p.x*0.16 + tiempo*0.9)*0.28 + cos(p.z*0.21 + tiempo*0.7)*0.28; p.y += o; vec4 mv = modelViewMatrix*vec4(p,1.0); float d = -mv.z; vA = (0.3 + o*0.6 + 0.2*exp(-abs(p.z)*0.08)) * clamp(1.0 - (d-30.0)/150.0, 0.0, 1.0); gl_PointSize = 2.2*pr*clamp(40.0/d, 0.6, 2.2); gl_Position = projectionMatrix*mv; }",
      fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(0.29,0.87,0.50, vA*(1.0-d*2.0)); }"
    });
    escena.add(new T.Points(gA, mAgua));
    var est = [];
    for (var i = 0; i < 700; i++) { var t = Math.random() * Math.PI * 2, r = 220 * (0.4 + Math.random()); est.push(Math.cos(t) * r, 25 + Math.random() * 120, -60 - Math.random() * 160); }
    var gE = new T.BufferGeometry(); gE.setAttribute("position", new T.Float32BufferAttribute(est, 3));
    escena.add(new T.Points(gE, new T.PointsMaterial({ color: 0xD1FAE5, size: 1.4 * pr, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false })));

    /* ---------- Furgonetas con el logo de FoodBridge ---------- */
    // El rótulo del lateral se dibuja en un lienzo: logo, "FoodBridge" y una franja de color.
    var rotulos = {};
    function rotulo(colorFranja) {
      if (rotulos[colorFranja]) return rotulos[colorFranja];
      var c = document.createElement("canvas"); c.width = 512; c.height = 256;
      var x = c.getContext("2d");
      x.fillStyle = "#F4FAF6"; x.fillRect(0, 0, 512, 256);
      x.fillStyle = "#14532D"; x.fillRect(0, 158, 512, 64);
      x.fillStyle = colorFranja; x.fillRect(0, 222, 512, 14);
      x.save(); x.translate(30, 30);
      x.fillStyle = "#FFFFFF"; x.strokeStyle = "#CFE3D6"; x.lineWidth = 4;
      x.beginPath(); if (x.roundRect) x.roundRect(0, 0, 108, 108, 22); else x.rect(0, 0, 108, 108); x.fill(); x.stroke();
      x.font = "800 72px Inter, Arial, sans-serif";
      x.fillStyle = "#22A35A"; x.fillText("B", 39, 89);
      x.globalAlpha = 0.22; x.fillStyle = "#14532D"; x.fillText("F", 21, 78);
      x.globalAlpha = 1; x.fillText("F", 16, 73);
      x.restore();
      x.font = "800 62px Inter, Arial, sans-serif";
      x.fillStyle = "#14532D"; x.fillText("Food", 156, 106);
      var ancho = x.measureText("Food").width;
      x.fillStyle = "#22A35A"; x.fillText("Bridge", 156 + ancho, 106);
      x.font = "600 28px Inter, Arial, sans-serif"; x.fillStyle = "#FFFFFF";
      x.fillText("Comida que sobra → quien la necesita", 30, 200);
      var tex = new T.CanvasTexture(c);
      tex.anisotropy = 4;
      if ("colorSpace" in tex) tex.colorSpace = T.SRGBColorSpace;
      rotulos[colorFranja] = tex;
      return tex;
    }
    // Rótulo de una furgoneta del público: un logo con las iniciales y el nombre de su comercio.
    var COLORES_COMERCIO = ["#14532D", "#0F766E", "#9A3412", "#7C2D12", "#1E3A8A", "#6B21A8", "#9F1239", "#3F6212"];
    function rotuloComercio(nombre) {
      var c = document.createElement("canvas"); c.width = 512; c.height = 256;
      var x = c.getContext("2d");
      var h = 0; for (var i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
      var color = COLORES_COMERCIO[h % COLORES_COMERCIO.length];
      x.fillStyle = "#F4FAF6"; x.fillRect(0, 0, 512, 256);
      x.fillStyle = color; x.fillRect(0, 196, 512, 44);
      x.fillStyle = "#F5A524"; x.fillRect(0, 240, 512, 16);
      // Logo: círculo de color con las iniciales.
      var iniciales = nombre.split(/\s+/).filter(function (p) { return /\w/.test(p) && p.length > 2; }).slice(0, 2)
        .map(function (p) { return p.charAt(0).toUpperCase(); }).join("") || nombre.charAt(0).toUpperCase();
      x.fillStyle = color; x.beginPath(); x.arc(74, 98, 56, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#FFFFFF"; x.lineWidth = 4; x.beginPath(); x.arc(74, 98, 47, 0, Math.PI * 2); x.stroke();
      x.fillStyle = "#FFFFFF"; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = "800 " + (iniciales.length > 1 ? 44 : 54) + "px Inter, Arial, sans-serif";
      x.fillText(iniciales, 74, 101);
      // Nombre: en una o dos líneas, lo más grande que quepa.
      x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#10261B";
      var ancho = 512 - 146 - 14, palabras = nombre.split(/\s+/), lineas = [nombre], tam = 84;
      function cabe(ls, t) { x.font = "800 " + t + "px Inter, Arial, sans-serif"; return ls.every(function (l) { return x.measureText(l).width <= ancho; }); }
      if (!cabe(lineas, 56) && palabras.length > 1) {
        var mejor = null;
        for (var k = 1; k < palabras.length; k++) {
          var par = [palabras.slice(0, k).join(" "), palabras.slice(k).join(" ")];
          var largo = Math.max(par[0].length, par[1].length);
          if (!mejor || largo < mejor.l) mejor = { p: par, l: largo };
        }
        lineas = mejor.p; tam = 70;
      }
      while (tam > 22 && !cabe(lineas, tam)) tam -= 2;
      x.font = "800 " + tam + "px Inter, Arial, sans-serif";
      var y0 = lineas.length === 1 ? 98 + tam * 0.36 : 98 - 8;
      lineas.forEach(function (l, n) { x.fillText(l, 146, y0 + n * (tam + 4), ancho); });
      x.font = "600 24px Inter, Arial, sans-serif"; x.fillStyle = "#FFFFFF";
      x.fillText("Villaviciosa de Odón", 22, 227);
      var tex = new T.CanvasTexture(c);
      tex.anisotropy = 4;
      if ("colorSpace" in tex) tex.colorSpace = T.SRGBColorSpace;
      return new T.MeshBasicMaterial({ map: tex });
    }

    var matCarroceria = new T.MeshLambertMaterial({ color: 0xF1F7F3 });
    var matCristal = new T.MeshLambertMaterial({ color: 0x10261B });
    var matRueda = new T.MeshLambertMaterial({ color: 0x0B1511 });
    var geoCaja = new T.BoxGeometry(2.7, 1.55, 1.3), geoCabina = new T.BoxGeometry(1.05, 1.15, 1.26);
    var geoCristal = new T.BoxGeometry(0.06, 0.5, 1.1), geoRueda = new T.CylinderGeometry(0.28, 0.28, 0.22, 16);
    var geoRotulo = new T.PlaneGeometry(2.6, 1.3);
    var materialesRotulo = {};
    function furgoneta(colorFranja, matPropio) {
      var g = new T.Group();
      var cuerpo = new T.Mesh(geoCaja, matCarroceria); cuerpo.position.set(-0.45, 1.05, 0); g.add(cuerpo);
      var cabina = new T.Mesh(geoCabina, matCarroceria); cabina.position.set(1.42, 0.85, 0); g.add(cabina);
      var cristal = new T.Mesh(geoCristal, matCristal); cristal.position.set(1.95, 1.08, 0); g.add(cristal);
      [[-1.25, 0.66], [-1.25, -0.66], [1.3, 0.66], [1.3, -0.66]].forEach(function (p) {
        var rueda = new T.Mesh(geoRueda, matRueda); rueda.rotation.x = Math.PI / 2; rueda.position.set(p[0], 0.28, p[1]); g.add(rueda);
      });
      var mat = matPropio || materialesRotulo[colorFranja] || (materialesRotulo[colorFranja] = new T.MeshBasicMaterial({ map: rotulo(colorFranja) }));
      [0.661, -0.661].forEach(function (z) {
        var lado = new T.Mesh(geoRotulo, mat);
        lado.position.set(-0.45, 1.05, z);
        if (z < 0) { lado.rotation.y = Math.PI; }
        g.add(lado);
      });
      escena.add(g);
      return g;
    }

    // Tres furgonetas con capítulo y cuatro más de ambiente, todas del comercio a la entidad.
    var COLORES = { problema: "#F2545B", objetivo: "#4ADE80", como: "#2DD4BF" };
    var flota = [
      { id: "problema", fase: 0.30, carril: 1 },
      { id: null, fase: 0.18, carril: -1 },
      { id: "objetivo", fase: 0.47, carril: 1 },
      { id: null, fase: 0.58, carril: -1 },
      { id: "como", fase: 0.64, carril: 1 },
      { id: null, fase: 0.86, carril: -1 },
      { id: null, fase: 0.05, carril: 1 }
    ];
    var RECORRIDO = 132, VELOCIDAD = 2.4; // lentas, para poder tocarlas
    flota.forEach(function (f) {
      f.g = furgoneta(f.id ? COLORES[f.id] : "#22A35A");
      f.g.traverse(function (o) { o.userData.furgo = f; });
      if (f.id) f.boton = escenaPuente.querySelector('.furgo-etq[data-capitulo="' + f.id + '"]');
      f.avance = f.fase * RECORRIDO;
    });

    /* ---------- "El problema": comida que cae al agua desde el lado del comercio ---------- */
    var NC = 18, residuo = 0;
    var caidas = new T.InstancedMesh(new T.BoxGeometry(0.7, 0.5, 0.6), new T.MeshBasicMaterial({ color: 0xF2545B }), NC);
    escena.add(caidas);
    var mC = new T.Matrix4(), qC = new T.Quaternion(), pC = new T.Vector3(), sC = new T.Vector3(), ejeC = new T.Vector3(1, 0.4, 0.2).normalize();
    function azar(n) { var v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); }
    function moverCaidas() {
      for (var i = 0; i < NC; i++) {
        var u = (tiempo * 0.42 + i / NC) % 1, vuelta = Math.floor(tiempo * 0.42 + i / NC);
        var x = -50 + azar(i * 7 + vuelta) * 24;
        pC.set(x + u * 1.5, 0.4 - 9.6 * u * u, 2.7 + u * 3.5);
        qC.setFromAxisAngle(ejeC, u * 5 + i);
        var e = residuo * (u < 0.92 ? 1 : (1 - u) / 0.08);
        sC.set(e, e, e).addScalar(0.0001);
        mC.compose(pC, qC, sC);
        caidas.setMatrixAt(i, mC);
      }
      caidas.instanceMatrix.needsUpdate = true;
    }

    /* ---------- "Cómo funciona": la furgoneta representa cada paso ---------- */
    var PASOS = {
      comercio: [
        { x: -58, t: "Comercio dado de alta ✓" },
        { x: -56, t: "Lote publicado · 12 barras de pan" },
        { x: -2, t: "Reservado por el Comedor Social San José" },
        { x: 56, t: "PIN 4821 · Entregado ✓", pin: true }
      ],
      entidad: [
        { x: 56, t: "Solicitud de alta enviada" },
        { x: 56, t: "Cuenta en revisión…" },
        { x: -54, t: "Reservado · PIN 4821", pin: true },
        { x: 30, t: "Recogida de 18:00 a 20:00" }
      ],
      admin: [
        { x: -24, t: "1 entidad pendiente de revisar" },
        { x: 0, t: "Entidad aprobada ✓" },
        { x: 24, t: "2 recogidas no realizadas (ejemplo)" }
      ]
    };
    var pasoActual = { rol: "comercio", paso: 0 };
    document.addEventListener("foodbridge:paso", function (e) { pasoActual = e.detail; });
    var chip = document.createElement("span");
    chip.className = "chip-furgo fuera"; chip.setAttribute("aria-hidden", "true");
    escenaPuente.appendChild(chip);

    /* ---------- FoodBridge en directo: una furgoneta por cada envío del público ---------- */
    var envios = [], cola = [], ultimoLanzamiento = -10, relojReal = 0;
    var API = null;
    function crearEnvio(d) {
      var e = { d: d, x: -66, carril: envios.length % 2 ? -1 : 1, llegado: false, t: 0 };
      e.mat = d.comercio ? rotuloComercio(d.comercio) : null;
      e.g = furgoneta("#F5A524", e.mat);
      e.el = document.createElement("span");
      e.el.className = "etq-envio fuera"; e.el.setAttribute("aria-hidden", "true");
      e.el.textContent = (d.numero ? "#" + d.numero + " · " : "") + (d.comercio ? d.comercio + " · " : "") + d.texto;
      escenaPuente.appendChild(e.el);
      envios.push(e);
    }
    // Estallido de luz al entregar: unas chispas verdes que suben y se apagan.
    var chispas = [];
    function estallido(pos) {
      var n = 40, posiciones = new Float32Array(n * 3), vel = [];
      for (var i = 0; i < n; i++) {
        posiciones[i * 3] = pos.x; posiciones[i * 3 + 1] = pos.y + 2; posiciones[i * 3 + 2] = pos.z;
        vel.push([(Math.random() - 0.5) * 8, 4 + Math.random() * 7, (Math.random() - 0.5) * 8]);
      }
      var g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(posiciones, 3));
      var m = new T.PointsMaterial({ color: 0x4ADE80, size: 0.55, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending });
      var pts = new T.Points(g, m); escena.add(pts);
      chispas.push({ p: pts, vel: vel, t: 0 });
    }
    function moverEnvios(dt) {
      relojReal += dt;
      if (cola.length && relojReal - ultimoLanzamiento > 1.1 && envios.filter(function (e) { return !e.llegado; }).length < 16) {
        crearEnvio(cola.shift()); ultimoLanzamiento = relojReal;
      }
      for (var i = envios.length - 1; i >= 0; i--) {
        var e = envios[i];
        if (!e.llegado) {
          e.x += dt * 7.5;
          if (e.x >= 57) {
            e.llegado = true; e.x = 57;
            e.el.textContent = "✓ Entregado · " + e.d.texto; e.el.classList.add("entregado");
            estallido(e.g.position);
            if (API && API.alLlegar) API.alLlegar(e.d);
          }
        } else e.t += dt;
        var s = e.llegado ? Math.max(0, 1 - e.t / 1.6) : Math.min(1, (e.x + 66) / 4);
        e.g.position.set(e.x, 0, e.carril * 1.15);
        e.g.scale.setScalar(Math.max(0.0001, s * 1.4));
        tmp.copy(e.g.position); colocar(e.el, tmp, e.carril > 0 ? 3.6 : 5.6, s < 0.3);
        if (e.t > 1.8) { escena.remove(e.g); e.el.remove(); if (e.mat) { e.mat.map.dispose(); e.mat.dispose(); } envios.splice(i, 1); }
      }
      for (var j = chispas.length - 1; j >= 0; j--) {
        var c = chispas[j], arr = c.p.geometry.attributes.position.array;
        c.t += dt;
        for (var k = 0; k < c.vel.length; k++) {
          c.vel[k][1] -= 9 * dt;
          arr[k * 3] += c.vel[k][0] * dt; arr[k * 3 + 1] += c.vel[k][1] * dt; arr[k * 3 + 2] += c.vel[k][2] * dt;
        }
        c.p.geometry.attributes.position.needsUpdate = true;
        c.p.material.opacity = Math.max(0, 1 - c.t / 1.3);
        if (c.t > 1.3) { escena.remove(c.p); c.p.geometry.dispose(); c.p.material.dispose(); chispas.splice(j, 1); }
      }
    }

    /* ---------- Cámara ---------- */
    var VISTAS = {
      llegada: [[0, 52, 130], [0, 4, 0]],
      general: [[0, 17, 96], [0, 3, 0]],
      directo: [[16, 10, 76], [16, 1.5, 0]],  // un poco hacia la entidad: la llegada es el momento estrella
      problema: [[-62, 8, 26], [-38, 2, 0]],
      objetivo: [[0, 28, 74], [0, 5, 0]],
      como: [[52, 9, 28], [38, 2, 0]]
    };
    var camPos = new T.Vector3().fromArray(VISTAS.llegada[0]), camMira = new T.Vector3().fromArray(VISTAS.llegada[1]);
    var metaPos = new T.Vector3(), metaMira = new T.Vector3();
    var vista = "general", lejos = 1;
    function esMovil() { return lienzo.clientWidth < 700; }
    function irA(id) {
      vista = id || (escenaPuente.classList.contains("en-directo") ? "directo" : "general");
      metaPos.fromArray(VISTAS[vista][0]); metaMira.fromArray(VISTAS[vista][1]);
    }
    function medir() {
      var w = lienzo.clientWidth, h = lienzo.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      lejos = camara.aspect < 1 ? 1.35 : 1;
      camara.fov = camara.aspect < 1 ? 58 : 42;
      camara.updateProjectionMatrix();
      irA(vista === "general" ? null : vista);
    }
    window.addEventListener("resize", medir);

    /* ---------- Tocar una furgoneta ---------- */
    var rayo = new T.Raycaster(), puntero = new T.Vector2(), mallas = [];
    flota.forEach(function (f) { if (f.id) f.g.traverse(function (o) { if (o.isMesh) mallas.push(o); }); });
    function furgoBajo(e) {
      var r = lienzo.getBoundingClientRect();
      puntero.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      rayo.setFromCamera(puntero, camara);
      var h = rayo.intersectObjects(mallas, false);
      return h.length ? h[0].object.userData.furgo : null;
    }
    var bajada = null;
    lienzo.addEventListener("pointerdown", function (e) { bajada = { x: e.clientX, y: e.clientY }; });
    lienzo.addEventListener("pointerup", function (e) {
      if (!bajada || Math.abs(e.clientX - bajada.x) + Math.abs(e.clientY - bajada.y) > 8) return;
      var f = furgoBajo(e);
      if (f) abrirCapitulo(f.id); else if (abierto) cerrarCapitulo();
    });
    lienzo.addEventListener("pointermove", function (e) { lienzo.style.cursor = furgoBajo(e) ? "pointer" : ""; });

    /* ---------- Etiquetas que siguen a cada furgoneta ---------- */
    var proy = new T.Vector3();
    function colocar(el, v, alzado, extraFuera) {
      proy.copy(v); proy.y += alzado; proy.project(camara);
      var dentro = !extraFuera && proy.z < 1 && Math.abs(proy.x) < 0.97 && Math.abs(proy.y) < 0.97;
      el.classList.toggle("fuera", !dentro);
      if (dentro) el.style.transform = "translate(" + ((proy.x + 1) / 2 * lienzo.clientWidth).toFixed(1) + "px," + ((1 - proy.y) / 2 * lienzo.clientHeight).toFixed(1) + "px) translate(-50%,-100%)";
    }
    var etqComercio = document.getElementById("etq-comercio"), etqEntidad = document.getElementById("etq-entidad");
    var pComercio = new T.Vector3(-ORILLA, 7.5, -7.5), pEntidad = new T.Vector3(ORILLA, 9.5, -7.5);

    /* ---------- Bucle de dibujo ---------- */
    var activo = false, reloj = new T.Clock(), tiempo = 0, tmp = new T.Vector3(), brillo = 0;
    function cuadro() {
      if (!activo) return;
      requestAnimationFrame(cuadro);
      var dtReal = reloj.getDelta(), dt = Math.min(dtReal, 0.12); // aunque el móvil vaya lento, la animación no se queda atrás
      if (!reducido) tiempo += dt;
      var k = reducido ? 1 : 1 - Math.exp(-dt * 1.8);
      camPos.lerp(metaPos, k); camMira.lerp(metaMira, k);
      // Un ligero vaivén en la vista general para que la escena respire.
      var vaiven = (!reducido && (vista === "general" || vista === "directo")) ? Math.sin(tiempo * 0.22) * 5 : 0;
      camara.position.copy(camPos); camara.position.x += vaiven;
      if (lejos !== 1) camara.position.sub(camMira).multiplyScalar(lejos).add(camMira);
      camara.lookAt(camMira);
      encuadrarHueco(k);
      mAgua.uniforms.tiempo.value = tiempo;

      var demo = abierto === "como";
      flota.forEach(function (f) {
        // La furgoneta del capítulo abierto (o la que estás a punto de tocar) se para.
        var parada = f.id && (f.id === abierto || (f.boton && f.boton.matches(":hover, :focus-visible")));
        if (!reducido && !parada) f.avance = (f.avance + dt * VELOCIDAD) % RECORRIDO;
        var x = -RECORRIDO / 2 + f.avance;
        if (f.id === "como" && demo) {
          // Va al sitio del paso que estás leyendo (comercio, puente o entidad).
          var meta = (PASOS[pasoActual.rol] || PASOS.comercio)[pasoActual.paso] || PASOS.comercio[0];
          f.xDemo = f.xDemo === undefined ? x : f.xDemo + (meta.x - f.xDemo) * (reducido ? 1 : 1 - Math.exp(-dt * 1.3));
          x = f.xDemo;
          f.avance = x + RECORRIDO / 2;
          metaPos.set(x + 14, 8, 26); metaMira.set(x, 2.5, 0);
          chip.textContent = meta.t;
          chip.classList.toggle("pin", !!meta.pin);
          tmp.set(x, 0, f.carril * 1.15); colocar(chip, tmp, 4.2);
        } else if (f.id === "como") { f.xDemo = undefined; }
        f.g.position.set(x, 0, f.carril * 1.15);
        // Aparecen al salir del comercio y desaparecen al llegar a la entidad.
        var s = Math.min(1, Math.max(0, Math.min(x + 64, 64 - x) / 4));
        // En directo solo cruzan las furgonetas del público: el protagonismo es suyo.
        if (escenaPuente.classList.contains("en-directo")) s = 0;
        f.g.scale.setScalar(Math.max(0.0001, s * 1.4));
        if (f.boton) { tmp.copy(f.g.position); colocar(f.boton, tmp, 3.5, s < 0.6 || (demo && f.id === "como")); }
      });
      if (!demo) chip.classList.add("fuera");
      // "El problema": cae comida al agua. "Nuestro objetivo": el puente se ilumina.
      residuo += ((abierto === "problema" ? 1 : 0) - residuo) * Math.min(1, dt * 2);
      if (residuo > 0.01 && !reducido) moverCaidas(); else if (residuo <= 0.01) caidas.visible = false;
      caidas.visible = residuo > 0.01;
      brillo += ((abierto === "objetivo" ? 1 : 0) - brillo) * Math.min(1, dt * 2);
      var pulso = 0.5 + 0.5 * Math.sin(tiempo * 2.4);
      lucesTablero.opacity = 0.45 + brillo * 0.55 * pulso;
      lineasPuente.opacity = 0.6 + brillo * 0.35;
      lineasTenues.opacity = 0.32 + brillo * (0.25 + 0.2 * pulso);
      moverEnvios(Math.min(dtReal, 0.12));
      colocar(etqComercio, pComercio, 0);
      colocar(etqEntidad, pEntidad, 0);
      renderer.render(escena, camara);
    }

    // Con un capítulo abierto, el centro de la imagen pasa al hueco libre:
    // a la derecha del panel en el ordenador y encima del panel en el móvil.
    var offX = 0, offY = 0;
    function encuadrarHueco(k) {
      var w = lienzo.clientWidth, h = lienzo.clientHeight, ox = 0, oy = 0;
      var panel = abierto && paneles[abierto];
      if (!panel && escenaPuente.classList.contains("en-directo")) oy = -h * 0.16;
      if (panel && !panel.hidden) {
        var r = panel.getBoundingClientRect(), c = lienzo.getBoundingClientRect();
        if (esMovil()) oy = (r.top - c.top) / 2 - h / 2;
        else ox = ((r.right - c.left) + w) / 2 - w / 2;
      }
      offX += (ox - offX) * k; offY += (oy - offY) * k;
      camara.setViewOffset(w, h, -offX, -offY, w, h);
      camara.updateProjectionMatrix();
    }

    irA(null);
    medir();
    API = {
      alLlegar: null,
      lanzarEnvio: function (d) { cola.push(d); },
      irA: irA,
      llegada: function (directo) {
        var desde = (directo || reducido) ? VISTAS.general : VISTAS.llegada;
        camPos.fromArray(desde[0]); camMira.fromArray(desde[1]);
        irA(null);
      },
      arrancar: function () { if (activo) return; activo = true; medir(); reloj.getDelta(); cuadro(); },
      parar: function () { activo = false; }
    };
    return API;
  }
})();
