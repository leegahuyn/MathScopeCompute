#!/usr/bin/env python3
"""Independent Fraction integration of original (5.4)--(5.6),(5.20)--(5.21).

Manufactured compact polynomial fields exercise the differential identity.
They are NOT the actual N3 field and cannot certify its moment values.
No JavaScript symbolic engine, exported identity, sampled quadrature or
floating-point arithmetic is used here.
"""
from fractions import Fraction as F
from pathlib import Path
import json
import sys

JET = 6  # eta Taylor degree; final tests use the constant coefficient only.

def pa(a, b):
    r = dict(a)
    for i, v in b.items():
        r[i] = r.get(i, F(0)) + v
        if not r[i]: del r[i]
    return r

def ps(a, k): return {i: v*k for i, v in a.items() if v*k}

def pm(a, b):
    r = {}
    for i, u in a.items():
        for j, v in b.items():
            r[i+j] = r.get(i+j, F(0)) + u*v
    return {i: v for i, v in r.items() if v}

def pd(a): return {i-1: i*v for i, v in a.items() if i}
def pi(a): return {i+1: v/F(i+1) for i, v in a.items()}
def value1(a): return sum(a.values(), F(0))

def const(v): return [{0: F(v)} if v else {}] + [{} for _ in range(JET)]
def add(*args):
    r = const(0)
    for a in args: r = [pa(x, y) for x, y in zip(r, a)]
    return r
def scale(a, v): return [ps(p, F(v)) for p in a]
def neg(a): return scale(a, -1)
def sub(a, b): return add(a, neg(b))
def mul(*args):
    r = const(1)
    for a in args:
        t = [{} for _ in range(JET+1)]
        for i, p in enumerate(r):
            if not p: continue
            for j, q in enumerate(a[:JET+1-i]):
                if q: t[i+j] = pa(t[i+j], pm(p, q))
        r = t
    return r
def power(a, n):
    r = const(1)
    for _ in range(n): r = mul(r, a)
    return r
def dx(a): return [pd(p) for p in a]
def de(a): return [ps(a[i+1], i+1) for i in range(JET)] + [{}]
def primitive(a): return [pi(p) for p in a]
def integral(a): return [{0: value1(pi(p))} if p else {} for p in a]
def divx(a):
    assert all(not p.get(0) for p in a), 'regular division by X must retain its zero axis numerator'
    return [{i-1: v for i, v in p.items() if i} for p in a]
def reciprocal_eta(a):
    assert all(set(p) <= {0} for p in a)
    c = [p.get(0, F(0)) for p in a]
    assert c[0]
    r = [1/c[0]] + [F(0)]*JET
    for n in range(1, JET+1): r[n] = -sum((c[k]*r[n-k] for k in range(1, n+1)), F(0))/c[0]
    return [{0: v} if v else {} for v in r]
def scalar0(a):
    assert set(a[0]) <= {0}
    return a[0].get(0, F(0))

def run_case(h, eta0):
    X = [{1: F(1)}] + [{} for _ in range(JET)]
    eta = const(eta0); eta[1] = {0: F(1)}
    one = const(1); A = F(1, 2)+h; D = F(1, 2)-h
    d = sub(one, power(eta, 2)); L = sub(one, scale(power(eta, 2), 2*h)); Li = reciprocal_eta(L)
    b = -A-F(1, 2); c = -A
    T = lambda a, f: mul(Li, add(scale(f, -a), scale(mul(eta, de(f)), D), mul(X, dx(f))))
    Z = lambda a, f: mul(Li, add(scale(mul(eta, sub(scale(f, a), mul(X, dx(f)))), 2), mul(d, de(f))))
    Tb = lambda a, m: mul(Li, add(scale(m, -a), scale(mul(eta, de(m)), D)))
    Zb = lambda a, m: mul(Li, add(scale(mul(eta, m), 2*a), mul(d, de(m))))
    cutoff = power(sub(one, X), 4)
    Ms = []; Us = []; Fs = []; vs = []
    for n in range(3):
        shape = add(const(n+1), scale(mul(eta, X), F(n+2, 3)), scale(mul(power(eta, 2), power(X, 2)), F(2*n+1, 5)))
        M = mul(power(X, 2), cutoff, shape)
        U = dx(M); avg = divx(M); nu = 2*n*h
        v = mul(Li, sub(sub(scale(mul(eta, U), 2), scale(mul(eta, avg), 2*(D+nu))), mul(d, de(avg))))
        field = mul(X, cutoff, add(const(n+2), scale(mul(eta, X), F(n+1, 2)), scale(mul(power(eta, 2), X), F(n+3, 7))))
        Ms.append(M); Us.append(U); Fs.append(field); vs.append(v)
    def omega_over_x(n):
        out = add(T(2*n*h-1, vs[n]), scale(add(scale(dx(vs[n]), 2), mul(X, dx(dx(vs[n])))), -2))
        for i in range(n+1):
            j = n-i
            out = add(out, mul(vs[i], add(scale(vs[j], F(1,2)), mul(X, dx(vs[j])))), mul(Us[i], Z(2*j*h-1, vs[j])))
        if n: out = sub(out, Z(2*(n-1)*h-D-1, Z(2*(n-1)*h-1, vs[n-1])))
        return out
    checks = []; negatives = []
    previous_m1 = integral(Us[0]); previous_m2 = integral(scale(mul(X, Fs[0]), 2))
    for n in [1, 2]:
        nu = 2*n*h; pnu = 2*(n-1)*h
        omega = omega_over_x(n-1)
        ff = add(*(mul(Fs[i], Fs[n-i]) for i in range(n+1)))
        uu = add(*(mul(Us[i], Us[n-i]) for i in range(n+1)))
        uf = add(*(mul(Us[i], Fs[n-i]) for i in range(n+1)))
        pressure_derivative = sub(ff, scale(omega, F(1, 2)))
        # Pi(1)=0 is the boundary premise used in radial integration by parts.
        # A positive source axis datum is not asserted for this diagnostic.
        Pi = sub(primitive(pressure_derivative), integral(pressure_derivative))
        angular = T(b+nu, Fs[n]); axial = T(c+nu, Us[n])
        for i in range(n+1):
            j = n-i
            angular = add(angular, mul(vs[i], add(mul(X, dx(Fs[j])), Fs[j])), mul(Us[i], Z(b+2*j*h, Fs[j])))
            axial = add(axial, mul(X, vs[i], dx(Us[j])), mul(Us[i], Z(c+2*j*h, Us[j])))
        lower_ang = Z(b+pnu-D, Z(b+pnu, Fs[n-1]))
        lower_ax = Z(c+pnu-D, Z(c+pnu, Us[n-1]))
        angular = add(angular, scale(add(mul(X, dx(dx(Fs[n]))), scale(dx(Fs[n]), 2)), -2), neg(lower_ang))
        axial = add(axial, Z(-2*A+nu, Pi), scale(add(mul(X, dx(dx(Us[n]))), dx(Us[n])), -2), neg(lower_ax))
        m1 = integral(Us[n]); m2 = integral(scale(mul(X, Fs[n]), 2)); m4 = integral(scale(mul(X, uf), 2))
        m5 = integral(add(uu, neg(mul(X, ff)), scale(mul(X, omega), F(1, 2))))
        theta_expected = sub(add(Tb(1-h+nu, m2), Zb(F(1,2)-2*h+nu, m4)), Zb(F(1,2)-2*h+nu, Zb(1-h+pnu, previous_m2)))
        z_expected = sub(add(Tb(D+nu, m1), Zb(nu-2*h, m5)), Zb(pnu, Zb(D+pnu, previous_m1)))
        theta_actual = integral(scale(mul(X, angular), 2)); z_actual = integral(axial)
        for component, left, right in [('theta', theta_actual, theta_expected), ('z', z_actual, z_expected)]:
            residual = scalar0(sub(left, right)); assert residual == 0, (h, eta0, n, component, residual)
            checks.append({'h':str(h),'eta':str(eta0),'order':n,'component':component,'exactResidual':str(residual)})
        omitted_viscosity = scalar0(integral(scale(mul(X, lower_ang), 2)))
        assert omitted_viscosity != 0
        negatives.append({'h':str(h),'eta':str(eta0),'order':n,'omission':'lower angular axial-viscosity term','nonzeroError':str(omitted_viscosity)})
        omega_debt = scale(integral(mul(X, omega)), F(1,2))
        omitted_omega = scalar0(Zb(nu-2*h, omega_debt))
        assert omitted_omega != 0
        negatives.append({'h':str(h),'eta':str(eta0),'order':n,'omission':'+Omega_(n-1)/2 in fifth moment','nonzeroError':str(omitted_omega)})
        previous_m1, previous_m2 = m1, m2
    return checks, negatives

def main():
    checks = []; negatives = []
    for h, eta in [(F(1,10),F(1,3)),(F(1,20),F(-2,5)),(F(1,50),F(1,4))]:
        a, b = run_case(h, eta); checks += a; negatives += b
    result={'schema':'MathScope.IndependentConservativeMomentAudit/1','arithmetic':'Python Fraction polynomial integration and independently implemented eta Taylor arithmetic',
            'sourceEquations':['5.4','5.6','5.20','5.21'],'manufacturedFieldsAreActualSource':False,'actualGlobalNumericMomentClaimed':False,
            'identityChecks':len(checks),'negativeControls':len(negatives),'checks':checks,'negative':negatives,'pass':True}
    if len(sys.argv)>1: Path(sys.argv[1]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['schema','identityChecks','negativeControls','pass']}))

if __name__=='__main__': main()
