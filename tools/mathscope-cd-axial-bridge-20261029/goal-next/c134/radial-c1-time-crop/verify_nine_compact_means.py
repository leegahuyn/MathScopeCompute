#!/usr/bin/env python3
"""Replay the nine new original compact mean slots in the TT Sigma crop."""
import hashlib,sys
from pathlib import Path
assert '--work' in sys.argv and '--out' in sys.argv
W=Path(sys.argv[sys.argv.index('--work')+1]);base=W/'continuation125/sigma-extra-mean/verify_extra_mean.py';raw=base.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='340c4c855e1d3207196b61adb5f1b5b805d264890dc5423921222937497f4a3e'
census=W/'continuation134/radial-c1-time-crop/frontier.json';digest=hashlib.sha256(census.read_bytes()).hexdigest()
assert digest=='f18168fc7dc3e6183d9b4055c3a804a1657671e58eb004700e53606e908d11af'
src=raw.decode('utf-8')
def replace(old,new):
 global src
 assert src.count(old)==1,old
 src=src.replace(old,new,1)
replace("targets=[('beta',(0,3,2,0)),('gamma',(0,2,2,0)),('v',(0,2,2,0))]", "targets=sorted((f,(*j,0)) for f,j in json.loads((W/'continuation134/radial-c1-time-crop/frontier.json').read_bytes())['initializedCompactMeanNotInPinnedRosters']);assert len(targets)==9")
replace("assert {(f,(*j,0)) for f,j in report['newSecondTimeMeanRoles']}==set(targets)", "assert sum(j[2]==3 for f,j in targets)==7")
start=src.index('# Original four factors:');end=src.index("ops=D['recurrence']",start);src=src[:start]+src[end:]
start=src.index(" 'compactBetaZZZTT':");end=src.index(" 'temporalMaxGeometryPower':",start)
src=src[:start]+" 'conditionalRows':[{'field':f,'RZTL':j,'epsilonPower':'2' if f=='beta' else '1','bandPower':str((Q(7,2) if f=='beta' else Q(1,2))+3*sum(j[:3])),'logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']} for f,j in targets],\n 'c134CensusSHA256':'"+digest+"',\n"+src[end:]
replace('CONDITIONAL_ORIGINAL_C125_THREE_MEAN_RECURSIONS','CONDITIONAL_ORIGINAL_C134_NINE_COMPACT_MEAN_RECURSIONS')
replace('for the three old mean roles','for nine original compact mean roles')
exec(compile(src,str(base),'exec'),{'__name__':'c134_pinned_compact_adapter'})
