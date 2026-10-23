import test from 'node:test';
import assert from 'node:assert/strict';
import {certifySignedTangencyByOriginalFrame as certify} from '../navier/signed-source-frame-tangency.mjs';

class Graph {
  constructor(){this.nodes=[];this.memo=new Map();this.zero=this.make('q',[0]);this.one=this.make('q',[1]);}
  make(op,args){const k=JSON.stringify([op,args]);if(this.memo.has(k))return this.memo.get(k);const id=this.nodes.length;this.nodes.push({op,args});this.memo.set(k,id);return id;}
  fresh(x){return this.make('coordinate',[x]);}
  mul(...x){return this.make('mul',x);}
  add(...x){return this.make('add',x);}
  neg(x){return this.make('neg',[x]);}
  sub(x,y){return this.make('sub',[x,y]);}
  div(x,y){return this.make('div',[x,y]);}
  pow(x,y){return this.make('pow',[x,y]);}
  sqrt(x){return this.make('sqrt_positive',[x]);}
}
const dot=(G,x,y)=>G.add(...x.map((v,i)=>G.mul(v,y[i])));
const mul=(G,A,B)=>A.map(row=>B[0].map((_,j)=>dot(G,row,B.map(col=>col[j]))));
function source(){
 const G=new Graph(),n=[0,1,2].map(i=>G.fresh('n'+i)),
   nt=G.sqrt(G.add(G.pow(n[1],2),G.pow(n[2],2))),Ka=[G.div(n[1],nt),G.div(n[2],nt)],
   Na=[Ka[1],G.neg(Ka[0])],sa=G.div(n[0],nt),
   U=[[G.one,G.zero],[G.neg(G.mul(sa,Ka[0])),Na[0]],[G.neg(G.mul(sa,Ka[1])),Na[1]]],
   c=G.fresh('c'),J=[[G.one,G.one],[c,G.neg(c)]],B=mul(G,U,J),
   z=[G.fresh('z0'),G.fresh('z1')],t=mul(G,B,z.map(x=>[x])).map(x=>x[0]),
   epsilon=G.fresh('eps'),deltaAmplitude=G.fresh('da'),chi=G.fresh('chi'),
   psi=G.fresh('psi'),slowCutoff=G.fresh('slow'),
   weighted=t.map(x=>G.mul(slowCutoff,G.mul(G.sqrt(epsilon),deltaAmplitude,chi,psi,x))),
   f={frame:{n,nt,U,J,B},z,t};
 const params={epsilon,deltaAmplitude,chi,psi,slowCutoff,graphEqual:()=>({pass:true})};
 return {G,f,weighted,params};
}
const negative=(modify,code)=>{const x=source();modify(x);assert.throws(()=>certify(x.G,x.f,x.weighted,x.params),e=>e.code===code,code);};
test('real UJz moving-frame provenance yields compositional tangency proof',()=>{
 const x=source(),r=certify(x.G,x.f,x.weighted,x.params);
 assert.equal(r.pass,true);assert.equal(r.checks.length,7);assert.equal(r.sourceNumericallyEvaluated,false);
});
test('unbound nt is not source-frame proof',()=>negative(x=>{x.f.frame.nt=x.G.sqrt(x.G.fresh('wrong'));},'SIGNED_FRAME_NT_POSITIVITY_UNPROVED'));
test('forged U vector fails',()=>negative(x=>{x.f.frame.U[2][0]=x.G.fresh('wrongU');},'SIGNED_FRAME_BASIS_MISMATCH'));
test('forged J fails',()=>negative(x=>{x.f.frame.J[1][1]=x.G.fresh('wrongJ');},'SIGNED_FRAME_TRANSPORT_MISMATCH'));
test('forged B fails',()=>negative(x=>{x.f.frame.B[1][1]=x.G.fresh('wrongB');},'SIGNED_FRAME_TRANSPORT_MISMATCH'));
test('forged t or Volterra z fails',()=>negative(x=>{x.f.t[0]=x.G.fresh('wrongT');},'SIGNED_FRAME_PULSE_MISMATCH'));
test('forged amplitude or injected delta_a fails',()=>negative(x=>{x.params.deltaAmplitude=x.G.fresh('wrongA');},'SIGNED_FRAME_AMPLITUDE_MISMATCH'));
test('failure of cleared normal identity fails closed',()=>negative(x=>{x.params.graphEqual=()=>({pass:false});},'SIGNED_FRAME_RATIONAL_PROOF_FAILED'));
test('one column certified, the other not: rejects',()=>negative(x=>{let i=0;x.params.graphEqual=()=>({pass:++i===1});},'SIGNED_FRAME_RATIONAL_PROOF_FAILED'));
test('missing authentic z rejects',()=>negative(x=>{delete x.f.z;},'SIGNED_FRAME_CERTIFICATE_MISSING'));
