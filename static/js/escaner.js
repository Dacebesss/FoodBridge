/*
  FoodBridge · escáner de códigos de barras
  -----------------------------------------
  1. Abre la cámara trasera del móvil y lee el código de barras (EAN-13, EAN-8, UPC).
     - Si el navegador sabe leer códigos por sí solo (Chrome en Android), usa eso.
     - Si no (iPhone, Firefox…), usa la librería ZXing, guardada en static/vendor/.
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
  var flujo = null, lectorZXing = null, buscando = false;

  function camaraDisponible() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext;
  }

  async function empezar() {
    if (!camaraDisponible()) {
      avisar("Este navegador no deja usar la cámara aquí. Escribe los números del código debajo.", "error");
      codigoManual.focus();
      return;
    }
    visor.hidden = false;
    botonEscanear.hidden = true;
    avisar("Apunta al código de barras y mantén el móvil quieto…");
    try {
      if ("BarcodeDetector" in window) {
        var formatos = await window.BarcodeDetector.getSupportedFormats();
        if (formatos.indexOf("ean_13") !== -1) return await conDetectorNativo();
      }
      if (window.ZXing) return conZXing();
      throw new Error("sin lector");
    } catch (e) {
      parar();
      if (e && e.name === "NotAllowedError") avisar("No has dado permiso para usar la cámara. Puedes escribir el código a mano.", "error");
      else avisar("No hemos podido abrir la cámara. Escribe el código a mano.", "error");
    }
  }

  async function conDetectorNativo() {
    flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    video.srcObject = flujo;
    await video.play();
    var detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    buscando = true;
    (async function mirar() {
      if (!buscando) return;
      try {
        var codigos = await detector.detect(video);
        if (codigos.length) { leido(codigos[0].rawValue); return; }
      } catch (e) { /* fotograma sin datos: seguimos */ }
      setTimeout(mirar, 150);
    })();
  }

  function conZXing() {
    var Z = window.ZXing;
    var pistas = new Map();
    pistas.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
    lectorZXing = new Z.BrowserMultiFormatReader(pistas, 200);
    buscando = true;
    return lectorZXing.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video, function (resultado) {
      if (resultado && buscando) leido(resultado.getText());
    });
  }

  function parar() {
    buscando = false;
    if (lectorZXing) { lectorZXing.reset(); lectorZXing = null; }
    if (flujo) { flujo.getTracks().forEach(function (p) { p.stop(); }); flujo = null; }
    video.srcObject = null;
    visor.hidden = true;
    botonEscanear.hidden = false;
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

  async function buscar(codigo) {
    codigo = (codigo || "").trim();
    if (!codigoValido(codigo)) { avisar("El código debe tener entre 8 y 14 números.", "error"); return; }
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
  botonBuscar.addEventListener("click", function () { buscar(codigoManual.value); });
  codigoManual.addEventListener("keydown", function (e) {
    // Enter aquí busca el producto, no envía el formulario.
    if (e.key === "Enter") { e.preventDefault(); buscar(codigoManual.value); }
  });
  campos.unidades.addEventListener("input", recalcularKg);
  campos.kg.addEventListener("input", function () { kgTocadoAMano = true; $("ayuda-kg").hidden = true; });
  window.addEventListener("pagehide", parar);
})();
