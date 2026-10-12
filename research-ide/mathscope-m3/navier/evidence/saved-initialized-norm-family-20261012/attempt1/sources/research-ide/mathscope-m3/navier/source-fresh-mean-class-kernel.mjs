/** Complete finite seminorm algebra for the ORIGINAL freshly updated mean.
 *
 * Every time, radial, axial, centrifugal and viscous term of g_r is kept.
 * The two full flux moments and the R^2*g_r part of J_z are kept as well.
 * This is a conditional scalar kernel: only its separate private adapter
 * can identify the input rows with the actual same-source mean fields.
 */
import {rational as Q,readRational as readQ,qadd,qmul,qdiv,qcompare,qtext}
  from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {radialFactorial,radialBinomial} from './source-radial-class-kernel.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  only=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))
    fail('Use only the complete field rows, fixed operator constants and finite work request.');},
  root=(G,id)=>Number.isSafeInteger(id)&&!!G?.nodes?.[id],
  expValue=e=>qadd(e[0],qdiv(e[1],Q(100000))),
  expAdd=(a,b)=>[qadd(a[0],b[0]),qadd(a[1],b[1])];

/** Exact rational-affine epsilon exponents. The original kappa_s remains
 * the literal rational 1/100000. The original positive h is never given
 * a floating-point value: epsilon=Q_ref^h remains the same source scale.
 */
function exponent(value){
  if(typeof value!=='string'||value.length>200)fail('Retain an exact original epsilon exponent.');
  if(!value.includes('kappa_s'))return [readQ(value),Q(0)];
  const m=/^([+-]?\d+(?:\/\d+)?)?([+-])?(?:(\d+(?:\/\d+)?)\*)?kappa_s$/.exec(value);
  if(!m||m[1]&&!m[2])fail('Use a rational constant plus a rational multiple of kappa_s.');
  const c=m[1]?readQ(m[1]):Q(0),k=qmul(readQ(m[3]??'1'),Q(m[2]==='-'?-1:1));
  return [c,k];
}
function exponentText(e){
  const c=qtext(e[0]),k=e[1],s=qcompare(k,Q(0));if(!s)return c;
  const a=qtext(s<0?qmul(k,Q(-1)):k),part=(a==='1'?'':a+'*')+'kappa_s';
  return (c==='0'?(s<0?'-':''):c+(s<0?'-':'+'))+part;
}

export function originalFreshMeanClassDerivativeDemand(input={}){
  only(input,['order']);const m=natural(input.order??0,'Fresh mean output order');
  if(!Number.isSafeInteger(m+5))fail('The complete source derivative demand exceeds its exact representation.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalFreshMeanClassDerivativeDemand/1',order:m,
    requiredVelocityOrder:m+2,requiredBackgroundOrder:m+1,requiredCovarianceOrder:m+1,
    requiredRadialCoefficientOrder:m+1,requiredFixedProjectionOrder:m,
    fixedFiveMapOutputOrder:m,requiredFiveMapInputDefectOrder:m+1,
    actualInitializedRemainderOutputOrder:m,
    requiredInitializedFiveMapOrder:m+2,requiredInitializedInputDefectOrder:m+3,
    requiredPreFiveVelocityOrder:m+5,requiredPreFiveBackgroundOrder:m+4,
    requiredPreFiveCovarianceOrder:m+4,
    coordinates:['R','Z','T','Y0','Y1'],equations:['8.3','8.12','8.15','8.25','8.26','8.27'],
    derivativeAccounting:[
      'The complete g_r has two derivatives of beta through the full vector Laplacian; every time and quadratic flux term uses at most one.',
      'The exact fresh P,Jtheta,Jz are whole radial and normalized Haar integrals. Smooth zero extension fixes all endpoint terms; no derivative loss is introduced by those fixed linear integrals.',
      'The original fixed five-map through order m requests all three fresh target functions through m+1 because beta differentiates both the source kernel and the target.',
      'To bound the actual new nonlinear defect remainder through m, the full five-map velocity is needed through m+2; hence fresh targets through m+3 and the preceding velocity through m+5.'
    ],allThreeFreshTargetsRequired:true,fullPressureMomentInsideJz:true,
    sourceAuthenticated:false,noActualSourceNormInvented:true};
}

function calculus(G,{maxWork=200000,radiusBase,radialDerivativeBounds}){
  natural(maxWork,'Norm work budget');
  const closed=id=>root(G,id)&&G.freeCoordinates(id).size===0&&
    !(G.nodes[id].op==='rational'&&BigInt(G.nodes[id].args[0])<0n);
  if(maxWork<1||!closed(radiusBase)||!Array.isArray(radialDerivativeBounds)||!radialDerivativeBounds.length||
    radialDerivativeBounds.some(x=>!closed(x)))fail('Retain every positive closed original radial coefficient envelope.');
  let work=0;const charge=()=>{if(++work>maxWork)fail('The full mean norm program exceeded its finite operation budget.','RESOURCE_LIMIT');};
  const norm=f=>{
    if(!f||!closed(f.constant)||!Number.isSafeInteger(f.power)||f.power<0||
      !Number.isSafeInteger(f.pole)||f.pole<0||!['1','zeta'].includes(f.weight)||f.gaussian&&f.gaussian!=='1')
      fail('A complete through-order norm must retain its closed constant, S degree, pole, epsilon exponent and weight.');
    const e=exponent(f.epsilonExponent);
    return {constant:f.constant,power:f.power,pole:f.pole,epsilonExponent:exponentText(e),
      epsilonExponentExact:qtext(expValue(e)),weight:f.weight,gaussian:'1'};
  };
  const unit=(constant,epsilonExponent='0')=>norm({constant,power:0,pole:0,epsilonExponent,weight:'1'}),
    scale=(f,constant,epsilon='0')=>{
      charge();if(!closed(constant))fail('A mean coefficient majorant must be a nonnegative closed source expression.');
      return norm({...f,constant:G.mul(f.constant,constant),epsilonExponent:exponentText(expAdd(exponent(f.epsilonExponent),exponent(epsilon)))});
    },
    add=(...fs)=>{
      charge();if(!fs.length)fail('No retained original mean term may be absent.');
      const e=fs.reduce((best,f)=>qcompare(expValue(exponent(f.epsilonExponent)),expValue(best))<0?exponent(f.epsilonExponent):best,
        exponent(fs[0].epsilonExponent));
      return norm({constant:G.add(...fs.map(f=>f.constant)),power:Math.max(...fs.map(f=>f.power)),
        pole:Math.max(...fs.map(f=>f.pole)),epsilonExponent:exponentText(e),
        weight:fs.every(f=>f.weight==='zeta')?'zeta':'1'});
    },
    multiply=(a,b)=>{
      charge();if(!Number.isSafeInteger(a.power+b.power)||!Number.isSafeInteger(a.pole+b.pole))
        fail('The full source class degree or pole exceeded its integer representation.','RESOURCE_LIMIT');
      return norm({constant:G.mul(a.constant,b.constant),power:a.power+b.power,pole:a.pole+b.pole,
        epsilonExponent:exponentText(expAdd(exponent(a.epsilonExponent),exponent(b.epsilonExponent))),
        weight:a.weight==='zeta'||b.weight==='zeta'?'zeta':'1'});
    },
    series=(rows,key,length)=>{
      if(!Array.isArray(rows)||rows.length<length||rows.slice(0,length).some((r,j)=>r.order!==j||!r[key]))
        fail('Generate every actual '+key+' through-order row through '+(length-1)+'.','RESOURCE_LIMIT');
      return rows.slice(0,length).map(r=>norm(r[key]));
    },
    sumSeries=(...ss)=>Array.from({length:Math.min(...ss.map(s=>s.length))},(_,m)=>add(...ss.map(s=>s[m]))),
    timesSeries=(s,c,e='0')=>s.map(f=>scale(f,c,e)),
    product=(a,b)=>Array.from({length:Math.min(a.length,b.length)},(_,m)=>add(...Array.from({length:m+1},(_,j)=>
      scale(multiply(a[j],b[m-j]),G.q(radialBinomial(m,j)))))),
    derivative=(s,n=1)=>s.slice(n),
    inverseRadius=length=>Array.from({length},(_,m)=>unit(G.mul(G.q(radialFactorial(m)),G.pow(radiusBase,m+1)))),
    radiusPower=(power,length)=>Array.from({length},()=>unit(G.mul(G.q(radialFactorial(power)),G.pow(radiusBase,power)))),
    fast=length=>{
      if(radialDerivativeBounds.length<length)fail('A complete fixed radial derivative envelope is missing.','RESOURCE_LIMIT');
      return radialDerivativeBounds.slice(0,length).map(id=>unit(id,'-kappa_s'));
    },
    Dr=s=>sumSeries(derivative(s),timesSeries(product(fast(s.length-1),derivative(s)),G.sqrt(G.q(2)))),
    De=(s,e)=>sumSeries(Dr(s),timesSeries(product(inverseRadius(s.length-1),s),G.q(e))),
    Dz=s=>timesSeries(derivative(s),G.one,'1'),
    time=s=>sumSeries(Dz(s),timesSeries(derivative(s),G.sqrt(G.q(2)))),
    lap=(s,vector=false)=>{
      const d=Dr(s),ss=[Dr(d),product(inverseRadius(d.length-1),d),timesSeries(derivative(s,2),G.one,'2')];
      if(vector)ss.push(product(product(inverseRadius(s.length-2),inverseRadius(s.length-2)),s));
      return sumSeries(...ss);
    },
    inverseProduct=(s,power=1)=>{let c=inverseRadius(s.length);for(let j=1;j<power;j++)c=product(c,inverseRadius(s.length));return product(c,s);},
    radialProduct=(s,power)=>product(radiusPower(power,s.length),s),
    projection=(f,{wholeHaarProjection,projectionPole})=>{
      if(f.weight!=='zeta'||!closed(wholeHaarProjection)||!Number.isSafeInteger(projectionPole)||projectionPole<f.pole)
        fail('The full Haar/radial operator must cover the actual complete input weight and pole.','RESOURCE_LIMIT');
      return {...scale(f,wholeHaarProjection),pole:0,weight:'1',independentOfRAndY:true,
        wholeNormalizedHaarAndRadialIntegral:true};
    };
  return {norm,unit,scale,add,multiply,series,sumSeries,timesSeries,product,derivative,inverseRadius,radiusPower,
    Dr,De,Dz,time,lap,inverseProduct,radialProduct,projection,work:()=>work};
}

const fixedKeys=['radiusBase','radialDerivativeBounds','wholeHaarProjection','projectionPole','maxWork'],
  copy=x=>structuredClone(x),
  proof=[
    'Every input row bounds all five-coordinate mixed derivatives through its stated order, with the same original frozen reference scale.',
    'The full Leibniz convolution sum_j binomial(m,j)*A_j*B_(m-j) bounds every mixed derivative through m; no derivative of the original source coefficient is suppressed.',
    'The exact coefficient l1 norms are sqrt(2) for L=(1,1-sqrt(2)) and N=(sqrt(2)-1,1). All ordinary derivatives freeze ci0<=1 and epsilon; a=M*d_r*R^(d_r-1) retains one epsilon^(-kappa_s) at every finite coefficient order.',
    'D_r(D_r f) is bounded by applying the same full product rule twice. This retains the derivative of a, the mixed slow/torus terms and both fast torus derivatives. The R^-1*D_r term and vector R^-2 term are separate.',
    'For 0<epsilon<=1 the least displayed exponent bounds a sum; for S_ref>=1 and delta_*=min(1,da,db)<=1 the largest degree/pole bounds a sum. Products retain the sum of degrees and poles.',
    'The actual Gaussian weight obeys 0<zeta<=1, so a product with two zeta factors may be bounded by one. Every mean force/flux term still has at least one full zeta factor.',
    'Only the final P/J operation averages on the complete unit-mass two-torus and integrates over the whole original radial envelope. Smooth zero extension of all source jets supplies the endpoint premise; the input pole is absorbed by the actual fixed operator.',
    'No latest pressure, covariance, temporal correction, old/new quadratic term or unchanged base residual is silently replaced by zero.'
  ];

export function composeOriginalFreshMeanDefectRows(G,input={}){
  only(input,['order','backgroundRows','velocityRows','covarianceRows',...fixedKeys]);
  const demand=originalFreshMeanClassDerivativeDemand({order:input.order??0}),m=demand.order,C=calculus(G,input),n=m+3,
    bg=Object.fromEntries(['b','V','G'].map(k=>[k,C.series(input.backgroundRows,k,m+2)])),
    v=Object.fromEntries(['beta','v','gamma'].map(k=>[k,C.series(input.velocityRows,k,n)])),
    W=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map(k=>[k,C.series(input.covarianceRows,k,m+2)])),
    {sumSeries:add,product:mul,timesSeries:times,De,Dz,time,lap,inverseProduct:divR,radialProduct:Rmul}=C,
    grTerms={
      time:time(v.beta),
      radial:De(add(times(mul(bg.b,v.beta),G.q(2)),mul(v.beta,v.beta),W.rr),1),
      axial:Dz(add(mul(bg.b,v.gamma),mul(bg.G,v.beta),mul(v.beta,v.gamma),W.rz)),
      centrifugal:divR(add(times(mul(bg.V,v.v),G.q(2)),mul(v.v,v.v),W.thetatheta)),
      viscous:times(lap(v.beta,true),G.one,'1')
    },
    fluxThetaTerms={backgroundAxial:mul(bg.G,v.v),backgroundAngular:mul(bg.V,v.gamma),
      completeMeanQuadratic:mul(v.gamma,v.v),completeCovariance:W.thetaz},
    fluxZTerms={backgroundAxial:times(mul(bg.G,v.gamma),G.q(2)),
      completeMeanSquare:mul(v.gamma,v.gamma),completeCovariance:W.zz},
    gr=add(...Object.values(grTerms)),fluxTheta=Rmul(add(...Object.values(fluxThetaTerms)),2),
    fluxZ=Rmul(add(...Object.values(fluxZTerms)),1),weightedGr=Rmul(gr,2),
    rows=Array.from({length:m+1},(_,j)=>{
      const P=C.projection(gr[j],input),Jtheta=C.projection(fluxTheta[j],input),
        axialMoment=C.projection(fluxZ[j],input),pressureMoment=C.scale(C.projection(weightedGr[j],input),G.q(1,2)),
        Jz={...C.add(axialMoment,pressureMoment),independentOfRAndY:true,wholeNormalizedHaarAndRadialIntegral:true};
      return {order:j,gr:gr[j],grTerms:Object.fromEntries(Object.entries(grTerms).map(([k,s])=>[k,s[j]])),
        fluxTheta:fluxTheta[j],fluxZ:fluxZ[j],weightedGr:weightedGr[j],
        fluxThetaTerms:Object.fromEntries(Object.entries(fluxThetaTerms).map(([k,s])=>[k,s[j]])),
        fluxZTerms:Object.fromEntries(Object.entries(fluxZTerms).map(([k,s])=>[k,s[j]])),
        defects:{P,Jtheta,Jz},JzParts:{axialMoment,pressureMoment},
        grSigns:{time:-1,radial:-1,axial:-1,centrifugal:1,viscous:1},
        exactJzIdentity:'Jz=whole_R Haar(R*(2*G*gamma+gamma^2+W_zz))-(1/2)*whole_R R^2 Haar(g_r)',
        sourceBackgroundRadialGainRetained:true,allFiveGrGroupsRetained:true,pressureMomentDiscarded:false};
    });
  return {schema:'MathScope.N6.OriginalFreshMeanDefectClassProducts/1',order:m,demand,rows,
    requiredProjectionPole:Math.max(...rows.flatMap(r=>[r.gr.pole,r.fluxTheta.pole,r.fluxZ.pole,r.weightedGr.pole])),
    proof:copy(proof),work:C.work(),fullSixComponentCovarianceInputRetained:true,
    fullTimeAndVectorViscosityRetained:true,allOldAndMeanQuadraticTermsRetained:true,
    normalizedHaarTakenOnlyAtDefects:true,sourceAuthenticated:false,actualInputSourceClassesCertified:false,
    originalProp9_5Certified:false,completeN6:false};
}

/** Full nonlinear remainder after the exact ORIGINAL five-row solve.
 * The linear 2*V*Delta v/R term is absent only because the separately
 * authenticated five-row moment identity cancels it. Every other term
 * from (8.26)--(8.27), including all old/new mean products, is present.
 */
export function composeOriginalFiveMomentRemainderRows(G,input={}){
  only(input,['order','backgroundRows','previousRows','incrementRows',...fixedKeys]);
  const m=natural(input.order??0,'Five-map remainder output order'),C=calculus(G,input),n=m+3,
    bg=Object.fromEntries(['b','V','G'].map(k=>[k,C.series(input.backgroundRows,k,m+2)])),
    before=Object.fromEntries(['beta','v','gamma'].map(k=>[k,C.series(input.previousRows,k,n)])),
    delta=Object.fromEntries(['beta','v','gamma'].map(k=>[k,C.series(input.incrementRows,k,n)])),
    {sumSeries:add,product:mul,timesSeries:times,De,Dz,time,lap,inverseProduct:divR,radialProduct:Rmul}=C,
    terms={time:time(delta.beta),
      radial:De(add(times(mul(bg.b,delta.beta),G.q(2)),times(mul(before.beta,delta.beta),G.q(2)),mul(delta.beta,delta.beta)),1),
      axial:Dz(add(mul(bg.b,delta.gamma),mul(bg.G,delta.beta),mul(before.beta,delta.gamma),
        mul(before.gamma,delta.beta),mul(delta.beta,delta.gamma))),
      angular:divR(add(times(mul(before.v,delta.v),G.q(2)),mul(delta.v,delta.v))),
      viscous:times(lap(delta.beta,true),G.one,'1')},
    Rg=add(...Object.values(terms)),JthetaIntegrand=Rmul(add(mul(before.gamma,delta.v),mul(before.v,delta.gamma),mul(delta.gamma,delta.v)),2),
    JzVelocityIntegrand=Rmul(add(times(mul(before.gamma,delta.gamma),G.q(2)),mul(delta.gamma,delta.gamma)),1),
    weightedRg=Rmul(Rg,2),rows=Array.from({length:m+1},(_,j)=>{
      const P=C.projection(Rg[j],input),Jtheta=C.projection(JthetaIntegrand[j],input),
        axial=C.projection(JzVelocityIntegrand[j],input),pressure=C.scale(C.projection(weightedRg[j],input),G.q(1,2));
      return {order:j,Rg:Rg[j],terms:Object.fromEntries(Object.entries(terms).map(([k,s])=>[k,s[j]])),
        JthetaIntegrand:JthetaIntegrand[j],JzVelocityIntegrand:JzVelocityIntegrand[j],weightedRg:weightedRg[j],
        defects:{P,Jtheta,Jz:{...C.add(axial,pressure),independentOfRAndY:true}},JzParts:{axial,pressure},
        exactCurrentDefectsEqualTheseRemaindersRequiresActualFiveRows:true,
        noNewNonlinearDefectDeclaredZero:true,oldMeanProductsRetained:true};
    });
  return {schema:'MathScope.N6.OriginalFiveMomentRemainderClassProducts/1',order:m,rows,proof:copy(proof),work:C.work(),
    actualFiveRowCancellationRequired:true,sourceAuthenticated:false,
    conditionalConclusion:'When the actual same-current five-row and full updated-pressure identities hold, these complete remainder norms bound its three freshly recomputed defects.',
    actualFiveRowCancellationSuppliedByCaller:false,originalProp9_5Certified:false,completeN6:false};
}

/** The fixed five-profile map is linear in the three fresh S_H targets.
 * Its already complete source kernel norm includes every binomial, unit
 * response and beta target derivative. No extra current norm is invented.
 */
export function composeOriginalFiveMapClassRows(G,input={}){
  only(input,['order','defectRows','operatorRows','maxWork']);const m=natural(input.order??0,'Fixed five-map output order'),
    C=calculus(G,{radiusBase:G.one,radialDerivativeBounds:[G.one],maxWork:input.maxWork??200000});
  if(!Array.isArray(input.defectRows)||input.defectRows.length<m+2||!Array.isArray(input.operatorRows)||input.operatorRows.length<m+1)
    fail('Keep all three fresh defects through m+1 and the original fixed five-map operator through m.','RESOURCE_LIMIT');
  const rows=Array.from({length:m+1},(_,j)=>{
    const old=input.defectRows[j+1],op=input.operatorRows[j];
    if(old.order!==j+1||op.order!==j||op.requiredTargetDerivativeOrder!==j+1||op.sPolynomialPower!==0||
      !['v','gamma','psi','betaOverEpsilon'].every(k=>root(G,op.componentBounds?.[k])))
      fail('The complete original five-map input derivative and component norm are required.');
    const source=['P','Jtheta','Jz'].map(k=>C.norm(old.defects?.[k]));
    if(source.some(f=>f.weight!=='1'||f.pole!==0))fail('The actual new P/J must already be complete scalar-defect norms.');
    const combined=C.add(...source),fields=Object.fromEntries(['v','gamma','psi','beta'].map(k=>{
      const f=C.scale(combined,op.componentBounds[k==='beta'?'betaOverEpsilon':k],k==='beta'?'1':'0');
      return [k,{...f,weight:'zeta',sourceKernelAndTargetDerivativesRetained:true}];
    }));
    return {order:j,fields,inputOrder:j+1,allThreeFreshInputNorms:source,combinedInput:combined,
      fixedOperator:copy(op),radialExtraEpsilonRetained:true,noAddedSPower:true};
  });
  return {schema:'MathScope.N6.OriginalFixedFiveMapClassProducts/1',order:m,rows,work:C.work(),
    proof:'The original full operator constant multiplies the maximum of all three target through-(m+1) norms. Their positive sum safely bounds that maximum, with the least epsilon exponent and largest S degree retained. The fixed compact kernel supplies zeta; beta retains one additional epsilon.',
    allActualNewTargetsMustBeAuthenticated:true,sourceAuthenticated:false,actualCurrentInputClassCertified:false,
    originalProp9_5Certified:false,completeN6:false};
}
