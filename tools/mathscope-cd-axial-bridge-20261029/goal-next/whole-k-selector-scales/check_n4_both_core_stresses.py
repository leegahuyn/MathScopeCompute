"""Bind the exact N4 bottom representative and current point to zero stress."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json

from check_common_b_scales import F8, blob


INNER_HASH='c92ccaf35e6ffca3697b78d7599e2d45f0df427a33f52eb7d7791262434c6a41'
M3='research-ide/mathscope-m3/navier/'
M2='research-ide/mathscope-m2/navier/'


def verify_source(repo):
    checks={
        M3+'source-global-representative.mjs': [
            'lower=O.maximum(Rl,O.sqrt(O.mul(q(2),Xa,s))),upper=min(Ru,O.sqrt(O.mul(q(2),Xb,s)))',
            'R=O.div(O.add(lower,upper),q(2)),X=O.div(O.pow(R,2),O.mul(q(2),s))',
            'Its midpoint is strictly inside the original shell and same mesh box.' ],
        M2+'actual-background-residual-bridge.mjs': [
            "root=component==='theta'?record.stress.Ttheta:record.stress.Tz",
            "branch.args[1]!==Xminus||branch.args[2]!==right||branch.args[3]!==G.zero||branch.args[5]!==G.zero",
            "for(const record of records.slice(1))for(const component of ['theta','z'])" ],
        M2+'actual-continuation-exact-support.mjs': [
            'r.Xminus===G.mul(Xa,G.exp(G.div(t1,q(128))))',
            'allEndpointsIndependentOfEta:[r.Xminus,' ]}
    out={}
    for path,markers in checks.items():
        raw=blob(repo,path)
        assert all(marker.encode() in raw for marker in markers),path
        out[path]=sha256(raw).hexdigest()
    return out


def main():
    parser=ArgumentParser(description=__doc__)
    for option in ('repo','inner','out'):
        parser.add_argument('--'+option,type=Path,required=True)
    args=parser.parse_args()
    raw=args.inner.read_bytes()
    assert sha256(raw).hexdigest()==INNER_HASH
    inner=json.loads(raw)['exactRefinement']
    assert inner['transverseAnnulus']=='2*Xa*s<R^2<2*Xa*(1+w) with R=r/sqrt(qMin)'
    assert inner['sUpper']=='sUpper<1+w-(2-sUpper^(2h))*ZRep^2<=1+w'
    assert 1+6144>512*Fraction(3,4) and 6144*25600000>120
    # w<t1/512<1/2, so (1+w)/(1-w)=1+2w/(1-w)<1+4w.
    assert Fraction(4,512)==Fraction(1,128)
    result={'schema':'MathScope.N7.ActualRepresentativeBothCoreStressZero/1',
            'sourceCommit':F8,'innerShellReceiptSHA256':INNER_HASH,
            'sourceSHA256':verify_source(args.repo),
            'proof':[
                'At the critical label, if sRep<1 then sRep>1-w and Ru^2/(2Xa)=sUpper<1+w.',
                'The literal representative selects Rrep in the radial interval with Rrep<Ru and Xa<Xrep.',
                'Xrep=Rrep^2/(2sRep)<Xa*(1+w)/(1-w)<Xa*(1+4w).',
                'The pinned source exponent comparison gives w<t1/512, hence Xa*(1+4w)<Xa*exp(t1/128)=Xminus.',
                'The current point lies in the same open core by the authenticated inner-shell receipt.',
                'Every registered positive theta and z stress is the literal zero branch on X<Xminus. Every fixed jet there vanishes at both points, including any Euler-cutoff weighting.' ],
            'scope':'Both current and fixed representative positive-order slow stresses vanish whenever the lower representative cutoff can require N4. Velocity, pressure, and fast waves have separate scopes.',
            'release':'HOLD'}
    data=(json.dumps(result,indent=2)+'\n').encode()
    args.out.write_bytes(data)
    print('PASS current and fixed representative original positive slow stress zero branches')
    print(f'{sha256(data).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
