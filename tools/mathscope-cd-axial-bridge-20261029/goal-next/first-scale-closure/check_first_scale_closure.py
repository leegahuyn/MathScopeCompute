"""Check the actual qBig tree and available quantitative scale comparisons."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha1, sha256
import json
from pathlib import Path
import subprocess


REFERENCE = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
M2 = 'research-ide/mathscope-m2/navier/'
M3 = 'research-ide/mathscope-m3/navier/'
LOCALIZATION = M3 + 'evidence/source-localization-20261012/attempt1/localization.json'
LOCALIZATION_SHA = 'fa2acf400bb1fe8705bdb716d171882a3343562be3c5167e0fcb153d96cbf24e'
FAMILY = ('research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/'
          'recovered/base/work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json')
FAMILY_BLOB = '7a44a4737d386903272ebc706d53aeff256be6e2'
CORRECTION = 'f_ac81b63855489a21bb407b2d'
BOUNDS = ['f_7f7b86cc96191e30cada8cce', 'f_bb4702458d05209c24aaa649']
TEMPORAL_SHA = '2a94bacf97494ceb2288d4364da7cd75dba0a96f6469cb2b25d98d509c4f2438'


def need(predicate, explanation):
    if not predicate:
        raise ValueError(explanation)


def git_blob(repo, path):
    cmd = ['git', '-c', 'core.longpaths=true', '-C', str(repo)]
    oid = subprocess.check_output([*cmd, 'rev-parse', f'{REFERENCE}:{path}']).strip().decode()
    return subprocess.check_output([*cmd, 'cat-file', 'blob', oid])


class SourceProgram:
    def __init__(self, cert):
        self.data = cert['formulaProgram']
        self.nodes = self.data['nodes']
        self.ids = self.data['sourceNodeIds']
        self.indices = {i: j for j, i in enumerate(self.ids)}
        need(len(self.nodes) == len(self.ids) == len(self.indices) == 29459,
             'actual localization scalar program inventory')

    def root(self, name):
        return self.ids[self.data['roots'][name]]

    def node(self, index):
        rec = self.nodes[self.indices[index]]
        op, args = rec['op'], rec['args']
        if op in ('rational', 'source_parameter', 'coordinate'):
            return op, args
        if op == 'integer_power':
            return op, [self.ids[args[0]], args[1]]
        if op in ('add', 'multiply', 'maximum', 'ceiling', 'exp', 'log_positive', 'inverse', 'sqrt_positive'):
            return op, [self.ids[i] for i in args]
        raise ValueError(f'unsupported scalar tree operation: {op}')

    def args(self, index, op):
        actual, args = self.node(index)
        need(actual == op, f'node {index} must be {op}')
        return args

    def terms(self, index, op):
        actual, args = self.node(index)
        if actual != op:
            return [index]
        return [i for j in args for i in self.terms(j, op)]


def verify_qbig(repo):
    raw = git_blob(repo, LOCALIZATION)
    need(sha256(raw).hexdigest() == LOCALIZATION_SHA, 'pinned localization receipt SHA256')
    cert = json.loads(raw)
    need(cert['scope']['actualOriginalSourceCutoffConstructed'], 'actual original localization')
    program = SourceProgram(cert)
    qbig, ell_minimum, ell0 = (program.root(name) for name in ('qStar', 'ellMinimum', 'ell0'))
    need((qbig, ell_minimum, ell0) == (622791, 617432, 617433), 'actual final cutoff roots')
    need(sorted(program.terms(program.args(qbig, 'exp')[0], 'multiply')) == [20, 127, 622788],
         'final qBig exponential of the actual product')
    need(program.terms(622788, 'add').count(ell_minimum) == 1 and
         sum(Fraction(*map(int, program.args(i, 'rational')))
             for i in program.terms(622788, 'add') if i != ell_minimum) == 10,
         'final qBig uses ellMinimum + 10')
    need(sorted(program.terms(program.args(617437, 'exp')[0], 'multiply')) == [20, 127, 617434] and
         set(program.args(617434, 'add')) == {474, ell_minimum},
         'distinct earlier admissible-family qStar uses ellMinimum + 4')
    need(program.args(20, 'rational') == ['-1', '1'] and program.args(127, 'log_positive') == [24]
         and program.args(24, 'rational') == ['2', '1'] and program.args(474, 'rational') == ['4', '1'],
         'exact signed natural logarithm of 2')
    [maximum] = program.args(ell_minimum, 'ceiling')
    need(maximum == 617431 and set(program.args(maximum, 'maximum')) == {4654, 617430, 617357},
         'exact original ellMinimum maximum')
    need({617428, 617429} <= set(program.args(617430, 'maximum')) and
         program.args(617428, 'integer_power') == [300170, 512] and
         program.args(617429, 'integer_power') == [216823, 1024],
         'operator-norm terms in qBig threshold')
    need(program.args(617357, 'integer_power') == [617356, 2] and
         set(program.args(617356, 'multiply')) == {28815, 136158} and
         program.args(28815, 'rational') == ['64', '1'] and
         program.args(136158, 'inverse') == [9] and program.args(9, 'source_parameter') == ['h'],
         'exact 64/h frequency lower threshold')
    need({300162, 300163} <= set(program.terms(300170, 'add')) and
         program.args(300162, 'rational') == [str(2**128), '1'] and
         program.args(300163, 'integer_power') == [216823, 4096] and
         program.args(216823, 'source_parameter') == ['C12EnvelopeR'],
         'actual nonnegative background constant expansion')
    need(program.args(617292, 'integer_power') == [300170, 256] and
         set(program.args(300174, 'multiply')) == {300172, 300173} and
         set(program.args(300172, 'add')) == {474, 3622} and
         program.args(3622, 'sqrt_positive') == [24] and
         program.args(300173, 'rational') == ['1', str(2**33)],
         'actual E and Lmax tangent operator roots')
    return program, {'qBig': qbig, 'ellMinimum': ell_minimum, 'ell0': ell0,
                     'earlierAdmissibleFamilyQStar': 617437,
                     'Bnorm': 300170, 'C12EnvelopeR': 216823, 'E': 617292, 'Lmax': 300174}


def exact_parameter_tree(program):
    params = program.data['parametersExactExpressions']
    required = {
        'Md': {'integer': 1048576},
        'T': {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]},
        'h': {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}},
        'lambda': {'exp': {'product': [{'integer': -1000}, {'ref': 'T'}]}},
        'logP': {'product': [{'integer': 2}, {'ref': 'T'}]},
        'Pstar': {'exp': {'ref': 'logP'}},
        'K': {'power': [{'ref': 'Pstar'}, 2]},
        'BOuter': {'product': [{'integer': 1000}, {'ref': 'T'}]},
        'XR': {'product': [{'integer': 110}, {'power': [
            {'product': [{'ref': 'CSelected'}, {'ref': 'Pstar'}]}, 10]}]},
        'X0Imean': {'product': [{'ref': 'XR'}, {'exp': {'sum': [
            {'ref': 'T'}, {'integer': 2}, {'product': [{'integer': 60}, {'ref': 'BOuter'}]}, {'integer': -8}]}}]},
        'CSelected': {'exp': {'ref': 'logCSelected'}},
        'sourceEnvelopeS': {'power': [{'ref': 'CSelected'}, 100000]},
        'C12EnvelopeR': {'exp': {'power': [{'ref': 'sourceEnvelopeS'}, 256]}},
    }
    need(all(params[k] == v for k, v in required.items()), 'original exact h, lambda, and radial constants')
    need(int(params['Q']['quotient'][0]['product'][0]['integer']) >= 1
         and params['Q']['quotient'][0]['product'][1] == {'ref': 'K'}
         and params['Q']['quotient'][1] == {'power': [{'ref': 'sigmaStar'}, 2]}
         and params['BRefUpper'] == {'power': [{'ref': 'Q'}, 300]}
         and params['logCSelected'] == {'sum': [
             {'product': [{'integer': 10}, {'log': {'sum': [
                 {'integer': 1}, {'ref': 'BRefUpper'}]}}]}, {'power': [{'ref': 'Q'}, 200]}]}
         and params['sigmaStar'] == {'quotient': [{'ref': 'j0'}, {'integer': 2000}]}
         and params['j0'] == {'power': [{'ref': 'h'}, 4]},
         'source lower chain for log CSelected and C12EnvelopeR')


def code_pins(repo):
    evidence = {}
    snippets = {
        M2 + 'actual-common-admissible-family.mjs': [
            'E=G.pow(Bnorm,256)', 'lower:G.pow(Bnorm,512)', 'lower:G.pow(Renv,1024)',
            'qStar=G.exp(G.neg(G.mul(G.add(ellMinimum,q(4)),G.log(q(2)))))'],
        M3 + 'source-localization.mjs': [
            'expectedQStar=G.exp(G.neg(G.mul(G.add(ell0,q(4)),G.log(q(2)))))',
            'ell0===G.add(ellMinimum,q(6))&&qStar===expectedQStar'],
        M3 + 'source-global-band.mjs': [
            'derivativeOrder:Math.max(3,request.coefficientOrder+1)', 'return attachGlobalSourceBand(family,request,context)'],
        M2 + 'actual-compact-all-band-background-norms.mjs': [
            'for(let j=0;j+2<=m;j++)gaussianRows.push', 'backgroundDerivativeOrder:j+2'],
        M3 + 'source-forced-class-majorants.mjs': [
            'r.derivativeOrder===request.order', 'row.backgroundDerivativeOrder!==request.order+2',
            'actualInputForcingWClassCertified:false', 'actualInputSeminormSupplied:false'],
        M3 + 'source-global-moment.mjs': [
            "lambda=G.parameter('lambda'),A=band.constants.A,d=q(1,5)",
            'G.exp(G.neg(G.inv(G.mul(t,G.sub(G.one,t)))))',
            'G.mul(q(-59997,2),sourceT),q(33,10),G.mul(G.sub(q(15,2),G.mul(q(60000),sourceT)),lambda)',
            'angularFactors:[mu[0],G.mul(q(2),a,mu[1]),G.neg(G.mul(a,mu[2]))]',
            'axialFactors:[mu[3],G.mul(a,mu[4])]',
            'den=G.mul(G.sub(z[i],z[j]),G.sub(z[i],z[k]))',
            'gap=G.sub(G.one,axialRatio)'],
        'research-ide/mathscope-m3/extended-signed-run-20261023/run_real_original_signed162.mjs': [
            'prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000}'],
    }
    for path, fragments in snippets.items():
        raw = git_blob(repo, path)
        need(all(fragment.encode() in raw for fragment in fragments), f'pinned source operation {path}')
        evidence[path] = sha256(raw).hexdigest()
    return evidence


def stage_nodes(repo):
    raw = git_blob(repo, FAMILY)
    oid = sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    need(oid == FAMILY_BLOB, 'fixed recursive source functional family Git blob')
    family = json.loads(raw)
    nodes = {n['id']: n for n in family['nodes']}
    z = nodes[CORRECTION]
    need(z['operation'] == 'ActualCorrectionPotentials' and z['data']['j'] == 1
         and z['data']['velocity_identity'] == 'delta u_j=curl A_j+B_j e_theta',
         'exact first potential and direct swirl source functional')
    need(all(nodes[i]['operation'] == 'ExactSourceFunctionalBound' and nodes[i]['inputs'][0] == CORRECTION and
             nodes[i]['data']['derivative_order'] == j and not nodes[i]['data']['effective_numerical_evaluation']
             for j, i in enumerate(BOUNDS, 1)), 'actual uncut order one/two source norm inputs')
    fixed = next(n for n in nodes.values() if n['operation'] == 'FixedOriginalSource')
    need(fixed['data']['qbig'] == '2^(-(ellMinimum+10))' and
         all(nodes[i]['inputs'][1] == fixed['id'] for i in BOUNDS), 'same qBig in original uncut source norms')
    return {'familySHA256': sha256(raw).hexdigest(), 'uncutTriplet': CORRECTION,
            'uncutFunctionalNorms': BOUNDS, 'typedFirstMissingLiveOperation': z['operation'],
            'typedIdentity': z['data']['velocity_identity']}


def temporal_bound(path):
    raw = path.read_bytes()
    need(sha256(raw).hexdigest() == TEMPORAL_SHA, 'fixed original Temporal derivative receipt')
    evidence = json.loads(raw)
    need(evidence['verified']['requiredInputDerivativeOrder'] == {'C1Desired': 3, 'C2Desired': 4} and
         evidence['verified']['coarseDesiredOperatorConstant'] == '5*S', 'actual Temporal constant and input scope')
    return {'priorReceiptSHA256': TEMPORAL_SHA,
            'actualNativeOperatorBound': '5*ell^2 from C^(m+2) to desired C^m',
            'boundOnBand': '5*ell^2 <= 20*(1+log(1/q))^2 on s=q/2^-ell in [1/2,2]',
            'actualInputSeminormAvailable': False}


def rational_arithmetic():
    # Analytic inequalities used in the source-only comparisons are given
    # in README.md. Every coefficient or exponent comparison is exact here.
    need(Fraction(11, 10)**4 < 2 and 4 * 10 * 3**6 < 30000, 'uniform positive FiveMap moment bound')
    need(Fraction(3, 5)*Fraction(2, 7) > Fraction(1, 8) and Fraction(2, 7) > Fraction(1, 4),
         'angular and axial normalized denominator separation')
    need(3 * 4 * 8**2 * 30000 < 2**25 and 4 * 30000 < 2**25,
         'FiveMap fixed inverse operator constants')
    need(Fraction(59997, 2)+60000 < 90000 and 90001 < 12*8002 and 1000 < 8002,
         'positive FiveMap scale reciprocal dominated by source h')
    need(120042 < 151*800 and 2+20+151 < 256*100000,
         'source radial bump radius below C12EnvelopeR')
    need(Fraction(13, 2048) + Fraction(1, 1024) + Fraction(1, 1024) < Fraction(1, 64),
         'log FiveMap fixed coefficient operator is below B/64')
    # Sufficient compiler target, not a claim that the actual norm has it.
    power_cap = 2**16
    need(2*15460 < 2**15 and 15+(2+16)*power_cap < 2**21,
         'cutoff constants and log-factorial estimate for all P through cap')
    need(18*power_cap < 2**(33-12) and 16 < 4096 and 2**128 > 2**(21+10),
         'small fixed powers are dominated by the actual qBig threshold')
    return {'fixedFiveCoefficientSupOperatorBound': '2^27*C12EnvelopeR*h^(-13)',
            'fixedFiveLogComparison': 'log(2^27*C12EnvelopeR*h^(-13)) < B/64',
            'matrixOnlyNotActualDerivativeNorm': True,
            'tangentLogComparison': 'log W <= 18*Bnorm^256/2^33 < B/2^28',
            'conditionalSufficientFactorizedBounds': {
                'form': 'C <= 2^a*Bnorm^b*h^(-c)*W^d',
                'integerCaps': {'a': power_cap, 'b': power_cap, 'c': power_cap, 'd': power_cap, 'P': power_cap},
                'result': '2*K_m*C*4^P*P!*exp(-B/4) < 1 for K_m=84,15460',
                'actualStageNormBoundInThisClassProved': False}}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--temporal-receipt', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    program, roots = verify_qbig(args.repo)
    exact_parameter_tree(program)
    report = {'schema': 'MathScope.N7.IndependentFirstCutoffScaleSourceClosureAudit/1',
              'referenceCheckoutCommit': REFERENCE,
              'localizationReceiptSHA256': LOCALIZATION_SHA, 'actualRoots': roots,
              'checkedSourceSHA256': code_pins(args.repo),
              'qBigComparison': {'actual': 'qBig=2^(-(ellMinimum+10))',
                                 'logInverse': 'B=(ellMinimum+10)*log(2)',
                                 'strictLowerBounds': ['2048*h^(-2)', 'Bnorm^512/2', 'C12EnvelopeR^1024/2']},
              'operatorComparisons': {**rational_arithmetic(), 'Temporal': temporal_bound(args.temporal_receipt)},
              'sourceFunctionals': stage_nodes(args.repo),
              'firstConcreteBackgroundDeficit': 'coefficientOrder=1 emits background C^3, hence B_0,B_1 only. First Forced amplitude orders 2/3 need same-family C^4/C^5 and their repaired W_alpha input norms.',
              'actualWeightedUncutNormsClosed': False, 'actualCutoffNormsClosed': False,
              'qualitativeFinitenessAloneCountermodel': {
                  'scope': 'Logic countermodel only, not an alternative actual original current.',
                  'increment': 'A=B_swirl=0, pressure is arbitrary positive constant M',
                  'unitCutoffPoint': 'a=1, q=qBig/2<1/2',
                  'cutoffSupLower': 'M*(qBig/2)^(ellPrime_0-g_1)',
                  'consequence': 'Choosing M sufficiently large forces 40*(C_hat_0+1)/h > B+1 despite finite uncut seminorms.'},
              'actualFirstScaleEvaluated': False, 'finalJets': 0, 'release': 'HOLD'}
    payload = (json.dumps(report, indent=2) + '\n').encode()
    args.out.write_bytes(payload)
    print(json.dumps({'qBig': roots['qBig'], 'sha256': sha256(payload).hexdigest(),
                      'actualFirstScaleEvaluated': False}))


if __name__ == '__main__':
    main()
