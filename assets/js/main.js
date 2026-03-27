/* ================================================================
   CINEFLIX — main.js  |  Orquestación principal
   ================================================================ */
import {
  getTendencias, getPeliculasPopulares, getSeriesPopulares,
  getPeliculasTopRated, getSeriesTopRated, getEnCartelera,
  getPorGenero, getSeriesPorGenero,
  getGenerosPeliculas, getGenerosSeries, buscar,
  GENEROS_MAP,
} from './api.js';
import {
  initHero, makeSeccion, buildSidebar,
  buildGeneroChips, buildDropdownGeneros,
  initBusqueda, mostrarCarga, mostrarError,
} from './ui.js';

const content = document.getElementById('mainContent');
let generos   = [];

/* ── Inicio ──────────────────────────────────────────────── */
async function renderInicio() {
  mostrarCarga(content);
  try {
    const [tend, pops, sers, top, cart] = await Promise.all([
      getTendencias(), getPeliculasPopulares(),
      getSeriesPopulares(), getPeliculasTopRated(), getEnCartelera(),
    ]);
    initHero(tend.filter(m => m.backdrop));
    content.innerHTML = '';
    content.appendChild(makeSeccion('Top 10 en Tendencia',    tend.slice(0,10), 'top'));
    content.appendChild(makeSeccion('Películas Populares',    pops));
    content.appendChild(makeSeccion('Series Populares',       sers));
    content.appendChild(makeSeccion('Las Mejor Valoradas',    top));
    content.appendChild(makeSeccion('Ahora en Cines',         cart));
    buildSidebar([...tend, ...pops, ...sers]);
  } catch (e) {
    console.error(e);
    mostrarError(content, renderInicio);
  }
}

async function renderPeliculas() {
  mostrarCarga(content);
  try {
    const [pops, top, cart] = await Promise.all([
      getPeliculasPopulares(), getPeliculasTopRated(), getEnCartelera(),
    ]);
    content.innerHTML = '';
    content.appendChild(makeSeccion('Películas Populares',  pops));
    content.appendChild(makeSeccion('Mejor Valoradas',       top));
    content.appendChild(makeSeccion('Ahora en Cines (MX)',   cart));
  } catch (e) { mostrarError(content, renderPeliculas); }
}

async function renderSeries() {
  mostrarCarga(content);
  try {
    const [pops, top] = await Promise.all([getSeriesPopulares(), getSeriesTopRated()]);
    content.innerHTML = '';
    content.appendChild(makeSeccion('Series Populares',         pops));
    content.appendChild(makeSeccion('Series Mejor Valoradas',   top));
  } catch (e) { mostrarError(content, renderSeries); }
}

async function renderGenero(genero) {
  const nombre = genero.name || genero;
  const id     = genero.id   || null;
  if (!id) return;
  mostrarCarga(content);
  try {
    const [peli, ser] = await Promise.all([getPorGenero(id), getSeriesPorGenero(id)]);
    content.innerHTML = '';
    if (peli.length) content.appendChild(makeSeccion(`${nombre} — Películas`, peli));
    if (ser.length)  content.appendChild(makeSeccion(`${nombre} — Series`,    ser));
    if (!peli.length && !ser.length)
      content.innerHTML = `<p style="padding:2rem;font-family:var(--f-ui);color:var(--c-text-muted)">Sin resultados para "${nombre}".</p>`;
    content.scrollIntoView({ behavior:'smooth', block:'start' });
  } catch (e) { mostrarError(content, () => renderGenero(genero)); }
}

/* ── Init ────────────────────────────────────────────────── */
(async function init() {
  /* Géneros en es-MX */
  try {
    const [gP, gS] = await Promise.all([getGenerosPeliculas(), getGenerosSeries()]);
    const seen = new Set();
    generos = [...gP, ...gS].filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id); return true;
    });
  } catch (_) {
    generos = Object.entries(GENEROS_MAP).map(([id,name]) => ({id:+id, name}));
  }

  buildDropdownGeneros(generos, renderGenero);
  buildGeneroChips(generos, renderGenero);
  initBusqueda(buscar);

  /* Navbar */
  ['navInicio','navInicio2'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); renderInicio();
    });
  });
  document.getElementById('navPeliculas')?.addEventListener('click', e => { e.preventDefault(); renderPeliculas(); });
  document.getElementById('navSeries')?.addEventListener('click',    e => { e.preventDefault(); renderSeries(); });

  await renderInicio();
})();
