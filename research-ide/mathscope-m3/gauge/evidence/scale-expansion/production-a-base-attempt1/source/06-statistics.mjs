/** Conservative autocorrelation diagnostics; no small-ESS confidence interval is emitted. */
import {check} from './contracts.mjs';
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function analyzeSeries(values,{maxLag=64,minimumESS=50,allowConstant=false}={}){
  check(Array.isArray(values)&&values.length>0&&values.every(Number.isFinite),'INVALID_INPUT','Statistics require a nonempty finite numeric series.');
  const n=values.length,m=mean(values),variance=values.reduce((s,x)=>s+(x-m)**2,0)/n;
  const base={count:n,mean:m,variance,minimumESS,method:'Initial-positive, monotone paired autocorrelation sum; conservative floor tau_int >= 1/2; batch-mean cross-check',replicaPooling:'Each replica is analyzed separately before comparing its mean.'};
  if(variance<=1e-28*Math.max(1,m*m))return {...base,status:allowConstant?'DETERMINISTIC_OBSERVABLE':'STALLED_OR_CONSTANT',integratedAutocorrelationTime:null,effectiveSampleSize:null,standardError:null,confidenceInterval95:null,window:0,windowTruncated:false,batch:null,autocorrelation:[1],warnings:allowConstant?[]:['Constant data cannot certify chain mixing or an effective sample size.']};
  const limit=Math.min(maxLag,Math.floor(n/4)),rho=[1];
  for(let lag=1;lag<=limit;lag++){let c=0;for(let i=0;i<n-lag;i++)c+=(values[i]-m)*(values[i+lag]-m);rho.push(c/n/variance);}
  let tau=.5,window=0,previous=Infinity,ended=false;
  for(let lag=1;lag+1<=limit;lag+=2){const pair=rho[lag]+rho[lag+1];if(pair<=0){ended=true;break;}const monotone=Math.min(previous,pair);tau+=monotone;previous=monotone;window=lag+1;}
  tau=Math.max(.5,tau);const ess=Math.min(n,n/(2*tau)),gammaSE=Math.sqrt(variance*2*tau/n),binSize=Math.max(1,Math.ceil(2*tau)),binCount=Math.floor(n/binSize),bins=[];
  for(let i=0;i<binCount;i++)bins.push(mean(values.slice(i*binSize,(i+1)*binSize)));
  const bm=binCount?mean(bins):null,batchSE=binCount>=8?Math.sqrt(bins.reduce((s,x)=>s+(x-bm)**2,0)/(binCount-1)/binCount):null,se=Math.max(gammaSE,batchSE??0),windowTruncated=!ended&&limit>=2&&window>=limit-1;
  const adequate=n>=64&&ess>=minimumESS&&!windowTruncated&&binCount>=8;
  const midpoint=Math.floor(n/2),firstMean=mean(values.slice(0,midpoint)),secondMean=mean(values.slice(midpoint));
  return {...base,status:adequate?'FINITE_SAMPLE_DIAGNOSTICS_ACCEPTABLE':'INSUFFICIENT_EFFECTIVE_SAMPLES',integratedAutocorrelationTime:tau,effectiveSampleSize:ess,standardError:se,confidenceInterval95:adequate?{lower:m-1.96*se,upper:m+1.96*se,kind:'APPROXIMATE_GAUSSIAN_CONDITIONAL_ON_STATIONARITY',rigorous:false}:null,window,windowTruncated,autocorrelation:rho,batch:{binSize,binCount,discardedTail:n-binCount*binSize,standardError:batchSE},segmentMeans:{first:firstMean,second:secondMean,difference:Math.abs(firstMean-secondMean),diagnosticZ:Math.abs(firstMean-secondMean)/(2*se)},warnings:[...(!adequate?['Sample count is not an independent sample count; quantitative confidence remains provisional.']:[]),...(windowTruncated?['The autocorrelation window reached its configured limit while correlations remained positive.']:[]),'An autocorrelation estimate does not establish equilibration, explore certified topological sectors, or prove a continuum result.']};
}
export function compareReplicas(replicas,observable){
  if(replicas.length<2)return {status:'INDEPENDENT_REPLICA_REQUIRED',observable,pairs:[],thresholdZ:4};
  const pairs=[];for(let i=0;i<replicas.length;i++)for(let j=i+1;j<replicas.length;j++){
    const a=replicas[i].statistics[observable],b=replicas[j].statistics[observable],den=a.standardError!==null&&b.standardError!==null?Math.hypot(a.standardError,b.standardError):null;
    pairs.push({replicas:[i,j],starts:[replicas[i].start,replicas[j].start],meanDifference:Math.abs(a.mean-b.mean),diagnosticZ:den>0?Math.abs(a.mean-b.mean)/den:null,withinDiagnosticThreshold:den>0?Math.abs(a.mean-b.mean)<=4*den:null});
  }
  return {status:pairs.every(p=>p.withinDiagnosticThreshold===true)?'MEANS_COMPATIBLE_AT_DIAGNOSTIC_THRESHOLD':'REPLICA_DIAGNOSTIC_UNRESOLVED',observable,pairs,thresholdZ:4,meaning:'Predeclared four-standard-error compatibility diagnostic; it is not a proof of equilibrium.'};
}

export function splitRhat(series){
  if(series.length<2||series.some(a=>a.length<64))return {value:null,status:'INSUFFICIENT_INDEPENDENT_CHAINS'};
  if(series.some(a=>Math.max(...a)-Math.min(...a)<=1e-12*Math.max(1,...a.map(Math.abs))))return {value:null,status:'CONSTANT_WITHIN_CHAIN'};
  const n=Math.min(...series.map(a=>Math.floor(a.length/2))),halves=series.flatMap(a=>[a.slice(0,n),a.slice(-n)]),means=halves.map(mean),grand=mean(means),m=halves.length,W=mean(halves.map((a,k)=>a.reduce((s,v)=>s+(v-means[k])**2,0)/(n-1))),B=n*means.reduce((s,v)=>s+(v-grand)**2,0)/(m-1);
  if(W===0)return {value:null,status:'CONSTANT_WITHIN_CHAIN',withinChainVariance:W,betweenChainVariance:B};
  const value=Math.sqrt(((n-1)*W/n+B/n)/W);return {value,status:value<=1.1?'SPLIT_RHAT_ACCEPTABLE':'SPLIT_RHAT_FAILED',threshold:1.1,splitChainCount:m,splitLength:n,withinChainVariance:W,betweenChainVariance:B,meaning:'A predeclared finite stationarity diagnostic, not a proof of equilibrium.'};
}
export function topologyMobility(values,statistics){
  if(!values.length||!values.every(Number.isFinite))return {status:'BOUNDARY_STENCIL_INCOMPLETE',passed:false,integerSectorLabels:null};
  const range=Math.max(...values)-Math.min(...values),scale=Math.max(1,...values.map(Math.abs)),epsilon=1e-10*scale;let longest=1,run=1;
  for(let i=1;i<values.length;i++){run=Math.abs(values[i]-values[i-1])<=epsilon?run+1:1;longest=Math.max(longest,run);}
  const passed=range>100*epsilon&&longest<=Math.max(8,Math.floor(values.length/10))&&statistics?.status==='FINITE_SAMPLE_DIAGNOSTICS_ACCEPTABLE';
  return {status:passed?'ESTIMATOR_MOBILITY_DIAGNOSTIC_PASSED':'STALLED_OR_INSUFFICIENT_TOPOLOGY_HISTORY',passed,range,nearConstantTolerance:epsilon,longestNearConstantRun:longest,maximumAllowedRun:Math.max(8,Math.floor(values.length/10)),effectiveSampleSize:statistics?.effectiveSampleSize??null,lagOneCorrelation:statistics?.autocorrelation?.[1]??null,integerSectorLabels:null,scope:'Mobility of the explicitly measured unrounded plaquette/clover charge estimator. No certified integer-sector observable is available for rough links; sector mixing and topology conservation are not inferred by rounding.'};
}
export function diagnoseEnsemble(replicas,{beta=1}={}){
  const fields={action:'action',plaquette:'meanPlaquette',topology:'topologyEstimate'};
  if(replicas.every(r=>r.statistics.polyakov))fields.polyakov='meanPolyakovReal';
  const observables=Object.fromEntries(Object.entries(fields).map(([name,key])=>{
    const available=replicas.every(r=>r.statistics[name]),deterministic=name==='action'&&beta===0,comparison=available?compareReplicas(replicas,name):{status:'UNAVAILABLE_OBSERVABLE'},rhat=available?splitRhat(replicas.map(r=>r.samples.map(s=>s[key]))):{status:'UNAVAILABLE_OBSERVABLE',value:null};
    const passed=deterministic||(available&&replicas.every(r=>r.statistics[name].status==='FINITE_SAMPLE_DIAGNOSTICS_ACCEPTABLE'&&r.statistics[name].segmentMeans?.diagnosticZ<=4)&&comparison.status==='MEANS_COMPATIBLE_AT_DIAGNOSTIC_THRESHOLD'&&rhat.status==='SPLIT_RHAT_ACCEPTABLE');
    return [name,{passed,comparison,splitRhat:rhat,segmentThresholdZ:4,minimumESS:replicas[0]?.statistics[name]?.minimumESS??null}];
  }));
  const starts=new Set(replicas.map(r=>r.start)),differentStarts=starts.has('COLD')&&(starts.has('HOT_HAAR')||starts.has('DISORDERED_EXPONENTIAL')),warmup=replicas.every(r=>r.history.some(h=>h.phase==='BURN_IN')),acceptance=replicas.every(r=>r.acceptance>0&&r.acceptance<=1),mobility=replicas.every(r=>r.topologyDiagnostic.passed===true),passed=differentStarts&&warmup&&acceptance&&mobility&&Object.values(observables).every(o=>o.passed);
  return {status:passed?'FINITE_EQUILIBRIUM_DIAGNOSTICS_PASSED':'INCOMPLETE_FINITE_EQUILIBRIUM_DIAGNOSTICS',passed,differentStarts,warmupRecorded:warmup,nonzeroAcceptance:acceptance,topologyEstimatorMobilityPassed:mobility,observables,quantitativeClaim:passed?'The stated finite observables passed the predeclared independent-start, segment, split-Rhat, ESS and mobility diagnostics.':'Quantitative research output remains incomplete even if the nominal retained sample count is large.',equilibriumTheorem:false,certifiedTopologicalSectorMixing:false};
}
