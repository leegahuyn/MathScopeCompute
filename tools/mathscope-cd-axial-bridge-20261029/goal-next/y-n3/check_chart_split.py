"""Exact rational controls for the b2/b3 source-chart split (not actual scale evaluation)."""
from fractions import Fraction as F
from pathlib import Path
import json
D=Path(__file__).resolve().parent
def dyad(k):return F(2**k) if k>=0 else F(1,2**(-k))
def flog(x):
 assert x>0;k=x.numerator.bit_length()-x.denominator.bit_length()
 while dyad(k)>x:k-=1
 while dyad(k+1)<=x:k+=1
 return k
states={'n2_with_margin':0,'n2_to_n3':0}
for b2 in map(F,range(2,35)):
 for k in range(4,12):
  b3=b2*F(k,2)
  for mult in (2,3):
   b4=b3*mult;lo=flog(b2);hi=flog(b3)-1
   for ell in range(lo,hi+1):
    for j in range(9,32):
     s=F(j,16);q=dyad(-ell)*s
     if not F(1,2)<s<2:continue
     assert b3*q>1
     if b3*q>=2:states['n2_with_margin']+=1
     else:
      assert 1<b3*q<2;ell3=flog(b3);s3=dyad(ell3)*q
      assert F(1,2)<s3<2 and flog(b3)<=ell3<=flog(b4)-1 and b4*q>2
      states['n2_to_n3']+=1
assert all(states.values())
out={'schema':'MathScope.N2N3.ExactChartSplitControls/1','exactRationalControls':states,'theorem':'On a valid N2 reference chart, floor(log2 b2)<=ell<=floor(log2 b3)-1 and s=2^ell*q>1/2 imply b3*q>=2*s>1. If b3*q>=2 retain N2. If 1<b3*q<2 and b4>=2*b3, use ell3=floor(log2 b3): then 1/2<2^ell3*q<2, ell3 is in the N3 source window, and b4*q>2.','limits':'Both charts must use the same actual common family; actual image, frozen representative and compatibility/flat-seam theorem remain separate. Rational cases test the proof and do not evaluate actual source scales.','release':'HOLD'}
(D/'chart-split-controls.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(states))
