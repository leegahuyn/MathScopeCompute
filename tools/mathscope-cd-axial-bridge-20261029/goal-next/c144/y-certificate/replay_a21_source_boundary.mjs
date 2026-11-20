import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const [source,out]=process.argv.slice(2);
const sourceSHA=createHash('sha256').update(readFileSync(source)).digest('hex');
assert.equal(sourceSHA,'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815');
const {prepareActualNaturalCoreProgram}=await import(pathToFileURL(source).href);
const {G,pressure,outer,rootFields}=prepareActualNaturalCoreProgram({degree:0});
assert.equal(pressure.pressure,rootFields.P0);
assert.ok(pressure.definition.fullExteriorTailIncluded);
assert.equal(pressure.definition.pressureApproximationUsed,false);
const actualZero=G.zero;
const actualMinusOne=G.q(-1);
const args=[actualZero,actualMinusOne];
const values=args.map(eta=>G.substitute(rootFields.P0OverPstarSquared,rootFields.eta,eta));
const prefix=args.map(eta=>G.substitute(pressure.initialInfinitePrefix,rootFields.eta,eta));
assert.deepEqual(prefix.map(id=>G.nodes[id]),[
  {op:'rational',args:['5','1']},{op:'rational',args:['5','4']},
]);
const tail=args.map(eta=>G.substitute(pressure.terminalInfiniteTail,rootFields.eta,eta));
assert.equal(tail[0],tail[1]);
const stages=pressure.stages.map((stage,i)=>{
  assert.equal(stage.id,outer.stages[i].id);
  assert.equal(stage.upper,outer.stages[i].length);
  if(i<5)assert.equal(stage.theta,G.one);
  if(i>5)assert.equal(stage.theta,G.zero);
  const density=args.map(eta=>G.substitute(stage.integrand,rootFields.eta,eta));
  if(i>5)assert.equal(density[0],density[1]);
  return {id:stage.id,theta:stage.theta,stageIntegral:stage.integral,upper:stage.upper,
    normalizedDensityRootsAtZeroAndMinusOne:density};
});
assert.deepEqual(stages.map(stage=>stage.id),['initial','axialDecay','entry','reservedPower','pulse',
  'interpolation','angular','steepen','steepPower','flatten','wait','terminal']);
const rows={schema:'MathScope.C144.OriginalA21SourceBoundaryOperands/1',sourceSHA,
  originalEtaFormal:rootFields.eta,inputRationalNodes:args,
  originalP0:rootFields.P0,originalP0OverK:rootFields.P0OverPstarSquared,
  normalizedPressureRootsAtZeroAndMinusOne:values,initialInfinitePrefix:prefix,
  independentTerminalExteriorTail:tail[0],stages,exactPressureDefinition:pressure.definition};
writeFileSync(out,JSON.stringify(rows,null,2)+'\n');
