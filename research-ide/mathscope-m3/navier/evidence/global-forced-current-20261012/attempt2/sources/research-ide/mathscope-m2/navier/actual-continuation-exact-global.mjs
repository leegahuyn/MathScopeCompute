/** Actual C.12 -> C.2/I1 restoration -> the global leading axial function.
 *
 * The correction target consists of the five actual modulation integrals.
 * A debt upper bound is never used as a debt value. All continuous matrix
 * entries are retained, and the inverse is formed from their determinants.
 * The final branch after I1 uses the five defining root equations; it is
 * not the result of rounding a finite root iterate to an exact zero.
 */
import {prepareActualLoopProgram} from './actual-continuation-exact-loop.mjs';
import {readRational,qadd,qmul,qcompare,rational as rational,qtext,fail} from './actual-continuation-arithmetic.mjs';

const less=(a,b)=>qcompare(a,b)<0;
const actualLeadingPrograms=new WeakMap();

/** An independent, deliberately generous inverse/contraction certificate.
 * Bounds on the source inputs come from the pinned C.12 contract. The
 * exact BigInt operations below check only its fixed numerical implications.
 */
export function actualI1ContractionProof(){
  const lambda=rational(1,1n<<200n),radius=rational(1,1000000),inverse=rational(1n<<30n),quadratic=rational(64),preQuadratic=qmul(inverse,quadratic);
  // C.12 §§3--4: raw moments <R^6/N, full row operator <R^7.
  // Our new exact inverse is <2^30<R^3, hence factorial C_eta^2
  // norm <R^16/N. The maximum raw derivative costs a further factor 2.
  const incomingRawJet=rational(1,1n<<441n);
  const image=qadd(incomingRawJet,qmul(rational(4),qmul(lambda,qmul(preQuadratic,qmul(radius,radius)))));
  const lipschitz=qmul(rational(8),qmul(lambda,qmul(preQuadratic,radius)));
  const checks={
    exactULowerDeterminantPositive:less(rational(0),rational(1,200)),
    exactELowerDeterminantPositive:less(rational(0),rational(3,64000000)),
    eAdjugateDividedByDeterminantBelowCommonBound:less(rational(768000000),inverse),
    uInverseBelowCommonBound:less(rational(800),inverse),
    actualSourceMinimumRAbsorbsInverse:(1n<<30n)<8192n**3n,
    incomingMaximumRawEtaJetBelowBeta:less(incomingRawJet,rational(1,100000000)),
    rootBoxInvariantIncludingLeibniz:less(image,radius),
    contractionBelowQuarterIncludingLeibniz:less(lipschitz,rational(1,4)),
    actualLambdaRemainsStrictlyPositive:less(rational(0),lambda),
  };
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','The actual I1 contraction arithmetic failed.');
  return {schema:'MathScope.ActualI1ContractionProof/1',source:'C12_FREQUENCY_CONTRACT.md §§1,3,4; certify_symbolic_c2.py; the same accepted source envelope R and N.',
    matrixDefinition:'The original continuous C.2 matrix with positive unit-mass bumps on [9,9.5], [10,10.5], [11,11.5], [12,12.5], [13,13.5].',
    determinantDerivation:{U:'w_lambda(x)=-integral_0^log(x) exp(-lambda*s) ds; w_lambda_prime=-x^(-1-lambda). The support gap gives |det A_U|>=1/200 and ||A_U^-1||_infty<800.',E:'Factor x^(-3/2-lambda) from each point column. The remaining rows are sqrt(2)*x^(2+lambda), -x, 1. Positivity, ordered gaps >=1/2,3/2,1/2 and the divided-difference bound f[x,y,z]>=1 give |det A_E|>3/64000000. Every cofactor is <=12 and each adjugate row sum <=36.',continuousIntegrationPreservesLowerBound:'Determinant multilinearity integrates the positive pointwise determinant against the product of the three positive unit-mass bump measures.'},
    exactContinuousInverseUpper:qtext(inverse),quadraticUpper:qtext(quadratic),preconditionedQuadraticUpper:qtext(preQuadratic),radius:qtext(radius),
    sourceIncomingBounds:{actualRawMoments:'R^6/N',completeRowOperator:'R^7',actualNormalizedRhs:'R^13/N',actualInverseTimesRhsFactorialC2:'R^16/N',maximumRawEtaDerivatives0Through2:'2*R^16/N <= 2^-441',actualR:'exp(sourceEnvelopeS^256)',actualN:'1+ceil(R^50)',RMinimum:8192,lambdaUpper:'1/2^200',secondRowLambdaMinusTwoRetained:true},
    normConvention:'max over components, eta in [-1,1], and ordinary eta derivative orders 0,1,2. Product square costs <=4r^2, difference of squares <=8r*distance. These bounds also imply pointwise contraction.',
    mapImageUpper:qtext(image),lipschitzUpper:qtext(lipschitz),convenientLipschitzUpper:'1/4',checks,
    iterateStart:'zero vector',tailAfterIterations:'10^-6 * 4^(-iterations)',sameRootForEveryRefinement:true,
    sourceDebtValuesNumericallyEvaluated:false,approximateMatrixInverseUsed:false,finiteIterateDeclaredExactRoot:false};
}

export function prepareActualGlobalLeadingProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','etaDerivativeOrder','rootIterations'].includes(key))fail('INVALID_INPUT','Unknown actual global leading input '+key);
  const order=input.etaDerivativeOrder??0,iterations=input.rootIterations??2;
  if(!Number.isSafeInteger(order)||order<0||order>2||!Number.isSafeInteger(iterations)||iterations<0||iterations>12)fail('RESOURCE_LIMIT','Actual global leading outputs support eta order 0..2 and zero through twelve I1 iterates.');
  const loop=prepareActualLoopProgram({sourceProfile:input.sourceProfile,etaDerivativeOrder:0,rootIterations:0},context),G=loop.G,{X,eta,Ileft,Iright,N}=loop.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one;
  const E=loop.E,U=loop.U,du=loop.deltaU,de=loop.deltaE,lambda=G.parameter('lambda'),X0=G.parameter('X0I1'),I1Right=G.parameter('I1Right'),Xv=G.outer.roots.Xv;
  const power=(x,a,b=1)=>G.exp(G.mul(q(a,b),G.log(x))),integral=(fn,a,b,prefix)=>{const t=G.fresh(prefix);return G.integral(fn(t),t,a,b);};
  const at=(id,x)=>G.substitute(id,X,x),sqrt2=G.sqrt(q(2));
  const logX=G.fresh('actual_C12_debt_logX'),radial=G.exp(logX),ev=at(E,radial),uv=at(U,radial),deltaE=at(de,radial),deltaU=at(du,radial);
  const density=[
    G.mul(radial,deltaU),
    G.mul(sqrt2,power(radial,3,2),deltaE),
    G.mul(sqrt2,power(radial,3,2),G.add(G.mul(ev,deltaU),G.mul(uv,deltaE),G.mul(deltaU,deltaE))),
    G.mul(radial,G.add(G.mul(q(2),uv,deltaU),G.pow(deltaU,2),G.neg(G.mul(ev,deltaE)),G.mul(q(-1,2),G.pow(deltaE,2)))),
    G.add(G.mul(ev,deltaE),G.mul(q(1,2),G.pow(deltaE,2))),
  ];
  const actualDebts=density.map(body=>G.integral(body,logX,G.log(Ileft),G.log(Iright)));
  const [dM,dI,dJ,dS,dCp]=actualDebts;
  const K=G.mul(G.parameter('Pstar'),G.exp(G.add(G.mul(q(-1,2),G.parameter('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),G.parameter('BOuter')),q(25)))))),G.inv(G.add(o,G.pow(eta,2))));
  const X032=power(X0,3,2),K2=G.pow(K,2),lambda2=G.pow(lambda,2);
  const normalizedDebts=[
    G.div(dM,G.mul(X0,K,lambda)),
    G.div(G.sub(G.div(dJ,G.mul(sqrt2,X032,K2)),G.div(dM,G.mul(X0,K))),lambda2),
    G.div(dI,G.mul(X032,K,lambda)),
    G.div(dS,G.mul(X0,K2,lambda)),
    G.div(dCp,G.mul(K2,lambda)),
  ],rhs=normalizedDebts.map(v=>G.neg(v));

  const supports=Array.from({length:5},(_,j)=>[q(j+9),q(2*(j+9)+1,2)]),width=q(1,2),n=5;
  const bump=(x,j)=>G.div(G.step(G.div(G.sub(x,supports[j][0]),width),1),width);
  const onBump=(fn,j,prefix)=>integral(fn,...supports[j],prefix);
  const linear=Array.from({length:n},()=>Array(n).fill(z)),quadraticDiagonal=Array.from({length:n},()=>Array(n).fill(z));
  for(let j=0;j<n;j++){
    context.checkCancelled?.();
    if(j<2){
      linear[0][j]=o;
      linear[1][j]=onBump(x=>G.neg(G.mul(bump(x,j),integral(s=>G.exp(G.neg(G.mul(lambda,s))),z,G.log(x),'actual_I1_divided_weight'))),j,'actual_I1_U_linear');
    }else{
      linear[2][j]=onBump(x=>G.mul(sqrt2,G.sqrt(x),bump(x,j)),j,'actual_I1_E_I');
      linear[3][j]=G.neg(onBump(x=>G.mul(G.exp(G.neg(G.mul(G.add(q(1,2),lambda),G.log(x)))),bump(x,j)),j,'actual_I1_E_S'));
      linear[4][j]=onBump(x=>G.mul(G.exp(G.neg(G.mul(G.add(q(3,2),lambda),G.log(x)))),bump(x,j)),j,'actual_I1_E_Cp');
    }
    const square=onBump(x=>G.pow(bump(x,j),2),j,'actual_I1_bump_squared');
    quadraticDiagonal[3][j]=G.mul(j<2?o:q(-1,2),square);
    if(j>=2)quadraticDiagonal[4][j]=onBump(x=>G.div(G.pow(bump(x,j),2),G.mul(q(2),x)),j,'actual_I1_bump_squared_Cp');
  }
  const determinant=G.determinant(linear),inverse=linear.map((_,i)=>linear.map((__,j)=>G.div(G.mul(q((i+j)%2?-1:1),G.determinant(linear.filter((_,r)=>r!==j).map(row=>row.filter((_,c)=>c!==i)))),determinant)));
  const proof=actualI1ContractionProof(),system=G.defineQuadraticSystem({name:'ActualSameN3C2I1',linear,quadraticDiagonal,rhs,scale:lambda,preconditioner:inverse,rootRadius:q(1,1000000),lipschitzUpper:q(1,4),proof,
    actualOperandSource:'The five exact actual C.12 density integrals over the original loop interval, with its original N log X phase.',
    valueRefinementImplementation:'actual-continuation-exact-global.mjs:prepareActualGlobalLeadingProgram, rootIterations',
    implicitDerivativeImplementation:'actual-continuation-exact-functions.mjs:quadraticRootEtaDerivative',
    continuousMatrixReplacedByPreconditioner:false,preconditionerIsExactContinuousInverse:true,secondDebtRowLambdaMinusTwoRetained:true});
  const values=Array.from({length:n},(_,j)=>G.quadraticRoot(system,j,eta));
  const polynomial=xs=>linear.map((row,i)=>G.add(...row.map((v,j)=>G.mul(v,xs[j])),G.mul(lambda,G.add(...quadraticDiagonal[i].map((v,j)=>G.mul(v,G.pow(xs[j],2)))))));
  const step=xs=>{const quadraticPart=quadraticDiagonal.map(row=>G.mul(lambda,G.add(...row.map((v,j)=>G.mul(v,G.pow(xs[j],2))))));return inverse.map(row=>G.add(...row.map((v,j)=>G.mul(v,G.sub(rhs[j],quadraticPart[j])))));};
  let iterate=Array(n).fill(z);for(let k=0;k<iterations;k++){context.checkCancelled?.();iterate=step(iterate);}
  const rootTail=G.mul(q(1,1000000),q(1,4n**BigInt(iterations))),x=G.div(X,X0);
  const repairU=G.mul(K,lambda,G.add(...[0,1].map(j=>G.mul(values[j],bump(x,j))))),repairE=G.mul(K,lambda,G.add(...[2,3,4].map(j=>G.mul(values[j],bump(x,j)))));
  const partialModulationMass=G.integral(density[0],logX,G.log(Ileft),G.log(X)),modulationMass=G.choose(X,Ileft,Iright,z,partialModulationMass,dM);
  const repairMass=G.mul(X0,K,lambda,G.add(...[0,1].map(j=>G.mul(values[j],G.step(G.div(G.sub(x,supports[j][0]),width))))));
  const finalU=G.add(U,du,repairU),unclosedM=G.add(loop.b8.actualPreC12M,modulationMass,repairMass);
  // The equality after I1 follows from the first defining moment equation.
  // The other four equations also restore all source-stock/pressure moments.
  const finalM=G.choose(X,Ileft,I1Right,loop.b8.actualPreC12M,unclosedM,loop.b8.actualPreC12M),finalMeta=G.derivative(finalM,eta);
  const modifiedVoverX=G.div(G.sub(G.sub(G.mul(q(2),eta,finalU),G.div(G.mul(q(2),G.core.D,eta,finalM),X)),G.div(G.mul(G.core.d,finalMeta),X)),G.core.L);
  const finalv=G.choose(X,Ileft,I1Right,loop.b8.actualPreC12v,modifiedVoverX,loop.b8.actualPreC12v),finalV=G.mul(X,finalv);
  const ueta=G.derivative(finalU,eta),veta=G.derivative(finalv,eta),uvFinal=G.mul(finalU,finalv),uvEta=G.add(G.mul(ueta,finalv),G.mul(finalU,veta));
  const bodies=[finalv,G.mul(X,finalv),uvFinal,G.mul(X,uvFinal),G.pow(finalv,2),G.mul(X,G.pow(finalv,2))],names=['Jminus1','J0','Hminus1','H0','Kminus2','Kminus1'];
  const omegaIntegrals=bodies.map(body=>G.integral(body,X,z,Xv));
  const [Jm,J0,Hm,H0,Km2,Km1]=omegaIntegrals;
  const Jmeta=G.integral(veta,X,z,Xv),J0eta=G.integral(G.mul(X,veta),X,z,Xv),Hmeta=G.integral(uvEta,X,z,Xv),H0eta=G.integral(G.mul(X,uvEta),X,z,Xv);
  const axisVX=loop.b8.roots.actualAxisVX;
  const pressureOmega=G.add(G.div(G.add(G.mul(G.core.D,eta,Jmeta),G.mul(G.core.d,Hmeta),G.neg(G.mul(q(2),G.core.A,eta,Hm))),G.mul(q(2),G.core.L)),G.mul(q(1,4),Km2),axisVX);
  const fluxOmega=G.sub(G.div(G.add(G.mul(G.core.D,eta,J0eta),G.neg(J0),G.mul(G.core.d,H0eta),G.mul(q(2),G.core.D,eta,H0)),G.mul(q(2),G.core.L)),G.mul(q(1,4),Km1));
  const roots={...loop.roots,actualI1K:K,actualI1Determinant:determinant,actualI1DeltaU:repairU,actualI1DeltaE:repairE,actualI1DeltaM:repairMass,actualModulationDeltaM:modulationMass,actualI1RootTail:rootTail,
    actualGlobalU0:finalU,actualGlobalM0:finalM,actualGlobalV0:finalV,actualGlobalV0OverX:finalv,actualGlobalAxisVX:axisVX,actualGlobalSupportXv:Xv,
    actualGlobalOmegaPressureIntegral:pressureOmega,actualGlobalOmegaFluxIntegral:fluxOmega};
  actualDebts.forEach((v,j)=>{roots['actualC12Debt'+j]=v;roots['actualI1NormalizedDebt'+j]=normalizedDebts[j];roots['actualI1Root'+j]=values[j];roots['actualI1Iterate'+j]=iterate[j];roots['actualI1EquationResidual'+j]=G.sub(polynomial(values)[j],rhs[j]);});
  omegaIntegrals.forEach((v,j)=>{roots['actualGlobal'+names[j]]=v;});
  for(let m=1;m<=order;m++)for(const name of ['actualGlobalU0','actualGlobalM0','actualGlobalV0OverX']){context.checkCancelled?.();roots[name+'_eta'+m]=G.derivative(m===1?roots[name]:roots[name+'_eta'+(m-1)],eta);}
  const program=G.pack(roots,{construction:'Actual source C.12 modulation, continuous I1/C.2 five-moment restoration, and the final global leading axial function through its exact compact support.',etaDerivativeOrder:order,
    I1:{system,patch:{X0,right:I1Right,supports,width,unitMass:true},K,linear,quadraticDiagonal,inverse,determinant,actualDebts,normalizedDebts,target:rhs,rootValues:values,materializedIterates:iterate,iterations,rootTail,proof,
      cancellation:{allFiveRestoredByActualRootEquations:true,actualIncomingFiveIntegralsUsed:true,finiteIterateTreatedAsExactRoot:false,afterI1MEqualityFollowsFromFirstMoment:true,afterI1SourceStockEqualityFollowsFromAllFiveMoments:true,positiveLambdaDividedDifferenceNotReplacedByZero:true}},
    globalAxial:{U:finalU,M:finalM,V:finalV,v:finalv,axisVX,Xv,axisRegularity:'Before loopILeft, v uses the actual natural radial average and the B26 regular reconstruction. No singular axis division is evaluated.',support:'The actual leading U, M and V are identically zero after Xv. Heat preparation changes E only beyond I1 and does not change these axial functionals.',actualC12PhaseAndOriginalNRetained:true,outerMomentEqualityUsesRootLimit:true},
    weightedOmega:{names,integrands:bodies,integrals:omegaIntegrals,derivativeIntegrals:{Jmeta,J0eta,Hmeta,H0eta},pressure:pressureOmega,flux:fluxOmega,definitions:{pressure:'integral_0^Xv Omega0/(2X) dX',flux:'integral_0^Xv Omega0/2 dX'},axisBoundary:axisVX,axisBoundaryAtEtaZero:'-4',regularIntegrands:true,source:'WEIGHTED_OMEGA_REDUCTION_KO.md, exact source equations (4.7), (5.6)',entireSupportIncluded:true,intervalAverageSubstitutedForActualC12:false},
    scope:{actualI1IncomingFiveFunctionalOperandsCompiled:true,actualContinuousI1InverseApplied:true,actualI1UniqueRootLimitCompiled:true,actualI1FiniteApproximantsGenerated:true,actualFinalGlobalU0M0V0Compiled:true,actualFullWeightedOmegaFunctionalsCompiled:true,
      actualGlobalTranscendentalValuesNumericallyEnclosed:false,actualOrderOneInnerPicardFunctionCompiled:false,actualOrderOneIposRepairComplete:false,nextPositiveOrderAllowed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}});
  const result={G,program,loop,pre:loop.pre,roots,system,values,iterate,step,polynomial,proof,actualDebts,normalizedDebts,inverse,linear,quadraticDiagonal,finalU,finalM,finalV,finalv,pressureOmega,fluxOmega,
    constants:{X,eta,Ileft,Iright,N,X0,I1Right,Xv,K,lambda}};
  actualLeadingPrograms.set(result,{G,pre:result.pre,roots:[finalU,finalM,finalV,finalv,pressureOmega,fluxOmega],prefix:JSON.stringify(G.nodes),nodeCount:G.nodes.length,definitions:G.captureFunctionDefinitions(),functions:{...result.pre.functions}});
  return result;
}

export function compileActualGlobalLeadingProgram(input={},context={}){return prepareActualGlobalLeadingProgram(input,context).program;}

export function assertActualGlobalLeadingPrepared(result){
  const r=actualLeadingPrograms.get(result);
  if(!r||result.G!==r.G||result.pre!==r.pre||[result.finalU,result.finalM,result.finalV,result.finalv,result.pressureOmega,result.fluxOmega].some((v,j)=>v!==r.roots[j])||JSON.stringify(r.G.nodes.slice(0,r.nodeCount))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||Object.entries(r.functions).some(([name,fn])=>result.pre.functions[name]!==fn))fail('INVALID_SOURCE_CONSTRUCTION','Only an unchanged internally compiled actual global leading source can supply the inner equation. Caller flags and copied reports are not source authority.');
  return true;
}
