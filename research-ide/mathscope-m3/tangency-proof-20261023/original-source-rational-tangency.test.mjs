import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {globalGraphEqual} from '../navier/source-global-current.mjs';
import {certifySignedTangencyByOriginalFrame} from '../navier/signed-source-frame-tangency.mjs';

const dot=(G,x,y)=>G.add(...x.map((v,i)=>G.mul(v,y[i])));
const multiply=(G,A,B)=>A.map(row=>B[0].map((_,j)=>dot(G,row,B.map(col=>col[j]))));
const fixture=()=>{
 const G=new ActualConvergentExpressions(),
       n=[G.fresh('frame_nr'),G.fresh('frame_ntheta'),G.fresh('frame_nz')],
       nt=G.sqrt(G.add(G.pow(n[1],2),G.pow(n[2],2))),
       Ka=[G.div(n[1],nt),G.div(n[2],nt)],
       Na=[Ka[1],G.neg(Ka[0])],sa=G.div(n[0],nt),
       U=[[G.one,G.zero],[G.neg(G.mul(sa,Ka[0])),Na[0]],[G.neg(G.mul(sa,Ka[1])),Na[1]]],
       c=G.fresh('original_signed_c'),J=[[G.one,G.one],[c,G.neg(c)]],B=multiply(G,U,J),
       z=[G.fresh('source_wave_z0'),G.fresh('source_wave_z1')],
       t=multiply(G,B,z.map(x=>[x])).map(x=>x[0]),
       epsilon=G.fresh('source_epsilon'),deltaAmplitude=G.fresh('source_signed_delta_a'),
       chi=G.fresh('source_chi'),psi=G.fresh('source_psi'),slowCutoff=G.fresh('source_slow'),
       weighted=t.map(x=>G.mul(slowCutoff,G.mul(G.sqrt(epsilon),deltaAmplitude,chi,psi,x))),
       f={frame:{n,nt,U,J,B},z,t},
       opts={graphEqual:globalGraphEqual,epsilon,deltaAmplitude,chi,psi,slowCutoff};
 return {G,f,weighted,opts};
};
test('actual PR30 exact source rational checker proves both cleared original moving-frame columns',()=>{
 const {G,f,weighted,opts}=fixture(),result=certifySignedTangencyByOriginalFrame(G,f,weighted,opts);
 assert.equal(result.pass,true);
 assert.equal(result.checks.length,7);
 assert.ok(result.checks.slice(-2).every(x=>x.pass===true));
});
test('changed frame normal cannot be promoted by actual source rational checker',()=>{
 const {G,f,weighted,opts}=fixture();f.frame.n[1]=G.fresh('forged_normal');
 assert.throws(()=>certifySignedTangencyByOriginalFrame(G,f,weighted,opts),/original|source|basis|sqrt|nt/i);
});
