// ===== Brimfall online play through a free public MQTT-over-WebSocket broker (no account, no server of ours) =====
// All game traffic is relayed by the broker, so there is no NAT traversal to fail. The game was written against the claude.ai room API; `MQROOM` has the same shape:
//   MQROOM.join(name) -> room {presence(patch), onPeers(cb), peers(), leave()}; MQROOM.presence(ad), MQROOM.peers(), MQROOM.onPeers(cb) for the public game list.
// Presence patches are merged key by key and published on one topic per room; every peer re-sends its full presence every 2 s (keep-alive and late joiners), a `bye` (also the MQTT
// last-will) removes a peer at once. Topics live under `brimfall-v1/`. Anyone who guesses a 4-letter code can join, and the broker operators could read the traffic: it is not private.
const MQROOM=(()=>{
  const ok=typeof WebSocket!=='undefined';
  const BROKERS=['wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt']; // free public brokers, tried in turn
  const ROOT='brimfall-v1',enc=new TextEncoder(),dec=new TextDecoder();
  const myId=Math.random().toString(36).slice(2,10);
  const cat=(...a)=>{let n=0;for(const x of a)n+=x.length;const o=new Uint8Array(n);let i=0;for(const x of a){o.set(x,i);i+=x.length;}return o;};
  const u16=n=>new Uint8Array([n>>8,n&255]),utf=s=>{const b=enc.encode(s);return cat(u16(b.length),b);};
  const rl=n=>{const o=[];do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d);}while(n>0);return new Uint8Array(o);};
  const pkt=(h,body)=>cat(new Uint8Array([h]),rl(body.length),body);
  // ----- minimal MQTT 3.1.1 client (QoS 0): connect with a last will, subscribe, publish, ping, reconnect
  function conn(will){
    let ws=null,ready=false,closed=false,bi=0,buf=new Uint8Array(0),pingT=0,tries=0,resolveReady;
    const q=[],subs=new Set(),api={onmsg:null,onready:null,ready:new Promise(r=>{resolveReady=r;})};
    const raw=b=>{if(ws&&ws.readyState===1)ws.send(b);};
    const sendSub=t=>raw(pkt(0x82,cat(u16(1),utf(t),new Uint8Array([0]))));
    const parse=()=>{for(;;){if(buf.length<2)return;let i=1,len=0,m=1,b;do{if(i>=buf.length)return;b=buf[i++];len+=(b&127)*m;m*=128;}while(b&128);if(buf.length<i+len)return;
      const type=buf[0]>>4,body=buf.subarray(i,i+len);buf=buf.subarray(i+len);
      if(type===2){if(body[1]===0){ready=true;tries=0;clearInterval(pingT);pingT=setInterval(()=>raw(new Uint8Array([0xC0,0])),15000);
          for(const t of subs)sendSub(t);while(q.length)raw(q.shift());resolveReady();if(api.onready)api.onready();}else{try{ws.close();}catch(e){}}}
      else if(type===3){const tl=(body[0]<<8)|body[1],topic=dec.decode(body.subarray(2,2+tl));if(api.onmsg)api.onmsg(topic,dec.decode(body.subarray(2+tl)));}}};
    const connect=()=>{if(closed)return;let w;try{w=new WebSocket(BROKERS[bi%BROKERS.length],'mqtt');}catch(e){bi++;setTimeout(connect,800);return;}
      ws=w;w.binaryType='arraybuffer';buf=new Uint8Array(0);
      w.onopen=()=>{const flags=2|(will?4|(will.retain?32:0):0);
        raw(pkt(0x10,cat(utf('MQTT'),new Uint8Array([4,flags]),u16(30),utf('bf'+Math.random().toString(36).slice(2,12)),will?cat(utf(will.topic),utf(will.payload)):new Uint8Array(0))));};
      w.onmessage=e=>{buf=cat(buf,new Uint8Array(e.data));parse();};
      w.onclose=()=>{if(w!==ws)return;const was=ready;ready=false;clearInterval(pingT);if(closed)return;if(!was)bi++;tries++;setTimeout(connect,Math.min(5000,500+tries*400));};
      w.onerror=()=>{try{w.close();}catch(e){}};};
    api.sub=t=>{subs.add(t);if(ready)sendSub(t);};
    api.pub=(topic,payload,retain)=>{const p=pkt(0x30|(retain?1:0),cat(utf(topic),enc.encode(payload)));if(ready)raw(p);else if(q.length<50)q.push(p);};
    api.close=()=>{closed=true;clearInterval(pingT);if(ws){try{raw(new Uint8Array([0xE0,0]));ws.close();}catch(e){}}};
    api.state=()=>ready?'connected':'connecting';
    connect();return api;}
  // ----- public game list: one retained ad per host, cleared by the last will
  const lobby={c:null,ads:new Map(),subs:new Set(),mine:{}};
  const lobbyList=()=>[...lobby.ads].map(([id,ad])=>({peer:id,isMe:id===myId,sameTab:id===myId,presence:ad}));
  const lobbyConn=()=>{if(!lobby.c){const c=lobby.c=conn({topic:ROOT+'/lobby/'+myId,payload:'',retain:true});c.sub(ROOT+'/lobby/+');
      c.onmsg=(t,p)=>{const id=t.slice(t.lastIndexOf('/')+1);if(!p)lobby.ads.delete(id);else{try{lobby.ads.set(id,JSON.parse(p));}catch(e){}}lobby.subs.forEach(f=>{try{f({peers:lobbyList()});}catch(e){}});};
      c.onready=()=>{if(lobby.mine.h)c.pub(ROOT+'/lobby/'+myId,JSON.stringify(lobby.mine),true);};}return lobby.c;};
  // ----- rooms
  async function join(name){
    const T=ROOT+'/r/'+String(name).toLowerCase().replace(/[^a-z0-9-]/g,''),c=conn({topic:T,payload:JSON.stringify({i:myId,bye:1}),retain:false});
    await Promise.race([c.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('no broker')),12000))]).catch(e=>{c.close();throw e;});
    const peers=new Map(),subs=new Set(),me={};let pend={},flushT=0,done=false;
    const list=()=>[{peer:myId,presence:me,sameTab:true,isMe:true},...[...peers.values()].map(r=>({peer:r.peer,presence:r.presence,sameTab:false,isMe:false}))];
    const emit=()=>{const L=list();subs.forEach(f=>{try{f({peers:L});}catch(e){console.error(e);}});};
    const send=m=>c.pub(T,JSON.stringify(Object.assign({i:myId},m)));
    c.onmsg=(t,p)=>{let m;try{m=JSON.parse(p);}catch(e){return;}if(!m||m.i===myId||t!==T)return;
      if(m.bye){if(peers.delete(m.i))emit();return;}
      let r=peers.get(m.i);if(!r){r={peer:m.i,presence:{},seen:0};peers.set(m.i,r);}r.seen=Date.now();if(m.p)Object.assign(r.presence,m.p);
      if(m.h)send({p:me,f:1});emit();};
    c.sub(T);send({h:1,p:me});c.onready=()=>{send({h:1,p:me});};
    const tick=setInterval(()=>{if(done)return;send({p:me,f:1});const now=Date.now();let ch=false;for(const [id,r] of peers)if(now-r.seen>9000){peers.delete(id);ch=true;}if(ch)emit();},2000);
    return{presence(o){Object.assign(me,o);Object.assign(pend,o);if(!flushT)flushT=setTimeout(()=>{flushT=0;const p=pend;pend={};send({p});},110);return Promise.resolve();},
      onPeers(cb){subs.add(cb);setTimeout(()=>cb({peers:list()}),0);return()=>subs.delete(cb);},peers:list,state:()=>c.state(),
      leave(){if(done)return;done=true;clearInterval(tick);clearTimeout(flushT);try{send({bye:1});}catch(e){}setTimeout(()=>c.close(),150);subs.clear();}};}
  return{ok,join,
    presence(ad){Object.assign(lobby.mine,ad);const c=lobbyConn();c.pub(ROOT+'/lobby/'+myId,lobby.mine.h==null?'':JSON.stringify(lobby.mine),true);return Promise.resolve();},
    peers(){lobbyConn();return lobbyList();},
    onPeers(cb){lobby.subs.add(cb);return()=>lobby.subs.delete(cb);}};
})();
