"""Read-only exact sparse-Volterra registry check on the authenticated cache.

This verifies combinatorics, source matrices, e1 data and explicit coefficient
body bindings. It does NOT identify every higher AD body with its analytic
derivative; that lineage and coefficient regularity remain explicit premises.
"""
import argparse,hashlib,importlib.util,json,itertools,math,os
from pathlib import Path
def canonical(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def sha(v):return hashlib.sha256(canonical(v)).hexdigest()
def need(v,m):
 if not v:raise ValueError(m)
def down(a):return sorted(itertools.product(*(range(n+1) for n in a)),key=lambda b:(sum(b),','.join(map(str,b))))
def choose(a,b):return math.prod(math.comb(n,k) for n,k in zip(a,b))
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('source-db','stage3','header','compact','out'):p.add_argument('--'+k,type=Path,required=True)
 a=p.parse_args();need(hashlib.sha256(a.stage3.read_bytes()).hexdigest()=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f','Original stage3 reader')
 spec=importlib.util.spec_from_file_location('actual_volterra_registry_original',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
 g=v3.Source(a.source_db);C=json.loads(a.compact.read_text(encoding='utf8'));need(hashlib.sha256(a.header.read_bytes()).hexdigest()==C['sourceHeaderSHA256'],'Original complete header')
 reg=v3.registries(json.loads(a.header.read_text(encoding='utf8')));pulses=reg['m3GlobalPulses'];coeffs=reg['m3GlobalCoefficients'];blocks=reg['m3GlobalBlocks'];expressions=reg['expression']
 need(len(pulses)==2,'Exactly the two actual covariance definitions')
 selected={};coefficient_rows=[];block_rows=[]
 def node(i):
  need(isinstance(i,int) and i>=0,'Actual source node ID');n=g(i);selected[str(i)]=n;return n
 def scaled(i,scale,body):
  return v3.scaled(g,i,scale,body)
 for i,s in enumerate(pulses):
  need(s==C['definitions']['covariance:'+str(i)]['fullDefinition'],'Same original covariance')
  need(s['directions']==[622802,622803,622804] and s['directionParameterIndices']==[0,1,2] and s['initial']==[1,0] and s['left']==0 and s['length']==623027,'Actual directions and initial data')
  original=json.loads(s['originalDefinition']);need(original['matrix']==s['matrix'] and original['parameters']==s['parameters'],'Actual native matrix, no replacement')
 for index,c in enumerate(coeffs):
  pulse=c['pulse'];alpha=c['orders'];need(pulse in (0,1) and len(alpha)==3 and all(isinstance(x,int) and x>=0 for x in alpha),'Actual multi-index')
  s=pulses[pulse];need(c['originalMatrix']==s['matrix'],'Original base matrix')
  need(c['initial']==([1,0] if not any(alpha) else [0,0]),'Differentiate actual fixed e1 datum')
  if not any(alpha):need(c['matrix']==s['matrix'],'Zeroth coefficient is original full matrix')
  record={'index':index,'pulse':pulse,'orders':alpha,'matrix':c['matrix'],'initial':c['initial'],'definitionSHA256':sha(c),'normEntries':[]}
  for row in c['matrix']:
   for root in row:node(root)
  norm=c.get('norm')
  if norm is not None:
   need(norm['matrix']==c['matrix'],'Norm on same actual coefficient matrix')
   for j,row in enumerate(norm['entries']):
    for k,e in enumerate(row):
     need(e['originalExpression']==c['matrix'][j][k],'Literal actual coefficient norm body')
     for key in ('originalExpression','originalTimeDerivative','sharedExpression','sharedTimeDerivative','upper'):node(e[key])
     system=e['sharedDefinition']
     if system is not None:
      d=expressions[system];need(d['body']==e['originalExpression'] and d['parameters']==[s['variable'],*s['parameters']],'Original explicit shared coefficient body')
      need(node(e['sharedExpression'])=={'op':'actual_expression_partial','args':[system,d['parameters'],[0]*len(d['parameters'])]},'Actual zero-order coefficient evaluation')
      need(node(e['sharedTimeDerivative'])=={'op':'actual_expression_partial','args':[system,d['parameters'],[1,*([0]*(len(d['parameters'])-1))]]},'Actual pulse-time derivative reference')
     record['normEntries'].append({k:e[k] for k in ('originalExpression','originalTimeDerivative','sharedDefinition','sharedExpression','sharedTimeDerivative','upper')})
  coefficient_rows.append(record)
 for index,b in enumerate(blocks):
  pulse=b['pulse'];s=pulses[pulse];alpha=b['requestedOrders'];multi=down(alpha)
  need([list(x) for x in multi]==b['multiIndices'] and b['dimension']==2*len(multi),'Full downward closure')
  need(b['originalCovariance']==pulse and b['intervalLength']==s['length'] and b['fixedLeft']==0,'Same original interval')
  need(b['initial']==[t for beta in multi for t in ([1,0] if not any(beta) else [0,0])],'Full true initial data')
  cby={tuple(c['orders']):c for c in b['coefficients']}
  need(set(cby)==set(multi),'Every coefficient multi-index retained')
  total=0
  for j,(beta,row) in enumerate(zip(multi,b['rows'])):
   need(row['row']==j and row['orders']==list(beta) and len(row['blocks'])==len(down(beta)),'Every sparse variational row')
   for gamma,entry in zip(down(beta),row['blocks']):
    delta=tuple(x-y for x,y in zip(beta,gamma));c=cby[delta];q=choose(beta,gamma)
    need(entry['column']==multi.index(gamma) and entry['orders']==list(gamma) and entry['coefficientOrders']==list(delta),'Original ordered block indices')
    need(node(entry['scale'])=={'op':'rational','args':[str(q),'1']},'Actual Leibniz binomial')
    for rr in range(2):
     for cc in range(2):need(scaled(entry['matrix'][rr][cc],entry['scale'],c['matrix'][rr][cc]),'Actual scaled derivative coefficient');node(entry['matrix'][rr][cc])
    total+=1
  block_rows.append({'index':index,'pulse':pulse,'orders':alpha,'dimension':b['dimension'],'multiIndices':b['multiIndices'],'nonzeroSparseBlocks':total,'definitionSHA256':sha(b),'allBlockCoefficientsAndInitialDataChecked':True})
 need(len(selected)<20000,'Small registry proof export budget')
 result={'schema':'MathScope.N6.ActualVolterraSparseRegistryBinding/1','executionRun':os.environ.get('GITHUB_RUN_ID'),'sourceHeaderSHA256':C['sourceHeaderSHA256'],
  'originalPulseDefinitionSHA256':[sha(s) for s in pulses],'coefficientRows':coefficient_rows,'sparseBlocks':block_rows,'selectedSourceNodes':selected,
  'actualSparseCombinatoricsAndBodyBindingsChecked':True,'higherCoefficientADLineageProvedHere':False,'wholeVolterraCInfinityComposed':False,
  'remainingPremises':['Actual matrix coefficients are C∞ on the original whole pulse interval and fixed-label slow domains.','Every positive slow-order coefficient body equals the derivative of the original matrix; source AD flags alone are not that proof.','Each sharedTimeDerivative materializes to its retained originalTimeDerivative body.'],
  'wholeGOnJProved':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8');print(json.dumps({'originalPulses':len(pulses),'coefficientRecords':len(coeffs),'sparseBlocks':len(blocks),'selectedSourceNodes':len(selected),'newDischarged':0}))
if __name__=='__main__':main()
