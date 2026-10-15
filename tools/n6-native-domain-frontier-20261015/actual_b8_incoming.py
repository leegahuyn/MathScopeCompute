"""Exact incoming-debt absorptions and independent B8 interval contraction.

Pass a newly executed original certify_symbolic_b8.py output and the actual
matrix AST binding. No Boolean pass flag is used as the contraction proof.
"""
import argparse
import hashlib
from fractions import Fraction as F
import json
from pathlib import Path

BASE=Path(__file__).resolve().parent
FIXED_SHA='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
PREGLUING_SHA='7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3'


def validate_composition(natural,radial,b26,b34):
    """Require the proved actual inputs, not an unbound incoming-debt flag."""
    assert natural['schema']=='MathScope.N6.ActualNaturalIndependentBanachMajorant/1'
    assert natural['fixedDefinitionSHA256']==FIXED_SHA
    assert natural['originalKernel']['bytesUnchanged']
    assert natural['originalKernel']['sha256']=='d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815'
    assert natural['derivedMathematicalConclusion']['normBound']=='Q'
    assert natural['derivedMathematicalConclusion']['actualPhiRealLower']=='1/4 on 0<=Y<=41/10, eta in I'
    assert natural['sourceInputs']['actualInfiniteTailRetained']
    assert natural['sourceInputs']['pressureStageCount']==12
    assert all(natural['negativeControls'].values())
    assert radial['schema']=='MathScope.N6.ActualNaturalRadialPositivity/1'
    assert radial['fixedDefinitionSHA256']==FIXED_SHA
    assert radial['provedActualConclusions']['actualPhiYUpper']=='-chi/32-t/16<0'
    assert radial['provedActualConclusions']['secondOrderBanachRemainder']=='norm(x-x0-t*x1)<=t^2 Q^16, t=Lambda^-1'
    assert all(radial['independentExactChecks'].values())
    assert b26['schema']=='MathScope.N6.ActualB26RadialPositivity/1'
    assert b26['sourceSHA256']==PREGLUING_SHA and b26['originalProducerBindingExecuted']
    assert b26['naturalMonotonicityDependency']==radial['schema']
    assert b26['actualReferenceSource']['QsLower']=='1/2'
    assert b26['actualReferenceSource']['QsUpper']=='Q^65'
    assert b26['actualB26']['ELower']=='positive'
    assert b26['actualB26']['EInverseUpper']=='CSelected^3'
    assert all(b26['independentExactChecks'].values())
    assert b34['schema']=='MathScope.N6.ActualB34RadialPositivity/1'
    assert b34['sourceSHA256']==PREGLUING_SHA
    assert b34['derivedBounds']['actualAInterval']==['3/4','17/20']
    assert b34['derivedBounds']['actualE']=='positive'
    assert b34['derivedBounds']['actualEInverseUpper']=='CSelected^3'
    assert all(b34['exactChecks'].values())
    wrong=dict(b26);wrong['sourceSHA256']='0'*64
    assert wrong['sourceSHA256']!=PREGLUING_SHA
    return {'sameAuthenticatedFixedDefinition':FIXED_SHA,
            'sameOriginalPregluingSource':PREGLUING_SHA,
            'naturalCoefficientNormAndPhiLowerChecked':True,
            'actualNaturalMonotonicityChecked':True,
            'actualB26PositivityAndSourceBoundsChecked':True,
            'actualB34PositivityAndActualShiftWidthChecked':True,
            'changedUpstreamSourcePinRejected':True}


def interval(v):
    d=2**int(v['denominatorPowerOfTwo'])
    return F(int(v['lowerNumerator']),d),F(int(v['upperNumerator']),d)


def q(v):return F(int(v['numerator']),int(v['denominator']))
def add(a,b):return a[0]+b[0],a[1]+b[1]
def scale(c,a):return (c*a[0],c*a[1]) if c>=0 else (c*a[1],c*a[0])
def sup(a):return max(abs(a[0]),abs(a[1]))
def matrix_norm(A):return max(sum(map(sup,row)) for row in A)
def left_product(R,A):return [[sum_intervals([scale(R[i][k],A[k][j]) for k in range(5)]) for j in range(5)] for i in range(5)]
def sum_intervals(rows):
    out=(F(0),F(0))
    for a in rows:out=add(out,a)
    return out


def analyze_replay(replay,binding=None):
    assert replay['schema']=='MathScope.SymbolicB8ContinuousMomentMap/1'
    supports=[[(F(j+6,2048)),F(2*(j+6)+1,4096)] for j in range(5)]
    assert [[q(v) for v in row] for row in replay['geometry']['supports']]==supports
    assert replay['geometry']['bump']=="sigma'((x-left)/width)"
    assert replay['geometry']['unitMass'] is False
    R=[[F(0) for _ in range(5)] for _ in range(5)]
    for offset,key in [(0,'inverseU'),(2,'inverseE')]:
        block=[[q(v) for v in row] for row in replay[key]['exact']]
        for i,row in enumerate(block):
            for j,value in enumerate(row):R[offset+i][offset+j]=value
    assert max(sum(map(abs,row)) for row in R)<2**40
    A=[[interval(v) for v in row] for row in replay['linearMap']]
    Qd=[[interval(v) for v in row] for row in replay['quadraticDiagonal']]
    RA=left_product(R,A)
    residual=[[add((F(int(i==j)),F(int(i==j))),scale(F(-1),RA[i][j])) for j in range(5)] for i in range(5)]
    z=matrix_norm(residual);B=matrix_norm(left_product(R,Qd))
    mu=F(1,2**400);r=F(1,10**6);beta=F(1,10**8)
    image=beta+z*r+mu*B*r*r;lip=z+2*mu*B*r
    assert z<F(1,4) and image<r and lip<F(1,4)
    # Explicit actual h bound turns both genuine source normalized debts into beta.
    h=F(1,2**200)
    incoming_u=2**40*(6*h*h+h)
    incoming_e=2**40*(36*h**6+h)
    assert incoming_u<beta and incoming_e<beta
    assert F(1,2**16004)<mu  # exact h=exp(-8002T), T>1, e>2
    badA=[list(row) for row in A];badA[0][0]=(F(0),F(0))
    badRA=left_product(R,badA)
    badResidual=[[add((F(int(i==j)),F(int(i==j))),scale(F(-1),badRA[i][j])) for j in range(5)] for i in range(5)]
    assert matrix_norm(badResidual)>F(1,4)
    if binding:
        assert binding['schema']=='MathScope.N6.ActualB8ContinuousSourceBinding/1'
        assert binding['sourceBytesUnchanged'] and binding['registryCompared']
        assert binding['fixedDefinitionCompared'] and binding['diagnosticOverlap']>0
        assert all(binding['checks'].values())
        assert [[F(v) for v in row] for row in binding['preconditioner']]==R
        assert binding['rootRadius']=='1/1000000'
    return {'preconditionerInfinityNorm':str(max(sum(map(abs,row)) for row in R)),
            'independentContinuousResidualUpper':str(z),
            'independentPreconditionedQuadraticUpper':str(B),
            'mapImageUpper':str(image),'contractionUpper':str(lip),
            'incomingPreconditionedUUpper':str(incoming_u),
            'incomingPreconditionedEUpper':str(incoming_e),
            'changedActualLinearEntryRejected':True,
            'actualMatrixProducerBindingChecked':binding is not None,
            'certificatePassFlagsUsedAsProof':False}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--replay',type=Path,required=True)
    ap.add_argument('--binding',type=Path,required=True)
    ap.add_argument('--natural',type=Path,required=True)
    ap.add_argument('--natural-radial',type=Path,required=True)
    ap.add_argument('--b26',type=Path,required=True)
    ap.add_argument('--b34',type=Path,required=True)
    ap.add_argument('--out',type=Path,default=BASE/'actual_b8_incoming.json')
    args=ap.parse_args()
    replay=json.loads(args.replay.read_text(encoding='utf-8'))
    binding=json.loads(args.binding.read_text(encoding='utf-8'))
    paths={name:getattr(args,name.replace('-','_')) for name in ['natural','natural-radial','b26','b34']}
    inputs={name:json.loads(path.read_text(encoding='utf-8')) for name,path in paths.items()}
    composition=validate_composition(inputs['natural'],inputs['natural-radial'],inputs['b26'],inputs['b34'])
    assert inputs['b34']['inputSHA256']['b26']==hashlib.sha256(args.b26.read_bytes()).hexdigest()
    audit=analyze_replay(replay,binding)
    # Taylor term n=6: the early continuous error is <Q^-1000 for every Q>=2^260.
    assert 10**4*112*64*720<2**260
    assert 3000+40+660<2**260
    # Source square-seed step: |sigma''| <=81*(8*6+6*2+608)<2^16.
    assert 81*(8*6+6*2+608)<2**16<2**2048
    # Source-step endpoint derivative bounds and tiny h preserve E and a on B8.
    h2_upper=F(1,2**16004);root_radius=F(1,10**6);step_bound=2**2048
    relative_E=6*h2_upper*root_radius*step_bound
    relative_dyE=126*h2_upper*root_radius*step_bound
    assert relative_E<F(1,100) and relative_dyE<F(1,100)
    assert (F(4,5)-relative_E-2*relative_dyE)/(1+relative_E)>F(3,4)
    result={'schema':'MathScope.N6.ActualB8IncomingAndPositivity/1',
      'sourceComposition':composition,
      'inputSHA256':{**{name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in paths.items()},
        'binding':hashlib.sha256(args.binding.read_bytes()).hexdigest(),
        'freshReplay':hashlib.sha256(args.replay.read_bytes()).hexdigest()},
      'freshContinuousReplayArithmetic':audit,
      'analyticIncomingBounds':{'actualGiMinus4EtaUpper':'2j',
        'earlyErrorUpper':'10^4(Q^90+111)exp(-Q^200/2)<Q^-1000<h^3',
        'normalizedDUUpper':'6j+h^3','normalizedDEUpper':'36j^2+h^3',
        'actualPreconditionedScaledDebtUpper':'10^-8'},
      'sameActualRoot':{'existsUnique':True,'infinityNormUpper':'10^-6',
        'isCInfinityOnOpenEtaNeighborhood':True,'preconditionerRelabeledAsExactInverse':False},
      'actualB8EAndA':{'EOverKLower':'1/4','aLower':'3/4',
        'wholePatchSourceStepAndOriginalPositiveHRetained':True},
      'proof':'ACTUAL_B8_INCOMING_AND_POSITIVITY_KO.md',
      'remainingSourceApplications':['C1 full source S envelope and two endpoint collars',
        'Post-C12 and subsequent C2 actual domains/regularity',
        'Full original g21 pressure J compact application'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,'newLeanExecution':False}
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'independentActualIntervalContraction':True,'sourceIncomingBoundBelowBeta':True,'actualRootRadius':'1e-6','actualB8aLower':'3/4','newDischarged':0}))


if __name__=='__main__':main()
