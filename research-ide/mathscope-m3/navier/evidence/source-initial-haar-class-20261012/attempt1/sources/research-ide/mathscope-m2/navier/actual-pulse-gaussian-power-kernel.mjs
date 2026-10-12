/** Finite derivative bounds for the original homogeneous pulse.
 * This is scalar/matrix calculus until a private source adapter binds the
 * primitive bounds. No exponentially growing norm estimate in k or L is
 * used for the normalized solution w.
 */
import {factorial,fail} from './actual-continuation-arithmetic.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';

const binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const logReserve=n=>{if(n<=1n)return 0;return (n-1n).toString(2).length;};
const sumPowers=xs=>{const a=xs.filter(x=>x!==null);return a.length?Math.max(...a)+logReserve(BigInt(a.length)):null;};
const productPower=(a,b)=>a===null||b===null?null:a+b;

/** The jth entry bounds an ordinary jth v derivative by B^entry.
 * null is an identically zero derivative. Binomial coefficients, matrix
 * dimensions and every quotient denominator are retained in the ledger.
 */
class JetPowers {
  constructor(order){this.order=order;this.rows=[];}
  put(label,powers,rule,inputs=[],extra={}){
    if(powers.length!==this.order+1||powers.some(x=>x!==null&&(!Number.isSafeInteger(x)||x<0)))fail('INTERNAL_VALIDATION','Invalid finite pulse derivative power.');
    const r={label,powers,rule,inputs,...extra};this.rows.push(r);return r;
  }
  constant(label,power){return this.put(label,[power,...Array(this.order).fill(null)],'v-independent source operand');}
  affine(label,value,first){return this.put(label,[value,...(this.order?[first,...Array(this.order-1).fill(null)]:[])],'affine in v; every derivative of order at least two is zero');}
  add(label,...a){return this.put(label,Array.from({length:this.order+1},(_,j)=>sumPowers(a.map(x=>x.powers[j]))),'triangle inequality, including finite sum count',a.map(x=>x.label));}
  multiply(label,a,b){
    return this.put(label,Array.from({length:this.order+1},(_,m)=>sumPowers(Array.from({length:m+1},(_,j)=>{
      const p=productPower(a.powers[j],b.powers[m-j]);return p===null?null:p+logReserve(binomial(m,j));
    }))), 'ordinary Leibniz rule with every binomial coefficient', [a.label,b.label]);
  }
  inverse(label,a,lowerPower){
    if(!Number.isSafeInteger(lowerPower)||lowerPower<0)fail('INVALID_INPUT','The denominator lower bound must be explicit.');
    const values=[lowerPower];
    for(let m=1;m<=this.order;m++){
      const inner=sumPowers(Array.from({length:m},(_,offset)=>{const j=offset+1,p=productPower(a.powers[j],values[m-j]);return p===null?null:p+logReserve(binomial(m,j));}));
      values.push(inner===null?null:lowerPower+inner);
    }
    return this.put(label,values,'differentiate a*(1/a)=1; divide by the unchanged positive absolute lower bound',[a.label],{absoluteLower:'B^(-'+lowerPower+')',lowerPower});
  }
  sqrt(label,a,sqrtLowerPower){
    const values=[Math.ceil(a.powers[0]/2)];
    for(let m=1;m<=this.order;m++){
      const inner=[a.powers[m],...Array.from({length:m-1},(_,offset)=>{const j=offset+1,p=productPower(values[j],values[m-j]);return p===null?null:p+logReserve(binomial(m,j));})],numerator=sumPowers(inner);
      // 1/(2*sqrt(a)) <= B^sqrtLowerPower; retain rather than consume 1/2.
      values.push(numerator===null?null:numerator+sqrtLowerPower);
    }
    return this.put(label,values,'differentiate sqrt(a)^2=a; retain all middle products and the positive square-root lower bound',[a.label],{positiveRootLower:'B^(-'+sqrtLowerPower+')',sqrtLowerPower});
  }
  derivative(label,a){return this.put(label,[...a.powers.slice(1),null],'one derivative shift; last entry is unused in the truncated downstream calculation',[a.label],{lastEntryNotAnActualZeroClaim:true});}
}

export function homogeneousPulseGaussianPowerAudit({order=2,maxWork=20000}={}){
  if(!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxWork)||maxWork<1)fail('INVALID_INPUT','Use a nonnegative finite derivative order and positive work budget.');
  if((order+3)**3>maxWork)fail('RESOURCE_LIMIT','The requested pulse derivative ledger exceeds its finite work budget.');
  // B' occurs in the actual coefficient matrix. Build one additional jet,
  // and consume M only through order-1 in the ODE recurrence below.
  const a=new JetPowers(order+1),zero=a.constant('zero',null),one=a.constant('one',0),two=a.constant('two',1),
    F=a.constant('original F',1),FR=a.constant('original F_R',1),GR=a.constant('original G_R',1),R=a.constant('original R',1),
    c0=a.constant('original c0',1),lambda0=a.constant('original lambda0',1),epsilonK2=a.constant('epsilon*k^2',1),
    n=Array.from({length:3},(_,i)=>a.affine('original n_'+i,4,12)),sr=a.affine('original signed reference s',2,2),
    rfrozenInv3=a.constant('(sqrt(1+u^2))^(-3)',0);
  const add=(label,...xs)=>a.add(label,...xs),mul=(label,x,y)=>a.multiply(label,x,y),
    dot=(label,x,y)=>add(label,...x.map((v,i)=>mul(label+' product '+i,v,y[i]))),
    mm=(label,A,B)=>A.map((row,i)=>B[0].map((_,j)=>add(label+' '+i+j,...row.map((v,k)=>mul(label+' '+i+j+' product '+k,v,B[k][j])))));
  const nPrime=n.map((x,i)=>a.derivative('original n_prime_'+i,x)),nSquared=dot('original |n|^2',n,n),invN2=a.inverse('original 1/|n|^2',nSquared,4),
    ntSquared=add('original |n_tan|^2',mul('n_theta squared',n[1],n[1]),mul('n_z squared',n[2],n[2])),nt=a.sqrt('original |n_tan|',ntSquared,2),invNt=a.inverse('original 1/|n_tan|',nt,2),
    Ka=[1,2].map((j,i)=>mul('original K_a_'+i,n[j],invNt)),Na=[Ka[1],Ka[0]],sa=mul('original s_a',n[0],invNt),
    K=[[zero,mul('K_rtheta',two,F),zero],[add('K_thetar',mul('2F',two,F),mul('R*F_R',R,FR)),zero,zero],[GR,zero,zero]],
    numerator=[0,1,2].map(j=>add('original pressure numerator '+j,dot('nTK '+j,n,K.map(row=>row[j])),nPrime[j])),
    Aphi=K.map((row,i)=>row.map((x,j)=>add('actual Aphi '+i+j,x,mul('Aphi rank '+i+j,mul('n pressure '+i+j,n[i],numerator[j]),invN2)))),
    srSquared=mul('reference s squared',sr,sr),onePlus=add('one plus reference s squared',one,srSquared),root=a.sqrt('reference sqrt',onePlus,0),
    c=mul('original c0 reference sqrt',c0,root),invC=a.inverse('original 1/(c0 reference sqrt)',c,1),
    U=[[one,zero],[mul('U theta first',sa,Ka[0]),Na[0]],[mul('U z first',sa,Ka[1]),Na[1]]],
    J=[[one,one],[c,c]],Jinverse=[[one,invC],[one,invC]],Uleft=[[one,zero,zero],[zero,Na[0],Na[1]]],
    B=mm('original B',U,J),Bleft=mm('original Bleft',Jinverse,Uleft),Bprime=B.map((row,i)=>row.map((x,j)=>a.derivative('original Bprime '+i+j,x))),
    AphiB=mm('Aphi B',Aphi,B),difference=AphiB.map((row,i)=>row.map((x,j)=>add('Aphi B minus Bprime '+i+j,x,Bprime[i][j]))),projected=mm('original projected matrix',Bleft,difference),
    lambda=mul('original lambda',lambda0,a.inverse('reference inverse sqrt',root,0)),dref=mul('original dref',mul('lambda0 times one plus s squared',lambda0,onePlus),rfrozenInv3),
    d=mul('original d',epsilonK2,nSquared),rho=add('original log P derivative',lambda,dref),
    M=projected.map((row,i)=>row.map((x,j)=>i===j?add('actual wMatrix '+i+j,x,lambda,d,dref):x));
  const matrixNormPowers=Array.from({length:order+1},(_,j)=>Math.max(...M.map(row=>sumPowers(row.map(x=>x.powers[j]))??0))),
    frameNormPowers=Array.from({length:order+1},(_,j)=>Math.max(...B.map(row=>sumPowers(row.map(x=>x.powers[j]))??0)));
  const w=[0],P=[0];
  for(let m=0;m<order;m++){
    w.push(sumPowers(Array.from({length:m+1},(_,j)=>matrixNormPowers[j]+w[m-j]+logReserve(binomial(m,j)))));
    P.push(sumPowers(Array.from({length:m+1},(_,j)=>rho.powers[j]+P[m-j]+logReserve(binomial(m,j)))));
  }
  const Pw=Array.from({length:order+1},(_,m)=>sumPowers(Array.from({length:m+1},(_,j)=>P[j]+w[m-j]+logReserve(binomial(m,j))))),
    t=Array.from({length:order+1},(_,m)=>sumPowers(Array.from({length:m+1},(_,j)=>frameNormPowers[j]+Pw[m-j]+logReserve(binomial(m,j)))));
  if(![...matrixNormPowers,...frameNormPowers,...w,...P,...t].every(Number.isSafeInteger))fail('INTERNAL_VALIDATION','The finite derivative recurrence exceeded the exact power ledger.');
  return {schema:'MathScope.HomogeneousPulseGaussianPowerAudit/1',order,baseLower:'B>=2^128',rows:a.rows,
    sourcePremises:{values:'|F|,|F_R|,|G_R|,R,|c0|,lambda0<=B; 1<=epsilon*k^2<=4<=B; |n_j|<=B^4; |n_j_prime|<=B^12/S<=B^12; higher n derivatives vanish at fixed slow coordinates.',
      reference:'u>=2, |s|<=3u/2<=B^2, |s_prime|=u/L<=B^2 and higher derivatives vanish; L>=1; (sqrt(1+u^2))^-3<=1.',
      lowerBounds:'|n_tan|>=B^-2, |n|>=B^-2, |c0|>=B^-1, sqrt(1+s^2)>=1. Thus every displayed reciprocal and square-root lower bound is uniform.',
      normalizedMatrix:'M=diag(0,-2*lambda)+E_actual-(d-dref)I, lambda>0, |E_actual_ij|<=E/S, |d-dref|<=Ed/S.',
      initial:'The exact original w(0)=(1,0); P is independent of slow variables within a fixed representative and P_prime=(lambda-dref)*P.'},
    solution:{logarithmicInfinityNorm:'mu_infinity(M)<= (2E+Ed)/S',normalizedBound:'||w(v)||_infinity<=W=exp((2E+Ed)*Lmax), 0<=v<=L<=Lmax*S',
      stablePropagator:'||V_w(v,u)||_infinity<=exp((2E+Ed)*Lmax) for 0<=u<=v<=L',
      proof:'For row 1 use E11-(d-dref)+|E12|; for row 2 use -2lambda+E22-(d-dref)+|E21|. Dropping only the nonpositive -2lambda gives the same bound. Integrate the upper right Dini derivative of the infinity norm. This is independent of k, L and the displayed Volterra partial sum.',
      derivatives:'w_(m+1)=sum_(j=0)^m binom(m,j) M_(j) w_(m-j); P_(m+1)=sum_(j=0)^m binom(m,j) rho_(j) P_(m-j); t=B*P*w by ordinary Leibniz.'},
    powers:{matrix:matrixNormPowers,frame:frameNormPowers,w,P,Pw,t},
    estimate:'||D_v^j t||_infinity <= B^(powers.t[j])*exp((2E+Ed)*Lmax)*P(v)',
    signsDroppedOnlyForAbsoluteBounds:true,ordinaryDerivativeBinomialsRetained:true,allFiniteOrdersUseSameSourceThreshold:true,
    sourceAuthenticated:false,actualSlowDerivativeBoundsProduced:false,actualPhysicalDerivativeBoundsProduced:false,pass:true};
}

/** Bind the stable normalization to retained matrix and integral bodies.
 * In particular the dissipative -2lambda entry is not replaced by an
 * absolute value inside a Gronwall exponent.
 */
export function normalizedHomogeneousPulseBinding(G,input={},context={}){
  const keys=['v','length','lambda','dref','damping','projected','error','matrix','P','initial'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k))||keys.some(k=>input[k]===undefined))fail('INVALID_INPUT','Retain every original normalized equation operand.');
  const {v,length,lambda,dref,damping,projected,error,matrix,P,initial}=input,
    valid=x=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x],matrixOK=A=>Array.isArray(A)&&A.length===2&&A.every(row=>Array.isArray(row)&&row.length===2&&row.every(valid));
  if(![v,length,lambda,dref,damping,P].every(valid)||G.nodes[v].op!=='coordinate'||![projected,error,matrix].every(matrixOK)||JSON.stringify(initial)!==JSON.stringify([G.one,G.zero]))fail('INVALID_INPUT','Use the original two-dimensional homogeneous initial value problem.');
  const same=(x,y,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(x,y),{maxTerms:100000,atomicNodes}),
    delta=G.sub(damping,dref),diagonal=[[lambda,G.zero],[G.zero,G.neg(lambda)]],
    stableDiagonal=[[G.zero,G.zero],[G.zero,G.mul(G.q(-2),lambda)]],checks=[];
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    context.onProgress?.({stage:'gaussian-stable-entry-'+i+j,nodeCount:G.nodes.length});
    // The source defines error=projected-diagonal; in this orientation the
    // retained projected entry is a legitimate opaque common operand. An
    // independent fixture may instead define projected=diagonal+error. In
    // that orientation retain its arithmetic rather than hiding a sum.
    const exactSourceErrorBody=error[i][j]===G.sub(projected[i][j],diagonal[i][j]),
      atoms=[lambda,dref,damping,...(exactSourceErrorBody?[projected[i][j]]:[])];
    checks.push({id:'projected-error-'+i+j,...same(projected[i][j],G.add(diagonal[i][j],error[i][j]),atoms)});
    checks.push({id:'stable-normalized-matrix-'+i+j,...same(matrix[i][j],G.sub(G.add(stableDiagonal[i][j],error[i][j]),i===j?delta:G.zero),atoms)});
  }
  const exp=G.nodes[P],logP=exp.op==='exp'?exp.args[0]:-1,integral=G.nodes[logP];
  if(!integral||integral.op!=='definite_integral')fail('INVALID_SOURCE_CONSTRUCTION','The original Gaussian envelope must retain its integral of lambda-dref.');
  const [body,time,left,right]=integral.args,rho=G.sub(lambda,dref);
  context.onProgress?.({stage:'gaussian-original-envelope-FTC-start',nodeCount:G.nodes.length});
  checks.push({id:'original-envelope-integrand',...same(body,G.substitute(rho,v,time))},
    {id:'original-envelope-midpoint',...same(left,G.div(length,G.q(2)))},
    {id:'original-envelope-upper',pass:right===v},
    {id:'original-envelope-FTC',...same(G.derivative(P,v),G.mul(P,rho))});
  context.onProgress?.({stage:'gaussian-original-envelope-FTC-done',nodeCount:G.nodes.length});
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual homogeneous pulse lost its stable matrix decomposition or original envelope.');
  return {schema:'MathScope.NormalizedHomogeneousPulseBinding/1',checks,logP,rho,delta,
    stableDiagonal,sourceAuthenticated:false,coefficientBoundsDerivedHere:false,pass:true};
}
