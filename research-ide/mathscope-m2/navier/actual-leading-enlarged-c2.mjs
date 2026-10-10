/** Actual leading F0 C2 on the enlarged annulus.
 * The already proved [Xa,Xb] field bound is combined with the actual
 * unchanged inner collar and the explicit terminal heat solution.
 * No positive-order background or H completion flag is supplied here.
 */
import {actualLeadingAllOrderJets} from './actual-leading-all-order-jets.mjs';
import {actualStressDirectionBounds} from './actual-stress-direction-bounds.mjs';
import {prepareActualFullLeadingProgram,assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

/** Pure arithmetic import. This helper itself authenticates no source. */
export function importActualPositiveNorm(G,program,root){
  if(!G||!program?.nodes||!Number.isInteger(root)||!program.nodes[root])fail('INVALID_INPUT','Use a complete finite positive-norm expression.');
  const cache=new Map();
  function cp(id){
    if(cache.has(id))return cache.get(id);const {op,args}=program.nodes[id];let out;
    if(op==='rational')out=G.q(...args);else if(op==='source_parameter')out=G.parameter(args[0]);
    else if(op==='add')out=G.add(...args.map(cp));else if(op==='multiply')out=G.mul(...args.map(cp));
    else if(op==='inverse')out=G.inv(cp(args[0]));else if(op==='integer_power')out=G.pow(cp(args[0]),args[1]);
    else if(op==='exp')out=G.exp(cp(args[0]));else if(op==='log_positive')out=G.log(cp(args[0]));else if(op==='sqrt_positive')out=G.sqrt(cp(args[0]));
    else if(op==='maximum'&&typeof G.maximum==='function')out=G.maximum(...args.map(cp));
    else if(op==='ceiling'&&typeof G.ceiling==='function')out=G.ceiling(cp(args[0]));
    else fail('INVALID_INPUT','A bound must have explicit arithmetic operands: '+op);
    cache.set(id,out);return out;
  }
  return cp(root);
}

/** All ordinary total-order-two heat bounds are computed from the
 * original Gamma derivative moments and the exact Z=2d/X chain. */
export function actualExteriorHeatC2Arithmetic(){
  const H=[1,2,12],Z={value:2,y:2,eta:4,yy:2,yeta:4,etaeta:4};
  const heat={value:H[0],y:H[1]*Z.y,eta:H[1]*Z.eta,
    yy:H[2]*Z.y**2+H[1]*Z.yy,
    yeta:H[2]*Z.y*Z.eta+H[1]*Z.yeta,
    etaeta:H[2]*Z.eta**2+H[1]*Z.etaeta};
  // |b|=1+h<2 for F=Aext X^b H(Z). Derivatives of its
  // exact power prefactor are retained, rather than bounded as constants.
  const field={value:heat.value,y:2*heat.value+heat.y,eta:heat.eta,
    yy:4*heat.value+4*heat.y+heat.yy,
    yeta:2*heat.eta+heat.yeta,etaeta:heat.etaeta};
  const coefficient=4096,checks={positiveHeatMoments:H.every(v=>v>0),allSixTotalJetsPresent:Object.keys(field).length===6,
    actualPowerDerivativeRetained:field.yy>heat.yy&&field.yeta>heat.yeta,
    exactOuterHeightFactorCovered:2*Math.max(...Object.values(field))<coefficient};
  return {schema:'MathScope.ActualExteriorHeatC2Arithmetic/1',gammaDerivativeUpper:H,
    gammaDerivation:['H<=1','h(1+h)<=2','h(1+h)^2(2+h)<=12; 0<h<1'],
    heatArgumentJets:Z,heat,field,prefactorHeightUpper:'2*CSelected^2',coefficient,
    exteriorFormula:'F0=Aext*X^(-1-h)*H(2*(1-eta^2)/X)',
    domain:{X:['Xb','2*Xb'],eta:['-1','1'],XbLower:'1'},
    etaEndpointConvention:'Continuous one-sided derivatives, justified by the same positive Gamma integrals.',
    checks,pass:Object.values(checks).every(Boolean)};
}

let sourceFull=null;
export function actualLeadingEnlargedC2(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='sourceProfile'))fail('INVALID_INPUT','Only the immutable actual source profile may be selected.');
  const profile=assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);context.checkCancelled?.();
  const leading=actualLeadingAllOrderJets({sourceProfile:SOURCE_PROFILE_ID,radialOrder:2,etaOrder:2},context),direction=actualStressDirectionBounds({sourceProfile:SOURCE_PROFILE_ID},context);
  if(!sourceFull)sourceFull=prepareActualFullLeadingProgram({sourceProfile:SOURCE_PROFILE_ID,iterations:0},context);
  assertActualHeatLeading(sourceFull);
  const exterior=sourceFull.program.heat.exterior,field=direction.middle.fieldRows.find(r=>r.id==='entire_annulus_F_mixed2'),arithmetic=actualExteriorHeatC2Arithmetic();
  const checks={actualFiniteLeadingProducer:leading.pass,actualClosedAnnulusProducer:direction.pass,
    exactFieldBoundMatched:field?.upper==='R^70',actualHeatExteriorEtaIndependent:exterior.amplitudeEtaDerivative===sourceFull.G.zero,
    exactHeatExteriorStartsAtXb:exterior.start===sourceFull.heat.Xb&&exterior.terminalFoOneAfter===sourceFull.heat.Xb,
    actualHeatTailNotTruncated:sourceFull.program.heat.tailTruncated===false,
    sourceParameterIdentity:leading.parameterExpressionSHA256===profile.parameterExpressionSHA256&&direction.parameterExpressionSHA256===profile.parameterExpressionSHA256&&sourceFull.program.parameterExpressionSHA256===profile.parameterExpressionSHA256,
    exactHeatC2Chain:arithmetic.pass};
  if(!Object.values(checks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The actual enlarged-annulus leading premises did not match their source definitions.');
  const G=new ActualSourceExpressions(),q=(n,d=1)=>G.q(n,d),R=G.parameter('C12EnvelopeR'),C=G.parameter('CSelected'),Xa=G.parameter('Xa');
  const active=importActualPositiveNorm(G,leading.normProgram,leading.bounds.F0active.root),middleLog=G.pow(R,70),outerLog=G.mul(q(arithmetic.coefficient),G.pow(C,2));
  // For total order <=2, dX^2=X^-2(Dy^2-Dy). The factor8
  // bounds every signed falling-Euler coefficient and every lower order.
  const physicalFactor=G.mul(q(8),G.pow(G.add(G.one,G.inv(Xa)),2)),middle=G.mul(physicalFactor,middleLog),outer=G.mul(physicalFactor,outerLog),F=G.add(active,middle,outer);
  const U=importActualPositiveNorm(G,leading.normProgram,leading.bounds.U0.root),roots={F0OrdinaryC2:F,U0OrdinaryC2:U,F0ActiveOrdinaryC2:active,F0ClosedAnnulusLogC2:middleLog,F0ExteriorLogC2:outerLog,physicalXConversionFactor:physicalFactor,actualSourceR:R,actualSourceXa:Xa};
  return {schema:'MathScope.ActualLeadingEnlargedC2/1',profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:profile.parameterExpressionSHA256,
    normProgram:G.pack(roots,{schema:'MathScope.ActualLeadingEnlargedPositiveNormProgram/1'}),roots,
    bounds:{F0:{root:F,derivativeConvention:'ordinary physical X and ordinary eta, total order<=2',domain:{X:['Xa/2','2*Xb'],eta:['-1','1']}},
      U0:{root:U,derivativeConvention:'ordinary physical X and ordinary eta, each order<=2',domain:{X:['0','infinity'],eta:['-1','1']}}},
    regions:[{interval:['Xa/2','Xplus'],producer:'actualLeadingAllOrderJets',root:active,actualHeatI2Included:true},
      {interval:['Xa','Xb'],producer:'actualStressDirectionBounds.middle.fieldRows:entire_annulus_F_mixed2',root:middle,logNorm:'R^70',originalFastNSecondDerivativeRetained:true},
      {interval:['Xb','2*Xb'],producer:'actual terminal Gamma heat formula',root:outer,arithmetic}],
    actualExterior:{definition:exterior.sourceDefinition,originalStartRoot:exterior.start,originalAmplitudeRoot:exterior.amplitude,originalExponentRoot:exterior.exponent,originalHeatArgumentRoot:exterior.argument,
      heightMeaning:'The bound 2*C^2 applies to Aext*X^(-1-h), not to Aext alone.',
      heightProof:'Aext*X^(-1-h)=Etail/(sqrt(2X)*(1-rho))*(X/Xtail)^(-A). Etail<=Pstar<C, X>=Xb>=Xtail>1 and rho<1/2 imply the stated bound.',
      implementation:'actual-continuation-exact-heat.mjs:prepareActualFullLeadingProgram',positiveEtaIndependentAmplitude:true},
    coverage:'Xa/2<Xa<Xplus<Xb<2Xb; first two regions overlap. At every original join the exact smooth source jets agree.',
    physicalConversion:'dX=X^-1*Dy; dX^2=X^-2*(Dy^2-Dy), no term omitted. The first region already supplies ordinary physical derivatives.',
    checks,pass:true,sourceBindings:[...leading.sourceBindings],
    scope:{actualEnlargedAnnulusLeadingC2Bounded:true,actualFiniteDerivativesAndGammaTail:true,fieldSampleUsedAsWholeDomainBound:false,
      arbitraryGlobalF0AllOrders:false,completedPositiveOrderBackgroundBoundedHere:false,actualGeneralProjectedODEBuiltHere:false,
      actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false,newLeanKernelProof:false}};
}
