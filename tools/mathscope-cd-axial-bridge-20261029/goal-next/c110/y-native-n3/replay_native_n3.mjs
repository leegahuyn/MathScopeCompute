import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,c103,c106,background,output]=process.argv.slice(2);
assert.ok(output,'Provide original runtime, C103 operands, C106 paired receipt, C106 C16 receipt and output');
const sha=x=>createHash('sha256').update(x).digest('hex');
const pinned=async(path,expected)=>{const data=await readFile(path);assert.equal(sha(data),expected,path);return data;};
const prior={C103:'281e4b9d3e8046a8ad74c299b8a2d68661c1e7bcac73d3edf98a2d882dae24a0',
  C106:'d8c5b56bf26f90d87908e73f5c2b3634095af7428d1a60dbe5a3d3d1d9452416',
  C106Background:'1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc'};
const n2src=JSON.parse(await pinned(c103,prior.C103));
const paired=JSON.parse(await pinned(c106,prior.C106));
const g16=JSON.parse(await pinned(background,prior.C106Background));
const pins={...n2src.pins,
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-background-residual-bridge.mjs':'a0d2823ee658aadff65171441c06c9cb0f52ac7115be948e17600d343fd5788a',
  'actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef'};
for(const [name,hash] of Object.entries(pins)) await pinned(resolve(runtime,name),hash);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {sourceScaledOperators,buildActualOmegaCoefficientOverX,sourceSquareStepSecondDerivativeProof}=await load('actual-continuation-exact-order-two-source.mjs');
const {actualSupportOrderProof}=await load('actual-continuation-exact-support.mjs');
const {actualPositiveStressFTC}=await load('actual-background-residual-bridge.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {explicitPrimitiveBodyIdentity}=await load('actual-global-primitive-kernels.mjs');
const {sourceAllOrderCutoffJets}=await load('actual-residual-order-induction-kernels.mjs');
const original=src.prepareActualOrderInduction({order:3,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(original));
const {G,bootstrap:b,records:[n0,n1,n2,n3]}=original;
const {orderOne:r,inner,constants:{X,eta}}=b;
const originalNodeCount=G.nodes.length, originalPrefixSHA256=sha(JSON.stringify(G.nodes));
assert.equal(sha(JSON.stringify(G.nodes.slice(0,n2src.originalNodeCount))),n2src.originalPrefixSHA256);
const {raw,actual,global:g,stress}=n3,norm=n3.norm.actual,nat=n3.norm.auxiliary;
const {xi}=raw,system=G.picardSystems[raw.system],q=(n,d=1)=>G.q(n,d),o=G.one,z=G.zero;
const {A,D,d,L}=G.core,h=G.parameter('h'),lambda=G.parameter('lambda'),nu=j=>G.mul(q(2*j),h);
const c=G.neg(A),a=G.neg(G.add(A,q(1,2))),{Z,T}=sourceScaledOperators(G,X,eta);
const check=(left,right,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(left,right),{atomicNodes,maxTerms:200000});
const same=(left,right,atoms=[])=>assert.ok(check(left,right,atoms).pass);
const atXi=id=>G.substitute(id,X,G.pow(xi,2));
const getBody=(node,parameters=[X,eta])=>{
  const {op,args}=G.nodes[node];assert.equal(op,'actual_expression_partial');
  assert.deepEqual(args.slice(1),[parameters,parameters.map(()=>0)]);
  return G.expressionSystems[args[0]].body;
};
const integral=id=>{const n=G.nodes[id];assert.equal(n.op,'definite_integral');return n.args;};
const flat=id=>G.nodes[id].op==='add'?G.nodes[id].args.flatMap(flat):[id];
assert.equal(raw.system,5);assert.equal(n3.auxiliary.system,4);
assert.equal(n2.raw.system,3);assert.equal(n2.auxiliary.system,2);
assert.equal(system.order,3);assert.equal(system.kind,'actual');
assert.equal(raw.lambda,nu(3));assert.equal(norm.strip,G.div(inner.delta,q(8n*256n**3n)));
assert.equal(nat.radius,q(25,4));assert.equal(nat.radialDomain,G.div(q(25,4),G.parameter('Lambda')));
assert.equal(norm.radialDomain,inner.aSquared);
assert.deepEqual(system.radialDomain,[z,G.sqrt(inner.aSquared)]);
assert.deepEqual(system.lowerOrders,[n0,n1,n2].map(({actual:f,order})=>({order,F:atXi(f.F),U:atXi(f.U),v:atXi(f.v),kind:'actual'})));
assert.deepEqual(system.diagonal,[0,0,2,0,3,1]);
assert.ok([n1,n2,n3].every(n=>n.global.actualMomentChecks.every(p=>p.pass)));
assert.equal(norm.C,G.mul(q(2),G.add(norm.matrixBound,...norm.forcingBounds)));
assert.equal(norm.Kcondition,G.ceiling(G.div(G.mul(q(72),G.pow(norm.C,2),norm.radialDomain),norm.strip)));
assert.equal(system.tail.sourceBound,norm.C);assert.equal(system.tail.Kcondition,norm.Kcondition);
const nativeTail=src.actualOrderInductionTail(original,{order:3,kind:'actual',etaOrder:0,bits:256});

const localHistory=[n0,n1,n2].map(n=>n.actual),wholeHistory=[n0,n1,n2].map(n=>n.global);
const omega=hist=>buildActualOmegaCoefficientOverX(G,{order:2,X,eta,U:hist.map(f=>f.U),v:hist.map(f=>f.v)});
const omegaLocal=omega(localHistory),omegaWhole=omega(wholeHistory);
assert.equal(omegaLocal.terms.length,9);assert.equal(omegaWhole.terms.length,9);
assert.equal(omegaLocal.value,raw.omegaOverX);
assert.deepEqual(G.nodes[g.omega],{op:'smooth_piecewise',args:[X,inner.aSquared,r.Xplus,omegaLocal.value,omegaWhole.value,z]});
const products=hist=>{
  const [,x,y]=hist;
  return [G.mul(q(2),x.F,y.F),G.mul(q(2),X,G.add(G.mul(x.U,y.F),G.mul(y.U,x.F))),G.mul(q(2),G.sub(G.mul(x.U,y.U),G.mul(X,x.F,y.F)))];
};
const [flo]=products(localHistory);
const [fg,ug,vg]=products(wholeHistory);
same(raw.pKnown,G.sub(flo,G.mul(q(1,2),omegaLocal.value)),[omegaLocal.value,...localHistory.slice(1).map(t=>t.F)]);
const sourceLowerTheta=[],sourceLowerAxial=[];
for(const i of [1,2]){
  const j=3-i,left=localHistory[i],right=localHistory[j];
  sourceLowerTheta.push(G.mul(left.v,G.add(G.mul(X,G.derivative(right.F,X)),right.F)),G.mul(left.U,Z(G.add(a,nu(j)),right.F)));
  sourceLowerAxial.push(G.mul(X,left.v,G.derivative(right.U,X)),G.mul(left.U,Z(G.add(c,nu(j)),right.U)));
}
sourceLowerTheta.push(G.neg(Z(G.sub(G.add(a,nu(2)),D),Z(G.add(a,nu(2)),localHistory[2].F))));
sourceLowerAxial.push(G.neg(Z(G.sub(G.add(c,nu(2)),D),Z(G.add(c,nu(2)),localHistory[2].U))));
assert.equal(G.add(...sourceLowerTheta),raw.Htheta);
assert.equal(G.add(...sourceLowerAxial),raw.Hz);
g.lowerBodies.forEach((id,j)=>same(id,[fg,ug,vg][j],[X,...wholeHistory.slice(1).flatMap(f=>[f.F,f.U])]));
same(g.lowerPressure,G.sub(fg,G.mul(q(1,2),g.omega)),[g.omega,...wholeHistory.slice(1).map(t=>t.F)]);
const wholeDebts=[g.lowerPressure,ug,G.add(vg,G.mul(q(1,2),X,g.omega))];
const momentLowerIntegrals=g.incoming.slice(2).map((entry,j)=>{
  const candidates=flat(getBody(entry,[eta])).filter(id=>G.nodes[id].op==='definite_integral'&&G.nodes[id].args[3]===r.Xplus);
  assert.equal(candidates.length,1);
  const [node]=candidates,[body,binder,left,right]=integral(node);
  assert.deepEqual([left,right],[z,r.Xplus]);
  same(getBody(body,[binder,eta]),wholeDebts[j],[X,g.omega,...wholeHistory.slice(1).flatMap(f=>[f.F,f.U])]);
  return {node,binder,parameter:eta,bounds:[left,right]};
});

const {F:F0,U:U0,v:v0}=n0.actual;
const independent=src.actualInductionLinearKernel(G,{X,eta,xi,lambda:nu(3),F0,U0,v0,pKnown:raw.pKnown,Htheta:raw.Htheta,Hz:raw.Hz});
assert.deepEqual(system.A0,independent.matrix0.map(row=>row.map(atXi)));
assert.deepEqual(system.A1,independent.matrix1.map(row=>row.map(atXi)));
assert.deepEqual(system.forcing,independent.rawForcing.map(atXi));
const pressureRow=G.mul(q(4),xi,atXi(F0));
assert.deepEqual(system.A0[3],[pressureRow,z,z,z,z,z]);
assert.deepEqual(system.A1[3],Array(6).fill(z));
assert.equal(system.forcing[3],G.mul(q(2),xi,atXi(raw.pKnown)));
assert.deepEqual(system.A0[1],[z,z,z,z,z,o]);
assert.deepEqual(system.A0[2],[z,z,z,z,z,q(-1)]);
const {terms,sum}=G.picardPartialSum(raw.system,3);
assert.throws(()=>G.picardPartialSum(raw.system,9),e=>e?.code==='RESOURCE_LIMIT'&&e.message.includes('zero through eight'));
const P2=system.diagonal.map((_,i)=>G.add(terms[0][i],terms[1][i]));
const integrateXi=(density,power=0)=>{
  const t=G.fresh('C110_replay_kernel_binder');
  return G.mul(xi,G.integral(G.mul(G.pow(t,power),G.substitute(density,xi,G.mul(t,xi))),t,z,o));
};
const matches=(left,right)=>explicitPrimitiveBodyIdentity(G,left,right).pass;
const pressure3=G.add(integrateXi(system.forcing[3]),integrateXi(G.mul(pressureRow,P2[0])));
assert.ok(matches(sum[3],pressure3));
assert.ok(!matches(P2[3],pressure3));
assert.equal(terms[1][3],z);assert.notEqual(terms[2][3],z);
assert.ok(matches(sum[1],G.add(...terms.slice(0,2).map(row=>integrateXi(row[5])))));
assert.ok(matches(sum[2],G.add(...terms.slice(0,2).map(row=>integrateXi(G.neg(row[5]),2)))));

const fields={F:g.F,U:g.U,M:g.M,Pi:g.Pi,v:g.v,average:g.average,V:g.V,E:g.E,pressureDerivative:g.pressureDerivative};
const hasN3=new Map(),replaced=new Map(),rawCalls=new Set();
const leaves=new Set(['coordinate','rational','source_parameter']);
const unaryTyped=new Set(['integer_power','source_step_derivative']);
const ordinary=new Set(['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine','definite_integral','smooth_piecewise','maximum','minimum','ceiling']);
function containsRaw(id){
  if(id<raw.F)return false;
  if(hasN3.has(id))return hasN3.get(id);
  const {op,args}=G.nodes[id];
  let hit;
  if(op==='actual_background_even_profile')hit=args[0]===raw.system||args.slice(2,4).some(containsRaw);
  else if(op==='actual_background_picard')hit=args.slice(2,4).some(containsRaw);
  else if(op==='actual_natural_series')hit=args.slice(1,3).some(containsRaw);
  else if(op==='actual_quadratic_root')hit=containsRaw(args[2]);
  else if(op==='actual_monotone_root')hit=args.slice(1).some(containsRaw);
  else if(op==='actual_expression_partial')hit=containsRaw(G.expressionSystems[args[0]].body)||args[1].some(containsRaw);
  else if(unaryTyped.has(op))hit=containsRaw(args[0]);
  else if(leaves.has(op))hit=false;
  else{assert.ok(ordinary.has(op),op);hit=args.some(containsRaw);}
  hasN3.set(id,hit);return hit;
}
const finite=[P2[0],P2[1],P2[2],sum[3]].map(id=>G.substitute(id,xi,G.sqrt(X)));
function replace(id){
  if(!containsRaw(id))return id;
  if(replaced.has(id))return replaced.get(id);
  const {op,args}=G.nodes[id];let next;
  if(op==='actual_background_even_profile'){
    const [sid,j,x,e,radial,etaOrder]=args;
    assert.equal(sid,raw.system);assert.equal(radial,0);rawCalls.add(id);
    let body=finite[j];for(let k=0;k<etaOrder;k++)body=G.derivative(body,eta);
    next=G.simultaneousSubstitute(body,[X,eta],[x,e]);
  }else if(op==='actual_expression_partial')next=replace(G.materializeExpressionFunction(args[0],args[1],args[2]));
  else if(unaryTyped.has(op))next=G.node(op,[replace(args[0]),args[1]]);
  else{assert.ok(ordinary.has(op),op);next=G.node(op,args.map(replace));}
  replaced.set(id,next);return next;
}
const approximation=Object.fromEntries(Object.entries(fields).map(([k,id])=>[k,replace(id)]));
const repaired=g.incoming.map(replace);
assert.ok(repaired.every((id,j)=>id!==g.incoming[j]));
const checks=g.momentResiduals.map(id=>check(replace(id),z,repaired));
assert.ok(checks.every(p=>p.pass));
for(const id of [g.lowerPressure,...g.lowerBodies,...momentLowerIntegrals.map(row=>row.node),n2.global.Pi])assert.equal(replace(id),id);

const support=actualSupportOrderProof(b.completedOrderOne);
assert.ok(support.pass&&support.expressionChecks.allEndpointsIndependentOfEta);
assert.deepEqual(stress.compactSupport,[r.Xminus,r.Xplus]);
assert.ok(stress.conservativeSourceMoments.every(Boolean));assert.equal(stress.lowerViscosityOrder,2);
assert.equal(stress.axialTerms.length,12);assert.equal(stress.angularTerms.length,11);
const ftc=actualPositiveStressFTC(original);
assert.ok(ftc.pass);
function findIntegrals(id){const n=G.nodes[id];if(n.op==='definite_integral')return [id];
  if(['multiply','add','inverse'].includes(n.op))return [...new Set(n.args.flatMap(findIntegrals))];return [];}
const stressProof=ftc.rows.filter(row=>row.order===3).map(row=>{
  const theta=row.component==='theta',density=theta?stress.thetaBody:stress.zBody;
  const [iBody,binder,left,right]=integral(row.integral);
  assert.deepEqual([left,right],[r.Xminus,X]);assert.equal(iBody,G.substitute(density,X,binder));
  const [bi]=findIntegrals(theta?stress.backwardTheta:stress.backwardZ);
  const [jBody,jbinder,bLeft,bRight]=integral(bi);
  assert.deepEqual([bLeft,bRight],[X,r.Xplus]);assert.equal(jBody,G.substitute(density,X,jbinder));
  assert.ok([iBody,jBody].every(id=>G.freeCoordinates(id).has(eta)&&!G.freeCoordinates(id).has(X)));
  assert.ok(!row.negativeWrongSign.pass);
  return {component:row.component,density,root:row.root,forwardIntegral:row.integral,forwardBinder:binder,
    forwardBoundaries:[left,right],backwardIntegral:bi,backwardBinder:jbinder,backwardBoundaries:[bLeft,bRight],
    denominator:row.denominator,eta,wrongForwardSignRejected:true};
});
assert.equal(stressProof.length,2);

// Bind operands for a whole-support F,U,Pi stability bound at fixed lower history.
assert.deepEqual(G.nodes[actual.F].args.slice(0,4),[X,r.Xkeep,r.Xcut,raw.F]);
assert.deepEqual(G.nodes[actual.U].args.slice(0,4),[X,r.Xkeep,r.Xcut,raw.U]);
assert.deepEqual(G.nodes[getBody(g.Pi)].args.slice(0,4),[X,r.Xkeep,r.Xplus,raw.Pi]);
assert.equal(G.nodes[getBody(g.Pi)].args[5],z);
assert.deepEqual(G.nodes[g.dU].args.slice(0,4),[X,r.X0,r.IposRight,z]);
assert.deepEqual(G.nodes[g.dF].args.slice(0,4),[X,r.X0,r.IposRight,z]);
assert.equal(r.Rbase,G.sqrt(G.mul(q(2),r.X0)));
assert.equal(r.Uinverse.length,2);assert.equal(r.Einverse.length,3);
const step=sourceSquareStepSecondDerivativeProof();
assert.ok(step.pass&&step.sourceSeed.includes('exp(-1/s^2)')&&step.sigmaPrimeUpper.startsWith('9 '));
assert.ok(sourceAllOrderCutoffJets({order:2}).pass);
// Independent |sigma'|<16: on [1/3,2/3] use sigma(1-sigma)<=1/4;
// on the symmetric outer collars exp(-27/4)<1/64 after monotonicity.
assert.ok(27*9<16*16);
assert.ok(2*27*9<8*64);
const power=(v,p)=>G.exp(G.mul(p,G.log(v)));
const scales={B:G.maximum(o,r.Xplus),L0:G.maximum(o,inner.B),Rbase:r.Rbase,ef:r.ef,lambda,
  R1:power(r.Rbase,G.sub(o,G.mul(q(2),lambda))),
  Rp:power(r.Rbase,G.sub(q(-2),G.mul(q(2),lambda))),
  Rz:power(r.Rbase,G.mul(q(-2),lambda)),bumpCap:32768};
assert.equal(norm.lowerMixedRadialBounds[0],scales.L0);
same(g.Urhs[0],G.neg(G.div(g.incoming[0],scales.Rbase)),g.incoming);
same(g.Urhs[1],G.div(G.add(G.neg(G.div(g.incoming[0],scales.Rbase)),G.div(g.incoming[3],G.mul(scales.ef,scales.R1))),G.mul(q(2),lambda)),g.incoming);
assert.deepEqual(g.Erhs,[G.neg(G.div(g.incoming[1],G.pow(scales.Rbase,2))),
  G.neg(G.div(g.incoming[2],G.mul(q(2),scales.ef,scales.Rp))),G.div(g.incoming[4],G.mul(scales.ef,scales.Rz))]);
const {B,L0,Rbase,ef,R1,Rp,Rz,bumpCap}=scales;
const Ef=G.substitute(ef,eta,z);
same(G.mul(ef,G.add(o,G.pow(eta,2))),Ef);
const ur=[G.inv(Rbase),G.div(G.add(G.inv(Rbase),G.div(q(2),G.mul(Ef,R1))),G.mul(q(2),lambda))],
  er=[G.inv(G.pow(Rbase,2)),G.inv(G.mul(Ef,Rp)),G.div(q(2),G.mul(Ef,Rz))];
const maxRows=(rows,rhs)=>G.maximum(...rows.map(row=>G.add(...row.map((id,j)=>G.mul(G.add(o,G.pow(id,2)),rhs[j])))));
const Iu=maxRows(r.Uinverse,ur),If=maxRows(r.Einverse,er);
const debt=G.mul(q(4),G.pow(B,2),L0),
  correctionU=G.div(G.mul(q(2*bumpCap),Iu),Rbase),correctionF=G.div(G.mul(q(3*bumpCap),If),G.pow(Rbase,2));
const TF=G.add(o,G.mul(debt,correctionF)),TU=G.add(o,G.mul(debt,correctionU)),
  TPi=G.add(o,G.mul(q(2),B,L0),G.mul(q(2),B,Ef,Rp,debt,correctionF));
const absGrowth=G.mul(B,G.maximum(TF,TU,TPi)),bits=q(256);
const K=G.maximum(o,norm.Kcondition,G.ceiling(G.div(G.add(G.mul(bits,G.log(q(2))),G.log(absGrowth)),G.log(q(4)))));
const logTail=G.mul(q(1,3),absGrowth,G.exp(G.neg(G.mul(K,G.log(q(4))))));
assert.equal(G.freeCoordinates(logTail).size,0);
const out={schema:'MathScope.C110.OriginalNativeN3FixedLowerOperands/1',pins,prior,priorScope:{paired:paired.status,
  transportedBackground:g16.status,transportedBackgroundUsedAsNativeNorm:false},originalNodeCount,originalPrefixSHA256,
  retainedN2LiteralPrefixNodes:n2src.originalNodeCount,sourceSystemIndices:{N2Aux:2,N2Actual:3,N3Aux:4,N3Actual:5},
  originalX:X,originalEta:eta,nativeN3Tail:{...nativeTail,C:norm.C,s:norm.strip,aSquared:norm.radialDomain,Kcondition:norm.Kcondition},
  sourceStorage:{nativeOrderThree:3,physicalFAndUStorage:'P_K',pressureStorage:'P_(K+1)',checkedFiniteDepths:[2,3],finitePressureNode:sum[3],
    finitePressureReconstruction:pressure3,wrongSameDepthRejected:true,piInitialPicardTerm:terms[0][3],piSecondIncrement:terms[1][3],piThirdIncrement:terms[2][3],
    displayedTermHardLimit:8,finiteValuesEvaluated:false},
  omega:{sourceDegree:2,localRaw:omegaLocal.value,wholeLower:omegaWhole.value,switch:g.omega,termsPerBranch:9,guards:[inner.aSquared,r.Xplus],
    momentLowerIntegrals,rawKnownPressure:raw.pKnown,globalPressureDerivative:g.pressureDerivative},
  fiveMoments:{originalDebts:g.incoming,finiteDebts:repaired,zeroNumeratorMonomials:checks.map(p=>p.numeratorMonomials)},
  originalFields:fields,finiteFields:approximation,replacedActualN3Calls:rawCalls.size,originalN0N1N2HeldFixed:true,
  support:support.endpoints,stress:stressProof,stressSummands:[12,11],
  boundScales:{...scales,Uinverse:r.Uinverse,Einverse:r.Einverse,normalizations:[g.Urhs,g.Erhs]},
  constructedClosedWholeCoefficientBound:{rhsU:ur,rhsF:er,Iu,If,debt,correctionU,correctionF,TF,TU,TPi,absGrowth,K,logTail,
    uniformActualAmplitude:{sourceEtaAmplitude:ef,etaZeroAmplitude:Ef,etaInterval:['-1','1'],originalFactor:'ef(eta)=ef(0)/(1+eta^2)',lowerMultiple:'1/2',upperMultiple:'1'},
    allFreeCoordinateCount:0,strictTarget:'<2^-256',sourceTermCountNumericallyEvaluated:false,fixedExactOriginalLowerHistories:true},
  nativeN3CompoundValuesEvaluated:false,globalStressQuantitativeCapEstablished:false,
  generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({nativeN3Systems:[4,5],prefix:n2src.originalNodeCount,rawCalls:rawCalls.size,
  moments:checks.map(p=>p.numeratorMonomials),stress:stressProof.map(row=>row.density),order3Nodes:originalNodeCount}));
