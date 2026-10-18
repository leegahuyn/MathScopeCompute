/** Actual finite Fourier observations for N8-06. No continuum authority is inferred. */
import {fourierSpace, sampleVelocity, validateVelocity, invariants} from './galerkin.mjs';

const TAU=2*Math.PI;
const bad=(message)=>{throw new Error(message);};
const vec=(v,name)=>{if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)))bad(name+' requires three finite coordinates.');return [...v];};
const plus=(a,b,h)=>a.map((x,i)=>x+h*b[i]);
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const wrap=x=>x.map(v=>((v%TAU)+TAU)%TAU);

export function validateFlowObservationOptions(options={}){
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['seeds','steps','angularOrigin','coreBounds','coreGrid'].includes(k)))bad('Unknown flow observation option.');
  const seeds=options.seeds??[[Math.PI/4,0,0],[Math.PI/4,Math.PI/3,0]],steps=options.steps??32,angularOrigin=vec(options.angularOrigin??[0,0,0],'angular origin'),coreBounds=options.coreBounds??Array.from({length:3},()=>[Math.PI/2,3*Math.PI/2]),coreGrid=options.coreGrid??4;
  if(!Array.isArray(seeds)||seeds.length<1||seeds.length>4)bad('Use one to four trajectory seeds.');
  const checkedSeeds=seeds.map(s=>vec(s,'seed'));
  if(!Number.isInteger(steps)||steps<8||steps>128)bad('Trajectory steps must be between 8 and 128.');
  if(!Array.isArray(coreBounds)||coreBounds.length!==3||coreBounds.some(v=>!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x))||v[0]<0||v[1]>TAU||v[0]>=v[1]))bad('The selected core box must lie inside the fixed periodic box.');
  if(!Number.isInteger(coreGrid)||coreGrid<2||coreGrid>8)bad('Core quadrature grid must be between 2 and 8.');
  return {seeds:checkedSeeds,steps,angularOrigin,coreBounds:coreBounds.map(b=>[...b]),coreGrid};
}

export function angularVelocityZ(position,velocity,origin=[0,0,0]){
  vec(position,'position');vec(velocity,'velocity');vec(origin,'origin');
  const x=position[0]-origin[0],y=position[1]-origin[1],r2=x*x+y*y;
  return {value:r2===0?null:(x*velocity[1]-y*velocity[0])/r2,
    status:r2===0?'UNDEFINED_ON_AXIS':'DEFINED',axis:'x3',origin:[...origin],
    formula:'Omega_z=((x1-o1)*u2-(x2-o2)*u1)/((x1-o1)^2+(x2-o2)^2)',
    unit:'1/model_time',isVorticity:false};
}

export function coefficientHistory(run){
  const S=fourierSpace(run.input.cutoff),frames=run.stateHistory?.frames??[];
  if(!frames.length)return {space:S,frames:[],status:'NO_STORED_TIME_STATES'};
  if(frames.length>128||frames[0].time!==0||frames.at(-1).time!==run.lastResolvedTime)bad('Stored time states do not cover the actual run interval.');
  for(let i=0;i<frames.length;i++){
    const f=frames[i];
    if(!Number.isFinite(f.time)||f.time<0||(i>0&&f.time<=frames[i-1].time)||!Number.isInteger(f.acceptedIndex)||f.acceptedIndex<0)bad('Invalid accepted time state.');
    if(!validateVelocity(S,f.coefficients).pass)bad('A stored time state is not solenoidal and Hermitian.');
  }
  if(frames[0].coefficients.some((x,i)=>x!==run.initial[i])||frames.at(-1).coefficients.some((x,i)=>x!==run.final[i]))bad('Stored endpoint coefficients differ from the executed run.');
  return {space:S,frames,status:run.stateHistory.status};
}

function timeCoefficients(frames,t){
  if(t<frames[0].time||t>frames.at(-1).time)bad('Particle evaluation is outside the recorded time interval.');
  let lo=0,hi=frames.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(frames[m].time<=t)lo=m;else hi=m;}
  if(t===frames[lo].time)return frames[lo].coefficients;
  if(t===frames[hi].time)return frames[hi].coefficients;
  const a=frames[lo],b=frames[hi],w=(t-a.time)/(b.time-a.time);
  return a.coefficients.map((v,i)=>(1-w)*v+w*b.coefficients[i]);
}

function rk4(rhs,x,t,h){
  const a=rhs(t,x),b=rhs(t+h/2,plus(x,a,h/2)),c=rhs(t+h/2,plus(x,b,h/2)),d=rhs(t+h,plus(x,c,h));
  const result=x.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);
  if(result.some(x=>!Number.isFinite(x)))bad('A trajectory left finite arithmetic.');
  return result;
}

function pathIntegration(rhs,seed,knots,steps,kind,frozenTime){
  const duration=knots.at(-1)-knots[0],maximumStep=duration/steps;
  let x=[...seed],parameter=knots[0];
  const point=()=>({position:wrap(x),unwrappedPosition:[...x],parameter,
    time:kind==='PARTICLE_PATH'?parameter:frozenTime,velocity:rhs(parameter,x)});
  const points=[point()];
  for(let j=1;j<knots.length;j++){
    const left=knots[j-1],right=knots[j],n=Math.max(1,Math.ceil((right-left)/maximumStep));
    for(let i=0;i<n;i++){
      const a=left+(right-left)*i/n,b=left+(right-left)*(i+1)/n;
      x=rk4(rhs,x,a,b-a);parameter=b;points.push(point());
    }
  }
  return {points,steps:points.length-1};
}

export function computeFlowPaths(run,options={}){
  const {seeds,steps}=validateFlowObservationOptions(options);
  const {space:S,frames,status}=coefficientHistory(run),T=run.lastResolvedTime;
  if(!(T>0))return {paths:[],status:'NO_POSITIVE_EXECUTED_TIME'};
  const frozen=(_,x)=>sampleVelocity(S,run.final,[x])[0].velocity;
  const varying=frames.length?(t,x)=>sampleVelocity(S,timeCoefficients(frames,t),[x])[0].velocity:null;
  const paths=[];
  seeds.forEach((seed,i)=>{
    for(const kind of ['INSTANTANEOUS_STREAMLINE','PARTICLE_PATH']){
      if(kind==='PARTICLE_PATH'&&!varying)continue;
      const rhs=kind==='PARTICLE_PATH'?varying:frozen,knots=kind==='PARTICLE_PATH'?frames.map(f=>f.time):[0,T];
      const coarse=pathIntegration(rhs,seed,knots,steps,kind,T),fine=pathIntegration(rhs,seed,knots,steps*2,kind,T);
      paths.push({id:(kind==='PARTICLE_PATH'?'pathline-':'streamline-')+i,kind,seed,
        fieldTime:kind==='PARTICLE_PATH'?null:T,parameter:{name:kind==='PARTICLE_PATH'?'time':'streamline_parameter',unit:'model_time',range:[0,T]},
        equation:kind==='PARTICLE_PATH'?'dx/dt=u_interpolated(x,t)':'dx/dsigma=u(x,t_final); t_final is fixed',
        coefficientSource:kind==='PARTICLE_PATH'?'results.stateHistory.frames':'results.final',
        points:fine.points,method:'RK4, each stored time knot is an integration boundary',
        refinement:{coarseSteps:coarse.steps,fineSteps:fine.steps,endpointDifference:distance(coarse.points.at(-1).unwrappedPosition,fine.points.at(-1).unwrappedPosition),rigorousErrorEnclosure:false},
        velocityNormalization:'NONE',periodicEmbedding:'Wrapped positions with unwrapped coordinates retained; split a drawn line at a periodic seam.'});
    }
  });
  return {paths,status:varying?'EXECUTED_BOTH_PATH_TYPES':'STREAMLINES_ONLY_MISSING_TIME_STATES',
    timeStates:{status,count:frames.length,times:frames.map(f=>f.time),acceptedIndices:frames.map(f=>f.acceptedIndex),maximumGap:run.stateHistory?.maximumTimeGap??null,
      interpolation:'piecewise linear Fourier coefficients',rigorousTemporalEnclosure:false}};
}

function boxEnergy(S,coefficients,bounds,n){
  let energy=0,batch=[];const volume=bounds.reduce((s,[a,b])=>s*(b-a),1);
  const flush=()=>{for(const p of sampleVelocity(S,coefficients,batch))energy+=p.speed*p.speed/2;batch=[];};
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){
    batch.push([i,j,k].map((q,d)=>bounds[d][0]+(q+.5)*(bounds[d][1]-bounds[d][0])/n));
    if(batch.length===256)flush();
  }
  if(batch.length)flush();
  return {integral:energy*volume/n**3,spatialMean:energy/n**3,volume,grid:[n,n,n],quadrature:'uniform tensor midpoint',samples:n**3};
}

export function flowEnergyObservation(run,options={}){
  const {coreBounds,coreGrid}=validateFlowObservationOptions(options);
  const {space:S,frames}=coefficientHistory(run),bounds=Array.from({length:3},()=>[0,TAU]),globalMean=invariants(S,run.final).energy;
  const global=boxEnergy(S,run.final,bounds,2*S.cutoff+1),coarse=boxEnergy(S,run.final,coreBounds,coreGrid),fine=boxEnergy(S,run.final,coreBounds,coreGrid*2);
  const rows=(frames.length?frames:[{time:run.lastResolvedTime,coefficients:run.final}]).map(f=>({time:f.time,energy:invariants(S,f.coefficients).energy,
    globalEnergy:invariants(S,f.coefficients).energy*TAU**3,coreEnergy:boxEnergy(S,f.coefficients,coreBounds,coreGrid*2).integral}));
  return {rows,global:{scope:'FULL_PERIODIC_BOX',bounds,integral:globalMean*TAU**3,spatialMean:globalMean,volume:TAU**3,
      independentMidpoint:global,parsevalDifference:Math.abs(global.spatialMean-globalMean),finiteTrigonometricQuadratureCondition:'grid per axis > 2*Fourier cutoff'},
    core:{scope:'SELECTED_BOX_SUBREGION',bounds:coreBounds,mask:'indicator of this fixed Cartesian box',coarse,fine,
      refinementDifference:Math.abs(fine.integral-coarse.integral),rigorousErrorEnclosure:false},
    unit:'model_length^5/model_time^2',originalPaperWholeSpaceEnergy:false,tail:'Energy of the executed finite Fourier field; no bound for omitted continuum modes is inferred.'};
}

export function buildFlowObservations(run,options={}){
  options=validateFlowObservationOptions(options);
  const S=fourierSpace(run.input.cutoff),positions=[],origin=options.angularOrigin;
  for(let x=0;x<9;x++)for(let y=0;y<9;y++)positions.push([TAU*x/8,TAU*y/8,0]);
  const samples=sampleVelocity(S,run.final,positions).map(p=>({...p,angularVelocity:angularVelocityZ(p.position,p.velocity,origin)}));
  const flow=computeFlowPaths(run,options),energy=flowEnergyObservation(run,options),bounds=Array.from({length:3},()=>[0,TAU]);
  return {kind:'ACTUAL_FINITE_FOURIER_FIELD',samples,curves:energy.rows,paths:flow.paths,flow,energy,
    contract:{schema:'MathScope.N8.FlowObservationContract/2',coordinateFrame:'fixed physical 2pi-periodic box',bounds,units:'model_length/model_time',time:run.lastResolvedTime,
      coordinateSystems:{physical:{label:'physical model coordinates',scale:1,velocityScale:1,bounds,unit:'model_length'},
        periodic_box:{label:'periodic-box coordinates x/(2pi)',scale:1/TAU,velocityScale:1/TAU,bounds:Array.from({length:3},()=>[0,1]),unit:'box_length',sourcePaperNormalizedCoordinates:false}},
      velocityOrAngularVelocity:'Both Cartesian velocity and angular velocity about the declared x3 axis; angular velocity is not vorticity.',
      angularVelocity:{axis:'x3',origin,unit:'1/model_time',axisValue:'UNDEFINED_ON_AXIS; never replaced by zero'},
      streamlineOrParticlePath:'Separate frozen-time streamlines and time-dependent particle paths, with actual stored coefficient times.',
      energyScope:'Full periodic integral and selected fixed-box integral have separate fields; spatial mean also retained.',
      colorRange:[0,Math.max(...samples.map(x=>x.speed))],angularColorRange:[Math.min(...samples.flatMap(x=>x.angularVelocity.value===null?[]:[x.angularVelocity.value])),Math.max(...samples.flatMap(x=>x.angularVelocity.value===null?[]:[x.angularVelocity.value]))],
      vectorScale:.3,automaticVectorNormalization:false,automaticSpatialFit:false,pathSamplesFromRecordedCoefficients:true,paperReconstruction:false,rigorousErrorEnclosure:false}};
}
