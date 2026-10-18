#!/usr/bin/env python3
"""Independent exact polynomial/source-row comparison; no source producer runs."""
from pathlib import Path
from collections import Counter
import hashlib
import json

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'recovered/base'
ENERGY=ROOT/'work/prune_recovery/energy'
OUT=Path(__file__).resolve().parents[1]

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def require(v,m):
    if not v: raise AssertionError(m)
def clean(p): return {m:c for m,c in p.items() if c}
def atom(s): return {(s,):1}
def add(*ps):
    out=Counter()
    for p in ps:
        for m,c in p.items(): out[m]+=c
    return clean(out)
def scale(p,c): return clean({m:v*c for m,v in p.items()})
def mul(a,b):
    out=Counter()
    for ma,ca in a.items():
        for mb,cb in b.items(): out[tuple(sorted(ma+mb))]+=ca*cb
    return clean(out)
def da(name,k):
    if name.startswith('x') and len(name)==2: return {():1} if int(name[1])==k else {}
    field,order=name.split('@');order=list(map(int,order.split(',')))
    if field in ('C','b'):
        require(len(order)==3,'Bad s,z,tau jet')
        order[0 if k<2 else k-1]+=1
        jet=field+'@'+','.join(map(str,order))
        return {tuple(sorted(('x'+str(k),jet))):2} if k<2 else atom(jet)
    require(field in ('A0','A1','A2','p') and len(order)==4,'Bad Cartesian jet')
    order[k]+=1
    return atom(field+'@'+','.join(map(str,order)))
def diff(p,k):
    terms=[]
    for monomial,c in p.items():
        for j,name in enumerate(monomial):
            terms.append(scale(mul({monomial[:j]+monomial[j+1:]:1},da(name,k)),c))
    return add(*terms)
def curl(v): return [add(diff(v[k],j),scale(diff(v[j],k),-1)) for j,k in ((1,2),(2,0),(0,1))]
def unpack(rows):
    out={}
    for row in rows:
        m=tuple(sorted(filter(None,row['monomial'].split('*'))));c=int(row['coefficient'])
        require(m not in out and c!=0,'Noncanonical polynomial')
        out[m]=c
    return out

def main():
    binding_path=ENERGY/'evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json'
    binding=json.loads(binding_path.read_bytes())
    for pin in binding['sourcePins']: require(sha(BASE/pin['path'])==pin['sha256'],'Original source pin changed')
    source=BASE/'work/remaining_chain/source/source-near-terminal-evidence-data.mjs'
    text=source.read_text()
    encoded=text.split('export const SOURCE_NEAR_TERMINAL_ARCHIVE = ',1)[1].strip()
    require(encoded.endswith(';'),'Unexpected constant archive framing')
    archived=json.loads(encoded[:-1]);cert=archived['certificate'];program=cert['formulaProgram']
    operator=cert['localizationBinding']['operator']
    require(binding['originalOperator']==operator,'Stored operator differs from original captured rows')
    require(binding['sourceBinding']==cert['sourceBinding'],'Changed captured source identity')
    require(operator['sharedFieldInstance']=='ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN','Wrong final target')
    ids=program['sourceNodeIds'];nodes=dict(zip(ids,program['nodes']));roots=program['sourceLocalizationProgramRoots']
    cutoff=ids[roots['cutoff']];gradient=[ids[roots['gradient_'+str(i)]] for i in range(3)]
    def coefficient(source_id,expected,sign):
        if sign==1:return source_id==expected
        n=nodes[source_id]
        if n['op']!='multiply' or len(n['args'])!=2:return False
        operands=[ids[i] for i in n['args']]
        return expected in operands and any(nodes[i]=={'op':'rational','args':['-1','1']} for i in operands)
    for i,(j,k) in enumerate(((1,2),(2,0),(0,1))):
        expected=[('A',k,j,cutoff,1),('A',j,k,cutoff,-1),('A',k,None,gradient[j],1),('A',j,None,gradient[k],-1),('B_e_theta',i,None,cutoff,1)]
        row=operator['velocity'][i]
        require(row['component']==i and len(row['terms'])==5,'Captured curl row shape')
        for term,(field,component,derivative,c,s) in zip(row['terms'],expected):
            require((term['field'],term['component'],term['derivative'])==(field,component,derivative) and coefficient(term['coefficient'],c,s),'Captured curl product term')
    require(operator['pressure']==[{'field':'p_loc','derivative':None,'coefficient':cutoff}],'Captured full pressure cutoff')
    C=atom('C@0,0,0');b=atom('b@0,0,0');A=[atom(f'A{i}@0,0,0,0') for i in range(3)];p=atom('p@0,0,0,0')
    direct=[scale(mul(atom('x1'),b),-1),mul(atom('x0'),b),{}]
    u=[add(v,mul(C,B)) for v,B in zip(curl([mul(C,a) for a in A]),direct)]
    pressure=mul(C,p);gradient=[[diff(v,j) for j in range(3)] for v in u]
    force=[add(scale(diff(v,3),-1),scale(add(*(diff(diff(v,j),j) for j in range(3))),-1),add(*(mul(u[j],diff(v,j)) for j in range(3))),diff(pressure,i)) for i,v in enumerate(u)]
    expected={'velocity':[unpack(a) for a in binding['exactPolynomials']['velocity']],
              'velocityGradient':[[unpack(a) for a in component] for component in binding['exactPolynomials']['velocityGradient']],
              'pressure':unpack(binding['exactPolynomials']['pressure']),
              'directForce':[unpack(a) for a in binding['exactPolynomials']['directForce']]}
    require(expected=={'velocity':u,'velocityGradient':gradient,'pressure':pressure,'directForce':force},'Independent exact differential polynomials differ')
    require(not add(*(diff(u[i],i) for i in range(3))),'Cartesian divergence is not identically zero')
    allp=u+[a for component in gradient for a in component]+[pressure]+force
    atoms=sorted({a for poly in allp for m in poly for a in m})
    require(atoms==binding['requiredAtoms'],'Required atom inventory incomplete or extra')
    # These are exact algebraic mutation witnesses, not extra actual-field runs.
    omitted_cutoff_curl=[mul(C,add(v,B)) for v,B in zip(curl(A),direct)]
    curl_mutation=any(a!=b for a,b in zip(u,omitted_cutoff_curl))
    time_mutation=any(diff(v,3) for v in u)
    pressure_mutation=any(diff(pressure,i)!=diff(p,i) for i in range(3))
    require(curl_mutation and time_mutation and pressure_mutation,'Failed missing-term/sign witness')
    require(all('inverse' not in a and '/' not in a for a in atoms),'Unexpected radial division in polynomial atoms')
    result={'schema':'MathScope.EnergyAlgebraIndependentReview/1','status':'PASS',
      'review_code_sha256':sha(Path(__file__)),'binding_sha256':sha(binding_path),
      'worker_code_sha256':{p.name:sha(p) for p in (ENERGY/'code').glob('*') if p.is_file()},
      'captured_original_operator_rows_exact':True,'source_pins_verified':binding['sourcePins'],
      'independent_full_polynomial_equality':True,'velocity_components':3,'gradient_components':9,'direct_force_components':3,
      'polynomial_terms':sum(map(len,allp)),'distinct_atoms':len(atoms),
      'physical_time_derivative':'-partial_tau','viscosity':1,
      'full_cartesian_gradient':True,'curl_cutoff_terms_retained':True,'full_pressure_cutoff_retained':True,
      'cartesian_divergence_exact_zero':True,'axis_radial_division_present':False,
      'mutations_detected':['omitted grad(C) cross A','physical-time derivative sign reversed','pressure cutoff omitted'],
      'scope':'Generic exact differential polynomials and source-row binding only; no actual final-family jet value or whole-K integral computed.',
      'source_producer_executed':False,'actual_field_values_computed':False,'N706_closed':False,'N805_closed':False}
    (OUT/'ALGEBRA_REVIEW.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ('source_pins_verified','worker_code_sha256')},indent=2))

if __name__=='__main__':main()
