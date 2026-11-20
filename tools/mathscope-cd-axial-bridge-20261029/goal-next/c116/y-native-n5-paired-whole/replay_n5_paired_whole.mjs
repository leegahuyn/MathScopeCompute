import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,fixedPath,bankPath,local4Path,paired4Path,old2Path,raw115Path,output]=process.argv.slice(2);
assert.ok(output,'Provide runtime, C114 fixed N5, C113 eta bank, C112 local N4, C113 paired N4, C110 whole N2, C115 high-eta bank and fresh output');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function read(path,pin){const bytes=await readFile(path);assert.equal(sha(bytes),pin,path);return JSON.parse(bytes);}
const prior={
  fixed5:'1ab657059a995b2697bb4ca2a747819483a9a04ae909d06d9ee6886bb36df22e',
  bank:'073f392f5cf734e04c7497f5fa35f0d7893629ef48c4ee8c95efdb0431061154',
  local4:'b4ff0272a0c7b444ea8b44ad1dae485cb83912ef51d9d0d2970b8e9991c2f1d1',
  paired4:'520080cd7575fb64cfa522ba06b65b0f80da70aec171d5b4a58c9f582e3f3ec9',
  whole2:'a38acf8164c52ef3ed3b5024b33ec7c0cda2e5c29af92dd166e674d6de112538',
};
const [fixed,bank,local4,paired4,old2]=await Promise.all([read(fixedPath,prior.fixed5),read(bankPath,prior.bank),
  read(local4Path,prior.local4),read(paired4Path,prior.paired4),read(old2Path,prior.whole2)]);
assert.deepEqual(local4.pairedExactNumerators,[0,0,0,0]);
assert.deepEqual(paired4.momentResiduals,[0,0,0,0,0]);
assert.deepEqual(bank.wholeOrders,{N2:{FU:5,v:4},N3:{FU:3,v:2,Pi:3}});
for(const [name,pin] of Object.entries(fixed.pins))assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const {buildActualOmegaCoefficientOverX,sourceScaledOperators}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {actualSupportOrderProof}=await load('actual-continuation-exact-support.mjs');
const live=src.prepareActualOrderInduction({order:5,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,records,bootstrap:b}=live,{orderOne:r,inner,constants:{X,eta}}=b;
assert.equal(G.nodes.length,fixed.originalNodes);
assert.equal(sha(JSON.stringify(G.nodes)),fixed.originalPrefixSHA256);
assert.equal(sha(JSON.stringify(G.nodes.slice(0,fixed.retainedLiteralN4Nodes))),paired4.unchangedN4Prefix);
const q=(x,d=1)=>G.q(x,d),o=G.one,z=G.zero,add=(...x)=>G.add(...x),mul=(...x)=>G.mul(...x),p2=k=>q(1n<<BigInt(k));
const {A:Ap,D,d,L}=G.core,h=G.parameter('h'),nu=n=>mul(q(2*n),h),a0=G.neg(add(Ap,q(1,2))),c0=G.neg(Ap);
const {Z}=sourceScaledOperators(G,X,eta),Z2=(e,v)=>Z(G.sub(e,D),Z(e,v));
const proof=(left,right,atoms=[])=>sourceGraphRationalIdentity(G,G.sub(left,right),{atomicNodes:atoms,maxTerms:220000});
const verify=(left,right,atoms=[])=>assert.ok(proof(left,right,atoms).pass);
verify(Ap,add(q(1,2),h),[h]);verify(D,G.sub(q(1,2),h),[h]);
verify(d,G.sub(o,G.pow(eta,2)),[eta]);verify(L,G.sub(o,mul(q(2),h,G.pow(eta,2))),[eta,h]);
const flat=id=>G.nodes[id].op==='add'?G.nodes[id].args.flatMap(flat):[id];
function body(id,args){
  const call=G.nodes[id];
  assert.equal(call.op,'actual_expression_partial');assert.deepEqual(call.args.slice(1),[args,args.map(()=>0)]);
  return G.expressionSystems[call.args[0]].body;
}
function averageOf(id){
  const node=G.nodes[id];assert.equal(node.op,'definite_integral');
  return node.args;
}
const support=actualSupportOrderProof(b.completedOrderOne);
assert.ok(support.pass&&support.expressionChecks.allEndpointsIndependentOfEta);
const ns=records.slice(1).map(record=>record.norm.actual);
const exactRows=records.slice(2).map((record,index)=>{
  const n=record.order,old=fixed.exactOrders[index], g=record.global;
  const lower=records.slice(0,n),raw=lower.map(k=>k.actual),whole=lower.map(k=>k.global);
  const make=rows=>buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:rows.map(k=>k.U),v:rows.map(k=>k.v)});
  const omegaRaw=make(raw),omegaWhole=make(whole);
  assert.equal(omegaRaw.value,record.raw.omegaOverX);
  assert.deepEqual(G.nodes[g.omega].args,[X,inner.aSquared,r.Xplus,omegaRaw.value,omegaWhole.value,z]);
  assert.deepEqual([omegaRaw.terms.length,omegaWhole.terms.length],old.omegaCounts);
  const shifted=G.sub(nu(n-2),o);
  const lastOmega=v=>G.neg(Z(G.sub(G.sub(nu(n-2),D),o),Z(shifted,v)));
  const lastRaw=lastOmega(raw[n-2].v),lastWhole=lastOmega(whole[n-2].v);
  assert.equal(omegaRaw.terms.at(-1),lastRaw);assert.equal(omegaWhole.terms.at(-1),lastWhole);
  assert.equal(record.stress.axialTerms.at(-1),G.neg(Z2(add(c0,nu(n-1)),whole[n-1].U)));
  assert.equal(record.stress.angularTerms.at(-1),G.neg(Z2(add(a0,nu(n-1)),whole[n-1].F)));
  const pairs=Array.from({length:n-1},(_,i)=>[i+1,n-1-i]);
  assert.deepEqual(pairs,old.sourceLowerPairs);
  const lowerProducts=rows=>pairs.map(([i,j])=>mul(rows[i].F,rows[j].F));
  const rawProducts=lowerProducts(raw),wholeProducts=lowerProducts(whole);
  verify(record.raw.pKnown,G.sub(add(...rawProducts),mul(q(1,2),omegaRaw.value)),[omegaRaw.value,...raw.slice(1).map(row=>row.F)]);
  const wholeAtoms=[X,g.omega,...whole.slice(1).flatMap(row=>[row.U,row.F])];
  const wholeUU=pairs.map(([i,j])=>mul(whole[i].U,whole[j].U));
  const wholeUF=pairs.map(([i,j])=>mul(whole[i].U,whole[j].F));
  const angular=mul(q(2),X,add(...wholeUF)),axial=G.sub(add(...wholeUU),mul(X,add(...wholeProducts)));
  verify(g.lowerPressure,G.sub(add(...wholeProducts),mul(q(1,2),g.omega)),wholeAtoms);
  verify(g.lowerBodies[1],angular,wholeAtoms);verify(g.lowerBodies[2],axial,wholeAtoms);
  const expected=[g.lowerPressure,angular,add(axial,mul(q(1,2),X,g.omega))];
  const debts=g.incoming.slice(2).map((id,k)=>{
    const choices=flat(body(id,[eta])).filter(x=>G.nodes[x].op==='definite_integral'&&G.nodes[x].args[3]===r.Xplus);
    assert.equal(choices.length,1);const [root,t,lo,hi]=averageOf(choices[0]);
    assert.deepEqual([lo,hi],[z,r.Xplus]);verify(body(root,[t,eta]),expected[k],wholeAtoms);
    return {integral:choices[0],binder:t,eta,domain:[lo,hi]};
  });
  assert.equal(new Set(debts.map(row=>row.binder)).size,3);
  assert.ok(g.actualMomentChecks.every(pr=>pr.pass));
  const angleSum=add(...wholeUF),pressureSum=add(...wholeProducts),axialSum=add(...wholeUU);
  const keep=which=>pairs.map(([i],j)=>i===which[0]||i===which[1]?j:null).filter(j=>j!==null);
  let middle=null;
  if(n===5){
    const mid=keep([2,3]),fm=add(...mid.map(i=>wholeProducts[i])),um=add(...mid.map(i=>wholeUU[i]));
    verify(fm,mul(q(2),whole[2].F,whole[3].F),wholeAtoms);
    verify(um,mul(q(2),whole[2].U,whole[3].U),wholeAtoms);
    const missing=[proof(g.lowerPressure,G.sub(G.sub(pressureSum,fm),mul(q(1,2),g.omega)),wholeAtoms),
      proof(g.lowerBodies[2],G.sub(G.sub(axialSum,um),mul(X,pressureSum)),wholeAtoms),
      proof(g.lowerBodies[1],mul(q(2),X,G.sub(angleSum,add(...mid.map(i=>wholeUF[i])))),wholeAtoms),
      proof(omegaWhole.value,add(...omegaWhole.terms.slice(0,-1)),[lastWhole])];
    assert.ok(missing.every(row=>!row.pass&&row.numeratorMonomials>0));
    middle={F2F3:fm,U2U3:um,missingNumerators:missing.map(row=>row.numeratorMonomials)};
  }
  const {U,average,v}=g;
  const mass=G.div(G.sub(G.sub(mul(q(2),eta,U),mul(q(2),eta,add(D,nu(n)),average)),mul(d,G.derivative(average,eta))),L);
  assert.equal(body(v,[X,eta]),mass);
  assert.equal(record.raw.system,2*n-1);
  assert.equal(old.strip,ns[n-1].strip);
  return {n,systems:[record.raw.system,record.auxiliary.system],omegaCounts:old.omegaCounts,sourceOmega:[omegaRaw.value,omegaWhole.value,g.omega],
    previousOmegaViscosity:{order:n-2,raw:lastRaw,whole:lastWhole},
    previousStressViscosity:{order:n-1,axial:record.stress.axialTerms.at(-1),angular:record.stress.angularTerms.at(-1)},
    pairs,debts,middle,originalWholeMass:mass};
});

const leading=actualLeadingAllOrderJets({radialOrder:2,etaOrder:9});
assert.ok(leading.pass&&leading.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(leading.parameterExpressionSHA256,b.program.parameterExpressionSHA256);
assert.deepEqual(leading.bounds.U0.domain.X,['0','infinity']);
assert.deepEqual(leading.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
assert.ok(leading.boundConvention.includes('every requested mixed derivative'));
const roots=[leading.bounds.U0.root,leading.bounds.F0active.root],table=leading.normProgram.nodes,copied=new Map();
function clone(i){
  if(copied.has(i))return copied.get(i);
  const {op,args}=table[i];let node;
  if(op==='rational')node=q(BigInt(args[0]),BigInt(args[1]));
  else if(op==='source_parameter')node=G.parameter(args[0]);
  else if(op==='integer_power')node=G.pow(clone(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);node=G.node(op,args.map(clone));}
  copied.set(i,node);return node;
}
const H=mul(p2(22),add(o,...roots.map(clone))),B=G.maximum(o,r.Xplus),B2=G.pow(B,2),B3=G.pow(B,3);
const R=r.Rbase,Ef=G.substitute(r.ef,eta,z);
verify(mul(r.ef,add(o,G.pow(eta,2))),Ef);
assert.ok([R,r.X0,r.IposRight,r.Xplus,...r.Uinverse.flat(),...r.Einverse.flat()].every(id=>G.derivative(id,eta)===z));
const lam=G.parameter('lambda'),power=(v,a)=>G.exp(mul(a,G.log(v)));
const R1=power(R,G.sub(o,mul(q(2),lam))),Rp=power(R,G.sub(q(-2),mul(q(2),lam))),Rz=power(R,mul(q(-2),lam));
const uRhs=[G.inv(R),G.div(add(G.inv(R),G.div(q(5),mul(Ef,R1))),mul(q(2),lam))];
const fRhs=[G.inv(G.pow(R,2)),G.div(q(5),mul(q(2),Ef,Rp)),G.div(q(5),mul(Ef,Rz))];
const inverse=(mat,rhs)=>G.maximum(...mat.map(row=>add(...row.map((m,j)=>mul(add(o,G.pow(m,2)),rhs[j])))));
assert.deepEqual(old2.exactBumpXIdentities,[0,0,0,0]);
const third=BigInt(old2.sigmaThirdBound),b0=p2(15),b1=p2(35),b2=q(third*2048n**3n);
const constants=[32768n,34359738368n,third*2048n**3n].map(String);
const Iu=inverse(r.Uinverse,uRhs),If=inverse(r.Einverse,fRhs);
const uVal=G.div(mul(q(2),b0,Iu),R),fVal=G.div(mul(q(3),b0,If),G.pow(R,2));
const Qb=add(uVal,G.div(mul(add(mul(q(3),b1),b2),Iu),G.pow(R,3)),fVal,
  G.div(mul(q(3),add(b2,mul(q(4),b1),mul(q(4),b0)),If),G.pow(R,4)));

const [s1,s2,s3,s4]=[G.div(inner.delta,q(16)),...ns.slice(1,4).map(x=>x.strip)];
for(const [j,s] of [[2,s2],[3,s3],[4,s4]])assert.equal(s,G.div(inner.delta,q(8n*256n**BigInt(j))));
const E=s=>add(o,G.div(q(2),s)),a=G.sqrt(inner.aSquared);
const Q=G.parameter('Q'),Xa=G.parameter('Xa'),t1=G.parameter('t1'),w=G.div(t1,q(64));
const k1=G.div(q(9),mul(w,Xa)),k2=add(G.div(q(9),mul(w,G.pow(Xa,2))),G.div(q(8192),mul(G.pow(w,2),G.pow(Xa,2))));
const Tcut=add(o,mul(q(3),k1),k2),Ma=mul(p2(20),G.pow(Q,4));
function absCut({C,solutionNorm,strip}){return mul(Tcut,add(solutionNorm,mul(q(2),add(mul(Ma,E(strip),solutionNorm),C))));}
const [J1,J2,J3,J4]=ns.slice(0,4).map(absCut),proj=p2(17);
const localMagnitudes=[mul(add(o,J1),G.pow(add(o,G.inv(s1)),7)),mul(add(o,J2),G.pow(E(s2),5)),mul(add(o,J3),G.pow(E(s3),3)),mul(add(o,J4),E(s4))];
const O0=mul(p2(21),B,G.pow(H,2));
const mag=[H];
for(let j=1;j<=4;j++){
  const m=localMagnitudes[j-1],A=G.maximum(o,...mag);
  const omega=j===1?O0:mul(p2(40),B2,G.pow(A,2));
  const lowerDebt=j===1?mul(B2,omega):mul(q(8),B2,add(G.pow(A,2),omega));
  mag.push(mul(proj,add(m,mul(Qb,add(mul(q(4),B2,H,m),lowerDebt)))));
}
const C1=ns[0].C,M1=ns[0].solutionNorm,H1=G.div(mul(p2(12),add(o,C1),add(o,M1),G.pow(Q,64)),mul(t1,s1));
const gain2=G.div(mul(p2(25),H1),G.pow(s1,2));
const gain3=G.div(mul(p2(35),G.maximum(o,inner.B,J1,J2)),G.pow(s2,4));
const gain4=G.div(mul(p2(36),G.maximum(o,inner.B,J1,J2,J3)),G.pow(s3,4));
const d1per=mul(p2(19),G.pow(add(o,G.inv(s1)),9));
function cutFromForce(F,term,s){
  const v=add(term,mul(q(2),a,F)),J=add(mul(q(16),Ma,E(s),v),F);
  return mul(Tcut,add(v,mul(q(2),J)));
}
function wholeStage(n,degree,s,cut,history){
  const A=G.maximum(o,...mag.slice(0,n)),oldError=add(...history);
  const omega=mul(p2(40),B2,A,oldError),lower=mul(p2(42),B3,A,oldError);
  const base=mul(G.pow(E(s),degree),cut),moment=add(mul(q(4),B2,H,base),mul(B,lower));
  const S=add(base,mul(Qb,moment)),D=mul(proj,S);
  const P=add(base,mul(B,add(mul(q(2),H,S),lower)));
  return {omega,lower,base,moment,S,D,P};
}
function coupled(e,e2,e3,e4){
  const d1=mul(d1per,e),cut2=cutFromForce(mul(gain2,e),e2,s2),cut3=cutFromForce(mul(gain3,add(e,cut2)),e3,s3);
  const cut4=cutFromForce(mul(gain4,add(e,cut2,cut3)),e4,s4);
  const h2=wholeStage(2,7,s2,cut2,[d1]),h3=wholeStage(3,5,s3,cut3,[d1,h2.D]),h4=wholeStage(4,3,s4,cut4,[d1,h2.D,h3.D]);
  const allLower=add(d1,h2.D,h3.D,h4.D),A=G.maximum(o,...mag);
  const N5Omega4First=mul(p2(40),B2,A,allLower),N5LowerFirst=mul(p2(42),B3,A,allLower);
  const N5PreviousViscosityFirst=mul(p2(36),B2,h3.D),N5StressPreviousViscosityFirst=mul(p2(36),B2,h4.S);
  const strict=add(e,cut2,cut3,cut4,mul(q(5040),add(h2.D,h2.P,h3.D,h3.P,h4.D,h4.P)),N5LowerFirst,N5StressPreviousViscosityFirst);
  return {d1,cut2,cut3,cut4,h2,h3,h4,N5Omega4First,N5LowerFirst,N5PreviousViscosityFirst,N5StressPreviousViscosityFirst,strict};
}
const columns=Array.from({length:4},(_,i)=>coupled(...Array.from({length:4},(_,j)=>i===j?o:z)));
const [eWeight,...kWeights]=columns.map(x=>x.strict),bits=259;
const e0=mul(p2(25),G.pow(Q,64),G.pow(t1,-2),add(mul(p2(73),G.pow(Q,-77)),mul(p2(46),G.pow(Q,-19))));
const N=add(q(2),G.ceiling(G.div(G.log(add(o,mul(p2(bits),add(o,eWeight),e0))),mul(q(25),G.log(Q)))));
const Ks=kWeights.map((id,i)=>G.maximum(add(ns[i+1].Kcondition,q(2)),G.ceiling(G.div(add(mul(q(bits),G.log(q(2))),G.log(add(o,id))),G.log(q(4))))));
const generalTailLimits=[7,5,3].map((etaOrder,i)=>src.actualOrderInductionTail(live,{order:i+2,kind:'actual',etaOrder,bits:256}));
assert.ok(generalTailLimits.every(t=>t.actualSourceConvergenceModulus&&!t.finiteDisplayedTermsCertified));
assert.ok([H,Qb,...mag,N,...Ks,...columns.map(x=>x.strict)].every(id=>G.freeCoordinates(id).size===0));
const result={schema:'MathScope.C115.OriginalN5WholeHigherEtaBankOperands/1',prior,eta,X,
  originalN5Prefix:fixed.originalPrefixSHA256,originalN5Nodes:fixed.originalNodes,exactRows,
  leading:{radialOrder:2,etaOrder:9,roots,nodes:copied.size,tableSHA256:sha(JSON.stringify(table)),H},
  fixedOriginalIpos:{bumpConstants:constants,R,Ef,Iu,If,Qb,etaIndependentInverse:true},
  originalSourceBounds:{B,leading:H,localMagnitudes,wholeMagnitudes:mag,forcingGains:[gain2,gain3,gain4],nativeFloorIds:ns.slice(1,4).map(x=>x.Kcondition)},
  available:[{order:2,FU:7,v:6,Pi:7},{order:3,FU:5,v:4,Pi:5},{order:4,FU:3,v:2,Pi:3}],
  deliveredN5Inputs:{Omega4AndThreeLowerDensities:1,Omega4PreviousViscosity:['Z^2*v3',1],StressPreviousViscosity:['Z^2*F4','Z^2*U4',1]},
  exactNativeHighEtaTailDescriptors:generalTailLimits,closedDepths:{N,K2:Ks[0],K3:Ks[1],K4:Ks[2],bitsEach:bits,ordinaryDerivativeFactor:5040},
  columns,computedScalarGraphSHA256:sha(JSON.stringify(G.nodes)),pairedWholeN5:'OPEN',evaluatedNumerically:false,generalY:'OPEN',finalJets:0,release:'HOLD'};
const [source115,other]=await Promise.all([read(raw115Path,'8d968e472be908ca344572100784977acb779299d8f6251e0b405209ad2fc16b'),Promise.resolve(result)]);
assert.deepEqual(other,source115,'regenerate the complete lower bank with exact graph IDs before adding N5');
const n=5,n5=records[n],r5=n5.raw,g=n5.global,k=G.picardSystems[r5.system];
const {T}=sourceScaledOperators(G,X,eta),cc=j=>add(c0,nu(j)),aa=j=>add(a0,nu(j));
const omega=add(mul(q(-2),Ap),nu(n)),tau=add(omega,q(1,2));
const c0Beta=G.sub(cc(n-1),D),a0Beta=G.sub(aa(n-1),D);
const s5=ns[4].strip;
assert.equal(s5,G.div(inner.delta,q(1n<<43n)));verify(s4,mul(q(256),s5),[inner.delta]);
assert.deepEqual(k.radialDomain,[z,a]);assert.equal(r5.system,9);
assert.deepEqual(k.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(k.zeroAxisDatum,Array(6).fill(z));
assert.deepEqual(k.A0.slice(0,2),[[z,z,z,z,o,z],[z,z,z,z,z,o]]);
assert.ok(k.A1.slice(0,2).every(row=>row.every(id=>id===z)));
const toXi=id=>G.substitute(id,X,G.pow(r5.xi,2));
const raw=records.slice(0,n).map(row=>row.actual),whole=records.slice(0,n+1).map(row=>row.global);
const rhsKernel=(p,t,a)=>src.actualInductionLinearKernel(G,{X,eta,xi:r5.xi,lambda:nu(n),F0:raw[0].F,U0:raw[0].U,v0:raw[0].v,pKnown:p,Htheta:t,Hz:a});
const localRef=rhsKernel(r5.pKnown,r5.Htheta,r5.Hz);
assert.deepEqual(k.A0,localRef.matrix0.map(row=>row.map(toXi)));
assert.deepEqual(k.A1,localRef.matrix1.map(row=>row.map(toXi)));
assert.deepEqual(k.forcing,localRef.rawForcing.map(toXi));
const Fx=g=>G.derivative(g,X),thetaAdv=g=>add(g,mul(X,Fx(g))),vAdv=g=>add(mul(q(1,2),g),mul(X,Fx(g)));
const makeOm=rows=>buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:rows.map(row=>row.U),v:rows.map(row=>row.v)}).value;
function lowerForcing(rows){
  const theta=[],axial=[],pressure=[];
  for(let i=1;i<n;i++){
    const j=n-i,A=rows[i],B=rows[j];
    pressure.push(mul(A.F,B.F));
    theta.push(mul(A.v,thetaAdv(B.F)),mul(A.U,Z(aa(j),B.F)));
    axial.push(mul(X,A.v,Fx(B.U)),mul(A.U,Z(cc(j),B.U)));
  }
  const prev=rows[n-1];
  return [G.sub(add(...pressure),mul(q(1,2),makeOm(rows))),
    add(...theta,G.neg(Z2(aa(n-1),prev.F))),add(...axial,G.neg(Z2(cc(n-1),prev.U)))];
}
const [pActual,tActual,zActual]=lowerForcing(raw);verify(pActual,r5.pKnown,[r5.omegaOverX,...raw.slice(1).map(row=>row.F)]);
assert.equal(tActual,r5.Htheta);assert.equal(zActual,r5.Hz);

const XX=G.fresh('C116_X'),ee=G.fresh('C116_eta'),atoms=[XX,ee,h],dx=G.sub(X,XX),de=G.sub(eta,ee);
const at=id=>G.simultaneousSubstitute(id,[X,eta],[XX,ee]);
function jet(name){
  const t=Array.from({length:6},(_,j)=>G.fresh('C116_'+name+'_'+j));atoms.push(...t);
  return add(t[0],mul(t[1],dx),mul(t[2],de),mul(q(1,2),t[3],G.pow(dx,2)),mul(t[4],dx,de),mul(q(1,2),t[5],G.pow(de,2)));
}
const profile=i=>({F:jet('F'+i),U:jet('U'+i),v:jet('v'+i)});
const refs=Array.from({length:n},(_,i)=>profile('native'+i)),dif=[{F:z,U:z,v:z},...Array.from({length:n-1},(_,i)=>profile('dnative'+(i+1)))];
const difference=(A,B)=>Object.fromEntries(Object.keys(A).map(x=>[x,G.sub(A[x],B[x])]));
const approximations=refs.map((A,i)=>difference(A,dif[i]));
const current=dif[n-1],xv=Fx(current.v),prevV=G.neg(Z2(G.sub(nu(n-2),o),dif[n-2].v));
const dOm=[T(G.sub(nu(n-1),o),current.v),mul(q(-2),add(mul(q(2),xv),mul(X,Fx(xv)))),prevV];
for(let i=0;i<n;i++){
  const j=n-1-i,a=G.sub(nu(j),o),A=refs[j],B=approximations[i],u=dif[i],v=dif[j];
  dOm.push(mul(u.v,vAdv(A.v)),mul(B.v,vAdv(v.v)),mul(u.U,Z(a,A.v)),mul(B.U,Z(a,v.v)));
}
const dp=[mul(q(-1,2),add(...dOm))],dt=[],dz=[];
for(let i=1;i<n;i++){
  const j=n-i,A=refs[j],B=approximations[i],u=dif[i],v=dif[j];
  dp.push(mul(u.F,A.F),mul(B.F,v.F));
  dt.push(mul(u.v,thetaAdv(A.F)),mul(B.v,thetaAdv(v.F)),mul(u.U,Z(aa(j),A.F)),mul(B.U,Z(aa(j),v.F)));
  dz.push(mul(X,u.v,Fx(A.U)),mul(X,B.v,Fx(v.U)),mul(u.U,Z(cc(j),A.U)),mul(B.U,Z(cc(j),v.U)));
}
dt.push(G.neg(Z2(aa(n-1),current.F)));dz.push(G.neg(Z2(cc(n-1),current.U)));
const f0=lowerForcing(refs),f1=lowerForcing(approximations);
const df=(x,y)=>G.sub(x,y),id=(x,y)=>proof(at(x),at(y),atoms);
const exact=[id(df(makeOm(refs),makeOm(approximations)),add(...dOm)),
  ...[dp,dt,dz].map((terms,i)=>id(df(f0[i],f1[i]),add(...terms)))];
assert.ok(exact.every(x=>x.pass));
const wrongLocal=id(df(makeOm(refs),makeOm(approximations)),df(add(...dOm),prevV));
assert.ok(!wrongLocal.pass);
const perturbed=rhsKernel(...f1);
assert.deepEqual(perturbed.matrix0,localRef.matrix0);assert.deepEqual(perturbed.matrix1,localRef.matrix1);
assert.deepEqual(k.A0[3],[mul(q(4),r5.xi,toXi(raw[0].F)),z,z,z,z,z]);
assert.deepEqual(k.A1[3],Array(6).fill(z));
assert.equal(k.forcing[3],mul(q(2),r5.xi,toXi(r5.pKnown)));

const target=fixed.exactOrders.at(-1).stressRows,stress=n5.stress;
const {actualPositiveStressFTC}=await load('actual-background-residual-bridge.mjs');
const ftc=actualPositiveStressFTC(live);
assert.ok(ftc.pass);
function density(rows){
  const zTerms=[T(cc(n),rows[n].U)],thetaTerms=[T(aa(n),rows[n].F)];
  for(let i=0;i<=n;i++){
    const j=n-i,U=rows[i],P=rows[j];
    zTerms.push(mul(X,U.v,Fx(P.U)),mul(U.U,Z(cc(j),P.U)));
    thetaTerms.push(mul(U.v,thetaAdv(P.F)),mul(U.U,Z(aa(j),P.F)));
  }
  const u=Fx(rows[n].U),f=Fx(rows[n].F);
  zTerms.push(Z(omega,rows[n].Pi),mul(q(-2),add(mul(X,Fx(u)),u)),G.neg(Z(c0Beta,Z(cc(n-1),rows[n-1].U))));
  thetaTerms.push(mul(q(-2),add(mul(X,Fx(f)),mul(q(2),f))),G.neg(Z(a0Beta,Z(aa(n-1),rows[n-1].F))));
  return {z:zTerms,theta:thetaTerms};
}
const lit=density(whole);assert.deepEqual(lit.z,stress.axialTerms);assert.deepEqual(lit.theta,stress.angularTerms);
assert.deepEqual([lit.z.length,lit.theta.length],[16,15]);
assert.deepEqual(stress.compactSupport,[r.Xminus,r.Xplus]);
for(const row of ftc.rows.filter(v=>v.order===n)){
  const base=target.find(v=>v.component===row.component);
  assert.equal(row.root,base.root);assert.equal(row.denominator,base.normalizer);
  assert.deepEqual(row.openDomain,[r.Xminus,r.Xplus]);assert.ok(!row.negativeWrongSign.pass);
  assert.deepEqual(base.forward,[r.Xminus,X]);assert.deepEqual(base.backward,[X,r.Xplus]);assert.notEqual(...base.binders);
}
const newDebts=g.incoming.map((_,j)=>G.fresh('C116_n5_independent_debt_'+j));
const moments=g.momentResiduals.map(node=>proof(G.simultaneousSubstitute(node,g.incoming,newDebts),z,newDebts));
assert.ok(moments.every(row=>row.pass));

function massProfile(name,i){
  const F=jet(name+'F'),U=jet(name+'U'),initial=G.fresh('C116_'+name+'V0');atoms.push(initial);
  const V=G.sub(initial,mul(dx,at(Z(cc(i),U))));
  return {F,U,V,v:G.div(V,X),Pi:i===n?jet(name+'Pi'):z};
}
const ys=Array.from({length:n+1},(_,i)=>massProfile('true'+i,i));
const err=[null,...Array.from({length:n},(_,i)=>massProfile('err'+(i+1),i+1))];
const hats=ys.map((v,i)=>i?difference(v,err[i]):v),trueD=density(ys),hatD=density(hats);
const leftZ=df(add(...trueD.z),add(...hatD.z)),leftT=mul(q(2),X,df(add(...trueD.theta),add(...hatD.theta)));
const lowerPairs=(a,b)=>add(...Array.from({length:n-1},(_,i)=>{
  const k=i+1,j=n-k;return df(mul(ys[k][a],ys[j][b]),mul(hats[k][a],hats[j][b]));
}));
const {F:f,U:u,V:v,Pi:p}=err[n],{F:F0,U:U0,V:V0}=ys[0],xf=mul(q(2),X,f);
const Jz=add(mul(q(2),U0,u),lowerPairs('U','U'),p),Jt=mul(q(2),X,add(mul(U0,f),mul(u,F0),lowerPairs('U','F')));
const Bz=add(mul(V0,u),mul(v,U0),lowerPairs('V','U'),mul(q(-2),X,Fx(u)),G.div(df(mul(X,u),mul(q(2),eta,X,Jz)),L));
const Bt=add(mul(q(2),X,add(mul(V0,f),mul(v,F0),lowerPairs('V','F'))),mul(q(-4),G.pow(X,2),Fx(f)),
  G.div(df(mul(q(2),G.pow(X,2),f),mul(q(2),eta,X,Jt)),L));
const Eder=f=>G.derivative(f,eta);
const rest=(e,f,j,w)=>G.div(add(G.neg(mul(e,f)),mul(D,eta,Eder(f)),mul(q(2),eta,add(w,o),j),mul(d,Eder(j))),L);
const vz=G.neg(Z2(cc(n-1),err[n-1].U)),vt=mul(q(-2),X,Z2(aa(n-1),err[n-1].F));
const rz=add(Fx(Bz),rest(add(cc(n),o),u,Jz,omega),vz);
const rt=add(Fx(Bt),rest(add(aa(n),q(2)),xf,Jt,tau),vt);
const conservative=[id(leftZ,rz),id(leftT,rt)];assert.ok(conservative.every(row=>row.pass));
const midUU=mul(q(2),df(mul(ys[2].U,ys[3].U),mul(hats[2].U,hats[3].U)));
const wrongStress=[id(leftZ,df(rz,Fx(lowerPairs('V','U')))),id(leftT,df(rt,Fx(mul(q(2),X,lowerPairs('V','F'))))),
  id(leftZ,df(rz,vz)),id(leftT,df(rt,vt)),id(leftZ,df(rz,Z(omega,midUU)))];
assert.ok(wrongStress.every(row=>!row.pass));
const weighted=id(G.neg(vt),Z(add(a0Beta,o),Z(add(aa(n-1),o),mul(q(2),X,err[n-1].F))));
assert.ok(weighted.pass);

const G5=G.div(mul(p2(37),G.maximum(o,inner.B,J1,J2,J3,J4)),G.pow(s4,4));
const ratio=G.div(mul(q(6),Ma,a),s5),den=mul(q(2),r.Xminus),inv=G.maximum(o,G.inv(den),G.inv(G.sqrt(den)));
function upper(e,e2,e3,e4,e5){
  const b4=coupled(e,e2,e3,e4),nativeInput=add(e,b4.cut2,b4.cut3,b4.cut4);
  const Fd5=mul(G5,nativeInput),cut5=cutFromForce(Fd5,e5,s5);
  const Sraw=mul(E(s5),cut5),need=b4.N5LowerFirst;
  const moment=add(mul(q(4),B2,H,Sraw),mul(B,need));
  const S5=add(Sraw,mul(Qb,moment)),P5=add(Sraw,mul(B,add(mul(q(2),H,S5),need)));
  const A=G.maximum(o,...mag),Derr=add(b4.d1,b4.h2.D,b4.h3.D,b4.h4.D);
  const C=add(mul(A,add(S5,Derr)),P5),J=add(C,b4.N5StressPreviousViscosityFirst);
  const stressError=mul(q(256),B3,inv,J),coefficients=mul(q(32),B2,add(S5,P5));
  return {Fd5,cut5,Sraw,moment,S5,P5,stressError,coefficients,budget:add(b4.strict,stressError,coefficients)};
}
const pairedColumns=Array.from({length:5},(_,i)=>upper(...Array.from({length:5},(_,j)=>i===j?o:z)));
const [dE,...dK]=pairedColumns.map(row=>row.budget),bits5=260;
const finalN=add(q(2),G.ceiling(G.div(G.log(add(o,mul(p2(bits5),add(o,dE),e0))),mul(q(25),G.log(Q)))));
const finalKs=dK.map((gain,i)=>G.maximum(add(ns[i+1].Kcondition,q(2)),G.ceiling(G.div(add(mul(q(bits5),G.log(q(2))),G.log(add(o,gain))),G.log(q(4))))));
assert.ok([ratio,G5,finalN,...finalKs,...pairedColumns.map(v=>v.budget)].every(id=>G.freeCoordinates(id).size===0));
const packet={schema:'MathScope.C116.OriginalNativeN5WholePairedOperands/1',eta,X,
  priorHigherEtaOperands:'8d968e472be908ca344572100784977acb779299d8f6251e0b405209ad2fc16b',originalN5Prefix:fixed.originalPrefixSHA256,
  lowerBankRegeneratedExactly:true,wholeN5Sources:exactRows.at(-1),
  local:{system:r5.system,matricesUnchanged:72,radialDomain:[z,inner.aSquared],strip:s5,stripRatio:256,rawKnown:r5.pKnown,
    forcingNumerators:exact.map(row=>row.numeratorMonomials),negativePreviousV3:wrongLocal.numeratorMonomials,
    changedMomentResiduals:moments.map(row=>row.numeratorMonomials),wordRatio:ratio,forcingGain:G5,pressure:'P_(K5+1)'},
  stresses:{counts:[lit.z.length,lit.theta.length],guards:target,conservativeNumerators:conservative.map(row=>row.numeratorMonomials),
    wrongStress:wrongStress.map(row=>row.numeratorMonomials),weightedViscosityShift:weighted.numeratorMonomials,innerPrefixRetained:true},
  pairedColumns,closed:{N:finalN,K2:finalKs[0],K3:finalKs[1],K4:finalKs[2],K5:finalKs[3],bitsEach:bits5,evaluatedNumerically:false},
  generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({lowerBank:packet.lowerBankRegeneratedExactly,local:packet.local,stress:packet.stresses.conservativeNumerators,
  negative:packet.stresses.wrongStress,depths:packet.closed}));
