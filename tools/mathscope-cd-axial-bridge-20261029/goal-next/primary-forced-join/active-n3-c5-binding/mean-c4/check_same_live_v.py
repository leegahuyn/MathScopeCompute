"""Bind the initialized v and inverse to one same-live N3 export."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import gzip
import json

PINS={'nodes':'1ad501984212afd18d2ee6361f14ce6b1a28cf67c36e90eb059bb162514dc8fc',
      'registry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
      'join':'160c99aaada4417e87993b8ff906288661960be9642485824b9ef1ec98798ddf',
      'primary':'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad',
      'temporal':'d5e20e78c119b678b61df35c1bf0f560826e7dddb74e70edd0c17a67d18a9759',
      'pressure':'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d',
      'readback':'2a2c80b4020cfcff50a60563a9c4fbbc72a192dda851d29af9fb559435884d2a'}
def main():
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();raw={}
    for k,pin in PINS.items():
        raw[k]=getattr(a,k).read_bytes()
        assert sha256(raw[k]).hexdigest()==pin,k
    registry,join,primary=(json.loads(raw[k]) for k in ('registry','join','primary'))
    assert join['status']=='VERIFIED_SAME_LIVE_N3_PRIMARY_C5_AND_SELECTED_FORCED_INPUTS'
    assert join['prefix']==3 and primary['status']=='VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    assert primary['requested']['primaryC']==5 and primary['scope']['actualForcedInputWClassCertified'] is False
    readback=json.loads(raw['readback'])
    assert readback['status']=='ACTIVE_SOURCE_MODE_TWO_OPERAND_READBACK' and readback['priorEdges']==43980655
    assert readback['graphSHA256']=='831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a'
    assert readback['registrySHA256']==PINS['registry']
    text=raw['temporal'].decode('utf8')
    assert 'N inverse = actual E - normalized Haar mean(actual E)' in text
    assert 'sourceFourierTheoremApplied:true' in text
    pressure=raw['pressure'].decode('utf8')
    assert 'Etheta=G.sub(G.add(De(W.rtheta,2),Dz(W.thetaz)),De(stress[0],2))' in pressure
    args=[17732748,17732749,17732750,17732737,17745430,17745431]
    inverses=json.loads(registry['base']['inverseDefinitions'])
    assert inverses[0]['name']=='GlobalActualTemporal_theta' and inverses[0]['body']==17754253
    assert inverses[0]['parameters']==args and inverses[0]['directions']==args[:3]+args[4:]
    assert inverses[0]['operator']=='(sqrt(2)-1)*partial_y0+partial_y1'
    assert inverses[0]['finiteSumDeclaredEqualToLimit'] is False
    definitions=json.loads(registry['base']['expressionDefinitions'])
    five=definitions[18]
    assert five['name']=='GlobalInitializationFiveBump_v' and five['body']==21374922
    assert five['parameters']==[17732737,17732748,17732749,17732750]
    coupled=json.loads(registry['definitions'])[0]
    mean=next(x for x in coupled if x['name']=='ActualInitializedMeanVelocity_1')
    assert mean['body']==21435336 and mean['parameters']==args
    fields=json.loads(registry['base']['fieldDefinitions'])
    assert fields[1]['name']=='GlobalCompleteCommonTorus_rtheta'
    assert fields[4]['name']=='GlobalCompleteCommonTorus_thetaz'
    assert fields[1]['parameters']==args and fields[4]['parameters']==args
    expected={
      20:['rational',['-1','1']],156007:['add',[1,9]],
      17732737:['coordinate',['N6_global_frozen_integer_band_N3$1207472']],
      17732738:['multiply',[127,17732737]],17732739:['multiply',[20,17732738]],
      17732740:['exp',[17732739]],17732742:['log_positive',[17732740]],
      17733017:['log_positive',[14220487]],17733018:['inverse',[17733017]],
      17733025:['multiply',[156007,17732742]],17733026:['exp',[17733025]],
      17745432:['add',[190,17732737]],17745433:['multiply',[156007,17745432]],
      17745434:['multiply',[127,17745433]],17745435:['log_positive',[17745432]],
      17745436:['multiply',[24,17745435]],17745437:['multiply',[20,17745436]],
      17745438:['add',[17745434,17745437]],17745439:['multiply',[17733018,17745438]],
      17745440:['multiply',[20,17745439]],17745441:['ceiling',[17745440]],
      17745442:['multiply',[20,17745441]],17745447:['multiply',[17733017,17745442]],
      17745448:['exp',[17745447]],17745449:['multiply',[17733026,17745448]],
      17744077:['multiply',[20,17744076]],
      17753399:['m3_aux_indexed_partial',[1,args,[0]*5]],
      17754240:['m3_aux_indexed_partial',[1,args,[1,0,0,0,0]]],
      17754241:['m3_aux_indexed_partial',[1,args,[0,0,0,1,0]]],
      17754242:['m3_aux_indexed_partial',[1,args,[0,0,0,0,1]]],
      17754243:['multiply',[17733068,17754242]],17754244:['add',[17754241,17754243]],
      17754245:['multiply',[17745446,17754244]],17754246:['add',[17754240,17754245]],
      17754247:['multiply',[24,17753399]],17754248:['multiply',[17733137,17754247]],
      17754249:['add',[17754246,17754248]],
      17754250:['m3_aux_indexed_partial',[4,args,[0,1,0,0,0]]],
      17754251:['multiply',[17732744,17754250]],17754252:['add',[17754249,17754251]],
      17754253:['add',[17744077,17754252]],
      19560947:['m3_aux_inverse_partial',[0,args,[0]*5]],
      19570770:['inverse',[17745449]],19570771:['multiply',[19560947,19570770]],
      19570772:['multiply',[20,19570771]],
      21374923:['m3_aux_expression_partial',[-19,[17732737,17732748,17732749,17732750],[0]*4]],
      21374947:['add',[19570772,21374923]],
      21435336:['add',[17744974,21374947]],17744974:['multiply',[17732748,17732934]],
    }
    found={}
    with gzip.open(a.nodes,'rt',encoding='utf8') as f:
        header=json.loads(next(f));assert header['node_count']==21681493
        for i,line in enumerate(f):
            if i in expected:
                x=json.loads(line);found[i]=[x['op'],x['args']]
    assert found==expected
    # All unexpanded operands in the c0 path precede the slow and Y coordinates.
    assert all(x < 17732737 for x in [1,9,24,127,190,14220487])
    result={
      'status':'SAME_LIVE_N3_V_LONGITUDINAL_CONDITIONAL_L2_BOUND',
      'pins':PINS,'nodeCount':21681493,'fixedLabel':17732737,
      'meanBody':21435336,'background':17744974,'correction':21374947,
      'temporal':19570772,'fiveMap':21374923,'inverse':19560947,
      'inverseSourceTheta':17754253,'c0':17745449,'c0DependsOnlyOnFrozenLabelAndEarlierSourceRoots':True,
      'sourceCovarianceTheta':17754252,'sourceStressTerm':17744077,
      'formula':'N^j(v_full)=-c0^-1 N^(j-1) P_perp E_theta = -c0^-1 N^(j-1) P_perp (D_2 W_rtheta + epsilon partial_Z W_thetaz), j>=1',
      'inequality':'||D_s^alpha L^l N^j v_full||_L2Y <= c0^-1 ||D_s^alpha L^l N^(j-1) (D_2 W_rtheta + epsilon partial_Z W_thetaz)||_L2Y',
      'reason':'P_perp is the orthogonal Haar mean-zero projection and commutes with constant N,L and fixed-label slow partials.',
      'stressCancellation':'The original stress node #17744077 precedes both Y coordinates, and the original graph is topologically ordered; hence P_perp removes it. No original stress was set to zero.',
      'premises':['original complete Fourier inverse and derivative theorem','fixed label and source smoothness',
                  'L2 integrability of the displayed source derivative','positive c0'],
      'limitations':['This is a conditional L2 source inequality, not a fixed-Y supremum.',
                     'Actual source derivative norms and complete common-Y source attachment remain open.',
                     'Not a full mean C4 or Forced input bound.'],
      'registryExportSourceAuthenticatedFlag':mean['sourceAuthenticated'],
      'numericalFinalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as f:json.dump(result,f,indent=2);f.write('\n')
    print(result['status'])
if __name__=='__main__':main()
