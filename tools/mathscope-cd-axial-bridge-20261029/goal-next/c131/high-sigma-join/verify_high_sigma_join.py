#!/usr/bin/env python3
"""Join the two original C131 high Signed Sigma rows with actual pre input."""
import argparse,hashlib,json,runpy
from fractions import Fraction as Q
from itertools import product
from pathlib import Path
p=argparse.ArgumentParser()
for name in ('work','goal','runtime','extra','out'):p.add_argument('--'+name,type=Path,required=True)
p.add_argument('--extra-sha',required=True);a=p.parse_args();W=a.work
pins={
 'highJoin':('continuation128/sigma-high-time/verify_sigma_high_time.py','d8c677e852e91ef926e35da30148f8989fbc5d84216395ce321cdfc1f909542f'),
 'census':('continuation131/high-sigma/frontier.json','06f1c8ec97ef6361764453bc6cd65e1e4bd09d6ded2615cc1a032c2e0bed4b55'),
 'compactTT':('continuation131/high-sigma/compact.json','e61537eec32ad24aebd7e77378f14d9e29fa2bbd9ae82b8a5e297708cc163273'),
 'compactFirst':('continuation131/high-sigma/compact-first.json','140886798627b3a752090b4facbaa4ad3e0850b3f54564b72307bbe6cd83c500'),
 'local':('continuation131/high-sigma/local.json','500cae19962ad0a9af7a9e82abec487d9c44192188791b701961bc9f67f6a5fa'),
 'matrix9':('continuation131/fivemap-presigned-high/matrix-order9.json','234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d'),
 'schedule':('continuation131/fivemap-presigned-high/new-schedule.json','3b42665b9085a1b1603bdc19d1c75005dc15ffa6cdeebf3fc389af12ab146a4e'),
 'extra130':('continuation129/temporal-presigned-extra/full-covariance-first.json','797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
assert a.extra_sha=='6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663'
raw=a.extra.read_bytes();assert hashlib.sha256(raw).hexdigest()==a.extra_sha;extra=json.loads(raw)
high=D['highJoin'];paths,docs=high['loaded'](a);j=runpy.run_path(str(paths['c125Join']));ops=runpy.run_path(str(paths['arithmetic']));dep=D['census'];pre=docs['highCov']
assert dep['targetsRZT']==[[0,5,1],[1,4,1]] and dep['nativeSigmaRoots']==[22001223,22001224] and dep['actualIncrementalPressureZ']==22000443
assert dep['sourceEndpoints']==[17743711,17743713]
for k in ('c118Code','c118Packet','highCompactC106','earlyMeanProgram'):assert extra['pins'][k]==pre['pins'][k],k
assert extra['pins']['sealedScheduleSources']['originalHighSigmaC131']==pins['census'][1]
assert extra['pins']['sealedScheduleSources']['originalMatrixOrder9']==pins['matrix9'][1]
assert extra['pins']['exactMixedSignedDemand']==pins['schedule'][1]
assert D['matrix9']['status']=='VERIFIED_EXISTING_EXACT_C106_ORDINARY_MATRIX_EXTENSION'
assert D['matrix9']['allRZTMatrixAuditCount']==816 and D['matrix9']['oldC89ExactPrefixRows']==9 and D['matrix9']['maximumSuppliedOrder']==9
assert extra['status']=='VERIFIED_MIXED_SOURCE_TRANSFER_CONDITIONAL_ON_ORIGINAL_ADMITTED_ANALYTIC_PROFILES'
for q in ([0,7,1,0],[1,4,1,0]):
 row=[v for v in extra['covarianceRows'] if v['RZTL']==q];assert len(row)==1 and row[0]['allSixComponents']
roles={(f,tuple(q)) for f,q in dep['allRoles']['covariance']}
direct=high['direct_noncompact_receipt'](a,paths,docs)
middle,branches,collars=j['target_mean_tables'](ops,direct,roles)
for r in D['compactTT']['directTemporalRows']:
 key=(r['field'],tuple(r['RZTL']));assert key not in middle;middle[key]=r['recurrenceOperand']
compact=high['compact_caps'](ops,docs,j)
for r in D['compactTT']['conditionalRows']:
 field=r['field'];alpha=tuple(r['RZTL'][:3]);e=Q(r['epsilonPower']);band=Q(r['bandPower']);rank=r['logChargeHOver2Pow128']
 assert r['compactZeroOnBothOriginalCollars'] and rank==61400 and e==(2 if field=='beta' else 1)
 compact[field,alpha]=ops['Bound'](e*ops['E'],band,0,rank)
for r in D['compactFirst']['conditionalRows']:
 field=r['field'];alpha=tuple(r['RZT']);e=Q(r['epsilonPower']);band=Q(r['bandPower']);rank=r['unweightedCoefficientHOver2Pow128']
 assert rank==59326 and e==(2 if field=='beta' else 1)
 compact[field,alpha]=ops['Bound'](e*ops['E'],band,0,rank)
docs['localHigh']={**docs['localHigh'],'conditionalRows':docs['localHigh']['conditionalRows']+D['local']['conditionalRows']}
local_cap=j['adapt'](high['local_caps'],[('assert 0<=pole<=18','assert 0<=pole<=21')])
traces={tuple(t):dep['sourceTraces'][str(tuple(t))] for t in dep['targetsRZT']}
local=local_cap(ops,docs,traces)
arith=j['adapt'](ops['arithmetic'],[
 ('return Bound(2*E if f=="beta" else E,','if (f,a) in d["compactInputs"]:\n            return d["compactInputs"][f,a]\n        return Bound(2*E if f=="beta" else E,'),
 (')+3*sum(a),0,54920)',')+3*sum(a),0,d["generalCompactLogRank"])'),
 ('return Bound(E,0,pole,1)','return d["localInputs"][region,a]')])
def waves(reg):
 out={}
 for doc in (pre,D['extra130'],extra):
  rank=doc['covarianceCommonLogRankHOver2Pow128'];assert 0<rank<2**21
  for row in doc['covarianceRows']:
   r,z,t,l=row['RZTL']
   if l:continue
   assert row['allSixComponents'];q=row['regions'][reg]
   assert {tuple(x['orderedProduct']) for x in q['pairs']}=={('Primary','Primary'),('Primary','Forced1'),('Forced1','Primary'),('Forced1','Forced1'),('Forced2','Forced2')}
   e,b,pole=Q(q['minEpsilon']),Q(q['maxBand']),Q(q['maxPoleAfterModeTwoSpareGaussian'])
   assert e>=1 and b<=Q(83,2)+3*(r+z+t) and pole<=27+3*(r+z+t) and pole.denominator==1
   for name in j['MEAN_PAIRS']:out[name,(r,z,t)]=ops['Bound'](e*ops['E'],b,int(pole),rank)
 return out
spatial={(f,tuple(q)) for v in docs['spatial']['regions'].values() for f,q in v['trace']['covariance']}
capdata={'compactInputs':compact,'generalCompactLogRank':pre['compactMomentGeometryCharge']+2,'localInputs':local};result={}
for reg in high['REGIONS']:
 wave=waves(reg);missing=roles-wave.keys();assert missing<=spatial and not any(q[2] for _,q in missing)
 old=docs['spatial']['postForcedWaveCovarianceEvidence']
 for f,q in missing:wave[f,q]=ops['Bound'](ops['E'],Q(old['maxBand']),0 if reg=='middle' else old['maxPole'],2**20)
 result[reg]={}
 for target in traces:
  requests={'weightedSigmaSpatialOrders':[list(target)],'localWeightedRadialFlux':[list(x) for x in product(*(range(y+1) for y in target))]}
  vals,trace=arith(capdata,requests,middle,branches,collars,wave,reg)
  assert json.loads(json.dumps(trace))==traces[target][reg],(reg,target)
  result[reg][str(target)]={'bounds':vals,'sourceTrace':trace}
vals=[x for r in result.values() for t in r.values() for x in t['bounds']]
e=min(Q(x['epsilon']) for x in vals);band=max(Q(x['band']) for x in vals);pole=max(x['pole'] for x in vals);coeff=max(x['coefficientInHOver2Pow128'] for x in vals)
assert e>=1 and coeff<2**23
out={'schema':'MathScope.C131.OriginalSignedSigmaZ5TRZ4T/1','status':'CONDITIONAL_AUTHENTICATED_ORIGINAL_SIGMA_Z5T_RZ4T',
 'nativeSigmaRoots':dep['nativeSigmaRoots'],'actualIncrementalPressureZ':dep['actualIncrementalPressureZ'],'sourceEndpoints':dep['sourceEndpoints'],
 'targetsRZT':dep['targetsRZT'],'regions':result,'common':{'epsilon':str(e),'band':str(band),'pole':pole,'logCoefficientUnitsHOver2Pow128':coeff,'gaussian':'zeta'},
 'pins':{**{k:v[1] for k,v in pins.items()},'additionalPreSigned':a.extra_sha},
 'scope':'Original admitted chart, source frame, shifted paths, cutoff and Fourier hypotheses. Actual post-Signed, FiveMap and complete gate are separate.',
 'release':'HOLD','finalJets':0}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS conditional C131 Sigma',out['common'])
