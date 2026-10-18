"""Map the original 16 M4 requirements to scoped, reproducible evidence."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BASE = 'research-ide/mathscope-m4/'
RECOVERY = BASE + 'recovery-20261019/'
TEST_RUN = RECOVERY + 'evidence/attempt5/execution.json'

# These descriptions qualify existing evidence; they do not add acceptance conditions.
MAPPING = {
 'I3-01': ('PARTIAL', ['lean/MathScope/M4/Defs.lean','lean/MathScope/M4/Finite.lean','lean/MathScope/M4/Analytic.lean','lean/MathScope/M4/Comparison.lean','lean/MathScope/M4/Conditional.lean','lean/MathScope/M4/Open.lean','kernel-evidence.mjs'], ['inherited-kernel-evidence','inherited-acceptance'],
   'Six modules exist; exact historical core source/log readback isolates assumedComplete. Its unconditional grade is rejected. The dependency guard rejects open modules and user axioms.',
   ['Original criterion acceptance for the current selected research targets remains unreviewed. Historical kernel scopes are retained separately from full M3.']),
 'I3-02': ('PARTIAL', ['lean/MathScope/M4/Finite.lean','kernel-evidence.mjs'], ['inherited-kernel-evidence','inherited-kernel-contract'],
   'Reused exact scopes: p=2 delta numerator, fixed integer d-squared-zero, identity coefficient endomorphism chain map, primes in [2,30), integer 2x2 brackets, shear plaquette. Historical wrong prime and false rfl are rejected for mathematical reasons.',
   ['These finite targets do not cover arbitrary primes/division precision, nonidentity Frobenius semilinearity, or general gauge holonomy. Keep fixture versus universal target ranges explicit.']),
 'I3-03': ('PARTIAL', ['analytic-obligations.json','lean/MathScope/M4/Defs.lean','lean/MathScope/M4/Analytic.lean','formal-claims.mjs'], ['inherited-kernel-evidence'],
   'Exact norm/metric, domain and quantifiers are stored for the six analytic classes. The precision-metric uniform-limit continuity theorem is rebound to its real archived kernel output.',
   ['Real/Banach/Hilbert derivative-limit, semigroup, spectral measure and stability adapters retain SPECIFICATION_LEAN_IMPORT_MISSING. The same final-field infinite sums still need their own explicit application bindings.']),
 'I3-04': ('PARTIAL', ['analytic-obligations.json','lean/MathScope/M4/Comparison.lean','formal-claims.mjs','acceptance.mjs'], ['inherited-kernel-evidence','inherited-acceptance'],
   'The uniform-continuity adapter uses an exact exported Lean target. Prism/trace/BSD/NS entries remain THEOREM REFERENCE. Reference-only and unrelated target imports cannot close research gates.',
   ['No new exact Lean import for prism, trace formula, known BSD cases or the original NS theorem has been produced in this recovery. Current UI application of this distinction needs inspection.']),
 'I3-05': ('PARTIAL', ['proof-jobs.mjs','recovery-20261019/evidence-session.mjs'], ['inherited-kernel-evidence','semantic-session'],
   'G/delta/p/precision/coefficients/field/assumptions generate new source bindings. One-character source mutation, source digest changes and ABA input reversion invalidate prior runs; imported PASS cannot recover authority.',
   ['The generated Lean target is the declared fixed integer fixture. New parameter-specific mathematical targets still require their own actual kernel execution and UI integration.']),
 'I3-06': ('PARTIAL', ['kernel-evidence.mjs','tools/pinned-kernel-contract.mjs','tools/pinned-kernel-replay.mjs','formal-claims.mjs'], ['inherited-kernel-contract','inherited-kernel-evidence','inherited-acceptance'],
   'Dated official Lean/mathlib and separate core scopes retain compiler exits, warnings, axioms, types, timing, sources, logs and compiled bytes. False rfl and wrong prime controls retain expected nonzero exits.',
   ['No new Lean kernel was executed in this recovery. Current UI must expose exact user-axiom dependencies and environment, and full original acceptance remains unconfirmed.']),
 'I3-07': ('PARTIAL', ['acceptance.mjs','formal-claims.mjs','analytic-obligations.json'], ['inherited-acceptance','inherited-kernel-evidence'],
   'Circular hypotheses, dependency cycles, open nodes, references and user-axiom grade conflicts are rejected. RH/BSD/general-G continuum and new comparison research gates remain OPEN.',
   ['Current full research-graph and UI acceptance is not implied by the scoped structural guard tests.']),
 'I3-08': ('PARTIAL', ['formal-claims.mjs','recovery-20261019/inspect-evidence.mjs'], ['inherited-kernel-evidence','observation-inspection'],
   'Eleven exact core claim views share IDs, scope and assumptions. New stored-observation inspection shares original values, formula, document page, job hashes and null uncertainty between student and expert modes.',
   ['The new inspection adapter is prepared independently; original full browser educational/expert walkthrough acceptance is not yet confirmed.']),
 'R1-01': ('PARTIAL', ['release-lab/catalog.json','release-lab/verify-fixtures.mjs','release-lab/runtime.mjs'], ['semantic-session','observation-inspection','inherited-runtime'],
   'Historical catalog contains thirteen small clean-Worker fixtures. This recovery freshly exercised P1, reference Taylor-Green, prism comparison and delta fixtures through actual installed Workers while checking local equality.',
   ['This scoped replay does not assert a fresh complete thirteen-fixture acceptance or whole original global NS construction. Retained earlier fixture evidence must remain tied to its own source and Worker hashes.']),
 'R1-02': ('PARTIAL', ['release-lab/catalog.json','release-lab/verify-fixtures.mjs'], [],
   'Historical independent tables retain point p-adic precision, local rational-axis series tail, heat exterior display grid, fixed-site lattice spacing, fixed-spacing lattice volume and deterministic delta sample count.',
   ['Identity lattices and display grids are not stochastic continuum certificates. Prior alpha, autocorrelation and independent ensemble-repeat coverage remains absent here; final-field N8-05 is separately OPEN.']),
 'R1-03': ('PARTIAL', ['web/release-lab.js','recovery-20261019/inspect-evidence.mjs'], ['observation-inspection'],
   'New adapter binds selection to own original result fields, exact source bytes and fixed commit URLs. Actual fresh NS reference/prism/delta fixtures pass; traversal, missing uncertainty, mutable branch labels and data corruption are rejected.',
   ['The NS sample is the explicitly labeled reference PDE fixture, not the final native whole-K field. Original source-coefficient, prism and delta UI end-to-end selection must be checked on the production page.']),
 'R1-04': ('PARTIAL', ['release-lab/runtime.mjs','recovery-20261019/evidence-session.mjs'], ['inherited-runtime','semantic-session'],
   'Actual release runtime tests and the new semantic graph tests preserve exact declared descendants, in-flight input changes, cancel/resume original input and import isolation. Camera/layer/selection have a separate view revision.',
   ['The generic graph enforces supplied dependency declarations; it does not infer or prove them. Bind the current production graph to these contracts and verify its UI transitions before original acceptance.']),
 'R1-05': ('OPEN', ['web/panel.js','web/release-lab.js','web/panel.css','web/release-lab.css','web/test-browser.mjs','web/verify-live-panel.mjs'], [],
   'Historical desktop/mobile screenshots and a dated live-page receipt exist. They describe their recorded document hash, not the current page.',
   ['Current desktop/mobile, keyboard, WebGL/CPU fallback, long Korean/formula rendering, color/sample behavior, clipping, interaction latency and memory budgets remain for current production inspection. No historical screenshot is relabeled as current.']),
 'R1-06': ('PARTIAL', ['acceptance.mjs','kernel-evidence.mjs','release-lab/runtime.mjs','recovery-20261019/evidence-session.mjs','recovery-20261019/inspect-evidence.mjs'], ['inherited-acceptance','inherited-kernel-contract','inherited-kernel-evidence','inherited-runtime','semantic-session','observation-inspection'],
   'Forged PASS, source/hash/type/axioms, compiler/log tampering, changed prime evidence, foreign bindings and selection-path attacks are rejected with explicit reason codes; previously valid observations remain usable.',
   ['The exact full force/cutoff mathematical rejection cases remain tied to M3 source-specific evidence; generic hash rejection does not prove those mathematical identities.']),
 'R1-07': ('PARTIAL', ['release-lab/README_KO.md','release-lab/catalog.json','web/release-lab.js'], ['semantic-session','observation-inspection'],
   'Four documented walkthrough subjects and executable fixtures are preserved. New partial clean-Worker replays supply concrete outputs for inspection.',
   ['An independent person has not reproduced all four walkthroughs from the current documentation and current production UI in this recovery.']),
 'R1-08': ('OPEN', ['acceptance.mjs','criteria.mjs','recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json'], ['inherited-acceptance'],
   'Supported finite scopes and global HOLD are separated; forged 16/16 and 64/64 receipts cannot freeze the release. Recovery changes, tests and raw failure history are local and reviewable.',
   ['GitHub commit, CI, publisher version, rollback material and actual current post-publication inspection are separate root-owned steps. None is asserted by this matrix.']),
}


def file_record(relative: str) -> dict:
    path = ROOT / relative
    if not path.is_file():
        return {'path': relative, 'present': False}
    content = path.read_bytes()
    return {'path': relative, 'present': True, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}


def main() -> None:
    original = json.loads((HERE / 'ORIGINAL_M4_CRITERIA.json').read_text())
    run = json.loads((ROOT / TEST_RUN).read_text())
    suites = {row['name']: row for row in run['suites']}
    baseline = json.loads((HERE / 'CAPTURED_BASELINE.json').read_text())
    rows = []
    historical = {
        'I3': [BASE+'evidence/formal-audit-20261014.json', BASE+'evidence/official-linux-success-summary-20261014.json'],
        'R1': [BASE+'release-lab/evidence/run-2026-10-13T175955318Z/manifest.json'],
        'browser': [BASE+'web/evidence/live-20261013095417465/receipt.json'],
    }
    for criterion in original['rows']:
        status, implementation, commands, scope, remaining = MAPPING[criterion['id']]
        checks = []
        for name in commands:
            executed = suites[name]
            checks.append({'suite': name, 'command': executed['command'], 'expected': f"exit 0; {executed['expectedTestCount']} registered assertions pass; no skipped cases", 'result': 'PASS' if executed['pass'] else 'FAIL', 'exitCode': executed['exitCode'], 'counts': executed['counts'], 'evidence': [executed['stdout'], executed['stderr']], 'scope': executed['scope']})
        inherited = list(historical['I3' if criterion['id'].startswith('I3') else 'R1'])
        if criterion['id'] in ['R1-03','R1-05','R1-07','R1-08']:
            inherited += historical['browser']
        rows.append({**criterion, 'status': status, 'originalAcceptance': 'UNCONFIRMED', 'independentPreparation': 'SCOPED_SOFTWARE_VERIFIED' if checks and all(x['result']=='PASS' for x in checks) else 'HISTORICAL_EVIDENCE_AND_REMAINING_REVIEW',
                     'implementation': [file_record(BASE+name) for name in implementation if name != 'recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json'],
                     'tests': checks, 'inheritedEvidence': [file_record(path) for path in dict.fromkeys(inherited)],
                     'freshObservationEvidence': [file_record(RECOVERY+'evidence/observations/'+name) for name in ['manifest.json','taylor-green.json','prism.json','delta.json']] if criterion['id'] in ['I3-08','R1-01','R1-03','R1-07'] else [],
                     'peerReviewEvidence': [file_record(RECOVERY+'evidence/peer_review/'+name) for name in ['OBSERVATION_REVIEW_NEGATIVE_CONTROLS.json','OBSERVATION_REVIEW_AFTER_FIX.json']] if criterion['id'] in ['I3-08','R1-03','R1-06'] else [],
                     'verifiedScope': scope, 'remainingOriginalObligations': remaining,
                     'dependencyBoundary': 'This independently prepared code/dated artifact check does not fulfill the unfinished original M3 whole-K energy and four-axis refinement gates or authorize full M4 release.'})
    assert [x['id'] for x in rows] == [f'{group}-{i:02d}' for group in ['I3','R1'] for i in range(1,9)]
    report = {'schema': 'MathScope.M4.OriginalAcceptanceMatrix/1', 'generatedAt': datetime.now(timezone.utc).isoformat(), 'sourceCommit': baseline['sourceCommit'], 'sourceTree': baseline['sourceTree'],
              'originalSource': original['source'], 'originalCriteria': 16, 'acceptedCurrentRelease': None, 'finalAcceptance': 'UNCONFIRMED', 'overallRelease': 'HOLD',
              'M3': {'accepted':62,'total':64,'open':['N7-06','N8-05'],'actualGlobalLastResolvedTau':None},
              'actualNewLeanExecution':False, 'currentBrowserInspection':False, 'githubSaved':False, 'sitePublished':False,
              'softwareExecution': file_record(TEST_RUN), 'softwareTests': {'tests':run['tests'],'pass':run['pass'],'scope':'Scoped new contracts and inherited guards/dated artifacts; original criteria are not counted from test totals.'},
              'rows':rows, 'nextResume':'Integrate and inspect current UI dependency/provenance contracts; keep mathematical M3 native whole-K gates OPEN. Root records remote save, CI, publication and production inspection separately.'}
    (HERE/'M4_ORIGINAL_ACCEPTANCE_MATRIX.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'originalCriteria':len(rows),'softwareTests':report['softwareTests'],'finalAcceptance':report['finalAcceptance'],'output':str(HERE/'M4_ORIGINAL_ACCEPTANCE_MATRIX.json')}))


if __name__ == '__main__':
    main()
