"""Independent exact analytic leaves for the ORIGINAL eta-Picard system.

No historical PASS flag is an input. Successful execution authenticates a
source inventory and replays exact implications, never accepts the whole N6.
Standard library only; read-only inherited SQLite keeps this audit bounded.
"""
from __future__ import annotations

import argparse
from collections import Counter
from fractions import Fraction as F
import hashlib
import json
from math import factorial
from pathlib import Path
import sqlite3
import sys
import time

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
sys.path.insert(0, str(REPO / 'research-ide/mathscope-m3/certification-20261014'))
from source_dag import definitions, primitive_children, verify_capture

HEADER_SHA = '010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'
DB_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'
PAPER_SHA = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
PROTOTYPE_SHA = 'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'


def file_sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sharp_step_polynomial(bound=8):
    """Symbolic cosh majorant, using x=t(1-t), 0<=x<=1/4.

    sigma'=g'/(2+exp(g)+exp(-g)); exp(g)+exp(-g)>=2+g².
    The cleared numerator of bound*(4+g²)-g' is
    4*bound*x^4+6*x²-(4*bound+2)*x+bound.
    Its derivative is increasing and strictly negative on [0,1/4].
    Thus one endpoint comparison proves the whole interval; no mesh used.
    """
    b = F(bound)
    require(b >= 0, 'Negative derivative upper bound')
    x = F(1, 4)
    endpoint = 4*b*x**4 + 6*x**2 - (4*b+2)*x + b
    derivative_upper = 16*b*x**3 + 12*x - (4*b+2)
    require(endpoint >= 0 and derivative_upper < 0,
            'The requested global step derivative bound is not proved')
    return {'bound': str(b), 'polynomialCoefficientsAscending':
            [str(b), str(-(4*b+2)), '6', '0', str(4*b)],
            'minimumAtOneQuarter': str(endpoint),
            'derivativeUpperOnWholeInterval': str(derivative_upper),
            'equalityAt': 't=1/2', 'finitePointSampleUsed': False}


def verify_mask(matrix, node):
    require(len(matrix) == 6 and all(len(row) == 6 for row in matrix),
            'Wrong original A1 matrix dimensions')
    z = {'op': 'rational', 'args': ['0', '1']}
    require(all(node(matrix[i][j]) == z for i in range(6) for j in range(6)
                if i < 4 or j >= 4), 'Original eta derivative block mask failed')
    return [(i+1, j+1, matrix[i][j]) for i in range(6) for j in range(6)
            if node(matrix[i][j]) != z]


def word_degree(word):
    require(all(x in (0, 1) for x in word), 'Unknown operator letter')
    if any(a == b == 1 for a, b in zip(word, word[1:])):
        return None  # A1 D A1=0, including every eta derivative of A1.
    return sum(word)


def tail_guard(A, loss, K, bits, eta_order=0, delta=None):
    """Exact sufficient inequalities for the analytic-scale Picard tail.

    This consumes norms as explicit hypotheses, never as source facts.
    It does not enumerate the astronomically large source truncation K.
    """
    A, loss = F(A), F(loss)
    require(A > 0 and 0 < loss <= 1 and isinstance(K, int) and K >= 1,
            'Invalid analytic tail domain')
    require(bits >= 1 and isinstance(eta_order, int) and eta_order >= 0,
            'Invalid precision or eta order')
    require(F(K) >= 72*A*A/loss,
            'K does not dominate actual matrix/source norms')
    require(F(9)*A*A/(2*loss*(K+1)) <= F(1,16),
            'Geometric 1/4 base is unavailable')
    if eta_order:
        require(delta is not None and 0 < F(delta) <= 1, 'Missing Cauchy strip')
        # log2(m!)<=m², log2(16/delta)<=4+2/delta.
        demand = F(bits + eta_order**2 + 4*eta_order) + 2*eta_order/F(delta)
    else:
        demand = F(bits)
    require(2*K >= demand, 'Eta derivative tail does not meet target precision')
    return {'A':str(A), 'loss':str(loss), 'K':K, 'bits':bits,
            'etaOrder':eta_order, 'normsSuppliedAsHypotheses':True,
            'tail':'(4^-K/3)*m!*(16/delta)^m <= 2^-bits',
            'allHigherKCoveredByMonotonicity':True}


def even_kernel_monomial(n, k):
    """Independent exact replay of the source k-fold even-X integral."""
    require(n >= 0 and k >= 0, 'Negative monomial or derivative degree')
    if k == 0:
        return F(1), F(1)
    if n < k:
        return F(0), F(0)
    rhs = F(factorial(2*n), factorial(2*n-2*k) * 2**k)
    for j in range(k):
        rhs /= 2*n-2*j-1
    lhs = F(factorial(n), factorial(n-k))
    return lhs, rhs


def exponent_implications(kappa=F(1,100000)):
    """Only exponent arithmetic of Prop9.5; every actual seminorm is open."""
    kappa = F(kappa)
    require(0 < kappa < F(1,100), 'Unadmitted primary radial derivative loss')
    H = 1-kappa
    rows = [
        ('primary-wave-linear',1-3*kappa,F(7,10)),
        ('primary-wave-nonlinear',1-kappa,F(7,10)),
        ('primary-auxiliary-mean-full-curl',F(3,2)-2*kappa,F(149,100)),
        ('temporal-new-tangential-residual',H+1-2*kappa,F(6,5)),
        ('five-map-new-defects-conservative',H+F(9,10)-2*kappa,F(6,5)),
        ('full-curl-remainder',1-kappa,F(68,100)),
        ('temporal-and-five-map-tangential-pressure',H,F(9,10)),
        ('induced-radial-mean',H+1,F(19,10)),
        ('mean-wave-interaction',H,F(7,10)),
    ]
    require(all(v >= lower for _,v,lower in rows), 'A required original exponent has no margin')
    return [{'id':name, 'provedExponentGivenActualClassInputs':str(v),
             'requiredExponent':str(lower), 'exactMargin':str(v-lower),
             'actualUniformSeminormProved':False} for name,v,lower in rows]


class SourceAudit:
    def __init__(self, node, xi, eta):
        self.node, self.xi, self.eta = node, xi, eta
        self.free_cache, self.parity_cache = {}, {}

    def free(self, ident):
        if ident in self.free_cache:
            return self.free_cache[ident]
        n = self.node(ident); a=n['args']; op=n['op']; out=set()
        if op == 'coordinate':
            out={ident}
        elif op == 'definite_integral':
            out=(self.free(a[0])-{a[1]}) | self.free(a[2]) | self.free(a[3])
        else:
            children=primitive_children(n)
            require(children is not None, 'Unreviewed free-coordinate operator '+str(ident))
            for j in children:
                out |= self.free(j)
        self.free_cache[ident]=out
        return out

    def parity(self, ident):
        if ident in self.parity_cache:
            return self.parity_cache[ident]
        n=self.node(ident); op=n['op']; a=n['args']
        if op == 'rational':
            value='Z' if int(a[0])==0 else 'E'
        elif op == 'coordinate':
            value='O' if ident==self.xi else 'E'
        elif op == 'source_parameter':
            value='E'
        elif op in ['add','smooth_piecewise']:
            terms=a if op=='add' else a[3:]
            parities={self.parity(j) for j in terms}-{'Z'}
            value='Z' if not parities else next(iter(parities)) if len(parities)==1 else '?'
            if op=='smooth_piecewise' and not all(self.parity(j) in ['E','Z'] for j in a[:3]):
                value='?'
        elif op == 'multiply':
            ps=[self.parity(j) for j in a]
            value='Z' if 'Z' in ps else '?' if '?' in ps else 'O' if ps.count('O')%2 else 'E'
        elif op == 'integer_power':
            p=self.parity(a[0]); value='E' if a[1]%2==0 and p!='?' else p
        elif op == 'inverse':
            value=self.parity(a[0])
        elif op in ['sqrt_positive','exp','log_positive','ceiling','source_step_derivative','cosine']:
            value='E' if self.parity(a[0]) in ['E','Z'] else '?'
        elif op == 'sine':
            value=self.parity(a[0])
        elif op == 'definite_integral':
            require(a[1]!=self.xi, 'Radial parity coordinate captured by integral binder')
            value='E' if all(self.parity(j) in ['E','Z'] for j in [a[0],a[2],a[3]]) else '?'
        elif op == 'actual_natural_series':
            value='E' if all(self.parity(j) in ['E','Z'] for j in a[1:3]) else '?'
        elif op in ['actual_quadratic_root','actual_monotone_root']:
            args=a[2:] if op=='actual_quadratic_root' else a[1:]
            value='E' if all(self.parity(j) in ['E','Z'] for j in args) else '?'
        else:
            value='?'
        self.parity_cache[ident]=value
        return value

    def verify_system_parity(self, system):
        signs=[1,1,1,1,-1,-1]
        rows=[]
        for name in ['A0','A1']:
            for i,row in enumerate(system[name]):
                for j,ident in enumerate(row):
                    expected='E' if -signs[i]*signs[j]==1 else 'O'
                    actual=self.parity(ident)
                    require(actual in ['Z',expected], 'Original system reflection parity failed '+str((name,i,j,ident,actual)))
                    rows.append({'matrix':name,'row':i+1,'column':j+1,'node':ident,'parity':actual})
        for i,ident in enumerate(system['forcing']):
            expected='O' if signs[i]==1 else 'E'; actual=self.parity(ident)
            require(actual in ['Z',expected], 'Original forcing reflection parity failed')
            rows.append({'forcingRow':i+1,'node':ident,'parity':actual})
        return rows

    def closure(self, roots):
        seen=set(); pending=list(roots)
        while pending:
            ident=pending.pop()
            if ident in seen:
                continue
            require(len(seen)<50000,'Bounded original coefficient inventory exceeded')
            n=self.node(ident); children=primitive_children(n)
            require(children is not None,'Unreviewed original coefficient operator '+str(ident))
            seen.add(ident); pending.extend(children)
        return seen


def run(artifacts, output):
    start=time.monotonic(); artifacts=Path(artifacts); output=Path(output)
    folder=artifacts/'mean-proof-inputs-38500114302/dag'
    header=folder/'header.json'; database=folder/'source-dag-checkpoint.sqlite'
    require(file_sha(header)==HEADER_SHA and file_sha(database)==DB_SHA,
            'Changed inherited original source header or SQLite')
    capture=verify_capture(REPO)
    prototype=REPO/'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'
    require(file_sha(prototype)==PROTOTYPE_SHA,'Changed original flat-step producer')
    paper=REPO/'research-ide/reference-documents/ns-primary-20261013/navier-stokes.pdf'
    require(file_sha(paper)==PAPER_SHA,'Changed original source paper')
    registry=definitions(json.loads(header.read_text(encoding='utf8')))
    system=registry['picard'][0]
    require(system['name']=='ActualSameN3OrderOneInner' and system['xi']==25516 and system['eta']==2,
            'Different original eta-Picard source')
    require(system['diagonal']==[0,0,2,0,3,1] and system['zeroAxisDatum']==[0]*6,
            'Changed original singular equation')
    db=sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True); cache={}
    def node(ident):
        require(type(ident) is int and ident>=0, 'Metadata used as scalar node')
        if ident not in cache:
            row=db.execute('SELECT raw FROM nodes WHERE id=?',(ident,)).fetchone()
            require(row is not None,'Missing original coefficient source '+str(ident))
            cache[ident]=json.loads(row[0])
        return cache[ident]
    mask=verify_mask(system['A1'],node); audit=SourceAudit(node,system['xi'],system['eta'])
    # The natural kernel is fixed before the new xi coordinate. Its internal
    # coefficient inputs must not acquire a hidden xi capture behind equal
    # external natural arguments.
    core=registry['fixed']['core']
    require(all(system['xi'] not in audit.free(i) for key,i in core.items() if key!='Y'),
            'Hidden radial capture in the original natural kernel inputs')
    parity=audit.verify_system_parity(system)
    closures={name:audit.closure(sum(system[name],[]) if name in ['A0','A1'] else system[name])
              for name in ['A0','A1','forcing']}
    whole=set.union(*closures.values()); steps=[]; guards=[]; naturals=[]
    for ident in sorted(whole):
        n=node(ident); op=n['op']; a=n['args']
        if op=='source_step_derivative':
            steps.append({'node':ident,'argument':a[0],'order':a[1],
                          'argumentFreeCoordinates':sorted(audit.free(a[0])),
                          'argumentDependsOnEta':system['eta'] in audit.free(a[0])})
        elif op in ['inverse','log_positive','sqrt_positive']:
            guards.append({'node':ident,'operation':op,'argument':a[0],
                           'etaDependent':system['eta'] in audit.free(ident),
                           'argumentNode':node(a[0]),'actualUniformDomainProvedByThisAudit':False})
        elif op=='actual_natural_series':
            naturals.append({'node':ident,'component':a[0],'Y':a[1],'eta':a[2],
                             'radialOrder':a[3],'etaOrder':a[4],
                             'YFreeCoordinates':sorted(audit.free(a[1])),
                             'actualBranchDomainProvedByThisAudit':False})
    selectors=[{'node':i,'selector':node(i)['args'][:3],
                'etaDependent':any(system['eta'] in audit.free(j) for j in node(i)['args'][:3])}
               for i in sorted(whole) if node(i)['op']=='smooth_piecewise']
    require(not any(s['argumentDependsOnEta'] for s in steps), 'Actual eta-dependent flat step discovered')
    require(not any(s['etaDependent'] for s in selectors), 'Actual eta-dependent branch selector discovered')
    require(not any(node(i)['op']=='actual_quadratic_root' for i in whole),
            'Unexpected implicit quadratic in original order-one coefficient closure')
    # Authenticate the exact selected local natural/quadratic gates without
    # importing their historical acceptance labels as proofs.
    require(node(4483)=={'op':'actual_natural_series','args':['average',474,2,0,0]}
            and node(474)=={'op':'rational','args':['4','1']}, 'Changed selected natural source')
    require(node(5029)=={'op':'actual_quadratic_root','args':[0,4,2]}, 'Changed selected quadratic source')
    step=sharp_step_polynomial(); exponents=exponent_implications()
    finite_kernel=[]
    for n in range(21):
        for k in range(1,11):
            lhs,rhs=even_kernel_monomial(n,k); require(lhs==rhs,'Even-X identity failed')
            finite_kernel.append({'n':n,'k':k,'coefficient':str(lhs)})
    rows=[[i,node(i)] for i in sorted(whole)]
    result={'schema':'MathScope.N6.IndependentAnalyticPrerequisites/1',
      'source':{'paperSHA256':PAPER_SHA,'headerSHA256':HEADER_SHA,'sourceDAGSQLiteSHA256':DB_SHA,
                'capture':capture,'system':system,'coefficientClosureSHA256':hashlib.sha256(canonical(rows).encode()).hexdigest()},
      'sharpOriginalFlatStep':{'status':'PROVED_CLASSICALLY','globalRealDerivativeEnclosure':['0','8'],
                              'exactProofReplay':step,'boundNineUsedByOriginalPicardMajorantIndependentlyDischarged':True,
                              'allComposedSourceArgumentsSmoothClaimed':False},
      'etaPicardStructure':{'status':'SOURCE_BOUND_EXACT_STRUCTURE', 'nonzeroA1Entries':mask,
          'diagonal':[0,0,2,0,3,1], 'maximumEtaDerivativesPerNonzeroWord':'ceil(k/2)',
          'proofAllWordLengths':'Adjacent A1 D A1 and A1 D partial_eta(A1) vanish since every such matrix maps V=span(e1..e4) to U=span(e5,e6), kills U, and D preserves both. Nonzero words have no adjacent derivative factors; induction gives ceil(k/2).',
          'equationIsEtaTransportPDE':True,'genericSixDimensionalODEUsed':False,
          'A0A1ForcingReflectionParityRows':parity,
          'sourceCoefficientReflectionSymmetryProvedAsFormulaIdentity':True,
          'solutionEvennessRequiresExistenceAndUniqueness':True,
          'actualCoefficientNormEnclosureProved':False,'actualCommonHolomorphicStripProved':False},
      'originalCoefficientInventory':{
          'perGroup':{name:{'nodeCount':len(ids),'operatorCounts':dict(Counter(node(i)['op'] for i in ids))} for name,ids in closures.items()},
          'unionNodeCount':len(whole),'flatStepCalls':steps,'piecewiseSelectors':selectors,
          'etaDependentFlatStepCalls':0,'etaDependentPiecewiseSelectors':0,
          'originalNaturalFixedInputsHaveNoXiCapture':True,
          'quadraticRootsInOrderOneCoefficientClosure':0,'naturalCalls':naturals,
          'domainGuards':guards,'etaDependentDomainGuardNodes':[g['node'] for g in guards if g['etaDependent']],
          'selectedNatural4483':node(4483),'selectedQuadratic5029':node(5029),
          'absenceOfEtaStepObstructionDoesNotProveHolomorphy':True},
      'evenXKernel':{'status':'ALL_FIXED_ORDER_CLASSICAL_IDENTITY',
          'identity':'d_X^k f(sqrt X)=2^-k integral_[0,1]^k product_j t_j^(2(k-1-j))*f^(2k)(sqrt X product_j t_j) dt',
          'premise':'f is even C-infinity on one reflected real collar',
          'proof':'For k=1 use fprime(0)=0 and FTC. Differentiate under the compact integral and apply the same identity to the even f^(2k); induction supplies the displayed weights. All derivatives are bounded on one compact collar for each fixed k. The same formula gives the continuous X=0 value. This is an induction for arbitrary k, not extrapolation from the finite controls.',
          'sourceImplementation':'actual-continuation-exact-functions.mjs:materializePicardEvenDerivative',
          'finiteMonomialIndependentControls':finite_kernel,
          'actualEvenSmoothSolutionExistenceProvedByThisAudit':False},
      'picardTailTheorem':{'status':'PROVED_WITH_EXPLICIT_FUNCTIONAL_HYPOTHESES',
          'premises':['A0,A1,f bounded holomorphic on S_rho uniformly on 0<=xi<=a',
                      'positive loss Delta<=1, C>=2 max(1,||A0||,||A1||,||f||)',
                      'original A1 derivative block and eta-independent diagonal Green kernels'],
          'termBound':'(C*a)^(k+1)/(k+1)! * max(1,ceil(k/2)/Delta)^ceil(k/2)',
          'allLengthProof':'Split the Cauchy loss among at most ceil(k/2) derivatives; bound each analytic differential operator before composing. This retains Leibniz coefficient derivatives. At most 2^k words are absorbed by C. Ordered radial integrals have simplex volume a^(k+1)/(k+1)!. Factorial >=((k+1)/3)^(k+1) gives geometric 1/4 for k>=72(Ca)^2/Delta. The kth root tends to zero even without that quantitative threshold, proving convergence and uniqueness on every finite a.',
          'termwiseEtaDifferentiation':'Use Cauchy on a strictly smaller strip. Uniform value convergence on the larger strip gives uniform convergence of each fixed eta derivative on the smaller strip.',
          'sourceTailConditionNodes':system['tail'],
          'actualSourceNormHypothesesDischarged':False},
      'prop95ExponentImplications':exponents,
      'remainingObligations':[
        {'id':'PICARD0-ACTUAL-NATURAL-ACTIVE-DOMAIN','equations':['5.7','5.8','B.26'],
         'sourceNodes':[25601,25638,25637,26393],
         'minimalLemma':'For every active branch and integration path on 0<=X<=Xa exp(t1/16), every actual natural Y stays in its proved common complex domain and each of the 11 eta-dependent inverse operands and one logarithm operand stays uniformly away from zero. Then provide actual A0/A1/f <=C1/2 on S_delta/4, including pressure primitives.', 'status':'OPEN'},
        {'id':'PROP95-ALL-PRIMARY-CLASS-NORMS','equations':['6.24','6.25','6.29','9.11','9.8','9.9'],
         'sourceNodes':[3825006,3825007,3825008],
         'minimalLemma':'For every fixed multiindex I, the literal original primary/full-curl grouped wave coefficients satisfy fixed C_I,b_I,d_I uniformly over all original bands, labels, copies, points and common-torus supports; use stable dissipative pulse estimates and actual covariance positivity.', 'status':'OPEN'},
        {'id':'PROP95-FULL-MEAN-DEFECT-CLASS-NORMS','equations':['8.12','8.20','8.25','8.26','8.27','9.8'],
         'sourceNodes':[3614976,3615392,3615055,3615101,3615147,3615361],
         'minimalLemma':'Bind complete current seminorms and full pressure at each of three original update states; retain nonlinear remainders, all Fourier/Gaussian/flat/cutoff tails and source operator derivative demands. The exact exponent margins above only apply after these norms exist.', 'status':'OPEN'},
        {'id':'PROP95-WHOLE-HAAR-MOMENTS','equations':['9.10'],
         'sourceNodes':[3614735,3614752],
         'minimalLemma':'Full temporal increment has zero auxiliary mean after exact T1/A1 reconstruction; justify whole tuple common-Haar/radial Fubini, support and tail limits, then propagate the two exact moments. Fixed five-bump homogeneous rows alone suffice only for that increment.', 'status':'OPEN'}],
      'scope':{'storedPassFlagsUsedAsProof':False,'finiteSamplePromotedToAllOrders':False,
               'originalN601Complete':False,'originalN602Complete':False,'original56of64Changed':False,
               'newLeanKernelProof':False},'elapsedSeconds':time.monotonic()-start}
    db.close(); output.mkdir(parents=True,exist_ok=True)
    (output/'analytic-prerequisites-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'schema':result['schema'],'sourceCoefficientNodes':len(whole),
                     'sharpFlatStepBound':8,'etaDependentFlatStepCalls':0,
                     'sourceParityRows':len(parity),'actualCommonHolomorphicStripProved':False,
                     'originalN601Complete':False,'originalN602Complete':False}))
    return result


if __name__ == '__main__':
    p=argparse.ArgumentParser(); p.add_argument('--artifacts',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path); args=p.parse_args()
    run(args.artifacts,args.output)
