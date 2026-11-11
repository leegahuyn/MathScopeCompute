import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [repo,out]=process.argv.slice(2);
assert.ok(repo&&out);
const load=file=>import(pathToFileURL(resolve(repo,'research-ide/mathscope-m3/navier',file)).href);
const auth=await load('source-saved-initialized-authority.mjs');
const familyFns=await load('source-saved-initialized-norm-family.mjs');
const cutoffFns=await load('source-saved-initialized-cutoff-norms.mjs');
const cap=await auth.openSavedInitializedSource();
const source=auth.savedInitializedSourceProgram(cap);
const family=familyFns.attachSavedInitializedNormFamily(cap);
const cutoff=await cutoffFns.attachSavedInitializedCutoffAuthority(family);
assert.equal(cutoffFns.assertSavedInitializedCutoffAuthority(cutoff),true);
const {mean}=source, early=cutoff.bodies.temporal;
const rootIds={
  Etheta:early.thetaDefinition.body,Ez:early.zDefinition.body,
  inverseTheta:early.thetaRoot,inverseZ:early.zRoot,
  temporalPotential:early.psi,temporalPotentialNativeBody:early.rawPsi,
  temporalRadial:early.velocity.beta,temporalAzimuthal:early.velocity.v,temporalAxial:early.velocity.gamma,
  fivePotential:mean.potential.psi,fiveRadial:mean.potential.deltaBeta,
  fiveAxial:mean.potential.gammaDesired,totalAzimuthal:cap.actualRoots.initializedVelocity.v,
  finalMeanPressure:cap.actualRoots.initializedPressure.value
};
for(const key of ['P','Jtheta','Jz']) {
  assert.equal(mean.bumps.actualInputDefects[key],mean.stages.temporal.mean[key]);
}
const postTemporal=mean.stages.temporal.mean,late=mean.stages.moments.mean;
const sourceRecords={};
const keep=(id)=>{
  if(Number.isSafeInteger(id)&&id>=0&&id<source.nodeCount) sourceRecords[id]=source.node(id);
};
for(const r of Object.values(rootIds))keep(r);
for(const state of [postTemporal,late]){
  for(const k of ['P','Jtheta','Jz','gr','haarGr'])keep(state[k]);
  for(const n of Object.values(state.raw))keep(n);
}
for(const id of [...Object.values(mean.bumps.actualInputDefects),...Object.values(mean.bumps.targets),
                 ...mean.bumps.coefficients.angular,...mean.bumps.coefficients.axial,...cap.actualRoots.originalStress])keep(id);
const nativeNames=['snapshot.base.base.expression','snapshot.base.expressionDefinitions','snapshot.base.inverseDefinitions'];
const native=Object.fromEntries(source.definitionCollections.filter(r=>nativeNames.includes(r.namespace)).map(r=>[r.namespace,r.value]));
const semanticRefs={
  earlyInverseDefinitions:[early.thetaDefinition,early.zDefinition],
  temporalFtc:{psi:early.psi,psiDefinition:early.psiDefinition,psiZ:early.psiZ,psiR:early.psiR,
    psiY:early.psiY,gammaDesired:early.gammaDesired,rawA1:early.A1,radialIdentity:early.exactIdentity},
  freshActualTargets:mean.bumps.actualInputDefects,scaledFiveTargets:mean.bumps.targets,
  fiveMapCoefficients:{angular:mean.bumps.coefficients.angular,axial:mean.bumps.coefficients.axial},
  fiveMomentRows:mean.bumps.exactRows,
  fivePotential:mean.potential,
  temporalBeforeFive:{velocity:mean.stages.temporal.velocity,P:postTemporal.P,Jtheta:postTemporal.Jtheta,Jz:postTemporal.Jz,
    gr:postTemporal.gr,haarGr:postTemporal.haarGr,fluxTheta:postTemporal.raw.fluxTheta,fluxZ:postTemporal.raw.fluxZ},
  rebuiltFinal:{velocity:mean.stages.moments.velocity,gr:late.gr,haarGr:late.haarGr,P:late.P,
    pressure:mean.stages.moments.pressure.value}
};
const result={schema:'MathScope.N7.ActualDirectionalInitializedMeanOperands/1',
  source:cap.source,geometry:cutoff.bodies.geometry,roots:rootIds,semanticRefs,native,sourceRecords,
  sourceRuntime:Object.fromEntries(['source-global-pressure.mjs','source-global-temporal.mjs','source-temporal-potential.mjs',
    'source-global-initial-mean.mjs','source-full-mean-equations.mjs','source-updated-mean-pressure.mjs','source-pressure.mjs',
    'source-global-moment.mjs'].map(name=>{
      const path='research-ide/mathscope-m3/navier/'+name;
      return [path,createHash('sha256').update(source.sourceText(path)).digest('hex')];
    }))};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS actual sealed directional operands from the original stage-zero mean parent.');
console.log(JSON.stringify({rootIds,targets:mean.bumps.actualInputDefects,pressure:semanticRefs.rebuiltFinal}));
