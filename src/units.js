// ===== Brimfall unit figures (minion, lesser demon, greater demon, lord), pilgrims, corpses =====
// Each figure is painted once per (scale level, type, colour, look) into an outlined sprite strip (8 walk + 6 attack frames,
// facing right, foot-anchored) and blitted per unit with mirroring. Shadows, the lord's aura and banner, bearer flags and
// pilgrim soul-wisps are cheap per-frame overlays. Public: drawUnit, drawCorpse, unitTop, warmUnits, SKIN, UNITART.
const SKIN=[['#7a2c24','#a84a3a','#38120e'],['#3e3638','#686062','#181214'],['#56602f','#848f48','#222a10'],
  ['#8a5826','#bd8644','#3e2208'],['#4c305c','#7a5590','#1e1028'],['#5e2a2e','#8c4448','#260a0e']];
const UNIT_TOP=[26,32,47,58];
function unitTop(u){return UNIT_TOP[u|0]||26;}
const UNITART=(()=>{
  const TAU=Math.PI*2,LVR=[.5,1,2,4],NF=14,OUT='rgba(14,5,4,.95)';
  const CW=[30,44,64,56],CH=[32,40,58,62],AX=[11,16,34,22],AY=[29,36,56,59];
  const WS=[1,.8,.75,.62],AS=[.72,.45,.55,.42];
  const JIT=[1,.95,1.05,.98,1.03,.97,1.06,.94,1.01,.96,1.04,.99,1.02,.95,1.05,1.07];
  // look per type and bucket: [skin, horn, weapon, crest, pilgrim]
  const LOOK=[[[0,0,0],[1,1,1],[2,2,0],[3,3,1],[4,0,0,1],[0,0,2,0,1]],
    [[1,0,0],[0,1,1],[5,2,0],[3,3,1],[4,0,1,1]],
    [[0,0],[1,1],[4,2],[5,0],[0,1,0,1]],[[5,0]]];
  const mk=(w,h)=>{let c;if(typeof document!=='undefined'){c=document.createElement('canvas');c.width=w;c.height=h;}else c=new OffscreenCanvas(w,h);return c;};
  const RGB=h=>{h=String(h||'#888888');if(h[0]!=='#'){const m=h.match(/\d+/g)||[136,136,136];return[+m[0],+m[1],+m[2]];}
    if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];const n=parseInt(h.slice(1,7),16);return[n>>16&255,n>>8&255,n&255];};
  const MX=(a,b,t)=>[a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];
  const CS=(c,a=1)=>a>=1?'rgb('+c[0]+','+c[1]+','+c[2]+')':'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
  const BLK=[14,6,8],WHT=[255,250,236],FIRE=[255,214,120],SOUL=[170,222,255];
  function pal(col){const c=RGB(col);return{a:c,c:CS(c),hi:CS(MX(c,WHT,.42)),lo:CS(MX(c,BLK,.36)),dk:CS(MX(c,BLK,.6)),gl:CS(MX(c,WHT,.72)),
    wg:CS(MX(c,[30,12,16],.56)),wd:CS(MX(c,[20,8,10],.74)),fl:CS(MX(c,FIRE,.5))};}
  function skin(s){const b=RGB(s[0]),l=RGB(s[1]),d=RGB(s[2]);return{b:s[0],l:s[1],d:s[2],fb:CS(MX(b,d,.45)),fl:CS(MX(l,b,.55)),fd:CS(MX(d,BLK,.3))};}
  const far=S=>({b:S.fb,l:S.fl,d:S.fd});
  const IRON={b:'#3a3340',l:'#6c6274',d:'#16121a',fb:'#2a2430',fl:'#4a4252',fd:'#0e0b10'};
  // ---------- path helpers (art units) ----------
  function pl(x,p){x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);x.closePath();}
  function sp(x,p,cl){const n=p.length>>1;x.moveTo(p[0],p[1]);
    for(let i=0;i<(cl?n:n-1);i++){const a=cl?(i-1+n)%n:Math.max(0,i-1),b=cl?(i+1)%n:i+1,c=cl?(i+2)%n:Math.min(n-1,i+2);
      x.bezierCurveTo(p[i*2]+(p[b*2]-p[a*2])/6,p[i*2+1]+(p[b*2+1]-p[a*2+1])/6,p[b*2]-(p[c*2]-p[i*2])/6,p[b*2+1]-(p[c*2+1]-p[i*2+1])/6,p[b*2],p[b*2+1]);}
    if(cl)x.closePath();}
  function cr(p,m=4){const n=p.length>>1,o=[p[0],p[1]];for(let i=0;i<n-1;i++){const a=Math.max(0,i-1),b=i+1,c=Math.min(n-1,i+2);
    for(let j=1;j<=m;j++){const t=j/m,t2=t*t,t3=t2*t;for(let d=0;d<2;d++){const P0=p[a*2+d],P1=p[i*2+d],P2=p[b*2+d],P3=p[c*2+d];
      o.push(.5*(2*P1+(P2-P0)*t+(2*P0-5*P1+4*P2-P3)*t2+(3*P1-P0-3*P2+P3)*t3));}}}return o;}
  function taper(x,p,w0,w1){const n=p.length>>1,L=[],R=[];
    for(let i=0;i<n;i++){const a=i?i-1:0,b=i<n-1?i+1:n-1,dx=p[b*2]-p[a*2],dy=p[b*2+1]-p[a*2+1],l=Math.hypot(dx,dy)||1,w=(w0+(w1-w0)*i/(n-1||1))/2;
      L.push(p[i*2]-dy/l*w,p[i*2+1]+dx/l*w);R.push(p[i*2]+dy/l*w,p[i*2+1]-dx/l*w);}
    x.beginPath();x.moveTo(L[0],L[1]);for(let i=2;i<L.length;i+=2)x.lineTo(L[i],L[i+1]);for(let i=R.length-2;i>=0;i-=2)x.lineTo(R[i],R[i+1]);x.closePath();}
  function limb(x,ax,ay,bx,by,wa,wb){const an=Math.atan2(by-ay,bx-ax),h=Math.PI/2;x.beginPath();x.arc(ax,ay,wa,an+h,an-h);x.arc(bx,by,wb,an-h,an+h);x.closePath();}
  function lin(x,x0,y0,x1,y1,a){const g=x.createLinearGradient(x0,y0,x1,y1);for(let i=0;i<a.length;i+=2)g.addColorStop(a[i],a[i+1]);return g;}
  function fo(x,f,lw=.5){x.fillStyle=f;x.fill();if(lw){x.lineWidth=lw;x.strokeStyle=OUT;x.lineJoin='round';x.stroke();}}
  function glow(x,cx,cy,r,c,a){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,CS(c,a));g.addColorStop(.45,CS(c,a*.45));g.addColorStop(1,CS(c,0));x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,TAU);x.fill();}
  function swing(q){q-=Math.floor(q);return q<.35?-Math.sin(q/.35*Math.PI/2):q<.5?-1+2*(q-.35)/.15:q<.7?1:1-(q-.7)/.3;}
  function arm(x,sx,sy,hx,hy,w,S,bend){const dx=hx-sx,dy=hy-sy,L=Math.hypot(dx,dy)||1,ex=sx+dx*.5-dy/L*bend,ey=sy+dy*.5+dx/L*bend;
    const f=lin(x,sx-w,sy-w,hx+w,hy+w,[0,S.l,.55,S.b,1,S.d]);limb(x,sx,sy,ex,ey,w,w*.8);fo(x,f);limb(x,ex,ey,hx,hy,w*.8,w*.62);fo(x,f);
    x.beginPath();x.arc(hx,hy,w*.72,0,TAU);fo(x,f);}
  function leg(x,hx,hy,fx,fy,w,S,hoof){const dx=fx-hx,dy=fy-hy,L=Math.hypot(dx,dy);const kx=hx+dx*.36+L*.17,ky=hy+dy*.4,jx=hx+dx*.74-L*.12,jy=hy+dy*.8;
    const f=lin(x,hx-w,hy,fx+w,fy,[0,S.l,.5,S.b,1,S.d]);
    limb(x,jx,jy,fx,fy,w*.5,w*.38);fo(x,f);limb(x,kx,ky,jx,jy,w*.66,w*.5);fo(x,f);limb(x,hx,hy,kx,ky,w,w*.68);fo(x,f);
    x.beginPath();pl(x,[fx-w*.45,fy-w*.5,fx+w*.8,fy-w*.32,fx+w*1.0,fy+.15,fx-w*.55,fy+.15]);fo(x,hoof,.4);}
  function horn(x,p,w,c0,c1,c2){const q=cr(p,5),n=q.length;taper(x,q,w,.14);fo(x,lin(x,q[0],q[1],q[n-2],q[n-1],[0,c0,.6,c1,1,c2]),.4);}
  function flame(g,x0,y0,h,w,C,a=1){g.globalAlpha=a;g.fillStyle=C.c;g.beginPath();g.moveTo(x0-w,y0);g.quadraticCurveTo(x0-w*.9,y0-h*.55,x0+w*.15,y0-h);
    g.quadraticCurveTo(x0+w*.8,y0-h*.45,x0+w,y0);g.closePath();g.fill();g.fillStyle=C.fl;g.beginPath();g.moveTo(x0-w*.55,y0);g.quadraticCurveTo(x0-w*.4,y0-h*.45,x0+w*.1,y0-h*.68);
    g.quadraticCurveTo(x0+w*.45,y0-h*.3,x0+w*.55,y0);g.closePath();g.fill();g.globalAlpha=1;}
  // ---------- weapons ----------
  function fork(x,hx,hy,a){const ux=Math.cos(a),uy=Math.sin(a),bx=hx-ux*4,by=hy-uy*4,tx=hx+ux*9.6,ty=hy+uy*9.6;
    limb(x,bx,by,tx,ty,.42,.38);fo(x,lin(x,bx,by,tx,ty,[0,'#3a2416',1,'#7a5434']),.35);
    x.save();x.translate(tx,ty);x.rotate(a);x.beginPath();pl(x,[-.4,-1.8,.6,-1.8,.6,1.8,-.4,1.8]);fo(x,'#55525a',.3);
    for(const yy of[-1.5,0,1.5]){x.beginPath();pl(x,[.4,yy-.32,3.2,yy-.1,3.8,yy,3.2,yy+.1,.4,yy+.32]);fo(x,lin(x,0,0,3.8,0,[0,'#6a666e',1,'#e2ded8']),.25);}x.restore();}
  function club(x,hx,hy,a){x.save();x.translate(hx,hy);x.rotate(a);x.beginPath();x.moveTo(-1.6,-.45);x.lineTo(4.6,-.7);x.quadraticCurveTo(8.8,-2,9,0);
    x.quadraticCurveTo(8.8,2,4.6,.7);x.lineTo(-1.6,.45);x.closePath();fo(x,lin(x,0,-2,0,2,[0,'#efe2c2',.5,'#bba783',1,'#6e5e44']),.4);
    for(const[sx,sy,d]of[[6.2,-1.1,-1],[7.9,-1.5,-1],[7.0,1.3,1]]){x.beginPath();pl(x,[sx-.45,sy,sx+.45,sy,sx+.1,sy+d*1.5]);fo(x,'#a29d96',.25);}x.restore();}
  function bclub(x,hx,hy,a){x.save();x.translate(hx,hy);x.rotate(a);x.beginPath();x.moveTo(-2,-.7);x.lineTo(5.6,-1.2);x.quadraticCurveTo(11.6,-3.3,11.8,0);
    x.quadraticCurveTo(11.6,3.3,5.6,1.2);x.lineTo(-2,.7);x.closePath();fo(x,lin(x,0,-3,0,3,[0,'#a8744a',.5,'#6a4228',1,'#341e12']),.5);
    x.strokeStyle='#2a2a2e';x.lineWidth=.9;x.beginPath();x.moveTo(6.4,-1.6);x.lineTo(6.4,1.6);x.stroke();
    for(const[sx,sy,dx,dy]of[[8.2,-2,0,-1],[10.2,-2.5,0,-1],[9.2,2.3,0,1],[11.2,1.8,.3,1],[11.8,0,1,0]]){x.beginPath();
      pl(x,[sx-.5*Math.abs(dy),sy-.5*Math.abs(dx),sx+.5*Math.abs(dy),sy+.5*Math.abs(dx),sx+dx*1.8,sy+dy*1.8]);fo(x,lin(x,sx,sy,sx+dx*1.8,sy+dy*1.8,[0,'#5a565c',1,'#d8d4d8']),.25);}x.restore();}
  function axe(x,hx,hy,a){x.save();x.translate(hx,hy);x.rotate(a);limb(x,-2.4,0,10.6,0,.62,.55);fo(x,lin(x,0,-1,0,1,[0,'#8a5c38',1,'#3a2414']),.4);
    x.beginPath();x.moveTo(6.8,-.5);x.lineTo(6.6,-2.8);x.quadraticCurveTo(8.2,-6.6,12.2,-6.8);x.quadraticCurveTo(11.2,-3.4,11.6,-.5);x.closePath();
    fo(x,lin(x,8,-6.8,10,0,[0,'#f0ece4',.22,'#a29ea4',1,'#3a3640']),.45);x.beginPath();pl(x,[8.2,.4,10.2,.4,9.4,3.0]);fo(x,'#5a565c',.35);x.restore();}
  function blade(x,g,hx,hy,a,len,w,C,ph,big){x.save();x.translate(hx,hy);x.rotate(a);
    limb(x,-2.4,0,0,0,.5,.5);fo(x,'#2a1c18',.3);x.beginPath();x.arc(-2.7,0,.7,0,TAU);fo(x,big?'#e0b04a':'#8a7a5a',.3);
    x.beginPath();pl(x,[.1,-2.2*w,1.0,-1.6*w,1.0,1.6*w,.1,2.2*w,-.4,0]);fo(x,big?'#c8963a':'#4a4048',.35);
    x.beginPath();x.moveTo(1,-w*.55);x.quadraticCurveTo(len*.62,-w*.8,len,-w*.05);x.quadraticCurveTo(len*.6,w*.5,1,w*.55);x.closePath();
    fo(x,lin(x,0,-w,0,w,[0,'#e6e0e6',.35,'#6a6270',1,'#221c28']),.4);
    x.strokeStyle=C.hi;x.lineWidth=.35;x.beginPath();x.moveTo(1.6,-w*.1);x.quadraticCurveTo(len*.6,-w*.32,len*.92,-w*.12);x.stroke();x.restore();
    const ux=Math.cos(a),uy=Math.sin(a),n=big?7:5;
    for(let i=0;i<n;i++){const d=2+(len-2)*(i+.5)/n,fx=hx+ux*d,fy=hy+uy*d,h=(big?3.6:2.8)*(1-.35*i/n)*(1+.35*Math.sin(ph*2+i*1.9)),ww=(big?1.3:1.05)*(1-.3*i/n);
      flame(g,fx+Math.sin(ph*2+i)*.3,fy+.4,h,ww,C,.92);}
    glow(g,hx+ux*len*.55,hy+uy*len*.55-1,len*.55,C.a,.32);}
  // ---------- the four figures (facing right, foot at 0,0, y up negative) ----------
  const HN=[[[2.8,-19.9,2.6,-22.4,1,-24.4],[.4,-19.6,-.4,-22.4,-3.2,-24],1.8],[[3,-20,3.4,-22.6,3,-25],[.7,-19.8,.6,-22.6,-.2,-25.2],1.7],
    [[3,-19.8,2,-21.6,.6,-21.4],[.2,-19.2,-2.4,-21.2,-3.4,-18.6,-2,-17],2],[[3,-19.9,3.8,-22.4,5.6,-23.6],[.6,-19.7,.2,-22.6,2.2,-24.6],1.7]];
  function imp(x,g,o,ph,md){const S=o.sk,C=o.pc,P=o.pil,s=Math.sin(ph),c=Math.cos(ph),SD=far(S);
    let bob=0,lean=.1,nod=0,la=0,sw=0;
    if(!md){bob=1.1*(.5+.5*Math.cos(2*ph));la=s*(P?.7:1);lean=P?.24:.1;nod=s*.04+(P?.3:0);}else{sw=swing(ph/TAU);lean=.05+sw*.16;nod=-sw*.08;}
    const nf=md?[2.4+Math.max(0,sw)*.8,0]:[.9+la*2.6,-Math.max(0,c)*1.5],ff=md?[-2.2,0]:[-.6-la*2.6,-Math.max(0,-c)*1.5];
    const up=f=>{for(const q of[x,g]){q.save();q.translate(0,-bob-7.2);q.rotate(lean);q.translate(0,7.2);}f();x.restore();g.restore();};
    up(()=>{const p=cr([-2.2,-7.9,-4.8,-6.6+s*.5,-7.2,-7.8-s*.3,-8,-10.4+s*.7],4);taper(x,p,1.2,.45);fo(x,lin(x,-8,-11,-2,-6,[0,S.b,1,S.d]),.45);
      const n=p.length,ex=p[n-2],ey=p[n-1],ax=ex-p[n-4],ay=ey-p[n-3],l=Math.hypot(ax,ay)||1,ux=ax/l,uy=ay/l;
      x.beginPath();pl(x,[ex+ux*2.2,ey+uy*2.2,ex-uy*1.3,ey+ux*1.3,ex+ux*.3,ey+uy*.3,ex+uy*1.3,ey-ux*1.3]);fo(x,S.d,.45);
      if(P)arm(x,.2,-12.4,2.8,-10,1.05,SD,-.8);else if(md)arm(x,.2,-12.4,-1.4-sw*1.6,-9.2,1.05,SD,.8);else arm(x,.2,-12.4,-1.2-s*2.2,-8.6,1.05,SD,.9);});
    leg(x,-.8,-7.4-bob,ff[0],ff[1],1.75,SD,'#1a1010');
    up(()=>{const w1=Math.sin(ph+1)*.5,w2=Math.sin(ph+2.2)*.9;x.beginPath();sp(x,[-2.6,-8.7,-5.4,-8.6+w1,-7.6,-7.4+w2,-6.2,-6.8+w2*.8,-4.8,-7.3+w1,-2.6,-7.7],0);x.closePath();
      fo(x,lin(x,-8,-9,-3,-7,[0,C.lo,1,C.c]),.45);x.beginPath();pl(x,[-3,-8.4,-1,-8.4,-1.4,-4.8,-2.2,-5.6,-3,-4.6,-3.6,-5.8]);fo(x,C.lo,.45);
      x.beginPath();sp(x,[-2.4,-7,-3,-9.8,-2,-12.6,.6,-13.6,2.6,-12.8,3.4,-10.2,2.8,-7.8,.2,-6.6],1);fo(x,lin(x,-3,-13.6,3.4,-6.6,[0,S.l,.55,S.b,1,S.d]),.55);
      x.fillStyle='rgba(255,220,180,.13)';x.beginPath();x.ellipse(1.9,-9.6,1.2,1.9,-.2,0,TAU);x.fill();
      x.beginPath();pl(x,[.8,-13.4,2.1,-13.1,-1.3,-8.3,-2.6,-8.6]);fo(x,lin(x,0,-13,0,-8,[0,C.hi,1,C.c]),.4);
      if(P){glow(g,1.4,-10.4,4.2,SOUL,.5);glow(g,1.4,-10.4,1.4,[240,250,255],.9);}});
    leg(x,.6,-7.2-bob,nf[0],nf[1],1.85,S,'#1a1010');
    up(()=>{x.beginPath();pl(x,[-1.2,-8.4,3.2,-8.2,3.5,-5.2,2.7,-4,2,-5,1.2,-3.5,.4,-4.8,-.5,-3.9,-1.3,-5.4]);fo(x,lin(x,0,-8.4,0,-3.5,[0,C.hi,.45,C.c,1,C.lo]),.45);
      limb(x,-2.9,-8.5,3.1,-8.2,.7,.7);fo(x,'#2a1912',.35);
      for(const q of[x,g]){q.save();q.translate(1.2,-13);q.rotate(nod);q.translate(-1.2,13);}
      const h=HN[o.horn];horn(x,h[0],h[2]*.8,'#241815','#3a2a24',C.c);
      x.beginPath();pl(x,[-.6,-17.6,-6.2,-20.2,-4,-18,-5.4,-16.6,-.8,-15.6]);fo(x,lin(x,-6,-20,-1,-16,[0,S.d,1,S.b]),.45);
      x.beginPath();sp(x,[-2.2,-16.4,-1.5,-19,.8,-20.4,3.4,-20,5.3,-18.2,6.1,-16.2,5.5,-14.6,3.6,-13.3,1,-13.1,-1.2,-14.3],1);fo(x,lin(x,-2,-20.4,6,-13,[0,S.l,.5,S.b,1,S.d]),.55);
      x.beginPath();pl(x,[1.6,-18.1,5.7,-17.3,5.5,-16.7,1.9,-17.3]);x.fillStyle=S.d;x.fill();
      glow(g,3.8,-16.5,2.8,P?SOUL:C.a,.6);x.fillStyle=P?'#e8f8ff':C.gl;x.beginPath();pl(x,[2.3,-17,4.5,-16.4,2.6,-15.8]);x.fill();x.beginPath();pl(x,[5,-16.5,5.9,-16.2,5,-15.9]);x.fill();
      x.beginPath();x.moveTo(2.8,-14.6);x.quadraticCurveTo(4.3,-13.9,5.8,-15);x.lineWidth=.45;x.strokeStyle=OUT;x.stroke();
      x.fillStyle='#f2e8d8';x.beginPath();pl(x,[3.5,-14.45,3.95,-14.3,3.7,-13.75]);x.fill();x.beginPath();pl(x,[4.75,-14.35,5.15,-14.45,4.95,-13.85]);x.fill();
      horn(x,h[1],h[2],'#3a2a24','#6a5244',C.hi);
      if(o.crest){for(let i=0;i<3;i++){const bx=-.4+i*1.5,by=-19.6-i*.25;taper(x,[bx,by,bx-1.2,by-2.4],1.1,.1);fo(x,'#2a1c18',.3);flame(g,bx-.6,by-.6,3.4-i*.3,1,C,.95);}}
      x.restore();g.restore();
      if(P){arm(x,1.6,-12.2,3.2,-10.4,1.1,S,-.9);return;}
      let hx,hy,a;
      if(o.wpn===0){if(md){hx=4+sw*2.4;hy=-10.2+Math.max(0,sw)*.4;a=sw>0?-.62+sw*.2:-.62;}else{hx=4.4+s*.3;hy=-9.8;a=-1.18+s*.05;}fork(x,hx,hy,a);}
      else{if(md){hx=3.2+sw*1.4;hy=-11-Math.min(0,sw)*1.6;a=sw<0?-2.15+sw*.55:-2.15+sw*2.45;}else{hx=3;hy=-10.6+s*.15;a=-2.15;}club(x,hx,hy,a);}
      arm(x,1.6,-12.2,hx,hy,1.1,S,.9);});}
  const HB=[[[8.6,-24.2,8,-26.8,9.8,-29,12,-29.4],[6.6,-23.8,4.2,-26.2,5,-29.4,8,-30.6],2.5],[[8.6,-24.4,8.2,-26.4,9.6,-27],[6.2,-23.6,3.4,-24.8,2.4,-22,3.8,-19.6,5.4,-20.4],2.7],
    [[8.4,-24.4,7.6,-28.4,6,-31.4],[6.4,-24,4.6,-28,2.6,-31],2.3],[[9,-24.2,10.4,-27.2,12.6,-28],[6.8,-24,6.4,-27.6,8.2,-30.2],2.4]];
  function brute(x,g,o,ph,md){const S=o.sk,C=o.pc,s=Math.sin(ph),c=Math.cos(ph),SD=far(S);
    let bob=0,lean=.12,nod=0,la=0,sw=0;if(!md){bob=.9*(.5+.5*Math.cos(2*ph));la=s;nod=s*.03;}else{sw=swing(ph/TAU);lean=.08+sw*.14;nod=sw*.05;}
    const H=-10.6,nf=md?[3.4+Math.max(0,sw)*1.2,0]:[1.2+la*3.4,-Math.max(0,c)*1.8],ff=md?[-3.2,0]:[-1.4-la*3.4,-Math.max(0,-c)*1.8];
    const up=f=>{for(const q of[x,g]){q.save();q.translate(0,-bob+H);q.rotate(lean);q.translate(0,-H);}f();x.restore();g.restore();};
    up(()=>arm(x,-1.8,-20.8,md?-1.6-sw*1.4:-1.8-s*2.6,md?-12.6:-11.8,2.5,SD,1.1));
    leg(x,-1.6,H-.4-bob,ff[0],ff[1],3.3,SD,'#140c0b');
    up(()=>{x.beginPath();sp(x,[-5.4,-21.6,-4.4,-24.4,-1.4,-25.2,.4,-23,-1.6,-21],1);fo(x,lin(x,-5,-25,0,-21,[0,C.lo,1,C.dk]),.5);
      x.beginPath();pl(x,[-4.6,-11,-1.4,-11,-1.8,-6.8,-3,-7.8,-4.2,-6.6,-5,-8]);fo(x,C.lo,.45);
      for(const[bx,by,tx,ty]of[[-5.2,-16.2,-7.4,-17.6],[-5.3,-19.4,-7.4,-21.4],[-4,-22.6,-5.4,-25.2]]){taper(x,[bx,by,tx,ty],1.4,.1);fo(x,lin(x,bx,by,tx,ty,[0,'#4a3a32',1,'#cbbd9c']),.35);}
      x.beginPath();sp(x,[-4.4,-10.4,-5.6,-14.6,-5.6,-19.6,-3.6,-23.8,.4,-25.4,4.4,-24.2,7,-20.6,7.2,-16,5.6,-11.8,2,-9.8,-1.8,-9.4],1);fo(x,lin(x,-5.6,-25.4,7.2,-9.4,[0,S.l,.5,S.b,1,S.d]),.6);
      x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=.45;for(let i=0;i<3;i++){x.beginPath();x.moveTo(3.2,-13-i*2.2);x.quadraticCurveTo(5.4,-12.4-i*2.2,6.6,-13.6-i*2.2);x.stroke();}
      x.fillStyle='rgba(255,215,170,.12)';x.beginPath();x.ellipse(4.6,-15.2,2,3.6,-.15,0,TAU);x.fill();});
    leg(x,.8,H-bob,nf[0],nf[1],3.5,S,'#140c0b');
    up(()=>{x.beginPath();pl(x,[.4,-11,5.4,-11.2,5.6,-7.4,4.6,-6,3.8,-7.2,2.8,-5.6,1.8,-7,.8,-6,.2,-7.6]);fo(x,lin(x,0,-11,0,-5.6,[0,C.hi,.45,C.c,1,C.lo]),.45);
      limb(x,-4.8,-11.4,5.8,-11.2,.85,.85);fo(x,'#2a1912',.4);x.beginPath();x.arc(4.9,-11.2,1.1,0,TAU);fo(x,'#d9ccb0',.35);
      x.fillStyle=OUT;x.fillRect(4.4,-11.5,.38,.38);x.fillRect(5.05,-11.5,.38,.38);
      for(const q of[x,g]){q.save();q.translate(5.4,-21);q.rotate(nod);q.translate(-5.4,21);}
      const h=HB[o.horn];horn(x,h[0],h[2]*.8,'#1e1412','#3a2a24',C.c);
      x.beginPath();sp(x,[4.6,-21.6,5.4,-24,7.8,-24.8,10,-23.4,11,-21.4,10.6,-19.4,8.8,-18.2,6.2,-18.6],1);fo(x,lin(x,4.6,-24.8,11,-18.2,[0,S.l,.5,S.b,1,S.d]),.55);
      x.beginPath();pl(x,[6.6,-22.9,10.9,-22.1,10.7,-21.3,6.8,-21.9]);x.fillStyle=S.d;x.fill();
      glow(g,9,-21.2,3,C.a,.6);x.fillStyle=C.gl;x.beginPath();pl(x,[7.8,-21.7,9.5,-21.15,7.9,-20.65]);x.fill();x.beginPath();pl(x,[10,-21.25,10.75,-21,10,-20.6]);x.fill();
      x.beginPath();x.moveTo(8.2,-19.5);x.lineTo(10.9,-19.9);x.lineWidth=.5;x.strokeStyle=OUT;x.stroke();
      x.fillStyle='#efe4cc';x.beginPath();pl(x,[8.8,-19.5,9.5,-19.6,9.2,-21]);x.fill();x.beginPath();pl(x,[10.1,-19.7,10.6,-19.8,10.4,-20.8]);x.fill();
      horn(x,h[1],h[2],'#3a2a24','#6a5244',C.hi);
      if(o.crest){for(let i=0;i<3;i++){const bx=5.6+i*1.6,by=-24.2-i*.2;flame(g,bx,by,4-i*.4,1.2,C,.95);}}
      x.restore();g.restore();
      let hx,hy,a;
      if(md){hx=5.2+sw*1.6;hy=-14.2-Math.min(0,sw)*5+Math.max(0,sw)*1.4;a=sw<0?-2+sw*.9:-2+sw*2.5;}else if(o.wpn===0){hx=5;hy=-14.6+s*.2;a=-2.05;}else{hx=6.6;hy=-11.4+s*.2;a=.55;}
      if(o.wpn===0)bclub(x,hx,hy,a);else axe(x,hx,hy,a);
      arm(x,2.6,-20.4,hx,hy,2.9,S,md&&sw<0?-1:1.2);
      x.beginPath();sp(x,[-1.6,-21,-.8,-23.6,2,-24.8,5.2,-24,6.6,-21.6,5.6,-19.4,2.4,-18.6,-.6,-19.2],1);fo(x,lin(x,-1.6,-24.8,6.6,-18.6,[0,C.hi,.45,C.c,1,C.dk]),.6);
      x.strokeStyle='rgba(20,10,10,.6)';x.lineWidth=.7;x.beginPath();x.moveTo(-1,-19.8);x.quadraticCurveTo(2.4,-18.2,5.9,-19.7);x.stroke();
      x.fillStyle='#e8d8b0';for(const[rx,ry]of[[.6,-20],[2.6,-19.5],[4.6,-19.9]]){x.beginPath();x.arc(rx,ry,.32,0,TAU);x.fill();}
      for(const[bx,by,tx,ty]of[[.4,-23.4,-1.2,-26.6],[2.6,-24.6,2,-28],[4.8,-24,5.4,-27]]){taper(x,[bx,by,tx,ty],1.5,.1);fo(x,lin(x,bx,by,tx,ty,[0,'#2e2a2e',1,'#b8b2b6']),.35);}});}
  const HG=[[[3.2,-40.2,1.6,-43.8,-1.6,-45.4,-4.6,-45],[1.4,-39.6,-1.8,-42.6,-5.4,-43.2,-8.4,-41.6],2.3],[[3.4,-40.2,3,-44.4,1.8,-47.4],[1.6,-39.8,.6,-44,-1.2,-47],2.2],
    [[3.4,-40.2,2.6,-42.4,3.6,-44.6,5.6,-45.2],[1.6,-39.6,-.6,-42,.4,-45,3.4,-46],2.4]];
  function wing(x,jx,jy,r,sc,mem,mem2,bone){x.save();x.translate(jx,jy);x.rotate(r);x.scale(sc,sc);
    x.beginPath();x.moveTo(0,0);x.lineTo(-8.5,-7);x.lineTo(-24,-6);x.quadraticCurveTo(-18.5,-.4,-23,3);x.quadraticCurveTo(-16,3.6,-17,9.5);x.quadraticCurveTo(-8,5.2,-.5,9);x.closePath();
    fo(x,lin(x,-24,-7,-2,9,[0,mem2,.45,mem,1,mem2]),.55);x.strokeStyle=bone;x.lineCap='round';x.lineWidth=1.3;x.beginPath();x.moveTo(0,0);x.lineTo(-8.5,-7);x.stroke();
    x.lineWidth=.7;x.beginPath();for(const[tx,ty]of[[-24,-6],[-23,3],[-17,9.5]]){x.moveTo(-8.5,-7);x.lineTo(tx,ty);}x.stroke();
    x.beginPath();pl(x,[-8.8,-7.2,-7.9,-9.4,-7.6,-7.2]);fo(x,'#d8ccb0',.3);x.restore();}
  function fiend(x,g,o,ph,md){const S=o.sk,C=o.pc,s=Math.sin(ph),c=Math.cos(ph),SD=far(S);
    let wf,bob,lean=.1,nod=0,sw=0;if(!md){wf=s;bob=-1.5*c;}else{sw=swing(ph/TAU);wf=.55+.35*Math.sin(ph*2);bob=-.6*c;lean=.08+sw*.18;nod=sw*.06;}
    const H=-22.6,r=-.1+wf*.65;
    const up=f=>{for(const q of[x,g]){q.save();q.translate(0,-bob+H);q.rotate(lean);q.translate(0,-H);}f();x.restore();g.restore();};
    up(()=>{wing(x,-1,-32.2,r+.25,.9,C.wd,CS(BLK),S.d);
      const p=cr([-2.6,-23.2,-6,-20.4,-8.4,-15.4+s*.8,-10.6,-12+s*1.2],4);taper(x,p,1.4,.4);fo(x,lin(x,-10,-23,-3,-12,[0,S.b,1,S.d]),.45);
      const n=p.length,ex=p[n-2],ey=p[n-1],ax=ex-p[n-4],ay=ey-p[n-3],l=Math.hypot(ax,ay)||1,ux=ax/l,uy=ay/l;
      x.beginPath();pl(x,[ex+ux*2.4,ey+uy*2.4,ex-uy*1.2,ey+ux*1.2,ex+ux*.4,ey+uy*.4,ex+uy*1.2,ey-ux*1.2]);fo(x,S.d,.4);
      arm(x,-.6,-32,md?-1.6:-1.4-s*.6,md?-26:-24.6,1.5,SD,1);
      const k1=s*.6;leg(x,-1,-22.4,-1.6+k1,-9.2,2.1,SD,'#160c0c');
      wing(x,-2.4,-31.6,r,1,C.wg,C.wd,S.b);
      x.beginPath();pl(x,[-3.4,-23,-.8,-23,-1.2,-17.6,-2.2,-18.6,-3.2,-17.4,-3.8,-19]);fo(x,C.lo,.45);
      x.beginPath();sp(x,[-3,-22.8,-3.6,-26.8,-4.6,-31.4,-2.2,-34.2,2.2,-34,5,-31.6,4.4,-27.6,2.6,-24.6,1.6,-22.2],1);fo(x,lin(x,-4.6,-34.2,5,-22.2,[0,S.l,.5,S.b,1,S.d]),.55);
      x.fillStyle='rgba(255,215,170,.12)';x.beginPath();x.ellipse(2.4,-27.4,1.6,3,-.1,0,TAU);x.fill();
      x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=.4;x.beginPath();x.moveTo(1.2,-31.2);x.quadraticCurveTo(3,-30.4,4.6,-31.2);x.moveTo(1.8,-26.6);x.lineTo(3.8,-26.8);x.moveTo(1.6,-24.8);x.lineTo(3.2,-25);x.stroke();
      x.beginPath();pl(x,[-.6,-34,1.2,-33.8,-2.4,-23.4,-3.6,-23.6]);fo(x,lin(x,0,-34,0,-23,[0,'#4a4250',1,'#1e1a22']),.35);
      leg(x,.6,-22.4,1.4+k1*.6,-8.4,2.3,S,'#160c0c');
      x.beginPath();pl(x,[-.8,-23.2,2.6,-23,2.8,-18.4,2,-17.2,1.4,-18.2,.6,-16.6,-.2,-18,-.9,-17.4]);fo(x,lin(x,0,-23,0,-16.6,[0,C.hi,.45,C.c,1,C.lo]),.45);
      limb(x,-3.4,-23.2,2.8,-23,.75,.75);fo(x,'#2a2228',.35);
      for(const q of[x,g]){q.save();q.translate(1.6,-34);q.rotate(nod);q.translate(-1.6,34);}
      const h=HG[o.horn];horn(x,h[0],h[2]*.8,'#1e1412','#3a2a24',C.c);
      x.beginPath();sp(x,[-.2,-36.6,.2,-39.4,2.8,-40.4,5,-39,6.2,-37,5.8,-35.2,3.6,-34.2,.8,-34.6],1);fo(x,lin(x,0,-40.4,6,-34.2,[0,S.l,.5,S.b,1,S.d]),.55);
      x.beginPath();pl(x,[2.6,-38.8,6,-37.9,5.9,-37.4,2.8,-38.1]);x.fillStyle=S.d;x.fill();
      glow(g,4.6,-37.4,3,C.a,.65);x.fillStyle=C.gl;x.beginPath();pl(x,[3.2,-38,5,-37.4,3.3,-36.9]);x.fill();x.beginPath();pl(x,[5.3,-37.5,6,-37.3,5.3,-36.9]);x.fill();
      x.beginPath();x.moveTo(3.6,-35.6);x.lineTo(5.8,-35.9);x.lineWidth=.4;x.strokeStyle=OUT;x.stroke();
      horn(x,h[1],h[2],'#3a2a24','#6a5244',C.hi);
      if(o.crest){for(let i=0;i<4;i++)flame(g,.2+i*1.4,-39.6-i*.1,4.2-i*.5,1.1,C,.95);}
      x.restore();g.restore();
      let hx,hy,a;if(md){hx=5.6+sw*2;hy=-27.6-Math.min(0,sw)*4.4+Math.max(0,sw)*1.2;a=sw<0?-1.1+sw*1.2:-1.1+sw*1.6;}else{hx=7;hy=-25.8+s*.3;a=-.42+s*.04;}
      blade(x,g,hx,hy,a,15,1.6,C,ph,0);
      arm(x,2,-31.8,hx,hy,1.7,S,md&&sw<0?-1:1.2);
      x.beginPath();sp(x,[.2,-32.4,1.2,-34.2,3.6,-34,4.6,-32.2,3.2,-30.8,1,-30.8],1);fo(x,lin(x,0,-34,4,-31,[0,'#6c6274',1,'#1e1a22']),.45);
      x.fillStyle=C.c;x.beginPath();x.arc(2.5,-32.5,.55,0,TAU);x.fill();glow(g,2.5,-32.5,1.6,C.a,.5);});}
  function lordFig(x,g,o,ph,md){const S=o.sk,C=o.pc,s=Math.sin(ph),c=Math.cos(ph),SD=far(S),FI=far(IRON);
    let bob=0,lean=.06,nod=0,la=0,sw=0;if(!md){bob=.8*(.5+.5*Math.cos(2*ph));la=s;nod=s*.025;}else{sw=swing(ph/TAU);lean=.04+sw*.12;nod=sw*.05;}
    const H=-19.4,nf=md?[4.6+Math.max(0,sw)*1.4,0]:[1.6+la*4.4,-Math.max(0,c)*2.2],ff=md?[-4.2,0]:[-2-la*4.4,-Math.max(0,-c)*2.2];
    const up=f=>{for(const q of[x,g]){q.save();q.translate(0,-bob+H);q.rotate(lean);q.translate(0,-H);}f();x.restore();g.restore();};
    up(()=>{const w1=Math.sin(ph+1)*.9,w2=Math.sin(ph+2)*1.5,w3=Math.sin(ph+2.8)*1.2;
      x.beginPath();x.moveTo(-1,-37.6);x.bezierCurveTo(-6,-37.4,-10,-32,-12.2+w1*.4,-22);x.bezierCurveTo(-13.6+w2*.5,-15,-14.4+w2,-9,-13.8+w3,-5.2);
      x.lineTo(-12.2+w3,-3.8);x.lineTo(-11+w3*.8,-5.6);x.lineTo(-9.2+w3*.7,-3.4);x.lineTo(-7.8+w3*.5,-5.4);x.lineTo(-6+w3*.4,-3.6);x.lineTo(-4.6,-5.8);x.lineTo(-3.4,-4.4);
      x.bezierCurveTo(-3.6,-14,-3,-26,-1,-37.6);x.closePath();fo(x,lin(x,-14,-38,-3,-4,[0,C.hi,.3,C.c,.75,C.lo,1,C.dk]),.6);
      x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=.6;for(const q of[-6,-9]){x.beginPath();x.moveTo(q+3,-33);x.quadraticCurveTo(q,-20,q-1+w2*.5,-6);x.stroke();}
      arm(x,-1.4,-33.6,md?-1:-2.2-s*1.8,md?-24:-23.4,2.6,FI,1.4);});
    leg(x,-2,H-.4-bob,ff[0],ff[1],4.4,FI,'#120a0a');
    up(()=>{x.beginPath();sp(x,[-6,-33,-5,-36.4,-1.6,-37.6,0,-35,-2.4,-32.6],1);fo(x,lin(x,-6,-37,0,-33,[0,'#5a5060',1,'#1a161e']),.5);
      x.beginPath();sp(x,[-5,-20.2,-6,-26.6,-5.6,-32.4,-2.6,-36.6,2.8,-37.2,6.4,-34.6,7.4,-28.6,6,-22.6,2.6,-19.8,-1.8,-19.4],1);fo(x,lin(x,-6,-37,7.4,-19.4,[0,'#7a7080',.4,'#3a3340',1,'#141018']),.6);
      x.strokeStyle='#d8a640';x.lineWidth=.55;x.beginPath();x.moveTo(-1.8,-36.4);x.quadraticCurveTo(4,-34,6.6,-34.2);x.moveTo(-4.6,-21);x.quadraticCurveTo(1,-19.4,5.6,-22.4);x.stroke();
      glow(g,3.4,-29,3.4,C.a,.7);x.fillStyle=C.gl;x.beginPath();pl(x,[3.4,-31.2,4.6,-29,3.4,-26.8,2.2,-29]);x.fill();
      x.beginPath();pl(x,[-5.2,-20.4,6,-21,6.6,-15.6,2.6,-14.2,-1.6,-14.4,-5.4,-16.2]);fo(x,lin(x,0,-21,0,-14,[0,'#5a5060',1,'#18141c']),.5);
      x.beginPath();pl(x,[1.2,-21,5.4,-21.2,5.6,-11,4.4,-9.6,3.4,-11,2.2,-9.8,1,-11.4]);fo(x,lin(x,0,-21,0,-9.6,[0,C.hi,.4,C.c,1,C.lo]),.45);
      x.strokeStyle='#d8a640';x.lineWidth=.4;x.beginPath();x.moveTo(1.3,-20.6);x.lineTo(5.3,-20.8);x.stroke();});
    leg(x,1.2,H-bob,nf[0],nf[1],4.6,IRON,'#120a0a');
    up(()=>{for(const q of[x,g]){q.save();q.translate(3.6,-37.4);q.rotate(nod);q.translate(-3.6,37.4);}
      horn(x,[3,-43.6,2,-48,3.2,-51.2],1.8,'#2a1c18','#5a4434',C.hi);
      horn(x,[2,-42.6,-1.6,-45.4,-4.6,-43.6,-4.6,-39.8,-2.2,-38.2],3.2,'#2a1c18','#5a4434','#8a7058');
      x.beginPath();sp(x,[1,-39.4,1.4,-42.6,4.2,-44.2,7.2,-43,8.6,-40.6,8,-38.2,5.8,-36.8,2.6,-37.2],1);fo(x,lin(x,1,-44,8.6,-37,[0,S.l,.5,S.b,1,S.d]),.55);
      x.beginPath();pl(x,[4.2,-41.6,8.4,-40.6,8.3,-40,4.4,-40.9]);x.fillStyle=S.d;x.fill();
      glow(g,6.6,-40.2,3.4,C.a,.7);x.fillStyle=C.gl;x.beginPath();pl(x,[4.9,-40.8,7,-40.1,5,-39.5]);x.fill();x.beginPath();pl(x,[7.4,-40.2,8.2,-40,7.4,-39.6]);x.fill();
      x.beginPath();x.moveTo(5.4,-38.2);x.lineTo(8.2,-38.6);x.lineWidth=.45;x.strokeStyle=OUT;x.stroke();
      x.beginPath();pl(x,[1.4,-43,8,-42.4,8,-41.4,1.6,-42]);fo(x,lin(x,0,-43,0,-41,[0,'#ffe08a',1,'#a8741e']),.35);
      for(let i=0;i<4;i++){const bx=2.2+i*1.75,by=-42.8+i*.15;x.beginPath();pl(x,[bx-.6,by,bx+.6,by,bx,by-2.4]);fo(x,lin(x,0,by-2.4,0,by,[0,'#fff0b0',1,'#c8902a']),.3);flame(g,bx,by-1.8,3.2+((i*7)%3)*.5+Math.sin(ph*2+i)*.6,1,C,.95);}
      x.restore();g.restore();
      let hx,hy,a;if(md){hx=6.6+sw*2;hy=-27.6-Math.min(0,sw)*6+Math.max(0,sw)*1.6;a=sw<0?-1.3+sw*1.1:-1.3+sw*1.9;}else{hx=8;hy=-25.8+s*.3;a=-1.25+s*.04;}
      blade(x,g,hx,hy,a,21,2.2,C,ph,1);
      arm(x,2.6,-33.6,hx,hy,2.6,IRON,md&&sw<0?-1:1.3);
      x.beginPath();sp(x,[-2.6,-34.4,-1.6,-37.8,2.4,-39.4,6.4,-38,7.6,-34.8,5.6,-32,1.4,-31.4,-1.6,-32.2],1);fo(x,lin(x,-2.6,-39.4,7.6,-31.4,[0,'#8a8090',.45,'#3a3340',1,'#141018']),.6);
      x.strokeStyle='#d8a640';x.lineWidth=.6;x.beginPath();x.moveTo(-1.8,-32.6);x.quadraticCurveTo(2.6,-30.6,6.8,-33);x.stroke();
      for(const[bx,by,tx,ty]of[[-.6,-37.4,-2.6,-41.6],[2.2,-38.8,1.6,-43.4],[5,-38.2,6,-42]]){taper(x,[bx,by,tx,ty],1.8,.1);fo(x,lin(x,bx,by,tx,ty,[0,'#2e2a2e',1,'#e0d4bc']),.35);}});}
  const FIG=[imp,brute,fiend,lordFig];
  // ---------- strip cache ----------
  let S1,S2,S3,X1,X2,X3,G1,GX;
  function scratch(w,h){if(!S1||S1.width<w||S1.height<h){const W=Math.max(w,S1?S1.width:0),H=Math.max(h,S1?S1.height:0);
    S1=mk(W,H);S2=mk(W,H);S3=mk(W,H);G1=mk(W,H);X1=S1.getContext('2d');X2=S2.getContext('2d');X3=S3.getContext('2d');GX=G1.getContext('2d');}
    for(const q of[X1,X2,X3,GX]){q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='source-over';q.globalAlpha=1;q.clearRect(0,0,w,h);}}
  function shadowOn(x,cx,cy,rx,ry,a){x.save();x.translate(cx,cy);x.scale(1,ry/rx);const g=x.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'rgba(8,2,2,'+a+')');g.addColorStop(.6,'rgba(8,2,2,'+a*.55+')');g.addColorStop(1,'rgba(8,2,2,0)');
    x.fillStyle=g;x.beginPath();x.arc(0,0,rx,0,TAU);x.fill();x.restore();}
  function look(u,col,b){const T=LOOK[u][b]||LOOK[u][0];return{pc:pal(col),sk:skin(SKIN[T[0]]),horn:T[1]|0,wpn:T[2]|0,crest:!!T[3],pil:!!T[4]};}
  function build(L,u,col,b){const R=LVR[L],P=3,fw=Math.round(CW[u]*R)+P*2,fh=Math.round(CH[u]*R)+P*2,o=look(u,col,b),ax=P+AX[u]*R,ay=P+AY[u]*R;
    const cn=mk(fw*NF,fh),x=cn.getContext('2d'),ol=L<2?1:L<3?1.15:1.7,rim=Math.max(.5,.75*R),gN=Math.max(1,Math.min(NF,Math.floor(1100/fw)));
    const RIM=o.pil?[[rim,rim,'rgba(205,238,255,.62)'],[-rim*.4,-rim*1.1,'rgba(120,200,255,.6)']]:[[rim,rim,'rgba(255,206,160,.42)'],[-rim*.4,-rim*1.1,'rgba(255,92,30,.38)']];
    if(u<2)for(let f=0;f<NF;f++){x.setTransform(R,0,0,R,f*fw+ax,ay);shadowOn(x,.6,.3,u?8.4:6.2,u?2.8:2.1,.5);}
    x.setTransform(1,0,0,1,0,0);
    for(let f0=0;f0<NF;f0+=gN){const n=Math.min(gN,NF-f0),W=n*fw;scratch(W,fh);
      for(let i=0;i<n;i++){const f=f0+i,md=f<8?0:1;X1.setTransform(R,0,0,R,i*fw+ax,ay);GX.setTransform(R,0,0,R,i*fw+ax,ay);FIG[u](X1,GX,o,md?(f-8)/6*TAU:f/8*TAU,md);}
      X1.setTransform(1,0,0,1,0,0);GX.setTransform(1,0,0,1,0,0);
      X2.drawImage(S1,0,0,W,fh,0,0,W,fh);X2.globalCompositeOperation='source-in';X2.fillStyle='#000';X2.fillRect(0,0,W,fh);
      for(const[dx,dy,c]of RIM){X3.globalCompositeOperation='copy';X3.drawImage(S2,0,0,W,fh,0,0,W,fh);X3.globalCompositeOperation='destination-out';X3.drawImage(S2,0,0,W,fh,dx,dy,W,fh);
        X3.globalCompositeOperation='source-in';X3.fillStyle=c;X3.fillRect(0,0,W,fh);X1.globalCompositeOperation='source-atop';X1.drawImage(S3,0,0,W,fh,0,0,W,fh);}
      X1.globalCompositeOperation='source-over';X2.fillStyle=OUT;X2.fillRect(0,0,W,fh);X2.globalCompositeOperation='source-over';
      const ox=f0*fw;for(let i=0;i<8;i++){const an=i*Math.PI/4;x.drawImage(S2,0,0,W,fh,ox+Math.cos(an)*ol,Math.sin(an)*ol,W,fh);}
      x.drawImage(S1,0,0,W,fh,ox,0,W,fh);x.drawImage(G1,0,0,W,fh,ox,0,W,fh);}
    return{cn,fw,fh,ax:ax/R,ay:ay/R,aw:fw/R,ah:fh/R,px:fw*NF*fh,t:0};}
  // rows used in the last 1.5 s are never evicted; over the cap, a missing row falls back to another level or is built one level lower
  const rows=new Map(),cols=new Map();let pxTot=0,bMs=0,bWin=-1e9,nBuilt=0,msBuilt=0;const CAP=8e6;
  function colI(col){let i=cols.get(col);if(i===undefined){i=cols.size;cols.set(col,i);}return i;}
  function evict(now){const a=[...rows.entries()].filter(e=>now-e[1].t>1500).sort((p,q)=>p[1].t-q[1].t);for(const[k,r]of a){if(pxTot<CAP*.8)break;rows.delete(k);pxTot-=r.px;}}
  function near(base,L){for(const d of[-1,1,-2,2,-3,3]){const l=L+d;if(l>=0&&l<4){const r=rows.get(base+l);if(r)return r;}}return null;}
  function rowFor(L,u,col,b,force){const base=((colI(col)*4+u)*8+b)*4,now=performance.now();let r=rows.get(base+L);if(r){r.t=now;return r;}
    if(now-bWin>16){bWin=now;bMs=0;}
    if(!force){if(pxTot>CAP)evict(now);if(bMs>5||pxTot>CAP){const a=near(base,L);if(a){a.t=now;return a;}if(pxTot>CAP&&L>1)return rowFor(L-1,u,col,b,0);}}
    r=build(L,u,col,b);const dt=performance.now()-now;bMs+=dt;msBuilt+=dt;nBuilt++;r.t=now;rows.set(base+L,r);pxTot+=r.px;return r;}
  // ---------- overlays ----------
  const sprites={};
  function blob(name,c,a){let s=sprites[name];if(s)return s;s=mk(64,64);const x=s.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,CS(c,a));g.addColorStop(.35,CS(c,a*.55));g.addColorStop(.7,CS(c,a*.16));g.addColorStop(1,CS(c,0));x.fillStyle=g;x.fillRect(0,0,64,64);return sprites[name]=s;}
  const flags=new Map();const FLW=18,FLH=34,FLX=15,FLY=33;
  function flagRow(L,col){const key=col+'|'+L;let r=flags.get(key);if(r)return r;const R=LVR[L],cw=Math.round(FLW*R),ch=Math.round(FLH*R),fw=cw+2,fh=ch+2;
    const cn=mk(fw*6,fh),x=cn.getContext('2d'),C=pal(col);
    for(let f=0;f<6;f++){const p=f/6*TAU;x.save();x.translate(f*fw+1+FLX*R,1+FLY*R);x.scale(R,R);
      x.lineCap='round';x.strokeStyle=OUT;x.lineWidth=1.5;x.beginPath();x.moveTo(0,0);x.lineTo(0,-30);x.stroke();x.strokeStyle='#5a3a22';x.lineWidth=.8;x.stroke();
      const w=i=>Math.sin(p+i*.9)*1.1*i/4;x.beginPath();x.moveTo(-.4,-29);
      for(let i=1;i<=4;i++)x.lineTo(-.4-i*3.2,-29.4+w(i)-i*.2);x.lineTo(-13.2,-22+w(4));x.lineTo(-11.2,-23.6+w(3.6));x.lineTo(-12.4,-17.6+w(4));
      for(let i=3;i>=0;i--)x.lineTo(-.4-i*3.2,-18.6+w(i)+i*.3);x.closePath();fo(x,lin(x,0,-30,-12,-18,[0,C.hi,.4,C.c,1,C.lo]),.5);
      x.fillStyle=C.dk;x.beginPath();x.arc(-6,-24.4+w(2),1.8,0,TAU);x.fill();x.fillStyle=C.gl;x.beginPath();pl(x,[-7.6,-26.6+w(2),-6.6,-25+w(2),-5.4,-25+w(2),-4.4,-26.6+w(2),-6,-25.6+w(2)]);x.fill();
      x.beginPath();x.arc(0,-31,1.6,0,TAU);fo(x,'#e6dac0',.35);x.fillStyle=OUT;x.fillRect(-.9,-31.4,.6,.6);x.fillRect(.3,-31.4,.6,.6);
      horn(x,[-1,-32,-2.6,-33.4,-2.2,-35],.9,'#3a2a24','#6a5244',C.hi);horn(x,[1,-32,2.6,-33.4,2.2,-35],.9,'#3a2a24','#6a5244',C.hi);x.restore();}
    r={cn,fw,fh,cw,ch,R};flags.set(key,r);return r;}
  const FLAT=[[-2.8,-6.5,.72],[-4.8,-10,.95],[-3.6,-22,1],[-4.6,-20,1.45]];
  function bobOf(u,ph,act){if(act)return 0;if(u===2)return-1.5*Math.cos(ph);const a=[1.1,.9,0,.8][u];return a*(.5+.5*Math.cos(2*ph));}
  const SH=[[6.2,2.1],[8.4,2.8],[9.5,3],[12,3.6]];
  function unit(x,px,py,k,col,t,dir,u,bearer,act,v,sac){u=u>0&&u<4?u|0:0;v=(v|0)&15;
    const m=x.getTransform?x.getTransform():null,sc=(m?Math.hypot(m.a,m.b):2)*k,L=sc<.62?0:sc<1.24?1:sc<2.5?2:3;
    const pil=!!sac&&!u,b=u===3?0:pil?5:v===15?4:v&3,now=performance.now(),hs=px*.37+py*.71;
    let f,ph=0,br=1;
    if(act){ph=t*AS[u];f=8+(((ph/TAU*6)%6+6)%6|0);}
    else if(t===0&&u!==2){f=0;br=1+.028*Math.sin(now*.0024+hs);}
    else{ph=(t===0?now*.0067+hs:t)*WS[u];f=((ph/TAU*8)%8+8)%8|0;ph=f/8*TAU;}
    if(act)ph=(f-8)/6*TAU;
    const r=rowFor(L,u,col,b),js=u===3?1:JIT[v],kk=k*js,ga=x.globalAlpha;
    if(u>=2){const bo=bobOf(u,ph,act),sh=SH[u];x.globalAlpha=ga*(u===2?.75-.08*bo:.85);const s=blob('sh',[6,2,2],.62);x.drawImage(s,px-sh[0]*kk*1.25,py-sh[1]*kk*1.25,sh[0]*kk*2.5,sh[1]*kk*2.5);x.globalAlpha=ga;}
    if(u===3){const pu=.5+.5*Math.sin(now*.004+hs),s=blob('au'+col,MX(RGB(col),[255,120,40],.25),.6);x.globalAlpha=ga*(.6+.25*pu);const rr=(22+pu*3)*kk;x.drawImage(s,px-rr,py-rr*.42,rr*2,rr*.84);
      const e=blob('em',[255,170,80],1);for(let i=0;i<3;i++){const q=((now*.00045+i*.333+hs*.01)%1+1)%1,ex=px+Math.sin(i*2.4+q*5)*9*kk,ey=py-q*34*kk;x.globalAlpha=ga*(1-q)*.9;x.drawImage(e,ex-1.6*kk,ey-1.6*kk,3.2*kk,3.2*kk);}
      x.globalAlpha=ga;}
    if(pil){const w=blob('wisp',[225,246,255],1);for(let i=0;i<4;i++){const q=((now*.0012+i*.25+hs*.013)%1+1)%1,ex=px-dir*(1+q*15)*kk,ey=py-(13+q*9+Math.sin(now*.006+i*2+hs)*1.8)*kk,sz=(4.6-q*3)*kk;
        x.globalAlpha=ga*(1-q)*.95;x.drawImage(w,ex-sz,ey-sz,sz*2,sz*2);}x.globalAlpha=ga;}
    const flip=dir<0;let X0=px,Y0=py;
    if(flip){if(m)x.setTransform(-m.a,-m.b,m.c,m.d,m.e+m.a*px+m.c*py,m.f+m.b*px+m.d*py);else{x.save();x.translate(px,py);x.scale(-1,1);}X0=Y0=0;}
    if(bearer||u===3){const fr=flagRow(L,col),fa=FLAT[u],fs=fa[2]*kk,bo=bobOf(u,ph,act),ff=((now*.0085+hs)%6+6)%6|0;
      x.drawImage(fr.cn,ff*fr.fw+1,1,fr.cw,fr.ch,X0+fa[0]*kk-FLX*fs,Y0+(fa[1]-bo)*kk-FLY*fs,FLW*fs,FLH*fs);}
    x.drawImage(r.cn,f*r.fw,0,r.fw,r.fh,X0-r.ax*kk,Y0-r.ay*kk*br,r.aw*kk,r.ah*kk*br);
    if(flip){if(m)x.setTransform(m);else x.restore();}}
  // ---------- corpses ----------
  const corpses=new Map();const KW=[28,34,46,50],KH=[14,16,20,30],KX=[14,17,23,25],KY=[9,10,12,22];
  function paintCorpse(x,g,u,C){const z=[1,1.25,1.6,1.8][u];
    shadowOn(x,0,0,11*z,4.2*z,.78);x.fillStyle='rgba(40,30,26,.55)';for(let i=0;i<9;i++){const a=i*2.4,rr=(5+i%3*2.2)*z;x.beginPath();x.arc(Math.cos(a)*rr,Math.sin(a)*rr*.36,(.5+i%2*.35)*z,0,TAU);x.fill();}
    x.save();x.scale(z,z);
    if(u===2){x.strokeStyle='#2a1e1a';x.lineCap='round';x.lineWidth=.9;x.beginPath();x.moveTo(-2,-1);x.lineTo(-10,-3.6);x.lineTo(-13.4,-1.6);x.moveTo(-10,-3.6);x.lineTo(-12.6,1);x.moveTo(2,-.6);x.lineTo(9.6,-3);x.lineTo(12.6,-.6);x.moveTo(9.6,-3);x.lineTo(11.4,1.6);x.stroke();
      x.fillStyle=C.wd;x.globalAlpha=.8;x.beginPath();pl(x,[-10,-3.4,-13.2,-1.6,-12.4,.9,-6,-.4]);x.fill();x.beginPath();pl(x,[9.6,-2.8,12.4,-.6,11.2,1.4,5,0]);x.fill();x.globalAlpha=1;}
    x.beginPath();sp(x,[-5.6,.6,-4.4,-1.6,-1.6,-2.8,1.8,-2.6,4.6,-1.2,5.6,.6,0,1.6],1);fo(x,lin(x,-4,-3,4,1.6,[0,'#9a9088',.5,'#5e5650',1,'#2a2422']),0);
    x.fillStyle='rgba(20,12,10,.5)';for(const[a,b2]of[[-2.6,-.4],[1.2,-1],[3.4,.2],[-.6,.8]]){x.beginPath();x.arc(a,b2,.5,0,TAU);x.fill();}
    x.beginPath();pl(x,[-5.8,.2,-3.2,-.6,-1.6,1.2,-4.4,1.8]);fo(x,lin(x,-5,-1,-2,2,[0,C.hi,1,C.lo]),.35);
    x.strokeStyle='#d8ccb0';x.lineWidth=.55;x.lineCap='round';x.beginPath();x.moveTo(-1.4,-.8);x.quadraticCurveTo(0,-2.4,1.6,-1.2);x.moveTo(-.6,-.2);x.quadraticCurveTo(.6,-1.6,2.2,-.6);x.stroke();
    if(u===1){x.beginPath();sp(x,[-4.4,-2.2,-2.6,-4,0,-3.6,.4,-2,-2.6,-1.4],1);fo(x,lin(x,-4,-4,0,-1.4,[0,C.c,1,C.dk]),.4);taper(x,[-2.4,-3.8,-3.4,-6],1,.1);fo(x,'#9a949a',.25);}
    if(u===0){x.save();x.rotate(.12);limb(x,-8,1.4,6,1,.32,.3);fo(x,'#4a2e1c',.25);x.restore();}else if(u===1){x.save();x.translate(5.4,.8);x.rotate(-.2);limb(x,-4,0,4,0,.45,.4);fo(x,'#4a2e1c',.3);x.beginPath();pl(x,[2,-.3,2.2,-2.6,4.4,-2.4,4.4,-.3]);fo(x,'#6a666e',.3);x.restore();}
    x.beginPath();sp(x,[1.8,-2.2,2.2,-4,4,-4.6,5.6,-3.8,5.8,-2.4,4.8,-1.4,2.8,-1.4],1);fo(x,lin(x,2,-4.6,5.8,-1.4,[0,'#f0e6d0',.6,'#c4b698',1,'#7a6c54']),.4);
    x.fillStyle='#1a1010';x.beginPath();x.arc(3.6,-3,.48,0,TAU);x.arc(5,-2.9,.42,0,TAU);x.fill();
    horn(x,u===2?[2.4,-4,0,-5,-2.6,-4.4]:[2.6,-4,1.4,-5.6,-.2,-6],u?1.1:.9,'#2a1c18','#5a4434',C.c);
    if(u===3){x.restore();x.save();x.scale(z,z);x.beginPath();pl(x,[1.6,-5.4,6.4,-5,6.6,-4,1.8,-4.4]);fo(x,lin(x,0,-5.4,0,-4,[0,'#ffe08a',1,'#a8741e']),.3);
      for(let i=0;i<3;i++){const bx=2.4+i*1.8;x.beginPath();pl(x,[bx-.5,-5.2,bx+.5,-5.1,bx,-6.8]);fo(x,'#e0b04a',.25);}
      x.save();x.translate(-2.6,-1);x.rotate(-.28);limb(x,0,-14,0,0,.9,.4);fo(x,lin(x,-1,0,1,0,[0,'#cfc8cc',1,'#2a2430']),.35);x.beginPath();pl(x,[-2.4,-14.2,2.4,-14.2,2,-13.2,-2,-13.2]);fo(x,'#c8963a',.3);
      limb(x,0,-17.4,0,-14.2,.45,.45);fo(x,'#2a1c18',.25);x.restore();glow(g,-3.2,-9,4,C.a,.45);}
    x.restore();
    for(const[a,b2,r]of[[-2.2,-.8,1.2],[1.4,.2,1],[3.6,-.6,.9]]){glow(g,a*z,b2*z,r*2.4,[255,120,40],.55);g.fillStyle='#ffd27a';g.beginPath();g.arc(a*z,b2*z,r*.35,0,TAU);g.fill();}}
  function corpseRow(L,u,col){const key=col+'|'+u+'|'+L;let r=corpses.get(key);if(r)return r;const R=LVR[L],cw=Math.round(KW[u]*R),ch=Math.round(KH[u]*R),fw=cw+2,fh=ch+2;
    const cn=mk(fw,fh),x=cn.getContext('2d'),gc=mk(fw,fh),g=gc.getContext('2d');for(const q of[x,g])q.setTransform(R,0,0,R,KX[u]*R+1,KY[u]*R+1);
    paintCorpse(x,g,u,pal(col));x.setTransform(1,0,0,1,0,0);x.drawImage(gc,0,0);r={cn,fw,fh,cw,ch};corpses.set(key,r);return r;}
  function corpse(x,px,py,k,col,u,flip){u=u>0&&u<4?u|0:0;const m=x.getTransform?x.getTransform():null,sc=(m?Math.hypot(m.a,m.b):2)*k,L=sc<.62?0:sc<1.24?1:sc<2.5?2:3;
    const r=corpseRow(L,u,col),ga=x.globalAlpha;
    if(flip){if(m)x.setTransform(-m.a,-m.b,m.c,m.d,m.e+m.a*px+m.c*py,m.f+m.b*px+m.d*py);else{x.save();x.translate(px,py);x.scale(-1,1);}
      x.drawImage(r.cn,1,1,r.cw,r.ch,-KX[u]*k,-KY[u]*k,KW[u]*k,KH[u]*k);if(m)x.setTransform(m);else x.restore();}
    else x.drawImage(r.cn,1,1,r.cw,r.ch,px-KX[u]*k,py-KY[u]*k,KW[u]*k,KH[u]*k);
    const now=performance.now(),hs=px*.31+py*.53,e=blob('em',[255,170,80],1),z=[1,1.25,1.6,1.8][u];
    for(let i=0;i<2;i++){const fl=.5+.5*Math.sin(now*.011+i*2.1+hs);x.globalAlpha=ga*fl*.7;const ex=px+(i?1.6:-2.2)*z*k*(flip?-1:1),ey=py-(i?.2:.8)*z*k,s=(1.6+fl)*k;x.drawImage(e,ex-s,ey-s,s*2,s*2);}
    x.globalAlpha=ga;}
  // ---------- warm-up and stats ----------
  function warm(cl,lv){const q=[];for(const col of cl||[])for(const L of lv||[1,2])for(let u=0;u<4;u++)for(let b=0;b<(u===3?1:u?5:6);b++)q.push([L,u,col,b]);
    const tick=()=>{const t0=performance.now();while(q.length&&performance.now()-t0<6){const[L,u,col,b]=q.shift();rowFor(L,u,col,b,1);}if(q.length)setTimeout(tick,30);};setTimeout(tick,0);}
  function stats(){return{rows:rows.size,px:pxTot,mb:+(pxTot*4/1048576).toFixed(1),built:nBuilt,buildMs:+msBuilt.toFixed(1),avgMs:+(msBuilt/Math.max(1,nBuilt)).toFixed(2)};}
  function clear(){rows.clear();flags.clear();corpses.clear();pxTot=0;}
  return{unit,corpse,warm,stats,clear,rowFor,CW,CH,AX,AY,LVR};
})();
function drawUnit(x,px,py,k,col,t,dir,u,bearer,act,v=0,sac=0){UNITART.unit(x,px,py,k,col,t,dir,u,bearer,act,v,sac);}
function drawCorpse(x,px,py,k,col,u,flip){UNITART.corpse(x,px,py,k,col,u,flip);}
function warmUnits(cols,levels){UNITART.warm(cols,levels);}
