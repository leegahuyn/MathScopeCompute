/** Complete change in the ORIGINAL two tangential mean equations.
 * The fast temporal correction is kept separate from the full slow,
 * radial, axial, viscous and pressure change. No cancellation or source
 * class authority is inferred from a caller-supplied norm row.
 */
import {originalFullMeanOperators,exactFullAuxiliaryMeanPDE} from './source-full-mean-equations.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';
import {radialFactorial,radialBinomial} from './source-radial-class-kernel.mjs';
import {rational as Q,readRational as readQ,qadd,qmul,qdiv,qcompare,qtext}
  from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  root=(G,id)=>Number.isSafeInteger(id)&&!!G?.nodes?.[id],
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  only=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))
    fail('Use the specified complete source operands and finite request only.');},
  copy=x=>structuredClone(x);

export function originalMeanResidualChangeDemand(input={}){
  only(input,['order']);const m=natural(input.order??0,'Residual change order');
  if(!Number.isSafeInteger(m+2))fail('The complete derivative demand exceeds the exact integer range.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalMeanResidualChangeDemand/1',order:m,
    requiredPreviousVelocityOrder:m+1,requiredIncrementVelocityOrder:m+2,
    requiredBackgroundOrder:m+1,requiredPressureChangeOrder:m+1,
    requiredRadialCoefficientOrder:m+1,requiredFastTimeIncrementOrder:m+1,
    coordinates:['R','Z','T','Y0','Y1'],
    recurrence:'Every product uses the complete finite Leibniz convolution; the vector/scalar Laplacian applies the full variable-coefficient D_r twice.',
    slowChangeInitialExponent:'2-3*kappa_s',fastTimeCancellationRequiredSeparately:true,
    wholeCovarianceAndOriginalStressCancelOnlyBecauseTheyAreIdenticalInputs:true,
    sourceAuthenticated:false};
}

/** This is an exact identity for arbitrary smooth complete operands.
 * Both old and updated equations are constructed from the original PDE.
 * The covariance and stress are the SAME roots on both sides; they are
 * not assumed zero. Every old/new/quadratic mean product remains.
 */
export function exactFullMeanResidualChange(G,input={}){
  only(input,['geometry','background','previous','increment','covariance','stress','previousPressure','pressureIncrement','maxTerms','maxProducts']);
  const {geometry,background,previous,increment,covariance,stress,previousPressure,pressureIncrement}=input,
    keys=['beta','v','gamma'];
  if(!previous||!increment||!keys.every(k=>root(G,previous[k])&&root(G,increment[k]))||
    !root(G,previousPressure)||!root(G,pressureIncrement))
    fail('Keep all three old and increment velocities and both complete pressure roots.');
  const O=originalFullMeanOperators(G,geometry),{R,Z,T,N,De,Dz,lap,lapVector}=O,
    e=geometry.epsilon,ci=geometry.ci,b=background?.b,V=background?.V,G0=background?.G,
    beta=previous.beta,v=previous.v,gamma=previous.gamma,db=increment.beta,dv=increment.v,dg=increment.gamma,
    updated=Object.fromEntries(keys.map(k=>[k,G.add(previous[k],increment[k])])),
    common={geometry,background,covariance,stress},
    oldEquations=exactFullAuxiliaryMeanPDE(G,{...common,velocity:previous,pressure:previousPressure}),
    newEquations=exactFullAuxiliaryMeanPDE(G,{...common,velocity:updated,pressure:G.add(previousPressure,pressureIncrement)}),
    productTerms={
      thetaRadial:{backgroundRadial:G.mul(b,dv),oldRadial:G.mul(beta,dv),backgroundAngular:G.mul(V,db),
        oldAngular:G.mul(v,db),incrementQuadratic:G.mul(db,dv)},
      thetaAxial:{backgroundAxial:G.mul(G0,dv),oldAxial:G.mul(gamma,dv),backgroundAngular:G.mul(V,dg),
        oldAngular:G.mul(v,dg),incrementQuadratic:G.mul(dg,dv)},
      zRadial:{backgroundRadial:G.mul(b,dg),oldRadial:G.mul(beta,dg),backgroundAxial:G.mul(G0,db),
        oldAxial:G.mul(gamma,db),incrementQuadratic:G.mul(db,dg)},
      zAxial:{backgroundAxial:G.mul(G.q(2),G0,dg),oldAxial:G.mul(G.q(2),gamma,dg),
        incrementSquare:G.pow(dg,2),completePressureChange:pressureIncrement}},
    sum=terms=>G.add(...Object.values(terms)),
    components=[{name:'Etheta',increment:dv,connection:2,radial:productTerms.thetaRadial,axial:productTerms.thetaAxial,vector:true},
      {name:'Ez',increment:dg,connection:1,radial:productTerms.zRadial,axial:productTerms.zAxial,vector:false}],
    verify=createFactoredRationalVerifier(G,{maxTerms:input.maxTerms??100000,maxProducts:input.maxProducts??1000000}),
    rows=components.map(c=>{
      const fastTime=G.mul(ci,N(c.increment)),
        terms={slowTime:G.neg(G.mul(e,G.derivative(c.increment,T))),radial:De(sum(c.radial),c.connection),
          axial:Dz(sum(c.axial)),viscous:G.neg(G.mul(e,c.vector?lapVector(c.increment):lap(c.increment)))},
        slowChange=sum(terms),fullChange=G.add(fastTime,slowChange),
        direct=G.sub(newEquations[c.name],oldEquations[c.name]),identity=verify(G.sub(direct,fullChange));
      return {name:c.name,connection:c.connection,radialProducts:c.radial,axialProducts:c.axial,fastTime,
        terms,slowChange,fullChange,direct,identity};
    });
  if(rows.some(r=>!r.identity.pass))fail('The complete actual mean residual difference identity failed.','INVALID_SOURCE_CONSTRUCTION');
  return {schema:'MathScope.N6.ExactFullMeanResidualChange/1',geometry:copy(geometry),background:copy(background),
    previous:copy(previous),increment:copy(increment),updated,previousPressure,pressureIncrement,
    unchangedCovariance:copy(covariance),unchangedStress:copy(stress),oldEquations,newEquations,productTerms,rows,
    completeFourSlowGroupsRetained:true,all19FluxProductTermsRetained:true,
    fastTemporalPartDeclaredCancelled:false,fastCutoffRemainderDeclaredZero:false,
    allPressureModesRetained:true,fullVariableCoefficientRadialViscosityRetained:true,sourceAuthenticated:false};
}

// Exact rational-affine epsilon arithmetic; kappa_s is the ORIGINAL
// rational 1/100000. The positive symbolic h is never evaluated.
function exponent(value){
  if(typeof value!=='string'||value.length>200)fail('Keep the exact original epsilon exponent.');
  if(!value.includes('kappa_s'))return [readQ(value),Q(0)];
  const m=/^([+-]?\d+(?:\/\d+)?)?([+-])?(?:(\d+(?:\/\d+)?)\*)?kappa_s$/.exec(value);
  if(!m||m[1]&&!m[2])fail('Use an exact rational-affine kappa_s exponent.');
  return [m[1]?readQ(m[1]):Q(0),qmul(readQ(m[3]??'1'),Q(m[2]==='-'?-1:1))];
}
const value=e=>qadd(e[0],qdiv(e[1],Q(100000))),addExp=(a,b)=>[qadd(a[0],b[0]),qadd(a[1],b[1])];
function textExp(e){
  const c=qtext(e[0]),s=qcompare(e[1],Q(0));if(!s)return c;
  const a=qtext(s<0?qmul(e[1],Q(-1)):e[1]),k=(a==='1'?'':a+'*')+'kappa_s';
  return (c==='0'?(s<0?'-':''):c+(s<0?'-':'+'))+k;
}

function calculus(G,{radiusBase,radialDerivativeBounds,maxWork=200000}){
  natural(maxWork,'Work budget');let work=0;
  const charge=()=>{if(++work>maxWork)fail('The exact mean difference norm recurrence exceeded its finite work budget.','RESOURCE_LIMIT');},
    closed=id=>root(G,id)&&G.freeCoordinates(id).size===0&&!(G.nodes[id].op==='rational'&&BigInt(G.nodes[id].args[0])<0n),
    norm=f=>{
      if(!f||!closed(f.constant)||!Number.isSafeInteger(f.power)||f.power<0||!Number.isSafeInteger(f.pole)||f.pole<0||
        !['1','zeta'].includes(f.weight)||f.gaussian&&f.gaussian!=='1')fail('Retain every complete closed through-order norm operand.');
      const e=exponent(f.epsilonExponent);
      return {constant:f.constant,power:f.power,pole:f.pole,epsilonExponent:textExp(e),epsilonExponentExact:qtext(value(e)),weight:f.weight,gaussian:'1'};
    };
  if(!closed(radiusBase)||!Array.isArray(radialDerivativeBounds)||radialDerivativeBounds.some(x=>!closed(x))||!maxWork)
    fail('Keep the positive closed source radius and all fixed radial derivative constants.');
  const unit=(constant,epsilonExponent='0')=>norm({constant,power:0,pole:0,epsilonExponent,weight:'1'}),
    scale=(f,c,e='0')=>{charge();if(!closed(c))fail('A norm factor must be a closed nonnegative source constant.');
      return norm({...f,constant:G.mul(f.constant,c),epsilonExponent:textExp(addExp(exponent(f.epsilonExponent),exponent(e)))});},
    add=(...fs)=>{charge();if(!fs.length)fail('Every original mean term must be represented.');
      const e=fs.reduce((best,f)=>qcompare(value(exponent(f.epsilonExponent)),value(best))<0?exponent(f.epsilonExponent):best,exponent(fs[0].epsilonExponent));
      return norm({constant:G.add(...fs.map(f=>f.constant)),power:Math.max(...fs.map(f=>f.power)),pole:Math.max(...fs.map(f=>f.pole)),
        epsilonExponent:textExp(e),weight:fs.every(f=>f.weight==='zeta')?'zeta':'1'});},
    times=(a,b)=>{charge();if(!Number.isSafeInteger(a.power+b.power)||!Number.isSafeInteger(a.pole+b.pole))
      fail('The finite product degree or pole exceeded its exact integer range.','RESOURCE_LIMIT');
      return norm({constant:G.mul(a.constant,b.constant),power:a.power+b.power,pole:a.pole+b.pole,
        epsilonExponent:textExp(addExp(exponent(a.epsilonExponent),exponent(b.epsilonExponent))),
        weight:a.weight==='zeta'||b.weight==='zeta'?'zeta':'1'});},
    rows=(rs,key,n)=>{if(!Array.isArray(rs)||rs.length<n||rs.slice(0,n).some((r,j)=>r.order!==j||!r[key]))
      fail('Generate every complete '+key+' input through order '+(n-1)+'.','RESOURCE_LIMIT');return rs.slice(0,n).map(r=>norm(r[key]));},
    sum=(...ss)=>Array.from({length:Math.min(...ss.map(s=>s.length))},(_,m)=>add(...ss.map(s=>s[m]))),
    scalar=(s,c,e='0')=>s.map(f=>scale(f,c,e)),
    product=(a,b)=>Array.from({length:Math.min(a.length,b.length)},(_,m)=>add(...Array.from({length:m+1},(_,j)=>
      scale(times(a[j],b[m-j]),G.q(radialBinomial(m,j)))))),
    derivative=(s,n=1)=>s.slice(n),
    inverseRadius=n=>Array.from({length:n},(_,m)=>unit(G.mul(G.q(radialFactorial(m)),G.pow(radiusBase,m+1)))),
    fast=n=>{if(radialDerivativeBounds.length<n)fail('Retain all fixed radial coefficient derivatives.','RESOURCE_LIMIT');
      return radialDerivativeBounds.slice(0,n).map(c=>unit(c,'-kappa_s'));},
    Dr=s=>sum(derivative(s),scalar(product(fast(s.length-1),derivative(s)),G.sqrt(G.q(2)))),
    De=(s,e)=>sum(Dr(s),scalar(product(inverseRadius(s.length-1),s),G.q(e))),
    Dz=s=>scalar(derivative(s),G.one,'1'),
    lap=(s,vector)=>{const d=Dr(s),terms=[Dr(d),product(inverseRadius(d.length-1),d),scalar(derivative(s,2),G.one,'2')];
      if(vector)terms.push(product(product(inverseRadius(s.length-2),inverseRadius(s.length-2)),s));return sum(...terms);};
  return {rows,sum,scalar,product,derivative,De,Dz,lap,work:()=>work};
}

/** Source-only finite norm algebra, conditional on the actual private
 * producer for every input row. It computes all 19 quadratic/linear flux
 * factors and four complete slow groups. Fast time is retained separately
 * so a raw A1 bound cannot be silently promoted to cutoff flatness.
 */
export function composeOriginalMeanResidualChangeRows(G,input={}){
  only(input,['order','backgroundRows','previousRows','incrementRows','pressureChangeRows','radiusBase','radialDerivativeBounds','maxWork']);
  const demand=originalMeanResidualChangeDemand({order:input.order??0}),m=demand.order,C=calculus(G,input),
    bg=Object.fromEntries(['b','V','G'].map(k=>[k,C.rows(input.backgroundRows,k,m+2)])),
    old=Object.fromEntries(['beta','v','gamma'].map(k=>[k,C.rows(input.previousRows,k,m+2)])),
    d=Object.fromEntries(['beta','v','gamma'].map(k=>[k,C.rows(input.incrementRows,k,m+3)])),
    p=C.rows(input.pressureChangeRows,'pressure',m+2),
    {sum:add,product:mul,scalar:times,derivative:D,De,Dz,lap}=C,
    products={
      thetaRadial:{backgroundRadial:mul(bg.b,d.v),oldRadial:mul(old.beta,d.v),backgroundAngular:mul(bg.V,d.beta),
        oldAngular:mul(old.v,d.beta),incrementQuadratic:mul(d.beta,d.v)},
      thetaAxial:{backgroundAxial:mul(bg.G,d.v),oldAxial:mul(old.gamma,d.v),backgroundAngular:mul(bg.V,d.gamma),
        oldAngular:mul(old.v,d.gamma),incrementQuadratic:mul(d.gamma,d.v)},
      zRadial:{backgroundRadial:mul(bg.b,d.gamma),oldRadial:mul(old.beta,d.gamma),backgroundAxial:mul(bg.G,d.beta),
        oldAxial:mul(old.gamma,d.beta),incrementQuadratic:mul(d.beta,d.gamma)},
      zAxial:{backgroundAxial:times(mul(bg.G,d.gamma),G.q(2)),oldAxial:times(mul(old.gamma,d.gamma),G.q(2)),
        incrementSquare:mul(d.gamma,d.gamma),completePressureChange:p}},
    group=(velocity,radial,axial,connection,vector)=>({slowTime:Dz(velocity),radial:De(add(...Object.values(radial)),connection),
      axial:Dz(add(...Object.values(axial))),viscous:times(lap(velocity,vector),G.one,'1')}),
    theta=group(d.v,products.thetaRadial,products.thetaAxial,2,true),z=group(d.gamma,products.zRadial,products.zAxial,1,false),
    slowTheta=add(...Object.values(theta)),slowZ=add(...Object.values(z)),
    fastTheta=times(D(d.v),G.sqrt(G.q(2))),fastZ=times(D(d.gamma),G.sqrt(G.q(2))),
    rows=Array.from({length:m+1},(_,j)=>({order:j,Etheta:slowTheta[j],Ez:slowZ[j],
      thetaTerms:Object.fromEntries(Object.entries(theta).map(([k,s])=>[k,s[j]])),
      zTerms:Object.fromEntries(Object.entries(z).map(([k,s])=>[k,s[j]])),
      fluxProducts:Object.fromEntries(Object.entries(products).map(([k,terms])=>[k,Object.fromEntries(Object.entries(terms).map(([n,s])=>[n,s[j]]))])),
      uncancelledFastTime:{Etheta:fastTheta[j],Ez:fastZ[j]},fastTimeCancellationApplied:false,
      actualCutoffFlatnessInferred:false}));
  return {schema:'MathScope.N6.OriginalMeanResidualChangeNormProducts/1',order:m,demand,rows,work:C.work(),
    all19FluxProductTermsRetained:true,allFourSlowGroupsRetained:true,latestCompletePressureChangeRetained:true,
    fullVariableCoefficientRadialViscosityRetained:true,
    proof:[
      'Every through-order product uses sum_(j=0)^m binomial(m,j)*A_j*B_(m-j), which bounds every mixed five-coordinate derivative of order at most m.',
      'D_r=partial_R+a*L uses the exact original l1 norm sqrt(2) and the full source derivative bounds of a=M*d_r*R^(d_r-1). Each occurrence loses at most kappa_s in epsilon.',
      'The full viscosity applies D_r twice, including derivatives of a and both mixed slow/fast terms, then retains R^-1*D_r, the axial epsilon squared term, and the angular vector correction R^-2.',
      'Each slow time or axial derivative gains the original epsilon. The complete new-minus-old pressure is included in the axial equation before the bound is weakened.',
      'For the original initial alpha=1-kappa_s, b has exponent1; old/increment beta have alpha+1 and v/gamma/pressure have alpha. Thus every slow change has exponent at least alpha+1-2*kappa_s=2-3*kappa_s.',
      'The separately displayed ci0*N increment uses only ci0<=1. Its cancellation or the stronger flat A1 bound requires the exact same-source Fourier/FTC/positive-IBP identity and is not inferred here.',
      'The identical complete covariance and unchanged original stress cancel in a difference of the two equations. No stress or covariance field is declared zero.'
    ],sourceAuthenticated:false,actualSourceClassPremisesEstablished:false,completeInitialTupleClassCertified:false,completeN6:false};
}
