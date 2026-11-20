# Original degree-twelve slow chart coefficients

The checker validates the original source kernel, the existing degree-eleven chart recurrence, and each of its 364 supports. The 91 additional directions are computed with explicit coefficient-atom derivatives through degree thirteen. The pointwise transfer coefficient is \(2^{2699}H_c^{195}\) on the original coordinate box. The mathematical chart realization and any full-field integrated FTC bounds remain separate inputs.

    python -B verify_chart12.py --goal GOAL_NEXT --kernel ORIGINAL_CHART_KERNEL --out chart12.json
