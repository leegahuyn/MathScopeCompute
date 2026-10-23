from fractions import Fraction
from math import comb, factorial

class MissingBound(ValueError):pass
def exact(x):
    if isinstance(x,(float,bool)):
        raise MissingBound('Floating point cannot certify rational source majorants')
    try:return Fraction(x)
    except (ValueError,TypeError,ZeroDivisionError):
        raise MissingBound('Exact rational majorant required')

def radial_primitive_bound(order,inner,outer,derivative_bounds):
    """Conditional bound of d_R^order [R^-1 integral_inner^R s*gamma(s) ds].

    M[k] bounds the k-th radial derivative of gamma; the same formula
    works on a tangential derivative of gamma when valid commutation holds.
    These are not inferred or fabricated from the original 117-node graph.
    """
    if type(order) is not int or order<0 or order>1024:
        raise MissingBound('Finite nonnegative derivative order required')
    a,b=exact(inner),exact(outer)
    if not 0<a<b:raise MissingBound('Positive common annulus required')
    if not isinstance(derivative_bounds,(list,tuple)) or len(derivative_bounds)<max(1,order):
        raise MissingBound('Actual source derivative bounds required, no zero defaults')
    M=[exact(x) for x in derivative_bounds]
    if any(x<0 for x in M):raise MissingBound('Negative sup-norm majorant')
    length=b-a
    bound=Fraction(factorial(order))*length*b*M[0]/a**(order+1)
    for k in range(1,order+1):
        Fk=b*M[k-1]+(k-1)*M[k-2] if k>1 else b*M[0]
        bound+=comb(order,k)*factorial(order-k)*Fk/a**(order-k+1)
    return bound

if __name__=='__main__':
    assert radial_primitive_bound(0,'1','2',['3'])==6
    assert radial_primitive_bound(1,'1','2',['3'])==12
    assert radial_primitive_bound(2,'1','2',['3','4'])==35
    try:radial_primitive_bound(2,'0','2',['3','4'])
    except MissingBound:pass
    else:raise AssertionError('Zero-radius input accepted')
    try:radial_primitive_bound(3,'1','2',['3','4'])
    except MissingBound:pass
    else:raise AssertionError('Missing derivative accepted')
    try:radial_primitive_bound(1,'1','2',[float(3)])
    except MissingBound:pass
    else:raise AssertionError('Floating point value accepted')
    print('6/6 PASS: conditional exact rational radial derivative majorants; actual source coefficients not provided')
