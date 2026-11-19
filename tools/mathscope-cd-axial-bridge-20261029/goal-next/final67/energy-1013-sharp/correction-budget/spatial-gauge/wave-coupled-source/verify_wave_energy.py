"""Independent root/degree and exact endpoint-order audit of the primary packet."""

from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys

assert __debug__ and len(sys.argv)==5
goal,ledger_path,energy_path,output=map(Path,sys.argv[1:])
ledger=json.loads(ledger_path.read_bytes())
energy=json.loads(energy_path.read_bytes())
assert energy['ledgerSHA256']==sha256(ledger_path.read_bytes()).hexdigest()
assert energy['reservedForceFraction']=='2^-32'
assert energy['status']=='CONDITIONAL_COMPLETE_INITIAL_PRIMARY_WAVE_WITHIN_2_POW_NEG_32_BUDGET'
wave_raw=(goal/'primary-forced-weights/mixed-wave/mixed-wave-c4.json').read_bytes()
lower_raw=(goal/'whole-k-annular-pressure-lower/lower-covariance-pressure.json').read_bytes()
assert sha256(wave_raw).hexdigest()==ledger['wavePin']
assert sha256(lower_raw).hexdigest()==ledger['lowerPin']
wave=json.loads(wave_raw);lower=json.loads(lower_raw)
nodes=ledger['nodes']
assert nodes[:len(lower['nodes'])]==lower['nodes']
aliases=[];cursor=len(lower['nodes'])
for source in wave['nodes']:
    operation,args=source['op'],source['args']
    if operation=='authenticated_source_norm_root' and args[0]=='archived-lower-positive':
        assert 0<=args[1]<len(lower['nodes'])
        aliases.append(args[1])
        continue
    if operation=='authenticated_source_norm_root':
        mapped={'archived-original':'hosted-original','archived-background-c8':'background-c8'}[args[0]]
        expected={'op':operation,'args':[mapped,args[1]]}
    elif operation=='rational':
        expected=source
    else:
        children=args[:1] if operation=='integer_power' else args
        assert all(0<=child<len(aliases) for child in children)
        new_args=[aliases[child] for child in children]
        if operation=='integer_power':new_args.append(args[1])
        expected={'op':operation,'args':new_args}
    assert nodes[cursor]==expected
    aliases.append(cursor);cursor+=1
assert sha256(json.dumps(nodes,separators=(',',':')).encode()).hexdigest()==ledger['graphSHA256']
components=ledger['componentRoots']
root=nodes[ledger['root']]
assert root['op']=='multiply'
count,gauss,joined=root['args']
assert nodes[count]=={'op':'rational','args':[str(162*64),'1']}
assert gauss==components['gaussian']==lower['intermediate']['gaussianAbsorption']
summands=nodes[joined]
assert summands['op']=='add' and len(summands['args'])==4
for term,(integer,name) in zip(summands['args'],
                              [(21,'velocity'),(1,'spatialGradient'),(712,'potential'),(20,'potentialGradient')]):
    if integer==1:assert term==components[name]
    else:
        assert nodes[term]['op']=='multiply'
        multiplier,target=nodes[term]['args']
        assert nodes[multiplier]=={'op':'rational','args':[str(integer),'1']}
        assert target==components[name]
reachable=set();pending=[ledger['root']]
while pending:
    i=pending.pop()
    if i in reachable:continue
    reachable.add(i)
    if i in (27,3541):continue
    operation,args=nodes[i]['op'],nodes[i]['args']
    if operation in ('rational','authenticated_source_norm_root'):continue
    children=args[:1] if operation=='integer_power' else args
    assert all(isinstance(child,int) and 0<=child<i for child in children)
    pending.extend(children)
bounds={}
for i in sorted(reachable):
    operation,args=nodes[i]['op'],nodes[i]['args']
    if i==27:lo=hi=(Q(1),Q(0))
    elif i==3541:lo=hi=(Q(0),Q(1))
    elif operation in ('rational','authenticated_source_norm_root'):lo=hi=(Q(0),Q(0))
    else:
        child=args[:1] if operation=='integer_power' else args
        values=[bounds[j] for j in child]
        if operation in ('add','maximum'):
            lo=tuple(min(v[0][k] for v in values) for k in (0,1))
            hi=tuple(max(v[1][k] for v in values) for k in (0,1))
        elif operation=='multiply':
            lo=tuple(sum(v[0][k] for v in values) for k in (0,1))
            hi=tuple(sum(v[1][k] for v in values) for k in (0,1))
        elif operation=='inverse':
            lo=tuple(-entry for entry in values[0][1]);hi=tuple(-entry for entry in values[0][0])
        elif operation=='sqrt_positive':
            lo=tuple(entry/2 for entry in values[0][0]);hi=tuple(entry/2 for entry in values[0][1])
        elif operation=='integer_power':
            assert args[1]>=0
            lo=tuple(entry*args[1] for entry in values[0][0]);hi=tuple(entry*args[1] for entry in values[0][1])
        else:
            assert operation=='exp' and values[0]==((Q(0),Q(0)),(Q(0),Q(0)))
            lo=hi=(Q(0),Q(0))
    bounds[i]=(lo,hi)
positive=[max(Q(0),entry) for entry in bounds[ledger['root']][1]]
assert positive==[34,2]
assert len(reachable)==energy['consumedRecords']==1070


def exp_tower(endpoint):
    depth=0
    while list(endpoint)==['exp']:
        depth+=1;endpoint=endpoint['exp']
    assert list(endpoint)==['rational']
    seed=Q(endpoint['rational'])
    assert 2**19<seed<2**21
    return depth,seed


# The seed window is shared. exp(2^19)>2^21 follows already from
# 1+x+x^2/2<=exp(x), so a deeper tower strictly exceeds a shallower one
# throughout this rational window.
assert 1+2**19+Q(2**38,2)>2**21
comparisons=[]
for left,right,name in [
 ('coefficientLogUpper','coefficientAllowanceLower','coefficient'),
 ('geometricLogUpper','geometricAllowanceLower','geometry'),
 ('reservedBudgetLogLossUpper','budgetLossAllowanceLower','reserved source budget'),
]:
    dl,sl=exp_tower(energy[left]);dr,sr=exp_tower(energy[right])
    assert dl<dr or (dl==dr and sl<sr)
    comparisons.append({'quantity':name,'upperDepth':dl,'lowerDepth':dr,'strict':True})
ratio=energy['ratioUpper']
assert list(ratio)==['exp'] and list(ratio['exp'])==['neg']
depth,seed=exp_tower(ratio['exp']['neg'])
assert depth>0 and seed>0
assert all(energy[field]==-1 for field in ('coefficientComparison','geometryComparison','budgetComparison','ratioBelowOne'))
out={
 'status':'VERIFIED_INDEPENDENT_INITIAL_PRIMARY_WAVE_LEDGER_AND_ENDPOINT_ORDERS',
 'ledgerSHA256':sha256(ledger_path.read_bytes()).hexdigest(),
 'energySHA256':sha256(energy_path.read_bytes()).hexdigest(),
 'mappedSavedWaveRecords':len(wave['nodes']),'checkedReachableDegreeRecords':len(reachable),
 'positiveDegrees':list(map(str,positive)),'strictComparisons':comparisons,
 'ratioStrictlyBelowOne':True,'reservedForceFraction':'2^-32',
 'normalization':energy['normalization'],
 'conditions':'The source physical/gauge/derivative bounds and scaling proof obligations remain those explicitly listed in the producer and exact scale audit.',
 'scope':'Independent structural, Laurent-degree and exact tower-order verification. Source analytic closure, active corrections and final jets remain separate.',
 'release':'HOLD'}
assert not output.exists()
output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8',newline='\n')
print('PASS independent source graph join,1070 Laurent records and3 strict endpoint orders; wave ratio<1')
