#!/usr/bin/env python3
"""Independent, read-only source/record scope map; no new mathematical gate verdict."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

IDE = Path('/workspace/scratch/9a6c38c54c2e/MathScopeCompute/research-ide')
NAV = IDE / 'mathscope-m1/navier'
OUT = Path(__file__).resolve().parent
AX = 'mathscope-m1/navier/followup-20261010-same-datum-axis/'
GL = 'mathscope-m1/navier/followup-20261010-symbolic-gluing/'
ST = 'mathscope-m1/navier/followup-20261010-final-stress-audit/'
OR = 'mathscope-m1/navier/followup-20261010-outer-reselection/'
TR = 'mathscope-m1/navier/followup-20261010-comparator-transport/'

def digest(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def read(rel: str):
    return json.loads((IDE / rel).read_text())

def dump_new(path: Path, value):
    with path.open('x') as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
        f.write('\n')

for filename in ['theorem46-clause-map.json', 'THEOREM46_SCOPE_REVIEW.md', 'reviewer-receipt-0001.json']:
    if (OUT / filename).exists():
        raise SystemExit(f'Refusing to overwrite {filename}')

checks = []
def check(label, value, **details):
    checks.append({'id': label, 'pass': bool(value), **details})

sources = {}
before = {}
def source(key, path, role, locator='', expected=None):
    p = Path(path) if str(path).startswith('/') else IDE / path
    data = p.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    before[str(p)] = sha
    if expected:
        check('source_pin_' + key, sha == expected, actual=sha, expected=expected)
    record = {'id': key, 'path': str(path), 'kind': 'suppliedPDF' if p.suffix == '.pdf' else 'repositoryFile',
              'sha256': sha, 'bytes': len(data), 'role': role}
    if locator:
        record['locator'] = locator
    sources[key] = record
    return record

assessment_path = ST + 'ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json'
assessment = read(assessment_path)
assembly_path = GL + 'attempts/one-profile-0002/receipt.json'
assembly = read(assembly_path)
formal_path = ST + 'formal-connection-review/0001/receipt.json'
formal = read(formal_path)

source('paper', '/workspace/scratch/afa9cd11a21b/upload/01-navier-stokes.pdf',
       'Primary mathematical statement and construction implications',
       'Theorem 4.6 pp.32–34; A.2 pp.129–130; Proposition C.3 pp.163–165',
       '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f')
for key, label in [('blueprintPDF', 'Original acceptance scope'), ('handoffPDF', 'Inherited remaining conditions')]:
    p = assessment[key]
    source(key, p['path'], label, p['locator'], p['sha256'])
source('originalAcceptance', 'mathscope-m1/evidence/original-acceptance.json', 'Unchanged original 70 criteria',
       'N1-05, N1-06 and N3-01–N3-08', '854f67efad0f6d0cda7ab784611e5352b753ddd297fbac5a1382f4032ba02dc2')
source('gateContract', 'docs/NS_GATES_EN.md', 'Unchanged original closure checklists',
       'N1-05, N1-06 and N3-01–N3-07', '57e993971939ef47ad5d81506e3e568ff256c4621bc5ade091c6e089ba895080')
source('assessment69', assessment_path, 'Existing dated 69/1 assessment; no mutation',
       'Eight requested gates PASS; N1-06 PARTIAL')
source('assembly', assembly_path, 'Actual same-profile parameter and analytic evidence attachment',
       'attachedAnalyticConclusions and acceptedEvidence',
       '184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd')
source('assemblyReview', ST + 'assembly-review/0001/receipt.json', 'Independent source/assembly review',
       expected='88be5819de32ac188351c594f6de85c35498eb3fa3f20e97692191e156ce653a')
source('formalReview', formal_path, 'Later actual N3-03 premise/finite-array connection review',
       'originalN303ConditionsSatisfied and actual same-profile identification',
       'a78d75334b66b5468415840d1963ef62f28862b1f0a82ddef2b8a285e7dc146a')

assembly_pins = {x['path']: x['sha256'] for x in assembly['evidenceInputs']}
for i, entry in enumerate(assembly['evidenceInputs']):
    p = NAV / entry['path']
    check(f'assembly_input_{i}', digest(p) == entry['sha256'], path=entry['path'])
    snapshot = (IDE / assembly_path).parent / entry['snapshot']
    check(f'assembly_snapshot_{i}', digest(snapshot) == entry['sha256'], path=entry['snapshot'])
for key, entry in assembly['acceptedEvidence'].items():
    source(key, 'mathscope-m1/navier/' + entry['path'], 'Accepted same-profile component: ' + key,
           expected=entry['sha256'])

docs = {
    'profileSpecification': (GL + 'ONE_PROFILE_SPECIFICATION.md', 'Exact final construction and geometry', '§§1–5; §6 is historical formal status'),
    'axisProof': (AX + 'SAME_DATUM_ANALYTIC_AXIS.md', 'Actual infinite axis, positivity and core identities', '§§2,4,6–9; historical formal gap is discharged by formalReview'),
    'continuationProof': (AX + 'CONTINUATION_AND_NEW_DEBT.md', 'Same final C member, B.22/B.26/B.34 and actual incoming debt', '§§2,5–9'),
    'referenceProof': (AX + 'REFERENCE_DERIVATIVE_BOUNDS.md', 'Actual reference derivative bounds', 'Finite derivative/Bell tables and actual width choice'),
    'sourceProof': (AX + 'GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md', 'Actual global source envelope S=C^100000', 'Whole J, actual B.8 root and mixed derivatives'),
    'outerProof': (OR + 'OUTER_DERIVATION.md', 'Actual new A.2 outer schedule, roots, moments and A.21 datum', '§§2–6,8–11'),
    'heatProof': (ST + 'HEAT_COMPENSATION_PROOF_EN.md', 'Actual A.7 replacement, all-eta I2 compensation and terminal factorization', '§§1–6, equations H5, H13–H14, H23–H27'),
    'gapProof': (ST + 'B8_AND_PRELOOP_GAPS_EN.md', 'Actual B.8 partial moments and whole preloop lower gaps', '§§2–7'),
    'activationProof': (ST + 'ACTIVATION_COLLAR_BOUNDS_EN.md', 'Actual preserved analytic inner collar and direction margin', 'B.29/B.30 and fixed C^-120 widths'),
    'loopProof': (GL + 'LOOP_DERIVATIVE_ENVELOPE.md', 'Actual original C.1 loop derivative envelope', 'S-to-R derivative construction and smooth extensions'),
    'frequencyProof': (GL + 'C12_FREQUENCY_CONTRACT.md', 'One finite N, continuous modulation debt and I1 exact restoration', 'N=1+ceil(R^50), kappa=R^-10'),
    'stressProof': (ST + 'GLOBAL_STRESS_ASSEMBLY_EN.md', 'Same final stress, closed-annulus direction, flatness, support and patches', '§§1–6; S7–S14 and endpoint factorizations'),
    'formalReviewProof': (ST + 'FINAL_FORMAL_CONNECTION_REVIEW_2026_10_10_EN.md', 'Actual selected Lean object equals written infinite axis', '§§1–5, uniqueness and finite-array domain/error connection'),
    'formalProducerProof': (AX + 'formal-input-producer/ACTUAL_PRODUCER_COMPLETED.md', 'Completed actual input producer, without caller norm premises', 'Actual selected input/operator/fixed-point chain'),
    'blueprintScopeReview': (ST + 'BLUEPRINT_HANDOFF_AUDIT_KO.md', 'Independent interpretation of original blueprint and handoff', '§§3–5, including the N3-08 evidence-or-unresolved distinction'),
    'assemblyGenerator': (GL + 'assemble_one_profile.py', 'Historical flag production semantics', 'Hard-coded false flag while N3-03 and N1-06 were open'),
    'assessment68Generator': (ST + 'write_gate_assessment.py', 'Historical separate 68/2 assessment semantics', 'Separate fullOriginalTheorem46CertificationFlag and entireNewProfileLeanFormalized'),
    'assessment69Generator': (ST + 'write_final_gate_assessment.py', 'Historical separate 69/1 assessment semantics', 'N3-03 complete; N1-06 remains; both full-scope flags false'),
}
for key, (path, role, locator) in docs.items():
    navpath = path.removeprefix('mathscope-m1/navier/')
    expected = assembly_pins.get(navpath) or formal['inputsSHA256'].get(path)
    source(key, path, role, locator, expected)

formal_files = {
    'freshPrefix': GL + 'formal-clean-replay/attempts/0001/receipt.json',
    'freshExtension': GL + 'formal-clean-replay/extension-attempts/0001/receipt.json',
    'freshImportReview': AX + 'formal-input-producer/replay-independent-audit/attempts/0001/receipt.json',
    'actualMixedBinding': AX + 'independent-review/actual-mixed-eta-binding-001.json',
    'selectedProducer': GL + 'formal-clean-replay/attempts/0001/ConcreteProducer.lean',
    'selectedRecurrence': GL + 'formal-clean-replay/attempts/0001/ConcreteJetRecurrence.lean',
}
for key, path in formal_files.items():
    expected = formal['inputsSHA256'].get(path)
    check('formal_record_pins_' + key, expected is not None)
    source(key, path, 'Actual source/kernel or array connection: ' + key, expected=expected)

source('terminalAuditor', TR + 'verify_n106_terminal_artifact.py', 'Frozen actual terminal Comparator acceptance checker; no current result inferred',
       'Exact 35 stages, original protections, final nanoda/Lean/Quot and actual terminal status',
       '81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef')
source('terminalBinding', TR + 'terminal-auditor-inputs/actual-run-binding.json', 'Exact pending production run and source binding',
       'run 38014602021 / job 114101981614 / commit 55dacb898f8c204bf0c5925ea901d75d6c2d0f46',
       '5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab')

same = {
    'sourcePaperSHA256': sources['paper']['sha256'],
    'parameterExpressionSHA256': assembly['parameterExpressionSHA256'],
    'profileEvidenceSHA256': assembly['profileEvidenceSHA256'],
    'assemblyReceiptSHA256': sources['assembly']['sha256'],
    'formalCompletionReviewSHA256': sources['formalReview']['sha256'],
    'originalLeanCommit': 'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
    'originalLeanToolchain': 'Lean 4.34.0-rc2',
}
check('exact_parameter_identity', same['parameterExpressionSHA256'] == 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152')
check('exact_profile_identity', same['profileEvidenceSHA256'] == 'ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206')
check('assessment_same_parameter_identity', assessment['parameterExpressionSHA256'] == same['parameterExpressionSHA256'])
check('assessment_same_profile_identity', assessment['profileEvidenceSHA256'] == same['profileEvidenceSHA256'])
check('formal_same_parameter_identity', formal['exactParameterExpressionSHA256'] == same['parameterExpressionSHA256'])
check('assembly_record_pass', assembly['passed'] == assembly['total'] == 292)
check('formal_record_pass', formal['status'] == 'PASS' and formal['passed'] == formal['total'] == 883 and formal['originalN303ConditionsSatisfied'])
check('existing_only_N106_open', assessment['remainingGateIds'] == ['N1-06'])
check('existing_eight_fulfilled', sum(g['currentStatus'] == 'PASS' for g in assessment['gates']) == 8)
check('existing_flag_preserved_false', assessment['fullOriginalTheorem46CertificationFlag'] is False)
check('entire_profile_Lean_scope_false', assessment['entireNewProfileLeanFormalized'] is False)

def refs(*keys):
    return [sources[k] for k in dict.fromkeys(keys)]

def clause(roman, title, obligations, derivation, roles, gates, quantitative, limitation):
    return {
        'clause': roman, 'title': title,
        'sourceStatement': {'sourceId': 'paper', 'locator': 'Theorem 4.6(' + roman + '), pp.32–34'},
        'requirementSummary': obligations,
        'sameFinalProfileBinding': same,
        'finding': 'SUPPORTED_IN_THE_ORIGINAL_LEADING_PROFILE_ACCEPTANCE_SCOPE',
        'derivation': derivation,
        'quantitativeOrExactWitnesses': quantitative,
        'originalGateConnections': gates,
        'evidenceLevel': 'WRITTEN_ANALYTIC_PROOFS_WITH_EXECUTED_CONTINUOUS_INTERVAL_AND_EXACT_CHECKS; ACTUAL_LEAN_CONNECTION_FOR_THE_AXIS_COMPONENT',
        'limits': limitation,
        'sourceRefs': refs('paper', 'profileSpecification', 'assembly', 'assemblyReview', 'formalReview', *roles),
    }

clauses = [
    clause('i', 'Finite-radius smoothness, Cartesian axis, common inner analyticity and normalized pressure',
       ['F=phi/C, U, Pi and V0/X are smooth on every finite radial rectangle, including one-sided boundary derivatives of every fixed mixed order.',
        'phi>0 and E=sqrt(2X)F>0 for X>0; the Cartesian field extends smoothly across the axis.',
        'One fixed Xan in (Xa,Xb) preserves a common complex eta neighborhood for the scalars and each fixed radial derivative.',
        'The inner collar has the positive directional margin of clause (iii).',
        'Pi(X,eta)=-integral_X^infinity E(x,eta)^2/(2x) dx for the final field.'],
       ['The original coefficient space, selected actual pressure and amplitude give one smooth infinite axis; the actual kernel fixed point is identified with the written construction by uniqueness in the same invariant ball.',
        'B.22/B.26 preserve the common analytic inner rectangle; all later modifications start farther right. The smooth continuous implicit roots and one fixed finite N give finite mixed derivative bounds on each remaining finite rectangle.',
        'The actual heat integral is smooth on its nonnegative argument domain, including the one-sided eta endpoints. Analyticity of that far heat factor is not required.',
        'B.8, I2 and I1 restore the same pressure moment exactly, so forward pressure from the original A.21 Pi0 equals the complete backward integral for the final E.'],
       ['axisProof', 'axis', 'formalReviewProof', 'selectedProducer', 'freshPrefix', 'freshExtension', 'freshImportReview', 'actualMixedBinding',
        'continuationProof', 'continuation', 'sourceProof', 'sourceEnvelope', 'b8', 'heatProof', 'heat', 'activationProof', 'frequencyProof', 'frequency', 'stressProof', 'stress'],
       ['N3-02', 'N3-03', 'N3-04', 'N3-05', 'N3-06', 'N3-07'],
       {'Xa': '4/Lambda', 'Xan': 'Xa*exp(t1/16)', 'axisSpaceRadius': 'rho=sigmaStar^2/65536',
        'actualAxisPositivity': 'Phi>1/4 on 0<=Y<=4.1 for the whole real source window',
        'pressureDatum': 'The literal complete A.21 integral, not its finite approximation'},
       ['The 125-entry numerical chart is |eta|<=rho/4; it is not the whole real-eta domain. Whole-domain regularity is an analytic conclusion.',
        'The complex xi disk |xi|<=1/16 belongs only to the comparison function, not to an enlarged nonlinear holomorphy domain.']),
    clause('ii', 'Exact leading identities and exact annular stress support',
       ['Pi_X=E^2/(2X), with the smooth extension Pi_X=F^2 at X=0.',
        'The exact tangential residual identities of Proposition 4.2 hold with physical stress q^(-A-1/2)T0.',
        'The same T0 vanishes for X<=Xa and X>=Xb and is nonzero at every Xa<X<Xb.',
        'The exact core equations (4.13) hold on 0<=X<=Xa.'],
       ['Termwise integration and the full nonlinear fixed-point equation give the exact core pressure, incompressibility and leading tangential identities; the regular integrated sources are unique and give ps=(a,-bs), hence T0=0 through Xa.',
        'The final pressure and cumulative sources are defined from the corrected fields. Proposition 4.2 applies as an exact algebraic/differential identity of those profiles.',
        'The restored exterior moments and exact heat solution give zero backward stress beyond Xb by A.8. The explicit global stress lower bound proves nonzero stress at every interior point.'],
       ['axisProof', 'axis', 'formalReviewProof', 'selectedProducer', 'selectedRecurrence', 'core', 'coreReview',
        'heatProof', 'heat', 'frequencyProof', 'frequency', 'stressProof', 'stress'],
       ['N3-03', 'N3-04', 'N3-05', 'N3-07'],
       {'coreRecovery': 'Y=Lambda*X; F=g*Phi; U=Ustar+u/Lambda; Pi=Pi0+p/Lambda',
        'V0': '(X/L)*(2*eta*U-2*D*eta*A_X(U)-d*d_eta A_X(U))',
        'stressSupport': '[Xa,Xb] with T0=0 at and outside both endpoints',
        'interiorLower': '|T0|>=min(C^-11,R^-8)*zeta>0'},
       ['These are the original leading-profile residual identities. Axial viscosity and later physical PDE terms are not asserted to vanish.',
        'A finite near-zero residual is not the evidence for exact identity.']),
    clause('iii', 'Positive closed-annulus factors, smooth endpoint direction and one uniform cone margin',
       ['F, a and vs-2 have positive lower bounds on the entire closed annulus.',
        'n=T0/|T0| extends smoothly to both radial endpoints.',
        'One fixed 0<kappa<2 satisfies both inequalities (4.26) everywhere on the closed annulus.',
        'The inner direction is parallel to (a,-bs); the outer direction is (1,0) with bs=0.'],
       ['The actual partial moments, implicit B.8 root and preserved collars supply all preloop positive gaps; the full source derivative bound supplies the C.1 loop envelope.',
        'For the single selected finite N, continuous C.12 debt and exact I1 restoration yield the final interior gaps. The unchanged inner and outer regions have separately quantified margins.',
        'The inner factorization T0=e_a*B0 with B0 nonzero and the outer factorization exp(-4/delta_o^2)*(delta_o^-3*btheta,delta_o^3*bz), with btheta positive, define the endpoint directions without a zero-over-zero evaluation.',
        'The same final positive continuous F,a,vs-2 extend through the endpoints; the recorded bounds and compactness at fixed parameters supply positive lower bounds.'],
       ['sourceProof', 'sourceEnvelope', 'sourceReview', 'gapProof', 'relaxedGaps', 'gapReview', 'activationProof',
        'loopProof', 'loop', 'frequencyProof', 'frequency', 'loopReview', 'heatProof', 'heat', 'stressProof', 'stress'],
       ['N3-01', 'N3-05', 'N3-06', 'N3-07'],
       {'S': 'C^100000', 'R': 'exp(S^256)', 'N': '1+ceil(R^50)', 'kappa': 'R^-10',
        'rawGapsOnAffectedJ': 'at least 1/(2R) after the actual I1 repair',
        'preservedInnerMargin': '1/2', 'preservedExteriorMargin': 'at least C^-2 before terminal collar; 1/2 on terminal collar'},
       ['The selected N is finite and fixed before physical q and every later band. No N-to-infinity uniformity is claimed.',
        'The numerical/analytic global cone is not claimed to be wholly re-formalized in Lean.']),
    clause('iv', 'One flat weight, a uniform positive stress lower constant and every fixed derivative order',
       ['One smooth radial zeta is positive in the annular interior, zero outside and flat at both edges.',
        'There is one c>0 independent of the multi-index alpha with |T0|>=c*zeta.',
        'For every fixed alpha there are finite C_alpha,m_alpha with |d^alpha T0|<=C_alpha*zeta*delta^(-m_alpha), delta=min(1,log(X/Xa),log(Xb/X)).'],
       ['The recorded exact two-ended exponential weight has a smooth flat zero extension.',
        'The inner collar, affected region J, unaffected outer interval and terminal collar have explicit stress lower bounds on overlapping regions; their minimum is the same positive c.',
        'Differentiating the two actual endpoint factorizations introduces only finite inverse distance powers. On the remaining compact middle, all fixed derivatives are finite and zeta has a positive lower bound, at the one fixed N.'],
       ['activationProof', 'heatProof', 'heat', 'stressProof', 'stress', 'frequencyProof', 'frequency'],
       ['N3-06', 'N3-07'],
       {'zeta': 'exp(-t1^2/log(X/Xa)^2-4/log(Xb/X)^2) on (Xa,Xb), zero elsewhere',
        'c': 'min(C^-11,R^-8)>0, independent of alpha',
        'derivativeQuantifier': 'Every fixed multi-index; constants may depend on that order and on the single fixed profile'},
       ['The theorem asks for finite constants at each fixed derivative order, not a single simultaneous bound for all orders.',
        'The proof uses exact smooth factorizations; finite plotted samples alone are not used.']),
    clause('v', 'All convergent exterior moments, the exact heat tail and a zero-axial outer collar',
       ['M(infinity)=J(infinity)=S(infinity)=0 and the convergent integral of H-Hpow is zero for all eta.',
        'Hpow=sqrt(2X)*c_infinity*X^(-A) with one positive eta-independent c_infinity.',
        'For X>=Xb, U=V0=0 and E=c_infinity*X^(-A)*Hheat(2d/X), where Hheat is the stated gamma integral.',
        'The physical swirl is the exact radial heat solution; Hheat is positive and smooth for its nonnegative argument including the one-sided endpoint at zero.',
        'One fixed Xv in (Xa,Xb) has U=V0=0 on [Xv,infinity).'],
       ['The actual outer angular reset, two linear pulse moment corrections and unique positive pulse-amplitude root give the original four convergent moment identities, with the same literal A.21 pressure datum.',
        'The actual continuous heat replacement and I2 root restore the three changed moments; M and J are unchanged identically. B.8 joins the actual axis to those moments and the later I1 equations restore every modulation moment.',
        'After each complete repair, equality of fields and all five cumulative quantities propagates by Lemma 4.4. It retains the exact exterior heat solution and pressure normalization.',
        'Take Xv=Xend, the original pulse-end radius. After it, U=M=0; A_X(U)=M/X and its eta derivative vanish, so the exact formula (4.7) gives V0=0. No later operation changes U or M there.'],
       ['outerProof', 'outer', 'outerPulse', 'outerBinding', 'continuationProof', 'continuation', 'b8', 'heatProof', 'heat',
        'c2', 'frequencyProof', 'frequency', 'pressure', 'pressureTailReview', 'stressProof', 'stress'],
       ['N3-02', 'N3-05', 'N3-06', 'N3-07'],
       {'Xv': 'Xend = XR*exp(T+2+60*B+13/lambda), B=1000*T (same original pulse endpoint, not a new parameter selection)',
        'heatIntegral': 'Hheat(Z)=1/Gamma(1+h)*integral_0^infinity exp(-v)*v^h*(1+Z*v)^(-h) dv',
        'pressureRestoration': 'exact total Cp differences zero at B.8, I2 and I1',
        'cInfinity': 'Positive eta-independent tail coefficient fixed by the same completed literal outer schedule'},
       ['The heat integral and continuous moment equations, not a finite-radius surrogate, define the exact tail.',
        'The renormalized angular integral subtracts Hpow before integration; the two divergent integrals are not evaluated separately.']),
    clause('vi', 'Two ordered, disjoint and untouched later correction patches',
       ['Fixed disjoint Ipos and Imean satisfy sup(Ipos)<inf(Imean) and both lie in (Xa,Xv).',
        'On both intervals U=0 and E=c_patch*(1+eta^2)^(-1)*X^(-1/2-lambda), with one positive constant independent of X and eta.',
        'The leading-profile construction leaves both field patches unchanged for the later positive-order and averaged-flow corrections.'],
       ['The original third and fourth reserved constant-slope intervals become Ipos and Imean for the same new Xc and B.',
        'The loop ends before I1; the modulation repair uses only I1, and the heat compensation uses only I2. The far heat change and all pulse/terminal edits also avoid the two reserved intervals.',
        'Therefore both final fields retain the unmodified constant-slope power law. Their cumulative moments may carry upstream corrections; clause (vi) requires preservation of the stated fields, not historical values of every cumulative moment.'],
       ['outerProof', 'outer', 'heatProof', 'heat', 'frequencyProof', 'frequency', 'stressProof', 'stress'],
       ['N3-02', 'N3-06', 'N3-07'],
       {'X0ofb': 'Xc*exp(60*B-b), Xc=XR*exp(T+2)',
        'Ipos': '(X0(14), X0(14)*exp(5))', 'Imean': '(X0(8), X0(8)*exp(5))',
        'order': '60B-9 < 60B-8 < 60B-3 < 60B+13/lambda',
        'power': '-1/2-lambda', 'etaFactor': '(1+eta^2)^(-1)'},
       ['No positive-order or averaged-flow correction is performed by this leading-profile acceptance.',
        'Preserved field patches are not confused with unmodified upstream cumulative moments.']),
]

mapping = {
    'schema': 'mathscope.independent.theorem46-acceptance-scope-map.v1',
    'generatedUTC': datetime.now(timezone.utc).isoformat(),
    'status': 'SCOPE_MAPPING_OF_EXISTING_FROZEN_EVIDENCE; NOT_A_NEW_TERMINAL_COMPARATOR_RESULT',
    'sameFinalProfileBinding': same,
    'theoremScope': 'ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE',
    'profileDomain': 'X>=0 and every eta in [-1,1]; fixed profile parameters independent of physical q and later bands/stages',
    'flagInterpretation': {
        'field': 'fullOriginalTheorem46CertificationFlag',
        'meaning': 'ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE',
        'recommendedValueInANewAssessmentAfterEveryRequiredActualResult': True,
        'currentValueChangedByThisReview': False,
        'existingAssessmentValue': False,
        'entireNewProfileLeanFormalized': False,
        'requiredBeforeAnyNewTrueAssessment': [
            'All original nine/70 criteria satisfied under the unchanged original contract; retain the original eight current PASS sourceRefs and their exact hashes.',
            'The same parameter/profile identities, attached assembly evidence and actual formal connection receipt remain byte-bound.',
            'Every Theorem 4.6(i)–(vi) obligation is supported by this same final profile, as mapped here; an evidence-or-unresolved placeholder is insufficient.',
            'The actual protected production Comparator reaches the required terminal success with the original guard/kernel/source/nanoda/type/axiom conditions and exact source/run binding, then passes the frozen terminal auditor.',
            'The new assessment preserves prior false/partial records and explicitly states the leading-profile meaning and separate whole-profile Lean limitation.'
        ],
        'excludedInferences': [
            'Every continuation, global cone and stress proof was wholly re-formalized in Lean.',
            'All 125 interval operations were individually reexecuted by the Lean kernel.',
            'The whole all-eta nonlinear jet graph was directly numerically evaluated.',
            'A complete time-dependent Navier–Stokes solution was reconstructed here.',
            'The forcing is removed (f=0), or velocity is smooth through t=1.'
        ],
        'semanticBasisSourceRefs': refs('originalAcceptance', 'gateContract', 'blueprintPDF', 'handoffPDF', 'blueprintScopeReview',
                                        'profileSpecification', 'assemblyGenerator', 'assessment68Generator', 'assessment69Generator', 'assessment69', 'formalReviewProof'),
    },
    'executionBoundary': {
        'newKernelExecutionsPerformedByThisReview': 0,
        'newComparatorExecutionsPerformedByThisReview': 0,
        'currentTerminalCompletionClaimed': False,
        'historicalCancelledRun': '37979127351: incomplete; original probe/final Comparator success missing.',
        'successfulGuardDiagnosticRun': '38013278865: actual guard transport A/B evidence only; no full Comparator execution.',
        'boundProductionRun': '38014602021', 'boundProductionJob': '114101981614',
        'boundProductionCommit': '55dacb898f8c204bf0c5925ea901d75d6c2d0f46',
        'terminalAcceptanceSourceRefs': refs('terminalBinding', 'terminalAuditor'),
    },
    'clauses': clauses,
    'sourceCatalog': sources,
}

check('exact_six_clause_coverage', [c['clause'] for c in clauses] == ['i', 'ii', 'iii', 'iv', 'v', 'vi'])
for c in clauses:
    check('same_profile_clause_' + c['clause'], c['sameFinalProfileBinding'] == same)
    check('nonempty_obligations_clause_' + c['clause'], bool(c['requirementSummary']) and bool(c['derivation']) and len(c['sourceRefs']) >= 8)
check('not_current_completion', mapping['executionBoundary']['currentTerminalCompletionClaimed'] is False)

memo = r'''# Independent interpretation of the Theorem 4.6 completion flag

## Decision and conditions

A **new dated assessment may set** `fullOriginalTheorem46CertificationFlag=true`
with the explicit meaning `ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE`
once the unchanged original acceptance conditions, including the actual protected
Comparator terminal success, have all been met and bound to the same final profile.
`entireNewProfileLeanFormalized=false` must remain a separate statement. The former
flag describes the original leading-profile acceptance; it does not assert a new
Lean formalization of every global continuation, cone and stress argument.

This memo changes no mathematical proof, original criterion, prior status, fixed
receipt or flag. It is an independent interpretation and evidence map. It neither
performs a Comparator run nor supplies its still-separate final result. Its
machine-readable companion contains the exact source paths, bytes, SHA-256 values,
clause obligations, evidence levels and source locators.

## Why this is the original scope

The supplied theorem has one set of profiles `E,U,Pi` and one set of fixed constants
on `X>=0`, `eta in [-1,1]`. Its six conclusions concern the regular leading profile,
its exact leading residual and pressure identities, one annular stress, the
closed-annulus directional cone, flat endpoint weights, restored exterior moments,
the heat tail and two reserved patches. Theorem 4.6 and its proof in Proposition C.3
do not add a reconstruction of the later complete time-dependent solution.

The blueprint and handoff identify that leading profile as the M1 N3 target.
The unchanged gate contract asks for analytical derivations, actual continuous
interval evidence and the actual connection of the selected axis to the original
Lean premises. It does not require every subsequent global analytic argument to
be re-formalized in Lean. The final formal-connection review closes the original
N3-03 premise/finite-array connection using the actual selected data and uniqueness
in the same invariant ball. It explicitly keeps the later analytic and interval
evidence at its stated level.

The old assembler and 68/2 and 69/1 assessment producers hard-coded the completion
flag to false while required work remained. They did not define that flag as
equivalent to `entireNewProfileLeanFormalized`; they recorded the latter separately.
Their historical false values remain correct records of those stages. A new dated
assessment must state its intended flag meaning rather than silently rewrite or
reinterpret those earlier records.

N3-08 alone is insufficient: its original data contract allows a theorem clause to
carry evidence **or an unresolved reason**. Therefore neither a data-contract PASS
nor the number 70/70 by itself proves the full profile. Every obligation below must
be supported by the same completed construction, and all separate operational
conditions must have actual evidence.

## One profile and the six original clauses

The common parameter identity is
`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`;
the profile-evidence identity is
`ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206`.
They bind the new `Md=2^20`, `T=exp(Md)+10`, actual A.21 datum,
`Lambda=Q^64`, `C=(1+Q^300)^10 exp(Q^200)`, widths `C^-120`,
`S=C^100000`, `R=exp(S^256)` and one `N=1+ceil(R^50)`.
The old `Md=1, logP=14` pressure fixture is not substituted.

| Clause | Obligations mapped to existing accepted evidence | Exact connection |
| --- | --- | --- |
| (i) | Smoothness on every finite radial rectangle, Cartesian axis regularity, positivity, the common inner analytic neighborhood, inner margin, and backward pressure normalization. | `SAME_DATUM_ANALYTIC_AXIS` §§2,4,6–9 plus the actual formal producer; B.22/B.26 continuation; smooth B.8/C.2 roots; actual heat smoothness; exact B.8/I2/I1 pressure preservation. `Xan=Xa exp(t1/16)` is preserved by all later modifications. |
| (ii) | Exact radial pressure balance and leading tangential residuals; core equations; stress zero outside and nonzero at every interior point. | The exact nonlinear fixed-point equations give the identities of §9, rather than a sampled residual. The final cumulative definitions and Proposition 4.2 give the leading physical residual. A.8 and the restored moments give the exact outer zero; the global stress bound gives interior nonvanishing. |
| (iii) | Positive lower bounds for F,a,vs-2, smooth direction at both edges, and one closed-annulus cone margin. | The actual preloop gap and source tables feed the original C.1 loop and C.12 continuous restoration. The selected `kappa=R^-10` covers the affected region and preserved collars. Inner B.30 and outer A.48–A.50 factorizations define both edge directions without dividing zero by zero. |
| (iv) | One smooth flat weight, one positive lower constant independent of derivative order, and finite bounds for every fixed mixed derivative order. | The recorded two-ended exponential weight has lower constant `min(C^-11,R^-8)`. Exact inner/outer factorizations give the inverse-distance derivative factors; the remaining compact middle is smooth for the single fixed N. |
| (v) | Zero M,J,S and renormalized angular moment; positive eta-independent exterior coefficient; exact heat tail and smoothness at its one-sided endpoint; U=V0=0 after one fixed Xv. | Actual outer roots, actual B.8 joining, heat/I2 compensation and C.12/I1 restoration preserve all five matching quantities. Take `Xv=Xend`, the original pulse end. There U=M=0, so the exact average and V0 vanish. |
| (vi) | Ordered, disjoint Ipos and Imean within (Xa,Xv), with the untouched common power law and U=0. | The third and fourth intervals after A.9 have offsets 14 and 8. All present modifications avoid them. Their fields, not necessarily every accumulated upstream moment, retain the prescribed power law. |

All references in this table resolve to byte-pinned source entries in
`theorem46-clause-map.json`. The map includes the actual mathematical statement,
the 292-check one-profile attachment, its independent review and the later 883-check
formal-connection review. Those numbers count verification checks, not additional
theorems or new executions performed for this memo. Component notes that originally
recorded open inputs are not edited: the completed assembly and later formal review
are the explicit records that attach and discharge those inputs.

### Endpoint and domain details retained in the map

The normalized direction at the inner edge is the direction of the smooth nonzero
coefficient in `T0=e_a B0`, parallel to the actual shear `(a,-bs)`. At the outer edge
it is the normalization of `(btheta,delta_o^6 bz)`, giving `(1,0)` with `bs=0`.
The same exact factors supply the fixed-order derivative estimates. The theorem
requires finite constants for each fixed derivative order; it does not require
simultaneous smallness of all orders or a bound uniform as N tends to infinity.

The actual numerical mixed eta chart is `|eta|<=rho/4`; the original infinite
solution and analytic bounds cover the whole real source interval. The comparison
disk `|xi|<=1/16` is not an enlargement of the nonlinear complex domain. This scope
does not assert direct numerical evaluation of the complete nonlinear graph over
all eta, nor individual Lean reevaluation of every saved interval operation.

The fixed outer zero-axial radius is the pulse end already used by the original
proof, equivalently `XR exp(T+2+60B+13/lambda)`, `B=1000T`. This is a name for an
existing schedule endpoint, not a new parameter choice. The exact pulse corrections
make M=J=0 there and U remains zero afterward; no later U modification reaches it.
The two reserved intervals end before that radius, as required by clauses (v)–(vi).

## The separate actual Comparator condition

The old cancelled run 37979127351 is incomplete. The successful guard diagnostic
run 38013278865 establishes the controlled transport result, not Comparator
verification. Neither result can close N1-06 or trigger the final completion flag.

The pending production evidence is bound to run **38014602021**, job
**114101981614**, commit **55dacb898f8c204bf0c5925ea901d75d6c2d0f46**.
Before a new full acceptance is issued, its artifact must satisfy the frozen final
terminal auditor: exact original inputs and guard conditions, UID/capability and
Landlock controls, all required stage exits, protected Comparator EOF and success
before cleanup, mandatory nanoda followed by Lean and final quotient verification,
the original theorem types/axioms, clean original sources and unchanged kernel,
and the actual terminal successful job/controller result. A successful download,
wrapper or diagnostic alone does not satisfy that condition.

The already reviewed final auditor source has SHA-256
`81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef`.
The exact run binding has SHA-256
`5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab`.
This scope review does not assert that the terminal condition has now happened.

## Recommended new assessment fields

Only after all those actual results and source bindings are present:

```json
{
  "fullOriginalTheorem46CertificationFlag": true,
  "fullOriginalTheorem46CertificationMeaning": "ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE",
  "entireNewProfileLeanFormalized": false
}
```

Attach this clause map by SHA, the unchanged eight fulfilled gate source refs,
the actual formal and assembly receipts, and the terminal N1-06 result. Preserve
all historical assessments. Do not infer a complete time-dependent NS solution,
forcing removal, or smooth velocity at time one from this leading-profile result.
'''

# This review writes only its own scratch artifacts. Verify every source visited
# during assembly of the map a second time before sealing the new result.
for p, sha in before.items():
    check('source_unchanged_' + str(len(checks)), digest(Path(p)) == sha, path=p)
if not all(c['pass'] for c in checks):
    failures = [c for c in checks if not c['pass']]
    dump_new(OUT / 'failed-review.json', failures)
    raise SystemExit(json.dumps(failures, indent=2))

dump_new(OUT / 'theorem46-clause-map.json', mapping)
with (OUT / 'THEOREM46_SCOPE_REVIEW.md').open('x') as f:
    f.write(memo)
receipt = {
    'schema': 'mathscope.independent.theorem46-scope-review-receipt.v1',
    'status': 'PASS_SOURCE_AND_SCOPE_MAPPING_REVIEW',
    'reviewedUTC': datetime.now(timezone.utc).isoformat(),
    'passed': sum(c['pass'] for c in checks), 'total': len(checks),
    'checks': checks,
    'auditType': 'READ_ONLY_HASH_AND_EXISTING_RECORD_CONSISTENCY; HUMAN_REASONED_SIX_CLAUSE_SOURCE_MAP',
    'mathematicalProofsReexecuted': False,
    'newKernelExecutions': 0, 'newComparatorExecutions': 0,
    'currentN106CompletedClaimed': False, 'existingGateVerdictsChanged': False,
    'entireNewProfileLeanFormalized': False,
    'sameFinalProfileBinding': same,
    'reviewerSourceSHA256': digest(Path(__file__).resolve()),
    'outputSHA256': {name: digest(OUT / name) for name in ['theorem46-clause-map.json', 'THEOREM46_SCOPE_REVIEW.md']},
    'inputSourceHashesUnchanged': before,
}
dump_new(OUT / 'reviewer-receipt-0001.json', receipt)
print(json.dumps({'status': receipt['status'], 'passed': receipt['passed'], 'total': receipt['total'],
                  'receiptSHA256': digest(OUT / 'reviewer-receipt-0001.json'),
                  'outputs': receipt['outputSHA256']}, indent=2))
