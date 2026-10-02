// ---------- names & labels ----------
const NAMES=['Ashford','Bramble','Cairnwick','Dunmore','Eastwatch','Fallow','Greyholt','Harrow','Ironmere','Juniper','Kestrel','Larkspur','Mirefield','Northgate','Oakhollow','Pellam','Quarry','Redcliff','Stonebridge','Thornby','Umber','Valewood','Westmarch','Yarrow','Zennor','Brightwater','Coldhaven','Dawnrest','Emberfell','Foxmoor','Gildwood','Highcrag','Lowmere','Rookhill'];
function castleNames(n,seed){const R=mkRng(seed);const a=[...NAMES];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);}
const LVNAME=['','Outpost','Keep','Citadel','Stronghold','Royal seat'];
function kindName(c){if(c.kind==='m')return'Mine';if(c.capital>=0)return'Capital';if(c.owner===NEUTRAL)return c.kind==='f'?'Fortress':'Village';return LVNAME[c.lv];}
function ownerName(o){if(o===NEUTRAL||o==null)return'Neutral';const s=G.slots[o];return s?slotLabel(s,o):'Someone';}
const myTeam=()=>mySlot>=0?teamOf(G,mySlot):null;
const allSeeing=()=>!G||mySlot<0||G.pl[mySlot].out||G.over||(G.opts&&!G.opts.fog);
const isTeam=o=>o!==NEUTRAL&&mySlot>=0&&teamOf(G,o)===myTeam();
function hasMates(){if(mySlot<0)return false;const t=G.slots[mySlot].t;return !!t&&G.slots.some((s,i)=>i!==mySlot&&(s.k==='h'||s.k==='b')&&s.t===t);}

// ---------- commands ----------
function runCmd(slot,m){const t=m[1],a=m[2],b=m[3],c=m[4];if(!Number.isInteger(a))return;
  if(t===1)squad(G,slot,a,b);else if(t===2)setRoute(G,slot,a,b);else if(t===3)upgrade(G,slot,a,b);
  else if(t===4)setTax(G,slot,a,b);else if(t===5)research(G,slot,a);else if(t===6)useAbility(G,slot,a,b,c);else if(t===7)demolish(G,slot,a,b);else if(t===8)hire(G,slot,a);else if(t===9)setMix(G,slot,a);else if(t===10)setTrain(G,slot,a,b);else if(t===12)choosePath(G,slot,a,b);else if(t===14)buildWonder(G,slot);else if(t===15)startMastery(G,slot,a);else if(t===16)rushResearch(G,slot,a);else if(t===17)finishResearch(G,slot);else if(t===19)finishMastery(G,slot);else if(t===11)buildTower(G,slot,a,b);}
function issue(type,a,b=0,c=0){
  if(!G||G.over||mySlot<0||G.pl[mySlot].out)return;
  if(NET.mode==='client'){NET.seq++;NET.cmds.push([NET.seq,type,a,b|0,c|0]);if(NET.cmds.length>12)NET.cmds.shift();
    NET.nr&&NET.nr.presence({c:NET.cmds}).catch(()=>{});
    const k=G.castles[a];if(type===2&&k)k.route=(k.route===b||b<0)?-1:b;if(type===4&&k)k.tax=b;
  }else runCmd(mySlot,[0,type,a,b,c]);
  if(type===9&&G)G.pl[mySlot].mix=a;
  setTimeout(()=>{panelKey='';updatePanel();},60);
}
let pouring=null;
function pourStart(from,to){pouring={from,to};if(NET.mode==='client'){const k=from+'_'+to;if(k!==lastPourSent){lastPourSent=k;NET.nr&&NET.nr.presence({p:[from,to]}).catch(()=>{});}}else if(G)setPour(G,mySlot,from,to);}
function pourStop(){if(!pouring&&!lastPourSent)return;pouring=null;if(NET.mode==='client'){lastPourSent='';NET.nr&&NET.nr.presence({p:null}).catch(()=>{});}else if(G&&mySlot>=0)setPour(G,mySlot,-1,-1);}

// ---------- pings ----------
const lastPing={};
function resetMix(){myMix=7;renderMix();}
function sendPing(ci,type){if(mySlot<0)return;pings.push({c:ci,type,s:mySlot,t:performance.now()});
  if(NET.nr)NET.nr.presence({pg:[ci,type,Math.floor(Date.now()%1e9)]}).catch(()=>{});toast(type?'You asked for help at '+G.names[ci]+'.':'You marked '+G.names[ci]+' as a target.',2200);}
function readPings(peers,slots){if(!G||mySlot<0)return;
  for(const p of peers){if(p.sameTab||!p.presence)continue;const pg=p.presence.pg;if(!Array.isArray(pg))continue;
    const key=p.peer+':'+pg[2];if(lastPing[p.peer]===key)continue;lastPing[p.peer]=key;
    const s=p.presence.r==='h'?0:slots.findIndex(x=>x.k==='h'&&x.p===p.peer);if(s<0||!isTeam(s)||!G.castles[pg[0]])continue;
    pings.push({c:pg[0]|0,type:pg[1]?1:0,s,t:performance.now()});toast(ownerName(s)+(pg[1]?' needs help at ':' says attack ')+G.names[pg[0]]+'.',3000);}}

// ---------- abilities & research ----------
document.querySelectorAll('.ab[data-ab]').forEach(b=>b.onclick=()=>{
  if(!G||G.over||mySlot<0||G.pl[mySlot].out)return;const k=+b.dataset.ab,p=G.pl[mySlot];
  if(!has(G,mySlot,SPELL_RES[k])){toast('Research '+RES[SPELL_RES[k]].name+' (Arcane) to unlock '+AB[k].name+'.',2400);return;}
  if(p.cd[k]>G.gt){toast(AB[k].name+' is recharging.',1500);return;}
  if(p.gold<abilityCost(G,mySlot,k)){toast('Not enough gold for '+AB[k].name+'.',1500);return;}
  armedAb=armedAb===k?-1:k;updateBar();
  if(armedAb===0)toast('Tap where the fire should fall. It lands after a short warning.',2600);else if(armedAb===1)toast('Tap an enemy or neutral castle to breach its walls.',2600);else if(armedAb===2)toast('Tap anywhere on the map to scout it.',2500);
});
let myMix=7;
function renderMix(){document.querySelectorAll('#mix [data-u]').forEach(b=>b.setAttribute('aria-pressed',String(!!((myMix>>+b.dataset.u)&1))));}
document.querySelectorAll('#mix [data-u]').forEach(b=>b.onclick=()=>{const u=+b.dataset.u;let m=myMix^(1<<u);if(!m)m=1<<u;myMix=m;renderMix();issue(9,m);});
$('#b-units').onclick=()=>overlay(`<h3>Unit types</h3><div class="ut">
<p><b>Militia.</b> Free and trained everywhere. Cheap bodies, weak in a fight.</p>
<p><b>Spearmen</b> (Barracks, 2 gold each). Much sturdier and harder hitting. They brace against knights and deal double damage to them.</p>
<p><b>Knights</b> (Stables, 5 gold each). Fast, armoured, with a crushing first charge and 50% extra damage against militia. They ride around spear lines to reach softer targets, but lose badly to braced spearmen.</p>
<p>Your army cap counts soldiers, not strength, so better troops are how you grow stronger once you hit the cap.</p>
<p>The Send chips choose which types leave a castle when you muster or tap a road. Routes always carry every type.</p></div><button class="btn primary" data-a="ok">Got it</button>`,{ok:closeOv});
let resOpen=false;
$('#b-res').onclick=()=>{if(!G||mySlot<0)return;resOpen=true;renderResearch();};
let INSTANT=false;
function renderResearch(){
  if(!resOpen||!G)return;const p=G.pl[mySlot];
  let h='<h3>Research</h3><p class="sub" data-rs></p>';
  h+=`<div class="rinst"><label><input type="checkbox" data-inst ${INSTANT?'checked':''}> Instant: finish on tap for double the price</label>`;
  if(p.cur>=0)h+=`<button class="btn" data-fin ${p.gold>=finishCost(G,mySlot)?'':'disabled'}>Finish ${RES[p.cur].name} now · ${finishCost(G,mySlot)} gold</button>`;
  if(p.mcur>=0)h+=`<button class="btn" data-mfin ${p.gold>=finishMasteryCost(G,mySlot)?'':'disabled'}>Finish ${MASTERY[p.mcur].name} mastery now · ${finishMasteryCost(G,mySlot)} gold</button>`;
  h+='</div><div class="rs">';
  for(let b=0;b<BRANCH.length;b++){h+=`<div class="rb"><h4>${BRANCH[b]}${b===3?' (unit upgrades)':b===4?' (spells)':''}</h4><div class="rrow">`;
    RES.forEach((r,id)=>{if(r.b!==b)return;const done=has(G,mySlot,id),cur=p.cur===id,full=(b<3&&r.t<2)||(b===4&&r.t===0)||r.t===3;
      const ok=INSTANT?(p.cur<0&&resAvail(G,mySlot,id)&&p.gold>=rushCost(G,mySlot,id)):canResearch(G,mySlot,id);const prog=cur?Math.min(100,p.curT/resTime(id)*100):0;const locked=!done&&!resAvail(G,mySlot,id);
      h+=`<button class="rbtn${done?' done':''}${full?' full':''}" data-r="${id}" ${ok?'':'disabled'}><b>${r.name}</b><small>${r.desc}${done?'':cur?'. Researching…':locked?'. Needs '+(r.any?r.any.map(q=>RES[q].name).join(' or '):r.req!==undefined&&!has(G,mySlot,r.req)?RES[r.req].name:'the other choice untaken'):INSTANT?'. Instant: '+rushCost(G,mySlot,id)+' gold':'. '+resCost(id)+' gold, '+Math.round(resTime(id))+'s'}</small>${cur?`<i style="width:${prog}%"></i>`:''}</button>`;});
    h+='</div></div>';}
  if(masteryOpen(G,mySlot)){h+='<div class="rb"><h4>Mastery (endless, studied alongside research)</h4><div class="rrow">';
    MASTERY.forEach((m,t)=>{const lv=p.ml[t],cur=p.mcur===t,cost=masteryCost(G,mySlot,t);const prog=cur?Math.min(100,p.mt/(30*(1+0.1*lv))*100):0;
      h+=`<button class="rbtn" data-ms="${t}" ${p.mcur<0&&p.gold>=cost?'':'disabled'}><b>${m.name} ${lv?'· level '+lv:''}</b><small>${m.desc}. ${cur?'Studying…':cost+' gold'}</small>${cur?`<i style="width:${prog}%"></i>`:''}</button>`;});h+='</div></div>';}
  else h+='<div class="rb"><h4>Mastery</h4><p class="sub" style="margin:0">Finish any capstone to unlock endless Mastery: more damage, gold, army cap or castle defense, level after level.</p></div>';
  h+='</div><button class="btn" data-a="close">Close</button>';
  overlay(h,{close:()=>{resOpen=false;closeOv();}});
  $('#ov-card [data-rs]').textContent=p.cur>=0?'Researching '+RES[p.cur].name+'. One project at a time.':'Pick one project. The last tier of each branch is a choice of two.';
  document.querySelectorAll('#ov-card [data-r]').forEach(b=>b.onclick=()=>{issue(INSTANT?16:5,+b.dataset.r);setTimeout(renderResearch,80);});
  {const ic=document.querySelector('#ov-card [data-inst]');if(ic)ic.onchange=()=>{INSTANT=ic.checked;renderResearch();};
   const fb=document.querySelector('#ov-card [data-fin]');if(fb)fb.onclick=()=>{issue(17,0);setTimeout(renderResearch,80);};
   const mb=document.querySelector('#ov-card [data-mfin]');if(mb)mb.onclick=()=>{issue(19,0);setTimeout(renderResearch,80);};}
  document.querySelectorAll('#ov-card [data-ms]').forEach(b=>b.onclick=()=>{issue(15,+b.dataset.ms);setTimeout(renderResearch,80);});
}
setInterval(()=>{if(resOpen&&!$('#ov').hidden)renderResearch();else resOpen=false;},700);
function updateBar(){
  if(!G||mySlot<0)return;const p=G.pl[mySlot];
  document.querySelectorAll('.ab[data-ab]').forEach(b=>{const k=+b.dataset.ab,cost=abilityCost(G,mySlot,k),left=Math.max(0,p.cd[k]-G.gt);
    const locked=!has(G,mySlot,SPELL_RES[k]);b.querySelector('small').textContent=locked?'Locked':left>0?Math.ceil(left/G.sp)+'s':cost+' gold';
    b.querySelector('.cdv').style.width=left>0?(100-left/abilityCd(G,mySlot,k)*100)+'%':'0';
    b.classList.toggle('dim',locked||left>0||p.gold<cost||p.out);b.classList.toggle('arm',armedAb===k);});
  const rp=$('#res-prog'),rs=$('#res-sub');
  if(p.cur>=0){rs.textContent=RES[p.cur].name;rp.style.width=Math.min(100,p.curT/resTime(p.cur)*100)+'%';}else{rs.textContent='Idle';rp.style.width='0';}
}

// ---------- castle panel ----------
let panelKey='',panelSel=-1,panelAt=0;const pg=f=>e=>{if(performance.now()-panelAt<450)return;f(e);};
function fmtClock(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function chip(t,cls){return`<span class="chip ${cls||''}">${t}</span>`;}
function updatePanel(){
  const P=$('#panel');
  if(!G||sel<0||G.over||!G.castles[sel]){if(!P.hidden){P.hidden=true;panelKey='';panelSel=-1;}sel=-1;return;}
  const c=G.castles[sel],mine=mySlot>=0&&c.owner===mySlot&&!G.pl[mySlot].out;
  const visible=mine||isVisibleC(sel);const s=visible?c:seen[sel];
  if(!s){P.hidden=true;sel=-1;return;}
  const key=[sel,mine,visible,c.owner,c.lv,c.b.join(''),c.route,!!c.build,c.tax,c.tr,c.path,mySlot>=0?G.pl[mySlot].ws+':'+(G.pl[mySlot].wb>=0):'',G.tw.filter(t=>t.from===sel).map(t=>t.o+':'+(t.bt>0)).join('')].join(',');
  const sz=Math.floor(s.size);
  if(key!==panelKey){if(P.hidden||panelSel!==sel)panelAt=performance.now();panelSel=sel;panelKey=key;P.hidden=false;
    let h=`<div class="ph"><span class="hex" style="--c:${s.owner===NEUTRAL?TH.neutral:COLORS[s.owner]}"></span><div class="t"><b data-n></b><small data-st></small></div><button class="x" aria-label="Close">×</button></div><div class="chips" data-ch></div>`;
    if(mine){
      if(c.kind!=='m')h+=`<div class="tog"><button data-tax="0" aria-pressed="${!c.tax}">Recruit<small>troops grow</small></button><button data-tax="1" aria-pressed="${!!c.tax}">Tax<small>9× gold, slow growth</small></button></div>`;
      if(c.kind!=='m'){h+=`<div class="sec">Trains</div><div class="utog">`;for(let t=0;t<NU;t++){const ok=unitOk(c,t);h+=`<button data-tr="${t}" aria-pressed="${!!((trainMask(c)>>t)&1)}" ${ok?'':'disabled'}>${UNIT[t].short}<small>${ok?(t===0?'free':UNIT[t].gold+' gold each'):'needs '+BLD[UNIT[t].need].name}</small></button>`;}h+='</div>';}
      if(c.build)h+=`<div class="sec" data-bl></div><div class="bar-prog"><i data-bp style="width:0"></i></div>`;
      if(c.capital>=0&&(!G.opts||G.opts.wonder)){const p=G.pl[mySlot];h+=`<div class="sec">Wonder</div>`;
        if(p.ws>=WONDER_STAGES)h+=`<div class="done" data-wd></div>`;
        else if(p.wb>=0)h+=`<div class="done" data-wd></div><div class="bar-prog"><i data-wp style="width:0"></i></div>`;
        else if(c.lv<3)h+=`<div class="done">Raise your capital to level 3 to start a Wonder: five stages, then hold your capital for ${WONDER_HOLD/60} minutes to win.</div>`;
        else h+=`<div class="upg"><button data-wonder class="full"><b>Wonder stage ${p.ws+1} of ${WONDER_STAGES}</b><small>${WONDER_COST} gold, ${WONDER_T}s. Finish all five, then hold your capital for ${WONDER_HOLD/60} minutes to win. Everyone is warned.</small></button></div>`;}
      if(c.kind!=='m'&&!c.path&&!c.build){if(c.lv>=3){h+=`<div class="sec">Choose a path (${PATH_COST} gold, permanent)</div><div class="upg">`;for(let q=1;q<=3;q++)if(!(q===1&&c.capital>=0))h+=`<button data-path="${q}"><b>${PATHS[q].name}</b><small>${PATHS[q].desc}</small></button>`;h+='</div>';}
        else h+=`<div class="sec">Castle paths unlock at level 3</div>`;}
      if(c.kind==='m'&&!c.build&&c.lv<maxLv(c))h+=`<div class="sec">Upgrade mine</div><div class="upg"><button data-k="0"><b>Mine level ${c.lv+1}</b><small>${upCost(G,mySlot,c,0)} gold. ${(1.2*(1+0.6*c.lv)).toFixed(1)} gold a second</small></button></div>`;
      if(c.kind!=='m'){const sl=slotsOf(c);
        h+=`<div class="sec">Buildings ${c.b.length} of ${sl} slot${sl>1?'s':''}</div><div class="chips">`;
        for(const b of c.b)h+=`<span class="chip good">${BLD[b].name} <button class="dem" data-dem="${b}" aria-label="Demolish ${BLD[b].name}">×</button></span>`;
        if(!c.b.length)h+='<span class="chip">None yet</span>';h+='</div>';
        if(!c.build){let up='';const btn=(k,t,sub)=>`<button data-k="${k}"><b>${t}</b><small>${sub}</small></button>`;
          if(c.lv<maxLv(c))up+=btn(0,'Level '+(c.lv+1),upCost(G,mySlot,c,0)+' gold. Cap '+LV[c.lv+1].cap+(slotsOf({kind:c.kind,lv:c.lv+1})>slotsOf(c)?', +1 slot':'')+(c.capital>=0?', army cap +60':''));
          if(c.b.length<sl)for(let i=0;i<BLD.length;i++)if(!hasB(c,i))up+=btn(i+1,BLD[i].name,upCost(G,mySlot,c,i+1)+' gold. '+BLD[i].desc);
          if(up)h+=`<div class="upg">${up}</div>`;}}
      {let tw='';for(const {to,e} of G.adj[sel]){const t=G.tw.find(t=>t.o===mySlot&&t.from===sel&&t.to===to);
        tw+=t?`<span class="chip good">Tower to ${G.names[to]}${t.bt>0?' (building)':''}</span>`:`<button class="twb" data-tw="${to}">Tower to ${G.names[to]}<small>${towerCost(G,mySlot)} gold</small></button>`;}
        h+=`<div class="sec">Road towers</div><div class="chips">${tw}</div>`;}
      if(c.kind!=='m')h+=`<div class="rt"><span data-hire-t></span><button data-hire>Hire 10</button></div>`;
      if(c.route>=0)h+=`<div class="rt"><span data-rt></span><button data-stop>Stop route</button></div>`;
    }else if(s.b&&s.b.length){h+='<div class="sec">Buildings</div><div class="chips">'+s.b.map(b=>chip(BLD[b].name)).join('')+'</div>';}
    if(hasMates())h+=`<div class="pings"><button data-ping="0">Attack here</button><button data-ping="1">Defend here</button></div>`;
    P.innerHTML=h;
    P.querySelector('.x').onclick=pg(()=>{sel=-1;updatePanel();});
    P.querySelectorAll('[data-tax]').forEach(b=>b.onclick=pg(()=>issue(4,sel,+b.dataset.tax)));
    P.querySelectorAll('[data-tr]').forEach(b=>b.onclick=pg(()=>{const c2=G.castles[sel];let m=trainMask(c2)^(1<<+b.dataset.tr);if(!m)m=1;issue(10,sel,m);if(NET.mode==='client')c2.tr=m;panelKey='';}));
    P.querySelectorAll('[data-k]').forEach(b=>b.onclick=pg(()=>issue(3,sel,+b.dataset.k)));
    P.querySelectorAll('[data-dem]').forEach(b=>b.onclick=pg(()=>issue(7,sel,+b.dataset.dem)));
    const st=P.querySelector('[data-stop]');if(st)st.onclick=pg(()=>issue(2,sel,-1));
    P.querySelectorAll('[data-path]').forEach(b=>b.onclick=pg(()=>{issue(12,sel,+b.dataset.path);panelKey='';}));
    const wbtn=P.querySelector('[data-wonder]');if(wbtn)wbtn.onclick=pg(()=>{issue(14,0);panelKey='';});
    const hb=P.querySelector('[data-hire]');if(hb)hb.onclick=pg(()=>issue(8,sel));
    P.querySelectorAll('[data-tw]').forEach(b=>b.onclick=pg(()=>{issue(11,sel,+b.dataset.tw);panelKey='';}));
    P.querySelectorAll('[data-ping]').forEach(b=>b.onclick=pg(()=>sendPing(sel,+b.dataset.ping)));
  }
  P.querySelector('[data-n]').textContent=G.names[sel]+', '+kindName(s)+(s.owner!==NEUTRAL&&!mine?' ('+ownerName(s.owner)+')':'');
  let line;
  if(mine){line=`${sz} / ${capOf(c)} troops`+(c.kind==='m'?'':`, +${(growRate(G,c)*G.sp).toFixed(1)} a second`)+`, +${(goldRate(G,c)*G.sp).toFixed(1)} gold`;}
  else line=(visible?'':'Last seen: ')+sz+' troops'+(s.owner===NEUTRAL&&c.base&&visible?', heals to '+Math.round(c.base):'');
  const uu=(visible?c:s).u;if(uu&&(mine||visible)){const parts=[];for(let t=0;t<NU;t++){const n=Math.floor(uu[t]||0);if(n>0)parts.push(n+' '+UNIT[t].name.toLowerCase());}if(parts.length)line+='. '+parts.join(', ');}
  if(mine&&c.kind!=='m')line+='. Muster limit '+musterCap(c);
  P.querySelector('[data-st]').textContent=line;
  let ch='';
  if(s.capital>=0)ch+=chip('Capital','good');if(c.path&&c.owner!==NEUTRAL)ch+=chip(PATHS[c.path].name+': '+PATHS[c.path].desc,'good');if(c.hill)ch+=chip('Hill, +30% defense');
  if(s.owner===NEUTRAL&&c.nw)ch+=chip(mySlot>=0&&has(G,mySlot,1)?'Walled fortress':'Walled: needs Siegecraft or a Workshop','warn');if(s.owner===NEUTRAL&&c.kind==='f'&&visible)ch+=chip('Loot: '+(8*c.lv+(c.nw?60:0))+' gold','good');
  if(visible){if(c.assault)ch+=chip('Under attack','bad');if(c.br>G.gt)ch+=chip('Walls breached','bad');
    if(c.sab>G.gt)ch+=chip('Sabotaged','bad');if(mine&&!c.sup&&c.capital<0)ch+=chip('Cut off from capital','warn');if(c.tax&&!mine)ch+=chip('Taxed');}
  if(!mine&&s.owner!==NEUTRAL&&s.kind!=='m'&&s.lv>1)ch+=chip('Drops to level '+(s.lv-1)+' if taken');
  if(mine&&c.kind!=='m'&&trainMask(c)>1&&G.pl[mySlot].gold<2)ch+=chip('No gold: training spearmen only','warn');
  P.querySelector('[data-ch]').innerHTML=ch;
  P.querySelectorAll('[data-k]').forEach(b=>{b.disabled=upCost(G,mySlot,c,+b.dataset.k)>G.pl[mySlot].gold;});
  P.querySelectorAll('[data-tw]').forEach(b=>{b.disabled=towerCost(G,mySlot)>G.pl[mySlot].gold;});
  P.querySelectorAll('[data-path]').forEach(b=>{b.disabled=PATH_COST>G.pl[mySlot].gold;});
  {const wbtn=P.querySelector('[data-wonder]');if(wbtn)wbtn.disabled=WONDER_COST>G.pl[mySlot].gold;const wd=P.querySelector('[data-wd]');if(wd&&mySlot>=0){const p=G.pl[mySlot];
    if(p.ws>=WONDER_STAGES)wd.textContent='Wonder complete. Hold your capital: '+fmtClock((WONDER_HOLD-p.wh)/G.sp)+' left'+(c.assault?' (under attack, losing time)':'')+'.';
    else{wd.textContent='Building Wonder stage '+(p.ws+1)+' of '+WONDER_STAGES+(c.assault?' (paused, under attack)':'')+'.';const wp=P.querySelector('[data-wp]');if(wp)wp.style.width=Math.round(Math.min(1,p.wb/WONDER_T)*100)+'%';}}}
  if(mine&&c.build){const pr=c.build.dur>1?c.build.t/c.build.dur:c.build.t;const bl=P.querySelector('[data-bl]');
    if(bl)bl.textContent=(c.build.k>=20?'Becoming a '+PATHS[c.build.k-20].name:'Building '+(c.build.k===0?'level '+(c.lv+1):BLD[c.build.k-1].name))+'. No growth until it’s done.';
    const bp=P.querySelector('[data-bp]');if(bp)bp.style.width=Math.round(Math.min(1,pr)*100)+'%';}
  const rt=P.querySelector('[data-rt]');if(rt){const d=G.castles[c.route];const full=d&&d.owner!==NEUTRAL&&isTeam(d.owner)&&d.size>=capOf(d)*0.95;rt.textContent=full?'Route to '+G.names[c.route]+' is waiting: that castle is full':'Troops stream to '+G.names[c.route];}
  if(mine&&hasB(c,2)){const tr=(G.trade||[]).find(t=>t.a===sel||t.b===sel);const tl=tr?'Trade route to '+G.names[tr.a===sel?tr.b:tr.a]+': +'+(tr.gold*G.sp).toFixed(2)+' gold a second':'No trade route. Link another Market through your castles.';P.querySelector('[data-st]').textContent+='. '+tl;}
  const ht=P.querySelector('[data-hire-t]');if(ht&&mine){const pr=hirePrice(G,mySlot,c),room=Math.floor(capOf(c)-c.size);ht.textContent=(room<1?'Garrison full':'Hire '+Math.min(10,room)+' '+(hasB(c,7)?'spearmen':'militia')+' for '+pr+' gold')+(G.pl[mySlot].hm>1.02?' (price rises with each hire, eases over time)':'');const hb=P.querySelector('[data-hire]');if(hb)hb.disabled=room<1||G.pl[mySlot].gold<pr;}
}
setInterval(()=>{if(G&&$('#s-game').classList.contains('on')){updatePanel();updateBar();}},250);

// ---------- camera ----------
const cv=$('#cv'),ctx=cv.getContext('2d');let VS={s:1,ox:0,oy:0,dpr:1,w:0,h:0},TH={};
const CAM={x:500,y:800,z:1,tx:500,ty:800,tz:1};
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
function stepCam(dt){const k=1-Math.exp(-dt*10);CAM.z+=(CAM.tz-CAM.z)*k;CAM.x+=(CAM.tx-CAM.x)*k;CAM.y+=(CAM.ty-CAM.y)*k;const t={x:CAM.x,y:CAM.y,z:CAM.z};clampCam(t);CAM.x=t.x;CAM.y=t.y;applyCam();}

// ---------- theme ----------
function readTheme(){const cs=getComputedStyle(document.documentElement);
  for(const k of['ink','neutral','bg','fog','gold'])TH[k]=cs.getPropertyValue('--'+k).trim();fogData=null;}
function hexRgb(h){h=(h||'#888888').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
const colOf=o=>o===NEUTRAL?'#7d8577':COLORS[o];
readTheme();try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readTheme);}catch(e){}

// ---------- fog of war ----------
const CELL=40;let FW=0,FH=0,explored=null,vis=null,fogCv=null,fogCtx=null,fogImg=null,fogNoise=null,visT=0;
function initFog(){FW=Math.ceil(G.W/CELL);FH=Math.ceil(G.H/CELL);explored=new Uint8Array(FW*FH);vis=new Uint8Array(FW*FH);
  fogCv=document.createElement('canvas');fogCv.width=FW;fogCv.height=FH;fogCtx=fogCv.getContext('2d');fogImg=fogCtx.createImageData(FW,FH);
  const R=mkRng(G.terrainSeed^77);fogNoise=new Float32Array(FW*FH);const cw=Math.ceil(FW/4)+2,ch=Math.ceil(FH/4)+2,coarse=[];for(let i=0;i<cw*ch;i++)coarse.push(R());
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const gx=x/4,gy=y/4,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,sm=t=>t*t*(3-2*t);
    const v=(a,b)=>coarse[b*cw+a];const top=v(x0,y0)+(v(x0+1,y0)-v(x0,y0))*sm(fx),bot=v(x0,y0+1)+(v(x0+1,y0+1)-v(x0,y0+1))*sm(fx);fogNoise[y*FW+x]=(top+(bot-top)*sm(fy))*.75+R()*.25;}fogData=true;}
function cellAt(x,y){const cx=Math.max(0,Math.min(FW-1,Math.floor(x/CELL))),cy=Math.max(0,Math.min(FH-1,Math.floor(y/CELL)));return cy*FW+cx;}
function isVisibleC(i){if(allSeeing())return true;const c=G.castles[i];if(isTeam(c.owner))return true;return !!vis&&vis[cellAt(c.x,c.y)]===1;}
function solVisible(o,x,y){if(allSeeing()||isTeam(o))return true;return !!vis&&vis[cellAt(x,y)]===1;}
const remoteView=()=>NET.mode==='client'||NET.mode==='replay';
function solList(){return remoteView()?(G.csol||[]):G.sol;}
function updateVision(){
  if(!fogData||!explored)initFog();vis.fill(0);
  if(allSeeing()){vis.fill(1);explored.fill(1);}
  else{const S=[];const nv=(1-0.4*nightLevel(G.time))*(mySlot>=0&&has(G,mySlot,18)?1.25:1);
    G.castles.forEach(c=>{
      if(!isTeam(c.owner))return;let r=c.capital>=0?300:210+Math.min(c.lv,3)*15;if(hasB(c,3))r=460;S.push({x:c.x,y:c.y,r:r*nv});});
    let k=0;for(const so of solList())if(isTeam(so.o)&&(k++%3===0))S.push({x:so.x,y:so.y,r:100*nv});
    for(const o of G.scouts)if(isTeam(o.s))S.push({x:o.x,y:o.y,r:330});
    for(const t of G.tw)if(isTeam(t.o))S.push({x:t.x,y:t.y,r:130*nv});
    for(const s of S){const x0=Math.max(0,Math.floor((s.x-s.r)/CELL)),x1=Math.min(FW-1,Math.floor((s.x+s.r)/CELL)),y0=Math.max(0,Math.floor((s.y-s.r)/CELL)),y1=Math.min(FH-1,Math.floor((s.y+s.r)/CELL));
      for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const px=(cx+.5)*CELL-s.x,py=(cy+.5)*CELL-s.y;if(px*px+py*py<=s.r*s.r){vis[cy*FW+cx]=1;explored[cy*FW+cx]=1;}}}}
  G.castles.forEach((c,i)=>{if(isVisibleC(i))seen[i]={owner:c.owner,size:c.size,lv:c.lv,b:[...c.b],kind:c.kind,capital:c.capital,u:[...c.u]};});
  const [fr,fg,fb]=hexRgb(TH.fog);const d=fogImg.data;
  for(let i=0;i<FW*FH;i++){const n=(fogNoise[i]-.5)*46;d[i*4]=fr+n;d[i*4+1]=fg+n;d[i*4+2]=fb+n;d[i*4+3]=vis[i]?0:explored[i]?115:236+fogNoise[i]*19;}
  fogCtx.putImageData(fogImg,0,0);
}

// ---------- effects & weather ----------
function fxRing(x,y,col,big){fx.push({k:'ring',x,y,col,t:performance.now(),big});}
function fxBurst(x,y,col,n,spd,life=600){const t=performance.now();for(let i=0;i<n;i++){const a=Math.random()*6.283,v=spd*(0.4+Math.random()*0.8);fx.push({k:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,col,t,r:1.5+Math.random()*2.5,life});}}
function fxText(x,y,txt,col){fx.push({k:'txt',x,y,txt,col,t:performance.now(),life:1400});}
function consumeEvents(){
  if(!remoteView()&&G.events.length){for(const e of G.events){
    if(e.t==='die'){if(solVisible(e.o,e.x,e.y)&&fx.length<420)fx.push({k:'corpse',x:e.x,y:e.y,col:colOf(e.o),u:e.u|0,t:performance.now(),life:3500,r:Math.random()*6.28});}
    else if(e.t==='fire'){const t0=performance.now();fxBurst(e.x,e.y-4,'#ff8a2a',26,70,900);fxBurst(e.x,e.y-4,'#ffd35a',14,45,700);fx.push({k:'scorch',x:e.x,y:e.y,t:t0,life:9000});fxRing(e.x,e.y,'#ff8a2a',true);}
    else if(e.t==='wonder'&&e.stage===0){toast(e.s===mySlot?'You began a Wonder. Rivals have been warned.':ownerName(e.s)+' began building a Wonder!',3500);}
    else if(e.t==='wdone'){toast(e.s===mySlot?'Your Wonder is complete! Hold your capital for '+WONDER_HOLD/60+' minutes.':ownerName(e.s)+' completed a Wonder! Attack their capital before time runs out.',4500);}
    else if(e.t==='breach'){const c=G.castles[e.c];if(isVisibleC(e.c)){fxBurst(c.x,c.y-6,'#9a958a',22,60,1100);fxBurst(c.x,c.y-6,'#d8cfbf',12,40,1400);}}
    else if(e.t==='mastery'&&e.s===mySlot){toast(MASTERY[e.k].name+' mastery reached level '+e.lv+'.',2200);}
    else if(e.t==='rank'){if(solVisible(e.o,e.x,e.y))fxText(e.x,e.y-14,'★'.repeat(e.rk),'#b8860b');}
    else if(e.t==='tdie'){if(solVisible(e.o,e.x,e.y)){fxBurst(e.x,e.y-8,'#9a958a',14,50,900);fxBurst(e.x,e.y-8,'#d8cfbf',8,30,1200);}}
    else if(e.t==='shot'){if(fx.length<420&&(allSeeing()||vis&&vis[cellAt(e.x,e.y)]))fx.push({k:'arrow',x:e.x,y:e.y-8,tx:e.tx,ty:e.ty-4,t:performance.now(),life:300});}
    else if(e.t==='hire'){const c=G.castles[e.c];if(isVisibleC(e.c))fxRing(c.x,c.y,'#e8b53a',false);}
    else if(e.t==='cap'&&e.by===mySlot){const c=G.castles[e.c];if(e.loot)fxText(c.x,c.y-30,'+'+e.loot+' gold','#8a6508');if(e.drop)setTimeout(()=>toast(G.names[e.c]+' was damaged in the fighting and dropped a level.',2600),300);}
    else if(e.t==='elim'){toast(ownerName(e.s)+(e.by!=null&&e.by!==NEUTRAL?' was eliminated by '+ownerName(e.by)+'.':' was eliminated.'),3500);}
    else if(e.t==='res'&&e.s===mySlot)toast('Research done: '+RES[e.id].name+'.',2500);}G.events.length=0;}
  if(remoteView())for(const f of G.fires){if(!f.fx&&G.gt>=f.at){f.fx=1;G.events.push({t:'fire',x:f.x,y:f.y});}}
  if(remoteView()&&G.events.length){for(const e of G.events)if(e.t==='fire'){const t0=performance.now();fxBurst(e.x,e.y-4,'#ff8a2a',26,70,900);fx.push({k:'scorch',x:e.x,y:e.y,t:t0,life:9000});fxRing(e.x,e.y,'#ff8a2a',true);}G.events.length=0;}
  G.castles.forEach((c,i)=>{
    if(prevOwner[i]!==c.owner){if(prevOwner[i]!==undefined&&isVisibleC(i)){fxRing(c.x,c.y,colOf(c.owner),true);fxBurst(c.x,c.y-8,colOf(c.owner),12,70,800);fxBurst(c.x,c.y-4,'#8f877a',18,45,1100);for(let q=0;q<6;q++)fx.push({k:'smoke2',x:c.x+(Math.random()-.5)*30,y:c.y-6,t:performance.now()+q*120,life:2600,s:1.6});}
      if(c.owner!==NEUTRAL&&stats)stats.taken[c.owner]++;prevOwner[i]=c.owner;}
    const look=c.lv*8+c.b.length;if(prevLook[i]!==look){if(prevLook[i]!==undefined&&look>prevLook[i]&&isVisibleC(i))fxRing(c.x,c.y,'#e8b53a',true);prevLook[i]=look;}});
}
let WX=[];
function initWeather(){WX=[];const n={rain:55,snow:45,wind:18,clear:0}[G.weather]||0;for(let i=0;i<n;i++)WX.push({x:Math.random(),y:Math.random(),s:.5+Math.random(),ph:Math.random()*6});}
function drawWeather(dt,now){
  const W=VS.w,H=VS.h,dp=VS.dpr;ctx.setTransform(dp,0,0,dp,0,0);
  if(G.weather==='rain'){ctx.strokeStyle='rgba(190,210,230,.4)';ctx.lineWidth=1;ctx.beginPath();
    for(const p of WX){p.y+=dt*(0.9+p.s*.6);p.x+=dt*.18;if(p.y>1){p.y-=1;p.x=Math.random();}if(p.x>1)p.x-=1;const x=p.x*W,y=p.y*H;ctx.moveTo(x,y);ctx.lineTo(x-3*p.s,y-11*p.s);}ctx.stroke();}
  else if(G.weather==='snow'){ctx.fillStyle='rgba(255,255,255,.75)';
    for(const p of WX){p.y+=dt*.06*p.s;p.x+=Math.sin(now/900+p.ph)*dt*.02;if(p.y>1){p.y-=1;p.x=Math.random();}const x=((p.x%1)+1)%1*W,y=p.y*H;ctx.beginPath();ctx.arc(x,y,1+p.s*1.3,0,7);ctx.fill();}}
  else if(G.weather==='wind'){for(const p of WX){p.x+=dt*(.16+p.s*.1);p.y+=Math.sin(now/500+p.ph)*dt*.03;if(p.x>1){p.x-=1;p.y=Math.random();}
      const x=p.x*W,y=((p.y%1)+1)%1*H;ctx.save();ctx.translate(x,y);ctx.rotate(now/300+p.ph);ctx.fillStyle=p.s>1?'rgba(214,150,60,.6)':'rgba(140,170,90,.6)';ctx.beginPath();ctx.ellipse(0,0,4,1.8,0,0,7);ctx.fill();ctx.restore();}}
}

// ---------- rendering ----------
function resize(){const r=$('#stage').getBoundingClientRect();const dpr=Math.min(2.5,window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));VS.dpr=dpr;VS.w=r.width;VS.h=r.height;if(G){const t={x:CAM.tx,y:CAM.ty,z:CAM.tz};clampCam(t);CAM.tx=t.x;CAM.ty=t.y;applyCam();}}
window.addEventListener('resize',()=>{if($('#s-game').classList.contains('on'))resize();});
let fontName='';function F(w,sz){if(!fontName)fontName=getComputedStyle(document.body).fontFamily;return`${w} ${sz}px ${fontName}`;}
function rrect(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function plaque(px,py,txt,col,px1,opt={}){const h=Math.max(opt.small?6:8,(opt.small?13:17)*px1);ctx.font=F(700,h*.72);const tw=ctx.measureText(txt).width;const star=opt.star?h*.8:0;const w=tw+h*.7+star;
  ctx.globalAlpha=opt.alpha??1;ctx.fillStyle='rgba(0,0,0,.3)';rrect(px-w/2+h*.08,py+h*.1,w,h,h*.3);ctx.fill();
  ctx.fillStyle=col;ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1,h*.1);rrect(px-w/2,py,w,h,h*.3);ctx.fill();ctx.stroke();
  if(star)drawStar(ctx,px-w/2+h*.55,py+h/2,h*.32,'#ffe38a');
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,px+star/2,py+h*.54);
  if(opt.path){const ex=px+w/2+h*.15,ey=py+h*.5,r=h*.42;ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=h*.08;ctx.beginPath();ctx.arc(ex,ey,r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=col;ctx.strokeStyle=col;
    if(opt.path===1){ctx.beginPath();ctx.moveTo(ex-r*.5,ey-r*.5);ctx.lineTo(ex+r*.5,ey-r*.5);ctx.lineTo(ex+r*.5,ey);ctx.quadraticCurveTo(ex+r*.4,ey+r*.45,ex,ey+r*.6);ctx.quadraticCurveTo(ex-r*.4,ey+r*.45,ex-r*.5,ey);ctx.closePath();ctx.fill();}
    else if(opt.path===2){ctx.fillStyle='#e8b53a';ctx.beginPath();ctx.arc(ex,ey,r*.55,0,7);ctx.fill();ctx.strokeStyle='#8a6508';ctx.lineWidth=h*.06;ctx.stroke();}
    else{ctx.lineWidth=h*.1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ex-r*.5,ey+r*.5);ctx.lineTo(ex+r*.5,ey-r*.5);ctx.moveTo(ex+r*.5,ey+r*.5);ctx.lineTo(ex-r*.5,ey-r*.5);ctx.stroke();}}
  if(opt.coin){ctx.fillStyle='#e8b53a';ctx.strokeStyle='#8a6508';ctx.lineWidth=h*.08;ctx.beginPath();ctx.arc(px+w/2+h*.1,py+h*.1,h*.28,0,7);ctx.fill();ctx.stroke();}
  if(opt.lock){ctx.fillStyle='#4a4a55';ctx.strokeStyle='#fff';ctx.lineWidth=h*.08;ctx.beginPath();ctx.arc(px-w/2-h*.1,py+h*.1,h*.3,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=h*.1;ctx.beginPath();ctx.moveTo(px-w/2-h*.25,py-h*.05);ctx.lineTo(px-w/2+h*.05,py+h*.25);ctx.moveTo(px-w/2+h*.05,py-h*.05);ctx.lineTo(px-w/2-h*.25,py+h*.25);ctx.stroke();}
  ctx.globalAlpha=1;return{w,h};}
function footR(c,ux,uy){const f=footOf(c);return f.rx*f.ry/Math.sqrt((f.ry*ux)**2+(f.rx*uy)**2);}
let lastT=performance.now(),dustT=0,smokeT=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-lastT)/1000);lastT=now;const t=now/1000;
  if(!G||!$('#s-game').classList.contains('on'))return;
  if(VS.w===0)resize();stepCam(dt);
  if(!terrain)terrain=buildTerrainArt(G,TH);
  if(!fogData||now-visT>200){visT=now;updateVision();}
  consumeEvents();
  const s=VS.s,px=1/s,myCol=mySlot>=0?COLORS[mySlot]:'#ffffff';
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#4a7336';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(VS.dpr*s,0,0,VS.dpr*s,VS.dpr*VS.ox,VS.dpr*VS.oy);
  ctx.drawImage(terrain,0,0,G.W,G.H);
  // river shimmer
  ctx.lineJoin='round';for(const b of G.bars){if(b.k!=='w'&&b.k!=='s')continue;const p=b.pts;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length-1;i++){const mx=(p[i].x+p[i+1].x)/2,my=(p[i].y+p[i+1].y)/2;ctx.quadraticCurveTo(p[i].x,p[i].y,mx,my);}ctx.lineTo(p[p.length-1].x,p[p.length-1].y);
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2.2;ctx.setLineDash([14,22,6,30]);ctx.lineDashOffset=-now/45;ctx.stroke();ctx.strokeStyle='rgba(200,235,255,.16)';ctx.lineWidth=1.4;ctx.setLineDash([8,40]);ctx.lineDashOffset=-now/70+17;ctx.stroke();ctx.setLineDash([]);}
  ctx.lineCap='round';
  // routes
  G.castles.forEach((c,i)=>{if(c.route<0||c.owner===NEUTRAL||!isVisibleC(i))return;const tc=G.castles[c.route];
    const dx=tc.x-c.x,dy=tc.y-c.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,r0=footR(c,ux,uy),r1=footR(tc,ux,uy);if(L<r0+r1)return;
    ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=Math.max(6,4*px);ctx.beginPath();ctx.moveTo(c.x+ux*r0,c.y+uy*r0);ctx.lineTo(tc.x-ux*r1,tc.y-uy*r1);ctx.stroke();
    const wait=tc.owner!==NEUTRAL&&teamOf(G,tc.owner)===teamOf(G,c.owner)&&tc.size>=capOf(tc)*0.95;ctx.strokeStyle=colOf(c.owner);ctx.globalAlpha=wait?0.45:1;ctx.lineWidth=Math.max(3.5,2.5*px);ctx.setLineDash(wait?[4,10]:[10,9]);ctx.lineDashOffset=wait?0:-(now/35)%19;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;});
  // trade routes: gold dotted road with carts
  if(remoteView()||!G.trade)computeTrade(G);
  for(const tr of G.trade||[]){if(!(allSeeing()||isTeam(tr.s)))continue;const P=tr.path;ctx.strokeStyle='rgba(232,181,58,.75)';ctx.lineWidth=Math.max(2,1.6*px);ctx.setLineDash([3,7]);ctx.lineDashOffset=-now/80;ctx.beginPath();
    P.forEach((v,i)=>{const c=G.castles[v];i?ctx.lineTo(c.x,c.y):ctx.moveTo(c.x,c.y);});ctx.stroke();ctx.setLineDash([]);
    let L=0;const seg=[];for(let i=1;i<P.length;i++){const a=G.castles[P[i-1]],b=G.castles[P[i]];const l=Math.hypot(b.x-a.x,b.y-a.y);seg.push([a,b,l]);L+=l;}
    for(let q=0;q<2;q++){let d=((now/1000*18+q*L/2+tr.a*37)%(2*L));if(d>L)d=2*L-d;for(const [a,b,l] of seg){if(d<=l){const x=a.x+(b.x-a.x)*d/l,y=a.y+(b.y-a.y)*d/l;
      ctx.fillStyle='#6b4a2a';ctx.fillRect(x-4,y-3,8,5);ctx.fillStyle='#e8b53a';ctx.beginPath();ctx.arc(x-1,y-4,2,0,7);ctx.arc(x+2,y-4,1.8,0,7);ctx.fill();ctx.fillStyle='#2e2418';ctx.beginPath();ctx.arc(x-3,y+2,1.4,0,7);ctx.arc(x+3,y+2,1.4,0,7);ctx.fill();break;}d-=l;}}}
  // pour highlight
  if(pouring&&mySlot>=0){const c=G.castles[pouring.from],tc=G.castles[pouring.to];ctx.strokeStyle=myCol;ctx.globalAlpha=.45+.25*Math.sin(now/90);ctx.lineWidth=Math.max(10,6*px);
    ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(tc.x,tc.y);ctx.stroke();ctx.globalAlpha=1;}
  // ground rings: selection, targets, lock
  const ring=(c,pad,col,dash,fill)=>{const f=footOf(c);ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+pad,f.ry+pad*.75,0,0,7);if(fill){ctx.fillStyle=col;ctx.globalAlpha=.22;ctx.fill();ctx.globalAlpha=1;}
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(2.5,2*px);if(dash){ctx.setLineDash([6,6]);ctx.lineDashOffset=-now/50;}ctx.stroke();ctx.setLineDash([]);};
  if(sel>=0){const c=G.castles[sel];ring(c,6+Math.sin(now/200)*2,c.owner===mySlot?myCol:'#ffffff',false,true);
    if(c.owner===mySlot)for(const {to} of G.adj[sel])if(isVisibleC(to)||seen[to])ring(G.castles[to],6,myCol,true,false);}
  if(pouring){const tc=G.castles[pouring.to];ring(tc,8,myCol,!(gesture&&gesture.lock),gesture&&gesture.lock);}
  // soldiers: interpolate (host/local) or extrapolate (client)
  const client=remoteView();const alpha=client?0:Math.min(1,(now-(G.lastStep||now))/50);const exT=client?Math.min(NET.mode==='replay'?0.6:0.25,(Date.now()-(G.csolT||Date.now()))/1000*(NET.mode==='replay'&&RP?(RP.playing?RP.speed:0):1)):0;
  const SL=solList();const D=[];const lod=s*ART;const figs=lod*25*1.26>=7;const k=ART*1.45;
  const hiRes=s*ART*VS.dpr>1.45;const vx0=-VS.ox/s-120,vx1=(VS.w-VS.ox)/s+120,vy0=-VS.oy/s-140,vy1=(VS.h-VS.oy)/s+120;const onScr=(x,y)=>x>vx0&&x<vx1&&y>vy0&&y<vy1;
  G.castles.forEach((c,i)=>{const st=isVisibleC(i)?c:seen[i];if(!st||!onScr(c.x,c.y))return;D.push({y:c.y,k:0,i,st});});
  const clusters=new Map();
  for(let i=0;i<SL.length;i++){const so=SL[i];let x,y;
    if(client){x=so.x+(so.st===0?so.hx*SPEED_S*G.sp*exT:0);y=so.y+(so.st===0?so.hy*SPEED_S*G.sp*exT:0);}else{x=so.px+(so.x-so.px)*alpha;y=so.py+(so.y-so.py)*alpha;}
    if(!solVisible(so.o,x,y))continue;if(!onScr(x,y)){const ck=so.o+':'+Math.floor(x/70)+':'+Math.floor(y/70);let cl=clusters.get(ck);if(!cl)clusters.set(ck,cl={o:so.o,n:0,x:0,y:0,top:1e9});cl.n++;cl.x+=x;cl.y+=y;if(y<cl.top)cl.top=y;continue;}const col=colOf(so.o);const id=client?i:so.id;
    D.push({y,k:1,x,col,st:so.st,id,u:so.u|0,rk:so.rk|0,vr:client?(so.vr|0):(so.id&3),dir:so.hx>=0?1:-1,hx:so.hx,hy:so.hy});
    const ck=so.o+':'+Math.floor(x/70)+':'+Math.floor(y/70);let cl=clusters.get(ck);if(!cl)clusters.set(ck,cl={o:so.o,n:0,x:0,y:0,top:1e9});cl.n++;cl.x+=x;cl.y+=y;if(y<cl.top)cl.top=y;}
  for(const tw of G.tw){if(!(allSeeing()||isTeam(tw.o)||vis&&vis[cellAt(tw.x,tw.y)]))continue;D.push({y:tw.y,k:3,tw});
    if(client&&!(tw.bt>0)&&Math.random()<dt*1.6){const en=SL.find(o=>o.o!==tw.o&&Math.hypot(o.x-tw.x,o.y-tw.y)<70);if(en&&fx.length<420)fx.push({k:'arrow',x:tw.x,y:tw.y-14,tx:en.x,ty:en.y-4,t:now,life:300});}}
  D.sort((a,b)=>a.y-b.y);
  for(const d of D){
    if(d.k===0){const c=G.castles[d.i],st=d.st,col=colOf(st.owner);const sp=spriteFor(st,col,hiRes);
      ctx.drawImage(sp.cn,c.x-sp.ox*ART,c.y-sp.oy*ART,sp.size*ART,sp.size*ART);
      if(lod>0.22&&st.owner!==NEUTRAL)for(const fl of sp.flags){const fxp=c.x+(fl.x-sp.ox)*ART,fyp=c.y+(fl.y-sp.oy)*ART,fs=fl.s*ART;
        drawFlag(ctx,fxp,fyp,fs,col,t,st===c&&!c.sup&&c.capital<0);if(fl.cap)drawStar(ctx,fxp+8.5*fs,fyp-13.5*fs,3.4*fs,'#fff');}
      if(st===c&&c.owner===NEUTRAL&&c.kind==='v'&&sp.smoke.length){smokeT+=dt;if(smokeT>0.9&&fx.length<300){smokeT=0;const sm=sp.smoke[Math.floor(Math.random()*sp.smoke.length)];fx.push({k:'smoke',x:c.x+(sm.x-sp.ox)*ART,y:c.y+(sm.y-sp.oy)*ART,t:now,life:2600});}}}
    else if(d.k===3){drawTower(ctx,d.tw,colOf(d.tw.o),now,px);}
    else if(figs){const fighting=d.st===1||d.st===2;const ph=fighting?t*14+d.id*1.3:d.st===3?0:t*9+d.id*1.7;
      const lunge=fighting?Math.max(0,Math.sin(t*7+d.id))*2.2:0;
      drawUnit(ctx,d.x+d.hx*lunge,d.y+d.hy*lunge,k,d.col,ph,d.dir,d.u,d.vr===3&&d.id%4===0,fighting,d.vr);
      if(d.rk){const top=d.y-(d.u===2?40:30)*k;ctx.strokeStyle='#e8b53a';ctx.lineWidth=Math.max(0.9,1.2*k);for(let q=0;q<d.rk;q++){const yy=top-q*2.6*k*1.6;ctx.beginPath();ctx.moveTo(d.x-3*k*1.6,yy);ctx.lineTo(d.x,yy-2*k*1.6);ctx.lineTo(d.x+3*k*1.6,yy);ctx.stroke();}}
    }
    else{const r=Math.max(1.6,2.2*px)*(d.u===2?1.35:1);ctx.fillStyle=d.col;ctx.beginPath();ctx.arc(d.x,d.y,r*(d.u===0?0.85:1),0,7);ctx.fill();}}
  // damage states: smoke over weak or besieged castles, fire on the towers during an assault
  G.castles.forEach((c,i)=>{if(!isVisibleC(i)||c.kind==='m')return;const low=c.owner!==NEUTRAL&&c.size<capOf(c)*0.2;if(!c.assault&&!low)return;const sp=spriteFor(c,colOf(c.owner));
    const f=footOf(c);if(Math.random()<dt*(c.assault?3:1.2)&&fx.length<420)fx.push({k:'smoke2',x:c.x+(Math.random()-.5)*f.rx*1.2,y:c.y-f.ry*0.6,t:now,life:2800,s:c.assault?1.4:1});
    if(c.assault&&lod>0.18){const fl=sp.flags.slice(0,3);for(let q=0;q<fl.length;q++){const fxp=c.x+(fl[q].x-sp.ox)*ART,fyp=c.y+(fl[q].y-sp.oy)*ART+12*ART*fl[q].s;const fl1=Math.sin(now/90+q*2)*1.2;
      ctx.fillStyle='rgba(240,120,30,.85)';ctx.beginPath();ctx.moveTo(fxp-3,fyp);ctx.quadraticCurveTo(fxp-2,fyp-5,fxp+fl1*.5,fyp-8-fl1);ctx.quadraticCurveTo(fxp+2,fyp-5,fxp+3,fyp);ctx.fill();
      ctx.fillStyle='rgba(255,215,90,.9)';ctx.beginPath();ctx.moveTo(fxp-1.5,fyp);ctx.quadraticCurveTo(fxp,fyp-4,fxp+fl1*.3,fyp-5);ctx.quadraticCurveTo(fxp+1,fyp-3,fxp+1.5,fyp);ctx.fill();}}
    if(low&&!c.assault&&lod>0.18){ctx.strokeStyle='rgba(40,35,30,.55)';ctx.lineWidth=Math.max(.8,.7*px);const R=mkRng(i*977);for(let q=0;q<3;q++){const x0=c.x+(R()-.5)*f.rx*1.4,y0=c.y+(R()-.2)*f.ry*.6;ctx.beginPath();ctx.moveTo(x0,y0-6);ctx.lineTo(x0+2,y0-3);ctx.lineTo(x0-1,y0);ctx.lineTo(x0+1.5,y0+3);ctx.stroke();}}});
  // castles under assault: pulsing ring and arrows from the walls
  G.castles.forEach((c,i)=>{if(!c.assault||!isVisibleC(i))return;const f=footOf(c);
    ctx.strokeStyle='rgba(220,60,50,'+(0.45+0.3*Math.sin(now/150))+')';ctx.lineWidth=Math.max(2.5,2*px);ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+16,f.ry+12,0,0,7);ctx.stroke();
    if(Math.random()<dt*Math.min(10,Math.max(1,c.size*0.25))&&fx.length<420){let tx=null;for(let tries=0;tries<6&&!tx;tries++){const so=SL[Math.floor(Math.random()*SL.length)];if(so&&so.o!==c.owner&&Math.hypot(so.x-c.x,so.y-c.y)<f.rx+40)tx=so;}
      if(tx)fx.push({k:'arrow',x:c.x+(Math.random()-.5)*f.rx,y:c.y-f.ry-6,tx:tx.x,ty:tx.y-4,t:now,life:380});}});
  // wonders rising beside capitals
  for(let s2=0;s2<8;s2++){const p=G.pl[s2];if(p.out||!(p.ws>0||p.wb>=0))continue;const ci=G.capIdx[s2];if(ci===undefined)continue;const c=G.castles[ci];if(c.owner!==s2||!isVisibleC(ci)||!onScr(c.x,c.y))continue;
    const f=footOf(c);drawWonder(ctx,c.x-f.rx-16,c.y-4,p.ws,p.wb>=0?p.wb/WONDER_T:0,colOf(s2),now,p.ws>=WONDER_STAGES);}
  // castle plaques
  G.castles.forEach((c,i)=>{const vis_=isVisibleC(i),st=vis_?c:seen[i];if(!st)return;
    if(vis_&&c.build){const f=footOf(c);const pr=c.build.dur>1?c.build.t/c.build.dur:c.build.t;ctx.strokeStyle='#e8b53a';ctx.lineWidth=Math.max(3,2.5*px);ctx.setLineDash([5,4]);ctx.lineDashOffset=-now/60;
      ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+10,f.ry+8,0,-Math.PI/2,-Math.PI/2+2*Math.PI*Math.min(1,pr));ctx.stroke();ctx.setLineDash([]);}
    const sp=spriteFor(st,colOf(st.owner));
    plaque(c.x,c.y+sp.plaque*ART,String(Math.max(0,Math.floor(st.size))),colOf(st.owner),px,{star:st.capital>=0,path:st.owner!==NEUTRAL?(c.path|0):0,coin:vis_&&c.tax&&c.owner!==NEUTRAL,lock:vis_&&c.sab>G.gt,alpha:vis_?1:.75});});
  // soldier group counts
  const CL=[...clusters.values()];for(const a of CL){a.cx=a.x/a.n;a.cy=a.y/a.n;}
  for(let i=0;i<CL.length;i++){const a=CL[i];if(!a.n)continue;for(let j=i+1;j<CL.length;j++){const b=CL[j];if(!b.n||b.o!==a.o)continue;
    if(Math.hypot(a.cx-b.cx,a.cy-b.cy)<60){const n=a.n+b.n;a.cx=(a.cx*a.n+b.cx*b.n)/n;a.cy=(a.cy*a.n+b.cy*b.n)/n;a.top=Math.min(a.top,b.top);a.n=n;b.n=0;}}}
  for(const cl of CL){if(cl.n<2)continue;plaque(cl.cx,cl.top-(figs?30*ART*1.45:8),String(cl.n),colOf(cl.o),px,{small:true,alpha:.92});}
  // effects
  fx=fx.filter(f=>now-f.t<(f.life||700));fx.sort((a,b)=>(a.k==='corpse'?0:1)-(b.k==='corpse'?0:1));
  for(const f of fx){const life=f.life||700,k=Math.max(0,(now-f.t)/life);
    if(f.k==='ring'){ctx.strokeStyle=f.col;ctx.globalAlpha=(1-k)*.8;ctx.lineWidth=f.big?4:2.5;ctx.beginPath();ctx.ellipse(f.x,f.y,(f.big?30:20)+k*(f.big?45:20),((f.big?30:20)+k*(f.big?45:20))*.7,0,0,7);ctx.stroke();}
    else if(f.k==='txt'){ctx.globalAlpha=1-k;ctx.font=F(700,Math.max(10,14*px));ctx.textAlign='center';ctx.lineWidth=Math.max(2,3*px);ctx.strokeStyle='#fff';ctx.strokeText(f.txt,f.x,f.y-k*30);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y-k*30);}
    else if(f.k==='arrow'){const x1=f.x+(f.tx-f.x)*k,y1=f.y+(f.ty-f.y)*k-Math.sin(k*Math.PI)*10;const ang=Math.atan2(f.ty-f.y,f.tx-f.x);ctx.strokeStyle='#3a2f24';ctx.lineWidth=Math.max(.8,.9*px);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-Math.cos(ang)*5,y1-Math.sin(ang)*5);ctx.stroke();}
    else if(f.k==='corpse'){ctx.globalAlpha=Math.min(1,(1-k)*2)*.85;drawCorpse(ctx,f.x,f.y,ART*1.3,f.col,f.u,Math.cos(f.r)>0);}
    else if(f.k==='scorch'){ctx.globalAlpha=Math.min(1,(1-k)*1.5)*.5;ctx.fillStyle='#2a1a10';ctx.beginPath();ctx.ellipse(f.x,f.y,40,28,0,0,7);ctx.fill();ctx.globalAlpha=Math.min(1,(1-k)*1.5)*.35;ctx.fillStyle='#4a2a14';ctx.beginPath();ctx.ellipse(f.x-6,f.y+3,24,15,0,0,7);ctx.fill();}
    else if(f.k==='smoke2'){if(now<f.t)continue;ctx.fillStyle='rgba(70,66,60,1)';ctx.globalAlpha=.45*(1-k);ctx.beginPath();ctx.arc(f.x+k*10+Math.sin(k*5)*2,f.y-k*34,(2.5+k*7)*f.s,0,7);ctx.fill();}
    else if(f.k==='smoke'){ctx.fillStyle='rgba(235,235,235,1)';ctx.globalAlpha=.4*(1-k);ctx.beginPath();ctx.arc(f.x+k*6+Math.sin(k*6)*1.5,f.y-k*18,1.5+k*3.5,0,7);ctx.fill();}
    else{const e=(now-f.t)/1000;ctx.fillStyle=f.col;ctx.globalAlpha=Math.max(0,1-k);ctx.beginPath();ctx.arc(f.x+f.vx*e,f.y+f.vy*e,f.r*(1-k*.5),0,7);ctx.fill();}}
  ctx.globalAlpha=1;
  // fog
  if(!allSeeing()){ctx.imageSmoothingEnabled=true;ctx.drawImage(fogCv,0,0,FW*CELL,FH*CELL);}
  for(const o of G.scouts)if(isTeam(o.s)||allSeeing()){ctx.strokeStyle=colOf(o.s);ctx.lineWidth=Math.max(2,1.5*px);ctx.setLineDash([4,10]);ctx.lineDashOffset=now/60;ctx.beginPath();ctx.arc(o.x,o.y,330,0,7);ctx.stroke();ctx.setLineDash([]);}
  // chevrons beside my castles
  if(mySlot>=0&&!G.over&&!G.pl[mySlot].out){const pulse=(Math.sin(now/260)+1)*2;ctx.lineJoin='round';
    G.castles.forEach((c,i)=>{if(c.owner!==mySlot)return;const on=sel===i||(pouring&&pouring.from===i);
      for(const {to} of G.adj[i]){if(c.route===to)continue;const tc=G.castles[to];const dx=tc.x-c.x,dy=tc.y-c.y,L=Math.hypot(dx,dy);const ux=dx/L,uy=dy/L;
        const off=footR(c,ux,uy)+Math.max(8,8*px)+pulse;if(off>L*0.45)continue;const hx=c.x+ux*off,hy=c.y+uy*off,k=Math.max(4.5,5*px);
        ctx.beginPath();ctx.moveTo(hx-ux*k-uy*k,hy-uy*k+ux*k);ctx.lineTo(hx,hy);ctx.lineTo(hx-ux*k+uy*k,hy-uy*k-ux*k);
        ctx.globalAlpha=on?1:.7;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=Math.max(4.5,4.5*px);ctx.stroke();ctx.strokeStyle=myCol;ctx.lineWidth=Math.max(2.5,2.6*px);ctx.stroke();}});ctx.globalAlpha=1;}
  // pings
  pings=pings.filter(p=>now-p.t<7000);
  for(const p of pings){const c=G.castles[p.c],f=footOf(c),k=((now-p.t)%1000)/1000,col=p.type?'#3a9bd9':'#e0474c';
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(3,2.5*px);ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(c.x,c.y,f.rx+12+k*30,(f.ry+10+k*30)*.75,0,0,7);ctx.stroke();ctx.globalAlpha=1;
    const bx=c.x,by=c.y-f.ry-40*Math.max(px,.5),br=Math.max(8,10*px);ctx.fillStyle=col;ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1.5,2*px);ctx.beginPath();ctx.arc(bx,by,br,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font=F(700,br*1.3);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.type?'+':'!',bx,by+1);}
  // pending Fire Rain: warning ring and falling fireballs
  for(const f of G.fires){const left=f.at-G.gt;if(left<-0.05)continue;const R=f.r||AB[0].r;
    ctx.strokeStyle='rgba(230,70,40,'+(0.55+0.35*Math.sin(now/90))+')';ctx.lineWidth=Math.max(2.5,2*px);ctx.setLineDash([7,6]);ctx.lineDashOffset=now/40;ctx.beginPath();ctx.ellipse(f.x,f.y,R,R*0.75,0,0,7);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(230,70,40,.10)';ctx.fill();
    if(left<0.7){for(let q=0;q<9;q++){const a=q*2.39+f.x,rr=R*((q*37%10)/10);const tx=f.x+Math.cos(a)*rr,ty=f.y+Math.sin(a)*rr*0.75;const k2=Math.max(0,left)/0.7;const sx=tx+60*k2,sy=ty-180*k2;
      const g=ctx.createLinearGradient(sx+24,sy-60,sx,sy);g.addColorStop(0,'rgba(255,200,80,0)');g.addColorStop(1,'rgba(255,140,40,.9)');ctx.strokeStyle=g;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx+24,sy-60);ctx.lineTo(sx,sy);ctx.stroke();
      ctx.fillStyle='#ffd35a';ctx.beginPath();ctx.arc(sx,sy,3.2,0,7);ctx.fill();}}}
  // breached castles: rubble at the walls
  G.castles.forEach((c,i)=>{if(!(c.br>G.gt)||!isVisibleC(i))return;const f=footOf(c);const R=mkRng(i*131);ctx.fillStyle='#8f877a';for(let q=0;q<14;q++){const a=R()*6.28;ctx.beginPath();ctx.arc(c.x+Math.cos(a)*f.rx*1.02,c.y+Math.sin(a)*f.ry*1.02,1.4+R()*2.2,0,7);ctx.fill();}
    if(Math.random()<dt*2&&fx.length<420)fx.push({k:'smoke2',x:c.x+(Math.random()-.5)*f.rx,y:c.y,t:now,life:2400,s:0.9});});
  // night: darken the world, castles glow with torchlight
  const nl=nightLevel(G.time);
  if(nl>0.01){ctx.setTransform(VS.dpr,0,0,VS.dpr,0,0);ctx.fillStyle='rgba(10,18,46,'+(0.42*nl)+')';ctx.fillRect(0,0,VS.w,VS.h);
    ctx.setTransform(VS.dpr*s,0,0,VS.dpr*s,VS.dpr*VS.ox,VS.dpr*VS.oy);ctx.globalCompositeOperation='lighter';
    G.castles.forEach((c,i)=>{if(c.owner===NEUTRAL&&c.kind!=='v'||!isVisibleC(i)||!onScr(c.x,c.y))return;const f=footOf(c),R=f.rx*1.5;const g=ctx.createRadialGradient(c.x,c.y-4,2,c.x,c.y-4,R);
      g.addColorStop(0,'rgba(255,170,70,'+(0.32*nl)+')');g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.fillRect(c.x-R,c.y-4-R,2*R,2*R);});
    ctx.globalCompositeOperation='source-over';}
  // attack alerts: arrows at the screen edge pointing to your castles in trouble
  ALERT_IND=[];if(mySlot>=0&&!G.over){ctx.setTransform(VS.dpr,0,0,VS.dpr,0,0);
    G.castles.forEach((c,i)=>{if(c.owner!==mySlot)return;const a=alerts[i];if(!a||now-a.t>8000)return;const sx=c.x*s+VS.ox,sy=c.y*s+VS.oy;if(sx>20&&sx<VS.w-20&&sy>20&&sy<VS.h-20)return;
      const cx=VS.w/2,cy=VS.h/2,dx=sx-cx,dy=sy-cy;const k=Math.min((VS.w/2-26)/Math.abs(dx||1e-6),(VS.h/2-26)/Math.abs(dy||1e-6));const ax=cx+dx*k,ay=cy+dy*k,ang=Math.atan2(dy,dx);
      const pul=0.6+0.4*Math.sin(now/150);ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);ctx.fillStyle='rgba(214,52,44,'+pul+')';ctx.strokeStyle='#fff';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ALERT_IND.push({x:ax,y:ay,c:i});});}
  // soft light: warm centre, darker edges
  ctx.setTransform(VS.dpr,0,0,VS.dpr,0,0);{const vg=ctx.createRadialGradient(VS.w/2,VS.h/2,Math.min(VS.w,VS.h)*0.35,VS.w/2,VS.h/2,Math.max(VS.w,VS.h)*0.75);vg.addColorStop(0,'rgba(255,240,200,0)');vg.addColorStop(1,'rgba(20,25,15,.28)');ctx.fillStyle=vg;ctx.fillRect(0,0,VS.w,VS.h);}
  drawWeather(dt,now);
  hud(now);
}
let lastHud=0,ALERT_IND=[];const alerts={},prevAssault={};
function checkAlerts(now){if(!G||mySlot<0||G.over||G.pl[mySlot].out)return;const SL=solList();
  G.castles.forEach((c,i)=>{if(c.owner!==mySlot){prevAssault[i]=0;return;}
    if(c.assault>0&&!prevAssault[i]&&(!alerts[i]||now-alerts[i].t>8000)){alerts[i]={t:now,k:'a'};toast(G.names[i]+' is under attack!',2600);}
    else if(!c.assault&&(!alerts[i]||now-alerts[i].t>20000)){let n=0;for(const x of SL){if(x.o===mySlot||isTeam(x.o)||x.st===2)continue;if((x.x-c.x)**2+(x.y-c.y)**2<160*160)n++;}
      if(n>=6){alerts[i]={t:now,k:'n'};toast('Enemy army approaching '+G.names[i]+' ('+n+')',2600);}}
    prevAssault[i]=c.assault>0?1:0;});}
setInterval(()=>{if(G&&$('#s-game').classList.contains('on'))checkAlerts(performance.now());},400);
function wonderBanner(){const el=$('#wbanner');if(!G){el.hidden=true;return;}const parts=[];
  for(let s=0;s<8;s++){const p=G.pl[s];if(p.out||!(p.ws>0||p.wb>=0))continue;const who=s===mySlot?'Your':ownerName(s)+'’s';
    parts.push({s,t:p.ws>=WONDER_STAGES?who+' Wonder: '+fmtClock((WONDER_HOLD-p.wh)/G.sp)+' to victory':who+' Wonder: stage '+Math.min(WONDER_STAGES,p.ws+(p.wb>=0?1:0))+'/'+WONDER_STAGES});}
  if(!parts.length){el.hidden=true;return;}el.hidden=false;el.innerHTML='';for(const q of parts){const d=document.createElement('div');d.textContent=q.t;d.style.borderLeftColor=COLORS[q.s];el.appendChild(d);}}
function myTroops(s){let t=0;for(const c of G.castles)if(c.owner===s)t+=c.size;for(const x of solList())if(x.o===s)t++;return t;}
function incomeOf(s){let g=0;for(const c of G.castles)if(c.owner===s)g+=goldRate(G,c);return g*G.sp;}
function hud(now){
  if(now-lastHud<300)return;lastHud=now;
  const pw=new Array(8).fill(0);for(let s=0;s<8;s++)pw[s]=G.pl[s].out?0:myTroops(s);
  const el=$('#power');if(el.children.length!==8){el.innerHTML='';for(let i=0;i<8;i++){const b=document.createElement('i');b.style.background=COLORS[i];el.appendChild(b);}}
  for(let i=0;i<8;i++)el.children[i].style.flexGrow=pw[i];
  wonderBanner();const tm=Math.floor(G.time);$('#dn').textContent=nightLevel(G.time)>0.5?'☾':'☀';$('#clock').textContent=Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0');
  if(mySlot>=0){const p=G.pl[mySlot];$('#gold').textContent=Math.floor(p.gold);$('#inc').textContent='+'+incomeOf(mySlot).toFixed(1);
    $('#troops').textContent=Math.floor(pw[mySlot]);$('#tcap').textContent='/'+armyCap(G,mySlot);
    $('#castles').textContent=G.castles.filter(c=>c.owner===mySlot).length;}
  else{$('#gold').textContent='–';$('#inc').textContent='';$('#troops').textContent='–';$('#tcap').textContent='';$('#castles').textContent='–';}
}
requestAnimationFrame(frame);

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
  const lines=[['Conqueror',best(tk),tk[best(tk)]+' castles taken'],['Warlord',best(stats.peak),Math.round(stats.peak[best(stats.peak)])+' troops at peak'],['Treasurer',best(earned),Math.round(earned[best(earned)])+' gold earned']];
  const hl=$('#hl');hl.innerHTML='';for(const [tt,s,v] of lines){const d=document.createElement('div');const b=document.createElement('b');b.textContent=tt+': ';const n=document.createElement('span');n.textContent=ownerName(s)+', '+v;d.append(b,n);d.style.borderLeft='4px solid '+COLORS[s];d.style.paddingLeft='8px';hl.appendChild(d);}
}

// ---------- input: tap, hold-to-pour, pan, pinch, wheel ----------
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
cv.addEventListener('pointerdown',e=>{
  if(!G)return;const p=local(e);PT.set(e.pointerId,p);try{cv.setPointerCapture(e.pointerId)}catch(_){}
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
  if(!G||!PT.has(e.pointerId))return;const p=local(e);PT.set(e.pointerId,p);
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
  if(armedAb===0){issue(6,0,Math.round(w.x),Math.round(w.y));toast('Fire Rain incoming.',1500);armedAb=-1;updateBar();return;}
  if(armedAb===1){if(ci>=0&&!isTeam(G.castles[ci].owner)&&isVisibleC(ci)){issue(6,1,ci);toast('Breaching the walls of '+G.names[ci]+'.',1800);armedAb=-1;}else toast('Pick an enemy or neutral castle you can see.',1500);updateBar();return;}
  if(armedAb===2){issue(6,2,Math.round(w.x),Math.round(w.y));toast('Scouts sent.',1500);armedAb=-1;updateBar();return;}
  if(ci>=0){if(canAct()&&sel>=0&&sel!==ci&&G.castles[sel].owner===mySlot&&G.edgeKey[sel+'_'+ci]!==undefined){issue(1,sel,ci);return;}
    sel=sel===ci?-1:ci;panelKey='';updatePanel();return;}
  sel=-1;updatePanel();
}
cv.addEventListener('pointerup',e=>{endPtr(e,false);panelAt=Math.max(panelAt,performance.now()-50);});
cv.addEventListener('pointercancel',e=>endPtr(e,true));
cv.addEventListener('wheel',e=>{if(!G)return;e.preventDefault();const p=local(e);zoomAt(p.x,p.y,Math.exp(-e.deltaY*0.0015));},{passive:false});
document.addEventListener('keydown',e=>{
  if(!G||!$('#s-game').classList.contains('on')||e.target.tagName==='INPUT')return;
  if(e.key==='Escape'){sel=-1;armedAb=-1;updatePanel();updateBar();}
  else if(e.key==='+'||e.key==='=')$('#z-in').click();else if(e.key==='-')$('#z-out').click();else if(e.key==='0')$('#z-fit').click();
});
