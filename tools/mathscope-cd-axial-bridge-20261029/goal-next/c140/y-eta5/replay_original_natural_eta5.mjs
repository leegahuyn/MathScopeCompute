/** Exercise the actual natural-series entry points, then build a symbolic eta5 control. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, reachFile, out]=process.argv.slice(2);
assert.ok(runtime && reachFile && out);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function pinned(file,expected){
  const raw=fs.readFileSync(file);
  assert.equal(hash(raw),expected,file);
  return raw;
}
const pins={
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  'actual-continuation-exact-tail.mjs':'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
  'source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
};
for(const [name,sha] of Object.entries(pins))pinned(path.join(runtime,name),sha);
const reachSHA='e7a22f8745f4c80bf72d165d6372b20043bab5b5e43d929f58807d42f115a295';
const reach=JSON.parse(pinned(reachFile,reachSHA));
const publicApi=await import(pathToFileURL(path.join(runtime,'actual-continuation-exact-functions.mjs')).href);
const core=await import(pathToFileURL(path.join(runtime,'actual-continuation-exact-core.mjs')).href);
const tail=await import(pathToFileURL(path.join(runtime,'actual-continuation-exact-tail.mjs')).href);
const cases=reach.calls.filter(x=>x.m>4||x.k>4);
assert.equal(cases.length,25);
assert.equal(cases.filter(x=>x.k===0&&x.m===5).length,19);
assert.equal(cases.filter(x=>x.k===1&&x.m===5).length,6);

function rejected(what,f) {
  try { f(); } catch(e) { assert.equal(e.code,'RESOURCE_LIMIT',what); return e.code; }
  throw new Error(what+' unexpectedly accepted');
}
const degree=2, Y='5', bits=128;
const groups=[];
for(const component of ['Phi','u','average']) for(const radialOrder of [0,1]){
  const ids=cases.filter(x=>x.component===component&&x.k===radialOrder).map(x=>x.id);
  if(!ids.length)continue;
  const input={component,degree,Y,radialOrder,etaOrder:5};
  const rejects={
    nativeSymbolicMaterialization:rejected('fifth eta',()=>publicApi.materializeActualNaturalSeries(input)),
    nativeUniformModulus:rejected('fifth eta',()=>tail.actualNaturalRefinementModulus({bits,radialOrder,etaOrder:5})),
  };
  const supported=publicApi.materializeActualNaturalSeries({...input,etaOrder:4});
  const {G,coefficients,rootFields}=core.prepareActualNaturalCoreProgram({degree});
  const {eta,Y:y}=rootFields;
  const differ=(row,n)=>{let x=row;for(let j=0;j<n;j++)x=G.derivative(x,eta);return x;};
  const partial=rows=>{
    let sum=G.zero;
    for(let n=radialOrder;n<=degree;n++){
      let factor=1n;
      for(let j=0;j<radialOrder;j++)factor*=BigInt(n-j);
      sum=G.add(sum,G.mul(G.q(factor),rows[n],G.pow(y,n-radialOrder)));
    }
    return sum;
  };
  const rows4=coefficients[component].map(row=>differ(row,4));
  const p4=partial(rows4);
  assert.equal(p4,supported.roots.actualPartial);
  assert.deepEqual(G.nodes.slice(0,p4+1),supported.nodes.slice(0,p4+1));
  const repeated=G.derivative(p4,eta);
  const direct=partial(coefficients[component].map(row=>differ(row,5)));
  assert.equal(direct,repeated);
  const m5Tail=tail.actualNaturalScaledTail({degree,Y,radialOrder,etaOrder:5});
  groups.push({
    component,radialOrder,etaOrder:5,ids,rejects,
    materializedOriginalEta4:p4,generatedEta5:direct,nativeEta5Tail:m5Tail,
    coefficientGraphNodes:G.nodes.length,
    sameEta5FromTwoPaths:true,graphSHA256:hash(JSON.stringify(G.nodes)),
  });
}
assert.deepEqual(groups.flatMap(x=>x.ids).sort((a,b)=>a-b),cases.map(x=>x.id));
const demo=tail.actualNaturalScaledTail({degree:10000,Y:'4',radialOrder:0,etaOrder:0});
const [numerator,denominator]=demo.scaledTailUpper.split('/');
assert.equal(demo.firstTerm,'1/'+(5n**10001n*10002n**2n));
const exponent=3*10001+28;
assert.ok(BigInt(numerator)*2n**BigInt(exponent)>BigInt(denominator));
assert.ok(reach.calls.some(x=>x.id===4468&&x.component==='Phi'&&x.y===474&&x.k===0&&x.m===0));
const result={
  schema:'MathScope.Y.ActiveN3.OriginalNaturalEta5MaterializationControl/1',
  status:'VERIFIED_ORIGINAL_ETA5_SUPPORT_GAP_AND_SAME_COEFFICIENT_SYMBOLIC_ROUTE',
  sourcePins:pins,reachSHA256:reachSHA,sourceEta5Calls:cases.length,degree,tailInputY:Y,
  groups,
  maxTailOnlyDegree:10000,maxOriginalCoefficientDegree:64,
  Y4RawValueControl:{sourceCall:4468,sourceYNode:474,degree:10000,scaledTailSHA256:hash(demo.scaledTailUpper),
    denominatorBitLength:BigInt(denominator).toString(2).length,knownStrictLowerPowerOf2:-exponent},
  scope:'Finite symbolic original coefficients, using original full graph and actual eta4 result. Source APIs untouched. No numeric enclosure of raw actual natural values.',
  finalJets:0,release:'HOLD'
};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
