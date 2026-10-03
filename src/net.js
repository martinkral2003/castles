// ===== Brimfall serverless multiplayer: WebRTC data channels, star topology, invite/reply codes instead of a signalling server =====
// Works from any static host (GitHub Pages): the host makes one invite code per friend, the friend answers with a reply code, the host pastes it.
// The adapter has the same shape as the claude.ai room API the game code was written against: a room with presence(patch), onPeers(cb), peers(), leave().
// Presence is merged key by key and relayed by the host to everyone, so `{r:'h',L,g}` (host) and `{r:'c',n,c,p,pg}` (clients) behave as before.
const P2P=(()=>{
  const ok=typeof RTCPeerConnection!=='undefined';
  const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]}; // only a public STUN lookup; no game data touches it
  const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
  const unb64=t=>{t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;};
  async function pack(o){const s=JSON.stringify(o);
    try{if(typeof CompressionStream!=='undefined'){const z=new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'));return'z'+b64(new Uint8Array(await new Response(z).arrayBuffer()));}}catch(e){}
    return'p'+b64(new TextEncoder().encode(s));}
  async function unpack(t){t=String(t||'').replace(/\s+/g,'');if(t.length<20)throw new Error('empty');const k=t[0],u=unb64(t.slice(1));
    if(k==='z'){const z=new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return JSON.parse(await new Response(z).text());}
    return JSON.parse(new TextDecoder().decode(u));}
  const gathered=pc=>new Promise(res=>{if(pc.iceGatheringState==='complete')return res();
    const f=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',f);res();}};pc.addEventListener('icegatheringstatechange',f);setTimeout(res,5000);});
  const send=(dc,m)=>{if(dc&&dc.readyState==='open'){try{dc.send(JSON.stringify(m));}catch(e){}}};
  // ----- host room
  function host(){
    const me={id:'host',presence:{}},peers=new Map(),subs=new Set();let n=0;
    const list=()=>[{peer:'host',presence:me.presence,sameTab:true,isMe:true},...[...peers.values()].filter(c=>c.open).map(c=>({peer:c.id,presence:c.presence,sameTab:false,isMe:false}))];
    const emit=()=>{const L=list();subs.forEach(f=>{try{f({peers:L});}catch(e){console.error(e);}});};
    const bcast=(m,except)=>{for(const c of peers.values())if(c.open&&c!==except)send(c.dc,m);};
    const nr={
      presence(o){Object.assign(me.presence,o);bcast({t:'pr',id:'host',p:o});return Promise.resolve();},
      onPeers(cb){subs.add(cb);setTimeout(()=>cb({peers:list()}),0);return()=>subs.delete(cb);},
      peers:list,
      leave(){for(const c of peers.values()){try{c.pc.close();}catch(e){}}peers.clear();subs.clear();},
      isOpen:id=>{const c=peers.get(id);return !!(c&&c.open);},
      forget(id){const c=peers.get(id);if(c){try{c.pc.close();}catch(e){}peers.delete(id);emit();}},
      async invite(){const id='c'+(++n),pc=new RTCPeerConnection(ICE),dc=pc.createDataChannel('bf'),c={id,pc,dc,presence:{},open:false};peers.set(id,c);
        const drop=()=>{if(peers.get(id)===c){const was=c.open;peers.delete(id);c.open=false;if(was){bcast({t:'gone',id});}emit();}};
        dc.onopen=()=>{c.open=true;const all={host:me.presence};for(const o of peers.values())if(o!==c&&o.open)all[o.id]=o.presence;send(dc,{t:'hello',id,all});emit();};
        dc.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(_){return;}if(m&&m.t==='pr'&&m.p&&typeof m.p==='object'){Object.assign(c.presence,m.p);bcast({t:'pr',id,p:m.p},c);emit();}};
        dc.onclose=drop;pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'||pc.connectionState==='closed')drop();};
        await pc.setLocalDescription(await pc.createOffer());await gathered(pc);
        return{id,n,code:await pack({t:'o',d:pc.localDescription.sdp}),isOpen:()=>c.open};},
      async accept(id,text){const c=peers.get(id);if(!c)throw new Error('gone');const m=await unpack(text);if(m.t!=='a')throw new Error('not a reply');await c.pc.setRemoteDescription({type:'answer',sdp:m.d});}
    };
    return nr;}
  // ----- client room: returns {nr, answer, opened, isOpen}
  async function join(text){
    const m=await unpack(text);if(m.t!=='o')throw new Error('not an invite');
    const pc=new RTCPeerConnection(ICE),me={id:null,presence:{}},others={},subs=new Set();let dc=null,open=false,hostGone=false,resolve;
    const opened=new Promise(r=>{resolve=r;});
    const list=()=>{const L=[{peer:me.id,presence:me.presence,sameTab:true,isMe:true}];if(!hostGone&&others.host)L.push({peer:'host',presence:others.host,sameTab:false,isMe:false});
      for(const k in others)if(k!=='host')L.push({peer:k,presence:others[k],sameTab:false,isMe:false});return L;};
    const emit=()=>{const L=list();subs.forEach(f=>{try{f({peers:L});}catch(e){console.error(e);}});};
    pc.ondatachannel=e=>{dc=e.channel;
      dc.onmessage=ev=>{let q;try{q=JSON.parse(ev.data);}catch(_){return;}if(!q)return;
        if(q.t==='hello'){me.id=q.id;for(const k in q.all)others[k]=q.all[k]||{};open=true;resolve();emit();}
        else if(q.t==='pr'&&q.p){others[q.id]=Object.assign(others[q.id]||{},q.p);emit();}
        else if(q.t==='gone'){delete others[q.id];emit();}};
      dc.onclose=()=>{hostGone=true;open=false;emit();};};
    pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'||pc.connectionState==='closed'){hostGone=true;open=false;emit();}};
    await pc.setRemoteDescription({type:'offer',sdp:m.d});await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);
    const answer=await pack({t:'a',d:pc.localDescription.sdp});
    const nr={presence(o){Object.assign(me.presence,o);send(dc,{t:'pr',p:o});return Promise.resolve();},
      onPeers(cb){subs.add(cb);setTimeout(()=>cb({peers:list()}),0);return()=>subs.delete(cb);},peers:list,leave(){try{pc.close();}catch(e){}subs.clear();}};
    return{nr,answer,opened,isOpen:()=>open};}
  return{ok,host,join};
})();
