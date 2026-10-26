#!/usr/bin/env python3
"""Provable but coarse rational enclosures of a FEW source-pinned N3 parameters.

Never substitute 0 for a positive exponential. The stored rational interval may
have zero as a lower enclosure endpoint, so inversion MUST still reject it.
No claim of evaluating the physical fields or the source pulse/ODE is made.
"""
from fractions import Fraction
from pathlib import Path
from rigorous_rational_intervals import Interval,UncertifiedExpression
import json,hashlib

EXPECTED_HASH='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
SOURCE_ID='same-profile-2026-10-10.3'
# Independent digest of ALL expressions decoded from the original source
# profile (Git blob f1559221145b5d4ce051bbdb9cb84254045c8696).
# The older embedded parameterExpressionSHA256 is a different upstream seal;
# checking that field alone does not authenticate an injected dictionary.
EXPECTED_DECODED_EXPRESSIONS_SHA256='1a4589381ad2cd8b59e95b76113fd75e2bbb28b9b93e885520ab22643f50d5ce'
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'mathscope-m2/navier/source-profile-data.mjs'

class UnavailablePinnedSourceParameter(UncertifiedExpression):pass

def authenticate_decoded_expressions(profile):
    expressions=profile.get('parametersExactExpressions')
    if not isinstance(expressions,dict):
        raise UnavailablePinnedSourceParameter('Original parameter expressions missing')
    canonical=json.dumps(expressions,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    if hashlib.sha256(canonical).hexdigest()!=EXPECTED_DECODED_EXPRESSIONS_SHA256:
        raise UnavailablePinnedSourceParameter('Original complete decoded parameter expression digest changed')

def pinned_profile(path=SOURCE):
    text=path.read_text(encoding='utf8')
    prefix='export const PINNED_N3 = '
    if text.count(prefix)!=1 or not text.rstrip().endswith(';'):
        raise UnavailablePinnedSourceParameter('Original N3 profile JavaScript changed')
    x=json.loads(text.split(prefix,1)[1].strip()[:-1])
    if x.get('schema')!='MathScope.PinnedN3SourceProfile/1' or x.get('id')!=SOURCE_ID or x.get('parameterExpressionSHA256')!=EXPECTED_HASH or x.get('globalNumericalEvaluator') is not False:
        raise UnavailablePinnedSourceParameter('Original pinned N3 source or evidence hash changed')
    p=x['parametersExactExpressions']
    authenticate_decoded_expressions(x)
    # Check the complete critical symbolic dependency path, not just parameter names.
    want={
     'Md':{'integer':1048576},
     'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
     'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},
     'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},
     'co':{'rational':'1/256'},'Tf':{'integer':128},
     'epsilonMoment':{'power':[{'ref':'h'},3]},
     'muMoment':{'power':[{'ref':'h'},2]},
     'j0':{'power':[{'ref':'h'},4]},
     'deltaStar':{'quotient':[{'ref':'j0'},{'integer':10}]},
     'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]}
    }
    if any(p.get(k)!=v for k,v in want.items()):
        raise UnavailablePinnedSourceParameter('Original nested exponential and moment expression mutated')
    return x

def exact_pinned_parameter_interval(name,profile=None):
    p=profile if profile is not None else pinned_profile()
    # Require identical source profile even when injected from known source bytes
    if p.get('id')!=SOURCE_ID or p.get('parameterExpressionSHA256')!=EXPECTED_HASH:
        raise UnavailablePinnedSourceParameter('Unpinned N3 profile')
    authenticate_decoded_expressions(p)
    # Proof: Md>0 => T=exp(Md)+10>10. e>2 implies
    # 0<h=exp(-8002*T)<exp(-8002)<2^-8002<2^-4096.
    # Similarly 0<lambda=exp(-1000*T)<exp(-10000)<2^-10000<2^-4096.
    # Since 0<h<1, all positive powers n>=2 are bounded by 2^-8192.
    if name=='Md':return Interval(Fraction(1048576),Fraction(1048576))
    if name=='Tf':return Interval(Fraction(128),Fraction(128))
    if name=='co':return Interval(Fraction(1,256),Fraction(1,256))
    small=Fraction(1,2**4096)
    square=Fraction(1,2**8192)
    if name in ('h','lambda'):return Interval(Fraction(0),small)
    if name in ('muMoment','epsilonMoment','j0'):return Interval(Fraction(0),square)
    if name=='deltaStar':return Interval(Fraction(0),square/10)
    if name=='sigmaStar':return Interval(Fraction(0),square/2000)
    raise UnavailablePinnedSourceParameter(
       'Unproved source parameter: '+str(name)+' requires symbolic magnitude and sign bounds')

def parameter_proof_metadata(name):
    p=pinned_profile()
    result=exact_pinned_parameter_interval(name,p)
    return {'source_id':SOURCE_ID,'parameter_expression_sha256':EXPECTED_HASH,
      'parameter':name,'lo':str(result.lo),'hi':str(result.hi),
      'strict_positive_from_symbolic_profile':True,
      'positive_rational_lower_bound_established':result.lo>0,
      'can_certify_reciprocal':result.lo>0,
      'actual_original_field_value_computed':False,
      'numerical_scope':'SYMBOLIC_SOURCE_PARAMETER_MAGNITUDE_ONLY'}
