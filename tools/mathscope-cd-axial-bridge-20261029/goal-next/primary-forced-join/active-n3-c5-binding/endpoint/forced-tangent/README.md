# Tangent growth for the two actual mode-two pulse systems

The replay binds systems 1 and 5 in the same original selected-input
witness used by the prior damping receipt. It verifies the exact K
operands, the original shared slow F and G function definitions, and the
actual projected forcing roots for both real and imaginary parts.

The original principal matrix is

```text
K = [[0,-2F,0], [2F+R*FR,0,0], [GR,0,0]].
Aphi = -K + n*(n^T*K-nprime^T)/(n dot n).
P = I - n*n^T/(n dot n).
```

Exact symbolic checks give n^T*Aphi+nprime^T=0 and n^T*f=0 for the four
actual real or imaginary forcing vectors. For a differentiable source
zero-data solution this propagates n^T*u=0. On that tangent subspace the
rank-one term in the energy identity vanishes. The two opposite 2F terms
also cancel. Thus for the complex Euclidean norm,

```text
Re(u* Aphi u)
  = -R*FR*Re(conj(u0)*u1) - GR*Re(conj(u0)*u2)
  <= sqrt((R*FR)^2+GR^2)*|u|_2^2 / 2.
```

The checked squares are the Cauchy inequality in two dimensions and
2xy<=x^2+y^2. Since P is a real orthogonal projection, the forcing norm
satisfies |P*fraw|_2<=|fraw|_2. Combining this with the already bound
scalar damping gives a conditional source-specific value envelope,

```text
|u(t)|_2 <= integral_0^t
  exp(integral_s^t [a(w)-4*epsilon*k^2*|n(w)|^2] dw)
  * |fraw(s)|_2 ds,
a(w)=sqrt((R*FR)^2+GR^2)/2.
```

If Fraw and Abg bound the raw forcing norm and a throughout the original
admitted interval, this is at most
Fraw*t*exp(max(Abg-mu,0)*t), with the prior source-bound
mu=4*epsilon/Renv^2. Its value growth requires no inverse-normal or frozen
carrier factors.

The existing same-family C8 bound and R<=Renv give the conditional
numeric rate Abg<exp^10(c+1), where c is the larger rational tower seed
from the pinned original K and radial-envelope upper endpoints. The replay
checks c>13 and c+1<2^21 exactly. The C8 bound's applicability on the
actual mapped domain remains an explicit source premise.

The exact negative control has n=(1,0,0), nprime=(-1,0,0), K=0,
u=(1,0,0). Here the tangent premise fails and rank-one energy growth is
1 despite a=0.

Actual raw forcing values, the full admitted-domain analytic proof,
parameter derivatives of the output, evaluation at the source endpoint,
curl and pressure, final jets and the release gates remain open. The
selected source witness is separate from the complete Forced seal.

From the workspace root with the original archived inputs restored, use
Python and SymPy 1.14.0

```text
python work/goal-next/continuation45/forced/certify_tangent_value_growth.py
```

The code reads its pinned prior receipts from the current repo and the
original selected-input witness under continuation36. It writes only the
new scratch receipt. RELEASE HOLD.
