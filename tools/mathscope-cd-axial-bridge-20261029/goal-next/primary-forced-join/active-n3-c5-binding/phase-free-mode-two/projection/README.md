# Scale-invariant derivatives of the source projection

At a derivative anchor set N0=|n(anchor)| and hold N0 constant during
differentiation. With h=n/N0, q=h dot h has value one at the anchor.
If each degree-m derivative satisfies ||D^alpha n||/N0<=A_n^m, the
multi-index Leibniz weights give q-derivative bounds 2^m A_n^m.

Differentiating q*(1/q)=1 gives reciprocal coefficients
1,2,12,104,1200 through order four. For the real orthogonal projection
P=I-n*n^T/(n dot n), the Euclidean operator-norm derivative coefficients
are 1,4,24,208,2400. The order-zero norm uses the exact orthogonal
projection property.

The replay checks the binomial weights for all 126 five-coordinate and
210 six-coordinate multi-indices and verifies the source normal's
derivative formula for all 210 cases. The original normal is

```text
n=(x0-w*(p*FR+pz*GR), p/R, pz-epsilon*w*(p*FZ+pz*GZ)).
```

On a fixed label, p,pz,x0 and epsilon are frozen. For R>0 and nonzero p,
|n|>=|p|/R. Let Gamma=(|p|+|pz|)/|p| and let Bslow5>=1 bound the slow
F,G derivatives through order five. Then a sufficient common bound is

```text
A_n = 1+4/R+2R*Gamma*(1+L)*Bslow5.
```

Pure radial derivatives of the angular component contribute m! R^(-m)
after normalization. Other components contribute at most
2R Gamma(1+L)Bslow5, with the original epsilon kept in the exact axial
formulas. The nonnegative-coefficient polynomial
(1+4r+D)^m-m!r^m-D verifies the common bound for m=1,...,4.
Gamma may still depend on epsilon through the actual frozen carrier.

The pinned raw receipt binds all ten current +2 source rows. Summing
its three component bounds gives the Euclidean raw envelope

```text
U_j=[4*2^j*(1+epsilon)+3*3^j*I4+4*3^j*(J1+J2)]*Bamp_(j+1)^2.
```

Its actual fixed-w H_w map costs at most (5/4)^j for common parameter
derivatives. Thus the projected degree-m envelope is

```text
sum_{j=0}^m binomial(m,j)*p_j*A_n^j*(5/4)^(m-j)*U_(m-j),
p=[1,4,24,208,2400].
```

At order four the product weights are 1,16,144,832,2400. This retains
the distinct epsilon, inverse radius and radial-fast coefficient scales.
The amplitude Bamp and the slow background Bslow5 are separate quantities.

The prior normal witnesses refer to the earlier two-system selected
graph. The current all-ten raw receipt omits native normal definitions.
Earlier 0:1 projected roots match, while earlier 1:1 roots differ by
30 IDs. The receipt preserves both associations and leaves current
normal-root identification open. normal-capture-proposal.json lists the
small additional live export needed for that source attachment.

Run with Python and SymPy 1.14.0. The original runtime is the archived
`research-ide` directory from continuation30. Use the earlier hosted
43363985266 witness JSON and a fresh output path.

```text
python -B normalized_projection_recurrence.py GOAL_NEXT ORIGINAL_RUNTIME PRIOR_WITNESS NEW_JSON
```

Actual Gamma, Bslow5, L and amplitude enclosures, original smooth/native
derivative semantics, current normal attachment, Duhamel output and final
jets remain open. RELEASE HOLD.
