// ===== Keepfall core v5: simulated soldiers =====
const COLORS=['#e0474c','#3a78f2','#2c9e66','#e2a91f','#8a57d6','#ee7a28','#1fb0c2','#df5aa4'];
const NEUTRAL=9,ROUTE_IV=2.4,ROUTE_PKT=12;
const SPEED_S=25,ENGAGE=26,MELEE=7,HIT_F=0.36,CD_F=0.9,HIT_W=0.155,CD_W=1.25,FIRE=0.155,MAX_SOL=560;
const LV=[null,{cap:40,g:.35},{cap:70,g:.55},{cap:100,g:.8},{cap:130,g:1.0},{cap:160,g:1.2},{cap:190,g:1.4}];
const LVCOST=[0,50,100,160,230,320];let GG=null;
const BLD=[
 {id:'walls',name:'Moat walls',cost:50,desc:'Attackers hit 40% softer; without siege tech, far softer'},
 {id:'barracks',name:'Barracks',cost:60,desc:'Trains spearmen, +15% growth'},
 {id:'market',name:'Market',cost:55,desc:'Doubles this castle’s gold'},
 {id:'tower',name:'Watchtower',cost:45,desc:'Sees far into the fog; archers boost this castle’s fire by 50%'},
 {id:'stables',name:'Stables',cost:70,desc:'Trains knights'},
 {id:'granary',name:'Granary',cost:50,desc:'+40 army cap; this castle holds 20% more'},
 {id:'workshop',name:'Workshop',cost:60,desc:'Soldiers from here hit walls 50% harder'},
 {id:'merc',name:'Mercenary Camp',cost:50,desc:'Hires here are spearmen and cost 25% less'}];
const HIRE_COST=40,HIRE_N=10,HIRE_CD=12;
const TOWER_COST=45,TOWER_HP=22,TOWER_R=95,TOWER_T=6;
const RES=[
 {b:0,t:0,name:'Forced March',desc:'All soldiers march 40% faster'},
 {b:0,t:1,name:'Siegecraft',desc:'Your soldiers hit walls 50% harder',req:0},
 {b:0,t:2,name:'Vanguard',desc:'Captured castles keep level, buildings and path, and gain 5 troops per level',req:1,alt:3},
 {b:0,t:2,name:'Levy',desc:'Every castle holds 25% more troops',req:1,alt:2},
 {b:1,t:0,name:'Coinage',desc:'+20% gold everywhere'},
 {b:1,t:1,name:'Guilds',desc:'Markets earn twice as much',req:4},
 {b:1,t:2,name:'Plunder',desc:'Triple loot from captures, mines +50%',req:5,alt:7},
 {b:1,t:2,name:'Fair Taxes',desc:'Taxed castles keep most of their growth',req:5,alt:6},
 {b:2,t:0,name:'Masonry',desc:'Levels, buildings and towers 25% cheaper; castles 15% sturdier'},
 {b:2,t:1,name:'Engineers',desc:'Building twice as fast; one extra building slot from level 2',req:8},
 {b:2,t:2,name:'Citadel',desc:'Capital 1.6× defense, +40 army cap',req:9,alt:11},
 {b:2,t:2,name:'Logistics',desc:'Routes twice as fast, cut-off castles grow normally, musters 50% larger',req:9,alt:10},
 {b:3,t:0,name:'Drilled Militia',desc:'Militia +20% health and damage',u:0},
 {b:3,t:1,name:'Militia Captains',desc:'Militia another +20%',req:12,u:0},
 {b:3,t:0,name:'Pike Drill',desc:'Spearmen +30% health and damage',u:1},
 {b:3,t:1,name:'Pike Veterans',desc:'Spearmen another +30%',req:14,u:1},
 {b:3,t:0,name:'Knighthood',desc:'Knights +35% health and damage',u:2},
 {b:3,t:1,name:'Plate Armour',desc:'Knights another +35%',req:16,u:2},
 {b:4,t:0,name:'Scrying',desc:'Unlocks Scout; your castles and soldiers see 25% farther'},
 {b:4,t:1,name:'Pyromancy',desc:'Unlocks Fire Rain',req:18},
 {b:4,t:1,name:'Sapping',desc:'Unlocks Breach',req:18},
 {b:4,t:2,name:'Inferno',desc:'Fire Rain covers 40% more ground and recharges 30% faster',req:19},
 {b:4,t:2,name:'Earthshaker',desc:'Breach lasts 35s and kills 15% of the garrison',req:20},
 {b:0,t:3,name:'Warlord',desc:'Capstone: all your soldiers deal 20% more damage',any:[2,3]},
 {b:1,t:3,name:'Golden Age',desc:'Capstone: +50% gold everywhere',any:[6,7]},
 {b:2,t:3,name:'Empire',desc:'Capstone: +100 army cap',any:[10,11]},
 {b:3,t:3,name:'Elite Guard',desc:'Capstone: soldiers march out as veterans (rank 1 or better)',any:[13,15,17]},
 {b:4,t:3,name:'Archmage',desc:'Capstone: spells cost half and recharge 40% faster',any:[21,22]}];
const SPELL_RES=[19,20,18];
const MASTERY=[{name:'Arms',desc:'+4% damage per level'},{name:'Coin',desc:'+5% gold per level'},{name:'Logistics',desc:'+15 army cap per level'},{name:'Walls',desc:'+4% castle defense per level'}];
const RCOST=[80,140,220],RTIME=[30,45,60],BRANCH=['War','Crown','Realm','Army','Arcane'];
const UPG_STEP=[0.2,0.3,0.35];
function unitMul(G,o,u){if(o===NEUTRAL||o==null||o<0)return 1;const b=12+u*2,k=UPG_STEP[u];return 1+(has(G,o,b)?k:0)+(has(G,o,b+1)?k:0);}
const AB=[{name:'Fire Rain',cost:70,cd:55,r:45,delay:1.6},{name:'Breach',cost:60,cd:70,dur:20},{name:'Scout',cost:30,cd:40,dur:15}];
const NEUT_IDLE=6;
// unit types: 0 spearmen, 1 archers, 2 cavalry, 3 rams
const UNIT=[{name:'Militia',short:'Militia',hp:0.75,spd:1,dmg:0.27,wall:1,cost:1,gold:0,need:-1},
 {name:'Spearmen',short:'Spear',hp:1.45,spd:1,dmg:0.4,wall:1.1,cost:1.15,gold:2,need:1},
 {name:'Knights',short:'Knight',hp:2.0,spd:1.6,dmg:0.6,wall:0.7,cost:1.9,gold:5,need:4}];
const NU=3;
function counterMul(a,b){return a===2&&b===0?1.5:1;}
const unitOk=(c,t)=>t===0||hasB(c,UNIT[t].need);
function addT(c,t,n){if(t>=NU)t=0;c.u[t]+=n;c.size+=n;}
function scaleT(c,ns){ns=Math.max(0,ns);if(c.size<=1e-6){c.u=[ns,0,0];c.size=ns;c.vp=0;return;}const k=ns/c.size;if(c.vp)c.vp*=k;for(let i=0;i<NU;i++)c.u[i]*=k;c.size=ns;}
function takeT(G,c,mask){let tot=0;for(let t=0;t<NU;t++)if((mask>>t)&1&&c.u[t]>=1)tot+=c.u[t];if(tot<=0)return -1;let r=G.rng()*tot;
  for(let t=0;t<NU;t++)if((mask>>t)&1&&c.u[t]>=1){r-=c.u[t];if(r<=0){c.u[t]-=1;c.size-=1;return t;}}for(let t=NU-1;t>=0;t--)if((mask>>t)&1&&c.u[t]>=1){c.u[t]-=1;c.size-=1;return t;}return -1;}
function trainMask(c){let m=c.tr&1;for(let t=1;t<NU;t++)if((c.tr>>t)&1&&unitOk(c,t))m|=1<<t;return m||1;}
const MAPTYPES=['River valley','Twin rivers','Islands','Highlands','Archipelago','Canyon','Winter','Desert'];
const MAPTHEME=['grass','grass','grass','grass','grass','grass','winter','desert'];
const PERS=['Balanced','Aggressive','Turtle','Merchant'];
function mkRng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const has=(G,s,id)=>s!==NEUTRAL&&s>=0&&G.pl[s]&&((G.pl[s].res>>id)&1)===1;
const hasB=(c,i)=>c.b.includes(i);
const PATHS=[null,{name:'Bastion',desc:'60% sturdier, holds 25% more troops'},{name:'Trade city',desc:'Double gold, troops grow 30% slower'},{name:'Barracks town',desc:'Troops grow 50% faster, spearmen and knights 40% cheaper'}];
const PATH_COST=120,PATH_T=15;
const WONDER_COST=800,WONDER_T=45,WONDER_STAGES=5,WONDER_HOLD=240;
const capOf=c=>Math.round(LV[c.lv].cap*(c.owner!==NEUTRAL&&GG&&has(GG,c.owner,3)?1.25:1)*(c.path===1?1.25:1)*(hasB(c,5)?1.2:1));
const maxLv=c=>c.kind==='m'?3:c.capital>=0?6:5;
const slotsOf=c=>c.kind==='m'?0:([0,1,2,3,3,4,4][c.lv]||4)+(c.lv>=2&&c.owner!==NEUTRAL&&GG&&has(GG,c.owner,9)?1:0);
const FOOT=[0,70,98,128];
function footW(c){const s=c.kind==='m'?62:c.kind==='v'&&c.owner===NEUTRAL?118:FOOT[Math.min(3,c.lv)]+14;return s*0.36;}
function segDist2(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));const x=ax+t*dx-px,y=ay+t*dy-py;return x*x+y*y;}
function segX(a,b,c,d){const r=(b.x-a.x)*(d.y-c.y)-(b.y-a.y)*(d.x-c.x);if(!r)return false;const u=((c.x-a.x)*(d.y-c.y)-(c.y-a.y)*(d.x-c.x))/r,v=((c.x-a.x)*(b.y-a.y)-(c.y-a.y)*(b.x-a.x))/r;return u>0&&u<1&&v>0&&v<1;}
function wavyLine(R,horizontal,pos,W,H){const L=horizontal?W:H;const pts=[];let off=0;for(let i=0;i<=16;i++){off=off*0.6+(R()-.5)*90;const a=-30+i*(L+60)/16;pts.push(horizontal?{x:a,y:pos+off}:{x:pos+off,y:a});}return pts;}
function genMap(seed,nPlayers,W,H,ms,mt){
  const R=mkRng(seed);
  const base=ms===0?7:ms===2?15:ms===3?21:11;let n=Math.min(ms===3?44:34,base+nPlayers*2);
  const port=H>=W,M=port?H:W,Lx=port?W:H;
  // barriers: water (crossed by bridges) and ridges (crossed by passes)
  const bars=[];
  if(mt===1){bars.push({k:'w',pts:wavyLine(R,port,M*(0.3+R()*.06),W,H)});bars.push({k:'w',pts:wavyLine(R,port,M*(0.64+R()*.06),W,H)});}
  else if(mt===2){bars.push({k:'w',pts:wavyLine(R,port,M*(0.45+R()*.1),W,H)});bars.push({k:'w',pts:wavyLine(R,!port,Lx*(0.42+R()*.16),W,H)});}
  else if(mt===3){bars.push({k:'r',pts:wavyLine(R,port,M*(0.42+R()*.16),W,H)});}
  else if(mt===4){bars.push({k:'s',pts:wavyLine(R,port,M*(0.33+R()*.05),W,H)});bars.push({k:'s',pts:wavyLine(R,port,M*(0.64+R()*.05),W,H)});bars.push({k:'s',pts:wavyLine(R,!port,Lx*(0.45+R()*.1),W,H)});}
  else if(mt===5){bars.push({k:'r',pts:wavyLine(R,!port,Lx*(0.33+R()*.04),W,H)});bars.push({k:'r',pts:wavyLine(R,!port,Lx*(0.64+R()*.04),W,H)});}
  else if(mt===6){bars.push({k:'i',pts:wavyLine(R,port,M*(0.42+R()*.16),W,H)});} // frozen river: walk across anywhere
  else if(mt===7){} // open desert
  else bars.push({k:'w',pts:wavyLine(R,port,M*(0.42+R()*.16),W,H)});
  const near=(x,y,m)=>bars.some(b=>{if(b.k==='i')return false;if(b.k==='s')m*=1.35;for(let i=0;i<b.pts.length-1;i++)if(segDist2(x,y,b.pts[i].x,b.pts[i].y,b.pts[i+1].x,b.pts[i+1].y)<m*m)return true;return false;});
  const mg=90,minD=Math.sqrt(W*H/n)*0.64;const pts=[];
  for(let tries=0;pts.length<n&&tries<20000;tries++){const x=mg+R()*(W-2*mg),y=mg+R()*(H-2*mg);
    if(near(x,y,85))continue;if(pts.every(p=>(p.x-x)**2+(p.y-y)**2>minD*minD))pts.push({x,y});}
  n=pts.length;
  const crossOf=(a,b)=>{for(let k=0;k<bars.length;k++){if(bars[k].k==='i')continue;const p=bars[k].pts;for(let i=0;i<p.length-1;i++)if(segX(a,b,p[i],p[i+1]))return k;}return -1;};
  const cand=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=pts[i],b=pts[j];const d2=(a.x-b.x)**2+(a.y-b.y)**2;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;let ok=true;
    for(let k=0;k<n&&ok;k++){if(k===i||k===j)continue;const p=pts[k];if((p.x-mx)**2+(p.y-my)**2<d2/4)ok=false;else if(segDist2(p.x,p.y,a.x,a.y,b.x,b.y)<66*66)ok=false;}
    cand.push({a:i,b:j,len:Math.sqrt(d2),ok,x:crossOf(a,b)});}
  const par=[...Array(n).keys()];const find=x=>par[x]===x?x:(par[x]=find(par[x]));const uni=(a,b)=>{par[find(a)]=find(b);};
  const edges=[];
  for(const e of cand)if(e.ok&&e.x<0&&e.len<minD*2.6){edges.push(e);uni(e.a,e.b);}
  // limited crossings per barrier, spread out
  bars.forEach((b,k)=>{if(b.k==='i')return;const nb=b.k==='r'?2+(n>18?1:0)+(n>26?1:0):2+(n>22?1:0);const picked=[];
    for(const e of cand.filter(e=>e.ok&&e.x===k&&e.len<minD*2.4).sort((p,q)=>p.len-q.len)){if(picked.length>=nb)break;const mx=(pts[e.a].x+pts[e.b].x)/2,my=(pts[e.a].y+pts[e.b].y)/2;
      if(picked.every(o=>{const ox=(pts[o.a].x+pts[o.b].x)/2,oy=(pts[o.a].y+pts[o.b].y)/2;return(ox-mx)**2+(oy-my)**2>(Lx/(nb+1))**2*0.6;})){picked.push(e);edges.push(e);uni(e.a,e.b);}}});
  const sorted=[...cand].sort((p,q)=>((p.x>=0)-(q.x>=0))||(p.len-q.len));
  for(const e of sorted)if(find(e.a)!==find(e.b)){edges.push(e);uni(e.a,e.b);}
  const E=edges.map(e=>{const a=pts[e.a],b=pts[e.b];return{a:e.a,b:e.b,len:e.len,cross:e.x>=0?(bars[e.x].k==='s'?'w':bars[e.x].k):null,ux:(b.x-a.x)/e.len,uy:(b.y-a.y)/e.len};});
  const adj=pts.map(()=>[]);E.forEach((e,i)=>{adj[e.a].push({to:e.b,e:i});adj[e.b].push({to:e.a,e:i});});
  const hillP=mt===3||mt===5?0.32:mt===7?0.12:0.22;
  const castles=pts.map(p=>({x:p.x,y:p.y,lv:1,b:[],kind:'c',owner:NEUTRAL,size:0,base:0,idle:99,route:-1,rt:0,build:null,tax:0,sab:0,capital:-1,hill:R()<hillP,sup:true,fire:0,assault:0,hireCd:0,last:-1,u:[0,0,0],tr:1,path:0}));
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
  const O={wonder:1,gold:30,fog:1,neut:1,...(cfg.opts||{})};
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
  // difficulty by distance: each capital's nearest neutrals are easy, the far core is walled
  const hop=new Array(C.length).fill(99),hq=[];for(const t of taken){hop[t]=0;hq.push(t);}
  for(let h=0;h<hq.length;h++){const u=hq[h];for(const {to} of map.adj[u])if(hop[to]>hop[u]+1){hop[to]=hop[u]+1;hq.push(to);}}
  const dist=i=>{let m=1e9;for(const t of taken){const d=Math.hypot(C[i].x-C[t].x,C[i].y-C[t].y);if(d<m)m=d;}return m;};
  const easy=new Set();
  for(const t of taken){const near=rest.filter(i=>!easy.has(i)).sort((a,b)=>(hop[a]-hop[b])||(Math.hypot(C[a].x-C[t].x,C[a].y-C[t].y)-Math.hypot(C[b].x-C[t].x,C[b].y-C[t].y)));
    for(const i of near.slice(0,2))if(hop[i]<=1)easy.add(i);}
  const others=rest.filter(i=>!easy.has(i)).sort((a,b)=>dist(b)-dist(a));
  const nWall=Math.min(others.length,Math.max(1,Math.round(rest.length*0.3)));const wall=new Set(others.slice(0,nWall));
  const nMine=Math.max(2,Math.ceil(act.length/1.5));let mines=0;const ntw=[];
  const maxD=Math.max(1,...others.map(dist)),minD2=Math.min(...others.map(dist));
  for(const i of rest){const c=C[i];
    if(easy.has(i)){c.lv=1;c.kind='v';c.size=c.base=Math.floor(8+R()*7);continue;}
    if(wall.has(i)){const deep=(dist(i)-minD2)/Math.max(1,maxD-minD2);c.lv=3;c.kind='f';c.nw=1;c.size=c.base=Math.floor(50+R()*12+deep*18);ntw.push(i);continue;}
    if(mines<nMine){c.kind='m';c.lv=1;c.size=c.base=Math.floor(12+R()*8);mines++;continue;}
    if(R()<0.25){c.lv=3;c.kind='f';c.size=c.base=Math.floor(40+R()*15);}else{c.lv=1;c.kind='v';c.size=c.base=Math.floor(22+R()*11);}}
  for(const i of rest){const c=C[i];if(O.neut!==1){c.size=c.base=Math.max(4,Math.round(c.size*O.neut));}const sp=c.kind==='f'?Math.floor(c.size*(c.nw?0.35:0.25)):0;c.u=[c.size-sp,sp,0];}
  const pl=[];for(let i=0;i<8;i++)pl.push({gold:O.gold,earned:0,res:0,cur:-1,curT:0,cd:[0,0,0],rally:0,pour:null,pourA:0,pourH:0,mix:7,ws:0,wb:-1,wh:0,hm:1,ml:[0,0,0,0],mcur:-1,mt:0,out:!act.includes(i),taken:0,peak:20,kills:0});
  const capIdx={};for(const s of act)capIdx[s]=assign[s];
  const G={...map,home:assign,capIdx,slots:cfg.slots,sp:cfg.sp||1,sol:[],sid:1,time:0,gt:0,over:false,winner:null,botT:{},events:[],pl,
    scouts:[],fires:[],tw:[],tid:1,gid:1,secT:0,tot:new Array(8).fill(0),fieldN:new Array(8).fill(0),nAct:act.length,rng:mkRng(cfg.seed^0x5bd1e995),weather:['clear','clear','rain','snow','wind'][Math.floor(R()*5)]};
  for(const i of ntw){const c=C[i];let best=null;for(const {to,e} of G.adj[i])if(!best||hop[to]<hop[best.to])best={to,e};if(!best)continue;
    const E=G.edges[best.e],sg=E.a===i?1:-1,ux=E.ux*sg,uy=E.uy*sg,d=Math.min(E.len*0.4,footW(c)+30);
    G.tw.push({tw:1,id:G.tid++,o:NEUTRAL,e:best.e,from:i,to:best.to,x:c.x+ux*d-uy*12,y:c.y+uy*d+ux*12,hp:TOWER_HP,bt:0,cd:0,u:4,st:4});}
  G.opts=O;G.theme=MAPTHEME[mt];if(G.theme==='winter')G.weather='snow';else if(G.theme==='desert')G.weather=G.weather==='wind'?'wind':'clear';
  G.cfg={opts:O,seed:cfg.seed,W:cfg.W,H:cfg.H,ms:cfg.ms,sp:cfg.sp||1,mt:cfg.mt,botDelay:cfg.botDelay||0,slots:cfg.slots.map(s=>({k:s.k,n:s.n||'',t:s.t|0,d:s.d|0,pe:s.pe|0}))};
  act.forEach(s=>{G.botT[s]=(cfg.botDelay||1)+G.rng()*1.5;});
  GG=G;supply(G);
  return G;
}
function teamOf(G,o){if(o===NEUTRAL||o==null)return 'N';const s=G.slots[o];return s&&s.t?'T'+s.t:'S'+o;}
function ev(G,e){if(G.events.length<200)G.events.push(e);}
function armyCap(G,s){const ci=G.capIdx[s];const lv=ci!==undefined?G.castles[ci].lv:1;let g=0;for(const c of G.castles)if(c.owner===s&&hasB(c,5))g+=40;return 60+60*lv+g+(has(G,s,10)?40:0)+(has(G,s,25)?100:0)+15*mlv(G,s,2);}
function garrisonTough(G,c){if(c.owner===NEUTRAL||!(c.size>0))return 1;let w=0;for(let t=0;t<NU;t++)w+=Math.max(0,c.u[t])*unitMul(G,c.owner,t);return Math.sqrt(w/c.size);}
function garrisonFire(c){const G=GG;let f=hasB(c,3)?0.5*Math.max(0,c.size):0;for(let t=0;t<NU;t++)f+=Math.max(0,c.u[t])*(t===0?1:t===1?1.25:1.4)*(G?unitMul(G,c.owner,t):1);return f;}
const breached=(G,c)=>c.br>G.gt;
function defMul(G,c){let d=(c.hill?1.3:1)*garrisonTough(G,c)*(1+0.04*mlv(G,c.owner,3))*(c.owner!==NEUTRAL&&has(G,c.owner,8)?1.15:1);if(breached(G,c))d*=0.8;if(c.owner===NEUTRAL)return d*1.12*(c.nw&&!breached(G,c)?1.4:1);d*=1.35;if(hasB(c,0)&&!breached(G,c))d*=1.6;if(c.capital>=0)d*=has(G,c.owner,10)?1.6:1.25;if(c.path===1&&!breached(G,c))d*=1.6;return d;}
function upCost(G,s,c,k){const m=has(G,s,8)?0.75:1;if(k===0)return c.lv<maxLv(c)?Math.round(LVCOST[c.lv]*m):Infinity;
  const i=k-1;if(!BLD[i]||c.kind==='m'||hasB(c,i)||c.b.length>=slotsOf(c))return Infinity;return Math.round(BLD[i].cost*m);}
function fieldCap(G,s){return Math.max(110,Math.floor(MAX_SOL*1.6/Math.max(1,G.nAct)));}
function solSpeed(G,s){let v=SPEED_S*UNIT[s.u].spd;if(has(G,s.o,0))v*=1.4;return v;}
// place a soldier on its road
function roadPt(G,s){const e=G.edges[s.e],f=G.castles[s.from];const sg=e.a===s.from?1:-1;const ux=e.ux*sg,uy=e.uy*sg;return{x:f.x+ux*s.d-uy*s.off,y:f.y+uy*s.d+ux*s.off,ux,uy};}
function mkSol(G,o,from,to,d,off,st,u,g){const e=G.edgeKey[from+'_'+to];
  const s={id:G.sid++,o,from,to,e,d,off,st,u,g:g||0,w:hasB(G.castles[from],6)?1:0,rk:0,xp:0,hp:UNIT[u].hp*unitMul(G,o,u),cd:0,tgt:null,tt:G.rng()*0.2,ret:0,ch:u===2,x:0,y:0,px:0,py:0,hx:0,hy:1,wx:0,wy:0};
  const c=G.castles[from];let rk=has(G,o,26)?1:0;if(c.vp>=1){rk=Math.min(3,rk+1);c.vp-=1;}
  if(rk){s.rk=rk;s.hp*=1+0.2*rk;}
  const p=roadPt(G,s);s.x=s.px=p.x;s.y=s.py=p.y;s.hx=p.ux;s.hy=p.uy;G.sol.push(s);G.fieldN[o]++;return s;}
// send a block of n soldiers marching together
function dispatch(G,slot,from,to,n,mask){
  const c=G.castles[from];if(G.edgeKey[from+'_'+to]===undefined)return 0;
  n=Math.min(Math.floor(n),Math.floor(c.size),fieldCap(G,slot)-G.fieldN[slot],MAX_SOL-G.sol.length);if(n<1)return 0;
  const fw=footW(c);const us=[];for(let k=0;k<n;k++){const t=takeT(G,c,mask||7);if(t<0)break;us.push(t);}
  const g=G.gid++;placeBlock(G,slot,from,to,us,fw*0.9,-1,0,g);
  return us.length;}
// marching block: spearmen in front, archers behind, rams at the back, cavalry riding on the flanks
function placeBlock(G,slot,from,to,us,d0,dir,st,g){
  const foot=us.filter(t=>t!==2).sort((a,b)=>[1,0][a]-[1,0][b]),cav=us.filter(t=>t===2);
  foot.forEach((t,k)=>{const row=Math.floor(k/5),col=k%5;mkSol(G,slot,from,to,d0+dir*row*5.5,(col-2)*4.2+(G.rng()-.5)*1.2,st,t,g);});
  const rows=Math.max(1,Math.ceil(foot.length/5));cav.forEach((t,k)=>{const side=k%2?1:-1,r=Math.floor(k/2);mkSol(G,slot,from,to,d0+dir*(r%rows)*5.5,side*(13+Math.floor(r/rows)*5),st,t,g);});}
function own(G,slot,ci){const c=G.castles[ci];return c&&c.owner===slot&&!G.pl[slot].out&&!G.over;}
function squad(G,slot,from,to){if(!own(G,slot,from))return false;const c=G.castles[from];return dispatch(G,slot,from,to,Math.max(3,Math.floor(c.size*0.2)),G.pl[slot].mix)>0;}
function towerOn(G,o,e,from){return G.tw.find(t=>t.o===o&&t.e===e&&t.from===from&&t.hp>0);}
function towerCost(G,s){return Math.round(TOWER_COST*(has(G,s,8)?0.75:1));}
function buildTower(G,slot,ci,to){if(!own(G,slot,ci))return false;const e=G.edgeKey[ci+'_'+to];if(e===undefined||towerOn(G,slot,e,ci))return false;const p=G.pl[slot],cost=towerCost(G,slot);if(p.gold<cost)return false;
  const c=G.castles[ci],E=G.edges[e],sg=E.a===ci?1:-1,ux=E.ux*sg,uy=E.uy*sg,d=Math.min(E.len*0.4,footW(c)+30);
  p.gold-=cost;G.tw.push({tw:1,id:G.tid++,o:slot,e,from:ci,to,x:c.x+ux*d-uy*12,y:c.y+uy*d+ux*12,hp:TOWER_HP*0.5,bt:TOWER_T,cd:0,u:4,st:4});ev(G,{t:'up',c:ci});return true;}
function musterCap(c){return Math.round((30+30*c.lv)*(c.owner!==NEUTRAL&&GG&&has(GG,c.owner,11)?1.5:1));}
function setMix(G,slot,m){m&=15;if(m)G.pl[slot].mix=m;}
function setTrain(G,slot,ci,m){if(!own(G,slot,ci))return false;const c=G.castles[ci];c.tr=(m&7)||1;return true;}
function setRoute(G,slot,from,to){if(!own(G,slot,from))return false;const c=G.castles[from];
  if(to<0||c.route===to){c.route=-1;return true;}if(G.edgeKey[from+'_'+to]===undefined)return false;c.route=to;c.rt=0.3;return true;}
function releaseMuster(G,slot,from){for(const s of G.sol)if(s.st===3&&s.o===slot&&(from<0||s.from===from))s.st=0;}
function setPour(G,slot,from,to){const p=G.pl[slot];
  if(from<0||!own(G,slot,from)||G.edgeKey[from+'_'+to]===undefined){if(p.pour)releaseMuster(G,slot,p.pour.from);p.pour=null;return;}
  if(!p.pour||p.pour.from!==from||p.pour.to!==to){if(p.pour)releaseMuster(G,slot,p.pour.from);p.pour={from,to,n:0,g:G.gid++,u:[]};p.pourA=0;p.pourH=0;}}
function setTax(G,slot,ci,v){if(!own(G,slot,ci))return false;const c=G.castles[ci];if(c.kind==='m')return false;c.tax=v?1:0;return true;}
function buildWonder(G,s){const p=G.pl[s];if(G.opts&&!G.opts.wonder)return false;if(p.out||G.over||p.wb>=0||p.ws>=WONDER_STAGES)return false;const ci=G.capIdx[s];const c=G.castles[ci];if(!c||c.owner!==s||c.lv<3||p.gold<WONDER_COST)return false;
  p.gold-=WONDER_COST;p.wb=0;ev(G,{t:'wonder',s,stage:p.ws});return true;}
function choosePath(G,slot,ci,pth){if(!own(G,slot,ci))return false;const c=G.castles[ci];if(c.build||c.path||c.kind==='m'||c.lv<3||!(pth>=1&&pth<=3)||(pth===1&&c.capital>=0))return false;const p=G.pl[slot];if(p.gold<PATH_COST)return false;
  p.gold-=PATH_COST;c.build={k:20+pth,t:0,dur:PATH_T*(has(G,slot,9)?0.5:1)};ev(G,{t:'up',c:ci});return true;}
function upgrade(G,slot,ci,k){
  if(!own(G,slot,ci))return false;const c=G.castles[ci];if(c.build||!(k>=0&&k<=BLD.length))return false;
  const cost=upCost(G,slot,c,k);const p=G.pl[slot];if(!(cost<=p.gold))return false;
  p.gold-=cost;c.build={k,t:0,dur:(k===0?12:9)*(has(G,slot,9)?0.5:1)};ev(G,{t:'up',c:ci});return true;}
function demolish(G,slot,ci,i){if(!own(G,slot,ci))return false;const c=G.castles[ci];const j=c.b.indexOf(i);if(j<0)return false;c.b.splice(j,1);return true;}
function masteryOpen(G,s){return [23,24,25,26,27].some(q=>has(G,s,q));}
function masteryCost(G,s,t){return Math.round(150*Math.pow(1.35,G.pl[s].ml[t]));}
function masteryTime(G,s,t){return 30*(1+0.1*G.pl[s].ml[t]);}
function rushCost(G,s,id){return resCost(id)*2;}
function finishCost(G,s){const p=G.pl[s];if(p.cur<0)return 0;return Math.max(10,Math.round(resCost(p.cur)*1.5*(1-p.curT/resTime(p.cur))));}
function rushResearch(G,s,id){const p=G.pl[s];if(p.out||G.over||p.cur>=0||!resAvail(G,s,id))return false;const c=rushCost(G,s,id);if(p.gold<c)return false;p.gold-=c;p.res|=1<<id;ev(G,{t:'res',s,id});return true;}
function finishResearch(G,s){const p=G.pl[s];if(p.cur<0)return false;const c=finishCost(G,s);if(p.gold<c)return false;p.gold-=c;p.res|=1<<p.cur;ev(G,{t:'res',s,id:p.cur});p.cur=-1;return true;}
function finishMasteryCost(G,s){const p=G.pl[s];if(p.mcur<0)return 0;return Math.max(10,Math.round(masteryCost(G,s,p.mcur)/1.35*1.5*(1-p.mt/masteryTime(G,s,p.mcur))));}
function finishMastery(G,s){const p=G.pl[s];if(p.mcur<0)return false;const c=finishMasteryCost(G,s);if(p.gold<c)return false;p.gold-=c;p.ml[p.mcur]++;ev(G,{t:'mastery',s,k:p.mcur,lv:p.ml[p.mcur]});p.mcur=-1;return true;}
function startMastery(G,s,t){const p=G.pl[s];if(p.out||G.over||!masteryOpen(G,s)||p.mcur>=0||!(t>=0&&t<4)||p.ml[t]>=20)return false;const cost=masteryCost(G,s,t);if(p.gold<cost)return false;p.gold-=cost;p.mcur=t;p.mt=0;return true;}
const mlv=(G,s,t)=>s!==NEUTRAL&&s>=0&&G.pl[s]?G.pl[s].ml[t]:0;
function hirePrice(G,s,c){return Math.round(35*(G.pl[s].hm||1)*(c&&hasB(c,7)?0.75:1));}
function hire(G,slot,ci){if(!own(G,slot,ci))return false;const c=G.castles[ci];const p=G.pl[slot];if(c.kind==='m')return false;const cost=hirePrice(G,slot,c);if(p.gold<cost)return false;
  const n=Math.min(HIRE_N,Math.floor(capOf(c)-c.size));if(n<1)return false;p.gold-=cost;addT(c,hasB(c,7)?1:0,n);p.hm=(p.hm||1)*1.12;ev(G,{t:'hire',c:ci});return true;}
function resCost(id){const r=RES[id];if(r.t===3)return 300;if(r.b===4)return[60,120,160][r.t];return r.b===3?[[120,240],[100,200],[120,240]][r.u][r.t]:RCOST[r.t];}
function resTime(id){const r=RES[id];let t=r.t===3?70:r.b===4?[20,35,45][r.t]:r.b===3?[30,45][r.t]:RTIME[r.t];return t*0.7;}
function resAvail(G,s,id){const r=RES[id];if(!r||has(G,s,id))return false;if(r.any&&!r.any.some(q=>has(G,s,q)))return false;if(r.req!==undefined&&!has(G,s,r.req))return false;if(r.alt!==undefined&&has(G,s,r.alt))return false;return true;}
function canResearch(G,s,id){if(!resAvail(G,s,id))return false;const p=G.pl[s];if(p.cur>=0)return false;return p.gold>=resCost(id);}
function research(G,s,id){if(G.pl[s].out||G.over||!canResearch(G,s,id))return false;const p=G.pl[s];p.gold-=resCost(id);p.cur=id;p.curT=0;return true;}
function abilityCost(G,s,k){return AB[k].cost*(has(G,s,27)?0.5:1);}
function abilityCd(G,s,k){return AB[k].cd*(k===0&&has(G,s,21)?0.7:1)*(has(G,s,27)?0.6:1);}
function fireR(G,s){return AB[0].r*(has(G,s,21)?1.4:1);}
function useAbility(G,s,k,tx,ty){
  const p=G.pl[s];if(p.out||G.over||!AB[k]||p.cd[k]>G.gt||!has(G,s,SPELL_RES[k]))return false;const cost=abilityCost(G,s,k);if(p.gold<cost)return false;
  if(k===0){if(!(tx>=0&&ty>=0))return false;G.fires.push({x:tx,y:ty,s,at:G.gt+AB[0].delay,done:false,r:fireR(G,s)});}
  else if(k===1){const c=G.castles[tx];if(!c||(c.owner!==NEUTRAL&&teamOf(G,c.owner)===teamOf(G,s)))return false;c.br=G.gt+(has(G,s,22)?35:AB[1].dur);if(has(G,s,22))scaleT(c,c.size*0.85);ev(G,{t:'breach',c:tx});}
  else if(k===2){if(!(tx>=0&&ty>=0))return false;G.scouts.push({x:tx,y:ty,s,until:G.gt+AB[2].dur});}
  p.gold-=cost;p.cd[k]=G.gt+abilityCd(G,s,k);return true;}
function supply(G){
  for(const c of G.castles)c.sup=false;
  for(const s in G.capIdx){const ci=G.capIdx[s];const c0=G.castles[ci];if(c0.owner!==+s)continue;const T=teamOf(G,+s);
    const seen=new Set([ci]);const q=[ci];c0.sup=true;
    for(let h=0;h<q.length;h++){for(const {to} of G.adj[q[h]]){const c=G.castles[to];if(seen.has(to)||c.owner===NEUTRAL||teamOf(G,c.owner)!==T)continue;seen.add(to);q.push(to);if(c.owner===+s)c.sup=true;}}}}
// pairs of Markets linked through the owner's own castles; longer links pay more
const DAY_LEN=240;
function nightLevel(t){const p=(t%DAY_LEN)/DAY_LEN;const d=p<0.55?0:p<0.65?(p-0.55)/0.1:p<0.9?1:1-(p-0.9)/0.1;return Math.max(0,Math.min(1,d));}
function computeTrade(G){const T=[];const C=G.castles;
  for(let s=0;s<8;s++){const mk=[];C.forEach((c,i)=>{if(c.owner===s&&hasB(c,2))mk.push(i);});if(mk.length<2)continue;
    const used=new Set();
    for(const a of mk){if(used.has(a))continue;const prev=new Map([[a,-1]]);const q=[a];let far=null;
      for(let h=0;h<q.length;h++){const u=q[h];for(const {to} of G.adj[u]){if(prev.has(to)||C[to].owner!==s)continue;prev.set(to,u);q.push(to);if(hasB(C[to],2)&&!used.has(to))far=to;}}
      if(far===null)continue;const path=[];for(let v=far;v!==-1;v=prev.get(v))path.push(v);path.reverse();
      used.add(a);used.add(far);T.push({s,a,b:far,path,gold:Math.min(1.6,0.12*(path.length-1)+0.15)});}}
  G.trade=T;const bonus={};for(const t of T){bonus[t.a]=(bonus[t.a]||0)+t.gold/2;bonus[t.b]=(bonus[t.b]||0)+t.gold/2;}G.tradeBonus=bonus;}
function goldRate(G,c){
  if(c.owner===NEUTRAL||c.sab>G.gt||!(c.sup||c.capital>=0))return 0;const s=c.owner;
  let g=c.kind==='m'?1.2*(1+0.6*(c.lv-1))*(has(G,s,6)?1.5:1):0.04*Math.min(c.lv,5)*(c.tax?6:1);
  if(c.capital>=0)g+=0.35;
  if(hasB(c,2))g=has(G,s,5)?g*3+0.2:g*2+0.1;
  if(c.path===2)g=g*2+0.3;
  if(G.tradeBonus){const i=G.castles.indexOf(c);if(G.tradeBonus[i])g+=G.tradeBonus[i]*(has(G,s,5)?1.5:1);}
  if(has(G,s,4))g*=1.2;if(has(G,s,24))g*=1.5;return g*(1+0.05*mlv(G,s,1));}
function growRate(G,c){return c.kind==='m'?0:LV[c.lv].g*(hasB(c,1)?1.15:1)*(c.path===2?0.7:c.path===3?1.5:1)*(c.tax?(has(G,c.owner,7)?0.7:0.35):1)*(c.sup||has(G,c.owner,11)?1:0.5);}
// ---------- main step ----------
function step(G,rdt){
  if(G.over)return;
  const dt=rdt*G.sp;G.time+=rdt;G.gt+=dt;
  G.secT+=rdt;if(G.secT>=1){G.secT=0;supply(G);computeTrade(G);}
  const tot=G.tot.fill(0);
  for(const c of G.castles)if(c.owner!==NEUTRAL)tot[c.owner]+=c.size;
  for(const s of G.sol)tot[s.o]+=1;
  for(let s=0;s<8;s++)if(tot[s]>G.pl[s].peak)G.pl[s].peak=tot[s];
  const caps=[];for(let s=0;s<8;s++)caps[s]=G.pl[s].out?0:armyCap(G,s);
  G.castles.forEach((c,i)=>{
    const busy=c.assault>0;
    if(c.owner===NEUTRAL){if(!busy){c.idle+=dt;if(c.idle>NEUT_IDLE&&c.size<c.base)addT(c,0,Math.min(c.base-c.size,(c.lv>=3?2:c.kind==='m'?1:1.2)*dt));}else c.idle=0;return;}
    const p=G.pl[c.owner];
    if(c.build){c.build.t+=dt;if(c.build.t>=c.build.dur){const k=c.build.k;if(k>=20)c.path=k-20;else if(k===0)c.lv=Math.min(maxLv(c),c.lv+1);else if(c.b.length<slotsOf(c)&&!hasB(c,k-1))c.b.push(k-1);c.build=null;ev(G,{t:'built',c:i});}}
    const frozen=c.sab>G.gt;const cap=capOf(c);
    if(c.size>cap)scaleT(c,Math.max(cap,c.size-5*dt));
    else if(!c.build&&!frozen&&!busy&&tot[c.owner]<caps[c.owner]){const g=Math.min(cap-c.size,growRate(G,c)*dt);const m=trainMask(c);let k=0;for(let t=0;t<NU;t++)if((m>>t)&1)k++;
      for(let t=0;t<NU;t++)if((m>>t)&1){const n=g/k/UNIT[t].cost,cost=n*UNIT[t].gold*(c.path===3?0.6:1);if(cost>0&&p.gold<cost)addT(c,0,g/k);else{p.gold-=cost;addT(c,t,n);}}}
    const g=goldRate(G,c);p.gold+=g*dt;p.earned+=g*dt;
    const rd=c.route>=0?G.castles[c.route]:null;c.rwait=!!(rd&&rd.owner!==NEUTRAL&&teamOf(G,rd.owner)===teamOf(G,c.owner)&&rd.size>=capOf(rd)*0.95);
    if(c.route>=0&&!busy&&!c.rwait){c.rt-=dt;if(c.rt<=0){c.rt=ROUTE_IV*(has(G,c.owner,11)?0.5:1);const pkt=Math.min(Math.floor(c.size)-1,ROUTE_PKT);if(pkt>=2)dispatch(G,c.owner,i,c.route,pkt,7);}}
  });
  // hold-to-muster
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out)continue;
    if(p.pour){const c=G.castles[p.pour.from];if(c.owner!==s){releaseMuster(G,s,p.pour.from);p.pour=null;}
      else{p.pourH+=dt;p.pourA-=dt;if(p.pourA<=0){p.pourA=0.2;let amt=Math.min(Math.floor(c.size)-1,2+Math.floor(p.pourH*2),10,musterCap(c)-p.pour.u.length,fieldCap(G,s)-G.fieldN[s],MAX_SOL-G.sol.length);
        const fw=footW(c);let added=0;for(let k=0;k<amt;k++){const t=takeT(G,c,p.mix);if(t<0)break;p.pour.u.push(t);added++;}
        if(added){for(const x of G.sol)if(x.st===3&&x.o===s&&x.g===p.pour.g)x.hp=0,x.gone=true; // re-form the whole muster block in order
          const n0=G.fieldN[s];placeBlock(G,s,p.pour.from,p.pour.to,p.pour.u,fw+5,1,3,p.pour.g);}}}}
    p.hm=Math.max(1,(p.hm||1)-0.008*dt);
    if(p.mcur>=0){p.mt+=dt;if(p.mt>=masteryTime(G,s,p.mcur)){p.ml[p.mcur]++;ev(G,{t:'mastery',s,k:p.mcur,lv:p.ml[p.mcur]});p.mcur=-1;}}
    if(p.cur>=0){p.curT+=dt;if(p.curT>=resTime(p.cur)){p.res|=1<<p.cur;ev(G,{t:'res',s,id:p.cur});p.cur=-1;}}}
  G.scouts=G.scouts.filter(o=>o.until>G.gt);
  for(const f of G.fires){if(f.done||G.gt<f.at)continue;f.done=true;const T=teamOf(G,f.s),R2=(f.r||AB[0].r)**2;
    for(const x of G.sol){if(x.hp<=0||teamOf(G,x.o)===T)continue;if((x.x-f.x)**2+(x.y-f.y)**2<R2){x.hp-=1.0*(0.85+G.rng()*0.3);if(x.hp<=0){G.pl[f.s].kills++;ev(G,{t:'die',x:x.x,y:x.y,o:x.o,u:x.u});}}}
    for(const t of G.tw){if(t.o!==NEUTRAL&&teamOf(G,t.o)===T)continue;if((t.x-f.x)**2+(t.y-f.y)**2<R2*1.4){t.hp-=6;if(t.hp<=0)ev(G,{t:'tdie',x:t.x,y:t.y,o:t.o});}}
    ev(G,{t:'fire',x:f.x,y:f.y});}
  G.fires=G.fires.filter(f=>!f.done||G.gt<f.at+0.1);
  stepSoldiers(G,dt);
  for(const s in G.botT){const slot=+s;if(G.slots[slot].k!=='b'||G.pl[slot].out)continue;
    G.botT[s]-=dt;if(G.botT[s]<=0){botThink(G,slot);const iv=[3.0,1.9,1.1][G.slots[slot].d??1];G.botT[s]=iv*(0.7+G.rng()*0.6);}}
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out)continue;const cap=G.castles[G.capIdx[s]];if(!cap||cap.owner!==s)continue;const busy=cap.assault>0;
    if(p.wb>=0&&!busy){p.wb+=dt;if(p.wb>=WONDER_T){p.wb=-1;p.ws++;ev(G,{t:p.ws>=WONDER_STAGES?'wdone':'wstage',s,stage:p.ws});}}
    if(p.ws>=WONDER_STAGES&&busy)p.wh=Math.max(0,p.wh-2*dt);
    if(p.ws>=WONDER_STAGES&&!busy){p.wh+=dt;if(p.wh>=WONDER_HOLD){G.over=true;G.winner=teamOf(G,s);G.winBy='wonder';return;}}}
  checkWin(G);
}
function stepSoldiers(G,dt){
  const S=G.sol,C=G.castles;const CELL=32,grid=new Map();
  for(const s of S){s.px=s.x;s.py=s.y;const k=((s.x/CELL)|0)*4096+((s.y/CELL)|0);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(s);}
  for(const t of G.tw){t.tm=teamOf(G,t.o);const k=((t.x/CELL)|0)*4096+((t.y/CELL)|0);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(t);}
  for(const s of S)s.tm=teamOf(G,s.o);
  // group state: centre and nearest enemy, used for battle formations
  const GR=new Map();for(const s of S){if(!s.g)continue;let r=GR.get(s.g);if(!r)GR.set(s.g,r={x:0,y:0,n:0,vmin:9e9,ex:0,ey:0,en:0});r.x+=s.x;r.y+=s.y;r.n++;if(s.st===0){const v=solSpeed(G,s);if(v<r.vmin)r.vmin=v;}}
  for(const [g,r] of GR){r.x/=r.n;r.y/=r.n;const any=S.find(s=>s.g===g);if(!any)continue;const tm=any.tm;const gx=(r.x/CELL)|0,gy=(r.y/CELL)|0;let bd=90*90;
    for(let ix=gx-3;ix<=gx+3;ix++)for(let iy=gy-3;iy<=gy+3;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tm===tm||o.tw)continue;const d=(o.x-r.x)**2+(o.y-r.y)**2;if(d<bd){bd=d;r.ex=o.x;r.ey=o.y;r.en=1;}}}}
  G.GR=GR;
  if((G.mergeT=(G.mergeT||0)+dt)>1){G.mergeT=0;const key=new Map();for(const s of S){if(s.st!==0||!s.g)continue;const k=s.o+':'+s.e+':'+s.from;const r=GR.get(s.g);if(!r)continue;let L=key.get(k);if(!L)key.set(k,L=new Map());L.set(s.g,r);}
    for(const L of key.values()){const gs=[...L.entries()];for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){const [ga,ra]=gs[i],[gb,rb]=gs[j];if(ra.n&&rb.n&&Math.hypot(ra.x-rb.x,ra.y-rb.y)<26){const keep=ra.n>=rb.n?ga:gb,drop=keep===ga?gb:ga;for(const s of S)if(s.g===drop)s.g=keep;(keep===ga?ra:rb).n+=(keep===ga?rb:ra).n;(keep===ga?rb:ra).n=0;}}}}
  // towers shoot the nearest enemy in range
  for(const t of G.tw){if(t.hp<=0)continue;if(t.bt<=0&&t.hp<TOWER_HP&&G.gt-(t.lh||0)>5)t.hp=Math.min(TOWER_HP,t.hp+0.6*dt);if(t.bt>0){t.bt-=dt;t.hp=Math.min(TOWER_HP,t.hp+TOWER_HP*0.5*dt/TOWER_T);continue;}
    t.cd-=dt;if(t.cd>0)continue;const gx=(t.x/CELL)|0,gy=(t.y/CELL)|0;let best=null,bd=TOWER_R*TOWER_R;
    for(let ix=gx-3;ix<=gx+3;ix++)for(let iy=gy-3;iy<=gy+3;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tw||o.tm===t.tm)continue;const d=(o.x-t.x)**2+(o.y-t.y)**2;if(d<bd){bd=d;best=o;}}}
    if(best){t.cd=0.42;ev(G,{t:'shot',x:t.x,y:t.y-14,tx:best.x,ty:best.y});best.hp-=0.5;if(best.hp<=0){if(G.pl[t.o])G.pl[t.o].kills++;ev(G,{t:'die',x:best.x,y:best.y,o:best.o,u:best.u});}}}
  for(const c of C){c.assault=0;c._atk=null;}
  const hitUnit=(s,t,mul)=>{t.hp-=UNIT[s.u].dmg*(1+0.04*mlv(G,s.o,0))*unitMul(G,s.o,s.u)*(1+0.2*(s.rk|0))*(has(G,s.o,23)?1.2:1)*counterMul(s.u,t.u)*mul*(0.8+G.rng()*0.4);if(t.hp<=0){G.pl[s.o].kills++;s.xp=(s.xp|0)+1;const nr=s.xp>=9?3:s.xp>=5?2:s.xp>=2?1:0;if(nr>(s.rk|0)){s.hp*=(1+0.2*nr)/(1+0.2*(s.rk|0));s.rk=nr;ev(G,{t:'rank',x:s.x,y:s.y,o:s.o,rk:nr});}ev(G,{t:'die',x:t.x,y:t.y,o:t.o,u:t.u});}};
  for(const s of S){if(s.hp<=0)continue;
    const v=solSpeed(G,s)*dt;const U=UNIT[s.u];
    // targeting (rams never pick fights)
    s.tt-=dt;if(s.tt<=0){s.tt=0.2+G.rng()*0.15;let best=null;
      {const R=s.u===2?110:ENGAGE;let bd=R*R;const gx=(s.x/CELL)|0,gy=(s.y/CELL)|0,rc=s.u===2?4:1;
        for(let ix=gx-rc;ix<=gx+rc;ix++)for(let iy=gy-rc;iy<=gy+rc;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tm===s.tm)continue;let d=(o.x-s.x)**2+(o.y-s.y)**2;
          if(s.u===2){ // knights look past the spear line for militia and towers
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
        if(s.u===2&&!s.tgt.tw&&s.tgt.u!==1){ // swing around enemy spearmen on the way to softer targets
          let rx=0,ry=0;const gx=(s.x/CELL)|0,gy=(s.y/CELL)|0;for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){const a=grid.get(ix*4096+iy);if(!a)continue;for(const o of a){if(o.hp<=0||o.tm===s.tm||o.u!==1||o.tw)continue;const ox=s.x-o.x,oy=s.y-o.y,od=ox*ox+oy*oy;if(od<30*30&&od>0.01){rx+=ox/od;ry+=oy/od;}}}
          const rl=Math.hypot(rx,ry);if(rl>0){mx+=rx/rl*1.3;my+=ry/rl*1.3;const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;}}
        const m=Math.min(d-MELEE*0.8,v*(s.u===2?1.1:0.95));s.x+=mx*m;s.y+=my*m;}
      else{s.cd-=dt;if(s.cd<=0){s.cd=CD_F*(0.8+G.rng()*0.4);
        if(s.tgt.tw){s.tgt.lh=G.gt;s.tgt.hp-=UNIT[s.u].dmg*unitMul(G,s.o,s.u)*(1+0.2*(s.rk|0))*0.5*(s.w?2:1)*(0.8+G.rng()*0.4);if(s.tgt.hp<=0)ev(G,{t:'tdie',x:s.tgt.x,y:s.tgt.y,o:s.tgt.o});}
        else{hitUnit(s,s.tgt,s.ch?2:1);}s.ch=false;}}
      continue;}
    if(s.st===0&&s.u===0&&s.g){const r=G.GR.get(s.g);if(r&&r.en){const dx=r.ex-s.x,dy=r.ey-s.y,d=Math.hypot(dx,dy)||1;if(d<70&&d>MELEE){const m=Math.min(d-MELEE,v*0.9);s.x+=dx/d*m;s.y+=dy/d*m;s.hx=dx/d;s.hy=dy/d;continue;}}}
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
        s.cd-=dt;if(s.cd<=0){s.cd=CD_W*(0.8+G.rng()*0.4);const walled=(c.nw||hasB(c,0))&&!breached(G,c),siege=has(G,s.o,1)||s.w;const dmg=HIT_W*U.wall*(1+0.04*mlv(G,s.o,0))*unitMul(G,s.o,s.u)*(1+0.2*(s.rk|0))*(has(G,s.o,23)?1.2:1)*(has(G,s.o,1)?1.5:1)*(s.w?1.5:1)*(walled&&!siege?0.35:1)/defMul(G,c);scaleT(c,c.size-dmg);c.last=s.o;c.idle=0;
          if(c.size<=0.001)capture(G,s.to,s.o);}}}
  }
  // garrisons fire back (archers inside fire extra)
  C.forEach((c,i)=>{const atk=c._atk;if(!atk||!atk.length){c.fire=0;return;}c.assault=atk.length;
    c.fire+=garrisonFire(c)*FIRE*dt;
    while(c.fire>=1){const alive=atk.filter(s=>s.hp>0);if(!alive.length){c.fire=0;break;}const s=alive[Math.floor(G.rng()*alive.length)];s.hp-=1;c.fire-=1;if(s.hp<=0)ev(G,{t:'die',x:s.x,y:s.y,o:s.o,u:s.u});}});
  let w=0;for(const s of S){if(s.hp>0&&!s.gone)S[w++]=s;else G.fieldN[s.o]--;}S.length=w;
  G.tw=G.tw.filter(t=>t.hp>0);
}
function enterCastle(G,s,c){if(s.rk)c.vp=(c.vp||0)+s.rk;if(c.size>=capOf(c)-0.5)G.waste=(G.waste||0)+1;addT(c,s.u,1);s.gone=true;s.hp=0;}
function arriveSol(G,s){const c=G.castles[s.to];
  if(c.owner!==NEUTRAL&&teamOf(G,c.owner)===teamOf(G,s.o)){enterCastle(G,s,c);return;}
  s.st=2;const f=footW(c);const a=Math.atan2(s.y-c.y,s.x-c.x)+(G.rng()-.5)*1.1;const r=f+3+G.rng()*6;s.wx=c.x+Math.cos(a)*r;s.wy=c.y+Math.sin(a)*r*0.72+2;}
function capture(G,i,by){
  const c=G.castles[i],prev=c.owner,wasCap=c.capital;
  if(G.pl[by].out)return;
  const oldLv=c.lv,wasWalled=c.nw;
  const keepPath=has(G,by,2)?c.path:0;c.owner=by;c.route=-1;c.build=null;c.tax=0;c.sab=0;c.capital=-1;c.size=0;c.u=[0,0,0,0];c.fire=0;c.tr=1;c.path=keepPath;
  if(c.kind!=='m'){c.lv=Math.min(c.lv,5);if(!has(G,by,2))c.lv=Math.max(1,c.lv-1);if(c.lv<3)c.path=0;if(has(G,by,2))addT(c,0,5*c.lv);if(c.kind==='v'||c.kind==='f')c.kind='c';if(c.nw&&!c.b.includes(0))c.b.unshift(0);c.nw=0;c.b=c.b.slice(0,slotsOf(c));}
  // the victors march in
  const T=teamOf(G,by);for(const s of G.sol)if(s.hp>0&&s.st===2&&s.to===i&&teamOf(G,s.o)===T){addT(c,s.u,1);s.gone=true;s.hp=0;}
  // muster blocks of the old owner outside this castle are released
  if(prev!==NEUTRAL)for(const s of G.sol)if(s.st===3&&s.from===i)s.st=0;
  for(const t of G.tw)if(t.from===i)t.o=by;
  const loot=Math.round((8*oldLv+(wasWalled?60:0))*(has(G,by,6)?3:1));G.pl[by].gold+=loot;G.pl[by].earned+=loot;G.pl[by].taken++;
  ev(G,{t:'cap',c:i,by,loot,drop:oldLv>c.lv});
  if(wasCap>=0&&prev!==NEUTRAL)eliminate(G,prev,by);
  supply(G);
}
function eliminate(G,s,by){
  const p=G.pl[s];if(p.out)return;p.out=true;p.pour=null;
  G.castles.forEach(c=>{if(c.owner===s){c.owner=NEUTRAL;c.base=Math.max(10,Math.round(c.size));c.idle=0;c.route=-1;c.build=null;c.tax=0;c.capital=-1;}});
  for(const x of G.sol)if(x.o===s){x.hp=0;}
  G.tw=G.tw.filter(t=>t.o!==s);
  ev(G,{t:'elim',s,by});
}
function aliveTeams(G){const t=new Set();G.slots.forEach((sl,i)=>{if((sl.k==='h'||sl.k==='b')&&!G.pl[i].out)t.add(teamOf(G,i));});return t;}
function checkWin(G){const t=aliveTeams(G);if(t.size<=1){G.over=true;G.winner=[...t][0]||null;}}
// troops needed to take a castle (Lanchester estimate)
function needToTake(G,slot,c,extra){const hit=HIT_W/CD_W*(has(G,slot,1)?1.5:1)*((c.nw||hasB(c,0))&&!(c.br>G.gt)&&!has(G,slot,1)?0.35:1);const g=Math.max(0,c.size);const fire=g>0?garrisonFire(c)/g:1;return g*Math.sqrt(FIRE*fire*defMul(G,c)/hit)*1.12+(extra||0)+3;}
// ---------- bots (they see the whole map) ----------
function botView(G,slot){
  if(typeof process!=='undefined'&&process.env&&process.env.BOTSEE)return{V:G.castles,seen:()=>true};
  const T=teamOf(G,slot),C=G.castles,nv=1-0.4*nightLevel(G.time);const mem=(G.botMem||(G.botMem={}))[T]||(G.botMem[T]=[]);
  const sv=has(G,slot,18)?1.25:1;const src=[];C.forEach(c=>{if(c.owner===NEUTRAL||teamOf(G,c.owner)!==T)return;let r=c.capital>=0?300:210+Math.min(c.lv,3)*15;if(hasB(c,3))r=460;src.push([c.x,c.y,r*nv*sv]);});
  let k=0;for(const x of G.sol)if(x.tm===T&&(k++%2===0))src.push([x.x,x.y,100*nv]);
  for(const t of G.tw)if(t.o!==NEUTRAL&&teamOf(G,t.o)===T)src.push([t.x,t.y,130*nv]);
  for(const o of G.scouts)if(teamOf(G,o.s)===T)src.push([o.x,o.y,330]);
  const seen=(x,y)=>{for(const q of src){const dx=x-q[0],dy=y-q[1];if(dx*dx+dy*dy<q[2]*q[2])return true;}return false;};
  const V=C.map((c,i)=>{const mine=c.owner!==NEUTRAL&&teamOf(G,c.owner)===T;if(mine||seen(c.x,c.y)){mem[i]={...c,u:[...c.u],b:[...c.b],seenAt:G.gt};return c;}
    if(mem[i])return mem[i];return{...c,owner:NEUTRAL,capital:-1,size:c.kind==='f'?65:c.kind==='m'?16:26,u:[c.kind==='f'?45:c.kind==='m'?16:26,c.kind==='f'?20:0,0],b:[],assault:0,build:null};});
  return{V,seen};}
function botThink(G,slot){
  const R=G.rng,diff=G.slots[slot].d??1,pe=G.slots[slot].pe|0,my=teamOf(G,slot),BV=botView(G,slot),C=BV.V,n=C.length,p=G.pl[slot];const SOL=G.sol.filter(x=>x.tm===my||BV.seen(x.x,x.y));
  const isMine=i=>C[i].owner!==NEUTRAL&&teamOf(G,C[i].owner)===my;
  const fd=new Array(n).fill(1e9),q=[];
  for(let i=0;i<n;i++)if(!isMine(i)){fd[i]=0;q.push(i);}
  for(let h=0;h<q.length;h++){const u=q[h];for(const {to} of G.adj[u])if(fd[to]>fd[u]+1){fd[to]=fd[u]+1;q.push(to);}}
  const inc=new Array(n).fill(0),threat=new Array(n).fill(0);
  for(const s of SOL){if(s.tm===undefined)continue;if(s.tm===my)inc[s.to]+=1;else threat[s.to]+=1;}
  const mine=[];for(let i=0;i<n;i++)if(C[i].owner===slot)mine.push(i);
  const capI=G.capIdx[slot],capC=C[capI];
  const aggr=[1,0.85,1.35,1.15][pe];
  const room=i=>capOf(C[i])-C[i].size-inc[i];
  const st=G.botStuck||(G.botStuck={});const stuck=(st[slot]||0)>=5; // several thinks in a row with nothing worth attacking
  // economy
  if(diff>0||R()<0.5){
    for(const ci of mine){const c=C[ci];if(c.kind==='m')continue;let want=(diff>0||pe===3)&&fd[ci]>=(pe===3?1:2)&&c.capital<0&&(pe!==1||fd[ci]>=3)?1:0;
      if(stuck&&diff>0&&threat[ci]===0&&c.size>=capOf(c)*0.6)want=1;if(threat[ci]>c.size*0.5)want=0;if(c.tax!==want)c.tax=want;}
    const tot=G.tot[slot],cap=armyCap(G,slot);
    const resOrder=[[12,0,1,18,4,14,19,13,20,8,15,5,16,9,17,21,7,10,2],[12,0,1,18,19,13,16,17,4,21,14,3,15,8,5,9,2,6],[8,14,0,1,18,20,12,4,15,9,22,13,10,5,16,7,17,3],[12,13,4,18,5,14,19,15,8,6,9,0,7,16,11,1,17]][pe];
    let saving=0;var wf=false;
    if(p.cur<0&&!G.slots[slot].noRes){for(const id of resOrder){if(G.slots[slot].noArmy&&id>=12)continue;if(!resAvail(G,slot,id))continue;const econFirst=false;if(p.gold>=resCost(id)+(econFirst?60:0))research(G,slot,id);else if(!econFirst)saving=resCost(id);break;}}
    if(capC.owner===slot&&!capC.build&&capC.lv<5&&tot>cap*0.75&&p.gold-saving>=upCost(G,slot,capC,0))upgrade(G,slot,capI,0);
    if(!(wf&&p.ws<WONDER_STAGES)&&p.gold-saving>70){let best=-1,bk=0,bs=0;
      const prefCap=[[0,1,5],[4,1,6],[0,1,5],[2,5,7]][pe],prefBack=[[2,4,1],[4,6,1],[1,2,5],[2,7,1]][pe],prefFront=[[1,0,4],[1,4,6],[0,1,3],[0,1,7]][pe];
      for(const ci of mine){const c=C[ci];if(c.build||c.kind==='m')continue;
        if(c.b.length<slotsOf(c)){const pref=c.capital>=0?prefCap:fd[ci]>=2?prefBack:prefFront;
          for(const b of pref){if(hasB(c,b))continue;const k=b+1;const sc=1+(c.capital>=0?1:0)+(fd[ci]<=1?0.3:0);if(sc>bs&&p.gold>=upCost(G,slot,c,k)+30){bs=sc;best=ci;bk=k;}break;}}
        else if(c.lv<maxLv(c)&&c.capital<0&&p.gold>=upCost(G,slot,c,0)+40){if(0.8>bs){bs=0.8;best=ci;bk=0;}}}
      if(best>=0)upgrade(G,slot,best,bk);}
    if(!(wf&&p.ws<WONDER_STAGES)&&p.gold>(pe===2?110:170)&&R()<(pe===2?0.5:0.2)){for(const ci of mine){if(fd[ci]!==1)continue;let done=false;for(const {to,e} of G.adj[ci]){if(isMine(to)||towerOn(G,slot,e,ci))continue;if(buildTower(G,slot,ci,to)){done=true;break;}}if(done)break;}}
    wf=G.slots[slot].wonderFirst&&G.gt>150;
    if(wf&&capC.owner===slot&&capC.lv<3&&!capC.build&&p.gold>=upCost(G,slot,capC,0))upgrade(G,slot,capI,0);
    if(capC.owner===slot&&capC.lv>=3&&p.wb<0&&p.ws<WONDER_STAGES&&p.gold>=WONDER_COST+(wf||stuck?0:pe===1?400:pe===3?40:120)&&(wf||stuck||p.cur>=0||G.gt>300))buildWonder(G,slot);
    if(stuck&&capC.owner===slot&&(capC.lv<3||G.tot[slot]>armyCap(G,slot)*0.9)&&capC.lv<maxLv(capC)&&!capC.build&&p.gold>=upCost(G,slot,capC,0)+20)upgrade(G,slot,capI,0);
    if(stuck&&G.tot[slot]>armyCap(G,slot)*0.9&&p.cur<0&&canResearch(G,slot,25))research(G,slot,25);
    for(const ci of mine){const c=C[ci];if(c.kind==='m'&&!c.build&&c.lv<3&&threat[ci]===0&&p.gold>=upCost(G,slot,c,0)+(stuck?20:90)){upgrade(G,slot,ci,0);break;}}
    if(p.gold>350&&diff>0&&p.mcur<0&&masteryOpen(G,slot)){const order=[[0,1,2,3],[0,2,1,3],[3,2,0,1],[1,2,0,3]][pe];let bt=order[0],bc=1e9;for(const t of order){const c2=masteryCost(G,slot,t);if(c2<bc*0.8){bc=c2;bt=t;}}startMastery(G,slot,bt);}
    if(p.gold>300&&diff>0){for(const ci of mine){const c=C[ci];if(c.kind==='m'||c.size>capOf(c)*0.7)continue;if(threat[ci]>c.size*0.4||(stuck===false&&fd[ci]===1&&p.gold>600)){if(hire(G,slot,ci))break;}}}
    if(p.gold>700&&diff===2&&p.cur>=0&&p.gold>=finishCost(G,slot)+300)finishResearch(G,slot);
    if(p.gold>500&&diff>0){ // surplus: never sit on a big treasury
      let spent=false;
      if(p.cur<0){for(let id=0;id<RES.length&&!spent;id++)if(canResearch(G,slot,id)){research(G,slot,id);spent=true;}}
      if(!spent&&capC.owner===slot&&!capC.build&&capC.lv<maxLv(capC)&&p.gold>=upCost(G,slot,capC,0)){upgrade(G,slot,capI,0);spent=true;}
      if(!spent&&capC.owner===slot&&capC.lv>=3&&p.wb<0&&p.ws<WONDER_STAGES&&p.gold>=WONDER_COST){buildWonder(G,slot);spent=true;}
      if(!spent)for(const ci of mine){const c=C[ci];if(!c.build&&c.lv<maxLv(c)&&threat[ci]===0&&p.gold>=upCost(G,slot,c,0)){upgrade(G,slot,ci,0);spent=true;break;}}}
    if(wf&&p.ws<WONDER_STAGES&&capC.lv>=3)saving=Math.max(saving,WONDER_COST);
    if(p.gold>PATH_COST+40)for(const ci of mine){const c=C[ci];if(c.path||c.build||c.lv<3||c.kind==='m')continue;
      const pth=c.capital>=0?3:fd[ci]<=1?(pe===1?3:1):(pe===1?3:2);if(choosePath(G,slot,ci,pth))break;}
    for(const ci of mine){const c=C[ci];if(hasB(c,7)&&(threat[ci]>c.size*0.6||(pe===3&&c.size<capOf(c)*0.5))&&p.gold>HIRE_COST+20)hire(G,slot,ci);}
  }
  const wfo=G.slots[slot].wonderFirst&&G.gt>150&&p.ws<WONDER_STAGES;
  for(const ci of mine){const c=C[ci];let m=1;for(let t=1;t<NU;t++)if(unitOk(c,t)&&!wfo)m|=1<<t;if(m>1&&(pe===1||pe===0)&&c.capital<0)m&=~1;if(c.tr!==m)c.tr=m;}
  if(diff>=1&&p.cd[0]<=G.gt&&p.gold>=abilityCost(G,slot,0)+(diff===2?10:60)){let best=null,bn=diff===2?10:16;
    for(const ci of mine){const c=C[ci];let n=0,sx=0,sy=0;for(const x of SOL){if(x.tm===my||x.tm===undefined)continue;if((x.x-c.x)**2+(x.y-c.y)**2<110*110){n++;sx+=x.x;sy+=x.y;}}if(n>bn){bn=n;best={x:sx/n,y:sy/n};}}
    if(best)useAbility(G,slot,0,best.x,best.y);}
  // keep a rival's Wonder from finishing: stream raids at their capital so its hold timer rolls back
  const raid=new Set();
  for(let o=0;o<8;o++){const po=G.pl[o];if(o===slot||po.out||teamOf(G,o)===my||po.ws<WONDER_STAGES-1)continue;const ci2=G.capIdx[o];if(ci2===undefined||C[ci2].owner!==o)continue;raid.add(ci2);
    for(const {to} of G.adj[ci2]){const c=C[to];if(c.owner===slot&&c.route!==ci2&&c.size>6)setRoute(G,slot,to,ci2);}}
  // defend: send help to castles under assault
  for(const ci of mine){const c=C[ci];if(threat[ci]>0&&(c.assault>0||threat[ci]>c.size*0.8)){
    let need2=Math.max(0,Math.min(capOf(c)-c.size,threat[ci]*1.3-c.size)+5);for(const {to} of G.adj[ci]){if(need2<=0)break;const o=C[to];if(o.owner===slot&&o.size>10&&o.assault===0&&(o.capital<0||o.size>30)){const n=Math.min(Math.floor(o.size*0.6),Math.ceil(need2));need2-=n;dispatch(G,slot,to,ci,n);continue;}if(false)dispatch(G,slot,to,ci,Math.floor(o.size*0.6));}}}
  let acts=0;const maxA=[1,2,3][diff];st[slot]=(st[slot]||0)+1; // reset below whenever a worthwhile target exists
  mine.sort((x,y)=>C[y].size-C[x].size);
  for(const ci of mine){
    if(acts>=maxA)break;const c=C[ci];if(c.assault>0)continue;
    if(fd[ci]>1){
      let bt=-1,bs2=-1e9;for(const {to} of G.adj[ci])if(isMine(to)&&fd[to]<fd[ci]){const sc=room(to)-fd[to]*20;if(sc>bs2){bs2=sc;bt=to;}}
      if(bt>=0&&room(bt)<capOf(C[bt])*0.1)bt=-1; // nowhere useful to send troops: keep them home
      if(c.capital>=0){if(c.route>=0)c.route=-1;if(bt>=0&&c.size>capOf(c)*0.85&&dispatch(G,slot,ci,bt,Math.min(c.size*0.5,room(bt))))acts++;continue;}
      if(bt<0){if(c.route>=0&&!raid.has(c.route)&&isMine(c.route))c.route=-1;continue;}
      if(c.route!==bt&&c.size>capOf(c)*0.5){setRoute(G,slot,ci,bt);acts++;}continue;}
    if(c.route>=0&&!raid.has(c.route))c.route=-1;
    if(raid.has(c.route))continue;
    if(c.size<10||c.build)continue;
    const keep=c.capital>=0?Math.max(15,threat[ci]*1.3):pe===2?c.size*0.3:3;
    let best=-1,bs=0,bneed=0;
    for(const {to,e} of G.adj[ci]){if(isMine(to))continue;const t=C[to];const len=G.edges[e].len;
      const tr=len/(SPEED_S*(hasB(c,4)?1.5:1));const grow=t.owner===NEUTRAL?0:LV[t.lv].g*tr*G.sp;
      const need=needToTake(G,slot,{...t,size:t.size+grow},0)*aggr-inc[to];const spare=c.size-keep;
      if(spare>need){const s=(t.lv*0.5+0.5)*(t.owner===NEUTRAL?1:1.3)*(t.kind==='m'?(pe===3?2.4:1.6):1)*(t.capital>=0?3*(t.owner!==NEUTRAL&&G.pl[t.owner].ws>=3?3:1):1)*(t.assault?1.6:1)*300/((Math.max(need,0)+12)*len);if(s>bs){bs=s;best=to;bneed=need;}}}
    if(best>=0)st[slot]=0;
    if(best>=0&&(diff>0||R()<0.55)){
      const spare=c.size-keep;const amt=Math.min(spare,bneed*(diff===0?1.25:1.1)+4);

      if(dispatch(G,slot,ci,best,amt)){inc[best]+=amt;acts++;}continue;}
  }
  // muster a big block at a full front castle, then march when it is large enough
  if(diff>0){
    if(p.pour){const pf=p.pour.from,pt=p.pour.to;const c=C[pf],t=C[pt];let mus=0;for(const x of SOL)if(x.o===slot&&x.st===3&&x.from===pf)mus++;
      const need=needToTake(G,slot,t,0)*aggr;
      if(c.owner!==slot||isMine(pt)||mus>=need||c.assault>0||mus>=fieldCap(G,slot)-3||G.gt-(p.massT||0)>100){setPour(G,slot,-1,-1);for(const {to} of G.adj[pf]){const o=C[to];if(o.owner===slot&&o.route===pf)o.route=-1;}}
      else for(const {to} of G.adj[pf]){const o=C[to];if(o.owner===slot&&o.capital<0&&!o.assault&&o.route!==pf&&threat[to]<o.size*0.3)setRoute(G,slot,to,pf);}}
    else if(acts<maxA&&R()<0.6){let bc=-1,bt=-1,bv=0;
      for(const ci of mine){const c=C[ci];if(fd[ci]!==1||c.assault||c.build||c.size<capOf(c)*0.85||c.capital>=0&&threat[ci]>0)continue;
        for(const {to} of G.adj[ci]){if(isMine(to))continue;const t=C[to];const need=needToTake(G,slot,t,0)*aggr;let feed=0;for(const {to:n2} of G.adj[ci]){const o=C[n2];if(o.owner===slot&&o.capital<0)feed+=o.size*0.8;}if(need>fieldCap(G,slot)-5||need>c.size+feed+40||need>musterCap(c))continue;
          const v=(t.lv*0.5+0.5)*(t.capital>=0?3*(t.owner!==NEUTRAL&&G.pl[t.owner].ws>=3?3:1):1)*(t.kind==='m'?1.5:1)/(need+10);if(v>bv){bv=v;bc=ci;bt=to;}}}
      if(bc>=0){setPour(G,slot,bc,bt);p.massT=G.gt;acts++;st[slot]=0;}}}
  // combined strike from several castles
  if(diff>0&&acts<maxA){
    let best=-1,bv=0;
    for(let t=0;t<n;t++){if(isMine(t))continue;let sum=0;for(const {to} of G.adj[t]){const c=C[to];if(c.owner===slot&&c.size>=12&&!c.assault)sum+=c.size-(c.capital>=0?20:5);}
      const need=needToTake(G,slot,C[t],0)*aggr*1.15-inc[t];if(sum>need&&need>0){const v=C[t].lv*(C[t].capital>=0?3:1)/need;if(v>bv){bv=v;best=t;}}}
    if(best>=0)st[slot]=0;
    if(best>=0&&R()<(diff===2?0.9:0.45)){
      if(diff>=1&&(C[best].nw||hasB(C[best],0))&&p.gold>=abilityCost(G,slot,1)+20&&p.cd[1]<=G.gt)useAbility(G,slot,1,best);
      for(const {to} of G.adj[best]){const c=C[to];if(c.owner===slot&&c.size>=12&&!c.assault)dispatch(G,slot,to,best,c.size-(c.capital>=0?20:5));}}
  }
}
// ---------- network encoding ----------
const KINDS=['c','v','f','m'];
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function packA(c){return c.lv|((c.route+1)<<3)|(c.tax<<9)|((c.sab>0?1:0)<<10)|((c.capital+1)<<11)|((c.sup?1:0)<<15)|(KINDS.indexOf(c.kind)<<16)|((c.assault>0?1:0)<<18)|((c.tr&15)<<19)|((c.path&3)<<25)|((c.nw?1:0)<<23)|((c.br>GG.gt?1:0)<<24);}
function packU(c){const q=v=>Math.min(255,Math.round(Math.max(0,v)));return q(c.u[1])|(q(c.u[2])<<8);}
function packB(c){let v=0;if(c.build)v=(c.build.k>=20?12+c.build.k-20:c.build.k+1)|(Math.min(15,Math.floor(c.build.t/c.build.dur*16))<<4);return v;}
function packBl(c){let v=0;c.b.forEach((b,i)=>{v|=(b+1)<<(i*4);});return v;}
function encSol(G,limit){let out='';const S=G.sol;const step=S.length>limit?S.length/limit:1;
  for(let f=0;f<S.length&&out.length<limit*6;f+=step){const s=S[Math.floor(f)];const x=Math.max(0,Math.min(2047,Math.round(s.x))),y=Math.max(0,Math.min(2047,Math.round(s.y)));
    const h=((Math.round(Math.atan2(s.hy,s.hx)/(Math.PI/4))%8)+8)%8;const v=x|(y<<11);const w=s.o|(h<<3)|(s.st<<6)|(s.u<<8)|((s.id&3)<<10)|((s.rk|0)<<12);
    out+=B64[v&63]+B64[(v>>6)&63]+B64[(v>>12)&63]+B64[(v>>18)&15|((w&3)<<4)]+B64[(w>>2)&63]+B64[(w>>8)&63];}
  return out;}
function decSol(str){const out=[];for(let i=0;i+5<str.length;i+=6){const a=B64.indexOf(str[i]),b=B64.indexOf(str[i+1]),c=B64.indexOf(str[i+2]),d=B64.indexOf(str[i+3]),e=B64.indexOf(str[i+4]),f=B64.indexOf(str[i+5]);
    const v=a|(b<<6)|(c<<12)|((d&15)<<18);const w=(d>>4)|(e<<2)|(f<<8);const h=(w>>3)&7;const ang=h*Math.PI/4;out.push({x:v&2047,y:v>>11,o:w&7,hx:Math.cos(ang),hy:Math.sin(ang),st:(w>>6)&3,u:(w>>8)&3,vr:(w>>10)&3,rk:(w>>12)&3});}return out;}
function encode(G,budget){const c=[];
  for(const k of G.castles)c.push(k.owner,Math.round(k.size),packA(k),packB(k),packBl(k),packU(k));
  const pl=[];for(const p of G.pl)pl.push(Math.floor(p.gold),Math.round(p.earned),p.res,p.cur,Math.round(p.cur>=0?p.curT/resTime(p.cur)*100:0),
    Math.max(0,Math.ceil(p.cd[0]-G.gt)),Math.max(0,Math.ceil(p.cd[1]-G.gt)),Math.max(0,Math.ceil(p.cd[2]-G.gt)),(p.ws|((p.wb>=0?1+Math.min(98,Math.floor(p.wb/WONDER_T*99)):0)<<3)|(Math.min(255,Math.floor(p.wh))<<10)),(p.out?1:0)|(p.taken<<1),p.kills|0,Math.round((p.hm||1)*100),(p.ml[0]|(p.ml[1]<<5)|(p.ml[2]<<10)|(p.ml[3]<<15))+((p.mcur+1)<<20)+(p.mcur>=0?Math.min(99,Math.floor(p.mt/masteryTime(G,G.pl.indexOf(p),p.mcur)*100)):0)*(1<<23));
  const sc=[];for(const o of G.scouts)sc.push(Math.round(o.x),Math.round(o.y),o.s,Math.ceil(o.until-G.gt));
  const fr=[];for(const f of G.fires)fr.push(Math.round(f.x),Math.round(f.y),f.s,Math.max(0,Math.round((f.at-G.gt)*10)),Math.round(f.r||AB[0].r));
  const tw=[];for(const t of G.tw)tw.push(Math.round(t.x),Math.round(t.y),t.o,Math.round(t.hp*10),t.bt>0?1:0,t.from,t.to);
  const g={c,pl,sc,fr,tw,wb:G.winBy||'',w:G.over?(G.winner||'-'):0,tm:Math.round(G.time),so:''};
  const base=JSON.stringify(g).length;const room=Math.max(0,Math.floor(((budget||3900)-base)/6));g.so=encSol(G,Math.min(room,MAX_SOL));return g;}
function decodeInto(G,g){GG=G;
  for(let i=0;i<G.castles.length;i++){const o=g.c[6*i];if(o==null)continue;const c=G.castles[i],A=g.c[6*i+2]|0,B=g.c[6*i+3]|0,Bl=g.c[6*i+4]|0,Uu=g.c[6*i+5]|0;
    c.owner=o;c.size=g.c[6*i+1];c.tr=(A>>19)&15;c.nw=(A>>23)&1;c.path=(A>>25)&3;c.br=(A>>24)&1?G.gt+1:0;{const a=Uu&255,cv=(Uu>>8)&255;c.u=[Math.max(0,c.size-a-cv),a,cv];}c.lv=(A&7)||1;c.route=((A>>3)&63)-1;c.tax=(A>>9)&1;c.sab=(A>>10)&1?G.gt+1:0;c.capital=((A>>11)&15)-1;c.sup=!!((A>>15)&1);c.kind=KINDS[(A>>16)&3]||'c';c.assault=(A>>18)&1;
    const bk=B&15;c.build=bk?{k:bk>=13?20+bk-12:bk-1,t:((B>>4)&15)/16,dur:1}:null;
    c.b=[];for(let k=0;k<3;k++){const v=(Bl>>(k*4))&15;if(v)c.b.push(v-1);}}
  G.csol=decSol(g.so||'');G.csolT=Date.now();
  G.tw=[];if(Array.isArray(g.tw))for(let i=0;i+6<g.tw.length;i+=7)G.tw.push({tw:1,x:g.tw[i],y:g.tw[i+1],o:g.tw[i+2],hp:g.tw[i+3]/10,bt:g.tw[i+4],from:g.tw[i+5],to:g.tw[i+6]});
  if(Array.isArray(g.pl))for(let s=0;s<8;s++){const b=s*13,p=G.pl[s];if(g.pl[b]==null)continue;p.gold=g.pl[b];p.earned=g.pl[b+1];p.res=g.pl[b+2];p.cur=g.pl[b+3];p.curT=g.pl[b+3]>=0?g.pl[b+4]/100*resTime(g.pl[b+3]):0;
    p.cd=[G.gt+g.pl[b+5],G.gt+g.pl[b+6],G.gt+g.pl[b+7]];{const W=g.pl[b+8]|0;p.ws=W&7;const bp=(W>>3)&127;p.wb=bp?(bp-1)/99*WONDER_T:-1;p.wh=(W>>10)&255;}p.out=!!(g.pl[b+9]&1);p.taken=g.pl[b+9]>>1;p.kills=g.pl[b+10]|0;p.hm=(g.pl[b+11]||100)/100;{const M=g.pl[b+12]||0;p.ml=[M&31,(M>>5)&31,(M>>10)&31,(M>>15)&31];p.mcur=((M>>20)&7)-1;const pr=Math.floor(M/(1<<23));p.mt=p.mcur>=0?pr/100*masteryTime(G,s,p.mcur):0;}}
  G.scouts=[];if(Array.isArray(g.sc))for(let i=0;i+3<g.sc.length;i+=4)G.scouts.push({x:g.sc[i],y:g.sc[i+1],s:g.sc[i+2],until:G.gt+g.sc[i+3]});
  G.fires=[];if(Array.isArray(g.fr))for(let i=0;i+4<g.fr.length;i+=5)G.fires.push({x:g.fr[i],y:g.fr[i+1],s:g.fr[i+2],at:G.gt+g.fr[i+3]/10,done:false,cl:1,r:g.fr[i+4]});
  G.time=g.tm||G.time;
  if(g.w&&!G.over){G.over=true;G.winner=g.w==='-'?null:g.w;G.winBy=g.wb||'';}
}
if(typeof module!=='undefined')module.exports={BLD,research,rushResearch,finishResearch,finishMastery,rushCost,finishCost,finishMasteryCost,hire,hirePrice,startMastery,masteryCost,masteryOpen,musterCap,computeTrade,nightLevel,upgrade,buildWonder,choosePath,PATHS,SPELL_RES,useAbility,defMul,breached,goldRate,resCost,resTime,unitMul,RES,buildTower,PERS,COLORS,NEUTRAL,UNIT,genMap,newGame,step,encode,decodeInto,decSol,teamOf,aliveTeams,armyCap,dispatch,setPour};
