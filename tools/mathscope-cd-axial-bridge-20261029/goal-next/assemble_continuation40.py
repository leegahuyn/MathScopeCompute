"""Verify and package restricted source, analytic and GitHub Lean results."""

from assemble_continuation39 import PARENTS as EARLIER, assemble_delta, entry, read_arguments


PARENT = 'e7f466e90401b31f26c091a53dc731560d76399b'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation39_Delta_20261117.zip':
           '35af782de186de2db33e8474026ec852cd0b77399f83c23a0cbb942255bee812'}
LEAN_SOURCE = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/InverseChart.lean'
LEAN_SHA = 'de187abf31990895b475536c6c400e796b1d2e8200719972063357043ce804ce'
BUDGET = 'final67/energy-1013-sharp/correction-budget/'
ETA = 'y-higher-flow/n4-eta-frames/'
EXTERIOR = 'final67/exterior-n8-refinement/'
M4 = 'm4/r108-independent-20261117/'
FORCED = 'primary-forced-join/active-n3-c5-binding/endpoint/forced-damping/'
CI = 'ci-44032831080/'
PINS = {
    BUDGET + 'direct-spatial-factor.json': '7c86fed21f4659e56c0679be522b2f419180d0bbbbbbafaa61251bf4456c0dbb',
    BUDGET + 'initialized-budget-direct.json': '6e29a3ec5175259bb1f229b4953b51c1e841da4c32c72c1a442e4e95b5bc8fff',
    ETA + 'eta-frames.json': '37a451cb32f891393803227419e717fdfbdd3118eda1cd12d8501cf4723bef07',
    ETA + 'eta-negative.json': '93803d22bc592401b7e4d4c596fc46bf1c1347216cd9ff6bef1262bccd3fc1e1',
    ETA + 'slow-rows.json': 'b26871ef849518a3da0122fdce016cd77e8be934f8c851c8cc524a1bd1166ced',
    EXTERIOR + 'exterior-n8-refinement.json': '767a47dac5d8a73e2b5b076c4dfc6ed2c4749fc03258e7cc85f05c61cfc7c160',
    FORCED + 'two-pulse-source-windows.json': '347ca74441e6a9861383bb146660b78d559702afc8a443dc900e5d9dc2d2254b',
    FORCED + 'n3-two-actual-pulse-damping-transport.json': 'ebae8e28350f3939cc37f97ae1252ce28a118ddb077ed41852e012ace1be1755',
    FORCED + 'n3-two-actual-pulse-damping-floor.json': 'd691b408fc4c74b374da0f3156625c95b76fd8f82180d0849ead2954f39cf453',
    M4 + 'verified.json': 'a9c4747a795996bcc4b0fa91f274f53b889a742eb0385c71bac3ee4563387f6c',
    M4 + 'public-http-fresh.json': 'a72647ae8f8cbe3ae83eb236c31536f94fefa40623ccf985a154179fdedd150a',
}


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    factor = source(BUDGET + 'direct-spatial-factor.json')
    assert factor['sourceRootRoles']['radialMean'] == 493 and factor['sourceRootRoles']['meanValue'] == 492
    assert factor['initializedReplaySHA256'] == '9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34'
    budget = source(BUDGET + 'initialized-budget-direct.json')
    assert budget['terms'] == 62 and budget['largestTerm']['tauExponent'] == [0, 0]
    assert budget['comparison'] == budget['complementEnvelopeBudgetComparison'] == 1
    assert budget['largestOtherTerm']['factors'][0] == ['A1@2,0,0,0', 1]
    eta = source(ETA + 'eta-frames.json')
    control = source(ETA + 'eta-negative.json')
    assert (eta['naturalTargets'], eta['evenTargets'], eta['ancestryNodes']) == (597, 259, 534870)
    assert eta['coordinateCallCount'] == 21568 and eta['binderFailures'] == 0
    assert control['binderFailures'] == 21568
    rows = source(ETA + 'slow-rows.json')
    assert rows['checkedRows'] == {'global': 243, 'aux': 972}
    exterior = source(EXTERIOR + 'exterior-n8-refinement.json')
    assert exterior['N8_05'] == 'OPEN' and exterior['finalJets'] == 0
    assert exterior['numericAxesWithExactAngularIntegration']['bothMetricWidthsStrictlyNarrowAtDoublePrecision']
    assert exterior['fourierAxis']['cutoffPair'] == [2, 4]
    damping = source(FORCED + 'n3-two-actual-pulse-damping-transport.json')
    assert [row['system'] for row in damping['rows']] == [1, 5]
    floor = source(FORCED + 'n3-two-actual-pulse-damping-floor.json')
    assert floor['priorDampingSHA256'] == PINS[FORCED + 'n3-two-actual-pulse-damping-transport.json']
    audit = source(M4 + 'verified.json')
    assert audit['providerContentReadCodes'] == [402, 402] and not audit['productionPublicationProven']
    public = source(M4 + 'public-http-fresh.json')
    assert public['http'] == 200 and public['bytes'] == 30707818 and public['matchesPriorPublicSnapshot']
    run = source(CI + 'github-run.json')
    assert run['databaseId'] == 44032831080 and run['conclusion'] == 'success'
    assert run['headSha'] == '3b9f429be630ebf58badd4dc6326cc623fa36a86'
    assert f'{LEAN_SHA}  MathScope/M3/CD/InverseChart.lean' in raw(CI + 'source-sha256.txt').decode()
    log = raw(CI + 'InverseChart.log').decode()
    theorems = ('chart_positive_root_recovers_image', 'chart_active_band_scale_bracket',
                'chart_joint_scale_transports_root')
    for name in theorems:
        assert f"'MathScope.M3.CD.{name}' depends on axioms: [propext, Classical.choice, Quot.sound]" in log
    return {'githubLeanRun': 44032831080, 'newLeanTheorems': len(theorems), 'etaBoundCalls': 21568,
            'spatialStencilTerms': 62, 'exteriorAxes': 4, 'actualPulseSystems': [1, 5]}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation40',
                   date='20261117', verify=verify_evidence, additional_pins={LEAN_SOURCE: LEAN_SHA})
