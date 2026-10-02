// ===== Keepfall UI + networking =====
const $=s=>document.querySelector(s);
const TEAMS=['Solo','Team A','Team B','Team C','Team D'];
const DIFF=['easy','normal','hard'];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g,'').trim().slice(0,14);
let myName=clean(store.get('hf-name'))||('Warden'+Math.floor(10+Math.random()*89));
$('#name').value=myName;
$('#name').addEventListener('input',e=>{myName=clean(e.target.value)||'Player';store.set('hf-name',myName);});

let prevLook=[],terrain=null,pings=[],seen=[],fogData=null,armedAb=-1,stats=null,lastPourSent='';
let ROOM=null,PHASE='menu',CFG=null,G=null,mySlot=0,paused=false,sel=-1,drag=null,fx=[],prevOwner=[],outShown=false,overShown=false;
const NET={mode:'local',nr:null,code:null,myPeer:null,lastSeq:{},seq:0,cmds:[],unsub:[],gid:null,hadHost:false,lastAd:''};

// ---------- screens ----------
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='s-'+id));if(id==='game')resize();}
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{leaveNet();PHASE='menu';show('menu');}));
function overlay(html,binds){const ov=$('#ov');$('#ov-card').innerHTML=html;ov.hidden=false;for(const k in binds){const el=$('#ov-card [data-a="'+k+'"]');if(el)el.onclick=binds[k];}}
function closeOv(){$('#ov').hidden=true;}
let toastT=0;function toast(t,ms=3200){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),ms);}

$('#b-help').onclick=()=>overlay(`<h3>How to play</h3><div class="help">
<p><b>Protect your capital.</b> Its flag and troop plaque carry a star. If it falls, you're out. In team games a team loses when every capital has fallen.</p>
<p><b>Real soldiers.</b> Every troop that leaves a castle is a soldier on the map. Soldiers that meet enemies fight them hand to hand, and bigger groups win. A thin trickle gets picked off, so strike with a solid block.</p>
<p><b>Move troops.</b> Hold a road next to your castle and soldiers gather in a block outside the gate. Let go and they march together. How many can gather depends on the castle's level. You can also drag outward from the castle. Slide onto the far castle before letting go to lock a steady route instead, and quick-tap that road to stop it. Routes into your own castles pause while that castle is full, so no soldiers are wasted. A quick tap sends a small squad.</p>
<p><b>Unit types.</b> Every castle trains free militia. A Barracks lets it train spearmen (2 gold each) and Stables knights (5 gold each); pick what it trains in the castle panel. Spearmen beat knights, knights crush militia, and both outclass militia. The Send chips choose which types march out.</p>
<p><b>Hiring.</b> Any castle can hire 10 soldiers for gold (spearmen where there's a Mercenary Camp). Each hire costs more than the last, and prices ease back over time.</p>
<p><b>Veterans.</b> Soldiers who kill enemies rank up (gold chevrons), gaining health and damage. Ranks are remembered when they return to a castle.</p>
<p><b>Take castles.</b> Soldiers at an enemy castle attack the walls while the garrison shoots back. Owned castles defend 35% better, more with Moat walls, on hills, or at a capital. The castle falls when its garrison hits zero. Captured castles drop one level, losing buildings that no longer fit.</p>
<p><b>Trade routes.</b> Two of your Markets linked by an unbroken chain of your own castles earn bonus gold, and longer links pay more. Lose a castle in the chain and the route breaks.</p>
<p><b>Neutrals.</b> Villages near your capital are easy pickings. Further out they get sturdier, and the heart of the map is held by walled fortresses guarded by watchtowers. Walls shrug off attackers without siege equipment, so you need Siegecraft research or soldiers from a Workshop castle, and Army upgrades help a lot. Fortresses pay rich loot and keep their walls for you. Mines earn plenty of gold. Neutrals heal if you stop attacking them.</p>
<p><b>Build up.</b> Tap your castle to switch between Recruit (troops) and Tax (nine times the gold, slower growth), raise its level (up to 5, capitals up to 6) and fill its building slots: one per level, four from level 5. At level 3 a castle can take a permanent path: Bastion (much sturdier), Trade city (double gold) or Barracks town (fast, cheap troops). A Mercenary Camp lets you hire soldiers for gold. Your capital's level and Granaries set your army cap. Castles cut off from your capital grow slowly and earn nothing.</p>
<p><b>Research and abilities.</b> Research runs one project at a time, or pay extra to finish instantly. Army upgrades make a whole unit type 20–35% stronger per tier, which decides most battles. Each branch ends in a powerful capstone tech, and finishing any capstone opens endless Mastery levels. Spells are unlocked in the Arcane research branch, cost gold and need to recharge: Fire Rain scorches every enemy soldier in an area after a short warning, Breach knocks a castle's walls down for 20 seconds, and Scout reveals an area.</p>
<p><b>Road towers.</b> Build a stone tower on a road from the castle panel. It shoots anyone walking past and shrugs off most blows; a Workshop's soldiers break towers faster.</p>
<p><b>Fog, night and terrain.</b> You only see near your castles and soldiers, and less at night. Rivers are crossed at bridges and mountain ridges at passes. Castles on hills defend 30% better.</p>
<p><b>Win</b> by taking every rival capital, or by building a Wonder at your capital (level 3 or higher): five stages of 800 gold, then hold your capital for 4 minutes. Everyone is warned, and attacks on your capital roll the timer back.</p></div>
<button class="btn primary" data-a="ok">Got it</button>`,{ok:closeOv});

// ---------- campaign ----------
const MISSIONS=[
 {t:'The first banner',d:'Learn to march, build and conquer against a sleepy neighbour.',mt:0,ms:0,bots:[{d:0,pe:2}],tut:true,delay:150},
 {t:'River crossing',d:'Two rivers, few bridges. Hold the crossings and push through.',mt:1,ms:0,bots:[{d:1,pe:0}]},
 {t:'Lance and pike',d:'Two rivals with very different habits. Spearmen stop knights; knights scatter militia.',mt:0,ms:1,bots:[{d:0,pe:1},{d:1,pe:3}]},
 {t:'The pass',d:'A turtle guards the only ways through the mountains. A Workshop helps crack its towers.',mt:3,ms:1,bots:[{d:2,pe:2}]},
 {t:'Islands of gold',d:'Fight beside an ally across four islands joined by bridges.',mt:2,ms:1,bots:[{d:1,pe:0,t:1},{d:1,pe:1,t:2},{d:1,pe:3,t:2}],you:1},
 {t:'Kingslayer',d:'Three hard warlords. Only one crown will remain.',mt:0,ms:2,bots:[{d:2,pe:1},{d:2,pe:0},{d:2,pe:2}]}];
let CAMP=null;
function campDone(){return +(store.get('hf-camp')||0);}
function renderCamp(){const box=$('#missions');box.innerHTML='';const done=campDone();
  MISSIONS.forEach((m,i)=>{const b=document.createElement('button');b.className='mission';b.disabled=i>done;
    b.innerHTML='<span class="n"></span><span class="t"><b></b><small></small></span><span class="st"></span>';
    b.querySelector('.n').textContent=i+1;b.querySelector('b').textContent=m.t;b.querySelector('small').textContent=i>done?'Locked. Win the previous mission first.':m.d;b.querySelector('.st').textContent=i<done?'Won ✓':'';
    b.onclick=()=>startMission(i);box.appendChild(b);});}
$('#b-camp').onclick=()=>{leaveNet();renderCamp();show('camp');};
function startMission(i){const m=MISSIONS[i];leaveNet();DAILY=null;NET.mode='local';
  const slots=[];for(let k=0;k<8;k++)slots.push({k:'x',n:'',t:0,d:1,p:'',pe:0});
  slots[0]={k:'h',n:myName,t:m.you||0,d:1,p:'host',pe:0};m.bots.forEach((b,k)=>{slots[k+1]={k:'b',n:'',t:b.t||0,d:b.d,p:'',pe:b.pe};});
  CFG={slots,ms:m.ms,sp:1,mt:m.mt,gid:0,fixedSeed:7001+i*131,botDelay:m.delay||0};CAMP={i,tut:!!m.tut,step:0};startGame();
  setTimeout(()=>overlay(`<h3>${i+1}. </h3><p class="sub" data-md></p><button class="btn primary" data-a="go">To battle</button>`,{go:closeOv}),50);
  setTimeout(()=>{const hh=$('#ov-card h3');if(hh)hh.textContent=(i+1)+'. '+m.t;const md=$('#ov-card [data-md]');if(md)md.textContent=m.d;},60);}
// tutorial steps: text plus the condition that completes each one
const TUT=[
 {h:'Your capital',p:'The castle with the star is your capital. Lose it and you lose. Tap it to open its panel.',ok:()=>sel===G.home[mySlot]},
 {h:'Gather an army',p:'Close the panel. Hold your finger on the road leading out of your castle: soldiers gather at the gate. Let go and they march.',ok:()=>G.sol.some(s=>s.o===mySlot&&s.st===0)},
 {h:'Take a castle',p:'At an enemy or neutral castle your soldiers attack the walls while the garrison shoots back. When the garrison hits zero, it is yours. Take one.',ok:()=>G.castles.filter(c=>c.owner===mySlot).length>=2},
 {h:'Build up',p:'Tap a castle and add a building, raise its level, or switch a safe castle to Tax for gold.',ok:()=>G.castles.some(c=>c.owner===mySlot&&(c.build||c.b.length||c.tax))},
 {h:'Better troops',p:'Militia are weak. Build a Barracks to train spearmen or Stables for knights, then use the Send chips at the bottom to pick who marches. Tap ? to learn the counters.',ok:()=>G.castles.some(c=>c.owner===mySlot&&(c.b.some(b=>b===1||b===4)||c.build&&[2,5].includes(c.build.k)))},
 {h:'Research',p:'Tap Research and start a project. Army upgrades make every soldier of a type stronger, and Siegecraft breaks walled fortresses, and the Arcane branch unlocks spells. Drilled Militia is a strong first pick.',ok:()=>G.pl[mySlot].res||G.pl[mySlot].cur>=0},
 {h:'Road towers',p:'In a castle panel, build a tower on a road facing the enemy. It shoots anyone walking past.',ok:()=>G.tw.some(t=>t.o===mySlot)},
 {h:'Victory',p:'Gather a big mixed army and take the enemy capital, the castle with the star. Your rival wakes up soon.',ok:()=>false}];
function tutTick(){const el=$('#tut');if(!CAMP||!CAMP.tut||!G||G.over){if(!el.hidden)el.hidden=true;return;}
  const st=TUT[CAMP.step];if(!st){el.hidden=true;return;}if(st.ok()){CAMP.step++;tutTick();return;}
  el.hidden=false;$('#tut-h').textContent=(CAMP.step+1)+'/'+TUT.length+'  '+st.h;$('#tut-p').textContent=st.p;}
setInterval(tutTick,400);
$('#tut-skip').onclick=()=>{if(CAMP)CAMP.tut=false;$('#tut').hidden=true;};

// ---------- network bootstrap ----------
(async()=>{
  try{if(window.claude&&typeof claude.use==='function')ROOM=await claude.use('room');}catch(e){ROOM=null;}
  if(ROOM){$('#b-host').disabled=false;$('#b-join').disabled=false;$('#net-note').textContent='Friends in your organization can join from this same page.';
    ROOM.onPeers(renderGameList,()=>{});}
  else $('#net-note').textContent='Online play turns on when this page is opened in Claude while signed in. Bots are always ready.';
})();

function leaveNet(){
  NET.unsub.forEach(u=>{try{u()}catch(e){}});NET.unsub=[];
  if(NET.nr){try{NET.nr.leave()}catch(e){}}
  CAMP=null;DAILY=null;
  if(NET.mode==='host'&&ROOM){ROOM.presence({h:null,n:null,f:null,st:null}).catch(()=>{});NET.lastAd='';}
  NET.nr=null;NET.mode='local';NET.code=null;NET.gid=null;NET.hadHost=false;
  stopSim();closeOv();
}

// ---------- setup / lobby ----------
function mkSlots(online){const s=[];for(let i=0;i<8;i++){
  if(i===0)s.push({k:'h',n:myName,t:0,d:1,p:'host',pe:0});
  else if(online)s.push(i<4?{k:'o',n:'',t:0,d:1,p:''}:{k:'x',n:'',t:0,d:1,p:''});
  else s.push(i<4?{k:'b',n:'',t:0,d:1,p:''}:{k:'x',n:'',t:0,d:1,p:''});}
  return s;}
function botName(i,d){return 'Bot '+(i+1)+' ('+DIFF[d]+')';}
function slotLabel(s,i){return s.k==='b'?botName(i,s.d):(s.n||'Player');}

$('#b-local').onclick=()=>{leaveNet();CAMP=null;DAILY=null;NET.mode='local';CFG={wonder:CFG?.wonder??1,gold:CFG?.gold??30,fog:CFG?.fog??1,neut:CFG?.neut??1,slots:mkSlots(false),ms:CFG?.ms??1,sp:CFG?.sp??1,mt:CFG?.mt??-1,gid:0};PHASE='lobby';
  $('#setup-title').textContent='New game';$('#code-box').hidden=true;renderSetup();show('setup');};
$('#b-host').onclick=async()=>{
  if(!ROOM)return;leaveNet();
  const code=Array.from({length:4},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');
  try{NET.nr=await ROOM.join('hf-'+code.toLowerCase());}catch(e){toastMenu('Could not open a game room. Try again.');return;}
  NET.mode='host';NET.code=code;NET.lastSeq={};
  CFG={wonder:CFG?.wonder??1,gold:CFG?.gold??30,fog:CFG?.fog??1,neut:CFG?.neut??1,slots:mkSlots(true),ms:CFG?.ms??1,sp:CFG?.sp??1,mt:CFG?.mt??-1,gid:0};PHASE='lobby';
  $('#setup-title').textContent='Online lobby';$('#code').textContent=code;$('#code-box').hidden=false;
  NET.unsub.push(NET.nr.onPeers(onHostPeers,()=>{}));
  renderSetup();show('setup');pushState();
};
function toastMenu(t){$('#net-note').textContent=t;}

function renderSetup(){
  const box=$('#slots');box.innerHTML='';const online=NET.mode==='host';
  CFG.slots.forEach((s,i)=>{
    const row=document.createElement('div');row.className='slot'+(s.k==='x'?' off':'');
    const hex=document.createElement('span');hex.className='hex';hex.style.setProperty('--c',COLORS[i]);row.appendChild(hex);
    const remote=s.k==='h'&&i!==0;
    if(i===0||remote){const w=document.createElement('span');w.className='who';w.textContent=i===0?myName:(s.n||'Player');
      const sm=document.createElement('small');sm.textContent=i===0?'you':'online';w.appendChild(sm);row.appendChild(w);
      if(remote){const k=document.createElement('button');k.className='kick';k.textContent='×';k.setAttribute('aria-label','Remove player');
        k.onclick=()=>{s.k='x';s.p='';s.n='';renderSetup();pushState();};row.appendChild(k);}}
    else{const sl=document.createElement('select');sl.setAttribute('aria-label','Slot '+(i+1));
      const opts=[];if(online)opts.push(['o','Open for a player']);opts.push(['b0','Bot, easy'],['b1','Bot, normal'],['b2','Bot, hard'],['x','Closed']);
      for(const [v,l] of opts){const o=document.createElement('option');o.value=v;o.textContent=l;sl.appendChild(o);}
      sl.value=s.k==='b'?'b'+s.d:s.k;
      sl.onchange=()=>{const v=sl.value;if(v[0]==='b'){s.k='b';s.d=+v[1];}else s.k=v;renderSetup();pushState();};
      row.appendChild(sl);
      if(s.k==='b'){const pe=document.createElement('select');pe.className='pe';pe.setAttribute('aria-label','Bot style');
        PERS.forEach((l,v)=>{const o=document.createElement('option');o.value=v;o.textContent=l;pe.appendChild(o);});pe.value=s.pe|0;pe.onchange=()=>{s.pe=+pe.value;pushState();};row.appendChild(pe);}}
    if(s.k!=='x'){const t=document.createElement('select');t.className='team';t.setAttribute('aria-label','Team');
      TEAMS.forEach((l,v)=>{const o=document.createElement('option');o.value=v;o.textContent=l;t.appendChild(o);});
      t.value=s.t;t.onchange=()=>{s.t=+t.value;pushState();validate();};row.appendChild(t);}
    box.appendChild(row);
  });
  const mt=$('#mt');if(mt){mt.value=String(CFG.mt??-1);mt.onchange=()=>{CFG.mt=+mt.value;pushState();};}
  document.querySelectorAll('.seg').forEach(seg=>{const k=seg.dataset.opt;seg.querySelectorAll('button').forEach(b=>{
    b.setAttribute('aria-pressed',String(+b.dataset.v===CFG[k]));b.onclick=()=>{CFG[k]=+b.dataset.v;renderSetup();pushState();};});});
  validate();
}
function validate(){
  const act=CFG.slots.filter(s=>s.k==='h'||s.k==='b');
  const teams=new Set(CFG.slots.map((s,i)=>(s.k==='h'||s.k==='b')?(s.t?'T'+s.t:'S'+i):null).filter(Boolean));
  const open=CFG.slots.filter(s=>s.k==='o').length;
  let m='';if(teams.size<2)m='You need at least two sides to fight.';
  else if(NET.mode==='host')m=open?`${act.length} ready, ${open} open slot${open>1?'s':''} (open slots close when you start)`:`${act.length} ready`;
  $('#setup-msg').textContent=m;$('#b-start').disabled=teams.size<2;
}
$('#b-start').onclick=()=>startGame();

function worldSize(o,ms){const k=ms===3?1.3:1;return o==='l'?[1600*k,1000*k]:[1000*k,1600*k];}
function startGame(){
  CFG.slots.forEach(s=>{if(s.k==='o'){s.k='x';s.p='';}});
  CFG.slots[0].n=myName;
  CFG.seed=CFG.fixedSeed||((Math.random()*2**31)>>>0);CFG.gid=(CFG.gid|0)+1;
  const st=$('#stage');CFG.o=(window.innerWidth>window.innerHeight*1.15)?'l':'p';
  const [W,H]=worldSize(CFG.o,CFG.ms);CFG.opts={wonder:CFG.wonder??1,gold:CFG.gold??30,fog:CFG.fog??1,neut:CFG.neut??1};
  G=newGame({seed:CFG.seed,slots:CFG.slots,W,H,ms:CFG.ms,sp:CFG.sp,mt:CFG.mt??-1,botDelay:CFG.botDelay||0,opts:CFG.opts});
  mySlot=0;beginPlay();
  pushState();
}
function beginPlay(){
  PHASE='play';paused=false;SPEEDX=1;sel=-1;drag=null;fx=[];prevOwner=G.castles.map(c=>c.owner);prevLook=G.castles.map(c=>c.lv*8+c.b.length);outShown=false;overShown=false;closeOv();
  G.names=castleNames(G.castles.length,G.terrainSeed);terrain=null;SPR.clear();pings=[];armedAb=-1;fogData=null;seen=G.castles.map(()=>null);
  stats={hist:[],peak:new Array(8).fill(0),taken:new Array(8).fill(0),t:0};gesture=null;pourStop();
  updatePanel();show('game');startSim();resetCam(true);initWeather();resetMix();
  if(NET.mode!=='replay'){$('#s-game').classList.remove('replay');recStart();}
  syncSpeedUi();
  if(mySlot>=0){setTimeout(()=>toast('Hold a road beside your castle to gather soldiers at the gate. Let go to march.',5000),400);
    setTimeout(()=>{if(G&&!G.over)toast('Tap your castle to set Tax or Recruit, level it up and add buildings. Guard your capital.',5000);},11000);}
}

// ---------- host networking ----------
function encodeL(){return{s:CFG.slots.map(s=>[s.k,s.n||'',s.t|0,s.d|0,s.p||'',s.pe|0]),sd:CFG.seed|0,ms:CFG.ms,sp:CFG.sp,mt:CFG.mt??-1,op:CFG.opts||{wonder:CFG.wonder??1,gold:CFG.gold??30,fog:CFG.fog??1,neut:CFG.neut??1},o:CFG.o||'p',gid:CFG.gid|0,st:PHASE};}
function pushState(){
  if(NET.mode!=='host'||!NET.nr)return;
  const L=encodeL();let g=null;
  if(PHASE!=='lobby'&&G){g=encode(G,3850-JSON.stringify(L).length-60);}
  NET.nr.presence({r:'h',n:myName,L,g}).catch(()=>{});
  const ad={h:NET.code,n:myName,f:CFG.slots.filter(s=>s.k==='o').length,st:PHASE==='lobby'?'lobby':'play'};
  const ads=JSON.stringify(ad);if(ads!==NET.lastAd&&ROOM){NET.lastAd=ads;ROOM.presence(ad).catch(()=>{});}
}
function onHostPeers({peers}){
  if(NET.mode!=='host')return;
  const clients=peers.filter(p=>!p.sameTab&&p.presence&&p.presence.r==='c'&&!p.presence.spec);
  const ids=new Set(clients.map(p=>p.peer));
  if(PHASE==='lobby'){
    CFG.slots.forEach((s,i)=>{if(i>0&&s.k==='h'&&!ids.has(s.p)){s.k='o';s.p='';s.n='';}});
    for(const c of clients){let s=CFG.slots.find(x=>x.k==='h'&&x.p===c.peer);
      if(!s){s=CFG.slots.find(x=>x.k==='o');if(s){s.k='h';s.p=c.peer;}}
      if(s)s.n=clean(c.presence.n)||'Player';}
    if($('#s-setup').classList.contains('on'))renderSetup();
  }else if(G){
    G.slots.forEach((s,i)=>{if(i>0&&s.k==='h'&&!ids.has(s.p)){s.k='b';s.d=1;s.p='';if(!G.over)toast((s.n||'A player')+' left. A bot takes over.');}});
    for(const c of clients){const idx=G.slots.findIndex(x=>x.k==='h'&&x.p===c.peer);if(idx<0)continue;
      const pr=c.presence.p;if(Array.isArray(pr))setPour(G,idx,pr[0]|0,pr[1]|0);else G.pl[idx].pour=null;
      const cmds=c.presence.c;if(!Array.isArray(cmds))continue;let last=NET.lastSeq[c.peer]||0;
      for(const m of cmds){if(Array.isArray(m)&&m[0]>last){last=m[0];runCmd(idx,m);}}
      NET.lastSeq[c.peer]=last;}
    readPings(peers,G.slots);
  }
  pushState();
}

// ---------- join / client ----------
function renderGameList(){
  if(!ROOM)return;const box=$('#games');if(!box)return;
  const list=ROOM.peers().filter(p=>!p.isMe&&p.presence&&typeof p.presence.h==='string');
  box.innerHTML='';
  if(!list.length){const e=document.createElement('div');e.className='empty';e.textContent='No open games right now. Ask the host for their code, or host one yourself.';box.appendChild(e);return;}
  for(const p of list){const b=document.createElement('button');b.className='game-item';
    const c=document.createElement('b');c.textContent=String(p.presence.h).slice(0,4);
    const s=document.createElement('span');s.textContent=(clean(p.presence.n)||'Someone')+"'s game";
    const live=p.presence.st!=='lobby';const f=document.createElement('small');const n=p.presence.f|0;f.textContent=live?'in progress':n?n+' open':'full';
    b.append(c,s,f);if(live||!n)b.onclick=()=>joinCode(String(p.presence.h),true);else b.onclick=()=>joinCode(String(p.presence.h),false);
    const row=document.createElement('div');row.className='game-row';row.appendChild(b);
    const w=document.createElement('button');w.className='watch';w.textContent='Watch';w.setAttribute('aria-label','Watch '+((clean(p.presence.n)||'this')+"'s game"));w.onclick=()=>joinCode(String(p.presence.h),true);row.appendChild(w);box.appendChild(row);}
}
$('#b-join').onclick=()=>{leaveNet();$('#join-msg').textContent='';renderGameList();show('join');};
$('#b-code').onclick=()=>joinCode($('#code-in').value);
$('#code-in').addEventListener('keydown',e=>{if(e.key==='Enter')joinCode(e.target.value);});
async function joinCode(code,spec){
  code=String(code).toUpperCase().replace(/[^A-Z]/g,'');
  if(code.length!==4){$('#join-msg').textContent='Codes are four letters.';return;}
  leaveNet();$('#join-msg').textContent='Joining…';
  try{NET.nr=await ROOM.join('hf-'+code.toLowerCase());}catch(e){$('#join-msg').textContent='Could not join. Try again.';return;}
  NET.mode='client';NET.code=code;NET.seq=0;NET.cmds=[];NET.gid=null;NET.hadHost=false;G=null;PHASE='lobby';
  NET.spec=!!spec;NET.nr.presence({r:'c',n:myName,c:[],spec:spec?1:0}).catch(()=>{});
  NET.unsub.push(NET.nr.onPeers(onClientPeers,()=>{}));
  $('#wait-title').textContent=(spec?'Watching game ':'Game ')+code;$('#wait-slots').innerHTML='';$('#wait-msg').textContent='Looking for the host…';show('wait');
  const mine=NET.nr;
  setTimeout(()=>{if(NET.nr===mine&&!NET.hadHost){leaveNet();show('join');$('#join-msg').textContent='No game found with code '+code+'.';}},7000);
}
function onClientPeers({peers}){
  if(NET.mode!=='client')return;
  const me=peers.find(p=>p.sameTab);if(me)NET.myPeer=me.peer;
  const host=peers.find(p=>p.presence&&p.presence.r==='h');
  if(!host){if(NET.hadHost)hostLeft();return;}
  NET.hadHost=true;const L=host.presence.L;if(!L||!Array.isArray(L.s))return;
  const slots=L.s.slice(0,8).map(a=>({k:a[0],n:clean(a[1]),t:a[2]|0,d:a[3]|0,p:String(a[4]||''),pe:a[5]|0}));
  mySlot=slots.findIndex(s=>s.k==='h'&&s.p&&s.p===NET.myPeer);
  if(L.st==='lobby'){
    if(PHASE!=='lobby'){PHASE='lobby';G=null;stopSim();closeOv();show('wait');}
    renderWait(slots);return;
  }
  if(NET.gid!==L.gid||!G){
    NET.gid=L.gid;const [W,H]=worldSize(L.o,L.ms);
    G=newGame({seed:L.sd,slots:slots.map(s=>({...s})),W,H,ms:L.ms,sp:L.sp,mt:L.mt??0,opts:L.op});
    beginPlay();
  }
  G.slots.forEach((s,i)=>{if(slots[i]){s.k=slots[i].k;s.n=slots[i].n;}});
  const g=host.presence.g;
  if(g&&Array.isArray(g.c)){decodeInto(G,g);recFrame(g);}
  readPings(peers,slots);
}
function renderWait(slots){
  const box=$('#wait-slots');box.innerHTML='';
  slots.forEach((s,i)=>{if(s.k==='x')return;const row=document.createElement('div');row.className='slot';
    const hex=document.createElement('span');hex.className='hex';hex.style.setProperty('--c',COLORS[i]);
    const w=document.createElement('span');w.className='who';w.textContent=s.k==='o'?'Open':s.k==='b'?botName(i,s.d):(s.n||'Player');
    if(i===mySlot){const sm=document.createElement('small');sm.textContent='you';w.appendChild(sm);}
    const t=document.createElement('span');t.className='team-tag';t.textContent=TEAMS[s.t]||'Solo';
    row.append(hex,w,t);box.appendChild(row);});
  $('#wait-msg').textContent=mySlot>=0?'Waiting for the host to start…':'The lobby is full. You can watch once it starts.';
}
function hostLeft(){leaveNet();PHASE='menu';G=null;overlay(`<h3>Host left</h3><p class="sub">The game ended because the host closed it.</p><button class="btn primary" data-a="ok">Back to menu</button>`,{ok:()=>{closeOv();show('menu');}});}

// ---------- replays ----------
let REC=null,RP=null,LAST_REPLAY=null;
function recStart(){if(!G||NET.mode==='replay')return;REC={v:1,cfg:G.cfg,names:G.names,my:mySlot,frames:[],lastT:-1};}
function recFrame(g){if(!REC||!G)return;const t=Math.round(G.time*10)/10;if(t-REC.lastT<0.24&&!G.over)return;REC.lastT=t;REC.frames.push([t,g||encode(G,30000)]);}
function recFinish(){if(!REC||!REC.frames.length){REC=null;return;}recFrame(NET.mode==='client'?null:encode(G,30000));
  const r=REC;REC=null;r.win=G.winner;r.dur=G.time;LAST_REPLAY=r;
  // keep a lighter copy on the device: about one frame a second
  const thin={...r,frames:r.frames.filter((f,i)=>i%4===0||i===r.frames.length-1)};
  for(const step of [1,2,3]){try{const data=step===1?thin:{...thin,frames:thin.frames.filter((f,i)=>i%(step)===0||i===thin.frames.length-1)};store.set('hf-replay',JSON.stringify(data));if(store.get('hf-replay'))break;}catch(e){}}
  updateReplayBtn();}
function savedReplay(){if(LAST_REPLAY)return LAST_REPLAY;try{const s=store.get('hf-replay');return s?JSON.parse(s):null;}catch(e){return null;}}
function updateReplayBtn(){const b=$('#b-replay');if(b)b.hidden=!savedReplay();}
function startReplay(rec){
  if(!rec||!rec.frames||!rec.frames.length){toast('No replay saved yet.',1800);return;}
  leaveNet();CAMP=null;NET.mode='replay';mySlot=-1;$('#toast').classList.remove('show');
  G=newGame({...rec.cfg});G.over=false;
  RP={rec,t:rec.frames[0][0],i:-1,playing:true,speed:4,end:rec.frames[rec.frames.length-1][0]};
  beginPlay();G.names=rec.names||G.names;$('#s-game').classList.add('replay');replayApply(true);renderReplayBar();
  resetCam(true);setCam(G.W/2,G.H/2,1,true);}
function replayIndex(t){const f=RP.rec.frames;let lo=0,hi=f.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(f[m][0]<=t)lo=m;else hi=m-1;}return lo;}
function replayApply(force){const i=replayIndex(RP.t);if(i===RP.i&&!force)return;const scrub=Math.abs(i-RP.i)>1;RP.i=i;
  G.over=false;decodeInto(G,RP.rec.frames[i][1]);G.over=false;G.csolT=Date.now();if(scrub){prevOwner=G.castles.map(c=>c.owner);prevLook=G.castles.map(c=>c.lv*8+c.b.length);fx=[];}}
function fmtT(t){t=Math.max(0,Math.floor(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function renderReplayBar(){if(!RP)return;$('#rp-play').textContent=RP.playing?'❚❚':'▶';$('#rp-play').setAttribute('aria-label',RP.playing?'Pause':'Play');$('#rp-speed').textContent=RP.speed+'×';
  const r=$('#rp-range');r.max=String(Math.round(RP.end*10));if(!r.matches(':active'))r.value=String(Math.round(RP.t*10));$('#rp-time').textContent=fmtT(RP.t)+' / '+fmtT(RP.end);}
function exitReplay(){RP=null;$('#s-game').classList.remove('replay');stopSim();G=null;NET.mode='local';PHASE='menu';show('menu');updateReplayBtn();}
$('#rp-play').onclick=()=>{if(!RP)return;if(!RP.playing&&RP.t>=RP.end-0.05)RP.t=RP.rec.frames[0][0];RP.playing=!RP.playing;renderReplayBar();};
$('#rp-speed').onclick=()=>{if(!RP)return;const sp=[1,2,4,8];RP.speed=sp[(sp.indexOf(RP.speed)+1)%sp.length];renderReplayBar();};
$('#rp-range').addEventListener('input',e=>{if(!RP)return;RP.t=(+e.target.value)/10;replayApply(false);renderReplayBar();});
$('#rp-exit').onclick=exitReplay;
$('#b-replay').onclick=()=>startReplay(savedReplay());
updateReplayBtn();renderDailyBtn();

// ---------- pause and speed ----------
let SPEEDX=1;
function syncSpeedUi(){const local=NET.mode==='local';$('#b-pp').hidden=!local;$('#b-spd').hidden=!local;$('#b-pp').textContent=paused?'▶':'❚❚';$('#b-pp').setAttribute('aria-label',paused?'Resume':'Pause');$('#b-spd').textContent=SPEEDX+'×';$('#pausetag').hidden=!(local&&paused);}
$('#b-pp').onclick=()=>{if(NET.mode!=='local'||!G||G.over)return;paused=!paused;syncSpeedUi();};
$('#b-spd').onclick=()=>{if(NET.mode!=='local')return;SPEEDX=SPEEDX===1?2:1;syncSpeedUi();};
// ---------- daily challenge ----------
let DAILY=null;
function dailyKey(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function dailyBest(){const v=+(store.get('hf-daily-'+dailyKey())||0);return v>0?v:null;}
function renderDailyBtn(){const b=$('#b-daily');if(!b)return;const best=dailyBest();b.querySelector('small').textContent=best?'Your best today: '+fmtT(best):'Same map for everyone today';}
function startDaily(){const key=dailyKey();const R=mkRng(key*2654435761%4294967296);leaveNet();NET.mode='local';
  const slots=[];for(let k=0;k<8;k++)slots.push({k:'x',n:'',t:0,d:1,p:'',pe:0});slots[0]={k:'h',n:myName,t:0,d:1,p:'host',pe:0};
  const pes=[0,1,2,3].sort(()=>R()-0.5);for(let k=1;k<=3;k++)slots[k]={k:'b',n:'',t:0,d:2,p:'',pe:pes[k-1]};
  CFG={slots,ms:1,sp:1,mt:key%4,gid:0,fixedSeed:key,botDelay:0};CAMP=null;DAILY={key};startGame();}
$('#b-daily').onclick=startDaily;

// ---------- sim loop ----------
let simTimer=null,lastSim=0,lastPush=0;
function startSim(){stopSim();lastSim=performance.now();simTimer=setInterval(simTick,50);}
function stopSim(){if(simTimer)clearInterval(simTimer);simTimer=null;}
function simTick(){
  const now=performance.now();let dt=Math.min(1.5,(now-lastSim)/1000);lastSim=now;
  if(!G)return;
  if(NET.mode==='replay'){if(RP){if(RP.playing){RP.t=Math.min(RP.end,RP.t+dt*RP.speed);G.gt+=dt*RP.speed*G.sp;if(RP.t>=RP.end)RP.playing=false;}replayApply(false);renderReplayBar();}return;}
  if(NET.mode==='client'){ // extrapolate between snapshots
    G.gt+=dt*G.sp;recordStats(dt);
  }else if(!paused){let left=dt*SPEEDX;while(left>0){step(G,Math.min(left,0.05));left-=0.05;}G.lastStep=now;recordStats(dt);recFrame(null);}
  if(NET.mode==='host'&&now-lastPush>100){lastPush=now;if(G.over&&PHASE==='play')PHASE='over';pushState();}
  if(G.over&&!overShown){overShown=true;PHASE='over';pourStop();recFinish();showGameOver();}
  else if(!G.over&&mySlot>=0&&!outShown&&G.pl[mySlot].out){outShown=true;pourStop();sel=-1;showOut();}
}
function winnerName(w){if(!w)return'Nobody';if(w[0]==='T')return TEAMS[+w.slice(1)]||'A team';const i=+w.slice(1);const s=G.slots[i];return s?slotLabel(s,i):'Someone';}
function showGameOver(){statMetric='hist';
  sel=-1;drag=null;const w=G.winner;const mine=mySlot>=0&&w===teamOf(G,mySlot);
  const title=mySlot<0?'Game over':mine?'Victory':'Defeat';
  const how=G.winBy==='wonder'?' by building a Wonder':'';
  const sub=mine?(w&&w[0]==='T'?winnerName(w)+' wins'+how+'.':'The realm is yours'+how+'.'):winnerName(w)+' wins'+how+'.';
  let btns='';
  if(DAILY){let note='';if(mine){const best=dailyBest();if(!best||G.time<best){store.set('hf-daily-'+DAILY.key,String(Math.round(G.time)));note=best?'New best today!':'First win today!';}else note='Your best today is '+fmtT(best)+'.';}
    btns='<p class="sub">'+(mine?'Daily challenge won in '+fmtT(G.time)+'. '+note:'The daily challenge beat you this time.')+'</p><button class="btn primary" data-a="daily">'+(mine?'Play again':'Try again')+'</button><button class="btn" data-a="menu">Menu</button>';renderDailyBtn();}
  else if(CAMP){if(mine&&campDone()<=CAMP.i)store.set('hf-camp',String(CAMP.i+1));
    btns=(mine&&CAMP.i+1<MISSIONS.length?'<button class="btn primary" data-a="next">Next mission</button>':'')+'<button class="btn'+(mine?'':' primary')+'" data-a="retry">'+(mine?'Replay':'Try again')+'</button><button class="btn" data-a="camp">Campaign</button>';}
  else if(NET.mode==='local')btns='<button class="btn primary" data-a="again">Play again</button><button class="btn" data-a="setup">Change setup</button><button class="btn" data-a="menu">Menu</button>';
  else if(NET.mode==='host')btns='<button class="btn primary" data-a="lobby">Back to lobby</button><button class="btn" data-a="menu">Close game</button>';
  else btns='<p class="sub">The host can start a rematch.</p><button class="btn" data-a="menu">Leave</button>';
  if(LAST_REPLAY)btns='<button class="btn" data-a="replay">Watch replay</button>'+btns;
  overlay(`<h3>${title}</h3><p class="sub" data-sub></p><div class="seg stattabs"><button data-m="hist">Army</button><button data-m="cas">Castles</button><button data-m="gold">Gold</button><button data-m="kills">Kills</button></div><div class="stats"><canvas id="chart" width="600" height="280"></canvas></div><div class="hl" id="hl"></div>${btns}`,{
    replay:()=>{closeOv();startReplay(LAST_REPLAY);},daily:()=>{closeOv();startDaily();},
    again:()=>{closeOv();startGame();},
    next:()=>{closeOv();const i=CAMP.i+1;startMission(i);},retry:()=>{closeOv();startMission(CAMP.i);},camp:()=>{stopSim();G=null;PHASE='menu';renderCamp();show('camp');CAMP=null;},
    setup:()=>{closeOv();stopSim();PHASE='lobby';renderSetup();show('setup');},
    lobby:()=>{closeOv();stopSim();PHASE='lobby';G=null;renderSetup();show('setup');pushState();},
    menu:()=>{leaveNet();PHASE='menu';G=null;show('menu');}});
  $('#ov-card [data-sub]').textContent=sub;drawStats();
}
function showOut(){overlay(`<h3>Overrun</h3><p class="sub">Your last castle fell. You can keep watching the battle.</p><button class="btn primary" data-a="watch">Keep watching</button><button class="btn" data-a="menu">Leave</button>`,
  {watch:closeOv,menu:()=>{if(NET.mode==='host'){closeOv();return;}leaveNet();PHASE='menu';G=null;show('menu');}});
  if(NET.mode==='host')$('#ov-card [data-a="menu"]').textContent='Keep hosting';}
$('#b-pause').onclick=()=>{
  if(!G)return;if(NET.mode==='local')paused=true;
  overlay(`<h3>${NET.mode==='local'?'Paused':'Menu'}</h3>${NET.mode==='client'?'':'<p class="sub"></p>'}<button class="btn primary" data-a="resume">Resume</button><button class="btn" data-a="help">How to play</button><button class="btn" data-a="quit">Leave battle</button>`,
  {resume:()=>{paused=false;closeOv();},help:()=>{paused=false;$('#b-help').click();},
   quit:()=>{if(NET.mode==='host'){PHASE='lobby';G=null;stopSim();closeOv();renderSetup();show('setup');pushState();}else{leaveNet();PHASE='menu';G=null;show('menu');}}});
  const sub=$('#ov-card .sub');if(sub)sub.textContent=NET.mode==='host'?'Leaving ends the battle for everyone.':'Bots wait while you’re away.';
};

