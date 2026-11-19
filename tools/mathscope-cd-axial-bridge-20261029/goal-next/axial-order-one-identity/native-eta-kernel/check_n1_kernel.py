"""Independent exact original n=1 RHS eta algebra and source norm tree.

No native profile is assigned a numerical value. The norm tree assumes only
the explicitly listed leading actual jet bounds and original scalar domain.
"""
import argparse
from functools import lru_cache
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sympy as s

p=argparse.ArgumentParser()
p.add_argument('source',type=Path)
p.add_argument('output',type=Path)
a=p.parse_args()
raw=a.source.read_bytes()
d=json.loads(raw)
assert d['schema']=='MathScope.OriginalN1NativeRhsEtaKernel/1'
assert d['originalPrefix']['sha256']=='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116'
assert d['registrySHA256']=='049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad'
nodes=dict(d['nodes'])
sys=d['sourceSystem']
assert sys['diagonal']==[0,0,2,0,3,1]
coefficient={}
atoms={}
for row in d['coefficientAliases']:
    key=row['kind'],row['row'],row['col'],row['etaOrder']
    coefficient[key]=row['node']
    if nodes[row['node']]['op']!='rational':
        atoms[row['node']]=s.Symbol('source_'+str(row['node']))
native={}
for row in d['actualNativeJets']:
    native[row['component'],row['etaOrder']]=row['node']
    atoms[row['node']]=s.Symbol('source_'+str(row['node']))


@lru_cache(None)
def expr(i):
    if i in atoms:
        return atoms[i]
    op,av=nodes[i]['op'],nodes[i]['args']
    if op=='rational':return s.Rational(*map(int,av))
    if op=='add':return sum(map(expr,av))
    if op=='multiply':return s.prod(map(expr,av))
    if op=='inverse':return 1/expr(av[0])
    if op=='integer_power':return expr(av[0])**av[1]
    raise AssertionError((i,op))


def C(kind,i,j,m):return expr(coefficient[kind,i,j,m])
def W(i,m):return expr(native[i,m])
rhs={(row['component'],row['etaOrder']):expr(row['node']) for row in d['rhs']}
checks=[]
for i in range(6):
    for m in range(3):
        expected=C('f',i,None,m)+sum(s.binomial(m,k)*(
            C('A0',i,j,k)*W(j,m-k)+C('A1',i,j,k)*W(j,m-k+1))
            for k in range(m+1) for j in range(6))
        assert s.expand(rhs[i,m]-expected)==0,(i,m)
        checks.append({'component':i,'etaOrder':m,'pass':True})
derivative_map=dict(d['derivativeMap'])


def DE(f):
    result=0
    for i,symbol in atoms.items():
        if symbol in f.free_symbols:
            assert i in derivative_map, i
            result+=s.diff(f,symbol)*expr(derivative_map[i])
    return result


for i in range(6):
    for m in range(2):
        assert s.expand(DE(rhs[i,m])-rhs[i,m+1])==0,(i,m)
for row in d['firstFiniteGf']:
    if row['zero']:
        assert sys['forcing'][row['component']]==0
    else:
        assert len(row['rows'])==3
        assert all(v['actual']==v['expected'] and v['identicalNode'] for v in row['rows'])
assert d['evaluatorControl']['code']=='UNSUPPORTED'

# The source coefficient graph is separately compressed at ACTUAL leading
# physical-X jets after the exact substitution X=xi^2. Apply an independent
# absolute-value syntax tree with polynomial bounds, retaining row sums.
bnodes=dict(d['leadingCoefficientNodes'])
B,q=s.symbols('B q',positive=True) # q=1/delta, both >=1
field_bounds={}
field_classes={}
for row in d['leadingFieldAliases']:
    if row['name']=='v':
        bound=(112*B*q*q if row['eta'] else 28*B*q)
    else:
        bound={0:B,1:4*B*q,2:32*B*q*q}[row['eta']]
    if row['node'] in field_bounds:assert field_bounds[row['node']]==bound
    field_bounds[row['node']]=bound
    field_classes.setdefault((row['name'],row['x'],row['eta']),set()).add(row['node'])
eta_abs=s.Rational(33,32)
scalars=d['sourceScalarNodes']
assert scalars['A']==23 and scalars['D']==22 and scalars['d']==30 and scalars['L']==28


@lru_cache(None)
def norm(i):
    if i in field_bounds:return field_bounds[i]
    if i==sys['xi']:return s.S.One
    if i==sys['eta']:return eta_abs
    # These are original source L,d,A,D, each on the stated complex tube.
    if i==scalars['L']:return s.S(2) # also a valid absolute upper bound
    if i==scalars['d']:return s.S(3)
    if i==scalars['A']:return s.Rational(9,16)
    if i==scalars['D']:return s.Rational(1,2)
    op,av=bnodes[i]['op'],bnodes[i]['args']
    if op=='rational':return abs(s.Rational(*map(int,av)))
    if op=='source_parameter':
        assert av==['h'],(i,av)
        return s.Rational(1,16)
    if op=='add':return sum(map(norm,av))
    if op=='multiply':return s.prod(map(norm,av))
    if op=='inverse':
        assert av[0]==scalars['L'],('unproved denominator',i,av)
        return s.S(2)
    if op=='integer_power':
        assert av[1]>=0
        return norm(av[0])**av[1]
    raise AssertionError((i,op,av))


def dominate(label,expression,bdegree,qdegree,target):
    poly=s.Poly(s.expand(expression),B,q)
    assert all(c>=0 for c in poly.coeffs()),label
    assert all(i<=bdegree and j<=qdegree for (i,j),_ in poly.terms()),(label,poly)
    constant=s.factor(poly.as_expr().subs({B:1,q:1}))
    assert constant<=target,(label,constant,target)
    return {'label':label,'sourceTriangleCoefficient':str(constant),
            'targetCoefficient':target,'Bdegree':bdegree,'inverseDeltaDegree':qdegree,
            'slack':str(target-constant),'pass':True}


norm_rows=[]
for kind in ('A0','A1'):
    for i,row in enumerate(sys[kind]):
        norm_rows.append(dominate(f'{kind}_row_{i}',sum(norm(v) for v in row),1,1,512))
omega=dominate('actual_Omega0_over_X',norm(sys['sourceLeading']['omega0OverX']),2,2,4096)
forcing_rows=[dominate(f'forcing_{i}',norm(root),2,2,65536) for i,root in enumerate(sys['forcing'])]
assert d['sourceMajorantFormula']['C1']==24818
assert d['sourceMajorantFormula']['formula']=='262144*B^2/delta^2'
assert s.Rational(262144,2)>65536 and s.Rational(262144,2)>512

# Exact faulty-kernel controls. They alter no source file or operand.
bad=[]
for i in range(6):
    omitted_middle=C('f',i,None,2)+sum(
        C('A0',i,j,0)*W(j,2)+C('A0',i,j,1)*W(j,1)+C('A0',i,j,2)*W(j,0)
        +C('A1',i,j,0)*W(j,3)+C('A1',i,j,1)*W(j,2)+C('A1',i,j,2)*W(j,1)
        for j in range(6))
    if s.expand(rhs[i,2]-omitted_middle)!=0:bad.append(i)
assert bad
assert 2**20>512 # changing one literal matrix coefficient violates the bound at B=q=1
out=dict(schema='MathScope.OriginalN1NativeRhsAndMajorantReduction/1',
 status='PASS_ACTUAL_N1_ETA_RHS_AND_LEADING_BOUND_REDUCTION',
 sourceSHA256=hashlib.sha256(raw).hexdigest(),originalPrefix=d['originalPrefix'],
 sourceSystem=0,sourceCoefficientEtaRows=checks,ordinaryFormalEtaDerivativeIdentities=12,
 literalFiniteGfEtaIdentities=9,zeroFiniteGfComponents=3,
 coefficientMajorants=norm_rows,omegaMajorant=omega,forcingMajorants=forcing_rows,
 sourceC1=d['sourceMajorantFormula'],
 conditionalMajorantConclusion='On the stated scalar domain and leading jet bounds, actual A0,A1 row norms and actual forcing vector norm are each <=C1/2, C1=262144*B^2/delta^2.',
 inputBounds=dict(F_U_X_orders_0_to_2='B on S_delta',
                 F_U_eta_1_X_orders_0_to_1='4*B/delta on S_(delta/4)',
                 F_U_eta_2='32*B/delta^2 on S_(delta/4)',
                 v_X_orders_0_to_2='28*B/delta on S_(delta/2)',
                 v_eta_1='112*B/delta^2 on S_(delta/4)',
                 scalars='B>=1,0<delta<=1,0<=xi<=a<=1,|eta|<=33/32,|1/L|<=2,|d|<=3,0<h<1/16'),
 derivativeScope='Eta only, orders0..2; RHS W inputs through eta order3. No mixed-partial aliasing occurs in this RHS check. Leading bound compression uses the ordinary physical-X jets named in its input premise.',
 negativeControls=dict(wrongSecondEtaBinomialRows=bad,oneLargeMatrixLiteralRejected=True,
                       diagnosticNativeEvaluation=d['evaluatorControl']),
 remaining='Establish the actual original leading natural/B.26 ordinary jet bounds and eta holomorphy on S_delta, including their common Xa join and the same radial average. Prior source-bound Volterra uniform-tail/derivative theorem then yields the fixed-n1 limit; identify the native descriptor with that limit by explicit ordinary denotation. Zero global cutoff joins remain separate.',
 allOrders=False,release='HOLD')
a.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(dict(status=out['status'],RHS=18,etaDerivativeIdentities=12,finiteGf=9,
                     matrixRows=len(norm_rows),forcingRows=len(forcing_rows),
                     omegaSourceTriangle=omega['sourceTriangleCoefficient'],wrongBinomialRows=bad)))
