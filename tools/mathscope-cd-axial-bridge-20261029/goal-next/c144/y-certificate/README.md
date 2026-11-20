# Actual A.21 pressure at the original angular boundary

The original A.21 pressure program was independently replayed at
the literal angular input −1 used by the original C143 boundary
applications. The replay preserves its 12 finite stages and both
infinite exterior contributions. The first exterior contribution
changes exactly from 5 to 5/4 before multiplication by −K/2,
and the terminal exterior contribution is independent of eta.
The exact Node replay imports the original coefficient generator and
substitutes the actual angular rational through the original program.
The Python replay checks the stage constants, arithmetic bounds,
derivative coefficients, and original live call IDs.

## Late mass and transferable pressure ratios

Write $p(z)=P(z)/K$ and $F(z)=(1+z^2)^{-2}$, with
$K=P_*^2=e^{4T}$. In the original pressure representation the
normalized positive measure has a factor $1/2$ times the radial
density $e^{2\log A}$. The first infinite exterior term and the
first five stages have angular power $\theta=1$. After the pulse,
interpolation has $\theta\in[0,1]$ and the remaining six finite
stages and the exterior tail have $\theta=0$.

The initial log-amplitude at stage end is $-1/5$ by the original
step primitive $S(1)=1/2$. Axial decay and entry then decrease
the log-amplitude. The reserved power and pulse have slope
$-1/2-\lambda$. Therefore twice the log-amplitude at the start
of interpolation is less than $-13/\lambda<-1000T$,
using the original $\lambda=e^{-1000T}$.

On all following intervals through the wait, the source
log-amplitude slope is at most $-1/2$. In interpolation this
follows from the nonnegative step derivative. In steepening
the step term has nonpositive derivative, and in flattening
the slope is $-3/2+(1-h)\operatorname{step}\le-1/2$.
The source terminal factor is at most
$1/(1-h/256)<2$ throughout the terminal interval. The explicit
exterior slope continues the same exponential decay with the
terminal end amplitude. Thus the entire normalized late
pressure mass is below $2e^{-1000T}$, including the exterior
tail. This uses the original pressure-neutral angular edit identity
and nonnegative stage lengths.

On any complex circle of radius $1/32$ about real $\eta\in[-1,1]$,
each $(1+z^2)^{-2\theta}$ has magnitude below 4, since
$\operatorname{Re}(1+z^2)>1/2$. Subtracting the comparison with
all angular powers equal to one gives

$$
|p(z)-p(0)F(z)|<16e^{-1000T}.
$$

Cauchy differentiation through eta order six costs at most
$2^{44}$ including the factor 16. The resulting error remains
below $2^{-10000}$ even after restoring $K$. The real kernel
ordering and the positive exterior tail give

$$
0\le \frac{P(\eta)}{P(0)}-F(\eta)<2^{-10000},\qquad
\frac14<\frac{P(-1)}{P(0)}<\frac14+2^{-10000}.
$$

The absolute error for each ratio
$P^{(m)}(-1)/P(0)$ from $F^{(m)}(-1)$ is also smaller than
$2^{-10000}$. These ratio and transfer bounds use the original
pressure definition and its exact stage estimates. The separately
pinned published $P(0)/K$ interval gives finite numerical rational
enclosures of width less than $2^{-265}$ for all seven
$P^{(m)}(-1)/K$ values.

## Raw third derivatives without a numerical pressure coefficient

The original same-datum comparison for $u$ is $-YZ_*/(2L)$ and its
actual average is half that comparison. Inserting the A.21 transfer
into $Z_*$ gives the leading pressure part

$$
-Y P(0)\,\frac{\eta(3-\eta^2)}{(1+\eta^2)^3}
$$

for $u$. Its third eta derivative at −1 vanishes exactly.
For example, at $Y=4$, put $s=\eta+1$. The leading pressure
factor divided by $P(0)$ is
$(8-12s^2+4s^3)/(2-2s+s^2)^3$, whose cubic Taylor coefficient
is zero by the exact rational replay.

The pressure-free part of $Z_*$ at $h=j_0=0$ is
$-20\eta+32\eta^3$. It gives the geometric comparison
$10Y\eta-16Y\eta^3$, and thus third eta derivative $-96Y$.
On the disk of radius $1/64$ about −1, the geometric coefficient
change, including $L^{-1}$, costs less than $2^{13}h$.
The transferred pressure change costs less than
$2^{14}e^{-996T}+2^{17}hK$, including the $A$ and $L$ terms.
Here the pressure transfer uses the disk radius $1/32$ for a
Cauchy bound on its first derivative. Since $hK=e^{-7998T}$,
the combined coefficient error is below $2^{18}e^{-996T}$.
Multiplying by at most 4 for radial orders zero and one and using
the eta Cauchy factor below $2^{29}$ makes the error below
$2^{-20000}$. The original nonlinear same-datum error is below
$2^{-12468}$, so the final raw radius is $2^{-12460}$.

This covers 32 original third-eta-derivative $u$ and average
instances in the actual −1 boundary frames, where the original
branch uses the call. Seven have constant raw centers. Source
nodes #10205, #10212, #10219, #20520 and #79687 have radial order
one and center −96. The fixed literal $Y=4$ nodes #19953 and
#19950 have centers −384 and −192 respectively. The other 25
centers are $-96Y$ for $u$ or $-48Y$ for average. Every enclosure
is unscaled and uses the actual bounded radial domain.
These results use the pressure cancellation before any numerical
pressure value. Ten original $Y=4$ boundary $u$/average calls
also have separate scaled rational enclosures using the published
$P(0)/K$ interval.

The same-datum nonlinear proof and executed branch conditions
remain hypotheses for the natural calls. A general unscaled
absolute numerical interval for $P(0)$ at the inherited $K$ scale
and full physical Y acceptance remain open.

## Replay

~~~text
node replay_a21_source_boundary.mjs actual-continuation-exact-core.mjs a21-operands.json
python -B verify_a21_boundary_transfer.py SAME_DATUM_ANALYTIC_AXIS.md actual-global-source-outer.mjs actual-continuation-exact-core.mjs source-profile-data.mjs actual-background-data.mjs C143/eta-boundary.json C142/natural-range.json a21-operands.json a21-boundary.json
~~~

RELEASE HOLD.
