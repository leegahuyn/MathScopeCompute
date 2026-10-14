"""Source-node audit of the complete native A.21/Lean clock partition.

This works on the inherited authenticated source prefix, never rebuilds a
producer. Exact function equalities use derivative/initial-value uniqueness
on the complete real clock, finite integral additivity and exact tails.
The separate native coefficient-space norm bridge is not asserted here.
"""
from __future__ import annotations
from collections import defaultdict
from fractions import Fraction as Q
import hashlib,json,sys
from pathlib import Path
import urllib.request

HERE=Path(__file__).resolve().parent
for folder in ['n6-cloud-20261014','n6-finish-20261014']:
    path=HERE.parent/folder
    if str(path) not in sys.path:sys.path.insert(0,str(path))
from jet_worker import validate_inputs,js_hash,file_hash,PARENT,require,write
from jet_solve import source_parameters
from native_picard_bridge import E,expression,variables,normalize,independent_distribute
from guard_solve import terminal_theorem
from guard_worker import STEP_SHA

PREFIX='research-ide/mathscope-m1/navier/followup-20261010-same-datum-axis/'
PINS={
 'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs':STEP_SHA,
 'research-ide/mathscope-m2/navier/actual-global-source-outer.mjs':'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
 'research-ide/mathscope-m2/navier/actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
 'research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
 PREFIX+'independent-review/formal-route-review-001.inputs/OutgoingSchedule.lean':'680379d41f5ecb928f53278860c807e3344e9bcaefbcd6c4bbcc493f812bc552',
 PREFIX+'independent-review/formal-route-review-001.inputs/OutgoingTail.lean':'450c6d0cea94de6ebaad98d199bfa5b45b1cbc249decec3fd44b796ddd43eba5',
 PREFIX+'formal-input-producer/SameDatumInputs.lean':'9f80d62caa58f5b4076eda552286752ad598c7214c1bafaf01778f7a02a5f5af',
 PREFIX+'independent-review/formal-route-review-001.inputs/PressureDatum.lean':'a1ad3e25e569532b0dc21c71f5f8e0092bb8abd2096f03c3469639d2435a2513',
 'research-ide/mathscope-m1/navier/sources/official-repo/NavierStokes/NaturalAxisCoefficients.lean':'cf762100d7de681f34aba5dcfeecac4b81e6b5d2cda8ec781236e4b3fdd3d9fd',
}
FLAT_URL='https://raw.githubusercontent.com/openai/NavierStokesAndEuler/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/FlatCutoff.lean'
FLAT_SHA='fa8b6c0283fbbd949e2501649c67617174fbf4d2d11d5c3ac1556daa6c186d17'
STAGES=['initial','axialDecay','entry','reservedPower','pulse','interpolation','angular','steepen','steepPower','flatten','wait','terminal']

def q(x=0):
    x=Q(x);return ('q',str(x.numerator),str(x.denominator))
def fq(x):return Q(int(x[1]),int(x[2])) if x[0]=='q' else None
def mul(*terms):
    coefficient=Q(1);factors=[]
    for term in terms:
        if term[0]=='mul':values=term[1:]
        else:values=[term]
        for value in values:
            if fq(value) is not None:coefficient*=fq(value)
            else:factors.append(value)
    if not coefficient:return q()
    if coefficient!=1:factors.append(q(coefficient))
    factors.sort(key=repr)
    return q(1) if not factors else factors[0] if len(factors)==1 else ('mul',*factors)
def add(*terms):
    grouped=defaultdict(Q)
    def enter(term):
        if term[0]=='add':
            for child in term[1:]:enter(child)
        elif fq(term) is not None:grouped[()]+=fq(term)
        elif term[0]=='mul':
            coefficient=Q(1);factors=[]
            for child in term[1:]:
                if fq(child) is not None:coefficient*=fq(child)
                else:factors.append(child)
            grouped[tuple(factors)]+=coefficient
        else:grouped[(term,)]+=1
    for term in terms:enter(term)
    result=[mul(q(c),*f) for f,c in grouped.items() if c]
    result.sort(key=repr)
    return q() if not result else result[0] if len(result)==1 else ('add',*result)
def neg(x):return mul(q(-1),x)
def sub(x,y):return add(x,neg(y))
def power(x,n):
    if n==0:return q(1)
    if n==1:return x
    if fq(x) is not None:return q(fq(x)**n)
    return ('pow',x,n)
def inv(x):
    if fq(x) is not None:return q(1/fq(x))
    return ('inv',x)
def exp(x):return q(1) if x==q() else ('exp',x)
def log(x):return q() if x==q(1) else ('log',x)
def sigma(x,n=0):
    if fq(x) is not None and (fq(x)<=0 or fq(x)>=1):return q(int(fq(x)>=1)) if n==0 else q()
    return ('sigma',x,n)
def integral(body,left,right):
    if left==right or body==q():return q()
    if body==sigma(('b',0)) and left==q() and right==q(1):return q(Q(1,2))
    return ('integral',body,left,right)
def primitive_sigma(s):return integral(sigma(('b',0)),q(),s)
def parameter(name):return ('parameter',name)


class SourceCanonical:
    """Exact AC/rational normalization with lexically bound integrals."""
    def __init__(self,source):self.source=source;self.memo={};self.read_nodes={};self.work=0
    def at(self,ident,bound=(),depth=0):
        key=ident,bound,depth
        if key in self.memo:return self.memo[key]
        self.work+=1
        if self.work>150000:raise ValueError('finite source clock proof node budget exhausted')
        n=self.source[ident];self.read_nodes[ident]=n;op,a=n['op'],n['args'];env=dict(bound)
        at=lambda i:self.at(i,bound,depth)
        if op=='rational':result=q(Q(int(a[0]),int(a[1])))
        elif op=='source_parameter':result=parameter(a[0])
        elif op=='coordinate':result=('b',depth-1-env[ident]) if ident in env else ('coordinate',ident)
        elif op=='add':result=add(*(at(i) for i in a))
        elif op=='multiply':result=mul(*(at(i) for i in a))
        elif op=='integer_power':result=power(at(a[0]),a[1])
        elif op=='inverse':result=inv(at(a[0]))
        elif op=='exp':result=exp(at(a[0]))
        elif op=='log_positive':result=log(at(a[0]))
        elif op=='source_step_derivative':result=sigma(at(a[0]),a[1])
        elif op=='definite_integral':
            scoped=tuple(sorted([(k,v) for k,v in bound if k!=a[1]]+[(a[1],depth)]))
            result=integral(self.at(a[0],scoped,depth+1),at(a[2]),at(a[3]))
        else:raise ValueError('unreviewed operation in literal pressure/g source: '+op)
        self.memo[key]=result;return result


def source_profile_checks(parameters):
    p=parameters.expressions
    expected={'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
      'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},
      'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},
      'Pstar':{'exp':{'ref':'logP'}},'logP':{'product':[{'integer':2},{'ref':'T'}]},
      'K':{'power':[{'ref':'Pstar'},2]},
      'Q':{'quotient':[{'product':[{'integer':str(2**260)},{'ref':'K'}]},{'power':[{'ref':'sigmaStar'},2]}]},
      'j0':{'power':[{'ref':'h'},4]},'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]},
      'rho':{'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},
      'Lambda':{'power':[{'ref':'Q'},64]},'co':{'rational':'1/256'},'Tf':{'integer':128},
      'BOuter':{'product':[{'integer':1000},{'ref':'T'}]},
      'CSelected':{'exp':{'ref':'logCSelected'}},
      'logCSelected':{'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]},
      'BRefUpper':{'power':[{'ref':'Q'},300]}}
    for name,formula in expected.items():require(p.get(name)==formula,'original pressure/g scalar definition changed: '+name)
    return {'allExactDefinitionsVerified':True,'CSelectedIdentity':'exp(10 log(1+Q^300)+Q^200)=(1+Q^300)^10 exp(Q^200), since Q>0',
            'finiteOrderedClockPremises':'T>10,0<h<lambda<1/100,co=1/256,Tf=128,hold=-4log(h)>0,wait>5',
            'nativeCommonDomainFromTheseConstantsAlone':False}


def clock_derivative_certificates(mutation=None):
    lam,h,s,j,f=variables('lambda h sigma interpolation_log_derivative terminal_log_derivative')
    zero,one=expression(0),expression(1)
    rows={
      'negativeInfinitePrefix':([zero,zero,zero,zero,zero,zero],one),
      'initial':([s,zero,zero,zero,zero,zero],one-6*s),
      'axialDecay':([one,zero,zero,zero,zero,zero],-5*one),
      'entry':([one,s,zero,zero,zero,zero],-5*one-10*lam*s),
      'reservedPower':([one,one,zero,zero,zero,zero],-5*one-10*lam),
      'pulse':([one,one,zero,zero,zero,zero],-5*one-10*lam),
      'interpolation':([one,one,j,zero,zero,zero],-5*one-10*lam-10*j),
      'angular':([one,one,zero,zero,zero,zero],-5*one-10*lam),
      'steepen':([one,one,zero,s,zero,zero],-5*one-10*lam-10*(one-lam)*s),
      'steepPower':([one,one,zero,one,zero,zero],-15*one),
      'flatten':([one,one,zero,one,s,zero],-15*one+10*(one-h)*s),
      'wait':([one,one,zero,one,one,zero],-5*one-10*h),
      'terminal':([one,one,zero,one,one,f],-5*one-10*h+10*f),
      'positiveInfiniteTail':([one,one,zero,one,one,zero],-5*one-10*h)}
    result=[]
    for name,(args,native) in rows.items():
        c0,c1,c2,c3,c4,c5=args
        lean=-5*one+6*(one-c0)-10*lam*c1-10*c2-10*(one-lam)*c3+10*(one-h)*c4+10*c5
        if mutation==name:native+=one
        a,b=normalize(lean-native),independent_distribute(lean-native)
        require(a==b and not a,'original clock derivative mismatch: '+name)
        result.append({'stage':name,'scale':10,'firstExactResidualTerms':len(a),'independentExactResidualTerms':len(b),
                       'rangeRule':'sigma is0 on(-infinity,0],1 on[1,infinity), and every positive endpoint/exterior derivative is0'})
    return result


def native_bindings(source,definitions):
    fixed=definitions['fixed:null']['definition'];core=fixed['core'];outer=fixed['outer'];pressure=fixed['pressure']
    require(core['P0']==pressure['pressure']==fixed['naturalKernel']['actualPressureRoot'],'native pressure root binding differs')
    require(core['g']==fixed['naturalKernel']['actualPositiveGRoot'],'native positive g root binding differs')
    require([x['id'] for x in outer['stages']]==STAGES==[x['id'] for x in pressure['stages']],'complete native clock stage inventory changed')
    c=SourceCanonical(source);p=parameter
    h,lam,T,Tf,co=[p(x) for x in ['h','lambda','T','Tf','co']]
    rho=mul(co,h);alpha=neg(add(q(Q(1,2)),lam));hold=mul(q(-4),log(h))
    Qb,Qp,W=[c.at(outer['roots'][k]) for k in ['Qb','Qp','terminalWait']]
    require(W==mul(log(mul(Qb,inv(Qp))),inv(sub(q(1),h))),'native terminal wait normalization differs')
    # Independently reconstruct the literal integrating-factor data.
    t=('b',0);a=sub(q(1),lam);S=primitive_sigma(t);one_minus_h=sub(q(1),h)
    Q0=mul(sub(lam,h),inv(a))
    steep=mul(exp(neg(mul(a,q(Q(1,2))))),add(Q0,integral(mul(exp(mul(a,sub(t,S))),sub(add(lam,mul(a,sigma(t))),h)),q(),q(1))))
    expected_b=mul(exp(neg(mul(one_minus_h,q(Q(1,2))))),add(steep,mul(one_minus_h,hold),integral(mul(exp(mul(one_minus_h,S)),one_minus_h,sub(q(1),sigma(t))),q(),q(1))))
    expected_p=integral(mul(exp(mul(one_minus_h,t)),rho,sigma(mul(sub(t,q(1)),q(Q(1,2))),1),inv(mul(q(2),sub(q(1),rho)))),q(1),q(3))
    require(Qb==expected_b,'original native Qb integrating-factor source differs')
    require(Qp==expected_p,'original native Qp source differs')
    lengths=[q(1),T,q(1),mul(q(60),p('BOuter')),mul(q(13),inv(lam)),Tf,mul(q(30),p('BOuter')),q(1),hold,q(1),W,q(3)]
    def delta(name,s):
        S=primitive_sigma(s)
        if name=='initial':return sub(mul(q(Q(1,10)),s),mul(q(Q(3,5)),S))
        if name=='axialDecay':return neg(mul(q(Q(1,2)),s))
        if name=='entry':return sub(neg(mul(q(Q(1,2)),s)),mul(lam,S))
        if name in ['reservedPower','pulse','angular']:return mul(alpha,s)
        if name=='interpolation':return sub(mul(alpha,s),mul(log(q(2)),sigma(mul(s,inv(Tf)))))
        if name=='steepen':return sub(mul(alpha,s),mul(sub(q(1),lam),S))
        if name=='steepPower':return mul(q(Q(-3,2)),s)
        if name=='flatten':return add(mul(q(Q(-3,2)),s),mul(one_minus_h,S))
        if name=='wait':return neg(mul(add(q(Q(1,2)),h),s))
        fo=sub(q(1),mul(rho,sub(q(1),sigma(mul(sub(s,q(1)),q(Q(1,2)))))))
        return add(neg(mul(add(q(Q(1,2)),h),s)),log(mul(fo,inv(sub(q(1),rho)))))
    eta=c.at(core['eta']);f0=inv(add(q(1),power(eta,2)));logf=log(f0)
    starts=q();amplitude=q();records=[];integrals=[]
    for name,length,row,pr in zip(STAGES,lengths,outer['stages'],pressure['stages']):
        require(c.at(row['length'])==length,'native source stage length differs: '+name)
        require(c.at(row['start'])==starts and c.at(row['logAStart'])==amplitude,'native clock start/normalization differs: '+name)
        end=add(starts,length);new_amplitude=add(amplitude,delta(name,length))
        require(c.at(row['end'])==end and c.at(row['logAEnd'])==new_amplitude,'native adjacent stage endpoint differs: '+name)
        s=('b',0);theta=sub(q(1),sigma(mul(s,inv(Tf)))) if name=='interpolation' else q(int(name in ['initial','axialDecay','entry','reservedPower','pulse']))
        expected_integrand=exp(mul(q(2),add(amplitude,delta(name,s),mul(theta,logf))))
        bound=((pr['variable'],0),)
        require(c.at(pr['lower'])==q() and c.at(pr['upper'])==length,'native pressure integral interval differs: '+name)
        require(c.at(pr['integrand'],bound,1)==expected_integrand,'native actual pressure density differs: '+name)
        expected_integral=integral(expected_integrand,q(),length)
        require(c.at(pr['integral'])==expected_integral,'native pressure integral body/binder differs: '+name)
        integrals.append(expected_integral)
        records.append({'id':name,'sourceStageStart':row['start'],'sourceStageEnd':row['end'],
            'sourceIntegral':pr['integral'],'sourceIntegrand':pr['integrand'],'sourceBinder':pr['variable'],
            'exactFullDensityAndIntervalMatched':True,'adjacentNormalizationMatched':True})
        starts,amplitude=end,new_amplitude
    prefix=mul(q(5),power(f0,2));tail=mul(exp(mul(q(2),amplitude)),inv(add(q(1),mul(q(2),h))))
    require(c.at(pressure['initialInfinitePrefix'])==prefix and c.at(pressure['terminalInfiniteTail'])==tail,'native pressure exterior tail differs')
    expected_pressure=mul(q(Q(-1,2)),power(p('Pstar'),2),add(prefix,*integrals,tail))
    require(c.at(core['P0'])==expected_pressure,'native full A.21 pressure sum or factor differs')
    D=sub(q(Q(1,2)),h);d=sub(q(1),power(eta,2));L=sub(q(1),mul(q(2),h,power(eta,2)));Us=add(mul(q(4),eta),p('j0'));H=add(mul(D,eta),mul(d,Us))
    def zeta(x):
        dx=sub(q(1),power(x,2));lx=sub(q(1),mul(q(2),h,power(x,2)));ux=add(mul(q(4),x),p('j0'));hx=add(mul(D,x),mul(dx,ux))
        return neg(mul(lx,hx,inv(add(power(hx,2),power(p('sigmaStar'),2)))))
    for key,value in [('D',D),('d',d),('L',L),('Ustar',Us),('Hstar',H),('zeta',zeta(eta))]:require(c.at(core[key])==value,'native real amplitude input differs: '+key)
    psi=integral(zeta(('b',0)),q(),eta)
    require(c.at(core['psi'])==psi,'native g primitive, binder or integration constant differs')
    require(c.at(core['g'])==mul(exp(mul(p('Lambda'),psi)),inv(p('CSelected'))),'native amplitude normalization differs')
    return {'nativeFullPressureNode':core['P0'],'nativePositiveGNode':core['g'],
        'fixedDefinitionSHA256':definitions['fixed:null']['definitionSHA256'],'completeStageBindings':records,
        'all12StagesBothInfiniteTailsAndPressureFactorVerified':True,'gGradientPrimitiveAndCNormalizationVerified':True,
        'sourceNodeHashes':[{'sourceNode':i,'sha256':js_hash(n)} for i,n in sorted(c.read_nodes.items())],
        'independentSourceCanonicalWork':c.work}


def run(context,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    result={'schema':'MathScope.N6.OriginalPressureAmplitudeClockBridge/1','sourceParentSHA256':PARENT,
            'nativePressureEqualsLeanNewPressureProved':False,'nativeGEqualsLeanRealAmplitudeProved':False,
            'nativeB_rhoNormBoundProved':False,'allActualCallDomainsProved':False,'newClosedJets':0,
            'N6-01':'OPEN','N6-02':'PARTIAL'}
    try:
        pins=[]
        for name,digest in PINS.items():
            path=Path(context['repo'])/name;require(file_hash(path)==digest,'pinned source changed: '+name)
            pins.append({'path':name,'sha256':digest,'bytes':path.stat().st_size})
        with urllib.request.urlopen(FLAT_URL,timeout=30) as reply:flat=reply.read(20000)
        require(hashlib.sha256(flat).hexdigest()==FLAT_SHA,'original official FlatCutoff bytes changed')
        result['originalSourceBindings']=pins+[{'url':FLAT_URL,'sha256':FLAT_SHA,'bytes':len(flat)}]
        result['profileChecks']=source_profile_checks(source_parameters(context))
        result['clockDerivativeCertificates']=clock_derivative_certificates()
        result['terminalWaitProof']=terminal_theorem()
        checkpoint,previous,originals,program,source,definitions=validate_inputs(context)
        binding=native_bindings(source,definitions)
        evidence=write(out/'native-pressure-amplitude-source-bindings.json',binding)
        result['sourceNodeBindingEvidence']=evidence
        result.update(nativePressureEqualsLeanNewPressureProved=True,nativeGEqualsLeanRealAmplitudeProved=True,
            equalityScope='original intrinsic real pressure/g functions for every real eta; complete12 finite stages and both exterior tails, before arbitrary global field substitutions',
            proofRule='continuous equal logarithmic derivatives on every stage, equal value Pstar at clock0, exact endpoint transport, finite integral additivity and exact exponential tails; g uses the exact oriented substitution z=eta*t including eta<=0 and eta=0')
        result['remainingNormBridge']='All original native nonlinear coefficient semantics and full actual fixed-point input functions/remainders still require complete recurrence-to-selected-fixed-point equality before importing B_rho norm<=Q. No norm theorem or domain guard is promoted by this clock equality.'
    except Exception as error:
        result['preciseSourceBindingStop']={'type':type(error).__name__,'message':str(error)}
    write(out/'native-pressure-amplitude-clock-bridge.json',result)
    return result
