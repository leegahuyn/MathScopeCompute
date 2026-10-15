"""Qualitative finiteness of same-source leading/order-one native partials.

This optional ConstantDomains handler is enabled only after the background
producer composes the unchanged completed-leading/order-one receipts. It
proves continuity and finite values on the actual finite integration box,
including X=0 and inward eta endpoint jets. It gives no sign, size, norm,
Bnorm, solutionNorm, tail, n2 or whole-background estimate.
"""
import hashlib,json

class ProfileConstantGap(ValueError):pass

def need(ok,message):
 if not ok:raise ProfileConstantGap(message)

def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
PROFILE_PINS={
 2:'28e70833b412b788177c0cdf4fe7275d44ac871ae425cdca719df3e5e99620b0',
 3:'ca70f862e648df8bcfa54dfa99f014d82a44df15f8c1cce1c55292d12df113ac',
 4:'f26c35792fa436ad93a1df59737d94672062032856fa3827cf89404ececaebe7',
 5:'f928aca814dd9675ce5110ad50e0a9723744aec02f0f6cc3ca579f1cfc60359b',
 6:'133b2bbfc587140e854225bff92bea522244829115e97039632fe3ce64b7abb3',
 7:'62d5e96ce1b95f91f48f1460454f9df1e71ea61ded2b43e64e7456cd79577cf8',
 8:'ba8ac5471a9e58ebaf83a486104f648ab41e0ccd10334d0f4341a5e7f1352be8',
 9:'62599a56f070fdc8f975d14c0af7d81b0a0dbff6b540567952acd8eb11e3e961',
 10:'f3a32ae44bfd12c89d3b9f8ea1c0fc0553f00ba750ac0590a5fde3eb9be5962d'}
ORDER_ONE={'F1':29290,'U1':29289,'v1':29440,'M1':29334,'average':29336,'Pi1':50558}
LEADING_SCOPE='F0,U0,M0,V0/X are C-infinity for X>=0 and abs(eta)<1; all fixed one-sided eta jets extend to eta=+-1'
ONE_CONCLUSIONS={'allSixOriginalProfilesCInfinity':True,'axisAndEtaEndpointOneSidedJets':True,
 'genuineLiteralPressurePrimitive':True,'allOriginalPi1JoinConstantsAndAllFixedMixedJets':True,
 'actualContinuousMomentSolvesForArbitraryFiniteDebts':True}


def make_profile_native_handler(reg,data,hashes,Bound):
 """Bind the approved nine bodies before constructing a native handler.

 `data`/`hashes` are the background producer's unchanged input receipts and
 raw-file digests. Its ordinary bind_inputs gate must also run first. The
 checks below explicitly prevent arithmetic-only or unresolved-profile
 receipts from becoming a finite native constant proof.
 """
 leading,one,b=data['leading'],data['orderone'],data['orderone-binding']
 need(leading.get('schema')=='MathScope.N6.ActualCompletedLeadingFrozenApplication/1' and
      leading.get('sourceHeaderSHA256')==HEADER and leading.get('fixedDefinitionSHA256')==FIXED,
      'Same source completed leading theorem required for native constants')
 need(leading.get('provedActualCompletedLeading',{}).get('regularity')==LEADING_SCOPE,
      'Actual leading axis and eta-endpoint regularity required')
 need(one.get('schema')=='MathScope.N6.ActualOrderOnePrimitiveCalculus/1' and
      one.get('actualAllOrderGlobalRegularityComposed') is True and one.get('remainingAnalyticPremises')==[] and
      set(one.get('provedActualOrderOneConclusions',{}))==set(ONE_CONCLUSIONS) and
      all(one['provedActualOrderOneConclusions'].get(k) is True for k in ONE_CONCLUSIONS),
      'Actual all-six orderone axis/endpoint theorem required')
 need(b.get('schema')=='MathScope.N6.ActualOrderOnePrimitiveBinding/1' and
      b.get('sourceHeaderSHA256')==HEADER and b.get('bodyRoots')==ORDER_ONE,
      'Same actual six orderone bodies required')
 need(one.get('inputSHA256',{}).get('leading')==hashes['leading'] and
      one.get('inputSHA256',{}).get('binding')==hashes['orderone-binding'] and
      leading.get('inputSHA256',{}).get('stream-binding')==hashes['orderone-binding'],
      'Mixed native constant source/theorem chains')
 roots=leading['actualCompletedLeadingRoots'];br=b['actualLeadingRoots']
 need(all(roots[k]==br[k] for k in ['M','U','v']),'Native profile theorem uses different completed leading roots')
 expected={2:roots['F'],3:roots['U'],4:roots['v'],**dict(zip(range(5,11),ORDER_ONE.values()))}
 definitions={}
 for index in range(2,11):
  d=reg['expression'][index]
  need(digest(d)==PROFILE_PINS[index] and d.get('body')==expected[index] and
       d.get('parameters')==[4756,2] and d.get('unspecifiedOracle') is False,
       'Changed actual completed profile definition '+str(index))
  limits=d.get('derivativeLimits')
  need(isinstance(limits,list) and len(limits)==2 and all(type(k) is int and k>=0 for k in limits),
       'Malformed actual profile derivative ABI')
  definitions[index]=d

 def native(constants,node_id,node,environment):
  need(node.get('op')=='actual_expression_partial' and len(node.get('args',[]))==3,
       'Unreviewed constant native operation')
  index,args,orders=node['args']
  need(type(index) is int and index in definitions,'Unreviewed constant native profile '+str(index))
  d=definitions[index]
  need(isinstance(args,list) and len(args)==2 and all(type(j) is int for j in args) and
       isinstance(orders,list) and len(orders)==2 and
       all(type(k) is int and 0<=k<=limit for k,limit in zip(orders,d['derivativeLimits'])),
       'Unreviewed actual constant native argument/order tuple')
  # Do not simplify or substitute an opaque native before checking BOTH of
  # its actual argument graphs in the current lexical integration scope.
  xx,eta=[constants.at(j,environment) for j in args]
  need(xx.lo is not None and xx.lo>=0,'Native profile constant X>=0 domain unproved')
  need(eta.lo is not None and eta.hi is not None and eta.lo>=-1 and eta.hi<=1,
       'Native profile constant closed eta domain unproved')
  constants.domains.append({'node':node_id,'operation':'actual_expression_partial',
   'actualSourceCallSHA256':digest(node),'definition':index,'definitionBody':d['body'],
   'definitionSHA256':PROFILE_PINS[index],'actualArguments':args,'actualOrders':orders,
   'scopedCoordinates':[j for j,_ in environment],
   'argumentEnclosures':[{'lo':str(v.lo) if v.lo is not None else None,
    'hi':str(v.hi) if v.hi is not None else None,'strictPositive':v.strict_positive} for v in [xx,eta]],
   'actualArgumentsRecursivelyChecked':True,'sameActualCompletedProfileTheorem':True,
   'finiteAndContinuousOnActualClosedScopedBox':True,'XZeroAndInwardEtaEndpointJetsCovered':True,
   'theoremInputSHA256':{k:hashes[k] for k in ['leading','orderone','orderone-binding']},
   'noMagnitudeSignOrNormUpperBoundClaimed':True,'n2RegularityOrNormHonestyAssumed':False,'proved':True})
  return Bound(None,None,False,False)
 return native
