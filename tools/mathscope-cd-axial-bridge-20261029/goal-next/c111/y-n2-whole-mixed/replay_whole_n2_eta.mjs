import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,localPath,c105Path,output]=process.argv.slice(2);
assert.ok(output,'Specify original runtime, paired local operands, C105 and output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const get=async(path,pin)=>{const bytes=await readFile(path);assert.equal(sha(bytes),pin,path);return JSON.parse(bytes);};
const prior={local:'e14ddddddec16b677a0f2ed7169f09bc3ffd9c2dbdee855c77167bc95db061bb',
  C105:'4706411acb5ddf906fa50fc07e062c313374a2e34d0042c459da12eec0cddaf6'};
const local=await get(localPath,prior.local),c105=await get(c105Path,prior.C105);
assert.equal(local.lowerWholeIposEta3Attached,false);
assert.ok(c105.wholeCoupledTransfer.sameExteriorPressureAndCoefficientErrorsZeroAfterLastIpos);
for(const [name,pin] of Object.entries(local.pins))assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=n=>import(pathToFileURL(resolve(runtime,n)));
const source=await load('actual-residual-order-induction-source.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const {sourceAllOrderCutoffJets}=await load('actual-residual-order-induction-kernels.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {sourceSquareStepSecondDerivativeProof,buildActualOmegaCoefficientOverX}=await load('actual-continuation-exact-order-two-source.mjs');
const original=source.prepareActualOrderInduction({order:3,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(original));
const {G,bootstrap:b,records:[n0,n1,n2]}=original,{orderOne:r,constants:{X,eta}}=b;
assert.equal(sha(JSON.stringify(G.nodes)),local.actualSourcePrefix);
const q=(x,d=1)=>G.q(x,d),o=G.one,z=G.zero,exact=(x,y,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes});
const leading=actualLeadingAllOrderJets({radialOrder:2,etaOrder:5});
assert.ok(leading.pass&&leading.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(leading.parameterExpressionSHA256,b.program.parameterExpressionSHA256);
assert.deepEqual(leading.bounds.U0.domain.X,['0','infinity']);
assert.deepEqual(leading.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
assert.ok(leading.boundConvention.includes('every requested mixed derivative'));
const roots=[leading.bounds.U0.root,leading.bounds.F0active.root],table=leading.normProgram.nodes,clones=new Map();
function copy(i){
  if(clones.has(i))return clones.get(i);
  const {op,args}=table[i];let result;
  if(op==='rational')result=q(BigInt(args[0]),BigInt(args[1]));
  else if(op==='source_parameter')result=G.parameter(args[0]);
  else if(op==='integer_power')result=G.pow(copy(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);result=G.node(op,args.map(copy));}
  clones.set(i,result);return result;
}
const H=G.mul(q(1n<<20n),G.add(o,...roots.map(copy))),B=G.maximum(o,r.Xplus);
const sf=sourceAllOrderCutoffJets({order:3}),sharp=sourceSquareStepSecondDerivativeProof();
assert.ok(sf.pass&&sharp.pass&&sharp.sigmaSecondUpper==='8192');
const sig3=BigInt(sf.activation.ordinaryDerivativeBounds[3]);
assert.ok(sig3>0n);
const omega0=buildActualOmegaCoefficientOverX(G,{order:0,X,eta,U:[n0.global.U],v:[n0.global.v]});
assert.equal(omega0.terms.length,4);
const omega1=buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[n0.global.U,n1.global.U],v:[n0.global.v,n1.global.v]});
assert.equal(omega1.terms.length,7);
assert.deepEqual(G.nodes[n2.global.omega].args,[X,b.inner.aSquared,r.Xplus,n2.raw.omegaOverX,omega1.value,z]);
assert.deepEqual(G.nodes[n2.global.dU].args.slice(0,4),[X,r.X0,r.IposRight,z]);
assert.deepEqual(G.nodes[n2.global.dF].args.slice(0,4),[X,r.X0,r.IposRight,z]);
assert.ok([n1,n2].every(n=>n.global.actualMomentChecks.every(row=>row.pass)));

const y=G.fresh('C110W_y'),at=G.fresh('C110W_y_at'),R=G.fresh('C110W_R'),v=G.fresh('C110W_b'),d=G.fresh('C110W_bp'),dd=G.fresh('C110W_bpp');
const dy=G.sub(y,at),p=G.add(v,G.mul(d,dy),G.mul(q(1,2),dd,G.pow(dy,2)));
const dX=node=>G.div(G.derivative(node,y),G.mul(G.pow(R,2),y));
const weighted=node=>G.mul(q(1,2),G.pow(R,2),G.pow(y,2),dX(dX(node)));
const nextU=G.div(G.sub(dd,G.div(d,at)),G.mul(q(2),G.pow(R,3)));
const nextF=G.div(G.add(G.div(dd,at),G.div(G.mul(q(-3),d),G.pow(at,2)),G.div(G.mul(q(3),v),G.pow(at,3))),G.mul(q(2),G.pow(R,4)));
const ux=G.div(d,G.mul(G.pow(R,3),at)),fx=G.div(G.sub(G.div(d,G.pow(at,2)),G.div(v,G.pow(at,3))),G.pow(R,4));
const diffChecks=[[dX(G.div(p,R)),ux],[dX(G.div(p,G.mul(G.pow(R,2),y))),fx],
  [weighted(G.div(p,R)),nextU],[weighted(G.div(p,G.mul(G.pow(R,2),y))),nextF]].map(([left,right])=>exact(G.substitute(left,y,at),right,[at,R,v,d,dd]));
assert.ok(diffChecks.every(row=>row.pass));

const r0=r.Rbase,ef=G.substitute(r.ef,eta,z),lambda=G.parameter('lambda'),pow=(x,k)=>G.exp(G.mul(k,G.log(x)));
const R1=pow(r0,G.sub(o,G.mul(q(2),lambda))),Rp=pow(r0,G.sub(q(-2),G.mul(q(2),lambda))),Rz=pow(r0,G.mul(q(-2),lambda));
assert.ok(exact(G.mul(r.ef,G.add(o,G.pow(eta,2))),ef).pass);
const rhsU=[G.inv(r0),G.div(G.add(G.inv(r0),G.div(q(5),G.mul(ef,R1))),G.mul(q(2),lambda))],
  rhsF=[G.inv(G.pow(r0,2)),G.div(q(5),G.mul(q(2),ef,Rp)),G.div(q(5),G.mul(ef,Rz))];
const maxRows=(rows,rhs)=>G.maximum(...rows.map(row=>G.add(...row.map((m,j)=>G.mul(G.add(o,G.pow(m,2)),rhs[j])))));
const Iu=maxRows(r.Uinverse,rhsU),If=maxRows(r.Einverse,rhsF),b0=q(1n<<15n),b1=q(1n<<35n),b2=q(sig3*2048n**3n);
const uValue=G.div(G.mul(q(2),b0,Iu),r0),fValue=G.div(G.mul(q(3),b0,If),G.pow(r0,2));
const UGain=G.add(uValue,G.div(G.mul(G.add(G.mul(q(3),b1),b2),Iu),G.pow(r0,3)));
const FGain=G.add(fValue,G.div(G.mul(q(3),G.add(b2,G.mul(q(4),b1),G.mul(q(4),b0)),If),G.pow(r0,4)));
const nativeS1=n1.norm.actual.strip,s1=G.div(b.inner.delta,q(16)),s2=n2.norm.actual.strip;
assert.ok(exact(nativeS1,G.mul(q(2),s1),[b.inner.delta]).pass);
const F1local=G.mul(G.add(o,n1.norm.actual.solutionNorm),G.pow(G.add(o,G.inv(s1)),5));
const Omega0=G.mul(q(1n<<15n),B,G.pow(H,2));
const incoming1=G.add(G.mul(q(4),G.pow(B,2),H,F1local),G.mul(G.pow(B,2),Omega0));
const N1=G.add(F1local,G.mul(incoming1,G.add(uValue,fValue)));
const D1perE=G.mul(q(1n<<16n),G.pow(G.add(o,G.inv(s1)),5));
const Omega1PerE=G.mul(q(1n<<15n),B,H,D1perE);
const lowerPerE=G.add(G.mul(q(4),B,N1,D1perE),G.mul(B,Omega1PerE));
const incomingPerE=G.mul(B,lowerPerE),etaLoss=G.pow(G.add(o,G.div(q(2),s2)),3);
const incomingPerCut2=G.mul(q(4),G.pow(B,2),H,etaLoss);
const G1=G.mul(G.add(UGain,FGain),incomingPerE),G2=G.add(etaLoss,G.mul(G.add(UGain,FGain),incomingPerCut2));
const Q=G.parameter('Q'),t1=G.parameter('t1'),Xa=G.parameter('Xa'),wid=G.div(t1,q(64)),E2=G.add(o,G.div(q(2),s2));
const k1=G.div(q(9),G.mul(wid,Xa)),k2=G.add(G.div(q(9),G.mul(wid,G.pow(Xa,2))),G.div(q(8192),G.mul(G.pow(wid,2),G.pow(Xa,2))));
const Lcut=G.add(o,G.mul(q(3),k1),k2),Ma=G.mul(q(1n<<20n),G.pow(Q,4)),a=G.sqrt(b.inner.aSquared);
const H1=G.div(G.mul(q(4096),G.add(o,n1.norm.actual.C),G.add(o,n1.norm.actual.solutionNorm),G.pow(Q,64)),G.mul(t1,s1));
const J1=G.div(G.mul(q(1n<<25n),H1),G.pow(s1,2));
const A_K=G.mul(Lcut,G.add(o,G.mul(q(32),Ma,E2)));
const A_N=G.add(G.mul(A_K,q(2),a,J1),G.mul(Lcut,q(2),J1));
const C_e=G.add(G1,G.mul(G2,A_N)),C_k=G.mul(G2,A_K);
const e0=G.mul(q(1n<<25n),G.pow(Q,64),G.pow(t1,-2),G.add(G.mul(q(1n<<73n),G.pow(Q,-77)),G.mul(q(1n<<46n),G.pow(Q,-19))));
const N=G.add(q(2),G.ceiling(G.div(G.log(G.add(o,G.mul(G.pow(q(2),269),G.add(o,C_e),e0))),G.mul(q(25),G.log(Q)))));
const K2=G.maximum(G.add(n2.norm.actual.Kcondition,q(2)),G.ceiling(G.div(G.add(G.mul(q(269),G.log(q(2))),G.log(G.add(o,C_k))),G.log(q(4)))));
assert.ok([H,G1,G2,N,K2].every(x=>G.freeCoordinates(x).size===0));
const out={schema:'MathScope.C110.OriginalNativeN2PairedWholeMixedOperand/1',prior,sourcePrefix:local.actualSourcePrefix,
  leading:{requestedRadialOrder:2,requestedEtaOrder:5,roots,copiedNormNodes:clones.size,programSHA256:sha(JSON.stringify(table)),H},
  exactBumpXIdentities:diffChecks.map(row=>row.numeratorMonomials),sigmaThirdBound:sig3.toString(),
  wholeLowerSource:{originalOmega0Terms:4,originalOmega1Terms:7,n2OriginalSelector:n2.global.omega,secondOrderLocalBelowBump:true,
    immutableC105OrdinaryMomentPremises:true,keptOriginalMassAndPressureGauge:true},
  positiveClosedBudget:{B,s1,s2,b0,b1,b2,Iu,If,uValue,fValue,UGain,FGain,F1local,Omega0,incoming1,N1,D1perE,Omega1PerE,lowerPerE,
    incomingPerE,incomingPerCut2,etaLoss,G1,G2,formula:'S2whole=G1*e+G2*N2Cut'},
  sourceDepths:{A_K,A_N,C_e,C_k,N,K2,e0,separateTailBits:269,allFreeCoordinateCount:0,numericCentersEvaluated:false},
  originalCoefficients:['F2','U2'],ordinaryEtaOrder:3,radialOrders:['value','dX','X*dXX'],generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({leading:out.leading,bumps:out.exactBumpXIdentities,G1,G2}));
