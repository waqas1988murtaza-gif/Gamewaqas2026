/* Waqas Game Hub - Kids Hub batch3: 8 real mini-games.
   Globals: loadBasket, loadTennis, loadFishing, loadPiano, loadDrums, loadPaint, loadDressup, loadCooking
   Plain script, no modules/imports/network. Each game sets container._cleanup. */

/* ---------- shared helpers (b3- prefix avoids collisions) ---------- */
var b3cssDone = false;
function b3css() {
  if (b3cssDone) return; b3cssDone = true;
  var s = document.createElement('style');
  s.textContent =
    '.b3-game{display:flex;flex-direction:column;height:100%;position:relative;background:#0e1a33;color:#fff;overflow:hidden}' +
    '.b3-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1b2a4a;flex-wrap:wrap}' +
    '.b3-title{font-size:17px;font-weight:800;flex:1;white-space:nowrap}' +
    '.b3-score{font-size:14px;background:#ffffff22;padding:4px 10px;border-radius:12px;white-space:nowrap}' +
    '.b3-btn{background:#ff9f1c;border:none;color:#fff;font-weight:800;font-size:14px;padding:8px 14px;border-radius:12px;cursor:pointer}' +
    '.b3-btn:active{transform:scale(.94)}' +
    '.b3-stage{position:relative;flex:1;overflow:hidden;min-height:0}' +
    '.b3-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,15,35,.9);z-index:20;text-align:center;padding:20px}' +
    '.b3-overlay h2{font-size:30px;margin:0 0 8px}' +
    '.b3-overlay p{font-size:16px;margin:4px 0 14px;line-height:1.5}' +
    '.b3-msg{position:absolute;left:8px;right:8px;top:34%;text-align:center;font-size:24px;font-weight:800;text-shadow:0 2px 8px #000;pointer-events:none;z-index:15}' +
    'canvas.b3-cv{display:block;width:100%;height:100%;touch-action:none}' +
    '.b3-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:8px;align-items:center}' +
    '.b3-pad{background:#243b6b;color:#fff;border:2px solid #ffffff33;border-radius:16px;padding:12px 10px;font-size:14px;font-weight:700;cursor:pointer;min-width:88px;text-align:center;user-select:none;-webkit-user-select:none;touch-action:manipulation}' +
    '.b3-pad.hit{transform:scale(.9);background:#2f4d8f;border-color:#ffd166}' +
    '.b3-pad .em{font-size:34px;display:block;line-height:1.2}' +
    '.b3-next{outline:4px solid #ffd166 !important;box-shadow:0 0 18px #ffd166;animation:b3pulse 1s infinite}' +
    '@keyframes b3pulse{50%{box-shadow:0 0 26px #ffd166}}' +
    '.b3-shake{animation:b3shake .3s}' +
    '@keyframes b3shake{25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}' +
    '.b3-bar{height:10px;background:#ffffff22;border-radius:6px;overflow:hidden;min-width:120px;flex:1}' +
    '.b3-bar>i{display:block;height:100%;background:#2ec4b6;border-radius:6px;transition:width .3s}' +
    '.b3-chip{background:#243b6b;border-radius:10px;padding:6px 8px;font-size:20px;border:2px solid transparent}' +
    '.b3-chip.done{border-color:#2ec4b6;background:#1d5c55}' +
    '.b3-chip.cur{border-color:#ffd166}';
  document.head.appendChild(s);
}

function b3Track() {
  var rafs = [], ivs = [], tos = [], ls = [], dead = false;
  return {
    raf: function (fn) {
      var id = requestAnimationFrame(function (t) { if (!dead) fn(t); });
      rafs.push(id); return id;
    },
    every: function (fn, ms) {
      var id = setInterval(function () { if (!dead) fn(); }, ms);
      ivs.push(id); return id;
    },
    after: function (fn, ms) {
      var id = setTimeout(function () { if (!dead) fn(); }, ms);
      tos.push(id); return id;
    },
    on: function (el, type, fn, opts) {
      el.addEventListener(type, fn, opts); ls.push([el, type, fn, opts]);
    },
    cleanup: function () {
      dead = true;
      rafs.forEach(cancelAnimationFrame); ivs.forEach(clearInterval); tos.forEach(clearTimeout);
      ls.forEach(function (l) { try { l[0].removeEventListener(l[1], l[2], l[3]); } catch (e) {} });
    }
  };
}

var b3AC = null;
function b3ac() {
  try {
    if (!b3AC) b3AC = new (window.AudioContext || window.webkitAudioContext)();
    if (b3AC.state === 'suspended') b3AC.resume();
  } catch (e) {}
  return b3AC;
}
var b3ToneSynth = null;
function b3tone(freq, dur, type, vol) {
  dur = dur || 0.25; type = type || 'sine'; vol = (vol == null ? 0.4 : vol);
  try {
    if (typeof Tone !== 'undefined' && Tone.Synth) {
      if (!b3ToneSynth) b3ToneSynth = new Tone.Synth().toDestination();
      try { b3ToneSynth.set({ oscillator: { type: type } }); } catch (e) {}
      b3ToneSynth.triggerAttackRelease(freq, dur, Tone.now(), vol);
      return;
    }
  } catch (e) {}
  try {
    var ac = b3ac(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur + 0.03);
  } catch (e) {}
}
function b3noise(dur, freq, q, vol) {
  try {
    var ac = b3ac(); if (!ac) return;
    dur = dur || 0.2; freq = freq || 1000; vol = (vol == null ? 0.5 : vol);
    var len = Math.max(1, Math.floor(ac.sampleRate * dur));
    var buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ac.createBufferSource(); src.buffer = buf;
    var f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq; f.Q.value = q || 0.8;
    var g = ac.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start();
  } catch (e) {}
}
function b3freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
var b3names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function b3nname(midi) { return b3names[midi % 12] + (Math.floor(midi / 12) - 1); }
function b3shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function b3head(title, scoreText) {
  var h = document.createElement('div'); h.className = 'b3-head';
  h.innerHTML = '<span class="b3-title">' + title + '</span><span class="b3-score">' + scoreText + '</span><button class="b3-btn">↺ Restart</button>';
  return h;
}

/* ---------- 1. Basketball shoot ---------- */
function loadBasket(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var LW = 800, LH = 500;
  var shots = 10, score = 0, state = 'aim', endTimer = 0;
  var head = b3head('🏀 Basketball Shoot', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  var cv = document.createElement('canvas'); cv.className = 'b3-cv'; cv.width = LW; cv.height = LH; stage.appendChild(cv);
  var ctx = cv.getContext('2d');
  var msg = document.createElement('div'); msg.className = 'b3-msg'; stage.appendChild(msg);
  var ov = document.createElement('div'); ov.className = 'b3-overlay'; ov.style.display = 'none'; stage.appendChild(ov);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadBasket(container); };

  var rimY = 170, rimCX = 640, rimHalf = 30, rimL = rimCX - rimHalf, rimR = rimCX + rimHalf, boardX = rimR + 16;
  var ball = { x: 150, y: 420, vx: 0, vy: 0, r: 15, flying: false };
  var rimTouched = false, scored = false, dragOn = false, aimPt = null;

  function upd() { scoreEl.textContent = '⭐ ' + score + '   🎯 ' + shots + ' left'; }
  function jingle() {
    var n = [523, 659, 784];
    for (var i = 0; i < 3; i++) (function (k) { T.after(function () { b3tone(n[k], 0.18, 'triangle', 0.4); }, k * 120); })(i);
  }
  function toGame(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * LW / r.width, y: (e.clientY - r.top) * LH / r.height };
  }
  function resetBall() {
    ball.x = 150; ball.y = 420; ball.vx = 0; ball.vy = 0; ball.flying = false;
    rimTouched = false; scored = false; state = 'aim';
    msg.textContent = '👆 Drag the ball to aim, release to shoot!';
  }
  function shoot() {
    var vx = (aimPt.x - ball.x) * 4.2, vy = (aimPt.y - ball.y) * 4.2;
    var sp = Math.hypot(vx, vy), mx = 1500;
    if (sp > mx) { vx *= mx / sp; vy *= mx / sp; }
    ball.vx = vx; ball.vy = vy; ball.flying = true; state = 'fly';
    msg.textContent = ''; b3tone(300, 0.12, 'square', 0.25);
  }
  function resolve(hit) {
    if (state !== 'fly') return;
    state = 'done';
    if (hit) {
      var pts = rimTouched ? 1 : 2; score += pts;
      msg.textContent = rimTouched ? '🏀 +1' : '✨ SWISH! +2'; jingle();
    } else { msg.textContent = '❌ Miss'; b3tone(160, 0.25, 'sawtooth', 0.25); }
    shots--; upd();
    T.after(function () { if (shots <= 0) endGame(); else resetBall(); }, 950);
  }
  function endGame() {
    state = 'over';
    var line = score >= 16 ? '🏆 Amazing sharpshooter!' : score >= 10 ? '👏 Great shooting!' : '💪 Keep practicing!';
    ov.style.display = 'flex';
    ov.innerHTML = '<h2>🏀 Game Over</h2><p>You scored <b>' + score + '</b> points in 10 shots!<br>' + line + '</p><button class="b3-btn" style="font-size:18px;padding:12px 26px">↺ Play Again</button>';
    ov.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadBasket(container); };
    jingle();
  }
  function step(dt) {
    if (state !== 'fly') return;
    var prevY = ball.y;
    ball.vy += 1500 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    var pts = [[rimL, rimY], [rimR, rimY]];
    for (var i = 0; i < 2; i++) {
      var dx = ball.x - pts[i][0], dy = ball.y - pts[i][1], d = Math.hypot(dx, dy);
      if (d < ball.r + 5 && d > 0.01) {
        var nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
          ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
          ball.vx *= 0.6; ball.vy *= 0.6; rimTouched = true; b3tone(220, 0.08, 'square', 0.3);
        }
        ball.x = pts[i][0] + nx * (ball.r + 5); ball.y = pts[i][1] + ny * (ball.r + 5);
      }
    }
    if (ball.x + ball.r > boardX && ball.x < boardX + 14 && ball.y > 105 && ball.y < 210 && ball.vx > 0) {
      ball.vx *= -0.55; ball.x = boardX - ball.r; b3tone(180, 0.08, 'square', 0.3);
    }
    if (ball.y + ball.r > LH - 6) {
      ball.y = LH - 6 - ball.r; ball.vy *= -0.45; ball.vx *= 0.8;
      if (Math.abs(ball.vy) > 60) b3tone(120, 0.07, 'sine', 0.25);
    }
    if (!scored && ball.vy > 0 && prevY < rimY && ball.y >= rimY && ball.x > rimL + 7 && ball.x < rimR - 7) {
      scored = true; resolve(true); return;
    }
    if (ball.y > LH + 80 || ball.x < -80 || ball.x > LW + 80) { resolve(false); return; }
    var sp = Math.hypot(ball.vx, ball.vy);
    if (sp < 50 && ball.y + ball.r >= LH - 8) { endTimer += dt; if (endTimer > 0.5) { endTimer = 0; resolve(false); return; } }
    else endTimer = 0;
  }
  function draw() {
    ctx.clearRect(0, 0, LW, LH);
    var g = ctx.createLinearGradient(0, 0, 0, LH);
    g.addColorStop(0, '#1c3a6e'); g.addColorStop(1, '#0e1a33');
    ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);
    ctx.fillStyle = '#c98f4e'; ctx.fillRect(0, LH - 70, LW, 70);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, LH - 70, LW, 6);
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(boardX + 22, 105); ctx.lineTo(boardX + 22, 40); ctx.stroke();
    ctx.fillStyle = '#e8ecf1'; ctx.fillRect(boardX, 105, 12, 105);
    ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(rimL, rimY); ctx.lineTo(rimR, rimY); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (var i = 0; i <= 4; i++) {
      var x = rimL + i * (rimR - rimL) / 4;
      ctx.beginPath(); ctx.moveTo(x, rimY); ctx.lineTo(rimCX + (x - rimCX) * 0.55, rimY + 42); ctx.stroke();
    }
    if (state === 'aim' && dragOn && aimPt) {
      var vx = (aimPt.x - ball.x) * 4.2, vy = (aimPt.y - ball.y) * 4.2;
      var sp = Math.hypot(vx, vy), mx = 1500;
      if (sp > mx) { vx *= mx / sp; vy *= mx / sp; }
      ctx.fillStyle = '#ffd166';
      var px = ball.x, py = ball.y, pvx = vx, pvy = vy;
      for (var s = 0; s < 26; s++) {
        pvy += 1500 * 0.033; px += pvx * 0.033; py += pvy * 0.033;
        if (s % 2 === 0) { ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill(); }
      }
      var ang = Math.round(Math.atan2(-(aimPt.y - ball.y), aimPt.x - ball.x) * 180 / Math.PI);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Angle ' + ang + '°   Power ' + Math.min(100, Math.round(sp / 15)) + '%', 12, 26);
    }
    ctx.fillStyle = '#f2782c';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a3c10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ball.x - ball.r, ball.y); ctx.lineTo(ball.x + ball.r, ball.y);
    ctx.moveTo(ball.x, ball.y - ball.r); ctx.lineTo(ball.x, ball.y + ball.r);
    ctx.stroke();
  }
  T.on(cv, 'pointerdown', function (e) {
    if (state !== 'aim') return;
    var p = toGame(e);
    if (Math.hypot(p.x - ball.x, p.y - ball.y) < 80) { dragOn = true; aimPt = p; e.preventDefault(); }
  });
  T.on(window, 'pointermove', function (e) { if (dragOn && state === 'aim') aimPt = toGame(e); });
  T.on(window, 'pointerup', function (e) {
    if (dragOn && state === 'aim') { aimPt = toGame(e); dragOn = false; shoot(); }
  });
  T.every(function () { step(1 / 60); draw(); }, 1000 / 60);
  upd(); resetBall();
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 2. Tennis (pong-style vs AI) ---------- */
function loadTennis(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var LW = 800, LH = 500, WIN = 5;
  var you = 0, ai = 0, state = 'serve', rally = 0;
  var head = b3head('🎾 Tennis Smash', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  var cv = document.createElement('canvas'); cv.className = 'b3-cv'; cv.width = LW; cv.height = LH; stage.appendChild(cv);
  var ctx = cv.getContext('2d');
  var ov = document.createElement('div'); ov.className = 'b3-overlay'; ov.style.display = 'none'; stage.appendChild(ov);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadTennis(container); };

  var pp = { x: 400, w: 130 }, ap = { x: 400, w: 130 };
  var ball = { x: 400, y: 250, vx: 0, vy: 0, r: 10 };
  var keys = {};

  function upd() { scoreEl.textContent = '🧒 You ' + you + ' : ' + ai + ' 🤖  (first to ' + WIN + ')'; }
  function speedUp() {
    var s = Math.hypot(ball.vx, ball.vy), ns = Math.min(720, s * 1.045);
    ball.vx *= ns / s; ball.vy *= ns / s;
  }
  function serve() {
    if (state === 'over') return;
    ball.x = LW / 2; ball.y = LH / 2; rally = 0;
    var a = (Math.random() * 0.7 + 0.35) * (Math.random() < 0.5 ? -1 : 1), sp = 330;
    ball.vx = Math.sin(a) * sp; ball.vy = (Math.random() < 0.5 ? -1 : 1) * Math.cos(a) * sp;
    state = 'play';
  }
  function point(w) {
    if (state !== 'play') return;
    if (w === 'you') { you++; b3tone(660, 0.3, 'triangle', 0.4); }
    else { ai++; b3tone(200, 0.3, 'sawtooth', 0.3); }
    upd();
    if (you >= WIN || ai >= WIN) { endGame(); return; }
    state = 'serve'; T.after(serve, 1000);
  }
  function endGame() {
    state = 'over';
    var win = you >= WIN;
    ov.style.display = 'flex';
    ov.innerHTML = '<h2>' + (win ? '🏆 You Win!' : '🤖 AI Wins') + '</h2><p>Final score: You ' + you + ' : ' + ai + ' AI<br>' +
      (win ? 'Champion! 🎉' : 'Good rally! Try again 💪') + '</p><button class="b3-btn" style="font-size:18px;padding:12px 26px">↺ Play Again</button>';
    ov.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadTennis(container); };
    if (win) { var n = [523, 659, 784, 1047]; for (var i = 0; i < 4; i++) (function (k) { T.after(function () { b3tone(n[k], 0.2, 'triangle', 0.4); }, k * 130); })(i); }
  }
  function toGameX(e) {
    var r = cv.getBoundingClientRect();
    return (e.clientX - r.left) * LW / r.width;
  }
  function step(dt) {
    if (keys.left) pp.x -= 520 * dt;
    if (keys.right) pp.x += 520 * dt;
    pp.x = Math.max(pp.w / 2, Math.min(LW - pp.w / 2, pp.x));
    if (state !== 'play') return;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; }
    if (ball.x > LW - ball.r) { ball.x = LW - ball.r; ball.vx *= -1; }
    if (ball.vy > 0 && ball.y + ball.r >= LH - 40 && ball.y + ball.r <= LH - 18 && Math.abs(ball.x - pp.x) < pp.w / 2 + ball.r) {
      var rel = (ball.x - pp.x) / (pp.w / 2);
      ball.vy *= -1; ball.vx += rel * 260; rally++; speedUp();
      ball.y = LH - 40 - ball.r; b3tone(440 + Math.min(rally, 10) * 30, 0.08, 'square', 0.3);
    }
    if (ball.vy < 0 && ball.y - ball.r <= 40 && ball.y - ball.r >= 18 && Math.abs(ball.x - ap.x) < ap.w / 2 + ball.r) {
      var rel2 = (ball.x - ap.x) / (ap.w / 2);
      ball.vy *= -1; ball.vx += rel2 * 260;
      ball.y = 40 + ball.r; b3tone(330, 0.08, 'square', 0.25);
    }
    if (ball.y > LH + 24) { point('ai'); return; }
    if (ball.y < -24) { point('you'); return; }
    var maxSp = 250 + (you + ai) * 22;
    var dx = ball.x - ap.x;
    if (Math.abs(dx) > 8) ap.x += Math.sign(dx) * Math.min(maxSp * dt, Math.abs(dx));
    ap.x = Math.max(ap.w / 2, Math.min(LW - ap.w / 2, ap.x));
  }
  function draw() {
    var g = ctx.createLinearGradient(0, 0, 0, LH);
    g.addColorStop(0, '#0d5c2e'); g.addColorStop(1, '#14914a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4;
    ctx.strokeRect(24, 60, LW - 48, LH - 120);
    ctx.beginPath(); ctx.moveTo(24, LH / 2); ctx.lineTo(LW - 24, LH / 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(24, LH / 2 - 14); ctx.lineTo(LW - 24, LH / 2 - 14);
    ctx.moveTo(24, LH / 2 + 14); ctx.lineTo(LW - 24, LH / 2 + 14); ctx.stroke();
    ctx.fillStyle = '#8a8f98';
    ctx.fillRect(20, LH / 2 - 20, 8, 40); ctx.fillRect(LW - 28, LH / 2 - 20, 8, 40);
    ctx.fillStyle = '#ffd166';
    roundRect(pp.x - pp.w / 2, LH - 40, pp.w, 16, 8); ctx.fill();
    ctx.fillStyle = '#ff5a5a';
    roundRect(ap.x - ap.w / 2, 24, ap.w, 16, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r - 3, 0.6, 2.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r - 3, Math.PI + 0.6, Math.PI + 2.4); ctx.stroke();
    if (state === 'serve') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Get ready... 👆 drag to move', LW / 2, LH / 2 - 40);
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  T.on(cv, 'pointerdown', function (e) { pp.x = Math.max(pp.w / 2, Math.min(LW - pp.w / 2, toGameX(e))); });
  T.on(cv, 'pointermove', function (e) {
    if (e.buttons || e.pointerType === 'touch') pp.x = Math.max(pp.w / 2, Math.min(LW - pp.w / 2, toGameX(e)));
  });
  T.on(window, 'keydown', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
  });
  T.on(window, 'keyup', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });
  T.every(function () { step(1 / 60); draw(); }, 1000 / 60);
  upd(); T.after(serve, 600);
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 3. Fishing ---------- */
function loadFishing(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var LW = 800, LH = 560, WT = 150, GOAL = 10;
  var catches = 0, score = 0;
  var head = b3head('🎣 Fishing Fun', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  var cv = document.createElement('canvas'); cv.className = 'b3-cv'; cv.width = LW; cv.height = LH; stage.appendChild(cv);
  var ctx = cv.getContext('2d');
  var msg = document.createElement('div'); msg.className = 'b3-msg'; stage.appendChild(msg);
  var ov = document.createElement('div'); ov.className = 'b3-overlay'; ov.style.display = 'none'; stage.appendChild(ov);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadFishing(container); };

  var cols = ['#ff8c42', '#ffd166', '#6df7ea', '#ff5a8a', '#9b8cff', '#7bd88a'];
  var fishes = [];
  function newFish(f) {
    f = f || {};
    f.dir = Math.random() < 0.5 ? -1 : 1;
    f.x = f.dir > 0 ? -40 : LW + 40;
    f.y = 200 + Math.random() * 320;
    f.sp = 40 + Math.random() * 80;
    f.size = 12 + Math.random() * 15;
    f.col = cols[Math.floor(Math.random() * cols.length)];
    f.wob = Math.random() * 6.28;
    return f;
  }
  for (var i = 0; i < 8; i++) { var f = newFish(); f.x = Math.random() * LW; fishes.push(f); }
  var hook = { x: 400, y: WT, state: 'idle', ty: 0, biteT: 0, win: 0, shake: 0 };
  var t = 0;

  function upd() { scoreEl.textContent = '🐟 ' + catches + '/' + GOAL + '   ⭐ ' + score; }
  function toGame(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * LW / r.width, y: (e.clientY - r.top) * LH / r.height };
  }
  function cast(p) {
    hook.state = 'sink';
    hook.x = Math.max(40, Math.min(LW - 40, p.x));
    hook.ty = Math.max(WT + 50, Math.min(LH - 20, p.y));
    msg.textContent = '';
    b3tone(500, 0.15, 'sine', 0.3);
  }
  function caughtFish(f) {
    var pts = Math.round(f.size * 2);
    score += pts; catches++;
    var idx = fishes.indexOf(f); if (idx >= 0) fishes[idx] = newFish();
    msg.textContent = '🎉 Caught! +' + pts + ' ⭐';
    b3tone(660, 0.12, 'triangle', 0.4);
    T.after(function () { b3tone(880, 0.2, 'triangle', 0.4); }, 110);
    hook.state = 'reel'; upd();
    if (catches >= GOAL) T.after(endGame, 1400);
  }
  function endGame() {
    ov.style.display = 'flex';
    ov.innerHTML = '<h2>🎣 Great Catch!</h2><p>You caught <b>' + GOAL + '</b> fish!<br>Total score: <b>⭐ ' + score + '</b></p><button class="b3-btn" style="font-size:18px;padding:12px 26px">↺ Fish Again</button>';
    ov.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadFishing(container); };
    var n = [523, 659, 784, 1047];
    for (var i = 0; i < 4; i++) (function (k) { T.after(function () { b3tone(n[k], 0.2, 'triangle', 0.4); }, k * 130); })(i);
  }
  function step(dt) {
    t += dt;
    for (var i = 0; i < fishes.length; i++) {
      var f = fishes[i];
      f.x += f.dir * f.sp * dt; f.wob += dt * 6;
      if (f.dir > 0 && f.x > LW + 50) fishes[i] = newFish();
      if (f.dir < 0 && f.x < -50) fishes[i] = newFish();
    }
    if (hook.state === 'sink') {
      hook.y += 300 * dt;
      if (hook.y >= hook.ty) { hook.y = hook.ty; hook.state = 'wait'; hook.biteT = 0; }
    } else if (hook.state === 'wait') {
      hook.y = hook.ty + Math.sin(t * 3) * 4;
      hook.biteT += dt;
      if (hook.biteT > 0.5) {
        for (var j = 0; j < fishes.length; j++) {
          var f2 = fishes[j];
          if (Math.hypot(f2.x - hook.x, f2.y - hook.y) < 36 && Math.random() < 1.4 * dt) {
            hook.state = 'bite'; hook.win = 0.9; hook.fish = f2;
            msg.textContent = '⚡ TAP NOW! 👆'; b3tone(1200, 0.1, 'square', 0.35);
            break;
          }
        }
      }
    } else if (hook.state === 'bite') {
      hook.win -= dt; hook.shake = (hook.shake + 1) % 4;
      if (hook.win <= 0) {
        msg.textContent = '💨 It got away!'; hook.state = 'reel'; hook.fish = null;
        b3tone(220, 0.25, 'sawtooth', 0.3);
      }
    } else if (hook.state === 'reel') {
      hook.y -= 420 * dt;
      if (hook.y <= WT) {
        hook.y = WT; hook.state = 'idle';
        if (catches < GOAL) msg.textContent = 'Tap the water to cast! 🎣';
      }
    }
  }
  function drawFish(f) {
    ctx.save(); ctx.translate(f.x, f.y + Math.sin(f.wob) * 3);
    if (f.dir < 0) ctx.scale(-1, 1);
    ctx.fillStyle = f.col;
    ctx.beginPath(); ctx.ellipse(0, 0, f.size, f.size * 0.55, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-f.size * 0.9, 0); ctx.lineTo(-f.size * 1.5, -f.size * 0.5); ctx.lineTo(-f.size * 1.5, f.size * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.size * 0.55, -f.size * 0.12, f.size * 0.16, 0, 7); ctx.fill();
    ctx.fillStyle = '#123'; ctx.beginPath(); ctx.arc(f.size * 0.58, -f.size * 0.12, f.size * 0.08, 0, 7); ctx.fill();
    ctx.restore();
  }
  function draw() {
    var sky = ctx.createLinearGradient(0, 0, 0, WT);
    sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#d8f1ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, LW, WT);
    ctx.fillStyle = '#ffdf5e'; ctx.beginPath(); ctx.arc(700, 50, 30, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.ellipse(180, 55, 55, 18, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(240, 70, 40, 14, 0, 0, 7); ctx.fill();
    var wtr = ctx.createLinearGradient(0, WT, 0, LH);
    wtr.addColorStop(0, '#2e9bc4'); wtr.addColorStop(1, '#0b3d66');
    ctx.fillStyle = wtr; ctx.fillRect(0, WT, LW, LH - WT);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (var x = 0; x <= LW; x += 20) ctx.lineTo(x, WT + Math.sin(x / 40 + t * 2) * 4);
    ctx.stroke();
    ctx.strokeStyle = '#2c7a3f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (var s = 0; s < 5; s++) {
      var sx = 60 + s * 170;
      ctx.beginPath(); ctx.moveTo(sx, LH);
      ctx.quadraticCurveTo(sx + Math.sin(t * 1.5 + s) * 20, LH - 60, sx + Math.sin(t + s * 2) * 26, LH - 110);
      ctx.stroke();
    }
    for (var i = 0; i < fishes.length; i++) drawFish(fishes[i]);
    var bx = 400;
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.moveTo(bx - 70, 118); ctx.lineTo(bx + 70, 118); ctx.lineTo(bx + 45, 142); ctx.lineTo(bx - 45, 142);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5e3a17'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(bx + 30, 118); ctx.lineTo(bx + 110, 60); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,20,20,.75)'; ctx.lineWidth = 2;
    var hx = hook.x + (hook.state === 'bite' ? (hook.shake < 2 ? -5 : 5) : 0);
    ctx.beginPath(); ctx.moveTo(bx + 110, 60); ctx.lineTo(hx, hook.y); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hook.y + 6, 7, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = '#ff5a3c'; ctx.beginPath(); ctx.arc(hx, hook.y - 2, 3.5, 0, 7); ctx.fill();
    if (hook.state === 'bite' && Math.floor(t * 6) % 2 === 0) {
      ctx.fillStyle = '#ff3b3b'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⚡ TAP! ⚡', hx, hook.y - 40);
    }
  }
  T.on(cv, 'pointerdown', function (e) {
    var p = toGame(e);
    if (hook.state === 'idle' && p.y > WT + 10) cast(p);
    else if (hook.state === 'bite' && hook.fish) caughtFish(hook.fish);
    else if (hook.state === 'wait') { hook.state = 'reel'; msg.textContent = ''; }
  });
  T.every(function () { step(1 / 60); draw(); }, 1000 / 60);
  upd(); msg.textContent = 'Tap the water to cast! 🎣';
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 4. Piano (learn notes + song guide) ---------- */
function loadPiano(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var head = b3head('🎹 Piano', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadPiano(container); };

  var whiteMap = [0, 2, 4, 5, 7, 9, 11], NW = 14;
  function whiteMidi(i) { var o = Math.floor(i / 7); return 60 + o * 12 + whiteMap[i % 7]; }
  var keyEls = {};
  var lastName = '—';

  var bar = document.createElement('div'); bar.className = 'b3-row'; stage.appendChild(bar);
  var guideBtn = document.createElement('button'); guideBtn.className = 'b3-btn'; guideBtn.textContent = '🎵 Guide: Twinkle Twinkle';
  var freeBtn = document.createElement('button'); freeBtn.className = 'b3-btn'; freeBtn.textContent = '🎶 Free Play';
  var noteBig = document.createElement('div');
  noteBig.style.cssText = 'font-size:22px;font-weight:800;color:#ffd166';
  noteBig.textContent = '♪ —';
  bar.appendChild(guideBtn); bar.appendChild(freeBtn); bar.appendChild(noteBig);

  var keysWrap = document.createElement('div');
  keysWrap.style.cssText = 'position:relative;margin:6px 10px;height:230px;';
  var whites = document.createElement('div');
  whites.style.cssText = 'display:flex;height:100%;gap:2px;';
  stage.appendChild(keysWrap); keysWrap.appendChild(whites);

  var song = [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60];
  var guide = { on: false, idx: 0 };

  function upd() {
    scoreEl.textContent = guide.on ? '🎵 Note ' + guide.idx + '/' + song.length : '🎵 ' + lastName;
  }
  function clearHi() {
    for (var m in keyEls) keyEls[m].classList.remove('b3-next');
  }
  function hiNext() {
    clearHi();
    if (guide.on && guide.idx < song.length) keyEls[song[guide.idx]].classList.add('b3-next');
  }
  function guideHit(m) {
    if (!guide.on) return;
    if (m === song[guide.idx]) {
      guide.idx++; b3tone(880, 0.1, 'triangle', 0.3); hiNext(); upd();
      if (guide.idx >= song.length) {
        guide.on = false; clearHi();
        noteBig.textContent = '🌟 You played Twinkle Twinkle!';
        var n = [523, 659, 784, 1047, 1319];
        for (var i = 0; i < 5; i++) (function (k) { T.after(function () { b3tone(n[k], 0.25, 'triangle', 0.4); }, k * 140); })(i);
      }
    } else b3tone(110, 0.2, 'sawtooth', 0.3);
  }
  function playMidi(m) {
    b3tone(b3freq(m), 0.6, 'triangle', 0.45);
    lastName = b3nname(m); noteBig.textContent = '♪ ' + lastName; upd();
    var el = keyEls[m];
    if (el) {
      el.classList.add('hit');
      T.after(function () { el.classList.remove('hit'); }, 140);
    }
    guideHit(m);
  }
  for (var i = 0; i < NW; i++) {
    (function (k) {
      var m = whiteMidi(k);
      var w = document.createElement('div');
      w.style.cssText = 'flex:1;background:#fdfdfd;border:2px solid #223;border-radius:0 0 10px 10px;position:relative;cursor:pointer;touch-action:manipulation';
      w.innerHTML = '<span style="position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:12px;font-weight:800;color:#556">' + b3nname(m) + '</span>';
      w.className += ' b3-pad';
      w.style.padding = '0';
      T.on(w, 'pointerdown', function (e) { e.preventDefault(); playMidi(m); });
      whites.appendChild(w); keyEls[m] = w;
    })(i);
  }
  for (var b = 0; b < NW - 1; b++) {
    if ([0, 1, 3, 4, 5].indexOf(b % 7) < 0) continue;
    (function (k) {
      var m = whiteMidi(k) + 1;
      var bl = document.createElement('div');
      bl.style.cssText = 'position:absolute;top:0;height:135px;width:' + (100 / NW * 0.62) + '%;left:' + ((k + 1) * 100 / NW) + '%;transform:translateX(-50%);background:#16161e;border-radius:0 0 8px 8px;cursor:pointer;z-index:5;touch-action:manipulation';
      bl.innerHTML = '<span style="position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:10px;font-weight:800;color:#ffd166">' + b3nname(m) + '</span>';
      T.on(bl, 'pointerdown', function (e) { e.preventDefault(); playMidi(m); });
      keysWrap.appendChild(bl); keyEls[m] = bl;
    })(b);
  }
  var hint = document.createElement('div');
  hint.style.cssText = 'text-align:center;color:#9fb3d9;font-size:13px;padding:8px';
  hint.textContent = 'Keyboard: Z X C V B N M = C4–B4,  Q W E R T Y U = C5–B5  •  Black keys: S D G H J  and  2 3 5 6 7';
  stage.appendChild(hint);

  var kb = { z: 60, x: 62, c: 64, v: 65, b: 67, n: 69, m: 71, q: 72, w: 74, e: 76, r: 77, t: 79, y: 81, u: 83, s: 61, d: 63, g: 66, h: 68, j: 70, '2': 73, '3': 75, '5': 78, '6': 80, '7': 82 };
  T.on(window, 'keydown', function (e) {
    var k = e.key.toLowerCase();
    if (kb[k] != null && !e.repeat) playMidi(kb[k]);
  });
  guideBtn.onclick = function () {
    guide.on = true; guide.idx = 0; hiNext(); upd();
    noteBig.textContent = '🎵 Follow the glowing keys!';
    b3tone(523, 0.2, 'triangle', 0.4);
  };
  freeBtn.onclick = function () { guide.on = false; clearHi(); upd(); noteBig.textContent = '♪ —'; };
  upd();
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 5. Drum kit ---------- */
function loadDrums(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var head = b3head('🥁 Drum Kit', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadDrums(container); };

  var pads = [
    { id: 'kick', em: '🦵', name: 'Kick', key: 'f', col: '#e63946' },
    { id: 'snare', em: '👏', name: 'Snare', key: 'g', col: '#f4a261' },
    { id: 'hihat', em: '🎩', name: 'Hi-Hat', key: 'h', col: '#2ec4b6' },
    { id: 'tom', em: '🪘', name: 'Tom', key: 'j', col: '#9b8cff' },
    { id: 'cymbal', em: '🌟', name: 'Cymbal', key: 'k', col: '#ffd166' }
  ];
  var padEls = {};
  var learn = { on: false, idx: 0, ok: 0, bad: 0 };
  var pattern = ['kick', 'snare', 'hihat', 'snare', 'kick', 'kick', 'snare', 'cymbal'];

  function drumSound(id) {
    var ac = b3ac(); if (!ac) return;
    var t = ac.currentTime;
    function mk(type, f0, f1, dur, vol) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.5);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    if (id === 'kick') mk('sine', 160, 45, 0.3, 0.9);
    else if (id === 'snare') { b3noise(0.18, 1800, 0.8, 0.5); mk('triangle', 190, null, 0.12, 0.35); }
    else if (id === 'hihat') b3noise(0.06, 7500, 0.7, 0.35);
    else if (id === 'tom') mk('sine', 210, 95, 0.28, 0.7);
    else if (id === 'cymbal') b3noise(0.8, 4500, 0.6, 0.4);
  }
  function upd() {
    scoreEl.textContent = learn.on ? '🥁 Beat ' + (learn.idx + 1) + '/' + pattern.length + '  ✅' + learn.ok : '🥁 Free play — tap the drums!';
  }
  function drawPattern() {
    chipsEl.innerHTML = '';
    for (var i = 0; i < pattern.length; i++) {
      var p = pads.filter(function (x) { return x.id === pattern[i]; })[0];
      var c = document.createElement('span');
      c.className = 'b3-chip' + (learn.on && i < learn.idx ? ' done' : '') + (learn.on && i === learn.idx ? ' cur' : '');
      c.textContent = p.em;
      chipsEl.appendChild(c);
    }
  }
  function learnHit(id) {
    if (id === pattern[learn.idx]) {
      learn.ok++; learn.idx++; b3tone(880, 0.1, 'triangle', 0.3);
      if (learn.idx >= pattern.length) {
        var acc = Math.round(100 * learn.ok / (learn.ok + learn.bad));
        scoreEl.textContent = '🌟 Beat complete! Accuracy ' + acc + '%';
        b3tone(1047, 0.3, 'triangle', 0.4);
        learn.on = false; learn.idx = 0; learn.ok = 0; learn.bad = 0;
        T.after(drawPattern, 300);
        return;
      }
    } else { learn.bad++; b3tone(140, 0.2, 'sawtooth', 0.3); }
    drawPattern(); upd();
  }
  function hit(id) {
    drumSound(id);
    var el = padEls[id];
    el.classList.add('hit');
    T.after(function () { el.classList.remove('hit'); }, 130);
    if (learn.on) learnHit(id);
  }

  var bar = document.createElement('div'); bar.className = 'b3-row'; stage.appendChild(bar);
  var learnBtn = document.createElement('button'); learnBtn.className = 'b3-btn'; learnBtn.textContent = '🎓 Learn a Beat';
  var freeB = document.createElement('button'); freeB.className = 'b3-btn'; freeB.textContent = '🎶 Free Play';
  bar.appendChild(learnBtn); bar.appendChild(freeB);
  var chipsEl = document.createElement('div'); chipsEl.className = 'b3-row'; stage.appendChild(chipsEl);

  var grid = document.createElement('div');
  grid.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:10px';
  stage.appendChild(grid);
  for (var i = 0; i < pads.length; i++) {
    (function (p) {
      var d = document.createElement('div');
      d.className = 'b3-pad';
      d.style.cssText += ';min-width:110px;min-height:110px;display:flex;flex-direction:column;justify-content:center;border-color:' + p.col;
      d.innerHTML = '<span class="em">' + p.em + '</span>' + p.name + '<br><span style="font-size:11px;color:#9fb3d9">key ' + p.key.toUpperCase() + '</span>';
      T.on(d, 'pointerdown', function (e) { e.preventDefault(); hit(p.id); });
      grid.appendChild(d); padEls[p.id] = d;
    })(pads[i]);
  }
  T.on(window, 'keydown', function (e) {
    var k = e.key.toLowerCase();
    for (var i = 0; i < pads.length; i++) if (pads[i].key === k && !e.repeat) hit(pads[i].id);
  });
  learnBtn.onclick = function () {
    learn.on = true; learn.idx = 0; learn.ok = 0; learn.bad = 0;
    drawPattern(); upd(); b3tone(523, 0.2, 'triangle', 0.4);
  };
  freeB.onclick = function () { learn.on = false; drawPattern(); upd(); };
  drawPattern(); upd();
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 6. Paint ---------- */
function loadPaint(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var head = b3head('🎨 Paint', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; stage.style.background = '#fff'; container.appendChild(stage);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadPaint(container); };

  var strokes = 0, color = '#e63946', size = 10, erasing = false;
  var undoStack = [];

  var tools = document.createElement('div');
  tools.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px;background:#1b2a4a;overflow-x:auto';
  stage.parentNode.insertBefore(tools, stage);

  var colors = ['#111111', '#ffffff', '#e63946', '#f4841f', '#ffd166', '#2ec4b6', '#2a9d3f', '#2772db', '#9b8cff', '#f75fa8', '#8a5a2b'];
  for (var ci = 0; ci < colors.length; ci++) {
    (function (c) {
      var b = document.createElement('button');
      b.style.cssText = 'width:34px;height:34px;border-radius:50%;border:3px solid #ffffff55;background:' + c + ';cursor:pointer;flex:none';
      b.title = c;
      T.on(b, 'click', function () {
        color = c; erasing = false; b3tone(600, 0.06, 'sine', 0.2);
        var btns = tools.querySelectorAll('button[data-sw]');
        for (var i = 0; i < btns.length; i++) btns[i].style.borderColor = '#ffffff55';
        b.style.borderColor = '#ffd166';
      });
      b.setAttribute('data-sw', '1');
      tools.appendChild(b);
    })(colors[ci]);
  }
  var sizes = [['S', 4], ['M', 10], ['L', 22]];
  for (var si = 0; si < sizes.length; si++) {
    (function (nm, sz) {
      var b = document.createElement('button');
      b.className = 'b3-btn'; b.style.padding = '6px 10px'; b.textContent = nm;
      T.on(b, 'click', function () { size = sz; b3tone(600, 0.06, 'sine', 0.2); });
      tools.appendChild(b);
    })(sizes[si][0], sizes[si][1]);
  }
  function tbtn(label, fn) {
    var b = document.createElement('button');
    b.className = 'b3-btn'; b.style.padding = '6px 10px'; b.textContent = label;
    T.on(b, 'click', fn); tools.appendChild(b); return b;
  }
  var erBtn = tbtn('🧽 Eraser', function () { erasing = !erasing; erBtn.style.background = erasing ? '#2ec4b6' : '#ff9f1c'; });
  tbtn('↩ Undo', undo);
  tbtn('🗑 Clear', function () { pushUndo(); ctx.clearRect(0, 0, cv.width, cv.height); b3tone(300, 0.1, 'sine', 0.2); });
  tbtn('💾 Save', function () {
    var a = document.createElement('a');
    a.download = 'my-painting.png'; a.href = cv.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
    b3tone(880, 0.15, 'triangle', 0.35);
  });

  var cv = document.createElement('canvas');
  cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:crosshair;background:#fff';
  stage.appendChild(cv);
  var ctx = cv.getContext('2d');

  function fit() {
    var dpr = window.devicePixelRatio || 1;
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    var tmp = document.createElement('canvas');
    tmp.width = cv.width; tmp.height = cv.height;
    if (cv.width) tmp.getContext('2d').drawImage(cv, 0, 0);
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (tmp.width) ctx.drawImage(tmp, 0, 0, tmp.width / dpr, tmp.height / dpr);
  }
  function pushUndo() {
    try {
      undoStack.push(cv.toDataURL());
      if (undoStack.length > 12) undoStack.shift();
    } catch (e) {}
  }
  function undo() {
    var u = undoStack.pop(); if (!u) return;
    var img = new Image();
    img.onload = function () {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0);
      var dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.restore(); b3tone(500, 0.08, 'sine', 0.2);
    };
    img.src = u;
  }
  var drawing = false, lx = 0, ly = 0;
  function pos(e) {
    var r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  T.on(cv, 'pointerdown', function (e) {
    e.preventDefault(); pushUndo();
    drawing = true; var p = pos(e); lx = p.x; ly = p.y;
    ctx.beginPath(); ctx.arc(lx, ly, (erasing ? size * 1.6 : size) / 2, 0, 7);
    ctx.fillStyle = erasing ? '#fff' : color;
    if (erasing) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore(); }
    else ctx.fill();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  T.on(cv, 'pointermove', function (e) {
    if (!drawing) return;
    var p = pos(e);
    ctx.save();
    if (erasing) ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = erasing ? '#fff' : color;
    ctx.lineWidth = erasing ? size * 1.6 : size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.restore();
    lx = p.x; ly = p.y;
  });
  function stopDraw() {
    if (drawing) { drawing = false; strokes++; scoreEl.textContent = '🖌️ Strokes: ' + strokes; }
  }
  T.on(cv, 'pointerup', stopDraw);
  T.on(cv, 'pointercancel', stopDraw);
  T.on(cv, 'pointerleave', stopDraw);
  T.on(window, 'resize', fit);
  scoreEl.textContent = '🖌️ Strokes: 0';
  T.after(fit, 30);
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 7. Dress-up ---------- */
function loadDressup(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var head = b3head('👗 Dress Up', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadDressup(container); };

  var cats = {
    Hats: [['🎩', 12], ['🧢', 8], ['👑', 20], ['🎓', 10], ['🤠', 14], ['⛑️', 9]],
    Tops: [['👕', 6], ['👔', 12], ['🥋', 14], ['🦺', 10], ['🧥', 11], ['👗', 13]],
    Extras: [['🕶️', 10], ['🧣', 8], ['🎒', 7], ['💼', 9], ['🌂', 6], ['🎀', 8]]
  };
  var faces = ['😊', '😎', '🤩', '🥳', '🤓', '😜'];
  var sel = { hat: null, top: null, extra: null }, face = '😊', curCat = 'Hats';
  var cheered = false;

  function stylePts() {
    var s = 5;
    ['hat', 'top', 'extra'].forEach(function (k) { if (sel[k]) s += sel[k][1]; });
    return s;
  }
  function titleFor(p) {
    return p >= 60 ? '🌟 SUPERSTAR!' : p >= 40 ? '😎 Stylish!' : p >= 25 ? '😊 Cool' : '🙂 Casual';
  }
  var top = document.createElement('div'); top.className = 'b3-row'; stage.appendChild(top);
  var kidBtns = [];
  [['👦', 'Boy'], ['👧', 'Girl']].forEach(function (kb) {
    var b = document.createElement('button'); b.className = 'b3-btn'; b.textContent = kb[0] + ' ' + kb[1];
    T.on(b, 'click', function () { face = kb[0] === '👦' ? '😊' : '😊'; render(); b3tone(600, 0.1, 'sine', 0.25); });
    top.appendChild(b); kidBtns.push(b);
  });
  var randB = document.createElement('button'); randB.className = 'b3-btn'; randB.textContent = '🎲 Surprise Me';
  T.on(randB, 'click', function () {
    sel.hat = cats.Hats[Math.floor(Math.random() * cats.Hats.length)];
    sel.top = cats.Tops[Math.floor(Math.random() * cats.Tops.length)];
    sel.extra = cats.Extras[Math.floor(Math.random() * cats.Extras.length)];
    face = faces[Math.floor(Math.random() * faces.length)];
    render(); b3tone(784, 0.15, 'triangle', 0.35);
  });
  top.appendChild(randB);

  var doll = document.createElement('div');
  doll.style.cssText = 'position:relative;text-align:center;padding:10px;min-height:250px';
  stage.appendChild(doll);

  var tabs = document.createElement('div'); tabs.className = 'b3-row'; stage.appendChild(tabs);
  var items = document.createElement('div'); items.className = 'b3-row'; stage.appendChild(items);
  var meter = document.createElement('div');
  meter.style.cssText = 'padding:4px 16px 14px';
  meter.innerHTML = '<div class="b3-bar"><i style="width:0%"></i></div><div style="text-align:center;font-size:13px;color:#9fb3d9;margin-top:4px">Reach 60 style points to become a 🌟 SUPERSTAR!</div>';
  stage.appendChild(meter);

  function render() {
    var hat = sel.hat ? sel.hat[0] : '', tp = sel.top ? sel.top[0] : '', ex = sel.extra ? sel.extra[0] : '';
    doll.innerHTML =
      '<div style="font-size:60px;line-height:1">' + hat + '</div>' +
      '<div style="position:relative;display:inline-block">' +
      '<div style="font-size:110px;line-height:1;margin-top:-14px">' + face + '</div>' +
      (ex ? '<div style="position:absolute;right:-58px;top:34px;font-size:52px">' + ex + '</div>' : '') +
      '</div>' +
      '<div style="font-size:64px;line-height:1;margin-top:-10px">' + tp + '</div>';
    var p = stylePts();
    scoreEl.textContent = '✨ ' + p + ' pts — ' + titleFor(p);
    meter.querySelector('.b3-bar>i').style.width = Math.min(100, Math.round(p / 60 * 100)) + '%';
    if (p >= 60 && !cheered) {
      cheered = true;
      var n = [523, 659, 784, 1047];
      for (var i = 0; i < 4; i++) (function (k) { T.after(function () { b3tone(n[k], 0.22, 'triangle', 0.4); }, k * 140); })(i);
    }
    if (p < 60) cheered = false;
    items.innerHTML = '';
    var list = curCat === 'Faces' ? faces.map(function (f) { return [f, 5]; }) : cats[curCat];
    var key = curCat === 'Hats' ? 'hat' : curCat === 'Tops' ? 'top' : curCat === 'Extras' ? 'extra' : 'face';
    for (var i = 0; i < list.length; i++) {
      (function (it) {
        var b = document.createElement('button');
        b.className = 'b3-pad';
        var active = key === 'face' ? face === it[0] : sel[key] && sel[key][0] === it[0];
        b.style.borderColor = active ? '#ffd166' : '#ffffff33';
        b.innerHTML = '<span class="em">' + it[0] + '</span><span style="font-size:11px">+' + it[1] + '</span>';
        T.on(b, 'click', function () {
          if (key === 'face') face = it[0];
          else sel[key] = (sel[key] && sel[key][0] === it[0]) ? null : it;
          render(); b3tone(700, 0.08, 'sine', 0.25);
        });
        items.appendChild(b);
      })(list[i]);
    }
  }
  ['Hats', 'Tops', 'Extras', 'Faces'].forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'b3-btn'; b.textContent = c;
    T.on(b, 'click', function () { curCat = c; render(); });
    tabs.appendChild(b);
  });
  render();
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}

/* ---------- 8. Cooking: pizza maker ---------- */
function loadCooking(container) {
  b3css(); container.innerHTML = '';
  var T = b3Track();
  var head = b3head('🍕 Pizza Maker', '');
  container.appendChild(head); container.classList.add('b3-game');
  var scoreEl = head.querySelector('.b3-score');
  var stage = document.createElement('div'); stage.className = 'b3-stage'; container.appendChild(stage);
  head.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadCooking(container); };

  var steps = [
    ['🍅', 'Tomato Sauce'], ['🧀', 'Cheese'], ['🍄', 'Mushroom'],
    ['🫑', 'Peppers'], ['🧅', 'Onions'], ['🫒', 'Olives']
  ];
  var idx = 0, score = 0, time = 60, playing = true;
  var order = b3shuffle(steps.slice());

  var timerWrap = document.createElement('div');
  timerWrap.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 14px';
  timerWrap.innerHTML = '<span>⏱️</span><div class="b3-bar"><i style="width:100%"></i></div><span id="b3tsec" style="font-weight:800">60s</span>';
  stage.appendChild(timerWrap);
  var tbar = timerWrap.querySelector('.b3-bar>i'), tsec = timerWrap.querySelector('#b3tsec');

  var mid = document.createElement('div');
  mid.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:flex-start;flex-wrap:wrap;padding:6px';
  stage.appendChild(mid);

  var pizza = document.createElement('div');
  pizza.style.cssText = 'position:relative;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,#f7d98b 55%,#e0a94e 78%,#c98a35 100%);border:10px solid #d99a3d;flex:none';
  mid.appendChild(pizza);

  var list = document.createElement('div');
  list.style.cssText = 'font-size:15px;line-height:2;min-width:170px';
  mid.appendChild(list);

  var tray = document.createElement('div'); tray.className = 'b3-row'; stage.appendChild(tray);
  var msg = document.createElement('div'); msg.className = 'b3-msg'; msg.style.top = 'auto'; msg.style.bottom = '12px'; stage.appendChild(msg);
  var ov = document.createElement('div'); ov.className = 'b3-overlay'; ov.style.display = 'none'; stage.appendChild(ov);

  function upd() {
    scoreEl.textContent = '⭐ ' + score + '   📋 Step ' + Math.min(idx + 1, 6) + '/6';
    tbar.style.width = (time / 60 * 100) + '%';
    tbar.style.background = time < 15 ? '#e63946' : '#2ec4b6';
    tsec.textContent = time + 's';
  }
  function drawList() {
    var h = '<b>Recipe — tap in order:</b><br>';
    for (var i = 0; i < steps.length; i++) {
      h += (i < idx ? '✅' : i === idx ? '👉' : '⬜') + ' ' + steps[i][0] + ' ' + steps[i][1] + '<br>';
    }
    list.innerHTML = h;
  }
  function pick(icon, name, btn) {
    if (!playing) return;
    if (icon === steps[idx][0]) {
      var s = document.createElement('span');
      var a = (idx * 2.4) % 6.28, rr = 34 + (idx * 37) % 52;
      s.style.cssText = 'position:absolute;font-size:34px;left:' + (110 + Math.cos(a) * rr - 17) + 'px;top:' + (110 + Math.sin(a) * rr - 17) + 'px;pointer-events:none';
      s.textContent = icon;
      pizza.appendChild(s);
      idx++; score += 10;
      b3tone(660 + idx * 60, 0.15, 'triangle', 0.4);
      btn.style.borderColor = '#2ec4b6'; btn.style.opacity = '0.45'; btn.disabled = true;
      drawList(); upd();
      if (idx >= steps.length) bake();
    } else {
      score = Math.max(0, score - 3);
      b3tone(140, 0.2, 'sawtooth', 0.3);
      btn.classList.remove('b3-shake');
      void btn.offsetWidth;
      btn.classList.add('b3-shake');
      msg.textContent = '❌ Wrong order! Next: ' + steps[idx][0] + ' ' + steps[idx][1];
      T.after(function () { if (playing) msg.textContent = ''; }, 1200);
      upd();
    }
  }
  function bake() {
    playing = false;
    msg.textContent = '🔥 Baking...';
    b3tone(392, 0.4, 'sine', 0.35);
    T.after(function () { finish(true); }, 1600);
  }
  function finish(won) {
    playing = false;
    var bonus = won ? time : 0, total = score + bonus;
    ov.style.display = 'flex';
    ov.innerHTML = won
      ? '<h2>🍕 Pizza Ready!</h2><p>Recipe score: ⭐ ' + score + '<br>⏱️ Time bonus: +' + bonus + '<br><b>Total: ⭐ ' + total + '</b><br>Yummy! 😋</p><button class="b3-btn" style="font-size:18px;padding:12px 26px">↺ Cook Again</button>'
      : '<h2>⏰ Time\'s Up!</h2><p>You finished ' + idx + '/6 steps.<br>Score: ⭐ ' + score + '</p><button class="b3-btn" style="font-size:18px;padding:12px 26px">↺ Try Again</button>';
    ov.querySelector('.b3-btn').onclick = function () { T.cleanup(); container.classList.remove('b3-game'); loadCooking(container); };
    if (won) {
      var n = [523, 659, 784, 1047];
      for (var i = 0; i < 4; i++) (function (k) { T.after(function () { b3tone(n[k], 0.22, 'triangle', 0.4); }, k * 140); })(i);
    }
  }
  for (var i = 0; i < order.length; i++) {
    (function (icon, name) {
      var b = document.createElement('button');
      b.className = 'b3-pad';
      b.innerHTML = '<span class="em">' + icon + '</span>' + name;
      T.on(b, 'click', function () { pick(icon, name, b); });
      tray.appendChild(b);
    })(order[i][0], order[i][1]);
  }
  T.every(function () {
    if (!playing) return;
    time--;
    if (time <= 0) { time = 0; upd(); finish(false); return; }
    if (time === 10) b3tone(440, 0.2, 'square', 0.3);
    upd();
  }, 1000);
  drawList(); upd();
  container._cleanup = function () { T.cleanup(); container.classList.remove('b3-game'); };
}
