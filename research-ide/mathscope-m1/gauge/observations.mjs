import {requireCondition} from './groups.mjs';
import {evaluateField,bpstMarginal,simpson} from './fields.mjs';
function intervals(x,n,name){requireCondition(Array.isArray(x)&&x.length===n&&x.every(v=>Array.isArray(v)&&v.length===2&&v.every(w=>Number.isFinite(w)&&Math.abs(w)<=1e4)&&v[0]<v[1]),'OBSERVATION_BOUNDS',`${name} needs ${n} finite ordered intervals.`);return x.map(v=>v.slice());}
function det3(a){return a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);}
export function normalizeObservation(s,fieldSpec){
 requireCondition(s&&typeof s==='object','OBSERVATION_REQUIRED','Specify a slice, marginal or actual 3x4 linear observation.','input.observation');
 requireCondition(['SLICE','FINITE_MARGINAL','BPST_INFINITE_MARGINAL','LINEAR_PROJECTION'].includes(s.kind),'OBSERVATION_NOT_IMPLEMENTED','Unsupported observation construction.');
 requireCondition(['actionDensity','topologicalDensity','curvatureNormSquared'].includes(s.quantity),'OBSERVATION_QUANTITY','Choose a gauge-invariant density. Connection components are not accepted as an invariant scalar.');
 requireCondition(Number.isInteger(s.samplesPerAxis)&&s.samplesPerAxis>=2&&s.samplesPerAxis<=13,'OBSERVATION_GRID','samplesPerAxis must be an integer from 2 through 13.');
 const out={kind:s.kind,quantity:s.quantity,samplesPerAxis:s.samplesPerAxis,bounds:intervals(s.bounds,s.kind==='LINEAR_PROJECTION'?4:3,'observation.bounds')};
 if(s.kind==='SLICE'){requireCondition(Number.isFinite(s.slice),'SLICE_COORDINATE','Explicit x4 slice is required.');out.slice=s.slice;}
 if(s.kind==='FINITE_MARGINAL'){out.fibre=intervals([s.fibre],1,'observation.fibre')[0];requireCondition(Number.isInteger(s.panels)&&s.panels>=4&&s.panels<=64&&s.panels%2===0,'MARGINAL_QUADRATURE_BUDGET','Finite marginal panels must be an even number in 4..64.');out.panels=s.panels;}
 if(s.kind==='BPST_INFINITE_MARGINAL')requireCondition(fieldSpec.kind==='EMBEDDED_BPST','MARGINAL_FORMULA_MODEL_MISMATCH','The infinite closed marginal formula is only valid for unperturbed embedded BPST.');
 if(s.kind==='LINEAR_PROJECTION'){
  requireCondition(Array.isArray(s.matrix)&&s.matrix.length===3&&s.matrix.every(v=>Array.isArray(v)&&v.length===4&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=10)),'PROJECTION_MATRIX','A finite 3x4 matrix with entries in [-10,10] is required.');
  const kernel=Array.from({length:4},(_,j)=>((-1)**j)*det3(s.matrix.map(row=>row.filter((v,k)=>j!==k)))),norm=Math.hypot(...kernel);requireCondition(norm>1e-10,'PROJECTION_RANK','The observation matrix must have row rank 3.');out.matrix=s.matrix.map(v=>v.slice());out.fibreKernelDirection=kernel.map(v=>v/norm);
 }
 if(fieldSpec.domain.kind==='R4_WINDOW'){
  const d=fieldSpec.domain.bounds;for(let i=0;i<out.bounds.length;i++)requireCondition(out.bounds[i][0]>=d[i][0]&&out.bounds[i][1]<=d[i][1],'OBSERVATION_OUTSIDE_WINDOW','Observation samples must lie inside the recorded R4 window.');
  if(s.kind==='SLICE')requireCondition(s.slice>=d[3][0]&&s.slice<=d[3][1],'SLICE_OUTSIDE_WINDOW','Slice lies outside the recorded observation window.');
  if(s.kind==='FINITE_MARGINAL')requireCondition(out.fibre[0]>=d[3][0]&&out.fibre[1]<=d[3][1],'MARGINAL_OUTSIDE_WINDOW','The finite marginal interval must lie inside the recorded window.');
 }
 return out;
}
export function observationCost(s){const samples=s.samplesPerAxis**(s.kind==='LINEAR_PROJECTION'?4:3),evaluations=s.kind==='FINITE_MARGINAL'?samples*(s.panels+1):s.kind==='BPST_INFINITE_MARGINAL'?0:samples;return {samples,evaluations};}
function cartesian(bounds,n){let rows=[[]];for(const [a,b] of bounds){const next=[];for(const row of rows)for(let j=0;j<n;j++)next.push([...row,a+(b-a)*j/(n-1)]);rows=next;}return rows;}
export function sampleObservation(state,observation){
 const field=state.field,g=field.group,s=field.spec,o=normalizeObservation(observation,s),grid=cartesian(o.bounds,o.samplesPerAxis),samples=[],points=[],lengthFactor=state.lengthDisplayFactor,integrated=o.kind.includes('MARGINAL'),densityScale=integrated?lengthFactor**3:lengthFactor**4;
 for(let i=0;i<grid.length;i++){
  const p=grid[i];let value,position,x4=null,source;
  if(o.kind==='SLICE'){x4=[...p,o.slice];const r=evaluateField(field,x4);value=r.density[o.quantity];position=p;source={x4,density:r.density};}
  else if(o.kind==='LINEAR_PROJECTION'){x4=p;const r=evaluateField(field,x4);value=r.density[o.quantity];position=o.matrix.map(row=>row.reduce((v,w,j)=>v+w*p[j],0));source={x4,density:r.density};}
  else if(o.kind==='FINITE_MARGINAL'){
   value=simpson(t=>evaluateField(field,[...p,t]).density[o.quantity],o.fibre[0],o.fibre[1],o.panels);position=p;source={x3:p,fibre:{coordinate:3,interval:o.fibre,panels:o.panels,rule:'composite Simpson'},integratedQuantity:o.quantity,value};
  }else{value=bpstMarginal(g,s.rho,p,s.center.slice(0,3));if(o.quantity==='actionDensity')value*=8*Math.PI**2/s.coupling.g**2;else if(o.quantity==='curvatureNormSquared')value*=8*Math.PI**2;position=p;source={x3:p,fibre:{coordinate:3,domain:'R',center:s.center[3]},integratedQuantity:o.quantity,value,formulaStatus:'THEOREM_REFERENCE with independent matrix quadrature checked in evidence'};}
  samples.push(source);points.push({pos:position.map(v=>v/lengthFactor),value:value*densityScale,label:`${o.quantity} #${i}`,sourceIndex:i});
 }
 const descriptions={SLICE:`Actual pullback to x4=${o.slice}; scalar values are evaluated from the recorded 4D matrix curvature.`,LINEAR_PROJECTION:'The displayed point is P x for the explicit rank-three 3x4 matrix. Every 4D source coordinate and scalar sample is retained.',FINITE_MARGINAL:'Each displayed value is the finite integral of a gauge-invariant density along x4, using the recorded quadrature and interval.',BPST_INFINITE_MARGINAL:'The analytic infinite x4 integral of the embedded BPST scalar density; Dynkin index and length^-3 units are explicit.'};
 return {observation:o,sourceSamples:samples,visualization:{points,lines:[],axes:[0,1,2].map(i=>({label:o.kind==='LINEAR_PROJECTION'?`(P x)${i+1}`:`x${i+1}`,unit:s.units.length,direction:[+(i===0),+(i===1),+(i===2)]})),description:descriptions[o.kind]+(s.domain.kind==='PERIODIC_TORUS'?' Coordinates are lift coordinates of the periodic source; points separated by a period represent the same torus point.':''),coordinateMeaning:o.kind==='LINEAR_PROJECTION'?'P:R4 -> R3, shown in the declared display length unit':'The first three physical coordinates, expressed in the declared display length unit',valueMeaning:`${o.quantity}${integrated?' integrated along x4':''}`,valueUnits:`${s.units.length}^-${integrated?3:4}`,lostInformation:o.kind==='SLICE'?['Values away from the selected x4 slice','The slice alone cannot reconstruct a 4D connection or a quantum state']:o.kind==='LINEAR_PROJECTION'?['Position along each affine fibre x+ker(P)','Overlapping displayed points can have distinct 4D positions and field values','A 3D projection does not transfer a mass-gap theorem']:['The profile along the integrated x4 fibre','Gauge-dependent connection data',...(o.kind==='FINITE_MARGINAL'?['Tail outside the finite integration interval is omitted and is not bounded for an arbitrary off-shell field']:[])],normalization:{dynkinIndex:g.index,lengthDisplayFactor:lengthFactor,densityScale},sourceDimension:4,displayDimension:3},cost:observationCost(o)};
}
