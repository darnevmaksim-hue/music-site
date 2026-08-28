const grid = document.getElementById('grid');
const search = document.getElementById('search');
const sourceFilter = document.getElementById('sourceFilter');
const counter = document.getElementById('counter');
const cardCount = document.getElementById('cardCount');
const playerBar = document.getElementById('playerBar');
const playerWrap = document.getElementById('playerWrap');
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
let playing = false;
let shuffle = false;
let autoTimer = null;

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
  cardCount.textContent = `${tracks.length}`;
  grid.innerHTML = '';
  list.forEach(t => grid.appendChild(makeCard(t)));
}

function coverEl(t) {
  const img = document.createElement('img');
  img.className = 'art';
  img.src = t.albumImage ? './' + t.albumImage : '';
  img.alt = '';
  img.loading = 'lazy';
  img.onerror = () => { img.style.visibility = 'hidden'; };
  return img;
}

function makeCard(t) {
  const card = document.createElement('div');
  card.className = 'card';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'artWrap';
  imgWrap.appendChild(coverEl(t));
  const playBadge = document.createElement('div');
  playBadge.className = 'playBadge';
  playBadge.textContent = '▶';
  imgWrap.appendChild(playBadge);

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
  card.addEventListener('click', () => playFrom(t));
  return card;
}

function playFrom(t) {
  const list = visible();
  queue = list;
  const idx = queue.findIndex(x => x.id === t.id);
  queueIndex = idx >= 0 ? idx : 0;
  playTrack();
}

function current() {
  if (!queue.length) return null;
  return queue[queueIndex];
}

function playTrack() {
  const t = current();
  if (!t) return;
  playerBar.classList.remove('hidden');
  playerWrap.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = 'https://open.spotify.com/embed/track/' + t.id + '?utm_source=generator&theme=0';
  iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  iframe.loading = 'lazy';
  playerWrap.appendChild(iframe);
  nowTitle.textContent = t.name;
  nowArtist.textContent = t.artists;
  nowTitle.title = t.name;
  nowArtist.title = t.artists;
  playing = true;
  btnPlay.textContent = '❚❚';
  highlightCard();
  stopAuto();
  autoTimer = setTimeout(stepNext, 32000);
}

function stepNext() {
  if (queue.length === 0) return;
  if (shuffle && queue.length > 1) {
    let n = queueIndex;
    while (n === queueIndex) n = Math.floor(Math.random() * queue.length);
    queueIndex = n;
  } else {
    queueIndex = (queueIndex + 1) % queue.length;
  }
  playTrack();
}

function prevTrack() {
  if (!queue.length) return;
  queueIndex = (queueIndex - 1 + queue.length) % queue.length;
  playTrack();
}

function togglePlay() {
  if (!queue.length) return;
  if (playing) {
    playing = false;
    btnPlay.textContent = '▶';
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  } else {
    playing = true;
    btnPlay.textContent = '❚❚';
    autoTimer = setTimeout(stepNext, 32000);
  }
  const t = current();
  if (t) openEmbedLazy();
}

function openEmbedLazy() {
  // При паузе/возобновлении перезагружаем embed, чтобы он начал из-за autoplay (иначе не переиграет)
  const iframe = playerWrap.querySelector('iframe');
  if (iframe) {
    iframe.src = iframe.src.split('&autoplay')[0] + (playing ? '&autoplay=1' : '');
  }
}

function highlightCard() {
  [...grid.children].forEach(c => c.classList.remove('active'));
  const t = current();
  if (!t) return;
  const card = [...grid.children].find(c => {
    const n = c.querySelector('.name');
    return n && n.textContent === t.name;
  });
  if (card) card.classList.add('active');
}

function stopAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }

btnNext.addEventListener('click', () => { stopAuto(); stepNext(); });
btnPrev.addEventListener('click', prevTrack);
btnPlay.addEventListener('click', togglePlay);
btnShuffle.addEventListener('click', () => {
  shuffle = !shuffle;
  btnShuffle.classList.toggle('on', shuffle);
});
btnClose.addEventListener('click', () => {
  playerWrap.innerHTML = '';
  playerBar.classList.add('hidden');
  playing = false;
  stopAuto();
});

search.addEventListener('input', render);
sourceFilter.addEventListener('change', render);

loadTracks();