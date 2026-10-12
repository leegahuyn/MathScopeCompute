/** A checked restriction proof for the ORIGINAL correction operators.
 *
 * The large source constructions were observed in the immutable inner and
 * domain runs. This module revalidates those records and executes a new,
 * small support induction. It does not reconstruct the nonzero corrections.
 * Every correction vanishes on the same OPEN core X<Xa; consequently its
 * derivatives and every potential-cutoff product vanish there as well.
 */
import {recordedInnerGrowth} from './source-inner-growth-evidence.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';

const copy=x=>structuredClone(x),canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',
  same=(a,b)=>canonical(a)===canonical(b),seals=new WeakMap(),
  fail=(message,code='INVALID_SOURCE_RESTRICTION')=>{throw Object.assign(new Error(message),{code});};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a;};
const fraction=x=>{const [n,d='1']=String(x).split('/');let a=BigInt(n),b=BigInt(d);if(!b)fail('A zero rational denominator is not a source value.');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];};
const cmp=(a,b)=>{const [an,ad]=fraction(a),[bn,bd]=fraction(b),v=an*bd-bn*ad;return v<0n?-1:v>0n?1:0;};
const rationalText=([n,d])=>d===1n?String(n):String(n)+'/'+String(d);
const subR=(a,b)=>{const [an,ad]=fraction(a),[bn,bd]=fraction(b);return rationalText(fraction(String(an*bd-bn*ad)+'/'+String(ad*bd)));};

// Commutative differential polynomials with exact integer coefficients.
// A variable includes its Cartesian derivative multi-index. This checks the
// actual Navier--Stokes increment and the FULL curl product rule without a
// numerical test point or assigning a value to the unknown background.
const clean=p=>new Map([...p].filter(([,v])=>v!==0n));
const add=(...ps)=>{const out=new Map();for(const p of ps)for(const [k,v]of p)out.set(k,(out.get(k)??0n)+v);return clean(out);};
const scale=(p,n)=>clean(new Map([...p].map(([k,v])=>[k,v*BigInt(n)])));
const mul=(a,b)=>{const out=new Map();for(const [ka,va]of a)for(const [kb,vb]of b){const k=[...JSON.parse(ka),...JSON.parse(kb)].sort().join('\u0000');out.set(k,(out.get(k)??0n)+va*vb);}return clean(new Map([...out].map(([k,v])=>[JSON.stringify(k?k.split('\u0000'):[]),v])));};
const atom=(name,orders=[0,0,0,0])=>new Map([[JSON.stringify([name+'|'+orders.join(',')]),1n]]);
const derivative=(p,d)=>{const out=[];for(const [key,value]of p){const factors=JSON.parse(key);for(let j=0;j<factors.length;j++){const [name,raw]=factors[j].split('|'),orders=raw.split(',').map(Number);orders[d]++;const next=[...factors];next[j]=name+'|'+orders.join(',');out.push(new Map([[JSON.stringify(next.sort()),value]]));}}return add(...out);};
const pack=p=>[...p].sort(([a],[b])=>a.localeCompare(b)).map(([monomial,coefficient])=>({coefficient:String(coefficient),factors:JSON.parse(monomial)}));
const equal=(a,b)=>add(a,scale(b,-1)).size===0;
const ns=(u,p)=>u.map((v,j)=>add(derivative(v,3),...u.map((w,i)=>mul(w,derivative(v,i))),
  ...[0,1,2].map(i=>scale(derivative(derivative(v,i),i),-1)),derivative(p,j)));
const restrictCorrections=p=>new Map([...p].filter(([k])=>!JSON.parse(k).some(x=>/^du[0-2]\||^dp\|/.test(x))));

/** The recipe lists the precise support-sensitive choices in §§7--10.
 * Changing a choice is permitted only in negative controls; the verified
 * source consumer always constructs this original recipe internally.
 */
export function originalCoreRestrictionRecipe(){
  const curlProducts=[0,1,2].map(i=>{const j=(i+1)%3,k=(i+2)%3;return {component:i,terms:[
    {sign:1,potential:k,potentialDerivative:j,cutoffDerivative:null},
    {sign:-1,potential:j,potentialDerivative:k,cutoffDerivative:null},
    {sign:1,potential:k,potentialDerivative:null,cutoffDerivative:j},
    {sign:-1,potential:j,potentialDerivative:null,cutoffDerivative:k}]};});
  return {schema:'MathScope.N7.OriginalCoreSupportRecipe/1',
    core:{point:'1/2',openCollar:['1/4','3/4'],shellInner:'1',allAuxiliaryCoordinates:true},
    primary:{radialZeroExtension:true,guardBeforeBody:true},
    residual:{subtractUnchangedBaseResidual:true,retainBaseFlatResidualSeparately:true,fullQuadraticVelocityProducts:true},
    pulse:{fixedCoordinates:['R','Z','T','xi'],zeroInitialData:true,finalRectangleCutoff:true},
    signed:{divideOnlyInsideOpenShell:true,originalPositivePrimaryDenominator:true,zeroExtensionBeforeDivisionOutside:true},
    radial:{path:'0<=r_prime<=r',fixedPhysicalZT:true,qIndependentOfRadius:true,torusShiftChangesOnlyY:true,
      sourceZeroForEveryY:true,innerCutoffValue:'0',fullIntegralRetained:true,subtractCutoffTimesFullIntegral:true},
    temporal:{inverseCoordinates:['y0','y1'],fixedSlowCoordinates:['R','Z','T'],zeroFourierMode:'0',exactLimit:true},
    moments:{sourceProfilesInsideOriginalImean:true,potentialHullInsideOriginalImean:true,globalMomentsMayBeNonzero:true},
    summation:{sameOpenZeroCollarForEveryStage:true,applyCutoffOnPotentialsBeforeCurl:true,cutoffDependsOnlyOnQ:true,
      scalarCutoffValuesOrStageConstantsUsed:false,includeFiniteInitialization:true,curlProducts}};
}

/** Execute a support induction and differential polynomial identities.
 * This standalone kernel grants no source authenticity. Its source caller
 * binds the original parameter graph, recorded initial premises and fields.
 */
export function verifyOriginalCoreSupportInduction(recipe){
  if(!recipe||recipe.schema!=='MathScope.N7.OriginalCoreSupportRecipe/1')fail('Expected the complete original support recipe.');
  const r=copy(recipe),proof=[],record=(id,pass,evidence)=>{proof.push({id,pass:pass===true,evidence});if(!pass)fail('The original support proof failed at '+id+'.');};
  record('strict-open-core-collar',r.core&&Array.isArray(r.core.openCollar)&&r.core.openCollar.length===2&&
    cmp('0',r.core.openCollar[0])<0&&cmp(r.core.openCollar[0],r.core.point)<0&&cmp(r.core.point,r.core.openCollar[1])<0&&
    cmp(r.core.openCollar[1],r.core.shellInner)<0&&r.core.allAuxiliaryCoordinates,
  {normalizedCoordinate:'X/Xa',point:r.core.point,openCollar:r.core.openCollar,strictGap:subR(r.core.shellInner,r.core.openCollar[1])});

  const trace=[],known=new Set(),make=(operator,inputs,zero,detail)=>{const row={id:trace.length,operator,inputs:inputs.map(x=>x.id),
    zeroOnOpenCore:zero,detail};trace.push(row);known.add(row);return row;},
    z=(operator,detail)=>make(operator,[],true,detail),unknown=(operator,detail)=>make(operator,[],false,detail),
    sum=(operator,...inputs)=>make(operator,inputs,inputs.every(x=>known.has(x)&&x.zeroOnOpenCore),'A sum is zero only when every summand is zero on the same open set.'),
    product=(operator,...inputs)=>make(operator,inputs,inputs.every(x=>known.has(x))&&inputs.some(x=>x.zeroOnOpenCore),'A product has an actual zero factor; other factors are not assigned zero.'),
    diff=(operator,input)=>make(operator,[input],known.has(input)&&input.zeroOnOpenCore,'Every derivative of an identically zero function on an open set is zero there.'),
    globalIntegral=input=>make('FULL_RADIAL_MOMENT',[input],false,'An annular source can have a nonzero full radial integral. It is retained as unknown.'),
    radial=input=>{
      const c=r.radial;
      record('radial-prefix-fixed-physical-geometry-'+trace.length,known.has(input)&&input.zeroOnOpenCore&&c.path==='0<=r_prime<=r'&&
        c.fixedPhysicalZT&&c.qIndependentOfRadius&&c.torusShiftChangesOnlyY&&c.sourceZeroForEveryY,
      {identity:'X_prime=r_prime^2/(2q)<=r^2/(2q)=X<Xa',shift:'Y may change; the input is zero for every Y.'});
      const prefix=z('PHASE_FOLLOWING_PREFIX_ZERO','Every point of the full forward radial path is below Xa; no accumulated exterior moment is discarded.'),
        full=globalIntegral(input),cutoff=c.innerCutoffValue==='0'?z('ORIGINAL_CHI_M_INNER_ZERO','chi_m is identically zero below the shell.'):unknown('CHANGED_CHI_M','The changed inner cutoff may multiply a nonzero global integral.');
      record('original-supported-radial-operator-'+trace.length,c.fullIntegralRetained&&c.subtractCutoffTimesFullIntegral,
        {definition:'T_e f=R^(-e)*(I(R^e f)-chi_m*J(R^e f)), e=0,1,2',fullIntegralDeclaredZero:false});
      const result=sum('SUPPORTED_RADIAL_PRIMITIVE',prefix,product('CHI_M_TIMES_FULL_MOMENT',cutoff,full));
      record('radial-primitive-actually-zero-'+trace.length,result.zeroOnOpenCore,{result:result.id});return result;
    };
  record('original-primary-zero-extension',r.primary?.radialZeroExtension&&r.primary.guardBeforeBody,
    {inside:'The actual primary pulse/curl body is needed only for Xa<X<Xb.',outside:'Zero is selected before an inverse, square root or pulse body is evaluated.'});
  const primaryPotential=z('PRIMARY_SUPPORTED_WAVE_POTENTIAL','The original radial shell extension in (7.29), (7.35), Prop9.3 and Def9.4.'),
    primaryVelocity=diff('PRIMARY_FULL_CURL',primaryPotential),initialMean=z('INITIAL_ZERO_MEAN','Before initialization beta=v=gamma=0.'),
    stress=z('ORIGINAL_SUPPORTED_BASE_STRESS','The fixed actual base residual stress is supported in the common original shell; its flat base residual is separate.');

  const base=[0,1,2].map(i=>atom('u'+i)),du=[0,1,2].map(i=>atom('du'+i)),p=atom('p'),dp=atom('dp'),baseResidual=ns(base,p),
    totalResidual=ns(base.map((x,i)=>add(x,du[i])),add(p,dp)),
    actualInput=totalResidual.map((x,i)=>r.residual?.subtractUnchangedBaseResidual?add(x,scale(baseResidual[i],-1)):x),
    explicitIncrement=du.map((x,j)=>add(derivative(x,3),...base.map((u,i)=>mul(u,derivative(x,i))),
      ...du.map((v,i)=>mul(v,derivative(base[j],i))),...du.map((v,i)=>mul(v,derivative(x,i))),
      ...[0,1,2].map(i=>scale(derivative(derivative(x,i),i),-1)),derivative(dp,j))),
    restricted=actualInput.map(restrictCorrections);
  record('literal-full-NS-increment-and-base-residual-separation',r.residual?.retainBaseFlatResidualSeparately&&
    r.residual.fullQuadraticVelocityProducts&&actualInput.every((x,i)=>equal(x,explicitIncrement[i]))&&restricted.every(x=>x.size===0),
    {coordinateOrder:['x1','x2','x3','t'],fullIncrement:actualInput.map(pack),restrictedIncrement:restricted.map(pack),
      baseResidualRetained:baseResidual.map(pack),baseResidualAssumedZero:false,actualPDEDeclaredSolved:false});
  const residual=sum('SUPPORTED_NONBASE_RESIDUAL',diff('RESIDUAL_OF_SUPPORTED_INCREMENT',primaryVelocity),stress),
    assumedState=z('INDUCTION_HYPOTHESIS','All wave/mean potentials, direct azimuthal corrections and perturbation pressure at stage j vanish on this same open core.'),
    nextSource=sum('STAGE_J_SUPPORTED_INPUT',residual,diff('FULL_DIFFERENTIAL_AND_PRODUCT_INCREMENT',assumedState));

  record('forward-pulse-preserves-the-core',same(r.pulse?.fixedCoordinates,['R','Z','T','xi'])&&r.pulse.zeroInitialData&&r.pulse.finalRectangleCutoff,
    {equation:'d_v a=M(v)a+f(v), a(0)=0',onCore:'f(v)=0 along the entire path; the unique solution is zero.',sourceMatrixValueAssigned:false});
  const pulse=make('ZERO_DATA_PULSE_INVERSE',[nextSource],nextSource.zeroOnOpenCore,'The slow X and transverse coordinate stay fixed on the entire Volterra path.'),
    pulsePotential=product('FINAL_RECTANGLE_CUTOFF',pulse,unknown('ORIGINAL_PSI','Its value is immaterial for an already zero solution.')),
    currentDefect=globalIntegral(nextSource);
  record('original-fixed-moment-profile-support',r.moments?.sourceProfilesInsideOriginalImean&&r.moments.potentialHullInsideOriginalImean&&r.moments.globalMomentsMayBeNonzero,
    {profiles:'The five executed original scaled profiles and their radial potential hull lie above Xa in Imean.',globalTargetsAssignedZero:false});
  const profile=z('ORIGINAL_IMEAN_PROFILE','The source parameter inequalities place the whole five-profile support above Xa.'),
    profileDefect=product('PROFILE_TIMES_CURRENT_GLOBAL_DEFECT',profile,currentDefect),
    correctedStress=radial(sum('ZERO_MOMENT_SUPPORTED_STRESS_SOURCE',nextSource,profileDefect));
  record('signed-division-never-evaluates-outside-the-shell',r.signed?.divideOnlyInsideOpenShell&&r.signed.originalPositivePrimaryDenominator&&r.signed.zeroExtensionBeforeDivisionOutside,
    {inside:'delta a=H^(-1)(Sigma/epsilon)/(2*a_primary); the original fixed primary denominator is positive only inside.',
      outside:'The prescribed zero extension is selected first.',zeroOverZeroEvaluated:false});
  const signed=z('SIGNED_CORRECTION_OPEN_SHELL_THEN_ZERO_EXTENSION','No division by a zero endpoint/outer primary amplitude is executed.');

  record('temporal-Fourier-inverse-is-local-in-all-slow-variables',same(r.temporal?.inverseCoordinates,['y0','y1'])&&
    same(r.temporal.fixedSlowCoordinates,['R','Z','T'])&&r.temporal.zeroFourierMode==='0'&&r.temporal.exactLimit,
    {onCore:'Every actual Fourier coefficient is integral of the zero function and equals zero. Every nonzero multiplier coefficient remains zero; the fixed zero mode is zero.',
      spatialInverseUsed:false,finiteFourierTruncationReplacesLimit:false});
  const temporal=make('EXACT_ZERO_MEAN_TEMPORAL_INVERSE',[nextSource],nextSource.zeroOnOpenCore,'The original inverse acts on Y only and fixes R,Z,T.'),
    temporalPotential=radial(temporal),temporalVelocity=diff('FULL_MERIDIONAL_CURL',temporalPotential),
    fiveMomentPotential=radial(profileDefect),fiveMomentVelocity=diff('FIVE_MOMENT_MERIDIONAL_CURL',fiveMomentPotential),
    pressure=radial(sum('PRESSURE_SOURCE_GR_MINUS_RHO_P',nextSource,profileDefect)),
    nextState=sum('ALL_FOUR_ORDERED_CORRECTIONS_AND_RECONSTRUCTED_PRESSURE',assumedState,pulsePotential,signed,temporalVelocity,
      temporal,profileDefect,fiveMomentVelocity,pressure,correctedStress);
  record('finite-initialization-and-induction-close',initialMean.zeroOnOpenCore&&primaryVelocity.zeroOnOpenCore&&nextState.zeroOnOpenCore&&r.summation?.includeFiniteInitialization,
    {baseCase:'The primary state and its temporal/five-moment initialization have the same open-core zero.',
      induction:'The four original ordered operations and every pressure reconstruction preserve the hypothesis at stage j+1.',
      allNonnegativeStagesByInduction:true,nonzeroFiniteStageValuesConstructed:false});

  const a=[0,1,2].map(i=>atom('A'+i)),chi=atom('chi'),curlIdentity=[];
  for(let i=0;i<3;i++){
    const j=(i+1)%3,k=(i+2)%3,direct=add(derivative(mul(chi,a[k]),j),scale(derivative(mul(chi,a[j]),k),-1)),
      row=r.summation.curlProducts?.find(row=>row.component===i);
    if(!row||!Array.isArray(row.terms))fail('The full source potential product rule is missing a Cartesian component.');
    const expanded=add(...row.terms.map(term=>{
      if(![1,-1].includes(term.sign)||!Number.isSafeInteger(term.potential)||term.potential<0||term.potential>2||
        ![null,0,1,2].includes(term.potentialDerivative)||![null,0,1,2].includes(term.cutoffDerivative))fail('Invalid Cartesian product-rule term.');
      return scale(mul(term.cutoffDerivative===null?chi:derivative(chi,term.cutoffDerivative),
        term.potentialDerivative===null?a[term.potential]:derivative(a[term.potential],term.potentialDerivative)),term.sign);
    }));curlIdentity.push({component:i,direct:pack(direct),expanded:pack(expanded),pass:equal(direct,expanded)});
  }
  record('all-potential-cutoff-curl-products-retained',curlIdentity.every(x=>x.pass)&&r.summation.sameOpenZeroCollarForEveryStage&&
    r.summation.applyCutoffOnPotentialsBeforeCurl&&r.summation.cutoffDependsOnlyOnQ&&!r.summation.scalarCutoffValuesOrStageConstantsUsed,
    {cartesianProductRules:curlIdentity,consequence:'Each A_j and every derivative is zero on the same open set; both chi*curl(A_j) and grad(chi) cross A_j vanish.',
      infiniteSum:'Every finite partial sum restricts identically to zero on this common open set. Any original realized sum has exactly that restriction.',
      numericalSummationThresholdUsed:false,uniformConvergenceOutsideCoreProved:false});
  return {schema:'MathScope.N7.CheckedCoreSupportInduction/1',pass:true,sourceAuthenticated:false,
    recipe:r,checks:proof,trace,allFiniteCorrectionStagesZeroOnOpenCore:true,fullCutoffCurlProductsVerified:true,
    backgroundFieldAssignedZero:false,fullRadialMomentsAssignedZero:false,globalNonzeroFieldConstructed:false,
    conclusion:'For the original supported finite construction and its realization, every correction potential, direct mean and pressure is zero on X<Xa. The final local field equals its original realized background on this region.'};
}

function sourceParameterSupport(p){
  const expected={Md:{integer:1048576},T:{sum:[{exp:{ref:'Md'}},{integer:10}]},h:{exp:{product:[{integer:-8002},{ref:'T'}]}},
    j0:{power:[{ref:'h'},4]},sigmaStar:{quotient:[{ref:'j0'},{integer:2000}]},Pstar:{exp:{ref:'logP'}},logP:{product:[{integer:2},{ref:'T'}]},
    K:{power:[{ref:'Pstar'},2]},Q:{quotient:[{product:[{integer:'1852673427797059126777135760139006525652319754650249024631321344126610074238976'},{ref:'K'}]},{power:[{ref:'sigmaStar'},2]}]},
    Lambda:{power:[{ref:'Q'},64]},Xa:{quotient:[{integer:4},{ref:'Lambda'}]},BRefUpper:{power:[{ref:'Q'},300]},
    CSelected:{exp:{ref:'logCSelected'}},logCSelected:{sum:[{product:[{integer:10},{log:{sum:[{integer:1},{ref:'BRefUpper'}]}}]},{power:[{ref:'Q'},200]}]},
    XR:{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]},BOuter:{product:[{integer:1000},{ref:'T'}]},
    X0Imean:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{integer:-8}]}}]}};
  const checks=Object.entries(expected).map(([name,definition])=>({name,pass:same(p[name],definition)}));
  if(checks.some(x=>!x.pass))fail('An original support-defining parameter was replaced: '+checks.filter(x=>!x.pass).map(x=>x.name).join(', '));
  const integerChecks=[{id:'positive-Md',pass:BigInt(p.Md.integer)>0n},
    {id:'positive-T-lower-eleven',pass:1n+BigInt(p.T.sum[1].integer)===11n},
    {id:'negative-h-exponent',pass:BigInt(p.h.exp.product[0].integer)<0n},
    {id:'sigma-upper-less-than-one',pass:BigInt(p.sigmaStar.quotient[1].integer)>1n},
    {id:'source-Q-numerator-exceeds-two-power-240',pass:BigInt(p.Q.quotient[0].product[0].integer)>(1n<<240n)},
    {id:'positive-integer-Lambda-power',pass:BigInt(p.Lambda.power[1])>=1n},
    {id:'positive-C-logarithm-terms',pass:BigInt(p.BRefUpper.power[1])>0n&&BigInt(p.logCSelected.sum[0].product[0].integer)>0n&&BigInt(p.logCSelected.sum[1].power[1])>0n},
    {id:'source-XR-factor-exceeds-one',pass:BigInt(p.XR.product[0].integer)>1n&&BigInt(p.XR.product[1].power[1])>0n},
    {id:'source-mean-support-exponent-positive',pass:(1n+60n*BigInt(p.BOuter.product[0].integer))*11n+2n-8n>0n}];
  if(integerChecks.some(x=>!x.pass))fail('A source parameter-order inference failed.');
  return {checks,integerChecks,allOriginalDefinitionsMatch:true,inequalityRules:['exp maps every real argument to a positive number and is strictly increasing.',
    'log is strictly increasing on positive arguments; log(1)=0.',
    'Products, positive integer powers and quotients by positive numbers preserve the displayed order.'],inequalityChain:[
    'Md>0 gives T=exp(Md)+10>11; 0<h=exp(-8002T)<1, hence 0<sigmaStar=h^4/2000<1.',
    'Pstar=exp(2T)>1 and K=Pstar^2>1 imply Q>2^240>4. Thus Lambda=Q^64>4 and 0<Xa=4/Lambda<1.',
    'logCSelected>0 gives CSelected>1. XR=110*(CSelected*Pstar)^10>110.',
    'X0Imean=XR*exp(60001T-6)>XR>Xa. Every mean profile has X>=X0Imean*exp(1)>Xa.',
    'The source mean-map record verifies the full profile/potential hull has log(X/X0Imean)<2<5 inside the original reserved Imean.'
  ],lowerMeanSupport:'X0Imean*exp(1)>Xa',tinyPositiveHNotRounded:true,sourceParametersNumericallyEvaluated:false};
}

function originalScalarRoots(c){
  const p=c.formulaProgram,map=new Map(p.sourceNodeIds.map((id,i)=>[id,i])),root=id=>{
    const i=map.get(id);if(i===undefined)fail('An actual scalar source root is missing from the complete observed program.');return i;
  };
  return {program:p,root,map};
}

// Exact rational-function identity on a scalar source DAG. Non-rational
// subexpressions remain independent atoms; no huge exp/log/integral is
// approximated or silently assigned a value.
function scalarRationalIdentity(program,left,right){
  const memo=new Map(),one=new Map([['[]',1n]]),
    rfAdd=(a,b)=>({n:add(mul(a.n,b.d),mul(b.n,a.d)),d:mul(a.d,b.d)}),
    rfMul=(a,b)=>({n:mul(a.n,b.n),d:mul(a.d,b.d)}),
    parse=id=>{if(memo.has(id))return memo.get(id);const node=program.nodes[id];if(!node)fail('Unknown source scalar node.');let out;
      if(node.op==='rational'){const [n,d]=fraction(node.args.length===1?node.args[0]:String(node.args[0])+'/'+String(node.args[1]));out={n:scale(one,n),d:scale(one,d)};}
      else if(node.op==='add')out=node.args.map(parse).reduce(rfAdd,{n:new Map(),d:one});
      else if(node.op==='multiply')out=node.args.map(parse).reduce(rfMul,{n:one,d:one});
      else if(node.op==='inverse'){const a=parse(node.args[0]);out={n:a.d,d:a.n};}
      else if(node.op==='integer_power'&&Math.abs(node.args[1])<=512){const a=parse(node.args[0]);out={n:one,d:one};for(let k=0;k<Math.abs(node.args[1]);k++)out=rfMul(out,node.args[1]>=0?a:{n:a.d,d:a.n});}
      else out={n:atom('node'+id),d:one};memo.set(id,out);return out;};
  const a=parse(left),b=parse(right);return {pass:equal(mul(a.n,b.d),mul(b.n,a.d)),method:'EXACT_INTEGER_POLYNOMIAL_AFTER_DENOMINATOR_CLEARING',
    nonrationalSourceAtomsEvaluated:false};
}

/** Execute the new proof against internally rehashed source records.
 * No caller-supplied archive, source parameter, stage flag or tau is accepted.
 */
export async function recordedSourceCoreRestriction(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)fail('This original source restriction has fixed inputs.','INVALID_INPUT');
  const [inner,domainArchive]=await Promise.all([recordedInnerGrowth(),recordedSourceN7DomainExterior()]);
  sourceExteriorForceObservations(domainArchive); // private unchanged archive seal
  const c=inner.certificate,d=domainArchive.domain,{program,root}=originalScalarRoots(c),
    parameterSupport=sourceParameterSupport(program.parametersExactExpressions),
    support=verifyOriginalCoreSupportInduction(originalCoreRestrictionRecipe()),
    phi=c.leading.freshCore.phi.rows[0].actualNonlinearInterval,
    sameBinding=same(c.sourceBinding,d.sourceBinding),domainQ=c.localization.qStar===d.constants.qBig,
    check=key=>c.checks.find(row=>row.id===key)?.pass===true,
    ratioChecks={};
  // Unfold ONLY the verified original Xa=4/Lambda definition in a temporary
  // proof copy. The source parameter remains unchanged in the real archive.
  const temp=copy(program),four=temp.nodes.length;temp.nodes.push({op:'rational',args:['4','1']});
  const inverseLambda=temp.nodes.length;temp.nodes.push({op:'inverse',args:[temp.roots.Lambda]});
  if(temp.nodes[root(c.point.Xa)].op!=='source_parameter'||temp.nodes[root(c.point.Xa)].args[0]!=='Xa')fail('The actual Xa parameter root changed.');
  temp.nodes[root(c.point.Xa)]={op:'multiply',args:[four,inverseLambda]};
  ratioChecks.sourceParameterUnfolding={name:'Xa',definition:copy(program.parametersExactExpressions.Xa),onlyTemporaryProofCopy:true};
  const half=temp.nodes.length;temp.nodes.push({op:'rational',args:['1','2']});
  const halfXa=temp.nodes.length;temp.nodes.push({op:'multiply',args:[root(c.point.Xa),half]});
  const halfEScale=temp.nodes.length;temp.nodes.push({op:'multiply',args:[root(c.leading.positivePrefactor),half]});
  ratioChecks.XinEqualsXaHalf=scalarRationalIdentity(temp,root(c.point.Xin),halfXa);
  ratioChecks.eLowerEqualsHalfEScale=scalarRationalIdentity(temp,root(c.leading.rigorousLower),halfEScale);
  const checks=[
    {id:'same-authenticated-original-source-and-final-domain',pass:sameBinding&&domainQ&&inner.archiveVerification.pass&&domainArchive.archiveVerification.pass&&
      inner.checks.every(row=>row.pass)&&d.checks.every(row=>row.pass)&&d.domainProof.sourceTheoremAppliedToExecutedInitialPremises},
    {id:'fixed-source-parameter-support-definitions',pass:parameterSupport.allOriginalDefinitionsMatch},
    {id:'actual-core-point-and-positive-scale-identities',pass:ratioChecks.XinEqualsXaHalf.pass&&ratioChecks.eLowerEqualsHalfEScale.pass&&
      check('original-positive-parameters-and-Xa')&&check('Xin-Xa-half-inside-both-original-domains')&&check('full-leading-source-has-the-actual-core-branch')},
    {id:'fresh-recorded-actual-positive-core-and-source-all-order-tail',pass:cmp(phi.lower,'1/2')>0&&cmp(phi.lower,phi.upper)<0&&
      check('fresh-actual-nonlinear-core-interval-positive')&&check('actual-n1-and-n2-plus-n3-tail-retained')&&check('actual-all-order-source-induction-and-common-enlargement')&&
      c.remainder.allCutoffTermsAndUnboundedTailRetained&&c.remainder.positiveExponentRetained},
    {id:'every-original-operator-preserves-the-same-open-core',pass:support.pass&&support.allFiniteCorrectionStagesZeroOnOpenCore&&support.fullCutoffCurlProductsVerified&&
      !support.backgroundFieldAssignedZero&&!support.fullRadialMomentsAssignedZero},
    {id:'same-original-five-profile-support-and-potential-hull',pass:d.fixedMeanMap.source.actualImportedSourceExecuted&&d.fixedMeanMap.pass&&
      d.fixedMeanMap.profiles.potentialHullIncluded&&d.fixedMeanMap.profiles.smoothZeroExtension&&d.fixedMeanMap.profiles.dExact==='1/5'},
    {id:'original-localization-plateau-has-no-extra-velocity-term',pass:d.cutoffConclusions.unitPlateau.spatialNeighborhoodFixed&&
      c.rows.every(row=>row.exactPlateau.product==='1')&&c.localization.forceOrGlobalFieldEvaluated===false},
    {id:'one-uniform-positive-threshold-proves-growth-beyond-all-samples',pass:c.rows[0].depth===0&&
      c.rows[0].remainderAbsUpper==='1/4'&&cmp(c.rows[0].interval.lower,'1/4')>0&&
      c.leading.formula.includes('> 1/(CSelected*sqrt(Lambda)) >0')&&c.scope.finitePlotUsedAsBlowupProof===false}
  ];
  if(checks.some(row=>!row.pass))fail('The source-bound core restriction is missing a premise: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const sourceReferences=[{pages:[69,70,71],references:['Definitions6.4/6.5','Proposition6.6'],role:'Fixed source wave/mean support and local differential/product algebra'},
    {pages:[76,77,78],references:['Proposition7.2'],role:'Zero-data pulse propagation fixes slow/transverse coordinates'},
    {pages:[84,85,104,105],references:['Proposition7.6','Proposition9.3'],role:'Fixed positive primary division inside the shell followed by zero extension'},
    {pages:[89,90,91,92,93],references:['(8.3)–(8.14)'],role:'Supported radial inverse, pressure and meridional potential; base flat residual stays separate'},
    {pages:[95,96,97,98],references:['Lemma8.6','Lemma8.7'],role:'Y-only temporal inverse and original five supported moment profiles'},
    {pages:[103,104,105,106,107,108,111,112,113,114,115,116],references:['Proposition9.3','Definition9.4','Propositions9.5/9.6/9.9','(9.21)'],role:'Finite initialization, support induction, and restriction of the realized sum'},
    {pages:[117,118,124],references:['Proposition10.1','(10.20)–(10.21)'],role:'Full cutoff product rule and the original inner ray'}];
  const result={schema:'MathScope.N7.RecordedSourceCoreRestriction/1',status:'SOURCE_OPERATOR_CORE_RESTRICTION_PROOF_EXECUTED',
    recordedOnly:true,freshSourceConstructorExecuted:false,newSupportProofExecuted:true,newLeanExecuted:false,
    sourceBinding:copy(c.sourceBinding),sourceReferences,sourceArtifacts:{inner:copy(inner.artifact),innerReceipt:copy(inner.receipt),
      domain:copy(domainArchive.domainArtifact),domainReceipt:copy(domainArchive.receipt),fullDomainScalarArtifact:copy(domainArchive.exteriorArtifact)},
    sourceArchiveHashes:{inner:inner.archiveSHA256,domain:domainArchive.archiveSHA256},
    sourceDomain:{qStar:d.constants.qBig,commonQStar:d.constants.commonQStar,domainChoiceJustified:true,initialPremiseCount:d.initialPrerequisites.length},
    sourcePoint:copy(c.point),
    parameterSupport,exactScalarIdentities:ratioChecks,supportInduction:support,
    coreIdentity:{normalizedOpenCore:'0<X<Xa',witnessCollar:'Xa/4<X<3Xa/4',Xin:'Xa/2=2/Lambda',
      samePhysicalRay:'x_tau=(sqrt(2*Xin*tau),0,0), eta=0, q=tau',
      annularPotentialRestriction:['0','0','0'],annularDirectMeanRestriction:['0','0','0'],annularPressureRestriction:'0',
      allSpatialAndTimeDerivativesOfAnnularTermsZero:true,
      localField:'u_loc equals the original realized M2 background on the open core',
      localizedField:'On the executed unit cutoff plateau, u=curl(cA)+cB equals that same background, including every velocity component.',
      sourceFiniteConstructionAndRealizationTheoremsApplied:true,supportOnlyProof:true,
      nonzeroCorrectionDefinitionsOrValuesConstructed:false,globalConvergenceCertifiedHere:false},
    analyticGrowth:{quantity:'u_theta(x_tau,1-tau)',e0:c.leading.formula,e0PositiveLower:{sourceRoot:c.leading.rigorousLower,formulaRoot:root(c.leading.rigorousLower)},
      leadingInterval:copy(phi),remainder:{formula:'|tau^A*u_theta-e0|<=C*tau^(2h)',coefficientSourceRoot:c.remainder.coefficient,
        coefficientFormulaRoot:root(c.remainder.coefficient),finiteOrders:[1,2],unboundedTailStarts:3,unboundedTailCoefficient:'1/4',
        sameOriginalCommonCutoffSequence:true},
      uniformThreshold:{sourceRoot:c.rows[0].tau,formulaRoot:root(c.rows[0].tau),strictlyPositive:true,
        formula:'tau_* = plateau*exp(-log(1+4*C/eScale)/(2h))',
        on:'every 0<tau<=tau_*',proof:'Since h>0, C*tau^(2h)<=C*tau_*^(2h)<eScale/4=eLower/2. The original path stays in the unit plateau for every such tau.'},
      uniformLower:'u_theta(x_tau,1-tau) >= (eLower/2)*tau^(-A), A=1/2+h>0',
      divergenceAsTauDecreasesToZero:true,finitePlotUsedAsProof:false,
      completeFormulaProgram:{path:inner.artifact.path,sha256:inner.artifact.sha256,scalarProgramSHA256:c.graph.scalarProgramSHA256}},
    checks,scope:{actualInnerRestrictionIdentified:true,sourceOperatorSupportInductionExecuted:true,allThreeVelocityComponentsRestrictionIdentified:true,
      originalFiniteConstructionTheoremApplied:true,recordedSourceMeasurementsReused:true,freshSourceConstructorExecuted:false,
      fullFinalN6FieldConstructed:false,nonzeroCorrectionFieldsConstructed:false,allSpaceVelocityEvaluator:false,
      wholeLocalizedForceConstructed:false,wholeKEnergyNearTerminalComputed:false,globalForceExtensionConstructed:false,
      newLeanKernelProof:false,criterionAssessmentEdited:false,wholeM3Complete:false}};
  const encoded=canonical(result),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(encoded));
  result.proofSHA256=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');seals.set(result,canonical(result));return result;
}

export function assertRecordedSourceCoreRestriction(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('Use the unchanged internally verified original core-restriction proof.');return true;
}

export function sourceCoreRestrictionObservations(result){
  assertRecordedSourceCoreRestriction(result);return {kind:'SOURCE_CORE_RESTRICTION_AND_ANALYTIC_GROWTH',samples:[],curves:[],
    proofSHA256:result.proofSHA256,sourceArtifacts:copy(result.sourceArtifacts),coreIdentity:copy(result.coreIdentity),
    analyticGrowth:copy(result.analyticGrowth),proofChecks:copy(result.checks),supportChecks:copy(result.supportInduction.checks),
    recordedOnly:true,newSupportProofExecuted:true,freshSourceConstructorExecuted:false,fullFinalN6FieldConstructed:false,
    allSpaceVelocityEvaluator:false,wholeM3Complete:false};
}
