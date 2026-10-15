"""Small synthetic importer controls; fixtures are not source proofs."""
import copy,unittest
from unittest.mock import patch
import picard_reuse_application_audit as audit
from native_domain_extract import sha

# Only original26 identity tuples are real; every proof witness below is a
# deliberately tiny synthetic parser fixture and cannot authenticate a graph.
TARGETS={
 622932:[(278,[622802]),(475,[622804]),(516,[622803]),(547,[622802,622802]),(742,[622802,635044]),(918,[622802,635045]),(1099,[622802,622806]),(1310,[622803,622803])],
 622933:[(435,[622803]),(1912,[622804]),(1975,[622802]),(2025,[622802,622802]),(2182,[622802,635044]),(2300,[622802,635045]),(2422,[622802,622806]),(2565,[622803,622803])],
 622934:[(268,[622802]),(465,[622804]),(506,[622803]),(537,[622802,622802]),(732,[622802,635044]),(908,[622802,635045]),(1088,[622802,622806]),(1300,[622803,622803])],
 622935:[(1344,[622802]),(2595,[622803])]}
REQUIREMENTS=[{'id':str(i),'status':'OPEN','quantifier':'unchanged fixture'} for i in range(14)]
GUARDS=['guard:'+str(i) for i in range(10)]

def fixture(proved=False):
 rows=[]
 for node,requests in TARGETS.items():
  index=688+node-622932;call=sha({'op':'actual_expression_partial','args':[index,[622802,622803,622804,622791],[0,0,0,0]]})
  for number,ordered in requests:
   zeros=[j for j in ordered if j not in [622802,622803,622804,622791]]
   rows.append({'id':'cartesian-result:'+str(number),'sourceNode':node,'sourceCallSHA256':call,'orderedSourceCoordinates':ordered,
    'registry':'expression:'+str(index),'absentSourceCoordinates':zeros,
    'partialTargetOrders':None if zeros else [ordered.count(j) for j in [622802,622803,622804,622791]],
    'exactDerivativeValue':'0' if zeros else 'same original registered ordinary partial, with original one-sided T=0 convention',
    'status':'PROVED' if proved else 'OPEN','actualFunctionDerivativeExistenceProved':proved,'originalOrderedRequestPreserved':True})
 original=[{k:r[k] for k in ['id','sourceNode','sourceCallSHA256','orderedSourceCoordinates']} for r in rows]
 original.extend({'id':'other:'+str(i),'sourceNode':i,'sourceCallSHA256':sha(i),'orderedSourceCoordinates':[2]} for i in range(204))
 binding={'schema':'MathScope.N6.SourceHeaderBinding/1','sourceHeaderRecordSHA256':audit.HEADER,
  'sourceHeaderCanonicalSHA256':audit.CANONICAL_HEADER,'detachedHeaderFileSHA256':audit.HEADER,
  'canonicalJSONEqual':True,'typeSensitiveComparison':True,'registryConsumedFrom':'source gzip first record'}
 count=26 if proved else 0;ids=[r['id'] for r in rows] if proved else []
 background={'schema':'MathScope.N6.ActualBackground26JetRegularity/1','sourceHeaderBinding':copy.deepcopy(binding),
  'originalSourceFiles':[{'path':p,'sha256':v} for p,v in audit.SOURCE_FILES.items()],
  'fixedDefinitionSHA256':audit.FIXED,'inputSHA256':{'matrix':audit.MATRIX},'rowClosureMode':'ALL26_OR_NONE',
  'actualOriginalBackgroundRows':rows,'provedOriginalBackgroundRowCount':count,'newOriginalJetsDischarged':count,
  'remainingOriginalJetCount':230-count,'actualSourceBodyProof':None,'unprovedBodyDomainGaps':['fixture primitive gap'],
  'unprovedPrimitiveFrontier':None,'wholeGOnJProved':False,'allInfiniteBandsEquivalenceClaimed':False,
  'newOriginalGuardsDischarged':0,'newOriginalPDETermsDischarged':0}
 matrix={'schema':'MathScope.N6.ActualBackground26RowContinuation/1','sourceHeaderBinding':copy.deepcopy(binding),
  'parentHistoricalMatrixSHA256':audit.MATRIX,**audit.SOURCE_PINS,
  'originalHistoricalMatrixUntouched':True,'originalUniversalRequirementsUnchanged':True,'originalPDECountUnchanged':True,
  'originalUniversalRequirements':copy.deepcopy(REQUIREMENTS),'remainingGlobalGuardIDs':GUARDS[:],
  'before':{'GlobalGuard':10,'CartesianJet':230,'PDE':1020,'total':1260},
  'after':{'GlobalGuard':10,'CartesianJet':230-count,'PDE':1020,'total':1260-count},'newDischargedGuardIDs':[],
  'newDischargedJetIDs':ids,'newDischarged':{'GlobalGuard':0,'CartesianJet':count,'PDE':0},
  'remainingJetIDs':[r['id'] for r in original if r['id'] not in ids],
  'allOriginal1266Closed':False,'wholeFunctionRegularityProved':False,'allBandsInfiniteBackgroundEqualityProved':False}
 definitions={}
 if proved:
  ledger=[]
  for index in sorted(audit.BODIES):
   body,pin=audit.BODY_PINS.get(index,(622870,sha('synthetic unused683')))
   row={'definition':index,'body':body,'definitionSHA256':pin}
   if index in audit.HELPERS:row.update(normalizedDefinition=audit.HELPERS[index],literalActualChartAndMultiplierCompared=True)
   else:row['literalCompleteFiniteN1FormulaCompared']=True
   ledger.append(row)
   if index!=683:definitions['expression:'+str(index)]={'body':body,'definitionSHA256':pin}
  primitive={'schema':'MathScope.N6.ActualBackgroundPrimitiveClosure/1','completeActualClosure':True,
   'bodyRootsAndDefinitionHashes':[{k:r[k] for k in ['definition','body','definitionSHA256']} for r in ledger],
   'visitedSourceIDsSHA256':sha([1,2]),'actualPrimitiveDomainChecks':[{'fixture':'positive actual operand','proved':True}],
   'nativeBoundaryCalls':[{'fixture':'same admitted coordinates','sameApprovedContractAndTuple':True}],
   'approvedBoundaryRoots':[{'sourceRoot':i} for i in [3451,9239,617466]],
   'actualCutoffBranchAudits':[{'allThreeActualBranchesScopedAndChecked':True,'originalFlatEndpointExponentialProofRetained':True}],
   'actualCpIntegralAudits':[{'allActualIntegrandPrimitivesChecked':True,'finiteContinuousIntegralWithMovingUpperEndpoint':True}],
   'actualChartDefinitionSHA256':audit.CHART,'allOperandsCheckedBeforeAlgebraicCancellation':True,
   'allActualNativeTuplesChecked':True,'allConditionalBranchesAuditedOnTheirOwnDomains':True,
   'everyDefinitionRestrictedToItsOwnFormalParameters':True,'everyActualFreeCoordinateBoundByDefinitionParameterScope':True,
   'perBodyParameterScopes':[{'definition':i,'parameters':[617438,4756,2] if i<688 else [622802,622803,622804,622791],
    'initialEnvironmentCoordinates':sorted([617438,4756,2] if i<688 else [622802,622803,622804,622791])} for i in sorted(audit.BODIES)],'unprovedFrontier':[]}
  background['actualSourceBodyProof']={'allNormalizedAndPhysicalBodiesCompared':True,'allBodyPrimitiveDomainsChecked':True,
   'finiteN1Only':True,'infiniteBackgroundEqualityClaimed':False,'bodyLineages':ledger,
   'actualChart':dict.fromkeys(['actualEquationAndCoordinatesCompared','positiveSInOriginalInterval',
    'physicalTNonnegativeImpliesAbsEtaAtMostOne','strictPositiveTImpliesAbsEtaLessThanOne','noNegativeTClaim'],True)|{'definitionSHA256':audit.CHART,'etaIdentity':'T_physical=s*(1-eta^2)'},
   'cutoff':{'definition':680,'body':622845,'actualFlatBodyCompared':True,'allOrdersAtEndpoints':'fixture flat proof'},
   'leadingCp':{'definition':677,'body':617755,'exactFiniteIntegralOfSameF0Squared':True,'movingEndpointAndAxisCoveredByActualLeadingCInfinity':True},
   'selector':{'actualScaleRoot':617466,'finiteStrictlyPositive':True,'constantAncestorCount':2,
    'constantSourceIDSetSHA256':sha([1,2]),'allConstantPrimitiveDomains':[{'fixture':'finite positive'}]},
   'actualPrimitiveClosureAudit':primitive}
  background['unprovedBodyDomainGaps']=[]
 return background,matrix,original,definitions

class ProofReuseAdverseControls(unittest.TestCase):
 def setUp(self):
  self.patches=[patch.object(audit,'UNIVERSAL',sha(REQUIREMENTS)),patch.object(audit,'GUARDS',sha(GUARDS))]
  for p in self.patches:p.start();self.addCleanup(p.stop)
 def apply(self,f):
  b,m,o,d=f;return audit.background_proved_ids(b,m,o,native_definitions=d)
 def reject(self,mutate,proved=True):
  f=fixture(proved);mutate(*f)
  with self.assertRaises((ValueError,KeyError,TypeError)):self.apply(f)
 def test_unproved_primitive_leaves_exact_original26_open(self):self.assertEqual(self.apply(fixture()),set())
 def test_full_witness_fixture_parser_accepts_exact26_only(self):
  f=fixture(True);self.assertEqual(self.apply(f),{r['id'] for r in f[0]['actualOriginalBackgroundRows']})
 def test_arbitrary_nonempty_body_dictionary_rejected(self):
  self.reject(lambda b,m,o,d:b.update(actualSourceBodyProof={'sameActualBodies':True}))
 def test_count_only_cannot_replace_actual_primitive_walk(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof'].pop('actualPrimitiveClosureAudit'))
 def test_unknown_uncancelled_primitive_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit'].update(unprovedFrontier=[{'op':'inverse','operand':0}]))
 def test_primitive_walk_missing_ninth_body_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['bodyRootsAndDefinitionHashes'].pop())
 def test_actual_free_coordinate_scope_flag_required(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit'].update(everyActualFreeCoordinateBoundByDefinitionParameterScope=False))
 def test_normalized_environment_cannot_include_rogue_R(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['perBodyParameterScopes'][0]['initialEnvironmentCoordinates'].append(622802))
 def test_physical_environment_cannot_include_formal_X(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['perBodyParameterScopes'][-1]['initialEnvironmentCoordinates'].append(4756))
 def test_parameter_scope_ledger_cannot_omit_a_body(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['perBodyParameterScopes'].pop())
 def test_actual_formal_parameter_order_preserved(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['perBodyParameterScopes'][0]['parameters'].reverse())
 def test_empty_body_environment_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['perBodyParameterScopes'][0].update(initialEnvironmentCoordinates=[]))
 def test_operand_first_walk_flag_required(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit'].update(allOperandsCheckedBeforeAlgebraicCancellation=False))
 def test_unproved_actual_primitive_entry_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['actualPrimitiveDomainChecks'][0].update(proved=False))
 def test_wrong_approved_boundary_root_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['approvedBoundaryRoots'][1].update(sourceRoot=999))
 def test_wrong_actual_chart_walk_hash_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit'].update(actualChartDefinitionSHA256='0'*64))
 def test_cutoff_lazy_scope_flag_required(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['actualCutoffBranchAudits'][0].update(allThreeActualBranchesScopedAndChecked=False))
 def test_actual_cp_integrand_scope_flag_required(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['actualCpIntegralAudits'][0].update(allActualIntegrandPrimitivesChecked=False))
 def test_unchecked_native_boundary_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualPrimitiveClosureAudit']['nativeBoundaryCalls'][0].update(sameApprovedContractAndTuple=False))
 def test_original_source_domain_file_hash_required(self):
  self.reject(lambda b,m,o,d:b['originalSourceFiles'][0].update(sha256='0'*64))
 def test_one_body_hash_substitution_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['bodyLineages'][0].update(definitionSHA256='0'*64))
 def test_missing_unused683_body_rejected(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof'].update(bodyLineages=[r for r in b['actualSourceBodyProof']['bodyLineages'] if r['definition']!=683]))
 def test_consumer_registry_disagreement_rejected(self):
  self.reject(lambda b,m,o,d:d['expression:684'].update(body=99))
 def test_different_twenty_six_original_rows_rejected(self):
  def mutate(b,m,o,d):
   b['actualOriginalBackgroundRows'][0]['id']='other:0'
  self.reject(mutate)
 def test_ordered_request_cannot_be_swapped(self):
  self.reject(lambda b,m,o,d:b['actualOriginalBackgroundRows'][3].update(orderedSourceCoordinates=[622803,622802]))
 def test_duplicate_row_cannot_count_as_twenty_six(self):
  self.reject(lambda b,m,o,d:b['actualOriginalBackgroundRows'].__setitem__(1,copy.deepcopy(b['actualOriginalBackgroundRows'][0])))
 def test_absent_coordinate_still_requires_earlier_derivative(self):
  self.reject(lambda b,m,o,d:b['actualOriginalBackgroundRows'][4].update(actualFunctionDerivativeExistenceProved=False))
 def test_absent_target_cannot_be_replaced_by_native_zero(self):
  self.reject(lambda b,m,o,d:b['actualOriginalBackgroundRows'][4].update(partialTargetOrders=[0,0,0,0]))
 def test_fresh_header_type_sensitive_flag_must_be_boolean(self):
  self.reject(lambda b,m,o,d:b['sourceHeaderBinding'].update(typeSensitiveComparison=1))
 def test_changed_historical_matrix_pin_rejected(self):
  self.reject(lambda b,m,o,d:m.update(parentHistoricalMatrixSHA256='0'*64))
 def test_changed_fixed_definition_rejected(self):
  self.reject(lambda b,m,o,d:b.update(fixedDefinitionSHA256='0'*64))
 def test_reduced_universal_quantifier_rejected_despite_true_flag(self):
  self.reject(lambda b,m,o,d:m['originalUniversalRequirements'][0].update(quantifier='only a finite grid'))
 def test_pde_cannot_be_closed_by_picard_norm(self):
  self.reject(lambda b,m,o,d:m['after'].update(PDE=0))
 def test_guard_ids_cannot_be_substituted(self):
  self.reject(lambda b,m,o,d:m['remainingGlobalGuardIDs'].__setitem__(0,'different guard'))
 def test_guard_cannot_be_closed_by_picard_norm(self):
  self.reject(lambda b,m,o,d:m.update(newDischargedGuardIDs=['g:0']))
 def test_remaining204_ids_cannot_be_reordered(self):
  self.reject(lambda b,m,o,d:m['remainingJetIDs'].reverse())
 def test_physical_negative_time_scope_cannot_be_claimed(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['actualChart'].update(noNegativeTClaim=False))
 def test_cp_integral_domain_premise_required(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['leadingCp'].update(movingEndpointAndAxisCoveredByActualLeadingCInfinity=False))
 def test_selector_full_ancestor_domains_required(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof']['selector'].update(allConstantPrimitiveDomains=[]))
 def test_infinite_background_equality_not_imported(self):
  self.reject(lambda b,m,o,d:b['actualSourceBodyProof'].update(infiniteBackgroundEqualityClaimed=True))
 def test_open_body_gap_cannot_close26(self):
  self.reject(lambda b,m,o,d:b.update(unprovedBodyDomainGaps=['fixture gap']))

if __name__=='__main__':unittest.main()
