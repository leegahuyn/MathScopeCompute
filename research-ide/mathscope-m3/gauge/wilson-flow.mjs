/** Numerical nonstationary gradient flow of the actual finite Wilson action. */
import * as M from '../../mathscope-m1/gauge/matrix.mjs';
import {fromCoordinates,groupElementResidual} from '../../mathscope-m1/gauge/groups.mjs';
import {rngFromSeed} from '../../mathscope-m2/gauge/contracts.mjs';
import {action,measure,randomExponential,transformConfiguration} from '../../mathscope-m2/gauge/lattice.mjs';
import {loadLatticeSource,configurationRecord,observationState,latticeObservationResult} from './lattice-observation.mjs';
import {check,known,number,integer,text,sha256,runtimeContext} from './contracts.mjs';

/** g_a = d/ds S(...,exp(s T_a) U_e,...)|0.  The Gram inverse, rather than
 * an assumed orthonormal basis, raises this covector using the exact M1 metric. */
export function wilsonGradient(configuration){
 const {group,geometry:g,links}=configuration,d=group.matrixDimension,covectors=Array.from({length:links.length},()=>Array(group.dimension).fill(0));
 for(const p of g.plaquettes){
  const factors=p.edges.map(e=>e.inverse?M.dagger(links[e.id]):links[e.id]),pre=[M.identity(d)],post=Array(5);post[4]=M.identity(d);
  for(let i=0;i<4;i++)pre.push(M.multiply(pre[i],factors[i]));for(let i=3;i>=0;i--)post[i]=M.multiply(factors[i],post[i+1]);
  for(let i=0;i<4;i++){
   const e=p.edges[i],cycle=e.inverse?M.multiply(M.multiply(post[i+1],pre[i]),factors[i]):M.multiply(M.multiply(factors[i],post[i+1]),pre[i]),coefficient=(e.inverse?1:-1)*p.weight/d;
   for(let a=0;a<group.dimension;a++)covectors[e.id][a]+=coefficient*M.traceProduct(group.basis[a],cycle).re;
  }
 }
 const coefficients=covectors.map(row=>group.gramInverse.map(grow=>grow.reduce((s,v,a)=>s+v*row[a],0))),gradients=coefficients.map(c=>fromCoordinates(group,c));
 let squaredNorm=0;for(const e of g.active)squaredNorm+=coefficients[e.id].reduce((s,v,a)=>s+v*covectors[e.id][a],0);
 return {covectors,coefficients,gradients,squaredNorm};
}

export function wilsonFlowStep(configuration,step,bareCouplingSquared){
 const derivative=wilsonGradient(configuration),links=configuration.links.slice();
 for(const e of configuration.geometry.active)links[e.id]=M.multiply(M.exponential(M.scale(derivative.gradients[e.id],-step*bareCouplingSquared)),configuration.links[e.id]);
 return {configuration:{...configuration,links},gradientSquaredNorm:derivative.squaredNorm,instantaneousActionDerivative:-bareCouplingSquared*derivative.squaredNorm};
}

export function checkWilsonDerivative(configuration,{step=1e-5}={}){
 const derivative=wilsonGradient(configuration),g=configuration.geometry,selected=[g.active[0],g.active[Math.floor(g.active.length/2)],g.active.at(-1)],rows=[];
 for(const edge of selected)for(let a=0;a<configuration.group.dimension;a++){
  const tangent=configuration.group.basis[a],plus=configuration.links.slice(),minus=configuration.links.slice();
  plus[edge.id]=M.multiply(M.exponential(M.scale(tangent,step)),configuration.links[edge.id]);minus[edge.id]=M.multiply(M.exponential(M.scale(tangent,-step)),configuration.links[edge.id]);
  const actual=(action({...configuration,links:plus})-action({...configuration,links:minus}))/(2*step),analytic=derivative.covectors[edge.id][a];rows.push({linkId:edge.id,basisIndex:a,analyticDerivative:analytic,centralDifference:actual,absoluteError:Math.abs(actual-analytic)});
 }
 const maxAbsoluteError=Math.max(...rows.map(r=>r.absoluteError));return {method:'CENTRAL_DIFFERENCE_OF_INDEPENDENT_FULL_ACTION',step,rows,maxAbsoluteError,passed:maxAbsoluteError<2e-6,scope:'A numerical derivative regression of all basis directions on three selected links; not a directed enclosure of the complete flow.'};
}

async function integrate(configuration,{flowTime,steps,bareCouplingSquared},context,phase){
 const a=configuration.geometry.lattice.as,tau=flowTime/(a*a),h=tau/steps;check(h<=.025,'FLOW_STEP_TOO_LARGE','Use enough steps that the dimensionless lattice flow step is at most 0.025.');
 let current={...configuration,links:configuration.links.map(u=>u?M.clone(u):null)},previous=action(current);const history=[{step:0,flowTime:0,latticeFlowTime:0,action:previous,gradientSquaredNorm:null,instantaneousActionDerivative:null}];
 for(let k=1;k<=steps;k++){
  context.checkCancelled();const update=wilsonFlowStep(current,h,bareCouplingSquared),next=action(update.configuration);check(Number.isFinite(next)&&next<=previous+1e-10*Math.max(1,Math.abs(previous)),'FLOW_ACTION_INCREASE','This explicit step did not decrease the actual Wilson action; refine the step before using the result.');
  current=update.configuration;previous=next;history.push({step:k,flowTime:flowTime*k/steps,latticeFlowTime:tau*k/steps,action:next,gradientSquaredNorm:update.gradientSquaredNorm,instantaneousActionDerivative:update.instantaneousActionDerivative});
  if(k%4===0)await context.yield({phase,completed:k,total:steps});
 }
 let membership=0;for(const u of current.links)if(u)membership=Math.max(membership,groupElementResidual(current.group,u).max);check(membership<1e-9,'FLOW_GROUP_DRIFT','The flowed links left the declared compact group within the finite numerical threshold.');
 return {configuration:current,history,groupMembershipResidual:membership,steps,dimensionlessStep:h,latticeFlowTime:tau};
}

export async function runWilsonFlow(input={},context=runtimeContext()){
 known(input,['source','flowTime','steps','observation','timeIndex','quantity','gaugeCheckSeed'],'Wilson flow input');
 const {configuration:original,record}=await loadLatticeSource(input.source??{label:'Original nonstationary SU(2) links'},context),flowTime=number(input.flowTime??.02,'flowTime',{min:0,max:4}),steps=integer(input.steps??16,'steps',4,128),seed=text(input.gaugeCheckSeed??'m3-wilson-flow-covariance','gaugeCheckSeed');
 check(['SU2','SU3','G2'].includes(original.group.id),'FLOW_GROUP_ADAPTER','The finite full-basis flow is bounded to the actual SU2, SU3 and compact G2 adapters.');
 check(original.geometry.V<=256,'FLOW_VOLUME_BUDGET','This explicit flow/refinement/covariance path is limited to 256 sites; no source is downsampled.');
 check(record.beta>0,'FLOW_POSITIVE_BETA','The declared bare-coupling normalization requires beta>0.');
 const bareCouplingSquared=record.model.action.bareCouplingSquared,sourceHashBefore=record.sourceHash,derivativeCheck=checkWilsonDerivative(original);check(derivativeCheck.passed,'FLOW_FORCE_DERIVATIVE','The analytic group derivative did not match the independent full-action difference.');
 const coarse=await integrate(original,{flowTime,steps,bareCouplingSquared},context,'wilson-flow-coarse'),fine=await integrate(original,{flowTime,steps:2*steps,bareCouplingSquared},context,'wilson-flow-refined');
 const rng=rngFromSeed(seed),frames=Array.from({length:original.geometry.V},()=>randomExponential(original.group,rng,.8)),transformed=transformConfiguration(original,frames),gaugeFlow=await integrate(transformed,{flowTime,steps:2*steps,bareCouplingSquared},context,'wilson-flow-gauge-covariance'),expected=transformConfiguration(fine.configuration,frames);
 let gaugeResidual=0,linkRefinementDifference=0,originalLinkChange=0;
 for(const e of original.geometry.active){gaugeResidual=Math.max(gaugeResidual,M.relativeDistance(expected.links[e.id],gaugeFlow.configuration.links[e.id]));linkRefinementDifference=Math.max(linkRefinementDifference,M.distance(coarse.configuration.links[e.id],fine.configuration.links[e.id]));originalLinkChange=Math.max(originalLinkChange,M.distance(original.links[e.id],fine.configuration.links[e.id]));}
 check(gaugeResidual<1e-8,'FLOW_GAUGE_COVARIANCE','The complete numerical flow did not commute with the stated site gauge transformation.');
 const after=await configurationRecord(fine.configuration,{label:`Flowed links · t=${flowTime} ${record.lattice.lengthUnit}²`,beta:record.beta,provenance:{kind:'NUMERICAL_WILSON_GRADIENT_FLOW',originalSourceHash:sourceHashBefore,flowTime,steps:2*steps,bareCouplingSquared}}),settings={kind:input.observation??'SLICE',timeIndex:input.timeIndex??0,quantity:input.quantity??'actionDensity'},states=[await observationState(original,record,0,settings),await observationState(fine.configuration,after,1,settings)],result=await latticeObservationResult([record,after],states,settings);
 const originalAgain=await configurationRecord(original,{beta:record.beta});check(originalAgain.sourceHash===sourceHashBefore,'FLOW_ORIGINAL_CHANGED','The original source must remain byte-identical after deriving a flowed observation.');
 result.states[0].interpretation='ORIGINAL_UNFLOWED';result.states[1].interpretation='NUMERICALLY_FLOWED';
 const coarseMeasurement=measure(coarse.configuration,'CLOVER',{includeSites:true,topology:true}),fineMeasurement=states[1].measurements,densityRefinement=Math.max(...coarseMeasurement.sites.map((p,i)=>Math.abs(p.actionDensity-fineMeasurement.sites[i].actionDensity)));
 return {...result,kind:'wilson-flow',evidenceGrade:'NUMERICAL_FINITE_WILSON_FLOW',flow:{flowTime,timeUnit:`${record.lattice.lengthUnit}^2`,latticeFlowTime:fine.latticeFlowTime,normalization:'tau = t_flow/as²; dV/dtau = -g0² grad_B(S_W)(V) V, B is the full exact M1 compact invariant form',method:'LIE_EXPONENTIAL_EULER_WITH_INDEPENDENT_STEP_HALVING',coarseSteps:steps,refinedSteps:2*steps,dimensionlessFineStep:fine.dimensionlessStep,bareCouplingSquared,originalSourceHash:sourceHashBefore,flowedSourceHash:after.sourceHash,derivedObservationHash:await sha256({sourceHashBefore,flowTime,steps:2*steps,settings}),sourceOverwritten:false,originalLinkChange,originalAction:states[0].measurements.action,flowedAction:fineMeasurement.action,history:fine.history,coarseHistory:coarse.history,derivativeCheck,gaugeCovariance:{seed,fullTrajectoryCompared:true,maximumRelativeLinkResidual:gaugeResidual,passed:gaugeResidual<1e-8},error:{certifiedGlobalError:false,kind:'STEP_HALVING_DIFFERENCE_NOT_A_RIGOROUS_BOUND',maximumLinkDifference:linkRefinementDifference,maximumActionDensityDifference:densityRefinement,actionDifference:Math.abs(coarseMeasurement.action-fineMeasurement.action),groupMembershipResidual:fine.groupMembershipResidual},scope:'Actual nonstationary numerical gradient flow on this finite saved-link model. It constructs neither continuum flow nor a quantum spectral-gap bound.'},continuumGap:'OPEN_CONTINUUM'};
}
