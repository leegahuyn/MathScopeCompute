import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// MOCK-only control-flow test, NOT source mathematical certification.
// Execute the unchanged production function body with injected unit fixtures
// to expose lexical and root-shape errors without a 4.4M-node recomputation.
function harness(){
  const G={nodes:[]},add=(op,args)=>{const id=G.nodes.length;G.nodes.push({op,args});return id;};
  for(const op of ['q','fresh','parameter','exp','mul','log','sub','add','neg','pow','integral','substitute','div','derivative'])
    G[op]=(...args)=>add(op,args);
  G.zero=G.q(0);G.one=G.q(1);
  G.freeCoordinates=()=>new Set();
  G.captureFunctionDefinitions=()=>({});
  const bump={copies:[0,1,2].map(()=>({inQ:G.q(2)})),powers:[1,2,3,4,5].map(n=>G.q(n)),d:G.q(1,5),lambda:G.q(1,10),
    coefficients:{angularMatrix:[[1],[2],[3]].map(r=>r.map(x=>G.q(x))),axialMatrix:[[1],[2]].map(r=>r.map(x=>G.q(x)))},
    sourceRestriction:{positiveAAndFiveMuFromSource:true,originalPositiveLambdaRetained:true}};
  const band={chart:{s:G.q(4)},constants:{A:G.q(3)},fields:{b:G.q(5),F:G.q(6),G:G.q(7)}};
  const geometry={R:G.fresh('R'),Z:G.fresh('Z'),T:G.fresh('T'),Y:[G.fresh('y0'),G.fresh('y1')],
    epsilon:G.q(1,100),innerRadius:G.q(1),outerRadius:G.q(3)};
  const originalPressure={geometry,pressure:{rho:G.q(1),chi:G.q(1)},
    current:{mean:{P:G.zero}},residual:{fullOriginalStress:[G.q(1),G.q(2)]}};
  const covariance={rr:G.q(1)},provenance={G,band,bump,template:{mean:{P:G.zero}},
    originalPressure,updated:{updatedCovariance:covariance}};
  const source={checks:[{pass:true}],mean:{P:G.q(5),Jtheta:G.q(6),Jz:G.q(7),fullAngularCovariance:covariance}};
  const temporal={G,frontier:{signed:{G}},postTemporal:{updatedMeanPressure:source,
    velocity:{beta:G.zero,v:G.zero,gamma:G.zero}}};
  const deps={
    assertActualPostSignedTemporalInverse:()=>true,resolveOriginalPostSignedSourceShape:()=>provenance,
    assertGlobalMomentCurrent:()=>true,
    exactFiveMomentCoefficients:()=>({angular:[G.q(1),G.q(2),G.q(3)],axial:[G.q(4),G.q(5)],
      angularMatrix:bump.coefficients.angularMatrix,axialMatrix:bump.coefficients.axialMatrix,checks:[{pass:true}]}),
    exactFullMeanMomentRemainders:()=>({allOldNewAndQuadraticTermsRetained:true,nonlinearRemaindersDeclaredZero:false}),
    originalFullMeanOperators:()=>({De:x=>G.add(x,G.one),Dz:x=>G.derivative(x,geometry.Z)}),
    reconstructUpdatedFullMeanPressure:(_,opts)=>({mean:{P:G.q(7),Jtheta:G.q(8),Jz:G.q(9),fullAngularCovariance:opts.covariance},
      checks:[{pass:true}],pressure:{value:G.q(2)}}),
    globalGraphEqual:()=>({pass:true}),shareGlobalScalar:(_,id)=>id,
    canonicalStringify:JSON.stringify,sha256:async()=>''};
  const sourceText=readFileSync(new URL('./source-signed-actual-five-map.mjs',import.meta.url),'utf8')
    .replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
  const factory=new Function(...Object.keys(deps),sourceText+'\nreturn {attachActualPostSignedFiveMap};');
  return {G,source,temporal,attachActualPostSignedFiveMap:factory(...Object.values(deps)).attachActualPostSignedFiveMap};
}
test('unchanged production FiveMap body reaches five rows and fresh pressure with source-shaped mock',()=>{
  const {temporal,attachActualPostSignedFiveMap:attach}=harness();
  const x=attach(temporal);
  assert.equal(x.schema,'MathScope.N6.ActualPostSignedFiveMapAST/1');
  assert.equal(x.coefficients.angular.length,3);
  assert.equal(x.coefficients.axial.length,2);
  assert.ok(x.checks.every(c=>c.pass===true));
  assert.equal(x.scope.actualFinal67NumericalJets,0);
});
test('production FiveMap body rejects supplied fake target or moment matrix',()=>{
  const {temporal,attachActualPostSignedFiveMap:attach}=harness();
  assert.throws(()=>attach(temporal,{targets:{P:0,Jtheta:0,Jz:0}}),{code:'INVALID_FIVEMAP_OPTIONS'});
});
