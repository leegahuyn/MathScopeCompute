#!/usr/bin/env python3
"""Source-bound Stage 4 guard discharge. No success flag is accepted as proof.

Scope: the ORIGINAL explicit Cartesian guard propositions on the source atlas.
Unproved coordinate/axis, operator regularity, jets and PDEs are not erased.
Analytic induction is in PROOF_KO.md; this is not a Lean kernel proof.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict, deque
from fractions import Fraction as Q
from functools import lru_cache
import hashlib
import importlib.util
import json
from pathlib import Path

STAGE3_SHA='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
BUMP_SHA='7c4dd0a5ec91303eee3b1db09b570d36f87f9bba400d349938a40ff6ead9b897'
PARENT='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
SCALAR='aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8'
TARGETS=(13,14,25,38,39,40,41,44,45,46,48,49,50,54,56,57,58,60,68,76,84,92)
EXPECTED_PDE=(169,197,654)


def require(ok,message):
    if not ok: raise ValueError(message)

def digest(raw): return hashlib.sha256(raw).hexdigest()
def canonical(obj): return json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()
def sha(obj): return digest(canonical(obj))
def read(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def write(path,obj):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def load_module(path,name,pin):
    require(digest(Path(path).read_bytes())==pin,'Changed inherited verifier '+str(path))
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module);return module


def add(values):
    terms=[];constant=Q(0)
    for value in values:
        for a in (value[1] if value[0]=='add' else [value]):
            if a[0]=='q':constant+=Q(a[1])
            else:terms.append(a)
    if constant:terms.append(('q',str(constant)))
    if not terms:return ('q','0')
    return terms[0] if len(terms)==1 else ('add',tuple(sorted(terms,key=repr)))

def mul(values):
    terms=[];constant=Q(1)
    for value in values:
        for a in (value[1] if value[0]=='mul' else [value]):
            if a[0]=='q':constant*=Q(a[1])
            else:terms.append(a)
    # Never erase undefined operands by multiplying by zero.
    if constant!=1:terms.append(('q',str(constant)))
    if not terms:return ('q','1')
    return terms[0] if len(terms)==1 else ('mul',tuple(sorted(terms,key=repr)))

class ScalarNormalizer:
    """Capture-safe canonicalization of the actual primitive guard cones only."""
    def __init__(self,program):self.p=program;self.visited=set()
    @lru_cache(maxsize=None)
    def at(self,i,env=(),depth=0):
        self.visited.add(i);e=dict(env)
        if i in e:return e[i]
        n=self.p[i];op=n['op'];a=n['args'];C=lambda j:self.at(j,env,depth)
        if op=='rational':return ('q',str(Q(*map(int,a))))
        if op=='coordinate':return ('coordinate',i)
        if op=='source_parameter':return ('parameter',a[0])
        if op=='actual_opaque_value':
            if a!=[622820,'actual_monotone_root']:return ('UNSUPPORTED_OPAQUE',i)
            return ('root',622820,C(3),C(4))
        if op=='unresolved_opaque_substitution':
            require(self.p[a[1]]['op']=='coordinate','Non-coordinate substitution binder')
            # Used here only when the base is a fully explicit primitive cone.
            e[a[1]]=C(a[2]);result=self.at(a[0],tuple(sorted(e.items())),depth)
            require('UNSUPPORTED' not in repr(result),'Hidden opaque capture cannot be substituted')
            return result
        if op=='add':return add([C(x) for x in a])
        if op=='multiply':return mul([C(x) for x in a])
        if op=='definite_integral':
            require(self.p[a[1]]['op']=='coordinate','Non-coordinate integral binder')
            e[a[1]]=('bound',depth)
            return ('integral',self.at(a[0],tuple(sorted(e.items())),depth+1),C(a[2]),C(a[3]))
        if op in ('integer_power','source_step_derivative'):return (op,C(a[0]),a[1])
        if op=='unresolved_total_source_jet':return ('UNRESOLVED_JET',i)
        require(op in ('inverse','exp','log_positive','sqrt_positive','sine','cosine','smooth_piecewise','ceiling','maximum'),'Unsupported primitive '+op)
        return (op,tuple(C(x) for x in a))


def primitive_children(node):
    op=node['op'];a=node['args']
    if op in ('rational','coordinate','source_parameter','actual_opaque_value'):return []
    if op in ('integer_power','source_step_derivative','unresolved_total_source_jet'):return a[:1]
    if op=='unresolved_opaque_substitution':return a
    return [x for x in a if type(x)is int]


def active_branch_paths(program,operand):
    """Every use of each original inverse must be under its matching lazy guard."""
    parents=defaultdict(list)
    for i,node in enumerate(program):
        for j in primitive_children(node):parents[j].append(i)
    n=program[operand];require(n['op']=='multiply','Not a bump denominator')
    t,one_minus=n['args']
    require(program[one_minus]['op']=='add' and 1 in program[one_minus]['args'],'Missing 1-t')
    neg=next(x for x in program[one_minus]['args'] if x!=1)
    require(program[neg]=={'op':'multiply','args':[8,t]},'Denominator is not t*(1-t)')
    inverses=[i for i in parents[operand] if program[i]=={'op':'inverse','args':[operand]}]
    require(bool(inverses),'No actual inverse call')
    paths=[]
    for inv in inverses:
        stack=[(inv,(inv,))];seen=set()
        while stack:
            cur,path=stack.pop()
            if cur in seen:continue
            seen.add(cur);require(bool(parents[cur]),'Unguarded inverse use reaches a program output')
            for nxt in parents[cur]:
                x=program[nxt]
                if x['op']=='smooth_piecewise' and x['args']==[t,0,1,0,cur,0]:paths.append(path+(nxt,))
                else:stack.append((nxt,path+(nxt,)))
    return {'operand':operand,'argument':t,'inverseCalls':inverses,'allUsePathsGuarded':True,
            'dominatedPaths':paths,'inequality':'0<t<1 implies t*(1-t)>0',
            'endpointPolicy':'Both inactive branches are exactly zero; singular interior not evaluated'}


def base_binding(program,source,registries):
    require(sha(program)==SCALAR,'Original scalar circuit changed')
    root=registries['monotone'][2]
    require(root['parameters']==[622803,622804] and root['variable']==622810,'Root captured another coordinate')
    require(source(622820)=={'op':'actual_monotone_root','args':[2,622803,622804]},'Different slow root call')
    require(program[114]=={'op':'actual_opaque_value','args':[622820,'actual_monotone_root']},'Scalar/source root mismatch')
    # Independently reopen all native defining operands, including both endpoints.
    allowed={root['variable'],*root['parameters']};seen=set();stack=[root[k] for k in ('body','left','right','derivativeLower','derivativeUpper')]
    while stack:
        i=stack.pop()
        if i in seen:continue
        seen.add(i);n=source(i);op=n['op'];a=n['args']
        if op=='coordinate':require(i in allowed,'Hidden native root capture')
        elif op in ('rational','source_parameter'):pass
        elif op in ('integer_power','inverse','exp','log_positive','sqrt_positive'):stack.extend(a[:1])
        elif op in ('add','multiply'):stack.extend(a)
        else:raise ValueError('Unproved native root defining operator '+op)
    return {'nativeDefinitionSHA256':sha(root),'definingSourceNodes':sorted(seen),
            'completeRootCoordinateSupport':[622803,622804],
            'allScalarRootSubstitutionsPreserveTheseCoordinates':True}


def primitive_lemmas(program):
    c=ScalarNormalizer(program)
    pairs=[(114,1412),(114,1427),(114,1510),(116,1414),(116,1429),(116,1512),(202,1487),(218,1497),(229,1507),(230,1508)]
    equal=[]
    for a,b in pairs:
        require(c.at(a)==c.at(b),'Failed exact alpha/substitution equivalence '+str((a,b)))
        equal.append({'left':a,'right':b,'canonicalSHA256':sha(c.at(a))})
    # The native bump, not a similarly named replacement.
    for bump,arg,exponent in ((129,122,128),(242,235,241)):
        require(program[bump]=={'op':'smooth_piecewise','args':[arg,0,1,0,exponent,0]},'Changed flat zero branches')
    require(program[230]=={'op':'definite_integral','args':[130,119,132,229]},'Changed mass body/endpoints')
    require(program[130]=={'op':'multiply','args':[117,129]},'Changed mass scaling')
    require(program[1360]=={'op':'multiply','args':[9,115]},'Changed sqrt derivative denominator')
    require(program[253]=={'op':'source_step_derivative','args':[252,0]},'Changed native step order')
    branches=[active_branch_paths(program,x) for x in (1421,1436,1519)]
    # The mass identity holds on ONE collar for every derivative order.
    require(Q(1,110)<Q(1,4) and Q(819200,121)>3,'Collar fails to fit original fixed envelope')
    return {'alphaEquivalentPrimitivePairs':equal,'branchProofs':branches,
      'root':'1/4<s<3 on the inherited fixed collar; original image has 1/2<=s<=2',
      'mass':'C_beta=(1/10)*integral_0^1 exp(-1/[u*(1-u)]) du',
      'massLower':'1/14580','massUpper':'1/160','inverseMassUpper':'14580',
      'allPositiveOrderMassDerivatives':'0',
      'bumpAllOrders':'P0=1; Pnext=u^2*Pprime-2*n*u*uprime*P+uprime*P',
      'bumpCoefficientBound':'B0=1; Bnext=(24*n+3)*B; ||beta^(n)||<=B_n*(2n)!',
      'stepAllOrders':'Original flat logistic; smooth for every finite real input',
      'scope':'Explicit original Cartesian primitive guards, uniformly on all original admitted reference/active-row charts; no whole-field norm conclusion'}


def guard_table(program,frontier,lemmas):
    c=ScalarNormalizer(program);rows=[]
    root=c.at(114);scale=c.at(116);mass=c.at(230)
    branch_by={x['operand']:x for x in lemmas['branchProofs']}
    for old in frontier['cumulativeGlobalGuardRows']:
        if old['id'] not in frontier['remainingGlobalGuardIDs']:continue
        g=old['originalGuard'];kind=g['kind'];operand=g.get('operand');rule=None;dependencies=[]
        require(old['id'].endswith(sha(g)[:12]) and old['originalSourceParentSHA256']==PARENT,'Changed original guard identity')
        if operand is not None and operand not in (247,249,254):
            try:value=c.at(operand)
            except ValueError:value=None
            if kind=='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN' and g['operation']=='sqrt_positive' and value==root:
                rule='ROOT_POSITIVE_WITH_EXACT_CAPTURE_SAFE_IDENTITY';dependencies=['native-root','original-atlas-transport']
            elif kind=='NONZERO_ACTUAL_ARGUMENT' and value==scale:
                rule='POSITIVE_NATIVE_RADIAL_SCALE';dependencies=['native-root','exact-profile']
            elif kind=='NONZERO_ACTUAL_ARGUMENT' and value==mass:
                rule='POSITIVE_CONSTANT_MASS_AND_ALPHA_EQUIVALENCE';dependencies=['fixed-collar-support','mass-identity']
            elif kind=='NONZERO_ACTUAL_ARGUMENT' and operand==1360:
                rule='TWO_SQRT_ROOT_POSITIVE';dependencies=['native-root']
            elif kind=='NONZERO_ACTUAL_ARGUMENT' and operand in branch_by:
                rule='EVERY_USE_DOMINATED_BY_POSITIVE_BUMP_BRANCH';dependencies=['active-branch-dominance','positive-scale']
            elif kind=='ACTUAL_MATCHING_FLAT_JOIN' and operand in (129,242):
                require(g['guards']==program[operand]['args'][:3],'Guard names another join')
                rule='ALL_ORDER_FLAT_BUMP_COMPOSITION';dependencies=['positive-scale','bump-induction']
            elif kind=='ACTUAL_FINITE_INTEGRAL_LEIBNIZ' and operand==230:
                require(program[operand]=={'op':'definite_integral','args':[g[k] for k in ('body','binder','left','right')]},'Integral guard operands changed')
                require(g['variable'] in (2,3,5,6,7),'Unknown original derivative direction')
                rule='FIXED_COMPACT_SUPPORT_LEIBNIZ_ALL_ORDERS';dependencies=['native-root','fixed-collar-support','bump-induction']
            elif kind=='ORIGINAL_STEP_JET' and operand==253 and g['requestedOrder']==1:
                rule='ORIGINAL_SMOOTH_STEP_OF_SMOOTH_SCALE_ARGUMENT';dependencies=['native-root','positive-scale','original-step-all-orders']
        number=int(old['id'].split('-')[2])
        if rule is not None:require(number in TARGETS,'Unreviewed rule application; retain it for review')
        rows.append({'id':old['id'],'originalGuard':g,'originalGuardSHA256':sha(g),
          'uniqueSourceID':old['uniqueSourceID'],'status':'DISCHARGED_ORIGINAL_GUARD' if rule else 'OPEN',
          'rule':rule,'proofDependencies':dependencies,
          'remainingReason':None if rule else remaining_reason(g),
          'sampledValuesUsedAsProof':False,'wholeFieldExistenceInferred':False})
    require(len(rows)==38,'Original remaining guard inventory changed')
    require({int(r['id'].split('-')[2]) for r in rows if r['rule']}==set(TARGETS),'Expected primitive discharge did not replay')
    return rows


def remaining_reason(g):
    if g['kind']=='ACTUAL_FINITE_INTEGRAL_LEIBNIZ':
        return 'Full original integrand scalar 248 includes complete_gr and P; its parameter derivatives and common domination have not been proved. Bump smoothness alone is insufficient.'
    if g['kind']=='ACTUAL_OPAQUE_SUBSTITUTION':
        return 'Actual shifted complete_gr argument tuple requires nontrivial capture-safe reconstruction and equality of its full definedness domain.'
    return 'Original coordinate/band/axis definedness or smooth extension at its excluded boundary is not certified by the bump/root rules.'


class DerivativeAttempt:
    """Bounded independent first-derivative expansion; unsupported lemmas stop it.

    A stop is an explicit unproved derivative, never zero. Domain assumptions
    are collected even when a coefficient later cancels algebraically.
    """
    def __init__(self,source,reg,variable,max_work=12000):
        self.g=source;self.reg=reg;self.variable=variable;self.max_work=max_work
        self.memo={};self.nodes=[];self.stops=[];self.domains=[];self.active=set()
    def put(self,op,args):
        self.nodes.append({'op':op,'args':args});return len(self.nodes)-1
    def stop(self,i,reason):
        self.stops.append({'sourceNode':i,'operation':self.g(i)['op'],'reason':reason})
        return self.put('UNPROVED_DERIVATIVE',[i,self.variable,reason])
    def at(self,i,depth=0):
        if i in self.memo:return self.memo[i]
        if i in self.active:return self.stop(i,'Recursive source definition')
        if len(self.memo)+len(self.active)>self.max_work or depth>240:return self.stop(i,'Explicit work/depth limit; original request retained')
        self.active.add(i);n=self.g(i);op=n['op'];a=n['args'];D=lambda j:self.at(j,depth+1)
        if op in ('rational','source_parameter'):v=self.put('rational',['0','1'])
        elif op=='coordinate':v=self.put('rational',['1' if i==self.variable else '0','1'])
        elif op=='add':v=self.put('add',[D(j) for j in a])
        elif op=='multiply':v=self.put('source_product_rule',[[j,D(j)] for j in a])
        elif op in ('inverse','log_positive','sqrt_positive','exp','sine','cosine','integer_power'):
            if op in ('inverse','log_positive','sqrt_positive'):
                self.domains.append({'sourceNode':i,'argument':a[0],'required':'nonzero' if op=='inverse' else 'positive','dischargedByThisExpansion':False})
            v=self.put('source_'+op+'_chain_rule',[i,a,D(a[0])])
        elif op in ('actual_expression_partial','m3_aux_expression_partial'):
            d=self.reg['expression'][a[0]] if op=='actual_expression_partial' else self.reg['expressionDefinitions'][-1-a[0]]
            if any(a[2]):v=self.stop(i,'Stored original source partial derivative needs independently materialized body')
            elif a[1]!=d['parameters']:v=self.stop(i,'Nontrivial actual argument map needs capture-safe chain-rule reconstruction')
            else:v=D(d['body'])
        elif op=='actual_monotone_root' and a==[2,622803,622804]:
            v=self.put('certified_slow_root_first_derivative',{'variable':self.variable,'R_Y_theta':'0','Z':'2*Z*s^(2h)/Fs','T':'1/Fs','guard':'native-root + original-atlas-transport'})
        else:v=self.stop(i,{'actual_natural_series':'Original natural-series termwise differentiation and actual common coefficient bound remain unproved',
           'definite_integral':'Actual integrand common-domain domination is required before Leibniz expansion',
           'smooth_piecewise':'This particular source branch needs its own flat-gluing proof',
           'm3_aux_inverse_partial':'Actual full Fourier inverse needs termwise derivative and tail control',
           'm3_aux_indexed_partial':'Full indexed derivative needs native local-body derivatives and global joins',
           'source_step_derivative':'Original composed step needs actual argument-domain derivative certificate'}.get(op,'No verified derivative rule for the actual native operation'))
        self.active.remove(i);self.memo[i]=v;return v
    def receipt(self,root):
        self.at(root)
        return {'sourceVariable':self.variable,'sourceNodesVisited':len(self.memo),'expansionNodes':len(self.nodes),
          'stops':self.stops,'remainingPrimitiveDomains':self.domains,
          'partialExpansionSHA256':sha(self.nodes),'derivativeProved':not self.stops and not self.domains}


def jet_audit(program,frontier,source,reg):
    rows=[];families={}
    for ident in frontier['remainingJetIDs']:
        i=int(ident.split(':')[1]);n=program[i]
        require(n['op']=='unresolved_total_source_jet','Original jet node changed')
        operand,order=n['args'];base=program[operand]
        require(base['op']=='actual_opaque_value','New primitive jet case requires independent computation')
        src=base['args'][0];call=source(src);a=call['args'];op=call['op']
        if op=='actual_expression_partial':d=reg['expression'][a[0]];key=f'expression:{a[0]}'
        elif op=='m3_aux_expression_partial':d=reg['expressionDefinitions'][-1-a[0]];key=f'expressionDefinitions:{-1-a[0]}'
        elif op=='m3_aux_indexed_partial':d=reg['fieldDefinitions'][a[0]];key=f'fieldDefinitions:{a[0]}'
        elif op=='m3_aux_inverse_partial':d=reg['inverseDefinitions'][a[0]];key=f'inverseDefinitions:{a[0]}'
        else:raise ValueError('Unreviewed source jet operation '+op)
        require(len(a[1])==len(d['parameters']),'Incomplete actual source argument tuple')
        if operand not in families:
            attempt=DerivativeAttempt(source,reg,program[order[0]]['args'][1]).receipt(src)
        else:attempt=families[operand]['firstAttempt']
        families[operand]={'firstAttempt':attempt,'scalar':operand,'sourceNode':src,'node':call,'registry':key,'definitionSHA256':sha(d),'definitionName':d['name']}
        rows.append({'id':ident,'originalNode':n,'sourceNode':src,'registry':key,
          'orderedDerivativeCoordinates':order,'status':'OPEN',
          'reason':'Actual source derivative body and operator regularity are not supplied by the primitive guard certificate; existing unresolved derivative is retained.'})
    require(len(rows)==230 and len({r['id'] for r in rows})==230,'Changed or duplicate jet inventory')
    return {'rows':rows,'sourceFamilies':list(families.values()),'attempted':len(rows),'discharged':0,'remaining':len(rows),'derivativeOrderNotCommuted':True,'uncomputedDerivativesZeroed':False}


def pde_audit(prepared,source):
    results=[]
    for component,count in enumerate(EXPECTED_PDE):
        path=prepared/f'cartesian/rational/pde_component_{component}.json';data=read(path)
        require(data['component']==component and len(data['reducedNumeratorTerms'])==count,'Changed original PDE term inventory')
        poly={};rows=[]
        for idx,t in enumerate(data['reducedNumeratorTerms']):
            coeff=Q(t['coefficient']);require(coeff!=0,'Zero coefficient in original unresolved inventory')
            factors=tuple((f['sourceNode'],f['power']) for f in t['factors'])
            require(len(dict(factors))==len(factors) and all(n>0 for _,n in factors),'Bad original source monomial')
            for f in t['factors']:require(source(f['sourceNode'])['op']==f['operation'],'PDE source operation changed')
            key=tuple(sorted(factors));poly[key]=poly.get(key,Q(0))+coeff
            rows.append({'id':f'N6-PDE-{component}-{idx:04d}','sourceTermSHA256':sha(t),'coefficient':str(coeff),'factors':factors,'status':'OPEN'})
        nonzero=sum(v!=0 for v in poly.values())
        require(nonzero==count,'A new exact cancellation requires a reviewed source-term mapping')
        results.append({'component':component,'inputFileSHA256':digest(path.read_bytes()),'rows':rows,
          'formalNonzeroMonomials':nonzero,'analyticNonzeroCounterexampleClaimed':False,
          'statement':'Direct-minus-assembled source expression, not a demand that each isolated monomial vanish separately.',
          'primitiveGuardProofIsNotAnOperatorIdentity':True,'discharged':0})
    return results


def run(source_dir,prepared,prior,stage3_path,bump_path,out):
    out.mkdir(parents=True,exist_ok=True)
    previous=load_module(stage3_path,'n6_stage3_inherited',STAGE3_SHA)
    bump=load_module(bump_path,'n6_bump_inherited',BUMP_SHA)
    replay=previous.run(source_dir,prepared,prior,out/'stage3-replay')
    cp=previous.read_locked(prepared/'cartesian/checkpoints/cartesian-source-checkpoint.json',previous.PINS['checkpoint'])
    frontier=previous.read_locked(prior/'OBLIGATION_MATRIX.json',previous.PINS['frontier'])
    # Reexecute the actual prior native bump source/profile binding, not its flags.
    bump.run(prepared,prior/'OBLIGATION_MATRIX.json',out/'bump-replay')
    program=cp['cartesian']['scalarProgram'];g=previous.Source(out/'stage3-replay/source-cache.sqlite')
    reg=previous.registries(read(source_dir/'header.json'))
    bindings=base_binding(program,g,reg);lemmas=primitive_lemmas(program)
    guards=guard_table(program,frontier,lemmas);jets=jet_audit(program,frontier,g,reg);pdes=pde_audit(prepared,g)
    closed=[r['id'] for r in guards if r['status']=='DISCHARGED_ORIGINAL_GUARD']
    remaining=[r['id'] for r in guards if r['status']=='OPEN']
    result={'schema':'MathScope.N6.Stage4.DirectPrimitiveDischarge/1','sourceParentSHA256':PARENT,
      'sourceScalarProgramSHA256':SCALAR,'inheritedStage3VerifierSHA256':STAGE3_SHA,'inheritedBumpVerifierSHA256':BUMP_SHA,
      'proofBasis':'Written analytic proof + independently executed exact source/capture/branch checks; not Lean',
      'sourceBindings':bindings,'lemmas':lemmas,
      'dischargedOriginalGuardIDs':closed,'remainingGlobalGuardIDs':remaining,'remainingJetIDs':frontier['remainingJetIDs'],
      'before':{'CartesianJet':230,'GlobalGuard':38,'PDE':1020,'total':1288},
      'after':{'CartesianJet':230,'GlobalGuard':len(remaining),'PDE':1020,'total':230+len(remaining)+1020},
      'newDischarged':{'CartesianJet':0,'GlobalGuard':len(closed),'PDE':0},
      'scope':'Original explicit primitive guards on the original reference atlas and all certified active indexed applications. Independent whole operator/axis/field obligations remain.',
      'originalUniversalRequirements':frontier['originalUniversalRequirements'],
      'N601':'OPEN','N602':'PARTIAL','M3':'56/64','allOriginalObligationsDischarged':False,
      'originalProducerModified':False,'historicalMatricesModified':False,'originalProgressModified':False,
      'closedCertificatesMustBeReplayedBeforeConsumption':True}
    write(out/'GUARD_DISCHARGES.json',{'rows':guards});write(out/'JET_AUDIT.json',jets)
    write(out/'PDE_AUDIT.json',pdes);write(out/'OBLIGATION_MATRIX_STAGE4.json',result)
    write(out/'SOURCE_WITNESSES_STAGE4.json',{'parentSHA256':PARENT,'nodes':[{'id':i,'node':g(i)} for i in sorted(g.used)]})
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('source','prepared','prior','stage3-module','bump-module','out'):p.add_argument('--'+name,type=Path,required=True)
    a=p.parse_args()
    try:r=run(a.source,a.prepared,a.prior,a.stage3_module,a.bump_module,a.out)
    except (ValueError,OSError,KeyError,IndexError) as error:p.exit(2,str(error)+'\n')
    print(json.dumps({'newDischarged':r['newDischarged'],'remaining':r['after'],'allDischarged':r['allOriginalObligationsDischarged']}))
