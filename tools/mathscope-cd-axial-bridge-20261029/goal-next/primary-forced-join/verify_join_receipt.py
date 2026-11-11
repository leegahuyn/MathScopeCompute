"""Read back compact live-join receipt; this does not replace graph export."""
import argparse,json
from pathlib import Path

def verify(receipt,pins):
 assert receipt['status']=='VERIFIED_LIVE_SOURCE_JOIN_ONLY' and receipt['stage']=='LIVE_JOIN_ONLY_WITH_FORCED_INPUT_CLASS_OPEN'
 assert receipt['real_original_current_constructed'] and receipt['real_original_forced_seal_issued']
 assert receipt['release']=='HOLD' and receipt['actual_final67_jets_evaluated']==0
 assert pins['verifiedUnchangedPR30Files']==27 and pins['verifiedPinnedRepairFiles']==2
 a=receipt['same_family_join'];assert a['sameFamilyLiveObjectIdentitiesChecked'] is True and a['sourceGraphFullyExported'] is False
 assert a['backgroundOrder']==a['primaryBackgroundOrder']==5 and a['targetOrder']==3 and a['primaryOrder']==a['primaryFiniteOrder']==2 and a['coefficientOrder']==1
 assert a['primaryTargetOrders']==[0,1,2,3] and a['primaryTargetPoles']==[3,6,9,12]
 assert a['systems']==20 and a['components']==120 and len(a['rows'])==20
 expected={(f'{n}:{sign}',m) for n in range(5) for sign in ('1','-1') for m in (1,2)}
 assert {(row['key'],row['m']) for row in a['rows']}==expected and len({row['system'] for row in a['rows']})==20
 for row in a['rows']:
  assert len(row['components'])==6 and {(x['j'],x['part']) for x in row['components']}=={(j,p) for j in range(3) for p in ('real','imaginary')}
  changed=sum(c['raw']!=c['supported'] for c in row['components']);assert changed==row['changed'] and ((changed>0) if row['m']==1 else changed==0)
  assert all(c['primary']==0 for c in row['components'] if row['m']==2 or c['part']=='imaginary')
 for k in ('actualInputForcingWClassCertified','actualCompleteCurrentClassCertified','completeN6','newLeanKernelProof'):assert a[k] is False
 return {'status':'PASS_RECEIPT_READBACK_ONLY','systems':20,'components':120,'scope':'Compact live-check receipt only. Raw source graph, analytic W-alpha estimates and Lean proof not supplied.','release':'HOLD'}

def main():
 p=argparse.ArgumentParser();p.add_argument('receipt',type=Path);p.add_argument('pins',type=Path);p.add_argument('out',type=Path);a=p.parse_args();r=verify(json.loads(a.receipt.read_text(encoding='utf8')),json.loads(a.pins.read_text(encoding='utf8')));a.out.write_text(json.dumps(r,indent=2)+'\n',encoding='utf8');print('PASS receipt shape and exact source pin counts; no W-alpha or graph claim')
if __name__=='__main__':main()
