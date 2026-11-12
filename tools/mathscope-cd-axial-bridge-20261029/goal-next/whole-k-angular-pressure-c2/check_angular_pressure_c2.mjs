import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,hosted,receiptPath,out]=process.argv.slice(2);
assert.ok(next&&hosted&&receiptPath&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
const bytes=await readFile(receiptPath),a=JSON.parse(bytes);
const prior={};
for(const [k,[name,h]] of Object.entries(a.pins)){
  const raw=await readFile(resolve(next,name));
  assert.equal(sha(raw),h);
  prior[k]=JSON.parse(raw);
}
const [transversePath,transverseSHA]=prior.mean.priorReceipts.transverse;
const transverseBytes=await readFile(resolve(next,transversePath));
assert.equal(sha(transverseBytes),transverseSHA);
const transverse=JSON.parse(transverseBytes);
const registry=await readFile(resolve(hosted,'original-source-functions.json'));
assert.equal(sha(registry),a.registrySHA256);
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const reg=decode(decode(registry.toString()).base);
const field=decode(reg.fieldDefinitions)[9],pulse=decode(decode(reg.base).m3GlobalPulses);
assert.equal(field.name,'OriginalAll81InitialAngular_pressure');
assert.equal(field.rows.length,a.native.rows);
assert.deepEqual(pulse.map(x=>x.matrix),a.native.pulseMatrices);
const wanted=new Set([...Object.keys(a.native.sourceRecords).map(Number),3625754,3652129]);
const hash=createHash('sha256'),actual=new Map();
const stream=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
stream.on('data',b=>hash.update(b));
let n=-1;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(wanted.has(n))actual.set(n,JSON.parse(line));
  n++;
}
assert.equal(n,4456994);
assert.equal(hash.digest('hex'),a.sourceSHA256);
for(const [id,node] of Object.entries(a.native.sourceRecords))assert.deepEqual(actual.get(Number(id)),node);
assert.equal(actual.get(3625754).op,'smooth_piecewise');
assert.equal(actual.get(3652129).op,'smooth_piecewise');

// Independent exact sign calculation for two formal commuting derivatives.
// The carrier is fixed. A key is a sorted Laurent monomial with integer coefficient.
const sorted=xs=>[...xs.entries()].filter(([,c])=>c!==0n).sort(([p],[q])=>p.localeCompare(q));
function monomial(coefficient,powers){
  return {coefficient:BigInt(coefficient),powers:Object.fromEntries(Object.entries(powers).filter(([,n])=>n).sort(([x],[y])=>x.localeCompare(y)))};
}
function polynomial(terms){
  const result=new Map();
  for(const {coefficient,powers} of terms){
    const k=JSON.stringify(powers);
    result.set(k,(result.get(k)??0n)+coefficient);
  }
  return sorted(result);
}
const atomicDerivative={
  i:{U:[1,{Ui:1}],sin:[1,{k:1,cos:1,Fi:1}],cos:[-1,{k:1,sin:1,Fi:1}]},
  j:{U:[1,{Uj:1}],Ui:[1,{Uij:1}],Fi:[1,{Fij:1}],sin:[1,{k:1,cos:1,Fj:1}],cos:[-1,{k:1,sin:1,Fj:1}]}
};
function differentiate(terms,axis){
  return terms.flatMap(({coefficient,powers})=>Object.entries(powers).flatMap(([sym,power])=>{
    const d=atomicDerivative[axis][sym];
    if(!d)return [];
    const next={...powers,[sym]:power-1};
    for(const [x,e] of Object.entries(d[1]))next[x]=(next[x]??0)+e;
    return [monomial(coefficient*BigInt(power)*BigInt(d[0]),next)];
  }));
}
const p=[monomial(-1,{U:1,k:-1,sin:1})];
const computed=polynomial(differentiate(differentiate(p,'i'),'j'));
const prescribed=[
  monomial(-1,{k:-1,Uij:1,sin:1}),monomial(-1,{Ui:1,Fj:1,cos:1}),monomial(-1,{Uj:1,Fi:1,cos:1}),
  monomial(-1,{U:1,Fij:1,cos:1}),monomial(1,{k:1,U:1,Fi:1,Fj:1,sin:1})
];
assert.deepEqual(computed,polynomial(prescribed));
const carrierDropped=[...prescribed.slice(0,4),monomial(1,{U:1,Fi:1,Fj:1,sin:1})];
assert.notDeepEqual(computed,polynomial(carrierDropped));

// Independent algebraic source eigenbasis and original palette powers.
const rad=(x,y=0)=>[BigInt(x),BigInt(y)];
const ra=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const rm=(a,b)=>[a[0]*b[0]+2n*a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const dot=(a,b)=>a.reduce((x,y,j)=>ra(x,rm(y,b[j])),rad(0));
const vr=[rad(1),rad(1,-1)],vt=[rad(-1,1),rad(1)],Lambda=rad(4,-1),Tg=rad(4,1);
const J=[[3,1],[1,5]],Jr=J.map(r=>r.map(x=>rad(x)));
assert.deepEqual(Jr.map(r=>dot(r,vr)),vr.map(x=>rm(Lambda,x)));
assert.deepEqual(Jr.map(r=>dot(r,vt)),vt.map(x=>rm(Tg,x)));
assert.deepEqual(dot(vr,vt),rad(0));
assert.deepEqual(dot(vr,vr),rad(4,-2));
assert.deepEqual(dot(vt,vt),rad(4,-2));
const times=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,v,i)=>s+v*B[i][j],0)));
const powers=[[[1,0],[0,1]]];
for(let i=1;i<=4;i++)powers.push(times(powers[i-1],J));
assert.deepEqual(powers,transverse.source.commonCover.integerMatrices);
// T_g exponents in v_t are i0+delta-i_label, with i_label=i0+delta.
const exponents={i0:[1,0],delta:[0,1],iLabel:[1,1]};
const collapse=terms=>[0,1].map(j=>terms.reduce((x,[tag,n])=>x+n*exponents[tag][j],0));
assert.deepEqual(collapse([['i0',1],['delta',1],['iLabel',-1]]),[0,0]);
assert.notDeepEqual(collapse([['i0',1],['delta',1],['i0',-1]]),[0,0]);
// In Cartesian axes at theta=0, multiply the horizontal Hessian by R².
// For f=R the only nonzero entry is R²*f_yy=R. For f=R sin(theta)=y
// the two contributions to the mixed derivative cancel exactly.
const polar=(R,dr,drr,dtheta,drtheta,dthetatheta,mixedConnectionSign=-1)=>[R*R*drr,R*drtheta+mixedConnectionSign*dtheta,dthetatheta+R*dr];
assert.deepEqual(polar(2,1,0,0,0,0),[0,0,2]);
assert.deepEqual(polar(2,0,0,2,1,0),[0,0,0]);
assert.notDeepEqual(polar(2,0,0,2,1,0,1),[0,0,0]);
const axis={x:[1,0],y:[1,0],z:[1,-1],t:[2,0]}; // Twice the constant exponent, and its h coefficient.
const requested={xx:[2,2],xz:[2,1],xt:['5/2',2],zz:[2,0],zt:['5/2',1],tt:[3,2]};
for(const [pair,[constant,h]] of Object.entries(requested)){
  const x=axis[pair[0]],y=axis[pair[1]];
  const twice=2+x[0]+y[0];
  assert.equal(constant,twice%2===0?twice/2:twice+'/2');
  assert.equal(h,2+x[1]+y[1]);
}
assert.deepEqual(a.intermediate.physicalExponentByClass,requested);

const nodes=a.nodes,intermediate=a.intermediate,predicate=[];
const deps=({op,args})=>op==='rational'||op==='authenticated_source_norm_root'?[]:op==='integer_power'?[args[0]]:args;
const fg=new Set(prior.bg.bounds.flatMap(x=>[x.F,x.G]));
for(const [i,node] of nodes.entries()){
  assert.ok(deps(node).every(j=>Number.isSafeInteger(j)&&j>=0&&j<i));
  const {op,args}=node;
  switch(op){
    case 'rational':
      assert.ok(BigInt(args[0])>=0n&&BigInt(args[1])>0n);
      predicate.push(BigInt(args[0])>0n);
      break;
    case 'authenticated_source_norm_root': {
      const [ns,id]=args;
      assert.ok(ns==='hosted-original'?Object.hasOwn(prior.mean.nativeSourceRecords,id):
        ns==='initialized-mean-positive'?Boolean(prior.mean.nodes[id]):ns==='background-c8'&&fg.has(id));
      predicate.push(true);
      break;
    }
    case 'add':case 'maximum':predicate.push(args.some(j=>predicate[j]));break;
    case 'multiply':predicate.push(args.every(j=>predicate[j]));break;
    case 'inverse':assert.equal(predicate[args[0]],true);predicate.push(true);break;
    case 'sqrt_positive':predicate.push(predicate[args[0]]);break;
    case 'integer_power':assert.ok(Number.isSafeInteger(args[1])&&args[1]>0);predicate.push(predicate[args[0]]);break;
    case 'exp':predicate.push(true);break;
    default:assert.fail(op);
  }
}
const expected='5e40ee71773ba0508b04e3295253e35c2b02e74184f520f4e29a11c3e03032f9';
assert.equal(nodes.length,2102);
assert.equal(a.graphSHA256,expected);
assert.equal(sha(JSON.stringify(nodes)),expected);
const hessian=a.roots.physicalHessian;
assert.deepEqual(Object.keys(hessian),['xx','xy','yy','xz','yz','xt','yt','zz','zt','tt']);
assert.ok(Object.values(hessian).every(j=>predicate[j]));
function reachable(root){
  const seen=new Set(),todo=[root];
  while(todo.length){
    const j=todo.pop();
    if(seen.has(j))continue;
    seen.add(j);
    todo.push(...deps(nodes[j]));
  }
  return seen;
}
for(const [key,j] of Object.entries(intermediate.rawSecond)){
  const r=reachable(j);
  assert.ok(r.has(intermediate.phaseTerm[key])&&r.has(intermediate.kUpper),'surviving carrier in '+key);
}
for(const j of [hessian.xx,hessian.xy,hessian.yy]){
  const r=reachable(j);
  assert.ok(r.has(intermediate.chi2)&&r.has(intermediate.aPrime)&&r.has(intermediate.thetaConnection)&&r.has(intermediate.thetaThetaConnection));
}
assert.ok(reachable(hessian.tt).has(intermediate.pulse.wVV));
assert.ok(reachable(hessian.xt).has(intermediate.pulse.wSV));
assert.ok(reachable(hessian.zt).has(intermediate.pulse.wSV));
const output={schema:'MathScope.N7.InitializedAngularPressureC2Readback/1',receiptSHA256:sha(bytes),graphSHA256:expected,
  sourceRows:field.rows.length,sourceNodes:n,arithmeticNodes:nodes.length,physicalHessian:hessian,
  controls:{rejectLostCarrier:true,rejectWrongPolarConnectionSign:true,rejectWrongLongitudinalPaletteIndex:true},independentChecks:['signed product and phase rule','five exact source integer cover powers',
    'physical exponent algebra','live second pulse roots and radial/angular connection reachability']};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS independent signed Hessian, physical exponents, original source lift, and exact positive bound graph.');
console.log('Readback SHA256 '+sha(await readFile(out)));
