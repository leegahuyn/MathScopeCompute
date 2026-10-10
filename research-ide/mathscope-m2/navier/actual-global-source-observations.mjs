/** Source-bound observations on the actual nonzero outer axial pulse.
 * Actual amplitude enclosures are imported from the pinned continuous integral
 * receipt. The M convolution and its parameter derivative keep the explicit
 * source remainders. This is neither an arbitrary pulse fixture nor a sampled
 * substitute for the still missing global integral/derivative family.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {iadd,isub,imul,idiv,iscale,point,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

export const ACTUAL_OUTER_PULSE_RECEIPT=Object.freeze({
  path:'research-ide/mathscope-m1/navier/followup-20261010-outer-reselection/actual-main-pulse-integral.json',
  sha256:'2308d3e30f39c44490cf42f7f07aabb5596fce62708b002cc05c3e6bbdfd61c5',
  sourceFormula:'R0(xi)=integral_0^xi sigma(50v)dv*(1-sigma(xi-10))',
  denominatorPowerOfTwo:88,
  Kb:{lowerNumerator:'75839183804020713387990725',upperNumerator:'75839184425573549482335905'},
  amplitude:{lowerNumerator:'312595415934009852251805703',upperNumerator:'312595417214974105690151796'},
  uniformEtaDomain:[-1,1],actualTotalSErrorAbsoluteUpper:'2^-200',
  scope:'Continuous whole-cell R0 integral plus the written same-source corrected total-S bridge; not a new Lean kernel execution.'
});
const intervalFromDyadic=v=>[nextDown(Number(v.lowerNumerator)/2**88),nextUp(Number(v.upperNumerator)/2**88)];
function exactBinary64(x){const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x,false);const bits=v.getBigUint64(0,false),exponent=Number((bits>>52n)&2047n),fraction=bits&((1n<<52n)-1n);let n=(exponent?(1n<<52n):0n)+fraction,d=1n,p=(exponent||1)-1023-52;if(p>=0)n<<=BigInt(p);else d<<=BigInt(-p);while(d>1n&&n%2n===0n){n/=2n;d/=2n;}return d===1n?String(n):String(n)+'/'+String(d);}

export function actualOuterPulseObservations({profileId=SOURCE_PROFILE_ID,eta=.25,xi=[.5,1,2,5,9]}={}){
  const source=assertSourceProfile(profileId);
  if(!Number.isFinite(eta)||Math.abs(eta)>1)throw Error('The actual pulse eta must lie in [-1,1].');
  if(!Array.isArray(xi)||xi.length<1||xi.length>16||xi.some(x=>!Number.isFinite(x)||x<1/50||x>10))throw Error('Provide one to sixteen actual pulse xi coordinates in [1/50,10].');
  const tiny=2**-1000,h=[0,tiny],lambda=[0,tiny],A=intervalFromDyadic(ACTUAL_OUTER_PULSE_RECEIPT.amplitude),e=point(eta),eta2=imul(e,e),D=isub(point(.5),h),L=isub(point(1),iscale(imul(h,eta2),2)),dd=isub(point(1),eta2),Jprime=idiv(iscale(e,2),iadd(point(1),eta2)),beta=isub(point(.5),lambda);
  const rows=xi.map((x,index)=>{
    const r0=isub(point(x),[nextDown(.01),nextUp(.01)]),R=imul(A,r0),mPrincipal=isub(idiv(R,beta),idiv(imul(lambda,A),imul(beta,beta))),m=iadd(mPrincipal,[-tiny,tiny]),mEta=[-tiny,tiny];
    const v=idiv(iadd(isub(iscale(imul(e,R),2),iscale(imul(imul(D,e),m),2)),isub(imul(imul(dd,Jprime),m),imul(dd,mEta))),L);
    return {index,xi:x,xiExact:exactBinary64(x),eta,XExactExpression:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{quotient:[{rational:exactBinary64(x)},{ref:'lambda'}]}]}}]},XExpression:'Xp*exp('+exactBinary64(x)+'/lambda)',XBinary64:null,sourceRegion:'ACTUAL_UNMODIFIED_OUTER_MAIN_PULSE',R0Interval:r0,amplitudeInterval:A,
      values:[{id:'U_over_E',interval:R,quantity:'U0/E0'},{id:'M_over_XE',interval:m,quantity:'M0/(X*E0)'},{id:'V_over_XE',interval:v,quantity:'V0/(X*E0)'}].map((v,j)=>({...v,value:(v.interval[0]+v.interval[1])/2,sourceField:'globalSource.outerObservations.rows['+index+'].values['+j+'].interval'})),
      meanDerivativeEnclosure:mEta,convolutionRemainderEnclosure:[-tiny,tiny],normalizationsAreActualPositiveSourceScales:true,actualUIsNonzero:R[0]>0};
  });
  return {
    schema:'MathScope.ActualOuterPulseObservations/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,
    input:{eta,xi:[...xi]},receipt:structuredClone(ACTUAL_OUTER_PULSE_RECEIPT),rows,
    definitions:{xi:'lambda*log(X/Xp)',Xp:'XR*exp(T+2+60*BOuter)',beta:'1/2-lambda',R:'Amp(eta)*R0(xi)',m:'M0/(X*E0)',mExpansion:'R/beta-lambda*R_xi/beta^2+r_m',VNormalized:'(2*eta*R-2*D*eta*m-d*m_eta+d*(2*eta/(1+eta^2))*m)/L'},
    errorDerivation:{source:'OUTER_DERIVATION.md section 7, equations (16)-(17)',rawConvolution:'|r_m| <= 65536*lambda^2+exp(16*T)*lambda^29*exp(-beta*y)',rawEtaDerivative:'|m_eta| <= exp(24*T)*lambda',simplifiedAbsoluteUpper:'2^-1000',checks:['The actual T=exp(1048576)+10 is greater than 128.','lambda=exp(-1000*T)<2^-4096, so 65536*lambda^2<2^-8176.','exp(16*T)*lambda^29=exp(-28984*T)<2^-8176.','Their sum is below 2^-8175<2^-1000.','exp(24*T)*lambda=exp(-976*T)<2^-1000.','On xi in [1/50,10], R0=xi-1/100 and R0Prime=1 exactly. The late correction bumps are outside this interval.'],hAndLambdaStrictlyPositive:true,zeroOnlyAnIntervalEndpoint:true},
    supportBinding:{afterActualI1Restoration:true,afterHeatBumps:true,loopIntervalAndI1DoNotOverlapPulse:true,completeU0M0AgreementWithOriginalOuter:true},
    scope:{actualSameProfilePositiveAxialValuesEnclosed:true,arbitrarySelectedEtaInFullClosedSourceInterval:true,ordinaryFieldJetsEvaluated:false,fullAxialPulseIntegralsEvaluated:false,preC12InnerFunctionEvaluated:false,globalBackgroundMomentCorrectionComplete:false,N4_04_Complete:false,N5GlobalGrowthComplete:false},
    sources:{assembly:source.inputs.assembly,outerDerivation:{path:'research-ide/mathscope-m1/navier/followup-20261010-outer-reselection/OUTER_DERIVATION.md',sha256:'ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81'}}
  };
}
