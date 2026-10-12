/** One exact display contract shared by the Worker verifier and visible canvas. */
function check(ok,message){if(!ok)throw new Error(message);}
export function validateExtendedView(view){
 const required=['camera','lod','selected','state'],optional=['coordinateSystem','observable','flowPaths'];
 check(view&&typeof view==='object'&&!Array.isArray(view)&&required.every(k=>Object.hasOwn(view,k))&&Object.keys(view).every(k=>required.includes(k)||optional.includes(k)),'Invalid display view keys');
 const c=view.camera;check(c&&Object.keys(c).sort().join(',')==='pitch,yaw,zoom','Invalid camera keys');
 check(Number.isFinite(c.yaw)&&Math.abs(c.yaw)<=1e6&&Number.isFinite(c.pitch)&&c.pitch>=-1.45&&c.pitch<=1.45&&Number.isFinite(c.zoom)&&c.zoom>=.45&&c.zoom<=3,'Camera is outside supported bounds');
 check([250,1000].includes(view.lod),'Unsupported display point budget');
 check(typeof view.state==='string'&&/^(all|[0-3])$/.test(view.state),'Invalid visible state');
 check(view.selected===null||(typeof view.selected==='string'&&/^[0-3]:[0-9]{1,3}$/.test(view.selected)),'Invalid original point ID');
 const coordinateSystem=view.coordinateSystem??'physical',observable=view.observable??'value',flowPaths=view.flowPaths??'none';
 check(['physical','periodic_box'].includes(coordinateSystem),'Invalid coordinate system');
 check(['value','angular_velocity'].includes(observable),'Invalid displayed observable');
 check(['none','streamlines','particles','both'].includes(flowPaths),'Invalid flow path type');
 return {camera:{yaw:c.yaw,pitch:c.pitch,zoom:c.zoom},lod:view.lod,selected:view.selected,state:view.state,coordinateSystem,observable,flowPaths};
}
export function deriveExtendedScene(record,settings){
 const view=validateExtendedView(settings),r=record.result;let groups=[];
 if(Array.isArray(r.states))groups=r.states.map((s,i)=>({id:String(i),points:s.points.map((p,j)=>({...p,key:i+':'+(p.index??j),pointIndex:p.index??j,stateIndex:i,velocity:p.velocity??null}))}));
 else if(r.observations?.samples?.length)groups=[{id:'0',points:r.observations.samples.map((p,j)=>({...p,key:'0:'+j,pointIndex:j,stateIndex:0,value:p.speed??p.value,unit:r.observations.contract?.units??'',velocity:p.velocity??null}))}];
 const sourcePoints=groups.flatMap(g=>g.points),contract=r.observations?.contract;
 check(view.state==='all'||groups.some(g=>g.id===view.state),'The selected state is absent from this source');
 check(view.selected===null||sourcePoints.some(p=>p.key===view.selected),'The selected point is absent from this source');
 check(view.coordinateSystem==='physical'||contract?.coordinateSystems?.[view.coordinateSystem],'The coordinate transform is absent from this source');
 check(view.observable==='value'||sourcePoints.length&&sourcePoints.every(p=>p.angularVelocity?.axis==='x3'),'Angular velocity is absent from this source');
 const transform=contract?.coordinateSystems?.[view.coordinateSystem]??{scale:1,velocityScale:1,bounds:contract?.bounds??null};
 check(Number.isFinite(transform.scale)&&transform.scale>0&&Number.isFinite(transform.velocityScale)&&transform.velocityScale>0,'Invalid declared coordinate transform');
 groups=groups.map(g=>({...g,points:g.points.map(p=>({...p,sourcePosition:[...p.position],sourceValue:p.value,sourceVelocity:p.velocity?[...p.velocity]:null,
   sourceVelocityUnit:p.velocity?p.unit:null,velocityUnit:p.velocity?(view.coordinateSystem==='periodic_box'?'box_length/model_time':p.unit):null,
   position:p.position.map(x=>x*transform.scale),velocity:p.velocity?.map(x=>x*transform.velocityScale)??null,
   value:view.observable==='angular_velocity'?p.angularVelocity.value:p.velocity?p.value*transform.velocityScale:p.value,
   valueStatus:view.observable==='angular_velocity'?p.angularVelocity.status:'DEFINED',
   unit:view.observable==='angular_velocity'?p.angularVelocity.unit:view.coordinateSystem==='periodic_box'?'box_length/model_time':p.unit}))}));
 const points=groups.flatMap(g=>g.points),visible=groups.filter(g=>view.state==='all'||g.id===view.state),paths=r.observations?.paths??[];
 const wanted=view.flowPaths==='none'?[]:view.flowPaths==='both'?['INSTANTANEOUS_STREAMLINE','PARTICLE_PATH']:view.flowPaths==='particles'?['PARTICLE_PATH']:['INSTANTANEOUS_STREAMLINE'];
 for(const kind of wanted)check(paths.some(p=>p.kind===kind),'The requested flow path is absent from this source');
 const displayedPaths=paths.filter(p=>wanted.includes(p.kind)).map(p=>({...p,points:p.points.map(q=>({...q,
   sourcePosition:[...q.position],sourceVelocity:q.velocity?[...q.velocity]:null,sourceUnwrappedPosition:q.unwrappedPosition?[...q.unwrappedPosition]:null,
   position:q.position.map(x=>x*transform.scale),velocity:q.velocity?.map(x=>x*transform.velocityScale)??null,
   unwrappedPosition:q.unwrappedPosition?.map(x=>x*transform.scale)??null,
   sourceVelocityUnit:q.velocity?contract?.units??null:null,velocityUnit:q.velocity?(view.coordinateSystem==='periodic_box'?'box_length/model_time':contract?.units??null):null}))}));
 const bounds=sourcePoints.length?[0,1,2].map(j=>[Math.min(...sourcePoints.map(p=>p.position[j])),Math.max(...sourcePoints.map(p=>p.position[j]))]):null;
 const values=points.filter(p=>p.valueStatus==='DEFINED').map(p=>p.value);check(values.every(Number.isFinite),'Non-finite display values');
 check(points.every(p=>p.valueStatus==='DEFINED'||p.value===null),'Undefined observations must remain null');
 return {view,groups,visible,points,sourcePoints,paths:displayedPaths,sourceBounds:bounds,values,transform,
   displayBounds:transform.bounds??(bounds?bounds.map(b=>b.map(x=>x*transform.scale)):null)};
}
export function deriveExtendedViewContract(record,settings){
 const scene=deriveExtendedScene(record,settings),{view,points,sourcePoints,visible,values,sourceBounds:bounds,transform}=scene,r=record.result;
 const displayed=visible.reduce((n,g)=>{const limit=Math.max(1,Math.floor(view.lod/visible.length)),stride=Math.max(1,Math.ceil(g.points.length/limit));return n+g.points.filter((p,i)=>i%stride===0||p.key===view.selected).length;},0);
 return {schema:'MathScope.M3.ExtendedDisplayContract/2',basedOnResultDigest:record.resultDigest,sourcePointCount:sourcePoints.length,displayedPointCount:displayed,
  displayedSourceBounds:bounds,fullDeclaredSourceDomain:r.observations?.contract?.bounds??r.source?.baseField?.domain?.bounds??null,
  displayBounds:scene.displayBounds,coordinateSystem:view.coordinateSystem,coordinateTransform:{scale:transform.scale,velocityScale:transform.velocityScale},
  commonColorRange:values.length?[Math.min(...values),Math.max(...values)]:null,units:[...new Set(points.map(p=>p.unit))],
  positions:view.coordinateSystem==='physical'?'ORIGINAL_PHYSICAL_SAMPLE_COORDINATES':'DECLARED_PERIODIC_BOX_LINEAR_COORDINATES',spatialAxisScale:'ISOTROPIC_COMMON_EXTENT',independentColorNormalization:false,
  undefinedSourceIds:points.filter(p=>p.valueStatus!=='DEFINED').map(p=>p.key),observable:view.observable,automaticSpatialFit:r.observations?.contract?.automaticSpatialFit??null,
  vectorMultiplier:points.some(p=>p.velocity)?0.3:null,vectorNormalization:'NONE',
  periodicSlice:points.length&&r.package?.startsWith('N')?{axis:'x3',coordinate:bounds[2][0]===bounds[2][1]?bounds[2][0]:null,fullDomainIsSeparate:true}:null,
  flowPaths:scene.paths.map(p=>({id:p.id,kind:p.kind,fieldTime:p.fieldTime,parameter:p.parameter,coefficientSource:p.coefficientSource,points:p.points.length,refinement:p.refinement})),
  energyScope:r.observations?.energy?{global:r.observations.energy.global.scope,core:r.observations.energy.core.scope,coreBounds:r.observations.energy.core.bounds}:null,
  unitsConversion:'The declared coordinate and velocity scales are applied together; original source coordinates and physical values remain in the record and inspector.',
  view,mathematicalSourceChanged:false,proofAuthority:'NONE_VIEW_ONLY'};
}
