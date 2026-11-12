"""Check pinned source parity/derivative data and exact even-axis tail algebra."""
import hashlib,json,math,sys
from fractions import Fraction as F
from pathlib import Path
assert len(sys.argv)==5,'usage: PARITY_JSON COEFFICIENT_DEPENDENCIES_JSON VALUE_TAIL_JSON OUT_JSON'
parity,dependencies,value,out=map(Path,sys.argv[1:]);pins=[(parity,'4106ba96d876b58a526bdbb26c2c1bccacab52c5ac78c7fa2334cd233e886103'),(dependencies,'c9f094b41d22f9cec2c34a2fef71b47cc95fd3b203111eee2b5e28d9596b85e0'),(value,'e91da545f90c5c215209b67687f27494015bedfcfd9349a52fb1504c81021a04')];data=[]
for p,h in pins:
 b=p.read_bytes().removeprefix(b'\xef\xbb\xbf').replace(b'\r\n',b'\n');assert b'\r' not in b and hashlib.sha256(b).hexdigest()==h,p;data.append(json.loads(b))
a,b,c=data;assert [r['system'] for r in a['rows']]==[0,3,5,7,9] and [r['nonzeroEntriesChecked'] for r in a['rows']]==[22]*5 and a['negativeWrongParityRejected'];assert [r['system'] for r in b['rows']]==[0,3,5,7,9] and b['nonzeroCoefficientDerivatives']==95 and all(r['lowerPicardNodes']==0 and r['naturalSeriesNodes']==103 for r in b['rows']);assert c['sourceActualSystems']==[0,3,5,7,9]
# For arbitrary nonnegative C,D,s and unit tail A, check the algebraic bound.
tests=0
for s in (F(1,2),F(1,8),F(1,32)):
 for C in (F(1,2),F(1),F(3),F(8)):
  for D in (F(0),F(1,3),F(5)):
   q=F(4)/s;A=F(1,17);e=A;ex=C*(1+q)*A
   direct=2*(1+q)*(D*e+C*ex/2);formula=2*(1+q)*(D+C*C*(1+q)/2)*A
   assert direct==formula;tests+=1
assert tests==36
# An abstract parity-compatible scalar control (not an actual source evaluation).
# a=1, A0=xi/4, A1=0, forcing=xi, c=0, C=2,s=1/2,D=1/4.
# W_N=sum_{k<N} (1/4)^k xi^(2k+2)/(2^(k+1)(k+1)!).
# For xi in [0,1] the ratio of successive |second-derivative| terms is <=3/8.
C=F(2);s=F(1,2);D=F(1,4);alpha=F(1,4);K=576;N=K+2;k=N
first=alpha**k*F((2*k+2)*(2*k+1),2**(k+1)*math.factorial(k+1))
toy_upper=first/(1-F(3,8));claimed=2*(1+4/s)*(D+C*C*(1+4/s)/2)*F(1,3*4**(N-2));assert toy_upper<=claimed
# Exact integral coefficient: 1/2 int_0^1 w''(sqrt(X)t)dt, and X=0 axis value is w''(0)/2.
assert F(1,2)==F(1,2)*F(1) and 3*alpha/2==F(3,8)<1
result={'schema':'MathScope.OriginalPicard.EvenXFirstDerivativeLimit/1','actualSystems':[0,3,5,7,9],'sourceParityChecks':110,'sourceCoefficientXiDerivativeRoots':95,'sourceCoefficientLowerPicardNodes':0,'algebraExactRationalTests':tests,'toyScalarTailControl':True,'conditionalEstimate':'Let s,C,K be original positive source operands, let D bound both max-row norms of partial_xi A0,A1 on [0,a] x S_(s/2), and assume the original C/2 source coefficients/forcing, eta analyticity on S_(2s), joint xi-C1 coefficient and forcing regularity with the required eta-holomorphic mixed derivatives, and the source value tail. For N>=K+2, ||partial_xi^2 E_N||_(S_(s/2)) <= 2*(1+4/s)*(D+(C^2/2)*(1+4/s))*4^(-(N-2))/3. By source-verified first-four-component radial parity, integral FTC gives ||partial_X partial_eta^m E_N||_(X in [0,a^2], eta in [-1,1]) <= m!*(2/s)^m*(1+4/s)*(D+(C^2/2)*(1+4/s))*4^(-(N-2))/3, including X=0.','DObligation':'D is the finite maximum of max-row sup norms of the 95 exact source xi-derivative entries on the fixed compact radial interval and smaller eta strip. Their source matrix closures contain leading natural-series inputs but no lower Picard calls. Original leading-data C1-xi/holomorphic-eta regularity on this domain is still a required analytic input; no numeric D enclosure was computed.','scope':'Fixed-n mathematical limit for first even-X derivative, conditional on original coefficient and forcing bounds, leading-data regularity, original value convergence, parity and valid caller domains. No all-orders source execution, native evaluator equivalence, boundary/seam jets or final gate promotion.','release':'HOLD'}
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n');print('PASS exact source parity/derivative pins, conditional even-X algebra and rational toy control')
