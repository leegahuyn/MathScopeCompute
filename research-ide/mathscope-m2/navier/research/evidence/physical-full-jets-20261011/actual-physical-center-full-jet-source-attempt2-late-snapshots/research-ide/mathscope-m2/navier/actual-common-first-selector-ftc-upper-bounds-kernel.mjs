/** Finite majorants for the ORIGINAL first diagonal FTC rows.  This file
 * has no private-source authority.  In particular an upper value is never
 * asserted equal to the original FTC integral or to its selected scale.
 */
import {actualNormCalculus} from './actual-residual-order-induction-norms.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const valid=n=>Number.isSafeInteger(n)&&n>=0;

export function firstSelectorCartesianRadialBound(G,get,{xOrder=0,yOrder=0,etaOrder=0,radius}={}){
  if(![xOrder,yOrder,etaOrder].every(valid)||!Number.isSafeInteger(radius)||!G.nodes[radius])fail('INVALID_INPUT','Use finite Cartesian orders and a positive radius root.');
  const q=(n,d=1)=>G.q(n,d),terms=[];
  // Exact chain rule for X=(y1^2+y2^2)/2, followed by absolute values.
  for(let a=0;a<=Math.floor(xOrder/2);a++)for(let b=0;b<=Math.floor(yOrder/2);b++){
    const cx=factorial(xOrder)/(factorial(a)*factorial(xOrder-2*a)*2n**BigInt(a)),cy=factorial(yOrder)/(factorial(b)*factorial(yOrder-2*b)*2n**BigInt(b));
    terms.push(G.mul(q(cx*cy),G.pow(radius,xOrder+yOrder-2*a-2*b),get(xOrder+yOrder-a-b,etaOrder)));
  }
  return G.add(...terms);
}

export function firstSelectorFTCUpperFaces(G,ftc,get){
  if(!ftc||!Array.isArray(ftc.coordinates)||!Array.isArray(ftc.faces)||ftc.faces.length!==2**ftc.coordinates.length||ftc.coordinates.length>3)
    fail('INVALID_INPUT','Retain all faces of an anchored FTC rectangle.');
  const dimensions=ftc.coordinates.length,rows=[];
  for(const face of ftc.faces){
    if(!valid(face.mask)||face.mask>=2**dimensions)fail('INVALID_SOURCE_CONSTRUCTION','An FTC face mask is invalid.');
    const derivatives=Array.from({length:dimensions},(_,j)=>(face.mask>>j)&1),selected=derivatives.flatMap((v,j)=>v?[j]:[]),
      lengths=selected.map(j=>G.sub(ftc.upper[j],ftc.lower[j])),volume=G.mul(...lengths),majorant=get(derivatives),upper=G.mul(volume,G.add(G.one,majorant));
    if(JSON.stringify(face.selectedCoordinates)!==JSON.stringify(selected.map(j=>ftc.coordinates[j])))fail('INVALID_SOURCE_CONSTRUCTION','The original FTC face coordinates changed.');
    rows.push({mask:face.mask,originalFaceUpper:face.upperBound,originalMixedDerivative:face.derivative,selectedCoordinates:face.selectedCoordinates,
      upper,integrandAbsoluteUpper:majorant,volume,lengths,inequality:'sqrt(1+f^2)<=1+M on this actual face; integrate over its original positive side lengths.'});
  }
  return {originalBound:ftc.bound,upperBound:G.add(...rows.map(r=>r.upper)),faces:rows,sourceAuthenticated:false};
}

/** Ordinary X/eta bounds for the literal n=1 residual and both signed
 * primitives.  Only the derivatives reached by m<=1 FTC are generated.
 * X=0 is not used in a stress denominator: the actual adapter must supply
 * its proved zero extension on X<Xminus.
 */
export function firstSelectorStressMajorants(G,{F0,U0,F1,U1,Pi1,Xupper,Xlower,h}){
  const q=(n,d=1)=>G.q(n,d),a=actualNormCalculus(G),{fn,constant:C,add,mul,scale,dx,de}=a,
    x=fn((r,k)=>k?G.zero:r===0?Xupper:r===1?G.one:G.zero),eta=fn((r,k)=>r?G.zero:k===0||k===1?G.one:G.zero),
    d=fn((r,k)=>r?G.zero:k===0?G.one:k===1||k===2?q(2):G.zero),invL=fn((r,k)=>r?G.zero:q(2n*factorial(k)*8n**BigInt(k))),
    // |A|,|D|<1 and all n=0,1 exponents, including the second Z,
    // have magnitude<4. These value bounds do not discard source h.
    Z=f=>mul(invL,add(scale(q(8),mul(eta,f)),scale(q(2),mul(eta,x,dx(f))),mul(d,de(f)))),
    T=f=>mul(invL,add(scale(q(4),f),mul(eta,de(f)),mul(x,dx(f)))),
    average=U=>fn((r,k)=>G.div(U.get(r,k),q(r+1))),
    velocity=(U,n)=>{const av=average(U);return mul(invL,add(scale(q(2),mul(eta,U)),scale(G.mul(q(2),G.add(G.one,G.mul(q(2*n),h))),mul(eta,av)),mul(d,de(av))));},
    v0=velocity(U0,0),v1=velocity(U1,1),angular=add(T(F1),mul(v0,add(mul(x,dx(F1)),F1)),mul(U0,Z(F1)),mul(v1,add(mul(x,dx(F0)),F0)),mul(U1,Z(F0)),scale(q(2),add(mul(x,dx(F1,2)),scale(q(2),dx(F1)))),Z(Z(F0))),
    axial=add(T(U1),mul(x,v0,dx(U1)),mul(U0,Z(U1)),mul(x,v1,dx(U0)),mul(U1,Z(U0)),Z(Pi1),scale(q(2),add(mul(x,dx(U1,2)),dx(U1))),Z(Z(U0))),
    angularDensity=scale(q(2),mul(x,angular)),primitive=density=>fn((r,k)=>r?density.get(r-1,k):G.mul(Xupper,density.get(0,k))),
    inverse2X=fn((r,k)=>k?G.zero:G.div(q(factorial(r),2),G.pow(Xlower,r+1))),
    inverseR=fn((r,k)=>k?G.zero:G.div(q(factorial(r)),G.mul(G.sqrt(G.mul(q(2),Xlower)),G.pow(Xlower,r)))),
    theta=mul(inverse2X,primitive(angularDensity)),z=mul(inverseR,primitive(axial));
  return {theta,z,angular,axial,v0,v1,average0:average(U0),average1:average(U1),invL,eta,d,
    sourceAuthenticated:false,rule:'Every original time, convection, pressure, radial viscosity and leading axial viscosity term is retained in absolute value. The primitive lowers a positive radial derivative by one; the zero-radial case uses the whole support length.'};
}

/** Finite flat Gaussian derivative recurrence, with a bound valid at
 * delta=0 by its actual flat extension.  No negative power is evaluated
 * at that endpoint.
 */
export function firstSelectorFlatGaussianBounds(order=4){
  if(!valid(order)||order>32)fail('RESOURCE_LIMIT','Use an explicitly budgeted finite flat Gaussian order.');
  let polynomial=new Map([[0,1n]]);const rows=[];
  for(let r=0;r<=order;r++){
    const terms=[...polynomial].filter(([,c])=>c),abs=c=>c<0n?-c:c,
      small=terms.reduce((s,[p,c])=>s+abs(c)*factorial(Math.ceil(Math.max(0,-p)/2)),0n),large=terms.reduce((s,[,c])=>s+abs(c),0n);
    rows.push({order:r,polynomial:terms.map(([p,c])=>[p,String(c)]),flatIntervalUpper:String(small),shiftedIntervalUpper:String(large)});
    const next=new Map(),put=(p,c)=>next.set(p,(next.get(p)??0n)+c);
    for(const [p,c]of polynomial){if(p)put(p-1,BigInt(p)*c);put(p-3,8n*c);}polynomial=next;
  }
  return {rows,domain:{flat:['0','1/4'],shifted:['7/4','2']},
    proof:'D(E P)=E(P_prime+8 delta^-3 P). For 0<delta<=1/4, set u=2/delta>=8 and use u^n exp(-u^2)<=ceil(n/2)!; dropping2^-n enlarges the bound. For7/4<=u<=2 use u^-n<=1. Every endpoint derivative has the same flat limit.',sourceAuthenticated:false};
}

/** Common ordinary mixed bound for E(logX,eta) in the ORIGINAL outer
 * stages and complete heat edit. Uses the independently proved scalar
 * E height<C^2, and generates new finite derivative constants explicitly.
 */
export function firstSelectorOuterHeatMajorant(G,{C,Xa,stepBounds,order=5}){
  if(!valid(order)||order>8||!Array.isArray(stepBounds)||stepBounds.length<order+2)fail('INVALID_INPUT','The finite outer bound needs the next original cutoff derivative.');
  const q=(n,d=1)=>G.q(n,d),S=stepBounds.slice(0,order+2).map(BigInt),sigma=S.reduce((a,b)=>a>b?a:b,1n),
    // A finite reciprocal/log recurrence with denominators1+eta^2>=1,
    // 1-rho>=1/2 and fo>=1/2. All ordinary slopes have magnitude<=2;
    // the heat cutoff argument has slope10/3<4.
    elementary=(2n**BigInt(4*order+12))*factorial(order+2)*(1n+sigma),
    logJet=(1n+elementary)**BigInt(order+2),bell=factorial(order)*(1n+logJet)**BigInt(order),
    angular=1n+2n*factorial(order)*4n**BigInt(order)*65536n*4n**BigInt(order+1)*sigma,
    gamma=factorial(order)*factorial(order+1),heatCompose=factorial(order)*(1n+8n*gamma)**BigInt(order),
    productCount=4n**BigInt(order+2),logBound=G.mul(q(productCount*bell*angular*(1n+heatCompose)),G.pow(C,2)),
    physical=G.mul(q(factorial(order)*2n**BigInt(order+2)),logBound,G.pow(G.add(G.one,G.inv(Xa)),order+1));
  return {order,upper:physical,logBound,constants:{elementary:String(elementary),logJet:String(logJet),bell:String(bell),angular:String(angular),gamma:String(gamma),heatCompose:String(heatCompose),productCount:String(productCount)},
    sourceAuthenticated:false,proof:[
      'Each nonconstant mixed derivative of the literal log density in the twelve stages uses only the fixed slopes, sigma, log(1+eta^2), log fo, and their displayed positive denominators. The finite reciprocal/log recurrence is majorized by logJet.',
      'The known real height E<C^2 is multiplied by the complete Bell bound n!*(1+logJet)^n. It is not exponentiated again. The original angular coefficient Cauchy tube has radius1/4 and height65536*lambda^29<=65536; both pressure-neutral bumps and every derivative throughn are included.',
      'The full Gamma heat satisfies |H^(j)(z)|<=(h)_j(1+h)_j<=j!*(j+1)! onz>=0, since0<h<1. On the heat-active domainX>=XK>1 all logX/eta jets ofz=2(1-eta^2)/X are<=8. The original fo and heat cutoff remain in the product.',
      'The exact unsigned-Stirling conversion from logX toX and the factor(2X)^(-1/2) are bounded onX>=Xa. All supports beforeXplus use the independently supplied active leading norm instead.'
    ]};
}

export function firstSelectorTerminalBMajorant(G,{C,rho,stepBounds,order=3}){
  if(order!==3)fail('INVALID_INPUT','This first-selector terminal ledger generates precisely total order three.');
  const q=(n,d=1)=>G.q(n,d),a=actualNormCalculus(G),{fn,constant:K,add,mul,scale,dx}=a,flat=firstSelectorFlatGaussianBounds(5),inv=[G.exp(q(64,49))],den=flat.rows.map(r=>q(BigInt(r.flatIntervalUpper)+BigInt(r.shiftedIntervalUpper)));
  for(let r=1;r<=5;r++)inv[r]=G.mul(inv[0],G.add(...Array.from({length:r},(_,j)=>G.mul(q(choose(r,j+1)),den[j+1],inv[r-j-1]))));
  const factor=fn((r,k)=>k?G.zero:r<inv.length?G.mul(rho,inv[r]):fail('RESOURCE_LIMIT','The terminal factor derivative budget was exhausted.')),
    delta=fn((r,k)=>k?G.zero:r===0?q(1,4):r===1?G.one:G.zero),power=n=>mul(...Array.from({length:n},()=>delta)),
    expMinus2=fn((r,k)=>k?G.zero:q(2n**BigInt(r))),eta=fn((r,k)=>r?G.zero:k===0||k===1?G.one:G.zero),d=fn((r,k)=>r?G.zero:k===0?G.one:k<=2?q(2):G.zero),
    invL=fn((r,k)=>r?G.zero:q(2n*factorial(k)*8n**BigInt(k))),az=scale(q(2),mul(eta,invL)),azEta=fn((r,k)=>az.get(r,k+1)),bz=mul(invL,add(scale(q(2),mul(eta,az)),mul(d,azEta))),
    gamma=factorial(5)*factorial(6),heatConstant=2n*factorial(5)*(1n+8n*gamma)**5n,heat=fn((r,k)=>r+k<=3?G.mul(q(heatConstant),G.pow(C,2)):fail('RESOURCE_LIMIT','The terminal heat derivative budget was exhausted.')),
    coefficient=mul(heat,add(mul(az,az,add(mul(power(6),dx(factor,2)),scale(q(16),mul(power(3),dx(factor))),mul(add(K(q(64)),scale(q(24),power(2))),factor))),mul(bz,add(mul(power(6),dx(factor)),scale(q(8),mul(power(3),factor)))))),
    B=mul(expMinus2,coefficient);
  return {get:(r,k)=>{if(!valid(r)||!valid(k)||r+k>3||r>2||k>2)fail('RESOURCE_LIMIT','The first terminal FTC requests onlydelta<=2,eta<=2,total<=3.');return B.get(r,k);},flat,denominatorLower:G.exp(q(-64,49)),inverseDenominatorBounds:inv,heatConstant:String(heatConstant),sourceAuthenticated:false,
    proof:'The ORIGINAL B=e^(-2delta)*Fheat*(az^2*(delta^6 f_second+16delta^3 f_first+(64-24delta^2)f)-bz*(delta^6 f_first+8delta^3 f)) is bounded by its complete positive Leibniz sum. Its factor f=rho/(exp(-4/delta^2)+exp(-4/(2-delta)^2)) has denominator>=exp(-64/49). Both first and second factor derivatives remain present; the full Gamma heat is retained.'};
}
