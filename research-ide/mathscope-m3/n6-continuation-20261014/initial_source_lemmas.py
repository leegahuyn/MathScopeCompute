"""Source-linked fixed five-bump analytic lemmas, using the passed cloud rows.

This does not rerun the 5/5 arithmetic, mean or PDE producers. It exhausts one
authenticated original node stream, checks the actual bump definitions, and
proves the nonzero denominators and compact profile change of variables.
The common real source chart and complete temporal Fourier closure are separate
obligations. No finite norm row is promoted to an all-order W/M/S assertion.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from fractions import Fraction as Q
from pathlib import Path
from time import monotonic

HERE = Path(__file__).resolve()
REPO = HERE.parents[3]
sys.path.insert(0, str(REPO / 'research-ide/mathscope-m3/certification-20261014'))
from source_dag import stream_snapshot, pinned_json, verify_capture

PARENT = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
MEAN_SHA = '22c878e7ace454c61f00c9ee4952738f7f9fa7b1c269eca538ca224dd8fcb96b'
PAPER_SHA = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
PARAM_SHA = 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
MEAN_FILE = 'research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/initialized-mean-construction.json'
MU = [634285, 634289, 634293, 634296, 634300]
POWER_IDS = [24, 137268, 620, 1, 29146]
EXPECTED_POWERS = [(Q(2), Q(0)), (Q(-2), Q(-2)), (Q(0), Q(-2)), (Q(1), Q(0)), (Q(1), Q(-2))]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def require(value, message):
    if not value:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def atom(name):
    return ('atom', name)


def lit(value):
    return ('q', str(Q(value)))


def op(name, *args):
    if name in ('add', 'multiply'):
        flat = []
        for arg in args:
            flat.extend(arg[1:] if arg[0] == name else [arg])
        scalar = Q(0) if name == 'add' else Q(1)
        other = []
        for arg in flat:
            if arg[0] == 'q':
                scalar = scalar + Q(arg[1]) if name == 'add' else scalar * Q(arg[1])
            else:
                other.append(arg)
        if name == 'multiply' and scalar == 0:
            return lit(0)
        if scalar != (0 if name == 'add' else 1) or not other:
            other.append(lit(scalar))
        other.sort(key=repr)
        return other[0] if len(other) == 1 else (name, *other)
    if name == 'inverse' and args[0][0] == 'q':
        return lit(1 / Q(args[0][1]))
    if name == 'exp' and args[0] == lit(0):
        return lit(1)
    return (name, *args)


def substitute(tree, name, value):
    if tree == atom(name):
        return value
    if tree[0] in ('q', 'atom'):
        return tree
    return op(tree[0], *(substitute(t, name, value) for t in tree[1:]))


class FixedSource:
    def __init__(self, nodes):
        self.nodes = nodes
        self.aliases = {8: 'lambda', 633686: 'x0', 634258: 'x', 622829: 'eta', 622820: 's', 622827: 's_to_D'}

    def tree(self, ident, expand=False):
        if ident in self.aliases and not expand:
            return atom(self.aliases[ident])
        n = self.nodes[ident]
        kind, a = n['op'], n['args']
        if kind == 'rational':
            return lit(Q(int(a[0]), int(a[1])))
        if kind == 'source_parameter':
            return atom('parameter:' + a[0])
        if kind == 'coordinate':
            return atom('coordinate:' + a[0])
        if kind == 'integer_power':
            return op('power', self.tree(a[0]), lit(a[1]))
        if kind == 'definite_integral':
            return op('integral', *(self.tree(i) for i in a))
        return op(kind, *(self.tree(i) for i in a))

    def affine_lambda(self, ident):
        if ident == 8:
            return Q(0), Q(1)
        n = self.nodes[ident]
        kind, a = n['op'], n['args']
        if kind == 'rational':
            return Q(int(a[0]), int(a[1])), Q(0)
        if kind == 'add':
            vals = [self.affine_lambda(i) for i in a]
            return sum(v[0] for v in vals), sum(v[1] for v in vals)
        if kind == 'multiply':
            out = Q(1), Q(0)
            for i in a:
                val = self.affine_lambda(i)
                require(not out[1] or not val[1], 'Unexpected nonlinear lambda polynomial')
                out = out[0] * val[0], out[0] * val[1] + out[1] * val[0]
            return out
        raise ValueError('Non-affine lambda expression: ' + str(ident))

    def sign(self, ident):
        if ident in MU or ident in (8, 633686, 634320, 622827):
            return 1
        n = self.nodes[ident]
        kind, a = n['op'], n['args']
        if kind == 'rational':
            v = Q(int(a[0]), int(a[1]))
            return (v > 0) - (v < 0)
        if kind == 'exp':
            return 1  # A finite real exponent is part of the stated chart domain.
        if kind == 'multiply':
            out = 1
            for i in a:
                out *= self.sign(i)
            return out
        if kind == 'inverse':
            return self.sign(a[0])
        if kind == 'add':
            signs = [self.sign(i) for i in a]
            if all(s >= 0 for s in signs) and any(s > 0 for s in signs):
                return 1
            if all(s <= 0 for s in signs) and any(s < 0 for s in signs):
                return -1
            if all(s == 0 for s in signs):
                return 0
            # Recognize a difference of exponentials, including 1=exp(0).
            exponents = []
            for i in a:
                tree = self.tree(i)
                coefficient = Q(1)
                node = self.nodes[i]
                if node['op'] == 'multiply':
                    nonconstant = []
                    for j in node['args']:
                        if self.nodes[j]['op'] == 'rational':
                            coefficient *= Q(*map(int, self.nodes[j]['args']))
                        else:
                            nonconstant.append(j)
                    if len(nonconstant) != 1:
                        raise ValueError('Unreviewed mixed sign sum: ' + str(ident))
                    i = nonconstant[0]
                    node = self.nodes[i]
                if node['op'] == 'exp':
                    exp = self.affine_lambda(node['args'][0])
                elif node['op'] == 'rational' and self.tree(i) == lit(1):
                    exp = Q(0), Q(0)
                else:
                    raise ValueError('Unreviewed difference atom: ' + str(ident))
                exponents.append((coefficient, exp))
            require(sorted(v[0] for v in exponents) == [Q(-1), Q(1)], 'Not an exponential difference')
            positive = next(v[1] for v in exponents if v[0] == 1)
            negative = next(v[1] for v in exponents if v[0] == -1)
            delta = positive[0] - negative[0], positive[1] - negative[1]
            require(delta != (0, 0) and (all(v >= 0 for v in delta) or all(v <= 0 for v in delta)), 'No exact sign of exponential difference')
            return 1 if all(v >= 0 for v in delta) else -1
        if kind == 'integer_power' and a[1] % 2 == 0:
            return 0  # Conservatively nonnegative; sign 0 here is a weak lower bound.
        raise ValueError('No licensed sign for actual node ' + str(ident))


def run(repo, artifacts, output):
    started = monotonic()
    mean = pinned_json(repo / MEAN_FILE, MEAN_SHA)
    five_path = artifacts / 'mean-proof-initial-38500114302/independent-five-rows.json'
    class_path = artifacts / 'mean-proof-initial-38500114302/initial-class-acceptance.json'
    five, prior = read_json(five_path), read_json(class_path)
    require(five['source']['completeParentSnapshotNodeSHA256'] == PARENT, 'Wrong five-row parent')
    require(five['fiveArithmeticRowsMatched'] and len(five['rows']) == 5, 'Prior five-row proof missing')
    require([r['expression'] for r in five['rows']] == [3614735, 3614757, 3614759, 3614752, 3614761], 'Wrong actual row IDs')
    require(prior['B0'] == '7/10' and prior['C0star'] == '6/5' and len(prior['requirements']) == 10, 'Wrong j=0 requirements')
    require(prior['source']['fullParentNodesSHA256'] == PARENT, 'Wrong class parent')
    require(not prior['originalN601Complete'] and not five['uniformClassesProved'], 'Unsupported inherited promotion')
    source_profile_path = repo / 'research-ide/mathscope-m2/navier/source-profile-data.mjs'
    profile_text = source_profile_path.read_text(encoding='utf-8')
    profile = json.loads(profile_text.split('export const PINNED_N3 = ', 1)[1].rstrip().rstrip(';'))
    p = profile['parametersExactExpressions']
    assembly_row = profile['inputs']['assembly']
    assembly_rel = 'research-ide/' + assembly_row['path']
    assembly_raw = (repo / assembly_rel).read_bytes()
    assembly_mode = 'working-file-exact-bytes'
    if sha(assembly_raw) != assembly_row['sha256']:
        assembly_raw = subprocess.check_output(['git','show','HEAD:'+assembly_rel],cwd=repo)
        assembly_mode = 'immutable-git-blob-exact-bytes'
    require(sha(assembly_raw) == assembly_row['sha256'], 'Original assembly receipt changed')
    assembly = json.loads(assembly_raw)
    original_parameters = assembly['parametersExactExpressions']
    require(profile['parameterExpressionSHA256'] == PARAM_SHA and sha(json.dumps(original_parameters, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()) == PARAM_SHA, 'Parameter definition changed')
    def normalized(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, int):
            return str(value) if abs(value) > 2**53-1 else value
        if isinstance(value, list):
            return [normalized(v) for v in value]
        if isinstance(value, dict):
            return {k: normalized(v) for k,v in value.items()}
        return value
    require(normalized(original_parameters) == p, 'Normalized source parameters do not match their original definitions')
    require(p['lambda'] == {'exp': {'product': [{'integer': -1000}, {'ref': 'T'}]}}, 'Actual lambda definition changed')
    require(p['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]} and p['Md'] == {'integer': 1048576}, 'Actual T definition changed')
    require(p['X0Imean']['product'][0] == {'ref': 'XR'}, 'Actual mean scale changed')
    require(p['XR']['product'][0] == {'integer': 110} and p['XR']['product'][1]['power'][1] == 10, 'Positive XR definition changed')
    require(p['CSelected'] == {'exp': {'ref': 'logCSelected'}} and p['Pstar'] == {'exp': {'ref': 'logP'}}, 'Positive XR factors changed')
    paper_path = repo / 'research-ide/reference-documents/ns-primary-20261013/navier-stokes.pdf'
    require(sha(paper_path.read_bytes()) == PAPER_SHA, 'Paper changed')
    capture = verify_capture(repo)
    nodes, count = {}, 0
    additional = {4708, 29146, 71672}
    for ident, node in stream_snapshot(repo):
        count += 1
        if ident < 1000 or 137200 <= ident <= 137280 or 622790 <= ident <= 622840 or 633670 <= ident <= 633710 or 634258 <= ident <= 634513 or ident in additional:
            nodes[ident] = node
    require(count == 3892594 and len(nodes) <= 1600, 'Unexpected node selection or resource budget')
    output.mkdir(parents=True, exist_ok=True)
    selected = [[i,n] for i,n in sorted(nodes.items())]
    (output/'initial-selected-source-nodes.json').write_text(json.dumps(selected,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
    require(nodes[8] == {'op': 'source_parameter', 'args': ['lambda']}, 'Actual lambda node changed')
    f = FixedSource(nodes)
    require([f.affine_lambda(i) for i in POWER_IDS] == EXPECTED_POWERS, 'Actual moment powers changed')
    x, x0 = atom('x'), atom('x0')
    t = op('multiply', lit(10), op('add', op('multiply', x, op('inverse', x0)), lit(-1)))
    bump = op('smooth_piecewise', t, lit(0), lit(1), lit(0), op('exp', op('multiply', lit(-1), op('inverse', op('multiply', t, op('add', lit(1), op('multiply', lit(-1), t)))))), lit(0))
    eta0 = op('multiply', op('inverse', x0), bump)
    require(f.tree(634278) == eta0, 'Actual complete bump does not match eta0')
    require(nodes[633684]['op'] == 'sqrt_positive' and nodes[633683]['op'] == 'multiply', 'x0 square-root body changed')
    require(nodes[633682] == {'op': 'source_parameter', 'args': ['X0Imean']} and nodes[633683] == {'op': 'multiply', 'args': [24,633682]}, 'Actual X0 mean scale binding changed')
    require(nodes[633685] == {'op': 'exp', 'args': [19]} and nodes[633686] == {'op': 'multiply', 'args': [633684, 633685]}, 'Actual x0 normalization changed')
    require(f.affine_lambda(81) == (Q(1,2),Q(1)) and nodes[634315] == {'op':'exp','args':[634314]}, 'Actual positive power changed')
    require(nodes[634313] == {'op':'log_positive','args':[633683]} and nodes[634314] == {'op':'multiply','args':[81,634313]}, 'Actual positive a base changed')
    require(nodes[634312] == {'op':'exp','args':[634311]} and nodes[634316] == {'op':'multiply','args':[634312,634315]}, 'Actual positive a factors changed')
    require(nodes[634317] == {'op':'integer_power','args':[622829,2]} and nodes[634318] == {'op':'add','args':[1,634317]}, 'Actual eta denominator changed')
    require(nodes[634319] == {'op':'inverse','args':[634318]} and nodes[634320] == {'op':'multiply','args':[634316,634319]}, 'Actual positive a quotient changed')
    require(f.tree(634284) == op('multiply', x0, lit(Q(11, 10))), 'Actual integration endpoint changed')
    mu_rows = []
    for ident, power_id, power in zip(MU, POWER_IDS, EXPECTED_POWERS):
        body, binder, left, right = nodes[ident]['args']
        require(nodes[ident]['op'] == 'definite_integral' and (binder, left, right) == (634258, 633686, 634284), 'Moment binder or support changed')
        expected = op('multiply', eta0, op('exp', op('multiply', f.tree(power_id), op('log_positive', x))))
        require(f.tree(body) == expected, 'Actual moment integrand changed')
        mu_rows.append({'sourceNode': ident, 'powerSourceNode': power_id, 'powerAffineLambda': [str(v) for v in power], 'strictlyPositive': True, 'finite': True, 'reason': 'Positive x^p times a positive bump on a nonempty compact interval bounded away from zero.'})
    copies = []
    for row in mean['bumps']['copies']:
        j, scale = row['j'], row['scale']
        require(f.tree(scale) == op('exp', lit(Q(j, 5))), 'Copy scale changed')
        expected_profile = op('multiply', op('inverse', f.tree(scale)), substitute(eta0, 'x', op('multiply', x, op('inverse', f.tree(scale)))))
        require(f.tree(row['profile']) == expected_profile, 'Actual copied bump definition changed')
        copies.append({'j': j, 'profileNode': row['profile'], 'scaleNode': scale, 'exactMomentFormula': 'integral x^p eta_j(x) dx = exp(j*p/5)*mu_p', 'changeOfVariablesVerifiedFromCompleteBody': True})
    require(f.affine_lambda(nodes[634333]['args'][0]) == (Q(2, 5), Q(0)), 'z0 exponent changed')
    require(f.affine_lambda(nodes[634335]['args'][0]) == (Q(-2, 5), Q(-2, 5)), 'z1 exponent changed')
    require(f.affine_lambda(nodes[634337]['args'][0]) == (Q(0), Q(-2, 5)), 'z2 exponent changed')
    require(f.affine_lambda(nodes[634339]['args'][0]) == (Q(0), Q(-2, 5)), 'Axial ratio changed')
    denominators = sorted({d for row in five['rows'] for d in row['nonzeroDivisorsRequired']} | set(mean['bumps']['coefficients']['nonzeroDenominators']))
    denominator_rows = [{'sourceNode': i, 'signOnRealSourceChart': f.sign(i), 'nonzero': f.sign(i) != 0} for i in denominators]
    require(all(r['nonzero'] for r in denominator_rows), 'An actual cleared divisor remains unproved')
    k = Q(1, 100000)
    exponent_checks = [
        ('primary-linear-residual-vs-B0', Q(1)-3*k, Q(7,10)),
        ('primary-nonlinear-residual-vs-B0', Q(1)-k, Q(7,10)),
        ('mean-wave-interaction-vs-B0', Q(1)-k, Q(7,10)),
        ('retained-Haar-mean-vs-C0star', Q(149,100), Q(6,5)),
        ('five-defect-conservative-vs-C0star', Q(1)-k+Q(9,10)-2*k, Q(6,5)),
        ('curl-remainder-vs-W068', Q(1)-k, Q(17,25)),
        ('tangential-pressure-vs-M09', Q(1)-k, Q(9,10)),
        ('radial-vs-M19', Q(2)-k, Q(19,10)),
    ]
    require(all(got > target for _, got, target in exponent_checks), 'Original exponent slack failed')
    requirements = []
    for row in prior['requirements']:
        requirements.append({**row, 'status': 'UNRESOLVED', 'paperPages': [69,70,71,106,107], 'reason': 'Every fixed-order source seminorm needs uniform constants on one original domain; fixed bump lemmas do not provide these input bounds.'})
    for row in requirements:
        if row['id'] in ('9.10-angular-moment', '9.10-axial-moment'):
            row['partiallyClosed'] = 'The actual five-bump increment has zero weighted moment by the checked compact profile change of variables and existing homogeneous row.'
            row['reason'] = 'Full temporal Fourier zero mode, T1/A1 zero-mode preservation and full source Fubini/support closure remain to prove for the complete tuple.'
    result = {
        'schema': 'MathScope.N6.FixedInitialSourceAnalyticLemmas/1',
        'source': {'parentNodesSHA256': PARENT, 'fullStreamNodeCount': count, 'selectedNodeCount': len(nodes), 'meanCertificateSHA256': MEAN_SHA, 'paperSHA256': PAPER_SHA, 'parameterExpressionSHA256': PARAM_SHA, 'originalAssemblyReceiptReadMode': assembly_mode, 'originalAssemblyReceiptSHA256': sha(assembly_raw), 'capture': capture},
        'reusedEvidence': [{'path': str(path.relative_to(artifacts)).replace('\\','/'), 'sha256': sha(path.read_bytes())} for path in (five_path,class_path)],
        'domain': {'provedFixedScalarFacts': ['The actual T=exp(1048576)+10 is finite and positive as a real number.', 'lambda=exp(-1000*T)>0; no numerical underflow replacement.', 'XR=110*(CSelected*Pstar)^10>0 and X0Imean=XR*exp(real)>0.', 'x0=sqrt(2*X0Imean)*exp(1/2)>0.'], 'remainingCommonChartPremise': 'The original slow chart and source targets are finite real smooth functions on the same claimed q domain. This checker does not establish that whole-domain premise.', 'allOrderUniformDomainCertified': False},
        'fixedBump': {'eta0Node': 634278, 'x0Node': 633686, 'supportEndpoints': [633686,634284], 'smoothFlatZeroExtension': True, 'proof': 'Every derivative of exp(-1/[t(1-t)]) is a rational polynomial in t,1/t,1/(1-t) times that exponential; exponential decay absorbs every endpoint pole.', 'positiveMomentRows': mu_rows, 'actualCopyMomentRows': copies, 'supportHullProof': '1 <= log(X/X0Imean) <= 1+4/5+2*log(11/10)<2<5, using log(1+u)<u. Thus all three copies and the convex hull of their supports lie inside the reserved Imean interval.', 'supportHullInOriginalImean': True, 'actualFiniteRadialPrimitiveWholeEnvelopeClosureProved': False, 'wholeEnvelopePremise': 'The actual inner/outer primitive integration boundaries must enclose these supports before transferring the zero full moment to its finite primitive.'},
        'denominatorLemma': {'sourceNodes': denominator_rows, 'provedOnRealSourceChart': True, 'order': 'z1=exp(-(2+2lambda)/5)<z2=exp(-2lambda/5)<z0=exp(2/5)', 'axialGap': '1-exp(-2lambda/5)>0', 'floatingPointExponentialsSubtracted': False, 'sourceTargetExistenceProved': False},
        'incrementMoments': {'angular': {'sourceHomogeneousRow': 3614735, 'profileCopies': [634278,634467,634497], 'identity': 'integral R^2 delta_v dR = s^(3/2-A)*mu_2*sum_j exp(2*j/5)*c_j = 0'}, 'axial': {'sourceHomogeneousRow': 3614752, 'profileCopies': [634278,634467], 'identity': 'integral R delta_gamma dR = s^(1-A)*mu_1*sum_j exp(j/5)*d_j = 0'}, 'fixedFiniteBumpIntegralsVerified': True, 'completeTupleMoments9_10Proved': False, 'usesExistingIndependentRowsWithoutRerun': True},
        'classDefinitions': {'M': {'paperEquation': '6.24', 'coefficientDerivatives': 'I in N_0^5, frozen band/label/representative/harmonic', 'bound': '|partial^I f|<=C_I*epsilon^alpha*S_*^b_I*zeta*delta^(-d_I)', 'uniformIn': ['band','label','rectangle copy','point']}, 'W': {'paperEquation': '6.29', 'bound': '|partial^I A_(label,harmonic)|<=C_I*epsilon^alpha*S_*^b_I*sqrt(zeta)*delta^(-d_I)*P_v', 'groupEqualLabelHarmonicBeforeTesting': True, 'supportsAndCommonTorusDescentRequired': True}, 'S': {'paperEquation': '6.25', 'derivatives': 'I in N_0^2 for Z,T', 'bound': '|partial^I F|<=C_I*epsilon^alpha*S_*^b_I', 'momentNormalization': '6.26'}},
        'exponentSlack': [{'id': name, 'conditionalSourceExponent': str(got), 'required': str(target), 'exactSlack': str(got-target), 'actualClassMembershipProved': False} for name,got,target in exponent_checks],
        'requirements': requirements,
        'mathStatus': 'FIXED_BUMP_AND_NONZERO_DIVISOR_LEMMAS_ON_REAL_SOURCE_CHART; FULL_N601_UNRESOLVED',
        'originalN601Complete': False, 'originalN602Complete': False, 'unconditionalMathematicalProof': False, 'originalProgressChanged': False,
        'elapsedSeconds': monotonic()-started,
    }
    (output/'initial-fixed-source-lemmas.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['mathStatus'],'nonzeroDivisors':len(denominator_rows),'positiveMomentBodies':len(mu_rows),'actualCopyBodies':len(copies),'openClassAndFullMomentRequirements':len(requirements),'N601Complete':False,'elapsedSeconds':result['elapsedSeconds']}))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',type=Path,default=REPO)
    parser.add_argument('--artifacts',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    run(args.repo.resolve(),args.artifacts.resolve(),args.output.resolve())
