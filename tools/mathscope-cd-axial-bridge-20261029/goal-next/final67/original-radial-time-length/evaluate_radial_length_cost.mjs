import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal, work, out] = process.argv.slice(2);
assert.ok(goal && work && out);
const read = (root, path, expected) => {
  const raw=readFileSync(resolve(root,path));
  assert.equal(createHash('sha256').update(raw).digest('hex'),expected,path);
  return JSON.parse(raw);
};
const historyPin='03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0';
const geometryPin='4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966';
const normPin='af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf';
const history=read(work,'whole-k-prefix/historical-scale-arithmetic-input.json',historyPin);
const geometry=read(goal,'whole-k-annular-wrz-norm/numerical/background-c8-complete.json',geometryPin);
const norm=read(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json',normPin);
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),norm.sourcePins,'coarse-upper');
const {values}=evaluateClosedArithmeticDefinitions(history.definitions,N,{names:['Xa','h']});
const ln2=N.log(N.point('2'));
const H=N.mul(values.get('h'),N.mul(N.add(N.fromClosed(history.archivedEllMinimumInterval),N.point('15')),ln2));
const bound=N.add(N.log(N.point('32')),
  N.mul(N.point('3/2'),N.log(N.fromClosed(geometry.Xb))),
  N.mul(N.point('-1/2'),N.log(values.get('Xa'))));
const gate=N.mul(H,N.point('1/'+String(2n**120n)));
const comparison=N.compareEndpoints(N.toClosed(bound).upper,N.toClosed(gate).lower);
assert.equal(comparison,-1);
const tiny=N.mul(H,N.point('1/'+String(2n**128n)));
assert.equal(N.compareEndpoints(N.toClosed(ln2).upper,N.toClosed(tiny).lower),-1);
const receipt={schema:'MathScope.N7.OriginalRadialShiftScalarCost/1',
  status:'VERIFIED_ORIGINAL_RADIAL_LENGTH_SCALAR_BOUND',
  historyPin,geometryPin,normPin,
  originalBounds:['sqrt(Xa)','2*sqrt(Xb)'],
  safeScalar:'4*b^3/a=32*Xb^(3/2)/sqrt(Xa)',
  logScalar:N.toClosed(bound),logLimit:N.toClosed(gate),comparison,
  logTwoLessThanHOverTwoPow128:true,
  retainedOriginalFactors:'Apply only to the T0/T1 supremum-norm length contribution on admitted original radial paths. The inverse and all derivatives of coefficients or shifts have their own proof obligations.',
  finalJets:0,release:'HOLD'};
writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({comparison,logTwoLessThanHOverTwoPow128:true}));
