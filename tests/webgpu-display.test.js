const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(process.argv[2]||'index.html','utf8').split('<script id="webgpu-display-code">')[1].split('</script>')[0];
const elements=new Map(),calls=[];let devices=[];
class Canvas{constructor(id){this.id=id;this.width=240;this.height=400;this.context={configure:x=>calls.push(['configure',x]),unconfigure:()=>calls.push(['unconfigure']),getCurrentTexture:()=>({createView:()=>({})})};}cloneNode(){return new Canvas(this.id)}replaceWith(c){elements.set(this.id,c)}getContext(type){return type==='webgpu'?this.context:{}}}
for(const id of ['guest-preview','bottom-preview'])elements.set(id,new Canvas(id));
for(const id of ['webgpu-status','webgpu-toggle'])elements.set(id,{checked:true,textContent:''});
const makeDevice=()=>{let lose;const d={lost:new Promise(r=>lose=r),lose,listeners:{},addEventListener:(name,f)=>d.listeners[name]=f,
 destroy:()=>calls.push(['deviceDestroy']),pushErrorScope:()=>{},popErrorScope:async()=>null,
 createShaderModule:({code})=>{assert(code.includes('@fragment'));return {}},createRenderPipelineAsync:async()=>({getBindGroupLayout:()=>({})}),
 createTexture:desc=>({desc,destroy:()=>calls.push(['textureDestroy']),createView:()=>({})}),createBindGroup:()=>({}),
 createCommandEncoder:()=>({beginRenderPass:()=>({setPipeline:()=>{},setBindGroup:()=>{},draw:n=>calls.push(['draw',n]),end:()=>{}}),finish:()=>({})}),
 queue:{copyExternalImageToTexture:(...a)=>calls.push(['bitmap',...a]),writeTexture:(...a)=>calls.push(['rgba',...a]),submit:()=>calls.push(['submit'])}};devices.push(d);return d;};
const gpu={requestAdapter:async()=>({requestDevice:async()=>makeDevice()}),getPreferredCanvasFormat:()=> 'bgra8unorm'};
const c={document:{getElementById:id=>elements.get(id)},navigator:{gpu},GPUTextureUsage:{TEXTURE_BINDING:1,COPY_DST:2,RENDER_ATTACHMENT:4}};vm.createContext(c);vm.runInContext(source,c);
(async()=>{const w=c.WebGPUDisplay;assert(await w.setEnabled(true));assert(w.active);
 const bmp={width:512,height:512},frame={bitmap:bmp,sx:256,width:240,height:320};const old=elements.get('bottom-preview');
 const out=w.paint(old,frame);assert(out!==old);assert.equal(out.width,240);assert.equal(out.height,320);assert.equal(elements.get('bottom-preview'),out);
 const copy=calls.find(x=>x[0]==='bitmap');assert.equal(copy[1].origin.x,256);assert.equal(copy[1].source,bmp);assert.equal(copy[3].join(','),'240,320');
 assert.equal(w.paint(out,frame),out);assert.equal(calls.filter(x=>x[0]==='configure').length,1);
 w.paint(elements.get('guest-preview'),{width:2,height:2,rgba:new ArrayBuffer(16)});assert(calls.some(x=>x[0]==='rgba'&&x[3].bytesPerRow===8));
 assert.equal(w.stats.frames,3);assert(calls.filter(x=>x[0]==='draw').every(x=>x[1]===3));
 await w.setEnabled(false);assert(!w.active);assert.notEqual(elements.get('bottom-preview'),out);assert.equal(w.paint(out,frame),null);
 c.navigator.gpu=undefined;assert.equal(await w.setEnabled(true),false);assert.match(elements.get('webgpu-status').textContent,/unavailable/);
 c.navigator.gpu=gpu;await w.setEnabled(true);w.paint(elements.get('guest-preview'),frame);devices.at(-1).listeners.uncapturederror({error:new Error('GPU validation failed')});
 assert(!w.active);assert.match(w.stats.error,/validation/);assert.equal(elements.get('webgpu-toggle').checked,false);
 await w.setEnabled(true);const d=devices.at(-1);d.lose({message:'adapter removed'});await Promise.resolve();assert(!w.active);assert.match(w.stats.error,/device lost/);
 // A late adapter result cannot reactivate WebGPU after switching it off.
 let resolveAdapter;c.navigator.gpu={...gpu,requestAdapter:()=>new Promise(r=>resolveAdapter=r)};const pending=w.setEnabled(true);await w.setEnabled(false);resolveAdapter({requestDevice:async()=>makeDevice()});assert.equal(await pending,false);assert(!w.active);
 console.log('PASS: WebGPU bitmap and RGBA upload, target reuse, disable, unavailable adapter, validation error, device loss, cancellation');
})().catch(e=>{console.error(e);process.exitCode=1});
