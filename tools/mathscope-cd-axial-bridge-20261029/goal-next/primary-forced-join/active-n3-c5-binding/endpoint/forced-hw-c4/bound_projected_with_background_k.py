#!/usr/bin/env python3
"""Conditional source-derived numerical coefficient for two projected m=2 inputs."""
import hashlib,json
from fractions import Fraction as Q
from pathlib import Path
sha=lambda b:hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
D=Path('work/goal-next/continuation42/forced')
geom=D/'n3-m2-c4-source-geometry.json';g=json.loads(geom.read_bytes());assert g['status']=='CONDITIONAL_ACTUAL_M2_C4_GEOMETRY_REDUCTION'
proj=D/'n3-projected-m2-source-c4.json';p=json.loads(proj.read_bytes());assert p['status']=='CONDITIONAL_SAME_LIVE_PROJECTED_M2_SOURCE_C4'
assert g['pins']['projectionSHA256']==sha(proj.read_bytes())
whole=Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json');K=json.loads(whole.read_bytes())
assert sha(whole.read_bytes())=='0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb' and K['K']==18310069
chart=Path('work/goal-next/continuation37/slow-chart-directed.json');h=json.loads(chart.read_bytes())
assert h['status']=='DIRECTED_COMMON_FTC_UPPER' and h['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
def inner(v,expected):
 j=0
 while list(v)==['exp']:j+=1;v=v['exp']
 assert j==expected and list(v)==['rational'];return Q(v['rational'])
a=inner(K['enclosure']['upper'],10);b=inner(h['H']['upper'],4)
assert a>13 and b>13 and max(a,b)+2<2**21 and 5044<2**13
background=Path('work/goal-next/continuation27/original-primary-degree-runtime/research-ide/mathscope-m2/navier/actual-compact-all-band-background-norms.mjs');body=background.read_bytes()
assert blob(body)=='90d2d62ce4d12416f460b8b7581c386197150039'
for s in (b"FTotal:G.add(F0,Ferror),GTotal:G.add(G0,Gerror)",b'for(let j=0;j<=m;j++)',b'Every ordinary slow derivative of F and G',b'B_m:G.maximum(Bnorm,rows[j+2].Cslow'):
 assert s in body,s
source=Path('work/goal-next/continuation32/n4-25m-preflight/runtime/research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs');s=source.read_bytes();assert blob(s)=='505a33a2a3a8581a7b72bcc3d1a904ebc2ea73bf'
assert b'backgroundRow.B_m' in s and b'constant:G.pow(K,d.power)' in s
old=Path('work/goal-next/continuation41/forced-transfer/n3-selected-lifts-exact.json');oldj=json.loads(old.read_bytes());assert oldj['status']=='CONDITIONAL_TWO_SAME_LIVE_M2_EXPLICIT_AFFINE_LIFT'
assert 13840==16*865 and 3461==1+4*865 and 5044==15+1+2*2514
# 808704 comes from 3*2^4*16*1053; 3125^2/4 from the real source half,
# fixed affine lift 5^5 and the retained full complex curl components.
C=808704*(1+81*720**4)*13840**15*3461*3125**2*33**10//4
assert C*4==808704*(1+81*720**4)*13840**15*3461*3125**2*33**10
out={'status':'CONDITIONAL_SAME_LIVE_M2_PROJECTED_WEIGHTED_COEFFICIENT','branches':['0:1','1:1'],
 'inequality':'|D^alpha projectedSource_i| <= C*T25*P^16*S^26*epsilon^(-31/2-kappa_s)*W5(H_w)^2, |alpha|<=4.',
 'integerCoefficient':str(C),'carrierP':'max(1, |p|, |pz|, |x0|) at the actual fixed label.',
 'weightW5':'The original max through order five of the sum of the weighted primary and full-curl remainder source envelopes, including both epsilon exponents, zeta, boundary poles and P(v); evaluated at H_w.',
 'sourceGeometryReduction':'On the same fixed-label domain, B5(F,G)<=Cslow8<=B6<=K. Given A<=K*epsilon^(-kappa_s), N4<=865*P*K*S*epsilon^(-kappa_s) and C4<=3461*P*K*S*epsilon^(-1/2-kappa_s).',
 'normalProjectionReduction':'Let Kstar=max(K,Renv^2,1). For 0<=kappa_s<=1, M<=13840*P*Kstar*S*epsilon^(-1).',
 'directedGap':'The original K upper is exp^10(a), and the independently source-bound H=max(2,Lambda,Renv) upper is exp^4(b). With a,b>13 and max(a,b)+2<2^21, Kstar^5044 < exp^10(max(a,b)+2) < T25. The extra rational gap is necessary; K<T25 alone would not justify K^5044<T25.',
 'scope':'Same live original two m=2 projected input branches on the admitted fixed-label shell, conditional on all original analytic source envelopes, source carrier/nonzero normal and original fixed-label A<=K*epsilon^(-kappa_s) bound. P and W5 remain actual pointwise variables; the negative epsilon exponent is not an epsilon-uniform class bound. Duhamel/inverse, output fields, all-order proofs and final jets remain OPEN.',
 'assumptions':['0<epsilon<=1','0<=kappa_s<=1','S>=1','P>=1','Renv<=H','the original C8 and primary classes and K upper apply in the actual mapped domain','same fixed-label A<=K*epsilon^(-kappa_s)','positive normal and cutoff regularity'],
 'sourcePins':{'wholeK':sha(whole.read_bytes()),'slowChart':sha(chart.read_bytes()),'backgroundNormGitBlob':blob(body),'primaryClassGitBlob':blob(s),'geometry':sha(geom.read_bytes()),'projection':sha(proj.read_bytes()),'lift':sha(old.read_bytes())},'release':'HOLD'}
(D/'n3-projected-m2-weighted-bound.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS conditional explicit weighted C4 coefficient, Kstar^5044<T25')
