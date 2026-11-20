import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c99folder,output]=process.argv.slice(2);
assert(output,'ORIGINAL_RUNTIME ORIGINAL_REGISTRY C99_Y_DIRECTORY NEW_JSON');
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=async(path,pin)=>{
  const data=await readFile(path);
  assert.equal(sha(data),pin,path);
  return JSON.parse(data);
};
const C99='05f6adaa85ad7adf05a5c4943e4f01e98794243f3dab8c7c0a1f85c9f4f5b387';
const C99Ops='d52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be';
const prior=await read(resolve(c99folder,'n1-ipos-transfer.json'),C99);
const old=await read(resolve(c99folder,'n1-ipos-transfer-operands.json'),C99Ops);
assert.equal(prior.operandsSHA256,C99Ops);
const archived=await read(registry,old.registrySHA);
const pins={...old.originalPins,
  'actual-continuation-exact-stress.mjs':'22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2'};
for(const [name,hash] of Object.entries(pins))
  assert.equal(sha(await readFile(resolve(runtime,name))),hash,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const {prepareActualOrderInduction,assertActualOrderInduction}=await load('actual-residual-order-induction-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {explicitPrimitiveBodyIdentity}=await load('actual-global-primitive-kernels.mjs');
const live=prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(assertActualOrderInduction(live));
const {G,bootstrap,records}=live,{inner,orderOne:r,constants:{X,eta}}=bootstrap;
const system=G.picardSystems[0],xi=system.xi,raw=records[1].raw;
assert.equal(sha(JSON.stringify(G.nodes)),old.originalPrefixSHA256);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
assert.deepEqual(system.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(system.zeroAxisDatum,Array(6).fill(0));
assert.equal(system.radialDomain[1],G.sqrt(inner.aSquared));
assert.equal(inner.aSquared,24805);
assert.deepEqual(r.localMoments,old.localMoments);
assert.deepEqual(r.moments,old.incomingMoments);
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one;
const leafOps=['rational','source_parameter','coordinate'];
const treeOps=['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine',
  'definite_integral','smooth_piecewise','ceiling','maximum','minimum'];
const partlyTypedOps=['integer_power','source_step_derivative'];
const parities=new Map();
function parity(id){
  if(parities.has(id))return parities.get(id);
  if(!G.dependsOn(id,xi))return 0;
  const {op,args}=G.nodes[id];
  let result;
  if(id===xi)result=1;
  else if(op==='add'){
    const list=args.filter(x=>x!==z).map(parity);
    assert.ok(list.every(x=>x===list[0]),[id,op,list]);
    result=list[0]??0;
  }else if(op==='multiply')result=args.map(parity).reduce((a,b)=>a^b,0);
  else if(op==='integer_power')result=(parity(args[0])*args[1])&1;
  else if(op==='inverse')result=parity(args[0]);
  else if(op==='definite_integral'){
    assert.ok(args.slice(2).every(x=>parity(x)===0),id);
    result=parity(args[0]);
  }else if(op==='smooth_piecewise'){
    assert.ok(args.slice(0,3).every(x=>parity(x)===0),id);
    const list=args.slice(3).filter(x=>x!==z).map(parity);
    assert.ok(list.every(x=>x===list[0]),id);
    result=list[0]??0;
  }else{
    const incoming=op==='actual_natural_series'?args.slice(1,3):
      op==='actual_quadratic_root'?[args[2]]:
      op==='actual_monotone_root'?args.slice(1):
      op==='actual_expression_partial'?args[1]:
      partlyTypedOps.includes(op)?[args[0]]:args;
    assert.ok(incoming.every(x=>parity(x)===0),[id,op]);
    result=0;
  }
  parities.set(id,result);
  return result;
}
const unknownParity=[0,0,0,0,1,1];
const parityShapes=[system.A0,system.A1].map(matrix=>matrix.map((row,i)=>row.map((id,j)=>{
  const expected=1^unknownParity[i]^unknownParity[j];
  if(id!==z)assert.equal(parity(id),expected,[id,i,j]);
  return id===z?null:expected;
})));
const forceParity=system.forcing.map((id,i)=>{
  if(id!==z)assert.equal(parity(id),1^unknownParity[i],id);
  return id===z?null:1^unknownParity[i];
});

const full=G.picardPartialSum(0,3);
const twice=system.diagonal.map((_,i)=>G.add(full.terms[0][i],full.terms[1][i]));
assert.equal(full.terms[0][0],z);
assert.equal(full.terms[1][3],z);
assert.ok(full.terms[2][3]!==z);
const atXi=id=>G.substitute(id,X,G.pow(xi,2)),pKnown=G.mul(q(-1,2),inner.omegaOverX);
const pressureCoeff=G.mul(q(4),xi,atXi(inner.F0));
assert.deepEqual(system.A0[3],[pressureCoeff,z,z,z,z,z]);
assert.deepEqual(system.A1[3],Array(6).fill(z));
assert.equal(system.forcing[3],G.mul(q(2),xi,atXi(pKnown)));
const FhatXi=twice[0],UhatXi=twice[1],PihatXi=full.sum[3];
const pressurePieces=[system.forcing[3],G.mul(pressureCoeff,FhatXi)];
const pressureReplayDensity=G.add(...pressurePieces);
const recomputePressure=G.add(...pressurePieces.map(body=>{
  const s=G.fresh('C100_common_pressure_radial_parameter');
  return G.mul(xi,G.integral(G.substitute(body,xi,G.mul(s,xi)),s,z,o));
}));
assert.ok(explicitPrimitiveBodyIdentity(G,PihatXi,recomputePressure).pass);
assert.equal(parity(FhatXi),0);
assert.equal(parity(UhatXi),0);
assert.equal(parity(PihatXi),0);

const t1=G.parameter('t1'),Xa=G.parameter('Xa'),oneStep=G.div(t1,q(64)),twoSteps=G.div(t1,q(32));
assert.equal(r.Xkeep,G.mul(Xa,G.exp(oneStep)));
assert.equal(r.Xcut,G.mul(Xa,G.exp(twoSteps)));
const unitCutoffArg=y=>G.div(G.sub(y,oneStep),oneStep);
const zeroCutoffArg=sourceGraphRationalIdentity(G,unitCutoffArg(oneStep),{atomicNodes:[t1]});
const oneCutoffArg=sourceGraphRationalIdentity(G,G.sub(unitCutoffArg(twoSteps),o),{atomicNodes:[t1]});
assert.ok(zeroCutoffArg.pass&&oneCutoffArg.pass);
const kappa=G.sub(o,G.step(unitCutoffArg(G.log(G.div(X,Xa)))));
const expectedFt=G.choose(X,r.Xkeep,r.Xcut,raw.F,G.mul(kappa,raw.F),z);
const expectedUt=G.choose(X,r.Xkeep,r.Xcut,raw.U,G.mul(kappa,raw.U),z);
assert.equal(expectedFt,old.sourceRoots.localF);
assert.equal(expectedUt,old.sourceRoots.localU);
const piBranch=G.nodes[r.Pi1],massBranch=G.nodes[r.M1];
assert.deepEqual(piBranch.args.slice(0,4),[X,r.Xkeep,r.Xplus,raw.Pi]);
assert.equal(piBranch.args[5],z);
assert.equal(massBranch.args[1],r.Xkeep);
assert.equal(massBranch.args[5],z);
const stress=bootstrap.program.orderOneStress;
assert.deepEqual(stress.totalResidualIntegrals,[117072,117075]);
assert.equal(stress.axialSupported,117047);
assert.deepEqual(G.nodes[117047].args.slice(0,3),[X,r.Xminus,r.Xplus]);
const axialIntegrals=[117057,117066,117075];
for(const [i,id] of axialIntegrals.entries()){
  const n=G.nodes[id];
  assert.equal(n.op,'definite_integral');
  const [body,binder,left,right]=n.args;
  assert.deepEqual([left,right],[[r.Xminus,X],[X,r.Xplus],[r.Xminus,r.Xplus]][i]);
  assert.deepEqual(G.nodes[body],{op:'actual_expression_partial',args:[1,[binder,eta],[0,0]]});
}
assert.equal(G.expressionSystems[1].body,117047);

const tracked=new Set(old.rawRequestReplacements.map(([id])=>id));
const newRaw=new Set(),checked=new Map(),mapped=new Map();
const rawComponent={0:FhatXi,1:UhatXi,3:PihatXi};
const formal=Object.fromEntries(Object.entries(rawComponent).map(([i,id])=>[i,G.substitute(id,xi,G.sqrt(X))]));
function children(op,args){
  if(leafOps.includes(op))return [];
  if(partlyTypedOps.includes(op))return [args[0]];
  if(op==='actual_natural_series')return args.slice(1,3);
  if(op==='actual_quadratic_root')return [args[2]];
  if(op==='actual_monotone_root')return args.slice(1);
  if(op==='actual_expression_partial')return [G.expressionSystems[args[0]].body,...args[1]];
  if(op==='actual_background_even_profile'||op==='actual_background_picard')return args.slice(2,4);
  assert.ok(treeOps.includes(op),op);
  return args;
}
function needs(id){
  if(checked.has(id))return checked.get(id);
  const {op,args}=G.nodes[id];
  const marked=(op==='actual_background_even_profile'||op==='actual_background_picard')&&args[0]===0||
    children(op,args).some(needs);
  checked.set(id,marked);
  return marked;
}
function replace(id){
  if(mapped.has(id))return mapped.get(id);
  if(!needs(id))return id;
  const {op,args}=G.nodes[id];
  let result;
  if(op==='actual_background_even_profile'){
    const [systemId,component,x,e,order,m]=args;
    assert.equal(systemId,0);
    assert.equal(order,0);
    assert.ok(tracked.has(id));
    let expr=formal[component];
    assert.ok(expr);
    for(let j=0;j<m;j++)expr=G.derivative(expr,eta);
    result=G.simultaneousSubstitute(expr,[X,eta],[x,e]);
    newRaw.add(id);
  }else if(op==='actual_expression_partial'){
    result=replace(G.materializeExpressionFunction(args[0],args[1],args[2]));
  }else if(partlyTypedOps.includes(op)){
    result=G.node(op,[replace(args[0]),args[1]]);
  }else{
    assert.ok(treeOps.includes(op),op);
    result=G.node(op,args.map(replace));
  }
  mapped.set(id,result);
  return result;
}
const outputApprox=Object.fromEntries(Object.entries(old.outputs).map(([name,id])=>[name,replace(id)]));
const incoming=r.moments.map(replace);
const zeroResiduals=r.momentResiduals.map(id=>{
  const source=replace(id), proof=sourceGraphRationalIdentity(G,source,{atomicNodes:incoming});
  assert.ok(proof.pass);
  return {source,numeratorMonomials:proof.numeratorMonomials};
});
assert.deepEqual([...newRaw].sort((a,b)=>a-b),[...tracked].sort((a,b)=>a-b));
assert.ok(Object.values(outputApprox).every(id=>!needs(id)));
const receipt={schema:'MathScope.C100.OriginalN1SameBodyRadialSeamOperands/1',
  prior:{C99,C99Ops},originalPrefixSHA256:old.originalPrefixSHA256,sourcePins:pins,
  parityShapes,forceParity,parityEntriesChecked:78,
  cutoffCoordinates:{Xa,keep:r.Xkeep,cut:r.Xcut,innerEnd:inner.aSquared,
    lastU:massBranch.args[2],axisLeadingEnd:bootstrap.constants.Xv,plus:r.Xplus,stop:r.Xb},
  flatCutoffArgumentsAtJoins:[0,1],
  pressure:{originalRow:pressureCoeff,originalForcing:system.forcing[3],rawF:FhatXi,rawU:UhatXi,
    oldTwoTermPressure:twice[3],thirdPressureTerm:full.terms[2][3],coherentPressure:PihatXi,
    recomputePressure,pressureReplayDensity,sameIntegralBody:true},
  compensatedOutputs:outputApprox,replacedCalls:[...newRaw].sort((a,b)=>a-b),incoming,
  approximateZeroResiduals:zeroResiduals,
  originalAxialDensity:{body:117047,expressionSystem:1,
    formalArguments:[X,eta],literalIntegrals:axialIntegrals},
  finalGraphNodes:G.nodes.length};
await writeFile(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({parityEntries:78,replacedCalls:newRaw.size,
  compensationIdentities:zeroResiduals.length,originalAxialBody:117047,outputGraphNodes:G.nodes.length}));
