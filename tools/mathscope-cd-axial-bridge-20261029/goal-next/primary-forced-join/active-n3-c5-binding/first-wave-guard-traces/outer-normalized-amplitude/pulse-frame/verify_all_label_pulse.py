"""Bind and estimate all actual first Forced palette matrices on the outer chart."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
import json
import sys

PINS = {
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'first':'6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27',
    'primary':'c6d6d4a2e5d0c395cef6c758c0a8ce310ec80e82d3e4dbcecf15d83bc708e521',
    'wave':'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    'matrix':'7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26',
    'band':'a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b',
    'forced':'1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3',
    'kernel':'866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9',
    'outer':'d0a991f5e789aae7aa35dd8c18b9a82d9be40b8f31955ce9f166b108aef00c0c',
    'bounds':'b5e96a01ba3a64c2d8b07c4562cccc3bf5c062180a1b0fb8cae9bd799e896d88',
    'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}
STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
R,Z,T,V,ELL,Y0,Y1=17732748,17732749,17732750,17732751,17732737,17745430,17745431
EPS,KF,LS,C0,LAMBDA0=17732744,17732747,17733029,17733010,17733008
FORMALS=[17732753,17732754,17732755]
ACTUALS=[17733951,17733956,17733936]
KBASE=[[0,17733152,0],[17733154,0,0],[17733121,0,0]]
FRAMES={
    1:{'n':[17733136,17733138,17733142],'np':[17733143,0,17733145],'q':17733150,
       'p':17733113,'rounded':17733111,'pz':17733103,'x0':17733115,'HR':17733123,'HZ':17733128,
       'Aphi':[[17733164,17733168,17733170],[17733174,17733176,17733178],[17733182,17733184,17733186]],
       'tau':17733208,'s':17733216,'sroot':17733220,'c':17733221,
       'B':[[1,1],[17733231,17733233],[17733235,17733237]],
       'BL':[[19,17733285,17733286],[19,17733287,17733288]],
       'lambda':17733340,'dref':17733343,'d':17733344,'P':17733391,'PIntegral':17733390,'PBody':17733373},
    -1:{'n':[17733482,17733483,17733486],'np':[17733487,0,17733489],'q':17733494,
       'p':17733465,'rounded':17733464,'pz':17733456,'x0':17733467,'HR':17733473,'HZ':17733476,
       'Aphi':[[17733504,17733507,17733509],[17733512,17733514,17733516],[17733519,17733521,17733523]],
       'tau':17733545,'s':17733551,'sroot':17733555,'c':17733556,
       'B':[[1,1],[17733566,17733568],[17733570,17733572]],
       'BL':[[19,17733619,17733620],[19,17733621,17733622]],
       'lambda':17733675,'dref':17733677,'d':17733678,'P':17733724,'PIntegral':17733723,'PBody':17733707},
}


def pinned(path,key):
    raw=path.read_bytes()
    if path.suffix=='.py':
        raw=raw.replace(b'\r\n',b'\n')
    assert sha256(raw).hexdigest()==PINS[key], key
    return raw


class Forms:
    def __init__(self,g,exact,replacements):
        self.g=g
        self.a=exact(None)
        self.replacements=replacements
        self.atoms={}

    def atom(self,description):
        return {((self.atoms.setdefault(description,len(self.atoms)+1),1),):Q(1)}

    @cache
    def val(self,root,substitute,bound=()):
        G,E=self.g,self.a
        if root in bound:
            return self.atom(('bound',bound[::-1].index(root)))
        if substitute and root in self.replacements:
            return self.val(self.replacements[root],False,bound)
        op,args=self.node(root)
        def at(j):
            return self.val(j,substitute,bound)
        if op=='rational':
            return E.scalar(Q(*map(int,args)))
        if op=='add':
            return E.add(*(at(j) for j in args))
        if op=='multiply':
            return E.mul(*(at(j) for j in args))
        if op=='inverse':
            return E.inv(at(args[0]))
        if op=='integer_power':
            if abs(args[1])<=64:
                return E.pow(at(args[0]),args[1])
            return self.atom((op,self.freeze(at(args[0])),args[1]))
        if op in ('sqrt_positive','exp','log_positive','ceiling','smooth_piecewise','maximum'):
            return self.atom((op,tuple(self.freeze(at(j)) for j in args)))
        if op.endswith('_partial') and len(args)==3 and isinstance(args[1],list):
            return self.atom((op,args[0],tuple(self.freeze(at(j)) for j in args[1]),tuple(args[2])))
        if op=='definite_integral':
            body,binder,lo,hi=args
            return self.atom((op,self.freeze(self.val(body,substitute,bound+(binder,))),self.freeze(at(lo)),self.freeze(at(hi))))
        return self.atom(('root',root))

    @staticmethod
    def freeze(x):
        return tuple(sorted(x.items()))

    def node(self,i):
        node=self.g.record(i)
        return node['op'],node['args']

    def eq(self,u,v):
        gap=self.a.sub(u,v)
        return not gap or not self.a.clear_compound_denominators(gap)

    @cache
    def derivative_w(self,root):
        e=self.a
        if root==V:
            return e.one
        op,args=self.node(root)
        d=self.derivative_w
        at=lambda j:self.val(j,False)
        if op=='add':
            return e.add(*(d(j) for j in args))
        if op=='multiply':
            return e.add(*(e.mul(*(d(j) if a==b else at(j) for b,j in enumerate(args)))
                           for a in range(len(args))))
        if op=='inverse':
            child=args[0]
            return e.neg(e.mul(d(child),e.pow(at(child),-2))) if d(child) else e.zero
        if op=='integer_power':
            child,exponent=args
            return e.mul(e.scalar(exponent),e.pow(at(child),exponent-1),d(child)) if d(child) else e.zero
        if op=='sqrt_positive':
            return e.mul(d(args[0]),e.inv(e.mul(e.scalar(2),at(root)))) if d(args[0]) else e.zero
        assert V not in free(self.g,root), (root,op)
        return self.a.zero


def make_free(g):
    @cache
    def coords(i):
        rec=g.record(i)
        op,args=rec['op'],rec['args']
        if op=='coordinate':
            return frozenset({i})
        if op in ('rational','source_parameter'):
            return frozenset()
        if op=='definite_integral':
            body,binder,lo,hi=args
            return (coords(body)-{binder}) | coords(lo) | coords(hi)
        if op.endswith('_partial') and len(args)==3 and isinstance(args[1],list):
            children=args[1]
        elif op in ('actual_background_picard','actual_background_even_profile'):
            children=args[2:4]
        elif op=='actual_natural_series':
            children=args[1:3]
        elif op=='actual_monotone_root':
            children=args[1:]
        elif op=='actual_quadratic_root':
            children=args[2:3]
        elif op in ('actual_covariance_volterra','m3_global_pulse_jet'):
            children=[args[2],*args[3]]
        elif op=='m3_forced_pulse_partial':
            children=[args[3],*args[4]]
        elif op in ('integer_power','source_step_derivative'):
            children=args[:1]
        else:
            children=args
        assert all(isinstance(x,int) and x<i for x in children),(i,op)
        return frozenset().union(*(coords(x) for x in children))
    return coords


@cache
def free(g,i):
    return free_function(g)(i)


@cache
def free_function(g):
    return make_free(g)


def verify_original(g,exact,homogeneous):
    F=Forms(g,exact,{})
    e=F.a
    at=lambda i:F.val(i,False)
    eq=F.eq
    mm=lambda x,y:[[e.dot(row,col) for col in zip(*y,strict=True)] for row in x]
    out={}
    root=at(17727106)
    u=at(17727098)
    eps,k,l=at(EPS),at(KF),at(LS)
    [ki]=g.args(KF,'ceiling')
    [eps_sqrt]=g.args(ki,'inverse')
    assert g.args(eps_sqrt,'sqrt_positive')==[EPS]
    assert eq(l,e.mul(at(14220488),e.inv(at(17733027))))
    assert eq(at(14220489),e.mul(at(14220488),at(14220487)))
    assert all(free(g,i).isdisjoint({R,Z,T,V,Y0,Y1}) for i in ACTUALS)
    for label,rec in sorted(FRAMES.items()):
        n,np=map(lambda p:list(map(at,rec[p])),('n','np'))
        q=at(rec['q'])
        assert eq(q,e.dot(n,n))
        assert np==list(map(F.derivative_w,rec['n']))
        p=at(rec['p'])
        assert eq(n[1],e.mul(p,e.inv(at(R))))
        assert eq(p,e.mul(at(rec['rounded']),e.inv(k)))
        rounded,lower,upper,left,inside,right=g.args(rec['rounded'],'smooth_piecewise')
        assert rounded==left==right and g.rational(lower)==Q(-1,2) and g.rational(upper)==Q(1,2)
        rounded_node=g.record(rounded)
        assert rounded_node['op']=='multiply' and g.rational(rounded_node['args'][0])==-1
        g.args(rounded_node['args'][1],'ceiling')
        scaled,*ends=g.args(inside,'smooth_piecewise')
        assert [g.rational(j) for j in ends]==[0,0,-1,1,1]
        assert eq(at(rounded_node['args'][1]), F.atom(('ceiling',(F.freeze(e.neg(e.add(at(scaled),e.scalar(Q(1,2))))),))))
        assert free(g,rec['rounded']) <= set(FORMALS+[ELL])
        KD=[list(map(at,rs)) for rs in KBASE]
        row=[e.sub(e.dot(n,col),a) for col,a in zip(zip(*KD,strict=True),np,strict=True)]
        A=[[e.add(e.neg(KD[i][j]),e.mul(n[i],row[j],e.inv(q))) for j in range(3)] for i in range(3)]
        assert all(eq(A[i][j],at(rec['Aphi'][i][j])) for i in range(3) for j in range(3))
        assert eq(at(rec['d']),e.mul(eps,k,k,q))
        tau,c,sroot,s=[at(rec[key]) for key in ('tau','c','sroot','s')]
        tau2,=g.args(rec['tau'],'sqrt_positive')
        assert eq(at(tau2),e.add(e.mul(n[1],n[1]),e.mul(n[2],n[2])))
        assert eq(s,e.mul(e.scalar(label),u,e.add(e.scalar(Q(1,2)),e.mul(at(V),e.inv(l)))))
        square,=g.args(rec['sroot'],'sqrt_positive')
        assert eq(at(square),e.add(e.one,e.mul(s,s)))
        assert eq(c,e.mul(at(C0),sroot))
        ka=[e.mul(x,e.inv(tau)) for x in n[1:]]
        na=[ka[1],e.neg(ka[0])]
        sa=e.mul(n[0],e.inv(tau))
        U=[[e.one,e.zero],[e.neg(e.mul(sa,ka[0])),na[0]],[e.neg(e.mul(sa,ka[1])),na[1]]]
        J=[[e.one,e.one],[c,e.neg(c)]]
        UL=[[e.one,e.zero,e.zero],[e.zero,*na]]
        JI=[[e.scalar(Q(1,2)),e.mul(e.scalar(Q(1,2)),e.inv(c))],
            [e.scalar(Q(1,2)),e.neg(e.mul(e.scalar(Q(1,2)),e.inv(c)))]]
        B,BL=mm(U,J),mm(JI,UL)
        assert all(eq(B[i][j],at(rec['B'][i][j])) for i in range(3) for j in range(2))
        if label==-1:
            raw_products={frozenset(g.record(i)['args']):i for i in range(17733573,17733686)
                          if g.record(i)['op']=='multiply'}
            rec['BL']=[[19,raw_products[frozenset((j,17733548))],raw_products[frozenset((j,17733549))]]
                       for j in (17733563,17733564)]
        assert all(eq(BL[i][j],at(rec['BL'][i][j])) for i in range(2) for j in range(3)),(label,rec['BL'])
        AB=mm(A,B)
        sub=[[e.sub(AB[i][j],F.derivative_w(rec['B'][i][j])) for j in range(2)] for i in range(3)]
        Tmat=mm(BL,sub)
        lam=at(rec['lambda'])
        dref=at(rec['dref'])
        assert eq(lam,e.mul(at(LAMBDA0),e.inv(sroot)))
        assert eq(dref,e.mul(at(LAMBDA0),at(square),e.inv(e.pow(root,3))))
        base=homogeneous[0 if label==1 else 1]
        assert base['variable']==V and base['length']==LS and base['initial']==[1,0]
        assert json.loads(base['originalDefinition'])['name']==f'M3OwnGlobalBandPulse_{label}'
        shift=e.sub(e.add(at(rec['d']),lam),dref)
        for i,row in enumerate(base['matrix']):
            for j,actual in enumerate(row):
                assert eq(at(actual),e.sub(Tmat[i][j],shift) if i==j else Tmat[i][j]),(label,i,j)
        assert g.args(rec['P'],'exp')==[rec['PIntegral']]
        body,binder,mid,endpoint=g.args(rec['PIntegral'],'definite_integral')
        assert body==rec['PBody'] and endpoint==V and eq(at(mid),e.mul(e.scalar(Q(1,2)),l))
        shifted=Forms(g,exact,{V:binder})
        assert shifted.eq(shifted.a.sub(shifted.val(rec['lambda'],True),shifted.val(rec['dref'],True)),
                          shifted.val(body,False)),label
        assert not free(g,rec['P'])&{R,Z,T,Y0,Y1}
        out[str(label)]={**rec,'originalMatrix':base['matrix'],'referenceIndependentOfSlowAndY':True}
    return out


def bind_native(g,exact,first,systems,definitions):
    wrappers={(d['name'],d['body'],tuple(d['parameters'])):d['id'] for d in definitions
              if d['name'].startswith('CoupledForced_source_')}
    results=[]
    for row in first:
        key,mode=row['key'],row['harmonic']
        level,sign=map(int,key.split(':'))
        rec=FRAMES[sign]
        system=systems[row['system']]
        w=system['variable']
        replacements=dict(zip(FORMALS+[V],ACTUALS+[w],strict=True))
        F=Forms(g,exact,replacements)
        assert system['length']==LS and system['id']==row['system'] and system['forcing']==row['projected']
        assert system['directions']==[R,Z,T,Y0,Y1]
        assert system['left']==0 and system['initial']==[{'real':0,'imaginary':0}]*3
        for i,r in enumerate(system['matrix']):
            for j,native in enumerate(r):
                original=F.val(rec['Aphi'][i][j],True)
                if i==j:
                    original=F.a.sub(original,F.a.mul(F.a.scalar(mode*mode),F.val(rec['d'],True)))
                assert F.eq(original,F.val(native,False)),(key,mode,i,j,native)
                assert free(g,native).isdisjoint({Y0,Y1})
        # The registered cubic generator keeps the normal denominator in each
        # projection. Collect it from an actual diagonal matrix operand and
        # prove that it is the same frozen q node.
        candidates=[]
        used=set()
        def visit(i,depth):
            if depth<0 or i in used:return
            used.add(i)
            op,aa=F.node(i)
            if op=='inverse' and F.eq(F.val(aa[0],False),F.val(rec['q'],True)):
                candidates.append(aa[0])
                return
            if op in ('add','multiply','inverse'):
                for j in aa:visit(j,depth-1)
        for i in (0,2):
            visit(system['matrix'][i][i],10)
        assert candidates,(key,mode)
        q=candidates[0]
        def square_terms(i):
            op,aa=F.node(i)
            if op=='add':
                return [z for child in aa for z in square_terms(child)]
            assert op=='multiply' and aa[0]==aa[1],(i,op)
            return [aa[0]]
        nc=square_terms(q)
        n=[]
        for orig in rec['n']:
            [ii]=[root for root in nc if F.eq(F.val(root,False),F.val(orig,True))]
            n.append(ii)
        assert free(g,n[1]).isdisjoint({w,Y0,Y1})
        ntheta=F.val(n[1],False)
        assert F.eq(ntheta,F.a.mul(F.val(rec['p'],True),F.a.inv(F.val(R,False))))
        E=F.a
        original_normal=[F.val(a,False) for a in n]
        inverse_q=E.inv(F.val(q,False))
        projected_rhs_count=0
        for part in ('real','imaginary'):
            mathematical_inputs=[wrappers[(f'CoupledForced_source_{j}_{part}',row['originalSource'][j][part],
                                           tuple([w,*system['parameters']]))] for j in range(3)]
            targets={}
            @cache
            def search(node):
                op,aa=F.node(node)
                if op=='m3_coupled_expression_partial' and aa[0] in mathematical_inputs:
                    assert aa[1]==[w,*system['parameters']] and not any(aa[2])
                    assert aa[0] not in targets or targets[aa[0]]==node
                    targets[aa[0]]=node
                elif op in ('add','multiply'):
                    for j in aa:search(j)
            for a in system['forcing']:search(a[part])
            x=[F.val(targets[j],False) for j in mathematical_inputs]
            projection_rows=[[E.sub(E.one if i==j else E.zero,E.mul(a,b,inverse_q))
                              for j,b in enumerate(original_normal)]
                             for i,a in enumerate(original_normal)]
            for i,a in enumerate(system['forcing']):
                assert F.eq(F.val(a[part],False),E.neg(E.dot(projection_rows[i],x))),(key,mode,i,part)
                projected_rhs_count+=1
        if level==0 and mode==1:
            wrong=Forms(g,exact,{**replacements,V:V})
            assert not wrong.eq(wrong.val(rec['n'][0],True),wrong.val(n[0],False))
        results.append({'key':key,'mode':mode,'system':row['system'],'boundPulse':w,'matrix':system['matrix'],
                        'nativeNormal':n,'nativeNormalSquared':q,'normalIsOriginalFrozen':True,
                        'noYDerivativeOnMatrix':True,'samePositiveKAndEpsilon':True,
                        'exactNegativeOrthogonalProjectionScalars':projected_rhs_count})
    assert len(results)==20
    assert len({(r['key'],r['mode']) for r in results})==20
    return results


def verify_primary_factor(g,exact,registry,wave):
    base=json.loads(registry['base']['base']['expression'])
    defs=json.loads(registry['definitions'])[0]
    named={d['name']:(i,d) for i,d in enumerate(base)}
    original=Forms(g,exact,{})
    potential_tables={}
    def weight(F,factor,root,native_rule):
        @cache
        def go(i):
            op,aa=F.node(i)
            if op=='exp' and F.node(aa[0])[0]=='definite_integral' and F.val(i,False)==factor:
                return 1
            if op=='add':return min(go(i) for i in aa)
            if op=='multiply':return sum(go(i) for i in aa)
            if op=='integer_power':return aa[1]*go(aa[0])
            return native_rule(i,op,aa)
        return go(root)
    for sign in (1,-1):
        original_p=original.val(FRAMES[sign]['P'],False)
        indices=[]
        for j in range(3):
            idx,row=named[f'GlobalOriginalPotential_{sign}_{j}']
            assert weight(original,original_p,row['body'],lambda *_:0)>=1,(sign,j)
            assert {V,*FORMALS}<=set(row['parameters'])
            indices.append(idx)
        potential_tables[sign]=indices
    out=[]
    for case in wave['cases']:
        if case['mode']!=1:continue
        key=case['key'].replace(':','_')
        sign=int(case['key'].split(':')[1])
        replacements=dict(zip(FORMALS+[V],ACTUALS+[case['pulse']],strict=True))
        F=Forms(g,exact,replacements)
        p=F.val(FRAMES[sign]['P'],True)
        used=set()
        def native(i,op,aa):
            if op=='actual_expression_partial' and aa[0] in potential_tables[sign]:
                info=base[aa[0]]
                at=dict(zip(info['parameters'],aa[1],strict=True))
                assert all(F.eq(F.val(at[j],False),F.val(k,False)) for j,k in replacements.items()),(case['key'],i)
                # This exact Primary curl uses formal slow or transverse
                # partials. The original P is independent of those formals.
                assert all(not q or v not in {V,*FORMALS} for v,q in zip(info['parameters'],aa[2],strict=True))
                used.add(i)
                return 1
            return 0
        proof={}
        for d in defs:
            if d['name'].startswith((f'InitializedOriginalWave_{key}_',f'InitializedOriginalPrimaryPressure_{key}_',f'OriginalPrimaryPrincipalFlat_{key}_')):
                assert weight(F,p,d['body'],native)>=1,(case['key'],d['name'],d['body'])
                proof[d['name']]=d['body']
        assert len(proof)==10 and used
        out.append({'chart':case['key'],'sourcePulse':case['pulse'],'checkedBodies':proof,
                    'inheritedPotentialDefinitions':potential_tables[sign],'retainedPotentialCalls':sorted(used)})
    assert len(out)==10
    return out


def symbolic_caps():
    # Pair (coefficient, exponent) bounds a positive expression by c*M^p,
    # where M is the common algebraic source cap, M>=1. Sum uses M>=1.
    def plus(*terms):
        return sum((c for c,_ in terms),Q(0)),max(p for _,p in terms)

    def times(*terms):
        c,p=Q(1),0
        for d,q in terms:
            c*=d
            p+=q
        return c,p

    def jmul(a,b):
        return [plus(*(times((comb(j,k),0),a[k],b[j-k]) for k in range(j+1)))
                for j in range(5)]

    def jadd(*sequences):
        return [plus(*terms) for terms in zip(*sequences,strict=True)]

    def jscale(k,seq):
        return [times(k,x) for x in seq]

    def const(x):
        return [x]+[(Q(0),0)]*4

    N=[(27,6)]*5
    NP=[(2,2)]*5
    K=[(7,2)]*5
    MU=(1,1)
    assert N[0]==plus((24,6),(3,3)) and K[0]==plus((1,2),(6,1))
    q=jscale((3,0),jmul(N,N))
    qw=jscale((6,0),jmul(N,NP))
    recip=[MU]
    for j in range(1,5):
        recip.append(times(MU,plus(*(times((comb(j,k),0),q[k],recip[j-k])
                                      for k in range(1,j+1)))))
    invsqrt=[MU]
    for j in range(1,5):
        # Multiplicities of block sizes in the ordinary labelled chain rule.
        # This also bounds arbitrary distinct R/Z mixed derivatives of total j.
        from itertools import product
        terms=[]
        for counts in product(*(range(j//i+1) for i in range(1,j+1))):
            if sum(i*c for i,c in enumerate(counts,1))!=j:continue
            r=sum(counts)
            part=Q(factorial(j))
            for i,c in enumerate(counts,1):
                part/=factorial(i)**c*factorial(c)
            radial=Q(factorial(2*r),4**r*factorial(r))
            terms.append(times((part*radial,r+1),
                               *(q[i] for i,c in enumerate(counts,1) for _ in range(c))))
        invsqrt.append(plus(*terms))
    rw=jmul(qw,jmul(recip,recip))
    sw=jscale((Q(1,2),0),jmul(qw,jmul(invsqrt,jmul(invsqrt,invsqrt))))
    # The original u=2/kappa is >=2. The cap M includes u*|c0|.
    # For |s|<=3u/2, (2u)^2 >= 1+(3u/2)^2, and
    # |c_w|<=|c0|*u/L_s since |s|/sqrt(1+s^2)<=1.
    assert (4-Q(9,4))*4>=1
    c,cw,cinv=(2,1),(1,2),MU
    frame=jadd(const((1,0)),jmul(jmul(N,N),recip),jscale(c,jmul(N,invsqrt)))
    frame_w=jadd(jscale((2,0),jmul(jmul(N,NP),recip)),jmul(jmul(N,N),rw),
                 jscale(cw,jmul(N,invsqrt)),jscale(c,jmul(NP,invsqrt)),jscale(c,jmul(N,sw)))
    left=jadd(const((Q(1,2),0)),jscale(times((Q(1,2),0),cinv),jmul(N,invsqrt)))
    projection=jadd(const((1,0)),jmul(jmul(N,N),recip))
    phi=jadd(K,jmul(recip,jadd(jscale((3,0),jmul(jmul(N,N),K)),jmul(N,NP))))
    normalized=jadd(jscale((9,0),jmul(jmul(left,phi),frame)),jscale((3,0),jmul(left,frame_w)),
                    const((5,1)),jscale((16,0),q))
    assert [p for _,p in recip]==[1,14,27,40,53]
    assert [p for _,p in normalized]==[36+13*j for j in range(5)]
    # B>=2, S>=B^512 gives 2*B^12/S < 1/(2B) for the transverse error.
    assert 512-12-1==499 and Q(2,2**499)<Q(1,2)
    result={
        'commonCapM':'max(1,Renv,1/Rmin,B5,carrierCap,L_s,1/L_s,lambda0,u*abs(c0),1/abs(c0),4*Renv^2/epsilon)',
        'carrierCap':'max(abs(p),abs(pz),abs(x0)); original rounding bounds abs(p) by abs(p_tilde)+1/k',
        'numberAwareDenominators':{
            'positiveSourceK':'k=ceil(1/sqrt(epsilon)), 1<=k<=2/sqrt(epsilon)',
            'movingNormalSquaredAndTransverseSquared':'Both >=(p/R)^2>=epsilon/(4*Renv^2)',
            'physicalPressureDenominatorInverse':'1/(m*k*|n|^2) <= k*Renv^2/m <=2*Renv^2/(m*sqrt(epsilon))',
            'leftBasisScale':'Original u=2/kappa>=2 and |s|<=3u/2. Thus |c|=|c0|*sqrt(1+s^2)<=2u*|c0| and |c_w|<=u*|c0|/L_s. The source keeps |c0|>=Renv^-6.',
            'fixedPalette':'i=floor(((1+h)*ell*log(2)-2*log(ell))/log(Tg)), ci=Tg^i*Q^(1+h)',
            'exactLengthRange':'Q=2^-ell gives 1/(Tg*S)<ci<=1/S and 2*r0<=L_s/S<2*r0*Tg=Lmax',
            'sameSourcePerturbativeFloor':'B=Bnorm>=2, S>=B^512, Bs>B^-1, and transverse component perturbation <=B^12/S give tau>=B^-2. Hence q^-1,tau^-2 <=B^4 and inverse physical pressure denominator <=B^4/m.',
        },
        'sameSourcePolynomialInBand':'On the source perturbative cone replace 4*Renv^2/epsilon in M by Bnorm^4. The source has |p|,|pz|<=Bnorm^5, |x0|<=max(1,lambda0) since u/(1+u^2)^(3/4)<=1 and epsilon*k^2>=1, lambda0<=Renv^83, |c0| in [Renv^-6,Renv^10], and Lmin<=L_s/S<=Lmax. The fixed u*|c0| is at most 2*Renv^20 since u=2*Renv^10. Thus M<=C*S for a common finite source-only C using the same B5 and Rmin.',
        'slowDerivativeNormB5':'any admitted same-source uniform cap for F and G through slow order five',
        'entryUpperBoundConvention':'pair [c,p] bounds the maximum absolute scalar entry of every R/Z derivative of the stated total order by c*M^p; L derivatives vanish for these matrices',
        'compiledCapRows':{name:[[str(c),p] for c,p in seq]
                           for name,seq in {'normal':N,'normalPrime':NP,'cylindricalK':K,
                                            'inverseNormalSquared':recip,'inverseTransverseLength':invsqrt,
                                            'projection':projection,'movingBasis':frame,'movingBasisPrime':frame_w,
                                            'basisLeftInverse':left,'normalizedPulseMatrix':normalized}.items()},
        'normConversion':'2x2 induced infinity norm <= 2 times scalar entry cap; 3x3 <= 3 times scalar entry cap',
        'tangency':'If g=-Pi*f, original unnormalized c=n^T u satisfies cprime=-m^2*d*c, c(0)=0. Hence c=0 for every finite parameter and B*Bleft*u=u.',
        'normalizedEquation':'z=Bleft*u/P satisfies zprime=(wMatrix-(m^2-1)*d*I)*z+Bleft*g/P with zero initial data.',
        'propagatorUpperTogetherWithOriginalAdmittedLogErrors':'exp(3*Bnorm^256*Lmax), independent of ell for the same source family. No reciprocal P(s) is used in this estimate.',
        'physicalForcingNormalization':'Primary velocity, pressure and principal tail all carry P; ordinary differentiated factors P^(j)/P remain finite by the reference rate recurrence. The mode-two P^2/P=P<=1 is retained.',
    }
    return result


def main():
    parser=ArgumentParser(description=__doc__)
    for k in ('goal','runtime','outer-runtime','artifact','cache','out'):
        parser.add_argument('--'+k,type=Path,required=True)
    args=parser.parse_args()
    assert __debug__
    active=args.goal/'primary-forced-join/active-n3-c5-binding'
    r3=args.runtime/'research-ide/mathscope-m3/navier'
    r2=args.outer_runtime/'research-ide/mathscope-m2/navier'
    hou=args.artifact/'first-correction-spatial-source'
    paths={
        'manifest':hou/'original-source-export-manifest.json','registry':hou/'original-source-functions.json',
        'primary':args.artifact/'primary-c5-native.json','first':args.artifact/'same-family-mode-two.json',
        'wave':active/'live-wave-gauge/forced/forced-wave.json',
        'matrix':r2/'actual-covariance-matrix.mjs','outer':r2/'actual-outer-covariance-flat-extension.mjs',
        'bounds':r2/'actual-covariance-operator-bounds.mjs',
        'band':r3/'source-global-band.mjs','forced':r3/'source-global-forced-current.mjs','kernel':r3/'source-forced-pulse.mjs',
        'cache':active/'live-wave-gauge/signed/source_cache.py','reader':active/'spatial-readback/verify_spatial_artifact.py',
        'exact':args.goal/'first-force-repair/verify_repaired_first_force.py',
    }
    d={key:pinned(path,key) for key,path in paths.items()}
    manifest,registry,primary,first,wave=map(lambda k:json.loads(d[k]),('manifest','registry','primary','first','wave'))
    assert primary['source']['allConstantsFromSamePrivateFamily'] and primary['source']['ownM3CurrentSeal']
    checked={row['id']:row['pass'] for row in primary['nativeChecks']}
    assert checked['both-complete-stable-pulse-bindings-and-original-amplitudes']
    assert checked['same-primitive-determinant-and-weight-floors']
    assert primary['backgroundRow']['backgroundDerivativeOrder']==8
    assert b'muInfinityUpper:G.div(G.mul(q(3),E),g.S)' in d['outer']
    assert b'sourceOperatorError:E,sourceDampingError:E' in d['outer']
    assert b'paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient)))' in d['band']
    assert b'ci=G.mul(power(Tg,paletteIndex),power(Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci)' in d['band']
    assert b'positiveDenominators:' in d['bounds'] and b'|n_tan|>=B^-2' in d['bounds']
    assert b'S>=B^512' in d['bounds'] and b'|p|,|pz| <= B^5' in d['bounds']
    assert b'K=old.principalK' in d['forced'] and b'normalBeforePath.map' in d['forced']
    sys.path[:0]=[str(paths[k].parent) for k in ('cache','reader','exact')]
    import source_cache
    import verify_spatial_artifact
    from verify_repaired_first_force import Exact
    graph=source_cache.load(verify_spatial_artifact,hou,manifest,22153782,args.cache)
    try:
        assert graph.verify['sha256']==STREAM
        homogeneous=json.loads(registry['base']['base']['m3GlobalPulses'])
        all_frames=verify_original(graph,Exact,homogeneous)
        print('verified both original moving frames and envelope integrands',flush=True)
        groups=json.loads(registry['definitions'])
        rows=bind_native(graph,Exact,first['full']['rows'],groups[3],groups[0])
        print('verified all 180 native matrices and 120 projected scalars',flush=True)
        primary_weights=verify_primary_factor(graph,Exact,registry,wave)
    finally:
        graph.__exit__(None,None,None)
    result={'status':'VERIFIED_ALL20_ACTUAL_FIRST_FORCED_FRAME_MATRIX_AND_ORIGINAL_NORMALIZED_PULSE',
            'sourceStream':graph.verify,'inputPins':PINS,'verifiedOriginalFrames':all_frames,
            'firstForcedRows':rows,'verifiedNativeMatrixEntries':9*len(rows),
            'verifiedNativeProjectedScalars':sum(row['exactNegativeOrthogonalProjectionScalars'] for row in rows),
            'actualPrimaryFactorOnEveryChart':primary_weights,
            'verifiedOriginalC8NormRoot':primary['backgroundRow'],
            'finiteParameterCaps':symbolic_caps(),
            'numericGradientsEvaluated':False,'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf8',newline='\n') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
    print(result['status'],len(rows))


if __name__=='__main__':
    main()
