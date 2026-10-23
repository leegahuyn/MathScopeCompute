import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachActualPostFiveFull3DPDE,assertActualPostFiveFull3DPDE}
  from './source-postfive-full-3d-residual.mjs';
test('production actual Full3D PDE entry rejects absent source-private FiveMap',()=>{
  assert.throws(()=>attachActualPostFiveFull3DPDE({}));
});
test('production full 3D PDE does not admit caller-replaced full field or pressure',()=>{
  assert.throws(()=>attachActualPostFiveFull3DPDE({}, {pressure:4}),
     {code:'INVALID_POSTFIVE_3D_OPTIONS'});
});
test('unrelated object never receives a production 3D residual seal',()=>{
  assert.throws(()=>assertActualPostFiveFull3DPDE({}),
     {code:'INVALID_POSTFIVE_3D_SOURCE_SEAL'});
});
// MOCK-only execution of unchanged production function body, to catch lexical
// mistakes and full-field pressure omissions without forging a real source seal.
test('source-shaped 3D PDE compile retains three true physical modes and new mean pressure (mock-only)',()=>{
  const G={nodes:[]};
  const add=(op,args)=>{const id=G.nodes.length;G.nodes.push({op,args});return id;};
  G.add=(...x)=>add('add',x);G.sub=(x,y)=>add('sub',[x,y]);
  G.captureFunctionDefinitions=()=>({});
  const make=()=>add('atom',[]);
  const oldVelocity=[make(),make(),make()],oldPressure=make(),
    originalMean={beta:make(),v:make(),gamma:make()},
    newMean={beta:make(),v:make(),gamma:make()},
    beforePressure=make(),afterPressure=make(),
    covariance={rr:make()};
  const prior={fullVelocity:oldVelocity,fullPressure:oldPressure,
    updatedMean:{pressure:{value:beforePressure}},updatedCovariance:covariance};
  const forced={G,global:{geometry:{R:make(),Z:make(),T:make(),Y:[make(),make()]}},
    mean:{completeBetaVGamma:originalMean}};
  const signed={G,input:forced,constructed:{updated:prior}};
  const five={G,temporal:{frontier:{signed}},
    postFiveMean:{velocity:newMean,updatedMeanPressure:{
      pressure:{value:afterPressure},
      mean:{fullAngularCovariance:covariance},
      checks:[{pass:true}]}}};
  const deps={assertActualPostSignedFiveMap:()=>true,
    exactRealCylindricalPDE:(_,input)=>{
      assert.equal(input.velocity.length,3);
      return {divergence:make(),advectiveResidual:[make(),make(),make()],
        conservativeResidual:[make(),make(),make()],
        pressureGradient:[make(),make(),make()],
        vectorLaplacian:[make(),make(),make()],
        allCylindricalConnectionsRetained:true};
    },canonicalStringify:JSON.stringify,sha256:async()=>''};
  const code=readFileSync(new URL('./source-postfive-full-3d-residual.mjs',import.meta.url),'utf8')
    .replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
  const construct=new Function(...Object.keys(deps),code+'\nreturn {attachActualPostFiveFull3DPDE};');
  const {attachActualPostFiveFull3DPDE:attach}=construct(...Object.values(deps));
  const x=attach(five);
  assert.equal(x.schema,'MathScope.N6.PostSignedTemporalFiveFull3DPDEAST/1');
  assert.equal(x.velocity.fullPhysicalVelocity.length,3);
  assert.equal(x.residual.conservative.length,3);
  assert.equal(x.scope.full3DConservativeResidualProvedZero,false);
  assert.equal(x.scope.actualFinal67NumericalJetIntervals,0);
  assert.ok(x.checks.every(c=>c.pass===true));
});
