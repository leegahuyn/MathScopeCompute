/** Complete initial mean equations and their finite class demand.
 *
 * These kernels do not authenticate an input norm. The private adapter
 * supplies the full pre-Haar covariance, unchanged original stress and
 * derivative of the actual shifted pressure from the same current.
 */
import {radialBinomial,radialFactorial} from './source-radial-class-kernel.mjs';
import {radialCovarianceForceMajorant} from './source-pressure-class-kernel.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  root=(G,id)=>Number.isSafeInteger(id)&&!!G?.nodes?.[id],
  only=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))
    fail('Use only the specified complete input roots and finite derivative requests.');},
  total=a=>a.reduce((s,n)=>s+n,0);

export function originalInitialMeanResidualDemand(input={}){
  only(input,['order']);const m=natural(input.order??0,'Initial mean residual order');
  if(!Number.isSafeInteger(m+5))fail('The complete derivative demand exceeds its exact integer representation.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalInitialMeanResidualDemand/1',order:m,
    requiredPressureOrder:m+1,requiredCommonYCovarianceOrder:m+2,requiredPrimaryOrder:m+2,
    requiredBackgroundSlowOrder:m+5,requiredTargetWeightedOrder:m+3,requiredBackgroundClassOrder:m+1,
    tangentialCovarianceOrder:m+1,originalStressOrder:m+1,pressureDerivativeOrder:m+1,
    coordinates:['R','Z','T','Y0','Y1'],
    equations:{Etheta:'(partial_R+a*L+2/R)W_rtheta+epsilon*partial_Z W_thetaz-(partial_R+a*L+2/R)Sigma_theta',
      Ez:'(partial_R+a*L+1/R)W_rz+epsilon*partial_Z W_zz+epsilon*partial_Z p_m-(partial_R+a*L+1/R)Sigma_z'},
    pressureMeaning:'The complete original shifted pressure T0(g_r-rho*P), with its A0 remainder retained, before any temporal correction.',
    demandReason:'E_z uses one slow Z derivative of pressure; pressure order m+1 requires the full common-Y covariance through m+2.',
    unchangedBackgroundFlatResidualSeparate:true,nonzeroAngularResidualSeparate:true,
    noUnavailableSourceOrderAssumed:true,sourceAuthenticated:false};
}

export function exactCompleteInitialMeanResidual(G,input){
  only(input,['R','Z','T','Y','epsilon','radialFast','W','stress','pressureZ']);
  const {R,Z,T,Y,epsilon,radialFast:a,W,stress,pressureZ}=input,directions=[R,Z,T,...(Y??[])];
  if(!Array.isArray(Y)||Y.length!==2||directions.some(x=>G.nodes[x]?.op!=='coordinate')||new Set(directions).size!==5||
    !Array.isArray(stress)||stress.length!==2||
    [epsilon,a,W?.rtheta,W?.thetaz,W?.rz,W?.zz,...stress,pressureZ].some(x=>!root(G,x))||
    directions.some(x=>G.dependsOn(epsilon,x))||[Z,T,...Y].some(x=>G.dependsOn(a,x)))
    fail('Retain the five independent coordinates, fixed epsilon, original R-only fast multiplier, both complete stresses and full pressure derivative.');
  const vr=[G.one,G.sub(G.one,G.sqrt(G.q(2)))],L=f=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(f,y)))),
    Dr=f=>G.add(G.derivative(f,R),G.mul(a,L(f))),De=(f,e)=>G.add(Dr(f),G.div(G.mul(G.q(e),f),R)),
    rows=[{name:'Etheta',connection:2,radial:W.rtheta,axial:W.thetaz,stress:stress[0]},
      {name:'Ez',connection:1,radial:W.rz,axial:W.zz,stress:stress[1]}].map(row=>{
      const terms={covarianceSlowRadial:G.derivative(row.radial,R),covarianceFastRadial:G.mul(a,L(row.radial)),
        covarianceConnection:G.div(G.mul(G.q(row.connection),row.radial),R),covarianceAxial:G.mul(epsilon,G.derivative(row.axial,Z)),
        stressSlowRadial:G.derivative(row.stress,R),stressFastRadial:G.mul(a,L(row.stress)),
        stressConnection:G.div(G.mul(G.q(row.connection),row.stress),R),
        pressure:row.name==='Ez'?G.mul(epsilon,pressureZ):G.zero},
        value=G.sub(G.add(De(row.radial,row.connection),G.mul(epsilon,G.derivative(row.axial,Z)),
          ...(row.name==='Ez'?[terms.pressure]:[])),De(row.stress,row.connection));
      return {...row,terms,value};
    });
  return {schema:'MathScope.N6.ExactCompleteInitialMeanResidual/1',coordinates:{R,Z,T,Y},epsilon,radialFast:a,vr,
    W:{rtheta:W.rtheta,thetaz:W.thetaz,rz:W.rz,zz:W.zz},stress:[...stress],pressureZ,rows,
    roots:Object.fromEntries(rows.map(r=>[r.name,r.value])),
    fullOriginalStressDerivativeRetained:true,fullPressureDerivativeRetained:true,
    originalStressAuxiliaryIndependent:stress.every(s=>Y.every(y=>!G.dependsOn(s,y))),
    sourceAuthenticated:false};
}

/** Full five-coordinate multi-index Leibniz identities. In particular,
 * stress torus derivatives are retained before any source independence
 * identity is applied, and pressure is not replaced by its Haar mean.
 */
export function exactInitialMeanResidualJet(G,input,{orders,maxWork=100000}={}){
  if(!Array.isArray(orders)||orders.length!==5||orders.some(n=>!Number.isSafeInteger(n)||n<0)||
    !Number.isSafeInteger(total(orders))||!Number.isSafeInteger(maxWork)||maxWork<1||total(orders)+20>maxWork)
    fail('Retain the complete finite five-coordinate derivative and its work budget.','RESOURCE_LIMIT');
  const source=exactCompleteInitialMeanResidual(G,input),directions=[input.R,input.Z,input.T,...input.Y],m=total(orders);
  let work=0;const derivative=(body,multi)=>{
    for(let j=0;j<5;j++)for(let k=0;k<multi[j];k++){
      if(++work>maxWork)fail('The complete initial mean jet exceeded its work budget.','RESOURCE_LIMIT');
      body=G.derivative(body,directions[j]);
    }return body;
  },raise=(a,j)=>a.map((n,k)=>n+(j===k?1:0)),lower=(a,j)=>a.map((n,k)=>n-(k===0?j:0)),
    coefficients=Array.from({length:orders[0]+1},(_,j)=>({radialOrder:j,remainingOrders:lower(orders,j),
      binomial:String(radialBinomial(orders[0],j)),aJet:derivative(source.radialFast,[j,0,0,0,0]),
      inverseRadiusJet:G.mul(G.q((j%2?-1n:1n)*radialFactorial(j)),G.pow(input.R,-j-1))})),
    rows=source.rows.map(row=>{
      const terms=coefficients.map(c=>{
        const covarianceJet=derivative(row.radial,c.remainingOrders),stressJet=derivative(row.stress,c.remainingOrders),
          covarianceY=source.vr.map((_,j)=>derivative(row.radial,raise(c.remainingOrders,j+3))),
          stressY=source.vr.map((_,j)=>derivative(row.stress,raise(c.remainingOrders,j+3))),
          fast=G.mul(G.q(c.binomial),c.aJet,G.add(...source.vr.map((v,j)=>G.mul(v,G.sub(covarianceY[j],stressY[j]))))),
          connection=G.mul(G.q(c.binomial),G.q(row.connection),c.inverseRadiusJet,G.sub(covarianceJet,stressJet));
        return {...c,covarianceJet,stressJet,covarianceY,stressY,fast,connection};
      }),plain={covarianceRadial:derivative(row.radial,raise(orders,0)),stressRadial:derivative(row.stress,raise(orders,0)),
        axial:G.mul(source.epsilon,derivative(row.axial,raise(orders,1))),
        pressure:row.name==='Ez'?G.mul(source.epsilon,derivative(source.pressureZ,orders)):G.zero},
        direct=derivative(row.value,orders),decomposed=G.add(plain.covarianceRadial,G.neg(plain.stressRadial),plain.axial,plain.pressure,
          ...terms.flatMap(t=>[t.fast,t.connection])),
        identity=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000})(G.sub(direct,decomposed));
      return {name:row.name,connection:row.connection,terms,plain,direct,decomposed,identity};
    });
  return {schema:'MathScope.N6.ExactInitialMeanResidualJet/1',source,orders:[...orders],order:m,coefficients,rows,work,
    allRequestedCovarianceAndStressJetsRetained:true,requiredPressureOrder:m+1,sourceAuthenticated:false};
}

/** Positive full Leibniz envelopes for the initial pair, conditional on
 * actual norms supplied by the private source adapter. The covariance
 * and stress have epsilon order1; pressure has order1-kappa_s. The extra
 * epsilon multiplying its Z derivative is preserved before weakening.
 */
export function initialMeanResidualMajorants(G,input){
  only(input,['order','radiusBase','directPowerDerivativeBounds','covarianceNorm','stressNorm','pressureDerivativeNorm','maxWork']);
  const {order:m,radiusBase:B,directPowerDerivativeBounds,covarianceNorm:CW,stressNorm:CS,pressureDerivativeNorm:CP}=input,
    maxWork=input.maxWork??100000;
  natural(m,'Mean residual output order');natural(maxWork,'Mean residual majorant work budget');
  if([CW,CS,CP].some(id=>!root(G,id)||G.freeCoordinates(id).size||G.isq(id)&&G.fraction(id)[0]<0n))
    fail('Retain all three complete source-only nonnegative norm premises.');
  const radial=radialCovarianceForceMajorant(G,{order:m,radiusBase:B,directPowerDerivativeBounds,inputNorm:CW,maxWork}),
    I=radial.inverseSum,F=radial.fastSum,L=radial.originalLNorm,
    factors={covarianceTheta:G.add(G.q(2),G.mul(G.q(2),I),G.mul(L,F)),
      covarianceZ:G.add(G.q(2),I,G.mul(L,F)),stressTheta:G.add(G.one,G.mul(G.q(2),I)),stressZ:G.add(G.one,I)},
    fields={Etheta:{constant:G.add(G.mul(CW,factors.covarianceTheta),G.mul(CS,factors.stressTheta)),
      terms:{covariance:G.mul(CW,factors.covarianceTheta),stress:G.mul(CS,factors.stressTheta)}},
      Ez:{constant:G.add(G.mul(CW,factors.covarianceZ),G.mul(CS,factors.stressZ),CP),
        terms:{covariance:G.mul(CW,factors.covarianceZ),stress:G.mul(CS,factors.stressZ),pressure:CP}}};
  return {schema:'MathScope.N6.CompleteInitialMeanResidualMajorants/1',order:m,
    inputNorms:{covariance:CW,stress:CS,pressureDerivative:CP},radial,factors,fields,
    covarianceInputOrder:m+1,originalStressInputOrder:m+1,pressureInputOrder:m+1,
    outputEpsilonExponent:'1-kappa_s',originalPressureContributionExponent:'2-kappa_s',
    originalStressContributionExponent:'1',weight:'zeta',addedSPower:0,sourceAuthenticated:false,
    requiredPremises:['The actual complete four indicated W components have one common through-(m+1) weighted norm.',
      'Both original complete stresses have their actual through-(m+1) norm and no auxiliary Y dependence.',
      'The actual full shifted pressure has its through-(m+1) norm, so every order-m jet of partial_Z p is bounded.',
      'The original fixed radial coefficient has the displayed derivative bounds and M<=epsilon^(-kappa_s).',
      '0<epsilon<=1, 0<kappa_s<1, S_ref>=1 and delta_*=min(1,da,db)<=1.'],
    proof:[
      'For every mixed order<=m, the two covariance differential terms cost2, the cylindrical coefficient costs e*I_m, and the two-coordinate fast term costs sqrt(2)*F_m.',
      'The exact original stress has no Y dependence. Its differential and connection terms cost1+e*I_m; no a*L stress term is discarded without that source identity.',
      'The pressure term is epsilon*partial_Z p and retains every auxiliary mode. Its original epsilon exponent is2-kappa_s before safely weakening to1-kappa_s.',
      'Original covariance epsilon1 and stress epsilon1 can also be weakened to epsilon^(1-kappa_s). All coefficients and both sources remain in the actual equation.',
      'Increasing the polynomial S degree or delta_* pole to the maximum of the three inputs introduces no factor because S_ref>=1 and delta_*<=1.',
      'These are the initial tangential mean equations. The unchanged flat base residual and nonzero angular equations remain separate.']};
}
