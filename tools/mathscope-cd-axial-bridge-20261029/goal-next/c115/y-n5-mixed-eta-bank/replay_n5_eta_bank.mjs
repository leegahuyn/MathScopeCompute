import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,fixedPath,bankPath,local4Path,paired4Path,old2Path,output]=process.argv.slice(2);
assert.ok(output,'Provide runtime, C114 fixed N5, C113 eta bank, C112 local N4, C113 paired N4, C110 whole N2 and fresh output');
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
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceNodes:result.originalN5Nodes,leading:result.leading,orders:result.available,n5NegativeControls:exactRows.at(-1).middle.missingNumerators,depths:result.closedDepths}));
