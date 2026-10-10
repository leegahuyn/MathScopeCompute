/** The original two signs in one slow box, built from the actual completed
 * source. Every field, frame, Volterra coefficient and H integrand retains
 * its body. A finite active band is distinguished from the all-band theorem.
 */
import {prepareActualCompletedBackgroundC2,assertActualCompletedBackgroundC2,actualBackgroundSymbolicPrefix,actualBackgroundDyadicPrefix} from './actual-residual-order-induction-background.mjs';
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {actualStressDirectionBounds} from './actual-stress-direction-bounds.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const certificates=new WeakMap();
const bindingData=r=>JSON.stringify({sourceProfile:r.sourceProfile,parameterExpressionSHA256:r.parameterExpressionSHA256,coordinates:r.coordinates,chart:r.chart,fields:r.fields,leadingFields:r.leadingFields,frozen:r.frozen,geometry:r.geometry,cutoffs:r.cutoffs,constants:r.constants,families:r.families,roots:r.roots,scope:r.scope,band:r.band,direction:r.direction});
const validInput=input=>{if(!input||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use an original source pulse request.');for(const k of Object.keys(input))if(!['sourceProfile','anchorOrder','ellExact','maxNodes'].includes(k))fail('INVALID_INPUT','Actual source functions and operator constants are not caller inputs: '+k);};

function originalCutoffs(G,v,Ls,r0){
  const q=(n,d=1)=>G.q(n,d),xi=G.fresh('actual_H_transverse_coordinate'),t=G.div(xi,r0),abs=G.sqrt(G.pow(t,2));
  const bump=G.choose(abs,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),abs))),G.zero),mass=G.integral(G.pow(bump,2),xi,G.neg(r0),r0);
  const psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))));
  return {xi,chi:bump,transverseMass:mass,psi,
    transverse:{definition:'b(xi/r0), b=1 on |t|<=1/4; b=sigma(3/2-2|t|) on 1/4<|t|<3/4; zero otherwise',massBounds:[G.div(r0,q(2)),G.mul(q(2),r0)],massNormalizedToOne:false},
    longitudinal:{definition:'sigma(20*v/Ls-4)*sigma(16-20*v/Ls)',support:['Ls/5','4*Ls/5'],plateau:['Ls/4','3*Ls/4'],originalRequiredPlateau:['3*Ls/10','7*Ls/10'],originalOpenSupport:['Ls/6','5*Ls/6']}};
}

/** This routine accepts source identity and a finite representation budget;
 * it never accepts a bound, target, field or completion predicate. */
export function prepareActualCovarianceOperator(input={},context={}){
  validInput(input);const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);const maxNodes=input.maxNodes??3000000;
  if(!Number.isSafeInteger(maxNodes)||maxNodes<1||maxNodes>8000000)fail('INVALID_INPUT','Choose a finite positive node budget of at most eight million.');
  if(input.ellExact!==undefined&&input.anchorOrder!==undefined)fail('INVALID_INPUT','Choose an actual arbitrary dyadic integer or an efficient canonical anchor, not both.');
  let anchorOrder=input.ellExact===undefined?input.anchorOrder??1:null,ellExact=null,order;
  if(anchorOrder!==null){if(!Number.isSafeInteger(anchorOrder)||anchorOrder<1)fail('INVALID_INPUT','Use a positive actual canonical cutoff anchor.');if(anchorOrder>8)fail('RESOURCE_LIMIT','This finite source graph budget supports canonical anchors through eight; no omitted coefficient is replaced by zero.');order=anchorOrder+3;}
  else{
    if(typeof input.ellExact!=='string'||!/^[0-9]+$/.test(input.ellExact)||input.ellExact.length>2048)fail('INVALID_INPUT','ellExact is a positive exact integer string.');
    const integerEll=BigInt(input.ellExact);if(integerEll<1n)fail('INVALID_INPUT','The dyadic integer is positive.');
    if(integerEll>128n||integerEll>BigInt(maxNodes))fail('RESOURCE_LIMIT','The conservative actual all-band prefix exceeds this finite derivative/node budget. No missing coefficient or H column was set to zero.');
    ellExact=String(integerEll);order=Math.max(3,Number(integerEll));
  }
  context.checkCancelled?.();
  // The band prefix appends real source functions and fresh coordinates.
  // A fresh authenticated background keeps repeated and interleaved requests
  // independent; reusing a mutable G would change root IDs and replay hashes.
  const background=prepareActualCompletedBackgroundC2({sourceProfile,order,maxNodes},context);assertActualCompletedBackgroundC2(background);
  const band=ellExact===null?actualBackgroundSymbolicPrefix(background,{anchorOrder,derivativeOrder:2,dyadicBand:true},context):actualBackgroundDyadicPrefix(background,{ellExact,derivativeOrder:2},context),direction=actualStressDirectionBounds({sourceProfile},context);
  if(!background.pass||!direction.pass||background.program.parameterExpressionSHA256!==direction.parameterExpressionSHA256)fail('INVALID_SOURCE_CONSTRUCTION','The actual C2 field and leading-frame direction must have the same pinned source.');
  const G=new ActualCovarianceExpressions(background.G,{maxNodes,checkCancelled:context.checkCancelled}),q=(n,d=1)=>G.q(n,d),powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),{dot,mul}=covarianceMatrixAlgebra(G);
  const h=G.parameter('h'),A=G.add(q(1,2),h),D=G.sub(q(1,2),h),Renv=G.parameter('C12EnvelopeR'),kappa=G.parameter('directionalMarginKappa'),u=G.div(q(2),kappa);
  const R=G.fresh('actual_H_slow_R'),Z=G.fresh('actual_H_slow_Z'),T=G.fresh('actual_H_slow_T'),theta=G.fresh('actual_H_angle'),v=G.fresh('actual_H_pulse_v');
  const Xrep=G.fresh('actual_H_representative_X'),etaRep=G.fresh('actual_H_representative_eta'),sRep=G.fresh('actual_H_representative_s');
  const sVariable=G.fresh('actual_H_chart_s'),chartBody=G.sub(G.sub(sVariable,G.mul(G.pow(Z,2),powReal(sVariable,G.mul(q(2),h)))),T);
  const chartSystem=G.defineMonotoneSystem({name:'ActualSourceBandChartInverse',variable:sVariable,parameters:[Z,T],body:chartBody,left:q(1,2),right:q(2),derivativeLower:q(1,2),derivativeUpper:G.one,
    endpointProof:'Domain is the image of (s,eta) in [1/2,2]x[-1,1] under Z=s^D*eta,T=s*(1-eta^2). The actual root is s; opposite endpoint signs follow from F_s>=1-8h>1/2 throughout the bracket.',
    sourceSmallness:'The unchanged pinned source has 0<h<1/16.',numericOracle:false});
  const s=G.monotoneRoot(chartSystem,[Z,T]),X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,powReal(s,D)),epsilon=powReal(band.Q,h),qActual=G.mul(band.Q,s),coordinates=[R,Z,T];
  const atProfile=body=>G.simultaneousSubstitute(body,[band.coordinates.q,band.coordinates.X,band.coordinates.eta],[qActual,X,eta]);
  const fieldBodies={F:G.mul(powReal(s,G.neg(G.add(A,q(1,2)))),atProfile(band.roots.profileAngularVelocity)),G:G.mul(powReal(s,G.neg(A)),atProfile(band.roots.axialNormalized)),b:G.mul(epsilon,powReal(s,q(-1,2)),atProfile(band.roots.radialNormalized))};
  const fields=Object.fromEntries(Object.entries(fieldBodies).map(([name,body])=>[name,G.share(body,coordinates,'ActualCovarianceCompleted_'+name)]));
  const leadingFBody=G.mul(powReal(s,G.neg(G.add(A,q(1,2)))),G.simultaneousSubstitute(background.prepared.records[0].global.F,[band.coordinates.X,band.coordinates.eta],[X,eta]));
  const leadingGBody=G.mul(powReal(s,G.neg(A)),G.simultaneousSubstitute(background.prepared.records[0].global.U,[band.coordinates.X,band.coordinates.eta],[X,eta]));
  const leadingFields={F:G.share(leadingFBody,coordinates,'ActualCovarianceLeading_F'),G:G.share(leadingGBody,coordinates,'ActualCovarianceLeading_G')};
  const Rrep=G.sqrt(G.mul(q(2),sRep,Xrep)),Zrep=G.mul(powReal(sRep,D),etaRep),Trep=G.mul(sRep,G.sub(G.one,G.pow(etaRep,2))),atRep=body=>G.simultaneousSubstitute(body,coordinates,[Rrep,Zrep,Trep]);
  const F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R)),g0=[G.mul(Rrep,FR0),GR0],gabs=G.sqrt(dot(g0,g0)),N=g0.map(x=>G.div(x,gabs)),K=[G.neg(N[1]),N[0]];
  const lambda0=G.sqrt(G.neg(G.mul(q(2),F0,N[0],G.add(gabs,G.mul(q(2),F0,N[0]))))),c0=G.div(lambda0,G.mul(q(2),F0,N[0]));
  const ell=band.ell,S=G.pow(ell,2),k=G.ceiling(G.inv(G.sqrt(epsilon))),Tg=G.add(q(4),G.sqrt(q(2))),r0=q(1,1n<<34n),logTwo=G.log(q(2));
  const paletteQuotient=G.div(G.sub(G.mul(G.add(G.one,h),ell,logTwo),G.mul(q(2),G.log(ell))),G.log(Tg)),paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient))),ci=G.mul(powReal(Tg,paletteIndex),powReal(band.Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci);
  const Bs=G.sqrt(G.div(lambda0,G.mul(epsilon,G.pow(k,2),G.pow(G.sqrt(G.add(G.one,G.pow(u,2))),3)))),cutoffs=originalCutoffs(G,v,Ls,r0),Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),haarFactor=G.mul(q(1,2),Dgeom,ci,cutoffs.transverseMass);
  const Bnorm=G.add(q(1n<<128n),G.pow(Renv,4096),...['FGErrorConstant','bTotalConstant','FTotalConstant','GTotalConstant'].map(name=>background.roots[name]),background.chart.operatorA,background.chart.operatorB);
  if(G.freeCoordinates(Bnorm).size)fail('INVALID_SOURCE_CONSTRUCTION','The uniform source norm must not depend on a display anchor or representative.');
  const matrixNorm=G.mul(G.pow(Bnorm,256),G.pow(G.add(G.one,k),8),G.pow(G.add(G.one,Ls),8));
  const parameters=[R,Z,T,Xrep,etaRep,sRep],families=[];
  for(const sign of [1,-1]){
    context.checkCancelled?.();const beta=K.map((x,j)=>G.mul(Bs,G.sub(x,G.div(G.mul(q(sign),u,N[j]),G.mul(Ls,gabs))))),pTilde=G.mul(Rrep,beta[0]),pz=beta[1],scaledP=G.mul(k,pTilde),rounded=G.neg(G.ceiling(G.neg(G.add(scaledP,q(1,2))))),fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one),nonzero=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),p=G.div(nonzero,k),x0=G.mul(q(sign,2),Bs,u);
    const H=G.add(G.mul(p,fields.F),G.mul(pz,fields.G)),HR=G.derivative(H,R),HZ=G.derivative(H,Z),HT=G.derivative(H,T),phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,H));
    const frame=actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign});
    const integrand=G.sub(frame.reference.lambda,frame.reference.dref),time=G.fresh('actual_H_log_P_time'),logP=G.integral(G.substitute(integrand,v,time),time,G.div(Ls,q(2)),v),P=G.exp(logP);
    const system=G.defineCovarianceVolterra({name:'ActualSourceHomogeneousPulse_'+(sign===1?'plus':'minus'),variable:v,parameters,matrix:frame.wMatrix,normUpper:matrixNorm,length:Ls}),w=[0,1].map(j=>G.covarianceValue(system,j,v,parameters)),z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x])).map(r=>r[0]),x=t[0];
    const Htheta=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),x,t[1]),v,G.zero,Ls)),Hz=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),x,t[2]),v,G.zero,Ls)),mass=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),G.pow(x,2)),v,G.zero,Ls));
    const eikonalRemainder=G.add(G.mul(epsilon,v,G.sub(HT,G.mul(fields.G,HZ))),G.mul(fields.b,frame.n[0]));
    families.push({sign,carrier:{pTilde,p,pz,x0,roundedInteger:nonzero,roundingErrorUpper:G.inv(k),nonzeroAngularInteger:true},phase,phaseSpeed:H,phaseDerivatives:{R:HR,Z:HZ,T:HT},frame,system,w,z,t,logP,P,
      initial:{w:[G.one,G.zero],z:[G.substitute(P,v,G.zero),G.zero],midpointReferenceEnvelope:G.one,actualAmplitudeMidpointSetToOne:false},
      covariance:{theta:Htheta,z:Hz,mass,normalizedRows:[G.neg(G.div(G.add(G.mul(N[0],Htheta),G.mul(N[1],Hz)),G.mul(G.neg(c0),G.sqrt(G.add(G.one,G.pow(u,2))),mass))),G.div(G.add(G.mul(K[0],Htheta),G.mul(K[1],Hz)),G.mul(u,mass))]},
      fullEikonalRemainder:eikonalRemainder,fullEikonalRemainderSetToZero:false,
      representation:'Exact ordered-integral limit with an explicit source-bound factorial tail; finite terms are not identified with the solution.'});
  }
  const roots={sourceNorm:Bnorm,volterraMatrixNorm:matrixNorm,Q:band.Q,ell,S,epsilon,k,Ls,ci,haarFactor,...Object.fromEntries(families.flatMap(f=>[['Htheta_'+f.sign,f.covariance.theta],['Hz_'+f.sign,f.covariance.z],['mass_'+f.sign,f.covariance.mass]]))};
  const result={G,background,band,direction,sourceProfile,parameterExpressionSHA256:background.program.parameterExpressionSHA256,coordinates:{R,Z,T,theta,v,Xrep,etaRep,sRep},
    chart:{system:chartSystem,s,X,eta,qActual,domain:'Image of [s=1/2..2, X=Xa/2..2Xb, eta=-1..1]; tau>=0. Comparisons use profile-coordinate paths, not unproved convexity of this slow image.',
      representativeDomain:{X:['Xa','Xb'],eta:['-1','1'],s:['1/2','2']},
      certifiedNearbySlowPoint:'For perturbation conclusions the slow point is in the same selected box, at slow Euclidean distance<=4/S^3 from its frozen representative. The two points are not arbitrary independent choices.',
      enlargedDomainDoesNotExtendFrozenRayleighLowerBounds:true},
    fields,leadingFields,frozen:{F0,FR0,GR0,g0,gabs,N,K,c0,lambda0,Rrep,Zrep,Trep,orderZero:true},
    geometry:{ell,S,k,epsilon,Q:band.Q,Tg,paletteIndex,ci,Ls,r0,Dgeom,haarFactor,lengthRatioBounds:[G.mul(q(2),r0),G.mul(q(2),r0,Tg)],
      rectangleBasis:[[G.one,G.sub(G.one,G.sqrt(q(2)))],[G.sub(G.sqrt(q(2)),G.one),G.one]],
      haar:'Normalized Haar measure under the integer cover has no extra det(J)^i multiplicity. Both signs are rectangles of one slow box.',angularAverage:q(1,2),transverseIndependentAmplitude:true},
    cutoffs,constants:{h,A,D,Renv,kappa,u,Bs,Bnorm,matrixNorm},families,roots,
    scope:{actualCompletedSourceCoefficientsBound:true,originalDyadicBand:true,generalRepresentativeAndSlowPointFunctions:true,actualMovingNormalAndBasisIncluded:true,
      actualTwoSignHIntegrandsConstructed:true,exactVolterraLimitDefined:true,candidateVolterraNormRetained:true,sourceNormTailProducerIncluded:false,
      numericalWholeHEnclosure:false,displayBandProvedBelowUniformQStar:false,actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,globalEquation730Certified:false,originalN506Complete:false}};
  result.program=G.pack(roots,{schema:'MathScope.ActualCovarianceSourceOperator/1',sourceProfile,parameterExpressionSHA256:result.parameterExpressionSHA256,
    coordinates:result.coordinates,chart:result.chart,fields,leadingFields,frozen:result.frozen,geometry:result.geometry,cutoffs,families,scope:result.scope,
    band:{anchorOrder,ellExact,selectionKind:band.bandSelection.kind,dyadicBand:true,exactInactiveTail:band.exactInactiveTail,...(band.exactPlateau?{exactPlateau:band.exactPlateau}:{}),completeBackgroundOnDeclaredBand:true,equalsEveryBand:false,
      allBandImplementation:'actualBackgroundDyadicPrefix constructs actual n=1..ell and proves every n>=ell+1 inactive. The same operator code then constructs both source phases, constrained Volterra solutions and H integrals.',
      efficientAnchorImplementation:'actualBackgroundSymbolicPrefix uses the same canonical coefficients but proves a much larger exact dyadic band from one cutoff scale.',
      resourceLimitIsExplicitFailure:true},
    sourceNormDerivation:'Each bounded primitive and its reciprocal is below B. Nonzero integer p*k gives |n_tan|>=1/(k*B). Direct finite products, sums, first v derivatives and inverse powers in Aphi,B,Bleft,Bprime are bounded by B^256*(1+k)^8*(1+Ls)^8 in the induced infinity norm; this tail needs no eventual smallness assumption.',
    sourceC2:{fixedFiniteBlockOrders:[1,2],sameCanonicalSequence:true,wholeEnlargedAnnulus:true,originalRAndNUnchanged:true}});
  certificates.set(result,{G,nodeCount:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),volterra:JSON.stringify(G.covarianceSystems),data:bindingData(result),background});
  return result;
}

export function assertActualCovarianceOperator(result){
  const c=certificates.get(result);if(!c||result.G!==c.G||JSON.stringify(c.G.nodes.slice(0,c.nodeCount))!==c.nodes||!c.G.functionDefinitionsUnchanged(c.definitions)||JSON.stringify(c.G.covarianceSystems)!==c.volterra||bindingData(result)!==c.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged actual covariance source operator.');
  assertActualCompletedBackgroundC2(c.background);return true;
}
