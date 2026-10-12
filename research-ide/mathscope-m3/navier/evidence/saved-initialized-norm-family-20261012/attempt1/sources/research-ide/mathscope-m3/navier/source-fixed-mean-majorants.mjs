/** Actual original five-profile map: all requested operator seminorms.
 *
 * A compact source chart (s,X,eta) is used throughout. No enclosing RZT box,
 * sampled current, rounded lambda, or caller-provided source norm is used.
 * The generated constants bound the fixed map. Seminorms of its actual P/J
 * inputs remain separate operands of the iteration class proof.
 */
import {ActualConvergentExpressions} from '../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {exactSlowChartOperators,exactSlowProfileExpansion} from '../../mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs';
import {rectangularSourceFTC} from '../../mathscope-m2/navier/actual-background-physical-seminorms.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {exactFiveMomentCoefficients} from './source-global-moment.mjs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from './source-exterior-force-evidence.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const seals=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),total=a=>a.reduce((s,n)=>s+n,0),
  names=['P','Jtheta','Jz'],components=['v','gamma','psi','betaOverEpsilon'],
  trim=p=>{while(p.length>1&&p.at(-1)===0n)p.pop();return p;},
  addP=(a,b)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,j)=>(a[j]??0n)+(b[j]??0n))),
  scaleP=(a,c)=>trim(a.map(x=>x*c)),
  mulP=(a,b)=>{const p=Array(a.length+b.length-1).fill(0n);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)p[i+j]+=a[i]*b[j];return trim(p);},
  derivativeP=p=>p.length<2?[0n]:p.slice(1).map((x,j)=>BigInt(j+1)*x);

/** Exact flatness recurrence for the actual seed exp(-1/[t(1-t)]).
 * This polynomial recurrence has no mathematical derivative-order cap.
 */
export function originalMeanSeedFlatJets(input={}){
  if(!input||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))fail('Choose a finite seed derivative order and work budget only.','INVALID_INPUT');
  const order=input.order??3,maxWork=input.maxWork??100000;
  if(!Number.isSafeInteger(order)||order<0||order>Math.floor(Number.MAX_SAFE_INTEGER/2)||!Number.isSafeInteger(maxWork)||maxWork<1||order>maxWork)
    fail('The exact seed recurrence exceeds its finite work budget.','RESOURCE_LIMIT');
  const q=[0n,1n,-1n],qp=[1n,-2n],q2=mulP(q,q),qqp=mulP(q,qp),rows=[];let p=[1n],work=0;
  for(let n=0;n<=order;n++){
    work+=p.length;if(work>maxWork)fail('The entire original seed polynomial must fit the declared work budget.','RESOURCE_LIMIT');
    rows.push({order:n,polynomial:p.map(String),denominatorPower:2*n,numeratorL1:p.reduce((s,x)=>s+(x<0n?-x:x),0n).toString()});
    if(n<order)p=addP(addP(mulP(derivativeP(p),q2),scaleP(mulP(p,qqp),-2n*BigInt(n))),mulP(p,qp));
  }
  return {schema:'MathScope.N6.OriginalMeanSeedFlatJets/1',order,rows,work,maxWork,
    recurrence:'P_0=1; P_(n+1)=q^2*P_n_prime-2n*q*q_prime*P_n+q_prime*P_n; q=t*(1-t).',
    identity:'D_t^n exp(-1/q)=P_n(t)*q^(-2n)*exp(-1/q), 0<t<1.',
    flatness:'For every fixed n,N, exp(1/q)>=(1/q)^(N+2n+1)/(N+2n+1)! gives |D^n seed|<=||P_n||_1*(N+2n+1)!*q^(N+1). Thus every derivative tends to0 at both endpoints and the zero extension is C-infinity.',
    completeIntegerPolynomial:true,mathematicalOrderCap:null,floatingPointValuesUsed:false};
}

function request(input){
  if(!input||Object.keys(input).some(k=>!['order','maxNodes','maxWork'].includes(k)))
    fail('No source, replacement lambda, target norm, class flag or coordinate box is accepted.','INVALID_INPUT');
  const r={order:input.order??1,maxNodes:input.maxNodes??300000,maxWork:input.maxWork??100000};
  if(!Number.isSafeInteger(r.order)||r.order<0||!Number.isSafeInteger(r.maxNodes)||r.maxNodes<4000||r.maxNodes>350000||
    !Number.isSafeInteger(r.maxWork)||r.maxWork<1||(r.order+3)*(r.order+4)*(r.order+5)/6>r.maxWork)
    fail('The source seminorm order exceeds the declared finite construction budget.','RESOURCE_LIMIT');
  return r;
}

/** These are the literal profile/matrix bodies in source-global-moment.
 * R is used only for a canonical same-source comparison. Actual seminorms
 * are subsequently computed in the independent compact source chart.
 */
export function originalFixedMeanResponseBodies(G,{s,X,eta,R}={}){
  if([s,X,eta,R].some(x=>G.nodes[x]?.op!=='coordinate')||new Set([s,X,eta,R]).size!==4)
    fail('The fixed mean response uses independent source chart and comparison coordinates.');
  const q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),lambda=G.parameter('lambda'),h=G.parameter('h'),A=G.add(q(1,2),h),
    X0=G.parameter('X0Imean'),x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2))),d=q(1,5),
    x=G.fresh('fixed_mean_profile_x'),t=G.fresh('fixed_mean_seed_t'),
    seed=G.choose(t,G.zero,G.one,G.zero,G.exp(G.neg(G.inv(G.mul(t,G.sub(G.one,t))))),G.zero),
    eta0=G.div(G.substitute(seed,t,G.mul(q(10),G.sub(G.div(x,x0),G.one))),x0),
    powers=[q(2),G.neg(G.add(q(2),G.mul(q(2),lambda))),G.neg(G.mul(q(2),lambda)),G.one,G.sub(G.one,G.mul(q(2),lambda))],
    mu=powers.map(p=>G.integral(G.mul(power(x,p),eta0),x,x0,G.mul(q(11,10),x0))),
    sourceT=G.parameter('T'),logK=G.add(G.mul(q(-59997,2),sourceT),q(33,10),G.mul(G.sub(q(15,2),G.mul(q(60000),sourceT)),lambda)),
    K=G.exp(logK),a=G.div(G.mul(K,power(G.mul(q(2),X0),G.add(q(1,2),lambda))),G.add(G.one,G.pow(eta,2))),
    angularNodes=powers.slice(0,3).map(p=>G.exp(G.mul(d,p))),axialNode=G.exp(d),axialRatio=G.exp(G.mul(q(-2),d,lambda)),
    angularFactors=[mu[0],G.mul(q(2),a,mu[1]),G.neg(G.mul(a,mu[2]))],axialFactors=[mu[3],G.mul(a,mu[4])],
    chartPowers={P:G.mul(q(2),A),Jtheta:G.sub(G.mul(q(2),A),q(3,2)),Jz:G.sub(G.mul(q(2),A),G.one)},
    chartFactors=Object.fromEntries(names.map(name=>[name,power(s,chartPowers[name])])),
    copies=[0,1,2].map(j=>{
      const scale=G.exp(G.mul(q(j),d)),profile=G.div(G.substitute(eta0,x,G.div(x,scale)),scale),
        inQ=G.mul(power(s,G.neg(A)),G.substitute(profile,x,G.div(R,G.sqrt(s))));
      return {j,scale,profile,inQ,support:[G.mul(x0,scale),G.mul(q(11,10),x0,scale)]};
    }),rhat=G.sqrt(G.mul(q(2),X)),rhatLower=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,4))),
    chart=exactSlowChartOperators(G,{s,X,eta,h}),units=names.map(name=>{
      const targets=Object.fromEntries(names.map(n=>[n,n===name?chartFactors[n]:G.zero])),
        coefficients=exactFiveMomentCoefficients(G,{angularNodes,angularFactors,angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)],
          axialNode,axialRatio,axialFactors,axialTarget:G.neg(targets.Jtheta)}),
        vProfile=G.add(...coefficients.angular.map((c,j)=>G.mul(c,copies[j].profile))),
        gammaProfile=G.add(...coefficients.axial.map((c,j)=>G.mul(c,copies[j].profile))),
        v=G.mul(power(s,G.neg(A)),G.substitute(vProfile,x,rhat)),
        gamma=G.mul(power(s,G.neg(A)),G.substitute(gammaProfile,x,rhat)),
        primitive=G.integral(G.mul(x,gammaProfile),x,rhatLower,rhat),
        psi=G.mul(power(s,G.sub(q(1,2),A)),G.div(primitive,rhat)),
        betaUndifferentiatedTarget=G.neg(chart.derivative(psi,1)),betaDifferentiatedTarget=G.neg(psi);
      return {target:name,targets,coefficients,vProfile,gammaProfile,v,gamma,primitive,psi,
        betaUndifferentiatedTarget,betaDifferentiatedTarget,
        zeroFullWeightedAxialMoment:coefficients.axialValues[0],zeroFullWeightedAngularMoment:coefficients.angularValues[0]};
    });
  return {coordinates:{s,X,eta,R,x,t},lambda,h,A,X0,x0,d,seed,eta0,powers,mu,logK,K,a,angularNodes,axialNode,axialRatio,
    angularFactors,axialFactors,chartPowers,chartFactors,copies,rhat,rhatLower,units};
}

const record=p=>({schema:p.schema,request:p.request,source:p.source,domain:p.domain,sourceDefinitions:p.sourceDefinitions,
  sourceBodies:p.sourceBodies,seedFlatness:p.seedFlatness,separability:p.separability,radialProfiles:p.radialProfiles,
  expansion:p.expansion,entries:p.entries,normRows:p.normRows,
  byOrder:p.byOrder,roots:p.roots,checks:p.checks,scope:p.scope});

export async function prepareOriginalMeanMapOperatorSeminorms(input={},context={}){
  const r=request(input),archive=await recordedSourceN7DomainExterior();sourceExteriorForceObservations(archive);
  const sourceMean=archive.domain.fixedMeanMap;
  if(!archive.archiveVerification.pass||!sourceMean.pass||!sourceMean.checks.every(x=>x.pass)||
    !same(sourceMean.executedSourceUniformBound.domain,{eta:[-1,1],s:[0.5,2],y:[0,5]}))
    fail('The authenticated original fixed mean patch and its entire source eta strip are required.');
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
    [s,X,eta,R]=['fixed_mean_s','fixed_mean_X','fixed_mean_eta','fixed_mean_R_comparison'].map(n=>G.fresh(n)),
    bodies=originalFixedMeanResponseBodies(G,{s,X,eta,R}),{h,lambda,X0}=bodies,
    Xb=G.mul(G.parameter('XR'),G.exp(G.outer.stages.at(-1).end)),Xa=G.parameter('Xa'),t1=G.parameter('t1'),
    box={coordinates:[s,X,eta],lower:[q(1,2),G.mul(X0,G.exp(q(1,2))),q(-1)],upper:[q(2),G.mul(X0,G.exp(q(5,2))),G.one]},
    leftDistance=G.log(G.div(X,Xa)),rightDistance=G.log(G.div(Xb,X)),
    zeta=G.exp(G.neg(G.add(G.div(G.pow(t1,2),G.pow(leftDistance,2)),G.div(q(4),G.pow(rightDistance,2))))),
    leftMinimum=G.log(G.div(box.lower[1],Xa)),rightMinimum=G.log(G.div(Xb,box.upper[1])),
    zetaInverseUpper=G.exp(G.add(G.div(G.pow(t1,2),G.pow(leftMinimum,2)),G.div(q(4),G.pow(rightMinimum,2)))),
    expansion=exactSlowProfileExpansion(G,{s,X,eta,h,multiplier:G.one,order:r.order+1,maxJetRequests:r.maxWork}),
    seedFlatness=originalMeanSeedFlatJets({order:r.order+4,maxWork:r.maxWork}),entries=[],normRows=[],memo=new Map();let work=0;
  const charge=stage=>{
    context.checkCancelled?.();if(++work>r.maxWork||G.nodes.length>r.maxNodes)fail('The actual fixed mean seminorm graph exceeded its declared budget; no norm is returned.','RESOURCE_LIMIT');
    context.onProgress?.({stage,nodeCount:G.nodes.length,work});
  };
  const norm=(body,orders,{weighted=false,kind='slow-chart-coefficient'}={})=>{
    const key=body+':'+weighted;if(memo.has(key))return memo.get(key);
    charge('actual-fixed-mean-source-derivative-FTC');
    const weightedBody=body===G.zero?G.zero:weighted?G.div(body,zeta):body,
      indices=box.coordinates.map((v,j)=>G.dependsOn(weightedBody,v)?j:-1).filter(j=>j>=0),
      activeBox={coordinates:indices.map(j=>box.coordinates[j]),lower:indices.map(j=>box.lower[j]),upper:indices.map(j=>box.upper[j])},
      ftc=body===G.zero?{body:weightedBody,...activeBox,faces:[],bound:G.zero,
        exactZeroBody:true,finiteExactIntegral:true,decimalEvaluation:false,sourceAuthenticated:false}:
        indices.length?rectangularSourceFTC(G,{body:weightedBody,...activeBox}):
          {body:weightedBody,...activeBox,faces:[],bound:G.sqrt(G.add(G.one,G.pow(weightedBody,2))),
            constantBody:true,finiteExactIntegral:true,decimalEvaluation:false,sourceAuthenticated:false};
    charge('actual-fixed-mean-source-FTC-complete');
    const row={sourceBody:body,orders:[...orders],weightedBody,...ftc,kind,sourceBoundedKernel:true,
      ordinaryFieldDerivativeTakenBeforeDividingByZeta:weighted};normRows.push(row);memo.set(key,row);return row;
  };
  // The original inverse is separable: every nonzero coefficient is its
  // source-only value at(s,eta)=(1,0), times s^p*(1+eta^2). These exact
  // source identities prevent a large composed derivative from being
  // expanded repeatedly inside every FTC face. No derivative is omitted.
  const verify=createFactoredRationalVerifier(G,{maxTerms:120000}),etaFactor=G.add(G.one,G.pow(eta,2)),
    separability=bodies.units.map(unit=>{
      const atBase=id=>G.simultaneousSubstitute(id,[s,eta],[G.one,G.zero]),
        angular=unit.coefficients.angular.map(atBase),axial=unit.coefficients.axial.map(atBase),
        factor=G.mul(etaFactor,bodies.chartFactors[unit.target]),
        checks=['angular','axial'].flatMap(part=>unit.coefficients[part].map((id,j)=>({part,component:j,
          ...verify(G.sub(id,G.mul(factor,(part==='angular'?angular:axial)[j])))})));
      if(checks.some(x=>!x.pass))fail('An original fixed five-profile coefficient did not retain its exact s/eta separation.');
      return {target:unit.target,angular,axial,factor,checks,
        sourceOnly:angular.concat(axial).every(x=>G.freeCoordinates(x).size===0),
        identity:'c_target(s,eta)=s^(original q-to-Q exponent)*(1+eta^2)*c_target(1,0)',
        exactSourceValuesAtBase:true,sampledValueUsed:false};
    }),radialProfiles=[];
  for(const copy of bodies.copies){
    const actual=G.substitute(copy.profile,bodies.coordinates.x,bodies.rhat),
      primitive=G.div(G.integral(G.mul(bodies.coordinates.x,copy.profile),bodies.coordinates.x,bodies.rhatLower,bodies.rhat),bodies.rhat);
    for(const [kind,body]of [['profile',actual],...(copy.j<2?[['primitive',primitive]]:[])]){
      const derivatives=[];let value=body;
      for(let n=0;n<=r.order+1;n++){
        if(n)value=G.derivative(value,X);
        derivatives.push({order:n,actualDerivative:value,norm:norm(value,[n],{weighted:true,kind:'original-radial-'+kind})});
      }
      radialProfiles.push({copy:copy.j,kind,body,derivatives,
        individualPrimitiveDeclaredCompact:false,wholeAxialCombinationUsesExactZeroMoment:true});
    }
  }
  const coefficientNorms=new Map();
  for(const row of expansion.rows)for(const term of row.terms)if(!coefficientNorms.has(term.coefficient))
    coefficientNorms.set(term.coefficient,norm(term.coefficient,row.slowOrders));
  const expansionByOrders=new Map(expansion.rows.map(row=>[row.slowOrders.join(','),row])),
    kernelBounds=new Map(),absSource=x=>x===G.zero?G.zero:G.sqrt(G.add(G.one,G.pow(x,2)));
  for(const unit of bodies.units){
    const separated=separability.find(row=>row.target===unit.target),
      nu=G.sub(bodies.chartPowers[unit.target],bodies.A),
      family=[['v','profile',separated.angular,nu],['gamma','profile',separated.axial,nu],
        ['psi','primitive',separated.axial,G.add(nu,q(1,2))]];
    for(const [component,kind,coefficients,exponent]of family){
      const absoluteExponent=absSource(exponent),powerBound=G.exp(G.mul(absoluteExponent,G.log(q(2)))),
        profileBounds=Array.from({length:r.order+2},(_,n)=>G.add(...coefficients.map((c,j)=>c===G.zero?G.zero:
          G.mul(absSource(c),radialProfiles.find(p=>p.copy===j&&p.kind===kind).derivatives[n].norm.bound)))),
        rows=expansion.rows.map(row=>{
          const terms=row.terms.map(term=>{
            const [e,n,k]=term.profileOrders,etaDerivativeBound=k<=2?q(2):G.zero,
              value=G.mul(coefficientNorms.get(term.coefficient).bound,G.pow(absoluteExponent,e),powerBound,etaDerivativeBound,profileBounds[n]);
            return {profileOrders:term.profileOrders,coefficient:term.coefficient,coefficientNorm:coefficientNorms.get(term.coefficient).bound,
              eulerPowerExponent:exponent,eulerPowerBound:G.mul(G.pow(absoluteExponent,e),powerBound),etaDerivativeBound,
              weightedRadialDerivativeBound:profileBounds[n],value};
          });
          return {slowOrders:row.slowOrders,sourceKernel:unit[component],exactExpansion:row,
            factorBounds:terms,norm:{bound:G.add(...terms.map(t=>t.value)),actualSourceFactorDerivativesRetained:true},
            wholeMixedBodyRepeatedlyExpanded:false};
        });
      kernelBounds.set(unit.target+':'+component,new Map(rows.map(row=>[row.slowOrders.join(','),row])));
      entries.push({target:unit.target,component,body:unit[component],targetDerivative:[0,0,0],
        epsilonPrefactor:0,physicalNormalizedComponent:component,bounds:rows.filter(row=>total(row.slowOrders)<=r.order),
        separatedExponent:exponent,sourceOnlyCoefficients:coefficients,
        exactPowerLaw:'E_s^e s^nu=nu^e*s^nu; exp(a)*exp(b)=exp(a+b), with the literal original q-to-Q exponent minus A (plus1/2 for psi).'});
    }
    const psiBounds=kernelBounds.get(unit.target+':psi');
    for(const [body,targetDerivative,shift]of [[unit.betaUndifferentiatedTarget,[0,0,0],[0,1,0]],
      [unit.betaDifferentiatedTarget,[0,1,0],[0,0,0]]]){
      const bounds=expansion.rows.filter(row=>total(row.slowOrders)<=r.order).map(row=>{
        const required=row.slowOrders.map((n,j)=>n+shift[j]),original=psiBounds.get(required.join(','));
        if(!original||!expansionByOrders.has(required.join(',')))fail('The full radial target/kernel product rule requested an absent slow derivative.');
        return {...original,slowOrders:row.slowOrders,originalPotentialSlowOrders:required,sourceKernel:body,
          derivativeCommutation:'The original smooth slow chart is an ordinary coordinate system; all mixed orders of the compact source kernel commute.'};
      });
      entries.push({target:unit.target,component:'betaOverEpsilon',body,targetDerivative,epsilonPrefactor:1,
        physicalNormalizedComponent:'beta',bounds});
    }
  }
  const byOrder=Array.from({length:r.order+1},(_,m)=>{
    const componentBounds=Object.fromEntries(components.map(component=>{
      const terms=entries.filter(e=>e.component===component).map(e=>G.maximum(G.zero,...e.bounds.filter(row=>total(row.slowOrders)<=m).map(row=>row.norm.bound))),
        bound=G.mul(q(2n**BigInt(m)),G.add(...terms));
      return [component,bound];
    }));
    return {order:m,componentBounds,maximum:G.maximum(G.one,...Object.values(componentBounds)),
      requiredTargetDerivativeOrder:m+1,leibnizCoefficientSum:(2n**BigInt(m)).toString(),sPolynomialPower:0,
      inequality:'max_|alpha|<=m |D^alpha output| <= componentBound*max_(target,|beta|<=m+1)|D^beta target|*zeta; beta has the additional retained epsilon factor.',
      originalClassImplication:{input:'all three original P/J defect functions with their own common bound and S power',
        inputClass:'S_H',outputClass:'M_H',radialOutputClass:'M_(H+1)',
        outputMeanGain:'unchanged',outputRadialGain:'plus1 in epsilon',addedSPower:0,sourceTargetNormInvented:false}};
  });
  const checks=[
    {id:'same-authenticated-original-profile-and-parameter-source',pass:G.source.id===sourceMean.source.profile&&
      G.source.parameterExpressionSHA256===sourceMean.source.parameterExpressionSHA256&&G.source.sourcePaperSHA256===sourceMean.source.paperSHA256},
    {id:'exact-source-positive-h-lambda-never-rounded',pass:same(G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&
      same(G.source.parametersExactExpressions.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}})},
    {id:'every-original-unit-five-row-system-retained',pass:bodies.units.every(u=>u.coefficients.checks.every(c=>c.pass)&&u.coefficients.sourceLambdaReplaced===false)},
    {id:'source-eta-strip-and-compact-chart-are-actual',pass:same(sourceMean.executedSourceUniformBound.domain.eta,[-1,1])&&
      same(sourceMean.executedSourceUniformBound.domain.s,[0.5,2])&&sourceMean.profiles.potentialHullIncluded&&sourceMean.profiles.smoothZeroExtension},
    {id:'strict-profile-and-potential-collar-margins',pass:1>1/2&&1+4/5+1/5===2&&2<5/2&&5/2<5,
      proof:'log(11/10)<1/10 gives 1+4/5+2log(11/10)<2. Thus all profile supports and their zero-moment primitive hull lie strictly within y in(1/2,5/2), itself inside the original Imean (0,5).'},
    {id:'actual-full-mixed-slow-chain-recurrence',pass:expansion.includesCoefficientDerivatives&&expansion.rows.length===(r.order+2)*(r.order+3)*(r.order+4)/6},
    {id:'actual-exact-source-coefficient-separation',pass:separability.every(row=>row.sourceOnly&&row.checks.every(c=>c.pass))},
    {id:'all-FTC-faces-retained-with-no-free-coordinate',pass:normRows.every(row=>(row.exactZeroBody||row.constantBody||row.faces.length===(1<<row.coordinates.length))&&G.freeCoordinates(row.bound).size===0)},
    {id:'positive-finite-fixed-operator-bounds',pass:byOrder.every(row=>G.freeCoordinates(row.maximum).size===0)&&G.freeCoordinates(zetaInverseUpper).size===0},
    {id:'radial-product-rule-and-target-derivative-retained',pass:entries.filter(e=>e.component==='betaOverEpsilon').length===6&&
      entries.filter(e=>e.component==='betaOverEpsilon').every(e=>e.epsilonPrefactor===1)&&entries.some(e=>same(e.targetDerivative,[0,1,0]))}
  ];
  if(checks.some(row=>!row.pass))fail('The original fixed mean operator bound failed: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const roots={sourceH:h,sourceLambda:lambda,sourceX0:X0,sourceXa:Xa,sourceXb:Xb,zeta,zetaInverseUpper};
  byOrder.forEach(row=>{roots['mean_operator_norm_'+row.order]=row.maximum;for(const [component,value]of Object.entries(row.componentBounds))roots[component+'_norm_'+row.order]=value;});
  const result={schema:'MathScope.N6.ActualFixedMeanOperatorSeminorms/1',G,request:r,
    source:{profileId:G.source.id,paperSHA256:G.source.sourcePaperSHA256,parameterExpressionSHA256:G.source.parameterExpressionSHA256,
      domainArtifact:copy(archive.domainArtifact),sourceMeanAssembly:copy(sourceMean.source.assembly),
      meanBodyProducer:'source-global-moment.mjs:sourceBumps; source-global-initial-mean.mjs:actual fresh five-row targets',
      sameFixedMapAsOriginalLemma8_7:true,currentDefectApplicationReference:'Lemma8.8',sourceOnly:true},
    domain:{...box,meanLogCollar:['1/2','5/2'],profileSupportLogLower:'1',profileSupportLogUpper:'1+4/5+2*log(11/10)<2',
      originalMeanLogInterval:['0','5'],originalSourceEtaStrip:['-1','1'],sourceSInterval:['1/2','2'],
      Xa,Xb,leftMinimum,rightMinimum,zeta,zetaInverseUpper,
      weight:'exp(-t1^2/log(X/Xa)^2-4/log(Xb/X)^2)',
      allDenominatorsPositive:'Original source 0<h,lambda<1/16, X0>0, s>=1/2 and1-2h eta^2>7/8. All mu_p>0. Distinct fixed geometric angular nodes and1-exp(-2lambda/5)>0 are retained.',
      sourceSupportPremise:'The authenticated original reserved Imean is strictly inside(Xa,Xb). Only its separated compact subcollar is used for the zeta inverse.',
      monotoneRootEvaluatedOnEnlargedBox:false,kernelFormulaExtendsEntireEtaStrip:true,
      primitiveSupportProof:'The exact homogeneous axial moment row and change of variables x=exp(j/5)y imply the full weighted profile integral is zero. The forward primitive is zero before the first support and after the last support. Its entire hull remains inside the same Imean collar; no raw full moment integral is discarded numerically.'},
    sourceDefinitions:{lambda:copy(G.source.parametersExactExpressions.lambda),h:copy(G.source.parametersExactExpressions.h),T:copy(G.source.parametersExactExpressions.T),
      actualKMean:bodies.K,KMeanConstructedFromExactOriginalLogFormula:bodies.logK,
      deltaV:'sum c_j*s^(-A)*eta_j(R/sqrt(s))',gamma:'sum d_j*s^(-A)*eta_j(R/sqrt(s))',
      psi:'s^(1/2-A)/x * integral_(collar-left)^x y*sum_j d_j eta_j(y)dy; x=sqrt(2X)',
      beta:'-epsilon*D_Z psi; retain kernel and target derivatives',qToQPowerFactors:bodies.chartPowers},
    sourceBodies:bodies,seedFlatness,separability,radialProfiles,expansion,entries,normRows,byOrder,roots,checks,
    scope:{actualFixedSourceKernelBodiesConstructed:true,allRequestedFixedOperatorSeminormRootsConstructed:true,
      everyRequestedFactorDerivativeAndFTCFaceConstructed:true,allMixedDerivativesBoundByExactChainComposition:true,
      arbitraryFixedOrderGenerator:true,allOrdersLiterallyExecuted:false,
      currentDefectSeminormsSuppliedByCaller:false,currentDefectClassCertified:false,actualInitializedCurrentAttached:false,
      originalFixedMapClassImplicationAvailable:true,fullCurrentAllOrderClassCertified:false,
      sourceNormNumbersEvaluated:false,wholeN6Complete:false,finalCutoffScheduleInstantiated:false,newLeanKernelProof:false}};
  charge('actual-original-fixed-mean-operator-majorants-complete');
  const count=G.nodes.length,metadata=record(result),
    program=copy(G.pack(roots,{schema:'MathScope.N6.ActualFixedMeanOperatorProgram/1',metadata}));
  seals.set(result,{G,count,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    record:canonicalStringify(metadata),program});
  return result;
}

export function assertOriginalMeanMapOperatorSeminorms(result){
  const seal=seals.get(result);
  if(!seal||seal.G!==result.G||seal.nodes!==canonicalStringify(result.G.nodes.slice(0,seal.count))||
    !result.G.functionDefinitionsUnchanged(seal.definitions)||seal.record!==canonicalStringify(record(result)))
    fail('Use the unchanged privately constructed original fixed mean operator seminorms.');
  return true;
}

export async function originalMeanMapOperatorCertificate(result){
  assertOriginalMeanMapOperatorSeminorms(result);const seal=seals.get(result),metadata=record(result),
    program=copy(seal.program),
    encoded=canonicalStringify(program);
  return {...metadata,schema:'MathScope.N6.ActualFixedMeanOperatorCertificate/1',
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,canonicalBytes:new TextEncoder().encode(encoded).length},program,
    execution:'ACTUAL_ORIGINAL_FIXED_FIVE_PROFILE_SOURCE_OPERATOR_AND_REQUESTED_SEMINORMS',
    actualInputDefectNormsStillRequired:true};
}
