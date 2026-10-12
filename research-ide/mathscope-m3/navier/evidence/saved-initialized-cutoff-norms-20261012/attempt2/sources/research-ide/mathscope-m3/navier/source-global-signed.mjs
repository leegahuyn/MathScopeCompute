/** The original fixed-H, fixed-a signed covariance update on the complete
 * source cover. Current Sigma is constructed by source-global-current; a
 * receipt, an arbitrary target or a newly selected positive amplitude is
 * never accepted here.
 *
 * This module builds exact functions and the three actual averaged terms
 * in (7.41). Uniform weighted class estimates are a SEPARATE obligation.
 */
import {assertGlobalCurrentState,globalCurrentStateCertificate,globalGraphEqual,guardGlobalLocalBody,
  registerGlobalMeanFields,buildGlobalMeanState} from './source-global-current.mjs';
import {materializeGlobalSourceClosure} from './source-global-expressions.mjs';
import {exactSignedCovarianceInverse} from '../../mathscope-m2/navier/actual-physical-residual-algebra.mjs';
import {exactCylindricalHarmonicCurl} from '../../mathscope-m2/navier/actual-full-curl.mjs';
import {assertSourceSquaredProductPartition,covariancePhysicalExponentAudit} from '../../mathscope-m2/navier/actual-covariance-global-assembly.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {rational as Q,readRational,qadd,qmul,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  names=['rr','rtheta','rz','thetatheta','thetaz','zz'],pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]],
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))],
  dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j]))),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};
const scalar=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const vector=(G,x)=>Array.isArray(x)&&x.length===3&&x.every(v=>scalar(G,v));
const harmonic=(G,x)=>x&&Object.keys(x).length===2&&vector(G,x.real)&&vector(G,x.imaginary);
const hadd=(G,...xs)=>Object.fromEntries(['real','imaginary'].map(k=>[k,[0,1,2].map(j=>G.add(...xs.map(x=>x[k][j])))]));
const hsub=(G,x,y)=>Object.fromEntries(['real','imaginary'].map(k=>[k,x[k].map((v,j)=>G.sub(v,y[k][j]))]));
const hmean=(G,u,v,a,b)=>G.mul(G.q(1,2),G.add(G.mul(u.real[a],v.real[b]),G.mul(u.imaginary[a],v.imaginary[b])));
const hcov=(G,u)=>Object.fromEntries(pairs.map(([a,b],j)=>[names[j],hmean(G,u,u,a,b)]));
const hbilinear=(G,u,v)=>Object.fromEntries(pairs.map(([a,b],j)=>[names[j],G.add(hmean(G,u,v,a,b),hmean(G,v,u,a,b))]));

/** Generic exact algebra of one nonzero real harmonic A*cos(phi)-B*sin(phi).
 * The source wrapper proves the original nonzero integer angular carrier
 * and common Haar support. Generic algebra alone authenticates no field.
 */
export function exactHarmonicCovarianceIncrement(G,input={}){
  const keys=['primary','previous','linearIncrement','curlRemainder'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k))||keys.some(k=>!harmonic(G,input[k])))
    fail('Retain all four complete real/imaginary harmonic coefficient vectors.');
  const {primary:W,previous:E,linearIncrement:L,curlRemainder:R}=input,U=hadd(G,W,E),V=hadd(G,L,R),
    before=hcov(G,U),after=hcov(G,hadd(G,U,V)),primary=hbilinear(G,W,L),earlier=hbilinear(G,E,L),
    curl=hbilinear(G,U,R),square=hcov(G,V),atoms=keys.flatMap(k=>[...input[k].real,...input[k].imaginary]),
    checks=names.map(name=>({component:name,...sourceGraphRationalIdentity(G,
      G.sub(G.sub(after[name],before[name]),G.add(primary[name],earlier[name],curl[name],square[name])),{atomicNodes:atoms,maxTerms:120000})})),
    omissions=Object.fromEntries([['earlier',earlier],['curl',curl],['square',square]].map(([kind,term])=>[kind,names.map(name=>({component:name,
      ...sourceGraphRationalIdentity(G,G.sub(G.sub(after[name],before[name]),G.sub(G.add(primary[name],earlier[name],curl[name],square[name]),term[name])),{atomicNodes:atoms,maxTerms:120000})}))]));
  if(checks.some(x=>!x.pass))fail('An ordered product was lost from the exact real-harmonic covariance increment.');
  return {schema:'MathScope.N6.ExactHarmonicCovarianceIncrement/1',U,V,before,after,primary,earlier,curl,square,checks,omissions,
    convention:'u=A*cos(phi)-B*sin(phi); angularMean(u_i*v_j)=(A_i*C_j+B_i*D_j)/2.',
    identity:'C(U+V)-C(U)=B(W,L)+B(E,L)+B(U,R)+C(V), U=W+E,V=L+R.',
    allSixComponents:true,allThreeRemaindersRetained:true,sameLabelSquareRetained:true,
    anActuallyZeroTermMayHaveAPassingOmissionCheck:true,sourceAuthenticated:false,pass:true};
}

/** Exact affine exponents of the change Qref/Qlocal=r>0. This is a proof
 * kernel, not an assertion that arbitrary supplied fields obey these laws.
 * The source wrapper below binds every law to its actual current formula.
 */
export function originalCurrentChartExponentAudit(){
  const c=(a,b=0)=>[readRational(a),readRational(b)],add=(...xs)=>[0,1].map(j=>xs.reduce((s,x)=>qadd(s,x[j]),Q(0))),
    scale=(x,n)=>x.map(v=>qmul(v,Q(n))),eq=(x,y)=>x.every((v,j)=>qtext(v)===qtext(y[j])),
    half=c('1/2'),one=c(1),h=c(0,1),D=c('1/2',-1),A=c('1/2',1),W=scale(A,2),
    radial=c('1/2'),axial=D,epsilon=h,integral=c('-1/2'),gr=add(W,radial),P=add(gr,integral),pressure=P,
    rho=half,cRho=c(-1),E=gr,Jtheta=add(W,c('-3/2')),Jz=add(W,c(-1)),
    momentTheta=add(epsilon,axial,Jtheta),momentZ=add(epsilon,axial,Jz),sigmaTheta=c('3/2'),sigmaZ=one,
    Sigma=add(E,integral),checks=[
      ['physical epsilon times axial derivative',add(epsilon,axial),half],
      ['pressure matches mean covariance',pressure,W],['c_rho P and Jz use the same exponent',add(cRho,P),Jz],
      ['theta weighted compatibility subtraction',add(sigmaTheta,momentTheta),E],
      ['z weighted compatibility subtraction',add(sigmaZ,momentZ),E],['radial inverse restores stress tensor scale',Sigma,W]
    ].map(([name,left,right])=>({name,left:left.map(qtext),right:right.map(qtext),pass:eq(left,right)}));
  return {schema:'MathScope.N6.ExactCurrentChartExponents/1',arithmetic:'BIGINT_RATIONAL_AFFINE_POLYNOMIALS_IN_EXACT_H',
    convention:'f_ref=r^exponent*f_local at Rlocal=r^(1/2)Rref,Zlocal=r^D Zref,Tlocal=r*Tref; r=Qref/Qlocal.',
    exponents:Object.fromEntries(Object.entries({R:radial,Z:axial,epsilon,W,gr,P,pressure,rho,cRho,E,Jtheta,Jz,momentTheta,momentZ,sigmaTheta,sigmaZ,Sigma}).map(([k,v])=>[k,v.map(qtext)])),
    checks,pass:checks.every(x=>x.pass),genericExponentArithmeticOnly:true};
}

function sourceTangency(G,f,k,amplitude,rawPotential,potential){
  const n=f.frame.n,nt=f.frame.nt,ntSquared=G.pow(nt,2),tangentSquared=G.add(G.pow(n[1],2),G.pow(n[2],2)),
    frameAtoms=[...n,nt,f.frame.J[1][0]],frame=[0,1].map(j=>globalGraphEqual(G,
      G.mul(ntSquared,dot(G,n,f.frame.B.map(row=>row[j]))),G.mul(n[0],G.sub(ntSquared,tangentSquared)),frameAtoms)),
    normalAmplitude=dot(G,n,amplitude),rawLeading=cross(G,n,rawPotential).map(x=>G.neg(G.mul(k,x))),
    triple=rawLeading.map((x,j)=>globalGraphEqual(G,x,G.sub(amplitude[j],G.div(G.mul(n[j],normalAmplitude),f.frame.nSquared)),[...n,...amplitude,k])),
    shared=potential.map((x,j)=>({root:x,body:G.materializeExpressionFunction(...G.nodes[x].args),expected:rawPotential[j]}));
  return {frame,triple,shared,pass:G.nodes[nt].op==='sqrt_positive'&&G.nodes[nt].args[0]===tangentSquared&&frame.every(x=>x.pass)&&triple.every(x=>x.pass)&&shared.every(x=>x.body===x.expected),
    proof:'The actual cleared n dot B identities and nt^2=n_theta^2+n_z^2 give tangency. The vector triple product gives the leading curl. The same fixed source frame is used for the signed amplitude.'};
}

function sourceHAndLeadingIdentity(state){
  const {G,band,local}=state,{epsilon,haarFactor,Ls}=band.geometry,{v}=band.coordinates,q=(n,d=1)=>G.q(n,d),
    squareEpsilon=G.sqrt(epsilon),sourceRows=band.families.map((f,j)=>{
      const a=band.target.squareRootWeights[j],y=band.target.weights[j],old=local.rows[j],
        integrals=[1,2].map(component=>G.mul(haarFactor,G.integral(G.mul(G.pow(band.cutoffs.psi,2),f.t[0],f.t[component]),v,G.zero,Ls))),
        primary=hcov(G,{real:old.weightedAmplitude,imaginary:[G.zero,G.zero,G.zero]}),
        factored=[1,2].map(component=>G.mul(q(1,2),G.pow(local.slowCutoff.body,2),G.pow(squareEpsilon,2),G.pow(a,2),
          G.pow(band.cutoffs.chi,2),G.pow(band.cutoffs.psi,2),f.t[0],f.t[component])),
        factorChecks=['rtheta','rz'].map((name,k)=>globalGraphEqual(G,primary[name],factored[k],
          [local.slowCutoff.body,squareEpsilon,a,band.cutoffs.chi,band.cutoffs.psi,...f.t]));
      return {sign:f.sign,a,y,originalHColumn:band.target.H.map(row=>row[j]),actualIntegralColumn:integrals,primary,
        angularFactorChecks:factorChecks,squareRootDefinition:{a,radicand:y,pass:G.nodes[a].op==='sqrt_positive'&&G.nodes[a].args[0]===y},
        pass:factorChecks.every(x=>x.pass)&&integrals.every((x,i)=>x===band.target.H[i][j])&&a===old.originalFixedPositiveA};
    }),localReduced=band.target.Hy.map(x=>G.mul(epsilon,G.pow(local.slowCutoff.body,2),x)),
    localTarget=band.target.components.map(x=>G.mul(epsilon,G.pow(local.slowCutoff.body,2),x)),
    inverseChecks=localReduced.map((x,j)=>globalGraphEqual(G,x,localTarget[j],[...band.target.H.flat(),...band.target.components,local.slowCutoff.body,epsilon])),
    partition=state.assembly.partition.partition,globalTarget=band.target.components.map(x=>G.mul(epsilon,x)),
    exponent=covariancePhysicalExponentAudit(),checks=[
      {id:'actual-original-H-integrals-and-positive-square-roots',pass:sourceRows.every(x=>x.pass&&x.squareRootDefinition.pass)},
      {id:'actual-positive-epsilon-square-root',pass:G.nodes[squareEpsilon].op==='sqrt_positive'&&G.nodes[squareEpsilon].args[0]===epsilon},
      {id:'actual-leading-positive-inverse-Hy',pass:band.target.inverseChecks.every(x=>x.pass)&&inverseChecks.every(x=>x.pass)},
      {id:'complete-source-quadratic-partition-and-physical-powers',pass:assertSourceSquaredProductPartition(G,partition)&&partition.rows.length===81&&exponent.pass&&state.assembly.sourceCrossTermsZero}
    ];
  if(checks.some(x=>!x.pass))fail('The actual leading source covariance has not been tied to the complete target and partition.');
  return {schema:'MathScope.N6.ActualGlobalLeadingCovarianceIdentity/1',sourceRows,localReduced,localTarget,inverseChecks,globalTarget,exponent,checks,
    identity:'C(W0_as)_ref=epsilon_ref*T0_star_ref on the whole original annulus; both sides extend by zero at/outside its flat edges.',
    proof:['The actual angular factors are checked before any auxiliary integral; sqrt(epsilon)^2=epsilon and a_j^2=y_j follow from their retained positive square-root definitions.',
      'All factors depending only on slow coordinates are outside the two auxiliary integrals. The remaining original cosine-half/Haar/chi/psi/t integrals are exactly the retained H columns.',
      'The unchanged actual inverse has H*y=T0_star. A complete local box therefore contributes eta_beta^2*epsilon_beta*T0_star_beta.',
      'The exact original physical exponent audit makes the target the same physical tensor in every band. Both signs occur inside one box, and original auxiliary support separation removes distinct-label cross terms.',
      'The actual 81-candidate expression is the complete locally finite all-label squared partition. Its exact sum is one, including all admissible shells and flat zero extensions.'],
    leadingQuadraticDefectZero:true,fullCurlCovarianceDeclaredEqualToTarget:false,allOrderClassBoundCertified:false,newLeanKernelProof:false};
}

/** Covariance of the ACTUAL current Sigma under reference-chart changes.
 * A physical field is independent of the temporary chart used to list its
 * complete support. Every operation below is tied to a constructed root.
 */
export function actualCurrentSigmaChartLaw(state){
  assertGlobalCurrentState(state);const {G,band}=state,exponents=originalCurrentChartExponentAudit(),
    {R,Z,T}=band.coordinates,mean=state.mean,g=mean.geometry,W=state.covariance.fullAuxiliaryMean,
    q=(n,d=1)=>G.q(n,d),epsilon=band.geometry.epsilon,
    actualRows=[{operation:'complete physical covariance',roots:Object.values(W),exponent:'W'},
      {operation:'radial divergence and epsilon*partial_Z',roots:[mean.gr,...state.target.E],exponent:'gr/E'},
      {operation:'whole compact radial integral',roots:[mean.P,mean.Jtheta,mean.Jz],exponent:'P/Jtheta/Jz'},
      {operation:'same physical normalized mean bump',roots:[g.unnormalized,g.rho,g.cRho],exponent:'rho/cRho'},
      {operation:'zero-moment compact pressure primitive',roots:[mean.pressure.value],exponent:'pressure'},
      {operation:'weighted compact radial inverse',roots:state.target.Sigma,exponent:'Sigma'}],
    cRhoProduct=G.mul(epsilon,G.derivative(G.add(mean.Jz,G.mul(g.cRho,mean.P)),Z)),
    checks=[{id:'exact-chart-exponent-arithmetic',pass:exponents.pass},
      {id:'current-covariance-is-an-entire-reference-scaled-indexed-field',pass:Object.values(state.covariance.indexedSystems).every(id=>{
        const f=G.globalIndexedSystem(id);return f.rows.length===81&&f.sourceRecipe.physicalMeanScale==='(Q_ref/Q_label)^(2A)'&&f.rows.every(r=>r.label.countInGlobalSum===1);})},
      {id:'entire-supported-radial-fields-not-point-inventories',pass:state.scope.completeIndexedFieldInsideRadialPrimitives&&state.target.compatibility.sourceSupport.allCrossedRadialLabelsRetained&&
        [g.innerRadius,g.outerRadius].every(x=>[R,Z,T].every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'same-physical-rho-and-entire-c_rho-product',pass:g.X0===G.parameter('X0Imean')&&state.target.sigma[0]===G.div(g.rho,G.pow(R,2))&&state.target.sigma[1]===G.div(g.rho,R)&&state.target.moments[1]===cRhoProduct},
      {id:'actual-compact-FTC-and-zero-moment-identities',pass:mean.checks.every(x=>x.pass)&&state.target.checks.every(x=>x.pass)},
      {id:'prefix-and-original-palette-common-at-physical-q',pass:state.domain.prefixSharedByAllCoverLabels&&state.domain.prefixSharedByWholeRadialIntegral&&state.assembly.sourceCrossTermsZero}
    ];
  if(checks.some(x=>!x.pass))fail('A current source operation does not support the normalized stress chart law.');
  return {schema:'MathScope.N6.ActualCurrentSigmaChartLaw/1',exponents,actualRows,checks,
    target:state.target.Sigma,law:'Sigma_ref=(Q_ref/Q_label)^(2A)*Sigma_label at the same physical point.',
    proof:['For every label, compose R_label=r^(1/2)R_ref, Z_label=r^D Z_ref and T_label=r*T_ref. The original chart equation has s_label=r*s_ref, so X,eta,q and the physical band coordinate -log2(q) are unchanged.',
      'The complete nearest-integer lists only relabel the same physical label set. Their Q_label, mesh coordinates and fixed representatives are unchanged. Source functions differentiated at fixed physical labels consequently compose exactly; no floor derivative is taken.',
      'Every local mean carries Q_label^(-2A), so the complete covariance satisfies the stated tensor law. Dr contributes r^(1/2), and epsilon*partial_Z contributes r^(h+D)=r^(1/2).',
      'All radial integrals are of the entire smooth field. Under R_label=r^(1/2)R_ref, dR_ref=r^(-1/2)dR_label. The two fixed envelopes may differ after the change, but both contain the full original shell and mean bump; their exterior integrands are identically zero.',
      'The mean bump is a fixed physical bump normalized by its complete positive mass, hence rho_ref=r^(1/2)rho_label and c_rho,ref=r^(-1)c_rho,label. The full product c_rho*P transforms together with Jz.',
      'The checked weighted residual/zero-moment identities and compact radial inverse give exactly exponent2A for both actual Sigma components. The same flat extension applies before every singular inverse outside the shell.'],
    sourceAuthenticated:true,arbitrarySuppliedSigmaAccepted:false,allFinitePrefixAtlasCompatible:true,uniformWeightedClassIsSeparate:true,newLeanKernelProof:false};
}

function signedData(s){return {schema:s.schema,source:s.source,domain:s.domain,inverse:s.inverse,leading:s.leading,chartLaw:s.chartLaw,
  rows:s.rows,assembly:s.assembly,updated:s.updated,checks:s.checks,scope:s.scope};}

export function attachGlobalSignedCurrent(state,context={}){
  assertGlobalCurrentState(state);const {G,band,representative,geometry}=state,
    prefixCount=G.nodes.length,prefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    {R,Z,T,ell,Xrep,etaRep,sRep,theta,v}=band.coordinates,xi=band.cutoffs.xi,
    {epsilon,k,Dgeom,ci,Ls}=band.geometry,{parameters,localParameters,slowCutoff}=state.local,q=(n,d=1)=>G.q(n,d),
    inverse=exactSignedCovarianceInverse(G,{H:band.target.H,amplitudes:band.target.squareRootWeights,epsilon,target:state.target.Sigma}),
    leading=sourceHAndLeadingIdentity(state),chartLaw=actualCurrentSigmaChartLaw(state),
    atRepresentative=body=>G.simultaneousSubstitute(body,[Xrep,etaRep,sRep],[representative.roots.X,representative.roots.eta,representative.roots.s]),
    integrate=body=>G.mul(Dgeom,ci,G.integral(G.integral(body,xi,G.neg(geometry.r0),geometry.r0),v,G.zero,Ls)),
    keys=['before','after','primary','earlier','curl','square'],values=Object.fromEntries(keys.map(key=>[key,Object.fromEntries(names.map(name=>[name,[]]))])),rows=[];
  for(const [index,f]of band.families.entries()){
    const old=state.local.rows[index],deltaA=inverse.deltaAmplitude[index],
      amplitude=f.t.map(x=>G.mul(G.sqrt(epsilon),deltaA,band.cutoffs.chi,band.cutoffs.psi,x)),
      weighted=amplitude.map(x=>G.mul(slowCutoff.body,x)),rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared))),
      potential=rawPotential.map((x,j)=>G.share(x,parameters,'GlobalSignedPotential_'+f.sign+'_'+j)),
      curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon,radialFast:geometry.radialFast,k,normal:f.frame.n,potential}),
      tangency=sourceTangency(G,f,k,weighted,rawPotential,potential),
      W0={real:old.weightedAmplitude,imaginary:[G.zero,G.zero,G.zero]},
      U={real:old.curl.leading,imaginary:old.curl.remainder},
      L={real:weighted,imaginary:[G.zero,G.zero,G.zero]},V={real:curl.leading,imaginary:curl.remainder},
      E=hsub(G,U,W0),rem=hsub(G,V,L),expansion=exactHarmonicCovarianceIncrement(G,{primary:W0,previous:E,linearIncrement:L,curlRemainder:rem}),
      oldCovariance=hcov(G,U),beforeChecks=names.map(name=>globalGraphEqual(G,expansion.before[name],oldCovariance[name],
        [...old.curl.leading,...old.curl.remainder,...old.weightedAmplitude])),
      angularInverseFactors=[1,2].map(component=>G.mul(G.pow(slowCutoff.body,2),G.pow(G.sqrt(epsilon),2),inverse.a[index],deltaA,
        G.pow(band.cutoffs.chi,2),G.pow(band.cutoffs.psi,2),f.t[0],f.t[component])),
      angularInverseChecks=['rtheta','rz'].map((name,j)=>globalGraphEqual(G,expansion.primary[name],angularInverseFactors[j],
        [slowCutoff.body,G.sqrt(epsilon),inverse.a[index],deltaA,band.cutoffs.chi,band.cutoffs.psi,...f.t])),
      localMeans={},guards={};
    for(const key of keys){
      localMeans[key]={};guards[key]={};
      for(const name of names){
        const aux=guardGlobalLocalBody(G,geometry,slowCutoff,expansion[key][name]),
          whole=guardGlobalLocalBody(G,geometry,slowCutoff,integrate(aux.body),{auxiliary:false}),
          mean=G.share(atRepresentative(whole.body),localParameters,'GlobalSignedMean_'+key+'_'+f.sign+'_'+name);
        localMeans[key][name]=mean;guards[key][name]={auxiliary:aux,whole};values[key][name].push(mean);
      }
    }
    const checks=[{id:'original-fixed-signed-amplitude-'+f.sign,pass:inverse.a[index]===old.originalFixedPositiveA&&inverse.H.every((row,i)=>row[index]===band.target.H[i][index])},
      {id:'actual-signed-leading-tangency-and-full-curl-'+f.sign,pass:tangency.pass&&curl.divergence.checks.every(x=>x.pass)},
      {id:'all-three-actual-angular-covariance-remainders-'+f.sign,pass:expansion.checks.every(x=>x.pass)&&expansion.allThreeRemaindersRetained},
      {id:'same-actual-current-covariance-before-update-'+f.sign,pass:beforeChecks.every(x=>x.pass)},
      {id:'actual-signed-principal-angular-H-factors-'+f.sign,pass:angularInverseChecks.every(x=>x.pass)},
      {id:'all-averaged-signed-bodies-guard-before-inverse-'+f.sign,pass:keys.every(key=>names.every(name=>guards[key][name].auxiliary.zeroBeforeSingularBodyEvaluation&&guards[key][name].whole.zeroBeforeSingularBodyEvaluation))},
      {id:'same-original-nonzero-angular-carrier-'+f.sign,pass:f.carrier.nonzeroAngularInteger&&potential.every(x=>!G.freeCoordinates(x).has(theta))}];
    if(checks.some(x=>!x.pass))fail('An actual signed local source identity failed.');
    rows.push({sign:f.sign,originalCovariance:f.system,fixedOriginalH:band.target.H,fixedOriginalA:inverse.a[index],deltaA,
      amplitude,weightedAmplitude:weighted,rawPotential,potential,curl,tangency,originalPrimary:W0,oldFull:U,previous:E,
      linear:L,increment:V,curlRemainder:rem,expansion,beforeChecks,angularInverseFactors,angularInverseChecks,localMeans,guards,checks,
      noFreshSquareRootOfSignedTarget:true,representativeSubstitutedAfterSourceDifferentiation:true});
    progress(context,'global-signed-actual-full-curl-and-three-remainders-'+f.sign,G);
  }
  const localSystems={},registered={};
  for(const key of keys){
    localSystems[key]=Object.fromEntries(names.map(name=>[name,G.defineExpressionFunction({name:'GlobalSignedBothSigns_'+key+'_'+name,parameters:localParameters,body:G.add(...values[key][name])})]));
    registered[key]=registerGlobalMeanFields(G,band,state.assembly.partition,localSystems[key],{prefix:'GlobalSignedAllLabels_'+key});
  }
  const localPrimary=inverse.cross.map(x=>G.mul(G.pow(slowCutoff.body,2),x)),localTarget=state.target.Sigma.map(x=>G.mul(G.pow(slowCutoff.body,2),x)),
    localInverseChecks=localPrimary.map((x,j)=>globalGraphEqual(G,x,localTarget[j],[...band.target.H.flat(),...state.target.Sigma,slowCutoff.body,epsilon])),
    partition=state.assembly.partition.partition,
    completePrimaryRows=partition.rows.map(row=>({key:row.key,squaredCutoff:row.squaredCutoff,countInGlobalSum:1,
      normalizedTargetContribution:state.target.Sigma.map(x=>G.mul(row.squaredCutoff,x))})),
    W=registered.after.roots,mean=buildGlobalMeanState(G,band,W,context,'GlobalSignedUpdated'),
    identity={equation:'C(U+V)-C(U)=Sigma+B(E,L Sigma)+B(U,Rcurl)+C(V)',
      before:registered.before.roots,after:W,primaryComputedByFullHaarAndCover:registered.primary.roots,
      earlierInteraction:registered.earlier.roots,curlInteraction:registered.curl.roots,newIncrementSquare:registered.square.roots,
      globalPrimaryReduced:state.target.Sigma,localPrimary,localTarget,localInverseChecks,completePrimaryRows,
      globalProof:['Both actual full curls are retained. The exact real-harmonic polynomial identity is checked for all six covariance components before either auxiliary integral.',
        'The same angular-half and original H integrals as the leading-wave proof give epsilon*H*(2*a*delta_a)=Sigma with unchanged H,a. The slow cutoff contributes eta_beta^2.',
        'The actual current Sigma chart law converts every local contribution to the same reference tensor. The complete squared partition gives sum_beta eta_beta^2*Sigma_ref=Sigma_ref.',
        'All integrals and the all81 indexed operation are linear. Original support separation removes distinct-label cross products; each same-label increment square remains in the third displayed remainder.'],
      exactGlobalBilinearIdentityOnDeclaredAtlas:true,fullCovarianceDifferenceEqualToSigmaAlone:false,newLeanKernelProof:false},
    checks=[...rows.flatMap(row=>row.checks),...leading.checks,...chartLaw.checks,...mean.checks,
      {id:'actual-source-fixed-inverse-and-local-partition-square',pass:inverse.checks.every(x=>x.pass)&&localInverseChecks.every(x=>x.pass)},
      {id:'complete-global-current-Sigma-not-selected-member-proxy',pass:completePrimaryRows.length===81&&new Set(completePrimaryRows.map(x=>x.key)).size===81&&assertSourceSquaredProductPartition(G,partition)&&chartLaw.sourceAuthenticated},
      {id:'every-remainder-has-complete-cover-and-original-guards',pass:keys.every(key=>names.every(name=>registered[key].recipes[name].length===81&&registered[key].recipes[name].every(row=>row.guards.length===5&&row.label.countInGlobalSum===1)))},
      {id:'unchanged-original-current-and-source-kernel-prefix',pass:canonicalStringify(G.nodes.slice(0,prefixCount))===prefix&&G.functionDefinitionsUnchanged(definitions)&&assertGlobalCurrentState(state)}];
  if(checks.some(x=>!x.pass))fail('A global signed source identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.GlobalActualSignedCurrent/1',G,state,
    source:{paperSHA256:state.source.paperSHA256,parameterExpressionSHA256:state.source.parameterExpressionSHA256,prefixNodeCount:prefixCount,
      actualCurrentSigma:state.target.Sigma,originalH:band.target.H,fixedOriginalA:band.target.squareRootWeights,sourceUniformDeterminantLower:band.quantitative.sourceDeterminantScaleLower,
      sourcePositiveWeightLower:band.quantitative.sourceWeightOverZetaLower,newTargetOrWeightsAccepted:false,oldM2SealForged:false,equations:['7.31','7.40','7.41','8.18']},
    domain:state.domain,inverse,leading,chartLaw,rows,assembly:{localSystems,registered,identity},updated:{fullAuxiliaryMean:W,mean},checks,
    scope:{actualSignedCurrentWaveConstructed:true,allOriginalLabelsIncluded:true,originalHandPositiveAFixed:true,actualGlobalBilinearIdentity:true,
      allThreeActualGlobalCovarianceRemaindersConstructed:true,fullUpdatedMeanPressureAndPJConstructed:true,
      allOrderSourceClassBoundsCertified:false,fullAuxiliaryPressureConstructed:false,initializedJ0:false,completeN6:false,originalN604Complete:false,
      allActualDerivativeBodiesMaterialized:false,numericalFieldValuesOrEnclosuresComputed:false,newLeanKernelProof:false}};
  seals.set(result,{G,state,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(signedData(result)),kernel:G.globalKernelDefinitions()});
  progress(context,'global-signed-current-complete-cover-sealed',G);return result;
}

export function assertGlobalSignedCurrent(result){
  const s=seals.get(result);
  if(!s||s.G!==result.G||s.state!==result.state||s.data!==canonicalStringify(signedData(result))||
    s.prefix!==canonicalStringify(result.G.nodes.slice(0,s.count))||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged privately constructed complete signed current source update.');
  assertGlobalCurrentState(result.state);return true;
}

export async function globalSignedCurrentCertificate(result){
  assertGlobalSignedCurrent(result);const s=seals.get(result),source=await globalCurrentStateCertificate(result.state),data=signedData(result),
    encoded=canonicalStringify({sourceGraph:source.graph,data,nodes:result.G.nodes.slice(result.source.prefixNodeCount,s.count),definitions:s.definitions,kernel:s.kernel});
  return {...data,sourceCurrent:source,graph:{sha256:await sha256(encoded),nodeCount:s.count,deltaNodeCount:s.count-result.source.prefixNodeCount,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_SOURCE_SIGNED_CURRENT_FUNCTION_CONSTRUCTION',numericalValuesOrEnclosures:false};
}

export async function auditGlobalSignedDerivatives(result,context={}){
  assertGlobalSignedCurrent(result);const {G}=result,mean=result.updated.mean,
    roots=[...Object.values(result.updated.fullAuxiliaryMean),mean.gr,mean.P,mean.Jtheta,mean.Jz,mean.pressure.value,
      ...['primary','earlier','curl','square'].flatMap(key=>Object.values(result.assembly.registered[key].roots)),
      ...result.rows.flatMap(row=>[...row.potential,...row.curl.radialDerivatives,...row.curl.axialDerivatives,row.curl.divergence.real,row.curl.divergence.imaginary])],
    closure=materializeGlobalSourceClosure(G,roots,context),source=await globalSignedCurrentCertificate(result),kernel=G.globalKernelDefinitions(),
    encoded=canonicalStringify({sourceGraph:source.graph,closure,nodes:G.nodes.slice(result.source.prefixNodeCount),definitions:G.captureFunctionDefinitions(),kernel}),
    checks=[{id:'every-requested-signed-mean-derivative-has-all81-candidates',pass:closure.indexedPartials.length>0&&closure.indexedPartials.every(x=>x.rows===81&&x.allDeclaredRowsRetained&&!x.labelsDifferentiated)},
      {id:'signed-derivatives-reach-both-original-variational-systems',pass:[0,1].every(id=>closure.pulseBlocks.some(x=>x.pulse===id))&&closure.pulseBlocks.every(x=>x.allCoefficientAndTimeDerivativeBodiesGenerated)},
      {id:'all-signed-source-function-bodies-materialized',pass:closure.allRequestedSharedBodiesMaterialized&&closure.allActualApplicationArgumentsRetained},
      {id:'actual-global-signed-state-still-authenticated',pass:assertGlobalSignedCurrent(result)}];
  if(checks.some(x=>!x.pass))fail('The complete actual signed derivative closure failed.');
  progress(context,'global-signed-actual-derivative-closure-complete',G,{functions:closure.partials.length});
  return {schema:'MathScope.N6.GlobalSignedDerivativeAudit/1',source,closure,kernel,checks,
    graph:{sha256:await sha256(encoded),nodeCount:G.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length},
    actualSourceBodiesExecuted:true,uniformAllOrderClassBoundCertified:false,originalN604Complete:false,numericalFieldEnclosureComputed:false};
}
