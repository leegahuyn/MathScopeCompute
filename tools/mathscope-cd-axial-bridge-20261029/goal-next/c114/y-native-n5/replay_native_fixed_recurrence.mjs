import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,fixed4Path,bankPath,paired4Path,output]=process.argv.slice(2);
assert.ok(output,'Provide original runtime, fixed N4, original eta bank, paired N4 and fresh output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async(path,pin)=>{const bytes=await readFile(path);assert.equal(sha(bytes),pin,path);return JSON.parse(bytes);};
const prior={fixed4:'c98c467546aae25fd48af3a0374e16669cc2ebdf44063296a6032e85cc94eb04',
  bank:'073f392f5cf734e04c7497f5fa35f0d7893629ef48c4ee8c95efdb0431061154',
  paired4:'520080cd7575fb64cfa522ba06b65b0f80da70aec171d5b4a58c9f582e3f3ec9'};
const fixed4=await read(fixed4Path,prior.fixed4),bank=await read(bankPath,prior.bank),paired4=await read(paired4Path,prior.paired4);
assert.deepEqual(paired4.momentResiduals,[0,0,0,0,0]);assert.equal(bank.wholeLeading.etaOrder,7);
for(const [name,pin] of Object.entries(fixed4.pins))assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {sourceScaledOperators,buildActualOmegaCoefficientOverX,sourceSquareStepSecondDerivativeProof}=await load('actual-continuation-exact-order-two-source.mjs');
const {actualSupportOrderProof}=await load('actual-continuation-exact-support.mjs');
const {actualPositiveStressFTC}=await load('actual-background-residual-bridge.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {explicitPrimitiveBodyIdentity}=await load('actual-global-primitive-kernels.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const live=src.prepareActualOrderInduction({order:5,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap:b,records}=live,{orderOne:r,inner,constants:{X,eta}}=b,n5=records[5];
const originalPrefixSHA256=sha(JSON.stringify(G.nodes)),originalNodes=G.nodes.length;
const oldPrefix=sha(JSON.stringify(G.nodes.slice(0,fixed4.originalNodeCount)));
assert.equal(oldPrefix,fixed4.originalPrefixSHA256);assert.equal(oldPrefix,paired4.unchangedN4Prefix);
const q=(x,d=1)=>G.q(x,d),o=G.one,z=G.zero,prod=(...x)=>G.mul(...x),add=(...x)=>G.add(...x);
const h=G.parameter('h'),lam=G.parameter('lambda'),{A,D,d,L}=G.core,nu=n=>prod(q(2*n),h),a0=G.neg(add(A,q(1,2))),c0=G.neg(A);
const {Z,T}=sourceScaledOperators(G,X,eta);
const same=(x,y,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes,maxTerms:220000});
const verify=(x,y,atoms=[])=>assert.ok(same(x,y,atoms).pass);
const integral=id=>{const n=G.nodes[id];assert.equal(n.op,'definite_integral');return n.args;};
const body=(id,ps)=>{const {op,args}=G.nodes[id];assert.equal(op,'actual_expression_partial');assert.deepEqual(args.slice(1),[ps,ps.map(()=>0)]);return G.expressionSystems[args[0]].body;};
const flat=id=>G.nodes[id].op==='add'?G.nodes[id].args.flatMap(flat):[id];
const sup=actualSupportOrderProof(b.completedOrderOne);
assert.ok(sup.pass&&sup.expressionChecks.allEndpointsIndependentOfEta);
const ftc=actualPositiveStressFTC(live);assert.ok(ftc.pass);
const n1=ftc.rows.filter(v=>v.order===1).map(v=>({component:v.component,domain:v.openDomain}));
assert.deepEqual(n1,[{component:'theta',domain:[r.Xminus,r.Xb]},{component:'z',domain:[r.Xminus,r.Xplus]}]);
function findInt(id){const n=G.nodes[id];if(n.op==='definite_integral')return [id];
  return ['add','multiply','inverse'].includes(n.op)?[...new Set(n.args.flatMap(findInt))]:[];}

function sourceRows(record){
  const {order:n,raw,global:g,stress}=record,ns=record.norm.actual,sys=G.picardSystems[raw.system];
  assert.equal(raw.system,2*n-1);assert.equal(record.auxiliary.system,2*n-2);
  assert.equal(sys.order,n);assert.equal(sys.kind,'actual');
  assert.equal(raw.lambda,nu(n));assert.equal(ns.strip,G.div(inner.delta,q(8n*256n**BigInt(n))));
  assert.deepEqual(sys.diagonal,[0,0,2,0,3,1]);assert.deepEqual(sys.zeroAxisDatum,Array(6).fill(z));
  assert.deepEqual(sys.radialDomain,[z,G.sqrt(inner.aSquared)]);
  assert.equal(record.norm.auxiliary.radius,add(q(6),q(1,1n<<BigInt(n-1))));
  assert.equal(ns.C,prod(q(2),add(ns.matrixBound,...ns.forcingBounds)));
  assert.equal(ns.Kcondition,G.ceiling(G.div(prod(q(72),G.pow(ns.C,2),inner.aSquared),ns.strip)));
  assert.equal(sys.tail.sourceBound,ns.C);assert.equal(sys.tail.Kcondition,ns.Kcondition);
  const sourceLower=records.slice(0,n),ax=t=>G.substitute(t,X,G.pow(raw.xi,2));
  assert.deepEqual(sys.lowerOrders,sourceLower.map(({order,actual:f})=>({order,F:ax(f.F),U:ax(f.U),v:ax(f.v),kind:'actual'})));
  const omega=kind=>buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:sourceLower.map(f=>f[kind].U),v:sourceLower.map(f=>f[kind].v)});
  const rawOmega=omega('actual'),outerOmega=omega('global');
  assert.equal(rawOmega.value,raw.omegaOverX);assert.notEqual(rawOmega.value,outerOmega.value);
  assert.ok([rawOmega,outerOmega].every(w=>w.terms.length===2*n+3&&w.axialViscosityShift===n-2));
  assert.deepEqual(G.nodes[g.omega],{op:'smooth_piecewise',args:[X,inner.aSquared,r.Xplus,rawOmega.value,outerOmega.value,z]});
  const p=[],ang=[],axial=[],Htheta=[],Hz=[],pairs=[];
  for(let i=1;i<n;i++){
    const j=n-i,{actual:u,global:f}=sourceLower[i],{actual:v,global:t}=sourceLower[j];pairs.push([i,j]);
    p.push(prod(f.F,t.F));ang.push(prod(q(2),X,f.U,t.F));axial.push(G.sub(prod(f.U,t.U),prod(X,f.F,t.F)));
    Htheta.push(prod(u.v,add(prod(X,G.derivative(v.F,X)),v.F)),prod(u.U,Z(add(a0,nu(j)),v.F)));
    Hz.push(prod(X,u.v,G.derivative(v.U,X)),prod(u.U,Z(add(c0,nu(j)),v.U)));
  }
  const prev=sourceLower[n-1].actual;
  Htheta.push(G.neg(Z(G.sub(add(a0,nu(n-1)),D),Z(add(a0,nu(n-1)),prev.F))));
  Hz.push(G.neg(Z(G.sub(add(c0,nu(n-1)),D),Z(add(c0,nu(n-1)),prev.U))));
  assert.equal(raw.Htheta,add(...Htheta));assert.equal(raw.Hz,add(...Hz));
  const rawP=add(...pairs.map(([i,j])=>prod(sourceLower[i].actual.F,sourceLower[j].actual.F)));
  verify(raw.pKnown,G.sub(rawP,prod(q(1,2),rawOmega.value)),[rawOmega.value,...sourceLower.slice(1).map(k=>k.actual.F)]);
  const whole=[p,ang,axial].map(t=>add(...t));
  const globalAtoms=[X,g.omega,...sourceLower.slice(1).flatMap(k=>[k.global.F,k.global.U])];
  for(let i=0;i<3;i++)verify(g.lowerBodies[i],whole[i],globalAtoms);
  verify(g.lowerPressure,G.sub(whole[0],prod(q(1,2),g.omega)),globalAtoms);
  const densities=[g.lowerPressure,whole[1],add(whole[2],prod(q(1,2),X,g.omega))];
  const lowerIntegrals=g.incoming.slice(2).map((id,i)=>{
    const selected=flat(body(id,[eta])).filter(v=>G.nodes[v].op==='definite_integral'&&G.nodes[v].args[3]===r.Xplus);
    assert.equal(selected.length,1);
    const [v]=selected,[integrand,t,left,right]=integral(v);assert.deepEqual([left,right],[z,r.Xplus]);verify(body(integrand,[t,eta]),densities[i],globalAtoms);
    return {root:v,binder:t,eta,limits:[left,right]};
  });
  const kernel=src.actualInductionLinearKernel(G,{X,eta,xi:raw.xi,lambda:nu(n),F0:records[0].actual.F,U0:records[0].actual.U,v0:records[0].actual.v,
    pKnown:raw.pKnown,Htheta:raw.Htheta,Hz:raw.Hz});
  assert.deepEqual(sys.A0,kernel.matrix0.map(row=>row.map(ax)));assert.deepEqual(sys.A1,kernel.matrix1.map(row=>row.map(ax)));
  assert.deepEqual(sys.forcing,kernel.rawForcing.map(ax));
  assert.deepEqual(sys.A0.slice(0,2),[[z,z,z,z,o,z],[z,z,z,z,z,o]]);
  assert.ok(sys.A1.slice(0,2).every(row=>row.every(v=>v===z)));assert.deepEqual(sys.forcing.slice(0,2),[z,z]);
  const pRow=prod(q(4),raw.xi,ax(records[0].actual.F));
  assert.deepEqual(sys.A0[3],[pRow,z,z,z,z,z]);assert.deepEqual(sys.A1[3],Array(6).fill(z));assert.equal(sys.forcing[3],prod(q(2),raw.xi,ax(raw.pKnown)));
  const arbitrary=g.incoming.map((_,j)=>G.fresh('C114_order'+n+'_debt'+j));
  const proofs=g.momentResiduals.map(id=>same(G.simultaneousSubstitute(id,g.incoming,arbitrary),z,arbitrary));
  assert.ok(proofs.every(p=>p.pass));
  const F=records.slice(0,n+1).map(v=>v.global),az=[T(add(c0,nu(n)),F[n].U)],th=[T(add(a0,nu(n)),F[n].F)];
  const ux=F.map(v=>G.derivative(v.U,X)),fx=F.map(v=>G.derivative(v.F,X));
  for(let i=0;i<=n;i++){
    const j=n-i;az.push(prod(X,F[i].v,ux[j]),prod(F[i].U,Z(add(c0,nu(j)),F[j].U)));
    th.push(prod(F[i].v,add(prod(X,fx[j]),F[j].F)),prod(F[i].U,Z(add(a0,nu(j)),F[j].F)));
  }
  az.push(Z(add(prod(q(-2),A),nu(n)),F[n].Pi),prod(q(-2),add(prod(X,G.derivative(ux[n],X)),ux[n])),
    G.neg(Z(G.sub(add(c0,nu(n-1)),D),Z(add(c0,nu(n-1)),F[n-1].U))));
  th.push(prod(q(-2),add(prod(X,G.derivative(fx[n],X)),prod(q(2),fx[n]))),G.neg(Z(G.sub(add(a0,nu(n-1)),D),Z(add(a0,nu(n-1)),F[n-1].F))));
  assert.deepEqual(az,stress.axialTerms);assert.deepEqual(th,stress.angularTerms);
  assert.equal(az.length,2*n+6);assert.equal(th.length,2*n+5);assert.deepEqual(stress.compactSupport,[r.Xminus,r.Xplus]);
  const stressRows=ftc.rows.filter(x=>x.order===n).map(row=>{
    const angular=row.component==='theta',density=angular?stress.thetaBody:stress.zBody;
    const [inside,i,lo,hi]=integral(row.integral);assert.deepEqual([lo,hi],[r.Xminus,X]);assert.equal(inside,G.substitute(density,X,i));
    const backward=findInt(angular?stress.backwardTheta:stress.backwardZ);assert.equal(backward.length,1);
    const [outer,j,a,b]=integral(backward[0]);assert.deepEqual([a,b],[X,r.Xplus]);assert.equal(outer,G.substitute(density,X,j));
    assert.ok(G.freeCoordinates(inside).has(eta)&&G.freeCoordinates(outer).has(eta)&&!row.negativeWrongSign.pass);assert.notEqual(i,j);
    return {component:row.component,density,root:row.root,forward:[lo,hi],backward:[a,b],binders:[i,j],normalizer:row.denominator,eta};
  });
  assert.equal(stressRows.length,2);
  const nativeTails=[0,1].map(etaOrder=>src.actualOrderInductionTail(live,{order:n,kind:'actual',etaOrder,bits:256}));
  assert.ok(nativeTails.every(t=>t.actualSourceConvergenceModulus&&t.positiveRemainderRetained&&!t.finiteDisplayedTermsCertified));
  return {order:n,actualSystem:raw.system,auxiliarySystem:record.auxiliary.system,strip:ns.strip,C:ns.C,Kcondition:ns.Kcondition,
    sourceLowerPairs:pairs,omegaCounts:[rawOmega.terms.length,outerOmega.terms.length],omegaNodes:[rawOmega.value,outerOmega.value,g.omega],
    omegaPrior:rawOmega.axialViscosityShift,rawPressure:raw.pKnown,originalPressureDerivative:g.pressureDerivative,lowerIntegrals,
    sourceMomentNumerators:proofs.map(p=>p.numeratorMonomials),stressCounts:[az.length,th.length],stressRows,nativeTails};
}
const rows=records.slice(2).map(sourceRows);

// Central terms in the actual n=5 pressure and Omega_4 cannot be removed.
const old=records.slice(0,5).map(r=>r.actual),raw5=n5.raw,g5=n5.global,sys5=G.picardSystems[raw5.system];
const om4=buildActualOmegaCoefficientOverX(G,{order:4,X,eta,U:old.map(k=>k.U),v:old.map(k=>k.v)});
const middle=[om4.terms[6],om4.terms[7]];
const noMiddleOmega=same(om4.value,G.sub(om4.value,add(...middle)),middle);
const pAtoms=[om4.value,...old.slice(1).map(r=>r.F)],middlePressure=prod(q(2),old[2].F,old[3].F);
const noMiddlePressure=same(raw5.pKnown,G.sub(prod(q(2),old[1].F,old[4].F),prod(q(1,2),om4.value)),pAtoms);
assert.ok(!noMiddleOmega.pass&&!noMiddlePressure.pass);
verify(raw5.pKnown,add(G.sub(prod(q(2),old[1].F,old[4].F),prod(q(1,2),om4.value)),middlePressure),pAtoms);
const {terms,sum}=G.picardPartialSum(raw5.system,3),xi=raw5.xi;
assert.throws(()=>G.picardPartialSum(raw5.system,9),e=>e?.code==='RESOURCE_LIMIT'&&e.message.includes('zero through eight'));
const P2=sys5.diagonal.map((_,i)=>add(terms[0][i],terms[1][i]));
const integrateXi=(g,c=0)=>{const t=G.fresh('C114_n5_picard_storage');return prod(xi,G.integral(prod(G.pow(t,c),G.substitute(g,xi,prod(t,xi))),t,z,o));};
const pressure3=add(integrateXi(sys5.forcing[3]),integrateXi(prod(sys5.A0[3][0],P2[0])));
assert.ok(explicitPrimitiveBodyIdentity(G,sum[3],pressure3).pass);
assert.ok(!explicitPrimitiveBodyIdentity(G,P2[3],pressure3).pass);
assert.equal(terms[1][3],z);assert.notEqual(terms[2][3],z);
assert.ok(explicitPrimitiveBodyIdentity(G,sum[1],add(...terms.slice(0,2).map(row=>integrateXi(row[5])))).pass);
assert.ok(explicitPrimitiveBodyIdentity(G,sum[2],add(...terms.slice(0,2).map(row=>integrateXi(G.neg(row[5]),2)))).pass);

const partial=[P2[0],P2[1],P2[2],sum[3]].map(id=>G.substitute(id,xi,G.sqrt(X)));
const affected=new Map(),replacement=new Map(),calls=new Set();
const primitiveOps=new Set(['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine','definite_integral','smooth_piecewise','maximum','minimum','ceiling']);
const singles=new Set(['integer_power','source_step_derivative']);
function dependsOnN5(id){
  if(id<raw5.F)return false;
  if(affected.has(id))return affected.get(id);
  const {op,args}=G.nodes[id];let hit;
  if(op==='actual_background_even_profile')hit=args[0]===raw5.system||args.slice(2,4).some(dependsOnN5);
  else if(op==='actual_background_picard')hit=args.slice(2,4).some(dependsOnN5);
  else if(op==='actual_natural_series')hit=args.slice(1,3).some(dependsOnN5);
  else if(op==='actual_quadratic_root')hit=dependsOnN5(args[2]);
  else if(op==='actual_monotone_root')hit=args.slice(1).some(dependsOnN5);
  else if(op==='actual_expression_partial')hit=dependsOnN5(G.expressionSystems[args[0]].body)||args[1].some(dependsOnN5);
  else if(singles.has(op))hit=dependsOnN5(args[0]);
  else if(['coordinate','rational','source_parameter'].includes(op))hit=false;
  else{assert.ok(primitiveOps.has(op),op);hit=args.some(dependsOnN5);}
  affected.set(id,hit);return hit;
}
function replace(id){
  if(!dependsOnN5(id))return id;
  if(replacement.has(id))return replacement.get(id);
  const {op,args}=G.nodes[id];let out;
  if(op==='actual_background_even_profile'){
    const [sid,j,x,e,radial,etaOrder]=args;
    assert.equal(sid,raw5.system);assert.equal(radial,0);calls.add(id);
    let p=partial[j];for(let k=0;k<etaOrder;k++)p=G.derivative(p,eta);
    out=G.simultaneousSubstitute(p,[X,eta],[x,e]);
  }else if(op==='actual_expression_partial')out=replace(G.materializeExpressionFunction(args[0],args[1],args[2]));
  else if(singles.has(op))out=G.node(op,[replace(args[0]),args[1]]);
  else{assert.ok(primitiveOps.has(op),op);out=G.node(op,args.map(replace));}
  replacement.set(id,out);return out;
}
const finiteDebt=g5.incoming.map(replace);assert.ok(finiteDebt.every((id,j)=>id!==g5.incoming[j]));
const moments5=g5.momentResiduals.map(id=>same(replace(id),z,finiteDebt));assert.ok(moments5.every(x=>x.pass));
const finiteFields=Object.fromEntries(['F','U','M','Pi','v','average','V','E','pressureDerivative'].map(k=>[k,replace(g5[k])]));
for(const id of [g5.lowerPressure,...g5.lowerBodies,...rows.at(-1).lowerIntegrals.map(x=>x.root),records[4].global.Pi])assert.equal(replace(id),id);

// Universal conservative variation for a free homogeneity nu. Its topology
// is the surviving leading/current interaction in each literal density above.
const shift=G.fresh('C114_free_homogeneity_nu'),xx=G.fresh('C114_X'),ee=G.fresh('C114_eta'),atoms=[shift,xx,ee,h];
const beta=add(a0,shift),gamma=add(c0,shift),om=add(prod(q(-2),A),shift),tau=add(om,q(1,2)),dx=G.sub(X,xx),de=G.sub(eta,ee);
const at=id=>G.simultaneousSubstitute(id,[X,eta],[xx,ee]);
function jet(name){
  const a=Array.from({length:6},(_,j)=>G.fresh('C114_'+name+'_'+j));atoms.push(...a);
  return add(a[0],prod(a[1],dx),prod(a[2],de),prod(q(1,2),a[3],G.pow(dx,2)),prod(a[4],dx,de),prod(q(1,2),a[5],G.pow(de,2)));
}
function stream(name,l,u){const p=G.fresh('C114_'+name);atoms.push(p);return G.sub(p,prod(dx,at(Z(l,u))));}
const f=jet('f'),u=jet('u'),p=jet('p'),F=jet('F0'),U=jet('U0'),V=stream('v',gamma,u),V0=stream('v0',c0,U);
const fx=G.derivative(f,X),ux=G.derivative(u,X),xf=prod(q(2),X,f);
const leftZ=add(T(gamma,u),prod(V0,ux),prod(V,G.derivative(U,X)),prod(U,Z(gamma,u)),prod(u,Z(c0,U)),Z(om,p),prod(q(-2),add(prod(X,G.derivative(ux,X)),ux)));
const leftT=prod(q(2),X,add(T(beta,f),prod(G.div(V0,X),add(f,prod(X,fx))),prod(G.div(V,X),add(F,prod(X,G.derivative(F,X)))),
  prod(U,Z(beta,f)),prod(u,Z(a0,F)),prod(q(-2),add(prod(X,G.derivative(fx,X)),prod(q(2),fx)))));
const Jz=add(prod(q(2),U,u),p),Jt=prod(q(2),X,add(prod(U,f),prod(u,F)));
const Bz=add(prod(V0,u),prod(V,U),prod(q(-2),X,ux),G.div(G.sub(prod(X,u),prod(q(2),eta,X,Jz)),L));
const Bt=add(prod(q(2),X,add(prod(V0,f),prod(V,F))),prod(q(-4),G.pow(X,2),fx),G.div(G.sub(prod(q(2),G.pow(X,2),f),prod(q(2),eta,X,Jt)),L));
const rest=(b,f,j,w)=>G.div(add(G.neg(prod(b,f)),prod(D,eta,G.derivative(f,eta)),prod(q(2),eta,add(w,o),j),prod(d,G.derivative(j,eta))),L);
const rz=add(G.derivative(Bz,X),rest(add(gamma,o),u,Jz,om)),rt=add(G.derivative(Bt,X),rest(add(beta,q(2)),xf,Jt,tau));
const universal=[same(at(leftZ),at(rz),atoms),same(at(leftT),at(rt),atoms)];assert.ok(universal.every(v=>v.pass));
const wrong=[same(at(leftZ),at(G.sub(rz,G.div(prod(d,G.derivative(Jz,eta)),L))),atoms),
  same(at(leftT),at(G.sub(rt,G.div(prod(q(2),eta,add(tau,o),Jt),L))),atoms)];assert.ok(wrong.every(r=>!r.pass));

const audit=actualLeadingAllOrderJets({radialOrder:2,etaOrder:7});
assert.ok(audit.pass&&audit.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(sha(JSON.stringify(audit.normProgram.nodes)),bank.wholeLeading.sha256);
const table=audit.normProgram.nodes,copied=new Map();
function copy(i){
  if(copied.has(i))return copied.get(i);
  const {op,args}=table[i];let r;
  if(op==='rational')r=q(BigInt(args[0]),BigInt(args[1]));else if(op==='source_parameter')r=G.parameter(args[0]);
  else if(op==='integer_power')r=G.pow(copy(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);r=G.node(op,args.map(copy));}
  copied.set(i,r);return r;
}
const H=prod(q(1n<<22n),add(o,...bank.wholeLeading.roots.map(copy))),B=G.maximum(o,r.Xplus),R=r.Rbase,Ef=G.substitute(r.ef,eta,z);
assert.equal(copied.size,3496);verify(prod(r.ef,add(o,G.pow(eta,2))),Ef);
const power=(a,b)=>G.exp(prod(b,G.log(a))),R1=power(R,G.sub(o,prod(q(2),lam))),Rp=power(R,G.sub(q(-2),prod(q(2),lam))),Rz=power(R,prod(q(-2),lam));
const uRhs=[G.inv(R),G.div(add(G.inv(R),G.div(q(4),prod(Ef,R1))),prod(q(2),lam))];
const fRhs=[G.inv(G.pow(R,2)),G.div(q(2),prod(Ef,Rp)),G.div(q(4),prod(Ef,Rz))];
const invRows=(rows,cap)=>G.maximum(...rows.map(row=>add(...row.map((m,j)=>prod(add(o,G.pow(m,2)),cap[j])))));
const Iu=invRows(r.Uinverse,uRhs),If=invRows(r.Einverse,fRhs),b0=q(1n<<15n),b1=q(1n<<35n),toNorm=prod(q(2),r.Xminus);
const proofStep=sourceSquareStepSecondDerivativeProof();assert.ok(proofStep.pass&&proofStep.sigmaSecondUpper==='8192');
const inv=G.maximum(o,G.inv(G.sqrt(toNorm)),G.inv(toNorm)),bU=G.div(prod(q(2),b0,Iu),R),bF=G.div(prod(q(3),b0,If),G.pow(R,2));
function uniform(record){
  const {order:n,global:g}=record,ns=record.norm.actual;
  assert.deepEqual(G.nodes[g.dU].args.slice(0,4),[X,r.X0,r.IposRight,z]);
  assert.deepEqual(G.nodes[g.dF].args.slice(0,4),[X,r.X0,r.IposRight,z]);
  assert.deepEqual(G.nodes[body(g.Pi,[X,eta])].args.slice(0,4),[X,r.Xkeep,r.Xplus,record.raw.Pi]);
  assert.equal(G.nodes[body(g.Pi,[X,eta])].args[5],z);
  verify(g.Urhs[0],G.neg(G.div(g.incoming[0],R)),g.incoming);
  verify(g.Urhs[1],G.div(add(G.neg(G.div(g.incoming[0],R)),G.div(g.incoming[3],prod(r.ef,R1))),prod(q(2),lam)),g.incoming);
  assert.deepEqual(g.Erhs,[G.neg(G.div(g.incoming[1],G.pow(R,2))),G.neg(G.div(g.incoming[2],prod(q(2),r.ef,Rp))),G.div(g.incoming[4],prod(r.ef,Rz))]);
  const E=add(o,G.div(q(2),ns.strip)),M=prod(q(4),G.pow(B,2),H,E);
  const TU=add(E,prod(bU,M)),TF=add(E,prod(bF,M)),TP=add(E,prod(q(2),B,H,E),prod(q(4),B,Ef,Rp,bF,M));
  const r0=prod(q(48),B,ns.matrixBound,E),taper=G.div(q(1024),G.parameter('t1'));
  const DU=add(r0,taper,G.div(prod(q(4),b1,Iu,M),R));
  const DF=add(r0,taper,G.div(prod(q(3),add(b0,b1),If,M),G.pow(R,2)));
  const gain=prod(q(256),G.pow(B,3),H,G.maximum(o,TU,TF,TP,DU,DF),inv);
  const K=G.maximum(add(ns.Kcondition,q(2)),G.ceiling(G.div(add(prod(q(256),G.log(q(2))),G.log(gain)),G.log(q(4)))));
  const err=prod(q(1,3),gain,G.exp(G.neg(prod(K,G.log(q(4))))));
  assert.equal(G.freeCoordinates(err).size,0);
  return {order:n,E,M,TU,TF,TP,DU,DF,matrix:ns.matrixBound,gain,K,err,freeCoordinates:0};
}
const scalars=records.slice(2).map(uniform);
assert.equal(R,G.sqrt(prod(q(2),r.X0)));
const result={schema:'MathScope.C114.OriginalNativeN5ReusableFixedRecurrenceOperands/1',prior,pins:fixed4.pins,originalNodes,originalPrefixSHA256,
  retainedLiteralN4Nodes:fixed4.originalNodeCount,originalEta:eta,originalX:X,distinctN1StressGuards:n1,
  exactOrders:rows,globalScalars:scalars,universalConservation:{independentHomogeneity:true,numerators:universal.map(p=>p.numeratorMonomials),
    wrongEtaAndExponent:wrong.map(p=>p.numeratorMonomials),evaluatedSourceOrders:[2,3,4,5]},
  N5:{actualSystem:raw5.system,rawPressure:raw5.pKnown,omegaMiddle:[...middle],
    omittedOmegaMiddleNumerator:noMiddleOmega.numeratorMonomials,omittedPressureCrossNumerator:noMiddlePressure.numeratorMonomials,
    storedPressure:'P_(K+1)',displayedP2P3Check:true,displayLimit:8,finiteMomentNumerators:moments5.map(p=>p.numeratorMonomials),
    fixedThroughLowerOrder:4,nativeCallsReplaced:calls.size,finiteFields,nativeEtaTail:rows.at(-1).nativeTails},
  originalSupports:sup.endpoints,leadingNormNodes:copied.size,pairedWholeN5:false,numericValuesMaterialized:false,
  generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({nodes:originalNodes,prefix:fixed4.originalNodeCount,orders:rows.map(r=>[r.order,...r.omegaCounts]),
  n5FiniteCalls:calls.size,universal:result.universalConservation.numerators,n5Stress:rows.at(-1).stressRows.map(r=>r.density)}));
