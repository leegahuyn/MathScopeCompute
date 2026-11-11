"""Exact original exterior-region collar and scaled bounds for all local field atoms."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from check_whole_k_exterior_cell import HMAX, HMIN, LocalizationProgram, ZMAX, need

CELL_SHA = '254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b'
RADIUS_SQUARED_EXPONENT = 1024


def collar(outer, cell):
    program = LocalizationProgram(outer.archive)
    [maximum] = program.args(program.root('ellMinimum'), 'ceiling')
    need(617357 in program.args(maximum, 'maximum') and
         program.args(617357, 'integer_power') == [617356, 2] and
         set(program.args(617356, 'multiply')) == {28815, 136158} and
         program.args(28815, 'rational') == ['64', '1'] and
         program.args(136158, 'inverse') == [9] and program.args(9, 'source_parameter') == ['h'],
         'literal source (64/h)^2 threshold')
    need(617430 in program.args(maximum, 'maximum') and
         617429 in program.args(617430, 'maximum') and
         program.args(617429, 'integer_power') == [216823, 1024] and
         program.args(216823, 'source_parameter') == ['C12EnvelopeR'],
         'literal source Rstar^1024 threshold')
    params = program.data['parametersExactExpressions']
    need(params['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}} and
         params['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]} and 1+8002*10 > 64,
         'source h<1/64 used for both thresholds')
    need(cell['geometry']['radialProof'][:2] == ['q<qBig/16', '4*Xb<=Rstar^2'] and
         cell['geometry']['heatArgumentUpper'] == str(ZMAX),
         'same original whole-K q bound and source annulus')
    e = RADIUS_SQUARED_EXPONENT
    B_lower = (64 / HMAX)**2 / 2
    radial_log_decay = Q(255, 256)*B_lower
    need(B_lower == 2**23 and radial_log_decay > 2**22 and 2**22+5 > e and
         e-3-B_lower < -17, 'exact logarithmic margins for radial collar and heat tail')
    return {'closedRegion': {'rSquared': [f'2^-{e}', '1/2'],
                             'zetaSquared': ['0', '1/2'], 'rho': ['1/2', '1'],
                             'theta': '[0,2*pi)'},
            'exteriorProof': ['B=(ellMinimum+10)*log(2)>2^23',
                              'B>Rstar^1024/2>=1/2+512*log(Rstar)',
                              'qBig*Rstar^2<exp(-(255/256)*B)<2^(-2^22)',
                              '2*q*Xb<qBig*Rstar^2/32<2^-1024'],
            'heatProof': '4*tau/r^2<=2^1021*qBig<2^-17, including the entire pressure tail',
            'remainderNormalizedSpatialVolumeFractionUpper': '2^-1023',
            'volumeFractionIsNotAnEnergyFraction': True,
            'scope': 'pre-outer-cutoff field atoms for the actual original exterior; physical time and all angular values'}


def bounds(outer):
    beta_max = 1+HMAX
    s_min_inv = 2**RADIUS_SQUARED_EXPONENT
    extra_b, extra_p = 2**16, 2**32
    need(RADIUS_SQUARED_EXPONENT*HMAX == 16 and
         RADIUS_SQUARED_EXPONENT*2*HMAX == 32, 'safe exact noninteger radial powers')
    b_scale, p_scale = 'cInfinity*2^A', 'cInfinity^2*2^(2*A)'
    table = {
        'b@0,0,0': (2*HMIN, Q(extra_b*s_min_inv), b_scale),
        'b@0,0,1': (-4*extra_b*s_min_inv**2*beta_max, -16*(1-3*ZMAX), 'h*'+b_scale),
        'b@1,0,0': (-extra_b*s_min_inv**2*beta_max, -4*HMIN, b_scale),
        'b@2,0,0': (8*HMIN, Q(3*extra_b*s_min_inv**3), b_scale),
        'p@0,0,0,0': (Q(-extra_p*s_min_inv, 2), -Q(32, 33)*HMIN**2, p_scale),
        'p@0,1,0,0': (Q(-extra_p*s_min_inv**2), Q(extra_p*s_min_inv**2), p_scale),
        'p@1,0,0,0': (Q(-extra_p*s_min_inv**2), Q(extra_p*s_min_inv**2), p_scale),
    }
    exact_axial = {'b@0,1,0', 'b@0,2,0', 'p@0,0,1,0'}
    atoms = {}
    for key in outer.binding['requiredAtoms']:
        if key.startswith(('A0@','A1@','A2@')) or key in exact_axial:
            atoms[key] = {'bounds': ['0','0'], 'positiveFactor': '1'}
        elif key in table:
            low, high, scale = table[key]
            need(low <= high, f'ordered exact enclosure {key}')
            atoms[key] = {'bounds': [str(low), str(high)], 'positiveFactor': scale}
    need(len(atoms) == 67 and Counter(a['bounds']==['0','0'] for a in atoms.values()) ==
         {True: 60, False: 7}, 'complete original atom inventory')
    return atoms


def main():
    parser = ArgumentParser()
    parser.add_argument('--cell', type=Path, default=HERE.parent/'whole-k-exterior-cell.json')
    parser.add_argument('--localization-source', type=Path, required=True)
    parser.add_argument('--out', type=Path, default=HERE/'whole-k-exterior-region.json')
    args = parser.parse_args()
    sys.path.insert(0, str(args.localization_source / 'research-ide/mathscope-m3/recovery-20261019'))
    from outer_cutoff import ActualOuterCutoff

    raw = args.cell.read_bytes()
    need(sha256(raw).hexdigest() == CELL_SHA, 'same actual first exterior replay and heat formulas')
    outer = ActualOuterCutoff(args.localization_source)
    cell = json.loads(raw)
    report = {'schema': 'MathScope.N7.ActualWholeKExteriorRegion/1',
              'cellReceiptSHA256': CELL_SHA, 'region': collar(outer, cell), 'atoms': bounds(outer),
              'sourceTheorems': cell['paper'], 'scope': {'wholeKFinalJets': '0/67',
              'N7-06': 'OPEN', 'centralCylinderFieldUnknown': True, 'release': 'HOLD'}}
    args.out.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print('PASS original exterior collar r^2>=2^-1024, all 67 local operands enclosed.')
    print('Central spatial volume fraction <=2^-1023; N7-06 OPEN, global jets 0/67.')
    print('Receipt SHA256', sha256(args.out.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
