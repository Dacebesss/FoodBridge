/*
  FoodBridge · publicar un lote con el escáner
  --------------------------------------------
  1. La cámara se queda abierta y va leyendo códigos de barras (EAN-13, EAN-8, UPC-A):
     - Si el navegador sabe leer códigos por sí solo (Chrome en Android), usa eso.
     - Si no (iPhone, Firefox…), usa la librería ZXing, guardada en static/vendor/.
     - Para evitar errores, solo acepta un código si su dígito de control cuadra
       y si se ha leído dos veces seguidas igual.
  2. Cada código leído se añade a la lista. Si ya estaba, suma 1 unidad.
     Mientras el producto siga delante de la cámara no se vuelve a contar.
  3. Busca cada producto en Open Food Facts (base de datos libre de alimentos)
     para poner nombre, marca, categoría, foto, alérgenos y peso.
  4. Al publicar, la lista viaja al servidor como texto JSON en un campo oculto.
     El servidor lo vuelve a comprobar todo.
*/
(function () {
  "use strict";

  var API = "https://world.openfoodfacts.org/api/v2/product/";
  var CAMPOS_API = "code,product_name,product_name_es,brands,product_quantity,product_quantity_unit,image_front_url,categories_tags,allergens_tags";
  var $ = function (id) { return document.getElementById(id); };

  var form = $("formulario-lote");
  if (!form) return;
  var campoProductos = form.querySelector("[name=productos]");
  var campoNombreLote = form.querySelector("[name=nombre]");
  var lista = $("lista-productos"), plantilla = $("plantilla-producto");
  var total = $("total"), listaVacia = $("lista-vacia"), estado = $("estado-escaner");
  var botonEscanear = $("escanear"), visor = $("visor"), video = $("video");
  var botonParar = $("parar"), botonLinterna = $("linterna"), avisoVisor = $("aviso-visor");
  var codigoManual = $("codigo-manual"), botonBuscar = $("buscar");

  function avisar(texto, tipo) {
    estado.textContent = texto;
    estado.className = "estado-escaner" + (tipo ? " " + tipo : "");
  }
  function kgBonito(n) { return (Math.round(n * 100) / 100).toLocaleString("es-ES", { maximumFractionDigits: 2 }); }

  /* =========================================================
     Lista de productos
     ========================================================= */
  var productos = [];

  function guardar() {
    campoProductos.value = JSON.stringify(productos.map(function (p) {
      return { codigo_barras: p.codigo_barras || "", nombre: p.nombre || "", marca: p.marca || "",
               categoria: p.categoria || "", foto_url: p.foto_url || "", alergenos: p.alergenos || "",
               unidades: p.unidades, kg: p.kg || "" };
    }));
    var kg = productos.reduce(function (s, p) { return s + (parseFloat(p.kg) || 0); }, 0);
    var n = productos.length;
    total.textContent = n === 0 ? "0 productos" : n + (n === 1 ? " producto · " : " productos · ") + kgBonito(kg) + " kg";
    listaVacia.hidden = n > 0;
    // Nombre automático del lote (el mismo que pondría el servidor).
    var nombres = productos.map(function (p) { return p.nombre; }).filter(Boolean);
    campoNombreLote.placeholder = nombres.length === 0 ? "Se pone solo con los productos"
      : nombres.length === 1 ? nombres[0]
      : nombres.length === 2 ? nombres[0] + " y " + nombres[1]
      : nombres[0] + ", " + nombres[1] + " y " + (nombres.length - 2) + " más";
  }

  function crearFila(p) {
    var fila = plantilla.content.firstElementChild.cloneNode(true);
    p.fila = fila;
    fila.querySelector(".producto-nombre").addEventListener("input", function (e) { p.nombre = e.target.value; quitarError(p); pintarDetalle(p); guardar(); });
    fila.querySelector(".producto-categoria").addEventListener("change", function (e) { p.categoria = e.target.value; quitarError(p); guardar(); });
    fila.querySelector(".menos").addEventListener("click", function () { cambiarUnidades(p, -1); });
    fila.querySelector(".mas").addEventListener("click", function () { cambiarUnidades(p, +1); });
    fila.querySelector(".producto-kg").addEventListener("input", function (e) { p.kg = e.target.value; p.kgAMano = true; quitarError(p); guardar(); });
    fila.querySelector(".producto-foto img").addEventListener("error", function (e) { e.target.hidden = true; });
    fila.querySelector(".quitar").addEventListener("click", function () {
      productos.splice(productos.indexOf(p), 1);
      fila.remove();
      guardar();
    });
    lista.prepend(fila);  // lo último escaneado, arriba
    pintar(p);
    return fila;
  }

  function pintar(p) {
    var f = p.fila;
    var nombre = f.querySelector(".producto-nombre");
    if (document.activeElement !== nombre) nombre.value = p.nombre || "";
    pintarDetalle(p);
    var categoria = f.querySelector(".producto-categoria");
    categoria.value = p.categoria || "";
    categoria.hidden = !(p.noEncontrado || p.manual || !p.categoria) || p.buscando;
    f.querySelector(".unidades").textContent = p.unidades;
    var kg = f.querySelector(".producto-kg");
    if (document.activeElement !== kg) kg.value = p.kg || "";
    var img = f.querySelector(".producto-foto img");
    if (p.foto_url) { img.src = p.foto_url; img.hidden = false; } else { img.hidden = true; }
    f.classList.toggle("cargando", !!p.buscando);
  }

  function pintarDetalle(p) {
    p.fila.querySelector(".producto-detalle").textContent = p.buscando ? "Buscando en Open Food Facts…"
      : (p.noEncontrado && !p.nombre) ? "No está en Open Food Facts: escribe el nombre"
      : [p.marca, p.alergenos ? "Alérgenos: " + p.alergenos : ""].filter(Boolean).join(" · ");
  }

  function cambiarUnidades(p, cambio) {
    p.unidades = Math.min(999, Math.max(1, p.unidades + cambio));
    // Si sabemos lo que pesa cada unidad y nadie ha tocado el peso, lo recalculamos.
    if (p.kgUnidad && !p.kgAMano) p.kg = (p.kgUnidad * p.unidades).toFixed(2);
    pintar(p);
    guardar();
    p.fila.classList.remove("destello"); void p.fila.offsetWidth; p.fila.classList.add("destello");
  }

  function nuevo(p) {
    p.unidades = p.unidades || 1;
    if (estado.classList.contains("error")) avisar("");  // ya no hace falta el aviso de error anterior
    productos.unshift(p);  // mismo orden que en pantalla: lo último, arriba
    crearFila(p);
    guardar();
    return p;
  }

  /* ---------- Añadir por código (escáner o a mano) ---------- */
  var cache = {};  // código → datos de Open Food Facts (para no buscar dos veces)

  function anadirCodigo(codigo) {
    var existente = productos.filter(function (p) { return p.codigo_barras === codigo; })[0];
    if (existente) { cambiarUnidades(existente, +1); return existente; }
    var p = nuevo({ codigo_barras: codigo, nombre: "", categoria: "", kg: "", buscando: true });
    buscarEnOFF(p);
    return p;
  }

  async function buscarEnOFF(p) {
    var datos = cache[p.codigo_barras];
    if (datos === undefined) {
      try {
        var r = await fetch(API + encodeURIComponent(p.codigo_barras) + ".json?fields=" + CAMPOS_API, { headers: { Accept: "application/json" } });
        var json = r.ok ? await r.json() : null;
        datos = (json && json.status === 1 && json.product) ? json.product : null;
        cache[p.codigo_barras] = datos;
      } catch (e) {
        datos = null;
        avisar("No hay conexión con Open Food Facts ahora mismo. Escribe los nombres a mano.", "aviso");
      }
    }
    p.buscando = false;
    if (datos) rellenar(p, datos); else p.noEncontrado = true;
    pintar(p);
    guardar();
    if (p.noEncontrado && visor.hidden) p.fila.querySelector(".producto-nombre").focus();
    if (!visor.hidden) mostrarAvisoVisor(p.noEncontrado ? "Añadido · escribe el nombre luego" : "✓ " + p.nombre);
  }

  var CATEGORIAS = [
    // Se mira en este orden: lo primero que coincida gana.
    ["congelados", ["en:frozen-foods"]],
    ["lacteos", ["en:dairies", "en:milks", "en:yogurts", "en:cheeses", "en:eggs", "en:fermented-milk-products"]],
    ["pan_bolleria", ["en:breads", "en:viennoiseries", "en:pastries", "en:cakes", "en:biscuits-and-cakes", "en:sweet-pastries-and-pies"]],
    ["carne_pescado", ["en:meats", "en:fishes", "en:seafood", "en:poultries", "en:prepared-meats"]],
    ["platos", ["en:meals", "en:prepared-meals", "en:sandwiches", "en:pizzas", "en:prepared-salads"]],
    ["fruta_verdura", ["en:fruits", "en:vegetables", "en:fresh-fruits", "en:fresh-vegetables", "en:fruits-and-vegetables-based-foods"]],
    ["bebidas", ["en:beverages"]],
    ["despensa", ["en:pastas", "en:rices", "en:legumes", "en:canned-foods", "en:cereals-and-potatoes", "en:breakfast-cereals", "en:snacks", "en:condiments", "en:sauces", "en:spreads"]]
  ];
  var ALERGENOS = {
    "en:gluten": "gluten", "en:milk": "leche", "en:eggs": "huevo", "en:nuts": "frutos de cáscara",
    "en:peanuts": "cacahuetes", "en:soybeans": "soja", "en:fish": "pescado", "en:crustaceans": "crustáceos",
    "en:molluscs": "moluscos", "en:celery": "apio", "en:mustard": "mostaza", "en:sesame-seeds": "sésamo",
    "en:sulphur-dioxide-and-sulphites": "sulfitos", "en:lupin": "altramuces"
  };

  function rellenar(p, d) {
    p.nombre = (d.product_name_es || d.product_name || "").trim().slice(0, 120);
    if (!p.nombre) p.noEncontrado = true;  // está, pero sin nombre: que lo escriban
    p.marca = (d.brands || "").split(",")[0].trim().slice(0, 80);
    var etiquetas = d.categories_tags || [];
    p.categoria = "otros";
    for (var i = 0; i < CATEGORIAS.length; i++) {
      if (CATEGORIAS[i][1].some(function (t) { return etiquetas.indexOf(t) !== -1; })) { p.categoria = CATEGORIAS[i][0]; break; }
    }
    p.alergenos = (d.allergens_tags || []).map(function (t) { return ALERGENOS[t]; }).filter(Boolean).join(", ");
    var foto = d.image_front_url || "";
    p.foto_url = foto.indexOf("https://images.openfoodfacts.org/") === 0 ? foto : "";
    // Peso: Open Food Facts lo da en gramos o mililitros por unidad.
    var cantidad = parseFloat(d.product_quantity), unidad = (d.product_quantity_unit || "g").toLowerCase();
    p.kgUnidad = (cantidad > 0 && (unidad === "g" || unidad === "ml")) ? cantidad / 1000 : null;
    if (p.kgUnidad && !p.kgAMano) p.kg = (p.kgUnidad * p.unidades).toFixed(2);
  }

  /* ---------- Productos sin código (botones rápidos) ---------- */
  document.querySelectorAll(".chip-rapido").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = nuevo({ nombre: b.dataset.nombre, categoria: b.dataset.categoria, kg: "", manual: true });
      // Lo que falta por rellenar: el nombre (en «Otro») o el peso.
      p.fila.querySelector(p.nombre ? ".producto-kg" : ".producto-nombre").focus();
    });
  });

  /* ---------- Código escrito a mano ---------- */
  function codigoValido(c) { return /^\d{8,14}$/.test(c); }

  // El último número de un código de barras es un "dígito de control" que se calcula con los demás.
  // Si no cuadra, el código está mal leído o mal escrito.
  function digitoDeControlCorrecto(c) {
    if (!codigoValido(c)) return false;
    var suma = 0;
    for (var i = c.length - 2, peso = 3; i >= 0; i--, peso = 4 - peso) suma += parseInt(c[i], 10) * peso;
    return (10 - (suma % 10)) % 10 === parseInt(c[c.length - 1], 10);
  }

  function anadirEscrito() {
    var codigo = codigoManual.value.trim();
    if (!codigoValido(codigo)) { avisar("El código debe tener entre 8 y 14 números.", "error"); return; }
    if (!digitoDeControlCorrecto(codigo)) { avisar("Ese código no es válido: revisa que todos los números estén bien escritos.", "error"); return; }
    avisar("");
    anadirCodigo(codigo);
    codigoManual.value = "";
  }

  /* =========================================================
     Cámara
     ========================================================= */
  var flujo = null, lectorZXing = null, buscando = false, temporizadorAyuda = null, temporizadorAviso = null;
  var ultimaLectura = null, vecesSeguidas = 0, linternaEncendida = false, audio = null;
  var vistoPorUltimaVez = {};  // código → momento en que la cámara lo vio por última vez

  // Cada vez que la cámara "cree" ver un código, pasa por aquí.
  function candidato(codigo) {
    if (!digitoDeControlCorrecto(codigo)) return;  // lectura a medias: la ignoramos
    var ahora = Date.now();
    // ¿Es el mismo producto que sigue delante de la cámara? Entonces no lo contamos otra vez.
    if (vistoPorUltimaVez[codigo] && ahora - vistoPorUltimaVez[codigo] < 1500) { vistoPorUltimaVez[codigo] = ahora; return; }
    if (codigo === ultimaLectura) vecesSeguidas++;
    else { ultimaLectura = codigo; vecesSeguidas = 1; }
    if (vecesSeguidas >= 2) {  // dos veces igual: lo damos por bueno
      vistoPorUltimaVez[codigo] = ahora;
      ultimaLectura = null; vecesSeguidas = 0;
      leido(codigo);
    }
  }

  function leido(codigo) {
    pitido();
    if (navigator.vibrate) navigator.vibrate(60);
    clearTimeout(temporizadorAyuda);
    var p = anadirCodigo(codigo);
    mostrarAvisoVisor(p.buscando ? "Añadido · buscando…" : "+1 · " + (p.nombre || "producto") + " (" + p.unidades + ")");
    visor.classList.remove("leido"); void visor.offsetWidth; visor.classList.add("leido");
  }

  function mostrarAvisoVisor(texto) {
    avisoVisor.textContent = texto;
    avisoVisor.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () { avisoVisor.hidden = true; }, 2200);
  }

  // Un "pip" corto para saber que se ha leído sin mirar la pantalla (el iPhone no vibra desde la web).
  function pitido() {
    if (!audio) return;
    try {
      var osc = audio.createOscillator(), vol = audio.createGain();
      osc.frequency.value = 1200; vol.gain.value = 0.08;
      osc.connect(vol); vol.connect(audio.destination);
      osc.start(); osc.stop(audio.currentTime + 0.08);
    } catch (e) { /* sin sonido, no pasa nada */ }
  }

  function camaraDisponible() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext;
  }

  // Pedimos la cámara trasera en alta resolución: con poca resolución las barras finas se emborronan.
  async function abrirCamara() {
    var deseado = { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } };
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ video: deseado, audio: false });
    } catch (e) {
      if (e && e.name === "NotAllowedError") throw e;
      // Algunos móviles no aceptan la alta resolución: probamos con lo básico.
      flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    }
    var pista = flujo.getVideoTracks()[0];
    var puede = (pista && pista.getCapabilities) ? pista.getCapabilities() : {};
    // Enfoque automático continuo (Android): sin él, de cerca el código sale borroso.
    if (puede.focusMode && puede.focusMode.indexOf("continuous") !== -1) {
      try { await pista.applyConstraints({ advanced: [{ focusMode: "continuous" }] }); } catch (e) { /* no pasa nada */ }
    }
    // Linterna: solo se enseña el botón si el móvil la permite.
    botonLinterna.hidden = !puede.torch;
    video.srcObject = flujo;
    await video.play();
  }

  async function empezar() {
    if (!camaraDisponible()) {
      avisar("Este navegador no deja usar la cámara aquí. Escribe los números del código debajo.", "error");
      codigoManual.focus();
      return;
    }
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
    visor.hidden = false;
    botonEscanear.hidden = true;
    ultimaLectura = null; vecesSeguidas = 0; linternaEncendida = false; vistoPorUltimaVez = {};
    avisar("Pon el código en horizontal dentro del recuadro. Cuando termines, pulsa «Listo».");
    try {
      await abrirCamara();
      var nativo = false;
      if ("BarcodeDetector" in window) {
        var formatos = await window.BarcodeDetector.getSupportedFormats();
        nativo = formatos.indexOf("ean_13") !== -1;
      }
      if (nativo) conDetectorNativo();
      else if (window.ZXing) conZXing();
      else throw new Error("sin lector");
      temporizadorAyuda = setTimeout(function () {
        if (buscando) avisar("¿No lo lee? Aleja el móvil un poco (unos 15–20 cm), busca más luz o evita reflejos. También puedes escribir los números debajo.", "aviso");
      }, 10000);
    } catch (e) {
      parar();
      if (e && e.name === "NotAllowedError") avisar("No has dado permiso para usar la cámara. Puedes escribir el código a mano.", "error");
      else avisar("No hemos podido abrir la cámara. Escribe el código a mano.", "error");
    }
  }

  function conDetectorNativo() {
    var detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a"] });
    buscando = true;
    (async function mirar() {
      if (!buscando) return;
      try {
        var codigos = await detector.detect(video);
        codigos.forEach(function (c) { candidato(c.rawValue); });
      } catch (e) { /* fotograma sin datos: seguimos */ }
      setTimeout(mirar, 100);
    })();
  }

  function conZXing() {
    var Z = window.ZXing;
    var pistas = new Map();
    pistas.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A]);
    // Ojo: NO activar TRY_HARDER. Lo probamos y en esta versión de ZXing impide leer los EAN.
    lectorZXing = new Z.BrowserMultiFormatReader(pistas, 100);
    buscando = true;
    lectorZXing.decodeFromStream(flujo, video, function (resultado) {
      if (resultado && buscando) candidato(resultado.getText());
    });
  }

  async function cambiarLinterna() {
    if (!flujo) return;
    linternaEncendida = !linternaEncendida;
    try {
      await flujo.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: linternaEncendida }] });
      botonLinterna.setAttribute("aria-pressed", String(linternaEncendida));
      botonLinterna.textContent = linternaEncendida ? "Apagar linterna" : "Linterna";
    } catch (e) { botonLinterna.hidden = true; }
  }

  function parar() {
    buscando = false;
    clearTimeout(temporizadorAyuda);
    if (lectorZXing) { lectorZXing.reset(); lectorZXing = null; }
    if (flujo) { flujo.getTracks().forEach(function (p) { p.stop(); }); flujo = null; }
    video.srcObject = null;
    visor.hidden = true;
    avisoVisor.hidden = true;
    botonEscanear.hidden = false;
    botonLinterna.hidden = true;
    botonLinterna.textContent = "Linterna";
    botonLinterna.setAttribute("aria-pressed", "false");
  }

  /* =========================================================
     Fecha: cambia el texto según lo que pone en el envase
     ========================================================= */
  var campoFecha = $("campo-fecha"), etiquetaFecha = $("etiqueta-fecha");
  var TEXTOS_FECHA = { preferente: "Fecha de consumo preferente", caducidad: "Fecha de caducidad" };
  function actualizarFecha() {
    var marcado = form.querySelector("[name=tipo_fecha]:checked");
    var tipo = marcado ? marcado.value : "";
    campoFecha.hidden = tipo === "fresco";
    etiquetaFecha.textContent = TEXTOS_FECHA[tipo] || "¿Qué fecha pone?";
  }
  form.querySelectorAll("[name=tipo_fecha]").forEach(function (r) { r.addEventListener("change", actualizarFecha); });
  actualizarFecha();

  /* =========================================================
     Antes de publicar: comprobar la lista
     ========================================================= */
  function marcarError(p, texto) {
    var e = p.fila.querySelector(".producto-error");
    e.textContent = texto; e.hidden = false;
    p.fila.classList.add("con-error");
  }
  function quitarError(p) {
    p.fila.querySelector(".producto-error").hidden = true;
    p.fila.classList.remove("con-error");
  }

  form.addEventListener("submit", function (ev) {
    parar();
    var primero = null;
    if (productos.length === 0) {
      ev.preventDefault();
      avisar("Añade al menos un producto: escanéalo o usa los botones rápidos.", "error");
      estado.scrollIntoView({ block: "center" });
      return;
    }
    productos.forEach(function (p) {
      quitarError(p);
      var falta = p.buscando ? "Espera: todavía se está buscando este producto."
        : !(p.nombre || "").trim() ? "Escribe el nombre del producto."
        : !p.categoria ? "Elige la categoría."
        : !(parseFloat(p.kg) > 0) ? "Indica el peso total en kg."
        : "";
      if (falta) { marcarError(p, falta); primero = primero || p; }
    });
    if (primero) {
      ev.preventDefault();
      primero.fila.scrollIntoView({ block: "center" });
    }
  });

  /* =========================================================
     Arranque
     ========================================================= */
  // Si la página vuelve con datos (por un error o por «Publicar de nuevo»), reconstruimos la lista.
  try {
    var guardados = JSON.parse(campoProductos.value || "[]");
    guardados.slice().reverse().forEach(function (d) {
      nuevo({ codigo_barras: d.codigo_barras, nombre: d.nombre, marca: d.marca, categoria: d.categoria,
              foto_url: d.foto_url, alergenos: d.alergenos, unidades: parseInt(d.unidades, 10) || 1,
              kg: d.kg, kgAMano: true, manual: !d.codigo_barras });
    });
  } catch (e) { /* lista vacía */ }
  guardar();

  botonEscanear.addEventListener("click", empezar);
  botonParar.addEventListener("click", function () { parar(); avisar(""); });
  botonLinterna.addEventListener("click", cambiarLinterna);
  botonBuscar.addEventListener("click", anadirEscrito);
  codigoManual.addEventListener("keydown", function (e) {
    // Enter aquí añade el producto, no envía el formulario.
    if (e.key === "Enter") { e.preventDefault(); anadirEscrito(); }
  });
  window.addEventListener("pagehide", parar);
})();
