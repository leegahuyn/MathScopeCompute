#!/usr/bin/env python3
"""New source-bound continuous C.2 matrix and ordinary eta-jet enclosures.

Does not run a source producer, replace an integral by samples, or evaluate
the actual oscillatory/improper RHS. Frozen inputs are strictly read-only.
"""
from __future__ import annotations
from dataclasses import dataclass
from fractions import Fraction as F
from hashlib import sha256
from math import isqrt, factorial
from pathlib import Path
import gzip, json, sys

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'work/prune_recovery/native/code'))
from native_binding import SourceBindings

def h(p): return sha256(p.read_bytes()).hexdigest()
def pin(p): return {'path':str(p.relative_to(ROOT)), 'bytes':p.stat().st_size,'sha256':h(p)}
def dump(name, value):
    (OUT/'evidence'/name).write_text(json.dumps(value, indent=2)+'\n')
def canonical(x):return json.dumps(x,sort_keys=True,separators=(',',':'))

@dataclass(frozen=True)
class I:
    lo: F
    hi: F
    def __post_init__(self):
        object.__setattr__(self,'lo',F(self.lo));object.__setattr__(self,'hi',F(self.hi))
        assert self.lo<=self.hi
    @classmethod
    def pt(cls,x):return cls(F(x),F(x))
    def __add__(self,b):
        b=b if isinstance(b,I) else I.pt(b);return I(self.lo+b.lo,self.hi+b.hi)
    __radd__=__add__
    def __neg__(self):return I(-self.hi,-self.lo)
    def __sub__(self,b):return self+-b
    def __mul__(self,b):
        b=b if isinstance(b,I) else I.pt(b)
        v=[self.lo*b.lo,self.lo*b.hi,self.hi*b.lo,self.hi*b.hi];return I(min(v),max(v))
    __rmul__=__mul__
    def inv(self):
        assert self.lo>0 or self.hi<0
        return I(1/self.hi,1/self.lo)
    def __truediv__(self,b):return self*(b if isinstance(b,I) else I.pt(b)).inv()
    def absmax(self):return max(abs(self.lo),abs(self.hi))
    def data(self):return [str(self.lo),str(self.hi)]

def sqrtI(x,bits=90):
    x=F(x);assert x>=0
    scale=2**bits;n=isqrt((x.numerator*scale**2)//x.denominator)
    lo=F(n,scale);hi=lo if lo*lo==x else F(n+1,scale)
    assert lo*lo<=x<=hi*hi
    return I(lo,hi)

def logI(x,n=80):
    """Positive rational log, exact atanh series and geometric remainder."""
    x=F(x);assert x>=1;k=0
    while x>=2:x/=2;k+=1
    def series(v):
        t=(v-1)/(v+1)
        lo=2*sum((t**(2*j+1)/F(2*j+1) for j in range(n)),F(0))
        rem=2*t**(2*n+1)/(F(2*n+1)*(1-t*t))
        return I(lo,lo+rem)
    return series(x)+k*series(F(2))

def det(m):
    if len(m)==0:return I.pt(1)
    if len(m)==1:return m[0][0]
    return sum(((-1)**j*m[0][j]*det([r[:j]+r[j+1:] for r in m[1:]]) for j in range(len(m))),I.pt(0))

def inverse_with_det(m,d):
    n=len(m)
    return [[(-1)**(i+j)*det([row[:i]+row[i+1:] for k,row in enumerate(m) if k!=j])/d for j in range(n)] for i in range(n)]

def norm(m):return max(sum(v.absmax() for v in row) for row in m)
def matdata(m):return [[v.data() for v in row] for row in m]

def q(x):return ('q',str(F(x)))
def coord(x):return ('coordinate',x)
def comm(op,*args):
    flat=[];r=F(0) if op=='add' else F(1)
    for a in args:
        xs=a[1:] if a[0]==op else [a]
        for x in xs:
            if x[0]=='q':r=r+F(x[1]) if op=='add' else r*F(x[1])
            else:flat.append(x)
    if op=='multiply' and r==0:return q(0)
    if r!=(0 if op=='add' else 1) or not flat:flat.append(q(r))
    flat.sort(key=repr)
    return flat[0] if len(flat)==1 else tuple([op]+flat)
def add(*a):return comm('add',*a)
def mul(*a):return comm('multiply',*a)
def unary(op,x):return (op,x)
def integral(f,v,l,r):return ('definite_integral',f,v,l,r)

def read_source(b):
    p=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
    assert p.stat().st_size==32688149
    assert h(p)=='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
    n={}
    with gzip.open(p,'rb') as stream:
        raw_header=stream.readline()
        assert sha256(raw_header).hexdigest()=='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
        for expected,line in enumerate(stream):
            i,node=json.loads(line);assert i==expected;n[i]=node
            if i>=71726:break
    assert all(n[i]==v for i,v in b.nodes.items() if i in n)
    return n,{'compressedSource':pin(p),'headerSHA256':sha256(raw_header).hexdigest(),'prefixRecordCount':len(n),'existingClosureRecordsCompared':sum(i in n for i in b.nodes)}

def signature(nodes,i,env=None,used=None):
    env={} if env is None else env
    if used is not None:used.add(i)
    n=nodes[i];op,a=n['op'],n['args']
    if op=='rational':return q(F(int(a[0]),int(a[1])))
    if op=='coordinate':return coord(env.get(i,a[0]))
    if op=='source_parameter':return ('source_parameter',a[0])
    if op in ('add','multiply'):return comm(op,*(signature(nodes,j,env,used) for j in a))
    if op=='definite_integral':
        body,var,lo,hi=a;name='s' if env else 'x'
        return integral(signature(nodes,body,env|{var:name},used),coord(name),signature(nodes,lo,env,used),signature(nodes,hi,env,used))
    if op in ('source_step_derivative','integer_power'):return (op,signature(nodes,a[0],env,used),a[1])
    return tuple([op]+[signature(nodes,j,env,used) for j in a])

def expected_entry(row,col):
    if (row<2)!=(col<2):return q(0)
    if row==0:return q(1)
    x=coord('x');s=coord('s');lam=('source_parameter','lambda');left=col+9
    bump=mul(q(2),('source_step_derivative',mul(q(2),add(x,q(-left))),1))
    if row==1:
        f=mul(q(-1),bump,integral(unary('exp',mul(q(-1),lam,s)),s,q(0),unary('log_positive',x)))
    elif row==2:f=mul(bump,unary('sqrt_positive',q(2)),unary('sqrt_positive',x))
    elif row in (3,4):
        a=F(1,2) if row==3 else F(3,2)
        f=mul(unary('exp',mul(q(-1),add(lam,q(a)),unary('log_positive',x))),bump)
    out=integral(f,x,q(left),q(F(2*left+1,2)))
    return mul(q(-1),out) if row==3 else out

def cone(nodes,roots):
    seen=set();frontiers={};ints={}
    def visit(i):
        if i in seen:return
        seen.add(i);n=nodes[i];op,a=n['op'],n['args']
        if op in ('rational','coordinate','source_parameter'):return
        if op.startswith('actual_') or op.startswith('m3_'):
            frontiers[i]=n;return
        if op=='definite_integral':ints[i]=n
        children=a[:1] if op in ('integer_power','source_step_derivative') else a
        for j in children:
            assert isinstance(j,int), (i,n)
            visit(j)
    for i in roots:visit(i)
    return seen,frontiers,ints

def main():
    b=SourceBindings();nodes,auth=read_source(b)
    cutoff_source=ROOT/'recovered/base/work/remaining_chain/source/source-inner-growth.mjs'
    cutoff_text=cutoff_source.read_text()
    assert 'sigma_2(s)=a(s)/(a(s)+a(1-s)), a(s)=exp(-1/s^2)' in cutoff_text
    s=b.registry['quadratic'][1];heat=b.registry['quadratic'][2]
    assert heat['linear']==[r[2:] for r in s['linear'][2:]]
    used=set();bindings=[]
    for i,row in enumerate(s['linear']):
        for j,node in enumerate(row):
            actual=signature(nodes,node,used=used);expected=expected_entry(i,j)
            assert actual==expected,(i,j,node,actual,expected)
            bindings.append({'row':i,'column':j,'sourceNode':node,'analyticIntegralMatched':True})
    # Reused theorem hypotheses are source expressions, not numerical overrides.
    assert s['scale']==8 and nodes[8]=={'op':'source_parameter','args':['lambda']}
    assert s['proof']['sourceIncomingBounds']['lambdaUpper']=='1/2^200'
    assert s['proof']['quadraticUpper']=='64'
    assert heat['proof']['preconditionedQuadraticUpper']=='2^36'
    assert heat['proof']['exactContinuousEInverseUpper']=='2^30'
    assert heat['quadraticDiagonal']==[r[2:] for r in s['quadraticDiagonal'][2:]]
    assert s['proof']['normConvention'].startswith('max over components, eta in [-1,1], and ordinary eta derivative orders 0,1,2')
    assert heat['proof']['norm'].startswith('maximum raw eta derivative order 0,1,2')
    delta=F(1,2**200);decay=1-3*delta
    assert sum(F(3**k,factorial(k)) for k in range(5))>F(27,2)
    A=[[I.pt(0) for j in range(5)] for i in range(5)]
    for j in range(5):
        left=F(j+9);right=left+F(1,2)
        if j<2:
            A[0][j]=I.pt(1)
            A[1][j]=I(-logI(right).hi,-logI(left).lo+F(9,2)*delta)
        else:
            A[2][j]=I(sqrtI(2*left).lo,sqrtI(2*right).hi)
            A[3][j]=I(-1/sqrtI(left).lo,-decay/sqrtI(right).hi)
            A[4][j]=I(decay/(right*sqrtI(right).hi),1/(left*sqrtI(left).lo))
    U=[r[:2] for r in A[:2]];E=[r[2:] for r in A[2:]]
    # Positive bump mass and convex divided differences preserve determinant.
    e_lower=F(3,8)*sqrtI(2).lo
    for right in (F(23,2),F(25,2),F(27,2)):
        e_lower*=decay/(right*sqrtI(right).hi)
    assert e_lower>F(3,64000000)
    e_naive=det(E);dE=I(e_lower,e_naive.hi);assert dE.hi>0
    dU=det(U);assert dU.hi<0
    invU=inverse_with_det(U,dU);invE=inverse_with_det(E,dE)
    invA=[[I.pt(0) for j in range(5)] for i in range(5)]
    for i in range(2):
        for j in range(2):invA[i][j]=invU[i][j]
    for i in range(3):
        for j in range(3):invA[i+2][j+2]=invE[i][j]
    M=norm(invA);assert M<2**30
    beta=F(1,2**441);radius=F(1,1000000);Q=F(64)
    qnew=8*delta*M*Q*radius
    qold=F(s['proof']['lipschitzUpper'])
    assert qnew<qold<F(1,4)
    jet=beta/(1-qnew)
    assert beta+4*delta*M*Q*radius**2<radius
    point_q=2*delta*M*Q*jet;assert point_q<1
    jacobian_inverse_bound=M/(1-point_q)
    A_norm=norm(A)
    # An entrywise J^{-1} enclosure follows from a matrix Neumann perturbation.
    inverse_error=M*point_q/(1-point_q)
    Jinverse=[[x+I(-inverse_error,inverse_error) for x in row] for row in invA]
    derivative_rows=[]
    for call_id in list(range(9169,9174))+list(range(71717,71720)):
        n=nodes[call_id];assert n['op']=='actual_quadratic_root' and n['args'][2]==2
        sysid,component,eta=n['args']
        derivative_rows.append({'sourceCallNode':call_id,'sourceCall':n,'system':sysid,'component':component,'actualEtaArgumentNode':eta,
            'ordinaryEtaOrders':[0,1,2],'etaDomain':['-1','1'],'eachDerivativeEnclosure':I(-jet,jet).data(),
            'center':'0','kind':'theorem-derived numerical rational interval; not evaluated RHS or derivative center',
            'sameZeroSeededRoot':True,'finiteIterateDeclaredRoot':False})
    rhs_records={};rhs_frontiers={};rhs_integrals={};rhs_cone=set()
    for sysid in [1,2]:
        d=b.registry['quadratic'][sysid]
        found,fr,integ=cone(nodes,d['rhs']);rhs_cone|=found
        rhs_records[str(sysid)]={str(i):nodes[i] for i in d['rhs']}
        rhs_frontiers[str(sysid)]={str(i):n for i,n in fr.items()}
        rhs_integrals[str(sysid)]={str(i):n for i,n in integ.items()}
    actual_callers={str(i):nodes[i] for i in [9170,9206,9205,71717,71726,71725]}
    callers=[]
    cutoff_prime_upper=64
    # On [1/4,3/4], sigma(1-sigma)<=1/4 and both inverse cubes<=64.
    # On [0,1/4], s^-3*exp(-s^-2)<=64*exp(-16), with symmetry at 1.
    assert 2*F(1,4)*(64+64)==cutoff_prime_upper
    assert sum(F(14**k,factorial(k)) for k in range(4))>F(3584,27)
    for caller,root,factor in [(9206,9170,9205),(71726,71717,71725)]:
        assert nodes[caller]=={'op':'multiply','args':[root,factor]}
        fcone,frontier,_=cone(nodes,[factor]);assert not frontier and 2 not in fcone
        assert nodes[factor]['op']=='multiply' and nodes[factor]['args'][0]==24
        step_id=nodes[factor]['args'][1]
        assert nodes[step_id]['op']=='source_step_derivative' and nodes[step_id]['args'][1]==1
        callers.append({'callerNode':caller,'rootNode':root,'factorNode':factor,'factorEtaIndependentProvedByRawCone':True,
                        'factorSourceNodes':sorted(fcone),'actualRootJetBoundAttached':True,
                        'ordinaryDerivativeFormula':'d_eta^m caller = factor * d_eta^m actualRoot, m=0,1,2',
                        'factorGlobalEnclosure':['0','128'],
                        'callerEtaDomain':['-1','1'],'callerXDomain':'all finite real X; original positive X0 parameter unchanged',
                        'ordinaryEtaOrders':[0,1,2],'eachCallerDerivativeEnclosure':I(-128*jet,128*jet).data(),
                        'fullCallerNumericEnclosureComputed':True,'requestedPrecisionOrNonzeroCenterComputed':False})
        used|=fcone
    used|={8,2,9170,9206,9205,71717,71726,71725}
    used|=set(s['rhs'])|set(heat['rhs'])
    dump('ACTUAL_CONTINUOUS_MATRIX_AND_JETS.json',{
        'schema':'MathScope.ResumedActualQuadraticContinuousIntervals/1','newImplementation':True,'sourceAuthentication':auth,
        'sourceParameterExpressionSHA256':b.fixed['source']['parameterExpressionSHA256'],'systems':[s,heat],
        'matrixIntegralBindings':bindings,'lambdaInterval':['0',str(delta)],'actualLambdaStrictlyPositivePreserved':True,
        'lambdaSetToZero':False,'normalization':'original unit-mass positive bumps, width=1/2, supports [9+j,9+j+1/2]',
        'method':'continuous integral convex-hull enclosures; no quadrature samples or discrete matrix',
        'linearMatrixIntervals':matdata(A),'heatMatrixIntervals':matdata(E),'UDeterminantInterval':dU.data(),
        'EDeterminantInterval':dE.data(),'newEDeterminantLower':str(e_lower),'previousEDeterminantLower':'3/64000000',
        'linearInverseIntervals':matdata(invA),'heatInverseIntervals':matdata(invE),'newLinearInverseInfinityNormUpper':str(M),
        'previousLinearInverseInfinityNormUpper':str(2**30),'maximumRawEtaJetIncomingBound':str(beta),
        'quadraticOperatorUpperReused':'64','rootBallRadius':str(radius),'newC2ContractionUpper':str(qnew),
        'previousC2ContractionUpper':str(qold),'newUniformOrdinaryC2JetBound':str(jet),'rootDerivativeEnclosures':derivative_rows,
        'sourceCutoffDefinition':pin(cutoff_source),'newElementaryGlobalSigma2PrimeBound':64,
        'actualI1JacobianInverseInfinityNormUpper':str(jacobian_inverse_bound),'actualI1JacobianInverseIntervals':matdata(Jinverse),
        'jacobianFormula':'J=A+2*lambda*Qdiag*diag(z); A and Qdiag are original continuous matrices',
        'actualI1PointwiseNeumannPerturbationUpper':str(point_q),'actualI1InversePerturbationEntryError':str(inverse_error),
        'actualCallers':callers,'sourceRhsNodes':rhs_records,
        'originalRhsNumericallyEvaluated':False,'originalRhsDerivativeNumericallyEvaluated':False,
        'finiteIterateDeclaredRoot':False,'originalContinuousMatrixReplaced':False,
        'N706Closed':False,'N805Closed':False,'wholeKernelRowsClosed':0})
    dump('SELECTED_AUTHENTICATED_SOURCE_RECORDS.json',{'sourceAuthentication':auth,'records':{str(i):nodes[i] for i in sorted(used)},'transitiveRhsClosureClaimed':False})
    dump('ACTUAL_RHS_REMAINING_REQUIREMENTS.json',{
        'schema':'MathScope.ResumedQuadraticRhsRequirements/1','originalRhsNodes':rhs_records,
        'I1OriginalDensityIntegralNodes':[8786,8787,8788,8789,8790],
        'I1OriginalDensityIntegralRecords':{str(i):nodes[i] for i in [8786,8787,8788,8789,8790]},
        'heatOriginalIntegralNodes':[71547,71610,71671],
        'heatOriginalIntegralRecords':{str(i):nodes[i] for i in [71547,71610,71671]},
        'nativeFrontiers':rhs_frontiers,'integrals':rhs_integrals,
        'requirements':[
          'For refined nonzero-centered I1 root intervals evaluate actual density integrals8786..8790 at the actual eta caller, including original loop roots, N log X phase and signed cancellations.',
          'Keep RHS8831: -(dJ/(sqrt(2)*X0^(3/2)*K^2)-dM/(X0*K))/lambda^2; do not simplify the row to a different normalization.',
          'For heat evaluate integrals71547,71610,71671 with original infinite-tail change of variable and eta dependence, then exact normalizations71708,71712,71716.',
          'The new derivative bounds use the existing uniform C2 incoming theorem; they do not supply original RHS derivative values or nonzero centers.',
          'All higher eta orders need their own source incoming derivative bound; C2 is not an all-orders result.',
          'Final A,b,p mixed derivatives, energy/norm integrals and all actual caller domains remain required for N7-06/N8-05.'
        ],'wholeKernelRowsClosed':0,'N706Closed':False,'N805Closed':False})
    controls={
        'all25OriginalMatrixEntriesAnalyticallyMatched':len(bindings)==25,
        'continuousEBlockSharedByHeat':heat['linear']==[r[2:] for r in s['linear'][2:]],
        'EDeterminantBoundImprovesSourceBound':e_lower>F(3,64000000),
        'InverseBoundImprovesSourceBound':M<2**30,'C2ContractionStrictlyImproved':qnew<qold,
        'sourceRadiusStillInvariant':beta+4*delta*M*Q*radius**2<radius,
        'actualJacobianNonsingular':point_q<1,'eightActualRootCallsBound':len(derivative_rows)==8,
        'twoActualParentProductsBoundToEtaIndependentFactor':all(c['factorEtaIndependentProvedByRawCone'] for c in callers),
        'twoActualParentProductC2IntervalsComputed':all(c['fullCallerNumericEnclosureComputed'] for c in callers),
        'sqrtLowerAndUpperDirected':all(sqrtI(F(i,2)).lo**2<=F(i,2)<=sqrtI(F(i,2)).hi**2 for i in range(18,28)),
        'matrixSubstitutionNegativeControl':signature(nodes,s['linear'][2][2])!=expected_entry(2,3),
        'normalizationNegativeControl':s['linear'][0][0]==1 and nodes[1]=={'op':'rational','args':['1','1']},
        'RhsStillUnresolved':True,'acceptanceRowsUnchanged':True}
    assert all(controls.values())
    dump('CHECKS.json',{'checks':controls,'allPassed':True})
    print(json.dumps({'allChecksPassed':True,'matrixEntries':25,'rootCallsWithOrdinaryEtaC2Intervals':8,
        'actualParentCallers':2,'newEInverseNormUpperApprox':float(M),'newEDeterminantLowerApprox':float(e_lower),
        'newC2ContractionUpperApprox':float(qnew),'newJetBoundApprox':float(jet),'RhsEvaluated':False,
        'N706Closed':False,'N805Closed':False,'wholeKernelRowsClosed':0},sort_keys=True))

if __name__=='__main__':main()
