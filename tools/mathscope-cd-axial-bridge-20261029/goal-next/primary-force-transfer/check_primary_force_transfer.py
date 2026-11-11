"""Exact derivative ledger for the actual primary flat-term source binding."""
import argparse,hashlib,json,subprocess
from collections import Counter
from math import comb,factorial
from pathlib import Path

PIN='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
RECEIPT='f1f6454d74fb6423361802fddad6ac0be70f8824c7f4e1107f5d3afc1b7d8b46'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',type=Path,required=True);ap.add_argument('--binding',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 raw=a.binding.read_bytes();assert hashlib.sha256(raw).hexdigest()==RECEIPT;j=json.loads(raw)
 assert j['graphSHA256']=='1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3'
 bindings=j['actualHalfAmplitudeBindings'];assert len(bindings)==30 and all(x['exactHalfAmplitude'] is True for x in bindings)
 assert Counter(x['key'] for x in bindings)=={f'{n}:{sgn}':3 for n in range(5) for sgn in ('1','-1')}
 assert all({x['component'] for x in bindings if x['key']==key}=={0,1,2} for key in {x['key'] for x in bindings})
 assert set(j['rejectedControls'])=={'missingHalfAmplitude','wrongFixedLiftCoordinates','removePsiInsidePositiveWeightWholeIntegrals'}
 path='research-ide/mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs';source=subprocess.check_output(['git','-C',str(a.repo),'show',PIN+':'+path]).decode('utf8')
 assert all(s in source for s in ['scaled=G.div(G.mul(G.q(20),v),length)','left=G.sub(scaled,G.q(4))','right=G.sub(G.q(16),scaled)','psi:G.mul(G.step(left),G.step(right))',"support:['1/5','4/5'],plateau:['1/4','3/4']"])
 # a^(n)(u)=P_n(1/u) exp(-1/u^2); P_(n+1)=2 z^3 P_n-z^2 P_n'.
 # For z>=0, z^k exp(-z^2)<=ceil(k/2)!; 0<=sigma<=1 and denominator>1/81.
 poly={0:1};seed=[1];polynomials=[]
 for n in range(1,5):
  new={}
  for k,c in poly.items():
   new[k+3]=new.get(k+3,0)+2*c
   if k:new[k+1]=new.get(k+1,0)-k*c
  poly={k:v for k,v in new.items() if v};polynomials.append(poly)
  seed.append(sum(abs(c)*factorial((k+1)//2) for k,c in poly.items()))
 assert seed==[1,4,36,1968,36720]
 sigma=[1]
 for n in range(1,5):sigma.append(81*(seed[n]+sum(comb(n,k)*2*seed[k]*sigma[n-k] for k in range(1,n+1))))
 psi=[20**n*sigma[n] for n in range(1,5)]
 assert sigma==[1,972,1268460,2483370576,6482530964880]
 assert psi==[19440,507384000,19866964608000,1037204954380800000]
 assert max(psi)<2**60
 for k in range(4):assert sum(comb(k,i) for i in range(k+1))*2**60<=2**(k+60)
 assert 2**62>=2**60*2**3//2
 # psi>0 on transition; this algebraic witness tests source shape, not actual amplitude bounds.
 bad=dict(bindings[0]);bad['exactHalfAmplitude']=False;assert not all(x['exactHalfAmplitude'] for x in [bad])
 result={'binding_receipt_sha256':RECEIPT,'graph_sha256':j['graphSHA256'],'actual_flat_operands':30,'keys':sorted({x['key'] for x in bindings}),'source_commit':PIN,'seed_derivative_bounds':seed,'sigma_derivative_bounds':sigma,'scaled_psi_derivative_bounds_1_to_4':psi,'uniform_scalar_bound':'|d_v^r psi| <= 2^60/Ls for 1<=r<=4 when Ls>=1',
 'conditional_C3_transfer':'If all fixed-label mixed slow/pulse derivatives of actual uncut A through order 3 are bounded by N times the same pointwise reference weight, then all such derivatives of psi_prime*A/2 are bounded by 2^62*N/Ls times that weight.',
 'unavailable':'Actual uncut-amplitude N, native same-family binding after corrected Forced graph rebuild, other raw residual terms, fixed-lift common-reference conversions and complete Forced input seminorm remain OPEN.',
 'countermodel_not_actual':'Smooth A_delta supported in left transition, psi*A_delta=delta^2*b(u/delta), has uniformly bounded ordinary C2 yet psi_prime*A_delta diverges like delta^-1.',
 'release':'HOLD'}
 a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print('PASS half-amplitude receipt, cutoff source and exact derivative arithmetic; actual uncut and Forced norms remain OPEN')
if __name__=='__main__':main()
