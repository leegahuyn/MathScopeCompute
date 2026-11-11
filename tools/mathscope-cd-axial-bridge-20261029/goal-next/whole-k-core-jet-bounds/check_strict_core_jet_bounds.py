"""Exact local original core-jet interval transfer, with source-bound norm factors."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha1, sha256
from itertools import product
from pathlib import Path
import gzip
import json
import subprocess

from sympy import Rational, diff, simplify, symbols

HERE=Path(__file__).resolve().parent
NEXT=HERE.parent
COMMIT='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
M2='research-ide/mathscope-m2/navier/'
ATOMS='1f342570c0ac63a919441ed999860c835574299b73a2c36fb1b1c658b386876f'
ENDPOINT='de578dd4f456e8ad698f33baa8302bd65af8550d53e4317589946aacc85be28f'
REGISTRY='f8440a02d382dc2e07c9f074d4dbe1e3ab4f8e3697f9c92644bd0bc1ae45a6f1'
HIGH='091007ee09d78be9405c5b8c62dc994aa5b6dd1e6cbcbc57a0f2fb89ff06db7b'
CHART='af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9'
Y,eta,h=symbols('Y eta h',real=True)
D=Rational(1,2)-h
A=Rational(1,2)+h
L=1-2*h*eta**2
WEIGHTS={'a':A,'b':A+Rational(1,2),'p_loc':2*A}
FIELDS={'a':'StreamOverR','b':'E','p_loc':'Pi'}
ZERO=(0,0,0)


def need(ok, explanation):
    if not ok:
        raise ValueError(explanation)


def pinned(path,digest):
    raw=path.read_bytes()
    need(sha256(raw).hexdigest()==digest,f'pinned {path.name}')
    return json.loads(raw)


def source_leading(repo,graph):
    pins={
        'actual-covariance-sensitivity.mjs':'e7e3d31bd83f321bb3006121059e5bfc842ad378',
        'actual-leading-all-order-jets.mjs':'221e1923bd615dddfa2d32b161d000feb57de2b6',
        'actual-continuation-exact-core.mjs':'b877d5962a6051cf4fe48eef575c8ad31fb5de1a',
    }
    for name,oid in pins.items():
        raw=subprocess.check_output(['git','-C',str(repo),'show',f'{COMMIT}:{M2}{name}'])
        actual=sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()
        need(actual==oid,f'actual source {name}')
        if name.startswith('actual-leading'):
            need(b"|P|<=5K on |Im eta|<=1/16" in raw and
                 b"G.mul(q(5),P('K'),J.geometric(q(32),k))" in raw,
                 'actual normalized A.21 pressure value and first eta bound')
        if name.startswith('actual-covariance'):
            need(b"Cp=prefix('Cp',G.pow(F,2))" in raw and
                 b'Pi=G.add(G.core.P0,Cp)' in raw, 'same original leading pressure datum and prefix')
    expected={
        3451:('multiply',[3449,3450]),3450:('integer_power',[10,2]),
        10:('source_parameter',['Pstar']),3454:('source_parameter',['Lambda']),
        3457:('inverse',[3454]),3617:('source_parameter',['Xa']),
        4757:('multiply',[3454,4756]),4758:('actual_natural_series',['Phi',4757,2,0,0]),
        4759:('multiply',[3498,4758]),6257:('source_parameter',['loopILeft']),
        9239:('smooth_piecewise',[4756,6257,7982,5293,9238,5293]),
        5293:('smooth_piecewise',[4756,4567,5089,5270,5292,5173]),
        5270:('smooth_piecewise',[4756,4564,4567,5260,5269,4678]),
        5260:('smooth_piecewise',[4756,3617,3618,5180,5255,5259]),
        5180:('multiply',[5176,5179]),5176:('multiply',[3457,4757]),
        5179:('add',[3459,5178]),5178:('multiply',[3457,5177]),
        5177:('actual_natural_series',['average',4757,2,0,0]),
        4567:('multiply',[12,4566]),4564:('multiply',[12,4563]),
        4566:('exp',[4565]),4563:('exp',[4562]),
        4565:('rational',['-7','1']),4562:('rational',['-8','1']),
        12:('source_parameter',['XR']),
        71959:('smooth_piecewise',[4756,3617,71673,4759,71958,71958]),
        117100:('actual_expression_partial',[2,[4756,2],[0,0]]),
        117101:('actual_expression_partial',[3,[4756,2],[0,0]]),
        617757:('add',[3451,617756]),
        617756:('actual_expression_partial',[677,[4756,2],[0,0]]),
        617755:('definite_integral',[617754,617752,0,4756]),
        617754:('integer_power',[617753,2]),
        617753:('actual_expression_partial',[2,[617752,2],[0,0]]),
    }
    with gzip.open(graph/'original-source-nodes.jsonl.gz','rb') as f:
        next(f)
        for i,line in enumerate(f):
            if i in expected:
                row=json.loads(line)
                need((row['op'],row['args'])==expected[i],f'literal leading core node #{i}')
            if i==max(expected):
                break
    raw=(graph/'original-source-functions.json').read_bytes()
    need(sha256(raw).hexdigest()==REGISTRY,'same pinned original native registry')
    defs=json.loads(json.loads(raw)['base']['base']['expression'])
    for i,body in [(2,71959),(3,9236),(677,617755)]:
        need(defs[i]['body']==body and defs[i]['parameters']==[4756,2],
             f'literal actual formal-to-source binding {i}')
    return {'sourceBlobs':pins,'graphNodesChecked':len(expected),
            'F0':117100,'U0':117101,'M0':9239,'M0StrictCoreBranch':5180,
            'M0StrictCoreFormula':'X*(Ustar+Lambda^-1*actual_natural_average(Lambda*X,eta))',
            'pressure':617757,'axisDatumP0':3451,'pressurePrefix':617756,
            'pressureBinder':617752,'pressureIntegrand':'(actual F0 at [binder,eta])^2',
            'pressureNormalization':'original A.21 datum plus exact radial prefix, no adjustable constant'}


def interval_add(a,b):
    return a[0]+b[0],a[1]+b[1]


def interval_mul(a,b):
    values=[x*y for x in a for y in b]
    return min(values),max(values)


@lru_cache(None)
def interval(expr):
    if expr.is_Rational:
        q=F(int(expr.p),int(expr.q))
        return q,q
    if expr in (Y,eta,h):
        return {Y:(F(2),F(5,2)),eta:(F(-1,4),F(1,4)),h:(F(0),F(1,64))}[expr]
    if expr.is_Add:
        out=(F(0),F(0))
        for term in expr.args:
            out=interval_add(out,interval(term))
        return out
    if expr.is_Mul:
        out=(F(1),F(1))
        for term in expr.args:
            out=interval_mul(out,interval(term))
        return out
    if expr.is_Pow:
        base,n=expr.args
        need(n.is_Integer,f'non-rational coefficient power {expr}')
        n=int(n)
        lo,hi=interval(base)
        power=abs(n)
        a,b=lo**power,hi**power
        bound=(F(0),max(a,b)) if power%2==0 and lo<=0<=hi else (min(a,b),max(a,b))
        if n>=0:
            return bound
        need(bound[0]>0 or bound[1]<0,f'coefficient denominator touches zero {expr}')
        return 1/bound[1],1/bound[0]
    raise ValueError(f'unsupported coefficient {expr}')


def magnitude(expr):
    return max(map(abs,interval(expr)))


def verify_chart_operators():
    q,lam=symbols('q lam',positive=True)
    physical=(2*q*Y/lam,q**D*eta,q*(1-eta**2))
    operators=((0,lam/(2*q),0),
               tuple(q**(-D)*v/L for v in (2*eta,-2*eta*Y,1-eta**2)),
               tuple(q**-1*v/L for v in (1,-Y,-D*eta)))
    for i,vector in enumerate(operators):
        for j,coord in enumerate(physical):
            partials=(q*diff(coord,q),diff(coord,Y),diff(coord,eta))
            need(simplify(sum(v*d for v,d in zip(vector,partials))-int(i==j))==0,
                 'exact inverse physical coordinate operators')
    return {'verifiedEntries':9,'coordinates':['s','z','tau'],'profile':['log(q)','Y','eta']}


def operator(terms,w,axis,weighted):
    if axis==0:
        flow=(0,Rational(1,2),0)
        shift=1
    elif axis==1:
        flow=(2*eta/L,-2*eta*Y/L,(1-eta**2)/L)
        shift=D
    else:
        flow=(1/L,-Y/L,-D*eta/L)
        shift=1
    out=defaultdict(int)
    for jet,c in terms.items():
        ydiff=diff(c,Y)-c/(2*Y) if weighted else diff(c,Y)
        out[jet]+=flow[1]*ydiff+flow[2]*diff(c,eta)-w*flow[0]*c
        for k,v in enumerate(flow):
            if v:
                shifted=tuple(j+int(k==i) for i,j in enumerate(jet))
                out[shifted]+=v*c
    return {j:c for j,c in out.items() if c!=0},w+shift


def jet_masses(scalar,key,leading):
    weighted=(not leading and scalar in ('a','b'))
    terms={ZERO:Rational(1,2) if leading and scalar=='a' else Rational(1)}
    w=WEIGHTS[scalar]
    for axis,num in enumerate(key):
        for _ in range(num):
            terms,w=operator(terms,w,axis,weighted)
    wmax=interval(w)[1]
    qfactor=2**(-(-wmax.numerator//wmax.denominator))
    multiplier=F(qfactor,2) if weighted else F(qfactor)
    return {jet:mass for jet,c in sorted(terms.items())
            if (not leading or jet[0]==0) and (mass:=multiplier*magnitude(c))},w


def validated_bounds(source,endpoint):
    graph=source['originalCanonical']
    need(graph['nodeCount']==endpoint['actualN3Graph']['canonicalNodes'] and
         graph['sha256']==endpoint['actualN3Graph']['allNodeSHA256'] and
         source['originalLowerPrefix']==endpoint['originalN2Prefix']['commonNodePrefixes']['120820'],
         'same actual canonical graph and entire original order-two prefix')
    basis=source['positive']
    need([row['order'] for row in basis]==[1,2,3] and
         all(row['domain']=={'X':[137007,137008],'eta':['-1','1']} for row in basis) and
         basis[2]['roots']['F']==endpoint['boundRoots']['F3'] and
         basis[2]['roots']['U']==endpoint['boundRoots']['U3'] and
         basis[2]['roots']['Pi']==endpoint['boundRoots']['Pi3'], 'actual source coefficient bodies and norm box')
    nodes=source['sourceNodeRecords']
    canonical={}
    for row in source['canonical']:
        n,m=row['n'],row['m']
        need(m<=n and nodes[str(row['logc'])]['op']=='maximum' and
             row['requiredLog'] in nodes[str(row['logc'])]['args'] and
             nodes[str(row['c'])]=={'op':'exp','args':[row['logc']]},'original canonical cutoff link')
        canonical[n,m]=row['B']
    need(set(canonical)=={(n,m) for n in (1,2,3) for m in range(n+1)} and
         canonical[3,0]==endpoint['boundRoots']['B30'] and
         canonical[3,1]==endpoint['boundRoots']['B31'], 'all original historical diagonal rows')
    higher={}
    for row in source['higher']:
        n,m,field=row['n'],row['m'],row['field']
        bound=row['bound']
        combos={(t['e'],t['r'],t['t']) for t in row['terms']}
        need(m>n and combos=={p for p in product(range(m+1),repeat=3) if sum(p)<=m},
             'all actual mixed profile and Euler norm terms')
        need(nodes[str(bound)]['op']=='maximum' and
             all(t['upper'] in nodes[str(bound)]['args'] for t in row['terms']),
             'actual unabsorbed finite norm maximum')
        higher[n,m,field]=bound
    need(set(higher)=={(1,2,'StreamOverR'),(1,3,'StreamOverR'),
                       (2,3,'StreamOverR'),(1,2,'E')}, 'only four required higher-than-diagonal constants')
    lead=source['leading']
    need(lead['U0Source']==117101 and lead['bounds']['U0']['actualCompletedLeadingSource'] and
         lead['bounds']['U0']['domain']['X']==['0','infinity'] and
         lead['bounds']['F0inner']['domain']['X'][0]=='0' and
         lead['bounds']['F0inner']['domain']['includesNaturalAndActualB26'] and len(lead['pressureRows'])>0 and len(lead['pressureDatumBounds'])==2,
         'actual leading U average, F0 core and pressure norm parents')
    return canonical,higher


def parts(scalar,key,higher):
    lead,w=jet_masses(scalar,key,True)
    positive,w2=jet_masses(scalar,key,False)
    need(w==w2,'same physical power for leading and positive terms')
    leading=Counter()
    for (_,r,t),mass in lead.items():
        if scalar=='a':
            leading['L_U']+=mass/F(r+1)
        elif scalar=='b':
            leading['L_F']+=mass
        else:
            need(r+t<=1,'leading pressure jet demand')
            if r==t==0:
                leading['K']=leading.get('K',0)+5*mass
                leading['L_F^2']+=mass
            elif r==1:
                leading['L_F^2']+=mass
            else:
                leading['K']=leading.get('K',0)+160*mass
                leading['L_F^2']+=2*mass
    grouped=Counter()
    for jet,mass in positive.items():
        grouped[sum(jet)]+=mass
    bounds=Counter()
    for m,mass in grouped.items():
        for n in (1,2,3):
            if m<=n:
                bounds[f'tau0^({n}*h)']+=mass*F(2,2**n)
            else:
                bound=higher[n,m,FIELDS[scalar]]
                bounds[f'H_{bound}*tau0^({2*n}*h)']+=2*mass
    return leading,bounds,grouped,w


def encoded(terms):
    return {k:str(v) for k,v in sorted(terms.items()) if v}


def bounds(atoms,higher):
    lists=atoms['remainingScalarDerivativeInputs']
    need({k:len(v) for k,v in lists.items()}=={'a':13,'b':6,'p_loc':3},'all 22 scalar input rows')
    scalar={}
    for field,derivs in lists.items():
        for d in derivs:
            scalar[field,tuple(d)]=parts(field,tuple(d),higher)
    scalars={}
    for (field,d),(lead,pos,masses,w) in scalar.items():
        s,z,t=d
        scalars[f'{field}@{s},{z},{t}']={
            'LambdaPower':str(s),'tau0ReciprocalPower':str(w),
            'leadingTerms':encoded(lead),'positiveTerms':encoded(pos),
            'positiveMultiplier':'sqrt(Lambda)' if field in ('a','b') else '1',
            'positiveProfileMassByDerivativeOrder':{m:str(v) for m,v in sorted(masses.items())},
        }
    cartesian={}
    for atom,terms in atoms['formulas'].items():
        field=atom.split('@')[0]
        if field=='A2':
            need(not terms,'actual A2 identically zero')
            cartesian[atom]={'exactInterval':['0','0']}
            continue
        idx=tuple(map(int,atom.split('@')[1].split(',')))
        kind={'A0':'a','A1':'a','b':'b','p':'p_loc'}[field]
        lead,pos=Counter(),Counter()
        expected=None
        for term in terms:
            d=tuple(term['derivative'])
            need(term['scalar']==kind,'same original atom scalar family')
            deg=sum(term['xyPower'])
            s,z,t=d
            if field=='b':
                need(deg==0 and idx==d,'original b uses physical s,z,tau directly')
                lam=F(s)
            else:
                need((z,t)==idx[2:] and deg==2*s-idx[0]-idx[1]+int(kind=='a'),
                     'exact common Cartesian xy degree relation')
                lam=F(s)-F(deg,2)
            l,p,_,w=scalar[kind,d]
            reciprocal=w-Rational(deg,2)
            if expected is None:
                expected=lam,reciprocal
            need(expected==(lam,reciprocal),'same physical factor for every Cartesian monomial')
            multiplier=abs(term['integer'])*4**deg
            for key,value in l.items():
                lead[key]+=multiplier*value
            for key,value in p.items():
                pos[key]+=multiplier*value
        need(expected is not None,'nonempty original atom formula')
        cartesian[atom]={'LambdaPower':str(expected[0]),'tau0ReciprocalPower':str(expected[1]),
                         'leadingTerms':encoded(lead),'positiveTerms':encoded(pos),
                         'positiveMultiplier':'sqrt(Lambda)' if kind in ('a','b') else '1'}
    need(len(cartesian)==67 and sum('exactInterval' in row for row in cartesian.values())==19,
         'all 67 actual local atom intervals, including 19 exact zeros')
    return scalars,cartesian


def main():
    p=ArgumentParser()
    p.add_argument('--repo',type=Path,required=True)
    p.add_argument('--atoms',type=Path)
    p.add_argument('--joined',type=Path,required=True)
    p.add_argument('--endpoint',type=Path,default=NEXT/'whole-k-center-n3/endpoint-third-bound.json')
    p.add_argument('--whole-k',type=Path,required=True)
    p.add_argument('--high',type=Path,default=HERE/'core-high-norms.json')
    p.add_argument('--out',type=Path,default=HERE/'strict-core-jet-bounds.json')
    a=p.parse_args()
    atoms=pinned(a.atoms or a.repo/'tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-core/inner-gauge-atoms.json',ATOMS)
    chart=pinned(a.whole_k,CHART)
    need(chart['background']['selector_lower_bounds_b_n_times_qBig']==['1','16','32','64'] and
         chart['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16'],
         'whole-K q range and original active prefix')
    source=pinned(a.high,HIGH)
    canonical,higher=validated_bounds(source,pinned(a.endpoint,ENDPOINT))
    scalars,cart=bounds(atoms,higher)
    d={'schema':'MathScope.N7.StrictOriginalCoreFieldAtomBounds/1',
       'inputs':{'atomSHA256':ATOMS,'endpointSHA256':ENDPOINT,'wholeKSHA256':CHART,
                 'highNormSHA256':HIGH},
       'domain':'whole-K 1/2<=rho<=1, 2<=Y=Lambda*X<=5/2, |eta|<=1/4, all theta',
       'sameOriginalChart':'q=tau0*rho/(1-eta^2), X=s/(2*q), eta=z*q^-D',
       'chartOperatorReadback':verify_chart_operators(),
       'activeScope':'common b_n: all n>=4 flat zero; historical c_n only controls each listed n, no claim about its active tail',
       'leadingSources':source_leading(a.repo,a.joined),
       'originalNormFactors':{'L_U':source['leading']['U0BoundRoot'],
                              'L_F':source['leading']['bounds']['F0inner']['root'],
                              'L_FGraphSHA256':source['leading']['normProgramSHA256'],
                              'K':'original Pstar^2',
                              'canonical':{f'{n},{m}':v for (n,m),v in canonical.items()},
                              'unabsorbed':{f'{n},{m},{field}':v for (n,m,field),v in higher.items()}},
       'intervalConvention':'each nonzero row is [-R,R] with R=Lambda^LambdaPower*tau0^-tau0ReciprocalPower*(sum leadingTerms+positiveMultiplier*sum positiveTerms)',
       'scalarIntervals':scalars,'fieldAtomIntervals':cart,
       'scope':{'localAtoms':67,'exactLocalZeros':19,'outerCutoffAtomsSeparate':13,
                'normFactorsNumericallyEvaluated':False,'originalAnnularSupportTheoremUsed':True,
                'globalJets':'0/67','N7-06':'OPEN','N8-05':'OPEN','release':'HOLD'}}
    a.out.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8')
    print('PASS 22 strict-core scalar intervals and all 67 original local atom upper bounds.')
    print('Exact source norm factors retained; global jets 0/67; N7-06/N8-05 OPEN.')
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
