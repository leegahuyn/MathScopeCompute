"""Independent integer-only full N2 AST stream and source-generated binder witness."""
import collections,gzip,hashlib,json,sys
from fractions import Fraction
from pathlib import Path
D=Path(__file__).resolve().parent;assert len(sys.argv)==4, 'usage: GRAPH_DIR WITNESS_JSON OUTPUT_JSON'; folder=Path(sys.argv[1]); witness=Path(sys.argv[2]); output=Path(sys.argv[3]);sys.path.insert(0,str(D.parent.parent/'y'))
helper=D.parent.parent/'y'/'native_reference_scopes.py';assert hashlib.sha256(helper.read_bytes()).hexdigest()=='37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758'
from native_reference_scopes import actual_children
expectgraph='75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987';expectreg='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f'
rbytes=(folder/'original-source-functions.json').read_bytes();assert hashlib.sha256(rbytes).hexdigest()==expectreg;reg=json.loads(rbytes);systems=json.loads(reg['base']['picard']);assert systems[3]['xi']==118918 and systems[3]['eta']==2 and systems[3]['radialDomain']==[0,24806]
anchors={120221:('actual_background_even_profile',[3,1,4756,2,0,0]),120239:('smooth_piecewise',[4756,28819,28823,120221,120238,0]),120276:('coordinate',['n2_local_m0$296']),120278:('actual_expression_partial',[11,[120276,2],[0,0]]),120279:('definite_integral',[120278,120276,0,28823]),24802:('rational',['1','16']),24803:('multiply',[3612,24802]),24804:('exp',[24803]),24805:('multiply',[3617,24804]),24806:('sqrt_positive',[24805]),28820:('rational',['1','32']),28821:('multiply',[3612,28820]),28822:('exp',[28821]),28823:('multiply',[3617,28822])}
h=hashlib.sha256();hist=collections.Counter();edges=0;count=0;found={}
with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as f:
 line=f.readline();h.update(line);header=json.loads(line);assert header['node_count']==2852905
 for line in f:
  h.update(line);v=json.loads(line);hist[v['op']]+=1
  for j in actual_children(v):
   assert type(j) is int and 0<=j<count,(count,j,v)
   edges+=1
  if count in anchors:
   op,args=anchors[count];assert v=={'op':op,'args':args},count;found[count]=True
  count+=1
assert count==2852905 and h.hexdigest()==expectgraph and len(found)==len(anchors)
wbytes=witness.read_bytes();witness_sha=hashlib.sha256(wbytes).hexdigest();w=json.loads(wbytes);assert w['status']=='PASS' and w['displayedIterates']==3 and not w['finitePartialSumIsExactSolution'];ns={int(i):v for i,v in w['dynamicSnapshot'].items()};trace=w['witness']['path'];assert trace[0]==w['momentFinite'] and trace[-1]==150912
for i,j in zip(trace,trace[1:]):assert j in actual_children(ns[i]),(i,j,ns[i])
for row in w['witness']['binders']:
 assert ns[row['integral']]=={'op':'definite_integral','args':[ns[row['integral']]['args'][0],row['binder'],0,1]} and row['integral'] in trace
assert [b['binder'] for b in w['witness']['binders']]==[130663,125935,121768]
for guard,arm in [(151124,151123),(151063,151053)]:assert trace[trace.index(guard)+1]==arm
expected={150912:('actual_natural_series',['Phi',150564,2,0,0]),150564:('multiply',[3454,150563]),150563:('multiply',[3617,150562]),150562:('exp',[150344]),150344:('log_positive',[150343]),150343:('multiply',[3679,150341]),3679:('inverse',[3617]),150341:('integer_power',[150340,2]),150340:('multiply',[121768,148594]),148594:('multiply',[125935,148593]),148593:('multiply',[120290,130663]),120290:('sqrt_positive',[120276]),151124:('smooth_piecewise',[150341,3617,24805,150877,151123,151123]),151063:('smooth_piecewise',[150563,3624,3627,151053,151058,151062])}
for i,(op,args) in expected.items():assert ns[i]=={'op':op,'args':args},i
# Rational samples exercise exactly X*product(t_i^2), with no floating point.
trials=0
for x in (Fraction(i,8) for i in range(9)):
 for a in (Fraction(i,8) for i in range(9)):
  for b in (Fraction(i,8) for i in range(9)):
   for c in (Fraction(i,8) for i in range(9)):
    y=x*a*a*b*b*c*c;assert 0<=y<=x;trials+=1
assert trials==6561
out={'schema':'MathScope.Y.FixedN.N2.IndependentPythonAST/1','sourceGraphSHA256':h.hexdigest(),'registrySHA256':expectreg,'witnessSHA256':witness_sha,'nodeCount':count,'operandEdgesChecked':edges,'allOperandsPointBackward':True,'actualNodeAnchors':sorted(found),'rawNaturalNodeCount':hist['actual_natural_series'],'generatedWitness':{'partialSumCount':3,'call':150912,'binderCoordinates':[130663,125935,121768],'pathLength':len(trace),'strictLogGuard':151124,'nestedGuard':151063,'snapshotNodesChecked':len(ns),'dynamicSnapshotOnlyNotOriginalExport':True},'exactRationalBinderTests':trials,'scope':'Verifies original export DAG and one actual source-generated finite three-binder witness. The generated node IDs belong to a fresh local graph and are not claimed identical to nodes with the same numbers in the original exported graph. This is not an all-iterate convergence or complete dynamic-call range proof.','release':'HOLD'}
output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps({'status':'PASS','nodes':count,'edges':edges,'rawNaturalNodes':hist['actual_natural_series'],'rationalBinderTests':trials}))
