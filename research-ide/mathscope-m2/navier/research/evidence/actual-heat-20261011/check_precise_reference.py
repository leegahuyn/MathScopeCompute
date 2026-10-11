"""Independent, non-certifying plugin/Bessel reference comparison.

The certified interval comes from the JS signed-moment proof and directed
arithmetic. Plugin and Decimal approximations are diagnostics, never that authority.
Run from any directory with --output pointing to a NEW JSON receipt.
"""
import argparse
from decimal import Decimal, getcontext
import hashlib
import json
from pathlib import Path
import subprocess
import time

HERE = Path(__file__).resolve().parent
REPO = Path(__file__).resolve().parents[6]


def rational(s):
    n, _, d = s.partition('/')
    return Decimal(n) / Decimal(d or '1')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    output = Path(args.output).resolve()
    if output.exists():
        raise FileExistsError('A previous reference receipt must not be overwritten.')
    started = time.perf_counter()
    reference_path = HERE / 'precise-special-functions-references.json'
    inputs = json.loads(reference_path.read_text())
    getcontext().prec = 100
    h, z = Decimal(1) / 2, Decimal(1) / 64
    gamma, k0, k1 = [Decimal(c['decimal']) for c in inputs['cases']]
    x, b = Decimal(32), k1-k0
    c = x.exp()/(2*gamma)
    # The substitution v=sinh(t)^2/z in the original Laplace integral gives
    # H=e^x*z^(-3/2)*(K1(x)-K0(x))/(2*Gamma(3/2)), x=1/(2z).
    # Differentiate the K integral: K0'=-K1, K1'=-K0-K1/x.
    # These identities produce the following H' and H'' without differentiating
    # or evaluating the JS moment expansion. At z=1/64 all half powers are exact.
    plugin_h = c*512*b
    plugin_hp = c*32768*(k1-(Decimal(3)/2+2*x)*b)
    plugin_hpp = c*2097152*((Decimal(15)/4+9*x+4*x*x)*b-(3+2*x)*k1)
    moments = {'D0': (1-plugin_h)/(h*z), 'D1': -plugin_hp/h, 'D2': plugin_hpp/(h*(1+h))}
    script = """
import {encloseNormalizedHeatMoments} from './research-ide/mathscope-m2/navier/actual-heat-scaled-enclosure.mjs';
console.log(JSON.stringify(encloseNormalizedHeatMoments({h:{lower:'1/2',upper:'1/2'},argument:{lower:'1/64',upper:'1/64'},precisionBits:192,tolerance:'1/1000000000000000',maxTerms:128})));
"""
    executed = subprocess.run(['node', '--input-type=module', '-e', script], cwd=REPO, check=True, capture_output=True, text=True)
    enclosure = json.loads(executed.stdout)
    checks = []
    for name, value in moments.items():
        box = enclosure['coefficients'][name]['interval']
        checks.append({'id': 'independent-plugin-Bessel-'+name+'-inside-directed-enclosure', 'pass': rational(box['lower']) < value < rational(box['upper'])})
    d0 = enclosure['coefficients']['D0']['interval']
    raw_lo, raw_hi = 1-h*z*rational(d0['upper']), 1-h*z*rational(d0['lower'])
    checks.append({'id': 'plugin-heat-factor-inside-directed-enclosure', 'pass': raw_lo < plugin_h < raw_hi})
    d2 = enclosure['coefficients']['D2']['interval']
    wrong = (1+h)*moments['D2']
    checks.append({'id': 'omitted-one-plus-h-second-derivative-normalizer-rejected', 'pass': not rational(d2['lower']) <= wrong <= rational(d2['upper'])})
    if not all(row['pass'] for row in checks):
        raise AssertionError(checks)
    record = {
        'schema': 'MathScope.PreciseHeatReferenceComparison/1',
        'referenceParameters': {'h': '1/2', 'argument': '1/64'},
        'actualSourceParameters': False,
        'pluginDecimalsAreCertifiedIntervals': False,
        'decimalApproximationsAreCertifiedIntervals': False,
        'intervalAuthority': 'JS finite Taylor signed remainder integrated against exact Gamma moments plus directed BigInt arithmetic only',
        'pluginInputSHA256': hashlib.sha256(reference_path.read_bytes()).hexdigest(),
        'helperSHA256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'numericalModuleSHA256': hashlib.sha256((REPO/'research-ide/mathscope-m2/navier/actual-heat-scaled-enclosure.mjs').read_bytes()).hexdigest(),
        'referenceArithmetic': 'Python standard-library decimal', 'referenceDecimalPrecision': getcontext().prec,
        'observations': {'pluginBesselHeat': str(plugin_h), 'pluginBesselHeatPrime': str(plugin_hp), 'pluginBesselHeatSecond': str(plugin_hpp),
                         'moments': {name: str(value) for name, value in moments.items()}},
        'directedMomentEnclosure': enclosure, 'checks': checks, 'pass': True,
        'elapsedSeconds': time.perf_counter()-started,
        'scope': 'Independent representable reference comparison; no plugin or Decimal approximation proves an actual-source value.'
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('x') as f:
        json.dump(record, f, indent=2)
        f.write('\n')
    print(json.dumps({'pass': True, 'checks': len(checks), 'terms': enclosure['terms'], 'pluginBesselHeat': record['observations']['pluginBesselHeat'], 'elapsedSeconds': record['elapsedSeconds']}))


if __name__ == '__main__':
    main()
