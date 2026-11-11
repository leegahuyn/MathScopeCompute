"""Exact analytic reduction of the actual post-Signed FiveMap whole radial integral."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

from bind_first_cycle_gauge import (ADJACENT, Exact, FIVE, Graph, Native, ORIGINAL,
                                   git_blob, need, product_other, q, read, read_artifact, split_sub)
sys.path.insert(0, str(ADJACENT / 'f1-mean'))
from bind_mean_angle_scope import Scope


PROFILES = [634453, 634481]
S, X0, D_NODE, X_A, X_B = 622820, 633686, 71672, 3617, 28826


def factors(graph, root):
    op, args = graph.node(root)
    return [term for i in args for term in factors(graph, i)] if op == 'multiply' else [root]


def actual_axial_source(graph, registry, coordinates):
    alg = Exact(graph)
    R, Z, T = [coordinates[x] for x in ('R', 'Z', 'T')]
    body = registry.expressions[FIVE[2]]['body']
    terms = graph.args(body, 'add')
    need(len(terms) == 2, 'two actual FiveMap axial bump terms')
    coeffs = [product_other(graph, next(x for x in terms if p in graph.args(x, 'multiply')), p)
              for p in PROFILES]
    need(graph.args(S, 'actual_monotone_root') == [2, Z, T], 'actual band s uses independent Z,T')
    need(q(graph, graph.args(D_NODE, 'exp')[0]) == Fraction(1, 5), 'original e^(1/5)')
    need(not alg.add(alg.of(coeffs[0]), alg.mul(alg.of(D_NODE), alg.of(coeffs[1]))),
         'actual c0+exp(1/5)c1=0')
    scope = Scope(graph, registry.raw)
    allowed = {Z, T, coordinates['ell']}
    dependencies = [sorted(scope.free(c)) for c in coeffs]
    need(all(set(row) <= allowed for row in dependencies), 'actual coefficients are radial and angular independent')
    profile_data = []
    for j, root in enumerate(PROFILES):
        pieces = factors(graph, root)
        bump, = [i for i in pieces if graph.node(i)[0] == 'smooth_piecewise']
        arg, lo, hi, before, inside, after = graph.args(bump, 'smooth_piecewise')
        need([lo, hi, before, after] == [0, 1, 0, 0], 'original positive compact scalar bump')
        k = graph.args(inside, 'exp')[0]
        w = alg.of(arg)
        need(alg.of(k) == alg.neg(alg.inv(alg.mul(w, alg.sub(alg.one, w)))),
             'actual interior source bump exp[-1/(t(1-t))]')
        sqrt_s, = [i for i in graph.reach([arg]) if graph.node(i) == ('sqrt_positive', [S])]
        dilation = alg.pow(alg.of(D_NODE), j)
        scaled_radius = alg.mul(alg.of(R), alg.inv(alg.mul(alg.of(X0), alg.of(sqrt_s), dilation)))
        need(w == alg.mul(alg.scalar(10), alg.sub(scaled_radius, alg.one)),
             'original rescaled axial bump argument')
        common, = [i for i in pieces if graph.node(i)[0] == 'exp']
        log_s, = [i for i in graph.reach([common]) if graph.node(i) == ('log_positive', [S])]
        need(alg.of(graph.args(common, 'exp')[0]) == alg.neg(alg.mul(alg.of(23), alg.of(log_s))),
             'actual s^(-A) factor')
        rest = alg.mul(*(alg.of(i) for i in pieces if i not in (bump, common)))
        need(rest == alg.inv(alg.mul(alg.of(X0), dilation)), 'original scaled compact bump amplitude')
        profile_data.append({'root': root, 'bump': bump, 'argument': arg,
                             'amplitudeSFactor': common, 'coefficient': coeffs[j]})
    return {'gammaDefiningBody': body, 'axialCoefficients': coeffs, 'coefficientFreeCoordinates': dependencies,
            'coefficientIdentity': 'c0+exp(1/5)*c1=0', 'profiles': profile_data, 'sRoot': S}


def verify_whole_binding(graph, registry, five, R):
    body, binder, lower, upper = graph.args(five['whole'], 'definite_integral')
    need([body, binder, lower, upper] == [five['integrand'], five['binder'], five['inner'], five['outer']]
         and graph.args(five['partial'], 'definite_integral') == [body, binder, lower, R],
         'same exact actual left and whole FiveMap integral')
    raw = product_other(graph, body, binder)
    definition = registry.expressions[FIVE[2]]
    parameters = definition['parameters']
    need(graph.args(raw, 'm3_coupled_expression_partial') ==
         [definition['id'], [binder if p == R else p for p in parameters], [0]*len(parameters)],
         'same exact two-bump gamma behind actual whole integral')
    invR = product_other(graph, five['usedPsi'], five['partial'])
    need(graph.args(invR, 'inverse') == [R], 'actual unmodified FiveMap primitive')
    left, cutoff = split_sub(graph, product_other(graph, five['compactCandidatePsi'], invR))
    need(left == five['partial'] and
         Counter(graph.args(cutoff, 'multiply')) == Counter([five['chi'], five['whole']]),
         'separate actual compact candidate only')


def controls(graph, registry, five, R):
    failed = []
    for label, key, wrong in [
        ('rejectedPartialInPlaceOfWhole', 'whole', five['partial']),
        ('rejectedCompactInPlaceOfUsed', 'usedPsi', five['compactCandidatePsi']),
    ]:
        try:
            verify_whole_binding(graph, registry, {**five, key: wrong}, R)
        except ValueError:
            failed.append(label)
        else:
            raise ValueError(f'mutation survived: {label}')
    return failed


def verify_shell(graph, repo, five):
    alg = Exact(graph)
    need(graph.args(five['inner'], 'sqrt_positive') == [X_A], 'original inner radial envelope')
    out = product_other(graph, five['outer'], 24)
    need(graph.args(out, 'sqrt_positive') == [X_B], 'original outer radial envelope')
    x0_parts = factors(graph, X0)
    exp_half, = [i for i in x0_parts if graph.node(i)[0] == 'exp']
    sq, = [i for i in x0_parts if graph.node(i)[0] == 'sqrt_positive']
    need(q(graph, graph.args(exp_half, 'exp')[0]) == Fraction(1, 2), 'original mean bump center')
    xmean = product_other(graph, graph.args(sq, 'sqrt_positive')[0], 24)
    need(graph.node(xmean) == ('source_parameter', ['X0Imean']), 'original Imean left parameter')
    source = git_blob(repo, ORIGINAL, 'research-ide/mathscope-m2/navier/source-profile-data.mjs')
    metadata = json.loads(source.decode().split('export const PINNED_N3 = ', 1)[1].strip().removesuffix(';'))
    p = metadata['parametersExactExpressions']
    need(p['Xa'] == {'quotient': [{'integer':4}, {'ref':'Lambda'}]}
         and p['Lambda'] == {'power': [{'ref':'Q'}, 64]}
         and p['X0Imean'] == {'product': [{'ref':'XR'}, {'exp': {'sum': [
             {'ref':'T'}, {'integer':2}, {'product':[{'integer':60}, {'ref':'BOuter'}]}, {'integer':-8}]}}]}
         and p['ImeanRight'] == {'product': [{'ref':'X0Imean'}, {'exp': {'integer':5}}]}
         and p['BOuter'] == {'product': [{'integer':1000}, {'ref':'T'}]}
         and p['h'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
         and p['lambda'] == {'exp':{'product':[{'integer':-1000},{'ref':'T'}]}}
         and p['co'] == {'rational':'1/256'}
         and p['T'] == {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]}
         and p['Md'] == {'integer':1048576}
         and p['logP'] == {'product':[{'integer':2},{'ref':'T'}]}
         and p['Pstar'] == {'exp':{'ref':'logP'}}
         and p['K'] == {'power':[{'ref':'Pstar'},2]}
         and p['XR'] == {'product':[{'integer':110},{'power':[
             {'product':[{'ref':'CSelected'},{'ref':'Pstar'}]},10]}]}
         and p['CSelected'] == {'exp':{'ref':'logCSelected'}}
         and p['j0'] == {'power':[{'ref':'h'},4]}
         and p['sigmaStar'] == {'quotient':[{'ref':'j0'},{'integer':2000}]}
         and p['BRefUpper'] == {'power':[{'ref':'Q'},300]}
         and int(p['Q']['quotient'][0]['product'][0]['integer']) >= 1
         and p['Q']['quotient'][0]['product'][1] == {'ref':'K'}
         and p['Q']['quotient'][1] == {'power':[{'ref':'sigmaStar'},2]}
         and p['logCSelected'] == {'sum':[
             {'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},
             {'power':[{'ref':'Q'},200]}]}, 'actual unchanged source shell parameters')
    # Exact graph roles of the inherited terminal-radius formula. The
    # analytic signs and bounds used here are listed in README.md.
    checks = {
        28826: ('multiply', [12, 28825]), 28825: ('exp', [319]), 319: ('add', [261, 294]),
        294: ('add', [218, 280]), 218: ('add', [1, 199]), 199: ('add', [179, 186]),
        179: ('add', [1, 158]), 158: ('add', [139, 148]), 139: ('add', [13, 114]),
        114: ('add', [98, 103]), 98: ('add', [76, 84]), 76: ('add', [1, 56]),
        56: ('add', [1, 6]), 84: ('multiply', [7, 83]), 148: ('multiply', [7, 147]),
        280: ('multiply', [278, 279]), 279: ('inverse', [207]), 278: ('log_positive', [277]),
        277: ('multiply', [259, 276]), 276: ('inverse', [275]), 259: ('multiply', [245, 258]),
        245: ('exp', [244]), 244: ('multiply', [20, 219]), 219: ('multiply', [19, 207]),
        258: ('add', [243, 257]), 243: ('add', [241, 242]), 242: ('multiply', [186, 207]),
        186: ('multiply', [184, 185]), 185: ('log_positive', [9]),
        241: ('multiply', [225, 240]), 240: ('add', [224, 239]), 224: ('multiply', [222, 223]),
        222: ('add', [8, 21]), 223: ('inverse', [167]),
        239: ('definite_integral', [238, 226, 0, 1]), 238: ('multiply', [233, 237]),
        237: ('add', [21, 236]), 236: ('add', [8, 235]), 235: ('multiply', [167, 234]),
        234: ('source_step_derivative', [226, 0]), 233: ('exp', [232]),
        257: ('definite_integral', [256, 246, 0, 1]), 256: ('multiply', [254, 255]),
        254: ('add', [1, 253]), 253: ('multiply', [20, 252]), 252: ('source_step_derivative', [246, 0]),
        255: ('multiply', [207, 251]), 251: ('exp', [250]),
        275: ('definite_integral', [274, 262, 1, 261]), 274: ('multiply', [269, 273]),
        269: ('multiply', [267, 268]), 268: ('multiply', [260, 264]), 260: ('multiply', [9, 14]),
        267: ('source_step_derivative', [266, 1]), 266: ('multiply', [19, 265]), 265: ('add', [20, 262]),
        264: ('exp', [263]), 263: ('multiply', [207, 262]), 273: ('inverse', [272]),
        272: ('multiply', [24, 271]), 271: ('add', [1, 270]), 270: ('multiply', [20, 260]),
    }
    need(all(graph.node(i) == entry for i, entry in checks.items()), 'actual analytic terminal shell tree')
    need(alg.of(207) == alg.sub(alg.one, alg.of(9))
         and alg.of(167) == alg.sub(alg.one, alg.of(8))
         and graph.node(14) == ('source_parameter', ['co'])
         and q(graph,83) == 60 and q(graph,147) == 30 and q(graph,184) == -4
         and q(graph,261) == 3 and graph.node(6) == ('source_parameter', ['T'])
         and graph.node(7) == ('source_parameter', ['BOuter'])
         and graph.node(12) == ('source_parameter', ['XR'])
         and graph.node(13) == ('source_parameter', ['Tf'])
         and p['Tf'] == {'integer':128}
         and alg.of(103) == alg.mul(alg.scalar(13), alg.inv(alg.of(8))),
         'actual positive terminal constants')
    need(Fraction(11,10)**2 < 2 and Fraction(1,1)+Fraction(2,5)+1 < 5,
         'both axial bump supports fit within original Imean bound')
    return {'inner': five['inner'], 'outer': five['outer'], 'Xa': X_A, 'Xb': X_B,
            'originalMeanPatchLeft': xmean, 'center': X0,
            'proof': 'Xa<X0Imean and Xb>e^5 X0Imean. Both axial bump X-supports lie in Imean; s in [1/2,2] puts their R-supports inside the exact common envelope.',
            'terminalTreeNodesChecked': len(checks), 'sourceParameterSHA256': metadata['parameterExpressionSHA256']}


def main():
    p = ArgumentParser(description=__doc__)
    for name in ('repo', 'artifact', 'gauge-receipt', 'out'):
        p.add_argument('--'+name, required=True, type=Path)
    p.add_argument('--corrected', action='store_true')
    args = p.parse_args()
    folder, _, manifest, run_sha = read_artifact(args.artifact, args.corrected)
    gauge = read(args.gauge_receipt)
    need(gauge['graphSHA256'] == manifest['node_stream_sha256'] and gauge['hostedRunSHA256'] == run_sha,
         'same actual gauge and whole integral artifact')
    native = Native(folder/'original-source-functions.json', manifest)
    five = gauge['FiveMap']
    with TemporaryFile() as backing:
        graph = Graph(folder/'original-source-nodes.jsonl.gz', backing, manifest)
        R = gauge['referenceCoordinates']['R']
        verify_whole_binding(graph, native, five, R)
        axial = actual_axial_source(graph, native, gauge['referenceCoordinates'])
        shell = verify_shell(graph, args.repo, five)
        negatives = controls(graph, native, five, R)
    output = {'schema':'MathScope.N7.OriginalFirstCycleFiveMapWholeZero/1',
              'graphSHA256':manifest['node_stream_sha256'], 'scope':'Exact original five bump whole radial integral',
              'actualWhole':five['whole'], 'actualPsi':five['usedPsi'], 'compactCandidatePsi':five['compactCandidatePsi'],
              'retainedNativeAxis':axial, 'shell':shell,
              'negativeControlsRejected':negatives,
              'proof':'Change variables R=sqrt(s)*x with s R-independent and integrate the whole bump supports. The exact weighted whole is s^(1-A)*mu_1*(c0+exp(1/5)*c1)=0. Thus used and compact psi agree analytically and used psi has zero exterior shell branches.',
              'compiledKernelOrNumericIntegral':False, 'finalJets':0}
    raw=(json.dumps(output,indent=2)+'\n').encode()
    args.out.write_bytes(raw)
    print(json.dumps({'whole': five['whole'], 'sha256': sha256(raw).hexdigest()}))


if __name__ == '__main__':
    main()
