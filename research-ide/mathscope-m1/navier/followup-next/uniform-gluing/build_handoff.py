#!/usr/bin/env python3
"""Record the exact domains, source binding, and remaining proof boundary."""
from pathlib import Path
import hashlib
import json
from fractions import Fraction as F

HERE=Path(__file__).resolve().parent
SC=HERE.parent/'source-coherence'


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    final_source=json.loads((SC/'uniform-source-debt-final.json').read_text())
    final_axis_path=SC/final_source['sourceFiles']['axisCertificate']['file']
    final_axis=json.loads(final_axis_path.read_text())
    c2=json.loads((HERE/'source-c2-moment-certificate.json').read_text())['results'][0]
    lam=F(final_axis['sourcePressureCertificate']['parametersExact']['lambda'])
    c2_lam=F(int(c2['sourceParameterLambda']['numerator']),int(c2['sourceParameterLambda']['denominator']))
    assert lam==c2_lam and c2['passed']
    c2binding={'schema':'MathScope.FinalSourceC2MapBinding/1',
       'sourceSHA256':sha(SC/'uniform-source-debt-final.json'),'axisSHA256':sha(final_axis_path),
       'continuousMapSHA256':sha(HERE/'source-c2-moment-certificate.json'),
       'lambdaExact':str(lam),'matched':True,
       'invariance':'After X=X0*x and Ktilde=Kphys*X0^(-1/2-lambda), the exact C2 moment map is independent of Kphys,X0,eta,PStar,j0,Lambda,C. Its nonconstant power exponents retain this exact lambda.',
       'certifiedNormalizedPatch':['8','16'],'actualPhysicalPatchLocationBound':False,
       'actualC12DiscrepancyBound':False,'originalN305Promoted':False,'originalN306Promoted':False}
    (HERE/'source-final-c2-map-binding.json').write_text(json.dumps(c2binding,indent=2)+'\n')
    pinned=[SC/'uniform-source-debt-small-j.json',SC/'source-axis-small-j-trial.json']
    pinned += [SC/'uniform-source-debt-final.json',SC/'source-axis-cone-refined.json',SC/'continuation-refinement.json']
    pinned += [HERE/name for name in ['uniform-moment-certificate.json',
         'source-bound-moment-inclusion.json','source-joining-rectangle-certificate.json',
         'source-c2-moment-certificate.json','source-joining-loop-certificate.json']]
    pinned += [HERE/name for name in ['source-final-bound-moment-inclusion.json',
         'source-final-joining-rectangle-certificate.json','source-final-joining-loop-certificate.json',
         'source-final-joining-slow-bounds.json','source-final-joining-frequency.json',
         'source-final-c2-map-binding.json']]
    frequency=json.loads((HERE/'source-final-joining-frequency.json').read_text())
    contract={
      'schema':'MathScope.SourceBindingContract/1',
      'sourceFiles':{p.name:{'sha256':sha(p),'relativePath':str(p.relative_to(HERE.parent))} for p in pinned},
      'sourceDefinition':{
         'primarySource':'source-coherence/uniform-source-debt-final.json',
         'previousSourcePreserved':'source-coherence/uniform-source-debt-small-j.json',
         'pressure':'A.21 at logP=14; exact datum Pi0 shared by all forward pressure integrals.',
         'axis':'The unique function-defined source fixed point with the selected Lambda, sigma, j0=1e-10 and the bound source logC.',
         'continuation':'Exact B.22/B.26 integrals, B.34 interpolation, and the unique continuous B.8 root.',
         'finiteArraysIdentified':False},
      'etaDomain':{'closed':['-1','1'],
         'physicalMap':'eta=z/q^D; q-z^2*q^(2h)=1-t; D=1/2-h',
         'physicalInterior':'All real z with t<1 map to |eta|<1.',
         'endpoints':'One-sided limits at t=1; no arbitrary extension to eta outside [-1,1] is asserted.',
         'source':'Equation (4.1), supplied paper pp.24-25'},
      'B8Contract':{
         'physicalRadius':'X=XR*x; XR=110*exp(10*(logC+14))',
         'reference':'E0=K(eta)*x^(1/10), U0=c(eta), K=exp(14)/(1+eta^2), c=4eta',
         'normalizedMomentOrder':['M/(XR*K)','(J-c*I)/(XR^(3/2)*K^2)',
                                 'I/(XR^(3/2)*K)','(S-2*c*M)/(XR*K^2)','Cp/K^2'],
         'actualDebtSource':'Only the pinned source-specific UAbsoluteUpper/EAbsoluteUpper and UEtaAbsoluteUpper/EEtaAbsoluteUpper bounds are admitted here.',
         'sourceC0AndC1Bound':True,'sourceC2Bound':True,
         'root':'Unique exact continuous polynomial root in source-final-bound-moment-inclusion.json; finite approximations are not substituted for that root.',
         'correctedRectangle':{'logx':['-8','-5'],'eta':['-1','1']},
         'momentPatch':'Five disjoint fixed supports in exp(-6)<x<exp(-5).',
         'tailIdentity':'After the patch, exact equality of M,I,J,S,Cp and the same Pi0 propagates by the forward integral definitions. It identifies Qs,Ns and pressure only with the same exact reference exterior.',
         'completeExteriorIdentityProved':False},
      'C1Contract':{
         'certifiedDomain':{'logx':['-8','-5'],'eta':['-1','1'],'phase':'R/Z'},
         'loopParameters':'Explicit source-final-joining-loop-certificate.json constants.',
         'proven':'Every phase of this rectangle has positive four-component cone gaps and exact prescribed shear mean.',
         'globalExtensionProved':False,'finiteFrequencySelected':False},
      'C12JoiningContribution':{
         'domain':frequency['domain'],
         'sameSourceSlowBounds':'source-final-joining-slow-bounds.json',
         'finiteFrequency':frequency['finiteFrequency'],
         'incomingMomentTolerance':frequency['incomingMomentTolerance'],
         'incomingMomentUnits':frequency['incomingMomentUnits'],
         'incomingDerivativeOrders':[0,1],
         'incomingBoundProved':False,
         'frequencyMeaning':'Only the joining contribution fits its tolerance. The actual incoming moment error remains open; no incoming value is injected.',
         'globalFiniteFrequencySelected':False},
      'C2Contract':{
         'lambdaExact':'7378697629483821/36893488147419103232',
         'profileOnActualReservedPatch':'U=0, E=Kphys(eta)*X^(-1/2-lambda); Kphys>0, X=X0*x.',
         'normalizedAmplitude':'Ktilde=Kphys*X0^(-1/2-lambda)',
         'normalizedMomentOrder':['M/(X0*Ktilde)','J/(X0^(3/2)*Ktilde^2)',
                                 'I/(X0^(3/2)*Ktilde)','S/(X0*Ktilde^2)','Cp/Ktilde^2'],
         'computedCoefficientPatch':'8<x<16, with exact certified continuous bump coefficients.',
         'physicalPatchLocationBound':False,'actualC12DebtBound':False,
         'requiredC12Quantities':[
             'Same source profile on the whole original I and admissible radial collars.',
             'Uniform loop slow radial derivatives and eta derivatives.',
             'Uniform original fields and cumulative moments through eta order two.',
             'Exact normalized C0/C1 moment discrepancy accumulated up to the actual source patch.',
             'One finite N satisfying all four cone inequalities and the source-lambda map inclusion radius.'],
         'tailIdentity':'Matching all five moments with identical Pi0 propagates the exact original exterior fields beyond the same physical patch.'},
      'remainingOriginalGates':{
         'N3-05':'Continuous maps and all-eta joining-root enclosure are computed. Full single-profile pressure/exterior binding and new analytic formal bridge remain.',
         'N3-06':'Whole joining rectangle relaxed cone, all-phase C1 loop, C2 slow bounds and a finite frequency for its generated contribution are computed. One compatible loop over the whole I, actual incoming C12 moments, source-wide cone preservation and actual source patch restoration remain.'},
      'rejectedPromotions':[
         'Different PStar, Lambda, amplitude or j0 treated as one witness without a new binding.',
         'Measured eta samples promoted to the closed eta interval.',
         'Gauss agreement promoted to an integral enclosure.',
         'An underflowed amplitude treated as exact zero.',
         'An arbitrary endpoint moment or caller-provided debt substituted for the source integral.',
         'A C1 loop margin promoted to a C12 field margin without its slow derivative and moment bounds.',
         'An analytic premise accepted as a new Lean axiom to claim formal completion.'],
      'subsequentOuterCandidateAudit':{
         'status':'ACTUAL_Md1_RELAXED_CONE_FAILURE',
         'sourceSHA256':sha(SC/'uniform-source-debt-final.json'),
         'independentEvidence':'outer-counterexample-independent.json',
         'independentEvidenceSHA256':sha(HERE/'outer-counterexample-independent.json'),
         'witness':'eta=3/4, local axial y=sqrt(e)-1',
         'necessaryConditionViolated':'Pc<0 whereas Pc>2 is required.',
         'globalCurrentDatumCandidateValid':False,
         'localCertificatesRemainWithinTheirStatedScope':True,
         'changedHistoricalSource':False},
      'originalN305Promoted':False,'originalN306Promoted':False,
    }
    (HERE/'source-binding-contract.json').write_text(json.dumps(contract,indent=2)+'\n')
    files=[p for p in sorted(HERE.iterdir()) if p.is_file() and p.name!='file-manifest.json']
    manifest={'schema':'MathScope.UniformGluingHandoffManifest/1',
              'files':[{'file':p.name,'sha256':sha(p),'bytes':p.stat().st_size} for p in files],
              'excluded':['file-manifest.json itself','__pycache__'],
              'originalSourceMutation':'None; original v54 files and acceptance criteria are preserved.',
              'originalN305Promoted':False,'originalN306Promoted':False}
    (HERE/'file-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'files':len(files),'manifestSHA256':sha(HERE/'file-manifest.json'),
                      'contractSHA256':sha(HERE/'source-binding-contract.json')},indent=2))


if __name__=='__main__':main()
