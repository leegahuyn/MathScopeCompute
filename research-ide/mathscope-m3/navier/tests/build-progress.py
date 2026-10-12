"""Exact current blueprint criteria and conservative per-criterion assessment."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import fitz

ROOT = Path(__file__).resolve().parents[4]
M3 = ROOT / 'research-ide/mathscope-m3'
SOURCE = Path('/workspace/scratch/5a8728de776c/upload/MathScope_Research_IDE_Blueprint_v1_KO(1)(20261012-061419).pdf')
OLD = json.loads((M3 / 'ORIGINAL_M3_M4_CRITERIA.json').read_text())
OLD_ROWS = {x['id']: x for x in OLD['criteria']}
PACKAGES = {'N6': 62, 'N7': 64, 'N8': 66}
# PASS means the original criterion in its expressly generic branch, never an
# analytic all-order paper reconstruction. Every remaining item stays visible.
DETAILS = {
'N6-01': ('OPEN', 'The inherited uncorrected primary/curl/residual roots and exact source namespace are pinned. The required actual j=0 state has not been constructed.', ['Apply temporal mean and five-moment corrections to the actual full-curl primary state.', 'Recompute its pressure and establish the original B0,C0 and cumulative class bounds with constants.'], ['source-inheritance.json','source-mean-map.mjs']),
'N6-02': ('PARTIAL', 'The complete quadratic finite Fourier residual identity is executed, with an omitted-square negative control. The updated paper state and pressure are not yet inputs.', ['Compute the full actual PDE residual and its split after each real source update.', 'Carry old flat tails and every new quadratic/curl term through the same pressure reconstruction.'], ['galerkin.mjs','evidence/acceptance.json']),
'N6-03': ('PARTIAL', 'All pairwise harmonics of a declared finite set are enumerated; truncation without a bound is held. The projected equation (7.13) is solved on an explicit finite coefficient model and compared to an exact ODE.', ['Derive all coefficient sources from the actual same-label full state.', 'Use original smooth phase/coefficient jets and supported full curls, including their commutators and mode tails.'], ['corrections.mjs','evidence/N6-harmonic.json']),
'N6-04': ('PARTIAL', 'The signed finite inverse fixes positive base amplitudes and retains the increment square and all three remainder families. Original M2 H/a roots are separately pinned.', ['Feed the actual updated signed stress into the authentic original covariance inverse.', 'Construct the physical correction and verify all current-state cross/curl/square remainders and derivative classes.'], ['corrections.mjs','source-inheritance.json','evidence/N6-signed.json']),
'N6-05': ('PARTIAL', 'The actual vt=(sqrt(2)-1,1) algebraic divisor is rationalized with a nonzero integer norm; real finite Fourier inputs are inverted, and mean/divisor/tail guards execute.', ['Compute the actual source Fourier coefficients and its C^(m+4) constants.', 'Realize the axial potential and retain the radial cutoff remainder in the new physical pressure/residual.'], ['corrections.mjs','evidence/N6-workbench.json']),
'N6-06': ('PARTIAL', 'The actual unmodified M2 mean patch executes through its original helpers. Original positive lambda/a, five disjoint source profiles, enclosed positive moments, angular inverse and lambda-factored axial inverse are installed; this closes the fixed inverse dependency. A separate finite five-integral example also executes.', ['Compute P,Jtheta,Jz from the complete current curl state.', 'Apply the source map to those defects and reconstruct pressure by (8.12).', 'Recompute (8.26)-(8.27) including all current means and attach the required derivative constants.'], ['source-mean-map.mjs','evidence/N6-source-mean.json','evidence/N6-moments.json']),
'N6-07': ('PARTIAL', 'Exact rational exponent inequalities and the fixed-domain obligation are tracked. No empirical slope is promoted to class membership.', ['Instantiate one common qbig and actual source derivative constants for every finite stage.', 'Compute the stage field, physical derivative losses and retained tails on that same domain.'], ['corrections.mjs','evidence/N6-workbench.json']),
'N6-08': ('OPEN', 'The finite-stage/local-field distinction is enforced. The source correction sequence and its final cutoff sum are absent.', ['Construct the actual finite correction sequence.', 'Choose shrinking cutoffs with differentiated summable tails and perform the Lemma5.4 fixed-stage comparison.', 'Store active indices and the omitted-tail bound for each evaluated domain.'], ['index.mjs','source-inheritance.json']),
'N7-01': ('PARTIAL', 'An explicit fixed cutoff-support inequality inside qstar/2 and smooth r-squared/z cutoff recipe are installed. The original qstar and final local field are pending.', ['Use the completed N6 local A,B,p and its original qstar.', 'Evaluate the fixed compact support, zero initial interval and unit cutoff near the origin with actual source constants.'], ['localization.mjs','evidence/N7-workbench.json']),
'N7-02': ('PARTIAL', 'The product rule curl(cA)=c curl A+grad(c) cross A and full residual requirement are encoded; no complete source commutator computation is claimed.', ['Localize the actual N6 potentials and pressure.', 'Compare the directly evaluated full force to every cutoff commutator with a numerical error budget.'], ['localization.mjs']),
'N7-03': ('PARTIAL', 'The force-divergence term is retained in the pressure contract and separately tested in the finite Galerkin branch. Nonzero div f is accepted.', ['Verify the pressure identity on the same actual localized source force without altering that force by projection.'], ['localization.mjs','galerkin.mjs','evidence/N8-acceptance.json']),
'N7-04': ('OPEN', 'Finite input jets are explicitly distinct from an all-order force extension; the actual terminal source jets do not exist yet in this reconstruction.', ['Construct terminal Fj from the actual localized residual.', 'Establish the original all-order differentiated limits and flat origin conditions.'], ['localization.mjs','evidence/N7-workbench.json']),
'N7-05': ('PARTIAL', 'A finite conditional jet-bound input produces increasing bj satisfying the requested differentiated cutoff inequalities. It is not a velocity extension.', ['Supply all actual terminal jets and certified derivative constants.', 'Prove and bind the complete differentiated infinite tail and compact support through t=2.'], ['localization.mjs','evidence/N7-workbench.json']),
'N7-06': ('OPEN', 'The generic periodic solver records whole-domain energy and a time defect, but it is not the source compact K energy calculation.', ['Integrate the localized paper field and force on all of K.', 'Refine space and time independently and compare with the original (10.13) force-norm bound.'], ['galerkin.mjs','evidence/N8-TG.json']),
'N7-07': ('OPEN', 'Positive tau and source scaling are preserved symbolically. No measured growth is called an analytic blowup certificate.', ['Evaluate the original Xin path using the reconstructed velocity.', 'Bind a positive e0 lower bound and an explicit O(tau^(2h)) remainder constant.'], ['localization.mjs','evidence/N8-nearT.json']),
'N7-08': ('PARTIAL', 'The disjoint translated support, same-forcing/data, viscosity and periodic-pressure guards execute, including an overlap rejection.', ['Apply the comparison and viscosity scaling to the actual source field, force, pressure and energy hypotheses.', 'Construct the shrunken disjoint translated solution and preserve its full assumptions.'], ['localization.mjs','evidence/N7-periodic.json']),
'N8-01': ('PASS', 'The independent 2pi-periodic Galerkin branch validates divergence and conjugate symmetry initially and at every accepted step, treats the zero mode separately and recovers pressure with div f.', [], ['galerkin.mjs','evidence/N8-acceptance.json','evidence/N8-TG.json']),
'N8-02': ('PASS', 'Every retained direct convolution interaction is included. Independently implemented padded 3D FFT agrees below 1e-11; an aliased high-mode negative control fails as intended, with an independent NumPy comparison.', [], ['galerkin.mjs','evidence/acceptance.json','evidence/independent-numpy.json']),
'N8-03': ('PASS', 'The IMEX method uses diffusion stability, advection CFL, embedded step-doubling and an energy-defect acceptance gate. Taylor-Green amplitude and energy converge at order two under timestep halving.', [], ['galerkin.mjs','evidence/N8-acceptance.json','evidence/independent-numpy.json']),
'N8-04': ('PARTIAL', 'Exact decimal positive tau is preserved independently of rounded t, including 1e-2,1e-4,1e-8,1e-12,1e-40,1e-1000. Source normalized scales are carried symbolically.', ['Evaluate the actual reconstructed normalized velocity and physical scaling at these source-admissible points.', 'Supply a precision mode with source interval/tail bounds, not coordinates alone.'], ['localization.mjs','evidence/N8-nearT.json']),
'N8-05': ('PARTIAL', 'Finite Galerkin runtime budgets and last resolved time are reported. Independent FFT, time and NumPy checks execute, but the original pulse/coefficient precision refinement is absent.', ['Create independent source grid, Fourier cutoff, coefficient order and arithmetic precision comparisons.', 'Record the actual core/axial/pulse scales, active cutoffs, rigorous tail bound and last resolved positive tau.'], ['galerkin.mjs','evidence/acceptance.json','evidence/independent-numpy.json']),
'N8-06': ('PARTIAL', 'The actual finite Fourier run exports 81 positions/vectors, whole periodic energy curves, fixed bounds, units, color range, vector scale and linked hashes. The observed public N8 scene matches these 81 source samples, the z=0 slice, separate full periodic domain, common color range and actual vector multiplier 0.3. Keyboard/LOD preserve the mathematical digest. Complete paper-source observations remain unavailable.', ['Provide complete normalized/source views and explicit streamlines/particle, velocity/angular-velocity, core/whole-energy distinctions on the reconstruction path.'], ['index.mjs','evidence/N8-TG.json']),
'N8-07': ('PARTIAL', 'The result distinguishes source lineage, finite numerical execution, analytic certificate and Lean theorem. Missing analytic/Lean evidence remains null; forged formal authority and view mutations are rejected.', ['Complete per-observation links across the source reconstruction and current UI.', 'Provide the actual interval-specific error enclosures and refinement proof before any certified-approximation label.'], ['index.mjs','evidence/acceptance.json']),
'N8-08': ('PARTIAL', 'Source bytes, implementation hash, inputs, bases, domain, schedules, pressure/energy, scene contract and replay are exported. Public browser import freshly recomputes to MATCH and restores the selected source, camera and LOD; direct reload preserves the N8 route, and edited input blocks stale-result reuse. Independent local builder tests and NumPy checks validate the finite branch. A full paper reconstruction package is unavailable; no new hosted CI result is claimed here.', ['Add all source constants, precision/coefficient cutoffs, rigorously controlled tails and actual reconstruction runs.', 'Do not inherit the blueprint drafting-turn note as a claim about this implementation session.'], ['tests/build-source-inheritance.py','tests/run.mjs','tests/independent_numpy.py','source-inheritance.json','implementation-pin.mjs','evidence/acceptance.json']),
}


def attach_live_ui_evidence(row):
    """Attach observed UI bytes only; this does not promote a source criterion."""
    checks_by_criterion = {
        'N8-06': ['N8-import-fresh-replay-view-restore', 'N8-keyboard-LOD-source-invariance'],
        'N8-08': ['N8-direct-reload-startup-route', 'N8-import-fresh-replay-view-restore', 'edited-input-and-stale-result-protection'],
    }
    expected = checks_by_criterion.get(row['id'])
    if expected is None:
        return
    path = M3 / 'evidence/live-ui/acceptance.json'
    raw = path.read_bytes()
    receipt = json.loads(raw)
    checks = {check['id']: check for check in receipt['checks']}
    assert all(checks[identity]['pass'] is True for identity in expected)
    row['evidence'] += ['evidence/live-ui/acceptance.json', 'web/extended-view-contract.mjs', 'web/tests/extended-worker.test.mjs']
    if row['id'] == 'N8-08':
        row['evidence'] += ['web/build_extended.py', 'web/tests/test_extended_build.py', 'CI_EXECUTION_WORKSPACES.md']
    row['liveVerification'] = {
        'receipt': 'evidence/live-ui/acceptance.json',
        'receiptSHA256': hashlib.sha256(raw).hexdigest(),
        'receiptCheckCount': len(receipt['checks']),
        'relevantCheckIDs': expected,
        'observedVersions': sorted({checks[identity].get('version', receipt['observedVersion']) for identity in expected}),
        'sourceReconstructionComplete': False,
        'originalCriterionPromoted': False,
    }


def compact(text):
    return re.sub(r'\s+', '', text).replace('-\n','')


def main():
    doc = fitz.open(SOURCE)
    raw_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    comparisons = []
    for package, page in PACKAGES.items():
        text = doc[page-1].get_text()
        matches = list(re.finditer(r'□('+package+r'-\d\d) \| ([^\n]+)\n', text))
        assert len(matches) == 8
        rows=[]
        for i, match in enumerate(matches):
            criterion_id, title = match.groups()
            end = matches[i+1].start() if i+1<len(matches) else text.index('패키지판정:', match.end())
            body = text[match.end():end].strip()
            old = OLD_ROWS[criterion_id]
            same_title = compact(title) == compact(old['title'])
            same_body = compact(body) == compact(old['text'])
            comparisons.append({'id':criterion_id, 'sameTitleIgnoringWhitespace':same_title, 'sameTextIgnoringWhitespace':same_body})
            status, scope, remaining, evidence = DETAILS[criterion_id]
            rows.append({'id':criterion_id,'title':old['title'] if same_title else title,'text':body,'page':page,'source':SOURCE.name,
                         'status':status,'originalCriterionComplete':status=='PASS','assessedAt':now,'assessedBy':'MathScope M3 Navier implementation review',
                         'evidence':['navier/'+x for x in evidence],'remaining':remaining,'remainingObligations':remaining,'acceptanceScope':scope,
                         'genericBranchOnly':criterion_id in ('N8-01','N8-02','N8-03'),
                         'comparisonWithInheritedOriginal':{'source':OLD['source'],'sameTitleIgnoringWhitespace':same_title,'sameTextIgnoringWhitespace':same_body}})
            attach_live_ui_evidence(rows[-1])
        record={'schema':f'MathScope.M3.{package}.Progress/1','status':{'N6':'PARTIAL_SOURCE_RECONSTRUCTION','N7':'BLOCKED_BY_N6_LOCAL_FIELD','N8':'GENERIC_GALERKIN_EXECUTED_RECONSTRUCTION_PARTIAL'}[package],
                'sourceBlueprint':{'source':SOURCE.name,'sha256':raw_hash,'pageCount':len(doc),'checklistPage':page,'sourceExtraction':'PyMuPDF exact page text; spaces in the displayed title may be inherited only when the text agrees ignoring whitespace.'},
                'sourcePaper':{'url':'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf','sha256':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'},
                'P7Changed':False,'M2Changed':False,'originalCriterionCount':8,'completedOriginalCriteria':sum(x['originalCriterionComplete'] for x in rows),
                'criteria':rows,'allOriginalCriteriaComplete':all(x['originalCriterionComplete'] for x in rows),'wholeM3Complete':False}
        (M3/f'{package}_PROGRESS.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    review={'source':SOURCE.name,'sha256':raw_hash,'inheritedSource':OLD['source'],'inheritedSHA256':OLD['sha256'],'comparisons':comparisons,
            'all24AgreeIgnoringWhitespace':all(x['sameTitleIgnoringWhitespace'] and x['sameTextIgnoringWhitespace'] for x in comparisons)}
    (M3/'navier/evidence/blueprint-source-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(review,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
