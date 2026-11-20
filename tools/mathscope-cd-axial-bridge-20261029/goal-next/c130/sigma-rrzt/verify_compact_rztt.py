#!/usr/bin/env python3
"""Replay pinned original compact means gamma_RZTT and v_RZTT."""
import hashlib,sys
from pathlib import Path
assert '--work' in sys.argv and '--out' in sys.argv
W=Path(sys.argv[sys.argv.index('--work')+1]);base=W/'continuation125/sigma-extra-mean/verify_extra_mean.py';raw=base.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='340c4c855e1d3207196b61adb5f1b5b805d264890dc5423921222937497f4a3e'
census=W/'continuation130/sigma-rrzt/recurrence.json';digest=hashlib.sha256(census.read_bytes()).hexdigest()
assert digest=='792776a8535ffea5dea722ed53c363f18d1a9d56b1b882b16243808a0c2c221d'
src=raw.decode('utf-8')
def replace(old,new):
 global src
 assert src.count(old)==1,old
 src=src.replace(old,new,1)
replace("targets=[('beta',(0,3,2,0)),('gamma',(0,2,2,0)),('v',(0,2,2,0))]", "targets=[('gamma',(1,1,2,0)),('v',(1,1,2,0))]")
replace("assert {(f,(*j,0)) for f,j in report['newSecondTimeMeanRoles']}==set(targets)","assert {(f,(*j,0)) for f,j in json.loads((W/'continuation130/sigma-rrzt/recurrence.json').read_bytes())['compactNotInC128HighPressureRoster']}==set(targets)")
start=src.index('# Original four factors:');end=src.index("ops=D['recurrence']",start);src=src[:start]+src[end:]
start=src.index(" 'compactBetaZZZTT':");end=src.index(" 'temporalMaxGeometryPower':",start)
src=src[:start]+" 'compactGammaRZTT':{'RZT':[1,1,2],'epsilonPower':'1','bandPower':'25/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']},\n 'compactVRZTT':{'RZT':[1,1,2],'epsilonPower':'1','bandPower':'25/2','logChargeHOver2Pow128':compact['compactChargeInHOver2Pow128']},\n 'c130CensusSHA256':'"+digest+"',\n"+src[end:]
replace('CONDITIONAL_ORIGINAL_C125_THREE_MEAN_RECURSIONS','CONDITIONAL_ORIGINAL_C130_GAMMA_V_RZTT_MEAN_RECURSIONS')
replace('for the three old mean roles','for the two new RZTT old mean roles')
exec(compile(src,str(base),'exec'),{'__name__':'c130_pinned_compact_adapter'})
