import test from 'node:test';
import assert from 'node:assert/strict';
import {checkOriginalCoupledTemporalInverse as check} from './original-coupled-inverse-proof.mjs';
function make(){
 const nodes=Array.from({length:9},()=>({op:'coordinate'})),system='coupled-inverse:0',
 Y=[5,6],parameters=[0,1,2,3,...Y],body=7,exact=8;
 nodes[7]={op:'sub',args:[0,1]};
 nodes[8]={op:'m3_coupled_inverse_partial',args:[system,[...parameters],[0,0,0,0,0]]};
 const definition={id:system,body,Y:[...Y],parameters:[...parameters],
  directions:[0,1,2,...Y],operator:'(sqrt(2)-1)*partial_y0+partial_y1',
  finiteSumDeclaredEqualToLimit:false};
 const G={nodes,auxiliaryInverseSystem:id=>id===system?definition:undefined};
 const finite={fullLatticeModeCount:8,omittedTailRetained:true,finiteSumClaimedWholeInverse:false,
  tails:[{tailTendsToZero:true,omittedModesSetToZero:false},{tailTendsToZero:true,omittedModesSetToZero:false}]};
 return {G,args:{system,exact,body,Y,parameters,finite},definition};
}
const rejects=modify=>{const x=make();modify(x);assert.throws(()=>check(x.G,x.args),{code:'ORIGINAL_COUPLED_INVERSE_PROVENANCE_FAILED'});};
test('native coupled inverse is a string handle with a numeric exact Fourier value',()=>{
 const x=make(),v=check(x.G,x.args);
 assert.equal(v.pass,true);assert.equal(v.finiteFourierModes,8);
 assert.equal(v.numericalCoefficientIntervalsAvailable,false);
});
test('stale pre-Signed auxiliary facade inverse is not the new coupled inverse',()=>rejects(x=>{x.G.nodes[8].op='m3_aux_inverse_partial';}));
test('foreign coupled inverse source handle cannot pass',()=>rejects(x=>{x.G.nodes[8].args[0]='coupled-inverse:99';}));
test('different original inverse body fails',()=>rejects(x=>{x.definition.body=1;}));
test('original torus directions must be preserved',()=>rejects(x=>{x.definition.directions[4]=3;}));
test('wrong inverse derivative order is not an unchanged Fourier inverse',()=>rejects(x=>{x.G.nodes[8].args[2][1]=1;}));
test('finite Fourier sum cannot be substituted for the infinite limit',()=>rejects(x=>{x.args.finite.finiteSumClaimedWholeInverse=true;}));
test('source derivative tail is mandatory',()=>rejects(x=>{x.args.finite.tails.pop();}));
test('duplicate actual inverse input coordinates cannot be accepted',()=>rejects(x=>{x.args.parameters[3]=0;}));
