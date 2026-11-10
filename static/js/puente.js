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
    try { history.replaceState(null, "", "#puente"); } catch (e) { /* sin historial */ }
  }
  function volverATierra() {
    cerrarCapitulo();
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

  // Enlace directo: …/#puente abre directamente el puente (útil para compartir).
  if (location.hash === "#puente") mostrarPuente(true);
  window.addEventListener("hashchange", function () {
    if (location.hash === "#puente" && !mostrado) mostrarPuente(true);
    else if (location.hash !== "#puente" && mostrado) volverATierra();
  });

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
    caja(9, 6, 9, -(ANCLA_X + 16), 2.5, -7, bordeComercio);
    caja(9.6, 0.5, 3, -(ANCLA_X + 16), 4.2, -1.4, bordeComercio);
    caja(8, 8, 8, ANCLA_X + 16, 3.5, -7, bordeEntidad);
    caja(5, 0.6, 5, ANCLA_X + 16, 7.9, -7, bordeEntidad);
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
    function rotulo(colorFranja) {
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
      return tex;
    }
    var matCarroceria = new T.MeshLambertMaterial({ color: 0xF1F7F3 });
    var matCristal = new T.MeshLambertMaterial({ color: 0x10261B });
    var matRueda = new T.MeshLambertMaterial({ color: 0x0B1511 });
    var geoCaja = new T.BoxGeometry(2.7, 1.55, 1.3), geoCabina = new T.BoxGeometry(1.05, 1.15, 1.26);
    var geoCristal = new T.BoxGeometry(0.06, 0.5, 1.1), geoRueda = new T.CylinderGeometry(0.28, 0.28, 0.22, 16);
    var geoRotulo = new T.PlaneGeometry(2.6, 1.3);
    function furgoneta(colorFranja) {
      var g = new T.Group();
      var cuerpo = new T.Mesh(geoCaja, matCarroceria); cuerpo.position.set(-0.45, 1.05, 0); g.add(cuerpo);
      var cabina = new T.Mesh(geoCabina, matCarroceria); cabina.position.set(1.42, 0.85, 0); g.add(cabina);
      var cristal = new T.Mesh(geoCristal, matCristal); cristal.position.set(1.95, 1.08, 0); g.add(cristal);
      [[-1.25, 0.66], [-1.25, -0.66], [1.3, 0.66], [1.3, -0.66]].forEach(function (p) {
        var rueda = new T.Mesh(geoRueda, matRueda); rueda.rotation.x = Math.PI / 2; rueda.position.set(p[0], 0.28, p[1]); g.add(rueda);
      });
      var mat = new T.MeshBasicMaterial({ map: rotulo(colorFranja) });
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

    /* ---------- Cámara ---------- */
    var VISTAS = {
      llegada: [[0, 52, 130], [0, 4, 0]],
      general: [[0, 12, 64], [0, 4, 0]],
      problema: [[-58, 7, 24], [-30, 3, -4]],
      objetivo: [[-16, 30, 60], [10, 3, 0]],
      como: [[58, 8, 24], [30, 3, -4]]
    };
    var camPos = new T.Vector3().fromArray(VISTAS.llegada[0]), camMira = new T.Vector3().fromArray(VISTAS.llegada[1]);
    var metaPos = new T.Vector3(), metaMira = new T.Vector3();
    var vista = "general", lejos = 1;
    function esMovil() { return lienzo.clientWidth < 700; }
    function irA(id) {
      vista = id || "general";
      metaPos.fromArray(VISTAS[vista][0]); metaMira.fromArray(VISTAS[vista][1]);
      // En el móvil el capítulo sale abajo: bajamos la mirada para que el puente quede en la mitad de arriba.
      if (id && esMovil()) metaMira.y -= 10;
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
    var pComercio = new T.Vector3(-(ANCLA_X + 16), 7, -7), pEntidad = new T.Vector3(ANCLA_X + 16, 9, -7);

    /* ---------- Bucle de dibujo ---------- */
    var activo = false, reloj = new T.Clock(), tiempo = 0, tmp = new T.Vector3();
    function cuadro() {
      if (!activo) return;
      requestAnimationFrame(cuadro);
      var dt = Math.min(reloj.getDelta(), 0.05);
      if (!reducido) tiempo += dt;
      var k = reducido ? 1 : 1 - Math.exp(-dt * 1.8);
      camPos.lerp(metaPos, k); camMira.lerp(metaMira, k);
      // Un ligero vaivén en la vista general para que la escena respire.
      var vaiven = (!reducido && vista === "general") ? Math.sin(tiempo * 0.22) * 5 : 0;
      camara.position.copy(camPos); camara.position.x += vaiven;
      if (lejos !== 1) camara.position.sub(camMira).multiplyScalar(lejos).add(camMira);
      camara.lookAt(camMira);
      mAgua.uniforms.tiempo.value = tiempo;

      flota.forEach(function (f) {
        // La furgoneta del capítulo abierto (o la que estás a punto de tocar) se para.
        var parada = f.id && (f.id === abierto || (f.boton && f.boton.matches(":hover, :focus-visible")));
        if (!reducido && !parada) f.avance = (f.avance + dt * VELOCIDAD) % RECORRIDO;
        var x = -RECORRIDO / 2 + f.avance;
        f.g.position.set(x, 0, f.carril * 1.15);
        // Aparecen al salir del comercio y desaparecen al llegar a la entidad.
        var s = Math.min(1, Math.max(0, Math.min(x + 64, 64 - x) / 4));
        f.g.scale.setScalar(Math.max(0.0001, s));
        if (f.boton) { tmp.copy(f.g.position); colocar(f.boton, tmp, 2.5, s < 0.6); }
      });
      colocar(etqComercio, pComercio, 0);
      colocar(etqEntidad, pEntidad, 0);
      renderer.render(escena, camara);
    }

    irA(null);
    medir();
    return {
      irA: irA,
      llegada: function (directo) {
        var desde = (directo || reducido) ? VISTAS.general : VISTAS.llegada;
        camPos.fromArray(desde[0]); camMira.fromArray(desde[1]);
        irA(null);
      },
      arrancar: function () { if (activo) return; activo = true; medir(); reloj.getDelta(); cuadro(); },
      parar: function () { activo = false; }
    };
  }
})();
