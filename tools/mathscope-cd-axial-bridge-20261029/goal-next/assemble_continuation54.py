"""Package original denominator enclosures and the nonlinear inner-field refinement."""

from fractions import Fraction

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation53 import PARENTS as EARLIER
from assemble_continuation52 import HOSTED


PARENT = '24ea876b50ce15727865168d5f446587a6e99cef'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation53_Delta_20261120.zip':
           'b7da3b00d262d950be484be67578658644e7ef426cb2bb70940b5f4481b6bb57'}
DOMAINS = HOSTED + 'domains/'
INNER = 'final67/inner-n8-output-error/'
CI = 'ci-44558225594/'
PROOF = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ResidualDomainRefinement.lean'
EXTRA = {
    PROOF: 'ef0b3f929425626e9ee8da96bf32a5ce9ed59d7bd8d585ea0fc28a7115b0374e',
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '6597e0ace5c49eb46bcdddded839ac21d56bb413e0fd5a135b97b5d583701011',
}
PINS = {
    DOMAINS + 'direct-domains.json': '9710a61866abf6f258c88a2f7678b28bfaba7d50d7f679c535cdde8442ee7d6c',
    DOMAINS + 'mean-mass-enclosure.json': '523c29eb2399838fe7047b358affcc7a812487159833bae4f91938bd0b1341a3',
    INNER + 'MANIFEST.json': 'a191b85a6e1a26869660f938d7aa81fd2192b9f1db99c815f92f4f3c3db8e204',
    INNER + 'inner-output-errors.json': '48f4fa3f8f07cfb3e6ee88fb83ef6ef067a874307357ad4ce22e6e38ae19d0ae',
    INNER + 'inner-output-readback.json': '7891914a470f1a5ca1012a596f53bbd116b97df2356f4c03926245804141d4d5',
    CI + 'ResidualDomainRefinement.log': '8a318e0aefb4116b0e1871da87d5bb56ea6b837fbe0ae58c88daf51bb29ed662',
    CI + 'source-sha256.txt': '163dac22afb52a0bbb03eee627409bf9723887c358c8208e24825a3b01a8f6cf',
    CI + 'version.txt': '355a9a028f81641782d75d6e6b58dec70f29d2f61238a9e271690259d9bf5680',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    bounds = source(DOMAINS + 'direct-domains.json')
    assert bounds['status'] == 'CONDITIONAL_POSITIVITY_OF_SAME_LIVE_DENOMINATORS_ON_ADMITTED_SOURCE_CHART'
    exact = source(HOSTED + 'independent-direct-split.json')
    assert [row['id'] for row in bounds['rows']] == exact['denominatorValuesRequiringSourceDomain']
    assert len(bounds['rows']) == 10
    bump = bounds['meanMass']
    assert bump['root'] == 17743725 and len(bump['alignedOriginalRecords']) == 12
    assert bump['reconstructedOperandIds'] == [17743724, 17743710, 17743711, 17743713]
    assert bump['reversedOrientationRejected'] and not bump['missingRawChildBytesClaimedExported']
    mass = source(DOMAINS + 'mean-mass-enclosure.json')
    assert mass['sourceDenominatorReceiptSHA256'] == PINS[DOMAINS + 'direct-domains.json']
    assert mass['originalMassRoot'] == bump['root'] and mass['simpleIntegerMargin24Pow128Below250Times23Pow128']
    previous_lower, previous_upper = Fraction(0), Fraction(1)
    for cells in ('128', '512', '2048'):
        row = mass['gridsOnHalfInterval'][cells]
        lower, upper = (Fraction(row[k]) for k in ('lowerExact', 'upperExact'))
        assert Fraction(1, 5000) < lower and previous_lower < lower < upper < previous_upper
        previous_lower, previous_upper = lower, upper
    inverse = mass['inverseMass']
    assert Fraction(inverse['lowerExact']) == 1 / upper and Fraction(inverse['upperExact']) == 1 / lower

    manifest = source(INNER + 'MANIFEST.json')
    for name, item in manifest['files'].items():
        assert entry(raw(INNER + name)) == item, name
    errors = source(INNER + 'inner-output-errors.json')
    readback = source(INNER + 'inner-output-readback.json')
    assert errors['outputCount'] == readback['outputChecks'] == 16
    assert errors['quadraticSourceTerms'] == readback['nonlinearErrorProducts'] == 71
    assert readback['errorProgramSHA256'] == PINS[INNER + 'inner-output-errors.json']
    force_rows = [row for row in errors['rows'] if row['output'].startswith('force/')]
    assert len(force_rows) == 3
    for row in force_rows:
        assert row['degree4NormalizedErrorRatio'] == {'lower': '0', 'upper': '31/64'}
        assert row['degree8NormalizedErrorRatio'] == {'lower': '0', 'upper': '8563/131072'}
        assert row['strictWidthDecrease']
    assert readback['rejectedNonlinearOmissionControls'] == 3
    assert readback['pressureGradientRetained'] and len(readback['retainedForceCutoffInputs']) == 6
    assert not source(INNER + 'controls.json')['badOutputCreated']

    log = ' '.join(raw(CI + 'ResidualDomainRefinement.log').decode().split())
    assert log.count('[propext, Classical.choice, Quot.sound]') == 3
    assert 'warning:' not in log and 'sorryAx' not in log
    for theorem in ('original_mean_bump_mass_gt_inv_five_thousand', 'original_slow_inverse_denominator_margin',
                    'quadratic_error_radius_contraction'):
        assert theorem in log, theorem
    assert (EXTRA[PROOF] + '  MathScope/M3/CD/ResidualDomainRefinement.lean').encode() in raw(CI + 'source-sha256.txt')
    return {'conditionallyPositiveDenominators': 10, 'meanMassDecimalInterval': [
        mass['gridsOnHalfInterval']['2048']['lowerDecimal'], mass['gridsOnHalfInterval']['2048']['upperDecimal']],
        'innerOutputErrorComponents': 16, 'actualQuadraticErrorProducts': 71,
        'normalizedInnerForceRatio': '8563/131072', 'leanRun': 44558225594, 'leanTheorems': 3}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation54', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
