const V='soim-informes-v2';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const JS='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all([
    c.addAll(CORE),
    fetch(JS,{mode:'no-cors'}).then(r=>c.put(JS,r)).catch(()=>{})
  ])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
// Archivos propios: primero internet (siempre la versión nueva); si no hay señal o tarda más de 4 s, usa la copia guardada.
function netFirst(req){
  return new Promise(res=>{
    let done=false;
    const t=setTimeout(()=>{caches.match(req,{ignoreSearch:true}).then(m=>{if(m&&!done){done=true;res(m)}})},4000);
    fetch(new Request(req.url,{cache:'no-store'})).then(r=>{
      clearTimeout(t);
      if(r&&r.ok){const copy=r.clone();caches.open(V).then(c=>c.put(req,copy))}
      if(!done){done=true;res(r)}
    }).catch(()=>{
      clearTimeout(t);
      caches.match(req,{ignoreSearch:true}).then(m=>{if(!done){done=true;res(m||Response.error())}});
    });
  });
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin===self.location.origin){e.respondWith(netFirst(e.request));return}
  // Librería externa (jsPDF): copia guardada primero
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(m=>m||fetch(e.request).then(r=>{
    if(r&&(r.ok||r.type==='opaque')){const copy=r.clone();caches.open(V).then(c=>c.put(e.request,copy))}
    return r;
  })));
});
