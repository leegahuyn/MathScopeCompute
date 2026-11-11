"""Check ten exact original N2/N3 local-moment binder frames, not full chart."""
import argparse,hashlib,json,sys
from pathlib import Path
D=Path(__file__).resolve().parent
root=D.parent
sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--reached',type=Path,required=True)
parser.add_argument('--registry',type=Path,required=True)
parser.add_argument('--out',type=Path,default=D/'local-moment-frames.json')
args=parser.parse_args()
raw=args.reached.read_bytes(); assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32'
x=json.loads(raw); nodes=dict(x['nodes'])
b=args.registry.read_bytes(); assert hashlib.sha256(b).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f'
reg=json.loads(b); expr=json.loads(reg['base']['expression']); pic=json.loads(reg['base']['picard']); assert [(pic[i]['xi'],pic[i]['radialDomain']) for i in (3,5)]==[(118918,[0,24806]),(122255,[0,24806])]
rows=[]
for level,first,base,system in ((2,120276,11,3),(3,123372,35,5)):
 for k in range(5):
  binder=first+4*k; call=binder+2; integral=binder+3; sid=base+k
  assert nodes[binder]['op']=='coordinate'
  assert nodes[call]=={'op':'actual_expression_partial','args':[sid,[binder,2],[0,0]]}
  assert nodes[integral]=={'op':'definite_integral','args':[call,binder,0,28823]}
  assert expr[sid]['parameters']==[4756,2]
  q=[expr[sid]['body']];seen=set(q)
  for i in q:
   for j in actual_children(nodes[i]):
    if j in nodes and j not in seen:seen.add(j);q.append(j)
  targets=sorted(i for i in seen if nodes[i]['op']=='actual_background_even_profile' and nodes[i]['args'][0]==system)
  assert targets and all(nodes[i]['args'][2] in (4756,120241) and nodes[i]['args'][3]==2 for i in targets)
  assert all(nodes[i]['op']!='actual_expression_partial' for i in seen)
  rows.append({'order':level,'moment':k,'integral':integral,'binder':binder,'sharedCall':call,'expressionSystem':sid,'ownSystemEvenCalls':targets})
# From source geometry certificate: Xcut=28823 < aSquared=24805, xi endpoint=24806=sqrt(aSquared).
native=json.loads((root/'axial-native/native-domains.json').read_text(encoding='utf8'))
assert native['anchoredPrefix']=='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116'
assert [z['sourceSystem'] for z in native['orderResults']]==[0,3,5]
out={'schema':'MathScope.Y.N2.LocalMomentBinderIdentity/1','rows':rows,'conditionalProof':'For each moment literal binder s lies [0,Xcut]; shared call maps [X,eta]=[s,eta]. The own-system even-profile X operands are X or X*t, the latter under integral t in [0,1] as independently checked by y-n2 audit; Xcut<aSquared follows from axial-native geometry. Thus its xi=sqrt(Xprofile) lies [0,a] for these moments, assuming actual eta range and native semantics. Nested lower systems use separately proved recursive source domain.','limits':'10 literal local moment integral frames, not every N2 current/pressure native frame; axial-native geometry and semantic inputs remain assumptions.','release':'HOLD'}
args.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS exact ten local-moment frames; all other caller domains remain open')
