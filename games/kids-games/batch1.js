'use strict';
/* Waqas Game Hub - Kids Hub batch 1: 8 original playable mini-games.
   Plain script, no modules, no imports, no network calls. Each game is a
   global function loadX(container). Every game sets container._cleanup. */

/* ---------- shared helpers ---------- */
function kgMk(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function kgScope() {
  var rafs = [], ivs = [], tos = [], ls = [];
  return {
    raf: function (id) { rafs.push(id); return id; },
    iv: function (id) { ivs.push(id); return id; },
    to: function (id) { tos.push(id); return id; },
    on: function (t, ev, fn, opt) { t.addEventListener(ev, fn, opt); ls.push([t, ev, fn, opt]); },
    cleanup: function () {
      var i;
      for (i = 0; i < rafs.length; i++) cancelAnimationFrame(rafs[i]);
      for (i = 0; i < ivs.length; i++) clearInterval(ivs[i]);
      for (i = 0; i < tos.length; i++) clearTimeout(tos[i]);
      for (i = 0; i < ls.length; i++) ls[i][0].removeEventListener(ls[i][1], ls[i][2], ls[i][3]);
    }
  };
}
function kgCss() {
  if (document.getElementById('kg-css')) return;
  var st = document.createElement('style');
  st.id = 'kg-css';
  st.textContent =
    '.kg-wrap{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(160deg,#0d2137,#081426);color:#f4f1e8;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;user-select:none;-webkit-user-select:none}' +
    '.kg-head{display:flex;align-items:center;gap:10px;padding:10px 12px;flex:0 0 auto}' +
    '.kg-title{font-size:19px;font-weight:800;letter-spacing:.3px}' +
    '.kg-score{margin-left:auto;font-size:13px;font-weight:700;color:#ffd166;background:rgba(255,209,102,.12);padding:6px 10px;border-radius:10px;white-space:nowrap}' +
    '.kg-btn{background:#ffd166;border:0;border-radius:10px;padding:8px 14px;font-weight:800;cursor:pointer;color:#20303c;font-size:14px}' +
    '.kg-btn:active{transform:scale(.96)}' +
    '.kg-status{padding:2px 14px 6px;font-size:14px;min-height:26px;color:#cfe3ef;flex:0 0 auto}' +
    '.kg-body{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px 10px 12px;position:relative}' +
    '.kg-board{display:grid;gap:3px;background:rgba(255,255,255,.06);padding:8px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35)}' +
    '.kg-sq{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:clamp(18px,5.5vmin,38px);border-radius:8px;cursor:pointer;position:relative;border:0;padding:0;line-height:1}' +
    '.kg-sq.lite{background:#e8dcc3}.kg-sq.dark{background:#7d9bb3}' +
    '.kg-sq.plain{background:rgba(255,255,255,.09);color:#fff}' +
    '.kg-sq.sel{outline:3px solid #ffd166;outline-offset:-3px}' +
    '.kg-sq.last{background:#bfe3c6 !important}' +
    '.kg-sq.hint::after{content:"";position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(20,60,40,.45)}' +
    '.kg-sq.cap::after{content:"";position:absolute;inset:5%;border-radius:50%;border:3px solid rgba(200,40,40,.75)}' +
    '.kg-sq.cur{outline:3px dashed #6df7ea;outline-offset:-3px}' +
    '.kg-sq.up{background:#12324a}' +
    '.kg-sq.empty{background:rgba(255,255,255,.03);cursor:default;border:2px dashed rgba(255,255,255,.18)}' +
    '.kg-msg{position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(5,12,22,.86);z-index:5;text-align:center;padding:20px}' +
    '.kg-msg h2{margin:0;font-size:30px;color:#ffd166}' +
    '.kg-msg p{margin:0;font-size:16px;color:#dfe9f2;max-width:340px}' +
    'canvas.kg-cv{touch-action:none;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:100%;max-height:100%}' +
    '.kg-under{display:flex;gap:8px;justify-content:center;padding:4px 8px 10px;flex:0 0 auto;flex-wrap:wrap}';
  document.head.appendChild(st);
}
function kgHead(container, S, title, onRestart) {
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  var wrap = kgMk('div', 'kg-wrap');
  container.appendChild(wrap);
  var head = kgMk('div', 'kg-head');
  head.appendChild(kgMk('div', 'kg-title', title));
  var score = kgMk('div', 'kg-score', '');
  head.appendChild(score);
  var btn = kgMk('button', 'kg-btn', '\u21BB Restart');
  S.on(btn, 'click', onRestart);
  head.appendChild(btn);
  wrap.appendChild(head);
  var status = kgMk('div', 'kg-status', '');
  wrap.appendChild(status);
  var body = kgMk('div', 'kg-body');
  wrap.appendChild(body);
  return { wrap: wrap, scoreEl: score, statusEl: status, body: body };
}
function kgClearMsg(body) { var m = body.querySelector('.kg-msg'); if (m) m.remove(); }
function kgMsg(body, S, title, text, btnLabel, onBtn) {
  kgClearMsg(body);
  var m = kgMk('div', 'kg-msg', '<h2>' + title + '</h2><p>' + text + '</p>');
  if (btnLabel) {
    var b = kgMk('button', 'kg-btn', btnLabel);
    S.on(b, 'click', onBtn);
    m.appendChild(b);
  }
  body.appendChild(m);
}
function kgFitBoard(S, body, grid) {
  function fit() {
    var s = Math.max(220, Math.min(body.clientWidth, body.clientHeight) - 16);
    grid.style.width = s + 'px';
    grid.style.height = s + 'px';
  }
  fit();
  S.on(window, 'resize', fit);
}

/* ================= 1. CHESS vs AI ================= */
var KG_GLYPH = { wk: '\u2654', wq: '\u2655', wr: '\u2656', wb: '\u2657', wn: '\u2658', wp: '\u2659', bk: '\u265A', bq: '\u265B', br: '\u265C', bb: '\u265D', bn: '\u265E', bp: '\u265F' };
function loadChess(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\u265E Chess', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var grid = kgMk('div', 'kg-board');
  grid.style.gridTemplateColumns = 'repeat(8,1fr)';
  body.appendChild(grid);
  kgFitBoard(S, body, grid);
  S.on(grid, 'click', onTap);

  var bd, turn, sel, legalList, castling, ep, halfmove, over, cursor, aiBusy, lastMove;

  function newBoard() {
    var back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], b = [], r, c;
    for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) b[r].push(null); }
    for (c = 0; c < 8; c++) {
      b[0][c] = { t: back[c], c: 'b' }; b[1][c] = { t: 'p', c: 'b' };
      b[6][c] = { t: 'p', c: 'w' }; b[7][c] = { t: back[c], c: 'w' };
    }
    return b;
  }
  function clone(b) {
    return b.map(function (row) { return row.map(function (p) { return p ? { t: p.t, c: p.c } : null; }); });
  }
  function opp(c) { return c === 'w' ? 'b' : 'w'; }
  /* pseudo-legal moves; atk=true -> squares attacked (for check detection) */
  function pmoves(b, r, c, atk) {
    var p = b[r][c], M = [];
    if (!p) return M;
    var D = p.c === 'w' ? -1 : 1;
    function occ(rr, cc) {
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) return 2;
      var q = b[rr][cc]; if (!q) return 0; return q.c === p.c ? 2 : 1;
    }
    function slide(drs) {
      for (var k = 0; k < drs.length; k++) {
        var rr = r + drs[k][0], cc = c + drs[k][1];
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
          var o = occ(rr, cc);
          if (o === 2) break;
          if (atk) { if (o === 1) M.push({ fr: r, fc: c, tr: rr, tc: cc }); }
          else M.push({ fr: r, fc: c, tr: rr, tc: cc, captured: o === 1 ? b[rr][cc] : null });
          if (o === 1) break;
          rr += drs[k][0]; cc += drs[k][1];
        }
      }
    }
    function step(drs) {
      for (var k = 0; k < drs.length; k++) {
        var rr = r + drs[k][0], cc = c + drs[k][1], o = occ(rr, cc);
        if (o === 2) continue;
        if (atk) { if (o === 1) M.push({ fr: r, fc: c, tr: rr, tc: cc }); }
        else M.push({ fr: r, fc: c, tr: rr, tc: cc, captured: o === 1 ? b[rr][cc] : null });
      }
    }
    var N8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    var KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    var DG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    var OR = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    if (p.t === 'p') {
      if (!atk && occ(r + D, c) === 0) {
        M.push({ fr: r, fc: c, tr: r + D, tc: c, captured: null });
        if ((p.c === 'w' && r === 6 || p.c === 'b' && r === 1) && occ(r + 2 * D, c) === 0)
          M.push({ fr: r, fc: c, tr: r + 2 * D, tc: c, captured: null });
      }
      for (var k = 0; k < 2; k++) {
        var rr = r + D, cc = c + (k ? -1 : 1);
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        if (atk) { M.push({ fr: r, fc: c, tr: rr, tc: cc }); continue; }
        var o = occ(rr, cc);
        if (o === 1) M.push({ fr: r, fc: c, tr: rr, tc: cc, captured: b[rr][cc] });
        if (ep && ep.r === rr && ep.c === cc)
          M.push({ fr: r, fc: c, tr: rr, tc: cc, epCap: true, captured: { t: 'p', c: opp(p.c) } });
      }
    }
    else if (p.t === 'n') step(KN);
    else if (p.t === 'b') slide(DG);
    else if (p.t === 'r') slide(OR);
    else if (p.t === 'q') slide(N8);
    else if (p.t === 'k') {
      step(N8);
      if (!atk) {
        var home = p.c === 'w' ? 7 : 0, en = opp(p.c);
        if (r === home && c === 4) {
          if ((p.c === 'w' ? castling.wk : castling.bk) && !b[home][5] && !b[home][6] &&
              !attacked(b, home, 4, en) && !attacked(b, home, 5, en) && !attacked(b, home, 6, en))
            M.push({ fr: r, fc: c, tr: home, tc: 6, castle: 'K', captured: null });
          if ((p.c === 'w' ? castling.wq : castling.bq) && !b[home][1] && !b[home][2] && !b[home][3] &&
              !attacked(b, home, 4, en) && !attacked(b, home, 3, en) && !attacked(b, home, 2, en))
            M.push({ fr: r, fc: c, tr: home, tc: 2, castle: 'Q', captured: null });
        }
      }
    }
    return M;
  }
  function attacked(b, r, c, by) {
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var p = b[i][j];
      if (!p || p.c !== by) continue;
      if (p.t === 'p') {
        var D = by === 'w' ? -1 : 1;
        if (i + D === r && (j - 1 === c || j + 1 === c)) return true;
        continue;
      }
      var ms = pmoves(b, i, j, true);
      for (var k = 0; k < ms.length; k++) if (ms[k].tr === r && ms[k].tc === c) return true;
    }
    return false;
  }
  function findKing(b, color) {
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var p = b[i][j];
      if (p && p.t === 'k' && p.c === color) return { r: i, c: j };
    }
    return { r: 0, c: 0 };
  }
  function applyRaw(b, m) {
    var p = b[m.fr][m.fc];
    b[m.fr][m.fc] = null;
    if (m.epCap) b[m.fr][m.tc] = null;
    b[m.tr][m.tc] = p;
    if (m.promo) p.t = 'q';
    if (m.castle) {
      var home = m.fr;
      if (m.tc === 6) { b[home][5] = b[home][7]; b[home][7] = null; }
      else { b[home][3] = b[home][0]; b[home][0] = null; }
    }
  }
  function legalFor(b, r, c) {
    var p = b[r][c];
    if (!p) return [];
    var out = [], ms = pmoves(b, r, c, false);
    for (var k = 0; k < ms.length; k++) {
      var nb = clone(b);
      applyRaw(nb, ms[k]);
      var kk = findKing(nb, p.c);
      if (!attacked(nb, kk.r, kk.c, opp(p.c))) out.push(ms[k]);
    }
    return out;
  }
  function allLegal(b, color) {
    var out = [];
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var p = b[i][j];
      if (p && p.c === color) {
        var ms = legalFor(b, i, j);
        for (var k = 0; k < ms.length; k++) out.push(ms[k]);
      }
    }
    return out;
  }
  function inCheck(b, color) { var k = findKing(b, color); return attacked(b, k.r, k.c, opp(color)); }
  function applyGameMove(m) {
    var p = bd[m.fr][m.fc];
    if (p.t === 'k') { if (p.c === 'w') { castling.wk = 0; castling.wq = 0; } else { castling.bk = 0; castling.bq = 0; } }
    if (p.t === 'r') {
      if (p.c === 'w' && m.fr === 7 && m.fc === 0) castling.wq = 0;
      if (p.c === 'w' && m.fr === 7 && m.fc === 7) castling.wk = 0;
      if (p.c === 'b' && m.fr === 0 && m.fc === 0) castling.bq = 0;
      if (p.c === 'b' && m.fr === 0 && m.fc === 7) castling.bk = 0;
    }
    if (m.captured && m.captured.t === 'r' && !m.epCap) {
      if (m.tr === 7 && m.tc === 0) castling.wq = 0;
      if (m.tr === 7 && m.tc === 7) castling.wk = 0;
      if (m.tr === 0 && m.tc === 0) castling.bq = 0;
      if (m.tr === 0 && m.tc === 7) castling.bk = 0;
    }
    var isPawn = p.t === 'p';
    ep = (isPawn && Math.abs(m.tr - m.fr) === 2) ? { r: (m.fr + m.tr) / 2, c: m.fc } : null;
    if (isPawn && (m.tr === 0 || m.tr === 7)) m.promo = true;
    applyRaw(bd, m);
    halfmove = (isPawn || m.captured) ? 0 : halfmove + 1;
    lastMove = m;
  }
  function material() {
    var VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }, s = 0;
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var p = bd[i][j];
      if (p) s += (p.c === 'w' ? 1 : -1) * VAL[p.t];
    }
    return s;
  }
  function bareKings() {
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var p = bd[i][j];
      if (p && p.t !== 'k') return false;
    }
    return true;
  }
  function endCheck() {
    var moves = allLegal(bd, turn), chk = inCheck(bd, turn);
    if (moves.length === 0) { over = chk ? (turn === 'w' ? 'mate-lose' : 'mate-win') : 'stale'; return true; }
    if (bareKings()) { over = 'draw'; return true; }
    if (halfmove >= 100) { over = 'draw50'; return true; }
    return false;
  }
  function statusText() {
    if (over === 'mate-win') return '\u265B Checkmate! You win \u2014 brilliant strategy!';
    if (over === 'mate-lose') return '\u265A Checkmate. The AI wins \u2014 try again!';
    if (over === 'stale') return 'Stalemate \u2014 draw! No legal moves left.';
    if (over === 'draw') return 'Draw \u2014 only kings left.';
    if (over === 'draw50') return 'Draw \u2014 50 moves, no capture.';
    var t = turn === 'w' ? 'Your move (White)' : 'AI thinking\u2026';
    if (inCheck(bd, turn)) t += ' \u2014 CHECK!';
    return t;
  }
  function render() {
    grid.innerHTML = '';
    var ksq = findKing(bd, turn), chk = !over && inCheck(bd, turn);
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      (function (rr, cc) {
        var sq = kgMk('button', 'kg-sq ' + ((rr + cc) % 2 ? 'lite' : 'dark'));
        sq.dataset.r = rr; sq.dataset.c = cc;
        var p = bd[rr][cc];
        if (p) sq.textContent = KG_GLYPH[p.c + p.t];
        if (sel && sel.r === rr && sel.c === cc) sq.classList.add('sel');
        if (lastMove && ((lastMove.fr === rr && lastMove.fc === cc) || (lastMove.tr === rr && lastMove.tc === cc))) sq.classList.add('last');
        if (sel) for (var k = 0; k < legalList.length; k++) {
          var m = legalList[k];
          if (m.tr === rr && m.tc === cc) { sq.classList.add(m.captured ? 'cap' : 'hint'); break; }
        }
        if (chk && ksq.r === rr && ksq.c === cc) sq.style.boxShadow = 'inset 0 0 0 3px #e63946';
        if (cursor.r === rr && cursor.c === cc) sq.classList.add('cur');
        grid.appendChild(sq);
      })(r, c);
    }
    var m = material();
    scoreEl.textContent = 'Material ' + (m >= 0 ? '+' : '') + m;
    statusEl.textContent = statusText();
  }
  function onTap(e) {
    var sq = e.target.closest ? e.target.closest('.kg-sq') : null;
    if (!sq || over || aiBusy || turn !== 'w') return;
    tapSquare(+sq.dataset.r, +sq.dataset.c);
  }
  function tapSquare(r, c) {
    cursor = { r: r, c: c };
    if (sel) {
      for (var k = 0; k < legalList.length; k++) {
        if (legalList[k].tr === r && legalList[k].tc === c) { playerMove(legalList[k]); return; }
      }
    }
    var p = bd[r][c];
    if (p && p.c === 'w') { sel = { r: r, c: c }; legalList = legalFor(bd, r, c); }
    else { sel = null; legalList = []; }
    render();
  }
  function playerMove(m) {
    applyGameMove(m);
    sel = null; legalList = [];
    turn = 'b';
    render();
    if (endCheck()) { render(); return; }
    aiBusy = true;
    render();
    S.to(setTimeout(aiReply, 550));
  }
  function aiReply() {
    if (over) { aiBusy = false; return; }
    var moves = allLegal(bd, 'b');
    if (moves.length === 0) { aiBusy = false; endCheck(); render(); return; }
    var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    moves.sort(function (a, b) { return ((b.captured ? VAL[b.captured.t] : 0) - (a.captured ? VAL[a.captured.t] : 0)); });
    var tv = moves[0].captured ? VAL[moves[0].captured.t] : 0;
    var pool = moves.filter(function (x) { return (x.captured ? VAL[x.captured.t] : 0) === tv; });
    var pick = pool[(Math.random() * pool.length) | 0];
    applyGameMove(pick);
    turn = 'w';
    aiBusy = false;
    endCheck();
    render();
  }
  function onKey(e) {
    if (over || aiBusy || turn !== 'w') return;
    var k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
      if (k === 'ArrowUp') cursor.r = Math.max(0, cursor.r - 1);
      if (k === 'ArrowDown') cursor.r = Math.min(7, cursor.r + 1);
      if (k === 'ArrowLeft') cursor.c = Math.max(0, cursor.c - 1);
      if (k === 'ArrowRight') cursor.c = Math.min(7, cursor.c + 1);
      render();
    } else if (k === 'Enter' || k === ' ') { e.preventDefault(); tapSquare(cursor.r, cursor.c); }
    else if (k === 'Escape') { sel = null; legalList = []; render(); }
  }
  S.on(document, 'keydown', onKey);
  function init() {
    kgClearMsg(body);
    bd = newBoard(); turn = 'w'; sel = null; legalList = [];
    castling = { wk: 1, wq: 1, bk: 1, bq: 1 }; ep = null;
    halfmove = 0; over = null; aiBusy = false; lastMove = null;
    cursor = { r: 6, c: 4 };
    render();
  }
  init();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 2. CHECKERS (English draughts) vs AI ================= */
function loadCheckers(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\u26AB Checkers', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var grid = kgMk('div', 'kg-board');
  grid.style.gridTemplateColumns = 'repeat(8,1fr)';
  body.appendChild(grid);
  kgFitBoard(S, body, grid);
  S.on(grid, 'click', onTap);

  var bd, turn, sel, moves, chain, over, cursor, aiBusy, lastMove;

  function init() {
    kgClearMsg(body);
    bd = [];
    for (var r = 0; r < 8; r++) { bd.push([]); for (var c = 0; c < 8; c++) bd[r].push(null); }
    for (r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) bd[r][c] = { c: 'b', k: false };
        else if (r > 4) bd[r][c] = { c: 'r', k: false };
      }
    }
    turn = 'r'; sel = null; moves = []; chain = null; over = null; aiBusy = false; lastMove = null;
    cursor = { r: 5, c: 2 };
    refresh();
  }
  function dirs(p) {
    if (p.k) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return p.c === 'r' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  }
  function capsFrom(r, c) {
    var p = bd[r][c], out = [], ds = dirs(p);
    for (var k = 0; k < ds.length; k++) {
      var r1 = r + ds[k][0], c1 = c + ds[k][1], r2 = r + 2 * ds[k][0], c2 = c + 2 * ds[k][1];
      if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue;
      var q = bd[r1][c1];
      if (q && q.c !== p.c && !bd[r2][c2]) out.push({ fr: r, fc: c, tr: r2, tc: c2, cap: { r: r1, c: c1 } });
    }
    return out;
  }
  function sideMoves(color, chainFrom) {
    var i, j, out = [];
    if (chainFrom) return capsFrom(chainFrom.r, chainFrom.c);
    for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) {
      var p = bd[i][j];
      if (p && p.c === color) { var cp = capsFrom(i, j); for (var k = 0; k < cp.length; k++) out.push(cp[k]); }
    }
    if (out.length) return out; /* forced captures */
    for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) {
      var q = bd[i][j];
      if (q && q.c === color) {
        var ds = dirs(q);
        for (var d = 0; d < ds.length; d++) {
          var r1 = i + ds[d][0], c1 = j + ds[d][1];
          if (r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8 && !bd[r1][c1])
            out.push({ fr: i, fc: j, tr: r1, tc: c1, cap: null });
        }
      }
    }
    return out;
  }
  function count(color) {
    var n = 0;
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) if (bd[i][j] && bd[i][j].c === color) n++;
    return n;
  }
  function refresh() {
    grid.innerHTML = '';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      (function (rr, cc) {
        var sq = kgMk('button', 'kg-sq ' + ((rr + cc) % 2 ? 'dark' : 'lite'));
        sq.dataset.r = rr; sq.dataset.c = cc;
        var p = bd[rr][cc];
        if (p) {
          var s = kgMk('span', '', (p.k ? '\u265B ' : '') + (p.c === 'r' ? '\uD83D\uDD34' : '\u26AB'));
          s.style.fontSize = '0.85em';
          sq.appendChild(s);
        }
        if (sel && sel.r === rr && sel.c === cc) sq.classList.add('sel');
        if (lastMove && ((lastMove.fr === rr && lastMove.fc === cc) || (lastMove.tr === rr && lastMove.tc === cc))) sq.classList.add('last');
        if (sel) for (var k = 0; k < moves.length; k++) {
          var m = moves[k];
          if (m.fr === sel.r && m.fc === sel.c && m.tr === rr && m.tc === cc) { sq.classList.add(m.cap ? 'cap' : 'hint'); break; }
        }
        if (cursor.r === rr && cursor.c === cc) sq.classList.add('cur');
        grid.appendChild(sq);
      })(r, c);
    }
    scoreEl.textContent = 'You \uD83D\uDD34 ' + count('r') + ' \u00B7 AI \u26AB ' + count('b');
    statusEl.textContent = statusText();
  }
  function statusText() {
    if (over === 'win') return '\uD83C\uDFC6 You captured all AI pieces \u2014 you win!';
    if (over === 'lose') return 'AI wins this one \u2014 try a new strategy!';
    if (aiBusy) return 'AI thinking\u2026';
    if (chain) return 'Jump again! You must keep capturing.';
    var mv = sideMoves('r', null);
    if (mv.length && mv[0].cap) return 'Your move \u2014 capture is FORCED (red ring).';
    return 'Your move (red).';
  }
  function onTap(e) {
    var sq = e.target.closest ? e.target.closest('.kg-sq') : null;
    if (!sq || over || aiBusy || turn !== 'r') return;
    tapSquare(+sq.dataset.r, +sq.dataset.c);
  }
  function tapSquare(r, c) {
    cursor = { r: r, c: c };
    if (sel) {
      for (var k = 0; k < moves.length; k++) {
        var m = moves[k];
        if (m.fr === sel.r && m.fc === sel.c && m.tr === r && m.tc === c) { doMove(m); return; }
      }
    }
    var p = bd[r][c];
    if (chain) {
      if (p && p.c === 'r' && r === chain.r && c === chain.c) { sel = { r: r, c: c }; moves = capsFrom(r, c); }
      else { sel = { r: chain.r, c: chain.c }; moves = capsFrom(chain.r, chain.c); }
    } else if (p && p.c === 'r') {
      var all = sideMoves('r', null);
      sel = { r: r, c: c };
      moves = all.filter(function (m) { return m.fr === r && m.fc === c; });
    } else { sel = null; moves = []; }
    refresh();
  }
  function doMove(m) {
    var p = bd[m.fr][m.fc];
    bd[m.fr][m.fc] = null;
    if (m.cap) bd[m.cap.r][m.cap.c] = null;
    bd[m.tr][m.tc] = p;
    if ((p.c === 'r' && m.tr === 0) || (p.c === 'b' && m.tr === 7)) p.k = true;
    lastMove = m;
    var more = m.cap ? capsFrom(m.tr, m.tc) : [];
    if (m.cap && more.length) {
      chain = { r: m.tr, c: m.tc };
      sel = { r: m.tr, c: m.tc };
      moves = more;
      refresh();
      return;
    }
    chain = null; sel = null; moves = [];
    if (checkWin()) { refresh(); return; }
    turn = turn === 'r' ? 'b' : 'r';
    refresh();
    if (turn === 'b' && !over) { aiBusy = true; refresh(); S.to(setTimeout(aiReply, 600)); }
  }
  function checkWin() {
    var rc = count('r'), bc = count('b');
    if (bc === 0) { over = 'win'; return true; }
    if (rc === 0) { over = 'lose'; return true; }
    var nm = sideMoves(turn === 'r' ? 'b' : 'r', null);
    if (nm.length === 0) { over = turn === 'r' ? 'win' : 'lose'; return true; }
    return false;
  }
  function aiReply() {
    if (over) { aiBusy = false; return; }
    var mv = sideMoves('b', null);
    if (!mv.length) { aiBusy = false; over = 'win'; refresh(); return; }
    var pick = mv[(Math.random() * mv.length) | 0];
    /* apply directly (AI's own turn context) */
    var p = bd[pick.fr][pick.fc];
    bd[pick.fr][pick.fc] = null;
    if (pick.cap) bd[pick.cap.r][pick.cap.c] = null;
    bd[pick.tr][pick.tc] = p;
    if (pick.tr === 7) p.k = true;
    lastMove = pick;
    var more = pick.cap ? capsFrom(pick.tr, pick.tc) : [];
    if (pick.cap && more.length) { S.to(setTimeout(aiChain, 600, pick.tr, pick.tc)); return; }
    aiBusy = false;
    if (checkWin()) { refresh(); return; }
    turn = 'r';
    refresh();
  }
  function aiChain(r, c) {
    var mv = capsFrom(r, c);
    if (!mv.length || over) { aiBusy = false; turn = 'r'; refresh(); return; }
    var pick = mv[(Math.random() * mv.length) | 0];
    var p = bd[pick.fr][pick.fc];
    bd[pick.fr][pick.fc] = null;
    bd[pick.cap.r][pick.cap.c] = null;
    bd[pick.tr][pick.tc] = p;
    if (pick.tr === 7) p.k = true;
    lastMove = pick;
    var more = capsFrom(pick.tr, pick.tc);
    if (more.length) { S.to(setTimeout(aiChain, 600, pick.tr, pick.tc)); return; }
    aiBusy = false;
    if (checkWin()) { refresh(); return; }
    turn = 'r';
    refresh();
  }
  function onKey(e) {
    if (over || aiBusy || turn !== 'r') return;
    var k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
      if (k === 'ArrowUp') cursor.r = Math.max(0, cursor.r - 1);
      if (k === 'ArrowDown') cursor.r = Math.min(7, cursor.r + 1);
      if (k === 'ArrowLeft') cursor.c = Math.max(0, cursor.c - 1);
      if (k === 'ArrowRight') cursor.c = Math.min(7, cursor.c + 1);
      refresh();
    } else if (k === 'Enter' || k === ' ') { e.preventDefault(); tapSquare(cursor.r, cursor.c); }
    else if (k === 'Escape') { if (!chain) { sel = null; moves = []; refresh(); } }
  }
  S.on(document, 'keydown', onKey);
  init();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 3. TIC-TAC-TOE vs unbeatable AI ================= */
function loadTicTacToe(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var tally = { x: 0, o: 0, d: 0 };
  var ui = kgHead(container, S, '\u274C Tic-Tac-Toe', newRound);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var grid = kgMk('div', 'kg-board');
  grid.style.gridTemplateColumns = 'repeat(3,1fr)';
  body.appendChild(grid);
  kgFitBoard(S, body, grid);
  var cells = [];
  for (var i = 0; i < 9; i++) {
    (function (idx) {
      var sq = kgMk('button', 'kg-sq plain', '');
      sq.style.fontSize = 'clamp(40px,12vmin,84px)';
      sq.style.fontWeight = '800';
      S.on(sq, 'click', function () { tapCell(idx); });
      grid.appendChild(sq);
      cells.push(sq);
    })(i);
  }
  var b, over, aiBusy, cur;
  var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function winner(bd) {
    for (var k = 0; k < LINES.length; k++) {
      var a = bd[LINES[k][0]];
      if (a && a === bd[LINES[k][1]] && a === bd[LINES[k][2]]) return a;
    }
    for (var i = 0; i < 9; i++) if (!bd[i]) return null;
    return 'd';
  }
  function minimax(bd, isMax, depth) {
    var w = winner(bd);
    if (w === 'o') return { s: 10 - depth, i: -1 };
    if (w === 'x') return { s: depth - 10, i: -1 };
    if (w === 'd') return { s: 0, i: -1 };
    var best = { s: isMax ? -99 : 99, i: -1 };
    for (var i = 0; i < 9; i++) {
      if (bd[i]) continue;
      bd[i] = isMax ? 'o' : 'x';
      var r = minimax(bd, !isMax, depth + 1);
      bd[i] = '';
      if (isMax ? r.s > best.s : r.s < best.s) best = { s: r.s, i: i };
    }
    return best;
  }
  function render() {
    for (var i = 0; i < 9; i++) {
      cells[i].textContent = b[i] === 'x' ? '\u2716' : b[i] === 'o' ? '\u25EF' : '';
      cells[i].style.color = b[i] === 'x' ? '#6df7ea' : '#ffd166';
    }
    scoreEl.textContent = 'You ' + tally.x + ' \u00B7 AI ' + tally.o + ' \u00B7 Draw ' + tally.d;
    statusEl.textContent = over ? over : (aiBusy ? 'AI thinking\u2026' : 'Your turn \u2014 you are \u2716');
  }
  function tapCell(i) {
    if (over || aiBusy || b[i]) return;
    b[i] = 'x';
    afterMove();
    if (!over) { aiBusy = true; render(); S.to(setTimeout(aiMove, 450)); }
  }
  function afterMove() {
    var w = winner(b);
    if (w === 'x') { over = '\uD83C\uDFC6 You win! Clever thinking!'; tally.x++; }
    else if (w === 'o') { over = 'AI wins \u2014 it never misses. Try again!'; tally.o++; }
    else if (w === 'd') { over = 'Draw! Perfect play on both sides.'; tally.d++; }
    render();
  }
  function aiMove() {
    aiBusy = false;
    if (over) return;
    var mv = minimax(b.slice(), true, 0);
    if (mv.i >= 0) b[mv.i] = 'o';
    afterMove();
  }
  function newRound() {
    kgClearMsg(body);
    b = ['', '', '', '', '', '', '', '', ''];
    over = null; aiBusy = false; cur = 0;
    render();
  }
  S.on(document, 'keydown', function (e) {
    if (e.key >= '1' && e.key <= '9') tapCell(+e.key - 1);
    else if (e.key === 'Enter' && over) newRound();
  });
  newRound();
  /* auto new-round button on game end */
  var _render = render;
  render = function () {
    _render();
    if (over) kgMsg(body, S, over.indexOf('\uD83C\uDFC6') === 0 ? 'You Win!' : (over.indexOf('Draw') === 0 ? 'Draw!' : 'AI Wins'), over, 'Play again', newRound);
  };
  render();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 4. MEMORY MATCH ================= */
function loadMemory(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\uD83C\uDFAF Memory Match', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var grid = kgMk('div', 'kg-board');
  grid.style.gridTemplateColumns = 'repeat(4,1fr)';
  body.appendChild(grid);
  kgFitBoard(S, body, grid);
  var EMO = ['\uD83C\uDF4E', '\uD83D\uDE97', '\uD83D\uDC36', '\u26BD', '\uD83C\uDF19', '\u2B50', '\uD83D\uDC20', '\uD83C\uDF88'];
  var deck, first, lock, moves, matched, secs, timerId, started;
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function init() {
    kgClearMsg(body);
    if (timerId) clearInterval(timerId);
    deck = shuffle(EMO.concat(EMO)).map(function (e) { return { e: e, up: false, done: false }; });
    first = null; lock = false; moves = 0; matched = 0; secs = 0; started = false;
    render();
    statusEl.textContent = 'Find all 8 pairs \u2014 train your memory!';
  }
  function tick() {
    secs++;
    scoreEl.textContent = 'Pairs ' + (matched / 2) + '/8 \u00B7 Moves ' + moves + ' \u00B7 ' + secs + 's';
  }
  function startTimer() {
    if (started) return;
    started = true;
    timerId = S.iv(setInterval(tick, 1000));
  }
  function render() {
    grid.innerHTML = '';
    deck.forEach(function (cd, i) {
      (function (idx) {
        var sq = kgMk('button', 'kg-sq plain' + (cd.up || cd.done ? ' up' : ''));
        sq.style.fontSize = 'clamp(28px,8vmin,52px)';
        sq.textContent = (cd.up || cd.done) ? cd.e : '\u2753';
        sq.style.opacity = cd.done ? '0.55' : '1';
        S.on(sq, 'click', function () { flip(idx); });
        grid.appendChild(sq);
      })(i);
    });
    scoreEl.textContent = 'Pairs ' + (matched / 2) + '/8 \u00B7 Moves ' + moves + ' \u00B7 ' + secs + 's';
  }
  function flip(i) {
    var cd = deck[i];
    if (lock || cd.up || cd.done) return;
    startTimer();
    cd.up = true;
    if (first === null) { first = i; render(); return; }
    moves++;
    var a = deck[first], bi = i;
    if (a.e === cd.e) {
      a.done = true; cd.done = true; matched += 2;
      first = null; render();
      if (matched === 16) {
        clearInterval(timerId);
        S.to(setTimeout(function () {
          kgMsg(body, S, '\uD83C\uDFC6 You did it!', 'All 8 pairs found in ' + moves + ' moves and ' + secs + ' seconds. Sharp memory!', 'Play again', init);
          statusEl.textContent = '\uD83C\uDFC6 Finished in ' + moves + ' moves, ' + secs + 's!';
        }, 400));
      }
    } else {
      lock = true; render();
      S.to(setTimeout(function () {
        a.up = false; deck[bi].up = false;
        first = null; lock = false; render();
      }, 750));
    }
  }
  S.on(document, 'keydown', function (e) {
    if (e.key === 'Enter' && matched === 16) init();
  });
  init();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 5. SLIDING JIGSAW (3x3 emoji picture) ================= */
function loadJigsaw(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\uD83E\uDDE9 Sliding Jigsaw', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var grid = kgMk('div', 'kg-board');
  grid.style.gridTemplateColumns = 'repeat(3,1fr)';
  body.appendChild(grid);
  kgFitBoard(S, body, grid);
  S.on(grid, 'click', onTap);
  var PIC = ['\uD83C\uDF1E', '\uD83C\uDF1E', '\uD83C\uDF1E', '\uD83C\uDF0A', '\uD83D\uDC2C', '\uD83C\uDF0A', '\uD83D\uDC1A', '\uD83D\uDC1A', '\uD83D\uDC22'];
  var tiles, empty, moves, over, cursor;
  function solved() {
    for (var i = 0; i < 8; i++) if (tiles[i] !== i) return false;
    return tiles[8] === -1;
  }
  function shuffleTiles() {
    tiles = [0, 1, 2, 3, 4, 5, 6, 7, -1];
    empty = 8;
    for (var n = 0; n < 300; n++) {
      var nb = neighbors(empty);
      var pick = nb[(Math.random() * nb.length) | 0];
      tiles[empty] = tiles[pick]; tiles[pick] = -1; empty = pick;
    }
    if (solved()) shuffleTiles();
  }
  function neighbors(i) {
    var r = (i / 3) | 0, c = i % 3, out = [];
    if (r > 0) out.push(i - 3);
    if (r < 2) out.push(i + 3);
    if (c > 0) out.push(i - 1);
    if (c < 2) out.push(i + 1);
    return out;
  }
  function init() {
    kgClearMsg(body);
    shuffleTiles();
    moves = 0; over = false; cursor = 4;
    render();
    statusEl.textContent = 'Slide tiles to rebuild the picture: \uD83C\uDF1E\uD83C\uDF1E\uD83C\uDF1E \uD83C\uDF0A\uD83D\uDC2C\uD83C\uDF0A \uD83D\uDC1A\uD83D\uDC1A\uD83D\uDC22';
  }
  function render() {
    grid.innerHTML = '';
    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var t = tiles[idx];
        var sq = kgMk('button', 'kg-sq ' + (t === -1 ? 'empty' : 'plain'));
        sq.dataset.i = idx;
        if (t !== -1) { sq.textContent = PIC[t]; sq.style.fontSize = 'clamp(34px,10vmin,64px)'; }
        if (cursor === idx) sq.classList.add('cur');
        grid.appendChild(sq);
      })(i);
    }
    scoreEl.textContent = 'Moves ' + moves;
  }
  function slide(i) {
    if (over) return;
    if (neighbors(empty).indexOf(i) === -1) return;
    tiles[empty] = tiles[i]; tiles[i] = -1; empty = i; moves++;
    if (solved()) {
      over = true; render();
      statusEl.textContent = '\uD83C\uDFC6 Picture complete!';
      S.to(setTimeout(function () {
        kgMsg(body, S, '\uD83C\uDFC6 Picture complete!', 'You rebuilt the sunny sea picture in ' + moves + ' moves. Great planning!', 'Play again', init);
      }, 350));
      return;
    }
    render();
  }
  function onTap(e) {
    var sq = e.target.closest ? e.target.closest('.kg-sq') : null;
    if (!sq || sq.dataset.i == null) return;
    var i = +sq.dataset.i;
    cursor = i;
    slide(i);
  }
  S.on(document, 'keydown', function (e) {
    var k = e.key, r = (cursor / 3) | 0, c = cursor % 3, moved = true;
    if (k === 'ArrowUp') { r = Math.max(0, r - 1); }
    else if (k === 'ArrowDown') { r = Math.min(2, r + 1); }
    else if (k === 'ArrowLeft') { c = Math.max(0, c - 1); }
    else if (k === 'ArrowRight') { c = Math.min(2, c + 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); slide(cursor); return; }
    else moved = false;
    if (moved) { e.preventDefault(); cursor = r * 3 + c; render(); }
  });
  init();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 6. CANDY MATCH-3 ================= */
function loadCandy(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\uD83C\uDF6C Candy Swap', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var grid = kgMk('div', 'kg-board');
  grid.style.gridTemplateColumns = 'repeat(8,1fr)';
  body.appendChild(grid);
  kgFitBoard(S, body, grid);
  S.on(grid, 'click', onTap);
  var CK = ['\uD83C\uDF52', '\uD83C\uDF4B', '\uD83C\uDF47', '\uD83E\uDED0', '\uD83C\uDF6C', '\uD83C\uDF69'];
  var N = 8, g, score, timeLeft, busy, over, selC, combo, timerId;
  function rnd() { return (Math.random() * CK.length) | 0; }
  function findMatches() {
    var hit = [], r, c;
    for (r = 0; r < N; r++) for (c = 0; c < N - 2; c++) {
      var v = g[r][c];
      if (v >= 0 && v === g[r][c + 1] && v === g[r][c + 2]) {
        var k = c;
        while (k < N && g[r][k] === v) { hit.push([r, k]); k++; }
        c = k - 1;
      }
    }
    for (c = 0; c < N; c++) for (r = 0; r < N - 2; r++) {
      var w = g[r][c];
      if (w >= 0 && w === g[r + 1][c] && w === g[r + 2][c]) {
        var k2 = r;
        while (k2 < N && g[k2][c] === w) { hit.push([k2, c]); k2++; }
        r = k2 - 1;
      }
    }
    var seen = {}, out = [];
    for (var i = 0; i < hit.length; i++) {
      var key = hit[i][0] + ',' + hit[i][1];
      if (!seen[key]) { seen[key] = 1; out.push(hit[i]); }
    }
    return out;
  }
  function genBoard() {
    g = [];
    for (var r = 0; r < N; r++) {
      g.push([]);
      for (var c = 0; c < N; c++) {
        var v;
        do { v = rnd(); } while (
          (c >= 2 && g[r][c - 1] === v && g[r][c - 2] === v) ||
          (r >= 2 && g[r - 1][c] === v && g[r - 2][c] === v));
        g[r].push(v);
      }
    }
  }
  function init() {
    kgClearMsg(body);
    if (timerId) clearInterval(timerId);
    genBoard();
    score = 0; timeLeft = 60; busy = false; over = false; selC = null; combo = 1;
    render();
    statusEl.textContent = 'Swap 2 next-door candies to line up 3+ \u2014 60 seconds!';
    timerId = S.iv(setInterval(function () {
      timeLeft--;
      if (timeLeft <= 0) {
        timeLeft = 0; over = true; clearInterval(timerId);
        render();
        kgMsg(body, S, '\u23F0 Time\u2019s up!', 'Sweet work! Final score: ' + score + '. Tip: longer lines = bigger cascades = more points.', 'Play again', init);
      }
      render();
    }, 1000));
  }
  function render() {
    grid.innerHTML = '';
    for (var r = 0; r < N; r++) for (var c = 0; c < 8; c++) {
      (function (rr, cc) {
        var v = g[rr][cc];
        var sq = kgMk('button', 'kg-sq plain');
        sq.dataset.r = rr; sq.dataset.c = cc;
        sq.style.fontSize = 'clamp(16px,4.5vmin,30px)';
        sq.textContent = v >= 0 ? CK[v] : '';
        if (selC && selC.r === rr && selC.c === cc) sq.classList.add('sel');
        if (v === -2) sq.style.transform = 'scale(0.3)';
        grid.appendChild(sq);
      })(r, c);
    }
    var mm = (timeLeft / 60) | 0, ss = ('0' + (timeLeft % 60)).slice(-2);
    scoreEl.textContent = 'Score ' + score + ' \u00B7 ' + mm + ':' + ss;
  }
  function onTap(e) {
    var sq = e.target.closest ? e.target.closest('.kg-sq') : null;
    if (!sq || busy || over) return;
    var r = +sq.dataset.r, c = +sq.dataset.c;
    if (!selC) { selC = { r: r, c: c }; render(); return; }
    if (selC.r === r && selC.c === c) { selC = null; render(); return; }
    var adj = Math.abs(selC.r - r) + Math.abs(selC.c - c) === 1;
    if (!adj) { selC = { r: r, c: c }; render(); return; }
    trySwap(selC, { r: r, c: c });
    selC = null;
  }
  function swap(a, b) { var t = g[a.r][a.c]; g[a.r][a.c] = g[b.r][b.c]; g[b.r][b.c] = t; }
  function trySwap(a, b) {
    busy = true;
    swap(a, b); render();
    S.to(setTimeout(function () {
      if (findMatches().length === 0) { swap(a, b); busy = false; render(); }
      else { combo = 1; resolve(); }
    }, 220));
  }
  function resolve() {
    var hits = findMatches();
    if (!hits.length) { busy = false; render(); return; }
    score += hits.length * 10 * combo;
    combo++;
    for (var i = 0; i < hits.length; i++) g[hits[i][0]][hits[i][1]] = -2;
    render();
    S.to(setTimeout(function () {
      for (var c = 0; c < N; c++) {
        var col = [];
        for (var r = N - 1; r >= 0; r--) if (g[r][c] >= 0) col.push(g[r][c]);
        while (col.length < N) col.push(rnd());
        for (r = N - 1; r >= 0; r--) g[r][c] = col[N - 1 - r];
      }
      render();
      S.to(setTimeout(resolve, 200));
    }, 260));
  }
  S.on(document, 'keydown', function (e) {
    if (e.key === 'Enter' && over) init();
    if (e.key === 'Escape') { selC = null; render(); }
  });
  init();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 7. MINI GOLF (3 holes) ================= */
function loadGolf(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\u26F3 Mini Golf', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var cv = document.createElement('canvas');
  cv.className = 'kg-cv';
  body.appendChild(cv);
  var ctx = cv.getContext('2d');
  /* holes: start/hole/walls as fractions of canvas */
  var HOLES = [
    { par: 3, start: [0.15, 0.8], hole: [0.85, 0.2], walls: [[0.42, 0.05, 0.05, 0.55]] },
    { par: 4, start: [0.1, 0.5], hole: [0.9, 0.5], walls: [[0.45, 0, 0.05, 0.32], [0.45, 0.68, 0.05, 0.32]] },
    { par: 3, start: [0.5, 0.88], hole: [0.5, 0.12], walls: [[0.15, 0.42, 0.3, 0.05], [0.55, 0.42, 0.3, 0.05]] }
  ];
  var W, H, holeIdx, totals, strokes, ball, aim, state, dragging;
  function resize() {
    var ow = W || 1, oh = H || 1;
    W = Math.max(240, body.clientWidth - 4);
    H = Math.max(240, body.clientHeight - 4);
    cv.width = W; cv.height = H;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    if (ball) { ball.x *= W / ow; ball.y *= H / oh; }
  }
  function px(f) { return { x: f[0] * W, y: f[1] * H }; }
  function startHole() {
    var d = HOLES[holeIdx], s = px(d.start);
    ball = { x: s.x, y: s.y, vx: 0, vy: 0, moving: false };
    var h = px(d.hole);
    aim = { ang: Math.atan2(h.y - s.y, h.x - s.x), pow: 0.5 };
    strokes = 0; state = 'aim'; dragging = false;
    statusEl.textContent = 'Hole ' + (holeIdx + 1) + ' of 3 \u2014 drag back from the ball to aim, release to putt. Arrows + Space work too.';
    draw();
  }
  function init() {
    kgClearMsg(body);
    holeIdx = 0; totals = [];
    resize();
    startHole();
  }
  function br() { return Math.max(6, W * 0.013); }
  function holeR() { return br() * 1.9; }
  function wallsPx() {
    return HOLES[holeIdx].walls.map(function (w) { return { x: w[0] * W, y: w[1] * H, w: w[2] * W, h: w[3] * H }; });
  }
  function shoot() {
    if (state !== 'aim' || ball.moving) return;
    strokes++;
    var VMAX = Math.max(9, W * 0.02);
    ball.vx = Math.cos(aim.ang) * aim.pow * VMAX;
    ball.vy = Math.sin(aim.ang) * aim.pow * VMAX;
    ball.moving = true; state = 'roll';
  }
  function sunk() {
    state = 'done';
    ball.moving = false;
    var par = HOLES[holeIdx].par;
    totals.push({ strokes: strokes, par: par });
    var msg = strokes === 1 ? 'HOLE IN ONE! \uD83C\uDFC6' : strokes <= par ? 'Under par \u2014 great!' : strokes === par + 1 ? 'Bogey \u2014 so close!' : 'Keep practicing \u2014 timing beats power!';
    S.to(setTimeout(function () {
      if (holeIdx < 2) kgMsg(body, S, 'Hole ' + (holeIdx + 1) + ' done in ' + strokes + ' (par ' + par + ')', msg, 'Next hole \u27A1', function () { holeIdx++; startHole(); });
      else {
        var ts = 0, tp = 0, i;
        for (i = 0; i < totals.length; i++) { ts += totals[i].strokes; tp += totals[i].par; }
        var diff = ts - tp;
        var verdict = diff <= -3 ? '\uD83C\uDFC6 Champion golfer!' : diff < 0 ? '\uD83C\uDF89 Under par \u2014 excellent!' : diff === 0 ? '\uD83D\uDC4F Even par \u2014 solid!' : 'Good effort \u2014 every pro was once a beginner!';
        kgMsg(body, S, 'Round complete!', 'Total strokes: ' + ts + ' (par ' + tp + '). ' + verdict, 'Play again', init);
        statusEl.textContent = 'Finished: ' + ts + ' strokes vs par ' + tp;
      }
    }, 500));
  }
  function step() {
    if (!ball || !ball.moving) return;
    ball.x += ball.vx; ball.y += ball.vy;
    ball.vx *= 0.988; ball.vy *= 0.988;
    var r = br();
    if (ball.x < r) { ball.x = r; ball.vx = Math.abs(ball.vx) * 0.75; }
    if (ball.x > W - r) { ball.x = W - r; ball.vx = -Math.abs(ball.vx) * 0.75; }
    if (ball.y < r) { ball.y = r; ball.vy = Math.abs(ball.vy) * 0.75; }
    if (ball.y > H - r) { ball.y = H - r; ball.vy = -Math.abs(ball.vy) * 0.75; }
    var ws = wallsPx();
    for (var i = 0; i < ws.length; i++) {
      var wr = ws[i];
      var nx = Math.max(wr.x, Math.min(ball.x, wr.x + wr.w));
      var ny = Math.max(wr.y, Math.min(ball.y, wr.y + wr.h));
      var dx = ball.x - nx, dy = ball.y - ny, d = Math.hypot(dx, dy);
      if (d < r && d > 0.001) {
        var ux = dx / d, uy = dy / d;
        ball.x = nx + ux * r; ball.y = ny + uy * r;
        var dot = ball.vx * ux + ball.vy * uy;
        if (dot < 0) { ball.vx -= 1.7 * dot * ux; ball.vy -= 1.7 * dot * uy; ball.vx *= 0.85; ball.vy *= 0.85; }
      }
    }
    var h = px(HOLES[holeIdx].hole);
    var hd = Math.hypot(h.x - ball.x, h.y - ball.y);
    var sp = Math.hypot(ball.vx, ball.vy);
    if (hd < holeR()) { if (sp < 3.5) { sunk(); return; } }
    if (sp < 0.09) {
      ball.vx = ball.vy = 0; ball.moving = false; state = 'aim';
      if (strokes >= HOLES[holeIdx].par + 6) { strokes = HOLES[holeIdx].par + 5; sunk(); }
    }
  }
  function draw() {
    if (!W) return;
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1d7a4c'); grd.addColorStop(1, '#145c39');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    var ws = wallsPx(), i;
    ctx.fillStyle = '#8a6b46';
    for (i = 0; i < ws.length; i++) { var wr = ws[i]; ctx.fillRect(wr.x, wr.y, wr.w, wr.h); }
    var h = px(HOLES[holeIdx].hole);
    ctx.fillStyle = '#06230f';
    ctx.beginPath(); ctx.arc(h.x, h.y, holeR(), 0, 7); ctx.fill();
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x, h.y - 34); ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.moveTo(h.x, h.y - 34); ctx.lineTo(h.x + 20, h.y - 27); ctx.lineTo(h.x, h.y - 20); ctx.closePath(); ctx.fill();
    if (state !== 'done') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, br(), 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.arc(ball.x - br() * 0.3, ball.y - br() * 0.3, br() * 0.5, 0, 7); ctx.fill();
    }
    if (state === 'aim' && !ball.moving) {
      var len = 30 + aim.pow * 90;
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + Math.cos(aim.ang) * len, ball.y + Math.sin(aim.ang) * len); ctx.stroke();
      ctx.setLineDash([]);
      var bw = 120, bx = 14, by = H - 26;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, by, bw, 12);
      ctx.fillStyle = aim.pow > 0.8 ? '#e63946' : aim.pow > 0.5 ? '#ffd166' : '#6df7ea';
      ctx.fillRect(bx, by, bw * aim.pow, 12);
      ctx.fillStyle = '#fff'; ctx.font = '12px system-ui';
      ctx.fillText('POWER', bx, by - 4);
    }
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = 'bold 14px system-ui';
    ctx.fillText('Hole ' + (holeIdx + 1) + '/3 \u00B7 Par ' + HOLES[holeIdx].par + ' \u00B7 Strokes ' + strokes, 12, 22);
  }
  function loop() {
    step(); draw();
    S.raf(requestAnimationFrame(loop));
  }
  function evtPos(e) {
    var rc = cv.getBoundingClientRect();
    return { x: e.clientX - rc.left, y: e.clientY - rc.top };
  }
  S.on(cv, 'pointerdown', function (e) {
    if (state !== 'aim' || ball.moving) return;
    var p = evtPos(e);
    if (Math.hypot(p.x - ball.x, p.y - ball.y) < 90) {
      dragging = true;
      try { cv.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
      e.preventDefault();
    }
  });
  S.on(cv, 'pointermove', function (e) {
    if (!dragging) return;
    var p = evtPos(e);
    var dx = ball.x - p.x, dy = ball.y - p.y, len = Math.hypot(dx, dy);
    if (len > 8) {
      aim.ang = Math.atan2(dy, dx);
      aim.pow = Math.min(1, Math.max(0.12, len / 220));
    }
  });
  S.on(cv, 'pointerup', function () { if (dragging) { dragging = false; shoot(); } });
  S.on(cv, 'pointercancel', function () { dragging = false; });
  S.on(document, 'keydown', function (e) {
    if (state !== 'aim' || ball.moving) { if (e.key === 'Enter' && state === 'done') return; return; }
    var k = e.key, used = true;
    if (k === 'ArrowLeft') aim.ang -= 0.07;
    else if (k === 'ArrowRight') aim.ang += 0.07;
    else if (k === 'ArrowUp') aim.pow = Math.min(1, aim.pow + 0.05);
    else if (k === 'ArrowDown') aim.pow = Math.max(0.12, aim.pow - 0.05);
    else if (k === ' ' || k === 'Enter') shoot();
    else used = false;
    if (used) e.preventDefault();
  });
  S.on(window, 'resize', resize);
  init();
  loop();
  container._cleanup = function () { S.cleanup(); };
}

/* ================= 8. BOWLING (3 frames) ================= */
function loadBowling(container) {
  container.innerHTML = ''; kgCss();
  var S = kgScope();
  var ui = kgHead(container, S, '\uD83C\uDFB3 Bowling', init);
  var body = ui.body, scoreEl = ui.scoreEl, statusEl = ui.statusEl;
  var cv = document.createElement('canvas');
  cv.className = 'kg-cv';
  body.appendChild(cv);
  var ctx = cv.getContext('2d');
  var under = kgMk('div', 'kg-under');
  ui.wrap.appendChild(under);
  var phaseBtn = kgMk('button', 'kg-btn', 'Set position');
  under.appendChild(phaseBtn);
  S.on(phaseBtn, 'click', advance);

  var W, H, phase, ballX, aimAng, power, powerDir, ball, pins, frameIdx, frames, rollPins, counted, settleT, ballGone;
  var PINF = [];
  (function () {
    var rows = [[0.355, 1], [0.29, 2], [0.225, 3], [0.16, 4]];
    for (var i = 0; i < rows.length; i++) for (var j = 0; j < rows[i][1]; j++)
      PINF.push({ fx: 0.5 + (j - (rows[i][1] - 1) / 2) * 0.095, fy: rows[i][0] });
  })();
  function resize() {
    var ow = W || 1;
    W = Math.max(220, body.clientWidth - 4);
    H = Math.max(300, body.clientHeight - 4);
    cv.width = W; cv.height = H;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    if (pins) for (var i = 0; i < pins.length; i++) { pins[i].x *= W / ow; }
    if (ball && !ball.thrown) ball.x = ballX * W;
  }
  function pinR() { return Math.max(9, W * 0.028); }
  function ballR() { return Math.max(11, W * 0.036); }
  function resetPins() {
    pins = PINF.map(function (f) { return { x: f.fx * W, y: f.fy * H, vx: 0, vy: 0, down: false }; });
  }
  function init() {
    kgClearMsg(body);
    frameIdx = 0; frames = [];
    resize();
    newFrame();
  }
  function newFrame() {
    resetPins();
    counted = 0;
    frames.push({ rolls: [] });
    startRoll();
  }
  function startRoll() {
    phase = 'pos'; ballX = 0.5; aimAng = 0; power = 0.5; powerDir = 1;
    ball = { x: ballX * W, y: 0.86 * H, vx: 0, vy: 0, thrown: false };
    rollPins = 0; settleT = 0; ballGone = false;
    phaseBtn.disabled = false;
    phaseBtn.textContent = '\u2713 Set position';
    statusEl.textContent = 'Frame ' + (frameIdx + 1) + ' of 3 \u00B7 Roll ' + (frames[frameIdx].rolls.length + 1) + ' \u2014 drag or \u2190 \u2192 to place the ball.';
  }
  function advance() {
    if (phase === 'pos') { phase = 'aim'; phaseBtn.textContent = '\u2713 Set aim'; statusEl.textContent = 'Aim the throw \u2014 drag or \u2190 \u2192, then confirm.'; }
    else if (phase === 'aim') { phase = 'power'; phaseBtn.textContent = '\uD83C\uDFB3 THROW!'; statusEl.textContent = 'Lock the power when the meter feels right!'; }
    else if (phase === 'power') { throwBall(); }
  }
  function throwBall() {
    phase = 'roll';
    phaseBtn.disabled = true;
    phaseBtn.textContent = '\u2026rolling\u2026';
    var spd = 5 + power * 9;
    ball.vx = Math.sin(aimAng) * spd;
    ball.vy = -Math.cos(aimAng) * spd;
    ball.thrown = true;
    statusEl.textContent = 'Strike zone!';
  }
  function knockPin(p, vx, vy) {
    if (p.down) return;
    p.down = true;
    p.vx = vx; p.vy = vy;
  }
  function step() {
    var i, j;
    if (phase === 'power') {
      power += powerDir * 0.028;
      if (power >= 1) { power = 1; powerDir = -1; }
      if (power <= 0) { power = 0; powerDir = 1; }
    }
    if (phase === 'roll' && ball.thrown && !ballGone) {
      ball.x += ball.vx; ball.y += ball.vy;
      ball.vx *= 0.999; ball.vy *= 0.9995;
      var br2 = ballR(), pr = pinR();
      for (i = 0; i < pins.length; i++) {
        var p = pins[i];
        if (p.down) continue;
        var dx = p.x - ball.x, dy = p.y - ball.y, d = Math.hypot(dx, dy);
        if (d < br2 + pr) {
          knockPin(p, ball.vx * 0.55 + dx * 0.3, ball.vy * 0.55 + dy * 0.3);
          ball.vx = ball.vx * 0.94 + dx * 0.02;
          ball.vy = ball.vy * 0.97;
        }
      }
      if (ball.y < H * 0.04 || ball.x < -40 || ball.x > W + 40) { ballGone = true; }
    }
    var moving = false;
    for (i = 0; i < pins.length; i++) {
      var q = pins[i];
      if (Math.abs(q.vx) > 0.01 || Math.abs(q.vy) > 0.01) {
        q.x += q.vx; q.y += q.vy;
        q.vx *= 0.94; q.vy *= 0.94;
        if (Math.hypot(q.vx, q.vy) < 0.25) { q.vx = 0; q.vy = 0; }
        else moving = true;
      }
    }
    /* pin-pin chain knocks */
    for (i = 0; i < pins.length; i++) {
      var a = pins[i];
      if (!a.down || (a.vx === 0 && a.vy === 0)) continue;
      for (j = 0; j < pins.length; j++) {
        if (i === j) continue;
        var s = pins[j];
        if (s.down) continue;
        var ddx = s.x - a.x, ddy = s.y - a.y;
        if (Math.hypot(ddx, ddy) < pinR() * 2.1)
          knockPin(s, a.vx * 0.55 + ddx * 0.2, a.vy * 0.55 + ddy * 0.2);
      }
    }
    if (phase === 'roll' && ballGone && !moving) {
      settleT++;
      if (settleT > 25) endRoll();
    }
  }
  function endRoll() {
    phase = 'settle';
    var now = 0, i;
    for (i = 0; i < pins.length; i++) if (pins[i].down) now++;
    var fresh = now - counted;
    counted = now;
    frames[frameIdx].rolls.push(fresh);
    var f = frames[frameIdx];
    var frameDone = (f.rolls.length === 2) || (f.rolls[0] === 10);
    S.to(setTimeout(function () {
      if (frameDone) {
        if (frameIdx < 2) { frameIdx++; newFrame(); }
        else gameOver();
      } else startRoll();
    }, 900));
  }
  function totalScore() {
    var t = 0;
    for (var i = 0; i < frames.length; i++) for (var j = 0; j < frames[i].rolls.length; j++) t += frames[i].rolls[j];
    return t;
  }
  function frameText(f) {
    if (!f.rolls.length) return '\u2013';
    return f.rolls.map(function (n, i) { return (i === 0 && n === 10) ? 'X' : String(n); }).join(' + ');
  }
  function gameOver() {
    var t = totalScore();
    var verdict = t >= 25 ? '\uD83C\uDFC6 Bowling champion!' : t >= 15 ? '\uD83D\uDC4F Great game!' : t >= 8 ? 'Nice try \u2014 aim for the head pin!' : 'Good effort \u2014 practice makes strikes!';
    kgMsg(body, S, 'Game over!', 'Final score: ' + t + ' / 30. Frames: ' +
      frames.map(function (f, i) { return 'F' + (i + 1) + ': ' + frameText(f); }).join(' \u00B7 ') + '. ' + verdict, 'Play again', init);
    statusEl.textContent = 'Final score: ' + t + ' / 30';
  }
  function draw() {
    if (!W) return;
    var grd = ctx.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, '#5b3a1e'); grd.addColorStop(0.5, '#8a5a2b'); grd.addColorStop(1, '#5b3a1e');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c89b5e';
    ctx.fillRect(W * 0.3, 0, W * 0.4, H);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    var gx;
    for (gx = 0.35; gx <= 0.66; gx += 0.1) {
      ctx.beginPath(); ctx.moveTo(W * gx, H * 0.45); ctx.lineTo(W * gx, H); ctx.stroke();
    }
    var i, pr = pinR();
    for (i = 0; i < pins.length; i++) {
      var p = pins[i];
      ctx.save();
      ctx.globalAlpha = p.down ? 0.55 : 1;
      ctx.fillStyle = p.down ? '#c9a' : '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, 7); ctx.fill();
      ctx.fillStyle = '#e63946';
      ctx.fillRect(p.x - pr, p.y - pr * 0.35, pr * 2, pr * 0.35);
      ctx.restore();
    }
    if (ball && !ballGone) {
      ctx.fillStyle = '#20303c';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ballR(), 0, 7); ctx.fill();
      ctx.fillStyle = '#6df7ea';
      ctx.beginPath(); ctx.arc(ball.x - 3, ball.y - 3, 3, 0, 7); ctx.fill();
    }
    if (phase === 'pos' || phase === 'aim') {
      ctx.strokeStyle = 'rgba(255,209,102,.85)'; ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      var bx = ballX * W;
      ctx.beginPath(); ctx.moveTo(bx, H * 0.5); ctx.lineTo(bx, H * 0.95); ctx.stroke();
      if (phase === 'aim') {
        ctx.beginPath(); ctx.moveTo(bx, H * 0.86);
        ctx.lineTo(bx + Math.sin(aimAng) * 160, H * 0.86 - Math.cos(aimAng) * 160); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    if (phase === 'power') {
      var bw = Math.min(200, W * 0.6), bx2 = (W - bw) / 2, by2 = H - 40;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx2, by2, bw, 16);
      ctx.fillStyle = power > 0.8 ? '#e63946' : power > 0.5 ? '#ffd166' : '#6df7ea';
      ctx.fillRect(bx2, by2, bw * power, 16);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui';
      ctx.fillText('POWER \u2014 tap THROW to lock!', bx2, by2 - 6);
    }
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = 'bold 13px system-ui';
    var ft = frames.map(function (f, i) { return 'F' + (i + 1) + ':' + frameText(f); }).join('  ');
    ctx.fillText(ft + '   Total ' + totalScore(), 10, 20);
  }
  function loop() {
    step(); draw();
    S.raf(requestAnimationFrame(loop));
  }
  function evtX(e) {
    var rc = cv.getBoundingClientRect();
    return (e.clientX - rc.left) / rc.width;
  }
  var dragId = null;
  S.on(cv, 'pointerdown', function (e) {
    if (phase !== 'pos' && phase !== 'aim') return;
    dragId = e.pointerId;
    adjust(evtX(e));
    e.preventDefault();
  });
  S.on(cv, 'pointermove', function (e) {
    if (e.pointerId !== dragId) return;
    adjust(evtX(e));
  });
  function endDrag(e) { if (e.pointerId === dragId) dragId = null; }
  S.on(cv, 'pointerup', endDrag);
  S.on(cv, 'pointercancel', endDrag);
  function adjust(fx) {
    if (phase === 'pos') ballX = Math.min(0.7, Math.max(0.3, fx));
    else if (phase === 'aim') aimAng = Math.min(0.3, Math.max(-0.3, (fx - ballX) * 1.2));
    if (ball && !ball.thrown) ball.x = ballX * W;
  }
  S.on(document, 'keydown', function (e) {
    var k = e.key, used = true;
    if (phase === 'pos' && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      ballX = Math.min(0.7, Math.max(0.3, ballX + (k === 'ArrowRight' ? 0.02 : -0.02)));
      if (ball && !ball.thrown) ball.x = ballX * W;
    }
    else if (phase === 'aim' && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      aimAng = Math.min(0.3, Math.max(-0.3, aimAng + (k === 'ArrowRight' ? 0.02 : -0.02)));
    }
    else if (k === ' ' || k === 'Enter') { if (!phaseBtn.disabled) advance(); }
    else used = false;
    if (used) e.preventDefault();
  });
  S.on(window, 'resize', resize);
  init();
  loop();
  container._cleanup = function () { S.cleanup(); };
}
