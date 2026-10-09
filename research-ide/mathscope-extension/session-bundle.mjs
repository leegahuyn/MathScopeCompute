/** Translate bounded experimental observations into the existing typed session.
 * The existing audited verifier remains the sole issuer of formal certificates.
 */
export const EXTENSION_VERSION = '0.1.0';
export function createResearchBundle(snapshot, { session, inputsHash, createdAt = new Date().toISOString() }) {
  if (!snapshot || !['primes', 'cohomology', 'yangmills', 'navier'].includes(snapshot.module)) throw Error('Unknown extension module.');
  if (!session || !inputsHash) throw Error('Session and exact input hash are required.');
  const module = snapshot.module, input = snapshot.input || snapshot.options || {};
  const prefix = 'rx-' + module, objectId = prefix + '-object', repId = prefix + '-representation', claimId = prefix + '-claim';
  function revision(group, id) {
    const old = (session[group] || []).find(n => n.id === id);
    const count = Number(String(old?.revision || '').match(/:r(\d+)$/)?.[1] || 0);
    return { revision: id + ':r' + (count + 1), parentRevision: old?.revision || null };
  }
  const cohoDim = input.kind === 'torus' ? Number(input.dimension || 3)
    : input.kind === 'circle' || (input.kind === 'triangle' && input.filled === false) ? 1 : 2;
  const dims = { primes: [1, 1], cohomology: [cohoDim, input.kind === 'rp2' ? 4 : cohoDim * 2], yangmills: [4, 4], navier: [3, 3] }[module];
  const kind = { primes: 'ArithmeticFunctionFamily', cohomology: 'FiniteCWModel', yangmills: 'ClassicalGaugeDensity', navier: 'VelocityFieldSample' }[module];
  const provenance = { source: 'MathScope Research Extensions', adapterVersion: EXTENSION_VERSION, capturedAt: createdAt, execution: 'Browser finite computation' };
  const conditional = module === 'yangmills' && snapshot.conditionalClaim;
  const assumptions = conditional ? snapshot.conditionalClaim.assumptions : [
    'Displayed finite samples and floating-point computations have the stated model scope.',
    'A visual representation or a local compilation audit does not issue an audited proof certificate.'
  ];
  const object = {
    id: objectId, type: kind, baseField: 'R', intrinsicDim: dims[0], ambientDim: dims[1],
    structures: [module, 'explicit-model', 'bounded-observation'], domainRef: null,
    ...revision('objects', objectId), assumptions, provenance, hash: inputsHash,
    definition: snapshot.objectContract || snapshot.results?.complex || null, input,
    coefficientField: module === 'cohomology' ? 'F_' + (input.p || 3) : null,
    dimensionNote: module === 'cohomology' ? 'Underlying finite CW model dimension; cohomology degree and coefficient field are separate data.' : null
  };
  const observed = snapshot.representation || {};
  const map = module === 'yangmills'
    ? (input.mode === 'slice' ? 'q4(y,c): 4D scalar-density restriction to x4=c' : 'q3(y)=integral_R q4(y,t) dt: scalar marginal')
    : module === 'primes' ? '(x, ratio(x), sequence lane)' : module === 'cohomology'
      ? 'Labeled coordinates from cohomological degree/basis or cochain degree-filtration dimensions'
      : 'Finite velocity samples at the specified time and coordinate frame';
  const rep = {
    id: repId, sourceObjectRef: objectId,
    method: module === 'yangmills' ? (input.mode === 'slice' ? 'slice' : 'user-defined') : 'sampled-finite',
    displayDim: 3, mapDefinition: map, parameters: { input, contract: observed, camera: snapshot.camera || null },
    sampling: observed.sampling || { mode: 'bounded explicit computation', count: 'recorded in observation' },
    injectivityStatus: module === 'yangmills' ? 'NON_INJECTIVE' : 'NOT_APPLICABLE_TO_DATA_LAYOUT',
    ambiguityRef: { type: 'representation-contract', description: 'Labels, sampling and model assumptions remain part of the observation.' },
    fidelityVector: { topology: null, metric: null, spectral: null, dynamics: null },
    lostDimensions: module === 'yangmills' ? ['x4'] : [],
    discardedCoordinates: module === 'yangmills' ? ['x4'] : [],
    inverseStatus: module === 'yangmills' ? 'NO_GLOBAL_INVERSE' : 'NO_GEOMETRIC_RECONSTRUCTION_CLAIM',
    provenance, ...revision('representations', repId), stale: false, freshness: 'CURRENT'
  };
  const statements = {
    primes: 'Recorded finite prime counts, normalized ratios, and elliptic-curve good-prime data at the specified inputs; no asymptotic or conjecture proof.',
    cohomology: 'Recorded cohomology of the explicitly supplied finite cellular/simplicial complex over Fp; comparison-theorem references do not turn it into a prismatic computation.',
    yangmills: 'Recorded a finite observation of the explicit classical SU(2) BPST scalar density; the declared gauge group and quantum-gap hypothesis are separate.',
    navier: 'Recorded the selected Navier–Stokes analytic component, schematic field, or independent benchmark at explicit finite inputs; no full-paper rebuild or global blowup verification.'
  };
  const claim = {
    id: claimId, type: 'ClaimSpec', statement: conditional ? snapshot.conditionalClaim.statement : statements[module],
    scope: conditional ? 'USER AXIOM / CONDITIONAL COROLLARY' : 'FINITE COMPUTATION / DECLARED MODEL',
    assumptions, dependsOn: [objectId, repId], status: conditional ? 'RESEARCH HYPOTHESIS' : 'SUPPORTED',
    freshness: 'CURRENT', ...revision('claims', claimId)
  };
  const evidence = {
    id: prefix + '-evidence', type: 'EvidenceRecord', grade: conditional ? 'RESEARCH HYPOTHESIS' : 'NUMERICAL INDICATOR',
    claimRef: claimId, method: conditional
      ? (snapshot.conditionalClaim.compilationStatus === 'KERNEL_PASS_CONDITIONAL'
        ? 'Explicit user hypothesis with an exact-source conditional compilation audit'
        : 'Explicit user hypothesis and generated Lean source; separate compilation required')
      : 'Explicit finite browser model with reproducible inputs',
    inputsHash, environmentHash: 'browser-js-ieee754-cpu3d/' + EXTENSION_VERSION,
    residuals: snapshot.diagnostics || snapshot.numerical || (module === 'navier' && snapshot.results ? {
      divergenceRelative: snapshot.results.divergenceRelative,
      relativeMomentumResidual: snapshot.results.relativeMomentumResidual,
      momentumResidual: snapshot.results.momentumResidual,
      heatEquationResidual: snapshot.results.heatEquationResidual
    } : null), errorBounds: null,
    assumptions, generatedAt: createdAt, adapterVersion: EXTENSION_VERSION,
    upstreamRevisions: [object.revision, rep.revision, claim.revision],
    stale: false, freshness: 'CURRENT', supportsCurrent: true,
    scope: claim.scope, observation: snapshot
  };
  return {
    bundleId: prefix + '-bundle', objects: [object], representations: [rep], claims: [claim], evidence: [evidence],
    researchRuns: [{
      id: prefix + '-run', type: 'ResearchExtensionRun', createdAt, module, inputsHash,
      input, evidenceRef: evidence.id, sourceObjectRef: objectId, representationRef: repId,
      releaseGate: 'UNCHANGED / HOLD'
    }]
  };
}
