"""Exact source-phase derivatives in the original normalized spatial directions."""
from pathlib import Path
from hashlib import sha256, sha1
import json
import sys
import sympy as sp

assert len(sys.argv) == 3, 'Pass ORIGINAL_BAND_SOURCE and NEW_OUTPUT_JSON.'
source = Path(sys.argv[1])
data = source.read_bytes()
assert sha256(data).hexdigest() == 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'
literal = b'phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))'
assert literal in data
assert b'phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))' in data
R, Z, T, theta, v, xi = sp.symbols('R Z T theta v xi', real=True)
eps = sp.symbols('epsilon', positive=True)
p, pz, x0 = sp.symbols('p pz x0', real=True)
H = sp.Function('H')(R, Z, T)
phase = p*theta + pz*Z/eps + x0*R - v*H
directions = [('R', R, sp.Integer(1)), ('Z', Z, eps),
              ('theta', theta, sp.Integer(1)), ('v', v, sp.Integer(1)),
              ('xi', xi, sp.Integer(1))]
rows = []
for i, (name, variable, weight) in enumerate(directions):
    actual = sp.expand(weight*sp.diff(phase, variable))
    expected = [x0-v*sp.diff(H,R), pz-eps*v*sp.diff(H,Z), p, -H, 0][i]
    assert sp.simplify(actual-expected) == 0
    rows.append({'directions':[name], 'formula':str(actual)})
    for j in range(i, len(directions)):
        other, other_var, other_weight = directions[j]
        second = sp.expand(other_weight*sp.diff(actual, other_var))
        # There is no epsilon inverse after one weighted spatial derivative.
        for term in sp.Add.make_args(second):
            exponent = term.as_powers_dict().get(eps, sp.Integer(0))
            assert exponent.is_Integer and exponent >= 0
        rows.append({'directions':[name,other], 'formula':str(second)})
assert sp.simplify(eps*sp.diff(phase,Z) - (pz-eps*v*sp.diff(H,Z))) == 0
out = {
    'status':'VERIFIED_LITERAL_SOURCE_NORMALIZED_SPATIAL_PHASE',
    'sourceSHA256':sha256(data).hexdigest(),
    'sourceGitBlob':sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest(),
    'rows':rows,
    'assumptions':['epsilon is constant on the frozen original band', '0<epsilon<=1',
                   'source H and coefficients are smooth through order two',
                   'the original admitted frozen-label chart and coefficient derivative bounds'],
    'phaseBounds':{
        'first':'k*(carrier+length*H1+H0)',
        'second':'k*(length*H2+H1)',
        'directions':'partial_R, epsilon partial_Z, partial_theta, partial_v, partial_xi',
    },
    'physicalPower':'Each restored ordinary Z derivative costs epsilon^-1. With epsilon=Q^h, this cancels Q^(z*h) in the original physical potential exponent.',
    'scope':'Exact first and second source-phase identities and conditional derivative envelope only. This does not evaluate the source pulse, final fields, energy acceptance or later corrections.',
    'release':'HOLD',
}
dest = Path(sys.argv[2])
assert not dest.exists() and dest.resolve() != source.resolve()
dest.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8')
print('PASS 5 first and 15 second phase derivatives in the normalized spatial directions')
