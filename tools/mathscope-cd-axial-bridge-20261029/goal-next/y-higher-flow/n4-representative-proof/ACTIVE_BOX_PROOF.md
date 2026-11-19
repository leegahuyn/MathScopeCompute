# Independent proof of the ORIGINAL active-box representative construction

This is an ordinary real-analysis proof for the exact original construction,
independent of its stored `proof` strings. The accompanying source replay
reproduces its six actual selected roots and native inverse residual exactly.
It does not claim a newly compiled Lean theorem for the whole construction.

## Precise hypothesis and conclusion

Write `D=1/2-h`, with `0<h<1/16` and `0<Xa<Xb`. Let the three boxes be
`(Rl,Ru)`, `(Zl,Zu)`, `(Tl,Tu)`. Suppose there is an ORIGINAL physical point

```
R0 > 0,  1/2 < s0 < 2,  Xa < X0 < Xb,  |eta0| <= 1,
R0^2 = 2*s0*X0,
Z0 = s0^D*eta0,
T0 = s0*(1-eta0^2) >= 0,
Rl<R0<Ru,  Zl<Z0<Zu,  Tl<T0<Tu.
```

Then the original selected formula below has a uniquely defined native root
in `(1/2,2)`. Its result is in the same three open boxes and obeys
`Rrep>0`, `Xa<Xrep<Xb`, `|etarep|<1`, `Trep>0`, with the exact original
slow-chart equations. Choices depend only on the boxes and source constants.

The positivity of the physical radius is essential. A condition on `R0^2`
alone cannot replace it. The accompanying radial ingress audit verifies
the actual 24 native radius replacements lie inside strictly positive
original integral intervals, under the original positive physical radius.
Alternatively nonnegative radius plus the active shell and `s>0` suffices.

## Exact source formula and binding

`originalRepresentativeBoxReduction` and `finishOriginalBoxRepresentative`
in the pinned `source-global-representative.mjs` give

```
rLow = max(0,Rl)
L = max(1/2, rLow^2/(2*Xb))
Uraw = min(2, Ru^2/(2*Xa))
U = max(L,Uraw)
TL = max(0,Tl), TU = Tu
a = (L-TU)/L^(2*h), b = (U-TL)/U^(2*h)
zlo = sqrt(max(0,a)), zhi = sqrt(max(0,b))
Ineg = [max(Zl,-zhi), min(Zu,-zlo)]
Ipos = [max(Zl,zlo), min(Zu,zhi)]
Z = midpoint(Ineg) if width(Ineg)>0, else midpoint(Ipos)
F(s) = s - Z^2*s^(2*h)
J = [max(TL,F(L)), min(TU,F(U))]
T = midpoint(J)
s = unique root of F(s)-T on [1/2,2]
K = [max(Rl,sqrt(2*Xa*s)), min(Ru,sqrt(2*Xb*s))]
R = midpoint(K), X=R^2/(2*s), eta=Z/s^D.
```

Replay binds the exact ORIGINAL roots
`R=4588863, Z=4588838, T=4588851, s=4588852, X=4588867, eta=4588872`.
It uses the actual arithmetic methods and regenerates the original inverse
definition 2, body `4587653`, on the actual bracket nodes `19=1/2,24=2`.
The actual sign guard is `#4588838 = smooth_piecewise(#4588831,0,0,
#4588837,#4588837,#4588835)`. Its zero-width tie takes the positive midpoint.
Only two emitted operations for unused `positiveWidth` metadata lack original
reached IDs; they are explicitly assigned scratch IDs beyond the entire
7,358,162-node original graph. All six live root IDs match exactly.

## 1. Positive-time witness, including the original T=0 boundary

If `T0>0`, keep the witness. If `T0=0`, then `eta0^2=1` and `Z0!=0`.
Replace `eta0` by `(1-delta)*eta0`, keeping `R0,s0,X0`. For any sufficiently
small `delta>0`, the new point remains in the axial box, and

```
Zdelta=(1-delta)*Z0,
Tdelta=s0*(2*delta-delta^2)>0.
```

The time box contains 0 in its interior, so `Tl<0<Tu`. Choose

```
0<delta<min(1, (Z0-Zl)/abs(Z0), (Zu-Z0)/abs(Z0), Tu/(2*s0)).
```

Then the axial displacement is less than both axial margins and
`0<Tdelta<2*s0*delta<Tu`; hence the new point is still in the same box.
The unchanged shell and slow-coordinate conditions remain strict.
Therefore a witness with `T0>0` always exists, and henceforth use it.

## 2. Radial projection is strictly nonempty

Since `max(0,Rl)<R0`,

```
rLow^2/(2*Xb) < R0^2/(2*Xb) = s0*X0/Xb < s0.
```

Since `Ru>R0>0`,

```
Ru^2/(2*Xa) > R0^2/(2*Xa) = s0*X0/Xa > s0.
```

Together with `1/2<s0<2`, these prove `L<s0<Uraw`.
Thus the harmless empty-box extension has no effect: `U=Uraw`, and
`1/2<=L<s0<U<=2`. Also `TL<T0<TU` and `TL>=0`.

## 3. Axial squared interval contains the witness strictly

For any `z^2<=2` and `1/2<=s<=2`, differentiation gives

```
d/ds [s-z^2*s^(2h)] = 1-2h*z^2*s^(2h-1)
                      > 1-8h > 1/2.
```

Indeed `2h-1` is negative and greater than `-1`, so
`s^(2h-1)<=2^(1-2h)<2`; hence the subtracted term is `<8h`.
The bound `Z0^2=s0^(1-2h)*eta0^2<=2` follows from `s0<=2`,
`0<1-2h<1`, and `eta0^2<=1` (split at `s0=1` if needed).
Thus the witness's `F0` is strictly increasing on the whole bracket, giving

```
F0(L)<T0<TU,   TL<T0<F0(U).
```

Divide by the positive endpoint powers to obtain
`a<Z0^2<b`. In particular `b>0` and `a<b`.

## 4. Original sign choice, including Z0=0 and zero negative width

If `Z0>0`, then `zlo<Z0<zhi`, and its axial-box intersection with the
positive sign interval has strictly positive width. If `Z0<0`, the same
holds for the negative sign interval. If `Z0=0`, then `a<0<b`, so
`zlo=0<zhi`; the open axial box contains both sufficiently small positive
and negative numbers. Thus at least one of `Ineg,Ipos` has positive width.

When `width(Ineg)>0`, the actual source chooses its midpoint. Otherwise,
the positive interval has positive width and the source chooses its midpoint.
This includes the equality `width(Ineg)=0`: the native `<= left` branch
takes the positive midpoint, even though both thresholds are 0.
In either case the selected `Z` is strictly inside the axial box and
`a<Z^2<b`.

The tie direction is necessary: with `zlo=0,zhi=2,(Zl,Zu)=(0,1)`,
`Ineg=[0,0]`, `Ipos=[0,1]`. Choosing the negative midpoint at the tie would
select the excluded axial boundary 0. The actual source selects `1/2`.
This is a minimal rational branch countermodel, not a claim that source
parameters have been replaced by these values.

## 5. Time midpoint and the actual native inverse are valid

The selected value satisfies

```
Z^2 < b = (U-TL)/U^(2h) <= U^(1-2h) <= 2.
```

Consequently its `F` is continuous and strictly increasing on `[1/2,2]`
by the same derivative estimate. The strict squared bounds give
`F(L)<TU` and `TL<F(U)`. Along with `L<U` and `TL<TU`, all four cross
comparisons imply

```
max(TL,F(L)) < min(TU,F(U)).
```

The time midpoint is therefore in both open intervals and is strictly
positive. The intermediate value theorem gives a root strictly between
`L` and `U`; strict monotonicity on the entire original bracket makes it
the unique root of the actual native definition `s-Z^2*exp(2h log s)-T`.
Thus there is no unproved inverse-existence oracle at this selected point
in ordinary real analysis, once the stated active physical witness is given.

## 6. Radial midpoint and original physical image

At the selected root `L<s<U`, prove the four comparisons between the two
lower candidates and two upper candidates in `K`:

* `Rl<Ru`, since the original live radius is in that box.
* `Rl<sqrt(2*Xb*s)`, from `s>rLow^2/(2*Xb)` and `rLow>=max(0,Rl)`.
* `sqrt(2*Xa*s)<Ru`, from `s<Ru^2/(2*Xa)` and `Ru>0`.
* `sqrt(2*Xa*s)<sqrt(2*Xb*s)`, from `0<Xa<Xb` and `s>0`.

So `K` has strictly positive width. Its midpoint is positive, lies in the
original radius box and satisfies `Xa<R^2/(2s)<Xb`. The selected `Z,T`
are in their original boxes. Since the root equation gives

```
eta^2 = Z^2/s^(1-2h) = 1-T/s,
```

and `T>0,s>0`, the result has `eta^2<1`. Nonnegativity is automatic from
being a square. Thus the selected representative is strictly inside the
original admitted physical chart and the same active mesh box.

For actual mesh boxes of half-width `3/(4*ell^6)` with `ell>0`, any other
active point in that box differs in each coordinate by less than
`3/(2*ell^6)`. Its Euclidean distance is less than
`3*sqrt(3)/(2*ell^6)<4/ell^6=4/S^3`, since `27<64` and `S=ell^2`.

## Scope and remaining formal obligations

VERIFIED (finite original source): selected live formulas, all six root IDs,
native residual and bracket, sign branch/tie, and 24 radius-only native frame
arguments with all-path lexical binder domination. The negative binder
control loses all 24 facts. No numerical native value was used.

PROVED HERE (ordinary real analysis, under original live physical premise):
the original active-box geometry and selected native inverse existence,
including zero-time boundary and zero axial coordinate. The stored source
proof strings were not used as evidence.

CONDITIONAL (formal verification): the full argument above has not yet been
compiled into one Lean active-box theorem. Existing compiled slow-chart
derivative/inverse/image and radial transport lemmas may be reused, but they
do not by themselves formalize the interval/sign selection and perturbation.
Initial admitted physical input and native-real/Leibniz semantics remain
explicit; this does not prove arbitrary recursive n, integral equality to
`#117047`, all endpoint derivative commutations, or final field values.

No project counter or RELEASE HOLD status is promoted by these artifacts.
