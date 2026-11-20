import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,stressPath,localPath,wholePath,outPath]=process.argv.slice(2);
assert.ok(outPath,'Provide original runtime, fixed stress, paired local, paired whole N2 and output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async(path,pin)=>{const raw=await readFile(path);assert.equal(sha(raw),pin,path);return JSON.parse(raw);};
const prior={stress:'e630f67a5f175f0b5e305c8f6dec1a382bb2ff24453ef152fbf84630e8677183',
  local:'e14ddddddec16b677a0f2ed7169f09bc3ffd9c2dbdee855c77167bc95db061bb',
  whole:'a38acf8164c52ef3ed3b5024b33ec7c0cda2e5c29af92dd166e674d6de112538'};
const stress=await read(stressPath,prior.stress),local=await read(localPath,prior.local),whole=await read(wholePath,prior.whole);
assert.deepEqual(local.exactLocalCoupledForcingFourIdentities,[0,0,0,0]);
assert.deepEqual(whole.exactBumpXIdentities,[0,0,0,0]);
for(const [name,hash] of Object.entries(stress.pins)) assert.equal(sha(await readFile(resolve(runtime,name))),hash,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {sourceScaledOperators,buildActualOmegaCoefficientOverX}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const native=src.prepareActualOrderInduction({order:3,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(native));
const {G,bootstrap:b,records}=native,{orderOne:r,constants:{X,eta}}=b,[n0,n1,n2,n3]=records;
assert.equal(sha(JSON.stringify(G.nodes)),stress.sourcePrefixSHA256);
assert.equal(local.actualSourcePrefix,stress.sourcePrefixSHA256);assert.equal(whole.sourcePrefix,stress.sourcePrefixSHA256);
const q=(u,v=1)=>G.q(u,v),o=G.one,z=G.zero,h=G.parameter('h'),{A,D,d,L}=G.core,nu=i=>G.mul(q(2*i),h);
const c=i=>G.add(G.neg(A),nu(i)),a=i=>G.add(G.neg(G.add(A,q(1,2))),nu(i));
const omega=G.add(G.mul(q(-2),A),nu(3)),tau=G.add(omega,q(1,2)),{T,Z}=sourceScaledOperators(G,X,eta);
const same=(x,y,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes,maxTerms:200000});
function terms(f){
  const axial=[T(c(3),f[3].U)],theta=[T(a(3),f[3].F)];
  const Fx=f.map(t=>G.derivative(t.F,X)),Ux=f.map(t=>G.derivative(t.U,X));
  for(let i=0;i<=3;i++){
    const j=3-i;
    axial.push(G.mul(X,f[i].v,Ux[j]),G.mul(f[i].U,Z(c(j),f[j].U)));
    theta.push(G.mul(f[i].v,G.add(G.mul(X,Fx[j]),f[j].F)),G.mul(f[i].U,Z(a(j),f[j].F)));
  }
  axial.push(Z(omega,f[3].Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(Ux[3],X)),Ux[3])),G.neg(Z(G.sub(c(2),D),Z(c(2),f[2].U))));
  theta.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(Fx[3],X)),G.mul(q(2),Fx[3]))),G.neg(Z(G.sub(a(2),D),Z(a(2),f[2].F))));
  return {axial,theta};
}
const globals=records.map(r=>r.global),trueTerms=terms(globals),stress3=n3.stress;
assert.deepEqual(trueTerms.axial,stress3.axialTerms);assert.deepEqual(trueTerms.theta,stress3.angularTerms);
assert.deepEqual(stress3.compactSupport,[r.Xminus,r.Xplus]);
assert.equal(stress.originalStress[0].density,stress3.thetaBody);assert.equal(stress.originalStress[1].density,stress3.zBody);
assert.deepEqual(stress.activeCutoffs,[r.Xminus,r.Xplus]);assert.equal(stress.originalEta,eta);
assert.ok(stress.originalStress.every(row=>row.wrongForwardSignRejected&&row.eta===eta));
const omegaInner=buildActualOmegaCoefficientOverX(G,{order:2,X,eta,U:records.slice(0,3).map(v=>v.actual.U),v:records.slice(0,3).map(v=>v.actual.v)});
const omegaOuter=buildActualOmegaCoefficientOverX(G,{order:2,X,eta,U:globals.slice(0,3).map(v=>v.U),v:globals.slice(0,3).map(v=>v.v)});
assert.equal(omegaInner.terms.length,9);assert.equal(omegaOuter.terms.length,9);
assert.deepEqual(G.nodes[n3.global.omega].args,[X,b.inner.aSquared,r.Xplus,omegaInner.value,omegaOuter.value,z]);
const debtRows=n3.global.incoming.map((_,j)=>G.fresh('C111_replaced_debt_'+j));
const debts=n3.global.momentResiduals.map(id=>same(G.simultaneousSubstitute(id,n3.global.incoming,debtRows),z,debtRows));
assert.ok(debts.every(row=>row.pass));

const xx=G.fresh('C111_Xa'),ee=G.fresh('C111_eta'),atoms=[xx,ee,h],dx=G.sub(X,xx),de=G.sub(eta,ee);
const anchor=p=>G.simultaneousSubstitute(p,[X,eta],[xx,ee]);
function jet(name){
  const b=Array.from({length:6},(_,i)=>G.fresh('C111_'+name+'_'+i)); atoms.push(...b);
  return G.add(b[0],G.mul(b[1],dx),G.mul(b[2],de),G.mul(q(1,2),b[3],G.pow(dx,2)),G.mul(b[4],dx,de),G.mul(q(1,2),b[5],G.pow(de,2)));
}
function profile(name,i){
  const F=jet(name+'F'),U=jet(name+'U'),base=G.fresh('C111_'+name+'V0');atoms.push(base);
  const V=G.sub(base,G.mul(dx,anchor(Z(c(i),U))));
  return {F,U,V,v:G.div(V,X),Pi:i===3?jet(name+'Pi'):z};
}
const trueProfiles=Array.from({length:4},(_,i)=>profile('true'+i,i));
const errors=[null,...[1,2,3].map(i=>profile('err'+i,i))];
const finite=trueProfiles.map((r,i)=>i?Object.fromEntries(Object.entries(r).map(([k,value])=>[k,G.sub(value,errors[i][k])])):r);
const actual=terms(trueProfiles),against=terms(finite),fullZ=G.sub(G.add(...actual.axial),G.add(...against.axial)),
  fullT=G.mul(q(2),X,G.sub(G.add(...actual.theta),G.add(...against.theta)));
const dProduct=(i,j,first,second)=>G.sub(G.mul(trueProfiles[i][first],trueProfiles[j][second]),G.mul(finite[i][first],finite[j][second]));
const lower=(first,second)=>G.add(dProduct(1,2,first,second),dProduct(2,1,first,second));
const {F:f,U:u,V:v,Pi:p}=errors[3],{F:F0,U:U0,V:V0}=trueProfiles[0],xf=G.mul(q(2),X,f);
const Jz=G.add(G.mul(q(2),U0,u),lower('U','U'),p),Jt=G.mul(q(2),X,G.add(G.mul(U0,f),G.mul(u,F0),lower('U','F')));
const Bz=G.add(G.mul(V0,u),G.mul(v,U0),lower('V','U'),G.mul(q(-2),X,G.derivative(u,X)),G.div(G.sub(G.mul(X,u),G.mul(q(2),eta,X,Jz)),L));
const Bt=G.add(G.mul(q(2),X,G.add(G.mul(V0,f),G.mul(v,F0),lower('V','F'))),G.mul(q(-4),G.pow(X,2),G.derivative(f,X)),
  G.div(G.sub(G.mul(q(2),G.pow(X,2),f),G.mul(q(2),eta,X,Jt)),L));
const rest=(bb,ff,jj,w)=>G.div(G.add(G.neg(G.mul(bb,ff)),G.mul(D,eta,G.derivative(ff,eta)),
  G.mul(q(2),eta,G.add(w,o),jj),G.mul(d,G.derivative(jj,eta))),L);
const prevZ=G.neg(Z(G.sub(c(2),D),Z(c(2),errors[2].U))),prevT=G.mul(q(-2),X,Z(G.sub(a(2),D),Z(a(2),errors[2].F)));
const R1=G.add(rest(G.add(c(3),o),u,Jz,omega),prevZ),R2=G.add(rest(G.add(a(3),q(2)),xf,Jt,tau),prevT);
const Sz=G.add(G.derivative(Bz,X),R1),St=G.add(G.derivative(Bt,X),R2);
const con=[same(anchor(fullZ),anchor(Sz),atoms),same(anchor(fullT),anchor(St),atoms)];
assert.ok(con.every(row=>row.pass));
const noLower=[same(anchor(fullZ),anchor(G.sub(Sz,G.derivative(lower('V','U'),X))),atoms),
  same(anchor(fullT),anchor(G.sub(St,G.derivative(G.mul(q(2),X,lower('V','F')),X))),atoms)];
const noVisc=[same(anchor(fullZ),anchor(G.sub(Sz,prevZ)),atoms),same(anchor(fullT),anchor(G.sub(St,prevT)),atoms)];
assert.ok([...noLower,...noVisc].every(row=>!row.pass));
const weighted=G.mul(q(2),X,errors[2].F);
const viscosityShift=same(anchor(G.neg(prevT)),anchor(Z(G.add(G.sub(a(2),D),o),Z(G.add(a(2),o),weighted))),atoms);
assert.ok(viscosityShift.pass);

const lead=actualLeadingAllOrderJets({radialOrder:2,etaOrder:5});
assert.ok(lead.pass&&lead.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(sha(JSON.stringify(lead.normProgram.nodes)),whole.leading.programSHA256);
const lookup=lead.normProgram.nodes,memo=new Map();
function clone(i){
  if(memo.has(i))return memo.get(i);
  const {op,args}=lookup[i];let t;
  if(op==='rational')t=q(BigInt(args[0]),BigInt(args[1]));
  else if(op==='source_parameter')t=G.parameter(args[0]);
  else if(op==='integer_power')t=G.pow(clone(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);t=G.node(op,args.map(clone));}
  memo.set(i,t);return t;
}
const H=G.mul(q(1n<<20n),G.add(o,...whole.leading.roots.map(clone)));
assert.equal(memo.size,2659);
const ns=[n1,n2,n3].map(n=>n.norm.actual),[,s2,s3]=ns.map(n=>n.strip),s1=G.div(b.inner.delta,q(16));
const B=G.maximum(o,r.Xplus),Q=G.parameter('Q'),t1=G.parameter('t1'),Xa=G.parameter('Xa'),l=G.parameter('lambda'),aa=G.sqrt(b.inner.aSquared);
const w=G.div(t1,q(64)),k1=G.div(q(9),G.mul(Xa,w)),
  k2=G.add(G.div(q(9),G.mul(w,G.pow(Xa,2))),G.div(q(8192),G.mul(G.pow(w,2),G.pow(Xa,2))));
const Lcut=G.add(o,G.mul(q(3),k1),k2),Ma=G.mul(q(1n<<20n),G.pow(Q,4));
const E=s=>G.add(o,G.div(q(2),s)),pow=(s,n)=>G.exp(G.mul(n,G.log(s))),R=r.Rbase,Ef=G.substitute(r.ef,eta,z);
assert.ok(same(G.mul(r.ef,G.add(o,G.pow(eta,2))),Ef).pass);
const Rone=pow(R,G.sub(o,G.mul(q(2),l))),Rp=pow(R,G.sub(q(-2),G.mul(q(2),l))),Rz=pow(R,G.mul(q(-2),l));
const ur=[G.inv(R),G.div(G.add(G.inv(R),G.div(q(5),G.mul(Ef,Rone))),G.mul(q(2),l))];
const fr=[G.inv(G.pow(R,2)),G.div(q(5),G.mul(q(2),Ef,Rp)),G.div(q(5),G.mul(Ef,Rz))];
const maxRows=(rows,rhs)=>G.maximum(...rows.map(row=>G.add(...row.map((m,j)=>G.mul(G.add(o,G.pow(m,2)),rhs[j])))));
const Iu=maxRows(r.Uinverse,ur),If=maxRows(r.Einverse,fr),b0=q(1n<<15n),b1=q(1n<<35n),b2=q(BigInt(whole.sigmaThirdBound)*2048n**3n);
const uv=G.div(G.mul(q(2),b0,Iu),R),fv=G.div(G.mul(q(3),b0,If),G.pow(R,2));
const gainU=G.add(uv,G.div(G.mul(G.add(G.mul(q(3),b1),b2),Iu),G.pow(R,3)));
const gainF=G.add(fv,G.div(G.mul(q(3),G.add(b2,G.mul(q(4),b1),G.mul(q(4),b0)),If),G.pow(R,4)));
const bumps=G.add(gainU,gainF),B2=G.pow(B,2),B3=G.pow(B,3),M1=ns[0].solutionNorm,M2=ns[1].solutionNorm,C1=ns[0].C;
const H1=G.div(G.mul(q(4096),G.add(o,C1),G.add(o,M1),G.pow(Q,64)),G.mul(t1,s1));
const Fd2PerE=G.div(G.mul(q(1n<<25n),H1),G.pow(s1,2));
const trueLocal=({C,solutionNorm,strip})=>G.mul(Lcut,G.add(solutionNorm,G.mul(q(2),G.add(G.mul(Ma,E(strip),solutionNorm),C))));
const P=G.maximum(o,b.inner.B,...ns.slice(0,2).map(trueLocal));
const omega0=G.mul(q(1n<<15n),B,G.pow(H,2));
const LB1=G.mul(G.add(o,trueLocal(ns[0])),G.pow(G.add(o,G.inv(s1)),3));
const W1=G.add(G.mul(q(4),B2,H,LB1),G.mul(B2,omega0));
const A1=G.mul(q(4096),G.add(LB1,G.mul(W1,bumps)));
const omega1=G.mul(q(1n<<30n),B2,H,A1),LB2=G.mul(E(s2),G.add(o,M2));
const W2=G.add(G.mul(q(4),B2,H,LB2),G.mul(q(2),B2,G.add(G.pow(A1,2),omega1)));
const A2=G.mul(q(4096),G.add(LB2,G.mul(W2,G.add(uv,fv))));
const boundA=G.maximum(o,H,A1,A2),D1e=G.mul(q(1n<<16n),G.pow(G.add(o,G.inv(s1)),5));
const N2EtaLoss=G.pow(E(s2),3),g1=G.mul(bumps,B,G.add(G.mul(q(4),B,A1,D1e),G.mul(q(1n<<15n),B2,H,D1e))),
  g2=G.add(N2EtaLoss,G.mul(bumps,q(4),B2,H,N2EtaLoss));
const normalizer=G.maximum(o,G.inv(G.mul(q(2),r.Xminus)),G.inv(G.sqrt(G.mul(q(2),r.Xminus))));
function gains(e,e2,e3){
  const f2=G.mul(Fd2PerE,e),E2=G.add(e2,G.mul(q(2),aa,f2)),J2=G.add(G.mul(q(16),Ma,E(s2),E2),f2),cut2=G.mul(Lcut,G.add(E2,G.mul(q(2),J2)));
  const S2=G.add(G.mul(g1,e),G.mul(g2,cut2)),D1=G.mul(D1e,e),D2=G.mul(q(4096),S2),sumErr=G.add(D1,D2);
  const omegaErr=G.mul(q(1n<<30n),B2,boundA,sumErr),lowerErr=G.mul(q(1n<<32n),B3,boundA,sumErr);
  const f3=G.div(G.mul(q(1n<<35n),P,G.add(e,cut2)),G.pow(s2,4));
  const E3=G.add(e3,G.mul(q(2),aa,f3)),J3=G.add(G.mul(q(16),Ma,E(s3),E3),f3),cut3=G.mul(Lcut,G.add(E3,G.mul(q(2),J3)));
  const ordinary3=G.mul(E(s3),cut3),Moment3=G.add(G.mul(q(4),B2,H,ordinary3),G.mul(B,lowerErr));
  const S3=G.add(ordinary3,G.mul(bumps,Moment3)),P3=G.add(ordinary3,G.mul(B,G.add(G.mul(q(2),H,S3),lowerErr)));
  const C=G.add(G.mul(boundA,G.add(S3,sumErr)),P3),J=G.add(C,G.mul(q(1n<<28n),B2,D2));
  const stressGain=G.mul(q(256),B3,normalizer,J),all=G.add(e,cut2,stressGain);
  return {cut2,S2,D1,D2,omegaErr,lowerErr,E3,cut3,Moment3,S3,P3,C,J,stressGain,all};
}
const coeffs=[[o,z,z],[z,o,z],[z,z,o]].map(a=>gains(...a)),[Pn,P2,P3]=coeffs.map(r=>r.all);
const e0=G.mul(q(1n<<25n),G.pow(Q,64),G.pow(t1,-2),G.add(G.mul(q(1n<<73n),G.pow(Q,-77)),G.mul(q(1n<<46n),G.pow(Q,-19))));
const kdepth=v=>G.ceiling(G.div(G.add(G.mul(q(258),G.log(q(2))),G.log(G.add(o,v))),G.log(q(4))));
const N=G.add(q(2),G.ceiling(G.div(G.log(G.add(o,G.mul(G.pow(q(2),258),G.add(o,Pn),e0))),G.mul(q(25),G.log(Q)))));
const K2=G.maximum(G.add(ns[1].Kcondition,q(2)),kdepth(P2)),K3=G.maximum(G.add(ns[2].Kcondition,q(2)),kdepth(P3));
assert.ok([N,K2,K3].every(id=>G.freeCoordinates(id).size===0));
const result={schema:'MathScope.C111.OriginalNativeN3WholePairedOperands/1',prior,sourcePrefix:stress.sourcePrefixSHA256,
  originalSystems:[n2.raw.system,n3.raw.system],originalEta:eta,originalStress:stress.originalStress,
  exactCoupledConservativeNumerators:con.map(v=>v.numeratorMonomials),lowerTransportControls:noLower.map(v=>v.numeratorMonomials),
  previousViscosityControls:noVisc.map(v=>v.numeratorMonomials),weightedViscosityShiftNumerator:viscosityShift.numeratorMonomials,
  originalMomentResidualsAfterArbitraryNewDebts:debts.map(v=>v.numeratorMonomials),actualOmega2:{terms:[9,9],switch:n3.global.omega,retainedEta:eta,
    native:n3.raw.omegaOverX,whole:omegaOuter.value,ends:[b.inner.aSquared,r.Xplus]},
  leadingNormNodes:2659,closedScaleOperands:{H,Ma,Lcut,A1,A2,LB1,LB2,W1,W2,omega0,omega1,B,bump:bumps,g1,g2,normalizer,D1e,boundA,P},
  linearPositiveBudgetColumns:coeffs,sourceDepths:{N,K2,K3,freeCoordinates:0,separateBits:258,actualFiniteValuesEvaluated:false},
  sourcePressureGaugeUnchanged:true,bothOriginalLowerHistoriesPaired:true,N3OuterMomentPrimitiveBound:true,originalYGeneral:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(outPath,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exact:result.exactCoupledConservativeNumerators,wrong:[...result.lowerTransportControls,...result.previousViscosityControls],N,K2,K3}));
