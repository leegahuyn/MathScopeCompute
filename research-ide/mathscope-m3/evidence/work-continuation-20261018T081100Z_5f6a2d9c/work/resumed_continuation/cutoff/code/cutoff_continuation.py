"""Frozen-family cutoff support and conditional interval consumers.

The support planner applies to the pinned actual family. The scalar/jet/integral
consumers do arithmetic on explicitly unidentified input enclosures. They cannot
authenticate source bounds or manufacture the missing actual recursive fields.
"""
from fractions import Fraction as Q
from itertools import product
from math import factorial
from pathlib import Path
import hashlib
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[4]
BACKEND = ROOT / 'work/prune_recovery/energy/code/actual_energy_backend.py'
spec = importlib.util.spec_from_file_location('retained_actual_energy_backend', BACKEND)
backend = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = backend
spec.loader.exec_module(backend)
I = backend.Interval

FAMILY_SHA = 'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78'
FAMILY_REL = 'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json'
SUPPORT_PINS = {
    'work/remaining_chain/PROOF_APPLICATION.md': '641ff6eb9a78066babc71921ba67059e9f9705cac28b0f7f95688b0e78542dd5',
    'work/remaining_chain/source/source-localization.mjs': '5f6480f9799a9a83945f696833b9213585572efbe65e9e755b2935726e6f1036',
    'work/remaining_chain/source/source-localization-domain.mjs': 'e8c92fb57bcea6282320b8e9cae9b65be62d1f2f157982d999388389a28ebfb7',
    'work/remaining_chain/source/source-inner-growth.mjs': '4a6b9ade65d9280e44871d3e707b9bb0d086b2c53e0e0f311b908dd34103b3a8',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def reciprocal(x):
    if x.lo <= 0 <= x.hi:
        raise ValueError('INTERVAL_DIVISION_THROUGH_ZERO')
    return I(1/x.hi, 1/x.lo)


def ipow(x, n):
    if n < 0:
        return ipow(reciprocal(x), -n)
    answer = I.point(1)
    for _ in range(n):
        answer = answer*x
    return answer


def maximum(values):
    values = list(values)
    if not values:
        raise ValueError('EMPTY_MAXIMUM')
    return I(max(x.lo for x in values), max(x.hi for x in values))


def ceilq(q):
    return -((-q.numerator)//q.denominator)


def selected_C_enclosure(supremum):
    """C=1+ceil(S) for the TRUE selected P, conditional on this S enclosure.

    This does not claim to compute a global supremum. A closed interval touching
    an integer may legitimately leave two C values possible.
    """
    if supremum.lo < 0:
        raise ValueError('NEGATIVE_NORM_SUPREMUM')
    return I(1+ceilq(supremum.lo), 1+ceilq(supremum.hi))


def conditional_scale_enclosure(j, h, log_inverse_qbig, previous, selectors):
    """Enclose the SAME max formula, not select a new sufficient scale.

    selectors maps every m=0..j to (EXACT minimal P_hat, S_hat enclosure at P).
    The caller still owes source identity, global enclosure and P-minimality.
    """
    if not isinstance(j, int) or j < 1 or set(selectors) != set(range(j+1)):
        raise ValueError('ALL_ORDERS_ZERO_THROUGH_J_REQUIRED')
    if h.lo <= 0:
        raise ValueError('POSITIVE_H_REQUIRED')
    gamma = h*Q(j, 20)
    inverse_gamma = reciprocal(gamma)
    bounds = [I.point(1), previous+1, log_inverse_qbig+1]
    for m in range(j+1):
        p, s = selectors[m]
        if not isinstance(p, int) or p < 0:
            raise ValueError('EXACT_NONNEGATIVE_MINIMAL_P_REQUIRED')
        c = selected_C_enclosure(s)
        bounds.extend([ipow(2*p*inverse_gamma, 2), 2*(c+j)*inverse_gamma])
    return {'L': maximum(bounds), 'actual_selector_authenticated': False,
            'scope': 'CONDITIONAL_INTERVAL_IMAGE_OF_FROZEN_FORMULA'}


def exp_lower_taylor(j, degree):
    if not isinstance(j, int) or j < 0 or not isinstance(degree, int) or degree < 0:
        raise ValueError('NONNEGATIVE_INTEGER_TAYLOR_INPUTS_REQUIRED')
    return sum((Q(j**k, factorial(k)) for k in range(degree+1)), Q(0))


def certified_tail_start(rho, requested_j=None):
    """Produce a finite rational proof exp(J)*rho > 1, no floating log.

    J is a sufficient zero-tail start, never a claim of the minimal active set.
    For automatic selection, e>2 gives an a priori terminating finite search.
    """
    rho = Q(rho)
    if rho <= 0:
        raise ValueError('POSITIVE_CELL_Q_LOWER_BOUND_REQUIRED')
    if requested_j is None:
        j = 1
        while rho*2**j <= 1:
            j += 1
        lower=Q(2**j)
        return {'J':j, 'rho':str(rho), 'Taylor_degree':None,
                'exp_J_rational_lower':str(lower),
                'exponential_lower_method':'exp(1)>1+1=2, so exp(J)>2^J',
                'product_strict_lower':str(rho*lower),
                'zero_tail':f'all original stage corrections j >= {j}',
                'all_mixed_derivatives_zero':True,
                'minimal_tail_start_claimed':False}
    else:
        if not isinstance(requested_j, int) or requested_j < 1:
            raise ValueError('POSITIVE_TAIL_INDEX_REQUIRED')
        j = requested_j
    # A requested J need not work. A finite budget reports unresolved, not zero.
    for degree in range(1, 1025):
        lower = exp_lower_taylor(j, degree)
        if rho*lower > 1:
            return {'J': j, 'rho': str(rho), 'Taylor_degree': degree,
                    'exp_J_rational_lower': str(lower),
                    'product_strict_lower': str(rho*lower),
                    'zero_tail': f'all original stage corrections j >= {j}',
                    'all_mixed_derivatives_zero': True,
                    'minimal_tail_start_claimed': False}
    raise ValueError('REQUESTED_J_NOT_CERTIFIED_WITH_FINITE_TAYLOR_BUDGET')


class FrozenCutoffPlanner:
    def __init__(self, recovered_root):
        self.root = Path(recovered_root)
        self.path = self.root/FAMILY_REL
        if sha(self.path) != FAMILY_SHA:
            raise ValueError('CHANGED_FROZEN_ACTUAL_FAMILY')
        for relative, expected in SUPPORT_PINS.items():
            if sha(self.root/relative) != expected:
                raise ValueError('CHANGED_SUPPORT_SOURCE: '+relative)
        self.family = json.loads(self.path.read_text())
        self.nodes = {n['id']: n for n in self.family['nodes']}
        self.scales = [n for n in self.nodes.values() if n['operation']=='ActualShrinkingScale']
        self.corrections = {n['data']['j']: n for n in self.nodes.values()
                            if n['operation']=='ActualCorrectionPotentials'}
        for n in self.scales:
            if not ('1+L_previous' in n['data']['L'] and n['data']['every_m_le_j']):
                raise ValueError('FROZEN_RECURRENCE_NOT_RETAINED')

    def plan(self, normalized_tau_lower, requested_j=None):
        s = Q(normalized_tau_lower)
        if not 0 < s <= 1:
            raise ValueError('FINITE_NONZERO_PHYSICAL_TIME_SLAB_REQUIRED')
        # tau=tau0*s, tau0=qbig/32; tau=q(1-eta^2)<=q.
        proof = certified_tail_start(s/32, requested_j)
        j = proof['J']
        return {
            'schema': 'MathScope.FrozenActualCutoffFinitePrefix/1',
            'family_sha256': FAMILY_SHA,
            'physical_slab': {'tau/tau0_lower': str(s), 'tau/tau0_upper': '1',
                              'tau0': 'qbig/32', 'q/qbig_lower': str(s/32)},
            'proof': proof,
            'universal_induction': 'L_0=log(1/qbig); L_j>=L_(j-1)+1 implies L_j>=L_0+j for EVERY j>=1',
            'local_source_and_extension': 'Apply on the original local-source branch; elsewhere retain its prescribed smooth zero extension. Localization support is contained in q<=qbig/4.',
            'possibly_active_stage_indices': list(range(1,j)),
            'serialized_active_correction_nodes': [self.corrections[k]['id'] for k in range(1,j) if k in self.corrections],
            'unserialized_active_stage_indices': [k for k in range(1,j) if k not in self.corrections],
            'stage_tail_exact_zero': True,
            'base_coefficient_series_tail_evaluated': False,
            'finite_prefix_values_evaluated': False,
            'remaining_active_scale_values_evaluated': False,
            'initialization_replaces_final_field': False,
            'N706_closed': False, 'N805_closed': False, 'actual_last_resolved_tau': None,
        }

    def selector_premises(self):
        rows=[]
        for scale in self.scales:
            for ident in scale['data']['norm_inputs']:
                n=self.nodes[ident]
                rows.append({'stage':scale['data']['j'], 'order':n['data']['m'],
                    'cutoff_supremum_node':ident, 'scale_node':scale['id'],
                    'actual_derivative_source_node':n['inputs'][0],
                    'needs': ['An enclosure of S_hat at its exact least finite integer exponent P_hat',
                              'Finiteness at P_hat and divergence at each smaller nonnegative integer, unless P_hat=0',
                              'Uniform original-domain proof including q approaching zero; point samples only give lower bounds'],
                    'all_numeric_values':None})
        return rows


def multiindices(dimension, order):
    return sorted((a for a in product(range(order+1), repeat=dimension) if sum(a)<=order),
                  key=lambda a:(sum(a),a))


def alpha_factorial(alpha):
    answer=1
    for a in alpha:
        answer*=factorial(a)
    return answer


def cutoff_chain_jets(q_jets, chi_derivatives, s, order, dimension=4):
    """Jets of chi(a*q) at FIXED a, THEN substitute a=s/q.

    Inputs enclose all q derivatives on a common physical cell, and chi^(k) on
    its s interval. Reparametrizing before differentiation would give wrong jets.
    No source authority is assigned to these interval inputs.
    """
    if not isinstance(order,int) or order<0 or not isinstance(dimension,int) or dimension<1:
        raise ValueError('FINITE_JET_ORDER_AND_DIMENSION_REQUIRED')
    indices=multiindices(dimension,order)
    zero=(0,)*dimension
    if set(indices)-set(q_jets):
        raise ValueError('INCOMPLETE_Q_JETS')
    if q_jets[zero].lo<=0 or s.lo<0:
        raise ValueError('POSITIVE_Q_AND_NONNEGATIVE_S_REQUIRED')
    if s.lo>=1:
        return {a:I.point(0) for a in indices}
    if len(chi_derivatives)<order+1:
        raise ValueError('INCOMPLETE_CHI_DERIVATIVES')
    a=s*reciprocal(q_jets[zero])
    delta={alpha:q_jets[alpha]*Q(1,alpha_factorial(alpha)) for alpha in indices if alpha!=zero}
    powers={zero:I.point(1)}
    output={alpha:I.point(0) for alpha in indices}
    for k in range(order+1):
        factor=chi_derivatives[k]*ipow(a,k)*Q(1,factorial(k))
        for alpha,value in powers.items():
            output[alpha]=output[alpha]+factor*value*alpha_factorial(alpha)
        next_power={}
        for alpha,value in powers.items():
            for beta,other in delta.items():
                gamma=tuple(x+y for x,y in zip(alpha,beta))
                if sum(gamma)<=order:
                    next_power[gamma]=next_power.get(gamma,I.point(0))+value*other
        powers=next_power
    return output


def normalized_box_integral(edges, cells, quantities):
    """Exact rectangular enclosure consumer over the whole normalized box.

    Each cell must be present once and contain intervals valid throughout it.
    No grid or tolerance is prescribed. Values/derivative source identity remain
    unverified; physical z0 (and tau0 for time integrals) factors remain separate.
    """
    if not quantities or len(set(quantities))!=len(quantities):
        raise ValueError('DISTINCT_NONEMPTY_QUANTITIES_REQUIRED')
    if not edges or any(len(axis)<2 for axis in edges):
        raise ValueError('NONEMPTY_PARTITION_REQUIRED')
    edges=[[Q(x) for x in axis] for axis in edges]
    if any(any(b<=a for a,b in zip(axis,axis[1:])) for axis in edges):
        raise ValueError('STRICT_PARTITION_EDGES_REQUIRED')
    expected=set(product(*(range(len(axis)-1) for axis in edges)))
    seen=set()
    sums={q:I.point(0) for q in quantities}
    for cell in cells:
        index=tuple(cell['index'])
        if index in seen or index not in expected:
            raise ValueError('DUPLICATE_OR_OUT_OF_DOMAIN_CELL')
        seen.add(index)
        volume=Q(1)
        for axis,i in zip(edges,index):
            volume*=axis[i+1]-axis[i]
        for q in quantities:
            if q not in cell['enclosures']:
                raise ValueError('MISSING_CELL_DENSITY')
            sums[q]=sums[q]+cell['enclosures'][q]*volume
    if seen!=expected:
        raise ValueError('WHOLE_BOX_COVER_INCOMPLETE')
    return {'scope':'UNIDENTIFIED_WHOLE_NORMALIZED_BOX_ENCLOSURE',
            'integrals':sums, 'cell_count':len(seen),
            'supplied_box':[[str(axis[0]),str(axis[-1])] for axis in edges],
            'actual_field_authenticated':False, 'physical_measure_applied':False}
