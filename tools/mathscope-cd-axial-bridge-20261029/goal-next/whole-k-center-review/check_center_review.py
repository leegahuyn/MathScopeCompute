"""Independent exact-arithmetic audit of displayed center constants and c/b scope."""
import argparse,json,hashlib
from fractions import Fraction as Q
from pathlib import Path

EXPECTED='6c931f7e084df630c9fa1a632f6f7b7c9c3deda8b20c283864224a2e81c7f728'
def main():
 p=argparse.ArgumentParser();p.add_argument('--receipt',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 raw=a.receipt.read_bytes();assert hashlib.sha256(raw).hexdigest()==EXPECTED;j=json.loads(raw)
 expected={'2':['0.576725','-0.176417'],'9/4':['0.533617','-0.168490'],'5/2':['0.492458','-0.160821']}
 for row in j['actualCoreSamples']['points']:
  for k,term in enumerate(row['phi']):
   lo,hi=Q(term['lo']),Q(term['hi']);rounded=Q(expected[row['Y']][k]);assert lo<=hi and rounded-Q(1,2000000)<lo<=hi<rounded+Q(1,2000000)
 assert 2*Q(1,4)*Q(1,2)*Q(1,16)==Q(1,64) # 2*pi, cell volume eta*/4, geometry 1/2, E² 1/16
 assert Q(1,64)*Q(1,4)==Q(1,256) # chi² >= exp(-16/eta*²)/4
 assert Q(1,64)*Q(1,2)==Q(1,128) # integral -c*c' = (cL²-cU²)/2
 assert 2*1*Q(1,2)*Q(1,16)==Q(1,16) # symmetric endpoint volume eta*
 assert Q(1,2048)+Q(1,8192)<Q(1,1024) and Q(1,64)-Q(1,1024)>Q(1,128)
 # A countermodel in LOG2 exponents only: h=2^-4097, C=2^65536, H=1/h.
 # c_n=2^(H+n-1); b1=2^(C+10), b_n=2^(C+12+n) for n>=2.
 # These obey c growth, b growth and b>=c; Qfactor in (1,2).
 C=2**65536;H=2**4097;assert H<C and C>=2**65536 and C>=2**(2*(4097+6))
 assert H+2-(C+14)<-1 # c3*q < 1/2; use Qfactor<2
 assert (C+15)-(C+15)==0 # b3*q = Qfactor > 1
 out={'receiptSHA256':EXPECTED,'allSixSixDecimalDisplaysCorrect':True,'exactEnergyCoefficients':{'nearStart':'pi/64','flatStep':'pi/256','timeCutoffWork':'pi/128','conditionalEndpoint':'pi/16'},'b_s_error_bound':'1/2048+1/8192<1/1024','cutoffScope':'n>=3 zero is verified only for source common b sequence; manuscript (10.1) denotes chi(c_n q). b_n>=c_n alone does not imply chi(c_n q)=0.','logicalCountermodel':'h=2^-4097,C=2^65536,c_n=2^(2^4097+n-1), b1=2^(C+10), b_n=2^(C+12+n) for n>=2; any 1<Qfactor<2 gives c3*q<1/2<b3*q. This is not an evaluation of actual c_n/b_n.','identification':'Original final field and same-sequence choice require the exact source bridge or external source theorem; physical actual n3 endpoint coefficient remains conditional.','release':'HOLD'}
 a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS exact interval rounding and energy constants; c_n/b_n identification remains conditional')
if __name__=='__main__':main()
