"""Read exact angle dependence of the archived first-cycle mean roots."""
from argparse import ArgumentParser
from collections import Counter
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

adjacent = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(adjacent / 'flat'), str(adjacent / 'cycle')]
from bind_forced_cutoffs import Archive, GRAPH_SHA, REGISTRY_SHA, PRODUCER_COMMIT, git_blob, pinned_json
from group_postfive_residual import children

R, Z, T, ELL, Y1, Y2, THETA = 622802, 622803, 622804, 622791, 635044, 635045, 622806
MEAN = {R, Z, T, ELL, Y1, Y2}
ENVELOPE = [633710, 633712]
INV_R, INV_R2, CHI, D_CHI = 623135, 634023, 633733, 633761
MINUS = 20
RUN_SHA = '615cdb54c6a7645e0664396557fb83fc9b76b8b6d8e9005e220fb1834f4aeed7'


def flatten(items):
    for item in items:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            assert type(item) is int
            yield item


class Scope:
    """A conservative free-coordinate bound, including source-native bodies."""
    def __init__(self, graph, snapshot):
        self.graph = graph
        self.coupled = json.loads(snapshot['definitions'])
        aux = snapshot['base']
        self.aux = [json.loads(aux[name]) for name in ('expressionDefinitions','fieldDefinitions','inverseDefinitions')]
        base = aux['base']
        self.base = {name:json.loads(base[name]) for name in
                     ('expression','monotone','quadratic','picard','m3GlobalFields','m3GlobalPulses')}
        self.covariance = {}
        for pulse in self.base['m3GlobalPulses']:
            embedded = json.loads(pulse['originalDefinition'])
            for key in ('variable','parameters','matrix','initial','length'):
                assert embedded[key] == pulse[key]
            self.covariance[pulse['covariance']] = embedded
        self.scope_kinds = Counter()
        self.operators = Counter()
        self.values = {}

    @staticmethod
    def scoped(body_roots, params, actual, extra_bound=()):
        assert len(params) == len(set(params)) == len(actual)
        return [(tuple(actual), frozenset()),
                (tuple(body_roots), frozenset(params) | frozenset(extra_bound))]

    def definition(self, key, kind):
        if isinstance(key, str):
            prefix, index = key.split(':')
            if prefix == 'forced-expression':
                assert kind == 0
                item = self.coupled[4][int(index)]
            else:
                assert prefix == ['coupled-expression','coupled-field','coupled-inverse'][kind]
                item = self.coupled[kind][int(index)]
            assert item['id'] == key
            return item
        if kind == 0 and key >= 0:
            return self.base['expression'][key]
        return self.aux[kind][-key-1 if kind == 0 else key]

    @cache
    def field_plan(self, op, key):
        field = self.base['m3GlobalFields'][key] if op == 'm3_global_indexed_partial' else self.definition(key,1)
        groups = []
        params = frozenset(field['parameters'])
        for row in field['rows']:
            local = self.definition(row['localSystem'],0)
            assert row['localBody'] == local['body']
            formals = row.get('localParameters',local['parameters'])
            assert formals == local['parameters']
            assert len(formals) == len(set(formals)) == len(row['values'])
            groups.append(((local['body'],), frozenset(formals) | params))
            actual = [*row['values'],row['coefficient'], *flatten(row.get('guards',[])),
                      *row.get('derivativeScales',[]),
                      *(m['coefficient'] for group in row.get('derivativeMaps',[]) for m in group)]
            groups.append((tuple(actual),params))
            self.scope_kinds['indexedRow'] += 1
        return groups, field['parameters']

    def plan(self, i):
        op, a = self.graph.node(i)
        self.operators[op] += 1
        def plain(items): return [(tuple(items),frozenset())]
        if op == 'coordinate':
            return []
        if op == 'definite_integral':
            body, bound, left, right = a
            assert self.graph.node(bound)[0] == 'coordinate'
            self.scope_kinds['integralBodyOnly'] += 1
            return plain([left,right]) + [((body,),frozenset([bound]))]
        if op.endswith('expression_partial'):
            key, actual, orders = a
            d = self.definition(key,0)
            assert len(orders) == len(actual)
            self.scope_kinds['expression'] += 1
            return self.scoped([d['body']], d['parameters'], actual)
        if op.endswith('indexed_partial'):
            key, actual, _ = a
            field_groups, params = self.field_plan(op,key)
            assert len(params) == len(actual)
            self.scope_kinds['indexedCall'] += 1
            return plain(actual) + field_groups
        if op.endswith('inverse_partial'):
            key, actual, _ = a
            d = self.definition(key,2)
            assert set(d['Y']) <= set(d['parameters'])
            self.scope_kinds['twoTorusInverse'] += 1
            return self.scoped([d['body']],d['parameters'],actual)
        if op in ('m3_forced_pulse_partial','m3_global_pulse_jet','actual_covariance_volterra'):
            if op == 'm3_forced_pulse_partial':
                key, _, _, time, actual, _ = a
                d = self.coupled[3][key]
                bodies = [*(v for pair in d['forcing'] for v in pair.values()),
                          *(v for pair in d['initial'] for v in pair.values()),d['left']]
            else:
                key, _, time, actual = a[:4]
                d = self.base['m3GlobalPulses'][key] if op == 'm3_global_pulse_jet' else self.covariance[key]
                bodies = [*d['initial'],d.get('left',0)]
            bodies += [*flatten(d['matrix']),d['length']]
            self.scope_kinds['pulse'] += 1
            return self.scoped(bodies, d['parameters'],actual,[d['variable']]) + plain([time])
        if op == 'actual_monotone_root':
            key, *actual = a
            d = self.base['monotone'][key]
            self.scope_kinds['monotone'] += 1
            return self.scoped([d[k] for k in ('body','left','right','derivativeLower','derivativeUpper')],
                               d['parameters'],actual,[d['variable']])
        if op == 'actual_quadratic_root':
            d = self.base['quadratic'][a[0]]
            self.scope_kinds['quadratic'] += 1
            return plain([a[2],*flatten(d['rhs']),*flatten(d['linear']),
                          *flatten(d['quadraticDiagonal']),d['scale']])
        if op in ('actual_background_even_profile','actual_background_picard'):
            d = self.base['picard'][a[0]]
            self.scope_kinds['backgroundPicard'] += 1
            return self.scoped(list(flatten([d[k] for k in ('A0','A1','forcing')])),
                               [d['xi'],d['eta']], a[2:4])
        return plain(children(op,a))

    def free(self, root):
        if root in self.values:
            return self.values[root]

        def frame(i):
            groups=self.plan(i)
            return i,groups,iter(r for refs,_ in groups for r in refs)

        stack=[frame(root)]
        while stack:
            i,groups,children=stack[-1]
            for child in children:
                assert child < i, (i, child, self.graph.node(i))
                if child not in self.values:
                    stack.append(frame(child))
                    break
            else:
                if self.graph.node(i)[0] == 'coordinate':
                    result=frozenset([i])
                else:
                    result=frozenset().union(*(self.values[r]-bound for refs,bound in groups for r in refs))
                self.values[i]=result
                stack.pop()
        return self.values[root]


def compact(graph, root, weight=None):
    """Read literal I(R)-chi*I(Rout), with the original fixed envelope."""
    if weight is not None:
        factor = INV_R if weight == 1 else INV_R2
        assert graph.op(root,'multiply')[0] == factor
        root = graph.op(root,'multiply')[1]
    left, negative = graph.op(root,'add')
    assert graph.op(negative,'multiply')[0] == MINUS
    product = graph.op(negative,'multiply')[1]
    assert graph.op(product,'multiply')[0] == CHI
    whole = graph.op(product,'multiply')[1]
    body, binder, r0, r1 = graph.op(whole,'definite_integral')
    assert [r0,r1] == ENVELOPE
    assert graph.op(left,'definite_integral') == [body,binder,r0,R]
    return left,whole,binder


def classify(graph, snapshot, run):
    scope = Scope(graph,snapshot)
    assert run['executing_commit'] == PRODUCER_COMMIT
    assert run['first_fivemap_graph_replay_manifest']['node_stream_sha256'] == GRAPH_SHA
    assert run['first_fivemap_graph_replay_manifest']['definitions_sha256'] == REGISTRY_SHA
    assert run['post_signed_exact_inverse_AST_private_source_checked']
    assert run['post_signed_five_map_mean_source_AST_checked']
    assert run['real_original_latest_cor85_stress_seal_issued']
    assert run['post_signed_exact_inverse_roots'] == [4311889,4360116]
    assert run['post_signed_updated_mean_PJ'] == [4417989,4418052,4418111]
    assert run['post_signed_five_map_fresh_PJ'] == [4418702,4418769,4418830]

    roots = {}
    names = ['beta','v','gamma']
    base_velocity = [622934,634588,622933]
    baseline = [3614790,3614791,3614792]
    forced_waves = [4159737,4159788,4159839]
    signed_waves = [4191848,4191899,4191950]
    old = [4192750,4192751,4192752]
    increments = [4419692,4419694,4419696]
    latest_mean = [4418439,4418440,4418441]
    pre_five = [4417494,4417495,4417496]
    temporal_inc = [4417421,4417272,4417430]
    five_inc = [4418438,4418416,4418420]
    final = run['post_five_full_three_dimensional_velocity_roots']
    assert final == [4419697,4419698,4419699]
    for j,name in enumerate(names):
        assert graph.op(final[j],'add') == [old[j],increments[j]]
        forced_state, signed_wave = graph.op(old[j],'add')
        assert signed_wave == signed_waves[j]
        bg_and_init, forced_wave = graph.op(forced_state,'add')
        assert forced_wave == forced_waves[j]
        assert graph.op(bg_and_init,'add') == [base_velocity[j],baseline[j]]
        current, negative = graph.op(increments[j],'add')
        assert current == latest_mean[j] and graph.op(negative,'multiply') == [MINUS,baseline[j]]
        assert graph.op(latest_mean[j],'add') == [pre_five[j],five_inc[j]]
        assert graph.op(pre_five[j],'add') == [baseline[j],temporal_inc[j]]
        system, actual, order = graph.op(five_inc[j],'m3_coupled_expression_partial')
        d=scope.definition(system,0)
        assert d['name'] == 'PostSignedFiveBump_'+name and d['parameters'] == actual == [ELL,R,Z,T] and not any(order)
        roots.update({f'background_{name}':base_velocity[j],f'baseline_{name}':baseline[j],
                      f'temporalIncrement_{name}':temporal_inc[j],f'fiveIncrement_{name}':five_inc[j],
                      f'postTemporalMean_{name}':pre_five[j],f'postFiveMean_{name}':latest_mean[j],
                      f'netMeanIncrement_{name}':increments[j]})
    for j,inverse in enumerate(run['post_signed_exact_inverse_roots']):
        system, actual, order = graph.op(inverse,'m3_coupled_inverse_partial')
        d = scope.definition(system,2)
        assert d['body'] == [4193097,4193099][j]
        assert d['parameters'] == actual == [R,Z,T,ELL,Y1,Y2] and not any(order)
        assert d['Y'] == [Y1,Y2]
        roots[f'temporalInverse_{j}'] = inverse
        roots[f'centeredTemporalSource_{j}'] = d['body']

    # Actual temporal T1 primitive and its retained A1 cutoff.
    d=scope.definition('coupled-expression:1297',0)
    assert d['name']=='afterActualSigned162_actual_meridional_potential'
    assert d['body']==4417417 and d['parameters']==[ELL,R,Z,T,Y1,Y2]
    left,whole,_=compact(graph,d['body'],1)
    assert (left,whole)==(4417313,4417314)
    dchi=graph.op(4417444,'multiply')
    assert dchi[0]==INV_R and graph.op(dchi[1],'multiply')==[D_CHI,whole]
    roots.update({'temporalT1Potential':4417418,'temporalT1Whole':whole,'temporalT1A1':4417444})

    # Corollary 8.5 uses the actual after-Forced mean, not the old target.
    for j,(weight,body,cutoff,root) in enumerate([(2,4160782,4160784,4162314),(1,4161581,4161583,4162315)]):
        system,actual,order=graph.op(root,'m3_coupled_expression_partial')
        d=scope.definition(system,0)
        assert d['name']==f'ActualLatestMeanSigma_after-forced_{j}'
        assert d['parameters']==actual==[ELL,R,Z,T] and not any(order)
        assert d['body']==body
        neg,potential=graph.op(body,'multiply')
        assert neg==MINUS
        _,whole,_=compact(graph,potential,weight)
        assert whole==[4160777,4161576][j]
        fac,product=graph.op(cutoff,'multiply')
        assert fac==[INV_R2,INV_R][j] and graph.op(product,'multiply')==[D_CHI,whole]
        roots.update({f'cor85Sigma_{j}':root,f'cor85WeightedWhole_{j}':whole,f'cor85Cutoff_{j}':cutoff})
    roots.update({'signedAmplitude_0':4162328,'signedAmplitude_1':4162329})

    # The actual FiveMap uses the unmodified primitive; the compact candidate
    # is separate until its whole integral vanishes by the source proof.
    assert graph.op(4418427,'multiply') == [INV_R,4418425]
    left,whole,_=compact(graph,4418431,1)
    assert (left,whole)==(4418425,4418426)
    assert 4418426 not in graph.explicit_reach([4418427])
    roots.update({'fiveUsedPsi':4418427,'fiveCompactCandidatePsi':4418431,'fiveWeightedWhole':whole})
    for j, root in enumerate([4419372,4419429,4419474,4419668]):
        body,binder,lo,hi=graph.op(root,'definite_integral')
        assert [lo,hi]==ENVELOPE and 'PostSignedFiveRemainder_whole_radial' in graph.op(binder,'coordinate')[0]
        roots[f'fiveMeanRemainderRadialTerm_{j}']=root

    # Independently check the original mean pressure A0 nodes by cutoff form.
    mean_pressure = [('Forced',3890611,3890612,3890455),('Signed',4192712,4192713,4192556),
                     ('Temporal',4418325,4418326,4418169),('Five',4419044,4419045,4418888)]
    for name,value,A0,whole in mean_pressure:
        assert compact(graph,value)[1]==whole
        assert graph.op(A0,'multiply')==[D_CHI,whole]
        roots.update({f'meanPressure{name}':value,f'meanPressure{name}Whole':whole,f'meanPressure{name}A0':A0})
    pressure=run['post_five_full_three_dimensional_pressure_root']
    assert graph.op(pressure,'add')==[4192756,4419701]
    new,oldneg=graph.op(4419701,'add')
    assert new==4419044 and graph.op(oldneg,'multiply')==[MINUS,4192712]
    roots['postFiveMeanPressureDelta']=4419701

    # Source stress roots used by the complete angular mean.
    for name, root in [('theta',633815),('z',633863)]:
        roots['fullOriginalStress_'+name]=root

    # Generic signed weights bind the three representative formals later.
    # Their actual replacements use only frozen mesh and band coordinates.
    representative = {622807:623950,622808:623955,622809:623935}
    frozen = {ELL,623855,623856,623857}
    assert all(scope.free(root)<=frozen for root in representative.values())
    classified = {}
    for name, root in roots.items():
        found=scope.free(root)
        available = MEAN | set(representative) if name.startswith('signedAmplitude_') else MEAN
        assert found <= available, (name,root,sorted(found-available))
        classified[name]={'node':root,'freeCoordinatesUpperSet':sorted(found),'physicalThetaIndependent':True}
        if name.startswith('signedAmplitude_'):
            classified[name]['representativeFormalToActual']=representative
    # A genuine wave still carries the physical angle through its actual map.
    controls = {str(root): THETA in scope.free(root) for root in [*forced_waves,*signed_waves]}
    assert all(controls.values())
    return classified,controls,dict(sorted(scope.scope_kinds.items())),dict(sorted(scope.operators.items()))


def pins(repo):
    files = {
        'research-ide/mathscope-m3/post-signed-20261023/source-signed-actual-temporal-inverse.mjs':[
            'parameters=[R,Z,T,ell,...Y]', 'velocity:updatedVelocity'],
        'research-ide/mathscope-m3/post-signed-20261023/source-signed-actual-five-map.mjs':[
            'psi=G.div(primitive,R),compactPsi=', 'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))'],
        'research-ide/mathscope-m3/post-signed-20261023/source-postfive-full-3d-residual.mjs':[
            'G.sub(latestMean[n],baseline[n])','G.add(old.fullPressure,pressureDelta)'],
        'research-ide/mathscope-m3/navier/source-temporal-potential.mjs':[
            'cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)'],
        'research-ide/mathscope-m3/navier/source-updated-mean-pressure.mjs':[
            'A0=G.mul(G.derivative(chi,R),integrals.whole)'],
        'research-ide/mathscope-m3/navier/source-updated-mean-stress.mjs':[
            'cutoff=G.div(G.mul(G.derivative(chi,R),total),G.pow(R,weight))'],
        'research-ide/mathscope-m3/navier/source-global-updated-mean-stress.mjs':[
            'rawWeightedSourceWhole:row.integrals.whole,rawCutoffRemainder:row.cutoffRemainder',
            "kind:'after-forced',mean,G:forced.G"],
        'research-ide/mathscope-m3/navier/source-global-angular.mjs':[
            'oldFlat=[{m:0,value:base.conservativeResidual.map'],
    }
    result={}
    for path, needles in files.items():
        data=git_blob(repo,PRODUCER_COMMIT,path)
        assert all(x.encode() in data for x in needles),path
        result[path]=sha256(data).hexdigest()
    return result


def main():
    p=ArgumentParser(description=__doc__)
    for key in ('repo','graph','registry','run','out'):
        p.add_argument('--'+key,type=Path,required=True)
    a=p.parse_args()
    assert __debug__
    snapshot=pinned_json(a.registry,REGISTRY_SHA)
    run=pinned_json(a.run,RUN_SHA)
    with TemporaryFile() as backing:
        graph=Archive(a.graph,backing)
        classified,controls,scope_counts,operators=classify(graph,snapshot,run)
    result={'schema':'MathScope.N6.ArchivedFirstCycleMeanScope/1',
            'verdict':'VERIFIED_ACTUAL_MEAN_AND_CUTOFF_ROOTS_PHYSICAL_THETA_INDEPENDENT',
            'sourceCommit':PRODUCER_COMMIT,'graphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,
            'hostedRunSHA256':RUN_SHA,'producerSourceSHA256':pins(a.repo),
            'theta':THETA,'meanCoordinates':sorted(MEAN),'rootScopes':classified,
            'knownWaveAngularPositiveControls':controls,'typedScopeCounts':scope_counts,'traversedOperations':operators,
            'scope':'Function dependence on physical theta only. Native values, tail bounds, support, whole integrals and zero-extension estimates have separate obligations.',
            'provedMeanCutoffValuesZero':False,'completeFirstCycleFlatResidualProved':False}
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'roots':len(classified),'scopeCounts':scope_counts,'sha256':sha256(a.out.read_bytes()).hexdigest()}))


if __name__=='__main__':
    main()

