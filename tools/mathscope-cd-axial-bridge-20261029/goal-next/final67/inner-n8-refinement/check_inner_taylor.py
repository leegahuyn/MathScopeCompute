"""Independent signed-source polynomial and exact full-inner Cauchy-tail refinement."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
from collections import defaultdict
from math import factorial
import json,re,sys
import sympy as S
if not __debug__:raise RuntimeError('Do not disable exact proof assertions.')
assert len(sys.argv)==4,'Pass GOAL_NEXT TAYLOR_SOURCE NEW_OUTPUT.'
goal,source_path,output=map(Path,sys.argv[1:]);assert not output.exists()
def read(path,pin):
    data=path.read_bytes();assert sha256(data).hexdigest()==pin,str(path)
    return json.loads(data)
native=read(goal/'whole-k-inner-axis/inner-axis-native.json','19ac2bfde61e1a9808a2a9f4aa324a2d634fed376fcc2084d886500a164255d3')
bounds=read(goal/'whole-k-inner-axis/inner-axis-jet-bounds.json','4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638')
source_bytes=source_path.read_bytes();source=json.loads(source_bytes)
assert source['status']=='VERIFIED_ORIGINAL_INNER_SIGNED_TAYLOR_POLYNOMIAL_SOURCE'
assert source['sourcePins']['originalNodePrefix']==native['originalNodes']
assert source['originalNodeCount']==123870
records={int(i):row for i,row in source['records'].items()}
Y,Lambda=S.symbols('Y Lambda',real=True);parsed={}
def expression(i):
    if i in parsed:return parsed[i]
    row=records[i];op,args=row['op'],row['args']
    if i==source['Y']:value=Y
    elif i==source['Lambda']:value=Lambda
    elif op=='rational':value=S.Rational(*map(int,args))
    elif op=='actual_background_even_profile':value=S.Symbol('D_'+str(i),real=True)
    elif op=='add':value=S.Add(*(expression(j) for j in args))
    elif op=='multiply':value=S.Mul(*(expression(j) for j in args))
    elif op=='inverse':value=1/expression(args[0])
    elif op=='integer_power':value=expression(args[0])**args[1]
    else:raise AssertionError((i,op,args))
    parsed[i]=value;return value
assert S.cancel(expression(source['anchorX'])-2/Lambda)==0
coefficient={}
for row in source['coefficients']:
    n,field,t,k=[row[x] for x in ['n','field','t','k']]
    profile=native['rows'][n-1]
    assert row['component']=={'F':0,'U':1,'Pi':3}[field]
    assert records[row['derivativeRoot']]=={'op':'actual_background_even_profile',
      'args':[profile['actualSystem'],row['component'],source['anchorX'],source['eta'],k,t]}
    value=expression(row['coefficientRoot']);wanted=expression(row['derivativeRoot'])/(Lambda**k*factorial(k))
    assert S.cancel(value-wanted)==0
    coefficient[n,field,t,k]=value
assert len(coefficient)==324
polynomial_checks=average_checks=0
for row in source['polynomials']:
    n,field,t,degree=[row[x] for x in ['n','field','t','degree']]
    expected=S.expand(sum(coefficient[n,field,t,k]*(Y-2)**k for k in range(degree+1)))
    assert S.expand(expression(row['root'])-expected)==0
    axis_corrected=expected-expected.subs(Y,0)
    assert S.expand(expression(row['axisCorrectedRoot'])-axis_corrected)==0
    assert S.expand(axis_corrected.subs(Y,0))==0
    polynomial_checks+=1
    if field=='U':
        expected_average=sum(c*Y**power[0]/(power[0]+1) for power,c in S.Poly(expected,Y).terms())
        assert S.expand(expression(row['stokesAverageRoot'])-expected_average)==0
        corrected_average=expected_average-expected.subs(Y,0)
        assert S.expand(expression(row['stokesAverageAxisCorrectedRoot'])-corrected_average)==0
        assert S.expand(corrected_average.subs(Y,0))==0
        assert S.expand(expected-expected_average)!=0
        average_checks+=1
assert polynomial_checks==72 and average_checks==24
assert [F(*map(int,native['sourceNodeRecords'][str(row['analytic']['radius'])]['args'])) for row in native['rows']]==[F(7),F(13,2),F(25,4)]
assert F(2)+F(4)<F(25,4)
z=S.Symbol('z');tails={}
for degree in [4,8]:
    tails[degree]=[F(str(S.diff(z**(degree+1)/(1-z),z,d).subs(z,S.Rational(1,2))/4**d)) for d in range(4)]
assert tails[4]==[F(1,16),F(3,16),F(1,2),F(39,32)]
assert tails[8]==[F(1,256),F(5,256),F(23,256),F(195,512)]
corrected_tails={degree:[(2 if d==0 else 1)*value for d,value in enumerate(values)] for degree,values in tails.items()}
tail_rows=[]
for d in range(4):
    gap=sum((F(factorial(k),factorial(k-d))*F(2)**(k-d)/F(4)**k for k in range(5,9)),F(0))
    assert tails[4][d]==gap+tails[8][d] and tails[8][d]<tails[4][d]
    ratio=tails[8][d]/tails[4][d];assert ratio<=F(5,16)
    tail_rows.append({'radialDerivative':d,'degree4':str(tails[4][d]),'degree8':str(tails[8][d]),
      'polynomialGapCap':str(gap),'widthRatio':str(ratio),
      'stokesAverageDegree4':str(tails[4][d]/(d+1)),
      'stokesAverageDegree8':str(tails[8][d]/(d+1))})
    tail_rows[-1].update({'axisCorrectedDegree4':str(corrected_tails[4][d]),
                         'axisCorrectedDegree8':str(corrected_tails[8][d])})
root_indices=defaultdict(list)
for profile in native['rows']:
    for row in profile['cauchy']:root_indices[row['bound']].append({'n':profile['n'],**row})
def transferred(rows):
    result={};strict=zeros=0
    for name,row in rows.items():
        if row.get('exactInterval')==['0','0']:
            result[name]={'exactError':['0','0']};zeros+=1;continue
        old,new={},{}
        for key,coef in row['positiveTerms'].items():
            match=re.fullmatch(r'H_(\d+)\*tau0\^\((\d+)\*h\)',key);assert match,key
            root,order=map(int,match.groups());indices=root_indices[root]
            assert all(2*r['n']==order for r in indices)
            rho={degree:max(corrected_tails[degree][r['r']]/factorial(r['r']) for r in indices) for degree in [4,8]}
            assert 0<rho[8]<rho[4] and rho[8]<=F(5,16)*rho[4]
            old[key]=str(F(coef)*rho[4]);new[key]=str(F(coef)*rho[8])
        assert old and new
        result[name]={key:row[key] for key in ['LambdaPower','tau0ReciprocalPower']}
        result[name].update({'degree4ErrorRadiusTerms':old,'degree8ErrorRadiusTerms':new,
                             'widthRatioUpper':'5/16','strictWidthDecrease':True})
        strict+=1
    return result,strict,zeros
scalar,scalar_strict,scalar_zeros=transferred(bounds['scalarIntervals'])
atoms,atom_strict,atom_zeros=transferred(bounds['fieldAtomIntervals'])
assert (len(scalar),scalar_strict,scalar_zeros)==(22,22,0)
assert (len(atoms),atom_strict,atom_zeros)==(67,48,19)
result={'status':'VERIFIED_ORIGINAL_FULL_INNER_SIGNED_TAYLOR_ORDER4_TO8_ERROR_REFINEMENT',
 'sourceSHA256':sha256(source_bytes).hexdigest(),'originalPrefixSHA256':native['originalNodes'],
 'pins':source['sourcePins'],'domain':source['domain'],
 'signedPolynomialChecks':polynomial_checks,'exactStokesAverageChecks':average_checks,
 'actualNativeCoefficientOperands':len(coefficient),
 'axisNormalization':'Physical reconstruction uses P_N(Y)-P_N(0), and the correspondingly corrected Stokes average; all original positive-order axis data and zero pressure datum are preserved exactly. Only radial-d0 error caps double.',
 'commonCauchyCircle':{'anchorY':2,'radius':4,'maximumRealDistance':2,'ratio':'1/2','outerRadiusUse':'|Y|<=6<25/4'},
 'tailConvention':'Each table entry multiplies solutionNorm_n*t!*(2/strip_n)^t; the Stokes average has the additional1/(d+1).',
 'tailRows':tail_rows,
 'profileEnclosureNesting':'The exact finite difference between signed P8 and P4 is bounded by gapCap, and tail4=gapCap+tail8. Thus signed pointwise profile and average enclosures nest.',
 'scalarErrorEnclosures':scalar,'fieldAtomErrorEnclosures':atoms,
 'widthComparison':{'scalarsStrictlyNarrower':scalar_strict,'atomsStrictlyNarrower':atom_strict,
   'exactZeroAtomErrors':atom_zeros,'uniformWidthRatioUpper':'5/16',
   'meaning':'Widths of certified approximation-error intervals; retained leading source is exact. Source norm factors are positive symbolic original expressions, not numerical sample values.'},
 'reconstruction':source['reconstruction'],
 'assumptions':['existing source core/auxiliary analytic identification and norm proof on original disks',
   'the existing actual cutoff selector excludes every n>=4 on whole K',
   'existing original final-field identification with the Stokes background on X<=Xa',
   'fixed original source labels, original pressure normalization and original flat seams'],
 'negativeControl':'Replacing the exact Stokes average polynomial by the unaveraged U polynomial fails24 symbolic source checks.',
 'scope':'Genuine coefficient-order refinement of the actual original final inner representation and all local22/67 linear gauge-jet error enclosures. Original n0 is retained exactly. No numerical nonlinear force/energy integral, annular refinement, whole-K N8 completion or global jet promotion is inferred.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'signedPolynomialChecks':polynomial_checks,
 'stokesChecks':average_checks,'scalarWidths':scalar_strict,'atomWidths':atom_strict,'zeroErrors':atom_zeros,'ratio':'5/16'}))
