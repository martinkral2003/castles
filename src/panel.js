// ===== Brimfall: names, commands, Send chips, spell bar, research cards, castle panel =====
// ---------- names & labels ----------
const NAMES=['Ashmaw','Cindergate','Gloomreach','Brimhold','Hollowspire','Blackmere','Emberdeep','Marrowgate','Nethermire','Sootfang','Dreadhollow','Grimtooth','Scorchpeak','Bonereach','Wailing Pit','Charnel Rise','Duskmaw','Vexmoor','Hellsfang','Cinderfall','Blightwatch','Gallowmere','Smokehold','Wraithgate','Sulfur Crag','Ravenscar','Ebonvault','Pyre Hollow','Mournspire','Skullridge','Thornpit','Ironmaw','Rotmere','Gravewind','Bloodford','Ashenreach','Dirgehold','Cauldron Deep','Flayfield','Kilnheart','Veilrot','Shrikeholt','Gorgemaw','Wyrmcinder','Ossuary','Fellbrand','Sablecairn','Molochgate'];
function castleNames(n,seed){const R=mkRng(seed),a=[...NAMES];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return Array.from({length:n},(_,i)=>a[i%a.length]+(i<a.length?'':' '+['II','III','IV','V'][Math.min(3,Math.floor(i/a.length)-1)]));}
const LVNAME=['','Den','Lair','Citadel','Stronghold','Infernal seat','Infernal seat'];
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
const CMDS={1:(s,a,b)=>squad(G,s,a,b),2:(s,a,b)=>setRoute(G,s,a,b),3:(s,a)=>upgrade(G,s,a),4:(s,a,b)=>setOffer(G,s,a,b),5:s=>drawResearch(G,s),6:(s,a,b,c)=>useSpell(G,s,a,b,c),
  8:(s,a)=>summon(G,s,a),9:(s,a)=>setMix(G,s,a),10:(s,a,b)=>setTrain(G,s,a,b),11:(s,a,b)=>buildTower(G,s,a,b),12:(s,a,b)=>choosePath(G,s,a,b),13:(s,a)=>pickCard(G,s,a),
  14:s=>buildWonder(G,s),15:(s,a,b)=>promote(G,s,a,b),16:(s,a)=>sacrifice(G,s,a),17:(s,a)=>hireLord(G,s,a)};
// a throwing command must not wedge the host's peer loop (it would replay the same seq forever)
function runCmd(slot,m){const f=CMDS[m[1]],a=m[2];if(!G||!f||!Number.isInteger(a))return false;try{return f(slot,a,+m[3]||0,+m[4]||0);}catch(e){console.error('command',m[1],e);return false;}}
function issue(type,a,b=0,c=0){
  if(!G||G.over||mySlot<0||G.pl[mySlot].out)return;
  if(NET.mode==='client'){NET.seq++;NET.cmds.push([NET.seq,type,a,b|0,c|0]);if(NET.cmds.length>12)NET.cmds.shift();
    NET.nr&&NET.nr.presence({c:NET.cmds}).catch(()=>{});
    const k=type===2||type===4||type===10?G.castles[a]:null;if(k){if(type===2)k.route=(k.route===b||b<0)?-1:b;else if(type===4)k.off=b?1:0;else k.tr=b;}
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
  if(u===3&&!myLords()){toast('No lord yet. Give a level 3 castle the Dark Tower path, then raise one there.',2800);return;}
  const m=myMix^(1<<u);if(!(m&7)){toast('Keep at least one kind of demon marching.',1600);return;}
  myMix=m;renderMix();issue(9,m);});
function hordeArt(){const col=mySlot>=0?COLORS[mySlot]:COLORS[0],H=[24,30,42,50],d=Math.min(2.5,window.devicePixelRatio||1);
  document.querySelectorAll('#ov-card canvas[data-uc]').forEach(cv=>{const u=+cv.dataset.uc,W=cv.clientWidth||60,Hc=cv.clientHeight||60;cv.width=Math.round(W*d);cv.height=Math.round(Hc*d);
    try{if(typeof drawUnit!=='function')throw 0;const x=cv.getContext('2d');x.scale(d,d);drawUnit(x,W/2,Hc-7,Hc*.76/H[u],col,.5,1,u,u===3,false,1,0);cv.classList.add('ok');}catch(e){cv.hidden=true;}});}
$('#b-units').onclick=()=>{const U=t=>UNIT[t]||{},pt=t=>`<span class="upt"><canvas data-uc="${t}"></canvas>${gly(UGL[t])}</span>`,hp=U(0).hp?(U(1).hp/U(0).hp).toFixed(1):'2';
  overlay(`<h3>Your horde</h3><div class="ut">
<div class="utr">${pt(0)}<p><b>Minions</b> breed free in every castle up to its cap. Weak alone, deadly in a swarm, and every one of them is a soul waiting to be spent.</p></div>
<div class="utr">${pt(1)}<p><b>Lesser demons</b> are the sturdy line, with ${hp}× a minion's health. Castles train them for ${fmtSo(U(1).souls)} souls each (${escH(reqTxt(1))}).</p></div>
<div class="utr">${pt(2)}<p><b>Greater demons</b> fly fast, charge, tear through minions, swing round lesser demons and smash walls. ${fmtSo(U(2).souls)} souls each (${escH(reqTxt(2))}).</p></div>
<div class="utr">${pt(3)}<p><b>Lords</b> are raised one per Dark Tower. A lord leads the next block of 6 or more out, and demons near him hit harder and march faster.</p></div>
<p><b>Promote</b> in a castle panel turns ${PROMO_N} minions into lesser demons, or lesser into greater, at once. Your horde cap counts heads, not strength.</p>
<p><b>Offer</b> a castle and its spare minions walk to the nearest altar, your Throne or a Soul Well, to be sacrificed. Souls buy everything.</p>
<p><b>Send chips</b> pick who marches when you hold or tap a road. Routes and pilgrims never take the lord.</p></div><button class="btn primary" data-a="ok">Got it</button>`,{ok:closeOv});hordeArt();};

// ---------- spell bar ----------
const SPELL_HINT=['Tap where hellfire should fall. It lands after a short warning.','Tap an enemy or neutral castle to shatter its walls.','Tap anywhere to open the Eye of Hell there.','Tap near your demons to whip them into a frenzy.','Tap an enemy or neutral castle to curse it with plague.'];
function slotSpell(k){const p=G&&mySlot>=0?G.pl[mySlot]:null,id=p&&p.spells?p.spells[k]:-1;return id>=0&&SPELLS[id]?id:-1;}
document.querySelectorAll('.ab[data-ab]').forEach(b=>b.onclick=()=>{
  if(!G||G.over||mySlot<0||G.pl[mySlot].out)return;const k=+b.dataset.ab,p=G.pl[mySlot],id=slotSpell(k);
  if(id<0){toast('Empty spell slot. Draw research cards to learn a spell.',2400);return;}
  const S=SPELLS[id];if(armedAb===k){armedAb=-1;updateBar();toast(S.name+' put away.',1200);return;}
  const left=(p.cd[k]||0)-G.gt;if(left>0){toast(S.name+' recharges in '+Math.ceil(left/G.sp)+' s.',1500);return;}
  const cost=spellCost(G,mySlot,id);if(p.souls<cost){toast(S.name+' needs '+cost+' souls.',1600);return;}
  armedAb=k;updateBar();toast(SPELL_HINT[id]||(S.kind==='castle'?'Tap a castle to cast ':'Tap the map to cast ')+S.name+'.',2600);});
function updateBar(){
  if(!G||mySlot<0)return;const p=G.pl[mySlot];if(!p)return;
  if(armedAb>=0&&slotSpell(armedAb)<0)armedAb=-1;
  document.querySelectorAll('.ab[data-ab]').forEach(b=>{const k=+b.dataset.ab,id=slotSpell(k),u=b.querySelector('use'),cv=b.querySelector('.cdv');let cn='ab';
    if(id<0){putT(b.querySelector('b'),'Empty');putT(b.querySelector('small'),'spell slot');cv.style.width='0';if(u.getAttribute('href')!=='#g-slot')u.setAttribute('href','#g-slot');cn+=' empty dim';}
    else{const S=SPELLS[id],cost=spellCost(G,mySlot,id),cd=spellCd(G,mySlot,id),left=Math.max(0,(p.cd[k]||0)-G.gt);
      putT(b.querySelector('b'),S.name);putT(b.querySelector('small'),left>0?Math.ceil(left/G.sp)+' s':cost+' souls');
      cv.style.width=left>0?Math.max(0,100-left/cd*100).toFixed(1)+'%':'0';if(u.getAttribute('href')!=='#g-sp'+id)u.setAttribute('href','#g-sp'+id);
      cn+=(left>0?' cd dim':p.souls<cost||p.out?' dim':'')+(armedAb===k?' arm':'');}
    if(b.className!==cn)b.className=cn;});
  const rb=$('#b-res'),cost=researchCost(G,mySlot),off=Array.isArray(p.offer)&&p.offer.length>0,cn='ab'+(off?' pulse':p.souls>=cost&&!p.out?' ready':'');
  if(rb.className!==cn)rb.className=cn;putT(rb.querySelector('b'),off?'Choose a card!':'Research');putT($('#res-sub'),off?'pick 1 of '+p.offer.length:'draw · '+cost);
  $('#res-prog').style.width=(off?100:Math.min(100,Math.max(0,p.souls)/cost*100)).toFixed(1)+'%';
  renderMix();
}

// ---------- research cards ----------
const TAGS={soul:['Souls','wisp'],war:['War','blade'],lord:['Lords','crown'],magic:['Sorcery','sp2']};
const FLAVOR={grow:'The pits never stop writhing.',tithe:'Every drop is counted twice.',pilgrim:'They run to the knife now.',well:'Dig deeper. Something answers.',thrift:'Hell keeps a ledger, too.',cap:'Carve the dens wider.',
  acap:'By writ, the legion swells.',dmg:'Whetted on bone.',hp:'Scar on scar on scar.',spd:'Ride the hot wind.',def:'Mortar mixed with brimstone.',siege:'No wall stands forever.',blood:'Born to the slaughter.',
  muster:'Every den empties at the horn.',spire:'The spires learn to hate.',laura:'Kneel, and grow strong.',lhp:'A lord does not fall easily.',lcost:'Signed in someone else’s blood.',learn0:'Let the sky burn.',
  learn1:'Stone remembers it was sand.',learn2:'Nothing hides from the Eye.',learn3:'Rage, borrowed and spent.',learn4:'Rot from the inside out.',spellpow:'Cheaper by the soul.',reach:'Further, wider, longer.'};
function learnOf(C){if(!C)return-1;if(Number.isInteger(C.spell))return C.spell;const m=/^learn(\d)$/.exec(C.key||'');return m?+m[1]:-1;}
let resOpen=false,resKey='',resBusy=0,resDealt='';
$('#b-res').onclick=()=>{if(!G||mySlot<0||G.over)return;resOpen=true;resKey='';renderResearch();};
function cardHtml(id,i){const C=CARDS[id]||{},n=cardCount(G,mySlot,id)|0,sp=learnOf(C),S=sp>=0?SPELLS[sp]:null,T=TAGS[C.tag]||TAGS.war;
  const eff=S?spellCost(G,mySlot,sp)+' souls · '+Math.round(spellCd(G,mySlot,sp))+' s':n>0?cardEffect(id,n)+' → '+cardEffect(id,n+1):cardEffect(id,1);
  return`<button class="rcard t-${escH(C.tag||'war')}${S?' sp':''}" data-pick="${i}" style="--i:${i}"><span class="rtag">${gly(S?'sp'+sp:T[1])}${S?'New spell':T[0]}</span><b class="rname">${escH(S?S.name:C.name)}</b>`+
    `<span class="reff">${escH(eff)}</span><small class="rdesc">${escH(S?S.desc:C.desc)}</small><span class="rlv">${S?'Fills a spell slot':C.max>1?'Level '+n+' → '+(n+1)+' of '+C.max:'Unique'}</span>${FLAVOR[C.key]?`<i class="rfl">${FLAVOR[C.key]}</i>`:''}</button>`;}
function renderResearch(){
  if(!resOpen||!G||mySlot<0)return;const p=G.pl[mySlot];if(!p||G.over||p.out){resOpen=false;return;}
  const off=Array.isArray(p.offer)&&p.offer.length?p.offer:null,cost=researchCost(G,mySlot),can=p.souls>=cost,busy=!off&&performance.now()-resBusy<1500;
  const key=(off?'o'+off.join('.'):'d'+can+cost+busy)+'|'+CARDS.map((C,id)=>cardCount(G,mySlot,id)|0).join('')+'|'+(p.spells||[]).join('.');
  if(key!==resKey||$('#ov').hidden||!$('#ov-card .rsh')){resKey=key;let h;
    if(off){const ok=off.join('.');h=`<div class="rsh"><h3>Choose a card</h3><p class="sub">Keep one. It takes hold at once.</p><div class="rdeck${ok!==resDealt?' deal':''}">${off.map(cardHtml).join('')}</div></div><button class="btn" data-a="close">Decide later</button>`;resDealt=ok;}
    else{let own='';CARDS.forEach((C,id)=>{const n=cardCount(G,mySlot,id)|0;if(n&&C&&learnOf(C)<0)own+=`<span class="rown t-${escH(C.tag)}"><b>${escH(C.name)}</b>${C.max>1?`<em>${n}/${C.max}</em>`:''}<small>${escH(cardEffect(id,n))}</small></span>`;});
      let sl='';(p.spells||[-1,-1]).forEach((id,k)=>{const S=id>=0?SPELLS[id]:null;sl+=S?`<div class="rslot">${gly('sp'+id)}<div><b>${escH(S.name)}</b><small>${escH(S.desc)}</small><em>${spellCost(G,mySlot,id)} souls · ${Math.round(spellCd(G,mySlot,id))} s recharge</em></div></div>`:
        `<div class="rslot empty">${gly('slot')}<div><b>Slot ${k+1} empty</b><small>Spell cards turn up in draws while a slot is free.</small></div></div>`;});
      h=`<div class="rsh"><h3>Research</h3><p class="sub">Draw three cards, keep one. Every draw costs more.</p><button class="btn primary rdraw" data-draw${can&&!busy?'':' disabled'}>${gly('cards')}<span>${busy?'Drawing…':'Draw three cards · '+cost+' souls'}</span></button><p class="rneed" data-need></p>`+
        `<div class="sec"><span>Your cards</span><span class="sub">${p.rn|0} kept</span></div>${own?`<div class="rowns">${own}</div>`:'<p class="hint">No cards yet. Each draw shows three; you keep one.</p>'}<div class="sec"><span>Spells</span></div><div class="rsp">${sl}</div></div><button class="btn" data-a="close">Close</button>`;}
    overlay(h,{close:()=>{resOpen=false;closeOv();}});
    document.querySelectorAll('#ov-card [data-pick]').forEach(b=>b.onclick=()=>pickOffered(+b.dataset.pick));
    const db=$('#ov-card [data-draw]');if(db)db.onclick=()=>{resBusy=performance.now();issue(5,0);renderResearch();setTimeout(renderResearch,90);};}
  const nd=$('#ov-card [data-need]');if(nd)putT(nd,can?'You hold '+Math.floor(p.souls)+' souls.':'You hold '+Math.floor(p.souls)+' of '+cost+' souls. Sacrifice minions at an altar for more.');
}
function pickOffered(i){const p=G.pl[mySlot],off=p.offer;if(!off||off[i]==null)return;const id=off[i],C=CARDS[id]||{},sp=learnOf(C),n=cardCount(G,mySlot,id)|0;
  issue(13,i);resOpen=false;resDealt='';closeOv();
  toast(sp>=0&&SPELLS[sp]?'You learned '+SPELLS[sp].name+'. Tap its slot below to cast it.':(C.name||'Card')+(C.max>1?' '+(n+1)+'/'+C.max:'')+': '+cardEffect(id,n+1)+'.',2600);}
setInterval(()=>{if(resOpen&&!$('#ov').hidden&&$('#ov-card .rsh'))renderResearch();else resOpen=false;},700);

// ---------- castle panel ----------
let panelKey='',panelSel=-1,panelAt=0;const pg=f=>e=>{if(performance.now()-panelAt<450)return;f(e);};
function fmtClock(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function chip(t,cls){return`<span class="chip ${cls||''}">${t}</span>`;}
const secH=(t,x)=>`<div class="sec"><span>${t}</span>${x||''}</div>`;
const costEl=k=>`<em class="cost" data-c="${k}">${gly('wisp')}<span></span></em>`;
function reqTxt(t){const r=UNIT[t]&&UNIT[t].req;if(typeof r==='string'&&r)return /^needs/i.test(r)?r:'needs '+r;return'needs level '+(r>0?r:t===1?2:4)+(t===2?' or Hellforge':'');}
function trainCostOf(c,t){return typeof trainCost==='function'?trainCost(G,mySlot,c,t):UNIT[t].souls*(c.path===4?.6:1);}
function hordeOf(s){let t=0;for(const c of G.castles)if(c.owner===s)t+=c.size;for(const x of remoteSol())if(x.o===s)t++;return t;}
function altarNear(ci){if(typeof altarOf==='function')return[altarOf(G,ci),0];const q=[ci],d={[ci]:0};for(let h=0;h<q.length;h++){const i=q[h],k=G.castles[i];if(isTeam(k.owner)&&isAltar(k))return[i,d[i]];
  for(const {to} of G.adj[i])if(d[to]===undefined&&isTeam(G.castles[to].owner)){d[to]=d[i]+1;q.push(to);}}return[-1,0];}
function upSub(c){const n=c.lv+1,q={...c,lv:n};if(c.kind==='m')return'+'+(soulRate(G,{...q,sup:true,sab:0})*G.sp).toFixed(1)+' souls/s at level '+n+(c.sup?'':' once linked to your Throne');
  let t='Holds '+capOf(q)+', breeds faster';
  if(c.capital>=0){const a=armyCap(G,mySlot);let b=a;c.lv=n;try{b=armyCap(G,mySlot);}finally{c.lv=n-1;}if(b>a)t+=', horde cap +'+(b-a);}
  for(let u=1;u<NU;u++)if(!unitOk(c,u)&&unitOk(q,u))t+=', trains '+UNIT[u].name.toLowerCase()+'s';
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
  const ls=mine&&c.path===3?lordStatus(G,mySlot,sel):null,lords=visible&&Array.isArray(c.lords)?c.lords:[],al=mine&&c.kind!=='m'?altarNear(sel):[-1,0];
  const key=[sel,mine,visible,s.owner,s.kind,s.lv,s.capital,visible?c.path:s.path,lords.map(l=>l.nm).join('.'),hasMates(),!mine?'':[c.off,trainMask(c),c.route,c.build?c.build.k:-1,isAltar(c),unitOk(c,1),unitOk(c,2),
    ls?!!ls.lord:'',c.capital>=0?p.ws+'.'+(p.wb>=0):'',c.lv>=maxLv(c),al[0],G.tw.filter(t=>t.o===mySlot&&t.from===sel).map(t=>t.to+(t.bt>0?'b':'')).join('.')].join(':')].join(',');
  if(key!==panelKey){const same=!P.hidden&&panelSel===sel,top=P.scrollTop;if(!same)panelAt=performance.now();panelSel=sel;panelKey=key;P.hidden=false;
    P.innerHTML=mine?ownPanel(c,p,ls,lords):headH(s,s.owner===NEUTRAL?'var(--neutral)':COLORS[s.owner])+'<p class="hint" data-oh></p>'+(hasMates()?pingsH():'');
    P.scrollTop=same?top:0;bindPanel(P);}
  tickPanel(P,c,s,p,mine,visible,ls,lords,al);
}
function ownPanel(c,p,ls,lords){const spring=c.kind==='m',alt=isAltar(c);let h=headH(c,COLORS[mySlot]);
  if(!spring){h+=`<div class="tog"><button data-off="0" aria-pressed="${!c.off}"><b>Breed</b><small>minions grow and stand guard</small></button><button class="so" data-off="1" aria-pressed="${!!c.off}"><b>Offer</b><small>${alt?'surplus minions are sacrificed here':'surplus minions walk to the nearest altar'}</small></button></div><p class="hint" data-offh hidden></p>`;
    if(alt)h+=`<button class="sac" data-sac>${gly('wisp')}<span><b data-sacn></b><small data-sacy></small></span></button>`;
    const tm=trainMask(c);h+=secH('Trains')+'<div class="utog">';
    for(let t=0;t<NU;t++){const ok=unitOk(c,t);h+=`<button data-tr="${t}" aria-pressed="${t===0||!!((tm>>t)&1)}"${ok?'':' disabled'}${t?'':' class="fix"'}>${gly(UGL[t])}<b>${escH(UNIT[t].short)}</b><small data-trc="${t}">${ok?'':escH(reqTxt(t))}</small></button>`;}
    h+='</div>'+secH('Promote')+'<div class="upg">'+[1,2].map(t=>`<button class="act" data-pr="${t}"><b>${gly(UGL[t])}${escH(UNIT[t].short)}</b>${costEl('p'+t)}<small data-prt="${t}"></small></button>`).join('')+'</div>';}
  if(c.build)h+=`<div class="sec bl"><span data-bl></span></div><div class="bar-prog"><i data-bp></i></div>`;
  if(c.capital>=0&&(!G.opts||G.opts.wonder)){const n=WONDER_STAGES,mins=Math.round(WONDER_HOLD/60);
    h+=secH('Hellgate','<span class="pips">'+Array.from({length:n},(_,i)=>`<i class="${i<p.ws?'on':i===p.ws&&p.wb>=0?'now':''}"></i>`).join('')+'</span>');
    if(p.ws>=n||p.wb>=0)h+='<p class="hint hg" data-wd></p>'+(p.wb>=0?'<div class="bar-prog hg"><i data-wp></i></div>':'');
    else if(c.lv<3)h+=`<p class="hint">Raise your Throne to level 3 to begin the Hellgate: ${n} stages, then hold the Throne ${mins} minutes to win.</p>`;
    else h+=`<button class="act hg" data-wonder><b>Raise stage ${p.ws+1} of ${n}</b>${costEl('wo')}<small>${Math.round(WONDER_T)} s each. After the last, hold your Throne ${mins} minutes to win. Everyone is warned.</small></button>`;}
  if(!spring&&!c.path&&!c.build&&c.lv>=3){h+=secH('Choose a path',costEl('pa'))+'<div class="paths">';
    for(let q=1;q<PATHS.length;q++)if(PATHS[q]&&!(q===1&&c.capital>=0))h+=`<button class="act pa pa${q}" data-path="${q}"><b>${escH(PATHS[q].name)}</b><small>${escH(PATHS[q].desc)}</small></button>`;
    h+=`</div><p class="hint">Permanent. Takes ${Math.round(PATH_T)} s, and breeding pauses meanwhile.</p>`;}
  if(c.path===3){h+=secH('Lord');const own=ls&&ls.lord;
    lords.forEach((l,i)=>{h+=`<div class="lord">${gly('lord')}<div><b>Lord ${escH(l.nm||'')}</b><small data-lh="${i}"></small><div class="bar-prog hp"><i data-lhp="${i}"></i></div></div></div>`;});
    if(own&&!lords.some(l=>l===own||l.id!=null&&l.id===own.id))h+=`<p class="hint">Lord ${escH(own.nm||'')} of this tower is out in the field.</p>`;
    else if(ls&&!own)h+=`<button class="act lordb" data-lord><b>${gly('lord')}Raise a lord</b>${costEl('lo')}<small data-lw></small></button>`;}
  if(!c.build&&c.lv<maxLv(c))h+=secH(spring?'Deepen the spring':'Raise the castle')+`<button class="act up" data-up><b>${spring?'Spring level '+(c.lv+1):escH(LVNAME[c.lv+1]||'Den')+', level '+(c.lv+1)}</b>${costEl('up')}<small data-ups></small></button>`;
  let tw='';for(const {to} of G.adj[sel]){const t=G.tw.find(t=>t.o===mySlot&&t.from===sel&&t.to===to);
    tw+=t?`<div class="twd">${gly('spire')}<span>${escH(G.names[to])}</span><small>${t.bt>0?'rising':'built'}</small></div>`:`<button class="act tw" data-tw="${to}"><b>${gly('spire')}<span>${escH(G.names[to])}</span></b>${costEl('tw')}</button>`;}
  if(tw)h+=secH('Spires','<span class="sub">burn anyone on that road</span>')+`<div class="tws">${tw}</div>`;
  if(!spring)h+=`<button class="act sm" data-sm><b>Summon ${SUMMON_N} minions</b>${costEl('sm')}<small data-smt></small></button>`;
  if(c.route>=0)h+=`<div class="rt"><span data-rt></span><button data-stop>Stop route</button></div>`;
  if(hasMates())h+=pingsH();
  return h;}
function bindPanel(P){const on=(q,f)=>P.querySelectorAll(q).forEach(b=>b.onclick=pg(()=>f(b)));
  on('.x',()=>{sel=-1;updatePanel();});
  on('[data-off]',b=>issue(4,sel,+b.dataset.off));
  on('[data-sac]',()=>issue(16,sel));
  on('[data-tr]',b=>{const t=+b.dataset.tr;if(!t){toast('Minions always breed. Switch on demons to train them as well.',2000);return;}issue(10,sel,(trainMask(G.castles[sel])^(1<<t))|1);});
  on('[data-pr]',b=>issue(15,sel,+b.dataset.pr));
  on('[data-wonder]',()=>issue(14,0));
  on('[data-path]',b=>issue(12,sel,+b.dataset.path));
  on('[data-lord]',()=>issue(17,sel));
  on('[data-up]',()=>issue(3,sel));
  on('[data-tw]',b=>issue(11,sel,+b.dataset.tw));
  on('[data-sm]',()=>issue(8,sel));
  on('[data-stop]',()=>issue(2,sel,-1));
  on('[data-ping]',b=>sendPing(sel,+b.dataset.ping));}
function tickPanel(P,c,s,p,mine,visible,ls,lords,al){
  const sz=Math.floor(s.size||0),pth=visible?c.path:s.path;
  putT(P.querySelector('[data-n]'),G.names[sel]||'');
  putT(P.querySelector('[data-kd]'),kindName(s)+(s.owner!==NEUTRAL&&!mine?' · '+ownerName(s.owner):''));
  let st;
  if(mine){const cap=capOf(c),gr=growRate(G,c)*G.sp,sr=soulRate(G,c)*G.sp;st=sz+' / '+cap+' troops';
    if(c.kind!=='m')st+=c.build?', breeding paused':sz>=cap?', full':hordeOf(mySlot)>=armyCap(G,mySlot)?', horde at cap':gr>0?', +'+gr.toFixed(1)+'/s breeding':'';
    if(sr>0)st+=', +'+sr.toFixed(1)+' souls/s';}
  else st=(visible?'':'Last seen: ')+sz+' troops'+(s.owner===NEUTRAL&&visible&&c.base?', heals to '+Math.round(c.base):'');
  putT(P.querySelector('[data-st]'),st);
  let ch='';
  if(s.capital>=0)ch+=chip(gly('crown')+'Throne','gold');
  if(pth&&s.owner!==NEUTRAL&&PATHS[pth])ch+=chip(escH(PATHS[pth].name),'ember');
  if(visible&&isAltar(c))ch+=chip(gly('wisp')+'Altar','soul');
  if(c.hill)ch+=chip('Hill, +30% defence');
  if(visible&&isWalled(c))ch+=chip('Walled','warn');
  if(visible){if(c.assault)ch+=chip('Under attack','bad');if(c.br>G.gt)ch+=chip('Walls shattered','bad');if(c.sab>G.gt)ch+=chip('Plagued','bad');}
  if(mine){if(!c.sup&&!(c.capital>=0))ch+=chip('Cut off from the Throne','warn');if(c.off&&c.kind!=='m'&&al[0]<0)ch+=chip('No altar reachable','warn');
    if(c.kind!=='m'&&trainMask(c)>1&&p.souls<1)ch+=chip('No souls: breeding minions only','warn');}
  else{if(lords.length)ch+=chip(gly('lord')+'Lord inside','gold');if(visible&&c.off&&s.owner!==NEUTRAL)ch+=chip('Offering');
    ch+=chip(gly('wisp')+'Loot '+Math.round(8*(s.lv||1)+(c.nw?60:0)),'soul');
    if(s.owner!==NEUTRAL&&s.kind!=='m'&&s.lv>1)ch+=chip('Drops to level '+(s.lv-1)+(pth?' and loses its path':'')+' if taken');}
  putH(P.querySelector('[data-ch]'),ch);
  let cp='';if(s.u)for(let t=0;t<NU;t++){const n=Math.floor(s.u[t]||0);if(n>0)cp+=`<span class="cp">${gly(UGL[t])}<b>${n}</b><small>${escH(UNIT[t].short)}</small></span>`;}
  for(const l of lords)cp+=`<span class="cp lord">${gly('lord')}<b>${escH(l.nm||'Lord')}</b></span>`;
  if(mine&&c.kind!=='m')cp+=`<span class="cp mu">muster ${musterCap(c)}</span>`;
  putH(P.querySelector('[data-cp]'),cp);
  if(!mine){const oh=P.querySelector('[data-oh]');let t='';
    if(visible&&isWalled(c)&&!breached(G,c))t=cardsOf('siege')?'Walled, but your Siegebreakers strike it at full strength.':'Walled: needs Greater demons, Siegebreakers or Shatter. Anyone else does a third of the damage.';
    else if(s.kind==='m')t='Hold a soul spring and it pours out souls, more at higher levels. It is not an altar.';
    else if(s.owner===NEUTRAL)t='Neutrals heal when left alone: strike with one solid block.';
    putT(oh,t);if(oh)oh.hidden=!t;return;}
  const souls=p.souls,cost=(k,v,block)=>P.querySelectorAll('[data-c="'+k+'"]').forEach(e=>{const ok=Number.isFinite(v);putT(e.lastChild,ok?fmtSo(v):'–');e.classList.toggle('no',!ok||souls<v);const b=e.closest('button');if(b)b.disabled=!ok||souls<v||!!block;});
  const oh=P.querySelector('[data-offh]');if(oh){let t='';const keep=Math.max(5,Math.round(capOf(c)*.2));
    if(c.off)t=al[0]===sel?'Surplus above '+keep+' minions is sacrificed right here.':al[0]>=0?'Pilgrims walk to '+G.names[al[0]]+'; '+keep+' minions stay on guard.':'No altar can be reached through your castles, so the minions just wait here.';
    else if(al[0]<0)t='Offer needs a chain of your castles to an altar: your Throne or a Soul Well.';
    putT(oh,t);oh.classList.toggle('warn',al[0]<0);oh.hidden=!t;}
  const sb=P.querySelector('[data-sac]');if(sb){const pv=sacPreview(G,mySlot,c)||{n:0,souls:0};
    putT(sb.querySelector('[data-sacn]'),pv.n>0?'Sacrifice '+pv.n+' minion'+(pv.n===1?'':'s'):'No minions to sacrifice');
    putT(sb.querySelector('[data-sacy]'),pv.n>0?'+'+fmtSo(pv.souls)+' souls now':'Breed or summon more first');sb.disabled=pv.n<1;}
  for(let t=0;t<NU;t++){const e=P.querySelector('[data-trc="'+t+'"]');if(e&&unitOk(c,t))putT(e,t?fmtSo(trainCostOf(c,t))+' souls each':'free, always');}
  for(const t of [1,2]){const e=P.querySelector('[data-prt="'+t+'"]');if(!e)continue;const n=promoCount(G,mySlot,c,t)|0,pc=promoCost(G,mySlot,c,t),req=t===2&&!unitOk(c,2),have=Math.floor(c.u[t-1]||0),fr=t===1?'minions':UNIT[1].short.toLowerCase();
    putT(e,req?reqTxt(2):n>0?n+' '+fr+' × '+fmtSo(pc)+' souls':have>0&&souls<pc?'need '+fmtSo(pc)+' souls each':'no '+fr+' to promote');cost('p'+t,n>0?n*pc:pc,req||n<1);}
  if(c.build){const b=c.build,pr=b.dur>1?b.t/b.dur:b.t;putT(P.querySelector('[data-bl]'),(b.k>=20?'Becoming a '+(PATHS[b.k-20]?PATHS[b.k-20].name:'new path'):'Rising to level '+(c.lv+1))+' · breeding paused');
    const bp=P.querySelector('[data-bp]');if(bp)bp.style.width=Math.round(Math.max(0,Math.min(1,pr))*100)+'%';}
  const wd=P.querySelector('[data-wd]');if(wd){if(p.ws>=WONDER_STAGES)putT(wd,'The Hellgate stands open. Hold your Throne: '+fmtClock((WONDER_HOLD-p.wh)/G.sp)+' left'+(c.assault?' (under attack, losing time)':'')+'.');
    else{putT(wd,'Raising stage '+(p.ws+1)+' of '+WONDER_STAGES+(c.assault?' (paused while under attack)':'')+'.');const wp=P.querySelector('[data-wp]');if(wp)wp.style.width=Math.round(Math.max(0,Math.min(1,p.wb/WONDER_T))*100)+'%';}}
  cost('wo',WONDER_COST);
  if(P.querySelector('[data-path]')){const v=pathCost(G,mySlot);cost('pa',v);P.querySelectorAll('[data-path]').forEach(b=>b.disabled=!(souls>=v));}
  if(ls){cost('lo',ls.price,!ls.can);putT(P.querySelector('[data-lw]'),!ls.can&&typeof ls.why==='string'&&ls.why?ls.why:'One per Dark Tower. He leads your blocks; demons near him fight harder.');}
  lords.forEach((l,i)=>{const mx=l.max||l.hp||1;putT(P.querySelector('[data-lh="'+i+'"]'),'Serves here · '+Math.ceil(l.hp)+' / '+Math.round(mx)+' hp'+(l.rk?' · rank '+l.rk:''));const e=P.querySelector('[data-lhp="'+i+'"]');if(e)e.style.width=Math.round(Math.max(0,Math.min(1,l.hp/mx))*100)+'%';});
  if(P.querySelector('[data-up]')){cost('up',upCost(G,mySlot,c));putT(P.querySelector('[data-ups]'),upSub(c));}
  cost('tw',towerCost(G,mySlot));
  const smt=P.querySelector('[data-smt]');if(smt){const room=Math.floor(capOf(c)-c.size);putT(smt,room<1?'Garrison full':'They arrive at once'+(p.hm>1.02?'. Each summon costs more; the price eases back over time':''));cost('sm',summonPrice(G,mySlot,c),room<1);}
  const rt=P.querySelector('[data-rt]');if(rt){const d=G.castles[c.route],full=d&&isTeam(d.owner)&&d.size>=capOf(d)*.95;putT(rt,!d?'':full?'Route to '+G.names[c.route]+' waits: that castle is full':'Troops stream to '+G.names[c.route]);}
}
// keeps the toast clear of the tutorial card and the Hellgate banner
function stageVars(){const st=$('#stage'),t=$('#tut'),w=$('#wbanner');if(!st)return;const a=(t&&!t.hidden?t.offsetHeight+8:0)+'px',b=(w&&!w.hidden?w.offsetHeight+6:0)+'px';
  if(st.style.getPropertyValue('--tut-h')!==a)st.style.setProperty('--tut-h',a);if(st.style.getPropertyValue('--wb-h')!==b)st.style.setProperty('--wb-h',b);}
setInterval(()=>{if(G&&$('#s-game').classList.contains('on')){updatePanel();updateBar();stageVars();}},250);
