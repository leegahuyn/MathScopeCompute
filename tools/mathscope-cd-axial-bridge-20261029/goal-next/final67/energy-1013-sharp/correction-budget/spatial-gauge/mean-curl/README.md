# Actual shifted Temporal potential and its covariant curl

The saved original Temporal gamma already includes the radial auxiliary
pullback. The prior provisional extra-aL obligation is resolved.

The actual potential #1706770 calls auxiliary expression -13 with arguments
`(ell,R,Z,T,Y0,Y1)`. Its registered body is #1706769. Actual gamma
#1706782 is exactly
`partial_R psi+a*(partial_Y0 psi+#623066 partial_Y1 psi)+psi/R`,
with a=#635060. Actual beta #1706773 is
`-epsilon partial_Z psi`.

The T1 left and whole integrals #1706665 and #1706666 use the same
integrand. Inverse call #1706661 has arguments
`(r,Z,T,ell,Y0+shift,Y1+#623066*shift)`, where the source shift is
Phi(r)-Phi(R). The left endpoint is fixed #633710, its upper endpoint is R,
and the whole upper endpoint is fixed #633712.

Let N=Ileft-chi Iwhole be the numerator of R psi and let J_L,J_W denote
the matching transverse derivative integrals. Differentiating the actual
shift gives

```text
partial_R N = R gamma_d-a J_L-chi_R Iwhole+chi a J_W
L N         = J_L-chi J_W
D_R N       = R gamma_d-chi_R Iwhole.
```

Therefore the covariant curl equals gamma_d-A1, retaining
`A1=chi_R Iwhole/R`. The script checks this exact algebra and an omitted
external aL negative control. It streams and authenticates all 4,456,994
original nodes, retains the actual operator and native-argument nodes,
checks the registered -13 function, and pins the original source modules.
The following FiveMap increment has no auxiliary Y argument and retains
its own source FTC potential check.

The calculation uses the original fixed-reference physical Y(R) with
Y_R=a vr. It retains the original source smoothness, fixed support
endpoints, FTC, and differentiation-under-integral premises. Later native
limit and arbitrary label derivative questions remain separate.

On the actual annular radial plateau the remaining spatial cutoff gradient
is axial. With the exact source gauge Amean=Q^(-h) psi e_theta,

```text
curl(C Amean)=C curl(Amean)-C_z Q^(-h) psi e_r.
```

The derivative identities D_R psi=gamma-psi/R and
epsilon partial_Z psi=-beta can be used for that commutator. Its source
potential value bound and the actual outer cutoff/flat-join chart still
need to enter the energy certificate.

Only these three files form this result.

* README.md
* certify_temporal_curl.py
* temporal-curl-source.json

Python 3 with SymPy is required. Choose a new writable output path.

```text
python certify_temporal_curl.py GOAL_NEXT ORIGINAL_M3_NAVIER ORIGINAL_GRAPH_DIRECTORY NEW_OUTPUT_JSON
```

The original graph is the corrected first-cycle export from run
43010593847. Source and runtime pins are recorded in the JSON and checked
before the result is emitted. RELEASE HOLD.
