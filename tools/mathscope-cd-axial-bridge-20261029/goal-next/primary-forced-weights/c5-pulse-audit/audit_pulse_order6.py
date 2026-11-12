"""Exact sixth-order Volterra coefficient ledger and pinned source inventory."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path

PINS = {
    'potential': '6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d',
    'lower': '5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328',
    'background': '4c056bb0ed357b7741b9a1e0ef02d82ed fda30cf0cd1e10abc321b1d4cf0b966'.replace(' ',''),
    'target': 'b262127767b185e99041bd14f1f8dd2af6fe7d9a95736b93d9ac114914348f1a',
    'background_graph': '5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e',
    'target_graph': '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770',
    'curl': '4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2',
}

def get(path, kind):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[kind], kind
    return raw if kind == 'curl' else json.loads(raw)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('potential','lower','background','target','background_graph','target_graph','curl','out'):
        parser.add_argument('--'+key.replace('_','-'), type=Path, required=True)
    args = parser.parse_args()
    potential, lower, bg, target, curl = [get(getattr(args,k),k) for k in ('potential','lower','background','target','curl')]
    bggraph, targetgraph = [get(getattr(args,k),k) for k in ('background_graph','target_graph')]
    assert potential['scope']['actualInitialPrimaryPotentialAll57BoundConditionally']
    assert bg['status'] == 'VERIFIED_ALL_18_ORIGINAL_BACKGROUND_C8_NUMERICAL_UPPER_ENDPOINTS'
    assert target['status'] == 'VERIFIED_ALL_16_ORIGINAL_WEIGHTED_TARGET_C7_NUMERICAL_UPPER_ENDPOINTS'
    assert potential['sourceSHA256'] == lower['sourceSHA256']
    assert bg['originalGraphSHA256'] == bggraph['graph']['uncompressedSHA256']
    assert target['originalGraphSHA256'] == targetgraph['graph']['uncompressedSHA256']
    assert lower['priorReceipts']['background'][1] == PINS['background_graph']
    assert lower['priorReceipts']['target'][1] == PINS['target_graph']
    for row in bggraph['bounds']:
        assert str(row['F']) in bg['backgroundC8'] and str(row['G']) in bg['backgroundC8']
    for row in targetgraph['bounds']:
        assert all(str(i) in target['targetC7'] for i in row['component'])
    inputs = lower['intermediate']
    for name in ('pulseW','sqrtWeight','sqrtWeightPoles','partitionFactor','partitionSeedSigma'):
        assert len(inputs[name]) >= 7
    assert inputs['sqrtWeightPoles'][:7] == [12,24,48,72,96,120,144]
    assert b"remainder:'[-D_z C_theta, D_z C_r-D_r C_z, D_r C_theta+C_theta/R]'" in curl
    assert b'fullCoefficient:leading.map((real,j)=>({real,imaginary:remainder[j]}))' in curl
    assert b"const Dr=x=>" in curl

    # Independent exact test of the normalized recurrence.  The other path
    # differentiates the original product with ordinary binomial coefficients.
    N=6
    M={(s,v):Q(1+3*s+5*v,1+s+v) for s in range(N) for v in range(N-s)}
    W0={s:Q(s+2,1+2*s) for s in range(N+1)}
    wn={(s,0):W0[s]/factorial(s) for s in range(N+1)}
    wo={(s,0):W0[s] for s in range(N+1)}
    rows=[]
    for v in range(1,N+1):
        for s in range(N-v+1):
            terms=[(a,b,s-a,v-1-b) for a in range(s+1) for b in range(v)]
            wn[s,v]=sum((M[a,b]/(factorial(a)*factorial(b))*wn[c,d] for a,b,c,d in terms),Q())/v
            wo[s,v]=sum((comb(s,a)*comb(v-1,b)*M[a,b]*wo[c,d] for a,b,c,d in terms),Q())
            assert wn[s,v] == wo[s,v]/(factorial(s)*factorial(v))
            rows.append({'slow':s,'longitudinal':v,'divisor':v,
                         'terms':[[a,b,c,d] for a,b,c,d in terms]})
    assert len(rows)==21 and len(wn)==28
    assert max(a+b for r in rows for a,b,c,d in r['terms'])==5
    # Scalar P_v=gP, P>0: a separate univariate positive recurrence for P/P.
    g=[Q(j+2,j+1) for j in range(N)]
    p=[Q(1)]
    ordinary=[Q(1)]
    for v in range(1,N+1):
        p.append(sum((g[j]*p[v-1-j] for j in range(v)),Q())/v)
        ordinary.append(sum((comb(v-1,j)*g[j]*factorial(j)*ordinary[v-1-j] for j in range(v)),Q()))
        assert p[v] == ordinary[v]/factorial(v)
    output = {
      'schema':'MathScope.Forced.OriginalPulseOrderSixAudit/1',
      'status':'EXACT_RECURRENCE_AND_SOURCE_OPERAND_INVENTORY_NOT_YET_A_C5_BOUND',
      'pins':PINS,
      'originalSourceGraphSHA256':potential['sourceSHA256'],
      'factorialNormalizedRecurrence':'w[s,v] <= sum_{a=0}^s sum_{b=0}^{v-1} M[a,b] w[s-a,v-1-b]/v, v>=1',
      'rows':rows,'slowOnlyInputOrders':list(range(7)),'requiredMatrixTotalOrder':5,
      'weightedScalarEnvelope':'P_v=(lambda-dref)P; positive recurrence for |partial_v^j P|/P through j=6; the reference and integer label are frozen.',
      'sourceOperandRoots':{k:inputs[k][:7] for k in ('pulseW','sqrtWeight','sqrtWeightPoles','partitionFactor','partitionSeedSigma')},
      'existingNumericInputs':{'background':bg['status'],'target':target['status'],
        'meaning':'Numerical upper endpoints for the archived source FTC norm programs; analytic regularity and closure prerequisites remain conditional.'},
      'degreeBudget':{'primaryWaveC5':'exact full curl differentiates the pre-curl coefficient once; derivatives through 5 need coefficient through 6',
        'movingFrame':'w through total order 6 requires M through 5; M contains B_v, so B through 6 and slow background F,G through 7 because n uses H_R,H_Z',
        'weight':'sqrt(y) through 6 uses target and H derivatives through 6, with the recorded common pole delta_*^-144; C7 is sufficient for this count',
        'pressure':'phase-free pressure through 4 requires amplitude through 4, n_v and K through 4, and the same frozen positive denominators',
        'available':'background C8 and weighted target C7 each exceed the respective ingredient degree above; this count alone is not a bound'},
      'edge':'Do not divide by the transverse or longitudinal cutoff. Work on the positive-weight interior, then use the original Gaussian flat extension and source overlap identities; the displayed P(v) and sqrt(zeta) factors must be retained before taking limits.',
      'notProved':['Full source-bound degree-six coefficient graph','Actual output numerical C5 wave/C4 pressure constants','Uniform epsilon exponents for the imaginary curl','Same-live-family attachment','All endpoint domination and frame differentiation under source integrals'],
      'scope':'Original archived fixed-band, fixed-label annular slab only; not all-label global weighted source class.',
      'release':'HOLD'}
    raw=(json.dumps(output,indent=2)+'\n').encode()
    args.out.write_bytes(raw)
    print('PASS 21 exact sixth-order Volterra rows, scalar recurrence, source inventory; C5 closure OPEN')
    print(sha256(raw).hexdigest(),args.out.name)

if __name__=='__main__':
    main()
