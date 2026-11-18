const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../index.html') + '?debug';
// Usage: node maze-chase/tests/stress.js  (needs Playwright + Chromium)

// Runs inside the page. mode: 'random' | 'bot'; dtMode: 'fixed60' | 'fixed20' | 'jitter'
function sim({ seconds, mode, dtMode, immortal }) {
  const G = window.__orb, T = G.T, issues = {}; let frames = 0;
  const note = (k, info) => { issues[k] = issues[k] || { count: 0, first: info }; issues[k].count++; };
  const dirs = ['up','down','left','right'];
  const D = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const stuck = new Map(); let levelsCleared = 0, deaths = 0, eaten = 0, lastState = G.state, lastLives = G.lives;
  let prevRel = null;

  function bfsDir() { // walk to nearest spark
    const p = G.player, g = G.grid, seen = new Set([p.x+','+p.y]), q = [[p.x,p.y,null]];
    while (q.length) {
      const [x,y,first] = q.shift();
      if (first && (g[y][x]==='.'||g[y][x]==='o')) return first;
      for (const d of dirs) { let nx=(x+D[d][0]+G.COLS)%G.COLS, ny=y+D[d][1];
        const k=nx+','+ny; if (seen.has(k) || !G.walkable(nx,ny,p)) continue; seen.add(k); q.push([nx,ny,first||d]); }
    }
    return null;
  }

  const total = seconds;
  let t = 0;
  while (t < total) {
    const dt = dtMode==='fixed60' ? 1/60 : dtMode==='fixed20' ? 0.05 : Math.min(0.05, 0.004 + Math.random()*0.06);
    t += dt; frames++;
    if (immortal && G.lives < 3) G.lives = 3;
    if (G.state === 'over') { G.newGame(); }
    if (mode === 'random' && Math.random() < 0.03) G.steer(dirs[Math.floor(Math.random()*4)]);
    if (mode === 'bot' && G.state === 'play') { const d = bfsDir(); if (d) G.steer(d); }

    const beforeState = G.state;
    G.update(dt);
    if (frames % 600 === 0) G.draw(); // exercise drawing too

    if (beforeState !== 'cleared' && G.state === 'cleared') levelsCleared++;
    if (G.lives < lastLives) deaths++;
    lastLives = G.lives;

    // spark count consistency
    let cnt = 0; for (const r of G.grid) for (const c of r) if (c==='.'||c==='o') cnt++;
    if (cnt !== G.sparksLeft) note('sparkCountMismatch', { cnt, s: G.sparksLeft });

    const ents = [['player', G.player], ...G.enemies.map((e,i)=>['enemy'+i, e])];
    for (const [name, e] of ents) {
      if (![e.px,e.py,e.x,e.y].every(Number.isFinite)) note('NaN', { name });
      const tc = G.grid[e.y] && G.grid[e.y][((e.x%G.COLS)+G.COLS)%G.COLS];
      if (tc === undefined || tc === '#' || tc === ' ' ) note('insideWall', { name, x:e.x, y:e.y, tc, mode:e.mode });
      if (name === 'player' && (tc === 'E' || tc === '=')) note('playerInPen', { x:e.x, y:e.y });
      if (e.isEnemy && e.mode === 'roam' && !e.frightened && (tc === 'E' || tc === '=')) note('roamerInPen', { name, x:e.x, y:e.y });
      // off-axis drift
      const cx = e.x*T+T/2, cy = e.y*T+T/2;
      if (e.dir.x && Math.abs(e.py-cy) > 0.01) note('offAxisY', { name, py:e.py, cy });
      if (e.dir.y && Math.abs(e.px-cx) > 0.01) note('offAxisX', { name, px:e.px, cx });
      if (Math.floor(e.px/T) !== e.x || Math.floor(e.py/T) !== e.y) note('tileDesync', { name, px:e.px, x:e.x, py:e.py, y:e.y });
      // stuck detection (enemies) during play
      if (e.isEnemy && G.state === 'play') {
        const s = stuck.get(e) || { mode: e.mode, t: 0, still: 0, lx: e.px, ly: e.py };
        if (s.mode !== e.mode) { s.mode = e.mode; s.t = 0; }
        s.t += dt;
        if (e.px === s.lx && e.py === s.ly && e.mode !== 'pen') s.still += dt; else s.still = 0;
        s.lx = e.px; s.ly = e.py;
        if (s.still > 0.5) note('enemyFrozen', { name, mode: e.mode, x:e.x, y:e.y, dir:e.dir });
        if (e.mode === 'leaving' && s.t > 6) note('slowLeave', { name, x:e.x, y:e.y });
        if (e.mode === 'returning' && s.t > 8) note('slowReturn', { name, x:e.x, y:e.y });
        if (s.t > 0 && e.mode === 'returning' && s.t < dt*1.5) eaten++;
        stuck.set(e, s);
      }
    }
    // player frozen though a valid queued direction exists at a center
    const p = G.player;
    if (G.state === 'play' && !p.dir.x && !p.dir.y && (p.next.x||p.next.y) && G.walkable(p.x+p.next.x, p.y+p.next.y, p)) note('playerIgnoresInput', { x:p.x, y:p.y });

    // pass-through detection: dangerous enemy and player swapped sides on a shared axis without a hit
    if (G.state === 'play') {
      const rel = G.enemies.map(e => ({ dx: e.px - p.px, dy: e.py - p.py, ok: e.mode==='roam' && !e.frightened }));
      if (prevRel) rel.forEach((r,i) => { const o = prevRel[i];
        if (r.ok && o.ok && Math.abs(r.dy)<1 && Math.abs(o.dy)<1 && Math.sign(r.dx)!==Math.sign(o.dx) && Math.abs(r.dx)<T && Math.abs(o.dx)<T) note('passThrough', { i, o, r });
        if (r.ok && o.ok && Math.abs(r.dx)<1 && Math.abs(o.dx)<1 && Math.sign(r.dy)!==Math.sign(o.dy) && Math.abs(r.dy)<T && Math.abs(o.dy)<T) note('passThrough', { i, o, r });
      });
      prevRel = rel;
    } else prevRel = null;
  }
  return { frames, levelsCleared, deaths, level: G.level, issues };
}

(async () => {
  const b = await chromium.launch();
  const runs = [
    { seconds: 600, mode: 'random', dtMode: 'fixed60', immortal: true },
    { seconds: 600, mode: 'random', dtMode: 'jitter',  immortal: true },
    { seconds: 900, mode: 'bot',    dtMode: 'fixed60', immortal: true },
    { seconds: 900, mode: 'bot',    dtMode: 'fixed20', immortal: true },
    { seconds: 600, mode: 'random', dtMode: 'fixed60', immortal: false },
  ];
  for (const r of runs) {
    const p = await b.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL);
    const res = await p.evaluate(sim, r);
    console.log(JSON.stringify(r), '\n  =>', JSON.stringify({ ...res, errs }));
    await p.close();
  }
  await b.close();
})();
