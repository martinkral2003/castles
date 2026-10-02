const H=require('../src/core.js');
const t0=Date.now();
for(let trial=0;trial<8;trial++){
 const np=[2,4,6,8][trial%4];
 const slots=[];for(let i=0;i<8;i++)slots.push(i<np?{k:'b',n:'B'+i,t:trial>=4?(i%2)+1:0,d:[1,2,0][i%3],pe:i%4}:{k:'x'});
 const G=H.newGame({seed:999+trial*131,slots,W:1000,H:1600,ms:1,sp:1,mt:trial%4});
 let t=0,maxS=0,maxEnc=0,units=[0,0,0,0];while(!G.over&&t<2400){H.step(G,0.05);t+=0.05;G.events.length=0;maxS=Math.max(maxS,G.sol.length);
  if(Math.round(t*20)%100===0){maxEnc=Math.max(maxEnc,JSON.stringify(H.encode(G)).length);for(const s of G.sol)units[s.u]++;}}
 let bad=G.castles.filter(c=>Math.abs(c.u.reduce((a,b)=>a+b,0)-c.size)>0.01||c.u.some(v=>v<-0.01)).length;
 console.log('np',np,'mt',G.mt,'over',G.over,G.winner,'t',(t/60).toFixed(1)+'m','maxSol',maxS,'enc',maxEnc,'unitMix',units.join('/'),'badGarrison',bad);
}
console.log('total s',(Date.now()-t0)/1000);
