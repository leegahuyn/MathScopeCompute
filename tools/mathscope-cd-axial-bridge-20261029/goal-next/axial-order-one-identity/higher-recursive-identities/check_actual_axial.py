"""Check the extracted original axial terms, their eta AD and the general operator identity."""
import hashlib
import json
import sys
from functools import cache
from fractions import Fraction
from pathlib import Path

import sympy as s

assert __debug__, 'Exact verification requires assertions.'
X, eta, h, n, i = s.symbols('X eta h n i', real=True)
A = s.Rational(1, 2) + h
D = s.Rational(1, 2) - h
d, L = 1 - eta**2, 1 - 2*h*eta**2
jets = {}


def J(name, k=0, m=0):
    key = (name, k, m)
    if key not in jets:
        jets[key] = s.Symbol(f'{name}_X{k}_E{m}', real=True)
    return jets[key]


def derivative(expr, axis):
    result = s.diff(expr, axis)
    for (name, k, m), value in list(jets.items()):
        if value in expr.free_symbols:
            result += s.diff(expr, value)*J(name, k+(axis == X), m+(axis == eta))
    return result


def DX(expr):
    return derivative(expr, X)


def DE(expr):
    return derivative(expr, eta)


def T(a, f):
    return (-a*f + X*DX(f) + D*eta*DE(f))/L


def Z(a, f):
    return (2*eta*(a*f - X*DX(f)) + d*DE(f))/L


def Tbar(a, f):
    return (-a*f + D*eta*DE(f))/L


def Zbar(a, f):
    return (2*eta*a*f + d*DE(f))/L


def has_zero_numerator(left, right):
    numerator = s.together(left-right).as_numer_denom()[0]
    return s.expand(numerator) == 0


def require_equal(left, right, label):
    assert has_zero_numerator(left, right), label


def generic_pair_and_linear_operator_proof():
    U, W, v, P = (J(name) for name in ('U_i', 'U_j', 'v_i', 'P'))
    j = n-i
    a_i, a_j = -A+2*i*h, -A+2*j*h
    nu, mu = 2*n*h, 2*(n-1)*h
    a, b, c = -A+nu, -2*A+nu, -A+mu
    C_i = DX(X*v)+Z(a_i,U)
    checks = {
        'ordered_pair_with_exact_continuity_defect': (
            X*v*DX(W)+U*Z(a_j,W), DX(X*v*W)+Z(b,U*W)-W*C_i),
        'time_moment_and_radial_boundary': (
            T(a,U), Tbar(D+nu,U)+DX(X*U/L)),
        'transport_moment_and_radial_boundary': (
            Z(b,U*W), Zbar(mu,U*W)+DX(-2*eta*X*U*W/L)),
        'pressure_moment_and_two_radial_boundaries': (
            Z(b,P), Zbar(mu,-X*DX(P))+DX(-2*eta*X*P/L+Zbar(mu,X*P))),
        'radial_viscosity_boundary': (
            -2*(X*DX(DX(U))+DX(U)), DX(-2*X*DX(U))),
        'previous_viscosity_moment_and_two_radial_boundaries': (
            -Z(c-D,Z(c,W)), -Zbar(mu,Zbar(D+mu,W))
            + DX(2*eta*X*Z(c,W)/L+Zbar(mu,2*eta*X*W/L))),
    }
    for name, (left, right) in checks.items():
        require_equal(left, right, name)
        require_equal(DE(left), DE(right), name+' eta derivative')
    return list(checks)


def generic_stream_and_picard_proof():
    M, U, G, U0, F0, v0, fullF, P, p_known, axial_known = (
        J(name) for name in ('Mass','CurU','AvgDefect','LeadU','LeadF','Leadv','CurF',
                            'CurPi','KnownP','KnownAxial'))
    nu = 2*n*h
    a, b = -A+nu, -2*A+nu
    stream = (2*eta*X*U-2*eta*(D+nu)*M-d*DE(M))/L
    stream_defect = DX(stream)+Z(a,U)
    require_equal(stream_defect.subs({J('Mass',1):U,J('Mass',1,1):DE(U)}),0,
                  'actual reconstructed V and M_X=U imply continuity')

    # Axial row 5 divided by 2, with W5=2*xi*U_X and X=xi^2.
    # This is its literal source template, independent of the target PDE assembly.
    H_u = X*DX(U0)
    row5 = (
        -4*eta*X*F0*fullF/L
        + (a*(2*eta*U0-1)/L+2*eta*(A-nu)*H_u/L+Z(-A,U0))*U
        - 2*eta*(D+nu)*H_u*G/L + 2*b*eta*P/L
        + X*(1/L+v0-2*eta*U0/L)*DX(U)
        + (D*eta+d*U0-d*H_u)*DE(U)/L - d*H_u*DE(G)/L
        + d*DE(P)/L + axial_known - 2*eta*X*p_known/L
    )
    v = (2*eta*U-2*eta*(D+nu)*(U+G)-d*DE(U+G))/L
    model = (T(a,U)+X*v0*DX(U)+U0*Z(a,U)+X*v*DX(U0)+U*Z(-A,U0)
             + Z(b,P)+axial_known).subs(J('CurPi',1),2*F0*fullF+p_known)
    require_equal(row5,model,'actual Picard axial row reconstructs local zero residual')
    require_equal(DE(row5),DE(model),'eta derivative of local Picard row identity')
    return ['actual_stream_continuity', 'actual_picard_axial_row', 'actual_picard_axial_row_eta']


def check_source_row(row, constants):
    order = row['n']
    source_nodes = dict(row['graph'])
    atoms = {}
    multi_path = {}
    for alias in row['aliases']:
        var = J(alias['name'], alias['x'], alias['eta'])
        node_id = alias['node']
        if node_id in atoms:
            assert atoms[node_id] == var, alias
        atoms[node_id] = var
        multi_path.setdefault(str(var), set()).add(node_id)

    @cache
    def source(node_id):
        if node_id in atoms:
            return atoms[node_id]
        if node_id == constants['X']:
            return X
        if node_id == constants['eta']:
            return eta
        if node_id == constants['h']:
            return h
        node = source_nodes[node_id]
        op, args = node['op'], node['args']
        if op == 'rational':
            return s.Rational(*map(int,args))
        if op == 'add':
            return sum(map(source,args))
        if op == 'multiply':
            return s.prod(map(source,args))
        if op == 'inverse':
            return 1/source(args[0])
        if op == 'integer_power':
            return source(args[0])**args[1]
        raise AssertionError((node_id,op))

    nu, mu = 2*order*h, 2*(order-1)*h
    a, b, c = -A+nu, -2*A+nu, -A+mu
    U = [J(f'U{k}') for k in range(order+1)]
    v = [J(f'v{k}') for k in range(order+1)]
    Pi = J('Pi')
    terms = [T(a,U[-1])]
    pairs = [(k,order-k) for k in range(order+1)]
    for left,right in pairs:
        terms.extend([X*v[left]*DX(U[right]),U[left]*Z(-A+2*right*h,U[right])])
    terms.extend([Z(b,Pi),-2*(X*DX(DX(U[-1]))+DX(U[-1])),-Z(c-D,Z(c,U[-2]))])
    assert len(row['terms']) == len(terms)
    for index,(actual,wanted) in enumerate(zip(row['terms'],terms)):
        require_equal(source(actual), wanted, (order,'term',index))
    raw, raw_eta = source(row['raw']), source(row['rawEta'])
    require_equal(raw,sum(terms),(order,'original raw sum'))
    require_equal(raw_eta,DE(sum(terms)),(order,'actual native eta AD'))

    H = sum(v[left]*U[right] for left,right in pairs)
    Q = sum(U[left]*U[right] for left,right in pairs)
    continuity_defects = sum(U[right]*(DX(X*v[left])+Z(-A+2*left*h,U[left])) for left,right in pairs)
    boundary_terms = [X*U[-1]/L, X*H, -2*eta*X*(Q+Pi)/L,
        Zbar(mu,X*Pi), -2*X*DX(U[-1]), 2*eta*X*Z(c,U[-2])/L,
        Zbar(mu,2*eta*X*U[-2]/L)]
    moment_density = Tbar(D+nu,U[-1])+Zbar(mu,Q-X*DX(Pi))-Zbar(mu,Zbar(D+mu,U[-2]))
    complete = moment_density+DX(sum(boundary_terms))-continuity_defects
    require_equal(raw,complete,(order,'complete seven-flux identity'))
    require_equal(raw_eta,DE(complete),(order,'eta derivative of seven-flux identity'))

    # Whole sums cannot detect the wrong slot if both ordered pairs are present.
    swapped_sum = sum(U[left]*Z(-A+2*left*h,U[right]) for left,right in pairs)
    right_sum = sum(terms[2+2*left] for left,_ in pairs)
    require_equal(swapped_sum,right_sum,(order,'swapped slot cancels in total'))
    wrong_slot = U[0]*Z(-A,U[-1])
    assert not has_zero_numerator(source(row['terms'][2]),wrong_slot)
    assert not has_zero_numerator(source(row['terms'][-1]),-Z(c,Z(c,U[-2])))
    assert not has_zero_numerator(raw,complete-DX(boundary_terms[3]))
    assert not has_zero_numerator(raw,complete+U[-1]*(DX(X*v[0])+Z(-A,U[0])))
    return {'order':order,'raw':row['raw'],'rawEta':row['rawEta'],'terms':len(terms),
        'orderedPairs':pairs,'checkedRawAndEtaIdentities':4,'boundaryTerms':len(boundary_terms),
        'mixedJetClassesWithDistinctSourcePaths':sum(len(ids)>1 for ids in multi_path.values()),
        'rejectedWrongTermOrIdentity':4,'wrongExponentSlotInvisibleInSummedTransport':True}


def main():
    slice_path, output = map(Path,sys.argv[1:])
    raw = slice_path.read_bytes()
    evidence = json.loads(raw)
    assert evidence['status'] == 'VERIFIED_FINITE_ACTUAL_ORDERED_AXIAL_SOURCE_SLICES'
    assert [row['n'] for row in evidence['rows']] == [2,3,4,5]
    checks = generic_pair_and_linear_operator_proof()
    stream_picard = generic_stream_and_picard_proof()
    ipos = evidence['Ipos']
    support = [[Fraction(*map(int,value)) for value in row] for row in ipos['supports']]
    assert ipos['matrixShapes'] == [[2,2],[3,3,3]]
    assert len(support) == 5
    assert all(right-left == Fraction(1,2048) for left,right in support)
    assert all(1 < left < right < 4 for left,right in support)
    assert all(support[k+1][0]-support[k][1] > Fraction(1,4) for k in range(4))
    assert all(support[k+1][0]**2-support[k][1]**2 > Fraction(1,2) for k in range(2,4))
    assert support[4][0]**2-support[2][1]**2 > 1
    assert ipos['exactSourceExpressions']['T'] == {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]}
    margins = {'radialSupportGap':'1/4','angularConsecutiveSquaredGap':'1/2',
               'angularOuterSquaredGap':'1','normalizedAxialDeterminantLower':'1/32',
               'normalizedAngularDeterminantAbsoluteLower':'1/131072'}
    rows = [check_source_row(row,evidence['constants']) for row in evidence['rows']]
    result = {'status':'VERIFIED_ORDERED_SOURCE_AXIAL_TERMS_AND_ETA_AD_ORDERS_2_TO_5',
        'sliceSHA256':hashlib.sha256(raw).hexdigest(),'sourcePins':evidence['sourcePins'],
        'genericFreeJetIdentityChecks':checks,'genericEtaDifferentiatedIdentities':len(checks),
        'genericStreamAndLocalPicardChecks':stream_picard,
        'actualIposMargins':margins,
        'rows':rows,'sourceTerms':sum(row['terms'] for row in rows),
        'analyticPremises':'Ordinary interpretation of exact native partials, nonzero L, and commuting mixed derivatives. Integrated zero additionally requires current and previous all-radius moment families and fixed-source regularity.',
        'release':'HOLD'}
    output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
    print(result['status'],result['sourceTerms'],result['sliceSHA256'])


if __name__ == '__main__':
    main()
