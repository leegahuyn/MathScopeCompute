import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [sourceArg, outputArg] = process.argv.slice(2);
assert(sourceArg && outputArg);
const source = resolve(sourceArg);
const url = path => pathToFileURL(resolve(source, path));
const read = path => readFile(url(path));
const m4 = 'research-ide/mathscope-m4/';
const m0 = 'research-ide/mathscope-m0/';
const {
  assessM4Acceptance, auditM4ResearchDependency, buildM4ChecklistView,
  verifyPinnedKernelArtifacts, isVerifiedKernelArtifactReceipt,
} = await import(url(m4 + 'acceptance.mjs'));
const { getShippedProofBundle } = await import(url(m0 + 'proof.mjs'));
const { M4_CRITERIA } = await import(url(m4 + 'criteria.mjs'));
const { buildM2ComparisonDiagram, validateComparisonDiagram } =
  await import(url('research-ide/mathscope-m3/p8/comparison.mjs'));
const { sha256 } = await import(url('research-ide/mathscope-m3/p8/contracts.mjs'));
const criterion = M4_CRITERIA.find(row => row.id === 'I3-07');
const matrixFile = m4 + 'recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json';
const matrixRaw = await read(matrixFile);
const matrix = JSON.parse(matrixRaw);
const matrixRow = Object.values(matrix).flat().find(row => row?.id === criterion.id);
assert.equal(matrixRow.source_page, criterion.page);
assert.match(matrixRow.original_acceptance, /RESEARCH OPEN.*MODEL DEVELOPMENT.*RESEARCH OPEN/);
assert.match(matrixRow.original_acceptance, /가정 자체를 결론.*이름만/);
const checks = {};
const controls = [];
const result = await assessM4Acceptance();
const view = buildM4ChecklistView(result);
const expected = {
  RH_GLOBAL_BRIDGE: 'RESEARCH OPEN',
  BSD_UNIVERSAL: 'RESEARCH OPEN',
  GENERAL_G_CONTINUUM_QUANTUM_YM: 'RESEARCH OPEN',
  WHOLE_ORIGINAL_NS_RECONSTRUCTION: 'RESEARCH OPEN',
  KNOWN_PRISM_COMPARISON_IMPLEMENTATION: 'MODEL DEVELOPMENT',
  NEW_PRISM_COMPARISON: 'RESEARCH OPEN',
};
assert.deepEqual(Object.fromEntries(view.researchBoundaries.map(row => [row.id,row.status])), expected);
assert.equal(result.canFreeze, false);
assert.equal(result.publicationConfirmed, false);
assert.equal(view.gate, 'HOLD');

const node = (id, kind, statement, target) => ({ id, kind, statement, ...(target ? { target } : {}) });
const graph = (nodes, edges = []) => ({ nodes, edges: edges.map(([from,to]) => ({ from,to,type:'DEPENDS_ON' })) });
function reject(name, audit, code) {
  assert.equal(audit.ok, false, name);
  assert.ok(audit.issues.some(issue => issue.code === code), JSON.stringify(audit));
  controls.push({ name, status: audit.status, issues: audit.issues });
}
for (const [id,status] of Object.entries(expected)) {
  const claim = node(id, 'theorem', 'A claim whose registry scope is unchanged');
  reject(id + ' cannot close by relabeling its node as theorem',
    auditM4ResearchDependency(graph([claim]),id),
    status === 'MODEL DEVELOPMENT' ? 'MODEL_DEVELOPMENT_ONLY' : 'RESEARCH_OPEN');
}
checks.OPEN_RESEARCH_PRESERVATION = 'PASS';
const target = node('claim', 'theorem', '∀ n : Nat, P n');
for (const [kind,grade] of [['hypothesis','UNCONDITIONAL_FORMAL'], ['user_axiom','CONDITIONAL_FORMAL']]) {
  const premise = node('premise',kind,'  ∀ n : Nat,\n P n ');
  reject('Restated target as ' + kind,
    auditM4ResearchDependency(graph([target,premise],[['claim','premise']]),'claim',grade),
    'GOAL_ASSUMED_AS_PREMISE');
}
const helper = node('helper','theorem','∀ n : Nat, Q n');
reject('Transitive dependency cycle',
  auditM4ResearchDependency(graph([target,helper],[['claim','helper'],['helper','claim']]),'claim'),
  'DEPENDENCY_CYCLE');
checks.CIRCULAR_ASSUMPTION_REJECTION = 'PASS';

const exact = getShippedProofBundle('m0-finite-d2');
const kernel = await verifyPinnedKernelArtifacts(exact.jobSpec, exact, read);
assert(kernel.verified, JSON.stringify(kernel));
const receipt = kernel.receipt;
assert.equal(isVerifiedKernelArtifactReceipt(receipt),true);
const imported = node(receipt.claimId,'imported_theorem',receipt.targetType,receipt.target);
const withImport = sourceNode => graph([target,sourceNode],[['claim',sourceNode.id]]);
for (const [name,sourceNode,receipts] of [
  ['Algebraic name only',node('comparison','imported_theorem','Derived crystalline comparison'),[]],
  ['Exact target text without live receipt',imported,[]],
  ['Serialized receipt, exact claimed target',imported,[JSON.parse(JSON.stringify(receipt))]],
  ['Live receipt, mutated target type',{...imported,statement:imported.statement + ' '},[receipt]],
  ['Live receipt, different target name',{...imported,target:'MathScope.M0.Finite.invented'},[receipt]],
  ['Live receipt, different claim ID',{...imported,id:'relabeled-claim'},[receipt]],
]) reject(name, auditM4ResearchDependency(withImport(sourceNode),'claim','UNCONDITIONAL_FORMAL',
  {kernelReceipts: receipts}),'SEMANTIC_ADAPTER_EVIDENCE_REQUIRED');
const good = auditM4ResearchDependency(withImport(imported),'claim','UNCONDITIONAL_FORMAL',
  {kernelReceipts: [receipt]});
assert.equal(good.ok,true);
assert.equal(good.authority,'STRUCTURAL_GUARD_ONLY');

const routes = {};
for (const targetName of ['etale','etaleZp','deRham','crystalline']) {
  const route = { kind:'arithmetic.comparison',input:{operation:'perfectPrism',p:'3',target:targetName} };
  const diagram = await buildM2ComparisonDiagram(route);
  const good = await validateComparisonDiagram(diagram,{expectedBinding:diagram.binding.sha256});
  assert.equal(good.status,'SUPPORTED_EXTERNAL_COMPARISON');
  assert.equal(good.formalComplete,false);
  assert.equal(diagram.localKernelCheck,false);
  assert.ok(diagram.edges.every(edge => edge.requiredAssumptionRefs.length && edge.formalComplete === false));
  const falseDiagram = structuredClone(diagram);
  falseDiagram.edges[0].detail = { name: diagram.edges[0].sourceOperation };
  const {binding,...falseBody} = falseDiagram;
  binding.sha256 = await sha256(falseBody);
  assert.notEqual(binding.sha256,diagram.binding.sha256);
  const bad = await validateComparisonDiagram(falseDiagram);
  assert.equal(bad.status,'COMPARISON_REJECTED');
  assert.ok(bad.issues.some(issue => issue.code === 'COMPARISON_EDGE_CHANGED'));
  assert.equal(bad.formalComplete,false);
  routes[targetName] = {
    source:diagram.source, binding:diagram.binding,
    operations:diagram.edges.map(edge => edge.sourceOperation),
    originalGrade:diagram.grade, adapterStatus:good.status, formalComplete:good.formalComplete,
    modelStatus:expected.KNOWN_PRISM_COMPARISON_IMPLEMENTATION, changed:bad,
  };
}
checks.MODEL_RESEARCH_BOUNDARY = 'PASS';
checks.SEMANTIC_ADAPTER_VALIDATION = 'PASS';
assert.deepEqual(criterion.checks.map(name => checks[name]), ['PASS','PASS','PASS','PASS']);
await writeFile(outputArg, JSON.stringify({
  schema:'MathScope.M4.I307.ResearchBoundaryReadback/1',
  criterionId:criterion.id, originalBlueprintPage:criterion.page,
  originalCriterionText:matrixRow.original_acceptance,
  originalMatrixSHA256:createHash('sha256').update(matrixRaw).digest('hex'),
  requiredChecks:criterion.checks, checks, researchBoundaries:view.researchBoundaries,
  routeControls:controls, exactHistoricalImport:{target:receipt.target,targetType:receipt.targetType,
    grade:receipt.grade, artifactDigest:receipt.artifactsDigest, structuralAuthority:good.authority},
  modelRoutes:routes, result:{gate:view.gate, canFreeze:result.canFreeze, publicationConfirmed:result.publicationConfirmed},
  verdict:'PASS_RESEARCH_SCOPE_AND_ADAPTER_GUARDS',
},null,2) + '\n');
console.log(`I3-07 preserved all five research boundaries and one model boundary, replayed ${Object.keys(routes).length} original M2 prism routes, rejected ${controls.length} graph and 4 semantic mutations`);

