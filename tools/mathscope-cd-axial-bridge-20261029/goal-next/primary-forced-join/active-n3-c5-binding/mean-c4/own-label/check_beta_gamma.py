"""Same-live exact positive-N beta/gamma identities, retaining source T1/A1."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import gzip
import json
PINS={'nodes':'1ad501984212afd18d2ee6361f14ce6b1a28cf67c36e90eb059bb162514dc8fc',
      'registry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
      'own':'63a5e1a7fd6317e1eb5db3e2779edd5138fc4ee36d9bd1cb78ac41a4c823be5f',
      'potential':'c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8'}
def main():
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();raw={}
    for k,pin in PINS.items():raw[k]=getattr(a,k).read_bytes();assert sha256(raw[k]).hexdigest()==pin,k
    registry,own=(json.loads(raw[k]) for k in ('registry','own'))
    assert own['status']=='SAME_LIVE_N3_OWN_MEAN_V_POSITIVE_N_CONDITIONAL_WEIGHTED_PULLBACK'
    inverse=json.loads(registry['base']['inverseDefinitions'])
    args=[17732748,17732749,17732750,17732737,17745430,17745431]
    assert inverse[1]['name']=='GlobalActualTemporal_z' and inverse[1]['body']==17754268
    assert inverse[1]['parameters']==args and inverse[1]['finiteSumDeclaredEqualToLimit'] is False
    coupled=json.loads(registry['definitions'])[0]
    for system,name,body in [('coupled-expression:0','ActualInitializedMeanVelocity_0',21435335),
                             ('coupled-expression:2','ActualInitializedMeanVelocity_2',21435337)]:
        entry=next(x for x in coupled if x.get('name')==name)
        assert entry['id']==system and entry['body']==body and entry['parameters']==args
    expr=json.loads(registry['base']['expressionDefinitions'])
    for i,name,body in [(19,'GlobalInitializationFiveBump_gamma',21374926),
                        (20,'GlobalInitializationFiveBump_beta',21374944)]:
        assert expr[i]['name']==name and expr[i]['body']==body
        assert expr[i]['parameters']==[17732737,17732748,17732749,17732750]
    text=raw['potential'].decode('utf8')
    for s in ['gammaDesired=G.neg(G.div(inverseZ,ci))',
      'rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)',
      'beta=G.neg(Dz(psi)),gamma=De(psi,1)',
      "physicalIdentity:'Delta gamma=gamma_d-A1(gamma_d); Delta beta=-epsilon*partial_Z T1(gamma_d).'"]:
        assert s in text,s
    expected={
      17754268:['add',[17744195,17754267]],
      19563093:['m3_aux_inverse_partial',[1,args,[0]*5]],
      19570918:['m3_aux_expression_partial',[-13,[17732737,17732748,17732749,17732750,17745430,17745431],[0]*6]],
      19570919:['m3_aux_expression_partial',[-13,[17732737,17732748,17732749,17732750,17745430,17745431],[0,0,1,0,0,0]]],
      19570920:['multiply',[17732744,19570919]],19570921:['multiply',[20,19570920]],
      19570928:['add',[19570922,19570927]],19570929:['multiply',[17733137,19570918]],
      19570930:['add',[19570928,19570929]],
      21374927:['m3_aux_expression_partial',[-20,[17732737,17732748,17732749,17732750],[0]*4]],
      21374945:['m3_aux_expression_partial',[-21,[17732737,17732748,17732749,17732750],[0]*4]],
      21374946:['add',[19570921,21374945]],21374948:['add',[19570930,21374927]],
      17732936:['actual_expression_partial',[32029,[17732748,17732749,17732750,17732737],[0]*4]],
      17732935:['actual_expression_partial',[32028,[17732748,17732749,17732750,17732737],[0]*4]],
      21435335:['add',[17732936,21374946]],21435337:['add',[17732935,21374948]],
      21435341:['m3_coupled_expression_partial',['coupled-expression:0',[21435327,21435332,21435334,21435315,17745430,17745431],[0]*6]],
      21435345:['m3_coupled_expression_partial',['coupled-expression:2',[21435327,21435332,21435334,21435315,17745430,17745431],[0]*6]],
      21435342:['multiply',[21435340,21435341]],21435346:['multiply',[21435340,21435345]],
    }
    found={}
    with gzip.open(a.nodes,'rt',encoding='utf8') as f:
      assert json.loads(next(f))['node_count']==21681493
      for i,line in enumerate(f):
        if i in expected:
          n=json.loads(line);found[i]=[n['op'],n['args']]
    assert found==expected
    result={'status':'SAME_LIVE_N3_POSITIVE_N_BETA_GAMMA_SOURCE_IDENTITIES_CONDITIONAL',
      'pins':PINS,'E_z':17754268,'zInverse':19563093,'psi':19570918,
      'temporalBeta':19570921,'temporalGamma':19570930,
      'fiveMapBeta':21374945,'fiveMapGamma':21374927,
      'commonMeanBeta':21435335,'commonMeanGamma':21435337,
      'ownMeanBeta':21435342,'ownMeanGamma':21435346,
      'identities':['N^j beta=epsilon*c0^-1*partial_Z[T1(N^(j-1) Pperp E_z)], j>=1',
                    'N^j gamma=-c0^-1*(I-A1)[N^(j-1) Pperp E_z], j>=1'],
      'conditions':['original exact Fourier inverse and zero Haar projection',
                    'fixed label, smooth source and original shifted radial translations',
                    'T1 and A1 are original complete cutoff operators; Z differentiation hits all operator terms',
                    'both actual FiveMap definitions and original backgrounds are common-Y independent'],
      'limitations':['No actual E_z or operator norm is bounded by this readback.',
                     'No pointwise beta/gamma, own-label bound, complete mode-one input, or final jet is proved.'],
      'finalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as f:json.dump(result,f,indent=2);f.write('\n')
    print(result['status'])
if __name__=='__main__':main()
