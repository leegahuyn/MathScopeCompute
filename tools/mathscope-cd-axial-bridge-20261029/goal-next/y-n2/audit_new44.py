"""Audit exactly the 44 N2-only natural calls, 5 operands and native guards.

Graph traversal is a conservative structural over-approximation. Semantic
capture-avoiding substitution, Picard existence and caller domains are
separate obligations, reported explicitly in the output.
"""
import argparse,collections,gzip,hashlib,json,sys,importlib.util
from fractions import Fraction
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'y'))
from native_reference_scopes import actual_children
N2='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32';N1='5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459';REG='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';PROFILE='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
def read(path,digest):
 raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,path;return raw

def walk(roots,nodes,bodies,cut):
 queue=collections.deque(roots);seen=set(roots);cuts=set()
 while queue:
  i=queue.popleft();node=nodes[i];child=actual_children(node)
  replace=cut(i,node)
  if replace is not None:child=replace;cuts.add(i)
  for j in child+bodies.get(i,[]):
   if j in nodes and j not in seen:seen.add(j);queue.append(j)
 return seen,cuts

def main():
 p=argparse.ArgumentParser();p.add_argument('--n2-reached',type=Path,required=True);p.add_argument('--n1-reached',type=Path,required=True);p.add_argument('--registry',type=Path,required=True);p.add_argument('--graph',type=Path,required=True);p.add_argument('--profile',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 x=json.loads(read(a.n2_reached,N2));old=json.loads(read(a.n1_reached,N1));reg=json.loads(read(a.registry,REG));v,_=json.JSONDecoder().raw_decode(read(a.profile,PROFILE).decode().split('export const PINNED_N3 = ',1)[1]);p=v['parametersExactExpressions']
 spec=importlib.util.spec_from_file_location('source_guards',Path(__file__).resolve().parent.parent.parent/'axial-exterior/check_source_guards.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);assert mod.check(p)==[]
 assert p['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]} and p['t1']=={'power':[{'ref':'CSelected'},-120]}
 assert p['CSelected']=={'exp':{'ref':'logCSelected'}} and p['logCSelected']['sum'][1]=={'power':[{'ref':'Q'},200]}
 assert p['Lambda']=={'power':[{'ref':'Q'},64]} and p['Q']['quotient'][0]['product'][1]=={'ref':'K'}
 nodes=dict(x['nodes']);bodies=dict(x['sourceBodies']);assert x['visitedNodes']==310386 and x['reachedNaturalCalls']==567 and not x['unresolvedReachedNative']
 calls={c['id']:c for c in x['calls']};oldids={c['id'] for c in old['calls']};oldnodes=dict(old['nodes']);assert len(oldids)==523 and oldids<=set(calls) and all(nodes[i]==oldnodes[i] for i in oldids);new=set(calls)-oldids
 groups={y:sorted(c['id'] for c in calls.values() if c['y']==y and c['id'] in new) for y in [118954,119028,119672,122291,122365]};assert [len(groups[k]) for k in groups]==[18,10,1,11,4] and len(new)==44 and set.union(*map(set,groups.values()))==new
 pic=json.loads(reg['base']['picard']);assert [(pic[i]['xi'],pic[i]['radialDomain']) for i in (3,5)]==[(118918,[0,24806]),(122255,[0,24806])]
 expected={118953:('integer_power',[118918,2]),118954:('multiply',[3454,118953]),118960:('multiply',[3679,118953]),118961:('log_positive',[118960]),119026:('exp',[118961]),119027:('multiply',[3617,119026]),119028:('multiply',[3454,119027]),119105:('multiply',[3679,119027]),119106:('log_positive',[119105]),119671:('exp',[119106]),119672:('multiply',[474,119671]),122290:('integer_power',[122255,2]),122291:('multiply',[3454,122290]),122297:('multiply',[3679,122290]),122298:('log_positive',[122297]),122363:('exp',[122298]),122364:('multiply',[3617,122363]),122365:('multiply',[3454,122364]),120240:('coordinate',['actual_order_2_cut_average$295']),120241:('multiply',[4756,120240]),122987:('multiply',[120240,122290])}
 for i,(op,args) in expected.items():assert nodes[i]=={'op':op,'args':args},i
 # Authenticate the domain endpoint not necessarily reachable by body edges.
 h=hashlib.sha256();count=0;anchors={};need={3612,3617,3623,3624,24802,24803,24804,24805,24806,28816,28817,28818,28819,28820,28821,28822,28823}
 with gzip.open(a.graph/'original-source-nodes.jsonl.gz','rb') as f:
  line=f.readline();h.update(line);header=json.loads(line)
  for line in f:
   h.update(line)
   if count in need:anchors[count]=json.loads(line)
   count+=1
 assert count==header['node_count']==2852905 and h.hexdigest()==x['graphSHA256']
 for i,v in {3623:('exp',[3612]),3624:('multiply',[3617,3623]),28816:('rational',['1','64']),28817:('multiply',[3612,28816]),28818:('exp',[28817]),28819:('multiply',[3617,28818]),28820:('rational',['1','32']),28821:('multiply',[3612,28820]),28822:('exp',[28821]),28823:('multiply',[3617,28822]),24802:('rational',['1','16']),24803:('multiply',[3612,24802]),24804:('exp',[24803]),24805:('multiply',[3617,24804]),24806:('sqrt_positive',[24805])}.items():assert anchors[i]=={'op':v[0],'args':v[1]}
 # Logical exact inequalities for t1 in (0,1): exp(1/16)<=16/15, 4*16/15<5.
 assert Fraction(4)*Fraction(16,15)<5 and Fraction(1,32)<Fraction(1,16)<1
 rules=[]
 for sysid,xi2,ys in [(3,118953,[119028,119672]),(5,122290,[122365])]:
  z=pic[sysid];roots=set(z['forcing']+[v for row in z['A0']+z['A1'] for v in row]);targets=set().union(*(set(groups[y]) for y in ys))
  def cut(i,n):
   ar=n['args'];return [ar[0],ar[1],ar[2],ar[3]] if n['op']=='smooth_piecewise' and ar[:3]==[xi2,3617,24805] else None
  seen,cuts=walk(roots,nodes,bodies,cut);assert not targets&seen and cuts
  # No expression-system formal xi is rebound on these paths; other native transports remain separately open.
  expressions=json.loads(reg['base']['expression']);alter=[]
  full,_=walk(roots,nodes,bodies,lambda i,n:None)
  for i in full:
   n=nodes[i]
   if n['op']=='actual_expression_partial':
    sid,actual,_=n['args'];formal=expressions[sid]['parameters'];xi=pic[sysid]['xi']
    if xi in formal and actual[formal.index(xi)]!=xi:alter.append(i)
  assert not alter;rules.append({'system':sysid,'formalXi':pic[sysid]['xi'],'logDependentCalls':len(targets),'barrierNodes':len(cuts),'unbarriered':0,'changedFormalXiExpressionPartials':0})
 # The order-two u-derivative #119673 occurs only after the branch X > Xa*exp(t1).
 z=pic[3];roots=set(z['forcing']+[v for row in z['A0']+z['A1'] for v in row])
 def far_cut(i,n):
  ar=n['args'];return [ar[0],ar[1],ar[2],ar[3]] if n['op']=='smooth_piecewise' and ar[:3]==[119027,3624,3627] else None
 seen,far=walk(roots,nodes,bodies,far_cut);assert 119673 not in seen and len(far)==24
 # Every actual even-profile call of systems 3/5 is guarded in its OWN X operand.
 profile_audits=[]
 for sysid in (3,5):
  byarg=collections.defaultdict(set)
  for i,n in nodes.items():
   if n['op']=='actual_background_even_profile' and n['args'][0]==sysid:byarg[n['args'][2]].add(i)
  for arg,targets in byarg.items():
   def guard(i,n):
    ar=n['args']
    if n['op']!='smooth_piecewise' or ar[0]!=arg or ar[1]!=28819:return None
    return [ar[0],ar[1],ar[2],ar[5]] if ar[2]==28823 else [ar[0],ar[1],ar[2],ar[4],ar[5]]
   seen,cuts=walk(x['roots'],nodes,bodies,guard);assert not seen&targets and cuts;profile_audits.append({'system':sysid,'Xarg':arg,'calls':len(targets),'sourceGuardCuts':len(cuts),'unguarded':0})
 assert sum(z['calls'] for z in profile_audits)==37
 targets={i for i,n in nodes.items() if n['op']=='actual_background_even_profile' and n['args'][0]==3 and n['args'][2] in (120241,122987)}
 def bindcut(i,n):
  ar=n['args'];return [ar[2],ar[3]] if n['op']=='definite_integral' and ar[1:]==[120240,0,1] else None
 seen,binds=walk(x['roots'],nodes,bodies,bindcut);assert len(targets)==14 and not seen&targets and len(binds)==14
 out={'schema':'MathScope.Y.N2.New44.SourceDomainAudit/1','graphSHA256':x['graphSHA256'],'N1ReachedHash':N1,'N2ReachedHash':N2,'N2ReachableStaticNaturalCalls':567,'N1ReachableStaticNaturalCalls':523,'N2OnlyCalls':44,'newYGroups':{str(y):ids for y,ids in groups.items()},'picardLogGuardAudits':rules,'system3And5EvenProfileGuardAudits':profile_audits,'unitBinderGuardNodes':len(binds),'unitBinderTargetCalls':len(targets),'farBranch119673UnreachableAssumingDomain':True,'farBranchBarrierCount':len(far),'exactDomain':'0<=xi<=sqrt(Xa*exp(t1/16)), Xa=4/Lambda, 0<t1<1','conditionalYBound':'0<=Y<=4*exp(t1/16)<64/15<5 for all 44, with log operands only after xi²>Xa; #119673 is inactive in domain','open':'Static guard domination does not by itself verify every native formal-to-actual substitution frame or Picard evaluator convergence and domain. Prior 523 bounds must be transported separately on N2 roots; no blanket 567/567 claim.','release':'HOLD'}
 a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS exact 44 new call operands and structural guard domination; source semantics and full N2 range OPEN')
if __name__=='__main__':main()
