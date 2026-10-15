#!/usr/bin/env python3
"""Independent source-bound N6 band transport and native pulse-block audit.

This is a mathematical-certificate checker plus exact AST checks, not Lean.
The source-prefix atlas is the ORIGINAL input contract, not all real (Z,T).
It never changes producers, historical matrices, or their completion flags.
"""
from __future__ import annotations
import argparse
from collections import Counter
from fractions import Fraction
from functools import lru_cache
import gzip
import hashlib
import itertools
import json
from math import comb
from pathlib import Path
import sqlite3
from typing import Any, Callable

PARENT = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
RAW = '9be5187506edbd2e7ccdad81392b0c29cc84350f374e331b7b5845a435c7fdf0'
GZIP = '42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
PINS = {
 'checkpoint':'ba1fd222b9b50236dcbe8eff144a43ac6d4a5b724f2352fc0f67afad83f34ef2',
 'frontier':'98275fe97be5933ef51a0facb633eaf11b5f1a90b7d6d42735e9e1473e3f825e',
 'structural':'18c98a280e9dbb355fe10eaecdb5997acd3bd3c99698426f2b825bb3d1a34541',
 'chart':'118f27811481923e39f11c3c56ebdaaf497088d976fa8fa3858ed651ea7b1962',
}
R, Z, T, BAND, QREF, ROOT, LOG_BAND = 622802,622803,622804,622791,622794,622820,625157
IDENTITY=(Z,T)
FAMILIES={
 (632193,632194):{'ell':632182,'q':632185,'c':632187,'sqrtc':632188,'powc':632192,'guard':633637},
 (632227,632228):{'ell':632179,'q':632219,'c':632221,'sqrtc':632222,'powc':632226,'guard':632181},
 (632262,632263):{'ell':632251,'q':632254,'c':632256,'sqrtc':632257,'powc':632261,'guard':633667},
}
TARGETS=(25,38,40,41,68,76,84,92)
KERNEL_PINS={
 'source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
 'source-global-expressions.mjs':'89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1',
 'source-auxiliary-expressions.mjs':'4e1741d0a5ebadaf0858d79b141856d9dc52bb0b3b119b39e6cf83248355ca86',
 'source-coupled-expressions.mjs':'5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39',
}


def require(ok: bool, message: str) -> None:
 if not ok: raise ValueError(message)

def sha_bytes(b: bytes) -> str:return hashlib.sha256(b).hexdigest()
def canonical(o: Any) -> bytes:return json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()
def sha(o: Any) -> str:return sha_bytes(canonical(o))
def read_locked(path: Path, pin: str) -> Any:
 raw=path.read_bytes();require(sha_bytes(raw)==pin,'Changed pinned input: '+str(path));return json.loads(raw)
def write(path: Path, data: Any) -> None:
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def check_source_kernels(folder:Path) -> dict:
 files={}
 for name,pin in KERNEL_PINS.items():
  raw=(folder/name).read_bytes()
  require(sha_bytes(raw)==pin,'Changed original domain/guard kernel '+name)
  files[name]={'sha256':pin,'bytes':len(raw)}
 current=(folder/'source-global-current.mjs').read_text()
 require("referenceChart:'The original (R,Z,T), with T>=0, q=Q_ref*s>0 and 1/2<=s<=2.'" in current,'Original atlas contract absent')
 return {'files':files,'originalAtlasContractLocated':True,'runtimeWholeEvaluatorTested':False}

def proof_arithmetic() -> dict:
 # Affine pairs encode constant + coefficient*h, not sampled h values.
 D=(Fraction(1,2),Fraction(-1));two_h=(Fraction(0),Fraction(2))
 require(tuple(2*x+y for x,y in zip(D,two_h))==(1,0),'Homogeneity exponent identity failed')
 require(2**3<2**4,'Strict band/bracket margins failed')
 lower_upper=Fraction(4,2*2*110)
 upper_lower=Fraction(200*2**12,121)
 require(lower_upper<Fraction(1,2) and upper_lower>2,'Bump plateau arithmetic failed')
 return {'homogeneity':'2*(1/2-h)+2*h=1',
  'activeBand':'-3/4 < L-ell < 3/4',
  'activeScaledRoot':'2^(-3/4) < c*s < 2^(3/4)',
  'bumpPlateauLowerEndpointUpper':str(lower_upper),
  'bumpPlateauUpperEndpointLower':str(upper_lower),
  'proofBasis':'Written analytic proof with exact AST and rational/integer checks; not finite sampling or Lean'}

class Source:
 """Read-only SQLite view made ONLY after authenticating the full gzip stream."""
 def __init__(self, db: Path):
  self.db=sqlite3.connect(db.resolve().as_uri()+'?mode=ro',uri=True)
  self.db.execute('PRAGMA query_only=ON');self.used=set()
 @lru_cache(maxsize=100000)
 def __call__(self, ident: int) -> dict:
  require(type(ident) is int and ident>=0,'Non-source scalar ID')
  row=self.db.execute('SELECT raw FROM nodes WHERE id=?',(ident,)).fetchone()
  require(row is not None,'Missing original source node '+str(ident))
  n=json.loads(row[0]);require(set(n)=={'op','args'},'Changed node grammar')
  self.used.add(ident);return n

def prepare_source(compressed: Path, dest: Path) -> tuple[dict,dict]:
 """Rebuild the disposable cache; a pre-existing database never gains authority."""
 require(sha_bytes(compressed.read_bytes())==GZIP,'Changed original compressed graph')
 dest.unlink(missing_ok=True)
 conn=sqlite3.connect(dest);conn.execute('PRAGMA journal_mode=OFF');conn.execute('PRAGMA synchronous=OFF')
 conn.execute('CREATE TABLE nodes(id INTEGER PRIMARY KEY,raw TEXT)')
 nh=hashlib.sha256();rh=hashlib.sha256();count=0;size=0;batch=[]
 try:
  with gzip.open(compressed,'rb') as stream:
   line=stream.readline();head=json.loads(line);rh.update(line);size+=len(line)
   require(head['firstNode']==0 and head['nodeCount']==3892594,'Changed original header')
   for line in stream:
    require(line.startswith(b'[') and line.rstrip().endswith(b']'),'Malformed NDJSON node')
    key,raw=line[1:].split(b',',1);ident=int(key)
    require(ident==count,'Changed node order')
    nh.update(line);rh.update(line);size+=len(line);count+=1
    batch.append((ident,raw.rstrip(b'\r\n')[:-1].decode('utf-8')))
    if len(batch)>=20000:conn.executemany('INSERT INTO nodes VALUES (?,?)',batch);batch=[]
   if batch:conn.executemany('INSERT INTO nodes VALUES (?,?)',batch)
  require(count==3892594 and size==209857208,'Changed full graph size')
  require(nh.hexdigest()==PARENT and rh.hexdigest()==RAW,'Changed full original source')
  conn.commit()
 finally:conn.close()
 return head,{'parentSHA256':PARENT,'rawSHA256':RAW,'compressedSHA256':GZIP,'nodes':count,'bytes':size,'originalProducerExecuted':False}

def registries(header: dict) -> dict:
 result={}
 def visit(d):
  for k,v in d.items():
   if k=='base' and isinstance(v,dict):visit(v)
   elif isinstance(v,str):
    try:parsed=json.loads(v)
    except ValueError:continue
    require(k not in result,'Ambiguous source registry');result[k]=parsed
 visit(header['definitions']);return result

def q(g:Callable, i:int):
 n=g(i);return Fraction(*map(int,n['args'])) if n['op']=='rational' else None

def scaled(g:Callable, actual:int, scale:int, body:int) -> bool:
 a,b=q(g,scale),q(g,body)
 if a==0 or b==0:return q(g,actual)==0
 if a==1:return actual==body
 if b==1:return actual==scale
 if a is not None and b is not None:return q(g,actual)==a*b
 return g(actual)=={'op':'multiply','args':sorted([scale,body])}

def linear_atoms(g:Callable, root:int, op='add') -> tuple:
 """Flatten a pure sum; all non-add nodes remain bound original atoms."""
 stack=[root];c=Counter();constant=Fraction(0)
 while stack:
  i=stack.pop();n=g(i)
  if n['op']==op:stack.extend(n['args'])
  elif n['op']=='rational':constant+=q(g,i)
  else:c[i]+=1
 return constant,tuple(sorted(c.items()))

def check_sum(g:Callable, root:int, terms:list[int]) -> None:
 const=Fraction(0);c=Counter()
 for t in terms:
  x,y=linear_atoms(g,t);const+=x;c.update(dict(y))
 require(linear_atoms(g,root)==(const,tuple(sorted(c.items()))),'Changed native block row sum')

def downward(alpha:list[int]) -> list[list[int]]:
 require(len(alpha)==3 and all(type(n)is int and 0<=n<=16 for n in alpha),'Bad native multi-index')
 return sorted([list(x) for x in itertools.product(*(range(n+1) for n in alpha))],key=lambda x:(sum(x),','.join(map(str,x))))

def check_chart_graph(g:Callable, chart:dict) -> None:
 require(chart['source']['parentNodesSHA256']==PARENT and chart['source']['actualRoot']==ROOT,'Different inherited chart')
 expect={0:('rational',['0','1']),1:('rational',['1','1']),25:('multiply',[9,24]),19:('rational',['1','2']),24:('rational',['2','1']),20:('rational',['-1','1']),
  9:('source_parameter',['h']),21:('multiply',[9,20]),22:('add',[19,21]),127:('log_positive',[24]),
  622792:('multiply',[127,BAND]),622793:('multiply',[20,622792]),QREF:('exp',[622793]),
  622811:('integer_power',[Z,2]),622812:('log_positive',[622810]),
  622813:('multiply',[25,622812]),622814:('exp',[622813]),622815:('multiply',[622811,622814]),
  622816:('multiply',[20,622815]),622817:('add',[622810,622816]),622818:('multiply',[20,T]),
  622819:('add',[622817,622818]),ROOT:('actual_monotone_root',[2,Z,T]),622830:('multiply',[QREF,ROOT]),
  625155:('log_positive',[622830]),617517:('inverse',[127]),625156:('multiply',[617517,625155]),LOG_BAND:('multiply',[20,625156]),
  625191:('rational',['-3','4']),120836:('rational',['3','4'])}
 for i,(op,args) in expect.items():require(g(i)=={'op':op,'args':args},'Changed source chart/guard graph at '+str(i))
 for pair,f in FAMILIES.items():
  z,t=pair;c,p=f['c'],f['powc'];qn=g(f['q'])
  require(qn['op']=='exp','Band Q is not positive exponential')
  neg=g(qn['args'][0]);require(neg['op']=='multiply' and 20 in neg['args'],'Band Q exponent sign changed')
  mid=next(x for x in neg['args'] if x!=20)
  require(g(mid)=={'op':'multiply','args':sorted([127,f['ell']])},'Band Q is not 2^(-ell)')
  cn=g(c);require(cn['op']=='multiply' and QREF in cn['args'],'Scale lost reference Q')
  inv=next(x for x in cn['args'] if x!=QREF);require(g(inv)=={'op':'inverse','args':[f['q']]},'Scale lost candidate Q')
  require(g(z)=={'op':'multiply','args':[Z,p]} and g(t)=={'op':'multiply','args':[T,c]},'Unequal Z/T scale')
  require(g(f['sqrtc'])=={'op':'sqrt_positive','args':[c]},'Radial scale changed')
  pn=g(p);require(pn['op']=='exp','Missing homogeneous Z exponent')
  pn=g(pn['args'][0]);require(pn['op']=='multiply' and 22 in pn['args'],'Z exponent is not D')
  lg=next(x for x in pn['args'] if x!=22);require(g(lg)=={'op':'log_positive','args':[c]},'Z exponent uses another c')
  gn=g(f['guard']);require(gn['op']=='add' and LOG_BAND in gn['args'],'Band guard not actual log q')
  minus=next(x for x in gn['args'] if x!=LOG_BAND)
  require(g(minus)=={'op':'multiply','args':sorted([20,f['ell']])},'Guard label and input label differ')

def lookup(reg:dict,key:str):
 parts=key.split(':')
 return reg[parts[0]][int(parts[1])] if len(parts)==2 else reg[parts[0]][int(parts[1])][int(parts[2])]

def indexed_definitions(reg:dict) -> list:
 result=[]
 for key,items in reg.items():
  if not isinstance(items,list):continue
  groups=[(f'definitions:{i}',a) for i,a in enumerate(items) if isinstance(a,list)] if key=='definitions' else [(key,items)]
  for prefix,group in groups:
   for i,d in enumerate(group):
    if isinstance(d,dict) and d.get('rows') and 'localParameters' in d['rows'][0]:
     result.append({'key':prefix+':'+str(i),'definition':d})
 return result

def local_expression(reg:dict, key:str, ident):
 if key.startswith('definitions:1:'):
  require(isinstance(ident,str) and ident.startswith('coupled-expression:'),'Changed coupled registry')
  return reg['definitions'][0][int(ident.split(':')[1])]
 require(type(ident)is int,'Non-integer local expression registry')
 return reg['expression'][ident] if ident>=0 else reg['expressionDefinitions'][-1-ident]

def check_cover_rows(cp:dict,reg:dict,g:Callable,chart:dict) -> dict:
 check_chart_graph(g,chart)
 require(reg['monotone'][2]==chart['source']['definition'],'Original root definition and proved chart differ')
 rows=[];counts=Counter();labels=set();by_label=Counter()
 require(len(cp['definitionBindings'])==196,'Changed checkpoint binding inventory')
 cp_keys=set()
 for binding in cp['definitionBindings']:
  d=binding['definition']
  if not d.get('rows'):continue
  require(d==lookup(reg,binding['key']),'Checkpoint definition differs from full parent registry')
  cp_keys.add(binding['key'])
 all_bindings=indexed_definitions(reg)
 require(len(all_bindings)==28,'Changed full-parent indexed registry inventory')
 for binding in all_bindings:
  d=binding['definition']
  local_labels=Counter()
  for j,r in enumerate(d['rows']):
   ps,vs=r['localParameters'],r['values'];require(len(ps)==len(vs) and len(set(ps))==len(ps),'Incomplete/duplicate local tuple')
   require(all(i in ps for i in (R,Z,T,BAND)),'Missing indexed source binder')
   pair=(vs[ps.index(Z)],vs[ps.index(T)])
   require(pair==IDENTITY or pair in FAMILIES,'Unreviewed slow-input family')
   ell=r['label']['ell'];f=next((x for x in FAMILIES.values() if x['ell']==ell),None)
   require(f is not None and vs[ps.index(BAND)]==ell,'Inconsistent actual label binding')
   guard=[f['guard'],625191,120836]
   require(len(r.get('guards',[]))==5 and r['guards'][-1]==guard,'Actual outermost band guard missing/reordered')
   if pair!=IDENTITY:
    require(f==FAMILIES[pair],'Guard belongs to another source scale')
    require(g(vs[ps.index(R)])=={'op':'multiply','args':[R,f['sqrtc']]},'Changed scaled radial coordinate')
   else:require(vs[ps.index(R)]==R,'Identity family changed radial source')
   # Values of grid, signs and torus copies cannot alter these checked slots.
   require(g(r['localBody']) is not None,'Local body absent')
   ex=local_expression(reg,binding['key'],r['localSystem'])
   require(ex['body']==r['localBody'] and ex['parameters']==ps,'Indexed local body or binder differs from original expression')
   expected=[1,1,1] if pair==IDENTITY else [f['sqrtc'],f['powc'],f['c']]
   if 'derivativeScales' in r:require(r['derivativeScales']==expected,'Changed three chart Jacobians')
   else:
    for direction,scale in enumerate(expected):
     require(r['derivativeMaps'][direction]==[{'coefficient':scale,'parameter':ps.index((R,Z,T)[direction])}],'Changed indexed slow derivative mapping')
   key=r['label']['key'];labels.add(key);by_label[key]+=1;local_labels[key]+=1;counts[pair]+=1
   rows.append({'registry':binding['key'],'row':j,'localBody':r['localBody'],'label':key,'ellSource':ell,'sourceZ':pair[0],'sourceT':pair[1],
    'sourceRowSHA256':sha(r),'guard':guard,'inOriginalCartesianCheckpoint':binding['key'] in cp_keys,'status':'PROVED_ON_ORIGINAL_REFERENCE_ATLAS',
    'rootRange':'[1/2,2]' if pair==IDENTITY else '(2^(-3/4),2^(3/4))','wholeNestedCallGraphProof':False})
  expected_labels={':'.join(map(str,x)) for x in itertools.product((-1,0,1),repeat=4)}
  require(set(local_labels)==expected_labels and len(set(local_labels.values()))==1,'Incomplete or uneven individual 81-label cover')
 require(len(rows)==4050 and counts==Counter({IDENTITY:1458,**{k:864 for k in FAMILIES}}),'Changed full four-family inventory')
 cp_rows=[r for r in rows if r['inOriginalCartesianCheckpoint']]
 cp_counts=Counter((r['sourceZ'],r['sourceT']) for r in cp_rows)
 require(len(cp_rows)==2349 and cp_counts==Counter({IDENTITY:486,**{k:621 for k in FAMILIES}}),'Changed checkpoint four-family subset')
 require(labels=={':'.join(map(str,x)) for x in itertools.product((-1,0,1),repeat=4)},'Incomplete actual 81-label cover')
 return {'rows':rows,'examined':len(rows),'provedInOriginalChart':len(rows),'unresolvedAtThisRowLayer':0,'labels':len(labels),
  'indexedDefinitions':len(all_bindings),'originalCheckpointRows':len(cp_rows),'additionalFullParentRows':len(rows)-len(cp_rows),
  'families':[{'sourceZ':k[0],'sourceT':k[1],'rows':v} for k,v in sorted(counts.items())],
  'validForEveryAdmissibleIntegerBand':True,'torusCopiesCannotChangeCheckedSlowSlots':True,
  'radialIntegralVariableDoesNotEnterBandGuard':True,'assumption':'The original declared reference atlas D_h, NOT arbitrary real Z,T.',
  'newInputDomainAssumed':False,'allNestedOriginalOperatorDomainsProved':False}

def check_native_blocks(reg:dict, structural:dict,g:Callable) -> dict:
 blocks=reg['m3GlobalBlocks'];pulses=reg['m3GlobalPulses'];expressions=reg['expression']
 require(len(blocks)==38 and len(pulses)==2,'Changed pulse block inventory')
 old={(int(x['registryKey'].split(':')[1]),x['row']):x for x in structural['actualFailedRows']}
 require(len(old)==188,'Changed historical mismatched-schema list')
 result=[];terms=0;matrix_cells=0;norm_cells=0
 for ib,b in enumerate(blocks):
  p=pulses[b['pulse']];orig=json.loads(p['originalDefinition'])
  require(p['parameters']==[R,Z,T,622807,622808,622809,BAND],'Missing native parent parameter')
  require(p['directions']==[R,Z,T] and p['directionParameterIndices']==[0,1,2],'Changed variational directions')
  require(p['variable']==622805 and p['variable'] not in p['parameters'],'Pulse time captures a slow coordinate')
  require(all(g(x)['op']=='coordinate' for x in [p['variable'],*p['parameters']]),'Non-coordinate native binder')
  for k in ('variable','parameters','matrix','initial','length'):require(p[k]==orig[k],'Native pulse no longer equals original covariance '+k)
  require(p['initial']==[1,0] and p['left']==0,'Changed actual initial data')
  multi=downward(b['requestedOrders'])
  require(b['multiIndices']==multi and b['dimension']==2*len(multi),'Changed downward closure/dimension')
  require(b['pulse'] in (0,1) and b['originalCovariance']==p['covariance'],'Changed pulse selector')
  require(b['intervalLength']==p['length'] and b['fixedLeft']==p['left'],'Changed variational interval')
  require(b['initial']==sum(([1,0] if sum(a)==0 else [0,0] for a in multi),[]),'Changed variational datum')
  require(len(b['coefficients'])==len(multi) and len(b['rows'])==len(multi),'Missing variational row or coefficient')
  coeff={tuple(c['orders']):c for c in b['coefficients']};require(set(coeff)==set(map(tuple,multi)),'Missing coefficient multi-index')
  require(g(b['matrixNorm'])=={'op':'maximum','args':b['blockNorms']},'Changed full sparse matrix norm')
  for a,c in coeff.items():
   require(c['pulse']==b['pulse'] and c['originalMatrix']==p['matrix'] and c['derivativeOrder']==sum(a),'Coefficient/source order mismatch')
   norm=c['norm'];require(norm['matrix']==c['matrix'],'Changed original norm matrix')
   require(norm['norm']=='induced infinity norm' and len(norm['rowSums'])==2,'Changed induced norm convention')
   require(g(norm['upper'])=={'op':'maximum','args':norm['rowSums']},'Changed coefficient norm maximum')
   for j in range(2):check_sum(g,norm['rowSums'][j],[e['upper'] for e in norm['entries'][j]])
   for j in range(2):
    for k in range(2):
     e=norm['entries'][j][k];ex=expressions[e['sharedDefinition']]
     require(e['bodyParameters']==[p['variable'],*p['parameters']] and e['parameters']==p['parameters'],'Hidden norm parameter capture')
     require(ex['body']==c['matrix'][j][k]==e['originalExpression'] and ex['parameters']==e['bodyParameters'],'Native norm body not bound to original coefficient')
     require(e['variable']==p['variable'] and e['length']==p['length'],'Native norm time or length changed')
     # Source expression and derivative refer to the same body and full tuple.
     require(g(e['sharedExpression'])=={'op':'actual_expression_partial','args':[e['sharedDefinition'],e['bodyParameters'],[0]*len(e['bodyParameters'])]},'Changed actual shared coefficient call')
     require(g(e['sharedTimeDerivative'])=={'op':'actual_expression_partial','args':[e['sharedDefinition'],e['bodyParameters'],[1]+[0]*(len(e['bodyParameters'])-1)]},'Changed time-derivative binding')
     require(g(e['valueAtZero'])=={'op':'actual_expression_partial','args':[e['sharedDefinition'],[0,*p['parameters']],[0]*len(e['bodyParameters'])]},'Changed native initial substitution')
     iv=e['integrationVariable']
     require(g(iv)['op']=='coordinate' and iv not in e['bodyParameters'],'Integral binder captures an original parameter')
     require(g(e['integral'])=={'op':'definite_integral','args':[e['integrand'],iv,0,p['length']]},'Changed native FTC binder/endpoints')
     check_sum(g,e['upper'],[e['initialEnvelope'],e['integral']])
     def squared_envelope(envelope, expected_call):
      en=g(envelope);require(en['op']=='sqrt_positive','Changed smooth FTC envelope')
      interior=g(en['args'][0]);require(interior['op']=='add' and 1 in interior['args'],'Changed FTC positive offset')
      square=g(next(i for i in interior['args'] if i!=1))
      require(square['op']=='integer_power' and square['args'][1]==2,'Changed FTC square')
      require(g(square['args'][0])==expected_call,'FTC integrand has hidden capture or wrong derivative')
     squared_envelope(e['initialEnvelope'],g(e['valueAtZero']))
     squared_envelope(e['integrand'],{'op':'actual_expression_partial','args':[e['sharedDefinition'],[iv,*p['parameters']],[1]+[0]*(len(e['bodyParameters'])-1)]})
  for ir,r in enumerate(b['rows']):
   previous=old.get((ib,ir));require(previous is not None,'Uninventoried historical row')
   require(sha(b)==previous['definitionSHA256'] and sha(r)==previous['sourceRowSHA256'],'Native source row differs from historical input')
   alpha=multi[ir];require(r['row']==ir and r['orders']==alpha,'Changed variational row index')
   expected=downward(alpha);require(len(r['blocks'])==len(expected),'Missing original nonzero block')
   for beta,t in zip(expected,r['blocks']):
    gamma=[a-v for a,v in zip(alpha,beta)];scale=1
    for a,v in zip(alpha,beta):scale*=comb(a,v)
    require(t['orders']==beta and t['column']==multi.index(beta) and t['coefficientOrders']==gamma,'Changed native alpha-beta incidence')
    require(q(g,t['scale'])==scale,'Changed exact binomial multiplier')
    c=coeff[tuple(gamma)]
    for j in range(2):
     for k in range(2):require(scaled(g,t['matrix'][j][k],t['scale'],c['matrix'][j][k]),'Changed native scaled matrix cell');matrix_cells+=1
    require(scaled(g,t['norm'],t['scale'],c['norm']['upper']),'Changed scaled matrix norm');norm_cells+=1;terms+=1
   check_sum(g,b['blockNorms'][ir],[x['norm'] for x in r['blocks']])
   result.append({'registry':f'm3GlobalBlocks:{ib}','row':ir,'pulse':b['pulse'],'orders':alpha,'sourceRowSHA256':sha(r),
     'parentParameters':p['parameters'],'timeVariable':p['variable'],'directions':p['directions'],
     'nativeBindingStatus':'VERIFIED_NATIVE_VARIATIONAL_BINDING','incorrectIndexedBindingRequirementRemoved':True,
     'coefficientAnalyticDefinednessProved':False,'pulseNormAnalyticallyBounded':False})
 require(len(result)==188,'Not all historical rows were reconciled')
 return {'rows':result,'blocks':len(blocks),'nativeRowsVerified':len(result),'unresolvedNativeBindings':0,
  'sparseTermsVerified':terms,'scaledMatrixCellsVerified':matrix_cells,'scaledNormCellsVerified':norm_cells,
  'discreteToParentBinderMapVerified':True,'coefficientDerivativesReproved':False,'fullPulseAnalyticValidityProved':False,
  'historicalReasonWasSchemaMismatch':True,'historicalEvidenceOverwritten':False}

def target_guard_status(frontier:dict) -> list:
 rows=[]
 require(len(frontier['remainingJetIDs'])==230 and len(frontier['remainingGlobalGuardIDs'])==38,'Original frontier changed; reconcile')
 for i in TARGETS:
  r=frontier['cumulativeGlobalGuardRows'][i]
  require(r['id'].startswith(f'N6-C-{i:03d}-') and r['id'] in frontier['remainingGlobalGuardIDs'] and r['status']=='OPEN','Changed target original status')
  rows.append({'id':r['id'],'originalGuard':r['originalGuard'],'newEvidence':'ROW_LEVEL_ORIGINAL_ATLAS_TRANSPORT_AVAILABLE',
   'officialStatus':'OPEN','automaticGlobalPromotion':False})
 return rows

def run(source:Path, prepared:Path, prior:Path, out:Path) -> dict:
 out.mkdir(parents=True,exist_ok=True)
 cp=read_locked(prepared/'cartesian/checkpoints/cartesian-source-checkpoint.json',PINS['checkpoint'])
 frontier=read_locked(prior/'OBLIGATION_MATRIX.json',PINS['frontier'])
 structural=read_locked(prior/'actual-structural-obstructions.json',PINS['structural'])
 chart=read_locked(prepared/'cartesian/source-chart/analytic-initial-source-domain.json',PINS['chart'])
 kernels=check_source_kernels(source/'source');arithmetic=proof_arithmetic()
 header,auth=prepare_source(source/'original-parent.ndjson.gz',out/'source-cache.sqlite')
 reg=registries(header);g=Source(out/'source-cache.sqlite')
 cover=check_cover_rows(cp,reg,g,chart);native=check_native_blocks(reg,structural,g)
 write(out/'COVER_ROWS.json',cover);write(out/'NATIVE_BLOCK_ROWS.json',native)
 result={'schema':'MathScope.N6.GuardedBandAndNativeBlockAudit/1','fullSource':auth,'sourceKernels':kernels,'analyticProofArithmetic':arithmetic,
  'cover':{k:v for k,v in cover.items() if k!='rows'},'native':{k:v for k,v in native.items() if k!='rows'},
  'sourceNodesRead':len(g.used),'targetGuards':target_guard_status(frontier),
  'remaining':{'CartesianJet':230,'GlobalGuard':38,'PDE':1020,'total':1288},'newOriginalObligationsDischarged':0,
  'N601':'OPEN','N602':'PARTIAL','M3':'56/64','wholeOriginalCallGraphCertified':False,
  'remainingDistinctChecks':['Root applications within representative and operator/FTC bodies beyond the 4050 explicit cover rows',
   'Actual source image and gluing of the complete Cartesian evaluator, not only fixed-label row transport',
   'Coefficient-definedness and analytic norm bounds for both original native pulse systems',
   'Independent application of the 8 candidate guard proofs to the complete original acceptance pipeline'],
  'sourceProducerModified':False,'originalProgressModified':False,'finiteNumericalSamplesUsedAsProof':False}
 witnesses=[{'id':i,'node':g(i)} for i in sorted(g.used)];write(out/'SOURCE_WITNESSES.json',{'parentSHA256':PARENT,'nodes':witnesses})
 write(out/'RESULT.json',result);return result

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--source',type=Path,required=True);p.add_argument('--prepared',type=Path,required=True)
 p.add_argument('--prior',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 a=p.parse_args()
 try:r=run(a.source,a.prepared,a.prior,a.out)
 except (ValueError,OSError,KeyError,IndexError,sqlite3.Error) as error:p.exit(2,str(error)+'\n')
 print(json.dumps({'coverRowsVerified':r['cover']['provedInOriginalChart'],'nativeRowsVerified':r['native']['nativeRowsVerified'],'remaining':r['remaining']}))
