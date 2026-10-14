"""Exact functional normalization of every pinned nonzero residual monomial.

This worker never differentiates an opaque registry function.  It proves only
identities in the ring of the ORIGINAL finite, defined scalar operands:
sqrt_positive(u)^2=u and exp(u)exp(v)=exp(u+v).  The independent verifier replays
every source arithmetic expansion and transport certificate.  Analytic source
definedness, denominator guards, and the Cartesian PDE remain separate.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import sqlite3
import time

MAX_TERMS = 4096
MAX_PRODUCTS = 2_000_000
MAX_DEPTH = 700
BASE_COUNTS = (169, 197, 654)
PREFIX_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'


class ResourceStop(ValueError):
    pass


class SourceUnavailable(ResourceStop):
    pass


class LazySourceNodes(dict):
    def __init__(self, values, fetch):
        super().__init__(values)
        self.fetch = fetch

    def __missing__(self, ident):
        if self.fetch:
            value = self.fetch(ident)
            if value is not None:
                self[ident] = value
                return value
        raise SourceUnavailable(f'Original source witness {ident} absent from checkpoint and verified SQLite prefix; original term retained')

    def __contains__(self, ident):
        if super().__contains__(ident):
            return True
        self[ident]
        return True


def js_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def sha(value):
    return hashlib.sha256(value).hexdigest()


def require(value, message):
    if not value:
        raise ValueError(message)


def decode(text):
    if not text:
        return ()
    values = tuple(sorted((int(a), int(b)) for a, b in (part.split(':') for part in text.split(','))))
    require(len({a for a, _ in values}) == len(values) and all(a >= 0 and b > 0 for a, b in values),
            'Malformed or repeated source factor')
    return values


def canonical_rows(poly):
    return [{'powers': [[i, p] for i, p in key], 'coefficient': str(value)}
            for key, value in sorted(poly.items()) if value]


def string_rows(poly):
    return [{'factors': [[i, p] for i, p in key], 'coefficient': str(value)}
            for key, value in sorted(poly.items()) if value]


class SourceArithmetic:
    """Sparse exact source ring; nonrational operations remain actual atoms."""

    def __init__(self, nodes):
        self.nodes, self.cache, self.products = nodes, {}, 0

    def add(self, a, b):
        result = dict(a)
        for key, value in b.items():
            result[key] = result.get(key, Q(0)) + value
            if not result[key]:
                del result[key]
        if len(result) > MAX_TERMS:
            raise ResourceStop('Exact source arithmetic monomial budget 4096 exceeded')
        return result

    def mul(self, a, b):
        result = {}
        for ka, va in a.items():
            for kb, vb in b.items():
                self.products += 1
                if self.products > MAX_PRODUCTS:
                    raise ResourceStop('Exact source arithmetic product budget 2000000 exceeded')
                powers = dict(ka)
                for ident, power in kb:
                    powers[ident] = powers.get(ident, 0) + power
                key = tuple(sorted(powers.items()))
                result[key] = result.get(key, Q(0)) + va * vb
                if not result[key]:
                    del result[key]
        if len(result) > MAX_TERMS:
            raise ResourceStop('Exact source arithmetic monomial budget 4096 exceeded')
        return result

    def power(self, poly, order):
        require(isinstance(order, int) and order >= 0, 'Unreviewed nonpositive polynomial power')
        result = {(): Q(1)}
        while order:
            if order & 1:
                result = self.mul(result, poly)
            order //= 2
            if order:
                poly = self.mul(poly, poly)
        return result

    def expand(self, ident, depth=0):
        if ident in self.cache:
            return self.cache[ident]
        if depth > MAX_DEPTH:
            raise ResourceStop('Source arithmetic recursion depth 700 exceeded')
        require(ident in self.nodes, f'Missing original source witness {ident}')
        node = self.nodes[ident]
        op, args = node['op'], node['args']
        if op == 'rational':
            value = Q(*map(int, args))
            result = {(): value} if value else {}
        elif op == 'add':
            result = {}
            for child in args:
                result = self.add(result, self.expand(child, depth + 1))
        elif op == 'multiply':
            result = {(): Q(1)}
            for child in args:
                result = self.mul(result, self.expand(child, depth + 1))
        elif op == 'integer_power' and isinstance(args[1], int) and 0 <= args[1] <= 256:
            result = self.power(self.expand(args[0], depth + 1), args[1])
        elif op == 'inverse':
            child = self.expand(args[0], depth + 1)
            if set(child) == {()}:
                require(child[()], 'Original source inverse of exact zero')
                result = {(): 1 / child[()]}
            else:
                # Exact nonconstant rational operands stay bound to their
                # actual inverse source node. No denominator is forgotten.
                result = {((ident, 1),): Q(1)}
        else:
            result = {((ident, 1),): Q(1)}
        self.cache[ident] = result
        return result


def verify_witnesses(checkpoint):
    nodes = {}
    for witness in checkpoint['sourceWitnesses']:
        ident, node = witness['sourceNode'], witness['node']
        require(sha(js_bytes(node)) == witness['nodeSHA256'], f'Changed source witness hash {ident}')
        require(ident not in nodes or nodes[ident] == node, f'Conflicting source witness {ident}')
        nodes[ident] = node
    for binding in checkpoint['definitionBindings']:
        require(sha(js_bytes(binding['definition'])) == binding['definitionSHA256'],
                f'Changed original registry definition {binding["key"]}')
    return nodes


def normalize_term(term, nodes, calc, virtual_atoms):
    original = decode(term['monomial'])
    expansion = {(): Q(term['coefficient'])}
    sqrt_steps = []
    for ident, power in original:
        require(ident in nodes, f'Missing original factor witness {ident}')
        node = nodes[ident]
        if node['op'] == 'sqrt_positive' and power >= 2:
            quotient, remainder = divmod(power, 2)
            radicand = calc.expand(node['args'][0])
            replacement = calc.power(radicand, quotient)
            if remainder:
                replacement = calc.mul(replacement, {((ident, 1),): Q(1)})
            sqrt_steps.append({'sourceSqrt': ident, 'originalPower': power,
                               'radicandSource': node['args'][0], 'radicandPolynomial': canonical_rows(radicand),
                               'proofRule': 'PRINCIPAL_REAL_SQRT_SQUARE_ON_ORIGINAL_DEFINED_DOMAIN'})
        else:
            replacement = {((ident, power),): Q(1)}
        expansion = calc.mul(expansion, replacement)
    output, transports = {}, []
    for powers, coefficient in sorted(expansion.items()):
        remaining, exponent, exp_sources = {}, {}, []
        for ident, power in powers:
            node = nodes[ident]
            if node['op'] != 'exp':
                remaining[f'S{ident}'] = power
                continue
            arg = node['args'][0]
            part = calc.expand(arg)
            exponent = calc.add(exponent, {key: power * value for key, value in part.items()})
            exp_sources.append({'sourceExp': ident, 'power': power, 'argumentSource': arg,
                                'argumentPolynomial': canonical_rows(part)})
        if exponent:
            signature = canonical_rows(exponent)
            label = 'E' + sha(js_bytes(signature))
            if label in virtual_atoms:
                require(virtual_atoms[label]['exponentPolynomial'] == signature, 'Exponent signature collision')
            virtual_atoms[label] = {'kind': 'exp_of_exact_source_polynomial', 'exponentPolynomial': signature,
                                    'definition': 'exp(sum coefficient*product ORIGINAL source operands)',
                                    'operandDefinednessProved': False}
            remaining[label] = 1
        key = tuple(sorted(remaining.items()))
        output[key] = output.get(key, Q(0)) + coefficient
        if not output[key]:
            del output[key]
        transports.append({'preExponentialPowers': [[i, p] for i, p in powers],
                           'coefficient': str(coefficient), 'exponentialFactors': exp_sources,
                           'combinedExponentPolynomial': canonical_rows(exponent),
                           'outputFactors': [[i, p] for i, p in key],
                           'proofRule': 'EXPONENTIAL_ADDITION_FOR_FINITE_DEFINED_ARGUMENTS'})
    return output, {'sqrtSquareSteps': sqrt_steps, 'exponentialTransports': transports}


def preserved_term(term):
    key = tuple(sorted((f'S{i}', p) for i, p in decode(term['monomial'])))
    return {key: Q(term['coefficient'])}


def normalize(terms, checkpoint, source_fetch=None):
    nodes = LazySourceNodes(verify_witnesses(checkpoint), source_fetch)
    calc, virtual_atoms, ledger, total = SourceArithmetic(nodes), {}, [], {}
    for index, term in enumerate(terms):
        try:
            output, proof = normalize_term(term, nodes, calc, virtual_atoms)
            status, stop = 'EXACT_FUNCTIONAL_IDENTITY_CONDITIONAL_ON_SOURCE_DEFINEDNESS', None
        except (ResourceStop, RecursionError) as error:
            output, proof, status, stop = preserved_term(term), {}, 'RESOURCE_STOP_ORIGINAL_TERM_RETAINED', str(error)
        for key, value in output.items():
            total[key] = total.get(key, Q(0)) + value
            if not total[key]:
                del total[key]
        ledger.append({'inputTermIndex': index, 'original': term, 'originalSHA256': sha(js_bytes(term)),
                       'status': status, 'stop': stop, 'normalized': string_rows(output), 'certificate': proof})
    return {'termLedger': ledger, 'normalizedNumerator': string_rows(total), 'virtualAtoms': virtual_atoms,
            'sourceArithmeticProducts': calc.products, 'sourceArithmeticCacheEntries': len(calc.cache)}


def mutation_controls(terms, checkpoint, evidence, verified_database=None):
    from residual_verify import verify
    import copy
    controls = []
    for name in ['coefficient', 'omitted_original_term', 'source_witness_hash', 'output_factor']:
        changed = copy.deepcopy(evidence)
        changed_checkpoint = checkpoint
        if name == 'coefficient':
            row = next(r for r in changed['termLedger'] if r['normalized'])['normalized'][0]
            row['coefficient'] = str(Q(row['coefficient']) + 1)
        elif name == 'omitted_original_term':
            changed['termLedger'].pop()
        elif name == 'source_witness_hash':
            changed_checkpoint = copy.deepcopy(checkpoint)
            changed_checkpoint['sourceWitnesses'][0]['nodeSHA256'] = '0' * 64
        else:
            next(r for r in changed['termLedger'] if r['normalized'])['normalized'][0]['factors'].append(['MUTATED_UNBOUND_FACTOR', 1])
        try:
            verify(terms, changed_checkpoint, changed, verified_database=verified_database)
            rejected, reason = False, None
        except (ValueError, AssertionError, KeyError, TypeError) as error:
            rejected, reason = True, str(error)
        controls.append({'mutation': name, 'rejected': rejected, 'reason': reason})
    require(all(row['rejected'] for row in controls), 'A negative residual mutation survived independent verification')
    return controls


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


def run(context, out, component):
    from residual_verify import verify
    started = time.monotonic()
    require(component in range(3), 'Unknown original residual component')
    baseline, out = Path(context['baseline']), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    source = baseline / 'rational' / f'pde_component_{component}.json'
    checkpoint_path = baseline / 'checkpoints' / 'cartesian-source-checkpoint.json'
    raw, checkpoint_raw = source.read_bytes(), checkpoint_path.read_bytes()
    prior, checkpoint = json.loads(raw), json.loads(checkpoint_raw)
    require(prior['component'] == component, 'Original component binding changed')
    require(prior['directSourceRoot'] == (3825257, 3825259, 3825261)[component]
            and prior['assembledSourceRoot'] == (3825348, 3825349, 3825350)[component],
            'Original direct-minus-assembled source roots changed')
    terms = [{'monomial': row['monomial'], 'coefficient': row['coefficient']}
             for row in prior['reducedNumeratorTerms']]
    require(len(terms) == BASE_COUNTS[component], 'Pinned original remaining numerator count changed')
    supplemental, database = [], None
    candidates = list(Path(context['inputs']).rglob('source-dag-checkpoint.sqlite'))
    prefix_path = None
    for candidate in candidates:
        h = hashlib.sha256()
        with candidate.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1 << 20), b''):
                h.update(chunk)
        if h.hexdigest() == PREFIX_SHA:
            prefix_path = candidate
            break
    if prefix_path:
        database = sqlite3.connect(prefix_path.resolve().as_uri() + '?mode=ro', uri=True)
    def fetch(ident):
        if database is None:
            return None
        row = database.execute('SELECT raw FROM nodes WHERE id=?', (ident,)).fetchone()
        if row is None:
            return None
        node = json.loads(row[0])
        witness = {'sourceNode': ident, 'node': node, 'nodeSHA256': sha(js_bytes(node))}
        supplemental.append(witness)
        checkpoint['sourceWitnesses'].append(witness)
        return node
    try:
        evidence = normalize(terms, checkpoint, fetch)
    finally:
        if database is not None:
            database.close()
    evidence['supplementalSourceWitnesses'] = supplemental
    evidence['supplementalSourceProvenance'] = {'verifiedSQLiteSHA256': PREFIX_SHA if prefix_path else None,
        'originalPrefixOnly': True, 'beyondPrefixRetainedAsPreciseResourceStop': True}
    independent = verify(terms, checkpoint, evidence, verified_database=prefix_path)
    controls = mutation_controls(terms, checkpoint, evidence, verified_database=prefix_path)
    stops = [row for row in evidence['termLedger'] if row['stop']]
    result = {'schema': 'MathScope.N6.CloudExactFunctionalResidual/1', 'component': component,
              'status': 'EXACT_FINITE_FUNCTIONAL_NORMALIZATION_ANALYTIC_AND_CARTESIAN_PROOF_OPEN',
              'sourceRoots': {'direct': prior['directSourceRoot'], 'assembled': prior['assembledSourceRoot']},
              'pinnedRemainingInputTerms': len(terms), 'attemptedOriginalTerms': len(evidence['termLedger']),
              'normalizedNumeratorTerms': len(evidence['normalizedNumerator']),
              'resourceStopsOriginalTermsPreserved': len(stops),
              'termsWithExponentialTransport': sum(bool(r['certificate'].get('exponentialTransports')) and
                  any(t['exponentialFactors'] for t in r['certificate']['exponentialTransports']) for r in evidence['termLedger']),
              'sqrtSquareRewrites': sum(len(r['certificate'].get('sqrtSquareSteps', [])) for r in evidence['termLedger']),
              'priorComponentSHA256': sha(raw), 'sourceCheckpointSHA256': sha(checkpoint_raw),
              'supplementalSourceWitnesses': len(supplemental),
              'verifiedSupplementalSQLiteSHA256': PREFIX_SHA if prefix_path else None,
              'denominatorFactorsOriginal': prior['denominatorFactors'],
              'originalSourceDenominatorOperands': prior['originalSourceDenominatorOperands'],
              'sourceArithmeticProducts': evidence['sourceArithmeticProducts'],
              'independentVerifier': independent, 'negativeControls': controls,
              'residualZeroInConditionalFunctionalRing': not evidence['normalizedNumerator'],
              'allOriginalMonomialsAndFailedAttemptsRetained': True,
              'proofBoundary': {'normalizationDomain': 'original finite defined source operands only; 94 guards retained',
                  'opaqueDerivativesExpanded': False, 'samplesUsedAsProof': False,
                  'originalAnalyticEqualityProved': False, 'wholeCartesianPDEProved': False,
                  'allDenominatorAndSourceDomainsDischarged': False, 'N601Complete': False, 'N602Complete': False},
              'limits': {'maxTermsPerExpansion': MAX_TERMS, 'maxProducts': MAX_PRODUCTS, 'maxRecursionDepth': MAX_DEPTH},
              'elapsedSeconds': time.monotonic() - started}
    write(out / f'residual-component-{component}-certificate.json', evidence)
    write(out / f'residual-component-{component}-result.json', result)
    print(json.dumps({k: result[k] for k in ['component', 'pinnedRemainingInputTerms', 'attemptedOriginalTerms',
                     'normalizedNumeratorTerms', 'termsWithExponentialTransport', 'sqrtSquareRewrites',
                     'resourceStopsOriginalTermsPreserved', 'status']}))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--context', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--component', required=True, type=int)
    args = parser.parse_args()
    run(json.loads(args.context.read_text(encoding='utf8')), args.output, args.component)
