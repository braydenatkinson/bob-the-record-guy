(() => {
const q = new URLSearchParams(location.search);
const FULL = q.get('motion') === 'full', FILM = q.get('film') === '1';
const RM = !FULL && matchMedia('(prefers-reduced-motion: reduce)').matches;
const deck = document.getElementById('deck');
const rec = deck.querySelector('.rec'), spins = [...deck.querySelectorAll('.spinr')];
const armw = deck.querySelector('.armw'), ashw = deck.querySelector('.ashw'), ash = ashw.querySelector('img');
const rsh = deck.querySelector('.rsh.on'), rshl = deck.querySelector('.rsh.up'), recw = deck.querySelector('.recw');
const btn = document.getElementById('flip'), sp = deck.querySelector('.spin3');
const SIDES = {"A": ["SIDE A", "For sale: LPs, 45s, CDs, jazz CDs."], "B": ["SIDE B", "He buys and trades. Call first."]};
const PLAY = 22.26, W = 200;
let T = 0, ang = 0, om = 0, armA = 0, lift = 0, rot = 0, sc = 1, side = 'A', busy = false, playing = false, want = true, flips = 0;
const tasks = new Set();
const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const out = p => 1 - (1 - p) * (1 - p);
function tween(ms, fn, e) { return new Promise(res => { const t0 = T; const f = () => { const p = Math.min(1, (T - t0) / ms);
  fn(e ? e(p) : p); if (p >= 1) { tasks.delete(f); res(); } }; tasks.add(f); f(); }); }
function until(c) { return new Promise(res => { const f = () => { if (c()) { tasks.delete(f); res(); } }; tasks.add(f); f(); }); }
function render() {
  const k = sp.offsetWidth / 55 || 2;
  const a = ((ang % 360) + 360) % 360;
  spins.forEach(s => s.style.transform = 'rotate(' + a.toFixed(2) + 'deg)');
  armw.style.transform = 'rotate(' + armA.toFixed(3) + 'deg) scale(' + (1 + lift * .012).toFixed(4) + ')';
  const rest = Math.max(0, 1 - armA / 14);
  ashw.style.transform = 'translate(' + (rest * 41 * k + lift * 6).toFixed(1) + 'px,' + (lift * 4).toFixed(1) + 'px)';
  ash.style.transform = 'rotate(' + armA.toFixed(3) + 'deg)';
  ash.style.opacity = (1 - lift * .4).toFixed(3);
  rec.style.transform = 'scale(' + sc.toFixed(4) + ') rotateX(' + rot.toFixed(2) + 'deg)';
  const up = Math.max(0, Math.min(1, (sc - 1) / .035 + (rot % 180 ? 1 : 0)));
  rsh.style.opacity = (1 - up).toFixed(3);
  rshl.style.opacity = (up * .9).toFixed(3);
  rshl.style.transform = 'scaleY(' + Math.abs(Math.cos(rot * Math.PI / 180)).toFixed(3) + ')';
  recw.style.zIndex = up > .001 ? 7 : 2;
}
function frame(dt) {
  T += dt; ang += om * dt / 1000;
  [...tasks].forEach(f => f());
  render();
}
function setSide(s) {
  side = s;
  document.querySelectorAll('.side').forEach(el => {
    el.classList.add('fade');
    setTimeout(() => { el.querySelector('h2').textContent = SIDES[s][0]; el.querySelector('p').textContent = SIDES[s][1];
      el.classList.remove('fade'); }, 100);
  });
  btn.setAttribute('aria-label', 'Flip the record to side ' + (s === 'A' ? 'B' : 'A'));
}
const spinUp = ms => tween(ms, p => om = W * p);
async function armIn(sw) { await tween(200, p => lift = p); await tween(sw, p => armA = PLAY * p, ease); await tween(300, p => lift = 1 - p, out); }
async function armOut() { if (armA <= 0 && lift <= 0) return; await tween(200, p => lift = Math.max(lift, p)); await tween(700, p => armA = PLAY * (1 - p), ease);
  tween(200, p => lift = 1 - p); }
async function brake() {
  if (om <= 0) { return; }
  await until(() => { const m = ((ang % 360) + 360) % 360; return m >= 150 && m < 200; });
  const target = 360 * Math.ceil((ang + 120) / 360), d = target - ang, o0 = om;
  await tween(2000 * d / o0, p => om = o0 * (1 - p));
  om = 0; ang = target;
}
async function start() { busy = true; playing = true; await Promise.all([spinUp(800), armIn(800)]); busy = false; manage(); }
async function stop() { busy = true; await armOut(); await brake(); playing = false; busy = false; manage(); }
async function flip() {
  busy = true; const was = playing;
  await armOut(); await brake();
  await tween(300, p => sc = 1 + .035 * p, out);
  let swapped = false; const r0 = rot;
  await tween(600, p => { rot = r0 + 180 * p; if (!swapped && p >= .5) { swapped = true; setSide(side === 'A' ? 'B' : 'A'); } }, ease);
  rot = r0 + 180;
  await tween(250, p => sc = p < .7 ? 1.035 - .047 * (p / .7) : .988 + .012 * ((p - .7) / .3));
  sc = 1; flips++;
  if (was && want) { await spinUp(600); await armIn(600); playing = true; } else playing = false;
  busy = false; manage();
}
function manage() {
  if (busy || RM) return;
  if (want && !playing) start();
  else if (!want && playing) stop();
  else if (playing && flips === 0 && T >= 9000) flip();
}
btn.addEventListener('click', () => {
  if (RM) { rec.classList.toggle('sb'); setSide(side === 'A' ? 'B' : 'A'); return; }
  if (!busy) flip();
});
if (RM) { rec.classList.add('rm'); render(); return; }
new IntersectionObserver(es => { es.forEach(e => { want = e.intersectionRatio >= .5; }); manage(); }, {threshold: [0, .5, 1]}).observe(deck);
tasks.add(() => { if (!busy && playing && flips === 0 && T >= 9000) manage(); });
render();
if (FILM) {
  window.demoFilm = { step(ms) { while (ms > 0) { const d = Math.min(ms, 20); frame(d); ms -= d; } return T; },
    state: () => ({T, ang, om, armA, lift, rot, sc, side, busy, playing}) };
  manage();
} else {
  let last = performance.now();
  const loop = t => { frame(Math.min(50, t - last)); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
  manage();
}
})();
