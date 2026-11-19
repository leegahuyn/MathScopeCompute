/** Negative control. A detached copy of the successful receipt is not an owner. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {materializeActiveN3FirstSpatialIngress} from './stage1_spatial_ingress.mjs';
const [navier, referenceReceiptPath, originalGuardOverlayPath] = process.argv.slice(2);
const pde = JSON.parse(await readFile(referenceReceiptPath));
await assert.rejects(
  materializeActiveN3FirstSpatialIngress({navier, pde, referenceReceiptPath, originalGuardOverlayPath}),
  error => error.code === 'INVALID_POSTFIVE_3D_SOURCE_SEAL');
console.log('PASS original private source seal rejects a detached replay receipt');
