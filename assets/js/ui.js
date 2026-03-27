/* ================================================================
   CINEFLIX — ui.js  |  Componentes de interfaz
   ================================================================ */
import { abrirPlayer } from './player.js';

const PH_P = 'https://placehold.co/150x225/141414/9b111e?text=CF';
const PH_B = 'https://placehold.co/300x169/141414/9b111e?text=CineFlix';

/* ── Toast ─────────────────────────────────────────────────── */
export function toast(msg) {
  const t = document.getElementById('cfToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('is-show'), 2800);
}

/* ── Skeleton ──────────────────────────────────────────────── */
export function skeletonRow(n = 8, v = 'card') {
  const w = document.createElement('div');
  w.className = 'cf-row';
  for (let i = 0; i < n; i++) {
    const sk = document.createElement('div');
    sk.className = v === 'top' ? 'cf-skeleton cf-skeleton-wide' : 'cf-skeleton';
    w.appendChild(sk);
  }
  return w;
}

/* ── Card estándar ─────────────────────────────────────────── */
export function makeCard(item) {
  const el = document.createElement('div');
  el.className = 'cf-card';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', item.titulo);
  el.innerHTML = `
    <img class="cf-card-poster" src="${item.poster||PH_P}" alt="${item.titulo}" loading="lazy" onerror="this.src='${PH_P}'"/>
    <span class="cf-card-badge">★ ${item.nota||'–'}</span>
    <div class="cf-card-play"><i class="bi bi-play-circle-fill"></i></div>
    <div class="cf-card-info">
      <div class="cf-card-name">${item.titulo}</div>
      <div class="cf-card-sub">${item.anio||''} · ${item.tipo==='tv'?'Serie':item.generos?.[0]||''}</div>
    </div>`;
  const open = () => abrirPlayer(item);
  el.addEventListener('click', open);
  el.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  return el;
}

/* ── Card Top-10 ───────────────────────────────────────────── */
export function makeTopCard(item, rank) {
  const el = document.createElement('div');
  el.className = 'cf-card-top';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.innerHTML = `
    <span class="cf-card-top-num">${rank}</span>
    <img class="cf-card-top-img" src="${item.backdrop||PH_B}" alt="${item.titulo}" loading="lazy" onerror="this.src='${PH_B}'"/>
    <div class="cf-card-top-info">
      <div class="cf-card-top-name">${item.titulo}</div>
      <div class="cf-card-top-sub">${item.generos?.[0]||''} · ${item.anio||''}</div>
    </div>`;
  const open = () => abrirPlayer(item);
  el.addEventListener('click', open);
  el.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  return el;
}

/* ── Sección con fila ──────────────────────────────────────── */
export function makeSeccion(titulo, items, variante = 'card') {
  const sec = document.createElement('section');
  sec.className = 'cf-row-wrap cf-section';
  sec.innerHTML = `<div class="cf-row-head"><h2 class="cf-row-title">${titulo}</h2></div>`;
  const fila = document.createElement('div');
  fila.className = 'cf-row';
  items.slice(0, 20).forEach((item, i) => {
    fila.appendChild(variante === 'top' ? makeTopCard(item, i + 1) : makeCard(item));
  });
  sec.appendChild(fila);
  return sec;
}

/* ── Pantalla de carga ─────────────────────────────────────── */
export function mostrarCarga(container, v = 'card') {
  container.innerHTML = '';
  const s = document.createElement('section');
  s.className = 'cf-row-wrap cf-section';
  s.innerHTML = '<div class="cf-row-head"><h2 class="cf-row-title">Cargando…</h2></div>';
  s.appendChild(skeletonRow(8, v));
  container.appendChild(s);
}

/* ── Error state ───────────────────────────────────────────── */
export function mostrarError(container, retryFn) {
  container.innerHTML = `
    <div class="cf-state-msg">
      <i class="bi bi-wifi-off"></i>
      <p>No se pudo conectar con el servidor de datos.<br>Verifica tu conexión a internet.</p>
      <button id="retryBtn">Reintentar</button>
    </div>`;
  container.querySelector('#retryBtn')?.addEventListener('click', retryFn);
}

/* ── Hero slideshow ────────────────────────────────────────── */
export function initHero(items) {
  const bg   = document.getElementById('heroBg');
  const tit  = document.getElementById('heroTitulo');
  const met  = document.getElementById('heroMeta');
  const sin  = document.getElementById('heroSinopsis');
  const dots = document.getElementById('heroDots');
  const play = document.getElementById('heroPlay');
  const tag  = document.getElementById('heroTag');
  if (!bg) return;

  const lista = items.filter(m => m.backdrop).slice(0, 6);
  let idx = 0, timer = null;

  dots.innerHTML = '';
  lista.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'cf-hero-dot' + (i === 0 ? ' is-active' : '');
    d.addEventListener('click', () => { irA(i); resetTimer(); });
    dots.appendChild(d);
  });

  function irA(i) {
    idx = (i + lista.length) % lista.length;
    const m = lista[idx];
    bg.style.backgroundImage = `url('${m.backdrop}')`;
    tit.textContent = m.titulo;
    sin.textContent = m.sinopsis || '';
    if (tag) tag.textContent = m.tipo === 'tv' ? '⬤ Serie' : '⬤ Película';
    met.innerHTML = [
      m.anio   && `<span>${m.anio}</span>`,
      m.nota   && `<span>★ ${m.nota}</span>`,
      ...(m.generos||[]).slice(0,2).map(g => `<span>${g}</span>`),
    ].filter(Boolean).join('');
    document.querySelectorAll('.cf-hero-dot').forEach((d,j) => d.classList.toggle('is-active', j===idx));
    play.onclick = () => abrirPlayer(m);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => irA(idx + 1), 7000);
  }

  irA(0); resetTimer();
  const hs = document.getElementById('heroSection');
  if (hs) {
    hs.addEventListener('mouseenter', () => clearInterval(timer));
    hs.addEventListener('mouseleave', resetTimer);
  }
}

/* ── Sidebar ───────────────────────────────────────────────── */
export function buildSidebar(items) {
  const lista = document.getElementById('masVistosList');
  if (!lista) return;
  lista.innerHTML = '';
  [...items].sort((a,b)=>(b.popularidad||0)-(a.popularidad||0)).slice(0,8).forEach((item,i) => {
    const el = document.createElement('div');
    el.className = 'cf-watched-item';
    el.innerHTML = `
      <span class="cf-watched-rank">${i+1}</span>
      <img class="cf-watched-img" src="${item.poster||PH_P}" alt="${item.titulo}" loading="lazy" onerror="this.src='${PH_P}'"/>
      <div class="cf-watched-body">
        <div class="cf-watched-name">${item.titulo}</div>
        <div class="cf-watched-meta">★ ${item.nota||'–'} · ${item.anio||''}</div>
      </div>`;
    el.addEventListener('click', () => abrirPlayer(item));
    lista.appendChild(el);
  });
}

/* ── Genre chips ───────────────────────────────────────────── */
export function buildGeneroChips(generos, onSel) {
  const w = document.getElementById('generoChips');
  if (!w) return;
  w.innerHTML = '';
  generos.forEach(g => {
    const btn = document.createElement('button');
    btn.className   = 'cf-genre-chip';
    btn.textContent = g.name || g;
    btn.dataset.id  = g.id || '';
    btn.addEventListener('click', () => {
      w.querySelectorAll('.cf-genre-chip').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      onSel(g);
    });
    w.appendChild(btn);
  });
}

/* ── Dropdown géneros ──────────────────────────────────────── */
export function buildDropdownGeneros(generos, onSel) {
  const menu = document.getElementById('catDropdownMenu');
  if (!menu) return;
  menu.innerHTML = '';
  generos.forEach((g, i) => {
    if (i > 0 && i % 6 === 0) {
      const hr = document.createElement('hr');
      hr.className = 'cf-dropdown-divider';
      menu.appendChild(hr);
    }
    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = `<i class="bi bi-chevron-right"></i>${g.name||g}`;
    a.addEventListener('click', e => { e.preventDefault(); onSel(g); });
    menu.appendChild(a);
  });
}

/* ── Búsqueda ──────────────────────────────────────────────── */
export function initBusqueda(fnBuscar) {
  const input = document.getElementById('searchInput');
  const drop  = document.getElementById('searchDrop');
  if (!input || !drop) return;
  let deb = null;
  input.addEventListener('input', () => {
    const q = input.value.trim();
    drop.innerHTML = '';
    clearTimeout(deb);
    if (q.length < 2) { drop.classList.remove('is-open'); return; }
    deb = setTimeout(async () => {
      try {
        const hits = await fnBuscar(q);
        drop.innerHTML = '';
        if (!hits.length) { drop.classList.remove('is-open'); return; }
        hits.slice(0, 10).forEach(item => {
          const el = document.createElement('div');
          el.className = 'cf-search-hit';
          el.innerHTML = `
            <img src="${item.poster||PH_P}" alt="${item.titulo}" onerror="this.src='${PH_P}'"/>
            <div>
              <div class="cf-search-hit-title">${item.titulo}</div>
              <div class="cf-search-hit-sub">${item.anio||''} · ${item.tipo==='tv'?'Serie':item.generos?.[0]||''} · ★${item.nota||'–'}</div>
            </div>`;
          el.addEventListener('click', () => {
            abrirPlayer(item);
            input.value = '';
            drop.classList.remove('is-open');
          });
          drop.appendChild(el);
        });
        drop.classList.add('is-open');
      } catch (_) {}
    }, 380);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.cf-search')) drop.classList.remove('is-open');
  });
}
