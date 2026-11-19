"""Bind the actual N3 three-component wave discrepancy and reference transport."""
from argparse import ArgumentParser
from contextlib import contextmanager
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json
import sys


RUN = 44582875351
MANIFEST_PIN = '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a'
INGRESS_PIN = '20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f'
CYCLE_PIN = '42885290951e7d4b9fa689c7f67e0d390b39d101cc80d2af08c14188f25baef3'
MEAN_PIN = '23ef852f8a0b0138342190113fab7ce692fa79cc517c4743e64c82f8cb6ed6a5'
COMPACT_PIN = '4034331b1ab4204a845d197b213e3566a7bc677aa4541f22936e2bc77b89435d'
FIVE_PIN = '3e7be0b196440736e725849634700bbaf11620f1b6177fd3566c911cd493393c'


def first_level_other(graph, root, member):
    args = graph.args(root, 'add')
    assert len(args) == 2 and args.count(member) == 1
    return next(x for x in args if x != member)


def exact_terms(graph, root, expected, opaque=()):
    from verify_spatial_structure import arithmetic_terms
    assert arithmetic_terms(graph, root, opaque, limit=350) == expected, root


def scale_member(graph, root, factor, operation='multiply'):
    args = graph.args(root, operation)
    assert len(args) == 2 and args.count(factor) == 1, (root,factor)
    return next(x for x in args if x != factor)


def expect_exp(graph, root, monomial):
    exponent, = graph.args(root, 'exp')
    exact_terms(graph, exponent, monomial)


def exponent_polynomial(graph,root):
    from verify_spatial_structure import arithmetic_terms
    if root == 1:
        return {}
    rec = graph.record(root)
    op,args = rec['op'],rec['args']
    if op == 'exp':
        return arithmetic_terms(graph,args[0],limit=350)
    if op == 'inverse':
        return {term:-coef for term,coef in exponent_polynomial(graph,args[0]).items()}
    assert op == 'multiply', root
    total = {}
    for child in args:
        for term,coef in exponent_polynomial(graph,child).items():
            total[term] = total.get(term,0) + coef
    return {term:coef for term,coef in total.items() if coef}


def check_ratio(graph,ratio,log2,own,reference):
    from verify_spatial_structure import arithmetic_terms
    wanted = {}
    for label, sign in ((own,1),(reference,-1)):
        for term,coef in arithmetic_terms(graph,label,limit=350).items():
            key = tuple(sorted((*term,log2)))
            wanted[key] = wanted.get(key,0) + sign*coef
    assert exponent_polynomial(graph,ratio) == {term:coef for term,coef in wanted.items() if coef}


def bind_fields(graph, native, inputs, cycle, compact, mean_gauge):
    from verify_spatial_structure import arithmetic_terms
    left = inputs['input']
    results = []
    assert mean_gauge['ordinaryMeanResidual']['components'] == ['0'] * 3
    signed_roots = cycle['stages'][1]['roots']['velocity']
    for i, name in enumerate(('r','theta','z')):
        row = compact['componentRows'][i]
        old, latest, signed_full = left['initialized'][i], left['latest'][i], signed_roots[i]
        assert cycle['stages'][-1]['velocity'][i] == latest
        assert [latest,signed_full] == [row['postFiveRoot'],row['signedFullVelocity']]
        mean = first_level_other(graph,latest,signed_full)
        assert mean == row['retainedMeanIncrement']

        old_candidates = [x for x in graph.args(old,'add') if graph.record(x)['op']=='m3_aux_indexed_partial']
        old_wave, = old_candidates
        baseline = first_level_other(graph,old,old_wave)
        new_candidates = [x for x in graph.args(signed_full,'add')
                          if graph.record(x)['op']=='m3_coupled_indexed_partial']
        signed_wave, = new_candidates
        forced_full = first_level_other(graph,signed_full,signed_wave)
        forced_wave = first_level_other(graph,forced_full,baseline)
        gauge = inputs['wave']['indexed'][i]['root']
        ids = (old_wave,forced_wave,signed_wave,gauge)
        expected = (f'OriginalAll81InitialAngular_velocity_{i}',f'ActualForcedCurrent_velocity_{i}',
                    f'GenericSigned162_velocity_{i}',f'SpatialStage1Gauge_{i}')
        fields = [native.application(graph,x,label) for x,label in zip(ids,expected,strict=True)]
        original_params = fields[0][0]['parameters']
        assert all(defn['parameters'] == actual == original_params and orders == [0]*6
                  for defn,actual,orders in fields)
        U = inputs['normalizedRoots']['U'][i]
        exact_terms(graph,U,{(old_wave,):-1,(forced_wave,):1,(signed_wave,):1,(mean,):1},
                    {old_wave,forced_wave,signed_wave,mean,baseline})
        actual_mean_monomials = {(a,):Fraction(b) for a,b in row['temporalTerms']}
        actual_mean_monomials[(row['latestFiveIncrement'],)] = 1
        exact_terms(graph,mean,actual_mean_monomials,{key[0] for key in actual_mean_monomials})
        results.append({'component':name,'U':U,'initializedWave':old_wave,'forcedFullWave':forced_wave,
                        'signedWave':signed_wave,'sameUncancelledBaselineMatched':baseline,
                        'meanIncrement':mean,'gaugeField':gauge,
                        'gaugeDifference':inputs['gaugeDifferenceRootsForIndependentCheck'][i]})
    return results


def check_cover(graph, native, ingress, results, geometry):
    R,Z,T = (geometry[x] for x in ('R','Z','T'))
    Y = geometry['Y']
    theta = geometry['theta']
    local_params = native.fields[26]['rows'][0]['localParameters']
    ell_own,ell_ref = (local_params[i] for i in (3,7))
    log2 = 127
    two, = graph.args(log2,'log_positive')
    assert graph.rational(two) == 2
    h = geometry['h']
    srho = geometry['rho']
    row_signature = ('values','guards','derivativeMaps','coefficient','label')
    rows_seen = {}
    frozen_rows = []

    def checked_scaling(root,ratio):
        logratio, = [x for x in graph.args(next(iter(graph.args(root,'exp'))),'multiply')
                     if graph.record(x) == {'op':'log_positive','args':[ratio]}]
        expect_exp(graph,root,{(logratio,):Fraction(1,2),tuple(sorted((logratio,h))):1})
        return logratio

    for component in results:
        old,forced,signed,potential = [native.application(graph,component[key])[0]
             for key in ('initializedWave','forcedFullWave','signedWave','gaugeField')]
        assert all(definition['directions']==[R,Z,T,*Y,theta]
                   and len(definition['rows'])==162 for definition in (old,forced,signed,potential))
        definitions_by_id = {x['id']:x for x in native.expressions}
        force_signed_scalings = set()
        for defn in (forced,signed):
            for name in {row['localSystem'] for row in defn['rows']}:
                body = definitions_by_id[name]['body']
                factors = graph.args(body,'multiply')
                app, = [x for x in factors if graph.record(x)['op']=='m3_coupled_expression_partial']
                scale = scale_member(graph,body,app)
                checked_scaling(scale,srho)
                _,args,orders = native.application(graph,app)
                assert args == ingress['wave']['referenceArguments'] and orders == [0]*16
                force_signed_scalings.add(scale)
        assert len(force_signed_scalings)==1
        component['forcedAndSignedVelocityScale'] = next(iter(force_signed_scalings))

        for old_row,row,sign_row,gauge in zip(old['rows'],forced['rows'],signed['rows'],potential['rows'],strict=True):
            assert all([r[k] for k in row_signature] == [row[k] for k in row_signature]
                       for r in (sign_row,gauge))
            tags = row['label']
            assert all(tags[key]==old_row['label'][key]
                       for key in ('ell','grid','sign','key','countBoxOnce'))
            assert row['guards'] == old_row['guards'] and len(row['guards']) == 5
            key = (tags['key'],tags['sign'])
            signature = ([old_row[k] for k in row_signature],[row[k] for k in row_signature])
            if key in rows_seen:
                assert signature == rows_seen[key]
                continue
            rows_seen[key] = signature
            assert row['values'][:3] == [R,Z,T] and row['values'][3:7] == [tags['ell'],*tags['grid']]
            assert row['values'][7:10] == [ell_own,*Y] and row['values'][14:] == [theta,tags['fixedDifference']]
            assert all(row['derivativeMaps'][i] == [{'coefficient':1,'parameter':j}]
                       for i,j in enumerate((0,1,2,8,9,14)))
            assert row['coefficient'] == 1
            assert old_row['values'][3:7] == row['values'][3:7] and old_row['values'][9] == theta

            rho = scale_member(graph,old_row['values'][2],T)
            check_ratio(graph,rho,log2,tags['ell'],ell_own)
            lr = checked_scaling(old_row['coefficient'],rho)
            radial_scale = scale_member(graph,old_row['values'][0],R)
            assert graph.args(radial_scale,'sqrt_positive') == [rho]
            axial_scale = scale_member(graph,old_row['values'][1],Z)
            expect_exp(graph,axial_scale,{(lr,):Fraction(1,2),tuple(sorted((lr,h))):-1})
            for i,scale in enumerate((radial_scale,axial_scale,rho)):
                assert old_row['derivativeMaps'][i] == [{'coefficient':scale,'parameter':i}]
            frozen_rows.append({'key':tags['key'],'sign':tags['sign'],'rho':rho,
                                'ownLabel':tags['ell'],'fixedDifference':tags['fixedDifference']})
    assert len(frozen_rows) == 162
    return frozen_rows


def verify_reference_radial_operand(graph):
    R = 17732748
    phi0, a, dr, physical_r = 17745445,17745446,17734049,17734051
    unscaled_a, phi, lam_power = 17735154,17734062,17745444
    assert graph.args(phi0,'multiply') == [phi,lam_power]
    assert graph.args(a,'multiply') == [unscaled_a,lam_power]
    outer, = graph.args(phi,'exp')
    log_r = scale_member(graph,outer,dr)
    assert graph.args(log_r,'log_positive') == [physical_r]
    root_q = scale_member(graph,physical_r,R)
    assert graph.args(root_q,'sqrt_positive') == [17732740]
    exact_terms(graph,unscaled_a,{tuple(sorted((phi,dr,root_q,17735151))):1},
                {phi,dr,root_q,17735151})
    assert graph.args(17735151,'inverse') == [physical_r]
    power, = graph.args(lam_power,'exp')
    i0 = scale_member(graph,power,17734042)
    assert graph.args(17734042,'log_positive') == [17734041]
    assert i0 == 17745442
    return {'physicalRadius':physical_r,'unscaledRadialFast':unscaled_a,'aReference':a,
            'phiReference':phi0,'referenceCommonIndex':i0,'lambda':17734041,'radialDirection':[1,17733068]}


def check_palette_differences(graph, cover):
    ell, base_ell, own_index, common_index = 17732737,17745432,17733022,17745442
    common_factors = (17733018,156007,127)
    exact_terms(graph,base_ell,{(ell,):1,():-2})

    def shape(root, substitute=False):
        if root == replacement or (substitute and root == ell):
            return ('boundLabel',replacement)
        if root in common_factors:
            return ('fixed',root)
        row = graph.record(root)
        op,args = row['op'],row['args']
        if op in ('rational','source_parameter','coordinate'):
            return (op,*args)
        assert op in ('add','multiply','ceiling','log_positive'), (root,op)
        children = [shape(child,substitute) for child in args]
        if op in ('add','multiply'):
            children.sort(key=repr)
        return (op,*children)

    replacement = base_ell
    assert shape(own_index,True) == shape(common_index)
    found = {}
    for row in cover:
        label,delta = row['ownLabel'],row['fixedDifference']
        if label in found:
            assert found[label]['delta'] == delta
            continue
        own_root = first_level_other(graph,delta,17750794)
        assert graph.args(17750794,'multiply') == [20,common_index]
        replacement = label
        assert shape(own_index,True) == shape(own_root), (label,delta)
        found[label] = {'ownPaletteIndex':own_root,'delta':delta}

    a_own,unscaled,power = 17735155,17735154,17734059
    assert graph.args(a_own,'multiply') == [power,unscaled]
    exponent, = graph.args(power,'exp')
    assert set(graph.args(exponent,'multiply')) == {own_index,17734042}
    return {
        'samePhiDerivativeWithoutPalette':unscaled,'aOwn':a_own,
        'ownFormalPaletteIndex':own_index,'referenceIndex':common_index,
        'threeExactRowPaletteDifferences':found,
        'rule':'delta = i(ell_own) - i(ell_ref-2) on every row',
        'radialTransfer':'a_ref(R_ref) = sqrt(rho) * a_own(sqrt(rho)*R_ref) / Lambda^delta',
        'analyticPremises':['R_ref>0 and Q_ref,Q_own,Lambda>0',
            'same original physical radius sqrt(Q_ref)*R_ref=sqrt(Q_own)*R_own',
            'freeze label and palette values when taking spatial derivatives'],
    }


def check_initialized_lift(graph, native, ingress):
    from verify_repaired_first_force import Exact

    templates = {(row['sign'],int(row['key'].split(':')[0])):row
                 for row in ingress['wave']['perTemplate']}
    original = native.aux_fields[6]['rows']
    expanded = native.fields[9]['rows']
    assert len(templates) == 10 and len(original) == len(expanded) == 162

    class LiftAlgebra(Exact):
        def __init__(self, delta, selected, mapping):
            super().__init__(graph)
            self.delta = delta
            self.selected = selected
            self.mapping = mapping
            self.fixed = frozenset(mapping.values())
            self.atoms = {}
            self.values = {}

        def atom(self, key):
            ident = self.atoms.setdefault(key, len(self.atoms)+1)
            return {((ident,1),):Fraction(1)}

        def signature(self, value):
            return tuple(sorted(value.items()))

        def term(self, root, side):
            request = (root,side)
            if request not in self.values:
                self.values[request] = self.expand(root,side)
            return self.values[request]

        def expand(self, root, side):
            if side == 'template' and root in self.mapping:
                root = self.mapping[root]
            row = graph.record(root)
            op,args = row['op'],row['args']
            if op == 'rational':
                return self.scalar(graph.rational(root))
            if root in self.fixed:
                return self.atom(('fixed',root))
            term = lambda child: self.term(child,side)
            if op == 'add':
                return self.add(*(term(child) for child in args))
            if op == 'multiply':
                return self.mul(*(term(child) for child in args))
            if op == 'inverse':
                return self.inv(term(args[0]))
            if op == 'integer_power':
                return self.pow(term(args[0]),args[1])
            if op == 'smooth_piecewise' and args[0] == self.delta and side == 'original':
                left,right,below,inside,above = args[1:]
                lo,hi = graph.rational(left),graph.rational(right)
                assert self.selected != lo and self.selected != hi
                return term(below if self.selected<lo else above if self.selected>hi else inside)
            if op in ('exp','log_positive','sqrt_positive','ceiling'):
                return self.atom((op,self.signature(term(args[0]))))
            return self.atom(('sameSourceRecord',root))

    checked = 0
    wrong_case_detected = False
    for old,row in zip(original,expanded,strict=True):
        tag = row['label']
        old_xi,old_v = old['values'][7:9]
        actuals = [*old['values'][:3],*row['values'][3:]]
        mapping = dict(zip(row['localParameters'],actuals,strict=True))
        for delta in range(5):
            selected = templates[tag['sign'],delta]
            scope = LiftAlgebra(tag['fixedDifference'],delta,mapping)
            match = [scope.term(old_root,'original')==scope.term(selected[key],'template')
                     for old_root,key in ((old_xi,'transverse'),(old_v,'pulse'))]
            assert match == [True,True], (tag['key'],tag['sign'],delta,match)
            checked += len(match)
            if not wrong_case_detected and delta == 0:
                wrong = templates[tag['sign'],1]
                wrong_case_detected = scope.term(old_xi,'original') != scope.term(wrong['transverse'],'template')
    assert checked == 1620 and wrong_case_detected
    return {'exactFormalActualLiftCoordinates':checked,'guardedRows':162,
            'branchIntegers':[0,1,2,3,4],'rejectedBorrowedLiftBranch':wrong_case_detected,
            'scope':'Original initial xi and v agree with the same actual preimage in the new local chart on each fixed integer branch. No boundary jets are inferred.'}


def check_actual_initialized_subtraction(graph, native, ingress, forced):
    from functools import cache
    from verify_repaired_first_force import Exact,harmonic_terms

    class GraphAdapter:
        args = graph.args
        @staticmethod
        def node(index):
            row = graph.record(index)
            return row['op'],row['args']

    forced_guards = {case['key']:case['guards'] for case in forced['cases'] if case['mode']==1}
    assert len(forced_guards)==10
    original = GraphAdapter()
    algebra = Exact(original)
    declarations = {d['name']:d for d in native.expressions}
    bindings = {}
    for j in range(3):
        for row in native.aux_fields[6+j]['rows']:
            tag = row['label']['sign']
            old = (row['localBody'],row['localParameters'])
            assert bindings.setdefault((j,tag),old) == old

    controls = 0
    complete = 0
    note_rows = []
    for template in ingress['wave']['perTemplate']:
        delta = int(template['key'].split(':')[0])
        sign = template['sign']
        xi,v,phase,k = (template[x] for x in ('transverse','pulse','phase','k'))
        for j in range(3):
            atoms = {}
            def semantic_atom(*key):
                index = atoms.setdefault(key,len(atoms)+1)
                return {((index,1),):Fraction(1)}

            @cache
            def norm(index, alias_old):
                if alias_old and index in (17733037,17732751):
                    return norm({17733037:xi,17732751:v}[index],False)
                op,args = graph.record(index).values()
                child = lambda root: norm(root,alias_old)
                if op == 'rational':
                    return algebra.scalar(graph.rational(index))
                if op == 'add':
                    return algebra.add(*(child(x) for x in args))
                if op == 'multiply':
                    return algebra.mul(*(child(x) for x in args))
                if op == 'inverse':
                    return algebra.inv(child(args[0]))
                if op == 'integer_power':
                    return algebra.pow(child(args[0]),args[1])
                if op in ('exp','log_positive','sqrt_positive','ceiling','source_step_derivative'):
                    return semantic_atom(op,tuple(sorted(child(args[0]).items())),*args[1:])
                if op in ('actual_expression_partial','m3_aux_expression_partial',
                          'm3_global_pulse_jet','m3_coupled_expression_partial'):
                    name,actual,orders = args
                    frozen = tuple(tuple(sorted(child(x).items())) for x in actual)
                    order = tuple(orders) if isinstance(orders,list) else orders
                    return semantic_atom(op,name,frozen,order)
                return semantic_atom('sameSourceRecord',index)

            old_root, old_formals = bindings[j,sign]
            assert old_formals[7:9] == [17733037,17732751]
            branches = []
            for _ in range(7):
                cond,lo,hi,below,inside,above = graph.args(old_root,'smooth_piecewise')
                assert below == above == 0
                branches.append((cond,lo,hi))
                old_root = inside
            assert [row[0] for row in branches[-2:]] == old_formals[7:9]
            for old_guard, new_guard in zip(branches,forced_guards[template['key']],strict=True):
                assert [norm(old_operand,True) for old_operand in old_guard] == [
                    norm(new_operand,False) for new_operand in new_guard]
            desired_angle = algebra.mul(norm(k,False),norm(phase,False))
            terms = {'cosine':[],'sine':[]}
            count = 0
            for op,angle,coefficient,orientation in harmonic_terms(original,old_root):
                count += 1
                signed_angle = norm(angle,True)
                same = signed_angle == desired_angle
                opposite = signed_angle == algebra.neg(desired_angle)
                assert same != opposite, (template['key'],j,'phase alias')
                orient = -orientation if op=='sine' and opposite else orientation
                terms[op].append(algebra.mul(algebra.scalar(orient),norm(coefficient,True)))
            assert count == 4 and all(len(parts)==2 for parts in terms.values())
            parents = []
            for kind, op, orientation in (('real','cosine',2),('imaginary','sine',-2)):
                name = f'InitializedOriginalWave_{delta}_{sign}_{j}_{kind}'
                definition = declarations[name]
                expected = algebra.mul(algebra.scalar(orientation),norm(definition['body'],False))
                actual = algebra.add(*terms[op])
                assert actual == expected, (template['key'],j,kind)
                parents.append(definition['id'])
                complete += 1
                if actual and actual != algebra.neg(expected):
                    controls += 1
            note_rows.append({'key':template['key'],'component':j,'initialHarmonics':old_root,
                              'subtractedNativeCoefficientDefinitions':parents,
                              'localGuardCount':len(branches)})
            norm.cache_clear()
            algebra.inverse_atoms.clear()
    assert complete == 60 and controls > 0
    return {'initialCarrierCoefficientsProvedIdentical':complete,
            'rejectedSignMutationExamples':controls,'sameLocalGuardPredicates':7*len(note_rows),'cases':note_rows,
            'scope':'The coefficients removed for first Forced are exactly the original initialized nonzero wave after the original xi and pulse substitution.'}


def check_wave_derivative_slots(graph,native,ingress,geometry,epsilon,radial):
    from verify_spatial_structure import arithmetic_terms
    prefix = 'SpatialStage1Gauge_'
    fields = [native.application(graph,recd['root'])[0] for recd in ingress['wave']['indexed']]
    key_to_component = {f['id']:i for i,f in enumerate(fields)}
    a = radial['aReference']
    vr1 = radial['radialDirection'][1]
    inv_R = 17733137
    assert graph.args(inv_R,'inverse') == [geometry['R']]
    assert graph.record(vr1) == {'op':'add','args':[1,17733067]}
    assert graph.record(17733067) == {'op':'multiply','args':[20,3622]}
    assert graph.record(3622) == {'op':'sqrt_positive','args':[24]}

    def d(slot):
        return tuple(int(i==slot) for i in range(6))

    for component,row in enumerate(ingress['normalizedRoots']['G_A']):
        for direction,root in enumerate(row):
            seen = {}
            for monomial,value in arithmetic_terms(graph,root,{a,vr1,epsilon,inv_R},limit=350).items():
                apps = [i for i in monomial if graph.record(i)['op']=='m3_coupled_indexed_partial'
                        and graph.record(i)['args'][0] in key_to_component]
                if not apps:
                    continue
                wave, = apps
                definition,actual,orders = native.application(graph,wave,zero_order=False)
                index = key_to_component[definition['id']]
                assert definition['name']==prefix+str(index) and actual==definition['parameters']
                factors = tuple(i for i in monomial if i!=wave)
                signature = (index,tuple(orders),factors)
                assert signature not in seen
                seen[signature] = value
            if direction == 0:
                wanted = {(component,d(0),()):1,(component,d(3),(a,)):1,
                          (component,d(4),tuple(sorted((a,vr1)))):1}
            elif direction == 1:
                wanted = {(component,d(5),(inv_R,)):1}
                if component < 2:
                    wanted[(1-component,(0,)*6,(inv_R,))] = -1 if component==0 else 1
            else:
                wanted = {(component,d(1),(epsilon,)):1}
            assert seen == wanted, (component,direction)
    return {'matchedAllWaveGradientComponents':9,'matchedFirstOrderSlots':['R','Z','Y0','Y1','theta'],
            'actualPeriodicApplicationArity':7,'frozenDirections':6,'keptPolarConnections':2,
            'assumesNativeDifferentiationOnSmoothGuardBranches':True}


def check_fast_lift_chain(graph,ingress,geometry):
    from functools import cache
    from verify_repaired_first_force import Exact

    class Shape:
        @staticmethod
        def node(index):
            r = graph.record(index)
            return r['op'],r['args']

    alg = Exact(Shape())
    Y = geometry['Y']
    vr = [alg.one,alg.of(17733068)]
    lam = alg.of(17734041)
    assert graph.args(3622,'sqrt_positive') == [24] and graph.rational(24) == 2

    @cache
    def derivative(root,axis):
        if root in Y:
            return alg.scalar(int(root==axis))
        op,args = graph.record(root).values()
        if root < min(Y) or op in ('coordinate','rational','source_parameter'):
            return alg.zero
        if op == 'add':
            return alg.add(*(derivative(child,axis) for child in args))
        assert op == 'multiply', (root,op)
        return alg.add(*(alg.mul(derivative(child,axis),
                         *(alg.of(other) for j,other in enumerate(args) if j!=i))
                         for i,child in enumerate(args)))

    def exact_zero(poly):
        reduced = alg.clear_compound_denominators(poly)
        return not alg.reduce_sqrt_two(reduced,3622)

    normalized_slow = {geometry[key] for key in ('R','Z','T','theta')}

    @cache
    def independent_of_slow(root):
        if root in normalized_slow:
            return False
        if root < min(normalized_slow):
            return True
        op,args = graph.record(root).values()
        if op in ('coordinate','rational','source_parameter'):
            return True
        assert op in ('add','multiply','inverse','exp','log_positive','sqrt_positive','ceiling'), (root,op)
        return all(independent_of_slow(child) for child in args)

    witness = []
    for row in ingress['wave']['perTemplate']:
        delta = int(row['key'].split(':')[0])
        xi,v = row['transverse'],row['pulse']
        assert independent_of_slow(xi) and independent_of_slow(v)
        on = lambda root: alg.add(*(alg.mul(b,derivative(root,y)) for y,b in zip(Y,vr,strict=True)))
        assert exact_zero(alg.sub(on(xi),alg.pow(lam,delta))), row['key']
        assert exact_zero(on(v)), row['key']
        witness.append({'key':row['key'],'xi':xi,'v':v,'delta':delta})
    assert len(witness)==10
    return {'exactYDerivativeIdentities':20,'cases':witness,
        'identities':['L(xi)=Lambda^delta','L(v)=0'],
        'frozenCenterAndNearestCopy':True,
        'zeroOrdinarySlowAndAngularLiftPartials':80,
        'denominatorCondition':'Original positive Dgeom and own pulse time coefficient.'}


def main():
    cli = ArgumentParser(description=__doc__)
    for f in ('reader','artifact','compact','ordinary-mean','five-whole','forced-local','scratch','out'):
        cli.add_argument('--'+f,type=Path,required=True)
    cli.add_argument('--cache',type=Path)
    cli.add_argument('--cache-module',type=Path)
    args = cli.parse_args()
    sys.path[:0] = [str(args.reader),str(args.reader.parents[2]/'first-force-repair')]
    from source_stream import Native,SourceStream,read,MANIFEST
    from verify_spatial_structure import verify_registered_wave,verify_roots,direct_derivative

    src = args.artifact/'first-correction-spatial-source'
    manifest,_ = read(src/MANIFEST,MANIFEST_PIN)
    ingress,_ = read(args.artifact/'first-correction-spatial-ingress.json',INGRESS_PIN)
    cycle,_ = read(args.artifact/'first-cycle.json',CYCLE_PIN)
    compact,_ = read(args.compact,COMPACT_PIN)
    mean,_ = read(args.ordinary_mean,MEAN_PIN)
    five,_ = read(args.five_whole,FIVE_PIN)
    forced,_ = read(args.forced_local,'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b')
    assert mean['hostedRun']==RUN==five['githubRun']
    assert five['actualRoots']['whole']==ingress['input']['fiveWhole']
    assert five['sourceStream']['sha256']==manifest['node_stream_sha256']
    native = Native(src,manifest)
    @contextmanager
    def open_graph():
        if args.cache is None:
            with SourceStream(src,manifest,22153782,args.scratch) as graph:
                yield graph
        else:
            assert args.cache_module is not None
            sys.path.insert(0,str(args.cache_module))
            import source_cache,source_stream
            graph = source_cache.load(source_stream,src,manifest,22153782,args.cache)
            try:
                yield graph
            finally:
                graph.__exit__()

    with open_graph() as graph:
        geom,sign_owners = verify_registered_wave(graph,native,ingress)
        original = verify_roots(graph,native,ingress,cycle,geom)
        deriv = direct_derivative(graph,native,ingress,geom)
        fields = bind_fields(graph,native,ingress,cycle,compact,mean)
        cover = check_cover(graph,native,ingress,fields,geom)
        radial = verify_reference_radial_operand(graph)
        candidate_derivatives = check_wave_derivative_slots(graph,native,ingress,geom,deriv['epsilon'],radial)
        palette = check_palette_differences(graph,cover)
        initial_lift = check_initialized_lift(graph,native,ingress)
        fast_lift = check_fast_lift_chain(graph,ingress,geom)
        initial_subtraction = check_actual_initialized_subtraction(graph,native,ingress,forced)
        result = {
            'schema':'MathScope.N7.ActiveN3FirstWaveRootDecomposition/1',
            'status':'VERIFIED_SAME_LIVE_FIRST_CORRECTION_WAVE_DISCREPANCY_DECOMPOSITION',
            'run':RUN,'stream':graph.verify,'ingressSHA256':INGRESS_PIN,
            'originalVelocityAssembly':fields,'sameGuardedCoverRows':len(cover),
            'referenceRatios':sorted({row['rho'] for row in cover}),
            'referenceRadial':radial,'referenceEpsilon':deriv['epsilon'],
            'paletteRadialScale':palette,'initialLiftPullback':initial_lift,
            'initialSubtraction':initial_subtraction,'waveGradientBindings':candidate_derivatives,
            'fastLiftChain':fast_lift,
            'assemblyChecking':original,
            'exactRemainingDiscrepancy':'UForcedFullWave - UInitialWave + USignedWave - Curl(AWave)',
            'sameRawAndCompactFiveMapOnChart': True,
            'meanCancellationOnAdmittedCharts':'CONDITIONAL_ON_C78_ORDINARY_CALCULUS',
            'fixedLabelLiftAndWaveCurl':'SEPARATE_CHECK',
            'guardClassicalSeams':'OPEN',
            'stage1UniformWeightedCaps':'OPEN',
            'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD',
        }
    with args.out.open('x',encoding='utf-8',newline='\n') as sink:
        json.dump(result,sink,indent=2)
        sink.write('\n')
    print(result['status'],len(fields),len(cover))


if __name__ == '__main__':
    assert __debug__
    main()
