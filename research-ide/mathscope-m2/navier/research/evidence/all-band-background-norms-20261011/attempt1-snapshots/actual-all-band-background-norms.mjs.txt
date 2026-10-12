/** Uniform all-band finite-order slow norms of the original full background.
 * The full leading F0 includes the original I2 correction and heat tail.
 * Exact finite FTC integrals are constants, not decimal enclosures.
 * The arbitrary-order conclusion is the same authenticated finite recipe
 * and its induction; a finite regression is never an infinite execution.
 */
import {prepareActualCompletedBackgroundC2,assertActualCompletedBackgroundC2} from './actual-residual-order-induction-background.mjs';
import {assertActualNormalizedCutoffs,actualNormalizedFiniteBlock} from './actual-residual-order-induction-cutoffs.mjs';
import {assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {rectangularSourceFTC} from './actual-background-physical-seminorms.mjs';
import {exactSlowChartOperators,exactSlowChartIdentityAudit,exactSlowProfileExpansion} from './actual-all-band-background-norm-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),sum=a=>a.reduce((x,y)=>x+y,0);
const data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,domain:p.domain,leading:p.leading,
  chart:p.chart,coefficientExpansions:p.coefficientExpansions,coefficientFTC:p.coefficientFTC,normalizedBlocks:p.normalizedBlocks,
  rows:p.rows,gaussianRows:p.gaussianRows,heatRegularity:p.heatRegularity,regularity:p.regularity,checks:p.checks,roots:p.roots,scope:p.scope});

function requestFrom(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','derivativeOrder','maxCoefficientJets','maxJetRequests'].includes(k)))
    fail('INVALID_INPUT','Only the original profile, a finite derivative order and finite representation budgets are accepted.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,derivativeOrder=input.derivativeOrder??2,
    maxCoefficientJets=input.maxCoefficientJets??20000,maxJetRequests=input.maxJetRequests??100000;
  assertSourceProfile(sourceProfile);
  for(const [name,n]of Object.entries({derivativeOrder,maxCoefficientJets,maxJetRequests}))
    if(!Number.isSafeInteger(n)||n<(name==='derivativeOrder'?0:1))fail('INVALID_INPUT',name+' must be a finite nonnegative order or positive budget.');
  return {sourceProfile,derivativeOrder,maxCoefficientJets,maxJetRequests};
}

/** No h=0 approximation. The Gamma integral gives a global all-finite
 * z>=0 derivative majorant, including continuous one-sided endpoint jets.
 */
export function actualHeatAllFiniteDerivativeMajorant(G,{throughOrder=2}={}){
  if(!G||!Number.isSafeInteger(throughOrder)||throughOrder<0)fail('INVALID_INPUT','Use a finite heat derivative order.');
  const h=G.parameter('h'),rows=[];let hp=G.one,gp=G.one;
  for(let j=0;j<=throughOrder;j++){
    if(j){hp=G.mul(hp,G.add(h,G.q(j-1)));gp=G.mul(gp,G.add(h,G.q(j)));}
    rows.push({order:j,sourceHpochhammer:hp,sourceGammaRatio:gp,upper:G.mul(hp,gp),coarseUpper:G.q(factorial(j)*factorial(j+1)),
      sign:j%2?-1:1});
  }
  return {rows,sourceH:h,throughOrder,
    exactFormula:'(-1)^j H^(j)(z)=(h)_j/Gamma(1+h) integral_0^infinity exp(-v)*v^(h+j)*(1+z*v)^(-h-j) dv.',
    uniformBound:'|H^(j)(z)| <= (h)_j*(1+h)_j <= j!*(j+1)! for every z>=0 and 0<h<1.',
    domination:'On z>=0 the differentiated integrand is dominated by exp(-v)*v^(h+j); it is integrable at both ends. The formula and continuity follow by dominated convergence for each finite j.',
    mathematicalOrderCap:null,negativeZExtensionClaimed:false,sourceAuthenticated:false};
}

export function attachActualAllBandBackgroundNorms(background,input={},context={}){
  assertActualCompletedBackgroundC2(background);assertActualOrderInduction(background.prepared);assertActualNormalizedCutoffs(background.cutoffs);
  const request=requestFrom(input),{G,prepared,cutoffs}=background,{bootstrap}=prepared,full=bootstrap.actualHeat,{X,eta}=bootstrap.constants,
    m=request.derivativeOrder,q=(n,d=1)=>G.q(n,d),h=G.parameter('h');
  assertActualHeatLeading(full);
  if(prepared.program.profileId!==request.sourceProfile||prepared.order<Math.max(3,m))
    fail('RESOURCE_LIMIT','Generate the same actual canonical prefix through max(3,m), including every finite-block norm needed at m.');
  G.derivativeBudget(2*(m+3),m+3);
  const originalCount=G.nodes.length,originalPrefix=canonicalStringify(G.nodes),originalDefinitions=G.captureFunctionDefinitions(),
    s=G.fresh('all_band_norm_s'),Xlo=G.div(G.parameter('Xa'),q(2)),Xhi=G.mul(q(2),bootstrap.orderOne.Xb),
    box={coordinates:[s,X,eta],lower:[q(1,2),Xlo,q(-1)],upper:[q(2),Xhi,G.one]},profileBox={coordinates:[X,eta],lower:[Xlo,q(-1)],upper:[Xhi,G.one]},
    operators=exactSlowChartOperators(G,{s,X,eta,h}),chartAudit=exactSlowChartIdentityAudit(G,{s,X,eta,h}),
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    multipliers={leadingF:power(s,G.neg(G.add(operators.A,q(1,2)))),leadingG:power(s,G.neg(operators.A))};
  multipliers.positiveE=G.div(multipliers.leadingF,G.sqrt(G.mul(q(2),X)));
  multipliers.positiveU=multipliers.leadingG;
  const leadingRoots={F:prepared.records[0].global.F,U:prepared.records[0].global.U},leadingDefinitions={},leadingFTC=[],leadingJets={F:new Map(),U:new Map()};
  let jetRequests=0;
  const charge=()=>{if(++jetRequests>request.maxJetRequests)fail('RESOURCE_LIMIT','The finite source-jet request budget is exhausted. No missing norm is replaced by zero.');};
  for(const [field,root]of Object.entries(leadingRoots)){
    const node=G.nodes[root],expectedBody=field==='F'?full.heat.finalF:bootstrap.finalU;
    if(node.op!=='actual_expression_partial'||!same(node.args[1],[X,eta])||!same(node.args[2],[0,0])||G.expressionSystems[node.args[0]]?.body!==expectedBody)
      fail('INVALID_SOURCE_CONSTRUCTION','The full actual leading '+field+' body is missing or was replaced by an active-support formula.');
    leadingDefinitions[field]={root,system:node.args[0],body:expectedBody,parameters:[X,eta],valueMaterialization:G.materializeExpressionFunction(...node.args),actualBodyRetained:true};
    if(leadingDefinitions[field].valueMaterialization!==expectedBody)fail('INTERNAL_VALIDATION','The retained full leading value does not materialize to its actual source body.');
    for(let n=0;n<=m;n++)for(let r=0;r<=n;r++){
      charge();const e=n-r,jet=G.expressionValue(node.args[0],[X,eta],[r,e]),receipt=rectangularSourceFTC(G,{body:jet,...profileBox}),row={field,radialOrder:r,etaOrder:e,sourceJet:jet,...receipt};
      leadingFTC.push(row);leadingJets[field].set(r+':'+e,row);
    }
  }
  context.onProgress?.({stage:'all-band-full-leading-FTC',nodeCount:G.nodes.length,sourceJetCount:leadingFTC.length});
  const coefficientExpansions={},coefficientFTC=[],coefficientCache=new Map();
  const coefficientBound=root=>{
    if(root===G.zero)return G.zero;if(coefficientCache.has(root))return coefficientCache.get(root);
    if(coefficientFTC.length>=request.maxCoefficientJets)fail('RESOURCE_LIMIT','The actual coefficient FTC budget is exhausted.');
    charge();let record;
    if(G.freeCoordinates(root).size===0)record={body:root,bound:G.sqrt(G.add(G.one,G.pow(root,2))),faces:[],sourceConstant:true};
    else record={...rectangularSourceFTC(G,{body:root,...box}),sourceConstant:false};
    coefficientFTC.push(record);coefficientCache.set(root,record.bound);return record.bound;
  };
  for(const [field,multiplier]of Object.entries(multipliers)){
    const expansion=exactSlowProfileExpansion(G,{s,X,eta,h,multiplier,order:m,maxJetRequests:request.maxJetRequests});
    coefficientExpansions[field]={...expansion,rows:expansion.rows.map(row=>({...row,terms:row.terms.map(t=>({...t,coefficientUpper:coefficientBound(t.coefficient)}))}))};
  }
  const normalizedBlocks=Array.from({length:m+1},(_,j)=>actualNormalizedFiniteBlock(cutoffs,{derivativeOrder:j},context)),rows=[];
  const expansionAt=(field,alpha)=>coefficientExpansions[field].rows.find(row=>same(row.slowOrders,alpha));
  for(let j=0;j<=m;j++){
    const derivatives=[];
    for(const row of coefficientExpansions.leadingF.rows){
      if(sum(row.slowOrders)>j)continue;
      const alpha=row.slowOrders,leadingBound=(field,profileField)=>G.add(...expansionAt(field,alpha).terms.filter(t=>t.profileOrders[0]===0).map(t=>{
        const actual=leadingJets[profileField].get(t.profileOrders[1]+':'+t.profileOrders[2]);
        if(!actual)fail('INTERNAL_VALIDATION','A full leading mixed jet was not generated before its slow norm.');
        return G.mul(t.coefficientUpper,actual.bound);
      })),positiveBound=field=>G.mul(normalizedBlocks[j].coefficient,G.add(...expansionAt(field,alpha).terms.map(t=>t.coefficientUpper))),
        F0=leadingBound('leadingF','F'),G0=leadingBound('leadingG','U'),Ferror=G.mul(q(4),positiveBound('positiveE')),Gerror=G.mul(q(4),positiveBound('positiveU'));
      derivatives.push({slowOrders:alpha,leadingF:F0,leadingG:G0,FErrorConstant:Ferror,GErrorConstant:Gerror,
        FTotal:G.add(F0,Ferror),GTotal:G.add(G0,Gerror)});
    }
    const Cslow=G.maximum(G.one,...derivatives.flatMap(r=>[r.FTotal,r.GTotal])),errorConstant=G.maximum(G.one,...derivatives.flatMap(r=>[r.FErrorConstant,r.GErrorConstant]));
    rows.push({derivativeOrder:j,Cslow,normalizedTailCoefficient:normalizedBlocks[j].coefficient,errorConstant,derivatives,
      estimate:'Every ordinary slow derivative of F and G of total order<=m has absolute value<=Cslow, for every original band Q<=1/2 and q=Q*s<=1.',
      proximity:'The corresponding completed-minus-leading derivative is <=errorConstant*epsilon^2; the fixed Q is not differentiated.'});
  }
  const Renv=G.parameter('C12EnvelopeR'),Bnorm=G.add(q(1n<<128n),G.pow(Renv,4096),...['FGErrorConstant','bTotalConstant','FTotalConstant','GTotalConstant'].map(name=>background.roots[name]),background.chart.operatorA,background.chart.operatorB),
    r0=q(1,1n<<34n),Tg=G.add(q(4),G.sqrt(q(2))),Lmax=G.mul(q(2),r0,Tg),gaussianRows=[];
  for(let j=0;j+2<=m;j++)gaussianRows.push({derivativeOrder:j,backgroundDerivativeOrder:j+2,
    B_m:G.maximum(Bnorm,rows[j+2].Cslow,q(factorial(j+2)),Lmax,q(2)),Bnorm,C_mPlusTwo:rows[j+2].Cslow,Lmax,
    sourceMeaning:'A source-only base for the original all-order moving matrix/physical jet ledger; no matrix or Gaussian source binding is asserted here.'});
  const exponent=sourceExponentContract(),heatMajorant=actualHeatAllFiniteDerivativeMajorant(G,{throughOrder:m+2}),
    heatArgumentCheck=sourceGraphRationalIdentity(G,G.sub(full.heat.heatArgument,G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X))),
    heatRegularity={...heatMajorant,actualGammaRoot:full.heat.gamma,actualHeatLossRoot:full.heat.heatLoss,actualHeatChangeRoot:full.heat.heatChange,
      actualI2CorrectionRoot:full.heat.correction,actualI2System:full.heat.system,actualI2Values:full.heat.values,actualHeatArgument:full.heat.heatArgument,
      heatArgumentCheck,sourceExponent:exponent,fullPositiveHeatAndI2Preserved:true,sourceAuthenticated:true,
      etaDerivativeDomination:'At fixed positive X, z=2(1-eta^2)/X has only its first two nonzero eta derivatives. Finite chain rules reduce every eta jet to the displayed integrable Laplace moments. In each improper heat debt integral, each added z derivative supplies the corresponding inverse-X decay, preserving the original integrable bound.',
      I2Regularity:'The retained I2 finite-dimensional map is smooth in eta at every finite order by the same integrable heat moments. Its original contraction has derivative norm<=1/4, so the implicit Jacobian has inverse norm<=4/3; repeated implicit differentiation gives all finite eta jets. The value is the actual root, not the recorded finite iterate.'},
    regularity={leading:'The full F0/U0 retain every original natural field, activation, outer stage, moment correction and smooth flat join. On Xa/2<=X<=2Xb all radial divisions have positive denominators. Original radial equations yield every finite real derivative; no complex analyticity of the activation collar is used.',
      coefficientFunctions:'The exact slow chart has s>=1/2, X>=Xa/2>0, L=1-2h eta^2>=1-2h>0, so every coefficient has all finite derivatives on the fixed rectangle.',
      positiveInduction:background.induction.proofKind,allFinitePositiveSourceOrders:background.induction.allIntegerOrdersBySameWellFoundedRecipe,
      enlargedCutoffRule:'For any fixed prefix-independent recursive b_n>=c_n, original Euler cutoff derivative bounds do not depend on b_n. The same finite block and geometric tail constants therefore apply to every such enlarged sequence.',
      localFiniteness:'b_n>=c_n>=2^n; every q-compact set in q>0 has finitely many active terms and all cutoff derivatives. This justifies differentiating the complete sum.',
      allFiniteOrderProof:'For each finite m, generate the full leading FTC derivatives and the finite normalized block through max(3,m). The remaining n>=max(3,m) use their own diagonal source bounds. Apply the exact coefficient recurrence at m. Every term is finite and independent of ell, q, Q and mesh labels.',
      endpoint:'At eta=+-1 use continuous one-sided heat jets from T>=0. No negative-time heat integral or two-sided eta extension is asserted.',
      numericalQuadratureUsed:false},
    checks=[
      {id:'authenticated-original-completed-background-and-canonical-induction',pass:background.pass&&background.induction.allIntegerOrdersBySameWellFoundedRecipe&&cutoffs.canonical},
      {id:'full-leading-F0-including-I2-and-heat-retained',pass:leadingDefinitions.F.body===full.heat.finalF&&full.program.heat.tailTruncated===false&&full.program.I2.finiteIterateDeclaredRoot===false},
      {id:'full-leading-U0-retained',pass:leadingDefinitions.U.body===bootstrap.finalU},
      {id:'same-enlarged-source-rectangle',pass:same(background.chart.domain.X,[Xlo,Xhi])&&bootstrap.orderOne.Xb===full.heat.Xb},
      {id:'exact-inverse-slow-chart-and-commutators',pass:chartAudit.pass},
      {id:'same-positive-source-h-and-real-heat-argument',pass:exponent.positive&&exponent.upperBoundExact==='2^-4096'&&same(G.source.parametersExactExpressions.h,exponent.hExact)&&heatArgumentCheck.pass},
      {id:'complete-full-leading-FTC-family',pass:leadingFTC.length===(m+1)*(m+2)&&leadingFTC.every(r=>r.faces.length===4)},
      {id:'all-coefficient-derivatives-and-FTC-faces-retained',pass:Object.values(coefficientExpansions).every(x=>x.includesCoefficientDerivatives)&&coefficientFTC.every(x=>x.sourceConstant||x.faces.length===8)},
      {id:'every-finite-block-keeps-the-original-n1-and-n2',pass:normalizedBlocks.every(b=>b.finite.some(r=>r.order===1)&&b.finite.some(r=>r.order===2))},
      {id:'source-only-uniform-constants-have-no-free-coordinate',pass:[...rows.map(r=>r.Cslow),...rows.map(r=>r.errorConstant),...gaussianRows.map(r=>r.B_m)].every(root=>G.freeCoordinates(root).size===0)},
      {id:'original-source-prefix-and-definitions-unchanged',pass:canonicalStringify(G.nodes.slice(0,originalCount))===originalPrefix&&G.functionDefinitionsUnchanged(originalDefinitions)}
    ];
  if(!checks.every(r=>r.pass))fail('INTERNAL_VALIDATION','The all-band background norm source checks failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const roots={Bnorm,Lmax,...Object.fromEntries(rows.map(r=>['Cslow_'+r.derivativeOrder,r.Cslow])),...Object.fromEntries(gaussianRows.map(r=>['GaussianB_'+r.derivativeOrder,r.B_m]))},
    result={G,background,prepared,cutoffs,request,sourceBinding:{sourceProfile:request.sourceProfile,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,
      sourceCoefficientPrefix:prepared.order,actualFullLeadingDefinition:true,originalSourceModulesChanged:false},domain:{s:['1/2','2'],X:[Xlo,Xhi],eta:['-1','1'],q:['positive','<=1'],Q:['positive','<=1/2'],closedEtaIsOneSided:true},
      leading:{roots:leadingRoots,definitions:leadingDefinitions,ftcRows:leadingFTC,box:profileBox},chart:{coordinates:[s,X,eta],multipliers,coefficients:operators.coefficients,audit:chartAudit,box},
      coefficientExpansions,coefficientFTC,normalizedBlocks,rows,gaussianRows,heatRegularity,regularity,checks,roots,
      scope:{actualAllBandFiniteSlowNormRecipe:true,actualGeneratedSlowOrder:m,arbitraryFiniteOrderBySameAuthenticatedRecipe:true,
        independentOfEllAndMeshLabels:true,uniformUnderCanonicalCutoffEnlargement:true,fullLeadingHeatAndI2Included:true,
        allIntegerGraphsLiterallyExecuted:false,actualNumericalConstantsEnclosed:false,commonPhysicalSelectorAttached:false,
        actualAllBandHConstructed:false,allLabelCovariancePositivityAttached:false,wholeGPOSComplete:false,wholeGN5Complete:false,wholeM2Complete:false,M3Started:false}};
  // A stable issued program is separate from the live append-only source.
  const packed=G.pack(roots,{schema:'MathScope.ActualAllBandBackgroundNorms/1',request,sourceBinding:result.sourceBinding,domain:result.domain,
    leading:result.leading,chart:result.chart,coefficientExpansions,coefficientFTC,normalizedBlocks,rows,gaussianRows,heatRegularity,regularity,checks,scope:result.scope});
  result.program=JSON.parse(canonicalStringify(packed));
  seals.set(result,{G,background,prepared,cutoffs,nodeCount:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result),program:canonicalStringify(result.program)});
  context.onProgress?.({stage:'all-band-background-norms-sealed',nodeCount:G.nodes.length,sourceJetCount:leadingFTC.length,coefficientFTCCount:coefficientFTC.length,derivativeOrder:m});
  return result;
}

export function assertActualAllBandBackgroundNorms(result){
  const s=seals.get(result);
  if(!s||s.G!==result.G||s.background!==result.background||s.prepared!==result.prepared||s.cutoffs!==result.cutoffs||
    canonicalStringify(s.G.nodes.slice(0,s.nodeCount))!==s.prefix||!s.G.functionDefinitionsUnchanged(s.definitions)||data(result)!==s.data||canonicalStringify(result.program)!==s.program)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally constructed full-source all-band background norm certificate.');
  assertActualCompletedBackgroundC2(s.background);return true;
}

export function prepareActualAllBandBackgroundNorms(input={},context={}){
  const request=requestFrom(input),background=prepareActualCompletedBackgroundC2({sourceProfile:request.sourceProfile,order:Math.max(3,request.derivativeOrder),
    maxDerivativeOrder:Math.max(128,2*(request.derivativeOrder+3))},context);
  return attachActualAllBandBackgroundNorms(background,request,context);
}

export async function actualAllBandBackgroundNormCertificate(result){
  assertActualAllBandBackgroundNorms(result);const s=seals.get(result),text=s.program;
  return {schema:'MathScope.ActualAllBandBackgroundNormCertificate/1',request:result.request,sourceBinding:result.sourceBinding,
    domain:result.domain,rows:result.rows,gaussianRows:result.gaussianRows,checks:result.checks,scope:result.scope,
    graph:{sha256:await sha256(text),nodeCount:s.nodeCount,compilerBytes:new TextEncoder().encode(text).length},pass:result.checks.every(r=>r.pass)};
}
