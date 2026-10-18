/** Original complete background and higher-stress norm leaves.
 *
 * The source family already supplies the uniform complete F/G norms and
 * the diagonal normalized coefficient and weighted stress bounds. This
 * adapter binds them to the actual M3 background, computes the previously
 * missing full radial leading-profile norms, and applies the exact slow
 * chart recurrence. The unchanged flat background residual is not zeroed.
 */
import {assertGlobalPrimaryClassOperator,globalPrimaryClassOperatorCertificate} from './source-primary-class-majorants.mjs';
import {assertActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {exactSlowProfileExpansion} from '../../mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs';
import {compactCoefficientSourceFTC} from '../../mathscope-m2/navier/actual-compact-all-band-background-norms.mjs';
import {rectangularSourceFTC} from '../../mathscope-m2/navier/actual-background-physical-seminorms.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  total=a=>a.reduce((s,x)=>s+x,0),CHUNK=4096,
  snapshot=G=>({count:G.nodes.length,source:canonicalStringify(G.source),definitions:G.captureFunctionDefinitions(),
    chunks:Array.from({length:Math.ceil(G.nodes.length/CHUNK)},(_,j)=>canonicalStringify(G.nodes.slice(j*CHUNK,(j+1)*CHUNK)))}),
  unchanged=(G,s)=>G.nodes.length>=s.count&&canonicalStringify(G.source)===s.source&&G.functionDefinitionsUnchanged(s.definitions)&&
    s.chunks.every((x,j)=>x===canonicalStringify(G.nodes.slice(j*CHUNK,Math.min(s.count,(j+1)*CHUNK)))),
  record=p=>({schema:p.schema,request:p.request,source:p.source,domain:p.domain,binding:p.binding,
    normRecipe:p.normRecipe,sourceNorms:p.sourceNorms,rows:p.rows,checks:p.checks,scope:p.scope});

/** A fixed-order geometric argument, independent of any sampled q.
 * At n>=J>=2, q^(nh)<=q^(2h) FIRST. Only then use q=Q*s to obtain
 * q^(2h)<=4*epsilon_ref^2. Thus no unbounded factor 2^(nh) is lost.
 */
export function originalHigherStressTailRecipe(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Select the original finite derivative order and a work budget only.','INVALID_INPUT');
  const order=input.order??0,maxWork=input.maxWork??100000;
  if(!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxWork)||maxWork<1||order+10>maxWork)
    fail('The finite weighted-stress recipe exceeds the declared representation budget.','RESOURCE_LIMIT');
  const tailStarts=Math.max(2,order),finiteOrders=Array.from({length:tailStarts-1},(_,j)=>j+1),
    tailDenominator=1n<<BigInt(tailStarts-1);
  return {schema:'MathScope.N6.OriginalHigherStressTailRecipe/1',order,tailStarts,finiteOrders,
    originalFirstStressPole:3+3*order,tailCoefficient:{numerator:'1',denominator:String(tailDenominator)},
    sourceClass:'Sigma-Sigma0 in M_3',profileGain:'qActual^(2*h)',outsideScale:'epsilon_ref*s^(-A-1/2)',
    epsilonExponent:'3',qToEpsilonConstant:'4',
    hypotheses:['0<qActual<=1','qActual=Q_ref*s','1/2<=s<=2','0<h<1','epsilon_ref=Q_ref^h',
      'For every n>=J, every required profile/Euler weighted norm is among the original common-selector clauses m<=n.'],
    steps:[
      'Original selector: B_nm*b_n^(-n*h)<=2^-n; on the support of chi or any of its derivatives, qActual<=1/b_n.',
      'Hence B_nm*qActual^(2*n*h)<=2^-n*qActual^(n*h).',
      'Since n>=J>=2 and qActual<=1, qActual^(n*h)<=qActual^(2*h).',
      'Sum the exact geometric series sum_(n>=J)2^-n=2^(1-J).',
      'After that sum, qActual^(2*h)=epsilon_ref^2*s^(2*h)<=4*epsilon_ref^2.',
      'Keep the original outside epsilon_ref and every coefficient derivative of s^(-A-1/2).'],
    allEulerCutoffWeightsRequired:true,firstStressPoleRemoved:false,nonzeroCoefficientDiscarded:false,
    sourceAuthenticated:false,completeInitialClass:false};
}

function bindActualBackground(primary){
  const current=primary.current,{G,band}=current,{family,background}=band,
    {q:q0,X,eta}=background.coordinates,{epsilon}=band.geometry,q=(n,d=1)=>G.q(n,d),
    at=body=>G.simultaneousSubstitute(body,[q0,X,eta],[band.chart.qActual,band.chart.X,band.chart.eta]),
    p=(x,a)=>G.exp(G.mul(a,G.log(x))),stressScale=G.mul(epsilon,p(band.chart.s,G.neg(G.add(band.constants.A,q(1,2))))),
    leadingStress=family.leading.raw.map(body=>G.mul(stressScale,at(body))),
    expectedStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz].map(body=>G.mul(stressScale,at(body))),
    expectedRadial=G.div(G.add(G.mul(X,family.prepared.records[0].global.v),...background.rows.map(row=>
      G.mul(row.positivePower,G.sub(G.mul(row.reducedChi,X,row.sourceRoots.v),
        G.div(G.mul(q(2),eta,row.reducedExtra,row.sourceRoots.M),G.core.L))))),G.sqrt(G.mul(q(2),X))),
    allPositiveRows=background.rows.map(row=>({order:row.order,scale:row.scale,actual:copy(row.sourceRoots),
      exactOriginalCoefficients:row.sourceRoots.F===family.prepared.records[row.order].global.F&&
        row.sourceRoots.U===family.prepared.records[row.order].global.U&&row.sourceRoots.v===family.prepared.records[row.order].global.v&&
        row.sourceRoots.M===family.prepared.records[row.order].global.M&&row.sourceRoots.Ttheta===family.prepared.records[row.order].stress.Ttheta&&
        row.sourceRoots.Tz===family.prepared.records[row.order].stress.Tz,
      exactCommonScale:row.scale===family.selector.rows[row.order-1].scale,
      entireRadialCutoffCommutator:row.reducedChi===row.chi&&row.reducedExtra===row.extra}));
  return {graphNamespace:'current',actualFields:copy(band.fields),actualNormalizedBackground:copy(background.normalizedBodies),
    actualFullStress:copy(current.mean.residual.fullOriginalStress),actualLeadingStress:leadingStress,
    actualHigherStress:expectedStress.map((x,j)=>G.sub(x,leadingStress[j])),stressScale,
    literalStressNormalization:same(expectedStress,current.mean.residual.fullOriginalStress),
    literalCompleteRadialBracket:expectedRadial===background.normalizedBodies.b,
    allPositiveRows,window:copy(band.window),omittedTail:copy(background.omittedTail),
    actualLeadingRadialRoot:family.prepared.records[0].global.v,
    sourceClassMeaning:'The original stress Sigma in the background residual, not the later reconstructed Corollary8.5 current stress.',
    originalBackgroundFlatResidualRetained:true};
}

/** Generate finite source-only constants. The request is a derivative
 * order, never a numerical value or a caller assertion of class membership.
 * The parent family must already contain the required exact finite norm
 * rows; a larger order requests a larger coherent source family.
 */
export function attachGlobalBackgroundClass(primary,input={},context={}){
  assertGlobalPrimaryClassOperator(primary);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Only a finite derivative order and work budget may be selected.','INVALID_INPUT');
  const request={order:input.order??primary.request.order,maxWork:input.maxWork??100000},m=request.order,
    tailRecipe=originalHigherStressTailRecipe(request),current=primary.current,family=current.band.family;
  assertActualCommonAdmissibleFamily(family);
  const G=primary.G,PG=current.G,bg=family.source.backgroundNorms,stress=family.source.pressureStressSeminorms,
    finiteRows=family.norms.weightedStress,bgRows=bg.rows.slice(0,m+1),targetRows=primary.target.rows.slice(0,m+1);
  if(bgRows.length!==m+1||targetRows.length!==m+1||stress.request.derivativeOrder<m||
    family.selector.rows.length<tailRecipe.tailStarts||!bg.normalizedBlocks[m]||
    tailRecipe.finiteOrders.some(n=>n!==1&&!finiteRows.some(r=>r.order===n&&r.directWeightedBounds[m]!==undefined)))
    fail('Generate the actual same-family slow, weighted-target, normalized radial, and positive weighted-stress finite prefixes first.','RESOURCE_LIMIT');
  const ownStart=G.nodes.length,sourceStart=PG.nodes.length,q=(n,d=1)=>G.q(n,d),{h,Xa,Xb}=family.constants,
    {X,eta}=family.prepared.bootstrap.constants,s=G.fresh('m3_actual_background_norm_s'),
    Xlo=G.div(Xa,q(2)),Xhi=G.mul(q(2),Xb),
    box={coordinates:[s,X,eta],lower:[q(1,2),Xlo,q(-1)],upper:[q(2),Xhi,G.one]},
    profileBox={coordinates:[X,eta],lower:[Xlo,q(-1)],upper:[Xhi,G.one]},
    bMultiplier=G.exp(G.mul(q(-1,2),G.log(s))),
    stressMultiplier=G.exp(G.mul(G.neg(G.add(family.constants.A,q(1,2))),G.log(s))),
    leadingRadialBody=G.div(G.mul(X,family.prepared.records[0].global.v),G.sqrt(G.mul(q(2),X))),
    leadingSystem=G.defineExpressionFunction({name:'M3ActualCompleteLeadingRadialProfile',parameters:[X,eta],
      body:leadingRadialBody,derivativeLimits:[m+1,m+1]}),
    leadingValue=G.expressionValue(leadingSystem,[X,eta]),leadingMaterialized=G.materializeExpressionFunction(leadingSystem,[X,eta]),
    leadingFTC=[],coefficientFTC=[],coefficientCache=new Map(),leadingCache=new Map();
  let work=0;
  const charge=()=>{context.checkCancelled?.();if(++work>request.maxWork)fail('The complete actual background norm expansion exceeded its explicit finite work budget.','RESOURCE_LIMIT');};
  for(let r=0;r<=m;r++)for(let e=0;r+e<=m;e++){
    charge();const jet=G.expressionValue(leadingSystem,[X,eta],[r,e]),
      receipt=rectangularSourceFTC(G,{body:jet,...profileBox}),row={radialOrder:r,etaOrder:e,sourceJet:jet,...receipt};
    leadingFTC.push(row);leadingCache.set(r+':'+e,row);
  }
  const coefficientBound=body=>{
    if(coefficientCache.has(body))return coefficientCache.get(body);
    charge();const row=G.freeCoordinates(body).size===0?{body,bound:G.sqrt(G.add(G.one,G.pow(body,2))),sourceConstant:true,faces:[]}:
      compactCoefficientSourceFTC(G,{body,...box,name:'M3ActualBackgroundChartCoefficient_'+coefficientFTC.length});
    coefficientFTC.push(row);coefficientCache.set(body,row.bound);return row.bound;
  },expand=multiplier=>{
    const expansion=exactSlowProfileExpansion(G,{s,X,eta,h,multiplier,order:m,maxJetRequests:request.maxWork});
    return {...expansion,rows:expansion.rows.map(row=>({...row,terms:row.terms.map(t=>({...t,coefficientUpper:coefficientBound(t.coefficient)}))}))};
  };
  const radialExpansion=expand(bMultiplier),stressExpansion=expand(stressMultiplier),rows=[];
  for(let j=0;j<=m;j++){
    charge();const normalized=bg.normalizedBlocks[j],first=stress.n1Weighted,
      finite=Array.from({length:Math.max(2,j)-1},(_,n)=>n+1).map(n=>({order:n,
        bound:n===1?first.bounds[j]:finiteRows.find(r=>r.order===n).directWeightedBounds[j],
        pole:n===1?first.poles[j]:0,source:'Actual same-family cutoff Euler and direct weighted profile norm.'})),
      tailStarts=Math.max(2,j),tailConstant=q(1,1n<<BigInt(tailStarts-1)),
      weightedProfileConstant=G.add(...finite.map(r=>r.bound),tailConstant),
      radialRows=radialExpansion.rows.filter(r=>total(r.slowOrders)<=j).map(row=>({slowOrders:row.slowOrders,
        leading:G.add(...row.terms.filter(t=>t.profileOrders[0]===0).map(t=>G.mul(t.coefficientUpper,leadingCache.get(t.profileOrders[1]+':'+t.profileOrders[2]).bound))),
        positive:G.mul(q(4),normalized.coefficient,G.add(...row.terms.map(t=>t.coefficientUpper)))})),
      stressRows=stressExpansion.rows.filter(r=>total(r.slowOrders)<=j).map(row=>({slowOrders:row.slowOrders,
        constant:G.mul(q(4),weightedProfileConstant,G.add(...row.terms.map(t=>t.coefficientUpper)))})),
      bLeading=G.maximum(G.one,...radialRows.map(r=>r.leading)),bPositive=G.maximum(G.one,...radialRows.map(r=>r.positive)),
      higher=G.maximum(G.one,...stressRows.map(r=>r.constant)),pole=Math.max(first.poles[j],targetRows[j].pole),
      unit=(constant,epsilonExponent,extra={})=>({constant,power:0,epsilonExponent,pole:0,weight:'1',...extra,
        derivativeConvention:'Every ordinary slow mixed derivative of total order <= '+j+' at fixed original Q_ref; no auxiliary Y dependence.'});
    rows.push({order:j,F:unit(bgRows[j].Cslow,'0'),G:unit(bgRows[j].Cslow,'0'),
      FGMinusLeading:unit(bgRows[j].errorConstant,'2'),b:unit(G.add(bLeading,bPositive),'1'),
      bLeading:unit(bLeading,'1'),bMinusLeading:unit(bPositive,'3'),
      higherStress:unit(higher,'3',{pole,weight:'zeta'}),
      fullStress:unit(G.add(targetRows[j].N_m,higher),'1',{pole,weight:'zeta'}),
      targetLeadingConstant:targetRows[j].N_m,finiteWeightedStress:finite,tailStarts,tailConstant,
      weightedProfileConstant,radialRows,stressRows,actualNormalizedRadialBlock:copy(normalized)});
  }
  const binding=bindActualBackground(primary),checks=[
    {id:'same-private-complete-background-and-source-norm-family',pass:primary.target.family===family&&current.band.family===family},
    {id:'actual-original-full-radial-profile-body',pass:leadingMaterialized===leadingRadialBody&&G.expressionSystems[leadingSystem].body===leadingRadialBody},
    {id:'every-leading-radial-profile-FTC-jet-and-face-retained',pass:leadingFTC.length===(m+1)*(m+2)/2&&leadingFTC.every(r=>r.faces.length===4)},
    {id:'full-radial-cutoff-bracket-bound-to-the-actual-source',pass:binding.literalCompleteRadialBracket&&binding.allPositiveRows.every(r=>r.exactOriginalCoefficients&&r.exactCommonScale&&r.entireRadialCutoffCommutator)},
    {id:'original-stress-epsilon-and-s-normalization',pass:binding.literalStressNormalization&&current.mean.residual.fullHigherStressRetained},
    {id:'all-source-profile-and-slow-coefficient-derivatives-retained',pass:radialExpansion.includesCoefficientDerivatives&&stressExpansion.includesCoefficientDerivatives&&coefficientFTC.every(r=>r.sourceConstant||r.faces.length===8)},
    {id:'first-stress-poles-and-complete-geometric-tail-retained',pass:rows.every(r=>r.tailStarts>=2&&r.finiteWeightedStress[0].order===1&&r.finiteWeightedStress[0].pole===3+3*r.order&&r.higherStress.epsilonExponent==='3')},
    {id:'actual-common-selector-has-the-required-weighted-diagonal-clauses',pass:family.selector.rows.every(r=>r.constraints.some(c=>c.kind===(r.order===1?'first-stress-direct-zeta-with-endpoint-pole':'higher-stress-direct-zeta')&&c.derivativeOrder===r.order))},
    {id:'all-new-background-norm-constants-are-source-only',pass:rows.every(r=>['F','G','FGMinusLeading','b','bLeading','bMinusLeading','higherStress','fullStress'].every(k=>G.freeCoordinates(r[k].constant).size===0))},
    {id:'the-same-actual-window-and-full-background-residual-remain',pass:binding.omittedTail.missingCoefficientAssumedZero===false&&binding.originalBackgroundFlatResidualRetained}
  ];
  if(checks.some(r=>!r.pass))fail('Actual original background class binding failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const result={schema:'MathScope.N6.ActualBackgroundClass/1',G,primary,current,request,
    source:{paperSHA256:primary.source.paperSHA256,parameterExpressionSHA256:primary.source.parameterExpressionSHA256,
      sourcePages:[65,66,67,89,106,107],equations:['5.45','5.46','5.52','8.3','9.11'],
      normGraphNamespace:'primary.G',sourceGraphNamespace:'current.G',sameOriginalCommonFamily:true},
    domain:{s:['1/2','2'],X:[Xlo,Xhi],eta:['-1','1'],qActual:['positive','<=1'],Q_ref:['positive','<=1/2'],
      fixedSourceQBig:family.constants.qStar,sourceWindow:copy(current.band.window),
      weightedStressInterior:[Xa,Xb],deltaStar:'min(1,log(X/Xa),log(Xb/X))',closedEtaOneSided:true},
    binding,normRecipe:{tail:tailRecipe,radialExpansion,stressExpansion,work,
      allFiniteOrderProducer:'The same private family norm generators, full leading-profile FTC jets, and exact slow coefficient recurrence at the requested finite order.',
      radialGain:'epsilon_ref times the complete source radial bracket; the positive bracket carries qActual^(2h).',
      stressGain:'First bound every complete profile/Euler jet by qActual^(2h); then qActual^(2h)<=4*epsilon_ref^2; retain the outside epsilon_ref.',
      lowerPoleConversion:'deltaStar<=1, so each lower derivative pole is bounded by the retained maximum pole.',
      noFixedDerivativeOrderCap:true},
    sourceNorms:{backgroundRows:copy(bgRows),targetRows:copy(targetRows),leadingRadialBody,leadingSystem,leadingValue,
      leadingMaterialized,leadingFTC,coefficientFTC,normalizedBlocks:copy(bg.normalizedBlocks.slice(0,m+1))},rows,checks,
    scope:{actualFullBackgroundSlowNormsCertified:true,actualRadialBackgroundEpsilonGainCertified:true,
      actualHigherOriginalStressMThreeCertified:true,allFiniteOrdersBySameOriginalNormGenerator:true,
      actualFiniteDerivativeOrder:m,allIntegerDerivativeGraphsLiterallyExecuted:false,
      unchangedBackgroundFlatResidualRetained:true,actualCompleteInitialN6TupleClassCertified:false,
      allFiniteIterationStagesClassCertified:false,completeN6:false,newLeanKernelProof:false}};
  seals.set(result,{G,PG,primary,current,norm:snapshot(G),source:snapshot(PG),ownStart,sourceStart,
    record:canonicalStringify(record(result))});
  context.onProgress?.({stage:'actual-complete-background-class-sealed',nodeCount:G.nodes.length,order:m,
    radialFTC:leadingFTC.length,coefficientFTC:coefficientFTC.length});return result;
}

export function assertGlobalBackgroundClass(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.PG!==p.current?.G||s.primary!==p.primary||s.current!==p.current||
    s.record!==canonicalStringify(record(p))||!unchanged(p.G,s.norm)||!unchanged(p.current.G,s.source))
    fail('Use the unchanged privately attached actual background class.');
  assertGlobalPrimaryClassOperator(p.primary);return true;
}

export async function globalBackgroundClassCertificate(p){
  assertGlobalBackgroundClass(p);const s=seals.get(p),parent=await globalPrimaryClassOperatorCertificate(p.primary),
    program={schema:'MathScope.N6.ActualBackgroundClassProgram/1',parentGraph:parent.graph,record:record(p),
      norm:{start:parent.graph.normNodeCount,nodes:p.G.nodes.slice(parent.graph.normNodeCount,s.norm.count),definitions:s.norm.definitions},
      current:{start:parent.program.current.start+parent.program.current.nodes.length,
        nodes:p.current.G.nodes.slice(parent.program.current.start+parent.program.current.nodes.length,s.source.count),definitions:s.source.definitions}},
    encoded=canonicalStringify(program);
  return {...record(p),parent:parent.graph,program,graph:{sha256:await sha256(encoded),nodeCount:s.norm.count,
    currentNodeCount:s.source.count,canonicalBytes:new TextEncoder().encode(encoded).length,
    requiresCompleteAuthenticatedParentProgram:true},integerRootsAreNotNumericalNormValues:true};
}
