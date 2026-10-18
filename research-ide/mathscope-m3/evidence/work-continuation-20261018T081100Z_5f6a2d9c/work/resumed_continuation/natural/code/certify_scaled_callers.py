#!/usr/bin/env python3
"""New exact caller enclosures for original natural scalar subexpressions.

No native call is relabelled as a complete arbitrary-precision evaluator.
Only the finite degree-one materializer, small source scan, exact rational
tail, and original scalar normalizations are used.
"""
from fractions import Fraction as F
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
import copy, gzip, json

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1]
HEADER = ROOT/'recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
CLOSURE = ROOT/'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
SOURCE = ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
M2 = ROOT/'recovered/base/work/n602_continuation/source/research-ide/mathscope-m2/navier'
PINS = {
    HEADER: 'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',
    CLOSURE: '2cbb5c74eb58ef82f948a19bad00a299c38b802cb8e668e94da8e34a37f77e91',
    SOURCE: '42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3',
    M2/'actual-continuation-exact-core.mjs': 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
    M2/'actual-continuation-exact-tail.mjs': 'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
}

def pin(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size}

def registry(header):
    result = {}
    def walk(d):
        for k,v in d.items():
            if k == 'base': walk(v)
            elif isinstance(v,str):
                try: result[k] = json.loads(v)
                except json.JSONDecodeError: pass
    walk(header['definitions'])
    return result

def assert_parameter_binding(p):
    expected = {
      'Md': {'integer':1048576},
      'T': {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
      'h': {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},
      'j0': {'power':[{'ref':'h'},4]},
      'sigmaStar': {'quotient':[{'ref':'j0'},{'integer':2000}]},
      'rho': {'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},
      'K': {'power':[{'ref':'Pstar'},2]},
      'Pstar': {'exp':{'ref':'logP'}},
      'logP': {'product':[{'integer':2},{'ref':'T'}]},
      'Q': {'quotient':[{'product':[{'integer':str(2**260)},{'ref':'K'}]},{'power':[{'ref':'sigmaStar'},2]}]},
      'Lambda': {'power':[{'ref':'Q'},64]},
      'logCSelected': {'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]},
      'BRefUpper': {'power':[{'ref':'Q'},300]},
      'CSelected': {'exp':{'ref':'logCSelected'}},
      't1': {'power':[{'ref':'CSelected'},-120]},
      'Xa': {'quotient':[{'integer':4},{'ref':'Lambda'}]},
    }
    for k,v in expected.items():
        if p[k] != v: raise ValueError('Changed source parameter: '+k)

def tail_zero(Y,m):
    """The original complete B_rho positive tail after degree zero, k=0."""
    if not isinstance(Y,F) or not 0<=Y<=5 or not isinstance(m,int) or not 0<=m<=5:
        raise ValueError('Tail scope')
    r = Y/F(20)*F(2+m,2)
    if r >= 1: raise ValueError('Ratio does not contract')
    first = F(factorial(m)*comb(1+m,m), (m+1)**2*20*4)*Y
    return first, r, first/(1-r)

class Certificate:
    def __init__(self):
        for path,expected in PINS.items():
            if pin(path)['sha256'] != expected: raise ValueError('Input hash changed: '+str(path))
        self.header=json.loads(HEADER.read_text()); self.fixed=registry(self.header)['fixed']
        self.nodes={int(k):v for k,v in json.loads(CLOSURE.read_text())['records'].items()}
        self.degree=json.loads((OUT/'evidence/ACTUAL_DEGREE_ONE.json').read_text())
        assert_parameter_binding(self.fixed['source']['parametersExactExpressions'])
        assert self.degree['rootFields']==self.fixed['core']
        assert self.degree['coefficients']['Phi'][0]==1
        assert self.degree['coefficients']['u'][0]==self.degree['coefficients']['average'][0]==0
        assert self.degree['nodes'][0]=={'op':'rational','args':['0','1']}
        assert self.degree['nodes'][1]=={'op':'rational','args':['1','1']}
        # The coefficient materializer and authenticated original registry have
        # exactly the same complete pressure/g/core prefix before they branch.
        max_needed=max(81135,len(self.degree['nodes'])-1)
        self.raw={}
        with gzip.open(SOURCE,'rb') as f:
            h=f.readline()
            assert h.rstrip(b'\r\n')==HEADER.read_bytes().rstrip(b'\r\n')
            for line in f:
                i,n=json.loads(line)
                if i>max_needed: break
                self.raw[i]=n
        for i in range(3612): assert self.raw[i]==self.degree['nodes'][i]
        # Directly check the new Phi_1 expression, rather than inferring its
        # formula from a filename or from the materializer's prose metadata.
        phi_one_nodes={
          1953:('inverse',[28]), 847:('rational',['1','4']),
          3500:('multiply',[1192,3459]), 3501:('multiply',[20,3500]),
          3502:('add',[1,3501]), 1192:('multiply',[2,24]),
          3613:('multiply',[9,3502]),3614:('add',[3467,3613]),
          3615:('multiply',[1953,3614]),3624:('multiply',[20,3472]),
          3625:('multiply',[3457,3615]),3626:('add',[3624,3625]),
          3627:('multiply',[847,3626]),
        }
        for i,(op,args) in phi_one_nodes.items():
            assert self.degree['nodes'][i]=={'op':op,'args':args}
        assert self.degree['coefficients']['Phi'][1]==3627
        for i,n in self.nodes.items():
            if i<=max_needed: assert self.raw[i]==n
        exact={
          2:('coordinate',['eta']), 3454:('source_parameter',['Lambda']),
          3457:('inverse',[3454]), 3617:('source_parameter',['Xa']),
          3612:('source_parameter',['t1']), 3623:('exp',[3612]),
          3624:('multiply',[3617,3623]), 3628:('multiply',[3454,3624]),
          474:('rational',['4','1']), 3494:('definite_integral',[3493,3476,0,2]),
          3495:('multiply',[3454,3494]), 3496:('exp',[3495]),
          3497:('inverse',[3456]), 3498:('multiply',[3496,3497]),
        }
        for i,(op,args) in exact.items(): assert self.nodes[i]=={'op':op,'args':args}
        self.bound={}
        for i,n in self.nodes.items():
            if n['op']!='multiply': continue
            for scale in [3457,3498]:
                if scale not in n['args']: continue
                a=next((v for v in n['args'] if v!=scale),None)
                natural=self.nodes.get(a,{})
                if natural.get('op')!='actual_natural_series': continue
                comp,Y,eta,k,m=natural['args']
                if Y not in [474,3628] or eta!=2 or k!=0 or not 0<=m<=5: continue
                if scale==3457 and comp not in ['u','average']: continue
                if scale==3498 and comp!='Phi': continue
                self.bound[i]={'sourceNode':i,'naturalNode':a,'component':comp,'YNode':Y,'etaNode':eta,'radialOrder':k,'etaOrder':m,'scaleNode':scale}
        assert len(self.bound)==33

    def enclose(self,node,eta=(F(-1),F(1)),bits=4096):
        if node not in self.bound: raise ValueError('Not a bound original normalized scalar')
        if len(eta)!=2 or any(type(x) is not F for x in eta) or not -1<=eta[0]<=eta[1]<=1:
            raise ValueError('Need a certified eta interval within [-1,1]')
        if type(bits) is not int or not 1<=bits<=4096: raise ValueError('Certified precision range')
        call=self.bound[node];m=call['etaOrder'];Y=F(4) if call['YNode']==474 else F(5)
        first,ratio,tail=tail_zero(Y,m)
        # Q>2^260, rho^-1<Q, Lambda=Q^64; every exponent is negative.
        exponent=m-(63 if call['scaleNode']==3457 else 198)
        complete_tail=tail*F(1,2**(-260*exponent))
        finite_term=F(1,2**(199*260)) if call['scaleNode']==3498 and m==0 else F(0)
        eps=F(1,2**bits)
        assert complete_tail+finite_term<eps
        return {**call,'etaDomain':[str(eta[0]),str(eta[1])],
          'YEnclosure':['4','5'] if call['YNode']==3628 else ['4','4'],
          'degree':0,'actualFiniteCoefficient':'1' if call['component']=='Phi' and m==0 else '0',
          'finiteCoefficientRoundingError':'0',
          'scaledFiniteTermEnclosure':['0','2^-51740'] if finite_term else ['0','0'],
          'tailFirstRational':str(first),'tailRatioUpper':str(ratio),'tailRational':str(tail),
          'originalTailScale':'Q*rho^(-m)',
          'afterOriginalNormalizationUpper':f'({tail})*Q^({exponent})',
          'dyadicTailUpper':{'coefficient':str(tail),'powerOfTwo':260*exponent},
          'absoluteEnclosure':{'lower':str(-eps),'upper':str(eps),'notation':[f'-2^-{bits}',f'2^-{bits}']},
          'status':'CERTIFIED_NORMALIZED_SCALAR_ENCLOSURE_ON_STATED_FORMAL_DOMAIN',
          'unscaledNativeKernelComplete':False}

def main():
    cert=Certificate()
    outputs=[cert.enclose(i) for i in sorted(cert.bound)]
    original=json.loads((ROOT/'work/prune_recovery/ORIGINAL_138_CROSSWALK.json').read_text())['rows']
    original_ids={r['sourceNodeId']:r['originalLedgerIndex'] for r in original}
    for o in outputs: o['original138LedgerIndex']=original_ids.get(o['naturalNode'])
    # Nonzero original finite coefficient, independently enclosed uniformly.
    # |r1|<13, 0<=chi<=1, Lambda>2^16640 imply this interval.
    eps=F(1,2**4096)
    assert F(13,4*2**16640)<eps
    phi1={'materializedCoefficientNode':cert.degree['coefficients']['Phi'][1],
      'nodeNamespace':'new actual degree-one coefficient materialization; not raw original node IDs',
      'formula':'(-chi + Lambda^-1*L^-1*(Wstar+h*(1-2*eta*Ustar)))/4',
      'sourceCoreRootFieldsExactlyEqual':True,'rawPrefixNodesExactlyEqual':3612,
      'r1AbsoluteUpper':'13','chiEnclosure':['0','1'],
      'enclosure':{'notation':['-1/4-2^-4096','2^-4096'],'lower':str(-F(1,4)-eps),'upper':str(eps)},
      'etaDomain':['-1','1'],'finiteCoefficientNumericallyEnclosed':True,
      'nonzeroFiniteCoefficientEnclosureUsedForDegreeZeroCallers':False}
    # This compares the available *upper-bound certificate*, not true error.
    # Q > 2^(260+64020), while the first-tail coefficient at N=10000,Y=4
    # is 1/(5^10001*10002^2). Its product already exceeds one.
    assert 2**64280 > 5**10001 * 10002**2
    negative=[]
    for label,fn in [
      ('unscaled native rejected',lambda:cert.enclose(3631)),
      ('eta outside original domain rejected',lambda:cert.enclose(3632,(F(-1),F(2)))),
      ('floating endpoint rejected',lambda:cert.enclose(3632,(-1.0,1.0))),
      ('unsupported radial derivative rejected',lambda:cert.enclose(3692)),
      ('source tail ratio boundary rejected',lambda:tail_zero(F(5),6)),
    ]:
        try:fn()
        except (ValueError,AssertionError):negative.append({'control':label,'pass':True})
        else:raise AssertionError(label)
    changed=copy.deepcopy(cert.fixed['source']['parametersExactExpressions']);changed['Lambda']={'power':[{'ref':'Q'},1]}
    try:assert_parameter_binding(changed)
    except ValueError:negative.append({'control':'different normalization parameter rejected','pass':True})
    else:raise AssertionError('normalization mutation accepted')
    result={
      'schema':'MathScope.ResumedNaturalOriginalScaledCallerEnclosures/1',
      'inputs':[pin(p) for p in [HEADER,CLOSURE,SOURCE,M2/'actual-continuation-exact-core.mjs',M2/'actual-continuation-exact-tail.mjs',OUT/'evidence/ACTUAL_DEGREE_ONE.json']],
      'sourceParameterExpressionSHA256':cert.fixed['source']['parameterExpressionSHA256'],
      'authentication':{'wholeCompressedSourceSHA256Verified':True,'rawHeaderBytesExactlyEqual':True,'corePrefixRecordCount':3612,'rawOriginalProducerExecuted':False},
      'degreeOneActualPhiCoefficient':phi1,
      'domainProof':{'eta':'original formal coordinate node 2, restricted to [-1,1]; no later global chart substitution is silently certified',
          'radialNode474':'exact rational 4',
          'radialNode3628':'Lambda*Xa*exp(t1)=4*exp(t1)',
          'upperProof':['Q>2^260>2','log(CSelected)>=Q^200>1','0<t1=CSelected^-120<exp(-120)<1/8','exp(t1)<=1/(1-t1)<8/7','4*exp(t1)<32/7<5'],
          'derivedCallerDomain':'Y in [4,5], eta in [-1,1]'},
      'scaleProof':{
          'Q':'2^260*K/sigmaStar^2 > 2^260',
          'rhoInverse':'2^16/sigmaStar^2 < Q since K=exp(4T)>1',
          'inverseLambda':'Q^-64, exactly the original node 3457',
          'gUpper':['0<sigmaStar<1; 0<L<=1 on eta in [-1,1]','|zeta|=L*|Hstar|/(Hstar^2+sigmaStar^2)<=1/(2*sigmaStar)','|psi|<=1/(2*sigmaStar)<Q/2','log(g)=Q^64*psi-log(CSelected)<=Q^65/2-Q^200<=-Q^199','g<=exp(-Q^199)<Q^-199'],
          'gDerivativeWarning':'g*d_eta^m(Phi) is enclosed; this is not d_eta^m(g*Phi).'},
      'normalizedScalarCount':len(outputs),'outputs':outputs,
      'negativeControls':negative,
      'unscaledBlockingInequality':{
          'required':'finite-coefficient enclosure error + Q*rho^-m*t_N(Y,k,m) <= 2^-bits',
          'actualSourcePoint':'Y=4 (node474), k=m=0',
          'availableFiniteCoefficientProducerMaximumDegree':64,
          'availableTailRoutineMaximumDegree':10000,
          'atMaximumTailDegree':'Q*t_10000 >= Q/(5^10001*10002^2) > 2^64280/(5^10001*10002^2) > 1',
          'integerComparisonVerified':True,
          'interpretation':'The retained norm-tail certificate cannot certify small unscaled error at this budget. This is not a lower bound on the actual truncation error.',
          'additionalRequirements':['Sharper source-bound natural coefficient/tail estimates or an executable higher-degree original recurrence','Certified pressure P0 and eta derivatives in nonzero u coefficients','Actual global caller eta/chart domains and all remaining factors and derivatives']},
      'all138WholeKernelsRemainOpen':True,'newM3Closures':0,'N706_closed':False,'N805_closed':False,
    }
    (OUT/'evidence/SCALED_CALLER_CERTIFICATES.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'normalizedScalarCount':len(outputs),'original138CallsRepresented':len({o['naturalNode'] for o in outputs if o['original138LedgerIndex'] is not None}),'finiteNonzeroPhiCoefficientEnclosed':True,'controlsPassed':len(negative),'newM3Closures':0}))

if __name__=='__main__':main()
