# An active N3 whole-K cell and its mode-two source path

**VERIFIED.** The replay authenticates the original N3 Current/Pressure
archive from GitHub run 43057719849 and selects its actual plus-sign
cover row 0:0:0:0. The six archived full-curl velocity coefficient
roots are bound to the actual original potential systems and their
R, Z and xi derivative calls. The replay checks the native live and
frozen operands and the exact original selector ratios. It executes
the original lift, pulse-path and local harmonic kernels on the typed
coefficient slots for each of the five allowed palette differences.

## Physical slow point and the actual frozen representative

Set ell = ellMinimum + 15, Q = qBig/32 and s = T = 4/5. Take R = 2
and Z = eta = 0. Then q = qBig/40 and X = 5/2. This point is strictly
inside the physical whole-K slow slab. The original profile uses
Xa = 4/Lambda and Lambda = Q^64 > 2, so Xa < 2. The original terminal
Xb is greater than XR > 110. The angular lift separately uses the
geometric constant 4-sqrt(2).
The original nearest band is ell since log2(5/4) < 1/2. The original
nearest grid is (2 ell^6, 0, m), where m = floor(4 ell^6/5+1/2).
All three mesh offsets have magnitude at most 1/2 and the original
guard permits strict magnitude below 3/4.

Write S = ell^6 and w = 3/(4S). The fixed representative algorithm
uses radius box [2-w,2+w], axial box [-w,w] and time box
[m/S-w,m/S+w]. Since ell >= 23, w < 1/100. The radial reduction has
sLower=1/2 and sUpper>1. Its negative axial interval is exactly
[-w,0]. Indeed the lower axial threshold is zero and its upper
threshold exceeds w, from sUpper>1, the time box upper endpoint
below 82/100, and sUpper^(2h)<2. The selected axial coordinate is
therefore Zrep=-w/2. At this coordinate the time box lies between
the two endpoint values of s-Zrep² s^(2h), so Trep=m/S.

The actual representative inverse is #2088169. Its equation gives
srep=Trep+Zrep² srep^(2h) and hence
abs(srep-4/5) <= 1/(2S)+w²/2 < 1/100. At this srep both original
radial mesh endpoints lie inside the admissible shell, so the
representative takes their midpoint Rrep=2. The source therefore
uses Xrep=2/srep and etaRep=Zrep/srep^D. It retains the actual
native representative argument IDs #2088184/#2088189/#2088169.

The physical selector arguments b_j q are
1/40, 2/5, 4/5 and 8/5 for j=1,2,3,4. The frozen arguments b_j Q srep
have enclosures (79/3200,81/3200), (79/200,81/200),
(79/100,81/100) and (79/50,81/50). The first two cutoffs are one,
the third is in the actual transition, and the fourth cutoff and
its jets vanish in both evaluations. This is an actual N3 cell,
not the archived N1 branch or a bottom-edge N4 frozen cell.

## Archived typed calls and the remaining source export

The plus-sign current retains original native potential systems
1778, 1779, 1780 and the three real curl roots
#2089593/#2089595/#2089597. Its imaginary curl roots are
#2089598/#2089600/#2089602, including the reciprocal-radius term.
The archived cover row supplies the actual local transverse and
pulse arguments #2105453 and #2105458. The local harmonic kernel
replays mode two as the exact conservative square of the original
positive wave, with half-amplitude convention. Subtracting the
carrier-free expression yields exactly twice the wave times its
full-curl divergence. The mode-zero mean and the fundamental
pressure have no mode-two contribution.

For the selected source row, its original auxiliary rectangle
center admits an exact lift with xi=0 and v=Ls/2. Each allowed
integer covering matrix has determinant 14^delta and is surjective
on the auxiliary torus. The original H_w path preserves xi and
maps the pulse endpoint to w. For 0<=w<=Ls, its mapped offset from
the rectangle center has magnitude at most r0 in either torus
coordinate, so the integer copy can stay fixed. This proves the
auxiliary path.

## Physical support inside the same cell

Keep q, Z and T fixed and vary R within 3/(8 ell^6) of the mesh center.
The original physical torus map, already scaled to the own label,
has a radial sweep longer than 2^80 along (1, 1-sqrt(2)).
The directed calculation verifies the source exponent and the
original scale inequality used for the sweep. A Pell convergent with
denominator 1,513,744,654,945 gives an exact first coordinate and
second-coordinate error below r0/8 for some R in this interval.
The literal original transverse and pulse guards give chi=psi=1
and 7/16 < v/Ls < 9/16. The original nearest cover and its fixed
representative stay the same. This establishes a supported physical
point and does not require the mesh center itself to hit the support.
The wave value at this point and the missing native Forced output
remain separate.

The authentic archive ends at Current/Pressure. Its six indexed
covariance fields and typed wave slots do not contain an Initialized
Angular mode-two vector or a Forced pulse output. The next narrow
export must retain the active native initialized positive wave
wrappers after freezing and the fixed lift, the actual raw/supported
mode-two vector, and the same template's projected input, H_w
arguments, zero-data system and mapped outputs. No newer same-family
or whole-K final-field C3 assertion follows from this local replay.

## Replay

~~~sh
node --stack-size=4096 replay_n3_mode_two_path.mjs GOAL_NEXT N3_ARCHIVE ORIGINAL_RESEARCH_IDE active-n3-mode-two-path.json
python -B check_active_n3_graph.py --goal GOAL_NEXT --archive N3_ARCHIVE --out active-n3-python-readback.json
node --stack-size=4096 prove_n3_physical_fast_support.mjs GOAL_NEXT ORIGINAL_RESEARCH_IDE ARITHMETIC_RUNTIME HISTORICAL_INPUT active-n3-mode-two-path.json active-n3-python-readback.json active-n3-physical-fast-support.json
~~~

N3_ARCHIVE is the extracted original run directory with the
Current/Pressure graph and original-whole-k-prefix.json.
ORIGINAL_RESEARCH_IDE is the original runtime's research-ide tree.
The JavaScript receipt SHA-256 is
c7ce0df6ad4082b2d8d1330d2d4c434d0cb812f597f58992e6f8e50a517d7ee2.
The Python checker streams 3,914,395 exact JSON node records and checks
8,345,579 backward operand edges and the selected native operand IDs.
Its receipt SHA-256 is
4357f51b23a181bf8184a1ce836d9e4d1de51dad71eda640e3334366459a1d35.
The physical support receipt SHA-256 is
e2568961ead64b62898c5f2052c08b85e144b39f4a85db0f2921089cf0fb4338.
The historical input and arithmetic runtime are the pinned sources
for the existing original annular directed bounds.
