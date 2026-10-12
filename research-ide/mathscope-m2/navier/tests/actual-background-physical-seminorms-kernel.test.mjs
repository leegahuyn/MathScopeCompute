import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {rectangularSourceFTC,assertActualBackgroundPhysicalSeminorms,assertActualPhysicalCutoffSelector} from '../actual-background-physical-seminorms.mjs';

function signedFace(G,receipt,face){
  const {coordinates,lower}=receipt,selected=face.selectedCoordinates;
  const variables=selected.map((_,i)=>G.fresh('independent_signed_face_'+face.mask+'_'+i));
  const argumentsAtFace=coordinates.map((x,i)=>selected.includes(x)?variables[selected.indexOf(x)]:lower[i]);
  let result=G.simultaneousSubstitute(face.derivative,coordinates,argumentsAtFace);
  for(let k=variables.length-1;k>=0;k--){const j=coordinates.indexOf(selected[k]);result=G.integral(result,variables[k],lower[j],coordinates[j]);}
  return result;
}

test('every anchored face reconstructs an entire polynomial by exact FTC, including mixed terms',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('test_x'),y=G.fresh('test_y'),z=G.fresh('test_z');
  const body=G.add(G.q(7),G.mul(G.q(2),G.pow(x,3)),G.mul(G.q(3),G.pow(y,2)),G.mul(G.q(5),z),
    G.mul(G.q(11),x,y),G.mul(G.q(13),x,z),G.mul(G.q(17),y,z),G.mul(G.q(19),x,y,z));
  const r=rectangularSourceFTC(G,{body,coordinates:[x,y,z],lower:[G.q(-1),G.q(-2),G.q(-3)],upper:[G.q(2),G.q(3),G.q(4)]});
  const terms=r.faces.map(f=>signedFace(G,r,f));
  assert.equal(r.faces.length,8);assert.equal(r.faces[0].selectedCoordinates.length,0);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(G.add(...terms),body)).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(G.add(...terms.slice(0,-1)),body)).pass,false,'the triple mixed face is indispensable');
  assert.equal(sourceGraphRationalIdentity(G,G.sub(G.add(...terms.slice(1)),body)).pass,false,'the anchored value is indispensable');
  assert.equal(G.freeCoordinates(r.bound).size,0);assert.equal(r.sourceAuthenticated,false);assert.equal(r.decimalEvaluation,false);
});

test('the FTC certificate also retains the complete one- and two-dimensional formula',()=>{
  for(const dimension of [1,2]){
    const G=new ActualConvergentExpressions(),coordinates=Array.from({length:dimension},(_,i)=>G.fresh('dim_'+i));
    const body=G.add(G.q(-3),G.mul(...coordinates.map(x=>G.add(G.one,G.pow(x,2)))));
    const r=rectangularSourceFTC(G,{body,coordinates,lower:coordinates.map(()=>G.q(-1)),upper:coordinates.map(()=>G.q(2))});
    assert.equal(r.faces.length,2**dimension);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(G.add(...r.faces.map(f=>signedFace(G,r,f))),body)).pass,true);
    assert.equal(G.freeCoordinates(r.bound).size,0);
  }
});

test('the absolute-value envelope retains a positive anchor even for constant or zero bodies',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('constant_x');
  for(const body of [G.zero,G.q(-7)]){
    const r=rectangularSourceFTC(G,{body,coordinates:[x],lower:[G.zero],upper:[G.one]});
    assert.equal(r.faces[0].upperBound,G.sqrt(G.add(G.one,G.pow(body,2))));
    assert.equal(r.faces[1].upperBound,G.one);assert.notEqual(r.bound,G.zero);
  }
});

test('an undeclared coordinate or coordinate-dependent endpoint cannot masquerade as a finite constant',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('guard_x'),y=G.fresh('guard_y');
  const valid={body:x,coordinates:[x],lower:[G.zero],upper:[G.one]};
  assert.throws(()=>rectangularSourceFTC(G,{...valid,body:G.add(x,y)}),{code:'INVALID_INPUT'});
  assert.throws(()=>rectangularSourceFTC(G,{...valid,upper:[y]}),{code:'INVALID_INPUT'});
  assert.throws(()=>rectangularSourceFTC(G,{...valid,coordinates:[x,x],lower:[G.zero,G.zero],upper:[G.one,G.one]}),{code:'INVALID_INPUT'});
  assert.throws(()=>rectangularSourceFTC(G,{...valid,body:-1}),{code:'INVALID_INPUT'});
});

test('generic FTC data and caller flags never authorize actual coefficient norms or a cutoff selector',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('unauthenticated_x');
  const r=rectangularSourceFTC(G,{body:x,coordinates:[x],lower:[G.zero],upper:[G.one]});
  assert.throws(()=>assertActualBackgroundPhysicalSeminorms({...r,G,scope:{actualSourcePhysicalSeminormConstantsConstructed:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualPhysicalCutoffSelector({G,rows:[],fullOriginalProposition55Certified:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
