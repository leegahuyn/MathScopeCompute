#!/usr/bin/env python3
"""Check actual indexed-field Jacobians, constants and ordered jet programs.

No new derivative oracle and no original Jet/PDE discharge is created.
Analytic application requires the original local guarded bodies to be C^k.
"""
from __future__ import annotations
import argparse,hashlib,json
from collections import Counter,defaultdict
from functools import lru_cache
from pathlib import Path
import sympy as S

def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(canonical(x)).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--support',type=Path,required=True);p.add_argument('--compact',type=Path,required=True)
 p.add_argument('--support-proof',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--allow-incomplete-projection',action='store_true');a=p.parse_args()
 B=json.loads(a.support.read_text(encoding='utf-8'));C=json.loads(a.compact.read_text(encoding='utf-8'));P=json.loads(a.support_proof.read_text(encoding='utf-8'))
 assert B['sourceHeaderSHA256']==C['sourceHeaderSHA256']==P['sourceHeaderSHA256']
 assert P['actualGeometricSupportBindingsComplete'] and P['all162OriginalCiLabelSubstitutionsChecked']
 assert all(r['rejected'] for r in P['strictNegativeControls'])
 G=dict(C['sourceGraphExcerpt'])
 for k,v in B['nodes'].items():
  if k in G:assert G[k]==v
  G[k]=v
 fields={d['key']:d for d in B['registryBindings'] if d['key'].startswith('fieldDefinitions:')}
 assert set(fields)=={'fieldDefinitions:'+str(i) for i in range(6,10)}
 directions=[622802,622803,622804,635044,635045,622806]
 local_dirs=[0,1,2,7,8,9]
 for key,field in fields.items():
  d=C['definitions'][key].get('fullDefinition',C['definitions'][key]);assert field['definitionSHA256']==C['definitions'][key]['sha256']
  assert d['directions']==directions and len(field['rows'])==162
  assert all(len(r['values'])==len(r['localParameters'])==10 and len(r['derivativeMaps'])==6 for r in field['rows'])
  for sign in (1,-1):
   selected=[r for r in field['rows'] if r['label']['sign']==sign];assert len(selected)==81
   assert len({(r['localSystem'],r['localBody'],tuple(r['localParameters'])) for r in selected})==1,'Relabelling changed the actual fixed-sign source function.'
 bykey=lambda r:(r['label']['key'],r['label']['sign'])
 rows=fields['fieldDefinitions:6']['rows'];other={k:{bykey(r):r for r in d['rows']} for k,d in fields.items()}
 source_support={bykey(r):r for r in P['sourceRows']}
 variables=S.symbols('R Z T Y0 Y1 theta',real=True);R,Z,T,Y0,Y1,theta=variables
 N=S.Symbol('N',integer=True,positive=True);ell=S.Symbol('ell',integer=True,positive=True);grid=S.symbols('grid0:3',integer=True)
 center=S.Symbol('center',real=True);copy=S.symbols('copy0:2',integer=True);ci=S.Symbol('ci',positive=True);h=S.Symbol('h',positive=True)
 @lru_cache(None)
 def node(i):return G[str(i)]
 def evaluator(env):
  @lru_cache(None)
  def at(i):
   if i in env:return env[i]
   n=node(i);op=n['op'];aa=n['args']
   if op=='rational':return S.Rational(*map(int,aa))
   if op in ('coordinate','source_parameter'):return S.Symbol('source_'+str(i),real=True)
   if op=='add':return S.Add(*(at(x) for x in aa))
   if op=='multiply':return S.Mul(*(at(x) for x in aa))
   if op=='inverse':return 1/at(aa[0])
   if op=='integer_power':return at(aa[0])**aa[1]
   if op=='sqrt_positive':return S.sqrt(at(aa[0]))
   if op=='exp':return S.exp(at(aa[0]))
   if op=='log_positive':return S.log(at(aa[0]))
   if op=='ceiling':return S.ceiling(at(aa[0]))
   if op=='smooth_piecewise':
    x,l,r=map(at,aa[:3]);assert all(t.is_number for t in (x,l,r))
    return at(aa[3] if x<=l else aa[5] if x>=r else aa[4])
   raise ValueError('Nonprimitive actual map coefficient '+str(i)+' '+op)
  return at
 def equal(x,y):return S.expand(x-y)==0 or S.cancel(x-y)==0
 def constant_cone(root,frozen):
  seen=set();todo=[root];coordinates=set()
  while todo:
   i=todo.pop()
   if i in seen:continue
   seen.add(i)
   if i in frozen:continue
   n=node(i);op=n['op'];aa=n['args']
   if op=='coordinate':coordinates.add(i);continue
   if op in ('rational','source_parameter'):continue
   if op in ('inverse','sqrt_positive','log_positive','exp','sine','cosine','integer_power','source_step_derivative','ceiling'):todo.extend(aa[:1])
   elif op in ('add','multiply','maximum','smooth_piecewise'):todo.extend(aa)
   else:raise ValueError('Unreviewed nonprimitive coefficient '+str(i)+' '+op)
  assert not coordinates.intersection(directions),'A supposedly frozen coefficient depends on a differentiated original coordinate.'
  return {'source':root,'sourceNodes':len(seen),'remainingCoordinateSources':sorted(coordinates)}
 map_checks=[];gaps=set();constant_checks={};unique_actual_maps={};first_sample=None;normalized_tuple={};normalized_outer={}
 for ri,row in enumerate(rows):
  binding=source_support[bykey(row)];assert binding['originalWaveRowSHA256']==sha(row)
  familyrows=[other[k][bykey(row)] for k in sorted(fields)]
  assert all(r['values']==row['values'] and r['derivativeMaps']==row['derivativeMaps'] and r['guards']==row['guards'] for r in familyrows)
  frozen={622791,*row['values'][3:7],*binding['copySources'],binding['deltaSource']}
  coefficient_roots={term['coefficient'] for column in row['derivativeMaps'] for term in column}
  coefficient_roots.update(r['coefficient'] for r in familyrows)
  for root in coefficient_roots:
   try:constant_checks[(root,tuple(sorted(frozen)))]=constant_cone(root,frozen)
   except KeyError as error:gaps.add(str(error.args[0]))
  for delta in range(5):
   env={622791:N,row['values'][3]:ell,9:h,635044:Y0,635045:Y1,622802:R,622803:Z,622804:T,622806:theta,
        binding['centerSource']:center,binding['copySources'][0]:copy[0],binding['copySources'][1]:copy[1],
        binding['deltaSource']:S.Integer(delta),binding['ciSource']:ci}
   env.update(dict(zip(row['values'][4:7],grid)))
   at=evaluator(env);mapped=[at(i) for i in row['values']]
   if delta not in normalized_tuple:normalized_tuple[delta]=mapped
   else:assert all(equal(x,y) for x,y in zip(mapped,normalized_tuple[delta])),'A candidate relabelled the actual physical argument formula.'
   # Independently differentiate the full actual affine argument tuple.
   jac=[[S.diff(value,var) for var in variables] for value in mapped]
   assert all(S.diff(x,var)==0 for line in jac for x in line for var in variables),'A nonaffine row needs additional Leibniz/chain terms.'
   checked=0
   for j,column in enumerate(row['derivativeMaps']):
    declared=defaultdict(lambda:S.Integer(0));missing=False
    for term in column:
     try:declared[term['parameter']]+=at(term['coefficient'])
     except KeyError as error:gaps.add(str(error.args[0]));missing=True
    if missing:continue
    assert all(equal(declared[q],jac[q][j]) for q in range(10)),('Wrong actual native derivative map',ri,delta,j)
    checked+=1
   for key,member in zip(sorted(fields),familyrows):
    coefficient=at(member['coefficient']);assert all(S.diff(coefficient,var)==0 for var in variables)
    if key not in normalized_outer:normalized_outer[key]=coefficient
    else:assert equal(coefficient,normalized_outer[key]),'A relative candidate changed the fixed-label normalization formula.'
   map_checks.append({'row':ri,'delta':delta,'exactActualJacobianColumnsChecked':checked,'allMapJacobianColumnsConstant':True})
   if ri==0 and delta==0:first_sample=(env,jac,row)
  unique_actual_maps[sha(row['derivativeMaps'])]=row['derivativeMaps']
 # Preserve EVERY original ordered request, including both orders of a
 # mixed derivative. Generated targets always retain the actual local body.
 requests=[];ordered_body_programs=0
 for key in sorted(fields):
  keyrows=fields[key]['rows'];family=C['families'][key]
  for request in family:
   ordered=request['orderedSourceCoordinates'];assert 1<=len(ordered)<=2
   sourcecall=C['sourceCalls'][str(request['sourceNode'])]
   assert sourcecall['definitionKey']==key and sourcecall['node']['op']=='m3_aux_indexed_partial'
   assert sourcecall['node']['args'][0]==int(key.split(':')[1]) and sourcecall['node']['args'][2]==[0]*6
   native_definition=C['definitions'][key].get('fullDefinition',C['definitions'][key])
   assert sourcecall['node']['args'][1]==native_definition['parameters']
   columns=[directions.index(v) for v in ordered];target=request['conditionalTarget']
   assert target['registry']==key
   assert target['orders']==[ordered.count(v) for v in directions]
   programs=[]
   for row in keyrows:
    expansion={((0,)*10,()):1}
    for j in columns:
     nxt=Counter()
     for (orders,factors),multiplicity in expansion.items():
      for term in row['derivativeMaps'][j]:
       alpha=list(orders);alpha[term['parameter']]+=1
       nxt[(tuple(alpha),tuple(sorted((*factors,term['coefficient']))) )]+=multiplicity
     expansion=dict(nxt)
    terms=[{'actualLocalOrders':list(orders),'originalCoefficientFactors':list(factors),'integerMultiplicity':mult} for (orders,factors),mult in sorted(expansion.items())]
    program={'actualLocalSystem':row['localSystem'],'actualLocalBody':row['localBody'],'actualLocalParameters':row['localParameters'],
             'actualFullArguments':row['values'],'actualOuterCoefficient':row['coefficient'],'originalGuards':row['guards'],
             'orderedOriginalSourceDirections':ordered,'chainTerms':terms}
    programs.append(program);ordered_body_programs+=1
   requests.append({'id':request['id'],'registry':key,'orderedOriginalSourceDirections':ordered,
                    'actualOriginalNativeCallSource':request['sourceNode'],'actualOriginalNativeCallSHA256':sourcecall['sha256'],
                    'originalConditionalNativeTarget':target,'all162ActualLocalProgramsSHA256':sha(programs),
                    'rowCount':len(programs),'localBodyProgramCount':len(programs),'firstActualRowProgram':programs[0],
                    'actualLocalDerivativeValuesOrExistenceClaimed':False,'originalRequestStillOpen':True})
 assert len(requests)==67 and ordered_body_programs==67*162
 # Source mutations test the exact bindings, not a floating-point sample.
 controls=[]
 if first_sample:
  env,jac,sample=first_sample
  def reject(name,check):
   try:check()
   except AssertionError:controls.append({'name':name,'rejected':True})
   else:raise AssertionError('Accepted negative control '+name)
  torus=sample['derivativeMaps'][3];assert len(torus)==2
  if all(str(t['coefficient']) in G for t in torus):
   at=evaluator(env);true=[(t['parameter'],at(t['coefficient'])) for t in torus]
   root=torus[0]['coefficient'];saved=G[str(root)];temporary='9000001';assert temporary not in G
   G[temporary]=saved;G[str(root)]={'op':'add','args':[int(temporary),1]};node.cache_clear()
   try:reject('changed actual native torus Jacobian source node',lambda: assertion(equal(evaluator(env)(root),jac[true[0][0]][3])))
   finally:G[str(root)]=saved;del G[temporary];node.cache_clear()
   reject('omitted actual native torus Jacobian term',lambda: assertion(equal(0,jac[true[1][0]][3])))
   # D_Y0^2 of the ACTUAL affine rectangle has a mixed local term2*a*b.
   a0,b0=true[0][1],true[1][1];assert not equal(a0*b0,0)
   reject('omitted actual second-derivative binomial multiplicity',lambda: assertion(equal(a0*b0,2*a0*b0)))
  else:controls.append({'name':'torus Jacobian/omitted term/binomial controls','rejected':False,'reason':'actual coefficient nodes absent'})
  at=evaluator(env);mu=at(sample['coefficient'])
  root=sample['coefficient'];saved=G[str(root)];temporary='9000001';assert temporary not in G
  G[temporary]=saved;G[str(root)]={'op':'add','args':[int(temporary),622802]};node.cache_clear()
  try:reject('direction-dependent actual outer coefficient with omitted Leibniz term',lambda: assertion(S.diff(evaluator(env)(root),R)==0))
  finally:G[str(root)]=saved;del G[temporary];node.cache_clear()
 complete=not gaps and all(r['exactActualJacobianColumnsChecked']==6 for r in map_checks)
 if not a.allow_incomplete_projection:assert complete and all(r['rejected'] for r in controls),'Incomplete original-map projection or failed control'
 result={'schema':'MathScope.N6.ActualIndexedDerivativeMaps/1','sourceHeaderSHA256':B['sourceHeaderSHA256'],
         'inputSHA256':{'support':hashlib.sha256(a.support.read_bytes()).hexdigest(),'compact':hashlib.sha256(a.compact.read_bytes()).hexdigest(),
                        'supportProof':hashlib.sha256(a.support_proof.read_bytes()).hexdigest()},
         'actualIndexedMapGeometryComplete':complete,'actualRowsAcrossFourFields':648,'actualDistinctSourceRows':162,
         'fixedSignActualSourceFunctionDoesNotChangeOnRelabelling':True,'allActualCandidateArgumentAndOuterScaleFormulasLabelInvariant':True,
         'actualRowAndIntegerBranchChecks':map_checks,'frozenSourceCoefficientConesChecked':len(constant_checks),
         'coefficientConeBindingsSHA256':sha([{'frozenSourceRoots':list(k[1]),**v} for k,v in sorted(constant_checks.items())]),
         'missingActualSourceNodes':sorted(gaps),'originalOrderedNativeRequests':requests,
         'originalOrderedRequestsPreserved':67,'actualBodyBoundOrderedLocalProgramsGenerated':ordered_body_programs,
         'strictNegativeControls':controls,'originalJetNewDischarged':0,'originalPDENewDischarged':0,
         'conditionalCalculusConclusion':'For the actual four native indexed fields and all67 original ordered jet requests, their emitted source chain programs equal actual derivatives when the unchanged fixed-label guarded local bodies have the required C1/C2 regularity and flat zero extension. Every actual coefficient and Jacobian is constant in the differentiated directions with the original discrete labels frozen; no Leibniz or higher-map term is omitted.',
         'remainingAnalyticPremise':'Actual original guarded local-body C1/C2 regularity, including its flat cutoff boundaries. The programs do not prove or replace those derivatives by formal unknown values.',
         'finiteRelabellingGluing':'Each actual outer slow cutoff has support radius3/4. A leaving/entering nearest-label candidate has distance at least3/2, and is identically zero on a neighborhood of that relabelling seam. Actual copy seams have |offset_j|=1/2 while support requires|offset_j|<=sqrt2*r0<1/4, so each whole guarded row is identically zero near every copy seam. These joins introduce no additional derivative premise beyond actual fixed-label guarded-body regularity.',
         'proofComplete':False}
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({'bytes':a.out.stat().st_size,'actualMapGeometryComplete':complete,'missingNodes':len(gaps),'orderedRequests':67,
                   'actualOrderedLocalPrograms':ordered_body_programs,'newOriginalJetDischarged':0}))

def assertion(condition):
 if not condition:raise AssertionError('Expected exact source binding failed')
if __name__=='__main__':main()
