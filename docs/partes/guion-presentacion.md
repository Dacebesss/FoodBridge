# Guion de la presentación final (14/12/2026)

Volver a [[0-reparto]]. Cada uno explica **su parte** del entregable. Unos **2 minutos por persona**
(≈ 16 minutos en total; ajustar cuando sepamos el tiempo exacto). Los textos son una base: cada uno
los dice **con sus palabras**, sin leer.

| Orden | Quién | Qué cuenta | Qué se ve en pantalla |
|---|---|---|---|
| 1 | Diego Acebes | Apertura: quiénes somos y cómo nos organizamos | La Tierra girando |
| 2 | Pablo Cabanillas | El problema con datos y la Ley 1/2025 | Fichas de países + capítulo «El problema» |
| 3 | Xinxin Zhu | La idea: del mundo a Villaviciosa y el puente | Zoom a Villaviciosa → puente |
| 4 | Daniel Panadero | FoodBridge en directo con el público | `/#directo` con el QR |
| 5 | Daniel Madgwick | Demo: el comercio publica con el escáner | Móvil proyectado: escanear un producto |
| 6 | Juan Diego Ramírez | Quién puede reservar: cuentas y entidades verificadas | Panel de la entidad y `/admin` |
| 7 | Diego Fernández | Reserva, PIN y entrega registrada | Reservar → PIN → entregar |
| 8 | Diego Acebes | Cierre: qué hemos aprendido y siguientes pasos | Puente con el contador del directo |

---

## 1 · Diego Acebes — Apertura (1 min)
- «Somos FoodBridge, 7 alumnos de 1.º de Ingeniería Informática. Hemos hecho una web que conecta los comercios que
  tienen comida que les sobra con las entidades sociales que la necesitan, empezando por Villaviciosa de Odón.»
- «Primero montamos una base común y después nos repartimos el proyecto en **7 áreas**, cada una con un responsable,
  su rama en GitHub y revisión antes de unir el trabajo. Cada uno os va a contar la suya.»
- Paso a Pablo: «¿Por qué hace falta esto? Os lo cuenta Pablo.»

## 2 · Pablo Cabanillas — El problema y la ley (2 min)
- «En 2022 se tiraron **1.052 millones de toneladas** de comida en el mundo: **132 kg por persona** al año. Es el
  **19 %** de la comida disponible y entre el **8 y el 10 %** de las emisiones mundiales.» (UNEP, *Food Waste Index Report 2024*)
- «En España se tiraron **1.125 millones de kilos o litros** en 2024, casi todo en los hogares.» (Ministerio de Agricultura)
- «Y hay una ley nueva: la **Ley 1/2025**. Desde **abril de 2026** obliga a las empresas a seguir un orden: primero
  prevenir y, si sobra, **donar**. FoodBridge ayuda justo ahí, y deja **registrada cada entrega**.»
- «Todas las cifras que veis tienen su fuente; si no la tenía, la quitamos.»
- Paso a Xinxin.

## 3 · Xinxin Zhu — La idea y la portada (2 min)
- «Queríamos que la web contara el problema antes de explicar la solución. Por eso empieza con la **Tierra**: cada
  país tiene su dato y su fuente.»
- Tocar **Villaviciosa de Odón**: «Del problema global, a la calle de al lado.» (zoom → puente)
- «FoodBridge es un **puente**: a un lado el comercio y al otro la entidad social. Cada furgoneta es una donación.»
- Abrir un capítulo (por ejemplo «Nuestro objetivo»): los objetivos del piloto.
- «Identidad: verde y blanco, sencilla y seria. Funciona en el ordenador y en el móvil.»
- Paso a Daniel Panadero: «Y ahora os toca a vosotros.»

## 4 · Daniel Panadero — En directo (2 min)
- «Sacad el móvil y escanead el QR con la cámara. Escribid el nombre de vuestro comercio inventado, elegid qué os ha
  sobrado y pulsad *Enviar al puente*.»
- Mientras cruzan: «Cada furgoneta es vuestra, con el nombre de vuestro comercio. Cuando llega a la entidad, suma los
  kilos al contador de la sala.»
- «Es una **simulación** para hoy: no son donaciones reales. La app de verdad os la enseñamos ahora.»
- Paso a Daniel Madgwick.

## 5 · Daniel Madgwick — El comercio publica con el escáner (2 min)
- «Así lo haría un supermercado de verdad.» Entrar como comercio (`plaza@foodbridge.es`), *Publicar* → *Escanear*.
- «La cámara lee el código de barras y busca el producto en **Open Food Facts**, una base de datos libre: rellena
  nombre, marca, foto, alérgenos y peso.»
- «Para no equivocarse, comprueba el **dígito de control** y que lo ha leído **dos veces igual**.»
- «La fecha y la hora de recogida las pone el comercio: el código de barras no dice cuándo caduca ese envase.» → Publicar.
- Paso a Juan Diego.

## 6 · Juan Diego Ramírez — Cuentas y entidades verificadas (2 min)
- «¿Quién puede llevarse esa comida? No cualquiera.»
- «Hay tres tipos de cuenta: **comercio**, **entidad social** y **administrador**.»
- «Una entidad tiene que dar su **nº de registro o CIF** y queda **pendiente** hasta que un administrador la aprueba.
  Así nadie se hace pasar por una ONG.» Enseñar `/admin` con una entidad pendiente.
- «Cada cuenta guarda su **municipio**: una entidad solo ve los lotes de su zona. Por eso la web puede crecer a otros
  pueblos sin cambiar nada.»
- Paso a Diego Fernández con la entidad aprobada (`sanjose@foodbridge.es`).

## 7 · Diego Fernández — Reserva, PIN y entrega (2 min)
- Como entidad, **reservar** el lote que acaba de publicar Daniel: «El primero que llega se lo lleva. Si dos entidades
  pulsan a la vez, la base de datos solo deja ganar a una.»
- «Al reservar, la entidad recibe un **PIN de 4 cifras**.» En el comercio, escribir el PIN → **entrega registrada**.
- «Tras 5 PIN incorrectos, el PIN cambia: nadie puede adivinarlo probando.»
- «Reglas de fechas: lo de **consumo preferente** se puede donar aunque haya pasado; lo **caducado**, nunca.»
- «Si la entidad cancela y queda al menos un día, el lote vuelve a publicarse para otra.»
- Paso a Diego Acebes.

## 8 · Diego Acebes — Cierre (1 min)
- Volver al puente con el contador: «Hoy, en esta sala, hemos rescatado **X kg** entre todos.»
- «Lo que hemos aprendido: repartir el trabajo, revisar lo de los demás y decir solo lo que podemos demostrar.»
- «Siguientes pasos: probarlo con un comercio real de Villaviciosa y convertirlo en app para el móvil.»
- «Gracias. ¿Preguntas?» → cada pregunta la responde el responsable de esa parte.

---

## Antes de presentar
- [ ] `python manage.py directo_reiniciar` (contador a cero) y `python manage.py datos_demo --lotes-nuevos`.
- [ ] Ordenador del proyector con `/#directo` abierto; un móvil con datos para la demo del escáner.
- [ ] Un producto con código de barras a mano para escanear.
- [ ] Plan B si falla internet: vídeo grabado de la demo.
- [ ] Ensayo completo cronometrado con los 7.
