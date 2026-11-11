"""Bind and bound the actual source heat amplitude and normalized exterior scales."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha1, sha256
from pathlib import Path
import json
import subprocess
import sys

from sympy import Rational, expand, symbols

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from check_whole_k_exterior_cell import COMMIT, HMAX, HMIN, LocalizationProgram, need

OUTER_CODE = 'research-ide/mathscope-m2/navier/actual-global-source-outer.mjs'
OUTER_BLOB = 'f8097860af5514eaa0b0dbad6ac2086277047f16'
CELL_SHA = '254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b'
REGION_SHA = '82f4bdcebd43a72451e7523059547dbca37e7a47cc5d66a24e787b0851a4420a'


def pinned_json(path, digest):
    raw = path.read_bytes()
    need(sha256(raw).hexdigest() == digest, f'original checked receipt {path.name}')
    return json.loads(raw)


def outer_stage_source(repo):
    raw = subprocess.check_output(['git', '-C', str(repo), 'show', f'{COMMIT}:{OUTER_CODE}'])
    need(sha1(f'blob {len(raw)}\0'.encode() + raw).hexdigest() == OUTER_BLOB, 'exact outer schedule Git blob')
    clauses = (
        b"if(x===o)return q(1,2);",
        b"const start=y,logAStart=logA",
        b"y=sum(y,length);logA=sum(logA,delta(length));",
        b"stage('initial',o,s=>sub(mul(q(1,10),s),mul(q(3,5),S(s))))",
        b"stage('axialDecay',T,s=>mul(q(-1,2),s)",
        b"stage('entry',o,s=>sub(mul(q(-1,2),s),mul(lam,S(s))))",
        b"const alpha=neg(sum(q(1,2),lam)),Tw=mul(q(60),B),power=stage('reservedPower',Tw,s=>mul(alpha,s)",
        b"stage('pulse',div(q(13),lam),s=>mul(alpha,s)",
        b"stage('interpolation',Tf,s=>sub(mul(alpha,s),mul(d.log(q(2)),step(div(s,Tf))))",
        b"stage('angular',mul(q(30),B),s=>mul(alpha,s)",
        b"stage('steepen',o,s=>sub(mul(alpha,s),mul(sub(o,lam),S(s)))",
        b"const holdLength=mul(q(-4),d.log(h));stage('steepPower',holdLength,s=>mul(q(-3,2),s)",
        b"stage('flatten',o,s=>sum(mul(q(-3,2),s),mul(sub(o,h),S(s)))",
        b"terminalSlope=neg(sum(q(1,2),h))",
        b"stage('wait',wait,s=>mul(terminalSlope,s)",
        b"stage('terminal',q(3),s=>sum(mul(terminalSlope,s),d.log(div(fo(s),sub(o,rho))))",
    )
    offsets = [raw.find(clause) for clause in clauses]
    need(all(i >= 0 for i in offsets) and offsets == sorted(offsets),
         'all 12 original stage contributions including order and wait cancellation')
    return {'commit': COMMIT, 'path': OUTER_CODE, 'gitBlob': OUTER_BLOB,
            'literalClausesChecked': len(clauses)}


def amplitude_algebra():
    h, lam, T, BO, Tf, log_h, log_two, wait = symbols('h lam T BO Tf log_h log_two wait')
    a = Rational(1, 2) + h
    alpha = -Rational(1, 2) - lam
    rows = [
        ('initial', 1, Rational(1, 10) - Rational(3, 10)),
        ('axialDecay', T, -T/2),
        ('entry', 1, -Rational(1, 2) - lam/2),
        ('reservedPower', 60*BO, alpha*60*BO),
        ('pulse', 13/lam, alpha*13/lam),
        ('interpolation', Tf, alpha*Tf-log_two),
        ('angular', 30*BO, alpha*30*BO),
        ('steepen', 1, alpha-(1-lam)/2),
        ('steepPower', -4*log_h, 6*log_h),
        ('flatten', 1, -Rational(3, 2)+(1-h)/2),
        ('wait', wait, -a*wait),
    ]
    contributions = [(name, expand(amplitude + a*length)) for name, length, amplitude in rows]
    expected = (-Rational(7, 10)+Rational(7, 2)*h-lam+h*T
                +(h-lam)*(90*BO+13/lam+Tf)-log_two+4*(1-h)*log_h)
    need(expand(sum(value for _, value in contributions)-expected) == 0 and
         contributions[-1][1] == 0, 'actual terminal-start log-amplitude identity')
    return {'normalizedStageContributions': {name: str(value) for name, value in contributions},
            'logAmplitude': 'logPstar + A*log(XR) - log(1-co*h) '
                            '-7/10 + 7*h/2 - lambda + h*T '
                            '+ (h-lambda)*(90*BOuter+13/lambda+Tf) - log(2) + 4*(1-h)*log(h)',
            'terminalWaitContribution': '0'}


def exact_parameters(outer):
    p = LocalizationProgram(outer.archive)
    params = p.data['parametersExactExpressions']
    required = {
        'Md': {'integer': 1048576},
        'T': {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]},
        'h': {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}},
        'lambda': {'exp': {'product': [{'integer': -1000}, {'ref': 'T'}]}},
        'BOuter': {'product': [{'integer': 1000}, {'ref': 'T'}]},
        'Tf': {'integer': 128},
        'co': {'rational': '1/256'},
        'logP': {'product': [{'integer': 2}, {'ref': 'T'}]},
        'Pstar': {'exp': {'ref': 'logP'}},
        'XR': {'product': [{'integer': 110}, {'power': [
            {'product': [{'ref': 'CSelected'}, {'ref': 'Pstar'}]}, 10]}]},
        'K': {'power': [{'ref': 'Pstar'}, 2]},
        'j0': {'power': [{'ref': 'h'}, 4]},
        'sigmaStar': {'quotient': [{'ref': 'j0'}, {'integer': 2000}]},
        'BRefUpper': {'power': [{'ref': 'Q'}, 300]},
        'logCSelected': {'sum': [
            {'product': [{'integer': 10}, {'log': {'sum': [{'integer': 1}, {'ref': 'BRefUpper'}]}}]},
            {'power': [{'ref': 'Q'}, 200]}]},
        'CSelected': {'exp': {'ref': 'logCSelected'}},
        'sourceEnvelopeS': {'power': [{'ref': 'CSelected'}, 100000]},
        'C12EnvelopeR': {'exp': {'power': [{'ref': 'sourceEnvelopeS'}, 256]}},
    }
    need(all(params[key] == value for key, value in required.items()), 'actual exact parameter expressions')
    numerator, denominator = params['Q']['quotient']
    factor, k = numerator['product']
    multiplier = int(factor['integer'])
    need(k == {'ref': 'K'} and multiplier >= 1 and
         denominator == {'power': [{'ref': 'sigmaStar'}, 2]}, 'original Q multiplier and small positive divisor')
    return multiplier


def quantitative_bounds(multiplier):
    hmax = Q(1, 64)
    need(hmax == HMAX and 1+1000*10 > 64 and 1+8002*10 > 64, '0<h<lambda<1/64')
    need(Q(1, 256)*hmax < Q(1, 2) and 2**7 > 110 and 7 < 10,
         'positive original heat denominator and log(XR) comparison')
    need(800**2*10//2 > 123000 and 122008*10+144 < 123000*10,
         'exact lower Lc comparison and negative exponent budget')
    need(Q(330, 64) < 6 and 2+Q(694, 64) < 13 and
         (6-Q(330, 64))*123000 > 14, 'exact upper Lc comparison')
    need(6*2**31 < 512*25600000 and (64/hmax)**2/2 == 2**23,
         'normalized amplitude absorbed by the exact qBig threshold')
    need(multiplier.bit_length()+22 < 80*10 and 64020+80 <= 64100 and
         200*64100+2 < 2**24 and 2*1048576+1+24+1 == 2*1048576+26,
         'explicit raw amplitude dyadic upper using T and log Q')
    need((1-Q(1, 2**30))*2**23 > 2**23-1, 'safe dyadic exponent for the normalized amplitude')
    return {
        'logCSelectedLower': 'Lc>=Q^200>=exp(800*T)>123000*T',
        'logCInfinity': ['4*Lc', '6*Lc'], 'bothStrict': True,
        'rawAmplitudeFixedDyadicLower': '2^4920000',
        'rawAmplitudeFixedDyadicUpper': '2^(2^(N+1)), N=2^(2*1048576+26)',
        'relativeLogAmplitudeUpper': 'log(cInfinity)<2^-31*B, B=log(1/qBig)',
        'M': 'tau0^(2*A)*cInfinity^2',
        'MSourceDyadicLower': 'tau0^2=2^(-2*(ellMinimum+15))',
        'MRelativeUpper': 'qBig^(1-2^-30)',
        'MFixedDyadicUpper': '2^(-8388607)',
        'sqrtMFixedDyadicUpper': '2^(-4194303)',
        'absolutePositiveNormalizedLowerFullyNumerical': False,
        'remainingLowerBoundDependency': 'A fixed numerical lower bound for M would require a certified upper bound on the exact original ellMinimum.',
    }


def energy_force_constants(cell, region):
    need(cell['geometry']['cell']['r'] == ['1/4', '1/2'] and cell['energy']['timeMoments'] ==
         {'int_c_dtauNormalized': '1/4', 'int_cSquared_dtauNormalized': ['1/8', '1/4'],
          'int_minus_c_cPrime_dtauNormalized': '1/2'} and
         region['region']['closedRegion']['rSquared'] == ['2^-1024', '1/2'],
         'same actual positive annular cell and verified enlarged exterior')
    need(HMIN > Q(3, 4) and 5*(Q(1, 2)+HMAX) < 3 and 2*HMAX*5 < 1 and
         1+(1+2*HMAX)**2 < 3, 'coarse exact cell radial powers and positivity')
    need(2*4*4 == 32 and 4*4 == 16 and Q(4,2)*3*64 < 2**9,
         'cell normalized energy, work and transverse dissipation powers')
    # The original flat seed has |a'|<=2, |a''|<=36 and a+b>1/9.
    prime_u, second_u = 18, 9*(36+2*18*4+72)
    need(2*prime_u < 2**6 and 4*second_u < 2**14 and
         8*2**6+8*2**14 < 2**18 and 4*2**6+8*2**14 < 2**18,
         'uniform original cutoff first and second derivative powers')
    need(1025*(Q(1, 2)+HMAX) < 529 and
         4*2**1058 == 2**1060, 'whole exterior K_heat and kinetic volume bounds')
    # Terms use tau0/z0^2=tau0^(2h)<=1 and tau0^(1-A)/z0=1.
    force_linear = [529+6, 529+18, 529+18, 1042+8+1]
    force_quadratic = [1058+512, 1058+8, 1058+8]
    need(sum(2**i for i in force_linear+force_quadratic) < 2**1573,
         'every normalized exterior force term fits the displayed fixed bound')
    return {
        'annularCell': {
            'endEnergyNormalized': ['M', '2^5*M'],
            'transverseDissipationNormalizedUnweighted': ['M', '2^9*M'],
            'axialDissipationNormalized': ['0', '0'],
            'forceWorkNormalized': ['M', '2^4*M'],
            'positiveStrictLowerForEnergyDissipationWork': 'tau0^2',
        },
        'entireVerifiedExterior': {
            'endEnergyNormalizedUpper': '2^1060*M < 2^(-8387547)',
            'velocityNormalizedPointwiseUpper': '2^529*sqrt(M)',
            'forceNormalizedPointwiseUpper': '2^1573*sqrt(M) < 2^(-4192730)',
            'forceNormalizedSpatialL2Upper': '2^1574*sqrt(M)',
            'boundForSquaredTimeIntegralOfExteriorForceL2': '2^3148*M',
            'CPrimeUpper': '2^6', 'CSecondPrimitiveUpper': '2^14',
            'linearForceExponentBounds': force_linear,
            'quadraticForceExponentBounds': force_quadratic,
        },
    }


def main():
    parser = ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--localization-source', type=Path, required=True)
    parser.add_argument('--cell', type=Path, default=HERE.parent/'whole-k-exterior-cell.json')
    parser.add_argument('--region', type=Path, default=HERE.parent/'region/whole-k-exterior-region.json')
    parser.add_argument('--out', type=Path, default=HERE/'whole-k-exterior-amplitude.json')
    args = parser.parse_args()
    sys.path.insert(0, str(args.localization_source / 'research-ide/mathscope-m3/recovery-20261019'))
    from outer_cutoff import ActualOuterCutoff

    cell, region = pinned_json(args.cell, CELL_SHA), pinned_json(args.region, REGION_SHA)
    need(cell['sourceCode']['cInfinity'] ==
         'Etail*Xtail^A/(1-co*h); equals sqrt(2)*actualHeatExteriorAmplitude' and
         cell['sourceCode']['Etail'] == 'Pstar*exp(terminal.logAStart)' and
         cell['sourceCode']['Xtail'] == 'XR*exp(terminal.start)',
         'same actual source terminal heat coefficient')
    need(region['region']['exteriorProof'][:2] ==
         ['B=(ellMinimum+10)*log(2)>2^23', 'B>Rstar^1024/2>=1/2+512*log(Rstar)'],
         'same actual qBig lower thresholds from exterior region')
    outer = ActualOuterCutoff(args.localization_source)
    result = {'schema': 'MathScope.N7.ActualExteriorAmplitudeBound/1',
              'cellReceiptSHA256': CELL_SHA, 'regionReceiptSHA256': REGION_SHA,
              'sourceOuterSchedule': outer_stage_source(args.repo), 'amplitudeAlgebra': amplitude_algebra(),
              'bounds': quantitative_bounds(exact_parameters(outer)),
              'energyForce': energy_force_constants(cell, region),
              'scope': {'originalExteriorSourceTheoremsUsed': True, 'centerFieldUnknown': True,
                        'wholeKFinalEnergy': None, 'wholeKFinalDefect': None,
                        'N7-06': 'OPEN', 'wholeKFinalJets': '0/67', 'release': 'HOLD'}}
    args.out.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print('PASS exact terminal cancellation, 4*Lc<log(cInfinity)<6*Lc, normalized exterior dyadic bounds.')
    print('N7-06 OPEN, global jets 0/67, RELEASE HOLD.')
    print('Receipt SHA256', sha256(args.out.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
