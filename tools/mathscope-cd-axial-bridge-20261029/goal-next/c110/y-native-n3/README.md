# Original N3 pressure, moments and fixed-history coefficient error

**VERIFIED.** The original induction producer constructs N3 as two separate systems. Native system `#5` uses the real common activation collar, its own strip `s=delta/(8*256^3)` and the original six-component norm `C`. Auxiliary system `#4` uses the source natural radius `25/4`. The earlier N2 prefix is identical byte for byte after source graph serialization. The N3 native lower records use the actual cut forms through N2. They differ from the corresponding global moment-compensated records, which the exterior lower operands use. The previous directed background norms were pinned for provenance. The N3 native tail uses the original induction norm.

The raw known pressure is `2 F1 F2 - Ω2/2` using the actual cut lower histories. For whole-support pressure and moment debts the source independently computes the nine-term `Ω2` using the global lower histories. The original switch uses the raw `Ω2` below `aSquared`, the whole expression up to `Xplus`, and its zero continuation. The three lower-only nonlinear integrals keep actual `eta` and the whole bounds `0..Xplus`. Original angular and axial forcing use both cross-orders `(1,2)` and `(2,1)`, plus the original previous-order viscosity from order two. The replay keeps that history when forming the finite approximation.

Here `N=3` is physical coefficient order. At partial-sum depth `K`, denote the retained first `K` Picard increments by `P_K`. The original independent diagonal pressure row gives

```
d_xi(P_(K+1))_Pi = 4 xi F0 (P_K)_F + 2 xi pKnown.
d_X(P_(K+1))_Pi = 2 F0 (P_K)_F + pKnown.
```

The second equation uses `X=xi²` away from the axis and its smooth one-sided ordinary limit on the axis. The source depth-2/3 check certifies the exact pressure primitive and rejects depth-2 for both storage slots. The two `U` and `Avg(U)-U` rows use the preceding last component `g=(P_(K-1))_5` with diagonal exponents `0,2` and opposite signs. The explicit inverses give `U_K(xi)=∫₀^xi g(t)dt` and `Avg_K(xi)-U_K(xi)=-xi^-2∫₀^xi t²g(t)dt`. Integration by parts gives the actual finite average of `U_K`, with its regular axis limit. Termwise primitive checks agree after preserving their distinct bound variables. All five original normalized moment equations are rechecked after substituting the finite N3 profile while retaining exact lower histories. The protected original lower pressure density and lower integrals remain unchanged.

The two original N3 stress bodies retain actual `eta`, and use 12 axial and 11 weighted angular terms. The source's forward stress primitive integrates from `Xminus` to `X`. The backward primitive uses `X` to `Xplus` with a distinct radial binder and the same unchanged density. The fixed cutoffs have zero `eta` derivative. The independent radial FTC rejects the wrong forward sign for each stress. These are source-form identities on the original open domain. A quantitative N3 stress comparison would in addition require ordinary error derivative bounds and conservative remainder transfer.

**CONDITIONAL.** Under the original analytic native-tail premises at fixed exact original N0, N1 and N2 histories, the following finite realizations have uniform absolute errors less than `2^-256` for `F3`, `U3` and `Pi3`. The same bound holds separately for each absolute `L1(dX)` error on `X>=0`. This is an explicit symbolic depth, with no substitution for the original source parameters.

Write `e=4^-K/3`, `B=max(1,Xplus)`, and `L0=max(1,B_inner)`. Each raw velocity coefficient error is bounded by `e` and each raw pressure coefficient error at `K+1` is bounded by `e/4`. The original taper lies within the native interval and has modulus at most one. The five local moment densities have difference caps `e`, `2B e`, `2L0 e`, `4B L0 e`, and `2L0(1+B)e`. Exact fixed lower terms cancel. Integrating gives a common debt cap `M e` for `M=4 B² L0`.

The original normalization uses `R=Rbase`, `lambda`, and `R1=R^(1-2lambda)`, `Rp=R^(-2-2lambda)`, `Rz=R^(-2lambda)`. Its actual positive amplitude satisfies the exact source identity `ef(eta)=Ef/(1+eta²)`, where `Ef=ef(0)`. Thus `Ef/2≤ef≤Ef` uniformly for `eta∈[-1,1]`. Use nonnegative right-side cap vectors

```
ur = [1/R, (1/R+2/(Ef R1))/(2lambda)]
er = [1/R², 1/(Ef Rp), 2/(Ef Rz)]
```

For each of the actual inverse matrices, replace an entry `m` by `1+m²≥|m|` in its absolute-error estimate and contract its rows against the corresponding cap vector. Their respective largest row values are `Iu` and `If`. The original bump cutoff has width `1/2048`; the certified ordinary first step derivative bound `≤16` gives bump height `C_b=2^15`. The denominators are at least `R` for the two axial bumps and `R²` for the three angular bumps. Define `Q_U=2 C_b Iu/R` and `Q_F=3 C_b If/R²`. The whole-support velocity gains are `TU=1+M Q_U` and `TF=1+M Q_F`.

On the pressure collar the exact lower prefix cancels. The local pressure difference is at most `2B L0 e`. The actual leading angular monomial on the correction support is at most `Ef Rp`, because `sqrt(2X)≥R`. The integrated correction-pressure difference is at most `2B Ef Rp M Q_F e`. The pressure gain is therefore `TPi=1+2B L0+2B Ef Rp M Q_F`. Each actual and finite coefficient has the same outer zero guard. Multiplying its pointwise bound by `B` bounds its absolute radial integral. The source graph derives the closed depth and error expression

```
K = max(1,Kcondition,ceil(log_4(2^256 B max(TF,TU,TPi))))
B max(TF,TU,TPi) 4^(-K) / 3 < 2^-256.
```

**OPEN.** The desired symbolic depth is at least 128. The original displayed native partial-sum routine rejects counts above eight. The replay explicitly exercises that limit and verifies finite depth two and three expression identities without treating them as evaluated native values. Coupling finite N1/N2 lower errors into N3, higher-order Y, and the N3 quantitative stress estimate remain open. No gate status is promoted.

## Replay

From the workspace containing the saved inputs, run the two tools with fresh output paths. The original M2 `navier` runtime is the cached one used by C103 and C106. The three input JSON files are C103 `n2-pressure-compensation-operands.json`, C106 `coupled-n2-stress.json`, and C106 `background-c16.json`.

```text
node replay_native_n3.mjs ORIGINAL_NAVIER C103_OPERANDS C106_PAIRED C106_BACKGROUND NEW_OPERANDS
python -B check_native_n3_bound.py --operands NEW_OPERANDS --out NEW_RESULT
```
