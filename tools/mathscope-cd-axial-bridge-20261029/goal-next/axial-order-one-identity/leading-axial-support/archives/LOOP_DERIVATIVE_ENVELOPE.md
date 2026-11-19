# Explicit derivative bounds for the original shear loop

## 1. Actual input required

This lemma applies to equations (C.4)-(C.11) of the supplied paper,
SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
It uses `QUANTITATIVE_LOOP_SELECTION.md` and introduces no alternative
loop. Its input must later be supplied by the same completed profile.

Let \(y=\log X\), and fix a compact loop rectangle and \(S\ge2^{20}\).
A jet norm is the sum of absolute partial derivatives divided by their
multi-index factorials, through total order three, with the supremum
over the whole domain. It is a submultiplicative truncated Taylor norm.
Require the actual functions
\[
 a,\ t_s=-b_s/a,\ p_{s,1},\ p_{s,2},\ v_s,\ c_s,\ j_s,\ E,\ a^{-1},\ E^{-1}
 \tag{1}
\]
to have this norm in \((y,\eta)\) at most \(S\). Require
\[
 a,\ c_s-2,\ c_s-v_s,\
 2(c_s-v_s)^2-(v_s-2)j_s^2\ge S^{-1}, \tag{2}
\]
and \(v_s-2\ge S^{-1}\) on the two fixed boundary collars.
The relaxed condition is used in the interior; (2) does not assert
\(v_s>2\) there. These must be continuous bounds, not grid samples.

Write \(\mathcal E_k=\exp(S^k)\), for \(k\ge14\). No positive number
below is replaced by machine zero, and no exponential by infinity.

## 2. Completely specified scalar choices

Choose
\[
 d_0=(8S)^{-1},\quad a_-=S^{-1},\quad
 \mu_{\max}=S^{12},\quad \delta_L=\mathcal E_{16}^{-1}. \tag{3}
\]
The bracket in the companion note is at most
\(1+32S^2+2^{31}S^9<S^{12}\), including \(p_{s,2}=0\).
For \(Z=\mu_{\max}\sup|p_{s,2}|\le S^{13}\),
\[
 T_*\le S+S^{12}e^{2S^{13}}<\mathcal E_{14},\qquad
 J_*\le S+S\mathcal E_{14}<\mathcal E_{15}. \tag{4}
\]
The chosen \(\delta_L\) is below every entry in (5) of the companion:
\[
 e^{-S^{16}}<
 \frac{e^{-2S^{15}}}{32S^2}\le\frac{4d_0^2}{1+J_*^2},
\]
and it is also below \(1/2,d_0,(2S)^{-1}\).
Thus the full C.8 auxiliary family and the resulting loop have the
four raw cone gaps at least
\[
 \boxed{\mathcal E_{17}^{-1}}. \tag{5}
\]
Indeed each entry in the companion's minimum (6) exceeds this value;
the smallest displayed candidate is \(e^{-S^{16}}/8>e^{-S^{17}}\).

## 3. A fixed bound for the source smooth step

Use exactly (A.5). For \(f(t)=e^{-1/t^2}\),
\[
 f^{(k)}(t)=f(t)\sum_m c_{k,m}t^{-m},\quad m\le3k,\quad
 \sum_m|c_{k,m}|\le\prod_{j=0}^{k-1}(3j+2).
\]
For \(k\le8\), the coefficient bound is below \(26^8<2^{40}\).
For \(0\le m\le24\), the supremum of \(t^{-m}e^{-1/t^2}\) is at most
\(\max(1,12^{12})<2^{44}\). Thus \(|f^{(k)}|<2^{128}\).

The denominator \(g=f(t)+f(1-t)\), on \([0,1]\), satisfies
\(g\ge e^{-4}>2^{-7}\) and \(|g^{(k)}|\le2^{129}\).
Its reciprocal Taylor coefficients obey
\[
 c_0=1/g,\qquad
 c_k=-c_0\sum_{j=1}^k(g^{(j)}/j!)c_{k-j}.
\]
They are bounded by \(2^{144(k+1)}\) for \(k\le8\).
Leibniz's rule, including \(k!<2^{16}\), then proves
\[
 \boxed{|\sigma^{(k)}|\le2^{2048}\quad(0\le k\le8).} \tag{6}
\]
Flatness gives the same bounds at the endpoints and for the constant
extensions. This coarse bound is for higher derivatives; it does not
replace the sharp first/second derivative bounds of the moment operators.

## 4. Variance derivatives and the actual implicit root

Put \(M(z)=\langle e^{z\sin\theta}\rangle\) and
\(\mathcal R(z)=M(2z)/M(z)^2\).
For \(|z|\le S^{13}\), differentiation under the integral gives
\[
 |M^{(k)}(z)|\le e^{|z|},\quad M(z)\ge e^{-|z|},\quad
 |(M^{-1})^{(k)}(z)|\le k!\,2^k e^{(2k+1)|z|}\quad(k\le8).
\]
The last inequality follows from the reciprocal Taylor recurrence.
The product rule bounds every \(\mathcal R^{(k)}\), \(k\le8\), by
\(2^{128}e^{40S^{13}}<\mathcal E_{15}\).

Use the exact removable quotient
\[
 Q(z)=\frac{\mathcal R(z)-1}{z^2}
      =\int_0^1(1-s)\mathcal R''(sz)\,ds. \tag{7}
\]
Consequently \(Q^{(k)}\), \(k\le6\), is bounded by \(\mathcal E_{15}\),
including at zero. If \(g=\log M\), its tilted-variance identity gives
\(g''(t)\ge e^{-2|t|}/2\). Expressing \(g(2z)-2g(z)\) as a double
integral proves
\[
 Q(z)\ge\tfrac12e^{-4S^{13}}>\mathcal E_{14}^{-1}. \tag{8}
\]
No interval is divided by a possibly zero \(z\).

The signed square root of the variance is
\(W(\mu,p)=d_0\mu\sqrt{Q(\mu p)}\).
Square-root derivatives through order three, using (8), and the
product rule bound its partial derivatives in \((\mu,p)\) by
\(\mathcal E_{19}\). The previously proved simple-root estimate gives
\[
 W_\mu\ge(d_0/4)e^{-6S^{13}}>\mathcal E_{14}^{-1}>0. \tag{9}
\]
This includes \(\mu=0\); it does not use \(V_\mu(0)>0\), which is false.

Choose the literal C.9 cutoff
\[
 \zeta_L(v_s)=1-\sigma\!\left(
 \frac{v_s-(2+\delta_L/8)}{\delta_L/8}\right).
\]
Its derivatives through order three in \((y,\eta)\) are bounded by
\(\mathcal E_{18}\), using (6). Where it is supported,
\(v_*-v_s\ge\delta_L/4\), so
\[
 r=\zeta_L(v_s)\sqrt{v_*-v_s}/\sqrt a,\qquad
 \|r\|_{\mathrm{jet},3}\le\mathcal E_{20}. \tag{10}
\]
Its zero extension is smooth by the step's flatness, with the same bounds.

For \(F(\mu,y,\eta)=W(\mu,p_{s,2}(y,\eta))-r(y,\eta)\), every partial
derivative through total order three is bounded by \(\mathcal E_{22}\).
Differentiate the exact implicit equation:
\[
 \mu_i=-F_i/F_\mu,\qquad
 \mu_{ij}=-\frac{F_{ij}+F_{\mu i}\mu_j+F_{\mu j}\mu_i+
                         F_{\mu\mu}\mu_i\mu_j}{F_\mu}.
\]
The first derivatives are below \(\mathcal E_{23}\), the second below
\(\mathcal E_{26}\). One further differentiation has at most sixteen
third-order products and twelve lower-order products. Together with
(9), their sum is below \(\mathcal E_{30}\). Therefore the unique
whole-parameter branch satisfies
\[
 \boxed{\|\mu\|_{\mathrm{jet},3}\le\mathcal E_{30}.} \tag{11}
\]

## 5. Original circle map, inverse, and loop derivatives

The denominator in C.5 is handled by the exact integral
\[
 t=t_s+d_0\mu\int_0^1
 \left.\partial_z\!\left(e^{z\sin\theta}/M(z)\right)
 \right|_{z=s\mu p_{s,2}}\,ds. \tag{12}
\]
Mixed derivatives through total order eight of the exponential numerator
are the same exponential times a polynomial in \(z,\sin\theta,\cos\theta\).
Its coefficient absolute sum is at most \(17^8<2^{40}\): at each of at
most eight differentiations the polynomial degree is at most sixteen,
and its coefficient sum grows by at most seventeen. Its magnitude is
therefore at most \(2^{40}(1+|z|)^8e^{|z|}\).
The reciprocal estimates and (11), with ordinary
finite chain rules, give
\(\|t\|_{\mathrm{jet},3}\le\mathcal E_{35}\) in \((y,\eta,\theta)\).
The sharper pointwise bound (4) still holds.

The target \(v=v_s+\zeta_L(v_s)^2(v_*-v_s)\) has
\(2<v\le2S\) and jet norm at most \(\mathcal E_{20}\).
Use exactly the lifted circle variable
\[
 \phi(\theta)=\int_0^\theta
 \frac{a(1+t(\theta')^2)}{2\pi v}\,d\theta'.
\]
The density and its derivatives through order three are bounded by
\(\mathcal E_{38}\). Integrating over length below eight bounds the
lift derivatives by \(\mathcal E_{39}\). In addition
\[
 \partial_\theta\phi\ge(16S^2)^{-1}. \tag{13}
\]
The variance equation gives
\(\phi(\theta+2\pi)=\phi(\theta)+1\) exactly.
The first, second, and third implicit derivative identities, now with
(13), bound the inverse circle map's jet by \(\mathcal E_{48}\).
These local formulas agree across the seam of the circle.

The actual loop is \((a_L,-b_L)=v(1,t)/(1+t^2)\) after that inverse
substitution. The denominator is at least one; its reciprocal derivatives
use the same finite recurrence. Each mixed partial through order three
is below \(\mathcal E_{55}\). There are at most twenty multi-indices,
so the jet norm is below \(\mathcal E_{56}\).
The exact means are \((a,-b_s)\); the loop equals the original shear on
the specified boundary collars.

For reproducibility, the deliberately loose finite jet budget is:
| Object | Maximum budget |
| --- | --- |
| \(M^{-1}\), \(\mathcal R^{(k)}\), \(k\le8\) | \(\mathcal E_{15}\) |
| \(Q^{(k)}\), \(k\le6\); \(Q^{-1}\) | \(\mathcal E_{15}\) |
| Square root of \(Q\), three derivatives | \(\mathcal E_{17}\) |
| \(W\), three mixed derivatives | \(\mathcal E_{19}\) |
| Cutoff, square roots in the right side, full \(r\) | \(\mathcal E_{20}\) |
| \(F\) derivatives; \(F_\mu^{-1}\) | \(\mathcal E_{22}\); \(\mathcal E_{14}\) |
| \(\mu\), first / second / third derivatives | \(\mathcal E_{23}\) / \(\mathcal E_{26}\) / \(\mathcal E_{30}\) |
| \(t\), full mixed jet | \(\mathcal E_{35}\) |
| Circle density / lift / inverse lift | \(\mathcal E_{38}\) / \(\mathcal E_{39}\) / \(\mathcal E_{48}\) |
| Actual loop, full mixed jet | \(\mathcal E_{56}\) |
| Two zero-mean primitives | \(\mathcal E_{60}\) |

All entries follow by the explicitly displayed reciprocal/implicit
recurrences, the product rule, and derivatives under finite integrals.
The exponential audit checks their fixed numerical absorptions. No
unspecified derivative constant occurs in this table.

## 6. The primitives consumed by C.12

The zero-mean primitive is the primitive from zero minus its mean over
one period. Both integrations have length one and cost at most two.
For the same source field \(E\),
\[
 \partial_\phi A=-\tfrac12(a_L-a),\qquad
 \partial_\phi B=\tfrac12 E(b_L-b_s)
\]
therefore gives
\[
 |A|_{C_\eta^2},\ |B|_{C_\eta^2},\
 |D_XA|,\ |D_XB|<\mathcal E_{60}. \tag{14}
\]
The first two norms use the factorial convention of the C.12 contract.
All differentiations under these finite integrals are justified by their
smooth integrands and the preceding uniform bounds.

Consequently the exact envelope
\[
 \boxed{R=\exp(S^{256})} \tag{15}
\]
covers the loop, its primitive derivatives, and the reciprocal of its
raw cone margin. If the other source, radial, moment, patch, and preserved
collar bounds in `C12_FREQUENCY_CONTRACT.md` are at most \(S\), with
positive lower bounds at least \(S^{-1}\), (15) supplies every input to
that contract. The same final construction then uses
\[
 \boxed{N=1+\left\lceil\exp(50S^{256})\right\rceil,\qquad
 \kappa=\exp(-10S^{256}).} \tag{16}
\]
These are selected once, before a physical-scale limit.

## 7. Audit boundary

The bounds are about the specified continuous integrals, implicit root,
and inverse circle map. They still require the actual source to supply
(1)-(2). A scalar audit or a user-provided norm field cannot prove that
source premise. Until an envelope for the same pressure, axis,
continuation, B.8 repair, and heat-prepared outer is attached and
verified, (16) remains conditional and does not close N3-06.

