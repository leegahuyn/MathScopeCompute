#!/usr/bin/env python3
"""Replay pinned C125 original mean arithmetic for new gamma_RTT and v_RTT."""
import hashlib,sys
from pathlib import Path

assert '--work' in sys.argv and '--out' in sys.argv
W=Path(sys.argv[sys.argv.index('--work')+1])
base=W/'continuation125/sigma-extra-mean/verify_extra_mean.py';raw=base.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='340c4c855e1d3207196b61adb5f1b5b805d264890dc5423921222937497f4a3e'
census=W/'continuation127/sigma-rrt/replay.json';digest=hashlib.sha256(census.read_bytes()).hexdigest()
assert digest=='e77795e860888dc33f12dc1f0b506fda4030d4fe7df038cb897d79b706782e9d'
src=raw.decode('utf-8')
def replace(old,new):
 global src
 assert src.count(old)==1,old
 src=src.replace(old,new,1)
replace("targets=[('beta',(0,3,2,0)),('gamma',(0,2,2,0)),('v',(0,2,2,0))]", "targets=[('gamma',(1,0,2,0)),('v',(1,0,2,0))]")
replace("assert {(f,(*j,0)) for f,j in report['newSecondTimeMeanRoles']}==set(targets)","assert {(f,(*j,0)) for f,j in json.loads((W/'continuation127/sigma-rrt/replay.json').read_bytes())['newSecondTimeMeanRoles']}==set(targets)")
start=src.index('# Original four factors:');end=src.index("ops=D['recurrence']",start);src=src[:start]+src[end:]
start=src.index(" 'compactBetaZZZTT':");end=src.index(" 'temporalMaxGeometryPower':",start)
src=src[:start]+" 'compactGammaRTT':{'RZT':[1,0,2],'epsilonPower':'1','bandPower':'19/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']},\n 'compactVRTT':{'RZT':[1,0,2],'epsilonPower':'1','bandPower':'19/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']},\n 'c127CensusSHA256':'"+digest+"',\n"+src[end:]
replace('CONDITIONAL_ORIGINAL_C125_THREE_MEAN_RECURSIONS','CONDITIONAL_ORIGINAL_C127_GAMMA_V_RTT_MEAN_RECURSIONS')
replace('for the three old mean roles','for the two new RTT old mean roles')
exec(compile(src,str(base),'exec'),{'__name__':'c127_pinned_compact_adapter'})
