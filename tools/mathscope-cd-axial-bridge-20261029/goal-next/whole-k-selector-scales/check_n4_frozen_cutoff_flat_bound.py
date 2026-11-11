"""Exact integer envelopes for the actual fourth cutoff on frozen K cells."""

from argparse import ArgumentParser
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
import json

from check_common_b_scales import F8, blob


CELL='1766b52e6d40470b848ba1fa28b67ef0e8ff3cbb673420a94807a20fd97b3b86'


def flat_bounds(order):
    polynomials=[{0:1}]
    for _ in range(order):
        new={}
        for p,c in polynomials[-1].items():
            if p:
                new[p+1]=new.get(p+1,0)-p*c
            new[p+2]=new.get(p+2,0)+c
        polynomials.append({p:c for p,c in new.items() if c})
    A=[sum(abs(c)*2**p for p,c in row.items()) for row in polynomials]
    B=[sum(abs(c)*2**p*factorial(p) for p,c in row.items()) for row in polynomials]
    inverse=[9]
    for n in range(1,order+1):
        inverse.append(9*sum(comb(n,j)*(A[j]+B[j])*inverse[n-j] for j in range(1,n+1)))
    ordinary=[2**n*sum(comb(n,j)*B[j]*inverse[n-j] for j in range(n+1)) for n in range(order+1)]
    stirling=[[1]]
    for n in range(1,order+1):
        old=stirling[-1]
        stirling.append([(old[k-1] if k else 0)+(k*old[k] if k<len(old) else 0) for k in range(n+1)])
    euler=[sum(c*d for c,d in zip(row,ordinary)) for row in stirling]
    assert polynomials[:3]==[{0:1},{2:1},{3:-2,4:1}][:order+1]
    assert all(max(row,default=0)<=2*n for n,row in enumerate(polynomials))
    return {'flatPolynomials':[{str(p):str(c) for p,c in row.items()} for row in polynomials],
            'reciprocalDerivativeIntegers':list(map(str,inverse)),
            'ordinaryDerivativeIntegers':list(map(str,ordinary)),
            'eulerDerivativeIntegers':list(map(str,euler))}


def main():
    parser=ArgumentParser(description=__doc__)
    for key in ('repo','cell','out'):
        parser.add_argument('--'+key,type=Path,required=True)
    parser.add_argument('--order',type=int,default=6)
    args=parser.parse_args()
    assert 0<=args.order<=32
    data=args.cell.read_bytes();assert sha256(data).hexdigest()==CELL
    assert json.loads(data)['checked']['strictRepresentativeLower']=='sRep>1-w/2+w^2/16'
    name='research-ide/mathscope-m3/navier/source-global-band.mjs'
    source=blob(args.repo,name)
    markers=["a=G.exp(G.neg(G.inv(z))),b=G.exp(G.neg(G.inv(G.sub(G.one,z))))",
             'body=G.choose(x,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero)',
             "name:'CommonOriginalTimeCutoff'",'G.mul(sigma,G.expressionValue(sourceCutoff.system,[sigma],[1]))']
    assert all(x.encode() in source for x in markers)
    result={'schema':'MathScope.N7.ActualFrozenN4CutoffFlatDerivativeBound/1','sourceCommit':F8,
            'oneCellGeometrySHA256':CELL,'sourcePath':name,'sourceSHA256':sha256(source).hexdigest(),
            'geometry':'For an active frozen fourth cutoff x=b4*qRep, x>=sRep>1-w/2+w^2/16 and rho=2*(1-x) lies in (0,w).',
            'sourceFormula':'chi(x)=exp(-1/rho)/(exp(-1/(1-rho))+exp(-1/rho)).',
            'valueUpper':'chi(x)<exp(2-1/w)',
            'derivativeUpper':'Each integer ordinary/Euler coefficient multiplies exp(-1/(2*w)); at x>=1 every fixed derivative is exactly zero.',
            'extraDerivative':'The actual extra radial cutoff x*chi_prime has Euler derivative of order j equal to the chi Euler derivative of order j+1.',
            'proof':[
                'For b=exp(-1/rho), D(b*P)=b*(P_prime+rho^-2*P).',
                'rho^-k*exp(-1/rho)<=2^k*k!*exp(-1/(2*rho)) by the kth positive Taylor term of exp(1/(2*rho)).',
                'For a=exp(-1/(1-rho)), derivatives of order j have absolute bound sum |c_jk|*2^k on rho<=w<1/2.',
                'a+b>=a>exp(-2), and exp(2)<9. Differentiate the reciprocal product identity, then use the ordinary Leibniz recurrence for b/(a+b).',
                'Change rho derivatives to x derivatives by powers of -2. Use exact Stirling conversion for Euler derivatives and |x|<=1.' ],
            'order':args.order,**flat_bounds(args.order),
            'scope':'Phase-independent bound for the actual frozen cutoff factor and its fixed derivatives. Full source field multiplication and fast propagation have separate bounds.',
            'release':'HOLD'}
    raw=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(raw)
    print('PASS actual frozen cutoff and Euler derivative exponential flat bounds')
    print(sha256(raw).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
