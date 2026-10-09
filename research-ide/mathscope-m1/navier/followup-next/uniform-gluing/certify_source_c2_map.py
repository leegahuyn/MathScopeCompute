#!/usr/bin/env python3
"""Recompute C.2's map at the source pressure's exact small lambda.

Coordinates are X=X0*x, with the normalized bump patch inside 8<x<16.
The original logarithmic reserved interval has length five and can contain
this fixed subpatch after X0 is chosen. This certifies that correction operator
for the pinned lambda; actual C.12 debt and a global cone are still unbound.
"""
import hashlib
import json
from datetime import datetime,timezone
from fractions import Fraction as F
from pathlib import Path
from time import monotonic

import certify_uniform_moment_map as engine
from logarithmic_interval import power_general

HERE=Path(__file__).resolve().parent


def main():
    source=HERE.parent/'source-coherence/source-axis-bounds.json'
    axis=json.loads(source.read_text())
    lam=F(axis['sourcePressureCertificate']['parametersExact']['lambda'])
    spec=engine.profile_specs()[1]
    spec.update(alpha=-F(1,2)-lam, source=source, source_sha=engine.sha(source),producer=Path(__file__),fixture={'slices':[]},
                u_radius=F(1,100000), e_radius=F(1,100000),
                debt_u_preconditioned=F(1,1000000), debt_e_preconditioned=F(1,1000000))
    original_power=engine.power
    engine.power=power_general
    started=monotonic()
    try:
        calculated=engine.coefficients(spec,1024)
    finally:
        engine.power=original_power
    result=engine.serialize(calculated)
    result['sourceDebtMembershipDiagnostics']=[]
    result['sourceParameterLambda']=engine.to_json(lam)
    result['source']['physicalSourcePatchBound']=False
    result['source']['radialNormalization']='X=X0*x; moment factors X0,X0^(3/2),X0^(3/2),X0,1 are applied before the K,c normalization.'
    result['source']['actualModulationDebtProvided']=False
    result['geometry']['radiusConvention']='Fixed normalized dyadic support endpoints strictly within 8<x<16; an actual reserved power-law patch must be bound by a positive X0 before physical use.'
    payload={'schema':'MathScope.UniformContinuousMomentMap/1','generatedUTC':datetime.now(timezone.utc).isoformat(),
             'allPassed':result['passed'],'implementationSHA256':engine.sha(Path(__file__)),
             'arithmeticSHA256':engine.sha(HERE/'dyadic_interval.py'),'logarithmicArithmeticSHA256':engine.sha(HERE/'logarithmic_interval.py'),
             'elapsedSeconds':monotonic()-started,'results':[result]}
    out=HERE/'source-c2-moment-certificate.json'
    out.write_text(json.dumps(payload,indent=2)+'\n')
    print(json.dumps({'passed':result['passed'],'lambda':str(lam),'zU':float(calculated['inverse_u']['z']),
                      'zE':float(calculated['inverse_e']['z']),'qE':float(calculated['e_lipschitz']),
                      'imageE':float(calculated['e_image']),'fileSHA256':engine.sha(out)}))
    assert result['passed']


if __name__=='__main__':main()
