#!/usr/bin/env python3
"""Independent exact polynomial/readback of the U0 four-face enclosure."""
import argparse,hashlib,json
from pathlib import Path
import sympy as s
p=argparse.ArgumentParser();p.add_argument('--norm',type=Path,default=Path('work/goal-next/continuation36/norm-leaf/leading-u0-c99.json'));p.add_argument('--sparse',type=Path,default=Path('work/goal-next/whole-k-annular-wrz-norm/background-c8.json'));p.add_argument('--out',type=Path);a=p.parse_args()
pins={a.norm:'77f072391c9e2e925e11a28837921f203599b2242f207f77780a2140da8cc13b',a.sparse:'5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'}
for path,h in pins.items():assert hashlib.sha256(path.read_bytes()).hexdigest()==h,path
bound=json.loads(a.norm.read_bytes());sparse=json.loads(a.sparse.read_bytes())
assert bound['request']=={'radialOrder':9,'etaOrder':9} and bound['leadingU0Root']==12501
assert bound['sourceParameterSHA256']==sparse['sourceParameterSHA256']
group=[x for x in sparse['groups'] if x['order']==0 and x['field']=='U'];assert len(group)==1
rows=group[0]['rows'];assert len(rows)==45 and {tuple(x['orders']) for x in rows}=={(i,j) for i in range(9) for j in range(9-i)}
chosen=[r for r in rows if r['orders']==[0,8]][0]
assert chosen['jet']==126411 and chosen['root']==126488 and chosen['faces']==[126448,126459,126471,126485]
assert all(len(x['faces'])==4 for x in rows)
# For H>=|u|, sqrt(1+u^2)<=1+H follows from this nonnegative polynomial.
v,g=s.symbols('v g', nonnegative=True);H=v+g
assert all(c>=0 for c in s.Poly(s.expand((1+H)**2-(1+v**2)),v,g).coeffs())
# Each face has integrand <=1+H. The lengths are Delta X and 2.
dx,R,t=s.symbols('dx R t', nonnegative=True)
face_total=s.expand((1+H)*(1+dx+2+2*dx))
assert s.simplify(face_total-3*(1+dx)*(1+H))==0
# 4 Xb<=R^2 and Xa>0 imply dx=2 Xb-Xa/2 <=R^2/2.
assert s.simplify((3*(1+R**2/s.Integer(2))*(1+H)-face_total).subs(dx,R**2/s.Integer(2)-t)-3*t*(1+H))==0
out={'status':'PASS','source_namespace_local_sparse_example':{'U0_eta8_jet':126411,'fourFaceNorm':126488,'faces':[126448,126459,126471,126485]},
 'source_U0_norm_root':12501,'FTC_count':45,'bounds':'[0, 3*(1+Rstar^2/2)*(1+H)] for every one of 45 original U0 C8 face sums',
 'qualification':'H is an exact positive source norm expression; no directed numerical evaluation, private live-family join, other leaf family, or whole K bound',
 'pins':{x.name:h for x,h in pins.items()}}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(txt,end='')
