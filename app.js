const grid = document.getElementById('grid');
const search = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
const counter = document.getElementById('counter');
const cardCount = document.getElementById('cardCount');
const playerBar = document.getElementById('playerBar');
const nowTitle = document.getElementById('nowTitle');
const nowArtist = document.getElementById('nowArtist');
const btnPrev = document.getElementById('btnPrev');
const btnPlay = document.getElementById('btnPlay');
const btnNext = document.getElementById('btnNext');
const btnShuffle = document.getElementById('btnShuffle');
const btnClose = document.getElementById('closePlayer');

let tracks = [];
let queue = [];
let queueIndex = -1;
let shuffle = false;

const audio = new Audio();
audio.preload = 'auto';

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

function makeCard(t) {
  const card = document.createElement('div');
  card.className = 'card' + (t.previewUrl ? ' playable' : '');
  card.dataset.id = t.id;

  const artWrap = document.createElement('div');
  artWrap.className = 'artWrap';
  const img = document.createElement('img');
  img.className = 'art';
  img.loading = 'lazy';
  img.src = t.albumImage && t.albumImage.indexOf('scdn.co') === -1 ? './' + t.albumImage : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23222%22/%3E%3Ctext x=%22100%22 y=%22115%22 font-size=%2260%22 text-anchor=%22middle%22 fill=%22%23666%22%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';
  img.onerror = () => { img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23222%22/%3E%3Ctext x=%22100%22 y=%22115%22 font-size=%2260%22 text-anchor=%22middle%22 fill=%22%23666%22%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E'; };
  const badge = document.createElement('span');
  badge.className = 'playBadge';
  badge.textContent = '▶';
  artWrap.appendChild(img);
  artWrap.appendChild(badge);
  card.appendChild(artWrap);

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = t.name;
  name.title = t.name;
  card.appendChild(name);

  const artist = document.createElement('div');
  artist.className = 'artist';
  artist.textContent = t.artists || '';
  artist.title = t.artists;
  card.appendChild(artist);

  if (t.previewUrl) {
    card.addEventListener('click', () => playAt(t));
  }
  return card;
}

function render() {
  const list = visible();
  counter.textContent = `Показано: ${list.length} из ${tracks.length}`;
  cardCount.textContent = `${tracks.length}`;
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  list.forEach(t => frag.appendChild(makeCard(t)));
  grid.appendChild(frag);
}

function highlight() {
  document.querySelectorAll('.card').forEach(c => {
    c.classList.toggle('active', c.dataset.id === (queue[queueIndex] || {}).id);
  });
}

function playAt(t) {
  queue = visible().filter(x => x.previewUrl);
  queueIndex = queue.findIndex(x => x.id === t.id);
  playCurrent();
}

function playCurrent() {
  if (queueIndex < 0 || queueIndex >= queue.length) return;
  const t = queue[queueIndex];
  nowTitle.textContent = t.name || '';
  nowArtist.textContent = (t.artists || '') + (t.album ? ' — ' + t.album : '');
  playerBar.classList.remove('hidden');
  audio.src = t.previewUrl;
  audio.play().catch(() => {});
  btnPlay.textContent = '❚❚';
  highlight();
}

audio.addEventListener('ended', () => {
  btnNext.click();
});

audio.addEventListener('play', () => { btnPlay.textContent = '❚❚'; });
audio.addEventListener('pause', () => { btnPlay.textContent = '▶'; });

btnPlay.addEventListener('click', () => {
  if (queueIndex < 0) {
    const list = visible().filter(x => x.previewUrl);
    if (list.length) playAt(list[Math.floor(Math.random() * list.length)]);
    return;
  }
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
});

btnNext.addEventListener('click', () => {
  if (queue.length === 0) {
    const list = visible().filter(x => x.previewUrl);
    if (list.length) playAt(list[0]);
    return;
  }
  if (shuffle) {
    queueIndex = Math.floor(Math.random() * queue.length);
  } else {
    queueIndex = (queueIndex + 1) % queue.length;
  }
  playCurrent();
});

btnPrev.addEventListener('click', () => {
  if (queue.length === 0) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  queueIndex = (queueIndex - 1 + queue.length) % queue.length;
  playCurrent();
});

btnShuffle.addEventListener('click', () => {
  shuffle = !shuffle;
  btnShuffle.classList.toggle('on', shuffle);
});

btnClose.addEventListener('click', () => {
  audio.pause();
  audio.removeAttribute('src');
  playerBar.classList.add('hidden');
  highlight();
});

search.addEventListener('input', () => {
  queueIndex = -1;
  render();
});
sourceFilter.addEventListener('change', () => {
  queueIndex = -1;
  render();
});

loadTracks();