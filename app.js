const grid = document.getElementById('grid');
const search = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
const counter = document.getElementById('counter');
const playerBar = document.getElementById('playerBar');
const playerWrap = document.getElementById('playerWrap');
const nowPlaying = document.getElementById('nowPlaying');

let tracks = [];

async function loadTracks() {
  const res = await fetch('tracks.json');
  tracks = await res.json();
  const sources = [...new Set(tracks.map(t => t.source))].sort();
  sources.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sourceFilter.appendChild(opt);
  });
  render();
}

function visible() {
  const q = search.value.toLowerCase();
  const src = sourceFilter.value;
  return tracks.filter(t => {
    const text = (t.name + ' ' + t.artists + ' ' + t.album).toLowerCase();
    if (q && !text.includes(q)) return false;
    if (src && t.source !== src) return false;
    return true;
  });
}

function render() {
  const list = visible();
  counter.textContent = `Показано: ${list.length} из ${tracks.length}`;
  grid.innerHTML = '';
  list.forEach(t => grid.appendChild(makeCard(t)));
}

function makeCard(t) {
  const card = document.createElement('div');
  card.className = 'card';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'artWrap';
  const img = document.createElement('img');
  img.className = 'art';
  img.src = t.albumImage || '';
  img.alt = '';
  img.loading = 'lazy';
  img.onerror = () => { img.src = ''; img.style.display = 'none'; };
  const playBadge = document.createElement('div');
  playBadge.className = 'playBadge';
  playBadge.textContent = '▶';
  imgWrap.append(img, playBadge);

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = t.name;
  name.title = t.name;
  const artist = document.createElement('div');
  artist.className = 'artist';
  artist.textContent = t.artists;
  artist.title = t.artists;

  card.append(imgWrap, name, artist);
  card.classList.add('playable');
  card.addEventListener('click', () => play(t));
  return card;
}

function play(t) {
  playerBar.classList.remove('hidden');
  if (playerWrap.dataset.track === t.id) {
    return;
  }
  playerWrap.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = 'https://open.spotify.com/embed/track/' + t.id + '?utm_source=generator&theme=0';
  iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  iframe.loading = 'lazy';
  playerWrap.appendChild(iframe);
  playerWrap.dataset.track = t.id;
  nowPlaying.textContent = t.name + ' — ' + t.artists;
  nowPlaying.title = t.name + ' — ' + t.artists;
  playerBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('closePlayer').addEventListener('click', () => {
  playerWrap.innerHTML = '';
  delete playerWrap.dataset.track;
  playerBar.classList.add('hidden');
});

search.addEventListener('input', render);
sourceFilter.addEventListener('change', render);

loadTracks();