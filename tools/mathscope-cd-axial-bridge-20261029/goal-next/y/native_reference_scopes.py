"""Find source-native parameter rebinding on paths to radial transports."""

from collections import Counter
import json


def actual_children(node):
    op, a = node['op'], node['args']
    if op in ('coordinate','rational','source_parameter'):
        return []
    if op in ('add','multiply','smooth_piecewise','maximum'):
        return a
    if op in ('inverse','log_positive','exp','integer_power','sqrt_positive',
              'source_step_derivative','sine','cosine','ceiling'):
        return a[:1]
    if op == 'definite_integral':
        return [a[0],a[2],a[3]]
    if op == 'actual_natural_series':
        return a[1:3]
    if op in ('actual_background_even_profile','actual_background_picard'):
        return a[2:4]
    if op == 'actual_quadratic_root':
        return a[2:3]
    if op == 'actual_monotone_root':
        return a[1:]
    if op in ('actual_covariance_volterra','m3_global_pulse_jet'):
        return [a[2],*a[3]]
    if op == 'm3_forced_pulse_partial':
        return [a[3],*a[4]]
    if op.endswith('_partial') and len(a) == 3:
        return a[1]
    raise ValueError((op,a))


def native_scope_checks(reached, registry, transports, extra_reference_ids=()):
    aux = registry['base']
    base = aux['base']
    coupled = json.loads(registry['definitions'])
    expressions = json.loads(base['expression'])
    aux_expressions = json.loads(aux['expressionDefinitions'])
    aux_fields = json.loads(aux['fieldDefinitions'])
    aux_inverses = json.loads(aux['inverseDefinitions'])
    global_fields = json.loads(base['m3GlobalFields'])
    global_pulses = json.loads(base['m3GlobalPulses'])
    covariance = {p['covariance']:json.loads(p['originalDefinition']) for p in global_pulses}

    def lookup(key, named, anonymous):
        if isinstance(key,str):
            return named[int(key.split(':')[1])]
        return anonymous[key]

    def definition(op,a):
        index = a[0]
        if op.endswith('_expression_partial'):
            if isinstance(index,str):
                assert index.startswith('coupled-expression:')
                result = lookup(index,coupled[0],expressions)
            elif index < 0:
                result = aux_expressions[-1-index]
            else:
                result = expressions[index]
            return result,a[1]
        if op == 'm3_global_indexed_partial':
            return global_fields[index],a[1]
        if op.endswith('_indexed_partial'):
            return lookup(index,coupled[1],aux_fields),a[1]
        if op.endswith('_inverse_partial'):
            return lookup(index,coupled[2],aux_inverses),a[1]
        if op == 'm3_forced_pulse_partial':
            return coupled[3][index],a[4]
        if op == 'actual_covariance_volterra':
            return covariance[index],a[3]
        if op == 'm3_global_pulse_jet':
            return global_pulses[index],a[3]
        raise ValueError((op,a))

    nodes, bodies = dict(reached['nodes']),dict(reached['sourceBodies'])
    refs = {622803,622804,622791,*extra_reference_ids}
    ancestors = set()
    counts = Counter()
    changed = []
    indexed_rows = []
    for i,n in nodes.items():
        op,a = n['op'],n['args']
        native_children = [j for j in bodies.get(i,[]) if j in ancestors]
        if i not in transports and not native_children and not any(j in ancestors for j in actual_children(n)):
            continue
        ancestors.add(i)
        if op == 'definite_integral':
            assert a[1] not in refs
        if not native_children:
            continue
        counts[op] += 1
        body, values = definition(op,a)
        formals = body['parameters']
        assert len(formals) == len(values), (i,op,a,len(formals))
        mapping = dict(zip(formals,values))
        assert len(formals) == len(mapping)
        altered = {j:mapping[j] for j in refs & mapping.keys() if j != mapping[j]}
        if altered:
            changed.append({'call':i,'op':op,'mapping':altered,'nativeChildren':native_children})
        if 'rows' not in body:
            continue
        for row_number,row in enumerate(body['rows']):
            if row['localBody'] not in ancestors:
                continue
            local_formals = row.get('localParameters')
            if not local_formals:
                sid = row['localSystem']
                if isinstance(sid,str):
                    d = lookup(sid,coupled[0],expressions)
                else:
                    d = expressions[sid] if sid >= 0 else aux_expressions[-1-sid]
                local_formals = d['parameters']
            assert len(local_formals) == len(row['values']), (i,row_number)
            local_mapping = dict(zip(local_formals,row['values']))
            altered = {j:local_mapping[j] for j in refs & local_mapping.keys() if j != local_mapping[j]}
            if altered:
                indexed_rows.append({'call':i,'op':op,'row':row_number,'mapping':altered,
                                     'guards':row.get('guards',[])})
    return {'originalRootsWithTransportAncestor':[r for r in reached['roots'] if r in ancestors],
            'scopeAncestorCount':len(ancestors),'nativeScopeCounts':dict(sorted(counts.items())),
            'reboundNativeFrames':changed,'reboundNativeIndexedRows':indexed_rows}


def guarded_row_checks(reached, registry, scope, y_ids, transport_ids):
    """Verify actual relative-band row operands and structural domination."""
    nodes, bodies = dict(reached['nodes']),dict(reached['sourceBodies'])
    aux = registry['base']
    base = aux['base']
    coupled = json.loads(registry['definitions'])
    globals_ = json.loads(base['m3GlobalFields'])
    fields = json.loads(aux['fieldDefinitions'])
    expressions = json.loads(base['expression'])
    aux_expressions = json.loads(aux['expressionDefinitions'])

    def expect(i,op,args):
        assert nodes[i] == {'op':op,'args':args}, (i,nodes[i])

    expect(625155,'log_positive',[622830])
    expect(625156,'multiply',[617517,625155])
    expect(625157,'multiply',[20,625156])
    expect(625191,'rational',['-3','4'])
    expect(120836,'rational',['3','4'])
    expect(632176,'add',[19,625157])
    expect(632177,'multiply',[20,632176])
    expect(632178,'ceiling',[632177])
    expect(632179,'multiply',[20,632178])
    expect(632182,'add',[20,632179])
    expect(632251,'add',[1,632179])
    # Label, exact relative Q, transported (R,Z,T), and fixed-mesh factors.
    label_data = {
        632182:(632185,632187,(632189,632193,632194),632195,(632196,632197,632198)),
        632179:(632219,632221,(632223,632227,632228),632229,(632230,632231,632232)),
        632251:(632254,632256,(632258,632262,632263),632264,(632265,632266,632267)),
    }
    for ell,(Q,ratio,values,mesh_scale,mesh_values) in label_data.items():
        expect(Q,'exp',[Q-1])
        expect(Q-1,'multiply',[20,Q-2])
        expect(Q-2,'multiply',[127,ell])
        expect(ratio-1,'inverse',[Q])
        expect(ratio,'multiply',[622794,ratio-1])
        R,Z,T = values
        expect(R-1,'sqrt_positive',[ratio])
        expect(R,'multiply',[622802,R-1])
        expect(Z-3,'log_positive',[ratio])
        expect(Z-2,'multiply',[22,Z-3])
        expect(Z-1,'exp',[Z-2])
        expect(Z,'multiply',[622803,Z-1])
        expect(T,'multiply',[622804,ratio])
        expect(mesh_scale,'integer_power',[ell,6])
        for i,value in zip(mesh_values,values):
            expect(i,'multiply',[value,mesh_scale])

    cuts = {}
    row_transitions = {}
    guarded = 0
    classified = {}
    for site in scope['reboundNativeIndexedRows']:
        i,row_idx = site['call'],site['row']
        op,index = site['op'],nodes[i]['args'][0]
        if op == 'm3_global_indexed_partial':
            definition = globals_[index]
        elif isinstance(index,str):
            definition = coupled[1][int(index.split(':')[1])]
        else:
            definition = fields[index]
        outer = dict(zip(definition['parameters'],nodes[i]['args'][1]))
        assert all(outer[c] == c for c in (622803,622804,622791)), i
        row = definition['rows'][row_idx]
        sid = row['localSystem']
        if isinstance(sid,str):
            local = coupled[0][int(sid.split(':')[1])]
        else:
            local = expressions[sid] if sid >= 0 else aux_expressions[-1-sid]
        assert local['body'] == row['localBody']
        values = dict(zip(local['parameters'],row['values']))
        ell = row['label']['ell']
        assert values[622791] == ell
        _,_,(R,Z,T),_,mesh_values = label_data[ell]
        if 3675253 in values:
            assert values[3675253] == 622791
            assert [values[c] for c in (622802,622803,622804)] == [622802,622803,622804]
        else:
            assert [values[c] for c in (622802,622803,622804)] == [R,Z,T]
        assert [values[c] for c in (623855,623856,623857)] == row['label']['grid']
        shell,*mesh,band = row['guards']
        assert shell == [622824,3617,28826]
        assert len(mesh) == 3
        for (offset,lo,hi),coord,grid in zip(mesh,mesh_values,row['label']['grid']):
            assert (lo,hi) == (625191,120836)
            base_value,neg_grid = nodes[offset]['args']
            expect(offset,'add',[base_value,neg_grid])
            assert {base_value,neg_grid} == {coord,next(j for j in (base_value,neg_grid) if j != coord)}
            neg_grid = neg_grid if base_value == coord else base_value
            expect(neg_grid,'multiply',[20,grid])
        offset,lo,hi = band
        assert (lo,hi) == (625191,120836)
        a,b = nodes[offset]['args']
        expect(offset,'add',[a,b])
        assert 625157 in (a,b)
        expect(b if a == 625157 else a,'multiply',[20,ell])
        assert row['localBody'] in bodies[i]
        cuts.setdefault(i,set()).add(row['localBody'])
        target_scope = 'pending' if 3675253 in values else 'active'
        transitions = row_transitions.setdefault(i,{})
        assert transitions.setdefault(row['localBody'],target_scope) == target_scope
        signature = (op,ell)
        classified.setdefault(signature,{'firstCall':i,'firstRow':row_idx,'count':0})['count'] += 1
        guarded += 1

    def reachable(cut_rows, cut_representative):
        stack = list(reached['roots'])
        visited = set(stack)
        for i in stack:
            omitted = cuts.get(i,()) if cut_rows else ()
            if cut_representative and i in representative_binders:
                omitted = bodies[i]
            for j in (*actual_children(nodes[i]),*(j for j in bodies.get(i,[]) if j not in omitted)):
                if j not in visited:
                    visited.add(j)
                    stack.append(j)
        return visited

    changed = scope['reboundNativeFrames']
    representative_binders = {x['call'] for x in changed if x['mapping'].get(622809) == 623935}
    representative_formals = {x['call'] for x in changed if x['mapping'].get(622803) == 622958}
    changed_calls = {x['call'] for x in changed}
    assert not (changed_calls | {623935}) & reachable(True,False)
    assert not representative_formals & reachable(False,True)

    # Carry chart kind through native-body edges. Expression operands are
    # evaluated in the parent scope. An indexed row child is the positive
    # arm only, after its authenticated band, mesh and shell predicates.
    mapping_by_call = {x['call']:x['mapping'] for x in changed}
    stack = [(i,'reference',False) for i in reached['roots']]
    visited = set(stack)
    scope_problems = set()
    while stack:
        i,kind,rep = stack.pop()
        if i == 623935 and kind not in ('active','active-saved'):
            scope_problems.add((i,kind,'frozen midpoint has no matched active box'))
        mapping = mapping_by_call.get(i,{})
        next_kind, next_rep = kind,rep
        z = mapping.get(622803)
        if z == 3822572:
            if kind != 'pending':
                scope_problems.add((i,kind,'own-scale map requires the coupled pending row'))
            next_kind = 'active-saved'
        elif z == 3675270:
            if kind != 'active-saved':
                scope_problems.add((i,kind,'reference pullback requires the saved reference'))
            next_kind, next_rep = 'reference',False
        elif z == 622958:
            if not rep:
                scope_problems.add((i,kind,'representative actuals require their frozen binding'))
        elif z == 625946 or mapping.get(622809) == 623935:
            if kind not in ('active','active-saved'):
                scope_problems.add((i,kind,'representative use requires an active box'))
            next_rep = True
        states = [(j,kind,rep) for j in actual_children(nodes[i])]
        transitions = row_transitions.get(i,{})
        for j in bodies.get(i,[]):
            new_kind = transitions.get(j)
            states.append((j,next_kind,next_rep) if new_kind is None else (j,new_kind,False))
        for state in states:
            if state not in visited:
                visited.add(state)
                stack.append(state)

    dependencies = {}
    for i,n in nodes.items():
        dependencies[i] = set.union({i} & y_ids,*(dependencies[j] for j in (*actual_children(n),*bodies.get(i,[]))))
    assert all(dependencies[i] == y_ids for i in transport_ids)
    groups = {}
    for x in changed:
        signature = (x['op'],tuple(sorted(x['mapping'].items())))
        key = groups.setdefault(signature,{'op':x['op'],'mapping':x['mapping'],
                                           'firstCall':x['call'],'count':0})
        key['count'] += 1
    return {
        'guardedRelativeRowRecords':guarded,
        'relativeRowGroups':[{'op':op,'ell':ell,**data} for (op,ell),data in classified.items()],
        'changedNativeGroups':list(groups.values()),
        'frozenRepresentativeAndChangedFramesBehindGuardedRowCut':True,
        'representativeFormalCallsBehindExactFrozenBindings':len(representative_formals),
        'frozenBindingFrames':len(representative_binders),
        'everyRadialTransportContainsYIds':sorted(y_ids),
        'nativeFrameScopeStateCount':len(visited),
        'nativeFrameScopeFailures':[list(p) for p in sorted(scope_problems)],
    }
