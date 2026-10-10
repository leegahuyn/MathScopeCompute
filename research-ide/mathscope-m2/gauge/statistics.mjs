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
