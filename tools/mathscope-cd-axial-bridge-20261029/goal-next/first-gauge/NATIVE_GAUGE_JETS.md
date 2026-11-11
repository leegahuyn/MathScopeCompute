# First correction on the original explicit N1 chart

The native delta extends the authenticated corrected post-Five source graph
from [GitHub Actions 43010593847](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43010593847).
It consumes the separately reviewed Forced and Signed potential bindings, the
first Forced prefix readback, the corrected residual, the FiveMap whole-integral
identity, and the pressure difference and support readback. The original
4,456,994 node records are byte-preserved in the joined stream. A further 2,643
nodes, 27 coupled expression definitions, and 3 indexed definitions provide
the physical increment and its symbolic derivatives.

The wave potential uses the original positive Forced and Signed modes
with the real opposite-mode reconstruction. All 162 label maps, the
outer five-way difference switch, and seven local guards are carried forward.
Each row uses its original coordinate dilation and the potential factor
\(\rho^{A-1/2}=\rho^h\). The ten integer winding identities were checked
against their actual source roots. The angular lift period and the
reference fast-time sign were also compiled on
[GitHub Actions 43028100332](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43028100332).

At the original explicit reference label \(\ell=\#622785+2\), the
ordinary chart has \(R=\sqrt{s/Q}\), \(Z=zQ^{-D}\), and \(T=\tau/Q\),
with \(s=x^2+y^2\) and physical time \(t=1-\tau\). The torus
arguments use the source radial phase and this physical time. The native
Cartesian A components and the pressure increment use an external polar
lift satisfying \(x=\sqrt{s}\cos\theta\), \(y=\sqrt{s}\sin\theta\).
The scalar \(b\) has exactly the free coordinates \((s,z,\tau)\) and
is \(Q^{-A-1/2}(\Delta v_{\rm Temporal}+\Delta v_{\rm Five})/R\).
The pressure increment is \(Q^{-2A}(\#4456439-\#3859821)\), with its
torus arguments substituted. Pressure derivatives use the selected physical
angle chart. The lift-period check is for the wave potential.

The five value roots have a lazy outer zero branch below \(s=QX_a\) and
above \(s=4QX_b\). The positive radial branch preserves the native
piecewise records, and the axis has an open zero collar. The derivative
roots use the strict interior of this outer shell and ordinary derivatives
where the source branches admit them. They use \(\partial_\tau\) as
requested, with physical \(\partial_t=-\partial_\tau\). Their 67
labels are the original request's 19 for each A component, 6 for b,
and 4 for pressure. Exact Cartesian polynomial controls at two radii
check the chain rule for all 23 distinct Cartesian multiindices. A
reversed angular derivative sign fails the control.

The 67 roots are symbolic expressions for the first increment. Strict
exterior and axis jets are zero by the source support proof. Positive-order
seam matching, uniform uncut input norms, reference-band gluing, later
cycles, and closed-cell interval evaluation remain open.

From this directory, using Python with SymPy and the extracted corrected
first-cycle artifact, run the following commands. Use a fresh output
directory for the joined graph.

    python materialize_first_gauge.py --repo REPO --artifact RUN_43010593847 --out first-gauge-native-delta.json
    python join_first_gauge_delta.py --base RUN_43010593847/corrected-first-cycle-graph --delta first-gauge-native-delta.json --out JOINED
    python verify_joined_first_gauge.py --joined JOINED --delta first-gauge-native-delta.json --out first-gauge-joined-readback.json

- [Native delta](first-gauge-native-delta.json)
- [Joined graph manifest](first-gauge-joined-manifest.json)
- [Joined readback](first-gauge-joined-readback.json)
