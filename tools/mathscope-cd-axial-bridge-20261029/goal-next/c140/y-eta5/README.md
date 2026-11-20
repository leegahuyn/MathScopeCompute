# Original live Y fifth-eta materialization and absolute tail gap

The C139 source-bound live N3 Repeat record has 567 literal natural-series
calls. Twenty-five request eta derivative order five. Nineteen have radial
order zero and six radial order one. The original `natural` node constructor
and rational `actualNaturalScaledTail` permit this derivative. Both public
`materializeActualNaturalSeries` and `actualNaturalRefinementModulus` return
`RESOURCE_LIMIT` for these 25 live signatures.

The unchanged original API was run on one representative of every affected
component/radial-order pair, first with the permitted fourth derivative.
At degree 2, the original coefficient generator then produces the same
fourth-derivative partial sum and the exact same AST at its root. Taking one
more eta derivative by the original AD and separately differentiating the
individual coefficients five times yield equal ASTs. The original rational
scaled tail succeeds at fifth eta order with the preserved positive input
bound `Y<=5`. The control has been replayed with identical bytes. It
supplies a concrete symbolic implementation route and does not modify the
original wrappers or evaluate those derivatives numerically.

## Tail modulus and required extra loss

For the observed k,m, use k+m<=8, m<=5. For n>=65,
`binom(n+m,m) (n)_k/(n+1)^2 <= (n+5)^8 <= 2^n`.
The base `70^8<2^65` and the decreasing consecutive ratio bounded by
`71^8/70^8<2` prove the second inequality inductively.
The exact fifth-derivative factorial prefactor `5!/6^2=10/3`
requires a loss; use `m!/(m+1)^2<4` for all m<=5.
On 0<=Y<=5 the original differentiated coefficient majorant then gives
tail at most `4 Q^(m+1) 2^(-N)` for N>=64, using the original
`rho^(-1)<=Q`. The pinned profile gives `Q<2^(131072 T)`.
Thus `ceil((m+1)*131072*T)+bits+2` is a conditional mathematical
modulus for the live orders under the same original B_rho theorem.
The added 2 accounts for the enlarged factorial bound.

## Separate numerical obligation

The native exact coefficient evaluator caps the retained degree at 64.
The tail-only API caps it at 10000. For literal Y=4 at original call
#4468 with k=m=0, the existing scaled tail certificate at N=10000 is
`1/(4*5^10000*10002^2)>2^-30031`. It decreases with N here.
The original profile gives `Q>2^(260+4*2^20)`. Hence the *bound*
after restoring Q exceeds one throughout both API ranges, even for this
zero-order literal. Its size is a limitation of the existing enclosure
with the stored norm, not a lower bound for the true approximation error.

The next implementation should retain the original pressure and source
coefficient recurrences while exposing eta order five, then derive a
tighter coefficient majorant or a certified evaluator which can enclose
the actual function without the existing degree cap. Tail amplification
by the exact source multipliers may be combined before estimating a
physical observable, but to certify raw Y values the resulting bound
must still apply to the requested raw component.

```text
node replay_original_natural_eta5.mjs ORIGINAL_M2_NAVIER C139/active-y-reach.json eta5-native.json
python -B check_eta5_modulus.py eta5-native.json C139/active-y-reach.json ORIGINAL_M2_NAVIER/source-profile-data.mjs result.json
```

No native API, tracked source, production state or acceptance count was
changed. RELEASE HOLD.
