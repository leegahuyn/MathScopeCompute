import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,previous,c105,c106,output]=process.argv.slice(2);
assert.ok(output,'Provide the pinned runtime, fixed N3 operands, C105 norms, C106 and new output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async(path,pin)=>{const raw=await readFile(path);assert.equal(sha(raw),pin,path);return JSON.parse(raw);};
const priorPins={fixed:'e6b55d541b5f224b8d291abe101006035b97f54b0e0d5e1c87f7b7c527ba63e1',
  leading:'2f6cdbce5ee4a64a71b18f717b4234d6a45201f7ec28b9164be6ff7a183b8d83',
  priorStress:'d8c5b56bf26f90d87908e73f5c2b3634095af7428d1a60dbe5a3d3d1d9452416'};
const fixed=await read(previous,priorPins.fixed), leading=await read(c105,priorPins.leading), paired=await read(c106,priorPins.priorStress);
const pins={...fixed.pins,'actual-leading-all-order-jets.mjs':'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d'};
for(const [name,pin] of Object.entries(pins))assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const source=await load('actual-residual-order-induction-source.mjs');
const {sourceScaledOperators,sourceSquareStepSecondDerivativeProof,buildActualOmegaCoefficientOverX}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const live=source.prepareActualOrderInduction({order:3,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G,records,bootstrap:b}=live,[n0,n1,n2,n3]=records,{X,eta}=b.constants,{orderOne:r}=b;
assert.equal(sha(JSON.stringify(G.nodes)),fixed.originalPrefixSHA256);
assert.equal(G.nodes.length,fixed.originalNodeCount);
const c0=G.neg(G.core.A),a0=G.neg(G.add(G.core.A,G.q(1,2))),q=(x,y=1)=>G.q(x,y),o=G.one,z=G.zero;
const {A,D,d,L}=G.core,h=G.parameter('h'),nu=j=>G.mul(q(2*j),h),gamma=G.add(c0,nu(3)),beta=G.add(a0,nu(3));
const omega=G.add(G.mul(q(-2),A),nu(3)),tau=G.add(omega,q(1,2)),{Z,T}=sourceScaledOperators(G,X,eta);
const exact=(x,y,atomicNodes)=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes,maxTerms:200000});
assert.ok(exact(G.add(omega,o),nu(2),[h]).pass);
const fwd=n3.stress;
const all=records.map(n=>n.global);
function density(fields){
  const zTerms=[T(gamma,fields[3].U)],tTerms=[T(beta,fields[3].F)];
  for(let i=0;i<4;i++){
    const j=3-i,f=fields[j],g=fields[i];
    zTerms.push(G.mul(X,g.v,G.derivative(f.U,X)),G.mul(g.U,Z(G.add(c0,nu(j)),f.U)));
    tTerms.push(G.mul(g.v,G.add(G.mul(X,G.derivative(f.F,X)),f.F)),G.mul(g.U,Z(G.add(a0,nu(j)),f.F)));
  }
  const {F,U,Pi}=fields[3],fX=G.derivative(F,X),uX=G.derivative(U,X);
  zTerms.push(Z(omega,Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(uX,X)),uX)),
    G.neg(Z(G.sub(G.add(c0,nu(2)),D),Z(G.add(c0,nu(2)),fields[2].U))));
  tTerms.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(fX,X)),G.mul(q(2),fX))),
    G.neg(Z(G.sub(G.add(a0,nu(2)),D),Z(G.add(a0,nu(2)),fields[2].F))));
  return {z:zTerms,theta:tTerms};
}
const actual=density(all);
assert.deepEqual(actual.z,fwd.axialTerms);assert.deepEqual(actual.theta,fwd.angularTerms);
const replaced=density([...all.slice(0,3),Object.fromEntries(['F','U','Pi','v'].map(name=>[name,G.fresh('C110S_alt_'+name)]))]);
const shared={z:[3,4,5,6,11],theta:[3,4,5,6,10]};
for(const [c,positions] of Object.entries(shared))for(const j of positions)assert.equal(actual[c][j],replaced[c][j]);

const xx=G.fresh('C110S_eval_X'),ee=G.fresh('C110S_eval_eta'),atoms=[xx,ee,h];
const dx=G.sub(X,xx),de=G.sub(eta,ee),at=f=>G.simultaneousSubstitute(f,[X,eta],[xx,ee]);
function jet(name){
  const j=Array.from({length:6},(_,i)=>G.fresh('C110S_'+name+'_'+i));atoms.push(...j);
  return G.add(j[0],G.mul(j[1],dx),G.mul(j[2],de),G.mul(q(1,2),j[3],G.pow(dx,2)),
    G.mul(j[4],dx,de),G.mul(q(1,2),j[5],G.pow(de,2)));
}
function stream(name,exponent,profile){
  const v=G.fresh('C110S_'+name);atoms.push(v);
  return G.sub(v,G.mul(dx,at(Z(exponent,profile))));
}
const F0=jet('F0'),U0=jet('U0'),f=jet('f'),u=jet('u'),p=jet('p');
const V0=stream('V0',c0,U0),V=stream('V',gamma,u),fX=G.derivative(f,X),uX=G.derivative(u,X);
const leftZ=G.add(T(gamma,u),G.mul(V0,uX),G.mul(V,G.derivative(U0,X)),G.mul(U0,Z(gamma,u)),G.mul(u,Z(c0,U0)),
  Z(omega,p),G.mul(q(-2),G.add(G.mul(X,G.derivative(uX,X)),uX)));
const leftT=G.mul(q(2),X,G.add(T(beta,f),G.mul(G.div(V0,X),G.add(f,G.mul(X,fX))),
  G.mul(G.div(V,X),G.add(F0,G.mul(X,G.derivative(F0,X)))),G.mul(U0,Z(beta,f)),G.mul(u,Z(a0,F0)),
  G.mul(q(-2),G.add(G.mul(X,G.derivative(fX,X)),G.mul(q(2),fX)))));
const Jz=G.add(G.mul(q(2),U0,u),p),Jt=G.mul(q(2),X,G.add(G.mul(U0,f),G.mul(u,F0))),xf=G.mul(q(2),X,f);
const Bz=G.add(G.mul(V0,u),G.mul(V,U0),G.mul(q(-2),X,uX),G.div(G.sub(G.mul(X,u),G.mul(q(2),eta,X,Jz)),L));
const Bt=G.add(G.mul(q(2),X,G.add(G.mul(V0,f),G.mul(V,F0))),G.mul(q(-4),G.pow(X,2),fX),
  G.div(G.sub(G.mul(q(2),G.pow(X,2),f),G.mul(q(2),eta,X,Jt)),L));
const remainder=(b,f,w,J)=>G.div(G.add(G.neg(G.mul(b,f)),G.mul(D,eta,G.derivative(f,eta)),
  G.mul(q(2),eta,G.add(w,o),J),G.mul(d,G.derivative(J,eta))),L);
const Rz=remainder(G.add(gamma,o),u,omega,Jz),Rt=remainder(G.add(beta,q(2)),xf,tau,Jt);
const zProof=exact(at(leftZ),at(G.add(G.derivative(Bz,X),Rz)),atoms);
const tProof=exact(at(leftT),at(G.add(G.derivative(Bt,X),Rt)),atoms);
assert.ok(zProof.pass&&tProof.pass);
const wrongEta=exact(at(leftZ),at(G.sub(G.add(G.derivative(Bz,X),Rz),G.div(G.mul(d,G.derivative(Jz,eta)),L))),atoms);
const wrongExponent=exact(at(leftT),at(G.sub(G.add(G.derivative(Bt,X),Rt),G.div(G.mul(q(2),eta,G.add(tau,o),Jt),L))),atoms);
assert.ok(!wrongEta.pass&&!wrongExponent.pass);

// The closed source-pressure forcing perturbation can be reduced exactly,
// even though the whole higher mixed norms needed for its bound are open.
const us=[jet('U0omega'),jet('U1omega'),jet('U2omega')],vs=[jet('v0omega'),jet('v1omega'),jet('v2omega')];
const eu=[z,jet('dU1omega'),jet('dU2omega')],ev=[z,jet('dv1omega'),jet('dv2omega')];
const fu=[z,jet('F1omega'),jet('F2omega')],ef=[z,jet('dF1omega'),jet('dF2omega')];
const neg=(arr,err)=>arr.map((val,i)=>G.sub(val,err[i]));
const uh=neg(us,eu),vh=neg(vs,ev),fh=neg(fu,ef);
const om=(U,v)=>buildActualOmegaCoefficientOverX(G,{order:2,X,eta,U,v}).value;
const transport=(a,b)=>G.mul(a,G.add(G.mul(q(1,2),b),G.mul(X,G.derivative(b,X))));
const ev2x=G.derivative(ev[2],X),omegaTerms=[T(G.sub(nu(2),o),ev[2]),
  G.mul(q(-2),G.add(G.mul(q(2),ev2x),G.mul(X,G.derivative(ev2x,X)))),
  G.neg(Z(G.sub(G.sub(nu(1),D),o),Z(G.sub(nu(1),o),ev[1])))];
for(let i=0;i<=2;i++){
  const j=2-i,power=G.sub(nu(j),o);
  omegaTerms.push(transport(ev[i],vs[j]),transport(vh[i],ev[j]),G.mul(eu[i],Z(power,vs[j])),G.mul(uh[i],Z(power,ev[j])));
}
const exactOmega=exact(at(G.sub(om(us,vs),om(uh,vh))),at(G.add(...omegaTerms)),atoms);
assert.ok(exactOmega.pass);
const pOld=G.sub(G.mul(q(2),fu[1],fu[2]),G.mul(q(1,2),om(us,vs)));
const pNew=G.sub(G.mul(q(2),fh[1],fh[2]),G.mul(q(1,2),om(uh,vh)));
const pError=G.sub(G.mul(q(2),G.add(G.mul(ef[1],fu[2]),G.mul(fh[1],ef[2]))),G.mul(q(1,2),G.add(...omegaTerms)));
const exactPressure=exact(at(G.sub(pOld,pNew)),at(pError),atoms);
assert.ok(exactPressure.pass);

function lowerForcing(F,U,v){
  const angular=[],axial=[];
  for(const i of [1,2]){
    const j=3-i;
    angular.push(G.mul(v[i],G.add(F[j],G.mul(X,G.derivative(F[j],X)))),G.mul(U[i],Z(G.add(a0,nu(j)),F[j])));
    axial.push(G.mul(X,v[i],G.derivative(U[j],X)),G.mul(U[i],Z(G.add(c0,nu(j)),U[j])));
  }
  angular.push(G.neg(Z(G.sub(G.add(a0,nu(2)),D),Z(G.add(a0,nu(2)),F[2]))));
  axial.push(G.neg(Z(G.sub(G.add(c0,nu(2)),D),Z(G.add(c0,nu(2)),U[2]))));
  return [G.add(...angular),G.add(...axial)];
}
const trueForcing=lowerForcing(fu,us,vs),finiteForcing=lowerForcing(fh,uh,vh),errA=[],errZ=[];
const radialF=f=>G.add(f,G.mul(X,G.derivative(f,X)));
for(const i of [1,2]){
  const j=3-i,ap=G.add(a0,nu(j)),cp=G.add(c0,nu(j));
  errA.push(G.mul(ev[i],radialF(fu[j])),G.mul(vh[i],radialF(ef[j])),G.mul(eu[i],Z(ap,fu[j])),G.mul(uh[i],Z(ap,ef[j])));
  errZ.push(G.mul(X,ev[i],G.derivative(us[j],X)),G.mul(X,vh[i],G.derivative(eu[j],X)),G.mul(eu[i],Z(cp,us[j])),G.mul(uh[i],Z(cp,eu[j])));
}
errA.push(G.neg(Z(G.sub(G.add(a0,nu(2)),D),Z(G.add(a0,nu(2)),ef[2]))));
errZ.push(G.neg(Z(G.sub(G.add(c0,nu(2)),D),Z(G.add(c0,nu(2)),eu[2]))));
const forcingReplays=[errA,errZ].map((row,j)=>exact(at(G.sub(trueForcing[j],finiteForcing[j])),at(G.add(...row)),atoms));
assert.ok(forcingReplays.every(row=>row.pass));

const ns=n3.norm.actual, ps=G.picardSystems[n3.raw.system];
const fromLower=(pKnown,Htheta,Hz)=>source.actualInductionLinearKernel(G,{X,eta,xi:n3.raw.xi,lambda:nu(3),
  F0:n0.actual.F,U0:n0.actual.U,v0:n0.actual.v,pKnown,Htheta,Hz});
const actualMatrix=fromLower(n3.raw.pKnown,n3.raw.Htheta,n3.raw.Hz),otherMatrix=fromLower(pNew,...finiteForcing);
assert.deepEqual(actualMatrix.matrix0,otherMatrix.matrix0);assert.deepEqual(actualMatrix.matrix1,otherMatrix.matrix1);
const atXi=id=>G.substitute(id,X,G.pow(n3.raw.xi,2));
assert.deepEqual(actualMatrix.matrix0.map(row=>row.map(atXi)),ps.A0);
assert.deepEqual(actualMatrix.matrix1.map(row=>row.map(atXi)),ps.A1);
assert.deepEqual(ps.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(ps.A0.slice(0,2),[[z,z,z,z,o,z],[z,z,z,z,z,o]]);
assert.ok(ps.A1.slice(0,2).every(rr=>rr.every(x=>x===z)));
assert.deepEqual(ps.forcing.slice(0,2),[z,z]);
assert.equal(ns.C,fixed.nativeN3Tail.C);assert.equal(ns.Kcondition,fixed.nativeN3Tail.Kcondition);
const nativeEtaTail=source.actualOrderInductionTail(live,{order:3,kind:'actual',etaOrder:1,bits:256});
const step=sourceSquareStepSecondDerivativeProof();
assert.ok(step.pass&&step.sigmaPrimeUpper.startsWith('9 ')&&step.sigmaSecondUpper==='8192');

const leadingAudit=actualLeadingAllOrderJets({radialOrder:2,etaOrder:3});
assert.ok(leadingAudit.pass&&leadingAudit.sourceFunctionIdentity.U0Root===b.finalU);
assert.equal(leadingAudit.parameterExpressionSHA256,b.program.parameterExpressionSHA256);
assert.equal(sha(JSON.stringify(leadingAudit.normProgram.nodes)),leading.leadingNorm.programSHA256);
assert.equal(leadingAudit.bounds.U0.root,leading.leadingNorm.U);assert.equal(leadingAudit.bounds.F0active.root,leading.leadingNorm.F);
assert.deepEqual(leadingAudit.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
const lookup=new Map(leading.leadingNorm.arithmeticNodes),copied=new Map();
function scalar(id){
  if(copied.has(id))return copied.get(id);
  const {op,args}=lookup.get(id);let p;
  if(op==='rational')p=q(BigInt(args[0]),BigInt(args[1]));
  else if(op==='source_parameter')p=G.parameter(args[0]);
  else if(op==='integer_power')p=G.pow(scalar(args[0]),args[1]);
  else{assert.ok(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op),op);p=G.node(op,args.map(scalar));}
  copied.set(id,p);return p;
}
const H0=G.mul(q(4096),G.add(o,scalar(leading.leadingNorm.U),scalar(leading.leadingNorm.F)));
assert.equal(copied.size,1968);assert.equal(G.freeCoordinates(H0).size,0);
const B=G.maximum(o,r.Xplus),Ef=G.substitute(r.ef,eta,z),R=r.Rbase,lam=G.parameter('lambda'),s=ns.strip;
assert.ok(exact(G.mul(r.ef,G.add(o,G.pow(eta,2))),Ef,[]).pass);
// C110 scalar graph IDs above the immutable prefix must be rebuilt here.
const power=(x,k)=>G.exp(G.mul(k,G.log(x)));
const rr1=power(R,G.sub(o,G.mul(q(2),lam))),rrp=power(R,G.sub(q(-2),G.mul(q(2),lam))),rrz=power(R,G.mul(q(-2),lam));
const euRhs=[G.inv(R),G.div(G.add(G.inv(R),G.div(q(4),G.mul(Ef,rr1))),G.mul(q(2),lam))];
const efRhs=[G.inv(G.pow(R,2)),G.div(q(2),G.mul(Ef,rrp)),G.div(q(4),G.mul(Ef,rrz))];
const inverseGain=(mat,rhs)=>G.maximum(...mat.map(rr=>G.add(...rr.map((m,j)=>G.mul(G.add(o,G.pow(m,2)),rhs[j])))));
const Iu=inverseGain(r.Uinverse,euRhs),If=inverseGain(r.Einverse,efRhs);
const E=G.add(o,G.div(q(2),s)),mom=G.mul(q(4),G.pow(B,2),H0,E),b0=q(1n<<15n),b1=q(1n<<35n);
const bU=G.div(G.mul(q(2),b0,Iu),R),bF=G.div(G.mul(q(3),b0,If),G.pow(R,2));
const TU=G.add(E,G.mul(mom,bU)),TF=G.add(E,G.mul(mom,bF));
const TP=G.add(E,G.mul(q(2),B,H0,E),G.mul(q(4),B,Ef,rrp,mom,bF));
const radial=G.mul(q(48),B,ns.matrixBound,E),taper=G.div(q(1024),G.parameter('t1'));
const DU=G.add(radial,taper,G.div(G.mul(q(4),b1,Iu,mom),R));
const DF=G.add(radial,taper,G.div(G.mul(q(3),G.add(b1,b0),If,mom),G.pow(R,2)));
const transfer=G.maximum(o,TU,TF,TP,DU,DF);
const denominator=G.mul(q(2),r.Xminus),inv=G.maximum(o,G.inv(denominator),G.inv(G.sqrt(denominator)));
const gain=G.mul(q(256),G.pow(B,3),H0,transfer,inv);
const K=G.maximum(G.add(ns.Kcondition,q(2)),G.ceiling(G.div(G.add(G.mul(q(256),G.log(q(2))),G.log(gain)),G.log(q(4)))));
const remainderRoot=G.mul(q(1,3),gain,G.exp(G.neg(G.mul(K,G.log(q(4))))));
assert.equal(G.freeCoordinates(remainderRoot).size,0);
assert.ok(fixed.fiveMoments.zeroNumeratorMonomials.every(x=>x===0));
assert.equal(fixed.stress[0].density,fwd.thetaBody);assert.equal(fixed.stress[1].density,fwd.zBody);
assert.deepEqual(fwd.compactSupport,[r.Xminus,r.Xplus]);
const out={schema:'MathScope.C110.OriginalNativeN3FixedStressOperands/1',pins,priorPins,sourcePrefixSHA256:fixed.originalPrefixSHA256,
  originalStress:fixed.stress,originalEta:eta,originalX:X,activeCutoffs:[r.Xminus,r.Xplus],sourceTermCounts:{z:actual.z.length,theta:actual.theta.length},
  unchangedLowerTermPositions:shared,conservativeNumerators:[zProof.numeratorMonomials,tProof.numeratorMonomials],
  wrongEtaAndExponentNumerators:[wrongEta.numeratorMonomials,wrongExponent.numeratorMonomials],
  nativePicard:{system:n3.raw.system,C:ns.C,M:ns.matrixBound,s:ns.strip,Kcondition:ns.Kcondition,radialDomain:ns.radialDomain,
    originalEtaTail:nativeEtaTail,KMinus2Required:true},
  leading:{U:leading.leadingNorm.U,F:leading.leadingNorm.F,programSHA256:leading.leadingNorm.programSHA256,copiedNodes:copied.size,H0},
  exactLowerRecursionDifferences:{omega2Numerator:exactOmega.numeratorMonomials,rawPressureNumerator:exactPressure.numeratorMonomials,
    lowerAngularAndAxialNumerators:forcingReplays.map(row=>row.numeratorMonomials),preservedActualMatrixEntries:72,
    pairedN2GlobalInputProofPinned:priorPins.priorStress,coupledN3BoundsObtained:false},
  uniformBudget:{B,Ef,R,s,E,mom,Iu,If,b0,b1,TU,TF,TP,DU,DF,inv,gain,K,remainderRoot,freeCoordinateCount:0,
    fixedOriginalHistories:true,strictTarget:'<2^-256'},
  comparisonsRepresented:{forward:true,backwardOnGuard:true,absoluteXIntegrals:true,forwardRetainsInnerPrefix:true},
  originalN3NativeValuesNumerical:false,generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stress:out.conservativeNumerators,wrong:out.wrongEtaAndExponentNumerators,
  lower:[exactOmega.numeratorMonomials,exactPressure.numeratorMonomials],K,leadingNodes:copied.size}));
