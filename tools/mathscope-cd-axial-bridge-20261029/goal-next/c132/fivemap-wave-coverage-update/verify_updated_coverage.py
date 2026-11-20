#!/usr/bin/env python3
"""Update the 157-role conservative coverage with separately verified rows."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();W=a.work
pins={
 'initial':('continuation132/fivemap-wave-coverage/wave-157.json','e2e60ee286364dea4711def4d95360ce5b5a3235358fa0eaa2d4fdd5c3613bc2'),
 'two':('continuation132/fivemap-wave-coverage/two-caps.json','6d2831b942253b834b1556525ef7fa78f77db975ada3671eaeefd29a2d45702a'),
 'eight':('continuation132/fivemap-vzt-wave/vzt-covariance-eight.json','443b4a53c861882707c1e533a33f59c8dbd84e1f5380e33cb93d080dcdd399c4'),
 'rzL2':('continuation131/fivemap-presigned-z4t-l2/postsigned-l2.json','b59f104897dfaa5c6e83b8a6075648014b4b908495be4cd35ce3dc57236b5b0c')}
D={}
for k,(rel,sha) in pins.items():
 raw=(W/rel).read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k;D[k]=json.loads(raw)
start=D['initial'];assert (start['requestedCount'],start['coveredCount'],start['remainingCount'])==(157,144,13)
assert D['two']['status']=='CONDITIONAL_TWO_ORIGINAL_POSTSIGNED_COVARIANCE_ROWS' and D['eight']['status']=='CONDITIONAL_EIGHT_ORIGINAL_POSTSIGNED_COVARIANCE_ROWS'
two={(x['tensor'],tuple(x['RZTL'])) for x in D['two']['targets']};eight={(x['tensor'],tuple(x['RZTL'])) for x in D['eight']['targets']}
assert len(two)==2 and len(eight)==8 and not (two&eight)
rz=D['rzL2'];assert rz['status']=='CONDITIONAL_L2_Z4T_COVARIANCE_ATTACHED' and rz['tensor']=='W^+_rz' and rz['RZTL']==[0,4,1,2]
new=two|eight|{('rz',(0,4,1,2))};old={(r['tensor'],tuple(r['RZTL'])) for r in start['remaining']}
assert len(new)==11 and new<=old
remaining=old-new;assert remaining=={('rz',(1,2,1,0)),('rz',(1,2,1,2))}
out={'schema':'MathScope.C132.OriginalFiveMap157UpdatedCoverage/1','status':'CONDITIONAL_155_OF_157_CONSERVATIVE_COVARIANCE_ROLES',
 'requested':157,'covered':155,'remaining':sorted(remaining),'newAttached':sorted(new),
 'scope':'The original conservative 157-row census has only the two listed RZ²T candidate rows outside these specifically pinned conditional receipts. Their Sigma_R²Z²T source issue is not asserted to be required by the independently reduced first-T FiveMap route. No full physical norm, complete gate or final-jet acceptance follows.','pins':pins,'release':'HOLD'}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS conservative 155/157; remaining',sorted(remaining))
