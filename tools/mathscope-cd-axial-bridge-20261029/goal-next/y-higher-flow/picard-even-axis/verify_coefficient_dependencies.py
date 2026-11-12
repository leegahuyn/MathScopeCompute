"""Check actual leading-only source matrix closure and xi-derivative roots."""
import collections,hashlib,json,sys
from pathlib import Path
assert len(sys.argv)==5,'usage: N4_REACHED N4_REGISTRY DERIVATIVE_RECEIPT OUTPUT'
source,registry,derivatives,out=map(Path,sys.argv[1:]);helper=Path(__file__).resolve().parent.parent.parent/'y'/'native_reference_scopes.py';assert hashlib.sha256(helper.read_bytes()).hexdigest()=='37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758';sys.path.insert(0,str(helper.parent));from native_reference_scopes import actual_children
raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()=='1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc';x=json.loads(raw);n=dict(x['nodes']);rb=registry.read_bytes();assert hashlib.sha256(rb).hexdigest()=='049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad';reg=json.loads(rb);pic=json.loads(reg['base']['picard']);d=json.loads(derivatives.read_text(encoding='utf8'));assert d['sourceGraphSHA256']==x['graphSHA256']=='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd' and d['addedNodes']==2940 and d['addedNodesSHA256']=='b9a15fce79388d7d606241af4a6c951c29f672c8590a891ed2546c99d1dafd13'
rows=[]
for row,sid in zip(d['rows'],[0,3,5,7,9]):
 s=pic[sid];assert row['system']==sid and row['order']==s['order'] and row['xi']==s['xi'] and len(row['derivativeRoots'])==19
 for z in row['derivativeRoots']:
  assert z['original']==[s['A0'],s['A1']][z['matrix']][z['row']][z['column']] and z['original']!=0 and 0<=z['derivative']<130348+d['addedNodes']
 roots=set(j for mat in [s['A0'],s['A1']] for line in mat for j in line);q=list(roots);seen=set(q)
 for i in q:
  for j in actual_children(n[i]):
   assert j in n,(i,j)
   if j not in seen:seen.add(j);q.append(j)
 native=collections.Counter(n[i]['op'] for i in seen if n[i]['op'].startswith(('actual_','m3_')))
 assert native=={'actual_natural_series':103},(sid,native)
 rows.append({'system':sid,'order':s['order'],'sourceCoefficientNodes':len(seen),'naturalSeriesNodes':103,'lowerPicardNodes':0,'generatedCoefficientDerivatives':19})
result={'schema':'MathScope.OriginalPicard.ActualCoefficientDerivativeClosure/1','sourceGraphSHA256':x['graphSHA256'],'rows':rows,'nonzeroCoefficientDerivatives':95,'dynamicSourceDerivativeNodes':2940,'dynamicSourceDerivativeSHA256':d['addedNodesSHA256'],'scope':'Exact original A0/A1 ordinary operand closures contain only the 103 leading natural-series native nodes and no lower Picard or M3 native calls. The source differentiator separately generated 95 xi derivative roots. This does not evaluate their analytic suprema or certify the natural-series eta strip; those are original leading-data obligations.','release':'HOLD'}
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n');print('PASS original five leading-only coefficient closures and 95 derivative roots')
