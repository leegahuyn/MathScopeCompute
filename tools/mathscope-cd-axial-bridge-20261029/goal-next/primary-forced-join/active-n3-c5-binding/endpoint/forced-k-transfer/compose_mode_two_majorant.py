#!/usr/bin/env python3
"""Transfer K through the fixed-label lift to selected unpulled mode-two C4."""
import hashlib,json,math
from pathlib import Path
D=Path('work/goal-next/continuation41/forced-transfer');P=D/'n3-primary-constants-transfer.json';F=D/'n3-mode-two-source-c4.json'
p=json.loads(P.read_bytes());f=json.loads(F.read_bytes());assert p['status']=='CONDITIONAL_SAME_LIVE_PRIMARY_CONSTANTS_ENCLOSED' and f['status']=='CONDITIONAL_SAME_LIVE_MODE_TWO_C4_SOURCE_BOUND'
assert f['primaryConstantTransferSHA256']==hashlib.sha256(P.read_bytes()).hexdigest()
R=p['classConstants'];A=[x for x in R if x['field']=='primary'];B=[x for x in R if x['field']=='curlRemainder']
assert [x['order'] for x in A]==[x['order'] for x in B]==list(range(6))
assert [(x['power'],x['pole']) for x in A]==[(84,2),(445,6),(851,12),(1257,18),(1665,24),(2073,30)]
assert [(x['power'],x['pole']) for x in B]==[(472,6),(881,12),(1287,18),(1698,24),(2106,30),(2514,36)]
assert all(x['strictUpper']=='T25' for x in [*A,*B])
# Repeated differentiation of u composed with five coordinate maps produces
# at most (5)(6)...(5+r-1) terms after r differentiations. Each term has
# at most r coordinate-map derivative factors. L5>=1 covers all orders <=5.
terms=[math.prod(5+i for i in range(r)) for r in range(6)]
assert terms==[1,5,30,210,1680,15120]
half=terms[-1]//2;factor=1053*half**2
assert half==7560 and factor==60182740800
out={'status':'CONDITIONAL_TWO_SAME_LIVE_M2_SOURCE_C4_TRANSFER','selected':f['sourceBranches'],
 'compositionTermCaps':terms,'integerFactor':factor,'sourceBound':
  '|partial^alpha f_2,j| <= 60182740800 * C4 * L5^10 * T26 * W5^2, for |alpha|<=4 and j=0,1,2',
 'L5':'At the evaluated fixed label, >=1 and dominates derivatives through total order 5 of all five actual lift-coordinate maps (R,Z,T,xi,v) with respect to (R,Z,T,Y1,Y2).',
 'W5':'max_{0<=j<=5} sqrt(zeta)*P(v)*(S^p_j*epsilon^(1/2)*delta^(-d_j) + S^q_j*epsilon^(1-kappa_s)*delta^(-e_j)), evaluated at the original lifted point; p,d and q,e are the listed primary and curl-remainder source degrees.',
 'primaryDegrees':[(x['power'],x['pole']) for x in A],'curlRemainderDegrees':[(x['power'],x['pole']) for x in B],
 'C4':f['C4'],
 'proof':'Same-live source binder gives positive m=1 coefficient = half of the actual full curl after the fixed-label lift. Full curl = weighted primary + i times the nonzero curl remainder. The separately checked K transfer bounds each class constant by T25. Differentiate the actual 5-to-5 lift at most five times; at step r there are at most 5+r-1 choices per term, giving 15120 L5^5. Apply the original source quadratic Leibniz factor 1053 and T25^2 < T26.',
 'domain':'Fixed-label active source annulus, with all original represented points inside the primary class domain, delta>0, and original cutoff geometry; flat endpoint extensions are separate.',
 'limitations':'Conditional pointwise bound before H_w composition. Explicit finite/numeric C4 and L5, source-domain certification of the lift, endpoint behavior, H_w derivatives, forced inverse/output and final jets remain OPEN. Not a full-field enclosure.',
 'inputSHA256':{'primaryConstants':hashlib.sha256(P.read_bytes()).hexdigest(),'sourceC4':hashlib.sha256(F.read_bytes()).hexdigest()},'release':'HOLD'}
(D/'n3-mode-two-k-transfer.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS',factor,'* C4 * L5^10 * T26 * W5^2, conditional')
