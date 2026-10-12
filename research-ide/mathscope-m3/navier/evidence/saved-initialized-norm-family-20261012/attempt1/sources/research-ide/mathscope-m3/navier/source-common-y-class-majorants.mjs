/** Full original pre-Haar common-torus covariance seminorms.
 *
 * The actual pressure constructor retains the complete 81-box, two-sign
 * indexed source. This adapter composes the local primary coefficient
 * seminorms with BOTH affine torus columns of that same source operation.
 * No Haar average, finite sample, or point-active count replaces it.
 */
import {assertGlobalPrimaryClassOperator,globalPrimaryClassOperatorCertificate} from './source-primary-class-majorants.mjs';
import {assertGlobalCurrentPressure,globalCurrentPressureCertificate} from './source-global-pressure.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),names=['rr','rtheta','rz','thetatheta','thetaz','zz'],
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),copy=x=>structuredClone(x),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  record=p=>({schema:p.schema,source:p.source,recipe:p.recipe,mapping:p.mapping,bounds:p.bounds,
    roots:p.roots,checks:p.checks,scope:p.scope});

// The global row carries a nearest-band expression. The original indexed
// derivative holds that integer label fixed BEFORE reindexing. Check the
// actual coefficient body after freezing precisely these private label
// roots, rather than differentiating a floor or pretending it is absent.
function freeAfterOriginalBandFreeze(G,root,freeze,memo=new Map()){
  if(freeze.has(root))return new Set();if(memo.has(root))return memo.get(root);
  if(G.freeCoordinates(root).size===0){const out=new Set();memo.set(root,out);return out;}
  const n=G.nodes[root];let children;
  if(n.op==='coordinate')return new Set([root]);
  if(['rational','source_parameter'].includes(n.op))children=[];
  else if(n.op==='integer_power')children=[n.args[0]];
  else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','ceiling','maximum','smooth_piecewise'].includes(n.op))children=n.args;
  else fail('An original affine coefficient contains an unverified non-scalar operation: '+n.op);
  const out=new Set();for(const id of children)for(const x of freeAfterOriginalBandFreeze(G,id,freeze,memo))out.add(x);
  memo.set(root,out);return out;
}

/** Exact finite affine-chain combinatorics. This has no source authority.
 * Matrix row/column norms are computed by integer multiplication; the
 * geometric and palette inequalities are explicit operator premises.
 */
export function originalCommonYAffineClassRecipe(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Select only a finite derivative order and representation budget.','INVALID_INPUT');
  const order=input.order??0,maxWork=input.maxWork??100000;
  if(!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxWork)||maxWork<1||BigInt(order+1)*20n>BigInt(maxWork))
    fail('The complete common-torus derivative inventory exceeds its finite budget.','RESOURCE_LIMIT');
  const J=[[3n,1n],[1n,5n]],matrices=[[[1n,0n],[0n,1n]]];
  for(let d=1;d<=4;d++)matrices.push(matrices[d-1].map(row=>[0,1].map(j=>row[0]*J[0][j]+row[1]*J[1][j])));
  const matrixRows=matrices.map((M,delta)=>({delta,matrix:M.map(r=>r.map(String)),
    columnSums:[0,1].map(j=>String(M[0][j]+M[1][j])),maximumNormUpper:String(6n**BigInt(delta)),
    pass:[0,1].every(j=>M[0][j]+M[1][j]<=6n**BigInt(delta))}));
  return {schema:'MathScope.N6.OriginalCommonYAffineClassRecipe/1',order,matrixRows,
    originalMatrix:[['3','1'],['1','5']],maximumIntegerDifference:4,maximumColumnNorm:1296,
    rectangle:{Dgeom:'4-2*sqrt(2)',DgeomStrictLower:'1',
      proof:'sqrt(2)<3/2 implies Dgeom>1; every component of vr=(1,1-sqrt(2)) and vt=(sqrt(2)-1,1) has absolute value<=1.',
      xiJacobian:'vr^T*Jg^delta/Dgeom',pulseJacobian:'vt^T*Jg^delta/(Dgeom*ci_label)'},
    originalPalette:{SLabel:'ell_label^2',SReference:'ell_ref^2',
      lowerCi:'1/(Tg*S_label)<ci_label',upperCi:'ci_label<=1/S_label',
      proof:'For x=((1+h)*ell_label*log(2)-2*log(ell_label))/log(Tg), i=floor(x) implies Tg^(x-1)<Tg^i<=Tg^x. Multiplication by Q_label^(1+h) gives the displayed original normalization.',
      neighboringS:'S_label<=4*S_ref for |ell_label-ell_ref|<=2 and ell_ref>=8'},
    chain:{slowScaleUpper:4,constant:'4+6^4*(1+4*Tg)',
      norm:'Every row of the actual local-coordinate Jacobian has l1 norm<=C_torus*S_ref; all higher coordinate derivatives are zero when the label and nearest copy are frozen.',
      mixedIdentity:'D_(R,Z,T,Y)^alpha (b∘A)=sum_(i_1,...,i_m) product_(k=1)^m A_(alpha_k,i_k) (D_(i_1)...D_(i_m)b)∘A, |alpha|=m.',
      exactBranchCounts:Array.from({length:order+1},(_,m)=>({order:m,allTorusBranchCount:String(2n**BigInt(m)),additionalSPower:m})),
      higherAffineMapDerivativeIsZero:true,nearestIntegerDerivativeNotTaken:true},
    sourceAuthenticated:false,completeN6:false};
}

/** Bind the complete original periodic operation and each actual affine
 * derivative map. This performs source identity checks, not evaluations
 * at one Y or one radial point.
 */
function actualSourceMapping(primary,pressure){
  const PG=pressure.G,current=primary.current,cover=pressure.cover,band=current.band,
    directions=[band.coordinates.R,band.coordinates.Z,band.coordinates.T,...cover.Y],
    q=(n,d=1)=>PG.q(n,d),rootTwo=PG.sqrt(q(2)),Dgeom=PG.sub(q(4),PG.mul(q(2),rootTwo)),
    basis=[[PG.one,PG.sub(PG.one,rootTwo)],[PG.sub(rootTwo,PG.one),PG.one]],
    flat=cover.rows.flatMap(row=>row.signs.map((sign,j)=>({row,sign,signIndex:j}))),
    mapRows=flat.map(({row,sign,signIndex})=>{
      const b=cover.bands[row.relativeBand+1],M=b.matrix.value,expectedXi=[0,1].map(j=>PG.div(
        PG.add(...basis[0].map((v,i)=>PG.mul(v,M[i][j]))),Dgeom)),
        expectedV=[0,1].map(j=>PG.div(PG.add(...basis[1].map((v,i)=>PG.mul(v,M[i][j]))),PG.mul(Dgeom,b.ci))),
        expectedMaps=[...b.derivativeScales.map((coefficient,parameter)=>[{parameter,coefficient}]),
          ...[0,1].map(j=>[{parameter:7,coefficient:expectedXi[j]},{parameter:8,coefficient:expectedV[j]}])],
        fixedOriginalLabels=new Set([b.ell,band.coordinates.ell]),frozenMemo=new Map(),
        coefficientConstant=sign.derivativeMaps.flat().every(x=>directions.every(d=>!freeAfterOriginalBandFreeze(PG,x.coefficient,fixedOriginalLabels,frozenMemo).has(d)))&&
          directions.every(d=>!freeAfterOriginalBandFreeze(PG,sign.coefficient,fixedOriginalLabels,frozenMemo).has(d));
      return {key:row.key,relativeBand:row.relativeBand,sign:sign.sign,signIndex,
        sourceValues:sign.values,derivativeMaps:sign.derivativeMaps,coefficient:sign.coefficient,
        rectangle:{xi:sign.rectangle.xi,v:sign.rectangle.v,xiJacobian:sign.rectangle.xiJacobian,vJacobian:sign.rectangle.vJacobian},
        exactXiColumns:same(expectedXi,sign.rectangle.xiJacobian),exactPulseColumns:same(expectedV,sign.rectangle.vJacobian),
        exactDerivativeMaps:same(expectedMaps,sign.derivativeMaps),allMapCoefficientsFrozen:coefficientConstant,
        frozenOriginalLabelRoots:[...fixedOriginalLabels],
        sourceLocalSystems:names.map(name=>cover.localSystems[signIndex][name])};
    }),indexedRows=names.map(name=>{
      const s=PG.periodicIndexedSystem(cover.fields[name]);
      return {component:name,system:cover.fields[name],root:cover.roots[name],sourceRows:s.rows.length,
        exactDirections:same(s.directions,directions),
        actualBodyMaps:s.rows.length===flat.length&&s.rows.every((r,j)=>{
          const f=flat[j];return r.localSystem===cover.localSystems[f.signIndex][name]&&same(r.values,f.sign.values)&&
            same(r.derivativeMaps,f.sign.derivativeMaps)&&r.coefficient===f.sign.coefficient&&same(r.guards,f.row.guards);
        })};
    });
  return {graphNamespace:'actualPressure',directions,sourceCommonIndex:cover.baseIndex,sourceReferenceBaseEll:cover.baseEll,
    basis,Dgeom,originalTg:band.geometry.Tg,sourceY:cover.Y,
    bothOriginalRectangleColumns:same(basis[0],cover.vr)&&same(basis[1],cover.vt)&&Dgeom===cover.Dgeom,
    sourceIntegerMatrices:copy(current.geometry.palette.matrixPowers),mapRows,indexedRows,
    sourceSupport:copy(cover.proof.localFinitenessAndFlatJoins),sourceHaarInvariance:copy(cover.proof.haarInvariance),
    allSourceCrossLabelProductsZero:cover.proof.allCrossLabelProductsVanish,
    flatExtensionRule:'Differentiate each retained smooth local row before its frozen branch substitution. The original flat joins make every excluded guard branch zero to every fixed order; no derivative of floor/nearest-copy is taken.',
    completePreHaarField:true,haarAverageSubstituted:false};
}

export function attachGlobalCommonYCovarianceClass(primary,pressure,input={},context={}){
  assertGlobalPrimaryClassOperator(primary);assertGlobalCurrentPressure(pressure);
  if(pressure.current!==primary.current)fail('The pre-Haar field and local seminorm must use the very same private current.');
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='maxWork'))
    fail('The generated primary norm fixes the derivative order; only a finite work budget is selectable.','INVALID_INPUT');
  const request={order:primary.request.order,maxWork:input.maxWork??100000};
  const recipe=originalCommonYAffineClassRecipe(request),G=primary.G,ownStart=G.nodes.length,q=(n,d=1)=>G.q(n,d),c=primary.current.band.family.constants,
    mapping=actualSourceMapping(primary,pressure),Tg=c.Tg,
    affineConstant=G.add(q(4),G.mul(q(1296),G.add(G.one,G.mul(q(4),Tg)))),
    ratioConstant=primary.bounds.referenceChartCovarianceFactor,
    deltaUpper=G.maximum(G.one,G.log(G.div(c.Xb,c.Xa))),
    exactRows=primary.bounds.rows.map(row=>({order:row.order,fields:Object.fromEntries(['fullCovariance','covarianceRemainder'].map(name=>{
      const f=row.fields[name],constant=G.mul(q(162),ratioConstant,G.pow(q(4),f.power),G.pow(affineConstant,row.order),f.constant);
      return [name,{constant,power:f.power+row.order,pole:f.pole,epsilonExponent:f.epsilonExponent,
        weight:'zeta',gaussian:'1',inputDerivativeOrder:row.order,sourceLocalConstant:f.constant,
        statement:'For every exact total derivative of this order in (R,Z,T,Y0,Y1), |D^alpha W|<=constant*S_ref^power*epsilon_ref^epsilonExponent*zeta*delta_*^(-pole).'}];
    }))})),
    rows=exactRows.map(row=>({order:row.order,fields:Object.fromEntries(['fullCovariance','covarianceRemainder'].map(name=>{
      const prefix=exactRows.slice(0,row.order+1).map(r=>r.fields[name]),power=Math.max(...prefix.map(r=>r.power)),pole=Math.max(...prefix.map(r=>r.pole)),
        constant=G.maximum(...prefix.map(r=>G.mul(r.constant,G.pow(deltaUpper,pole-r.pole))));
      return [name,{constant,power,pole,epsilonExponent:prefix[0].epsilonExponent,weight:'zeta',gaussian:'1',
        derivativeConvention:'Every mixed derivative through this total order on the complete same-source common torus.',
        prefixConstantAdjustment:'S_ref>=1 and delta_*<=max(1,log(Xb/Xa)); the exact lower-order pole conversions are retained in the maximum.'}];
    }))})),
    checks=[
      {id:'same-private-primary-current-and-complete-pressure-cover',pass:pressure.current===primary.current&&mapping.completePreHaarField&&!mapping.haarAverageSubstituted},
      {id:'all-original-five-integer-cover-matrices-bounded',pass:recipe.matrixRows.every(r=>r.pass)&&same(recipe.matrixRows.map(r=>r.matrix),mapping.sourceIntegerMatrices)},
      {id:'both-original-basis-columns-and-positive-rectangle',pass:mapping.bothOriginalRectangleColumns},
      {id:'all162-actual-frozen-affine-coordinate-maps',pass:mapping.mapRows.length===162&&mapping.mapRows.every(r=>r.exactXiColumns&&r.exactPulseColumns&&r.exactDerivativeMaps&&r.allMapCoefficientsFrozen)},
      {id:'all-six-actual-full-indexed-coefficient-fields',pass:mapping.indexedRows.length===6&&mapping.indexedRows.every(r=>r.sourceRows===162&&r.exactDirections&&r.actualBodyMaps)},
      {id:'original-source-support-separation-not-point-count',pass:mapping.allSourceCrossLabelProductsZero&&pressure.cover.proof.integerRange.minimum===0&&pressure.cover.proof.integerRange.maximum===4},
      {id:'every-new-norm-root-is-source-only',pass:[affineConstant,ratioConstant,deltaUpper,...rows.flatMap(r=>Object.values(r.fields).map(x=>x.constant))].every(x=>G.freeCoordinates(x).size===0)},
      {id:'every-generated-local-order-used-with-its-full-flat-pole',pass:rows.length===primary.request.order+1&&exactRows.every((r,j)=>r.order===j&&Object.values(r.fields).every(x=>x.inputDerivativeOrder===j))}
    ];
  if(checks.some(r=>!r.pass))fail('The complete original common-Y class binding failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const result={schema:'MathScope.N6.ActualCommonYCovarianceClass/1',G,primary,pressure,
    source:{paperSHA256:primary.source.paperSHA256,parameterExpressionSHA256:primary.source.parameterExpressionSHA256,
      sourceEquations:['7.27','7.37','8.1','9.11'],graphNamespaces:{norm:'primary.G',actualPressure:'pressure.G'},
      samePrivateSourceDomain:true,sourceReferenceBand:'S_ref=ell_ref^2, i0=i(ell_ref-2)',currentWindow:copy(primary.current.band.window)},
    recipe,mapping,bounds:{graphNamespace:'norm',affineConstant,ratioConstant,deltaUpper,exactRows,rows,
      normalization:'Pre-Haar angular covariance, normalized to the actual reference Q_ref. The pointwise bound includes all 81 boxes and both signs, with both Y directions and every full-curl square.',
      exactCoordinateRatio:'ratio=Q_ref/Q_label; epsilon_label^alpha/epsilon_ref^alpha=ratio^(-h*alpha), |ell_label-ell_ref|<=2.',
      noAuxiliaryIntegrationMassInserted:true,onlyAdditionalSPowerFromAffineMapping:'m'},
    roots:{fullCovariance:copy(pressure.covariance.fullAngularMean),fullAuxiliaryHaar:copy(pressure.covariance.fullAuxiliaryMean)},checks,
    scope:{actualPreHaarCommonYCovarianceClassCertified:true,actualFullCovarianceMOneClassCertified:true,
      actualInitialCovarianceRemainderMTwoMinusTwoKappaClassCertified:true,actualFiniteDerivativeOrder:request.order,
      allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
      actualShiftedRadialPressureClassCertified:false,actualPostTemporalFiveMapClassCertified:false,
      actualCompleteInitialN6TupleClassCertified:false,allFiniteIterationStagesClassCertified:false,completeN6:false,newLeanKernelProof:false}};
  seals.set(result,{G,primary,pressure,ownStart,count:G.nodes.length,ownNodes:canonicalStringify(G.nodes.slice(ownStart)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  context.onProgress?.({stage:'actual-complete-common-Y-covariance-class-sealed',nodeCount:G.nodes.length,order:request.order,sourceRows:162});
  return result;
}

export function assertGlobalCommonYCovarianceClass(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.primary!==p.primary||s.pressure!==p.pressure||s.record!==canonicalStringify(record(p))||
    s.ownNodes!==canonicalStringify(p.G.nodes.slice(s.ownStart,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged privately attached complete common-Y covariance class.');
  assertGlobalPrimaryClassOperator(p.primary);assertGlobalCurrentPressure(p.pressure);return true;
}

export async function globalCommonYCovarianceClassCertificate(p){
  assertGlobalCommonYCovarianceClass(p);const s=seals.get(p),primary=await globalPrimaryClassOperatorCertificate(p.primary),
    pressure=await globalCurrentPressureCertificate(p.pressure),program={schema:'MathScope.N6.ActualCommonYCovarianceClassProgram/1',
      primaryGraph:primary.graph,pressureGraph:pressure.graph,record:record(p),
      normBaseOffset:primary.graph.normNodeCount,nodes:p.G.nodes.slice(primary.graph.normNodeCount,s.count),definitions:s.definitions},
    encoded=canonicalStringify(program);
  return {...record(p),parents:{primary:primary.graph,pressure:pressure.graph},program,
    graph:{sha256:await sha256(encoded),nodeCount:s.count,addedNodes:program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,
      requiresCompleteAuthenticatedParents:true},execution:'ACTUAL_ORIGINAL_PRE_HAAR_COMMON_Y_CLASS_ATTACHMENT'};
}
