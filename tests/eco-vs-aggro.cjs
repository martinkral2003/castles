const H=require(process.argv[2]||'../src/core.js');
const N=60,SAMPLE=30;const MAPS=['River valley','Twin rivers','Islands','Highlands'],SIZES=['Small','Medium','Large'];
const res={eco:0,agg:0,unf:0,mins:[],bySize:[[0,0],[0,0],[0,0]],byMap:[[0,0],[0,0],[0,0],[0,0]],lead:{early:0,earlyEcoWin:0}};
const series={eco:[],agg:[]};// per sample index: sums
function add(arr,i,o){arr[i]=arr[i]||{n:0,castles:0,troops:0,gold:0,earned:0,blds:0,res:0,spec:0};const a=arr[i];a.n++;for(const k in o)a[k]+=o[k];}
for(let k=0;k<N;k++){
  const slots=[];for(let i=0;i<8;i++)slots.push({k:'x'});
  const ecoSlot=k%2;slots[ecoSlot]={k:'b',n:'Eco',t:0,d:2,pe:3,noArmy:!!process.env.NOARMY,noRes:!!process.env.NORES};slots[1-ecoSlot]={k:'b',n:'Agg',t:0,d:2,pe:1,noArmy:!!process.env.NOARMY,noRes:!!process.env.NORES};
  const ms=k%3,mt=Math.floor(k/3)%4;
  const G=H.newGame({seed:9000+k*53,slots,W:1000,H:1600,ms,sp:1,mt});
  let t=0,next=0,si=0,earlyLead=null;
  while(!G.over&&t<1800){H.step(G,0.05);t+=0.05;G.events.length=0;
    if(t>=next){next+=SAMPLE;
      for(const [who,s] of [['eco',ecoSlot],['agg',1-ecoSlot]]){const p=G.pl[s];
        const mine=G.castles.filter(c=>c.owner===s);const troops=mine.reduce((a,c)=>a+c.size,0)+G.sol.filter(x=>x.o===s).length;
        add(series[who],si,{castles:mine.length,troops,gold:p.gold,earned:p.earned,blds:mine.reduce((a,c)=>a+c.b.length+(c.lv-1),0),res:p.res.toString(2).split('').filter(x=>x==='1').length,
          spec:mine.reduce((a,c)=>a+c.u[1]+c.u[2]+c.u[3],0)+G.sol.filter(x=>x.o===s&&x.u>0).length});}
      if(si===6){const ce=G.castles.filter(c=>c.owner===ecoSlot).length,ca=G.castles.filter(c=>c.owner===1-ecoSlot).length;earlyLead=ca>ce?'agg':ce>ca?'eco':'tie';}
      si++;}}
  res.mins.push(t/60);
  const w=!G.over?null:G.winner==='S'+ecoSlot?'eco':'agg';
  if(!w)res.unf++;else{res[w]++;res.bySize[ms][w==='eco'?0:1]++;res.byMap[mt][w==='eco'?0:1]++;}
  if(earlyLead==='agg'){res.lead.early++;if(w==='eco')res.lead.earlyEcoWin++;}
}
const avg=a=>(a.reduce((x,y)=>x+y,0)/a.length);
console.log('RESULT eco',res.eco,'agg',res.agg,'unfinished',res.unf,'avg min',avg(res.mins).toFixed(1),'median',res.mins.sort((a,b)=>a-b)[Math.floor(N/2)].toFixed(1));
console.log('by size (eco-agg):',SIZES.map((s,i)=>s+' '+res.bySize[i].join('-')).join(', '));
console.log('by map (eco-agg):',MAPS.map((s,i)=>s+' '+res.byMap[i].join('-')).join(', '));
console.log('games where aggressive led on castles at 3:00:',res.lead.early,' of those eco still won:',res.lead.earlyEcoWin);
console.log('TIME castles(e/a) troops(e/a) earned(e/a) upgrades(e/a) research(e/a) specialists(e/a) [games alive]');
for(let i=0;i<Math.max(series.eco.length,series.agg.length);i++){const e=series.eco[i],a=series.agg[i];if(!e||e.n<6)break;
  const f=(o,k)=>(o[k]/o.n).toFixed(k==='castles'||k==='res'?1:0);
  console.log(`${(i*SAMPLE/60).toFixed(1)}m  ${f(e,'castles')}/${f(a,'castles')}  ${f(e,'troops')}/${f(a,'troops')}  ${f(e,'earned')}/${f(a,'earned')}  ${f(e,'blds')}/${f(a,'blds')}  ${f(e,'res')}/${f(a,'res')}  ${f(e,'spec')}/${f(a,'spec')}  [${e.n}]`);}
console.log('JSON',JSON.stringify({eco:series.eco.map(o=>o&&{n:o.n,c:+(o.castles/o.n).toFixed(2),t:Math.round(o.troops/o.n),g:Math.round(o.earned/o.n)}),agg:series.agg.map(o=>o&&{n:o.n,c:+(o.castles/o.n).toFixed(2),t:Math.round(o.troops/o.n),g:Math.round(o.earned/o.n)})}));
