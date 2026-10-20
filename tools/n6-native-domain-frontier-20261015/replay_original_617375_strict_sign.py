import hashlib,json
from pathlib import Path
from actual_background_jet_regularity import ConstantDomains,sha
b=Path(__file__).resolve().parent
raw=(b/'gate-results-38728776386/ACTUAL_BACKGROUND_26_JET_REGULARITY.json').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='bf2600e785d90a57e024d4b2857fc84a2ed01e1a011551455f99ced4b3a4ac2a'
prior=json.loads(raw);failure=prior['unprovedPrimitiveFrontier'];assert failure['coneComplete']
auxraw=(b/'gate-results-38728776386/ACTUAL_N1_AUXILIARY_NORM_BINDING.json').read_bytes()
assert hashlib.sha256(auxraw).hexdigest()=='655604fa64bcca61289e73359c5fbbdff7e948b868adc73b0529c85f6acf7b61'
aux=json.loads(auxraw);assert aux['fixedCoreAndSourceCompared'] and aux['originalActualPicardDefinitionCompared']
assert aux['sourceHeaderSHA256']==prior['sourceHeaderBinding']['sourceHeaderRecordSHA256']
assert prior['fixedDefinitionSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
parameters=aux['actualSourceParameterExpressions']
nodes={int(k):v for k,v in failure['smallOriginalPrimitiveCone'].items()}
engine=ConstantDomains(nodes.__getitem__,parameters)
value=engine.at(failure['node']);assert value.strict_positive
argument=nodes[failure['node']]['args'][0];assert engine.at(argument).strict_positive
out={'schema':'MathScope.N6.ActualStrictSignConeReplay/1','originalRun':'38728776386',
 'originalReceiptSHA256':hashlib.sha256(raw).hexdigest(),'literalRoot':failure['node'],
 'actualSourceConeComplete':True,'actualConeNodeCount':len(nodes),'actualConeSHA256':sha(failure['smallOriginalPrimitiveCone']),
 'actualSourceParameterExpressionsSHA256':sha(parameters),'parameterBindingSHA256':hashlib.sha256(auxraw).hexdigest(),
 'primitiveDenominatorRoot':argument,'denominatorStrictlyPositive':True,'inverseFiniteStrictlyPositive':True,
 'independentIdentity':'-max(-B/R^6,-B*R^10)=min(B/R^6,B*R^10)>0 for actual B=sqrt(1+(2/kappa)^2)>0,R=C12EnvelopeR>0',
 'genericStrictSignPropagationUsed':True,'originalNodeIDSpecificProofAtomUsed':False,
 'fullOriginalSelectorReplayCompletedHere':False,'newOriginalRowsDischarged':0}
(b/'actual_strict_sign_cone_replay.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(out))
