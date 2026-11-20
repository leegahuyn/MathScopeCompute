#!/usr/bin/env python3
"""Replay the two covered non-v_ZT FiveMap candidate covariance rows."""
import hashlib,sys
from pathlib import Path
assert '--work' in sys.argv and '--out' in sys.argv
W=Path(sys.argv[sys.argv.index('--work')+1]);base=W/'continuation132/fivemap-wave-coverage/verify_pressure_six_caps.py';raw=base.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='1348327ea51899c918f6ec47b9b51c3ea4cd7545425c502e1d8dfedebd09865e'
src=raw.decode('utf-8')
def replace(old,new):
 global src
 assert src.count(old)==1,old
 src=src.replace(old,new,1)
replace("'continuation132/fivemap-wave-coverage/six-classification.json','25cb8a426201234083bd29e5bf6d9c2a4de70f14eab4fa5b5151f685f18eb78d'", "'continuation132/fivemap-wave-coverage/wave-157.json','e2e60ee286364dea4711def4d95360ce5b5a3235358fa0eaa2d4fdd5c3613bc2'")
replace("targets={(f,(0,3,1,l)) for f in ('rr','thetatheta','zz') for l in (0,2)}", "targets={('thetaz',(0,0,1,0)),('zz',(0,0,1,0))}")
replace("assert {(r['component'],tuple(r['RZTL'])) for r in D['classification']['rows']}==targets", "assert targets<={(f,tuple(j)) for f,j in D['classification']['needsNoFurtherSigmaOrPreGauge']}")
replace("assert not D['classification']['allUnknownSigma'] and not D['classification']['allUnknownPreGauge']", "assert all(not r['unknownSigma'] and not r['unknownPreGauge'] for r in D['classification']['remaining'] if (r['tensor'],tuple(r['RZTL'])) in targets)")
replace('MathScope.C132.PostSignedPressureSix/1','MathScope.C132.IndependentTwoPostSignedTimeCovariance/1')
replace('CONDITIONAL_SIX_ORIGINAL_POSTSIGNED_COVARIANCE_ROWS','CONDITIONAL_TWO_ORIGINAL_POSTSIGNED_COVARIANCE_ROWS')
replace('Narrow beta_ZT input only','Additional FiveMap candidate inputs only')
replace('PASS original six post-Signed pressure-covariance rows','PASS original two independent post-Signed covariance rows')
exec(compile(src,str(base),'exec'),{'__name__':'c132_two_source_adapter'})
