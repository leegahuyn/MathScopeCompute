import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {originalCommonBandPhysicalMap,originalTemporalCutoffFullCurlForce,assertActualCommonBandPhysicalCurl} from '../actual-common-band-physical-curl.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

function fixture(){
  const G=new ActualCovarianceExpressions(new ActualConvergentExpressions()),q=(n,d=1)=>G.q(n,d),power=(a,b)=>G.exp(G.mul(b,G.log(a))),
    h=G.parameter('h'),A=G.add(q(1,2),h),D=G.sub(q(1,2),h),ell=q(8),Q=G.exp(G.neg(G.mul(ell,G.log(q(2))))),S=G.pow(ell,2),
    epsilon=power(Q,h),k=G.ceiling(G.inv(G.sqrt(epsilon))),Tg=G.add(q(4),G.sqrt(q(2))),r0=q(1,1n<<34n),
    paletteIndex=G.neg(G.ceiling(G.neg(G.div(G.sub(G.mul(G.add(G.one,h),ell,G.log(q(2))),G.log(S)),G.log(Tg))))),
    ci=G.mul(power(Tg,paletteIndex),power(Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci),
    coordinates=Object.fromEntries(['R','Z','T','theta','v'].map(n=>[n,G.fresh('map_fixture_'+n)])),xi=G.fresh('map_fixture_xi'),
    X=G.div(G.pow(coordinates.R,2),q(2)),Xb=q(128),
    source={G,coordinates,constants:{h,A,D,Xb},geometry:{ell,Q,S,epsilon,k,Tg,r0,paletteIndex,ci,Ls,Dgeom:G.sub(q(4),G.mul(q(2),G.sqrt(q(2))))},
      chart:{X,Xb},cutoffs:{xi},families:[{sign:1},{sign:-1}]};
  return {G,q,source,labels:[q(1),q(-2),q(3)]};
}

test('the original physical map keeps both palette rectangles and every fixed label',()=>{
  const {G,source,labels}=fixture(),p=originalCommonBandPhysicalMap(G,source,labels);
  assert.equal(p.rectangles.length,2);assert.ok(p.checks.every(r=>r.pass));
  assert.equal(p.palette.commonToAllBandsAndLabels,true);assert.equal(p.sourceAuthenticated,false);
  assert.equal(p.radialFast,G.derivative(p.radialPrimitive,source.coordinates.R));
  for(const r of p.rectangles)for(const root of [r.xi,r.v,...r.center])for(const template of p.templateGrid)
    assert.equal(G.freeCoordinates(root).has(template),false);
});

test('a moving label or wrong source length cannot masquerade as the original physical map',()=>{
  const {G,source,labels}=fixture();
  assert.throws(()=>originalCommonBandPhysicalMap(G,source,[source.coordinates.R,...labels.slice(1)]),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>originalCommonBandPhysicalMap(G,{...source,geometry:{...source.geometry,Ls:G.add(source.geometry.Ls,G.one)}},labels),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the temporal force contains curl of the complete variable potential without dividing by psi',()=>{
  const {G,source,labels}=fixture(),map=originalCommonBandPhysicalMap(G,source,labels),{R,v,theta}=map.coordinates,
    basePotential=[G.zero,G.zero,G.pow(R,2)],psi=G.pow(v,2),
    p=originalTemporalCutoffFullCurlForce(G,{basePotential,psi,map,residualScale:G.one,rectangle:map.rectangles[0],tag:'polynomial-fixture'}),
    expected=[G.mul(G.q(4),v,R,G.sine(theta)),G.neg(G.mul(G.q(4),v,R,G.cosine(theta))),G.zero];
  assert.ok(p.checks.every(x=>x.pass));
  assert.ok(p.body.every((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,expected[j]),{maxTerms:50000}).pass));
  assert.notEqual(p.body[0],G.zero);assert.equal(p.divisionByPsiUsed,false);assert.equal(p.sourceAuthenticated,false);
  assert.ok(p.composition.every(x=>x.auxiliaryCoordinatesEliminated&&x.zeroGuardBeforeSingularEvaluation));
});

test('a spatially varying fake time cutoff is rejected and copied claims cannot authenticate',()=>{
  const {G,source,labels}=fixture(),map=originalCommonBandPhysicalMap(G,source,labels);
  assert.throws(()=>originalTemporalCutoffFullCurlForce(G,{basePotential:[G.zero,G.zero,G.one],psi:map.coordinates.R,map,
    residualScale:G.one,rectangle:map.rectangles[0],tag:'wrong-cutoff'}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCommonBandPhysicalCurl({scope:{actualOwnCommonBandPhysicalCurl:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
