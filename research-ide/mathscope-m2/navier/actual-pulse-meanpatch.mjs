/** Actual unmodified N3 Imean field, with its physical scales kept symbolic. */
import {iadd,isub,ineg,imul,idiv,iscale,ipow,ipower,ilog,iexp,point,nextUp,nextDown,maxabs} from '../../mathscope-m1/navier/numerics.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';
import {ACTUAL_PULSE_BINDINGS} from './actual-pulse-source.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const bounded=(x,name,lo,hi)=>{if(!Number.isFinite(x)||x<lo||x>hi)fail(name+' is outside the actual mean-patch observation domain.');return x;};
const square=a=>a[0]<=0&&a[1]>=0?[0,nextUp(Math.max(a[0]*a[0],a[1]*a[1]))]:[Math.max(0,nextDown(Math.min(a[0]*a[0],a[1]*a[1]))),nextUp(Math.max(a[0]*a[0],a[1]*a[1]))];
const factorial=n=>n<2?1:n*factorial(n-1);

/** Small outward multivariate Taylor algebra. Coefficients are D^alpha/alpha!. */
function algebra(order){
  const indices=[];for(let n=0;n<=order;n++)for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++)indices.push([a,b,n-a-b]);
  const key=a=>a.join(','),lookup=new Map(indices.map((a,i)=>[key(a),i]));
  const zero=()=>indices.map(()=>point(0));
  const constant=x=>{const z=zero();z[0]=Array.isArray(x)?x:point(x);return z;};
  const variable=(x,j)=>{const z=constant(x),a=[0,0,0];a[j]=1;z[lookup.get(key(a))]=point(1);return z;};
  const add=(a,b)=>a.map((x,i)=>iadd(x,b[i])),neg=a=>a.map(ineg),sub=(a,b)=>add(a,neg(b)),scale=(a,b)=>a.map(x=>iscale(x,b));
  function mul(a,b){const z=zero();for(let i=0;i<indices.length;i++)for(let j=0;j<indices.length;j++){const k=indices[i].map((x,d)=>x+indices[j][d]),n=lookup.get(key(k));if(n!==undefined)z[n]=iadd(z[n],imul(a[i],b[j]));}if(a===b)z[0]=square(a[0]);return z;}
  function power(a,exponent){
    const e=Array.isArray(exponent)?exponent:point(exponent),base=a[0];if(!(base[0]>0))fail('A positive source base is needed for a real power.');
    const w=scale(a,idiv(point(1),base));w[0]=point(0);let result=constant(1),wk=constant(1),binomial=point(1);
    for(let k=1;k<=order;k++){wk=mul(wk,w);binomial=idiv(imul(binomial,isub(e,point(k-1))),point(k));result=add(result,scale(wk,binomial));}
    return scale(result,ipower(base,e));
  }
  return {indices,lookup,zero,constant,variable,add,sub,scale,mul,power};
}

function computeJets(y,eta,s,order){
  const A=algebra(order),h=sourceExponentContract().binary64Enclosure,lambda=[0,2**-1000],D=isub(point(.5),h),rho=ipower(imul(s,iexp(y)),.5),Z=imul(eta,ipower(s,D)),T=imul(s,isub(point(1),square(eta)));
  const z=A.variable(Z,1),t=A.variable(T,2),r=A.variable(rho,0),sj=A.constant(s),L=isub(point(1),iscale(imul(h,square(eta)),2));
  // The center is parameterized by (s,eta): T=s(1-eta²), Z=eta*s^D.
  // Thus f(center)=0 exactly; only nonconstant Taylor coefficients are solved.
  for(let i=1;i<A.indices.length;i++){
    if(A.indices[i][0]!==0){sj[i]=point(0);continue;}
    const f=A.sub(A.sub(sj,A.mul(A.mul(z,z),A.power(sj,iscale(h,2)))),t);
    sj[i]=ineg(idiv(f[i],L));
  }
  const etaJet=A.mul(z,A.power(sj,ineg(D)));etaJet[0]=eta;
  const reciprocal=A.power(A.add(A.constant(1),A.mul(etaJet,etaJet)),-1);
  const F=A.mul(A.mul(A.power(r,ineg(iadd(point(2),iscale(lambda,2)))),A.power(sj,isub(lambda,h))),reciprocal);
  const V=A.mul(r,F),radial=A.scale(A.power(r,-1),-1);
  // Tighten the value using the independent profile-coordinate expression.
  const f=idiv(point(1),iadd(point(1),square(eta))),E=imul(f,iexp(ineg(imul(iadd(point(.5),lambda),y))));
  F[0]=imul(imul(f,ipower(s,ineg(iadd(point(1),h)))),iexp(ineg(imul(iadd(point(1),lambda),y))));
  V[0]=imul(rho,F[0]);
  return {A,F,V,radial,E,sj,etaJet,rho,Z,T,L,h,lambda,D};
}

export function actualMeanPatchDefinitions(){
  return {
    sourceProfile:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,sourceBindings:structuredClone(ACTUAL_PULSE_BINDINGS),
    domain:{patch:'Imean',X:'X0Imean*exp(y)',yOpen:['0','5'],closedObservationSubset:[.25,4.75],etaClosed:[-1,1],sClosed:['1/2','2'],sDefinition:'q/Q',localOnly:true},
    exact:{
      X0:'XR*exp(T+2+60*BOuter-8)',BOuter:'1000*T',
      logKmean:'(3/2)*T-7/10-lambda/2-(1/2+lambda)*(60*BOuter-8)',
      logKmeanCollected:'-(59997/2)*T+33/10+(15/2-60000*T)*lambda',
      reflectionIdentity:'sigma(t)+sigma(1-t)=1; integral_0^1 sigma(t)dt=1/2',
      stageLogIncrements:['-1/5','-T/2','-1/2-lambda/2','-(1/2+lambda)*(60*BOuter-8)'],
      E:'Kmean*(1+eta^2)^(-1)*exp(-(1/2+lambda)*y)',U:'0',
      rhoR:'R/sqrt(2*X0Imean)=sqrt(s)*exp(y/2)',Fscale:'Kmean/sqrt(2*X0Imean)',
      F:'Fscale*s^(-1-h)*(1+eta^2)^(-1)*exp(-(1+lambda)*y)',G:'0',
      slowCoordinates:'Z=eta*s^(1/2-h); T_chart=s*(1-eta^2); T_chart=s-Z^2*s^(2h)',
      slowFormula:'F/Fscale=rhoR^(-2-2*lambda)*s^(lambda-h)/(1+Z^2*s^(-1+2h))',
      M:'eta*mConst',mConst:'XR*exp(1)*(4+integral_0^T exp(w)*4*(1-sigma(log(1+w)/Md))dw)',
      mConstBounds:['4*XR*exp(1)','4*XR*exp(T+1)'],
      radialV0:'-mConst',radialIdentity:'-(2D*eta^2+1-eta^2)*mConst/(1-2h*eta^2)=-mConst',
      b:'-epsilon*mConst/R',radialScale:'epsilon*mConst/sqrt(2*X0Imean)',
      shear:'a=v_s=2+2*lambda; b_s=0',normal:'N=(-1,0), K=(0,-1)',
      lambda0:'2*F*sqrt(lambda)',c0:'-sqrt(lambda)',
      normalizedPositiveFactors:{Fscale:'positive',mConst:'positive',lambda:'positive',h:'positive'},
      physicalScalesAreNumbers:false
    },
    sourceMeanPatchFieldsConstructed:true,
    backgroundAgreement:{equation:'5.44',scope:'Restriction of the eventual Proposition 5.5 background to the preserved mean patch; this does not construct its still missing positive-order fields elsewhere.'},
    cumulativeStressEvaluated:false,actualPulseIntegrated:false,wholeAnnulusPhaseCertified:false
  };
}

/** Actual N3 local field and order <=3 slow jets, normalized by explicit nonzero scales. */
export function evaluateActualMeanPatchJet(input={}){
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);
  const known=['sourceProfile','y','eta','s','order'];for(const k of Object.keys(input))if(!known.includes(k))fail('Unknown actual mean-patch input: '+k);
  const y=bounded(input.y??2.5,'y',.25,4.75),eta=bounded(input.eta??.25,'eta',-1,1),s=bounded(input.s??1,'s',.5,2),order=input.order??3;
  if(!Number.isSafeInteger(order)||order<1||order>3)fail('The actual source slow-jet order is 1, 2 or 3.');
  const out=computeJets(point(y),point(eta),point(s),order),rows=out.A.indices.map((alpha,i)=>{
    const factor=alpha.reduce((p,n)=>p*factorial(n),1),rPower=alpha[0];
    return {multiIndex:alpha,variables:['rhoR','Z','T_chart'],rawDerivative:true,
      normalizedFInterval:iscale(out.F[i],factor),normalizedVInterval:iscale(out.V[i],factor),normalizedRadialInterval:iscale(out.radial[i],factor),GInterval:[0,0],
      restoreFScale:rPower?'Fscale*(2*X0Imean)^(-'+rPower+'/2)':'Fscale',
      restoreVScale:rPower?'Kmean*(2*X0Imean)^(-'+rPower+'/2)':'Kmean',
      restoreRadialScale:rPower?'epsilon*mConst*(2*X0Imean)^(-'+(rPower+1)+'/2)':'epsilon*mConst/sqrt(2*X0Imean)',
      sourcePath:'result.results.meanPatch.jets['+i+']',sourceHash:PINNED_N3.inputs.assembly.sha256
    };
  });
  return {
    schema:'MathScope.ActualMeanPatchSlowJet/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    coordinateFrame:'BAND_CHART_Q_FIXED',restoredQuantitiesArePhysicalCartesian:false,
    input:{y,eta,s,order},coordinates:{rhoRInterval:out.rho,ZInterval:out.Z,TChartInterval:out.T,XExact:'X0Imean*exp('+y+')',RExact:'sqrt(2*X0Imean)*sqrt('+s+')*exp('+y+'/2)'},
    normalizedValues:{EOverKmean:out.E,FOverFscale:out.F[0],VOverKmean:out.V[0],bOverRadialScale:out.radial[0],G:[0,0]},jets:rows,
    implicitCoordinateDenominator:out.L,parameterEnclosures:{h:out.h,lambda:out.lambda,strictPositiveBoth:true,zeroIsEnclosureEndpointOnly:true},
    exactScales:actualMeanPatchDefinitions().exact,
    arithmetic:'Outward binary64 interval Taylor coefficients with exp/log Taylor remainder bounds; raw derivatives restored with factorials.',
    normalization:'rhoR=R/sqrt(2*X0Imean); R derivatives multiply the displayed jet by (2*X0Imean)^(-r/2). No positive physical coefficient is rounded to zero.',
    actualSourceRestriction:true,radialVelocityExactlyZero:false,cumulativeStressEvaluated:false,actualPulseIntegrated:false,globalCertification:false
  };
}

/** Uniform finite third-jet majorant of the actual normalized mean-patch field. */
export function boundActualMeanPatchJets(order=3){
  if(!Number.isSafeInteger(order)||order<1||order>3)fail('The bounded slow-jet order is 1, 2 or 3.');
  const out=computeJets([0,5],[-1,1],[.5,2],order),perDerivative=out.A.indices.map((alpha,i)=>{
    const factor=alpha.reduce((p,n)=>p*factorial(n),1);return {multiIndex:alpha,F:iscale(out.F[i],factor),V:iscale(out.V[i],factor),bNormalized:iscale(out.radial[i],factor),G:[0,0]};
  });
  const maxF=Math.max(...perDerivative.map(r=>maxabs(r.F))),maxV=Math.max(...perDerivative.map(r=>maxabs(r.V))),maxB=Math.max(...perDerivative.map(r=>maxabs(r.bNormalized)));
  return {schema:'MathScope.ActualMeanPatchUniformJetBound/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    domain:{y:[0,5],eta:[-1,1],s:[.5,2]},order,perDerivative,
    normalizedBounds:{FMax:maxF,VMax:maxV,bMax:maxB,FLowerExact:'2^-19',FUpperExact:'4'},
    lowerProof:'f>=1/2, s^(-1-h)>=1/4, exp(-(1+lambda)*y)>=exp(-10)>3^-10; (8*3^10)<2^19.',
    uniformOverEntireBox:true,usesFiniteSampling:false,coefficientNormalizationRequired:true,
    actualFScale:'Kmean/sqrt(2*X0Imean)',actualBScale:'epsilon*mConst/sqrt(2*X0Imean)',
    actualWholeAnnulusBound:false,completedBackgroundBound:false,pass:out.L[0]>0&&[maxF,maxV,maxB].every(Number.isFinite)&&8*3**10<2**19};
}
