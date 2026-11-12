"""N4 top-level actual Picard profile caller guards and lexical binder bounds."""
import collections
import hashlib
import json
from pathlib import Path
import sys

assert len(sys.argv) in (4, 5), 'usage: N4_REACHED_JSON LOWER_CALLS_JSON OUT_JSON [CONTROL]'
source, lower, out = map(Path, sys.argv[1:4])
mode = sys.argv[4] if len(sys.argv) == 5 else ''
assert mode in ('', '--reset-native', '--drop-guards', '--drop-binders')
helper = Path(__file__).resolve().parents[2] / 'y' / 'native_reference_scopes.py'
assert hashlib.sha256(helper.read_bytes()).hexdigest() == '37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758'
sys.path.insert(0, str(helper.parent))
from native_reference_scopes import actual_children
raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()=='1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc';x=json.loads(raw);n=dict(x['nodes']);bs=dict(x['sourceBodies']);assert x['graphSHA256']=='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd' and x['visitedNodes']==1169752 and not x['unresolvedReachedNative']
raw=lower.read_bytes();assert hashlib.sha256(raw).hexdigest()=='27448911ef14d62c722dbac2e611a5e661729adb561e6c7ae0159c4a15dcb806';lc=json.loads(raw);prior={i for s in lc['systems'] for g in s['groups'] for i in g['calls']};assert len(prior)==163
profiles={i:v for i,v in n.items() if v['op'] in ('actual_background_even_profile','actual_background_picard')};assert len(profiles)==259 and set(prior)<=set(profiles) and all(v['op']=='actual_background_even_profile' and v['args'][3]==2 for v in profiles.values())
groups=collections.defaultdict(set)
for i,v in profiles.items():
 if i not in prior:groups[(v['args'][0],v['args'][2])].add(i)
assert len(groups)==17 and sum(map(len,groups.values()))==96
assert collections.Counter({sid:sum(len(ids) for (s,arg),ids in groups.items() if s==sid) for sid in [0,3,5,7,9]})=={0:42,3:18,5:18,7:14,9:4}
# Distinct lower-bound binders and upper-bound cutoffs to track through every path.
args={arg for _,arg in groups};coords={28853,28865,28879,28906,28944,29313,50487};unit={29329,117644,120240,123336,126686};assert len(args)==13 and coords|{4756}|{29330,117645,120241,123337,126687}==args
for arg,t in [(29330,29329),(117645,117644),(120241,120240),(123337,123336),(126687,126686)]:assert n[arg]=={'op':'multiply','args':[4756,t]}
binders=coords|unit;guardIndex={a:k for k,a in enumerate(sorted(args))};binderIndex={a:k+len(guardIndex) for k,a in enumerate(sorted(binders))}
# For all actual-child edges and all native definition edges, IDs must descend.
known={i:0 for i in x['roots']};edgecount=0
for i in sorted(n,reverse=True):
 if i not in known:continue
 v=n[i];a=v['args'];state=known[i];children=actual_children(v);native=bs.get(i,[])
 for j in children+native:
  assert j<i and j in n,(i,j);edgecount+=1;tag=0
  if mode!='--drop-guards' and v['op']=='smooth_piecewise' and a[1]==28819 and j in (a[3],a[4]):
   safe=[a[3]]+([a[4]] if a[2]==28823 else [])
   unsafe=[a[0],a[1],a[2],a[5]]+([] if a[2]==28823 else [a[4]])
   if j in safe and j not in unsafe:
    for arg,k in guardIndex.items():
     if a[0]==arg or (arg==29330 and a[0]==4756):tag|=1<<k
  if mode!='--drop-binders' and v['op']=='definite_integral' and j==a[0] and j not in (a[2],a[3]) and a[1] in binderIndex:
   binder=a[1];expected=(0,1) if binder in unit else (0,28823) if binder in coords-{29313,50487} else (0,4756)
   if (a[2],a[3])==expected:tag|=1<<binderIndex[binder]
  incoming=(0 if mode=='--reset-native' and j in native else state|tag);old=known.get(j);known[j]=incoming if old is None else old&incoming
failed=[];details=[]
for (sid,arg),targets in sorted(groups.items()):
 b=arg if arg in coords else n[arg]['args'][1] if arg in {29330,117645,120241,123337,126687} else None
 for i in targets:
  mask=known.get(i,0);g=bool(mask&(1<<guardIndex[arg]));bc=True if b is None else bool(mask&(1<<binderIndex[b]))
  if not(g and bc):failed.append({'node':i,'system':sid,'argument':arg,'guard':g,'binder':bc})
 details.append({'system':sid,'argument':arg,'calls':sorted(targets),'callCount':len(targets),'binder':b,'allMatchingGuardAndBinderPaths':all(known.get(i,0)&(1<<guardIndex[arg]) and (b is None or known.get(i,0)&(1<<binderIndex[b])) for i in targets)})
if mode in ('--reset-native','--drop-guards','--drop-binders'):
 expected={'--reset-native':0,'--drop-guards':96,'--drop-binders':54}[mode];assert len(failed)==expected,(mode,len(failed))
 result={'schema':'MathScope.Y.N4.ResetNativeSensitivity/1','targets':96,'failed':len(failed),'passed':96-len(failed),'failureSamples':failed[:30],'mode':mode,'scope':'A deliberate proof-state mutation: native facts reset or guard/binder propagation disabled. This is a sensitivity diagnostic, not a failure of an actual source bound.'};out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps({'mode':mode,'failed':len(failed),'passed':96-len(failed)}));raise SystemExit(0)
assert not failed,failed[:8]
result={'schema':'MathScope.Y.N4.ActualTopPicardCallerDomains/1','graphSHA256':x['graphSHA256'],'n4ReachSHA256':'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc','lowerReceiptSHA256':'27448911ef14d62c722dbac2e611a5e661729adb561e6c7ae0159c4a15dcb806','reachedActualEvenProfiles':259,'priorLowerProfiles':163,'otherProfiles':96,'systems':{'0':42,'3':18,'5':18,'7':14,'9':4},'guardTrackedArguments':len(args),'binderTrackedCoordinates':len(binders),'typedEdges':edgecount,'allOtherCallSitesBoundAndGuarded':True,'groups':details,'sourceRangeReduction':'In a nonnegative X source frame and valid eta, every one of the other 96 actual even-profile literal nodes has matching original lazy guard Xargument<=Xcut<a^2. The 36 X*t applications additionally have their own t in [0,1]. Four original bootstrap prefix applications use a binder in [0,X]; 14 have a binder in [0,Xcut]. Fourty-two use X directly. For two X*t nodes 29331/29342, the bound is enforced by guard on enclosing X plus the unit binder, not a guard on X*t itself.','conditionalScope':'Native parameter and integral binders require capture-free source semantics; nonnegative X must be established for each actual expression frame, including the four [0,X] prefixes and 36 X*t calls. The 163 lower nodes need their source outer xi domain as in lower-calls.json. Eta domain, runtime derivatives, infinite Picard and source seam jets are not proved. No all-Y or jet acceptance promoted.','release':'HOLD'}
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps({'status':'PASS','allNative':259,'lower':163,'top':96,'unitProduct':36,'fixedCutoffBinder':14,'outerXPrefix':4,'directX':42,'failed':len(failed)}))
