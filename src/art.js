// ===== Brimfall illustrated art: castles, hovels, bone fortresses, soul springs, spires, Hellgate, banners, sigil, terrain =====
const ART=0.36;let SK=1.35;
function shade(h,k){const n=parseInt(h.slice(1),16);const c=[(n>>16)&255,(n>>8)&255,n&255];return`rgb(${c.map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k)).join(',')})`;}
function hx3(h){if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgba(h,a){const c=hx3(h);return`rgba(${c[0]},${c[1]},${c[2]},${a})`;}
function mixh(a,b,t){const p=hx3(a),q=hx3(b);return'#'+p.map((v,i)=>Math.max(0,Math.min(255,Math.round(v+(q[i]-v)*t))).toString(16).padStart(2,'0')).join('');}
function shh(h,k){return mixh(h,k<0?'#000000':'#ffffff',Math.abs(k));}
const MEMO=new Map();function memo(k,f){let v=MEMO.get(k);if(v===undefined){if(MEMO.size>600)MEMO.clear();v=f();MEMO.set(k,v);}return v;}
function aRng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function sd2(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));const x=ax+t*dx-px,y=ay+t*dy-py;return x*x+y*y;}
// palettes: [highlight, light, mid, dark, deepest]
const STONE=['#8a8291','#5f5868','#433d4b','#2a2531','#18151d'];
const ISTONE=['#8d8e98','#62636e','#45464f','#2c2c34','#19191f'];
const NSTONE=['#a29c92','#7d776e','#5c5750','#3d3934','#25221f'];
const FSTONE=['#6a6170','#46404d','#2e2934','#1c1820','#0f0d12'];
const OBS=['#a397b8','#5e5570','#3a3247','#1f1a28','#110e16'];
const NOBS=['#b3ac9f','#857e72','#5f5950','#3f3a34','#27241f'];
const BONE=['#f3ead4','#d6c8a6','#a69676','#6c604b'];
const IRON=['#9a98a4','#64626e','#3c3a44','#24232a'];
const HIDE=['#bdb19c','#978a75','#73685a','#4e463c'];
const GL={emb:['#fff6cf','#ffc552','#ff7417','#b52e0a'],soul:['#f4fdff','#a6e8ff','#43b6ff','#1552c2'],vio:['#fcefff','#da9fff','#9d47ff','#4f1699'],
  forge:['#ffffe6','#ffdb55','#ff8c1a','#c43c0a'],pale:['#fbffe9','#e2f5b4','#a9cb78','#58703e'],red:['#ffe0d0','#ff6040','#d8220f','#6a0a05']};
const RX=[0,70,98,128],RY=[0,46,62,82];
function mkCanvas(size){const cn=document.createElement('canvas');cn.width=Math.round(size*SK);cn.height=Math.round(size*SK);const x=cn.getContext('2d');x.scale(SK,SK);return[cn,x];}
// ---------- drawing primitives (sprite art units) ----------
function glow(x,px,py,r,col,a){const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,rgba(col,a));g.addColorStop(.35,rgba(col,a*.45));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(px-r,py-r,2*r,2*r);}
function eglow(x,px,py,rx,ry,col,a){x.save();x.translate(px,py);x.scale(1,ry/rx);glow(x,0,0,rx,col,a);x.restore();}
function gshadow(x,px,py,rx,ry,a){x.save();x.translate(px,py);x.scale(1,ry/rx);const g=x.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,`rgba(6,3,5,${a})`);g.addColorStop(.55,`rgba(6,3,5,${a*.65})`);g.addColorStop(1,'rgba(6,3,5,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,rx,0,7);x.fill();x.restore();}
function hg(x,x0,x1,st){const g=x.createLinearGradient(x0,0,x1,0);for(const s of st)g.addColorStop(s[0],s[1]);return g;}
function vg(x,y0,y1,st){const g=x.createLinearGradient(0,y0,0,y1);for(const s of st)g.addColorStop(s[0],s[1]);return g;}
function cylG(x,px,r,P){return hg(x,px-r,px+r,[[0,P[1]],[.2,P[0]],[.5,P[2]],[.84,P[3]],[1,mixh(P[3],'#7a3a20',.35)]]);}
function ell(x,cx,cy,rx,ry){x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,7);}
function tear(x,px,py,w,h){x.beginPath();x.moveTo(px,py-h);x.quadraticCurveTo(px+w*1.15,py-h*.38,px+w*.8,py-w*.35);x.quadraticCurveTo(px,py+w*.45,px-w*.8,py-w*.35);x.quadraticCurveTo(px-w*1.15,py-h*.38,px,py-h);x.closePath();}
function flame(x,px,py,s,G,a){a=a??1;glow(x,px,py-s*.9,s*3,G[2],.4*a);x.globalAlpha=a;const L=[[G[3],1,2.3],[G[2],.78,1.95],[G[1],.55,1.45],[G[0],.3,.85]];
  for(const [c,w,h] of L){x.fillStyle=c;tear(x,px+(1-w)*s*.15,py,s*w,s*h);x.fill();}x.globalAlpha=1;}
function skull(x,px,py,s,col,eye){x.fillStyle=col;x.beginPath();x.arc(px,py,s,0,7);x.fill();x.beginPath();x.rect(px-s*.55,py+s*.35,s*1.1,s*.75);x.fill();
  x.fillStyle=eye||'rgba(10,6,6,.8)';x.beginPath();x.arc(px-s*.38,py+s*.12,s*.27,0,7);x.arc(px+s*.38,py+s*.12,s*.27,0,7);x.fill();}
function rune(x,px,py,s,t){x.beginPath();const h=s*.7;
  if(t===0){x.moveTo(px,py-h);x.lineTo(px,py+h);x.moveTo(px,py-h*.2);x.lineTo(px+s*.7,py-h);}
  else if(t===1){x.moveTo(px-s*.6,py+h);x.lineTo(px,py-h);x.lineTo(px+s*.6,py+h);x.moveTo(px-s*.3,py+h*.1);x.lineTo(px+s*.3,py+h*.1);}
  else if(t===2){x.moveTo(px-s*.6,py-h);x.lineTo(px+s*.6,py+h);x.moveTo(px+s*.6,py-h);x.lineTo(px-s*.6,py+h);}
  else if(t===3){x.moveTo(px-s*.6,py-h);x.lineTo(px,py+h);x.lineTo(px+s*.6,py-h);x.moveTo(px,py+h);x.lineTo(px,py-h*.3);}
  else if(t===4){x.moveTo(px-s*.5,py+h);x.lineTo(px-s*.5,py-h);x.lineTo(px+s*.5,py);x.lineTo(px-s*.5,py+h*.2);}
  else{x.moveTo(px,py-h);x.lineTo(px+s*.6,py);x.lineTo(px,py+h);x.lineTo(px-s*.6,py);x.closePath();}x.stroke();}
// glowing rune circle on the ground (ownership)
function runeRing(x,cx,cy,rx,ry,col,R){const k=ry/rx;const E=(d,lw,st)=>{ell(x,cx,cy,rx+d,ry+d*k);x.lineWidth=lw;x.strokeStyle=st;x.stroke();};
  E(0,26,rgba(col,.1));E(-5,13,rgba(col,.15));E(0,6,rgba(col,.62));E(0,2.4,shh(col,.5));E(-11,1.8,rgba(shh(col,.25),.85));
  x.lineCap='round';x.lineJoin='round';const n=Math.round((rx+ry)/8.5);x.strokeStyle=rgba(shh(col,.35),.9);x.lineWidth=1.25;
  for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2;rune(x,cx+Math.cos(a)*(rx-5.5),cy+Math.sin(a)*(ry-5.5*k),2.7,Math.floor(R()*6));}
  x.fillStyle=shh(col,.4);for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,ca=Math.cos(a),sa=Math.sin(a);const px=cx+ca*rx,py=cy+sa*ry;
    x.beginPath();x.moveTo(px-sa*2.6,py+ca*2.6*k);x.lineTo(px+ca*9,py+sa*9*k);x.lineTo(px+sa*2.6,py-ca*2.6*k);x.closePath();x.fill();}}
function pad(x,cx,cy,rx,ry,R,neu){const g=x.createRadialGradient(cx-rx*.25,cy-ry*.35,4,cx,cy,rx);g.addColorStop(0,neu?'#5a554e':'#4a4249');g.addColorStop(.75,neu?'#45413b':'#363039');g.addColorStop(1,neu?'#37332f':'#2a252c');
  x.save();x.translate(cx,cy);x.scale(1,ry/rx);x.beginPath();x.arc(0,0,rx,0,7);x.restore();x.fillStyle=g;x.fill();x.save();x.clip();
  x.lineWidth=.8;x.strokeStyle='rgba(8,5,8,.38)';for(let yy=cy-ry,row=0;yy<cy+ry;yy+=8,row++){x.beginPath();x.moveTo(cx-rx,yy);x.lineTo(cx+rx,yy);x.stroke();
    for(let xx=cx-rx+(row%2)*7;xx<cx+rx;xx+=14+R()*4){x.beginPath();x.moveTo(xx,yy);x.lineTo(xx-1,yy+8);x.stroke();}}
  for(let i=0;i<60;i++){x.fillStyle=R()<.5?'rgba(255,240,230,.05)':'rgba(0,0,0,.12)';x.fillRect(cx+(R()-.5)*2*rx,cy+(R()-.5)*2*ry,3+R()*6,2+R()*3);}x.restore();
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;x.save();x.translate(cx,cy);x.scale(1,ry/rx);x.beginPath();x.arc(0,0,rx-1,0,7);x.restore();x.stroke();}
// round tower body; returns top y
function towerBody(x,px,py,r,h,P,o){o=o||{};const k=.42;gshadow(x,px+r*1.1,py+r*.3,r*1.9,r*.7,.5);
  x.fillStyle=cylG(x,px,r,P);x.beginPath();x.moveTo(px-r,py-h);x.lineTo(px-r,py);x.ellipse(px,py,r,r*k,0,Math.PI,0,true);x.lineTo(px+r,py-h);x.ellipse(px,py-h,r,r*k,0,0,Math.PI,true);x.closePath();x.fill();
  x.strokeStyle='rgba(0,0,0,.28)';x.lineWidth=.7;for(let yy=py-h+7;yy<py-2;yy+=7){x.beginPath();x.ellipse(px,yy,r,r*k,0,.12,Math.PI-.12);x.stroke();}
  x.strokeStyle='rgba(255,228,214,.28)';x.lineWidth=.9;x.beginPath();x.moveTo(px-r+.9,py-h+1);x.lineTo(px-r+.9,py-1);x.stroke();
  x.fillStyle=P[3];ell(x,px,py-h,r,r*k);x.fill();x.strokeStyle=rgba(P[0],.55);x.lineWidth=.9;x.beginPath();x.ellipse(px,py-h,r,r*k,0,Math.PI*.95,Math.PI*1.75);x.stroke();
  return py-h;}
function teeth(x,px,py,r,n,ht,P,front){const k=.42;for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2;const sa=Math.sin(a);if(front?sa<-.05:sa>=-.05)continue;const ca=Math.cos(a);
  const bx=px+ca*r,by=py+sa*r*k;const lit=.5-ca*.5;x.fillStyle=mixh(P[3],P[0],lit*.9);x.beginPath();x.moveTo(bx-2.2,by);x.lineTo(bx,by-ht);x.lineTo(bx+2.2,by);x.closePath();x.fill();}}
function spire(x,px,py,r,h,P,o){o=o||{};const k=.42;x.fillStyle=cylG(x,px,r,P);x.beginPath();x.moveTo(px-r,py);x.quadraticCurveTo(px-r*.3,py-h*.4,px,py-h);x.quadraticCurveTo(px+r*.3,py-h*.4,px+r,py);x.ellipse(px,py,r,r*k,0,0,Math.PI,false);x.closePath();x.fill();
  x.strokeStyle=rgba(o.rim||'#ffd8c0',.55);x.lineWidth=.9;x.beginPath();x.moveTo(px-r*.85,py-1);x.quadraticCurveTo(px-r*.27,py-h*.4,px-.3,py-h+1.5);x.stroke();
  if(o.barbs){for(const u of[.32,.58]){const bx=(1-u)*(1-u)*(px-r)+2*u*(1-u)*(px-r*.3)+u*u*px,by=(1-u)*(1-u)*py+2*u*(1-u)*(py-h*.4)+u*u*(py-h);const d=px-bx,bs=Math.max(2.2,r*.22);
    x.fillStyle=P[1];x.beginPath();x.moveTo(bx+.6,by-bs);x.lineTo(bx-bs*1.9,by+bs*.6);x.lineTo(bx+.6,by+bs*.5);x.closePath();x.fill();
    x.fillStyle=P[3];x.beginPath();x.moveTo(px+d-.6,by-bs);x.lineTo(px+d+bs*1.9,by+bs*.6);x.lineTo(px+d-.6,by+bs*.5);x.closePath();x.fill();}}
  if(o.tip){x.fillStyle=o.tip;x.beginPath();x.moveTo(px-1.3,py-h+5);x.lineTo(px,py-h-3);x.lineTo(px+1.3,py-h+5);x.closePath();x.fill();}
  return py-h;}
function win(x,px,py,w,h,G,a){a=a??1;glow(x,px,py-h*.5,Math.max(w,h)*1.5,G[2],.5*a);x.fillStyle='#0e0a0c';x.beginPath();x.moveTo(px-w/2-.6,py+.6);x.lineTo(px-w/2-.6,py-h*.55);x.quadraticCurveTo(px-w/2,py-h-1,px,py-h-1.2);x.quadraticCurveTo(px+w/2,py-h-1,px+w/2+.6,py-h*.55);x.lineTo(px+w/2+.6,py+.6);x.closePath();x.fill();
  x.fillStyle=vg(x,py-h,py,[[0,G[1]],[1,G[2]]]);x.beginPath();x.moveTo(px-w/2,py);x.lineTo(px-w/2,py-h*.55);x.quadraticCurveTo(px-w/2,py-h,px,py-h);x.quadraticCurveTo(px+w/2,py-h,px+w/2,py-h*.55);x.lineTo(px+w/2,py);x.closePath();x.fill();
  x.fillStyle=G[0];x.fillRect(px-w*.18,py-h*.75,w*.36,h*.5);}
function wallSeg(x,a,b,h,P,o){o=o||{};const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);let nx=-dy/L,ny=dx/L;if(ny<0){nx=-nx;ny=-ny;}const lit=Math.max(0,Math.min(1,.55-nx*.5));
  const top=mixh(P[3],P[1],lit),bot=mixh(P[4],P[2],lit*.7);x.fillStyle=vg(x,Math.min(a.y,b.y)-h,Math.max(a.y,b.y),[[0,top],[1,bot]]);
  x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.lineTo(b.x,b.y-h);x.lineTo(a.x,a.y-h);x.closePath();x.fill();
  x.strokeStyle='rgba(0,0,0,.26)';x.lineWidth=.7;const nc=Math.max(2,Math.round(h/6));for(let k=1;k<nc;k++){const f=k/nc;x.beginPath();x.moveTo(a.x,a.y-h*f);x.lineTo(b.x,b.y-h*f);x.stroke();
    for(let t=(k%2)*.5/Math.max(1,L/12);t<1;t+=12/L){x.beginPath();x.moveTo(a.x+dx*t,a.y+dy*t-h*f);x.lineTo(a.x+dx*t,a.y+dy*t-h*(f-1/nc));x.stroke();}}
  if(o.band){x.strokeStyle=rgba(IRON[1],.9);x.lineWidth=1.6;x.beginPath();x.moveTo(a.x,a.y-h*.45);x.lineTo(b.x,b.y-h*.45);x.stroke();}
  const th=o.th||5;x.fillStyle=P[3];x.beginPath();x.moveTo(a.x,a.y-h);x.lineTo(b.x,b.y-h);x.lineTo(b.x,b.y-h-th);x.lineTo(a.x,a.y-h-th);x.closePath();x.fill();
  x.strokeStyle=rgba('#ffe2d0',.12+.28*lit);x.lineWidth=.9;x.beginPath();x.moveTo(a.x,a.y-h);x.lineTo(b.x,b.y-h);x.stroke();
  const ty=o.back?-th:0,tt=o.tooth||8,n=Math.max(2,Math.floor(L/tt)),tH=o.th2||6;
  for(let k=0;k<n;k++){const t0=(k+.18)/n,t1=(k+.82)/n,tm=(t0+t1)/2;x.fillStyle=k%2?mixh(P[3],P[1],lit):mixh(P[3],P[0],lit*.8);
    x.beginPath();x.moveTo(a.x+dx*t0,a.y+dy*t0-h+ty);x.lineTo(a.x+dx*tm,a.y+dy*tm-h+ty-tH);x.lineTo(a.x+dx*t1,a.y+dy*t1-h+ty);x.closePath();x.fill();}}
function archP(x,gx,gy,w,h){x.beginPath();x.moveTo(gx-w/2,gy);x.lineTo(gx-w/2,gy-h*.55);x.quadraticCurveTo(gx-w/2,gy-h,gx,gy-h-w*.12);x.quadraticCurveTo(gx+w/2,gy-h,gx+w/2,gy-h*.55);x.lineTo(gx+w/2,gy);x.closePath();}
function gate(x,gx,gy,w,h,G,P){x.fillStyle='#0a0709';archP(x,gx,gy,w,h);x.fill();x.save();archP(x,gx,gy,w,h);x.clip();eglow(x,gx,gy,w*.7,h*.6,G[2],.75);x.restore();
  x.strokeStyle='#2c2830';x.lineWidth=1.1;for(let k=-w/2+2;k<w/2-1;k+=3.2){x.beginPath();x.moveTo(gx+k,gy);x.lineTo(gx+k,gy-h*.98);x.stroke();}
  x.beginPath();for(let yy=gy-3;yy>gy-h*.9;yy-=4){x.moveTo(gx-w/2,yy);x.lineTo(gx+w/2,yy);}x.stroke();
  x.strokeStyle=P[1];x.lineWidth=2.2;archP(x,gx,gy,w+2,h+1);x.stroke();skull(x,gx,gy-h-w*.12-2.6,2.5,BONE[1]);}
function drape(x,px,py,w,h,col){const c1=shh(col,-.08),c2=shh(col,-.42);x.fillStyle=c1;x.beginPath();x.moveTo(px-w/2,py);x.lineTo(px+w/2,py);x.lineTo(px+w/2,py+h*.82);x.lineTo(px+w*.25,py+h);x.lineTo(px,py+h*.84);x.lineTo(px-w*.25,py+h);x.lineTo(px-w/2,py+h*.82);x.closePath();x.fill();
  x.fillStyle=rgba(c2,.6);x.fillRect(px+w*.12,py,w*.38,h*.85);x.fillStyle=rgba('#ffffff',.18);x.fillRect(px-w*.42,py,w*.14,h*.8);
  x.fillStyle=c2;x.beginPath();x.moveTo(px-w*.22,py+h*.28);x.lineTo(px,py+h*.5);x.lineTo(px+w*.22,py+h*.28);x.lineTo(px,py+h*.62);x.closePath();x.fill();
  x.fillStyle='#1c171d';x.fillRect(px-w/2-1,py-1.2,w+2,2);}
function brazier(x,px,py,s,G){x.strokeStyle='#1d1a20';x.lineWidth=1.2*s;x.lineCap='round';x.beginPath();x.moveTo(px-3*s,py);x.lineTo(px,py-6*s);x.lineTo(px+3*s,py);x.moveTo(px,py);x.lineTo(px,py-6*s);x.stroke();
  x.fillStyle='#2a2529';x.beginPath();x.moveTo(px-4*s,py-7*s);x.lineTo(px+4*s,py-7*s);x.lineTo(px+2.6*s,py-4.8*s);x.lineTo(px-2.6*s,py-4.8*s);x.closePath();x.fill();flame(x,px,py-6.6*s,2.6*s,G);}
function altar(x,px,py,s){gshadow(x,px+6*s,py+2*s,18*s,6*s,.5);const w=24*s,d=10*s,h=8*s,f=py,top=py-d-h;
  x.fillStyle=vg(x,f-h,f,[[0,'#4c4552'],[1,'#26212b']]);x.fillRect(px-w/2,f-h,w,h);x.fillStyle='#5d5664';x.fillRect(px-w/2,top,w,d);x.strokeStyle='rgba(255,240,230,.25)';x.lineWidth=.8;x.strokeRect(px-w/2,top,w,d);
  x.strokeStyle=GL.soul[1];x.lineWidth=1;x.lineCap='round';for(let i=0;i<3;i++)rune(x,px-w*.3+i*w*.3,f-h*.5,2.2,(i*2+1)%6);
  x.fillStyle='rgba(120,10,10,.55)';x.beginPath();x.ellipse(px+w*.28,top+d*.6,3*s,1.4*s,0,0,7);x.fill();
  skull(x,px-w*.36,top+d*.35,1.8*s,BONE[1]);flame(x,px+1*s,top+d*.55,4.2*s,GL.soul);}
function soulPit(x,px,py,rx,ry,R){eglow(x,px,py,rx*2.2,ry*2.4,GL.soul[2],.35);x.strokeStyle=rgba(GL.soul[1],.7);x.lineWidth=1.1;x.lineCap='round';
  for(let i=0;i<9;i++){const a=R()*Math.PI*2;let cx=px+Math.cos(a)*rx,cy=py+Math.sin(a)*ry;x.beginPath();x.moveTo(cx,cy);for(let k=0;k<3;k++){cx+=Math.cos(a+(R()-.5))*7;cy+=Math.sin(a+(R()-.5))*4.5;x.lineTo(cx,cy);}x.stroke();}
  x.fillStyle='#17131a';ell(x,px,py+1.5,rx+5,ry+3.5);x.fill();const g=x.createRadialGradient(px,py,1,px,py,rx);g.addColorStop(0,GL.soul[0]);g.addColorStop(.3,GL.soul[1]);g.addColorStop(.75,GL.soul[2]);g.addColorStop(1,GL.soul[3]);
  x.save();x.translate(px,py);x.scale(1,ry/rx);x.beginPath();x.arc(0,0,rx,0,7);x.restore();x.fillStyle=g;x.fill();
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+R()*.2;const bx=px+Math.cos(a)*(rx+3),by=py+Math.sin(a)*(ry+2);const s=2.2+R()*1.8;x.fillStyle=mixh('#3a3440','#6d6576',.5-Math.cos(a)*.4);x.beginPath();x.ellipse(bx,by,s*1.3,s,a,0,7);x.fill();}}
function wisps(x,px,py,h,n,R,col){x.lineCap='round';for(let i=0;i<n;i++){const ox=(R()-.5)*h*.35,w=2+R()*3;let cx=px+ox,cy=py;x.beginPath();x.moveTo(cx,cy);const pts=[];
  for(let k=1;k<=6;k++){pts.push([px+ox*(1-k/7)+Math.sin(k*1.3+i*2)*h*.07,py-h*k/6]);}for(const p of pts)x.lineTo(p[0],p[1]);x.strokeStyle=rgba(col||GL.soul[1],.16);x.lineWidth=w*2.6;x.stroke();x.strokeStyle=rgba(GL.soul[0],.32);x.lineWidth=w*.7;x.stroke();}}
function chimney(x,px,py,w,h,smoke){gshadow(x,px+w,py+2,w*1.6,w*.5,.45);x.fillStyle=hg(x,px-w/2,px+w/2,[[0,'#6a4038'],[.3,'#7e4c40'],[1,'#2e1a17']]);x.beginPath();x.moveTo(px-w/2,py);x.lineTo(px-w*.4,py-h);x.lineTo(px+w*.4,py-h);x.lineTo(px+w/2,py);x.closePath();x.fill();
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=.6;for(let yy=py-4,r=0;yy>py-h;yy-=4,r++){x.beginPath();x.moveTo(px-w/2,yy);x.lineTo(px+w/2,yy);x.stroke();}
  x.fillStyle='#2b2020';x.fillRect(px-w*.5,py-h-3,w,3.5);x.fillStyle=GL.forge[1];ell(x,px,py-h-3,w*.36,1.6);x.fill();glow(x,px,py-h-6,w*2.4,GL.forge[2],.7);x.fillStyle=rgba(GL.forge[2],.85);x.fillRect(px-w*.45,py-h*.42,w*.9,1.6);smoke&&smoke.push({x:px,y:py-h-6});}
function anvil(x,px,py,s,R){gshadow(x,px+5,py+1,14*s,4*s,.5);x.fillStyle='#2f2620';x.fillRect(px-5*s,py-7*s,10*s,7*s);x.fillStyle='#232027';x.beginPath();x.moveTo(px-9*s,py-11*s);x.lineTo(px+7*s,py-11*s);x.lineTo(px+5*s,py-8*s);x.lineTo(px+3*s,py-7*s);x.lineTo(px-3*s,py-7*s);x.lineTo(px-4*s,py-9*s);x.quadraticCurveTo(px-8*s,py-9*s,px-12*s,py-11*s);x.closePath();x.fill();
  x.fillStyle='#5b5560';x.fillRect(px-9*s,py-12.2*s,16*s,1.4*s);glow(x,px,py-13*s,10*s,GL.forge[2],.6);x.fillStyle=GL.forge[1];x.fillRect(px-4*s,py-14*s,9*s,2.2*s);x.fillStyle=GL.forge[0];x.fillRect(px-2*s,py-13.8*s,5*s,1*s);
  for(let i=0;i<12;i++){const a=-Math.PI*(.15+R()*.7),r=(4+R()*12)*s;x.fillStyle=i%3?GL.forge[1]:GL.forge[0];x.fillRect(px+Math.cos(a)*r,py-14*s+Math.sin(a)*r*.9,1.1,1.1);}}
function lavaPool(x,px,py,rx,ry){eglow(x,px,py,rx*1.8,ry*2.2,GL.forge[2],.45);x.fillStyle='#1e1514';ell(x,px,py+1,rx+3,ry+2.5);x.fill();const g=x.createRadialGradient(px,py,1,px,py,rx);g.addColorStop(0,GL.forge[0]);g.addColorStop(.35,GL.forge[1]);g.addColorStop(.8,GL.forge[2]);g.addColorStop(1,GL.forge[3]);
  x.save();x.translate(px,py);x.scale(1,ry/rx);x.beginPath();x.arc(0,0,rx,0,7);x.restore();x.fillStyle=g;x.fill();}
function eyeFlame(x,px,py,s){glow(x,px,py,s*7,GL.vio[2],.55);flame(x,px,py-s*.6,s*1.5,GL.vio,.95);x.fillStyle=GL.vio[3];x.beginPath();x.moveTo(px-s*2.2,py);x.quadraticCurveTo(px,py-s*1.5,px+s*2.2,py);x.quadraticCurveTo(px,py+s*1.5,px-s*2.2,py);x.fill();
  x.fillStyle=GL.vio[1];x.beginPath();x.moveTo(px-s*1.8,py);x.quadraticCurveTo(px,py-s*1.15,px+s*1.8,py);x.quadraticCurveTo(px,py+s*1.15,px-s*1.8,py);x.fill();x.fillStyle=GL.vio[0];x.beginPath();x.ellipse(px,py,s*.9,s*.75,0,0,7);x.fill();
  x.fillStyle='#1a0730';x.beginPath();x.ellipse(px,py,s*.22,s*.7,0,0,7);x.fill();}
function horn(x,px,py,s,dir,col){x.fillStyle=col;x.beginPath();x.moveTo(px-1.6*s*dir,py);x.quadraticCurveTo(px+3*s*dir,py-3*s,px+3.4*s*dir,py-9*s);x.quadraticCurveTo(px+1.2*s*dir,py-4*s,px+1.6*s*dir,py+.3*s);x.closePath();x.fill();}
function hellmouth(x,gx,gy,w,h){const fr='#1a1519';x.fillStyle=fr;archP(x,gx,gy,w+10,h+8);x.fill();x.save();archP(x,gx,gy,w,h);x.clip();const g=x.createRadialGradient(gx,gy-h*.25,2,gx,gy-h*.3,h*1.1);g.addColorStop(0,GL.forge[0]);g.addColorStop(.25,GL.forge[1]);g.addColorStop(.55,GL.forge[2]);g.addColorStop(1,'#3a0805');
  x.fillStyle=g;x.fillRect(gx-w,gy-h*1.4,w*2,h*1.5);x.restore();x.fillStyle=BONE[1];const n=6;for(let i=0;i<n;i++){const t=(i+.5)/n,xx=gx-w/2+w*t,yy=gy-h*.62-Math.sin(t*Math.PI)*h*.36;x.beginPath();x.moveTo(xx-w/n*.42,yy);x.lineTo(xx,yy+h*.26);x.lineTo(xx+w/n*.42,yy);x.closePath();x.fill();}
  for(let i=0;i<5;i++){const t=(i+.5)/5,xx=gx-w/2+w*t;x.beginPath();x.moveTo(xx-w/10,gy);x.lineTo(xx,gy-h*.22);x.lineTo(xx+w/10,gy);x.closePath();x.fill();}
  horn(x,gx-w/2-3,gy-h*.8,2.4,-1,BONE[2]);horn(x,gx+w/2+3,gy-h*.8,2.4,1,BONE[2]);for(const d of[-1,1]){glow(x,gx+d*w*.22,gy-h-6,6,GL.red[2],.8);x.fillStyle=GL.red[1];x.beginPath();x.ellipse(gx+d*w*.22,gy-h-6,3,1.3,d*.3,0,7);x.fill();}
  x.strokeStyle='#3d3640';x.lineWidth=2;archP(x,gx,gy,w+9,h+7);x.stroke();}
function rampart(x,cx,cy,rx,ry){const k=ry/rx;ell(x,cx+3,cy+5,rx,ry);x.lineWidth=17;x.strokeStyle='rgba(5,3,5,.45)';x.stroke();ell(x,cx,cy,rx,ry);x.lineWidth=15;x.strokeStyle='#26222b';x.stroke();
  x.lineWidth=9;x.strokeStyle='#3d3843';x.stroke();x.lineWidth=2;x.strokeStyle='rgba(225,215,235,.35)';x.beginPath();x.ellipse(cx,cy-3,rx-2,ry-2*k,0,Math.PI*.95,Math.PI*1.9);x.stroke();
  x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=1;for(let i=0;i<40;i++){const a=i/40*Math.PI*2;x.beginPath();x.moveTo(cx+Math.cos(a)*(rx-6),cy+Math.sin(a)*(ry-6*k));x.lineTo(cx+Math.cos(a)*(rx+6),cy+Math.sin(a)*(ry+6*k));x.stroke();}}
function stakes(x,cx,cy,rx,ry,front,P,n,len,bw){len=len||16;bw=bw||2.2;for(let k=0;k<n;k++){const a=(k+.5)/n*Math.PI*2,sa=Math.sin(a),ca=Math.cos(a);if(front?sa<=0:sa>0)continue;const bx=cx+ca*rx,by=cy+sa*ry;
  const tx=bx+ca*len*.75,ty=by+sa*len*.5-len*.55;const px=-sa,py=ca*.6;x.fillStyle=k%2?P[1]:P[2];x.beginPath();x.moveTo(bx+px*bw,by+py*bw);x.lineTo(tx,ty);x.lineTo(bx-px*bw,by-py*bw);x.closePath();x.fill();
  x.strokeStyle='rgba(255,235,220,.3)';x.lineWidth=.6;x.beginPath();x.moveTo(bx+px*2,by+py*2);x.lineTo(tx,ty);x.stroke();}}
function hut(x,px,py,s,R,smoke){gshadow(x,px+s*.7,py+s*.12,s*1.3,s*.42,.5);const P=HIDE;x.fillStyle=hg(x,px-s,px+s,[[0,P[1]],[.25,P[0]],[.6,P[2]],[1,P[3]]]);
  x.beginPath();x.moveTo(px-s,py);x.quadraticCurveTo(px-s*.85,py-s*.9,px,py-s*1.25);x.quadraticCurveTo(px+s*.85,py-s*.9,px+s,py);x.ellipse(px,py,s,s*.36,0,0,Math.PI,false);x.closePath();x.fill();
  x.strokeStyle='rgba(40,30,22,.5)';x.lineWidth=.7;for(const t of[-.5,0,.5]){x.beginPath();x.moveTo(px+t*s,py+s*.3*(1-Math.abs(t)));x.quadraticCurveTo(px+t*s*.6,py-s*.6,px,py-s*1.2);x.stroke();}
  x.strokeStyle=BONE[1];x.lineWidth=1.3;x.lineCap='round';x.beginPath();x.moveTo(px-s*.15,py-s*1.15);x.lineTo(px-s*.42,py-s*1.6);x.moveTo(px+s*.1,py-s*1.15);x.lineTo(px+s*.38,py-s*1.65);x.moveTo(px,py-s*1.2);x.lineTo(px+s*.02,py-s*1.55);x.stroke();
  x.fillStyle='#120d0b';x.beginPath();x.moveTo(px-s*.24,py+s*.33);x.quadraticCurveTo(px-s*.22,py-s*.3,px+s*.02,py-s*.36);x.quadraticCurveTo(px+s*.24,py-s*.3,px+s*.26,py+s*.33);x.closePath();x.fill();
  x.fillStyle=BONE[0];x.beginPath();x.moveTo(px-s*.3,py+s*.3);x.quadraticCurveTo(px-s*.5,py,px-s*.36,py-s*.25);x.lineTo(px-s*.28,py+s*.3);x.fill();x.beginPath();x.moveTo(px+s*.32,py+s*.3);x.quadraticCurveTo(px+s*.52,py,px+s*.38,py-s*.25);x.lineTo(px+s*.3,py+s*.3);x.fill();
  smoke&&smoke.push({x:px+s*.05,y:py-s*1.35});}
function boneFence(x,cx,cy,rx,ry,front,gap){for(let k=0;k<44;k++){const a=k/44*Math.PI*2,sa=Math.sin(a);if(front?sa<0:sa>=0)continue;if(gap&&Math.abs(a-Math.PI/2)<.2)continue;const px=cx+Math.cos(a)*rx,py=cy+sa*ry;const h=12+(k*7%5)*1.4;
  x.fillStyle=k%3===0?BONE[1]:k%3===1?'#4a3f36':'#5e5146';x.beginPath();x.moveTo(px-1.8,py);x.lineTo(px-1.6,py-h);x.lineTo(px,py-h-4);x.lineTo(px+1.6,py-h);x.lineTo(px+1.8,py);x.closePath();x.fill();
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(px+.2,py-h,1.6,h);if(k%7===3)skull(x,px,py-h-4,2.2,BONE[0]);}
  x.strokeStyle='#2a2320';x.lineWidth=1.2;x.beginPath();x.ellipse(cx,cy-6,rx,ry,0,front?.05:Math.PI+.05,front?Math.PI-.05:Math.PI*2-.05);x.stroke();}
function palisade(x,cx,cy,rx,ry,front){const N=34;const L=[];for(let k=0;k<N;k++){const a=(k+.5)/N*Math.PI*2,sa=Math.sin(a);if(front?sa<0:sa>=0)continue;L.push(a);}L.sort((p,q)=>Math.sin(p)-Math.sin(q));
  for(const a of L){const ca=Math.cos(a),px=cx+ca*rx,py=cy+Math.sin(a)*ry;const bone=Math.round(a*N/Math.PI/2)%3===0,h=bone?24:20;const lit=.5-ca*.45;
    x.fillStyle=bone?mixh(BONE[3],BONE[0],lit):mixh(IRON[3],IRON[1],lit);x.beginPath();x.moveTo(px-3,py);x.lineTo(px-3,py-h);x.lineTo(px,py-h-(bone?8:5));x.lineTo(px+3,py-h);x.lineTo(px+3,py);x.closePath();x.fill();
    x.fillStyle='rgba(0,0,0,.3)';x.fillRect(px+.6,py-h,2.4,h);}
  x.strokeStyle='#4d4b55';x.lineWidth=2;x.beginPath();x.ellipse(cx,cy-9,rx,ry,0,front?.08:Math.PI+.08,front?Math.PI-.08:Math.PI*2-.08);x.stroke();
  x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=1;x.beginPath();x.ellipse(cx,cy-7.6,rx,ry,0,front?.08:Math.PI+.08,front?Math.PI-.08:Math.PI*2-.08);x.stroke();}
function keepBox(x,px,py,w,d,h,P,G,o){o=o||{};const front=py+d/2,top=py-d/2-h;gshadow(x,px+w*.45,front+3,w*.9,d*.55,.5);
  x.fillStyle=vg(x,front-h,front,[[0,P[1]],[1,P[3]]]);x.fillRect(px-w/2,front-h,w,h);x.fillStyle=hg(x,px-w/2,px+w/2,[[0,'rgba(255,235,220,.12)'],[.45,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.35)']]);x.fillRect(px-w/2,front-h,w,h);
  x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=.7;for(let yy=front-6,r=0;yy>front-h;yy-=6,r++){x.beginPath();x.moveTo(px-w/2,yy);x.lineTo(px+w/2,yy);x.stroke();}
  x.fillStyle=P[3];x.fillRect(px-w/2,top,w,d);x.strokeStyle=rgba(P[0],.5);x.lineWidth=1;x.beginPath();x.moveTo(px-w/2,front-h);x.lineTo(px-w/2,top);x.lineTo(px+w/2,top);x.stroke();
  const nw=Math.max(1,Math.floor(w/16));for(let i=0;i<nw;i++){const wx=px-w/2+w*(i+.5)/nw;win(x,wx,front-h*.48,3.4,7.5,G);if(h>40)win(x,wx,front-h*.8,3,6,G,.85);}
  return{top,front};}
function pyramid(x,px,top,w,d,rh,P,tip){const ax=px,ay=top+d/2-rh;x.fillStyle=P[3];x.beginPath();x.moveTo(px+w/2+2,top+d);x.lineTo(ax,ay);x.lineTo(px+w/2+2,top-1);x.closePath();x.fill();
  x.fillStyle=P[1];x.beginPath();x.moveTo(px-w/2-2,top+d);x.lineTo(ax,ay);x.lineTo(px-w/2-2,top-1);x.closePath();x.fill();
  x.fillStyle=vg(x,ay,top+d,[[0,P[1]],[1,P[2]]]);x.beginPath();x.moveTo(px-w/2-3,top+d+1);x.quadraticCurveTo(px-w*.12,top+d-rh*.45,ax,ay);x.quadraticCurveTo(px+w*.12,top+d-rh*.45,px+w/2+3,top+d+1);x.closePath();x.fill();
  x.strokeStyle=rgba(P[0],.7);x.lineWidth=1;x.beginPath();x.moveTo(px-w/2-3,top+d+1);x.quadraticCurveTo(px-w*.12,top+d-rh*.45,ax,ay);x.stroke();
  x.fillStyle=P[4];for(const d2 of[-1,1]){x.beginPath();x.moveTo(px+d2*(w/2+3),top+d+1);x.lineTo(px+d2*(w/2+8),top+d-5);x.lineTo(px+d2*(w/2-1),top+d-2);x.closePath();x.fill();}
  if(tip){x.fillStyle=tip;x.beginPath();x.moveTo(ax-1.4,ay+6);x.lineTo(ax,ay-4);x.lineTo(ax+1.4,ay+6);x.closePath();x.fill();}return ay;}
// ---------- sprites ----------
function spriteCastle(lv,col,capital,path,neutral){
  const L=Math.min(3,lv),outer=lv>=4,big=lv>=5,throne=lv>=6;const size=outer?620:[0,400,460,520][L];const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+40;
  const rx=RX[L],ry=RY[L],orx=rx+36,ory=ry+27,FR=outer?orx:rx,FRY=outer?ory:ry;const flags=[],smoke=[],D=[],add=(y,f)=>D.push({y,f});
  const R=aRng(lv*131+path*17+(capital?7:0)+(neutral?3:0));const bast=path===1,well=path===2,dark=path===3,forge=path===4;
  const acc=neutral?'#9a9284':col,G=neutral?GL.pale:well?GL.soul:dark?GL.vio:forge?GL.forge:GL.emb,P=neutral?NSTONE:bast?ISTONE:STONE,O=neutral?NOBS:OBS,tipC=neutral?BONE[2]:BONE[1];
  gshadow(x,c+12,cy+14,FR+40,FRY+30,.6);pad(x,c,cy,FR+8,FRY+6,R,neutral);
  if(bast)rampart(x,c,cy+3,FR+9,FRY+7);
  if(!neutral)runeRing(x,c,cy+2,FR+(bast?25:13),FRY+(bast?19:10),col,R);
  if(bast)stakes(x,c,cy+3,FR+12,FRY+9,false,BONE,22,24,3.4);
  // keep placement per path
  let kx=c-10,ky=cy-6;if(L>=2&&well){kx=c-18;ky=cy-(L===2?24:30);}else if(dark){kx=c-24;ky=cy-2;}else if(forge){kx=c-26;ky=cy-(L===2?18:24);}
  if(L>=2&&well){const py=cy+(L===2?20:24),prx=L===2?24:30;soulPit(x,c+6,py,prx,prx*.5,R);add(py,()=>wisps(x,c+6,py,L===2?60:80,5,R));smoke.push({x:c+6,y:py-6});add(py-4,()=>altar(x,c+(L===2?50:58),py-8,1));}
  if(L>=2&&forge){lavaPool(x,c+16,cy+(L===2?22:28),20,7);const ay=cy+(L===2?20:26);add(ay,()=>anvil(x,c-14,ay,1,R));}
  if(capital&&!well){const ax=L===1?c-26:L===2?c-48:c-58,ay=L===1?cy+20:L===2?cy+22:cy+28;add(ay,()=>altar(x,ax,ay,L===1?.8:1));}
  if(L===1){
    palisade(x,c,cy,rx,ry,false);const tx=c+8,ty=cy-8;
    add(ty,()=>{const top=towerBody(x,tx,ty,19,34,P);for(let i=0;i<9;i++){const a=(i+.5)/9*Math.PI*2,sa=Math.sin(a);if(sa>0)continue;}
      teeth(x,tx,top,19,10,7,P,false);x.fillStyle=P[3];ell(x,tx,top,16,6.6);x.fill();flame(x,tx,top+1,5.5,G);teeth(x,tx,top,19,10,9,P,true);
      win(x,tx-6,ty-12,3.4,7,G);flags.push({x:tx+13,y:top-2,s:capital?1.5:1.1,cap:!!capital});smoke.push({x:tx,y:top-12});});
    add(cy+14,()=>hut(x,c-36,cy+14,15,R,smoke));add(cy+24,()=>brazier(x,c+34,cy+24,1,G));add(cy+19,()=>drape(x,tx-1,ty-30,10,16,acc));
  }else{
    const n=6,verts=[];for(let k=0;k<n;k++){const a=-Math.PI/2+k*Math.PI/3+Math.PI/6;verts.push({x:c+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});}
    const wh=(L===3?22:18)+(bast?6:0),tr=big?17:L===3?15:12,th=big?56:L===3?44:34,sh=big?58:L===3?40:30;
    const segs=verts.map((v,k)=>({a:v,b:verts[(k+1)%n],my:(v.y+verts[(k+1)%n].y)/2}));const fs=segs.reduce((p,q)=>q.my>p.my?q:p);
    for(const s of segs){const back=s.my<cy-5;add(s.my,()=>{wallSeg(x,s.a,s.b,wh,P,{back,band:bast,tooth:bast?7:8,th2:bast?9:6});
      if(s===fs){const gx=(s.a.x+s.b.x)/2,gy=(s.a.y+s.b.y)/2;gate(x,gx,gy,16,wh*.78,G,P);x.fillStyle='rgba(0,0,0,0)';drape(x,gx-15,gy-wh+1,7,12,acc);drape(x,gx+15,gy-wh+1,7,12,acc);
        for(const d of[-1,1])brazier(x,gx+d*24,gy+6,.8,G);}});}
    verts.forEach((v,k)=>{const adj=Math.max(segs[k].my,segs[(k+n-1)%n].my);add(adj+.5,()=>{const top=towerBody(x,v.x,v.y,tr,th,P);teeth(x,v.x,top,tr,9,5,P,false);
      const st=spire(x,v.x,top+1,tr*.88,sh,O,{barbs:L>=3,tip:big?null:tipC});teeth(x,v.x,top,tr,9,5,P,true);win(x,v.x-tr*.3,v.y-th*.45,3,6.5,G);
      if(big){flame(x,v.x,st+6,4.2,neutral?GL.pale:GL.emb);}
      if(v.y>cy+5||k===0)flags.push({x:v.x,y:st+(big?-2:1),s:big?1.05:.9});});});
    // keep
    const kw=L===3?62:56,kd=L===3?40:36,kh=(L===3?50:42)+(big?14:0);
    add(ky+kd/2,()=>{const k0=keepBox(x,kx,ky,kw,kd,kh,P,G);drape(x,kx-kw*.27,k0.front-kh+3,9,18,acc);drape(x,kx+kw*.27,k0.front-kh+3,9,18,acc);
      if(throne){const sx=kx,sy=k0.top+kd*.5;const t2=towerBody(x,sx,sy,17,70,P);teeth(x,sx,t2,17,10,6,P,false);for(let i=0;i<3;i++)win(x,sx-5+i*5,sy-22-i*14,2.6,6,G);
        const st=spire(x,sx,t2+1,15,150,O,{barbs:true,rim:'#ffd0b0'});teeth(x,sx,t2,17,10,6,P,true);flame(x,sx,st+10,7,GL.emb);glow(x,sx,st+4,26,GL.emb[2],.35);
        flags.push({x:sx,y:st-2,s:1.75,cap:true});}
      else{const ay=pyramid(x,kx,k0.top,kw,kd,L===3?44:36,O,tipC);if(big){for(let i=-2;i<=2;i++)flame(x,kx+i*kw*.2,k0.top+kd*.2+Math.abs(i)*3,3.6,GL.emb,.9);}
        flags.push({x:kx,y:ay+1,s:capital?1.7:1.15,cap:!!capital});}});
    if(L===3&&!well&&!dark&&!forge){const tx=c+40,ty=cy-16;add(ty+.3,()=>{const top=towerBody(x,tx,ty,19,big?104:88,P);teeth(x,tx,top,19,10,6,P,false);const st=spire(x,tx,top+1,17,big?58:46,O,{barbs:true,tip:tipC});teeth(x,tx,top,19,10,6,P,true);
      win(x,tx-6,ty-30,3.2,7,G);win(x,tx-4,ty-58,3,6.5,G);if(big)flame(x,tx,st+7,5,GL.emb);flags.push({x:tx,y:st+1,s:1});});}
    if(L>=2&&well){const tx=c+48,ty=cy-30;add(ty,()=>{const top=towerBody(x,tx,ty,14,50,P);const st=spire(x,tx,top+1,13,34,O,{tip:tipC});win(x,tx-4,ty-24,3,6,G);});}
    if(dark){const tx=c+38,ty=cy-14;add(ty+.3,()=>{const top=towerBody(x,tx,ty,16,128+(big?20:0),O);x.strokeStyle='rgba(190,150,255,.18)';x.lineWidth=1;for(const d of[-9,-3,4]){x.beginPath();x.moveTo(tx+d,ty-4);x.lineTo(tx+d,top+4);x.stroke();}
      for(let i=0;i<4;i++)win(x,tx-5,ty-22-i*26,2.6,7,GL.vio);x.fillStyle=O[3];ell(x,tx,top,19,8);x.fill();x.strokeStyle=rgba(O[0],.6);x.stroke();
      for(const d of[-1,1]){x.fillStyle=d<0?O[1]:O[3];x.beginPath();x.moveTo(tx+d*16,top+2);x.quadraticCurveTo(tx+d*22,top-16,tx+d*8,top-34);x.quadraticCurveTo(tx+d*14,top-16,tx+d*8,top+1);x.closePath();x.fill();}
      eyeFlame(x,tx,top-16,6);smoke.push({x:tx,y:top-26});});}
    if(forge){const ch=[[c+30,cy-36,15,88],[c+54,cy-22,13,72]];if(L===3)ch.push([c+8,cy-44,11,62]);for(const [px,py,w,h] of ch)add(py,()=>chimney(x,px,py,w,h,smoke));}
    if(outer){const no=10,ov=[];for(let k=0;k<no;k++){const a=-Math.PI/2+k*2*Math.PI/no+Math.PI/no;ov.push({x:c+Math.cos(a)*orx,y:cy+Math.sin(a)*ory});}
      const osegs=ov.map((v,k)=>({a:v,b:ov[(k+1)%no],my:(v.y+ov[(k+1)%no].y)/2}));const fo=osegs.reduce((p,q)=>q.my>p.my?q:p);const owh=16+(bast?6:0);
      for(const s of osegs){add(s.my,()=>{wallSeg(x,s.a,s.b,owh,P,{back:s.my<cy-5,band:bast,tooth:7,th2:bast?8:5,th:4});
        if(s===fo){const gx=(s.a.x+s.b.x)/2,gy=(s.a.y+s.b.y)/2;if(throne)hellmouth(x,gx,gy,30,26);else{gate(x,gx,gy,14,owh*.8,G,P);for(const d of[-1,1])brazier(x,gx+d*20,gy+5,.75,G);}}});}
      ov.forEach((v,k)=>{const adj=Math.max(osegs[k].my,osegs[(k+no-1)%no].my);add(adj+.5,()=>{const top=towerBody(x,v.x,v.y,10,28+(big?6:0),P);const st=spire(x,v.x,top+1,9,big?30:22,O,{tip:tipC});teeth(x,v.x,top,10,7,4,P,true);
        if(big&&v.y>cy)flame(x,v.x,st+4,3,GL.emb,.9);if(v.y>cy+ory*.8)flags.push({x:v.x,y:st+1,s:.85});});});}
  }
  D.sort((p,q)=>p.y-q.y);for(const d of D)d.f();
  if(bast)stakes(x,c,cy+3,FR+12,FRY+9,true,BONE,22,24,3.4);
  const plaque=FRY+(bast?38:30);
  return{cn,size,ox:c,oy:cy,flags,smoke,plaque,foot:FR+14,footY:FRY+10};
}
function spriteHovel(){const size=360;const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+20;const smoke=[],flags=[],R=aRng(77);
  gshadow(x,c+8,cy+16,140,80,.5);const g=x.createRadialGradient(c-20,cy-10,10,c,cy+8,120);g.addColorStop(0,'#6b645a');g.addColorStop(1,'rgba(60,55,48,0)');x.fillStyle=g;ell(x,c,cy+8,124,72);x.fill();
  for(let i=0;i<50;i++){x.fillStyle=R()<.5?'rgba(220,210,190,.12)':'rgba(0,0,0,.15)';const a=R()*6.28,r=R();x.beginPath();x.ellipse(c+Math.cos(a)*100*r,cy+8+Math.sin(a)*58*r,2+R()*3,1+R()*1.5,0,0,7);x.fill();}
  boneFence(x,c,cy+10,122,72,false);const D=[];
  for(const [dx,dy,s] of[[-50,-28,17],[30,-36,19],[-6,4,16],[60,12,15],[-66,24,14]])D.push({y:cy+dy,f:()=>hut(x,c+dx,cy+dy,s,R,smoke)});
  D.push({y:cy-4,f:()=>{brazier(x,c+24,cy-4,1.05,GL.pale);smoke.push({x:c+24,y:cy-18});}});D.push({y:cy+36,f:()=>brazier(x,c-30,cy+36,1,GL.pale)});
  D.push({y:cy-12,f:()=>{const tx=c-14,ty=cy-12;x.fillStyle='#3a302a';x.fillRect(tx-1.6,ty-30,3.2,30);skull(x,tx,ty-31,3.6,BONE[0],GL.pale[1]);horn(x,tx-3,ty-33,1.1,-1,BONE[1]);horn(x,tx+3,ty-33,1.1,1,BONE[1]);flags.push({x:tx,y:ty-36,s:.9});}});
  D.sort((p,q)=>p.y-q.y);for(const d of D)d.f();
  for(let i=0;i<4;i++){const px=c+(R()-.5)*140,py=cy+30+R()*26;x.strokeStyle=BONE[1];x.lineWidth=1.4;x.beginPath();x.moveTo(px-3,py);x.lineTo(px+3,py-1.2);x.stroke();}
  boneFence(x,c,cy+10,122,72,true,true);
  return{cn,size,ox:c,oy:cy,flags,smoke,plaque:84,foot:118,footY:70};}
function spriteFortress(nw){const L=3,size=520;const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+40;const rx=RX[L],ry=RY[L];const flags=[],smoke=[],D=[],add=(y,f)=>D.push({y,f});const R=aRng(nw?991:551);
  const P=FSTONE,O=OBS,G=GL.red;gshadow(x,c+12,cy+14,rx+40,ry+30,.65);pad(x,c,cy,rx+8,ry+6,R,true);
  if(nw)stakes(x,c,cy+3,rx+8,ry+6,false,['#e8dcc0','#c8b894','#8a7a5e'],30,18);
  const n=6,verts=[];for(let k=0;k<n;k++){const a=-Math.PI/2+k*Math.PI/3+Math.PI/6;verts.push({x:c+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});}
  const wh=nw?28:20,tr=15,th=nw?50:42,sh=nw?46:38;const segs=verts.map((v,k)=>({a:v,b:verts[(k+1)%n],my:(v.y+verts[(k+1)%n].y)/2}));const fs=segs.reduce((p,q)=>q.my>p.my?q:p);
  for(const s of segs)add(s.my,()=>{wallSeg(x,s.a,s.b,wh,P,{back:s.my<cy-5,tooth:7,th2:nw?10:7});
    const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y;if(s.my>cy-5)for(let t=.25;t<.8;t+=.25){skull(x,s.a.x+dx*t,s.a.y+dy*t-wh*.55,2.2,BONE[1],G[2]);}
    if(s===fs){const gx=(s.a.x+s.b.x)/2,gy=(s.a.y+s.b.y)/2;gate(x,gx,gy,18,wh*.75,G,P);skull(x,gx,gy-wh-6,6,BONE[0],G[1]);for(const d of[-1,1])glow(x,gx+d*2.3,gy-wh-5,6,G[2],.6);}});
  verts.forEach((v,k)=>{const adj=Math.max(segs[k].my,segs[(k+n-1)%n].my);add(adj+.5,()=>{const top=towerBody(x,v.x,v.y,tr,th,P);teeth(x,v.x,top,tr,9,7,P,false);const st=spire(x,v.x,top+1,tr*.85,sh,O,{barbs:true,tip:BONE[0]});teeth(x,v.x,top,tr,9,7,P,true);
    for(const d of[-1,1]){glow(x,v.x-3+d*3,v.y-th*.62,5,G[2],.7);x.fillStyle=G[1];x.beginPath();x.ellipse(v.x-3+d*3,v.y-th*.62,1.7,.9,d*.4,0,7);x.fill();}flags.push({x:v.x,y:st+1,s:.9});});});
  add(cy+14,()=>{const k0=keepBox(x,c-8,cy-6,58,38,52,P,G);const ay=pyramid(x,c-8,k0.top,58,38,46,O,BONE[0]);for(const d of[-1,1])horn(x,c-8+d*26,k0.top+30,2.2,d,BONE[1]);
    skull(x,c-8,k0.front-38,5,BONE[0],G[1]);flags.push({x:c-8,y:ay+1,s:1.1});});
  add(cy-16.5,()=>{const tx=c+40,ty=cy-16;const top=towerBody(x,tx,ty,18,92,P);teeth(x,tx,top,18,10,7,P,false);const st=spire(x,tx,top+1,16,52,O,{barbs:true,tip:BONE[0]});teeth(x,tx,top,18,10,7,P,true);
    for(const d of[-1,1]){glow(x,tx-4+d*3.5,ty-60,6,G[2],.8);x.fillStyle=G[1];x.beginPath();x.ellipse(tx-4+d*3.5,ty-60,2,1,d*.4,0,7);x.fill();}flags.push({x:tx,y:st+1,s:1});});
  D.sort((p,q)=>p.y-q.y);for(const d of D)d.f();
  if(nw)stakes(x,c,cy+3,rx+8,ry+6,true,['#e8dcc0','#c8b894','#8a7a5e'],30,18);
  return{cn,size,ox:c,oy:cy,flags,smoke,plaque:ry+(nw?40:30),foot:rx+14,footY:ry+10};}
function crystal(x,px,py,s,G,lean){lean=lean||0;const h=s*3.2,w=s*.75;x.save();x.translate(px,py);x.rotate(lean);glow(x,0,-h*.5,s*2.6,G[2],.35);
  x.fillStyle=G[2];x.beginPath();x.moveTo(-w,0);x.lineTo(-w,-h*.75);x.lineTo(0,-h);x.lineTo(0,0);x.closePath();x.fill();x.fillStyle=G[3];x.beginPath();x.moveTo(0,0);x.lineTo(0,-h);x.lineTo(w,-h*.75);x.lineTo(w,0);x.closePath();x.fill();
  x.fillStyle=G[1];x.beginPath();x.moveTo(-w*.6,-h*.15);x.lineTo(-w*.6,-h*.7);x.lineTo(-w*.15,-h*.85);x.lineTo(-w*.15,-h*.2);x.closePath();x.fill();x.restore();}
function spriteSpring(col,lv){const size=300;const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+20;const flags=[],smoke=[],R=aRng(31+lv*7),D=[],add=(y,f)=>D.push({y,f});
  gshadow(x,c+6,cy+8,92,56,.45);const g=x.createRadialGradient(c,cy,10,c,cy,86);g.addColorStop(0,'#3f3a44');g.addColorStop(1,'rgba(40,36,44,0)');x.fillStyle=g;ell(x,c,cy,86,54);x.fill();
  if(col)runeRing(x,c,cy+2,74,52,col,R);
  x.strokeStyle=rgba(GL.soul[1],.55);x.lineWidth=1.2;x.lineCap='round';for(let i=0;i<12;i++){const a=R()*Math.PI*2;let px=c+Math.cos(a)*30,py=cy+Math.sin(a)*18;x.beginPath();x.moveTo(px,py);for(let k=0;k<4;k++){px+=Math.cos(a+(R()-.5)*1.2)*8;py+=Math.sin(a+(R()-.5)*1.2)*5;x.lineTo(px,py);}x.stroke();}
  soulPit(x,c,cy,28,15,R);
  const geyser=(gx,gy,h,w)=>{const gg=x.createLinearGradient(0,gy-h,0,gy);gg.addColorStop(0,'rgba(170,230,255,0)');gg.addColorStop(.5,'rgba(170,230,255,.45)');gg.addColorStop(1,'rgba(230,250,255,.85)');x.fillStyle=gg;
    x.beginPath();x.moveTo(gx-w,gy);x.quadraticCurveTo(gx-w*.4,gy-h*.5,gx-w*1.6,gy-h);x.lineTo(gx+w*1.6,gy-h);x.quadraticCurveTo(gx+w*.4,gy-h*.5,gx+w,gy);x.closePath();x.fill();
    x.fillStyle='rgba(240,252,255,.7)';x.beginPath();x.moveTo(gx-w*.35,gy);x.quadraticCurveTo(gx-w*.1,gy-h*.5,gx-w*.5,gy-h*.8);x.lineTo(gx+w*.5,gy-h*.8);x.quadraticCurveTo(gx+w*.1,gy-h*.5,gx+w*.35,gy);x.closePath();x.fill();
    glow(x,gx,gy-h*.3,w*5,GL.soul[2],.3);smoke.push({x:gx,y:gy-h*.8});};
  add(cy+1,()=>{geyser(c-2,cy+2,lv>=2?70:60,6);wisps(x,c,cy,60,3,R);});
  if(lv>=2)add(cy-6,()=>{geyser(c+16,cy-4,44,4);x.strokeStyle='#6e5c46';x.lineWidth=2.4;x.lineCap='round';x.beginPath();x.moveTo(c-26,cy+10);x.lineTo(c-8,cy-58);x.lineTo(c+12,cy+12);x.moveTo(c+10,cy-6);x.lineTo(c+24,cy-50);x.lineTo(c+36,cy+4);x.moveTo(c-17,cy-26);x.lineTo(c+4,cy-26);x.moveTo(c-8,cy-58);x.lineTo(c+24,cy-50);x.stroke();
    x.strokeStyle=BONE[1];x.lineWidth=1.2;x.beginPath();x.moveTo(c-8,cy-58);x.lineTo(c-8,cy-34);x.stroke();});
  for(const [dx,dy,s,l] of[[-40,-6,4.2,-.25],[-48,4,3.4,-.5],[38,-10,4.6,.2],[46,2,3.6,.45],[-30,-18,3,-.1],[30,-20,3.2,.15]])add(cy+dy,()=>crystal(x,c+dx,cy+dy,s,GL.soul,l));
  add(cy+26,()=>{const kx=c+26,ky=cy+26;gshadow(x,kx+6,ky+2,16,5,.5);x.fillStyle='#3a2f28';x.beginPath();x.moveTo(kx-12,ky-12);x.lineTo(kx+12,ky-12);x.lineTo(kx+9,ky-1);x.lineTo(kx-9,ky-1);x.closePath();x.fill();x.fillStyle='#5a4a3c';x.fillRect(kx-12,ky-13,24,2);
    for(const d of[-1,1]){x.fillStyle='#1c1a1e';x.beginPath();x.arc(kx+d*6,ky,3,0,7);x.fill();}for(let i=0;i<4;i++)crystal(x,kx-7+i*4.5,ky-11,1.6,GL.soul,(i-1.5)*.25);});
  if(lv>=3){const no=6;for(let k=0;k<no;k++){const a=k/no*Math.PI*2+Math.PI/6;const ox=c+Math.cos(a)*64,oy=cy+Math.sin(a)*40;add(oy,()=>{gshadow(x,ox+5,oy+1,9,3,.5);x.fillStyle=hg(x,ox-4,ox+4,[[0,OBS[1]],[.3,OBS[0]],[1,OBS[3]]]);x.beginPath();x.moveTo(ox-4,oy);x.lineTo(ox-2.4,oy-30);x.lineTo(ox,oy-36);x.lineTo(ox+2.4,oy-30);x.lineTo(ox+4,oy);x.closePath();x.fill();
    glow(x,ox,oy-34,9,GL.soul[2],.6);x.fillStyle=GL.soul[0];x.beginPath();x.arc(ox,oy-34,1.6,0,7);x.fill();x.strokeStyle=rgba(GL.soul[1],.8);x.lineWidth=.9;x.beginPath();x.moveTo(ox-1,oy-8);x.lineTo(ox-1,oy-22);x.stroke();});}}
  D.sort((p,q)=>p.y-q.y);for(const d of D)d.f();
  if(col)flags.push({x:c+44,y:cy-14,s:1.2});
  return{cn,size,ox:c,oy:cy,flags,smoke,plaque:72,foot:62,footY:44};}
const SPR=new Map(),SPRH=new Map();
function spriteFor(c,col,hi){
  const neutral=c.owner===NEUTRAL,kind=c.kind||'c',lv=Math.max(1,Math.min(6,c.lv|0||1)),path=c.path|0,cap=c.capital>=0?1:0,nw=c.nw?1:0;
  const key=kind+'|'+lv+'|'+path+'|'+cap+'|'+nw+'|'+(neutral?'n':col);
  const M=hi?SPRH:SPR;let s=M.get(key);if(s){if(hi){M.delete(key);M.set(key,s);}return s;}
  if(hi){if(M.size>=16)M.delete(M.keys().next().value);}else if(M.size>70)M.clear();
  SK=hi?2.7:1.3;
  if(kind==='m')s=spriteSpring(neutral?null:col,Math.min(3,lv));else if(kind==='v'&&neutral)s=spriteHovel();else if(kind==='f'&&neutral)s=spriteFortress(nw);
  else s=spriteCastle(lv,col,cap,path,neutral);
  M.set(key,s);return s;}
function footOf(c){const s=c.kind==='m'?{foot:62,footY:44}:c.kind==='v'&&c.owner===NEUTRAL?{foot:118,footY:70}:{foot:RX[Math.min(3,c.lv)]+14+(c.lv>=4?36:0),footY:RY[Math.min(3,c.lv)]+10+(c.lv>=4?27:0)};return{rx:s.foot*ART,ry:s.footY*ART};}
// ---------- per-frame pieces (world units) ----------
function drawFlag(x,fx,fy,s,col,t,limp){const ph=t*2.3+fx*.37+fy*.11,w=limp?0:Math.sin(ph),w2=limp?0:Math.sin(ph*1.6+1.1);const c=limp?memo(col+'L',()=>mixh(mixh(col,'#8a8478',.5),'#ffffff',.15)):col;
  x.lineCap='round';x.strokeStyle='#1d181e';x.lineWidth=1.6*s;x.beginPath();x.moveTo(fx,fy);x.lineTo(fx,fy-20.5*s);x.moveTo(fx-.6*s,fy-18*s);x.lineTo(fx+15.6*s,fy-18*s+w2*.3*s);x.stroke();
  x.fillStyle='#d9ccb0';x.beginPath();x.moveTo(fx-2.6*s,fy-23*s);x.quadraticCurveTo(fx-.6*s,fy-19.6*s,fx,fy-20*s);x.quadraticCurveTo(fx+.6*s,fy-19.6*s,fx+2.6*s,fy-23*s);x.quadraticCurveTo(fx+.8*s,fy-20.8*s,fx,fy-21.6*s);x.quadraticCurveTo(fx-.8*s,fy-20.8*s,fx-2.6*s,fy-23*s);x.fill();
  const L=fx+1.4*s,Rr=fx+15*s,top=fy-17.6*s,bot=fy-5.4*s,sw=w*2.2*s,mid=(top+bot)/2;
  x.fillStyle=c;x.beginPath();x.moveTo(L,top);x.lineTo(Rr,top);x.quadraticCurveTo(Rr+sw*.45,mid,Rr+sw,bot-1.6*s);x.lineTo(Rr-2.1*s+sw,bot+1.7*s);x.lineTo(Rr-4.2*s+sw,bot-1.6*s);x.lineTo(fx+8.2*s+sw,bot+2.8*s);
  x.lineTo(fx+5.9*s+sw,bot-1.2*s);x.lineTo(L+2.5*s+sw,bot+1.2*s);x.lineTo(L+sw*.95,bot-2*s);x.quadraticCurveTo(L+sw*.45,mid,L,top);x.closePath();x.fill();
  x.strokeStyle=memo(col+'d',()=>shh(col,-.55));x.lineWidth=.55*s;x.stroke();
  x.fillStyle=memo(col+'f',()=>rgba(shh(col,-.45),.55));x.beginPath();x.moveTo(fx+9.6*s,top);x.lineTo(fx+12.6*s,top);x.quadraticCurveTo(fx+12.6*s+sw*.4,mid,fx+12*s+sw*.9,bot-1.4*s);x.lineTo(fx+9.4*s+sw*.9,bot-.6*s);x.quadraticCurveTo(fx+9.6*s+sw*.4,mid,fx+9.6*s,top);x.fill();
  const ex=fx+8.2*s+sw*.42,ey=fy-11.6*s;x.fillStyle=memo(col+'e',()=>shh(col,-.6));x.beginPath();x.arc(ex,ey,1.5*s,0,7);x.moveTo(ex-1.3*s,ey-.8*s);x.lineTo(ex-2.8*s,ey-3.4*s);x.lineTo(ex-.4*s,ey-1.5*s);x.moveTo(ex+1.3*s,ey-.8*s);x.lineTo(ex+2.8*s,ey-3.4*s);x.lineTo(ex+.4*s,ey-1.5*s);x.fill();}
function drawSigil(x,cx,cy,r,col){x.fillStyle=col;x.beginPath();x.moveTo(cx-r*.66,cy-r*.36);x.lineTo(cx-r*.84,cy-r*1.04);x.lineTo(cx-r*.38,cy-r*.68);x.lineTo(cx,cy-r*1.22);x.lineTo(cx+r*.38,cy-r*.68);x.lineTo(cx+r*.84,cy-r*1.04);x.lineTo(cx+r*.66,cy-r*.36);x.closePath();x.fill();
  x.beginPath();x.arc(cx,cy+r*.04,r*.66,0,Math.PI*2);x.fill();x.beginPath();x.rect(cx-r*.4,cy+r*.36,r*.8,r*.56);x.fill();
  x.fillStyle='rgba(12,6,8,.72)';x.beginPath();x.ellipse(cx-r*.26,cy+r*.1,r*.18,r*.21,0,0,7);x.ellipse(cx+r*.26,cy+r*.1,r*.18,r*.21,0,0,7);x.fill();x.beginPath();x.moveTo(cx,cy+r*.3);x.lineTo(cx-r*.09,cy+r*.46);x.lineTo(cx+r*.09,cy+r*.46);x.closePath();x.fill();
  x.fillRect(cx-r*.17,cy+r*.62,r*.07,r*.3);x.fillRect(cx+r*.1,cy+r*.62,r*.07,r*.3);}
function drawStar(x,cx,cy,r,col){drawSigil(x,cx,cy,r,col);}
const TGLOW=new Map();function glowSpr(col){let g=TGLOW.get(col);if(!g){g=document.createElement('canvas');g.width=g.height=64;const q=g.getContext('2d');const gr=q.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,rgba(col,.75));gr.addColorStop(.3,rgba(col,.3));gr.addColorStop(1,rgba(col,0));q.fillStyle=gr;q.fillRect(0,0,64,64);TGLOW.set(col,g);}return g;}
function drawTower(x,t,col,now,px){const X=t.x,Y=t.y,neu=t.o===NEUTRAL,bld=t.bt>0,fc=neu?GL.pale[1]:col,h=bld?9:18;
  x.fillStyle='rgba(8,4,6,.4)';x.beginPath();x.ellipse(X+4,Y+1.2,9,3.2,-.12,0,7);x.fill();
  x.fillStyle='#2a252e';x.beginPath();x.ellipse(X,Y,7,2.8,0,0,7);x.fill();x.fillStyle='#3e3746';x.fillRect(X-6.2,Y-3.2,12.4,3.4);x.fillStyle='#57505f';x.fillRect(X-6.2,Y-3.6,12.4,1);
  x.fillStyle='#5d5568';x.beginPath();x.moveTo(X-4.3,Y-3.4);x.lineTo(X-2.5,Y-3.4-h);x.lineTo(X,Y-3.4-h);x.lineTo(X,Y-3.4);x.closePath();x.fill();
  x.fillStyle='#231e29';x.beginPath();x.moveTo(X,Y-3.4);x.lineTo(X,Y-3.4-h);x.lineTo(X+2.5,Y-3.4-h);x.lineTo(X+4.3,Y-3.4);x.closePath();x.fill();
  x.fillStyle=fc;for(let i=0;i<(bld?1:3);i++)x.fillRect(X-2.4+i*.25,Y-6.5-i*4.6,1.3,2.6);
  if(bld){x.strokeStyle='#bfae8a';x.lineWidth=Math.max(.5,.8*Math.min(1,px));for(const d of[-5.5,5.5]){x.beginPath();x.moveTo(X+d,Y);x.lineTo(X+d*.8,Y-h-9);x.stroke();}
    x.beginPath();for(let yy=Y-3;yy>Y-h-9;yy-=4.5){x.moveTo(X-5.4,yy);x.lineTo(X+5.4,yy-1.6);}x.stroke();}
  else{const ty=Y-3.4-h;x.fillStyle='#1b171e';x.beginPath();x.moveTo(X-4.2,ty-2.6);x.lineTo(X+4.2,ty-2.6);x.lineTo(X+2.6,ty);x.lineTo(X-2.6,ty);x.closePath();x.fill();
    const fl=Math.sin(now/110+X)*.9,fl2=Math.sin(now/70+Y)*.5;x.drawImage(glowSpr(fc),X-12,ty-16,24,24);
    x.fillStyle=fc;x.beginPath();x.moveTo(X-3.4,ty-2.4);x.quadraticCurveTo(X-3.6,ty-7,X+fl,ty-11-fl2);x.quadraticCurveTo(X+3.6,ty-7,X+3.4,ty-2.4);x.closePath();x.fill();
    x.fillStyle=neu?'#ffffff':memo(col+'w',()=>shh(col,.65));x.beginPath();x.moveTo(X-1.8,ty-2.4);x.quadraticCurveTo(X-1.8,ty-5.4,X+fl*.6,ty-7.6-fl2);x.quadraticCurveTo(X+1.8,ty-5.4,X+1.8,ty-2.4);x.closePath();x.fill();}
  if(t.hp<TOWER_HP*.98){const w=16,f=Math.max(0,t.hp/TOWER_HP);x.fillStyle='rgba(0,0,0,.55)';x.fillRect(X-w/2,Y+4,w,2.6);x.fillStyle=f>.4?'#5cc06a':'#e0574c';x.fillRect(X-w/2+.3,Y+4.3,(w-.6)*f,2);}}
function drawWonder(x,X,Y,stage,prog,col,now,done){const t=now/1000,hp=[0,9,19,30,30,30][Math.min(5,stage)],w=12,pw=6;
  x.fillStyle='rgba(8,4,6,.4)';x.beginPath();x.ellipse(X+5,Y+1.5,21,5.5,0,0,7);x.fill();
  x.fillStyle='#2a252e';x.beginPath();x.ellipse(X,Y,18,5,0,0,7);x.fill();x.fillStyle='#3d3644';x.fillRect(X-18,Y-3,36,3);x.fillStyle='#4f4758';x.beginPath();x.ellipse(X,Y-3,18,5,0,0,7);x.fill();
  x.strokeStyle=done?col:rgba('#ff7a2a',.5);x.lineWidth=.8;x.beginPath();x.ellipse(X,Y-3,13,3.4,0,0,7);x.stroke();
  const pil=(px,h)=>{if(h<=0)return;x.fillStyle='#4e4659';x.fillRect(px-pw/2,Y-3-h,pw/2,h);x.fillStyle='#211c27';x.fillRect(px,Y-3-h,pw/2,h);x.fillStyle='#655c72';x.fillRect(px-pw/2-.8,Y-3-h-1.2,pw+1.6,1.6);
    x.fillStyle=stage>=2?(done?col:rgba(col,.55)):'rgba(0,0,0,0)';for(let yy=Y-7;yy>Y-3-h+3;yy-=5.5)x.fillRect(px-1.8,yy-1.6,1.2,2.4);};
  if(stage>=5){x.fillStyle=done?'#160b10':'rgba(40,6,10,.85)';x.beginPath();x.moveTo(X-w+pw/2,Y-3);x.lineTo(X-w+pw/2,Y-3-hp);x.quadraticCurveTo(X,Y-3-hp-17,X+w-pw/2,Y-3-hp);x.lineTo(X+w-pw/2,Y-3);x.closePath();x.fill();}
  if(done){const cx=X,cy=Y-3-hp*.62,rx=w-pw/2-.6,ry=hp*.62;x.save();x.beginPath();x.moveTo(X-w+pw/2,Y-3);x.lineTo(X-w+pw/2,Y-3-hp);x.quadraticCurveTo(X,Y-3-hp-17,X+w-pw/2,Y-3-hp);x.lineTo(X+w-pw/2,Y-3);x.closePath();x.clip();
    const g=x.createRadialGradient(cx,cy,0,cx,cy,ry*1.2);g.addColorStop(0,'#fff6d0');g.addColorStop(.25,GL.emb[1]);g.addColorStop(.6,GL.emb[2]);g.addColorStop(1,'#3a0610');x.fillStyle=g;x.fillRect(cx-rx-2,cy-ry*1.6,rx*2+4,ry*2.8);
    x.lineCap='round';for(let i=0;i<4;i++){const a0=t*2.2+i*Math.PI/2;x.strokeStyle=i%2?rgba(col,.7):'rgba(255,240,200,.55)';x.lineWidth=1.3;x.beginPath();for(let k=0;k<=12;k++){const a=a0+k*.38,r=k/12*rx*1.15;const px2=cx+Math.cos(a)*r,py2=cy+Math.sin(a)*r*1.5;k?x.lineTo(px2,py2):x.moveTo(px2,py2);}x.stroke();}x.restore();
    x.save();x.globalAlpha=.16+.08*Math.sin(t*2);x.fillStyle='#ffb35a';for(let k=0;k<7;k++){const an=t*.35+k*Math.PI*2/7;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(an-.07)*52,cy+Math.sin(an-.07)*40);x.lineTo(cx+Math.cos(an+.07)*52,cy+Math.sin(an+.07)*40);x.closePath();x.fill();}x.restore();}
  pil(X-w,hp);pil(X+w,hp);
  if(stage>=4){const top=Y-3-hp;x.strokeStyle='#3a3344';x.lineWidth=pw*.9;x.lineCap='butt';x.beginPath();if(stage>=5){x.moveTo(X-w,top+1);x.quadraticCurveTo(X,top-19,X+w,top+1);}else{x.moveTo(X-w,top+1);x.quadraticCurveTo(X-w*.55,top-9,X-w*.25,top-11);x.moveTo(X+w,top+1);x.quadraticCurveTo(X+w*.55,top-9,X+w*.25,top-11);}x.stroke();
    x.strokeStyle='#655c72';x.lineWidth=1;x.stroke();
    if(stage>=5){x.fillStyle='#d6c8a6';for(const d of[-1,1]){x.beginPath();x.moveTo(X+d*(w+1),top-2);x.quadraticCurveTo(X+d*(w+7),top-10,X+d*(w+4),top-19);x.quadraticCurveTo(X+d*(w+3),top-10,X+d*(w-2),top-4);x.closePath();x.fill();}
      skull(x,X,top-12,2.4,'#e8dcc0',done?GL.emb[1]:'rgba(10,6,6,.8)');}}
  if(done)drawFlag(x,X,Y-3-hp-20,.42,col,t,false);
  else if(prog>0){const nh=stage<3?[9,19,30][stage]:30,top=Y-3-hp-(stage<3?(nh-hp)*Math.max(.15,prog):stage===3?10*Math.max(.15,prog):18*Math.max(.15,prog));x.strokeStyle='#bfae8a';x.lineWidth=.8;x.lineCap='round';
    for(const d of[-w-5,w+5]){x.beginPath();x.moveTo(X+d,Y-1);x.lineTo(X+d*.92,top-3);x.stroke();}x.beginPath();for(let yy=Y-5;yy>top;yy-=5){x.moveTo(X-w-5,yy);x.lineTo(X+w+5,yy-1.5);}x.stroke();
    x.fillStyle=rgba('#ff8a2a',.5+.3*Math.sin(t*6));x.fillRect(X-w-1,top-1,2,2);x.fillRect(X+w-1,top-1,2,2);}}
// ---------- terrain (world units) ----------
const TPAL={
  ash:{ramp:[[0,'#120e0d'],[.3,'#211b19'],[.5,'#2d2522'],[.7,'#3b322d'],[.88,'#4e443d'],[1,'#655a51']],tint:'#3b1d15',tint2:'#4a4038',road:['rgba(8,6,5,.5)','#574d44','#6e6356','#8a7d6c'],rut:'rgba(30,24,20,.5)',dust:['#a49886','#5a5049'],
    crack:'#0b0807',glowc:'#ff7a26',glowa:.85,speck:['#ff9a3a','#ffcf6a','#ff6020'],hill:['#463c37','#2a2320','#16110f'],rune:'#ff8a3a',bank:'#0f0b0a'},
  frost:{ramp:[[0,'#56677a'],[.3,'#7e92a6'],[.52,'#9fb1c2'],[.72,'#bfcdda'],[.88,'#dbe5ee'],[1,'#f3f7fb']],tint:'#6f86a8',tint2:'#e8f0f7',road:['rgba(30,38,50,.5)','#6c7480','#848c96','#9aa1aa'],rut:'rgba(40,50,62,.4)',dust:['#c9d2db','#55606c'],
    crack:'#4a5d74',glowc:'#9fdcff',glowa:.55,speck:['#ffffff','#d8f0ff','#9fdcff'],hill:['#8b9bab','#5f7084','#3c4a5c'],rune:'#8fd6ff',bank:'#dde7ef'},
  sulfur:{ramp:[[0,'#4a3317'],[.3,'#6e5122'],[.5,'#8d6c2f'],[.7,'#a8873e'],[.88,'#c2a352'],[1,'#d8bf6a']],tint:'#7a3218',tint2:'#e2cf55',road:['rgba(40,22,8,.5)','#8a7350','#a38c66','#b9a37c'],rut:'rgba(60,40,18,.45)',dust:['#d8c69a','#6a5230'],
    crack:'#3a2410',glowc:'#ffb040',glowa:.5,speck:['#f4e070','#ffd040','#ff9a3a'],hill:['#8a5a34','#5e3a1e','#3a2410'],rune:'#ffcf5a',bank:'#3a2614'}};
function vnoise(seed){const N=256,T=new Float32Array(N*N),R=aRng(seed);for(let i=0;i<T.length;i++)T[i]=R();
  return(px,py)=>{const xi=Math.floor(px),yi=Math.floor(py),xf=px-xi,yf=py-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),i0=xi&255,j0=yi&255,i1=(i0+1)&255,j1=(j0+1)&255;
    const a=T[j0*N+i0],b=T[j0*N+i1],c=T[j1*N+i0],d=T[j1*N+i1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};}
function fbm(n,px,py,o){let s=0,a=.5,t=0;for(let i=0;i<o;i++){s+=n(px,py)*a;t+=a;a*=.5;px*=2.03;py*=2.03;}return s/t;}
function smoothPts(pts){const out=[];const q=(a,b,c,steps)=>{for(let i=1;i<=steps;i++){const t=i/steps,u=1-t;out.push({x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y});}};
  out.push({x:pts[0].x,y:pts[0].y});let prev=pts[0];for(let i=1;i<pts.length-1;i++){const m={x:(pts[i].x+pts[i+1].x)/2,y:(pts[i].y+pts[i+1].y)/2};q(prev,pts[i],m,14);prev=m;}const last=pts[pts.length-1];q(prev,{x:(prev.x+last.x)/2,y:(prev.y+last.y)/2},last,6);return out;}
function polyPath(x,P){x.beginPath();x.moveTo(P[0].x,P[0].y);for(let i=1;i<P.length;i++)x.lineTo(P[i].x,P[i].y);}
function along(P,step,f){let acc=0;for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],L=Math.hypot(b.x-a.x,b.y-a.y);if(!L)continue;const ux=(b.x-a.x)/L,uy=(b.y-a.y)/L;while(acc<=L){f(a.x+ux*acc,a.y+uy*acc,ux,uy);acc+=step;}acc-=L;}}
function deadTree(x,px,py,s,R,th){x.fillStyle='rgba(6,3,4,.35)';x.beginPath();x.ellipse(px+s*.6,py+s*.12,s*.9,s*.26,0,0,7);x.fill();const trunk=th==='frost'?'#2b2a30':th==='sulfur'?'#3a2a1c':'#151012';
  x.strokeStyle=trunk;x.lineCap='round';const br=(bx,by,a,l,w,d)=>{const ex=bx+Math.cos(a)*l,ey=by+Math.sin(a)*l;x.lineWidth=w;x.beginPath();x.moveTo(bx,by);x.quadraticCurveTo((bx+ex)/2+(R()-.5)*l*.3,(by+ey)/2,ex,ey);x.stroke();
    if(th==='frost'&&w>.5){x.strokeStyle='rgba(245,250,255,.9)';x.lineWidth=w*.45;x.beginPath();x.moveTo(bx,by-w*.3);x.lineTo(ex,ey-w*.3);x.stroke();x.strokeStyle=trunk;}
    if(d>0){const n=d>1?2:1+(R()<.5?1:0);for(let i=0;i<n;i++)br(ex,ey,a+(R()-.5)*1.3+(i?.5:-.5),l*(.55+R()*.2),w*.62,d-1);}};
  br(px,py,-Math.PI/2+(R()-.5)*.25,s*.9,s*.2,3);if(th==='ash'&&R()<.25){x.fillStyle='rgba(255,110,30,.8)';x.fillRect(px-.4,py-s*.25,.8,.8);}}
function deadPine(x,px,py,s,R){x.fillStyle='rgba(30,40,60,.25)';x.beginPath();x.ellipse(px+s*.5,py+s*.12,s*.75,s*.22,0,0,7);x.fill();x.fillStyle='#2b2c33';x.fillRect(px-s*.06,py-s*1.9,s*.12,s*1.9);
  for(let k=0;k<5;k++){const y0=py-s*.45-k*s*.32,w=s*(.62-k*.11);x.strokeStyle='#30323a';x.lineWidth=s*.07;x.beginPath();x.moveTo(px-w,y0+s*.12);x.lineTo(px,y0-s*.06);x.lineTo(px+w,y0+s*.12);x.stroke();
    x.strokeStyle='rgba(250,252,255,.92)';x.lineWidth=s*.06;x.beginPath();x.moveTo(px-w*.85,y0+s*.06);x.lineTo(px,y0-s*.1);x.lineTo(px+w*.7,y0+s*.04);x.stroke();}
  x.fillStyle='#f6f9fc';x.beginPath();x.moveTo(px-s*.1,py-s*1.8);x.lineTo(px,py-s*2.05);x.lineTo(px+s*.1,py-s*1.8);x.fill();}
function thorn(x,px,py,s,R){x.fillStyle='rgba(40,20,5,.25)';x.beginPath();x.ellipse(px+s*.4,py+s*.1,s*.9,s*.28,0,0,7);x.fill();x.strokeStyle='#4a2614';x.lineCap='round';x.lineWidth=s*.09;
  for(let i=0;i<7;i++){const a=-Math.PI/2+(R()-.5)*2.4,l=s*(.6+R()*.6);x.beginPath();x.moveTo(px,py);const mx=px+Math.cos(a)*l*.5,my=py+Math.sin(a)*l*.5;x.lineTo(mx,my);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);
    x.moveTo(mx,my);x.lineTo(mx+Math.cos(a+.9)*l*.25,my+Math.sin(a+.9)*l*.25);x.stroke();}x.fillStyle='#8a3a1a';for(let i=0;i<3;i++){x.beginPath();x.arc(px+(R()-.5)*s,py-s*.3-R()*s*.5,s*.07,0,7);x.fill();}}
function rockT(x,px,py,s,th,R){x.fillStyle='rgba(6,3,4,.35)';x.beginPath();x.ellipse(px+s*.35,py+s*.3,s*1.05,s*.5,0,0,7);x.fill();
  const C=th==='frost'?['#c8d3dd','#7d8c9c','#4d5a6a']:th==='sulfur'?['#b5643a','#7a3a20','#4a2010']:['#5a525a','#332d33','#1a161a'];
  const p=[[-1,.2],[-.65,-.55],[.15,-.85],[.95,-.15],[.75,.45],[-.35,.55]].map(([a,b])=>[px+a*s*(.9+R()*.2),py+b*s*(.9+R()*.2)]);
  x.fillStyle=C[1];x.beginPath();p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fill();
  x.fillStyle=C[0];x.beginPath();x.moveTo(p[0][0],p[0][1]);x.lineTo(p[1][0],p[1][1]);x.lineTo(p[2][0],p[2][1]);x.lineTo(px+s*.1,py-s*.1);x.closePath();x.fill();
  x.fillStyle=C[2];x.beginPath();x.moveTo(p[3][0],p[3][1]);x.lineTo(p[4][0],p[4][1]);x.lineTo(p[5][0],p[5][1]);x.lineTo(px+s*.1,py-s*.1);x.closePath();x.fill();
  if(th==='frost'){x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.moveTo(p[1][0],p[1][1]);x.lineTo(p[2][0],p[2][1]);x.lineTo(px+s*.2,py-s*.45);x.lineTo(px-s*.4,py-s*.3);x.closePath();x.fill();}}
function bones(x,px,py,s,R){x.strokeStyle='#d9ccae';x.lineCap='round';x.lineWidth=s*.16;for(let i=0;i<4;i++){const a=R()*Math.PI,l=s*(.5+R()*.5),cx=px+(R()-.5)*s,cy=py+(R()-.5)*s*.4;x.beginPath();x.moveTo(cx-Math.cos(a)*l/2,cy-Math.sin(a)*l/4);x.lineTo(cx+Math.cos(a)*l/2,cy+Math.sin(a)*l/4);x.stroke();}
  x.fillStyle='#e6dcc2';x.beginPath();x.arc(px+s*.2,py-s*.15,s*.26,0,7);x.fill();x.fillStyle='#1a1212';x.fillRect(px+s*.08,py-s*.17,s*.08,s*.08);x.fillRect(px+s*.24,py-s*.17,s*.08,s*.08);}
function ribcage(x,px,py,s,R){x.fillStyle='rgba(6,3,4,.3)';x.beginPath();x.ellipse(px+s*.2,py+s*.12,s*1.3,s*.3,0,0,7);x.fill();x.strokeStyle='#cfc2a2';x.lineCap='round';x.lineWidth=s*.12;
  x.beginPath();x.moveTo(px-s*1.1,py);x.lineTo(px+s*1.1,py-s*.08);x.stroke();for(let i=0;i<6;i++){const t=-.9+i*.36,bx=px+t*s,by=py-s*.04*t;x.lineWidth=s*.09;x.beginPath();x.moveTo(bx,by);x.quadraticCurveTo(bx-s*.32,by-s*.55,bx+s*.04,by-s*(.75-Math.abs(t)*.2));x.stroke();}
  x.fillStyle='#e0d4b6';x.beginPath();x.ellipse(px+s*1.25,py-s*.12,s*.3,s*.22,0,0,7);x.fill();}
function tomb(x,px,py,s,th,R){const lean=(R()-.5)*.3;x.save();x.translate(px,py);x.rotate(lean);x.fillStyle='rgba(6,3,4,.35)';x.fillRect(0,-1,s*1.1,s*.4);
  const C=th==='frost'?['#9aa7b4','#6a7686']:th==='sulfur'?['#8a7a5a','#5a4a32']:['#57505a','#36303a'];x.fillStyle=C[1];x.beginPath();x.moveTo(-s*.45,0);x.lineTo(-s*.45,-s*.9);x.arc(0,-s*.9,s*.45,Math.PI,0);x.lineTo(s*.45,0);x.closePath();x.fill();
  x.fillStyle=C[0];x.beginPath();x.moveTo(-s*.45,0);x.lineTo(-s*.45,-s*.9);x.arc(0,-s*.9,s*.45,Math.PI,Math.PI*1.5);x.lineTo(-s*.1,-s*1.3);x.lineTo(-s*.1,0);x.closePath();x.fill();
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(-s*.18,-s*1,s*.36,s*.06);x.fillRect(-s*.03,-s*1.15,s*.06,s*.36);x.restore();}
function arch(x,px,py,s,th){const C=th==='frost'?['#a9b6c3','#6b7888','#465263']:th==='sulfur'?['#a07a52','#6e5032','#43301c']:['#5c545e','#3a333d','#211c24'];
  x.fillStyle='rgba(6,3,4,.35)';x.beginPath();x.ellipse(px+s*.5,py+s*.1,s*1.5,s*.3,0,0,7);x.fill();
  for(const d of[-1,1]){const h=d<0?s*1.9:s*1.25;x.fillStyle=C[1];x.fillRect(px+d*s*.75-s*.22,py-h,s*.44,h);x.fillStyle=C[0];x.fillRect(px+d*s*.75-s*.22,py-h,s*.14,h);x.fillStyle=C[2];x.fillRect(px+d*s*.75+s*.1,py-h,s*.12,h);}
  x.strokeStyle=C[1];x.lineWidth=s*.3;x.beginPath();x.arc(px,py-s*1.9+s*.05,s*.75,Math.PI,Math.PI*1.62);x.stroke();
  x.fillStyle=C[2];x.fillRect(px+s*.3,py-s*.15,s*.3,s*.15);x.fillRect(px-s*.2,py-s*.1,s*.25,s*.1);}
function vent(x,px,py,s){glow(x,px,py,s*2.2,'#ff6a1a',.3);x.fillStyle='#120b0a';x.beginPath();x.ellipse(px,py,s*1.25,s*.75,0,0,7);x.fill();const g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,'#fff0a0');g.addColorStop(.4,'#ffa030');g.addColorStop(1,'#a8280a');
  x.fillStyle=g;x.beginPath();x.ellipse(px,py,s,s*.55,0,0,7);x.fill();}
function fumarole(x,px,py,s){x.fillStyle='rgba(255,240,140,.35)';x.beginPath();x.ellipse(px,py,s*1.8,s*1,0,0,7);x.fill();x.fillStyle='#e8d050';x.beginPath();x.ellipse(px,py,s*1.15,s*.65,0,0,7);x.fill();
  x.fillStyle='#3a2410';x.beginPath();x.ellipse(px,py,s*.5,s*.28,0,0,7);x.fill();x.fillStyle='rgba(250,245,225,.35)';for(let i=0;i<3;i++){x.beginPath();x.arc(px+i*s*.3,py-s*(.8+i*.75),s*(.5+i*.25),0,7);x.fill();}}
function crystalT(x,px,py,s,G,R){for(let i=0;i<3+Math.floor(R()*3);i++)crystal(x,px+(R()-.5)*s*1.6,py+(R()-.5)*s*.5,s*(.35+R()*.3),G,(R()-.5)*.9);}
function buildTerrainArt(G,TH){
  const W=G.W,H=G.H,TS=Math.min(2.0,3400/Math.max(W,H));const cn=document.createElement('canvas');cn.width=Math.round(W*TS);cn.height=Math.round(H*TS);const x=cn.getContext('2d');x.scale(TS,TS);
  const th=TPAL[G.theme]?G.theme:({winter:'frost',desert:'sulfur'})[G.theme]||'ash',P=TPAL[th],R=aRng(G.terrainSeed||1),seed=(G.terrainSeed||1)>>>0;
  // base field: domain-warped value noise mapped to the theme ramp
  {const cs=3,w=Math.ceil(W/cs)+1,h=Math.ceil(H/cs)+1,c2=document.createElement('canvas');c2.width=w;c2.height=h;const g2=c2.getContext('2d'),im=g2.createImageData(w,h),d=im.data;
    const n1=vnoise(seed^0x9e37),n2=vnoise(seed^0x51ed),ramp=P.ramp.map(([t,c])=>[t,hx3(c)]),t1=hx3(P.tint),t2=hx3(P.tint2);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=i*cs,Y=j*cs;const q=fbm(n2,X/330,Y/330,3);const v=fbm(n1,X/150+q*2.2,Y/150-q*1.6,5);const m=fbm(n2,X/90+7.3,Y/90+3.1,3);
      let t=Math.max(0,Math.min(1,(v-.5)*(th==='ash'?1.7:1.3)+.5));let k=0;while(k<ramp.length-2&&t>ramp[k+1][0])k++;const a=ramp[k],b=ramp[k+1],f=(t-a[0])/(b[0]-a[0]||1);
      let r=a[1][0]+(b[1][0]-a[1][0])*f,gg=a[1][1]+(b[1][1]-a[1][1])*f,bb=a[1][2]+(b[1][2]-a[1][2])*f;const ti=Math.max(0,(m-.56)*3.2),t2k=Math.max(0,(q-.62)*2.4);
      r+=(t1[0]-r)*ti*.6;gg+=(t1[1]-gg)*ti*.6;bb+=(t1[2]-bb)*ti*.6;r+=(t2[0]-r)*t2k*.5;gg+=(t2[1]-gg)*t2k*.5;bb+=(t2[2]-bb)*t2k*.5;const o=(j*w+i)*4;d[o]=r;d[o+1]=gg;d[o+2]=bb;d[o+3]=255;}
    g2.putImageData(im,0,0);x.imageSmoothingEnabled=true;x.drawImage(c2,0,0,w*cs,h*cs);}
  // fine grain (device-pixel pattern)
  {const tc=document.createElement('canvas');tc.width=tc.height=192;const q=tc.getContext('2d');const RR=aRng(seed^77);for(let i=0;i<2600;i++){const v=RR();q.fillStyle=v<.5?`rgba(0,0,0,${.05+RR()*.12})`:`rgba(255,250,240,${.03+RR()*.07})`;q.fillRect(RR()*192,RR()*192,1+RR()*2,1+RR()*1.5);}
    x.save();x.setTransform(1,0,0,1,0,0);x.fillStyle=x.createPattern(tc,'repeat');x.fillRect(0,0,cn.width,cn.height);x.restore();}
  const awayC=(px,py,m)=>!G.castles.some(c=>(px-c.x)**2+((py-c.y)*1.25)**2<m*m);
  const nearSeg=(px,py,m)=>{for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];if(sd2(px,py,a.x,a.y,b.x,b.y)<m*m)return true;}
    for(const b of G.bars){const r=b.pts,mm=b.k==='r'?m+42:b.k==='s'?m+72:b.k==='i'?m+30:m+34;for(let i=0;i<r.length-1;i++)if(sd2(px,py,r[i].x,r[i].y,r[i+1].x,r[i+1].y)<mm*mm)return true;}return false;};
  // cracks, patches, specks
  x.lineCap='round';x.lineJoin='round';
  for(let i=0;i<Math.round(W*H/26000);i++){const px=R()*W,py=R()*H,r=30+R()*110,g=x.createRadialGradient(px,py,0,px,py,r);const dk=R()<.55;g.addColorStop(0,dk?'rgba(0,0,0,.18)':rgba(P.dust[0],th==='ash'?.07:.14));g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,2*r,2*r);}
  const crack=(px,py,n,a,wd,glw)=>{const pts=[[px,py]];for(let k=0;k<n;k++){a+=(R()-.5)*1.1;px+=Math.cos(a)*(5+R()*9);py+=Math.sin(a)*(4+R()*7);pts.push([px,py]);if(R()<.18&&n>4)crack(px,py,Math.floor(n/2),a+(R()<.5?1:-1)*(.7+R()*.6),wd*.7,glw);}
    const path=()=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));};path();
    if(glw){x.strokeStyle=rgba(P.glowc,.05*P.glowa);x.lineWidth=wd*4.5;x.stroke();x.strokeStyle=rgba(P.glowc,.11*P.glowa);x.lineWidth=wd*2;x.stroke();}
    x.strokeStyle=P.crack;x.lineWidth=wd*1.2;x.stroke();if(glw){x.strokeStyle=rgba(P.glowc,.7*P.glowa);x.lineWidth=wd*.38;x.stroke();}else{x.strokeStyle='rgba(255,255,255,.1)';x.lineWidth=wd*.45;x.translate(.6,.6);path();x.stroke();x.translate(-.6,-.6);}};
  for(let i=0;i<Math.round(W*H/(th==='ash'?36000:46000));i++){const px=R()*W,py=R()*H;if(!awayC(px,py,60))continue;crack(px,py,4+Math.floor(R()*9),R()*6.28,.45+R()*.5,th==='ash'?R()<.4:th==='frost'?R()<.12:R()<.2);}
  if(th==='ash')for(let i=0;i<Math.round(W*H/7000);i++){const px=R()*W,py=R()*H,c=P.speck[i%3];x.fillStyle=rgba(c,.18+R()*.4);x.fillRect(px,py,.5+R()*.6,.5+R()*.6);}
  if(th==='frost'){for(let i=0;i<Math.round(W*H/9000);i++){const px=R()*W,py=R()*H,l=6+R()*18;x.strokeStyle='rgba(255,255,255,.22)';x.lineWidth=.8+R();x.beginPath();x.moveTo(px,py);x.lineTo(px+l,py+l*.12);x.stroke();}
    for(let i=0;i<Math.round(W*H/40000);i++){const px=R()*W,py=R()*H;if(!awayC(px,py,70))continue;const r=4+R()*6;glow(x,px,py,r*3,'#7fd0ff',.22);x.fillStyle='rgba(225,248,255,.9)';x.beginPath();x.arc(px,py,.9,0,7);x.fill();}}
  if(th==='sulfur')for(let i=0;i<Math.round(W*H/20000);i++){const px=R()*W,py=R()*H,r=4+R()*9;x.fillStyle=rgba('#f0dc5a',.07+R()*.08);x.beginPath();for(let k=0;k<7;k++){const a=k/7*6.28,rr=r*(.55+R()*.6);k?x.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr*.6):x.moveTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr*.6);}x.closePath();x.fill();for(let k=0;k<5;k++){x.fillStyle='rgba(255,245,160,.6)';x.fillRect(px+(R()-.5)*r,py+(R()-.5)*r*.5,.9,.9);}}
  // hills: basalt mounds with a rune ring
  for(const c of G.castles)if(c.hill){const f=footOf(c),hr=f.rx+20,hy=f.ry+15;const g=x.createRadialGradient(c.x-hr*.3,c.y-hy*.3,4,c.x,c.y+4,hr*1.05);g.addColorStop(0,P.hill[0]);g.addColorStop(.75,rgba(P.hill[1],.85));g.addColorStop(1,rgba(P.hill[2],0));
    x.fillStyle='rgba(0,0,0,.22)';x.beginPath();x.ellipse(c.x+6,c.y+9,hr,hy,0,0,7);x.fill();x.fillStyle=g;x.beginPath();x.ellipse(c.x,c.y+4,hr,hy,0,0,7);x.fill();
    x.strokeStyle=rgba(P.hill[2],.55);x.lineWidth=1.1;x.beginPath();x.ellipse(c.x,c.y+5,hr-6,hy-4.5,0,0,7);x.stroke();
    x.strokeStyle=rgba(P.rune,.32);x.lineWidth=.8;x.lineCap='round';const nr=Math.round(hr/2.6);for(let i=0;i<nr;i++){const a=(i+.5)/nr*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),px=c.x+ca*(hr-10),py=c.y+5+sa*(hy-7.5);
      x.beginPath();if(i%3){x.moveTo(px-ca*1.6,py-sa*1.1);x.lineTo(px+ca*1.6,py+sa*1.1);}else{x.arc(px,py,1.1,0,7);}x.stroke();}}
  const smooth=G.bars.map(b=>smoothPts(b.pts));
  // ice (walkable) and ridge foothills under the roads
  G.bars.forEach((b,bi)=>{const S=smooth[bi];if(b.k==='i'){polyPath(x,S);x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=60;x.stroke();x.strokeStyle='#a9c3d6';x.lineWidth=52;x.stroke();x.strokeStyle='#c4d9e7';x.lineWidth=40;x.stroke();x.strokeStyle='rgba(120,160,190,.45)';x.lineWidth=18;x.stroke();
      x.strokeStyle='rgba(230,245,255,.6)';x.lineWidth=1;along(S,24,(px,py,ux,uy)=>{const o=(R()-.5)*36;const cx=px-uy*o,cy=py+ux*o;x.beginPath();x.moveTo(cx-6,cy-4);x.lineTo(cx+1,cy+1);x.lineTo(cx+8,cy-3);x.stroke();});
      x.strokeStyle='rgba(60,90,120,.35)';along(S,31,(px,py,ux,uy)=>{const o=(R()-.5)*30;const cx=px-uy*o,cy=py+ux*o;x.beginPath();x.moveTo(cx-5,cy+2);x.lineTo(cx+4,cy-2);x.stroke();});}
    else if(b.k==='r'){polyPath(x,S);x.strokeStyle=rgba(P.hill[2],.45);x.lineWidth=96;x.stroke();x.strokeStyle=rgba(P.hill[1],.55);x.lineWidth=66;x.stroke();}});
  // roads: packed ash / bone dust
  const road=()=>{x.beginPath();for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);}};
  road();x.strokeStyle=P.road[0];x.lineWidth=19;x.stroke();x.strokeStyle=P.road[1];x.lineWidth=14.5;x.stroke();x.strokeStyle=P.road[2];x.lineWidth=10;x.stroke();x.strokeStyle=rgba(P.road[3],.4);x.lineWidth=3.5;x.stroke();
  x.strokeStyle=P.rut;x.lineWidth=.9;for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];const L=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/L,ny=(b.x-a.x)/L;for(const s of[-3.2,3.2]){x.globalAlpha=.55;x.beginPath();let t=0;while(t<1){const t2=Math.min(1,t+(18+R()*30)/L);x.moveTo(a.x+(b.x-a.x)*t+nx*s,a.y+(b.y-a.y)*t+ny*s);x.lineTo(a.x+(b.x-a.x)*t2+nx*(s+(R()-.5)),a.y+(b.y-a.y)*t2+ny*(s+(R()-.5)));t=t2+(4+R()*14)/L;}x.stroke();}}x.globalAlpha=1;
  for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b],L=Math.hypot(b.x-a.x,b.y-a.y);for(let i=0;i<L/9;i++){const t=R(),o=(R()-.5)*16;const L2=L||1,nx=-(b.y-a.y)/L2,ny=(b.x-a.x)/L2;x.fillStyle=R()<.55?P.dust[0]:P.dust[1];x.globalAlpha=.6;
    x.beginPath();x.ellipse(a.x+(b.x-a.x)*t+nx*o,a.y+(b.y-a.y)*t+ny*o,.7+R()*.9,.5+R()*.5,R()*3,0,7);x.fill();}}x.globalAlpha=1;
  // lava rivers & seas (ice-water in frost)
  const frost=th==='frost';
  G.bars.forEach((b,bi)=>{if(b.k!=='w'&&b.k!=='s')return;const S=smooth[bi],sea=b.k==='s',Wl=sea?112:44;polyPath(x,S);
    if(frost){x.strokeStyle='rgba(30,50,70,.25)';x.lineWidth=Wl+30;x.stroke();x.strokeStyle='#e9f1f7';x.lineWidth=Wl+16;x.stroke();x.strokeStyle='#b8cad8';x.lineWidth=Wl+8;x.stroke();x.strokeStyle='#14222e';x.lineWidth=Wl;x.stroke();
      x.strokeStyle='#0c1720';x.lineWidth=Wl*.75;x.stroke();x.strokeStyle='rgba(40,90,130,.35)';x.lineWidth=Wl*.3;x.stroke();
      along(S,sea?7:9,(px,py,ux,uy)=>{for(const sd of[-1,1]){if(R()<.35)continue;const o=sd*(Wl/2-2-R()*(sea?14:6)),cx=px-uy*o,cy=py+ux*o,r=2+R()*(sea?7:4);x.fillStyle=R()<.5?'#dce8f1':'#c3d5e3';x.beginPath();for(let k=0;k<6;k++){const a=k/6*6.28+R()*.5,rr=r*(.7+R()*.5);k?x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.7):x.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.7);}x.closePath();x.fill();}});}
    else{x.strokeStyle='rgba(255,70,10,.10)';x.lineWidth=Wl+70;x.stroke();x.strokeStyle='rgba(255,90,20,.13)';x.lineWidth=Wl+36;x.stroke();x.strokeStyle=P.bank;x.lineWidth=Wl+18;x.stroke();x.strokeStyle='#3a1208';x.lineWidth=Wl+8;x.stroke();
      x.strokeStyle='#a8260a';x.lineWidth=Wl;x.stroke();x.strokeStyle='#d8460c';x.lineWidth=Wl*.78;x.stroke();x.strokeStyle='#f76f12';x.lineWidth=Wl*.52;x.stroke();x.strokeStyle='#ffa22a';x.lineWidth=Wl*.26;x.stroke();x.strokeStyle='#ffd560';x.lineWidth=Wl*.08;x.stroke();
      along(S,sea?6:5.5,(px,py,ux,uy)=>{const n=sea?3:1;for(let q=0;q<n;q++){const e=Math.pow(R(),.55)*(R()<.5?-1:1),o=e*(Wl/2-3),cx=px-uy*o,cy=py+ux*o,r=(1.8+R()*3.2+Math.abs(e)*3)*(sea?1.3:1);if(R()<.2+(1-Math.abs(e))*.5)continue;
        const ang=Math.atan2(uy,ux);x.save();x.translate(cx,cy);x.rotate(ang);x.fillStyle=Math.abs(e)>.75?'#241411':'#3a1a12';x.beginPath();for(let k=0;k<6;k++){const a=k/6*6.28+R()*.4,rr=r*(.65+R()*.5);k?x.lineTo(Math.cos(a)*rr*1.6,Math.sin(a)*rr):x.moveTo(Math.cos(a)*rr*1.6,Math.sin(a)*rr);}x.closePath();x.fill();
        x.strokeStyle='rgba(255,160,60,.55)';x.lineWidth=.6;x.stroke();x.fillStyle='rgba(120,70,50,.35)';x.fillRect(-r*.8,-r*.5,r*.9,r*.25);x.restore();}});
      x.strokeStyle='rgba(255,230,140,.5)';x.lineWidth=.8;along(S,40,(px,py,ux,uy)=>{const o=(R()-.5)*Wl*.4,cx=px-uy*o,cy=py+ux*o;x.beginPath();x.moveTo(cx-ux*10,cy-uy*10);x.quadraticCurveTo(cx-uy*2,cy+ux*2,cx+ux*12,cy+uy*12);x.stroke();});}});
  // bridges over lava / ice-water
  const hitB=(a,b,pts)=>{for(let i=0;i<pts.length-1;i++){const p=pts[i],q=pts[i+1];const d=(b.x-a.x)*(q.y-p.y)-(b.y-a.y)*(q.x-p.x);if(!d)continue;const u=((p.x-a.x)*(q.y-p.y)-(p.y-a.y)*(q.x-p.x))/d,v=((p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x))/d;if(u>0&&u<1&&v>0&&v<1)return{x:a.x+u*(b.x-a.x),y:a.y+u*(b.y-a.y)};}return null;};
  const passes=[];
  for(const e of G.edges){if(!e.cross)continue;const a=G.castles[e.a],b=G.castles[e.b];let p=null,bk=null;G.bars.forEach((br,bi)=>{if(p)return;if(e.cross==='w'?(br.k==='w'||br.k==='s'):br.k===e.cross){const h=hitB(a,b,smooth[bi])||hitB(a,b,br.pts);if(h){p=h;bk=br.k;}}});if(!p)continue;
    if(bk==='r'){passes.push(p);continue;}if(bk==='i')continue;const len=bk==='s'?152:84,hw=12;
    x.save();x.translate(p.x,p.y);x.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    x.fillStyle='rgba(0,0,0,.45)';x.fillRect(-len/2+3,-hw+5,len,hw*2+3);
    x.fillStyle='#2a2328';x.fillRect(-len/2,-hw,len,hw*2);
    for(let i=-len/2+1.5;i<len/2-1;i+=4.2){x.fillStyle=((i*7)|0)%3?'#cdbf9e':'#b5a582';x.fillRect(i,-hw+2.5,3.4,hw*2-5);x.fillStyle='rgba(60,40,30,.35)';x.fillRect(i+2.6,-hw+2.5,.8,hw*2-5);}
    for(const sd of[-1,1]){x.fillStyle='#38323c';x.fillRect(-len/2-1,sd*hw-2.5,len+2,5);x.fillStyle='#5a5462';x.fillRect(-len/2-1,sd*hw-2.5,len+2,1.3);x.fillStyle='#8d8a96';for(let i=-len/2+4;i<len/2;i+=8){x.fillRect(i,sd*hw-.6,1.2,1.2);}}
    for(const ex of[-len/2,len/2])for(const sd of[-1,1]){x.fillStyle='#1d191f';x.fillRect(ex-3,sd*hw-3.5,6,7);skull(x,ex,sd*hw-1.2,2.2,'#e3d7bb');}
    x.restore();}
  // obsidian crags along ridges, gaps at the passes
  const crags=[];for(const b of G.bars)if(b.k==='r'){const S=smoothPts(b.pts);along(S,11,(px,py,ux,uy)=>{const o=(R()-.5)*30,mx=px-uy*o,my=py+ux*o;if(passes.some(pp=>Math.hypot(pp.x-mx,pp.y-my)<44))return;crags.push([mx,my,14+R()*20]);});}
  crags.sort((m1,m2)=>m1[1]-m2[1]);
  const CC=frost?['#c9d6e2','#6f8095','#3a4658','#ffffff']:th==='sulfur'?['#c27a48','#7a3a1e','#3e1a0c','#f2d75a']:['#857b96','#3c3446','#16121b','#ff6a2a'];
  for(const [mx,my,sz] of crags){x.fillStyle='rgba(6,3,4,.35)';x.beginPath();x.ellipse(mx+sz*.4,my+2,sz*.75,sz*.2,0,0,7);x.fill();const n=2+Math.floor(R()*2);
    for(let k=0;k<n;k++){const ox=(k-(n-1)/2)*sz*.42+(R()-.5)*4,h=sz*(1.3-Math.abs(k-(n-1)/2)*.35)*(.8+R()*.4),w=sz*(.28+R()*.12),lean=(R()-.5)*.35,bx=mx+ox,tx=bx+lean*h;
      x.fillStyle=CC[1];x.beginPath();x.moveTo(bx-w,my);x.lineTo(tx,my-h);x.lineTo(bx+w*.1,my);x.closePath();x.fill();x.fillStyle=CC[2];x.beginPath();x.moveTo(bx+w*.1,my);x.lineTo(tx,my-h);x.lineTo(bx+w,my);x.closePath();x.fill();
      x.strokeStyle=CC[0];x.lineWidth=.9;x.beginPath();x.moveTo(bx-w*.75,my-h*.08);x.lineTo(tx-.3,my-h+1.5);x.stroke();
      if(frost){x.fillStyle=CC[3];x.beginPath();x.moveTo(tx,my-h);x.lineTo(tx-w*.4,my-h*.62);x.lineTo(tx+w*.1,my-h*.7);x.lineTo(tx+w*.35,my-h*.6);x.closePath();x.fill();}
      else if(th==='ash'&&R()<.3){x.strokeStyle=rgba(CC[3],.6);x.lineWidth=.7;x.beginPath();x.moveTo(bx+w*.6,my-1);x.lineTo(bx+w*.25,my-h*.35);x.stroke();}
      else if(th==='sulfur'&&R()<.4){x.fillStyle=rgba(CC[3],.8);x.beginPath();x.ellipse(bx-w*.3,my-h*.2,w*.35,w*.2,0,0,7);x.fill();}}}
  for(const p of passes)for(let i=0;i<7;i++){const a=R()*6.28;rockT(x,p.x+Math.cos(a)*(24+R()*14),p.y+Math.sin(a)*(16+R()*10),2.5+R()*3.5,th,R);}
  // props near springs
  for(const c of G.castles)if(c.kind==='m')for(let i=0;i<9;i++){const a=R()*6.28,r=36+R()*26,px=c.x+Math.cos(a)*r,py=c.y+Math.sin(a)*r*.7;if(nearSeg(px,py,9))continue;if(R()<.5)rockT(x,px,py,2.5+R()*4,th,R);else crystalT(x,px,py,3+R()*2,GL.soul,R);}
  // scattered props: groves and singles, depth-sorted
  const props=[];const ok=(px,py,m)=>px>8&&px<W-8&&py>10&&py<H-6&&!nearSeg(px,py,m)&&awayC(px,py,84);
  for(let f=0;f<Math.round(W*H/(th==='sulfur'?90000:52000));f++){const fx=R()*W,fy=R()*H,n=4+Math.floor(R()*9);for(let i=0;i<n;i++){const px=fx+(R()-.5)*95,py=fy+(R()-.5)*80;if(!ok(px,py,13))continue;props.push([px,py,th==='sulfur'?(R()<.7?'thorn':'tree'):th==='frost'?'pine':'tree',5.5+R()*4]);}}
  const singles=th==='ash'?[['bones',30],['rib',8],['tomb',10],['arch',3],['vent',9],['rock',22],['crys',5]]:th==='frost'?[['bones',14],['rib',6],['tomb',8],['arch',3],['rock',26],['crys',10]]:[['bones',18],['rib',8],['tomb',5],['arch',3],['fum',14],['rock',30],['crys',8]];
  const scale=W*H/1.6e6;for(const [k,n] of singles)for(let i=0;i<Math.round(n*scale);i++){const px=R()*W,py=R()*H;if(!ok(px,py,k==='arch'||k==='rib'?20:12))continue;
    if(k==='tomb'){const m=2+Math.floor(R()*4);for(let q=0;q<m;q++)props.push([px+(R()-.5)*26,py+(R()-.5)*14,'tomb',3.5+R()*1.5]);}else props.push([px,py,k,k==='rock'?3+R()*5:k==='arch'?7+R()*3:k==='vent'?3+R()*2.5:k==='fum'?3+R()*2:k==='crys'?3+R()*2:5+R()*3]);}
  props.sort((a,b)=>a[1]-b[1]);const CG=th==='sulfur'?['#fffbd0','#f4e070','#d8b030','#8a6a10']:th==='frost'?GL.soul:['#ffe0d0','#ff7a4a','#c0301a','#5a0c08'];
  for(const [px,py,k,s] of props){if(k==='tree')deadTree(x,px,py,s,R,th);else if(k==='pine')deadPine(x,px,py,s*1.05,R);else if(k==='thorn')thorn(x,px,py,s*.8,R);else if(k==='bones')bones(x,px,py,s*.6,R);else if(k==='rib')ribcage(x,px,py,s,R);
    else if(k==='tomb')tomb(x,px,py,s,th,R);else if(k==='arch')arch(x,px,py,s,th);else if(k==='vent')vent(x,px,py,s);else if(k==='fum')fumarole(x,px,py,s);else if(k==='rock')rockT(x,px,py,s,th,R);else if(k==='crys')crystalT(x,px,py,s,CG,R);}
  // vignette frame
  const vgn=(x0,y0,x1,y1,rx0,ry0,rw,rh)=>{const g=x.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(5,2,3,.55)');g.addColorStop(1,'rgba(5,2,3,0)');x.fillStyle=g;x.fillRect(rx0,ry0,rw,rh);};
  vgn(0,0,0,40,0,0,W,40);vgn(0,H,0,H-40,0,H-40,W,40);vgn(0,0,40,0,0,0,40,H);vgn(W,0,W-40,0,W-40,0,40,H);
  return cn;
}
