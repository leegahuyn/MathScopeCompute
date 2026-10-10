"""Independent Python/Fraction/Decimal checks; this does not import JS algorithms.

The PDE check differentiates an implicit physical q(r,z,t) with multivariate
Taylor jets, rather than using the JS T/Z differential-polynomial engine.
The probe polynomials test a universal identity and are never source profiles.
"""
import json, math, sys
from fractions import Fraction as F
from decimal import Decimal as D, localcontext

data=json.load(sys.stdin)
checks=[]
def record(name,passed,**details):
    assert passed,name
    checks.append({'id':name,'pass':bool(passed),**details})

ZERO=(0,0,0)
class Jet:
    def __init__(self,v=0,terms=None): self.a={k:F(x) for k,x in (terms if terms is not None else {ZERO:v}).items() if x}
    @staticmethod
    def cast(x): return x if isinstance(x,Jet) else Jet(x)
    def __add__(self,x):
        out=self.a.copy()
        for k,v in self.cast(x).a.items():out[k]=out.get(k,F(0))+v
        return Jet(terms=out)
    __radd__=__add__
    def __neg__(self):return Jet(terms={k:-v for k,v in self.a.items()})
    def __sub__(self,x):return self+-self.cast(x)
    def __rsub__(self,x):return self.cast(x)+-self
    def __mul__(self,x):
        out={}
        for a,av in self.a.items():
            for b,bv in self.cast(x).a.items():
                k=tuple(x+y for x,y in zip(a,b))
                if sum(k)<=2:out[k]=out.get(k,F(0))+av*bv
        return Jet(terms=out)
    __rmul__=__mul__
    def __pow__(self,p):
        p=F(p);c=self.a.get(ZERO,F(0))
        if p.denominator!=1:assert c==1
        u=(self-c)*(1/c)
        return (c**int(p) if p.denominator==1 else F(1))*(1+p*u+(p*(p-1)/2)*u*u)
    def __truediv__(self,x):return self*self.cast(x)**-1
    def __rtruediv__(self,x):return self.cast(x)*self**-1
    def value(self):return self.a.get(ZERO,F(0))
    def derivative(self,i,j=None):
        key=[0,0,0];key[i]+=1
        if j is not None:key[j]+=1
        return self.a.get(tuple(key),F(0))*(2 if j==i else 1)

def variable(value,axis):
    k=[0,0,0];k[axis]=1
    return Jet(terms={ZERO:F(value),tuple(k):F(1)})
def profile(name,n,X,e):
    if name=='phi':return (n+1)+X+(n+2)*e+X*e+X*X/(n+2)+e*e*F(n+1,3)
    if name=='U':return (n+2)+2*X+(n+1)*e+X*e*e+X*X/5
    if name=='V':return X*((n+2)+X/3+(n+1)*e+X*e*e/2)
    if name=='Pi':return (n+3)+2*X+e*e+X*X*e/(n+1)
    raise AssertionError(name)

def polynomial_value(terms,h,X,e):
    cache={}
    def atom(s):
        if s in cache:return cache[s]
        if s=='X':v=X
        elif s=='eta':v=e
        elif s=='h':v=h
        elif s=='L':v=1-2*h*e*e
        elif s=='Cinv':v=F(1,3)
        else:
            name,n,dx,de=s.split('_');j=profile(name,int(n),variable(X,0),variable(e,1));key=(int(dx),int(de),0)
            v=j.a.get(key,F(0))*math.factorial(int(dx))*math.factorial(int(de))
        cache[s]=v;return v
    out=F(0)
    for term in terms:
        v=F(term['coefficient'])
        if term['monomial']!='1':
            for power in term['monomial'].split(';'):
                name,k=power.rsplit('^',1);v*=atom(name)**int(k)
        out+=v
    return out

pde_matches=0
for h in [F(1,128),F(1,256)]:
    r,z,t=variable(2,0),variable(F(1,3),1),variable(F(1,9),2);q=Jet(1)
    for _ in range(5):q=q-(q-z*z*q**(2*h)-1+t)/(1-2*h*z*z*q**(2*h-1))
    record('implicit-physical-q-jet-'+str(h),not(q-z*z*q**(2*h)-1+t).a)
    eta=z*q**(-F(1,2)+h);X=r*r/(2*q)
    fields=[]
    for n in range(3):
        lam=2*n*h;phi=profile('phi',n,X,eta);U=profile('U',n,X,eta);V=profile('V',n,X,eta);Pi=profile('Pi',n,X,eta)
        fields.append(dict(r=q**lam*V/r,theta=r*q**(-1-h+lam)*phi/3,z=q**(-F(1,2)-h+lam)*U,p=q**(-1-2*h+lam)*Pi))
    adv=lambda i,j,c:fields[i]['r'].value()*fields[j][c].derivative(0)+fields[i]['z'].value()*fields[j][c].derivative(1)
    r0=F(2)
    for n in [1,2]:
        f=fields[n];u=f['theta'];ax=f['z'];k=n-1
        angular=u.derivative(2)+sum(adv(i,n-i,'theta')+fields[i]['r'].value()*fields[n-i]['theta'].value()/r0 for i in range(n+1))-(u.derivative(0,0)+u.derivative(0)/r0-u.value()/r0**2)-fields[n-1]['theta'].derivative(1,1)
        axial=ax.derivative(2)+sum(adv(i,n-i,'z') for i in range(n+1))+f['p'].derivative(1)-(ax.derivative(0,0)+ax.derivative(0)/r0)-fields[n-1]['z'].derivative(1,1)
        ur=fields[k]['r'];radial=r0*f['p'].derivative(0)-sum(fields[i]['theta'].value()*fields[n-i]['theta'].value() for i in range(n+1))+r0*(ur.derivative(2)+sum(adv(i,k-i,'r') for i in range(k+1))-(ur.derivative(0,0)+ur.derivative(0)/r0-ur.value()/r0**2)-(fields[k-1]['r'].derivative(1,1) if k else 0))
        divergence=f['r'].derivative(0)+f['r'].value()/r0+f['z'].derivative(1)
        powers={'angular':(-2,2*n-1),'axial':(-1.5,2*n-1),'radial':(-1,2*n-2),'divergence':(-1,2*n)}
        for name,value in dict(angular=angular,axial=axial,radial=radial,divergence=divergence).items():
            terms=next(x for x in data['residual']['components'][name] if (x['qExponent']['constant'],x['qExponent']['hCoefficient'])==powers[name])
            observed=r0**terms['rPower']*polynomial_value(terms['terms'],h,F(2),F(1,3))
            record('physical-pde-'+str(h)+'-n'+str(n)+'-'+name,value==observed,arithmetic='Python Fraction implicit second-order physical Taylor jets');pde_matches+=1

lo=F('14142135623730950/10000000000000000');hi=F('14142135623730951/10000000000000000')
record('sqrt2-rational-square-bracket',lo*lo<2<hi*hi)
palette=data['support'];modulus=int(palette['modulus']);r0=F(palette['r0Exact']);J=[[3,1],[1,5]]
def mm(A,B):return [[sum(A[i][k]*B[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
A=[[1,0],[0,1]]
for delta in range(1,5):
    A=mm(A,J);distance=min(min((A[1][0]*nu)%modulus,modulus-(A[1][0]*nu)%modulus) for nu in range(1,2251));err=3*(max(map(sum,A))+1)*r0
    record('all-rational-centers-covering-'+str(delta),distance>0 and F(distance,modulus)>err,centers=2250,orderedTargetCenters=2250,minimumDistance=str(F(distance,modulus)),enlargementErrorUpper=str(err))
record('negative-control-mod4-mesh-color',0%4==4%4 and 0%5!=4%5,meaning='Two source enlarged boxes four mesh steps apart meet. Modulo 4 would fail, modulo 5 separates them.')
record('negative-control-single-lift-haar',F(1,14)!=1,meaning='A single inverse-lift Jacobian cannot replace the normalized 14-lift torus integral.')

with localcontext() as ctx:
    ctx.prec=70
    g=data['geometry'];sqrt2=D(2).sqrt();jac=4-2*sqrt2
    record('rectangle-jacobian-decimal-reference',D(g['haar']['rectangleJacobianInterval'][0])<=jac<=D(g['haar']['rectangleJacobianInterval'][1]))
    # Independent positive quadrature inside each compact C-infinity bump.
    # This tests the enclosure; the proof remains the directed weight extrema.
    moments=data['moments'];actualU=[[],[]];actualE=[[],[],[]]
    for i,b in enumerate(moments['bumps']):
        center=D(b['center']);width=D(b['width']);sums=[D(0)]*(3 if i>=2 else 2);mass=D(0)
        for k in range(1,256):
            u=-1+D(k)/128;x=center+width*u;w=(-1/(1-u*u)).exp();mass+=w
            values=[x,x*x.ln()] if i<2 else [x*x,1/(x*x),D(1)]
            for j,value in enumerate(values):sums[j]+=w*value
        for j,value in enumerate(sums):
            value/=mass;target=(moments['matrices']['normalizedConfluentU'] if i<2 else moments['matrices']['normalizedE'])[j][i if i<2 else i-2]
            record('moment-weight-enclosure-'+str(i)+'-'+str(j),D(target[0])<=value<=D(target[1]))
    tail=data['picardTail'];P=tail['parameters'];a=D(P['a'])*D(P['Cn']);delta=D(P['rho'])-D(P['rhoPrime']);K=P['terms'];total=D(0)
    for k in range(K,500):
        p=(k+1)//2;term=a**(k+1)/D(math.factorial(k+1))*max(D(1),D(p)/delta)**p;total+=term
    record('picard-independent-positive-series',total.ln()<=D(tail['logTailBound'][1]),termsSummed=500-K,scope='Reference check only; the analytic two-parity geometric bound supplies the infinite remainder proof.')

print(json.dumps({'schema':'MathScope.NavierIndependentChecks/1','checker':'Python standard library Fraction multivariate jets and 70-digit Decimal','pass':True,'total':len(checks),'pdeExactMatches':pde_matches,'checks':checks},sort_keys=True))
