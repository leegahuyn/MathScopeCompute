"""Compare the raw67 absolute stencil with the collected scalar-gauge force majorant."""
from pathlib import Path
from fractions import Fraction as F
from hashlib import sha256
import json,sys
import sympy as S
if not __debug__:raise RuntimeError('Assertions must stay active.')
assert len(sys.argv)==4,'Pass GOAL_NEXT FROZEN_OUTPUT_ERROR_PROGRAM NEW_OUTPUT.'
goal,error_path,output=map(Path,sys.argv[1:]);assert not output.exists()
def load(path,pin):
    data=path.read_bytes();assert sha256(data).hexdigest()==pin,str(path)
    return json.loads(data)
errors=load(error_path,'48f4fa3f8f07cfb3e6ee88fb83ef6ef067a874307357ad4ce22e6e38ae19d0ae')
gauge=load(goal/'whole-k-core/inner-gauge-atoms.json','1f342570c0ac63a919441ed999860c835574299b73a2c36fb1b1c658b386876f')
force=load(goal/'whole-k-core-force/whole-inner-force-energy.json','fbe6238fad746e69e18c640b937c5c3ff77dbae0c481c3fe52448b763ae698a7')
R=S.Symbol('R',positive=True);symbols={}
def sym(name):return symbols.setdefault(name,S.Symbol(name,positive=True))
cut={(0,0):S.Integer(1),(0,1):sym('C_tau'),(1,0):sym('C_z'),(2,0):sym('C_zz'),(3,0):sym('C_zzz'),(1,1):sym('C_z_tau')}
atom={}
for name,terms in gauge['formulas'].items():
    atom[name]=sum(abs(term['integer'])*R**sum(term['xyPower'])*sym('I_'+term['scalar']+'@'+','.join(map(str,term['derivative']))) for term in terms)
fixed={}
for i,name in enumerate(errors['variables']):
    if name in ['x','y']:fixed[i]=R
    elif name.startswith('C@'):
        r,z,t=map(int,name[2:].split(','));fixed[i]=0 if r else cut[z,t]
rows=[]
for j in range(3):
    source=next(row for row in errors['rows'] if row['output']==f'force/{j}')
    raw=S.expand(sum(abs(S.Rational(term['signedCoefficient']))*
        S.prod(fixed[i]**k for i,k in term['fixedPowers'])*
        S.prod(atom[errors['variables'][i]]**k for i,k in term['fieldPowers']) for term in source['sourceTerms']))
    collected=S.expand(sum(S.Rational(term['coefficient'])*S.prod(R if factor=='R' else sym(factor) for factor in term['factors'])
                           for term in force['originalOperators']['componentUpperPrograms']['directForce'][j]))
    gens=sorted(raw.free_symbols|collected.free_symbols,key=str)
    raw_poly=S.Poly(raw,*gens);col_poly=S.Poly(collected,*gens)
    rp=dict(raw_poly.terms());cp=dict(col_poly.terms())
    unsupported=[(powers,c) for powers,c in rp.items() if powers not in cp]
    violations=[(powers,c-cp.get(powers,0)) for powers,c in rp.items() if c>cp.get(powers,0)]
    encode=lambda entries:[{'coefficient':str(c),'monomial':[[str(g),p] for g,p in zip(gens,powers) if p]}
                          for powers,c in entries[:3]]
    ratio=None if unsupported else max(F(str(c/cp[powers])) for powers,c in rp.items())
    rows.append({'component':j,'rawAbsoluteTerms':len(rp),'collectedTerms':len(cp),
       'coefficientwiseRawBelowCollected':not violations,'unmatchedRawMonomials':len(unsupported),
       'largestCoefficientRatioIfSupportsMatch':str(ratio) if ratio is not None else None,
       'unmatchedExamples':encode(unsupported),'negativeDominationExamples':encode(violations)})
result={'status':'VERIFIED_EXACT_MAJORANT_MATCH_AUDIT','rows':rows,
 'sameLeadingNormWarning':'C54 used original global leading radii. Sharp center uses independently valid local720 natural leading bounds; this is a rebase, not a numeric upper bound on the old global norm value.',
 'conclusion':'A raw-stencil absolute majorant may only be bounded by the collected sharp-center receipt after the reported coefficient and source-norm checks. Failed domination is not a counterexample for the actual field.',
 'sourcePins':errors['sourcePins'],'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode());print(json.dumps({'status':result['status'],'rows':rows}))
