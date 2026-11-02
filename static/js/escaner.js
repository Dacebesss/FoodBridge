/*
  FoodBridge · escáner de códigos de barras
  -----------------------------------------
  1. Abre la cámara trasera del móvil y lee el código de barras (EAN-13, EAN-8, UPC-A).
     Para evitar lecturas erróneas, solo acepta un código si su dígito de control
     cuadra y si se ha leído dos veces seguidas igual.
     - Si el navegador sabe leer códigos por sí solo (Chrome en Android), usa eso.
     - Si no (iPhone, Firefox…), usa la librería ZXing, guardada en static/vendor/.
     - Pide la cámara en alta resolución, con enfoque continuo y linterna si el móvil la tiene.
  2. Busca el código en Open Food Facts, una base de datos libre de alimentos.
     La búsqueda la hace el propio móvil, no nuestro servidor.
  3. Rellena el formulario: nombre, marca, categoría, foto, alérgenos y kilos.
     La fecha y la recogida las pone siempre el comercio.
*/
(function () {
  "use strict";

  var API = "https://world.openfoodfacts.org/api/v2/product/";
  var CAMPOS_API = "code,product_name,product_name_es,brands,product_quantity,product_quantity_unit,image_front_url,categories_tags,allergens_tags";

  var $ = function (id) { return document.getElementById(id); };
  var form = document.querySelector(".formulario-lote");
  if (!form) return;
  var botonEscanear = $("escanear"), visor = $("visor"), video = $("video"), botonParar = $("parar");
  var codigoManual = $("codigo-manual"), botonBuscar = $("buscar"), estado = $("estado-escaner");
  var campos = {
    codigo: form.querySelector("[name=codigo_barras]"),
    fotoUrl: form.querySelector("[name=foto_url]"),
    nombre: form.querySelector("[name=nombre]"),
    marca: form.querySelector("[name=marca]"),
    categoria: form.querySelector("[name=categoria]"),
    alergenos: form.querySelector("[name=alergenos]"),
    unidades: form.querySelector("[name=unidades]"),
    kg: form.querySelector("[name=kg]")
  };

  function avisar(texto, tipo) {
    estado.textContent = texto;
    estado.className = "estado-escaner" + (tipo ? " " + tipo : "");
  }

  /* ---------- Cámara ---------- */
  var flujo = null, lectorZXing = null, buscando = false, temporizadorAyuda = null;
  var ultimaLectura = null, vecesSeguidas = 0, linternaEncendida = false;
  var botonLinterna = $("linterna");

  // Cada vez que la cámara "cree" ver un código, pasa por aquí.
  function candidato(codigo) {
    if (!digitoDeControlCorrecto(codigo)) return;   // lectura a medias: la ignoramos
    if (codigo === ultimaLectura) vecesSeguidas++;
    else { ultimaLectura = codigo; vecesSeguidas = 1; }
    if (vecesSeguidas >= 2) leido(codigo);          // dos veces igual: lo damos por bueno
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
    visor.hidden = false;
    botonEscanear.hidden = true;
    ultimaLectura = null; vecesSeguidas = 0; linternaEncendida = false;
    avisar("Pon el código en horizontal dentro del recuadro y mantén el móvil quieto.");
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
      // Si en 10 segundos no lo ha leído, damos pistas.
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
        if (!buscando) return;
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
    botonEscanear.hidden = false;
    botonLinterna.hidden = true;
    botonLinterna.textContent = "Linterna";
    botonLinterna.setAttribute("aria-pressed", "false");
  }

  function leido(codigo) {
    parar();
    if (navigator.vibrate) navigator.vibrate(80);
    codigoManual.value = codigo;
    buscar(codigo);
  }

  /* ---------- Open Food Facts ---------- */
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
  var kgPorUnidad = null, kgTocadoAMano = false;

  function codigoValido(c) { return /^\d{8,14}$/.test(c); }

  // El último número de un código de barras es un "dígito de control" que se calcula con los demás.
  // Si no cuadra, el código está mal leído o mal escrito.
  function digitoDeControlCorrecto(c) {
    if (!codigoValido(c)) return false;
    var suma = 0;
    for (var i = c.length - 2, peso = 3; i >= 0; i--, peso = 4 - peso) suma += parseInt(c[i], 10) * peso;
    return (10 - (suma % 10)) % 10 === parseInt(c[c.length - 1], 10);
  }

  async function buscar(codigo) {
    codigo = (codigo || "").trim();
    if (!codigoValido(codigo)) { avisar("El código debe tener entre 8 y 14 números.", "error"); return; }
    if (!digitoDeControlCorrecto(codigo)) { avisar("Ese código no es válido: revisa que todos los números estén bien escritos.", "error"); return; }
    campos.codigo.value = codigo;
    avisar("Buscando el producto…");
    botonBuscar.disabled = true;
    try {
      var r = await fetch(API + encodeURIComponent(codigo) + ".json?fields=" + CAMPOS_API, { headers: { Accept: "application/json" } });
      var datos = r.ok ? await r.json() : null;
      if (!datos || datos.status !== 1 || !datos.product) {
        avisar("Este producto no está en Open Food Facts. Rellena los datos a mano (el código se guarda igual).", "aviso");
        $("encontrado").hidden = true;
        campos.nombre.focus();
        return;
      }
      rellenar(datos.product);
    } catch (e) {
      avisar("No hay conexión con Open Food Facts ahora mismo. Rellena los datos a mano.", "aviso");
    } finally {
      botonBuscar.disabled = false;
    }
  }

  function rellenar(p) {
    var nombre = (p.product_name_es || p.product_name || "").trim();
    var marca = (p.brands || "").split(",")[0].trim();
    if (nombre) campos.nombre.value = nombre.slice(0, 120);
    if (marca) campos.marca.value = marca.slice(0, 80);

    var etiquetas = p.categories_tags || [];
    for (var i = 0; i < CATEGORIAS.length; i++) {
      if (CATEGORIAS[i][1].some(function (t) { return etiquetas.indexOf(t) !== -1; })) { campos.categoria.value = CATEGORIAS[i][0]; break; }
    }

    var alergenos = (p.allergens_tags || []).map(function (t) { return ALERGENOS[t]; }).filter(Boolean);
    if (alergenos.length) campos.alergenos.value = alergenos.join(", ");

    var foto = p.image_front_url || "";
    if (foto.indexOf("https://images.openfoodfacts.org/") === 0) {
      campos.fotoUrl.value = foto;
      $("foto-previa-img").src = foto;
      $("foto-previa").hidden = false;
      $("encontrado-foto").src = foto;
      $("encontrado-foto").hidden = false;
    } else {
      $("encontrado-foto").hidden = true;
    }

    // Peso: Open Food Facts lo da en gramos o mililitros por unidad.
    var cantidad = parseFloat(p.product_quantity), unidad = (p.product_quantity_unit || "g").toLowerCase();
    kgPorUnidad = (cantidad > 0 && (unidad === "g" || unidad === "ml")) ? cantidad / 1000 : null;
    kgTocadoAMano = false;
    recalcularKg();

    $("encontrado-nombre").textContent = [nombre, marca].filter(Boolean).join(" · ") || "Producto encontrado";
    $("encontrado").hidden = false;
    avisar("¡Encontrado! Revisa los datos y completa la cantidad, la fecha y la recogida.", "ok");
    campos.unidades.focus();
  }

  function recalcularKg() {
    var ayuda = $("ayuda-kg");
    if (!kgPorUnidad || kgTocadoAMano) { ayuda.hidden = true; return; }
    var unidades = parseInt(campos.unidades.value, 10) || 1;
    campos.kg.value = (kgPorUnidad * unidades).toFixed(2);
    ayuda.textContent = "Calculado: " + unidades + " × " + kgPorUnidad.toLocaleString("es-ES") + " kg por unidad. Puedes cambiarlo.";
    ayuda.hidden = false;
  }

  /* ---------- Eventos ---------- */
  botonEscanear.addEventListener("click", empezar);
  botonParar.addEventListener("click", function () { parar(); avisar(""); });
  botonLinterna.addEventListener("click", cambiarLinterna);
  botonBuscar.addEventListener("click", function () { buscar(codigoManual.value); });
  codigoManual.addEventListener("keydown", function (e) {
    // Enter aquí busca el producto, no envía el formulario.
    if (e.key === "Enter") { e.preventDefault(); buscar(codigoManual.value); }
  });
  campos.unidades.addEventListener("input", recalcularKg);
  campos.kg.addEventListener("input", function () { kgTocadoAMano = true; $("ayuda-kg").hidden = true; });
  window.addEventListener("pagehide", parar);
})();
