# Arithmetic M2: bounded computation and explicit comparison obligations

This additive adapter implements usable finite parts of P4–P6 from the original
99-page blueprint. It does not modify the accepted M1 engines or their historical
evidence. The original 24 criterion texts and page numbers remain in
`checklist.mjs`. The present assessment is **10 PASS / 14 PARTIAL**; the scope of
each accepted item is stated there. A completed small computation is not a claim
that the entire P4, P5 or P6 package is complete.

## API

```js
import {run, runJob, validate, validateRequest, getExamples,
        getCapabilities, getChecklist} from './index.mjs';

const report = validate('arithmetic.elliptic', {p:'3', m:2});
const result = await run('arithmetic.elliptic', {p:'3', m:2});
const same = await runJob({
  kind:'arithmetic.elliptic', input:{p:'3', m:2},
  precision:{N:4}, budget:{maxOperations:50000000,maxMillis:30000}
});
```

The optional context supports `signal`, `isCancelled`, `checkCancelled`,
`onCheckpoint`, and `budget` on the `run` convenience entry point. No server,
package installation or external computation service is silently invoked.

| Kind | Implemented result | Material remaining boundary |
| --- | --- | --- |
| `arithmetic.projective` | P^n degrees, exact Tate/Frobenius attributes, point counts and finite place-indexed factor identities | External high-dimensional comparison; no cup/E-infinity or new kernel result |
| `arithmetic.elliptic` | Explicit finite fields, exact points, local zeta, recurrence, rational Newton slopes | MW/Kedlaya matrix computation unavailable; bad/nonminimal reduction blocked |
| `arithmetic.frobeniusReconstruct` | Exact integer lifting from residues with declared bounds | Bounds retain their provenance; extension-ring semilinear iteration unavailable |
| `arithmetic.qDeRham` | Exact formal q polynomials and two-variable monomial Koszul blocks | Coordinate-independent q-PD descent remains incomplete |
| `arithmetic.breuilKisin` | Eisenstein point, exact delta(E), separate base-map images | General ramified geometry and uniformizer comparisons unavailable |
| `arithmetic.perfectoidTower` | Compatible standard root prefix and reference-backed theta witness | General tilt arithmetic, sharp evaluator and effective descent unavailable |
| `arithmetic.witt` | Exact W_N(F_p) arithmetic with Teichmuller carries | Full Witt arithmetic over O_K-flat is not implemented |
| `arithmetic.comparison` | Exact two-term eta-complex diagnostic | This is not a certified A-omega construction |

`getExamples()` returns 11 objects with `{id,label,request}`. `runJob` returns
`{schema,version,kind,status,object,request,scope,results,checks,blockers,tables,
precisionLedger,evidence,provenance,visualization,resultHash}`. Each check has
`{name,pass,...details}`. Each table has `{title,columns,rows}`.

Every visualization has `points`, `lines`, `axes`, `description`,
`coordinateMeaning`, `lostInformation`, `sourceHash` and `sourceFields` when
applicable. Points have `{pos:[x,y,z],label,value}`; lines have
`{points:[[x,y,z],...],label}`. Axis types distinguish categorical indices,
finite-field residues, cohomological degrees, formal coefficients and valuations.
No finite-field or perfectoid picture is represented as a Euclidean embedding.
Large exact integers remain decimal strings in the table. Display-only complex
eigenvalues have their own Float64 label.

`visualization.sourceHash` binds the mathematical result body, immutable input,
scope and algorithm version. It is not misrepresented as the SHA of a source-code
file. The evidence manifest records actual implementation file hashes separately.
The ordinary result hash also binds the complete returned visualization.

## Verification

Run:

```bash
node --test research-ide/mathscope-m2/arithmetic/tests/arithmetic-m2.test.mjs
```

The 21 tests include an independent projective-vector orbit enumeration,
finite-field all-pairs counts through F_(7^4), the six original elliptic prime
fixtures, the F9 fixture, reducible-field rejection, ambiguous residue lifts,
ordinary/supersingular slopes, exact q-Koszul/Leibniz identities, independent
evaluations of the BK delta identity, exhaustive small Witt rings, broken root
prefixes, deterministic result hashes and resource budgets. The evidence directory
records actual test output, finite example results and implementation hashes.

No test in this folder compiles Lean. No result grants `FORMAL PASS`, proves
RH/BSD, constructs general prismatic descent or identifies a finite tower with its
completed inverse limit. The corresponding obligations are visible in capabilities,
each result scope and the original checklist.
