"""Check exact exterior radial support of the first actual post-Signed Temporal correction."""
from argparse import ArgumentParser
from hashlib import sha1, sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

ADJACENT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ADJACENT / 'first-gauge'), str(ADJACENT / 'f1-mean')]
from bind_first_cycle_gauge import (
    CI0, EPSILON, RADIAL_FAST, Graph, Exact, Native, TEMP_INVERSE, TEMP_PSI,
    git_blob, integral_compact, linear_terms, need, product_other, read_artifact,
    source_pins, split_sub, unique,
)
from bind_mean_angle_scope import Scope
from prove_five_whole import verify_shell

ELL, R, Z, T, Y0, Y1 = 622791, 622802, 622803, 622804, 635044, 635045
Y = [Y0, Y1]
P = [R, Z, T, ELL, *Y]
D = [R, Z, T, *Y]
S, X, XA, XB = 622820, 622824, 3617, 28826
INNER, OUTER, CHI = 633710, 633712, 633733
NAMES = ('rr', 'rtheta', 'rz', 'thetatheta', 'thetaz', 'zz')
EARLY = 'global_actual_temporal_actual_meridional_potential'
INIT_FIVE = ['GlobalInitializationFiveBump_' + n for n in ('beta','v','gamma')]
RAW = [4229105, 4229480]
PRE_Z, POST_Z = 643849, 4229476
SOURCE_DIR = 'research-ide/mathscope-m3/navier/'


def definitions(native, section):
    return {v['name']: v | {'id': -i-1 if section == 'expressionDefinitions' else i}
            for i, v in enumerate(json.loads(native.raw['base'][section]))}


def args_on_exterior(formals, actual, radial):
    keep = {R: radial, Z: Z, T: T, ELL: ELL}
    need(len(formals) == len(actual) == len(set(formals)) and
         all(b == keep[a] for a,b in zip(formals, actual, strict=True) if a in keep),
         f'native exterior call must retain slow and frozen band arguments: {formals} -> {actual} at {radial}')


class ExteriorScope(Scope):
    """Conservative free coordinates after proven exterior source reductions."""
    def __init__(self, graph, snapshot, fields, radial=R, constants=(),
                 zero_applications=(), constant_expressions=()):
        super().__init__(graph, snapshot)
        self.radial = radial
        self.fields = fields
        self.constants = frozenset(constants)
        self.zero_applications = dict(zero_applications)
        self.constant_expressions = dict(constant_expressions)
        self.used = set()

    def plan(self, root):
        if root in self.constants:
            self.used.add(root)
            return [((self.radial,R,Z,T,ELL),frozenset())]
        op, a = self.graph.node(root)
        if op in ('m3_aux_indexed_partial', 'm3_coupled_indexed_partial') and (op,a[0]) in self.fields:
            need(len(a[2]) == len(D) and all(type(n) is int and n>=0 for n in a[2]),
                 'covered original native indexed derivative')
            args_on_exterior(self.fields[op,a[0]]['parameters'],a[1],self.radial)
            self.used.add(root)
            return []
        if (op, a[0] if a and type(a[0]) in (int,str) else None) in self.zero_applications:
            formals = self.zero_applications[op,a[0]]['parameters']
            args_on_exterior(formals,a[1],self.radial)
            self.used.add(root)
            return []
        if (op, a[0] if a and type(a[0]) in (int,str) else None) in self.constant_expressions:
            formals = self.constant_expressions[op,a[0]]['parameters']
            args_on_exterior(formals,a[1],self.radial)
            self.used.add(root)
            return [(tuple(b for a,b in zip(formals,a[1],strict=True) if a not in Y),frozenset())]
        return super().plan(root)


def independent(scope, roots, description):
    free = {root: sorted(scope.free(root)) for root in roots}
    need(all(not set(Y).intersection(coords) for coords in free.values()), description)
    return free


def covariance_guards(native):
    fields = {}
    for prefix, op, entries in (
            ('GlobalCompleteCommonTorus_', 'm3_aux_indexed_partial', native.aux_fields),
            ('ActualForcedCurrent_W_', 'm3_coupled_indexed_partial', native.fields),
            ('GenericSigned162_covariance_delta_', 'm3_coupled_indexed_partial', native.fields)):
        for name in NAMES:
            field = entries[prefix+name]
            need(field['parameters'] == P and field['directions'] == D, f'{field["name"]} original native formal chart')
            rows = field['rows']
            labels = {(row['label']['key'],row['label']['sign']) for row in rows}
            need(len(rows) == len(labels) == 162 and len({k for k,s in labels}) == 81 and
                 {s for k,s in labels} == {-1,1}, f'{field["name"]} complete original cover')
            for row in rows:
                need(row['guards'].count([X,XA,XB]) == 1,
                     f'{field["name"]} every row has the original lazy common radial guard')
            fields[op,field['id']] = field
    return fields


def chart(graph,native,repo):
    need(graph.node(R) == ('coordinate',['m3_global_band_slow_R$30435']) and
         graph.args(S,'actual_monotone_root') == [2,Z,T], 'original normalized slow chart')
    root = json.loads(native.raw['base']['base']['monotone'])[2]
    need(root['parameters'] == [Z,T] and root['name'] == 'ActualCommonBandSlowInverse' and
         [root['left'],root['right']] == [19,24], 'source 1/2<=s<=2 root domain')
    alg = Exact(graph)
    a = alg.of
    need(a(X) == alg.mul(a(R),a(R),alg.inv(alg.mul(alg.scalar(2),a(S)))), 'X=R²/(2s)')
    shell = verify_shell(graph, repo, {'inner': INNER,'outer': OUTER})
    argument, order = graph.args(CHI,'source_step_derivative')
    need(order == 0 and a(argument) == alg.mul(alg.scalar(10),alg.sub(
         alg.mul(a(R),alg.inv(alg.mul(a(633686),a(633687)))),alg.one)) and
         graph.args(633687,'sqrt_positive') == [S], 'literal original smooth cutoff argument')
    return shell | {'qOverQ':S,'X':X,'cutoff':CHI,'cutoffArgument':argument,'sourceChart':root}


def pressure_pair(graph, derivative, left, whole, pressure_whole, chi_argument):
    body, r, inner, outer = graph.args(whole, 'definite_integral')
    need([inner,outer] == [INNER,OUTER] and
         graph.args(left,'definite_integral') == [body,r,inner,R],
         'both actual pressure Z integrals use the same shifted derivative, binder and envelope')
    need(graph.args(pressure_whole,'definite_integral')[2:] == [INNER,OUTER],
         'unmodified whole pressure integral in the differentiated cutoff term')
    terms = linear_terms(graph, derivative)
    need(terms.pop(left) == 1, 'positive actual pressure Z partial')
    cutoff_whole = unique((i for i,sign in terms.items() if sign == -1 and
        graph.node(i)[0] == 'multiply' and set(graph.node(i)[1]) == {CHI,whole}),
        'actual negative chi times pressure Z whole')
    del terms[cutoff_whole]
    need(len(terms) == 1, 'only the literal differentiated cutoff term remains')
    (cutoff_z_whole,sign), = terms.items()
    cutoff_z = product_other(graph,cutoff_z_whole,pressure_whole)
    need(sign == -1 and any(graph.node(i) == ('source_step_derivative',[chi_argument,1])
                            for i in graph.reach([cutoff_z])), 'the remaining derivative differentiates original chi')
    return {'pZ':derivative,'left':left,'whole':whole,'integrand':body,'binder':r,
            'chiZ':cutoff_z,'undifferentiatedWhole':pressure_whole}


def inverse_application(graph, root, op, definition, radial, shifted_y):
    need(definition['parameters'] == P and definition['Y'] == Y and definition['directions'] == D and
         definition['operator'] == '(sqrt(2)-1)*partial_y0+partial_y1' and
         definition['finiteSumDeclaredEqualToLimit'] is False, 'exact original zero-mode inverse registry')
    need(graph.args(root,op) == [definition['id'],[radial,Z,T,ELL,*shifted_y],[0]*5],
         'actual native inverse mapping preserves its slow and band coordinates')


def temporal_integrals(graph, psi, inverse, op):
    compact = integral_compact(graph,psi,R,623135)
    r = compact['binder']
    need([compact['chi'],compact['inner'],compact['outer']] == [CHI,INNER,OUTER],
         'actual T1 original common cutoff and fixed envelope')
    weighted = product_other(graph,compact['integrand'],r)
    z_inverse = product_other(graph,product_other(graph,weighted,20),1706622)
    need(graph.args(1706622,'inverse') == [CI0], 'original fixed positive temporal coefficient')
    _,actual,_ = graph.args(z_inverse,op)
    for y,shifted in zip(Y,actual[-2:],strict=True):
        need(y in graph.args(shifted,'add'), 'actual common torus shift retains its source coordinate')
    inverse_application(graph,z_inverse,op,inverse,r,actual[-2:])
    return compact | {'axialInverseApplication':z_inverse,'actualArguments':actual}


def centered(graph, definition, raw):
    actual, mean = split_sub(graph,definition['body'])
    need(raw == actual, 'actual centered source subtracts the Haar mean of this same raw body')
    inner,y,lo,hi = graph.args(mean,'definite_integral')
    need([y,lo,hi] == [Y1,0,1] and graph.args(inner,'definite_integral') == [raw,Y0,0,1],
         'literal full normalized original two-torus Haar average')
    need(definition['zeroMode'] == 'The exact normalized Haar mean is projected out.', 'explicit zero-mode projection')
    return {'raw':raw,'haar':mean,'centered':definition['body']}


def pin_sources(repo, run):
    names = ('source-global-band','source-global-current','source-global-pressure',
             'source-global-temporal','source-global-initial-mean','source-global-forced-current',
             'source-full-mean-equations','source-updated-mean-pressure','source-auxiliary-fourier',
             'source-auxiliary-expressions','source-coupled-expressions','source-temporal-potential')
    pins = source_pins(repo)
    verified = {v['path']:v for v in run['corrected_first_cycle_source_byte_pins']['verifiedFiles']}
    for name in names:
        path = SOURCE_DIR+name+'.mjs'
        record = verified[path]
        body = git_blob(repo,run['executing_commit'],path)
        need(len(body)==record['byteLength'] and
             sha1(f'blob {len(body)}\0'.encode()+body).hexdigest()==record['gitBlobSHA'],
             f'actual hosted source bytes for {name}')
        pins[path] = sha256(body).hexdigest()
    return pins


def actual_curl(graph, definition, psi):
    def derivative(root, coordinate):
        formals = definition['parameters']
        return graph.node(root) == ('m3_coupled_expression_partial',
            [definition['id'],formals,[int(x==coordinate) for x in formals]])

    beta, gamma = 4454158,4454167
    beta_z = product_other(graph,product_other(graph,beta,20),EPSILON)
    need(derivative(beta_z,Z), 'actual radial Temporal velocity is -epsilon psi_Z')
    derivatives = {d:unique((i for i in graph.reach([gamma]) if derivative(i,d)),
                           f'actual Temporal gamma derivative in {d}') for d in [R,Y0,Y1]}
    alg = Exact(graph)
    a = alg.of
    expected = alg.add(a(derivatives[R]),alg.mul(a(623135),a(psi)),
        alg.mul(a(RADIAL_FAST),alg.add(a(derivatives[Y0]),alg.mul(a(623066),a(derivatives[Y1])))))
    need(a(gamma)==expected, 'actual axial Temporal velocity is the original cylindrical shifted curl')
    return [beta,gamma]


def rejected(check):
    try:
        check()
    except ValueError:
        return True
    raise ValueError('A negative control passed unexpectedly')


def controls(graph,native,post_inverses,inverse_roots,shell):
    field = native.fields['GenericSigned162_covariance_delta_zz']
    row = field['rows'][0]
    index = row['guards'].index([X,XA,XB])
    old = row['guards'][index]
    row['guards'][index] = [X,XA,OUTER]
    try:
        changed_guard = rejected(lambda:covariance_guards(native))
    finally:
        row['guards'][index] = old
    return {'changedOneSignedRadialGuard':changed_guard,
            'wrongRawHaarSource':rejected(lambda:centered(graph,post_inverses[0],RAW[1])),
            'wrongNativeComponent':rejected(lambda:inverse_application(
                graph,inverse_roots[1],'m3_coupled_inverse_partial',post_inverses[0],R,Y)),
            'mismatchedPressurePair':rejected(lambda:pressure_pair(
                graph,POST_Z,4229443,643807,4229293,shell['cutoffArgument']))}


def replay(graph, native, repo, run):
    fields = covariance_guards(native)
    primary = {k:v for k,v in fields.items() if k[0]=='m3_aux_indexed_partial'}
    shell = chart(graph,native,repo)
    aux_expr = definitions(native,'expressionDefinitions')
    aux_inv = definitions(native,'inverseDefinitions')
    stress, background = [633815,633863], [622934,634588,622933]
    base_scope = Scope(graph,native.raw)
    five_bodies = [aux_expr[n]['body'] for n in INIT_FIVE]
    fixed = independent(base_scope,[*stress,*background,*five_bodies,CI0,EPSILON,CHI,4229436],
                        'stress, background and actual J0 FiveMap increments have no original auxiliary mode')
    pre_pressure = pressure_pair(graph,PRE_Z,643806,643807,643283,shell['cutoffArgument'])
    pre_shift = ExteriorScope(graph,native.raw,primary,radial=pre_pressure['binder'])
    pre_dz_free = independent(pre_shift,[pre_pressure['integrand']],
                              'primary shifted pressure source derivative exterior Y independence')
    pre_e = ExteriorScope(graph,native.raw,primary,constants=[PRE_Z])
    initial_inverses = [aux_inv['GlobalActualTemporal_'+a] for a in ('theta','z')]
    pre_raw = [item['body'] for item in initial_inverses]
    pre_e_free = independent(pre_e,pre_raw,'both primary Temporal raw sources exterior Y independence')
    need(PRE_Z in pre_e.used and pre_shift.used and len(pre_e.used)>1, 'primary pressure and guarded covariance reached')
    old_psi = aux_expr[EARLY]
    initial_t1 = temporal_integrals(graph,old_psi['body'],initial_inverses[1],'m3_aux_inverse_partial')
    initial_theta_inverse = product_other(graph,product_other(graph,1706624,20),1706622)
    inverse_application(graph,initial_theta_inverse,'m3_aux_inverse_partial',initial_inverses[0],R,Y)
    initial_zero = [(('m3_aux_inverse_partial',d['id']),d) for d in initial_inverses]
    initial_zero.append((('m3_aux_expression_partial',old_psi['id']),old_psi))
    roots = [3614790,3614791,3614792]
    init_scope = ExteriorScope(graph,native.raw,fields,constants=five_bodies,zero_applications=initial_zero)
    init_free = independent(init_scope,roots,'actual initialized perturbation mean exterior Y independence')
    for n,root,velocity in zip(INIT_FIVE,roots,[1706773,1706624,1706782],strict=True):
        bump = product_other_add(graph,root,velocity)
        definition = aux_expr[n]
        need(graph.args(bump,'m3_aux_expression_partial') ==
             [definition['id'],definition['parameters'],[0]*len(definition['parameters'])],
             'actual J0 perturbation combines initial Temporal and the exact named FiveMap increment')
    need(initial_theta_inverse in init_scope.used and len(init_scope.used) >= 5,
         'actual initial inverse and meridional potential derivatives reached')
    post_pressure = pressure_pair(graph,POST_Z,4229443,4229444,4229293,shell['cutoffArgument'])
    post_gr = native.expressions['GenericSignedAfterForced162_complete_gr']
    post_gr_free = independent(init_scope,[post_gr['body']],
                               'actual post-Signed radial source exterior Y independence')
    post_shift = ExteriorScope(graph,native.raw,fields,radial=post_pressure['binder'],constants=[4229436],
                    constant_expressions=[(('m3_coupled_expression_partial',post_gr['id']),post_gr)])
    post_dz_free = independent(post_shift,[post_pressure['integrand']],
                               'post-Signed shifted pressure source derivative exterior Y independence')
    need(4229441 in post_shift.used and graph.args(4229441,'m3_coupled_expression_partial')[2] == [0,0,1,0,0,0],
         'actual shifted post-Signed pressure derivative differentiates the authenticated full radial source')
    post_e = ExteriorScope(graph,native.raw,fields,constants=[POST_Z,*five_bodies],zero_applications=initial_zero)
    post_e_free = independent(post_e,RAW,'both actual post-Signed full raw E components exterior Y independence')
    need(POST_Z in post_e.used and len(post_e.used)>5, 'actual refreshed pressure, initialized Temporal and guarded covariance reached')
    post_inverses = [native.inverses[n] for n in TEMP_INVERSE]
    post_centers = [centered(graph,d,raw) for d,raw in zip(post_inverses,RAW,strict=True)]
    inverse_roots = run['post_signed_exact_inverse_roots']
    for root,d in zip(inverse_roots,post_inverses,strict=True):
        inverse_application(graph,root,'m3_coupled_inverse_partial',d,R,Y)
    direct_swirl = 4454009
    need(product_other(graph,product_other(graph,direct_swirl,20),1706622) == inverse_roots[0],
         'actual final Temporal direct swirl is minus the theta inverse divided by ci')
    final_psi = 4454155
    d = native.expressions[TEMP_PSI]
    need(graph.args(final_psi,'m3_coupled_expression_partial') == [d['id'],d['parameters'],[0]*len(d['parameters'])],
         'actual source post-Signed T1 is the registered native application')
    final_t1 = temporal_integrals(graph,d['body'],post_inverses[1],'m3_coupled_inverse_partial')
    curl = actual_curl(graph,d,final_psi)
    negative_controls = controls(graph,native,post_inverses,inverse_roots,shell)
    return {'shell':shell,
            'covarianceFields':{v['name']:{'id':v['id'],'rows':len(v['rows']),
                                          'radialGuard':[X,XA,XB]} for v in fields.values()},
            'globallyAuxiliaryIndependent':fixed,
            'initialTemporal':{'raw':pre_raw,'pZ':pre_pressure,'exteriorDZScope':pre_dz_free,
                               'exteriorRawScope':pre_e_free,'thetaInverse':initial_theta_inverse,'T1':initial_t1},
            'initializedPerturbationMean':{'roots':roots,'exteriorFreeCoordinates':init_free,'fiveBodies':five_bodies},
            'postSignedTemporal':{'radialSource':post_gr,'exteriorRadialSourceScope':post_gr_free,
                                  'pZ':post_pressure,'exteriorDZScope':post_dz_free,'exteriorRawScope':post_e_free,
                                  'centering':post_centers,'nativeInverseRoots':inverse_roots,
                                  'directSwirl':direct_swirl,'psi':final_psi,'curlVelocity':curl,'T1':final_t1},
            'negativeControlsRejected':negative_controls,
            'exteriorSupportVerified':True,'radialDomain':'0<R<sqrt(Xa) or R>2 sqrt(Xb), on admitted original chart',
            'positiveOrderUniformMajorantsEstablished':False,'axisExtensionValueAssigned':False,
            'sourceRecurrenceScope':'First corrected cycle only','release':'HOLD'}


def product_other_add(graph,root,term):
    a = graph.args(root,'add')
    need(len(a)==2 and term in a,'actual initialized mean summand')
    return next(i for i in a if i!=term)


def main():
    parser = ArgumentParser(description=__doc__)
    for option in ('artifact','repo','out'):
        parser.add_argument('--'+option,required=True,type=Path)
    a = parser.parse_args()
    d,run,manifest,run_sha = read_artifact(a.artifact,True)
    registry = Native(d/'original-source-functions.json',manifest)
    pins = pin_sources(a.repo,run)
    with TemporaryFile() as backing:
        graph = Graph(d/'original-source-nodes.jsonl.gz',backing,manifest)
        result = replay(graph,registry,a.repo,run)
    data = {'schema':'MathScope.N7.CorrectedFirstTemporalExterior/1',
            'sourceCommit':manifest['executing_commit'],'graphSHA256':manifest['node_stream_sha256'],
            'registrySHA256':manifest['definitions_sha256'],'hostedRunSHA256':run_sha,
            'nodeCount':manifest['node_count'],'sourceSHA256':pins, **result}
    a.out.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    print(f'PASS Temporal exterior, {len(data["covarianceFields"])} native fields / 2916 rows, '
          f'direct swirl #{data["postSignedTemporal"]["directSwirl"]}, psi #{data["postSignedTemporal"]["psi"]}, '
          f'{len(data["negativeControlsRejected"])} controls rejected')


if __name__ == '__main__':
    main()

