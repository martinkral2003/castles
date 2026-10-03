// ===== Brimfall UI + networking =====
const $=s=>document.querySelector(s);
const TEAMS=['Solo','Team A','Team B','Team C','Team D'];
const DIFF=['easy','normal','hard'];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g,'').trim().slice(0,14);
const kv=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}}; // engine value with a fallback
let myName=clean(store.get('bf-name'))||('Lord'+Math.floor(10+Math.random()*89));
$('#name').value=myName;
$('#name').addEventListener('input',e=>{myName=clean(e.target.value)||'Player';store.set('bf-name',myName);});

let prevLook=[],terrain=null,pings=[],seen=[],fogData=null,armedAb=-1,stats=null,lastPourSent='';
let ROOM=null,PHASE='menu',CFG=null,G=null,mySlot=0,paused=false,sel=-1,drag=null,fx=[],prevOwner=[],outShown=false,overShown=false;
const NET={mode:'local',nr:null,code:null,myPeer:null,lastSeq:{},seq:0,cmds:[],unsub:[],gid:null,hadHost:false,lastAd:''};

// ---------- screens ----------
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='s-'+id));if(id==='game')resize();}
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{leaveNet();PHASE='menu';show('menu');}));
function overlay(html,binds){const ov=$('#ov');$('#ov-card').innerHTML=html;ov.hidden=false;for(const k in binds){const el=$('#ov-card [data-a="'+k+'"]');if(el)el.onclick=binds[k];}}
function closeOv(){$('#ov').hidden=true;}
let toastT=0;function toast(t,ms=3200){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),ms);}

$('#b-help').onclick=()=>{const pn=i=>kv(()=>PATHS[i].name,['','Soul Well','Citadel','Spawner'][i]);
  const spells=kv(()=>SPELLS.map(s=>s.name).join(', '),'Horde Boost, Spies');
  overlay(`<h3>How to play</h3><div class="help">
<p class="lead">Castles breed minions. Souls are your only currency, and fighting is the fastest way to earn them.</p>
<section><h4>Keep your Throne</h4><p>Your Throne is the castle under the crowned skull. Lose it and you are out; a team is out when all its Thrones have fallen.</p></section>
<section><h4>Minions breed free</h4><p>Castles breed minions on their own, up to their capacity and your army cap. Both count <b>supply</b>: a minion is ${kv(()=>UNIT[0].sup,1)}, a lesser demon ${kv(()=>UNIT[1].sup,2)}, a greater demon ${kv(()=>UNIT[2].sup,5)}, a lord ${kv(()=>UNIT[3].sup,8)}. Higher levels hold more and breed faster; your Throne's level raises the army cap. Castles cut off from the Throne breed at half speed.</p></section>
<section><h4>Where souls come from</h4><ul>
<li><b>Souls mode</b>: switch a castle from Army to Souls. It stops breeding and turns that effort into souls, while its garrison stays and defends. Safe rear castles make the best soul mines.</li>
<li><b>Kills</b>: every enemy soldier you kill pays a few souls, and the loser gets a little back, so even a lost fight is not wasted. Payouts are capped, so one huge battle cannot decide the game.</li>
<li><b>Soul springs</b> (placed fairly between rivals and guarded by neutrals) and ${pn(1)}s trickle souls on their own; captured castles pay loot.</li></ul></section>
<section><h4>Spend souls on</h4><ul>
<li><b>Levels</b>: three of them, more room and faster breeding each. Level 3 unlocks a path.</li>
<li><b>Paths</b> at level 3, permanent: ${pn(1)} (steady souls), ${pn(2)} (walled and sturdy, sees far, hires a lord; not for a Throne), ${pn(3)} (breeds fast; the only castle that makes lesser and, rarely, greater demons).</li>
<li><b>Towers</b>: one purchase raises a ring of towers round a castle that shoot anything nearby. Upgrade them up to level 3.</li>
<li><b>Research</b>: one tap draws two cards and you keep one. Early cards are weak, later ones much stronger, and each draw costs a little more.</li>
<li><b>Spells</b>: both are ready from the start: ${spells}. Cards make them stronger.</li>
<li><b>Lords</b>: each ${pn(2)} hires one lord, a huge named demon whose aura drives nearby troops. Turn on the Lord chip and he leads your next big block.</li></ul></section>
<section><h4>Move your horde</h4><ul>
<li><b>Hold</b> a road beside your castle: minions gather at the gate. Let go and they march as one block. Dragging outward from the castle works too.</li>
<li><b>Slide</b> onto the far castle before letting go to lock a route; quick-tap that road to stop it.</li>
<li><b>Tap</b> a road to send a small squad. The Send chips pick which types march.</li></ul></section>
<section><h4>Battle</h4><ul>
<li>Troops fight hand to hand: a solid block beats a trickle.</li>
<li>Lesser demons hold the line. Greater demons fly, charge, savage minions and smash walls.</li>
<li>Killers rank up into veterans. Castles defend better than open ground, more on hills.</li>
<li>A captured castle drops a level and loses its path.</li></ul></section>
<section><h4>Walls and neutrals</h4><ul>
<li><b>Hovels</b> near your Throne are easy prey.</li>
<li><b>Bone fortresses</b> hold the heart of the map: walled, guarded by towers, rich in loot.</li>
<li>Against walls attackers do about half their damage unless they bring siege: greater demons, lords or the Siegebreakers card.</li>
<li><b>Soul springs</b> give souls while you hold them. Neutrals heal when left alone.</li></ul></section>
<section><h4>Fog, night, terrain</h4><p>You only see around your castles and troops, and less under the blood moon. Cross lava at bridges and ridges at passes; the ice of Cocytus can be walked anywhere.</p></section>
<section><h4>Victory</h4><ul>
<li><b>Conquest</b>: take every rival Throne.</li>
<li><b>The Hellgate</b>: with your Throne at level 3, build ${kv(()=>WONDER_STAGES,5)} stages of ${kv(()=>WONDER_COST,650)} souls, then hold your Throne for ${Math.round(kv(()=>WONDER_HOLD,240)/60)} minutes. Everyone is warned, and attacks on your Throne roll the timer back.</li></ul></section></div>
<button class="btn primary" data-a="ok">Got it</button>`,{ok:closeOv});};

// ---------- campaign ----------
const MISSIONS=[
 {t:'Fresh from the pit',d:'A newborn lord, a sleepy neighbour and a Throne to keep. Learn to breed, mine souls and conquer.',mt:0,ms:0,bots:[{d:0,pe:2}],tut:true,delay:180},
 {t:'Across the Phlegethon',d:'Two rivers of fire and only a few bridges. Hold the crossings, turn your rear into soul mines and push through.',mt:1,ms:0,bots:[{d:1,pe:0}]},
 {t:'Wrath and greed',d:'Two rival lords: one hurls everything at you, the other hoards souls. Break the hoarder before its soul mines outgrow you.',mt:7,ms:1,bots:[{d:0,pe:1},{d:1,pe:3}]},
 {t:'The bone pass',d:'A turtling lord walls up the passes of the Bone Highlands. Greater demons, lords and the Siegebreakers card break walls.',mt:3,ms:1,bots:[{d:2,pe:2}]},
 {t:'Isles of obsidian',d:'Fight beside an allied lord across obsidian islands chained by bridges over the lava sea.',mt:2,ms:1,bots:[{d:1,pe:0,t:1},{d:1,pe:1,t:2},{d:1,pe:3,t:2}],you:1},
 {t:'The ninth circle',d:'At the frozen bottom of Hell three archdemons hold court. Only one will take the Throne.',mt:6,ms:2,bots:[{d:2,pe:1},{d:2,pe:3},{d:2,pe:2}]}];
let CAMP=null;
function campDone(){return +(store.get('bf-camp')||0);}
function campMeta(m){const foes=m.bots.filter(b=>!m.you||b.t!==m.you).length,al=m.bots.length-foes,o=$('#mt option[value="'+m.mt+'"]');
  const parts=[o?o.textContent:'',['Small','Medium','Large','Huge'][m.ms],foes+' rival'+(foes>1?'s':''),al?al+' all'+(al>1?'ies':'y'):''].filter(Boolean);
  return parts.map((t,i)=>'<span>'+t+(i<parts.length-1?' ·':'')+'</span>').join(' ');}
function renderCamp(){const box=$('#missions');box.innerHTML='';const done=campDone();
  MISSIONS.forEach((m,i)=>{const b=document.createElement('button');b.className='mission'+(i<done?' won':'');b.disabled=i>done;
    b.innerHTML='<span class="n"></span><span class="t"><b></b><small></small><em></em></span><span class="st"></span>';
    b.querySelector('.n').textContent=i+1;b.querySelector('b').textContent=m.t;b.querySelector('small').textContent=i>done?'Sealed. Win the previous mission first.':m.d;
    b.querySelector('em').innerHTML=campMeta(m);b.querySelector('.st').textContent=i<done?'Won ✓':'';
    b.onclick=()=>startMission(i);box.appendChild(b);});}
$('#b-camp').onclick=()=>{leaveNet();renderCamp();show('camp');};
function startMission(i){const m=MISSIONS[i];leaveNet();DAILY=null;NET.mode='local';
  const slots=[];for(let k=0;k<8;k++)slots.push({k:'x',n:'',t:0,d:1,p:'',pe:0});
  slots[0]={k:'h',n:myName,t:m.you||0,d:1,p:'host',pe:0};m.bots.forEach((b,k)=>{slots[k+1]={k:'b',n:'',t:b.t||0,d:b.d,p:'',pe:b.pe};});
  CFG={slots,ms:m.ms,sp:1,mt:m.mt,gid:0,fixedSeed:7001+i*131,botDelay:m.delay||0};CAMP={i,tut:!!m.tut,step:0,t0:0,d0:0};startGame();
  setTimeout(()=>{overlay(`<h3></h3><p class="meta"></p><p class="sub"></p><button class="btn primary" data-a="go">To battle</button>`,{go:closeOv});
    $('#ov-card h3').textContent=(i+1)+'. '+m.t;$('#ov-card .meta').innerHTML=campMeta(m);$('#ov-card .sub').textContent=m.d;},50);}
// tutorial steps: text plus the condition that completes each one
const myDemons=()=>{let n=0;for(const c of G.castles)if(c.owner===mySlot&&c.u)n+=(c.u[1]||0)+(c.u[2]||0);for(const s of G.sol)if(s.o===mySlot&&(s.u===1||s.u===2))n++;return n;};
const TUT=[
 {h:'Your Throne',p:'The castle under the crowned skull is your Throne. Lose it and you lose. Tap it to open its panel.',ok:()=>sel===G.home[mySlot]},
 {h:'Gather a horde',p:'Close the panel. Hold your finger on a road leading out of your castle: minions gather at the gate. Let go and they march.',ok:()=>G.sol.some(s=>s.o===mySlot&&s.st===0)},
 {h:'Take a castle',p:'At a hovel or an enemy castle your minions fight the garrison. When it hits zero, the castle is yours. Take one.',ok:()=>G.castles.filter(c=>c.owner===mySlot).length>=2},
 {h:'Mine souls',p:'Souls are your only currency. Tap a castle behind your lines and switch it from Army to Souls: it stops breeding and makes souls instead. Kills pay a few too.',ok:()=>G.castles.some(c=>c.owner===mySlot&&c.mode)},
 {h:'Grow',p:'Spend souls on a castle level: more room, faster breeding. At level 3 a castle can take a path: Soul Well, Citadel or Spawner.',ok:()=>G.castles.some(c=>c.owner===mySlot&&(c.build||c.path))},
 {h:'Research',p:'Tap Research: it draws two cards at once, keep one. Early cards are weak, later ones much stronger.',ok:()=>G.pl[mySlot].rn>0},
 {h:'Towers',p:'In a castle panel, buy towers. A ring of towers shoots anyone who comes near, and you can upgrade it twice.',ok:()=>G.castles.some(c=>c.owner===mySlot&&((c.tl|0)>0||(c.build&&c.build.k===1)))||G.time-CAMP.t0>90},
 {h:'Spells',p:'Both spells are ready. Spies lift the fog for a moment, Horde Boost rallies every soldier you have. Cast one.',ok:()=>G.pl[mySlot].cd.some(v=>v>G.gt)},
 {h:'Stronger demons',p:'Minions are weak. A Spawner castle (a level 3 path) breeds lesser demons, and greater demons from level 5.',ok:()=>myDemons()>=CAMP.d0+3||G.time-CAMP.t0>120},
 {h:'Victory',p:'Gather a big army of demons and take the enemy Throne, the castle under the crowned skull. Your rival wakes up soon.',ok:()=>false}];
function tutTick(){const el=$('#tut');if(!CAMP||!CAMP.tut||!G||G.over||mySlot<0){if(!el.hidden)el.hidden=true;return;}
  const st=TUT[CAMP.step];if(!st){el.hidden=true;return;}let ok=false;try{ok=st.ok();}catch(e){}
  if(ok){CAMP.step++;CAMP.t0=G.time;CAMP.d0=myDemons();tutTick();return;}
  el.hidden=false;$('#tut-h').textContent=(CAMP.step+1)+'/'+TUT.length+'  '+st.h;$('#tut-p').textContent=st.p;}
setInterval(tutTick,400);
$('#tut-skip').onclick=()=>{if(CAMP)CAMP.tut=false;$('#tut').hidden=true;};

// ---------- network bootstrap ----------
(async()=>{
  try{if(window.claude&&typeof claude.use==='function')ROOM=await claude.use('room');}catch(e){ROOM=null;}
  if(ROOM){$('#b-host').disabled=false;$('#b-join').disabled=false;$('#net-note').textContent='Friends in your organization can join from this same page.';
    ROOM.onPeers(renderGameList,()=>{});}
  else $('#net-note').textContent='Online play turns on when this page runs inside Claude. Bots are always ready.';
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
function botName(i,d){const L=kv(()=>LORD_NAMES,null);return(L&&L.length?L[(L.length*8-1-i)%L.length]:'Bot '+(i+1))+' ('+DIFF[d]+')';}
function slotLabel(s,i){return s.k==='b'?botName(i,s.d):(s.n||'Player');}

$('#b-local').onclick=()=>{leaveNet();CAMP=null;DAILY=null;NET.mode='local';CFG={wonder:CFG?.wonder??1,souls:CFG?.souls??40,fog:CFG?.fog??1,neut:CFG?.neut??1,slots:mkSlots(false),ms:CFG?.ms??1,sp:CFG?.sp??1,mt:CFG?.mt??-1,gid:0};PHASE='lobby';
  $('#setup-title').textContent='New game';$('#code-box').hidden=true;renderSetup();show('setup');};
$('#b-host').onclick=async()=>{
  if(!ROOM)return;leaveNet();
  const code=Array.from({length:4},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');
  try{NET.nr=await ROOM.join('bf-'+code.toLowerCase());}catch(e){toastMenu('Could not open a game room. Try again.');return;}
  NET.mode='host';NET.code=code;NET.lastSeq={};
  CFG={wonder:CFG?.wonder??1,souls:CFG?.souls??40,fog:CFG?.fog??1,neut:CFG?.neut??1,slots:mkSlots(true),ms:CFG?.ms??1,sp:CFG?.sp??1,mt:CFG?.mt??-1,gid:0};PHASE='lobby';
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
  document.querySelectorAll('.seg[data-opt]').forEach(seg=>{const k=seg.dataset.opt;seg.querySelectorAll('button').forEach(b=>{
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
  CFG.o=(window.innerWidth>window.innerHeight*1.15)?'l':'p';
  const [W,H]=worldSize(CFG.o,CFG.ms);CFG.opts={wonder:CFG.wonder??1,souls:CFG.souls??40,fog:CFG.fog??1,neut:CFG.neut??1};
  G=newGame({seed:CFG.seed,slots:CFG.slots,W,H,ms:CFG.ms,sp:CFG.sp,mt:CFG.mt??-1,botDelay:CFG.botDelay||0,opts:CFG.opts});
  mySlot=0;beginPlay();
  pushState();
}
function beginPlay(){
  PHASE='play';paused=false;SPEEDX=1;sel=-1;drag=null;fx=[];prevOwner=G.castles.map(c=>c.owner);prevLook=[];outShown=false;overShown=false;closeOv();
  G.names=castleNames(G.castles.length,G.terrainSeed);terrain=null;if(typeof SPR!=='undefined'&&SPR.clear)SPR.clear();pings=[];armedAb=-1;fogData=null;seen=G.castles.map(()=>null);
  stats={hist:[],peak:new Array(8).fill(0),taken:new Array(8).fill(0),t:0};gesture=null;pourStop();
  updatePanel();show('game');startSim();resetCam(true);initWeather();resetMix();
  if(NET.mode!=='replay'){$('#s-game').classList.remove('replay');recStart();}
  syncSpeedUi();
  if(mySlot>=0){const intro=t=>{if(G&&!G.over&&mySlot>=0&&!(CAMP&&CAMP.tut))toast(t,5000);}; // the tutorial box says it already
    setTimeout(()=>intro('Hold a road beside your castle to gather minions at the gate. Let go to march.'),400);
    setTimeout(()=>intro('Switch rear castles to Souls mode to earn souls. Souls buy levels, towers and spells.'),11000);}
}

// ---------- host networking ----------
function encodeL(){return{s:CFG.slots.map(s=>[s.k,s.n||'',s.t|0,s.d|0,s.p||'',s.pe|0]),sd:CFG.seed|0,ms:CFG.ms,sp:CFG.sp,mt:CFG.mt??-1,op:CFG.opts||{wonder:CFG.wonder??1,souls:CFG.souls??40,fog:CFG.fog??1,neut:CFG.neut??1},o:CFG.o||'p',gid:CFG.gid|0,st:PHASE};}
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
  try{NET.nr=await ROOM.join('bf-'+code.toLowerCase());}catch(e){$('#join-msg').textContent='Could not join. Try again.';return;}
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
function recStart(){if(!G||NET.mode==='replay')return;REC={v:2,cfg:G.cfg,names:G.names,my:mySlot,frames:[],lastT:-1};}
function recFrame(g){if(!REC||!G)return;const t=Math.round(G.time*10)/10;if(t-REC.lastT<0.24&&!G.over)return;REC.lastT=t;REC.frames.push([t,g||encode(G,30000)]);}
function recFinish(){if(!REC||!REC.frames.length){REC=null;return;}recFrame(NET.mode==='client'?null:encode(G,30000));
  const r=REC;REC=null;r.win=G.winner;r.dur=G.time;LAST_REPLAY=r;
  // keep a lighter copy on the device: about one frame a second
  const thin={...r,frames:r.frames.filter((f,i)=>i%4===0||i===r.frames.length-1)};
  for(const step of [1,2,3]){try{const data=step===1?thin:{...thin,frames:thin.frames.filter((f,i)=>i%(step)===0||i===thin.frames.length-1)};store.set('bf-replay',JSON.stringify(data));if(store.get('bf-replay'))break;}catch(e){}}
  updateReplayBtn();}
function savedReplay(){if(LAST_REPLAY)return LAST_REPLAY;try{const s=store.get('bf-replay'),r=s?JSON.parse(s):null;return r&&r.v===2?r:null;}catch(e){return null;}} // v1 replays were written by the pre-revision-2 engine
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
  G.over=false;decodeInto(G,RP.rec.frames[i][1]);G.over=false;G.csolT=Date.now();if(scrub){prevOwner=G.castles.map(c=>c.owner);prevLook=[];fx=[];}}
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
function dailyBest(){const v=+(store.get('bf-daily-'+dailyKey())||0);return v>0?v:null;}
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
  const how=G.winBy==='wonder'?' by opening the Hellgate':'';
  let sub=mine?(w&&w[0]==='T'?winnerName(w)+' wins'+how+'.':'The Throne of Hell is yours'+how+'.'):winnerName(w)+' wins'+how+'.';
  if(mine&&CAMP&&CAMP.i+1>=MISSIONS.length)sub='The campaign is won. All of Hell kneels before you.';
  let btns='';
  if(DAILY){let note='';if(mine){const best=dailyBest();if(!best||G.time<best){store.set('bf-daily-'+DAILY.key,String(Math.round(G.time)));note=best?'New best today!':'First win today!';}else note='Your best today is '+fmtT(best)+'.';}
    btns='<p class="sub">'+(mine?'Daily challenge won in '+fmtT(G.time)+'. '+note:'The daily challenge beat you this time.')+'</p><button class="btn primary" data-a="daily">'+(mine?'Play again':'Try again')+'</button><button class="btn" data-a="menu">Menu</button>';renderDailyBtn();}
  else if(CAMP){if(mine&&campDone()<=CAMP.i)store.set('bf-camp',String(CAMP.i+1));
    btns=(mine&&CAMP.i+1<MISSIONS.length?'<button class="btn primary" data-a="next">Next mission</button>':'')+'<button class="btn'+(mine?'':' primary')+'" data-a="retry">'+(mine?'Replay':'Try again')+'</button><button class="btn" data-a="camp">Campaign</button>';}
  else if(NET.mode==='local')btns='<button class="btn primary" data-a="again">Play again</button><button class="btn" data-a="setup">Change setup</button><button class="btn" data-a="menu">Menu</button>';
  else if(NET.mode==='host')btns='<button class="btn primary" data-a="lobby">Back to lobby</button><button class="btn" data-a="menu">Close game</button>';
  else btns='<p class="sub">The host can start a rematch.</p><button class="btn" data-a="menu">Leave</button>';
  if(LAST_REPLAY)btns='<button class="btn" data-a="replay">Watch replay</button>'+btns;
  overlay(`<h3 class="${mySlot<0?'':mine?'win':'lose'}">${title}</h3><p class="sub" data-sub></p><div class="seg stattabs"><button data-m="hist">Army</button><button data-m="cas">Castles</button><button data-m="gold">Souls</button><button data-m="kills">Kills</button></div><div class="stats"><canvas id="chart" width="600" height="280"></canvas></div><div class="hl" id="hl"></div>${btns}`,{
    replay:()=>{closeOv();startReplay(LAST_REPLAY);},daily:()=>{closeOv();startDaily();},
    again:()=>{closeOv();startGame();},
    next:()=>{closeOv();const i=CAMP.i+1;startMission(i);},retry:()=>{closeOv();startMission(CAMP.i);},camp:()=>{stopSim();G=null;PHASE='menu';renderCamp();show('camp');CAMP=null;},
    setup:()=>{closeOv();stopSim();PHASE='lobby';renderSetup();show('setup');},
    lobby:()=>{closeOv();stopSim();PHASE='lobby';G=null;renderSetup();show('setup');pushState();},
    menu:()=>{leaveNet();PHASE='menu';G=null;show('menu');}});
  $('#ov-card [data-sub]').textContent=sub;drawStats();
}
function showOut(){overlay(`<h3 class="lose">Dethroned</h3><p class="sub">Your Throne has fallen. You can keep watching the war.</p><button class="btn primary" data-a="watch">Keep watching</button><button class="btn" data-a="menu">Leave</button>`,
  {watch:closeOv,menu:()=>{if(NET.mode==='host'){closeOv();return;}leaveNet();PHASE='menu';G=null;show('menu');}});
  if(NET.mode==='host')$('#ov-card [data-a="menu"]').textContent='Keep hosting';}
$('#b-pause').onclick=()=>{
  if(!G)return;if(NET.mode==='local')paused=true;
  overlay(`<h3>${NET.mode==='local'?'Paused':'Menu'}</h3>${NET.mode==='client'?'':'<p class="sub"></p>'}<button class="btn primary" data-a="resume">Resume</button><button class="btn" data-a="help">How to play</button><button class="btn" data-a="quit">Leave battle</button>`,
  {resume:()=>{paused=false;closeOv();},help:()=>{paused=false;$('#b-help').click();},
   quit:()=>{if(NET.mode==='host'){PHASE='lobby';G=null;stopSim();closeOv();renderSetup();show('setup');pushState();}else{leaveNet();PHASE='menu';G=null;show('menu');}}});
  const sub=$('#ov-card .sub');if(sub)sub.textContent=NET.mode==='host'?'Leaving ends the battle for everyone.':'Bots wait while you’re away.';
};

