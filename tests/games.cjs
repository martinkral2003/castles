const H=require('../src/core.js');
const t0=Date.now();let fail=0;
for(let trial=0;trial<8;trial++){
 const np=[2,4,6,8][trial%4];
 const slots=[];for(let i=0;i<8;i++)slots.push(i<np?{k:'b',n:'B'+i,t:trial>=4?(i%2)+1:0,d:[1,2,0][i%3],pe:i%4}:{k:'x'});
 const G=H.newGame({seed:999+trial*131,slots,W:1000,H:1600,ms:1,sp:1,mt:trial%4});
 let t=0,maxS=0,maxEnc=0,maxBase=0,units=[0,0,0,0],nan=0;
 while(!G.over&&t<2400){H.step(G,0.05);t+=0.05;G.events.length=0;maxS=Math.max(maxS,G.sol.length);
  if(Math.round(t*20)%100===0){const e=H.encode(G);maxEnc=Math.max(maxEnc,JSON.stringify(e).length);maxBase=Math.max(maxBase,JSON.stringify({...e,so:''}).length);
   for(const s of G.sol){units[s.u]++;if(!Number.isFinite(s.x+s.y+s.hp))nan++;}
   for(const c of G.castles)if(!Number.isFinite(c.size))nan++;for(const p of G.pl)if(!Number.isFinite(p.souls+p.inc))nan++;}}
 const bad=G.castles.filter(c=>Math.abs(c.u.reduce((a,b)=>a+b,0)-c.size)>0.01||c.u.some(v=>v<-0.01)).length;
 const ps=G.pl.slice(0,np);if(bad||nan)fail++;
 console.log('np',np,'mt',G.mt,'over',G.over,G.winner,G.winBy||'conquest','t',(t/60).toFixed(1)+'m','maxSol',maxS,'enc',maxEnc,'base',maxBase,'unitMix',units.join('/'),
  'cards',ps.map(p=>p.rn).join(','),'lords',ps.map(p=>p.lh).join(','),'earned',ps.map(p=>Math.round(p.earned)).join(','),'badGarrison',bad,'nan',nan);
}
console.log('total s',(Date.now()-t0)/1000);
if(fail)process.exit(1);
