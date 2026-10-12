/** Exact finite calculus behind the original shifted radial inverse.
 *
 * These are conditional operator estimates. A private source adapter must
 * supply the original geometry, cutoff, smooth zero extension and input
 * seminorms. A finite coefficient array cannot authenticate those inputs.
 */
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  root=(G,x)=>Number.isSafeInteger(x)&&!!G?.nodes?.[x],
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  sum=a=>a.reduce((s,n)=>s+n,0);
export const radialFactorial=n=>{natural(n,'Factorial order');let x=1n;for(let k=2;k<=n;k++)x*=BigInt(k);return x;};
export const radialBinomial=(n,k)=>{
  natural(n,'Binomial order');natural(k,'Binomial index');if(k>n)return 0n;
  k=Math.min(k,n-k);let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;
};

export function originalRadialClassDerivativeDemand(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['outputOrder','ibpOrder'].includes(k)))
    fail('Select finite output and integration-by-parts orders only.');
  const m=natural(input.outputOrder??0,'Output order'),p=natural(input.ibpOrder??1,'Integration-by-parts order');
  if(p<1||!Number.isSafeInteger(m+2*p+3))fail('Retain a positive finite integration-by-parts order and its complete input demand.','RESOURCE_LIMIT');
  return {outputOrder:m,ibpOrder:p,primitiveInputOrder:m,cutoffInputOrder:m+1,
    extraRadialOrder:p,extraTorusOrder:p+3,flatRemainderInputOrder:m+2*p+3,
    coordinates:['R','Z','T','y0','y1'],
    primitiveRule:'At fixed u, D_(U,Z,T,y) differentiates F(U+u,y+M*u*v_r) without differentiating the fixed M or acquiring a factor M.',
    remainderRule:'For |I|<=m, retain I_R+p radial and |I_y|+p+3 torus derivatives, together with I_Z,I_T. A sufficient total source order is m+2p+3.',
    slowDerivativesOfZeroMomentRequired:true,zeroModeInverted:false,sourceAuthenticated:false};
}

/** Partial exponential Bell polynomials with every positive term retained.
 * B_(n,k)=sum_a binom(n-1,a-1) r_a B_(n-a,k-1).
 * A bound r_a for each actual inner derivative yields a bound for every
 * scalar composition derivative, including mixed derivatives of f that
 * commute with this one-coordinate change of variables.
 */
export function radialBellMajorants(G,{derivatives,order,maxWork=100000}={}){
  natural(order,'Bell order');natural(maxWork,'Bell work budget');
  if(!Array.isArray(derivatives)||derivatives.length<order+1||derivatives.some(x=>!root(G,x)))
    fail('Keep one exact root for every required inner derivative.');
  if(BigInt(order+1)**3n>BigInt(maxWork)*6n)fail('The complete Bell recurrence exceeds its declared budget.','RESOURCE_LIMIT');
  const rows=[],table=Array.from({length:order+1},()=>Array(order+1).fill(G.zero));table[0][0]=G.one;let work=0;
  for(let n=0;n<=order;n++)for(let k=0;k<=n;k++){
    const terms=[];
    if(n>0&&k>0)for(let a=1;a<=n-k+1;a++){
      if(++work>maxWork)fail('No Bell term may be omitted at the representation limit.','RESOURCE_LIMIT');
      terms.push({innerOrder:a,previous:[n-a,k-1],binomial:String(radialBinomial(n-1,a-1)),
        value:G.mul(G.q(radialBinomial(n-1,a-1)),derivatives[a],table[n-a][k-1])});
    }
    if(n>0)table[n][k]=G.add(...terms.map(t=>t.value));
    rows.push({order:n,outerDerivativeOrder:k,terms,value:table[n][k]});
  }
  const totals=table.map((r,n)=>G.add(...r.slice(0,n+1)));
  return {schema:'MathScope.N6.ExactRadialBellMajorants/1',order,derivatives:[...derivatives],rows,table,totals,work,
    recurrence:'B_0,0=1; B_n,0=0 for n>0; B_n,k=sum_(a=1..n-k+1) binom(n-1,a-1)*r_a*B_(n-a,k-1).',
    inputDerivativeBoundsArePremises:true,allPositiveCompositionTermsRetained:true,sourceAuthenticated:false};
}

/** On R,U in[B^-1,B], 1<d_r<4 and e=0,1,2, these falling products
 * bound the actual R(U), U(R), R^-e and R^e/(d_r R^(d_r-1)) derivatives.
 * No rapidly varying M occurs in the change-of-variable constants.
 */
export function radialChangeOfVariablesMajorants(G,{order,radiusBase:B,dr,maxWork=100000}={}){
  natural(order,'Radial change order');natural(maxWork,'Radial change budget');
  if(!root(G,B)||!root(G,dr)||BigInt(order+1)**3n>BigInt(maxWork)*3n)
    fail('The exact radial change and every requested derivative must fit the declared budget.','RESOURCE_LIMIT');
  const q=(n,d=1)=>G.q(n,d),R=G.fresh('radial_class_change_R'),U=G.fresh('radial_class_change_U'),
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),inverseExponent=G.inv(dr),inverseBody=power(U,inverseExponent),directBody=power(R,dr),
    falling=(a,n)=>G.mul(...Array.from({length:n},(_,j)=>G.sub(a,q(j)))),
    derivative=(body,x,a,n)=>G.mul(body,G.pow(x,-n),falling(a,n)),
    inverseRows=Array.from({length:order+1},(_,n)=>({order:n,actualDerivative:derivative(inverseBody,U,inverseExponent,n),
      bound:G.mul(q(radialFactorial(n)),G.pow(B,n+1))})),
    directRows=Array.from({length:order+1},(_,n)=>({order:n,actualDerivative:derivative(directBody,R,dr,n),
      bound:G.mul(q(radialFactorial(n+4)),G.pow(B,n+4))})),
    inverseBell=radialBellMajorants(G,{derivatives:inverseRows.map(r=>r.bound),order,maxWork}),
    directBell=radialBellMajorants(G,{derivatives:directRows.map(r=>r.bound),order,maxWork}),
    exponents=[0,1,2].map(e=>{
      const sourceExponent=G.sub(G.div(q(e+1),dr),G.one),sourceBody=G.div(power(U,sourceExponent),dr),outputBody=G.pow(R,-e),
        sourceRows=Array.from({length:order+1},(_,n)=>({order:n,actualDerivative:derivative(sourceBody,U,sourceExponent,n),
          bound:G.mul(q(radialFactorial(n+2)),G.pow(B,n+2))})),
        outputRows=Array.from({length:order+1},(_,n)=>({order:n,actualDerivative:derivative(outputBody,R,q(-e),n),
          bound:G.mul(q(radialFactorial(n+2)),G.pow(B,n+2))})),
        transformedSource=Array.from({length:order+1},(_,n)=>{
          const terms=Array.from({length:n+1},(_,a)=>({prefactorOrder:a,compositionOrder:n-a,
            binomial:String(radialBinomial(n,a)),value:G.mul(q(radialBinomial(n,a)),sourceRows[a].bound,inverseBell.totals[n-a])}));
          return {order:n,terms,value:G.add(...terms.map(t=>t.value))};
        }),throughOrder=Array.from({length:order+1},(_,n)=>({order:n,
          transformedSource:G.maximum(G.one,...transformedSource.slice(0,n+1).map(r=>r.value)),
          outputPrefactor:G.maximum(G.one,...outputRows.slice(0,n+1).map(r=>r.bound)),
          outputComposition:G.maximum(G.one,...directBell.totals.slice(0,n+1))}));
      return {e,sourceExponent,sourceBody,outputBody,sourceRows,outputRows,transformedSource,throughOrder};
    });
  return {schema:'MathScope.N6.RadialPowerChangeMajorants/1',order,R,U,B,dr,inverseExponent,inverseBody,directBody,
    inverseRows,directRows,inverseBell,directBell,exponents,
    exactDerivativeRule:'D_x^n x^a=x^(a-n)*product_(j=0..n-1)(a-j), with x>0 and the fixed exponent held constant.',
    proofs:[
      'R(U)=U^(1/d_r), 1/4<1/d_r<1. Its nth falling product has magnitude <=n!, and R(U)*U^(-n)<=B^(n+1).',
      'For U(R)=R^d_r and 1<d_r<4, each falling-product factor is <=j+4. The displayed (n+4)! B^(n+4) is an upper bound.',
      'For e=0,1,2, the source prefactor exponent (e+1)/d_r-1 lies in(-3/4,2). Its magnitude and every fixed derivative are bounded by (n+2)! B^(n+2).',
      'The same conservative bound covers R^-e and all its derivatives. The Bell and binomial rows retain all source and outer-coordinate product terms.',
      'Z,T,y derivatives commute with this fixed radial change. Taking the maximum through n bounds every mixed derivative with total order <=n.'
    ],requiredPositivePremises:['B>=2','B^-1<=R,U<=B','1<d_r<4'],sourceAuthenticated:false};
}

export function gaussianRadialPrimitiveMajorant(G,{a,pole=0,maxWork=100000}={}){
  natural(pole,'Gaussian pole');natural(maxWork,'Gaussian work budget');
  if(!root(G,a)||pole+1>maxWork)fail('Retain the positive exponent and the entire Gaussian recurrence.','RESOURCE_LIMIT');
  if(G.isq(a)&&G.fraction(a)[0]<=0n)fail('A Gaussian exponent must be strictly positive.');
  const p=Math.max(0,pole-2),base=G.add(G.one,G.inv(a)),rows=[];
  for(let n=0;n<=p;n++){
    const integerLeft=n<2?1n:1n+BigInt(n-1)*radialFactorial(n-1),integerRight=radialFactorial(n+1);
    rows.push({power:n,coefficient:G.mul(G.q(integerRight),G.pow(base,n+2)),
      gaussianMomentPower:Math.max(n-1,0),
      recurrence:n<2?'J0<=exp(-a*w²)/(2*a*w); J1=exp(-a*w²)/(2*a)':
        'Jn=w^(n-1)*exp(-a*w²)/(2*a)+(n-1)*J_(n-2)/(2*a)',
      positiveCoefficientCheck:{left:String(integerLeft),right:String(integerRight),pass:integerLeft<=integerRight}});
  }
  return {schema:'MathScope.N6.GaussianRadialPrimitiveOperatorMajorant/1',a,pole,gaussianMomentOrder:p,base,rows,constant:rows.at(-1).coefficient,
    estimate:'integral_(0,t) exp(-a/u²)*u^(-B) du <= constant*exp(-a/t²)*t^(-B), 0<t<=1, B=pole.',
    proof:['Put w=1/u. For w>=1, w^(B-2)<=w^max(0,B-2).',
      'With b=1+1/a>=1 and1/(2a)<=b, the displayed moment recurrence is bounded by (n+1)! b^(n+2) exp(-a*w²) w^max(n-1,0).',
      'The recorded integer inequality proves every induction step; max(n-1,0)<=B returns exactly the displayed endpoint weight.'],
    positiveExponentRequired:true,sourceAuthenticated:false,numericalQuadratureExecuted:false};
}

/** The half-line bounds are applied only where their cutoff factor or a
 * derivative of it can be nonzero. No weighted bound for A+ near the inner
 * edge, or A- near the outer edge, is asserted separately.
 */
export function radialGaussianWeightMajorants(G,{innerExponent:a,outerExponent:b,width,collar,radiusBase:B,pole=0,maxWork=100000}={}){
  natural(pole,'Weight pole');natural(maxWork,'Weight work budget');
  if([a,b,width,collar,B].some(x=>!root(G,x)))fail('Retain both Gaussian edges and the fixed positive radial geometry.');
  const inner=gaussianRadialPrimitiveMajorant(G,{a,pole,maxWork}),outer=gaussianRadialPrimitiveMajorant(G,{a:b,pole,maxWork}),
    n=Math.ceil(pole/2),q=(x,d=1)=>G.q(x,d),
    absorptionAt=x=>G.add(G.one,G.mul(q(radialFactorial(n)),G.pow(G.add(G.one,G.inv(x)),n))),
    gaussianAbsorption=G.add(G.one,absorptionAt(a),absorptionAt(b)),
    middleZetaInverse=G.exp(G.div(G.add(a,b),G.pow(collar,2))),
    complementaryRatio=G.exp(G.div(G.add(a,b),G.pow(G.sub(width,collar),2))),
    lengthAndLogJacobian=G.mul(q(2),B),
    innerConstant=G.mul(lengthAndLogJacobian,inner.constant,complementaryRatio),
    outerConstant=G.mul(lengthAndLogJacobian,outer.constant,complementaryRatio),
    middleConstant=G.mul(lengthAndLogJacobian,gaussianAbsorption,middleZetaInverse),
    supportedHalfLineConstant=G.maximum(innerConstant,outerConstant,middleConstant),
    wholeIntegralConstant=G.mul(lengthAndLogJacobian,gaussianAbsorption);
  return {schema:'MathScope.N6.TwoEdgeRadialWeightMajorants/1',a,b,width,collar,B,pole,inner,outer,
    absorptionPower:n,gaussianAbsorption,middleZetaInverse,complementaryRatio,lengthAndLogJacobian,
    innerConstant,outerConstant,middleConstant,supportedHalfLineConstant,wholeIntegralConstant,
    weight:'zeta=exp(-a/da²-b/db²), delta=min(1,da,db), da+db=width.',
    proofs:[
      'delta^(-B)<=1+da^(-B)+db^(-B). For v=1/d>1, use exp(a*v²)>=(a*v²)^ceil(B/2)/ceil(B/2)!; for v<=1 use v^B<=1. This gives the recorded global absorption constant.',
      'On da<collar<min(1,width/4), delta=da. At fixed s, dU=(d_r/2)*U*d(da)<=2B*d(da). The opposite-edge ratio is bounded by complementaryRatio, so the left Gaussian primitive has the displayed endpoint weight.',
      'The same argument with db and the backward half-line bounds the outer collar.',
      'In the middle both logarithmic distances are >=collar, hence zeta^(-1)<=middleZetaInverse. The full supported U interval has length<=2B.',
      'chi_m=0 on the inner collar and1 on the outer collar, with every positive cutoff derivative zero there. Thus each differentiated supported half-line product uses precisely one of these valid three bounds.',
      'The weighted moment is not needed for T_e support or its M_alpha estimate; it is needed only for the flat A_e remainder.'
    ],requiredPremises:['0<collar<min(1,width/4)','a,b>0','1<d_r<4','B>=2 and the full source R,U envelope lies in[B^-1,B]',
      'the actual cutoff is0/1 on the corresponding collars','the input and every required derivative have the displayed smooth zero extension'],
    sourceAuthenticated:false};
}

/** Retain the exact fixed-shift integrands, derivative identity and ALL
 * finite-interval endpoint terms. Compact source endpoints may be reduced
 * only by a separate source support proof. This small calculus kernel is
 * also executable on independent polynomial Fourier fixtures.
 */
export function exactFixedShiftRadialCalculus(G,{body:F,U,u,Y,slow=[],M,vr,chi,span,maxTerms=100000}={}){
  if([F,U,u,M,chi,span,...(Y??[]),...(vr??[]),...slow].some(x=>!root(G,x))||
    !Array.isArray(Y)||Y.length!==2||!Array.isArray(vr)||vr.length!==2||
    [U,u,...Y,...slow].some(x=>G.nodes[x]?.op!=='coordinate')||new Set([U,u,...Y,...slow]).size!==4+slow.length)
    fail('Retain independent radial, integration, slow and two-torus coordinates and the complete scalar body.');
  const changing=[U,u,...Y,...slow];
  if(G.dependsOn(F,u)||Y.some(y=>G.dependsOn(chi,y))||G.dependsOn(chi,u)||
    [M,span,...vr].some(x=>changing.some(v=>G.dependsOn(x,v))))
    fail('The fixed-shift proof freezes M, its direction and endpoints before every requested coefficient derivative.');
  const shiftedY=Y.map((y,j)=>G.add(y,G.mul(M,u,vr[j]))),
    shifted=G.simultaneousSubstitute(F,[U,...Y],[G.add(U,u),...shiftedY]),
    L=f=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(f,y)))),
    transport=f=>G.add(G.derivative(f,U),G.mul(M,L(f))),
    directIntegrand=transport(shifted),uDerivative=G.derivative(shifted,u),
    verify=createFactoredRationalVerifier(G,{maxTerms}),integrandIdentity=verify(G.sub(directIntegrand,uDerivative));
  if(!integrandIdentity.pass)fail('The complete fixed-shift chain identity did not verify.','INVALID_SOURCE_CONSTRUCTION');
  const minus=G.integral(shifted,u,G.neg(span),G.zero),plus=G.integral(shifted,u,G.zero,span),whole=G.add(minus,plus),
    atZero=G.substitute(shifted,u,G.zero),atMinus=G.substitute(shifted,u,G.neg(span)),atPlus=G.substitute(shifted,u,span),
    leftFTC=G.sub(atZero,atMinus),rightFTC=G.sub(atPlus,atZero),
    compact=G.sub(G.mul(G.sub(G.one,chi),minus),G.mul(chi,plus)),
    differentiated=G.sub(G.sub(G.mul(G.sub(G.one,chi),leftFTC),G.mul(chi,rightFTC)),G.mul(G.derivative(chi,U),whole)),
    cutoffRemainder=G.mul(G.derivative(chi,U),whole),
    rawEndpoints=G.add(G.mul(G.sub(G.one,chi),atMinus),G.mul(chi,atPlus)),
    expected=G.sub(G.sub(atZero,cutoffRemainder),rawEndpoints),
    productIdentity=verify(G.sub(differentiated,expected));
  if(!productIdentity.pass)fail('A full half-line cutoff product or endpoint was lost.','INVALID_SOURCE_CONSTRUCTION');
  return {schema:'MathScope.N6.ExactFixedShiftRadialCalculus/1',input:{body:F,U,u,Y:[...Y],slow:[...slow],M,vr:[...vr],chi,span},
    shiftedY,shifted,directIntegrand,uDerivative,integrandIdentity,minus,plus,whole,compact,
    endpoints:{atZero,atMinus,atPlus,leftFTC,rightFTC,rawEndpoints},differentiated,cutoffRemainder,expected,productIdentity,
    beforeFTC:{minus:transport(minus),plus:transport(plus),compact:transport(compact)},
    exactFTC:'The verified (partial_U+M*L) integrand equals partial_u integrand. FTC gives F(U,y)-F(U-D,y-MD v_r) and F(U+D,y+MD v_r)-F(U,y).',
    sourceZeroEndpointReductionApplied:false,zeroModeAssumedZero:false,sourceAuthenticated:false};
}
