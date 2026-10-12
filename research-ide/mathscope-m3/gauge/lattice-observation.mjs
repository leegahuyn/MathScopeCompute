/** Actual saved-link 4D observations. Spatial meshes never replace the link source. */
import * as M from '../../mathscope-m1/gauge/matrix.mjs';
import {normalizeInput,SU2} from '../../mathscope-m2/gauge/contracts.mjs';
import {createConfiguration,configurationHash,modelDescriptor,serializeLinks,measure,fieldStrengthAt} from '../../mathscope-m2/gauge/lattice.mjs';
import {check,known,text,integer,sha256,jsonSafe,runtimeContext} from './contracts.mjs';

export const DEFAULT_OBSERVATION_LATTICE={Ns:2,Nt:4,as:.5,at:.5,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'ell0',origin:[0,0,0,0]};

export async function loadLatticeSource(source={},context=runtimeContext()){
 known(source,['label','group','lattice','beta','initial','expectedSourceHash','expectedModelHash','provenance'],'lattice source');
 const normalized=normalizeInput('gauge.lattice',{group:source.group??SU2,lattice:source.lattice??DEFAULT_OBSERVATION_LATTICE,beta:source.beta??1.5,measurement:'CLOVER',initial:source.initial??{kind:'SEEDED_EXPONENTIAL',seed:'m3-lattice-observation'}});
 const configuration=await createConfiguration(normalized,context),model=modelDescriptor(normalized,configuration.group),modelHash=await sha256(model),sourceHash=await configurationHash(configuration,modelHash);
 if(source.expectedModelHash!==undefined)check(source.expectedModelHash===modelHash,'LATTICE_MODEL_HASH_MISMATCH','The stored model differs from its declared group, action, geometry or boundary.');
 if(source.expectedSourceHash!==undefined)check(source.expectedSourceHash===sourceHash,'LATTICE_SOURCE_HASH_MISMATCH','The actual link matrices differ from their claimed configuration hash.');
 return {configuration,record:{label:text(source.label??'Actual finite Wilson configuration','source label'),model,modelHash,sourceHash,group:normalized.group,lattice:normalized.lattice,beta:normalized.beta,initial:normalized.initial,links:serializeLinks(configuration),provenance:source.provenance??{kind:'EXPLICIT_FINITE_CONFIGURATION',equilibriumNotAsserted:true}}};
}

export async function configurationRecord(configuration,{label,provenance,beta}={}){
 const originalBeta=beta??configuration.geometry.plaquettes[0].weight/(configuration.geometry.plaquettes[0].nu===3?configuration.geometry.xi:1/configuration.geometry.xi),model=modelDescriptor({group:configuration.group.spec,lattice:configuration.geometry.lattice,beta:originalBeta},configuration.group),modelHash=await sha256(model),sourceHash=await configurationHash(configuration,modelHash);
 return {label:label??'Derived finite Wilson configuration',model,modelHash,sourceHash,group:configuration.group.spec,lattice:configuration.geometry.lattice,beta:model.action.beta,initial:configuration.initial,links:serializeLinks(configuration),provenance:provenance??{kind:'DERIVED_FINITE_CONFIGURATION'}};
}

export function latticeScalarPoints(configuration,measurement,{kind='SLICE',timeIndex=0,quantity='actionDensity',recordIndex=0}={}){
 check(['SLICE','MARGINAL','AVERAGE'].includes(kind),'LATTICE_OBSERVATION_KIND','Use a discrete time slice, at-weighted marginal or temporal average.');
 check(['actionDensity','topologicalDensity','curvatureEnergyDensity'].includes(quantity),'GAUGE_INVARIANT_CHANNEL','Lattice observation channels are explicit invariant densities.');
 const g=configuration.geometry,Nt=g.sizes[3];integer(timeIndex,'timeIndex',0,Nt-1);
 const points=[],omissions=[],unit=`${g.lattice.lengthUnit}^-${kind==='MARGINAL'?3:4}`,operator=kind==='SLICE'?`${quantity}(x1,x2,x3,n_t at)`:kind==='MARGINAL'?`at * sum_(n_t=0..Nt-1) ${quantity}`:`(1/Nt) * sum_(n_t=0..Nt-1) ${quantity}`;
 for(let x=0;x<g.sizes[0];x++)for(let y=0;y<g.sizes[1];y++)for(let z=0;z<g.sizes[2];z++){
  const times=kind==='SLICE'?[timeIndex]:Array.from({length:Nt},(_,t)=>t),sites=times.map(t=>g.index([x,y,z,t])),rows=sites.map(site=>measurement.sites[site]);
  const physical=g.physical(sites[0]),values=rows.map(row=>row[quantity]);
  if(values.some(v=>v===null||!Number.isFinite(v))){omissions.push({position:physical.slice(0,3),siteIndices:sites,reason:'INCOMPLETE_CURVATURE_STENCIL',value:null});continue;}
  const sum=values.reduce((a,b)=>a+b,0),value=kind==='SLICE'?values[0]:kind==='MARGINAL'?g.lattice.at*sum:sum/Nt;
  points.push({index:points.length,position:physical.slice(0,3),value,unit,operator,sourceCoordinates:kind==='SLICE'?physical:{spatialCoordinate:physical.slice(0,3),timeIndices:times,spacing:g.lattice.at,coordinates4:sites.map(site=>g.physical(site)),periodicTime:g.boundary[3]==='PERIODIC'},sourceMembers:sites.map(site=>({recordIndex,site,coordinate4:g.physical(site),coefficient:kind==='SLICE'?1:kind==='MARGINAL'?g.lattice.at:1/Nt})),error:{kind:'FINITE_LINK_FLOAT64_ESTIMATOR',interpolation:'NONE',exactDiscreteSlice:kind==='SLICE',finiteSpacingOrder:measurement.topology.finiteSpacingOrder,certifiedContinuumError:false}});
 }
 check(points.length>0,'NO_COMPLETE_OBSERVATION_STENCIL','The requested quantity has no complete source stencil; no missing value is plotted as zero.');
 return {points,omissions,unit,operator,kind,timeIndex,quantity,sourceDownsampled:false};
}

export async function observationState(configuration,record,recordIndex,settings){
 const measurements=measure(configuration,'CLOVER',{includeSites:true,topology:true}),view=latticeScalarPoints(configuration,measurements,{...settings,recordIndex});
 return {label:record.label,mode:'LATTICE_OBSERVATION',interpretation:'SINGLE_CONFIGURATION',delta:null,sourceHash:record.sourceHash,modelHash:record.modelHash,sampleHash:await sha256(measurements.sites),points:view.points,omissions:view.omissions,observable:view.operator,measurements,recordIndices:[recordIndex],lattice:record.lattice,quantumState:false,scope:'A scalar observation of the exact saved finite Float64 links. Equilibrium and continuum interpretation require independent evidence.'};
}

export async function latticeObservationResult(records,states,settings){
 const all=states.flatMap(s=>s.points.map(p=>p.value)),sourceHash=await sha256(records.map(r=>({sourceHash:r.sourceHash,modelHash:r.modelHash}))),observationHash=await sha256({sourceHash,settings}),units=[...new Set(states.flatMap(s=>s.points.map(p=>p.unit)))];
 check(units.length===1,'OBSERVATION_UNIT_MISMATCH','A common comparison scale requires the same physical observation units.');
 return jsonSafe({kind:'lattice-observation',status:'COMPLETED',evidenceGrade:'NUMERICAL_FINITE_LATTICE_OBSERVATION',sourceHash,source:{records},original:{sourceHash,records:records.map(r=>({sourceHash:r.sourceHash,modelHash:r.modelHash,label:r.label}))},states,representation:{observation:settings,observationHash,quantity:settings.quantity,unit:units[0],sharedScale:{min:Math.min(...all),max:Math.max(...all),unit:units[0],independentNormalization:false},projection:'Keep the first three physical coordinates, retaining every discarded time/configuration source member.',lostInformation:['Other link components and gauge orientation','An integral/ensemble observation has a fibre, not a single reconstructed configuration'],colorLegend:'Each value has a numeric table entry and exact source-member list.'},selectionContract:{function:'inspectLatticeSelection',returns:['Original link matrices','Every contributing configuration and 4D site','Observed scalar and coefficients','Actual clover F components with source gauge ID']},continuumGap:'OPEN_CONTINUUM'});
}

export async function runLatticeObservation(input={},context=runtimeContext()){
 known(input,['sources','observation','baseObservation','timeIndex','quantity'],'lattice observation input');const sources=input.sources??[{label:'Actual seeded SU(2) links'}];
 check(Array.isArray(sources)&&sources.length>=1&&sources.length<=4,'LATTICE_SOURCES','Provide one to four exact finite sources.');
 const kind=input.observation??'SLICE',baseKind=kind==='ENSEMBLE_MEAN'?(input.baseObservation??'SLICE'):kind,settings={kind,baseKind,timeIndex:input.timeIndex??0,quantity:input.quantity??'actionDensity'};
 check(['SLICE','MARGINAL','AVERAGE','ENSEMBLE_MEAN'].includes(kind),'LATTICE_OBSERVATION_KIND','Choose slice, marginal, temporal average or configuration mean.');
 const records=[],states=[];for(let i=0;i<sources.length;i++){context.checkCancelled();const {configuration,record}=await loadLatticeSource(sources[i],context);records.push(record);states.push(await observationState(configuration,record,i,{kind:baseKind,timeIndex:settings.timeIndex,quantity:settings.quantity}));}
 if(kind==='ENSEMBLE_MEAN'){
  check(records.every(r=>r.modelHash===records[0].modelHash),'ENSEMBLE_MODEL_MISMATCH','A configuration mean requires one identical group, action, lattice, spacing and boundary model.');
  check(states.every(s=>s.points.length===states[0].points.length&&s.points.every((p,i)=>JSON.stringify(p.position)===JSON.stringify(states[0].points[i].position))),'ENSEMBLE_OBSERVATION_ALIGNMENT','Ensemble means require the same observed physical sites and stencil completeness.');
  const points=states[0].points.map((p,i)=>({...p,value:states.reduce((v,s)=>v+s.points[i].value,0)/states.length,operator:`(1/Nconfig) sum_config [${p.operator}]`,sourceCoordinates:{kind:'CONFIGURATION_FIBRE',spatialCoordinate:p.position,sourceHashes:records.map(r=>r.sourceHash),baseObservation:p.sourceCoordinates},sourceMembers:states.flatMap(s=>s.points[i].sourceMembers.map(m=>({...m,coefficient:m.coefficient/states.length}))),error:{...p.error,ensembleCount:states.length,statisticalError:'Not inferred from an arbitrary collection of source configurations; use chain diagnostics and blocking separately.'}}));
  const combined={label:'Mean of declared actual configurations',mode:'LATTICE_OBSERVATION',interpretation:'ENSEMBLE_MEAN',delta:null,sourceHash:await sha256(records.map(r=>r.sourceHash)),modelHash:records[0].modelHash,sampleHash:await sha256(points),points,recordIndices:records.map((_,i)=>i),lattice:records[0].lattice,scope:'Arithmetic mean of the stated configurations; an ensemble law or equilibrium is not assumed from the label.'};
  return latticeObservationResult(records,[combined],settings);
 }
 return latticeObservationResult(records,states,settings);
}

export async function inspectLatticeSelection(result,stateIndex,pointIndex,context=runtimeContext()){
 const state=result.states?.[stateIndex],point=state?.points?.[pointIndex];check(point&&result.source?.records,'SELECTION_INDEX','Select an actual lattice observation point.');
 const loaded=new Map(),members=[];
 for(const member of point.sourceMembers){
  const record=result.source.records[member.recordIndex];check(record,'SOURCE_RECORD','The selected observation requires its original configuration record.');
  if(!loaded.has(member.recordIndex))loaded.set(member.recordIndex,await loadLatticeSource({label:record.label,group:record.group,lattice:record.lattice,beta:record.beta,initial:{kind:'EXPLICIT_LINKS',links:record.links},expectedSourceHash:record.sourceHash,expectedModelHash:record.modelHash},context));
  const {configuration}=loaded.get(member.recordIndex),g=configuration.geometry,F=[];
  for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){const value=fieldStrengthAt(configuration,member.site,mu,nu,'CLOVER');F.push({axes:[mu,nu],matrix:value?M.jsonMatrix(value):null});}
  members.push({...member,sourceHash:record.sourceHash,modelHash:record.modelHash,gaugeId:`stored-link-gauge:${record.sourceHash}`,F,positiveLinks:[0,1,2,3].map(mu=>{const id=member.site*4+mu,u=configuration.links[id];return {direction:mu,linkId:id,endSite:g.linkById[id]?.end??null,matrix:u?M.jsonMatrix(u):null};})});
 }
 return {sourceHash:state.sourceHash,coordinate:point.sourceCoordinates,observable:{operator:point.operator,value:point.value,unit:point.unit},members,claim:{type:'FINITE_LATTICE_OBSERVATION',projectionIsInjective:false,formalStatus:'NUMERICAL_SOURCE_RECOMPUTATION; NOT_A_CONTINUUM_OR_GAP_PROOF'}};
}
