/** Exact operator identities used by the separate strengthened background.
 * These generic kernels never authenticate supplied coefficients or norms.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

/** AD deliberately retains an all-zero smooth-piecewise node. Its integral
 * is still the zero function, even when the low-level node is not G.zero.
 * This proof-only reducer uses only zero arithmetic and all-zero branches;
 * a compactly supported NONZERO integrand never makes its primitive zero.
 */
export function reduceLiteralZeroDerivatives(G,expression,{atomicNodes=[]}={}){
  const atoms=new Set(atomicNodes),zeroCache=new Map(),cache=new Map(),trace=[];
  const zero=id=>{
    if(id===G.zero)return true;if(atoms.has(id))return false;if(zeroCache.has(id))return zeroCache.get(id);
    const {op,args}=G.nodes[id];let answer=false;
    if(op==='add')answer=args.every(zero);
    else if(op==='multiply')answer=args.some(zero);
    else if(op==='smooth_piecewise')answer=args.slice(3).every(zero);
    else if(op==='integer_power'&&args[1]>0||op==='sqrt_positive')answer=zero(args[0]);
    else if(op==='definite_integral')answer=args[2]===args[3]||zero(args[0]);
    zeroCache.set(id,answer);return answer;
  };
  const visit=id=>{
    if(atoms.has(id))return id;if(cache.has(id))return cache.get(id);
    if(zero(id)){if(id!==G.zero)trace.push({root:id,operation:G.nodes[id].op,rule:'literal zero arithmetic or all-zero smooth branches'});return G.zero;}
    const {op,args}=G.nodes[id];let value=id;
    if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply')value=G.mul(...args.map(visit));
    else if(op==='inverse')value=G.inv(visit(args[0]));
    else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
    else if(op==='sqrt_positive')value=G.sqrt(visit(args[0]));
    cache.set(id,value);return value;
  };
  return {original:expression,value:visit(expression),trace,nonzeroCompactPrimitiveReplaced:false};
}

/** The physical Cartesian/time derivatives in commuting profile coordinates
 * (q,y1,y2,eta), y=x_perp/sqrt(q). Coefficient derivatives are retained.
 */
export function physicalSourceChartDerivatives(G,{q,x1,x2,eta}={}){
  const vars=[q,x1,x2,eta];
  if(new Set(vars).size!==4||vars.some(x=>G.nodes[x]?.op!=='coordinate'))fail('INVALID_INPUT','The physical chart needs four distinct retained coordinates.');
  const c=(n,d=1)=>G.q(n,d),h=G.parameter('h'),D=G.sub(c(1,2),h),d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(c(2),h,G.pow(eta,2))),
    power=a=>G.exp(G.mul(a,G.log(q))),euler=f=>G.mul(q,G.derivative(f,q)),transverseEuler=f=>G.add(G.mul(x1,G.derivative(f,x1)),G.mul(x2,G.derivative(f,x2)));
  const operators={
    x1:f=>G.mul(power(c(-1,2)),G.derivative(f,x1)),
    x2:f=>G.mul(power(c(-1,2)),G.derivative(f,x2)),
    z:f=>G.div(G.mul(power(G.neg(D)),G.add(G.mul(c(2),eta,euler(f)),G.neg(G.mul(eta,transverseEuler(f))),G.mul(d,G.derivative(f,eta)))),L),
    t:f=>G.div(G.add(G.neg(euler(f)),G.div(transverseEuler(f),c(2)),G.mul(D,eta,G.derivative(f,eta))),G.mul(q,L))
  };
  return {coordinates:{q,x1,x2,eta},operators,D,d,L,euler,transverseEuler,
    domain:'q>0, -1<=eta<=1, original 0<h<1/2; eta endpoints use one-sided derivatives.',sourceAuthenticated:false};
}

/** Direct Cartesian Navier-Stokes momentum. Stress is supplied only by a
 * later authenticated source adapter; this generic differential polynomial
 * cannot decide that its residual is flat or that its arguments are source.
 */
export function directCartesianMomentum(G,{velocity,pressure,operators,stressDivergence=null}={}){
  if(!Array.isArray(velocity)||velocity.length!==3||velocity.some(v=>!G.nodes[v])||!G.nodes[pressure]||!['x1','x2','z','t'].every(k=>typeof operators?.[k]==='function'))
    fail('INVALID_INPUT','Momentum needs every retained velocity component, pressure, and all physical derivatives.');
  if(stressDivergence!==null&&(!Array.isArray(stressDivergence)||stressDivergence.length!==3||stressDivergence.some(v=>!G.nodes[v])))fail('INVALID_INPUT','Supply all three stress-divergence components.');
  const spatial=['x1','x2','z'],rows=velocity.map((f,j)=>{
    const time=operators.t(f),diffusion=G.neg(G.add(...spatial.map(k=>operators[k](operators[k](f))))),pressureGradient=operators[spatial[j]](pressure),
      transport=G.add(...spatial.map((k,i)=>G.mul(velocity[i],operators[k](f)))),stress=stressDivergence?.[j]??G.zero;
    return {component:spatial[j],time,diffusion,pressureGradient,transport,stress,value:G.add(time,diffusion,pressureGradient,transport,stress)};
  });
  return {rows,values:rows.map(r=>r.value),differentialOrder:2,polynomialDegree:2,sourceAuthenticated:false};
}

/** Verify (4.11)/(4.16) for arbitrary smooth F,U and their literal moments.
 * dX uses only the displayed FTC relations and commutation of mixed jets.
 * No leading residual is defined to be the desired stress divergence.
 */
export function originalLeadingMomentStressIdentity(){
  const G=new ActualConvergentExpressions(),c=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,X=G.fresh('leading_identity_X'),
    names=['F','FX','FXX','Feta','FXeta','U','UX','UXX','Ueta','UXeta','M','Meta','I','Ieta','J','Jeta','S','Seta','Pi','Pieta'],s=Object.fromEntries(names.map(k=>[k,G.fresh('leading_identity_'+k)]));
  const rules=new Map([[X,G.one],[s.F,s.FX],[s.FX,s.FXX],[s.Feta,s.FXeta],[s.U,s.UX],[s.UX,s.UXX],[s.Ueta,s.UXeta],
    [s.M,s.U],[s.Meta,s.Ueta],[s.I,G.mul(c(2),X,s.F)],[s.Ieta,G.mul(c(2),X,s.Feta)],
    [s.J,G.mul(c(2),X,s.U,s.F)],[s.Jeta,G.mul(c(2),X,G.add(G.mul(s.Ueta,s.F),G.mul(s.U,s.Feta)))],
    [s.S,G.sub(G.pow(s.U,2),G.mul(X,G.pow(s.F,2)))],[s.Seta,G.sub(G.mul(c(2),s.U,s.Ueta),G.mul(c(2),X,s.F,s.Feta))],
    [s.Pi,G.pow(s.F,2)],[s.Pieta,G.mul(c(2),s.F,s.Feta)]]),cache=new Map();
  const dx=id=>{
    if(rules.has(id))return rules.get(id);if(cache.has(id))return cache.get(id);
    const {op,args}=G.nodes[id];let value;
    if(op==='add')value=G.add(...args.map(dx));
    else if(op==='multiply')value=G.add(G.mul(dx(args[0]),args[1]),G.mul(args[0],dx(args[1])));
    else if(op==='inverse')value=G.neg(G.mul(G.pow(args[0],-2),dx(args[0])));
    else if(op==='integer_power')value=G.mul(c(args[1]),G.pow(args[0],args[1]-1),dx(args[0]));
    else if(['coordinate','source_parameter','rational'].includes(op))value=G.zero;
    else fail('UNSUPPORTED','The universal leading identity needs only rational differential polynomials, found '+op);
    cache.set(id,value);return value;
  };
  const h=G.parameter('h'),W=G.sub(G.one,G.div(G.add(G.mul(c(2),D,eta,s.M),G.mul(d,s.Meta)),X)),
    v=G.div(G.sub(G.sub(G.mul(c(2),eta,s.U),G.div(G.mul(c(2),D,eta,s.M),X)),G.div(G.mul(d,s.Meta),X)),L),
    angularNumerator=G.add(G.mul(G.sub(G.one,h),s.I),G.neg(G.mul(D,eta,s.Ieta)),G.neg(G.mul(d,s.Jeta)),G.mul(c(2),G.sub(h,D),eta,s.J));
  const thetaCorrect=G.add(G.neg(G.div(G.mul(s.F,G.pow(X,2),W),L)),G.div(angularNumerator,G.mul(c(2),L)),G.mul(c(2),G.pow(X,2),s.FX));
  const axialNumerator=G.add(G.neg(G.mul(X,W,s.U)),G.mul(D,G.sub(s.M,G.mul(eta,s.Meta))),G.mul(c(4),h,eta,s.S),G.neg(G.mul(d,s.Seta)),G.mul(X,G.sub(G.mul(c(4),A,eta,s.Pi),G.mul(d,s.Pieta)))),
    zTimesR=G.add(G.div(axialNumerator,L),G.mul(c(2),X,s.UX)),b=G.neg(G.add(A,c(1,2))),cc=G.neg(A),
    time=(a,f,fx,fe)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(X,fx),G.mul(D,eta,fe)),L),
    zz=(a,f,fx,fe)=>G.div(G.add(G.mul(c(2),eta,G.sub(G.mul(a,f),G.mul(X,fx))),G.mul(d,fe)),L),
    thetaResidual=G.add(time(b,s.F,s.FX,s.Feta),G.mul(v,G.add(G.mul(X,s.FX),s.F)),G.mul(s.U,zz(b,s.F,s.FX,s.Feta)),G.mul(c(-2),G.add(G.mul(X,s.FXX),G.mul(c(2),s.FX)))),
    axialResidual=G.add(time(cc,s.U,s.UX,s.Ueta),G.mul(X,v,s.UX),G.mul(s.U,zz(cc,s.U,s.UX,s.Ueta)),zz(G.mul(c(-2),A),s.Pi,G.pow(s.F,2),s.Pieta),G.mul(c(-2),G.add(G.mul(X,s.UXX),s.UX)));
  const theta=sourceGraphRationalIdentity(G,G.add(dx(thetaCorrect),G.mul(X,thetaResidual))),axial=sourceGraphRationalIdentity(G,G.add(dx(zTimesR),axialResidual)),
    missingShear=sourceGraphRationalIdentity(G,G.add(dx(G.sub(thetaCorrect,G.mul(c(2),G.pow(X,2),s.FX))),G.mul(X,thetaResidual))),
    wrongBackwardSign=sourceGraphRationalIdentity(G,G.sub(G.mul(X,thetaResidual),dx(thetaCorrect)));
  const pass=theta.pass&&axial.pass&&!missingShear.pass&&!wrongBackwardSign.pass;
  if(!pass)fail('INTERNAL_VALIDATION','The original leading moment-stress identity or its independent negative controls failed.');
  return {schema:'MathScope.OriginalLeadingMomentStressIdentity/1',pass,checks:{theta,axial},negativeControls:{missingShear,wrongBackwardSign},
    relations:{M_X:'U',I_X:'2*X*F',J_X:'2*X*U*F',S_X:'U^2-X*F^2',Pi_X:'F^2',mixed:'Differentiate these relations in eta; retain Pi(0,eta).'},
    statements:['d_X(X*T0theta)+X*(leading angular residual/R)=0','d_X(sqrt(2X)*T0z)+(leading axial residual)=0'],
    leadingAxialViscosityExcluded:true,axialViscosityFirstAppearsAtOrderOne:true,allSourceCoefficientsSupplied:false,newLeanKernelProof:false};
}

/** Complete ordered tail of a finite uncut truncation. Missing entries of
 * this finite polynomial are zero by the definition of that truncation;
 * no unconstructed coefficient of the infinite field is set to zero.
 */
export function finiteActualResidualIndexLedger(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='truncationOrder'))fail('INVALID_INPUT','Only the finite truncation index is accepted.');
  const N=input.truncationOrder??2;if(!Number.isSafeInteger(N)||N<1||N>512)fail('RESOURCE_LIMIT','Use a finite residual ledger within its explicit 512-order representation budget.');
  const pairs=k=>Array.from({length:N+1},(_,i)=>[i,k-i]).filter(([,j])=>j>=0&&j<=N),theta=[],axial=[],radial=[];
  for(let n=N+1;n<=2*N;n++){
    const row={order:n,orderedPairs:pairs(n),axialViscosityOfOrder:n===N+1?N:null};theta.push(row);axial.push(structuredClone(row));
  }
  for(let n=N+1;n<=2*N+1;n++){
    const k=n-1;radial.push({order:n,pressureOrderPresent:false,centrifugalPairs:pairs(n),omega:{order:k,timeAndRadialViscosityOfOrder:k<=N?k:null,orderedPairs:pairs(k),axialViscosityOfOrder:k>0&&k-1<=N?k-1:null}});
  }
  const pass=[...theta,...axial,...radial].every(r=>r.order>=N+1)&&theta.every(r=>r.orderedPairs.every(([i,j])=>i>0&&j>0&&i+j===r.order))&&radial.every(r=>r.omega.orderedPairs.every(([i,j])=>i+j===r.order-1));
  return {schema:'MathScope.FiniteActualResidualIndexLedger/1',truncationOrder:N,theta,axial,radial,pass,
    minimumIncrement:{integerMultiplier:2*(N+1),sourceParameter:'h',strictlyIncreasingBecauseOriginalHPositive:true},
    physicalBaseLosses:{theta:'A+1',axial:'A+1',radial:'2*A+1/2'},safePhysicalLoss:'K_m=2*A+1+m, independent of N',
    parameterRule:'lambda_n=2*n*h; 1-2D=2h and -1+lambda_(n-1)=-2A+lambda_n.',
    retainedCoefficientCancellationProved:false,actualCoefficientRootsBound:false,sourceAuthenticated:false};
}

/** Exact physical derivatives of q^exponent*profile. The profile variables
 * are y=x_perp/sqrt(q), eta. The exponent is independent of them. This
 * recurrence keeps each word's actual loss until after differentiating;
 * it never differentiates a previously weakened upper bound.
 */
export function physicalMonomialDerivativeWords(G,{body,exponent,x1,x2,eta,derivativeOrder=2,maxWords=1024}={}){
  if(!G.nodes[body]||!G.nodes[exponent]||new Set([x1,x2,eta]).size!==3||[x1,x2,eta].some(x=>G.nodes[x]?.op!=='coordinate')||
    !Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||!Number.isSafeInteger(maxWords)||maxWords<1)
    fail('INVALID_INPUT','Use a retained monomial profile, exponent, three profile coordinates and a finite word budget.');
  if(G.freeCoordinates(exponent).size||[...G.freeCoordinates(body)].some(x=>![x1,x2,eta].includes(x)))fail('INVALID_INPUT','The exponent is a source constant and the profile has only its declared coordinates.');
  let wordCount=1,levelCount=1;
  for(let k=0;k<derivativeOrder;k++){levelCount*=4;wordCount+=levelCount;if(wordCount>maxWords)fail('RESOURCE_LIMIT','The exact physical derivative words exceed the declared finite representation budget.');}
  if(derivativeOrder>G.maxDerivativeOrder)fail('RESOURCE_LIMIT','The source graph derivative budget is insufficient.');
  const c=(n,d=1)=>G.q(n,d),h=G.parameter('h'),D=G.sub(c(1,2),h),d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(c(2),h,G.pow(eta,2)));
  const rows=[{word:[],body,exponent,loss:G.zero,derivativeOrder:0}];let frontier=rows.slice();
  for(let k=0;k<derivativeOrder;k++){
    const next=[];
    for(const r of frontier){
      const dx=G.derivative(r.body,x1),dy=G.derivative(r.body,x2),de=G.derivative(r.body,eta),transverse=G.add(G.mul(x1,dx),G.mul(x2,dy));
      const options=[
        ['x1',c(1,2),dx],['x2',c(1,2),dy],
        ['z',D,G.div(G.add(G.mul(c(2),eta,r.exponent,r.body),G.neg(G.mul(eta,transverse)),G.mul(d,de)),L)],
        ['t',G.one,G.div(G.add(G.neg(G.mul(r.exponent,r.body)),G.div(transverse,c(2)),G.mul(D,eta,de)),L)]
      ];
      for(const [direction,loss,value]of options)next.push({word:[...r.word,direction],body:value,exponent:G.sub(r.exponent,loss),loss:G.add(r.loss,loss),derivativeOrder:k+1});
    }
    rows.push(...next);frontier=next;
  }
  return {rows,derivativeOrder,profileCoordinates:[x1,x2,eta],initialExponent:exponent,
    lossProof:'Each x1/x2 differentiation loses 1/2, each z loses D=1/2-h, each t loses 1. Since 0<h<1/2, the loss of every length-m word is at most m, independently of the coefficient index.',
    earlierBoundsDifferentiated:false,sourceAuthenticated:false};
}

/** The full nonlinear residual difference is evaluated independently on
 * u+e and u. This verifies the finite-order bridge used in Lemma5.4. It
 * does not supply the unproved residual or the actual all-order tail.
 */
export function momentumDifferenceIdentity(){
  const G=new ActualConvergentExpressions(),jets=new Map(),labels=new Map(),derivativeCache=new Map(),directions=['x1','x2','z'];
  const jet=(name,orders=[0,0,0,0])=>{
    const key=name+':'+orders.join(':');if(jets.has(key))return jets.get(key);
    const id=G.fresh('difference_'+key);jets.set(key,id);labels.set(id,{name,orders});return id;
  };
  const derivative=(id,direction)=>{
    const key=id+':'+direction;if(derivativeCache.has(key))return derivativeCache.get(key);
    let out;
    if(labels.has(id)){const {name,orders}=labels.get(id),next=orders.slice();next[direction]++;out=jet(name,next);}
    else{
      const {op,args}=G.nodes[id];
      if(op==='add')out=G.add(...args.map(x=>derivative(x,direction)));
      else if(op==='multiply')out=G.add(G.mul(derivative(args[0],direction),args[1]),G.mul(args[0],derivative(args[1],direction)));
      else if(op==='integer_power')out=G.mul(G.q(args[1]),G.pow(args[0],args[1]-1),derivative(args[0],direction));
      else if(op==='inverse')out=G.neg(G.mul(G.pow(args[0],-2),derivative(args[0],direction)));
      else if(op==='rational'||op==='source_parameter')out=G.zero;
      else fail('UNSUPPORTED','Every formal momentum jet must be declared before differentiation.');
    }
    derivativeCache.set(key,out);return out;
  };
  const operators=Object.fromEntries([...directions,'t'].map((name,j)=>[name,f=>derivative(f,j)])),
    u=Array.from({length:3},(_,j)=>jet('u'+j)),e=Array.from({length:3},(_,j)=>jet('e'+j)),p=jet('p'),pi=jet('pi'),
    r=Array.from({length:3},(_,j)=>jet('stressDivergence'+j)),s=Array.from({length:3},(_,j)=>jet('stressDifferenceDivergence'+j)),
    sum=directCartesianMomentum(G,{velocity:u.map((v,j)=>G.add(v,e[j])),pressure:G.add(p,pi),operators,stressDivergence:r.map((v,j)=>G.add(v,s[j]))}),
    old=directCartesianMomentum(G,{velocity:u,pressure:p,operators,stressDivergence:r});
  const expected=e.map((f,j)=>G.add(operators.t(f),G.neg(G.add(...directions.map(k=>operators[k](operators[k](f))))),operators[directions[j]](pi),s[j],
    ...directions.map((k,i)=>G.mul(u[i],operators[k](f))),...directions.map((k,i)=>G.mul(e[i],operators[k](u[j]))),...directions.map((k,i)=>G.mul(e[i],operators[k](f)))));
  const checks=expected.map((body,j)=>sourceGraphRationalIdentity(G,G.sub(G.sub(sum.values[j],old.values[j]),body))),
    omittedQuadratic=sourceGraphRationalIdentity(G,G.add(G.sub(G.sub(sum.values[0],old.values[0]),expected[0]),...directions.map((k,i)=>G.mul(e[i],operators[k](e[0])))));
  if(!checks.every(c=>c.pass)||omittedQuadratic.pass)fail('INTERNAL_VALIDATION','The nonlinear residual difference or its quadratic negative control failed.');
  return {schema:'MathScope.PhysicalMomentumDifferenceIdentity/1',checks,omittedQuadratic,pass:true,
    exactIdentity:'F(u+e,p+pi,T+S)-F(u,p,T)=e_t-Delta(e)+grad(pi)+div(S)+(u.grad)e+(e.grad)u+(e.grad)e',
    requiredDerivativeOrders:{velocity:2,pressure:1,stress:1},polynomialDegree:2,independentFormalJetCount:jets.size,allSmoothJetsAreIndependent:true,
    sourceAuthenticated:false,actualInfiniteTailCertified:false};
}
