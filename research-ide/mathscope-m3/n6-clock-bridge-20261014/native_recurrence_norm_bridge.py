"""Independent source derivative audit preceding a native Banach-norm bridge.

The output distinguishes an exact finite source identity, a conditional
all-order majorant theorem, and the unresolved applicability of that theorem
to the complete original coefficient interpreter. No sampled norm is a proof.
"""
from __future__ import annotations
from collections import defaultdict
from fractions import Fraction as Q
from functools import lru_cache
import hashlib,json,math,sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
for p in [HERE, HERE.parent/'n6-cloud-20261014',HERE.parent/'n6-finish-20261014',
          Path('work/stage/research-ide/mathscope-m3/n6-clock-bridge-20261014')]:
    if str(p) not in sys.path:sys.path.insert(0,str(p))
from source_clock_bridge import SourceCanonical,q,fq,mul,add,power,inv,exp,log,sigma,integral,parameter,sub,neg
from jet_worker import validate_inputs,require,write,file_hash,PARENT,js_hash
from native_picard_bridge import certificate as recurrence_certificate


class ProofStop(ValueError):pass


def differentiate(expr,target):
    """Real derivative with exact binder semantics; moving bounds are rejected.

    In this application every interval endpoint is independent of eta. All
    finite pressure fibers have C-infinity elementary integrands and positive
    logarithm arguments by the authenticated complete-clock theorem.
    """
    @lru_cache(None)
    def d(x):
        op=x[0]
        if x==target:return q(1)
        if op in ['q','parameter','coordinate','b']:return q()
        if op=='add':return add(*(d(y) for y in x[1:]))
        if op=='mul':return add(*(mul(*(d(y) if i==j else y for i,y in enumerate(x[1:]))) for j in range(len(x)-1)))
        if op=='pow':return mul(q(x[2]),power(x[1],x[2]-1),d(x[1]))
        if op=='inv':return neg(mul(power(inv(x[1]),2),d(x[1])))
        if op=='exp':return mul(exp(x[1]),d(x[1]))
        if op=='log':return mul(inv(x[1]),d(x[1]))
        if op=='sigma':return mul(sigma(x[1],x[2]+1),d(x[1]))
        if op=='integral':
            if d(x[2])!=q() or d(x[3])!=q():raise ProofStop('eta-dependent pressure integration endpoint requires separate transport')
            return integral(d(x[1]),x[2],x[3])
        raise ProofStop('unreviewed derivative operation: '+op)
    return d(expr)


class ExactRational:
    """Sparse rational arithmetic, with independent functional atoms.

    Only algebraic operations are normalized. Transcendental atoms require
    identical canonical arguments. Integral atoms may identify algebraically
    equal densities on identical oriented intervals; this is finite-integral
    extensionality on the already proved common defined domain.
    """
    def __init__(self,budget=200000):
        self.budget=budget;self.work=0;self.atoms={};self.integrals=[];self.memo={}
    def tick(self,n):
        self.work+=n
        if self.work>self.budget:raise ProofStop('exact rational source identity operation budget exhausted')
    def pa(self,a,b):
        r=dict(a)
        for m,c in b.items():r[m]=r.get(m,Q())+c
        return {m:c for m,c in r.items() if c}
    def pm(self,a,b):
        self.tick(len(a)*len(b));r=defaultdict(Q)
        for m,c in a.items():
            for n,d in b.items():r[tuple(sorted(m+n))]+=c*d
        return {m:c for m,c in r.items() if c}
    def plus(self,a,b):return self.pa(self.pm(a[0],b[1]),self.pm(b[0],a[1])),self.pm(a[1],b[1])
    def times(self,a,b):return self.pm(a[0],b[0]),self.pm(a[1],b[1])
    def equal(self,a,b):return self.pm(a[0],b[1])==self.pm(b[0],a[1])
    def atom(self,x):
        if x[0]=='integral':
            body=self.at(x[1]);ends=x[2:]
            for prior_ends,prior_body,ident in self.integrals:
                if ends==prior_ends and self.equal(body,prior_body):return {(ident,):Q(1)},{():Q(1)}
            ident='I'+str(len(self.integrals));self.integrals.append((ends,body,ident))
        else:
            ident=self.atoms.setdefault(x,'A'+str(len(self.atoms)))
        return {(ident,):Q(1)},{():Q(1)}
    def at(self,x):
        if x in self.memo:return self.memo[x]
        op=x[0]
        if op=='q':r=({():fq(x)} if fq(x) else {},{():Q(1)})
        elif op in ['add','mul']:
            r=({}, {():Q(1)}) if op=='add' else ({():Q(1)},{():Q(1)})
            for child in x[1:]:r=(self.plus if op=='add' else self.times)(r,self.at(child))
        elif op=='inv':
            a,b=self.at(x[1]);require(bool(a),'formal inverse of zero source expression');r=b,a
        elif op=='pow':
            a=self.at(x[1]);n=x[2]
            if n<0:a=(a[1],a[0]);n=-n
            r=({():Q(1)},{():Q(1)})
            while n:
                if n&1:r=self.times(r,a)
                n//=2
                if n:a=self.times(a,a)
        else:r=self.atom(x)
        self.memo[x]=r;return r


def authenticate_clock(context,definitions):
    path=Path(context['native_clock_certificate_path']).resolve()
    require(file_hash(path)==context['native_clock_certificate_sha256'],'fresh source clock certificate hash differs')
    result=json.loads(path.read_text(encoding='utf8'))
    require(result.get('sourceParentSHA256')==PARENT,'clock parent source differs')
    require(result.get('nativePressureEqualsLeanNewPressureProved') is True and result.get('nativeGEqualsLeanRealAmplitudeProved') is True,'complete original P0/g bridge is not proved')
    receipt=result['sourceNodeBindingEvidence'];relative=Path(receipt['path'])
    require(not relative.is_absolute() and len(relative.parts)==1,'clock source evidence must be an adjacent named file')
    evidence=path.parent/relative
    require(file_hash(evidence)==receipt['sha256'],'clock source-binding evidence hash differs')
    binding=json.loads(evidence.read_text(encoding='utf8'));fixed=definitions['fixed:null']
    require(binding['fixedDefinitionSHA256']==fixed['definitionSHA256'],'clock fixed definition differs')
    require(binding['nativeFullPressureNode']==fixed['definition']['core']['P0'] and binding['nativePositiveGNode']==fixed['definition']['core']['g'],'clock native root IDs differ')
    require(binding['all12StagesBothInfiniteTailsAndPressureFactorVerified'] is True and binding['gGradientPrimitiveAndCNormalizationVerified'] is True,'clock certificate omitted complete actual stages or g normalization')
    return {'clockCertificateSHA256':file_hash(path),'sourceBindingsSHA256':file_hash(evidence),'fixedDefinitionSHA256':binding['fixedDefinitionSHA256']}


def mixed_majorant_constants(k,m,radius_ratio=Q(1,4)):
    """Exact factor multiplying Q*rho^-m in the conditional mixed bound."""
    require(isinstance(k,int) and isinstance(m,int) and k>=0 and m>=0,'orders must be nonnegative integers')
    radius_ratio=Q(radius_ratio);require(0<=radius_ratio<1,'radial absolute-convergence ratio outside [0,1)')
    return Q(math.factorial(m+k),(m+1)**2*20**k)/(1-radius_ratio)**(m+k+1)


def conditional_majorant():
    # Exact binomial identities verify the closed form for every m,k by the
    # formal derivative of (1-r)^(-m-1), not by finite testing.
    return {'hypothesis':'The ACTUAL native coefficient function c_n belongs to the original B_rho ball of radius Q, on the original common eta interval.',
      'coefficientInequality':'|d_eta^m c_n| <= Q*rho^-m*m!/(m+1)^2 * binom(n+m,m)/(20^n*(n+1)^2)',
      'mixedDerivativeInequality':'For |Y|<=R<20: |d_Y^k d_eta^m f| <= Q*rho^-m*(m+k)!/((m+1)^2*20^k)*(1-R/20)^(-m-k-1)',
      'allOrdersArgument':'Differentiate the absolutely convergent binomial series sum binom(n+m,m) r^n=(1-r)^(-m-1) k times, dropping only the factor (n+1)^-2<=1. The resulting positive majorant is finite for every fixed m,k and R<20. Weierstrass uniform convergence justifies every fixed mixed derivative.',
      'conditionalTheoremProved':True,'hypothesisEstablishedForActualNativeSeries':False,
      'actualAllCallDomainsCovered':False}


def run(context,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    result={'schema':'MathScope.N6.NativeRecurrenceNormBridge/1','sourceParentSHA256':PARENT,
      'nativeB_rhoNormBoundProved':False,'nativePhiGlobalPositiveProved':False,
      'allActualCallDomainsProved':False,'newClosedJets':0,'N6-01':'OPEN','N6-02':'PARTIAL',
      'conditionalAllOrderMajorant':conditional_majorant(),
      'remainingProofDependencies':[
        'Bind the COMPLETE original actual_natural_series/native limit interpreter, including its stored derivative semantics and simultaneous full input tuple, to all coefficients of the selected analytic fixed point. Materialized degree<=64 is not a proof of omitted coefficients.',
        'Transport every actual native input FUNCTION and its eta derivatives into the selected fixed-point coefficient equations, including the original explicit derivative of P0 inside Zstar.',
        'Authenticate an original Lean kernel receipt with its exact declaration assumptions and transitive axioms, or give an independent complete proof of applicability of selectedFixedPoint_spec and selectedReference_radius_Q. Source hashes and theorem names alone do not certify a norm.',
        'Prove every original full-field argument lies in the common eta interval/holomorphic strip and radial convergence disk. Intrinsic local series norms do not give a global source image certificate.'
      ]}
    try:
        checkpoint,previous,originals,program,source,definitions=validate_inputs(context)
        result['authenticatedClockBridge']=authenticate_clock(context,definitions)
        core=definitions['fixed:null']['definition']['core'];canonical=SourceCanonical(source)
        eta=canonical.at(core['eta']);h=parameter('h');A=add(q(Q(1,2)),h);D=sub(q(Q(1,2)),h)
        d=sub(q(1),power(eta,2));L=sub(q(1),mul(q(2),h,power(eta,2)));Us=add(mul(q(4),eta),parameter('j0'))
        H=add(mul(D,eta),mul(d,Us));W=sub(sub(q(1),mul(q(4),d)),mul(q(2),D,eta,Us));den=add(power(H,2),power(parameter('sigmaStar'),2))
        expected={'A':A,'D':D,'d':d,'L':L,'Ustar':Us,'Hstar':H,'Wstar':W,'chi':mul(power(H,2),inv(den)),'zeta':neg(mul(L,H,inv(den)))}
        exact=ExactRational();checks=[]
        for key,value in expected.items():
            require(exact.equal(exact.at(canonical.at(core[key])),exact.at(value)),'actual fixed-input identity differs: '+key)
            checks.append({'sourceField':key,'sourceNode':core[key],'exactRationalIdentity':True})
        result['nativeFixedInputChecks']=checks
        pressure=canonical.at(core['P0']);derivative=differentiate(pressure,eta)
        expected_z=add(neg(mul(A,sub(q(1),mul(q(2),eta,Us)),Us)),neg(mul(q(4),H)),neg(mul(d,derivative)),mul(q(4),A,eta,pressure))
        actual_z=canonical.at(core['Zstar'])
        require(exact.equal(exact.at(actual_z),exact.at(expected_z)),'independent P0_eta / original Zstar exact rational identity not established')
        result['nativeZstarDerivativeIdentityProved']=True
        result['nativeZstarProofScope']='Intrinsic eta functions on the complete clock-defined real domain, before arbitrary actual whole-field argument substitution.'
        result['nativeUniversalRecurrenceIdentities']=recurrence_certificate()
        result['sourceAuditWork']={'sourceNodes':canonical.work,'rationalOperations':exact.work,'integralEquivalenceClasses':len(exact.integrals)}
        result['sourceNodeEvidence']=write(out/'native-recurrence-norm-source-bindings.json',{
          'sourceNodeHashes':[{'sourceNode':i,'sha256':js_hash(n)} for i,n in sorted(canonical.read_nodes.items())],
          'fixedDefinitionSHA256':definitions['fixed:null']['definitionSHA256'],
          'P0Node':core['P0'],'ZstarNode':core['Zstar'],'etaNode':core['eta']})
    except Exception as error:
        result['preciseSourceBindingStop']={'type':type(error).__name__,'message':str(error)}
    result['status']='PARTIAL_SOURCE_AUDIT_NORM_APPLICABILITY_OPEN'
    write(out/'native-recurrence-norm-bridge.json',result)
    return result
