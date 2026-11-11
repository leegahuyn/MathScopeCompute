# Independent review of the near-start whole-K center

The original `check_whole_k_center.py` was rerun against the pinned manuscript, Git source, 4,459,637-node graph and actual point evaluator. Its new receipt is byte-identical to the earlier receipt, SHA-256 `6c931f7e084df630c9fa1a632f6f7b7c9c3deda8b20c283864224a2e81c7f728`. `check_center_review.py` independently verifies, using exact `Fraction` intervals, that all six stated six-decimal Phi/Phi_Y displays are rounded correctly. The point intervals alone are not a proof of uniformity over the cell; the original uniform comparison and nonlinear error are separately used by the source argument.

Conditional on the original core/annular source theorems, the displayed common-background coefficient clauses and actual common b-sequence, the numerical constants check out:

- Near-start normalized slice energy: Y width 1/2, eta width eta*/2, angular factor 2*pi, lower geometry factor 1/2 and squared swirl lower factor 1/16 yield `pi/64` multiplying `tau0*eta*/(CSelected² Lambda²) * c²`.
- The original linear-exponential cutoff satisfies `c>=exp(-8/eta*²)/2` over the stated near-start band; therefore `c²>=exp(-16/eta*²)/4` and the uniform lower coefficient is `pi/256`.
- The isolated time-cutoff work has integral `int(-c*c')=(c(rhoL)²-c(rhoU)²)/2`, so its coefficient is `pi/128`. Other force terms remain unbounded in this calculation.
- At the separate symmetric final-slab endpoint the same arithmetic yields `pi/16`, **provided** the actual n=3 normalized m=0 coefficient bound is available; a b_s endpoint bound additionally requires n=3 m=1.

For the near-start b_s check, writing `E=E0+DeltaE`, `X=Y/Lambda`, the correction to the dimensionless coefficient of `tau0^(-(2+h))*Lambda/CSelected` is at most `1/2048+1/8192<1/1024` under the stated |DeltaE|, |partial_X DeltaE| bounds. The source comparison bounds imply the claimed signs and the stated conservative interval. These algebraic checks do not independently establish the input coefficient norms, final pressure, or the paper/source identity.

## The crucial c_n versus common b_n distinction

The cited paper's (10.1), p.117 of the pinned 166-page PDF, literally contains the background streamfunction sum `sum chi(c_n*q) S_n`. The checked common-family graph instead uses `chi(b_n*q)` with `b_n>=c_n`, `b1*qBig>=1`, `b2>=16*b1`, and later doubling. In the near-start cell `q=qBig*Q/32` with Q>1, so `b3*q>=Q>1`: all n>=3 common-b cutoff terms do vanish. That proof **does not** give `c3*q>=1` from `b3>=c3`.

A fully symbolic logical model shows the direction matters. Put `h=2^-4097`, `C=2^65536`, `H=1/h`, `qBig=2^(-C-10)`, and take increasing historical `c_n=2^(H+n-1)`. These c values obey the elementary doubling and unit-norm lower-scale requirements, while C satisfies the crude source lower bounds `C>=2^65536` and `C>=(64/h)^2`. Put `b1=2^(C+10)` and `b_n=2^(C+12+n)` for n>=2. Then b dominates c and has the required 16/doubling growth. For every `1<Q<2` and `q=qBig*Q/32`, one has `b3*q=Q>1` but `c3*q<1/2`; the original cutoff is zero in the first case and one in the second. This is an abstract countermodel to the inference, not an evaluation or counterexample for the fixed original c_n, b_n, or their actual coefficient norms.

The paper's Proposition 5.5 and Lemma 5.4 choose admissible c_n rather than uniquely fixing their numerical values. A valid route is therefore to establish that the common b_n sequence satisfies **all** original cutoff/normalization requirements and is the consistently selected sequence in the complete (9.21)/(10.4) construction. Merely knowing `b_n>=c_n`, or citing a statement about a field already built from different c_n, does not identify the two fields. The `source-inner-growth.mjs` explicitly records the common b-sequence and the final localized field identification as external source-theorem dependencies. This logical scope must remain visible in the center result.

The proof says nothing about the full center force, global N7 energy, the moment bridge, or final 67 jets. RELEASE HOLD.

## Reproduce

    python check_center_review.py --receipt ../whole-k-center/whole-k-center.json --out review.json

The first command needs the pinned source inputs, local Node runtime, SymPy and PyMuPDF as documented in the original center folder. No Lean compilation or branch mutation was performed.
