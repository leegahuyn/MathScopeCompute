# Compose the original 67 final jets with the shrinking cutoffs

The original finite-window summation multiplies each active correction's
Cartesian potential, direct azimuthal field and pressure by the same
\(k_j=\chi(a_jq)\) before forming the velocity. Its physical \(q\)
depends on \(z,\tau\) only. The scalar direct term has coordinates
\((s,z,\tau)\), where \(s=x^2+y^2\), and contributes
\((-y,x,0)b\). The exact source check ties this multiplication to the
original summation code and the original 67+13 stencil.

For any of the 67 labels \(\alpha\), let \(F_j\) be its potential
component, direct scalar or pressure. Its final derivative before the
separate outer localization is

\[
 D^\alpha F_0+
 \sum_{j=1}^4\sum_{0\le z\le\alpha_z,\ 0\le m\le\alpha_\tau}
 \binom{\alpha_z}{z}\binom{\alpha_\tau}{m}
 D_z^zD_\tau^m k_j\,D^{\alpha-(z,m)}F_j .
\]

The original later-stage support proof removes \(j\ge5\) on this slab.
The ledger verifies closure of the original 67 names under the required
lower derivatives. It contains 118 terms per stage and uses six cutoff
derivatives \((z,m)=(0,0),(0,1),(1,0),(1,1),(2,0),(3,0)\).
Independent differentiation checks all 67 expressions on exact rational
polynomial inputs. Omission of a cutoff derivative and a reversed time
convention are detected by the controls. The time labels use \(\tau\).
The localization stencil converts the physical time derivative to
\(-\partial_\tau\).

On the admitted slab use \(|\eta|\le3/4\), \(0<h<1/64\),
\(q/\tau_0\in[1/2,2]\), \(D=1/2-h\) and
\(L=1-2h\eta^2\ge503/512\). Write \(m_i=(a_jq)^i\chi^{(i)}(a_jq)\).
The exact original linear seed is evaluated in 256 closed cells with
80-bit outward rational intervals on \([1/2,1]\). The resulting integer
caps for \(|m_i|\), \(i=0,1,2,3\), are 1, 4, 33 and 854.
All positive cutoff derivatives vanish on the two flat branches.

Let \(z_i=q^{iD-1}\partial_z^i q\), \(t_1=1/L\) and
\(z_\tau=q^D\partial_z\partial_\tau q\). The source change of variables
gives \(z_1=2\eta/L\), \(|z_1|\le2\), \(|z_2|\le3\) and
\(|z_3|\le1\). The two exact differentiation orders give
\(z_\tau=4h\eta(1-\eta^2)/L^3\), with
\(|z_\tau|<1/16\). In particular the third axial derivative keeps
\(m_3z_1^3+3m_2z_1z_2+m_1z_3\). The mixed derivative keeps
\(m_2z_1t_1+m_1z_\tau\). All terms use the unchanged selected
\(a_j\), fixed during differentiation.

| Derivative | Bound after multiplying by \(\tau_0^{zD+m}\) |
| --- | ---: |
| value | 1 |
| \(\partial_\tau\) | 9 |
| \(\partial_z\) | 12 |
| \(\partial_z\partial_\tau\) | 203 |
| \(\partial_z^2\) | 288 |
| \(\partial_z^3\) | 22,290 |

The 67 derivatives use spatial factor \(\tau_0^{1/2}\) per Cartesian
direction and \(\tau_0\) per time derivative. For \(b\), each
\(s\) derivative uses \(\tau_0\). Therefore the normalized product
retains \((\tau_0^h)^z\) for every cutoff term. A known flat seam
replaces its positive cutoff derivatives by exact zeros. The original
outer cutoff retains its own 13 derivatives and applies after this sum.

The computed constants and derivative ledger are ready for closed-cell
stage input intervals on the same reference chart. Active stage values,
canonical cutoff branch selection and the final 67 certified intervals
remain OPEN. RELEASE HOLD.

Replay from any directory with Python and SymPy 1.14.0:

```text
python -B check_correction_jet_composition.py --goal GOAL_NEXT \
  --original-sum pinned-source/source-final-summation.mjs \
  --original-cutoff pinned-source/outer_cutoff.py --out NEW_OUTPUT.json
```
