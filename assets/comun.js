/* Universidades · Perpetuo — piezas compartidas por index.html y admin.html.
   Mismo patrón que eventos.perpetuo.global: sitio estático en GitHub Pages + backend en Apps Script
   (Universidades.gs) que guarda el contenido en una hoja de Google y las imágenes en Drive. */

const CONFIG = {
  API_URL: "", // URL /exec de la aplicación web de Universidades.gs; vacío = modo demostración (todo vive en este navegador)
  CLAVE_CACHE: "perpetuo-universidades-cache",
  // F1: perpetuo.global vive en Substack, que no deja mostrar sus posts dentro de otra página.
  // Si algún día se puede, cambia a true y los textos se abrirán en un iframe dentro del panel.
  LEER_EN_IFRAME: false,
  SITIO: "https://www.perpetuo.global"
};

const SECCIONES = ["Estelar", "Anteojos", "Creativo", "Pódcasts"];

/* ---------------- contenido inicial ----------------
   Lo que la página traía escrito a mano, con los cambios de noviembre de 2026. Es el punto de partida
   del panel: el modo demostración arranca con esto, y cuando la hoja de Google está vacía el panel lo
   carga para que solo haya que darle «Guardar». */
const SEMILLA = {
  metricas: [
    { id: "textos", valor: "+700", etiqueta: "textos publicados" },
    { id: "lectores", valor: "~50,000", etiqueta: "lectores al mes" },
    { id: "suscriptores", valor: "+7,000", etiqueta: "suscriptores al newsletter" },
    { id: "paises", valor: "79", etiqueta: "países, los 21 de habla hispana" }
  ],
  ajustes: {
    podcastsFrecuencia: "episodios nuevos dos veces por semana", // completa «textos nuevos tres veces por semana y …»; vacío = la frase solo habla de los textos
    fotoLector: "assets/img/lector.webp"
  },
  textos: [
    { id: "violencia", titulo: "Dos formas de narrar la violencia", autor: "Dahlia de la Cerda", seccion: "Estelar",
      imagen: "assets/img/violencia.webp", url: "https://www.perpetuo.global/p/dos-formas-de-narrar-la-violencia", premio: "Longlist del International Booker Prize" },
    { id: "haiti", titulo: "Haití, la revuelta eterna", autor: "Juan Martínez d’Aubuisson", seccion: "Estelar",
      imagen: "assets/img/haiti.webp",
      url: "https://www.perpetuo.global/p/haiti-la-revuelta-eterna", premio: "Premio Ortega y Gasset 2024 · Premio Gabo 2025" },
    { id: "sobreviviente", titulo: "El sobreviviente contrafáctico", autor: "Javier Sinay", seccion: "Estelar",
      imagen: "assets/img/sobreviviente.webp", url: "https://www.perpetuo.global/p/el-sobreviviente-contrafactico", premio: "Premio Gabo 2015" }
  ],
  premios: [
    { id: "p1", autor: "Juan Martínez d’Aubuisson", premio: "Premio Ortega y Gasset", anio: "2024" },
    { id: "p2", autor: "Juan Martínez d’Aubuisson", premio: "Premio Gabo", anio: "2025" },
    { id: "p3", autor: "Javier Sinay", premio: "Premio Gabo", anio: "2015" },
    { id: "p4", autor: "Dahlia de la Cerda", premio: "Longlist del International Booker Prize", anio: "" },
    { id: "p5", autor: "Rosa Berbel", premio: "Premio Ojo Crítico de Poesía de RNE", anio: "2019" }
  ],
  logos: [
    { id: "osv", nombre: "O’Shaughnessy Ventures", imagen: "assets/logos/osv.webp", url: "" },
    { id: "ev", nombre: "Emergent Ventures", imagen: "assets/logos/ev.webp", url: "" }
  ]
};

/* ---------------- utilidades ---------------- */
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const urlOk = v => { try { const u = new URL(v); return u.protocol === "https:" || u.protocol === "http:"; } catch (e) { return false; } };
// imágenes: del repo (assets/…), de internet (https) o recién subidas en modo demostración (data:)
const imagenOk = v => !!v && (/^assets\/[\w\-./]+$/.test(v) || /^https:\/\//.test(v) || /^data:image\/(jpeg|png|webp);base64,/.test(v));
const copia = o => JSON.parse(JSON.stringify(o));
const azar = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
// "+7,000" → "7,000"; sirve para «Más de 700 textos»
const soloNumero = v => String(v || "").replace(/^[^\d]+/, "").trim();

/* completa lo que falte para que la página nunca se rompa con una hoja a medias */
function normalizar(c) {
  c = c && typeof c === "object" ? c : {};
  const lista = (x, campos) => (Array.isArray(x) ? x : []).filter(o => o && typeof o === "object")
    .map(o => Object.fromEntries(["id", ...campos].map(k => [k, o[k] == null ? "" : String(o[k])])));
  return {
    metricas: lista(c.metricas, ["valor", "etiqueta"]),
    ajustes: { ...SEMILLA.ajustes, ...(c.ajustes || {}) },
    textos: lista(c.textos, ["titulo", "autor", "seccion", "imagen", "url", "premio"]),
    premios: lista(c.premios, ["autor", "premio", "anio"]),
    logos: lista(c.logos, ["nombre", "imagen", "url"])
  };
}
const vacio = c => !c || !(c.metricas && c.metricas.length) && !(c.textos && c.textos.length);

/* ---------------- API ---------------- */
// Igual que en eventos: text/plain evita el preflight de CORS que Apps Script no contesta, y como Google
// deja colgadas algunas peticiones al azar, si la primera no contesta en unos segundos lanzamos otra en
// paralelo y nos quedamos con la primera respuesta. Las escrituras llevan «idem» para que el servidor
// las haga una sola vez.
const LECTURAS = ["contenido", "admin.entrar", "admin.contenido"];
async function api(accion, datos = {}) {
  if (!CONFIG.API_URL) return Demo(accion, datos);
  const lectura = LECTURAS.includes(accion);
  if (!lectura && !datos.idem) datos.idem = azar(16);
  const cuerpo = JSON.stringify({ accion, ...datos });
  const [cada, copias, total] = accion === "admin.subirImagen" ? [12000, 3, 60000] : lectura ? [1500, 10, 25000] : [5000, 7, 45000];
  const cortes = [];
  try {
    return await new Promise((ok, mal) => {
      let vivas = 0, lanzadas = 0, listo = false, relojCopias;
      const fin = (f, v) => { if (!listo) { listo = true; clearInterval(relojCopias); clearTimeout(relojTotal); f(v); } };
      const lanzar = () => {
        if (listo || lanzadas >= copias) return;
        lanzadas++; vivas++;
        const corte = new AbortController(); cortes.push(corte);
        fetch(CONFIG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: cuerpo, signal: corte.signal })
          .then(r => r.json())
          .then(j => j.error ? fin(mal, new Error(j.error)) : fin(ok, j))
          .catch(e => {
            vivas--;
            if (!listo && e.name !== "AbortError") console.warn("Universidades: copia de " + accion + " falló", e);
            if (!listo && vivas === 0) lanzar();
          });
      };
      const relojTotal = setTimeout(() => fin(mal, new Error("red")), total);
      relojCopias = setInterval(lanzar, cada);
      lanzar();
    });
  } finally { cortes.forEach(c => c.abort()); }
}

const ERRORES = {
  clave: "Esa no es la clave.",
  imagen: "La imagen pesa demasiado (máximo 5 MB) o no es JPG, PNG o WebP.",
  datos: "Faltan datos obligatorios o hay un enlace que no es válido.",
  red: "La conexión con el servidor está lenta. Espera un momento e inténtalo de nuevo.",
  configuracion: "El servidor no está configurado: falta ADMIN_CLAVE o ejecutar instalar() en Apps Script."
};
const errorTexto = e => ERRORES[e && e.message] || "Algo falló de nuestro lado. Revisa tu conexión e inténtalo de nuevo.";

/* ---------------- modo demostración ----------------
   Imita a Universidades.gs con localStorage para probar sin backend. La clave del panel es "perpetuo". */
const Demo = (() => {
  const K = "perpetuo-universidades-demo";
  const leer = () => { try { return JSON.parse(localStorage.getItem(K)) || copia(SEMILLA); } catch (e) { return copia(SEMILLA); } };
  const guardar = c => { try { localStorage.setItem(K, JSON.stringify(c)); } catch (e) { throw new Error("espacio"); } };
  const espera = ms => new Promise(r => setTimeout(r, ms));
  return async (accion, d) => {
    await espera(accion === "contenido" ? 150 : 500);
    if (accion === "contenido") return { ok: true, contenido: normalizar(leer()) };
    if (d.clave !== "perpetuo") throw new Error("clave");
    if (accion === "admin.entrar") return { ok: true };
    if (accion === "admin.contenido") return { ok: true, contenido: normalizar(leer()) };
    if (accion === "admin.guardar") { const c = normalizar(d.contenido); guardar(c); return { ok: true, contenido: c }; }
    if (accion === "admin.subirImagen") return { ok: true, url: "data:" + d.tipo + ";base64," + d.datos };
    throw new Error("accion");
  };
})();
