/** Full complex forced-pulse potential on the original common two-torus.
 *
 * The path variable is eliminated before physical differentiation.  The
 * shared potential retains the complete exact Volterra body; differentiation
 * therefore includes the mapped endpoint and all common-Y chain terms.
 * This operator alone does not authenticate an original current or its class.
 */
import {assertSourceCoupledExpressions} from './source-coupled-expressions.mjs';
import {assertForcedAngularInverse,forcedAngularCutoff} from './source-forced-pulse.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';
import {exactHarmonicComplexAlgebra,originalCylindricalDifferentialOperators} from './source-harmonic-assembly.mjs';

const seals=new WeakMap(),parts=['real','imaginary'];
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j])));
const record=s=>JSON.stringify({schema:s.schema,geometry:s.geometry,phase:s.phase,m:s.m,k:s.k,mapping:s.mapping,
  normal:s.normal,cutoff:s.cutoff,potential:s.potential,leading:s.leading,curlRemainder:s.curlRemainder,
  velocity:s.velocity,pressure:s.pressure,divergence:s.divergence,identities:s.identities,scope:s.scope});

export function realizeMappedForcedAngularCurl(input={}){
  if(!input||Object.keys(input).some(k=>!['G','inverse','geometry','phase','pulseValue','psiPath','name'].includes(k)))
    fail('Supply the joint source graph, its forced inverse, common geometry, complete phase and original pulse substitution/cutoff.');
  const {G,inverse,geometry,phase,pulseValue,psiPath}=input;
  assertSourceCoupledExpressions(G,G?.baseGraph);assertForcedAngularInverse(inverse);
  if(inverse.G!==G.forcedGraph||!Array.isArray(geometry?.Y)||![phase,pulseValue,psiPath].every(x=>root(G,x)))
    fail('A common-torus forced curl must use this joint graph\'s unique forced owner and retained source expressions.');
  const D=originalCylindricalDifferentialOperators(G,geometry),{R,Z,theta,Y,epsilon,radialFast}=geometry,
    w=inverse.input.variable,{m}=inverse.input,k=inverse.k,km=G.mul(G.q(m),k),
    spatial=[R,Z,theta,...Y],C=exactHarmonicComplexAlgebra(G);
  if(D.coordinates.includes(w)||G.freeCoordinates(pulseValue).has(w)||G.freeCoordinates(psiPath).has(theta)||epsilon!==inverse.epsilon)
    fail('The independent path variable must be replaced by its common-Y pulse value, with the same original epsilon and angular-independent cutoff.');
  if([epsilon,k,...geometry.vr,...geometry.vt].some(x=>spatial.some(v=>G.dependsOn(x,v)))||
      [Z,theta,...Y].some(v=>G.dependsOn(radialFast,v)))
    fail('The source carrier, epsilon and torus directions are spatially frozen; the radial fast coefficient depends only on R and fixed slow labels.');
  const map=x=>G.simultaneousSubstitute(x,[w],[pulseValue]),mapComplex=z=>C.value(map(z.real),map(z.imaginary)),
    normal=inverse.normal.value.map(map),n2=map(inverse.normal.squared),
    phaseGradient=[D.Dr(phase),D.angular(phase),D.Dz(phase)],
    verify=createQuadraticSourceVerifier(G,{maxTerms:120000}),
    check=(id,a,b=G.zero)=>({id,...verify(G.sub(a,b))}),
    phaseChecks=phaseGradient.map((x,j)=>check('mapped-path-normal-is-common-phase-gradient-'+j,x,normal[j]));
  if(phaseChecks.some(x=>!x.pass)||normal.some(x=>G.freeCoordinates(x).has(theta)))
    fail('The original path normal after substitution must equal the complete common-torus physical phase gradient.');
  const pathCutoff=forcedAngularCutoff(inverse,{psi:psiPath}),amplitude=pathCutoff.velocity.map(mapComplex),
    mapped={psi:map(pathCutoff.psi),dpsi:map(pathCutoff.dpsi),velocity:amplitude,pressure:mapComplex(pathCutoff.pressure),
      residual:pathCutoff.residual.map(mapComplex),expected:pathCutoff.expected.map(mapComplex),
      remainingSource:inverse.source.map(z=>mapComplex(C.scale(G.sub(G.one,psiPath),z))),
      derivativeSource:inverse.velocity.map(z=>mapComplex(C.scale(pathCutoff.dpsi,z)))},
    numerator=Object.fromEntries(parts.map(part=>[part,cross(G,normal,amplitude.map(z=>z[part]))])),
    raw=Object.fromEntries(parts.map(part=>[part,numerator[part].map(x=>G.div(x,G.mul(km,n2)))])),
    parameters=[...new Set([...D.coordinates.filter(x=>x!==theta),...parts.flatMap(part=>raw[part].flatMap(x=>[...G.freeCoordinates(x)]))])];
  if(parameters.includes(w)||parameters.includes(theta)||amplitude.some(z=>parts.some(part=>G.freeCoordinates(z[part]).has(theta))))
    fail('The path coordinate is eliminated and every full complex coefficient is angular-independent before physical differentiation.');
  const name=input.name??'MappedForced_m'+m,
    shared=Object.fromEntries(parts.map(part=>[part,raw[part].map((body,j)=>G.share(body,parameters,name+'_'+part+'_'+j))])),
    bodies=parts.flatMap(part=>shared[part].map((id,j)=>({part,component:j,id,body:raw[part][j],
      function:G.nodes[id].args[0],pass:G.materializeExpressionFunction(...G.nodes[id].args)===raw[part][j]}))),
    curl=Object.fromEntries(parts.map(part=>{
      const X=shared[part],Dr=X.map(D.Dr),Dz=X.map(D.Dz),
        leading=cross(G,normal,X).map(x=>G.neg(G.mul(km,x))),
        remainder=[G.neg(Dz[1]),G.sub(Dz[0],Dr[2]),G.add(Dr[1],G.div(X[1],R))];
      return [part,{potential:X,radialDerivatives:Dr,axialDerivatives:Dz,leading,remainder,
        mixedRZ:D.Dr(Dz[1]),mixedZR:D.Dz(Dr[1])}];
    })),
    leading=[0,1,2].map(j=>C.value(curl.real.leading[j],curl.imaginary.leading[j])),
    curlRemainder=[0,1,2].map(j=>C.value(G.neg(curl.imaginary.remainder[j]),curl.real.remainder[j])),
    velocity=leading.map((z,j)=>C.add(z,curlRemainder[j])),
    normalAmplitude=C.value(dot(G,normal,amplitude.map(z=>z.real)),dot(G,normal,amplitude.map(z=>z.imaginary))),
    rawLeading=Object.fromEntries(parts.map(part=>[part,cross(G,normal,raw[part]).map(x=>G.neg(G.mul(km,x)))])),
    tripleChecks=parts.flatMap(part=>rawLeading[part].map((x,j)=>check('mapped-full-triple-product-'+part+'-'+j,x,
      G.sub(amplitude[j][part],G.div(G.mul(normal[j],normalAmplitude[part]),n2))))),
    geometryChecks=[check('common-phase-angular-radial-connection',G.add(D.Dr(normal[1]),G.div(normal[1],R))),
      check('common-phase-angular-axial-constant',D.Dz(normal[1])),
      check('common-phase-mixed-radial-axial',D.Dr(normal[2]),D.Dz(normal[0])),
      check('common-inverse-radius-axial-constant',D.Dz(G.inv(R))),
      ...parts.map(part=>check('actual-mapped-potential-mixed-partials-'+part,curl[part].mixedRZ,curl[part].mixedZR))],
    divergence=C.add(C.derivative(velocity[0],D.Dr),C.scale(G.inv(R),velocity[0]),C.derivative(velocity[2],D.Dz),
      C.imaginary(km,C.value(dot(G,normal,velocity.map(z=>z.real)),dot(G,normal,velocity.map(z=>z.imaginary))))),
    cutoffChecks=mapped.expected.flatMap((z,j)=>parts.map(part=>check('mapped-principal-two-terms-retained-'+j+'-'+part,
      z[part],G.add(mapped.remainingSource[j][part],mapped.derivativeSource[j][part])))),
    checks=[...phaseChecks,...tripleChecks,...geometryChecks,...cutoffChecks,
      ...bodies.map(row=>({id:'full-mapped-potential-body-'+row.part+'-'+row.component,pass:row.pass})),
      {id:'original-principal-cutoff-equation-retained',pass:pathCutoff.checks.every(x=>x.pass)&&!pathCutoff.principalCutoffResidualDeclaredZero},
      {id:'zero-data-constraint-follows-from-actual-forced-system',pass:inverse.identities.checks.every(x=>x.pass)&&inverse.scope.exactZeroDataForcedSolutionDefined}],
    result={schema:'MathScope.N6.ExactCommonTorusMappedForcedCurl/1',G,inverse,geometry,phase,m,k,
      mapping:{variable:w,pulseValue,parameters,pathValueSubstitutedBeforeSpatialDerivative:true,
        commonYTorusUsed:true,sourcePathInvarianceCertified:false,preimagesOrDeckCopiesIdentified:false},
      normal:{value:normal,squared:n2,phaseGradient},cutoff:{path:pathCutoff,mapped},
      potential:{raw,shared,bodies,physicalComplex:raw.real.map((x,j)=>C.value(G.neg(raw.imaginary[j]),x)),
        formula:'A_m=i*n(Y) cross (psi(v(Y))*t_m(v(Y),basepoint))/(k*m*|n(Y)|^2); physical scale Q^(1/2-A).'},
      leading,curlRemainder,velocity,pressure:mapped.pressure,
      divergence:{...divergence,checks:geometryChecks,valueOnDeclaredSmoothDomain:[G.zero,G.zero],
        theorem:'MathScope.M2.Navier.full_cylindrical_curl_divergence',
        theoremSource:'lean/MathScope/M2/Navier/DifferentialAlgebra.lean',
        interpretation:'The executed common operator commutator and actual mixed-body identities discharge the full complex curl-divergence theorem; noncharacteristic and support domain membership belongs to the source attachment.'},
      identities:{checks,normalAmplitude,fullComplexPotentialCurled:true,allCylindricalConnectionsRetained:true,
        everyCommonYChainTermRetained:true,finitePartialSumSubstituted:false,
        scalarCoefficientField:'Exact Q(sqrt(2)); only the literal positive sqrt(2) has the relation square=2.',
        leading:'The checked triple product is psi*t-n*(n dot psi*t)/|n|^2. The retained zero-data constraint equation implies n dot t=0 along the authenticated source path.',
        principalCutoff:'The mapped original (1-psi)*f and psi_prime*t are both retained separately and in their full sum.'},
      scope:{exactOriginalOperatorRealization:true,complexPressureRetained:true,fullCurlRemainderRetained:true,
        genericCommonTorusMappingConstructed:true,sourceAuthenticated:false,sourcePathAndDeckDescentCertified:false,
        principalCutoffFlatnessClassCertified:false,allCorrectionStagesConstructed:false,completeN6:false}};
  if(checks.some(x=>!x.pass))fail('A mapped full forced-curl identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  seals.set(result,{G,inverse,record:record(result)});return result;
}

export function assertMappedForcedAngularCurl(result){
  const seal=seals.get(result);
  if(!seal||seal.G!==result.G||seal.inverse!==result.inverse||seal.record!==record(result))
    fail('Use the unchanged privately constructed common-torus mapped forced curl.');
  assertSourceCoupledExpressions(result.G,result.G.baseGraph);assertForcedAngularInverse(result.inverse);return true;
}

export function mappedForcedAngularCurlRoots(result){
  assertMappedForcedAngularCurl(result);
  return [...new Set([...result.velocity.flatMap(z=>[z.real,z.imaginary]),result.pressure.real,result.pressure.imaginary,
    ...result.potential.shared.real,...result.potential.shared.imaginary,
    ...result.cutoff.mapped.expected.flatMap(z=>[z.real,z.imaginary])])];
}
