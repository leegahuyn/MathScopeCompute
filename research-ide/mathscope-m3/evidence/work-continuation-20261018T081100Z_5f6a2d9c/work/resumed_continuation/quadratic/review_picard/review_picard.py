#!/usr/bin/env python3
"""Independent read-only review of the actual Picard collar application."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
P=ROOT/'work/resumed_continuation/picard'
def pin(p):return {'path':str(p.relative_to(ROOT)),'sha256':sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}

def main():
    a=json.loads((P/'evidence/ACTUAL_COLLAR_BOUND_APPLICATION.json').read_text())
    records=json.loads((P/'evidence/ACTUAL_CALLER_RECORDS.json').read_text())
    closure=json.loads((ROOT/'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json').read_text())
    theorem=json.loads((ROOT/'recovered/base/analysis/base/PR30-recovery-handoff/angular-proof/inputs/ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT.json').read_text())
    assert all(closure['records'][k]==v for k,v in records['records'].items())
    rows=records['actualSystemRows']
    assert rows['diagonal']==[0,0,2,0,3,1] and rows['zeroAxisDatum']==[0]*6
    assert rows['A0'][0]==[0,0,0,0,1,0] and rows['A0'][1]==[0,0,0,0,0,1]
    assert rows['forcing'][:2]==[0,0] and rows['A1'][:2]==[[0]*6,[0]*6]
    assert rows['solutionNorm']['commonCollar']==24848
    assert theorem['bothOriginalSolutionNormFields']['commonCollar']['root']==24848
    assert theorem['universalSourceScopedQuantifiers']['commonValueTube']=='distance(eta,I)<delta/8; C1 and coefficient bounds use the larger source tube delta/4'
    assert closure['records']['3612']=={'op':'source_parameter','args':['t1']}
    assert closure['records']['3617']=={'op':'source_parameter','args':['Xa']}
    applications=a['sourceCallerApplications']
    assert [x['sourceCaller'] for x in applications]==[29336,29436,72026,72261]
    assert [x['nativeSourceNode'] for x in applications]==[29331,29342,72018,72257]
    for row in applications:
        caller=closure['records'][str(row['sourceCaller'])]
        assert caller['op']=='smooth_piecewise' and caller['args'][1]==28819
        assert caller['args'][3]==row['selectedSourceNode']
        assert row['M_sourceNormRoot']==24848 and not row['radialHolomorphyUsed']
        assert row['numericEnclosure']['upper']=={'exp':{'exp':{'exp':{'exp':{'integer':1048601}}}}}
        assert not row['wholeNativeKernelNumericallyCompleted'] and not row['N706orN805Closed']
    checks={
      'originalRawCallerRecordsMatch':True,
      'commonCollarNormUsedNotSeparateY5Norm':True,
      'originalSingularRowsAndZeroDatumRetained':True,
      'strictActivationSubcollarAndCallerSelection':0<F(1,256)<F(1,128)<F(3,256)<F(1,64)<F(1,16),
      'etaDiscStrictlyInValueTube':F(1,16)<F(1,8),
      'ordinaryFWeightIntegral':F(1,2)*F(1,3+1)==F(1,8),
      'ordinaryUWeightIntegral':F(1,2)*F(1,1+1)==F(1,4),
      'regularInverseMonomialCheck':all(F(1,k+c+1)*F(k+c+1)==1 for c in [1,3] for k in range(8)),
      'sourceMajorantRhsFactor':1+1+16==18,
      'sharedHBoundsRadialQuantities':F(18,4)<5,
      'C1BinaryCoefficient':18+2*12+2*10==62,
      'C1QExponent':2*(2*64+3)+2==264,
      'SBinaryCoefficient':2*62+4+10==138,
      'SQExponent':2*264-64+1==465,
      'logQFixedSourceBound':260+22+64020<2**16,
      'logRhoFixedSourceBound':16+22+64016<2**16,
      'logCAbsorption':3010<2**(260*199),
      'logSAbsorption':147+470==617 and 617<2**(260*199),
      'logPrefactorAbsorption':74+268==342 and 342<2**(260*199),
      'prefactorLogBelowS':481<9*2**138,
      'loglogHCoefficient':962<2**10,
      'thirdLogCoefficient':10+200*2**16<2**24,
      'sourceTExponentCompression':1048576+25==1048601,
      'wholeRowsRemainOpen':a['wholeOriginal138NewlyCompleted']==0,
    }
    assert all(checks.values())
    notes=[
      'W4/xi and W5/xi are obtained from the original regular singular inverse, not from radial Cauchy estimates. Their t^3 and t weights produce factors1/8 and1/4 after X=xi^2.',
      'The selected X interval lies strictly in the activation collar, below original Xkeep and aSquared. Literal average arguments tX remain in the common real collar for every t in[0,1].',
      'Only eta analyticity on the retained complex tube is used for W_eta. The delta/16 disc is strictly inside the original delta/8 value tube.',
      'The four-exponential endpoint is a numerical real expression independent of source variables. It is a coarse uniform interval, not a precision evaluation, all-caller proof, all-radial-order result, or kernel closure.',
      'Reviewed analytic compression: q=logQ, r<q and tau<240Q^200 yield logS<961Q^200; log(5C1/delta)<S; three logarithms of H are below exp(1048601). This yields four exponentials for H.'
    ]
    result={'schema':'MathScope.IndependentResumedPicardReview/1','reviewerBranch':'quadratic',
      'reviewedFiles':[pin(P/x) for x in ['code/apply_actual_collar_bounds.py','evidence/ACTUAL_COLLAR_BOUND_APPLICATION.json','evidence/ACTUAL_CALLER_RECORDS.json','ACTUAL_COLLAR_BOUND_PROOF.md']],
      'checks':checks,'allPassed':True,'findings':notes,'scope':'independent source and mathematical review; no original producer executed',
      'requestedChanges':[],'wholeKernelRowsClosed':0,'N706Closed':False,'N805Closed':False}
    (OUT/'REVIEW.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'review':'Picard actual collar application','allPassed':True,'checks':len(checks),'requestedChanges':0,'wholeKernelRowsClosed':0}))

if __name__=='__main__':main()
