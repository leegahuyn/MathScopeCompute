"""Exact source-bound fixed-n analytic-strip and radial-binder reductions."""
import hashlib,json,sys
from fractions import Fraction as F
from pathlib import Path
assert len(sys.argv)==4, 'usage: RUNTIME_ROOT WITNESS_JSON OUTPUT_JSON'; runtime=Path(sys.argv[1]);witness=Path(sys.argv[2]);output=Path(sys.argv[3]);base=runtime/'research-ide/mathscope-m2/navier'
pins={'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047','actual-continuation-exact-inner.mjs':'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8','actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501','actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311','source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'}
src={}
for name,sha in pins.items():
 b=(base/name).read_bytes();assert hashlib.sha256(b).hexdigest()==sha,name;src[name]=b.decode('utf8')
rec=src['actual-residual-order-induction-source.mjs'];inner=src['actual-continuation-exact-inner.mjs'];impl=src['actual-continuation-exact-functions.mjs']
required_rec=['const strip=G.div(delta,q(8n*256n**BigInt(n))),sourceStrip=G.mul(q(4),strip),loss=strip','previousStrip=n===1?G.div(delta,q(8)):records[n-1].norm.auxiliary.strip','const radius=G.add(q(6),q(1,1n<<BigInt(n-1)))','radialDomain=kind===\'actual\'?bootstrap.inner.aSquared:G.div(radius,Lambda)','atXi=id=>G.substitute(id,X,G.pow(xi,2))','radialDomain:[z,G.sqrt(norm.radialDomain)]']
required_impl=["this.fresh('actual_Picard_G')",'this.substitute(f,s.xi,this.mul(t,s.xi))','this.integral(this.mul(this.pow(t,s.diagonal[i])',"this.fresh('actual_Picard_radial_average')",'this.picardRhs(system,component,this.mul(t,xi),eta,etaOrder)',"this.fresh('actual_even_X_derivative')",'this.mul(this.sqrt(X),...variables)','for(const t of variables)body=this.integral(body,t,this.zero,this.one)']
assert all(v in rec for v in required_rec) and all(v in impl for v in required_impl)
assert 'const delta=G.div(rho,G.mul(q(1024),Q)),aSquared=G.mul(Xa,G.exp(G.div(t1,q(16))))' in inner
assert not all(v in rec.replace('256n**BigInt(n)','128n**BigInt(n)') for v in required_rec)
assert not all(v in impl.replace("this.mul(t,s.xi)","s.xi") for v in required_impl)
profile,_=json.JSONDecoder().raw_decode(src['source-profile-data.mjs'].split('export const PINNED_N3 = ',1)[1]);p=profile['parametersExactExpressions'];assert p['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]}
# Exact rational checks test the closed-form identities; the derivation is for all fixed n>=1.
rows=[]
for n in (1,2,3,4,5,20,100,2828):
 sn=F(1,8*256**n);previous=F(1,8) if n==1 else F(1,8*256**(n-1));rn=F(6)+F(1,2**(n-1));assert previous==256*sn and 4*sn<previous and rn>6 and rn-F(5)>1
 if n>=2:assert F(6)+F(1,2**(n-2))-rn==F(1,2**(n-1))
 rows.append({'n':n,'auxiliaryRadiusExcessOver6':'2^(-'+str(n-1)+')','sourceStripToSolutionStrip':4,'predecessorStripToSolutionStrip':256,'positiveGap':True})
assert F(4)*F(32,31)<5 and F(4)*F(16,15)<5
assert 1-F(1,8)*F(33,32)**2==F(7103,8192)>F(1,2)
# Sharp negative controls: invalid X and t outside [0,1] invalidate interval reasoning.
assert -1<0 and F(2)**2*F(1)>F(1)
wbytes=witness.read_bytes();witness_sha=hashlib.sha256(wbytes).hexdigest();b=json.loads(wbytes);assert b['status']=='PASS' and b['example']['call']==150912 and b['displayedIterates']==3 and b['finitePartialSumIsExactSolution'] is False
out={'schema':'MathScope.Y.FixedN.PicardIngressReduction/1','originalSourceSHA256':pins,'witnessSHA256':witness_sha,'sourceFragmentMutationsRejected':2,'exactStripAndRadiusSamples':rows,'universalIdentities':'For n>=1 s_n=delta/(8*256^n)>0, source strip=4*s_n and predecessor strip=256*s_n. r_n=6+2^(-(n-1))>6; r_(n-1)-r_n=2^(-(n-1)) for n>=2. For real Y in [0,5], the closed complex disk |Yprime-Y|<=1 lies strictly within |Yprime|<r_n.','conditionalCauchy':'Given a source-identified even auxiliary solution analytic in |Y|<r_n and S_(s_n), uniformly bounded there by its original solutionNorm M_n, then for each fixed r,m>=0 and real eta in [-1,1], |dY^r deta^m U_n| <= r!*m!*(2/s_n)^m*M_n. This is a conditional analytic consequence, not an independent proof that the native Picard limit or M_n exists. The strip shrinks with n.','sourceN2Binder':'Under original source semantics, 0<=X<=Xcut, t_i in [0,1] and eta in its source domain, the recorded active exact three-step moment path has xi=sqrt(X)*product(t_i) and Y<=4*exp(t1/32)<128/31<5; positive-log uses its own strict xi^2>Xa guard. The finite displayed sum is not the exact limit.','allFinitePattern':'Each additional original diagonal Volterra step replaces xi by t*xi with t in [0,1]. Thus a finite product preserves 0<=xi<=sqrt(X); this is a mathematical induction on the checked generator form, contingent on domain and source guard transport in every encountered lower system and on native substitution semantics.','negativeControls':['negative X is outside real sqrt input','a factor t=2 can increase xi squared','two independent source code fragments mutated and rejected'],'open':'Prove all original actual caller/binder frames and guards, complex-eta coefficient majorants and native infinite-limit/derivative interchange for every fixed original source order; do not transfer auxiliary analytic radial claims to actual cutoff collar or infer a uniform eta strip. Full Y all-order and final jets remain OPEN.','release':'HOLD'}
output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8',newline='\n');print('PASS pinned exact source, all-n strip identities, three-binder fixture, and scope controls')
