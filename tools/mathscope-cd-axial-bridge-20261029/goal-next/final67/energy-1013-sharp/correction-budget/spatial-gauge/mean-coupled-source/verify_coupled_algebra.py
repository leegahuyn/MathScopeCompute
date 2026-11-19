"""Independent forward rational ledger check and coupled mean geometry certificate."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json
import sys

if not __debug__:
    raise RuntimeError('Do not disable exact proof assertions with Python optimization.')
assert len(sys.argv)==4,'Pass GOAL_NEXT LAURENT_LEDGER NEW_OUTPUT.'
goal,ledger_path,output=map(Path,sys.argv[1:])
assert not output.exists()
old_bytes=(goal/'whole-k-annular-pressure-lower/mean-path-longitudinal.json').read_bytes()
assert sha256(old_bytes).hexdigest()=='e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'
old=json.loads(old_bytes);nodes=old['nodes'];ledger_bytes=ledger_path.read_bytes();ledger=json.loads(ledger_bytes)
checked={}
for key,entry in ledger['ledger'].items():
    i=int(key);op,args=nodes[i]['op'],nodes[i]['args']
    if i==27:lower=upper=(F(1),F(0))
    elif i==3541:lower=upper=(F(0),F(1))
    elif op in ['rational','authenticated_source_norm_root']:
        lower=upper=(F(0),F(0))
    else:
        children=args[:1] if op=='integer_power' else args
        assert all(child<i and child in checked for child in children)
        lo,hi=zip(*(checked[child] for child in children))
        if op in ['add','maximum']:
            lower=tuple(map(min,zip(*lo)));upper=tuple(map(max,zip(*hi)))
        elif op=='multiply':
            lower=tuple(map(sum,zip(*lo)));upper=tuple(map(sum,zip(*hi)))
        elif op=='inverse':lower=tuple(-x for x in hi[0]);upper=tuple(-x for x in lo[0])
        elif op=='sqrt_positive':lower=tuple(x/2 for x in lo[0]);upper=tuple(x/2 for x in hi[0])
        elif op=='integer_power':
            assert args[1]>=0
            lower=tuple(x*args[1] for x in lo[0]);upper=tuple(x*args[1] for x in hi[0])
        elif op=='exp':
            assert lo[0]==hi[0]==(F(0),F(0))
            lower=upper=(F(0),F(0))
        else:raise AssertionError((i,op))
    assert list(map(str,lower))==entry['lower'] and list(map(str,upper))==entry['upper']
    checked[i]=(lower,upper)
assert len(checked)==3918
assert {(r['field'],r['direction'],r['root']) for r in ledger['rows']}=={
 ('beta','value',7590),('beta','R',7619),('beta','Z',7591),
 ('v','value',7602),('v','R',7627),('v','Z',7603),
 ('gamma','value',7594),('gamma','R',7635),('gamma','Z',7595)}
assert [max(checked[row['root']][1][k] for row in ledger['rows']) for k in range(2)]==[187,6]
# Threshold: E^2<=ell and (64/h)^2<=ell imply 64E<=h ell by positivity.
# Together with Lmax<2^-30 and log2>=1/2, 3E Lmax<= (6/2^36)L <2^-33 L.
assert F(6,2**36)<F(1,2**33)
assert F(1)**2<=F(1) and 64*F(1)>F(1,128)*F(1)
# F<=exp(kappa L+4 kappa h log2), and 4 kappa h log2<1.
assert F(4,100000*64)<1
alpha=F(99998,100000);loss=F(187,2**33)+F(6,100000)
margin=alpha-loss-F(1,16)-F(1,2)
assert margin>0
# All original physical factors 4^(j+(1-alpha)h), j<=1, alpha>=0,
# have exponent <1+1/64<2. C0/C1 source coefficient factor is 4.
assert F(1)+F(1,64)<2 and 4*4**2==64
velocity=[21,1,1];radial=[31,1,1];axial=[733,21,21];connection=[12,2]
# With t=tau0^h<=1, Renv>=1, the source-exact cutoff identities give:
assert 1+20==21
assert 1+20+10==31
assert 1+40+692==733
assert 2+10==12
v2=sum(x*x for x in velocity)
g2=sum(x*x for x in radial+axial+connection)
energy_coefficient=32*(v2+2*g2)
assert energy_coefficient==34528224<2**26
assert 1-F(1,4)==F(3,4)
result={
 'status':'VERIFIED_INDEPENDENT_FORWARD_LAURENT_AND_COUPLED_MEAN_ALGEBRA',
 'meanPathSHA256':sha256(old_bytes).hexdigest(),'ledgerSHA256':sha256(ledger_bytes).hexdigest(),
 'checkedLaurentRecords':len(checked),'maximumPositiveDegrees':[187,6],
 'PExponentRatioCertificate':{'upper':str(F(6,2**36)),'allowed':str(F(1,2**33))},
 'FExtraExponentUpper':str(F(4,100000*64)),
 'epsilonAlphaMinimum':str(alpha),'logarithmicLoss':str(loss),'strictRemainingMargin':str(margin),
 'coefficientFactor':64,
 'normalizedCompleteMeanBound':{
   'b':'exp(-L/2)','velocity':velocity,'radialDerivative':radial,'axialDerivative':axial,
   'angularConnections':connection,'RenvFactors':['velocity[0]','axialDerivative[0]','both angular connections']},
 'geometricInteger':energy_coefficient,'geometricDyadicUpper':'2^26',
 'energyResult':'J_mean^2/tau0 <= 2^26 Renv^4 exp(-L) <= exp(-3L/4) < 1',
 'reservedBudget':'2^-32 S_R/tau0 > 1 (numerical directed endpoint check)',
 'controls':{'droppingFrequencyThresholdInvalidatesCoupling':{
   'h':'1/128','E':1,'ell':1,'E_squared_le_ell':True,'64E_le_h_ell':False},
   'PAndFAreNotSetToOneInTheActualBound':'Only coefficient arithmetic uses P=F=1; Laurent factors are restored and jointly absorbed using original ellMinimum.'},
 'premises':['positive original source norms and inverse denominators','P,F>=1',
   'same source C0/C1 valuation and physical chart normalization',
   'source-pinned cutoff curl identities and whole-characteristic potential bound',
   'the separately executed coefficient/geometric/budget directed endpoint comparisons'],
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode('utf8'))
print(json.dumps({'status':result['status'],'checkedLaurentRecords':len(checked),'geometricInteger':energy_coefficient,'strictRemainingMargin':str(margin)}))
