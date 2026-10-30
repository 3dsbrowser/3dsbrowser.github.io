/* Cross-origin isolation for static hosts (GitHub Pages): a service worker adds COOP/COEP headers so the page
   gets SharedArrayBuffer and shared WebAssembly.Memory (needed for threads). Registers itself, then reloads once. */
if(typeof window==='undefined'){
 self.addEventListener('install',()=>self.skipWaiting());
 self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
 self.addEventListener('fetch',e=>{const r=e.request;if(r.cache==='only-if-cached'&&r.mode!=='same-origin')return;
  e.respondWith(fetch(r).then(res=>{if(res.status===0)return res;const h=new Headers(res.headers);
   h.set('Cross-Origin-Embedder-Policy','require-corp');h.set('Cross-Origin-Opener-Policy','same-origin');h.set('Cross-Origin-Resource-Policy','cross-origin');
   return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});}).catch(err=>{console.error(err);return Response.error();}));});
}else(()=>{
 if(window.crossOriginIsolated||!window.isSecureContext||!('serviceWorker' in navigator))return;
 let tried=false;try{tried=sessionStorage.getItem('coi-tried')==='1';}catch(e){}
 if(tried)return;
 navigator.serviceWorker.register(document.currentScript.src).then(reg=>{
  try{sessionStorage.setItem('coi-tried','1');}catch(e){}
  if(reg.active&&!navigator.serviceWorker.controller)location.reload();
  else reg.addEventListener('updatefound',()=>{const w=reg.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='activated')location.reload();});});
 }).catch(e=>console.warn('COI service worker failed',e));
})();
