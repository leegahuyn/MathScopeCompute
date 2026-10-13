/** Original positive radial IBP norms on the saved initialized source.
 *
 * The source is obtained from the private saved-source capability. Every
 * deferred scalar/natural result selects an actual imported norm producer
 * on the same mathematical source. A large finite IBP index does not
 * require flattening its very large derivative graph into this program.
 */
import {openSavedInitializedSource,assertSavedInitializedSource,savedInitializedSourceProgram}
  from './source-saved-initialized-authority.mjs';
import {assertSavedInitializedNormFamily,constructSavedInitializedNormProgram,assertSavedInitializedNormProgram}
  from './source-saved-initialized-norm-family.mjs';
import {originalInitializedNormProgramProducerReferences} from './source-initialized-lazy-norm-program.mjs';
import {prepareOriginalRadialClassMajorants,assertOriginalRadialClassMajorants,originalRadialClassMajorantCertificate}
  from './source-radial-class-majorants.mjs';
import {originalRadialClassDerivativeDemand} from './source-radial-class-kernel.mjs';
import {originalTemporalClassDerivativeDemand,originalCommonCiUpperFactorization}
  from './source-temporal-class-kernel.mjs';
import {realizeOriginalTemporalPotential} from './source-temporal-potential.mjs';
import {reconstructUpdatedFullMeanPressure,exactNormalizedHaar,exactWholeRadialIntegral}
  from './source-updated-mean-pressure.mjs';
import {globalMeanGeometry} from './source-global-current.mjs';
import {shiftedRadialIntegrals} from './source-pressure.mjs';
import {actualFourierCoefficient,finiteAuxiliaryInverse,auxiliaryInverseTail} from './source-auxiliary-fourier.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),programSeals=new WeakMap(),finiteSeals=new WeakMap(),copy=x=>structuredClone(x),
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SAVED_SOURCE_CUTOFF_NORM')=>{throw Object.assign(new Error(message),{code});},
  require=(value,message)=>{if(!value)fail(message);},
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  refs=Object.freeze({initialized:constructSavedInitializedNormProgram,radial:prepareOriginalRadialClassMajorants,
    radialDemand:originalRadialClassDerivativeDemand,temporalDemand:originalTemporalClassDerivativeDemand,
    ciUpper:originalCommonCiUpperFactorization,temporalSource:realizeOriginalTemporalPotential,
    pressureSource:reconstructUpdatedFullMeanPressure,haarSource:exactNormalizedHaar,
    radialIntegralSource:exactWholeRadialIntegral,shiftedIntegralSource:shiftedRadialIntegrals,geometrySource:globalMeanGeometry,
    fourierCoefficient:actualFourierCoefficient,fourierPartialSum:finiteAuxiliaryInverse,fourierTail:auxiliaryInverseTail,
    ...Object.fromEntries(Object.entries(originalInitializedNormProgramProducerReferences()).map(([k,v])=>['input_'+k,v]))}),
  originalPaths=['source-temporal-potential.mjs','source-updated-mean-pressure.mjs','source-global-current.mjs',
    'source-global-initial-mean.mjs','source-auxiliary-expressions.mjs','source-auxiliary-fourier.mjs','source-pressure.mjs'];

function rational(n,d=1n){
  n=BigInt(n);d=BigInt(d);require(d!==0n,'An exact exponent denominator must be nonzero.');
  if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}
  return {numerator:String(n/a),denominator:String(d/a)};
}

/** Minimal POSITIVE integer p for 1-kappa_s+p*kappa_s >= target.
 * The literal original kappa_s=1/100000 is never rounded or replaced.
 */
export function originalSavedCutoffMinimumIBP(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['numerator','denominator'].includes(k)))
    fail('Choose an exact desired exponent only.');
  const parse=(x,name)=>{if(!/^-?\d+$/.test(String(x)))fail(name+' must be an exact integer.');return BigInt(x);},
    n=parse(input.numerator??149,'Target numerator'),d=parse(input.denominator??100,'Target denominator');
  require(d>0n,'The target exponent denominator must be positive.');
  const needed=100000n*n-99999n*d,ceiling=needed<=0n?0n:(needed+d-1n)/d,p=ceiling<1n?1n:ceiling;
  if(p>BigInt(Number.MAX_SAFE_INTEGER))fail('The requested finite IBP index exceeds the representation range.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalSavedCutoffMinimumIBP/1',target:rational(n,d),ibpOrder:Number(p),
    inputExponent:rational(99999n,100000n),kappa:rational(1n,100000n),resultExponent:rational(99999n+p,100000n),
    positiveIntegerMinimal:true,sourceAuthenticated:false};
}

export function originalSavedCutoffDerivativeDemand(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','ibpOrder'].includes(k)))
    fail('Choose finite output and positive IBP orders only.');
  const m=natural(input.order??0,'Output order'),p=natural(input.ibpOrder??49001,'IBP order');
  require(p>=1,'A positive IBP order is required; the raw cutoff bound gives no flatness gain.');
  const radial=originalRadialClassDerivativeDemand({outputOrder:m,ibpOrder:p}),
    temporal=originalTemporalClassDerivativeDemand({order:m,ibpOrder:p}),u=radial.flatRemainderInputOrder;
  natural(u+15,'Complete upstream source demand');
  return {schema:'MathScope.N6.OriginalSavedCutoffDerivativeDemand/1',order:m,ibpOrder:p,
    A1DesiredVelocityOrder:u,fastA1DesiredVelocityOrder:u+1,A0FullRadialSourceOrder:u,
    fastA1InitialResidualOrder:temporal.improvedFastCutoffInputOrder,
    upstreamInitializedProgramOrder:u,upstreamTargetWeightedOrder:u+13,upstreamBackgroundSlowOrder:u+15,
    fixedTemporalRadialOutputOrder:m+1,fixedPressureRadialOutputOrder:m,
    inputExponent:rational(99999n,100000n),kappa:rational(1n,100000n),
    resultExponent:rational(99999n+BigInt(p),100000n),conservativeIntegerSPowerGain:p,
    originalRadialDemand:radial,originalTemporalDemand:temporal,
    exactRequiredDerivativeOrdersAndConservativeUpstreamPrefixDistinct:true,
    allFiniteOrdersMaterialized:false,sourceAuthenticated:false};
}

/** Read exact source operations without hydrating an old expression graph. */
function bindBodies(source){
  const selected=new Set(),take=id=>{selected.add(id);return source.node(id);},
    mul=id=>{const n=take(id);return n.op==='multiply'?n.args.flatMap(mul):[id];},
    mulKeeping=(id,atoms)=>{const n=take(id);return atoms.includes(id)||n.op!=='multiply'?[id]:n.args.flatMap(x=>mulKeeping(x,atoms));},
    add=id=>{const n=take(id);return n.op==='add'?n.args.flatMap(add):[id];},
    isq=(id,n,d='1')=>{const a=take(id);return a.op==='rational'&&a.args[0]===String(n)&&a.args[1]===String(d);},
    inverse=id=>{const n=take(id);return n.op==='inverse'?n.args[0]:null;},
    expressionCollections=source.definitionCollections.filter(r=>r.namespace.endsWith('.expressionDefinitions')),
    inverseCollections=source.definitionCollections.filter(r=>r.namespace.endsWith('.inverseDefinitions'));
  require(expressionCollections.length===1&&inverseCollections.length===1,'The actual auxiliary function registries must be unambiguous.');
  const expressionDefs=expressionCollections[0].value,inverseDefs=inverseCollections[0].value,
    expression=(id,derivative=false)=>{
      const n=take(id);require(n.op==='m3_aux_expression_partial'&&n.args[0]<0,'Retain the actual shared auxiliary expression.');
      const d=expressionDefs[-1-n.args[0]];
      require(d&&same(n.args[1],d.parameters)&&(derivative||n.args[2].every(x=>x===0)),
        'The original shared source body and its actual unshifted arguments are required.');
      take(d.body);return {root:id,system:n.args[0],definition:copy(d),orders:copy(n.args[2]),body:d.body};
    },unshare=id=>take(id).op==='m3_aux_expression_partial'?expression(id).body:id,
    find=(op,args,start,end)=>{
      for(let id=start;id<end;id++){const n=source.node(id);if(n.op===op&&same(n.args,args)){take(id);return id;}}
      fail('An exact original source operation required by the cutoff identity is missing.');
    },findProduct=(factors,start,end)=>{
      const sorted=[...factors].sort((a,b)=>a-b);
      for(let id=start;id<end;id++){const n=source.node(id);if(n.op==='multiply'&&
        same([...n.args].sort((a,b)=>a-b),sorted)){take(id);return id;}}
      fail('The retained original cutoff product is missing.');
    },mean=source.mean,stages=mean.stages,temporal=stages.temporal.velocity,
    vFactors=mul(temporal.v),thetaRoot=vFactors.find(id=>take(id).op==='m3_aux_inverse_partial'),
    ciInverse=vFactors.find(id=>inverse(id)!==null),minus=vFactors.find(id=>isq(id,-1));
  require(vFactors.length===3&&thetaRoot!==undefined&&ciInverse!==undefined&&minus!==undefined,
    'The actual temporal azimuthal velocity must be the original -N^-1(Etheta)/ci0.');
  const ci=inverse(ciInverse),thetaNode=take(thetaRoot),thetaDef=inverseDefs[thetaNode.args[0]],
    [R,Z,T,...Ys]=thetaDef?.directions??[],Y=thetaDef?.Y;
  require(thetaDef&&same(Y,Ys)&&Y.length===2&&same(thetaNode.args[1],thetaDef.parameters)&&thetaNode.args[2].every(x=>x===0),
    'The actual temporal inverse must use the unchanged original slow and torus directions.');
  const betaFactors=mul(temporal.beta),psiZ=betaFactors.find(id=>take(id).op==='m3_aux_expression_partial'),
    epsilon=betaFactors.find(id=>id!==minus&&id!==psiZ),psiDefinition=expression(psiZ,true),parameters=psiDefinition.definition.parameters;
  require(betaFactors.length===3&&betaFactors.includes(minus)&&epsilon!==undefined&&
    same(psiDefinition.orders,parameters.map(x=>Number(x===Z)))&&
    same([...parameters].sort((a,b)=>a-b),[...thetaDef.parameters].sort((a,b)=>a-b)),
    'The actual radial velocity must be -epsilon partial_Z of the same T1 potential.');
  const psi=find('m3_aux_expression_partial',[psiDefinition.system,parameters,parameters.map(()=>0)],psiDefinition.body+1,psiZ+1),
    rawFactors=mul(psiDefinition.body),inverseR=rawFactors.find(id=>inverse(id)===R),
    numerator=rawFactors.find(id=>id!==inverseR),numeratorTerms=add(numerator),left=numeratorTerms.find(id=>take(id).op==='definite_integral'),
    negativeWhole=numeratorTerms.find(id=>id!==left),wholeFactors=mul(negativeWhole),
    whole=wholeFactors.find(id=>take(id).op==='definite_integral'),chi=stages.temporal.pressure.chi;
  require(rawFactors.length===2&&inverseR!==undefined&&numeratorTerms.length===2&&left!==undefined&&
    wholeFactors.length===3&&wholeFactors.includes(minus)&&wholeFactors.includes(chi)&&whole!==undefined,
    'The actual T1 body must retain both shifted integrals, the original cutoff and the R^-1 factor.');
  const leftNode=take(left),wholeNode=take(whole),integrand=wholeNode.args[0],r=wholeNode.args[1],
    [innerRadius,outerRadius]=wholeNode.args.slice(2),integrandFactors=mul(integrand),
    shiftedInverse=integrandFactors.find(id=>take(id).op==='m3_aux_inverse_partial'),shiftedNode=take(shiftedInverse),
    zDef=inverseDefs[shiftedNode.args[0]];
  require(same(leftNode.args,[integrand,r,innerRadius,R])&&integrandFactors.length===4&&
    integrandFactors.includes(r)&&integrandFactors.includes(minus)&&integrandFactors.includes(ciInverse)&&
    zDef&&shiftedNode.args[0]!==thetaNode.args[0]&&same(zDef.parameters,thetaDef.parameters)&&
    same(zDef.directions,thetaDef.directions)&&same(zDef.Y,Y)&&shiftedNode.args[2].every(x=>x===0),
    'The T1 weighted source must be R times the same actual axial Fourier inverse, with its complete radial translation.');
  const zIndex=shiftedNode.args[0],zRoot=find('m3_aux_inverse_partial',[zIndex,zDef.parameters,zDef.directions.map(()=>0)],thetaRoot+1,whole),
    desiredProduct=findProduct([zRoot,ciInverse],zRoot+1,whole),
    gammaDesired=findProduct([minus,desiredProduct],desiredProduct+1,whole),
    weighted=findProduct([R,gammaDesired],gammaDesired+1,whole);
  require(zDef.parameters.every((x,j)=>x===R?shiftedNode.args[1][j]===r:Y.includes(x)||shiftedNode.args[1][j]===x)&&
    Y.every(y=>add(shiftedNode.args[1][zDef.parameters.indexOf(y)]).includes(y)),
    'The actual T1 inverse must retain its original slow arguments and translate both Haar torus coordinates.');
  for(const d of [thetaDef,zDef])require(d.zeroMode==='The exact normalized Haar mean is projected out.'&&
    d.operator==='(sqrt(2)-1)*partial_y0+partial_y1'&&d.finiteSumDeclaredEqualToLimit===false&&
    d.coefficientProducer==='source-auxiliary-fourier.mjs:actualFourierCoefficient'&&
    d.partialSumProducer==='source-auxiliary-fourier.mjs:finiteAuxiliaryInverse'&&
    d.tailProducer==='source-auxiliary-fourier.mjs:auxiliaryInverseTail',
    'The complete original infinite Fourier inverse and its exact zero mode must remain in the source registry.');
  require(mean.conservation.exactTemporalZeroMeanSource.theta===0&&mean.conservation.exactTemporalZeroMeanSource.z===0&&
    mean.checks.some(c=>c.id==='temporal-zero-Haar-mean-and-exact-five-conservation-rows'&&c.pass),
    'The actual source initialization must have checked the two temporal inverse zero modes.');
  const derivativeRoot=coordinate=>find('m3_aux_expression_partial',
    [psiDefinition.system,parameters,parameters.map(x=>Number(x===coordinate))],psi+1,temporal.gamma+1),
    psiR=derivativeRoot(R),psiY=Y.map(derivativeRoot),gammaTerms=add(temporal.gamma),
    radialTorusTerm=gammaTerms.find(id=>take(id).op==='multiply'&&take(id).args.some(f=>take(f).op==='add'&&add(f).includes(psiY[0]))),
    torusFactors=take(radialTorusTerm).args,torusSum=torusFactors.find(id=>take(id).op==='add'&&add(id).includes(psiY[0])),
    radialFast=torusFactors.find(id=>id!==torusSum),torusTerms=add(torusSum),
    secondTerm=torusTerms.find(id=>id!==psiY[0]),secondFactors=mul(secondTerm),
    vr1=secondFactors.find(id=>id!==psiY[1]),inverseRPsi=gammaTerms.find(id=>same(mul(id).sort((a,b)=>a-b),[inverseR,psi].sort((a,b)=>a-b)));
  require(gammaTerms.length===3&&gammaTerms.includes(psiR)&&inverseRPsi!==undefined&&torusFactors.length===2&&
    torusTerms.length===2&&torusTerms.includes(psiY[0])&&secondFactors.length===2&&secondFactors.includes(psiY[1]),
    'The complete actual meridional gamma must retain psi_R, both original radial torus derivatives and psi/R.');
  const vrTerms=add(vr1),vrNegative=vrTerms.find(id=>!isq(id,1)),vrFactors=mul(vrNegative),
    sqrtTwo=vrFactors.find(id=>take(id).op==='sqrt_positive');
  require(vrTerms.length===2&&vrTerms.some(id=>isq(id,1))&&vrFactors.length===2&&vrFactors.includes(minus)&&
    sqrtTwo!==undefined&&isq(take(sqrtTwo).args[0],2),'The actual radial torus direction must remain (1,1-sqrt(2)).');
  const pressureRows=['temporal','moments'].map(stage=>{
    const s=stages[stage],p=s.pressure,w=p.integrals.whole,cutNode=take(p.cutoffRemainder),cutFactors=cutNode.args,
      chiR=cutFactors.find(id=>id!==w),sourceTerms=add(p.source),centered=sourceTerms.find(id=>id!==s.mean.gr),centerFactors=mulKeeping(centered,[p.rho,s.mean.P]),
      Pdefinition=expression(s.mean.P),Pintegral=take(Pdefinition.body),haarDefinition=expression(s.mean.haarGr),
      haarOuter=take(haarDefinition.body),haarInner=take(haarOuter.args[0]);
    require(cutNode.op==='multiply'&&cutFactors.length===2&&cutFactors.includes(w)&&chiR!==undefined&&p.chi===chi&&
      sourceTerms.length===2&&sourceTerms.includes(s.mean.gr)&&centerFactors.length===3&&
      centerFactors.includes(minus)&&centerFactors.includes(p.rho)&&centerFactors.includes(s.mean.P)&&
      p.integrals.body===p.source&&p.integrals.originalRadialPrimitive===stages.temporal.pressure.integrals.originalRadialPrimitive&&
      p.cutoffRemainderDeclaredZero===false&&p.allAuxiliaryModesRetained===true&&s.checks.every(c=>c.pass),
      'Both complete pressure sources must be the actual g_r-rho*P and retain their own whole-integral A0.');
    require(Pintegral.op==='definite_integral'&&same(Pintegral.args.slice(2),[innerRadius,outerRadius])&&
      haarOuter.op==='definite_integral'&&haarInner.op==='definite_integral'&&haarOuter.args[1]===Y[1]&&haarInner.args[1]===Y[0]&&
      isq(haarOuter.args[2],0)&&isq(haarOuter.args[3],1)&&isq(haarInner.args[2],0)&&isq(haarInner.args[3],1)&&haarInner.args[0]===s.mean.gr,
      'The complete normalized two-torus Haar integral and full radial pressure moment must be retained.');
    const shiftedHaar=take(Pintegral.args[0]),expectedValues=haarDefinition.definition.parameters.map(x=>x===R?Pintegral.args[1]:x);
    require(shiftedHaar.op==='m3_aux_expression_partial'&&shiftedHaar.args[0]===haarDefinition.system&&
      same(shiftedHaar.args[1],expectedValues)&&shiftedHaar.args[2].every(x=>x===0),
      'The actual P integral must integrate precisely the shared full Haar(g_r) at its radial variable.');
    return {stage,gr:s.mean.gr,haarGr:s.mean.haarGr,P:s.mean.P,Pdefinition,haarDefinition,
      centeredSource:p.source,pressure:p.value,chi:p.chi,rho:p.rho,chiR,whole:w,A0:p.cutoffRemainder,
      integrals:copy(p.integrals),normalizationIdentity:'whole_R Haar(g_r-rho*P)=P-P*whole_R rho=0'};
  });
  require(pressureRows[0].chiR===pressureRows[1].chiR&&pressureRows[0].rho===pressureRows[1].rho,
    'Both actual mean stages must use the same original rho and cutoff derivative.');
  const chiR=pressureRows[0].chiR,A1product=findProduct([chiR,whole],whole+1,source.nodeCount),
    A1=findProduct([inverseR,A1product],A1product+1,source.nodeCount),
    rho=pressureRows[0].rho,rhoNode=take(rho),rhoFactors=rhoNode.args,massInverse=rhoFactors.find(id=>inverse(id)!==null&&take(inverse(id)).op==='definite_integral'),
    mass=inverse(massInverse),massNode=take(mass),unnormalized=rhoFactors.find(id=>id!==massInverse);
  require(rhoNode.op==='multiply'&&rhoFactors.length===2&&massInverse!==undefined&&same(massNode.args.slice(2),[innerRadius,outerRadius]),
    'The actual rho must divide the original seed by its own whole-envelope mass.');
  mul(chiR);mul(rho);take(massNode.args[0]);take(unnormalized);
  const normalization={rho,unnormalized,mass,massInverse,massIntegrand:massNode.args[0],radialVariable:massNode.args[1],
    innerRadius,outerRadius,definition:'globalMeanGeometry integrates the same positive supported seed over the complete original envelope, then divides by that exact mass.',
    positiveMass:'The original seed exp(-1/[u(1-u)]) is positive for 0<u<1, and its fixed reserved mean patch lies strictly inside the original envelope.',
    exactMass:'whole_R rho=1',fixedSourceProducer:'globalMeanGeometry'};
  return {geometry:{R,Z,T,Y,epsilon,ci,ciInverse,innerRadius,outerRadius,chi,chiR,radialFast,vr:[1,vr1],
      radialPrimitive:stages.temporal.pressure.integrals.originalRadialPrimitive},
    temporal:{velocity:copy(temporal),thetaRoot,zRoot,thetaDefinition:copy(thetaDef),zDefinition:copy(zDef),
      psi,psiZ,psiR,psiY,psiDefinition,rawPsi:psiDefinition.body,weighted,gammaDesired,integrand,radialVariable:r,left,whole,A1,
      shiftedInverse,shiftedInverseArguments:copy(shiftedNode.args[1]),
      exactIdentity:'gamma=gammaDesired-A1(gammaDesired); beta=-epsilon*partial_Z T1(gammaDesired)',
      completePotentialAndAllRadialTorusTermsRetained:true,rawCutoffRemainderDeclaredZero:false},
    pressureRows,normalization,
    selectedNodeBindings:[...selected].sort((a,b)=>a-b).map(id=>({id,node:copy(source.node(id))})),
    zeroMomentProof:{temporal:'Haar(gammaDesired)=0 at every R,Z,T because the actual infinite N inverse removes its exact zero mode. Hence whole_R R*Haar(gammaDesired)=0.',
      pressure:'The two actual P roots are exactly whole_R Haar(g_r); the same original rho has whole_R rho=1. Thus the complete centered pressure sources have zero whole weighted Haar moment.',
      allSlowDerivatives:'The identities hold at every slow point. Smooth zero extension at the fixed source endpoints allows each finite slow derivative and both torus derivatives through the compact integrals. Every resulting zero moment is therefore also exact.',
      translation:'Normalized Haar measure is invariant under the full original radial torus translation. Fubini applies on the complete compact radial envelope.',
      sourceEndpointTermsDiscardedWithoutProof:false,initialFullDerivativeGraphRerun:false}};
}

export async function attachSavedInitializedCutoffAuthority(family){
  assertSavedInitializedNormFamily(family);const cap=await openSavedInitializedSource();assertSavedInitializedSource(cap);
  const source=savedInitializedSourceProgram(cap);
  require(family.sourceBinding.actualMeanSourcePrefixSHA256===cap.source.sourceNodePrefixSHA256&&
    same(family.sourceBinding.actualRoots,cap.actualRoots),'Every cutoff norm must use the exact same initialized source as its input norm family.');
  const files=new Map(source.sourceFiles.map(r=>[r.path,r])),paths=originalPaths.map(x=>'research-ide/mathscope-m3/navier/'+x);
  require(paths.every(path=>files.has(path)),'All actual source constructors and the complete Fourier inverse definitions are required.');
  const bodies=bindBodies(source),result={schema:'MathScope.N6.SavedInitializedCutoffAuthority/1',source:copy(cap.source),
    actualRoots:copy(family.sourceBinding.actualRoots),originalSourceFiles:paths.map(path=>copy(files.get(path))),bodies,
    allFiniteSourceNormContinuation:copy(family.continuation),
    phase:{kappa:rational(1n,100000n),positiveOriginalHRetained:true,
      actualProducer:'prepareOriginalRadialClassMajorants',
      inverseScale:'M^-1 <= C_source epsilon_ref^(1/100000) S_ref^rho_g',
      originalRange:'1/2<rho_g<1',integerSPowerConsequence:'S_ref^(p*rho_g)<=S_ref^p since S_ref>=1',
      fixedReferenceBandHeldDuringCoefficientDifferentiation:true,newCommonQThresholdIntroduced:false},
    scope:{actualSavedCutoffBodiesAuthenticated:true,actualWholeWeightedZeroMomentsAuthenticated:true,
      originalLiveFamilyRuntimeRecreated:false,allFiniteCutoffDerivativeBodiesMaterialized:false,
      allFiniteCutoffNormProgramConstructed:false,wholeInitialTangentialResidualClassCertified:false,completeN6:false}};
  seals.set(result,{family,cap,source,functions:{...refs},record:canonicalStringify(result)});return result;
}

export function assertSavedInitializedCutoffAuthority(authority){
  const s=seals.get(authority);
  require(s&&s.record===canonicalStringify(authority)&&Object.keys(refs).every(k=>s.functions[k]===refs[k]),
    'Use the unchanged private actual cutoff authority; copied roots, receipts and metadata are not authority.');
  assertSavedInitializedNormFamily(s.family);assertSavedInitializedSource(s.cap);
  require(savedInitializedSourceProgram(s.cap)===s.source,'The saved source program changed.');return true;
}

class TypedNormProgram{
  constructor(){this.nodes=[];this.interned=new Map();}
  node(type,op,args){const n={type,op,args},key=canonicalStringify(n);if(this.interned.has(key))return this.interned.get(key);
    const id=this.nodes.length;this.nodes.push(n);this.interned.set(key,id);return id;}
  scalar(n,d=1){const q=rational(n,d);return this.node('scalar','rational',[q.numerator,q.denominator]);}
  natural(n){return this.node('natural','natural',[String(n)]);}
  result(type,call,path){return this.node(type,'source_result',[call,path]);}
  mul(...f){require(f.every(id=>this.nodes[id]?.type==='scalar'),'A norm product requires scalar operands.');return this.node('scalar','multiply',f);}
  sqrt(id){require(this.nodes[id]?.type==='scalar','A positive square root requires a scalar.');return this.node('scalar','sqrt_positive',[id]);}
  addNatural(...f){require(f.every(id=>this.nodes[id]?.type==='natural'),'A polynomial S power requires natural operands.');return this.node('natural','add',f);}
  maxNatural(...f){require(f.every(id=>this.nodes[id]?.type==='natural'),'A boundary pole requires natural operands.');return this.node('natural','maximum',f);}
}

export function constructSavedInitializedCutoffNormProgram(authority,input={}){
  assertSavedInitializedCutoffAuthority(authority);const s=seals.get(authority),d=originalSavedCutoffDerivativeDemand(input),
    m=d.order,p=d.ibpOrder,u=d.A0FullRadialSourceOrder,G=new TypedNormProgram(),
    field=path=>({constant:G.result('scalar',0,[...path,'constant']),power:G.result('natural',0,[...path,'power']),pole:G.result('natural',0,[...path,'pole'])}),
    desired=field(['temporalProducts','extended',u,'gammaDesired']),fastDesired=field(['temporalProducts','extended',u+1,'gammaDesired']),
    postGr=field(['freshProducts','rows',u,'gr']),updatedGr=field(['fullUpdatedMean','rows',u,'gr']),
    temporalPole=G.maxNatural(desired.pole,fastDesired.pole),pressurePole=G.maxNatural(postGr.pole,updatedGr.pole),
    calls=[{id:0,producer:'initialized',request:{order:u},dependencies:[],source:'same-private-saved-initialized-norm-family',
      representation:'Execute the canonical finite source norm program with budgets sufficient for this requested finite order; the derivative bodies need not be flattened by this outer program.'},
      {id:1,producer:'radial',request:{order:m+1,ibpOrder:p,pole:{naturalNode:temporalPole}},dependencies:[0],
        source:'same-original-fixed-radial-cutoff-rho-phase-and-domain'},
      {id:2,producer:'radial',request:{order:m,ibpOrder:p,pole:{naturalNode:pressurePole}},dependencies:[0],
        source:'same-original-fixed-radial-cutoff-rho-phase-and-domain'}],
    radial=(order,e=1)=>G.result('scalar',1,['rows',e,'orders',order,'remainderRows',p-1,'constant']),
    pressure=G.result('scalar',2,['pressureRows',m,'cutoffRemainders',p-1,'constant']),gain=G.natural(p),
    result=(name,source,inputNorm,fixed,pole,extra)=>({name,source,order:m,
      constant:extra===undefined?G.mul(fixed,inputNorm.constant):G.mul(extra,fixed,inputNorm.constant),
      power:G.addNatural(inputNorm.power,gain),pole,epsilonExponent:copy(d.resultExponent),weight:'zeta',gaussian:'1',
      inputNorm:copy(inputNorm),completeSourceDerivativeOrder:name==='fastA1'?u+1:u,positiveIBPOrder:p,
      sourceOnlyConstantAndNaturalMetadata:true,cutoffDeclaredZero:false}),
    outputs={A1:result('A1',{actualNode:authority.bodies.temporal.A1},desired,radial(m),temporalPole),
      fastA1:result('fastA1',{operation:'ci0*N*(-A1)',ci:authority.bodies.geometry.ci,A1:authority.bodies.temporal.A1,
        N:'(sqrt(2)-1)*partial_Y0+partial_Y1'},fastDesired,radial(m+1),temporalPole,G.sqrt(G.scalar(2))),
      postTemporalA0:result('postTemporalA0',{actualNode:authority.bodies.pressureRows[0].A0},postGr,pressure,pressurePole),
      initializedA0:result('initializedA0',{actualNode:authority.bodies.pressureRows[1].A0},updatedGr,pressure,pressurePole)},
    program={schema:'MathScope.N6.SavedInitializedPositiveIBPNormProgram/1',request:{order:m,ibpOrder:p},derivativeDemand:d,
      source:copy(authority.source),sourceBinding:{temporal:copy(authority.bodies.temporal),pressureRows:copy(authority.bodies.pressureRows),
        normalization:copy(authority.bodies.normalization),zeroMomentProof:copy(authority.bodies.zeroMomentProof)},
      callGraph:{calls,actualImportedFunctionReferencesPrivatelyRetained:true,typedInputNormSelectors:true,
        callerNormValuesOrSourceHashesAccepted:false,allFiniteRepresentationBudgetsSeparateFromMathematicalNormRecipe:true},
      scalarProgram:{schema:'MathScope.N6.TypedSourceCutoffNormExpressions/1',nodes:G.nodes,sourceResultNodeCount:G.nodes.filter(n=>n.op==='source_result').length},
      outputs,
      proof:{finiteDerivativeDemand:'An A_e output derivative of order j uses the complete source through j+2p+3. The fast N A1 term adds one torus derivative, so its original E_z input is required through m+2p+8.',
        sourceOnly:'Every input constant, S power and pole is selected from the same actual imported initialized norm producer at its displayed finite order. The fixed radial constants use that pole; caller numbers cannot become norms.',
        boundaryPole:'The maximum of the selected input poles weakens the input bounds since delta_*=min(1,d_a,d_b)<=1. The original Gaussian operator recurrence handles this entire finite pole.',
        positiveIBP:'The exact zero weighted Haar moments remove the zero mode at every slow point. Each of the p original radial integrations by parts uses the original Diophantine inverse and gains M^-1. The fixed producer retains all endpoint, cutoff, change-of-variable and Gaussian factors.',
        fastCutoff:'ci0 is independent of R,Z,T,Y on the fixed reference band and 0<ci0<=1 by the original floor-index factorization. The two coefficients of N have absolute sum sqrt(2); hence sqrt(2) times the A1 C^(m+1) norm bounds ci0*N*(-A1) in C^m.',
        pressureCentering:'The pressureRows fixed norm already includes 1+2^n*||rho||_n*wholeHaarProjection at n=m+2p+3. It multiplies the complete actual g_r norm, including old, new and quadratic terms.',
        exponent:'The source input exponent is 1-kappa_s. The result is 1-kappa_s+p*kappa_s; S_ref^(p*rho_g) is bounded by S_ref^p.',
        allFiniteFlatness:'For every finite m and every desired exponent A, choose the positive integer p=max(1,ceil((A-(1-kappa_s))/kappa_s)). The preceding finite source-only producer calls give the required bound on the same original domain.',
        smoothZeroExtension:'The original cutoff and seed are smooth with all edge derivatives zero. The unchanged original source bounds include the Gaussian weights at both radial edges. No moving endpoint is discarded before applying this source fact.'},
      scope:{actualSavedCutoffBodiesAuthenticated:true,actualWholeWeightedZeroMomentsAuthenticated:true,
        sameSourceAllFiniteNormRecipeBound:true,actualFiniteTypedCutoffCompositionExecuted:true,
        allFiniteCutoffFlatnessByOriginalPositiveIBP:true,originalLiveFamilyRuntimeRecreated:false,
        actualHighOrderSourceDerivativeBodiesMaterialized:false,selectedInputNormProgramExecuted:false,
        selectedFixedRadialOperatorNormsExecuted:false,wholeInitialTangentialResidualClassCertified:false,completeN6:false}};
  programSeals.set(program,{authority,family:s.family,functions:{...refs},record:canonicalStringify(program)});return program;
}

export function assertSavedInitializedCutoffNormProgram(program){
  const s=programSeals.get(program);require(s&&s.record===canonicalStringify(program)&&Object.keys(refs).every(k=>s.functions[k]===refs[k]),
    'Use the unchanged private source-bound positive-IBP program, not a copied certificate or changed norm selector.');
  assertSavedInitializedCutoffAuthority(s.authority);return true;
}

/** Optional finite instantiation. The source input remains its exact
 * norm AST; both fixed radial operator programs are actually executed.
 * No high-order derivative bodies of the original current are recreated.
 */
export async function instantiateSavedInitializedCutoffNormProgram(program,input={}){
  assertSavedInitializedCutoffNormProgram(program);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['maxNodes','maxWork'].includes(k)))
    fail('Choose finite representation budgets only.');
  const maxNodes=natural(input.maxNodes??300000,'Node budget'),maxWork=natural(input.maxWork??2000000,'Work budget'),
    s=programSeals.get(program),m=program.request.order,p=program.request.ibpOrder;
  require(maxNodes>=5000&&maxWork>=1,'Retain a complete positive finite source program budget.');
  // Check the original fixed producer demand before materializing any
  // upstream metadata. A too-small requested budget is never a zero norm.
  if(BigInt(m+2*p+5)**3n>BigInt(maxWork))fail('The requested finite IBP operator exceeds the explicit representation budget.','RESOURCE_LIMIT');
  const upstream=constructSavedInitializedNormProgram(s.family,{order:program.derivativeDemand.upstreamInitializedProgramOrder,maxNodes,maxWork});
  assertSavedInitializedNormProgram(upstream);
  const select=(object,path)=>{let v=object;for(const key of path){require(v!==undefined&&v!==null&&Object.hasOwn(v,key),'A typed norm result path is absent from the actual producer.');v=v[key];}return v;},
    naturalValues=new Map(),value=id=>{
      if(naturalValues.has(id))return naturalValues.get(id);const n=program.scalarProgram.nodes[id];
      require(n?.type==='natural','Resolve only natural source metadata in a radial request.');let v;
      if(n.op==='natural')v=BigInt(n.args[0]);
      else if(n.op==='source_result'){require(n.args[0]===0,'Only the upstream source producer supplies input power/pole metadata.');v=BigInt(natural(select(upstream,n.args[1]),'Actual source metadata'));}
      else if(n.op==='add')v=n.args.reduce((a,b)=>a+value(b),0n);
      else if(n.op==='maximum')v=n.args.reduce((a,b)=>{const c=value(b);return a>c?a:c;},0n);
      else fail('An unsupported natural source operation was requested.');naturalValues.set(id,v);return v;
    },operatorRequest=call=>{
      const pole=value(call.request.pole.naturalNode);
      if(pole>BigInt(Number.MAX_SAFE_INTEGER))fail('The finite source pole exceeds this representation budget.','RESOURCE_LIMIT');
      return {order:call.request.order,ibpOrder:p,pole:Number(pole),maxNodes,maxWork};
    },temporal=await prepareOriginalRadialClassMajorants(operatorRequest(program.callGraph.calls[1])),
    pressure=await prepareOriginalRadialClassMajorants(operatorRequest(program.callGraph.calls[2]));
  for(const r of [temporal,pressure]){
    assertOriginalRadialClassMajorants(r);
    require(r.source.parameterExpressionSHA256===program.source.parameterExpressionSHA256&&r.source.paperSHA256===program.source.paperSHA256&&
      r.checks.every(c=>c.pass),'The actual fixed radial source constants must have the same original source parameter and paper bodies.');
  }
  const sourceResults=program.scalarProgram.nodes.flatMap((n,id)=>{
    if(n.op!=='source_result')return[];const object=[upstream,temporal,pressure][n.args[0]],result=select(object,n.args[1]);
    if(n.type==='natural')return[{node:id,call:n.args[0],path:copy(n.args[1]),type:n.type,value:String(value(id))}];
    require(Number.isSafeInteger(result)&&result>=0&&(n.args[0]===0?!!upstream.scalarProgram.nodes[result]:!!object.G.nodes[result]),
      'Every scalar selector must resolve to the actual producer expression root.');
    return[{node:id,call:n.args[0],path:copy(n.args[1]),type:n.type,expressionRoot:result,
      namespace:n.args[0]===0?'same-source-input-scalar-program':'fixed-radial-source-expression-program'}];
  });
  for(const o of Object.values(program.outputs)){value(o.power);value(o.pole);}
  const fixedCertificates=[await originalRadialClassMajorantCertificate(temporal),await originalRadialClassMajorantCertificate(pressure)],
    record={schema:'MathScope.N6.SavedInitializedFiniteCutoffNormInstantiation/1',request:copy(program.request),source:copy(program.source),
      upstreamProgram:copy(upstream),fixedRadialPrograms:fixedCertificates,sourceResults,
      naturalResults:[...naturalValues].sort((a,b)=>a[0]-b[0]).map(([node,v])=>({node,value:String(v)})),
      outputs:copy(program.outputs),sourceNormNumbersInvented:false,
      scope:{actualSourceInputScalarProgramExecuted:true,actualFixedRadialOperatorProgramsExecuted:true,
        allTypedInputConstantsPowersAndPolesResolved:true,originalLiveFamilyRuntimeRecreated:false,
        actualHighOrderSourceDerivativeBodiesMaterialized:false,wholeInitialTangentialResidualClassCertified:false,completeN6:false}};
  finiteSeals.set(record,{program,upstream,temporal,pressure,record:canonicalStringify(record)});return record;
}

export function assertSavedInitializedFiniteCutoffNormInstantiation(result){
  const s=finiteSeals.get(result);require(s&&s.record===canonicalStringify(result),'Use the unchanged private finite cutoff norm instantiation.');
  assertSavedInitializedCutoffNormProgram(s.program);assertSavedInitializedNormProgram(s.upstream);
  assertOriginalRadialClassMajorants(s.temporal);assertOriginalRadialClassMajorants(s.pressure);return true;
}

export async function savedInitializedCutoffNormCertificate(program){
  assertSavedInitializedCutoffNormProgram(program);const text=canonicalStringify(program);
  return {schema:'MathScope.N6.SavedInitializedPositiveIBPNormCertificate/1',program:copy(program),
    graph:{sha256:await sha256(text),canonicalBytes:new TextEncoder().encode(text).length,
      typedScalarNodeCount:program.scalarProgram.nodes.length,producerCallCount:program.callGraph.calls.length},
    exactSameSourceDeferredNormExpressions:true,serializedCertificateIsNotPrivateSourceAuthority:true,scope:copy(program.scope)};
}
