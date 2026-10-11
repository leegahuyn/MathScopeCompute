#!/usr/bin/env python3
"""Independent high precision comparison, not an outward proof certificate."""
from decimal import Decimal, localcontext
from pathlib import Path
import json
import platform

with localcontext() as ctx:
    ctx.prec = 200
    x = Decimal(1) / 8
    a = (-1 / x**2).exp()
    b = (-1 / (1-x)**2).exp()
    ap = a * (2 / x**3)
    bp = b * (-2 / (1-x)**3)
    app = a * (4 / x**6 - 6 / x**4)
    bpp = b * (4 / (1-x)**6 - 6 / (1-x)**4)
    denominator = a + b
    derivative_denominator = ap + bp
    second_denominator = app + bpp
    numerator = ap * denominator - a * derivative_denominator
    sigma = a / denominator
    first = numerator / denominator**2
    second = (app * denominator - a * second_denominator) / denominator**2 - 2 * numerator * derivative_denominator / denominator**3
    values = dict(exp=(-Decimal(3072)/49).exp(), sigma=sigma, first=first, second=second)
    result = dict(schema='MathScope.TerminalStepIndependentDecimalReference/1', precisionDigits=200,
                  python=platform.python_version(), arithmetic='Python Decimal correctly rounded exp and 200-digit operations',
                  method='Differentiate the two original exponential bumps and their quotient independently of the logistic recurrence.',
                  values={k: format(v, '.179E') for k, v in values.items()},
                  rigorousOutwardCertificate=False, actualSourceParametersNumericallyReplaced=False)
output = Path(__file__).resolve().parents[1] / 'research/evidence/terminal-field-20261011/decimal-step-reference.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'output': str(output), 'comparisonOnly': True}))
