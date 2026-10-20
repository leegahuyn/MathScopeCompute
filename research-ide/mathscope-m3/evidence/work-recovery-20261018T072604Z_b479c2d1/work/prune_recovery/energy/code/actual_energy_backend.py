"""RECOVERY implementation; no claim to reproduce the lost implementation bytes.

The numerical core evaluates exact localization polynomials on Fraction intervals.
The actual adapter deliberately raises a structured MissingActualJet until an
identified evaluator of the frozen final family exists. Generic input dictionaries
are never accepted as proof that these jets belong to that family.
"""
from dataclasses import dataclass
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import json


@dataclass(frozen=True)
class Interval:
    lo: Q
    hi: Q

    def __post_init__(self):
        object.__setattr__(self, 'lo', Q(self.lo))
        object.__setattr__(self, 'hi', Q(self.hi))
        if self.lo > self.hi:
            raise ValueError('reversed interval')

    @staticmethod
    def point(x):
        return Interval(Q(x), Q(x))

    def __add__(self, other):
        other = coerce(other)
        return Interval(self.lo + other.lo, self.hi + other.hi)

    __radd__ = __add__

    def __neg__(self):
        return Interval(-self.hi, -self.lo)

    def __sub__(self, other):
        return self + -coerce(other)

    def __mul__(self, other):
        other = coerce(other)
        corners = [a*b for a in (self.lo, self.hi) for b in (other.lo, other.hi)]
        return Interval(min(corners), max(corners))

    __rmul__ = __mul__

    def square(self):
        return Interval(0 if self.lo <= 0 <= self.hi else min(self.lo**2, self.hi**2),
                        max(self.lo**2, self.hi**2))

    def encoded(self):
        return [str(self.lo), str(self.hi)]


def coerce(x):
    return x if isinstance(x, Interval) else Interval.point(x)


def evaluate_polynomial(polynomial, jets):
    total = Interval.point(0)
    for term in polynomial:
        product = Interval.point(int(term['coefficient']))
        for atom in filter(None, term['monomial'].split('*')):
            if atom not in jets:
                raise KeyError('Missing interval for ' + atom)
            product = product * jets[atom]
        total = total + product
    return total


def evaluate_unidentified_jets(binding, jets):
    """Generic arithmetic only: this entry point never authenticates source jets.

    Every interval must hold throughout the same cell. Values at cell centers
    alone cannot be used as quadrature enclosures.
    """
    missing = set(binding['requiredAtoms']) - set(jets)
    if missing:
        raise KeyError('Missing jet intervals: ' + ', '.join(sorted(missing)))
    p = binding['exactPolynomials']
    velocity = [evaluate_polynomial(row, jets) for row in p['velocity']]
    gradient = [[evaluate_polynomial(row, jets) for row in component]
                for component in p['velocityGradient']]
    force = [evaluate_polynomial(row, jets) for row in p['directForce']]
    return {
        'scope': 'UNIDENTIFIED_GENERIC_INTERVAL_JETS_ONLY',
        'actual_field_authenticated': False,
        'velocity': velocity, 'gradient': gradient, 'force': force,
        'pressure': evaluate_polynomial(p['pressure'], jets),
        'velocity_squared': sum((x.square() for x in velocity), Interval.point(0)),
        'dissipation_density': sum((x.square() for row in gradient for x in row), Interval.point(0)),
        'work_density': sum((f*u for f, u in zip(force, velocity)), Interval.point(0)),
        'force_squared': sum((x.square() for x in force), Interval.point(0)),
    }


def energy_contract_nu_one(initial_energy, velocity_squared, dissipation, work, force_norm_integral):
    """Check already enclosed whole-K quantities; no quadrature claim is made.

    velocity_squared is ||u(t)||_2^2; dissipation and work are time integrals.
    force_norm_integral is integral ||f||_2 dt, not integral ||f||_2^2 dt.
    This is a generic checker, not N7-06 completion or field authentication.
    """
    e0, u2, d, w, h = map(coerce, (initial_energy, velocity_squared, dissipation, work, force_norm_integral))
    if e0 != Interval.point(0):
        raise ValueError('INITIAL_ENERGY_MUST_BE_EXACTLY_ZERO')
    if min(u2.lo, d.lo, h.lo) < 0:
        raise ValueError('Norm quantities require nonnegative enclosures')
    defect = u2 + 2*d - 2*w
    lhs, rhs = u2 + 2*d, h.square()
    inequality = 'CERTIFIED' if lhs.hi <= rhs.lo else ('VIOLATED' if lhs.lo > rhs.hi else 'INCONCLUSIVE')
    return {'scope': 'GENERIC_ALREADY_ENCLOSED_WHOLE_K_QUANTITIES',
            'energy_defect': defect.encoded(), 'zero_in_defect': defect.lo <= 0 <= defect.hi,
            'zero_in_defect_is_not_an_identity_proof': True,
            'nu_one_10_13_left': lhs.encoded(), 'nu_one_10_13_right': rhs.encoded(),
            'nu_one_10_13_status': inequality, 'actual_field_authenticated': False}


class MissingActualJet(RuntimeError):
    code = 'MISSING_ACTUAL_JET'

    def __init__(self, request):
        self.request = request
        super().__init__('The retained final-family description has no identified numerical jet evaluator; no value was substituted.')


class FrozenActualEnergyAdapter:
    """Source-bound request generator, never a caller-supplied authority seal."""
    FAMILY_SHA256 = 'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78'
    BINDING_CANONICAL_SHA256 = 'f706a250da0c4f1ea003a1cdb9da062998361e8e69831e9625212edf59d3251d'

    def _check_binding(self):
        encoded = json.dumps(self.binding, sort_keys=True, separators=(',', ':')).encode()
        if hashlib.sha256(encoded).hexdigest() != self.BINDING_CANONICAL_SHA256:
            raise ValueError('CHANGED_EXACT_OPERATOR_BINDING')

    def __init__(self, recovered_root, binding):
        self.root = Path(recovered_root).resolve()
        self.binding = json.loads(json.dumps(binding))
        self._check_binding()
        self.family_path = self.root / 'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json'
        self.family = json.loads(self.family_path.read_text())
        if hashlib.sha256(self.family_path.read_bytes()).hexdigest() != self.FAMILY_SHA256:
            raise ValueError('CHANGED_FROZEN_ACTUAL_FAMILY')
        if binding['actualFamily']['sha256'] != self.FAMILY_SHA256:
            raise ValueError('WRONG_OPERATOR_TARGET')
        for pin in binding['sourcePins']:
            if hashlib.sha256((self.root / pin['path']).read_bytes()).hexdigest() != pin['sha256']:
                raise ValueError('CHANGED_BOUND_SOURCE: '+pin['path'])

    def required_request(self):
        self._check_binding()
        fields = [a for a in self.binding['requiredAtoms'] if a.split('@')[0] in ('A0','A1','A2','b','p')]
        cutoff = [a for a in self.binding['requiredAtoms'] if a.startswith('C@')]
        return {
            'schema': 'MathScope.RecoveryMissingActualEnergyJets/1',
            'actual_family_sha256': self.FAMILY_SHA256,
            'fixed_source': self.family['fixed_source'],
            'initial_state': self.family['actual_stages'][0],
            'canonical_fields': {
                'A': 'Precisely the original emitted gauge: background plus initialization and every active original cutoff potential',
                'b': 'The smooth source scalar in B_e_theta=b(s,z,tau)*(-y,x,0), s=x*x+y*y; never B/r evaluated at r=0',
                'p': 'The latest complete background, mean and angular pressure, including all stage pressure increments'},
            'requested_field_jets': fields,
            'requested_cutoff_jets': cutoff,
            'coordinates': {'A_and_p': ['x','y','z','tau'], 'b_and_C': ['s','z','tau'], 'physical_time_derivative': '-partial_tau'},
            'requested_domain': 'Every whole-K spatial quadrature cell and every active physical-time cell; closed-cell enclosures, not center samples',
            'outer_cutoff': {'formula': 'chi(2*r^2/r0^2)*chi(2*z^2/z0^2)*chi(tau/tau0)',
                             'r0': '1', 'tau0': 'qbig/32', 'z0': 'tau0^(1/2-h)'},
            'frozen_correction_nodes': [n['id'] for n in self.family['nodes'] if n['operation']=='ActualCorrectionPotentials'],
            'frozen_scale_nodes': [n['id'] for n in self.family['nodes'] if n['operation']=='ActualShrinkingScale'],
            'selector_requirement': 'Evaluate/bound the same frozen exact supremum/minimum functionals; identify all active cutoffs and omitted tails on each actual cell',
            'available_family_evaluator': self.family['numerical_field_evaluator'],
            'available_supremum_evaluator': self.family['numerical_supremum_evaluator'],
            'initial_energy_required_exact': '0',
            'missing_values_replaced_by_zero': False,
            'alternate_family_selected': False,
            'force_definition': 'f=-partial_tau u-Delta u+(u dot grad)u+grad(c*p), u=curl(c*A)+c*b*(-y,x,0)',
            'N706_closed': False, 'N805_closed': False, 'actual_last_resolved_tau': None,
        }

    def evaluate_actual_cell(self):
        # The local source explicitly declares numerical_field_evaluator=False.
        # This is a concrete boundary, not a claim that no other algorithm exists.
        raise MissingActualJet(self.required_request())
