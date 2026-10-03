// ===== Brimfall serverless multiplayer: WebRTC data channels, star topology, invite/reply codes instead of a signalling server =====
// Works from any static host (GitHub Pages): the host makes one invite code per friend, the friend answers with a reply code, the host pastes it.
// The adapter has the same shape as the claude.ai room API the game code was written against: a room with presence(patch), onPeers(cb), peers(), leave().
// Presence is merged key by key and relayed by the host to everyone, so `{r:'h',L,g}` (host) and `{r:'c',n,c,p,pg}` (clients) behave as before.
const P2P=(()=>{
  const ok=typeof RTCPeerConnection!=='undefined';
  // Public STUN servers find your internet address. Strict NATs (mobile data, some offices) cannot connect directly, so a public TURN relay is the fallback: the game data it carries is
  // DTLS-encrypted, but it is a third-party service that may be slow or gone. To use your own relay set localStorage 'bf-ice' to a JSON array of RTCIceServer objects.
  const iceServers=()=>{try{const o=JSON.parse(localStorage.getItem('bf-ice')||'null');if(Array.isArray(o)&&o.length)return o;}catch(e){}
    return[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun.cloudflare.com:3478']},
      {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}];};
  const mkPc=()=>new RTCPeerConnection({iceServers:iceServers(),iceCandidatePoolSize:2});
  const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
  const unb64=t=>{t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;};
  async function pack(o){const s=JSON.stringify(o);
    try{if(typeof CompressionStream!=='undefined'){const z=new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'));return'z'+b64(new Uint8Array(await new Response(z).arrayBuffer()));}}catch(e){}
    return'p'+b64(new TextEncoder().encode(s));}
  async function unpack(t){t=String(t||'').replace(/\s+/g,'');if(t.length<20)throw new Error('empty');const k=t[0],u=unb64(t.slice(1));
    if(k==='z'){const z=new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return JSON.parse(await new Response(z).text());}
    return JSON.parse(new TextDecoder().decode(u));}
  // collect candidates: resolves when gathering completes, or after 3.5 s once an internet-facing (srflx/relay) candidate exists, or after 9 s whatever happens.
  // Call watch(pc) BEFORE setLocalDescription; it returns {done, types}.
  const watch=pc=>{const types=new Set();let fin;const done=new Promise(r=>{fin=r;});const t0=Date.now();
    pc.addEventListener('icecandidate',e=>{if(e.candidate)types.add(e.candidate.type||(/ typ (\w+)/.exec(e.candidate.candidate)||[])[1]);else fin();});
    pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete')fin();});
    const poll=setInterval(()=>{const el=Date.now()-t0;if((el>3500&&(types.has('srflx')||types.has('relay')))||el>9000){fin();}},250);
    done.then(()=>clearInterval(poll));return{done,types};};
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
      async invite(){const id='c'+(++n),pc=mkPc(),dc=pc.createDataChannel('bf'),c={id,pc,dc,presence:{},open:false};peers.set(id,c);
        const drop=()=>{if(peers.get(id)===c){const was=c.open;peers.delete(id);c.open=false;if(was){bcast({t:'gone',id});}emit();}};
        dc.onopen=()=>{c.open=true;const all={host:me.presence};for(const o of peers.values())if(o!==c&&o.open)all[o.id]=o.presence;send(dc,{t:'hello',id,all});emit();};
        dc.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(_){return;}if(m&&m.t==='pr'&&m.p&&typeof m.p==='object'){Object.assign(c.presence,m.p);bcast({t:'pr',id,p:m.p},c);emit();}};
        dc.onclose=drop;pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'||pc.connectionState==='closed')drop();};
        const w=watch(pc);await pc.setLocalDescription(await pc.createOffer());await w.done;
        return{id,n,code:await pack({t:'o',d:pc.localDescription.sdp}),isOpen:()=>c.open,state:()=>pc.iceConnectionState,net:[...w.types].join(',')};},
      async accept(id,text){const c=peers.get(id);if(!c)throw new Error('gone');const m=await unpack(text);if(m.t!=='a')throw new Error('not a reply');await c.pc.setRemoteDescription({type:'answer',sdp:m.d});}
    };
    return nr;}
  // ----- client room: returns {nr, answer, opened, isOpen}
  async function join(text){
    const m=await unpack(text);if(m.t!=='o')throw new Error('not an invite');
    const pc=mkPc(),me={id:null,presence:{}},others={},subs=new Set();let dc=null,open=false,hostGone=false,resolve;
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
    await pc.setRemoteDescription({type:'offer',sdp:m.d});const w=watch(pc);await pc.setLocalDescription(await pc.createAnswer());await w.done;
    const answer=await pack({t:'a',d:pc.localDescription.sdp});
    const nr={presence(o){Object.assign(me.presence,o);send(dc,{t:'pr',p:o});return Promise.resolve();},
      onPeers(cb){subs.add(cb);setTimeout(()=>cb({peers:list()}),0);return()=>subs.delete(cb);},peers:list,leave(){try{pc.close();}catch(e){}subs.clear();}};
    return{nr,answer,opened,isOpen:()=>open,state:()=>pc.iceConnectionState,net:[...w.types].join(',')};}
  return{ok,host,join};
})();
