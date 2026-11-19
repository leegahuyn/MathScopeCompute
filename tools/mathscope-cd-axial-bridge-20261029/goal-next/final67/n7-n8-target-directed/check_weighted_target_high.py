"""Authenticate source and exact order bookkeeping for external target N7/N8."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import spec_from_file_location, module_from_spec
from math import factorial
from pathlib import Path
import json
if not __debug__:
    raise RuntimeError("Run with assertions enabled.")
SOURCES = {
 'actual-common-target-weighted-norms.mjs':'6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a',
 'actual-all-band-background-norm-kernel.mjs':'384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15',
 'actual-compact-all-band-background-norms.mjs':'62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464',
 'actual-stress-direction-program.mjs':'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5',
 'actual-covariance-sensitivity.mjs':'f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c',
}
def main():
 p=ArgumentParser(description=__doc__);p.add_argument('goal',type=Path);p.add_argument('directory',type=Path);a=p.parse_args()
 cp=a.goal/'first-scale-closure/check_first_scale_closure.py'
 assert sha256(cp.read_bytes()).hexdigest()=='9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'
 spec=spec_from_file_location('reader',cp);reader=module_from_spec(spec);spec.loader.exec_module(reader)
 src={}
 for name,pin in SOURCES.items():
  raw=reader.git_blob(a.goal.parents[2],'research-ide/mathscope-m2/navier/'+name)
  assert sha256(raw).hexdigest()==pin,name
  src[name]=raw.decode()
 def clauses(name,*values):
  for value in values:assert value in src[name],(name,value)
 clauses('actual-common-target-weighted-norms.mjs',
  'initialPole:0,order:m','initialPole:3,order:m',
  'profileOrders[0]===0','b.bound','expansion=family.source.backgroundNorms.coefficientExpansions.leadingF',
  'pole:3+3*order','delta_*=min(1,log(X/Xa),log(Xb/X))',
  'anchorAtPositiveDistance:width,flatEndpointNeverPointEvaluated:true',
  'Xlo=G.mul(c.Xa,G.exp(G.div(c.t1,q(8))))',
  'Xhi=G.mul(c.Xb,G.exp(q(-1,4)))')
 clauses('actual-all-band-background-norm-kernel.mjs',
  'put([...term.profileOrders],chart.derivative(term.coefficient,axis))',
  'G.mul(term.coefficient,chart.coefficients[axis][j])',
  'beta[j]++','includesCoefficientDerivatives:true')
 clauses('actual-covariance-sensitivity.mjs',
  'thetaShear=G.mul(q(2),X,G.derivative(F,X))',
  'zShear=G.div(G.mul(q(2),X,G.derivative(U,X)),sqrt2X)',
  'Pi=G.add(G.core.P0,Cp)')
 clauses('actual-stress-direction-program.mjs',
  "exactFactorization:{inner:'T0=e_a*(innerTheta,innerZ)'",
  "outer:'T0=exp(-4/delta^2)*delta^-3*(outerTheta,delta^6*outerZ)'")
 r=json.loads((a.directory/'weighted-target-high.json').read_bytes())
 prog=(a.directory/'weighted-target-high-program.json').read_bytes()
 assert sha256(prog).hexdigest()==r['programSHA256']
 assert r['sourceParameterSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
 assert r['scope']['nativeN7N8NormRootsEvaluated'] is False
 assert r['scope']['oldRZAggregateRelabeledRZT'] is False
 assert r['scope']['finalJets']=='0/67'
 assert [x['order'] for x in r['rows']]==[7,8]
 # The exact recurrence retains all coefficient derivatives. Terms with
 # positive s-profile order vanish; remaining profiles are X^r eta^e, r+e<=m.
 orders={}
 for m,row in zip([7,8],r['rows']):
  indices=[(rad,eta) for rad in range(m+1) for eta in range(m-rad+1)]
  assert len(indices)==(m+1)*(m+2)//2==row['profileTerms']
  assert row['pole']==3+3*m
  assert row['innerDerivativePower']==608+120*m
  # Highest target shear derivative is 2X F^(m+1)+2m F^m.
  # Positive-domain coefficient 2X does not disappear.
  orders[str(m)]={'directTargetOrder':m,'directLeadingOrder':m+1,
   'nativeFTCOrder':m+2,'nativeFTCLeadingOrder':m+3,
   'highestShearCoefficient':'2X>0','secondShearCoefficient':2*m,
   'profileCount':len(indices)}
 # A max common through-order regular norm bounds every bivariate derivative.
 # The outer scalar Taylor ledger bounds the sum at a fixed total degree;
 # r! e! <= (r+e)!, so factorial times that coefficient bounds each derivative.
 outer=json.loads((a.goal/'whole-k-annular-wrz-norm/target-numerical/target-outer-numerical.json').read_bytes())
 for row in r['rows']:
  m=row['order']
  expected=max(int(v)*factorial(k) for series in outer['integerTaylor'] for k,v in enumerate(series[:m+1]))
  assert expected==int(row['outerInteger'])
 # Every final endpoint is exp^5(a), 0<a<2^21; this is a concrete loose
 # closed scalar upper independent of any local C8 candidate.
 tops=[]
 for row in r['rows']:
  e=row['enclosure']['upper']
  for _ in range(5):assert set(e)=={'exp'};e=e['exp']
  assert set(e)=={'rational'}
  top=Q(e['rational']);assert 0<top<2**21;tops.append(str(top))
 result={'schema':'MathScope.ExternalTargetHighSourceAndOrderAudit/1','status':'PASS_SOURCE_PINS_AND_EXACT_EXTERNAL_BOUND_BOOKKEEPING',
  'fixedOriginalCommit':'f8cb4034e86d7b669d52a6f2248aebba156b51b5','sourceSHA256':SOURCES,
  'receiptSHA256':sha256((a.directory/'weighted-target-high.json').read_bytes()).hexdigest(),
  'programSHA256':r['programSHA256'],'orders':orders,'closedCommonUpper':'exp^5(2^21)',
  'directedTopArguments':tops,
  'remainingHAndY':'Independent source H/inverseH/pulse/normal quotient C8 primitive enclosures and external-target transport to selected sequence remain. Pointwise leading C9 does not by itself prove those denominators.',
  'scope':'Authenticated original-source formulas and exact integer/rational bookkeeping. Written analytic ledgers remain premises. No native target norm-root, complete class, final jet or release promotion.'}
 (a.directory/'source-audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('PASS source pins; exact target7/8 profile and shear orders; both external upper endpoints below exp^5(2^21)')
if __name__=='__main__':main()
