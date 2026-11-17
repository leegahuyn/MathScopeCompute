#!/usr/bin/env python3
"""Bind the original integer carrier to a positive m=2 damping floor."""
import hashlib,json
from pathlib import Path
D=Path('work/goal-next/continuation44/forced');W=D/'two-pulse-source-windows.json';X=json.loads(W.read_bytes());nodes={int(i):x for i,x in X['nodes'].items()}
P=D/'n3-two-actual-pulse-damping-transport.json';p=json.loads(P.read_bytes());assert p['status']=='CONDITIONAL_ACTUAL_TWO_MODE_SCALAR_DAMPING_TRANSPORT'
assert p['uncompressedSourceGraphSHA256']==X['witnessGraphSHA256'] and p['registrySHA256']==X['witnessRegistrySHA256']
band=Path('work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-global-band.mjs');raw=band.read_bytes()
blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest();assert blob=='1f1c18a26372c998d8389b6c5138b3c9d3a66f36'
for s in (b'roundedInteger=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded)',b'fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one)',b'p=G.div(roundedInteger,k)',b'nonzeroAngularInteger:true'):
 assert s in raw,s
def op(i,name):n=nodes[i];assert n['op']==name,(i,n);return n['args']
rows=[]
for r in X['rows']:
 nt=r['normal']['value'][1];invR,carrier=op(nt,'multiply');[R]=op(invR,'inverse');invk,integer=op(carrier,'multiply');[k]=op(invk,'inverse');assert k==r['k']
 assert op(integer,'smooth_piecewise')[3]==op(integer,'smooth_piecewise')[0]
 rounded=op(integer,'smooth_piecewise')[0];negative,ceiling=op(rounded,'multiply');assert negative==20 and nodes[ceiling]['op']=='ceiling'
 rows.append({'key':r['key'],'nThetaRoot':nt,'Rroot':R,'kRoot':k,'roundedIntegerRoot':integer,'roundedBeforeFallbackRoot':rounded})
assert {x['key'] for x in rows}=={'0:1','1:1'}
out={'status':'CONDITIONAL_ACTUAL_TWO_MODE_POSITIVE_DAMPING_FLOOR','rows':rows,
 'actualLowerBound':'4*epsilon*k^2*|n(w)|^2 >= 4*epsilon*roundedInteger^2/R^2 >= 4*epsilon/Renv^2 = mu > 0.',
 'reason':'The checked actual n_theta root is roundedInteger/(k R). The original rounded value is an integer; when it is zero, the retained smooth-piecewise fallback is exactly -1 or +1, so |roundedInteger|>=1. On the original annulus R^2=2sX<=4Xb<=Renv^2. The slow R, integer carrier and epsilon are fixed along w.',
 'fixedPulseC4Bound':'max_|alpha|<=4 ||D^alpha u(t)||_infinity <= F*t*exp(max(A-mu,0)*t)*sum_{j=0}^4 (15*B*t)^j/(j+1)!, with the same F,A,B source sup assumptions.',
 'conditionalContraction':'If the separately established actual bound A<mu holds, the undamped growth is dominated and ||u(t)||_infinity <= F*(1-exp(-(mu-A)*t))/(mu-A). No such dominance is asserted here.',
 'scope':'Conditional on the original positive epsilon, nonzero R, admitted annulus/radial envelope, fixed-label source binding and actual zero-data pulse system. Actual A,F,B and A<mu remain unproved; no forced output, final jet or gate closure is claimed.',
 'graphSHA256':X['witnessGraphSHA256'],'priorDampingSHA256':hashlib.sha256(P.read_bytes()).hexdigest(),'bandGitBlob':blob,'release':'HOLD'}
(D/'n3-two-actual-pulse-damping-floor.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS actual m=2 carrier damping floor; A<mu remains OPEN')
