// ===== Keepfall illustrated art =====
const ART=0.36;let SK=1.35;
function shade(h,k){const n=parseInt(h.slice(1),16);const c=[(n>>16)&255,(n>>8)&255,n&255];return`rgb(${c.map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k)).join(',')})`;}
const STONE=['#e2dccd','#b9b2a1','#8a8474'];
const SLATE='#6c7a8a';
function tree(x,px,py,s,R){
  x.fillStyle='rgba(20,40,10,.28)';x.beginPath();x.ellipse(px+s*.5,py+s*.35,s*1.05,s*.55,0,0,7);x.fill();
  x.fillStyle='#5a3f25';x.fillRect(px-s*.12,py-s*.3,s*.24,s*.6);
  const g=['#2f6b2a','#3d7f33','#4b9340'];
  for(const [ox,oy,rr] of[[-.35,-.55,.62],[.35,-.5,.6],[0,-.95,.66],[0,-.6,.7]]){const cx=px+ox*s,cy=py+oy*s,r=rr*s;
    const gr=x.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r);gr.addColorStop(0,'#6fb055');gr.addColorStop(.55,g[Math.floor(R()*3)]);gr.addColorStop(1,'#1f4d1c');x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}
}
function rock(x,px,py,s){x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(px+s*.3,py+s*.3,s,s*.55,0,0,7);x.fill();
  const g=x.createLinearGradient(px-s,py-s,px+s,py+s);g.addColorStop(0,'#c9c4b8');g.addColorStop(1,'#6e6a62');x.fillStyle=g;
  x.beginPath();x.moveTo(px-s,py+s*.2);x.lineTo(px-s*.6,py-s*.6);x.lineTo(px+s*.2,py-s*.8);x.lineTo(px+s,py-s*.1);x.lineTo(px+s*.7,py+s*.45);x.lineTo(px-s*.4,py+s*.55);x.closePath();x.fill();}
function towerSpr(x,px,py,r,h,col,flags){
  x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(px+r*.9,py+r*.25,r*1.35,r*.55,-.2,0,7);x.fill();
  const g=x.createLinearGradient(px-r,0,px+r,0);g.addColorStop(0,STONE[0]);g.addColorStop(.5,STONE[1]);g.addColorStop(1,STONE[2]);x.fillStyle=g;
  x.beginPath();x.moveTo(px-r,py-h);x.lineTo(px-r,py);x.ellipse(px,py,r,r*.45,0,Math.PI,0,true);x.lineTo(px+r,py-h);x.closePath();x.fill();
  x.strokeStyle='rgba(60,55,45,.35)';x.lineWidth=1;for(let yy=py-h+8;yy<py;yy+=8){x.beginPath();x.ellipse(px,yy,r,r*.45,0,.15,Math.PI-.15);x.stroke();}
  x.fillStyle='#2e2a24';x.fillRect(px-1.5,py-h*.6,3,h*.18);
  const rg=x.createLinearGradient(px-r,0,px+r,0);rg.addColorStop(0,shade(col,.35));rg.addColorStop(.55,col);rg.addColorStop(1,shade(col,-.4));x.fillStyle=rg;
  x.beginPath();x.moveTo(px-r*1.18,py-h);x.lineTo(px,py-h-r*2.1);x.lineTo(px+r*1.18,py-h);x.ellipse(px,py-h,r*1.18,r*.5,0,0,Math.PI);x.closePath();x.fill();
  x.strokeStyle=shade(col,-.55);x.lineWidth=1.2;x.stroke();
  flags&&flags.push({x:px,y:py-h-r*2.1,s:r/14});
}
function box(x,px,py,w,d,h,wall,roof,roofH){
  const top=py-d/2-h,front=py+d/2;
  x.fillStyle='rgba(20,30,10,.28)';x.beginPath();x.moveTo(px-w/2,front);x.lineTo(px+w/2,front);x.lineTo(px+w/2+h*.6,front-d*.2);x.lineTo(px+w/2+h*.6,py-d/2+h*.1);x.lineTo(px+w/2,py-d/2);x.closePath();x.fill();
  const fg=x.createLinearGradient(0,front-h,0,front);fg.addColorStop(0,wall[0]);fg.addColorStop(1,wall[1]);x.fillStyle=fg;x.fillRect(px-w/2,front-h,w,h);
  x.fillStyle=wall[1];x.fillRect(px-w/2,top,w,d);
  if(roof){const ax=px,ay=top+d/2-roofH;
    x.fillStyle=shade(roof,-.35);x.beginPath();x.moveTo(px+w/2,top);x.lineTo(ax,ay);x.lineTo(px+w/2,top+d);x.closePath();x.fill();
    x.fillStyle=shade(roof,.15);x.beginPath();x.moveTo(px-w/2,top);x.lineTo(ax,ay);x.lineTo(px-w/2,top+d);x.closePath();x.fill();
    x.fillStyle=roof;x.beginPath();x.moveTo(px-w/2-3,top+d);x.lineTo(ax,ay);x.lineTo(px+w/2+3,top+d);x.closePath();x.fill();
    x.strokeStyle=shade(roof,-.5);x.lineWidth=1.2;x.stroke();
    x.strokeStyle='rgba(0,0,0,.18)';for(let k=1;k<5;k++){const t=k/5;x.beginPath();x.moveTo(px-w/2+(ax-px+w/2)*t,top+d+(ay-top-d)*t);x.lineTo(px+w/2-(px+w/2-ax)*t,top+d+(ay-top-d)*t);x.stroke();}}
  return{top,front};
}
function wallSeg(x,a,b,h){
  const g=x.createLinearGradient(0,Math.min(a.y,b.y)-h,0,Math.max(a.y,b.y));g.addColorStop(0,STONE[0]);g.addColorStop(1,STONE[2]);
  x.fillStyle=g;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.lineTo(b.x,b.y-h);x.lineTo(a.x,a.y-h);x.closePath();x.fill();
  x.strokeStyle='rgba(60,55,45,.3)';x.lineWidth=1;for(let k=1;k<4;k++){const f=k/4;x.beginPath();x.moveTo(a.x,a.y-h*f);x.lineTo(b.x,b.y-h*f);x.stroke();}
  const L=Math.hypot(b.x-a.x,b.y-a.y),n=Math.floor(L/9);x.fillStyle=STONE[0];
  for(let k=0;k<n;k+=2){const t=(k+.5)/n,t2=(k+1.3)/n;x.beginPath();x.moveTo(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-h);x.lineTo(a.x+(b.x-a.x)*t2,a.y+(b.y-a.y)*t2-h);x.lineTo(a.x+(b.x-a.x)*t2,a.y+(b.y-a.y)*t2-h-5);x.lineTo(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-h-5);x.closePath();x.fill();}
}
function tent(x,px,py,s,col){x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(px+s*.5,py,s*1.1,s*.35,0,0,7);x.fill();
  x.fillStyle=shade(col,-.3);x.beginPath();x.moveTo(px,py-s*1.1);x.lineTo(px+s*1.1,py-s*.2);x.lineTo(px+s*.9,py);x.lineTo(px,py-s*.2);x.closePath();x.fill();
  x.fillStyle='#efe9da';x.beginPath();x.moveTo(px-s*.8,py);x.lineTo(px,py-s*1.1);x.lineTo(px+s*.8,py);x.closePath();x.fill();
  x.fillStyle=col;x.beginPath();x.moveTo(px-s*.35,py-s*.6);x.lineTo(px,py-s*1.1);x.lineTo(px+s*.35,py-s*.6);x.closePath();x.fill();
  x.fillStyle='#5a4630';x.beginPath();x.moveTo(px-s*.15,py);x.lineTo(px,py-s*.45);x.lineTo(px+s*.15,py);x.fill();}
function stall(x,px,py,col){box(x,px,py,34,22,12,['#b58a55','#8c6536'],null);const t=py-11-12;
  for(let k=0;k<6;k++){x.fillStyle=k%2?'#f4efe2':col;x.beginPath();x.moveTo(px-19+k*6.3,t);x.lineTo(px-19+(k+1)*6.3,t);x.lineTo(px-19+(k+1)*6.3+1,t+14);x.lineTo(px-19+k*6.3+1,t+14);x.closePath();x.fill();}
  x.fillStyle='#d9a521';for(const [dx,dy] of[[-8,4],[0,6],[8,4]]){x.beginPath();x.arc(px+dx,py+dy,3,0,7);x.fill();}}
function crate(x,px,py){box(x,px,py,12,10,10,['#c49a64','#8f6a3e'],null);}
function watch(x,px,py,col,flags){x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(px+30,py+4,34,9,-.1,0,7);x.fill();
  x.strokeStyle='#6b4a2a';x.lineWidth=4;for(const dx of[-12,12]){x.beginPath();x.moveTo(px+dx,py);x.lineTo(px+dx*.6,py-80);x.stroke();}
  x.lineWidth=2;for(let yy=-20;yy>-80;yy-=20){x.beginPath();x.moveTo(px-12+(-yy)*.05,py+yy);x.lineTo(px+12-(-yy)*.05,py+yy-10);x.stroke();}
  box(x,px,py-80,32,18,10,['#b58a55','#7c5a34'],col,18);flags&&flags.push({x:px,y:py-80-9-18,s:.8});}
function stablesSpr(x,px,py){box(x,px,py,70,34,22,['#b8875a','#855f3a'],'#9b5b35',20);
  x.fillStyle='#3a2a1a';for(const dx of[-22,0,22]){x.fillRect(px+dx-7,py+17-16,14,16);}
  x.fillStyle='#d8b75a';for(const [dx,dy] of[[44,12],[50,0]]){x.beginPath();x.ellipse(px+dx,py+dy,9,7,0,0,7);x.fill();x.strokeStyle='#a88838';x.lineWidth=1;x.stroke();}}
function granary(x,px,py,col){const r=18,h=34;x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(px+r,py+3,r*1.4,r*.5,0,0,7);x.fill();
  const g=x.createLinearGradient(px-r,0,px+r,0);g.addColorStop(0,'#e9d7a8');g.addColorStop(1,'#a88a52');x.fillStyle=g;x.beginPath();x.moveTo(px-r,py-h);x.lineTo(px-r,py);x.ellipse(px,py,r,r*.45,0,Math.PI,0,true);x.lineTo(px+r,py-h);x.closePath();x.fill();
  const d=x.createRadialGradient(px-6,py-h-10,2,px,py-h,r*1.2);d.addColorStop(0,shade(col,.4));d.addColorStop(1,shade(col,-.35));x.fillStyle=d;x.beginPath();x.ellipse(px,py-h,r,r*.9,0,Math.PI,0);x.ellipse(px,py-h,r,r*.45,0,0,Math.PI);x.fill();}
function workshopSpr(x,px,py){box(x,px-20,py,44,26,16,['#b8875a','#855f3a'],'#6d6a60',14);
  x.strokeStyle='#5e4325';x.lineWidth=4;x.beginPath();x.moveTo(px+18,py);x.lineTo(px+34,py-40);x.lineTo(px+50,py);x.stroke();x.lineWidth=3;x.beginPath();x.moveTo(px+14,py-52);x.lineTo(px+58,py-26);x.stroke();
  x.fillStyle='#6e6a62';x.beginPath();x.arc(px+14,py-52,5,0,7);x.fill();}
function palisade(x,cx,cy,rx,ry,front){for(let k=0;k<40;k++){const a=k/40*Math.PI*2;const sy=Math.sin(a);if(front?sy<0:sy>=0)continue;const px=cx+Math.cos(a)*rx,py=cy+sy*ry;
  const g=x.createLinearGradient(px-3,0,px+3,0);g.addColorStop(0,'#b58a55');g.addColorStop(1,'#6b4a2a');x.fillStyle=g;x.beginPath();x.moveTo(px-3.5,py);x.lineTo(px-3.5,py-22);x.lineTo(px,py-28);x.lineTo(px+3.5,py-22);x.lineTo(px+3.5,py);x.closePath();x.fill();}}
function moat(x,cx,cy,rx,ry){x.lineWidth=16;x.strokeStyle='#8f7a52';x.beginPath();x.ellipse(cx,cy+6,rx,ry,0,0,7);x.stroke();x.lineWidth=11;x.strokeStyle='#3f8db0';x.stroke();x.lineWidth=3;x.strokeStyle='rgba(255,255,255,.35)';x.setLineDash([10,14]);x.stroke();x.setLineDash([]);}
function house(x,px,py,roof,smoke){box(x,px,py,34,24,20,['#efe6d2','#c8b894'],roof,16);x.fillStyle='#3a2a1a';x.fillRect(px-4,py+12-11,8,11);x.fillStyle='#f6d977';x.fillRect(px-13,py+12-15,5,5);x.fillRect(px+8,py+12-15,5,5);if(smoke)smoke.push({x:px+9,y:py-12-24});}
function palisadeLow(x,cx,cy,rx,ry){x.strokeStyle='#7c5a34';x.lineWidth=2.5;x.beginPath();x.ellipse(cx,cy,rx,ry,0,.3,Math.PI-.3);x.stroke();x.beginPath();x.ellipse(cx,cy-6,rx,ry,0,.3,Math.PI-.3);x.stroke();
  for(let k=0;k<22;k++){const a=.3+k/21*(Math.PI-.6);x.beginPath();x.moveTo(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry+2);x.lineTo(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry-10);x.stroke();}}
// ---------- sprite builders (art units) ----------
const RX=[0,70,98,128],RY=[0,46,62,82];
function mkCanvas(size){const cn=document.createElement('canvas');cn.width=Math.round(size*SK);cn.height=Math.round(size*SK);const x=cn.getContext('2d');x.scale(SK,SK);return[cn,x];}
function spriteCastle(lv,blds,col,capital,neutral,path=0){
  const L=Math.min(3,lv),size=lv>=4?620:[0,400,460,520][L];const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+40;const flags=[];const smoke=[];
  const rx=RX[L],ry=RY[L];const roof=neutral?SLATE:col;
  x.fillStyle='rgba(20,30,10,.18)';x.beginPath();x.ellipse(c+10,cy+12,rx+24,ry+18,0,0,7);x.fill();
  var cg=x.createRadialGradient(c,cy,10,c,cy,rx+10);cg.addColorStop(0,'#cdb88c');cg.addColorStop(1,'#a8926a');x.fillStyle=cg;x.beginPath();x.ellipse(c,cy,rx+8,ry+6,0,0,7);x.fill();
  const cgx=null;const R=mkRng(lv*31+blds.length*7);x.fillStyle='rgba(120,100,70,.35)';for(let k=0;k<40;k++){const a=R()*6.28,r=R();x.beginPath();x.arc(c+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,2,0,7);x.fill();}
  const spots=[[-rx-66-(lv>=4?28:0),-6],[rx+64+(lv>=4?28:0),-2],[0,-ry-44-(lv>=4?26:0)],[rx*0.55+(lv>=4?40:0),ry+58+(lv>=4?20:0)]];
  const orx=rx+36,ory=ry+27,outer=lv>=4;
  if(path===1){const gr=x.createRadialGradient(c,cy,rx*0.8,c,cy,(outer?orx:rx)+26);gr.addColorStop(0,'#8d877b');gr.addColorStop(1,'#5f5a50');x.fillStyle=gr;x.beginPath();x.ellipse(c,cy+4,(outer?orx:rx)+22,(outer?ory:ry)+17,0,0,7);x.fill();
    x.strokeStyle='rgba(30,28,24,.45)';x.lineWidth=2;for(let k=0;k<18;k++){const an=k/18*Math.PI*2;const r1=(outer?orx:rx)+6,r2=(outer?orx:rx)+21;x.beginPath();x.moveTo(c+Math.cos(an)*r1,cy+4+Math.sin(an)*r1*0.75);x.lineTo(c+Math.cos(an)*r2,cy+4+Math.sin(an)*r2*0.76);x.stroke();}}
  if(blds.includes(0))moat(x,c,cy,(outer?orx:rx)+30,(outer?ory:ry)+24);
  const ov=[];if(outer){const n=10;for(let k=0;k<n;k++){const ang=-Math.PI/2+k*2*Math.PI/n+Math.PI/n;ov.push({x:c+Math.cos(ang)*orx,y:cy+Math.sin(ang)*ory});}
    const og=x.createRadialGradient(c,cy,rx,c,cy,orx+6);og.addColorStop(0,'#b9a57c');og.addColorStop(1,'#a08b62');x.fillStyle=og;x.beginPath();x.ellipse(c,cy,orx+5,ory+4,0,0,7);x.fill();
    const segs=ov.map((v,k)=>({a:v,b:ov[(k+1)%n],my:(v.y+ov[(k+1)%n].y)/2}));
    segs.filter(s=>s.my<=cy).sort((p,q)=>p.my-q.my).forEach(s=>wallSeg(x,s.a,s.b,14));
    ov.filter(v=>v.y<=cy).sort((p,q)=>p.y-q.y).forEach(v=>towerSpr(x,v.x,v.y,10,30,roof,null));
    x.fillStyle=cg;x.beginPath();x.ellipse(c,cy,rx+8,ry+6,0,0,7);x.fill();}
  const place=blds.filter(b=>b!==0).map((b,i)=>({b,x:c+spots[i][0],y:cy+spots[i][1]}));
  const drawB=o=>{if(o.b===1){tent(x,o.x-18,o.y,19,col);tent(x,o.x+18,o.y+6,17,col);}
    else if(o.b===2){stall(x,o.x-16,o.y,col);stall(x,o.x+20,o.y+8,'#2c9e66');crate(x,o.x+2,o.y+24);}
    else if(o.b===3)watch(x,o.x,o.y+10,col,flags);else if(o.b===4)stablesSpr(x,o.x-6,o.y);else if(o.b===5){granary(x,o.x-14,o.y+4,col);granary(x,o.x+16,o.y+12,col);}
    else if(o.b===6)workshopSpr(x,o.x-10,o.y);
    else if(o.b===7){tent(x,o.x-20,o.y,17,'#8a8474');tent(x,o.x+16,o.y+4,15,'#7a6a58');x.fillStyle='#5e4325';x.fillRect(o.x-6,o.y+18,12,3);x.fillStyle='#f0a030';x.beginPath();x.moveTo(o.x-4,o.y+18);x.lineTo(o.x,o.y+8);x.lineTo(o.x+4,o.y+18);x.fill();x.fillStyle='#ffd766';x.beginPath();x.moveTo(o.x-2,o.y+18);x.lineTo(o.x,o.y+12);x.lineTo(o.x+2,o.y+18);x.fill();}
    else if(o.b===8){box(x,o.x-24,o.y,30,20,14,['#b8875a','#855f3a'],'#6d4f2c',12);
      for(const [dx,dy] of[[14,-4],[34,6]]){x.strokeStyle='#6b4a2a';x.lineWidth=2;x.beginPath();x.moveTo(o.x+dx-5,o.y+dy+10);x.lineTo(o.x+dx,o.y+dy-6);x.lineTo(o.x+dx+5,o.y+dy+10);x.stroke();
        x.fillStyle='#e4cf8e';x.beginPath();x.arc(o.x+dx,o.y+dy-6,8,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(o.x+dx,o.y+dy-6,5.5,0,7);x.fill();x.fillStyle=col;x.beginPath();x.arc(o.x+dx,o.y+dy-6,3,0,7);x.fill();}}};
  place.filter(o=>o.y<cy-20).forEach(drawB);
  if(L===1){palisade(x,c,cy,rx,ry,false);towerSpr(x,c,cy+4,17,58,roof,neutral?null:flags);house(x,c-34,cy+18,'#9b5b35',smoke);palisade(x,c,cy,rx,ry,true);}
  else{
    const n=L===2?6:8,verts=[];for(let k=0;k<n;k++){const a=-Math.PI/2+k*2*Math.PI/n+Math.PI/n;verts.push({x:c+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});}
    const wh=L===3?26:20,tr=L===3?15:13,th=L===3?50:40;const segs=verts.map((v,k)=>({a:v,b:verts[(k+1)%n],my:(v.y+verts[(k+1)%n].y)/2}));
    const tf=neutral?null:flags;
    segs.filter(s=>s.my<=cy).sort((p,q)=>p.my-q.my).forEach(s=>wallSeg(x,s.a,s.b,wh));
    verts.filter(v=>v.y<=cy).sort((p,q)=>p.y-q.y).forEach(v=>towerSpr(x,v.x,v.y,tr,th,roof,tf));
    if(L===3){box(x,c-26,cy-4,56,40,54,['#e2dccd','#9f988a'],roof,30);towerSpr(x,c+34,cy-10,20,96,roof,tf);if(!neutral)flags.push({x:c-26,y:cy-4-20-54-30,s:capital?1.7:1.1,cap:capital});}
    else{box(x,c,cy-2,58,38,44,['#e2dccd','#9f988a'],roof,26);if(!neutral)flags.push({x:c,y:cy-2-19-44-26,s:capital?1.6:1,cap:capital});}
    if(lv>=5||path===2){x.fillStyle='#e8b53a';x.strokeStyle='#8a6508';x.lineWidth=1;for(const v of verts){x.beginPath();x.arc(v.x,v.y-th-tr*2.1,3.4,0,7);x.fill();x.stroke();}}
    house(x,c-rx*.5,cy+ry*.35,'#9b5b35',smoke);
    segs.filter(s=>s.my>cy).sort((p,q)=>p.my-q.my).forEach(s=>wallSeg(x,s.a,s.b,wh));
    const f=segs.reduce((p,q)=>q.my>p.my?q:p);const gx=(f.a.x+f.b.x)/2,gy=(f.a.y+f.b.y)/2;
    x.fillStyle='#2a2119';x.beginPath();x.moveTo(gx-10,gy);x.lineTo(gx-10,gy-12);x.arc(gx,gy-12,10,Math.PI,0);x.lineTo(gx+10,gy);x.closePath();x.fill();
    x.strokeStyle='#6b6456';x.lineWidth=1.5;for(let k=-6;k<=6;k+=4){x.beginPath();x.moveTo(gx+k,gy);x.lineTo(gx+k,gy-20);x.stroke();}
    verts.filter(v=>v.y>cy).sort((p,q)=>p.y-q.y).forEach(v=>towerSpr(x,v.x,v.y,tr,th,roof,tf));
  }
  if(outer){const n=ov.length;const segs=ov.map((v,k)=>({a:v,b:ov[(k+1)%n],my:(v.y+ov[(k+1)%n].y)/2}));
    segs.filter(s=>s.my>cy).sort((p,q)=>p.my-q.my).forEach(s=>wallSeg(x,s.a,s.b,14));
    const f=segs.reduce((p,q)=>q.my>p.my?q:p);const gx=(f.a.x+f.b.x)/2,gy=(f.a.y+f.b.y)/2;x.fillStyle='#2a2119';x.beginPath();x.moveTo(gx-8,gy);x.lineTo(gx-8,gy-9);x.arc(gx,gy-9,8,Math.PI,0);x.lineTo(gx+8,gy);x.closePath();x.fill();
    ov.filter(v=>v.y>cy).sort((p,q)=>p.y-q.y).forEach(v=>towerSpr(x,v.x,v.y,10,30,roof,lv>=6?flags:null));}
  if(path===2){stall(x,c-(outer?orx:rx)*0.62,cy+(outer?ory:ry)+18,col);stall(x,c+(outer?orx:rx)*0.12,cy+(outer?ory:ry)+26,'#e2a91f');crate(x,c-(outer?orx:rx)*0.25,cy+(outer?ory:ry)+34);
    x.fillStyle='#e8b53a';for(let k=0;k<5;k++){x.beginPath();x.arc(c-(outer?orx:rx)*0.38+k*5,cy+(outer?ory:ry)+40,3,0,7);x.fill();}}
  if(path===3){const yx=c+(outer?orx:rx)*0.35,yy=cy+(outer?ory:ry)+26;x.strokeStyle='#7c5a34';x.lineWidth=2.4;x.strokeRect(yx-30,yy-12,60,30);
    for(const [dx,dy] of[[-16,0],[0,6],[16,0]]){x.strokeStyle='#6b4a2a';x.lineWidth=2;x.beginPath();x.moveTo(yx+dx,yy+dy+10);x.lineTo(yx+dx,yy+dy-8);x.moveTo(yx+dx-6,yy+dy-3);x.lineTo(yx+dx+6,yy+dy-3);x.stroke();
      x.fillStyle='#d9c27a';x.beginPath();x.ellipse(yx+dx,yy+dy-2,4,6,0,0,7);x.fill();x.fillStyle='#c9a85a';x.beginPath();x.arc(yx+dx,yy+dy-10,3.2,0,7);x.fill();}
    tent(x,yx-44,yy+4,14,col);}
  if(capital&&L===1)flags.push({x:c,y:cy+4-58-17*2.1,s:1.5,cap:true});
  place.filter(o=>o.y>=cy-20).forEach(drawB);
  return{cn,size,ox:c,oy:cy,flags,smoke,plaque:(outer?ory:ry)+(blds.includes(0)?46:30),foot:(outer?orx:rx)+14,footY:(outer?ory:ry)+10};
}
function spriteVillage(){const size=360;const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+20;const smoke=[];
  x.fillStyle='rgba(120,100,60,.35)';x.beginPath();x.ellipse(c,cy+10,110,62,0,0,7);x.fill();
  [[-50,-26,'#a8452f'],[30,-34,'#7e5a3a'],[-8,6,'#a8452f'],[62,14,'#9b5b35'],[-66,26,'#7e5a3a']].sort((a,b)=>a[1]-b[1]).forEach(h=>house(x,c+h[0],cy+h[1],h[2],smoke));
  x.fillStyle='#8a8474';x.beginPath();x.ellipse(c+18,cy+48,9,5,0,0,7);x.fill();x.fillStyle='#2f7294';x.beginPath();x.ellipse(c+18,cy+47,6,3,0,0,7);x.fill();
  palisadeLow(x,c,cy+10,122,72);
  return{cn,size,ox:c,oy:cy,flags:[],smoke,plaque:84,foot:118,footY:70};}
function spriteMine(col,lv=1){const size=300;const [cn,x]=mkCanvas(size);const c=size/2,cy=size/2+20;const flags=[];
  rock(x,c-40,cy-20,34);rock(x,c+30,cy-30,40);rock(x,c,cy-44,30);
  x.fillStyle='#1b1712';x.beginPath();x.moveTo(c-22,cy);x.lineTo(c-22,cy-18);x.arc(c,cy-18,22,Math.PI,0);x.lineTo(c+22,cy);x.closePath();x.fill();
  x.strokeStyle='#6b4a2a';x.lineWidth=5;x.beginPath();x.moveTo(c-24,cy);x.lineTo(c-24,cy-20);x.arc(c,cy-20,24,Math.PI,0);x.lineTo(c+24,cy);x.stroke();
  x.strokeStyle='#5e5548';x.lineWidth=3;x.beginPath();x.moveTo(c-8,cy);x.lineTo(c-30,cy+60);x.moveTo(c+8,cy);x.lineTo(c-10,cy+60);x.stroke();
  box(x,c-16,cy+34,26,16,12,['#8f6a3e','#5e4325'],null);x.fillStyle='#e8b53a';for(const [dx,dy] of[[-22,20],[-14,18],[-18,15],[-10,21]]){x.beginPath();x.arc(c+dx,cy+dy,3.2,0,7);x.fill();}
  if(lv>=2){ // wooden headframe and a second cart
    x.strokeStyle='#6b4a2a';x.lineWidth=4;x.beginPath();x.moveTo(c+46,cy+6);x.lineTo(c+58,cy-58);x.lineTo(c+70,cy+6);x.moveTo(c+51,cy-24);x.lineTo(c+65,cy-24);x.stroke();
    x.fillStyle='#4b3a28';x.beginPath();x.arc(c+58,cy-58,6,0,7);x.fill();x.strokeStyle='#8a8a8a';x.lineWidth=1.2;x.beginPath();x.moveTo(c+58,cy-58);x.lineTo(c+58,cy-8);x.stroke();
    box(x,c+18,cy+44,24,15,11,['#8f6a3e','#5e4325'],null);x.fillStyle='#e8b53a';for(const [dx,dy] of[[14,30],[20,28],[24,31]]){x.beginPath();x.arc(c+dx,cy+dy,3.2,0,7);x.fill();}}
  if(lv>=3){ // stone smelter with a glowing furnace
    box(x,c-62,cy+18,34,24,26,['#bdb5a5','#857e70'],'#6d6a60',14);x.fillStyle='#f39a2b';x.fillRect(c-68,cy+24,10,7);
    x.fillStyle='#857e70';x.fillRect(c-56,cy-30,8,24);x.fillStyle='#e8b53a';for(let k=0;k<7;k++){x.beginPath();x.arc(c-40+k*4,cy+44+(k%2)*3,3.4,0,7);x.fill();}}
  if(col)flags.push({x:c+30,y:cy-66,s:1.2});
  return{cn,size,ox:c,oy:cy,flags,smoke:lv>=3?[{x:c-52,y:cy-32}]:[],plaque:72,foot:62,footY:44};}
const SPR=new Map(),SPRH=new Map();
function spriteFor(c,col,hi){
  const neutral=c.owner===NEUTRAL;const key=[c.kind,c.lv,c.b.join(''),neutral?'n':col,c.capital>=0?1:0,c.nw?1:0,c.path|0].join('|');
  const M=hi?SPRH:SPR;let s=M.get(key);if(s){if(hi){M.delete(key);M.set(key,s);}return s;}
  if(hi){if(M.size>=16)M.delete(M.keys().next().value);}else if(M.size>70)M.clear();
  SK=hi?2.7:1.3;
  if(c.kind==='m')s=spriteMine(neutral?null:col,c.lv);else if(c.kind==='v'&&neutral)s=spriteVillage();else s=spriteCastle(c.kind==='f'&&neutral?3:c.lv,neutral?(c.nw?[0]:[]):c.b,col,c.capital>=0,neutral,neutral?0:(c.path|0));
  M.set(key,s);return s;}
function footOf(c){const s=c.kind==='m'?{foot:62,footY:44}:c.kind==='v'&&c.owner===NEUTRAL?{foot:118,footY:70}:{foot:RX[Math.min(3,c.lv)]+14+(c.lv>=4?36:0),footY:RY[Math.min(3,c.lv)]+10+(c.lv>=4?27:0)};return{rx:s.foot*ART,ry:s.footY*ART};}
function drawFlag(x,fx,fy,s,col,t,limp){x.strokeStyle='#4b3a28';x.lineWidth=1.6*s;x.beginPath();x.moveTo(fx,fy);x.lineTo(fx,fy-18*s);x.stroke();
  x.fillStyle=limp?shade(col,.45):col;x.beginPath();x.moveTo(fx,fy-18*s);
  for(let k=1;k<=5;k++){const w=limp?k*.9*s:Math.sin(t*3+k*.9+fx)*1.6*s*(k/5);x.lineTo(fx+k*3.4*s,fy-18*s+w);}
  for(let k=5;k>=0;k--){const w=limp?k*.9*s:Math.sin(t*3+k*.9+fx)*1.6*s*(k/5);x.lineTo(fx+k*3.4*s,fy-9*s+w);}x.closePath();x.fill();x.strokeStyle=shade(col,-.5);x.lineWidth=.8*s;x.stroke();}
function drawStar(x,cx,cy,r,col){x.fillStyle=col;x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;x.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a));}x.closePath();x.fill();}
// soldier in art units, placed with transform
const SKIN=['#e9c49a','#d7a77a','#b9835a','#8d5a3b'];
function soldier(x,px,py,k,col,t,dir,bearer,v=0){
  x.save();x.translate(px,py);x.scale(k,k);
  const bob=Math.abs(Math.sin(t))*2.2,leg=Math.sin(t)*3;
  x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(2,1,6,2.4,0,0,7);x.fill();
  x.strokeStyle='#3a2f24';x.lineWidth=2.4;x.lineCap='round';x.beginPath();x.moveTo(-1.5,-7-bob*.3);x.lineTo(-1.5+leg*.6,0);x.moveTo(1.5,-7-bob*.3);x.lineTo(1.5-leg*.6,0);x.stroke();
  x.fillStyle=col;x.beginPath();x.moveTo(-5,-7-bob);x.lineTo(-4,-17-bob);x.lineTo(4,-17-bob);x.lineTo(5,-7-bob);x.closePath();x.fill();
  x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.moveTo(1,-7-bob);x.lineTo(1.5,-17-bob);x.lineTo(4,-17-bob);x.lineTo(5,-7-bob);x.closePath();x.fill();
  x.fillStyle=SKIN[v%4];x.beginPath();x.arc(0,-20-bob,3.4,0,7);x.fill();
  const hv=(v>>2)%3;if(hv===0){x.fillStyle='#9aa0a6';x.beginPath();x.arc(0,-21-bob,3.8,Math.PI,0);x.fill();}
  else if(hv===1){x.fillStyle='#8a9096';x.beginPath();x.arc(0,-21-bob,3.4,Math.PI,0);x.fill();x.fillRect(-5.2,-21.4-bob,10.4,1.6);}
  else{x.fillStyle='#5a4028';x.beginPath();x.arc(0,-21-bob,3.6,Math.PI*1.05,-0.05);x.fill();}
  if(v===15){x.fillStyle='#c0392b';x.beginPath();x.ellipse(-1,-26-bob,1.6,3.4,-0.4,0,7);x.fill();}
  if(bearer){x.strokeStyle='#5e4325';x.lineWidth=1.8;x.beginPath();x.moveTo(4,-8-bob);x.lineTo(4,-44-bob);x.stroke();
    x.fillStyle=col;x.beginPath();const w=Math.sin(t*1.3);x.moveTo(4,-44-bob);x.quadraticCurveTo(4+10*dir,-46-bob+w*2,4+20*dir,-42-bob+w*3);x.lineTo(4+18*dir,-32-bob+w*3);x.quadraticCurveTo(4+9*dir,-35-bob+w*2,4,-32-bob);x.closePath();x.fill();
    x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=1;x.stroke();}
  else{x.strokeStyle='#6b5a44';x.lineWidth=1.4;x.beginPath();x.moveTo(4*dir,-6-bob);x.lineTo(7*dir,-32-bob);x.stroke();x.fillStyle='#c9ccd0';x.beginPath();x.moveTo(7*dir,-36-bob);x.lineTo(5.6*dir,-31-bob);x.lineTo(8.4*dir,-31-bob);x.fill();
    x.fillStyle=col;x.strokeStyle='#f1ede4';x.lineWidth=1.2;x.beginPath();x.arc(-4*dir,-12-bob,3.6,0,7);x.fill();x.stroke();
    const sv=((v>>2)+v)%3;x.strokeStyle='#f1ede4';x.lineWidth=0.9;if(sv===1){x.beginPath();x.moveTo(-4*dir-3,-12-bob);x.lineTo(-4*dir+3,-12-bob);x.stroke();}else if(sv===2){x.beginPath();x.moveTo(-4*dir,-15-bob);x.lineTo(-4*dir,-9-bob);x.moveTo(-4*dir-3,-12-bob);x.lineTo(-4*dir+3,-12-bob);x.stroke();}}
  x.restore();
}
// ---------- terrain (world units) ----------
function buildTerrainArt(G,TH){
  const TS=Math.min(2.0,3400/Math.max(G.W,G.H));const cn=document.createElement('canvas');cn.width=Math.round(G.W*TS);cn.height=Math.round(G.H*TS);const x=cn.getContext('2d');x.scale(TS,TS);
  const R=mkRng(G.terrainSeed);const W=G.W,H=G.H;const th=G.theme||'grass';
  const PAL={grass:{bg:['#86b862','#6e9f4d'],blob:['rgba(190,220,120,.18)','rgba(40,80,30,.16)'],strokes:['rgba(60,110,40,.45)','rgba(150,200,90,.4)','rgba(90,140,50,.45)'],dots:['#fff6d8','#f3d34a','#f2a0c0','#c9b8f0'],road:['#8a6b42','#c9a570'],hill:['rgba(215,230,150,.55)','rgba(120,150,70,.35)','rgba(70,100,45,.35)'],border:'rgba(40,60,30,.6)'},
    winter:{bg:['#eef2f5','#d3dde4'],blob:['rgba(255,255,255,.35)','rgba(120,145,170,.14)'],strokes:['rgba(150,170,190,.35)','rgba(255,255,255,.5)','rgba(120,140,160,.25)'],dots:['#ffffff','#dfe9f2'],road:['#8d8a80','#cfc8b8'],hill:['rgba(255,255,255,.6)','rgba(170,190,210,.35)','rgba(120,140,165,.35)'],border:'rgba(90,110,130,.6)'},
    desert:{bg:['#e9cf98','#cfa86a'],blob:['rgba(255,240,200,.22)','rgba(160,110,55,.16)'],strokes:['rgba(170,125,70,.3)','rgba(255,235,190,.35)','rgba(140,100,55,.25)'],dots:['#b8936a','#8d7356','#d9bf92'],road:['#a07c4c','#ecd6a6'],hill:['rgba(255,230,180,.5)','rgba(190,140,80,.35)','rgba(150,105,55,.35)'],border:'rgba(120,85,45,.6)'}}[th];
  const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,PAL.bg[0]);bg.addColorStop(1,PAL.bg[1]);x.fillStyle=bg;x.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){const px=R()*W,py=R()*H,r=40+R()*140;const g=x.createRadialGradient(px,py,0,px,py,r);const light=R()<.5;
    g.addColorStop(0,light?PAL.blob[0]:PAL.blob[1]);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,2*r,2*r);}
  x.lineCap='round';
  for(let i=0;i<(th==='grass'?6000:th==='winter'?2500:1500);i++){const px=R()*W,py=R()*H,l=2+R()*3,a=-Math.PI/2+(R()-.5)*.9;x.strokeStyle=PAL.strokes[i%3];x.lineWidth=.8;
    x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}
  for(let i=0;i<260;i++){const px=R()*W,py=R()*H;x.fillStyle=PAL.dots[i%PAL.dots.length];x.beginPath();x.arc(px,py,.9+R()*.7,0,7);x.fill();}
  // hills
  for(const c of G.castles)if(c.hill){const g=x.createRadialGradient(c.x-14,c.y-10,10,c.x,c.y+6,78);g.addColorStop(0,PAL.hill[0]);g.addColorStop(.7,PAL.hill[1]);g.addColorStop(1,'rgba(60,90,40,0)');
    x.fillStyle=g;x.beginPath();x.ellipse(c.x,c.y+6,80,58,0,0,7);x.fill();x.strokeStyle=PAL.hill[2];x.lineWidth=1.5;for(const r of[48,64,78]){x.beginPath();x.ellipse(c.x,c.y+8,r,r*.72,0,0,7);x.stroke();}}
  // rivers
  const rp=pts=>{x.beginPath();x.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++){const mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;x.quadraticCurveTo(pts[i].x,pts[i].y,mx,my);}x.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);};
  x.lineJoin='round';
  for(const b of G.bars)if(b.k==='w'){rp(b.pts);x.strokeStyle='#b69a68';x.lineWidth=56;x.stroke();x.strokeStyle='#8f7a52';x.lineWidth=50;x.stroke();
    x.strokeStyle='#2f7294';x.lineWidth=43;x.stroke();x.strokeStyle='#3f8db0';x.lineWidth=31;x.stroke();x.strokeStyle='#58a7c7';x.lineWidth=13;x.stroke();}
  for(const b of G.bars)if(b.k==='s'){rp(b.pts);x.strokeStyle=th==='desert'?'#d9bf8a':'#c9b07c';x.lineWidth=128;x.stroke();x.strokeStyle='#2b6688';x.lineWidth=112;x.stroke();x.strokeStyle='#34789e';x.lineWidth=90;x.stroke();x.strokeStyle='#4489b0';x.lineWidth=60;x.stroke();
    x.setLineDash([4,22]);x.strokeStyle='rgba(255,255,255,.3)';x.lineWidth=2;x.stroke();x.setLineDash([]);}
  for(const b of G.bars)if(b.k==='i'){rp(b.pts);x.strokeStyle='#b9c9d6';x.lineWidth=52;x.stroke();x.strokeStyle='#d6e4ee';x.lineWidth=42;x.stroke();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=14;x.stroke();
    x.strokeStyle='rgba(120,150,175,.5)';x.lineWidth=1;const p=b.pts;for(let i=0;i<p.length-1;i++)for(let k=0;k<3;k++){const t=R(),cx=p[i].x+(p[i+1].x-p[i].x)*t,cy=p[i].y+(p[i+1].y-p[i].y)*t;x.beginPath();x.moveTo(cx-8,cy-6);x.lineTo(cx+2,cy+1);x.lineTo(cx+9,cy-4);x.stroke();}}
  if(th==='desert'){for(let k=0;k<Math.round(W*H/320000)+3;k++){let ox=0,oy=0,ok=false;for(let tries=0;tries<30&&!ok;tries++){ox=60+R()*(W-120);oy=60+R()*(H-120);ok=!G.castles.some(c=>Math.hypot(ox-c.x,oy-c.y)<120);}if(!ok)continue;
    const rr=16+R()*14;x.fillStyle='#8fbf6a';x.beginPath();x.ellipse(ox,oy,rr*1.7,rr*1.2,0,0,7);x.fill();x.fillStyle='#3f8db0';x.beginPath();x.ellipse(ox,oy,rr,rr*.62,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.ellipse(ox-rr*.3,oy-rr*.15,rr*.35,rr*.12,0,0,7);x.fill();
    for(let q=0;q<4;q++){const an=R()*6.28;palm(x,ox+Math.cos(an)*rr*1.45,oy+Math.sin(an)*rr*1.0,7+R()*3);}}}
  // ridge foothills (under roads)
  for(const b of G.bars)if(b.k==='r'){rp(b.pts);x.strokeStyle='rgba(120,110,85,.45)';x.lineWidth=86;x.stroke();x.strokeStyle='rgba(150,135,100,.5)';x.lineWidth=60;x.stroke();}
  // roads
  const road=e=>{const a=G.castles[e.a],b=G.castles[e.b];x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);};
  x.beginPath();G.edges.forEach(road);x.strokeStyle=PAL.road[0];x.lineWidth=17;x.stroke();x.strokeStyle=PAL.road[1];x.lineWidth=13;x.stroke();
  x.setLineDash([7,5]);x.strokeStyle='rgba(120,90,50,.35)';x.lineWidth=1.4;
  for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];const L=e.len,nx=-(b.y-a.y)/L,ny=(b.x-a.x)/L;for(const s of[-2.6,2.6]){x.beginPath();x.moveTo(a.x+nx*s,a.y+ny*s);x.lineTo(b.x+nx*s,b.y+ny*s);x.stroke();}}
  x.setLineDash([]);
  for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];for(let i=0;i<e.len/18;i++){const t=R();x.fillStyle=R()<.5?'#a88a5c':'#e0c795';x.beginPath();x.ellipse(a.x+(b.x-a.x)*t+(R()-.5)*10,a.y+(b.y-a.y)*t+(R()-.5)*10,1+R(),.8+R()*.7,0,0,7);x.fill();}}
  // bridges and passes
  const hitB=(a,b,pts)=>{for(let i=0;i<pts.length-1;i++){const p=pts[i],q=pts[i+1];const d=(b.x-a.x)*(q.y-p.y)-(b.y-a.y)*(q.x-p.x);if(!d)continue;
    const u=((p.x-a.x)*(q.y-p.y)-(p.y-a.y)*(q.x-p.x))/d,v=((p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x))/d;if(u>0&&u<1&&v>0&&v<1)return{x:a.x+u*(b.x-a.x),y:a.y+u*(b.y-a.y)};}return null;};
  const passes=[];
  for(const e of G.edges){if(!e.cross)continue;const a=G.castles[e.a],b=G.castles[e.b];let p=null;for(const br of G.bars)if(e.cross==='w'?(br.k==='w'||br.k==='s'):br.k==='r'){p=hitB(a,b,br.pts);if(p)break;}if(!p)continue;
    if(e.cross==='r'){passes.push(p);continue;}
    x.save();x.translate(p.x,p.y);x.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    x.fillStyle='rgba(0,0,0,.3)';x.fillRect(-32,-9,68,24);const wg=x.createLinearGradient(0,-12,0,12);wg.addColorStop(0,'#c49a64');wg.addColorStop(1,'#8f6a3e');x.fillStyle=wg;x.fillRect(-34,-12,68,24);
    x.strokeStyle='#6d4f2c';x.lineWidth=1.2;for(let i=-30;i<=30;i+=5){x.beginPath();x.moveTo(i,-12);x.lineTo(i,12);x.stroke();}
    x.fillStyle='#5e4325';x.fillRect(-35,-14,70,3.5);x.fillRect(-35,10.5,70,3.5);x.restore();}
  // mountain ridges with gaps at the passes
  const mts=[];
  for(const b of G.bars)if(b.k==='r'){for(let i=0;i<b.pts.length-1;i++){const p=b.pts[i],q=b.pts[i+1];const L=Math.hypot(q.x-p.x,q.y-p.y);
      for(let d=0;d<L;d+=13){const mx=p.x+(q.x-p.x)*d/L+(R()-.5)*18,my=p.y+(q.y-p.y)*d/L+(R()-.5)*16;
        if(passes.some(pp=>Math.hypot(pp.x-mx,pp.y-my)<46))continue;mts.push([mx,my,18+R()*16]);}}}
  mts.sort((m1,m2)=>m1[1]-m2[1]);
  for(const [mx,my,sz] of mts){x.fillStyle='rgba(30,30,20,.25)';x.beginPath();x.ellipse(mx+sz*.35,my+2,sz*.9,sz*.25,0,0,7);x.fill();
    x.fillStyle='#8b8272';x.beginPath();x.moveTo(mx-sz*.85,my);x.lineTo(mx,my-sz*1.25);x.lineTo(mx+sz*.85,my);x.closePath();x.fill();
    x.fillStyle='#6d6556';x.beginPath();x.moveTo(mx,my-sz*1.25);x.lineTo(mx+sz*.85,my);x.lineTo(mx+sz*.1,my);x.closePath();x.fill();
    x.fillStyle='#f4f2ec';x.beginPath();x.moveTo(mx-sz*.28,my-sz*.84);x.lineTo(mx,my-sz*1.25);x.lineTo(mx+sz*.3,my-sz*.83);x.lineTo(mx+sz*.1,my-sz*.9);x.lineTo(mx-sz*.08,my-sz*.8);x.closePath();x.fill();}
  for(const p of passes)for(let i=0;i<6;i++){const a=R()*6.28;rock(x,p.x+Math.cos(a)*(26+R()*14),p.y+Math.sin(a)*(18+R()*10),3+R()*4);}
  // rocks near mines
  for(const c of G.castles)if(c.kind==='m')for(let i=0;i<8;i++){const a=R()*6.28,r=34+R()*24;rock(x,c.x+Math.cos(a)*r,c.y+Math.sin(a)*r*.7,3+R()*5);}
  // forests
  const nearSeg=(px,py,m)=>{for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];if(segDist2(px,py,a.x,a.y,b.x,b.y)<m*m)return true;}
    for(const b of G.bars){const r=b.pts;const mm=b.k==='r'?m+40:b.k==='s'?m+60:m+18;for(let i=0;i<r.length-1;i++)if(segDist2(px,py,r[i].x,r[i].y,r[i+1].x,r[i+1].y)<mm*mm)return true;}return false;};
  const trees=[];for(let f=0;f<Math.round(W*H/(th==='desert'?160000:40000));f++){const fx=R()*W,fy=R()*H,n=5+Math.floor(R()*12);for(let i=0;i<n;i++){const px=fx+(R()-.5)*90,py=fy+(R()-.5)*90;
    if(px<6||px>W-6||py<6||py>H-6||nearSeg(px,py,14)||G.castles.some(c=>Math.hypot(px-c.x,py-c.y)<82))continue;trees.push([px,py,5.5+R()*3.5]);}}
  trees.sort((a,b)=>a[1]-b[1]);for(const t of trees){if(th==='winter')pine(x,t[0],t[1],t[2]);else if(th==='desert'){if(R()<0.5)cactus(x,t[0],t[1],t[2]*0.9);else rock(x,t[0],t[1],t[2]*0.7);}else tree(x,t[0],t[1],t[2],R);}
  x.strokeStyle=PAL.border;x.lineWidth=4;x.strokeRect(2,2,W-4,H-4);
  return cn;
}
// ---------- unit figures (art units, mirrored by facing) ----------
function drawUnit(x,px,py,k,col,t,dir,u,bearer,act,v=0){
  if(u===1){soldier(x,px,py,k,col,t,dir,bearer,v);return;}
  x.save();x.translate(px,py);x.scale(k*dir,k);
  if(u===0){ // militia: no armour, farm tools
    const bob=Math.abs(Math.sin(t))*2.2,leg=Math.sin(t)*3;
    x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(2,1,5.5,2.2,0,0,7);x.fill();
    x.strokeStyle='#4a3a2a';x.lineWidth=2.2;x.lineCap='round';x.beginPath();x.moveTo(-1.5,-7-bob*.3);x.lineTo(-1.5+leg*.6,0);x.moveTo(1.5,-7-bob*.3);x.lineTo(1.5-leg*.6,0);x.stroke();
    x.fillStyle='#9c8a6c';x.beginPath();x.moveTo(-4.5,-7-bob);x.lineTo(-3.5,-16-bob);x.lineTo(3.5,-16-bob);x.lineTo(4.5,-7-bob);x.closePath();x.fill();
    x.fillStyle=col;x.fillRect(-4.4,-11.5-bob,8.8,2.6);
    x.fillStyle=SKIN[v%4];x.beginPath();x.arc(0,-19.5-bob,3.2,0,7);x.fill();
    x.fillStyle=['#5a4028','#2e2418','#8a6a3a','#6b6b6b'][v%4];x.beginPath();x.arc(0,-20.6-bob,3.4,Math.PI*1.1,-0.1);x.fill();
    const sw=act?Math.sin(t*1.2)*0.5:0;x.save();x.translate(3,-11-bob);x.rotate(-0.35+sw);x.strokeStyle='#6b5a44';x.lineWidth=1.3;x.beginPath();x.moveTo(0,4);x.lineTo(0,-20);x.stroke();
    if(v%2){x.strokeStyle='#9aa0a6';x.lineWidth=1;x.beginPath();x.moveTo(-2,-20);x.lineTo(-2,-25);x.moveTo(0,-20);x.lineTo(0,-26);x.moveTo(2,-20);x.lineTo(2,-25);x.moveTo(-2,-20);x.lineTo(2,-20);x.stroke();}
    else{x.fillStyle='#9aa0a6';x.beginPath();x.moveTo(0,-20);x.lineTo(4,-23);x.lineTo(4,-16);x.closePath();x.fill();}x.restore();
  }else if(u===9){ // (unused)
    const bob=act?0:Math.abs(Math.sin(t))*2,leg=act?0:Math.sin(t)*3;
    x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(2,1,6,2.4,0,0,7);x.fill();
    x.strokeStyle='#3a2f24';x.lineWidth=2.2;x.lineCap='round';x.beginPath();x.moveTo(-1.5,-7-bob*.3);x.lineTo(-1.5+leg*.6,0);x.moveTo(1.5,-7-bob*.3);x.lineTo(1.5-leg*.6,0);x.stroke();
    x.fillStyle='#6b5234';x.fillRect(-6,-17-bob,3,9); // quiver
    x.fillStyle=col;x.beginPath();x.moveTo(-4.5,-7-bob);x.lineTo(-3.5,-16-bob);x.lineTo(3.5,-16-bob);x.lineTo(4.5,-7-bob);x.closePath();x.fill();
    x.fillStyle=SKIN[v%4];x.beginPath();x.arc(0,-19.5-bob,3.2,0,7);x.fill();
    x.fillStyle=(v>>2)%2?shade(col,-.35):'#5b4a36';x.beginPath();x.arc(0,-20.5-bob,3.9,Math.PI*1.05,-0.05);x.lineTo(-3.5,-17-bob);x.fill(); // hood
    const draw=act?Math.max(0,Math.sin(t*2.2))*3:0;
    x.strokeStyle='#5e4325';x.lineWidth=1.6;x.beginPath();x.arc(4,-13-bob,8,-1.25,1.25);x.stroke();
    x.strokeStyle='rgba(240,235,220,.9)';x.lineWidth=.7;x.beginPath();x.moveTo(4+8*Math.cos(-1.25),-13-bob+8*Math.sin(-1.25));x.lineTo(4-draw,-13-bob);x.lineTo(4+8*Math.cos(1.25),-13-bob+8*Math.sin(1.25));x.stroke();
  }else if(u===2){ // knight
    const g=act?t*1.6:t*1.4,leg=Math.sin(g)*4,bob=Math.abs(Math.sin(g))*1.5;
    x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(1,1,13,3.4,0,0,7);x.fill();
    x.strokeStyle='#4a3220';x.lineWidth=2.4;x.lineCap='round';x.beginPath();
    x.moveTo(-8,-8-bob);x.lineTo(-8+leg,0);x.moveTo(-5,-8-bob);x.lineTo(-5-leg,0);x.moveTo(6,-8-bob);x.lineTo(6-leg,0);x.moveTo(9,-8-bob);x.lineTo(9+leg,0);x.stroke();
    const HC=['#7a5230','#5a3a22','#9a7650','#3a2a1e','#c9b79a'][v%5];x.fillStyle=HC;x.beginPath();x.ellipse(0,-11-bob,12,5.5,0,0,7);x.fill();
    x.beginPath();x.moveTo(8,-14-bob);x.lineTo(14,-22-bob);x.lineTo(18,-20-bob);x.lineTo(12,-11-bob);x.closePath();x.fill();
    if(v===15){x.fillStyle='#c0392b';x.beginPath();x.ellipse(0,-34-bob,1.5,3.2,-0.3,0,7);x.fill();}
    x.fillStyle='#3a2616';x.beginPath();x.moveTo(-12,-12-bob);x.quadraticCurveTo(-17,-9-bob,-15,-4-bob);x.lineTo(-11,-10-bob);x.fill();
    x.fillStyle='#a7adb3';x.beginPath();x.moveTo(8,-14-bob);x.lineTo(14,-22-bob);x.lineTo(16.5,-21-bob);x.lineTo(11,-12-bob);x.closePath();x.fill(); // chanfron
    x.fillStyle=col;x.fillRect(-9,-15-bob,15,8); // caparison
    x.fillStyle=shade(col,-.3);x.fillRect(-9,-8-bob,15,1.5);x.fillStyle='#f1ede4';x.fillRect(-3,-14-bob,2,6);
    x.fillStyle=col;x.beginPath();x.moveTo(-3,-15-bob);x.lineTo(-2,-25-bob);x.lineTo(4,-25-bob);x.lineTo(4,-15-bob);x.closePath();x.fill();
    x.fillStyle='#b9bec4';x.fillRect(-2.6,-25-bob,7.2,10); // breastplate
    x.fillStyle='#9aa0a6';x.beginPath();x.moveTo(-2.4,-25.5-bob);x.lineTo(-2.4,-31-bob);x.quadraticCurveTo(1,-34-bob,4.4,-31-bob);x.lineTo(4.4,-25.5-bob);x.closePath();x.fill(); // great helm
    x.fillStyle='#2e2a24';x.fillRect(0,-29.5-bob,4.4,1);
    x.fillStyle=v%3?col:'#f1ede4';x.beginPath();x.ellipse(0.5,-35.5-bob,1.6,3.4,-0.3,0,7);x.fill();
    const lx=act?Math.sin(t*3)*3:0;x.strokeStyle='#6b5a44';x.lineWidth=1.5;x.beginPath();x.moveTo(-4,-18-bob);x.lineTo(20+lx,-30-bob);x.stroke();
    if(bearer){x.fillStyle=col;x.beginPath();x.moveTo(16+lx,-28-bob);x.lineTo(10+lx,-33-bob);x.lineTo(15+lx,-31-bob);x.fill();}
  }else{ // siege ram
    const push=act?Math.max(0,Math.sin(t*1.5))*4:0,roll=t*0.8;
    x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(0,1,15,3.6,0,0,7);x.fill();
    x.fillStyle='#8f6a3e';x.fillRect(-13,-10,26,7);
    x.fillStyle='#5e4325';x.beginPath();x.moveTo(-15,-10);x.lineTo(0,-22);x.lineTo(15,-10);x.closePath();x.fill();
    x.fillStyle=col;x.beginPath();x.moveTo(-9,-13);x.lineTo(0,-20);x.lineTo(9,-13);x.closePath();x.fill();
    x.fillStyle='#6b5234';x.fillRect(-4+push,-9,22,4);x.fillStyle='#6e6a62';x.beginPath();x.arc(18+push,-7,3,0,7);x.fill();
    for(const wx of[-9,0,9]){x.fillStyle='#4a3220';x.beginPath();x.arc(wx,-2,3.2,0,7);x.fill();x.strokeStyle='#a88a5c';x.lineWidth=.8;x.beginPath();x.moveTo(wx+Math.cos(roll)*3,-2+Math.sin(roll)*3);x.lineTo(wx-Math.cos(roll)*3,-2-Math.sin(roll)*3);x.stroke();}
  }
  x.restore();
}
function drawCorpse(x,px,py,k,col,u,flip){
  x.save();x.translate(px,py);x.scale(k*(flip?-1:1),k);
  if(u===2){x.fillStyle='#6a4628';x.beginPath();x.ellipse(0,-4,12,4.5,0.1,0,7);x.fill();x.fillStyle=col;x.fillRect(-5,-8,9,5);x.strokeStyle='#4a3220';x.lineWidth=2;x.beginPath();x.moveTo(-8,-1);x.lineTo(-13,2);x.moveTo(7,-1);x.lineTo(12,3);x.stroke();}
  else if(u===3){x.fillStyle='#6b5234';x.save();x.rotate(0.3);x.fillRect(-12,-6,11,3);x.restore();x.fillRect(0,-4,12,3);x.fillStyle=col;x.beginPath();x.moveTo(-6,-2);x.lineTo(0,-8);x.lineTo(4,-2);x.fill();x.fillStyle='#4a3220';x.beginPath();x.arc(8,0,3,0,7);x.fill();}
  else{x.rotate(1.35);x.fillStyle=col;x.fillRect(-4,-16,8,10);x.fillStyle='#e9c49a';x.beginPath();x.arc(0,-19,3.2,0,7);x.fill();x.strokeStyle='#3a2f24';x.lineWidth=2;x.beginPath();x.moveTo(-1.5,-6);x.lineTo(-2,0);x.moveTo(1.5,-6);x.lineTo(2,0);x.stroke();}
  x.restore();}

function drawTower(x,t,col,now,px){
  const X=t.x,Y=t.y,r=6.5,h=t.bt>0?11:22;
  x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(X+r*.9,Y+1.5,r*1.5,r*.55,-.2,0,7);x.fill();
  const g=x.createLinearGradient(X-r,0,X+r,0);g.addColorStop(0,STONE[0]);g.addColorStop(.5,STONE[1]);g.addColorStop(1,STONE[2]);x.fillStyle=g;
  x.beginPath();x.moveTo(X-r,Y-h);x.lineTo(X-r,Y);x.ellipse(X,Y,r,r*.45,0,Math.PI,0,true);x.lineTo(X+r,Y-h);x.closePath();x.fill();
  x.strokeStyle='rgba(60,55,45,.35)';x.lineWidth=.5;for(let yy=Y-h+4;yy<Y;yy+=4){x.beginPath();x.ellipse(X,yy,r,r*.45,0,.15,Math.PI-.15);x.stroke();}
  if(t.bt>0){x.strokeStyle='#8a6a40';x.lineWidth=.9;for(const dx of[-r-2,r+2]){x.beginPath();x.moveTo(X+dx,Y+1);x.lineTo(X+dx,Y-h-9);x.stroke();}
    for(let yy=Y-2;yy>Y-h-9;yy-=5){x.beginPath();x.moveTo(X-r-2,yy);x.lineTo(X+r+2,yy-2);x.stroke();}return;}
  x.fillStyle=STONE[0];for(let k=-2;k<=2;k++){x.fillRect(X+k*2.6-1,Y-h-2.5,2,2.5);}
  x.fillStyle='#2e2a24';x.fillRect(X-.7,Y-h*.62,1.4,3.5);
  const rg=x.createLinearGradient(X-r,0,X+r,0);rg.addColorStop(0,shade(col,.35));rg.addColorStop(.55,col);rg.addColorStop(1,shade(col,-.4));x.fillStyle=rg;
  x.beginPath();x.moveTo(X-r*1.15,Y-h-2.5);x.lineTo(X,Y-h-2.5-r*1.9);x.lineTo(X+r*1.15,Y-h-2.5);x.closePath();x.fill();
  drawFlag(x,X,Y-h-2.5-r*1.9,0.45,col,now/1000,false);
  if(t.hp<TOWER_HP*0.98){const w=16,f=Math.max(0,t.hp/TOWER_HP);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(X-w/2,Y+4,w,2.6);x.fillStyle=f>0.4?'#5cc06a':'#e0574c';x.fillRect(X-w/2+.3,Y+4.3,(w-.6)*f,2);}
}

function drawWonder(x,X,Y,stage,prog,col,now,done){
  const H=12+stage*9+(done?6:0),w=13;
  x.fillStyle='rgba(20,30,10,.3)';x.beginPath();x.ellipse(X+6,Y+2,w*1.4,4.5,0,0,7);x.fill();
  // stepped stone base and gilded obelisk
  x.fillStyle='#cfc4ad';x.fillRect(X-w,Y-5,w*2,5);x.fillStyle='#bdb09a';x.fillRect(X-w*.8,Y-9,w*1.6,4);
  if(stage>0){const g=x.createLinearGradient(X-6,0,X+6,0);g.addColorStop(0,'#f6dc8a');g.addColorStop(.5,'#e3b43c');g.addColorStop(1,'#a87c1a');x.fillStyle=g;
    x.beginPath();x.moveTo(X-6,Y-9);x.lineTo(X-4,Y-9-H);x.lineTo(X+4,Y-9-H);x.lineTo(X+6,Y-9);x.closePath();x.fill();
    x.strokeStyle='rgba(120,80,10,.5)';x.lineWidth=.6;for(let k=1;k<stage;k++){const yy=Y-9-k*9;x.beginPath();x.moveTo(X-5.5+k*.4,yy);x.lineTo(X+5.5-k*.4,yy);x.stroke();}}
  if(done){x.fillStyle='#fff3c4';x.beginPath();x.moveTo(X-4,Y-9-H);x.lineTo(X,Y-17-H);x.lineTo(X+4,Y-9-H);x.closePath();x.fill();
    const t=now/1000;x.save();x.globalAlpha=.25+.15*Math.sin(t*2);x.fillStyle='#ffe08a';for(let k=0;k<6;k++){const an=t*.4+k*Math.PI/3;x.beginPath();x.moveTo(X,Y-13-H);x.lineTo(X+Math.cos(an)*26-2,Y-13-H+Math.sin(an)*26);x.lineTo(X+Math.cos(an)*26+2,Y-13-H+Math.sin(an)*26);x.closePath();x.fill();}x.restore();
    drawFlag(x,X,Y-17-H,0.4,col,now/1000,false);}
  else if(prog>0||stage<WONDER_STAGES){ // scaffolding on the stage being built
    const top=Y-9-H-9*Math.max(0.15,prog);x.strokeStyle='#8a6a40';x.lineWidth=.8;for(const dx of[-8,8]){x.beginPath();x.moveTo(X+dx,Y-5);x.lineTo(X+dx*.6,top);x.stroke();}
    for(let yy=Y-8;yy>top;yy-=5){x.beginPath();x.moveTo(X-8+(Y-yy)*.06,yy);x.lineTo(X+8-(Y-yy)*.06,yy-1.5);x.stroke();}}
}

function pine(x,px,py,s){x.fillStyle='rgba(40,60,80,.22)';x.beginPath();x.ellipse(px+s*.5,py+s*.35,s*.9,s*.4,0,0,7);x.fill();x.fillStyle='#4a3424';x.fillRect(px-s*.1,py-s*.2,s*.2,s*.5);
  for(let k=0;k<3;k++){const w=s*(0.95-k*0.22),y0=py-s*0.15-k*s*0.55;x.fillStyle='#24513a';x.beginPath();x.moveTo(px-w,y0);x.lineTo(px,y0-s*0.9);x.lineTo(px+w,y0);x.closePath();x.fill();
    x.fillStyle='#f4f8fb';x.beginPath();x.moveTo(px-w*0.45,y0-s*0.45);x.lineTo(px,y0-s*0.9);x.lineTo(px+w*0.45,y0-s*0.45);x.lineTo(px+w*0.15,y0-s*0.55);x.lineTo(px-w*0.1,y0-s*0.42);x.closePath();x.fill();}}
function palm(x,px,py,s){x.strokeStyle='#7a5a34';x.lineWidth=s*0.22;x.lineCap='round';x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+s*.3,py-s*.8,px+s*.15,py-s*1.6);x.stroke();
  x.strokeStyle='#3f7d3a';x.lineWidth=s*0.18;for(const an of[-2.6,-1.9,-1.2,-0.5,0.2]){x.beginPath();x.moveTo(px+s*.15,py-s*1.6);x.quadraticCurveTo(px+s*.15+Math.cos(an)*s*.7,py-s*1.6+Math.sin(an)*s*.5-s*.2,px+s*.15+Math.cos(an)*s*1.1,py-s*1.6+Math.sin(an)*s*.8);x.stroke();}}
function cactus(x,px,py,s){x.fillStyle='rgba(90,60,30,.25)';x.beginPath();x.ellipse(px+s*.3,py+s*.1,s*.6,s*.2,0,0,7);x.fill();x.strokeStyle='#4f7d3e';x.lineCap='round';x.lineWidth=s*0.32;
  x.beginPath();x.moveTo(px,py);x.lineTo(px,py-s*1.5);x.moveTo(px,py-s*.7);x.lineTo(px-s*.45,py-s*.8);x.lineTo(px-s*.45,py-s*1.15);x.moveTo(px,py-s*.95);x.lineTo(px+s*.4,py-s*1.0);x.lineTo(px+s*.4,py-s*1.3);x.stroke();}
