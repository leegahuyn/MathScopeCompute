/** Actual four-dimensional Wilson lattices, using M1 faithful matrix representations. */
import * as M from '../../mathscope-m1/gauge/matrix.mjs';
import {createGroup,groupElementResidual,inner,coordinates,fromCoordinates,detailedDescriptor} from '../../mathscope-m1/gauge/groups.mjs';
import {createField,evaluateJet,curvatureFromJet} from '../../mathscope-m1/gauge/fields.mjs';
import {linkTransport} from '../../mathscope-m1/gauge/holonomy.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';
import {REVISION,check,rngFromSeed,latticeEstimate,assertBudget,yieldToRuntime} from './contracts.mjs';

export function haarSU2(rng){
  const q=Array.from({length:4},()=>rng.normal()),norm=Math.hypot(...q);check(norm>0&&Number.isFinite(norm),'FAILED','Haar quaternion generation left the finite domain.');
  const [a,b,c,d]=q.map(x=>x/norm),u=M.matrix(2);u.re.set([a,c,-c,a]);u.im.set([d,b,b,-d]);return u;
}
export function randomExponential(group,rng,step=1){
  const coefficients=Array.from({length:group.dimension},()=>step*(2*rng.uniform()-1)/Math.sqrt(group.dimension));
  return M.exponential(fromCoordinates(group,coefficients));
}
export function createGeometry(lattice,beta=1){
  const sizes=[lattice.Ns,lattice.Ns,lattice.Ns,lattice.Nt],spacings=[lattice.as,lattice.as,lattice.as,lattice.at],boundary=[lattice.spatialBoundary,lattice.spatialBoundary,lattice.spatialBoundary,lattice.temporalBoundary],V=sizes.reduce((a,b)=>a*b,1),xi=lattice.as/lattice.at;
  const index=p=>p[0]+sizes[0]*(p[1]+sizes[1]*(p[2]+sizes[2]*p[3]));
  const coords=site=>{const p=[];for(let j=0;j<4;j++){p.push(site%sizes[j]);site=Math.floor(site/sizes[j]);}return p;};
  const coordinateCache=Array.from({length:V},(_,site)=>coords(site));
  const neighbor=(site,mu,sign=1)=>{const p=coordinateCache[site].slice();p[mu]+=sign;if(p[mu]<0||p[mu]>=sizes[mu]){if(boundary[mu]==='OPEN')return -1;p[mu]=(p[mu]+sizes[mu])%sizes[mu];}return index(p);};
  const active=[],linkById=Array(V*4).fill(null),affectedByLink=Array.from({length:V*4},()=>[]),plaquettes=[];
  for(let site=0;site<V;site++)for(let mu=0;mu<4;mu++){const end=neighbor(site,mu);if(end!==-1){const link={id:site*4+mu,site,end,mu};active.push(link);linkById[link.id]=link;}}
  const path=(start,directions)=>{let site=start;const edges=[];for(const signed of directions){const mu=Math.abs(signed)-1,sign=Math.sign(signed),end=neighbor(site,mu,sign);if(end===-1)return null;const id=sign>0?site*4+mu:end*4+mu;edges.push({id,inverse:sign<0});site=end;}return {edges,start,end:site};};
  for(let site=0;site<V;site++)for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
    const loop=path(site,[mu+1,nu+1,-mu-1,-nu-1]);if(!loop)continue;
    const p={index:plaquettes.length,site,mu,nu,edges:loop.edges,weight:beta*(nu===3?xi:1/xi)};plaquettes.push(p);for(const id of new Set(p.edges.map(e=>e.id)))affectedByLink[id].push(p.index);
  }
  return {lattice,sizes,spacings,boundary,V,xi,index,coords:site=>coordinateCache[site].slice(),neighbor,active,linkById,affectedByLink,plaquettes,path,physical:site=>coordinateCache[site].map((n,j)=>lattice.origin[j]+n*spacings[j]),cellVolume:lattice.as**3*lattice.at};
}
export function edgeProduct(links,edges,dimension){let product=M.identity(dimension);for(const e of edges){const u=links[e.id];check(u,'INVALID_INPUT','An oriented path references an absent lattice link.');product=M.multiply(product,e.inverse?M.dagger(u):u);}return product;}
export function pathHolonomy(configuration,start,directions){
  check(Number.isInteger(start)&&start>=0&&start<configuration.geometry.V,'INVALID_INPUT','Path start must be a valid site index.');
  check(Array.isArray(directions)&&directions.length<=4096&&directions.every(v=>Number.isInteger(v)&&v!==0&&Math.abs(v)<=4),'INVALID_INPUT','A path uses signed directions ±1, ±2, ±3, ±4; an empty path is permitted.');
  const path=configuration.geometry.path(start,directions);check(path,'INVALID_INPUT','The path exits an open boundary.');
  return {...path,matrix:edgeProduct(configuration.links,path.edges,configuration.group.matrixDimension),closed:path.end===start};
}
export function plaquetteMatrix(configuration,p){return edgeProduct(configuration.links,p.edges,configuration.group.matrixDimension);}
export function plaquetteTerm(configuration,p){return p.weight*(1-M.trace(plaquetteMatrix(configuration,p)).re/configuration.group.matrixDimension);}
export function action(configuration){return configuration.geometry.plaquettes.reduce((sum,p)=>sum+plaquetteTerm(configuration,p),0);}
function decodeMatrix(value,dimension){
  check(value&&value.n===dimension&&Array.isArray(value.re)&&Array.isArray(value.im)&&value.re.length===dimension**2&&value.im.length===dimension**2&&value.re.every(Number.isFinite)&&value.im.every(Number.isFinite),'INVALID_INPUT','Each explicit link requires the correct finite complex matrix shape.');
  const u=M.matrix(dimension);u.re.set(value.re);u.im.set(value.im);return u;
}
export function serializeLinks(configuration){return configuration.links.map(u=>u?M.jsonMatrix(u):null);}
export async function configurationHash(configuration,modelHash){return sha256({modelHash,links:serializeLinks(configuration)});}
export function modelDescriptor(input,group=createGroup(input.group)){
  const c=group.metricTraceFactor,d=group.matrixDimension,xi=input.lattice.as/input.lattice.at;
  return {schema:'MathScope.M2.FiniteWilsonModel/1',group:group.spec,groupExactDataHash:group.data.dataSha256,lattice:input.lattice,action:{kind:'WILSON_REAL_CHARACTER',representation:group.spec.representation,dimension:d,beta:input.beta,anisotropy:xi,spatialCoefficient:input.beta/xi,temporalCoefficient:input.beta*xi,invariantForm:`B_G(X,Y)=-${c} Re Tr_R(XY)`,metricTraceFactor:c,traceIndexRelativeToB:1/c,bareCouplingSquared:input.beta>0?2*d*c/input.beta:null,couplingConvention:'beta=2 dim(R)c/g0²; beta_s=beta at/as; beta_t=beta as/at. This is a bare tree-level normalization, not a renormalized scale determination.',scaleSetting:'UNDETERMINED; representation, coupling, volume or spacing changes produce a different model hash.'},measure:'PRODUCT_NORMALIZED_HAAR_ON_ALL_ACTIVE_POSITIVE_LINKS',continuumLimit:'NOT_TAKEN',quantumR4Theory:'NOT_CONSTRUCTED'};
}
export function descriptor(configuration){
  const {geometry:g,group}=configuration,l=g.lattice,est=latticeEstimate(l,group),sumWeights=g.plaquettes.reduce((s,p)=>s+p.weight,0),logLower=-2*sumWeights,lower=Math.exp(logLower);
  return {...est,Ns:l.Ns,Nt:l.Nt,spacing:{space:l.as,euclideanTime:l.at,unit:l.lengthUnit},physicalExtents:{L:l.Ns*l.as,T:l.Nt*l.at,unit:l.lengthUnit,openSiteSpan:{space:(l.Ns-1)*l.as,euclideanTime:(l.Nt-1)*l.at},convention:'L=Ns as and T=Nt at denote cell extents; an open lattice has Ns (Nt) sites and a smaller last-site coordinate span.'},siteCount:g.V,plaquetteCount:g.plaquettes.length,anisotropy:g.xi,boundary:{space:l.spatialBoundary,euclideanTime:l.temporalBoundary},orientation:'U_xy maps the y fibre to x; reverse link U_yx=U_xy†; products follow the listed path from left to right.',storage:{kind:'DENSE_COMPLEX_FLOAT64_POSITIVE_LINKS',shape:[g.V,4,group.matrixDimension,group.matrixDimension],absentOutwardLinks:'null only at OPEN boundaries',sourceDownsampled:false},actionBound:{lower:0,upper:2*sumWeights,derivation:'A unitary d-dimensional representation has -1 <= Re Tr(U)/d <= 1; every nonnegative plaquette coefficient w contributes in [0,2w].'},partitionFunction:{normalization:'Z=∫ exp(-S) ∏links dHaar(U), with every Haar factor normalized to 1.',logLowerBound:logLower,lowerBoundFloat64:lower>0?lower:null,lowerBoundUnderflow:lower===0,upperBound:1,isotropicFormula:'exp(-2 beta Np) <= Z <= 1 when as=at',existenceScope:'A finite product of compact groups with continuous bounded Wilson action; no continuum or infinite-volume construction.'}};
}
function trapezoidalTransport(field,x,y,steps){let u=M.identity(field.group.matrixDimension);const dx=y.map((v,j)=>(v-x[j])/steps);for(let k=0;k<steps;k++){const a=x.map((v,j)=>v+k*dx[j]),b=a.map((v,j)=>v+dx[j]),A=evaluateJet(field,a,{order:0}).A,B=evaluateJet(field,b,{order:0}).A,h=M.matrix(u.n);for(let j=0;j<4;j++)M.addTo(h,M.add(A[j],B[j]),dx[j]/2);u=M.multiply(u,M.exponential(h));}return u;}
export async function createConfiguration(input,context={}){
  const group=createGroup(input.group),geometry=createGeometry(input.lattice,input.beta),links=Array(geometry.V*4).fill(null),initial=input.initial??{kind:'IDENTITY'},rng=rngFromSeed(initial.seed??'no-random-initializer'),field=initial.kind==='CLASSICAL_FIELD'?createField(group,initial.field):null;
  assertBudget(latticeEstimate(input.lattice,group),{maxBytes:context.budget?.maxBytes});
  let frames=null;if(initial.kind==='PURE_GAUGE')frames=Array.from({length:geometry.V},()=>randomExponential(group,rng,1.2));
  const numericalError={method:field?'COMPOSITE_MIDPOINT_EXPONENTIAL_ORDERED_PRODUCT':'NO_CONTINUUM_DISCRETIZATION',checkedLinkCount:0,midpointRefinementDifference:0,trapezoidalDifference:0,exponentialSemigroupResidual:0,groupMembershipResidual:0,certifiedErrorBound:false,boundary:field?'The source is restricted to the explicit domain; no global window-tail error bound is asserted.':'The finite lattice boundary is part of the model, not a continuum approximation error.'};
  for(let k=0;k<geometry.active.length;k++){
    context.checkCancelled?.();const edge=geometry.active[k],{site,end,mu,id}=edge;let u;
    if(initial.kind==='IDENTITY')u=M.identity(group.matrixDimension);
    else if(initial.kind==='PURE_GAUGE')u=M.multiply(frames[site],M.dagger(frames[end]));
    else if(initial.kind==='SEEDED_EXPONENTIAL')u=randomExponential(group,rng,1.2);
    else if(initial.kind==='HOT_HAAR')u=haarSU2(rng);
    else if(initial.kind==='CENTER_HOLONOMY'){
      const atSeam=mu===3&&geometry.coords(site)[3]===geometry.sizes[3]-1,theta=atSeam?2*Math.PI*initial.centerPower/group.spec.parameter:0;u=M.scale(M.identity(group.matrixDimension),Math.cos(theta),Math.sin(theta));
    }else if(initial.kind==='EXPLICIT_LINKS')u=decodeMatrix(initial.links[id],group.matrixDimension);
    else if(field){
      const x=geometry.physical(site),y=x.slice();y[mu]+=geometry.spacings[mu];u=linkTransport(field,x,y,initial.transportSteps);
      if(k<24){
        const fine=linkTransport(field,x,y,initial.transportSteps*2),trap=trapezoidalTransport(field,x,y,initial.transportSteps),A=evaluateJet(field,x,{order:0}).A[mu],h=M.scale(A,geometry.spacings[mu]/initial.transportSteps),e=M.exponential(h),half=M.exponential(M.scale(h,.5));
        numericalError.checkedLinkCount++;numericalError.midpointRefinementDifference=Math.max(numericalError.midpointRefinementDifference,M.distance(u,fine));numericalError.trapezoidalDifference=Math.max(numericalError.trapezoidalDifference,M.distance(u,trap));numericalError.exponentialSemigroupResidual=Math.max(numericalError.exponentialSemigroupResidual,M.distance(e,M.multiply(half,half)));
      }
    }
    check(u,'FAILED','The selected initializer did not construct a link.');const residual=groupElementResidual(group,u).max;check(residual<=1e-9,'INVALID_INPUT',`Link ${id} is not in the selected faithful compact-group representation within tolerance (residual ${residual}).`);numericalError.groupMembershipResidual=Math.max(numericalError.groupMembershipResidual,residual);links[id]=u;
    if(k%128===127)await yieldToRuntime(context,{phase:'lattice-links',completed:k+1,total:geometry.active.length});
  }
  if(initial.kind==='EXPLICIT_LINKS')for(let id=0;id<links.length;id++)if(!geometry.linkById[id])check(initial.links[id]===null,'INVALID_INPUT','An outward open-boundary link must be null, not an extra stored group degree of freedom.');
  return {group,geometry,links,initial,numericalError};
}
export function transformConfiguration(configuration,frames){
  const {group,geometry}=configuration;check(Array.isArray(frames)&&frames.length===geometry.V,'INVALID_INPUT','A gauge transformation requires one actual group matrix per site.');
  for(const u of frames)check(groupElementResidual(group,u).max<=1e-9,'INVALID_INPUT','Site frame is not an element of the selected group.');
  const links=Array(geometry.V*4).fill(null);for(const {id,site,end} of geometry.active)links[id]=M.multiply(M.multiply(frames[site],configuration.links[id]),M.dagger(frames[end]));return {...configuration,links};
}
export function gaugeDiagnostics(configuration,seed='m2-gauge-invariance'){
  const {group,geometry}=configuration,rng=rngFromSeed(seed),frames=Array.from({length:geometry.V},()=>randomExponential(group,rng,1.1)),transformed=transformConfiguration(configuration,frames);
  let maxLoopCovariance=0,maxTraceDifference=0;for(const p of geometry.plaquettes){const U=plaquetteMatrix(configuration,p),V=plaquetteMatrix(transformed,p),target=M.conjugate(frames[p.site],U);maxLoopCovariance=Math.max(maxLoopCovariance,M.relativeDistance(V,target));maxTraceDifference=Math.max(maxTraceDifference,Math.abs(M.trace(V).re-M.trace(U).re)/group.matrixDimension);}
  const before=action(configuration),after=action(transformed),normalizedActionDifference=Math.abs(before-after)/Math.max(1,Math.abs(before),Math.abs(after)),tolerance=1e-10;
  return {seed,scope:'All plaquettes and total action of this actual Float64 configuration, under arbitrary seeded full-basis site transformations.',maxLoopCovariance,maxNormalizedTraceDifference:maxTraceDifference,actionBefore:before,actionAfter:after,normalizedActionDifference,tolerance,passed:Math.max(maxLoopCovariance,maxTraceDifference,normalizedActionDifference)<=tolerance,exactGroupLawSupport:{source:'../../mathscope-m1/gauge/lean/MathScope/M1/Gauge/Transport.lean',theorem:'MathScope.M1.Gauge.GroupLaw.adjacent_transport_covariance',historicalAudit:'../../mathscope-m1/gauge/lean/transport-audit.log',application:'Repeated adjacent endpoint cancellation gives path covariance; closed paths are conjugated at the basepoint.',newKernelRun:false}};
}
export function fieldStrengthAt(configuration,site,mu,nu,measurement='PLAQUETTE'){
  const {geometry:g,group}=configuration,a=mu+1,b=nu+1,paths=measurement==='CLOVER'?[[a,b,-a,-b],[b,-a,-b,a],[-a,-b,a,b],[-b,a,b,-a]]:[[a,b,-a,-b]],q=M.matrix(group.matrixDimension);
  for(const dirs of paths){const path=g.path(site,dirs);if(!path)return null;M.addTo(q,edgeProduct(configuration.links,path.edges,group.matrixDimension));}
  const anti=M.scale(M.addTo(M.clone(q),M.dagger(q),-1),1/(2*paths.length*g.spacings[mu]*g.spacings[nu]));
  // The antisymmetric part of a group matrix need not belong to an exceptional Lie algebra.
  // Orthogonal projection onto the complete M1 basis is therefore essential for general G.
  return fromCoordinates(group,coordinates(group,anti));
}
export function measure(configuration,measurement='PLAQUETTE',{includeSites=true,topology=true}={}){
  const {geometry:g,group}=configuration,d=group.matrixDimension,plaquettes=[],siteAction=Array(g.V).fill(0);let total=0,meanP=0;
  for(const p of g.plaquettes){const u=plaquetteMatrix(configuration,p),tr=M.trace(u),value=tr.re/d,term=p.weight*(1-value);total+=term;meanP+=value;siteAction[p.site]+=term;plaquettes.push({index:p.index,site:p.site,axes:[p.mu,p.nu],normalizedRealTrace:value,normalizedImaginaryTrace:tr.im/d,actionTerm:term,coefficient:p.weight});}
  meanP/=g.plaquettes.length;const sites=[];let Q=0,energy=0,completeSites=0;
  if(includeSites||topology)for(let site=0;site<g.V;site++){
    const F=Array.from({length:4},()=>Array(4).fill(null));let complete=true,e=0;
    if(topology)for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){F[mu][nu]=fieldStrengthAt(configuration,site,mu,nu,measurement);if(F[mu][nu])e+=inner(group,F[mu][nu],F[mu][nu]);else complete=false;}
    let q=null;if(topology&&complete){q=(inner(group,F[0][1],F[2][3])-inner(group,F[0][2],F[1][3])+inner(group,F[0][3],F[1][2]))/(4*Math.PI**2);Q+=q*g.cellVolume;energy+=e*g.cellVolume;completeSites++;}
    if(includeSites)sites.push({site,index4:g.coords(site),coordinate4:g.physical(site),actionDensity:siteAction[site]/g.cellVolume,topologicalDensity:q,curvatureEnergyDensity:complete&&topology?e:null,completeCurvatureStencil:complete&&topology});
  }
  const polyakov=[];if(g.boundary[3]==='PERIODIC')for(let site=0;site<g.V;site++)if(g.coords(site)[3]===0){const loop=pathHolonomy(configuration,site,Array(g.sizes[3]).fill(4)),tr=M.trace(loop.matrix);polyakov.push({site,normalizedTrace:{re:tr.re/d,im:tr.im/d}});}
  return {action:total,meanPlaquette:meanP,plaquetteCount:g.plaquettes.length,plaquettes,sites,polyakovLoops:polyakov,meanPolyakovReal:polyakov.length?polyakov.reduce((s,p)=>s+p.normalizedTrace.re,0)/polyakov.length:null,topology:{estimator:measurement,rawCharge:completeSites?Q:null,integerCertificate:'NOT_AVAILABLE',roundedCharge:null,completeSiteCount:completeSites,totalSiteCount:g.V,boundaryStencilIncomplete:completeSites<g.V,curvatureEnergyIntegral:completeSites?energy:null,finiteSpacingOrder:measurement==='CLOVER'?'O(a²) for a smooth field, symmetric interior/periodic stencil':'O(a) as a basepoint curvature estimator for a smooth field; plaquette action has its separate continuum expansion',projection:'Orthogonal projection of (U-U†)/(2 area) onto the full actual Lie algebra with B_G.',interpretation:'A real finite-spacing estimator; rough-link values and open-stencil omissions do not certify integer topology or topological sector mixing.'}};
}
export function visualizeLattice(configuration,measured,view,sourceHash){
  const {geometry:g}=configuration,chosen=measured.sites.filter(p=>p.index4[3]===view.timeSlice&&p.index4.slice(0,3).every(n=>n%view.stride===0)),points=[],lines=[];
  for(const p of chosen){const value=p[view.quantity];if(value===null)continue;points.push({pos:p.coordinate4.slice(0,3),value,label:`site ${p.site} · ${view.quantity}=${value.toPrecision(5)}`,sourceIndex:p.site,sourceField:`sites[${p.site}].${view.quantity}`,sourceCoordinate4:p.coordinate4});}
  const visible=new Map(points.map(p=>[p.sourceIndex,p]));for(const p of points)for(let mu=0;mu<3;mu++){const start=g.coords(p.sourceIndex);if(start[mu]+view.stride>=g.sizes[mu])continue;const end=start.slice();end[mu]+=view.stride;const next=visible.get(g.index(end));if(next)lines.push({points:[p.pos,next.pos],sourceSites:[p.sourceIndex,next.sourceIndex],kind:view.stride===1?'ACTUAL_NEIGHBOR_GEOMETRY':'DISPLAY_LOD_CONNECTION'});}
  const values=points.map(p=>p.value),unit=`${g.lattice.lengthUnit}^-4`;
  return {kind:'LATTICE_SCALAR_SLICE',points,lines,axes:[0,1,2].map(i=>({label:`x${i+1}`,unit:g.lattice.lengthUnit,sourceField:`sites[*].coordinate4[${i}]`,scale:'linear',type:'PHYSICAL_SPACE_COORDINATE',direction:[+(i===0),+(i===1),+(i===2)]})),description:`Actual ${view.quantity} on x4=${g.lattice.origin[3]+view.timeSlice*g.lattice.at} ${g.lattice.lengthUnit}. x4 is Euclidean time.`,coordinateMeaning:'The first three physical coordinates of a fixed Euclidean-time lattice slice; spatial periodic seams are described in the source, not drawn as long crossing lines.',valueMeaning:view.quantity,valueUnits:unit,colorScale:{type:'linear',domain:values.length?[Math.min(...values),Math.max(...values)]:[0,1],sourceField:`sites[*].${view.quantity}`},sourceDimension:4,displayDimension:3,sourceHash,sourcePath:'measurements.sites',observation:{kind:'EXACT_DISCRETE_X4_SLICE',timeIndex:view.timeSlice,stride:view.stride,quantity:view.quantity,sourceDownsampled:false},lostInformation:['Other Euclidean-time slices','Raw group links and matrix orientation are retained in source.links but not reconstructible from scalar values','Display stride omits sites only from the view; the model, links, ensemble and action remain unchanged'],reconstruction:{enabled:false,reason:'A scalar slice is not an injective observation of gauge links.'},emptyState:points.length?null:'The selected quantity has no complete curvature stencil on this slice. Choose actionDensity, a periodic boundary, or a larger open lattice.'};
}
export async function runLattice(input,context={}){
  const configuration=await createConfiguration(input,context);context.checkCancelled?.();const model=modelDescriptor(input,configuration.group),modelHash=await sha256(model),sourceHash=await configurationHash(configuration,modelHash),measurements=measure(configuration,input.measurement),gaugeCheck=gaugeDiagnostics(configuration,input.gaugeCheckSeed);
  const visualization=visualizeLattice(configuration,measurements,input.view,sourceHash);visualization.observationHash=await sha256({sourceHash,observation:visualization.observation});
  const normalizedInput={...input};delete normalizedInput.view;
  return {status:gaugeCheck.passed?'COMPLETED':'FAILED',evidenceGrade:'NUMERIC_VALIDATED',model,modelHash,sourceHash,runHash:await sha256(normalizedInput),lattice:descriptor(configuration),group:detailedDescriptor(configuration.group),source:{schema:'MathScope.M2.LatticeConfiguration/1',modelHash,sourceHash,links:serializeLinks(configuration),initial:configuration.initial},measurements,gaugeCheck,numericalError:configuration.numericalError,visualization,checks:[{id:'Y3-orientation-and-gauge',ok:gaugeCheck.passed,evidence:'All plaquette holonomies and the full Wilson action were recomputed after the seeded site gauge transformation.'},{id:'Y3-action-bound',ok:measurements.action>=-1e-10&&measurements.action<=descriptor(configuration).actionBound.upper+1e-10}],blockers:gaugeCheck.passed?[]:['The actual configuration failed gauge covariance at the configured tolerance.'],mathematicalScope:'A finite four-dimensional Wilson lattice in the selected faithful compact matrix group. Float64 checks are not a continuum construction.'};
}
export async function runRefinement(input,context={}){
  const field=createField(createGroup(input.group),input.field),reference=curvatureFromJet(evaluateJet(field,input.origin,{order:1})),levels=[];
  for(let level=0;level<input.levels;level++){
    context.checkCancelled?.();const a=input.spacing/2**level,lattice={Ns:3,Nt:3,as:a,at:a,spatialBoundary:'OPEN',temporalBoundary:'OPEN',lengthUnit:field.spec.units.length,origin:input.origin},local={group:input.group,lattice,beta:2*field.group.matrixDimension*field.group.metricTraceFactor/field.spec.coupling.g**2,initial:{kind:'CLASSICAL_FIELD',field:input.field,transportSteps:input.transportSteps}};
    // Only the six elementary loops at the fixed physical basepoint are needed for this oracle.
    let squaredError=0,referenceSquared=0,transportDifference=0,trapezoidalDifference=0,membership=0;
    for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
      const vertices=[input.origin.slice(),input.origin.slice(),input.origin.slice(),input.origin.slice(),input.origin.slice()];vertices[1][mu]+=a;vertices[2][mu]+=a;vertices[2][nu]+=a;vertices[3][nu]+=a;
      let U=M.identity(field.group.matrixDimension),fine=M.identity(field.group.matrixDimension),trap=M.identity(field.group.matrixDimension);
      for(let e=0;e<4;e++){U=M.multiply(U,linkTransport(field,vertices[e],vertices[e+1],input.transportSteps));fine=M.multiply(fine,linkTransport(field,vertices[e],vertices[e+1],input.transportSteps*2));trap=M.multiply(trap,trapezoidalTransport(field,vertices[e],vertices[e+1],input.transportSteps));}
      const anti=M.scale(M.addTo(M.clone(U),M.dagger(U),-1),1/(2*a*a)),F=fromCoordinates(field.group,coordinates(field.group,anti));squaredError+=M.distance(F,reference[mu][nu])**2;referenceSquared+=M.frobenius(reference[mu][nu])**2;transportDifference=Math.max(transportDifference,M.distance(U,fine));trapezoidalDifference=Math.max(trapezoidalDifference,M.distance(U,trap));membership=Math.max(membership,groupElementResidual(field.group,U).max);
    }
    levels.push({level,spacing:a,rhoOverA:field.spec.rho?field.spec.rho/a:null,curvatureAbsoluteError:Math.sqrt(squaredError),curvatureRelativeError:Math.sqrt(squaredError)/Math.max(1,Math.sqrt(referenceSquared)),midpointRefinementDifference:transportDifference,trapezoidalDifference,groupMembershipResidual:membership});
    await yieldToRuntime(context,{phase:'classical-lattice-refinement',completed:level+1,total:input.levels});
  }
  const decreases=levels.slice(1).every((row,i)=>row.curvatureAbsoluteError<levels[i].curvatureAbsoluteError),sourceHash=await sha256({revision:REVISION,input,levels});
  return {status:'COMPLETED',evidenceGrade:'NUMERIC_VALIDATED',sourceHash,fieldSpec:field.spec,group:detailedDescriptor(field.group),levels,convergence:{observedDecrease:decreases,observedOrders:levels.slice(1).map((row,i)=>Math.log2(levels[i].curvatureAbsoluteError/row.curvatureAbsoluteError)),expected:'O(a) for a forward plaquette curvature compared at its basepoint',analyticReference:'M1 analytic derivatives dA+[A,A] at the fixed physical four-coordinate point, independent of the transport path approximation.',certifiedGlobalContinuumError:false},visualization:{kind:'NUMERICAL_CONVERGENCE',points:levels.map((row,i)=>({pos:[row.spacing,row.curvatureAbsoluteError,0],value:row.curvatureAbsoluteError,label:`a=${row.spacing}, error=${row.curvatureAbsoluteError.toPrecision(5)}`,sourceIndex:i,sourceField:`levels[${i}].curvatureAbsoluteError`})),lines:[{points:levels.map(row=>[row.spacing,row.curvatureAbsoluteError,0])}],axes:[{label:'lattice spacing a',unit:field.spec.units.length,type:'PHYSICAL_LENGTH',scale:'linear'},{label:'curvature error',unit:`${field.spec.units.length}^-2`,type:'NUMERIC_ERROR',scale:'linear'},{label:'display plane',unit:'none',type:'CATEGORICAL_LAYOUT',scale:'linear'}],description:'Measured refinement of the same classical source at the same physical basepoint. This compares actual group-valued path integrals with analytic curvature.',sourceHash,sourcePath:'levels',lostInformation:['Only the six local oriented plaquettes are compared; no full-volume continuum limit is certified.'],reconstruction:{enabled:false}},checks:[{id:'Y3-07-rho-over-a-refinement',ok:decreases,evidence:levels}],blockers:decreases?[]:['The selected refinement window did not show monotonic error decrease; inspect resolution and source rather than claiming convergence.']};
}
