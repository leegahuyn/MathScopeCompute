"""Directional FiveMap gauge jets and the surviving Sigma time-target path."""
from argparse import ArgumentParser
from hashlib import sha256
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
import json
import sympy as S
if not __debug__:raise RuntimeError('Keep exact proof assertions enabled.')

PINS={'sigmaReceipt':'b73b6cbe2e18275f634cf28e6c92698939672adaab7813829d39fc8d8f9a151c',
 'reader':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee',
 'source-global-initial-mean.mjs':'513779930558d044076318f39396060465b6518184b952482a0d973ac16bd411',
 'source-updated-mean-pressure.mjs':'6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07',
 'source-global-moment.mjs':'0d02d55b291db8c55db26810ae4783d62e09ac3d058fd582f4161cb444871e46'}
PINS['source-global-current.mjs']='93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760'
PINS['source-temporal-potential.mjs']='c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8'
PINS['source-global-pressure.mjs']='fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d'

def main():
    p=ArgumentParser(description=__doc__);p.add_argument('goal_next',type=Path)
    p.add_argument('sigma_receipt',type=Path);p.add_argument('output',type=Path)
    a=p.parse_args();assert not a.output.exists()
    assert sha256(a.sigma_receipt.read_bytes()).hexdigest()==PINS['sigmaReceipt']
    previous=json.loads(a.sigma_receipt.read_bytes())
    cp=a.goal_next/'first-scale-closure/check_first_scale_closure.py'
    assert sha256(cp.read_bytes()).hexdigest()==PINS['reader']
    spec=spec_from_file_location('original_reader',cp);m=module_from_spec(spec);spec.loader.exec_module(m)
    source={}
    for name in ('source-global-initial-mean.mjs','source-updated-mean-pressure.mjs','source-global-moment.mjs',
      'source-global-current.mjs','source-temporal-potential.mjs','source-global-pressure.mjs'):
        data=m.git_blob(a.goal_next.parents[2],'research-ide/mathscope-m3/navier/'+name)
        assert sha256(data).hexdigest()==PINS[name];source[name]=data.decode()
    for name,clauses in {
      'source-global-initial-mean.mjs':[
        'angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)]',
        'axialTarget:G.neg(targets.Jtheta)',
        'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))',
        'actualInputDefects={P:afterTemporal.mean.P,Jtheta:afterTemporal.mean.Jtheta,Jz:afterTemporal.mean.Jz}',
        'pass:Object.values(increment).every(x=>Y.every(y=>!G.freeCoordinates(x).has(y)))'],
      'source-updated-mean-pressure.mjs':[
        "[P,Jtheta,Jz].every(x=>!G.freeCoordinates(x).has(R))",
        'gr=scalar(G,raw.gr',
        'G.mul(G.derivative(chi,Z),integrals.whole)'],
      'source-global-moment.mjs':['export function exactFiveMomentCoefficients','angular=inverse.map'],
      'source-global-current.mjs':['rawGr=G.add(G.neg(De(W.rr,1)),G.neg(Dz(W.rz))',
        'Ez=G.sub(G.add(De(W.rz,1),Dz(G.add(W.zz,pressure)))'],
      'source-temporal-potential.mjs':['gammaDesired=G.neg(G.div(inverseZ,ci))',
        'beta=G.neg(Dz(psi)),gamma=De(psi,1)'],
      'source-global-pressure.mjs':['gr=G.add(G.neg(De(W.rr,1)),G.neg(Dz(W.rz)),G.div(W.thetatheta,R))',
        'Ez=G.sub(G.add(De(W.rz,1),Dz(W.zz),G.mul(epsilon,pZ)),De(stress[1],1))']}.items():
        for clause in clauses:assert clause in source[name],(name,clause)
    r,z,t=S.symbols('R Z T');eps=S.Symbol('epsilon',positive=True)
    P,J,Q=[S.Function(n)(z,t) for n in ('P0','Jz0','Jtheta0')]
    targets={P:'P0',J:'Jz0',Q:'Jtheta0'}
    fP,fJ,g=[S.Function(n)(r,z,t) for n in ('fP','fJ','gPsi')]
    psi=Q*g;beta=-eps*S.diff(psi,z);v=P*fP+J*fJ;gamma=S.diff(psi,r)+psi/r
    V=[beta,v,gamma];A=[S.Integer(0),psi,S.Integer(0)]
    grad=lambda u:[[S.diff(u[0],r),-u[1]/r,eps*S.diff(u[0],z)],
      [S.diff(u[1],r),u[0]/r,eps*S.diff(u[1],z)],
      [S.diff(u[2],r),S.Integer(0),eps*S.diff(u[2],z)]]
    def jets(expression):
        result={}
        def visit(node,power):
            if isinstance(node,S.Derivative) and node.expr in targets:
                order={x:n for x,n in node.variable_count};assert set(order)<={z,t}
                key=(targets[node.expr],int(order.get(z,0)),int(order.get(t,0)));result[key]=min(result.get(key,power),power);return
            if node in targets:
                key=(targets[node],0,0);result[key]=min(result.get(key,power),power);return
            for child in node.args:visit(child,power)
        for term in S.Add.make_args(S.expand(expression.doit())):
            power=term.as_powers_dict().get(eps,S.Integer(0));assert power.is_Integer and power>=0
            visit(term,int(power))
        return [{'target':n,'Z':zz,'T':tt,'explicitEpsilonPower':power} for (n,zz,tt),power in sorted(result.items())]
    outputs={'A':A,'U':V,'G_A':[x for row in grad(A) for x in row],'G_U':[x for row in grad(V) for x in row]}
    gauge={name:[jets(expr) for expr in exprs] for name,exprs in outputs.items()}
    all_gauge=[row for exprs in gauge.values() for expr in exprs for row in expr]
    assert max(row['Z'] for row in all_gauge if row['target'] in ('P0','Jz0'))==1
    assert max(row['Z'] for row in all_gauge if row['target']=='Jtheta0')==2
    assert all(row['T']==0 for row in all_gauge)
    # Exact theta time contribution: KP/KJ include R^-2 times the partial weighted profile primitive.
    KP,KJ=[S.Function(n)(r,z,t) for n in ('KP','KJ')]
    time_part=eps*S.diff(P*KP+J*KJ,t)
    time_rows=[]
    for total in range(3):
        for zz in range(total+1):
            rr=total-zz;expr=eps**zz*S.diff(time_part,r,rr,z,zz)
            time_rows.append({'spatialOrders':[rr,zz],'targetJets':jets(expr)})
    highest=[x for row in time_rows for x in row['targetJets'] if x['Z']==2 and x['T']==1]
    assert len(highest)==2 and {x['explicitEpsilonPower'] for x in highest}=={3}
    control=S.expand((eps**2*S.diff(time_part,z,2)).subs({P:(t-1)*z**2,J:S.Integer(0)}).doit()).subs({z:0,t:1}).doit()
    expected=2*eps**3*KP.subs({z:0,t:1})
    assert S.expand(control-expected)==0
    # Conservative source paths through the full pressure. Lower kernel derivatives produce downward-closed sets.
    seeds=[('theta_time_v','P0',0,1,1),('theta_time_v','Jz0',0,1,1),
      ('axial_v_flux','P0',1,0,1),('axial_v_flux','Jz0',1,0,1),
      ('radial_beta_flux','Jtheta0',1,0,1),('z_time_gamma','Jtheta0',0,1,1),
      ('pressure_beta_time','Jtheta0',2,1,3),
      ('pressure_beta_radial_viscosity','Jtheta0',2,0,3),
      ('pressure_beta_axial_advection','Jtheta0',3,0,3),
      ('pressure_beta_axial_viscosity','Jtheta0',4,0,5)]
    paths=[]
    for name,target,iz,it,base in seeds:
        for total in range(3):
            for zz in range(total+1):
                paths.append({'sourcePath':name,'target':target,'outerSpatialOrders':[total-zz,zz],
                  'highestTargetJet':{'Z':iz+zz,'T':it},'explicitEpsilonPower':base+zz,
                  'lowerTargetMultiIndicesMayAppear':True,
                  'profileSpecificCancellationExcludedByThisPathOnly':name=='theta_time_v'})
    assert any(x['sourcePath']=='pressure_beta_time' and x['highestTargetJet']=={'Z':4,'T':1} and x['explicitEpsilonPower']==5 for x in paths)
    assert any(x['sourcePath']=='pressure_beta_axial_viscosity' and x['highestTargetJet']=={'Z':6,'T':0} and x['explicitEpsilonPower']==7 for x in paths)
    result={'schema':'MathScope.N7.DirectionalMeanTargetJetsAndSigmaObstruction/1',
      'status':'VERIFIED_DIRECTIONAL_GAUGE_BOOKKEEPING_AND_UNCANCELLED_THETA_TIME_JET',
      'inputSHA256':PINS,'fixedOriginalCommit':m.REFERENCE,
      'targetConvention':'P0,Jz0,Jtheta0 are the INPUT defects of the initialized FiveMap; they are distinct from the later fresh pressure/moment defects in Sigma.',
      'exactSourceFactorization':{'v':'P0*fP(R,Z,T)+Jz0*fJ(R,Z,T)',
        'psi':'Jtheta0*gPsi(R,Z,T)','beta':'-epsilon*partial_Z psi','gamma':'partial_R psi+psi/R',
        'kernelDependence':'All s(Z,T), coefficient inverse and profile derivatives stay in the kernels; kernels are not frozen in Z or T.'},
      'fiveMapGaugeJetPrograms':gauge,
      'fiveMapGaugeOnlyRequiredTargets':{'P0':'Z orders0,1','Jz0':'Z orders0,1','Jtheta0':'Z orders0,1,2','TOrders':[0]},
      'sigmaThetaTimeExact':{'formula':'epsilon*partial_T(P0*KP+Jz0*KJ)',
        'rows':time_rows,'unavoidableHighestTargets':['epsilon^3*partial_Z^2 partial_T P0','epsilon^3*partial_Z^2 partial_T Jz0'],
        'otherThetaFluxesHaveNoP0_TorJz0_T':True,
        'kernelNonzeroReason':'A profile that corrects a nonzero actual FiveMap moment cannot be identically zero. Its weighted partial primitive cannot vanish identically if its derivative is the nonzero weighted profile. Zero WHOLE angular velocity moment does not make that partial primitive zero.'},
      'formalControl':{'P0':'(T-1)*Z^2','Jz0':'0','atSlowPoint':{'T':1,'Z':0},
        'weightedDz2SigmaThetaTime':str(control),'expected':str(expected),
        'respectsRIndependentTargets':True,'actualOriginalTargetValuesSubstituted':False,
        'scope':'Countermodel to eliminating this jet using R-independence/conservation alone; not a counterexample to the actual original field.'},
      'pressureDirectionalPaths':paths,
      'pressurePathScope':'These are conservative derivative paths in the exact pressure and flux constructors, not a proof that every highest coefficient survives the special actual profile. The full latest Jz+c_rho*P and pressure normalization must be combined before claiming cancellation or necessity.',
      'whatTheReductionSaves':'No R derivatives of the target coefficients and no unnecessary isotropic T2/T3 demands; the gauge alone needs much less than full mean C3.',
      'selectedUnderlyingCovariancePath':{'outerTargetJet':'P0_ZZT',
        'sourceChain':['P0 contains epsilon*partial_T betaTemporal in its radial-pressure source',
          'betaTemporal contains epsilon*partial_Z T1 N^-1 Ez with original ci^-1',
          'prior Ez contains epsilon*partial_Z T0(-epsilon*partial_Z Wrz)',
          'highest resulting covariance derivative is partial_Z^5 partial_T^2 Wrz'],
        'covarianceJet':{'Z':5,'T':2,'totalOrder':7},
        'covarianceScope':'full angular mean on the common Y torus before auxiliary Haar; it is the input to the actual Temporal inverse, so auxiliary-fast terms cannot be discarded by Haar here',
        'explicitEpsilonBeforeOuterTarget':4,'explicitEpsilonAfterWeightedSigmaTheta_Dz2_Time':7,
        'fullCurlImaginaryCovarianceNeedsPotentialJets':[{'R':0,'Z':6,'T':2,'L':0},{'R':1,'Z':5,'T':2,'L':0},{'R':0,'Z':5,'T':2,'L':1}],
        'leadingCovarianceUsesAmplitudeZ5T2':True,
        'additionalConditions':'original N^-1 anisotropic loss input (including L^2), ci^-1, T0/T1 kernel/shift derivatives and actual same-family covariance attachment',
        'actualSelectedJetBounded':False},
      'remaining':['actual weighted P0_ZZT and Jz0_ZZT bounds, or a new source identity relating those actual input defects',
        'source-specific reduction or bounds for the Jtheta0 high-Z pressure paths (up to Z4T1 and Z6 in this unreduced ledger)',
        'fixed-profile kernel bounds on the actual slow chart, including rho/chi s(Z,T) derivatives',
        'same-family native binding and all radial/flat seams; independent Temporal mean derivatives are outside the isolated FiveMap target bookkeeping'],
      'previousFullIsotropicMissingRouteRetained':previous['meanPositiveProgramTransfer']['firstDocumentedMissingRoute'],
      'scope':{'fullSigmaC2Bounded':False,'actualTargetJetsNumericallyEnclosed':False,'newFinalGateClaim':False,
        'sourceFieldChanged':False,'newArtifactDownloaded':False,'localLeanCompilation':False,
        'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}}
    a.output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps({'status':result['status'],'gaugeGroups':4,'thetaTimeSpatialShapes':len(time_rows),
      'pressurePaths':len(paths),'isolatedWeightedTargetJet':'epsilon^3*P0_ZZT','actualTargetJetsClosed':0}))

if __name__=='__main__':main()
