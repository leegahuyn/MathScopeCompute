"""Pin the original common threshold and its P/F exponents; no float arithmetic."""
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
import gzip
import json
import sys

if not __debug__:
    raise RuntimeError('Do not disable exact proof assertions with Python optimization.')
assert len(sys.argv)==5, 'Pass ORIGINAL_SOURCE_GZIP FAMILY_MODULE GOAL_NEXT NEW_OUTPUT.'
source,family,goal,output=map(Path,sys.argv[1:])
assert not output.exists()
source_pin='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
family_pin='7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75'
family_bytes=family.read_bytes()
assert sha256(family_bytes).hexdigest()==family_pin
source_hash=sha256();nodes={};count=0
with gzip.open(source,'rb') as stream:
    # The authenticated source hash is over exactly the saved uncompressed bytes.
    for raw in stream:
        source_hash.update(raw)
        row=json.loads(raw)
        if count==0 and 'op' not in row:
            count=-1
        else:
            i=count
            if i<=617432 and (row['op']=='rational' or
                (row['op']=='inverse' and row['args']==[9]) or
                617285<=i<=617432 or i in [9,24,127,300170,300171]):
                nodes[i]=row
        count+=1
assert count==4456994,count
assert source_hash.hexdigest()==source_pin
assert nodes[9]=={'op':'source_parameter','args':['h']}
assert nodes[24]=={'op':'rational','args':['2','1']}
assert nodes[127]=={'op':'log_positive','args':[24]}
assert nodes[300171]=={'op':'rational','args':['1','17179869184']}
assert nodes[617292]=={'op':'integer_power','args':[300170,256]}
assert nodes[617428]=={'op':'integer_power','args':[300170,512]}
assert 617428 in nodes[617430]['args'] and nodes[617430]['op']=='maximum'
assert nodes[617431]=={'op':'maximum','args':[4654,617430,617357]}
assert nodes[617432]=={'op':'ceiling','args':[617431]}
used=set()
def h_monomial(i):
    used.add(i)
    if i==9:return F(1),0+1
    op,args=nodes[i]['op'],nodes[i]['args']
    if op=='rational':return F(int(args[0]),int(args[1])),0
    if op=='inverse':
        c,p=h_monomial(args[0]);return 1/c,-p
    if op=='multiply':
        c,p=F(1),0
        for child in args:
            a,b=h_monomial(child);c*=a;p+=b
        return c,p
    if op=='integer_power':
        c,p=h_monomial(args[0]);return c**args[1],p*args[1]
    raise AssertionError((i,op,args))
assert h_monomial(617357)==(F(4096),-2)
old_bytes=(goal/'whole-k-annular-pressure-lower/mean-path-longitudinal.json').read_bytes()
assert sha256(old_bytes).hexdigest()=='e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'
old=json.loads(old_bytes);v=old['nodes'];old_used=set()
def old_monomial(i):
    old_used.add(i);op,args=v[i]['op'],v[i]['args']
    if op=='rational':return F(int(args[0]),int(args[1])),{}
    if op=='authenticated_source_norm_root':return F(1),{tuple(args):1}
    if op=='multiply':
        c,p=F(1),{}
        for child in args:
            a,b=old_monomial(child);c*=a
            for k,n in b.items():p[k]=p.get(k,0)+n
        return c,p
    raise AssertionError((i,op,args))
assert v[27]=={'op':'exp','args':[26]}
assert v[26]=={'op':'multiply','args':[18,24,25]}
assert v[25]=={'op':'integer_power','args':[6,256]}
assert v[6]=={'op':'authenticated_source_norm_root','args':['hosted-original',300170]}
assert v[18]=={'op':'multiply','args':[7,15,17]}
assert v[7]=={'op':'authenticated_source_norm_root','args':['hosted-original',300171]}
assert v[15]=={'op':'rational','args':['2','1']}
assert v[17]=={'op':'add','args':[14,16]}
assert v[14]=={'op':'rational','args':['4','1']}
assert v[16]=={'op':'sqrt_positive','args':[15]}
assert v[3541]=={'op':'exp','args':[3540]}
assert v[3540]=={'op':'multiply','args':[3,9,12,3539]}
assert v[3]=={'op':'authenticated_source_norm_root','args':['hosted-original',9]}
assert v[9]=={'op':'authenticated_source_norm_root','args':['hosted-original',127]}
assert v[12]=={'op':'add','args':[10,11]}
assert v[10]=={'op':'authenticated_source_norm_root','args':['hosted-original',617432]}
assert v[11]=={'op':'rational','args':['17','1']}
assert v[3539]=={'op':'rational','args':['1','100000']}
selected={9,24,127,300170,300171,617292,617428,617430,617431,617432}|used
result={
 'status':'VERIFIED_ORIGINAL_SOURCE_THRESHOLD_AND_STABILITY_RADIAL_FAST_EXPONENTS',
 'sourceSHA256':source_pin,'verifiedFullSourceNodes':count,'familyModuleSHA256':family_pin,
 'meanPathSHA256':sha256(old_bytes).hexdigest(),'positiveGraphSHA256':old['graphSHA256'],
 'nodes':{i:nodes[i] for i in sorted(selected)},
 'positiveNodes':{i:v[i] for i in [3,6,7,9,10,11,12,14,15,16,17,18,24,25,26,27,3539,3540,3541]},
 'exactConsequences':[
   'ellMinimum >= Bnorm^512 = (Bnorm^256)^2',
   'ellMinimum >= 4096*h^(-2) = (64/h)^2',
   'r0=2^-34; Lmax=2*r0*(4+sqrt(2)) < 2^-30',
   'P=exp(3*Bnorm^256*Lmax)',
   'F=exp(h*(ellMinimum+17)*log(2)/100000)'],
 'realArithmeticPremises':['h>0','h<1/64','positive original Bnorm and source norms','1/2<=log(2)<=1'],
 'conclusion':{'P':'P<=exp(L/2^33)','F':'F<=exp(1+L/100000)',
               'L':'h*(ellMinimum+13)*log(2)'},
 'scope':'Exact saved-source identities. Analytic mean envelope and original chart/source semantics remain explicit premises.',
 'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode('utf8'))
print(json.dumps({'status':result['status'],'verifiedFullSourceNodes':count,'frequencyMonomial':'4096*h^-2'}))
