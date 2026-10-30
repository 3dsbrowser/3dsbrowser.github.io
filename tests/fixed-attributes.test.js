const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(process.argv[2]||'index.html','utf8');
const script=id=>html.split('<script id="'+id+'">')[1].split('</script>')[0];
const c={console};vm.createContext(c);vm.runInContext(script('shader-code'),c);c.PICARaster={};vm.runInContext(script('pica-code'),c);
const g=new c.PICA200.GPU(),R=g.regs;
// Independent encoding of four float24 components in hardware FIFO order.
function pack(v){const [x,y,z,w]=v;return [((w<<8)|(z>>>16))>>>0,((z<<16)|(y>>>8))>>>0,((y<<24)|x)>>>0];}
const raw=[0x3f0000,0x400000,0x408000,0x410000],expected=[1,2,3,4];
g.writeReg(0x232,1);for(const [i,w] of pack(raw).entries())g.writeReg(0x233+i,w);
assert.deepStrictEqual(Array.from(g.fixedAttributes[1]),expected);assert.equal(g.fixedAttributeIndex,2);
// Next FIFO triplet auto-increments, even when all words use the same port.
for(const w of pack(raw.map(x=>x|0x800000)))g.writeReg(0x233,w);
assert.deepStrictEqual(Array.from(g.fixedAttributes[2]),[-1,-2,-3,-4]);
g.writeReg(0x232,4);g.writeReg(0x233,0xffffffff);g.writeReg(0x232,1);for(const w of pack(raw))g.writeReg(0x235,w);
assert.deepStrictEqual(Array.from(g.fixedAttributes[1]),expected);
R[0x202]=(1<<28)|(1<<17);R[0x2bb]=0x30; // attr1 fixed, mapped to shader input3
assert.deepStrictEqual(Array.from(g.readVertex(0,{})[3]),expected);
// A fixed attribute listed before an array attribute still consumes its stride.
R[0x200]=0x20000000>>>3;R[0x201]=0xff;R[0x204]=0x01;R[0x205]=(2<<28)|(32<<16);
const mem={pages:new Map(),read32(a){return new DataView(this.pages.get(a&~4095).data.buffer).getUint32(a&4095,true);}};
const bytes=new Uint8Array(4096),dv=new DataView(bytes.buffer);mem.pages.set(0x14000000,{data:bytes,permissions:'r'});
for(let k=0;k<4;k++)dv.setFloat32(16+k*4,10+k,true);
assert.deepStrictEqual(Array.from(g.readVertex(0,mem)[0]),[10,11,12,13]);
// CPU fast vertex path receives the identical fixed and array inputs.
R[0x2bd]=1;R[0x50]=0x03020100;
const a=html.indexOf('const FV={'),b=html.indexOf('function drawGL(',a);
vm.runInContext('let VST=10,vdata=new Float32Array(300);const ZS={on:false};const stats={};\n'+html.slice(a,b),c);
let seen=[];const shader={runRaw(input){seen.push(input.map(v=>Array.from(v)));return [0,0,0,1];}};
assert.equal(c.fastVertices(g,mem,[0,0,0],shader,0,0,0,4,4,8,8),3);
assert.deepStrictEqual(seen[0][3],expected);assert.deepStrictEqual(seen[0][0],[10,11,12,13]);assert.equal(seen.length,1);
// Raw GPU path must upload the fixed generic attributes, and cache unchanged values.
const start=html.indexOf('const hwF='),end=html.indexOf('const progKeys=',start),calls=[];
const gl=new Proxy({vertexAttrib4f:(...x)=>calls.push(x)}, {get(o,k){return k in o?o[k]:(()=>{});}});
const hw={ready:true,en:0,iv:new Int32Array(16),vbo:{},ring:{vs:1024,vo:0,is:1024,io:0,init:true,pk:new Int32Array(80)},buf:new Uint8Array(32),i16:new Uint16Array(3)};
const d={fields:[],blocks:[],dst:[],total:0,cnt:3,prim:0,kx:1,bx:0,ky:1,by:0};
Object.assign(c,{gl,HW:hw,GC:{},HW_GLT:()=>[],ZS:{on:false},stats:{}});
vm.runInContext(html.slice(start,end),c);
const p={hw:{uver:0,sh:null,iv:new Int32Array(16),bm:0,clip:'1,0,1,0',z:'0,0,0'}},sh={uniforms:null,ints:[],bools:[]};
c.hwDraw(g,p,d,sh);assert(calls.some(x=>x.join(',')==='3,1,2,3,4'));calls.length=0;c.hwDraw(g,p,d,sh);assert.equal(calls.length,0);
g.fixedAttributes[1]=[4,3,2,1];c.hwDraw(g,p,d,sh);assert.deepStrictEqual(calls,[[3,4,3,2,1]]);
// Worker-pool producer must include fixed input registers beyond the array registers.
c.performance={now:()=>0};vm.runInContext(`VP.tried=VP.ready=true;VP.K=1;
VP.ctl=new Int32Array(16+VP.S*16);VP.CODE=new Uint32Array(VP.S*4096);VP.DESC=new Uint32Array(VP.S*128);
VP.UNI=new Float64Array(VP.S*384);VP.INTS=new Int32Array(VP.S*16);VP.BOOLS=new Int32Array(VP.S*16);
VP.INB=new Float32Array(VP.S*VP.CAP*64);VP.PAR=new Float64Array(VP.S*8);VP.SEM=new Int32Array(VP.S*24);
for(let i=0;i<VP.S;i++)VP.slotIdx.push(new Int32Array(0));globalThis.pool=VP;`,c);
const poolShader={code:new Uint32Array(1),descs:new Uint32Array(128),entry:0,uniforms:[],bools:[],ints:[]};
assert.equal(c.fastVerticesPool(g,mem,Array.from({length:42},(_,i)=>i),poolShader,0,0,0,4,4,8,8,10),42);
assert.deepStrictEqual(Array.from(c.pool.INB.slice(12,16)),[4,3,2,1]);
console.log('PASS: fixed float24 FIFO, reset/increment, permutation, stride, CPU/GPU/pool inputs and caching');
