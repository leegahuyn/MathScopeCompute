/** MathScope M3: staged, fail-closed Signed substep after the authenticated Forced current.
 *
 * This module builds the ACTUAL SOURCE RECIPE for Σ, the original fixed-H,
 * fixed-positive-a signed inverse, and both unlocalized signed potential/curl
 * components. The caller's dependency service MUST be the original PRIVATE
 * source bridge; this standalone mathematical kernel issues NO original
 * Signed-Current private seal. There is deliberately no `completeCurrent`.
 */
import {certifySignedTangencyByOriginalFrame} from './signed-source-frame-tangency.mjs';
export const SIGNED_CANDIDATE_SCHEMA='MathScope.N6.GenericSignedAfterForcedCandidate/1';
export const COVARIANCE_COMPONENTS=Object.freeze(['rr','rtheta','rz','thetatheta','thetaz','zz']);
const error=(code,message)=>{const e=new Error(message);e.code=code;throw e;};
const isRoot=(G,id)=>Number.isSafeInteger(id)&&id>=0&&!!G.nodes?.[id];
const checkRoot=(G,id,label)=>{if(!isRoot(G,id))error('MISSING_SOURCE_ROOT',`${label} is absent from this original graph.`);return id;};
const checkVector=(G,x,n,label)=>{if(!Array.isArray(x)||x.length!==n)error('MISSING_SOURCE_VECTOR',`${label} needs ${n} roots.`);x.forEach((id,i)=>checkRoot(G,id,`${label}[${i}]`));return x;};
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const checkModes=(templates,currentGraphForModes)=>{
  if(!Array.isArray(templates)||templates.length!==10)error('INCOMPLETE_ORIGINAL_COVER','Ten original fixed sign/difference templates are mandatory.');
  const keys=new Set(),perSign=new Map([[0,0],[1,0]]);
  for(const t of templates){
    if(!t||typeof t.key!=='string'||keys.has(t.key)||![0,1].includes(t.signIndex)||
       !Number.isInteger(t.levelDifference)||t.levelDifference<0||t.levelDifference>4||
       !Array.isArray(t.waveRows))error('INVALID_ORIGINAL_TEMPLATE','Missing or duplicated signed cover/level template.');
    keys.add(t.key);perSign.set(t.signIndex,perSign.get(t.signIndex)+1);
    const modes=new Set(t.waveRows.map(r=>r.m));
    if(modes.size!==t.waveRows.length||[...modes].some(m=>!Number.isSafeInteger(m)||m===0||!modes.has(-m))||
       !modes.has(-1)||!modes.has(1))error('DROPPED_PRIOR_HARMONIC','Keep the complete finite current ±m inventory (including both primary modes).');
    if(!t.waveRows.every(r=>Array.isArray(r.velocity)&&r.velocity.length===3&&
      r.velocity.every(z=>isRoot(currentGraphForModes,z?.real)&&isRoot(currentGraphForModes,z?.imaginary))&&
      isRoot(currentGraphForModes,r.pressure?.real)&&isRoot(currentGraphForModes,r.pressure?.imaginary)))
      error('MISSING_FULL_WAVE_PRESSURE','Each retained original angular mode needs its full pressure and velocity.');
  }
  if([...perSign.values()].some(n=>n!==5))error('INCOMPLETE_ORIGINAL_COVER','Five differences per original sign are required.');
  return [...keys];
};
function sharesOriginalBaseGraph(coupled,base){
  const seen=new Set();let node=coupled;
  // Original SourceCoupledExpressions wraps an auxiliary facade, which wraps
  // the GlobalSourceExpressions graph. Accept only this actual baseGraph chain.
  for(let depth=0;depth<8&&node&&!seen.has(node);depth++){
    if(node===base)return true;
    seen.add(node);node=node.baseGraph;
  }
  return false;
}
function assertShape(forced){
  const G=forced?.G,initial=forced?.input,originalPressure=initial?.mean?.temporal?.pressure,
    current=originalPressure?.current,band=current?.band,geometry=current?.mean?.geometry;
  if(!Array.isArray(G?.nodes)||initial?.G!==G||!current||!current.G||
     current.G!==band?.G||!sharesOriginalBaseGraph(G,current.G))
    error('CROSS_SOURCE_GRAPH','Only the same original initialized/forced/mean/band graph is admissible.');
  const W=forced?.mean?.fullCurrentCovariance,M=forced?.mean?.mean,
    P=forced?.mean?.pressure;
  if(!W||!COVARIANCE_COMPONENTS.every(k=>isRoot(G,W[k]))||M?.fullAngularCovariance!==W||
    !Array.isArray(forced.mean.checks)||!forced.mean.checks.length||!forced.mean.checks.every(c=>c.pass===true))
    error('STALE_OR_INCOMPLETE_FORCED_MEAN','Signed target must come from the latest COMPLETE Forced current and verified pressure refresh.');
  for(const [name,operand] of Object.entries({Etheta:M.Etheta,Ez:M.Ez,P:M.P,Jtheta:M.Jtheta,Jz:M.Jz,
     latestPressure:P.value,initialRho:geometry?.rho,initialChi:geometry?.chi,cRho:geometry?.cRho,
     radialR:geometry?.R,axialZ:geometry?.Z,radialLeft:geometry?.innerRadius,radialRight:geometry?.outerRadius,
     radialVariable:geometry?.radialVariable,epsilon:band?.geometry?.epsilon}))checkRoot(G,operand,name);
  if(P?.value!==forced.global.fullMeanPressure||
     M?.P===undefined||M?.Jtheta===undefined||M?.Jz===undefined||
     forced?.mean?.fullCurrentCovariance!==W)
    error('STALE_FORCED_PRESSURE','The post-Forced full pressure must be the one retained by the full physical current.');
  const H=band?.target?.H,a=band?.target?.squareRootWeights;
  if(!Array.isArray(H)||H.length!==2||H.some(r=>!Array.isArray(r)||r.length!==2)||
     !Array.isArray(a)||a.length!==2)error('MISSING_FIXED_ORIGINAL_H','Original H and fixed positive amplitudes must be retained.');
  H.flat().forEach(x=>checkRoot(G,x,'original H'));a.forEach(x=>checkRoot(G,x,'original a'));
  const weight=band.target.weights,inverseChecks=band.target.inverseChecks;
  if(!Array.isArray(weight)||weight.length!==2||
     !Array.isArray(inverseChecks)||!inverseChecks.length||!inverseChecks.every(c=>c.pass===true)||
     a.some((id,j)=>G.nodes[id]?.op!=='sqrt_positive'||G.nodes[id]?.args?.[0]!==weight[j]))
    error('ORIGINAL_FIXED_POSITIVITY_UNVERIFIED','The unchanged positive square-root amplitudes and fixed H inverse require authentic original source checks.');
  if(!Array.isArray(band.families)||band.families.length!==2||!isRoot(G,band.coordinates?.R)||!isRoot(G,band.coordinates?.Z))
    error('INVALID_ORIGINAL_BAND','Expected the same two original signed source families.');
  checkModes(forced.templates,G);
  return {G,initial,originalPressure,current,band,geometry,W,M,P,H,a};
}
/** This returns ACTUAL formula roots under authenticated-service conditions,
 * not a verified completed subsequent current, nor numerical enclosures.
 */
export function buildSignedSourceCandidateFromCheckedForced(forced,services={},options={}){
  if(!services||!['assertOriginalForced','assertOriginalInitialized','signedInverse','fullCurl','homogeneousPressure','graphEqual','assertLatestStress'].every(x=>typeof services[x]==='function'))
    error('MISSING_ORIGINAL_PRIVATE_SERVICES','Use the repository private source entry point, not ad-hoc formulas.');
  if(Object.keys(options).some(k=>!['onProgress','maxAdditionalNodes'].includes(k)))
    error('INVALID_SIGNED_OPTIONS','The original H, a, target, modes and fields are not caller-selectable.');
  if(services.assertOriginalForced(forced)!==true||services.assertOriginalInitialized(forced.input)!==true)
    error('ORIGINAL_PRIVATE_SEAL_REJECTED','Original source authentication did not succeed.');
  const s=assertShape(forced),{G,band,current,geometry:g,W,M,P,H,a,initial,originalPressure}=s;
  const eps=band.geometry.epsilon;
  const maxAdditionalNodes=options.maxAdditionalNodes??200000;
  if(!Number.isSafeInteger(maxAdditionalNodes)||maxAdditionalNodes<1||maxAdditionalNodes>5000000)
    error('INVALID_WORK_BUDGET','Use a finite append-only work budget.');
  const start=G.nodes.length,progress=where=>{
    if(G.nodes.length-start>maxAdditionalNodes)error('SIGNED_SOURCE_RESOURCE_LIMIT',`Work cap exceeded at ${where}; incomplete stage must not be promoted.`);
    options.onProgress?.({where,nodesAdded:G.nodes.length-start});
  };
  // Proposition 9.6 Step 2 uses <E_theta>_Y and <E_z>_Y,
  // NOT the raw Y-dependent E fields. The previously staged generic kernel
  // differentiated the raw residual directly. That route is NOT admissible.
  // Use the original, privately sealed Corollary 8.5 stress constructor,
  // which takes the exact normalized two-torus Haar means, pressure and
  // all radial / auxiliary endpoint terms from the complete Forced state.
  const latestStress=services.latestStress;
  if(services.assertLatestStress(latestStress)!==true ||
     latestStress?.G!==G || latestStress?.input!==forced ||
     latestStress?.source?.latestCovariance!==W ||
     latestStress?.source?.latestFullMeanPressure!==P.value ||
     latestStress?.compatibility?.rawIntegralNodesPreserved!==true ||
     latestStress?.compatibility?.mechanicalRawIntegralReduction!==false ||
     latestStress?.compatibility?.sourceTheoremsAppliedToConstructedOperands!==true ||
     !Array.isArray(latestStress?.checks)||!latestStress.checks.length||
     latestStress.checks.some(c=>c.pass!==true))
    error('UNAUTHENTICATED_COR85_STRESS','Require the original private Corollary 8.5 stress of this exact Forced state.');
  const fresh=latestStress.stress;
  if(fresh?.meanInput?.Etheta!==M.Etheta || fresh?.meanInput?.Ez!==M.Ez ||
     fresh?.meanInput?.P!==M.P ||fresh?.meanInput?.Jtheta!==M.Jtheta ||
     fresh?.meanInput?.Jz!==M.Jz ||
     !Array.isArray(fresh?.rows)||fresh.rows.length!==2 ||
     !Array.isArray(latestStress.Sigma)||latestStress.Sigma.length!==2)
    error('STALE_COR85_MEAN','Signed target must use the current full tangential residual and defects.');
  const {Y}=originalPressure.geometry;
  if(!Array.isArray(Y)||Y.length!==2)
    error('MISSING_ORIGINAL_AUXILIARY_TORUS','Original two-torus Haar coordinates are required.');
  const expectedResiduals=[M.Etheta,M.Ez],
    sigmaRows=fresh.rows,
    residualSources=sigmaRows.map(row=>row.source),
    weightedSources=sigmaRows.map(row=>row.weightedSource),
    integrals=sigmaRows.map((row,j)=>({
      order:2-j,weighted:row.weightedSource,
      integrand:row.integrals?.radialVariable===undefined?null:
        G.substitute(row.weightedSource,g.R,row.integrals.radialVariable),
      partial:row.integrals?.left,whole:row.integrals?.whole,
      value:row.value,cutoffRemainder:row.cutoffRemainder,
      normalizedHaarMean:row.mean,
      haarSource:row.residual,
      authenticatedCor85Row:row.name,
      originalRadialSource:row.source
    })),
    Sigma=[...latestStress.Sigma],
    sigmaPointwiseChecks=sigmaRows.map((row,j)=>({
      component:j,normalizedBump:row.sourceLinearity,
      fullFTCCutoffIdentity:row.divergenceCheck,
      normalizedHaarBeforeRadialPrimitive:true,
      pass:row.residual===expectedResiduals[j] &&
        row.weight===2-j && row.sourceLinearity?.pass===true &&
        row.divergenceCheck?.pass===true &&
        row.value===fresh.Sigma[j] &&
        !!row.integrals &&
        Number.isSafeInteger(row.integrals.left) &&
        Number.isSafeInteger(row.integrals.whole) &&
        row.compatibility?.mechanicalIntegralReduction===false &&
        [row.mean,row.source,row.integrals.whole].every(x=>
          Number.isSafeInteger(x)&&G.nodes[x] &&
          Y.every(y=>!G.freeCoordinates(x).has(y)))
    }));
  if(!sigmaPointwiseChecks.every(x=>x.pass))
    error('SIGNED_SIGMA_HAAR_OR_FTC_FAILED',
      'Signed source requires the authenticated, Y-averaged Corollary 8.5 stress, its exact FTC and full compatibility terms.');
  Sigma.forEach(x=>checkRoot(G,x,'original authenticated Corollary8.5 Sigma'));
  progress('actual-updated-forced-Sigma');
  // The original inverse checks all fixed-H/fixed-a factor-two identities.
  const inversion=services.signedInverse(G,{H,amplitudes:a,epsilon:eps,target:Sigma});
  if(inversion?.pass!==true||!Array.isArray(inversion.deltaAmplitude)||inversion.deltaAmplitude.length!==2||
     !inversion.deltaAmplitude.every(id=>isRoot(G,id))||
     !inversion.checks?.every(x=>x.pass===true))
    error('ORIGINAL_SIGNED_INVERSE_FAILED','Do not promote an unverified H/a signed inverse.');
  const {xi}=band.cutoffs,{R:Rc,Z:Zc}=band.coordinates,
    slowCutoff=current.local?.slowCutoff?.body,
    geometry=current.geometry,params=current.local?.parameters,
    k=band.geometry.k;
  checkRoot(G,slowCutoff,'original slow cutoff');checkRoot(G,k,'original wave carrier');
  if(!Array.isArray(params)||!params.length||!params.every(x=>isRoot(G,x)))
    error('MISSING_SOURCE_PARAMETERS','Signed original function parameters must be source bound.');
  const rows=[];
  for(let j=0;j<2;j++){
    const f=band.families[j],da=inversion.deltaAmplitude[j];
    checkVector(G,f.t,3,'fixed signed tangent');checkVector(G,f.frame?.n,3,'fixed frame normal');
    for(const [name,v] of Object.entries({da,normalSquared:f.frame.nSquared,xi,radialFast:geometry.radialFast}))checkRoot(G,v,name);
    const amplitude=f.t.map(x=>G.mul(G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x)),
      weighted=amplitude.map(x=>G.mul(slowCutoff,x)),
      rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared))),
      potential=rawPotential.map((v,component)=>G.share(v,params,`GenericSignedAfterForced_${j}_${component}`)),
      curl=services.fullCurl(G,{R:Rc,Z:Zc,xi,epsilon:eps,radialFast:geometry.radialFast,k,normal:f.frame.n,potential}),
      homogeneousPressure=services.homogeneousPressure(G,{normal:f.frame.n,nPrime:f.frame.nPrime,
        K:f.frame.principalK,k,amplitude:weighted});
    // Use the actual moving-frame factorization U(n), B=UJ and t=Bz.
    // Atomizing the weighted components erases the mathematical tangency.
    // Synthetic fixtures with no authenticated frame retain the strict
    // preexisting checker; they never gain a private original-source seal.
    const sourceFrame=!!(f.frame?.U&&f.frame?.J&&f.frame?.B&&f.frame?.nt&&f.z);
    const tangency=sourceFrame ? certifySignedTangencyByOriginalFrame(G,f,weighted,{
      graphEqual:services.graphEqual,epsilon:eps,deltaAmplitude:da,
      chi:band.cutoffs.chi,psi:band.cutoffs.psi,slowCutoff
    }) : services.graphEqual(G,
      G.add(...f.frame.n.map((n,index)=>G.mul(n,weighted[index]))),G.zero,
      [...f.frame.n,...weighted]);
    if(tangency?.pass!==true)error('SIGNED_TANGENCY_UNPROVED','The actual signed amplitude must retain exact normal tangency.');
    checkVector(G,curl?.leading,3,'real full signed curl');checkVector(G,curl?.remainder,3,'imaginary full signed curl');
    if(!isRoot(G,homogeneousPressure?.value?.imaginary)||
       homogeneousPressure?.value?.real!==G.zero||homogeneousPressure?.identity?.pass!==true)
      error('SIGNED_PRIMARY_PRESSURE_INCOMPLETE','Retain the original moving-normal homogeneous signed pressure.');
    if(!Array.isArray(curl?.divergence?.checks)||!curl.divergence.checks.every(c=>c.pass===true))
      error('SIGNED_CURL_INCOMPLETE','All original full-curl divergence checks must pass.');
    rows.push({signIndex:j,sourceSign:f.sign,originalPositiveA:a[j],deltaAmplitude:da,
      amplitude,weighted,potential,curl,tangency,completeCylindricalCurl:true,
      homogeneousSignedAngularPressure:homogeneousPressure.value,globallyAssembledCoverField:null});
    progress(`fixed-sign-${j}-potential-and-full-curl`);
  }
  if(services.assertOriginalForced(forced)!==true)
    error('MUTATED_FORCED_SOURCE','Original Forced source failed its private seal after graph extension.');
  const result={schema:SIGNED_CANDIDATE_SCHEMA,sourceGraph:G,originalForced:forced,
    source:{originalPaperSHA256:forced.source.paperSHA256,
      originalParametersSHA256:forced.source.parameterExpressionSHA256,
      preservedFullCurrent:true,fixedHFromOriginalBand:true,positiveAUnchanged:true,
      privateServicesReportedValid:true,sourceIdentityCheckedByOriginalBridgeOnly:false},
    signed:{Sigma,sourceOfSigma:'AUTHENTICATED_ORIGINAL_COR85_NORMALIZED_HAAR',
      originalMeanStress:latestStress,weightedSources,residualSources,integrals,sigmaPointwiseChecks,inversion,rows},
    requiredNext:['verify zero weighted source moments with full current and endpoint terms',
      'authenticate the new signed homogeneous pressure on each full local label',
      'assemble two signed substeps into all 162 original cover contributions',
      'recompute the full pressure/P/J and physical PDE on the ACTUAL updated field',
      'validate complete next-current source and all-order bounds'],
    scope:{originalForcedPrivateSealValidatedByRealModule:false,
      originalSignedSigmaPointwiseFTCPassed:true,
      originalSignedSigmaHaarSourceAuthenticated:true,
      originalSourceSignedAmplitudeASTGenerated:true,originalSignedLocalPotentialASTGenerated:true,
      originalSignedFullCurlASTGenerated:true,
      originalSignedHomogeneousPressureASTGenerated:true,
      actualSignedWholeCurrentConstructed:false,
      allOriginalCoverSignedContributionsAssembled:false,
      weightedMomentZeroIndependentlyCertified:false,
      wholePressureAndPDEResidualAfterSigned:false,
      originalSignedPrivateSealIssued:false,
      numericalFieldEnclosureComputed:false,completedOriginalM3Criteria:0}};
  return result;
}
