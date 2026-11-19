# Same-live N3 first-correction wave assembly

The numerical ingress of the first N3 correction comes from original
GitHub run 44582875351. The source contains 22,155,584 nodes. The
Python replay binds its native function registry and the three exact
uncut velocity-difference roots. The background and initialized mean
appear with opposite signs. The retained wave difference is

    ForcedFullWave - InitializedWave + SignedWave - Curl(AWave).

The C78 ordinary mean proof uses the same retained mean roots. It
reduces their curl difference to zero under its analytic hypotheses.

The initialized field, full Forced field, Signed increment and
candidate gauge use the same 162 guarded label/sign rows. The old
initializer represents the transverse coordinate and pulse as direct
actual arguments. The newer wave tables use a native lift. All 1,620
comparisons of these two actual arguments pass over the 162 rows and
five fixed integer branches. The older initialized wave contributes
the same 60 signed Fourier coefficients that are subtracted in the
first Forced source calculation. Its seven guard predicates also
match the original Forced case for each component and fixed branch.

The three exact palette differences satisfy
`delta = i(ell_own) - i(ell_ref-2)`. The common reference radial
coefficient #17745446 and original own coefficient #17735155 use the
same physical radius derivative with their respective palette
factors. At the same physical point,

    R_own = sqrt(rho) R_ref
    a_ref = sqrt(rho) a_own / Lambda^delta
    epsilon_ref rho^(1/2-h) = sqrt(rho) epsilon_own
    inv_R_ref = sqrt(rho) inv_R_own
    rho^h sqrt(rho) = rho^(1/2+h)

The source replay checks all nine actual wave gradient entries,
including both polar connection terms and both auxiliary derivatives.
The exact axial, potential and three-component curl rescalings
compile in GitHub run 44604053598. The local Forced and Signed
readbacks carry their original phases and native coefficients.

## Analytic domain

Use positive radius, the original permitted inverse image, and the
fixed label, copy and palette branch. On their open regions the known
guard statuses are locally constant, with inactive lazy branches
contributing zero. Ordinary differentiation of the admitted native
bodies and their radial integrals is required. The wave and mean
relations then combine by finite linearity. Equality of classical
derivatives through actual guard seams and numerical weighted norms
are separate. Outer physical cutoffs retain their derivative terms.

## Replay

The large raw source is available from the original GitHub run.
The workspace code also supports a locally authenticated optional cache.

    python -B verify_wave_join.py --reader SPATIAL_READER --artifact ORIGINAL_RUN_ARTIFACT --compact OLD_COMPACT_BINDING --ordinary-mean C78_MEAN_RECEIPT --five-whole C79_FIVE_WHOLE_RECEIPT --forced-local forced/forced-wave.json --scratch SCRATCH --out NEW_RECEIPT.json

`--cache-module` can point to the directory containing
`source_cache.py` and `--cache` to its private on-disk spool. The
proof also runs without those two arguments. The spool is not needed
for the result package.
