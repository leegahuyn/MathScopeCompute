"""Exact rational controls for the chart-domain theorem; no floats."""
from fractions import Fraction as Q
from math import isqrt
import json

def sqrt_bounds(x, bits=80):
 assert x>=0
 n=isqrt((x.numerator << (2*bits))//x.denominator)
 lo=Q(n,1<<bits); hi=Q(n+1,1<<bits)
 assert lo*lo<=x<hi*hi
 return lo,hi

# h=1/4 is an illustrative exponent, not an actual admissible MathScope h.
# At s=1, eta=1/2, Z=1/2, T=3/4, F(1)=0 exactly.
sqrt_half=sqrt_bounds(Q(1,2)); sqrt_two=sqrt_bounds(Q(2))
left=(Q(1,2)-Q(1,4)*sqrt_half[1]-Q(3,4),Q(1,2)-Q(1,4)*sqrt_half[0]-Q(3,4))
right=(2-Q(1,4)*sqrt_two[1]-Q(3,4),2-Q(1,4)*sqrt_two[0]-Q(3,4))
assert left[1]<0<right[0]
assert Q(1)-Q(1,4)-Q(3,4)==0
# Exact endpoint and countermodel checks independent of the exponent.
for s in (Q(1,2),Q(2)):
 assert s-Q(0)*s-s==0
assert Q(1,2)>0 and Q(2)>0  # Z=T=0 has no root on [1/2,2].
# This branch-wide derivative bound is legitimate for actual h<1/16 and image bound.
# F'(s)>=1-8h, hence h=1/32 gives >=3/4 >1/2.
assert 1-8*Q(1,32)==Q(3,4)>Q(1,2)
print(json.dumps({'status':'PASS exact arithmetic controls, not a runtime-domain certificate',
 'interior_image_example':{'h':'1/4 illustrative, outside original tiny-h range','Z':'1/2','T':'3/4','s':'1','Fhalf_enclosure':list(map(str,left)),'F2_enclosure':list(map(str,right))},
 'exact_endpoint_roots':[{'Z':'0','T':str(s),'s':str(s)} for s in (Q(1,2),Q(2))],
 'unrestricted_invalid_example':{'Z':'0','T':'0','Fhalf':'1/2','F2':'2','reachable_by_actual_native_call':'UNPROVED'},
 'derivative_control':{'h':'1/32','lower_bound':'3/4','assumption':'image bound |Z|^2<=2^(1-2h), s in [1/2,2]'}},indent=2))
