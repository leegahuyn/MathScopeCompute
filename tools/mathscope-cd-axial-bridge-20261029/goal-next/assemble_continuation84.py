"""Package the same-source Gaussian, covariance and pressure shell checks."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation83 import PARENTS as EARLIER

PARENT = 'dd2045763c3173e828719484731128c1d75ff5e4'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation83_Delta_20261120.zip':
           'cfebbfbf3c05fc3fab1ddf99a826406de6dcdb2233d8ab8a759f72be4546a3dc'}
ROOT = 'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/weighted-haar-shell/'
ADDITIONAL = {
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ShellGaussianPrimitive.lean':'6657b50a82a5096d20fdc18d87810302e5d3287a9c623bd6d9f4c967a7b77146',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':'5df0ba550010cb28a0ffedc3f17898a5090db502fce772036b2c9c64f3ff78bc',
}
PINS = {
    ROOT+'gaussian/gaussian-shell.json':'16906cc8b40c719d9c2de416490499c632df9a59376378b313831ef93868144e',
    ROOT+'pressure/pressure-shell.json':'22ff14cbd3c6df110159eb33d1cd6c938ecfdc08242d917a22a200bfb2075797',
    ROOT+'covariance/covariance-shell.json':'87ee4c05499ed8cdc1b22c490eb9eebb26375e04063559245ead711eaf8be970',
    ROOT+'mean/mean-shell.json':'168d59a2b935ca6b21da8e830c02a10f172231349d8d9a89cc6d38e73762a90f',
}


def verify_evidence(raw, source):
    for path,pin in PINS.items():
        assert entry(raw(path))['sha256']==pin, path
    gaussian = source(ROOT+'gaussian/gaussian-shell.json')
    pressure = source(ROOT+'pressure/pressure-shell.json')
    covariance = source(ROOT+'covariance/covariance-shell.json')
    mean = source(ROOT+'mean/mean-shell.json')
    lean = source(ROOT+'lean/receipt.json')
    bindings = gaussian['targetBindings']
    assert [r['baseNativeSlot'] for r in bindings['Tbar']]==[32017,32018]
    assert bindings['actualRadicands']==[17733801,17733805]
    assert len(bindings['HIntegrals'])==4 and bindings['determinant']==17733794
    assert gaussian['envelope']['t1OriginalParameter']==3612
    assert len(gaussian['exactRationalControls']['exactCylindricalRadialMass'])==3
    assert pressure['actual']['axialResidualPressureArm']==22000444
    assert len(pressure['actual']['covarianceArms'])==6 and pressure['actual']['rawGrBody']==21728512
    assert pressure['actual']['rhoAndDerivativeSupportAtoms']==[21728833,21728846]
    assert pressure['firstForcedCovarianceCoefficientOrders']['directAndPressureLabelledRolesAcrossTenCharts']==330
    assert pressure['reduction']['remainingCovarianceDerivativeRoles']==['Wrr_Z','Wthetatheta_Z','Wrz_ZZ']
    assert covariance['angularCovariance']['matchedCovarianceBodies']==60
    assert mean['actualHaarRoots']==[21999624,22000447]
    assert [r['monomials'] for r in mean['actualASTHaarGrouping']]==[187,739]
    assert [r['groups']['quadratic']['terms'] for r in mean['actualASTHaarGrouping']]==[22,148]
    assert [r['matchedMonomials'] for r in mean['actualFullStressArms']]==[8,8]
    assert mean['scope']['higherThetaN3OuterWeight']=='OPEN'
    assert all(row['finalJets']==0 and row['release']=='HOLD' for row in (pressure,gaussian,covariance))
    assert lean['run']==44615355954 and lean['conclusion']=='success' and len(lean['theorems'])==3
    assert lean['fileSHA256']==ADDITIONAL[lean['file']]
    log=raw(ROOT+'lean/ShellGaussianPrimitive.log').decode()
    assert all('MathScope.M3.CD.'+name in log for name in lean['theorems'])
    assert 'sorryAx' not in log and 'error:' not in log
    shas=raw(ROOT+'lean/source-sha256.txt').decode().splitlines()
    assert lean['fileSHA256']+'  MathScope/M3/CD/ShellGaussianPrimitive.lean' in shas
    return {'actualCovarianceMatrixEntries':4,'actualRadicands':2,'directCovarianceBodies':60,
            'covarianceAndPressureDerivativeRoles':330,'hostedLeanRun':lean['run'],'hostedLeanTheorems':3,
            'finalN8Comparisons':0,'finalJets':0}


if __name__=='__main__':
    assemble_delta(read_arguments(__doc__),parent=PARENT,parents=PARENTS,
                   label='MathScope_Goal_Continuation84',date='20261120',verify=verify_evidence,
                   additional_pins=ADDITIONAL)
