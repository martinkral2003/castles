// Rule-level checks for revision 2 (DESIGN.md): small scripted situations, no bots
const H=require('../src/core.js');let fails=0;
const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m);}else if(process.env.V)console.log('ok  ',m);};
const near=(a,b,e)=>Math.abs(a-b)<=e;
const mk=(np=2,o={})=>{const slots=[];for(let i=0;i<8;i++)slots.push(i<np?{k:'h',n:'P'+i}:{k:'x'});return H.newGame({seed:o.seed||321,slots,W:1000,H:1600,ms:o.ms??1,sp:1,mt:o.mt??1,opts:o.opts});};
const run=(G,s)=>{for(let t=0;t<s;t+=0.05){H.step(G,0.05);G.events.length=0;}};
const own=(G,s)=>G.castles[G.capIdx[s]];
const prep=G=>{for(const p of G.pl)p.souls=2000;};

{ // supply weights and capacity
  const G=mk();const c=own(G,0);
  ok(H.UNIT.map(u=>u.sup).join()==='1,2,5,8','supply weights 1/2/5/8');
  c.u=[10,5,2];c.size=17;ok(H.load(c)===10+10+10,'load() is weighted');
  ok(H.armyCap(G,0)===120+80*c.lv,'army cap 120+80*throne level');
  const cap0=H.armyCap(G,0);G.pl[0].cards[H.CARD_ID.acap]=2;H.recomputeMods(G,0);ok(H.armyCap(G,0)===Math.round(cap0*1.5),'Legion Writ scales the cap');
}
{ // breeding: plain castles make minions only; Spawners follow the level mix; greater only at level 5+
  const G=mk();const c=own(G,0);prep(G);c.u=[0,0,0];c.size=0;c.lv=2;
  ok(!H.unitOk(c,1)&&!H.unitOk(c,2),'no demons without a Spawner');
  c.lv=3;c.path=3;ok(H.unitOk(c,1)&&!H.unitOk(c,2),'Spawner lv3 makes lessers, not greaters');
  c.lv=5;ok(H.unitOk(c,2),'Spawner lv5 makes greaters');
  for(const lv of [3,4,5,6]){c.lv=lv;c.u=[0,0,0];c.size=0;c.path=3;c.mode=0;G.pl[0].mod.acap=9;run(G,40);
    const m=H.SPAWN_MIX[lv],sp=c.u[0]+2.2*c.u[1]+7*c.u[2];
    ok(near(c.u[0]/sp,m[0],0.04)&&near(2.2*c.u[1]/sp,m[1],0.04)&&near(7*c.u[2]/sp,m[2],0.04),'Spawner lv'+lv+' mix '+m.join('/')+' got '+[c.u[0]/sp,2.2*c.u[1]/sp,7*c.u[2]/sp].map(v=>v.toFixed(2)).join('/'));}
  const d=mk();const q=own(d,0);q.lv=3;q.path=0;q.u=[0,0,0];q.size=0;run(d,30);ok(q.u[1]===0&&q.u[2]===0&&q.u[0]>3,'plain level-3 castle breeds minions only');
}
{ // Souls mode: no breeding, souls instead, garrison stays
  const G=mk();const c=own(G,0);c.u=[20,0,0];c.size=20;const s0=G.pl[0].souls;c.mode=1;run(G,30);
  ok(near(c.size,20,0.01),'Souls-mode castle does not breed');
  const want=H.modeRate(G,c)*30;ok(G.pl[0].souls-s0>want*0.9&&G.pl[0].souls-s0<want*1.1+0.5,'Souls mode pays '+want.toFixed(1)+' souls in 30s, got '+(G.pl[0].souls-s0).toFixed(1));
  ok(H.setMode(G,0,G.castles.findIndex(k=>k.kind==='m'),1)===false||!G.castles.some(k=>k.kind==='m'),'springs cannot switch to Souls mode');
  c.mode=0;const w=H.modeRate(G,c);ok(w===0,'Army castle has no mode income');
  c.mode=1;c.path=1;const a=H.modeRate(G,c);c.path=0;ok(near(a/H.modeRate(G,c),1.5,0.001),'Soul Well gives +50% in Souls mode');
}
{ // kills pay the killer, give the victim a consolation, and are capped per window (driven through Hellfire)
  const G=mk();prep(G);const sol=(id,x,y)=>{const s={id,o:1,from:G.adj[G.capIdx[1]][0].to,to:G.capIdx[1],e:G.edgeKey[G.adj[G.capIdx[1]][0].to+'_'+G.capIdx[1]],d:30,off:0,st:3,u:0,g:0,rk:0,xp:0,hp:.1,cd:0,tgt:null,tt:9,ret:0,ch:false,x,y,px:x,py:y,hx:1,hy:0,wx:0,wy:0,lord:null,au:0};G.sol.push(s);G.fieldN[1]++;return s;};
  G.pl[0].cd=[0,0,0];const fc=G.castles[G.adj[G.capIdx[1]][0].to],s1=sol(8001,fc.x,fc.y);run(G,0.5);const e0=G.pl[0].earned,e1=G.pl[1].earned;
  H.useSpell(G,0,2,s1.x,s1.y);run(G,2.2);
  ok(near(G.pl[0].earned-e0,H.killSouls(0),0.01),'killer gets '+H.killSouls(0).toFixed(2)+' souls, got '+(G.pl[0].earned-e0).toFixed(2));
  ok(near(G.pl[1].earned-e1,H.killSouls(0)*H.KILL_BACK,0.01),'victim gets 50% back');
  G.pl[0].cd=[0,0,0];G.pl[0].souls=500;const f0=G.pl[0].earned;for(let i=0;i<100;i++)sol(8100+i,fc.x,fc.y);run(G,0.5);const q=G.sol.find(x=>x.id===8100);
  H.useSpell(G,0,2,q.x,q.y);run(G,2.2);ok(G.pl[0].earned-f0<=H.KILL_CAP+0.01&&G.pl[0].earned-f0>H.KILL_CAP*0.5,'kill souls are capped ('+(G.pl[0].earned-f0).toFixed(1)+' of '+H.KILL_CAP+')');
  ok(near(H.killSouls(0),H.KILL_V,1e-9)&&near(H.killSouls(1),H.KILL_V*1.45/.75,1e-9)&&near(H.killSouls(3),H.KILL_V*14/.75,1e-9),'kill value scales with hp');
}
{ // towers: build one level, fire at enemies near the castle, lose a level on capture
  const G=mk();const c=own(G,0);prep(G);const s0=G.pl[0].souls;
  ok(H.towerCost(G,0,c)===H.TOWER_COST[0],'tower level 1 cost');ok(H.fortify(G,0,G.capIdx[0])&&G.pl[0].souls===s0-H.TOWER_COST[0],'fortify pays');
  ok(H.fortify(G,0,G.capIdx[0])===false,'cannot fortify twice while building');
  run(G,H.TOWER_T+1);ok(c.tl===1,'tower level 1 built');
  const nb=G.adj[G.capIdx[0]][0].to;
  for(const lvl of [2,3]){H.fortify(G,0,G.capIdx[0]);run(G,H.TOWER_T+1);}
  ok(c.tl===3&&H.fortify(G,0,G.capIdx[0])===false,'tower level caps at 3');
  c.u=[30,0,0];c.size=30;
  // an enemy soldier parked in range gets shot
  G.sol.push({id:9999,o:1,from:nb,to:G.capIdx[0],e:G.edgeKey[nb+'_'+G.capIdx[0]],d:1,off:0,st:3,u:0,g:0,rk:0,xp:0,hp:5,cd:0,tgt:null,tt:9,ret:0,ch:false,x:c.x+40,y:c.y,px:c.x+40,py:c.y,hx:1,hy:0,wx:0,wy:0,lord:null,au:0});G.fieldN[1]++;
  const hp0=5;run(G,6);const s=G.sol.find(x=>x.id===9999);ok(!s||s.hp<hp0,'tower shoots an enemy within range');
}
{ // paths and lords
  const G=mk();prep(G);const c=own(G,0);c.lv=4;
  ok(H.choosePath(G,0,G.capIdx[0],2)===false,'the Throne cannot take Citadel');
  ok(H.choosePath(G,0,G.capIdx[0],3)===true,'the Throne can take Spawner');
  const q=G.castles.find((k,i)=>i!==G.capIdx[0]&&i!==G.capIdx[1]&&k.kind!=='m');q.owner=0;q.lv=3;q.u=[10,0,0];q.size=10;q.path=0;q.build=null;
  ok(H.choosePath(G,0,G.castles.indexOf(q),2)===true,'a level-3 castle can take Citadel');run(G,20);ok(q.path===2&&H.isWalled(q),'Citadel is walled');
  ok(H.lordStatus(G,0,G.castles.indexOf(q)).can,'a Citadel can hire a lord');ok(H.hireLord(G,0,G.castles.indexOf(q))&&q.lords.length===1,'lord hired');
  ok(H.lordStatus(G,0,G.capIdx[0]).can===false,'the Throne cannot hire a lord');
}
{ // research: two cards, price scale, spells ready from the start
  const G=mk();prep(G);const p=G.pl[0];
  ok(H.researchCost(G,0)===40,'first card costs 40');ok(H.drawResearch(G,0)&&p.offer.length===2&&p.offer[0]!==p.offer[1],'two distinct cards offered');
  ok(H.drawResearch(G,0)===false,'no second draw while an offer is pending');
  ok(H.pickCard(G,0,1)&&p.offer===null&&p.rn===1,'pick clears the offer');ok(H.researchCost(G,0)===Math.round(40*1.12),'price rises by 12%');
  ok(H.SPELLS.length===3&&H.CARDS.length===18,'3 spells and 18 cards');
  ok(H.CARDS.every(c=>c.id>=0),'card ids');
  const big=H.CARDS.filter(c=>/\+(\d+)%/.test(c.desc)).every(c=>+/\+(\d+)%/.exec(c.desc)[1]>=15);ok(big,'every percentage card is at least +15%');
}
{ // spells
  const G=mk();prep(G);const p=G.pl[0];
  ok(H.spellCost(G,0,0)===110&&H.spellCost(G,0,1)===20&&H.spellCost(G,0,2)===70,'spell costs');
  const s0=p.souls;ok(H.useSpell(G,0,0)&&p.souls===s0-110&&p.hz>G.gt,'Horde Boost is global and costs 110');ok(H.useSpell(G,0,0)===false,'cannot recast Horde Boost while it is on');
  ok(H.useSpell(G,0,1,500,800)&&G.scouts.length===1&&G.scouts[0].r===200,'Spies reveal radius 200');ok(H.useSpell(G,0,1,500,800)===false,'Spies on cooldown');
  ok(H.useSpell(G,0,2,500,800)&&G.fires.length===1,'Hellfire queued');
  G.pl[0].cards[H.CARD_ID.horde]=2;H.recomputeMods(G,0);ok(H.spellCost(G,0,0)===Math.round(110*.6),'Horde Mastery cuts cost');
}
{ // capture: loot, level and tower drop, Souls mode reset
  const G=mk();const c=own(G,1);const nb=G.adj[G.capIdx[1]][0].to,n=G.castles[nb];n.owner=1;n.lv=3;n.tl=2;n.mode=1;n.u=[5,0,0];n.size=5;
  const s0=G.pl[0].souls;H.capture(G,nb,0);ok(n.owner===0&&n.lv===2&&n.tl===1&&n.mode===0&&G.pl[0].souls===s0+Math.round(8*3),'capture: -1 level, -1 tower, mode reset, loot '+(G.pl[0].souls-s0));
}
{ // fair springs on ordinary maps and guarded
  let springs=0,unguarded=0;for(let k=0;k<12;k++){const G=mk(2+k%3,{seed:700+k*13,mt:k%8,ms:k%3});for(const c of G.castles)if(c.kind==='m'){springs++;if(c.size<H.SPRING_GUARD-5)unguarded++;}}
  ok(springs>=12,'maps get springs ('+springs+' in 12 games)');ok(unguarded===0,'springs are guarded');
}
{ // encode / decode round trip
  const A=mk(3,{seed:44});prep(A);own(A,0).mode=1;own(A,0).tl=2;own(A,1).path=3;H.drawResearch(A,0);run(A,30);A.pl[0].hz=A.gt+9;A.pl[0].hzf=1.25;const e=JSON.parse(JSON.stringify(H.encode(A)));
  const B=mk(3,{seed:44});H.decodeInto(B,e);
  ok(B.castles.every((c,i)=>c.owner===A.castles[i].owner&&c.lv===A.castles[i].lv&&c.mode===A.castles[i].mode&&c.tl===A.castles[i].tl&&c.path===A.castles[i].path),'castles survive encode/decode');
  ok(B.pl[0].offer&&A.pl[0].offer&&B.pl[0].offer.join()===A.pl[0].offer.join(),'offer survives');ok(B.pl[0].hz>B.gt&&near(B.pl[0].hzf,A.pl[0].hzf,0.01),'horde state survives');
  ok(near(B.pl[0].cd[0],B.gt+Math.max(0,Math.ceil(A.pl[0].cd[0]-A.gt)),1.01),'spell cooldowns survive');
}
console.log(fails?fails+' mechanics checks FAILED':'mechanics: all checks passed');
if(fails)process.exit(1);
