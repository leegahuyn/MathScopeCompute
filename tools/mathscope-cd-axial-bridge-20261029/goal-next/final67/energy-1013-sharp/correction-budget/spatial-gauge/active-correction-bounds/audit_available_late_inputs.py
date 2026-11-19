"""Prevent archived partial coefficient receipts from masquerading as full K1."""
from pathlib import Path
from hashlib import sha256
import json,sys
if not __debug__:raise RuntimeError('Do not disable proof assertions.')
assert len(sys.argv)==3
goal,output=map(Path,sys.argv[1:]);assert not output.exists()
def read(relative,pin):
    data=(goal/relative).read_bytes();assert sha256(data).hexdigest()==pin
    return json.loads(data)
mode2pin='e2bf09b924c42fa444029ac6ef41cb1fc86094bb65130c522c30e19e457f6be4'
mode2=read('first-forced-mode-two-c1/mode-two-weighted-c1.json',mode2pin)
jetpin='2c8678846733278b25357d6d15057d78db8072ca768f2f104bdae018cc2a0193'
jets=read('first-forced-mode-two-jets/mode-two-selected-jets.json',jetpin)
mode1pin='eaeaa75f1858db93822c98f00e0dc50ce98dffc8202986106e5bd3a7ba7c113c'
mode1=read('primary-forced-weights/weighted-mode-one.json',mode1pin)
assert mode2['scope']['archivedModeTwoOnly'] is True
assert jets['scope']['slowSlowOrPulseThird'] is False
assert jets['scope']['physicalWholeKAttachment'] is False
assert mode1['notAFullWAlphaCertification'] is True
result={'status':'OPEN_COMPLETE_FIRST_CORRECTION_SPATIAL_MAXIMA_DESPITE_PARTIAL_COEFFICIENT_RECEIPTS',
 'pins':{'modeTwoC1':mode2pin,'modeTwoSelectedJets':jetpin,'modeOneInteraction':mode1pin},
 'existingCoverage':{'modeTwoC1':mode2['scope'],'modeTwoSelectedJets':jets['scope'],
                     'modeOneInteractionOpen':mode1['open']},
 'smallestSufficientNumericInput':'One uniform positive K1 bounding all five actual weighted physical norm groups A[0,1,2],Bvector[0,1] over the whole original slab and all original labels/guards/seams.',
 'equivalentUncompressedInput':'Thirty physical spatial A atom endpoints plus scalar b,b_s,b_z endpoints from the source-bound first-correction gauge, with their whole-domain transport and component weights.',
 'whyExistingInputsDoNotSupplyIt':[
   'Mode-two is only one harmonic subset of the Forced map. The complete first increment includes Forced mode1/mode2, Signed, Temporal, and FiveMap pieces.',
   'Selected mode-two jets explicitly omit ordinary slow-slow second derivatives and physical whole-K attachment.',
   'The mode-one interaction receipt is not a full supported-source or complete Forced-output class bound.',
   'Initialized mean/wave energy receipts do not bound the later post-Signed Temporal psi4454155 and FiveMap psi4455164 merely by sharing source ancestry.',
   'The existing first-correction33 spatial symbolic roots are explicitN1/interior expressions, not uniform evaluated extrema over every original chart and flat seam.'],
 'laterStages':'K2,K3,K4 additionally require their authentic completed predecessors and emitted original gauge operands; mathematical operator f_* identifiers do not themselves provide executable SourceExpression norms.',
 'N706':'OPEN','N805':'OPEN','actualStageBoundsVerified':0,'finalJets':0,'release':'HOLD'}
output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'status':result['status'],'actualStageBoundsVerified':0}))
