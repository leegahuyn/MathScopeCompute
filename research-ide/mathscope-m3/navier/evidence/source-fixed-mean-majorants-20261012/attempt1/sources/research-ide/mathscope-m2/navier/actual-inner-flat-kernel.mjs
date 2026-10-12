/** Exact finite rules for the original inner activation square root.
 * None of these generic algebra/analysis receipts authenticates source data.
 */
import {rational as Q,qadd,qmul,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {innerStressDifferenceAlgebra} from './actual-stress-direction-program.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';

const abs=q=>q[0]<0n?[-q[0],q[1]]:q;
function order(n,name,max=128){if(!Number.isSafeInteger(n)||n<0)fail('INVALID_INPUT',name+' must be a nonnegative finite integer.');if(n>max)fail('RESOURCE_LIMIT',name+' exceeds the explicit finite materialization budget. No missing derivative is zero.');return n;}

/** For r=y/t1 and f(y)=exp[-1/(2*r^2)],
 * D_y^j f=t1^-j*exp[-1/(2*r^2)]*r^-3j*P_j(r^2).
 * The proof and integer recurrence hold at every finite j; only the requested
 * finite rows are materialized.  Preserve a residual exponential as well.
 */
export function innerFlatSquareRootJets({jetOrder=3,vanishingOrder=4}={}){
  order(jetOrder,'jetOrder');order(vanishingOrder,'vanishingOrder',4096);
  let poly=[Q(1)];const rows=[];
  for(let j=0;j<=jetOrder;j++){
    let bound=Q(0),power=Q(1);for(const c of poly){bound=qadd(bound,qmul(abs(c),power));power=qmul(power,Q(1,16));}
    const M=Math.ceil((3*j+vanishingOrder)/2),coefficient=qmul(bound,Q(factorial(M)*(4n**BigInt(M))));
    rows.push({order:j,polynomial:poly.map(qtext),polynomialAbsoluteUpperOnQuarter:qtext(bound),sourceWidthExponent:j===0?0:-j,
      singularNormalizedPower:3*j,vanishingOrder,tradingInteger:M,coefficient:qtext(coefficient),
      exponentCheck:2*M>=3*j+vanishingOrder,
      bound:'t1^-j * coefficient * (y/t1)^N * exp[-1/(4*(y/t1)^2)]'});
    if(j<jetOrder){const next=Array.from({length:poly.length+1},()=>Q(0));poly.forEach((c,k)=>{next[k]=qadd(next[k],c);next[k+1]=qadd(next[k+1],qmul(Q(2*k-3*j),c));});while(next.length>1&&next.at(-1)[0]===0n)next.pop();poly=next;}
  }
  return {schema:'MathScope.InnerFlatSquareRootJets/1',jetOrder,vanishingOrder,domain:'0<r=y/t1<=1/4, t1>0; f=0 for y<=0',rows,
    recurrence:'P_(j+1)(x)=(1-3*j*x)*P_j(x)+2*x^2*P_j_prime(x)',
    tradingProof:'Split exp[-1/(2r^2)] into two copies exp[-1/(4r^2)]. The exponential series gives one copy <=M!*4^M*r^(2M); retain the other. Since 2M>=3j+N and r<=1, the displayed estimate follows.',
    allFiniteExtension:'For every fixed j and arbitrarily large N, the right jth derivative tends to0. The zero extension is C-infinity by induction, with every jet0. This uses the same exact recurrence for each j, not finite-row extrapolation.',
    arithmetic:'EXACT_BIGINT_RATIONAL',actualSourceAuthenticated:false,numericalSourceBounds:false,pass:rows.every(r=>r.exponentCheck)};
}

/** Substitute the regular Ka endpoint values in the EXACT original inner
 * stress-difference algebra.  The analytic limit Ka f(0)=0 must be supplied
 * separately by the genuine regularized kernel, not by this ring check.
 */
export function innerEndpointStressAlgebra(G){
  const v=name=>G.fresh('inner_endpoint_generic_'+name),q=(n,d=1)=>G.q(n,d),z=G.zero,
    b={F:v('F'),U:v('U'),W:v('W'),X:v('X'),r:v('r'),p1:v('p1'),Uy:v('Uy'),a:z,kappa:G.one,
      FOver:z,EOver:z,uOver:z},m={M:z,Meta:z,I:z,Ieta:z,J:z,Jeta:z,S:z,Seta:z,Cp:z,Cpeta:z},
    c={eta:v('eta'),A:v('A'),D:v('D'),d:v('d'),L:v('L'),h:v('h')},out=innerStressDifferenceAlgebra(G,b,m,c),
    expected=[G.mul(b.p1,b.F),G.neg(G.div(G.mul(q(2),b.Uy),b.r))],atoms=Object.values({...b,...c}),
    checks=[out.theta,out.axial].map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,expected[j]),{atomicNodes:atoms,maxTerms:10000})),
    wrongAxial=sourceGraphRationalIdentity(G,G.sub(out.axial,G.neg(G.div(b.Uy,b.r))),{atomicNodes:atoms,maxTerms:10000});
  return {schema:'MathScope.InnerEndpointStressAlgebra/1',inputs:b,constants:c,actualAlgebra:[out.theta,out.axial],expected,checks,
    negativeControl:{omitted:'factor 2 in the axial viscosity endpoint',correctlyRejected:!wrongAxial.pass},
    analyticPremise:'Every normalized moment/field difference Ka limit is0; the original Ka y^3 integral prefactor justifies it.',
    sourceAuthenticated:false,pass:checks.every(c=>c.pass)&&!wrongAxial.pass};
}

/** A copied step application can have a differently ordered rational
 * argument. Prove equality of that argument FIRST, then apply congruence
 * of the same original step. Distinct unproved opaque nodes are never
 * declared to be one atom. The caller authenticates width>0 and source.
 */
export function innerActivationSourceIdentity(G,{sourceActivation,y,width,kappa}={}){
  if(!G||[sourceActivation,y,width,kappa].some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))
    fail('INVALID_INPUT','Use the retained activation and its complete original source coordinates/scalars.');
  const steps=new Set(),seen=new Set();
  const visit=id=>{if(seen.has(id))return;seen.add(id);const {op,args}=G.nodes[id];
    if(op==='source_step_derivative'){steps.add(id);return;}
    if(['add','multiply'].includes(op))args.forEach(visit);
    else if(['inverse','integer_power'].includes(op))visit(args[0]);
    else if(!['rational','source_parameter','coordinate'].includes(op))fail('UNSUPPORTED','The activation shell must retain its original rational coefficient and step.');};
  visit(sourceActivation);
  if(steps.size!==1)fail('INVALID_SOURCE_CONSTRUCTION','Exactly one original step application is required.');
  const originalStep=[...steps][0],node=G.nodes[originalStep],argument=node.args[0],expectedArgument=G.div(y,width),
    expectedStep=G.step(expectedArgument),expected=G.mul(G.sub(G.one,kappa),expectedStep),
    argumentIdentity=sourceGraphRationalIdentity(G,G.sub(argument,expectedArgument)),
    coefficientIdentity=sourceGraphRationalIdentity(G,G.sub(sourceActivation,G.mul(G.sub(G.one,kappa),originalStep)),{atomicNodes:[originalStep]}),
    sameFunction=node.args[1]===0&&G.nodes[expectedStep].op==='source_step_derivative'&&G.nodes[expectedStep].args[1]===0,
    congruenceProved=sameFunction&&argumentIdentity.pass,
    normalized=congruenceProved?G.substitute(sourceActivation,originalStep,expectedStep):null,
    normalizedIdentity=normalized===null?null:sourceGraphRationalIdentity(G,G.sub(normalized,expected),{atomicNodes:[expectedStep]});
  return {schema:'MathScope.InnerActivationSourceIdentity/1',sourceActivation,originalStep,argument,expectedArgument,expectedStep,expected,
    sameOriginalStepAndDerivativeOrder:sameFunction,argumentIdentity,coefficientIdentity,congruenceProved,normalized,normalizedIdentity,
    rule:'Equal rational arguments of the same source step imply equal step values. Only after this equality is proved is the copied application replaced in a new comparison expression; the original source body is not modified.',
    nonzeroPremise:'The actual original width t1 is positive.',sourceAuthenticated:false,
    pass:congruenceProved&&coefficientIdentity.pass&&normalizedIdentity?.pass===true};
}

/** Plain syntax copying; the caller must independently authenticate the
 * complete original factor program. Natural series bodies retain their
 * component, radial/eta derivative order and original source producer.
 */
export function copyInnerFactorProgram(G,program,y,eta){
  if(!program?.roots||!Array.isArray(program.nodes)||!G.nodes[y]||!G.nodes[eta])fail('INVALID_INPUT','Use a factor program and two existing coordinates.');
  const map=new Map([[program.roots.innerLogDistance,y],[program.roots.eta,eta]]),pairs=[],ops=new Set();
  const copy=id=>{if(map.has(id))return map.get(id);const {op,args}=program.nodes[id];let value;ops.add(op);
    if(op==='rational')value=G.q(...args);
    else if(op==='source_parameter')value=G.parameter(args[0]);
    else if(op==='coordinate')value=G.fresh('inner_factor_import_'+args[0]);
    else if(['integer_power','source_step_derivative'].includes(op))value=G.node(op,[copy(args[0]),args[1]]);
    else if(op==='actual_natural_series')value=G.natural(args[0],copy(args[1]),copy(args[2]),args[3],args[4]);
    else if(['add','multiply','inverse','sqrt_positive','exp','log_positive','definite_integral','smooth_piecewise'].includes(op))value=G.node(op,args.map(copy));
    else fail('UNSUPPORTED','Unsupported original inner-factor operation: '+op);
    map.set(id,value);pairs.push([id,value]);return value;};
  const names=['Xa','t1','innerFactor','innerTheta','innerZ','actualInnerF','actualInnerU','innerVOverFactor','innerUOverFactor','innerFOverFactor',
    ...['M','I','J','S','Cp'].map(n=>'inner'+n+'DifferenceOverFactor')],roots=Object.fromEntries(names.map(n=>[n,copy(program.roots[n])]));
  return {roots,pairs,operations:[...ops].sort(),kernels:program.innerKernels.map(k=>({...k,root:copy(k.root)})),
    originalSchema:program.schema,originalParameterExpressionSHA256:program.parameterExpressionSHA256,sourceEquations:[...program.sourceEquations],
    sourceAuthenticatedByCopy:false,analyticNaturalSeriesReplaced:false};
}
