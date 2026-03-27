/* ================================================================
   CINEFLIX — api.js
   TMDB v3 · language=es-MX · region=MX — fijados, sin exposición
   ================================================================ */
const _K = '8265bd1679663a7ea12ac168da84d2e8';
const _B = 'https://api.themoviedb.org/3';
const _L = 'es-MX';
const _R = 'MX';

export const IMG = {
  poster: 'https://image.tmdb.org/t/p/w342',
  back:   'https://image.tmdb.org/t/p/w1280',
};

export const GENEROS_MAP = {
  28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',
  99:'Documental',18:'Drama',10751:'Familia',14:'Fantasía',36:'Historia',
  27:'Terror',10402:'Musical',9648:'Misterio',10749:'Romance',
  878:'Ciencia Ficción',53:'Suspenso',10752:'Bélica',37:'Western',
  10759:'Acción & Aventura',10765:'Sci-Fi & Fantasía',10766:'Telenovela',
};

async function _get(path, extra = {}) {
  const p = new URLSearchParams({ api_key:_K, language:'es-MX', region:'MX', ...extra });
  const r = await fetch(`${_B}${path}?${p}`);
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

function _norm(item, tipo) {
  const esP = tipo === 'movie';
  return {
    tmdb:    item.id,
    imdb:    item.imdb_id || null,
    tipo,
    titulo:  esP ? (item.title||item.original_title) : (item.name||item.original_name),
    anio:    parseInt((esP ? item.release_date : item.first_air_date)||'0'),
    nota:    Math.round(item.vote_average * 10) / 10,
    sinopsis:item.overview || 'Sin descripción disponible.',
    poster:  item.poster_path   ? IMG.poster + item.poster_path   : null,
    backdrop:item.backdrop_path ? IMG.back   + item.backdrop_path : null,
    generos: (item.genre_ids||[]).map(id => GENEROS_MAP[id]).filter(Boolean),
    popularidad: item.popularity || 0,
    duracion: null,
  };
}

function _normFull(item, tipo) {
  const base = _norm({...item, genre_ids:(item.genres||[]).map(g=>g.id)}, tipo);
  base.generos  = (item.genres||[]).map(g => g.name);
  base.imdb     = item.imdb_id || item.external_ids?.imdb_id || null;
  base.duracion = tipo === 'movie'
    ? (item.runtime ? `${Math.floor(item.runtime/60)}h ${item.runtime%60}m` : null)
    : (item.number_of_seasons ? `${item.number_of_seasons} Temporada${item.number_of_seasons>1?'s':''}` : null);
  return base;
}

export const getTendencias         = ()      => _get('/trending/all/week').then(d => d.results.map(m => _norm(m, m.media_type==='tv'?'tv':'movie')));
export const getPeliculasPopulares = (p=1)   => _get('/movie/popular',   {page:p}).then(d => d.results.map(m => _norm(m,'movie')));
export const getSeriesPopulares    = (p=1)   => _get('/tv/popular',      {page:p}).then(d => d.results.map(m => _norm(m,'tv')));
export const getPeliculasTopRated  = (p=1)   => _get('/movie/top_rated', {page:p}).then(d => d.results.map(m => _norm(m,'movie')));
export const getSeriesTopRated     = (p=1)   => _get('/tv/top_rated',    {page:p}).then(d => d.results.map(m => _norm(m,'tv')));
export const getEnCartelera        = (p=1)   => _get('/movie/now_playing',{page:p}).then(d => d.results.map(m => _norm(m,'movie')));
export const getPorGenero          = (id,p=1)=> _get('/discover/movie',  {with_genres:id, sort_by:'popularity.desc', page:p}).then(d => d.results.map(m => _norm(m,'movie')));
export const getSeriesPorGenero    = (id,p=1)=> _get('/discover/tv',     {with_genres:id, sort_by:'popularity.desc', page:p}).then(d => d.results.map(m => _norm(m,'tv')));
export const getGenerosPeliculas   = ()      => _get('/genre/movie/list').then(d => d.genres);
export const getGenerosSeries      = ()      => _get('/genre/tv/list').then(d => d.genres);
export const buscar                = (q)     => {
  if (!q||q.trim().length<2) return Promise.resolve([]);
  return _get('/search/multi',{query:q.trim()}).then(d =>
    d.results.filter(m => m.media_type!=='person' && (m.poster_path||m.backdrop_path))
             .map(m => _norm(m, m.media_type==='tv'?'tv':'movie'))
  );
};
export const getDetallePelicula = (id) => _get(`/movie/${id}`, {append_to_response:'external_ids'}).then(d => _normFull(d,'movie'));
export const getDetalleSerie    = (id) => _get(`/tv/${id}`,    {append_to_response:'external_ids'}).then(d => _normFull(d,'tv'));
