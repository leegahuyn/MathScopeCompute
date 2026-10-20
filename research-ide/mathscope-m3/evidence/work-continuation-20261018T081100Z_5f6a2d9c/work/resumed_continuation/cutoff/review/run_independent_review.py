"""Independent, scoped review probes; no historical backend checks run."""
from pathlib import Path
from itertools import product
from fractions import Fraction as Q
from math import factorial
import hashlib
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
SUBJECT = ROOT / 'work/resumed_continuation/cutoff/code/cutoff_continuation.py'
spec = importlib.util.spec_from_file_location('independent_cutoff_review_subject', SUBJECT)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)

# Expand the polynomial (q/4)^4 directly, independently of chain composition,
# with q=2+x+2y+3xy+x^2. The comparison point is x=y=0, so s=a*q=1/2.
terms = {(0, 0): Q(2), (1, 0): Q(1), (0, 1): Q(2),
         (1, 1): Q(3), (2, 0): Q(1)}
expanded = {}
for factors in product(terms.items(), repeat=4):
    alpha = tuple(sum(term[0][i] for term in factors) for i in range(2))
    coefficient = Q(1, 256)
    for _, value in factors:
        coefficient *= value
    expanded[alpha] = expanded.get(alpha, Q(0)) + coefficient

indices = m.multiindices(2, 3)
qjets = {a: m.I.point(terms.get(a, Q(0)) * factorial(a[0]) * factorial(a[1]))
         for a in indices}
chi_jets = [m.I.point(value) for value in [Q(1, 16), Q(1, 2), Q(3), Q(12)]]
output = m.cutoff_chain_jets(qjets, chi_jets, m.I.point(Q(1, 2)), 3, 2)
comparison = []
for alpha in indices:
    expected = expanded.get(alpha, Q(0)) * factorial(alpha[0]) * factorial(alpha[1])
    comparison.append({'alpha': alpha, 'expected': str(expected),
                       'computed': output[alpha].encoded(),
                       'pass': output[alpha] == m.I.point(expected)})
assert len(comparison) == 10 and all(row['pass'] for row in comparison)

try:
    duplicate_result = m.normalized_box_integral(
        [[0, 1]], [{'index': (0,), 'enclosures': {'q': m.I.point(1)}}], ['q', 'q'])
except ValueError as error:
    duplicate = {'rejected': True, 'message': str(error)}
else:
    duplicate = {'rejected': False, 'result': duplicate_result['integrals']['q'].encoded()}
assert duplicate == {'rejected': True, 'message': 'DISTINCT_NONEMPTY_QUANTITIES_REQUIRED'}

record = {
    'subject_path': str(SUBJECT.relative_to(ROOT)),
    'subject_sha256': hashlib.sha256(SUBJECT.read_bytes()).hexdigest(),
    'nonlinear_mixed_jet_probe': comparison,
    'duplicate_quantity_probe': duplicate,
    'historical_backend_checks_rerun': False,
    'fixture_values_claimed_as_actual_source': False,
}
encoded = json.dumps(record, indent=2) + '\n'
(HERE / 'INDEPENDENT_PROBES.json').write_text(encoded)
print(encoded, end='')
