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
  entries: presets.names, name: 'OMAD SHOU', message: 'Topdingizmi? Like bosing va obuna bo‘ling!',
  theme: 'gold', skin: 'gold', duration: '5500', format: 'wide', preset: '', sound: true,
  lights: true, randomSkin: false, remove: false, celebrate: true, history: [], excluded: []
};
const fields = ['entries','name','message','theme','randomSkin','duration','preset','sound','lights','remove','celebrate'];
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
function entries() { return unique(state.entries.split(/\r?\n/).map(clean).filter(Boolean)); }
function eligible() { return entries().slice(0,200).filter(name => !state.excluded.includes(name)); }
function render() {
  stage.dataset.theme = state.theme;
  stage.dataset.format = state.format;
  applyModel();
  wheel.classList.toggle('lit', state.lights);
  byId('channel').textContent = state.name;
  byId('cta').textContent = state.message;
  byId('sceneLabel').textContent = state.format === 'short' ? 'SHORTS' : 'EFIR SAHNASI';
  for (const id of fields) {
    const field = byId(id);
    if (field.type === 'checkbox') field.checked = state[id];
    else if (field.value !== state[id]) field.value = state[id];
  }
  document.querySelectorAll('.modes button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.format === state.format));
  });
  if (!running) choices = eligible();
  const count = choices.length + ' ta variant';
  byId('count').textContent = byId('stageCount').textContent = count;
  byId('spin').disabled = running || choices.length < 2;
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
  oscillator.connect(gain).connect(audio.destination);
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
}
function finish(round) {
  angle = wrap(round.end);
  running = false;
  wheel.classList.remove('spinning');
  if (!overlay) lock(false);
  const name = round.names[round.index];
  byId('result').textContent = 'G‘olib — ' + name + '!';
  byId('cta').hidden = !state.message;
  [523,659,784,1047].forEach((hz,i) => tone(hz,.055,.23,i * .09));
  confetti();
  if (!overlay) {
    state.history = [{name, date: new Date().toISOString()}, ...state.history].slice(0,500);
    if (state.remove) state.excluded = [...state.excluded,name];
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
  byId('spin').disabled = eligible().length < 2;
  disc.style.transform = 'rotate(' + angle + 'rad)';
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
function spin() {
  if (running || overlay) return;
  const names = eligible();
  if (names.length < 2) return;
  if (state.sound && window.AudioContext) {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
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
  const round = { names,index,skin:state.skin,start:angle,end,duration:Number(state.duration),at:Date.now() };
  try { localStorage.setItem(signalKey,JSON.stringify(round)); } catch {}
  animate(round);
}
function update() { save(); render(); }
function resetResult() {
  byId('result').textContent = 'Bugun omad kimga kuladi?';
  byId('cta').hidden = true;
}
for (const id of fields) byId(id).addEventListener('input', event => {
  const field = event.currentTarget;
  state[id] = field.type === 'checkbox' ? field.checked : field.value;
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
  if (id === 'remove' && !state.remove) state.excluded = [];
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
byId('spin').addEventListener('click',spin);
byId('shuffle').addEventListener('click',() => {
  const list = entries();
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i],list[j]] = [list[j],list[i]];
  }
  state.entries = list.join('\n');
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
    state.entries = names.slice(0,200).join('\n');
    state.preset = '';
    state.excluded = [];
    resetResult();
    feedback(Math.min(names.length,200) + ' ta variant yuklandi.');
    update();
  } catch { feedback('Faylni o‘qib bo‘lmadi.'); }
});
byId('restore').addEventListener('click',() => { state.excluded = []; resetResult(); update(); });
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
if (overlay) {
  document.body.classList.add('overlay');
  window.addEventListener('storage', event => {
    if (event.key === key) {
      state = read();
      if (!running) {
        const displayedChoices = choices;
        const preserveWinner = !byId('cta').hidden || byId('result').textContent.startsWith('G‘olib');
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
render();
