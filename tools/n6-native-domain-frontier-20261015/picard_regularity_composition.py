"""Consume the independent source gates for the actual Picard0 subkernel.

The mathematical proof is ACTUAL_PICARD_REGULARITY_KO.md. This consumer
checks its source bindings and premises; it is not a Lean kernel proof and
does not verify the historical numerical C1/K/tail constants.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

SYSTEM = 'c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
FIXED = 'c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
RAW = 'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'
MAJORANT = '4b94c652630c250f883622601d1d9d4998c412927fe3bc4352ba5e8c70e2fe3d'
NATURAL = 'c422952afe5886b5c2b873550a40fa756696f8502f11c27f2629687a4a7d943d'
B26 = 'a16fdf4842ae07925106706f1f4a1a3046ef6b1e091a10f01560a749863c4256'


def require(value, message):
    if not value:
        raise ValueError(message)


def all_true(mapping, names, message):
    require(all(mapping.get(name) is True for name in names), message)


def compose(d):
    domains, lineage, structure = d['domains'], d['lineage'], d['structure']
    natural, majorant, b26, identity, parity, leading = [d[key] for key in ('natural_binding', 'majorant', 'b26_binding', 'b26_identity', 'parity', 'leading_binding')]
    require(domains['sourceDefinitionSHA256'] == structure['sourceDefinitionSHA256'] == lineage['sourcePicardSHA256'] == parity['sourcePicardSHA256'] == SYSTEM, 'Different actual Picard definitions')
    require(domains['sourceFixedSHA256'] == lineage['sourceFixedSHA256'] == natural['fixedDefinitionSHA256'] == majorant['fixedDefinitionSHA256'] == FIXED, 'Different actual fixed definitions')
    require(domains['completeCoefficientNodes'] == structure['actualCoefficientAncestorNodes'] == parity['completeCoefficientNodes'] == 3679, 'Actual coefficient source coverage changed')
    require(domains['primitiveProofStates'] == 8384 and not domains['unprovedProofStates'] and not domains['unprovedPrimitiveDomains'], 'An original primitive/range premise is open')
    all_true(domains, ['allActualPicardNaturalDomainsProved', 'allCoefficientPrimitiveDomainsProved', 'coefficientEtaHolomorphyAtEachRealXiProved'], 'Domain theorem not completed')
    potential = set(domains['potentialNaturalCalls'])
    reached = set(domains['naturalCallIDsReachedInProvedContexts'])
    suppressed = set(domains['naturalCallIDsOnlyBehindProvedEmptyBranches'])
    require(len(potential) == 157 and len(reached) == 73 and len(suppressed) == 84 and not reached & suppressed and reached | suppressed == potential, 'Original all-157 lazy call coverage incomplete')
    require(lineage['reachableInterfaceCount'] == 36 and lineage['identicalBranchInterfaces'] == 18 and lineage['matchedDerivativeInterfaces'] == 18 and not lineage['unprovedDerivativeInterfaces'], 'Actual 36 interface coverage incomplete')
    all_true(lineage, ['allActualInterfaceLineagesProved', 'allBaseBranchesUseXiOnlyThroughXiSquared'], 'Actual derivative lineage not proved')
    require(lineage['baseJoins'] == {'F0': 25601, 'U0': 25638, 'v0': 25637}, 'Different actual base joins')
    all_true(natural, ['allActualCoreRootsEqual', 'fullActualPressureDefinitionEqual', 'fullActualOuterProgramEqual', 'fullActualSourceProfileEqual', 'sourceKernelBytesUnchanged', 'negativeControlPressureRootMutationRejected'], 'Natural original-source rebinding incomplete')
    require(natural['pressurePrimitiveAncestorCount'] == majorant['actualPressureASTVerification']['pressurePrimitiveAncestorCount'] == 287 and natural['pressurePrimitiveASTSHA256'] == majorant['actualPressureASTVerification']['pressurePrimitiveASTSHA256'] == '19a9eec59702f233d4744083aaef545f0d600d5549177ee8e8b3a143535c8152', 'Actual pressure theorem attached to different source ASTs')
    all_true(majorant['negativeControls'], ['omittedActualPressureDerivativeRejected', 'changedSourceLambdaRejected', 'missingInverseRadialPowerRejected'], 'Natural source controls incomplete')
    conclusion = majorant['derivedMathematicalConclusion']
    require(conclusion['actualPhiRealLower'] == '1/4 on 0<=Y<=41/10, eta in I' and conclusion['actualPhiComplexLower'] == '63/256 on real 0<=Y<=41/10, dist(eta,I)<=rho/(1024Q)', 'Actual Phi reciprocal theorem differs')
    require(b26['sourceSHA256'] == '7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3' and b26['diagnosticOverlap'] == 2377, 'Different actual B26 source binding')
    all_true(b26, ['sourceBytesUnchanged'], 'B26 producer source changed')
    all_true(b26['checks'], ['literalSourceP1AndNs', 'allFiveLiteralCoreMoments', 'referenceLeftNaturalBodies', 'referenceLeftNaturalMomentHistory', 'literalNegativeZetaSign', 'literalB26ControlsAndMiddleBodies'], 'Actual B26 equation/body binding incomplete')
    all_true(identity['exactChecks'], ['derivativeAngularConservationEquals2XTimesAngularODE', 'derivativeAxialConservationEqualsAxialODE', 'angularODEEqualsOriginalPhiRecurrence', 'axialODEEqualsOriginalURecurrence', 'HsZetaPlusLChiZeroWithoutDivisionByHs', 'actualP1RetainsSourceXFactor'], 'All-order matching conservation algebra incomplete')
    all_true(identity['negativeControls'], ['omittedXInSourceP1Rejected', 'changedZetaSignRejected'], 'Matching adverse controls incomplete')
    all_true(leading, ['sourceBytesUnchanged', 'originalCountsUnchanged'], 'Leading constructor source changed')
    require(leading['sourceSHA256'] == '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8'
            and leading['diagnosticOverlap'] > 0, 'Different original inner constructor source')
    all_true(leading['checks'], ['fullOriginalPicardDefinitionEqual', 'fixedCoreAndSourceEqual', 'actualF0NaturalAndB26Branches', 'actualU0NaturalAndB26Branches', 'actualV0CoreAverageAndCollarMoment', 'sourceLeadingAllFourXiSquaredSubstitutions', 'diagnosticOverlappingNodesEqual', 'referenceSubstitutionMutationRejected'], 'Actual base F0/U0/v0 constructor binding incomplete')
    require(leading['sourceLeading'] == {'F0': 25601, 'U0': 25638, 'v0': 25637, 'omega0OverX': 26393}, 'Actual leading body IDs differ')
    require(structure['sourceDiagonal'] == [0, 0, 2, 0, 3, 1] and len(structure['actualEtaIndependentStepCalls']) == 31 and structure['negativeControls']['successful'] is True and structure['negativeControls']['tests'] == 6, 'Original Picard integral/step structure incomplete')
    a1 = structure['sourceMatrixA1']
    require(all(not entry or (i in (4, 5) and j in (0, 1, 2, 3)) for i, row in enumerate(a1) for j, entry in enumerate(row)), 'Original derivative-loss mask no longer square-zero')
    require(parity['diagnosticsSHA256'] == RAW and parity['actualSolutionParity'] == [0, 0, 0, 0, 1, 1], 'Different actual reflection theorem')
    all_true(parity, ['sourceReflectionIdentitiesProved'], 'Actual parity identities unproved')
    require(len(parity['negativeControls']) == 2 and all(row['rejected'] is True for row in parity['negativeControls']), 'Parity adverse controls incomplete')
    return {'schema': 'MathScope.N6.ActualPicardRegularityComposition/1', 'actualPicardSHA256': SYSTEM, 'actualFixedSHA256': FIXED,
            'provedSubkernelConclusions': {
                'actualCoefficientCInfinityXiAndCommonEtaHolomorphy': True,
                'actualNaturalB26AllOrderMatchingAtXa': True,
                'all36ActualGuardInterfacesCovered': True,
                'actualPicardAllFixedMixedDerivativeNormalConvergence': True,
                'actualZeroAxisSingularODEViaRescaledIntegral': True,
                'actualSolutionParity': ['even', 'even', 'even', 'even', 'odd', 'odd'],
                'actualNativeEvenProfilesCInfinityOnZeroToASquared': True},
            'commonDomain': '0<=xi<=sqrt(Xa exp(t1/16)); eta in smaller compact subsets of dist(eta,[-33/32,33/32])<rho/(1024Q)',
            'proof': 'ACTUAL_PICARD_REGULARITY_KO.md',
            'numericC1KCertifiedTailBoundsProvedHere': False,
            'qualitativeConvergenceUsesFiniteCompactBounds': True,
            'wholeGOnJProved': False,
            'remainingWholeSourceGates': ['All other native domains', 'All original bands and higher source prefixes', 'Whole positive radial pressure interval J', 'Whole-loop/background positivity and reciprocal bounds'],
            'newOriginalGuardsDischarged': 0, 'newOriginalJetsDischarged': 0, 'newOriginalPDETermsDischarged': 0,
            'newLeanExecution': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    names = ['domains', 'lineage', 'structure', 'natural-binding', 'majorant', 'b26-binding', 'b26-identity', 'parity', 'leading-binding']
    for name in names:
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    data, bindings = {}, {}
    for name in names:
        key = name.replace('-', '_')
        raw = getattr(args, key).read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if key in {'majorant', 'natural_binding', 'b26_binding'}:
            require(digest == {'majorant': MAJORANT, 'natural_binding': NATURAL, 'b26_binding': B26}[key], 'Changed exact source evidence ' + name)
        data[key] = json.loads(raw)
        bindings[key] = {'sha256': digest, 'bytes': len(raw)}
    require(data['lineage']['domainPrerequisiteSHA256'] == bindings['domains']['sha256'], 'Derivative lineage used another range/interface premise')
    result = compose(data)
    result['inputBindings'] = bindings
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'actualPicardRegularityComposed': True, 'actualEvenProfilesComposed': True,
                      'numericTailBoundPromoted': False, 'wholeGPromoted': False, 'newDischarged': 0}))


if __name__ == '__main__':
    main()
