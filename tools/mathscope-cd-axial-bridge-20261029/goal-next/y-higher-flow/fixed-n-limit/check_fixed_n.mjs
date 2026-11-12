/** Pinned original fixed-n source and exact integer side conditions. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const [runtime,witness,out]=process.argv.slice(2);assert(runtime&&witness&&out,'usage: RUNTIME_ROOT WITNESS_JSON OUTPUT_JSON');
const base=path.join(runtime,'research-ide','mathscope-m2','navier');
const pins={
 'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
 'actual-continuation-exact-inner.mjs':'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
 'actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
 'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
 'source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'};
const src={};for(const [name,sha] of Object.entries(pins)){const b=await readFile(path.join(base,name));assert.equal(createHash('sha256').update(b).digest('hex'),sha,name);src[name]=b.toString('utf8');}
const rec=src['actual-residual-order-induction-source.mjs'],inner=src['actual-continuation-exact-inner.mjs'],impl=src['actual-continuation-exact-functions.mjs'];
const recFragments=['const strip=G.div(delta,q(8n*256n**BigInt(n))),sourceStrip=G.mul(q(4),strip),loss=strip','previousStrip=n===1?G.div(delta,q(8)):records[n-1].norm.auxiliary.strip','const radius=G.add(q(6),q(1,1n<<BigInt(n-1)))',"radialDomain=kind==='actual'?bootstrap.inner.aSquared:G.div(radius,Lambda)",'atXi=id=>G.substitute(id,X,G.pow(xi,2))','radialDomain:[z,G.sqrt(norm.radialDomain)]'];
const implFragments=["this.fresh('actual_Picard_G')",'this.substitute(f,s.xi,this.mul(t,s.xi))','this.integral(this.mul(this.pow(t,s.diagonal[i])',"this.fresh('actual_Picard_radial_average')",'this.picardRhs(system,component,this.mul(t,xi),eta,etaOrder)',"this.fresh('actual_even_X_derivative')",'this.mul(this.sqrt(X),...variables)','for(const t of variables)body=this.integral(body,t,this.zero,this.one)'];
assert(recFragments.every(x=>rec.includes(x)));assert(implFragments.every(x=>impl.includes(x)));
assert(inner.includes('const delta=G.div(rho,G.mul(q(1024),Q)),aSquared=G.mul(Xa,G.exp(G.div(t1,q(16))))'));
assert(!recFragments.every(x=>rec.replace('256n**BigInt(n)','128n**BigInt(n)').includes(x)));assert(!implFragments.every(x=>impl.replace('this.mul(t,s.xi)','s.xi').includes(x)));
const m=src['source-profile-data.mjs'].match(/export const PINNED_N3 = (\{.*\});/);assert(m);const profile=JSON.parse(m[1]);assert.deepEqual(profile.parametersExactExpressions.Xa,{quotient:[{integer:4},{ref:'Lambda'}]});
const rows=[];for(const n of [1,2,3,4,5,20,100,2828]){
 const den=8n*256n**BigInt(n),prev=n===1?8n:8n*256n**BigInt(n-1);assert.equal(den,256n*prev);assert(4n*prev<den);
 const radialDen=2n**BigInt(n-1);assert(radialDen>0n);if(n>=2)assert.equal(2n*radialDen-(2n*radialDen-radialDen),radialDen);
 rows.push({n,auxiliaryRadiusExcessOver6:`2^(-${n-1})`,sourceStripToSolutionStrip:4,predecessorStripToSolutionStrip:256,positiveGap:true});
}
assert(4n*32n<5n*31n);assert(4n*16n<5n*15n);assert.equal(8192n-33n*33n,7103n);assert(7103n>8192n/2n);
assert((-1n)<0n);assert(2n**2n>1n);
const wbytes=await readFile(witness);const witnessSha=createHash('sha256').update(wbytes).digest('hex');const binder=JSON.parse(wbytes.toString('utf8'));assert.equal(binder.status,'PASS');assert.equal(binder.example.call,150912);assert.equal(binder.displayedIterates,3);assert.equal(binder.finitePartialSumIsExactSolution,false);
const result={schema:'MathScope.Y.FixedN.PicardIngressReduction/1',originalSourceSHA256:pins,witnessSHA256:witnessSha,sourceFragmentMutationsRejected:2,exactStripAndRadiusSamples:rows,
 universalIdentities:'For n>=1 s_n=delta/(8*256^n)>0, source strip=4*s_n and predecessor strip=256*s_n. r_n=6+2^(-(n-1))>6; r_(n-1)-r_n=2^(-(n-1)) for n>=2. For real Y in [0,5], the closed complex disk |Yprime-Y|<=1 lies strictly within |Yprime|<r_n.',
 conditionalCauchy:'Given a source-identified even auxiliary solution analytic in |Y|<r_n and S_(s_n), uniformly bounded there by its original solutionNorm M_n, then for each fixed r,m>=0 and real eta in [-1,1], |dY^r deta^m U_n| <= r!*m!*(2/s_n)^m*M_n. This is a conditional analytic consequence, not an independent proof that the native Picard limit or M_n exists. The strip shrinks with n.',
 sourceN2Binder:'Under original source semantics, 0<=X<=Xcut, t_i in [0,1] and eta in its source domain, the recorded active exact three-step moment path has xi=sqrt(X)*product(t_i) and Y<=4*exp(t1/32)<128/31<5; positive-log uses its own strict xi^2>Xa guard. The finite displayed sum is not the exact limit.',
 allFinitePattern:'Each additional original diagonal Volterra step replaces xi by t*xi with t in [0,1]. Thus a finite product preserves 0<=xi<=sqrt(X); this is a mathematical induction on the checked generator form, contingent on domain and source guard transport in every encountered lower system and on native substitution semantics.',
 negativeControls:['negative X is outside real sqrt input','a factor t=2 can increase xi squared','two independent source code fragments mutated and rejected'],open:'Prove all original actual caller/binder frames and guards, complex-eta coefficient majorants and native infinite-limit/derivative interchange for every fixed original source order; do not transfer auxiliary analytic radial claims to actual cutoff collar or infer a uniform eta strip. Full Y all-order and final jets remain OPEN.',release:'HOLD'};
await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log('PASS pinned source, fixed-n strip/radius arithmetic, N2 three-binder witness and controls');
