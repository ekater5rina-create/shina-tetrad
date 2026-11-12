const CACHE='tetrad-v6';
const FILES=['./','./index.html','./style.css','./territory.css','./notebook.css','./print.css','./print.js','./territory-mark.svg','./app.js?v=6','./core.js','./catalog.js','./catalog-picker.js?v=6','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('tetrad-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 // Revalidate the HTTP cache too, so stale modules cannot survive ordinary reloads.
 const network=fetch(event.request,{cache:'no-cache'});
 event.waitUntil(network.then(response=>{
  if(response.ok){const copy=response.clone();return caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
 }).catch(()=>{}));
 event.respondWith(network.catch(async()=>{
  const exact=await caches.match(event.request);if(exact)return exact;
  if(event.request.mode==='navigate')return (await caches.match(new URL('./',self.registration.scope)))||Response.error();
  return Response.error();
 }));
});
