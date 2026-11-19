"""Exact original67+13 output-error propagation with all nonlinear products."""
from pathlib import Path
from fractions import Fraction as F
from itertools import product
from collections import Counter
from math import comb
from hashlib import sha256
import json,sys
if not __debug__:raise RuntimeError('Do not disable exact proof assertions.')
assert len(sys.argv)==4,'Pass GOAL_NEXT FROZEN_INNER_REFINEMENT NEW_OUTPUT.'
goal,inner_path,output=map(Path,sys.argv[1:]);assert not output.exists()
def read(path,pin):
    data=path.read_bytes();assert sha256(data).hexdigest()==pin,str(path)
    return json.loads(data)
inner_pin='86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601'
inner=read(inner_path,inner_pin)
bounds_pin='4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638'
bounds=read(goal/'whole-k-inner-axis/inner-axis-jet-bounds.json',bounds_pin)
poly_pin='1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7'
poly=read(goal/'final67/energy-1013-sharp/correction-budget/original-67plus13-polynomials.json',poly_pin)
force_pin='fbe6238fad746e69e18c640b937c5c3ff77dbae0c481c3fe52448b763ae698a7'
force_bytes=(goal/'whole-k-core-force/whole-inner-force-energy.json').read_bytes()
assert sha256(force_bytes).hexdigest()==force_pin
force=json.loads(force_bytes)
assert force['region']=='wholeInner' and force['inputSHA256']['inner']==bounds_pin
assert force['originalOperators']['verifiedRestrictedIdentities']==16
assert force['geometry']['factors']['C_zzz']=='69472/z0^3'
variables=poly['variables'];assert len(variables)==82
field_names=set(bounds['fieldAtomIntervals']);assert len(field_names)==67
assert set(inner['fieldAtomErrorEnclosures'])==field_names
mu={};ratios={}
for name,row in bounds['fieldAtomIntervals'].items():
    error=inner['fieldAtomErrorEnclosures'][name]
    if row.get('exactInterval')==['0','0']:
        assert error['exactError']==['0','0'];mu[name]={4:F(0),8:F(0)};ratios[name]=F(0);continue
    assert all(error[key]==row[key] for key in ['LambdaPower','tau0ReciprocalPower'])
    scales={}
    for degree in [4,8]:
        terms=error[f'degree{degree}ErrorRadiusTerms']
        assert set(terms)==set(row['positiveTerms'])
        scales[degree]=max(F(value)/F(row['positiveTerms'][key]) for key,value in terms.items())
    ratio=max(F(inner['fieldAtomErrorEnclosures'][name]['degree8ErrorRadiusTerms'][key])/F(value)
              for key,value in error['degree4ErrorRadiusTerms'].items())
    assert 0<scales[4]<=F(1,4) and 0<scales[8]<=F(65,1024)
    assert scales[8]<=F(5,16)*scales[4] and ratio<=F(5,16)
    mu[name]=scales;ratios[name]=ratio
fixed_caps={};zero_variables=set()
for index,name in enumerate(variables):
    if name in ['x','y']:fixed_caps[index]='R=4*sqrt(tau0/Lambda)'
    elif name.startswith('C@'):
        radial,z,t=map(int,name[2:].split(','))
        if radial:zero_variables.add(index);continue
        cap={(0,0):'1',(0,1):'5/tau0',(1,0):'20/z0',(2,0):'692/z0^2',
             (3,0):'69472/z0^3',(1,1):'100/(z0*tau0)'}
        assert (z,t) in cap,name;fixed_caps[index]=cap[z,t]
    else:
        assert name in field_names,name
        if mu[name][4]==0:zero_variables.add(index)
outputs=[]
for group,rows in poly['outputs'].items():
    if group=='velocity_gradient':rows=sum(rows,[])
    elif group in ['pressure','localized_pressure']:rows=[rows]
    assert isinstance(rows,list)
    for component,terms in enumerate(rows):outputs.append((f'{group}/{component}',terms))
assert len(outputs)==16
rows=[];all_error_terms=0;quadratic_checks=0
for name,terms in outputs:
    error_terms=Counter();source_terms=[];ratio_caps={4:[],8:[]};width_ratios=[];zero_terms=0
    field_degrees=Counter()
    for source_index,term in enumerate(terms):
        powers=dict(term['powers'])
        if zero_variables.intersection(powers):zero_terms+=1;continue
        fields={index:power for index,power in powers.items() if variables[index] in field_names}
        fixed=tuple((index,power) for index,power in powers.items() if index not in fields)
        assert fields and all(index in fixed_caps for index,power in fixed)
        degree=sum(fields.values());assert degree in [1,2]
        field_degrees[degree]+=1
        if degree==2:quadratic_checks+=1
        source_terms.append({'sourceIndex':source_index,'signedCoefficient':term['coefficient'],
            'fixedPowers':list(map(list,fixed)),'fieldPowers':list(map(list,fields.items()))})
        width_ratios.extend(ratios[variables[i]] for i in fields)
        for order in [4,8]:
            q=F(1)
            for index,power in fields.items():q*=(1+mu[variables[index]][order])**power
            ratio_caps[order].append(q-1)
        ids=list(fields)
        for delta in product(*(range(fields[index]+1) for index in ids)):
            if not any(delta):continue
            coefficient=abs(F(term['coefficient']))
            radius_powers=[];error_powers=[]
            for index,k in zip(ids,delta):
                exponent=fields[index];coefficient*=comb(exponent,k)
                if exponent-k:radius_powers.append((index,exponent-k))
                if k:error_powers.append((index,k))
            key=(fixed,tuple(radius_powers),tuple(error_powers))
            error_terms[key]+=coefficient
    assert error_terms
    q4=max(ratio_caps[4]);q8=max(ratio_caps[8]);ratio=max(width_ratios)
    assert 0<q8<q4 and q8<=F(5,16)*q4 and ratio<=F(5,16)
    encoded=[{'coefficient':str(coefficient),'fixedPowers':list(map(list,key[0])),
              'radiusPowers':list(map(list,key[1])),'errorPowers':list(map(list,key[2]))}
             for key,coefficient in sorted(error_terms.items())]
    rows.append({'output':name,'sourceTerms':source_terms,'omittedExactZeroTerms':zero_terms,
      'sourceFieldDegrees':dict(field_degrees),'errorRadiusProgram':encoded,
      'degree4NormalizedErrorRatio':{'lower':'0','upper':str(q4)},
      'degree8NormalizedErrorRatio':{'lower':'0','upper':str(q8)},
      'errorWidthRatioUpper':str(ratio),'strictWidthDecrease':True})
    all_error_terms+=len(encoded)
assert quadratic_checks>0
density={}
for N in [4,8]:
    qv=max(F(row[f'degree{N}NormalizedErrorRatio']['upper']) for row in rows if row['output'].startswith('velocity/'))
    qg=max(F(row[f'degree{N}NormalizedErrorRatio']['upper']) for row in rows if row['output'].startswith('velocity_gradient/'))
    qf=max(F(row[f'degree{N}NormalizedErrorRatio']['upper']) for row in rows if row['output'].startswith('force/'))
    density[N]={'velocitySquaredError':str(qv*(2+qv)),'gradientSquaredError':str(qg*(2+qg)),
                'forceSquaredError':str(qf*(2+qf)),'workError':str(qv+qf+qv*qf)}
assert all(F(density[8][key])<F(density[4][key]) for key in density[4])
result={'status':'VERIFIED_EXACT_ORIGINAL_INNER_NONLINEAR_OUTPUT_ERROR_REFINEMENT',
 'sourcePins':{'innerRefinement':inner_pin,'innerBounds':bounds_pin,'original67Plus13Stencil':poly_pin,
               'wholeInnerForceReceipt':force_pin},
 'variables':variables,'fixedCaps':fixed_caps,'exactZeroVariables':sorted(zero_variables),
 'atomErrorRelativeCaps':{name:{'degree4':str(row[4]),'degree8':str(row[8]),
                         'errorWidthRatio':str(ratios[name])} for name,row in sorted(mu.items())},
 'rows':rows,'outputCount':len(rows),'errorProgramTerms':all_error_terms,'quadraticSourceTerms':quadratic_checks,
 'errorProgramSemantics':'A_i is the SAME original absolute physical atom radius for both orders. E_N,i is its frozen axis-corrected Taylor error radius. Each output program is sum|c|*fixedCaps*(prod(A+E_N)^alpha-prod(A)^alpha), with every nonlinear error product retained.',
 'normalizedRatioSemantics':'Each directed[0,q] encloses |output_N-output_original| divided by the positive original absolute-stencil majorant sum|c|*fixedCaps*prod(A)^alpha. Both numerator and denominator may be multiplied by the same physical normalization. This is not division by the actual output, which may vanish.',
 'widthProof':'Each positive error monomial has error degree>=1. E8<=r E4 and0<r<=5/16 therefore shrink every term by at mostr, including nonlinear error-error products.',
 'globalRationalForceCap':'137345/1048576=(1+65/1024)^2-1',
 'positiveWeightedDensityCorollaries':density,
 'densitySemantics':'Squared-output errors use q*(2+q) times sum of squared common original component majorants. Work uses (q_u+q_f+q_u*q_f) times sum of common velocity-force majorant products. These also bound same-domain positive-weighted integral errors; actual integral values and an energy balance are not evaluated.',
 'cutoff':'Original radial plateau, all axial/time cutoff derivatives retained. Coordinates and cutoff have zero approximation error.',
 'scope':'All16 localized original inner velocity/gradient/pressure/full-force approximation error enclosures. Original leading field, all norm factors, cutoff, physical-time sign and pressure normalization are retained. No actual nonlinear integral or whole-K N8/jet promotion.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'outputs':len(rows),'errorTerms':all_error_terms,
 'quadraticSourceTerms':quadratic_checks,'forceRatios':[{'output':r['output'],'N4':r['degree4NormalizedErrorRatio']['upper'],
 'N8':r['degree8NormalizedErrorRatio']['upper']} for r in rows if 'force' in r['output']]}))
