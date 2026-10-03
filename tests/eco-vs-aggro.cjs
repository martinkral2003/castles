// Harvester bot (pe 3) vs Aggressive bot (pe 1), 1v1 on the first four map types and three sizes
const H=require(process.argv[2]||'../src/core.js');
const N=+(process.env.N||60),SAMPLE=30;const MAPS=H.MAPTYPES.slice(0,4),SIZES=['Small','Medium','Large'];
const res={eco:0,agg:0,unf:0,mins:[],bySize:[[0,0],[0,0],[0,0]],byMap:[[0,0],[0,0],[0,0],[0,0]],lead:{early:0,earlyEcoWin:0},wonder:{eco:0,agg:0}};
const series={eco:[],agg:[]};const fin={eco:{kill:0,lords:0,cards:0,spells:0,mode:0},agg:{kill:0,lords:0,cards:0,spells:0,mode:0}};
function add(arr,i,o){arr[i]=arr[i]||{n:0,castles:0,troops:0,souls:0,earned:0,levels:0,cards:0,spec:0};const a=arr[i];a.n++;for(const k in o)a[k]+=o[k];}
for(let k=0;k<N;k++){
  const slots=[];for(let i=0;i<8;i++)slots.push({k:'x'});
  const ecoSlot=k%2;slots[ecoSlot]={k:'b',n:'Eco',t:0,d:2,pe:3,noArmy:!!process.env.NOARMY,noRes:!!process.env.NORES};slots[1-ecoSlot]={k:'b',n:'Agg',t:0,d:2,pe:1,noArmy:!!process.env.NOARMY,noRes:!!process.env.NORES};
  const ms=k%3,mt=Math.floor(k/3)%4;
  const G=H.newGame({seed:9000+k*53,slots,W:1000,H:1600,ms,sp:1,mt});
  let t=0,next=0,si=0,earlyLead=null;const who=s=>s===ecoSlot?'eco':'agg';
  while(!G.over&&t<1800){H.step(G,0.05);t+=0.05;
    for(const e of G.events){if(e.t==='lord')fin[who(e.s)].lords++;else if(e.t==='spell')fin[who(e.s)].spells++;else if(e.t==='soul'&&e.why<2)fin[who(e.s)][e.why?'mode':'kill']+=e.n;}
    G.events.length=0;
    if(t>=next){next+=SAMPLE;
      for(const [w,s] of [['eco',ecoSlot],['agg',1-ecoSlot]]){const p=G.pl[s];
        const mine=G.castles.filter(c=>c.owner===s);
        add(series[w],si,{castles:mine.length,troops:G.tot[s],souls:p.souls,earned:p.earned,levels:mine.reduce((a,c)=>a+(c.lv-1)+(c.path?1:0),0),cards:p.rn,
          spec:mine.reduce((a,c)=>a+c.u[1]+c.u[2],0)+G.sol.filter(x=>x.o===s&&x.u>0&&x.u<3).length});}
      if(si===6){const ce=G.castles.filter(c=>c.owner===ecoSlot).length,ca=G.castles.filter(c=>c.owner===1-ecoSlot).length;earlyLead=ca>ce?'agg':ce>ca?'eco':'tie';}
      si++;}}
  res.mins.push(t/60);fin.eco.cards+=G.pl[ecoSlot].rn;fin.agg.cards+=G.pl[1-ecoSlot].rn;
  const w=!G.over?null:G.winner==='S'+ecoSlot?'eco':'agg';
  if(!w)res.unf++;else{res[w]++;res.bySize[ms][w==='eco'?0:1]++;res.byMap[mt][w==='eco'?0:1]++;if(G.winBy==='wonder')res.wonder[w]++;}
  if(earlyLead==='agg'){res.lead.early++;if(w==='eco')res.lead.earlyEcoWin++;}
}
const avg=a=>(a.reduce((x,y)=>x+y,0)/a.length);
console.log('RESULT eco',res.eco,'agg',res.agg,'unfinished',res.unf,'avg min',avg(res.mins).toFixed(1),'median',res.mins.sort((a,b)=>a-b)[Math.floor(N/2)].toFixed(1),'| Hellgate wins eco',res.wonder.eco,'agg',res.wonder.agg);
console.log('by size (eco-agg):',SIZES.map((s,i)=>s+' '+res.bySize[i].join('-')).join(', '));
console.log('by map (eco-agg):',MAPS.map((s,i)=>s+' '+res.byMap[i].join('-')).join(', '));
console.log('games where aggressive led on castles at 3:00:',res.lead.early,' of those eco still won:',res.lead.earlyEcoWin);
console.log('per game (eco/agg): cards',(fin.eco.cards/N).toFixed(1)+'/'+(fin.agg.cards/N).toFixed(1),'kill souls',(fin.eco.kill/N).toFixed(0)+'/'+(fin.agg.kill/N).toFixed(0),'lords',(fin.eco.lords/N).toFixed(1)+'/'+(fin.agg.lords/N).toFixed(1),
  'spells',(fin.eco.spells/N).toFixed(1)+'/'+(fin.agg.spells/N).toFixed(1),'Souls-mode souls',(fin.eco.mode/N).toFixed(0)+'/'+(fin.agg.mode/N).toFixed(0));
console.log('TIME castles(e/a) troops(e/a) earned(e/a) levels+paths(e/a) cards(e/a) specialists(e/a) [games alive]');
for(let i=0;i<Math.max(series.eco.length,series.agg.length);i++){const e=series.eco[i],a=series.agg[i];if(!e||e.n<6)break;
  const f=(o,k)=>(o[k]/o.n).toFixed(k==='castles'||k==='cards'?1:0);
  console.log(`${(i*SAMPLE/60).toFixed(1)}m  ${f(e,'castles')}/${f(a,'castles')}  ${f(e,'troops')}/${f(a,'troops')}  ${f(e,'earned')}/${f(a,'earned')}  ${f(e,'levels')}/${f(a,'levels')}  ${f(e,'cards')}/${f(a,'cards')}  ${f(e,'spec')}/${f(a,'spec')}  [${e.n}]`);}
