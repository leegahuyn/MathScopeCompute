#!/usr/bin/env python3
"""NEW RECOVERY implementation; not a recovery of the lost implementation bytes.

Read-only source binding, exact rational enclosure adapters, and finite indexed
derivative recipes. A recipe is not a numerical enclosure. No private source
seal is reconstructed and no original acceptance row is closed here.
"""
from __future__ import annotations
from collections import Counter, defaultdict
from dataclasses import dataclass
from fractions import Fraction as F
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1]
HEADER = ROOT / 'recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
CLOSURE = ROOT / 'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
M2 = ROOT / 'recovered/base/work/n602_continuation/source/research-ide/mathscope-m2/navier'
M3 = ROOT / 'recovered/base/work/remaining_chain/source'
PROOFS = ROOT / 'recovered/base/analysis/base/PR30-recovery-handoff/angular-proof/inputs'
EXPECTED_HEADER_SHA256='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
EXPECTED_CLOSURE_SHA256='2cbb5c74eb58ef82f948a19bad00a299c38b802cb8e668e94da8e34a37f77e91'

class Unresolved(RuntimeError): pass

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()

def digest(value): return sha256(canonical(value)).hexdigest()
def pin(path): return {'path':str(path.relative_to(ROOT)), 'sha256':sha256(path.read_bytes()).hexdigest(), 'bytes':path.stat().st_size}
def qstr(value): return str(F(value))
def write(name, value):
    path=OUT/'evidence'/name
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')
    return path

@dataclass(frozen=True)
class Interval:
    lo: F
    hi: F
    def __post_init__(self):
        if any(type(x) not in (int,str,F) for x in (self.lo,self.hi)):raise Unresolved('exact rational endpoint required; floats are not enclosures')
        object.__setattr__(self,'lo',F(self.lo)); object.__setattr__(self,'hi',F(self.hi))
        if self.lo>self.hi: raise Unresolved('reversed interval')
    @classmethod
    def point(cls, x): return cls(F(x),F(x))
    def data(self): return [qstr(self.lo),qstr(self.hi)]

def require_integer(x, lo=0, hi=128):
    if type(x) is not int or not lo <= x <= hi: raise Unresolved('integer/order outside supported scope')

def bound_environment(formals, arguments):
    """Only already evaluated caller arguments enter this simultaneous binding."""
    if len(formals)!=len(arguments) or len(set(formals))!=len(formals): raise Unresolved('formal binder arity/uniqueness')
    if any(type(x) is not int for x in formals): raise Unresolved('invalid formal coordinate')
    if any(not isinstance(x,Interval) for x in arguments): raise Unresolved('argument is not a certified interval')
    return dict(zip(formals,arguments))

def guard_status(guards, env, evaluate):
    """Outside is zero before any singular local body; a crossing is unresolved.

    Last source guard was wrapped last and is therefore tested first. evaluate
    must be a source-bound outward interval evaluator; arbitrary sampled values
    are not acceptable. This module does not supply that evaluator.
    """
    for coordinate,left,right in reversed(guards):
        x,a,b=(evaluate(n,env) for n in (coordinate,left,right))
        if any(not isinstance(v,Interval) for v in (x,a,b)): raise Unresolved('uncertified guard operand')
        if a.hi>=b.lo: raise Unresolved('guard endpoints not strictly ordered')
        if x.hi<=a.lo or x.lo>=b.hi: return 'zero'
        if not (a.hi<x.lo and x.hi<b.lo): raise Unresolved('guard interval crosses a source boundary')
    return 'active'

def guarded_evaluate(guards,env,evaluate,body_evaluate):
    if guard_status(guards,env,evaluate)=='zero':return Interval.point(0)
    value=body_evaluate(env)
    if not isinstance(value,Interval):raise Unresolved('local body returned an uncertified value')
    return value

class SourceBindings:
    def __init__(self):
        if pin(HEADER)['sha256']!=EXPECTED_HEADER_SHA256:raise Unresolved('original header byte pin mismatch')
        if pin(CLOSURE)['sha256']!=EXPECTED_CLOSURE_SHA256:raise Unresolved('reviewed authenticated closure byte pin mismatch')
        self.header=json.loads(HEADER.read_text()); self.closure=json.loads(CLOSURE.read_text())
        self.nodes={int(k):v for k,v in self.closure['records'].items()}
        if self.closure.get('source_header_sha256')!=pin(HEADER)['sha256']: raise Unresolved('header authentication mismatch')
        self.registry={}
        def unpack(d):
            for k,v in d.items():
                if k=='base': unpack(v)
                elif isinstance(v,str):
                    try:self.registry[k]=json.loads(v)
                    except json.JSONDecodeError:pass
        unpack(self.header['definitions'])
        self.fixed=self.registry['fixed']
        if self.fixed['source']['parameterExpressionSHA256']!='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152': raise Unresolved('different source family')

    def definition(self,node):
        op,a=node['op'],node['args']
        groups={'actual_expression_partial':'expression','actual_monotone_root':'monotone','actual_quadratic_root':'quadratic',
                'actual_background_even_profile':'picard','actual_background_picard':'picard','m3_aux_expression_partial':'expressionDefinitions',
                'm3_aux_indexed_partial':'fieldDefinitions','m3_aux_inverse_partial':'inverseDefinitions','m3_global_indexed_partial':'m3GlobalFields'}
        if op in groups:
            key=groups[op]; i=-1-a[0] if op=='m3_aux_expression_partial' else a[0]
            if type(i) is not int or not 0<=i<len(self.registry[key]): raise Unresolved('unknown native system')
            return key+':'+str(i),self.registry[key][i]
        outer={'m3_coupled_expression_partial':0,'m3_coupled_indexed_partial':1,'m3_coupled_inverse_partial':2,'m3_forced_pulse_partial':3,'m3_forced_expression_partial':4}
        if op in outer:
            g=outer[op]
            if op=='m3_forced_pulse_partial':i=a[0]
            else:
                prefixes={0:'coupled-expression',1:'coupled-field',2:'coupled-inverse',4:'forced-expression'}
                if not isinstance(a[0],str) or not re.fullmatch(re.escape(prefixes[g])+r':(0|[1-9][0-9]*)',a[0]):raise Unresolved('wrong native namespace or malformed index')
                i=int(a[0].rsplit(':',1)[-1])
            if type(i) is not int or not 0<=i<len(self.registry['definitions'][g]):raise Unresolved('unknown outer native system')
            d=self.registry['definitions'][g][i]
            if op!='m3_forced_pulse_partial' and d.get('id')!=a[0]:raise Unresolved('outer definition ID mismatch')
            return 'definitions:'+str(g)+':'+str(i),d
        if op=='actual_natural_series': return 'fixed',self.fixed
        if op=='actual_covariance_volterra':
            matches=[d for d in self.registry['m3GlobalPulses'] if d['covariance']==a[0]]
            if len(matches)!=1: raise Unresolved('covariance registry ambiguity')
            return 'covariance:'+str(a[0]),matches[0]
        return None,None

    def quadratic_constants(self,system):
        require_integer(system,0,2);s=self.registry['quadratic'][system];p=s['proof']
        radius=F(p['radius']);q=F(p['lipschitzUpper']);beta=F(p['preconditionedIncomingUpper']) if system==0 else F(1,2**441)
        image=F(p.get('mapImageUpper',p.get('imageUpper')))
        if not (0<=q<F(1,4) and 0<beta and image<radius and beta/(1-q)<radius): raise Unresolved('original contraction arithmetic failed')
        return s, beta,q,radius,image

    def quadratic_enclosure(self,node_id,eta:Interval):
        """Uniform source-domain value bound, including beta/(1-q) roundoff-free.

        eta must be obtained for the actual argument in its lexical scope. This
        is a source theorem enclosure, not an evaluation of the moment RHS.
        """
        n=self.nodes[node_id]
        if n['op']!='actual_quadratic_root': raise Unresolved('not a quadratic call')
        system,component,eta_node=n['args'];s,beta,q,radius,_=self.quadratic_constants(system)
        require_integer(component,0,len(s['rhs'])-1)
        if not isinstance(eta,Interval) or eta.lo < -1 or eta.hi > 1: raise Unresolved('quadratic eta outside original [-1,1] proof')
        e=beta/(1-q)
        return Interval(-e,e)

    def natural_enclosure_plan(self,node_id,Y:Interval,eta:Interval):
        n=self.nodes[node_id]
        if n['op']!='actual_natural_series':raise Unresolved('not natural series')
        component,_,_,k,m=n['args']
        if component not in {'Phi','u','average'}:raise Unresolved('unknown natural component')
        if not isinstance(Y,Interval) or Y.lo<0 or Y.hi>5:raise Unresolved('natural Y outside [0,5]')
        if not isinstance(eta,Interval) or eta.lo < -1 or eta.hi>1:raise Unresolved('natural eta outside source [-1,1]')
        return natural_norm_majorant(k,m)

    def picard_core_enclosure_plan(self,node_id,lambdaX:Interval,eta:Interval):
        """Same actual Picard0 only on the analytic core, Lambda X in [0,4].

        lambdaX must enclose the actual source Lambda times the call argument.
        The smooth activation collar requires its own ordinary radial derivative
        recurrence; the natural Y5 extension is not substituted there.
        """
        n=self.nodes[node_id]
        if n['op']!='actual_background_even_profile':raise Unresolved('not even Picard profile')
        system,component,_,_,k,m=n['args']
        if system!=0:raise Unresolved('Picard0 proof cannot certify another system')
        require_integer(component,0,3);require_integer(k,0,4);require_integer(m,0,8)
        if not isinstance(lambdaX,Interval) or lambdaX.lo<0 or lambdaX.hi>4:raise Unresolved('actual analytic-core agreement not proved; smooth collar has separate radial rules')
        if not isinstance(eta,Interval) or eta.lo < -1 or eta.hi>1:raise Unresolved('Picard eta outside conservative source domain')
        return {'node':node_id,'sourceNormRoot':24855,'domain':'0<=Lambda*X<=4, |eta|<=1',
                'upperExpression':{'product':[{'integer':factorial(k)*factorial(m)}, {'power':[{'sourceParameter':'Lambda'},k]},
                                               {'power':[{'quotient':[16,{'sourceDeltaRoot':24801}]},m]}, {'sourceNode':24855}]},
                'proof':'Cauchy in X on radius 1/Lambda inside the separate natural |Lambda X|<=5 extension; eta radius delta/16; equality with actual Picard0 only through X<=Xa.',
                'numericalValueComputed':False,'smoothCollarRadialCauchyClaimed':False}

    def slow_enclosure(self,node_id,arguments,evaluate):
        """Validate source endpoint signs and return original [1/2,2] bracket.

        Full h is the pinned source expression. The exact source inequalities
        give 0<h<1/16. On Z^2<=2, s in [1/2,2], derivative>=1-8h>1/2.
        No numeric caller coordinates are manufactured by this implementation.
        """
        n=self.nodes[node_id]
        if n['op']!='actual_monotone_root' or n['args'][0]!=2: raise Unresolved('not original slow inverse')
        s=self.registry['monotone'][2]
        if s['name']!='ActualCommonBandSlowInverse' or [s[k] for k in ['left','right','derivativeLower','derivativeUpper']]!=[19,24,19,1]: raise Unresolved('slow source binding changed')
        if s['variable'] in s['parameters']: raise Unresolved('captured slow binder')
        env=bound_environment(s['parameters'],arguments)
        z=arguments[0]
        if max(z.lo*z.lo,z.hi*z.hi)>2: raise Unresolved('slow derivative domain Z^2<=2 unresolved')
        left=evaluate(s['body'],env|{s['variable']:Interval.point(F(1,2))})
        right=evaluate(s['body'],env|{s['variable']:Interval.point(2)})
        if not isinstance(left,Interval) or not isinstance(right,Interval): raise Unresolved('uncertified residual endpoint')
        if left.hi>0 or right.lo<0: raise Unresolved('source endpoint signs not proved')
        return Interval(F(1,2),2)

    def expression_definition(self,field_op,system):
        if field_op=='m3_global_indexed_partial': return self.definition({'op':'actual_expression_partial','args':[system]})[1]
        if field_op=='m3_aux_indexed_partial':
            if type(system) is not int:raise Unresolved('invalid auxiliary local system ID')
            return self.definition({'op':'m3_aux_expression_partial' if system<0 else 'actual_expression_partial','args':[system]})[1]
        if isinstance(system,str):return self.definition({'op':'m3_coupled_expression_partial','args':[system]})[1]
        raise Unresolved('unknown local expression namespace')

    def indexed_recipe(self,node_id):
        node=self.nodes[node_id];op=node['op'];_,s=self.definition(node)
        if op not in {'m3_global_indexed_partial','m3_aux_indexed_partial','m3_coupled_indexed_partial'}:raise Unresolved('not indexed')
        _,values,orders=node['args']
        if len(values)!=len(s['parameters']) or len(orders)!=len(s['directions']):raise Unresolved('indexed binder arity')
        for k in orders:require_integer(k,0,16)
        # The global private order is not serialized; its constructor guarantees
        # at least two. Restrict recovery to that conservative supported total.
        maximum=2 if op=='m3_global_indexed_partial' else self.header['definitions']['base']['maximumOrder'] if op=='m3_aux_indexed_partial' else self.header['definitions']['maximumOrder']
        if sum(orders)>maximum:raise Unresolved('indexed total derivative budget exceeded')
        rows=[]
        for index,row in enumerate(s['rows']):
            local=self.expression_definition(op,row['localSystem'])
            if local['body']!=row['localBody'] or local['parameters']!=row['localParameters']:raise Unresolved('local defining body/formals changed')
            maps=row.get('derivativeMaps')
            if maps is None: maps=[[{'parameter':j,'coefficient':c}] for j,c in zip(row['localDirectionIndices'],row['derivativeScales'])]
            if len(maps)!=len(orders):raise Unresolved('direction map arity')
            # Sparse exact polynomial: (local multiindex, source-node monomial) -> integer multiplicity.
            expansion={(tuple(0 for _ in local['parameters']),()):1}
            for k,mapping in zip(orders,maps):
                for _ in range(k):
                    nxt=defaultdict(int)
                    for (alpha,monomial),multiplicity in expansion.items():
                        for d in mapping:
                            j=d['parameter'];c=d['coefficient'];require_integer(j,0,len(alpha)-1)
                            if c==0:continue
                            updated=list(alpha);updated[j]+=1
                            if updated[j]>local['derivativeLimits'][j]:raise Unresolved('local derivative exceeds stored generator scope')
                            factors=monomial if c==1 else tuple(sorted(monomial+(c,)))
                            nxt[(tuple(updated),factors)]+=multiplicity
                    expansion=dict(nxt)
            derivatives=[{'localOrders':list(a),'integerMultiplier':v,'coefficientNodeFactors':list(m)} for (a,m),v in sorted(expansion.items())]
            rows.append({'index':index,'label':row.get('label'),'localSystem':row['localSystem'],'localBody':local['body'],'localParameters':local['parameters'],
                         'argumentNodes':row['values'],'rowCoefficientNode':row['coefficient'],'guards':row.get('guards',[]),'derivatives':derivatives})
        return {'node':node_id,'operation':op,'sourceDefinitionSHA256':digest(s),'outerParameters':s['parameters'],'outerArgumentNodes':values,'orders':orders,
                'rows':rows,'rowCount':len(rows),'allDeclaredRowsRetained':True,'labelsDifferentiated':False,'nearestCopyDifferentiated':False,
                'differentiateLocalBodyBeforeSimultaneousSubstitution':True,'guardBeforeLocalBody':True,'numericValueComputed':False,
                'newLocalDerivativeBodiesMaterialized':False,'implementation':'finite exact chain-rule recipe; derivative requests retain original bodies'}

def geometric_moment(power:int,r=F(1,4)):
    # sum n^power r^n via Stirling numbers of second kind and factorial moments.
    stirling=[1]
    for n in range(1,power+1):
        stirling=[0]+[(stirling[j-1] if j-1<len(stirling) else 0)+j*(stirling[j] if j<len(stirling) else 0) for j in range(1,n+1)]
    return sum((F(stirling[j]*factorial(j))*r**j/(1-r)**(j+1) for j in range(power+1)),F(0))

def natural_norm_majorant(k,m):
    require_integer(k,0,12);require_integer(m,0,12)
    p=k+m
    polynomial=sum((F(comb(p,j)*m**(p-j))*geometric_moment(j) for j in range(p+1)),F(0))
    c=polynomial/F(5**k*(m+1)**2)
    # Majorizes m! binom(n+m,m) (n)_k /(m+1)^2/(n+1)^2.
    if c<=0:raise Unresolved('nonpositive natural majorant')
    logarithmic_constant_bits=260+16*m+22*(m+1)+max(0,c.numerator.bit_length())
    integer_bound=logarithmic_constant_bits+2*(64020+64016*m)
    target_exponent=18+m
    if not integer_bound<2**target_exponent:raise Unresolved('exp(exp(integer)) compression inequality failed')
    return {'radialOrder':k,'etaOrder':m,'exactRationalCoefficient':qstr(c),'boundExpression':'C*Q*rho^(-m)',
            'compressedUpper':{'exp':{'exp':{'integer':1048576+target_exponent}}},
            'integerProof':{'logConstantUpper':logarithmic_constant_bits,'afterTLe2ExpMd':integer_bound,'strictlyBelow':2**target_exponent},
            'domain':{'Y':['0','5'],'eta':['-1','1']},'ordinaryValueNotComputed':True}

def natural_scaled_tail(N,Y,k,m):
    require_integer(N,0,10000);require_integer(k,0,12);require_integer(m,0,12);Y=F(Y)
    if not 0<=Y<=5 or N<k:raise Unresolved('natural tail domain or degree')
    n=N+1;r=Y/F(20)*F(N+2+m,N+2-k)
    if r>=1:raise Unresolved('natural tail ratio not contractive')
    first=F(factorial(m)*comb(n+m,m)*factorial(n)//factorial(n-k),(m+1)**2*20**n*(n+1)**2)*Y**(n-k)
    return first/(1-r)

def main():
    b=SourceBindings();semantic=[];derivatives=[];expression_calls=[]
    expression_ops={'actual_expression_partial','m3_aux_expression_partial','m3_coupled_expression_partial','m3_forced_expression_partial'}
    category={'actual_natural_series':'natural','actual_background_even_profile':'Picard','actual_background_picard':'Picard','actual_quadratic_root':'quadratic',
              'actual_monotone_root':'monotone','actual_covariance_volterra':'covariance','m3_global_indexed_partial':'indexed','m3_aux_indexed_partial':'indexed',
              'm3_coupled_indexed_partial':'indexed','m3_aux_inverse_partial':'auxiliary_inverse','m3_coupled_inverse_partial':'auxiliary_inverse'}
    for node_id,node in sorted(b.nodes.items()):
        key,d=b.definition(node)
        if node['op'] in expression_ops:
            _,values,orders=node['args']
            if not d or len(values)!=len(d['parameters']) or len(orders)!=len(d['parameters']):raise Unresolved('expression binder arity')
            for k,limit in zip(orders,d['derivativeLimits']):require_integer(k,0,limit)
            if node['op']!='actual_expression_partial' and sum(orders)>16:raise Unresolved('outer expression total derivative budget exceeded')
            item={'node':node_id,'definition':key,'body':d['body'],'parameters':d['parameters'],'argumentNodes':values,'orders':orders,'definitionSHA256':digest(d)}
            expression_calls.append(item)
            if any(orders):derivatives.append(item)
        elif node['op'] in category:
            if d is None:raise Unresolved('missing semantic definition')
            kind=category[node['op']]
            semantic.append({'node':node_id,'operation':node['op'],'args':node['args'],'category':kind,'definition':key,'definitionSHA256':digest(d),
                             'bodyRole':'implicit_residual' if kind=='monotone' else 'inverse_forcing' if kind=='auxiliary_inverse' else 'no_direct_evaluation_body',
                             'body':d.get('body'),'scalarNumericalKernelComplete':False})
    counts=Counter(r['category'] for r in semantic)
    expected={'natural':490,'Picard':31,'quadratic':13,'monotone':14,'covariance':4,'indexed':34,'auxiliary_inverse':3}
    if dict(counts)!=expected or len(semantic)!=589 or len(derivatives)!=811:raise Unresolved('unexpected source inventory')
    inventory={'schema':'MathScope.NewRecoveryNativeBinding/1','implementationKind':'NEW RECOVERY; original lost implementation bytes not restored',
               'inputs':[pin(HEADER),pin(CLOSURE)],'sourceNodeCount':len(b.nodes),'semanticCalls':semantic,'semanticCounts':dict(counts),'semanticCallCount':len(semantic),
               'bodylessCount':sum(r['bodyRole']=='no_direct_evaluation_body' for r in semantic),'implicitResidualBodyCount':14,'inverseForcingBodyCount':3,
               'expressionCalls':expression_calls,'nonzeroExpressionDerivativeCalls':derivatives,'nonzeroExpressionDerivativeCount':len(derivatives),
               'derivativeBeforeSubstitution':True,'allSemanticCallsAreNumericallyEvaluated':False,'newM3Closures':0,'N706_closed':False,'N805_closed':False}
    write('NATIVE_BINDING_INVENTORY.json',inventory)
    quad=[]
    for r in semantic:
        if r['category']!='quadratic':continue
        system,component,eta=r['args'];s,beta,q,radius,image=b.quadratic_constants(system);iv=b.quadratic_enclosure(r['node'],Interval(-1,1))
        quad.append({'node':r['node'],'system':system,'component':component,'name':s['name'],'actualEtaArgumentNode':eta,'etaDomain':['-1','1'],
                     'rhsNode':s['rhs'][component],'sourceDefinitionSHA256':digest(s),'beta':qstr(beta),'q':qstr(q),'radius':qstr(radius),'mapImageUpper':qstr(image),
                     'actualRootUniformEnclosure':iv.data(),'errorFormula':'beta/(1-q)','meaning':'uniform same-root value bound on the source eta domain, centered at zero',
                     'momentRhsNumericallyEvaluated':False,'finiteIterateDeclaredRoot':False,'continuousMatrixReplaced':False})
    slow=[r for r in semantic if r['category']=='monotone' and r['args'][0]==2]
    if len(slow)!=2:raise Unresolved('slow invocation count')
    slow_records=[dict(r,sourceDomainConditionalBracket=['1/2','2'],sourceImage='Z=s^D eta; T=s(1-eta^2); 1/2<=s<=2; |eta|<=1; D=1/2-h; pinned 0<h<1/16',
                       runtimeRequirement='actual argument intervals; Z^2<=2; actual source residual endpoint interval signs',actualCallerCoordinatesNumericallyEvaluated=False) for r in slow]
    write('QUADRATIC_AND_SLOW_SOURCE_ADAPTERS.json',{'schema':'MathScope.NewRecoverySourceRootAdapters/1','header':pin(HEADER),'quadratic':quad,'slow':slow_records,'newM3Closures':0})
    plans=[b.indexed_recipe(r['node']) for r in semantic if r['category']=='indexed']
    write('FINITE_INDEXED_RECIPES.json',{'schema':'MathScope.NewRecoveryFiniteIndexedRecipes/1','header':pin(HEADER),'recipes':plans,'recipeCount':len(plans),
          'retainedRowCount':sum(p['rowCount'] for p in plans),'finiteLocalDerivativeRequestCount':sum(len(r['derivatives']) for p in plans for r in p['rows']),
          'sourceProofReuseOnly':True,'newLocalDerivativeBodiesMaterialized':False,'scalarNumericValuesComputed':False,'newM3Closures':0})
    natural_keys=sorted(set((r['args'][3],r['args'][4]) for r in semantic if r['category']=='natural'))
    natural=[natural_norm_majorant(k,m) for k,m in natural_keys]
    write('NATURAL_NORM_AND_TAIL_RECIPES.json',{'schema':'MathScope.NewRecoveryNaturalNormRecipes/1','header':pin(HEADER),'sourceCode':pin(M2/'actual-continuation-exact-tail.mjs'),
          'callCount':counts['natural'],'bounds':natural,'naturalCoefficientOrValueNumericallyEvaluated':False,'newM3Closures':0})
    summary={'semanticCalls':len(semantic),'bodyless':572,'nonzeroExpressionDerivativeCalls':len(derivatives),'quadraticUniformSourceEnclosures':len(quad),
             'slowConditionalSourceBrackets':len(slow),'finiteIndexedRecipes':len(plans),'retainedIndexedRows':sum(p['rowCount'] for p in plans),
             'naturalDerivativePairs':natural_keys,'newM3Closures':0,'finalNumericalEvaluatorComplete':False}
    write('NATIVE_RECOVERY_RECEIPT.json',summary);print(json.dumps(summary,sort_keys=True))

if __name__=='__main__':main()
