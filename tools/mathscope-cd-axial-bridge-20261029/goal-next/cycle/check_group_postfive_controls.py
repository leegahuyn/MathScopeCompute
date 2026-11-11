"""Negative controls for the archived first-cycle harmonic projection."""

import argparse
from copy import deepcopy
import json
from pathlib import Path

from group_postfive_residual import REGISTRY_SHA, REACHED_SHA, Source, pinned_json


def expect_rejection(operation):
    try:
        operation()
    except (AssertionError, TypeError, ValueError):
        return True
    raise AssertionError('Source mutation was accepted')


def main():
    if not __debug__:
        raise RuntimeError('Source validation requires Python assertions')
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--reached', type=Path, required=True)
    p.add_argument('--registry', type=Path, required=True)
    a = p.parse_args()
    source = Source(pinned_json(a.reached, REACHED_SHA), pinned_json(a.registry, REGISTRY_SHA))
    source.row_programs()
    source.groups()

    checks = {}
    own = source.expressions['coupled-expression:1216']['body']
    checks['negativeSignWindingUsedForPositiveSign'] = expect_rejection(lambda: source.angular(own, 629400))

    row = source.fields[9]['rows'][0]
    original = deepcopy(row)
    row['derivativeMaps'][-1][0]['parameter'] = 0
    checks['angleDerivativeRedirectedToRadial'] = expect_rejection(source.row_programs)
    row.update(deepcopy(original))
    row['label']['grid'][0] = 0
    checks['frozenGridLabelRebound'] = expect_rejection(source.row_programs)
    row.update(deepcopy(original))
    row['values'][-2] = 0
    checks['thetaActualArgumentDropped'] = expect_rejection(source.row_programs)
    row.update(original)
    source.row_programs()
    print(json.dumps({'checks': checks, 'allRejected': all(checks.values())}, sort_keys=True))


if __name__ == '__main__':
    main()
