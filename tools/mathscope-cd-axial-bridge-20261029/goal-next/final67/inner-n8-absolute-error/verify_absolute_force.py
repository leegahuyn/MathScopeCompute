"""Independent physical-scale identities and exact nonzero endpoint dyadic proof."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json,sys
import sympy as S
if not __debug__:raise RuntimeError('Assertions must stay active.')
assert len(sys.argv)==6,'Pass GOAL_NEXT FROZEN_ERROR_PROGRAM PHYSICAL_LEDGER NUMERIC_RESULT NEW_OUTPUT.'
goal,error_path,ledger_path,numeric_path,output=map(Path,sys.argv[1:]);assert not output.exists()
def read(path,pin=None):
    data=path.read_bytes();digest=sha256(data).hexdigest()
    if pin is not None:assert digest==pin,str(path)
    return json.loads(data),digest
errors,error_sha=read(error_path,'48f4fa3f8f07cfb3e6ee88fb83ef6ef067a874307357ad4ce22e6e38ae19d0ae')
ledger,ledger_sha=read(ledger_path);result,result_sha=read(numeric_path)
axis,_=read(goal/'whole-k-inner-axis/inner-axis-jet-bounds.json','4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638')
force,_=read(goal/'whole-k-core-force/whole-inner-force-energy.json','fbe6238fad746e69e18c640b937c5c3ff77dbae0c481c3fe52448b763ae698a7')
sharp,sharp_sha=read(goal/'final67/energy-1013-sharp/center-energy-sharp.json','3137901e2d882df250b7df3673e276a14b6f4e9e87a006d1065f575976461481')
assert result['sourcePins']['physicalLedger']==ledger_sha and ledger['errorProgramSHA256']==error_sha
assert result['sourcePins']['sharpCenter']==sharp_sha and result['sourceModuleSHA256']==sharp['sourceModuleSHA256']
assert result['originalNodePrefix']==sharp['sourceGraphSHA256']=='2aa7ea4d8f5aeebd1f4693abf0a59fe8cd452f5f5d85ec3b49ae3c881c4e4f64'
assert force['geometry']['slabNormalizedMeasureUpper']=='(352/7)*tau0/Lambda'
assert result['noCollectedForceMajorantReused'] is True
assert sharp['leadingActualCore']=={'U':2729,'F':2730,'ordinaryFactor':720}
h=S.Symbol('h',real=True);A=S.Rational(1,2)+h;D=S.Rational(1,2)-h
assert S.expand(2*(A+1+h)-(2*A+2+2*h))==0
assert (4*A).subs(h,S.Rational(1,64))==S.Rational(33,16)<3
checked=0;remaining=set()
for row in ledger['rows']:
    source=next(r for r in errors['rows'] if r['output']==f"force/{row['component']}")
    for program,source_name in [('baseProgram','sourceTerms'),('errorProgram','errorRadiusProgram')]:
        assert len(row[program])==len(source[source_name])
        for saved,term in zip(row[program],source[source_name]):
            coefficient=abs(S.Rational(term.get('coefficient',term.get('signedCoefficient'))))
            exponent=A+1+h;lambda_power=S.S.Zero
            for i,k in term['fixedPowers']:
                name=errors['variables'][i]
                if name in ['x','y']:
                    coefficient*=4**k;exponent+=S.Rational(k,2);lambda_power-=S.Rational(k,2)
                else:
                    r,z,t=map(int,name[2:].split(','));assert r==0
                    c={(0,0):1,(0,1):5,(1,0):20,(2,0):692,(3,0):69472,(1,1):100}[z,t]
                    coefficient*=c**k;exponent-=k*(z*D+t)
            radii=term.get('radiusPowers',term.get('fieldPowers',[]));error=term.get('errorPowers',[])
            for i,k in radii+error:
                atom=axis['fieldAtomIntervals'][errors['variables'][i]]
                exponent-=k*S.sympify(atom['tau0ReciprocalPower'],locals={'h':h})
                lambda_power+=k*S.Rational(atom['LambdaPower'])
            exponent=S.expand(exponent)
            assert exponent.subs(h,0)==0 and exponent.coeff(h)>=0
            assert coefficient==S.Rational(saved['coefficient'])
            assert 2*lambda_power==saved['lambdaHalfPower']
            assert exponent.coeff(h)==S.Rational(saved['remainingTauHPower'])
            assert saved['radiusPowers']==radii and saved['errorPowers']==error
            checked+=1;remaining.add(str(exponent.coeff(h)))
assert checked==396
def endpoint_proof(endpoint):
    # The actual saved upper is exp(-x), x an explicitly positive exp tower.
    assert set(endpoint)=={'exp'} and set(endpoint['exp'])=={'neg'}
    positive=endpoint['exp']['neg'];depth=0
    while set(positive)=={'exp'}:positive=positive['exp'];depth+=1
    assert set(positive)=={'rational'}
    seed=F(positive['rational']);assert seed>256 and depth>=1
    # exp(t)>t for t>0 proves x>seed>256; exp(1)>1+1+1/2>2.
    assert F(5,2)>2
    return {'negativeExpTowerDepth':depth,'seedLowerThanTower':str(seed),
      'seedGreaterThan256':True,'strictPositiveUpper':True,
      'dyadicConclusion':'0<exp(-x)<exp(-256)<2^-256'}
endpoints=[]
for row in result['rows']:
    assert row['degree'] in [4,8]
    for kind in ['squaredForceErrorIntegralOverSR','forceSquareIntegralDifferenceOverSR']:
        assert row[kind]['lower']=={'rational':'0'}
        endpoints.append({'degree':row['degree'],'quantity':kind,**endpoint_proof(row[kind]['upper'])})
assert len(endpoints)==4
assert result['symbolicRefinement']['squaredErrorMajorantRatioUpper']=='25/256'
assert result['symbolicRefinement']['forceSquareDifferenceMajorantRatioUpper']=='5/16'
assert F(5,16)**2==F(25,256) and F(25,256)<F(5,16)
assert result['actualIntegralNumericallyEvaluated'] is False
out={'status':'VERIFIED_INDEPENDENT_ABSOLUTE_INNER_FORCE_SQUARE_PERTURBATION_BELOW_2_POW_NEG_256_SR',
 'numericReceiptSHA256':result_sha,'physicalLedgerSHA256':ledger_sha,
 'checkedPhysicalMonomials':checked,'remainingTauHPowers':sorted(remaining),
 'normalizedMeasure':'same actual original inner slab; original(352/7)*tau0/Lambda bound',
 'endpointProofs':endpoints,
 'symbolicRefinement':result['symbolicRefinement'],'storedUpperEndpointComparison':result['refinementComparison'],
 'scope':'Exact physical powers and nonzero positive directed upper endpoints verified independently of the numerical exponential evaluator. Analytic source/core/norm premises are inherited. Neither actual force-square integral nor a whole-K defect was numerically evaluated.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(out,indent=2)+'\n').encode())
print(json.dumps({'status':out['status'],'physicalMonomials':checked,'strictDyadicEndpointProofs':len(endpoints),
 'storedOrder4Order8Comparison':result['refinementComparison']}))
