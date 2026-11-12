import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

assert.equal(process.argv.length,9,'Use GOAL_NEXT ORIGINAL_RESEARCH_IDE ARITHMETIC_RUNTIME HISTORICAL_INPUT N3_PATH_RECEIPT N3_PYTHON_READBACK OUT_JSON');
const [, ,goal,runtime,numerical,historicalPath,activePath,pythonPath,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function pin(file,digest,parse=true){
  assert.notEqual(resolve(file),resolve(out));
  const bytes=await readFile(file);
  assert.equal(sha(bytes),digest,file);
  return parse?JSON.parse(bytes):bytes.toString('utf8');
}
const files={
  physical:['mathscope-m2/navier/actual-common-band-physical-curl.mjs','60001a58480274c646856bba803b62fd234db0f9bca33b9d81421963d19b5b70'],
  exponent:['mathscope-m2/navier/source-radial-phase-exponent.mjs','09ffa7aca344391d39de50f38a9a4c67f175d6d500e4514ac6a86e591768ab7c'],
  partition:['mathscope-m2/navier/actual-covariance-source-certificate.mjs','c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681'],
  band:['mathscope-m3/navier/source-global-band.mjs','babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'],
  pressure:['mathscope-m3/navier/source-global-pressure.mjs','fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d']
};
const evidence={
  fixed:['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  threshold:['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf']
};
const activeSHA='c7ce0df6ad4082b2d8d1330d2d4c434d0cb812f597f58992e6f8e50a517d7ee2';
const active=await pin(activePath,activeSHA);
const pythonSHA='4357f51b23a181bf8184a1ce836d9e4d1de51dad71eda640e3334366459a1d35';
const python=await pin(pythonPath,pythonSHA);
const historicalSHA='03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0';
const historical=await pin(historicalPath,historicalSHA);
assert.equal(python.status,'PASS');
assert.equal(python.graphSHA256,active.archive.graphSHA);
assert.equal(python.registrySHA256,active.archive.registrySHA);
assert.equal(python.nodeCount,active.archive.nodeCount);
assert.equal(python.archivedCoverKey,active.activeOriginalChart.label);
assert.deepEqual(python.frozenPotentialArguments,active.actualNative.frozenActual);
assert.notEqual(resolve(pythonPath),resolve(out));
assert.deepEqual(active.activeOriginalChart.physicalSelectorArguments,python.liveSelectorArguments);
const code=Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name,[file,hash]])=>[
  name,await pin(resolve(runtime,file),hash,false)
])));
for(const [name,fragments] of Object.entries({
  physical:['radialPrimitive=G.mul(power(auxiliary.physicalMap.Lambda,g.paletteIndex),power(physicalR,auxiliary.physicalMap.dr))',
    'timePrimitive=G.mul(power(g.Tg,g.paletteIndex),G.sub(G.one,G.mul(g.Q,coordinates.T)))',
    'basis=[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]]'],
  exponent:['O.mul(O.q(2),O.sub(O.mul(O.add(O.one,h),rho),O.mul(h,kappa)))'],
  partition:['grid=band.nearestMesh.map','centers=colors.map(x=>[G.div(G.add(x,G.one),q(1048576)),G.zero])'],
  pressure:['mappedY=matrix.map(row=>dot(G,row,Y))',
    'xi=G.div(dot(G,vr,offset),Dgeom),eta=G.div(dot(G,vt,offset),Dgeom),v=G.div(G.add(eta,r0),ci)',
    'matrix:b.matrix.value,center:label.centers[signIndex],vr,vt,Dgeom,ci:b.ci'],
  band:['paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient)))','G.mul(q(2),G.log(ell))',
    'body=G.choose(x,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero)',
    'chi=G.choose(a,q(1,4),q(3,4),G.one','longitudinalPlateau:']
}))for(const fragment of fragments)assert.ok(code[name].includes(fragment),fragment);

const {fixed,threshold}=Object.fromEntries(await Promise.all(Object.entries(evidence).map(async ([name,[file,hash]])=>[
  name,await pin(resolve(goal,file),hash)
])));
const helper=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
await pin(helper,'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47',false);
const {sourceArithmetic}=await import(pathToFileURL(helper).href);
const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(numerical,threshold.sourcePins,'coarse-upper');
const q=x=>N.point(String(x)),ell=N.add(N.fromClosed(fixed.hostedOriginal[617432]),q(15)),
  h=N.fromClosed(fixed.hostedOriginal[9]),sqrt2=N.sqrt(q(2)),Lambda=N.sub(q(4),sqrt2),Tg=N.add(q(4),sqrt2),
  rho=N.div(N.log(Lambda),N.log(Tg)),kappa=q('1/100000'),
  dr=N.mul(q(2),N.sub(N.mul(N.add(q(1),h),rho),N.mul(h,kappa)));
const closed=x=>N.toClosed(x),cmp=(a,b)=>N.compareEndpoints(a,b);
assert.deepEqual(historical.definitions.Xa,{quotient:[{integer:4},{ref:'Lambda'}]});
assert.deepEqual(historical.definitions.Lambda,{power:[{ref:'Q'},64]});
const sourceParameters=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['Xa','XR']}).values;
const Xa=closed(sourceParameters.get('Xa')),XR=closed(sourceParameters.get('XR'));
assert.equal(cmp(Xa.lower,{rational:'0'}),1);
assert.equal(cmp(Xa.upper,{rational:'2'}),-1);
assert.equal(cmp(XR.lower,{rational:'110'}),1);
assert.equal(cmp(closed(dr).lower,{rational:'1'}),1);
assert.equal(cmp(closed(dr).upper,{rational:'4'}),-1);
const left=closed(N.mul(q('1/200000'),N.mul(h,ell)));
const right=closed(N.add(N.mul(q(8),N.log(ell)),q(128)));
assert.equal(cmp(left.lower,right.upper),1);

// The nearest source row is fixed for all R in [2-3/(8 ell^6), 2+3/(8 ell^6)].
// Along that interval the original own-torus radial primitive increases by
// more than 2^80. The proof uses the directed strict inequality above and
// only ordinary integer bounds on its remaining prefactors.
let [prevP,prevQ,p,den]=[0n,1n,1n,2n];
const min=1n<<40n;
while(den<min)[prevP,prevQ,p,den]=[p,den,2n*p+prevP,2n*den+prevQ];
assert(min<=den&&den<3n*min);
assert(p*prevQ-den*prevP===1n||p*prevQ-den*prevP===-1n);
const pell=(p+den)**2n-2n*den**2n;
assert(pell===1n||pell===-1n);
assert(3n*(1n<<37n)<2n*den); // 3/(2 den) < r0/8
assert(den+2n<1n<<80n);

const result={
  schema:'MathScope.ActiveN3PhysicalFastSupport/1',status:'VERIFIED_PHYSICAL_FAST_SUPPORT_EXISTS_IN_SELECTED_N3_CELL',
  originalGraphSHA256:active.archive.graphSHA,activeReceiptSHA256:activeSHA,pythonReadbackSHA256:pythonSHA,
  sourcePins:{files,evidence,historicalSHA},
  chart:{ell:'ellMinimum+15',q:'qBig/40',Z:'0',T:'4/5',RInterval:['2-3/(8 ell^6)','2+3/(8 ell^6)'],
    sameNearestCover:'0:0:0:0',sign:1,physicalSelectorArguments:active.activeOriginalChart.physicalSelectorArguments,
    frozenSelectorArguments:active.activeOriginalChart.frozenRepresentative.selectorArguments},
  directed:{Xa,XR,radialExponent:closed(dr),left_hEllOver200000:left.lower,right_8logEllPlus128:right.upper,strictComparison:true},
  exactBounds:{ownRadialPhaseIntervalLengthGreaterThan:'2^80',pellNumerator:String(p),pellDenominator:String(den),
    pellNorm:String(pell),nearestSecondCoordinateError:'<3/(2 pellDenominator)<r0/8',
    actualFastCoordinateGuards:['|xi|<r0/8','7/16<v/Ls<9/16','chi=psi=1']},
  physicalWitness:'Vary R in the listed interval at fixed q, Z, T. The actual first torus coordinate can be set to the chosen palette center modulo integers for den consecutive choices of the radial primitive. The Pell approximation makes one corresponding second-coordinate error <r0/8. The strictly increasing actual radial primitive gives an interior physical R. This R need not equal the mesh center.',
  scope:'Existence on the actual physical torus of one strictly supported N3 current in the selected source row. No numerical evaluation of the wave or mode-two residual at that point and no missing active Initialized Angular or Forced output supplied.',
  arithmetic:N.report()
};
await writeFile(out,JSON.stringify(result)+'\n');
console.log(JSON.stringify({status:result.status,denominator:String(den),SHA256:sha(await readFile(out))}));
