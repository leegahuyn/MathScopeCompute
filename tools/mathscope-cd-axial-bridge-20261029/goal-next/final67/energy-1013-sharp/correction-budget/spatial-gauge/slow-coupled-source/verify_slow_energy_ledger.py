"""Independent SymPy monomial reconstruction of every normalized slow contribution."""
from pathlib import Path
from hashlib import sha256
from collections import Counter
import json,re,sys
import sympy as S
if not __debug__:raise RuntimeError('Do not disable proof assertions.')
assert len(sys.argv)==4
goal,path,output=map(Path,sys.argv[1:]);assert not output.exists()
def load(relative,pin):
    data=(goal/relative).read_bytes();assert sha256(data).hexdigest()==pin
    return json.loads(data)
slow=load('whole-k-annular-slow/annular-slow-jet-bounds.json','3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69')
poly=load('final67/energy-1013-sharp/correction-budget/original-67plus13-polynomials.json','1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7')
data=path.read_bytes();receipt=json.loads(data);h=S.Symbol('h',real=True)
def canonical(row):return json.dumps(row,sort_keys=True,separators=(',',':'))
expected=[];zero=0;support=set()
for kind,values,weight in [('velocity',poly['outputs']['velocity'],S.Rational(1,2)+h),
                           ('gradient',sum(poly['outputs']['velocity_gradient'],[]),1+h)]:
    for component,polynomial in enumerate(values):
        for index,term in enumerate(polynomial):
            remaining=weight;coefficient=abs(S.Rational(term['coefficient']));radial=0;atom=None
            for key,multiplicity in term['powers']:
                name=poly['variables'][key]
                if name in ['x','y']:
                    remaining+=multiplicity*S.Rational(1,2);radial+=multiplicity
                elif name.startswith('C@'):
                    k,z,t=map(int,name[2:].split(','));assert t==0
                    if k:coefficient=0
                    remaining+=multiplicity*z*(h-S.Rational(1,2))
                    coefficient*=S.Integer([1,20,692][z])**multiplicity
                else:
                    assert atom is None and multiplicity==1;atom=name
                    field=slow['slowFieldAtomIntervals'][name]
                    if field.get('exactInterval')==['0','0']:coefficient=0
                    else:remaining-=S.sympify(field['tau0ReciprocalPower'],locals={'h':h})
            if coefficient==0:zero+=1;continue
            for piece in field['leadingTerms']+field['positiveTerms']:
                factor=piece['factor'];power=remaining
                if 'tau0^' in factor:
                    raw=factor.split('tau0^',1)[1]
                    power+=S.sympify(raw,locals={'h':h})
                    factor=factor.split('*tau0^',1)[0] if '*tau0^' in factor else '1'
                power=S.expand(power);a=power.subs(h,0);b=power.coeff(h)
                assert a>=0 and power.subs(h,S.Rational(1,64))>=0
                assert S.expand(power-a-b*h)==0
                support.add((str(a),str(b)))
                expected.append({'component':f'{kind}/{component}','atom':atom,'polynomialTerm':index,
                    'coefficient':str(coefficient*S.Rational(piece['coefficient'])),
                    'RstarPower':radial+piece['RstarPower'],'factor':factor,
                    'remainingTau0Power':[str(a),str(b)]})
assert Counter(map(canonical,expected))==Counter(map(canonical,receipt['rows']))
assert len(expected)==360 and zero==58
# A source leading velocity row has residual zero. Omitting its normalization
# leaves -1/2-h, which cannot be dropped.
assert any(r['component'].startswith('velocity/') and r['remainingTau0Power']==['0','0'] for r in expected)
wrong_power=-S.Rational(1,2)-h
assert wrong_power.subs(h,0)<0 and wrong_power.subs(h,S.Rational(1,64))<0
result={'status':'VERIFIED_INDEPENDENT_SYMBOLIC_COMPLETE_SLOW_TAU_COLLECTION',
 'ledgerSHA256':sha256(data).hexdigest(),'checkedContributions':len(expected),'zeroPolynomialTerms':zero,
 'remainingAffinePowers':sorted(map(list,support)),
 'normalization':{'velocity':'tau0^(1/2+h)','gradient':'tau0^(1+h)'},
 'exactControl':'A source leading velocity row has residual zero. Omitting its normalization leaves -1/2-h, rejected by the same endpoint test.',
 'analyticRule':'An affine exponent nonnegative at h=0 and h=1/64 is nonnegative throughout. For 0<tau0<1 each corresponding rpow is <=1.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'contributions':len(expected),'remainingAffinePowers':result['remainingAffinePowers']}))
