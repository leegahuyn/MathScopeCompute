/** A source-contract, fail-closed 81-label x two-sign Signed field assembler.
 *
 * This generic kernel DOES NOT certify a private original source instance.
 * The only original entry point is original-signed-162-bridge.mjs, which
 * calls the repository's private Forced seal, generates the Signed source
 * candidate, and immediately consumes it. In particular the 162 indexed
 * rows are AST nodes, NOT evaluated numerical samples or a complete M3 proof.
 */
export const SIGNED_162_SCHEMA = 'MathScope.N6.GenericSigned162IndexedCandidate/1';
const names=['rr','rtheta','rz','thetatheta','thetaz','zz'];
const err=(code,message)=>{throw Object.assign(new Error(message),{code});};
const root=(G,id,label)=>{if(!Number.isSafeInteger(id)||id<0||!G.nodes?.[id])err('MISSING_ACTUAL_SOURCE_ROOT',label);return id;};
const vec=(G,ids,n,label)=>{
  if(!Array.isArray(ids)||ids.length!==n)err('INCOMPLETE_SOURCE_VECTOR',label);
  ids.forEach((id,j)=>root(G,id,`${label}[${j}]`));return ids;
};
const uniqueBy=(rows,selector)=>new Set(rows.map(selector)).size===rows.length;
const useFunctions=(s)=>{
  const list=['assertForced','assertInitialized','complex','reconstruct','covariance','guard','refreshMean','physicalPDE'];
  if(!s||list.some(k=>typeof s[k]!=='function'))err('MISSING_ORIGINAL_SERVICES','Original graph methods must be supplied through a repository bridge.');
};
function checkTemplateInventory(forced){
  const ts=forced?.templates;
  if(!Array.isArray(ts)||ts.length!==10||!uniqueBy(ts,x=>x.key))err('INCOMPLETE_SIGN_DIFFERENCE_TEMPLATES','Ten unique original sign/difference templates required.');
  for(let signIndex=0;signIndex<2;signIndex++){
    const members=ts.filter(t=>t.signIndex===signIndex).sort((a,b)=>a.levelDifference-b.levelDifference);
    if(members.length!==5||members.some((t,j)=>t.levelDifference!==j||t.key!==`${j}:${t.sign}`||!t.lift))
      err('MISSING_COVERING_DIFFERENCE','Preserve all five ORIGINAL fixed difference branches per sign.');
  }
  return ts;
}
function checkOriginalCover(forced){
  const templates=checkTemplateInventory(forced);
  const signForIndex=new Map([0,1].map(j=>[j,templates.find(t=>t.signIndex===j).sign]));
  const pressure=forced?.input?.mean?.temporal?.pressure,cover=pressure?.cover;
  if(!cover||!Array.isArray(cover.rows)||cover.rows.length!==81||!uniqueBy(cover.rows,r=>r.key)||
     !Array.isArray(cover.bands)||!cover.proof?.allCrossLabelProductsVanish||!cover.proof?.localFinitenessAndFlatJoins||
     !cover.proof?.exactSourceAuthority)
    err('UNVERIFIED_OR_INCOMPLETE_ORIGINAL_COVER','The original 81-box common cover and flat-join proof are required.');
  const rows=[];
  for(const r of cover.rows){
    if(!r.label||!Array.isArray(r.label.grid)||r.label.grid.length!==3||!Array.isArray(r.guards)||
      !Array.isArray(r.signs)||r.signs.length!==2||!uniqueBy(r.signs,s=>s.sourceLocalRow)||
      !r.signs.every(s=>[0,1].includes(s.sourceLocalRow)&&s.sign===signForIndex.get(s.sourceLocalRow)&&
        Array.isArray(s.rectangle?.center)&&s.rectangle.center.length===2&&
        Array.isArray(s.rectangle?.copy)&&s.rectangle.copy.length===2))
      err('BAD_ORIGINAL_COVER_ROW','Each original label needs exactly two complete signed source rows and guards.');
    const b=cover.bands[r.relativeBand+1];
    if(!b||b.delta===undefined)err('MISSING_ORIGINAL_BAND_DIFFERENCE','The source palette difference was discarded.');
    for(const s of r.signs)rows.push({label:r.label.key,signIndex:s.sourceLocalRow,fixedDifference:b.delta});
  }
  if(rows.length!==162||!uniqueBy(rows,r=>`${r.label}:${r.signIndex}`))err('DUPLICATE_OR_MISSING_SIGNED_ROW','Every original label/sign pair must occur once.');
  return {pressure,cover,verifiedIndex:rows};
}
function localMap(G,forced,t,body){
  const orig=forced.input.mean.temporal.pressure.current,
    {Xrep,etaRep,sRep,v}=orig.band.coordinates,
    at=orig.representative?.roots;
  if(!at)err('MISSING_FIXED_ORIGINAL_REPRESENTATIVE','Use the original frozen representative.');
  [Xrep,etaRep,sRep,v,orig.band.cutoffs.xi,t.lift.xi,t.lift.v,at.X,at.eta,at.s].forEach(x=>root(G,x,'original reference or local lift'));
  return G.simultaneousSubstitute(
    G.simultaneousSubstitute(body,[Xrep,etaRep,sRep],[at.X,at.eta,at.s]),
    [orig.band.cutoffs.xi,v],[t.lift.xi,t.lift.v]);
}
function complexPositive(G,C,candidate,forced,t){
  const row=candidate.signed.rows[t.signIndex],half=G.q(1,2),
    lift=id=>localMap(G,forced,t,id),
    velocity=[0,1,2].map(j=>C.value(G.mul(half,lift(row.curl.leading[j])),G.mul(half,lift(row.curl.remainder[j])))),
    pressure=C.value(G.mul(half,lift(row.homogeneousSignedAngularPressure.real)),
      G.mul(half,lift(row.homogeneousSignedAngularPressure.imaginary)));
  return [{m:1,velocity,pressure},{m:-1,velocity:velocity.map(z=>C.conjugate(z)),pressure:C.conjugate(pressure)}];
}
function sumModes(C,oldRows,newRows){
  const map=new Map();
  for(const row of [...oldRows,...newRows]){
    if(!Number.isSafeInteger(row.m)||row.m===0||row.velocity?.length!==3||!row.velocity.every(C.check)||!C.check(row.pressure))
      err('INVALID_CURRENT_HARMONIC','A full conjugate pressure/velocity mode was lost.');
    const prior=map.get(row.m);
    map.set(row.m,prior?{m:row.m,velocity:prior.velocity.map((z,j)=>C.add(z,row.velocity[j])),pressure:C.add(prior.pressure,row.pressure)}:row);
  }
  const out=[...map.values()].sort((a,b)=>a.m-b.m),k=new Set(out.map(x=>x.m));
  if(out.length!==k.size||out.some(x=>!k.has(-x.m)))err('DROPPED_CONJUGATE_MODE','All previous modes and their conjugates must survive Signed.');
  if(oldRows.some(x=>!k.has(x.m)))err('DROPPED_PREVIOUS_MODE','A preceding Forced harmonic was discarded.');
  return out;
}
function buildIndexed(source,templates,fieldName,bodyAt,kind,services){
  const {forced,G,pressure,cover}=source;
  const current=pressure.current,band=current.band,
    {R,Z,T,theta,ell,Xrep,etaRep,sRep}=band.coordinates,
    {A,D}=band.constants,{r0,Ls}=band.geometry,
    level=forced.input.coordinates.levelDifference,
    angular=kind==='velocity'||kind==='angularPressure',
    params=angular?forced.input.coordinates.localParameters:
      forced.input.coordinates.localParameters.filter(id=>id!==theta),
    fieldParams=angular?[...cover.parameters,theta]:cover.parameters,
    directions=angular?[...cover.directions,theta]:cover.directions,
    ratio=forced.input.reference.ratio,
    power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    exponent=kind==='velocity'?A:G.mul(G.q(2),A),
    choose=values=>{
      let out=G.zero;
      for(let j=4;j>=0;j--)out=G.choose(level,G.q(2*j-1,2),G.q(2*j+1,2),out,values[j],out);
      return out;
    },
    systems=[];
  if(!Array.isArray(params)||!Array.isArray(fieldParams)||!Array.isArray(directions)||!Number.isSafeInteger(level))
    err('MISSING_ORIGINAL_COVER_PARAMETERS','Source-defined local, periodic and direction parameters are required.');
  for(let signIndex=0;signIndex<2;signIndex++){
    const perSign=templates.filter(t=>t.signIndex===signIndex).sort((a,b)=>a.levelDifference-b.levelDifference);
    if(perSign.length!==5||perSign.some((t,j)=>t.levelDifference!==j))err('DROPPED_DIFFERENCE_IN_SYSTEM','Every fixed difference must be represented in each sign system.');
    const pieces=perSign.map(t=>G.choose(t.lift.xi,G.neg(r0),r0,G.zero,
      G.choose(t.lift.v,G.zero,Ls,G.zero,bodyAt(t),G.zero),G.zero)),
      local=services.guard(G,current.geometry,current.local.slowCutoff,choose(pieces),{auxiliary:false});
    if(!local||local.body===undefined)err('SOURCE_GUARD_MISSING','Guard-before-inverse local body is mandatory.');
    const fixed=G.simultaneousSubstitute(local.body,[Xrep,etaRep,sRep],
      [current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s]),
      own=G.defineExpressionFunction({name:fieldName+'_own_'+signIndex,parameters:params,body:fixed}),
      values=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...params.slice(3)],
      reference=G.mul(power(ratio,exponent),G.expressionValue(own,values)),
      system=G.defineExpressionFunction({name:fieldName+'_reference_'+signIndex,parameters:params,body:reference});
    systems.push({system,own,local,fixed,reference,values,signIndex,retainedDifferences:[0,1,2,3,4]});
  }
  const rows=[];
  for(const r of cover.rows){
    const b=cover.bands[r.relativeBand+1];
    for(const sign of r.signs){
      const values=[R,Z,T,r.label.ell,...r.label.grid,ell,...pressure.geometry.Y,
        ...sign.rectangle.center,...sign.rectangle.copy,...(angular?[theta]:[]),b.delta],
        derivativeMaps=[...[0,1,2,8,9].map(parameter=>[{parameter,coefficient:G.one}]),
          ...(angular?[[{parameter:14,coefficient:G.one}]]:[])];
      rows.push({localSystem:systems[sign.sourceLocalRow].system,values,derivativeMaps,
        coefficient:G.one,guards:r.guards,
        label:{key:r.key,ell:r.label.ell,grid:r.label.grid,sign:sign.sign,
          fixedDifference:b.delta,countBoxOnce:true}});
    }
  }
  if(rows.length!==162||rows.some(row=>row.values.length!==(angular?16:15)||
      row.derivativeMaps.length!==(angular?6:5)||!Array.isArray(row.guards)||!row.guards.length))
    err('INCOMPLETE_ORIGINAL_INDEXED_ROWS','Source chart, Y torus, all rectangular copies, and original guards must be retained.');
  const field=G.definePeriodicIndexedField({name:fieldName,parameters:fieldParams,directions,rows,
    sourceRecipe:{signedAfterForcedCandidate:true,originalSourceFullNumericalEvaluation:false,
      sameOriginal81Boxes:true,bothSigns:true,allFiveFiniteCoverDifferences:true,
      originalFixedRepresentativeAndCopyBeforeDerivative:true,
      originalSourceDisjointness:cover.proof.allCrossLabelProductsVanish,
      originalFlatJoinPremise:cover.proof.localFinitenessAndFlatJoins,
      originalAngularPressureIncluded:kind==='angularPressure',
      originalPhysicalExponent:kind==='velocity'?'A':'2A',
      fullCommonTorus:true,remainingMathematicalObligations:true}});
  const records=G.periodicIndexedSystem(field);
  if(!records||records.rows?.length!==162)err('PERIODIC_INDEXED_REGISTRY_INCOMPLETE','The actual periodic field registry did not retain all 162 source contributions.');
  return {field,root:G.periodicIndexedValue(field,fieldParams),systems,
    contributionCount:rows.length,perSign:{0:81,1:81},
    angular,kind,retainedFiveDifferences:systems.every(s=>s.retainedDifferences.length===5)};
}
/** Builds indexed source ASTs and, optionally, a fresh mean/PDE graph.
 * The result intentionally has NO original private successor seal.
 * External callers must not present it as the final original field.
 */
export function assembleSigned162Candidate(candidate,services,options={}){
  useFunctions(services);
  if(!candidate||candidate.schema!=='MathScope.N6.GenericSignedAfterForcedCandidate/1'||
     options===null||Object.keys(options).some(k=>!['maxAdditionalNodes','onProgress','refreshAfterAssembly'].includes(k)))
    err('INVALID_SIGNED_SOURCE_CANDIDATE','Use the unchanged original Signed source candidate.');
  const forced=candidate.originalForced,G=forced?.G;
  if(services.assertForced(forced)!==true||services.assertInitialized(forced.input)!==true)
    err('INVALID_ORIGINAL_PRIVATE_FORCED','Forced and initial private original seals must be validated.');
  if(candidate.sourceGraph!==G||candidate.signed.rows.length!==2||
    candidate.signed.rows.some((row,j)=>row.signIndex!==j))
    err('MISMATCHED_SIGNED_SOURCE_GRAPH','Exactly two original sign candidates from the same graph are required.');
  const {pressure,cover}=checkOriginalCover(forced),src={forced,G,pressure,cover},
    inputTemplates=checkTemplateInventory(forced),start=G.nodes.length,
    max=options.maxAdditionalNodes??1500000;
  if(!Number.isSafeInteger(max)||max<1||max>10000000)err('INVALID_SIGNED_BUDGET','Bounded AST expansion required.');
  const budget=tag=>{
    if(G.nodes.length-start>max)err('SIGNED_162_RESOURCE_LIMIT',`Graph growth exceeded budget at ${tag}.`);
    options.onProgress?.({step:tag,nodeCount:G.nodes.length,delta:G.nodes.length-start});
  };
  const C=services.complex(G),templates=[];
  for(const old of inputTemplates){
    const signedRows=complexPositive(G,C,candidate,forced,old),waveRows=sumModes(C,old.waveRows,signedRows);
    const before=old.covariance;
    if(!before||!names.every(k=>Number.isSafeInteger(before.values?.[k])))
      err('MISSING_PREVIOUS_FORCED_COVARIANCE','The same complete previous full wave covariance is required.');
    const after=services.covariance(G,{rows:waveRows,theta:pressure.current.band.coordinates.theta}),
      deltaCovariance=Object.fromEntries(names.map(k=>[k,G.sub(after.values[k],before.values[k])])),
      real=services.reconstruct(G,{geometry:old.lift.geometry,phase:old.phase,k:old.k,rows:signedRows});
    vec(G,real?.velocity,3,'signed delta physical velocity');root(G,real?.pressure,'signed delta angular pressure');
    if(!Array.isArray(after?.checks)||!after.checks.every(x=>x.pass===true))
      err('SIGNED_COVARIANCE_IDENTITY_FAILED','Every nonzero generated angular mode and pair must be retained.');
    templates.push({...old,signedRows,waveRows,
      signedIncrementVelocity:real.velocity,signedIncrementAngularPressure:real.pressure,
      beforeCovariance:before,afterCovariance:after,deltaCovariance,
      exactAllOriginalModesPreserved:old.waveRows.every(r=>waveRows.some(z=>z.m===r.m)),
      scope:{sourceSignedCoverCandidate:true,fullSourceCorrectedCurrentCertified:false}});
    budget(`signed-template-${old.key}`);
  }
  const velocity=Array.from({length:3},(_,j)=>buildIndexed(src,templates,'GenericSigned162_velocity_'+j,
       t=>t.signedIncrementVelocity[j],'velocity',services)),
    angularPressure=buildIndexed(src,templates,'GenericSigned162_angular_pressure',
       t=>t.signedIncrementAngularPressure,'angularPressure',services),
    covariance=Object.fromEntries(names.map(k=>[k,buildIndexed(src,templates,'GenericSigned162_covariance_delta_'+k,
       t=>t.deltaCovariance[k],'covariance',services)]));
  budget('all-162-indexed-velocity-pressure-covariance');
  const roots={velocity:velocity.map(x=>x.root),angularPressure:angularPressure.root,
    covariance:Object.fromEntries(names.map(k=>[k,covariance[k].root]))};
  const result={schema:SIGNED_162_SCHEMA,originalForced:forced,originalCandidate:candidate,G,
    templates,source:{sourceCommitPinnedByExternalPrivateAdapterOnly:true,
      originalPressureCover81:cover.rows.length,totalSignedCoverRows:162,
      fiveDifferencesPerSign:5,registeredFieldCount:10,
      allGuardRowsRetained:true,privateFullSignedSuccessorSealIssued:false},
    indexed:{velocity,angularPressure,covariance,roots},
    scope:{sourceIndexed162SignedASTConstructed:true,
      originalPrivateForcedInputAsserted:true,originalSignedFullSourceAuthenticated:false,
      originalFullPressureRecomputed:false,originalPhysicalPDERecomputed:false,
      originalFinal67JetsEvaluated:0,N706Closed:false,N805Closed:false,
      originalM3RowsClosed:0,releaseApproved:false}};
  if(options.refreshAfterAssembly!==false){
    const oldW=forced.mean.fullCurrentCovariance,
      updatedCovariance=Object.fromEntries(names.map(k=>[k,G.add(oldW[k],roots.covariance[k])])),
      g=pressure.current.band.geometry,band=pressure.current.band,
      background={b:band.fields.b,V:G.mul(band.coordinates.R,band.fields.F),G:band.fields.G},
      updatedMean=services.refreshMean(G,{geometry:pressure.geometry,background,
        velocity:forced.mean.completeBetaVGamma,covariance:updatedCovariance,
        stress:forced.mean.sourceStress,rho:pressure.pressure.rho,chi:pressure.pressure.chi,
        tag:'GenericSignedAfterForced162'});
    if(!Array.isArray(updatedMean?.checks)||!updatedMean.checks.length||
       !updatedMean.checks.every(x=>x.pass===true)||updatedMean.mean?.fullAngularCovariance!==updatedCovariance||
       !['P','Jtheta','Jz'].every(x=>Number.isSafeInteger(updatedMean.mean[x])))
      err('POST_SIGNED_MEAN_NOT_RECOMPUTED','Full updated pressure and all three P/J defects are required.');
    const signedVelocity=roots.velocity,globalVelocity=forced.global.velocity.map((id,j)=>G.add(id,signedVelocity[j])),
      meanPressureDifference=G.sub(updatedMean.pressure.value,forced.mean.pressure.value),
      globalPressure=G.add(forced.global.pressure,meanPressureDifference,roots.angularPressure),
      globalGeometry=forced.global.geometry,
      pde=services.physicalPDE(G,{geometry:globalGeometry,velocity:globalVelocity,pressure:globalPressure});
    if(!Array.isArray(pde?.conservativeResidual)||pde.conservativeResidual.length!==3||
      !pde.conservativeResidual.every(id=>Number.isSafeInteger(id)&&!!G.nodes[id]))
      err('INCOMPLETE_POST_SIGNED_PDE','Entire signed physical PDE and pressure gradient must be retained.');
    result.updated={updatedCovariance,updatedMean,fullVelocity:globalVelocity,
      fullPressure:globalPressure,meanPressureDifference,pde};
    result.scope.originalFullPressureRecomputed=true;
    result.scope.originalPhysicalPDERecomputed=true;
    budget('signed-new-P-J-pressure-full-physical-PDE');
  }
  // There is no new private Signed successor seal. The source graph may be
  // extended, but the original private source must still verify its prefix.
  if(services.assertForced(forced)!==true||services.assertInitialized(forced.input)!==true)
    err('MUTATED_ORIGINAL_FORCED','The source seals failed after indexed-field construction.');
  return result;
}
