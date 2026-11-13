"""Exact finite Leibniz demands for the same-live positive-N v bound."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
from math import comb
from pathlib import Path
import json

PIN='35af7f37ef284ce9ae18768e2c8c9e21164777c7552a8d0995569e8cdb8347c0'
def main():
    p=ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('out',type=Path);a=p.parse_args()
    raw=a.source.read_bytes();assert sha256(raw).hexdigest()==PIN
    source=json.loads(raw)
    assert source['status']=='SAME_LIVE_N3_V_LONGITUDINAL_CONDITIONAL_L2_BOUND'
    assert source['sourceCovarianceTheta']==17754252 and source['sourceStressTerm']==17744077
    rows=[]
    for j in range(1,4):
      for l in range(5-j):
       for alpha in product(range(5),repeat=3):
        degree=sum(alpha)+l+j
        if degree>4:continue
        # At top degree the original product differentiates the mean first
        # in R, Z or xi; pure (T,v) degree-four words are not requested.
        if degree==4 and alpha[0]==alpha[1]==l==0:continue
        b=[]
        for beta in product(*(range(x+1) for x in alpha)):
            coef=comb(alpha[0],beta[0])*comb(alpha[1],beta[1])*comb(alpha[2],beta[2])
            rem=tuple(alpha[k]-beta[k] for k in range(3))
            b.append({'beta':beta,'remaining':rem,'multinomial':coef})
        # N and L do not hit a(R), 1/R, c0 or epsilon on the fixed chart.
        terms=[{'kind':'radial-W-rtheta','slow':(alpha[0]+1,*alpha[1:]),'L':l,'N':j-1},
               {'kind':'axial-W-thetaz','slow':(alpha[0],alpha[1]+1,alpha[2]),'L':l,'N':j-1}]
        for x in b:
          terms.extend([{'kind':'a-times-L-W-rtheta','slow':x['remaining'],'L':l+1,'N':j-1,'factor':x['multinomial']},
                        {'kind':'2-over-R-times-W-rtheta','slow':x['remaining'],'L':l,'N':j-1,'factor':2*x['multinomial']}])
        assert max(sum(t['slow'])+t['L']+t['N'] for t in terms)<=4
        rows.append({'j':j,'L':l,'slow':alpha,'terms':terms})
    assert len(rows)==52
    # There are at most 2^3 slow Leibniz factors for each of two products;
    # two further terms have coefficient <=1 when 0<epsilon<=1.
    assert max(2+2*(2**sum(row['slow'])) for row in rows)==18
    result={'status':'EXACT_SAME_LIVE_CONDITIONAL_V_COVARIANCE_DEMAND',
      'sourceReceiptSHA256':PIN,'axes':['R','Z','T','L','N'],
      'positiveNMeanIndices':len(rows),'maxCovarianceDerivativeOrder':4,'rows':rows,
      'inequality':'c0*||D^alpha L^l N^j v||_2 <= ||D^(alpha+e_R)L^l N^(j-1) W_rtheta||_2 + epsilon||D^(alpha+e_Z)L^l N^(j-1) W_thetaz||_2 + sum_(beta<=alpha) binom(alpha,beta)[||D^beta a||_infinity ||D^(alpha-beta)L^(l+1)N^(j-1)W_rtheta||_2 + 2||D^beta R^-1||_infinity ||D^(alpha-beta)L^l N^(j-1) W_rtheta||_2]',
      'inverseRadius':'For R>=Rmin>0 and beta=(k,0,0), ||D^beta R^-1||_infinity <= k! Rmin^(-k-1); it vanishes for beta_Z+beta_T>0.',
      'coarseConditionalBound':'Let A>=1 bound all ||D^beta a||_infinity and 2||D^beta R^-1||_infinity for |beta|<=3, and B bound every enumerated source W L2 norm. If 0<epsilon<=1, all 52 requested ||D_s^alpha L^l N^j v||_2 are <=18*c0^-1*A*B.',
      'premises':['fixed-label chart, original coefficient a and epsilon independent of common Y',
                  'all displayed source covariance derivatives exist in L2 and coefficient derivatives are bounded',
                  'positive c0 and the original Fourier inverse identity'],
      'scope':'Exact demand and conditional bound only; no actual covariance numerical norm, pointwise v norm, zero-N C4, or full forcing bound.',
      'finalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as f:json.dump(result,f,indent=2);f.write('\n')
    print(result['status'],len(rows))
if __name__=='__main__':main()
