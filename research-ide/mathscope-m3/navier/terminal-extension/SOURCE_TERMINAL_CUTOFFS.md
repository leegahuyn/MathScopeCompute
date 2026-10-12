# Source-valued terminal force cutoffs

`source-terminal-cutoff-schedule.mjs` retains the exact scalar source
programs for the terminal force norm bounds in (10.11)–(10.12). A norm
constant containing the original `exp(T)` does not need to be converted
to a floating-point number or an enormous materialized integer.

For each jet order `j`, the constructor requires every separate `C^a`
norm through `floor(j/2)`. It preserves the complete differentiated
cutoff constant `C_(j,m)` for every pair `a+m<=floor(j/2)`.
For a supplied norm upper bound `N`, it uses the positive majorant
`Nbar=1+N^2`; the exact identity
`1+N^2-|N|=(|N|-1/2)^2+3/4` proves this enlargement.

The integer choice is

```
b0 = 1
bj = ceil(max(b_(j-1)+1,
              max_(a+m<=floor(j/2))
                exp(log(2^j*C_(j,m)*Nbar_(j,a))/(j-m))))
```

Every threshold is positive and `j-m>0`. Consequently this is the least
integer satisfying all the differentiated inequalities for the retained
norm majorants and strict increase. It is not asserted to be minimal for
an unknown exact supremum norm. Neither logarithms nor source parameters
are rounded during this construction.

## Complete positive-time evaluation window

Given the full prefix through `J>=1`, the source-valued closed window

```
1/b_J <= sigma <= (1/b_J + 1/b_(J-1))/2
```

has exactly the possible active orders `0,...,J-1`. For every order at
least `J` in the same increasing continuation, `b_j*sigma>=1`, so the
cutoff is exactly zero, including the support boundary. Every preceding
order is retained even when it lies in a cutoff transition. This is a
positive window and does not include the terminal point `sigma=0`.

The vector consumer constructs the full expression

```
sum_(j=0)^(J-1) chi(b_j*sigma)*chi(-b_j*sigma)*sigma^j*F_j(x)/j!
```

from all three Cartesian components of every supplied force jet. The
jets must depend only on `x,y,z` and source constants. Time-dependent
jets, missing orders, unsubstituted source coordinates and caller-provided
source authority are rejected. Full source graphs, parameter definitions,
captured function definitions, cutoff metadata and force operands are
sealed, while independent graph extension remains possible.

## Validation

| Attempt | Node tests | Independent checks | Outcome |
|---|---:|---:|---|
| 1 | 7/7 | 929/937 | The checker needed to account for the exact folded value `b0=1`. It also incorrectly used rounded Decimal multiplication to test an exact support endpoint. The complete failure record and input source bytes are retained. |
| 2 | 7/7 | 937/937 | Passed after checking the folded rational values and using exact Fraction arithmetic for the support endpoint. Production code was unchanged. |

Attempt 2 captured and rechecked 22 source files and took 2.248 seconds
including the independent checks, within the unchanged 60-second and
384-MiB V8 limits. Its receipt SHA-256 is
`ba0880efdb1fc2cde7275c7abe3cc5131afdaac7b5a65e8735bd693d2c6e49fd`.

The independent checker reconstructs the full cutoff derivative
majorants, every exact constraint, the minimum integers and the complete
three-component force polynomial. It uses exact integer-power comparisons
for the scalar root ceilings. An independent logistic formula checks the
piecewise cutoff on declared polynomial fixtures at 80-digit precision;
exact support inequalities use rational arithmetic. Mutation controls
reject a missing differentiated constraint, a changed support power, a
missing active order, an omitted force component, a changed original
exponent and false source authentication.

## Actual source attachment still required

The exercised force jets and norm constants are explicitly fixtures.
The actual adapter must supply the whole localized-force jets on `K`,
their same-source norm bounds, and the uniform limits and origin-flatness
dependencies from (10.6)–(10.10). Infinite differentiated convergence
requires the corresponding norm generator at every finite order. A finite
prefix is not evidence for all-order smoothness or for the limit at zero.

Each constructed term has time support in `1<=t<=2` and inherits the
spatial support of its supplied force jet. This module never extends the
velocity past its singular terminal time. Original N7-04, N7-05 and whole
M3 completion flags remain false pending the actual source attachment.
