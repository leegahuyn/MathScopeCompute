/** Positive finite Taylor arithmetic. No source function is authenticated here.
 * A total jet is sum_{|alpha|<=n} sup |D^alpha f|/alpha!. The source producer
 * supplies its actual positive denominators, branches and domains.
 */
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

export const chooseInteger=(n,k)=>k<0||k>n?0n:factorial(n)/(factorial(k)*factorial(n-k));
const order=(n)=>{if(!Number.isSafeInteger(n)||n<0)fail('INVALID_INPUT','Use a nonnegative finite Taylor order.');};

/** The equation w=A*t/(1-t)+(1+A)*w^2 majorizes the translated
 * implicit equation after removing its actual linear unknown term. If A
 * bounds the collapsed external/unknown Taylor coefficients AFTER applying
 * the actual Jacobian inverse, all remaining terms are bounded by
 * A*(1/((1-t)*(1-w))-1-w). Multiplication by (1-w) gives the displayed
 * quadratic exactly. This retains variable linear/quadratic coefficients,
 * t*w^j terms and all pure w^j terms, not only a constant quadratic.
 * The coefficient formula is valid at EVERY finite n; no old degree cap.
 */
export function implicitCatalanCoefficients(n){
  order(n);const rows=[];
  for(let m=1;m<=n;m++){
    const terms=[];
    for(let k=1;k<=m;k++)terms.push({aPower:k,onePlusAPower:k-1,
      coefficient:String(chooseInteger(2*k-2,k-1)/BigInt(k)*chooseInteger(m-1,k-1))});
    rows.push({order:m,terms});
  }
  return {order:n,equation:'w=A*t/(1-t)+(1+A)*w^2',constantUnknown:0,
    linearUnknownAlreadyInverted:true,rows};
}

/** d_X^r=X^-r product_(j=0)^(r-1)(D_y-j), y=log X.
 * Signs are removed only for the norm; all nonzero derivative terms remain.
 */
export function physicalXConversion(r,m){
  order(r);order(m);let p=[1n];
  for(let j=0;j<r;j++){
    const next=Array(p.length+1).fill(0n);
    for(let k=0;k<p.length;k++){next[k]+=BigInt(j)*p[k];next[k+1]+=p[k];}
    p=next;
  }
  const ordinaryCoefficient=p.reduce((a,c,k)=>a+c*factorial(k)*factorial(m),0n);
  return {radialOrder:r,etaOrder:m,unsignedCoefficients:p.map(String),
    ordinaryCoefficient:String(ordinaryCoefficient),
    identity:'d_X^r=X^-r*product_(j=0)^(r-1)(D_y-j)',
    includesAllLogDerivatives:true};
}

/** A graph ledger rather than an expanded polynomial: very large source
 * scales remain exact finite expressions. All rules below are positive.
 */
export class PositiveTaylorLedger {
  constructor(G,{checkCancelled}={}){this.G=G;this.rows=[];this.checkCancelled=checkCancelled;}
  record(label,n,rule,root,inputs=[],extra={}){
    this.checkCancelled?.();this.rows.push({label,order:n,rule,root,inputs,...extra});return root;
  }
  sum(label,n,...a){return this.record(label,n,'sum',this.G.add(...a),a);}
  product(label,n,...a){return this.record(label,n,'submultiplicative total Taylor product',this.G.mul(...a),a);}
  geometric(x,n){let s=this.G.one,p=this.G.one;for(let k=1;k<=n;k++){p=this.G.mul(p,x);s=this.G.add(s,p);}return s;}
  exponentialSeries(x,n){let s=this.G.one,p=this.G.one;for(let k=1;k<=n;k++){p=this.G.mul(p,x);s=this.G.add(s,this.G.mul(this.G.q(1,factorial(k)),p));}return s;}
  inverse(label,n,F,lower){
    const I=this.G.inv(lower),root=this.G.mul(I,this.geometric(this.G.mul(I,F),n));
    return this.record(label,n,'finite reciprocal Taylor series at actual positive value',root,[F,lower],{positiveValueLower:lower});
  }
  exponential(label,n,F,actualValueUpper=null){
    const value=actualValueUpper??this.G.exp(F),root=this.G.mul(value,this.exponentialSeries(F,n));
    return this.record(label,n,'finite exponential Taylor series',root,[F,value],{actualValueUpper:value,valueUpperDerivedFromNorm:actualValueUpper===null});
  }
  logarithm(label,n,F,lower){
    const I=this.G.inv(lower),x=this.G.mul(I,F);let root=this.G.add(F,I),p=this.G.one;
    for(let k=1;k<=n;k++){p=this.G.mul(p,x);root=this.G.add(root,this.G.mul(this.G.q(1,k),p));}
    return this.record(label,n,'log value <= F+1/lower and its finite Taylor series',root,[F,lower],{positiveValueLower:lower});
  }
  squareRoot(label,n,F,lower){
    const root=this.G.mul(this.G.sqrt(F),this.geometric(this.G.div(F,lower),n));
    return this.record(label,n,'positive square-root Taylor, |binom(1/2,k)|<=1',root,[F,lower],{positiveValueLower:lower});
  }
  compose(label,n,outerTotal,innerNonconstantSum){
    const root=this.G.mul(outerTotal,this.geometric(innerNonconstantSum,n));
    return this.record(label,n,'total-degree Taylor composition',root,[outerTotal,innerNonconstantSum]);
  }
  derivative(label,n,higher){return this.record(label,n,'one ordinary derivative: (n+1)*higher total jet',this.G.mul(this.G.q(n+1),higher),[higher],{requiredInputOrder:n+1});}
  prefix(label,n,F,length){
    return this.record(label,n,'parameter-independent endpoints; moving upper endpoint by FTC',this.G.mul(this.G.add(this.G.one,length),F),[F,length],{etaEndpointDependence:false});
  }
  implicit(label,n,F,inverseSlope,zerothUpper,dimension=1){
    const A=this.G.mul(this.G.q(dimension),F,inverseSlope),P=this.G.add(this.G.one,A),coefficients=implicitCatalanCoefficients(n);
    let root=zerothUpper;
    for(const row of coefficients.rows)for(const term of row.terms)root=this.G.add(root,this.G.mul(this.G.q(term.coefficient),this.G.pow(A,term.aPower),this.G.pow(P,term.onePlusAPower)));
    return this.record(label,n,'actual root implicit Catalan recurrence',root,[F,inverseSlope,zerothUpper],
      {dimension,actualLinearUnknownAlreadyInverted:true,positiveMajorantA:A,
        coefficientNormIncludesExternalAndUnknownVariables:true,
        untranslatedCoefficientBound:F,actualJacobianInverseNorm:inverseSlope,
        fullMixedMajorant:'A*(1/((1-t)*(1-w))-1-w)',
        fullMixedToQuadraticIdentity:'(1-w)*w=A*t/(1-t)+A*w^2',
        equation:coefficients.equation,coefficientFormula:'Cat(k-1)*binom(m-1,k-1)*A^k*(1+A)^(k-1)',
        finiteCoefficientCount:n*(n+1)/2,oldSmallDerivativeBoxUsed:false});
  }
}
