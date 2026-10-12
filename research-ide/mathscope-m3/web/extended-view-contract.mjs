/** One exact display contract shared by the Worker verifier and visible canvas. */
function check(ok,message){if(!ok)throw new Error(message);}
export function validateExtendedView(view){
 check(view&&typeof view==='object'&&!Array.isArray(view)&&Object.keys(view).sort().join(',')==='camera,lod,selected,state','Invalid display view keys');
 const c=view.camera;check(c&&Object.keys(c).sort().join(',')==='pitch,yaw,zoom','Invalid camera keys');
 check(Number.isFinite(c.yaw)&&Math.abs(c.yaw)<=1e6&&Number.isFinite(c.pitch)&&c.pitch>=-1.45&&c.pitch<=1.45&&Number.isFinite(c.zoom)&&c.zoom>=.45&&c.zoom<=3,'Camera is outside supported bounds');
 check([250,1000].includes(view.lod),'Unsupported display point budget');
 check(typeof view.state==='string'&&/^(all|[0-3])$/.test(view.state),'Invalid visible state');
 check(view.selected===null||(typeof view.selected==='string'&&/^[0-3]:[0-9]{1,3}$/.test(view.selected)),'Invalid original point ID');
 return {camera:{yaw:c.yaw,pitch:c.pitch,zoom:c.zoom},lod:view.lod,selected:view.selected,state:view.state};
}
export function deriveExtendedViewContract(record,settings){
 const view=validateExtendedView(settings),r=record.result;let groups=[];
 if(Array.isArray(r.states))groups=r.states.map((s,i)=>({id:String(i),points:s.points.map((p,j)=>({key:i+':'+(p.index??j),position:p.position,value:p.value,unit:p.unit,velocity:p.velocity??null}))}));
 else if(r.observations?.samples?.length)groups=[{id:'0',points:r.observations.samples.map((p,j)=>({key:'0:'+j,position:p.position,value:p.speed??p.value,unit:r.observations.contract?.units??'',velocity:p.velocity??null}))}];
 const points=groups.flatMap(g=>g.points),visible=groups.filter(g=>view.state==='all'||g.id===view.state);
 check(view.state==='all'||groups.some(g=>g.id===view.state),'The selected state is absent from this source');
 check(view.selected===null||points.some(p=>p.key===view.selected),'The selected point is absent from this source');
 const bounds=points.length?[0,1,2].map(j=>[Math.min(...points.map(p=>p.position[j])),Math.max(...points.map(p=>p.position[j]))]):null;
 const values=points.map(p=>p.value);check(values.every(Number.isFinite),'Non-finite display values');
 const displayed=visible.reduce((n,g)=>{const limit=Math.max(1,Math.floor(view.lod/visible.length)),stride=Math.max(1,Math.ceil(g.points.length/limit));return n+g.points.filter((p,i)=>i%stride===0||p.key===view.selected).length;},0);
 return {schema:'MathScope.M3.ExtendedDisplayContract/1',basedOnResultDigest:record.resultDigest,sourcePointCount:points.length,displayedPointCount:displayed,
  displayedSourceBounds:bounds,fullDeclaredSourceDomain:r.observations?.contract?.bounds??r.source?.baseField?.domain?.bounds??null,
  commonColorRange:values.length?[Math.min(...values),Math.max(...values)]:null,units:[...new Set(points.map(p=>p.unit))],
  positions:'ORIGINAL_PHYSICAL_SAMPLE_COORDINATES',spatialAxisScale:'ISOTROPIC_COMMON_EXTENT',independentColorNormalization:false,
  vectorMultiplier:points.some(p=>p.velocity)?0.3:null,vectorNormalization:'NONE',
  periodicSlice:points.length&&r.package?.startsWith('N')?{axis:'x3',coordinate:bounds[2][0]===bounds[2][1]?bounds[2][0]:null,fullDomainIsSeparate:true}:null,
  unitsConversion:'Original physical points are displayed. Requested unit conversion, when present, is recorded separately in state displaySamples/displayTransform.',
  view,mathematicalSourceChanged:false,proofAuthority:'NONE_VIEW_ONLY'};
}
