#!/usr/bin/env python3
"""Join original Sigma_R²ZT once the independent pre-Signed row is pinned."""
import argparse,hashlib,json,runpy
from fractions import Fraction as Q
from itertools import product
from pathlib import Path

p=argparse.ArgumentParser()
for name in ('work','goal','runtime','extra','out'):p.add_argument('--'+name,type=Path,required=True)
p.add_argument('--extra-sha',required=True);a=p.parse_args();W=a.work
pins={
 'highJoin':('continuation128/sigma-high-time/verify_sigma_high_time.py','d8c677e852e91ef926e35da30148f8989fbc5d84216395ce321cdfc1f909542f'),
 'census':('continuation130/sigma-rrzt/recurrence.json','792776a8535ffea5dea722ed53c363f18d1a9d56b1b882b16243808a0c2c221d'),
 'compact':('continuation130/sigma-rrzt/compact.json','239009250c59125914d8261bb5c83a6ab0b0f4c9c9fa8b6c7a7958a749e2040d'),
 'local':('continuation130/sigma-rrzt/local.json','da2922e5a1b659d626ff9ddbb6823e691ced9fadff45325755096d3eef092380'),
 'rrtCov':('continuation127/late-swirl-covariance/pre-signed-late-swirl.json','0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9'),
 'rrtLocal':('continuation127/sigma-rrt/local.json','9dd137d3efbed682416ffcb4bec0afb90215a7bcc4955b60f13b1973aad8ee9d'),
 'l9':('continuation129/temporal-presigned-extra/original-primary-l9.json','12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb'),
 'supplement':('continuation129/temporal-presigned-extra/temporal-presigned-supplement.json','de68d445e83834814bbc45351979d3839243d746bb4edd546cb624ecdb3d43e0')}
D={}
for k,(rel,sha) in pins.items():
 path=W/rel;raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==sha,k
 D[k]=runpy.run_path(str(path)) if path.suffix=='.py' else json.loads(raw)
assert a.extra_sha=='797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac'
raw=a.extra.read_bytes();assert hashlib.sha256(raw).hexdigest()==a.extra_sha;extra=json.loads(raw)
high=D['highJoin'];paths,docs=high['loaded'](a);j=runpy.run_path(str(paths['c125Join']));ops=runpy.run_path(str(paths['arithmetic']))
pre=docs['highCov'];dep=D['census'];assert dep['target']==[2,1,1] and dep['roots']==[22001223,22001224,22000443]
assert dep['fixedEndpoints']==[17743711,17743713]
for k in ('c118Code','c118Packet','highCompactC106','earlyMeanProgram'):
 assert extra['pins'][k]==pre['pins'][k],k
assert extra['pins']['sealedScheduleSources']['postedSigmaR2ZTDependencies']==pins['census'][1]
assert D['supplement']['pins']['full']==a.extra_sha and D['supplement']['pins']['protectedPrimaryL9']==pins['l9'][1]
assert D['l9']['status']=='VERIFIED_NATIVE_SHAPE_AND_CONSTANTS_CONDITIONAL_ORIGINAL_FRAME'
assert D['l9']['actualFrameCutoffOrder']>=D['l9']['requires']['degreeCutoff']==10
assert D['l9']['actualFrameRZTOrder']>=D['l9']['requires']['degreeSlowFrame']==3
assert len(D['supplement']['sixPrimaryL9RowsWithActualC106Support'])==6
assert {(f,tuple(x)) for f,x in D['supplement']['sigmaExtraTypedRoles']}=={('W_rtheta',(2,1,1,0)),('W_rz',(2,1,1,0))}
extra_row=[r for r in extra['covarianceRows'] if r['RZTL']==[2,1,1,0]]
assert len(extra_row)==1 and extra_row[0]['allSixComponents']
roles={(f,tuple(x)) for f,x in dep['allRoles']['covariance']}
direct=high['direct_noncompact_receipt'](a,paths,docs)
middle,branches,collars=j['target_mean_tables'](ops,direct,roles)
for r in D['compact']['directTemporalRows']:
 key=(r['field'],tuple(r['RZTL']));assert key not in middle;middle[key]=r['conditionalTemporal']
compact=high['compact_caps'](ops,docs,j)
for field,key in (('gamma','compactGammaRZTT'),('v','compactVRZTT')):
 row=D['compact'][key]
 assert row['RZT']==[1,1,2] and row['epsilonPower']=='1' and row['bandPower']=='25/2'
 assert row['logChargeHOver2Pow128']==30467
 compact[field,(1,1,2)]=ops['Bound'](ops['E'],Q(25,2),0,30467)
docs['localHigh']={**docs['localHigh'],'conditionalRows':docs['localHigh']['conditionalRows']+D['rrtLocal']['conditionalRows']+D['local']['conditionalRows']}
traces={(2,1,1):dep['sourceTraces']};local=high['local_caps'](ops,docs,traces)
arith=j['adapt'](ops['arithmetic'],[
 ('return Bound(2*E if f=="beta" else E,','if (f,a) in d["compactInputs"]:\n            return d["compactInputs"][f,a]\n        return Bound(2*E if f=="beta" else E,'),
 (')+3*sum(a),0,54920)',')+3*sum(a),0,d["generalCompactLogRank"])'),
 ('return Bound(E,0,pole,1)','return d["localInputs"][region,a]')])
def wave_cap(reg):
 values={}
 for doc in (pre,D['rrtCov'],extra):
  rank=doc['covarianceCommonLogRankHOver2Pow128'];assert 0<rank<2**20
  for item in doc['covarianceRows']:
   r,z,t,l=item['RZTL']
   if l:continue
   assert item['allSixComponents'];q=item['regions'][reg]
   assert {tuple(x['orderedProduct']) for x in q['pairs']}=={('Primary','Primary'),('Primary','Forced1'),('Forced1','Primary'),('Forced1','Forced1'),('Forced2','Forced2')}
   e,s,pole=Q(q['minEpsilon']),Q(q['maxBand']),Q(q['maxPoleAfterModeTwoSpareGaussian'])
   assert e>=1 and s<=Q(83,2)+3*(r+z+t) and pole<=27+3*(r+z+t) and pole.denominator==1
   for name in j['MEAN_PAIRS']:values[name,(r,z,t)]=ops['Bound'](e*ops['E'],s,int(pole),rank)
 return values
available_spatial={(f,tuple(q)) for v in docs['spatial']['regions'].values() for f,q in v['trace']['covariance']}
capdata={'compactInputs':compact,'generalCompactLogRank':pre['compactMomentGeometryCharge']+2,'localInputs':local}
regions={}
for region in high['REGIONS']:
 wave=wave_cap(region);missing=roles-wave.keys();assert missing<=available_spatial and not any(q[2] for _,q in missing)
 old=docs['spatial']['postForcedWaveCovarianceEvidence']
 for f,q in missing:wave[f,q]=ops['Bound'](ops['E'],Q(old['maxBand']),0 if region=='middle' else old['maxPole'],2**20)
 target=(2,1,1);asks={'weightedSigmaSpatialOrders':[list(target)],'localWeightedRadialFlux':[list(i) for i in product(*(range(x+1) for x in target))]}
 rows,tr=arith(capdata,asks,middle,branches,collars,wave,region)
 assert json.loads(json.dumps(tr))==dep['sourceTraces'][region],region
 regions[region]={'bounds':rows,'sourceTrace':tr}
values=[x for r in regions.values() for x in r['bounds']]
e=min(Q(x['epsilon']) for x in values);band=max(Q(x['band']) for x in values);pole=max(x['pole'] for x in values);coef=max(x['coefficientInHOver2Pow128'] for x in values)
assert e>=1 and coef<2**23
out={'schema':'MathScope.C130.OriginalSignedSigmaRRZT/1','status':'CONDITIONAL_AUTHENTICATED_ORIGINAL_SIGMA_RRZT',
 'nativeSigmaRoots':[22001223,22001224],'actualIncrementalPressureZ':22000443,'sourceEndpoints':[17743711,17743713],
 'targetsRZT':[[2,1,1]],'regions':regions,'common':{'epsilon':str(e),'band':str(band),'pole':pole,'logCoefficientUnitsHOver2Pow128':coef,'gaussian':'zeta'},
 'pins':{**{k:v[1] for k,v in pins.items()},'additionalPreSigned':a.extra_sha},
 'scope':'Conditional on same original frame, source family, chart, fixed shifted paths, cutoff and Fourier premises. Complete post-Signed covariance and full gates remain separate.',
 'finalJets':0,'release':'HOLD'}
a.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS conditional Sigma RRZT',out['common'])
