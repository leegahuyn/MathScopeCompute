"""Independent exact signed-difference and coefficientwise nonlinear error checks."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json,sys
import sympy as S
if not __debug__:raise RuntimeError('Do not disable exact proof assertions.')
assert len(sys.argv)==5,'Pass GOAL_NEXT FROZEN_INNER_REFINEMENT OUTPUT_ERROR_PROGRAM NEW_OUTPUT.'
goal,inner_path,path,output=map(Path,sys.argv[1:]);assert not output.exists()
source_bytes=path.read_bytes();r=json.loads(source_bytes)
inner_bytes=inner_path.read_bytes()
assert sha256(inner_bytes).hexdigest()==r['sourcePins']['innerRefinement']=='86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601'
inner=json.loads(inner_bytes)
bound_bytes=(goal/'whole-k-inner-axis/inner-axis-jet-bounds.json').read_bytes()
assert sha256(bound_bytes).hexdigest()==r['sourcePins']['innerBounds']=='4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638'
bounds=json.loads(bound_bytes)
for name,base in bounds['fieldAtomIntervals'].items():
    er=inner['fieldAtomErrorEnclosures'][name];mu=r['atomErrorRelativeCaps'][name]
    if base.get('exactInterval')==['0','0']:
        assert er['exactError']==['0','0'] and all(F(mu[k])==0 for k in ['degree4','degree8','errorWidthRatio'])
        continue
    assert all(er[key]==base[key] for key in ['LambdaPower','tau0ReciprocalPower'])
    for N in [4,8]:
        terms=er[f'degree{N}ErrorRadiusTerms'];assert set(terms)==set(base['positiveTerms'])
        assert F(mu[f'degree{N}'])==max(F(c)/F(base['positiveTerms'][tag]) for tag,c in terms.items())
    assert F(mu['errorWidthRatio'])==max(F(er['degree8ErrorRadiusTerms'][tag])/F(c) for tag,c in er['degree4ErrorRadiusTerms'].items())
poly_bytes=(goal/'final67/energy-1013-sharp/correction-budget/original-67plus13-polynomials.json').read_bytes()
assert sha256(poly_bytes).hexdigest()==r['sourcePins']['original67Plus13Stencil']=='1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7'
poly=json.loads(poly_bytes);variables=poly['variables'];assert variables==r['variables']
z=S.symbols('z:82',nonnegative=True);e=S.symbols('e:82',nonnegative=True)
fields={i for i,name in enumerate(variables) if name in r['atomErrorRelativeCaps']}
zero=set(r['exactZeroVariables']);fields-=zero
original={}
for kind,rows in poly['outputs'].items():
    if kind=='velocity_gradient':rows=sum(rows,[])
    elif kind=='localized_pressure':rows=[rows]
    for i,terms in enumerate(rows):original[f'{kind}/{i}']=terms
assert len(original)==len(r['rows'])==16
def positive_polynomial(expression):
    if expression==0:return True
    return all(c>=0 for c in S.Poly(S.expand(expression),*sorted(expression.free_symbols,key=str)).coeffs())
checks=[];cross_controls=0;total_nonlinear_errors=0
for row in r['rows']:
    name=row['output'];P=S.S.Zero;W=S.S.Zero;retained=[];omitted=0
    for index,term in enumerate(original[name]):
        powers=dict(term['powers'])
        if zero.intersection(powers):omitted+=1;continue
        monomial=S.prod(z[i]**power for i,power in powers.items())
        c=S.Rational(term['coefficient']);P+=c*monomial;W+=abs(c)*monomial
        retained.append({'sourceIndex':index,'signedCoefficient':term['coefficient'],
          'fixedPowers':[[i,power] for i,power in powers.items() if i not in fields],
          'fieldPowers':[[i,power] for i,power in powers.items() if i in fields]})
    assert retained==row['sourceTerms'] and omitted==row['omittedExactZeroTerms']
    substitutions={z[i]:z[i]+e[i] for i in fields}
    signed_difference=S.expand(P.subs(substitutions,simultaneous=True)-P)
    positive_difference=S.expand(W.subs(substitutions,simultaneous=True)-W)
    encoded=S.S.Zero;nonlinear=S.S.Zero
    for term in row['errorRadiusProgram']:
        value=S.Rational(term['coefficient'])*S.prod(z[i]**power for i,power in term['fixedPowers']+term['radiusPowers'])*S.prod(e[i]**power for i,power in term['errorPowers'])
        encoded+=value
        if sum(power for i,power in term['errorPowers'])>1:nonlinear+=value;total_nonlinear_errors+=1
    assert S.expand(positive_difference-encoded)==0
    generators=sorted(signed_difference.free_symbols,key=str)
    signed_absolute=sum(abs(c)*S.prod(v**power for v,power in zip(generators,powers))
                        for powers,c in S.Poly(signed_difference,*generators).terms())
    assert positive_polynomial(encoded-signed_absolute)
    ratio=S.Rational(row['errorWidthRatioUpper'])
    component_ratios={e[i]:S.Rational(r['atomErrorRelativeCaps'][variables[i]]['errorWidthRatio'])*e[i] for i in fields}
    contracted=S.expand(encoded.subs(component_ratios,simultaneous=True))
    assert positive_polynomial(ratio*encoded-contracted) and 0<ratio<=S.Rational(5,16)
    bound_checks={}
    for degree in [4,8]:
        scaled=S.expand(encoded.subs({e[i]:S.Rational(r['atomErrorRelativeCaps'][variables[i]][f'degree{degree}'])*z[i] for i in fields},simultaneous=True))
        q=S.Rational(row[f'degree{degree}NormalizedErrorRatio']['upper'])
        assert positive_polynomial(q*W-scaled)
        bound_checks[degree]=str(q)
    if name.startswith('force/'):
        assert nonlinear!=0
        assert S.expand(positive_difference-(encoded-nonlinear))!=0
        cross_controls+=1
    checks.append({'output':name,'originalSignedDifferenceDominated':True,
      'exactPositiveDifferenceMatched':True,'coefficientwiseContraction':str(ratio),
      'normalizedRatioUppers':bound_checks})
assert cross_controls==3 and total_nonlinear_errors>0
used_force=set()
for row in r['rows']:
    if row['output'].startswith('force/'):
        for term in row['sourceTerms']:
            used_force.update(variables[i] for i,power in term['fieldPowers']+term['fixedPowers'])
assert {'C@0,0,1','C@0,1,1','C@0,3,0'}<=used_force
assert any(name.startswith('p@') for name in used_force)
for N in [4,8]:
    qv=max(F(row[f'degree{N}NormalizedErrorRatio']['upper']) for row in r['rows'] if row['output'].startswith('velocity/'))
    qg=max(F(row[f'degree{N}NormalizedErrorRatio']['upper']) for row in r['rows'] if row['output'].startswith('velocity_gradient/'))
    qf=max(F(row[f'degree{N}NormalizedErrorRatio']['upper']) for row in r['rows'] if row['output'].startswith('force/'))
    expected={'velocitySquaredError':qv*(2+qv),'gradientSquaredError':qg*(2+qg),
              'forceSquaredError':qf*(2+qf),'workError':qv+qf+qv*qf}
    assert {key:F(value) for key,value in r['positiveWeightedDensityCorollaries'][str(N)].items()}==expected
assert all(F(r['positiveWeightedDensityCorollaries']['8'][key])<F(r['positiveWeightedDensityCorollaries']['4'][key]) for key in expected)
result={'status':'VERIFIED_INDEPENDENT_ORIGINAL_SIGNED_OUTPUT_AND_NONLINEAR_ERROR_PROGRAM',
 'errorProgramSHA256':sha256(source_bytes).hexdigest(),'checks':checks,
 'outputChecks':len(checks),'nonlinearErrorProducts':total_nonlinear_errors,
 'rejectedNonlinearOmissionControls':cross_controls,
 'retainedForceCutoffInputs':sorted(name for name in used_force if name.startswith('C@')),
 'pressureGradientRetained':True,
 'forceDegree8NormalizedAbsoluteErrorRatios':{'lower':'0','upper':'8563/131072'},
 'ratioDenominator':'Same strictly positive original absolute-stencil force majorant, including common physical source radii and cutoff bounds; not the actual force magnitude.',
 'positiveWeightedDensityCorollaries':r['positiveWeightedDensityCorollaries'],
 'scope':'Exact signed polynomial finite-difference domination, all error-error cross products, coefficientwise refinement, and normalized ratio inequalities. Original analytic/norm premises are inherited unchanged.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'outputs':len(checks),'nonlinearErrorProducts':total_nonlinear_errors,
 'nonlinearOmissionControls':cross_controls,'forceRatio':'8563/131072'}))
