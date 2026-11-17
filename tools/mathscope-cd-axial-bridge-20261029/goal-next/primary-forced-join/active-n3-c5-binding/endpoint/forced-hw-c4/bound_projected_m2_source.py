#!/usr/bin/env python3
"""Conditional C4 bound for the actual two projected mode-two sources."""
import hashlib,json
from pathlib import Path
def blob(x):return hashlib.sha1(b'blob '+str(len(x)).encode()+b'\0'+x).hexdigest()
source=Path('work/goal-next/second-live/node-fixture/research-ide/mathscope-m3/navier/source-forced-pulse.mjs');b=source.read_bytes()
assert blob(b)=='bf44357f7038ebe07d78ffc208cf5bd357df928a'
for literal in (b'nSquared=dot(G,n,n)',b'projection=n.map((x,i)=>n.map((y,j)=>G.sub(i===j?G.one:G.zero,G.div(G.mul(x,y),nSquared))))',b'projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))',b'forcing:projectedSource'):
 assert literal in b,literal
H=Path('work/goal-next/continuation42/forced/n3-same-live-hw-c4-pullback.json');h=json.loads(H.read_bytes())
assert h['status']=='CONDITIONAL_SAME_LIVE_HW_C4_SOURCE_PULLBACK' and len(h['branches'])==2
live=Path('work/goal-next/continuation40/first-cycle-43372241418/same-family-mode-two.json');L=json.loads(live.read_bytes())
assert hashlib.sha256(live.read_bytes()).hexdigest()==h['pins']['liveReceiptSHA256'] and L['completeForcedSeal']
rows=[r for r in L['full']['rows'] if r['key'] in ('0:1','1:1') and r['harmonic']==2]
assert {r['key'] for r in rows}=={'0:1','1:1'} and all(len(r['projected'])==3 for r in rows)
branch={r['key']:r for r in h['branches']}
for r in rows:
 assert r['originalSource']==branch[r['key']]['actualPullbackSource'] and r['H_w']==branch[r['key']]['H_w']
# q=n dot n. For |alpha|<=4, |D^alpha q|<=3*2^4*M^2.
# Reciprocal recursion has at most (2^4-1) binomial weight; h0<=M.
q4=3*2**4;one_step=(2**4-1)*q4;h4=one_step**4
assert (q4,one_step,h4)==(48,720,268738560000)
Pcoef=1+3**4*h4;assert Pcoef==21767823360001
Fcoef=16*1053;projected_factor=3*2**4*Fcoef
assert Fcoef==16848 and projected_factor==808704
out={'status':'CONDITIONAL_SAME_LIVE_PROJECTED_M2_SOURCE_C4','branches':[{'key':r['key'],'harmonic':2,'system':r['system'],'pullback':r['originalSource'],'projected':r['projected']} for r in rows],
 'N4':'A number M>=1 bounding all absolute coordinate derivatives through order four of the original real normal components along the mapped path, and also |n|^(-2).',
 'projectionFormula':'P_ij=delta_ij-n_i*n_j/(n dot n); actual projectedSource=-P*(full source composed with H_w).',
 'projectionC4Bound':'max_{i,j,|alpha|<=4}|D^alpha P_ij| <= (1+81*720^4)*M^15.',
 'conditionalSourceBound':'max_{i,|alpha|<=4}|D^alpha projectedSource_i| <= 808704*(1+81*720^4)*M^15*C4(H_w)*B5(H_w)^2.',
 'geometryAndProof':'On the actual source domain n is real and n dot n >0. Each derivative of q=n dot n through order four is <=48*M^2. From q*(1/q)=1, reciprocal derivatives satisfy H_j<=720*M^3*max_{l<j} H_l; H_0<=M, so H_j<=720^4*M^13. Leibniz for three factors gives 81*720^4*M^15 for nn^T/q, and multiplying P with the three complex pulled-back source components costs 3*2^4. The earlier exact affine H_w pullback contributes 16*1053.',
 'scope':'Formal conditional C4 bound at the actual two selected projected-source roots. M, C4 and B5 must be bounded on the original admissible mapped domain; nonzero n and analytic differentiability are explicit premises. The exact zero normalization in the source is semantic equality, not an additional estimate. No Duhamel matrix propagator, output velocity/pressure or final jet bound is asserted.',
 'sourceGitBlob':blob(b),'hwPullbackSHA256':hashlib.sha256(H.read_bytes()).hexdigest(),'sameLiveSHA256':hashlib.sha256(live.read_bytes()).hexdigest(),'release':'HOLD'}
dest=Path('work/goal-next/continuation42/forced/n3-projected-m2-source-c4.json');dest.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS actual two projected source roots; nonzero-normal C4 M bound remains conditional')
