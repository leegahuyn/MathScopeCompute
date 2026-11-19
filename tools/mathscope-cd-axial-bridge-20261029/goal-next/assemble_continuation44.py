"""Package the original N4 residual-domain and finite consumer path evidence."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation43 import PARENTS as EARLIER


PARENT = 'a9b8c215e7270e652191fc512a91d8f112a00766'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation43_Delta_20261119.zip':
           '681b66cc3c909417d45f6105c7d9e14ee9c126e5a4d48659b3fbd7eae62e980a'}
Y = 'y-higher-flow/n4-residual-frame/'
CI = 'ci-44538054938/'
PROOF = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/DeepExpEnclosure.lean'
WORKFLOW = '.github/workflows/mathscope-cd-axial-bridge-20261029.yml'
EXTRA = {
    PROOF: '8b5d3bcf4958707ac3cf72ea4d5c32c5a1fedf47d761e1b6d8da857e545c1cc6',
    WORKFLOW: 'a6c415cbcd913e6848d41b3a2c83f3a04f26322dddaf771f12f7126b584b755b',
}
PINS = {
    Y + 'classify_gateways.py': '7e6d36a159c6317e5f1f9fe3b2e708ee85593401d6569ff76142b26752750fd1',
    Y + 'gateway-closure.json': 'ffb665bd31b95354179440012e36d31fdf9a4c31870e99ca3de498a50174782f',
    Y + 'pressure_frame_flow.py': '45033109acb63479be3c60b60fdecf8469ece4ef27dbb7b2e24f06ff0bed69a1',
    Y + 'pressure-flow.json': '802fbb3512741de2416ae9d90b070db66eefe35280680f54d04885ca0e7aed52',
    Y + 'pressure-no-integrals.json': '60a67b75acf675eb6f9a494ae383fb9e330f1a29f145395a33cca902a0d2ec69',
    Y + 'pressure-no-physical-input.json': '4ce8902410307693326262eb4325107dc2be080c3e274d7cff592015ee2780d5',
    Y + 'README.md': '301e438495221d4387b4d1061919ac7d4ac2a10e413b55143e114c9add1a304b',
    CI + 'DeepExpEnclosure.log': 'daa610c928574b34e8fb27ffb29f90a9ba46c852f2fa2b82af5692bace5e4e0e',
    CI + 'run.json': '3fd664208a29cedcc66392c3011995ff3db9a63f8d71ccbc0dcacdcfb4a2010d',
    CI + 'source-sha256.txt': '50b975c7250e521327f19d1ab83b3e1359d6fae2e7737034878f7eff25c1d115',
    CI + 'version.txt': '355a9a028f81641782d75d6e6b58dec70f29d2f61238a9e271690259d9bf5680',
}


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(path))['sha256'] == digest, path
    pressure = source(Y + 'pressure-flow.json')
    assert pressure['status'] == 'PASS_ACTUAL_RESIDUAL_INTEGRAL_INPUT_FLOW'
    assert pressure['sourceNodes'] == 7358162 and pressure['sourceProfileDescendants'] == 182
    assert pressure['activeAncestorNodes'] == 3704 and not pressure['failures']
    assert not pressure['unresolvedNativeKinds']
    assert len(pressure['residualIntegralRoots']) == 8
    assert pressure['pointCallRoots'] == [4599070, 4599199]
    axial, = [row for row in pressure['residualRows'] if row['sourceBody'] == 117047]
    assert axial == {
        'integral': 4599014, 'call': 4599013, 'coordinate': 117055, 'definition': 1,
        'definitionName': 'actual_n1_Tz_forward_integrand', 'sourceBody': 117047,
        'left': 28814, 'right': 4587658,
    }
    assert len(source(Y + 'pressure-no-integrals.json')['failures']) == 122
    assert len(source(Y + 'pressure-no-physical-input.json')['failures']) == 182
    closure = source(Y + 'gateway-closure.json')
    assert closure['status'] == 'PASS_PROFILE_GATEWAY_CLOSURE'
    assert closure['overlap']['verifiedInputGates'] == 29 and closure['profileSites'] == 259
    assert len(closure['rootRows']) == 14 and all(not row['escapedProfileSites'] for row in closure['rootRows'])
    assert sorted(len(row['beforePressureEscapedProfileSites']) for row in closure['rootRows'] if
                  row['beforePressureEscapedProfileSites']) == [174, 179, 179]
    point, = [row for row in closure['physicalEtaCalls'] if row['call'] == 4599199]
    assert point['parameters'] == [4756, 2] and point['actual'] == [4587658, 4587663]
    assert point['definition'] == 1 and point['body'] == 117047
    lean_run = source(CI + 'run.json')
    assert lean_run['databaseId'] == 44538054938 and lean_run['conclusion'] == 'success'
    assert lean_run['headSha'] == '1b8085e4b84a2edcaaf9368410ab4ce65380f44a'
    assert any(s['conclusion'] == 'success' and s['name'] == 'Compile and record proof assumptions'
               for job in lean_run['jobs'] for s in job['steps'])
    assert (EXTRA[PROOF] + '  MathScope/M3/CD/DeepExpEnclosure.lean').encode() in raw(CI + 'source-sha256.txt')
    lean_log = raw(CI + 'DeepExpEnclosure.log')
    assumptions = b'depends on axioms: [propext, Classical.choice, Quot.sound]'
    assert lean_log.count(assumptions) == 4 and b'sorryAx' not in lean_log
    assert b'nested_exp_sum_absorption' in lean_log and b'iterated_exp_small_dyadic_shift' in lean_log
    return {'sourceNodes': 7358162, 'manifestRoots': 14, 'residualCallerContexts': 10,
            'profileIngressGates': 29, 'literalEvenProfiles': 259, 'earlierUncoveredSourceRoots': 3,
            'githubLeanRun': 44538054938, 'githubLeanAxiomReadbacks': 4}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation44',
                   date='20261119', verify=verify_evidence, additional_pins=EXTRA)
