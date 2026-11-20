"""Apply pinned original Y obligations to its extended live owner registry."""
import argparse
import hashlib
import inspect
import json
from pathlib import Path
import runpy

CHECKER = 'c7bf1a01906fe52a40914f464f7c939badb23cb6463a96f59ffb078e53a773dd'
REGISTRY = '62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce'
STREAM = '7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2'
EXPANDED = '797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7'


def splice(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new)


def replay(checker, expanded, registry, profile, out, bracket, drop_loop):
    assert hashlib.sha256(checker.read_bytes()).hexdigest() == CHECKER
    replay_source = expanded.read_bytes()
    assert hashlib.sha256(replay_source).hexdigest() == EXPANDED
    source = json.loads(replay_source)
    assert source['graphSHA256'] == STREAM
    assert source['registrySHA256'] == REGISTRY
    del source
    ns = runpy.run_path(str(checker))
    math = inspect.getsource(ns['main'])
    math = splice(math, 'assert len(nd) == 598891', 'assert len(nd) == 379603')
    math = splice(math, "assert len(data['roots']) == 13", "assert len(data['roots']) == 1444")
    math = splice(math, 'assert len(calls) == 582', 'assert len(calls) == 567')
    math = splice(math, "calls = [dict(r,k=r['radialOrder'],m=r['etaOrder']) for r in data['calls']]",
                  "calls = data['calls']")
    math = splice(math, "original_registry = json.loads(pinned_bytes(registry,REGISTRY_SHA))['base']", """
    snapshot = json.loads(pinned_bytes(registry,REGISTRY_SHA))
    coupled = json.loads(snapshot['definitions'])
    aux = snapshot['base']
    original_registry = aux['base']
    aux_expr = json.loads(aux['expressionDefinitions'])
    aux_inv = json.loads(aux['inverseDefinitions'])
    global_pulse = json.loads(original_registry['m3GlobalPulses'])

    def typed(rows, idx, prefix):
        assert idx.startswith(prefix), idx
        defn = rows[int(idx.split(':')[-1])]
        assert defn['id'] == idx, idx
        return defn

    def expr(idx):
        if isinstance(idx,str):
            return typed(coupled[4] if idx.startswith('forced-expression:') else coupled[0],
                         idx,'forced-expression:' if idx.startswith('forced-expression:') else 'coupled-expression:')
        return aux_expr[-1-idx] if idx<0 else expressions[idx]

    def binder_for(op,a,root):
        ident=a[0]
        if op.endswith('_expression_partial'):
            d=expr(ident)
            assert d['body']==root
            formals=d['parameters']
            orders=a[2]
            limits=d.get('derivativeLimits')
            if limits is not None:
                assert len(orders)==len(limits)==len(formals)
                assert all(type(order) is int and 0<=order<=limit
                           for order,limit in zip(orders,limits))
            else:
                assert len(orders)==len(formals)
                assert all(type(order) is int and 0<=order<=16 for order in orders)
            return formals,a[1]
        if op in ('m3_coupled_inverse_partial','m3_aux_inverse_partial'):
            d=typed(coupled[2],ident,'coupled-inverse:') if isinstance(ident,str) else aux_inv[ident]
            assert d['body']==root
            return d['parameters'],a[1]
        if op=='actual_monotone_root':
            d=monotones[ident]
            if d['body']==root:
                return d['parameters'],a[1:]
        if op=='m3_forced_pulse_partial':
            d=coupled[3][ident]
            assert d['id']==ident
            # Time belongs to the original interval binder, not the
            # endpoint value of the Volterra solution. Do not substitute it.
            return d['parameters'],a[4]
        if op=='m3_global_pulse_jet':
            d=global_pulse[ident]
            return d['parameters'],a[3]
        return [],[]
""")
    first = math.index("                if op=='actual_expression_partial':")
    last = math.index('                assert len(formals)==len(values)',first)
    math = math[:first] + '                formals, values = binder_for(op,a,root)\n' + math[last:]
    math = splice(math,
                  "N3 raw-base current/pressure and selector 13 roots only; sufficient radial bound with original source semantics, conditional on native actual-image and positive-bracket validity. All 582 calls considered; no carried N1 successes.",
                  "All 1444 C132 live active N3 Repeat roots. Original Y obligation rules, conditional on every actually used original native domain and positive bracket. No transferred numerical existence or derivative materialization claim. All 567 literal calls considered, and unresolved typed owner transport is kept open.")
    math = splice(math, "out.write_text(json.dumps(receipt,indent=2)+'\\n',encoding='utf8')",
                  "out.write_bytes((json.dumps(receipt,indent=2)+'\\n').encode('utf8'))")
    ns['SOURCE_REPLAY_SHA']=EXPANDED
    ns['REGISTRY_SHA']=REGISTRY
    exec(compile(math,str(checker),'exec'),ns)
    ns['main'](expanded,registry,profile,out,True,bracket,drop_loop)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('checker','expanded','registry','profile','out'):
        p.add_argument(name,type=Path)
    p.add_argument('--no-bracket',action='store_true')
    p.add_argument('--drop-loop',action='store_true')
    a=p.parse_args()
    replay(a.checker,a.expanded,a.registry,a.profile,a.out,not a.no_bracket,a.drop_loop)
