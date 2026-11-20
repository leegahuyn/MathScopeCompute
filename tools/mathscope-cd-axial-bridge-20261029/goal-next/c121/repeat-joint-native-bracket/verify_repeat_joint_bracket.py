"""Exact joint native-bracket and source argument routing for Repeat."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


GOAL = Path('work/goal-next')
M3 = GOAL/'continuation101/axial-budget/runtime/research-ide/mathscope-m3/navier'
REPO_EVIDENCE = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
PINS = {
    'C109': (GOAL/'continuation109/k1-domain-audit/final/fixed-n3-domain.json','df338897da4078df56cf8632d4f10a605bdfa16e02a1a331381e389bf5dc8738'),
    'C120': (GOAL/'continuation120/whole-k-order-support/final/whole-k-order-support.json','4d9c3154390b57f5ac498ef90dbce34d22ae45171a830cfb70a8a3af5a67bd46'),
    'eikonal': (GOAL/'continuation121/repeat-reference-background/repeat-reference-background.json','7f4db7e44f838f60e0ae27e9df8cbdd67fe6c41b154ea2dad11a810399ea079f'),
    'band': (M3/'source-global-band.mjs','a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b'),
    'current': (M3/'source-global-current.mjs','b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36'),
    'pressureCover': (M3/'source-global-pressure.mjs','c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4'),
    'initialized': (M3/'source-initialized-angular.mjs','4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e'),
    'forced': (M3/'source-global-forced-current.mjs','1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3'),
    'repeat': (REPO_EVIDENCE/'primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/pinned-original/source-postfive-repeat-forced.mjs',
               '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7'),
}
ANCHORS = {
    'band':('left:q(1,2),right:q(2),derivativeLower:q(1,2)',
            'X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s)'),
    'current': ('parameters=[R,Z,T,xi,v,Xrep,etaRep,sRep,ell,...band.meshLabels],localParameters=[R,Z,T,ell,...band.meshLabels]',
        'guards are formed from that chart\'s valid q BEFORE any local body/root',
        'bandOffset=G.sub(partition.bandCoordinate,label.ell)',
        'guards=[[band.chart.X,G.parameter(\'Xa\'),band.chart.Xb],...meshOffsets.map(x=>[x,G.neg(radius),radius]),[bandOffset,G.neg(radius),radius]]'),
    'pressureCover':('parameters=[R,Z,T,ell,...Y],directions=[R,Z,T,...Y]',
        'meshOffsets=b.meshCoordinates.map((x,j)=>G.sub(x,label.grid[j])),bandOffset=G.sub(assembly.partition.bandCoordinate,label.ell)',
        'guards=[[band.chart.X,G.parameter(\'Xa\'),band.chart.Xb],...meshOffsets.map(x=>[x,G.neg(radius),radius]),[bandOffset,G.neg(radius),radius]]'),
    'initialized': ("ellReference=G.fresh('initialized_angular_reference_band')",
        'parameters=[...current.local.localParameters,ellReference,...Y,...center,...copy,theta]',
        'ratio=G.exp(G.mul(G.sub(ell,ellReference),G.log(G.q(2))))',
        'referenceValues=[G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y]',
        'G.expressionValue(id,referenceValues)',
        'values=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...localParameters.slice(3)]',
        'const values=[R,Z,T,row.label.ell,...row.label.grid,ell,...Y',
        'coefficient:G.one,guards:row.guards'),
    'forced': ('referenceValues=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...parameters.slice(3)]',
        'const values=[R,Z,T,row.label.ell,...row.label.grid,ell,...pressure.geometry.Y',
        'coefficient:G.one,guards:row.guards'),
    'repeat': ('G.expressionValue(system, initial.reference.values)',
        'const rowMap = ({ values, guards, derivativeMaps, coefficient, label })',
        'const fields = coverBindings(G, forced, signed)',
        'const templates = forced.templates.map(template =>',
        'assert.equal(templates.length, 10)',
        'const guarded = guardGlobalLocalBody(G, current.geometry, current.local.slowCutoff, rectangular, { auxiliary: false })',
        'const mapped = G.simultaneousSubstitute(shared, Y, Hw)',
        'assert.equal(systems.length, 40)',
        'completeSecondForcedState: false'),
}


def digest(raw):
    return sha256(raw).hexdigest()


def bind(root):
    data={}
    for label,(rel,expected) in PINS.items():
        raw=(root/rel).read_bytes()
        assert digest(raw)==expected,(label,rel)
        data[label]=json.loads(raw) if rel.suffix=='.json' else raw.decode()
    locations={}
    for label,keys in ANCHORS.items():
        locations[label]=[[data[label][:data[label].index(key)].count('\n')+1,key] for key in keys]
    assert 'definePeriodicIndexedField(' not in data['repeat']
    assert 'defineGlobalIndexedField(' not in data['repeat']
    return data,locations


def joint_math():
    rows=[]
    for delta in range(-3,4):
        b=Q(2)**delta
        left,right=max(Q(1,2),b/2),min(Q(2),2*b)
        u_left,u_right=max(-Q(3,4),-1-delta),min(Q(3,4),1-delta)
        rows.append({'ownMinusReference':delta,'b':str(b),
            'closedNativeS':[str(left),str(right)] if left<=right else None,
            'strictNativeS':[str(left),str(right)] if left<right else None,
            'strictJointWithOwnPositiveLogOffset':[str(u_left),str(u_right)] if u_left<u_right else None})
    assert [x['ownMinusReference'] for x in rows if x['strictNativeS']]==[-1,0,1]
    assert [x['ownMinusReference'] for x in rows if x['closedNativeS']]==[-2,-1,0,1,2]
    assert [x['strictJointWithOwnPositiveLogOffset'] for x in rows if x['strictNativeS']]==[['0','3/4'],['-3/4','3/4'],['-3/4','0']]
    # Exact rational own positive and invalid reference, both available labels.
    local_s,b=Q(3,4),Q(2)
    assert (1/local_s)**4<2**3
    assert local_s/b==Q(3,8)<Q(1,2)
    assert Q(1,2)<local_s<1
    # X=1 is inside the original active shell; r^2=2q is on the spatial
    # localization plateau since q=(3/4)tau0, tau0=qBig/32 and qBig<1.
    assert 2*local_s/32<Q(1,4)
    # Strict admission with an inactive *reference partition* is legal.
    ref=Q(9,16)
    assert (1/ref)**4>2**3 and ref>Q(1,2)
    assert (2*ref)**4<2**3 and 2*ref<2
    # The exact exponent identity for the reindexed native chart.
    D,h=(Q(1,2),-1),(0,1)
    assert tuple(2*x+2*y for x,y in zip(D,h))==(1,0)
    assert Q(15,32)<Q(1,2)<Q(15,16)
    assert Q(15,16)**4>Q(1,8)
    assert Q(15,16)**4<8
    return rows


def main(root,band_controls):
    src,locations=bind(root)
    raw=band_controls.read_bytes()
    controls=json.loads(raw)
    assert controls['sourceSHA256']=='a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f'
    assert [r['localLogOffset'] for r in controls['inputs']]==['1/2','0','-1/8','-1/2','3/4','-3/4']
    assert all([x['label'] for x in r['call']['rows']]==r['active'] for r in controls['inputs'])
    c109=src['C109']
    c120=src['C120']
    eik=src['eikonal']
    assert c109['fixedSlab']['positiveRelativeLabels']==[-1,0,1]
    assert c109['actualRows']['guardPredicatesPerRow']==5 and c109['actualRows']['guardedRows']==162
    assert c109['actualRows']['matchingGaugeForcedSignedFieldComponents']==9
    assert c120['registeredK']['physicalTauOverTau0']==['1/2','1']
    assert c120['registeredK']['normalizedQBracket']==['1/2','25/16']
    assert c120['registration']['sourceN0ThroughN3EllWindowsRelativeToEllMinimum'][2]==[14,14]
    assert c120['registration']['sourceN0ThroughN3EllWindowsRelativeToEllMinimum'][3]==[15,15]
    assert c120['auxiliaryWiderTime']['axisWitness']['Q']=='15/32'
    assert c120['auxiliaryWiderTime']['sameBoxRepresentativeOmission']['noPossibleN5AtSuchFrozenPoints']
    assert eik['referenceMap']['s']=='s/ratio'
    rows=joint_math()
    return {
      'schema':'MathScope.C121.OriginalRepeatJointNativeBracket/1',
      'pins':{k:v[1] for k,v in PINS.items()},'bandControlsSHA256':digest(raw),'sourceAnchors':locations,
      'exactGuard':{'definition':'b=Q_ref/Q_own=2^(ell_own-ell_ref)>0; s=q/Q_own',
        'strictS':'max(1/2,b/2)<s<min(2,2b)',
        'closedS':'max(1/2,b/2)<=s<=min(2,2b)',
        'strictPhysicalLog':'max(ell_own,ell_ref)-1<t<min(ell_own,ell_ref)+1, t=-log2(q)',
        'ownPositiveBand':'abs(t-ell_own)<3/4',
        'minimumAdditionalStrictGivenOwnPositive':'abs(t-ell_ref)<1',
        'canCheckBeforeBothNativeCalls':'Given monotone own chart, F(L)<0<F(U) for L and U the strict intersection endpoints, F(x)=x-Z^2*x^(2h)-T. Prefer already admitted reference q plus own positivity in source atlas.',
        'closedEqualityIsTraceOrRequiresOrdinaryExtension':True,
        'dyadicRows':rows},
      'counterexample':{'minimumAbsoluteLabelDifference':1,'ownRelativeEll':15,'attemptedReferenceRelativeEll':14,
        'rho':'3/4','eta':'0','X':'1','qOverTau0':'3/4','b':'2','sOwn':'3/4','sReference':'3/8',
        'bothLabelsHaveOriginalCoefficientWindow':True,'ownBandStrictlyPositive':True,'sameSpatialKAndTimeSlab':True,
        'observedLiveRepeatFailure':False},
      'admissibleWithoutPositiveReferencePartition':{'sRef':'9/16','sOwn':'9/8','b':'2',
        'referenceStrictNative':True,'referenceOwnPartitionInactive':True,'ownBandStrictlyPositive':True},
      'originalRouting':{'currentFixedLocalParameters':['R','Z','T','ell_own','meshR','meshZ','meshT'],
        'firstStageIndexedArgumentOwnLabel':3,'firstStageIndexedArgumentReferenceLabel':7,
        'regularizedReturn':'Indexed wrapper scales (R,Z,T) by (sqrt(b),b^D,b). Initialized referenceValues reciprocally undo precisely that transform.',
        'positiveBandTestUsesAlreadyValidReferenceQ':True,'storedRepeatMeanBodySameInitialReferenceValues':True,
        'RepeatSourceCoverBindingsCompareFirstStageRows':True,
        'RepeatNativeInverseCandidateTemplates':10,'RepeatCandidateInverses':40,
        'RepeatModuleConstructsFreshIndexedRegistration':False,
        'actualRepeatActiveRowArgumentAndGuardInheritance':'OPEN_PENDING_ACTIVE_APPEND_METADATA'},
      'registeredK':{'oldReferenceRelativeEll':15,'ordinaryReferenceStrictExceptLowerCenter':True,
        'lowerCenter':{'rho':'1/2','sigma':'0','sRef':'1/2','sOwn':'1','relativeOwnLabel':1},
        'auxiliaryAxisOldReferenceFailure':{'rho':'15/32','sigma':'0','sRef':'15/32','sOwn':'15/16','relativeOwnLabel':1},
        'sourceAdmissibleReferenceCandidate':'Use N4 C+16 at Q=q/tau0<1, and N3 C+15 at Q>=1. Reference s lies strictly within the native bracket. Same primitive/reference/register instantiation must be independently bound.',
        'individualBranchTailAndFrozenMarginSource':'C120', 'automaticPerApplicationReindexingClaimed':False},
      'conclusion':'Both positive partition tests are sufficient. Own positive partition alone does not imply reference admission. Original assembled outer reference admission plus its exact reindex map is sufficient for the chart bracket only.',
      'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    p=ArgumentParser(description=__doc__)
    p.add_argument('--workspace',type=Path,required=True)
    p.add_argument('--band-controls',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    opts=p.parse_args()
    with opts.out.open('xb') as out:
        out.write((json.dumps(main(opts.workspace,opts.band_controls),indent=2)+'\n').encode())
    print('PASS exact joint native guard, in-K dyadic counterexample, and source-versus-candidate registration distinction')
