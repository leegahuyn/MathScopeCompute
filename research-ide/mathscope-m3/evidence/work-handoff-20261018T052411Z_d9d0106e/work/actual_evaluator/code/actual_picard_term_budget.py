"""Bind the actual Picard0 truncation condition and test literal term budget.
No symbolic bound is mistaken for evaluating the actual solution series.
"""
from pathlib import Path
from fractions import Fraction as Q
from functools import lru_cache
from collections import Counter
import argparse,json,math
from actual_angular_energy import HEADER,sha,require,dump

SOURCE='analysis/base/PR30-recovery-handoff/angular-proof/inputs/ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT.json'
PIN='36026f7c3804d54f779d214ead8ea434db32b3fc5cb468465d174748eda5a74b'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path('.'));ap.add_argument('--output-dir',type=Path,required=True);ap.add_argument('--max-terms',type=int,default=1000000);a=ap.parse_args()
    root=a.root.resolve();out=a.output_dir.resolve();out.mkdir(parents=True,exist_ok=True)
    require(sha(root/SOURCE)==PIN,'Changed actual original Picard majorant input');s=json.loads((root/SOURCE).read_text())
    require(s['sourceHeaderSHA256']==sha(root/HEADER),'Picard source graph mismatch')
    require(s['actualSourceAndAnalyticInputsComposed'] and s['numericC1KCertifiedTailBoundsProvedHere'],'Missing actual original tail theorem')
    n=s['originalConstantCone']
    def mul(x,y):
        c,f=x;d,g=y;terms=Counter(dict(f));terms.update(dict(g));return c*d,tuple(sorted((k,v) for k,v in terms.items() if v))
    def power(x,p):
        c,f=x;p=Q(p)
        if p.denominator==1:c=c**p.numerator
        else:
            require(p.denominator==2 and c>0,'Unsupported nonpositive radical monomial')
            u,v=math.isqrt(c.numerator),math.isqrt(c.denominator)
            require(u*u==c.numerator and v*v==c.denominator,'Nonrational scalar radical')
            c=Q(u,v)**p.numerator
        return c,tuple((k,v*p) for k,v in f if v*p)
    @lru_cache(None)
    def at(i):
        z=n[str(i)];op=z['op'];b=z['args']
        if op=='rational':return Q(int(b[0]),int(b[1])),()
        if op=='source_parameter':
            if b[0]=='Lambda':return Q(1),(('Q',Q(64)),)
            if b[0]=='Xa':return Q(4),(('Q',Q(-64)),)
            return Q(1),((b[0],Q(1)),)
        if op=='multiply':
            value=(Q(1),())
            for j in b:value=mul(value,at(j))
            return value
        if op=='inverse':return power(at(b[0]),-1)
        if op=='integer_power':return power(at(b[0]),b[1])
        if op=='sqrt_positive':return power(at(b[0]),Q(1,2))
        if op=='exp':
            require(at(b[0])==(Q(1,16),(('t1',Q(1)),)),'Different exponential in exact K condition')
            return Q(1),(('exp(t1/16)',Q(1)),)
        raise ValueError('Nonmonomial operation in exact K condition: '+op)
    kroot=s['sourceConstants']['Kcondition']['root'];require(n[str(kroot)]['op']=='ceiling','Kcondition must be literal source ceiling')
    value=at(n[str(kroot)]['args'][0]);expected=(Q(72*2**139),(('Q',Q(465)),('exp(t1/16)',Q(1)),('rho',Q(-5)),('t1',Q(-4))))
    require(value==expected,'Incorrect actual Picard term-count normalization')
    par=s['actualParameterASTConstraints']
    require(par['Q']=={'quotient':[{'product':[{'integer':str(2**260)},{'ref':'K'}]},{'power':[{'ref':'sigmaStar'},2]}]},'Changed source Q')
    require(par['Lambda']=={'power':[{'ref':'Q'},64]} and par['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]},'Changed source Lambda/Xa')
    require(par['rho']=={'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]} and par['sigmaStar']=={'quotient':[{'ref':'j0'},{'integer':2000}]} and par['j0']=={'power':[{'ref':'h'},4]},'Changed source rho/sigma')
    require(par['t1']=={'power':[{'ref':'CSelected'},-120]} and par['CSelected']=={'exp':{'ref':'logCSelected'}},'Changed source t1')
    require(a.max_terms>0,'Positive term budget required');exponent=139+465*260+6;require(exponent==121045 and 72>2**6,'Lower-bound arithmetic')
    record={'schema':'MathScope.ActualPicardLiteralSeriesTermBudget/1','source':SOURCE,'source_sha256':PIN,
        'source_header_sha256':s['sourceHeaderSHA256'],'actual_Kcondition_root':kroot,
        'notation':{'Q':'The fixed source_parameter Q at node24797 (Q_profile), greater than2^260.',
            'band_Q':'The different shrinking band scale2^-ell at node622794 (Q_band), used in actual_scale_budget.py. These are not the same scalar.'},
        'literal_source_argument_identity':'72*2^139*Q^465*exp(t1/16)/(t1^4*rho^5)',
        'monomial_identity_recomputed_from_all_actual_scalar_ancestors':True,
        'source_domain':'Actual Picard0 common collar, with original parameter expressions and original tail estimate.',
        'strict_derivation':['Pstar=exp(2T)>1, K=Pstar^2>1; 0<h<1, j0=h^4, sigmaStar=j0/2000 in (0,1).',
            'Q=2^260*K/sigmaStar^2>2^260; rho=sigmaStar^2/65536 in (0,1).',
            'logCSelected=10log(1+Q^300)+Q^200>0, so t1=exp(-120logCSelected) in (0,1).',
            'Therefore Kcondition >= its positive argument >72*2^(139+465*260)>2^121045.'],
        'declared_max_literal_series_terms':a.max_terms,'literal_series_term_budget_exceeded':a.max_terms<=(1<<exponent),
        'certified_tail':'For K>=the unchanged source Kcondition, the original tail is m!*(16/delta)^m*4^-K/3 on the prescribed derivative collar.',
        'actual_partial_sum_evaluated':False,'actual_last_resolved_tau':None,
        'scope':'Only the literal original sufficient-K Picard term-by-term route is excluded under this term budget. This does not lower-bound the best algorithm, prove optimal K, block positive norm bounds, or declare symbolic/accelerated solution methods impossible.'}
    dump(out/'ACTUAL_PICARD_TERM_RESOURCE_BOUND.json',record)
    print(json.dumps({'actual_Kcondition_source_identity':True,'literal_term_budget_exceeded':record['literal_series_term_budget_exceeded'],'strict_term_count_lower_bound':'2^121045'}))

if __name__=='__main__':main()
