"""Retain the actual FiveMap bump-argument and coefficient Z derivatives."""
from argparse import ArgumentParser
from hashlib import sha256
from importlib.util import spec_from_file_location,module_from_spec
import json
from pathlib import Path
import sympy as S
if not __debug__:raise RuntimeError('Keep exact assertions enabled.')
def main():
 p=ArgumentParser(description=__doc__);p.add_argument('goal',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
 readerpath=a.goal/'first-scale-closure/check_first_scale_closure.py'
 assert sha256(readerpath.read_bytes()).hexdigest()=='9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'
 spec=spec_from_file_location('reader',readerpath);reader=module_from_spec(spec);spec.loader.exec_module(reader)
 raw=reader.git_blob(a.goal.parents[2],'research-ide/mathscope-m3/navier/source-global-moment.mjs')
 assert sha256(raw).hexdigest()=='0d02d55b291db8c55db26810ae4783d62e09ac3d058fd582f4161cb444871e46'
 text=raw.decode()
 for clause in ['profile=G.div(G.substitute(eta0,x,G.div(x,scale)),scale)',
  'inQ=G.mul(g.power(s,G.neg(A)),G.substitute(profile,x,G.div(R,G.sqrt(s))))',
  'gammaDesired=G.add(...coefficients.axial.map((c,j)=>G.mul(c,copies[j].inQ)))']:
  assert clause in text,clause
 R,Z=S.symbols('R Z',real=True);A,scale=S.symbols('A lambda_j',positive=True)
 sigma=S.Function('s')(Z);c=S.Function('c_j')(R,Z);eta=S.Function('eta0')
 x=R/(S.sqrt(sigma)*scale)
 body=c*sigma**(-A)*eta(x)/scale
 expected=sigma**(-A)/scale*(S.diff(c,Z)*eta(x)-(S.diff(sigma,Z)/sigma)*c*(A*eta(x)+x*S.Subs(S.Derivative(eta(S.Symbol('u')),S.Symbol('u')),S.Symbol('u'),x)/2))
 assert S.simplify(S.diff(body,Z)-expected)==0
 toy=R**2*(1+Z)**(-A-1)
 actual=S.diff(toy,Z).subs({R:2,Z:0,A:S.Rational(1,2)})
 omitted=-A*R**2*(1+Z)**(-A-2)
 wrong=omitted.subs({R:2,Z:0,A:S.Rational(1,2)})
 assert actual==-6 and wrong==-2 and actual-wrong==-4
 result={'schema':'MathScope.C78.ActualFiveBumpZDerivative/1','status':'PASS_ORIGINAL_BUMP_COPY_CHAIN_RULE_AND_ARGUMENT_CONTROL',
  'sourceSHA256':sha256(raw).hexdigest(),'sourceCommit':'f8cb4034e86d7b669d52a6f2248aebba156b51b5',
  'sourceCopy':'B_j=s^(-A)*eta0(R/(sqrt(s)*lambda_j))/lambda_j, lambda_j=exp(j*d)',
  'fullNativeZDerivative':'D_Z(c_j B_j)=s^(-A)/lambda_j*[c_j,Z*eta0(x_j)-(s_Z/s)*c_j*(A*eta0(x_j)+(x_j/2)*eta0_prime(x_j))]',
  'interpretation':'The C77 native derivative [0,0,1,0] at actual arguments ell,boundRadius,Z,T is this full physical Z derivative. It includes coefficient and scale/bump-argument derivatives; it is not a profile eta derivative with s frozen.',
  'counterControl':{'toy':'s=1+Z,c=1,eta0(x)=x^2,lambda_j=1,A=1/2,R=2,Z=0',
   'correctDerivative':'-6','omittedBumpArgumentDerivative':'-2','difference':'-4',
   'isOriginalDataCounterexample':False},
  'scope':'Ordinary mean differentiation only. No assertion that radial whole integral vanishes, no missing FiveMap support proof supplied.'}
 a.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('PASS original FiveMap eta0 argument and coefficient Z derivatives retained')
if __name__=='__main__':main()
