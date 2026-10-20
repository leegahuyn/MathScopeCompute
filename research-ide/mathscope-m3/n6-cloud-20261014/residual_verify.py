"""Independent certificate replay, separate list-of-products arithmetic.

The verifier does not import the worker or use its arithmetic implementation.
It checks original term coverage, every source expansion and the final exact
coefficient sum. Functional identities are conditional on operand definedness.
"""
from __future__ import annotations
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sqlite3

PREFIX_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'


def check(value, reason):
    if not value:
        raise ValueError(reason)


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def combine(entries):
    counts = {}
    for word, value in entries:
        key = tuple(sorted(word))
        counts[key] = counts.get(key, Fraction(0)) + value
    return {word: value for word, value in counts.items() if value}


def product(left, right):
    check(len(left) * len(right) <= 2_000_000, 'Independent verifier product budget exceeded')
    result = combine([(a + b, va * vb) for a, va in left.items() for b, vb in right.items()])
    check(len(result) <= 4096, 'Independent verifier term budget exceeded')
    return result


def source_expansion(ident, nodes, cache, active=None):
    if ident in cache:
        return cache[ident]
    active = set() if active is None else active
    check(ident not in active and len(active) <= 700, 'Cyclic or unbounded source arithmetic')
    active.add(ident)
    node = nodes[ident]
    op, args = node['op'], node['args']
    if op == 'rational':
        number = Fraction(int(args[0]), int(args[1]))
        result = {(): number} if number else {}
    elif op == 'add':
        result = combine([item for child in args for item in source_expansion(child, nodes, cache, active).items()])
    elif op == 'multiply':
        result = {(): Fraction(1)}
        for child in args:
            result = product(result, source_expansion(child, nodes, cache, active))
    elif op == 'integer_power' and isinstance(args[1], int) and 0 <= args[1] <= 256:
        result = {(): Fraction(1)}
        child = source_expansion(args[0], nodes, cache, active)
        # Deliberately use repeated multiplication instead of the worker's
        # binary exponentiation and exponent-map representation.
        for _ in range(args[1]):
            result = product(result, child)
    elif op == 'inverse':
        child = source_expansion(args[0], nodes, cache, active)
        result = {(): 1 / child[()]} if set(child) == {()} else {(ident,): Fraction(1)}
    else:
        result = {(ident,): Fraction(1)}
    active.remove(ident)
    cache[ident] = result
    return result


def read_powers(powers):
    word = []
    previous = None
    for ident, power in powers:
        check(isinstance(power, int) and power > 0 and (previous is None or previous < ident),
              'Noncanonical or repeated certificate factor')
        previous = ident
        word.extend([ident] * power)
    return tuple(word)


def read_poly(rows, label='powers'):
    values = []
    for row in rows:
        value = Fraction(row['coefficient'])
        check(value, 'A zero coefficient was exported as a term')
        values.append((read_powers(row[label]), value))
    result = combine(values)
    check(len(result) == len(rows), 'Duplicate or cancelling certificate monomials')
    return result


def source_word(text):
    if not text:
        return ()
    rows = sorted((int(a), int(b)) for a, b in (piece.split(':') for piece in text.split(',')))
    return read_powers(rows)


def exponent_rows(poly):
    rows = []
    for word, value in poly.items():
        powers = [[ident, word.count(ident)] for ident in sorted(set(word))]
        rows.append({'powers': powers, 'coefficient': str(value)})
    # Worker sorts exponent vectors lexicographically, independent of expanded
    # words. Reconstruct that ordering solely for the committed digest format.
    return sorted(rows, key=lambda row: tuple(tuple(p) for p in row['powers']))


def verify(terms, checkpoint, evidence, verified_database=None):
    supplemental = evidence.get('supplementalSourceWitnesses', [])
    if supplemental:
        check(verified_database is not None,
              'Supplemental witnesses require the independently verified original SQLite prefix path')
        path = Path(verified_database)
        digest = sha256()
        with path.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1 << 20), b''):
                digest.update(chunk)
        check(digest.hexdigest() == PREFIX_SHA ==
              evidence['supplementalSourceProvenance']['verifiedSQLiteSHA256'],
              'Independent supplemental original SQLite hash mismatch')
        database = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True)
        try:
            for witness in supplemental:
                row = database.execute('SELECT raw FROM nodes WHERE id=?', (witness['sourceNode'],)).fetchone()
                check(row is not None and json.loads(row[0]) == witness['node'],
                      'Supplemental witness differs from the exact original SQLite source node')
        finally:
            database.close()
    nodes = {}
    for witness in [*checkpoint['sourceWitnesses'], *supplemental]:
        ident, node = witness['sourceNode'], witness['node']
        check(sha256(compact(node)).hexdigest() == witness['nodeSHA256'], 'Independent source witness hash mismatch')
        check(ident not in nodes or nodes[ident] == node, 'Independent source witness conflict')
        nodes[ident] = node
    for binding in checkpoint['definitionBindings']:
        check(sha256(compact(binding['definition'])).hexdigest() == binding['definitionSHA256'],
              'Independent original registry hash mismatch')
    ledger = evidence['termLedger']
    check(len(ledger) == len(terms), 'An original source term was omitted or duplicated')
    cache, grand_total, stops, transports = {}, {}, 0, 0
    for index, (term, row) in enumerate(zip(terms, ledger)):
        check(row['inputTermIndex'] == index and row['original'] == term, 'Original term index or bytes changed')
        check(sha256(compact(term)).hexdigest() == row['originalSHA256'], 'Original coefficient/source factor hash changed')
        original_word = source_word(term['monomial'])
        original_coeff = Fraction(term['coefficient'])
        if row['status'] == 'RESOURCE_STOP_ORIGINAL_TERM_RETAINED':
            check(row['stop'] and not row['certificate'], 'Resource stop lacks a preserved failure reason')
            check(read_poly(row['normalized'], 'factors') ==
                  {tuple(sorted('S' + str(n) for n in original_word)): original_coeff},
                  'Resource stop altered its original term')
            normalized = read_poly(row['normalized'], 'factors')
            stops += 1
        else:
            check(not row['stop'] and row['status'] == 'EXACT_FUNCTIONAL_IDENTITY_CONDITIONAL_ON_SOURCE_DEFINEDNESS',
                  'Unrecognized proof status')
            sqrt_steps = row['certificate']['sqrtSquareSteps']
            expected_sqrts = {n for n in original_word if nodes[n]['op'] == 'sqrt_positive' and original_word.count(n) >= 2}
            check({s['sourceSqrt'] for s in sqrt_steps} == expected_sqrts and len(sqrt_steps) == len(expected_sqrts),
                  'Sqrt-square certificate omitted or duplicated a factor')
            expansion = {(): original_coeff}
            for ident in sorted(set(original_word)):
                power = original_word.count(ident)
                node = nodes[ident]
                if ident in expected_sqrts:
                    step = next(s for s in sqrt_steps if s['sourceSqrt'] == ident)
                    check(step['originalPower'] == power and step['radicandSource'] == node['args'][0],
                          'Sqrt-square rule changed original source operand')
                    radicand = source_expansion(node['args'][0], nodes, cache)
                    check(read_poly(step['radicandPolynomial']) == radicand, 'Wrong exact radicand expansion')
                    replacement = {(): Fraction(1)}
                    for _ in range(power // 2):
                        replacement = product(replacement, radicand)
                    if power % 2:
                        replacement = product(replacement, {(ident,): Fraction(1)})
                else:
                    replacement = {(ident,) * power: Fraction(1)}
                expansion = product(expansion, replacement)
            certificates = row['certificate']['exponentialTransports']
            check(len(certificates) == len(expansion), 'Functional transport omitted or duplicated an expanded term')
            verified_expansion, normalized_entries = {}, []
            for transport in certificates:
                word = read_powers(transport['preExponentialPowers'])
                coefficient = Fraction(transport['coefficient'])
                check(word in expansion and expansion[word] == coefficient and word not in verified_expansion,
                      'Wrong pre-exponential exact coefficient/source factors')
                verified_expansion[word] = coefficient
                expected_exps = {n for n in word if nodes[n]['op'] == 'exp'}
                exp_rows = transport['exponentialFactors']
                check({e['sourceExp'] for e in exp_rows} == expected_exps and len(exp_rows) == len(expected_exps),
                      'Exponential transport omitted or duplicated an original exp operand')
                exponent_entries, leftover = [], ['S' + str(n) for n in word if n not in expected_exps]
                for item in exp_rows:
                    ident = item['sourceExp']
                    check(item['power'] == word.count(ident) and item['argumentSource'] == nodes[ident]['args'][0],
                          'Wrong original exponential argument or multiplicity')
                    argument = source_expansion(item['argumentSource'], nodes, cache)
                    check(read_poly(item['argumentPolynomial']) == argument, 'Wrong exact exponential argument expansion')
                    exponent_entries.extend((key, value * item['power']) for key, value in argument.items())
                exponent = combine(exponent_entries)
                check(read_poly(transport['combinedExponentPolynomial']) == exponent, 'Wrong combined exact exponent')
                if exponent:
                    signature = exponent_rows(exponent)
                    label = 'E' + sha256(compact(signature)).hexdigest()
                    check(evidence['virtualAtoms'][label]['exponentPolynomial'] == signature, 'Wrong canonical exponential atom')
                    leftover.append(label)
                out_word = tuple(sorted(leftover))
                check(read_powers(transport['outputFactors']) == out_word, 'Wrong transported output factor')
                normalized_entries.append((out_word, coefficient))
                transports += len(exp_rows)
            normalized = combine(normalized_entries)
            check(read_poly(row['normalized'], 'factors') == normalized, 'Wrong normalized term coefficient/source factors')
        grand_total = combine([*grand_total.items(), *normalized.items()])
    check(read_poly(evidence['normalizedNumerator'], 'factors') == grand_total,
          'Final numerator differs from independent exact term sum')
    return {'status': 'INDEPENDENT_CERTIFICATE_REPLAY_PASS', 'originalTermsChecked': len(terms),
            'supplementalWitnessesComparedToVerifiedOriginalDatabase': len(supplemental),
            'preservedResourceStops': stops, 'exponentialFactorsChecked': transports,
            'remainingNumeratorTerms': len(grand_total), 'arithmetic': 'independent repeated-word Fraction products',
            'analyticallyDefinedSourceOperandsProved': False, 'wholeCartesianPDEProved': False}
