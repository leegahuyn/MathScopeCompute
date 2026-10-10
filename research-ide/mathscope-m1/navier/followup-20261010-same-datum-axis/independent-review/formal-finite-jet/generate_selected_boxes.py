#!/usr/bin/env python3
"""Emit exact Lean rationals from the frozen, directed 256-bit coefficient table.

The table is input, never a proof oracle. Lean separately evaluates each
factorial reference coefficient and checks every endpoint inequality.
"""
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
DATA = HERE.parent.parent / "evaluated-phi-mixed-comparison.json"
EXPECTED = "eb7e2448416c4be63d86c41d2be7ad6c6c11c057bc2a852b30b95807232e49b5"
raw = DATA.read_bytes()
assert hashlib.sha256(raw).hexdigest() == EXPECTED
d = json.loads(raw)
rows = [r["etaTaylorCoefficients"][0] for r in d["coefficients"]]
assert len(rows) == 25
assert all(r["xiTaylorDegree"] == 0 for r in rows)

header = '''import FieldBounds
import AxisFiniteJet

/-! Exact selected coefficient enclosures. The copied dyadic endpoints come
from evaluated-phi-mixed-comparison.json, SHA256 SOURCE_HASH.
Every endpoint inequality below is checked again by the original Lean kernel.
The nonlinear coefficients are enclosed using the original coefficient norm;
they are not identified with the centers of the comparison intervals. -/

noncomputable section
set_option maxHeartbeats 4000000
set_option exponentiation.threshold 2048

namespace MathScope.SelectedReferenceBoxes

open Set
open MathScope.SameDatumInputs MathScope.AxisFiniteJet
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AxisEvaluation NavierStokes.NaturalAxisBridge
open scoped BigOperators Topology

def reference : AxisSpace axisWindow rho :=
  NavierStokes.AxisResolvent.naturalResolvent axisWindow rho_pos chiInput oneInput

theorem zero_in_window : (0 : ℝ) ∈ axisWindow.interval := by
  norm_num [Window.interval, axisWindow]

theorem zero_in_interior : (0 : ℝ) ∈ Ioo axisWindow.left axisWindow.right := by
  norm_num [axisWindow]

theorem actual_chi_zero : NavierStokes.NaturalAxisData.chi h j sigma 0 =
    (4000000 : ℝ) / 4000001 := by
  have hH : NavierStokes.NaturalAxisData.H h j 0 = j := by
    simp [NavierStokes.NaturalAxisData.H, NavierStokes.NaturalAxisData.d,
      NavierStokes.NaturalAxisData.U]
  rw [NavierStokes.NaturalAxisData.chi, hH, sigma]
  apply (div_eq_iff (show j ^ 2 + (j / 2000) ^ 2 ≠ 0 by positivity [j_pos])).mpr
  ring

theorem chi_radial : RadiallyConstant axisWindow rho chiInput := by
  intro n hn x hx
  simp [chiInput_coefficient n hx, hn]

theorem one_radial : RadiallyConstant axisWindow rho oneInput := by
  intro n hn x hx
  simp [oneInput_coefficient n hx, hn]

def exactReference (n : ℕ) : ℝ :=
  (-(4000000 / 4000001 : ℝ) / 2) ^ n /
    ((n.factorial : ℝ) * ((n + 1).factorial : ℝ))

theorem actual_reference_coefficient (n : ℕ) :
    coefficient axisWindow (weight rho) reference n 0 = exactReference n := by
  have he0 : coefficient axisWindow (weight rho) oneInput 0 0 = 1 := by
    simp [oneInput_coefficient 0 zero_in_window]
  rw [reference, NavierStokes.AxisReference.reference_coefficient axisWindow rho_pos
    chiInput oneInput chi_radial one_radial zero_in_window he0 n]
  rw [chiInput_coefficient 0 zero_in_window]
  simp only [ite_true, actual_chi_zero]
  rfl

'''.replace("SOURCE_HASH", EXPECTED)

parts = [header]
for name, key, endpoint in [
    ("referenceLower", "comparisonInterval", "lowerNumerator"),
    ("referenceUpper", "comparisonInterval", "upperNumerator"),
    ("actualLower", "actualNonlinearCoefficientInterval", "lowerNumerator"),
    ("actualUpper", "actualNonlinearCoefficientInterval", "upperNumerator"),
]:
    lines = [f"def {name} : ℕ → ℝ"]
    for n, row in enumerate(rows):
        interval = row[key]
        assert interval["denominatorPowerOfTwo"] == 256
        num = int(interval[endpoint])
        lines.append(f"  | {n} => ({num} : ℝ) / 2 ^ (256 : ℕ)")
    lines.append("  | _ => 0\n")
    parts.append("\n".join(lines))

parts.append('''
theorem reference_numeric_boxes (n : ℕ) (hn : n ≤ 24) :
    referenceLower n ≤ exactReference n ∧ exactReference n ≤ referenceUpper n := by
  interval_cases n <;>
    norm_num [referenceLower, referenceUpper, exactReference, Nat.factorial]

theorem reference_actual_boxes (n : ℕ) (hn : n ≤ 24) :
    referenceLower n ≤ coefficient axisWindow (weight rho) reference n 0 ∧
      coefficient axisWindow (weight rho) reference n 0 ≤ referenceUpper n := by
  rw [actual_reference_coefficient]
  exact reference_numeric_boxes n hn

theorem nonlinear_rounding_reserve (n : ℕ) (hn : n ≤ 24) (hn0 : n ≠ 0) :
    actualLower n ≤ referenceLower n - 1 / (2 : ℝ) ^ (512 : ℕ) ∧
      referenceUpper n + 1 / (2 : ℝ) ^ (512 : ℕ) ≤ actualUpper n := by
  interval_cases n <;> norm_num [actualLower, actualUpper, referenceLower, referenceUpper] at *

theorem weight_zero_le_one (epsilon : ℝ) (n : ℕ) : weight epsilon n 0 ≤ 1 := by
  simp only [weight, pow_zero, Nat.factorial_zero, Nat.cast_one, Nat.add_zero,
    Nat.choose_zero_right, mul_one, Nat.cast_zero, zero_add, one_pow]
  have hd : 0 < ((n : ℝ) + 1) ^ 2 := by positivity
  apply (div_le_iff₀ hd).mpr
  have hp : (1 / 20 : ℝ) ^ n ≤ 1 := pow_le_one₀ (by norm_num) (by norm_num)
  nlinarith [show (0 : ℝ) ≤ (n : ℝ) by positivity, sq_nonneg (n : ℝ)]

theorem sharp_error_smaller_than_rounding (q : ℝ) (hq : (2 : ℝ) ^ (260 : ℕ) ≤ q) :
    29 / q ^ (53 : ℕ) ≤ 1 / (2 : ℝ) ^ (512 : ℕ) := by
  have hq10 : (2 : ℝ) ^ (10 : ℕ) ≤ q :=
    (pow_le_pow_right₀ (by norm_num : (1 : ℝ) ≤ 2) (by norm_num : (10 : ℕ) ≤ 260)).trans hq
  have hqp : 0 < q := lt_of_lt_of_le (by norm_num) hq10
  have hp : ((2 : ℝ) ^ (10 : ℕ)) ^ (53 : ℕ) ≤ q ^ (53 : ℕ) := by gcongr
  calc
    29 / q ^ (53 : ℕ) ≤ 29 / (((2 : ℝ) ^ (10 : ℕ)) ^ (53 : ℕ)) :=
      div_le_div_of_nonneg_left (by norm_num) (by positivity) hp
    _ ≤ 1 / (2 : ℝ) ^ (512 : ℕ) := by norm_num

theorem nonlinear_coefficient_boxes (A : AxisSpace axisWindow rho) (q : ℝ)
    (hq : (2 : ℝ) ^ (260 : ℕ) ≤ q)
    (herror : ‖A - reference‖ ≤ 29 / q ^ (53 : ℕ))
    (haxis : coefficient axisWindow (weight rho) A 0 0 = 1)
    (n : ℕ) (hn : n ≤ 24) :
    actualLower n ≤ coefficient axisWindow (weight rho) A n 0 ∧
      coefficient axisWindow (weight rho) A n 0 ≤ actualUpper n := by
  by_cases hn0 : n = 0
  · subst n
    rw [haxis]
    norm_num [actualLower, actualUpper]
  · have href := reference_actual_boxes n hn
    have hreserve := nonlinear_rounding_reserve n hn hn0
    have herrsmall := herror.trans (sharp_error_smaller_than_rounding q hq)
    have hc := coefficient_jet_error axisWindow rho_pos A reference herrsmall n 0 zero_in_interior
    simp only [iteratedDeriv_zero] at hc
    have hw := weight_zero_le_one rho n
    have hc' : |coefficient axisWindow (weight rho) A n 0 -
        coefficient axisWindow (weight rho) reference n 0| ≤ 1 / (2 : ℝ) ^ (512 : ℕ) := by
      apply hc.trans
      nlinarith [mul_le_mul_of_nonneg_left hw
        (by positivity : (0 : ℝ) ≤ 1 / (2 : ℝ) ^ (512 : ℕ))]
    have hb := abs_le.mp hc'
    constructor <;> linarith [href.1, href.2, hreserve.1, hreserve.2, hb.1, hb.2]

theorem selected_reference_factorial_tail {t : ℝ} (ht : |t| ≤ 3) :
    ‖NavierStokes.AxisSeries.bessel 1 t -
      ∑ n ∈ Finset.range 25, NavierStokes.AxisSeries.term 1 n t‖ <
        1 / (2 : ℝ) ^ (120 : ℕ) := by
  have hb := bessel_finite_tail_error (by norm_num : (1 : ℕ) ≤ 1)
    (by norm_num : (2 : ℕ) ≤ 25) ht
  apply hb.trans_lt
  norm_num [Nat.factorial]

end MathScope.SelectedReferenceBoxes

#print axioms MathScope.SelectedReferenceBoxes.actual_chi_zero
#print axioms MathScope.SelectedReferenceBoxes.actual_reference_coefficient
#print axioms MathScope.SelectedReferenceBoxes.reference_numeric_boxes
#print axioms MathScope.SelectedReferenceBoxes.reference_actual_boxes
#print axioms MathScope.SelectedReferenceBoxes.nonlinear_rounding_reserve
#print axioms MathScope.SelectedReferenceBoxes.sharp_error_smaller_than_rounding
#print axioms MathScope.SelectedReferenceBoxes.nonlinear_coefficient_boxes
#print axioms MathScope.SelectedReferenceBoxes.selected_reference_factorial_tail
''')
(HERE / "SelectedReferenceBoxes.lean").write_text("\n".join(parts))
print("Wrote 25 exact selected reference and nonlinear coefficient interval rows.")
