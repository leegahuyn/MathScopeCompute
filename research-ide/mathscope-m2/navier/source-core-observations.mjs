import {PINNED_CORE} from './source-core-data.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';
import {sourceBandParameters} from './source-geometry.mjs';
import {imul,iadd,iscale,ilog,iexp,point,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const fail=(message)=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const clone=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const c=a%b;a=b;b=c;}return a;};
const rat=(n,d=1n)=>{if(d===0n)fail('A source coordinate denominator is zero.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];};
const parse=s=>{if(typeof s!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(s))fail('An exact rational source coordinate is required.');const a=s.split('/');return rat(BigInt(a[0]),a[1]?BigInt(a[1]):1n);};
const str=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];
const mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]),div=(a,b)=>rat(a[0]*b[1],a[1]*b[0]),add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),eq=(a,b)=>a[0]*b[1]===b[0]*a[1],cmp=(a,b)=>{const x=a[0]*b[1]-b[0]*a[1];return x<0n?-1:x>0n?1:0;};
const exactQ=ell=>rat(1n,1n<<BigInt(ell));
const two=rat(2n),half=rat(1n,2n);
const floatRat=x=>{
  if(!Number.isFinite(x))fail('A finite display enclosure is required.');if(x===0)return rat(0n);
  const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,x);const bits=v.getBigUint64(0),negative=Boolean(bits>>63n),exponent=Number((bits>>52n)&2047n),fraction=bits&((1n<<52n)-1n),mantissa=exponent===0?fraction:fraction+(1n<<52n),power=(exponent===0?-1022:exponent-1023)-52;
  return power>=0?rat((negative?-mantissa:mantissa)<<BigInt(power)):rat(negative?-mantissa:mantissa,1n<<BigInt(-power));
};
/** Exact rational bounds are preserved; binary64 marks are directed enclosures only. */
export function exactCoreIntervalToBinary64(interval){
  const bound=(s,direction)=>{const r=parse(s),x=Number(r[0])/Number(r[1]);if(!Number.isFinite(x))fail('The pinned display interval exceeds the installed finite chart.');let y=direction<0?nextDown(x):nextUp(x);for(let i=0;i<8;i++){const order=cmp(floatRat(y),r);if(direction<0?order<=0:order>=0)return y;y=direction<0?nextDown(y):nextUp(y);}fail('Unable to enclose the source rational with directed binary64.');};
  return [bound(interval.lower,-1),bound(interval.upper,1)];
}
const phiRows=()=>PINNED_CORE.rows.filter(r=>r.quantity==='CE_over_sqrt_2X'&&r.radialDerivativeOrder===0);
const validEll=ell=>{if(!Number.isSafeInteger(ell)||ell<8||ell>900)fail('The installed chart observation range is ell=8..900.');return ell;};
const bandPair=ell=>{validEll(ell);const forward=ell<900;return {primary:ell,secondary:ell+(forward?1:-1),primaryT:parse(forward?'3/4':'3/2'),secondaryT:parse(forward?'3/2':'3/4')};};
const factorInterval=(T,power)=>{const h=sourceExponentContract().binary64Enclosure,exponent=iadd(point(Number(parse(power[0])[0])/Number(parse(power[0])[1])),iscale(h,Number(parse(power[1])[0])/Number(parse(power[1])[1])));return iexp(imul(exponent,ilog(point(Number(T[0])/Number(T[1])))));};
const scaleLedger=()=>({QVelocityExponent:['-1/2','-1'],TRadiusExponent:['1/2','0'],TChartVelocityExponent:['-1','-1'],restoreNormalizedExponent:['1','1'],sourceQExponent:['-1/2','-1'],CSelectedExponent:'-1',LambdaExponent:'-1/2',definition:'A=1/2+h; CSelected*Q^A*u_theta/R = T^(-A-1/2)*Phi',physicalIdentity:'Q^(-A)*sqrt(2*T*Y/Lambda)*T^(-A-1/2)*Phi/CSelected = (Q*T)^(-A)*sqrt(2*Y/Lambda)*Phi/CSelected'});
const exponentAdd=(a,b)=>a.map((x,i)=>str(add(parse(x),parse(b[i]))));
const covers=(a,b)=>Array.isArray(a)&&a.length===2&&a.every(Number.isFinite)&&a[0]<=b[0]&&a[1]>=b[1];
const intersects=(a,b)=>Math.max(a[0],b[0])<=Math.min(a[1],b[1]);
const corePin=()=>({profileId:SOURCE_PROFILE_ID,assembly:clone(PINNED_CORE.assembly),acceptedCore:clone(PINNED_CORE.acceptedCore),acceptedEvidenceEntry:clone(PINNED_CORE.acceptedEvidenceEntry),parameterExpressionSHA256:PINNED_CORE.parameterExpressionSHA256,profileEvidenceSHA256:PINNED_CORE.profileEvidenceSHA256,sourceInputs:clone(PINNED_CORE.sourceInputs)});

export function getPinnedCoreEvaluationRows({quantity='CE_over_sqrt_2X',derivativeOrder=0}={}){
  if(!Number.isInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>2)fail('The accepted receipt records radial derivative orders 0, 1 and 2 only.');
  const rows=PINNED_CORE.rows.filter(r=>r.quantity===quantity&&r.radialDerivativeOrder===derivativeOrder);if(rows.length!==5)fail('The requested normalized source quantity is not recorded in the accepted core receipt.');
  return {provenance:corePin(),domain:clone(PINNED_CORE.domain),rows:clone(rows),wholeProfileFieldEvaluator:false};
}

/** Actual eta-zero Phi intervals, evaluated in two overlapping source dyadic charts. */
export function getSourceCoreObservations({ell=16,sourceProfile=SOURCE_PROFILE_ID}={}){
  assertSourceProfile(sourceProfile);const pair=bandPair(ell),q=mul(exactQ(pair.primary),pair.primaryT),h=sourceExponentContract(),bands=[sourceBandParameters(pair.primary),sourceBandParameters(pair.secondary)];
  const samples=phiRows().map(source=>{
    const Y=parse(source.Y),phiInterval=exactCoreIntervalToBinary64(source.sameInfiniteCoreInterval),scaledR2Physical=mul(mul(two,q),Y),atAxis=Y[0]===0n;
    const chartPair=[{ell:pair.primary,T:pair.primaryT},{ell:pair.secondary,T:pair.secondaryT}].map(({ell,T},i)=>{
      const Q=exactQ(ell),lambdaR2=mul(mul(two,T),Y),factor=factorInterval(T,['-1','-1']),chartNormalizedVelocityInterval=imul(factor,phiInterval),restore=factorInterval(T,['1','1']),restoredNormalizedInterval=imul(restore,chartNormalizedVelocityInterval);
      return {ell,QExact:str(Q),TExact:str(T),ZExact:'0',RExact:atAxis?'0':`sqrt((${str(lambdaR2)})/Lambda)`,lambdaR2Exact:str(lambdaR2),restoredQExact:str(mul(Q,T)),restoredYExact:str(div(lambdaR2,mul(two,T))),restoredLambdaR2PhysicalExact:str(mul(Q,lambdaR2)),chartNormalizedVelocityDefinition:'CSelected*Q^A*u_theta/R',chartNormalizedVelocityInterval,chartScaleInterval:factor,restoreScaleInterval:restore,restoredNormalizedInterval,physicalScale:scaleLedger(),frozenLabels:{ell,covering:bands[i].covering.index,k:bands[i].carrier.k,epsilon:bands[i].epsilon,Sstar:bands[i].Sstar},atAxisAnalyticExtension:atAxis};
    });
    const sourcePhiInterval=clone(source.sameInfiniteCoreInterval),normalizedRoundTripIntervals=chartPair.map(c=>c.restoredNormalizedInterval);
    return {sourceIndex:source.sourceIndex,sourcePath:source.sourcePath,sourceHash:PINNED_CORE.acceptedCore.sha256,quantity:source.quantity,sourceY:source.Y,YDisplay:Number(Y[0])/Number(Y[1]),etaExact:'0',radialDerivativeOrder:0,sourcePhiInterval,sourcePhiDisplayEnclosure:phiInterval,sourceAnalyticErrorPositive:source.sourceAnalyticErrorPositive,analyticErrorIncluded:true,chartPair,normalizedRoundTripIntervals,physicalPoint:{qExact:str(q),tauExact:str(q),tExact:`1-(${str(q)})`,zExact:'0',XExact:`(${source.Y})/Lambda`,lambdaR2Exact:str(scaledR2Physical),r:{exact:atAxis?'0':`sqrt((${str(scaledR2Physical)})/Lambda)`,positive:!atAxis,binary64:atAxis?0:null,underflowNotZero:!atAxis,logExpression:atAxis?null:`(log(${str(scaledR2Physical)})-log(Lambda))/2`}},physicalSwirl:{quantity:'u_theta',exactExpression:atAxis?'0':`(${str(q)})^(-1/2-h)*sqrt(2*(${source.Y})/Lambda)*Phi(${source.Y},0)/CSelected`,factorLogExpression:atAxis?null:`(-1/2-h)*log(${str(q)})+log(2*(${source.Y}))/2-log(Lambda)/2-logCSelected`,normalizedFieldInterval:sourcePhiInterval,exactlyZeroAtAxis:atAxis,strictlyPositiveOffAxis:!atAxis&&phiInterval[0]>0,binary64:atAxis?0:null,underflowNotZero:!atAxis,normalization:'CSelected*q^(A+1/2)*u_theta/r = Phi; analytic extension at r=0'}};
  });
  const observation={schema:'MathScope.SourceCoreDyadicOverlap/1',sourceProfile:SOURCE_PROFILE_ID,provenance:corePin(),domain:{...clone(PINNED_CORE.domain),activeQuantity:'CE_over_sqrt_2X',activeRadialDerivativeOrder:0,finiteChartObservationRange:[8,900],pulseQStarCertified:false,chosenPrimaryBand:pair.primary,chosenSecondaryBand:pair.secondary,overlapTInterval:['1/2','2'],sampleSelection:'Pinned accepted Y values at eta=0; these are genuine core observations and are not representatives of every pulse slow box.'},sourceParameters:{h,Lambda:{definition:'Q_core^64',QCoreIsDistinctFromDyadicQ:true,exactPositive:true},CSelected:{definition:'exp(logCSelected)',exactPositive:true,sourceParameterName:'CSelected'}},samples,axisMetadata:[{label:'source Y = Lambda X',kind:'SOURCE_COORDINATE',sourceField:'samples[].sourceY',unit:'1'},{label:'normalized Phi interval',kind:'NORMALIZED_FIELD_INTERVAL',sourceField:'samples[].normalizedRoundTripIntervals',unit:'1'}],labelsFrozenDuringDifferentiation:true,actualInfiniteCoreIntervals:true,wholeProfileFieldEvaluator:false,allEtaNonlinearGraphEvaluated:false,newLeanExecution:false};
  const verification=verifySourceCoreObservation(observation);if(!verification.pass)throw Error('A source core overlap invariant failed during construction.');return {...observation,verification};
}

/** Recompute receipt membership, exact coordinates and field exponents from each chart. */
export function verifySourceCoreObservation(observation){
  const checks=[],push=(id,pass,detail)=>checks.push({id,pass:Boolean(pass),...(detail?{detail}:{})});
  try{
    push('accepted-assembly-to-core-sha-chain',same(observation.provenance,corePin())&&PINNED_CORE.acceptedEvidenceEntry.sha256===PINNED_CORE.acceptedCore.sha256&&PINNED_CORE.sourceClaimBoundary.actualInfiniteCoreEvaluationsEnclosed);
    const pair=bandPair(observation.domain.chosenPrimaryBand),q=mul(exactQ(pair.primary),pair.primaryT),expected=phiRows();
    push('exact-observation-domain',observation.sourceProfile===SOURCE_PROFILE_ID&&observation.domain.etaExact==='0'&&observation.domain.chosenSecondaryBand===pair.secondary&&observation.samples.length===expected.length&&observation.labelsFrozenDuringDifferentiation===true&&observation.wholeProfileFieldEvaluator===false);
    observation.samples.forEach((sample,i)=>{
      const source=expected[i];if(!source){push('source-row-'+i,false);return;}const Y=parse(source.Y),phi=exactCoreIntervalToBinary64(source.sameInfiniteCoreInterval);
      push('source-row-'+i,sample.sourceIndex===source.sourceIndex&&sample.sourceY===source.Y&&sample.sourceHash===PINNED_CORE.acceptedCore.sha256&&sample.sourcePath===source.sourcePath&&sample.quantity===source.quantity&&sample.etaExact==='0'&&sample.radialDerivativeOrder===0&&same(sample.sourcePhiInterval,source.sameInfiniteCoreInterval)&&sample.analyticErrorIncluded===true);
      push('physical-point-'+i,eq(parse(sample.physicalPoint.qExact),q)&&eq(parse(sample.physicalPoint.tauExact),q)&&sample.physicalPoint.zExact==='0'&&eq(parse(sample.physicalPoint.lambdaR2Exact),mul(mul(two,q),Y)));
      push('two-distinct-overlap-charts-'+i,sample.chartPair.length===2&&sample.chartPair[0].ell===pair.primary&&sample.chartPair[1].ell===pair.secondary);
      const independentlyRestored=[];
      sample.chartPair.forEach((chart,j)=>{
        const Q=parse(chart.QExact),T=parse(chart.TExact),lambdaR2=parse(chart.lambdaR2Exact),fromQ=mul(Q,T),fromY=div(lambdaR2,mul(two,T)),sourceBand=sourceBandParameters(chart.ell),suffix=i+'-'+j;
        push('chart-Q-T-Y-restoration-'+suffix,eq(Q,exactQ(chart.ell))&&eq(T,j===0?pair.primaryT:pair.secondaryT)&&eq(fromQ,q)&&eq(fromY,Y)&&eq(parse(chart.restoredQExact),fromQ)&&eq(parse(chart.restoredYExact),fromY)&&eq(mul(Q,lambdaR2),mul(mul(two,q),Y))&&eq(parse(chart.restoredLambdaR2PhysicalExact),mul(Q,lambdaR2)));
        const ledger=chart.physicalScale,qExponent=ledger.QVelocityExponent,tExponent=exponentAdd(ledger.TRadiusExponent,ledger.TChartVelocityExponent),normalizedExponent=exponentAdd(ledger.TChartVelocityExponent,ledger.restoreNormalizedExponent);
        push('exact-physical-swirl-scale-'+suffix,same(qExponent,['-1/2','-1'])&&same(tExponent,qExponent)&&same(normalizedExponent,['0','0'])&&same(ledger.sourceQExponent,qExponent)&&ledger.CSelectedExponent==='-1'&&ledger.LambdaExponent==='-1/2');
        const factor=factorInterval(T,ledger.TChartVelocityExponent),transformed=imul(factor,phi),restore=factorInterval(T,ledger.restoreNormalizedExponent),roundTrip=imul(restore,transformed);independentlyRestored.push(roundTrip);
        push('independent-field-interval-restoration-'+suffix,same(chart.chartScaleInterval,factor)&&same(chart.restoreScaleInterval,restore)&&same(chart.chartNormalizedVelocityInterval,transformed)&&same(chart.restoredNormalizedInterval,roundTrip)&&covers(roundTrip,phi));
        push('frozen-source-label-'+suffix,chart.frozenLabels.ell===chart.ell&&chart.frozenLabels.covering===sourceBand.covering.index&&chart.frozenLabels.k===sourceBand.carrier.k&&same(chart.frozenLabels.epsilon,sourceBand.epsilon));
      });
      push('same-physical-quantity-in-overlap-'+i,independentlyRestored.length===2&&intersects(independentlyRestored[0],independentlyRestored[1]));
      const atAxis=Y[0]===0n;push('axis-extension-and-positive-symbolic-scale-'+i,atAxis?sample.physicalSwirl.exactlyZeroAtAxis===true&&sample.physicalSwirl.binary64===0:sample.physicalPoint.r.positive===true&&sample.physicalPoint.r.binary64===null&&sample.physicalSwirl.underflowNotZero===true&&sample.physicalSwirl.binary64===null&&sample.physicalSwirl.strictlyPositiveOffAxis===true);
    });
  }catch(error){push('well-formed-source-observation',false,error.message);}
  return {schema:'MathScope.SourceCoreOverlapVerification/1',pass:checks.every(c=>c.pass),checks,arithmetic:'Exact BigInt rational coordinates and affine h exponent algebra; directed binary64 transformed source intervals.',sourceClaim:'Same accepted eta-zero core sample and physical swirl in the two displayed source charts only.',globalFieldEqualityProof:false};
}
