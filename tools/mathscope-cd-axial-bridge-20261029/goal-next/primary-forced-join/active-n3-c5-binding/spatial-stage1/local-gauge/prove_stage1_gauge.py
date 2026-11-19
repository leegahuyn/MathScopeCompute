"""Exact local stage-one gauge identities and source constructor binding."""

from hashlib import sha256
from pathlib import Path
import argparse
import json

import sympy as s


def checked_source(path, clauses):
    raw = path.read_bytes()
    text = raw.decode()
    assert all(clause in text for clause in clauses), path
    return sha256(raw).hexdigest()


def zero(expressions):
    assert all(s.simplify(value) == 0 for value in expressions)


def local_mode():
    R, Z, y, theta = s.symbols('R Z y theta', real=True)
    k, eps, ar, carrier = s.symbols('k eps a carrier', real=True)
    C = s.Matrix([s.Function(f'C{i}')(R, Z, y) for i in range(3)])
    B = s.Matrix([s.Function(f'B{i}')(R, Z, y) for i in range(3)])
    phase = s.Function('phi')(R, Z, y) + carrier * theta

    def dr(f):
        return f.diff(R) + ar * f.diff(y)

    def dz(f):
        return eps * f.diff(Z)

    def da(f):
        return f.diff(theta) / R

    def curl(A):
        r, t, z = A
        return s.Matrix([da(z)-dz(t), dz(r)-dr(z), dr(t)+t/R-da(r)])

    n = s.Matrix([dr(phase), da(phase), dz(phase)])
    arg = k * phase
    # Potential is i(C+iB), with the negative mode its conjugate.
    actual = 2 * (-B*s.cos(arg) - C*s.sin(arg))
    leading_re = -k * n.cross(C)
    leading_im = -k * n.cross(B)
    expected = 2*((leading_re-curl(B))*s.cos(arg)
                  -(leading_im+curl(C))*s.sin(arg))
    zero(curl(actual)-expected)
    # Signed keeps C/2 and puts B=0, with exactly one root per sign.
    zero((curl(actual)-expected).subs(dict.fromkeys(B, 0)).doit()/2)
    wrong = curl(2*(B*s.cos(arg)-C*s.sin(arg))) - expected
    assert s.simplify(wrong[0]) != 0
    return {'forcedComponents': 3, 'signedComponents': 3, 'wrongRealSignRejected': True}


def physical_pullback():
    R, Q, rho, Lam = s.symbols('R Q rho Lambda', positive=True)
    h, dr_power, i0 = s.symbols('h dr i0', real=True)
    delta = s.symbols('delta', integer=True)
    q_own, rr = Q/rho, s.sqrt(rho)*R
    o = s.Symbol('r_own', positive=True)
    old_a = s.diff(Lam**(i0+delta)*(s.sqrt(q_own)*o)**dr_power, o)
    new_a = s.diff(Lam**i0*(s.sqrt(Q)*R)**dr_power, R)
    A, D = s.Rational(1, 2) + h, s.Rational(1, 2) - h
    zero([s.sqrt(rho)*old_a.subs(o, rr)/Lam**delta-new_a,
          Q**h*rho**D-s.sqrt(rho)*q_own**h,
          rho**(A-s.Rational(1, 2))*s.sqrt(rho)-rho**A,
          rho**(A-s.Rational(1, 2))/R-rho**A/rr])
    assert s.simplify(s.sqrt(rho)*old_a.subs(o, rr)-new_a) != 0
    return {'radialAzimuthalAndAxialScales': 4, 'missingPaletteFactorRejected': True,
            'frozenSlots': ['own band', 'reference band', 'palette difference', 'mesh', 'copy', 'carrier']}


def means():
    R, Z, y = s.symbols('R Z y', real=True, positive=True)
    a, eps = s.symbols('a eps', real=True)
    # Write shifted integral derivatives as explicit endpoint and phase terms.
    g, Lleft, Lwhole, Iwhole, chi, chiR = s.symbols('g Lleft Lwhole Iwhole chi chiR')
    partial_numerator = R*g-a*Lleft-chiR*Iwhole+chi*a*Lwhole
    torus_numerator = Lleft-chi*Lwhole
    zero([(partial_numerator+a*torus_numerator)/R-(g-chiR*Iwhole/R)])
    assert s.simplify((partial_numerator+a*torus_numerator)/R-g) != 0
    F = s.Function('fiveAxial')(R, Z)
    x = s.Symbol('integration_radius')
    I = s.Integral(x*F.subs(R, x), (x, 1, R))
    psi = I/R
    zero([psi.diff(R)+a*psi.diff(y)+psi/R-F])
    beta = -eps*psi.diff(Z)
    zero([beta + eps*s.Integral(x*F.diff(Z).subs(R, x), (x, 1, R))/R])
    return {'temporalT1Retained': True, 'temporalMissingCutoffTermRejected': True,
            'fiveMapUsesRawLeftPrimitive': True, 'fiveMapWholeCancellationNeededForLocalCurl': False}


def run(runtime, ingress):
    m3 = runtime / 'mathscope-m3'
    m2 = runtime / 'mathscope-m2' / 'navier'
    navier = m3 / 'navier'
    post = m3 / 'post-signed-20261023'
    specs = {
        ingress: ['potentialScale = power(rho, G.sub(A, G.q(1, 2)))',
                  'real: imaginary.map(root => G.neg(root)), imaginary: real',
                  'G.q(1, 2), fixed(root)',
                  'temporal.potential.psi, five.potential.psi',
                  'temporal.potential.velocity.v, five.increment.v'],
        navier / 'source-global-forced-current.mjs': [
            'completeSourceField(source,templates,\'ActualForcedCurrent_velocity_\'+j,t=>t.reconstruction.velocity[j]',
            'const waveRows=sumStateRows(G,old.waveRows,increment)',
            '{m:-m,velocity:mapped.velocity.map(C.conjugate)'],
        navier / 'source-mapped-forced-curl.mjs': [
            'leading=cross(G,normal,X).map(x=>G.neg(G.mul(km,x)))',
            'curlRemainder=[0,1,2].map(j=>C.value(G.neg(curl.imaginary.remainder[j]),curl.real.remainder[j]))',
            'mapped-path-normal-is-common-phase-gradient-'],
        navier / 'generic-signed-162-indexed.mjs': [
            'C.value(G.mul(half,lift(row.curl.leading[j])),G.mul(half,lift(row.curl.remainder[j])))',
            '{m:-1,velocity:velocity.map(z=>C.conjugate(z))',
            'globalVelocity=forced.global.velocity.map((id,j)=>G.add(id,signedVelocity[j]))'],
        navier / 'source-initialized-angular.mjs': [
            'radialFast:G.div(radialFast,G.pow(Lambda,levelDifference))',
            'G.sub(ell,ellReference)', 'source-lift-complete-radial-eigenvalue'],
        navier / 'source-global-pressure.mjs': [
            'baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)',
            'power(Lambda,baseIndex),power(physicalR,dr)',
            'delta=G.sub(i,baseIndex),matrix=exactCommonTorusMatrix(G,delta)'],
        m2 / 'actual-common-band-physical-curl.mjs': [
            'power(auxiliary.physicalMap.Lambda,g.paletteIndex),power(physicalR,auxiliary.physicalMap.dr)',
            'radialFast=G.derivative(radialPrimitive,coordinates.R)'],
        navier / 'source-temporal-potential.mjs': [
            'rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)',
            'beta=G.neg(Dz(psi)),gamma=De(psi,1)',
            'cutoffRemainderDeclaredZero:false'],
        post / 'source-signed-actual-five-map.mjs': [
            'psi=G.div(primitive,R),compactPsi=G.div(G.sub(primitive,G.mul(pressure.pressure.chi,whole)),R)',
            'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))',
            'increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired}',
            'globalGraphEqual(G,realizedGamma,gammaDesired,[R,primitive,gammaDesired])'],
        post / 'source-postfive-full-3d-residual.mjs': [
            'const meanIncrements=names.map(n=>G.sub(latestMean[n],baseline[n]))',
            'const velocity=old.fullVelocity.map((rootId,j)=>G.add(rootId,meanIncrements[j]))'],
        m2 / 'actual-full-curl.mjs': [
            'leading=cross(G,n,C).map(x=>G.neg(G.mul(k,x)))',
            'remainder=[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))]'],
    }
    assert __debug__
    return {'schema': 'MathScope.N7.StageOneGaugeLocalProof/1',
            'sourceSHA256': {path.name: checked_source(path, fragments)
                             for path, fragments in specs.items()},
            'localHarmonics': local_mode(), 'fixedLabelPullback': physical_pullback(),
            'meanCurl': means(), 'liveRootEquivalence': 'OPEN',
            'release': 'HOLD'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source_runtime', type=Path)
    p.add_argument('ingress_source', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    result = run(args.source_runtime, args.ingress_source)
    with args.output.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
