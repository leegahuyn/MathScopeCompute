"""Independent exact checks for original center energy scale cancellation."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


AXIS = '4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638'
FORCE = 'fbe6238fad746e69e18c640b937c5c3ff77dbae0c481c3fe52448b763ae698a7'
RADIAL = '0d67104a020f0e7b57cdbeabc4bade9d5401cbe795cdde9a7b0e60ce90cb8c5d'
EXTERIOR = 'c614a3a12ec8d9dcf5bd02235dd6227bb79969d372f345baad6aec471c127c2b'


def need(condition, label):
    if not condition:
        raise ValueError(label)


def read(path, expected=None):
    data = path.read_bytes()
    digest = sha256(data).hexdigest()
    need(expected is None or digest == expected, f'{path.name} SHA-256')
    return json.loads(data), digest


def compare_positive(left, right):
    """Exact comparison using exp(x)>x for x>0 and finite rational series."""
    def unpack(tree):
        depth = 0
        while set(tree) == {'exp'}:
            depth += 1
            tree = tree['exp']
        need(set(tree) == {'rational'}, 'positive endpoint comparison only')
        core = Q(tree['rational'])
        need(core > 0, 'positive inner exponential coordinate')
        return depth, core

    dl, l = unpack(left)
    dr, r = unpack(right)
    need(dr >= dl and l < 2*r and r >= 2 and dr > dl, 'strict favorable endpoint separation')
    need(1+r+r*r/2 > 2*r, 'positive Taylor terms prove exp(r)>2r')
    return {'removedCommonExpLayers': dl, 'rightRemainingExpLayers': dr-dl,
            'leftInnerCoordinate': str(l), 'rightInnerCoordinate': str(r)}


def main():
    p = ArgumentParser(description=__doc__)
    for name in ('axis','force','radial','exterior','sharp','out'):
        p.add_argument('--'+name, required=True, type=Path)
    a = p.parse_args()
    axis, _ = read(a.axis, AXIS)
    force, _ = read(a.force, FORCE)
    radial, _ = read(a.radial, RADIAL)
    exterior, _ = read(a.exterior, EXTERIOR)
    sharp, sharp_sha = read(a.sharp)
    need(sharp['pins']['axis'] == AXIS and sharp['pins']['force'] == FORCE
         and sharp['pins']['radial'] == RADIAL, 'same original operator operands')
    need(radial['ratio']=='S_R/S > 2^8192, with S the original moving heat energy scale'
         and radial['geometricHeatExteriorFullForceL1TimeL2SpaceSquaredOverS_R'][0]=='2^-20',
         'whole K inherits actual exterior force square lower')
    energy = Q(exterior['intervals']['both']['endpointEnergyOverScale'][1])
    need(exterior['dissipationWithTimeWeightOverScale']==['0','2^-8171']
         and 2*(energy+Q(1,2**8171))<4 and 4*2**22<2**8192,
         'the exterior LHS consumes strictly less than another quarter')
    proof = compare_positive(sharp['coreBudgetComparison']['centerLHSUpperDividedByTau0'],
                             sharp['coreBudgetComparison']['quarterExteriorRHSLowerDividedByTau0'])
    programs = force['originalOperators']['componentUpperPrograms']
    fields = axis['scalarIntervals']
    # Evaluate original homogeneities exactly at two rational h. Since
    # every exponent is affine in h, this uniquely determines it.
    basis = (Q(0), Q(1,17))
    seen = set()
    counts = {}
    for kind, rows in (('velocity',programs['velocity']),('gradient',[row for v in programs['gradient'] for row in v]),
                       ('force',programs['directForce'])):
        powers = set()
        for terms in rows:
            for term in terms:
                values=[]
                for h in basis:
                    A,D=Q(1,2)+h,Q(1,2)-h
                    exponent={'velocity':A,'gradient':A+Q(1,2),'force':A+1}[kind]
                    constants={'R':Q(1,2),'C_tau':-1,'C_z':-D,'C_zz':-2*D,
                               'C_zzz':-3*D,'C_z_tau':-D-1}
                    for factor in term['factors']:
                        if factor.startswith('I_'):
                            name=factor[2:]
                            seen.add(name)
                            field, indices=name.split('@')
                            i,j,k=map(int,indices.split(','))
                            need(fields[name]['LambdaPower']==str(i),'same exact radial jet power')
                            base={'a':A,'b':A+Q(1,2),'p_loc':2*A}[field]
                            exponent-=base+i+D*j+k
                        else:
                            exponent+=constants[factor]
                    values.append(exponent)
                alpha=2*values[0]
                beta=(values[1]-values[0])/basis[1]
                need(alpha.denominator==beta.denominator==1,'exact affine lattice')
                powers.add((int(alpha),int(beta)))
        counts[kind]={'terms':sum(len(row) for row in rows),'exactTauPowers':[list(x) for x in sorted(powers)]}
    need(len(seen)==sharp['boundScalarInputCount']==22,'exact original scalar inventory')
    need(all(alpha>=0 and (alpha or beta>=0) for kind in ('velocity','gradient')
             for alpha,beta in counts[kind]['exactTauPowers']),
         'no reciprocal tau power after normalizing energy and dissipation integrands')
    report={'status':'PASS_ORIGINAL_CENTER_BUDGET_AND_EXACT_AFFINE_NORMALIZATION',
            'sharpCenterSHA256':sharp_sha,'endpointProof':proof,'stencilHomogeneity':counts,
            'remainingAnnularLHS':'2(E_annular+D_annular)<=2^-21*S_R is sufficient for (10.13)',
            'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD'}
    raw=(json.dumps(report,indent=2)+'\n').encode()
    a.out.write_bytes(raw)
    print('PASS exact center budget order, 22 operands, and original stencil tau homogeneities')
    print(sha256(raw).hexdigest(),a.out.name)


if __name__=='__main__':
    main()
