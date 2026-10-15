"""Conservative, source-bound exact attempts for every original domain guard.

The abstract interpreter proves statements over ALL real Cartesian coordinates.
It never uses sampled values, a local chart receipt, or an opaque function's
claimed regularity. Unknown source images and joins remain explicit failures.
"""
from __future__ import annotations

from collections import Counter
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import sqlite3

PARENT = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
PROFILE_SHA = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
STEP_SHA = 'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'
HEADER_SHA = '010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'
DB_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'
KINDS = {'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN':19, 'NONZERO_ACTUAL_ARGUMENT':22,
         'ACTUAL_FINITE_INTEGRAL_LEIBNIZ':40, 'ORIGINAL_STEP_JET':6,
         'ACTUAL_MATCHING_FLAT_JOIN':2, 'ACTUAL_OPAQUE_SUBSTITUTION':5}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def sha(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf8'))


def write(path, value):
    path=Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')


def find(root, name):
    paths=list(Path(root).rglob(name))
    if len(paths)!=1:
        raise ValueError(f'Expected one {name}, found {len(paths)}')
    return paths[0]


def file_sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for raw in iter(lambda:f.read(1<<20),b''):h.update(raw)
    return h.hexdigest()


def fact(signs=(-1,0,1), finite=False, smooth=False, ge1=False, gt1=False,
         le1=False, lt1=False, exact=None, stops=()):
    return {'signs':set(signs), 'finite':finite, 'smooth':smooth,
            'ge1':ge1 or gt1, 'gt1':gt1, 'le1':le1 or lt1, 'lt1':lt1,
            'exact':exact, 'stops':set(stops)}


def rational(q):
    q=Q(q)
    return fact([(q>0)-(q<0)],True,True,q>=1,q>1,q<=1,q<1,q)


def positive(a):
    return a['finite'] and a['signs']=={1}


def nonzero(a):
    return a['finite'] and 0 not in a['signs']


def combine(op, values):
    """Small exact sign lattice; giant source exponentials stay symbolic."""
    finite=all(a['finite'] for a in values)
    smooth=all(a['smooth'] for a in values)
    stops=set().union(*(a['stops'] for a in values))
    xs=[a['exact'] for a in values]
    if all(x is not None for x in xs):
        q=sum(xs,Q()) if op=='add' else __import__('functools').reduce(lambda a,b:a*b,xs,Q(1))
        if max(q.numerator.bit_length(),q.denominator.bit_length())<=4096:
            return rational(q)
    if op=='multiply':
        signs={1}
        for a in values: signs={x*y for x in signs for y in a['signs']}
        ge1=all(a['ge1'] for a in values)
        gt1=ge1 and any(a['gt1'] for a in values)
        le1=all(positive(a) and a['le1'] for a in values)
        lt1=le1 and any(a['lt1'] for a in values)
    else:
        if all(a['signs']<={0,1} for a in values):
            signs={1} if any(a['signs']=={1} for a in values) else {0,1}
        elif all(a['signs']<={-1,0} for a in values):
            signs={-1} if any(a['signs']=={-1} for a in values) else {-1,0}
        else: signs={-1,0,1}
        ge1=all(a['signs']<={0,1} for a in values) and any(a['ge1'] for a in values)
        gt1=all(a['signs']<={0,1} for a in values) and any(a['gt1'] for a in values)
        le1=lt1=False
    return fact(signs,finite,smooth,ge1,gt1,le1,lt1,stops=stops)


def inverse(a):
    ok=nonzero(a)
    return fact(a['signs']-{0} if ok else (-1,0,1),ok,a['smooth'] and ok,
                positive(a) and a['le1'],positive(a) and a['lt1'],
                a['ge1'],a['gt1'],Q(1)/a['exact'] if ok and a['exact'] is not None else None,
                a['stops'] | (set() if ok else {'nonzero denominator not proved'}))


def power(a,n):
    if n==0: return rational(1)
    if n<0: return power(inverse(a),-n)
    if a['exact'] is not None and n*max(a['exact'].numerator.bit_length(),a['exact'].denominator.bit_length())<=4096:
        return rational(a['exact']**n)
    signs=a['signs'] if n%2 else ({0} if a['signs']=={0} else ({0,1} if 0 in a['signs'] else {1}))
    return fact(signs,a['finite'],a['smooth'],a['ge1'],a['gt1'],
                positive(a) and a['le1'],positive(a) and a['lt1'],stops=a['stops'])


def unary(op,a):
    if op=='exp':
        return fact([1],a['finite'],a['smooth'],a['signs']<={0,1},a['signs']=={1},
                    a['signs']<={-1,0},a['signs']=={-1},stops=a['stops'])
    if op=='log_positive':
        ok=positive(a)
        signs={1} if a['gt1'] else {-1} if a['lt1'] else {0,1} if a['ge1'] else {-1,0} if a['le1'] else {-1,0,1}
        return fact(signs,ok,a['smooth'] and ok,stops=a['stops'] | (set() if ok else {'positive log argument not proved'}))
    if op=='sqrt_positive':
        ok=positive(a)
        return fact([1],ok,a['smooth'] and ok,a['ge1'],a['gt1'],a['le1'],a['lt1'],stops=a['stops'] | (set() if ok else {'positive square-root argument not proved'}))
    if op in ('sine','cosine'):
        return fact(finite=a['finite'],smooth=a['smooth'],stops=a['stops'])
    raise ValueError(op)


class Parameters:
    """Independent proof of finite exact expressions, with no numeric exp."""
    def __init__(self, expressions):
        self.expressions=expressions;self.memo={};self.active=set()

    def parameter(self,name):
        if name in self.memo:return self.memo[name]
        if name not in self.expressions or name in self.active:
            return fact(stops={f'unknown/cyclic exact parameter {name}'})
        self.active.add(name);v=self.expression(self.expressions[name]);self.active.remove(name)
        self.memo[name]=v;return v

    def expression(self,x):
        if 'ref' in x:return self.parameter(x['ref'])
        if 'integer' in x:return rational(Q(x['integer']))
        if 'rational' in x:return rational(Q(x['rational']))
        for k,op in [('sum','add'),('product','multiply')]:
            if k in x:return combine(op,[self.expression(a) for a in x[k]])
        if 'quotient' in x:return combine('multiply',[self.expression(x['quotient'][0]),inverse(self.expression(x['quotient'][1]))])
        if 'power' in x:return power(self.expression(x['power'][0]),x['power'][1])
        for k,op in [('exp','exp'),('log','log_positive')]:
            if k in x:return unary(op,self.expression(x[k]))
        if 'min' in x or 'max' in x:
            values=[self.expression(a) for a in x.get('min',x.get('max'))]
            return fact(set().union(*(a['signs'] for a in values)),all(a['finite'] for a in values),True,
                        all(a['ge1'] for a in values),all(a['gt1'] for a in values),
                        all(a['le1'] for a in values),all(a['lt1'] for a in values),stops=set().union(*(a['stops'] for a in values)))
        if 'ceil' in x:
            a=self.expression(x['ceil'])
            return fact([1] if positive(a) else (-1,0,1),a['finite'],a['finite'],
                        positive(a),a['gt1'],stops=a['stops'])
        return fact(stops={'unreviewed exact parameter operation'})


class ScalarProof:
    def __init__(self,program,parameters):
        self.program=program;self.parameters=parameters;self.memo={};self.active=set();self.visited=set()

    def at(self,i):
        if type(i) is not int or i<0 or i>=len(self.program):raise ValueError('Invalid source scalar binding')
        if i in self.memo:return self.memo[i]
        if i in self.active:return fact(stops={f'cyclic scalar {i}'})
        self.active.add(i);self.visited.add(i)
        n=self.program[i];op=n['op'];a=n['args']
        if op=='rational':v=rational(Q(int(a[0]),int(a[1])))
        elif op=='coordinate':v=fact(finite=True,smooth=True)
        elif op=='source_parameter':v=self.parameters.parameter(a[0])
        elif op in ('add','multiply'):v=combine(op,[self.at(j) for j in a])
        elif op=='inverse':v=inverse(self.at(a[0]))
        elif op=='integer_power':v=power(self.at(a[0]),a[1])
        elif op in ('exp','log_positive','sqrt_positive','sine','cosine'):v=unary(op,self.at(a[0]))
        elif op=='source_step_derivative':
            x=self.at(a[0]);v=fact([0,1] if a[1]==0 else (-1,0,1),x['finite'],x['smooth'],stops=x['stops'])
        elif op=='definite_integral':
            body,binder,left,right=a
            vals=[self.at(j) for j in [body,left,right]];stops=set().union(*(x['stops'] for x in vals))
            ok=all(x['smooth'] and x['finite'] for x in vals) and self.program[binder]['op']=='coordinate'
            v=fact(finite=ok,smooth=ok,stops=stops | (set() if ok else {f'global compact-integral smoothness at scalar {i} not proved'}))
        elif op=='ceiling':
            x=self.at(a[0]);v=fact([1] if positive(x) else (-1,0,1),x['finite'],False,stops=x['stops']|{f'ceiling scalar {i} regularity not proved'})
        else:v=fact(stops={f'unproved original operator {op} at scalar {i}'})
        self.active.remove(i);self.memo[i]=v;return v


def step_lemma():
    """All-order induction, with exact first and second derivative controls."""
    # Terms are t^a(1-t)^b sigma^c; D sigma=(2/t^3+2/(1-t)^3)sigma(1-sigma).
    p={(0,0,1):Q(1)};derivatives=[]
    for order in range(1,4):
        out={}
        def put(a,b,c,q):out[(a,b,c)]=out.get((a,b,c),Q())+q
        for (a,b,c),q in p.items():
            if a:put(a-1,b,c,q*a)
            if b:put(a,b-1,c,-q*b)
            if c:
                for da,db in [(-3,0),(0,-3)]:
                    put(a+da,b+db,c,2*q*c);put(a+da,b+db,c+1,-2*q*c)
        p={k:v for k,v in out.items() if v}
        if any(k[2]<1 for k in p):raise AssertionError('Flat-endpoint factor lost')
        at_one={}
        for (a,b,c),q in p.items():at_one[(a,b)]=at_one.get((a,b),Q())+q
        if any(at_one.values()):raise AssertionError('Right flat-endpoint factor lost')
        derivatives.append({'order':order,'terms':[[*k,str(v)] for k,v in sorted(p.items())]})
    return {'name':'original-flat-logistic-C-infinity',
        'formula':'sigma(t)=0 for t<=0, 1/(1+exp(t^-2-(1-t)^-2)) for 0<t<1, 1 for t>=1',
        'interiorRecurrence':'D sigma=(2 t^-3+2(1-t)^-3) sigma(1-sigma)',
        'allOrdersProof':'Induction under the displayed recurrence expresses every positive-order derivative as a finite Laurent polynomial in t,1-t times sigma(1-sigma). Near 0, sigma<=exp(-1/t^2+4) for t<=1/2; near 1 use 1-sigma and reflection. For every fixed m, t^-m exp(-1/t^2) tends to 0: with x=1/t^2 and integer k>m/2, exp(x)>=x^k/k!. Thus all one-sided derivatives vanish at both endpoints. The zero/one exterior branches glue to a real C-infinity function. This is induction for arbitrary order, not extrapolation of the finite controls.',
        'exactInteriorDerivativeControls':derivatives,
        'doesNotProveComposedOpaqueArgumentRegularity':True}


def serial_fact(v):
    return {k:sorted(x) if isinstance(x,set) else str(x) if isinstance(x,Q) else x for k,x in v.items()}


class SourceRows:
    """Read only the required original DAG prefix nodes on the cloud runner."""
    def __init__(self,path,limit=50000):
        self.db=sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True)
        self.length=self.db.execute('SELECT max(id)+1 FROM nodes').fetchone()[0]
        self.memo={};self.limit=limit

    def __len__(self):return self.length

    def __getitem__(self,i):
        if i not in self.memo:
            if len(self.memo)>=self.limit:raise RuntimeError('Original-source sign/norm attempt hit 50000-node budget')
            row=self.db.execute('SELECT raw FROM nodes WHERE id=?',(i,)).fetchone()
            if row is None:raise ValueError('Original source prefix missing node '+str(i))
            self.memo[i]=json.loads(row[0])
            if hasattr(self,'progress'):self.progress['actualSourceNodesRead']=len(self.memo)
        return self.memo[i]


def actual_global_attempts(context,expressions,progress=None):
    """Attempt original Rayleigh inputs and true Picard coefficient prerequisites.

    A finite expression at each real point does not supply a common complex
    strip or a uniform coefficient norm. These are deliberately separate tests.
    """
    database=find(context['inputs'],'source-dag-checkpoint.sqlite')
    header_path=database.parent/'header.json'
    if file_sha(database)!=DB_SHA or file_sha(header_path)!=HEADER_SHA:
        raise ValueError('Changed original source prefix for global sign/norm calculation')
    header=read(header_path);registry={}
    def visit(obj):
        for k,v in obj.items():
            if k=='base' and isinstance(v,dict):visit(v)
            elif isinstance(v,str):
                try:d=json.loads(v)
                except (ValueError,TypeError):continue
                if k in registry:raise ValueError('Ambiguous actual original registry')
                registry[k]=d
    visit(header['definitions'])
    source=SourceRows(database);proof=ScalarProof(source,Parameters(expressions))
    result=progress if progress is not None else {}
    result.update({'schema':'MathScope.N6.ActualGlobalSourceInputAttempts/1',
        'sourceHeaderSHA256':HEADER_SHA,'sourceSQLiteSHA256':DB_SHA,'nodeBudget':source.limit,
        'actualSourceNodesRead':0,'attemptedTargets':0,'completedTargets':0,
        'rayleighInputs':[],'picardCoefficients':[],'actualPrimitivePrerequisitesEncountered':[],
        'rayleighRequiredFactorization':'P=2*a^2*F0^4*(vs-2), a=-gR/F0, vs=a+(gZ/F0)^2/a',
        'rayleighRequiredGlobalPremises':['F0>0','a>0','vs>2 on every actual representative'],
        'rayleighGlobalSourceEnvelopeProved':False,'actualCommonEtaStripProved':False,
        'actualHolomorphicCoefficientNormEnclosuresProved':False,
        'coefficientDerivativeTransportRetained':'A1*partial_eta W',
        'realFinitenessUsedAsComplexNormProof':False,'localCollarUsedAsGlobalImageProof':False})
    source.progress=result
    rayleigh=result['rayleighInputs']
    for name,i in [('F0',622971),('gR',622992),('gZ',622991),('strict-background-radicand',623005),('derived-background-slope',623008)]:
        result['attemptedTargets']+=1;result['currentTarget']={'kind':'Rayleigh','name':name,'originalSourceNode':i}
        v=proof.at(i);rayleigh.append({'name':name,'originalSourceNode':i,'node':source[i],
            'nodeSHA256':sha(source[i]),'computedFacts':serial_fact(v),
            'requestedSign':'positive' if name=='F0' else 'negative' if name=='gR' else 'no fixed sign required; enters Rayleigh as a square' if name=='gZ' else 'positive where the original active branch requires it',
            'requestedGlobalSignProved':None if name=='gZ' else positive(v) if name!='gR' else v['finite'] and v['signs']=={-1},
            'globalRayleighCertificate':False})
        result['completedTargets']+=1;result['actualSourceNodesRead']=len(source.memo)
    system=registry['picard'][0]
    if system['name']!='ActualSameN3OrderOneInner' or system['xi']!=25516 or system['eta']!=2:
        raise ValueError('Different original eta derivative-transport Picard system')
    picard=result['picardCoefficients']
    for group in ['A0','A1','forcing']:
        rows=system[group]
        targets=[(i,j,x) for i,row in enumerate(rows) for j,x in enumerate(row)] if group!='forcing' else [(i,None,x) for i,x in enumerate(rows)]
        for i,j,x in targets:
            result['attemptedTargets']+=1;result['currentTarget']={'kind':'Picard','group':group,'row':i,'column':j,'originalSourceNode':x}
            v=proof.at(x)
            picard.append({'group':group,'row':i,'column':j,'originalSourceNode':x,
                'nodeSHA256':sha(source[x]),'computedRealDomainFacts':serial_fact(v),
                'commonHolomorphicEtaStripRadius':None,'actualHolomorphicCoefficientNorm':None,
                'reason':'Real pointwise sign/smoothness does not bound the full coefficient on a common complex eta strip. Actual source root/series/inverse inputs and their captures require complex-domain and nonvanishing proofs.'})
            result['completedTargets']+=1;result['actualSourceNodesRead']=len(source.memo)
    original_guards=result['actualPrimitivePrerequisitesEncountered']
    for i,n in sorted(source.memo.items()):
        if n['op'] in ['inverse','log_positive','sqrt_positive']:
            v=proof.at(n['args'][0]);ok=nonzero(v) if n['op']=='inverse' else positive(v)
            original_guards.append({'originalSourceNode':i,'operation':n['op'],'argumentSourceNode':n['args'][0],
                'argumentNodeSHA256':sha(source[n['args'][0]]),'realGlobalArgumentPrerequisiteProved':ok,
                'complexStripNonvanishingEnclosure':None,'computedFacts':serial_fact(v)})
    result['actualSourceNodesRead']=len(source.memo);result['executionStatus']='COMPLETED_BOUNDED_ATTEMPT'
    result.pop('currentTarget',None)
    source.db.close();return result


def guard_attempt(guard,proof):
    kind=guard['kind'];ids=[guard[k] for k in ['operand','root','bound','value','body','binder','left','right','variable'] if k in guard]
    scalar_bindings=[{'scalarID':i,'node':proof.program[i],'nodeSHA256':sha(proof.program[i])} for i in sorted(set(ids))]
    value=proof.at(guard.get('operand',guard.get('root')))
    solved=False;method='exact symbolic sign and global smoothness abstract interpretation'
    if kind=='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN':solved=positive(value)
    elif kind=='NONZERO_ACTUAL_ARGUMENT':solved=nonzero(value)
    elif kind=='ORIGINAL_STEP_JET':
        node=proof.program[guard['operand']]
        if node['op']!='source_step_derivative' or guard['requestedOrder']!=node['args'][1]+1:
            raise ValueError('Original step jet source/order mismatch')
        solved=value['finite'] and value['smooth'];method='all-order flat-logistic induction plus globally smooth actual argument'
    elif kind=='ACTUAL_FINITE_INTEGRAL_LEIBNIZ':
        node=proof.program[guard['operand']]
        expected=[guard[k] for k in ['body','binder','left','right']]
        if node!={'op':'definite_integral','args':expected}:raise ValueError('Original integral body/binder/endpoints mismatch')
        solved=value['finite'] and value['smooth'];method='C-infinity integrand and endpoints on all real inputs, compact-interval Leibniz theorem'
    elif kind=='ACTUAL_MATCHING_FLAT_JOIN':
        method='attempt complete global branch/flat-join proof; no local-label substitution'
    elif kind=='ACTUAL_OPAQUE_SUBSTITUTION':
        method='attempt capture-safe substitution; hidden registry captures remain unproved'
    else:raise ValueError('Unknown original guard kind')
    reasons=sorted(value['stops'])
    if not solved and not reasons:reasons=[f'{kind}: required strict sign or global matching theorem not derivable from the actual bound expression']
    return {'originalGuard':guard,'sourceScalarBindings':scalar_bindings,
            'originalDomain':'Complete original j0 parameter/band/label/copy domain; the proof, when successful, holds on ALL real values of every scalar coordinate and therefore restricts to that domain.',
            'premises':['exact pinned parameter expressions','all coordinate inputs are finite real numbers'],
            'proofMethod':method,'evidence':serial_fact(value),
            'status':'PROVED_GLOBAL_PRIMITIVE_GUARD' if solved else 'OPEN',
            'provedByThisWorker':solved,'failureReasons':[] if solved else reasons,
            'localChartReceiptUsedAsGlobalProof':False}


def run(context,out):
    out=Path(out);matrix=read(context['matrix_path'])
    if matrix['parentNodesSHA256']!=PARENT:raise ValueError('Original parent changed')
    guards=matrix['originalIndependentCartesianDomainGuards']
    if dict(Counter(g['kind'] for g in guards))!=KINDS:raise ValueError('Original 94 guard inventory changed')
    checkpoint=read(find(context['baseline'],'cartesian-source-checkpoint.json'))
    cartesian=checkpoint['cartesian'];program=cartesian['scalarProgram']
    if cartesian['diagnostics']['conditionalDomainHypotheses']!=guards:raise ValueError('Source guard matrix/checkpoint mismatch')
    repo=Path(context['repo']);profile=repo/'research-ide/mathscope-m2/navier/source-profile-data.mjs'
    raw=profile.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=PROFILE_SHA:raise ValueError('Original exact parameter profile changed')
    step_path=repo/'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'
    if hashlib.sha256(step_path.read_bytes()).hexdigest()!=STEP_SHA:raise ValueError('Original step implementation changed')
    expressions=json.loads(raw.decode().split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'))['parametersExactExpressions']
    parameters=Parameters(expressions);proof=ScalarProof(program,parameters);rows=[]
    lemma=step_lemma();write(out/'step-all-orders-certificate.json',lemma)
    program_sha=sha(program)
    for index,guard in enumerate(guards):
        row=guard_attempt(guard,proof)
        row.update({'id':f'N6-C-{index:03d}-{sha(guard)[:12]}',
            'uniqueSourceID':f'{PARENT}/original-cartesian/{program_sha}/guard/{index}',
            'originalSourceParentSHA256':PARENT,'originalScalarProgramSHA256':program_sha})
        rows.append(row)
    # Independent replay with fresh caches; serialized completion flags have no authority.
    replay=ScalarProof(program,Parameters(expressions))
    for row in rows:
        if guard_attempt(row['originalGuard'],replay)!= {k:v for k,v in row.items() if k not in ['id','uniqueSourceID','originalSourceParentSHA256','originalScalarProgramSHA256']}:
            raise AssertionError('Exact guard certificate replay disagreed')
    counts=dict(Counter(row['status'] for row in rows));solved=sum(row['provedByThisWorker'] for row in rows)
    result={'schema':'MathScope.N6.CloudGlobalGuards/1','stage':'C','originalParentNodesSHA256':PARENT,
        'originalGuardCount':94,'attemptedGuardCount':len(rows),'globallyDischargedGuards':solved,
        'remainingGlobalGuards':94-solved,'countsByKind':KINDS,'countsByStatus':counts,'rows':rows,
        'sourceParameterProfileSHA256':PROFILE_SHA,'originalStepProducerSHA256':STEP_SHA,
        'exactParameterFacts':{name:serial_fact(parameters.parameter(name)) for name in sorted(expressions)},
        'visitedScalarNodes':len(proof.visited),'sourceScalarProgramSHA256':program_sha,
        'stepAllOrdersCertificateSHA256':sha(lemma),'independentCertificateReplayPassed':True,
        'actualGlobalSourceImageProved':False,'commonFullFieldSupportProved':False,
        'globalRayleighEnvelopeProved':False,'actualPicardHolomorphicNormsProved':False,
        'sampledPointsUsedAsProof':False,'allOriginalGuardsRetained':True,
        'originalN601Complete':False,'originalN602Complete':False}
    # Save the complete 94-row work BEFORE supplemental global source traversal.
    # A budget stop or unsupported operation cannot erase successful primitive
    # calculations. Input fingerprint mismatch remains a hard worker failure.
    result['supplementalGlobalSourceAttemptStatus']='STARTED'
    write(out/'guard-result.json',result)
    global_attempts={}
    try:
        actual_global_attempts(context,expressions,global_attempts)
    except (RuntimeError,RecursionError,NotImplementedError) as error:
        global_attempts.update({'executionStatus':'PARTIAL_RESOURCE_OR_OPERATION_STOP',
            'failure':{'type':type(error).__name__,'message':str(error)},
            'allCompletedTargetAttemptsRetained':True,
            'rayleighGlobalSourceEnvelopeProved':False,'actualCommonEtaStripProved':False,
            'actualHolomorphicCoefficientNormEnclosuresProved':False})
    write(out/'actual-global-source-input-attempts.json',global_attempts)
    result['actualGlobalSourceInputAttemptsSHA256']=sha(global_attempts)
    result['supplementalGlobalSourceAttemptStatus']=global_attempts['executionStatus']
    write(out/'guard-result.json',result)
    print(json.dumps({k:result[k] for k in ['stage','attemptedGuardCount','globallyDischargedGuards','remainingGlobalGuards','visitedScalarNodes']}))
    return result
