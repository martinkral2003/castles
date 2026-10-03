// ===== Brimfall renderer: camera, fog of war, effects, weather, HUD, stats, gestures =====
// ---------- camera ----------
const cv=$('#cv'),ctx=cv.getContext('2d');let VS={s:1,ox:0,oy:0,dpr:1,w:0,h:0},TH={};
const CAM={x:500,y:800,z:1,tx:500,ty:800,tz:1},SHK={x:0,y:0,a:0};
const RMO=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();
function baseScale(){return Math.max(0.01,Math.min((VS.w-12)/G.W,(VS.h-12)/G.H));}
function clampCam(o){const s=baseScale()*o.z;const hw=VS.w/(2*s),hh=VS.h/(2*s),m=24;
  o.x=hw*2>=G.W+2*m?G.W/2:Math.max(hw-m,Math.min(G.W-hw+m,o.x));o.y=hh*2>=G.H+2*m?G.H/2:Math.max(hh-m,Math.min(G.H-hh+m,o.y));}
function applyCam(){VS.s=baseScale()*CAM.z;VS.ox=VS.w/2-CAM.x*VS.s;VS.oy=VS.h/2-CAM.y*VS.s;}
function setCam(x,y,z,instant){CAM.tz=Math.max(1,Math.min(6,z));const t={x,y,z:CAM.tz};clampCam(t);CAM.tx=t.x;CAM.ty=t.y;if(instant){CAM.x=t.x;CAM.y=t.y;CAM.z=t.z;}}
function resetCam(instant){if(!G)return;if(VS.w===0)resize();const h=mySlot>=0?G.home[mySlot]:undefined;
  if(h!==undefined){const c=G.castles[h];setCam(c.x,c.y,VS.w<700?3.2:2.2,instant);}else setCam(G.W/2,G.H/2,1,instant);}
function zoomAt(sx,sy,f){const w={x:(sx-VS.ox)/VS.s,y:(sy-VS.oy)/VS.s};const z=Math.max(1,Math.min(6,CAM.z*f));const s=baseScale()*z;
  const t={x:w.x-(sx-VS.w/2)/s,y:w.y-(sy-VS.h/2)/s,z};clampCam(t);CAM.x=CAM.tx=t.x;CAM.y=CAM.ty=t.y;CAM.z=CAM.tz=z;applyCam();}
$('#z-in').onclick=()=>setCam(CAM.x,CAM.y,CAM.z*1.4);
$('#z-out').onclick=()=>setCam(CAM.x,CAM.y,CAM.z/1.4);
$('#z-fit').onclick=()=>setCam(G.W/2,G.H/2,1);
function stepCam(dt){const k=1-Math.exp(-dt*10);CAM.z+=(CAM.tz-CAM.z)*k;CAM.x+=(CAM.tx-CAM.x)*k;CAM.y+=(CAM.ty-CAM.y)*k;const t={x:CAM.x,y:CAM.y,z:CAM.z};clampCam(t);CAM.x=t.x;CAM.y=t.y;applyCam();
  SHK.a=SHK.a>.05?SHK.a*Math.exp(-dt*8):0;SHK.x=(Math.random()-.5)*2*SHK.a;SHK.y=(Math.random()-.5)*2*SHK.a;}
function camShake(a){if(!RMO)SHK.a=Math.min(5,SHK.a+a);}
const useW=()=>ctx.setTransform(VS.dpr*VS.s,0,0,VS.dpr*VS.s,VS.dpr*(VS.ox+SHK.x),VS.dpr*(VS.oy+SHK.y)),useS=()=>ctx.setTransform(VS.dpr,0,0,VS.dpr,0,0);

// ---------- theme & palette ----------
function readTheme(){const cs=getComputedStyle(document.documentElement);
  for(const k of['ink','neutral','bg','fog','soul'])TH[k]=cs.getPropertyValue('--'+k).trim();if(!/^#[0-9a-f]{6}$/i.test(TH.soul))TH.soul='#9fe6ff';fogData=null;}
function hexRgb(h){h=(h||'#888888').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
const NEUC='#8a8478',colOf=o=>o===NEUTRAL?NEUC:COLORS[o];
const EMB='#ff8a2a',EYEC='#c27bff',SPC=['#ff3b3b','#c27bff','#ff6a2a'],UHT=[25,32,46,56];
readTheme();try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readTheme);}catch(e){}
function rShade(h,k){return'rgb('+hexRgb(h).map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k))+')';}
const tSig=(x,cx,cy,r,col)=>(typeof drawSigil==='function'?drawSigil:drawStar)(x,cx,cy,r,col);
const isSoulC=c=>c.owner!==NEUTRAL&&c.kind!=='m'&&!!c.mode;
function spellOf(id){return typeof SPELLS!=='undefined'&&id>=0?SPELLS[id]:null;}
function lordName(l){const n=l&&l.nm?String(l.nm):'';return n?(/^lord /i.test(n)?n:'Lord '+n):'';}

// ---------- light sprites: cheap additive glows ----------
const GLW=new Map();
function lightSpr(col,hot){const key=col+(hot?'*':'');let c=GLW.get(key);if(c)return c;const [r,g,b]=hexRgb(col),q=a=>`rgba(${r},${g},${b},${a})`;
  c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
  if(hot){gr.addColorStop(0,'rgba(255,250,236,1)');gr.addColorStop(.16,q(.95));}else gr.addColorStop(0,q(1));
  gr.addColorStop(.42,q(.32));gr.addColorStop(1,q(0));x.fillStyle=gr;x.fillRect(0,0,64,64);GLW.set(key,c);return c;}
function glowAt(x,y,r,col,a,hot){if(a>.004&&r>0){ctx.globalAlpha=Math.min(1,a);ctx.drawImage(lightSpr(col,hot),x-r,y-r,2*r,2*r);}}
function glowEl(x,y,rx,ry,col,a,hot){if(a>.004&&rx>0){ctx.globalAlpha=Math.min(1,a);ctx.drawImage(lightSpr(col,hot),x-rx,y-ry,2*rx,2*ry);}}

// ---------- fog of war ----------
const CELL=40;let FW=0,FH=0,explored=null,vis=null,fogCv=null,fogCtx=null,fogImg=null,fogNoise=null,visT=0,fogVB=null,fogEB=null;
function initFog(){FW=Math.ceil(G.W/CELL);FH=Math.ceil(G.H/CELL);explored=new Uint8Array(FW*FH);vis=new Uint8Array(FW*FH);fogVB=new Float32Array(FW*FH);fogEB=new Float32Array(FW*FH);
  fogCv=document.createElement('canvas');fogCv.width=FW;fogCv.height=FH;fogCtx=fogCv.getContext('2d');fogImg=fogCtx.createImageData(FW,FH);
  const R=mkRng(G.terrainSeed^77);fogNoise=new Float32Array(FW*FH);const cw=Math.ceil(FW/4)+2,ch=Math.ceil(FH/4)+2,coarse=[];for(let i=0;i<cw*ch;i++)coarse.push(R());
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const gx=x/4,gy=y/4,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,sm=t=>t*t*(3-2*t);
    const v=(a,b)=>coarse[b*cw+a];const top=v(x0,y0)+(v(x0+1,y0)-v(x0,y0))*sm(fx),bot=v(x0,y0+1)+(v(x0+1,y0+1)-v(x0,y0+1))*sm(fx);fogNoise[y*FW+x]=(top+(bot-top)*sm(fy))*.75+R()*.25;}fogData=true;}
function cellAt(x,y){const cx=Math.max(0,Math.min(FW-1,Math.floor(x/CELL))),cy=Math.max(0,Math.min(FH-1,Math.floor(y/CELL)));return cy*FW+cx;}
function isVisibleC(i){if(allSeeing())return true;const c=G.castles[i];if(isTeam(c.owner))return true;return !!vis&&vis[cellAt(c.x,c.y)]===1;}
function solVisible(o,x,y){if(allSeeing()||isTeam(o))return true;return !!vis&&vis[cellAt(x,y)]===1;}
const visAt=(x,y)=>allSeeing()||!!vis&&vis[cellAt(x,y)]===1;
const remoteView=()=>NET.mode==='client'||NET.mode==='replay';
function solList(){return remoteView()?(G.csol||[]):G.sol;}
const visionOf=c=>typeof castleVision==='function'?castleVision(c):c.capital>=0?300:210+Math.min(c.lv,3)*15;
function updateVision(){
  if(!fogData||!explored)initFog();vis.fill(0);
  if(allSeeing()){vis.fill(1);explored.fill(1);}
  else{const S=[],nv=1-0.4*nightLevel(G.time);
    G.castles.forEach(c=>{if(isTeam(c.owner))S.push({x:c.x,y:c.y,r:visionOf(c)*nv});});
    let k=0;for(const so of solList())if(isTeam(so.o)&&(so.u===3||k++%3===0))S.push({x:so.x,y:so.y,r:100*nv});
    for(const o of G.scouts)if(isTeam(o.s))S.push({x:o.x,y:o.y,r:o.r||200});
    for(const s of S){const x0=Math.max(0,Math.floor((s.x-s.r)/CELL)),x1=Math.min(FW-1,Math.floor((s.x+s.r)/CELL)),y0=Math.max(0,Math.floor((s.y-s.r)/CELL)),y1=Math.min(FH-1,Math.floor((s.y+s.r)/CELL));
      for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const px=(cx+.5)*CELL-s.x,py=(cy+.5)*CELL-s.y;if(px*px+py*py<=s.r*s.r){vis[cy*FW+cx]=1;explored[cy*FW+cx]=1;}}}}
  G.castles.forEach((c,i)=>{if(isVisibleC(i))seen[i]={owner:c.owner,size:c.size,lv:c.lv,kind:c.kind,capital:c.capital,u:[...c.u],path:c.path|0,nw:c.nw|0,mode:c.mode|0,tl:c.tl|0,hill:c.hill,lords:(c.lords||[]).map(l=>({...l}))};});
  // soften the cell grid (3x3 blur, edges clamped) so the fog line reads as drifting smoke, not blocks
  const bl=(src,out)=>{for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){let s=0;for(let dy=-1;dy<=1;dy++){const r=Math.min(FH-1,Math.max(0,y+dy))*FW;for(let dx=-1;dx<=1;dx++)s+=src[r+Math.min(FW-1,Math.max(0,x+dx))]*(dx?1:2)*(dy?1:2);}out[y*FW+x]=s/16;}};
  bl(vis,fogVB);bl(explored,fogEB);
  const fc={ash:[24,15,13],frost:[13,18,27],sulfur:[30,20,11]}[G.theme]||[20,15,14],d=fogImg.data;
  for(let i=0;i<FW*FH;i++){const n=(fogNoise[i]-.5)*30,b=Math.max(0,Math.min(1,(fogVB[i]-.2)/.6)),v=b*b*(3-2*b),e=fogEB[i];
    d[i*4]=fc[0]+n;d[i*4+1]=fc[1]+n*.8;d[i*4+2]=fc[2]+n*.7;d[i*4+3]=(1-v)*(e*122+(1-e)*(238+fogNoise[i]*17));}
  fogCtx.putImageData(fogImg,0,0);
}

// ---------- effects ----------
// layers: 0 ground decals, 1 world (smoke, debris), 2 light (additive, drawn after the night tint), 3 text
const FXMAX=620,FXL={corpse:0,scorch:0,ring:1,p:1,sm:1,db:1,crk:1,em:2,ws:2,bolt:2,fl:2,sr:2,portal:2,beam:2,bub:2,txt:3};
let fxRef=null;const FIRESEEN=new Map(),SMK=new Map();
const fxOk=n=>fx.length+n<FXMAX;
function fxRing(x,y,col,big){fx.push({k:'ring',L:1,x,y,col,t:performance.now(),big,life:big?950:700});}
function fxBurst(x,y,col,n,spd,life=600,hot,t0){const t=t0||performance.now();n=Math.min(n,FXMAX-fx.length);for(let i=0;i<n;i++){const a=Math.random()*6.283,v=spd*(0.4+Math.random()*0.8);
  fx.push({k:'p',L:hot?2:1,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.75-(hot?spd*.35:0),g:hot?70:0,col,t,r:1.5+Math.random()*2.5,life:life*(.7+Math.random()*.5)});}}
function fxText(x,y,txt,col){fx.push({k:'txt',L:3,x,y,txt,col,t:performance.now(),life:1500});}
function fxEmbers(x,y,n,sp,col,life,rise=1){const t=performance.now();n=Math.min(n,FXMAX-fx.length);for(let i=0;i<n;i++)fx.push({k:'em',L:2,x:x+(Math.random()-.5)*2*sp,y:y+(Math.random()-.5)*sp*.6,vx:(Math.random()-.5)*14,vy:-(14+Math.random()*30)*rise,col:col||EMB,t:t+Math.random()*120,life:life*(.6+Math.random()*.6),r:.8+Math.random()*1.2,ph:Math.random()*6.28});}
function fxSmoke(x,y,n,s,col,life,sp=6){const t=performance.now();n=Math.min(n,FXMAX-fx.length);for(let i=0;i<n;i++)fx.push({k:'sm',L:1,x:x+(Math.random()-.5)*2*sp,y:y+(Math.random()-.5)*sp,s:s*(.7+Math.random()*.6),col,a:.5,dx:(Math.random()-.3)*14,rise:22+Math.random()*20,t:t+i*90,life:life*(.8+Math.random()*.4)});}
function fxDebris(x,y,n,spd,col){const t=performance.now();n=Math.min(n,FXMAX-fx.length);for(let i=0;i<n;i++){const a=-Math.PI*(.1+.8*Math.random()),v=spd*(.4+Math.random()*.8);fx.push({k:'db',L:1,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,gy:y+6+Math.random()*14,col,t,life:900+Math.random()*700,r:1+Math.random()*1.8,rot:Math.random()*6});}}
function fxWisps(x,y,n,sp,h=1){const t=performance.now();n=Math.min(n,FXMAX-fx.length);for(let i=0;i<n;i++)fx.push({k:'ws',L:2,x:x+(Math.random()-.5)*2*sp,y:y+(Math.random()-.5)*sp*.5,h:(55+Math.random()*50)*h,t:t+i*110+Math.random()*80,life:1500+Math.random()*700,ph:Math.random()*6.28,r:.8+Math.random()*.5});}
function fxFlash(x,y,r,col,a,life){fx.push({k:'fl',L:2,x,y,r,col,a,t:performance.now(),life});}
function fxShock(x,y,r0,r1,col,w,life,a=.9){fx.push({k:'sr',L:2,x,y,r0,r1,col,w,a,t:performance.now(),life});}
const onScreen=(x,y)=>{const sx=x*VS.s+VS.ox,sy=y*VS.s+VS.oy;return sx>-60&&sx<VS.w+60&&sy>-80&&sy<VS.h+60;};
function fireFx(x,y,now){const key=Math.round(x)+','+Math.round(y),l=FIRESEEN.get(key);if(l&&now-l<3000)return;if(FIRESEEN.size>40)FIRESEEN.clear();FIRESEEN.set(key,now);
  if(!visAt(x,y))return;const fr=G.fires.find(f=>Math.abs(f.x-x)<2&&Math.abs(f.y-y)<2),R=fr&&fr.r||45;
  fx.push({k:'scorch',L:0,x,y,s:R/45,t:now,life:10000});fxFlash(x,y-8,R*1.9,'#ff7020',1,700);fxFlash(x,y,R*1.2,'#ff4a12',.45,2600);
  fxShock(x,y,R*.3,R*1.7,'#ffb24a',6,750);fxShock(x,y,R*.2,R*1.1,'#fff0c0',3,450,.8);fxBurst(x,y-6,'#ffb04a',22,80,900,1);fxBurst(x,y-6,'#ffe08a',10,50,700,1);
  fxSmoke(x,y-6,7,1.7,'#2a2220',2600,R*.5);fxDebris(x,y,8,90,'#2e2420');fxEmbers(x,y,10,R*.6,EMB,1600);if(onScreen(x,y))camShake(3.5);}
function capFx(c){const f=footOf(c),col=colOf(c.owner);fxRing(c.x,c.y,col,true);fxShock(c.x,c.y,f.rx*.4,f.rx*2,col,5,900,.7);fxBurst(c.x,c.y-8,col,12,70,800);
  fxSmoke(c.x,c.y-6,6,1.6,'#3d3430',2600,f.rx*.5);fxEmbers(c.x,c.y-f.ry*.4,10,f.rx*.6,EMB,1300);fxFlash(c.x,c.y-f.ry*.6,f.rx*1.4,col,.55,800);}
function upFx(c){const f=footOf(c);fxRing(c.x,c.y,'#ffc861',true);fxEmbers(c.x,c.y-f.ry*.3,12,f.rx*.7,'#ffcf6a',1400);fxFlash(c.x,c.y-f.ry*.5,f.rx*1.3,'#ffb84a',.4,800);}
function onEv(e,now){const c=e.c!=null?G.castles[e.c]:null;let f;
  switch(e.t){
  case 'die':if(!solVisible(e.o,e.x,e.y))break;if(fxOk(90))fx.push({k:'corpse',L:0,x:e.x,y:e.y,col:colOf(e.o),u:e.u|0,t:now,life:3800,fl:Math.random()<.5});
    if(fxOk(170)){fxEmbers(e.x,e.y-5,e.u>=2?5:2,5,EMB,900);fxSmoke(e.x,e.y-3,1,.7,'#2b2422',1000,3);}break;
  case 'shot':if(fxOk(60)&&(visAt(e.x,e.y)||visAt(e.tx,e.ty))){fx.push({k:'bolt',L:2,x:e.x,y:e.y-6,tx:e.tx,ty:e.ty-5,arc:8,t:now,life:340});fxBurst(e.tx,e.ty-5,'#ffb347',2,24,350,1,now+330);}break;
  case 'fire':fireFx(e.x,e.y,now);break;
  case 'spy':if(!(allSeeing()||isTeam(e.s)))break;fxFlash(e.x,e.y,110,EYEC,.6,900);fxShock(e.x,e.y,20,e.r||200,EYEC,3,1200,.6);break;
  case 'horde':if(isTeam(e.s)){const ci=G.capIdx[e.s],k=ci!==undefined?G.castles[ci]:null;if(k&&isVisibleC(ci)){f=footOf(k);fxShock(k.x,k.y,10,f.rx*3,'#ff3a24',5,900);fxFlash(k.x,k.y-f.ry*.5,f.rx*1.6,'#ff2a14',.55,800);}}
    else toast(ownerName(e.s)+' roused their horde!',2200);break;
  case 'soul':if(e.s===mySlot&&e.why<2){fxText(e.x,e.y-14,'+'+e.n,TH.soul);if(fxOk(120))fxWisps(e.x,e.y-8,Math.min(4,1+(e.n>>2)),6);}break;
  case 'rank':if(solVisible(e.o,e.x,e.y)){fxText(e.x,e.y-14,'★'.repeat(e.rk),'#ffcf5a');fxBurst(e.x,e.y-10,'#ffcf5a',5,26,600,1);}break;
  case 'cap':if(e.by===mySlot&&c){if(e.loot)fxText(c.x,c.y-30,'+'+e.loot+' souls',TH.soul);if(e.drop)setTimeout(()=>toast(G.names[e.c]+' was ravaged in the fighting and dropped a level.',2600),300);}break;
  case 'elim':toast(ownerName(e.s)+(e.by!=null&&e.by!==NEUTRAL?' was cast down by '+ownerName(e.by)+'.':' was cast down.'),3500);break;
  case 'wonder':if(e.stage===0)toast(e.s===mySlot?'You began raising a Hellgate. Rivals have been warned.':ownerName(e.s)+' began raising a Hellgate!',3500);break;
  case 'wstage':if(e.s===mySlot)toast('Hellgate stage '+e.stage+' of '+WONDER_STAGES+' complete.',2000);else if(e.stage===WONDER_STAGES-1&&!isTeam(e.s))toast(ownerName(e.s)+'’s Hellgate is nearly open!',3000);break;
  case 'wdone':{toast(e.s===mySlot?'Your Hellgate is open! Hold your Throne for '+WONDER_HOLD/60+' minutes.':ownerName(e.s)+' opened a Hellgate! Storm their Throne before time runs out.',4500);
    const ci=G.capIdx[e.s];if(ci!==undefined&&isVisibleC(ci)){const k=G.castles[ci];f=footOf(k);fxFlash(k.x-f.rx-16,k.y-30,90,'#ff3a6a',.9,1400);fxShock(k.x-f.rx-16,k.y,10,160,'#ff6a9a',6,1300);}break;}
  case 'card':if(e.s===mySlot&&$('#ov').hidden&&typeof CARDS!=='undefined'&&CARDS[e.id])toast('New card: '+CARDS[e.id].name+'.',2200);break;
  case 'offer':if(e.s===mySlot&&$('#ov').hidden)toast('Two cards await. Open Research to choose one.',2600);break;
  case 'lord':{if(!c)break;const v=isVisibleC(e.c),L=c.lords||[],nm=lordName(L.find(l=>l.home===e.c)||L[L.length-1]);
    if(v){f=footOf(c);const col=colOf(e.s);fx.push({k:'beam',L:2,x:c.x,y:c.y,col,t:now,life:1900,h:170});fxShock(c.x,c.y,10,f.rx*2.6,'#ffcf5a',6,1100);fxRing(c.x,c.y,col,true);fxEmbers(c.x,c.y-f.ry*.4,18,f.rx*.7,'#ffb04a',1600);fxFlash(c.x,c.y-f.ry,f.rx*1.6,col,.7,900);}
    if(e.s===mySlot)toast((nm||'A lord')+' rises at '+G.names[e.c]+'.',3200);else if(v)toast((nm||'A lord')+' rises for '+ownerName(e.s)+'!',3000);break;}
  case 'lorddie':{const v=visAt(e.x,e.y),nm=lordName(e);if(v){fxShock(e.x,e.y,6,90,'#ff4a3a',6,900);fxFlash(e.x,e.y-14,60,'#ff3a2a',.8,700);fxBurst(e.x,e.y-12,colOf(e.s),14,60,900,1);fxEmbers(e.x,e.y-10,14,14,EMB,1500);fxWisps(e.x,e.y-10,5,10);}
    if(e.s===mySlot)toast((nm||'Your lord')+' has fallen.',3000);else if(v)toast(ownerName(e.s)+'’s '+(nm||'lord')+' has fallen!',2600);break;}
  }}
function consumeEvents(){const now=performance.now(),remote=remoteView();
  if(fx!==fxRef){fxRef=fx;prevLook=G.castles.map(c=>c.lv*32+(c.path|0)*4+(c.tl|0));SMK.clear();FIRESEEN.clear();}
  if(remote)for(const f of G.fires)if(G.gt>=f.at)fireFx(f.x,f.y,now);
  if(G.events.length){for(const e of G.events){try{onEv(e,now);}catch(err){}}G.events.length=0;}
  G.castles.forEach((c,i)=>{
    if(prevOwner[i]!==c.owner){if(prevOwner[i]!==undefined&&isVisibleC(i))capFx(c);if(c.owner!==NEUTRAL&&stats)stats.taken[c.owner]++;prevOwner[i]=c.owner;}
    const lk=c.lv*32+(c.path|0)*4+(c.tl|0);if(prevLook[i]!==lk){if(prevLook[i]!==undefined&&lk>prevLook[i]&&isVisibleC(i))upFx(c);prevLook[i]=lk;}});
}
function drawFx(L,now,px){
  for(const f of fx){if((f.L??FXL[f.k]??1)!==L||now<f.t)continue;const e=(now-f.t)/1000,k=Math.min(1,(now-f.t)/(f.life||700));
    switch(f.k){
    case 'corpse':ctx.globalAlpha=Math.min(1,(1-k)*2.2)*.85;drawCorpse(ctx,f.x,f.y,ART*1.3,f.col,f.u|0,f.fl??Math.cos(f.r||0)>0);break;
    case 'scorch':{const a=Math.min(1,(1-k)*1.5),s=f.s||1;ctx.globalAlpha=a*.55;ctx.fillStyle='#120a07';ctx.beginPath();ctx.ellipse(f.x,f.y,40*s,28*s,0,0,7);ctx.fill();
      ctx.globalAlpha=a*.4;ctx.fillStyle='#3a1a0c';ctx.beginPath();ctx.ellipse(f.x-6*s,f.y+3*s,24*s,15*s,0,0,7);ctx.fill();break;}
    case 'ring':{const r=(f.big?30:20)+k*(f.big?45:20);ctx.strokeStyle=f.col;ctx.globalAlpha=(1-k)*.85;ctx.lineWidth=f.big?4:2.5;ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.7,0,0,7);ctx.stroke();break;}
    case 'p':{const x=f.x+f.vx*e,y=f.y+f.vy*e+.5*(f.g||0)*e*e,a=1-k;if(f.L===2)glowAt(x,y,f.r*2.6,f.col,a*.9,1);else{ctx.globalAlpha=a;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(x,y,f.r*(1-k*.5),0,7);ctx.fill();}break;}
    case 'sm':{ctx.globalAlpha=f.a*(1-k)*Math.min(1,k*6);ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x+k*f.dx+Math.sin(k*5+f.x)*2,f.y-k*f.rise,(2.5+k*7)*f.s,0,7);ctx.fill();break;}
    case 'db':{const x=f.x+f.vx*e,y=Math.min(f.gy,f.y+f.vy*e+110*e*e);ctx.globalAlpha=Math.min(1,(1-k)*3);ctx.fillStyle=f.col;ctx.save();ctx.translate(x,y);ctx.rotate(f.rot+(y<f.gy?e*8:0));ctx.fillRect(-f.r,-f.r*.7,f.r*2,f.r*1.4);ctx.restore();break;}
    case 'em':{const x=f.x+f.vx*e+Math.sin(e*3+f.ph)*3,y=f.y+f.vy*e;glowAt(x,y,f.r*3.2,f.col,(1-k)*(.65+.35*Math.sin(e*18+f.ph)),1);break;}
    case 'ws':{const q=1-(1-k)*(1-k),y=f.y-f.h*q,x=f.x+Math.sin(k*7+f.ph)*5*(1-k*.5),a=Math.min(1,k*7)*(k>.55?(1-k)/.45:1);
      glowAt(x,y+7,5*f.r,TH.soul,a*.3);glowAt(x,y+3.5,6.5*f.r,TH.soul,a*.45);glowAt(x,y,8*f.r,TH.soul,a*.95,1);break;}
    case 'bolt':for(let j=3;j>=0;j--){const q=k-j*.07;if(q<0)continue;const x=f.x+(f.tx-f.x)*q,y=f.y+(f.ty-f.y)*q-Math.sin(q*Math.PI)*f.arc;glowAt(x,y,j?3.6-j*.6:4.8,j?'#ff6a1a':'#ffb347',j?.5-j*.12:1,!j);}break;
    case 'fl':glowAt(f.x,f.y,f.r*(.7+.3*k),f.col,f.a*(1-k)*(1-k),1);break;
    case 'sr':{const q=1-(1-k)*(1-k),r=f.r0+(f.r1-f.r0)*q;ctx.globalAlpha=f.a*(1-k);ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(.6,f.w*(1-k));ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.72,0,0,7);ctx.stroke();break;}
    case 'portal':{const o=k<.25?k/.25:k>.75?(1-k)/.25:1,h=26*o,w=12*o,cy=f.y-h*.6;if(o<.02)break;
      glowEl(f.x,cy,w*2.6,h*1.5,'#a040ff',.7*o);glowEl(f.x,cy,w*1.2,h*.9,f.col,.8*o,1);ctx.globalAlpha=.9*o;ctx.strokeStyle='#ecc8ff';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(f.x,cy,w,h*.62,0,0,7);ctx.stroke();
      ctx.strokeStyle=f.col;ctx.lineWidth=1;for(let q=0;q<3;q++){const a0=e*6+q*2.09;ctx.beginPath();ctx.ellipse(f.x,cy,w*.6,h*.4,0,a0,a0+1.2);ctx.stroke();}break;}
    case 'beam':{const a=k<.15?k/.15:(1-k)/.85;ctx.globalAlpha=a*.8;ctx.drawImage(lightSpr(f.col,1),f.x-15,f.y-f.h,30,f.h*1.15);ctx.globalAlpha=a*.55;ctx.drawImage(lightSpr('#ffd27a',1),f.x-6,f.y-f.h*1.1,12,f.h*1.2);break;}
        case 'bub':{const r=1+k*4*f.r;ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle='#ffd27a';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.6,0,0,7);ctx.stroke();glowAt(f.x,f.y,3+k*4,EMB,(1-k)*.5);break;}
    case 'txt':{ctx.globalAlpha=k<.7?1:(1-k)/.3;ctx.font=F(700,Math.max(10,14*px));ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineWidth=Math.max(2.5,3.2*px);ctx.strokeStyle='rgba(14,8,10,.9)';
      const y=f.y-k*30;ctx.strokeText(f.txt,f.x,y);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,y);break;}
    }}
  ctx.globalAlpha=1;}

// ---------- rivers of lava (or black ice) ----------
const ICE=new WeakMap();
function barPath(p,ox=0,oy=0){ctx.beginPath();ctx.moveTo(p[0].x+ox,p[0].y+oy);for(let i=1;i<p.length-1;i++){const mx=(p[i].x+p[i+1].x)/2,my=(p[i].y+p[i+1].y)/2;ctx.quadraticCurveTo(p[i].x+ox,p[i].y+oy,mx+ox,my+oy);}ctx.lineTo(p[p.length-1].x+ox,p[p.length-1].y+oy);}
function iceGlints(b,i,now){let P=ICE.get(b);if(!P){P=[];const R=mkRng(i*7919+(G.terrainSeed|0)),p=b.pts;for(let j=0;j<p.length-1;j++)for(let q=0;q<6;q++){const u=R();P.push({x:p[j].x+(p[j+1].x-p[j].x)*u+(R()-.5)*36,y:p[j].y+(p[j+1].y-p[j].y)*u+(R()-.5)*26,ph:R()*6.28,sp:.5+R()*1.3});}ICE.set(b,P);}
  ctx.globalCompositeOperation='lighter';ctx.fillStyle='#e4f6ff';
  for(const g of P){const v=Math.sin(now/1000*g.sp+g.ph);if(v<.86)continue;const a=(v-.86)/.14,r=1.4+a*2.6;ctx.globalAlpha=a*.9;ctx.beginPath();
    ctx.moveTo(g.x-r,g.y);ctx.lineTo(g.x,g.y-r*.22);ctx.lineTo(g.x+r,g.y);ctx.lineTo(g.x,g.y+r*.22);ctx.closePath();ctx.moveTo(g.x,g.y-r);ctx.lineTo(g.x+r*.22,g.y);ctx.lineTo(g.x,g.y+r);ctx.lineTo(g.x-r*.22,g.y);ctx.closePath();ctx.fill();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
// base pass (night=0) shimmers and breathes; the night pass re-lights the lava after the blood-moon tint
function drawRivers(now,lava,night){ctx.lineJoin='round';ctx.lineCap='round';ctx.save();ctx.beginPath();ctx.rect(0,0,G.W,G.H);ctx.clip();
  for(let i=0;i<G.bars.length;i++){const b=G.bars[i],P=b.pts;if(b.k==='r'||!P||P.length<2)continue;
    if(b.k==='i'){if(!night)iceGlints(b,i,now);continue;}
    const wide=b.k==='s',W=wide?96:36,last=P[P.length-1],hz=Math.abs(last.x-P[0].x)>Math.abs(last.y-P[0].y);barPath(P);
    if(lava){if(!night)ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=1;ctx.strokeStyle=`rgba(255,96,24,${night?.26*night:.075+.04*Math.sin(now/900+i)})`;ctx.lineWidth=W*(night?1.15:1);ctx.stroke();
      ctx.strokeStyle=`rgba(255,170,60,${night?.16*night:.05+.03*Math.sin(now/600+i*2)})`;ctx.lineWidth=W*.45;ctx.stroke();
      ctx.setLineDash([12,26,5,38]);ctx.lineDashOffset=-now/55;ctx.strokeStyle=`rgba(255,214,120,${night?.3*night:.42})`;ctx.lineWidth=2.2;ctx.stroke();
      ctx.setLineDash([7,46]);ctx.lineDashOffset=-now/85+17;ctx.strokeStyle=`rgba(255,140,50,${night?.3*night:.38})`;ctx.lineWidth=1.5;ctx.stroke();
      if(wide)for(const o of[-30,30]){barPath(P,hz?0:o,hz?o:0);ctx.setLineDash([9,40,4,30]);ctx.lineDashOffset=-now/70+o;ctx.strokeStyle=`rgba(255,190,90,${night?.24*night:.3})`;ctx.lineWidth=1.8;ctx.stroke();}
      ctx.setLineDash([]);if(!night)ctx.globalCompositeOperation='source-over';}
    else if(!night){ctx.strokeStyle='rgba(220,240,255,.2)';ctx.lineWidth=2.2;ctx.setLineDash([14,22,6,30]);ctx.lineDashOffset=-now/60;ctx.stroke();ctx.strokeStyle='rgba(160,220,255,.15)';ctx.lineWidth=1.4;ctx.setLineDash([8,40]);ctx.lineDashOffset=-now/90+17;ctx.stroke();ctx.setLineDash([]);}}
  const op=ctx.globalCompositeOperation;ctx.restore();ctx.globalCompositeOperation=op;}

// ---------- rendering ----------
function resize(){const r=$('#stage').getBoundingClientRect();const dpr=Math.min(2.5,window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));VS.dpr=dpr;VS.w=r.width;VS.h=r.height;if(G){const t={x:CAM.tx,y:CAM.ty,z:CAM.tz};clampCam(t);CAM.tx=t.x;CAM.ty=t.y;applyCam();}}
window.addEventListener('resize',()=>{if($('#s-game').classList.contains('on'))resize();});
let fontName='';function F(w,sz){if(!fontName)fontName=getComputedStyle(document.body).fontFamily;return`${w} ${sz}px ${fontName}`;}
function rrect(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
// plaque badges: path icons, Souls-mode flame, lord crown
function pqPath(p,x,y,r,col){ctx.fillStyle='#1b1214';ctx.strokeStyle='rgba(255,226,190,.65)';ctx.lineWidth=r*.14;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();
  if(p===1){ctx.fillStyle=TH.soul;ctx.beginPath();ctx.moveTo(x,y-r*.7);ctx.bezierCurveTo(x+r*.18,y-r*.32,x+r*.5,y-r*.05,x+r*.42,y+r*.24);ctx.arc(x,y+r*.2,r*.42,.1,Math.PI-.1);ctx.bezierCurveTo(x-r*.5,y-r*.05,x-r*.18,y-r*.32,x,y-r*.7);ctx.fill();
    ctx.fillStyle='#f4fdff';ctx.beginPath();ctx.ellipse(x-r*.08,y+r*.2,r*.13,r*.2,0,0,7);ctx.fill();}
  else if(p===2){ctx.fillStyle='#5a4a60';ctx.fillRect(x-r*.26,y-r*.32,r*.52,r*.92);ctx.beginPath();ctx.moveTo(x-r*.38,y-r*.3);ctx.lineTo(x,y-r*.8);ctx.lineTo(x+r*.38,y-r*.3);ctx.closePath();ctx.fill();
    ctx.fillStyle=EYEC;ctx.beginPath();ctx.ellipse(x,y,r*.22,r*.13,0,0,7);ctx.fill();ctx.fillStyle='#1a0820';ctx.fillRect(x-r*.035,y-r*.12,r*.07,r*.24);}
  else{ctx.fillStyle='#a6a2ac';ctx.beginPath();ctx.moveTo(x-r*.62,y+r*.08);ctx.lineTo(x+r*.62,y+r*.08);ctx.lineTo(x+r*.3,y+r*.3);ctx.lineTo(x+r*.2,y+r*.3);ctx.lineTo(x+r*.28,y+r*.56);ctx.lineTo(x-r*.28,y+r*.56);ctx.lineTo(x-r*.2,y+r*.3);ctx.lineTo(x-r*.48,y+r*.24);ctx.closePath();ctx.fill();
    ctx.fillStyle=EMB;ctx.beginPath();ctx.moveTo(x,y-r*.72);ctx.quadraticCurveTo(x+r*.42,y-r*.25,x+r*.24,y);ctx.lineTo(x-r*.24,y);ctx.quadraticCurveTo(x-r*.42,y-r*.25,x,y-r*.72);ctx.fill();
    ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.moveTo(x,y-r*.38);ctx.quadraticCurveTo(x+r*.18,y-r*.12,x+r*.1,y);ctx.lineTo(x-r*.1,y);ctx.quadraticCurveTo(x-r*.18,y-r*.12,x,y-r*.38);ctx.fill();}}
function pqSouls(x,y,r,t){const ga=ctx.globalAlpha;const q=(t*1.6)%1;ctx.fillStyle='rgba(8,14,24,.85)';ctx.strokeStyle=TH.soul;ctx.lineWidth=r*.16;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#e8f8ff';ctx.lineWidth=r*.24;ctx.lineCap='round';ctx.lineJoin='round';for(let k=0;k<2;k++){const yy=y+r*(.42-k*.5)-q*r*.22;ctx.globalAlpha*=k?1:.75;ctx.beginPath();ctx.moveTo(x-r*.45,yy);ctx.lineTo(x,yy-r*.38);ctx.lineTo(x+r*.45,yy);ctx.stroke();}ctx.globalAlpha=ga;}
function pqCrown(x,y,r){ctx.fillStyle='#ffd34a';ctx.strokeStyle='#2a1608';ctx.lineWidth=r*.22;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-r,y+r*.45);ctx.lineTo(x-r,y-r*.4);ctx.lineTo(x-r*.5,y+r*.05);ctx.lineTo(x,y-r*.65);ctx.lineTo(x+r*.5,y+r*.05);ctx.lineTo(x+r,y-r*.4);ctx.lineTo(x+r,y+r*.45);ctx.closePath();ctx.stroke();ctx.fill();}
function plaque(px,py,txt,col,px1,opt={}){const h=Math.max(opt.small?6:8,(opt.small?13:17)*px1);ctx.font=F(700,h*.72);const tw=ctx.measureText(txt).width,sg=opt.sig?h*.9:0,w=tw+h*.7+sg,x0=px-w/2,r=h*.32;
  ctx.globalAlpha=opt.alpha??1;ctx.fillStyle='rgba(0,0,0,.42)';rrect(x0+h*.06,py+h*.12,w,h,r);ctx.fill();
  const g=ctx.createLinearGradient(0,py,0,py+h);g.addColorStop(0,rShade(col,.14));g.addColorStop(1,rShade(col,-.42));ctx.fillStyle=g;rrect(x0,py,w,h,r);ctx.fill();
  ctx.lineWidth=Math.max(1,h*.1);ctx.strokeStyle='rgba(16,8,8,.92)';ctx.stroke();ctx.lineWidth=Math.max(.5,h*.055);ctx.strokeStyle='rgba(255,226,190,.5)';rrect(x0+h*.1,py+h*.1,w-h*.2,h-h*.2,r*.7);ctx.stroke();
  if(sg)tSig(ctx,x0+h*.62,py+h*.5,h*.36,'#ffd86a');
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(txt,px+sg/2+h*.04,py+h*.6);ctx.fillStyle='#fff';ctx.fillText(txt,px+sg/2,py+h*.55);
  if(opt.path)pqPath(opt.path,x0+w+h*.24,py+h*.5,h*.46,col);
  if(opt.souls)pqSouls(x0+w+(opt.path?h*.3:h*.02),py-h*.3,h*.34,performance.now()/1000);
  if(opt.lord)pqCrown(px+sg/2,py-h*.14,h*.3);
  ctx.globalAlpha=1;return{w,h};}
function footR(c,ux,uy){const f=footOf(c);return f.rx*f.ry/Math.sqrt((f.ry*ux)**2+(f.rx*uy)**2);}
function eyeSig(x,y,r,t){const o=.55+.45*Math.min(1,Math.abs(Math.sin(t*.7))*3);ctx.beginPath();ctx.moveTo(x-r,y);ctx.quadraticCurveTo(x,y-r*o,x+r,y);ctx.quadraticCurveTo(x,y+r*o,x-r,y);ctx.closePath();
  ctx.fillStyle='rgba(22,6,26,.8)';ctx.fill();ctx.strokeStyle=EYEC;ctx.lineWidth=r*.12;ctx.stroke();ctx.fillStyle=EYEC;ctx.beginPath();ctx.arc(x,y,r*.4*Math.min(1,o*1.2),0,7);ctx.fill();ctx.fillStyle='#12040f';ctx.beginPath();ctx.ellipse(x,y,r*.09,r*.32*o,0,0,7);ctx.fill();}
function armedSpell(){if(armedAb<0||mySlot<0||!G)return -1;return spellOf(armedAb)?armedAb:-1;}
let lastT=performance.now(),ambT=0,aimS=null,curArm=-2;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-lastT)/1000);lastT=now;const t=now/1000;
  if(!G||!$('#s-game').classList.contains('on'))return;
  if(VS.w===0)resize();stepCam(dt);
  if(!terrain)terrain=buildTerrainArt(G,TH);
  if(!fogData||now-visT>200){visT=now;updateVision();}
  consumeEvents();
  const s=VS.s,px=1/s,myCol=mySlot>=0?COLORS[mySlot]:'#ffffff',nl=nightLevel(G.time),lava=G.theme!=='frost',C=G.castles,ai=armedSpell(),aS=spellOf(ai);
  if(curArm!==ai){curArm=ai;cv.style.cursor=ai>=0?'crosshair':'';}
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=lava?'#140d0b':'#0e121a';ctx.fillRect(0,0,cv.width,cv.height);
  useW();ctx.drawImage(terrain,0,0,G.W,G.H);
  const vx0=-VS.ox/s-120,vx1=(VS.w-VS.ox)/s+120,vy0=-VS.oy/s-140,vy1=(VS.h-VS.oy)/s+120,onScr=(x,y)=>x>vx0&&x<vx1&&y>vy0&&y<vy1;
  drawRivers(now,lava,0);
  // lava bubbles and sparks
  if(lava&&G.bars.length&&fx.length<380){ambT+=dt;while(ambT>.06){ambT-=.06;const b=G.bars[Math.floor(Math.random()*G.bars.length)];if(b.k!=='w'&&b.k!=='s')continue;const p=b.pts,j=Math.floor(Math.random()*(p.length-1)),u=Math.random(),sp=b.k==='s'?42:14;
    const x=p[j].x+(p[j+1].x-p[j].x)*u+(Math.random()-.5)*sp,y=p[j].y+(p[j+1].y-p[j].y)*u+(Math.random()-.5)*sp*.7;if(!onScr(x,y)||!visAt(x,y))continue;
    if(Math.random()<.55)fx.push({k:'bub',L:2,x,y,r:.6+Math.random()*.8,t:now,life:700+Math.random()*500});else fxEmbers(x,y,1,2,Math.random()<.5?'#ffb347':EMB,1500);}}
  else ambT=0;
  ctx.lineCap='round';ctx.lineJoin='round';
  drawFx(0,now,px);
  // routes
  C.forEach((c,i)=>{if(c.route<0||c.owner===NEUTRAL||!isVisibleC(i))return;const tc=C[c.route];if(!tc)return;
    const dx=tc.x-c.x,dy=tc.y-c.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,r0=footR(c,ux,uy),r1=footR(tc,ux,uy);if(L<r0+r1)return;
    ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=Math.max(6,4*px);ctx.beginPath();ctx.moveTo(c.x+ux*r0,c.y+uy*r0);ctx.lineTo(tc.x-ux*r1,tc.y-uy*r1);ctx.stroke();
    const wait=tc.owner!==NEUTRAL&&teamOf(G,tc.owner)===teamOf(G,c.owner)&&load(tc)>=capOf(tc)*0.95;ctx.strokeStyle=colOf(c.owner);ctx.globalAlpha=wait?0.45:1;ctx.lineWidth=Math.max(3.5,2.5*px);ctx.setLineDash(wait?[4,10]:[10,9]);ctx.lineDashOffset=wait?0:-(now/35)%19;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;});
  // hold-to-muster highlight
  if(pouring&&mySlot>=0){const c=C[pouring.from],tc=C[pouring.to];ctx.strokeStyle=myCol;ctx.globalAlpha=.45+.25*Math.sin(now/90);ctx.lineWidth=Math.max(10,6*px);
    ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(tc.x,tc.y);ctx.stroke();ctx.globalAlpha=1;}
  // ground rings: selection, targets, lock
  const ring=(c,pad,col,dash,fill)=>{const f=footOf(c);ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+pad,f.ry+pad*.75,0,0,7);if(fill){ctx.fillStyle=col;ctx.globalAlpha=.22;ctx.fill();ctx.globalAlpha=1;}
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(2.5,2*px);if(dash){ctx.setLineDash([6,6]);ctx.lineDashOffset=-now/50;}ctx.stroke();ctx.setLineDash([]);};
  if(sel>=0&&C[sel]){const c=C[sel];ring(c,6+Math.sin(now/200)*2,c.owner===mySlot?myCol:'#ffffff',false,true);
    if(c.owner===mySlot&&ai<0)for(const {to} of G.adj[sel])if(isVisibleC(to)||seen[to])ring(C[to],6,myCol,true,false);}
  if(pouring&&C[pouring.to]){const tc=C[pouring.to];ring(tc,8,myCol,!(gesture&&gesture.lock),gesture&&gesture.lock);}
  // soul light at springs and Souls-mode castles, with wisps drifting up
  ctx.globalCompositeOperation='lighter';
  C.forEach((c,i)=>{if(!onScr(c.x,c.y)||!isVisibleC(i))return;const alt=isSoulC(c);if(!alt&&c.kind!=='m')return;const f=footOf(c),p=.75+.25*Math.sin(t*2.1+i);
    glowEl(c.x,c.y+f.ry*.1,f.rx*1.6,f.ry*1.55,TH.soul,(alt?.3:.2)*p);if(Math.random()<dt*(alt?.9:.5)&&fx.length<360)fxWisps(c.x,c.y-f.ry*.3,1,f.rx*.35,.7);});
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  // gather castles and soldiers, interpolated (host) or extrapolated (client)
  const client=remoteView();const alpha=client?0:Math.min(1,(now-(G.lastStep||now))/50);const exT=client?Math.min(NET.mode==='replay'?0.6:0.25,(Date.now()-(G.csolT||Date.now()))/1000*(NET.mode==='replay'&&RP?(RP.playing?RP.speed:0):1)):0;
  const SL=solList();const D=[],EMQ=[],LBL=[],LRD=[];const lod=s*ART;const figs=lod*25*1.26>=7;const k=ART*1.45;
  const hiRes=s*ART*VS.dpr>1.45;
  C.forEach((c,i)=>{const st=isVisibleC(i)?c:seen[i];if(!st||!onScr(c.x,c.y))return;D.push({y:c.y,k:0,i,st});});
  const clusters=new Map(),addCl=(o,x,y)=>{const ck=o+':'+Math.floor(x/70)+':'+Math.floor(y/70);let cl=clusters.get(ck);if(!cl)clusters.set(ck,cl={o,n:0,x:0,y:0,top:1e9});cl.n++;cl.x+=x;cl.y+=y;if(y<cl.top)cl.top=y;};
  for(let i=0;i<SL.length;i++){const so=SL[i];let x,y;
    if(client){x=so.x+(so.st===0?so.hx*SPEED_S*G.sp*exT:0);y=so.y+(so.st===0?so.hy*SPEED_S*G.sp*exT:0);}else{x=so.px+(so.x-so.px)*alpha;y=so.py+(so.y-so.py)*alpha;}
    if(!solVisible(so.o,x,y))continue;addCl(so.o,x,y);if(!onScr(x,y))continue;const id=client?i:so.id,u=so.u|0,vr=client?(so.vr|0):(so.id&15);
    if(u===3)LRD.push({x,y,o:so.o});
    D.push({y,k:1,x,col:colOf(so.o),st:so.st,id,u,rk:so.rk|0,vr,dir:so.hx>=0?1:-1,hx:so.hx,hy:so.hy,hz:G.pl[so.o].hz>G.gt,lord:client?null:so.lord,bear:u<2&&(client?(vr&3)===3&&i%4===0:so.id%11===0)});}
  // lords' aura circles (yours and your team's)
  for(const l of LRD)if(isTeam(l.o)){ctx.globalAlpha=.2;ctx.strokeStyle=colOf(l.o);ctx.lineWidth=Math.max(1,1.2*px);ctx.setLineDash([2,10]);ctx.lineDashOffset=-t*8;ctx.beginPath();ctx.ellipse(l.x,l.y,85,85*.72,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  D.sort((a,b)=>a.y-b.y);
  for(const d of D){
    if(d.k===0){const c=C[d.i],st=d.st,col=colOf(st.owner),sp=spriteFor(st,col,hiRes);
      ctx.drawImage(sp.cn,c.x-sp.ox*ART,c.y-sp.oy*ART,sp.size*ART,sp.size*ART);
      if(lod>0.22&&st.owner!==NEUTRAL&&sp.flags)for(const fl of sp.flags){const fxp=c.x+(fl.x-sp.ox)*ART,fyp=c.y+(fl.y-sp.oy)*ART,fs=fl.s*ART;
        drawFlag(ctx,fxp,fyp,fs,col,t,st===c&&!c.sup&&c.capital<0);if(fl.cap)tSig(ctx,fxp+8.5*fs,fyp-13.5*fs,3.4*fs,'#fff');}
      // chimney smoke, brazier and forge sparks
      if(st===c&&sp.smoke&&sp.smoke.length&&lod>0.15&&fx.length<380&&now>=(SMK.get(d.i)||0)){const forge=c.path===3&&c.owner!==NEUTRAL,hov=c.owner===NEUTRAL;SMK.set(d.i,now+(forge?380:hov?900:1500)*(.7+Math.random()*.6));
        const sm=sp.smoke[Math.floor(Math.random()*sp.smoke.length)],sx=c.x+(sm.x-sp.ox)*ART,sy=c.y+(sm.y-sp.oy)*ART;fxSmoke(sx,sy,1,forge?1.2:.85,forge?'#2a2321':'#4a4440',2600,1);if(forge||Math.random()<.3)fxEmbers(sx,sy,forge?2:1,2,EMB,1100);}}
    else if(figs){const fighting=d.st===1||d.st===2;const ph=fighting?t*14+d.id*1.3:d.st===3?0:t*9+d.id*1.7;
      const lunge=fighting?Math.max(0,Math.sin(t*7+d.id))*2.2:0,ux=d.x+d.hx*lunge,uy=d.y+d.hy*lunge;
      drawUnit(ctx,ux,uy,k,d.col,ph,d.dir,d.u,d.bear,fighting,d.vr);
      const top=uy-UHT[d.u]*k;
      if(d.rk){ctx.strokeStyle='#ffc94a';ctx.lineWidth=Math.max(0.9,1.2*k);for(let q=0;q<d.rk;q++){const yy=top-2-q*2.6*k*1.6;ctx.beginPath();ctx.moveTo(d.x-3*k*1.6,yy);ctx.lineTo(d.x,yy-2*k*1.6);ctx.lineTo(d.x+3*k*1.6,yy);ctx.stroke();}}
      if(d.hz)EMQ.push({x:ux,y:uy-11*k,r:12,col:'#ff2a14',a:.3+.08*Math.sin(t*9+d.id)});
      if(d.u===3){EMQ.push({x:ux,y:uy-26*k,r:30,col:d.col,a:.34+.1*Math.sin(t*3+d.id)},{x:ux,y:uy-20*k,r:15,col:'#ff9a3a',a:.3,hot:1});const nm=lordName(d.lord);if(nm)LBL.push({x:ux,y:top-(d.rk?d.rk*4+6:4),nm});}}
    else{const r=Math.max(1.6,2.2*px);
      if(d.u===3){const R=r*2.3,cy=d.y-R-r*.5,cw=R*.85;ctx.fillStyle='rgba(10,6,6,.75)';ctx.beginPath();ctx.arc(d.x,d.y,R+r*.55,0,7);ctx.fill();ctx.fillStyle=d.col;ctx.beginPath();ctx.arc(d.x,d.y,R,0,7);ctx.fill();ctx.lineWidth=r*.5;ctx.strokeStyle='#ffd86a';ctx.stroke();
        ctx.fillStyle='#ffd86a';ctx.beginPath();ctx.moveTo(d.x-cw,cy+r*.8);ctx.lineTo(d.x-cw,cy-r*.5);ctx.lineTo(d.x-cw*.45,cy+r*.15);ctx.lineTo(d.x,cy-r);ctx.lineTo(d.x+cw*.45,cy+r*.15);ctx.lineTo(d.x+cw,cy-r*.5);ctx.lineTo(d.x+cw,cy+r*.8);ctx.closePath();ctx.fill();
        EMQ.push({x:d.x,y:d.y,r:R*3.4,col:d.col,a:.5+.2*Math.sin(t*4)});}
      else{ctx.fillStyle=d.col;ctx.beginPath();ctx.arc(d.x,d.y,r*(d.u===0?.85:d.u===2?1.35:1),0,7);ctx.fill();}
      if(d.hz)EMQ.push({x:d.x,y:d.y,r:r*3.4,col:'#ff2a14',a:.3});}}
  // castles in trouble: smoke over weak or besieged castles, fire on the towers during an assault
  C.forEach((c,i)=>{if(!isVisibleC(i)||c.kind==='m'||!onScr(c.x,c.y))return;const low=c.owner!==NEUTRAL&&load(c)<capOf(c)*0.2;if(!c.assault&&!low)return;const f=footOf(c);
    if(Math.random()<dt*(c.assault?3:1.2)&&fxOk(200))fxSmoke(c.x+(Math.random()-.5)*f.rx*1.2,c.y-f.ry*0.6,1,c.assault?1.4:1,'#3a322e',2800,2);
    if(c.assault&&lod>0.18){const sp=spriteFor(c,colOf(c.owner)),fl=(sp.flags||[]).slice(0,3);for(let q=0;q<fl.length;q++){const fxp=c.x+(fl[q].x-sp.ox)*ART,fyp=c.y+(fl[q].y-sp.oy)*ART+12*ART*fl[q].s;const fl1=Math.sin(now/90+q*2)*1.2;
      ctx.fillStyle='rgba(240,110,30,.88)';ctx.beginPath();ctx.moveTo(fxp-3,fyp);ctx.quadraticCurveTo(fxp-2,fyp-5,fxp+fl1*.5,fyp-8-fl1);ctx.quadraticCurveTo(fxp+2,fyp-5,fxp+3,fyp);ctx.fill();
      ctx.fillStyle='rgba(255,215,90,.92)';ctx.beginPath();ctx.moveTo(fxp-1.5,fyp);ctx.quadraticCurveTo(fxp,fyp-4,fxp+fl1*.3,fyp-5);ctx.quadraticCurveTo(fxp+1,fyp-3,fxp+1.5,fyp);ctx.fill();EMQ.push({x:fxp,y:fyp-4,r:10,col:EMB,a:.5});}}
    if(low&&!c.assault&&lod>0.18){ctx.strokeStyle='rgba(20,14,12,.6)';ctx.lineWidth=Math.max(.8,.7*px);const R=mkRng(i*977);for(let q=0;q<3;q++){const x0=c.x+(R()-.5)*f.rx*1.4,y0=c.y+(R()-.2)*f.ry*.6;ctx.beginPath();ctx.moveTo(x0,y0-6);ctx.lineTo(x0+2,y0-3);ctx.lineTo(x0-1,y0);ctx.lineTo(x0+1.5,y0+3);ctx.stroke();}}});
  // castles under assault: pulsing ring and fire bolts from the walls
  C.forEach((c,i)=>{if(!c.assault||!isVisibleC(i))return;const f=footOf(c);
    ctx.strokeStyle='rgba(235,50,40,'+(0.45+0.3*Math.sin(now/150))+')';ctx.lineWidth=Math.max(2.5,2*px);ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+16,f.ry+12,0,0,7);ctx.stroke();
    if(Math.random()<dt*Math.min(10,Math.max(1,c.size*0.25))&&fxOk(80)){let tx=null;for(let tries=0;tries<6&&!tx;tries++){const so=SL[Math.floor(Math.random()*SL.length)];if(so&&so.o!==c.owner&&Math.hypot(so.x-c.x,so.y-c.y)<f.rx+40)tx=so;}
      if(tx)fx.push({k:'bolt',L:2,x:c.x+(Math.random()-.5)*f.rx,y:c.y-f.ry-6,tx:tx.x,ty:tx.y-4,arc:12,t:now,life:380});}});
  // Hellgates rising beside Thrones
  for(let s2=0;s2<8;s2++){const p=G.pl[s2];if(p.out||!(p.ws>0||p.wb>=0))continue;const ci=G.capIdx[s2];if(ci===undefined)continue;const c=C[ci];if(c.owner!==s2||!isVisibleC(ci)||!onScr(c.x,c.y))continue;
    const f=footOf(c),gx=c.x-f.rx-16,done=p.ws>=WONDER_STAGES;drawWonder(ctx,gx,c.y-4,p.ws,p.wb>=0?p.wb/WONDER_T:0,colOf(s2),now,done);
    EMQ.push({x:gx,y:c.y-14-p.ws*6,r:16+p.ws*5+(done?14:0),col:'#ff3a5a',a:(.16+.05*p.ws)*(done?1.4+.3*Math.sin(t*3):1)});if(done&&Math.random()<dt*3&&fxOk(200))fxEmbers(gx,c.y-30,1,8,'#ff5a7a',1400);}
  ctx.globalAlpha=1;
  drawFx(1,now,px);
  // blood-moon night: a red-violet multiply over the world, then lava, windows and soul light come up again (all under the fog)
  if(nl>0.01){useS();ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgb(${255-105*nl|0},${255-163*nl|0},${255-137*nl|0})`;ctx.fillRect(0,0,VS.w,VS.h);useW();ctx.globalCompositeOperation='lighter';
    if(lava)drawRivers(now,lava,nl);
    C.forEach((c,i)=>{if(!onScr(c.x,c.y)||!isVisibleC(i))return;const f=footOf(c),fl=.88+.12*Math.sin(t*7.3+i*1.7)*Math.sin(t*3.1+i);
      if(c.owner!==NEUTRAL||c.kind==='v')glowEl(c.x,c.y-f.ry*.55,f.rx*1.5,f.ry*1.8,'#ff8a34',(c.owner!==NEUTRAL?.46:.3)*nl*fl);else if(c.kind==='f')glowEl(c.x,c.y-f.ry*.6,f.rx*1.1,f.ry*1.2,'#ff2a2a',.18*nl*fl);
      if(c.kind==='m'||isSoulC(c))glowEl(c.x,c.y+f.ry*.1,f.rx*1.15,f.ry*.95,TH.soul,.26*nl*(.75+.25*Math.sin(t*2.1+i)));});
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
  // fog
  if(!allSeeing()){ctx.imageSmoothingEnabled=true;ctx.drawImage(fogCv,0,0,FW*CELL,FH*CELL);}
  // light pass: unit glows, embers, souls, spell fire (only ever spawned where you can see)
  ctx.globalCompositeOperation='lighter';
  for(const g of EMQ)glowAt(g.x,g.y,g.r,g.col,g.a,g.hot);
  drawFx(2,now,px);
  // pending Hellfire: red glow on the ground and meteors falling in
  for(const f of G.fires){const left=f.at-G.gt;if(left<-0.05||!(visAt(f.x,f.y)||isTeam(f.s)))continue;const R=f.r||45,q=Math.max(0,Math.min(1,1-left/1.6));
    glowEl(f.x,f.y,R*1.25,R*.95,'#ff3a14',.12+.3*q);
    if(left<0.8)for(let m=0;m<9;m++){const a=m*2.39+f.x,rr=R*((m*37%10)/10),tx=f.x+Math.cos(a)*rr,ty=f.y+Math.sin(a)*rr*.75,k2=Math.max(0,left-m*.02)/.8,sx=tx+70*k2,sy=ty-210*k2;
      for(let j=4;j>=0;j--){const u=j/4;glowAt(sx+u*22,sy-u*66,(5.5-j)*1.2,j?'#ff6a1a':'#ffd27a',(1-u)*.85,!j);}}}
  for(const o of G.scouts)if(isTeam(o.s)||allSeeing())glowAt(o.x,o.y,40,EYEC,.25+.08*Math.sin(t*2));
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  // Spies: the revealed circle and its eye
  for(const o of G.scouts)if(isTeam(o.s)||allSeeing()){ctx.strokeStyle=colOf(o.s);ctx.globalAlpha=.8;ctx.lineWidth=Math.max(2,1.5*px);ctx.setLineDash([4,10]);ctx.lineDashOffset=now/60;ctx.beginPath();ctx.arc(o.x,o.y,o.r||200,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;eyeSig(o.x,o.y,Math.max(9,11*px),t);}
  // lords' names (under the plaques, which matter more)
  if(LBL.length){ctx.font=F(700,Math.max(8,10.5*px));ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
    for(const l of LBL){ctx.lineWidth=Math.max(2,2.8*px);ctx.strokeStyle='rgba(12,6,8,.9)';ctx.strokeText(l.nm,l.x,l.y);ctx.fillStyle='#ffe2a0';ctx.fillText(l.nm,l.x,l.y);}}
  // build progress and castle plaques
  C.forEach((c,i)=>{const v=isVisibleC(i),st=v?c:seen[i];if(!st||!onScr(c.x,c.y))return;
    if(v&&c.build){const f=footOf(c);const pr=c.build.dur>1?c.build.t/c.build.dur:c.build.t;ctx.strokeStyle='#ffb84a';ctx.lineWidth=Math.max(3,2.5*px);ctx.setLineDash([5,4]);ctx.lineDashOffset=-now/60;
      ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+10,f.ry+8,0,-Math.PI/2,-Math.PI/2+2*Math.PI*Math.min(1,pr));ctx.stroke();ctx.setLineDash([]);}
    const sp=spriteFor(st,colOf(st.owner));
    plaque(c.x,c.y+sp.plaque*ART,String(Math.max(0,Math.floor(st.size))),colOf(st.owner),px,{sig:st.capital>=0,path:st.owner!==NEUTRAL?(st.path|0):0,souls:v&&isSoulC(c),lord:!!(st.lords&&st.lords.length),alpha:v?1:.72});});
  // soldier group counts
  const CL=[...clusters.values()];for(const a of CL){a.cx=a.x/a.n;a.cy=a.y/a.n;}
  for(let i=0;i<CL.length;i++){const a=CL[i];if(!a.n)continue;for(let j=i+1;j<CL.length;j++){const b=CL[j];if(!b.n||b.o!==a.o)continue;
    if(Math.hypot(a.cx-b.cx,a.cy-b.cy)<60){const n=a.n+b.n;a.cx=(a.cx*a.n+b.cx*b.n)/n;a.cy=(a.cy*a.n+b.cy*b.n)/n;a.top=Math.min(a.top,b.top);a.n=n;b.n=0;}}}
  for(const cl of CL){if(cl.n<2||!onScr(cl.cx,cl.cy))continue;plaque(cl.cx,cl.top-(figs?30*ART*1.45:8),String(cl.n),colOf(cl.o),px,{small:true,alpha:.92});}
  drawFx(3,now,px);
  // chevrons beside my castles
  if(mySlot>=0&&!G.over&&!G.pl[mySlot].out&&ai<0){const pulse=(Math.sin(now/260)+1)*2;ctx.lineJoin='round';
    C.forEach((c,i)=>{if(c.owner!==mySlot)return;const on=sel===i||(pouring&&pouring.from===i);
      for(const {to} of G.adj[i]){if(c.route===to)continue;const tc=C[to];const dx=tc.x-c.x,dy=tc.y-c.y,L=Math.hypot(dx,dy);const ux=dx/L,uy=dy/L;
        const off=footR(c,ux,uy)+Math.max(8,8*px)+pulse;if(off>L*0.45)continue;const hx=c.x+ux*off,hy=c.y+uy*off,k=Math.max(4.5,5*px);
        ctx.beginPath();ctx.moveTo(hx-ux*k-uy*k,hy-uy*k+ux*k);ctx.lineTo(hx,hy);ctx.lineTo(hx-ux*k+uy*k,hy-uy*k-ux*k);
        ctx.globalAlpha=on?1:.7;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=Math.max(4.5,4.5*px);ctx.stroke();ctx.strokeStyle=myCol;ctx.lineWidth=Math.max(2.5,2.6*px);ctx.stroke();}});ctx.globalAlpha=1;}
  // pings
  pings=pings.filter(p=>now-p.t<7000);
  for(const p of pings){const c=C[p.c];if(!c)continue;const f=footOf(c),k=((now-p.t)%1000)/1000,col=p.type?'#4aa3ff':'#ff4b4b';
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(3,2.5*px);ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+12+k*30,(f.ry+10+k*30)*.75,0,0,7);ctx.stroke();ctx.globalAlpha=1;
    const bx=c.x,by=c.y-f.ry-40*Math.max(px,.5),br=Math.max(8,10*px);ctx.fillStyle=col;ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1.5,2*px);ctx.beginPath();ctx.arc(bx,by,br,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font=F(700,br*1.3);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.type?'+':'!',bx,by+1);}
  // pending Hellfire: warning circle with a turning rune ring
  for(const f of G.fires){const left=f.at-G.gt;if(left<-0.05||!(visAt(f.x,f.y)||isTeam(f.s)))continue;const R=f.r||45;
    ctx.strokeStyle='rgba(255,70,36,'+(0.55+0.35*Math.sin(now/90))+')';ctx.lineWidth=Math.max(2.5,2*px);ctx.setLineDash([7,6]);ctx.lineDashOffset=now/40;ctx.beginPath();ctx.arc(f.x,f.y,R,0,7);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,60,30,.10)';ctx.fill();ctx.strokeStyle='rgba(255,170,80,.5)';ctx.lineWidth=Math.max(1,px);ctx.beginPath();for(let q=0;q<12;q++){const a=q*Math.PI/6+t*.8;ctx.moveTo(f.x+Math.cos(a)*R*.72,f.y+Math.sin(a)*R*.72);ctx.lineTo(f.x+Math.cos(a)*R*.84,f.y+Math.sin(a)*R*.84);}ctx.stroke();}
  // armed spell: targeting circle
  if(ai>=0&&canAct()){const col=SPC[ai]||'#ffffff';
    {const w=aimS?toWorld(aimS):{x:CAM.x,y:CAM.y},R=typeof spellR==='function'?spellR(G,mySlot,ai):45,on=aimS?1:.55;
      ctx.fillStyle=col;ctx.globalAlpha=.13*on;ctx.beginPath();ctx.arc(w.x,w.y,R,0,7);ctx.fill();ctx.globalAlpha=.95*on;ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.5,2*px);ctx.setLineDash([8,6]);ctx.lineDashOffset=-now/40;ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.45*on;ctx.lineWidth=Math.max(1,px);ctx.beginPath();ctx.arc(w.x,w.y,R*.8,0,7);for(let q=0;q<4;q++){const a=q*Math.PI/2+t;ctx.moveTo(w.x+Math.cos(a)*R*.12,w.y+Math.sin(a)*R*.12);ctx.lineTo(w.x+Math.cos(a)*R*.3,w.y+Math.sin(a)*R*.3);}ctx.stroke();
      ctx.globalAlpha=on;ctx.font=F(700,Math.max(10,12*px));ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineWidth=Math.max(2.5,3*px);ctx.strokeStyle='rgba(12,6,8,.9)';ctx.strokeText(aS.name,w.x,w.y-R-6*px);ctx.fillStyle=col;ctx.fillText(aS.name,w.x,w.y-R-6*px);ctx.globalAlpha=1;}}
  // attack alerts: arrows at the screen edge pointing to your castles in trouble
  ALERT_IND=[];if(mySlot>=0&&!G.over){useS();
    C.forEach((c,i)=>{if(c.owner!==mySlot)return;const a=alerts[i];if(!a||now-a.t>8000)return;const sx=c.x*s+VS.ox,sy=c.y*s+VS.oy;if(sx>20&&sx<VS.w-20&&sy>20&&sy<VS.h-20)return;
      const cx=VS.w/2,cy=VS.h/2,dx=sx-cx,dy=sy-cy;const k=Math.min((VS.w/2-26)/Math.abs(dx||1e-6),(VS.h/2-26)/Math.abs(dy||1e-6));const ax=cx+dx*k,ay=cy+dy*k,ang=Math.atan2(dy,dx);
      const pul=0.6+0.4*Math.sin(now/150);ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);ctx.fillStyle='rgba(225,40,32,'+pul+')';ctx.strokeStyle='#ffe2c0';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ALERT_IND.push({x:ax,y:ay,c:i});});}
  // vignette: smoky edges, blood-red at night
  useS();{const vg=ctx.createRadialGradient(VS.w/2,VS.h*.48,Math.min(VS.w,VS.h)*.34,VS.w/2,VS.h/2,Math.hypot(VS.w,VS.h)*.56);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,`rgba(${12+46*nl|0},${5-3*nl|0},${6+8*nl|0},${.5+.12*nl})`);ctx.fillStyle=vg;ctx.fillRect(0,0,VS.w,VS.h);}
  drawWeather(dt,now);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  hud(now);
}
let lastHud=0,ALERT_IND=[],bannerKey='';const alerts={},prevAssault={};
function checkAlerts(now){if(!G||mySlot<0||G.over||G.pl[mySlot].out)return;const SL=solList();
  G.castles.forEach((c,i)=>{if(c.owner!==mySlot){prevAssault[i]=0;return;}
    if(c.assault>0&&!prevAssault[i]&&(!alerts[i]||now-alerts[i].t>8000)){alerts[i]={t:now,k:'a'};toast(G.names[i]+' is under attack!',2600);}
    else if(!c.assault&&(!alerts[i]||now-alerts[i].t>20000)){let n=0;for(const x of SL){if(x.o===mySlot||isTeam(x.o)||x.st===2)continue;if((x.x-c.x)**2+(x.y-c.y)**2<160*160)n++;}
      if(n>=6){alerts[i]={t:now,k:'n'};toast('A horde is closing on '+G.names[i]+' ('+n+')',2600);}}
    prevAssault[i]=c.assault>0?1:0;});}
setInterval(()=>{if(G&&$('#s-game').classList.contains('on'))checkAlerts(performance.now());},400);
function wonderBanner(){const el=$('#wbanner');if(!el)return;if(!G){el.hidden=true;bannerKey='';return;}const parts=[],clk=t=>{t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out||!(p.ws>0||p.wb>=0))continue;const who=s===mySlot?'Your':ownerName(s)+'’s';
    parts.push({s,t:p.ws>=WONDER_STAGES?who+' Hellgate is open: '+clk((WONDER_HOLD-p.wh)/G.sp)+' to victory':who+' Hellgate: stage '+Math.min(WONDER_STAGES,p.ws+(p.wb>=0?1:0))+'/'+WONDER_STAGES});}
  const key=parts.map(q=>q.s+q.t).join('|');if(key===bannerKey)return;bannerKey=key;
  if(!parts.length){el.hidden=true;return;}el.hidden=false;el.innerHTML='';for(const q of parts){const d=document.createElement('div');d.textContent=q.t;d.style.borderLeftColor=COLORS[q.s];el.appendChild(d);}}
function myTroops(s){return Math.round(G.tot[s]||0);}
function setTxt(id,v){const el=document.getElementById(id);if(el&&el.textContent!==v)el.textContent=v;}
function hud(now){
  if(now-lastHud<300)return;lastHud=now;
  const pw=new Array(8).fill(0);for(let s=0;s<8;s++)pw[s]=G.pl[s].out?0:myTroops(s);
  const el=$('#power');if(el){if(el.children.length!==8){el.innerHTML='';for(let i=0;i<8;i++){const b=document.createElement('i');b.style.background=COLORS[i];el.appendChild(b);}}
    for(let i=0;i<8;i++)el.children[i].style.flexGrow=pw[i];}
  wonderBanner();const tm=Math.floor(G.time);setTxt('dn',nightLevel(G.time)>0.5?'☾':'☀');setTxt('clock',Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'));
  if(mySlot>=0){const p=G.pl[mySlot];setTxt('souls',String(Math.floor(p.souls||0)));setTxt('inc','+'+((+p.inc||0)*G.sp).toFixed(1));
    setTxt('troops',String(Math.floor(pw[mySlot])));setTxt('tcap','/'+armyCap(G,mySlot));setTxt('castles',String(G.castles.filter(c=>c.owner===mySlot).length));}
  else{setTxt('souls','–');setTxt('inc','');setTxt('troops','–');setTxt('tcap','');setTxt('castles','–');}
}
requestAnimationFrame(frame);

// ---------- weather (screen space) ----------
let WX=[];
function initWeather(){WX=[];if(!G)return;const w=G.weather,th=G.theme,add=(k,n)=>{for(let i=0;i<n;i++)WX.push({k,x:Math.random(),y:Math.random(),s:.5+Math.random(),ph:Math.random()*6.28});};
  if(w==='embers')add('e',44);else if(w==='ash')add('a',56);else if(w==='wind')add('d',34);else if(w==='snow')add('s',52);else if(w==='rain')add('r',55);
  if(th==='ash'&&w!=='embers')add('e',14);else if(th==='sulfur')add('m',16);else if(th==='frost')add('b',10);}
function drawWeather(dt,now){if(!WX.length)return;const W=VS.w,H=VS.h,t=now/1000,dp=VS.dpr;useS();
  for(const p of WX){
    if(p.k==='a'){p.y+=dt*(.022+.026*p.s);p.x+=dt*(.008+.01*p.s)+Math.sin(t*1.3+p.ph)*dt*.012;}
    else if(p.k==='s'){p.y+=dt*.06*p.s;p.x+=Math.sin(t*1.1+p.ph)*dt*.02;}
    else if(p.k==='d'){p.x+=dt*(.2+.16*p.s);p.y+=Math.sin(t*1.7+p.ph)*dt*.02;}
    else if(p.k==='e'){p.y-=dt*(.03+.045*p.s);p.x+=Math.sin(t*1.1+p.ph)*dt*.018+dt*.004;}
    else if(p.k==='m'){p.x+=dt*(.012+.01*p.s);p.y+=Math.sin(t*.7+p.ph)*dt*.01;}
    else if(p.k==='b'){p.y-=dt*.012*p.s;p.x+=Math.sin(t*.6+p.ph)*dt*.008;}
    else{p.y+=dt*(.9+p.s*.6);p.x+=dt*.18;}
    if(p.y>1.03){p.y-=1.06;p.x=Math.random();}else if(p.y<-.03){p.y+=1.06;p.x=Math.random();}if(p.x>1.03){p.x-=1.06;p.y=Math.random();}else if(p.x<-.03)p.x+=1.06;}
  for(const p of WX){const x=p.x*W,y=p.y*H;
    if(p.k==='a'){const a=t*(.8+p.s)+p.ph,co=Math.cos(a)*dp,si=Math.sin(a)*dp;ctx.setTransform(co,si,-si,co,x*dp,y*dp);ctx.globalAlpha=.45+.25*p.s;ctx.fillStyle=p.s>1.3?'#4e4643':'#9a908a';ctx.fillRect(-1.6*p.s,-.7*p.s,3.2*p.s,1.4*p.s);}
    else if(p.k==='s'){ctx.globalAlpha=.8;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,1+p.s*1.3,0,7);ctx.fill();}
    else if(p.k==='d'){ctx.globalAlpha=.16+.12*p.s;ctx.fillStyle='#d9ae5a';ctx.beginPath();ctx.ellipse(x,y,5+9*p.s,.9+.4*p.s,.08,0,7);ctx.fill();}
    else if(p.k==='r'){ctx.globalAlpha=.4;ctx.strokeStyle='#bed2e6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3*p.s,y-11*p.s);ctx.stroke();}}
  useS();ctx.globalCompositeOperation='lighter';
  for(const p of WX){const x=p.x*W,y=p.y*H;
    if(p.k==='e'){const a=(.45+.35*Math.sin(t*(6+4*p.s)+p.ph*3))*(.6+.4*p.s);glowAt(x,y,2.6+3*p.s,'#ff6a14',a*.8);glowAt(x,y,1.1+.8*p.s,'#ffcf7a',a,1);}
    else if(p.k==='a'&&p.s>1.42)glowAt(x,y,2.4,EMB,.45+.3*Math.sin(t*7+p.ph),1);
    else if(p.k==='m')glowAt(x,y,1.6+1.4*p.s,'#ffd25a',.25+.15*Math.sin(t*2+p.ph));
    else if(p.k==='b')glowAt(x,y,2+2*p.s,TH.soul,.3+.2*Math.sin(t*1.5+p.ph),1);}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}

// ---------- stats ----------
function recordStats(dt){if(!stats||!G)return;stats.t+=dt;for(let s=0;s<8;s++){const v=G.pl[s].out?0:myTroops(s);if(v>stats.peak[s])stats.peak[s]=v;}
  if(stats.t>=5||!stats.hist.length){stats.t=0;const act=(sl,i)=>(sl.k==='h'||sl.k==='b');
    stats.hist.push(G.slots.map((sl,i)=>act(sl,i)&&!G.pl[i].out?Math.round(myTroops(i)):0));
    (stats.cas||(stats.cas=[])).push(G.slots.map((sl,i)=>act(sl,i)?G.castles.filter(c=>c.owner===i).length:0));
    (stats.gold||(stats.gold=[])).push(G.slots.map((sl,i)=>act(sl,i)?Math.round(G.pl[i].earned||0):0));
    (stats.kills||(stats.kills=[])).push(G.slots.map((sl,i)=>act(sl,i)?(G.pl[i].kills|0):0));}}
let statMetric='hist';
function drawStats(){
  const c=$('#chart');if(!c||!stats)return;const x=c.getContext('2d'),W=c.width,H=c.height,h=stats[statMetric]||stats.hist;
  document.querySelectorAll('#ov-card [data-m]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.m===statMetric));b.onclick=()=>{statMetric=b.dataset.m;drawStats();};});
  x.clearRect(0,0,W,H);const act=G.slots.map((s,i)=>(s.k==='h'||s.k==='b')?i:-1).filter(i=>i>=0);
  const max=Math.max(statMetric==='cas'?4:10,...h.flat());x.strokeStyle='rgba(128,128,128,.25)';x.lineWidth=1;for(let g=1;g<4;g++){x.beginPath();x.moveTo(0,H*g/4);x.lineTo(W,H*g/4);x.stroke();}
  for(const s of act){x.strokeStyle=COLORS[s];x.lineWidth=s===mySlot?5:3;x.lineJoin='round';x.beginPath();
    h.forEach((row,k)=>{const px=h.length>1?k/(h.length-1)*(W-20)+10:W/2,py=H-10-(row[s]/max)*(H-20);k?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();}
  const tk=[],earned=G.pl.map(p=>p.earned||0);act.forEach(s=>tk[s]=G.pl[s].taken||stats.taken[s]||0);
  const best=arr=>act.reduce((b,i)=>(arr[i]||0)>(arr[b]||0)?i:b,act[0]);
  const lines=[['Conqueror',best(tk),tk[best(tk)]+' castles taken'],['Warlord',best(stats.peak),Math.round(stats.peak[best(stats.peak)])+' troops at peak'],['Soul-reaper',best(earned),Math.round(earned[best(earned)])+' souls earned']];
  const hl=$('#hl');if(!hl)return;hl.innerHTML='';for(const [tt,s,v] of lines){const d=document.createElement('div');const b=document.createElement('b');b.textContent=tt+': ';const n=document.createElement('span');n.textContent=ownerName(s)+', '+v;d.append(b,n);d.style.borderLeft='4px solid '+COLORS[s];d.style.paddingLeft='8px';hl.appendChild(d);}
}

// ---------- input: tap, hold-to-muster, pan, pinch, wheel, spell targeting ----------
function local(e){const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function toWorld(p){return{x:(p.x-VS.ox)/VS.s,y:(p.y-VS.oy)/VS.s};}
function hitCastle(w,extra=12){let best=-1,bd=1e9;G.castles.forEach((c,i)=>{if(!isVisibleC(i)&&!seen[i])return;const f=footOf(c);const dx=(w.x-c.x)/(f.rx+extra/VS.s),dy=(w.y-c.y+f.ry*.3)/(f.ry*1.5+extra/VS.s);const d=dx*dx+dy*dy;if(d<1&&d<bd){bd=d;best=i;}});return best;}
function hitRoad(w){let best=null,bd=(24/VS.s)**2;if(mySlot<0)return null;
  for(const e of G.edges){const a=G.castles[e.a],b=G.castles[e.b];const d=segDist2(w.x,w.y,a.x,a.y,b.x,b.y);
    if(d<bd){const ma=a.owner===mySlot,mb=b.owner===mySlot;if(!ma&&!mb)continue;const da=Math.hypot(w.x-a.x,w.y-a.y),db=Math.hypot(w.x-b.x,w.y-b.y);
      let from;if(ma&&mb)from=da<db?e.a:e.b;else from=ma?e.a:e.b;bd=d;best={from,to:from===e.a?e.b:e.a};}}
  return best;}
const PT=new Map();let pinch=null,pourTimer=0;
function canAct(){return G&&!G.over&&mySlot>=0&&!G.pl[mySlot].out;}
function castAt(w,ci){const id=armedSpell(),S=spellOf(id);if(!S||S.kind!=='point'){armedAb=-1;updateBar();return;}
  issue(6,armedAb,Math.round(Math.max(0,Math.min(G.W,w.x))),Math.round(Math.max(0,Math.min(G.H,w.y))));toast(id===2?'Hellfire is falling.':'Your spies slip out.',1600);armedAb=-1;updateBar();}
cv.addEventListener('pointerdown',e=>{
  if(!G)return;const p=local(e);aimS=p;PT.set(e.pointerId,p);try{cv.setPointerCapture(e.pointerId)}catch(_){}
  if(PT.size===2){const [a,b]=[...PT.values()];pourStop();clearTimeout(pourTimer);gesture={mode:'none'};
    pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:CAM.z,w:toWorld({x:(a.x+b.x)/2,y:(a.y+b.y)/2})};return;}
  if(PT.size>2)return;
  for(const a of ALERT_IND)if(Math.hypot(a.x-p.x,a.y-p.y)<34){const c=G.castles[a.c];setCam(c.x,c.y,Math.max(CAM.z,2.4));gesture={mode:'none'};return;}
  const w=toWorld(p);gesture={mode:'pan',start:p,last:p,moved:false,w};
  if(armedAb>=0||!canAct())return;
  const ci=hitCastle(w);
  if(ci>=0&&G.castles[ci].owner===mySlot){gesture.mode='castle';gesture.ci=ci;return;}
  if(ci<0){const r=hitRoad(w);if(r){gesture.mode='road';gesture.road=r;pourTimer=setTimeout(()=>{if(gesture&&gesture.mode==='road'){gesture.mode='pour';pourStart(r.from,r.to);}},170);}}
});
cv.addEventListener('pointermove',e=>{
  if(!G)return;const p=local(e);if(e.pointerType==='mouse'||PT.has(e.pointerId))aimS=p;if(!PT.has(e.pointerId))return;PT.set(e.pointerId,p);
  if(pinch&&PT.size>=2){const [a,b]=[...PT.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    const z=Math.max(1,Math.min(6,pinch.z0*d/pinch.d0)),s=baseScale()*z;const tt={x:pinch.w.x-(m.x-VS.w/2)/s,y:pinch.w.y-(m.y-VS.h/2)/s,z};clampCam(tt);
    CAM.x=CAM.tx=tt.x;CAM.y=CAM.ty=tt.y;CAM.z=CAM.tz=z;applyCam();return;}
  const g=gesture;if(!g)return;const w=toWorld(p);
  if(!g.moved&&Math.hypot(p.x-g.start.x,p.y-g.start.y)>10)g.moved=true;
  if(g.mode==='castle'&&g.moved){const c=G.castles[g.ci];const dx=w.x-c.x,dy=w.y-c.y,L=Math.hypot(dx,dy);
    if(L>footOf(c).rx*.9){let bt=-1,bc=0.35;for(const {to} of G.adj[g.ci]){const tc=G.castles[to];const tx=tc.x-c.x,ty=tc.y-c.y,tl=Math.hypot(tx,ty);const cs=(dx*tx+dy*ty)/(L*tl);if(cs>bc){bc=cs;bt=to;}}
      if(bt>=0){g.mode='pour';g.road={from:g.ci,to:bt};pourStart(g.ci,bt);}}}
  if(g.mode==='pour'){const tc=G.castles[g.road.to];const f=footOf(tc);g.lock=Math.hypot((w.x-tc.x)/(f.rx+20/VS.s),(w.y-tc.y)/(f.ry+20/VS.s))<1.1;}
  if(g.mode==='pan'&&g.moved){CAM.x-=(p.x-g.last.x)/VS.s;CAM.y-=(p.y-g.last.y)/VS.s;const tt={x:CAM.x,y:CAM.y,z:CAM.z};clampCam(tt);CAM.x=CAM.tx=tt.x;CAM.y=CAM.ty=tt.y;applyCam();}
  g.last=p;
});
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!PT.size)aimS=null;});
function endPtr(e,cancel){
  if(!PT.has(e.pointerId))return;const p=local(e);PT.delete(e.pointerId);
  if(pinch){if(PT.size<2)pinch=null;if(PT.size===0)gesture=null;return;}
  const g=gesture;gesture=null;clearTimeout(pourTimer);if(!G||!g)return;
  if(g.mode==='pour'){const lock=g.lock;pourStop();if(!cancel&&lock){issue(2,g.road.from,g.road.to);toast('Route locked to '+G.names[g.road.to]+'. Quick-tap the road to stop it.',2600);}return;}
  if(cancel||g.moved&&g.mode!=='road')return;
  const w=toWorld(p);
  if(g.mode==='road'){const c=G.castles[g.road.from];if(c.route===g.road.to){issue(2,g.road.from,-1);toast('Route stopped.',1500);}else{issue(1,g.road.from,g.road.to);fxRing(c.x,c.y,colOf(mySlot),false);}return;}
  if(g.mode==='castle'){sel=sel===g.ci?-1:g.ci;panelKey='';updatePanel();if(sel>=0){const c=G.castles[sel];const want=VS.h*0.28;const sy=c.y*VS.s+VS.oy;if(sy>want+40){setCam(CAM.x,c.y+(VS.h/2-want)/VS.s,CAM.z);}}return;}
  const ci=hitCastle(w);
  if(armedAb>=0){if(canAct())castAt(w,ci);return;}
  if(ci>=0){if(canAct()&&sel>=0&&sel!==ci&&G.castles[sel].owner===mySlot&&G.edgeKey[sel+'_'+ci]!==undefined){issue(1,sel,ci);return;}
    sel=sel===ci?-1:ci;panelKey='';updatePanel();return;}
  sel=-1;updatePanel();
}
cv.addEventListener('pointerup',e=>{endPtr(e,false);if(typeof panelAt==='number')panelAt=Math.max(panelAt,performance.now()-50);});
cv.addEventListener('pointercancel',e=>endPtr(e,true));
cv.addEventListener('wheel',e=>{if(!G)return;e.preventDefault();const p=local(e);zoomAt(p.x,p.y,Math.exp(-e.deltaY*0.0015));},{passive:false});
document.addEventListener('keydown',e=>{
  if(!G||!$('#s-game').classList.contains('on')||e.target.tagName==='INPUT')return;
  if(e.key==='Escape'){sel=-1;armedAb=-1;updatePanel();updateBar();}
  else if(e.key==='+'||e.key==='=')$('#z-in').click();else if(e.key==='-')$('#z-out').click();else if(e.key==='0')$('#z-fit').click();
});
