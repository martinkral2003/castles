// How do the bots use the systems? N games (4-6 players), averages per personality at the end of the game
const H=require(process.argv[2]||'../src/core.js');const N=+(process.env.N||24);
const A=H.PERS.map(()=>({n:0,earned:0,kill:0,mode:0,loot:0,cards:0,tl:0,paths:[0,0,0,0],lv:0,castles:0,spell:[0,0,0],lords:0,units:[0,0,0],kills:0,wins:0,hg:0}));let fin=0,unf=0;const mins=[];
for(let k=0;k<N;k++){const np=[4,5,6][k%3];const slots=[];for(let i=0;i<8;i++)slots.push(i<np?{k:'b',n:'B'+i,t:0,d:[1,2,0][(i+k)%3],pe:(i+k)%4}:{k:'x'});
 const G=H.newGame({seed:5100+k*37,slots,W:1000,H:1600,ms:1,sp:1,mt:k%8});let t=0;const ev={kill:{},mode:{},loot:{},spell:{}};
 while(!G.over&&t<2400){H.step(G,0.05);t+=0.05;
  for(const e of G.events){if(e.t==='soul'){const o=e.why===0?ev.kill:e.why===1?ev.mode:ev.loot;o[e.s]=(o[e.s]||0)+e.n;}else if(e.t==='spell'){(ev.spell[e.s]||(ev.spell[e.s]=[0,0,0]))[e.id]++;}}
  G.events.length=0;}
 if(G.over)fin++;else unf++;mins.push(t/60);
 for(let s=0;s<np;s++){const a=A[slots[s].pe],p=G.pl[s],my=G.castles.filter(c=>c.owner===s);a.n++;a.earned+=p.earned;a.kill+=ev.kill[s]||0;a.mode+=ev.mode[s]||0;a.loot+=ev.loot[s]||0;a.cards+=p.rn;a.tl+=my.reduce((x,c)=>x+(c.tl|0),0);
  for(const c of my)a.paths[c.path]++;a.lv+=my.reduce((x,c)=>x+c.lv,0);a.castles+=my.length;a.lords+=p.lh;a.kills+=p.kills;for(let i=0;i<3;i++)a.spell[i]+=(ev.spell[s]||[0,0,0])[i];
  for(const c of my)for(let i=0;i<3;i++)a.units[i]+=c.u[i];for(const x of G.sol)if(x.o===s&&x.u<3)a.units[x.u]++;
  if(G.winner==='S'+s){a.wins++;if(G.winBy==='wonder')a.hg++;}}
}
mins.sort((a,b)=>a-b);console.log('games',N,'finished',fin,'unfinished',unf,'median min',mins[Math.floor(N/2)].toFixed(1));
console.log('pers       n wins hg |  earned kill%  mode%  loot% | cards lords | castles avgLv towers | paths none/well/cit/spawn | spells horde/spy/fire | units min/les/gre | kills');
H.PERS.forEach((nm,i)=>{const a=A[i],n=Math.max(1,a.n),f=x=>(x/n).toFixed(1),pc=x=>(100*x/Math.max(1,a.earned)).toFixed(0)+'%';
 console.log(nm.padEnd(10),String(a.n).padStart(2),String(a.wins).padStart(3),String(a.hg).padStart(2),'|',f(a.earned).padStart(7),pc(a.kill).padStart(5),pc(a.mode).padStart(6),pc(a.loot).padStart(6),'|',f(a.cards).padStart(5),f(a.lords).padStart(5),'|',f(a.castles).padStart(7),(a.lv/Math.max(1,a.castles)).toFixed(1).padStart(5),f(a.tl).padStart(6),'|',a.paths.map(f).join('/').padStart(17),'|',a.spell.map(f).join('/').padStart(14),'|',a.units.map(f).join('/').padStart(14),'|',f(a.kills));});
