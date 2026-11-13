'use strict';
const byId = id => document.getElementById(id);
const stage = byId('stage');
const wheel = byId('wheel');
const disc = byId('disc');
const ctx = disc.getContext('2d');
const overlay = new URLSearchParams(location.search).has('scene');
const key = 'omad-studio-v1';
const signalKey = 'omad-studio-spin';
const turn = Math.PI * 2;
const startAngle = -Math.PI / 2;
const colorSectors = ['#b22d48','#285abb','#21835a','#a27612','#7929a5','#af581e'];
const models = {
  gold: { icon: '✦', colors: ['#671638','#35216a','#a1491e','#163f70','#893258','#4b2b70'], line: '#f9ca78' },
  ice: { icon: '⟐', colors: ['#143e63','#283171','#146276','#4f2873','#234d92','#176056'], line: '#78f5ff' },
  rose: { icon: '❋', colors: ['#821e40','#5c163f','#a84961','#551934','#752342','#a23d6e'], line: '#fdb8b5' },
  jade: { icon: '✧', colors: ['#14644c','#254d39','#096a65','#365b34','#15685b','#385747'], line: '#d4eda0' },
  arcade: { icon: '⚡', colors: ['#a32161','#4f27ad','#1645a1','#186c77','#9a3e22','#6639a3'], line: '#fda4ff' },
  pearl: { icon: '◇', colors: ['#344267','#585075','#3c6074','#673f62','#4e507b','#396268'], line: '#eef0ff' }
};
function applyModel() {
  wheel.dataset.skin = state.skin;
  byId('hub').textContent = models[state.skin].icon;
  document.querySelectorAll('[data-model]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.model === state.skin));
  });
}
const presets = {
  names: 'Aziza\nSardor\nMohinur\nJasmina\nAbdurahmon\nDilafruz\nCharos\nBekzod',
  colors: '🔴 Qizil\n🔵 Ko‘k\n🟢 Yashil\n🟡 Sariq\n🟣 Binafsha\n🟠 Zarg‘aldoq',
  numbers: '1\n2\n3\n4\n5\n6\n7\n8',
  emoji: '🔥\n🚀\n💎\n🌙\n⚡\n🎁\n⭐\n🍀'
};
const defaults = {
  autoVideo: true,
  musicTrack: 'royal', musicVolume: '36', musicAuto: true,
  mode: 'names', prizes: '', prizeExcluded: [], telegram: '', whatsapp: '', motion: true,
  entries: presets.names, name: 'OMAD SHOU', message: 'Topdingizmi? Like bosing va obuna bo‘ling!',
  theme: 'gold', skin: 'gold', duration: '5500', format: 'wide', preset: '', sound: true,
  lights: true, randomSkin: false, remove: false, celebrate: true, history: [], excluded: []
};
const fields = ['entries','autoVideo','musicTrack','musicVolume','musicAuto','telegram','whatsapp','motion','name','message','theme','randomSkin','duration','preset','sound','lights','remove','celebrate'];
function read() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(key)) }; }
  catch { return { ...defaults }; }
}
let state = read();
let choices = [];
let angle = 0;
let running = false;
let audio;
const wrap = a => (a % turn + turn) % turn;
const clean = v => [...v.trim()].slice(0,70).join('');
const unique = values => [...new Set(values)];
function parseCSV(value) {
  const cells = [];
  const token = /(?:"((?:[^"]|"")*)"|([^,;\r\n]*))(?:[,;\r\n]|$)/gy;
  while (token.lastIndex < value.length) {
    const match = token.exec(value);
    if (!match || !match[0].length) return value.split(/[\n,;]+/);
    cells.push(match[1] === undefined ? match[2] : match[1].replace(/""/g, '"'));
  }
  return cells;
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(state)); }
  catch { feedback('Sozlamalarni brauzerda saqlab bo‘lmadi.'); }
}
function feedback(message) { byId('feedback').textContent = message; }
const listKey = () => state.mode === 'prizes' ? 'prizes' : 'entries';
const excludedKey = () => state.mode === 'prizes' ? 'prizeExcluded' : 'excluded';
function contacts() {
  const handle = state.telegram.trim().replace(/^@/, '');
  const number = state.whatsapp.trim().replace(/[\s()-]/g, '');
  const values = [
    ['claimTelegram', /^[a-z0-9_]{5,32}$/i.test(handle), 'Telegram @' + handle, 'https://t.me/' + handle],
    ['claimWhatsapp', /^\+[1-9]\d{7,14}$/.test(number), 'WhatsApp ' + number, 'https://wa.me/' + number.slice(1)]
  ];
  for (const [id,valid,label,url] of values) {
    const link = byId(id);
    const value = byId(id.replace('claim','value'));
    value.textContent = valid ? label.slice(label.indexOf(' ') + 1) : 'Sozlanmagan';
    link.setAttribute('aria-disabled', String(!valid));
    if (valid) link.href = url;
    else link.removeAttribute('href');
  }
  stage.dataset.claim = 'true';
}
function entries() { return unique(state[listKey()].split(/\r?\n/).map(clean).filter(Boolean)); }
function eligible() { return entries().slice(0,200).filter(name => !state[excludedKey()].includes(name)); }
function render() {
  stage.dataset.theme = state.theme;
  stage.dataset.format = state.format;
  stage.dataset.motion = String(state.motion);
  const prizes = state.mode === 'prizes';
  byId('mode').value = state.mode;
  byId('headline').textContent = prizes ? 'Sovrinlar barabani' : 'Omad barabani';
  byId('entriesLabel').textContent = prizes ? 'Sovrinlar · har qatorga bittadan' : 'Ismlar yoki variantlar';
  byId('entries').placeholder = prizes ? '50 000 so‘m\nQuloqchin\nUzum sertifikati' : 'Har qatorga bittadan';
  byId('preset').closest('label').hidden = prizes;
  byId('removeLabel').textContent = prizes ? 'Chiqqan sovrinni chiqarish' : 'G‘olibni chiqarish';
  contacts();
  byId('videoControls').hidden = state.format !== 'short';
  byId('musicLevel').textContent = state.musicVolume + '%';
  byId('musicPreview').disabled = running || state.musicTrack === 'off';
  applyModel();
  wheel.classList.toggle('lit', state.lights);
  byId('channel').textContent = state.name;
  byId('cta').textContent = state.message;
  byId('sceneLabel').textContent = state.format === 'short' ? 'SHORTS' : 'EFIR SAHNASI';
  for (const id of fields) {
    const field = byId(id);
    if (field.type === 'checkbox') field.checked = state[id];
    else {
      const value = state[id === 'entries' ? listKey() : id];
      if (field.value !== value) field.value = value;
    }
  }
  document.querySelectorAll('.modes button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.format === state.format));
  });
  if (!running) choices = eligible();
  const count = choices.length + ' ta variant';
  byId('count').textContent = byId('stageCount').textContent = count;
  byId('spin').disabled = running || Boolean(video) || choices.length < 2;
  byId('historyCount').textContent = state.history.length;
  byId('history').replaceChildren(...state.history.map(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    return li;
  }));
  draw();
}
function draw() {
  ctx.clearRect(0,0,1000,1000);
  const count = choices.length;
  const step = turn / Math.max(count,1);
  const model = models[state.skin];
  const { colors } = model;
  const gradient = ctx.createRadialGradient(500,500,70,500,500,500);
  gradient.addColorStop(0,'#08000c88');
  gradient.addColorStop(.6,'#ffffff08');
  gradient.addColorStop(1,'#05000962');
  ctx.save();
  ctx.translate(500,500);
  const colorNames = presets.colors.split('\n');
  for (let i = 0; i < Math.max(1,count); i++) {
    const a = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,503,a,a+step);
    ctx.closePath();
    const colorIndex = colorNames.indexOf(choices[i]);
    ctx.fillStyle = colorIndex < 0 ? colors[i % colors.length === 0 && i === count - 1 && i > 0 ? 2 : i % colors.length] : colorSectors[colorIndex];
    ctx.fill();
    ctx.strokeStyle = model.line + '9c';
    ctx.lineWidth = count > 40 ? 1 : 3;
    ctx.stroke();
    if (!count || count > 90) continue;
    ctx.save();
    const center = a + step / 2;
    ctx.rotate(center);
    const flip = Math.cos(center) < 0;
    if (flip) ctx.rotate(Math.PI);
    const size = Math.min(49, Math.max(15, Math.floor(1250 / count)));
    ctx.font = '800 ' + size + 'px system-ui,sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = flip ? 'left' : 'right';
    ctx.fillStyle = '#fff8ef';
    let label = choices[i];
    const available = count <= 14 ? 336 : 283;
    const scaled = Math.floor(size * available / Math.max(1,ctx.measureText(label).width));
    ctx.font = '800 ' + Math.max(Math.min(26,size),Math.min(size,scaled)) + 'px system-ui,sans-serif';
    const chars = [...label];
    while (ctx.measureText(label).width > available && chars.length > 1) {
      chars.pop();
      label = chars.join('') + '…';
    }
    ctx.fillText(label,flip ? -436 : 436,0);
    ctx.restore();
  }
  ctx.restore();
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,1000,1000);
  disc.style.transform = 'rotate(' + angle + 'rad)';
}
for (let i = 0; i < 48; i++) {
  const bulb = document.createElement('i');
  bulb.className = 'bulb';
  bulb.style.setProperty('--x', (50 + 47.15 * Math.sin(i * turn / 48)) + '%');
  bulb.style.setProperty('--y', (50 - 47.15 * Math.cos(i * turn / 48)) + '%');
  bulb.style.setProperty('--delay', (-i / 48 * 1.65) + 's');
  byId('bulbs').append(bulb);
}
function randomInt(n) {
  const buffer = new Uint32Array(1);
  const ceiling = 2 ** 32 - (2 ** 32 % n);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= ceiling);
  return buffer[0] % n;
}
function tone(hz, volume, length, delay = 0) {
  if (!state.sound || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.frequency.value = hz;
  gain.gain.setValueAtTime(volume,start);
  gain.gain.exponentialRampToValueAtTime(.001,start + length);
  oscillator.connect(gain).connect(audioOutput());
  oscillator.start(start);
  oscillator.stop(start + length);
}
let confettiTimer;
function confetti() {
  if (!state.celebrate) return;
  const particles = Array.from({length:52}, (_,i) => {
    const p = document.createElement('i');
    p.className = 'paper';
    p.style.setProperty('--x', Math.random() * 100 + '%');
    p.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
    p.style.setProperty('--time', (1 + Math.random()) + 's');
    p.style.setProperty('--color',['#ffd37d','#ff6d98','#8ddfff','#d9a5ff'][i%4]);
    return p;
  });
  byId('confetti').replaceChildren(...particles);
  clearTimeout(confettiTimer);
  confettiTimer = setTimeout(() => byId('confetti').replaceChildren(),2100);
}
function lock(value) {
  document.querySelectorAll('aside button, aside input, aside select, aside textarea').forEach(control => {
    control.disabled = value;
  });
  document.querySelector('.import').style.pointerEvents = value ? 'none' : '';
  byId('musicPreview').disabled = value || state.musicTrack === 'off';
}
function finish(round) {
  duckMusic();
  angle = wrap(round.end);
  running = false;
  wheel.classList.remove('spinning');
  if (!overlay && !video) lock(false);
  byId('musicPreview').disabled = state.musicTrack === 'off';
  const name = round.names[round.index];
  byId('result').textContent = (round.mode === 'prizes' ? 'Sovrin — ' : 'G‘olib — ') + name + '!';
  byId('cta').hidden = !state.message || round.mode === 'prizes';
  [523,659,784,1047].forEach((hz,i) => tone(hz,.055,.23,i * .09));
  confetti();
  if (!overlay) {
    state.history = [{name, date: new Date().toISOString()}, ...state.history].slice(0,500);
    if (state.remove) state[excludedKey()] = [...state[excludedKey()],name];
    save();
  }
  byId('historyCount').textContent = state.history.length;
  byId('history').replaceChildren(...state.history.map(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    return li;
  }));
  const count = eligible().length + ' ta variant';
  byId('count').textContent = byId('stageCount').textContent = count;
  byId('spin').disabled = Boolean(video) || eligible().length < 2;
  disc.style.transform = 'rotate(' + angle + 'rad)';
  video?.finish();
}
function animate(round) {
  running = true;
  if (round.skin && models[round.skin]) state.skin = round.skin;
  applyModel();
  choices = round.names;
  angle = round.start;
  draw();
  if (!overlay) lock(true);
  wheel.classList.add('spinning');
  byId('result').textContent = 'Baraban aylanmoqda…';
  byId('cta').hidden = true;
  let lastTick = -1;
  let lastSound = 0;
  const step = turn / choices.length;
  function frame(now) {
    const progress = Math.min(1, Math.max(0,(Date.now() - round.at) / round.duration));
    const ease = 1 - (1 - progress) ** 4;
    angle = round.start + (round.end - round.start) * ease;
    disc.style.transform = 'rotate(' + angle + 'rad)';
    const tick = Math.floor(angle / step);
    if (tick !== lastTick && now - lastSound > 38) {
      tone(345 + tick % 5 * 22,.032,.045);
      lastTick = tick;
      lastSound = now;
    }
    if (progress < 1) requestAnimationFrame(frame);
    else finish(round);
  }
  requestAnimationFrame(frame);
}
async function spin() {
  if (running || overlay || video || pickingTab) return;
  const names = eligible();
  if (names.length < 2) return;
  if (state.musicAuto && !musicTimer && state.musicTrack !== 'off') startMusic();
  if (state.sound && window.AudioContext) {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
  }
  if (state.format === 'short' && state.autoVideo) {
    const stream = await captureStage();
    if (!stream || !recordStage(stream)) return;
  }
  if (state.randomSkin) {
    const alternatives = Object.keys(models).filter(model => model !== state.skin);
    state.skin = alternatives[randomInt(alternatives.length)];
    save();
  }
  const index = randomInt(names.length);
  const step = turn / names.length;
  const target = wrap(-(index + .18 + randomInt(65) / 100) * step);
  const end = angle + 5 * turn + wrap(target - angle);
  const round = { names,index,mode:state.mode,skin:state.skin,start:angle,end,duration:Number(state.duration),at:Date.now() };
  try { localStorage.setItem(signalKey,JSON.stringify(round)); } catch {}
  animate(round);
}
function update() { save(); render(); }
function resetResult() {
  byId('result').textContent = state.mode === 'prizes' ? 'Qaysi sovrin chiqadi?' : 'Bugun omad kimga kuladi?';
  byId('cta').hidden = true;
}
for (const id of fields) byId(id).addEventListener('input', event => {
  const field = event.currentTarget;
  state[id === 'entries' ? listKey() : id] = field.type === 'checkbox' ? field.checked : field.value;
  if (id === 'preset' && presets[state.preset]) {
    state.entries = presets[state.preset];
    state.excluded = [];
    resetResult();
  }
  if (id === 'entries') {
    state.preset = '';
    resetResult();
    feedback(entries().length > 200 ? 'Birinchi 200 ta noyob variant qatnashadi.' : '');
  }
  if (id === 'remove' && !state.remove) { state.excluded = []; state.prizeExcluded = []; }
  if (id === 'musicTrack' && musicTimer) {
    stopMusic();
    if (state.musicTrack !== 'off') startMusic();
  }
  if (id === 'musicVolume') setMusicVolume(.08);
  update();
});
document.querySelectorAll('.modes button').forEach(button => button.addEventListener('click', () => {
  state.format = button.dataset.format;
  update();
}));
document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => {
  state.skin = button.dataset.model;
  update();
}));
byId('mode').addEventListener('change', event => {
  state.mode = event.currentTarget.value;
  feedback('');
  resetResult();
  update();
});
byId('spin').addEventListener('click',spin);
byId('shuffle').addEventListener('click',() => {
  const list = entries();
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i],list[j]] = [list[j],list[i]];
  }
  state[listKey()] = list.join('\n');
  update();
});
byId('file').addEventListener('change', async event => {
  const input = event.currentTarget;
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  if (file.size > 300000) return feedback('TXT yoki CSV fayl 300 KB gacha bo‘lishi kerak.');
  try {
    const raw = (await file.text()).replace(/^\uFEFF/,'');
    if (running) return;
    const values = file.name.toLowerCase().endsWith('.csv') ? parseCSV(raw) : raw.split(/\r?\n/);
    const names = unique(values.map(clean).filter(Boolean));
    if (!names.length) return feedback('Fayldan variantlar topilmadi.');
    state[listKey()] = names.slice(0,200).join('\n');
    state.preset = '';
    state[excludedKey()] = [];
    resetResult();
    feedback(Math.min(names.length,200) + ' ta variant yuklandi.');
    update();
  } catch { feedback('Faylni o‘qib bo‘lmadi.'); }
});
byId('restore').addEventListener('click',() => { state[excludedKey()] = []; resetResult(); update(); });
byId('reset').addEventListener('click',() => {
  if (state.history.length && confirm('G‘oliblar tarixi tozalansinmi?')) { state.history = []; update(); }
});
byId('export').addEventListener('click',() => {
  const rows = state.history.map(item => {
    const safe = /^[=+\-@]/.test(item.name) ? "'" + item.name : item.name;
    return '"' + safe.replace(/"/g,'""') + '",' + item.date;
  });
  const url = URL.createObjectURL(new Blob(['\uFEFFIsm,Sana\r\n' + rows.join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'omad-goliblar.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
async function present() {
  document.body.classList.add('presenting');
  byId('exit').hidden = false;
  try { await document.documentElement.requestFullscreen?.(); } catch {}
}
async function exit() {
  document.body.classList.remove('presenting');
  byId('exit').hidden = true;
  if (document.fullscreenElement) await document.exitFullscreen();
}
byId('present').addEventListener('click',present);
byId('exit').addEventListener('click',exit);
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) exit(); });
document.addEventListener('keydown', event => {
  if (overlay || event.repeat) return;
  if (event.key === 'Escape') exit();
  if (event.code !== 'Space' || event.target.closest('button,input,select,textarea,summary,[contenteditable]')) return;
  event.preventDefault();
  spin();
});
byId('copy').addEventListener('click',() => {
  const url = new URL(location.href);
  url.searchParams.set('scene','1');
  window.open(url,'omad-scene','popup,width=1000,height=650');
  feedback('OBS’da ochilgan oynani Window Capture orqali tanlang. Ovoz boshqaruv oynasidan chiqadi.');
});

const tracks = {
  royal: { bpm: 104, chords: [[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]], melody:[2,-1,3,-1,1,2,-1,3], lead:'sine', bass:'triangle', drums:[0,4,6] },
  neon: { bpm: 124, chords: [[42,49,54,57],[38,45,50,54],[45,52,57,61],[40,47,52,56]], melody:[2,3,2,1,3,2,1,3], lead:'triangle', bass:'sawtooth', drums:[0,2,4,6] },
  pulse: { bpm: 142, chords: [[43,50,55,58],[46,53,58,62],[41,48,53,57],[38,45,50,53]], melody:[3,2,-1,2,1,-1,3,2], lead:'square', bass:'sine', drums:[0,3,4,7] },
  night: { bpm: 82, chords: [[45,52,60,64],[43,50,59,62],[41,48,57,60],[40,47,56,59]], melody:[-1,3,2,-1,1,2,-1,-1], lead:'sine', bass:'sine', drums:[0,5] },
  finale: { bpm: 116, chords: [[48,55,60,64],[43,50,55,59],[45,52,57,60],[41,48,53,57]], melody:[1,2,3,2,1,3,2,3], lead:'triangle', bass:'triangle', drums:[0,2,4,7] }
};
let musicBus;
let musicCompressor;
let musicTimer;
let musicBeat = 0;
let nextNote = 0;
let duckUntil = 0;

function setMusicVolume(ramp) {
  if (!musicBus) return;
  const now = audio.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  const volume = Number(state.musicVolume) / 100;
  musicBus.gain.setTargetAtTime(volume * (now < duckUntil ? .2 : 1), now, ramp);
  if (now < duckUntil) musicBus.gain.setTargetAtTime(volume, duckUntil, .28);
}
function duckMusic() {
  if (!musicBus) return;
  duckUntil = audio.currentTime + 1.65;
  setMusicVolume(.06);
}
function musicNote(note, type, level, time, length, kick = false) {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  const hz = kick ? 118 : 440 * 2 ** ((note - 69) / 12);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(hz, time);
  if (kick) oscillator.frequency.exponentialRampToValueAtTime(42, time + .12);
  envelope.gain.setValueAtTime(.0001, time);
  envelope.gain.exponentialRampToValueAtTime(level, time + .012);
  envelope.gain.exponentialRampToValueAtTime(.0001, time + length);
  oscillator.connect(envelope).connect(musicBus);
  oscillator.start(time);
  oscillator.stop(time + length + .02);
}
function scheduleMusic() {
  if (audio.state !== 'running') return;
  const track = tracks[state.musicTrack];
  const eighth = 30 / track.bpm;
  nextNote = Math.max(nextNote, audio.currentTime + .012);
  while (nextNote < audio.currentTime + .17) {
    const step = musicBeat % 8;
    const chord = track.chords[Math.floor(musicBeat / 8) % track.chords.length];
    const melody = track.melody[step];
    if (step === 0) {
      for (const note of chord.slice(1)) musicNote(note, 'sine', .085, nextNote, eighth * 7.5);
    }
    if (step % 2 === 0) musicNote(chord[0] - 12, track.bass, .16, nextNote, eighth * 1.8);
    if (melody >= 0) musicNote(chord[melody] + 12, track.lead, track.lead === 'square' ? .032 : .12, nextNote, eighth * 1.32);
    if (track.drums.includes(step)) musicNote(0, 'sine', .20, nextNote, .17, true);
    if (step % 2) musicNote(104, 'triangle', .045, nextNote, .035);
    musicBeat++;
    nextNote += eighth;
  }
}
function startMusic() {
  if (overlay || musicTimer || !tracks[state.musicTrack] || !window.AudioContext) return;
  audio ??= new AudioContext();
  audio.resume().catch(() => stopMusic());
  musicBus = audio.createGain();
  musicBus.gain.value = 0;
  musicCompressor = audio.createDynamicsCompressor();
  musicBus.connect(musicCompressor).connect(audioOutput());
  musicBeat = 0;
  nextNote = audio.currentTime + .05;
  duckUntil = 0;
  setMusicVolume(.12);
  musicTimer = setInterval(scheduleMusic, 55);
  byId('musicPreview').textContent = '■ To‘xtatish';
  byId('musicPreview').setAttribute('aria-pressed', 'true');
}
function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = undefined;
  if (musicBus) {
    const ending = musicBus;
    ending.gain.cancelScheduledValues(audio.currentTime);
    ending.gain.setTargetAtTime(0, audio.currentTime, .045);
    const compressor = musicCompressor;
    setTimeout(() => { ending.disconnect(); compressor.disconnect(); }, 250);
    musicBus = undefined;
  }
  byId('musicPreview').textContent = '▶ Tinglash';
  byId('musicPreview').setAttribute('aria-pressed', 'false');
}
byId('musicPreview').addEventListener('click', () => {
  if (musicTimer) stopMusic();
  else startMusic();
});


let video;
let videoUrl;
let audioMaster;
let audioCapture;
function audioOutput() {
  if (!audioMaster) {
    audioMaster = audio.createGain();
    audioMaster.connect(audio.destination);
    if (audio.createMediaStreamDestination) {
      audioCapture = audio.createMediaStreamDestination();
      audioMaster.connect(audioCapture);
    }
  }
  return audioMaster;
}
let pickingTab = false;
async function captureStage() {
  const status = byId('videoStatus');
  if (!navigator.mediaDevices?.getDisplayMedia || !window.CropTarget || !window.MediaRecorder) {
    status.textContent = 'Sahnani yozish uchun kompyuterda Chrome brauzeridan foydalaning.';
    return null;
  }
  let stream;
  pickingTab = true;
  lock(true);
  status.textContent = 'Ulashish oynasida shu Omad Studio tabini tanlang.';
  try {
    const capture = navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 30 }, displaySurface: 'browser' },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      monitorTypeSurfaces: 'exclude'
    });
    stream = await capture;
    const [track] = stream.getVideoTracks();
    if (track?.getSettings().displaySurface !== 'browser' || !track.cropTo) throw Error('tab required');
    stage.scrollIntoView({block:'center',behavior:'instant'});
    await track.cropTo(await CropTarget.fromElement(stage));
    if (track.readyState !== 'live') throw Error('capture ended');
    return stream;
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop());
    status.textContent = error.name === 'NotAllowedError'
      ? 'Yozuvga ruxsat berilmadi. Qayta urinib ko‘ring.'
      : 'Sahnani yozish uchun aynan shu Omad Studio tabini tanlang.';
    return null;
  } finally {
    pickingTab = false;
    lock(false);
  }
}
function recordStage(stream) {
  const status = byId('videoStatus');
  const [track] = stream.getVideoTracks();
  const source = audio ? (audioOutput(), audioCapture?.stream.getAudioTracks()[0]) : null;
  const soundtrack = source?.clone();
  if (soundtrack) stream.addTrack(soundtrack);
  const mimeType = ['video/mp4','video/webm;codecs=vp8,opus','video/webm']
    .find(type => MediaRecorder.isTypeSupported(type));
  const stopTracks = () => stream.getTracks().forEach(item => item.stop());
  let recorder;
  try {
    recorder = new MediaRecorder(stream, {...(mimeType ? {mimeType} : {}),videoBitsPerSecond:6500000});
    recorder.start(250);
  } catch {
    stopTracks();
    status.textContent = 'Video yozishni boshlash imkoni bo‘lmadi.';
    return false;
  }
  const chunks = [];
  const link = byId('videoDownload');
  const recording = {failed:false, timer:null, finish() {
    status.textContent = 'Yutuq animatsiyasi yozilmoqda…';
    recording.timer = setTimeout(() => {
      status.textContent = 'Video saqlanmoqda…';
      if (recorder.state === 'recording') recorder.stop();
    }, 4800);
  }};
  video = recording;
  link.hidden = true;
  status.textContent = 'Sayt sahnasi yozilmoqda…';
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  function release() {
    clearTimeout(recording.timer);
    stopTracks();
    if (video !== recording) return;
    video = undefined;
    if (!running) {
      lock(false);
      byId('spin').disabled = eligible().length < 2;
    }
  }
  recorder.onerror = () => {
    recording.failed = true;
    release();
    status.textContent = 'Video yozishda xato yuz berdi.';
  };
  track.addEventListener('ended', () => {
    recording.failed = true;
    if (recorder.state !== 'inactive') recorder.stop();
  });
  recorder.onstop = () => {
    release();
    if (recording.failed || !chunks.length) {
      status.textContent = 'Yozuv uzildi yoki video fayli hosil bo‘lmadi.';
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const type = recorder.mimeType || chunks[0].type || 'video/webm';
    const extension = type.includes('mp4') ? 'mp4' : 'webm';
    videoUrl = URL.createObjectURL(new Blob(chunks,{type}));
    link.href = videoUrl;
    link.download = 'omad-shorts-' + new Date().toISOString().replace(/[:.]/g,'-') + '.' + extension;
    link.hidden = false;
    status.textContent = 'Sayt sahnasi videosi tayyor';
    link.click();
  };
  return true;
}
if (overlay) {
  document.body.classList.add('overlay');
  window.addEventListener('storage', event => {
    if (event.key === key) {
      const previous = state;
      state = read();
      if (!running) {
        const displayedChoices = choices;
        const preserveWinner = previous.mode === state.mode && previous[listKey()] === state[listKey()]
          && /^(G‘olib|Sovrin) — /.test(byId('result').textContent);
        render();
        if (preserveWinner && displayedChoices.every(name => entries().includes(name))) {
          choices = displayedChoices;
          draw();
        } else resetResult();
      }
    }
    if (event.key === signalKey && event.newValue) animate(JSON.parse(event.newValue));
  });
}
resetResult();
render();

