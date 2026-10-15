"""Source-bound outer binder range contracts for all natural call contexts.

These contracts are conditional on positive physical radial caller arguments;
they do not silently establish the complete g caller graph or eta substitutions.
"""
from __future__ import annotations
import argparse
from collections import defaultdict
from fractions import Fraction as Q
from functools import lru_cache
import hashlib
import importlib.util
import json
from pathlib import Path

import picard_domain_proof as p
from native_domain_extract import (argument_children, require, sha, STAGE3_PIN,
                                  conservative_capture, G_ROOT, G_PARAMETERS)
from natural_domain_proof import (PIN, RAW_DIAGNOSTIC_PIN, FIXED_PIN, LIMIT,
                                 TARGET_PIN, CALL_INVENTORY_PIN, source_parameter_proof)


def negative(value):
    return p.plus(*(negative(x) for x in value[1])) if value[0] == 'add' else p.multiply(p.rat(-1), value)


def positive(value):
    """Additional constants are admitted only after the exact source check."""
    if value[0] == 'parameter' and value[1] in {'XR', 'Xsep', 'Q'}:
        return True
    if value[0] == 'mul':
        return Q(value[1]) > 0 and all(positive(x) for x, _ in value[2])
    if value[0] == 'add':
        return bool(value[1]) and all(positive(x) for x in value[1])
    return p.intrinsic_positive(value)


def coarse_numeric(value):
    """Conservative real bounds; None is unbounded, never a guessed value."""
    if value[0] == 'q':
        return Q(value[1]), Q(value[1])
    if value == ('parameter', 't1'):
        return Q(0), p.TAU_UPPER
    if value[0] == 'log':
        arg=value[1]
        if arg == ('parameter','Lambda'):
            # Q>2^260, Lambda=Q^64, log(2)>1/2.
            return Q(8320), None
        if arg == ('parameter','CSelected'):
            return Q(1024), None  # C>2^2048.
        if arg[0] == 'q':
            n=Q(arg[1])
            if n<=0:raise p.Unproved('Nonpositive logarithm')
            if n==1:return Q(0),Q(0)
            if n<1:
                lo,hi=coarse_numeric(('log',p.rat(1/n)))
                return -hi,-lo
            k=n.numerator.bit_length()-n.denominator.bit_length()
            while Q(2)**k>n:k-=1
            while Q(2)**(k+1)<=n:k+=1
            return Q(k,2),Q(k+1)
    if value[0]=='add':
        rows=[coarse_numeric(x) for x in value[1]]
        return tuple(None if any(row[i] is None for row in rows) else sum(row[i] for row in rows) for i in (0,1))
    c,factors=p.parts(value)
    if value[0]=='mul' and len(factors)==1:
        (factor,n),=factors.items()
        if n==1:
            lo,hi=coarse_numeric(factor)
            if c<0:lo,hi=hi,lo
            return tuple(None if x is None else c*x for x in (lo,hi))
    return (Q(0),None) if positive(value) else (None,None)


def order(left,right):
    try:return p.compare(left,right)
    except p.Unproved:pass
    delta=p.plus(left,negative(right))
    try:return p.compare(delta,p.rat(0))
    except p.Unproved:pass
    if left==p.rat(0) and positive(right):return -1
    if right==p.rat(0) and positive(left):return 1
    if left[0]==right[0]=='log':return order(left[1],right[1])
    lo,hi=coarse_numeric(delta)
    if lo is not None and lo>0:return 1
    if hi is not None and hi<0:return -1
    raise p.Unproved('Exact outer order not covered: '+repr((left,right)))


def coordinates(value):
    if value[0]=='coordinate':return {value[1]}
    if value[0]=='add':return set().union(*(coordinates(x) for x in value[1]))
    if value[0]=='mul':return set().union(*(coordinates(x) for x,_ in value[2]))
    if value[0] in {'exp','log','sqrt'}:return coordinates(value[1])
    return set()


def finite_min(values):
    if any(value is None for value in values):return None
    result=values[0]
    for value in values[1:]:
        if order(value,result)<0:result=value
    return result


def finite_max(values):
    if any(value is None for value in values):return None
    result=values[0]
    for value in values[1:]:
        if order(value,result)>0:result=value
    return result


class Bounds:
    """None means an unbounded endpoint, never a guessed finite number."""
    def __init__(self, normal): self.normal = normal

    def scale(self, interval, coefficient):
        if coefficient == p.rat(0): return p.rat(0), p.rat(0)
        sign = order(coefficient, p.rat(0))
        lo, hi = interval if sign > 0 else interval[::-1]
        return tuple(None if value is None else p.multiply(coefficient, value) for value in (lo, hi))

    def at(self, value, env):
        if value in env: return env[value]
        for selector, limits in env.items():
            ratio = p.multiply(value, p.pw(selector, -1))
            if not p.contains_coordinate(ratio) and positive(ratio):
                return self.scale(limits, ratio)
            shift = p.plus(value, negative(selector))
            if not p.contains_coordinate(shift):
                return tuple(None if endpoint is None else p.plus(endpoint, shift) for endpoint in limits)
        op = value[0]
        if op in {'q', 'parameter'}: return value, value
        if op == 'coordinate': raise p.Unproved('Unbound outer coordinate ' + str(value[1]))
        if op == 'add':
            rows = [self.at(v, env) for v in value[1]]
            return tuple(None if any(row[i] is None for row in rows) else p.plus(*(row[i] for row in rows)) for i in (0, 1))
        if op == 'mul':
            coefficient, factors = p.parts(value)
            result = (p.rat(1), p.rat(1))
            for factor, power in factors.items():
                lo, hi = self.at(factor, env)
                if power == 1:
                    current = lo, hi
                elif lo is not None and order(lo, p.rat(0)) >= 0:
                    if power < 0:
                        require(order(lo, p.rat(0)) > 0, 'Inverse includes zero')
                        current = (None if hi is None else p.pw(hi, power), p.pw(lo, power))
                    else:
                        current = p.pw(lo, power), None if hi is None else p.pw(hi, power)
                else:
                    raise p.Unproved('Outer power not covered by a nonnegative interval')
                if result[0] == result[1] and result[0] is not None:
                    result = self.scale(current, result[0])
                elif current[0] == current[1] and current[0] is not None:
                    result = self.scale(result, current[0])
                elif result[0] is not None and current[0] is not None and order(result[0], p.rat(0)) >= 0 and order(current[0], p.rat(0)) >= 0:
                    result = (p.multiply(result[0], current[0]), None if result[1] is None or current[1] is None else p.multiply(result[1], current[1]))
                else:
                    raise p.Unproved('Signed unbounded product not covered')
            return self.scale(result, p.rat(coefficient))
        if op == 'exp':
            lo, hi = self.at(value[1], env)
            return p.rat(0) if lo is None else p.ex(lo), None if hi is None else p.ex(hi)
        if op == 'log':
            lo, hi = self.at(value[1], env)
            if hi is not None: require(order(hi, p.rat(0)) > 0, 'Log upper endpoint nonpositive')
            return (None if lo is None or order(lo, p.rat(0)) <= 0 else p.lg(lo), None if hi is None else p.lg(hi))
        if op == 'sqrt':
            lo, hi = self.at(value[1], env)
            require(lo is not None and order(lo, p.rat(0)) >= 0, 'Sqrt lacks nonnegative bound')
            return p.sq(lo), None if hi is None else p.sq(hi)
        raise p.Unproved('Unknown outer bound operation ' + op)

    def constrain(self, env, selector, lo, hi):
        result = dict(env)
        result[selector] = lo, hi
        # Monotone exp/log transformations retain exact one-sided constraints.
        result[p.ex(selector)] = (p.rat(0) if lo is None else p.ex(lo), None if hi is None else p.ex(hi))
        if lo is not None and order(lo, p.rat(0)) >= 0:
            result[p.lg(selector)] = (None if lo == p.rat(0) else p.lg(lo), None if hi is None else p.lg(hi))
        c, factors = p.parts(selector)
        for variable, exponent in factors.items():
            if variable[0] != 'coordinate' or exponent not in (1, 2): continue
            coefficient = p.multiply(selector, p.pw(variable, -exponent))
            if positive(coefficient) and not p.contains_coordinate(coefficient):
                low, high = self.scale((lo, hi), p.pw(coefficient, -1))
                if exponent == 1: result[variable] = low, high
                elif low is not None and order(low, p.rat(0)) >= 0:
                    # xi>=0 is a separate original Picard caller contract.
                    result[variable] = p.sq(low), None if high is None else p.sq(high)
        return result


def call_scopes(get_node, normal, start, natural_rows, env):
    """Bind only occurrences in the body; endpoints retain the outer scope."""
    bound=Bounds(normal)
    body,binder,low,high=get_node(start)['args']
    first,second=bound.at(normal.at(low),env),bound.at(normal.at(high),env)
    limits=finite_min([first[0],second[0]]),finite_max([first[1],second[1]])
    inner={key:value for key,value in env.items() if binder not in coordinates(key)}
    inner[('coordinate',binder)]=limits
    endpoints=[]
    for row in natural_rows:
        target=row['id']
        @lru_cache(None)
        def occurs(ident):
            if ident==target:return True
            if ident<target:return False
            node=get_node(ident)
            if node['op'] in {'smooth_piecewise','definite_integral'} or node['op'].startswith(('actual_','m3_')):return False
            return any(occurs(child) for child in argument_children(node))
        retained=False
        for label,root,scope in [('body',body,inner),('lowerEndpoint',low,env),('upperEndpoint',high,env)]:
            if not occurs(root):continue
            retained=True
            actual=get_node(target)
            require(actual==row['node'] and sha(actual)==row['nodeSHA256'],'Changed actual natural call')
            interval=bound.at(normal.at(row['Y']),scope)
            require(interval[0] is not None and interval[1] is not None and
                    order(interval[0],p.rat(0))>=0 and order(interval[1],p.rat(LIMIT))<0,
                    'Natural interval outside actual rectangle or unbounded')
            endpoints.append({'naturalCall':target,'integralOccurrenceRole':label,'YInterval':interval})
        require(retained,'Natural member not reached before another guard/integral/native boundary')
    return endpoints


def prove_context(get_node, normal, start, natural_rows, context):
    bound = Bounds(normal)
    surface = get_node(context['surface'])
    require(surface == context['node'] and surface['op'] == 'smooth_piecewise', 'Changed actual outer guard')
    a = surface['args']; selector, left, right = map(normal.at, a[:3])
    results = []
    for position in context['directArgumentPositions']:
        require(position in (3, 4, 5), 'Natural integral occurs in guard selector/endpoints; a value-domain proof is required')
        lower, upper = ((p.rat(0), left) if position == 3 else (left, right) if position == 4 else (right, None))
        if lower is not None and upper is not None:
            require(order(lower,upper)<=0,'Guard branch lacks a proved ordered closed interval')
        env = bound.constrain({}, selector, lower, upper)
        @lru_cache(None)
        def contains(ident):
            if ident == start: return True
            if ident < start: return False
            node = get_node(ident)
            if node['op'] == 'smooth_piecewise' or node['op'].startswith(('actual_', 'm3_')): return False
            return any(contains(child) for child in argument_children(node))
        states, endpoints = set(), []
        def walk(ident, env):
            key = ident, tuple(sorted(env.items(), key=repr))
            if key in states: return
            states.add(key)
            require(len(states) < 100000, 'Outer downward state budget exceeded')
            node = get_node(ident); op, args = node['op'], node['args']
            if op == 'definite_integral':
                if ident == start:
                    endpoints.extend(call_scopes(get_node,normal,start,natural_rows,env))
                    return
                body, binder, low, high = args
                first, second = bound.at(normal.at(low), env), bound.at(normal.at(high), env)
                limits = finite_min([first[0], second[0]]), finite_max([first[1], second[1]])
                inner = {key:value for key,value in env.items() if binder not in coordinates(key)}
                inner[('coordinate', binder)] = limits
                for child, scope in ((body, inner), (low, env), (high, env)):
                    if contains(child): walk(child, scope)
            else:
                require(op not in {'smooth_piecewise'} and not op.startswith(('actual_', 'm3_')), 'Unexpected intervening guard/native boundary')
                for child in argument_children(node):
                    if contains(child): walk(child, env)
        require(contains(a[position]), 'Recorded source guard path not present in full ordinary graph')
        walk(a[position], env)
        require(endpoints, 'No actual integral occurrence covered')
        results.append({'guard': context['surface'], 'branchPosition': position, 'proofStates': len(states),
                        'naturalEndpointProofs': endpoints,
                        'assumedNonnegativeGuardSelector':selector if position==3 and not p.intrinsic_nonnegative(selector) else None,
                        'positiveRadialCallerPremise': 'The guard radial selector is nonnegative in an outside-left branch; actual positive physical/native arguments must be bound separately.' if position == 3 else None})
    return results


def run(get_node, graph, calls, outer):
    normal = p.RadialNormal(graph)
    rows_by_id = {row['id']: row for row in calls}
    proofs, gaps = [], []
    for row in outer['rows']:
        natural_rows = [rows_by_id[ident] for ident in row['naturalCallIDs']]
        # A Y value independent of every coordinate is a global range fact;
        # its enclosing integral endpoints need no fictitious caller scope.
        try:
            values=[normal.at(call['Y']) for call in natural_rows]
            require(not any(coordinates(value) for value in values),'Nonconstant Y needs binder scope')
            require(all(order(value,p.rat(0))>=0 and order(value,p.rat(LIMIT))<0 for value in values),'Unbounded constant Y')
            proofs.append({'firstIntegral':row['start'],'allEnclosingContextsIrrelevantToY':True,
                           'rule':'CONSTANT_Y_RANGE_ONLY','naturalCalls':row['naturalCallIDs'],'normalizedY':values})
            continue
        except (ValueError,KeyError,ZeroDivisionError):pass
        try:
            local=call_scopes(get_node,normal,row['start'],natural_rows,{})
            proofs.append({'firstIntegral':row['start'],'allEnclosingContextsIrrelevantToY':True,
                           'rule':'FIXED_FIRST_INTEGRAL_ENDPOINT_RANGE_ONLY','proof':local})
            continue
        except (ValueError,KeyError,ZeroDivisionError):pass
        for index in row['nextContextIndices']:
            context = outer['contexts'][index]
            try:
                proof = prove_context(get_node, normal, row['start'], natural_rows, context)
                proofs.append({'firstIntegral': row['start'], 'contextIndex': index, 'proof': proof})
            except (ValueError, KeyError, ZeroDivisionError) as error:
                gaps.append({'firstIntegral': row['start'], 'naturalCalls': row['naturalCallIDs'], 'contextIndex': index, 'reason': str(error)})
        if row['unattachedSources']:
            gaps.append({'firstIntegral': row['start'], 'naturalCalls': row['naturalCallIDs'], 'unattachedSources': row['unattachedSources'],
                         'reason': 'A source use lacks a reviewed enclosing guard/native caller. Do not label it dead metadata without proof.'})
    return {'schema': 'MathScope.N6.NaturalOuterDownwardRangeContracts/1', 'outerFirstIntegralRows': len(outer['rows']),
            'provedOuterContexts': proofs, 'unprovedOuterContexts': gaps,
            'allOuterFormalRangeContractsProved': not gaps,
            'all533ActualCallerDomainsProved': False,
            'remainingActualApplication': ['Positive physical/native radial caller arguments', 'Original eta formal-to-actual substitutions remain in I or common tube', 'Every unattached source use must be classified explicitly', 'Primitive argument definedness beyond these range contracts'],
            'newOriginalGuardsDischarged': 0, 'newOriginalJetsDischarged': 0, 'newOriginalPDETermsDischarged': 0}


def compact_outer(raw):
    """Retain every source use; dedup identical contexts only, never paths."""
    contexts,rows,known=[],[],{}
    for row in raw['outerIntegralContexts']:
        indices=[]
        for context in row['nextContexts']:
            key=sha(context)
            if key not in known:
                known[key]=len(contexts);contexts.append(context)
            indices.append(known[key])
        rows.append({'start':row['start'],'naturalCallIDs':row['naturalCallIDs'],
                     'nextContextIndices':indices,'unattachedSources':row['unattachedBoundaries']})
    return {'contexts':contexts,'rows':rows}


def exact_outer_parameters(fixed):
    source_parameter_proof(fixed)
    e=fixed['source']['parametersExactExpressions']
    require(e['XR']=={'product':[{'integer':110},{'power':[{'product':[{'ref':'CSelected'},{'ref':'Pstar'}]},10]}]},'Original positive XR expression changed')
    require(e['Tsh']=={'power':[{'ref':'Q'},90]} and
            e['Xsep']=={'product':[{'integer':110},{'exp':{'ref':'Tsh'}}]},'Original positive Xsep expression changed')


def cloud_inputs(args):
    require(args.source_db and args.stage3 and args.header and args.diagnostics and args.outer_raw,
            'Cloud mode requires source-db, stage3, header, diagnostics and outer-raw')
    require(hashlib.sha256(args.stage3.read_bytes()).hexdigest()==STAGE3_PIN,'Changed pinned Stage3 module')
    spec=importlib.util.spec_from_file_location('outer_range_pinned_stage3',args.stage3)
    v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    header,binding=bind_header_to_gzip(args.header.parent/'original-parent.ndjson.gz',args.header)
    raw=args.diagnostics.read_bytes();require(hashlib.sha256(raw).hexdigest()==RAW_DIAGNOSTIC_PIN,'Changed original native diagnostic')
    domains=json.loads(raw);require(domains['headerBinding']==binding,'Changed diagnostic header authentication')
    registries=v3.registries(header)
    require(sha(registries['expressionDefinitions'][21])==TARGET_PIN,'Changed original g21 definition')
    require(sha(registries['fixed'])==FIXED_PIN,'Changed complete fixed definition')
    require(domains['target']['definition']==registries['expressionDefinitions'][21],'Detached target differs from authenticated registry')
    exact_outer_parameters(registries['fixed'])
    get_node=v3.Source(args.source_db)
    seen,definitions,_=conservative_capture(get_node,registries,G_ROOT)
    require(len(seen)==136186 and len(definitions)==84 and sha(sorted(seen))=='5d9e85d4b92e19947dc68a0f17b994ee8f95664440c962fbd0cb01b6cf49419a','Changed conservative source capture')
    calls=domains['naturalCalls']
    require(len(calls)==len({c['id'] for c in calls})==533 and sha([(c['id'],c['nodeSHA256']) for c in calls])==CALL_INVENTORY_PIN,'Changed all533 source natural inventory')
    for call in calls:
        require(get_node(call['id'])==call['node'] and sha(call['node'])==call['nodeSHA256'],'Changed original source natural node')
    outer_raw=args.outer_raw.read_bytes();outer=json.loads(outer_raw)
    require(outer['schema']=='MathScope.N6.NaturalOuterIntegralContexts/1' and outer['domainsInputSHA256']==RAW_DIAGNOSTIC_PIN,'Changed outer source extraction')
    require(outer['headerBinding']==binding and outer['conservativeCapture']['sourceIdSetSHA256']==sha(sorted(seen)),'Changed outer authenticated capture')
    # The optimization ident<target is justified by checking every ordinary
    # edge of this actual source DAG, rather than by assuming monotone IDs.
    for ident in seen:
        node=get_node(ident)
        if not node['op'].startswith(('actual_','m3_')):
            require(all(child<ident for child in argument_children(node)),'Ordinary source DAG is not topologically numbered')
    class LazyNodes(dict):
        def __missing__(self,key):
            value=get_node(key);self[key]=value;return value
    graph=LazyNodes()
    inputs={'rawDiagnosticsSHA256':RAW_DIAGNOSTIC_PIN,'outerRawSHA256':hashlib.sha256(outer_raw).hexdigest(),
            'sourceExecutionRun':outer.get('sourceExecutionRun'),
            'authenticatedHeaderBinding':binding,'sourceCacheAuthority':'Same-workflow Stage3 fresh source cache; this module does not authenticate arbitrary SQLite files independently.',
            'all533SourceCallsCompared':True,'ordinarySourceEdgesTopologicallyChecked':True}
    return get_node,graph,calls,compact_outer(outer),inputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=Path(__file__).resolve().parent/'native-result-small')
    parser.add_argument('--outer', type=Path, default=Path(__file__).resolve().parent/'native-latest-small/OUTER_CONTEXT_COMPACT.json')
    parser.add_argument('--outer-graph', type=Path, default=Path(__file__).resolve().parent/'gate-results-38716785477/OUTER_ARGUMENT_GRAPH.json')
    parser.add_argument('--out', type=Path, default=Path(__file__).with_suffix('.json'))
    parser.add_argument('--source-db',type=Path)
    parser.add_argument('--stage3',type=Path)
    parser.add_argument('--header',type=Path)
    parser.add_argument('--diagnostics',type=Path)
    parser.add_argument('--outer-raw',type=Path)
    args = parser.parse_args()
    if args.source_db or args.diagnostics:
        get_node,graph,calls,outer,bindings=cloud_inputs(args)
        result=run(get_node,graph,calls,outer);result['inputBindings']=bindings
        args.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
        print(json.dumps({'provedContexts':len(result['provedOuterContexts']),'unprovedContexts':len(result['unprovedOuterContexts']),
                          'all533ActualCallerDomainsProved':False,'newDischarged':0}))
        return
    data = {}
    for name, pin in PIN.items():
        raw = (args.input/name).read_bytes(); require(hashlib.sha256(raw).hexdigest() == pin, 'Changed authenticated projection '+name); data[name] = json.loads(raw)
    graph = {int(k): v for k, v in data['NATURAL_ARGUMENT_GRAPH.json']['argumentAndContextGraph'].items()}
    exact_outer_parameters(data['NATIVE_PAYLOADS.json']['fullNativePayloads']['fixed'])
    raw = args.outer_graph.read_bytes(); require(hashlib.sha256(raw).hexdigest() == 'c33ea3ef4b0c09c794b58ec5ce90511aa4e98681cc7ad97da79e02b2a5a6961f', 'Changed outer graph projection')
    extra = json.loads(raw)
    for key, node in extra['ordinaryArgumentAndContextNodes'].items():
        ident = int(key); require(ident not in graph or graph[ident] == node, 'Source node conflict across authenticated projections'); graph[ident] = node
    outer = json.loads(args.outer.read_text(encoding='utf8'))
    result = run(graph.__getitem__, graph, data['NATURAL_CALLS.json']['naturalCalls'], outer)
    result['inputBindings'] = {'nativeProjections': PIN, 'outerGraphSHA256': hashlib.sha256(raw).hexdigest(), 'outerContextSHA256': hashlib.sha256(args.outer.read_bytes()).hexdigest()}
    args.out.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf8')
    print(json.dumps({'provedContexts': len(result['provedOuterContexts']), 'unprovedContexts': len(result['unprovedOuterContexts']), 'all533ActualCallerDomainsProved': False, 'newDischarged': 0}))


if __name__ == '__main__': main()
