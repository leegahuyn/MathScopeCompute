"""Cross-check the original first-cycle stage receipt against the runner transcript."""

from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import re


STAGES = (
    'original-latest-corollary-8-5-stress',
    'original-signed-162-successor',
    'original-post-signed-temporal-frontier',
    'original-post-signed-exact-temporal',
    'original-post-signed-five-map',
    'original-post-five-physical-residual',
)
DIRECT = 'original-post-five-direct-split'
STOPPED = 'STOPPED_DURING_FIRST_CYCLE'
COMPLETE = 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION'
REFERENCE_PINS = {
    'pr30-source-pins.json': '3f57354aca3da79d475e0bd0605ece51c36cf2633e7744cee35d59efe874b3f7',
    'first-cycle.json': '18bcb6485ac4fcf1ae30dfe1ded334c3f1075d9cdd1f285708ce79da3904b60d',
    'same-family-mode-two.json': 'c41b935776e89691073a40ead9d2f3bfa800540e8c515f6c785016c94612dcbf',
}
HOSTED_RUN = 44528954587
HOSTED_COMMIT = '31c067839c27f7575e53a686a7ec10588b8d1b0b'
HOSTED_FILES = {
    'run.json': '1d9fc7fbc873441a443b7dabd3ad55b04ee914342d8521b0694a8a1b02d5b131',
    'post-signed-options.json': '12057295f2d53325d9358e3e7216d1e7d2c057ab6e55cedacb89e1b9d5ec67e2',
    'signed-frame-tangency.tap': 'fa68898674292dd8cb09ca3f4b2e5cc0d90c1bc93359fed4de85490189b9cc7b',
    'signed-original-cover-and-registry.tap': '0a520494cc661dabe808a9f9fa60e02f2b08cfc51ae3f640af1d8e8b5991fbd7',
    'post-signed-contract.tap': 'e415a9f52242707326ce610bcffef5b5e9cd363483a35783b92ce4a60ea55d02',
}


def check(condition, evidence):
    if not condition:
        raise ValueError(evidence)


def checked_roots(values, count, expected, name):
    check(isinstance(values, list) and len(values) == expected, f'{name}: root count')
    check(all(type(root) is int and 0 <= root < count for root in values), f'{name}: invalid root')


def reference_receipt(reference, name):
    raw = (reference / name).read_bytes()
    check(sha256(raw).hexdigest() == REFERENCE_PINS[name], f'baseline receipt hash: {name}')
    return json.loads(raw)


def stable_stage(row):
    return {key: value for key, value in row.items() if key != 'rssBytes'}


def read_runner_rows(path):
    rows = []
    with path.open(encoding='utf-8') as log:
        for line in log:
            if not line.startswith('{"name":"original-'):
                continue
            row = json.loads(line)
            if row.get('name') in STAGES:
                rows.append(row)
    return rows


def verify(directory, reference):
    digests = {}

    def load(name):
        raw = (directory / name).read_bytes()
        digests[name] = sha256(raw).hexdigest()
        return json.loads(raw)

    cycle = load('first-cycle.json')
    forced = load('same-family-mode-two.json')
    pins = load('pr30-source-pins.json')
    check(digests['pr30-source-pins.json'] == REFERENCE_PINS['pr30-source-pins.json'],
          'original 29-file pin receipt changed')
    check(pins['allMatch'] is True and len(pins['verifiedFiles']) == 29, '29 original source files')
    check(forced['status'] == 'VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED'
          and forced['completeForcedSeal'] is True, 'same live original Forced seal')
    baseline_forced = reference_receipt(reference, 'same-family-mode-two.json')
    checks = forced['full']['checks']
    check(len(checks) == 805 and all(row['pass'] is True for row in checks)
          and Counter(row['id'] for row in checks) ==
          Counter(row['id'] for row in baseline_forced['full']['checks']), 'Forced checks')
    first_count = cycle['sourceForcedNodeCount']
    check(first_count == forced['full']['nodes'], 'Forced graph count mismatch')
    check(cycle['schema'] == 'MathScope.N7.SameLiveN3OriginalFirstCycle/1'
          and cycle['prefix'] == forced['prefix'] == 3, 'first-cycle schema and prefix')
    rows = cycle['stages']
    check(len(rows) >= 3 and tuple(row['name'] for row in rows) == STAGES[:len(rows)], 'stage order')
    check(read_runner_rows(directory / 'native-run.log') == rows, 'receipt and transcript differ')
    with (directory / 'native-run.log').open('rb') as log:
        digests['native-run.log'] = hashlib_file(log)
    counts = [first_count, *(row['nodeCount'] for row in rows)]
    check(all(type(count) is int and count > 0 for count in counts)
          and counts == sorted(counts), 'original graph counts')
    old = reference_receipt(reference, 'first-cycle.json')
    for previous, current in zip(old['stages'], rows[:3], strict=True):
        check(stable_stage(previous) == stable_stage(current),
              f'{current["name"]}: verified prefix changed')
    if len(rows) >= 4:
        temporal = rows[3]
        checked_roots(temporal['inverses'], temporal['nodeCount'], 2, 'two original Temporal inverses')
        checked_roots(temporal['freshPressureAndMeans'], temporal['nodeCount'], 3, STAGES[3])
    if len(rows) >= 5:
        five = rows[4]
        checked_roots(five['freshPressureAndMeans'], five['nodeCount'], 3, STAGES[4])
    if len(rows) == len(STAGES):
        pde = rows[5]
        for name, expected in [('velocity', 3), ('conservativeResidual', 3)]:
            checked_roots(pde[name], pde['nodeCount'], expected, name)
        checked_roots([pde['pressure'], pde['divergence']], pde['nodeCount'], 2,
                      'pressure and divergence')
    result = {'completedSourceStages': list(STAGES[:len(rows)]), 'lastSealedGraphNodes': counts[-1]}
    if cycle['status'] == STOPPED:
        check(cycle['currentStage'] == (*STAGES, DIRECT)[len(rows)], 'unexpected stop location')
        check(type(cycle['stoppedNodes']) is int and cycle['stoppedNodes'] >= counts[-1],
              'invalid stopped graph count')
        check('split' not in cycle and isinstance(cycle['error']['message'], str), 'invalid stop')
        result.update(stoppedAt=cycle['currentStage'], error=cycle['error'],
                      stoppedGraphNodes=cycle['stoppedNodes'])
    else:
        check(cycle['status'] == COMPLETE and len(rows) == len(STAGES)
              and cycle['currentStage'] == DIRECT and 'error' not in cycle, 'incomplete source cycle')
        split = cycle['split']
        check(split['nodeCount'] >= counts[-1] and split['differencesProvedZero'] is False,
              'direct split scope')
        checked_roots(split['roots'], split['nodeCount'], 3, 'direct split')
        checked_roots([split['divergence']], split['nodeCount'], 1, 'direct split divergence')
        result.update(lastSealedGraphNodes=split['nodeCount'], directSplit=split)
    check((cycle['finalJets'], cycle['N706'], cycle['N805'], cycle['release']) ==
          ('0/67', 'OPEN', 'OPEN', 'HOLD'), 'first-cycle receipt must preserve final gate states')
    return {
        'status': cycle['status'], **result, 'originalForcedChecks': 805, 'originalStressChecks': 18,
        'signedIndexedRows': 1620, 'inputSHA256': digests,
        'scope': 'Recorded native source construction with matching original pins, stage transcript, '
                 'and already authenticated graph prefix. Newly reached roots are tracked by source '
                 'index. This readback does not re-evaluate the full graph or prove physical bounds.',
        'N706': 'OPEN', 'N805': 'OPEN', 'finalJets': '0/67', 'release': 'HOLD',
    }


def hashlib_file(file):
    digest = sha256()
    for block in iter(lambda: file.read(1048576), b''):
        digest.update(block)
    return digest.hexdigest()


def bind_hosted_execution(directory, result):
    check(result['status'] == COMPLETE, 'expected completed first-cycle source receipt')
    for filename, expected in HOSTED_FILES.items():
        check(sha256((directory / filename).read_bytes()).hexdigest() == expected, filename)
    run = json.loads((directory / 'run.json').read_bytes())
    check(run['databaseId'] == HOSTED_RUN and run['headSha'] == HOSTED_COMMIT, 'GitHub run source')
    check(run['status'] == 'completed' and run['conclusion'] == 'success', 'GitHub run outcome')
    job, = run['jobs']
    check(job['conclusion'] == 'success', 'source construction job outcome')
    steps = {step['name']: step['conclusion'] for step in job['steps']}
    check(steps['Build the same-family original C8, weighted C6 and Primary C5'] == 'success',
          'complete same-family source construction')
    check(steps['Independently read the selected same-family source graph'] == 'skipped',
          'independent hosted graph status')
    opts = json.loads((directory / 'post-signed-options.json').read_bytes())
    check(opts == {'status': 'PASS_ORIGINAL_THREE_POST_SIGNED_OPTION_CONTRACTS',
                   'positive': 3, 'negative': 3}, 'original post-Signed option probes')
    cases = {'signed-frame-tangency.tap': 10, 'signed-original-cover-and-registry.tap': 106,
             'post-signed-contract.tap': 6}
    for filename, count in cases.items():
        transcript = (directory / filename).read_text(encoding='utf8')
        for pattern in (rf'^[#ℹ] pass {count}$', r'^[#ℹ] fail 0$'):
            check(re.search(pattern, transcript, re.MULTILINE), filename)
    result['hostedRun'] = {'id': HOSTED_RUN, 'headSha': HOSTED_COMMIT, 'conclusion': 'success',
                           'fullGraphIndependentReadback': 'skipped',
                           'verifiedContractTests': cases, 'positiveOptionProbes': 3,
                           'negativeOptionProbes': 3}
    result['inputSHA256'].update(HOSTED_FILES)
    return result


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('artifact', type=Path)
    parser.add_argument('reference', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--hosted-completed', action='store_true')
    args = parser.parse_args()
    result = verify(args.artifact, args.reference)
    if args.hosted_completed:
        result = bind_hosted_execution(args.artifact, result)
    with args.output.open('x', encoding='utf8', newline='\n') as out:
        json.dump(result, out, indent=2)
        out.write('\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
