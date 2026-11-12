/** Directed magnitude of the actual localized initialized-stage Cartesian angular H1 tail. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goalArg, treeArg, outArg]=process.argv.slice(2);assert(goalArg&&treeArg&&outArg);
const goal=resolve(goalArg), tree=resolve(treeArg), out=resolve(outArg);
const sha=b=>createHash('sha256').update(b).digest('hex');
async function pin(path,digest){let b=await readFile(path);assert.equal(sha(b),digest,path);return JSON.parse(b)}
const initial=await pin(resolve(goal,'whole-k-annular-initial/localized-force/initialized-annular-localized-force.json'),'74bf04dc47c3dfb1f38f1e6343fe855890390aaff8e24cf85c583eb83af1ca96');
const thresholds=await pin(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
assert.equal(initial.status,'INITIALIZED_ANNULAR_ABSOLUTE_INTERVALS_FROM_SOURCE_OPERANDS');assert.equal(initial.scope.N706,'OPEN');
assert.equal(initial.proof.radial,'2q Xb < qBig Rstar^2/32 < 1/48, so 2r^2<1/24<1/2');
assert.equal(initial.symmetricAbsoluteUpperEndpoints.gradient.length,3);
for(const row of initial.symmetricAbsoluteUpperEndpoints.gradient)assert.equal(row.length,3);
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N}=await sourceArithmetic(tree,thresholds.sourcePins,'coarse-upper');
const zero={rational:'0'};let E=N.zero();let terms=[];
for(let i=0;i<3;i++)for(let j=0;j<2;j++){
 const upper=initial.symmetricAbsoluteUpperEndpoints.gradient[i][j];
 assert.equal(N.compareEndpoints(upper,zero),1);
 const G=N.fromClosed({lower:zero,upper});E=N.add(E,N.mul(G,G));terms.push({component:i,derivative:j,upper});
}
let bound=N.toClosed(E).upper;assert.equal(N.compareEndpoints(bound,zero),1);
const result={schema:'MathScope.N8.InitializedPhysicalCartesianAngularH1Tail/1',status:'CONDITIONAL_ORIGINAL_INITIALIZED_FIELD_TAIL_BOUND',domain:initial.scope.chart,
 source:{localizedForceAndGradientSHA256:'74bf04dc47c3dfb1f38f1e6343fe855890390aaff8e24cf85c583eb83af1ca96',stageZeroJetSHA256:initial.source.initialSHA256,sourceAssumptions:'inherits source regularity, native field meaning, chart, and fixed-cover joins in the original stage-zero proof'},
 derivation:{variable:'physical Cartesian theta, not auxiliary Haar phases',normalizedCoefficients:'u_hat_n=(1/(2*pi)) integral_0^(2*pi) u(theta) exp(-i*n*theta) dtheta',
 derivative:'d_theta u_i=-y*d_x u_i+x*d_y u_i',
 pointwise:'sum_i |d_theta u_i|^2 <= r^2 sum_(i=0..2,j=x,y) |d_j u_i|^2',
 radial:'r^2<1/48 on the source annulus by the pinned plateau proof',
 tail:'for each integer N>=0 and each complete admitted physical circle, sum_|n|>N sum_i |u_hat_i,n|^2 <= E/[48*(N+1)^2]',
 E:'directed finite upper enclosure of sum over the six squared actual localized Cartesian gradient bounds',
 sameFrequencyRule:'sum all coefficients with the same physical integer frequency before taking squared modulus',
 frame:'Cartesian components; cylindrical component Fourier modes need separate frame-rotation bookkeeping',
 zeroMode:'retained for every N>=0',sourceTerms:terms,gradientSquaresUpper:bound,
 exactRatioToN0:{N0:'1',N1:'1/4',N3:'1/16',N7:'1/64'}},
 limits:{assumptions:'smooth 2pi-periodic angular traces under the source field hypotheses; this is a circle-by-circle bound',physicalWindingMaximum:'not evaluated',laterCorrections:'not bounded',forceFourierTail:'not claimed; force gradients are not supplied by the 67-jet input',N805:'OPEN',N706:'OPEN',wholeKFinalJets:'0/67',release:'HOLD'},arithmetic:N.report()};
await writeFile(resolve(out,'initial-angular-tail.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS initial physical angular H1 tail; six source gradient bounds; whole-field N8 remains OPEN');
