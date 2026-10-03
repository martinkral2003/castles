// ===== Brimfall: names, commands, Send chips, spell bar, research cards, castle panel =====
// ---------- names & labels ----------
const NAMES=['Ashmaw','Cindergate','Gloomreach','Brimhold','Hollowspire','Blackmere','Emberdeep','Marrowgate','Nethermire','Sootfang','Dreadhollow','Grimtooth','Scorchpeak','Bonereach','Wailing Pit','Charnel Rise','Duskmaw','Vexmoor','Hellsfang','Cinderfall','Blightwatch','Gallowmere','Smokehold','Wraithgate','Sulfur Crag','Ravenscar','Ebonvault','Pyre Hollow','Mournspire','Skullridge','Thornpit','Ironmaw','Rotmere','Gravewind','Bloodford','Ashenreach','Dirgehold','Cauldron Deep','Flayfield','Kilnheart','Veilrot','Shrikeholt','Gorgemaw','Wyrmcinder','Ossuary','Fellbrand','Sablecairn','Molochgate'];
function castleNames(n,seed){const R=mkRng(seed),a=[...NAMES];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return Array.from({length:n},(_,i)=>a[i%a.length]+(i<a.length?'':' '+['II','III','IV','V'][Math.min(3,Math.floor(i/a.length)-1)]));}
const LVNAME=['','Den','Lair','Keep','Stronghold','Infernal seat','Infernal seat'];
function kindName(c){if(c.kind==='m')return'Soul spring';if(c.owner===NEUTRAL&&!(c.capital>=0))return c.kind==='f'?'Bone fortress':'Hovel';
  return(c.capital>=0?'Throne':LVNAME[c.lv]||'Den')+(c.path&&PATHS[c.path]?' · '+PATHS[c.path].name:'');}
function ownerName(o){if(o===NEUTRAL||o==null)return'Neutral';const s=G.slots[o];return s?slotLabel(s,o):'Someone';}
const myTeam=()=>mySlot>=0?teamOf(G,mySlot):null;
const allSeeing=()=>!G||mySlot<0||G.pl[mySlot].out||G.over||(G.opts&&!G.opts.fog);
const isTeam=o=>o!==NEUTRAL&&mySlot>=0&&teamOf(G,o)===myTeam();
function hasMates(){if(mySlot<0)return false;const t=G.slots[mySlot].t;return !!t&&G.slots.some((s,i)=>i!==mySlot&&(s.k==='h'||s.k==='b')&&s.t===t);}
const escH=s=>String(s==null?'':s).replace(/[&<>"']/g,ch=>'&#'+ch.charCodeAt(0)+';');
const gly=(id,cls)=>`<svg class="gl${cls?' '+cls:''}" aria-hidden="true"><use href="#g-${id}"/></svg>`;
const putT=(el,t)=>{if(el&&el.textContent!==t)el.textContent=t;};
const putH=(el,h)=>{if(el&&el._h!==h){el._h=h;el.innerHTML=h;}};
const fmtSo=v=>!Number.isFinite(v)?'–':v>=100||Math.abs(v-Math.round(v))<.05?String(Math.round(v)):v.toFixed(1);
const UGL=['minion','lesser','greater','lord'];
const cardsOf=k=>{const id=CARDS.findIndex(q=>q&&q.key===k);return id>=0&&mySlot>=0?cardCount(G,mySlot,id)|0:0;};
const remoteSol=()=>NET.mode==='client'||NET.mode==='replay'?(G.csol||[]):G.sol;

// ---------- commands ----------
const CMDS={1:(s,a,b)=>squad(G,s,a,b),2:(s,a,b)=>setRoute(G,s,a,b),3:(s,a)=>upgrade(G,s,a),4:(s,a,b)=>setMode(G,s,a,b),5:s=>drawResearch(G,s),6:(s,a,b,c)=>useSpell(G,s,a,b,c),
  9:(s,a)=>setMix(G,s,a),11:(s,a)=>fortify(G,s,a),12:(s,a,b)=>choosePath(G,s,a,b),13:(s,a)=>pickCard(G,s,a),14:s=>buildWonder(G,s),17:(s,a)=>hireLord(G,s,a)};
// a throwing command must not wedge the host's peer loop (it would replay the same seq forever)
function runCmd(slot,m){const f=CMDS[m[1]],a=m[2];if(!G||!f||!Number.isInteger(a))return false;try{return f(slot,a,+m[3]||0,+m[4]||0);}catch(e){console.error('command',m[1],e);return false;}}
function issue(type,a,b=0,c=0){
  if(!G||G.over||mySlot<0||G.pl[mySlot].out)return;
  if(NET.mode==='client'){NET.seq++;NET.cmds.push([NET.seq,type,a,b|0,c|0]);if(NET.cmds.length>12)NET.cmds.shift();
    NET.nr&&NET.nr.presence({c:NET.cmds}).catch(()=>{});
    const k=type===2||type===4?G.castles[a]:null;if(k){if(type===2)k.route=(k.route===b||b<0)?-1:b;else k.mode=b?1:0;}
  }else runCmd(mySlot,[0,type,a,b,c]);
  if(type===9)G.pl[mySlot].mix=a;
  setTimeout(()=>{updatePanel();updateBar();},60);
}
let pouring=null;
function pourStart(from,to){pouring={from,to};if(NET.mode==='client'){const k=from+'_'+to;if(k!==lastPourSent){lastPourSent=k;NET.nr&&NET.nr.presence({p:[from,to]}).catch(()=>{});}}else if(G)setPour(G,mySlot,from,to);}
function pourStop(){if(!pouring&&!lastPourSent)return;pouring=null;if(NET.mode==='client'){lastPourSent='';NET.nr&&NET.nr.presence({p:null}).catch(()=>{});}else if(G&&mySlot>=0)setPour(G,mySlot,-1,-1);}

// ---------- pings ----------
const lastPing={};
function sendPing(ci,type){if(mySlot<0)return;pings.push({c:ci,type,s:mySlot,t:performance.now()});
  if(NET.nr)NET.nr.presence({pg:[ci,type,Math.floor(Date.now()%1e9)]}).catch(()=>{});toast(type?'You called for help at '+G.names[ci]+'.':'You marked '+G.names[ci]+' as a target.',2200);}
function readPings(peers,slots){if(!G||mySlot<0)return;
  for(const p of peers){if(p.sameTab||!p.presence)continue;const pg=p.presence.pg;if(!Array.isArray(pg))continue;
    const key=p.peer+':'+pg[2];if(lastPing[p.peer]===key)continue;lastPing[p.peer]=key;
    const s=p.presence.r==='h'?0:slots.findIndex(x=>x.k==='h'&&x.p===p.peer);if(s<0||!isTeam(s)||!G.castles[pg[0]])continue;
    pings.push({c:pg[0]|0,type:pg[1]?1:0,s,t:performance.now()});toast(ownerName(s)+(pg[1]?' needs help at ':' says attack ')+G.names[pg[0]]+'.',3000);}}

// ---------- Send chips ----------
let myMix=15;
function myLords(){if(!G||mySlot<0)return 0;let n=0;for(const c of G.castles)if(c.owner===mySlot&&Array.isArray(c.lords))n+=c.lords.length;for(const s of remoteSol())if(s.o===mySlot&&s.u===3)n++;return n;}
function resetMix(){myMix=15;renderMix();}
function renderMix(){const lord=myLords()>0;document.querySelectorAll('#mix [data-u]').forEach(b=>{const u=+b.dataset.u,on=String(!!((myMix>>u)&1));if(b.getAttribute('aria-pressed')!==on)b.setAttribute('aria-pressed',on);
  if(u===3&&b.classList.contains('off')===lord){b.classList.toggle('off',!lord);b.setAttribute('aria-disabled',String(!lord));}});}
document.querySelectorAll('#mix [data-u]').forEach(b=>b.onclick=()=>{const u=+b.dataset.u;
  if(u===3&&!myLords()){toast('No lord yet. Give a level 3 castle the Citadel path, then raise one there.',2800);return;}
  const m=myMix^(1<<u);if(!(m&7)){toast('Keep at least one kind of demon marching.',1600);return;}
  myMix=m;renderMix();issue(9,m);});
function hordeArt(){const col=mySlot>=0?COLORS[mySlot]:COLORS[0],H=[24,30,42,50],d=Math.min(2.5,window.devicePixelRatio||1);
  document.querySelectorAll('#ov-card canvas[data-uc]').forEach(cv=>{const u=+cv.dataset.uc,W=cv.clientWidth||60,Hc=cv.clientHeight||60;cv.width=Math.round(W*d);cv.height=Math.round(Hc*d);
    try{if(typeof drawUnit!=='function')throw 0;const x=cv.getContext('2d');x.scale(d,d);drawUnit(x,W/2,Hc-7,Hc*.76/H[u],col,.5,1,u,u===3,false,1);cv.classList.add('ok');}catch(e){cv.hidden=true;}});}
$('#b-units').onclick=()=>{const U=t=>UNIT[t]||{},pt=t=>`<span class="upt"><canvas data-uc="${t}"></canvas>${gly(UGL[t])}</span>`,hp=U(0).hp?(U(1).hp/U(0).hp).toFixed(1):'2';
  overlay(`<h3>Your horde</h3><div class="ut">
<div class="utr">${pt(0)}<p><b>Minions</b> breed free in every castle up to its cap. Weak alone, deadly in a swarm. Supply ${U(0).sup}.</p></div>
<div class="utr">${pt(1)}<p><b>Lesser demons</b> are the sturdy line, with ${hp}× a minion's health. Supply ${U(1).sup}. Only a Spawner castle breeds them (${escH(reqTxt(1))}).</p></div>
<div class="utr">${pt(2)}<p><b>Greater demons</b> fly fast, charge, tear through minions, swing round lesser demons and smash walls. Supply ${U(2).sup}. ${escH(reqTxt(2))}.</p></div>
<div class="utr">${pt(3)}<p><b>Lords</b> are raised one per Citadel. Supply ${U(3).sup}. A lord leads the next block of 6 or more out, and demons near him hit harder and march faster.</p></div>
<p>Your horde cap counts <b>supply</b>, not heads, in the army and in every castle.</p>
<p><b>Souls mode</b> in a castle panel stops its breeding and turns it into souls. Kills pay a few souls too, and the loser gets a little back. Souls buy everything.</p>
<p><b>Send chips</b> pick who marches when you hold or tap a road. Routes never take the lord.</p></div><button class="btn primary" data-a="ok">Got it</button>`,{ok:closeOv});hordeArt();};

// ---------- spell bar: 0 Horde Boost (no target), 1 Spies (tap the map) ----------
const SPELL_HINT=['','Tap the map where your spies should look.'];
const SPGLY=['sp3','sp2'];
document.querySelectorAll('.ab[data-ab]').forEach(b=>b.onclick=()=>{
  if(!G||G.over||mySlot<0||G.pl[mySlot].out)return;const k=+b.dataset.ab,p=G.pl[mySlot],S=SPELLS[k];if(!S)return;
  if(armedAb===k){armedAb=-1;updateBar();toast(S.name+' put away.',1200);return;}
  const left=(p.cd[k]||0)-G.gt;if(left>0){toast(S.name+' recharges in '+Math.ceil(left/G.sp)+' s.',1500);return;}
  if(k===0&&p.hz>G.gt){toast('Your horde is already roused.',1400);return;}
  const cost=spellCost(G,mySlot,k);if(p.souls<cost){toast(S.name+' needs '+cost+' souls.',1600);return;}
  if(S.kind==='global'){issue(6,k,0,0);toast('The horde howls: +'+Math.round(HORDE_DMG*100*(1+.4*cardsOf('horde')))+'% damage, +'+Math.round(HORDE_SPD*100*(1+.4*cardsOf('horde')))+'% speed for '+Math.round(spellDurOf(G,mySlot,0))+' s.',2400);return;}
  armedAb=k;updateBar();toast(SPELL_HINT[k]||'Tap the map to cast '+S.name+'.',2600);});
function updateBar(){
  if(!G||mySlot<0)return;const p=G.pl[mySlot];if(!p)return;
  document.querySelectorAll('.ab[data-ab]').forEach(b=>{const k=+b.dataset.ab,S=SPELLS[k],u=b.querySelector('use'),cv=b.querySelector('.cdv');if(!S)return;let cn='ab';
    const cost=spellCost(G,mySlot,k),cd=spellCd(G,mySlot,k),left=Math.max(0,(p.cd[k]||0)-G.gt),on=k===0&&p.hz>G.gt;
    putT(b.querySelector('b'),S.name);putT(b.querySelector('small'),on?'roused '+Math.ceil((p.hz-G.gt)/G.sp)+' s':left>0?Math.ceil(left/G.sp)+' s':cost+' souls');
    cv.style.width=on?Math.max(0,(p.hz-G.gt)/spellDurOf(G,mySlot,0)*100).toFixed(1)+'%':left>0?Math.max(0,100-left/cd*100).toFixed(1)+'%':'0';if(u.getAttribute('href')!=='#g-'+SPGLY[k])u.setAttribute('href','#g-'+SPGLY[k]);
    cn+=(on?' arm':left>0?' cd dim':p.souls<cost||p.out?' dim':'')+(armedAb===k?' arm':'');
    if(b.className!==cn)b.className=cn;});
  const rb=$('#b-res'),cost=researchCost(G,mySlot),off=Array.isArray(p.offer)&&p.offer.length>0,cn='ab'+(off?' pulse':p.souls>=cost&&!p.out?' ready':'');
  if(rb.className!==cn)rb.className=cn;putT(rb.querySelector('b'),off?'Choose a card!':'Research');putT($('#res-sub'),off?'pick 1 of '+p.offer.length:'draw · '+cost);
  $('#res-prog').style.width=(off?100:Math.min(100,Math.max(0,p.souls)/cost*100)).toFixed(1)+'%';
  renderMix();
}

// ---------- research cards: one tap pays, draws two and shows them ----------
const TAGS={soul:['Souls','wisp'],war:['War','blade'],lord:['Lords','crown'],magic:['Sorcery','sp2']};
const TIERN=['Minor','Solid','Major'];
const FLAVOR={grow:'The pits never stop writhing.',tithe:'Every drop is counted twice.',well:'Dig deeper. Something answers.',thrift:'Hell keeps a ledger, too.',acap:'By writ, the legion swells.',
  dmg:'Whetted on bone.',hp:'Scar on scar on scar.',march:'Ride the hot wind.',def:'Mortar mixed with brimstone.',siege:'No wall stands forever.',blood:'Born to the slaughter.',tower:'The towers learn to hate.',
  laura:'Kneel, and grow strong.',lhp:'A lord does not fall easily.',lcost:'Signed in someone else’s blood.',horde:'One howl, ten thousand throats.',spy:'Nothing hides from the Eye.'};
let resOpen=false,resKey='',resBusy=0,resDealt='';
$('#b-res').onclick=()=>{if(!G||mySlot<0||G.over||G.pl[mySlot].out)return;const p=G.pl[mySlot];
  if(Array.isArray(p.offer)&&p.offer.length){resOpen=true;resKey='';renderResearch();return;}
  const cost=researchCost(G,mySlot);if(p.souls<cost){toast('Research needs '+cost+' souls. You hold '+Math.floor(p.souls)+'.',1800);return;}
  resBusy=performance.now();issue(5,0);resOpen=true;resKey='';renderResearch();setTimeout(renderResearch,90);};
function cardHtml(id,i,tier){const C=CARDS[id]||{},n=cardCount(G,mySlot,id),T=TAGS[C.tag]||TAGS.war,mul=C.max===1?1:TIER_MUL[tier]||1;
  return`<button class="rcard t-${escH(C.tag||'war')}" data-pick="${i}" style="--i:${i}"><span class="rtag">${gly(T[1])}${T[0]}</span><b class="rname">${escH(C.name)}</b>`+
    `<span class="reff">${escH(cardEffect(id,mul))}</span><small class="rdesc">${escH(C.desc)}</small><span class="rlv">${C.max>1?TIERN[tier]+' boon'+(n>0?' · you have '+escH(cardEffect(id,n)):''):'Unique'}</span>${FLAVOR[C.key]?`<i class="rfl">${FLAVOR[C.key]}</i>`:''}</button>`;}
function renderResearch(){
  if(!resOpen||!G||mySlot<0)return;const p=G.pl[mySlot];if(!p||G.over||p.out){resOpen=false;return;}
  const off=Array.isArray(p.offer)&&p.offer.length?p.offer:null;
  if(!off&&performance.now()-resBusy>2500){resOpen=false;closeOv();return;}
  const key=off?'o'+off.join('.')+'t'+(p.otier|0):'wait';
  if(key!==resKey||$('#ov').hidden||!$('#ov-card .rsh')){resKey=key;let h;
    if(off){const ok=off.join('.');h=`<div class="rsh"><h3>Choose a card</h3><p class="sub">Keep one. It takes hold at once. Cards drawn later are stronger.</p><div class="rdeck${ok!==resDealt?' deal':''}">${off.map((id,i)=>cardHtml(id,i,p.otier|0)).join('')}</div></div><button class="btn" data-a="close">Decide later</button>`;resDealt=ok;}
    else h=`<div class="rsh"><h3>Research</h3><p class="sub">Drawing cards…</p></div><button class="btn" data-a="close">Close</button>`;
    overlay(h,{close:()=>{resOpen=false;closeOv();}});
    document.querySelectorAll('#ov-card [data-pick]').forEach(b=>b.onclick=()=>pickOffered(+b.dataset.pick));}
}
function pickOffered(i){const p=G.pl[mySlot],off=p.offer;if(!off||off[i]==null)return;const id=off[i],C=CARDS[id]||{},mul=C.max===1?1:TIER_MUL[p.otier|0]||1;
  issue(13,i);resOpen=false;resDealt='';closeOv();
  toast((C.name||'Card')+': '+cardEffect(id,mul)+'.',2600);}
setInterval(()=>{if(resOpen&&!$('#ov').hidden&&$('#ov-card .rsh'))renderResearch();else resOpen=false;},700);

// ---------- castle panel ----------
let panelKey='',panelSel=-1,panelAt=0;const pg=f=>e=>{if(performance.now()-panelAt<450)return;f(e);};
function fmtClock(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function chip(t,cls){return`<span class="chip ${cls||''}">${t}</span>`;}
const secH=(t,x)=>`<div class="sec"><span>${t}</span>${x||''}</div>`;
const costEl=k=>`<em class="cost" data-c="${k}">${gly('wisp')}<span></span></em>`;
function reqTxt(t){const r=UNIT[t]&&UNIT[t].req;return t===0?'any castle':t===3?'raised in a Citadel':'a Spawner castle at level '+r+(t===1?' or higher':' or 6');}
function upSub(c){const n=c.lv+1,q={...c,lv:n};if(c.kind==='m')return'+'+(passiveRate(G,{...q,sup:true})*G.sp).toFixed(1)+' souls/s at level '+n+(c.sup?'':' once linked to your Throne');
  let t='Holds '+capOf(q)+' supply, breeds and mines souls faster';
  if(c.capital>=0){const a=armyCap(G,mySlot);let b=a;c.lv=n;try{b=armyCap(G,mySlot);}finally{c.lv=n-1;}if(b>a)t+=', horde cap +'+(b-a);}
  for(let u=1;u<NU;u++)if(!unitOk(c,u)&&unitOk(q,u))t+=', breeds '+UNIT[u].name.toLowerCase()+'s';
  return t+(n===3&&!c.path?', opens paths':'');}
const sigOf=s=>s.capital>=0?'crown':s.kind==='m'?'wisp':s.owner===NEUTRAL?(s.kind==='f'?'skull':'hut'):'keep';
const headH=(s,col)=>`<div class="ph"><span class="sig" style="--c:${col}">${gly(sigOf(s))}</span><div class="t"><div class="nm"><b data-n></b><span class="kd" data-kd></span></div><small data-st></small></div><button class="x" aria-label="Close">${gly('x')}</button></div><div class="chips" data-ch></div><div class="comp" data-cp></div>`;
const pingsH=()=>`<div class="pings"><button data-ping="0"><i class="pm">!</i>Attack here</button><button data-ping="1"><i class="pm d">+</i>Defend here</button></div>`;
function updatePanel(){
  const P=$('#panel');
  if(!G||sel<0||G.over||!G.castles[sel]){if(!P.hidden){P.hidden=true;panelKey='';panelSel=-1;}sel=-1;return;}
  const c=G.castles[sel],p=mySlot>=0?G.pl[mySlot]:null,mine=!!p&&c.owner===mySlot&&!p.out;
  const visible=mine||isVisibleC(sel),s=visible?c:seen[sel];
  if(!s){P.hidden=true;panelKey='';sel=-1;return;}
  const ls=mine&&c.path===2?lordStatus(G,mySlot,sel):null,lords=visible&&Array.isArray(c.lords)?c.lords:[];
  const key=[sel,mine,visible,s.owner,s.kind,s.lv,s.capital,visible?c.path:s.path,lords.map(l=>l.nm).join('.'),hasMates(),!mine?'':[c.mode,c.tl|0,c.route,c.build?c.build.k:-1,
    ls?!!ls.lord:'',c.capital>=0?p.ws+'.'+(p.wb>=0):'',c.lv>=maxLv(c)].join(':')].join(',');
  if(key!==panelKey){const same=!P.hidden&&panelSel===sel,top=P.scrollTop;if(!same)panelAt=performance.now();panelSel=sel;panelKey=key;P.hidden=false;
    P.innerHTML=mine?ownPanel(c,p,ls,lords):headH(s,s.owner===NEUTRAL?'var(--neutral)':COLORS[s.owner])+'<p class="hint" data-oh></p>'+(hasMates()?pingsH():'');
    P.scrollTop=same?top:0;bindPanel(P);}
  tickPanel(P,c,s,p,mine,visible,ls,lords);
}
function ownPanel(c,p,ls,lords){const spring=c.kind==='m';let h=headH(c,COLORS[mySlot]);
  if(!spring)h+=`<div class="tog"><button data-mode="0" aria-pressed="${!c.mode}"><b>Army</b><small data-armp>breeds troops</small></button><button class="so" data-mode="1" aria-pressed="${!!c.mode}"><b>Souls</b><small data-soulp>breeding becomes souls</small></button></div><p class="hint" data-modeh hidden></p>`;
  if(c.build)h+=`<div class="sec bl"><span data-bl></span></div><div class="bar-prog"><i data-bp></i></div>`;
  if(c.capital>=0&&(!G.opts||G.opts.wonder)){const n=WONDER_STAGES,mins=Math.round(WONDER_HOLD/60);
    h+=secH('Hellgate','<span class="pips">'+Array.from({length:n},(_,i)=>`<i class="${i<p.ws?'on':i===p.ws&&p.wb>=0?'now':''}"></i>`).join('')+'</span>');
    if(p.ws>=n||p.wb>=0)h+='<p class="hint hg" data-wd></p>'+(p.wb>=0?'<div class="bar-prog hg"><i data-wp></i></div>':'');
    else if(c.lv<3)h+=`<p class="hint">Raise your Throne to level 3 to begin the Hellgate: ${n} stages, then hold the Throne ${mins} minutes to win.</p>`;
    else h+=`<button class="act hg" data-wonder><b>Raise stage ${p.ws+1} of ${n}</b>${costEl('wo')}<small>${Math.round(WONDER_T)} s each. After the last, hold your Throne ${mins} minutes to win. Everyone is warned.</small></button>`;}
  if(!spring&&!c.path&&!c.build&&c.lv>=3){h+=secH('Choose a path',costEl('pa'))+'<div class="paths">';
    for(let q=1;q<PATHS.length;q++)if(PATHS[q]&&!(q===2&&c.capital>=0))h+=`<button class="act pa pa${q}" data-path="${q}"><b>${escH(PATHS[q].name)}</b><small>${escH(PATHS[q].desc)}</small></button>`;
    h+=`</div><p class="hint">Permanent. Takes ${Math.round(PATH_T)} s, and breeding pauses meanwhile.</p>`;}
  if(c.path===2){h+=secH('Lord');const own=ls&&ls.lord;
    lords.forEach((l,i)=>{h+=`<div class="lord">${gly('lord')}<div><b>Lord ${escH(l.nm||'')}</b><small data-lh="${i}"></small><div class="bar-prog hp"><i data-lhp="${i}"></i></div></div></div>`;});
    if(own&&!lords.some(l=>l===own||l.id!=null&&l.id===own.id))h+=`<p class="hint">Lord ${escH(own.nm||'')} of this citadel is out in the field.</p>`;
    else if(ls&&!own)h+=`<button class="act lordb" data-lord><b>${gly('lord')}Raise a lord</b>${costEl('lo')}<small data-lw></small></button>`;}
  if(!c.build&&c.lv<maxLv(c))h+=secH(spring?'Deepen the spring':'Raise the castle')+`<button class="act up" data-up><b>${spring?'Spring level '+(c.lv+1):escH(LVNAME[c.lv+1]||'Den')+', level '+(c.lv+1)}</b>${costEl('up')}<small data-ups></small></button>`;
  h+=secH('Towers','<span class="pips">'+[1,2,3].map(i=>`<i class="${i<=(c.tl|0)?'on':i===(c.tl|0)+1&&c.build&&c.build.k===1?'now':''}"></i>`).join('')+'</span>');
  if((c.tl|0)>=3)h+=`<p class="hint">Fully fortified: the ring of towers fires on anything that comes near while the castle holds troops.</p>`;
  else h+=`<button class="act tw" data-tw><b>${gly('tower')}${(c.tl|0)?'Raise the towers to level '+((c.tl|0)+1):'Build a ring of towers'}</b>${costEl('tw')}<small data-tws></small></button>`;
  if(c.route>=0)h+=`<div class="rt"><span data-rt></span><button data-stop>Stop route</button></div>`;
  if(hasMates())h+=pingsH();
  return h;}
function bindPanel(P){const on=(q,f)=>P.querySelectorAll(q).forEach(b=>b.onclick=pg(()=>f(b)));
  on('.x',()=>{sel=-1;updatePanel();});
  on('[data-mode]',b=>issue(4,sel,+b.dataset.mode));
  on('[data-wonder]',()=>issue(14,0));
  on('[data-path]',b=>issue(12,sel,+b.dataset.path));
  on('[data-lord]',()=>issue(17,sel));
  on('[data-up]',()=>issue(3,sel));
  on('[data-tw]',()=>issue(11,sel));
  on('[data-stop]',()=>issue(2,sel,-1));
  on('[data-ping]',b=>sendPing(sel,+b.dataset.ping));}
function tickPanel(P,c,s,p,mine,visible,ls,lords){
  const sz=Math.floor(s.size||0),pth=visible?c.path:s.path;
  putT(P.querySelector('[data-n]'),G.names[sel]||'');
  putT(P.querySelector('[data-kd]'),kindName(s)+(s.owner!==NEUTRAL&&!mine?' · '+ownerName(s.owner):''));
  let st;
  if(mine){const cap=capOf(c),ld=Math.round(load(c)),gr=growRate(G,c)*G.sp,sr=soulRate(G,c)*G.sp;st=ld+' / '+cap+' supply';
    if(c.kind!=='m')st+=c.mode?', breeding stopped':c.build?', breeding paused':ld>=cap?', full':(G.tot[mySlot]|0)>=armyCap(G,mySlot)?', horde at cap':gr>0?', +'+gr.toFixed(1)+'/s breeding':'';
    if(sr>0)st+=', +'+sr.toFixed(1)+' souls/s';}
  else st=(visible?'':'Last seen: ')+sz+' troops'+(s.owner===NEUTRAL&&visible&&c.base?', heals to '+Math.round(c.base):'');
  putT(P.querySelector('[data-st]'),st);
  let ch='';
  if(s.capital>=0)ch+=chip(gly('crown')+'Throne','gold');
  if(pth&&s.owner!==NEUTRAL&&PATHS[pth])ch+=chip(escH(PATHS[pth].name),'ember');
  if(visible&&(c.tl|0)>0)ch+=chip(gly('tower')+'Towers '+c.tl,'ember');
  if(mine&&c.mode&&c.kind!=='m')ch+=chip(gly('wisp')+'Souls mode','soul');
  if(c.hill)ch+=chip('Hill, +30% defence');
  if(visible&&isWalled(c))ch+=chip('Walled','warn');
  if(visible&&c.assault)ch+=chip('Under attack','bad');
  if(mine){if(!c.sup&&!(c.capital>=0))ch+=chip('Cut off from the Throne','warn');}
  else{if(lords.length)ch+=chip(gly('lord')+'Lord inside','gold');
    ch+=chip(gly('wisp')+'Loot '+Math.round(8*(s.lv||1)+(isWalled(c)?60:0)),'soul');
    if(s.owner!==NEUTRAL&&s.kind!=='m'&&s.lv>1)ch+=chip('Drops to level '+(s.lv-1)+(pth?' and loses its path':'')+' if taken');}
  putH(P.querySelector('[data-ch]'),ch);
  let cp='';if(s.u)for(let t=0;t<NU;t++){const n=Math.floor(s.u[t]||0);if(n>0)cp+=`<span class="cp">${gly(UGL[t])}<b>${n}</b><small>${escH(UNIT[t].short)}</small></span>`;}
  for(const l of lords)cp+=`<span class="cp lord">${gly('lord')}<b>${escH(l.nm||'Lord')}</b></span>`;
  if(mine&&c.kind!=='m')cp+=`<span class="cp mu">muster ${musterCap(c)}</span>`;
  putH(P.querySelector('[data-cp]'),cp);
  if(!mine){const oh=P.querySelector('[data-oh]');let t='';
    if(visible&&isWalled(c))t=cardsOf('siege')?'Walled, but your Siegebreakers strike it at full strength.':'Walled: attackers do '+Math.round(WALL_MUL*100)+'% damage unless they bring siege (greater demons, lords or Siegebreakers).';
    else if(s.kind==='m')t='A soul spring pours out souls for whoever holds it, more at higher levels. Its guards will fight.';
    else if(s.owner===NEUTRAL)t='Neutrals heal when left alone: strike with one solid block.';
    if(visible&&(c.tl|0)>0)t=(t?t+' ':'')+'Its towers shoot at anyone nearby.';
    putT(oh,t);if(oh)oh.hidden=!t;return;}
  const souls=p.souls,cost=(k,v,block)=>P.querySelectorAll('[data-c="'+k+'"]').forEach(e=>{const ok=Number.isFinite(v);putT(e.lastChild,ok?fmtSo(v):'–');e.classList.toggle('no',!ok||souls<v);const b=e.closest('button');if(b)b.disabled=!ok||souls<v||!!block;});
  const mh=P.querySelector('[data-modeh]');if(mh){let t='';if(c.mode)t=c.sup||c.capital>=0?'This castle mines souls instead of breeding. Its garrison stays and defends.':'Cut off from your Throne: Souls mode yields half.';
    else if(c.kind!=='m')t='';putT(mh,t);mh.hidden=!t;mh.classList.toggle('warn',!!c.mode&&!c.sup&&c.capital<0);}
  putT(P.querySelector('[data-armp]'),c.build?'building…':'+'+(growRate(G,{...c,mode:0})*G.sp).toFixed(1)+' troops/s');
  putT(P.querySelector('[data-soulp]'),'+'+(modeRate(G,{...c,mode:1})*G.sp).toFixed(1)+' souls/s');
  if(c.build){const b=c.build,pr=b.dur>1?b.t/b.dur:b.t;putT(P.querySelector('[data-bl]'),(b.k>=20?'Becoming a '+(PATHS[b.k-20]?PATHS[b.k-20].name:'new path'):b.k===1?'Raising the towers to level '+((c.tl|0)+1):'Rising to level '+(c.lv+1))+' · breeding paused');
    const bp=P.querySelector('[data-bp]');if(bp)bp.style.width=Math.round(Math.max(0,Math.min(1,pr))*100)+'%';}
  const wd=P.querySelector('[data-wd]');if(wd){if(p.ws>=WONDER_STAGES)putT(wd,'The Hellgate stands open. Hold your Throne: '+fmtClock((WONDER_HOLD-p.wh)/G.sp)+' left'+(c.assault?' (under attack, losing time)':'')+'.');
    else{putT(wd,'Raising stage '+(p.ws+1)+' of '+WONDER_STAGES+(c.assault?' (paused while under attack)':'')+'.');const wp=P.querySelector('[data-wp]');if(wp)wp.style.width=Math.round(Math.max(0,Math.min(1,p.wb/WONDER_T))*100)+'%';}}
  cost('wo',WONDER_COST);
  if(P.querySelector('[data-path]')){const v=pathCost(G,mySlot);cost('pa',v);P.querySelectorAll('[data-path]').forEach(b=>b.disabled=!(souls>=v));}
  if(ls){cost('lo',ls.price,!ls.can);putT(P.querySelector('[data-lw]'),!ls.can&&typeof ls.why==='string'&&ls.why?ls.why:'One per Citadel. He leads your blocks; demons near him fight harder.');}
  lords.forEach((l,i)=>{const mx=l.max||l.hp||1;putT(P.querySelector('[data-lh="'+i+'"]'),'Serves here · '+Math.ceil(l.hp)+' / '+Math.round(mx)+' hp'+(l.rk?' · rank '+l.rk:''));const e=P.querySelector('[data-lhp="'+i+'"]');if(e)e.style.width=Math.round(Math.max(0,Math.min(1,l.hp/mx))*100)+'%';});
  if(P.querySelector('[data-up]')){cost('up',upCost(G,mySlot,c),!!c.build);putT(P.querySelector('[data-ups]'),upSub(c));}
  if(P.querySelector('[data-tw]')){const n=(c.tl|0)+1;cost('tw',towerCost(G,mySlot,c),!!c.build);putT(P.querySelector('[data-tws]'),'Level '+n+': shoots enemies within '+Math.round(TW_R[n]*(1+(mod(G,mySlot,'tower')-1)/2))+' of the castle, +'+Math.round(n*6)+'% defence.');}
  const rt=P.querySelector('[data-rt]');if(rt){const d=G.castles[c.route],full=d&&isTeam(d.owner)&&load(d)>=capOf(d)*.95;putT(rt,!d?'':full?'Route to '+G.names[c.route]+' waits: that castle is full':'Troops stream to '+G.names[c.route]);}
}
// keeps the toast clear of the tutorial card and the Hellgate banner
function stageVars(){const st=$('#stage'),t=$('#tut'),w=$('#wbanner');if(!st)return;const a=(t&&!t.hidden?t.offsetHeight+8:0)+'px',b=(w&&!w.hidden?w.offsetHeight+6:0)+'px';
  if(st.style.getPropertyValue('--tut-h')!==a)st.style.setProperty('--tut-h',a);if(st.style.getPropertyValue('--wb-h')!==b)st.style.setProperty('--wb-h',b);}
setInterval(()=>{if(G&&$('#s-game').classList.contains('on')){updatePanel();updateBar();stageVars();}},250);
