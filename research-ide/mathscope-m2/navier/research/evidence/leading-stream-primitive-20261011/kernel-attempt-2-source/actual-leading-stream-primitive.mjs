/** The actual leading stream primitive, through every original join.
 *
 * This audit attaches to the unchanged private source constructor. It
 * retains the natural series, complete B26 histories, B8 and C12/I1 root
 * equations, and BOTH outer pulse moment corrections. A compact integrand
 * is never used as a reason to discard its accumulated integral.
 */
import {prepareActualGlobalLeadingProgram,assertActualGlobalLeadingPrepared} from './actual-continuation-exact-global.mjs';
import {explicitPrimitiveBodyIdentity} from './actual-global-primitive-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {originalLeadingStreamPrimitiveIdentities} from './actual-leading-stream-primitive-kernel.mjs';
import {originalLeadingMassContinuityDefect} from './actual-leading-omega-prefix-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const data=p=>({checks:p.checks,source:p.source,generic:p.generic,parts:p.parts,roots:p.roots,scope:p.scope});
const requirePass=(c,message)=>{if(!c.pass)fail('INVALID_SOURCE_CONSTRUCTION',message);return c;};

function sourceOuterMass(G,context){
  const q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,t=G.var('t'),xi=G.var('xi'),eta=G.core.eta,
    outer=G.outer,lambda=G.parameter('lambda'),pulse=outer.stages.find(s=>s.id==='pulse'),
    {Xp,Ep,mConst,amplitude}=outer.roots,eq=outer.equations.pulse,coefficients=eq.coefficients,
    alpha=G.neg(G.add(q(1,2),lambda)),slope=G.sub(q(1,2),lambda),centers=[G.sub(pulse.length,q(3)),G.sub(pulse.length,o)],
    R0=w=>G.substitute(outer.roots.R0,xi,w),
    bump=(v,c)=>G.mul(q(10,3),G.step(G.add(G.mul(q(10,3),G.sub(v,c)),q(1,2)),1)),
    integral=(fn,a,b,name)=>{const v=G.fresh(name);return G.integral(fn(v),v,a,b);},
    prefix=(fn,a,b,end,name)=>G.choose(end,a,b,z,integral(fn,a,end,name+'_partial'),integral(fn,a,b,name+'_total')),
    mainRanges=[[z,q(1,50)],[q(1,50),q(10)],[q(10),q(11)]],
    main=G.add(...mainRanges.map(([a,b])=>prefix(w=>G.div(G.mul(G.exp(G.mul(G.div(slope,lambda),w)),R0(w)),lambda),a,b,G.mul(lambda,t),'stream_outer_main'))),
    bumps=centers.map(c=>prefix(v=>G.mul(G.exp(G.mul(slope,v)),bump(v,c)),G.sub(c,q(3,20)),G.add(c,q(3,20)),t,'stream_outer_bump')),
    Rt=G.add(G.mul(amplitude,R0(G.mul(lambda,t))),...coefficients.map((c,j)=>G.mul(c,bump(t,centers[j])))),
    Ut=G.mul(Ep,G.exp(G.mul(alpha,t)),Rt),
    Mt=G.add(G.mul(eta,mConst),G.mul(Xp,Ep,G.add(G.mul(amplitude,main),...coefficients.map((c,j)=>G.mul(c,bumps[j]))))),
    expectedM=G.choose(t,z,pulse.length,G.mul(eta,mConst),Mt,z),expectedU=G.choose(t,z,pulse.length,z,Ut,z),
    atoms=[Xp,Ep,mConst,amplitude,...coefficients,...eq.incoming,...eq.perAmplitude,...eq.linear.flat()],
    bodyChecks={
      outerMass:requirePass(explicitPrimitiveBodyIdentity(G,outer.roots.M,expectedM,{atomicNodes:atoms,maxVisits:600000}),'The original outer mass prefix changed.'),
      outerU:requirePass(explicitPrimitiveBodyIdentity(G,outer.roots.U,expectedU,{atomicNodes:atoms,maxVisits:600000}),'The original outer pulse U changed.'),
      originalLogJacobian:requirePass(sourceGraphRationalIdentity(G,G.sub(slope,G.add(o,alpha))),'The outer pulse lost its logarithmic radial Jacobian.'),
    };
  context.onProgress?.({phase:'leading-stream-outer-bodies',nodes:G.nodes.length});
  // The two exact affine moment solves are retained. The amplitude's
  // nonlinear energy equation is irrelevant to these affine identities.
  const affineRows=eq.linear.map((row,i)=>{
    const value=G.sub(G.add(...row.map((a,j)=>G.mul(a,coefficients[j]))),G.add(eq.incoming[i],G.mul(amplitude,eq.perAmplitude[i])));
    return requirePass(sourceGraphRationalIdentity(G,value,{atomicNodes:[...eq.linear.flat(),...eq.incoming,...eq.perAmplitude,amplitude],maxTerms:50000}),'An original outer affine moment equation failed.');
  });
  const w=G.fresh('stream_outer_debt_exponent'),normalization=G.exp(G.mul(slope,centers[0])),
    actualDebtExponent=G.add(G.mul(G.div(slope,lambda),G.sub(w,q(13))),G.mul(q(3),slope)),
    expectedDebtExponent=G.sub(G.mul(G.div(slope,lambda),w),G.mul(slope,centers[0])),
    exponentCheck=requirePass(sourceGraphRationalIdentity(G,G.sub(actualDebtExponent,expectedDebtExponent)),'The original main-pulse debt exponent changed.'),
    reconstructedPerAmplitude=G.neg(G.add(...mainRanges.map(([a,b])=>integral(v=>G.div(G.mul(G.exp(G.add(G.mul(G.div(slope,lambda),G.sub(v,q(13))),G.mul(q(3),slope))),R0(v)),lambda),a,b,'stream_outer_per_amplitude')))),
    perAmplitudeCheck=requirePass(explicitPrimitiveBodyIdentity(G,eq.perAmplitude[0],reconstructedPerAmplitude,{atomicNodes:[lambda],maxVisits:600000}),'The actual complete main-pulse mass debt was not retained.'),
    Mshape=G.div(mConst,G.parameter('XR')),f=G.inv(G.add(o,G.pow(eta,2))),
    expectedIncoming=G.neg(G.mul(eta,Mshape,G.exp(G.neg(G.add(pulse.start,G.parameter('logP'),pulse.logAStart,G.log(f),G.mul(slope,centers[0]))))));
  // mConst/XR and its source product use the same positive XR. Normalize
  // this rational factor only; no transcendental or primitive is canceled.
  const incomingCheck=requirePass(sourceGraphRationalIdentity(G,G.sub(eq.incoming[0],expectedIncoming),{
    atomicNodes:[G.exp(G.neg(G.add(pulse.start,G.parameter('logP'),pulse.logAStart,G.log(f),G.mul(slope,centers[0]))))],maxTerms:30000}),'The actual incoming outer mass changed.');
  const beta0=integral(v=>G.mul(G.exp(G.mul(slope,v)),bump(v,z)),q(-3,20),q(3,20),'stream_outer_centered_bump'),
    betaChecks=[requirePass(explicitPrimitiveBodyIdentity(G,eq.linear[0][0],beta0),'The original complete centered mass bump integral changed.'),
      requirePass(explicitPrimitiveBodyIdentity(G,eq.linear[0][1],G.mul(eq.linear[0][0],G.exp(G.mul(q(2),slope)))),'The second complete mass bump translation changed.')];
  return {bodyChecks,affineRows,exponentCheck,perAmplitudeCheck,incomingCheck,betaChecks,
    actualM:outer.roots.M,actualU:outer.roots.U,coordinate:t,physicalX:G.mul(Xp,G.exp(t)),
    originalCompletePrefixes:{main,bumps},actualFirstMomentEquation:{linear:eq.linear[0],incoming:eq.incoming[0],perAmplitude:eq.perAmplitude[0],coefficients,normalization},
    proof:{interior:'By the literal compact-prefix FTC on each support interval and w=lambda*t, d_t M=Xp*Ep*exp((1/2-lambda)*t)*R(t)=X*U. Gaps are constant primitive branches with U=0.',
      left:'All partial prefixes are zero at t=0. The source main R0 and translated derivative bumps vanish there with flat jets, so M=eta*mConst and U=0 match the preceding wait.',
      completeBumps:'Changing variables v=t-center0 or center1 yields exp(slope*center0)*linear[0][j], including the second translation by 2.',
      completeMain:'The original perAmplitude[0] equals -exp(-slope*center0) times the three complete main integrals; exponentCheck verifies this exact exponent relation.',
      completeIncoming:'Since Xp=XR*exp(pulse.start), Ep=Pstar*exp(pulse.logAStart)/(1+eta^2), Pstar=exp(logP), multiplication of incoming[0] by Xp*Ep*exp(slope*center0) gives -eta*mConst.',
      right:'The actual first affine moment equation therefore makes M(13/lambda)=0 exactly for the actual energy-selected amplitude. Every pulse bump ends strictly before this endpoint, so the final zero branch has matching derivative jets.',
      supportGaps:'The main pulse ends at t=11/lambda<13/lambda. The last translated bump ends at 13/lambda-1+3/20<13/lambda; its start is beyond zero since 0<lambda<1.',
      compactIntegrandImpliesZeroPrimitive:false},pass:true};
}

export function attachActualLeadingStreamPrimitive(leading,input={},context={}){
  assertActualGlobalLeadingPrepared(leading);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)fail('INVALID_INPUT','No replacement derivative, debt, root, cutoff or source field is accepted.');
  const G=leading.G,q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,{X,eta,Ileft,Iright,X0,I1Right,K,lambda}=leading.constants,
    {loop,pre}=leading,b8=loop.b8,{Xa,Xi,Xsep,restLeft,restRight,XR,Keta,c,Gi,mu}=pre.constants,
    Lambda=G.parameter('Lambda'),p=G.source.parametersExactExpressions,
    checks=[],add=(id,pass,extra={})=>{if(!pass)fail('INVALID_SOURCE_CONSTRUCTION',id);const v={id,pass,...extra};checks.push(v);return v;},
    equal=(id,a,b,atomicNodes=[])=>{const check=explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:600000});add(id,check.pass,{check});return check;},
    algebra=(id,a,atomicNodes=[])=>{const check=sourceGraphRationalIdentity(G,a,{atomicNodes,maxTerms:50000});add(id,check.pass,{check});return check;},
    integral=(fn,a,b,name)=>{const v=G.fresh(name);return G.integral(fn(v),v,a,b);},
    logMass=(fn,a,b,name)=>integral(v=>G.mul(G.exp(v),fn(G.exp(v))),G.log(a),G.log(b),name);
  add('original-positive-parameter-relations',G.source.parameterExpressionSHA256==='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'&&same(p.Xa,{quotient:[{integer:4},{ref:'Lambda'}]})&&same(p.Pstar,{exp:{ref:'logP'}})&&same(p.T,{sum:[{exp:{ref:'Md'}},{integer:10}]})&&same(p.Md,{integer:1048576})&&same(p.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}}));
  add('original-leading-coordinates-and-scale-parameters',X===G.var('X')&&eta===G.core.eta&&Lambda===G.parameter('Lambda')&&XR===G.parameter('XR')&&mu===G.parameter('muMoment')&&Xa===G.parameter('Xa')&&Xi===q(110)&&Xsep===G.parameter('Xsep')&&X0===G.parameter('X0I1')&&I1Right===G.parameter('I1Right')&&lambda===G.parameter('lambda'));
  const generic={primitive:originalLeadingStreamPrimitiveIdentities(),continuity:originalLeadingMassContinuityDefect()},
    Y=G.mul(Lambda,X),naturalAverage=G.add(G.core.Ustar,G.div(G.natural('average',Y),Lambda)),
    naturalM=pre.functions.coreMoments(Y)[0],naturalU=pre.functions.naturalU(Y),naturalMa=pre.functions.coreMoments(q(4))[0];
  algebra('original-natural-M-equals-X-times-original-average',G.sub(naturalM,G.mul(X,naturalAverage)),[G.natural('average',Y),G.core.Ustar]);
  equal('original-natural-U-uses-same-u-series',naturalU,G.add(G.core.Ustar,G.div(G.natural('u',Y),Lambda)));
  add('original-natural-series-coefficient-and-tail-kernels',G.naturalKernel.coefficientImplementation==='actual-continuation-exact-core.mjs:prepareActualNaturalCoreProgram'&&G.naturalKernel.tailImplementation==='actual-continuation-exact-tail.mjs:actualNaturalScaledTail'&&G.naturalKernel.coefficientSpace==='B_rho, radial base 20'&&G.naturalKernel.actualPressureRoot===G.core.P0&&G.naturalKernel.actualPositiveGRoot===G.core.g);
  const atXi=G.add(naturalMa,logMass(pre.functions.B26UAt,Xa,Xi,'stream_B26_history')),
    atXsep=G.add(pre.prefixMoments.atXi[0],logMass(()=>Gi,Xi,Xsep,'stream_B34_mass')),
    atRestLeft=G.add(pre.prefixMoments.atXsep[0],logMass(()=>Gi,Xsep,restLeft,'stream_ideal_gap_mass')),
    incoming=G.add(pre.prefixMoments.atRestLeft[0],logMass(pre.functions.restoredUAt,restLeft,restRight,'stream_restore_history'));
  equal('whole-original-B26-mass-history',pre.prefixMoments.atXi[0],atXi,[naturalMa]);
  equal('whole-original-B34-mass-history',pre.prefixMoments.atXsep[0],atXsep,[pre.prefixMoments.atXi[0],Gi]);
  equal('whole-original-ideal-gap-mass-history',pre.prefixMoments.atRestLeft[0],atRestLeft,[pre.prefixMoments.atXsep[0],Gi]);
  equal('whole-original-restoration-mass-history',pre.incomingActual[0],incoming,[pre.prefixMoments.atRestLeft[0],Gi]);
  const width=q(1,4096),supports=Array.from({length:2},(_,j)=>[q(j+6,2048),q(2*(j+6)+1,4096)]),x=G.div(X,XR),
    bump=(v,j)=>G.step(G.div(G.sub(v,supports[j][0]),width),1),
    correction=G.mul(XR,Keta,mu,G.add(...[0,1].map(j=>G.mul(b8.values[j],G.choose(x,...supports[j],z,integral(v=>bump(v,j),supports[j][0],x,'stream_B8_bump'),width))))),
    du8=G.mul(Keta,mu,G.add(...[0,1].map(j=>G.mul(b8.values[j],bump(x,j))))),
    innerMass=G.add(naturalMa,integral(pre.functions.B26UAt,Xa,X,'stream_B26_prefix')),
    afterXi=G.add(pre.prefixMoments.atXi[0],G.mul(Gi,G.sub(X,Xi))),
    beforeRestore=G.choose(X,Xa,Xi,naturalM,innerMass,afterXi),
    restoreMass=G.add(pre.prefixMoments.atRestLeft[0],integral(pre.functions.restoredUAt,restLeft,X,'stream_restore_prefix')),
    beforePatch=G.choose(X,restLeft,restRight,beforeRestore,restoreMass,pre.incomingActual[0]),
    patchMass=G.add(pre.incomingActual[0],G.mul(c,G.sub(X,restRight)),correction),
    eXR=G.mul(XR,G.exp(o)),decayEnd=G.mul(eXR,G.exp(G.parameter('T'))),patchRight=G.mul(XR,G.exp(q(-5))),
    radialLog=G.log(G.div(X,eXR)),k=s=>G.mul(q(4),G.sub(o,G.step(G.div(G.log(G.add(o,s)),G.parameter('Md'))))),
    decayMass=G.mul(eta,eXR,G.add(q(4),integral(v=>G.mul(G.exp(v),k(v)),z,radialLog,'stream_decay_prefix'))),
    tailLog=G.log(G.div(X,G.outer.roots.Xp)),tailM=G.substitute(G.outer.roots.M,G.var('t'),tailLog),tailU=G.substitute(G.outer.roots.U,G.var('t'),tailLog),
    afterPatchM=G.choose(X,eXR,decayEnd,G.mul(c,X),decayMass,tailM),
    afterPatchU=G.choose(X,eXR,decayEnd,c,G.mul(eta,k(radialLog)),tailU),
    beforeU=G.choose(X,restLeft,restRight,G.choose(X,Xa,Xi,naturalU,pre.functions.B26UAt(X),Gi),pre.functions.restoredUAt(X),c),
    expectedPreM=G.choose(X,restRight,patchRight,beforePatch,patchMass,afterPatchM),
    expectedPreU=G.choose(X,restRight,patchRight,beforeU,G.add(c,du8),afterPatchU),
    atoms=[...b8.values,Keta,Gi,pre.incomingActual[0],pre.prefixMoments.atXi[0],pre.prefixMoments.atRestLeft[0],tailM,tailU];
  equal('all-original-pre-C12-M-branches',b8.actualPreC12M,expectedPreM,atoms);
  equal('all-original-pre-C12-U-branches',b8.actualPreC12U,expectedPreU,atoms);
  equal('original-B8-unnormalized-bump-U',b8.deltaU,du8,[...b8.values,Keta]);
  const b8system=G.quadraticSystems[b8.system];
  add('original-B8-mass-row-normalization',b8system.name==='ActualSameN3B8'&&b8system.scale===mu&&b8system.linear[0].every((v,j)=>v===(j<2?width:z))&&b8system.quadraticDiagonal[0].every(v=>v===z)&&b8.values.every((v,j)=>v===G.quadraticRoot(b8.system,j,eta)));
  const b8Equation=G.sub(G.mul(width,G.add(b8.values[0],b8.values[1])),b8system.rhs[0]),
    b8Discrepancy=G.add(G.sub(pre.incomingActual[0],G.mul(c,restRight)),G.mul(XR,Keta,mu,width,G.add(b8.values[0],b8.values[1])));
  algebra('B8-zero-join-is-the-original-first-root-equation',G.sub(b8Discrepancy,G.mul(XR,Keta,mu,b8Equation)),[pre.incomingActual[0],...b8.values,Keta]);
  // The decay mass is the SAME whole integral used by the outer incoming
  // mass. Its final eleven time units have identically zero integrand.
  const kEnd=G.sub(G.exp(G.parameter('Md')),o),wholeDecay=integral(v=>G.mul(G.exp(v),k(v)),z,kEnd,'stream_whole_decay'),
    expectedMassConstant=G.mul(XR,G.exp(o),G.add(q(4),wholeDecay));
  equal('original-decay-mass-equals-outer-incoming-mConst',G.outer.roots.mConst,expectedMassConstant);
  algebra('eleven-unit-flat-decay-tail',G.sub(G.sub(G.add(G.exp(G.parameter('Md')),q(10)),kEnd),q(11)));
  context.onProgress?.({phase:'leading-stream-pre-C12-complete',nodes:G.nodes.length});
  const outer=sourceOuterMass(G,context);

  const sourceDu=loop.deltaU,modulationDensityVariable=G.fresh('stream_C12_logX'),radial=G.exp(modulationDensityVariable),
    modulationDensity=G.mul(radial,G.substitute(sourceDu,X,radial)),
    completeDebt=G.integral(modulationDensity,modulationDensityVariable,G.log(Ileft),G.log(Iright)),
    partial=G.integral(modulationDensity,modulationDensityVariable,G.log(Ileft),G.log(X)),
    modulationMass=G.choose(X,Ileft,Iright,z,partial,leading.actualDebts[0]);
  const Bcut=G.nodes[loop.B],N=G.parameter('radialFrequencyN'),physicalPhase=G.mul(N,G.log(X));
  add('original-C12-zero-exterior-cut-and-endpoints',Bcut.op==='smooth_piecewise'&&Bcut.args[0]===X&&Bcut.args[1]===Ileft&&Bcut.args[2]===Iright&&Bcut.args[3]===z&&Bcut.args[5]===z&&Ileft===G.parameter('loopILeft')&&Iright===G.parameter('loopIRight'));
  equal('original-C12-physical-fast-phase-retained',sourceDu,G.div(G.substitute(loop.B,loop.program.loop.phase,physicalPhase),N));
  equal('entire-original-C12-mass-debt',leading.actualDebts[0],completeDebt);
  equal('entire-original-C12-mass-prefix',leading.roots.actualModulationDeltaM,modulationMass,[leading.actualDebts[0]]);
  const iwidth=q(1,2),ix=G.div(X,X0),isupports=[[q(9),q(19,2)],[q(10),q(21,2)]],
    iarg=j=>G.div(G.sub(ix,isupports[j][0]),iwidth),
    repairMass=G.mul(X0,K,lambda,G.add(...[0,1].map(j=>G.mul(leading.values[j],G.step(iarg(j)))))),
    repairU=G.mul(K,lambda,G.add(...[0,1].map(j=>G.mul(leading.values[j],G.div(G.step(iarg(j),1),iwidth))))),
    expectedM=G.choose(X,Ileft,I1Right,b8.actualPreC12M,G.add(b8.actualPreC12M,leading.roots.actualModulationDeltaM,repairMass),b8.actualPreC12M),
    expectedU=G.add(b8.actualPreC12U,sourceDu,repairU);
  equal('original-C12-pre-U-is-same-pre-C12-source',loop.U,b8.actualPreC12U);
  equal('original-I1-normalized-mass-bumps',leading.roots.actualI1DeltaM,repairMass,[K,...leading.values]);
  equal('original-I1-normalized-U-bumps',leading.roots.actualI1DeltaU,repairU,[K,...leading.values]);
  // The reconstructed modulation prefix was bound above by full-body
  // alpha-equivalence. Use its original node as the shared operand here;
  // a renamed bound variable does not create a different mass function.
  equal('all-original-global-M-branches',leading.finalM,expectedM,[b8.actualPreC12M,leading.roots.actualModulationDeltaM,repairMass]);
  equal('all-original-global-U-terms',leading.finalU,expectedU,[b8.actualPreC12U,sourceDu,repairU]);
  const i1system=G.quadraticSystems[leading.system];
  add('original-I1-first-mass-row',i1system.name==='ActualSameN3C2I1'&&i1system.scale===lambda&&i1system.linear[0].every((v,j)=>v===(j<2?o:z))&&i1system.quadraticDiagonal[0].every(v=>v===z)&&leading.values.every((v,j)=>v===G.quadraticRoot(leading.system,j,eta)));
  const i1Equation=G.sub(G.add(leading.values[0],leading.values[1]),i1system.rhs[0]),
    i1Discrepancy=G.add(leading.actualDebts[0],G.mul(X0,K,lambda,G.add(leading.values[0],leading.values[1])));
  algebra('I1-zero-join-is-the-original-first-root-equation',G.sub(i1Discrepancy,G.mul(X0,K,lambda,i1Equation)),[leading.actualDebts[0],K,...leading.values]);
  const general=(M,U)=>G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.div(G.mul(q(2),G.core.D,eta,M),X)),G.div(G.mul(G.core.d,G.derivative(M,eta)),X)),G.core.L),
    naturalV=G.div(G.sub(G.sub(G.mul(q(2),eta,naturalU),G.mul(q(2),G.core.D,eta,naturalAverage)),G.mul(G.core.d,G.derivative(naturalAverage,eta))),G.core.L),
    preV=G.choose(X,Xa,patchRight,naturalV,general(b8.actualPreC12M,b8.actualPreC12U),general(b8.actualPreC12M,b8.actualPreC12U)),
    finalV=G.choose(X,Ileft,I1Right,b8.actualPreC12v,general(leading.finalM,leading.finalU),b8.actualPreC12v);
  equal('original-pre-C12-v-keeps-axis-regular-average',b8.actualPreC12v,preV,[b8.actualPreC12M,b8.actualPreC12U]);
  equal('original-global-v-is-the-same-stream-reconstruction',leading.finalv,finalV,[b8.actualPreC12v,leading.finalM,leading.finalU]);
  algebra('core-v-agrees-with-general-stream-formula-for-X-positive',G.sub(naturalV,general(G.mul(X,naturalAverage),naturalU)),[naturalU,naturalAverage,G.derivative(naturalAverage,eta),G.core.D,G.core.d,G.core.L]);
  const parts={natural:{M:naturalM,U:naturalU,average:naturalAverage,kernel:generic.primitive.naturalSeries,
      proof:'The SAME original coefficient loop stores average_n=u_n/(n+1). For every N, d_Y(Y average_N)=u_N; uniform derivative tails on Y<=4.1 permit the limit, including all one-sided axis jets. X=Y/Lambda gives M_X=Ustar+u/Lambda.'},
    preC12:{actualM:b8.actualPreC12M,actualU:b8.actualPreC12U,completeMassHistory:[naturalMa,pre.prefixMoments.atXi[0],pre.prefixMoments.atXsep[0],pre.prefixMoments.atRestLeft[0],pre.incomingActual[0]],
      b8Equation,b8Discrepancy,wholeDecay,
      joins:['Xa=4/Lambda: natural mass at Y=4 plus the same B26 integral with zero lower prefix.','Xi: the original logarithmic complete B26 integral equals its X-coordinate prefix by the positive change of variables.','Xsep and restLeft: U=Gi in both intervening regions; their full mass increments equal Gi times endpoint differences.','restRight: full restoredU prefix equals the stored incoming mass; the B8 bumps start later.','B8 patchRight: the original first root equation cancels actual-minus-ideal mass, giving M=4eta X. Derivative bumps end earlier.','e*XR: k(0)=4 and all correction derivatives are flat, so eta*e*XR*(4+prefix) matches 4eta X.','decayEnd: k has been zero for eleven units; the complete mass is eta*mConst and matches the outer waiting branch.'],
      primitiveDerivative:'Literal FTC in each active branch; the unused nested after-branches are not asserted to satisfy a different outer branch equation.',finiteRootIterateDeclaredExact:false},outer,
    modulation:{actualDu:sourceDu,entireDebt:leading.actualDebts[0],mass:modulationMass,
      proof:'The whole original C12 body, including its original N log X phase, enters exp(t)*deltaU(exp(t)). The positive log-radius Jacobian makes its prefix derivative deltaU(X). Flat source cutoff gives zero before Ileft and the complete actual debt after Iright.',intervalAverageSubstituted:false},
    I1:{actualMass:repairMass,actualU:repairU,rootEquation:i1Equation,remainingMass:i1Discrepancy,
      proof:'The two original unit-mass sigma-prime bumps have primitives sigma, with the same factor X0*K*lambda. All bumps end before I1Right/X0=exp(5)>32>13.5. The first original root equation is therefore exactly the accumulated C12-plus-I1 mass cancellation.',finiteRootIterateDeclaredExact:false},
    stream:{v:leading.finalv,formula:'v=(2eta U-2D eta M/X-d M_eta/X)/L on X>0, with its original regular axis extension.',
      consequence:'M_X=U gives L(v+X v_X)+d U_eta-2A eta U-2eta X U_X=0 by the separately checked exact continuity-defect identity.',axisBoundaryRetained:leading.roots.actualGlobalAxisVX},
    regularity:{domain:'X>=0, eta in [-1,1], with inward eta endpoint and one-sided X=0 derivatives.',
      joins:'The original natural, B26, flat-step and root smoothness arguments supply the source regularity. Continuous primitive constants are verified above at every active join; differentiating an unverified smooth_piecewise flag is not used to infer these constants.',
      allOrderMajorantComputedHere:false}};
  const result={G,leading,source:{profileId:leading.program.profileId,parameterExpressionSHA256:leading.program.parameterExpressionSHA256,originalConstructor:'actual-continuation-exact-global.mjs:prepareActualGlobalLeadingProgram',callerFieldsAccepted:false},generic,checks,parts,
    roots:{actualGlobalM0:leading.finalM,actualGlobalU0:leading.finalU,actualGlobalv0:leading.finalv,B8actualMassEquation:b8Equation,I1actualMassEquation:i1Equation,actualAxisVX:leading.roots.actualGlobalAxisVX},
    scope:{actualGlobalLeadingMassPrimitiveIdentity:true,actualGlobalLeadingStreamReconstruction:true,actualLeadingContinuityIdentity:true,
      actualOmegaPrefixSourceBinding:false,wholeGlobalPressureConvolutionIdentity:false,allOrderPhysicalResidualFlatness:false,
      numericalPrimitiveValuesComputed:false,newLeanKernelProof:false,wholeGN4Complete:false,m3MayStart:false}};
  const packed=G.pack(result.roots,{schema:'MathScope.ActualLeadingStreamPrimitiveProgram/1',...data(result)}),{nodes,...rest}=packed;
  result.program={...structuredClone(rest),nodes:G.nodes.slice()};
  seals.set(result,{G,leading,nodeCount:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  return result;
}

export function prepareActualLeadingStreamPrimitive(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='sourceProfile'))fail('INVALID_INPUT','Only the unchanged original source profile may be selected.');
  return attachActualLeadingStreamPrimitive(prepareActualGlobalLeadingProgram({sourceProfile:input.sourceProfile,etaDerivativeOrder:0,rootIterations:0},context),{},context);
}

export function assertActualLeadingStreamPrimitive(result){
  const s=seals.get(result);
  if(!s||result.G!==s.G||result.leading!==s.leading||canonicalStringify(data(result))!==s.data||canonicalStringify(result.program)!==s.program||canonicalStringify(s.G.nodes.slice(0,s.nodeCount))!==s.prefix||!s.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Only the unchanged private original leading stream primitive has source authority.');
  assertActualGlobalLeadingPrepared(s.leading);return true;
}

export async function leadingStreamPrimitiveCertificate(result){
  assertActualLeadingStreamPrimitive(result);const canonical=canonicalStringify(result.program);
  return {schema:'MathScope.ActualLeadingStreamPrimitiveCertificate/1',status:'COMPLETED',pass:true,...data(result),graph:{sha256:await sha256(canonical),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(canonical).length,graphIncluded:false}};
}
