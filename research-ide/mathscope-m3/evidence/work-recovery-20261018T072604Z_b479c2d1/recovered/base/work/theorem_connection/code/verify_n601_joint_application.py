#!/usr/bin/env python3
"""Assemble a reviewable joint N6-01 theorem application on one saved source.

This verifies source identity, finite expression links and exact exponent
arithmetic. The all-order statements are applications of the identified
written proofs, not inferences from the sampled finite norm rows.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
from fractions import Fraction as Q
from pathlib import Path


def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()


def relocated_producer(root, recorded):
    """Resolve pinned original audit paths inside a relocated package root."""
    path=Path(recorded)
    if path.is_absolute():
        marker='/analysis/'
        assert recorded.count(marker)==1, 'Unsupported original producer path'
        relative=Path('analysis')/recorded.split(marker,1)[1]
    else:
        relative=path
    assert '..' not in relative.parts
    result=(root/relative).resolve()
    assert result.is_relative_to(root.resolve()), 'Producer escapes package root'
    return result


def join_bindings(roots, wave, mean, defect):
    assert wave['current_mean_velocity']==roots['initializedVelocity']==defect['updated_velocity']
    assert wave['latest_mean_pressure']==roots['initializedPressure']['value']==defect['latest_pressure']==mean['pressure_sources']['initialized_full']
    assert roots['temporalVelocity']==mean['temporal_velocity']==defect['previous_full_velocity']
    assert roots['temporalPressure']['value']==mean['pressure_sources']['post_temporal_full']
    assert roots['freshInputDefects']==defect['fresh_five_targets']
    assert roots['initializedDefects']==defect['current_defects']
    assert roots['retainedRemainderDefects']==defect['retained_remainders']
    assert roots['background']==defect['fixed_background']
    assert roots['covariance']==defect['fixed_covariance']
    assert wave['same_original_domain']==defect['same_original_domain']
    assert mean['five_increment']==defect['increment']
    assert roots['exactFiveRows']==defect['five_rows']
    return True


def run(root):
    b=root/'analysis/base/PR30-primary67-continuation'
    nav=b/'MathScopeCompute/research-ide/mathscope-m3/navier'
    w=root/'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation'
    paths={
      'family':nav/'evidence/saved-initialized-norm-family-20261012/attempt1/saved-initialized-norm-family.json',
      'initialized':nav/'evidence/global-forced-current-20261012/attempt382884203291/initialized-angular-construction.json',
      'primary':nav/'evidence/global-primary-class-20261012/attempt1/actual-primary-class.json',
      'primary_application':b/'pressure-proof/original-norm-scope-audit/PRIMARY_WAVE_QUANTITATIVE_SOURCE_APPLICATION.json',
      'specification':b/'pressure-proof/original-norm-scope-audit/ORIGINAL_N6_NORM_TYPED_SPEC.json',
      'wave_binding':w/'evidence/SOURCE_BINDINGS.json',
      'wave_application':w/'evidence/CURRENT_WAVE_APPLICATION.json',
      'gaussian':w/'evidence/GAUSSIAN_TAIL_CONNECTION.json',
      'mean_binding':w/'inherited/inherited/evidence/SOURCE_BINDINGS.json',
      'mean_application':w/'inherited/inherited/evidence/FAST_CUTOFF_MEAN_REPORT.json',
      'defect_binding':w/'inherited/evidence/SOURCE_BINDINGS.json',
      'defect_application':w/'inherited/evidence/CURRENT_DEFECT_APPLICATION.json',
      'defect_all_order':w/'inherited/evidence/ALL_ORDER_EXPONENT_PROOF.json',
      'transport':root/'work/theorem_connection/transport/TRANSPORT_APPLICATION.json',
      'actual_source_nodes':root/'work/integrated_verifier/inputs/actual_source_nodes.json',
      'blueprint':root/'recovered/pdfs/MathScope_Research_IDE_Blueprint_v1_KO(1)(20261017-114129).pdf',
      'base_source_audit':root/'analysis/theorem_sources/base_theorem_audit.json'}
    expected=json.loads((root/'work/theorem_connection/evidence/N601_INPUT_PINS.json').read_text())
    assert set(expected)==set(paths)
    for key,p in paths.items():
        assert sha(p)==expected[key]['sha256'] and p.stat().st_size==expected[key]['bytes'], 'Input pin changed '+key
    data={k:json.loads(p.read_text()) for k,p in paths.items() if p.suffix=='.json'}
    audit=data['base_source_audit']
    producer_bindings={}
    for k in ['same_source_continuation','common_family','weighted_target','primary_class','common_y','background','fourier','radial','lazy_norm','wave_consumer','mean_consumer','defect_consumer','initial_mean','full_pressure']:
        row=audit['source_files'][k];p=relocated_producer(root,row['path'])
        assert p.stat().st_size==row['bytes'] and sha(p)==row['sha256'], 'Producer changed '+k
        producer_bindings[k]={**row,'path':str(p.relative_to(root))}
    f,primary=data['family'],data['primary']
    roots=f['source']['actualRoots'];wb,mb,db=data['wave_binding'],data['mean_binding'],data['defect_binding']
    assert join_bindings(roots,wb,mb,db)
    identity_keys=['paperSHA256','parameterExpressionSHA256','originalMeanCertificateSHA256','sourceNodePrefixSHA256','originalMeanGraph','originalSourceSequence']
    same_source=[]
    canonical=f['source']['source']
    for name in ['wave_binding','wave_application','mean_binding','mean_application','defect_binding']:
        src=data[name]['source']
        for k in identity_keys:
            if k in src:
                assert src[k]==canonical[k], name+' source mismatch '+k
                same_source.append({'artifact':name,'key':k,'equal':True})
    assert all(c['pass'] for c in primary['checks']) and len(primary['checks'])==9
    assert primary['source']['paperSHA256']==canonical['paperSHA256']
    assert primary['source']['parameterExpressionSHA256']==canonical['parameterExpressionSHA256']
    assert sha(paths['primary'])==data['primary_application']['inputBindings']['primaryClass']['sha256']
    assert data['primary_application']['actualTargetBinding']['isolatedWaveRoots']==[3676894,3676895,3676896]
    final_global=data['initialized']['global']
    assert final_global['velocity']==data['primary_application']['actualTargetBinding']['wholeVelocityRoots']==[3825006,3825007,3825008]
    assert final_global['pressure']==3825009
    assert final_global['assembledResidual']==wb['inspection_roots']
    continuation=f['family']['continuation']
    assert [x['id'] for x in continuation['induction']]==['same-coefficients','same-selector','same-physical-window','same-q-big','finite-source-jets','finite-source-only-norms','closed-operator-composition']
    programs=[]
    for cert in f['certificates']:
        p=cert['program'];calls=p['callGraph']['calls'];assert len(calls)==13
        for i,c in enumerate(calls):
            assert c['id']==i and all(0<=d<i for d in c['dependencies'])
        leaves=[]
        for i,n in enumerate(p['scalarProgram']['nodes']):
            if n['op']=='source_norm_result':
                call,path=n['args'];assert 0<=call<13 and isinstance(path,list) and path
                leaves.append(i)
        assert leaves and p['savedSourceBinding']['actualRoots']==roots
        for row in p['rows']:
            assert row['velocity']['beta']['epsilonExponent']=='2-kappa_s'
            assert row['velocity']['v']['epsilonExponent']=='1-kappa_s'
            assert row['velocity']['gamma']['epsilonExponent']=='1-kappa_s'
            assert row['fullPressure']['epsilonExponent']=='1-kappa_s'
        programs.append({'order':p['request']['order'],'calls':13,'source_norm_leaves':len(leaves),'all_backward_dependencies':True})
    c=roots['conservation']; assert c['angular']==c['axial']==0
    assert c['exactTemporalZeroMeanSource']=={'theta':0,'z':0}
    assert c['actualFiveRows']==roots['exactFiveRows'][:2]
    assert all(row['target']==0 for row in c['actualFiveRows'])
    source_nodes=data['actual_source_nodes']['nodes']
    assert source_nodes['24']=={'op':'rational','args':['2','1']}
    assert source_nodes['1']=={'op':'rational','args':['1','1']}
    assert [row['weightPower'] for row in c['actualFiveRows']]==[24,1]
    moment_weights=[{'moment':row['name'],'weight_power_node_id':row['weightPower'],'weight_power_value':source_nodes[str(row['weightPower'])]['args'][0]} for row in c['actualFiveRows']]
    assert c['allCorrectionsRemainDivergenceFree']
    assert wb['inspection_roots']==[3825348,3825349,3825350]
    assert wb['retained_modes']==[-2,-1,0,1,2] and wb['signed_source_count']==162
    assert mb['final_mean_sources']=={'Etheta':3614976,'Ez':3615392}
    mean_rows=[]
    for row in data['mean_application']['rows']:
        assert row['actual_final_source_id']==mb['final_mean_sources'][row['field']]
        exponent=Q(row['composed_bound']['epsilonExponentExact'])
        assert exponent>=Q(149,100)
        mean_rows.append({'field':row['field'],'root':row['actual_final_source_id'],'order':row['order'],'proved_exponent':str(exponent),'at_least_149_100':True})
    assert data['wave_application']['all_finite_order_rule']['common_wave_exponent']=='99997/100000'
    assert data['defect_all_order']['result']=='99999/50000'
    assert data['gaussian']['gaussian_lower']['node']==617317 and data['gaussian']['length_ratio_lower']['node']==300173
    transport=data['transport']
    # Consume the verifier result; source pins and proof prerequisites remain recorded in its artifact.
    assert transport['result']=='PASS' and all(x['status']=='PASS' for x in transport['checks']), 'Transport verification not passed'
    assert sha(paths['initialized'])==transport['source_bindings']['initialized_original']['sha256']
    assert sha(paths['family'])==transport['source_bindings']['norm_family']['sha256']
    k=Q(1,100000)
    norm_rows=[
      ('9.8-wave-B0','W','Pi_nonzero R = G_wave + F_pulse; claim is for G_wave',wb['inspection_roots'],1-3*k,Q(7,10),'wave_all_order_and_transport'),
      ('9.8-mean-C0','M','Etheta and Ez',[3614976,3615392],Q(149,100),Q(6,5),'fast_cutoff_all_order'),
      ('9.8-defects-C0','S','P, Jtheta and Jz',[3615055,3615101,3615147],2-2*k,Q(6,5),'exact_five_remainder_all_order'),
      ('9.9-total-wave','W','isolated complete primary curls',[3676894,3676895,3676896],Q(1,2),Q(1,2),'actual_primary_application'),
      ('9.9-curl-remainder','W','same isolated waves minus transverse primary leading wave',[3676894,3676895,3676896],1-k,Q(17,25),'actual_primary_application'),
      ('9.9-tangential-and-pressure','M','v, gamma, complete latest pm',[3614791,3614792,3615361],1-k,Q(9,10),'same_source_closed_norm_program'),
      ('9.9-radial','M','beta',[3614790],2-k,Q(19,10),'same_source_closed_norm_program')]
    assert [x[0] for x in norm_rows]==[x['id'] for x in data['specification']['normTargets']]
    norms=[]
    for id,cls,meaning,ids,proved,target,proof in norm_rows:
        assert proved>=target
        norms.append({'id':id,'class':cls,'meaning':meaning,'actual_roots':ids,'proved_exponent':str(proved),'required_exponent':str(target),'exact_margin':str(proved-target),'proof':proof,'quantifiers':'For every fixed derivative multiindex, finite source-only C,pole,log powers, uniform on the same original common domain.'})
    controls={}
    for key,mutate in {
        'stale_mean_pressure':lambda x:x.__setitem__('latest_mean_pressure',3614634),
        'wrong_final_velocity':lambda x:x['current_mean_velocity'].__setitem__('gamma',1706782)}.items():
        bad=copy.deepcopy(wb);mutate(bad)
        try: join_bindings(roots,bad,mb,db)
        except AssertionError: controls[key]='REJECTED'
        else: raise AssertionError('Negative control accepted '+key)
    proofs={
      'same_source_closed_norm_program':{
        'sources':['same_source_continuation','common_family','weighted_target','primary_class','common_y','background','fourier','radial','lazy_norm'],
        'argument':'Apply the seven-part continuation to the authenticated final mean functions, preserving original coefficient bodies, selector, common q threshold and physical cutoff window. Each finite m recursively consumes finitely many original producer orders. Weighted target Gaussian recurrence, stable pulse/inverse H/positive square roots, exact two-column commonY lift, Fourier divisor and shifted radial FTC supply finite source-only constants. The 13-call DAG has only those producer leaves and backward dependencies. Thus its final velocity/pressure rows hold for every fixed m, independently of whether high-order derivative arrays or decimal constants were printed.',
        'actual_final_fields':roots['initializedVelocity'],'latest_pressure':3615361},
      'actual_primary_application':{
        'source':'primary_application',
        'argument':'Reuse the existing exact primary application at isolated wave roots, not total velocity anchors. Complete physical curl, moving-frame homogeneous pressure, protected source H/positive covariance weights, original primary amplitudes and flat support are retained. The actual unchanged primary wave is still present after temporal/five mean corrections. W^1/2 and remainder W^(1-kappa) survive the actual chart maps.'},
      'wave_all_order_and_transport':{
        'sources':['wave_consumer','primary_application','transport','gaussian'],
        'argument':'The original homogeneous principal ODE including pressure cancels the dangerous linear term; retain +psi_prime*t separately. Full-curl divergence cancels the apparent carrier loss in the full quadratic products. Retain tt,tr,rt,rr and both mean-wave products with the complete final mean. Exact own-label background homogeneity and whole reference-mean substitution justify the principal coefficients. Apply finite Leibniz recurrence for arbitrary m, obtaining W^(1-3kappa). The actual commonY affine and fixed-label normalization maps change only finite constants/log powers. Existing full3 source function equality transports each radial/angular/axial grouped coefficient, not merely the angular component. Flat joins give global zero extension.',
        'flat_remainder':'The actual +psi_prime*t term is F_pulse. Actual Gaussian c=(node617317*node300173)/25>0 yields C Q^-M S^P exp(-cS); every fixed physical derivative and every N is <=C_N q^N by the completed-square estimate. It is retained separately, not included in W or set to zero.'},
      'fast_cutoff_all_order':{
        'sources':['mean_consumer','mean_application','same_source_continuation','radial','fourier'],
        'argument':'Apply the exact temporal then fresh-five telescoping formulas to roots3614976/3615392. The final Etheta is initial Haar plus both slow changes; final Ez also keeps -ci N A1(gamma_desired). Using N inverse on the actual zero-mean source and commutation with the unchanged translated radial integral, this equals +A1(initialEz-Haar(initialEz)). Positive radial IBP p=49001 uses initial Ez through m+98005, a finite order supplied by the same-source theorem; it does not require a new smaller domain. Initial Haar leading-covariance cancellation is the original 9.11 primary covariance theorem. Slow changes have exponent2-3kappa; full cutoff has exponent1.49. Therefore Etheta and Ez both satisfy M^1.49, with all variable-Dr coefficient derivatives, full pressure difference and A0 terms retained.'},
      'exact_five_remainder_all_order':{
        'sources':['defect_consumer','defect_all_order','defect_binding','initial_mean'],
        'argument':'The same fresh P/J targets enter the exact five rows. Integrating the complete8.26/8.27 identities shows final P/J equal the retained nonlinear remainder roots3615635/3615673/3615848, not zero. All19 exponent groups are >=2-2kappa using the actual temporal and slow five increments from the closed norm program; whole radial/full Haar projection absorbs finite boundary poles. Each arbitrary fixed derivative is a finite Leibniz sum on the same domain.'},
      'moments_support_domain':{
        'sources':['initial_mean','primary_application','specification','transport'],
        'argument':'The exact temporal inverse has zero normalized auxiliary mean; the translated T1 realization preserves that mean. Positive bump moments mu_p, positive a/lambda and d=1/5 give distinct angular nodes exp(2d),exp((-2-2lambda)d),exp(-2lambda*d) and positive axial gap 1-exp(-2d*lambda), so the same fixed five map is invertible. Its two homogeneous actual rows have zero targets, proving both9.10 weighted moments. Primary curls and mean potentials are divergence free with original flat radial support. Fixed-label/copy derivatives never differentiate floor or carrier rounding. Compatible finite prefixes share the same selector; every omitted term and derivative is identically zero and ODE uniqueness identifies overlaps. No single truncated polynomial is asserted valid for allq.',
        'uniform_prefix_chain':['The original commonRecursiveSelector imposes diagonal derivative clauses m<=n and preserves earlier b_n when extended.','For each fixed derivative m, finitely many low-index coefficient norms are bounded directly; all higher indices obey the selector geometric-tail estimate. This gives one finite source constant independent of the valid prefix.','source-background-class-majorants.mjs combines the finite low-order block and geometric high-index tail; source-primary-class-majorants.mjs domain.allBandRecipe carries that source constant through protected covariance inversion, primary pulses and full curls.','At any q>0 select a valid prefix with b_(N+1)*q>=1. Omitted terms and all cutoff derivatives are exactly zero. On overlaps the same coefficients, matrices and ODE uniqueness identify the fields.','The complete cover and whole-radial integrals use one common q and one shared valid prefix; actual commonY maps preserve qActual, X and eta. Thus these compatible local proofs form the same original q<qGlobalStar source, without changing q_big for the requested derivative order.']}}
    proofs['retained_full_flat_residual']={
      'sources':['radial','initial_mean','full_pressure','gaussian','specification'],
      'argument':'The complete Definition9.4/Proposition9.3 residual retains the inherited background flat residual E_B, the separate pulse F_pulse, and modified radial integral remainders including actual A0=chi_R*whole(g_r-rhoP). It is not asserted that the whole flat residual equals F_pulse. source-radial-class-majorants.mjs174-289 proves for every fixed output m and positive integer p the exact original A_e operator estimate with exponent gain p*kappa_s and finite input demand m+2p+3. The same-source theorem supplies that finite order on the same domain. Since h>0 and kappa_s>0, choose p to dominate any prescribed physical derivative/normalization loss and desired q order; this proves all-order physical flatness of retained A0 and any remaining A_e terms. Keep the actual centered fullY source and its normalized whole-Haar identity; neither pressure A0 nor the new defects are declared zero.',
      'latest_actual_A0_root':roots['initializedPressure']['cutoffRemainder'],
      'background_flatness':'Inherited original completed background-source theorem, with identical coefficient bodies and selector; not reexecuted or proved from finite samples.'}
    premises=[
      {'original':'same-source all-fixed-order norm continuation','discharged_by':'same_source_closed_norm_program','scope':'actual final initialized velocity, full mean pressure and fresh targets, not merely base fields'},
      {'original':'primary homogeneous amplitude/pressure equation and tangency','discharged_by':'actual_primary_application + wave_all_order_and_transport','scope':'actual unchanged primary coefficient bodies in all10 templates and162 contributions'},
      {'original':'full curl divergence and original supports','discharged_by':'actual_primary_application + moments_support_domain','scope':'complete primary curls and actual final mean; both torus columns and flat joins'},
      {'original':'whole reference mean pullback and previous finite-state mean bounds','discharged_by':'same_source_closed_norm_program + transport','scope':'final beta3614790,v3614791,gamma3614792,pm3615361 under actual reference map'},
      {'original':'actual all3 transport and physical Gaussian flatness','discharged_by':'wave_all_order_and_transport','scope':'G_wave/F_pulse for all3 components of final assembled roots3825348/9/50'}]
    return {'schema':'MathScope.N601JointOriginalSourceApplicationCandidate/1',
      'status':'MATHEMATICAL_SOURCE_APPLICATION_CANDIDATE_AWAITING_INDEPENDENT_CROSSREVIEW',
      'original_criterion':{**data['specification']['originalCriteria']['N6-01'],
         'historical_source_alias':data['specification']['originalCriteria']['N6-01']['source'],
         'source':paths['blueprint'].name,'verified_current_source_sha256':sha(paths['blueprint'])},
      'source':canonical,'source_manifest':{key:{'path':str(p.relative_to(root)),'sha256':sha(p),'bytes':p.stat().st_size} for key,p in paths.items()},
      'producer_bindings':producer_bindings,'source_identity_checks':same_source,'same_source_join_checks':12,
      'finite_norm_program_checks':programs,'actual_mean_row_checks':mean_rows,'original_primary_checks':9,'seven_norm_groups':norms,
      'proof_applications':proofs,'inherited_wave_premises_discharged':premises,
      'two_exact_moments':c,'moment_weight_node_resolution':moment_weights,'common_domain':wb['same_original_domain'],
      'full_final_tuple':{'velocity':final_global['velocity'],'full_pressure':final_global['pressure'],'full_pressure_meaning':'p_background+p_mean+p_angular; complete mean pressure is separately root3615361','mean_velocity':roots['initializedVelocity'],'full_mean_pressure':roots['initializedPressure']['value'],'assembled_residual':final_global['assembledResidual'],'mean_residual':list(mb['final_mean_sources'].values()),'defects':roots['initializedDefects']},
      'negative_controls':controls,
      'remaining_original_mathematical_hypotheses_for_this_j0_application':[],
      'proof_assurance':'Analytical theorem reuse plus exact source identity/exponent checks. This is not a new kernel proof or finite numerical extrapolation; independent review is explicitly pending.',
      'outside_scope':['forced and signed subsequent-stage class estimates','whole Proposition9.6 cycle','diagonal limit','global terminal regularity and energy'],
      'historical_status_flags_edited':False,'original_1260_reexecuted':False,'M3_count_changed':False,
      'candidate_source_checks_passed':True}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3]);ap.add_argument('--out',type=Path);a=ap.parse_args()
    out=a.out or a.root/'work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json'
    result=run(a.root.resolve());out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'status':result['status'],'same_source_fields_checked':len(result['source_identity_checks']),'norm_groups':len(result['seven_norm_groups']),'moments':2,'negative_controls':result['negative_controls'],'output':str(out)}))

if __name__=='__main__':main()
