"""Check original pointwise chart support and the finite order-nine coefficient bound."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
from functools import cache
from math import comb, factorial
import json


SOURCE = '384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15'
CHART8 = 'f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5'
SELECTED = [(2,5,2),(1,6,2),(0,7,2)]


def main():
    assert __debug__
    cli = ArgumentParser(description=__doc__)
    for name in ('source','c8-chart-proof','out'):
        cli.add_argument('--'+name,type=Path,required=True)
    a = cli.parse_args()
    raw = a.source.read_bytes()
    assert sha256(raw).hexdigest() == SOURCE
    for marker in [
        '[G.zero,G.div(R,s),G.zero]',
        '[G.mul(q(2),eta,inverseD,inverseL),G.neg(G.mul(q(2),eta,X,inverseD,inverseL)),G.mul(d,inverseD,inverseL)]',
        '[G.div(inverseL,s),G.neg(G.div(G.mul(X,inverseL),s)),G.neg(G.div(G.mul(D,eta,inverseL),s))]',
        'alpha.findLastIndex(x=>x>0)',
        'put([...term.profileOrders],chart.derivative(term.coefficient,axis));',
        'put(beta,G.mul(term.coefficient,chart.coefficients[axis][j]));',
    ]:
        assert marker.encode() in raw
    old = a.c8_chart_proof.read_bytes()
    assert sha256(old).hexdigest() == CHART8
    inherited = json.loads(old)
    assert inherited['coefficientAtomBound'] == {'powerOfTwo':156,'powerOfH':13}
    assert inherited['coefficientRecurrenceBound'][-1] == {'order':8,'powerOfTwo':1516,'powerOfH':117}

    # Keep every Leibniz branch and ignore cancellations. These sets are
    # independent of the coefficient values and count an upper support.
    increments = ((1,), (0,1,2), (0,1,2))
    @cache
    def support(alpha):
        if not any(alpha):
            return frozenset({(0,0,0)})
        axis = max(j for j,x in enumerate(alpha) if x)
        parent = tuple(x-(j==axis) for j,x in enumerate(alpha))
        prior = support(parent)
        return prior | frozenset(
            tuple(x+(i==j) for i,x in enumerate(beta))
            for beta in prior for j in increments[axis]
        )

    # As in the original coefficient proof, primitive atom derivatives are
    # bounded through total order eleven. Every slow recurrence step spends
    # one derivative to differentiate a coefficient. Order nine leaves two.
    assert 6 * 2**11 < 2**14
    exponent_two = 156 + 9*(156+14)
    exponent_geometry = 13*(9+1)
    assert (exponent_two,exponent_geometry) == (1686,130)
    term_cap = comb(12,3)
    assert term_cap == 220 and 4*term_cap < 2**10
    rows = []
    for alpha in SELECTED:
        coeff = sorted(support(alpha))
        assert max(map(sum,coeff)) == 9 and len(coeff) <= term_cap
        rows.append({'ordinarySlowOrders':alpha,'profileUpperSupport':coeff,
                     'positiveProfileTermCap':len(coeff),
                     'leadingProfileTermCap':sum(profile[0]==0 for profile in coeff)})
    output = {'schema':'MathScope.N7.OriginalC9PointwiseCoordinateCoefficientBound/1',
              'sourceKernelSHA256':SOURCE,'originalC8CoefficientProofSHA256':CHART8,
              'originalSlowAxes':['R','Z','T'],'profileAxes':['Euler_s','X','eta'],
              'selectedOrders':rows,'maximumTermsAllDegreeNine':220,
              'coefficientPowerOfTwo':exponent_two,'coefficientPowerOfHc':exponent_geometry,
              'combinedPointwiseFactor':'2^1696*Hc^130',
              'pointwiseOnly':True,'fullDegreeNineFTCFacesProved':False}
    with a.out.open('x',encoding='utf8',newline='\n') as handle:
        json.dump(output,handle,indent=2)
        handle.write('\n')
    print('PASS original degree-nine chart recurrence and three pointwise support caps')


if __name__ == '__main__':
    main()
