"""Check the exact finite constants of the original eta5 tail extension."""
import argparse
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import sys


def encode(x):
    return (json.dumps(x,indent=2,sort_keys=True)+'\n').encode()


def check(native, reach, profile):
    src = native.read_bytes()
    js = json.loads(src)
    raw = reach.read_bytes()
    assert sha256(raw).hexdigest()==js['reachSHA256']
    source = json.loads(raw)
    calls = source['calls']
    assert len(calls)==567
    assert max(x['k'] for x in calls)==3 and max(x['m'] for x in calls)==5
    uncovered = sorted(x['id'] for x in calls if x['m']>4 or x['k']>4)
    assert len(uncovered)==js['sourceEta5Calls']==25
    assert sorted(i for group in js['groups'] for i in group['ids']) == uncovered
    assert all(g['sameEta5FromTwoPaths'] and all(r=='RESOURCE_LIMIT' for r in g['rejects'].values())
               for g in js['groups'])

    # For n>=65, binom(n+m,m)*(n)_k/(n+1)^2 <= (n+5)^8.
    # The ratio (1+1/(n+5))^8 is decreasing in n.  These two
    # exact integer checks establish (n+5)^8<=2^n inductively.
    assert 70**8 < 2**65
    assert 71**8 < 2*70**8
    assert all(x['m']+x['k'] <= 8 for x in calls)
    assert max(Fraction(factorial(m),(m+1)**2) for m in range(6)) == Fraction(10,3) < 4
    assert 4_000_000 < 2**22 and 2*64020+260+22 < 131072
    assert 65536 < 2**260
    profile_raw = profile.read_bytes()
    profile_sha = sha256(profile_raw).hexdigest()
    assert profile_sha == js['sourcePins']['source-profile-data.mjs'] == 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
    p = json.loads(profile_raw.decode().split('export const PINNED_N3 = ',1)[1].rstrip()[:-1])['parametersExactExpressions']
    assert p['T'] == {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]}
    assert p['Md'] == {'integer':2**20}
    assert p['h'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
    assert p['j0'] == {'power':[{'ref':'h'},4]}
    assert p['sigmaStar'] == {'quotient':[{'ref':'j0'},{'integer':2000}]}
    assert p['logP'] == {'product':[{'integer':2},{'ref':'T'}]}
    assert p['Pstar'] == {'exp':{'ref':'logP'}}
    assert p['K'] == {'power':[{'ref':'Pstar'},2]}
    assert p['rho'] == {'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]}
    qprefactor, K = p['Q']['quotient'][0]['product']
    assert int(qprefactor['integer']) == 2**260 and K == {'ref':'K'}
    assert p['Q']['quotient'][1] == {'power':[{'ref':'sigmaStar'},2]}

    control = js['Y4RawValueControl']
    assert control['sourceCall']==4468 and control['sourceYNode']==474
    assert any(x['id']==4468 and x['component']=='Phi' and x['y']==474 and x['k']==x['m']==0 for x in calls)
    assert control['degree']==10000 and js['maxTailOnlyDegree']==10000
    denominator = 4*5**10000*10002**2
    assert sha256(f'1/{denominator}'.encode()).hexdigest()==control['scaledTailSHA256']
    denominator_bits = denominator.bit_length()
    assert denominator_bits==control['denominatorBitLength']
    tail_power = 3*10001+28
    assert -tail_power == control['knownStrictLowerPowerOf2'] and denominator<2**tail_power
    # Q>2^260 e^(4T)>2^(260+4*2^20), using sigma<1 and T>2^20.
    log_scale_lower = 260+4*2**20
    assert log_scale_lower-tail_power > 0
    return {
      'schema':'MathScope.Y.ActiveN3.Eta5TailAndMagnitudeGap/1',
      'status':'VERIFIED_ORIGINAL_SYMBOLIC_ETA5_CONSTRUCTION_AND_CHECKED_CONDITIONAL_TAIL',
      'nativeEvidenceSHA256':sha256(src).hexdigest(),'reachEvidenceSHA256':sha256(raw).hexdigest(),
      'profileSHA256':profile_sha,
      'originalBlockedLiteralIds':uncovered,'originalMaterializedOrderCap':4,
      'sameCoefficientSymbolicComparisonDegree':js['degree'],
      'powerInduction':{'base':'70^8<2^65','ratioAt65':'71^8<2*70^8','factorialLoss':'10/3<4'},
      'exactModulusOnY0To5':'ceil((m+1)*131072*T)+bits+2',
      'derivativeRange':{'k':[0,3],'m':[0,5],'kPlusMAtMost':8},
      'tailUpperAtN':'4 Q^(m+1) 2^(-N) for N>=64 and original B_rho norm',
      'absoluteRawY4ApiGap':{
         'sourceCall':4468,'scaledTailOnlyMaximumDegree':10000,'symbolicCoefficientMaximumDegree':64,
         'existingBoundLower':'2^(260+4*2^20-30031) > 1 when Q scale is restored',
         'scope':'API upper enclosure width witness, not a lower bound on the true truncation error',
      },
      'open':['absolute raw coefficient enclosure from exact original pressure and natural kernel',
              'ordinary full derivative realization on physical points','general N'],
      'finalJets':0,'release':'HOLD',
    }


if __name__=='__main__':
    if hasattr(sys,'set_int_max_str_digits'):
        sys.set_int_max_str_digits(12000)
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('native','reach','profile','out'):
        p.add_argument(name,type=Path)
    a=p.parse_args()
    a.out.write_bytes(encode(check(a.native,a.reach,a.profile)))
