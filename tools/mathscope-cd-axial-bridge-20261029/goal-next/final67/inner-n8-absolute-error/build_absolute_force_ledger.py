"""Cancel common physical powers before original inner force-error evaluation."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json,re,sys
if not __debug__:raise RuntimeError('Assertions must stay active.')
assert len(sys.argv)==4,'Pass GOAL_NEXT FROZEN_ERROR_PROGRAM NEW_OUTPUT.'
goal,path,output=map(Path,sys.argv[1:]);assert not output.exists()
data=path.read_bytes();assert sha256(data).hexdigest()=='48f4fa3f8f07cfb3e6ee88fb83ef6ef067a874307357ad4ce22e6e38ae19d0ae'
errors=json.loads(data)
base_bytes=(goal/'whole-k-inner-axis/inner-axis-jet-bounds.json').read_bytes()
assert sha256(base_bytes).hexdigest()=='4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638'
base=json.loads(base_bytes)
def affine(text):
    a=b=F(0)
    for term in re.findall(r'[+-]?[^+-]+',text.replace(' ','')):
        if term.endswith('h'):
            raw=term[:-1].removesuffix('*');b+=F({'':'1','+':'1','-':'-1'}.get(raw,raw))
        else:a+=F(term)
    return a,b
fixed={}
for i,name in enumerate(errors['variables']):
    if name in ['x','y']:fixed[i]=(F(4),F(-1,2),F(1,2),F(0))
    elif name.startswith('C@'):
        r,z,t=map(int,name[2:].split(','))
        if r:continue
        c={(0,0):1,(0,1):5,(1,0):20,(2,0):692,(3,0):69472,(1,1):100}[z,t]
        fixed[i]=(F(c),F(0),-F(z,2)-t,F(z))
def normalize(term):
    c=F(term.get('coefficient',term.get('signedCoefficient')));c=abs(c)
    lam=F(0);a,b=F(3,2),F(2)
    for i,k in term['fixedPowers']:
        v,l,x,y=fixed[i];c*=v**k;lam+=l*k;a+=x*k;b+=y*k
    radii=term.get('radiusPowers',term.get('fieldPowers',[]));error=term.get('errorPowers',[])
    for i,k in radii+error:
        row=base['fieldAtomIntervals'][errors['variables'][i]]
        lam+=F(row['LambdaPower'])*k;u,v=affine(row['tau0ReciprocalPower']);a-=u*k;b-=v*k
    assert a==0 and b>=0,(term,a,b)
    assert (2*lam).denominator==1
    return {'coefficient':str(c),'lambdaHalfPower':int(2*lam),'remainingTauHPower':str(b),
            'radiusPowers':radii,'errorPowers':error}
rows=[]
for row in errors['rows']:
    if not row['output'].startswith('force/'):continue
    rows.append({'component':int(row['output'].split('/')[1]),
      'baseProgram':[normalize(term) for term in row['sourceTerms']],
      'errorProgram':[normalize(term) for term in row['errorRadiusProgram']]})
result={'status':'VERIFIED_EXACT_INNER_FORCE_SR_NORMALIZATION_LEDGER',
 'errorProgramSHA256':sha256(data).hexdigest(),'innerBoundsSHA256':sha256(base_bytes).hexdigest(),
 'variables':errors['variables'],'rows':rows,
 'forceNormalization':'tau0^(A+1+h); every remaining half-integer tau power cancels exactly',
 'positiveCoefficientGain':'All original H_n factors retain tau0^(2*n*h) in every atom error; leading n0 has zero error.',
 'forceSquareRatioGeometry':'(352/7)*(4A)*Xb^(4A)/Lambda <=(1056/7)*Xb^3/Lambda, using B_h^4>1,4A<3,Xb>1',
 'scope':'Direct original raw-stencil base/error programs; no reuse of the collected scalar-force upper as the same W.',
 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'baseTerms':sum(len(r['baseProgram']) for r in rows),
 'errorTerms':sum(len(r['errorProgram']) for r in rows),
 'remainingTauHPowers':sorted({t['remainingTauHPower'] for r in rows for p in ['baseProgram','errorProgram'] for t in r[p]})}))
