# Angular refinement of the actual N3 FiveMap increment

## VERIFIED

The local Python replay verifies the full 22,155,584-node stream
exported by completed GitHub run 44582875351 and extracts the
selected native records. This is the first post-Signed FiveMap
velocity increment of that exact live field.

| Actual cylindrical component | Defining body | Live application | Updated mean |
| --- | ---: | ---: | ---: |
| Radial beta | 22151962 | 22151963 | 22151964 |
| Azimuthal v | 22151940 | 22151941 | 22151965 |
| Axial gamma | 22151944 | 22151945 | 22151966 |

All three native functions bind exactly ell,R,Z,T. The live source's
native binding kernel rejects hidden free coordinates. The physical
angle is node 17732752 and the two independent auxiliary torus
coordinates are 17745430 and 17745431. None enters these functions
or their argument tuples. The complete first-cycle direct velocity
at nodes 22153222 through 22153224 includes the three updated means
in the original source. The angular result therefore uses the
same-live direct increment and its original physical scaling.
It is independent of the separate full gauge identity.

### Physical Fourier refinement

Use normalized angular measure dtheta/(2 pi), and let beta,v,gamma
denote physical cylindrical velocities at a fixed smooth source
point with r>0. The nontrivial field component retains exactly the
horizontal rotation for Cartesian velocity. Projecting at cutoff
zero omits the squared norm beta²+v². Cutoff one retains the entire
velocity. The cylindrical gradient matrix is

    [ beta_r   -v/r      beta_z  ]
    [ v_r       beta/r  v_z     ]
    [ gamma_r   0       gamma_z ].

Rotate it on both sides to obtain the Cartesian gradient. Its horizontal
block has modes 0,±2. The two off-block pairs have modes ±1 and the
axial diagonal has mode zero. The traceless symmetric part of the
horizontal block gives the omitted squared Frobenius density for
the refinement from cutoff one to two.

    cutoff 1 omitted square = ((beta_r - beta/r)^2+(v_r - v/r)^2)/2
    cutoff 2 omitted square = 0

The difference also equals the difference of the two angular
dissipation integrands. It is pointwise in the radial and axial
positions and time. In the original frozen chart, multiply the
same expression with normalized R derivatives and normalized
velocities by Q^(-2A-1). For an integral of this selected field,
the formula can be used before radial and time quadrature. It
leaves the radial and time derivative values unevaluated.

### Four-node alias correction

Set a=(beta_r-beta/r)/2 and b=(v_r-v/r)/2. The four equally spaced
angles starting at zero conflate modes +2 and -2. In the mean square
of either Cartesian diagonal horizontal entry subtract
(a²-b²)/2 from the sampled value. In either off-diagonal horizontal
entry subtract (b²-a²)/2. These four errors sum to zero for the full
Frobenius mean. The other five entries have no four-node square
alias. The five-node rule distinguishes both signed modes and
gives the exact angular square mean of all nine entries. A shifted
four-node rule uses a,b after the same initial rotation of the
traceless block by twice the starting angle.

The replay checks the rotation, spectral truncations, Pythagorean
identity and sampled biases with exact rational real and imaginary
Laurent coefficients. The component bias is a nonzero polynomial
in two independent radial shears. On a full compact radial support
chart, vanishing of the omitted gradient square at every radius
implies beta=v=0 there, since the equations beta_r=beta/r and
v_r=v/r make each a constant times r, and the compact extension
sets these constants to zero. No numerical nonzero assertion is
needed for the actual symbolic tail formula.

## OPEN

The selected field is the uncut direct FiveMap increment. The C79
radial support/whole-moment result has its own premises. The square
of a sum with the wave, fast auxiliary and later-cycle fields
still contains their original cross terms. This packet contains
neither their coefficients nor radial or time interval quadrature.
N8-05 still has 0/4 complete final-field comparisons and final jets
0/67. RELEASE HOLD.

## Replay

With the preserved workspace, use

    python check_fivemap_fourier.py WORKSPACE NEW_RECEIPT.json

For the independent full source re-extraction, use
capture_fivemap.py with the already downloaded first-correction
spatial source directory and a new output path. The ZIP's compact
replay includes the extracted records and all pinned dependencies.

    python check_fivemap_fourier.py . NEW_RECEIPT.json --bundle
