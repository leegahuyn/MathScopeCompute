"""Finite initialized Fourier support of the original localized 67+13 stencil."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryFile

from check_initialized_angular_split import (
    InitializedGraph, REGISTRY_SHA, SOURCE_SHA, Scope, THETA,
)


PINS = {
    'winding': ('final67/initial-fourier/initialized-winding.json',
                '89c4b326bac653e1ab7df3d370d1b358925b43400b47cdfbb729491f1e8e27f4'),
    'primary': ('whole-k-primary-potential-c3/initialized-primary-potential-c3.json',
                '6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'),
    'stencil': ('whole-k-annular-initial/localized-force/original-67plus13-polynomials.json',
                '1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7'),
}


def allowance(atom):
    """Return (coefficient of W, extra shifts); None is an exact zero atom."""
    if atom in {'x', 'y'}:
        return 0, 1
    field, index = atom.split('@', 1)
    orders = list(map(int, index.split(',')))
    if field == 'C':
        # These are coefficient derivatives in (r^2,z,tau). The source
        # radial factor is constant one throughout the plateau.
        return (0, 0) if orders[0] == 0 else None
    if field == 'b':
        return 0, 0
    if field == 'p':
        return 1, sum(orders[:2])
    assert field in {'A0', 'A1', 'A2'}, atom
    return 1, sum(orders[:2]) + int(field != 'A2')


def polynomial_support(terms, variables):
    bounds = set()
    for term in terms:
        factors = [(variables[index], degree) for index, degree in term['powers']]
        if any(bound is None for bound, _ in factors):
            continue
        bounds.add(tuple(sum(bound[axis] * degree for bound, degree in factors) for axis in (0, 1)))
    # For W>=1, the affine bound with the highest slope among equal-cutoff
    # ties is sufficient whenever its value at W=1 is also maximal.
    chosen = max(bounds, key=lambda row: (row[0], row[1]))
    assert all(chosen[0] + chosen[1] >= a + b for a, b in bounds), bounds
    return chosen


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('goal', type=Path)
    parser.add_argument('original', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    receipts = {}
    for key, (name, digest) in PINS.items():
        raw = (args.goal / name).read_bytes()
        assert sha256(raw).hexdigest() == digest, name
        receipts[key] = json.loads(raw)
    winding, primary, stencil = (receipts[key] for key in PINS)
    assert primary['sourceSHA256'] == winding['sourceSHA256'] == SOURCE_SHA
    registry = (args.original / 'original-source-functions.json').read_bytes()
    assert sha256(registry).hexdigest() == primary['registrySHA256'] == REGISTRY_SHA
    with TemporaryFile(dir=args.output.parent) as backing:
        graph = InitializedGraph(args.original / 'original-source-nodes.jsonl.gz', backing)
        scope = Scope(graph, json.loads(registry))
        potential = []
        for systems, bodies in zip(primary['native']['nativePotentialSystems'],
                                   primary['native']['nativePotentialBodies'], strict=True):
            for system, body in zip(systems, bodies, strict=True):
                definition = scope.definition(system, 0)
                assert definition['body'] == body and THETA not in definition['parameters']
                assert THETA not in scope.free(body)
                potential.append({'nativeSystem': system, 'body': body})
        assert len(potential) == 6 and THETA in scope.free(THETA)
        scoped = len(scope.values)
    assert stencil['schema'] == 'MathScope.Annular.ExactOriginal67Plus13LocalizationPolynomial/1'
    variables = [allowance(atom) for atom in stencil['variables']]
    groups = stencil['outputs']
    grad = [part for row in groups['velocity_gradient'] for part in row]
    outputs = {
        'velocity': groups['velocity'],
        'gradient': grad,
        'pressure': [groups['localized_pressure']],
        'force': groups['force'],
    }
    assert [len(parts) for parts in outputs.values()] == [3, 9, 1, 3]
    assert sum(len(part) for parts in outputs.values() for part in parts) == 540
    component_bounds = {name: [polynomial_support(part, variables) for part in parts]
                        for name, parts in outputs.items()}
    # In the cylindrical frame, curl, gradient, and vector Laplacian use
    # r,z,t derivatives and angular covariant differentiation (d_theta+J)
    # with angle-independent coefficients. Only the quadratic advection
    # doubles the frequency bound. Rotating the output vector adds one
    # for horizontal components and differentiation in x,y adds one more.
    frame_bounds = {
        'velocity': [(1, 1), (1, 1), (1, 0)],
        'gradient': [(1, 2), (1, 2), (1, 1), (1, 2), (1, 2), (1, 1), (1, 1), (1, 1), (1, 0)],
        'pressure': [(1, 0)],
        'force': [(2, 1), (2, 1), (2, 0)],
    }
    for kind, bounds in frame_bounds.items():
        assert len(bounds) == len(component_bounds[kind])
        for (slope, shift), (coarse_slope, coarse_shift) in zip(bounds, component_bounds[kind], strict=True):
            assert slope <= coarse_slope and slope + shift <= coarse_slope + coarse_shift
    result = {
        'status': 'CONDITIONAL_INITIALIZED_LOCALIZED_OUTPUTS_HAVE_FINITE_PHYSICAL_MODE_SUPPORT',
        'sourceSHA256': SOURCE_SHA, 'sourcePins': {k: v[1] for k, v in PINS.items()},
        'sourceAngleFreePotentialBodies': potential, 'potentialScopeNodes': scoped,
        'stencilTerms': 540, 'symbolicCutoff': 'W=ceil(physicalWindingUpper)',
        'stencilBoundsAsAffinePairs': component_bounds,
        'cylindricalFrameBoundsAsAffinePairs': frame_bounds,
        'omittedTailAtOrAboveTheseCutoffs': 'exact zero',
        'scope': 'Stage-zero localized field on the original smooth annular radial plateau. '
                 'Uses the original source gauge recipe: zero cylindrical mode for the slow and '
                 'mean potential, signed fundamental for the six wave potential bodies, '
                 'no physical angle in the direct scalar, and the admitted winding majorant. '
                 'Spatial differentiation uses the original fixed labels and smooth joins. '
                 'Subsequent corrections, actual practical cutoff comparisons and final N8 remain open.',
        'release': 'HOLD',
    }
    with args.output.open('x', encoding='utf8', newline='\n') as output:
        json.dump(result, output, indent=2)
        output.write('\n')
    print(json.dumps(component_bounds))


if __name__ == '__main__':
    main()
