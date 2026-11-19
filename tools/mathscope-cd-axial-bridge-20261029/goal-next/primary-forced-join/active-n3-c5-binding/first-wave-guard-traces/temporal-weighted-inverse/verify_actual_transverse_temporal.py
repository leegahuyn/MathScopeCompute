"""Authenticate the six original covariance fields and their transverse jets."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys

ACTIVE = 'primary-forced-join/active-n3-c5-binding'
XI, CHI, PULSE = 17733037, 17733045, 17732751
R, Z, T, ELL, Y0, Y1 = 17732748, 17732749, 17732750, 17732737, 17745430, 17745431
V1, SQRT2, DGEOM = 17733068, 3622, 17732699
NAMES = ('rr', 'rtheta', 'rz', 'thetatheta', 'thetaz', 'zz')
POTENTIALS = {32033:17735323, 32034:17735324, 32035:17735325,
              32042:17738774, 32043:17738775, 32044:17738776}
PINS = {
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'stream':'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'pressure':'c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4',
    'potential':'c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8',
    'c86':'8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460',
}


def pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw


class Graph:
    def __init__(self, stream):
        self.s = stream

    @cache
    def node(self, i):
        row = self.s.record(i)
        return row['op'], row['args']

    def args(self, i, op):
        actual, args = self.node(i)
        assert actual == op, (i, op, actual)
        return args

    def rat(self, i):
        return Q(*map(int, self.args(i, 'rational')))

    @cache
    def depends_xi(self, i):
        if i <= XI:
            return i == XI
        op, args = self.node(i)
        if op in ('rational', 'coordinate', 'source_parameter'):
            return False
        if op == 'definite_integral':
            body, binder, left, right = args
            children = [left, right] if binder == XI else [body, left, right]
        elif op in ('integer_power', 'source_step_derivative'):
            children = args[:1]
        elif op in ('actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_global_indexed_partial'):
            children = args[1]
        elif op in ('actual_covariance_volterra','m3_global_pulse_jet'):
            children = [args[2], *args[3]]
        elif op in ('actual_quadratic_root','actual_monotone_root'):
            children = args[1] if isinstance(args[1],list) else args[1:]
        elif op in ('actual_background_picard','actual_background_even_profile'):
            children = args[2:4]
        elif op == 'actual_natural_series':
            children = args[1:3]
        else:
            assert op in ('add','multiply','inverse','sqrt_positive','log_positive','exp',
                          'ceiling','maximum','smooth_piecewise','sine','cosine'), (i,op,args)
            children = args
        assert all(type(child) is int and child < i for child in children), (i, op)
        return any(self.depends_xi(j) for j in children)


def local_shapes(g, native):
    aux = json.loads(native.base_snapshot['expressionDefinitions'])
    originals = json.loads(native.base_snapshot['base']['expression'])
    assert g.args(CHI,'smooth_piecewise') == [17733040,847,120836,1,17733044,0]
    assert g.args(17733044,'source_step_derivative') == [17733043,0]
    assert g.args(17733043,'add') == [656,17733042]
    assert g.args(17733042,'multiply') == [20,17733041]
    assert g.args(17733041,'multiply') == [24,17733040]
    assert g.args(17733040,'sqrt_positive') == [17733039]
    assert g.args(17733039,'integer_power') == [17733038,2]
    assert g.args(17733038,'multiply') == [157470,XI]
    assert [g.rat(i) for i in (847,120836,656,20,24,157470)] == [Q(1,4),Q(3,4),Q(3,2),-1,2,2**34]
    applications = set()

    @cache
    def monomials(i, allow_potential):
        if i == CHI:
            return frozenset({(1,0)})
        if not g.depends_xi(i):
            return frozenset({(0,0)})
        op, args = g.node(i)
        if op == 'actual_expression_partial' and allow_potential:
            system, actual, orders = args
            assert system in POTENTIALS and len(actual) == len(orders) == 12 and actual[3] == XI
            assert all(k == 3 or not g.depends_xi(arg) for k, arg in enumerate(actual))
            derivative = orders[3]
            assert derivative in (0,1)
            applications.add(i)
            return frozenset({(1-derivative,derivative)})
        if op == 'add':
            return frozenset.union(*(monomials(arg,allow_potential) for arg in args))
        assert op == 'multiply', (i, op, args)
        result = {(0,0)}
        for arg in args:
            result = {(a+c,b+d) for a,b in result for c,d in monomials(arg,allow_potential)}
        return frozenset(result)

    for system, body in POTENTIALS.items():
        decl = originals[system]
        assert decl['name'].startswith('GlobalOriginalPotential_')
        assert decl['body'] == body and decl['parameters'][3] == XI and not decl['unspecifiedOracle']
        assert monomials(body,False) == {(1,0)}
    rows = native.aux_fields[0]['rows']
    result = []
    covering_keys = ('coefficient','values','derivativeMaps','guards','label')
    for field, name in zip(native.aux_fields[:6],NAMES,strict=True):
        assert field['name'] == 'GlobalCompleteCommonTorus_' + name and len(field['rows']) == 162
        assert field['parameters'] == [R,Z,T,ELL,Y0,Y1]
        assert field['directions'] == [R,Z,T,Y0,Y1]
        mapped = {}
        for row, reference in zip(field['rows'],rows,strict=True):
            assert all(row[key] == reference[key] for key in covering_keys)
            assert row['localParameters'][-2:] == [XI,PULSE]
            decl = aux[-row['localSystem']-1]
            sign = row['label']['sign']
            assert decl['name'] == f'GlobalCommonTorusOriginalFullCurl_{sign}_{name}'
            assert decl['parameters'] == row['localParameters'] and decl['body'] == row['localBody']
            assert min(decl['derivativeLimits']) >= 16
            previous = mapped.setdefault(sign,row['localBody'])
            assert previous == row['localBody']
        assert sorted(mapped) == [-1,1]
        for sign, guarded in sorted(mapped.items()):
            root = guarded
            guards = []
            while g.node(root)[0] == 'smooth_piecewise':
                x,l,r,zero,inner,right = g.args(root,'smooth_piecewise')
                assert zero == right == 0 and not g.depends_xi(l) and not g.depends_xi(r)
                if g.depends_xi(x):
                    assert x == XI and (g.rat(l),g.rat(r)) == (-Q(1,2**34),Q(1,2**34))
                    guards.append(root)
                root = inner
            assert len(guards) == 1, (name, sign, guards)
            terms = sorted(monomials(root,True))
            assert terms and all(term in [(2,0),(1,1),(0,2)] for term in terms), (name,sign,terms)
            result.append({'field':name,'sign':sign,'guarded':guarded,'interior':root,
                           'uniqueXiGuard':guards[0],'cutoffMonomials':terms})
    return rows, result, sorted(applications)


def jacobians(g, rows, Exact):
    E = Exact(g)
    assert g.args(SQRT2,'sqrt_positive') == [24] and g.rat(24) == 2
    assert E.of(V1) == E.sub(E.one,E.of(SQRT2))
    area_difference = E.sub(E.of(DGEOM),E.add(E.one,E.pow(E.of(V1),2)))
    assert E.reduce_sqrt_two(area_difference,SQRT2) == E.zero
    dsets = set()
    simple_checks = 0
    signs_by_label = {}
    for row in rows:
        assert [[a['parameter'] for a in m] for m in row['derivativeMaps']] == [[0],[1],[2],[7,8],[7,8]]
        assert row['guards'][0] == [17732770,3617,28826]
        signs_by_label.setdefault(row['label']['key'],[]).append(row['label']['sign'])
        columns = [[v['coefficient'] for v in entries] for entries in row['derivativeMaps'][3:]]
        xi_ids, pulse_ids = tuple(zip(*columns,strict=True))
        dsets.add(tuple(xi_ids))
        for xx,vv in zip(xi_ids,pulse_ids,strict=True):
            xa = g.args(xx,'multiply')
            [dg] = [i for i in xa if g.node(i) == ('inverse',[DGEOM])]
            [xa0] = [i for i in xa if i != dg]
            direct = g.args(xa0,'add')
            [scaled] = [i for i in direct if g.node(i)[0]=='multiply' and V1 in g.node(i)[1]]
            [m1] = [i for i in g.args(scaled,'multiply') if i!=V1]
            [m0] = [i for i in direct if i!=scaled]
            pieces = g.args(vv,'multiply')
            [norm] = [i for i in pieces if g.node(i)[0]=='inverse']
            [combination] = [i for i in pieces if i!=norm]
            normalizer = g.args(norm,'inverse')[0]
            assert DGEOM in g.args(normalizer,'multiply')
            assert E.of(combination) == E.sub(E.of(m1),E.mul(E.of(V1),E.of(m0)))
            simple_checks += 1
    assert len(signs_by_label) == 81 and all(sorted(x)==[-1,1] for x in signs_by_label.values())
    # Re-evaluate each original matrix selector for every admitted integer delta.
    visited = set()
    J = ((3,1),(1,5))
    for pair in sorted(dsets):
        selector_variables = set()
        cells = []
        for idx in pair:
            xa = g.args(idx,'multiply')
            [num] = [i for i in xa if g.node(i)!=('inverse',[DGEOM])]
            direct = g.args(num,'add')
            [scaled] = [i for i in direct if g.node(i)[0]=='multiply' and V1 in g.node(i)[1]]
            [m1] = [i for i in g.args(scaled,'multiply') if i!=V1]
            [m0] = [i for i in direct if i!=scaled]
            cells.append([m0,m1])
        current = ((1,0),(0,1))

        def branch(i,k):
            if g.node(i)[0] == 'rational':
                return g.rat(i)
            x,l,r,before,mid,after = g.args(i,'smooth_piecewise')
            selector_variables.add(x)
            l,r = g.rat(l),g.rat(r)
            assert l != k and r != k
            return branch(before if k < l else after if k > r else mid,k)

        for k in range(5):
            for col in range(2):
                for index in range(2):
                    assert branch(cells[col][index],k) == current[index][col]
            current = tuple(tuple(sum(row[z]*J[z][col] for z in range(2)) for col in range(2)) for row in current)
        assert len(selector_variables) == 1
        visited.update(selector_variables)
    # Check the two eigenvector relations in the original quadratic field.
    vr = [E.one,E.of(V1)]
    vt = [E.neg(E.of(V1)),E.one]
    lr = E.sub(E.scalar(4),E.of(SQRT2))
    lt = E.add(E.scalar(4),E.of(SQRT2))
    for eig, vec in ((lr,vr),(lt,vt)):
        for row, vi in zip(J,vec,strict=True):
            difference = E.sub(E.dot([E.scalar(i) for i in row],vec),E.mul(eig,vi))
            assert E.reduce_sqrt_two(difference,SQRT2) == E.zero
    assert E.dot(vr,vt) == E.zero
    return {'rows':len(rows),'signedBoxes':len({row['label']['key'] for row in rows}),
            'columnChecks':simple_checks,'distinctXiMatrices':len(dsets),'originalSelectorRoots':sorted(visited),
            'directions':['L xi=(4-sqrt(2))^delta','L v=0'],
            'admittedDelta':[0,1,2,3,4]}


def temporal(g, n, source):
    aux = json.loads(n.base_snapshot['inverseDefinitions'])
    assert [d['body'] for d in aux[:2]] == [17754253,17754268]
    assert all(d['operator'] == '(sqrt(2)-1)*partial_y0+partial_y1' and
               d['parameters'] == [R,Z,T,ELL,Y0,Y1] for d in aux[:2])
    assert g.args(19570809,'m3_aux_inverse_partial') == [
        1,[19570776,Z,T,ELL,19570783,19570785],[0]*5]
    assert g.args(19570770,'inverse') == [17745449]
    assert g.args(19570810,'multiply') == [19570770,19570809]
    assert g.args(19570812,'multiply') == [19570776,19570811]
    assert set(g.args(19570811,'multiply')) == {20,19570810}
    assert g.args(19570813,'definite_integral') == [19570812,19570776,17743711,R]
    assert g.args(19570814,'definite_integral') == [19570812,19570776,17743711,17743713]
    assert g.args(19570917,'multiply') == [17733137,19570916]
    assert g.args(19570921,'multiply') == [20,19570920]
    assert source['pressureZ'] == 17754234
    markers = ('deltaV=G.neg(G.div(inverseTheta,ci))','gammaDesired=G.neg(G.div(inverseZ,ci))',
               'beta=G.neg(Dz(psi)),gamma=De(psi,1)','cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)')
    return {'exactSources':[17754253,17754268],'inverseSystems':[0,1],'ci':17745449,'shiftedInverse':19570809,
            'T1':[19570813,19570814],'psi':19570917,'beta':19570921,'sourceIdentities':list(markers)}


def verify(goal, artifact, cache_dir, runtime):
    active = goal / ACTIVE
    sys.path[:0] = [str(active/'spatial-readback'),str(active/'live-wave-gauge/signed'),str(goal/'first-force-repair')]
    import source_stream
    import source_cache
    from verify_repaired_first_force import Exact
    base = active / 'first-wave-guard-traces'
    c86file = base / 'signed-polynomial-shell/initial-temporal/initial-temporal.json'
    c86 = json.loads(pinned(c86file,PINS['c86']))
    rt = runtime / 'research-ide/mathscope-m3/navier'
    pressure = pinned(rt/'source-global-pressure.mjs',PINS['pressure']).decode()
    potential = pinned(rt/'source-temporal-potential.mjs',PINS['potential']).decode()
    for token in ('xiJacobian=[0,1]','vJacobian=[0,1]','integerRange:{minimum:0,maximum:4',
                  "fixed-reference-time-coefficient","fixed-reference-radial-primitive"):
        assert token in pressure
    folder = artifact/'first-correction-spatial-source'
    manifest = json.loads(pinned(folder/source_stream.MANIFEST,PINS['manifest']))
    native = source_stream.Native(folder,manifest)
    assert native.pin == PINS['registry']
    stream = source_cache.load(source_stream,folder,manifest,22153782,cache_dir)
    try:
        assert stream.count == 22155584 and stream.verify['sha256'] == PINS['stream']
        g = Graph(stream)
        rows, shapes, calls = local_shapes(g,native)
        chart = jacobians(g,rows,Exact)
        path = temporal(g,native,c86)
        assert all(marker in potential for marker in path['sourceIdentities'])
        return {'status':'VERIFIED_ALL_SIX_ACTUAL_TRANSVERSE_COVARIANCE_SHAPES_AND_TEMPORAL_BINDER',
                'pins':PINS,'sourceNodes':stream.count,'auditedComponents':list(NAMES),'cutoff':CHI,
                'transverseCoordinate':XI,'actualNativeHarmonicBodies':POTENTIALS,
                'actualNativeHarmonicApplications':calls,'localCovariances':shapes,'commonTorus':chart,
                'actualTemporal':path,'finalJets':0,'release':'HOLD'}
    finally:
        stream.__exit__()


if __name__ == '__main__':
    parser = ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','runtime','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args = parser.parse_args()
    if not __debug__:
        parser.error('run with assertions enabled')
    verified = verify(args.goal,args.artifact,args.cache,args.runtime)
    with args.out.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(verified,file,indent=2)
        file.write('\n')
    print(verified['status'])
