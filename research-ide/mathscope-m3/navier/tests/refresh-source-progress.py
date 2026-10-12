"""Refresh the 24 existing Navier assessments without editing original criteria.

The exact blueprint fields and all statuses are preserved. In particular the
new finite N8 observation code does not promote N8-06 before live UI review.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

ROOT = Path(__file__).resolve().parents[4]
M3 = ROOT / 'research-ide/mathscope-m3'
PREFIX = 'navier/evidence/source-current-20261012/'
GATE = PREFIX + 'source-current-execution.json'
SOURCE = 'navier/SOURCE_RECONSTRUCTION_KO.md'
EXACT = ('id', 'title', 'text', 'page', 'source')
BLUEPRINT = 'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac'

# No item is promoted by this metadata refresh. Full original acceptance
# depends on the obligations below, not on the number of successful helpers.
DETAILS = {
    'N6-01': (
        'The unchanged common6 source constructor has actually run. Its selected original band/member full curl, all six angular/Haar covariances, current P/J, and full auxiliary-torus pressure are reconstructed. Both original pulse systems have finite C4/C5 variations. This is still the pre-initialization state; Proposition9.5 j=0 has not been constructed.',
        ['Assemble the required original bands and labels, then apply the actual temporal-mean and five-moment updates.', 'Recompute full pressure after both updates and establish the exact B0=0.7, C0*=1.2 and (9.9)-(9.10) class constants.'],
        [GATE, PREFIX+'current-state.json', PREFIX+'full-pressure.json', PREFIX+'higher-pulse-jets.json', SOURCE]),
    'N6-02': (
        'The generic finite Fourier quadratic residual identity and omitted-square control remain passing evidence. The actual selected source now has complete initial auxiliary pressure with A0 retained; its signed wave update retains previous-curl, new-curl and square terms, recalculates all six mean covariances and reconstructs the updated mean pressure before Etheta/Ez. An independent complete physical PDE jet comparison after every source substep is not present.',
        ['Construct full auxiliary pressure after the actual signed update and after every later correction substep.', 'Compare independent complete physical PDE evaluation with the full decomposed source residual, including the old flat tail, every quadratic product and explicit error budgets.'],
        [GATE, PREFIX+'full-pressure.json', PREFIX+'current-signed-stress.json', 'navier/evidence/acceptance.json', SOURCE]),
    'N6-03': (
        'The finite harmonic ledger and independent projected ODE example remain separate from source reconstruction. Both authentic original pulse matrices now generate C4/C5 slow jets, their coefficient/time derivative FTC bodies, noncommuting 112-component variational systems and retained factorial ordered-integral tails. This closes the derivative-kernel dependency for the selected signed curl, not the actual complete current nonzero-harmonic correction.',
        ['Derive the complete same-label current harmonic coefficients from the updated source field.', 'Solve their actual projected transport equations and realize supported physical curls with commutators and justified mode tails.'],
        [GATE, PREFIX+'higher-pulse-jets.json', 'navier/source-higher-jets.mjs', 'navier/evidence/N6-harmonic.json', SOURCE]),
    'N6-04': (
        'A target is now derived from the actual current Etheta/Ez and P/J using retained Corollary8.5 radial inverses. The original H and positive a remain fixed. Both source-signed potential curls and their shared derivative bodies are constructed, all three (7.41) remainder families and new squares are retained, and updated full mean covariances/P/J are formed. The selected member has the correct eta_beta^2*Sigma principal identity; the global Sigma identity is not claimed for one member.',
        ['Assemble the complete source partition and verify the global averaged B(W0,L Sigma)=Sigma identity.', 'Apply this update to the initialized current stage with full pressure after the substep, and prove its original support/edge and all-order derivative-class bounds.'],
        [GATE, PREFIX+'current-signed-stress.json', 'navier/source-signed-stress.mjs', SOURCE]),
    'N6-05': (
        'The exact algebraic divisor for vt=(sqrt(2)-1,1) and a declared finite Fourier inverse remain implemented. The actual full-torus initial pressure and residual expressions are now available as source inputs, and C5 pulse slow derivatives are retained. Neither those slow jets nor a finite Fourier fixture supply the required complete auxiliary Fourier coefficients and C^(m+4) tail constants.',
        ['Compute the actual zero-mean source coefficients and the original divisor/extra-four-derivative bounds for each required order.', 'Realize the axial potential and divergence-compatible radial update with A1 and all cutoff remainders retained in the next actual pressure/residual.'],
        [GATE, PREFIX+'full-pressure.json', PREFIX+'higher-pulse-jets.json', 'navier/evidence/N6-workbench.json', SOURCE]),
    'N6-06': (
        'The original positive-lambda five-moment inverse was already connected to unchanged M2 helpers. Current P,Jtheta,Jz are now reconstructed from the selected complete primary curl, and recalculated after the actual signed update; full initial pressure and updated mean pressure are present. The five-moment inverse has not yet been applied to these current defects, so the two conservation equations and nonlinear (8.26)-(8.27) result are not asserted for a corrected stage.',
        ['Apply the authentic fixed mean map to these current defects after the temporal update.', 'Recompute the complete updated pressure and both conservation integrals, then verify (8.26)-(8.27) with all nonlinear current means and the original lambda-conditioned derivative bounds.'],
        [GATE, PREFIX+'current-state.json', PREFIX+'current-signed-stress.json', 'navier/source-mean-map.mjs', 'navier/evidence/N6-source-mean.json', SOURCE]),
    'N6-07': (
        'The rational exponent ledger remains exact. The actual source execution retains the original positive lambda/h, original first admissible band/member, fixed radial integration envelope, coefficient FTC norms and explicit Volterra tails. These are finite selected-chart constructions; no common all-stage qbig or all-order Km,ell_m and logarithmic constants have been proved.',
        ['Establish one common original qbig and all required constants for the complete initialized correction stages.', 'Carry every physical derivative loss and differentiated tail on that fixed domain; do not infer the order theorem from sample residual changes.'],
        [GATE, PREFIX+'higher-pulse-jets.json', PREFIX+'current-signed-stress.json', 'navier/evidence/N6-workbench.json', SOURCE]),
    'N6-08': (
        'A genuine selected source signed update now exists, but the initialized correction sequence and shrinking-cutoff local sum are still absent. The browser summary records the exact heavy execution and its limitations; it is not a new constructor execution or a Lemma5.4 certificate.',
        ['Construct the complete finite correction sequence from the actual j=0 state.', 'Choose and differentiate the shrinking cutoffs, prove their summable tails and perform the fixed-stage Lemma5.4 comparison.', 'Store the actual active indices and rigorously omitted tail for every evaluation domain.'],
        [GATE, PREFIX+'current-signed-stress.json', 'navier/source-current-evidence.mjs', SOURCE]),
    'N7-01': (
        'The explicit cutoff-support inequality and smooth r^2/z recipe remain executable. The new selected N6 pressure/signed construction is not a final local A,B,p sum, so it does not yet supply the original qstar, compact K or initial zero interval.',
        ['Complete N6 local A,B,p and its original qstar.', 'Apply the fixed compact cutoff and verify the initial zero interval and exact unit cutoff near the origin with actual source constants.'],
        ['navier/localization.mjs', 'navier/evidence/N7-workbench.json', GATE, SOURCE]),
    'N7-02': (
        'The curl(cA)=c curl A+grad(c) cross A contract still retains every cutoff derivative. New source curls are pre-localization finite expressions; the complete localized source force and its independent commutator evaluation have not been produced.',
        ['Localize the complete actual N6 potentials and pressure.', 'Evaluate full f and all cutoff commutators independently on the same source, preserving structural divergence freedom and explicit error budgets.'],
        ['navier/localization.mjs', GATE, SOURCE]),
    'N7-03': (
        'The actual initial source pressure now retains the auxiliary radial remainder. Separately, the localization contract and finite periodic tests preserve -Delta p=partial_i partial_j(ui uj)-div f and allow nonzero div f. A complete localized source force has not yet been used in that identity.',
        ['Verify the pressure identity for the exact same localized actual force and full source velocity.', 'Retain its forcing, support and pressure assumptions without applying an arbitrary force projection.'],
        ['navier/localization.mjs', 'navier/galerkin.mjs', 'navier/evidence/N8-acceptance.json', PREFIX+'full-pressure.json', SOURCE]),
    'N7-04': (
        'C4/C5 jets of the original pulse ODE are now actually constructed. They are slow pulse coefficient derivatives on a selected interior chart, not terminal time jets of the localized residual. No all-order terminal extension or flatness at the origin is inferred.',
        ['Construct Fj from the complete actual localized residual as t approaches1.', 'Prove the original differentiated terminal limits and origin flatness for every required spatial/time order.'],
        ['navier/localization.mjs', PREFIX+'higher-pulse-jets.json', GATE, SOURCE]),
    'N7-05': (
        'A finite conditional input of jet bounds still produces increasing bj satisfying the declared differentiated cutoff constraints. The real source terminal Fj sequence and its complete infinite tail are absent, so compact all-order extension through t=2 is not claimed.',
        ['Supply the actual terminal jets and certified derivative constants.', 'Bind the complete differentiated infinite tail, compact support and all certified jet joins through t=2.'],
        ['navier/localization.mjs', 'navier/evidence/N7-workbench.json', SOURCE]),
    'N7-06': (
        'The separate periodic Galerkin observation layer now distinguishes physical whole-box energy integrals from a fixed user-defined core box, with independent midpoint refinement and time-integration evidence. It does not integrate the localized paper field and force on the required compact K.',
        ['Evaluate energy and force work for the actual localized source on all of K.', 'Refine its space and time independently and establish consistency with the original nu=1 force-norm bound (10.13).'],
        ['navier/flow-observations.mjs', 'navier/tests/flow-observations.test.mjs', 'navier/evidence/N8-TG.json', SOURCE]),
    'N7-07': (
        'Positive tau and exact symbolic paper scaling remain available. The new finite source expression graph is not a numerical enclosure of the complete original blowup path, and no positive e0 bound or tau-remainder constant has been supplied.',
        ['Evaluate the original Xin path using the complete reconstructed velocity.', 'Bind a strictly positive source e0 lower bound and an explicit O(tau^(2h)) constant before an analytic growth certificate.'],
        ['navier/localization.mjs', 'navier/evidence/N8-nearT.json', GATE, SOURCE]),
    'N7-08': (
        'Support separation, same force/data, viscosity and periodic-pressure guards still execute. The current partial N6 construction does not provide the complete local solution and energy hypotheses required by the original comparison, rescaling and disjoint periodization results.',
        ['Apply comparison and viscosity rescaling to the same complete actual field, force, pressure and energy hypotheses.', 'Construct the shrunken disjoint source translates and retain every original assumption.'],
        ['navier/localization.mjs', 'navier/evidence/N7-periodic.json', SOURCE]),
    'N8-01': (
        'The independent 2pi-periodic Fourier Galerkin branch still validates divergence, conjugate symmetry and zero mode initially and at each accepted step, with div f in pressure recovery. The new bounded accepted-state history is independently checked to leave the final integrator coefficients bit-for-bit unchanged. This domain is explicitly separate from the paper whole-space field.',
        [], ['navier/galerkin.mjs', 'navier/evidence/N8-acceptance.json', 'navier/evidence/N8-TG.json', 'navier/tests/flow-observations.test.mjs']),
    'N8-02': (
        'All retained direct convolution interactions and the separately implemented padded FFT remain compared below1e-11. The high-mode aliasing omission is rejected, and independent NumPy output is preserved. The observation changes do not alter this numerical kernel.',
        [], ['navier/galerkin.mjs', 'navier/evidence/acceptance.json', 'navier/evidence/independent-numpy.json']),
    'N8-03': (
        'The existing IMEX method retains advection CFL, embedded step doubling and energy-defect acceptance. Taylor-Green amplitude and energy show the intended second-order time refinement, independently checked with NumPy. New path integration has its own distinct error estimate and does not substitute for the solver acceptance gate.',
        [], ['navier/galerkin.mjs', 'navier/evidence/N8-acceptance.json', 'navier/evidence/independent-numpy.json', 'navier/flow-observations.mjs']),
    'N8-04': (
        'Exact positive decimal tau and log coordinates remain preserved down to1e-1000 even when displayed t rounds to1. The new normalized periodic box coordinates are explicitly x/(2pi), not the original q-scaled source coordinates. Actual near-terminal source velocity and precision enclosures remain unavailable.',
        ['Evaluate the reconstructed source velocity in the original normalized coordinates and apply its physical scaling.', 'Supply interval/tail-controlled precision modes at the original source-admissible tau examples.'],
        ['navier/localization.mjs', 'navier/evidence/N8-nearT.json', 'navier/flow-observations.mjs', SOURCE]),
    'N8-05': (
        'The finite solver reports its numerical resource limits; the new observation layer separately compares midpoint core quadrature and coarse/fine RK4 paths and bounds stored coefficient history with explicit decimation. These finite diagnostics do not provide the original independent grid/Fourier/coefficient/precision source refinement table or a rigorous omitted tail.',
        ['Resolve actual source core/axial/pulse scales and active cutoffs with independent grid, Fourier, coefficient and arithmetic-precision refinements.', 'Attach rigorous source tail bounds and a last-resolved positive tau with an explicit failure reason.'],
        ['navier/galerkin.mjs', 'navier/flow-observations.mjs', 'navier/evidence/independent-numpy.json', SOURCE]),
    'N8-06': (
        'New actual finite-run observations preserve81 sample positions/vectors, fixed physical bounds and a separately declared normalized periodic view. They distinguish instantaneous final-time streamlines from coefficient-history particle paths, velocity from origin-dependent axial angular velocity (undefined on axis), and whole-box Parseval energy from fixed-core midpoint energy. Original settings and output are input/run-hash bound; independent Taylor-Green trajectory, periodic seam, axis, quadrature and tamper tests pass. Public UI verification of these newly added controls is still pending; the earlier81-point UI receipt remains historical.',
        ['Verify every new physical/normalized, streamline/pathline, velocity/angular-velocity and core/global UI control on the published version.', 'Confirm actual scene positions, units, color range and fixed vector scale remain bound during import, selection and replay without automatic vector normalization or spatial fitting.'],
        ['navier/index.mjs', 'navier/flow-observations.mjs', 'navier/tests/flow-interface.test.mjs', 'navier/tests/flow-observations.test.mjs', PREFIX+'fast-tests.log', SOURCE]),
    'N8-07': (
        'Each new flow observation carries source-definition/finite-test metadata and explicit null analytic/Lean proof fields. Error indicators are not called certified enclosures. The N6 source summary separately exposes the actual recorded heavy execution, original hashes and remaining proof duties; browser replay only recreates this summary. Mutating paths, settings or claim authority is rejected.',
        ['Finish per-observation reference, numerical-test, analytic-certificate and Lean links throughout the published reconstruction UI.', 'Require interval-specific error enclosures and hypotheses before using any certified-approximation label.'],
        ['navier/index.mjs', 'navier/flow-observations.mjs', 'navier/source-current-evidence.mjs', 'navier/tests/flow-interface.test.mjs', GATE, SOURCE]),
    'N8-08': (
        'The new source gate preserves original source dependency bytes, actual command/log, exact graph/artifact hashes and finite scope. The N8 flow record includes integrator and observation settings, accepted coefficient history/decimation, trajectory integration/refinement, coordinates and core quadrature. Hash-bound local replay rejects edits. Existing cross-environment NumPy and historical public import evidence remain distinct from a new hosted source execution; the complete paper reconstruction package still does not exist.',
        ['Bind all remaining source constants, coefficient/precision cutoffs and rigorously controlled tails to actual complete reconstruction runs.', 'Verify the final newly published UI and its exported camera/scene contracts, then attach the actual new CI result without treating historical runs as the new commit.'],
        ['navier/tests/build-source-inheritance.py', 'navier/tests/build-source-current-evidence.py', 'navier/source-inheritance.json', 'navier/implementation-pin.mjs', 'navier/tests/flow-interface.test.mjs', 'navier/evidence/independent-numpy.json', GATE, SOURCE]),
}


def main():
    raw = (M3/GATE).read_bytes()
    receipt = json.loads(raw)
    assert receipt['pass'] is True and receipt['gate']['exitCode'] == 0
    now = datetime.now(timezone.utc).isoformat()
    totals = {'PASS': 0, 'PARTIAL': 0, 'OPEN': 0}
    for package in ('N6', 'N7', 'N8'):
        path = M3/(package+'_PROGRESS.json')
        record = json.loads(path.read_text())
        assert record['sourceBlueprint']['sha256'] == BLUEPRINT
        exact_before = [{k: row[k] for k in EXACT} for row in record['criteria']]
        statuses = [(r['status'], r['originalCriterionComplete']) for r in record['criteria']]
        assert [r['id'] for r in record['criteria']] == [f'{package}-{i:02}' for i in range(1,9)]
        for row in record['criteria']:
            expected = ('PASS' if row['id'] in ('N8-01','N8-02','N8-03') else
                        'OPEN' if row['id'] in ('N6-01','N6-08','N7-04','N7-06','N7-07') else 'PARTIAL')
            assert row['status'] == expected, 'A later acceptance review exists; do not overwrite it with this pre-live-UI assessment: '+row['id']
            scope, remaining, evidence = DETAILS[row['id']]
            assert all((M3/p).exists() for p in evidence), row['id']
            row.update(acceptanceScope=scope, remaining=remaining, remainingObligations=remaining,
                       evidence=list(dict.fromkeys(row['evidence']+evidence)), assessedAt=now,
                       assessedBy='MathScope actual source and finite observation review')
            totals[row['status']] += 1
        assert exact_before == [{k: row[k] for k in EXACT} for row in record['criteria']]
        assert statuses == [(r['status'], r['originalCriterionComplete']) for r in record['criteria']]
        record['assessmentRevision'] = 'm3-navier-actual-source-and-flow-20261012'
        record['actualSourceExecution'] = {'receipt': GATE, 'sha256': hashlib.sha256(raw).hexdigest(),
                                         'browserSummaryIsRecordedOnly': True,
                                         'completeN6': False}
        record['completedOriginalCriteria'] = sum(r['originalCriterionComplete'] for r in record['criteria'])
        path.write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'pass': True, 'originalFieldsAndStatusesPreserved': True, 'totals': totals}))


if __name__ == '__main__':
    main()
