"""Conservative common-node certificate for lexical DAG comparisons.

Only identical IDs with identical typed records, identical referenced native
registrations, and earlier certified dependencies are admitted. The topological
property then ensures that such a node cannot reference a later bound variable.
Unknown operations or malformed references are never certified.
"""

def cert(left, right):
    if left.header.get('fixedRegistry') != right.header.get('fixedRegistry'):
        return set()
    safe = set()
    unary = {'inverse','exp','log_positive','sqrt_positive','ceiling','ceiling_nonnegative','sine','cosine','integer_power','source_step_derivative'}
    variadic = {'add','multiply','maximum','smooth_piecewise','definite_integral'}
    def flatten(x):
        if type(x) is int: return [x]
        if isinstance(x,list): return [i for y in x for i in flatten(y)]
        raise ValueError('noninteger definition reference')
    def refs(kind,d):
        if kind=='expression': return [*d['parameters'],d['body']]
        if kind=='monotone': return [*d['parameters'],d['variable'],d['body'],d['left'],d['right'],d['derivativeLower'],d['derivativeUpper']]
        if kind=='quadratic': return flatten([d['linear'],d['quadraticDiagonal'],d['rhs'],d['scale'],d['preconditioner'],d['rootRadius'],d['lipschitzUpper']])
        if kind=='picard': return flatten([d['xi'],d['eta'],d['A0'],d['A1'],d['forcing'],d['radialDomain'],d['zeroAxisDatum']])
        raise ValueError('unknown native registration')
    for i in sorted(left.nodes.keys() & right.nodes.keys()):
        n=left.nodes[i]
        if n!=right.nodes[i]: continue
        op,a=n['op'],n['args']
        try:
            kind=None
            if op in {'coordinate','rational','source_parameter'}: children=[]
            elif op in unary: children=[a[0]]
            elif op in variadic: children=list(a)
            elif op=='actual_expression_partial': kind='expression'; children=list(a[1])
            elif op in {'actual_background_picard','actual_background_even_profile'}: kind='picard';children=list(a[2:4])
            elif op=='actual_quadratic_root': kind='quadratic';children=[a[2]]
            elif op=='actual_monotone_root': kind='monotone';children=list(a[1:])
            elif op=='actual_natural_series': children=list(a[1:3])
            else: continue
            if kind:
                d=left.reg[kind].get(a[0]); e=right.reg[kind].get(a[0])
                if d is None or d!=e: continue
                children.extend(refs(kind,d))
            if all(type(c) is int and c<i and c in safe for c in children): safe.add(i)
        except (IndexError,TypeError,KeyError,ValueError):
            continue
    return safe
