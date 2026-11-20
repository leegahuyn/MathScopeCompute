"""Exact raw Phi(4,0) enclosure via the original B_rho perturbation recurrence."""
import argparse
from fractions import Fraction as F
from hashlib import sha256
import json
from pathlib import Path


CORE = 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815'
PROFILE = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
EXPANDED = '797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7'
REACH = 'e7a22f8745f4c80bf72d165d6372b20043bab5b5e43d929f58807d42f115a295'


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def ceil(q):
    return -(-q.numerator//q.denominator)


def check(core, profile, expanded, reach):
    src = pinned(core,CORE).decode()
    profile_src = pinned(profile,PROFILE).decode()
    p = json.loads(profile_src.split('export const PINNED_N3 = ',1)[1].rstrip()[:-1])['parametersExactExpressions']
    for piece in (
        "D=G.sub(G.q(1,2),h),d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2)))",
        "invLambda=G.inv(Lambda),invL=G.inv(L),Us=G.add(G.mul(G.q(4),eta),j)",
        "const Hs=G.add(G.mul(D,eta),G.mul(d,Us)),Ws=G.sub(G.sub(G.one,G.mul(G.q(4),d)),G.mul(G.q(2),D,eta,Us))",
        "den=G.add(G.pow(Hs,2),G.pow(sigma,2)),chi=G.div(G.pow(Hs,2),den),zeta=G.neg(G.div(G.mul(L,Hs),den))",
        "const phi=[G.one],u=[G.zero]",
        "const avg=u.map((x,k)=>G.div(x,G.q(k+1)))",
        "Wcorr=avg.map(x=>G.sub(G.neg(G.mul(G.q(2),D,eta,x)),G.mul(d,G.derivative(x,eta))))",
        "const W=Wcorr.map((x,k)=>G.add(G.mul(invLambda,x),k===0?Ws:G.zero))",
        "U=u.map((x,k)=>G.add(G.mul(invLambda,x),k===0?Us:G.zero))",
        "Hc=u.map((x,k)=>G.add(G.mul(invLambda,d,x),k===0?Hs:G.zero))",
        "W[k],G.mul(h,G.sub(k===0?G.one:G.zero,G.mul(G.q(2),eta,U[k]))),G.mul(d,u[k],zeta)",
        "const r1=G.mul(invL,G.add(convolution(pref,phi,n),convolution(W,radialDot(phi),n),convolution(Hc,derivative(phi),n)))",
        "phi.push(G.div(G.add(G.neg(G.mul(chi,phi[n])),G.mul(invLambda,r1)),G.q(2*(n+1)*(n+2))))",
        "coefficientNormUpper:'Q',coefficientSpace:'Original B_rho with radial base 20'",
        "pointDomain:{Y:['0','41/10'],eta:['-1','1']}",
        "m!/(m+1)^2 * sum_(n>N) binom(n+m,m)*(n)_k*Y^(n-k)/(20^n*(n+1)^2)",
    ):
        assert piece in src,piece

    assert p['T'] == {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]} and p['Md']=={'integer':2**20}
    assert p['h'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
    assert p['j0'] == {'power':[{'ref':'h'},4]}
    assert p['sigmaStar'] == {'quotient':[{'ref':'j0'},{'integer':2000}]}
    assert p['Lambda'] == {'power':[{'ref':'Q'},64]}
    assert p['logP'] == {'product':[{'integer':2},{'ref':'T'}]}
    assert p['Pstar'] == {'exp':{'ref':'logP'}} and p['K'] == {'power':[{'ref':'Pstar'},2]}
    assert p['rho'] == {'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]}
    prods = p['Q']['quotient']
    assert int(prods[0]['product'][0]['integer']) == 2**260
    assert prods[0]['product'][1] == {'ref':'K'} and prods[1]=={'power':[{'ref':'sigmaStar'},2]}

    graph = json.loads(pinned(expanded,EXPANDED))
    assert graph['graphSHA256']=='7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2'
    live = json.loads(pinned(reach,REACH))
    assert live['calls']==graph['calls']
    assert any(x['id']==4468 and x['component']=='Phi' and x['y']==474 and
               x['k']==x['m']==0 for x in live['calls'])
    records = dict(graph['nodes'])
    assert records[4468] == {'op':'actual_natural_series','args':['Phi',474,2,0,0]}
    assert records[474] == {'op':'rational','args':['4','1']}
    assert records[2]['op']=='coordinate'

    # Constants in the exact analytic majorization for all real |eta|<=1
    # and source coefficient indices n>=0. The positive common 20^-n
    # coefficient factor and powers of Q are retained symbolically.
    u_star = 4+1
    h_star = F(1,2)+u_star
    w_star = 1+4+2*F(1,2)*u_star
    w_bound = int(w_star+2)
    u_bound = u_star+1
    h_bound = ceil(h_star+1)
    assert (w_bound,u_bound,h_bound)==(12,6,7)
    pref_constant = w_bound+1+2*u_bound
    assert pref_constant==25 and pref_constant<2**(2*260)
    assert ceil(h_star)<2**260 and 65536<2**260
    r1_bound_cost = 2*(2+w_bound+h_bound)
    assert r1_bound_cost==42<64
    y = F(5)
    first_difference = y/12
    second_difference = F(16)*y/(1-y/20)
    bound = second_difference/(1-first_difference)
    assert bound == F(1280,7) < 256
    deviation_bits = 61*260-8
    assert deviation_bits==15852

    # eta=0 gives H*=j0, sigmaStar=j0/2000. No floating-point parameter
    # evaluation is needed to compute the leading analytic profile.
    chi = F(2000**2,2000**2+1)
    y = F(4)
    term, partial, n = F(1),F(1),0
    while True:
        next_term = -term*chi*y/(2*(n+1)*(n+2))
        assert abs(next_term)<abs(term)
        if abs(next_term)<F(1,2**264):
            break
        partial += next_term
        term = next_term
        n += 1
    assert n < 64
    pad = F(1,2**264)
    assert F(1,2**deviation_bits) < pad
    lo = min(partial,partial+next_term)-pad
    hi = max(partial,partial+next_term)+pad
    grid_bits = 260
    grid = 2**grid_bits
    lower = (lo*grid).numerator//(lo*grid).denominator
    upper = ceil(hi*grid)
    assert F(lower,grid) <= lo <= hi <= F(upper,grid)
    assert upper-lower == 1 < 2**(grid_bits-256)
    return {
      'schema':'MathScope.Y.ActiveN3.OneRawPhiValueEnclosure/1',
      'status':'CONDITIONAL_RAW_ORIGINAL_PHI_AT_LITERAL_Y4_ETA0_ENCLOSED',
      'pins':{'core':CORE,'profile':PROFILE,'expandedGraph':EXPANDED,'reach':REACH},
      'originalSourceCall':4468,'literalYNode':474,'etaFormal':2,
      'fixedPoint':{'Y':4,'eta':0,'chi':str(chi)},
      'constantLedger':{'W':w_bound,'physicalU':u_bound,'Hc':h_bound,'pref_Q_squared':2,'R1_Q_cubed':64},
      'originalPhiVsRecurrenceBound':'|a(Y,eta)-b(Y,eta)| <= 256 Q^(-61) < 2^(-15852) for the original coefficient series on real 0<=Y<=5, |eta|<=1; 0<=Y<=41/10 is the runtime point domain',
      'bRecurrence':'b_0=1, b_(n+1)=-chi*b_n/(2(n+1)(n+2))',
      'pairedBSeriesDegree':n,
      'interval':{'lowerNumerator':str(lower),'upperNumerator':str(upper),'commonDenominator':'2^260',
                  'widthNumerator':upper-lower,'widthExact':'2^-260','widthUpper':'2^-256 (strict)'},
      'condition':'Original written A.21 pressure and same-datum B_rho coefficient norm for the ordinary natural realization, with the pinned original source profile.',
      'open':['Other physical points, u, average, eta derivatives, and complete original Y acceptance',
              'Proof of the original nonlinear datum theorem independent of the inherited premise'],
      'finalJets':0,'release':'HOLD',
    }


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('core','profile','expanded','reach','out'):
        p.add_argument(name,type=Path)
    a=p.parse_args()
    result=check(a.core,a.profile,a.expanded,a.reach)
    a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+'\n').encode())
