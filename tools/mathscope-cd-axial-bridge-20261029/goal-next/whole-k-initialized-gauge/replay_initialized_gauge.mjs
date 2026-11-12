import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [next,out]=process.argv.slice(2);
assert.ok(next&&out);
const sha=x=>createHash('sha256').update(x).digest('hex');
const pins={
  primary:['whole-k-primary-potential-c3/initialized-primary-potential-c3.json','6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'],
  primaryCheck:['whole-k-primary-potential-c3/initialized-primary-potential-c3-readback.json','ef5e4d6b975915acc25bb7c3de8e56bba2f4b51fe3282efdbd80c687519045b3'],
  mean:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  meanCheck:['whole-k-annular-pressure-lower/lower-pressure-readback.json','978147e13651ac33afe12b98872ae3f5300b52eca977d56b9d06e083f97134d7'],
  sharp:['whole-k-annular-mean-sharp/directional-mean-proof.json','6a3bda9be88fd2c3b525a5393b470afff753b94b72d39d35e68c683f62758792'],
  fixed:['whole-k-annular-mean-sharp/fixed-operators.json','e0ca526ca37d3697a655a419af9386d1e6e291a228e05f26e30a73225b3e9633'],
  slow:['whole-k-annular-slow/annular-slow-jet-bounds.json','3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69'],
  transport:['whole-k-annular-initial/stage-zero-annular-transport.json','c9478f9ed4a517061ab1da9e04814e3583af47f1573b1a5c9a9e7d86917df0b6'],
  pressure:['whole-k-angular-pressure/initialized-angular-pressure.json','b4f45002e74e8fc397d9a43079ba2e5fa958bfe68a355f37d4a006f6f8b08e0d'],
  pressureCheck:['whole-k-angular-pressure/initialized-angular-pressure-readback.json','9e6c6a0789f885e05990723b78f1fa0255e8558d46d04a65c4163d66246dce0d']
};
const inputs={};
for(const [key,[name,hash]] of Object.entries(pins)){
  const b=await readFile(resolve(next,name));
  assert.equal(sha(b),hash,key);
  inputs[key]=JSON.parse(b);
}
for(const k of ['primary','mean','pressure'])assert.equal(inputs[k+'Check'].receiptSHA256,pins[k][1]);
const sourceSHA=inputs.primary.sourceSHA256;
assert.equal(inputs.mean.sourceSHA256,sourceSHA);
assert.equal(inputs.pressure.sourceSHA256,sourceSHA);
assert.equal(inputs.transport.graph.fullHostedSHA256,sourceSHA);
assert.deepEqual(inputs.mean.nativeMean.temporal,[1706770,1706773,1706624,1706782]);
assert.deepEqual(inputs.mean.nativeMean.actualFiveMap,[3614778,3614789,3614767,3614771]);
assert.equal(inputs.sharp.lineage.earlyNonzeroHaarEz,643882);
assert.equal(inputs.sharp.lineage.earlyNonzeroHaarEtheta,643867);

const nodes=[],memo=new Map();
const node=(op,args)=>{
  const key=JSON.stringify([op,args]);
  if(!memo.has(key)){memo.set(key,nodes.length);nodes.push({op,args});}
  return memo.get(key);
};
const q=(n,d=1)=>node('rational',[String(n),String(d)]),zero=q(0),one=q(1);
const add=(...a)=>{
  const x=a.filter(i=>i!==zero).sort((a,b)=>a-b);
  return x.length===0?zero:x.length===1?x[0]:node('add',x);
};
const mul=(...a)=>{
  if(a.includes(zero))return zero;
  const x=a.filter(i=>i!==one).sort((a,b)=>a-b);
  return x.length===0?one:x.length===1?x[0]:node('multiply',x);
};
const pow=(x,n)=>n===0?one:n===1?x:node('integer_power',[x,n]);
const max=(...x)=>node('maximum',[...new Set(x)].sort((a,b)=>a-b));
const inv=x=>x===one?one:node('inverse',[x]);
const exp=x=>x===zero?one:node('exp',[x]);
const source=(kind,id)=>node('authenticated_source_norm_root',[kind,id]);
const original=id=>source('hosted-original',id);
const mean=id=>source('initialized-mean-positive',id);
const primary=id=>source('initialized-primary-positive',id);
const fixed=id=>source('fixed-radial',id);
const R=original(216823),h=original(9),ell=original(617432),log2=original(127),Rinv=mul(q(2),R);
const dyadic=x=>exp(mul(x,add(ell,q(17)),log2));
const epsInv=dyadic(h);
const m=inputs.mean.intermediate,c3=inputs.primary.intermediate,a=mean(m.aFast),ap=mul(q(4),R,a),app=mul(q(12),pow(R,2),a);
const ciInv=mean(m.originalCi0InverseUpper);
const orderIndex=(s,v)=>c3.orders.findIndex(([x,y])=>s===x&&v===y);
const C0=max(...c3.coefficient.map(x=>primary(x[orderIndex(0,0)])));
const C1=max(...c3.coefficient.map(x=>primary(x[orderIndex(1,0)])));
const amp0=max(...c3.amplitude.map(x=>primary(x[orderIndex(0,0)])));
const sigma=m.partitionSeedSigma.map(BigInt);
assert.equal(sigma.length,8);
const chi=sigma.map((x,j)=>q(x*2n**BigInt(35*j)));
const rema0=add(mul(q(2),C1),mul(R,C0));
const leading=chi.slice(0,7).map(x=>mul(x,amp0));
const remainder=chi.slice(0,7).map((x,j)=>add(mul(x,rema0),mul(a,chi[j+1],C0)));
const binom6=[1,6,15,20,15,6,1];
const W6=mul(q(162),pow(q(4),26),q(1,2),add(...binom6.map((b,j)=>
  mul(q(b),add(mul(leading[j],leading[6-j]),mul(remainder[j],remainder[6-j]))))));
function W(j,d){
  if(j===6){
    assert.equal(d,0,'the new L6 source is needed only at value order');
    return W6;
  }
  const id=inputs.mean.roots.covarianceByTransverseAndSlowOrder[j][d];
  assert.ok(Number.isInteger(id));
  return mean(id);
}
const [T00,T01]=inputs.fixed.unweighted[0].rows.slice(0,2).map(r=>fixed(r.T));
const [T10,T11]=inputs.fixed.unweighted[1].rows.slice(0,2).map(r=>fixed(r.T));
const [whole0,whole1]=m.rawWholeShiftedFixedRoots.slice(0,2).map(fixed);
const [chiZ0,chiZ1]=m.earlyPressureChiZJets.slice(0,2).map(mean);
function earlyEz(j,d){
  const source0=add(mul(q(2),Rinv,W(j,0)),W(j,1));
  const sourceZ0=add(mul(q(2),Rinv,W(j,1)),W(j,2));
  if(d===0){
    return add(mul(q(3),W(j,1)),mul(a,W(j+1,0)),mul(Rinv,W(j,0)),mul(T00,sourceZ0),mul(chiZ0,whole0,source0));
  }
  assert.equal(d,1);
  const source1=add(sourceZ0,mul(q(2),pow(Rinv,2),W(j,0)));
  const sourceZ1=add(mul(q(2),Rinv,W(j,2)),mul(q(2),pow(Rinv,2),W(j,1)),W(j,3));
  return add(mul(q(3),W(j,2)),mul(a,W(j+1,1)),mul(ap,W(j+1,0)),mul(Rinv,W(j,1)),mul(pow(Rinv,2),W(j,0)),
    mul(T01,max(sourceZ0,sourceZ1)),mul(chiZ1,whole0,source0),mul(chiZ0,whole1,max(source0,source1)));
}
const earlyEtheta=j=>add(mul(q(2),W(j,1)),mul(a,W(j+1,0)),mul(q(2),Rinv,W(j,0)));
const ez30=earlyEz(3,0),ez50=earlyEz(5,0),ez00=earlyEz(0,0),ez01=earlyEz(0,1),ez10=earlyEz(1,0);
const etheta00=earlyEtheta(0),etheta20=earlyEtheta(2),etheta40=earlyEtheta(4);
const anisotropic=(a,b)=>add(mul(q(85,6),a),mul(q(85,216),b));
const psiLLL=mul(T10,ciInv,anisotropic(ez30,ez50)),vLL=mul(ciInv,anisotropic(etheta20,etheta40));
const temporal=Object.fromEntries(Object.entries(inputs.mean.roots.temporalBounds).map(([k,v])=>[k,v.map(mean)]));
const five=Object.fromEntries(Object.entries(inputs.mean.roots.fiveMapBounds).map(([k,v])=>[k,v.map(mean)]));
const psiSpatial=[
  temporal.psi[0],
  add(temporal.psi[1],mul(a,temporal.psiL[0])),
  add(temporal.psi[2],mul(q(2),a,temporal.psiL[1]),mul(pow(a,2),temporal.psiLL[0]),mul(ap,temporal.psiL[0])),
  add(temporal.psi[3],mul(q(3),a,temporal.psiL[2]),mul(q(3),pow(a,2),temporal.psiLL[1]),mul(pow(a,3),psiLLL),
    mul(q(3),ap,temporal.psiL[1]),mul(q(3),a,ap,temporal.psiLL[0]),mul(app,temporal.psiL[0]))
];
// The original physical time operator is -partial_T+(c_i0/epsilon)N.
// Apply NN^-1 P_perp=P_perp, so the exact c_i0 cancels. The factor two
// bounds subtracting the complete normalized Haar mean.
const psiTime=add(temporal.psi[1],mul(q(2),epsInv,T10,ez00));
const psiTimeMixed=add(temporal.psi[2],mul(a,temporal.psiL[1]),
  mul(q(2),epsInv,add(mul(T11,max(ez00,ez01)),mul(a,T10,ez10))));
const psiAll=psiSpatial.map((x,j)=>add(j===1?max(x,psiTime):j===2?max(x,psiTimeMixed):x,five.psi[j]));
const vSpatial=[temporal.v[0],add(temporal.v[1],mul(a,temporal.vL[0])),
  add(temporal.v[2],mul(q(2),a,temporal.vL[1]),mul(pow(a,2),vLL),mul(ap,temporal.vL[0]))];
const vTime=add(temporal.v[1],mul(q(2),epsInv,etheta00));
const vAll=vSpatial.map((x,j)=>add(j===1?max(x,vTime):x,five.v[j]));

function absoluteTerms(rows,envelopes){
  return add(...rows.map(({mappedOrder,radiusEnvelopePower,coefficient})=>{
    const [n,d='1']=coefficient.split('/');
    return mul(q(n,d),pow(R,radiusEnvelopePower),envelopes[mappedOrder]);
  }));
}
const physicalExponent=(twiceBase,z)=>mul(dyadic(add(q(twiceBase,2),h)),inv(dyadic(mul(q(z),h))));
const gauge={},direct={},all={},componentRows={};
for(const [key,record] of Object.entries(inputs.transport.atoms)){
  const [name,which]=key.split('@'),orders=which.split(',').map(Number);
  if(name==='p'){
    const id=inputs.pressure.roots.stageZeroPressureAtoms[key];
    assert.ok(Number.isInteger(id));
    all[key]=source('initialized-pressure-positive',id);
    continue;
  }
  const slow=source('slow-background-atom',key);
  assert.ok(inputs.slow.slowFieldAtomIntervals[key]);
  if(name==='b'){
    const [s,z,t]=orders;
    assert.ok(t===0||s===0&&z===0&&t===1);
    const meanRoot=mul(physicalExponent(2+2*s+z+2*t,z),absoluteTerms(record.mean,vAll));
    direct[key]=add(slow,meanRoot);
    all[key]=direct[key];
    componentRows[key]={slow,mean:meanRoot};
    continue;
  }
  const [x,y,z,t]=orders,degree=x+y+z+t;
  assert.ok(t===0||t===1&&degree<=2);
  const wave=primary(inputs.primary.roots.physicalPrimary[key]);
  if(name==='A2'){
    assert.deepEqual(record.mean,[]);
    assert.deepEqual(inputs.slow.slowFieldAtomIntervals[key].exactInterval,['0','0']);
    gauge[key]=wave;
    componentRows[key]={primary:wave,otherComponentsZero:true};
  }else{
    const meanRoot=mul(physicalExponent(x+y+z+2*t,z),absoluteTerms(record.mean,psiAll));
    gauge[key]=add(slow,meanRoot,wave);
    componentRows[key]={slow,mean:meanRoot,primary:wave};
  }
  all[key]=gauge[key];
}
assert.equal(Object.keys(gauge).length,57);
assert.equal(Object.keys(direct).length,6);
assert.equal(Object.keys(all).length,67);
const output={schema:'MathScope.N7.ActualCompleteInitializedStageZeroAtoms/1',pins,sourceSHA256:sourceSHA,
  source:{gaugeTemporal:1706770,gaugeFiveMap:3614778,directTemporal:1706624,directFiveMap:3614767,earlyEzNonzeroHaar:643882,
    earlyEthetaNonzeroHaar:643867,actualInitializedPressure:3859821,primaryPotentialSystems:inputs.primary.native.nativePotentialSystems},
  intermediate:{W6,chi7:chi[7],ez30,ez50,ez00,ez01,ez10,etheta00,etheta20,etheta40,psiLLL,vLL,psiTime,psiTimeMixed,vTime,
    psiSpatial,vSpatial,psiAll,vAll,componentRows},
  roots:{gauge,direct,all},nodes,graphSHA256:sha(JSON.stringify(nodes)),
  scope:{all67OriginalInitializedAtomsBoundConditionally:true,all57InitializedGaugeAtomsBoundConditionally:true,
    all6InitializedDirectAtomsBoundConditionally:true,numericalNormEvaluation:false,laterStagesIncluded:false,finalJets:'0/67',release:'HOLD'}};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS all 67 actual initialized stage-zero atom bounds, including all 57 gauge and six direct atoms.');
console.log(JSON.stringify({nodes:nodes.length,graphSHA256:output.graphSHA256,initialAtoms:67,fileSHA256:sha(await readFile(out))}));
