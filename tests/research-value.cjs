const H=require('../src/core.js');
function match(flagB,n=40){let wa=0,wb=0,un=0,mins=0;
 for(let k=0;k<n;k++){const slots=[];for(let i=0;i<8;i++)slots.push({k:'x'});const sw=k%2;
  const A={k:'b',n:'A',t:0,d:2,pe:0},B={k:'b',n:'B',t:0,d:2,pe:0,...flagB};slots[sw]=A;slots[1-sw]=B;
  const G=H.newGame({seed:7700+k*41,slots,W:1000,H:1600,ms:k%3,sp:1,mt:k%4});let t=0;while(!G.over&&t<1800){H.step(G,0.05);t+=0.05;G.events.length=0;}mins+=t/60;
  if(!G.over)un++;else if(G.winner==='S'+sw)wa++;else wb++;}
 return `researching bot ${wa} - ${wb} handicapped bot (${un} unfinished), avg ${(mins/n).toFixed(1)} min`;}
console.log('No research at all:     ',match({noRes:true}));
console.log('No Army upgrades only:  ',match({noArmy:true}));
