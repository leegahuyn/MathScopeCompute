"""Exact Laurent-degree enclosure for the saved mean positive graph."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json
import sys

if not __debug__:
    raise RuntimeError('Do not disable exact proof assertions with Python optimization.')
assert len(sys.argv)==3,'Pass GOAL_NEXT and NEW_OUTPUT.'
goal,output=map(Path,sys.argv[1:])
assert not output.exists()
data=(goal/'whole-k-annular-pressure-lower/mean-path-longitudinal.json').read_bytes()
assert sha256(data).hexdigest()=='e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'
old=json.loads(data)
assert sha256(json.dumps(old['nodes'],separators=(',',':')).encode()).hexdigest()==old['graphSHA256']
nodes=old['nodes']
assert old['intermediate']['stableW']==27
assert nodes[27]=={'op':'exp','args':[26]}
assert nodes[26]=={'op':'multiply','args':[18,24,25]}
assert nodes[25]=={'op':'integer_power','args':[6,256]}
assert nodes[6]=={'op':'authenticated_source_norm_root','args':['hosted-original',300170]}
assert nodes[18]=={'op':'multiply','args':[7,15,17]}
assert nodes[7]=={'op':'authenticated_source_norm_root','args':['hosted-original',300171]}
assert nodes[15]=={'op':'rational','args':['2','1']}
assert nodes[17]=={'op':'add','args':[14,16]}
assert nodes[14]=={'op':'rational','args':['4','1']}
assert nodes[16]=={'op':'sqrt_positive','args':[15]}
assert nodes[3541]=={'op':'exp','args':[3540]}
assert nodes[3540]=={'op':'multiply','args':[3,9,12,3539]}
assert nodes[3539]=={'op':'rational','args':['1','100000']}
memo={}
used=set()
def degree(i):
    if i in memo:return memo[i]
    used.add(i)
    if i==27:lo=hi=(F(1),F(0))
    elif i==3541:lo=hi=(F(0),F(1))
    else:
        row=nodes[i];op,a=row['op'],row['args']
        if op in ('rational','authenticated_source_norm_root'):
            lo=hi=(F(0),F(0))
        else:
            children=a[:1] if op=='integer_power' else a
            assert all(isinstance(j,int) and 0<=j<i for j in children)
            values=[degree(j) for j in children]
            if op in ('add','maximum'):
                lo=tuple(min(v[0][k] for v in values) for k in range(2))
                hi=tuple(max(v[1][k] for v in values) for k in range(2))
            elif op=='multiply':
                lo=tuple(sum(v[0][k] for v in values) for k in range(2))
                hi=tuple(sum(v[1][k] for v in values) for k in range(2))
            elif op=='inverse':
                lo=tuple(-v for v in values[0][1])
                hi=tuple(-v for v in values[0][0])
            elif op=='sqrt_positive':
                lo=tuple(v/2 for v in values[0][0])
                hi=tuple(v/2 for v in values[0][1])
            elif op=='integer_power':
                assert isinstance(a[1],int) and a[1]>=0
                lo=tuple(v*a[1] for v in values[0][0])
                hi=tuple(v*a[1] for v in values[0][1])
            elif op=='exp':
                assert values[0]==((F(0),F(0)),(F(0),F(0))),('dependent exp',i,values[0])
                lo=hi=(F(0),F(0))
            else:raise AssertionError((i,op))
    result=(lo,hi);memo[i]=result;return result
roots={'beta':{'value':7590,'R':7619,'Z':7591},
       'v':{'value':7602,'R':7627,'Z':7603},
       'gamma':{'value':7594,'R':7635,'Z':7595}}
rows=[]
for name,fields in roots.items():
    for direction,i in fields.items():
        lo,hi=degree(i)
        rows.append({'field':name,'direction':direction,'root':i,
                     'lowerDegrees':list(map(str,lo)),'upperDegrees':list(map(str,hi))})
maximum=[max(F(row['upperDegrees'][k]) for row in rows) for k in range(2)]
positive=[max(F(0),v) for v in maximum]
alpha=F(99998,100000)
loss=positive[0]/2**33+positive[1]/100000
margin=alpha-loss-F(1,16)-F(1,2)
out={
 'status':'VERIFIED_EXACT_POSITIVE_LAURENT_DEGREE_LEDGER',
 'sourceSHA256':old['sourceSHA256'],'positiveGraphSHA256':old['graphSHA256'],
 'meanPathSHA256':sha256(data).hexdigest(),
 'symbols':{'P':27,'F':3541},'rows':rows,
 'maximumPositiveDegrees':list(map(str,positive)),
 'epsilonAlphaMinimum':str(alpha),'logarithmicLoss':str(loss),
 'remainingMarginAfterCoefficientAndHalfEpsilon':str(margin),
 'marginPositive':margin>0,
 'visitedRecords':len(used),
 'ledger':{i:{'lower':list(map(str,memo[i][0])),'upper':list(map(str,memo[i][1]))}
           for i in sorted(used)},
 'rules':{
   'sumAndMaximum':'minimum lower exponent, maximum upper exponent coordinatewise',
   'product':'sum exponents','inverse':'negate and exchange lower/upper exponents',
   'positiveSqrt':'halve exponents','exp':'only independent exponent bounds accepted'},
 'premises':['P>=1','F>=1','positive input and inverse denominators',
             'the coefficient interval is evaluated at P=F=1 with outward arithmetic'],
 'release':'HOLD',
}
output.write_bytes((json.dumps(out,indent=2)+'\n').encode('utf8'))
print(json.dumps({k:out[k] for k in ['maximumPositiveDegrees','logarithmicLoss','marginPositive','visitedRecords']}))
