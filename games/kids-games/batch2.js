/* Waqas Game Hub - Kids Hub batch 2: 8 original playable mini-games.
   Plain script: no modules, no imports, no network calls.
   Each loadX(container) builds its UI inside container and sets
   container._cleanup to cancel all RAF/interval/timeout ids and remove
   every event listener it added. */

/* ============ 1. loadMaze - Maze Munch: eat all dots, dodge 2 ghosts ============ */
function loadMaze(container){
container.innerHTML='<style>'
+'.mzw{position:absolute;inset:0;background:#0a0e2a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.mzh{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(2,4,20,.6);font-size:15px}'
+'.mzh button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px}'
+'.mzo{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(2,4,20,.82);text-align:center;padding:20px}'
+'.mzo button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.mzw canvas{position:absolute;inset:0;display:block}'
+'</style>'
+'<div class="mzw"><div class="mzh"><span>🟡 <b id="mzs">0</b>&nbsp;&nbsp;❤️ <b id="mzl">3</b>&nbsp;&nbsp;🏁 Lv <b id="mzv">1</b></span><button id="mzr">↻ Restart</button></div>'
+'<canvas id="mzc"></canvas>'
+'<div class="mzo" id="mzo"><h2 id="mzm" style="margin:0"></h2><p id="mzd" style="margin:0;opacity:.85"></p><button id="mza">▶ Play Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#mzc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var intervals=[],timeouts=[],listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);intervals.forEach(clearInterval);timeouts.forEach(clearTimeout);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
var COLS=19,ROWS=15,grid=[],dots={};
var score=0,lives=3,level=1,over=false,freeze=0,lvlT=0,ghostSp=4.0;
var P={x:1,y:1,dx:0,dy:0,qx:0,qy:0};
var ghosts=[];
function openAt(c,r){return c>=0&&r>=0&&c<COLS&&r<ROWS&&grid[r][c]===0;}
function genMaze(){
  grid=[];
  var r,c;
  for(r=0;r<ROWS;r++){var row=[];for(c=0;c<COLS;c++)row.push(1);grid.push(row);}
  var stack=[[1,1]];grid[1][1]=0;
  var dd=[[2,0],[-2,0],[0,2],[0,-2]];
  while(stack.length){
    var cur=stack[stack.length-1],cx=cur[0],cy=cur[1],nbrs=[],i;
    for(i=0;i<4;i++){var nx=cx+dd[i][0],ny=cy+dd[i][1];
      if(nx>0&&ny>0&&nx<COLS-1&&ny<ROWS-1&&grid[ny][nx]===1)nbrs.push([nx,ny]);}
    if(!nbrs.length){stack.pop();continue;}
    var n=nbrs[(Math.random()*nbrs.length)|0];
    grid[(cy+n[1])/2|0][(cx+n[0])/2|0]=0;grid[n[1]][n[0]]=0;
    stack.push(n);
  }
}
function resetDots(){dots={};var r,c;for(r=0;r<ROWS;r++)for(c=0;c<COLS;c++){if(grid[r][c]===0&&!(c===1&&r===1))dots[c+','+r]=1;}}
function resetPos(){
  P.x=1;P.y=1;P.dx=0;P.dy=0;P.qx=0;P.qy=0;
  ghosts=[{x:COLS-2,y:1,dx:0,dy:0,color:'#ff4d6d'},{x:1,y:ROWS-2,dx:0,dy:0,color:'#4dd2ff'}];
}
function hud(){q('#mzs').textContent=score;q('#mzl').textContent=lives;q('#mzv').textContent=level;}
function gameOver(msg,sub){
  over=true;cancelAnimationFrame(raf);
  q('#mzm').textContent=msg;q('#mzd').textContent=sub;
  q('#mzo').style.display='flex';
}
function pickDirP(cx,cy){
  if((P.qx||P.qy)&&openAt(cx+P.qx,cy+P.qy))return{x:P.qx,y:P.qy};
  if((P.dx||P.dy)&&openAt(cx+P.dx,cy+P.dy))return{x:P.dx,y:P.dy};
  return{x:0,y:0};
}
function pickDirG(g,cx,cy){
  var opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(d){
    if(d[0]===-g.dx&&d[1]===-g.dy)return false;
    return openAt(cx+d[0],cy+d[1]);
  });
  if(!opts.length)return{x:-g.dx,y:-g.dy};
  if(Math.random()<0.16){var pk=opts[(Math.random()*opts.length)|0];return{x:pk[0],y:pk[1]};}
  var best=opts[0],bd=1e9,i;
  for(i=0;i<opts.length;i++){
    var d=Math.abs(cx+opts[i][0]-P.x)+Math.abs(cy+opts[i][1]-P.y);
    if(d<bd){bd=d;best=opts[i];}
  }
  return{x:best[0],y:best[1]};
}
function stepMover(e,sp,dt,pick){
  var cx=Math.round(e.x),cy=Math.round(e.y);
  if(Math.abs(e.x-cx)<0.07&&Math.abs(e.y-cy)<0.07){
    e.x=cx;e.y=cy;
    var d=pick(cx,cy);e.dx=d.x;e.dy=d.y;
  }
  e.x+=e.dx*sp*dt;e.y+=e.dy*sp*dt;
}
function update(dt){
  stepMover(P,6.0,dt,pickDirP);
  var i;
  for(i=0;i<ghosts.length;i++){
    (function(g){stepMover(g,ghostSp,dt,function(cx,cy){return pickDirG(g,cx,cy);});})(ghosts[i]);
  }
  var cx=Math.round(P.x),cy=Math.round(P.y),k=cx+','+cy;
  if(dots[k]){delete dots[k];score+=10;hud();
    if(Object.keys(dots).length===0){
      level++;score+=100;ghostSp=Math.min(6.2,ghostSp+0.5);
      resetDots();resetPos();freeze=1.0;lvlT=1.6;hud();
    }
  }
  for(i=0;i<ghosts.length;i++){
    var g=ghosts[i],dx=g.x-P.x,dy=g.y-P.y;
    if(dx*dx+dy*dy<0.3&&freeze<=0){
      lives--;hud();
      if(lives<=0){gameOver('💀 Game Over','Final score: '+score);return;}
      resetPos();freeze=1.4;return;
    }
  }
}
function drawGhost(x,y,r,color,dx,dy,t){
  ctx.fillStyle=color;
  ctx.beginPath();ctx.arc(x,y-r*0.25,r,Math.PI,0);ctx.closePath();ctx.fill();
  ctx.fillRect(x-r,y-r*0.25,r*2,r*0.9);
  ctx.beginPath();
  var i;
  for(i=0;i<4;i++){var sx=x-r+i*r*0.66+0.08*r;ctx.moveTo(sx,y+r*0.65);ctx.lineTo(sx+r*0.33,y+r*0.65);ctx.lineTo(sx+r*0.16,y+r*0.28+Math.sin(t*10+i)*2);}
  ctx.fill();
  var ex=dx*r*0.22,ey=dy*r*0.22;
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(x-r*0.36+ex,y-r*0.3+ey,r*0.3,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(x+r*0.36+ex,y-r*0.3+ey,r*0.3,0,7);ctx.fill();
  ctx.fillStyle='#123';
  ctx.beginPath();ctx.arc(x-r*0.36+ex*2,y-r*0.3+ey*2,r*0.14,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(x+r*0.36+ex*2,y-r*0.3+ey*2,r*0.14,0,7);ctx.fill();
}
function draw(){
  var cw=cv.width,ch=cv.height;
  ctx.fillStyle='#0a0e2a';ctx.fillRect(0,0,cw,ch);
  var s=Math.min(cw/COLS,ch/ROWS);
  var ox=(cw-COLS*s)/2,oy=(ch-ROWS*s)/2,r,c;
  for(r=0;r<ROWS;r++)for(c=0;c<COLS;c++){
    if(grid[r][c]===1){
      ctx.fillStyle='#26379e';ctx.fillRect(ox+c*s+0.5,oy+r*s+0.5,s-1,s-1);
      ctx.fillStyle='#3b53d6';ctx.fillRect(ox+c*s+2,oy+r*s+2,s-4,3);
    }
  }
  ctx.fillStyle='#ffd9a0';
  for(var k in dots){
    var p=k.split(','),dx2=ox+(+p[0]+0.5)*s,dy2=oy+(+p[1]+0.5)*s;
    ctx.beginPath();ctx.arc(dx2,dy2,Math.max(2,s*0.09),0,7);ctx.fill();
  }
  var t=performance.now()/1000;
  var i;
  for(i=0;i<ghosts.length;i++){var g=ghosts[i];drawGhost(ox+(g.x+0.5)*s,oy+(g.y+0.5)*s,s*0.42,g.color,g.dx,g.dy,t);}
  var px=ox+(P.x+0.5)*s,py=oy+(P.y+0.5)*s,pr=s*0.4;
  ctx.fillStyle='#ffd93b';
  ctx.beginPath();ctx.arc(px,py,pr,0,7);ctx.fill();
  ctx.fillStyle='#0a0e2a';
  var ex2=(P.dx||1)*pr*0.3,ey2=(P.dy)*pr*0.3;
  ctx.beginPath();ctx.arc(px+ex2-pr*0.15,py+ey2-pr*0.25,pr*0.16,0,7);ctx.fill();
  if(lvlT>0){
    ctx.fillStyle='rgba(255,209,102,'+Math.min(1,lvlT)+')';
    ctx.font='bold '+Math.round(s*1.4)+'px system-ui';ctx.textAlign='center';
    ctx.fillText('LEVEL '+level,cw/2,ch/2);
  }
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over){if(freeze>0)freeze-=dt;else update(dt);}
  if(lvlT>0)lvlT-=dt;
  draw();
}
function keyH(e){
  var k=e.key.toLowerCase(),d=null;
  if(k==='arrowup'||k==='w')d={x:0,y:-1};
  else if(k==='arrowdown'||k==='s')d={x:0,y:1};
  else if(k==='arrowleft'||k==='a')d={x:-1,y:0};
  else if(k==='arrowright'||k==='d')d={x:1,y:0};
  if(d){P.qx=d.x;P.qy=d.y;e.preventDefault();}
}
on(document,'keydown',keyH);
var swp=null;
on(cv,'pointerdown',function(e){swp={x:e.clientX,y:e.clientY};});
on(cv,'pointerup',function(e){
  if(!swp)return;
  var dx=e.clientX-swp.x,dy=e.clientY-swp.y;swp=null;
  if(Math.abs(dx)<24&&Math.abs(dy)<24)return;
  if(Math.abs(dx)>Math.abs(dy)){P.qx=dx>0?1:-1;P.qy=0;}else{P.qx=0;P.qy=dy>0?1:-1;}
});
function restart(){container._cleanup();loadMaze(container);}
q('#mzr').onclick=restart;q('#mza').onclick=restart;
genMaze();resetDots();resetPos();hud();
last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 2. loadFly - Waqas Fly: flap through the pipes ============ */
function loadFly(container){
container.innerHTML='<style>'
+'.flw{position:absolute;inset:0;background:#79c7f2;overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.flh{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:16px;font-weight:700;color:#08304a}'
+'.flh button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px}'
+'.flo{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(4,30,48,.75);color:#fff;text-align:center;padding:20px}'
+'.flo button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.flw canvas{position:absolute;inset:0;display:block}'
+'</style>'
+'<div class="flw"><div class="flh"><span>⭐ <b id="fls">0</b>&nbsp;&nbsp;🏆 <b id="flb">0</b></span><button id="flr">↻ Restart</button></div>'
+'<canvas id="flc"></canvas>'
+'<div class="flo" id="flo"><h2 style="margin:0">💥 Game Over</h2><p id="fld" style="margin:0"></p><button id="fla">▶ Fly Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#flc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
var score=0,best=0;
try{best=parseInt(localStorage.getItem('kg_fly_best')||'0',10)||0;}catch(e){}
q('#flb').textContent=best;
var state='ready';
var bird={y:200,vy:0,r:15};
var pipes=[],spawnT=0,clouds=[];
var i;
for(i=0;i<5;i++)clouds.push({x:Math.random()*800,y:40+Math.random()*180,s:0.6+Math.random()*0.9});
function dims(){
  var W=cv.width,H=cv.height;
  return{W:W,H:H,bx:W*0.32,gap:Math.max(150,H*0.28),pw:76,gy:H-46};
}
function flap(){
  if(state==='over')return;
  if(state==='ready'){state='play';}
  bird.vy=-470;
}
function die(){
  state='over';cancelAnimationFrame(raf);
  if(score>best){best=score;try{localStorage.setItem('kg_fly_best',''+best);}catch(e){}}
  q('#flb').textContent=best;
  q('#fld').textContent='Score: '+score+'   •   Best: '+best;
  q('#flo').style.display='flex';
}
function hitRect(cx,cy,cr,rx,ry,rw,rh){
  var nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));
  var dx=cx-nx,dy=cy-ny;return dx*dx+dy*dy<cr*cr;
}
function update(dt){
  var D=dims(),speed=Math.min(390,215+score*3);
  bird.vy+=1600*dt;bird.y+=bird.vy*dt;
  if(bird.y<0){bird.y=0;bird.vy=0;}
  var i;
  for(i=0;i<clouds.length;i++){clouds[i].x-=30*dt;if(clouds[i].x<-120)clouds[i].x=D.W+120;}
  spawnT-=dt;
  if(spawnT<=0){
    spawnT=1.45;
    var gy2=80+Math.random()*(D.H-D.gap-160);
    pipes.push({x:D.W+40,gapY:gy2,passed:false});
  }
  for(i=pipes.length-1;i>=0;i--){
    var p=pipes[i];p.x-=speed*dt;
    if(!p.passed&&p.x+D.pw<D.bx){p.passed=true;score++;q('#fls').textContent=score;}
    if(p.x<-D.pw-20)pipes.splice(i,1);
  }
  var bx=D.bx;
  for(i=0;i<pipes.length;i++){
    var q2=pipes[i];
    if(hitRect(bx,bird.y,bird.r,q2.x,0,D.pw,q2.gapY)||hitRect(bx,bird.y,bird.r,q2.x,q2.gapY+D.gap,D.pw,D.H)){die();return;}
  }
  if(bird.y+bird.r>=D.gy){bird.y=D.gy-bird.r;die();}
}
function drawPipe(x,y,w,h,cap){
  var g=ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,'#3d9e4d');g.addColorStop(0.5,'#63d471');g.addColorStop(1,'#2e7d3b');
  ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#2e7d3b';ctx.fillRect(x-4,cap?y:y+h-26,w+8,26);
  ctx.fillStyle='#8fe39a';ctx.fillRect(x-4,cap?y:y+h-26,w+8,5);
}
function draw(){
  var D=dims(),t=performance.now()/1000;
  var g=ctx.createLinearGradient(0,0,0,D.H);
  g.addColorStop(0,'#6ec3f0');g.addColorStop(1,'#cdeffd');
  ctx.fillStyle=g;ctx.fillRect(0,0,D.W,D.H);
  var i;
  ctx.fillStyle='rgba(255,255,255,.9)';
  for(i=0;i<clouds.length;i++){var c=clouds[i];
    ctx.beginPath();ctx.arc(c.x,c.y,26*c.s,0,7);ctx.arc(c.x+28*c.s,c.y+6*c.s,20*c.s,0,7);ctx.arc(c.x-28*c.s,c.y+7*c.s,19*c.s,0,7);ctx.fill();}
  for(i=0;i<pipes.length;i++){var p=pipes[i];
    drawPipe(p.x,0,D.pw,p.gapY,false);
    drawPipe(p.x,p.gapY+D.gap,D.pw,D.H-(p.gapY+D.gap),true);
  }
  ctx.fillStyle='#8a6a45';ctx.fillRect(0,D.gy,D.W,D.H-D.gy);
  ctx.fillStyle='#5fae4e';ctx.fillRect(0,D.gy,D.W,10);
  var bx=D.bx,by=bird.y,r=bird.r;
  var tilt=Math.max(-0.4,Math.min(0.7,bird.vy/900));
  ctx.save();ctx.translate(bx,by);ctx.rotate(tilt);
  ctx.fillStyle='#ffd93b';ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  var wv=Math.sin(t*18)*5;
  ctx.fillStyle='#f5b301';ctx.beginPath();ctx.ellipse(-4,2,10,6+wv,0.5,0,7);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5,-5,5.5,0,7);ctx.fill();
  ctx.fillStyle='#123';ctx.beginPath();ctx.arc(6.5,-5,2.6,0,7);ctx.fill();
  ctx.fillStyle='#ff8c42';ctx.beginPath();ctx.moveTo(r-2,0);ctx.lineTo(r+8,3);ctx.lineTo(r-2,6);ctx.fill();
  ctx.restore();
  if(state==='ready'){
    ctx.fillStyle='#08304a';ctx.font='bold 24px system-ui';ctx.textAlign='center';
    var a=0.6+0.4*Math.sin(t*5);
    ctx.globalAlpha=a;ctx.fillText('👆 Tap to start',D.W/2,D.H*0.4);ctx.globalAlpha=1;
  }
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(state==='play')update(dt);else if(state==='ready'){var i;for(i=0;i<clouds.length;i++){clouds[i].x-=30*dt;if(clouds[i].x<-120)clouds[i].x=dims().W+120;}bird.y=dims().H*0.42+Math.sin(t/400)*10;}
  draw();
}
function keyH(e){
  var k=e.key.toLowerCase();
  if(k===' '||k==='arrowup'||k==='w'){flap();e.preventDefault();}
}
on(document,'keydown',keyH);
on(container,'pointerdown',function(e){if(e.target.closest('button'))return;flap();});
function restart(){container._cleanup();loadFly(container);}
q('#flr').onclick=restart;q('#fla').onclick=restart;
bird.y=dims().H*0.42;
last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 3. loadTurboRace - Turbo Race: dodge highway traffic ============ */
function loadTurboRace(container){
container.innerHTML='<style>'
+'.trw{position:absolute;inset:0;background:#2f9e44;overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.trh{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:16px;font-weight:700;color:#fff;background:rgba(0,40,0,.45)}'
+'.trh button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px}'
+'.tro{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(10,20,10,.8);color:#fff;text-align:center;padding:20px}'
+'.tro button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.trw canvas{position:absolute;inset:0;display:block}'
+'.trb{position:absolute;bottom:18px;z-index:4;width:74px;height:74px;border-radius:50%;border:0;background:rgba(255,255,255,.28);color:#fff;font-size:32px;font-weight:800;touch-action:none}'
+'#trl{left:16px}#trr{right:16px}'
+'</style>'
+'<div class="trw"><div class="trh"><span>🏁 <b id="trs">0</b> m</span><button id="trre">↻ Restart</button></div>'
+'<canvas id="trc"></canvas>'
+'<button class="trb" id="trl">◀</button><button class="trb" id="trr">▶</button>'
+'<div class="tro" id="tro"><h2 style="margin:0">💥 Crash!</h2><p id="trd" style="margin:0"></p><button id="tra">▶ Race Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#trc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
var score=0,elapsed=0,over=false,offset=0;
var px=150,keys={l:false,r:false};
var traffic=[],spawnT=0.6,popups=[];
var tcolors=['#e63946','#f4a261','#9b5de5','#e9ecef','#ff7b00'];
function road(){var W=cv.width;var rw=Math.min(W*0.86,440);return{x:(W-rw)/2,w:rw};}
function laneX(i){var R=road();return R.x+R.w*(i+0.5)/4;}
function gameOver(){
  over=true;cancelAnimationFrame(raf);
  q('#trd').textContent='Distance: '+Math.round(score)+' m';
  q('#tro').style.display='flex';
}
function drawCar(x,y,w,h,color,down){
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-w/2+3,y-h/2+5,w,h);
  ctx.fillStyle=color;
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(x-w/2,y-h/2,w,h,10);else ctx.rect(x-w/2,y-h/2,w,h);
  ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.75)';
  ctx.fillRect(x-w*0.32,down?y-h*0.28:y+h*0.08,w*0.64,h*0.2);
  ctx.fillStyle='#222';
  ctx.fillRect(x-w/2-3,y-h*0.32,4,h*0.2);ctx.fillRect(x+w/2-1,y-h*0.32,4,h*0.2);
  ctx.fillRect(x-w/2-3,y+h*0.12,4,h*0.2);ctx.fillRect(x+w/2-1,y+h*0.12,4,h*0.2);
  ctx.fillStyle='#ffe66d';
  if(down){ctx.fillRect(x-w*0.4,y+h/2-6,10,6);ctx.fillRect(x+w*0.4-10,y+h/2-6,10,6);}
  else{ctx.fillRect(x-w*0.4,y-h/2,10,6);ctx.fillRect(x+w*0.4-10,y-h/2,10,6);}
}
function update(dt){
  elapsed+=dt;
  var speed=Math.min(780,340+elapsed*8);
  offset=(offset+speed*dt)%64;
  if(keys.l)px-=460*dt;
  if(keys.r)px+=460*dt;
  var R=road();
  px=Math.max(R.x+26,Math.min(R.x+R.w-26,px));
  score+=speed*dt*0.045;
  q('#trs').textContent=Math.round(score);
  spawnT-=dt;
  if(spawnT<=0){
    spawnT=Math.max(0.34,0.85-elapsed*0.008);
    var lane=(Math.random()*4)|0,lx=laneX(lane);
    if(Math.abs(lx-px)>50||Math.random()<0.4)
      traffic.push({x:lx,y:-90,vy:speed*0.5+Math.random()*60,c:tcolors[(Math.random()*tcolors.length)|0],counted:false});
  }
  var py=cv.height-150,i;
  for(i=traffic.length-1;i>=0;i--){
    var t=traffic[i];t.y+=t.vy*dt;
    if(t.y>cv.height+100){traffic.splice(i,1);continue;}
    if(Math.abs(t.x-px)<40&&Math.abs(t.y-py)<78){gameOver();return;}
    if(!t.counted&&t.y>py+40){t.counted=true;if(Math.abs(t.x-px)<78){score+=15;popups.push({x:px,y:py-70,txt:'+15 near miss!',life:1});}}
  }
  for(i=popups.length-1;i>=0;i--){popups[i].life-=dt;popups[i].y-=30*dt;if(popups[i].life<=0)popups.splice(i,1);}
}
function draw(){
  var W=cv.width,H=cv.height,R=road(),py=H-150,i;
  ctx.fillStyle='#2f9e44';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#27913d';
  for(i=0;i<8;i++){ctx.fillRect(0,(i*97+offset*0.4)%(H+60)-60,W,30);}
  ctx.fillStyle='#3a3f4a';ctx.fillRect(R.x,0,R.w,H);
  ctx.fillStyle='#ffd166';ctx.fillRect(R.x-5,0,5,H);ctx.fillRect(R.x+R.w,0,5,H);
  ctx.fillStyle='#f1fa8c';
  for(i=1;i<4;i++){var lx=R.x+R.w*i/4;for(var y=-64;y<H+64;y+=64)ctx.fillRect(lx-2,y+offset,4,30);}
  for(i=0;i<traffic.length;i++){var t=traffic[i];drawCar(t.x,t.y,44,78,t.c,true);}
  drawCar(px,py,48,88,'#277bff',false);
  ctx.fillStyle='#fff';ctx.font='bold 15px system-ui';ctx.textAlign='center';
  for(i=0;i<popups.length;i++){ctx.globalAlpha=Math.min(1,popups[i].life*2);ctx.fillText(popups[i].txt,popups[i].x,popups[i].y);ctx.globalAlpha=1;}
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over)update(dt);
  draw();
}
function keyH(e){
  var k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a'){keys.l=true;e.preventDefault();}
  else if(k==='arrowright'||k==='d'){keys.r=true;e.preventDefault();}
}
function keyU(e){
  var k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a')keys.l=false;
  else if(k==='arrowright'||k==='d')keys.r=false;
}
on(document,'keydown',keyH);on(document,'keyup',keyU);
function bindHold(el,prop){
  on(el,'pointerdown',function(e){keys[prop]=true;e.preventDefault();});
  var off=function(){keys[prop]=false;};
  on(el,'pointerup',off);on(el,'pointercancel',off);on(el,'pointerleave',off);
}
bindHold(q('#trl'),'l');bindHold(q('#trr'),'r');
px=laneX(1);
function restart(){container._cleanup();loadTurboRace(container);}
q('#trre').onclick=restart;q('#tra').onclick=restart;
last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 4. loadShooter - Star Defender: vertical space shooter ============ */
function loadShooter(container){
container.innerHTML='<style>'
+'.stw{position:absolute;inset:0;background:#050514;overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.sth{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:15px;font-weight:700;color:#fff;background:rgba(10,10,40,.55)}'
+'.sth button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px;color:#111}'
+'.sto{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(5,5,25,.82);color:#fff;text-align:center;padding:20px}'
+'.sto button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.stw canvas{position:absolute;inset:0;display:block}'
+'</style>'
+'<div class="stw"><div class="sth"><span>⭐ <b id="sts">0</b>&nbsp;&nbsp;❤️ <b id="stl">3</b>&nbsp;&nbsp;🌊 Wave <b id="stwv">1</b></span><button id="stre">↻ Restart</button></div>'
+'<canvas id="stc"></canvas>'
+'<div class="sto" id="sto"><h2 style="margin:0">💥 Game Over</h2><p id="std" style="margin:0"></p><button id="sta">▶ Play Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#stc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
var score=0,lives=3,over=false,invuln=0,elapsed=0;
var ship={x:150,y:300,r:15};
var keys={l:false,r:false,u:false,d:false};
var bullets=[],ebullets=[],enemies=[],parts=[],stars=[];
var fireT=0,spawnT=1,i;
for(i=0;i<70;i++)stars.push({x:Math.random()*900,y:Math.random()*900,s:Math.random()*2+0.5});
function wave(){return Math.floor(score/400)+1;}
function hud(){q('#sts').textContent=score;q('#stl').textContent=lives;q('#stwv').textContent=wave();}
function boom(x,y,color,n){
  var i;
  for(i=0;i<(n||14);i++){var a=Math.random()*6.28,sp=60+Math.random()*220;
    parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0.5+Math.random()*0.4,c:color});}
}
function hitShip(){
  if(invuln>0||over)return;
  lives--;invuln=2;boom(ship.x,ship.y,'#ff9f1c',22);hud();
  if(lives<=0){
    over=true;cancelAnimationFrame(raf);
    q('#std').textContent='Final score: '+score+'  •  Wave '+wave();
    q('#sto').style.display='flex';
  }
}
function spawnEnemy(){
  var W=cv.width,wv=wave(),r=Math.random(),e;
  if(r<0.45)e={type:'dart',x:30+Math.random()*(W-60),y:-30,vy:200+wv*12,hp:1,r:14,t:0,shootT:1+Math.random()};
  else if(r<0.8)e={type:'weaver',x:30+Math.random()*(W-60),y:-30,vy:120+wv*8,hp:1,r:15,t:Math.random()*6,shootT:1.5+Math.random()};
  else e={type:'tank',x:40+Math.random()*(W-80),y:-40,vy:65+wv*5,hp:3,r:24,t:0,shootT:1.2};
  enemies.push(e);
}
function update(dt){
  elapsed+=dt;
  var W=cv.width,H=cv.height,sp=340;
  if(keys.l)ship.x-=sp*dt;if(keys.r)ship.x+=sp*dt;
  if(keys.u)ship.y-=sp*dt;if(keys.d)ship.y+=sp*dt;
  if(drag.on){ship.x+=(drag.x-ship.x)*Math.min(1,14*dt);ship.y+=(drag.y-ship.y)*Math.min(1,14*dt);}
  ship.x=Math.max(20,Math.min(W-20,ship.x));ship.y=Math.max(60,Math.min(H-30,ship.y));
  if(invuln>0)invuln-=dt;
  fireT-=dt;
  if(fireT<=0){fireT=0.24;bullets.push({x:ship.x-7,y:ship.y-16});bullets.push({x:ship.x+7,y:ship.y-16});}
  var i,j;
  for(i=bullets.length-1;i>=0;i--){bullets[i].y-=640*dt;if(bullets[i].y<-20)bullets.splice(i,1);}
  for(i=ebullets.length-1;i>=0;i--){var b=ebullets[i];b.y+=b.vy*dt;
    if(b.y>H+20){ebullets.splice(i,1);continue;}
    var dx=b.x-ship.x,dy=b.y-ship.y;
    if(dx*dx+dy*dy<Math.pow(ship.r+5,2)){ebullets.splice(i,1);hitShip();}
  }
  spawnT-=dt;
  if(spawnT<=0&&enemies.length<12){spawnT=Math.max(0.35,1.05-wave()*0.08);spawnEnemy();}
  for(i=enemies.length-1;i>=0;i--){
    var e=enemies[i];e.t+=dt;e.y+=e.vy*dt;
    if(e.type==='weaver')e.x+=Math.sin(e.t*3)*90*dt;
    e.shootT-=dt;
    if(e.shootT<=0&&e.y>0&&e.y<H*0.6){e.shootT=1.4+Math.random();ebullets.push({x:e.x,y:e.y+e.r,vy:280});}
    if(e.y>H+50){enemies.splice(i,1);continue;}
    var edx=e.x-ship.x,edy=e.y-ship.y;
    if(edx*edx+edy*edy<Math.pow(e.r+ship.r-4,2)){enemies.splice(i,1);boom(e.x,e.y,'#ff595e',16);hitShip();continue;}
    var dead=false;
    for(j=bullets.length-1;j>=0;j--){
      var bl=bullets[j],bx=bl.x-e.x,by=bl.y-e.y;
      if(bx*bx+by*by<Math.pow(e.r+6,2)){
        bullets.splice(j,1);e.hp--;
        if(e.hp<=0){enemies.splice(i,1);boom(e.x,e.y,e.type==='tank'?'#9b5de5':'#ff595e',16);
          score+=e.type==='tank'?50:(e.type==='weaver'?25:15);hud();}
        dead=e.hp<=0;break;
      }
    }
    if(dead)continue;
  }
  for(i=parts.length-1;i>=0;i--){var p=parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)parts.splice(i,1);}
  for(i=0;i<stars.length;i++){stars[i].y+=40*dt;if(stars[i].y>900){stars[i].y=0;stars[i].x=Math.random()*900;}}
}
function drawShip(){
  if(invuln>0&&Math.floor(performance.now()/120)%2===0)return;
  ctx.fillStyle='#4dd2ff';
  ctx.beginPath();ctx.moveTo(ship.x,ship.y-20);ctx.lineTo(ship.x-13,ship.y+12);ctx.lineTo(ship.x+13,ship.y+12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#c8f4ff';ctx.beginPath();ctx.arc(ship.x,ship.y-2,5,0,7);ctx.fill();
  var fl=6+Math.random()*8;
  ctx.fillStyle='#ff9f1c';ctx.beginPath();ctx.moveTo(ship.x-6,ship.y+12);ctx.lineTo(ship.x+6,ship.y+12);ctx.lineTo(ship.x,ship.y+14+fl);ctx.closePath();ctx.fill();
}
function draw(){
  var W=cv.width,H=cv.height,i;
  ctx.fillStyle='#050514';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#fff';
  for(i=0;i<stars.length;i++){var s=stars[i];ctx.globalAlpha=0.4+s.s*0.3;ctx.fillRect((s.x%W),(s.y%H),s.s,s.s);}
  ctx.globalAlpha=1;
  ctx.fillStyle='#ffe66d';
  for(i=0;i<bullets.length;i++){var b=bullets[i];ctx.fillRect(b.x-2,b.y-10,4,10);}
  ctx.fillStyle='#ff4d6d';
  for(i=0;i<ebullets.length;i++){var e2=ebullets[i];ctx.beginPath();ctx.arc(e2.x,e2.y,5,0,7);ctx.fill();}
  for(i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(e.type==='dart'){ctx.fillStyle='#ff595e';ctx.beginPath();ctx.moveTo(e.x,e.y+e.r);ctx.lineTo(e.x-e.r,e.y-e.r);ctx.lineTo(e.x+e.r,e.y-e.r);ctx.closePath();ctx.fill();}
    else if(e.type==='weaver'){ctx.fillStyle='#ff9f1c';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();ctx.fillStyle='#7a3c00';ctx.beginPath();ctx.arc(e.x,e.y,6,0,7);ctx.fill();}
    else{ctx.fillStyle='#9b5de5';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();ctx.fillStyle='#4a1f7a';ctx.lineWidth=4;ctx.strokeStyle='#4a1f7a';ctx.beginPath();ctx.arc(e.x,e.y,e.r-6,0,7);ctx.stroke();}
  }
  for(i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.c;ctx.fillRect(p.x-2,p.y-2,4,4);}
  ctx.globalAlpha=1;
  drawShip();
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over)update(dt);
  draw();
}
var drag={on:false,x:0,y:0};
function keyH(e){
  var k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a'){keys.l=true;e.preventDefault();}
  else if(k==='arrowright'||k==='d'){keys.r=true;e.preventDefault();}
  else if(k==='arrowup'||k==='w'){keys.u=true;e.preventDefault();}
  else if(k==='arrowdown'||k==='s'){keys.d=true;e.preventDefault();}
}
function keyU(e){
  var k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a')keys.l=false;
  else if(k==='arrowright'||k==='d')keys.r=false;
  else if(k==='arrowup'||k==='w')keys.u=false;
  else if(k==='arrowdown'||k==='s')keys.d=false;
}
on(document,'keydown',keyH);on(document,'keyup',keyU);
function cvPos(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
on(cv,'pointerdown',function(e){var p=cvPos(e),dx=p.x-ship.x,dy=p.y-ship.y;drag.on=true;drag.x=p.x;drag.y=p.y;});
on(cv,'pointermove',function(e){if(drag.on){var p=cvPos(e);drag.x=p.x;drag.y=p.y;}});
on(cv,'pointerup',function(){drag.on=false;});
on(cv,'pointercancel',function(){drag.on=false;});
function restart(){container._cleanup();loadShooter(container);}
q('#stre').onclick=restart;q('#sta').onclick=restart;
ship.x=cv.width/2;ship.y=cv.height-120;
hud();last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 5. loadFruit - Fruit Slice: swipe to slice, dodge bombs ============ */
function loadFruit(container){
container.innerHTML='<style>'
+'.frw{position:absolute;inset:0;background:linear-gradient(#2b1055,#7597de);overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.frh{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:15px;font-weight:700;color:#fff;background:rgba(20,10,50,.5)}'
+'.frh button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px;color:#111}'
+'.fro{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(20,10,50,.82);color:#fff;text-align:center;padding:20px}'
+'.fro button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.frw canvas{position:absolute;inset:0;display:block}'
+'.frflash{position:absolute;inset:0;background:rgba(255,40,40,.35);z-index:4;pointer-events:none;opacity:0;transition:opacity .3s}'
+'</style>'
+'<div class="frw"><div class="frh"><span>⭐ <b id="frs">0</b>&nbsp;&nbsp;❤️ <b id="frl">3</b>&nbsp;&nbsp;⏱️ <b id="frt">60</b>s</span><button id="frre">↻ Restart</button></div>'
+'<canvas id="frc"></canvas><div class="frflash" id="frfl"></div>'
+'<div class="fro" id="fro"><h2 style="margin:0">⏰ Time\'s Up!</h2><p id="frd" style="margin:0"></p><button id="fra">▶ Play Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#frc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[],timeouts=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
function after(ms,f){var id=setTimeout(f,ms);timeouts.push(id);return id;}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);timeouts.forEach(clearTimeout);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
var fruits=['🍎','🍊','🍋','🍉','🍇','🥝','🍑','🍒'];
var items=[],parts=[],trail=[],popups=[];
var score=0,lives=3,timeLeft=60,over=false,spawnT=0.4,elapsed=0;
function hud(){q('#frs').textContent=score;q('#frl').textContent=lives;q('#frt').textContent=Math.ceil(timeLeft);}
function spawn(){
  var W=cv.width,H=cv.height;
  var bomb=Math.random()<0.16;
  items.push({
    x:40+Math.random()*(W-80),y:H+40,
    vx:(Math.random()-0.5)*140,vy:-(H*(0.95+Math.random()*0.3)),
    r:bomb?26:30+Math.random()*10,
    emoji:bomb?'💣':fruits[(Math.random()*fruits.length)|0],
    bomb:bomb,rot:Math.random()*6,vr:(Math.random()-0.5)*6
  });
}
function juice(x,y,color,n){
  var i;
  for(i=0;i<n;i++){var a=Math.random()*6.28,sp=80+Math.random()*260;
    parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,life:0.6+Math.random()*0.4,c:color});}
}
function segDist(px,py,ax,ay,bx,by){
  var dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;
  var t=L?((px-ax)*dx+(py-ay)*dy)/L:0;
  t=Math.max(0,Math.min(1,t));
  var nx=ax+dx*t,ny=ay+dy*t,ex=px-nx,ey=py-ny;
  return Math.sqrt(ex*ex+ey*ey);
}
function sliceAt(ax,ay,bx,by){
  var i;
  for(i=items.length-1;i>=0;i--){
    var f=items[i];
    if(segDist(f.x,f.y,ax,ay,bx,by)<f.r+10){
      items.splice(i,1);
      if(f.bomb){
        lives--;hud();juice(f.x,f.y,'#ff4040',26);
        popups.push({x:f.x,y:f.y,txt:'💣 -1 life',life:1.2});
        var fl=q('#frfl');fl.style.opacity=1;after(120,function(){fl.style.opacity=0;});
        if(lives<=0){gameOver('💥 Boom!','Final score: '+score);return;}
      }else{
        score+=10;hud();juice(f.x,f.y,'#ffe66d',16);
        popups.push({x:f.x,y:f.y,txt:'+10',life:0.8});
      }
    }
  }
}
function gameOver(title,sub){
  over=true;cancelAnimationFrame(raf);
  q('#fro').querySelector('h2').textContent=title;
  q('#frd').textContent=sub+'   •   Score: '+score;
  q('#fro').style.display='flex';
}
function update(dt){
  elapsed+=dt;timeLeft-=dt;hud();
  if(timeLeft<=0){gameOver("⏰ Time's Up!",'Great slicing!');return;}
  spawnT-=dt;
  if(spawnT<=0){spawnT=Math.max(0.26,0.55-elapsed*0.006);spawn();}
  var H=cv.height,i;
  for(i=items.length-1;i>=0;i--){
    var f=items[i];
    f.vy+=1500*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.rot+=f.vr*dt;
    if(f.y>H+70)items.splice(i,1);
  }
  for(i=parts.length-1;i>=0;i--){var p=parts[i];p.vy+=900*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)parts.splice(i,1);}
  for(i=trail.length-1;i>=0;i--){trail[i].life-=dt*2.2;if(trail[i].life<=0)trail.splice(i,1);}
  for(i=popups.length-1;i>=0;i--){popups[i].life-=dt;popups[i].y-=34*dt;if(popups[i].life<=0)popups.splice(i,1);}
}
function draw(){
  var W=cv.width,H=cv.height,i;
  ctx.clearRect(0,0,W,H);
  ctx.font='20px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  for(i=0;i<items.length;i++){var f=items[i];
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);
    ctx.font=Math.round(f.r*1.7)+'px system-ui';
    ctx.fillText(f.emoji,0,0);ctx.restore();
  }
  for(i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,4,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  if(trail.length>1){
    ctx.lineCap='round';
    for(i=1;i<trail.length;i++){
      ctx.strokeStyle='rgba(255,255,255,'+(trail[i].life*0.8)+')';
      ctx.lineWidth=6*trail[i].life+1;
      ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);ctx.stroke();
    }
  }
  ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';
  for(i=0;i<popups.length;i++){ctx.globalAlpha=Math.min(1,popups[i].life);ctx.fillText(popups[i].txt,popups[i].x,popups[i].y);ctx.globalAlpha=1;}
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over)update(dt);
  draw();
}
var down=false,lx=0,ly=0;
function cvPos(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
on(cv,'pointerdown',function(e){var p=cvPos(e);down=true;lx=p.x;ly=p.y;trail.push({x:p.x,y:p.y,life:1});});
on(cv,'pointermove',function(e){
  if(!down)return;var p=cvPos(e);
  trail.push({x:p.x,y:p.y,life:1});
  if(!over)sliceAt(lx,ly,p.x,p.y);
  lx=p.x;ly=p.y;
});
function up(){down=false;}
on(cv,'pointerup',up);on(cv,'pointercancel',up);on(cv,'pointerleave',up);
function restart(){container._cleanup();loadFruit(container);}
q('#frre').onclick=restart;q('#fra').onclick=restart;
hud();last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 6. loadBalloon - Balloon Pop: pop them before 5 escape ============ */
function loadBalloon(container){
container.innerHTML='<style>'
+'.blw{position:absolute;inset:0;background:linear-gradient(#7ec8f7,#d8f0ff);overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.blh{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:15px;font-weight:700;color:#08304a;background:rgba(255,255,255,.55)}'
+'.blh button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px;color:#111}'
+'.blo{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(8,48,74,.8);color:#fff;text-align:center;padding:20px}'
+'.blo button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.blw canvas{position:absolute;inset:0;display:block}'
+'</style>'
+'<div class="blw"><div class="blh"><span>⭐ <b id="bls">0</b>&nbsp;&nbsp;🎈 Escaped <b id="ble">0</b>/5</span><button id="blre">↻ Restart</button></div>'
+'<canvas id="blc"></canvas>'
+'<div class="blo" id="blo"><h2 style="margin:0">🎈 Too Many Escaped!</h2><p id="bld" style="margin:0"></p><button id="bla">▶ Play Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#blc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
var colors=['#ff595e','#ffca3a','#8ac926','#1982c4','#9b5de5','#ff7b00','#06d6a0'];
var balloons=[],parts=[],popups=[],clouds=[];
var score=0,escaped=0,over=false,spawnT=0.5;
var i;
for(i=0;i<4;i++)clouds.push({x:Math.random()*800,y:50+Math.random()*150,s:0.7+Math.random()*0.7});
function hud(){q('#bls').textContent=score;q('#ble').textContent=escaped;}
function spawn(){
  var W=cv.width,H=cv.height,gold=Math.random()<0.08;
  balloons.push({
    x:30+Math.random()*(W-60),y:H+50,
    r:gold?30:26+Math.random()*12,
    vy:-(70+score*0.9+Math.random()*50),
    c:gold?'#ffd700':colors[(Math.random()*colors.length)|0],
    gold:gold,ph:Math.random()*6
  });
}
function popAt(px,py){
  var i;
  for(i=balloons.length-1;i>=0;i--){
    var b=balloons[i],dx=px-b.x,dy=py-b.y;
    if(dx*dx+dy*dy<b.r*b.r){
      balloons.splice(i,1);
      var gain=b.gold?50:10;score+=gain;hud();
      var j;
      for(j=0;j<12;j++){var a=Math.random()*6.28,sp=60+Math.random()*160;
        parts.push({x:b.x,y:b.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0.5,c:b.c});}
      popups.push({x:b.x,y:b.y,txt:'+'+gain,life:0.9});
      return;
    }
  }
}
function update(dt){
  var W=cv.width,H=cv.height,i;
  spawnT-=dt;
  if(spawnT<=0){spawnT=Math.max(0.3,0.85-score*0.0022);spawn();}
  for(i=0;i<clouds.length;i++){clouds[i].x-=24*dt;if(clouds[i].x<-120)clouds[i].x=W+120;}
  for(i=balloons.length-1;i>=0;i--){
    var b=balloons[i];b.ph+=dt*3;
    b.y+=Math.min(-420,b.vy)*dt;
    b.x+=Math.sin(b.ph)*24*dt;
    if(b.y<-70){
      balloons.splice(i,1);escaped++;hud();
      popups.push({x:W/2,y:60,txt:'🎈 escaped!',life:1});
      if(escaped>=5){
        over=true;cancelAnimationFrame(raf);
        q('#bld').textContent='Final score: '+score;
        q('#blo').style.display='flex';return;
      }
    }
  }
  for(i=parts.length-1;i>=0;i--){var p=parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)parts.splice(i,1);}
  for(i=popups.length-1;i>=0;i--){popups[i].life-=dt;popups[i].y-=30*dt;if(popups[i].life<=0)popups.splice(i,1);}
}
function drawBalloon(b){
  var wob=Math.sin(b.ph)*4;
  ctx.fillStyle=b.c;
  ctx.beginPath();ctx.ellipse(b.x,b.y,b.r*0.82,b.r,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.45)';
  ctx.beginPath();ctx.ellipse(b.x-b.r*0.3,b.y-b.r*0.35,b.r*0.22,b.r*0.32,-0.4,0,7);ctx.fill();
  ctx.fillStyle=b.c;
  ctx.beginPath();ctx.moveTo(b.x-5,b.y+b.r);ctx.lineTo(b.x+5,b.y+b.r);ctx.lineTo(b.x,b.y+b.r+8);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(60,60,60,.6)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(b.x,b.y+b.r+8);
  ctx.quadraticCurveTo(b.x+wob,b.y+b.r+40,b.x-wob,b.y+b.r+70);ctx.stroke();
  if(b.gold){
    ctx.fillStyle='#fff8';ctx.font='bold 14px system-ui';ctx.textAlign='center';
    ctx.fillText('★',b.x,b.y+5);
  }
}
function draw(){
  var W=cv.width,H=cv.height,i;
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#7ec8f7');g.addColorStop(1,'#e2f4ff');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.85)';
  for(i=0;i<clouds.length;i++){var c=clouds[i];
    ctx.beginPath();ctx.arc(c.x,c.y,24*c.s,0,7);ctx.arc(c.x+26*c.s,c.y+5*c.s,18*c.s,0,7);ctx.arc(c.x-26*c.s,c.y+6*c.s,17*c.s,0,7);ctx.fill();}
  ctx.fillStyle='rgba(255,80,80,.9)';ctx.fillRect(0,0,W,4);
  for(i=0;i<balloons.length;i++)drawBalloon(balloons[i]);
  for(i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,5,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  ctx.fillStyle='#08304a';ctx.font='bold 18px system-ui';ctx.textAlign='center';
  for(i=0;i<popups.length;i++){ctx.globalAlpha=Math.min(1,popups[i].life);ctx.fillText(popups[i].txt,popups[i].x,popups[i].y);ctx.globalAlpha=1;}
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over)update(dt);
  draw();
}
function cvPos(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
on(cv,'pointerdown',function(e){if(over)return;var p=cvPos(e);popAt(p.x,p.y);});
function restart(){container._cleanup();loadBalloon(container);}
q('#blre').onclick=restart;q('#bla').onclick=restart;
hud();last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 7. loadBird - Bird Launch: slingshot the bird, smash targets ============ */
function loadBird(container){
container.innerHTML='<style>'
+'.bdw{position:absolute;inset:0;background:#aee3f5;overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.bdh{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:15px;font-weight:700;color:#08304a;background:rgba(255,255,255,.5)}'
+'.bdh button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px;color:#111}'
+'.bdo{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(8,48,74,.82);color:#fff;text-align:center;padding:20px}'
+'.bdo button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.bdw canvas{position:absolute;inset:0;display:block}'
+'</style>'
+'<div class="bdw"><div class="bdh"><span>⭐ <b id="bds">0</b>&nbsp;&nbsp;🐦 <b id="bdl">5</b></span><button id="bdre">↻ Restart</button></div>'
+'<canvas id="bdc"></canvas>'
+'<div class="bdo" id="bdo"><h2 id="bdm" style="margin:0"></h2><p id="bdd" style="margin:0"></p><button id="bda">▶ Play Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#bdc'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;layout();}
var gy=0,anchor={x:90,y:200};
var boxes=[],debris=[],popups=[];
var bird={x:0,y:0,r:17,vx:0,vy:0,state:'ready',rot:0};
var birdsLeft=5,score=0,over=false;
fit();on(window,'resize',fit);
function layout(){
  var W=cv.width,H=cv.height;
  gy=H-64;
  anchor={x:Math.max(80,W*0.12),y:gy-150};
  if(bird.state==='ready'){bird.x=anchor.x;bird.y=anchor.y;}
  if(!boxes.length&&!over){
    var bw=54,bh=54,bx=W*0.60;
    boxes=[
      {x:bx,y:gy-bh,w:bw,h:bh,hp:2,maxhp:2,c:'#c98a4b'},
      {x:bx,y:gy-2*bh,w:bw,h:bh,hp:2,maxhp:2,c:'#c98a4b'},
      {x:bx+bw+34,y:gy-bh,w:bw,h:bh,hp:1,maxhp:1,c:'#8ac926'},
      {x:bx+2*(bw+34),y:gy-bh,w:bw,h:bh,hp:3,maxhp:3,c:'#c98a4b'},
      {x:bx+2*(bw+34),y:gy-2*bh,w:bw,h:bh,hp:1,maxhp:1,c:'#ff595e'}
    ];
  }
}
function hud(){q('#bds').textContent=score;q('#bdl').textContent=birdsLeft;}
function endRound(win){
  over=true;cancelAnimationFrame(raf);
  q('#bdm').textContent=win?'🎉 You Win!':'😢 Out of Birds';
  q('#bdd').textContent=(win?'All targets smashed!  ':'')+'Score: '+score;
  q('#bdo').style.display='flex';
}
function birdDone(){
  bird.state='done';
  var alive=boxes.some(function(b){return b.hp>0;});
  if(!alive){endRound(true);return;}
  birdsLeft--;hud();
  if(birdsLeft<=0){endRound(false);return;}
  bird.state='ready';bird.x=anchor.x;bird.y=anchor.y;bird.vx=0;bird.vy=0;
}
function smash(b){
  b.hp--;score+=60;hud();
  popups.push({x:b.x+b.w/2,y:b.y,txt:'+60',life:0.8});
  var i;
  for(i=0;i<10;i++)debris.push({x:b.x+Math.random()*b.w,y:b.y+Math.random()*b.h,vx:(Math.random()-0.5)*260,vy:-Math.random()*260,life:0.7,c:b.c,s:4+Math.random()*5});
  if(b.hp<=0){score+=120;hud();popups.push({x:b.x+b.w/2,y:b.y-24,txt:'+120!',life:1});}
}
function update(dt){
  var i;
  if(bird.state==='fly'){
    bird.vy+=1500*dt;
    bird.x+=bird.vx*dt;bird.y+=bird.vy*dt;
    bird.rot+=bird.vx*dt*0.02;
    var spd=Math.sqrt(bird.vx*bird.vx+bird.vy*bird.vy);
    for(i=0;i<boxes.length;i++){
      var b=boxes[i];
      if(b.hp<=0)continue;
      var nx=Math.max(b.x,Math.min(bird.x,b.x+b.w)),ny=Math.max(b.y,Math.min(bird.y,b.y+b.h));
      var dx=bird.x-nx,dy=bird.y-ny;
      if(dx*dx+dy*dy<bird.r*bird.r&&spd>120){
        smash(b);
        var ang=Math.atan2(dy,dx)||-1.2;
        bird.x=nx+Math.cos(ang)*(bird.r+2);bird.y=ny+Math.sin(ang)*(bird.r+2);
        bird.vx=Math.cos(ang)*spd*0.35;bird.vy=Math.sin(ang)*spd*0.35-60;
      }
    }
    if(bird.y+bird.r>gy){
      bird.y=gy-bird.r;
      bird.vy*=-0.38;bird.vx*=0.62;
      if(Math.abs(bird.vy)>120){var j;for(j=0;j<6;j++)debris.push({x:bird.x,y:gy,vx:(Math.random()-0.5)*200,vy:-Math.random()*160,life:0.5,c:'#b08968',s:4});}
      if(Math.sqrt(bird.vx*bird.vx+bird.vy*bird.vy)<95)birdDone();
    }
    if(bird.x>cv.width+60||bird.x<-60||bird.y>cv.height+60)birdDone();
  }
  for(i=debris.length-1;i>=0;i--){var d=debris[i];d.vy+=1100*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.life-=dt;if(d.life<=0)debris.splice(i,1);}
  for(i=popups.length-1;i>=0;i--){popups[i].life-=dt;popups[i].y-=32*dt;if(popups[i].life<=0)popups.splice(i,1);}
}
function drawBird(x,y,r,rot){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);
  ctx.fillStyle='#e63946';ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5,-6,6,0,7);ctx.fill();
  ctx.fillStyle='#123';ctx.beginPath();ctx.arc(6.5,-6,2.8,0,7);ctx.fill();
  ctx.fillStyle='#ff9f1c';ctx.beginPath();ctx.moveTo(r-3,-2);ctx.lineTo(r+7,1);ctx.lineTo(r-3,4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#b5232f';
  ctx.beginPath();ctx.moveTo(-r+2,-4);ctx.lineTo(-r-8,-10);ctx.lineTo(-r-2,0);ctx.closePath();ctx.fill();
  ctx.restore();
}
function draw(){
  var W=cv.width,H=cv.height,i;
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#7ec8f7');g.addColorStop(0.7,'#cdeffd');g.addColorStop(0.7,'#8fce6e');g.addColorStop(1,'#6db85c');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ffdf6b';ctx.beginPath();ctx.arc(W-70,70,34,0,7);ctx.fill();
  ctx.fillStyle='#5a3a1e';ctx.fillRect(0,gy,W,H-gy);
  ctx.fillStyle='#6db85c';ctx.fillRect(0,gy,W,8);
  ctx.strokeStyle='#6b4423';ctx.lineWidth=12;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(anchor.x,gy);ctx.lineTo(anchor.x,anchor.y+24);ctx.stroke();
  ctx.lineWidth=8;
  ctx.beginPath();ctx.moveTo(anchor.x,anchor.y+24);ctx.lineTo(anchor.x-20,anchor.y-6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(anchor.x,anchor.y+24);ctx.lineTo(anchor.x+20,anchor.y-6);ctx.stroke();
  for(i=0;i<boxes.length;i++){
    var b=boxes[i];
    if(b.hp<=0)continue;
    ctx.fillStyle=b.c;ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;ctx.strokeRect(b.x+1,b.y+1,b.w-2,b.h-2);
    if(b.hp<b.maxhp){
      ctx.strokeStyle='rgba(40,20,0,.6)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(b.x+6,b.y+6);ctx.lineTo(b.x+b.w-8,b.y+b.h/2);ctx.lineTo(b.x+10,b.y+b.h-6);ctx.stroke();
    }
    ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.textAlign='center';
    ctx.fillText(''+b.hp,b.x+b.w/2,b.y+b.h/2+6);
  }
  for(i=0;i<debris.length;i++){var d=debris[i];ctx.globalAlpha=Math.min(1,d.life*2);ctx.fillStyle=d.c;ctx.fillRect(d.x-d.s/2,d.y-d.s/2,d.s,d.s);}
  ctx.globalAlpha=1;
  if(bird.state==='aim'){
    var sx=bird.x,sy=bird.y,vx=(anchor.x-bird.x)*5.5,vy=(anchor.y-bird.y)*5.5;
    ctx.fillStyle='rgba(255,255,255,.85)';
    for(i=0;i<20;i++){
      vy+=1500*(1/30);sx+=vx*(1/30);sy+=vy*(1/30);
      if(sy>gy)break;
      ctx.globalAlpha=0.85-i*0.04;
      ctx.beginPath();ctx.arc(sx,sy,4,0,7);ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.strokeStyle='#3a2410';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(anchor.x-20,anchor.y-6);ctx.lineTo(bird.x,bird.y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(anchor.x+20,anchor.y-6);ctx.lineTo(bird.x,bird.y);ctx.stroke();
  }else if(bird.state==='ready'){
    ctx.strokeStyle='#3a2410';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(anchor.x-20,anchor.y-6);ctx.lineTo(bird.x,bird.y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(anchor.x+20,anchor.y-6);ctx.lineTo(bird.x,bird.y);ctx.stroke();
  }
  if(bird.state!=='done')drawBird(bird.x,bird.y,bird.r,bird.state==='fly'?bird.rot:0);
  ctx.fillStyle='#fff';ctx.font='bold 17px system-ui';ctx.textAlign='center';
  for(i=0;i<popups.length;i++){ctx.globalAlpha=Math.min(1,popups[i].life);ctx.fillText(popups[i].txt,popups[i].x,popups[i].y);ctx.globalAlpha=1;}
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over)update(dt);
  draw();
}
function cvPos(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
on(cv,'pointerdown',function(e){
  if(over||bird.state!=='ready')return;
  var p=cvPos(e),dx=p.x-bird.x,dy=p.y-bird.y;
  if(dx*dx+dy*dy<70*70)bird.state='aim';
});
on(cv,'pointermove',function(e){
  if(bird.state!=='aim')return;
  var p=cvPos(e),dx=p.x-anchor.x,dy=p.y-anchor.y;
  var L=Math.sqrt(dx*dx+dy*dy);
  if(L>110){dx=dx/L*110;dy=dy/L*110;}
  bird.x=anchor.x+dx;bird.y=anchor.y+dy;
});
function release(){
  if(bird.state!=='aim')return;
  bird.vx=(anchor.x-bird.x)*5.5;bird.vy=(anchor.y-bird.y)*5.5;
  bird.state='fly';
}
on(cv,'pointerup',release);on(cv,'pointercancel',release);
function restart(){container._cleanup();loadBird(container);}
q('#bdre').onclick=restart;q('#bda').onclick=restart;
layout();hud();
last=performance.now();raf=requestAnimationFrame(frame);
}

/* ============ 8. loadMetro - Metro Run: 3-lane endless runner ============ */
function loadMetro(container){
container.innerHTML='<style>'
+'.mtw{position:absolute;inset:0;background:#141428;overflow:hidden;font-family:system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}'
+'.mth{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:15px;font-weight:700;color:#fff;background:rgba(10,10,30,.55)}'
+'.mth button{background:#ffd166;border:0;border-radius:10px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:14px;color:#111}'
+'.mto{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:rgba(10,10,30,.82);color:#fff;text-align:center;padding:20px}'
+'.mto button{background:#06d6a0;border:0;border-radius:12px;padding:10px 28px;font-size:17px;font-weight:800;cursor:pointer}'
+'.mtw canvas{position:absolute;inset:0;display:block}'
+'</style>'
+'<div class="mtw"><div class="mth"><span>🏁 <b id="mts">0</b>&nbsp;&nbsp;🪙 <b id="mtc">0</b></span><button id="mtre">↻ Restart</button></div>'
+'<canvas id="mtv"></canvas>'
+'<div class="mto" id="mto"><h2 style="margin:0">🚇 Crash!</h2><p id="mtd" style="margin:0"></p><button id="mta">▶ Run Again</button></div></div>';
var q=function(s){return container.querySelector(s);};
var cv=q('#mtv'),ctx=cv.getContext('2d');
var raf=0,last=0,running=true;
var listeners=[];
function on(t,e,f){t.addEventListener(e,f);listeners.push([t,e,f]);}
container._cleanup=function(){running=false;cancelAnimationFrame(raf);listeners.forEach(function(l){l[0].removeEventListener(l[1],l[2]);});};
function fit(){cv.width=container.clientWidth||300;cv.height=container.clientHeight||300;}
fit();on(window,'resize',fit);
function laneY(i){return cv.height*(0.42+0.18*i);}
var px=100,lane=1,py=laneY(1),jy=0,vy=0,jumping=false,slideT=0,runPh=0;
var obstacles=[],coins=[],popups=[],lights=[];
var score=0,coinN=0,elapsed=0,over=false,spawnT=1;
var i;
for(i=0;i<10;i++)lights.push({x:Math.random()*1200});
function hud(){q('#mts').textContent=Math.round(score);q('#mtc').textContent=coinN;}
function spawn(){
  var W=cv.width,lane2=(Math.random()*3)|0,r=Math.random(),o;
  if(r<0.38)o={lane:lane2,type:'low',x:W+60,w:38,h:42};
  else if(r<0.66)o={lane:lane2,type:'high',x:W+60,w:46,h:52};
  else if(r<0.86&&elapsed>12)o={lane:lane2,type:'train',x:W+60,w:150,h:120};
  else o={lane:lane2,type:'low',x:W+60,w:38,h:42};
  obstacles.push(o);
  if(Math.random()<0.45){
    var cl=(Math.random()*3)|0;
    for(var k=0;k<5;k++)coins.push({x:W+80+k*46,lane:cl,y:laneY(cl)-54-Math.sin(k/4*Math.PI)*26,gone:false});
  }
}
function gameOver(){
  over=true;cancelAnimationFrame(raf);
  q('#mtd').textContent='Distance: '+Math.round(score)+' m   •   Coins: '+coinN;
  q('#mto').style.display='flex';
}
function doJump(){if(!jumping&&slideT<=0){jumping=true;vy=-780;}}
function doSlide(){if(!jumping)slideT=0.55;}
function update(dt){
  elapsed+=dt;
  var speed=Math.min(830,380+elapsed*6.5);
  score+=speed*dt*0.06;hud();
  runPh+=dt*(8+speed*0.008);
  var i;
  for(i=0;i<lights.length;i++){lights[i].x-=speed*dt;if(lights[i].x<-40)lights[i].x=cv.width+Math.random()*200;}
  var targetY=laneY(lane);
  py+=(targetY-py)*Math.min(1,12*dt);
  if(jumping){vy+=2400*dt;jy+=vy*dt;if(jy>=0){jy=0;jumping=false;vy=0;}}
  if(slideT>0)slideT-=dt;
  spawnT-=dt;
  if(spawnT<=0){spawnT=Math.max(0.42,0.95-elapsed*0.006);spawn();}
  var ph=slideT>0?30:58;
  var pTop=py+jy-ph,pBot=py+jy,pL=px-14,pR=px+14;
  for(i=obstacles.length-1;i>=0;i--){
    var o=obstacles[i];o.x-=speed*dt;
    if(o.x<-200){obstacles.splice(i,1);continue;}
    var oy=laneY(o.lane),oTop=o.type==='high'?oy-96:(o.type==='train'?oy-o.h:oy-o.h);
    var oL=o.x-o.w/2,oR=o.x+o.w/2;
    if(pR>oL&&pL<oR&&pBot>oTop+6&&pTop<oTop+o.h-4){gameOver();return;}
  }
  for(i=coins.length-1;i>=0;i--){
    var c=coins[i];c.x-=speed*dt;
    if(c.x<-30){coins.splice(i,1);continue;}
    var dx=c.x-px,dy=c.y-(py+jy-30);
    if(dx*dx+dy*dy<32*32){coins.splice(i,1);coinN++;score+=10;hud();popups.push({x:px,y:py-90,txt:'+10',life:0.7});}
  }
  for(i=popups.length-1;i>=0;i--){popups[i].life-=dt;popups[i].y-=30*dt;if(popups[i].life<=0)popups.splice(i,1);}
}
function drawRunner(x,y,slide,t){
  var legA=Math.sin(t)*10,legB=-Math.sin(t)*10;
  ctx.fillStyle='#4dd2ff';
  if(slide){
    ctx.beginPath();ctx.arc(x+8,y-16,10,0,7);ctx.fill();
    ctx.fillRect(x-22,y-22,34,12);
    ctx.fillRect(x-26,y-12,10,6);ctx.fillRect(x-8,y-12,10,6);
  }else{
    var bob=jumping?0:Math.abs(Math.sin(t))*3;
    ctx.beginPath();ctx.arc(x,y-52-bob,10,0,7);ctx.fill();
    ctx.fillRect(x-8,y-44-bob,16,26);
    ctx.fillStyle='#2a7a9b';
    ctx.fillRect(x-8+(jumping?6:legA*0.5),y-18,8,18);
    ctx.fillRect(x+(jumping?-6:legB*0.5),y-18,8,18);
    ctx.fillStyle='#4dd2ff';
    ctx.fillRect(x-16,y-40-bob,7,16);ctx.fillRect(x+9,y-40-bob,7,16);
  }
  ctx.fillStyle='#123';ctx.beginPath();
  if(slide)ctx.arc(x+11,y-18,2.4,0,7);else ctx.arc(x+3,y-54-bob,2.4,0,7);
  ctx.fill();
}
function draw(){
  var W=cv.width,H=cv.height,i;
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0c0c22');g.addColorStop(1,'#23234d');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ffe66d';
  for(i=0;i<lights.length;i++){ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(lights[i].x,40,8,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  for(i=0;i<3;i++){
    var ly=laneY(i);
    ctx.strokeStyle='#4a4a6a';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(0,ly+16);ctx.lineTo(W,ly+16);ctx.stroke();
    ctx.strokeStyle='#33334d';ctx.lineWidth=3;
    for(var x=0;x<W;x+=46)ctx.fillRect(x,ly+10,26,12);
  }
  for(i=0;i<obstacles.length;i++){
    var o=obstacles[i],oy=laneY(o.lane);
    if(o.type==='train'){
      ctx.fillStyle='#c1121f';ctx.fillRect(o.x-o.w/2,oy-o.h,o.w,o.h);
      ctx.fillStyle='#f8f9fa';
      for(var wx=-o.w/2+12;wx<o.w/2-10;wx+=34)ctx.fillRect(o.x+wx,oy-o.h+14,24,26);
      ctx.fillStyle='#7a0c14';ctx.fillRect(o.x-o.w/2,oy-8,o.w,8);
    }else if(o.type==='low'){
      ctx.fillStyle='#ff9f1c';
      for(var s2=0;s2<4;s2++){ctx.fillStyle=s2%2?'#fff':'#ff9f1c';ctx.fillRect(o.x-o.w/2+s2*(o.w/4),oy-o.h,o.w/4,o.h);}
      ctx.fillStyle='#5a3a1e';ctx.fillRect(o.x-o.w/2-4,oy-6,o.w+8,6);
    }else{
      ctx.fillStyle='#5a3a1e';ctx.fillRect(o.x-4,oy-104,8,104);ctx.fillRect(o.x+o.w-4,oy-104,8,104);
      ctx.fillStyle='#ffd166';ctx.fillRect(o.x-o.w/2,oy-96,o.w*2,52);
      ctx.fillStyle='#b58900';ctx.font='bold 15px system-ui';ctx.textAlign='center';
      ctx.fillText('▼ DUCK ▼',o.x,oy-64);
    }
  }
  for(i=0;i<coins.length;i++){var c=coins[i];
    ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(c.x,c.y,11,0,7);ctx.fill();
    ctx.fillStyle='#b58900';ctx.beginPath();ctx.arc(c.x,c.y,7,0,7);ctx.fill();
    ctx.fillStyle='#ffd166';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('★',c.x,c.y+3.5);
  }
  drawRunner(px,py+jy,slideT>0,runPh);
  ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.textAlign='center';
  for(i=0;i<popups.length;i++){ctx.globalAlpha=Math.min(1,popups[i].life);ctx.fillText(popups[i].txt,popups[i].x,popups[i].y);ctx.globalAlpha=1;}
}
function frame(t){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  if(!over)update(dt);
  draw();
}
function keyH(e){
  var k=e.key.toLowerCase();
  if(k==='arrowup'||k==='w'){doJump();e.preventDefault();}
  else if(k==='arrowdown'||k==='s'){doSlide();e.preventDefault();}
  else if(k==='arrowleft'||k==='a'){lane=Math.max(0,lane-1);e.preventDefault();}
  else if(k==='arrowright'||k==='d'){lane=Math.min(2,lane+1);e.preventDefault();}
}
on(document,'keydown',keyH);
var swp=null;
on(container,'pointerdown',function(e){if(e.target.closest('button'))return;swp={x:e.clientX,y:e.clientY};});
on(container,'pointerup',function(e){
  if(!swp)return;
  var dx=e.clientX-swp.x,dy=e.clientY-swp.y;swp=null;
  if(Math.abs(dx)<24&&Math.abs(dy)<24)return;
  if(Math.abs(dx)>Math.abs(dy)){lane=Math.max(0,Math.min(2,lane+(dx>0?1:-1)));}
  else if(dy<0)doJump();else doSlide();
});
function restart(){container._cleanup();loadMetro(container);}
q('#mtre').onclick=restart;q('#mta').onclick=restart;
hud();last=performance.now();raf=requestAnimationFrame(frame);
}
