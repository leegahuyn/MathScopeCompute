/** Exact local source potential curl, with its actual covariance weight.
 * Square roots are expressions on the explicitly stated positive-weight
 * domain. Constructing them does not certify that the displayed band lies
 * in that domain. No global gluing, NS residual or flatness is inferred.
 */
import {prepareActualPulseJetProgram,assertActualPulseJetProgram} from './actual-pulse-jet-source.mjs';
import {actualLeadingTargetOnSensitivityGraph,covarianceInverseFirstDerivative} from './actual-covariance-sensitivity.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j])));

/** The original AD graph can retain choose(label,0,0,0) for a frozen
 * carrier derivative. Such a node is identically zero, although a rational
 * identity checker normally treats piecewise functions as opaque atoms.
 * This equality normalization changes no original node. Only literally
 * equal normalized branches collapse, with every used equality recorded.
 */
export function normalizeEqualPiecewiseBranches(G,expression,atomicNodes=[]){
  const fixed=new Set(atomicNodes),cache=new Map(),identities=[];
  function visit(id){
    if(cache.has(id))return cache.get(id);if(fixed.has(id))return id;
    const node=G.nodes[id];if(!node)fail('INVALID_INPUT','A piecewise identity operand is not a retained expression.');
    const {op,args}=node;let out=id;
    if(op==='smooth_piecewise'){
      const branches=args.slice(3).map(visit);
      if(branches.length===3&&branches.every(x=>x===branches[0])){out=branches[0];identities.push({original:id,normalized:out,originalBranches:args.slice(3),normalizedBranches:branches,rule:'All three branches of the original piecewise function are the same expression.'});}
    }else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    cache.set(id,out);return out;
  }
  const normalized=visit(expression);return {expression,normalized,identities,originalGraphUnmodified:true};
}
const same=(G,a,b,atomicNodes=[])=>{
  const equality=normalizeEqualPiecewiseBranches(G,G.sub(a,b),atomicNodes);
  return {...sourceGraphRationalIdentity(G,equality.normalized,{atomicNodes,maxTerms:40000}),originalExpression:equality.expression,equalBranchNormalization:equality.identities};
};

/** Potential is i*C*exp(i*k*phase), where C is a real coefficient vector.
 * Operators are D_r=partial_R+a(R)*partial_xi and D_z=epsilon*partial_Z.
 * The original auxiliary longitudinal variable is spatially frozen.
 * Differentiation is performed from retained bodies, never supplied jets.
 */
export function exactCylindricalHarmonicCurl(G,input){
  const keys=['R','Z','xi','epsilon','radialFast','k','normal','potential'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k))||input.normal?.length!==3||input.potential?.length!==3)fail('INVALID_INPUT','Use the retained cylindrical geometry, normal and three real potential coefficients.');
  const {R,Z,xi,epsilon,radialFast,k,normal:n,potential:C}=input;
  if([R,Z,xi,epsilon,radialFast,k,...n,...C].some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))fail('INVALID_INPUT','Curl operands must be retained expression roots.');
  if(new Set([R,Z,xi]).size!==3||[R,Z,xi].some(x=>G.nodes[x].op!=='coordinate'))fail('INVALID_INPUT','R, Z and the transverse coordinate must be distinct independent coordinates.');
  const Dr=x=>G.add(G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi))),Dz=x=>G.mul(epsilon,G.derivative(x,Z));
  // These hypotheses make the two evaluated spatial operators commute.
  if([R,Z,xi].some(x=>G.dependsOn(epsilon,x)||G.dependsOn(k,x))||G.dependsOn(radialFast,Z)||G.dependsOn(radialFast,xi))fail('INVALID_INPUT','The source epsilon and carrier are frozen; the radial fast factor depends only on R and frozen labels.');
  const ir=G.inv(R),radialDerivatives=C.map(Dr),axialDerivatives=C.map(Dz);
  const leading=cross(G,n,C).map(x=>G.neg(G.mul(k,x)));
  const remainder=[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))];
  const mixedRZ=Dr(axialDerivatives[1]),mixedZR=Dz(radialDerivatives[1]);
  const gradient=G.sub(Dr(n[2]),Dz(n[0])),angularConnection=G.add(Dr(n[1]),G.mul(ir,n[1]));
  const checks=[
    {id:'frozen-carrier-radial',...same(G,Dr(k),G.zero)},
    {id:'frozen-carrier-axial',...same(G,Dz(k),G.zero)},
    {id:'cylindrical-angular-connection',...same(G,angularConnection,G.zero)},
    {id:'angular-normal-axial-constant',...same(G,Dz(n[1]),G.zero)},
    {id:'phase-mixed-gradient',...same(G,gradient,G.zero)},
    {id:'inverse-radius-axial-constant',...same(G,Dz(ir),G.zero)},
    {id:'actual-potential-mixed-partials',...same(G,mixedRZ,mixedZR)}
  ];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','A literal full-curl geometric or mixed derivative premise failed: '+checks.filter(c=>!c.pass).map(c=>c.id+' ('+c.numeratorMonomials+' residual monomials)').join(', '));
  // Retain the directly differentiated expressions as well as the checked
  // premises. The Lean identity applies to their complex combination.
  const divergenceReal=G.sub(G.add(Dr(leading[0]),G.mul(ir,leading[0]),Dz(leading[2])),G.mul(k,dot(G,n,remainder)));
  const divergenceImaginary=G.add(Dr(remainder[0]),G.mul(ir,remainder[0]),Dz(remainder[2]),G.mul(k,dot(G,n,leading)));
  return {schema:'MathScope.ExactCylindricalHarmonicCurl/1',geometry:{R,Z,xi,epsilon,radialFast,k,normal:[...n]},potential:[...C],
    radialDerivatives,axialDerivatives,leading,remainder,fullCoefficient:leading.map((real,j)=>({real,imaginary:remainder[j]})),
    divergence:{real:divergenceReal,imaginary:divergenceImaginary,mixedRZ,mixedZR,checks,
      valueOnDeclaredSmoothDomain:[G.zero,G.zero],
      theorem:'MathScope.M2.Navier.full_cylindrical_curl_divergence',
      theoremSource:'lean/MathScope/M2/Navier/DifferentialAlgebra.lean',
      interpretation:'The checked body identities discharge the geometric and mixed-partial hypotheses of the universal algebraic curl-divergence theorem. Analytic domain membership is a separate premise.'},
    formulas:{potential:'i*C*exp(i*k*phase)',leading:'-k*n cross C',remainder:'[-D_z C_theta, D_z C_r-D_r C_z, D_r C_theta+C_theta/R]',
      full:'(leading+i*remainder)*exp(i*k*phase)',divergence:'D_r u_r+u_r/R+D_z u_z+i*k*n dot u'},
    sourceAuthenticated:false,globalPhysicalResidualProved:false};
}

const binding=r=>canonicalStringify({request:r.request,geometry:r.geometry,rows:r.rows,target:r.target,roots:r.roots,domain:r.domain,scope:r.scope,checks:r.checks});

export function attachActualFullCurl(jet,context={}){
  assertActualPulseJetProgram(jet);context.checkCancelled?.();
  const {G,operator:o,request}=jet,{R,Z}=o.coordinates,xi=o.cutoffs.xi;
  const target=actualLeadingTargetOnSensitivityGraph(G,o),H=[o.families.map(f=>f.covariance.theta),o.families.map(f=>f.covariance.z)];
  const inverseR=covarianceInverseFirstDerivative(G,{matrix:H,target:target.components,parameter:R});
  const inverseZ=covarianceInverseFirstDerivative(G,{matrix:H,target:target.components,parameter:Z});
  if(inverseR.weights.some((x,j)=>x!==inverseZ.weights[j]))fail('INVALID_SOURCE_CONSTRUCTION','Both actual weight derivatives must use the same original H and full target.');
  const q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),sqrt2=G.sqrt(q(2));
  const rho=G.div(G.log(G.sub(q(4),sqrt2)),G.log(o.geometry.Tg));
  const dr=G.sub(G.mul(q(2),G.add(G.one,o.constants.h),rho),G.div(o.constants.h,q(100000)));
  const Mi=G.mul(power(G.sub(q(4),sqrt2),o.geometry.paletteIndex),power(o.geometry.Q,G.div(dr,q(2))));
  const radialFast=G.mul(Mi,dr,power(R,G.sub(dr,G.one))),epsilon=o.geometry.epsilon,k=o.geometry.k;
  const physicalPotentialScale=power(o.geometry.Q,G.sub(q(1,2),o.constants.A)),physicalVelocityScale=power(o.geometry.Q,G.neg(o.constants.A));
  const rows=[];
  for(const [index,f] of o.families.entries()){
    context.checkCancelled?.();const weight=inverseR.weights[index],sigma=G.sqrt(weight),weightR=inverseR.weightDerivative[index],weightZ=inverseZ.weightDerivative[index];
    const sigmaR=G.derivative(sigma,R),sigmaZ=G.derivative(sigma,Z),denominator=G.mul(q(2),sigma);
    const inverseAtoms=inverse=>[sigma,...H.flat(),...inverse.matrixDerivative.flat(),...target.components,...inverse.targetDerivative];
    const rootChecks=[same(G,sigmaR,G.div(weightR,denominator),inverseAtoms(inverseR)),same(G,sigmaZ,G.div(weightZ,denominator),inverseAtoms(inverseZ))];
    if(!rootChecks.every(c=>c.pass))fail('INTERNAL_VALIDATION','The actual square-root weight derivative is missing a covariance or target derivative.');
    // Original primary wave is sqrt(epsilon)*sqrt(y)*chi*psi*t*cos(k*phase).
    // epsilon is slow-frozen but cannot be discarded from physical scaling.
    const cutoff=G.mul(o.cutoffs.chi,o.cutoffs.psi),amplitude=f.t.map(x=>G.mul(G.sqrt(epsilon),sigma,cutoff,x));
    const rawPotential=cross(G,f.frame.n,amplitude).map(x=>G.div(x,G.mul(k,f.frame.nSquared)));
    // Sharing retains the complete defining body and gives mixed derivatives
    // a canonical multi-index. It does not substitute a symbolic oracle.
    const potentialParameters=[R,Z,o.coordinates.T,xi,o.coordinates.v,o.coordinates.Xrep,o.coordinates.etaRep,o.coordinates.sRep];
    const potential=rawPotential.map((x,j)=>G.share(x,potentialParameters,'ActualFullCurlPotential_'+f.sign+'_'+j));
    const phaseGradient=[G.derivative(f.phase,R),G.div(G.derivative(f.phase,o.coordinates.theta),R),G.mul(epsilon,G.derivative(f.phase,Z))];
    const phaseChecks=phaseGradient.map((x,j)=>same(G,x,f.frame.n[j]));
    if(amplitude.some(x=>G.dependsOn(x,o.coordinates.theta))||potential.some(x=>G.dependsOn(x,o.coordinates.theta))||!phaseChecks.every(c=>c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual phase gradient and angular-independent potential body must be retained.');
    const n=f.frame.n,nt=f.frame.nt,ntSquared=G.pow(nt,2),tangentSquared=G.add(G.pow(n[1],2),G.pow(n[2],2));
    if(G.nodes[nt].op!=='sqrt_positive'||G.nodes[nt].args[0]!==tangentSquared)fail('INVALID_SOURCE_CONSTRUCTION','The source tangent norm must be the retained positive square root.');
    const frameAtoms=[...n,nt,f.frame.J[1][0]],frameTangencyChecks=[0,1].map(j=>same(G,
      G.mul(ntSquared,dot(G,n,f.frame.B.map(row=>row[j]))),G.mul(n[0],G.sub(ntSquared,tangentSquared)),frameAtoms));
    const rawLeading=cross(G,n,rawPotential).map(x=>G.neg(G.mul(k,x))),amplitudeTangency=dot(G,n,amplitude);
    const leadingChecks=rawLeading.map((x,j)=>same(G,x,G.sub(amplitude[j],G.div(G.mul(n[j],amplitudeTangency),f.frame.nSquared)),[...n,...amplitude,k]));
    if(![...frameTangencyChecks,...leadingChecks].every(c=>c.pass))fail('INTERNAL_VALIDATION','The original tangent amplitude or exact triple-product identity failed.');
    const curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon,radialFast,k,normal:f.frame.n,potential});
    rows.push({sign:f.sign,phase:f.phase,weight,sigma,weightR,weightZ,sigmaR,sigmaZ,rootChecks,cutoff,
      originalAmplitude:f.t,weightedCutoffAmplitude:amplitude,rawPotential,potentialParameters,phaseGradient,phaseChecks,
      tangency:{nt,tangentSquared,frameTangencyChecks,leadingChecks,amplitudeTangency,
        proof:'The retained nt=sqrt(n_theta^2+n_z^2)>0 gives nt^2=n_theta^2+n_z^2. The checked cleared frame identities imply n dot B=0, hence n dot amplitude=0. The checked triple product therefore makes the leading curl coefficient the original amplitude.'},
      transverseCutoffDerivative:G.derivative(o.cutoffs.chi,xi),
      curl,physicalPotential:potential.map(x=>G.mul(physicalPotentialScale,x)),
      physicalCoefficient:curl.fullCoefficient.map(x=>({real:G.mul(physicalVelocityScale,x.real),imaginary:G.mul(physicalVelocityScale,x.imaginary)}))});
  }
  const geometry={R,Z,xi,epsilon,k,rho,dr,Mi,radialFast,physicalPotentialScale,physicalVelocityScale,
    source:'source-geometry.mjs evaluated derivatives and source-pulse-curl.mjs equation (7.38)',
    operator:'D_r=partial_R+M_i*d_r*R^(d_r-1)*partial_xi; D_z=epsilon*partial_Z',
    transverseChain:'xi=(v_r dot (Y_i-c))/(4-2*sqrt(2)); v_r dot grad_Y xi=1',
    longitudinalChain:'v=(eta+r0)/c_i; v_r dot grad_Y v=0, hence D_r v=D_z v=0',
    allLabelsAndRepresentativesFrozen:true,integerCarriersReselectedDuringDerivative:false};
  const domain={...jet.domain,additionalConditions:['R>0 and the original moving-frame denominators are nonzero.','det(H) != 0 and both original y=H^-1*T weights are strictly positive.','The same selected slow box and frozen representative are used throughout differentiation.'],
    exercisedBand:{ellExact:request.ellExact,positiveWeightDomainMembershipCertified:false},
    support:'One fixed-band, fixed-box source rectangle with original transverse chi and longitudinal psi. Slow band/mesh gluing and all-index physical assembly are separate.',
    zeroStressBoundary:'No square-root division at y=0 is evaluated. Extending through the zero-stress edge needs the separate flat-jet theorem.',
    conclusion:'A conditional exact local full potential curl. Its displayed expression is not a numerical value or an unconditional physical solution.'};
  const scope={actualOriginalPulseAndPhaseRetained:true,actualCovarianceWeightDerivativesIncluded:true,actualFullLeadingTargetRetained:true,
    actualLocalFullCurlConstructed:true,originalSqrtEpsilonWaveScaleRetained:true,transverseCutoffDerivativeIncluded:true,longitudinalCutoffRetained:true,cylindricalConnectionIncluded:true,
    conditionalSquareRootWeights:true,exercisedBandPositiveWeightsCertified:false,sourceGeometricDerivativePremisesChecked:true,
    universalLeanCurlTheoremAvailable:true,actualSourceAnalyticLeanTheorem:false,secondSlowSourceDerivativesUsed:true,
    actualGlobalSlowPartitionGluingComplete:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,numericalCurlEnclosure:false,
    originalM2AcceptanceCountChanged:false,fullSameProfileN5:false};
  const checks=[{id:'two-original-source-signs',pass:rows.length===2&&rows[0].sign===1&&rows[1].sign===-1},
    {id:'full-Ha-y-and-target-derivatives',pass:[inverseR,inverseZ].every(x=>x.directChecks.every(c=>c.pass))},
    {id:'actual-square-root-chain',pass:rows.every(r=>r.rootChecks.every(c=>c.pass))},
    {id:'actual-phase-and-original-tangent-amplitude',pass:rows.every(r=>[...r.phaseChecks,...r.tangency.frameTangencyChecks,...r.tangency.leadingChecks].every(c=>c.pass))},
    {id:'full-curl-geometric-and-mixed-premises',pass:rows.every(r=>r.curl.divergence.checks.every(c=>c.pass))},
    {id:'original-transverse-cutoff-retained',pass:rows.every(r=>r.transverseCutoffDerivative!==G.zero)},
    {id:'no-ell1-positivity-or-global-residual-promotion',pass:!scope.exercisedBandPositiveWeightsCertified&&!scope.fullPhysicalResidualAndFlatErrorPackageComplete}];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','The actual local full-curl contract failed.');
  const roots=Object.fromEntries(rows.flatMap(r=>[
    ['weight_'+r.sign,r.weight],['sigma_'+r.sign,r.sigma],
    ...r.curl.potential.map((x,j)=>['potential_'+r.sign+'_'+j,x]),
    ...r.curl.fullCoefficient.flatMap((x,j)=>[['curl_real_'+r.sign+'_'+j,x.real],['curl_imaginary_'+r.sign+'_'+j,x.imaginary]]),
    ['divergence_real_'+r.sign,r.curl.divergence.real],['divergence_imaginary_'+r.sign,r.curl.divergence.imaginary]
  ]));
  const result={G,jet,operator:o,request,geometry,rows,target,roots,domain,scope,checks};
  result.program=G.pack(roots,{schema:'MathScope.ActualFullCurlProgram/1',compiler:'actual-full-curl.mjs:prepareActualFullCurlProgram',compilerInput:request,
    sourceProfile:o.sourceProfile,parameterExpressionSHA256:o.parameterExpressionSHA256,geometry,rows,domain,scope,checks});
  const {nodes:programNodes,...metadata}=result.program;
  seals.set(result,{G,jet,nodes:JSON.stringify(G.nodes),count:G.nodes.length,definitions:G.captureFunctionDefinitions(),data:binding(result),programMetadata:structuredClone(metadata)});
  return result;
}

export function prepareActualFullCurlProgram(input={},context={}){return attachActualFullCurl(prepareActualPulseJetProgram({...input,terms:input.terms??0},context),context);}

export function assertActualFullCurlProgram(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.jet!==result.jet||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||binding(result)!==s.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally constructed actual full-curl program.');
  assertActualPulseJetProgram(s.jet);return true;
}

export async function actualFullCurlCertificate(input={},context={}){
  return actualFullCurlCertificateFromProgram(prepareActualFullCurlProgram(input,context),context);
}

export async function actualFullCurlCertificateFromProgram(p,context={}){
  assertActualFullCurlProgram(p);context.checkCancelled?.();
  const {G,rows}=p,sealed=seals.get(p),program={...sealed.programMetadata,nodes:G.nodes.slice(0,sealed.count)},serialized=canonicalStringify(program),digest=await sha256(serialized);
  const expression=id=>({rootId:id,operation:G.nodes[id].op,arguments:structuredClone(G.nodes[id].args),valueKind:'Exact conditional source expression; not a numerical enclosure'});
  return {schema:'MathScope.ActualFullCurlCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceProfile:p.operator.sourceProfile,
    parameterExpressionSHA256:p.operator.parameterExpressionSHA256,completedScope:'Exact local full curl of the actual weighted, cutoff source potential on the positive covariance domain.',
    domain:p.domain,scope:p.scope,checks:p.checks,geometry:p.geometry,
    graph:{sha256:digest,nodeCount:sealed.count,serializedProgramBytes:new TextEncoder().encode(serialized).length,roots:program.roots,compiler:program.compiler,compilerInput:p.request,graphIncluded:false},
    curlRows:rows.flatMap(r=>r.curl.fullCoefficient.map((x,j)=>({sign:r.sign,component:['r','theta','z'][j],potential:expression(r.curl.potential[j]),
      leading:expression(x.real),curlRemainder:expression(x.imaginary),fullCoefficient:{real:expression(x.real),imaginary:expression(x.imaginary)},
      weight:expression(r.weight),weightR:expression(r.weightR),weightZ:expression(r.weightZ),transverseCutoffDerivative:expression(r.transverseCutoffDerivative)}))),
    divergenceRows:rows.map(r=>({sign:r.sign,realExpression:expression(r.curl.divergence.real),imaginaryExpression:expression(r.curl.divergence.imaginary),
      conditionalValue:[0,0],theorem:r.curl.divergence.theorem,premises:r.curl.divergence.checks,domainMembershipCertified:false})),
    convergence:{exactSourceVolterraLimitRetained:true,finiteSumSubstitutedForOriginalPulse:false,numericalWholeSourceEvaluation:false},
    nextDependency:'Certify the positive-weight domain of each exercised band; bind every slow partition and label; control the third potential derivatives and the full global physical NS residual/flat-error bounds.'};
}
