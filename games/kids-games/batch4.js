/* Waqas Game Hub — Kids Hub batch 4: 8 original playable mini-games.
   Plain script, no modules, no network. Each game: function loadX(container).
   Every game sets container._cleanup() which closeGame() calls. */
'use strict';

function __gameKit(container) {
  const kit = {
    rafs: [], intervals: [], timeouts: [], listeners: [],
    loop(step) {
      let id = 0, dead = false;
      const tick = (t) => { if (dead) return; step(t); id = requestAnimationFrame(tick); };
      id = requestAnimationFrame(tick);
      this.rafs.push({ cancel() { dead = true; cancelAnimationFrame(id); } });
    },
    on(t, e, f, o) { t.addEventListener(e, f, o); this.listeners.push([t, e, f, o]); },
    every(ms, f) { const id = setInterval(f, ms); this.intervals.push(id); return id; },
    later(ms, f) { const id = setTimeout(f, ms); this.timeouts.push(id); return id; },
    fitCanvas(cv) {
      const r = () => { cv.width = Math.max(280, container.clientWidth); cv.height = Math.max(320, container.clientHeight - 46); };
      r(); this.on(window, 'resize', r);
    },
    hud(title, reload) {
      container.innerHTML =
        '<div class="kg-hud" style="display:flex;align-items:center;justify-content:space-between;' +
        'padding:6px 10px;height:46px;box-sizing:border-box;background:#1b2a4a;color:#fff;' +
        'font-family:system-ui,sans-serif;border-radius:10px 10px 0 0;">' +
        '<b style="font-size:15px">' + title + '</b>' +
        '<span class="kg-score" style="font-size:15px;font-weight:700;color:#ffd166"></span>' +
        '<button class="kg-restart" style="background:#ffd166;border:none;border-radius:8px;' +
        'padding:6px 12px;font-weight:700;cursor:pointer">⟳ Restart</button></div>' +
        '<div class="kg-stage" style="position:relative;width:100%;height:calc(100% - 46px)"></div>';
      const stage = container.querySelector('.kg-stage');
      container.querySelector('.kg-restart').addEventListener('click', () => { container._cleanup(); if (reload) reload(container); });
      return stage;
    },
    overlay(stage, html) {
      let ov = stage.querySelector('.kg-ov');
      if (!ov) {
        ov = document.createElement('div');
        ov.className = 'kg-ov';
        ov.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
          'justify-content:center;background:rgba(10,15,30,.82);color:#fff;z-index:5;text-align:center;' +
          'font-family:system-ui,sans-serif;padding:20px;box-sizing:border-box;border-radius:0 0 10px 10px;';
        stage.appendChild(ov);
      }
      ov.innerHTML = html; ov.style.display = 'flex';
      const b = ov.querySelector('.kg-again');
      if (b) b.addEventListener('click', () => { container._cleanup(); });
      return ov;
    },
    hideOverlay(stage) { const ov = stage.querySelector('.kg-ov'); if (ov) ov.style.display = 'none'; }
  };
  container._cleanup = () => {
    kit.rafs.forEach(r => { try { r.cancel(); } catch (e) {} });
    kit.intervals.forEach(clearInterval);
    kit.timeouts.forEach(clearTimeout);
    kit.listeners.forEach(a => { try { a[0].removeEventListener(a[1], a[2], a[3]); } catch (e) {} });
  };
  return kit;
}
function __btnStyle() {
  return 'background:#2f6fed;color:#fff;border:none;border-radius:10px;padding:10px 26px;' +
    'font-size:17px;font-weight:700;cursor:pointer;margin-top:12px;';
}

/* ============ 1. loadBlocks — block-builder tower stack ============ */
function loadBlocks(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('🧱 Block Builder', loadBlocks);
  const scoreEl = container.querySelector('.kg-score');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;border-radius:0 0 10px 10px;background:#0e1a33;';
  stage.appendChild(cv);
  kit.fitCanvas(cv);
  const ctx = cv.getContext('2d');
  const BH = 26, COLORS = ['#ff6b6b', '#ffd166', '#6df7ea', '#a78bfa', '#7cf29c', '#ff9f6b'];
  let tower, crane, score, over, winMsg, debris, started, shake, viewY, combo;
  function reset() {
    const W = cv.width, H = cv.height;
    tower = [{ x: W / 2, w: Math.min(220, W * 0.5) }];
    crane = { x: 60, dir: 1, speed: 3.2, w: tower[0].w, y: 0 };
    score = 0; over = false; winMsg = ''; debris = []; started = false; shake = 0; viewY = 0; combo = 0;
    scoreEl.textContent = 'Score: 0';
    kit.hideOverlay(stage);
  }
  function drop() {
    if (over) return;
    if (!started) { started = true; }
    const prev = tower[tower.length - 1];
    const bw = crane.w, cx = crane.x;
    const l = Math.max(cx - bw / 2, prev.x - prev.w / 2);
    const r = Math.min(cx + bw / 2, prev.x + prev.w / 2);
    if (r - l < 6) { // total miss
      debris.push({ x: cx, w: bw, y: craneY(), vy: 2, rot: 0, vr: (Math.random() - .5) * .2 });
      over = true; winMsg = 'Missed! The block fell.';
      kit.later(900, () => gameOver());
      return;
    }
    const perfect = (r - l) >= bw * 0.9;
    combo = perfect ? combo + 1 : 0;
    const block = { x: (l + r) / 2, w: r - l, perfect };
    tower.push(block);
    score += perfect ? 2 + Math.min(combo, 5) : 1;
    scoreEl.textContent = 'Score: ' + score;
    // falling offcut debris
    if (cx - bw / 2 < l) debris.push({ x: (cx - bw / 2 + l) / 2, w: l - (cx - bw / 2), y: craneY(), vy: 2, rot: 0, vr: .15 });
    if (cx + bw / 2 > r) debris.push({ x: (r + cx + bw / 2) / 2, w: (cx + bw / 2) - r, y: craneY(), vy: 2, rot: 0, vr: -.15 });
    // topple check: top too far from base
    if (Math.abs(block.x - tower[0].x) > 130) {
      over = true; winMsg = 'The tower toppled!';
      kit.later(900, () => gameOver());
      return;
    }
    crane.w = block.w;
    crane.x = crane.dir > 0 ? cv.width - crane.w / 2 : crane.w / 2;
    crane.dir *= -1;
    crane.speed = Math.min(9, crane.speed + 0.25);
    if (score >= 40) { over = true; winMsg = 'Amazing! 40-block tower! 🏆'; kit.later(600, () => gameOver(true)); }
  }
  function craneY() { return viewY + 70; }
  function gameOver(won) {
    kit.overlay(stage,
      '<h2 style="margin:0 0 8px">' + (won ? '🏆 You Win!' : '💥 Game Over') + '</h2>' +
      '<div style="font-size:18px">' + winMsg + '</div>' +
      '<div style="font-size:22px;margin-top:8px">Final score: <b style="color:#ffd166">' + score + '</b></div>' +
      '<button class="kg-again" style="' + __btnStyle() + '">Play Again</button>');
    const b = stage.querySelector('.kg-again');
    b.addEventListener('click', () => loadBlocks(container));
  }
  const keyH = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowDown') { e.preventDefault(); drop(); }
  };
  kit.on(document, 'keydown', keyH);
  kit.on(cv, 'pointerdown', (e) => { e.preventDefault(); drop(); });
  function draw() {
    const W = cv.width, H = cv.height;
    // camera: keep top of tower around 35% of screen height
    const topY = H - 60 - tower.length * BH;
    const target = Math.max(0, H * 0.35 - topY);
    viewY += (target - viewY) * 0.08;
    ctx.save();
    if (shake > 0) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= 0.9; }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0e1a33'); g.addColorStop(1, '#243b6b');
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    // stars
    ctx.fillStyle = '#ffffff88';
    for (let i = 0; i < 30; i++) ctx.fillRect((i * 97) % W, (i * 53) % (H * .5), 2, 2);
    const gy = H - 40 + viewY;
    ctx.fillStyle = '#3a2d20'; ctx.fillRect(0, gy, W, H - gy + 40);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(0, gy, W, 8);
    // tower
    for (let i = 0; i < tower.length; i++) {
      const b = tower[i], y = H - 60 - (i + 1) * BH + viewY;
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillRect(b.x - b.w / 2, y, b.w, BH - 2);
      ctx.fillStyle = '#00000033'; ctx.fillRect(b.x - b.w / 2, y + BH - 6, b.w, 4);
      if (b.perfect && i > 0) { ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PERFECT', b.x, y + 17); }
    }
    // debris
    debris = debris.filter(d => d.y < H + 60);
    debris.forEach(d => {
      d.y += d.vy; d.vy += 0.35; d.rot += d.vr;
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot);
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(-d.w / 2, 0, d.w, BH - 2);
      ctx.restore();
    });
    // crane
    if (!over) {
      const cy = craneY();
      ctx.strokeStyle = '#9db4d8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(crane.x, 0); ctx.lineTo(crane.x, cy); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(crane.x - crane.w / 2, cy, crane.w, BH - 2);
      ctx.fillStyle = '#1b2a4a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▼ TAP TO DROP ▼', W / 2, 34);
    }
    ctx.restore();
    if (!started && !over) {
      ctx.fillStyle = '#ffffffdd'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Tap or press SPACE to drop blocks', W / 2, H / 2);
    }
  }
  function step() {
    if (!over && started) {
      crane.x += crane.dir * crane.speed;
      if (crane.x - crane.w / 2 < 0) { crane.x = crane.w / 2; crane.dir = 1; }
      if (crane.x + crane.w / 2 > cv.width) { crane.x = cv.width - crane.w / 2; crane.dir = -1; }
    }
    draw();
  }
  reset();
  kit.on(window, 'resize', () => { crane.x = Math.min(Math.max(crane.x, crane.w / 2), cv.width - crane.w / 2); });
  kit.loop(step);
}

/* ============ 2. loadJump — "Waqas Jump" platformer ============ */
function loadJump(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('🦘 Waqas Jump', loadJump);
  const scoreEl = container.querySelector('.kg-score');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;background:#87ceeb;';
  stage.appendChild(cv);
  // touch buttons
  const tb = document.createElement('div');
  tb.style.cssText = 'position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:space-between;padding:0 12px;z-index:4;pointer-events:none;';
  tb.innerHTML =
    '<div style="display:flex;gap:10px;pointer-events:auto">' +
    '<button data-k="left" style="' + __btnStyle() + 'margin:0;padding:12px 18px;opacity:.85">◀</button>' +
    '<button data-k="right" style="' + __btnStyle() + 'margin:0;padding:12px 18px;opacity:.85">▶</button></div>' +
    '<button data-k="jump" style="' + __btnStyle() + 'margin:0;padding:12px 22px;opacity:.85;pointer-events:auto">⤒</button>';
  stage.appendChild(tb);
  kit.fitCanvas(cv);
  const ctx = cv.getContext('2d');
  const GRAV = 0.6, MOVE = 4.6, JUMPV = -13.5;
  const LEVELS = [
    { plats: [[0, 540, 480, 60], [540, 540, 460, 60], [1060, 540, 560, 60], [1680, 540, 520, 60],
              [330, 430, 150, 22], [830, 400, 150, 22], [1350, 420, 150, 22]],
      coins: [[380, 390], [880, 360], [1400, 380], [700, 500], [1300, 500], [1900, 500]],
      spikes: [], flagX: 2080, spawn: [60, 440] },
    { plats: [[0, 540, 400, 60], [470, 540, 380, 60], [920, 500, 300, 60], [1290, 540, 380, 60],
              [1740, 540, 480, 60], [620, 410, 140, 22], [1100, 380, 140, 22]],
      coins: [[500, 460], [1050, 450], [1500, 500], [1950, 500], [670, 370], [1150, 340]],
      spikes: [[700, 516, 60], [1500, 516, 60]], flagX: 2120, spawn: [60, 440] },
    { plats: [[0, 540, 340, 60], [410, 500, 260, 60], [740, 460, 240, 60], [1050, 500, 260, 60],
              [1380, 540, 340, 60], [1790, 500, 260, 60], [2120, 540, 420, 60],
              [500, 380, 130, 22], [1250, 380, 130, 22], [1900, 380, 130, 22]],
      coins: [[520, 450], [830, 410], [1140, 450], [1530, 500], [1900, 450], [2250, 500], [550, 340], [1950, 340]],
      spikes: [[180, 516, 60], [900, 436, 60], [1560, 516, 60], [2200, 516, 60]], flagX: 2460, spawn: [60, 440] }
  ];
  let li, plats, coins, spikes, flagX, px, py, vx, vy, onGround, lives, coinsGot, keys, camX, dead, wonAll, face;
  function reset(level) {
    li = level;
    const L = LEVELS[li];
    plats = L.plats.map(p => ({ x: p[0], y: p[1], w: p[2], h: p[3] }));
    coins = L.coins.map(c => ({ x: c[0], y: c[1], got: false }));
    spikes = L.spikes.map(s => ({ x: s[0], y: s[1], w: s[2] }));
    flagX = L.flagX;
    px = L.spawn[0]; py = L.spawn[1]; vx = 0; vy = 0; onGround = false;
    if (level === 0) { lives = 3; coinsGot = 0; }
    keys = {}; camX = 0; dead = false; wonAll = false; face = 1;
    scoreEl.textContent = 'Lv ' + (li + 1) + '/3 · ❤' + lives + ' · 🪙' + coinsGot;
    kit.hideOverlay(stage);
  }
  function hurt() {
    lives--;
    scoreEl.textContent = 'Lv ' + (li + 1) + '/3 · ❤' + lives + ' · 🪙' + coinsGot;
    if (lives <= 0) {
      dead = true;
      kit.overlay(stage, '<h2 style="margin:0 0 8px">💥 Game Over</h2>' +
        '<div>You collected ' + coinsGot + ' coins.</div>' +
        '<button class="kg-again" style="' + __btnStyle() + '">Try Again</button>');
      stage.querySelector('.kg-again').addEventListener('click', () => loadJump(container));
    } else {
      const L = LEVELS[li];
      px = L.spawn[0]; py = L.spawn[1]; vx = 0; vy = 0;
    }
  }
  function levelDone() {
    if (li < 2) {
      const bonus = lives * 20;
      kit.overlay(stage, '<h2 style="margin:0 0 8px">🎉 Level ' + (li + 1) + ' Complete!</h2>' +
        '<div>Coins: ' + coinsGot + '</div>' +
        '<button class="kg-again" style="' + __btnStyle() + '">Next Level ▶</button>');
      stage.querySelector('.kg-again').addEventListener('click', () => { kit.hideOverlay(stage); reset(li + 1); });
    } else {
      wonAll = true;
      const sc = coinsGot * 10 + lives * 50;
      kit.overlay(stage, '<h2 style="margin:0 0 8px">🏆 You Win!</h2>' +
        '<div>All 3 levels cleared!</div>' +
        '<div style="font-size:22px;margin-top:8px">Score: <b style="color:#ffd166">' + sc + '</b> (' + coinsGot + ' coins)</div>' +
        '<button class="kg-again" style="' + __btnStyle() + '">Play Again</button>');
      stage.querySelector('.kg-again').addEventListener('click', () => loadJump(container));
    }
  }
  const keyH = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && onGround && !dead && !wonAll) { vy = JUMPV; onGround = false; }
  };
  const keyU = (e) => { keys[e.code] = false; };
  kit.on(document, 'keydown', keyH);
  kit.on(document, 'keyup', keyU);
  tb.querySelectorAll('button').forEach(b => {
    const k = b.dataset.k;
    const dn = (e) => {
      e.preventDefault();
      if (k === 'jump') { keys['Space'] = true; if (onGround && !dead && !wonAll) { vy = JUMPV; onGround = false; } }
      else keys[k === 'left' ? 'ArrowLeft' : 'ArrowRight'] = true;
    };
    const up = (e) => { e.preventDefault(); keys[k === 'jump' ? 'Space' : (k === 'left' ? 'ArrowLeft' : 'ArrowRight')] = false; };
    kit.on(b, 'pointerdown', dn); kit.on(b, 'pointerup', up); kit.on(b, 'pointerleave', up); kit.on(b, 'pointercancel', up);
  });
  function step() {
    const ov = stage.querySelector('.kg-ov');
    const paused = !!(ov && ov.style.display === 'flex');
    if (!dead && !wonAll && !paused) {
      const L = keys['ArrowLeft'] || keys['KeyA'], R = keys['ArrowRight'] || keys['KeyD'];
      vx = (R ? MOVE : 0) - (L ? MOVE : 0);
      if (vx !== 0) face = vx > 0 ? 1 : -1;
      vy += GRAV; if (vy > 16) vy = 16;
      px += vx;
      // horizontal collide
      plats.forEach(p => {
        if (px + 13 > p.x && px - 13 < p.x + p.w && py + 20 > p.y && py - 20 < p.y + p.h) {
          px = vx > 0 ? p.x - 13 : p.x + p.w + 13;
        }
      });
      py += vy; onGround = false;
      plats.forEach(p => {
        if (px + 13 > p.x && px - 13 < p.x + p.w && py + 20 > p.y && py - 20 < p.y + p.h) {
          if (vy > 0) { py = p.y - 20; vy = 0; onGround = true; }
          else if (vy < 0) { py = p.y + p.h + 20; vy = 0; }
        }
      });
      if (px < 13) px = 13;
      // coins
      coins.forEach(c => {
        if (!c.got && Math.abs(px - c.x) < 26 && Math.abs(py - c.y) < 30) {
          c.got = true; coinsGot++;
          scoreEl.textContent = 'Lv ' + (li + 1) + '/3 · ❤' + lives + ' · 🪙' + coinsGot;
        }
      });
      // spikes
      const hitSpike = spikes.some(s => px + 12 > s.x && px - 12 < s.x + s.w && py + 20 > s.y && py - 20 < s.y + 24);
      if (!dead && hitSpike) hurt();
      // fell
      if (!dead && py > cv.height + 200) hurt();
      // flag
      if (!dead && Math.abs(px - flagX) < 30 && onGround) levelDone();
      camX = Math.max(0, px - cv.width * 0.4);
    }
    draw();
  }
  function draw() {
    const W = cv.width, H = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#7ec8f7'); g.addColorStop(1, '#c9ecff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // clouds
    ctx.fillStyle = '#ffffffcc';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 340 - camX * 0.3) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.beginPath(); ctx.ellipse(cx, 70 + (i % 3) * 40, 46, 20, 0, 0, 7); ctx.fill();
    }
    ctx.save(); ctx.translate(-camX, 0);
    // platforms
    plats.forEach(p => {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#4caf50'; ctx.fillRect(p.x, p.y, p.w, 12);
    });
    // spikes
    spikes.forEach(s => {
      ctx.fillStyle = '#cfd6dd';
      for (let x = s.x; x < s.x + s.w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, s.y + 24); ctx.lineTo(x + 10, s.y); ctx.lineTo(x + 20, s.y + 24); ctx.fill();
      }
    });
    // coins
    const t = Date.now() / 300;
    coins.forEach(c => {
      if (c.got) return;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.ellipse(c.x, c.y, 10, 12 + Math.sin(t) * 2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#b8860b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('¢', c.x, c.y + 4);
    });
    // flag
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(flagX, 440, 8, 100);
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.moveTo(flagX + 8, 440); ctx.lineTo(flagX + 58, 455); ctx.lineTo(flagX + 8, 470); ctx.fill();
    // player (little runner)
    if (!dead) {
      ctx.fillStyle = '#2f6fed';
      ctx.fillRect(px - 13, py - 20, 26, 40);
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath(); ctx.arc(px, py - 30, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(px + (face > 0 ? 2 : -8), py - 33, 6, 6);
      // legs animation
      const lp = Math.sin(Date.now() / 90) * (Math.abs(vx) > 0.5 && onGround ? 8 : 0);
      ctx.fillStyle = '#1b2a4a';
      ctx.fillRect(px - 10, py + 20, 8, 10 + lp);
      ctx.fillRect(px + 2, py + 20, 8, 10 - lp);
    }
    ctx.restore();
    // level label
    ctx.fillStyle = '#1b2a4acc'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Level ' + (li + 1) + ' — reach the 🚩', 12, 22);
  }
  reset(0);
  kit.loop(step);
}

/* ============ 3. loadSpeed — speed dash auto-runner ============ */
function loadSpeed(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('⚡ Speed Dash', loadSpeed);
  const scoreEl = container.querySelector('.kg-score');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;background:#101a33;';
  stage.appendChild(cv);
  const tb = document.createElement('div');
  tb.style.cssText = 'position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:space-between;padding:0 14px;z-index:4;';
  tb.innerHTML =
    '<button data-k="jump" style="' + __btnStyle() + 'margin:0;opacity:.9">⤒ JUMP</button>' +
    '<button data-k="duck" style="' + __btnStyle() + 'margin:0;opacity:.9">⤓ DUCK</button>';
  stage.appendChild(tb);
  kit.fitCanvas(cv);
  const ctx = cv.getContext('2d');
  let px, py, vy, duck, obs, speed, dist, over, started, t, parts, best;
  const GRAV = 0.9, JUMPV = -16;
  function reset() {
    const H = cv.height;
    px = 130; py = H - 90; vy = 0; duck = false;
    obs = []; speed = 6; dist = 0; over = false; started = false; t = 0; parts = [];
    best = best || 0;
    scoreEl.textContent = '0 m';
    kit.hideOverlay(stage);
  }
  function groundY() { return cv.height - 60; }
  function spawn() {
    const type = Math.random() < 0.55 ? 'low' : 'high';
    if (type === 'low') obs.push({ x: cv.width + 40, type, w: 34 + Math.random() * 30, h: 46 + Math.random() * 26 });
    else obs.push({ x: cv.width + 40, type, w: 60 + Math.random() * 40, h: 34, yOff: 96 + Math.random() * 30 });
  }
  function gameOver() {
    over = true;
    const m = Math.floor(dist);
    if (m > best) best = m;
    kit.overlay(stage, '<h2 style="margin:0 0 8px">💥 Wipeout!</h2>' +
      '<div style="font-size:22px">Distance: <b style="color:#ffd166">' + m + ' m</b></div>' +
      '<div style="margin-top:4px">Best: ' + best + ' m</div>' +
      '<button class="kg-again" style="' + __btnStyle() + '">Run Again</button>');
    stage.querySelector('.kg-again').addEventListener('click', () => loadSpeed(container));
  }
  function doJump() { if (!over) { started = true; if (py >= groundY() - 1) vy = JUMPV; } }
  const keyH = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
    if (e.code === 'ArrowDown') { e.preventDefault(); duck = true; started = true; }
  };
  const keyU = (e) => { if (e.code === 'ArrowDown') duck = false; };
  kit.on(document, 'keydown', keyH);
  kit.on(document, 'keyup', keyU);
  tb.querySelectorAll('button').forEach(b => {
    const k = b.dataset.k;
    kit.on(b, 'pointerdown', (e) => { e.preventDefault(); if (k === 'jump') doJump(); else { duck = true; started = true; } });
    const up = (e) => { e.preventDefault(); if (k === 'duck') duck = false; };
    kit.on(b, 'pointerup', up); kit.on(b, 'pointerleave', up); kit.on(b, 'pointercancel', up);
  });
  kit.on(cv, 'pointerdown', (e) => { e.preventDefault(); doJump(); });
  function step() {
    const W = cv.width, H = cv.height, gy = groundY();
    if (!over && started) {
      t++;
      speed = Math.min(15, 6 + dist / 900);
      dist += speed / 10;
      vy += GRAV; py += vy;
      if (py > gy) { py = gy; vy = 0; }
      if (t % Math.max(28, 70 - Math.floor(speed * 2.5)) === 0) spawn();
      const ph = duck ? 26 : 52, pw = 34;
      const pTop = py - ph;
      obs.forEach(o => {
        o.x -= speed;
        let oy, oh;
        if (o.type === 'low') { oy = gy - o.h; oh = o.h; }
        else { oy = gy - o.yOff; oh = o.h; }
        if (px + pw / 2 > o.x && px - pw / 2 < o.x + o.w && pTop < oy + oh && pTop + ph > oy) gameOver();
      });
      obs = obs.filter(o => o.x > -120);
      if (Math.floor(dist) % 5 === 0) scoreEl.textContent = Math.floor(dist) + ' m';
      // dust particles
      if (py >= gy && t % 4 === 0) parts.push({ x: px - 20, y: gy, vx: -2 - Math.random() * 2, vy: -Math.random() * 2, life: 20 });
    }
    parts = parts.filter(p => p.life-- > 0);
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; });
    draw();
  }
  function draw() {
    const W = cv.width, H = cv.height, gy = groundY();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1030'); g.addColorStop(1, '#2b3f7a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // stars + moon
    ctx.fillStyle = '#ffffff99';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 173 - dist * 2) % (W + 20), (i * 97) % (H * 0.5), 2, 2);
    ctx.fillStyle = '#fdf6d8'; ctx.beginPath(); ctx.arc(W - 80, 70, 30, 0, 7); ctx.fill();
    // hills parallax
    ctx.fillStyle = '#1c2b52';
    for (let i = 0; i < 5; i++) {
      const hx = ((i * 420 - dist * 8) % (W + 400) + W + 400) % (W + 400) - 200;
      ctx.beginPath(); ctx.arc(hx, gy + 40, 180, Math.PI, 0); ctx.fill();
    }
    // ground
    ctx.fillStyle = '#31437a'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#ffd166';
    for (let x = -((dist * 30) % 60); x < W; x += 60) ctx.fillRect(x, gy + 18, 30, 5);
    // obstacles
    obs.forEach(o => {
      if (o.type === 'low') {
        ctx.fillStyle = '#ff5d5d';
        ctx.fillRect(o.x, gy - o.h, o.w, o.h);
        ctx.fillStyle = '#ffd166';
        for (let y = gy - o.h + 6; y < gy - 6; y += 14) ctx.fillRect(o.x + 4, y, o.w - 8, 5);
      } else {
        const oy = gy - o.yOff;
        ctx.fillStyle = '#7a5cff';
        ctx.fillRect(o.x, oy, o.w, o.h);
        ctx.fillStyle = '#4a37b8'; ctx.fillRect(o.x, oy, 8, o.h);
        ctx.fillStyle = '#ffd166'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('▼ DUCK ▼', o.x + o.w / 2, oy - 8);
      }
    });
    // player
    const ph = duck ? 26 : 52, pw = 34, pTop = py - ph;
    parts.forEach(p => { ctx.fillStyle = '#ffffff55'; ctx.fillRect(p.x, p.y, 4, 4); });
    ctx.fillStyle = '#2f9dfe';
    const lean = duck ? 0 : Math.min(0.25, speed / 60);
    ctx.save(); ctx.translate(px, py); ctx.rotate(lean);
    ctx.fillRect(-pw / 2, -ph, pw, ph);
    ctx.fillStyle = '#ffdbac'; ctx.fillRect(-pw / 2 + 6, -ph - 16, 22, 16);
    ctx.fillStyle = '#222'; ctx.fillRect(pw / 2 - 8, -ph - 12, 6, 6);
    // scarf
    ctx.fillStyle = '#e63946';
    const wv = Math.sin(Date.now() / 80) * 8;
    ctx.beginPath(); ctx.moveTo(-pw / 2, -ph + 8); ctx.lineTo(-pw / 2 - 26 - wv, -ph + 2); ctx.lineTo(-pw / 2, -ph + 16); ctx.fill();
    ctx.restore();
    if (!started && !over) {
      ctx.fillStyle = '#ffffffdd'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Tap / SPACE to start — jump the red, duck the purple!', W / 2, H / 2 - 40);
    }
    ctx.fillStyle = '#ffffffaa'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('Speed ' + speed.toFixed(1), W - 12, 22);
  }
  reset();
  kit.loop(step);
}

/* ============ 4. loadTemple — temple dash endless runner ============ */
function loadTemple(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('🏛️ Temple Dash', loadTemple);
  const scoreEl = container.querySelector('.kg-score');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;background:#241a10;';
  stage.appendChild(cv);
  kit.fitCanvas(cv);
  const ctx = cv.getContext('2d');
  let lane, jumpV, jumpY, slide, obs, gems, dist, hearts, speed, over, started, invuln, boulder, t, scroll;
  const LANES = [-1, 0, 1];
  function reset() {
    lane = 0; jumpV = 0; jumpY = 0; slide = 0;
    obs = []; gems = []; dist = 0; hearts = 3; speed = 7; over = false; started = false;
    invuln = 0; boulder = 0; t = 0; scroll = 0;
    scoreEl.textContent = '❤❤❤ · 0';
    kit.hideOverlay(stage);
  }
  function laneX(l, depth) { // depth 0=near, 1=far
    const cx = cv.width / 2;
    return cx + l * (cv.width * 0.28) * (1 - depth * 0.72);
  }
  function spawn() {
    const l = LANES[Math.floor(Math.random() * 3)];
    const r = Math.random();
    const type = r < 0.35 ? 'block' : (r < 0.65 ? 'barrier' : 'low');
    obs.push({ lane: l, type, d: 1 }); // d: 1 far → 0 near
    if (Math.random() < 0.5) gems.push({ lane: LANES[Math.floor(Math.random() * 3)], d: 1, got: false });
  }
  function gameOver() {
    over = true;
    kit.overlay(stage, '<h2 style="margin:0 0 8px">🪨 The boulder got you!</h2>' +
      '<div style="font-size:22px">Score: <b style="color:#ffd166">' + Math.floor(dist) + '</b> · 💎 ' + gemCount + '</div>' +
      '<button class="kg-again" style="' + __btnStyle() + '">Dash Again</button>');
    stage.querySelector('.kg-again').addEventListener('click', () => loadTemple(container));
  }
  let gemCount = 0;
  function moveLane(d) { if (!over) { started = true; lane = Math.max(-1, Math.min(1, lane + d)); } }
  function doJump() { if (!over && jumpY === 0) { started = true; jumpV = 0.16; } }
  function doSlide() { if (!over) { started = true; slide = 26; } }
  const keyH = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); moveLane(-1); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveLane(1); }
    else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { e.preventDefault(); doJump(); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); doSlide(); }
  };
  kit.on(document, 'keydown', keyH);
  // swipe controls
  let sx = 0, sy = 0;
  kit.on(cv, 'pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  kit.on(cv, 'pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) { doJump(); return; }
    if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
    else if (dy < 0) doJump(); else doSlide();
  });
  function step() {
    const W = cv.width, H = cv.height;
    if (!over && started) {
      t++;
      speed = Math.min(16, 7 + dist / 700);
      dist += speed / 8; scroll += speed;
      if (t % Math.max(26, 62 - Math.floor(speed * 2)) === 0) spawn();
      // jump physics (jumpY 0..1 arc)
      if (jumpV !== 0 || jumpY > 0) { jumpY += jumpV; jumpV -= 0.012; if (jumpY <= 0) { jumpY = 0; jumpV = 0; } }
      if (slide > 0) slide--;
      if (invuln > 0) invuln--;
      boulder = Math.max(0, boulder - 0.004);
      const step_ = speed / 420; // depth approach per frame
      obs.forEach(o => { o.d -= step_; });
      gems.forEach(gm => { gm.d -= step_; });
      // collisions at near plane
      obs.forEach(o => {
        if (o.d < 0.12 && o.d > -0.05 && o.lane === lane && invuln === 0) {
          let hit = false;
          if (o.type === 'block') hit = true;
          else if (o.type === 'barrier') hit = jumpY < 0.25;
          else if (o.type === 'low') hit = slide <= 0 && jumpY < 0.05;
          if (hit) {
            hearts--; invuln = 80; boulder = Math.min(1, boulder + 0.34);
            scoreEl.textContent = '❤'.repeat(Math.max(0, hearts)) + ' · ' + Math.floor(dist);
            if (hearts <= 0) gameOver();
          }
        }
      });
      gems.forEach(gm => {
        if (!gm.got && gm.d < 0.14 && gm.d > -0.05 && gm.lane === lane) { gm.got = true; gemCount++; }
      });
      obs = obs.filter(o => o.d > -0.15);
      gems = gems.filter(gm => !gm.got && gm.d > -0.15);
      if (t % 10 === 0) scoreEl.textContent = '❤'.repeat(Math.max(0, hearts)) + ' · ' + Math.floor(dist) + ' · 💎' + gemCount;
    }
    draw();
  }
  function draw() {
    const W = cv.width, H = cv.height;
    const horizon = H * 0.32;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3a2a18'); g.addColorStop(0.32, '#5a4026'); g.addColorStop(1, '#241a10');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sun
    ctx.fillStyle = '#ffdf8a'; ctx.beginPath(); ctx.arc(W / 2, horizon - 40, 34, 0, 7); ctx.fill();
    // columns scrolling
    ctx.fillStyle = '#6b4f2e';
    for (let i = 0; i < 8; i++) {
      const yy = horizon + ((i * 130 + scroll * 1.4) % (H - horizon));
      const s = (yy - horizon) / (H - horizon);
      const wdt = 14 + s * 40;
      ctx.fillRect(8 + s * 10, yy - 160 * s, wdt, 160 * s);
      ctx.fillRect(W - 8 - s * 10 - wdt, yy - 160 * s, wdt, 160 * s);
    }
    // floor lane guides
    ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 3;
    for (let l = -1; l <= 1; l++) {
      ctx.beginPath(); ctx.moveTo(W / 2 + l * 20, horizon); ctx.lineTo(laneX(l, 0), H); ctx.stroke();
    }
    // gems
    gems.forEach(gm => {
      const s = 1 - gm.d, x = laneX(gm.lane, gm.d), y = horizon + s * (H - horizon) * 0.82 - 30 * s;
      ctx.fillStyle = '#6df7ea';
      const r = 4 + s * 12;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-r / 1.6, -r / 1.6, r * 1.25, r * 1.25);
      ctx.restore();
    });
    // obstacles
    obs.forEach(o => {
      const s = 1 - o.d, x = laneX(o.lane, o.d);
      const wdt = (o.type === 'block' ? 70 : 56) * s + 8;
      const yBase = horizon + s * (H - horizon) * 0.88;
      if (o.type === 'block') {
        const h = 120 * s + 10;
        ctx.fillStyle = '#8a6a3f'; ctx.fillRect(x - wdt / 2, yBase - h, wdt, h);
        ctx.fillStyle = '#5a4026'; ctx.fillRect(x - wdt / 2, yBase - h, wdt, 10);
      } else if (o.type === 'barrier') {
        const h = 46 * s + 8;
        ctx.fillStyle = '#c8552e'; ctx.fillRect(x - wdt / 2, yBase - h, wdt, h);
        ctx.fillStyle = '#ffd166'; ctx.fillRect(x - wdt / 2, yBase - h, wdt, 6);
      } else {
        const h = 30 * s + 6, top = yBase - 120 * s - 8;
        ctx.fillStyle = '#3f7a52'; ctx.fillRect(x - wdt / 2, top, wdt, h);
        ctx.fillStyle = '#2a5338';
        for (let tx = x - wdt / 2 + 4; tx < x + wdt / 2 - 4; tx += 12) {
          ctx.beginPath(); ctx.moveTo(tx, top + h); ctx.lineTo(tx + 6, top + h + 14 * s + 4); ctx.lineTo(tx + 12, top + h); ctx.fill();
        }
      }
    });
    // player
    const pxp = laneX(lane, 0), pyp = H * 0.86 - jumpY * 180;
    const sliding = slide > 0;
    if (!(invuln > 0 && Math.floor(invuln / 6) % 2 === 0)) {
      ctx.fillStyle = '#2f9dfe';
      const ph = sliding ? 26 : 54;
      ctx.fillRect(pxp - 16, pyp - ph, 32, ph);
      ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(pxp, pyp - ph - 10, 12, 0, 7); ctx.fill();
      ctx.fillStyle = '#7a4a21'; ctx.fillRect(pxp - 12, pyp - ph - 20, 24, 8); // explorer hat
    }
    // boulder behind
    const bs = 30 + boulder * 90;
    ctx.fillStyle = '#5c5c66';
    ctx.beginPath(); ctx.arc(W / 2, H + bs * 0.4 - boulder * H * 0.25, bs, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d3d46';
    ctx.beginPath(); ctx.arc(W / 2 - bs * 0.3, H + bs * 0.3 - boulder * H * 0.25, bs * 0.4, 0, 7); ctx.fill();
    if (!started && !over) {
      ctx.fillStyle = '#ffffffdd'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Swipe or arrows: dodge! Tap/↑ jump, ↓ slide', W / 2, H * 0.5);
    }
  }
  reset();
  gemCount = 0;
  kit.loop(step);
}

/* ============ 5. loadBlockfall — falling-block puzzle ============ */
function loadBlockfall(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('🧩 Block Fall', loadBlockfall);
  const scoreEl = container.querySelector('.kg-score');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;width:100%;height:100%;gap:8px;justify-content:center;align-items:flex-start;padding:8px;box-sizing:border-box;';
  const cv = document.createElement('canvas');
  cv.style.cssText = 'touch-action:none;background:#0d1428;border-radius:8px;';
  const side = document.createElement('div');
  side.style.cssText = 'color:#fff;font-family:system-ui,sans-serif;font-size:14px;display:flex;flex-direction:column;gap:8px;align-items:center;';
  side.innerHTML = '<div>Next:</div><canvas width="80" height="80" style="background:#0d1428;border-radius:8px"></canvas>' +
    '<div class="bf-lv">Level 1</div><div class="bf-lines">Lines 0</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,44px);gap:6px;margin-top:6px">' +
    '<button data-k="left" style="' + __btnStyle() + 'margin:0;padding:8px 0">◀</button>' +
    '<button data-k="rot" style="' + __btnStyle() + 'margin:0;padding:8px 0">↻</button>' +
    '<button data-k="right" style="' + __btnStyle() + 'margin:0;padding:8px 0">▶</button>' +
    '<button data-k="down" style="' + __btnStyle() + 'margin:0;padding:8px 0">▼</button>' +
    '<button data-k="drop" style="' + __btnStyle() + 'margin:0;padding:8px 0">⤓</button>' +
    '<button data-k="rot" style="' + __btnStyle() + 'margin:0;padding:8px 0">↻</button></div>';
  wrap.appendChild(cv); wrap.appendChild(side);
  stage.appendChild(wrap);
  const ctx = cv.getContext('2d'), nctx = side.querySelector('canvas').getContext('2d');
  const COLS = 10, ROWS = 20;
  const SHAPES = {
    I: { m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], c: '#6df7ea' },
    J: { m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], c: '#6b9bff' },
    L: { m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], c: '#ffb35c' },
    O: { m: [[1, 1], [1, 1]], c: '#ffd166' },
    S: { m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], c: '#7cf29c' },
    T: { m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], c: '#c59bff' },
    Z: { m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], c: '#ff7b8a' }
  };
  const KEYS = Object.keys(SHAPES);
  let grid, cur, next, score, lines, level, over, dropAcc, lastT, cell;
  function sizeCanvas() {
    const availH = stage.clientHeight - 16, availW = stage.clientWidth - 120;
    cell = Math.max(14, Math.floor(Math.min(availH / ROWS, availW / COLS)));
    cv.width = COLS * cell; cv.height = ROWS * cell;
  }
  function newPiece() {
    const k = KEYS[Math.floor(Math.random() * KEYS.length)];
    const s = SHAPES[k];
    return { m: s.m.map(r => r.slice()), c: s.c, x: 3, y: 0 };
  }
  function reset() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    cur = newPiece(); next = newPiece();
    score = 0; lines = 0; level = 1; over = false; dropAcc = 0; lastT = 0;
    scoreEl.textContent = 'Score: 0';
    side.querySelector('.bf-lv').textContent = 'Level 1';
    side.querySelector('.bf-lines').textContent = 'Lines 0';
    kit.hideOverlay(stage);
  }
  function rot(m) { return m[0].map((_, i) => m.map(r => r[i]).reverse()); }
  function collides(m, px, py) {
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const gx = px + x, gy = py + y;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
      if (gy >= 0 && grid[gy][gx]) return true;
    }
    return false;
  }
  function lock() {
    cur.m.forEach((row, y) => row.forEach((v, x) => {
      if (v && cur.y + y >= 0) grid[cur.y + y][cur.x + x] = cur.c;
    }));
    // clear lines
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every(c => c)) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); cleared++; y++; }
    }
    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] * level;
      const nl = Math.floor(lines / 10) + 1;
      if (nl !== level) { level = nl; side.querySelector('.bf-lv').textContent = 'Level ' + level; }
      side.querySelector('.bf-lines').textContent = 'Lines ' + lines;
      scoreEl.textContent = 'Score: ' + score;
    }
    cur = next; next = newPiece();
    if (collides(cur.m, cur.x, cur.y)) {
      over = true;
      kit.overlay(stage, '<h2 style="margin:0 0 8px">🧱 Topped Out!</h2>' +
        '<div style="font-size:20px">Score: <b style="color:#ffd166">' + score + '</b> · Level ' + level + ' · ' + lines + ' lines</div>' +
        '<button class="kg-again" style="' + __btnStyle() + '">Play Again</button>');
      stage.querySelector('.kg-again').addEventListener('click', () => loadBlockfall(container));
    }
  }
  function tryMove(dx, dy) { if (!over && !collides(cur.m, cur.x + dx, cur.y + dy)) { cur.x += dx; cur.y += dy; return true; } return false; }
  function tryRot() {
    if (over) return;
    const r = rot(cur.m);
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!collides(r, cur.x + dx, cur.y)) { cur.m = r; cur.x += dx; return; }
    }
  }
  function hardDrop() { if (!over) { while (tryMove(0, 1)) {} lock(); dropAcc = 0; } }
  const keyH = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
    if (over) return;
    if (e.code === 'ArrowLeft') tryMove(-1, 0);
    else if (e.code === 'ArrowRight') tryMove(1, 0);
    else if (e.code === 'ArrowDown') { tryMove(0, 1); score += 1; scoreEl.textContent = 'Score: ' + score; }
    else if (e.code === 'ArrowUp' || e.code === 'KeyX') tryRot();
    else if (e.code === 'Space') hardDrop();
  };
  kit.on(document, 'keydown', keyH);
  side.querySelectorAll('button').forEach(b => {
    const k = b.dataset.k;
    kit.on(b, 'pointerdown', (e) => {
      e.preventDefault();
      if (k === 'left') tryMove(-1, 0);
      else if (k === 'right') tryMove(1, 0);
      else if (k === 'rot') tryRot();
      else if (k === 'down') { tryMove(0, 1); }
      else if (k === 'drop') hardDrop();
    });
  });
  function drawCell(g, x, y, c) {
    g.fillStyle = c; g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    g.fillStyle = '#ffffff44'; g.fillRect(x * cell + 1, y * cell + 1, cell - 2, 4);
  }
  function draw() {
    ctx.fillStyle = '#0d1428'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = '#ffffff10';
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, cv.height); ctx.stroke(); }
    grid.forEach((row, y) => row.forEach((c, x) => { if (c) drawCell(ctx, x, y, c); }));
    // ghost
    let gy = cur.y;
    while (!collides(cur.m, cur.x, gy + 1)) gy++;
    ctx.globalAlpha = 0.25;
    cur.m.forEach((row, y) => row.forEach((v, x) => { if (v) drawCell(ctx, cur.x + x, gy + y, cur.c); }));
    ctx.globalAlpha = 1;
    cur.m.forEach((row, y) => row.forEach((v, x) => { if (v && cur.y + y >= 0) drawCell(ctx, cur.x + x, cur.y + y, cur.c); }));
    // next
    nctx.fillStyle = '#0d1428'; nctx.fillRect(0, 0, 80, 80);
    const nm = next.m, ns = 80 / 4;
    nm.forEach((row, y) => row.forEach((v, x) => {
      if (v) { nctx.fillStyle = next.c; nctx.fillRect(x * ns + 8, y * ns + 8, ns - 2, ns - 2); }
    }));
  }
  function step(t) {
    if (!over) {
      if (!lastT) lastT = t;
      const dt = Math.min(100, t - lastT); lastT = t;
      dropAcc += dt;
      const interval = Math.max(90, 750 - (level - 1) * 65);
      if (dropAcc >= interval) { dropAcc = 0; if (!tryMove(0, 1)) lock(); }
    }
    draw();
  }
  sizeCanvas();
  kit.on(window, 'resize', sizeCanvas);
  reset();
  kit.loop(step);
}

/* ============ 6. loadArena — battle arena survival ============ */
function loadArena(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('⚔️ Battle Arena', loadArena);
  const scoreEl = container.querySelector('.kg-score');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;background:#141021;';
  stage.appendChild(cv);
  // virtual joystick zone hint
  const hint = document.createElement('div');
  hint.style.cssText = 'position:absolute;left:12px;bottom:10px;color:#ffffff88;font-family:system-ui;font-size:12px;z-index:4;';
  hint.textContent = 'Drag left side to move';
  stage.appendChild(hint);
  kit.fitCanvas(cv);
  const ctx = cv.getContext('2d');
  let px, py, hp, score, wave, enemies, bullets, parts, over, started, keys, waveMsg, dmgCd, spawnQueue, joy, joyId;
  function reset() {
    px = cv.width / 2; py = cv.height / 2;
    hp = 100; score = 0; wave = 0; enemies = []; bullets = []; parts = [];
    over = false; started = false; keys = {}; waveMsg = 0; dmgCd = 0; spawnQueue = [];
    joy = null; joyId = null;
    scoreEl.textContent = '0 · ❤100';
    kit.hideOverlay(stage);
    nextWave();
  }
  function nextWave() {
    wave++;
    const n = 4 + wave * 3;
    for (let i = 0; i < n; i++) {
      const tank = Math.random() < Math.min(0.35, 0.08 + wave * 0.03);
      spawnQueue.push({ tank, delay: i * Math.max(200, 900 - wave * 40) });
    }
    waveMsg = 120;
    scoreEl.textContent = score + ' · ❤' + hp + ' · Wave ' + wave;
  }
  function spawnEnemy(tank) {
    const W = cv.width, H = cv.height, side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * W; y = -30; }
    else if (side === 1) { x = W + 30; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = H + 30; }
    else { x = -30; y = Math.random() * H; }
    enemies.push(tank
      ? { x, y, r: 20, hp: 6 + wave, sp: 0.9 + wave * 0.05, score: 30, c: '#b04dff' }
      : { x, y, r: 12, hp: 2 + Math.floor(wave / 2), sp: 1.8 + wave * 0.08, score: 10, c: '#ff5d5d' });
  }
  function gameOver() {
    over = true;
    kit.overlay(stage, '<h2 style="margin:0 0 8px">💀 Arena Fallen</h2>' +
      '<div style="font-size:20px">Score: <b style="color:#ffd166">' + score + '</b> · Wave ' + wave + '</div>' +
      '<button class="kg-again" style="' + __btnStyle() + '">Fight Again</button>');
    stage.querySelector('.kg-again').addEventListener('click', () => loadArena(container));
  }
  const keyH = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true; started = true;
  };
  const keyU = (e) => { keys[e.code] = false; };
  kit.on(document, 'keydown', keyH);
  kit.on(document, 'keyup', keyU);
  // joystick
  kit.on(cv, 'pointerdown', (e) => {
    if (e.clientX < window.innerWidth / 2 && joyId === null) {
      joyId = e.pointerId;
      const r = cv.getBoundingClientRect();
      joy = { ox: e.clientX - r.left, oy: e.clientY - r.top, x: e.clientX - r.left, y: e.clientY - r.top };
      started = true;
    }
  });
  kit.on(cv, 'pointermove', (e) => {
    if (e.pointerId === joyId && joy) {
      const r = cv.getBoundingClientRect();
      joy.x = e.clientX - r.left; joy.y = e.clientY - r.top;
    }
  });
  const joyEnd = (e) => { if (e.pointerId === joyId) { joy = null; joyId = null; } };
  kit.on(cv, 'pointerup', joyEnd); kit.on(cv, 'pointercancel', joyEnd);
  let shootAcc = 0;
  function step(t) {
    const W = cv.width, H = cv.height;
    if (!over && started) {
      // move
      let mx = 0, my = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) mx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) mx += 1;
      if (keys['ArrowUp'] || keys['KeyW']) my -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) my += 1;
      if (joy) {
        const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy);
        if (d > 12) { mx = dx / d; my = dy / d; }
      }
      const ml = Math.hypot(mx, my) || 1, spd = 4.4;
      px = Math.max(16, Math.min(W - 16, px + mx / ml * spd));
      py = Math.max(16, Math.min(H - 16, py + my / ml * spd));
      // spawn queue
      spawnQueue.forEach(s => { s.delay -= 16; if (s.delay <= 0 && !s.done) { s.done = true; spawnEnemy(s.tank); } });
      spawnQueue = spawnQueue.filter(s => !s.done);
      // enemies chase
      enemies.forEach(e => {
        const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * e.sp; e.y += dy / d * e.sp;
        if (d < e.r + 14 && dmgCd <= 0) {
          hp -= e.r > 15 ? 18 : 10; dmgCd = 35;
          scoreEl.textContent = score + ' · ❤' + Math.max(0, hp) + ' · Wave ' + wave;
          if (hp <= 0) gameOver();
        }
      });
      if (dmgCd > 0) dmgCd--;
      // auto-shoot nearest
      shootAcc += 16;
      if (shootAcc > 240 && enemies.length) {
        shootAcc = 0;
        let best = null, bd = 1e9;
        enemies.forEach(e => { const d = Math.hypot(e.x - px, e.y - py); if (d < bd) { bd = d; best = e; } });
        if (best) {
          const a = Math.atan2(best.y - py, best.x - px);
          bullets.push({ x: px, y: py, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: 60 });
        }
      }
      bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; });
      bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);
      // bullet hits
      bullets.forEach(b => {
        enemies.forEach(e => {
          if (!e.dead && Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
            e.hp--; b.life = 0;
            parts.push({ x: b.x, y: b.y, vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4, life: 14 });
            if (e.hp <= 0) {
              e.dead = true; score += e.score;
              for (let i = 0; i < 10; i++) parts.push({ x: e.x, y: e.y, vx: (Math.random() - .5) * 6, vy: (Math.random() - .5) * 6, life: 20 });
              scoreEl.textContent = score + ' · ❤' + Math.max(0, hp) + ' · Wave ' + wave;
            }
          }
        });
      });
      enemies = enemies.filter(e => !e.dead);
      parts = parts.filter(p => p.life-- > 0);
      parts.forEach(p => { p.x += p.vx; p.y += p.vy; });
      if (waveMsg > 0) waveMsg--;
      if (!enemies.length && !spawnQueue.length && !over) nextWave();
    }
    draw();
  }
  function draw() {
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#141021'; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = '#ffffff0d'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // hp bar
    ctx.fillStyle = '#00000088'; ctx.fillRect(12, H - 26, 160, 14);
    ctx.fillStyle = hp > 50 ? '#7cf29c' : (hp > 25 ? '#ffd166' : '#ff5d5d');
    ctx.fillRect(12, H - 26, 160 * Math.max(0, hp) / 100, 14);
    // gems/parts
    parts.forEach(p => { ctx.fillStyle = '#ffd166'; ctx.fillRect(p.x, p.y, 4, 4); });
    // enemies
    enemies.forEach(e => {
      ctx.fillStyle = e.c;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x - e.r * 0.3, e.y - e.r * 0.3, e.r * 0.35, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(e.x - e.r * 0.3, e.y - e.r * 0.3, e.r * 0.18, 0, 7); ctx.fill();
    });
    // bullets
    ctx.fillStyle = '#6df7ea';
    bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.fill(); });
    // player
    if (!over) {
      ctx.fillStyle = dmgCd > 0 && Math.floor(dmgCd / 4) % 2 ? '#ff8a8a' : '#2f9dfe';
      ctx.beginPath(); ctx.arc(px, py, 14, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(px, py, 8, 0, 7); ctx.fill();
      // gun toward nearest
      let a = 0, bd = 1e9;
      enemies.forEach(e => { const d = Math.hypot(e.x - px, e.y - py); if (d < bd) { bd = d; a = Math.atan2(e.y - py, e.x - px); } });
      ctx.strokeStyle = '#1b2a4a'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * 24, py + Math.sin(a) * 24); ctx.stroke();
    }
    // joystick visual
    if (joy) {
      ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 44, 0, 7); ctx.stroke();
      ctx.fillStyle = '#ffffff88';
      ctx.beginPath(); ctx.arc(joy.x, joy.y, 18, 0, 7); ctx.fill();
    }
    if (waveMsg > 0) {
      ctx.fillStyle = '#ffffffee'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('WAVE ' + wave, W / 2, H / 2 - 40);
    }
    if (!started && !over) {
      ctx.fillStyle = '#ffffffdd'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Move with WASD / arrows / drag — auto-shooter does the rest!', W / 2, H / 2);
    }
  }
  reset();
  kit.loop(step);
}

/* ============ 7. loadImposter — imposter hunt (spot the different one) ============ */
function loadImposter(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('🕵️ Imposter Hunt', loadImposter);
  const scoreEl = container.querySelector('.kg-score');
  const area = document.createElement('div');
  area.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:flex-start;background:#1a2340;border-radius:0 0 10px 10px;padding:10px;box-sizing:border-box;overflow:auto;';
  stage.appendChild(area);
  const PAIRS = [
    ['😀', '😃'], ['🍎', '🍏'], ['🐶', '🐱'], ['🌝', '🌚'], ['🍩', '🍪'],
    ['⚽', '🏀'], ['🚗', '🚙'], ['🐟', '🐡'], ['🌹', '🌷'], ['👻', '🎃']
  ];
  let round, score, strikes, timeLeft, timerId, lock;
  function reset() {
    round = 0; score = 0; strikes = 0;
    kit.hideOverlay(stage);
    nextRound();
  }
  function gridSize() { return round < 3 ? 3 : (round < 6 ? 4 : 5); }
  function nextRound() {
    if (round >= 10) { win(); return; }
    lock = false;
    const n = gridSize();
    const pair = PAIRS[round % PAIRS.length];
    const imp = Math.floor(Math.random() * n * n);
    timeLeft = Math.max(6, 13 - round);
    scoreEl.textContent = 'Round ' + (round + 1) + '/10 · Score: ' + score + ' · Misses: ' + strikes + '/3';
    area.innerHTML =
      '<div style="color:#fff;font-family:system-ui;font-size:16px;margin-bottom:6px">Find the <b style="color:#ffd166">IMPOSTER</b>! Tap the odd one out 👆</div>' +
      '<div class="ih-timebar" style="width:min(420px,90%);height:10px;background:#00000066;border-radius:6px;margin-bottom:10px">' +
      '<div class="ih-fill" style="height:100%;width:100%;background:#7cf29c;border-radius:6px"></div></div>' +
      '<div class="ih-grid" style="display:grid;grid-template-columns:repeat(' + n + ',1fr);gap:8px;max-width:440px;width:100%"></div>';
    const grid = area.querySelector('.ih-grid');
    const fill = area.querySelector('.ih-fill');
    for (let i = 0; i < n * n; i++) {
      const b = document.createElement('button');
      b.textContent = i === imp ? pair[1] : pair[0];
      b.style.cssText = 'font-size:' + (n === 3 ? 44 : n === 4 ? 36 : 30) + 'px;background:#ffffff14;border:2px solid #ffffff22;' +
        'border-radius:12px;padding:8px;cursor:pointer;';
      b.addEventListener('click', () => pick(i === imp, b));
      grid.appendChild(b);
    }
    if (timerId) clearInterval(timerId);
    const total = timeLeft;
    timerId = setInterval(() => {
      timeLeft -= 0.1;
      fill.style.width = Math.max(0, timeLeft / total * 100) + '%';
      fill.style.background = timeLeft < 4 ? '#ff5d5d' : '#7cf29c';
      if (timeLeft <= 0) { clearInterval(timerId); miss(true); }
    }, 100);
    kit.intervals.push(timerId);
  }
  function pick(correct, btn) {
    if (lock) return;
    if (correct) {
      lock = true; clearInterval(timerId);
      btn.style.border = '3px solid #7cf29c'; btn.style.background = '#7cf29c33';
      const pts = 50 + Math.ceil(timeLeft) * 10;
      score += pts;
      round++;
      scoreEl.textContent = 'Round ' + Math.min(10, round + 1) + '/10 · Score: ' + score + ' · Misses: ' + strikes + '/3';
      kit.later(650, nextRound);
    } else {
      btn.style.border = '3px solid #ff5d5d'; btn.style.background = '#ff5d5d33';
      btn.disabled = true;
      timeLeft = Math.max(0.5, timeLeft - 2);
      score = Math.max(0, score - 10);
      scoreEl.textContent = 'Round ' + (round + 1) + '/10 · Score: ' + score + ' · Misses: ' + strikes + '/3';
    }
  }
  function miss(timeout) {
    if (lock) return;
    lock = true;
    strikes++;
    if (strikes >= 3) {
      kit.overlay(stage, '<h2 style="margin:0 0 8px">🕵️ Case Closed…</h2>' +
        '<div>Too many imposters escaped! Rounds cleared: ' + round + '/10</div>' +
        '<div style="font-size:22px;margin-top:8px">Score: <b style="color:#ffd166">' + score + '</b></div>' +
        '<button class="kg-again" style="' + __btnStyle() + '">Hunt Again</button>');
      stage.querySelector('.kg-again').addEventListener('click', () => loadImposter(container));
    } else {
      round++;
      kit.later(700, nextRound);
    }
  }
  function win() {
    const bonus = (3 - strikes) * 100;
    score += bonus;
    kit.overlay(stage, '<h2 style="margin:0 0 8px">🏆 Master Detective!</h2>' +
      '<div>You found all 10 imposters!</div>' +
      '<div style="font-size:22px;margin-top:8px">Score: <b style="color:#ffd166">' + score + '</b> (incl. +' + bonus + ' no-miss bonus)</div>' +
      '<button class="kg-again" style="' + __btnStyle() + '">Play Again</button>');
    stage.querySelector('.kg-again').addEventListener('click', () => loadImposter(container));
  }
  reset();
}

/* ============ 8. loadObby — obstacle course ============ */
function loadObby(container) {
  const kit = __gameKit(container);
  const stage = kit.hud('🏁 Waqas Obby', loadObby);
  const scoreEl = container.querySelector('.kg-score');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;background:#0f1c33;';
  stage.appendChild(cv);
  const tb = document.createElement('div');
  tb.style.cssText = 'position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:space-between;padding:0 12px;z-index:4;pointer-events:none;';
  tb.innerHTML =
    '<div style="display:flex;gap:10px;pointer-events:auto">' +
    '<button data-k="left" style="' + __btnStyle() + 'margin:0;padding:12px 18px;opacity:.85">◀</button>' +
    '<button data-k="right" style="' + __btnStyle() + 'margin:0;padding:12px 18px;opacity:.85">▶</button></div>' +
    '<button data-k="jump" style="' + __btnStyle() + 'margin:0;padding:12px 22px;opacity:.85;pointer-events:auto">⤒</button>';
  stage.appendChild(tb);
  kit.fitCanvas(cv);
  const ctx = cv.getContext('2d');
  const GRAV = 0.6, MOVE = 4.8, JUMPV = -13.8;
  // stage layout: static plats, moving plats {x,y,w,h,ax,ay,rx,ry,sp,ph}, spikes, checkpoints, finish
  const PLATS = [
    [0, 560, 320, 60], [380, 560, 240, 60], [680, 500, 200, 24], [940, 560, 240, 60],
    [1240, 500, 200, 24], [1500, 560, 280, 60], [1840, 500, 200, 24],
    [2160, 560, 260, 60], [2480, 500, 200, 24], [2740, 560, 320, 60]
  ];
  const MOVERS = [
    { x: 1290, y: 430, w: 120, h: 20, ax: 1290, ay: 430, rx: 90, ry: 0, sp: 0.03, ph: 0 },
    { x: 1900, y: 430, w: 120, h: 20, ax: 1900, ay: 430, rx: 0, ry: 80, sp: 0.035, ph: 1 },
    { x: 2540, y: 430, w: 120, h: 20, ax: 2540, ay: 430, rx: 100, ry: 0, sp: 0.04, ph: 2 }
  ];
  const SPIKES = [[500, 536, 60], [1010, 536, 60], [1600, 536, 80], [2260, 536, 60], [2850, 536, 80]];
  const CHECKS = [700, 1600, 2500];
  const FINISH = 2980;
  let px, py, vx, vy, onGround, keys, camX, deaths, startT, elapsed, over, cp, ride;
  function reset() {
    px = 60; py = 460; vx = 0; vy = 0; onGround = false;
    keys = {}; camX = 0; deaths = 0; startT = Date.now(); elapsed = 0;
    over = false; cp = 0; ride = null;
    scoreEl.textContent = '⏱ 0.0s · 💀0 · CP 1/4';
    kit.hideOverlay(stage);
  }
  function die() {
    deaths++;
    px = cp === 0 ? 60 : CHECKS[cp - 1]; py = 400; vx = 0; vy = 0; ride = null;
    scoreEl.textContent = '⏱ ' + elapsed.toFixed(1) + 's · 💀' + deaths + ' · CP ' + Math.min(4, cp + 1) + '/4';
  }
  function finish() {
    over = true;
    kit.overlay(stage, '<h2 style="margin:0 0 8px">🏁 Course Complete!</h2>' +
      '<div style="font-size:20px">Time: <b style="color:#ffd166">' + elapsed.toFixed(1) + 's</b> · Deaths: ' + deaths + '</div>' +
      '<div style="margin-top:6px">' + (deaths === 0 ? '🌟 FLAWLESS! No deaths!' : deaths <= 3 ? '👏 Great run!' : '💪 Finished — try for fewer deaths!') + '</div>' +
      '<button class="kg-again" style="' + __btnStyle() + '">Run Again</button>');
    stage.querySelector('.kg-again').addEventListener('click', () => loadObby(container));
  }
  const keyH = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && onGround && !over) { vy = JUMPV; onGround = false; ride = null; }
  };
  const keyU = (e) => { keys[e.code] = false; };
  kit.on(document, 'keydown', keyH);
  kit.on(document, 'keyup', keyU);
  tb.querySelectorAll('button').forEach(b => {
    const k = b.dataset.k;
    const dn = (e) => {
      e.preventDefault();
      if (k === 'jump') { keys['Space'] = true; if (onGround && !over) { vy = JUMPV; onGround = false; ride = null; } }
      else keys[k === 'left' ? 'ArrowLeft' : 'ArrowRight'] = true;
    };
    const up = (e) => { e.preventDefault(); keys[k === 'jump' ? 'Space' : (k === 'left' ? 'ArrowLeft' : 'ArrowRight')] = false; };
    kit.on(b, 'pointerdown', dn); kit.on(b, 'pointerup', up); kit.on(b, 'pointerleave', up); kit.on(b, 'pointercancel', up);
  });
  function solids(t) {
    const arr = PLATS.map(p => ({ x: p[0], y: p[1], w: p[2], h: p[3] }));
    MOVERS.forEach((m, i) => {
      m.x = m.ax + Math.sin(t * m.sp + m.ph) * m.rx;
      m.y = m.ay + Math.sin(t * m.sp * 1.3 + m.ph) * m.ry;
      arr.push({ x: m.x, y: m.y, w: m.w, h: m.h, mover: m });
    });
    return arr;
  }
  function step() {
    if (!over) {
      elapsed = (Date.now() - startT) / 1000;
      const t = Date.now() / 16;
      const L = keys['ArrowLeft'] || keys['KeyA'], R = keys['ArrowRight'] || keys['KeyD'];
      vx = (R ? MOVE : 0) - (L ? MOVE : 0);
      vy += GRAV; if (vy > 16) vy = 16;
      // ride moving platform
      if (ride && onGround) { px += ride.x - ride.px; py += ride.y - ride.py; }
      px += vx;
      let arr = solids(t);
      arr.forEach(p => {
        if (px + 13 > p.x && px - 13 < p.x + p.w && py + 20 > p.y && py - 20 < p.y + p.h) {
          px = vx > 0 ? p.x - 13 : p.x + p.w + 13;
        }
      });
      py += vy; onGround = false; ride = null;
      arr = solids(t);
      arr.forEach(p => {
        if (px + 13 > p.x && px - 13 < p.x + p.w && py + 20 > p.y && py - 20 < p.y + p.h) {
          if (vy > 0) {
            py = p.y - 20; vy = 0; onGround = true;
            if (p.mover) ride = { x: p.x, y: p.y, px: p.x, py: p.y };
          } else if (vy < 0) { py = p.y + p.h + 20; vy = 0; }
        }
      });
      // store mover prev pos
      MOVERS.forEach(m => { m.px = m.x; m.py = m.y; });
      if (px < 13) px = 13;
      // spikes
      if (SPIKES.some(s => px + 11 > s[0] && px - 11 < s[0] + s[2] && py + 20 > s[1] && py - 20 < s[1] + 24)) die();
      // pits
      if (py > cv.height + 160) die();
      // checkpoints
      for (let i = 0; i < CHECKS.length; i++) {
        if (i + 1 > cp && Math.abs(px - CHECKS[i]) < 30 && onGround) { cp = i + 1; break; }
      }
      // finish
      if (px > FINISH) finish();
      else if (Math.floor(elapsed * 2) % 2 === 0) scoreEl.textContent = '⏱ ' + elapsed.toFixed(1) + 's · 💀' + deaths + ' · CP ' + Math.min(4, cp + 1) + '/4';
      camX = Math.max(0, px - cv.width * 0.35);
    }
    draw();
  }
  function draw() {
    const W = cv.width, H = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0f1c33'); g.addColorStop(1, '#1d3a6e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-camX, 0);
    PLATS.forEach(p => {
      ctx.fillStyle = '#33415e'; ctx.fillRect(p[0], p[1], p[2], p[3]);
      ctx.fillStyle = '#4d6a9e'; ctx.fillRect(p[0], p[1], p[2], 8);
    });
    MOVERS.forEach(m => {
      ctx.fillStyle = '#ffd166'; ctx.fillRect(m.x, m.y, m.w, m.h);
      ctx.fillStyle = '#1b2a4a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⇄', m.x + m.w / 2, m.y + 14);
    });
    SPIKES.forEach(s => {
      ctx.fillStyle = '#ff5d5d';
      for (let x = s[0]; x < s[0] + s[2]; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, s[1] + 24); ctx.lineTo(x + 10, s[1]); ctx.lineTo(x + 20, s[1] + 24); ctx.fill();
      }
    });
    // checkpoints
    CHECKS.forEach((c, i) => {
      ctx.fillStyle = i < cp ? '#7cf29c' : '#ffffff55';
      ctx.fillRect(c - 3, 440, 6, 120);
      ctx.beginPath(); ctx.arc(c, 430, 12, 0, 7); ctx.fill();
      ctx.fillStyle = '#1b2a4a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(i + 1, c, 434);
    });
    // finish
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(FINISH, 440, 8, 120);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#111' : '#fff';
      ctx.fillRect(FINISH + 8 + c * 12, 440 + r * 12, 12, 12);
    }
    // player
    ctx.fillStyle = '#ff9f43';
    ctx.fillRect(px - 13, py - 20, 26, 40);
    ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(px, py - 30, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#e63946'; ctx.fillRect(px - 13, py - 44, 26, 8); // headband
    ctx.restore();
    ctx.fillStyle = '#ffffffaa'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Reach the 🏁 — green posts save you!', 12, 22);
  }
  reset();
  kit.loop(step);
}
