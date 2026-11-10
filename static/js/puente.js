/*
  FoodBridge · el puente que acompaña la historia
  ------------------------------------------------
  Debajo del planeta, un puente colgante (estilo Golden Gate) se queda fijo de fondo
  mientras bajas. La cámara lo recorre según la escena que estás leyendo:
    -1  llegada (desde lejos)
     0  presentación: el puente entero
     1  El problema: lado del comercio; paquetes rojos caen al agua (desperdicio)
     2  ¿Dónde se tira?: la torre del comercio
     3  Nuestro objetivo: vista alta; el puente se ilumina y los paquetes cruzan en verde
     4  La Ley 1/2025: desde debajo del tablero
     5  Cómo funciona: llegada al lado de la entidad social
  Si el navegador no tiene WebGL, se ve solo el fondo oscuro.
*/
(function () {
  "use strict";
  var historia = document.getElementById("historia");
  var lienzo = document.getElementById("puente");
  if (!historia || !lienzo || !window.THREE) return;
  var T = window.THREE;
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var escenas = Array.prototype.slice.call(historia.querySelectorAll(".escena"));
  var N = escenas.length;
  document.documentElement.classList.add("js");

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: false });
  } catch (e) { historia.classList.add("sin-3d"); return; }
  var pr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x03110A, 1);

  var escena = new T.Scene();
  escena.fog = new T.Fog(0x03110A, 55, 175);
  var camara = new T.PerspectiveCamera(42, 1, 0.1, 400);

  var MENTA = 0x4ADE80, VERDE = 0x22A35A, BOSQUE = 0x14532D, CORAL = 0xF2545B, AMBAR = 0xF5A524, TURQUESA = 0x2DD4BF;
  function suave(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  /* ---------- Medidas del puente (unidades libres) ---------- */
  var TORRE_X = 20, TORRE_ALTO = 23, AGUA_Y = -9, ANCLA_X = 47, ANCHO = 2.4;
  var CABLE_BAJO = 2.6; // altura del cable en el centro del vano

  function alturaCable(x) {
    var ax = Math.abs(x);
    if (ax <= TORRE_X) return CABLE_BAJO + (TORRE_ALTO - CABLE_BAJO) * Math.pow(ax / TORRE_X, 2);
    var u = (ANCLA_X - ax) / (ANCLA_X - TORRE_X); // 0 en el anclaje, 1 en la torre
    return 0.6 + (TORRE_ALTO - 0.6) * Math.pow(Math.max(0, u), 1.7);
  }

  var lineasPuente = new T.LineBasicMaterial({ color: MENTA, transparent: true, opacity: 0.55, fog: true });
  var lineasTenues = new T.LineBasicMaterial({ color: MENTA, transparent: true, opacity: 0.22, fog: true });
  var macizo = new T.MeshBasicMaterial({ color: 0x0A2417, fog: true });
  var bordes = new T.LineBasicMaterial({ color: VERDE, transparent: true, opacity: 0.9, fog: true });

  function caja(w, h, d, x, y, z, matBorde) {
    var g = new T.BoxGeometry(w, h, d);
    var m = new T.Mesh(g, macizo); m.position.set(x, y, z); escena.add(m);
    var e = new T.LineSegments(new T.EdgesGeometry(g), matBorde || bordes); e.position.copy(m.position); escena.add(e);
    return m;
  }

  // Torres: dos patas con travesaños, como el Golden Gate
  [-TORRE_X, TORRE_X].forEach(function (x) {
    [-ANCHO, ANCHO].forEach(function (z) { caja(1.1, TORRE_ALTO - AGUA_Y + 1, 1.3, x, (TORRE_ALTO + AGUA_Y) / 2 + 0.5, z); });
    [-4.5, 5.5, 11.5, 17, 21.6].forEach(function (y) { caja(0.9, y > 20 ? 1.4 : 0.9, ANCHO * 2, x, y, 0); });
  });
  // Tablero
  caja(ANCLA_X * 2 + 4, 0.7, ANCHO * 2 + 1.2, 0, -0.35, 0);
  // Anclajes y orillas
  [-1, 1].forEach(function (lado) { caja(5, 4, ANCHO * 2 + 3, lado * (ANCLA_X + 1.5), -1.6, 0); });

  // Edificios de cada orilla: comercio (ámbar) y entidad social (turquesa)
  var bordeComercio = new T.LineBasicMaterial({ color: AMBAR, transparent: true, opacity: 0.85, fog: true });
  var bordeEntidad = new T.LineBasicMaterial({ color: TURQUESA, transparent: true, opacity: 0.85, fog: true });
  caja(9, 6, 9, -(ANCLA_X + 10), 2.5, 0, bordeComercio);
  caja(9.6, 0.5, 3, -(ANCLA_X + 10), 4.2, 5.6, bordeComercio); // toldo
  caja(8, 8, 8, ANCLA_X + 10, 3.5, 0, bordeEntidad);
  caja(5, 0.6, 5, ANCLA_X + 10, 7.9, 0, bordeEntidad);

  // Cables principales y péndolas
  var puntosCable = [];
  [-ANCHO, ANCHO].forEach(function (z) {
    var linea = [];
    for (var i = 0; i <= 240; i++) {
      var x = -ANCLA_X + (i / 240) * ANCLA_X * 2;
      linea.push(new T.Vector3(x, alturaCable(x), z));
    }
    escena.add(new T.Line(new T.BufferGeometry().setFromPoints(linea), lineasPuente));
    for (var x = -ANCLA_X + 2; x <= ANCLA_X - 2; x += 1.6) {
      if (Math.abs(Math.abs(x) - TORRE_X) < 0.9) continue;
      puntosCable.push(x, 0, z, x, alturaCable(x), z);
    }
  });
  var gPendolas = new T.BufferGeometry();
  gPendolas.setAttribute("position", new T.Float32BufferAttribute(puntosCable, 3));
  var pendolas = new T.LineSegments(gPendolas, lineasTenues);
  escena.add(pendolas);

  // Luces del tablero (se encienden en "Nuestro objetivo")
  var lucesTablero = new T.LineBasicMaterial({ color: MENTA, transparent: true, opacity: 0.15, fog: true });
  [-1.1, 1.1].forEach(function (z) {
    escena.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-ANCLA_X - 2, 0.05, z), new T.Vector3(ANCLA_X + 2, 0.05, z)]), lucesTablero));
  });

  /* ---------- Agua hecha de puntos (como los continentes del planeta) ---------- */
  var agua = [];
  for (var ax = -130; ax <= 130; ax += 1.5) for (var az = -70; az <= 45; az += 1.5) agua.push(ax, AGUA_Y, az);
  var gAgua = new T.BufferGeometry();
  gAgua.setAttribute("position", new T.Float32BufferAttribute(agua, 3));
  var mAgua = new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { tiempo: { value: 0 }, pr: { value: pr }, brillo: { value: 0 } },
    vertexShader: "uniform float tiempo; uniform float pr; uniform float brillo; varying float vA; void main(){ vec3 p = position; float o = sin(p.x*0.16 + tiempo*0.9)*0.28 + cos(p.z*0.21 + tiempo*0.7)*0.28; p.y += o; vec4 mv = modelViewMatrix*vec4(p,1.0); float d = -mv.z; vA = (0.28 + o*0.6 + brillo*0.25*exp(-abs(p.z)*0.08)) * clamp(1.0 - (d-30.0)/150.0, 0.0, 1.0); gl_PointSize = 2.2*pr*clamp(40.0/d, 0.6, 2.2); gl_Position = projectionMatrix*mv; }",
    fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(0.29,0.87,0.50, vA*(1.0-d*2.0)); }"
  });
  escena.add(new T.Points(gAgua, mAgua));

  // Estrellas
  var est = [];
  for (var i = 0; i < 700; i++) {
    var u = Math.random(), t = Math.random() * Math.PI * 2, r = 220;
    est.push(Math.cos(t) * r * (0.4 + u), 25 + Math.random() * 120, -60 - Math.random() * 160);
  }
  var gEst = new T.BufferGeometry();
  gEst.setAttribute("position", new T.Float32BufferAttribute(est, 3));
  escena.add(new T.Points(gEst, new T.PointsMaterial({ color: 0xD1FAE5, size: 1.4 * pr, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false })));

  /* ---------- Paquetes de comida que cruzan el puente ---------- */
  var NP = 34, TRAMO = 104, VELOCIDAD = 7;
  var paquetes = new T.InstancedMesh(new T.BoxGeometry(1.1, 0.75, 0.9), new T.MeshBasicMaterial({ fog: true }), NP);
  var colorVerde = new T.Color(MENTA), colorCoral = new T.Color(CORAL), colorTmp = new T.Color();
  var m4 = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), esc = new T.Vector3();
  for (var p = 0; p < NP; p++) paquetes.setColorAt(p, colorVerde);
  escena.add(paquetes);
  function azar(a, b) { var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }

  function moverPaquetes(t, desperdicio) {
    for (var i = 0; i < NP; i++) {
      var recorrido = t * VELOCIDAD + i * (TRAMO / NP);
      var vuelta = Math.floor(recorrido / TRAMO);
      var x = -TRAMO / 2 + (recorrido % TRAMO);
      var carril = (i % 2 ? 1 : -1) * 1.15;
      var y = 0.4, z = carril, visible = Math.abs(x) < ANCLA_X + 4, color = colorVerde, giro = 0;
      // En la parte del problema, algunos paquetes caen al agua: son la comida que se tira.
      var cae = azar(i, vuelta) < desperdicio * 0.75;
      var xCaida = -36 + azar(vuelta, i) * 64;
      if (cae && x > xCaida) {
        var tau = (x - xCaida) / VELOCIDAD;
        y = 0.4 - 4.9 * tau * tau;
        z = carril + Math.sign(carril) * (1.5 + 4 * tau);
        x = xCaida + tau * 2;
        giro = tau * 3;
        color = colorCoral;
        if (y < AGUA_Y) visible = false;
      }
      pos.set(x, y, z);
      q.setFromAxisAngle(new T.Vector3(1, 0, 0.3).normalize(), giro);
      var s = visible ? 1 : 0.0001;
      esc.set(s, s, s);
      m4.compose(pos, q, esc);
      paquetes.setMatrixAt(i, m4);
      colorTmp.copy(color);
      paquetes.setColorAt(i, colorTmp);
    }
    paquetes.instanceMatrix.needsUpdate = true;
    if (paquetes.instanceColor) paquetes.instanceColor.needsUpdate = true;
  }

  /* ---------- Recorrido de la cámara (una parada por escena) ---------- */
  // [posición de la cámara], [hacia dónde mira]. La primera es la llegada (-1).
  var PARADAS = [
    [[0, 46, 120], [0, 4, 0]],
    [[0, 15, 74], [0, 7, 0]],
    [[-78, 9, 30], [-44, 3, -6]],
    [[-2, 10, 34], [-24, 10, 0]],
    [[24, 38, 66], [-4, 2, 0]],
    [[2, -5, 40], [-14, 7, 0]],
    [[80, 11, 30], [46, 4, -4]]
  ];
  var curvaPos = new T.CatmullRomCurve3(PARADAS.map(function (p) { return new T.Vector3().fromArray(p[0]); }), false, "centripetal");
  var curvaMira = new T.CatmullRomCurve3(PARADAS.map(function (p) { return new T.Vector3().fromArray(p[1]); }), false, "centripetal");
  var mira = new T.Vector3(), lejos = 1;

  // Etiquetas de las orillas
  var etqComercio = document.getElementById("etq-comercio"), etqEntidad = document.getElementById("etq-entidad");
  var puntoComercio = new T.Vector3(-(ANCLA_X + 10), 9, 0), puntoEntidad = new T.Vector3(ANCLA_X + 10, 11, 0), proy = new T.Vector3();
  function colocar(etq, punto) {
    proy.copy(punto).project(camara);
    var dentro = proy.z < 1 && Math.abs(proy.x) < 0.95 && Math.abs(proy.y) < 0.95;
    etq.style.opacity = dentro ? "1" : "0";
    if (dentro) etq.style.transform = "translate(" + ((proy.x + 1) / 2 * lienzo.clientWidth) + "px," + ((1 - proy.y) / 2 * lienzo.clientHeight) + "px) translate(-50%,-100%)";
  }

  /* ---------- Progreso: en qué escena estás (con decimales) ---------- */
  var viajero = document.getElementById("viajero"), recorridoBarra = document.getElementById("recorrido");
  function progreso() {
    var mitad = window.innerHeight / 2, centros = escenas.map(function (e) { var r = e.getBoundingClientRect(); return r.top + r.height / 2; });
    if (mitad <= centros[0]) {
      var h = escenas[0].getBoundingClientRect().height;
      return Math.max(-1, (mitad - centros[0]) / h);
    }
    for (var i = 0; i < N - 1; i++) {
      if (mitad < centros[i + 1]) return i + (mitad - centros[i]) / (centros[i + 1] - centros[i]);
    }
    return N - 1;
  }

  function medir() {
    var w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // En vertical (móvil) la cámara se aleja y abre el ángulo para que quepa el puente.
    lejos = camara.aspect < 1 ? 1.25 : 1;
    camara.fov = camara.aspect < 1 ? 55 : 42;
    camara.updateProjectionMatrix();
  }
  window.addEventListener("resize", medir);
  medir();

  var s = -1, sSuave = -1, reloj = new T.Clock(), tiempo = 0, activo = false;
  function dibujar() {
    if (!activo) return;
    requestAnimationFrame(dibujar);
    var dt = Math.min(reloj.getDelta(), 0.05);
    if (!reducido) tiempo += dt;
    s = progreso();
    // Suavizado igual en cualquier ordenador, vaya a los fotogramas que vaya.
    sSuave += (s - sSuave) * (reducido ? 1 : 1 - Math.exp(-dt * 4));
    var u = (Math.max(-1, Math.min(N - 1, sSuave)) + 1) / N;
    camara.position.copy(curvaPos.getPoint(u));
    mira.copy(curvaMira.getPoint(u));
    if (lejos !== 1) camara.position.sub(mira).multiplyScalar(lejos).add(mira);
    camara.lookAt(mira);

    var desperdicio = 1 - suave(1.4, 2.6, sSuave);
    var brillo = suave(2.4, 3.2, sSuave);
    lucesTablero.opacity = 0.15 + brillo * 0.7;
    lineasTenues.opacity = 0.22 + brillo * 0.25;
    mAgua.uniforms.tiempo.value = tiempo;
    mAgua.uniforms.brillo.value = brillo;
    moverPaquetes(tiempo + 3, desperdicio);
    colocar(etqComercio, puntoComercio);
    colocar(etqEntidad, puntoEntidad);
    if (viajero) viajero.style.left = (Math.max(0, Math.min(1, sSuave / (N - 1))) * 100) + "%";
    renderer.render(escena, camara);
  }

  // Solo se dibuja mientras la historia está en pantalla (ahorra batería).
  new IntersectionObserver(function (entradas) {
    var visible = entradas[0].isIntersecting;
    if (visible && !activo) { activo = true; reloj.getDelta(); medir(); dibujar(); }
    if (!visible) activo = false;
  }, { threshold: 0 }).observe(historia);

  // La barra «Comercio → Entidad social» solo se ve cuando el puente ocupa el centro de la pantalla.
  // (Empieza en «El problema», para no tapar el título del puente.)
  if (recorridoBarra) {
    var enCentro = new Set();
    var obsBarra = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) enCentro.add(e.target); else enCentro.delete(e.target); });
      recorridoBarra.classList.toggle("activo", enCentro.size > 0);
    }, { rootMargin: "-50% 0px -50% 0px" });
    historia.querySelectorAll(".capitulo").forEach(function (c) { obsBarra.observe(c); });
  }

  // Los paneles aparecen suavemente al llegar a ellos.
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.15 });
  historia.querySelectorAll(".panel-historia").forEach(function (p) { observador.observe(p); });
})();
