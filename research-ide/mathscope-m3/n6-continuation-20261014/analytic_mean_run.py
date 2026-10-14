"""Bounded source-linked Volterra/Picard analytic continuation ledger.

This reuses byte-pinned first-cloud source data. It proves the explicit
finite-dimensional Volterra theorem and source frame denominator lemma;
source-domain and background analytic premises are never silently supplied.
"""
from pathlib import Path
import argparse, collections, hashlib, importlib.util, json, sqlite3, time

HEADER_SHA='010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'
DB_SHA='ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'
CAPTURE_SHA='37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb'
BASE='research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291'
RELEVANT=['research-ide/mathscope-m2/navier/actual-covariance-matrix.mjs','research-ide/mathscope-m2/navier/actual-covariance-volterra.mjs','research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs','research-ide/mathscope-m2/navier/actual-continuation-exact-inner.mjs','research-ide/mathscope-m2/navier/actual-stress-direction-bounds.mjs','research-ide/mathscope-m3/navier/source-global-band.mjs','research-ide/mathscope-m3/navier/source-global-expressions.mjs']
def digest(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        while raw:=f.read(1024*1024):h.update(raw)
    return h.hexdigest()
def pinned(path,sha):
    if digest(path)!=sha:raise ValueError('Changed byte-pinned source '+str(path))
    return json.loads(Path(path).read_bytes())
def canonical(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))

def main():
    p=argparse.ArgumentParser();p.add_argument('--artifacts',required=True);p.add_argument('--output',required=True);args=p.parse_args()
    start=time.monotonic();repo=Path(__file__).resolve().parents[3];out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    (out/'analytic-mean-started.json').write_text(json.dumps({'priorRun':38500114302,'heavyMeanReplayRepeated':False,'originalN601Complete':False,'originalN602Complete':False})+'\n')
    try:
        folder=Path(args.artifacts)/'mean-proof-inputs-38500114302'/'dag';header=pinned(folder/'header.json',HEADER_SHA)
        if digest(folder/'source-dag-checkpoint.sqlite')!=DB_SHA:raise ValueError('Changed first-cloud source DAG bytes')
        capture=pinned(repo/BASE/'source-bytes-before.json',CAPTURE_SHA);by_path={r['path']:r for r in capture['files']};code=[]
        for path in RELEVANT:
            r=by_path[path]
            if digest(repo/path)!=r['sha256'] or (repo/path).stat().st_size!=r['bytes']:raise ValueError('Changed actual producer '+path)
            code.append(r)
        spec=importlib.util.spec_from_file_location('source_dag',Path(__file__).resolve().parents[1]/'certification-20261014/source_dag.py');dag=importlib.util.module_from_spec(spec);spec.loader.exec_module(dag);defs=dag.definitions(header)
        db=sqlite3.connect((folder/'source-dag-checkpoint.sqlite').resolve().as_uri()+'?mode=ro',uri=True)
        cache={};definition_rows={};unknown=[]
        def take(i):
            if type(i) is not int or i<0:raise ValueError('Metadata used as source scalar')
            if i not in cache:
                row=db.execute('SELECT raw FROM nodes WHERE id=?',(i,)).fetchone()
                if row is None:raise ValueError('Source coefficient outside preserved exact DAG '+str(i))
                cache[i]=json.loads(row[0])
            return cache[i]
        def register(key,d):definition_rows[key]={'definition':d,'sha256':hashlib.sha256(canonical(d).encode()).hexdigest()}
        def children(i,n):
            op=n['op'];a=n['args'];base=dag.primitive_children(n)
            if op in ['m3_aux_expression_partial','actual_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial']:
                kind={'m3_aux_expression_partial':'expressionDefinitions','actual_expression_partial':'expression','m3_aux_indexed_partial':'fieldDefinitions','m3_aux_inverse_partial':'inverseDefinitions','m3_global_indexed_partial':'m3GlobalFields'}[op];index=-1-a[0] if op=='m3_aux_expression_partial' else a[0];d=defs[kind][index];register(f'{kind}:{index}',d)
                if 'body' in d:return base+[d['body'],*d.get('parameters',[])]
                unknown.append({'sourceNode':i,'operation':op,'reason':'Indexed row analytic semantics remain separate'});return base
            if op=='actual_monotone_root':
                d=defs['monotone'][a[0]];register(f'monotone:{a[0]}',d);return base+[d[k] for k in ['body','left','right','derivativeLower','derivativeUpper']]+d['parameters']+[d['variable']]
            if op=='actual_quadratic_root':
                d=defs['quadratic'][a[0]];register(f'quadratic:{a[0]}',d);return base+sum(d['linear'],[])+sum(d['quadraticDiagonal'],[])+d['rhs']+[d['scale']]+sum(d['preconditioner'],[])+[d['rootRadius'],d['lipschitzUpper']]
            if op=='actual_natural_series':
                core=defs['fixed']['core'];return base+[core[k] for k in ['eta','h','Lambda','A','D','d','L','Ustar','Hstar','Wstar','Zstar','chi','zeta','gSquared']]
            if op in ['actual_background_even_profile','actual_background_picard']:
                if a[0]!=0:unknown.append({'sourceNode':i,'operation':op,'reason':'Different Picard lower-order grammar'});return a[2:4]
                d=defs['picard'][0];register('picard:0',d);return a[2:4]+[d['xi'],d['eta']]+sum(d['A0'],[])+sum(d['A1'],[])+d['forcing']+d['radialDomain']+list(d['sourceLeading'].values())+[d['tail'][k] for k in ['sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','error','target']]+[d['solutionNorm']['commonCollar'],d['solutionNorm']['naturalExtensionToY5']]
            if base is not None:return base
            unknown.append({'sourceNode':i,'operation':op,'reason':'Unreviewed analytic coefficient grammar'});return []
        systems=[];queue=[]
        for index in [0,1]:
            rows=[d for d in defs['m3GlobalPulses'] if d['covariance']==index]
            if len(rows)!=1:raise ValueError('Missing exact original covariance registry')
            w=rows[0];d=json.loads(w['originalDefinition'])
            if any(w[k]!=d[k] for k in ['parameters','matrix','variable','length','initial']) or w['directions']!=w['parameters'][:3] or w['directionParameterIndices']!=[0,1,2]:raise ValueError('Changed actual derivative or coefficient binding')
            if take(d['initial'][0])!={'op':'rational','args':['1','1']} or take(d['initial'][1])!={'op':'rational','args':['0','1']}:raise ValueError('Changed e1 initial datum')
            systems.append({'covariance':index,'originalDefinition':d,'actualSlowDirections':w['directions'],'representativeAndBandParametersFrozen':w['parameters'][3:],'coefficientMatrixSourceNodes':d['matrix'],'sourceNormUpper':d['normUpper'],'sourceLength':d['length'],'definitionSHA256':hashlib.sha256(w['originalDefinition'].encode()).hexdigest()});queue+=sum(d['matrix'],[])+[d['length'],d['normUpper']]
        seen=set();work=0
        while queue:
            work+=1
            if work>2000000 or len(seen)>200000:raise ValueError('Bounded analytic coefficient traversal resource limit')
            i=queue.pop()
            if i in seen:continue
            n=take(i);seen.add(i);queue+=children(i,n)
        picard=defs['picard'][0]
        if picard['diagonal']!=[0,0,2,0,3,1] or picard['zeroAxisDatum']!=[0]*6:raise ValueError('Changed singular Picard axis datum')
        mask=all(take(picard['A1'][i][j])=={'op':'rational','args':['0','1']} for i in range(6) for j in range(6) if i<4 or j>=4)
        if not mask:raise ValueError('Source A1 nilpotent block mask changed')
        # Actual scalar nodes, not generic renamed carrier symbols. These
        # identities are frozen by the byte-pinned database/source recipe.
        scalar_nodes={622801:('ceiling',[622800]),623027:('multiply',[300173,623026]),623025:('multiply',[623022,623024]),623022:('exp',[623021]),623024:('exp',[623023]),623026:('inverse',[623025]),623111:('multiply',[623109,623110]),623463:('multiply',[623110,623462]),623110:('inverse',[622801]),623109:('smooth_piecewise',[623107,50,19,623107,623108,623107]),623462:('smooth_piecewise',[623460,50,19,623460,623461,623460]),623108:('smooth_piecewise',[623103,0,0,20,1,1]),623461:('smooth_piecewise',[623456,0,0,20,1,1]),623107:('multiply',[20,623106]),623106:('ceiling',[623105]),623460:('multiply',[20,623459]),623459:('ceiling',[623458]),623008:('multiply',[623006,623007]),623006:('sqrt_positive',[623005]),623007:('inverse',[623002]),623005:('multiply',[20,623004]),623004:('multiply',[623002,623003]),623003:('add',[622996,623002]),623002:('multiply',[622998,623001]),623001:('multiply',[24,622971]),622998:('multiply',[622992,622997]),622997:('inverse',[622996]),622996:('sqrt_positive',[622995]),622995:('add',[622993,622994]),622993:('multiply',[622992,622992]),622994:('multiply',[622991,622991])}
        for i,(op,operands) in scalar_nodes.items():
            if take(i)!={'op':op,'args':operands}:raise ValueError('Changed actual carrier/frame scalar formula '+str(i))
        if take(300173)!={'op':'rational','args':['1','8589934592']} or take(50)!={'op':'rational','args':['-1','2']} or take(19)!={'op':'rational','args':['1','2']}:raise ValueError('Changed positive source pulse geometry constant')
        actual_geometry={'actualSourceScalarRows':[[i,take(i)] for i in sorted(scalar_nodes)],
          'pulseLength':{'sourceNode':623027,'provedPositiveWheneverBandParameterFinitePositive':True,'proof':'Ls=(1/8589934592)/(exp(node623021)*exp(node623023))>0; both exponents are finite for fixed positive finite ell and finite fixed source parameters. No background value occurs in this length chain.'},
          'angularFrequency':{'sourceNode':622801,'provedPositiveIntegerWheneverBandParameterFinitePositive':True,'proof':'epsilon=exp(h*log(Q))>0; k=ceil(1/sqrt(epsilon)) is a finite integer >=1. Q is an exponential of the finite frozen band parameter.'},
          'nonzeroAngularCarriers':{'sourceNodes':[623111,623463],'roundedIntegerSourceNodes':[623109,623462],'provedNonzeroWheneverActualRawCarrierFiniteReal':True,'proof':'j=floor(y+1/2) is integer. The retained source piecewise rule uses j when |j|>=1/2, hence |j|>=1, and uses a sign fallback +/-1 when j=0. Thus |p|=|j_nonzero|/k>=1/k>0 for both actual signs.','actualRawCarrierRealnessPremiseDischarged':False},
          'physicalRadius':{'sourceNode':622802,'proofOnOriginalPositiveAnnulusChart':'R=sqrt(2*s*X)>0 for s in[1/2,2] and X>=Xa/2>0.','allActualCartesianSourceChartMembershipProved':False},
          'frozenC0':{'sourceNode':623008,'growthRadicandSourceNode':623005,'F0SourceNode':622971,'radialGradientSourceNode':622992,'axialGradientSourceNode':622991,'remainingSinglePolynomialInequality':'-2*F0*gR*(gR^2+gZ^2+2*F0*gR)>0','proofReduction':'Let a=gR,b=gZ,G=a^2+b^2. The displayed strict polynomial inequality implies G>0 and 2*F0*a!=0. Then the actual growth radicand equals [-2*F0*a*(G+2*F0*a)]/G>0, and c0=sqrt(radicand)/(2*F0*a/sqrt(G)) is finite and nonzero.','actualOriginalRepresentativeInequalityProved':False}}
        domains=collections.Counter(take(i)['op'] for i in seen)
        source_rows=[[i,take(i)] for i in sorted(seen)];source_hash=hashlib.sha256((canonical(source_rows)).encode()).hexdigest()
        result={'schema':'MathScope.N6.ActualMeanAnalyticContinuation/1','status':'ACTUAL_FRAME_VOLTERRA_GLOBAL_TIME_THEOREM_SOURCE_PREMISES_OPEN','priorRun':38500114302,
          'inputAuthentication':{'headerSHA256':HEADER_SHA,'sourceDAGDatabaseSHA256':DB_SHA,'sourceCaptureSHA256':CAPTURE_SHA,'actualProducerFilesVerified':code,'privateSourceAuthorityRecreatedFromJSON':False},
          'actualCovarianceSystems':systems,'actualCoefficientClosure':{'sourceNodes':len(seen),'work':work,'sourceRowsSHA256':source_hash,'operatorCounts':dict(domains),'expandedDefinitions':definition_rows,'unknownBoundaries':unknown},
          'actualSourceGeometryDischarge':actual_geometry,
          'inheritedFrozenPositivityRoute':{'actualProducer':'research-ide/mathscope-m2/navier/actual-stress-direction-bounds.mjs:frozenRatioBound','sourceDomain':'Original order-zero representative: Xa<=X<=Xb, eta in[-1,1], s in[1/2,2]','retainedClaim':'F>R^-10, a>R^-10, v_s-2>R^-10; c0^2=(v_s-2)/2, |c0|>R^-6, lambda0>R^-31, |g0|>R^-20.','requiredPriorProofs':['S9-S13 actual global leading F lower bound','C12 actual shear gaps and inner collar v_s-2>1/10','O sections8-9 and H19/H22/H25 actual outer/heat slope gaps','actual-leading-high-jets/source natural/B26/heat functions exist on their claimed domains'],'allInheritedPremisesIndependentlyDischargedByThisRun':False,'serializedPriorPassUsedAsProof':False,'newSourceFrozenPositivityCertified':False},
          'frameDenominatorLemma':{'provedAsExactSourceFormulaLemma':True,'premises':['R>0','p != 0','Ls>0','c0 != 0','all retained background/frozen scalar values finite and real'],'identities':['nt^2=(p/R)^2+(pz-epsilon*v*HZ)^2 >= (p/R)^2 > 0','n^2=(x0-v*HR)^2+nt^2 >= nt^2 > 0','root^2=1+u^2*(1/2+v/Ls)^2 >= 1','c=c0*root != 0'],'conclusion':'Every moving-frame denominator is nonzero for every real v. The actual 2x2 frame matrix is C-infinity in v, whenever the listed source scalar premises hold.','actualAllSourceScalarPremisesDischarged':False},
          'volterraGlobalTimeTheorem':{'provedForExplicitContinuousMatrix':True,'candidateSourceNormUpperNeeded':False,'conclusion':'For each admitted fixed source tuple the actual w(v)=e1+sum_n ordered integrals has one unique global real-time solution. Every finite time interval has a finite local coefficient bound by continuity. No finite partial sum is used as the exact solution.','proof':['On |v|<=L let K=sup ||M(v)||_infinity, finite by the frame lemma and continuity. The n-th ordered integral has norm <=(K*L)^n/n!.','The exponential majorant converges uniformly; the same bounds justify time differentiation and give w_prime=M*w and w(0)=e1.','Uniqueness follows from iterating the Volterra difference inequality: ||delta w(v)||<=C*(K*L)^n/n! for every n, hence delta w=0.','Solutions on nested finite intervals agree by uniqueness, giving a global solution for every real v.'],'actualGlobalSourceDomainMembershipProved':False},
          'slowParameterSmoothnessTheorem':{'provedConditionalOnActualBackgroundRegularity':True,'directions':[0,1,2],'frozenParameterIndices':[3,4,5,6],'conclusion':'On each compact admitted slow-parameter neighborhood with the original representative/band/carriers fixed, source C^(m+1) fields make the matrix C^m and the unique exact solution C^m in the three slow directions.','proof':['Let K_m>=1 bound every coefficient derivative of total order <=m on the compact product. Applying m labeled derivatives to a product of n matrices gives at most n^m terms, each bounded by K_m^n.','The differentiated n-th ordered integral is bounded by n^m*(K_m*L)^n/n!. For n>=1 successive majorant ratios are <=2^m*K_m*L/(n+1), hence the series and all derivatives through order m converge uniformly.','The limit derivatives satisfy the full downward-closed variational system with binomial coefficients and the zero derivative of the fixed e1 datum.'],'globalSmoothnessAcrossRoundedFrozenRepresentativesProved':False,'actualBackgroundRegularityPremiseDischarged':False},
          'picardZeroSystem':{'definition':picard,'nilpotentA1MaskProved':mask,'A1A1IdenticallyZeroByBlockSupport':True,'singularAxisDenominators':[1,1,3,1,4,2],'axisFirstCoefficientRule':'w1_i=f_i(0)/(1+c_i), with c=[0,0,2,0,3,1]; all denominators are strictly positive integers.','finiteDimensionalODETheoremAloneApplicable':False,'reason':'A1*partial_eta W is present; this is an analytic-scale Volterra/Picard equation with parameter transport, not a six-dimensional ordinary ODE.','actualAnalyticStripAndCoefficientNormProved':False,'requiredSourcePremises':['A0,A1,forcing holomorphic and uniformly bounded on the retained common eta strip/collar','actual natural/quadratic/background inputs exist and have the claimed strip and norms','retained C1,a,loss positive and Kcondition bounds the actual coefficients, including every nilpotent eta derivative word','the same-source flat/even extension and all requested derivatives remain inside their actual domains']},
          'scope':{'heavyMeanReplayRepeated':False,'frameFiniteTimeBlowupObstructionRemovedConditionally':True,'candidateVolterraNormAuthenticationObligationNeededForExistence':False,'allSourceOperatorsWellDefinedProved':False,'allAnalyticDomainsProved':False,'actualUnconditionalMeanIdentitiesProved':False,'originalN601Complete':False,'originalN602Complete':False,'completeN6':False,'originalCountsChanged':False},'elapsedSeconds':time.monotonic()-start}
        (out/'analytic-mean-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');db.close()
        print(json.dumps({'status':result['status'],'coefficientSourceNodes':len(seen),'unknownBoundaries':len(unknown),'nilpotentMask':mask,'originalN601Complete':False,'originalN602Complete':False}))
    except Exception as error:
        (out/'analytic-mean-failure.json').write_text(json.dumps({'status':'UNRESOLVED','message':str(error),'originalN601Complete':False,'originalN602Complete':False},indent=2)+'\n');raise
if __name__=='__main__':main()
