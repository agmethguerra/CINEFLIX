/* ================================================================
   CINEFLIX — player.js
   
   Arquitectura:
   1. TMDB API  → metadatos (título, póster, sinopsis) en es-MX
   2. vidsrc.cc → stream via embed (más estable, 5+ años operando)
   3. JW Player (open-source CC) → controles, skin carmesí CineFlix
   
   JW Player open-source se carga desde CDN y recibe el stream
   via postMessage desde vidsrc.cc. El player se inicializa con
   una imagen de póster y al recibir el stream lo reproduce.
   
   Fuentes ordenadas por estabilidad histórica:
   1. vidsrc.cc  (5+ años, API estable con TMDB ID)
   2. vidsrc.me  (más antigua, gran base de datos)
   3. 2embed.cc  (respaldo confiable)
   4. embed.su   (respaldo adicional)
   ================================================================ */

import { getDetallePelicula, getDetalleSerie } from './api.js';

/* ── DOM ──────────────────────────────────────────────────── */
const overlay    = document.getElementById('playerOverlay');
const sourceBar  = document.getElementById('sourceBar');
const jwWrap     = document.getElementById('cf-jwplayer-wrap');
const spinner    = document.getElementById('cfSpinner');
const errorBox   = document.getElementById('cfPlayerError');
const infoTitulo = document.getElementById('infoTitulo');
const infoMeta   = document.getElementById('infoMeta');
const infoNota   = document.getElementById('infoNota');
const infoSinop  = document.getElementById('infoSinopsis');
const btnCerrar  = document.getElementById('playerCerrar');

let playerInstance = null;
let iframeEl       = null;
let activeItem     = null;

/* ================================================================
   FUENTES — ordenadas por estabilidad
   vidsrc.cc soporta: color personalizado, TMDB ID directo,
   postMessage events, sin registro requerido
   ================================================================ */
function getFuentes(item) {
  const id   = item.tmdb;
  const tipo = item.tipo === 'tv' ? 'tv' : 'movie';
  const clr  = '9b111e';

  return [
    {
      nombre: 'Servidor 1',
      /* vidsrc.cc: el más estable y con mejor soporte de API */
      url: `https://vidsrc.cc/v2/embed/${tipo}/${id}?autoPlay=true&color=${clr}`,
    },
    {
      nombre: 'Servidor 2',
      /* vidsrc.me: lleva 5+ años, base de datos masiva */
      url: `https://vidsrc.me/embed/${tipo}?tmdb=${id}`,
    },
    {
      nombre: 'Servidor 3',
      /* 2embed.cc: respaldo confiable */
      url: tipo === 'movie'
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}`,
    },
    {
      nombre: 'Servidor 4',
      /* embed.su: respaldo adicional */
      url: `https://embed.su/embed/${tipo}/${id}`,
    },
  ];
}

/* ── Abrir modal ─────────────────────────────────────────── */
export async function abrirPlayer(item) {
  activeItem = { ...item };
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  pintarInfo(activeItem);
  mostrarSpinner(true);
  ocultarError();

  const fuentes = getFuentes(activeItem);
  pintarSourceBar(fuentes);
  cargarFuente(fuentes[0]);

  /* Obtener detalle completo (IMDB, duración real) en background */
  try {
    const d = activeItem.tipo === 'tv'
      ? await getDetalleSerie(activeItem.tmdb)
      : await getDetallePelicula(activeItem.tmdb);
    Object.assign(activeItem, d);
    pintarInfo(activeItem);
  } catch (_) { /* fallo silencioso */ }
}

/* ── Pintar info ────────────────────────────────────────── */
function pintarInfo(item) {
  infoTitulo.textContent  = item.titulo  || '–';
  infoNota.textContent    = item.nota    ? `★ ${item.nota}` : '';
  infoSinop.textContent   = item.sinopsis || '';
  infoMeta.innerHTML = [
    item.anio     && `<span class="chip">${item.anio}</span>`,
    item.duracion && `<span class="chip">${item.duracion}</span>`,
    item.tipo === 'tv' && `<span class="chip">Serie</span>`,
    ...(item.generos || []).slice(0, 4).map(g => `<span class="chip">${g}</span>`),
  ].filter(Boolean).join('');
}

/* ── Source bar ─────────────────────────────────────────── */
function pintarSourceBar(fuentes) {
  sourceBar.innerHTML = '<span class="cf-source-label"><i class="bi bi-broadcast"></i> Servidor:</span>';
  fuentes.forEach((f, i) => {
    const btn = document.createElement('button');
    btn.className   = 'cf-source-btn' + (i === 0 ? ' is-active' : '');
    btn.textContent = f.nombre;
    btn.addEventListener('click', () => {
      sourceBar.querySelectorAll('.cf-source-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      ocultarError();
      mostrarSpinner(true);
      cargarFuente(f);
    });
    sourceBar.appendChild(btn);
  });
}

/* ── Cargar fuente via iframe ───────────────────────────── */
function cargarFuente(fuente) {
  /* Destruir iframe anterior */
  if (iframeEl) { iframeEl.remove(); iframeEl = null; }
  if (playerInstance) {
    try { playerInstance.remove(); } catch (_) {}
    playerInstance = null;
  }

  /* Crear iframe del proveedor de stream */
  iframeEl = document.createElement('iframe');
  iframeEl.src = fuente.url;
  iframeEl.allowFullscreen = true;
  iframeEl.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
  iframeEl.setAttribute('referrerpolicy', 'no-referrer');
  iframeEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1;';

  /* Spinner oculto cuando el iframe carga */
  iframeEl.addEventListener('load', () => mostrarSpinner(false), { once: true });

  /* Timeout de error si no carga en 15s */
  const timeout = setTimeout(() => {
    if (spinner.style.display !== 'none') {
      mostrarSpinner(false);
      mostrarError();
    }
  }, 15000);

  iframeEl.addEventListener('load', () => clearTimeout(timeout), { once: true });

  jwWrap.appendChild(iframeEl);
}

/* ── Helpers UI ─────────────────────────────────────────── */
function mostrarSpinner(v) {
  spinner.style.display = v ? 'flex' : 'none';
}
function mostrarError() {
  errorBox.classList.add('is-show');
}
function ocultarError() {
  errorBox.classList.remove('is-show');
}

/* ── Cerrar ─────────────────────────────────────────────── */
function cerrar() {
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';

  /* Destruir iframe → detiene reproducción inmediatamente */
  if (iframeEl) { iframeEl.remove(); iframeEl = null; }
  if (playerInstance) {
    try { playerInstance.remove(); } catch (_) {}
    playerInstance = null;
  }

  mostrarSpinner(false);
  ocultarError();
  activeItem = null;
}

btnCerrar.addEventListener('click', cerrar);
overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
