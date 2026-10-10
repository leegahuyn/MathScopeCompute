// One source worker per coordinate, so the verification process does not
// retain several complete source graphs at the same time.
import assert from 'node:assert/strict';
import {actualPulseSensitivityCertificate} from '../actual-pulse-sensitivity.mjs';
const slowCoordinate=process.argv[2]??'R';assert.ok(['R','Z','T'].includes(slowCoordinate));
const started=performance.now(),receipt=await actualPulseSensitivityCertificate({ellExact:'1',slowCoordinate,derivativeOrder:1,terms:0});
assert.equal(receipt.pass,true);assert.ok(receipt.checks.every(x=>x.pass));assert.equal(receipt.derivativeRows.length,6);assert.equal(receipt.endpointRows.length,6);
assert.equal(receipt.scope.fullSameProfileN5,false);assert.equal(receipt.scope.numericalSensitivityQuadrature,false);assert.equal(receipt.graph.sha256.length,64);
assert.ok(receipt.equationRows.every(x=>x.sourceJetAuditRowCount>200));assert.equal(receipt.request.ellExact,'1');
const body=JSON.stringify(receipt);
console.log(JSON.stringify({coordinate:slowCoordinate,elapsedMs:performance.now()-started,receiptBytes:Buffer.byteLength(body),nodeCount:receipt.graph.nodeCount,graphBytes:receipt.graph.serializedProgramBytes,
  sha256:receipt.graph.sha256,checks:receipt.checks.length,pass:true,receipt}));
