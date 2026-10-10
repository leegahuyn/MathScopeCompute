/** The original N5-06 source family, with an explicit all-band domain.
 * The exercised finite member is not silently assumed to satisfy q<q*.
 * The large reproducible function graph is hashed once; the public receipt
 * contains source roots and bounded exact records, never a duplicate graph.
 */
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {attachActualCovarianceTarget} from './actual-covariance-source-target.mjs';
import {actualCovarianceFiniteIntegrals} from './actual-covariance-source-integrals.mjs';
import {sourceSquaredProductPartition,assertSourceSquaredProductPartition,covarianceGlobalAssemblyRecipe} from './actual-covariance-global-assembly.mjs';
import {uniformSupportPalette} from './source-support.mjs';
import {torusExactIdentityAudit} from './source-geometry.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export const ACTUAL_COVARIANCE_CRITERION=Object.freeze({id:'N5-06',title:'두 family의 positive covariance',
  criteria:'(7.27)의 angular 1/2 및 Haar Jacobian을 포함해 Hcov를 적분하고 y=Hcov^ −1T0,*를 푼다. 합격: y±>0, det lower\nbound, C(W0)=εT0,* 및 global (7.30)을 확인한다. 같은 slow box를 ±로 두 번 합산하지 않는다.',sourcePage:60});

function requestOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','anchorOrder','ellExact','terms'].includes(k)))fail('INVALID_INPUT','Use only the pinned source, one finite band selector, and a displayed Volterra term count. Fields, thresholds, targets and completion flags are generated internally.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);
  if(input.ellExact!==undefined&&input.anchorOrder!==undefined)fail('INVALID_INPUT','anchorOrder and ellExact are mutually exclusive.');
  const terms=input.terms??1;if(!Number.isSafeInteger(terms)||terms<0||terms>2)fail('RESOURCE_LIMIT','The compact certificate displays zero, one, or two exact ordered-integral terms; its factorial tail is always retained.');
  if(input.ellExact!==undefined){if(typeof input.ellExact!=='string'||!/^[0-9]+$/.test(input.ellExact)||input.ellExact.length>2048||BigInt(input.ellExact)<1n)fail('INVALID_INPUT','ellExact is a positive exact integer string.');return {sourceProfile,ellExact:String(BigInt(input.ellExact)),terms};}
  const anchorOrder=input.anchorOrder??1;if(!Number.isSafeInteger(anchorOrder)||anchorOrder<1)fail('INVALID_INPUT','anchorOrder is a positive safe integer.');if(anchorOrder>2)fail('RESOURCE_LIMIT','The compact public receipt supports canonical anchors one and two. The underlying actual prefix is retained; a larger requested prefix is not set to zero.');
  return {sourceProfile,anchorOrder,terms};
}

/** A root-index-independent source-bound subgraph makes independence of the
 * exercised band directly reproducible. The actual positive constants can
 * include explicit cutoff integrals. Their bound variables are alpha-renamed;
 * no free display coordinate or unnamed function oracle is accepted. */
export function covariancePositiveRootProgram(G,roots){
  const nodes=[],ids=new Map(),lookup=new Map();let boundSerial=0;
  const insert=(op,args)=>{const key=JSON.stringify([op,args]);let out=lookup.get(key);if(out===undefined){out=nodes.length;nodes.push({op,args});lookup.set(key,out);}return out;};
  const visit=(id,environment=new Map())=>{const memoKey=id+':'+JSON.stringify([...environment]);if(ids.has(memoKey))return ids.get(memoKey);const n=G.nodes[id];if(!n)fail('INVALID_SOURCE_CONSTRUCTION','Missing threshold operand.');let args;
    if(n.op==='coordinate'){if(!environment.has(id))fail('INVALID_SOURCE_CONSTRUCTION','A common source threshold has a free coordinate.');return environment.get(id);}
    if(['rational','source_parameter'].includes(n.op))args=[...n.args];
    else if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))args=n.args.map(x=>visit(x,environment));
    else if(['inverse','sqrt_positive','exp','log_positive','ceiling','sine','cosine'].includes(n.op))args=[visit(n.args[0],environment)];
    else if(['integer_power','source_step_derivative'].includes(n.op))args=[visit(n.args[0],environment),n.args[1]];
    else if(n.op==='definite_integral'){
      const left=visit(n.args[2],environment),right=visit(n.args[3],environment),bound=insert('coordinate',['bound_'+boundSerial++]);
      const nested=new Map(environment);nested.set(n.args[1],bound);args=[visit(n.args[0],nested),bound,left,right];
    }
    else fail('INVALID_SOURCE_CONSTRUCTION','A common threshold must be a fixed source expression, not '+n.op+'.');
    const out=insert(n.op,args);ids.set(memoKey,out);return out;};
  for(const id of Object.values(roots))if(G.freeCoordinates(id).size)fail('INVALID_SOURCE_CONSTRUCTION','The common source threshold cannot depend on display coordinates.');
  const mapped=Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,visit(id)]));
  return {schema:'MathScope.CovarianceFixedSourcePositiveProgram/1',parameterExpressionSHA256:G.source.parameterExpressionSHA256,nodes,roots:mapped};
}

function attachSourcePalette(operator){
  const {G,geometry:g,constants:c}=operator,q=(n,d=1)=>G.q(n,d),palette=uniformSupportPalette(),torus=torusExactIdentityAudit();
  if(!palette.pass||!palette.commonToAllBandsAndLabels||!torus.pass)fail('INTERNAL_VALIDATION','The actual all-label support palette or Haar geometry failed.');
  const floor=x=>G.neg(G.ceiling(G.neg(x))),mod=(x,m)=>G.sub(x,G.mul(q(m),floor(G.div(x,q(m))))),grid=[0,1,2].map(j=>G.fresh('actual_global_mesh_integer_'+j));
  let color=mod(g.ell,9);for(const a of grid)color=G.add(G.mul(q(5),color),mod(a,5));
  const centers=[0,1].map(signBit=>[G.div(G.add(G.mul(q(2),color),q(signBit+1)),q(1048576)),G.zero]);
  const Yi=[G.fresh('actual_global_auxiliary_torus_0'),G.fresh('actual_global_auxiliary_torus_1')];
  const rectangleRows=operator.families.map((family,i)=>{
    const copy=Yi.map((x,j)=>floor(G.add(G.sub(x,centers[i][j]),q(1,2))));
    const offset=Yi.map((x,j)=>G.sub(G.sub(x,centers[i][j]),copy[j])),dot=a=>G.add(...a.map((x,j)=>G.mul(x,offset[j])));
    const xi=G.div(dot(g.rectangleBasis[0]),g.Dgeom),eta=G.div(dot(g.rectangleBasis[1]),g.Dgeom),v=G.div(G.add(eta,g.r0),g.ci);
    return {sign:family.sign,color:G.add(G.mul(q(2),color),q(i)),center:centers[i],copy,xi,eta,v,
      chartJacobian:G.mul(g.Dgeom,g.ci),amplitudeDependsOnXi:false,translationChangesH:false};
  });
  const power=(x,a)=>G.exp(G.mul(a,G.log(x))),Lambda=G.sub(q(4),G.sqrt(q(2))),rho=G.div(G.log(Lambda),G.log(g.Tg)),dr=G.sub(G.mul(q(2),G.add(G.one,c.h),rho),G.div(c.h,q(100000)));
  const physicalR=G.mul(G.sqrt(g.Q),operator.coordinates.R),physicalZ=G.mul(power(g.Q,c.D),operator.coordinates.Z),physicalTau=G.mul(g.Q,operator.coordinates.T),physicalTime=G.sub(G.one,physicalTau);
  const radialFast=G.mul(power(Lambda,g.paletteIndex),power(physicalR,dr)),timeFast=G.mul(power(g.Tg,g.paletteIndex),physicalTime);
  const physicalYi=[0,1].map(j=>G.add(G.mul(g.rectangleBasis[0][j],radialFast),G.mul(g.rectangleBasis[1][j],timeFast)));
  // Keep exact integers and algebraic records. The old diagnostic torus
  // interval is not copied into a source-vs-browser mathematical receipt.
  const exactPalette={schema:palette.schema,paletteSize:palette.paletteSize,bandPeriod:9,gridPeriod:5,signColors:2,deltaMax:4,modulus:palette.modulus,r0Exact:palette.r0Exact,
    centers:palette.centers,allOrderedCenterConstraints:palette.allOrderedCenterConstraints,enlargedRectangleSeparation:palette.enlargedRectangleSeparation,
    allBandsCoverage:palette.allBandsCoverage,matrixPowers:palette.matrixPowers,commonToAllBandsAndLabels:true,
    coveringDifference:{ell0AtLeast:8,sourceHUpper:'1/64',maximumDifference:4,pass:palette.coveringDifferenceCertificate.pass},pass:palette.pass};
  return {grid,Yi,rectangleRows,physicalMap:{r:physicalR,z:physicalZ,tau:physicalTau,t:physicalTime,Lambda,rho,dr,Yi:physicalYi},palette:exactPalette,torus,
    domains:{grid:'Z^3, fixed separately in every dyadic band',Yi:'R^2/Z^2, normalized Haar measure',copy:'The actual coordinatewise nearest-integer lift floor(Yi-center+1/2). Any supported source rectangle lies within this lift because its half width is <3*r0<1/2.'},
    commonPhysicalTorus:'Yi=Jg^i Y, Y=v_r*r^d_r+v_t*t, Jg=[[3,1],[1,5]]. Each member uses the same original physical torus map. Translation by its actual palette center changes neither H nor its positive mass.',
    crossTerms:'Every pair of different labels with overlapping slow supports has disjoint enlarged auxiliary supports. The exact finite palette proves this for the complete countable source mesh; it is not an enumeration of displayed labels.'};
}

function attachActualSlowPartition(operator){
  const {G,geometry:g,chart,constants:c,coordinates:{R,Z,T}}=operator,q=(n,d=1)=>G.q(n,d),floor=x=>G.neg(G.ceiling(G.neg(x))),power=(x,a)=>G.exp(G.mul(a,G.log(x)));
  const bandCoordinate=G.neg(G.div(G.log(chart.qActual),G.log(q(2)))),nearestBand=floor(G.add(bandCoordinate,q(1,2))),bandOffset=G.sub(bandCoordinate,nearestBand);
  const bands=[-1,0,1].map(relativeBand=>{
    const ell=G.add(nearestBand,q(relativeBand)),Q=G.exp(G.neg(G.mul(ell,G.log(q(2))))),ratio=G.div(g.Q,Q),slow=[G.mul(R,G.sqrt(ratio)),G.mul(Z,power(ratio,c.D)),G.mul(T,ratio)];
    const meshCoordinates=slow.map(x=>G.mul(G.pow(ell,6),x)),nearestMesh=meshCoordinates.map(x=>floor(G.add(x,q(1,2)))),offsets=meshCoordinates.map((x,j)=>G.sub(x,nearestMesh[j]));
    return {relativeBand,ell,Q,ratio,slow,meshCoordinates,nearestMesh,offsets};
  });
  const partition=sourceSquaredProductPartition(G,{bandOffset,meshOffsets:bands.map(b=>b.offsets)});
  const mod=(x,m)=>G.sub(x,G.mul(q(m),floor(G.div(x,q(m)))));
  const labels=partition.rows.map(row=>{
    const band=bands[row.relativeBand+1],grid=band.nearestMesh.map((x,j)=>G.add(x,q(row.relativeMesh[j])));let color=mod(band.ell,9);
    for(const a of grid)color=G.add(G.mul(q(5),color),mod(a,5));
    const colors=[G.mul(q(2),color),G.add(G.mul(q(2),color),G.one)],centers=colors.map(x=>[G.div(G.add(x,G.one),q(1048576)),G.zero]);
    return {key:row.key,ell:band.ell,Q:band.Q,grid,colors,centers,signs:[1,-1],countInGlobalSum:1};
  });
  return {partition,bandCoordinate,nearestBand,bandOffset,bands,labels,
    actualCoordinateIdentity:'tband=-log(q)/log2; b0=floor(tband+1/2); ell_j=b0+j; Q_j=2^-ell_j; C_ellj=(R*sqrt(Q/Q_j),Z*(Q/Q_j)^D,T*Q/Q_j); mesh=ell_j^6*C_ellj with fixed origin0.',
    nearestOffsetProof:'For every real x, a=floor(x+1/2) gives -1/2<=x-a<1/2. Thus every offset premise of the complete partition is met by the actual source coordinates.',
    profileCompatibility:'s_j=q/Q_j=(Q/Q_j)*s, hence R_j^2/(2*s_j)=X and Z_j/s_j^D=eta exactly. Every relative band therefore has the same actual raw leading target T0(X,eta).',
    actualPhysicalPoint:{r:G.mul(G.sqrt(g.Q),R),z:G.mul(power(g.Q,c.D),Z),tau:G.mul(g.Q,T)},
    noIndependentOffsetCoordinates:true,gridOrigins:[0,0,0]};
}

/** This is the sole actual-source authenticator for the conditional global
 * partition lemma. It consumes private producers, never caller receipts. */
export function prepareActualCovarianceFamilyProgram(input={},context={}){
  const request=requestOf(input);context.checkCancelled?.();const {terms,...operatorRequest}=request;
  const operator=prepareActualCovarianceOperator(operatorRequest,context),target=attachActualCovarianceTarget(operator,context),integrals=actualCovarianceFiniteIntegrals(operator,{terms},context),G=operator.G,q=(n,d=1)=>G.q(n,d),bounds=target.bounds;
  const auxiliary=attachSourcePalette(operator),actualPartition=attachActualSlowPartition(operator),partition=actualPartition.partition;
  const assembly=covarianceGlobalAssemblyRecipe(G,{h:operator.constants.h,q:operator.chart.qActual,Q:operator.geometry.Q,target:target.raw.atSlowProfile,partition});
  const waveRows=operator.families.map((family,i)=>{
    const amplitude=G.mul(G.sqrt(operator.geometry.epsilon),G.sqrt(target.weights[i]),operator.cutoffs.chi,operator.cutoffs.psi,G.cosine(G.mul(operator.geometry.k,family.phase)));
    const localCoordinateWave=family.t.map(component=>G.mul(amplitude,component)),rectangle=auxiliary.rectangleRows[i];
    const auxiliaryMappedWave=localCoordinateWave.map(body=>{
      const composed=G.simultaneousSubstitute(body,[operator.cutoffs.xi,operator.coordinates.v],[rectangle.xi,rectangle.v]);
      const supportedTime=G.choose(rectangle.v,G.zero,operator.geometry.Ls,G.zero,composed,G.zero);
      return G.choose(rectangle.xi,G.neg(operator.geometry.r0),operator.geometry.r0,G.zero,supportedTime,G.zero);
    });
    const Xa=G.parameter('Xa'),Xb=operator.background.prepared.bootstrap.actualHeat.heat.Xb;
    const physicalLocalWave=auxiliaryMappedWave.map(body=>G.choose(operator.chart.X,Xa,Xb,G.zero,G.simultaneousSubstitute(body,auxiliary.Yi,auxiliary.physicalMap.Yi),G.zero));
    return {sign:family.sign,localCoordinateWave,auxiliaryMappedWave,physicalLocalWave,amplitude,weight:target.weights[i],rectangle,
      physicalMapping:'First compose the local xi,v wave with its actual nearest-copy torus rectangle, then substitute Yi=Jg^i*(v_r*r^d_r+v_t*t), t=1-tau. The flat cutoffs make the extension zero before a Volterra value outside0<=v<=Ls is evaluated.',
      domain:'A source-admissible member ell>=ellMinimum. This expression for the exercised member is not a claim that its weight is positive.'};
  });
  const activeBandProof={ell0:bounds.selection.ellMinimum,qStar:bounds.selection.qStar,buffer:4,
    physicalDomain:'0<q<qStar, tau>=0, Xa<=X<=Xb, eta in[-1,1]',
    derivation:'Let t=-log(q)/log(2). Then q<2^(-ell0-4) implies t>ell0+4. A nonzero original band bump has |t-ell|<3/4, hence ell>ell0+13/4 and in particular ell>=ell0. Also 1/2<q/Q_ell<2. Therefore every active band satisfies every internally generated source condition, including the original palette lower band8.',
    noFloatingThresholdComparison:true,displayedMemberMembershipUsed:false};
  const checks=[
    {id:'unchanged-private-actual-source',pass:assertActualCovarianceOperator(operator),detail:'Completed field, original parameters, source functions, two moving ODEs, coordinates and cutoff bodies retain their authenticated source.'},
    ...Object.entries(bounds.checks).map(([id,pass])=>({id:'uniform-'+id,pass,detail:'Internally generated source/operator/concentration premise.'})),
    {id:'full-leading-target-and-two-shear-terms',pass:target.scope.actualFullLeadingTargetConstructed&&target.raw.terms.thetaShear!==G.zero&&target.raw.terms.zShear!==G.zero,detail:'Finite I,J,S,Cp prefixes and full heat-prepared F/U/M enter the actual T0; both shear terms remain.'},
    {id:'actual-H-inverse-two-identities',pass:target.inverseChecks.every(r=>r.pass),detail:'The exact actual H functional inverse has H*y-Tstar=(0,0).'},
    {id:'genuine-finite-H-integral-tail',pass:integrals.errorTendsToZero&&!integrals.fixedNonzeroComparisonFloor&&integrals.rows.every(r=>r.absoluteError!==G.zero&&!r.finiteValueEqualsLimit),detail:'Each displayed H approximation has a nonzero source factorial tail tending to zero.'},
    {id:'same-source-angular-and-haar',pass:auxiliary.torus.pass&&operator.geometry.angularAverage===q(1,2),detail:'Nonzero integer angular carrier gives1/2; normalized Haar has no extra cover determinant.'},
    {id:'all-label-support-separation',pass:auxiliary.palette.pass&&auxiliary.palette.commonToAllBandsAndLabels,detail:'The actual2250-color palette separates all overlapping source labels, including the two signs of one box.'},
    {id:'complete-actual-partition',pass:assertSourceSquaredProductPartition(G,partition),detail:'The original smooth normalized translates include all81 possible band-specific local candidates and have exactly zero omitted complement.'},
    {id:'actual-q-chart-and-nearest-offsets',pass:actualPartition.noIndependentOffsetCoordinates&&actualPartition.bands.every(b=>b.offsets.length===3)&&actualPartition.labels.length===81,detail:actualPartition.actualCoordinateIdentity+' '+actualPartition.nearestOffsetProof},
    {id:'actual-rectangle-and-physical-wave-composition',pass:waveRows.every(r=>r.physicalLocalWave.every(id=>!G.freeCoordinates(id).has(operator.cutoffs.xi)&&!G.freeCoordinates(id).has(operator.coordinates.v)&&auxiliary.Yi.every(y=>!G.freeCoordinates(id).has(y)))),detail:'Physical wave roots contain neither the independent local xi/v nor free auxiliary Yi; every chart substitution retains its source function body.'},
    ...assembly.checks.map(r=>({...r,detail:'Actual local covariance and source palette are authenticated before the conditional global identity is used.'})),
    {id:'active-bands-satisfy-common-threshold',pass:bounds.selection.activeBandBuffer===4&&bounds.selection.conditions.some(r=>r.id==='actual-moving-frame-denominators-and-primitive-budget')&&bounds.selection.conditions.some(r=>r.id==='actual-flat-edge-direction-box'),detail:activeBandProof.derivation},
    {id:'family-not-inferred-from-displayed-band',pass:operator.scope.displayBandProvedBelowUniformQStar===false&&target.domain.exercisedMember.positiveWeightsForThisMemberCertified===false,detail:'The actual all-integer constructor and source uniform proof establish the family. A finite anchor is not promoted into its certified domain.'},
  ];
  if(!checks.every(r=>r.pass))fail('INTERNAL_VALIDATION','An actual covariance family premise or global identity failed.');
  const thresholdProgram=covariancePositiveRootProgram(G,{sourceNorm:operator.constants.Bnorm,ellMinimum:bounds.selection.ellMinimum,qStar:bounds.selection.qStar});
  const actualColumnMassLower=G.mul(operator.geometry.haarFactor,bounds.recipe.mass.massLowerCoefficient,G.sqrt(operator.geometry.Ls));
  const roots={...operator.roots,ellMinimum:bounds.selection.ellMinimum,qStar:bounds.selection.qStar,actualColumnMassLower,
    rawTargetTheta:target.raw.atSlowProfile[0],rawTargetZ:target.raw.atSlowProfile[1],targetStarTheta:target.targetChart.components[0],targetStarZ:target.targetChart.components[1],
    actualHDeterminant:target.determinant,absoluteDeterminantLower:target.absoluteDeterminantLower,yPlus:target.weights[0],yMinus:target.weights[1],
    localCovarianceTheta:target.localCovariance[0],localCovarianceZ:target.localCovariance[1],
    globalCovarianceTheta:assembly.exactReducedPhysicalSum[0],globalCovarianceZ:assembly.exactReducedPhysicalSum[1],
    globalResidualTheta:G.zero,globalResidualZ:G.zero,
    ...Object.fromEntries(integrals.rows.flatMap(r=>[['finiteHtheta_'+r.sign,r.approximateIntegrals.theta],['finiteHz_'+r.sign,r.approximateIntegrals.z],['finiteHmass_'+r.sign,r.approximateIntegrals.mass],['finiteHerror_'+r.sign,r.absoluteError]])),
    ...Object.fromEntries(waveRows.flatMap(r=>r.physicalLocalWave.map((id,j)=>['physicalWave_'+r.sign+'_'+j,id])))};
  const domain={representative:bounds.domain.representative,slowPoint:bounds.domain.slowPoint,sameBoxDistance:bounds.domain.sameBoxDistance,pulseTime:'0<=v<=Ls',
    sourceShell:{closed:'Xa<=X<=Xb',openPositiveWeights:'Xa<X<Xb',eta:['-1','1'],s:['1/2','2']},
    band:'Every original positive integer ell>=ellMinimum; actualBackgroundDyadicPrefix constructs its exact locally finite source sum.',physicalScale:'0<q<qStar for the global identity; outside the closed stress annulus both the target and waves have their exact zero extension.',
    flatEdges:'At X=Xa and Xb the actual target and both weights are zero. The source flat factors give smooth zero extension.',
    familyRestriction:'An arbitrary selected box has a fixed representative in the original annulus. The nearby slow point is in that same box; the enlarged absolute C2 domain does not extend Rayleigh positivity outside the original representative domain.'};
  const scope={actualSourceFamilyAuthenticated:true,actualUniformHColumnsCertified:true,sourceUniformQStarCertified:true,actualEveryCertifiedBoxPositiveInverse:true,
    strictPositiveWeightsOnlyOnOpenSupport:true,exactZeroWeightsAtFlatEdges:true,globalEquation730Certified:true,originalN506Complete:true,
    exactFunctionalConstruction:true,actualNumericalWholeHQuadrature:false,finiteHApproximationIsExactLimit:false,exercisedMemberProvedInCertifiedDomain:false,
    allSlowDerivativeBoundsComputed:false,fullNavierStokesSolutionOrRegularityClaim:false,newLeanKernelProof:false};
  const program=G.pack(roots,{schema:'MathScope.ActualCovarianceFamilyProgram/1',sourceProfile:request.sourceProfile,compiler:'actual-covariance-source-certificate.mjs:prepareActualCovarianceFamilyProgram',compilerInput:request,
    originalCriterion:ACTUAL_COVARIANCE_CRITERION,domain,scope,checks,
    sourceOperator:{chart:operator.chart,coordinates:operator.coordinates,fields:operator.fields,leadingFields:operator.leadingFields,frozen:operator.frozen,geometry:operator.geometry,cutoffs:operator.cutoffs,families:operator.families,band:operator.program.band},
    actualTarget:{raw:target.raw,targetChart:target.targetChart,H:target.H,determinant:target.determinant,weights:target.weights,inverseChecks:target.inverseChecks,sourceTargetProof:target.sourceTargetProof},
    actualOperatorBounds:{primitiveDerivation:bounds.primitiveDerivation,audit:bounds.audit,constants:bounds.operatorConstants,selection:bounds.selection,recipe:bounds.recipe,cone:bounds.cone},
    finiteIntegralEnclosures:{terms,rows:integrals.rows,proof:integrals.proof},auxiliary,partition,actualPartition,assembly,activeBandProof,waveRows});
  return {G,request,operator,target,integrals,bounds,auxiliary,partition,actualPartition,assembly,activeBandProof,waveRows,thresholdProgram,domain,scope,checks,program};
}

const expressionRecord=(G,id)=>({rootId:id,operation:G.nodes[id].op,arguments:structuredClone(G.nodes[id].args),meaning:'Exact source expression. Arguments reference the retained full program; no binary64 value is claimed.'});

export async function actualCovarianceFamilyCertificate(input={},context={}){
  const prepared=prepareActualCovarianceFamilyProgram(input,context);context.checkCancelled?.();
  const {G,request,operator:o,target:t,integrals,bounds:b,partition,assembly,program}=prepared;
  const serialized=canonicalStringify(program),[graphSHA,thresholdSHA]=await Promise.all([sha256(serialized),sha256(prepared.thresholdProgram)]);context.checkCancelled?.();
  const rootIds=structuredClone(program.roots),expressionRoots=[...new Set(Object.values(rootIds))];
  const normalizationRows=[
    {id:'angular-half',name:'각도 평균',exactValue:'1/2',rootId:o.geometry.angularAverage,source:'nonzero integer k*p; angular cos^2 average'},
    {id:'rectangle-jacobian',name:'직사각형 Jacobian',exactValue:'4-2*sqrt(2)',rootId:o.geometry.Dgeom,source:'det(v_r,v_t); not a global1/14 multiplier'},
    {id:'normalized-haar',name:'정규화 Haar cover',exactValue:'1',source:'The14^i inverse lifts cancel the14^-i Jacobian.'},
    {id:'transverse-mass',name:'실제 가로 cutoff 질량',exactValue:'Integral chi_g^2 dxi',rootId:o.cutoffs.transverseMass,source:'Actual non-normalized original square-step bump.'},
    {id:'longitudinal-scale',name:'펄스 시간 변환',exactValue:'c_i',rootId:o.geometry.ci,source:'eta_g=c_i*v-r0'},
    {id:'full-H-factor',name:'H의 실제 공통 계수',exactValue:'(4-2*sqrt(2))*c_i*(Integral chi_g^2)/2',rootId:o.geometry.haarFactor,source:'All angular, Haar, longitudinal and transverse factors are present.'},
  ];
  const operatorBoundsRows=b.audit.rows.map(row=>({...row,boundMeaning:'|f|<=B^v; |f-fref|<=B^e/S; |partial_v f|<=B^d/S; null means exactly zero.'}));
  const columnBoundsRows=[{id:'normal-plus',row:'-N/Ac',sign:1,ideal:'1'},{id:'normal-minus',row:'-N/Ac',sign:-1,ideal:'1'},
    {id:'tangent-plus',row:'K/u',sign:1,ideal:'-1'},{id:'tangent-minus',row:'K/u',sign:-1,ideal:'1'}]
    .map(r=>({...r,errorUpper:'kappa/128',errorRoot:b.uniformColumns.maximumEntryError,domain:'Every admissible source band and box, all slow points in the box intersected with the original annulus.'}));
  const inverseRows=[1,-1].map((sign,i)=>({id:'inverse-'+sign,sign,HthetaRoot:t.H[0][i],HzRoot:t.H[1][i],weightRoot:t.weights[i],
    normalizedLower:'kappa/64',normalizedUpper:'2',normalization:'mass_sign*y_sign / (-N dot Tstar/Ac)',
    openSupport:'strictly positive',flatEndpoints:'exactly0; normalized ratio is not evaluated as0/0',
    exercisedMemberPositivityCertified:false,domain:'ell>=ellMinimum; Xa<X<Xb for strict positivity.'}));
  const finiteIntegralRows=integrals.rows.flatMap(r=>['theta','z','mass'].map((component,i)=>({id:'finite-H-'+r.sign+'-'+component,sign:r.sign,component,terms:r.terms,
    approximateIntegralRoot:r.approximateIntegrals[component],exactIntegralRoot:r.exactReferenceRoots[i],lowerRoot:r.enclosure[i][0],upperRoot:r.enclosure[i][1],absoluteErrorRoot:r.absoluteError,
    factorialTailRoot:r.partial.tail,tailFormula:r.partial.tailFormula,finiteApproximationEqualsLimit:false,numericQuadratureExecuted:false})));
  const packet={schema:'MathScope.ActualCovarianceFamilyCertificate/1',sourceProfile:request.sourceProfile,profileId:request.sourceProfile,
    sourceBinding:{profileId:request.sourceProfile,parameterExpressionSHA256:o.parameterExpressionSHA256,graphSHA256:graphSHA,
      background:'Actual completed all-n source with canonical cutoff sequence; fixed n1/n2 C2 block and generated all-n tail.',leadingTarget:'Actual B8/C12/I1/I2/full heat-prepared order-zero source.'},
    originalCriterion:{...ACTUAL_COVARIANCE_CRITERION,status:'PASS',evidenceGrade:'THEOREM-BACKED'},
    graph:{sha256:graphSHA,nodeCount:G.nodes.length,canonicalBytes:new TextEncoder().encode(serialized).byteLength,rootIds,
      operations:program.operations,volterraSystems:G.covarianceSystems.length,compiler:program.compiler,compilerInput:request,graphIncluded:false,
      reconstruction:'Run the source compiler with compilerInput; all retained source functions, matrix bodies, ordered-integral terms and tails are in its full graph.'},
    uniformFamily:{certified:true,certifiedDomain:prepared.domain,
      threshold:{ellMinimum:expressionRecord(G,b.selection.ellMinimum),qStar:expressionRecord(G,b.selection.qStar),sourceNorm:expressionRecord(G,o.constants.Bnorm),
        fixedSourceProgramSHA256:thresholdSHA,sourceOnly:true,anchorChangesThreshold:false,additionalDerivativeOrdersChangeThreshold:false,conditions:b.selection.conditions,activeBandBuffer:4},
      actualMemberAlgorithm:{name:'actualBackgroundDyadicPrefix plus the shared actual covariance operator',input:'Each positive integer ell, its selected source box and fixed representative.',
        exactLocallyFiniteSum:'Actual n1..ell; every n>=ell+1 inactive for q in[2^(-ell-1),2^(-ell+1)].',
        arbitraryIntegerDefinition:true,finiteResourceFailureExplicit:true,missingTermsNeverSetToZero:true,efficientAnchorIsSeparate:true},
      columns:{ideal:[[1,1],[-1,1]],errorUpper:'kappa/128',positiveMass:'(Dg/2)*ci*Integral chi^2*Integral psi^2*x^2 >0',
        gaussianMassCoefficientRoot:b.recipe.mass.massLowerCoefficient,actualMassLowerRoot:rootIds.actualColumnMassLower,
        actualMassLowerFormula:'haarFactor * gaussianMassCoefficient * sqrt(Ls)',
        determinantNormalizedLower:'15/8',absolutePhysicalDeterminantLowerRoot:t.absoluteDeterminantLower,physicalDeterminantSign:'negative',
        physicalOrientation:'theta,z rows and plus,minus columns; the lower bound is for |det(H)|.'},
      positiveInverse:{openAnnulus:true,normalizedBounds:['kappa/64','2'],flatEndpoints:'y_plus=y_minus=0',smoothZeroExtension:true,sourceTargetAndHAuthenticated:true,
        exactLocalCovariance:'C(W0)=epsilon*H*y=epsilon*T0,star',exactResidual:['0','0']},
      global730:{identity:assembly.identity,exactResidual:['0','0'],scope:'Haar-and-angular averaged momentum covariance for0<q<qStar on the original closed stress annulus, with the exact source zero extension outside it and the complete source slow partition; this is not a numerical Navier-Stokes PDE residual.',
        actualFullPartition:true,allCandidateBoxes:81,maxPositiveBoxes:16,eachSlowBoxCountedOnce:true,plusMinusAreColumnsInsideBox:true,
        allCrossLabelProductsVanish:true,physicalTarget:'q^(-A-1/2)*T0',activeBands:prepared.activeBandProof}},
    exercisedMember:{selector:request.ellExact!==undefined?{ellExact:request.ellExact}:{anchorOrder:request.anchorOrder},selectionKind:o.program.band.selectionKind,
      ell:expressionRecord(G,o.geometry.ell),Q:expressionRecord(G,o.geometry.Q),exactInactiveTail:o.program.band.exactInactiveTail,
      certifiedBandMembership:false,determinantNonzeroForThisMemberCertified:false,positivityOfThisMemberCertified:false,
      reason:'This finite graph exercises the same actual family constructor. Its ell has not been proved above ellMinimum; the universal certified-domain conclusion is not asserted at this exercised member.',
      sourceFunctionsAndHIntegrandsConstructed:true,finiteIntegralTerms:request.terms,finiteTermsEqualSolution:false,nonzeroTailRetained:true,actualNumericalWholeHQuadrature:false},
    normalizationRows,operatorBoundsRows,columnBoundsRows,inverseRows,finiteIntegralRows,
    partitionRows:assembly.rows.map((r,i)=>({...r,actualLabel:prepared.actualPartition.labels[i],source:'Complete original normalized slow partition at the actual q/C_ell nearest offsets; both signs inside this one contribution.'})),
    expressions:expressionRoots.map(id=>expressionRecord(G,id)),sourceProofs:{movingOperator:b.primitiveDerivation,concentration:b.recipe,cone:b.cone,
      target:t.sourceTargetProof,finiteH:integrals.proof,palette:prepared.auxiliary.palette,torus:prepared.auxiliary.torus,partition:partition.originalFamily,
      actualPartitionCoordinates:{bandCoordinate:prepared.actualPartition.bandCoordinate,nearestBand:prepared.actualPartition.nearestBand,bandOffset:prepared.actualPartition.bandOffset,bands:prepared.actualPartition.bands,
        identity:prepared.actualPartition.actualCoordinateIdentity,nearestOffsetProof:prepared.actualPartition.nearestOffsetProof,profileCompatibility:prepared.actualPartition.profileCompatibility},globalAssembly:assembly.proof},
    checks:prepared.checks,scope:prepared.scope,pass:true};
  const packetBytes=new TextEncoder().encode(canonicalStringify(packet)).byteLength;
  if(packetBytes>8*1024*1024)fail('RESOURCE_LIMIT','The compact source receipt exceeds eight MiB. The graph was not silently truncated.');
  return packet;
}
