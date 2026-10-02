/* ENGINE-READY */
// ===== Brimfall core: demon lords, minions and souls =====
const COLORS=['#ff4b4b','#4aa3ff','#46d68c','#ffc83d','#b277ff','#ff8a3d','#35d4d4','#ff6eb4'];
const NEUTRAL=9,ROUTE_IV=2.4,ROUTE_PKT=12;
const SPEED_S=25,ENGAGE=26,MELEE=7,HIT_F=0.36,CD_F=0.9,HIT_W=0.155,CD_W=1.25,FIRE=0.155,MAX_SOL=560;
const LV=[null,{cap:40,g:.35},{cap:70,g:.55},{cap:100,g:.8},{cap:130,g:1.0},{cap:160,g:1.2},{cap:190,g:1.4}];
const LVCOST=[0,50,100,160,230,320];let GG=null;
const TOWER_COST=45,TOWER_HP=22,TOWER_R=95,TOWER_T=6;
const SUMMON_N=10,SUMMON_BASE=35,PROMO_N=10,PROMO_COST=[0,3,8],SAC_N=10,PILG_N=4,PILG_IV=1.4,PILG_SPD=1.4,LORD_R=85,LORD_CD=40,LORD_HEAL=0.4;
const PATHS=[null,
 {name:'Bastion',desc:'Defence ×1.8 and walled against attackers without siege; holds 25% more. Not for the Throne'},
 {name:'Soul Well',desc:'An altar that gathers souls on its own; sacrifices here yield 50% more; breeds 30% slower'},
 {name:'Dark Tower',desc:'Hires a lord, sees far into the fog, garrison fire +50%'},
 {name:'Hellforge',desc:'Breeds 50% faster, training and promotion 40% cheaper, greater demons from level 3'}];
const PATH_COST=120,PATH_T=15,LEVEL_T=12;
const WONDER_COST=700,WONDER_T=45,WONDER_STAGES=5,WONDER_HOLD=240;
// req = castle level needed to breed or promote into the type (Hellforge: greater demons from its level 3); the lord is hired, never bred
const UNIT=[{name:'Minion',short:'Minion',hp:.75,spd:1,dmg:.27,wall:1,cost:1,souls:0,req:1},
 {name:'Lesser demon',short:'Lesser',hp:1.45,spd:1,dmg:.4,wall:1.1,cost:1.15,souls:2,req:2},
 {name:'Greater demon',short:'Greater',hp:2.2,spd:1.5,dmg:.62,wall:1.8,cost:1.9,souls:6,req:4},
 {name:'Lord',short:'Lord',hp:14,spd:.9,dmg:1.15,wall:2.2,cost:0,souls:0,req:0}];
const NU=3;
const SPELLS=[
 {id:0,name:'Hellfire',desc:'Fire falls on a spot after a short warning, burning every enemy there and cracking spires',cost:70,cd:55,kind:'point',r:45,delay:1.6},
 {id:1,name:'Shatter',desc:'Breaks a castle’s walls for 22 s and kills 10% of its garrison',cost:60,cd:70,kind:'castle',dur:22},
 {id:2,name:'Eye of Hell',desc:'Reveals a wide area for 15 s',cost:30,cd:40,kind:'point',r:330,dur:15},
 {id:3,name:'Frenzy',desc:'Your soldiers in the circle deal 40% more damage and move 20% faster for 12 s',cost:50,cd:60,kind:'point',r:90,dur:12},
 {id:4,name:'Plague',desc:'A castle stops growing and loses 1.2% of its garrison every second for 25 s',cost:65,cd:75,kind:'castle',dur:25}];
const MAXSPELL=2;
const CARDS=((pc,mc,on)=>[['grow','Fecund Pits','+10% breeding','soul',6,n=>1+.1*n,pc(10)],
 ['tithe','Blood Tithe','+10% souls from every sacrifice','soul',6,n=>1+.1*n,pc(10)],
 ['pilgrim','Swift Pilgrims','Pilgrims walk 25% faster','soul',3,n=>1+.25*n,pc(25)],
 ['well','Deep Wells','+25% souls from Soul Wells and Soul Springs','soul',4,n=>1+.25*n,pc(25)],
 ['thrift','Pact of Thrift','Levels, paths, promotions and spires cost 8% less','soul',4,n=>1-.08*n,mc(8)],
 ['cap','Wider Dens','Castles hold 10% more','soul',5,n=>1+.1*n,pc(10)],
 ['acap','Legion Writ','+30 army cap','war',5,n=>30*n,n=>'+'+30*n],
 ['dmg','Razor Claws','+6% damage','war',6,n=>1+.06*n,pc(6)],
 ['hp','Thick Hides','+8% health','war',5,n=>1+.08*n,pc(8)],
 ['spd','Hellwind Haste','+8% march speed','war',4,n=>1+.08*n,pc(8)],
 ['def','Brimstone Walls','+8% castle defence','war',5,n=>1+.08*n,pc(8)],
 ['siege','Siegebreakers','Full damage against walls','war',1,n=>n,on('Full')],
 ['blood','Blood Oath','Units leave castles as rank-1 veterans','war',1,n=>n,on('Rank 1')],
 ['muster','Dread Levy','+25% muster limit and bigger route packets','war',3,n=>Math.pow(1.25,n),n=>'+'+Math.round((Math.pow(1.25,n)-1)*100)+'%'],
 ['spire','Spire Mastery','Spires +25% health and fire rate','war',3,n=>1+.25*n,pc(25)],
 ['laura','Tyrant’s Aura','Lord aura +25%','lord',3,n=>1+.25*n,pc(25)],
 ['lhp','Unbroken Will','Lords +30% health','lord',3,n=>1+.3*n,pc(30)],
 ['lcost','Infernal Contract','Lords cost 25% less','lord',2,n=>1-.25*n,mc(25)],
 ...SPELLS.map(sp=>['learn'+sp.id,'Learn '+sp.name,sp.desc,'magic',1,n=>n,on(sp.name)]),
 ['spellpow','Arcane Pact','Spells cost 12% less and recharge 12% faster','magic',3,n=>1-.12*n,mc(12)],
 ['reach','Far Reach','+15% spell area and duration','magic',3,n=>1+.15*n,pc(15)]
].map(([key,name,desc,tag,max,m,eff],id)=>({id,key,name,desc,tag,max,w:tag==='lord'?1.5:key==='spellpow'||key==='reach'?2:3,sp:key.startsWith('learn')?+key.slice(5):-1,m,eff})))(k=>n=>'+'+Math.round(k*n)+'%',k=>n=>'−'+Math.round(k*n)+'%',t=>n=>n?t:'—');
const CARD_ID={},MOD0={};CARDS.forEach(c=>{CARD_ID[c.key]=c.id;MOD0[c.key]=c.m(0);});
function recomputeMods(G,s){const p=G.pl[s];if(!p)return;const m={};for(const c of CARDS)m[c.key]=c.m(Math.min(c.max,(p.cards&&p.cards[c.id])|0));p.mod=m;}
function mod(G,s,k){const p=G&&s>=0&&s<8?G.pl[s]:null;return p&&p.mod?p.mod[k]:MOD0[k];}
function cardCount(G,s,id){const p=G&&G.pl[s];return p&&p.cards?p.cards[id]|0:0;}
function cardEffect(id,n){const c=CARDS[id];return c?c.eff(n|0):'';}
const LORD_NAMES=['Malvek','Azgor','Belthar','Vexis','Morgrath','Zerath','Ulkor','Draven','Sythra','Kragmor','Nhazul','Orbas','Raszul','Thessk','Vorgath','Xerith','Gorrul','Ishtak','Baalor','Mephor'];
const NEUT_IDLE=6;
function counterMul(a,b){return a===2&&b===0?1.5:1;}
const unitOk=(c,t)=>t===0||(t>0&&t<NU&&c.kind!=='m'&&(c.lv>=UNIT[t].req||(t===2&&c.path===4)));
function addT(c,t,n){if(t>=NU)t=0;c.u[t]+=n;c.size+=n;}
function scaleT(c,ns){ns=Math.max(0,ns);if(c.size<=1e-6){c.u=[ns,0,0];c.size=ns;c.vp=0;return;}const k=ns/c.size;if(c.vp)c.vp*=k;for(let i=0;i<NU;i++)c.u[i]*=k;c.size=ns;}
function takeT(G,c,mask){let tot=0;for(let t=0;t<NU;t++)if((mask>>t)&1&&c.u[t]>=1)tot+=c.u[t];if(tot<=0)return -1;let r=G.rng()*tot;
  for(let t=0;t<NU;t++)if((mask>>t)&1&&c.u[t]>=1){r-=c.u[t];if(r<=0){c.u[t]-=1;c.size-=1;return t;}}for(let t=NU-1;t>=0;t--)if((mask>>t)&1&&c.u[t]>=1){c.u[t]-=1;c.size-=1;return t;}return -1;}
function trainMask(c){let m=c.tr&1;for(let t=1;t<NU;t++)if((c.tr>>t)&1&&unitOk(c,t))m|=1<<t;return m||1;}
const MAPTYPES=['Rivers of fire','Twin lava rivers','Obsidian isles','Bone highlands','Ash archipelago','Brimstone canyon','Cocytus','Sulfur wastes'];
const MAPTHEME=['ash','ash','ash','ash','ash','ash','frost','sulfur'];
const PERS=['Balanced','Aggressive','Turtle','Harvester'];
function mkRng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const isAltar=c=>c.kind!=='m'&&(c.capital>=0||c.path===2);
const isWalled=c=>!!c.nw||c.path===1;
const capOf=c=>Math.round(LV[c.lv].cap*(c.owner!==NEUTRAL&&GG?mod(GG,c.owner,'cap'):1)*(c.path===1?1.25:1));
const maxLv=c=>c.kind==='m'?3:c.capital>=0?6:5;
const castleVision=c=>c.path===3?460:c.capital>=0?300:210+Math.min(c.lv,3)*15;
const FOOT=[0,70,98,128];
function footW(c){const s=c.kind==='m'?62:c.kind==='v'&&c.owner===NEUTRAL?118:FOOT[Math.min(3,c.lv)]+14;return s*0.36;}
function segDist2(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));const x=ax+t*dx-px,y=ay+t*dy-py;return x*x+y*y;}
function segX(a,b,c,d){const r=(b.x-a.x)*(d.y-c.y)-(b.y-a.y)*(d.x-c.x);if(!r)return false;const u=((c.x-a.x)*(d.y-c.y)-(c.y-a.y)*(d.x-c.x))/r,v=((c.x-a.x)*(b.y-a.y)-(c.y-a.y)*(b.x-a.x))/r;return u>0&&u<1&&v>0&&v<1;}
function wavyLine(R,horizontal,pos,W,H){const L=horizontal?W:H;const pts=[];let off=0;for(let i=0;i<=16;i++){off=off*0.6+(R()-.5)*90;const a=-30+i*(L+60)/16;pts.push(horizontal?{x:a,y:pos+off}:{x:pos+off,y:a});}return pts;}
// road graph: planar, denser than a Gabriel graph (relaxed empty circle GAB, clearance CLR, min angle between roads, length cap LCAP·minD)
const MAPGEN={GAB:0.7,CLR:52,LCAP:3.0,MINCOS:0.87,XMAX:2.8};
function genMap(seed,nPlayers,W,H,ms,mt){
  const R=mkRng(seed),MG=MAPGEN;
  const base=ms===0?7:ms===2?15:ms===3?21:11;let n=Math.min(ms===3?44:34,base+nPlayers*2);
  const port=H>=W,M=port?H:W,Lx=port?W:H;
  // barriers: lava (crossed by bridges) and ridges (crossed by passes)
  const bars=[];
  if(mt===1){bars.push({k:'w',pts:wavyLine(R,port,M*(0.3+R()*.06),W,H)});bars.push({k:'w',pts:wavyLine(R,port,M*(0.64+R()*.06),W,H)});}
  else if(mt===2){bars.push({k:'w',pts:wavyLine(R,port,M*(0.45+R()*.1),W,H)});bars.push({k:'w',pts:wavyLine(R,!port,Lx*(0.42+R()*.16),W,H)});}
  else if(mt===3){bars.push({k:'r',pts:wavyLine(R,port,M*(0.42+R()*.16),W,H)});}
  else if(mt===4){bars.push({k:'s',pts:wavyLine(R,port,M*(0.33+R()*.05),W,H)});bars.push({k:'s',pts:wavyLine(R,port,M*(0.64+R()*.05),W,H)});bars.push({k:'s',pts:wavyLine(R,!port,Lx*(0.45+R()*.1),W,H)});}
  else if(mt===5){bars.push({k:'r',pts:wavyLine(R,!port,Lx*(0.33+R()*.04),W,H)});bars.push({k:'r',pts:wavyLine(R,!port,Lx*(0.64+R()*.04),W,H)});}
  else if(mt===6){bars.push({k:'i',pts:wavyLine(R,port,M*(0.42+R()*.16),W,H)});} // frozen river: walk across anywhere
  else if(mt===7){} // open wastes
  else bars.push({k:'w',pts:wavyLine(R,port,M*(0.42+R()*.16),W,H)});
  const near=(x,y,m)=>bars.some(b=>{if(b.k==='i')return false;if(b.k==='s')m*=1.35;for(let i=0;i<b.pts.length-1;i++)if(segDist2(x,y,b.pts[i].x,b.pts[i].y,b.pts[i+1].x,b.pts[i+1].y)<m*m)return true;return false;});
  const mg=90,minD=Math.sqrt(W*H/n)*0.64;const pts=[];
  for(let tries=0;pts.length<n&&tries<20000;tries++){const x=mg+R()*(W-2*mg),y=mg+R()*(H-2*mg);
    if(near(x,y,85))continue;if(pts.every(p=>(p.x-x)**2+(p.y-y)**2>minD*minD))pts.push({x,y});}
  n=pts.length;
  const crossOf=(a,b)=>{let f=-1,m=0;for(let k=0;k<bars.length;k++){if(bars[k].k==='i')continue;const p=bars[k].pts;for(let i=0;i<p.length-1;i++)if(segX(a,b,p[i],p[i+1])){if(f<0)f=k;else if(f!==k)m=1;break;}}return m?-2-f:f;};
  const cand=[],G2=MG.GAB*MG.GAB/4,C2=MG.CLR*MG.CLR;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=pts[i],b=pts[j];const d2=(a.x-b.x)**2+(a.y-b.y)**2;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;let ok=true;
    for(let k=0;k<n&&ok;k++){if(k===i||k===j)continue;const p=pts[k];if((p.x-mx)**2+(p.y-my)**2<d2*G2)ok=false;else if(segDist2(p.x,p.y,a.x,a.y,b.x,b.y)<C2)ok=false;}
    cand.push({a:i,b:j,len:Math.sqrt(d2),ok,x:crossOf(a,b)});}
  cand.sort((p,q)=>p.len-q.len);
  const par=[...Array(n).keys()];const find=x=>par[x]===x?x:(par[x]=find(par[x]));const uni=(a,b)=>{par[find(a)]=find(b);};
  const edges=[],inc=pts.map(()=>[]);
  const free=e=>{const A=pts[e.a],B=pts[e.b];for(const o of edges){if(o.a===e.a||o.a===e.b||o.b===e.a||o.b===e.b)continue;if(segX(A,B,pts[o.a],pts[o.b]))return false;}return true;};
  const wide=e=>{for(const [v,w] of [[e.a,e.b],[e.b,e.a]]){const P=pts[v],Q=pts[w],ux=(Q.x-P.x)/e.len,uy=(Q.y-P.y)/e.len;
    for(const o of inc[v]){const O=pts[o.a===v?o.b:o.a];if(((O.x-P.x)*ux+(O.y-P.y)*uy)/o.len>MG.MINCOS)return false;}}return true;};
  const add=e=>{edges.push(e);inc[e.a].push(e);inc[e.b].push(e);uni(e.a,e.b);};
  // limited crossings per barrier, spread out, picked first so that ordinary roads route around them
  bars.forEach((b,k)=>{if(b.k==='i')return;const nb=b.k==='r'?2+(n>16?1:0)+(n>26?1:0):2+(n>18?1:0)+(n>30?1:0);const picked=[];
    for(const e of cand){if(picked.length>=nb)break;if(!e.ok||e.x!==k||e.len>=minD*MG.XMAX||!free(e))continue;const mx=(pts[e.a].x+pts[e.b].x)/2,my=(pts[e.a].y+pts[e.b].y)/2;
      if(picked.every(o=>{const ox=(pts[o.a].x+pts[o.b].x)/2,oy=(pts[o.a].y+pts[o.b].y)/2;return(ox-mx)**2+(oy-my)**2>(Lx/(nb+1))**2*0.6;})){picked.push(e);add(e);}}
    for(const e of cand){if(picked.length>=2)break;if(e.x===k&&e.len<minD*MG.XMAX*1.2&&!picked.includes(e)&&free(e)&&wide(e)){picked.push(e);add(e);}}});
  for(const e of cand)if(e.ok&&e.x===-1&&e.len<minD*MG.LCAP&&free(e)&&wide(e))add(e);
  const sorted=[...cand].sort((p,q)=>((p.x!==-1)-(q.x!==-1))||((p.x<-1)-(q.x<-1))||((!p.ok)-(!q.ok))||(p.len-q.len));
  for(const e of sorted)if(find(e.a)!==find(e.b)&&free(e))add(e);
  for(const e of sorted)if(find(e.a)!==find(e.b))add(e);
  const bk=x=>x===-1?-1:x>=0?x:-2-x;
  const E=edges.map(e=>{const a=pts[e.a],b=pts[e.b],k=bk(e.x);return{a:e.a,b:e.b,len:e.len,cross:k>=0?(bars[k].k==='s'?'w':bars[k].k):null,bar:k,ux:(b.x-a.x)/e.len,uy:(b.y-a.y)/e.len};});
  const adj=pts.map(()=>[]);E.forEach((e,i)=>{adj[e.a].push({to:e.b,e:i});adj[e.b].push({to:e.a,e:i});});
  const hillP=mt===3||mt===5?0.32:mt===7?0.12:0.22;
  const castles=pts.map(p=>({x:p.x,y:p.y,lv:1,kind:'c',owner:NEUTRAL,size:0,base:0,idle:99,route:-1,rt:0,build:null,off:0,pt:0,sab:0,br:0,capital:-1,hill:R()<hillP,sup:true,fire:0,assault:0,last:-1,u:[0,0,0],tr:1,path:0,nw:0,lords:[],lordCd:0,vp:0}));
  const cx=W/2,cy=H/2;let first=0,bd=-1;
  castles.forEach((c,i)=>{const d=(c.x-cx)**2+(c.y-cy)**2+R()*2000;if(d>bd){bd=d;first=i;}});
  const starts=[first];
  while(starts.length<nPlayers&&starts.length<n){let bi=-1,bv=-1;
    castles.forEach((c,i)=>{if(starts.includes(i))return;let md=1e18;for(const s of starts){const d=(c.x-castles[s].x)**2+(c.y-castles[s].y)**2;if(d<md)md=d;}if(md>bv){bv=md;bi=i;}});
    starts.push(bi);}
  const edgeKey={};E.forEach((e,i)=>{edgeKey[e.a+'_'+e.b]=i;edgeKey[e.b+'_'+e.a]=i;});
  return{W,H,castles,edges:E,adj,starts,edgeKey,bars,mt,terrainSeed:(seed*7919)>>>0,R};
}
function activeSlots(slots){const r=[];slots.forEach((s,i)=>{if(s.k==='h'||s.k==='b')r.push(i);});return r;}
function newGame(cfg){
  const act=activeSlots(cfg.slots);
  let mt=cfg.mt|0;if(mt<0||mt>7)mt=cfg.seed%8;
  const O={wonder:1,souls:40,fog:1,neut:1,...(cfg.opts||{})};
  const map=genMap(cfg.seed,act.length,cfg.W,cfg.H,cfg.ms,mt);const R=map.R;delete map.R;
  const order=[...act].sort((x,y)=>{const tx=cfg.slots[x].t||(10+x),ty=cfg.slots[y].t||(10+y);return tx-ty||x-y;});
  const starts=[...map.starts];const assign={};let prev=null;
  for(const s of order){let pick=0;
    if(prev&&cfg.slots[s].t&&cfg.slots[s].t===cfg.slots[prev.slot].t){let bd=1e18;
      starts.forEach((st,i)=>{const a=map.castles[st],b=map.castles[prev.c];const d=(a.x-b.x)**2+(a.y-b.y)**2;if(d<bd){bd=d;pick=i;}});}
    const c=starts.splice(pick,1)[0];assign[s]=c;prev={slot:s,c};}
  const C=map.castles;const taken=new Set(Object.values(assign));
  for(const s of act){const c=C[assign[s]];c.owner=s;c.size=20;c.lv=2;c.capital=s;c.hill=false;c.u=[20,0,0];}
  const rest=C.map((c,i)=>i).filter(i=>!taken.has(i));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  // difficulty by distance: each Throne's nearest neutrals are easy hovels, the far core is walled
  const hop=new Array(C.length).fill(99),hq=[];for(const t of taken){hop[t]=0;hq.push(t);}
  for(let h=0;h<hq.length;h++){const u=hq[h];for(const {to} of map.adj[u])if(hop[to]>hop[u]+1){hop[to]=hop[u]+1;hq.push(to);}}
  const cd=i=>[...taken].map(t=>Math.hypot(C[i].x-C[t].x,C[i].y-C[t].y)).sort((a,b)=>a-b);
  const dist=i=>cd(i)[0];
  const easy=new Set();
  for(const t of taken){const near=rest.filter(i=>!easy.has(i)).sort((a,b)=>(hop[a]-hop[b])||(Math.hypot(C[a].x-C[t].x,C[a].y-C[t].y)-Math.hypot(C[b].x-C[t].x,C[b].y-C[t].y)));
    for(const i of near.slice(0,2))if(hop[i]<=1)easy.add(i);}
  const others=rest.filter(i=>!easy.has(i)).sort((a,b)=>dist(b)-dist(a));
  const nWall=Math.min(others.length,Math.max(1,Math.round(rest.length*0.3)));const wall=new Set(others.slice(0,nWall));
  // soul springs at contested spots: about as far from the nearest Throne as from the second nearest
  const nMine=Math.max(2,Math.ceil(act.length/1.5));const mines=new Set(),ntw=[];
  const cont=i=>{const d=cd(i);return d.length>1?(d[1]-d[0])/(d[1]+d[0]):0;};
  const mc=others.filter(i=>!wall.has(i)).map(i=>[i,cont(i)+R()*0.18]).sort((a,b)=>a[1]-b[1]);
  for(const [i] of mc){if(mines.size>=nMine)break;if(map.adj[i].some(({to})=>mines.has(to)))continue;mines.add(i);}
  for(const [i] of mc){if(mines.size>=nMine)break;mines.add(i);}
  const maxD=Math.max(1,...others.map(dist)),minD2=Math.min(...others.map(dist));
  for(const i of rest){const c=C[i];
    if(easy.has(i)){c.lv=1;c.kind='v';c.size=c.base=Math.floor(8+R()*7);continue;}
    if(wall.has(i)){const deep=(dist(i)-minD2)/Math.max(1,maxD-minD2);c.lv=3;c.kind='f';c.nw=1;c.size=c.base=Math.floor(50+R()*12+deep*18);ntw.push(i);continue;}
    if(mines.has(i)){c.kind='m';c.lv=1;c.size=c.base=Math.floor(12+R()*8);continue;}
    if(R()<0.25){c.lv=3;c.kind='f';c.size=c.base=Math.floor(40+R()*15);}else{c.lv=1;c.kind='v';c.size=c.base=Math.floor(22+R()*11);}}
  for(const i of rest){const c=C[i];if(O.neut!==1){c.size=c.base=Math.max(4,Math.round(c.size*O.neut));}const sp=c.kind==='f'?Math.floor(c.size*(c.nw?0.35:0.25)):0;c.u=[c.size-sp,sp,0];}
  const pl=[];for(let i=0;i<8;i++)pl.push({souls:O.souls,earned:0,inc:0,ig:0,cards:new Array(CARDS.length).fill(0),offer:null,rn:0,mod:null,spells:[-1,-1],cd:[0,0],mix:15,pour:null,pourA:0,pourH:0,
    ws:0,wb:-1,wh:0,hm:1,lh:0,out:!act.includes(i),taken:0,peak:20,kills:0});
  const capIdx={};for(const s of act)capIdx[s]=assign[s];
  const G={...map,home:assign,capIdx,slots:cfg.slots,sp:cfg.sp||1,sol:[],sid:1,time:0,gt:0,over:false,winner:null,winBy:'',botT:{},events:[],pl,
    scouts:[],fires:[],frz:[],tw:[],tid:1,gid:1,lid:1,secT:0,tot:new Array(8).fill(0),fieldN:new Array(8).fill(0),nAct:act.length,rng:mkRng(cfg.seed^0x5bd1e995),weather:['clear','clear','embers','ash','wind'][Math.floor(R()*5)]};
  for(const i of ntw){const c=C[i];let best=null;for(const {to,e} of G.adj[i])if(!best||hop[to]<hop[best.to])best={to,e};if(!best)continue;
    const E=G.edges[best.e],sg=E.a===i?1:-1,ux=E.ux*sg,uy=E.uy*sg,d=Math.min(E.len*0.4,footW(c)+30);
    G.tw.push({tw:1,id:G.tid++,o:NEUTRAL,e:best.e,from:i,to:best.to,x:c.x+ux*d-uy*12,y:c.y+uy*d+ux*12,hp:TOWER_HP,bt:0,cd:0,u:4,st:4});}
  G.opts=O;G.theme=MAPTHEME[mt];if(G.theme==='frost')G.weather='snow';else if(G.theme==='sulfur')G.weather=G.weather==='wind'?'wind':'clear';
  G.cfg={opts:O,seed:cfg.seed,W:cfg.W,H:cfg.H,ms:cfg.ms,sp:cfg.sp||1,mt:cfg.mt,botDelay:cfg.botDelay||0,slots:cfg.slots.map(s=>{const o={k:s.k,n:s.n||'',t:s.t|0,d:s.d|0,pe:s.pe|0};if(s.noRes)o.noRes=1;if(s.noArmy)o.noArmy=1;if(s.wonderFirst)o.wonderFirst=1;return o;})};
  act.forEach(s=>{G.botT[s]=(cfg.botDelay||1)+G.rng()*1.5;});
  for(let s=0;s<8;s++)recomputeMods(G,s);
  GG=G;supply(G);
  return G;
}
function teamOf(G,o){if(o===NEUTRAL||o==null)return 'N';const s=G.slots[o];return s&&s.t?'T'+s.t:'S'+o;}
function ev(G,e){if(G.events.length<200)G.events.push(e);}
function gainSouls(p,v){p.souls+=v;p.earned+=v;p.ig=(p.ig||0)+v;}
function armyCap(G,s){const ci=G.capIdx[s];const lv=ci!==undefined?G.castles[ci].lv:1;return 60+60*lv+mod(G,s,'acap');}
// garrison weight per type: toughness (hp ratio) and fire
const GAR_W=[1,1.93,2.93],GAR_F=[1,1.25,1.4];
function garrisonTough(G,c){if(c.owner===NEUTRAL||!(c.size>0))return 1;let w=0;for(let t=0;t<NU;t++)w+=Math.max(0,c.u[t])*GAR_W[t];return Math.sqrt(w/c.size*mod(G,c.owner,'hp'));}
function garrisonFire(c){let f=c.path===3?0.5*Math.max(0,c.size):0;for(let t=0;t<NU;t++)f+=Math.max(0,c.u[t])*GAR_F[t];if(c.lords&&c.lords.length)f+=6;return f*(c.owner!==NEUTRAL&&GG?mod(GG,c.owner,'dmg'):1);}
const breached=(G,c)=>c.br>G.gt;
function defMul(G,c){const br=breached(G,c);let d=(c.hill?1.3:1)*garrisonTough(G,c);if(br)d*=0.8;if(c.owner===NEUTRAL)return d*1.12*(c.nw&&!br?1.4:1);
  d*=1.35*mod(G,c.owner,'def');if(c.capital>=0)d*=1.25;if(c.path===1&&!br)d*=1.8;if(c.lords&&c.lords.length)d*=1.15;return d;}
function upCost(G,s,c){return c&&c.lv<maxLv(c)?Math.round(LVCOST[c.lv]*mod(G,s,'thrift')):Infinity;}
function pathCost(G,s){return Math.round(PATH_COST*mod(G,s,'thrift'));}
function towerCost(G,s){return Math.round(TOWER_COST*mod(G,s,'thrift'));}
function promoCost(G,s,c,tier){return Math.round(PROMO_COST[tier]*(c&&c.path===4?0.6:1)*mod(G,s,'thrift')*10)/10;}
function promoCount(G,s,c,tier){if(!c||c.owner!==s||!(tier===1||tier===2)||!unitOk(c,tier))return 0;return Math.max(0,Math.min(PROMO_N,Math.floor(c.u[tier-1]+1e-6),Math.floor(G.pl[s].souls/promoCost(G,s,c,tier)+1e-9)));}
function summonPrice(G,s,c){return Math.round(SUMMON_BASE*(G.pl[s].hm||1));}
function researchCost(G,s){return Math.round(45*Math.pow(1.28,G.pl[s].rn));}
function lordPrice(G,s){return Math.round((140+70*G.pl[s].lh)*mod(G,s,'lcost'));}
function sacYield(G,s,c,rk){return(1+0.2*(rk|0))*mod(G,s,'tithe')*(c.path===2?1.5:1);}
function sacPreview(G,s,c){if(!c||c.owner!==s||!isAltar(c))return{n:0,souls:0};const n=Math.max(0,Math.min(SAC_N,Math.floor(c.u[0]+1e-6)));return{n,souls:Math.round(n*sacYield(G,s,c,0)*10)/10};}
function spellCost(G,s,id){return Math.round(SPELLS[id].cost*mod(G,s,'spellpow'));}
function spellCd(G,s,id){return SPELLS[id].cd*mod(G,s,'spellpow');}
function spellR(G,s,id){return(SPELLS[id].r||0)*mod(G,s,'reach');}
function spellDurOf(G,s,id){return(SPELLS[id].dur||0)*mod(G,s,'reach');}
function fieldCap(G,s){return Math.max(110,Math.floor(MAX_SOL*1.6/Math.max(1,G.nAlive||G.nAct)));}
function solSpeed(G,s){let v=SPEED_S*UNIT[s.u].spd*mod(G,s.o,'spd');if(s.sac)v*=PILG_SPD*mod(G,s.o,'pilgrim');if(s.fz>G.gt)v*=1.2;if(s.au)v*=1+0.08*s.au;return v;}
// place a soldier on its road
function roadPt(G,s){const e=G.edges[s.e],f=G.castles[s.from];const sg=e.a===s.from?1:-1;const ux=e.ux*sg,uy=e.uy*sg;return{x:f.x+ux*s.d-uy*s.off,y:f.y+uy*s.d+ux*s.off,ux,uy};}
// lr: lord record (u=3), pg: pilgrim (no veteran ranks)
function mkSol(G,o,from,to,d,off,st,u,g,lr,pg){const e=G.edgeKey[from+'_'+to];
  const s={id:G.sid++,o,from,to,e,d,off,st,u,g:g||0,rk:0,xp:0,hp:lr?lr.hp:UNIT[u].hp*mod(G,o,'hp'),cd:0,tgt:null,tt:G.rng()*0.2,ret:0,ch:u===2,x:0,y:0,px:0,py:0,hx:0,hy:1,wx:0,wy:0,sac:pg?1:0,alt:-1,lord:lr||null,fz:0,au:0};
  if(lr){s.rk=lr.rk|0;s.xp=lr.xp|0;}
  else if(!pg){const c=G.castles[from];let rk=mod(G,o,'blood')?1:0;if(c.vp>=1){rk=Math.min(3,rk+1);c.vp-=1;}if(rk){s.rk=rk;s.hp*=1+0.2*rk;}}
  const p=roadPt(G,s);s.x=s.px=p.x;s.y=s.py=p.y;s.hx=p.ux;s.hy=p.uy;G.sol.push(s);G.fieldN[o]++;return s;}
// send a block of n soldiers marching together; with mask bit 3 and at least 6 troops a lord leads it
function dispatch(G,slot,from,to,n,mask){
  const c=G.castles[from];if(G.edgeKey[from+'_'+to]===undefined)return 0;mask=mask||7;
  n=Math.min(Math.floor(n),Math.floor(c.size),fieldCap(G,slot)-G.fieldN[slot],MAX_SOL-G.sol.length);if(n<1)return 0;
  const us=[];for(let k=0;k<n;k++){const t=takeT(G,c,mask);if(t<0)break;us.push(t);}
  const lr=(mask&8)&&us.length>=6&&c.lords.length?c.lords.shift():null;
  placeBlock(G,slot,from,to,us,footW(c)*0.9,-1,0,G.gid++,lr);
  return us.length;}
// marching block: lesser demons in front, minions behind, greater demons on the flanks, the lord at the head.
// us: unit types to create, or existing soldiers to re-form (muster)
function placeBlock(G,slot,from,to,us,d0,dir,st,g,lr){
  const ty=x=>typeof x==='number'?x:x.u,put=(x,d,off)=>{if(typeof x==='number')mkSol(G,slot,from,to,d,off,st,x,g,x===3?lr:null);else{x.d=d;x.off=off;}};
  const foot=us.filter(x=>ty(x)<2).sort((a,b)=>ty(b)-ty(a)),cav=us.filter(x=>ty(x)===2),ld=us.filter(x=>ty(x)===3);if(lr)ld.push(3);
  foot.forEach((x,k)=>{const row=Math.floor(k/5),col=k%5;put(x,d0+dir*row*5.5,(col-2)*4.2+(G.rng()-.5)*1.2);});
  const rows=Math.max(1,Math.ceil(foot.length/5));cav.forEach((x,k)=>{const side=k%2?1:-1,r=Math.floor(k/2);put(x,d0+dir*(r%rows)*5.5,side*(13+Math.floor(r/rows)*5));});
  ld.forEach(x=>put(x,dir<0?d0+6:d0+rows*5.5+2,0));}
function own(G,slot,ci){GG=G;const c=G.castles[ci];return !!c&&c.owner===slot&&!G.pl[slot].out&&!G.over;}
function squad(G,slot,from,to){if(!own(G,slot,from))return false;const c=G.castles[from];return dispatch(G,slot,from,to,Math.max(3,Math.floor(c.size*0.2)),G.pl[slot].mix)>0;}
function towerOn(G,o,e,from){return G.tw.find(t=>t.o===o&&t.e===e&&t.from===from&&t.hp>0);}
function towerMax(G,t){return TOWER_HP*(t.o===NEUTRAL?1:mod(G,t.o,'spire'));}
function buildTower(G,slot,ci,to){if(!own(G,slot,ci))return false;const e=G.edgeKey[ci+'_'+to];if(e===undefined||towerOn(G,slot,e,ci))return false;const p=G.pl[slot],cost=towerCost(G,slot);if(p.souls<cost)return false;
  const c=G.castles[ci],E=G.edges[e],sg=E.a===ci?1:-1,ux=E.ux*sg,uy=E.uy*sg,d=Math.min(E.len*0.4,footW(c)+30);
  p.souls-=cost;G.tw.push({tw:1,id:G.tid++,o:slot,e,from:ci,to,x:c.x+ux*d-uy*12,y:c.y+uy*d+ux*12,hp:TOWER_HP*0.5,bt:TOWER_T,cd:0,u:4,st:4});ev(G,{t:'up',c:ci});return true;}
function musterCap(c){return Math.round((30+30*c.lv)*(c.owner!==NEUTRAL&&GG?mod(GG,c.owner,'muster'):1));}
function setMix(G,slot,m){m&=15;if(m)G.pl[slot].mix=m;return !!m;}
function setTrain(G,slot,ci,m){if(!own(G,slot,ci))return false;G.castles[ci].tr=(m&7)||1;return true;}
function setRoute(G,slot,from,to){if(!own(G,slot,from))return false;const c=G.castles[from];
  if(to<0||c.route===to){c.route=-1;return true;}if(G.edgeKey[from+'_'+to]===undefined)return false;c.route=to;c.rt=0.3;return true;}
function releaseMuster(G,slot,from){for(const s of G.sol)if(s.st===3&&s.o===slot&&(from<0||s.from===from))s.st=0;}
function setPour(G,slot,from,to){const p=G.pl[slot];
  if(from<0||!own(G,slot,from)||G.edgeKey[from+'_'+to]===undefined){if(p.pour)releaseMuster(G,slot,p.pour.from);p.pour=null;return;}
  if(!p.pour||p.pour.from!==from||p.pour.to!==to){if(p.pour)releaseMuster(G,slot,p.pour.from);p.pour={from,to,g:G.gid++,lt:0};p.pourA=0;p.pourH=0;}}
function setOffer(G,slot,ci,v){if(!own(G,slot,ci))return false;const c=G.castles[ci];if(c.kind==='m')return false;c.off=v?1:0;if(c.off&&!(c.pt>0))c.pt=0.6;return true;}
function buildWonder(G,s){const p=G.pl[s];if(G.opts&&!G.opts.wonder)return false;if(p.out||G.over||p.wb>=0||p.ws>=WONDER_STAGES)return false;const c=G.castles[G.capIdx[s]];if(!c||c.owner!==s||c.lv<3||p.souls<WONDER_COST)return false;
  p.souls-=WONDER_COST;p.wb=0;ev(G,{t:'wonder',s,stage:p.ws});return true;}
function choosePath(G,slot,ci,pth){if(!own(G,slot,ci))return false;const c=G.castles[ci];if(c.build||c.path||c.kind==='m'||c.lv<3||!(pth>=1&&pth<=4)||(pth===1&&c.capital>=0))return false;const p=G.pl[slot],cost=pathCost(G,slot);if(p.souls<cost)return false;
  p.souls-=cost;c.build={k:20+pth,t:0,dur:PATH_T};ev(G,{t:'up',c:ci});return true;}
function upgrade(G,slot,ci){if(!own(G,slot,ci))return false;const c=G.castles[ci];if(c.build)return false;const cost=upCost(G,slot,c),p=G.pl[slot];if(!(cost<=p.souls))return false;
  p.souls-=cost;c.build={k:0,t:0,dur:LEVEL_T};ev(G,{t:'up',c:ci});return true;}
function summon(G,slot,ci){if(!own(G,slot,ci))return false;const c=G.castles[ci],p=G.pl[slot];if(c.kind==='m')return false;const cost=summonPrice(G,slot,c);if(p.souls<cost)return false;
  const n=Math.min(SUMMON_N,Math.floor(capOf(c)-c.size));if(n<1)return false;p.souls-=cost;addT(c,0,n);p.hm=(p.hm||1)*1.12;ev(G,{t:'summon',c:ci});return true;}
function sacrifice(G,slot,ci){if(!own(G,slot,ci))return false;const c=G.castles[ci],pv=sacPreview(G,slot,c);if(pv.n<1)return false;
  c.u[0]=Math.max(0,c.u[0]-pv.n);c.size=c.u[0]+c.u[1]+c.u[2];const v=pv.n*sacYield(G,slot,c,0);gainSouls(G.pl[slot],v);ev(G,{t:'sac',x:c.x,y:c.y,s:slot,n:pv.n,souls:v,c:ci});return true;}
function promote(G,slot,ci,tier){if(!own(G,slot,ci))return false;const c=G.castles[ci],n=promoCount(G,slot,c,tier);if(n<1)return false;
  G.pl[slot].souls-=n*promoCost(G,slot,c,tier);c.u[tier-1]=Math.max(0,c.u[tier-1]-n);c.u[tier]+=n;c.size=c.u[0]+c.u[1]+c.u[2];ev(G,{t:'promote',c:ci,n,tier});return true;}
// ---------- research cards ----------
function hasLordSource(G,s){return G.castles.some(k=>k.owner===s&&(k.path===3||k.lords.length>0||(k.build&&k.build.k===23)))||G.sol.some(x=>x.o===s&&x.lord);}
function cardOk(G,s,id){const p=G.pl[s],c=CARDS[id];if((p.cards[id]|0)>=c.max)return false;
  if(c.sp>=0)return p.spells.indexOf(-1)>=0&&p.spells.indexOf(c.sp)<0;
  if(c.tag==='lord')return hasLordSource(G,s);
  if(c.key==='spellpow'||c.key==='reach')return p.spells.some(v=>v>=0);
  return true;}
function wpick(G,ids){let t=0;for(const id of ids)t+=CARDS[id].w;let r=G.rng()*t;for(const id of ids){r-=CARDS[id].w;if(r<=0)return id;}return ids[ids.length-1];}
function drawResearch(G,s){const p=G.pl[s];if(!p||p.out||G.over||p.offer)return false;const cost=researchCost(G,s);if(p.souls<cost)return false;
  const pool=CARDS.filter(c=>cardOk(G,s,c.id)).map(c=>c.id);if(!pool.length)return false;const off=[];
  if(p.rn<2&&p.spells.indexOf(-1)>=0){const sp=pool.filter(id=>CARDS[id].sp>=0);if(sp.length)off.push(wpick(G,sp));}
  while(off.length<3){const r=pool.filter(id=>!off.includes(id));if(!r.length)break;off.push(wpick(G,r));}
  for(let i=off.length-1;i>0;i--){const j=Math.floor(G.rng()*(i+1));[off[i],off[j]]=[off[j],off[i]];}
  p.souls-=cost;p.offer=off;ev(G,{t:'offer',s});return true;}
function pickCard(G,s,i){const p=G.pl[s];if(!p||p.out||G.over||!p.offer||!(i>=0&&i<p.offer.length))return false;const id=p.offer[i],c=CARDS[id];
  p.offer=null;p.cards[id]=(p.cards[id]|0)+1;p.rn++;
  if(c.sp>=0){const k=p.spells.indexOf(-1);if(k>=0){p.spells[k]=c.sp;p.cd[k]=0;}}
  recomputeMods(G,s);
  if(c.key==='lhp'){const nm=lordMaxBase(G,s),fix=L=>{const k=nm/L.max;L.max=nm;L.hp*=k;return k;};
    for(const k of G.castles)for(const L of k.lords)if(L.o===s)fix(L);for(const x of G.sol)if(x.lord&&x.lord.o===s)x.hp*=fix(x.lord);}
  ev(G,{t:'card',s,id});return true;}
// ---------- spells ----------
function useSpell(G,s,k,x,y){const p=G.pl[s];if(!p||p.out||G.over||!(k===0||k===1))return false;const id=p.spells[k];if(!(id>=0)||p.cd[k]>G.gt)return false;const cost=spellCost(G,s,id);if(p.souls<cost)return false;
  const T=teamOf(G,s),pt=x>=0&&y>=0&&x<=G.W&&y<=G.H;
  if(id===0){if(!pt)return false;G.fires.push({x,y,s,at:G.gt+SPELLS[0].delay,done:false,r:spellR(G,s,0)});}
  else if(id===1||id===4){const c=G.castles[x];if(!c||(c.owner!==NEUTRAL&&teamOf(G,c.owner)===T))return false;
    if(id===1){c.br=G.gt+spellDurOf(G,s,1);scaleT(c,c.size*0.9);ev(G,{t:'breach',c:x});}else{c.sab=G.gt+spellDurOf(G,s,4);ev(G,{t:'plague',c:x});}}
  else if(id===2){if(!pt)return false;G.scouts.push({x,y,s,until:G.gt+spellDurOf(G,s,2),r:spellR(G,s,2)});ev(G,{t:'eye',x,y,s});}
  else if(id===3){if(!pt)return false;const r=spellR(G,s,3),u=G.gt+spellDurOf(G,s,3);for(const o of G.sol)if(o.o===s&&o.hp>0&&(o.x-x)**2+(o.y-y)**2<r*r)o.fz=u;G.frz.push({x,y,r,s,until:u});ev(G,{t:'frenzy',x,y,r,s});}
  p.souls-=cost;p.cd[k]=G.gt+spellCd(G,s,id);ev(G,{t:'spell',s,id,slot:k});return true;}
// ---------- lords ----------
function lordMaxBase(G,s){return UNIT[3].hp*mod(G,s,'lhp');}
function lordMax(L){return L.max*(1+0.2*(L.rk|0));}
function lordOf(G,ci){for(const c of G.castles)for(const L of c.lords)if(L.home===ci)return L;for(const s of G.sol)if(s.lord&&s.hp>0&&s.lord.home===ci)return s.lord;
  if(G.flords)for(const L of G.flords)if(L.home===ci)return L;return null;}
function lordStatus(G,slot,ci){const c=G.castles[ci],price=lordPrice(G,slot),lord=c?lordOf(G,ci):null;let why='';
  if(!c||c.owner!==slot)why='Not your castle';else if(c.path!==3)why='Needs a Dark Tower';else if(c.build)why='Busy building';else if(lord)why='Lord '+lord.nm+' serves this tower';
  else if(c.lordCd>G.gt)why='The tower mourns its lord ('+Math.ceil(c.lordCd-G.gt)+' s)';else if(G.pl[slot].souls<price)why='Needs '+price+' souls';
  return{can:!why,price,why,lord};}
function canLord(G,slot,ci){return lordStatus(G,slot,ci).can;}
function hireLord(G,slot,ci){if(!own(G,slot,ci)||!canLord(G,slot,ci))return false;const c=G.castles[ci],p=G.pl[slot];p.souls-=lordPrice(G,slot);p.lh++;
  const used=new Set();for(const k of G.castles)for(const L of k.lords)used.add(L.nm);for(const x of G.sol)if(x.lord)used.add(x.lord.nm);
  const free=LORD_NAMES.filter(n=>!used.has(n)),names=free.length?free:LORD_NAMES,mx=lordMaxBase(G,slot);
  c.lords.push({id:G.lid++,home:ci,o:slot,hp:mx,max:mx,rk:0,xp:0,nm:names[Math.floor(G.rng()*names.length)]});ev(G,{t:'lord',s:slot,c:ci});return true;}
function lordDie(G,L,x,y){ev(G,{t:'lorddie',x,y,s:L.o});const h=G.castles[L.home];if(h&&h.owner===L.o)h.lordCd=G.gt+LORD_CD;}
function supply(G){
  for(const c of G.castles)c.sup=false;
  for(const s in G.capIdx){const ci=G.capIdx[s];const c0=G.castles[ci];if(c0.owner!==+s)continue;const T=teamOf(G,+s);
    const seen=new Set([ci]);const q=[ci];c0.sup=true;
    for(let h=0;h<q.length;h++){for(const {to} of G.adj[q[h]]){const c=G.castles[to];if(seen.has(to)||c.owner===NEUTRAL||teamOf(G,c.owner)!==T)continue;seen.add(to);q.push(to);if(c.owner===+s)c.sup=true;}}}
  computeAltars(G);}
// per team: next castle on the shortest road path through the team's castles to the nearest altar (itself for an altar, -1 if none)
function computeAltars(G){const C=G.castles,n=C.length;G.altN={};
  for(const c0 of C){if(c0.owner===NEUTRAL)continue;const T=teamOf(G,c0.owner);if(G.altN[T])continue;
    const nx=new Array(n).fill(-1),d=new Array(n).fill(1e9),done=new Array(n).fill(false),inT=i=>C[i].owner!==NEUTRAL&&teamOf(G,C[i].owner)===T;
    for(let i=0;i<n;i++)if(inT(i)&&isAltar(C[i])){nx[i]=i;d[i]=0;}
    for(;;){let u=-1,bd=1e9;for(let i=0;i<n;i++)if(!done[i]&&d[i]<bd){bd=d[i];u=i;}if(u<0)break;done[u]=true;
      for(const {to,e} of G.adj[u]){if(!inT(to))continue;const nd=bd+G.edges[e].len;if(nd<d[to]){d[to]=nd;nx[to]=u;}}}
    G.altN[T]=nx;}}
// the altar a castle's pilgrims walk to (itself when it is an altar), -1 when none is reachable
function altarOf(G,ci){const c=G.castles[ci];if(!c||c.owner===NEUTRAL||!G.altN)return -1;const nx=G.altN[teamOf(G,c.owner)];if(!nx||nx[ci]<0)return -1;let a=ci;for(let k=0;k<64&&nx[a]!==a;k++)a=nx[a];return nx[a]===a?a:-1;}
const DAY_LEN=240;
function nightLevel(t){const p=(t%DAY_LEN)/DAY_LEN;const d=p<0.55?0:p<0.65?(p-0.55)/0.1:p<0.9?1:1-(p-0.9)/0.1;return Math.max(0,Math.min(1,d));}
function soulRate(G,c){if(c.owner===NEUTRAL||c.sab>G.gt||!c.sup)return 0;const g=c.kind==='m'?1.2*(1+0.6*(c.lv-1)):c.path===2?0.3+0.1*c.lv:0;return g*mod(G,c.owner,'well');}
function growRate(G,c){return c.kind==='m'?0:LV[c.lv].g*(c.path===2?0.7:c.path===4?1.5:1)*mod(G,c.owner,'grow')*(c.sup?1:0.5);}
// offer mode: release pilgrims toward the nearest altar (or sacrifice in place at an altar)
function offerOut(G,c,i){const keep=Math.max(5,0.2*capOf(c));let n=Math.min(PILG_N,Math.floor(Math.min(c.u[0],c.size-keep)+1e-6));if(n<1)return;
  const o=c.owner,nx=G.altN&&G.altN[teamOf(G,o)],nh=nx?nx[i]:-1;if(nh<0)return;
  if(nh===i){c.u[0]=Math.max(0,c.u[0]-n);c.size=c.u[0]+c.u[1]+c.u[2];const v=n*sacYield(G,o,c,0);gainSouls(G.pl[o],v);ev(G,{t:'sac',x:c.x,y:c.y,s:o,n,souls:v,c:i});return;}
  n=Math.min(n,fieldCap(G,o)-G.fieldN[o],MAX_SOL-G.sol.length);if(n<1)return;
  let a=nh;for(let k=0;k<64&&nx[a]!==a&&nx[a]>=0;k++)a=nx[a];
  const g=G.gid++,d0=footW(c)*0.9;for(let k=0;k<n;k++){c.u[0]-=1;c.size-=1;const s=mkSol(G,o,i,nh,d0-Math.floor(k/2)*5.5,k%2?3:-3,0,0,g,null,1);s.alt=a;}}
// ---------- main step ----------
function step(G,rdt){
  if(G.over)return;GG=G;
  const dt=rdt*G.sp;G.time+=rdt;G.gt+=dt;
  G.secT+=rdt;if(G.secT>=1){G.secT=0;supply(G);}
  G.nAlive=G.pl.reduce((a,p)=>a+(p.out?0:1),0);const tot=G.tot.fill(0);
  for(const c of G.castles)if(c.owner!==NEUTRAL)tot[c.owner]+=c.size;
  for(const s of G.sol)if(s.u<3)tot[s.o]+=1;
  for(let s=0;s<8;s++)if(tot[s]>G.pl[s].peak)G.pl[s].peak=tot[s];
  const caps=[];for(let s=0;s<8;s++)caps[s]=G.pl[s].out?0:armyCap(G,s);
  G.castles.forEach((c,i)=>{
    const busy=c.assault>0,plg=c.sab>G.gt;
    if(plg&&c.size>1)scaleT(c,Math.max(1,c.size*(1-0.012*dt)));
    if(c.owner===NEUTRAL){if(!busy&&!plg){c.idle+=dt;if(c.idle>NEUT_IDLE&&c.size<c.base)addT(c,0,Math.min(c.base-c.size,(c.lv>=3?2:c.kind==='m'?1:1.2)*dt));}else c.idle=0;return;}
    const p=G.pl[c.owner];
    if(c.build){c.build.t+=dt;if(c.build.t>=c.build.dur){const k=c.build.k;if(k>=20){c.path=k-20;computeAltars(G);}else c.lv=Math.min(maxLv(c),c.lv+1);c.build=null;ev(G,{t:'built',c:i});}}
    const cap=capOf(c);
    if(c.size>cap)scaleT(c,Math.max(cap,c.size-5*dt));
    else if(!c.build&&!plg&&!busy&&(tot[c.owner]<caps[c.owner]||c.off)){const g=Math.min(cap-c.size,growRate(G,c)*dt);if(g>0){const m=trainMask(c),fm=c.path===4?0.6:1;let k=0;for(let t=0;t<NU;t++)if((m>>t)&1)k++;
      for(let t=0;t<NU;t++)if((m>>t)&1){const n=g/k/UNIT[t].cost,cost=n*UNIT[t].souls*fm;if(cost>0&&p.souls<cost)addT(c,0,g/k);else{p.souls-=cost;addT(c,t,n);}}}}
    const sr=soulRate(G,c);if(sr>0)gainSouls(p,sr*dt);
    for(const L of c.lords){const mx=lordMax(L);if(L.hp<mx)L.hp=Math.min(mx,L.hp+LORD_HEAL*dt);}
    if(c.off&&!busy){c.pt-=dt;if(c.pt<=0){c.pt=PILG_IV*(0.8+G.rng()*0.4);offerOut(G,c,i);}}
    const rd=c.route>=0?G.castles[c.route]:null;c.rwait=!!(rd&&rd.owner!==NEUTRAL&&teamOf(G,rd.owner)===teamOf(G,c.owner)&&rd.size>=capOf(rd)*0.95);
    if(c.route>=0&&!busy&&!c.rwait){c.rt-=dt;if(c.rt<=0){c.rt=ROUTE_IV;const pkt=Math.min(Math.floor(c.size)-1,Math.round(ROUTE_PKT*mod(G,c.owner,'muster')));if(pkt>=2)dispatch(G,c.owner,i,c.route,pkt,7);}}
  });
  // hold-to-muster: the block grows in front of the castle and re-forms in order
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out)continue;
    if(p.pour){const c=G.castles[p.pour.from];if(c.owner!==s){releaseMuster(G,s,p.pour.from);p.pour=null;}
      else{p.pourH+=dt;p.pourA-=dt;if(p.pourA<=0){p.pourA=0.2;const cur=[];let hasL=0;
        for(const x of G.sol)if(x.st===3&&x.o===s&&x.g===p.pour.g&&x.hp>0&&!x.gone){cur.push(x);if(x.u===3)hasL=1;}
        const nt=cur.length-hasL,amt=Math.min(Math.floor(c.size)-1,2+Math.floor(p.pourH*2),10,musterCap(c)-nt,fieldCap(G,s)-G.fieldN[s],MAX_SOL-G.sol.length);let added=0;
        for(let k=0;k<amt;k++){const t=takeT(G,c,p.mix);if(t<0)break;cur.push(t);added++;}
        let lr=null;if(!hasL&&!p.pour.lt&&(p.mix&8)&&nt+added>=6&&c.lords.length){lr=c.lords.shift();p.pour.lt=1;added++;}
        if(added)placeBlock(G,s,p.pour.from,p.pour.to,cur,footW(c)+5,1,3,p.pour.g,lr);}}}
    p.hm=Math.max(1,(p.hm||1)-0.008*dt);}
  G.scouts=G.scouts.filter(o=>o.until>G.gt);G.frz=G.frz.filter(o=>o.until>G.gt);
  for(const f of G.fires){if(f.done||G.gt<f.at)continue;f.done=true;const T=teamOf(G,f.s),R2=f.r*f.r;
    for(const x of G.sol){if(x.hp<=0||teamOf(G,x.o)===T)continue;if((x.x-f.x)**2+(x.y-f.y)**2<R2){x.hp-=1.0*(0.85+G.rng()*0.3);if(x.hp<=0){G.pl[f.s].kills++;ev(G,{t:'die',x:x.x,y:x.y,o:x.o,u:x.u});}}}
    for(const t of G.tw){if(t.o!==NEUTRAL&&teamOf(G,t.o)===T)continue;if((t.x-f.x)**2+(t.y-f.y)**2<R2*1.96){t.hp-=6;if(t.hp<=0)ev(G,{t:'tdie',x:t.x,y:t.y,o:t.o});}}
    ev(G,{t:'fire',x:f.x,y:f.y});}
  G.fires=G.fires.filter(f=>!f.done||G.gt<f.at+0.1);
  stepSoldiers(G,dt);
  for(const s in G.botT){const slot=+s;if(G.slots[slot].k!=='b'||G.pl[slot].out)continue;
    G.botT[s]-=dt;if(G.botT[s]<=0){botThink(G,slot);const iv=[3.0,1.9,1.1][G.slots[slot].d??1];G.botT[s]=iv*(0.7+G.rng()*0.6);}}
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out)continue;p.inc+=((p.ig||0)/dt-p.inc)*Math.min(1,dt/8);p.ig=0;}
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out)continue;const cap=G.castles[G.capIdx[s]];if(!cap||cap.owner!==s)continue;const busy=cap.assault>0,held=cap.assault<3;
    if(p.wb>=0&&!busy){p.wb+=dt;if(p.wb>=WONDER_T){p.wb=-1;p.ws++;ev(G,{t:p.ws>=WONDER_STAGES?'wdone':'wstage',s,stage:p.ws});}}
    if(p.ws>=WONDER_STAGES&&!held)p.wh=Math.max(0,p.wh-2*dt);
    if(p.ws>=WONDER_STAGES&&held){p.wh+=dt;if(p.wh>=WONDER_HOLD){G.over=true;G.winner=teamOf(G,s);G.winBy='wonder';return;}}}
  checkWin(G);
}
function stepSoldiers(G,dt){
  const S=G.sol,C=G.castles;const CELL=32,grid=new Map();
  for(const s of S){s.px=s.x;s.py=s.y;const k=((s.x/CELL)|0)*4096+((s.y/CELL)|0);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(s);}
  for(const t of G.tw){t.tm=teamOf(G,t.o);const k=((t.x/CELL)|0)*4096+((t.y/CELL)|0);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(t);}
  for(const s of S)s.tm=teamOf(G,s.o);
  const LD=[],dmgM=[];for(const s of S)if(s.u===3&&s.hp>0)LD.push(s);for(let o=0;o<8;o++)dmgM[o]=mod(G,o,'dmg');
  // group state: centre and nearest enemy, used for battle formations
  const GR=new Map();for(const s of S){if(!s.g)continue;let r=GR.get(s.g);if(!r)GR.set(s.g,r={x:0,y:0,n:0,vmin:9e9,ex:0,ey:0,en:0});r.x+=s.x;r.y+=s.y;r.n++;if(s.st===0){const v=solSpeed(G,s);if(v<r.vmin)r.vmin=v;}}
  for(const [g,r] of GR){r.x/=r.n;r.y/=r.n;const any=S.find(s=>s.g===g);if(!any)continue;const tm=any.tm;const gx=(r.x/CELL)|0,gy=(r.y/CELL)|0;let bd=90*90;
    for(let ix=gx-3;ix<=gx+3;ix++)for(let iy=gy-3;iy<=gy+3;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tm===tm||o.tw)continue;const d=(o.x-r.x)**2+(o.y-r.y)**2;if(d<bd){bd=d;r.ex=o.x;r.ey=o.y;r.en=1;}}}}
  G.GR=GR;
  if((G.mergeT=(G.mergeT||0)+dt)>1){G.mergeT=0;const key=new Map();for(const s of S){if(s.st!==0||!s.g)continue;const k=s.o+':'+s.e+':'+s.from+':'+s.sac;const r=GR.get(s.g);if(!r)continue;let L=key.get(k);if(!L)key.set(k,L=new Map());L.set(s.g,r);}
    for(const L of key.values()){const gs=[...L.entries()];for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){const [ga,ra]=gs[i],[gb,rb]=gs[j];if(ra.n&&rb.n&&Math.hypot(ra.x-rb.x,ra.y-rb.y)<26){const keep=ra.n>=rb.n?ga:gb,drop=keep===ga?gb:ga;for(const s of S)if(s.g===drop)s.g=keep;(keep===ga?ra:rb).n+=(keep===ga?rb:ra).n;(keep===ga?rb:ra).n=0;}}}}
  // towers shoot the nearest enemy in range
  for(const t of G.tw){if(t.hp<=0)continue;const TM=t.mx=towerMax(G,t);if(t.bt<=0&&t.hp<TM&&G.gt-(t.lh||0)>5)t.hp=Math.min(TM,t.hp+0.6*dt);if(t.bt>0){t.bt-=dt;t.hp=Math.min(TM,t.hp+TM*0.5*dt/TOWER_T);continue;}
    t.cd-=dt;if(t.cd>0)continue;const gx=(t.x/CELL)|0,gy=(t.y/CELL)|0;let best=null,bd=TOWER_R*TOWER_R;
    for(let ix=gx-3;ix<=gx+3;ix++)for(let iy=gy-3;iy<=gy+3;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tw||o.tm===t.tm)continue;const d=(o.x-t.x)**2+(o.y-t.y)**2;if(d<bd){bd=d;best=o;}}}
    if(best){t.cd=0.42*TOWER_HP/TM;ev(G,{t:'shot',x:t.x,y:t.y-14,tx:best.x,ty:best.y});best.hp-=0.5;if(best.hp<=0){if(G.pl[t.o])G.pl[t.o].kills++;ev(G,{t:'die',x:best.x,y:best.y,o:best.o,u:best.u});}}}
  for(const c of C){c.assault=0;c._atk=null;}
  const dmgOf=s=>UNIT[s.u].dmg*dmgM[s.o]*(1+0.2*(s.rk|0))*(s.fz>G.gt?1.4:1)*(s.au?1+0.2*s.au:1);
  const hitUnit=(s,t,mul)=>{t.hp-=dmgOf(s)*counterMul(s.u,t.u)*mul*(0.8+G.rng()*0.4);if(t.hp<=0){G.pl[s.o].kills++;s.xp=(s.xp|0)+1;const nr=s.xp>=9?3:s.xp>=5?2:s.xp>=2?1:0;if(nr>(s.rk|0)){s.hp*=(1+0.2*nr)/(1+0.2*(s.rk|0));s.rk=nr;ev(G,{t:'rank',x:s.x,y:s.y,o:s.o,rk:nr});}ev(G,{t:'die',x:t.x,y:t.y,o:t.o,u:t.u});}};
  for(const s of S){if(s.hp<=0)continue;
    const v=solSpeed(G,s)*dt;const U=UNIT[s.u];
    // targeting; the aura of the best own lord nearby is refreshed with it
    s.tt-=dt;if(s.tt<=0){s.tt=0.2+G.rng()*0.15;let best=null;
      s.au=0;for(const l of LD)if(l.o===s.o&&(l.x-s.x)**2+(l.y-s.y)**2<LORD_R*LORD_R){const m=mod(G,l.o,'laura');if(m>s.au)s.au=m;}
      {const R=s.u===2?110:ENGAGE;let bd=R*R;const gx=(s.x/CELL)|0,gy=(s.y/CELL)|0,rc=s.u===2?4:1;
        for(let ix=gx-rc;ix<=gx+rc;ix++)for(let iy=gy-rc;iy<=gy+rc;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tm===s.tm)continue;let d=(o.x-s.x)**2+(o.y-s.y)**2;
          if(s.u===2){ // greater demons look past the line of lesser demons for minions and spires
            if(o.u===0&&!o.tw)d*=0.45;else if(o.tw)d*=0.7;}
          else if(d>ENGAGE*ENGAGE)continue;
          if(d<bd){bd=d;best=o;}}}}
      s.tgt=best;}
    if(s.tgt&&s.tgt.hp>0){if(s.st!==1){s.ret=s.st;s.st=1;}
      const dx=s.tgt.x-s.x,dy=s.tgt.y-s.y,d=Math.hypot(dx,dy)||1;s.hx=dx/d;s.hy=dy/d;
      const T=s.tgt.tw?{u:4}:s.tgt;
      if(false){ // (no ranged units)
        if(d>U.range){const r=s.g&&G.GR.get(s.g);if(r&&r.en&&d<U.range*1.6){/* hold in formation */}else{const m=Math.min(d-U.range*0.9,v*0.95);s.x+=dx/d*m;s.y+=dy/d*m;}}
        else{s.cd-=dt;if(s.cd<=0){s.cd=1.0*(0.8+G.rng()*0.4);ev(G,{t:'shot',x:s.x,y:s.y,tx:s.tgt.x,ty:s.tgt.y});if(s.tgt.tw){s.tgt.hp-=0.15;if(s.tgt.hp<=0)ev(G,{t:'tdie',x:s.tgt.x,y:s.tgt.y,o:s.tgt.o});}else hitUnit(s,s.tgt,1);}}}
      else if(d>MELEE+(s.tgt.tw?6:0)){let mx=dx/d,my=dy/d;
        if(s.u===2&&!s.tgt.tw&&s.tgt.u!==1){ // swing around enemy lesser demons on the way to softer targets
          let rx=0,ry=0;const gx=(s.x/CELL)|0,gy=(s.y/CELL)|0;for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tm===s.tm||o.u!==1||o.tw)continue;const ox=s.x-o.x,oy=s.y-o.y,od=ox*ox+oy*oy;if(od<30*30&&od>0.01){rx+=ox/od;ry+=oy/od;}}}
          const rl=Math.hypot(rx,ry);if(rl>0){mx+=rx/rl*1.3;my+=ry/rl*1.3;const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;}}
        const m=Math.min(d-MELEE*0.8,v*(s.u===2?1.1:0.95));s.x+=mx*m;s.y+=my*m;}
      else{s.cd-=dt;if(s.cd<=0){s.cd=CD_F*(0.8+G.rng()*0.4);
        if(s.tgt.tw){s.tgt.lh=G.gt;s.tgt.hp-=dmgOf(s)*0.5*(0.8+G.rng()*0.4);if(s.tgt.hp<=0)ev(G,{t:'tdie',x:s.tgt.x,y:s.tgt.y,o:s.tgt.o});}
        else{hitUnit(s,s.tgt,s.ch?2:1);}s.ch=false;}}
      continue;}
    if(s.st===0&&s.u===0&&s.g&&!s.sac){const r=G.GR.get(s.g);if(r&&r.en){const dx=r.ex-s.x,dy=r.ey-s.y,d=Math.hypot(dx,dy)||1;if(d<70&&d>MELEE){const m=Math.min(d-MELEE,v*0.9);s.x+=dx/d*m;s.y+=dy/d*m;s.hx=dx/d;s.hy=dy/d;continue;}}}
    if(s.st===1){s.st=s.ret;s.tgt=null;if(s.st===0){const e=G.edges[s.e],f=C[s.from],sg=e.a===s.from?1:-1;s.d=Math.max(0,(s.x-f.x)*e.ux*sg+(s.y-f.y)*e.uy*sg);s.ch=s.u===2;}}
    if(s.st===0||s.st===3){
      if(s.st===0){const r=s.g&&G.GR.get(s.g);s.d+=r&&r.vmin<9e8?Math.min(v,r.vmin*dt*1.04+(r.vmin*dt*0.08)):v;}const p=roadPt(G,s);const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);
      if(d>0.01){const m=Math.min(d,v*1.3+0.5);s.x+=dx/d*m;s.y+=dy/d*m;}if(s.st===0){s.hx=p.ux;s.hy=p.uy;}
      if(s.st===0){const e=G.edges[s.e];const dest=C[s.to];if(s.d>=e.len-footW(dest)*0.85)arriveSol(G,s);}
      continue;}
    if(s.st===2){const c=C[s.to];
      if(c.owner!==NEUTRAL&&teamOf(G,c.owner)===s.tm){enterCastle(G,s,c);continue;}
      const dx=s.wx-s.x,dy=s.wy-s.y,d=Math.hypot(dx,dy);
      if(d>1){const m=Math.min(d,v);s.x+=dx/d*m;s.y+=dy/d*m;s.hx=dx/d;s.hy=dy/d;}
      else{s.hx=(c.x-s.x);s.hy=(c.y-s.y);const hl=Math.hypot(s.hx,s.hy)||1;s.hx/=hl;s.hy/=hl;
        (c._atk||(c._atk=[])).push(s);
        s.cd-=dt;if(s.cd<=0){s.cd=CD_W*(0.8+G.rng()*0.4);const walled=isWalled(c)&&!breached(G,c),siege=s.u>=2||mod(G,s.o,'siege');const dmg=HIT_W*U.wall*dmgOf(s)/U.dmg*(walled&&!siege?0.35:1)/defMul(G,c);scaleT(c,c.size-dmg);c.last=s.o;c.idle=0;
          if(c.size<=0.001)capture(G,s.to,s.o);}}}
  }
  // garrisons fire back (Dark Towers and lords add fire)
  C.forEach((c,i)=>{const atk=c._atk;if(!atk||!atk.length){c.fire=0;return;}c.assault=atk.length;
    c.fire+=garrisonFire(c)*FIRE*dt;
    while(c.fire>=1){const alive=atk.filter(s=>s.hp>0);if(!alive.length){c.fire=0;break;}const s=alive[Math.floor(G.rng()*alive.length)];s.hp-=1;c.fire-=1;if(s.hp<=0)ev(G,{t:'die',x:s.x,y:s.y,o:s.o,u:s.u});}});
  let w=0;for(const s of S){if(s.hp>0&&!s.gone)S[w++]=s;else{G.fieldN[s.o]--;if(s.lord&&!s.gone)lordDie(G,s.lord,s.x,s.y);}}S.length=w;
  G.tw=G.tw.filter(t=>t.hp>0);
}
function enterCastle(G,s,c){
  if(s.u===3){const L=s.lord;if(L){L.hp=s.hp;L.rk=s.rk|0;L.xp=s.xp|0;c.lords.push(L);s.lord=null;}s.gone=true;s.hp=0;return;}
  if(s.rk)c.vp=(c.vp||0)+s.rk;if(c.size>=capOf(c)-0.5)G.waste=(G.waste||0)+1;addT(c,s.u,1);s.gone=true;s.hp=0;}
function sacSol(G,s,ci){const v=sacYield(G,s.o,G.castles[ci],s.rk);gainSouls(G.pl[s.o],v);ev(G,{t:'sac',x:s.x,y:s.y,s:s.o,n:1,souls:v,c:ci});s.gone=true;s.hp=0;}
// pilgrims pass through friendly castles toward the nearest altar; everything else garrisons or attacks
function arriveSol(G,s){const c=G.castles[s.to];
  if(c.owner!==NEUTRAL&&teamOf(G,c.owner)===teamOf(G,s.o)){
    if(s.sac){if(isAltar(c)){sacSol(G,s,s.to);return;}const nx=G.altN&&G.altN[teamOf(G,s.o)],nh=nx?nx[s.to]:-1,e=nh>=0?G.edgeKey[s.to+'_'+nh]:undefined;
      if(e!==undefined){s.from=s.to;s.to=nh;s.e=e;s.d=footW(c)*0.85;s.st=0;return;}s.sac=0;}
    enterCastle(G,s,c);return;}
  s.sac=0;s.st=2;const f=footW(c);const a=Math.atan2(s.y-c.y,s.x-c.x)+(G.rng()-.5)*1.1;const r=f+3+G.rng()*6;s.wx=c.x+Math.cos(a)*r;s.wy=c.y+Math.sin(a)*r*0.72+2;}
function capture(G,i,by){
  const c=G.castles[i],prev=c.owner,wasCap=c.capital;
  if(G.pl[by].out)return;
  const oldLv=c.lv,wasWalled=isWalled(c);
  for(const L of c.lords)lordDie(G,L,c.x,c.y);c.lords=[];
  c.owner=by;c.route=-1;c.build=null;c.off=0;c.sab=0;c.capital=-1;c.size=0;c.u=[0,0,0];c.fire=0;c.tr=1;c.path=0;c.vp=0;c.lordCd=0;
  if(c.kind!=='m'){c.lv=Math.max(1,Math.min(c.lv,5)-1);if(c.kind==='v'||c.kind==='f')c.kind='c';c.nw=0;}
  // the victors march in
  const T=teamOf(G,by);for(const s of G.sol)if(s.hp>0&&s.st===2&&s.to===i&&teamOf(G,s.o)===T){s.sac=0;enterCastle(G,s,c);}
  // muster blocks of the old owner outside this castle are released
  if(prev!==NEUTRAL)for(const s of G.sol)if(s.st===3&&s.from===i)s.st=0;
  for(const t of G.tw)if(t.from===i)t.o=by;
  const loot=Math.round(8*oldLv+(wasWalled?60:0));gainSouls(G.pl[by],loot);G.pl[by].taken++;
  ev(G,{t:'cap',c:i,by,loot,drop:oldLv>c.lv});
  if(wasCap>=0&&prev!==NEUTRAL)eliminate(G,prev,by);
  supply(G);
}
function eliminate(G,s,by){
  const p=G.pl[s];if(p.out)return;p.out=true;p.pour=null;p.offer=null;
  G.castles.forEach(c=>{c.lords=c.lords.filter(L=>L.o!==s);if(c.owner===s){c.owner=NEUTRAL;c.base=Math.max(10,Math.round(c.size));c.idle=0;c.route=-1;c.build=null;c.off=0;c.capital=-1;c.lords=[];}});
  for(const x of G.sol)if(x.o===s){x.hp=0;x.lord=null;}
  G.tw=G.tw.filter(t=>t.o!==s);
  ev(G,{t:'elim',s,by});
}
function aliveTeams(G){const t=new Set();G.slots.forEach((sl,i)=>{if((sl.k==='h'||sl.k==='b')&&!G.pl[i].out)t.add(teamOf(G,i));});return t;}
function checkWin(G){const t=aliveTeams(G);if(t.size<=1){G.over=true;G.winner=[...t][0]||null;}}
// troops needed to take a castle (Lanchester estimate)
function needToTake(G,slot,c,extra,sf){const walled=isWalled(c)&&!(c.br>G.gt);sf=Math.min(1,sf||0);const hit=HIT_W/CD_W*mod(G,slot,'dmg')*(walled&&!mod(G,slot,'siege')?sf+(1-sf)*0.35:1);const g=Math.max(0,c.size);const fire=g>0?garrisonFire(c)/g:1;return g*Math.sqrt(FIRE*fire*defMul(G,c)/hit)*1.12+(extra||0)+3;}
// ---------- bots (fog-limited) ----------
function botView(G,slot){
  if(typeof process!=='undefined'&&process.env&&process.env.BOTSEE)return{V:G.castles,seen:()=>true};
  const T=teamOf(G,slot),C=G.castles,nv=1-0.4*nightLevel(G.time);const mem=(G.botMem||(G.botMem={}))[T]||(G.botMem[T]=[]);
  const src=[];C.forEach(c=>{if(c.owner===NEUTRAL||teamOf(G,c.owner)!==T)return;src.push([c.x,c.y,castleVision(c)*nv]);});
  let k=0;for(const x of G.sol)if(x.tm===T&&(k++%2===0))src.push([x.x,x.y,100*nv]);
  for(const t of G.tw)if(t.o!==NEUTRAL&&teamOf(G,t.o)===T)src.push([t.x,t.y,130*nv]);
  for(const o of G.scouts)if(teamOf(G,o.s)===T)src.push([o.x,o.y,o.r||330]);
  const seen=(x,y)=>{for(const q of src){const dx=x-q[0],dy=y-q[1];if(dx*dx+dy*dy<q[2]*q[2])return true;}return false;};
  const V=C.map((c,i)=>{const mine=c.owner!==NEUTRAL&&teamOf(G,c.owner)===T;if(mine||seen(c.x,c.y)){mem[i]={...c,u:[...c.u],lords:[...c.lords],seenAt:G.gt};return c;}
    if(mem[i])return mem[i];return{...c,owner:NEUTRAL,capital:-1,path:0,off:0,lords:[],size:c.kind==='f'?65:c.kind==='m'?16:26,u:[c.kind==='f'?45:c.kind==='m'?16:26,c.kind==='f'?20:0,0],assault:0,build:null};});
  return{V,seen};}
// card preferences per personality, indexed by card id
const BOT_PREF=[[3,2,1,2,2,2,3,3,3,2,2,3,2,2,1,2,2,1,4,3,1,3,2,2,1],[2,1,1,1,1,1,4,4,3,3,1,4,3,3,0,3,2,2,3,4,1,4,2,2,1],
 [3,2,1,2,3,3,3,2,3,1,4,2,1,1,4,2,2,1,4,2,1,2,3,2,2],[4,4,3,4,3,3,3,2,2,1,2,2,1,1,1,1,1,1,3,2,1,2,3,2,1]];
function botCard(G,slot,pe,x){const p=G.pl[slot];let bi=0,bv=-1;
  p.offer.forEach((id,i)=>{const c=CARDS[id];let v=BOT_PREF[pe][id]*(0.75+0.5*G.rng())/(1+0.15*(p.cards[id]|0));
    if(G.slots[slot].noArmy&&c.tag==='war')v*=0.05;
    if(c.key==='well')v*=x.wells?1+0.3*x.wells:0.3;else if(c.key==='pilgrim')v*=x.offering?1:0.3;else if(c.key==='tithe')v*=x.offering?1.2:0.6;
    else if(c.key==='acap')v*=x.capped?1.5:0.8;else if(c.key==='siege')v*=x.walled?3:0.6;else if(c.sp>=0&&!p.spells.some(v=>v>=0))v*=1.5;
    if(v>bv){bv=v;bi=i;}});
  return bi;}
function botThink(G,slot){
  const R=G.rng,SL=G.slots[slot],diff=SL.d??1,pe=SL.pe|0,my=teamOf(G,slot),BV=botView(G,slot),C=BV.V,n=C.length,p=G.pl[slot];const SOL=G.sol.filter(x=>x.tm===my||BV.seen(x.x,x.y));
  const isMine=i=>C[i].owner!==NEUTRAL&&teamOf(G,C[i].owner)===my;
  const fd=new Array(n).fill(1e9),q=[];
  for(let i=0;i<n;i++)if(!isMine(i)){fd[i]=0;q.push(i);}
  for(let h=0;h<q.length;h++){const u=q[h];for(const {to} of G.adj[u])if(fd[to]>fd[u]+1){fd[to]=fd[u]+1;q.push(to);}}
  const inc=new Array(n).fill(0),threat=new Array(n).fill(0);
  for(const s of SOL){if(s.tm===undefined)continue;if(s.tm===my){if(!s.sac)inc[s.to]+=1;}else threat[s.to]+=1;}
  const mine=[];for(let i=0;i<n;i++)if(C[i].owner===slot)mine.push(i);
  const capI=G.capIdx[slot],capC=C[capI];
  const aggr=[1,0.85,1.35,1.15][pe];
  const room=i=>capOf(C[i])-C[i].size-inc[i];
  const st=G.botStuck||(G.botStuck={});const stuck=(st[slot]||0)>=5; // several thinks in a row with nothing worth attacking
  const tot=G.tot[slot],cap=armyCap(G,slot),capped=tot>=cap*0.9,noArmy=!!SL.noArmy;
  const altN=G.altN&&G.altN[my],wf=SL.wonderFirst&&G.gt>150&&p.ws<WONDER_STAGES;
  const enemyNb=ci=>G.adj[ci].some(({to})=>C[to].owner!==NEUTRAL&&!isMine(to));
  const spSlot=id=>{const k=p.spells.indexOf(id);return k>=0&&p.cd[k]<=G.gt&&p.souls>=spellCost(G,slot,id)?k:-1;};
  let saving=wf&&capC.lv>=3?WONDER_COST:0;
  // keep a rival's Hellgate from finishing: stream raids at their Throne so its hold timer rolls back
  const raid=new Set();
  for(let o=0;o<8;o++){const po=G.pl[o];if(o===slot||po.out||teamOf(G,o)===my||po.ws<WONDER_STAGES-1)continue;const ci2=G.capIdx[o];if(ci2===undefined||C[ci2].owner!==o)continue;raid.add(ci2);
    for(const {to} of G.adj[ci2]){const c=C[to];if(c.owner===slot&&c.route!==ci2&&c.size>6)setRoute(G,slot,to,ci2);}}
  // economy: offer the safest castles (more when capped or stuck); spend in priority order, saving for what comes first
  const hgo=capC.lv>=3&&G.opts.wonder!==0&&p.ws<WONDER_STAGES&&(wf||stuck&&G.gt>420||pe===3&&G.gt>360||p.souls>WONDER_COST+400);
  if(diff>0||R()<0.5){
    const share=wf?0.8:capped?0.7:G.gt<75?(pe===3?0.34:0):[0.34,0.2,0.3,0.55][pe]*(stuck&&!hgo?0.5:1);
    const oc=mine.filter(ci=>{const c=C[ci];return c.kind!=='m'&&c.capital<0&&altN&&altN[ci]>=0&&threat[ci]===0&&!c.assault&&!raid.has(c.route)&&(fd[ci]>=2||!enemyNb(ci)||capped||stuck);})
      .sort((a,b)=>fd[b]-fd[a]||C[b].size-C[a].size);
    const offSet=new Set(oc.slice(0,Math.round(Math.max(0,mine.length-1)*share+(share>0?0.4:0))));let offering=0;
    for(const ci of mine){const c=C[ci];if(c.kind==='m')continue;const want=offSet.has(ci)?1:0;if(c.off!==want)setOffer(G,slot,ci,want);if(want){offering++;if(c.route>=0)c.route=-1;}}
    if((capped||wf)&&capC.owner===slot&&threat[capI]===0&&!capC.assault&&capC.size>capOf(capC)*0.75)sacrifice(G,slot,capI);
    const ctx={wells:mine.filter(ci=>C[ci].path===2||C[ci].kind==='m').length,offering,capped,walled:mine.some(ci=>G.adj[ci].some(({to})=>!isMine(to)&&isWalled(C[to])))};
    const buy=(cost,f)=>{if(p.souls-saving>=cost){if(f())return true;}else saving=Math.max(saving,cost);return false;};
    // 1. the Throne's path first (Hellforge or Dark Tower), then its level: army cap, growth, Hellgate requirement
    if(capC.owner===slot&&!capC.build&&!capC.path&&capC.lv>=3&&!wf)buy(pathCost(G,slot),()=>choosePath(G,slot,capI,pe===1?4:3));
    if(capC.owner===slot&&!capC.build&&capC.lv<maxLv(capC)&&(tot>cap*0.6||(capC.lv<3&&(G.gt>200||wf))||wf)&&(capC.path||capC.lv<3||wf))buy(upCost(G,slot,capC),()=>upgrade(G,slot,capI));
    // 2. Hellgate for the Harvester, the wonder-first sims and stuck bots
    const hg=capC.owner===slot&&capC.lv>=3&&p.wb<0&&p.ws<WONDER_STAGES&&(G.opts.wonder!==0)&&hgo;
    if(hg)buy(WONDER_COST,()=>buildWonder(G,slot));
    // 3. research cards
    if(!SL.noRes){if(p.offer)pickCard(G,slot,botCard(G,slot,pe,ctx));
      if(!p.offer){const rc=researchCost(G,slot)+(pe===1?40:0);if(p.souls-saving>=rc){if(drawResearch(G,slot))pickCard(G,slot,botCard(G,slot,pe,ctx));}else if(!wf)saving=Math.max(saving,rc*0.5);}}
    // 4. paths: Soul Wells in the rear, a Dark Tower, Hellforge or Bastion at the front
    if(!wf){const hasDT=mine.some(ci=>C[ci].path===3||(C[ci].build&&C[ci].build.k===23));
      for(const ci of mine){const c=C[ci];if(c.path||c.build||c.lv<3||c.kind==='m')continue;
        let pth=c.capital>=0?(pe===1?4:3):c.off||fd[ci]>=2?2:[4,4,1,1][pe];if(!hasDT&&c.capital<0&&pth!==2&&pe!==3)pth=3;
        if(buy(pathCost(G,slot),()=>choosePath(G,slot,ci,pth)))break;}}
    // 5. lords from idle Dark Towers
    if(!noArmy&&!wf)for(const ci of mine){const c=C[ci];if(c.path!==3)continue;const ls=lordStatus(G,slot,ci);if(ls.can||ls.why.startsWith('Needs')){buy(ls.price,()=>hireLord(G,slot,ci));break;}}
    // 6. other castle levels: offering castles breed souls, front castles hold more
    if(!wf){let best=-1,bs=0;
      for(const ci of mine){const c=C[ci];if(c.build||c.lv>=maxLv(c)||c.capital>=0||threat[ci]>0)continue;
        const sc=(c.kind==='m'?2.5:1)*(c.off?(pe===3?1.8:1.3):fd[ci]<=1?1.1:0.7)/(c.lv+1);if(sc>bs){bs=sc;best=ci;}}
      if(best>=0)buy(upCost(G,slot,C[best])+20,()=>upgrade(G,slot,best));}
    // 7. promotions once the army is capped
    if(!noArmy&&!wf&&(capped||p.souls-saving>200)){const fr=mine.filter(ci=>!C[ci].off&&C[ci].kind!=='m').sort((a,b)=>fd[a]-fd[b]||C[b].size-C[a].size);
      for(const ci of fr){const c=C[ci];const t=unitOk(c,2)&&c.u[1]>=5?2:1;if(p.souls-saving>=promoCost(G,slot,c,t)*5+(capped?0:150)&&promoCount(G,slot,c,t)>=3&&promote(G,slot,ci,t))break;}}
    // 8. spires and summons
    if(!wf&&p.souls-saving>(pe===2?90:160)&&R()<(pe===2?0.5:0.2)){for(const ci of mine){if(fd[ci]!==1)continue;let done=false;for(const {to,e} of G.adj[ci]){if(isMine(to)||towerOn(G,slot,e,ci))continue;if(buildTower(G,slot,ci,to)){done=true;break;}}if(done)break;}}
    if(p.souls-saving>120&&diff>0)for(const ci of mine){const c=C[ci];if(c.kind==='m'||c.size>capOf(c)*0.7)continue;if(threat[ci]>c.size*0.4){if(summon(G,slot,ci))break;}}
    // surplus: never sit on a big hoard
    if(p.souls-saving>400&&diff>0){let spent=false;
      if(!SL.noRes&&!p.offer&&drawResearch(G,slot)){pickCard(G,slot,botCard(G,slot,pe,ctx));spent=true;}
      if(!spent&&capC.owner===slot&&capC.lv>=3&&p.wb<0&&p.ws<WONDER_STAGES&&p.souls>=WONDER_COST&&G.opts.wonder!==0){buildWonder(G,slot);spent=true;}
      if(!spent)for(const ci of mine){const c=C[ci];if(!c.build&&c.lv<maxLv(c)&&threat[ci]===0&&p.souls>=upCost(G,slot,c)){upgrade(G,slot,ci);break;}}
      if(!noArmy)for(const ci of mine){const c=C[ci];if(!c.off&&promoCount(G,slot,c,unitOk(c,2)&&c.u[1]>=5?2:1)>=5){promote(G,slot,ci,unitOk(c,2)&&c.u[1]>=5?2:1);break;}}}
  }
  // training: specialists at the front and at the Throne while souls last
  for(const ci of mine){const c=C[ci];let m=1;
    if(!c.off&&!wf&&!noArmy&&c.kind!=='m'&&(fd[ci]<=1||c.capital>=0)&&p.souls-saving>30){for(let t=1;t<NU;t++)if(unitOk(c,t)&&(t===1||p.souls-saving>80||c.path===4))m|=1<<t;if(m>1&&pe===1&&c.capital<0)m&=~1;}
    if(c.tr!==m)c.tr=m;}
  // spells
  if(diff>=1)for(let k=0;k<2;k++){const id=p.spells[k];if(id<0||p.cd[k]>G.gt)continue;if(p.souls-spellCost(G,slot,id)<(diff===2?5:40))continue;
    if(id===0){const r=spellR(G,slot,0),en=SOL.filter(x=>x.tm!==my&&x.hp>0);let best=null,bn=diff===2?8:12;
      for(let j=0;j<en.length;j+=Math.max(1,Math.floor(en.length/40))){const a=en[j];let m=0;for(const b of en)if((b.x-a.x)**2+(b.y-a.y)**2<r*r*0.8)m++;if(m>bn){bn=m;best=a;}}
      if(best)useSpell(G,slot,k,best.x,best.y);}
    else if(id===3){const ow=G.sol.filter(x=>x.o===slot&&(x.st===1||x.st===2)),r=spellR(G,slot,3);let best=null,bn=11;
      for(let j=0;j<ow.length;j+=Math.max(1,Math.floor(ow.length/30))){const a=ow[j];let m=0;for(const b of ow)if((b.x-a.x)**2+(b.y-a.y)**2<r*r)m++;if(m>bn){bn=m;best=a;}}
      if(best)useSpell(G,slot,k,best.x,best.y);}
    else if(id===4){let t=-1;for(let o=0;o<8;o++){const po=G.pl[o];if(o===slot||po.out||teamOf(G,o)===my||po.ws<1)continue;const ci=G.capIdx[o];if(ci!==undefined&&C[ci].owner===o&&!(C[ci].sab>G.gt)){t=ci;break;}}
      if(t<0&&R()<0.25){let bv=35;for(const ci of mine)for(const {to} of G.adj[ci]){const c=C[to];if(isMine(to)||c.owner===NEUTRAL||c.sab>G.gt)continue;if(c.size>bv){bv=c.size;t=to;}}}
      if(t>=0)useSpell(G,slot,k,t);}
    else if(id===2&&(stuck||R()<0.06)&&p.souls>120){let t=-1,bd=1e18;for(let i=0;i<n;i++){if(isMine(i)||BV.seen(C[i].x,C[i].y))continue;for(const ci of mine){const d=(C[i].x-C[ci].x)**2+(C[i].y-C[ci].y)**2;if(d<bd){bd=d;t=i;}}}
      if(t>=0)useSpell(G,slot,k,C[t].x,C[t].y);}}
  // defend: send help to castles under assault
  for(const ci of mine){const c=C[ci];if(threat[ci]>0&&(c.assault>0||threat[ci]>c.size*0.8)){
    let need2=Math.max(0,Math.min(capOf(c)-c.size,threat[ci]*1.3-c.size)+5);for(const {to} of G.adj[ci]){if(need2<=0)break;const o=C[to];if(o.owner===slot&&o.size>10&&o.assault===0&&(o.capital<0||o.size>30)){const n=Math.min(Math.floor(o.size*0.6),Math.ceil(need2));need2-=n;dispatch(G,slot,to,ci,n);}}}}
  let acts=0;const maxA=[1,2,3][diff];st[slot]=(st[slot]||0)+1; // reset below whenever a worthwhile target exists
  mine.sort((x,y)=>C[y].size-C[x].size);
  let shK=spSlot(1);const lm=(c,amt)=>!noArmy&&c.lords.length&&amt>=12?15:7;
  for(const ci of mine){
    if(acts>=maxA)break;const c=C[ci];if(c.assault>0)continue;
    if(fd[ci]>1){
      if(c.off){if(c.route>=0&&!raid.has(c.route))c.route=-1;continue;}
      let bt=-1,bs2=-1e9;for(const {to} of G.adj[ci])if(isMine(to)&&fd[to]<fd[ci]){const sc=room(to)-fd[to]*20;if(sc>bs2){bs2=sc;bt=to;}}
      if(bt>=0&&room(bt)<capOf(C[bt])*0.1)bt=-1; // nowhere useful to send troops: keep them home
      if(c.capital>=0){if(c.route>=0)c.route=-1;if(bt>=0&&c.size>capOf(c)*0.85&&dispatch(G,slot,ci,bt,Math.min(c.size*0.5,room(bt))))acts++;continue;}
      if(bt<0){if(c.route>=0&&!raid.has(c.route)&&isMine(c.route))c.route=-1;continue;}
      if(c.route!==bt&&c.size>capOf(c)*0.5){setRoute(G,slot,ci,bt);acts++;}continue;}
    if(c.route>=0&&!raid.has(c.route))c.route=-1;
    if(raid.has(c.route))continue;
    if(c.size<10||c.build)continue;
    const keep=c.capital>=0?Math.max(15,threat[ci]*1.3):pe===2?c.size*0.3:3,sf=c.size>0?(c.u[2]+(c.lords.length?8:0))/c.size:0;
    let best=-1,bs=0,bneed=0;
    for(const {to,e} of G.adj[ci]){if(isMine(to))continue;const t=C[to];const len=G.edges[e].len;
      const tr=len/SPEED_S;const grow=t.owner===NEUTRAL?0:LV[t.lv].g*tr*G.sp;
      const shw=shK>=0&&isWalled(t)&&!(t.br>G.gt);const need=needToTake(G,slot,{...t,size:t.size+grow,br:shw?G.gt+30:t.br},0,sf)*aggr-inc[to];const spare=c.size-keep;
      if(spare>need){const s=(t.lv*0.5+0.5)*(t.owner===NEUTRAL?1:1.3)*(t.kind==='m'?(pe===3?2.4:1.6):1)*(t.capital>=0?3*(t.owner!==NEUTRAL&&G.pl[t.owner].ws>=3?3:1):1)*(t.assault?1.6:1)*300/((Math.max(need,0)+12)*len);if(s>bs){bs=s;best=to;bneed=need;}}}
    if(best>=0)st[slot]=0;
    if(best>=0&&(diff>0||R()<0.55)){
      const spare=c.size-keep;const amt=Math.min(spare,bneed*(diff===0?1.25:1.1)+4);
      const T=C[best];if(shK>=0&&isWalled(T)&&!(T.br>G.gt)&&useSpell(G,slot,shK,best))shK=-1;if(dispatch(G,slot,ci,best,amt,lm(c,amt))){inc[best]+=amt;acts++;}continue;}
  }
  // muster a big block at a full front castle, then march when it is large enough
  if(diff>0){
    if(p.pour){const pf=p.pour.from,pt=p.pour.to;const c=C[pf],t=C[pt];let mus=0;for(const x of SOL)if(x.o===slot&&x.st===3&&x.from===pf)mus++;
      const need=needToTake(G,slot,t,0)*aggr;
      if(c.owner!==slot||isMine(pt)||mus>=need||c.assault>0||mus>=fieldCap(G,slot)-3||G.gt-(p.massT||0)>100){setPour(G,slot,-1,-1);for(const {to} of G.adj[pf]){const o=C[to];if(o.owner===slot&&o.route===pf)o.route=-1;}}
      else for(const {to} of G.adj[pf]){const o=C[to];if(o.owner===slot&&o.capital<0&&!o.assault&&!o.off&&o.route!==pf&&threat[to]<o.size*0.3)setRoute(G,slot,to,pf);}}
    else if(acts<maxA&&R()<0.6){let bc=-1,bt=-1,bv=0;
      for(const ci of mine){const c=C[ci];if(fd[ci]!==1||c.assault||c.build||c.off||c.size<capOf(c)*0.85||c.capital>=0&&threat[ci]>0)continue;
        for(const {to} of G.adj[ci]){if(isMine(to))continue;const t=C[to];const need=needToTake(G,slot,t,0)*aggr;let feed=0;for(const {to:n2} of G.adj[ci]){const o=C[n2];if(o.owner===slot&&o.capital<0)feed+=o.size*0.8;}if(need>fieldCap(G,slot)-5||need>c.size+feed+40||need>musterCap(c))continue;
          const v=(t.lv*0.5+0.5)*(t.capital>=0?3*(t.owner!==NEUTRAL&&G.pl[t.owner].ws>=3?3:1):1)*(t.kind==='m'?1.5:1)/(need+10);if(v>bv){bv=v;bc=ci;bt=to;}}}
      if(bc>=0){setPour(G,slot,bc,bt);p.massT=G.gt;acts++;st[slot]=0;}}}
  // combined strike from several castles (Shatter on walls, Plague on a big garrison)
  if(diff>0&&acts<maxA){
    let best=-1,bv=0;const sh=spSlot(1)>=0;
    for(let t=0;t<n;t++){if(isMine(t))continue;let sum=0;for(const {to} of G.adj[t]){const c=C[to];if(c.owner===slot&&c.size>=12&&!c.assault)sum+=c.size-(c.capital>=0?20:5);}
      const tc=sh&&isWalled(C[t])?{...C[t],br:G.gt+30}:C[t];const need=needToTake(G,slot,tc,0)*aggr*1.15-inc[t];if(sum>need&&need>0){const v=C[t].lv*(C[t].capital>=0?3:1)/need;if(v>bv){bv=v;best=t;}}}
    if(best>=0)st[slot]=0;
    if(best>=0&&R()<(diff===2?0.9:0.45)){const T=C[best];
      if(isWalled(T)&&!(T.br>G.gt)){const k=spSlot(1);if(k>=0)useSpell(G,slot,k,best);}
      else if(T.owner!==NEUTRAL&&T.size>30&&R()<0.5){const k=spSlot(4);if(k>=0)useSpell(G,slot,k,best);}
      for(const {to} of G.adj[best]){const c=C[to];if(c.owner===slot&&c.size>=12&&!c.assault){const amt=c.size-(c.capital>=0?20:5);dispatch(G,slot,to,best,amt,lm(c,amt));}}}
  }
}
// ---------- network encoding ----------
const KINDS=['c','v','f','m'];
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',B64I=new Int8Array(128);for(let i=0;i<64;i++)B64I[B64.charCodeAt(i)]=i;
const ENC_PLN=17;
function packA(c){return c.lv|((c.route+1)<<3)|((c.off?1:0)<<9)|((c.capital+1)<<10)|((c.sup?1:0)<<14)|(KINDS.indexOf(c.kind)<<15)|((c.assault>0?1:0)<<17)|((c.tr&7)<<18)|((c.nw?1:0)<<21)|((c.path&7)<<22)|(Math.min(3,c.lords.length)<<25);}
function packU(c){const q=v=>Math.min(511,Math.round(Math.max(0,v)));let b=0;if(c.build)b=(c.build.k>=20?c.build.k-19:1)|(Math.min(15,Math.floor(c.build.t/c.build.dur*16))<<3);return q(c.u[1])|(q(c.u[2])<<9)|(b<<18);}
// soldier: 6 chars = x,y at half resolution (10 bits each), owner, heading, state, type, rank, pilgrim flag, variant
function encSol(G,limit){let out='';const S=G.sol;const step=S.length>limit?S.length/limit:1;
  for(let f=0;f<S.length&&out.length<limit*6;f+=step){const s=S[Math.floor(f)];const x=Math.max(0,Math.min(1023,Math.round(s.x/2))),y=Math.max(0,Math.min(1023,Math.round(s.y/2)));
    const h=((Math.round(Math.atan2(s.hy,s.hx)/(Math.PI/4))%8)+8)%8;const v=x|(y<<10);const w=s.o|(h<<3)|(s.st<<6)|(s.u<<8)|((s.rk|0)<<10)|((s.sac?1:0)<<12)|((s.id&7)<<13);
    out+=B64[v&63]+B64[(v>>6)&63]+B64[(v>>12)&63]+B64[((v>>18)&3)|((w&15)<<2)]+B64[(w>>4)&63]+B64[(w>>10)&63];}
  return out;}
function decSol(str){const out=[];for(let i=0;i+5<str.length;i+=6){const a=B64I[str.charCodeAt(i)],b=B64I[str.charCodeAt(i+1)],c=B64I[str.charCodeAt(i+2)],d=B64I[str.charCodeAt(i+3)],e=B64I[str.charCodeAt(i+4)],f=B64I[str.charCodeAt(i+5)];
    const v=a|(b<<6)|(c<<12)|((d&3)<<18);const w=(d>>2)|(e<<4)|(f<<10);const ang=((w>>3)&7)*Math.PI/4;
    out.push({x:(v&1023)*2,y:((v>>10)&1023)*2,o:w&7,hx:Math.cos(ang),hy:Math.sin(ang),st:(w>>6)&3,u:(w>>8)&3,vr:(w>>13)&7,rk:(w>>10)&3,sac:(w>>12)&1});}return out;}
function encode(G,budget){GG=G;const c=[],ld=[],ct=[],li=L=>Math.max(0,LORD_NAMES.indexOf(L.nm));
  G.castles.forEach((k,i)=>{c.push(k.owner|(Math.round(Math.max(0,k.size))<<4),packA(k),packU(k));
    for(const L of k.lords)ld.push(i+1,L.home,L.o,li(L),Math.round(L.hp*10),Math.round(L.max*10),L.rk|0);
    const a=k.sab>G.gt?Math.ceil(k.sab-G.gt):0,b=k.br>G.gt?Math.ceil(k.br-G.gt):0,l=k.lordCd>G.gt?Math.ceil(k.lordCd-G.gt):0;if(a||b||l)ct.push(i,a,b,l);});
  for(const s of G.sol)if(s.lord&&s.hp>0)ld.push(0,s.lord.home,s.lord.o,li(s.lord),Math.round(s.hp*10),Math.round(s.lord.max*10),s.rk|0);
  const pl=[];G.slots.forEach((sl,s)=>{if(sl.k!=='h'&&sl.k!=='b')return;const p=G.pl[s],of=p.offer;
    pl.push(s,Math.floor(p.souls),Math.round(p.earned),Math.round(p.inc*10),p.cards.map(v=>v.toString(36)).join('').replace(/0+$/,''),of?1+of[0]+26*(of[1]??25)+676*(of[2]??25):0,p.rn,(p.spells[0]+1)+6*(p.spells[1]+1),
      Math.max(0,Math.ceil(p.cd[0]-G.gt)),Math.max(0,Math.ceil(p.cd[1]-G.gt)),p.ws|((p.wb>=0?1+Math.min(98,Math.floor(p.wb/WONDER_T*99)):0)<<3)|(Math.min(255,Math.floor(p.wh))<<10),
      (p.out?1:0)|(p.taken<<1),p.kills|0,Math.round((p.hm||1)*100),p.lh|0,Math.round(p.peak),Math.round(G.tot[s]));});
  const sc=[];for(const o of G.scouts)sc.push(Math.round(o.x),Math.round(o.y),o.s,Math.ceil(o.until-G.gt),Math.round(o.r||330));
  const fr=[];for(const f of G.fires)fr.push(Math.round(f.x),Math.round(f.y),f.s,Math.max(0,Math.round((f.at-G.gt)*10)),Math.round(f.r));
  const fz=[];for(const f of G.frz)fz.push(Math.round(f.x),Math.round(f.y),f.s,Math.ceil(f.until-G.gt),Math.round(f.r));
  const tw=[];for(const t of G.tw)tw.push(Math.round(t.x),Math.round(t.y),t.o,Math.round(t.hp*10),(t.bt>0?1:0)|(Math.round(towerMax(G,t))<<1),t.from,t.to);
  const g={c,pl,ld,ct,sc,fr,fz,tw,wb:G.winBy||'',w:G.over?(G.winner||'-'):0,tm:Math.round(G.time),so:''};
  const base=JSON.stringify(g).length;const room=Math.max(0,Math.floor(((budget||3400)-base)/6));g.so=encSol(G,Math.min(room,MAX_SOL));return g;}
function decodeInto(G,g){GG=G;const C=G.castles;
  for(const c of C)c.lords=[];G.flords=[];
  for(let i=0;i<C.length;i++){const S=g.c[3*i];if(S==null)continue;const c=C[i],A=g.c[3*i+1]|0,U=g.c[3*i+2]|0;
    c.owner=S&15;c.size=S>>4;const u1=U&511,u2=(U>>9)&511;c.u=[Math.max(0,c.size-u1-u2),u1,u2];
    c.lv=(A&7)||1;c.route=((A>>3)&63)-1;c.off=(A>>9)&1;c.capital=((A>>10)&15)-1;c.sup=!!((A>>14)&1);c.kind=KINDS[(A>>15)&3]||'c';c.assault=(A>>17)&1;c.tr=(A>>18)&7;c.nw=(A>>21)&1;c.path=(A>>22)&7;
    const b=U>>18,bk=b&7;c.build=bk?{k:bk===1?0:19+bk,t:((b>>3)&15)/16,dur:1}:null;c.sab=0;c.br=0;c.lordCd=0;}
  if(Array.isArray(g.ct))for(let i=0;i+3<g.ct.length;i+=4){const c=C[g.ct[i]];if(!c)continue;c.sab=g.ct[i+1]?G.gt+g.ct[i+1]:0;c.br=g.ct[i+2]?G.gt+g.ct[i+2]:0;c.lordCd=g.ct[i+3]?G.gt+g.ct[i+3]:0;}
  if(Array.isArray(g.ld))for(let i=0;i+6<g.ld.length;i+=7){const L={id:i/7+1,home:g.ld[i+1],o:g.ld[i+2],nm:LORD_NAMES[g.ld[i+3]]||LORD_NAMES[0],hp:g.ld[i+4]/10,max:g.ld[i+5]/10,rk:g.ld[i+6]|0,xp:0},w=g.ld[i];
    if(w>0&&C[w-1])C[w-1].lords.push(L);else G.flords.push(L);}
  G.csol=decSol(g.so||'');G.csolT=Date.now();
  G.tw=[];if(Array.isArray(g.tw))for(let i=0;i+6<g.tw.length;i+=7)G.tw.push({tw:1,x:g.tw[i],y:g.tw[i+1],o:g.tw[i+2],hp:g.tw[i+3]/10,bt:g.tw[i+4]&1,mx:g.tw[i+4]>>1,from:g.tw[i+5],to:g.tw[i+6]});
  if(Array.isArray(g.pl))for(let i=0;i+ENC_PLN-1<g.pl.length;i+=ENC_PLN){const a=g.pl,s=a[i],p=G.pl[s];if(!p)continue;
    p.souls=a[i+1];p.earned=a[i+2];p.inc=a[i+3]/10;const cs=String(a[i+4]||'');p.cards=CARDS.map((c,j)=>j<cs.length?parseInt(cs[j],36)||0:0);
    const of=a[i+5];p.offer=of?[(of-1)%26,Math.floor((of-1)/26)%26,Math.floor((of-1)/676)%26].filter(v=>v<25):null;
    p.rn=a[i+6];p.spells=[a[i+7]%6-1,Math.floor(a[i+7]/6)-1];p.cd=[G.gt+a[i+8],G.gt+a[i+9]];
    {const W=a[i+10]|0;p.ws=W&7;const bp=(W>>3)&127;p.wb=bp?(bp-1)/99*WONDER_T:-1;p.wh=(W>>10)&255;}
    p.out=!!(a[i+11]&1);p.taken=a[i+11]>>1;p.kills=a[i+12]|0;p.hm=(a[i+13]||100)/100;p.lh=a[i+14]|0;p.peak=a[i+15]|0;G.tot[s]=a[i+16]|0;recomputeMods(G,s);}
  G.scouts=[];if(Array.isArray(g.sc))for(let i=0;i+4<g.sc.length;i+=5)G.scouts.push({x:g.sc[i],y:g.sc[i+1],s:g.sc[i+2],until:G.gt+g.sc[i+3],r:g.sc[i+4]});
  G.fires=[];if(Array.isArray(g.fr))for(let i=0;i+4<g.fr.length;i+=5)G.fires.push({x:g.fr[i],y:g.fr[i+1],s:g.fr[i+2],at:G.gt+g.fr[i+3]/10,done:false,cl:1,r:g.fr[i+4]});
  G.frz=[];if(Array.isArray(g.fz))for(let i=0;i+4<g.fz.length;i+=5)G.frz.push({x:g.fz[i],y:g.fz[i+1],s:g.fz[i+2],until:G.gt+g.fz[i+3],r:g.fz[i+4]});
  G.time=g.tm||G.time;computeAltars(G);
  if(g.w&&!G.over){G.over=true;G.winner=g.w==='-'?null:g.w;G.winBy=g.wb||'';}
}
if(typeof module!=='undefined')module.exports={COLORS,NEUTRAL,LV,LVCOST,maxLv,UNIT,NU,PATHS,PATH_COST,PATH_T,LEVEL_T,CARDS,CARD_ID,SPELLS,MAXSPELL,LORD_NAMES,PERS,MAPTYPES,MAPTHEME,MAPGEN,
  WONDER_COST,WONDER_STAGES,WONDER_T,WONDER_HOLD,TOWER_COST,TOWER_HP,TOWER_R,TOWER_T,SUMMON_N,SUMMON_BASE,PROMO_N,PROMO_COST,SAC_N,PILG_N,PILG_IV,PILG_SPD,LORD_R,LORD_CD,MAX_SOL,SPEED_S,ROUTE_IV,ROUTE_PKT,FIRE,HIT_W,CD_W,DAY_LEN,
  genMap,newGame,step,encode,decodeInto,decSol,encSol,teamOf,aliveTeams,checkWin,capture,eliminate,supply,computeAltars,mkRng,segX,
  squad,setRoute,upgrade,setOffer,drawResearch,useSpell,summon,setMix,setTrain,buildTower,choosePath,pickCard,buildWonder,promote,sacrifice,hireLord,dispatch,setPour,
  capOf,armyCap,musterCap,growRate,soulRate,altarOf,defMul,breached,isAltar,isWalled,unitOk,trainMask,upCost,pathCost,promoCost,promoCount,sacPreview,sacYield,summonPrice,towerCost,towerMax,researchCost,
  cardCount,cardEffect,cardOk,recomputeMods,mod,spellCost,spellCd,spellR,spellDurOf,lordStatus,lordPrice,lordOf,lordMax,canLord,castleVision,nightLevel,fieldCap,needToTake,botThink,botView,garrisonFire};
