"""Bind the original first-postfive N=1 reference chart to physical points.

`source_image` uses a symbolic band of the actual graph. `physical_ingress`
checks rational physical inputs with separately established integer window values.
The binding is for #622820 and radial Y operands, independent of the other
native operators reached by the field roots.
"""

from fractions import Fraction


HALF = Fraction(1, 2)
H = Fraction(1, 1 << 4096)
PHYSICAL_ROOTS = (4419697, 4419698, 4419699, 4419702, 4419723, 4420035,
                  4420037, 4420039, 4420249, 4420251, 4420253)
REFERENCE_NODES = {'ell': 622791, 'R': 622802, 'Z': 622803, 'T': 622804}


class OutsideReferenceChart(ValueError):
    pass


def dyadic(exponent):
    return Fraction(1 << exponent) if exponent >= 0 else Fraction(1, 1 << -exponent)


def floor_log2(value):
    if value <= 0:
        raise ValueError('A positive rational is required')
    exponent = value.numerator.bit_length() - value.denominator.bit_length()
    return exponent - (dyadic(exponent) > value)


def as_exact(value):
    if isinstance(value, float):
        raise TypeError('Provide a rational or an exact rational string')
    return Fraction(value)


def source_image(root, s, eta, X):
    """Return exact source-coordinate expressions on a proved actual band.

    A caller supplies a physical point parametrized by (s, eta, X). The lower
    bound is the actual original graph value #622785, kept symbolic. For every
    input to this function, the real #622820 root equals the supplied s.
    """
    s, eta, X = map(as_exact, (s, eta, X))
    if root not in PHYSICAL_ROOTS or not HALF <= s <= 2 or abs(eta) > 1 or X < 0:
        raise OutsideReferenceChart('The source root or similarity point is out of domain')
    ell = ('add', ('source-node', 622785), 2)
    Q = ('pow', 2, ('neg', ell))
    D = ('source-node', 22)
    Z = ('multiply', eta, ('pow', s, D))
    T = s * (1 - eta * eta)
    R = ('sqrt', 2 * s * X)
    q = ('multiply', Q, s)
    return {
        'root': root,
        'reference': dict(zip(REFERENCE_NODES.values(), (ell, R, Z, T))),
        'physical': {
            'r': ('sqrt', ('multiply', 2 * X, q)),
            'z': ('multiply', eta, ('pow', q, D)),
            'tau': ('multiply', Q, T),
        },
        'referenceScale': Q,
        'q': q,
        'inverseNode': 622820,
        'inverseValue': s,
        'prefixOrder': 1,
        'windowNodes': [622785, 622790],
    }


def physical_ingress(root, r, z, tau, *, ell0, floor_log2_b1, floor_log2_b2,
                     selected_ell=None):
    """Certify a supplied band or select a band within the same N=1 window.

    Use actual source values of the three integer parameters when applying to
    a physical point. Their provenance is outside this rational routine. The
    replay separately proves and uses a symbolic band of the actual source.
    The numerical procedure is conservative near a transcendental boundary.
    """
    r, z, tau = map(as_exact, (r, z, tau))
    if root not in PHYSICAL_ROOTS or r < 0 or tau < 0 or tau + z*z == 0:
        raise OutsideReferenceChart('The source root or physical point is out of domain')
    if any(type(v) is not int for v in (ell0, floor_log2_b1, floor_log2_b2)):
        raise TypeError('The source floors and ell0 must be exact integers')
    if ell0 < 0 or floor_log2_b1 < ell0 + 4 or floor_log2_b2 < floor_log2_b1 + 4:
        raise OutsideReferenceChart('The supplied integers violate the original selector bounds')
    lower, upper = floor_log2_b1, floor_log2_b2 - 1
    if selected_ell is not None and (type(selected_ell) is not int
                                    or not lower <= selected_ell <= upper):
        raise OutsideReferenceChart('The supplied reference label is outside the same N=1 window')

    z2 = z*z
    qhi = tau + z2
    if qhi > 1:
        raise OutsideReferenceChart('The physical scale exceeds the supported rational enclosure')
    # z^2 q^(-2D)+tau/q decreases on q>0. At q=1 it is <=1, so q<=1
    # and q<=tau+z^2. Since 2D>=1/2, q>=max(tau,(z^2)^2).
    base = max(tau, z2*z2)
    B = max(0, -floor_log2(base))
    qlo = max(base, tau + z2*(1 - 2*H*B))
    qstar_exponent = -ell0 - 4
    if floor_log2(qhi) >= qstar_exponent:
        raise OutsideReferenceChart('The enclosure does not certify q<qGlobalStar')

    # These are exactly the integer labels whose root interval contains the
    # entire q enclosure. Compare via integer logs before materializing Q.
    first = max(lower, -floor_log2(qlo) - 1)
    last = min(upper, floor_log2(1/qhi) + 1)
    ell = first if selected_ell is None else selected_ell
    if not first <= ell <= last:
        raise OutsideReferenceChart('The enclosure does not fit the selected original band')
    Q = dyadic(-ell)
    D = ('source-node', 22)
    reference = dict(zip(REFERENCE_NODES.values(), (
        ell, ('divide', r, ('sqrt', Q)), ('divide', z, ('pow', Q, D)), tau/Q,
    )))
    return {
        'root': root,
        'reference': reference,
        'referenceScale': Q,
        'prefixOrder': 1,
        'window': [lower, upper],
        'qInterval': [qlo, qhi],
        'sInterval': [qlo/Q, qhi/Q],
        'inverseNode': 622820,
    }
