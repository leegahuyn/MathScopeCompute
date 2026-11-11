# Actual second-Forced wave and mean operands

The replay authenticates the live 4,682,006-node graph and its native
registry. It compares the corrected 4,456,994-node first-cycle prefix and
the repaired 4,197,115-node first-Forced prefix byte for byte. The proof
uses the physical velocity and pressure roots in the corrected full export.

The eight live indexed operands are the three Forced velocities, Forced
angular pressure, the three Signed velocity increments and Signed angular
pressure. All eight use the same 162 source rows. The replay checks their
registered labels, values, derivative maps, coefficients and guards.
Every field has one original reference-to-own wrapper per sign. Its
actual coordinates are \((\sqrt{\rho}R,\rho^D Z,\rho T)\) with the
same remaining arguments, and its multiplier is \(\rho^A\) for
velocity and \(\rho^{2A}\) for pressure.

For each original fixed pair \((d,\mathrm{sign})\) the replay selects the
same own phase and seven literal zero-exterior guards in all eight
fields. It reads both positive and negative sine and cosine arms and
recovers the exact complex coefficients of each field. Their negative
coefficients are the conjugates of the positive coefficients.
The live PostFiveRepeatWave body equals the sum of the Forced and
Signed coefficients in each of the 160 slots. The Signed contribution
is literal zero in both arms at mode two. The Signed homogeneous
pressure contributes its actual mode-one imaginary coefficient. The
Forced wave includes the original primary velocity, full mapped
Forced curl and the original primary homogeneous pressure added to
the complete mapped Forced pressure.

Every checked live definition uses its actual free coordinate tuple
and is reached by the raw conservative source at that same tuple.
The receipt lists the native application roots and orders for each
slot. The equality can be differentiated at fixed labels wherever
the corresponding ordinary jets exist. The original cutoffs and
function arguments remain part of the equality.

For the four mean slots, the replay subtracts the two exact indexed
operands from the archived complete physical field. The resulting
angle-independent expression equals the live mean defining body.
Its application uses
\((R/\sqrt{\rho},Z/\rho^D,T/\rho,\ell_{\mathrm{ref}},Y_0,Y_1)\),
where the actual ratio exponent is
\((\ell-\ell_{\mathrm{ref}})\log 2\). The inverse powers are
\(\rho^{-A}\) and \(\rho^{-2A}\) for velocity and pressure,
respectively. This binds the refreshed FiveMap mean pressure as
well as the full angular pressure.

The verified equality is rowwise on the common ordinary derivative
domain. Boundary zero-extension jets and the vanishing of cross-row
products at derivative order retain their analytic hypotheses.

## Replay

    python check_repeat_own_wave_operands.py --repo REPO --first-dir FIRST --full-dir FULL --candidate-dir CANDIDATE --official-receipt independent-second-candidates.json --out repeat-own-wave-operands-detailed.json

Use the directories in the replay guide.
