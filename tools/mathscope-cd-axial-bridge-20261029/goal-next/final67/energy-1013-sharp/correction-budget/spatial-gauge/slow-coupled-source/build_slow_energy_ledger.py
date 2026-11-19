"""Exact physical tau-power collection for the original localized slow energy."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json,re,sys
if not __debug__:raise RuntimeError('Do not disable proof assertions.')
assert len(sys.argv)==3
goal,output=map(Path,sys.argv[1:]);assert not output.exists()
def load(relative,pin):
    data=(goal/relative).read_bytes();assert sha256(data).hexdigest()==pin
    return json.loads(data)
slow_pin='3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69'
polynomial_pin='1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7'
slow=load('whole-k-annular-slow/annular-slow-jet-bounds.json',slow_pin)
poly=load('final67/energy-1013-sharp/correction-budget/original-67plus13-polynomials.json',polynomial_pin)
def affine(text):
    text=text.replace(' ','');a=b=F(0)
    for term in re.findall(r'[+-]?[^+-]+',text):
        if term.endswith('h'):
            coefficient=term[:-1].removesuffix('*');coefficient={'':'1','+':'1','-':'-1'}.get(coefficient,coefficient)
            b+=F(coefficient)
        else:a+=F(term)
    return a,b
rows=[];zero_terms=0
for kind,outputs,weight in [('velocity',poly['outputs']['velocity'],F(1,2)),
                            ('gradient',[r for vector in poly['outputs']['velocity_gradient'] for r in vector],F(1))]:
    for component,terms in enumerate(outputs):
        for index,term in enumerate(terms):
            coefficient=abs(F(term['coefficient']));a,b=weight,F(1);rpower=0;atom=None;zero=False
            for variable,power in term['powers']:
                name=poly['variables'][variable]
                if name in ['x','y']:a+=F(power,2);rpower+=power
                elif name.startswith('C@'):
                    x,z,t=map(int,name[2:].split(','));assert t==0
                    if x:zero=True;continue
                    assert z in [0,1,2]
                    coefficient*=F([1,20,692][z])**power
                    a-=F(z*power,2);b+=z*power
                else:
                    assert atom is None and power==1
                    atom=name;row=slow['slowFieldAtomIntervals'][name]
                    if row.get('exactInterval')==['0','0']:zero=True;continue
                    assert int(name.split('@')[1].split(',')[-1])==0
                    u,v=affine(row['tau0ReciprocalPower']);a-=u;b-=v
            assert atom is not None
            if zero:zero_terms+=1;continue
            for entry in row['leadingTerms']+row['positiveTerms']:
                assert F(entry['coefficient'])>=0 and entry['RstarPower']>=0
                factor=entry['factor'];v=b
                match=re.fullmatch(r'(?:(H_\d+)\*)?tau0\^\((\d+)\*h\)',factor)
                if match:
                    factor=match[1] or '1';v+=int(match[2])
                assert factor in ['1','K','L_U','L_F^2','H_212882','H_212886','H_212893','H_212905']
                # Nonnegative at both endpoints h=0,1/64 proves the affine residual nonnegative.
                assert a>=0 and a+v/64>=0,(kind,component,index,atom,a,v)
                rows.append({'component':f'{kind}/{component}','atom':atom,'polynomialTerm':index,
                    'coefficient':str(coefficient*F(entry['coefficient'])),
                    'RstarPower':rpower+entry['RstarPower'],'factor':factor,
                    'remainingTau0Power':[str(a),str(v)]})
result={'status':'VERIFIED_ORIGINAL_SLOW_SPATIAL_ENERGY_TAU_POWER_LEDGER',
        'slowBoundsSHA256':slow_pin,'localizationPolynomialSHA256':polynomial_pin,
        'rows':rows,'positiveRows':len(rows),'zeroPolynomialTerms':zero_terms,
        'rule':'For 0<h<1/64 and 0<tau0<1, each nonnegative residual tau0 power is at most1.',
        'scope':'Complete localized original slow background only; initialized mean and primary wave are excluded.',
        'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'rows':len(rows),'zeroTerms':zero_terms}))
