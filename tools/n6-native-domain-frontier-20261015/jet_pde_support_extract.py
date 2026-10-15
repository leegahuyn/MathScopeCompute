#!/usr/bin/env python3
"""Read-only original-node extraction specifically for 162-row support binding."""
import argparse,importlib.util,json
from collections import deque,Counter
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--source-db',type=Path,required=True);p.add_argument('--stage3',type=Path,required=True)
 p.add_argument('--compact',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 sp=importlib.util.spec_from_file_location('support_original_stage3',a.stage3);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);g=m.Source(a.source_db)
 D=json.loads(a.compact.read_text(encoding='utf-8'));defs=D['definitions'];roots=set();map_roots=set();local_bodies=set();bindings=[]
 for key in ['definitions:1:'+str(i) for i in range(3)]+['fieldDefinitions:'+str(i) for i in range(6,10)]:
  v=defs[key];d=v.get('fullDefinition',v);assert len(d['rows'])==162
  bindings.append({'key':key,'name':d['name'],'definitionSHA256':v['sha256'],'rows':d['rows']})
  for row in d['rows']:
   roots.update(row['values']);roots.update(t for guard in row['guards'] for t in guard)
   roots.add(row['coefficient']);local_bodies.add(row['localBody'])
   map_roots.update(term['coefficient'] for column in row['derivativeMaps'] for term in column)
 roots.update(map_roots)
 # All frozen label/center/copy/covering primitives are traversed to leaves.
 # Native calls retain their arguments but never gain an asserted regularity.
 roots.add(623025) # actual original c_i, needed for Ls=2*r0/c_i after label substitution
 todo=deque((i,None) for i in sorted(roots));todo.extend((i,8) for i in sorted(local_bodies));nodes={};native={};cut=set();ops=Counter();expanded={}
 unary={'inverse','sqrt_positive','log_positive','exp','sine','cosine','ceiling','integer_power','source_step_derivative'}
 while todo:
  i,depth=todo.popleft()
  if i in expanded and (expanded[i] is None or depth is not None and expanded[i]>=depth):continue
  assert len(nodes)<18000,'Support extraction budget exceeded'
  expanded[i]=depth;n=g(i)
  if str(i) not in nodes:ops[n['op']]+=1
  nodes[str(i)]=n;op=n['op'];args=n['args']
  if op in ('rational','coordinate','source_parameter'):continue
  if depth==0:cut.add(i);continue
  if op in unary:cs=args[:1]
  elif op in ('add','multiply','maximum','smooth_piecewise','definite_integral'):
   cs=args
   if op=='smooth_piecewise' and depth is not None:
    # A local body's actual guard thresholds need their COMPLETE primitive
    # cones, even when the guarded analytic body is depth bounded.
    todo.extend((j,None) for j in args[:3])
  elif op in ('actual_monotone_root','actual_quadratic_root'):cs=args[1:];native[str(i)]=n
  elif op in ('actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial',
              'm3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial','m3_forced_expression_partial'):
   cs=args[1];native[str(i)]=n
  else:native[str(i)]=n;continue
  todo.extend((j,None if depth is None else depth-1) for j in cs)
 # Fail instead of publishing an apparently complete c_i projection with
 # a depth-truncated ancestor. This is a graph coverage assertion only.
 ci_seen=set();ci_stack=[623025]
 while ci_stack:
  i=ci_stack.pop()
  if i in ci_seen:continue
  ci_seen.add(i);assert str(i) in nodes,'Missing actual c_i ancestor '+str(i)
  n=nodes[str(i)];op=n['op'];args=n['args']
  if op in ('rational','coordinate','source_parameter'):continue
  if op in unary:ci_stack.extend(args[:1])
  elif op in ('add','multiply','maximum','smooth_piecewise'):ci_stack.extend(args)
  else:raise ValueError('Nonprimitive actual c_i ancestor '+str(i)+' '+op)
 # Coefficients are constant for the NATIVE FIXED-LABEL derivative rule.
 # Their unfrozen values contain nearest-label ceil -> point-chart roots;
 # that global native frontier remains above. It is NOT a primitive or
 # constant cone claim before the actual integer label boundary is cut.
 # Never cut a continuous coordinate, a c_i value, or a native function.
 peer=next(d for d in bindings if d['key']=='definitions:1:0')
 peers={(r['label']['key'],r['label']['sign']):r for r in peer['rows']}
 smooth_directions={622802,622803,622804,635044,635045,622806}
 grouped={};four_field_roots=set()
 for field in (d for d in bindings if d['key'].startswith('fieldDefinitions:')):
  for row_index,row in enumerate(field['rows']):
   matching=peers[(row['label']['key'],row['label']['sign'])]
   assert row['label']['ell']==matching['label']['ell'] and row['label']['grid']==matching['label']['grid']
   frozen={622791,row['label']['ell'],*row['label']['grid'],*matching['values'][12:14],matching['values'][15]}
   assert not frozen.intersection(smooth_directions),'Cannot freeze a differentiated original coordinate'
   for root in sorted({term['coefficient'] for column in row['derivativeMaps'] for term in column}):
    four_field_roots.add(root);seen=set();stack=[root];cuts=set();coordinates=set()
    while stack:
     i=stack.pop()
     if i in seen:continue
     seen.add(i);assert str(i) in nodes,'Missing actual derivativeMap coefficient ancestor '+str(i)
     if i in frozen:cuts.add(i);continue
     n=nodes[str(i)];op=n['op'];args=n['args']
     if op=='coordinate':coordinates.add(i);continue
     if op in ('rational','source_parameter'):continue
     if op in unary:stack.extend(args[:1])
     elif op in ('add','multiply','maximum','smooth_piecewise'):stack.extend(args)
     else:raise ValueError('Unreviewed native operator AFTER original frozen-label boundary '+str(i)+' '+op)
    assert not coordinates.intersection(smooth_directions),'An actual map coefficient has an unfrozen continuous-coordinate capture'
    key=(root,tuple(sorted(cuts)))
    if key not in grouped:
     grouped[key]={'root':root,'nodes':len(seen),'encounteredOriginalFrozenSourceRoots':sorted(cuts),
       'remainingCoordinateSources':sorted(coordinates),'allPrimitiveAncestorsPresentUpToOriginalFrozenLabels':True,
       'noUnfrozenDifferentiatedCoordinate':True,'applications':[]}
    grouped[key]['applications'].append({'registry':field['key'],'row':row_index})
 assert len(four_field_roots)==22,'Changed original four-field map coefficient inventory'
 map_cones=list(grouped.values())
 result={'schema':'MathScope.N6.Actual162SupportAndDerivativeMapBindings/1','sourceHeaderSHA256':D['sourceHeaderSHA256'],'readOnly':True,
  'registryBindings':bindings,'nodes':nodes,'operations':dict(ops),'nativeCallFrontier':native,'boundedLocalBodyFrontier':sorted(cut),
  'frozenRowArgumentPrimitiveConesRetained':False,'sourceRowArgumentConesRetainedThroughNativeFrontier':True,'localBodyOnlyTopEightLevelsRetained':True,
  'actualOriginalCiPrimitiveCone':{'root':623025,'nodes':len(ci_seen),'allSourceAncestorsPresent':True},
  'actualDerivativeMapCoefficientPrimitiveCones':map_cones,
  'actualFourFieldMapCoefficientRootCount':len(four_field_roots),
  'derivativeMapConeScope':'Only fieldDefinitions6..9, ONLY AFTER exact original integer N/ell/grid/copy/delta roots are frozen. No c_i value or native function is frozen. The unfrozen global native frontier remains explicitly retained and its regularity is OPEN.',
  'newDischarged':0,'scope':'Original row/center/label/copy/guard graph bindings for support proof; smoothness of guarded inner bodies remains external.'}
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({'bytes':a.out.stat().st_size,'sourceNodes':len(nodes),'sourceRegistryDefinitions':len(bindings),'newDischarged':0}))
if __name__=='__main__':main()
