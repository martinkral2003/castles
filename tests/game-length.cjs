const H=require(process.argv[2]||'../src/core.js');let unf=0,mins=[];
for(let k=0;k<32;k++){const np=[4,6][k%2];const slots=[];for(let i=0;i<8;i++)slots.push(i<np?{k:'b',n:'B'+i,t:k>=16?(i%2)+1:0,d:[1,2,0][i%3],pe:i%4}:{k:'x'});
 const G=H.newGame({seed:6300+k*37,slots,W:1000,H:1600,ms:1,sp:1,mt:k%8});let t=0;while(!G.over&&t<2400){H.step(G,0.05);t+=0.05;G.events.length=0;}
 if(!G.over)unf++;mins.push(+(t/60).toFixed(1));}
mins.sort((a,b)=>a-b);console.log('32 games (4-6 players, all map types): unfinished',unf,'| median',mins[16],'min | 25th-75th',mins[8],'-',mins[24]);
