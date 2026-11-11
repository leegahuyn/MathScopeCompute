"""Exact factored 67-atom enclosures on the original axis-including whole-K core."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as F
from hashlib import sha256
from itertools import product
from math import factorial
from pathlib import Path
import json
import sys

from sympy import Rational

HERE=Path(__file__).resolve().parent
NEXT=HERE.parent
sys.path[:0]=[str(NEXT/'whole-k-core-jet-bounds'),str(NEXT/'whole-k-center-n3')]
from check_strict_core_jet_bounds import (
    A,D,Y,eta,ATOMS,CHART,WEIGHTS,ZERO,encoded,interval,need,operator,pinned,
    source_leading,verify_chart_operators)
from check_endpoint_third import verify_runtime

NATIVE='19ac2bfde61e1a9808a2a9f4aa324a2d634fed376fcc2084d886500a164255d3'
ENDPOINT='de578dd4f456e8ad698f33baa8302bd65af8550d53e4317589946aacc85be28f'
PRIOR='8b967ea80d1fb815925950f7cbf5ff4fe020226abc6e3dd3a38e3f7ccbb4441f'


def analytic_readback(d,end):
    need(d['originalNodeCount']==123870 and d['n2Prefix']==end['originalN2Prefix']['commonNodePrefixes']['120820'],
         'same complete old n<=2 coefficient prefix, original n=3 construction')
    need(d['originalNodes']=='2aa7ea4d8f5aeebd1f4693abf0a59fe8cd452f5f5d85ec3b49ae3c881c4e4f64',
         'exact original constructor hash before axis audit')
    need([r['n'] for r in d['rows']]==[1,2,3] and not d['scope']['orderFourAllocated'],
         'only the three potentially active positive coefficient orders')
    nodes=d['sourceNodeRecords']
    lookup={}
    radii=(F(7),F(13,2),F(25,4))
    for row,radius in zip(d['rows'],radii,strict=True):
        n=row['n']
        need(row['coreAgreement']['domain']==[0,d['Xa']] and
             row['coreAgreement']['actualCutoffStarts']==d['Xkeep'] and
             not row['coreAgreement']['auxiliaryReplacesActivationCollar'],
             'same actual inner and auxiliary core, strict original cutoff guard')
        rnode=nodes[str(row['analytic']['radius'])]
        need(rnode['op']=='rational' and F(*map(int,rnode['args']))==radius and radius>5,
             'radius one Cauchy disk fits around every real 0<=Y<=4')
        need(nodes[str(row['analytic']['solutionNorm'])]['op']=='exp' and
             row['parity']['entries']==78 and row['parity']['radialDenominators']==0,
             'exact finite original source majorant and radial parity')
        need(row['axisZero']==[{'component':i,'value':0,'etaDerivative':0} for i in [0,1,3]],
             'actual even zero-axis datum and parameter derivative')
        for field,component in [('F',0),('U',1),('Pi',3)]:
            need(nodes[str(row['selected'][field])]=={
                'op':'actual_background_even_profile',
                'args':[row['actualSystem'],component,d['X'],d['eta'],0,0]},
                'literal actual even profile, including pressure')
        if n==1:
            need(nodes[str(row['streamAverage'])]['op']=='definite_integral' and
                 nodes[str(row['streamAverage'])]['args'][2:]==[0,1],
                 'actual first-order zero-origin average integral')
        else:
            need(nodes[str(row['streamAverage'])]['op']=='add', 'actual U plus K average')
        c=row['cauchy']
        need({(x['e'],x['r'],x['t']) for x in c}==
             {key for key in product(range(4),repeat=3) if sum(key)<=3},
             'every finite mixed profile/cutoff index is present')
        lookup[n]={(x['e'],x['r'],x['t']):x['bound'] for x in c}
    for r in range(4):
        factor=F(1,2**r)
        for j in range(r):
            factor/=2*j+1
        need(factor==F(factorial(r),factorial(2*r)), 'exact native even integral axis weight')
    # Uniform Picard bound: (5.8) over complex radial rays, A=C*a/sqrt(strip).
    # Split even and odd k and use m^m/(2m+1)! <= 1/m!.
    for m in range(1,16):
        need(F(m**m,factorial(2*m+1))<=F(1,factorial(m)) and
             F(m**m,factorial(2*m))<=F(1,factorial(m)),
             'exact factorial inequalities used symbolically for arbitrary m')
    # Each matrix row sum bound (constant,H0,V0,Z(H0)) fits the original 512 factor.
    rows=((1,0,0,0),(1,0,0,0),(1,0,0,0),(0,4,0,0),
          (18,228,3,2),(62,172,1,2))
    need(all(max(r)<=512 for r in rows) and F(1)/(1-F(1,4))==F(4,3) and F(2)<F(7,2),
         'original coefficient row bounds and exponential proof margins')
    return lookup


def masses(field,orders):
    terms={ZERO:Rational(1,2) if field=='a' else Rational(1)}
    w=WEIGHTS[field]
    for axis,count in enumerate(orders):
        for _ in range(count):
            terms,w=operator(terms,w,axis,False)
    wmax=interval(w)[1]
    dyadic=2**(-(-wmax.numerator//wmax.denominator))
    # Reuse the exact rational evaluator on affine images of its original box.
    # Old Y in [2,5/2] -> 8*(Y-2) in [0,4].
    # Old eta in [-1/4,1/4] -> 3*eta in [-3/4,3/4].
    return {key:mass for key,coefficient in sorted(terms.items()) if
            (mass:=dyadic*max(map(abs,interval(coefficient.subs({Y:8*(Y-2),eta:3*eta},simultaneous=True)))))},w


def scalar_parts(field,orders,cauchy):
    coef,w=masses(field,orders)
    leading,positive=Counter(),Counter()
    for (e,r,t),mass in coef.items():
        avg=F(1,r+1) if field=='a' else F(1)
        if e==0:
            if field=='a':
                leading['L_U']+=mass*avg
            elif field=='b':
                leading['L_F']+=mass
            else:
                need(r+t<=1,'only first leading pressure derivatives are requested')
                if r==t==0:
                    leading['K']+=5*mass
                    leading['L_F^2']+=mass
                elif r:
                    leading['L_F^2']+=mass
                else:
                    leading['K']+=160*mass
                    leading['L_F^2']+=2*mass
        for n in (1,2,3):
            root=cauchy[n][e,r,t]
            positive[f'H_{root}*tau0^({2*n}*h)']+=2*mass*avg
    return leading,positive,w


def encode(row,lam):
    lead,pos,w=row
    return {'LambdaPower':str(lam),'tau0ReciprocalPower':str(w),
            'leadingTerms':encoded(lead),'positiveTerms':encoded(pos)}


def enclose(atoms,cauchy):
    rows={}
    for field,orders in atoms['remainingScalarDerivativeInputs'].items():
        for order in orders:
            rows[field,tuple(order)]=scalar_parts(field,order,cauchy)
    need(len(rows)==22,'all source scalar derivative rows')
    scalars={f'{field}@{i},{j},{k}':encode(row,i) for (field,(i,j,k)),row in rows.items()}
    fields={}
    axis_full_zero,axis_positive_zero=[],[]
    for atom,terms in atoms['formulas'].items():
        prefix,indices=atom.split('@')
        if prefix=='A2':
            need(not terms,'original A2 zero')
            fields[atom]={'exactInterval':['0','0']}
            axis_full_zero.append(atom)
            axis_positive_zero.append(atom)
            continue
        field={'A0':'a','A1':'a','b':'b','p':'p_loc'}[prefix]
        idx=tuple(map(int,indices.split(',')))
        leading,positive=Counter(),Counter()
        factor=None
        for term in terms:
            d=tuple(term['derivative'])
            i,j,k=d
            deg=sum(term['xyPower'])
            need(term['scalar']==field,'same actual scalar field for every atom')
            if field=='b':
                need(idx==d and deg==0,'original b uses s,z,tau')
            else:
                need((j,k)==idx[2:] and deg==2*i-idx[0]-idx[1]+int(field=='a'),
                     'exact degree balance after applying the Cartesian atom')
            lead,pos,w=rows[field,d]
            f=(F(i)-F(deg,2),w-Rational(deg,2))
            if factor is None:
                factor=f
            need(factor==f,'all terms have the same physical atom scale')
            multiplier=abs(term['integer'])*4**deg
            for name,c in lead.items():
                leading[name]+=multiplier*c
            for name,c in pos.items():
                positive[name]+=multiplier*c
        need(factor is not None,'all original nonzero atom formulas are retained')
        if all(sum(t['xyPower'])>0 for t in terms):
            axis_full_zero.append(atom)
        if all(sum(t['xyPower'])>0 or t['derivative'][0]==0 for t in terms):
            axis_positive_zero.append(atom)
        fields[atom]=encode((leading,positive,factor[1]),factor[0])
    need(len(fields)==67 and sum('exactInterval' in x for x in fields.values())==19,'all local original atoms')
    return scalars,fields,{'allOrdersExactlyZero':axis_full_zero,
                           'positiveOrderPartExactlyZero':axis_positive_zero,
                           'source':'xy=0 and actual F_n,U_n,Pi_n have identically zero axis value for n>0'}


def main():
    p=ArgumentParser()
    p.add_argument('--repo',type=Path,required=True)
    p.add_argument('--atoms',type=Path)
    p.add_argument('--runtime',type=Path,required=True)
    p.add_argument('--joined',type=Path,required=True)
    p.add_argument('--endpoint',type=Path,default=NEXT/'whole-k-center-n3/endpoint-third-bound.json')
    p.add_argument('--whole-k',type=Path,required=True)
    p.add_argument('--prior',type=Path,default=NEXT/'whole-k-core-jet-bounds/strict-core-jet-bounds.json')
    p.add_argument('--native',type=Path,default=HERE/'inner-axis-native.json')
    p.add_argument('--out',type=Path,default=HERE/'inner-axis-jet-bounds.json')
    a=p.parse_args()
    atoms=pinned(a.atoms or a.repo/'tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-core/inner-gauge-atoms.json',ATOMS)
    native,end,prior=pinned(a.native,NATIVE),pinned(a.endpoint,ENDPOINT),pinned(a.prior,PRIOR)
    chart=pinned(a.whole_k,CHART)
    need(chart['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16'] and
         chart['background']['selector_lower_bounds_b_n_times_qBig']==['1','16','32','64'],
         'exact full-slab physical eta restriction and common higher-cutoff zeros')
    cauchy=analytic_readback(native,end)
    scalars,fields,axis=enclose(atoms,cauchy)
    leading=source_leading(a.repo,a.joined)
    leading.update({k:prior['originalNormFactors'][k] for k in ['L_U','L_F','L_FGraphSHA256','K']})
    out={'schema':'MathScope.N7.ActualInnerAxisFieldAtomBounds/1',
         'pins':{'native':NATIVE,'endpoint':ENDPOINT,'prior':PRIOR,'wholeK':CHART,'atoms':ATOMS},
         'originalRuntime':verify_runtime(a.runtime.resolve(),a.repo),
         'domain':'original whole-K: 1/2<=rho<=1, 0<=Y=Lambda*X<=4, actual |eta|<3/4, all theta',
         'seam':'Y=4 follows by continuity from inner X<Xa using original smooth annular zero extension',
         'physicalOperatorCheck':verify_chart_operators(),
         'positiveOrders':[1,2,3],
         'positiveBoundRule':'unabsorbed W_(n,e)*r!*t!*(2/strip_n)^t*solutionNorm_n*q^(2*n*h)',
         'sourceAnalyticNorm':'original auxiliary Picard class, same actual real solution on 0<=X<=Xa by source uniqueness',
         'leading':leading,
         'positiveNormRoots':{n:{','.join(map(str,k)):v for k,v in rr.items()} for n,rr in cauchy.items()},
         'axisSubface':axis,'scalarIntervals':scalars,'fieldAtomIntervals':fields,
         'intervalConvention':'each nonzero row is [-R,R] with R=Lambda^LambdaPower*tau0^-tau0ReciprocalPower*(sum leadingTerms+sum positiveTerms)',
         'scope':{'localAtomCount':67,'exactZeroAcrossRegion':19,'factoredPositiveNormsNumericallyEvaluated':False,
                  'fullOriginalAnnularAndTransitionJets':False,'globalJets':'0/67','N7-06':'OPEN','N8-05':'OPEN',
                  'release':'HOLD'}}
    a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print('PASS all 22 scalar and 67 original field atom enclosures on the whole inner region including the axis.')
    print('Axis exact zero fields:',len(axis['allOrdersExactlyZero']),'; positive-order exact zeros:',len(axis['positiveOrderPartExactlyZero']))
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
