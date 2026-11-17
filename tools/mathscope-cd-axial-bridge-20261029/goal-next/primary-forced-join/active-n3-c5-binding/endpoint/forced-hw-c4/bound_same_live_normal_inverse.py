#!/usr/bin/env python3
"""Source-bound annular lower bound for both actual normal denominators."""
import hashlib,json
from pathlib import Path
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def source(path,pin):
 b=Path(path).read_bytes();assert blob(b)==pin,path;return b
base=Path('work/goal-next/continuation30/forced-probe/runtime/research-ide')
frame=source(base/'mathscope-m2/navier/actual-covariance-matrix.mjs','80c0976b8bbd7b24a1f9e094937d1822726b240d')
band=source(base/'mathscope-m3/navier/source-global-band.mjs','1f1c18a26372c998d8389b6c5138b3c9d3a66f36')
window=source(base/'mathscope-m3/navier/global-source-index.mjs','94bdacdff8b40fbc80c23add81202a5b41c3fbdf')
for text,frags in ((frame,[b'n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]']),
 (band,[b'epsilon=power(Q,h),k=G.ceiling(G.inv(G.sqrt(epsilon)))',b'p=G.div(roundedInteger,k)',b'nonzeroAngularInteger:true',b'X=G.div(G.pow(R,2),G.mul(q(2),s))']),
 (window,[b"Q=G.exp(G.neg(G.mul(ell,log2)))"])):
 for s in frags:assert s in text,s
live=Path('work/goal-next/continuation40/first-cycle-43372241418/same-family-mode-two.json');L=json.loads(live.read_bytes())
assert L['completeForcedSeal'] and L['status']=='VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED'
checks={r['id']:r['pass'] for r in L['full']['checks']}
ids=['actual-forced-original-pulse-domain-0:1-2','actual-forced-original-pulse-domain-1:1-2']
assert all(checks.get(x) is True for x in ids)
P=Path('work/goal-next/continuation42/forced/n3-projected-m2-source-c4.json');p=json.loads(P.read_bytes());assert p['status']=='CONDITIONAL_SAME_LIVE_PROJECTED_M2_SOURCE_C4' and p['sameLiveSHA256']==hashlib.sha256(live.read_bytes()).hexdigest()
out={'status':'CONDITIONAL_SAME_LIVE_NORMAL_INVERSE_BOUND','branches':['0:1','1:1'],'harmonic':2,'checkedPulseDomainIDs':ids,
 'sourceNormalTheta':'n_theta = p/R = roundedInteger/(k*R)',
 'bound':'0 < 1/(n dot n) <= k^2 R^2 <= 4*Renv^2/epsilon',
 'proof':'The actual signed carrier is a nonzero integer divided by k, so |roundedInteger|>=1. Since n is real, n dot n >= n_theta^2. The exact original annulus satisfies X=R^2/(2s), s<=2, X<=Xb and 4Xb<=Renv^2. For 0<epsilon<=1, ceil(epsilon^(-1/2)) <= 2 epsilon^(-1/2). Fixed-label H_w changes neither R nor the angular carrier.',
 'projectedC4Replacement':'The M from n3-projected-m2-source-c4.json may be chosen as max(1, all required normal derivative magnitudes through C4, 4*Renv^2/epsilon).',
 'scope':'Conditional on the original nonzero-integer carrier, epsilon>0, annular R>0, s<=2 and source geometry 4Xb<=Renv^2. It removes the inverse-normal term as an independent analytic unknown but does not bound normal derivatives, C4, the matrix propagator or the forced output.','sameLiveSHA256':hashlib.sha256(live.read_bytes()).hexdigest(),'priorProjectionSHA256':hashlib.sha256(P.read_bytes()).hexdigest(),
 'sourceGitBlobs':{'movingFrame':blob(frame),'band':blob(band),'window':blob(window)},'release':'HOLD'}
dest=Path('work/goal-next/continuation42/forced/n3-normal-inverse-bound.json');dest.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS actual normal inverse <= 4*Renv^2/epsilon, conditional source domain')
