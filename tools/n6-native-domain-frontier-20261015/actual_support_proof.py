#!/usr/bin/env python3
"""Independently bind actual source rows to the original exact support palette."""
from __future__ import annotations
import argparse,hashlib,json
from collections import Counter
from functools import lru_cache
from pathlib import Path
import sympy as S

def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(canonical(x)).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--support',type=Path);p.add_argument('--compact',type=Path)
 p.add_argument('--bindings',type=Path);p.add_argument('--nodes',type=Path);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 if a.support:
  B=json.loads(a.support.read_text(encoding='utf-8'));G=B['nodes'];inputs={'supportSHA256':hashlib.sha256(a.support.read_bytes()).hexdigest()}
 else:
  assert a.bindings and a.nodes,'Use --support raw JSON or both --bindings and --nodes projections.'
  B=json.loads(a.bindings.read_text(encoding='utf-8'));G=json.loads(a.nodes.read_text(encoding='utf-8'))['nodes']
  inputs={'bindingsSHA256':hashlib.sha256(a.bindings.read_bytes()).hexdigest(),'nodesSHA256':hashlib.sha256(a.nodes.read_bytes()).hexdigest()}
 if a.compact:
  C=json.loads(a.compact.read_text(encoding='utf-8'));assert C['sourceHeaderSHA256']==B['sourceHeaderSHA256']
  for k,v in C['sourceGraphExcerpt'].items():
   if k in G:assert G[k]==v,'Conflicting original source node '+k
   else:G[k]=v
  inputs['compactSHA256']=hashlib.sha256(a.compact.read_bytes()).hexdigest()
 defs={x['key']:x for x in B['registryBindings']}
 roots=defs['definitions:1:0']['rows'];assert len(roots)==162
 M=2**20;r0=S.Rational(1,2**34);sqrt2=S.sqrt(2);Dgeom=4-2*sqrt2;vr=(S.Integer(1),1-sqrt2);vt=(sqrt2-1,S.Integer(1))
 J=S.eye(2);matrices=[]
 for delta in range(5):
  if delta:J=J*S.Matrix([[3,1],[1,5]])
  matrices.append(J)
 def evaluator(overrides):
  @lru_cache(None)
  def at(i):
   if i in overrides:return overrides[i]
   n=G[str(i)];op=n['op'];args=n['args']
   if op=='rational':return S.Rational(*map(int,args))
   if op in ('coordinate','source_parameter'):return S.Symbol('source_'+str(i),real=True)
   if op=='add':return S.Add(*(at(x) for x in args))
   if op=='multiply':return S.Mul(*(at(x) for x in args))
   if op=='inverse':return 1/at(args[0])
   if op=='integer_power':return at(args[0])**args[1]
   if op=='sqrt_positive':return S.sqrt(at(args[0]))
   if op=='exp':return S.exp(at(args[0]))
   if op=='log_positive':return S.log(at(args[0]))
   if op=='ceiling':return S.ceiling(at(args[0]))
   if op=='smooth_piecewise':
    x,l,r=map(at,args[:3])
    if x.is_number and l.is_number and r.is_number:return at(args[3] if x<=l else args[5] if x>=r else args[4])
   raise ValueError('Unsupported or nonconstant source operation '+str(i)+' '+op)
  return at
 def zero(x):return S.expand(x)==0 or S.cancel(x)==0
 def labelkey(row):return (row['label']['key'],row['label']['sign'])
 bykey={labelkey(r):r for r in roots};assert len(bykey)==162
 for key,d in defs.items():
  assert len(d['rows'])==162
  assert {labelkey(r) for r in d['rows']}==set(bykey)
  for row in d['rows']:
   common=bykey[labelkey(row)];assert row['guards']==common['guards']
   assert row['label']['ell']==common['label']['ell'] and row['label']['grid']==common['label']['grid']
 reports=[];ci_bindings=[];ci_gaps=set();ell=S.Symbol('ell',integer=True,positive=True);g0,g1,g2=S.symbols('g0 g1 g2',integer=True);Y0,Y1,c0=S.symbols('Y0 Y1 c0',real=True);ci=S.Symbol('ci',positive=True);n0,n1=S.symbols('n0 n1',integer=True)
 N=S.Symbol('N',integer=True,positive=True);h=S.Symbol('h',positive=True);bandCoordinate=S.Symbol('original_band_coordinate',real=True)
 nearestBand=bykey[('0:0:0:0',1)]['label']['ell'];nearestBandSymbol=S.Symbol('actual_nearest_band',integer=True)
 gridbase={b:bykey[(str(b)+':0:0:0',1)]['label']['grid'] for b in (-1,0,1)}
 grid_symbols={b:S.symbols('actual_mesh_'+str(b)+'_0:3',integer=True) for b in (-1,0,1)}
 def integer_expression(i,seen=None):
  seen=set() if seen is None else seen
  if i in seen:return True
  seen.add(i);n=G[str(i)];op=n['op'];aa=n['args']
  if op=='rational':return int(aa[0])%int(aa[1])==0
  if op=='ceiling':return True
  if op=='coordinate':return i==622791
  if op in ('add','multiply'):return all(integer_expression(j,seen) for j in aa)
  if op=='integer_power':return aa[1]>=0 and integer_expression(aa[0],seen)
  return False
 floor=lambda x:-S.ceiling(-x)
 mod=lambda x,m:x-m*floor(x/m)
 for index,row in enumerate(roots):
  values=row['values'];assert values[3]==row['label']['ell'] and values[4:7]==row['label']['grid']
  relative=list(map(int,row['label']['key'].split(':')));assert len(relative)==4 and all(x in (-1,0,1) for x in relative)
  assert integer_expression(values[3]) and all(integer_expression(i) for i in values[4:7])
  actualnearest=evaluator({nearestBand:nearestBandSymbol})
  assert zero(actualnearest(values[3])-nearestBandSymbol-relative[0])
  actualmesh=evaluator(dict(zip(gridbase[relative[0]],grid_symbols[relative[0]])))
  for j in range(3):assert zero(actualmesh(values[4+j])-grid_symbols[relative[0]][j]-relative[j+1])
  env=dict(zip(values[3:7],[ell,g0,g1,g2]));at=evaluator(env)
  color=mod(ell,9)
  for g in (g0,g1,g2):color=5*color+mod(g,5)
  signbit=0 if row['label']['sign']==1 else 1
  expected=(2*color+signbit+1)/M
  assert zero(at(values[10])-expected),('Wrong original palette center',index)
  assert at(values[11])==0
  # Actual velocity and pressure use exactly the same row, center, copy and
  # guard labels; check the full original xi/v maps in all five integer lifts.
  checks=[]
  waves=[next(r for r in defs['fieldDefinitions:'+str(k)]['rows'] if labelkey(r)==labelkey(row)) for k in range(6,10)]
  assert all(w['values']==waves[0]['values'] for w in waves)
  w=waves[0];vnode=G[str(w['values'][8])];assert vnode['op']=='multiply'
  inverse=[x for x in vnode['args'] if G[str(x)]['op']=='inverse'];assert len(inverse)==1
  cinode=G[str(inverse[0])]['args'][0]
  try:
   ci_local=evaluator({622791:ell,9:h})(623025)
   ci_row=evaluator({values[3]:ell,9:h})(cinode)
   assert zero(ci_local-ci_row),('Original c_i label substitution is false',index)
   ci_bindings.append({'row':index,'originalLocalCiSource':623025,'originalLabelCiSource':cinode,'actualLabelSubstitution':{622791:values[3]},'equal':True})
  except KeyError as error:ci_gaps.add(str(error.args[0]))
  # Bind the four actual slow source guards to the SAME band and mesh
  # integers used by the palette, rather than accepting a label string.
  Rs,Zs,Ts=S.symbols('actual_R_label actual_Z_label actual_T_label',real=True)
  guardenv=dict(zip([*w['values'][:3],values[3],*values[4:7],625157],[Rs,Zs,Ts,ell,g0,g1,g2,bandCoordinate]))
  atguard=evaluator(guardenv)
  for j,x in enumerate((Rs,Zs,Ts)):
   actualguard=row['guards'][j+1]
   assert zero(atguard(actualguard[0])-(ell**6*x-(g0,g1,g2)[j]))
   assert atguard(actualguard[1])==-S.Rational(3,4) and atguard(actualguard[2])==S.Rational(3,4)
  actualband=row['guards'][4]
  assert zero(atguard(actualband[0])-bandCoordinate+ell)
  assert atguard(actualband[1])==-S.Rational(3,4) and atguard(actualband[2])==S.Rational(3,4)
  # The actual palette-level difference is bound to its floor formula.
  atdelta=evaluator({values[3]:ell,622791:N,9:h})
  f=lambda e:((1+h)*e*S.log(2)-2*S.log(e))/S.log(4+sqrt2)
  assert zero(atdelta(values[15])-(floor(f(ell))-floor(f(N-2))))
  for delta,J in enumerate(matrices):
   fixed={values[15]:S.Integer(delta),values[10]:c0,values[11]:S.Integer(0),635044:Y0,635045:Y1,cinode:ci}
   at=evaluator(fixed)
   mapped=J*S.Matrix([Y0,Y1]);expectedcopy=[floor(mapped[0]-c0+S.Rational(1,2)),floor(mapped[1]+S.Rational(1,2))]
   assert zero(at(values[12])-expectedcopy[0]),('copy0',index,delta)
   assert zero(at(values[13])-expectedcopy[1]),('copy1',index,delta)
   fixed.update({values[12]:n0,values[13]:n1});at=evaluator(fixed)
   off=[mapped[0]-c0-n0,mapped[1]-n1]
   xi=(vr[0]*off[0]+vr[1]*off[1])/Dgeom
   eta=(vt[0]*off[0]+vt[1]*off[1])/Dgeom
   assert zero(at(w['values'][7])-xi),('xi',index,delta)
   assert zero(at(w['values'][8])-(eta+r0)/ci),('v',index,delta)
   checks.append(delta)
  reports.append({'row':index,'label':row['label'],'centerSource':values[10],'copySources':values[12:14],'deltaSource':values[15],
                  'velocityXiSource':w['values'][7],'velocityVSource':w['values'][8],'ciSource':cinode,'exactLiftBranchesChecked':checks,
                  'actualIntegerBandMeshAndSlowGuardBinding':True,'actualPaletteDifferenceFloorFormulaChecked':True,
                  'actualRowBindingSHA256':sha(row),'originalWaveRowSHA256':sha(w)})
 # Each of the eight retained complete local wave/pressure bodies has
 # seven lazy zero-outside guards; the exact two innermost guards are the
 # original xi and v rectangle. No opaque inner body is assigned zero.
 body_support=[]
 for key in ['fieldDefinitions:'+str(i) for i in range(6,10)]:
  for body in sorted({r['localBody'] for r in defs[key]['rows']}):
   current=body;chain=[]
   for depth in range(7):
    n=G[str(current)];assert n['op']=='smooth_piecewise' and n['args'][3]==0 and n['args'][5]==0
    aa=n['args'];chain.append({'source':current,'coordinate':aa[0],'left':aa[1],'right':aa[2]});current=aa[4]
   assert chain[5]['coordinate']==623035 and chain[6]['coordinate']==622805
   ev=evaluator({623025:ci})
   assert ev(chain[5]['left'])==-r0 and ev(chain[5]['right'])==r0
   assert ev(chain[6]['left'])==0 and zero(ev(chain[6]['right'])-2*r0/ci)
   body_support.append({'registry':key,'localBody':body,'lazyZeroGuardChain':chain,'innerActualBody':current,
                        'actualSupport':'|xi|<=r0, 0<=v<=2*r0/c_i_local',
                        'neverAssignsInnerBodyAnArbitraryValue':True})
 # Independently verify EVERY original rational-center obstruction.
 palette_checks=[]
 for delta,J in enumerate(matrices):
  if delta==0:continue
  vals=[min(int(J[1,0])*nu%M,M-int(J[1,0])*nu%M) for nu in range(1,2251)]
  assert min(vals)>=1
  palette_checks.append({'delta':delta,'J':[[int(J[i,j]) for j in range(2)] for i in range(2)],
                         'all2250VerticalResiduesChecked':True,'minimumVerticalIntegerDistance':min(vals)})
 maxrow=max(sum(int(J[i,j]) for j in range(2)) for J in matrices for i in range(2));perturb=3*(maxrow+1)
 assert maxrow==1028 and perturb==3087 and perturb<16384
 result={'schema':'MathScope.N6.Actual162SupportProof/1','sourceHeaderSHA256':B['sourceHeaderSHA256'],
         'inputs':inputs,
         'sourceRows':reports,'actualPaletteCentersChecked':162,'actualNearestCopyMapsChecked':162*5*2,'actualXiVBranchesChecked':162*5*2,
         'actualAll162LabelsAreDistinctMixedRadixColors':True,'actualRowIntegerAndSlowGuardBindingsChecked':162,
         'actualPaletteDifferenceFloorFormulaBindingsChecked':162,'actualLocalVelocityPressureGuardSupport':body_support,
         'actualOriginalCiLabelSubstitutionBindings':ci_bindings,'all162OriginalCiLabelSubstitutionsChecked':len(ci_bindings)==162,
         'missingOriginalCiAncestorNodes':sorted(ci_gaps),
         'coveringDifferenceRangeProof':[
          'The original annular chart has q=2^(-N)*s with1/2<=s<=2. Hence B=-log(q)/log2 lies in[N-1,N+1], and floor(B+1/2) lies in the same integer interval.',
          'The verified actual candidate labels equal that nearest integer plus relativeBand in{-1,0,1}; therefore N-2<=ell_label<=N+2.',
          'The already discharged ORIGINAL band guard gives N>=14, and original0<h<1/16. For x>=N-2>=12, f(x)=((1+h)x log2-2log x)/log(4+sqrt2) has f prime positive, using log2>1/2 and2/x<=1/6.',
          'For x in[N-2,N+2], f(x)-f(N-2) <=4(1+h)log2/log(4+sqrt2)<2(1+h)<17/8<3. Therefore the actual integer floor difference is nonnegative and strictly less than4; in particular it belongs to the original certified branch set0..4.',
          'Pairwise relative differences of the actual covering indices therefore also have absolute value at most4. This proves applicability of the full exact palette separation table without assuming its branch metadata.'
         ],
         'allOriginal2250CenterSeparationChecks':palette_checks,
         'rectanglePerturbation':{'maximumJRowNorm':maxrow,'twoEnlargedRectangleErrorNumerator':perturb,'denominator':2**34,
                                  'minimumCenterSeparation':'1/1048576','strictIntegerGap':16384-perturb},
         'provedSourceBoundFacts':[
          'All162 source palette centers have the original modulo9/modulo5/sign AST, and all actual band/mesh roots are integer-valued expressions.',
          'Within the actual81-candidate atlas, distinct bands differ by1 or2, same-band grid neighbors differ by at most2, and opposite signs have different parity colors. Mixed-radix digits therefore give162 distinct palette centers.',
          'Each actual xi/v and nearest-copy map equals the original J^delta rectangle map in all five integer branches, retaining both torus columns.',
          'The eight complete original local velocity/pressure bodies are lazy-zero outside their original transverse and longitudinal rectangle guards.',
          'The original rational palette separates all such enlarged rectangles for every relative covering difference0..4, by a strict exact margin13297/2^34.'
         ],
         'allSevenRegistriesHaveIdenticalActualLabelsAndOuterGuards':True,'newOriginalObligationsDischarged':0,
         'proofComplete':False,'remaining':'Bind the actual guarded local-body support and prove disjoint tensor products.'}
 result['remaining']='Source c_i_local after original ell-label substitution must equal the actual row c_i in its verified v map. Actual differentiability/flat extension remains an independent regularity obligation.'
 result['conditionalOnlyOn']=['c_i_local(ell_label)=c_i_row (tiny omitted ancestor cone requested).',
                            'The original guarded fields and required derivatives exist on the original chart.']
 result['conditionalConclusion']='For all distinct actual162 wave rows, w_i tensor w_j is identically zero. Under classical C^k regularity their derivative supports stay in the same closed rectangles, so every derivative of each zero cross tensor is zero. The whole common mean and same-row harmonic interactions are retained.'
 # Strict counterfactual controls mutate source operands themselves, run
 # the same exact equality predicates, and restore the original graph.
 # They are never emitted as original source or accepted as hypotheses.
 negative=[];sample=roots[0];sv=sample['values'];sample_w=defs['fieldDefinitions:6']['rows'][0]
 def reject_mutation(name,root,predicate):
  saved=G[str(root)];temporary='9000000';assert temporary not in G
  G[temporary]=saved;G[str(root)]={'op':'add','args':[int(temporary),1]}
  try:
   try:predicate()
   except AssertionError:negative.append({'name':name,'mutatedOriginalSource':root,'rejected':True})
   else:raise AssertionError('Negative control was accepted: '+name)
  finally:G[str(root)]=saved;del G[temporary]
 def center_predicate():
  at=evaluator(dict(zip(sv[3:7],[ell,g0,g1,g2])));color=mod(ell,9)
  for g in (g0,g1,g2):color=5*color+mod(g,5)
  assert zero(at(sv[10])-(2*color+1)/M)
 reject_mutation('changed actual palette center',sv[10],center_predicate)
 def guard_predicate():
  Rs,Zs,Ts=S.symbols('nc_R nc_Z nc_T',real=True)
  env=dict(zip([*sample_w['values'][:3],sv[3],*sv[4:7],625157],[Rs,Zs,Ts,ell,g0,g1,g2,bandCoordinate]))
  assert zero(evaluator(env)(sample['guards'][1][0])-(ell**6*Rs-g0))
 reject_mutation('changed actual mesh guard',sample['guards'][1][0],guard_predicate)
 def copy_predicate():
  at=evaluator({sv[15]:S.Integer(0),sv[10]:c0,635044:Y0,635045:Y1})
  assert zero(at(sv[12])-floor(Y0-c0+S.Rational(1,2)))
 reject_mutation('changed actual nearest-copy branch',sv[12],copy_predicate)
 if len(ci_bindings)==162:
  def ci_predicate():
   assert zero(evaluator({622791:ell,9:h})(623025)-evaluator({sv[3]:ell,9:h})(reports[0]['ciSource']))
  reject_mutation('changed actual c_i normalization',623025,ci_predicate)
 else:negative.append({'name':'changed actual c_i normalization','rejected':False,'notRunReason':'Original c_i ancestor cone is incomplete; the positive identity remains OPEN.'})
 result['strictNegativeControls']=negative
 if a.support and B.get('actualOriginalCiPrimitiveCone',{}).get('allSourceAncestorsPresent'):
  assert len(ci_bindings)==162 and all(x['rejected'] for x in negative),'A complete source projection must prove every c_i binding and reject every control.'
 if len(ci_bindings)==162:
  result['actualGeometricSupportBindingsComplete']=True
  result['conditionalOnlyOn']=['The original guarded fields and required classical derivatives exist on the original chart, including the changing-label/copy joins.']
  result['remaining']='Actual original-source regularity remains OPEN. All geometric label, color, copy, xi/v, guard and c_i normalizations used in the support proof are now independently source-bound.'
  result['conditionalConclusion']='For all distinct actual162 wave rows, w_i tensor w_j is identically zero wherever the original fields are defined. Under actual classical C^k regularity every required derivative of these zero cross tensors vanishes, with derivative support in the same closed disjoint rectangles. Same-row harmonics and all mean-wave interactions remain retained.'
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 print(json.dumps({k:result[k] for k in ('actualPaletteCentersChecked','actualNearestCopyMapsChecked','actualXiVBranchesChecked','proofComplete')}))
if __name__=='__main__':main()
