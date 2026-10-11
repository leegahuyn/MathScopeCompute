import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {physicalCenterCutoffPlateauAudit} from '../actual-physical-center-kernel.mjs';

function fixture(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
    R=G.fresh('radial_correction_R'),Z=G.fresh('radial_correction_Z'),T=G.fresh('radial_correction_T'),
    xi=G.fresh('radial_correction_xi'),v=G.fresh('radial_correction_v'),
    Ls=G.exp(G.fresh('radial_correction_log_length')),r0=q(1,1n<<34n),
    abs=G.sqrt(G.pow(G.div(xi,r0),2)),
    chi=G.choose(abs,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),abs))),G.zero),
    psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),
      G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))),
    // The magnitude M is an arbitrary positive exponential. It has no
    // upper bound here; a, a' and a'' all remain nonzero before restriction.
    M=G.exp(G.fresh('radial_correction_log_M')),a=G.mul(M,G.pow(R,3)),
    slow=G.add(G.pow(R,4),G.mul(R,Z,T),G.mul(G.pow(R,2),G.pow(v,2))),
    Dr=x=>G.add(G.derivative(x,R),G.mul(a,G.derivative(x,xi))),
    atXiCenter=x=>G.substitute(x,xi,G.zero);
  return {G,q,R,Z,T,xi,v,Ls,r0,chi,psi,M,a,slow,Dr,atXiCenter};
}

test('the original open transverse plateau removes arbitrary radial-fast coefficients only after full differentiation',()=>{
  const p=fixture(),{G,R,chi,slow,a,Dr,atXiCenter}=p,
    plateau=physicalCenterCutoffPlateauAudit(G,pick(p,['chi','psi','xi','v','Ls','r0']));
  assert.equal(plateau.pass,true);
  assert.notEqual(G.derivative(a,R),G.zero);
  assert.notEqual(G.derivative(G.derivative(a,R),R),G.zero);
  let actual=G.mul(chi,slow),expected=slow;
  for(let order=1;order<=3;order++){
    actual=Dr(actual);expected=G.derivative(expected,R);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(atXiCenter(actual),expected),{maxTerms:18000}).pass,true);
  }
  assert.equal(plateau.sourceAuthenticated,false);
});

test('mixed slow and fast-time derivatives have the same source plateau restriction',()=>{
  const p=fixture(),{G,Z,T,v,chi,slow,Dr,atXiCenter}=p;
  for(const axis of [Z,T,v]){
    const actual=Dr(Dr(G.derivative(G.mul(chi,slow),axis))),
      expected=G.derivative(G.derivative(G.derivative(slow,axis),p.R),p.R);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(atXiCenter(actual),expected),{maxTerms:18000}).pass,true);
  }
});

test('a nonflat transverse body retains the radial-fast term at the same center',()=>{
  const p=fixture(),{G,R,xi,slow,a,Dr,atXiCenter}=p,body=G.mul(xi,slow),
    actual=atXiCenter(Dr(body)),omitted=atXiCenter(G.derivative(body,R));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(actual,G.mul(a,slow)),{maxTerms:18000}).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(actual,omitted),{maxTerms:18000}).pass,false);
});

function pick(value,keys){return Object.fromEntries(keys.map(key=>[key,value[key]]));}
