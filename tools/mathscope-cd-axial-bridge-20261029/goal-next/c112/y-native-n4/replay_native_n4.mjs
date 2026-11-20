import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,n3Path,pairPath,wholePath,output]=process.argv.slice(2);
assert.ok(output,'Provide original runtime, previous native N3, paired N3, whole N2 and output');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=async(path,pin)=>{const data=await readFile(path);assert.equal(sha(data),pin,path);return JSON.parse(data);};
const prior={native3:'e6b55d541b5f224b8d291abe101006035b97f54b0e0d5e1c87f7b7c527ba63e1',
  paired3:'bc16d83e13923678ea34f8ab239a9990ac81179f38e2302718c45a32abf2dc77',
  whole2:'a38acf8164c52ef3ed3b5024b33ec7c0cda2e5c29af92dd166e674d6de112538'};
const prev=await read(n3Path,prior.native3),paired=await read(pairPath,prior.paired3),whole=await read(wholePath,prior.whole2);
assert.equal(paired.pairedHistoryErrorsThroughWholeX.N1N2Paired,true);
assert.equal(whole.leading.requestedEtaOrder,5);
const pins={...prev.pins,'actual-leading-all-order-jets.mjs':'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d'};
for(const [name,hash] of Object.entries(pins))assert.equal(sha(await readFile(resolve(runtime,name))),hash,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {sourceScaledOperators,buildActualOmegaCoefficientOverX,sourceSquareStepSecondDerivativeProof}=await load('actual-continuation-exact-order-two-source.mjs');
const {actualSupportOrderProof}=await load('actual-continuation-exact-support.mjs');
const {actualPositiveStressFTC}=await load('actual-background-residual-bridge.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {explicitPrimitiveBodyIdentity}=await load('actual-global-primitive-kernels.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const live=src.prepareActualOrderInduction({order:4,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap:b,records}=live,[n0,n1,n2,n3,n4]=records,{orderOne:r,inner,constants:{X,eta}}=b;
const originalNodeCount=G.nodes.length,originalPrefixSHA256=sha(JSON.stringify(G.nodes));
assert.equal(sha(JSON.stringify(G.nodes.slice(0,prev.originalNodeCount))),prev.originalPrefixSHA256);
assert.equal(n3.stress.thetaBody,prev.stress[0].density);assert.equal(n3.stress.zBody,prev.stress[1].density);
assert.equal(n3.raw.system,5);assert.equal(n3.auxiliary.system,4);
const {raw,actual,global:g,stress}=n4,ns=n4.norm.actual,nat=n4.norm.auxiliary;
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,h=G.parameter('h'),lambda=G.parameter('lambda'),{A,D,d,L}=G.core,nu=j=>G.mul(q(2*j),h);
const a=G.neg(G.add(A,q(1,2))),c=G.neg(A),{Z,T}=sourceScaledOperators(G,X,eta),{xi}=raw,sys=G.picardSystems[raw.system];
const ax=id=>G.substitute(id,X,G.pow(xi,2));
const exact=(l,r,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(l,r),{atomicNodes,maxTerms:200000});
const same=(l,r,atoms=[])=>assert.ok(exact(l,r,atoms).pass);
const body=(id,ps=[X,eta])=>{
  const n=G.nodes[id];assert.equal(n.op,'actual_expression_partial');
  assert.deepEqual(n.args.slice(1),[ps,ps.map(()=>0)]);return G.expressionSystems[n.args[0]].body;
};
const integral=id=>{const n=G.nodes[id];assert.equal(n.op,'definite_integral');return n.args;};
const flat=id=>G.nodes[id].op==='add'?G.nodes[id].args.flatMap(flat):[id];
assert.equal(raw.system,7);assert.equal(n4.auxiliary.system,6);
assert.equal(raw.lambda,nu(4));assert.equal(ns.strip,G.div(inner.delta,q(8n*256n**4n)));
assert.equal(nat.radius,q(49,8));assert.equal(nat.radialDomain,G.div(q(49,8),G.parameter('Lambda')));
assert.equal(sys.order,4);assert.equal(sys.kind,'actual');assert.deepEqual(sys.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(sys.zeroAxisDatum,Array(6).fill(z));
assert.deepEqual(sys.radialDomain,[z,G.sqrt(inner.aSquared)]);assert.equal(ns.radialDomain,inner.aSquared);
assert.deepEqual(sys.lowerOrders,records.slice(0,4).map(({order,actual:f})=>({order,F:ax(f.F),U:ax(f.U),v:ax(f.v),kind:'actual'})));
assert.ok(records.slice(1).every(n=>n.global.actualMomentChecks.every(row=>row.pass)));
assert.equal(ns.C,G.mul(q(2),G.add(ns.matrixBound,...ns.forcingBounds)));
assert.equal(ns.Kcondition,G.ceiling(G.div(G.mul(q(72),G.pow(ns.C,2),ns.radialDomain),ns.strip)));
assert.equal(sys.tail.sourceBound,ns.C);assert.equal(sys.tail.Kcondition,ns.Kcondition);
const tails=[0,1].map(etaOrder=>src.actualOrderInductionTail(live,{order:4,kind:'actual',etaOrder,bits:256}));

const lowerActual=records.slice(0,4).map(n=>n.actual),lowerWhole=records.slice(0,4).map(n=>n.global);
const omegaFor=hist=>buildActualOmegaCoefficientOverX(G,{order:3,X,eta,U:hist.map(f=>f.U),v:hist.map(f=>f.v)});
const omegaI=omegaFor(lowerActual),omegaO=omegaFor(lowerWhole);
assert.equal(omegaI.terms.length,11);assert.equal(omegaO.terms.length,11);
assert.equal(omegaI.axialViscosityShift,2);assert.equal(omegaO.axialViscosityShift,2);
assert.equal(raw.omegaOverX,omegaI.value);
assert.notEqual(omegaI.value,omegaO.value);
assert.deepEqual(G.nodes[g.omega],{op:'smooth_piecewise',args:[X,inner.aSquared,r.Xplus,omegaI.value,omegaO.value,z]});
function products(hist){
  const [,f1,f2,f3]=hist;
  const f=G.add(G.mul(q(2),f1.F,f3.F),G.pow(f2.F,2));
  const angular=G.mul(q(2),X,G.add(G.mul(f1.U,f3.F),G.mul(f2.U,f2.F),G.mul(f3.U,f1.F)));
  const axial=G.sub(G.add(G.mul(q(2),f1.U,f3.U),G.pow(f2.U,2)),G.mul(X,f));
  return [f,angular,axial];
}
const actualAtoms=lowerActual.slice(1).flatMap(t=>[t.F,t.U]);
same(raw.pKnown,G.sub(products(lowerActual)[0],G.mul(q(1,2),omegaI.value)),[...actualAtoms,omegaI.value]);
const pressureWithoutF2Squared=G.sub(G.mul(q(2),lowerActual[1].F,lowerActual[3].F),G.mul(q(1,2),omegaI.value));
const pressureWrong=exact(raw.pKnown,pressureWithoutF2Squared,[...actualAtoms,omegaI.value]);
assert.ok(!pressureWrong.pass);
const [pF,pT,pZ]=products(lowerWhole),wholeAtoms=[X,...lowerWhole.slice(1).flatMap(t=>[t.F,t.U]),g.omega];
g.lowerBodies.forEach((root,j)=>same(root,[pF,pT,pZ][j],wholeAtoms));
same(g.lowerPressure,G.sub(pF,G.mul(q(1,2),g.omega)),wholeAtoms);
const rewritten=[g.lowerPressure,pT,G.add(pZ,G.mul(q(1,2),X,g.omega))];
const lowerIntegrals=g.incoming.slice(2).map((entry,j)=>{
  const selected=flat(body(entry,[eta])).filter(node=>G.nodes[node].op==='definite_integral'&&G.nodes[node].args[3]===r.Xplus);
  assert.equal(selected.length,1);
  const [root]=selected,[inside,binder,left,right]=integral(root);
  assert.deepEqual([left,right],[z,r.Xplus]);same(body(inside,[binder,eta]),rewritten[j],wholeAtoms);
  return {root,binder,eta,endpoints:[left,right]};
});
const thetaF=[],axialF=[];
for(const i of [1,2,3]){
  const j=4-i,f=lowerActual[i],t=lowerActual[j];
  thetaF.push(G.mul(f.v,G.add(t.F,G.mul(X,G.derivative(t.F,X)))),G.mul(f.U,Z(G.add(a,nu(j)),t.F)));
  axialF.push(G.mul(X,f.v,G.derivative(t.U,X)),G.mul(f.U,Z(G.add(c,nu(j)),t.U)));
}
thetaF.push(G.neg(Z(G.sub(G.add(a,nu(3)),D),Z(G.add(a,nu(3)),n3.actual.F))));
axialF.push(G.neg(Z(G.sub(G.add(c,nu(3)),D),Z(G.add(c,nu(3)),n3.actual.U))));
same(G.add(...thetaF),raw.Htheta);same(G.add(...axialF),raw.Hz);

const {F:F0,U:U0,v:v0}=n0.actual;
const typed=src.actualInductionLinearKernel(G,{X,eta,xi,lambda:nu(4),F0,U0,v0,pKnown:raw.pKnown,Htheta:raw.Htheta,Hz:raw.Hz});
assert.deepEqual(sys.A0,typed.matrix0.map(row=>row.map(ax)));assert.deepEqual(sys.A1,typed.matrix1.map(row=>row.map(ax)));
assert.deepEqual(sys.forcing,typed.rawForcing.map(ax));
assert.deepEqual(sys.A0.slice(0,2),[[z,z,z,z,o,z],[z,z,z,z,z,o]]);
assert.ok(sys.A1.slice(0,2).every(r=>r.every(x=>x===z)));assert.deepEqual(sys.forcing.slice(0,2),[z,z]);
const pRow=G.mul(q(4),xi,ax(F0));
assert.deepEqual(sys.A0[3],[pRow,z,z,z,z,z]);assert.deepEqual(sys.A1[3],Array(6).fill(z));
assert.equal(sys.forcing[3],G.mul(q(2),xi,ax(raw.pKnown)));
const {terms,sum}=G.picardPartialSum(raw.system,3);
assert.throws(()=>G.picardPartialSum(raw.system,9),e=>e?.code==='RESOURCE_LIMIT'&&e.message.includes('zero through eight'));
const P2=sys.diagonal.map((_,i)=>G.add(terms[0][i],terms[1][i]));
const integrateXi=(g,c=0)=>{const t=G.fresh('C112_n4_storage');return G.mul(xi,G.integral(G.mul(G.pow(t,c),G.substitute(g,xi,G.mul(t,xi))),t,z,o));};
const pressure3=G.add(integrateXi(sys.forcing[3]),integrateXi(G.mul(pRow,P2[0])));
assert.ok(explicitPrimitiveBodyIdentity(G,sum[3],pressure3).pass);
assert.ok(!explicitPrimitiveBodyIdentity(G,P2[3],pressure3).pass);
assert.equal(terms[1][3],z);assert.notEqual(terms[2][3],z);
assert.ok(explicitPrimitiveBodyIdentity(G,sum[1],G.add(...terms.slice(0,2).map(row=>integrateXi(row[5])))).pass);
assert.ok(explicitPrimitiveBodyIdentity(G,sum[2],G.add(...terms.slice(0,2).map(row=>integrateXi(G.neg(row[5]),2)))).pass);

const fields={F:g.F,U:g.U,M:g.M,Pi:g.Pi,v:g.v,average:g.average,V:g.V,E:g.E,pressureDerivative:g.pressureDerivative};
const hasCurrent=new Map(),repeated=new Map(),nativeCalls=new Set();
const leaves=new Set(['coordinate','rational','source_parameter']);
const unaryTyped=new Set(['integer_power','source_step_derivative']);
const ordinary=new Set(['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine','definite_integral','smooth_piecewise','maximum','minimum','ceiling']);
function touches(id){
  if(id<raw.F)return false;
  if(hasCurrent.has(id))return hasCurrent.get(id);
  const {op,args}=G.nodes[id];let hit;
  if(op==='actual_background_even_profile')hit=args[0]===raw.system||args.slice(2,4).some(touches);
  else if(op==='actual_background_picard')hit=args.slice(2,4).some(touches);
  else if(op==='actual_natural_series')hit=args.slice(1,3).some(touches);
  else if(op==='actual_quadratic_root')hit=touches(args[2]);
  else if(op==='actual_monotone_root')hit=args.slice(1).some(touches);
  else if(op==='actual_expression_partial')hit=touches(G.expressionSystems[args[0]].body)||args[1].some(touches);
  else if(unaryTyped.has(op))hit=touches(args[0]);
  else if(leaves.has(op))hit=false;
  else{assert.ok(ordinary.has(op),op);hit=args.some(touches);}
  hasCurrent.set(id,hit);return hit;
}
const partial=[P2[0],P2[1],P2[2],sum[3]].map(id=>G.substitute(id,xi,G.sqrt(X)));
function replace(id){
  if(!touches(id))return id;
  if(repeated.has(id))return repeated.get(id);
  const {op,args}=G.nodes[id];let next;
  if(op==='actual_background_even_profile'){
    const [sid,j,x,e,radial,etaOrder]=args;
    assert.equal(sid,raw.system);assert.equal(radial,0);nativeCalls.add(id);
    let val=partial[j];for(let k=0;k<etaOrder;k++)val=G.derivative(val,eta);
    next=G.simultaneousSubstitute(val,[X,eta],[x,e]);
  }else if(op==='actual_expression_partial')next=replace(G.materializeExpressionFunction(args[0],args[1],args[2]));
  else if(unaryTyped.has(op))next=G.node(op,[replace(args[0]),args[1]]);
  else{assert.ok(ordinary.has(op),op);next=G.node(op,args.map(replace));}
  repeated.set(id,next);return next;
}
const approximated=Object.fromEntries(Object.entries(fields).map(([name,id])=>[name,replace(id)]));
const debts=g.incoming.map(replace);
assert.ok(debts.every((node,j)=>node!==g.incoming[j]));
const repaired=g.momentResiduals.map(id=>exact(replace(id),z,debts));
assert.ok(repaired.every(p=>p.pass));
for(const id of [g.lowerPressure,...g.lowerBodies,...lowerIntegrals.map(row=>row.root),n3.global.Pi])assert.equal(replace(id),id);
const support=actualSupportOrderProof(b.completedOrderOne);
assert.ok(support.pass&&support.expressionChecks.allEndpointsIndependentOfEta);
assert.deepEqual(stress.compactSupport,[r.Xminus,r.Xplus]);
assert.equal(stress.lowerViscosityOrder,3);assert.ok(stress.conservativeSourceMoments.every(Boolean));
const ftc=actualPositiveStressFTC(live);
assert.ok(ftc.pass);
function findInt(id){const n=G.nodes[id];if(n.op==='definite_integral')return [id];
  return ['add','multiply','inverse'].includes(n.op)?[...new Set(n.args.flatMap(findInt))]:[];}
const stressRows=ftc.rows.filter(x=>x.order===4).map(row=>{
  const theta=row.component==='theta',density=theta?stress.thetaBody:stress.zBody;
  const [p,i,a,b]=integral(row.integral);assert.deepEqual([a,b],[r.Xminus,X]);assert.equal(p,G.substitute(density,X,i));
  const backwards=findInt(theta?stress.backwardTheta:stress.backwardZ);assert.equal(backwards.length,1);
  const [j]=backwards,[bj,k,c,d]=integral(j);assert.deepEqual([c,d],[X,r.Xplus]);assert.equal(bj,G.substitute(density,X,k));
  assert.ok([p,bj].every(id=>G.freeCoordinates(id).has(eta)&&!G.freeCoordinates(id).has(X)));
  assert.ok(!row.negativeWrongSign.pass);
  return {component:row.component,density,root:row.root,eta,forward:[a,b],backward:[c,d],binders:[i,k],normalizer:row.denominator,wrongSignRejected:true};
});
assert.equal(stressRows.length,2);

// Exact genuinely retained N4 source summands, with all positive lower orders fixed.
const gamma=G.add(c,nu(4)),beta=G.add(a,nu(4)),om=G.add(G.mul(q(-2),A),nu(4)),th=G.add(om,q(1,2));
const all=records.map(n=>n.global);
function density(f){
  const angular=[T(beta,f[4].F)],axial=[T(gamma,f[4].U)];
  const Fx=f.map(t=>G.derivative(t.F,X)),Ux=f.map(t=>G.derivative(t.U,X));
  for(let i=0;i<=4;i++){
    const j=4-i;
    angular.push(G.mul(f[i].v,G.add(G.mul(X,Fx[j]),f[j].F)),G.mul(f[i].U,Z(G.add(a,nu(j)),f[j].F)));
    axial.push(G.mul(X,f[i].v,Ux[j]),G.mul(f[i].U,Z(G.add(c,nu(j)),f[j].U)));
  }
  angular.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(Fx[4],X)),G.mul(q(2),Fx[4]))),G.neg(Z(G.sub(G.add(a,nu(3)),D),Z(G.add(a,nu(3)),f[3].F))));
  axial.push(Z(om,f[4].Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(Ux[4],X)),Ux[4])),G.neg(Z(G.sub(G.add(c,nu(3)),D),Z(G.add(c,nu(3)),f[3].U))));
  return {angular,axial};
}
const termsActual=density(all);
assert.deepEqual(termsActual.angular,stress.angularTerms);assert.deepEqual(termsActual.axial,stress.axialTerms);
const changed=density([...all.slice(0,4),Object.fromEntries(['F','U','Pi','v'].map(k=>[k,G.fresh('C112_changed_'+k)]))]);
const unchanged={angular:[3,4,5,6,7,8,12],axial:[3,4,5,6,7,8,13]};
for(const [key,indices] of Object.entries(unchanged))for(const j of indices)assert.equal(termsActual[key][j],changed[key][j]);

const xx=G.fresh('C112_X'),ee=G.fresh('C112_eta'),atoms=[xx,ee,h],dx=G.sub(X,xx),de=G.sub(eta,ee);
const at=id=>G.simultaneousSubstitute(id,[X,eta],[xx,ee]);
function jet(name){
  const u=Array.from({length:6},(_,i)=>G.fresh('C112_'+name+'_'+i));atoms.push(...u);
  return G.add(u[0],G.mul(u[1],dx),G.mul(u[2],de),G.mul(q(1,2),u[3],G.pow(dx,2)),G.mul(u[4],dx,de),G.mul(q(1,2),u[5],G.pow(de,2)));
}
function stream(name,b,u){const v=G.fresh('C112_'+name);atoms.push(v);return G.sub(v,G.mul(dx,at(Z(b,u))));}
const f=jet('F4Diff'),u=jet('U4Diff'),p=jet('Pi4Diff'),F=jet('F0'),U=jet('U0');
const V=stream('VDiff',gamma,u),V0=stream('V0',c,U),fx=G.derivative(f,X),ux=G.derivative(u,X),xf=G.mul(q(2),X,f);
const lz=G.add(T(gamma,u),G.mul(V0,ux),G.mul(V,G.derivative(U,X)),G.mul(U,Z(gamma,u)),G.mul(u,Z(c,U)),Z(om,p),
  G.mul(q(-2),G.add(G.mul(X,G.derivative(ux,X)),ux)));
const lt=G.mul(q(2),X,G.add(T(beta,f),G.mul(G.div(V0,X),G.add(f,G.mul(X,fx))),G.mul(G.div(V,X),G.add(F,G.mul(X,G.derivative(F,X)))),
  G.mul(U,Z(beta,f)),G.mul(u,Z(a,F)),G.mul(q(-2),G.add(G.mul(X,G.derivative(fx,X)),G.mul(q(2),fx)))));
const Jz=G.add(G.mul(q(2),U,u),p),Jt=G.mul(q(2),X,G.add(G.mul(U,f),G.mul(u,F)));
const Bz=G.add(G.mul(V0,u),G.mul(V,U),G.mul(q(-2),X,ux),G.div(G.sub(G.mul(X,u),G.mul(q(2),eta,X,Jz)),L));
const Bt=G.add(G.mul(q(2),X,G.add(G.mul(V0,f),G.mul(V,F))),G.mul(q(-4),G.pow(X,2),fx),
  G.div(G.sub(G.mul(q(2),G.pow(X,2),f),G.mul(q(2),eta,X,Jt)),L));
const rest=(b,f,j,w)=>G.div(G.add(G.neg(G.mul(b,f)),G.mul(D,eta,G.derivative(f,eta)),G.mul(q(2),eta,G.add(w,o),j),G.mul(d,G.derivative(j,eta))),L);
const sz=G.add(G.derivative(Bz,X),rest(G.add(gamma,o),u,Jz,om)),st=G.add(G.derivative(Bt,X),rest(G.add(beta,q(2)),xf,Jt,th));
const con=[[lz,sz],[lt,st]].map(([l,r])=>exact(at(l),at(r),atoms));assert.ok(con.every(row=>row.pass));
const wrong=[exact(at(lz),at(G.sub(sz,G.div(G.mul(d,G.derivative(Jz,eta)),L))),atoms),
  exact(at(lt),at(G.sub(st,G.div(G.mul(q(2),eta,G.add(th,o),Jt),L))),atoms)];
assert.ok(wrong.every(row=>!row.pass));

// Same original whole leading norm, inverse and supports as the verified lower prefixes.
const norm=actualLeadingAllOrderJets({radialOrder:2,etaOrder:5});
assert.ok(norm.pass&&norm.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(sha(JSON.stringify(norm.normProgram.nodes)),whole.leading.programSHA256);
const map=new Map(),table=norm.normProgram.nodes;
function copy(i){if(map.has(i))return map.get(i);const {op,args}=table[i];let r;
  if(op==='rational')r=q(BigInt(args[0]),BigInt(args[1]));
  else if(op==='source_parameter')r=G.parameter(args[0]);
  else if(op==='integer_power')r=G.pow(copy(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);r=G.node(op,args.map(copy));}
  map.set(i,r);return r;
}
const H=G.mul(q(1n<<20n),G.add(o,...whole.leading.roots.map(copy)));
assert.equal(map.size,2659);
const Ef=G.substitute(r.ef,eta,z),R=r.Rbase,B=G.maximum(o,r.Xplus),s=ns.strip,ex=(x,e)=>G.exp(G.mul(e,G.log(x)));
assert.equal(R,G.sqrt(G.mul(q(2),r.X0)));
assert.deepEqual(G.nodes[g.dU].args.slice(0,4),[X,r.X0,r.IposRight,z]);
assert.deepEqual(G.nodes[g.dF].args.slice(0,4),[X,r.X0,r.IposRight,z]);
same(G.mul(r.ef,G.add(o,G.pow(eta,2))),Ef);
const R1=ex(R,G.sub(o,G.mul(q(2),lambda))),Rp=ex(R,G.sub(q(-2),G.mul(q(2),lambda))),Rz=ex(R,G.mul(q(-2),lambda));
assert.deepEqual(g.Urhs,[G.neg(G.div(g.incoming[0],R)),G.div(G.add(G.neg(G.div(g.incoming[0],R)),G.div(g.incoming[3],G.mul(r.ef,R1))),G.mul(q(2),lambda))]);
assert.deepEqual(g.Erhs,[G.neg(G.div(g.incoming[1],G.pow(R,2))),G.neg(G.div(g.incoming[2],G.mul(q(2),r.ef,Rp))),G.div(g.incoming[4],G.mul(r.ef,Rz))]);
const rhsU=[G.inv(R),G.div(G.add(G.inv(R),G.div(q(4),G.mul(Ef,R1))),G.mul(q(2),lambda))];
const rhsF=[G.inv(G.pow(R,2)),G.div(q(2),G.mul(Ef,Rp)),G.div(q(4),G.mul(Ef,Rz))];
const invRows=(a,b)=>G.maximum(...a.map(r=>G.add(...r.map((m,j)=>G.mul(G.add(o,G.pow(m,2)),b[j])))));
const Iu=invRows(r.Uinverse,rhsU),If=invRows(r.Einverse,rhsF);
const sharp=sourceSquareStepSecondDerivativeProof();assert.ok(sharp.pass&&sharp.sigmaSecondUpper==='8192');
const E=G.add(o,G.div(q(2),s)),M=G.mul(q(4),G.pow(B,2),H,E),b0=q(1n<<15n),b1=q(1n<<35n);
const bU=G.div(G.mul(q(2),b0,Iu),R),bF=G.div(G.mul(q(3),b0,If),G.pow(R,2));
const TU=G.add(E,G.mul(bU,M)),TF=G.add(E,G.mul(bF,M));
const TP=G.add(E,G.mul(q(2),B,H,E),G.mul(q(4),B,Ef,Rp,M,bF));
const capRadial=G.mul(q(48),B,ns.matrixBound,E),taper=G.div(q(1024),G.parameter('t1'));
const DU=G.add(capRadial,taper,G.div(G.mul(q(4),b1,Iu,M),R));
const DF=G.add(capRadial,taper,G.div(G.mul(q(3),G.add(b0,b1),If,M),G.pow(R,2)));
const Utotal=G.maximum(o,TU,TF,TP,DU,DF),den=G.mul(q(2),r.Xminus),normInv=G.maximum(o,G.inv(den),G.inv(G.sqrt(den)));
const gain=G.mul(q(256),G.pow(B,3),H,Utotal,normInv);
const K=G.maximum(G.add(ns.Kcondition,q(2)),G.ceiling(G.div(G.add(G.mul(q(256),G.log(q(2))),G.log(gain)),G.log(q(4)))));
const error=G.mul(q(1,3),gain,G.exp(G.neg(G.mul(K,G.log(q(4))))));
assert.equal(G.freeCoordinates(error).size,0);
assert.deepEqual(G.nodes[actual.F].args.slice(0,4),[X,r.Xkeep,r.Xcut,raw.F]);
assert.deepEqual(G.nodes[actual.U].args.slice(0,4),[X,r.Xkeep,r.Xcut,raw.U]);
assert.deepEqual(G.nodes[body(g.Pi)].args.slice(0,4),[X,r.Xkeep,r.Xplus,raw.Pi]);
assert.equal(G.nodes[body(g.Pi)].args[5],z);

const out={schema:'MathScope.C112.OriginalNativeN4FixedLowerOperands/1',prior,pins,originalNodeCount,originalPrefixSHA256,
  retainedLiteralN3Nodes:prev.originalNodeCount,originalEta:eta,originalX:X,nativeSystem:raw.system,auxiliarySystem:n4.auxiliary.system,
  nativeNorm:{C:ns.C,matrix:ns.matrixBound,s,Kcondition:ns.Kcondition,domain:ns.radialDomain,etaTails:tails},
  pressureStorage:{nativeVelocity:'P_K',nativePressure:'P_(K+1)',finiteDepths:[2,3],finitePressure:sum[3],wrongSameDepthRejected:true,displayMax:8},
  omega3:{raw:raw.omegaOverX,outer:omegaO.value,selector:g.omega,branchTermCounts:[11,11],switch:[inner.aSquared,r.Xplus],
    physicalPairs:[[1,3],[2,2],[3,1]],normalizedOmegaTransportPairs:[[0,3],[1,2],[2,1],[3,0]],previousViscosityOrder:2,
    rawKnownPressure:raw.pKnown,lowerPressure:g.lowerPressure,lowerIntegrals,omittedMiddlePressureProductNumerator:pressureWrong.numeratorMonomials},
  fiveMomentNumerators:repaired.map(row=>row.numeratorMonomials),replacedNativeN4Calls:nativeCalls.size,
  originalFields:fields,finiteFields:approximated,lowerHistoriesFrozenThroughOrder:3,
  originalStress:{rows:stressRows,counts:[stress.axialTerms.length,stress.angularTerms.length],fixedLowerOnlyPositions:unchanged,
    conservativeNumerators:con.map(row=>row.numeratorMonomials),wrongEtaAndHomogeneity:wrong.map(row=>row.numeratorMonomials)},
  support:support.endpoints,leadingNormNodes:map.size,uniformBudget:{B,H,s,E,Ef,R,Iu,If,M,TU,TF,TP,DU,DF,normInv,gain,K,error,freeCoordinates:0},
  nativeNumericalValuesEvaluated:false,pairedN4Quantitative:false,generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({nodes:originalNodeCount,previous:prev.originalNodeCount,systems:[n4.auxiliary.system,raw.system],replaced:nativeCalls.size,
  moments:out.fiveMomentNumerators,stress:stressRows.map(row=>row.density),con:out.originalStress.conservativeNumerators,K}));
