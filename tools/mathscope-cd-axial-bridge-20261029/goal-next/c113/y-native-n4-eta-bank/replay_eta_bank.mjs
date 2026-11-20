import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,fixedPath,whole2Path,local3Path,paired3Path,output]=process.argv.slice(2);
assert.ok(output,'Give original runtime, N4 fixed, earlier whole N2, local N3, whole N3 and fresh output');
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=async(path,pin)=>{const b=await readFile(path);assert.equal(sha(b),pin,path);return JSON.parse(b);};
const prior={fixed4:'c98c467546aae25fd48af3a0374e16669cc2ebdf44063296a6032e85cc94eb04',
  whole2:'a38acf8164c52ef3ed3b5024b33ec7c0cda2e5c29af92dd166e674d6de112538',
  local3:'e14ddddddec16b677a0f2ed7169f09bc3ffd9c2dbdee855c77167bc95db061bb',
  paired3:'8e7e3098779e3c74ac328cd72d3c1e2b329abdd3bd99b7af348232fd98f68493'};
const fixed=await read(fixedPath,prior.fixed4),old2=await read(whole2Path,prior.whole2),local3=await read(local3Path,prior.local3),paired3=await read(paired3Path,prior.paired3);
assert.equal(old2.ordinaryEtaOrder,3);assert.deepEqual(old2.exactBumpXIdentities,[0,0,0,0]);
assert.deepEqual(local3.actualSystems,[3,5]);assert.deepEqual(local3.exactLocalCoupledForcingFourIdentities,[0,0,0,0]);
assert.deepEqual(paired3.originalMomentResidualsAfterArbitraryNewDebts,[0,0,0,0,0]);
for(const [name,pin] of Object.entries(fixed.pins))assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const {buildActualOmegaCoefficientOverX}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {actualSupportOrderProof}=await load('actual-continuation-exact-support.mjs');
const live=src.prepareActualOrderInduction({order:4,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,records,bootstrap:b}=live,[n0,n1,n2,n3,n4]=records,{orderOne:r,constants:{X,eta}}=b;
assert.equal(sha(JSON.stringify(G.nodes)),fixed.originalPrefixSHA256);
assert.equal(sha(JSON.stringify(G.nodes.slice(0,fixed.retainedLiteralN3Nodes))),paired3.sourcePrefix);
assert.equal(n4.raw.system,7);assert.equal(n3.raw.system,5);assert.equal(n2.raw.system,3);
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,prod=(...ids)=>G.mul(...ids),add=(...ids)=>G.add(...ids);
const same=(x,y,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes,maxTerms:200000});
const integral=id=>{const v=G.nodes[id];assert.equal(v.op,'definite_integral');return v.args;};
const flat=id=>G.nodes[id].op==='add'?G.nodes[id].args.flatMap(flat):[id];
const actualBody=(id,params)=>{
  const {op,args}=G.nodes[id];assert.equal(op,'actual_expression_partial');
  assert.deepEqual(args.slice(1),[params,params.map(()=>0)]);return G.expressionSystems[args[0]].body;
};
const exactSupports=actualSupportOrderProof(b.completedOrderOne);
assert.ok(exactSupports.pass&&exactSupports.expressionChecks.allEndpointsIndependentOfEta);
const omegaRows=[n2,n3,n4].map(n=>{
  const makeOmega=kind=>buildActualOmegaCoefficientOverX(G,{order:n.order-1,X,eta,
    U:records.slice(0,n.order).map(r=>r[kind].U),v:records.slice(0,n.order).map(r=>r[kind].v)});
  const raw=makeOmega('actual'),outer=makeOmega('global');
  const gl=n.global;
  assert.equal(raw.value,n.raw.omegaOverX);
  assert.deepEqual(G.nodes[gl.omega].args,[X,b.inner.aSquared,r.Xplus,raw.value,outer.value,z]);
  const debts=[gl.lowerPressure,gl.lowerBodies[1],add(gl.lowerBodies[2],prod(q(1,2),X,gl.omega))];
  const integrals=gl.incoming.slice(2).map((id,j)=>{
    const [term,...extra]=flat(actualBody(id,[eta])).filter(v=>G.nodes[v].op==='definite_integral'&&G.nodes[v].args[3]===r.Xplus);
    assert.ok(term!==undefined&&extra.length===0);
    const [root,binder,left,right]=integral(term);assert.deepEqual([left,right],[z,r.Xplus]);
    assert.ok(same(actualBody(root,[binder,eta]),debts[j]).pass);return {term,binder,eta,bounds:[left,right]};
  });
  assert.ok(gl.actualMomentChecks.every(p=>p.pass));
  assert.deepEqual(G.nodes[gl.dU].args.slice(0,4),[X,r.X0,r.IposRight,z]);
  assert.deepEqual(G.nodes[gl.dF].args.slice(0,4),[X,r.X0,r.IposRight,z]);
  return {order:n.order,omegaOrder:n.order-1,terms:[raw.terms.length,outer.terms.length],selector:gl.omega,
    previousViscosity:outer.axialViscosityShift,integrals};
});
assert.deepEqual(omegaRows.map(r=>r.terms),[[7,7],[9,9],[11,11]]);

const leading=actualLeadingAllOrderJets({radialOrder:2,etaOrder:7});
assert.ok(leading.pass&&leading.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(leading.parameterExpressionSHA256,b.program.parameterExpressionSHA256);
assert.deepEqual(leading.bounds.U0.domain.X,['0','infinity']);
assert.deepEqual(leading.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
assert.ok(leading.boundConvention.includes('every requested mixed derivative'));
const roots=[leading.bounds.U0.root,leading.bounds.F0active.root],table=leading.normProgram.nodes,known=new Map();
function clone(i){
  if(known.has(i))return known.get(i);
  const {op,args}=table[i];let t;
  if(op==='rational')t=q(BigInt(args[0]),BigInt(args[1]));
  else if(op==='source_parameter')t=G.parameter(args[0]);
  else if(op==='integer_power')t=G.pow(clone(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);t=G.node(op,args.map(clone));}
  known.set(i,t);return t;
}
const H=prod(q(1n<<22n),add(o,...roots.map(clone))),B=G.maximum(o,r.Xplus),B2=G.pow(B,2),B3=G.pow(B,3),R=r.Rbase,Ef=G.substitute(r.ef,eta,z);
assert.ok(same(prod(r.ef,add(o,G.pow(eta,2))),Ef).pass);
assert.ok([R,r.X0,r.IposRight,r.Xplus].every(id=>G.derivative(id,eta)===z));
const lam=G.parameter('lambda'),power=(v,a)=>G.exp(prod(a,G.log(v)));
const R1=power(R,G.sub(o,prod(q(2),lam))),Rp=power(R,G.sub(q(-2),prod(q(2),lam))),Rz=power(R,prod(q(-2),lam));
const uRhs=[G.inv(R),G.div(add(G.inv(R),G.div(q(5),prod(Ef,R1))),prod(q(2),lam))];
const fRhs=[G.inv(G.pow(R,2)),G.div(q(5),prod(q(2),Ef,Rp)),G.div(q(5),prod(Ef,Rz))];
const inverse=(mat,rhs)=>G.maximum(...mat.map(row=>add(...row.map((m,j)=>prod(add(o,G.pow(m,2)),rhs[j])))));
const Iu=inverse(r.Uinverse,uRhs),If=inverse(r.Einverse,fRhs),b0=q(1n<<15n),b1=q(1n<<35n),b2=q(BigInt(old2.sigmaThirdBound)*2048n**3n);
const uVal=G.div(prod(q(2),b0,Iu),R),fVal=G.div(prod(q(3),b0,If),G.pow(R,2));
const uGain=add(uVal,G.div(prod(add(prod(q(3),b1),b2),Iu),G.pow(R,3)));
const fGain=add(fVal,G.div(prod(q(3),add(b2,prod(q(4),b1),prod(q(4),b0)),If),G.pow(R,4)));
const bumps=add(uGain,fGain);

const ns=records.slice(1).map(r=>r.norm.actual),s1=G.div(b.inner.delta,q(16)),[,s2,s3]=ns.map(n=>n.strip),a=G.sqrt(b.inner.aSquared);
const E=s=>add(o,G.div(q(2),s)),Q=G.parameter('Q'),t1=G.parameter('t1'),Xa=G.parameter('Xa'),w=G.div(t1,q(64));
const k1=G.div(q(9),prod(w,Xa)),k2=add(G.div(q(9),prod(w,G.pow(Xa,2))),G.div(q(8192),prod(G.pow(w,2),G.pow(Xa,2))));
const Tcut=add(o,prod(q(3),k1),k2),Ma=prod(q(1n<<20n),G.pow(Q,4));
function absLocal({C,solutionNorm:m,strip}){return prod(Tcut,add(m,prod(q(2),add(prod(Ma,E(strip),m),C))));}
const C1=ns[0].C,M1=ns[0].solutionNorm,H1=G.div(prod(q(4096),add(o,C1),add(o,M1),G.pow(Q,64)),prod(t1,s1));
const f2PerE=G.div(prod(q(1n<<25n),H1),G.pow(s1,2)),L1=prod(add(o,absLocal(ns[0])),G.pow(add(o,G.inv(s1)),5));
const O0=prod(q(1n<<18n),B,G.pow(H,2)),W1=add(prod(q(4),B2,H,L1),prod(B2,O0));
const A1=prod(q(1n<<16n),add(L1,prod(W1,bumps)));
const L2=prod(add(o,absLocal(ns[1])),G.pow(E(s2),3));
const O1=prod(q(1n<<33n),B2,H,A1),W2=add(prod(q(4),B2,H,L2),prod(q(2),B2,add(G.pow(A1,2),O1)));
const A2=prod(q(1n<<16n),add(L2,prod(W2,bumps))),A=G.maximum(o,H,A1,A2);
const L3=prod(E(s3),add(o,ns[2].solutionNorm));
const O2=prod(q(1n<<33n),B2,G.pow(A,2)),W3=add(prod(q(4),B2,H,L3),prod(q(4),B2,add(G.pow(A,2),O2)));
const A3=prod(q(1n<<16n),add(L3,prod(W3,add(uVal,fVal))));
const P=G.maximum(o,b.inner.B,...ns.slice(0,2).map(absLocal)),D1per=prod(q(1n<<18n),G.pow(add(o,G.inv(s1)),7));
function fromForcing(f,e,s){
  const v=add(e,prod(q(2),a,f)),J=add(prod(q(16),Ma,E(s),v),f);
  return {v,cut:prod(Tcut,add(v,prod(q(2),J)))};
}
function all(e,e2,e3){
  const d1=prod(D1per,e),fd2=prod(f2PerE,e),local2=fromForcing(fd2,e2,s2);
  const omega1Error=prod(q(1n<<18n),B,H,d1),lower2=add(prod(q(4),B,A1,d1),prod(B,omega1Error));
  const eta2=prod(G.pow(E(s2),5),local2.cut),moment2=add(prod(q(4),B2,H,eta2),prod(B,lower2));
  const W2error=add(eta2,prod(bumps,moment2)),d2=prod(q(1n<<16n),W2error);
  const fd3=G.div(prod(q(1n<<35n),P,add(e,local2.cut)),G.pow(s2,4)),local3=fromForcing(fd3,e3,s3);
  const omega2Error=prod(q(1n<<33n),B2,A,add(d1,d2)),lower3=prod(q(1n<<35n),B3,A,add(d1,d2));
  const eta3=prod(G.pow(E(s3),3),local3.cut),moment3=add(prod(q(4),B2,H,eta3),prod(B,lower3));
  const W3error=add(eta3,prod(bumps,moment3)),d3=prod(q(1n<<16n),W3error),P3=add(eta3,prod(B,add(prod(q(2),H,W3error),lower3)));
  return {d1,local2,eta2,omega1Error,lower2,moment2,W2error,d2,local3,eta3,omega2Error,lower3,moment3,W3error,d3,P3,
    full: add(e,local2.cut,local3.cut,prod(q(120),add(d2,d3,P3)))};
}
const columns=[[o,z,z],[z,o,z],[z,z,o]].map(args=>all(...args)),[Gn,G2,G3]=columns.map(row=>row.full);
const e0=prod(q(1n<<25n),G.pow(Q,64),G.pow(t1,-2),add(prod(q(1n<<73n),G.pow(Q,-77)),prod(q(1n<<46n),G.pow(Q,-19))));
const ln2=G.log(q(2)),ln4=G.log(q(4)),b256=q(258);
const N=add(q(2),G.ceiling(G.div(G.log(add(o,prod(G.pow(q(2),258),add(o,Gn),e0))),prod(q(25),G.log(Q)))));
const depth=(j,p)=>G.maximum(add(ns[j-1].Kcondition,q(2)),G.ceiling(G.div(add(prod(b256,ln2),G.log(add(o,p))),ln4)));
const K2=depth(2,G2),K3=depth(3,G3);
assert.ok([H,N,K2,K3,A3].every(id=>G.freeCoordinates(id).size===0));
const result={schema:'MathScope.C113.OriginalWholeHighEtaBankOperands/1',prior,originalN4Prefix:fixed.originalPrefixSHA256,
  eta,X,originalOmegaBranches:omegaRows,wholeLeading:{radialOrder:2,etaOrder:7,roots,copiedNodes:known.size,
    sha256:sha(JSON.stringify(table)),H},fixedInverseAndBumps:{independentEtaProfiles:true,amplitude:'ef=Ef/(1+eta^2)',Iu,If,b0,b1,b2,bumps},
  originalPressureGaugeAndSixComponentRecurrence:true,previousStorageRule:'P_K velocity and P_(K+1) pressure',
  boundedMagnitudes:{L1,A1,L2,A2,L3,A3},wholeOrders:{N2:{FU:5,v:4},N3:{FU:3,v:2,Pi:3}},
  closedGains:columns,sourceDepths:{N,K2,K3,etaIndependent:true,bitsPerContribution:258,ordinaryDerivativeFactor:120,evaluatedNumerically:false},
  wholePairedN4:'OPEN',generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({leading:result.wholeLeading,errors:result.wholeOrders,depths:result.sourceDepths}));
