#!/usr/bin/env python3
"""Source-bound analytic application; no original roots or private seals changed.

Exact rational checks and a Cartesian differential identity are machine checked.
The cited source theorems remain analytical proof dependencies. This does not
turn existence of seminorm constants into an implemented numerical evaluator.
"""
from pathlib import Path
from fractions import Fraction as Q
import argparse, copy, hashlib, json
from source_recursive_family import SourceFamily

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'work/remaining_chain/evidence'
INITIAL=ROOT/'work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json'
REPLAY=ROOT/'work/remaining_chain/EXISTING_ITERATION_PROGRAM_REPLAY.json'
PAPER='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
PROFILE='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
EXPECTED={
'9.8-wave-B0':([3825348,3825349,3825350],'7/10'),
'9.8-mean-C0':([3614976,3615392],'6/5'),
'9.8-defects-C0':([3615055,3615101,3615147],'6/5'),
'9.9-total-wave':([3676894,3676895,3676896],'1/2'),
'9.9-curl-remainder':([3676894,3676895,3676896],'17/25'),
'9.9-tangential-and-pressure':([3614791,3614792,3615361],'9/10'),
'9.9-radial':([3614790],'19/10')}

def require(ok,msg):
    if not ok: raise ValueError(msg)

def manifest(path):
    data=path.read_bytes()
    try:display_path=str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:display_path=str(path.resolve())
    return {'path':display_path, 'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}

def bind_initial(x):
    require(x['source']['paperSHA256']==PAPER,'different original paper')
    require(x['source']['parameterExpressionSHA256']==PROFILE,'different fixed source parameters')
    require(len(x['seven_norm_groups'])==7,'missing Definition9.4 norm group')
    rows=[]
    for row in x['seven_norm_groups']:
        roots,minimum=EXPECTED[row['id']]
        require(row['actual_roots']==roots,'stale or substituted actual initial roots')
        require(Q(row['required_exponent'])==Q(minimum),'changed original target exponent')
        margin=Q(row['proved_exponent'])-Q(minimum)
        require(margin>=0,'initial exponent insufficient')
        rows.append({'id':row['id'],'actual_roots':roots,'exact_margin':str(margin)})
    tuple_=x['full_final_tuple']
    require(tuple_['velocity']==[3825006,3825007,3825008] and tuple_['full_pressure']==3825009,'wrong full initial tuple')
    require(tuple_['full_mean_pressure']==3615361,'stale full mean pressure')
    require(x['two_exact_moments']['angular']==0 and x['two_exact_moments']['axial']==0,'original moments missing')
    require('retained_full_flat_residual' in x['proof_applications'],'background/pulse/radial flat residual absent')
    require(x['proof_applications']['retained_full_flat_residual']['latest_actual_A0_root']==3615362,'wrong actual radial flat remainder')
    require(x['common_domain']['commonSequenceReplaced'] is False,'original selector changed')
    require(x['remaining_original_mathematical_hypotheses_for_this_j0_application']==[], 'initial mathematical hypotheses still open')
    return rows

class Poly:
    """Exact differential polynomials in arbitrary smooth scalar functions."""
    def __init__(self, terms=None): self.terms={k:v for k,v in (terms or {}).items() if v}
    @staticmethod
    def scalar(x): return Poly({():Q(x)})
    @staticmethod
    def atom(name): return Poly({((name,(0,0,0,0)),):Q(1)})
    def __add__(self,other):
        other=other if isinstance(other,Poly) else Poly.scalar(other)
        out=dict(self.terms)
        for k,v in other.terms.items():out[k]=out.get(k,Q(0))+v
        return Poly(out)
    __radd__=__add__
    def __neg__(self):return Poly({k:-v for k,v in self.terms.items()})
    def __sub__(self,other):return self+-other if isinstance(other,Poly) else self+(-Q(other))
    def __rsub__(self,other):return (-self)+other
    def __mul__(self,other):
        other=other if isinstance(other,Poly) else Poly.scalar(other);out={}
        for a,x in self.terms.items():
            for b,y in other.terms.items():
                k=tuple(sorted(a+b));out[k]=out.get(k,Q(0))+x*y
        return Poly(out)
    __rmul__=__mul__
    def d(self,index):
        out={}
        for monomial,coefficient in self.terms.items():
            for i,(name,multi) in enumerate(monomial):
                counts=list(multi);counts[index]+=1
                key=tuple(sorted(monomial[:i]+((name,tuple(counts)),)+monomial[i+1:]))
                out[key]=out.get(key,Q(0))+coefficient
        return Poly(out)

def localization_identity():
    c=Poly.atom('c');u=[Poly.atom('u'+str(i)) for i in range(3)]
    A=[Poly.atom('A'+str(i)) for i in range(3)];p=Poly.atom('p')
    dc=[c.d(i) for i in range(3)]
    w=[dc[(i+1)%3]*A[(i+2)%3]-dc[(i+2)%3]*A[(i+1)%3] for i in range(3)]
    lap=lambda f:sum(f.d(i).d(i) for i in range(3))
    adv=lambda a,f:sum(a[k]*f.d(k) for k in range(3))
    R=lambda a,b:[a[i].d(3)-lap(a[i])+adv(a,a[i])+b.d(i) for i in range(3)]
    base=R(u,p);actual=[c*u[i]+w[i] for i in range(3)];full=R(actual,c*p)
    decomposition=[]
    for i in range(3):
        decomposition.append(c*base[i]+c.d(3)*u[i]-lap(c)*u[i]
            -2*sum(dc[k]*u[i].d(k) for k in range(3))
            +w[i].d(3)-lap(w[i])+(c*c-c)*adv(u,u[i])
            +c*adv(u,c)*u[i]+c*adv(u,w[i])+c*adv(w,u[i])
            +adv(w,c)*u[i]+adv(w,w[i])+p*dc[i])
    require(all(not (full[i]-decomposition[i]).terms for i in range(3)),
            'localization omitted a Cartesian product term')
    bad=full[0]-(decomposition[0]-p*dc[0])
    require(bool(bad.terms),'negative pressure-commutator test failed')
    return {'operator':'u=c*u_loc+grad(c) cross A; p=c*p_loc',
        'source':'(10.4)-(10.5), pp118-120; actual cutoff source-localization.mjs',
        'all_three_components_exact_zero':True,'nonzero_functions_used':True,
        'expanded_monomials':[len(v.terms) for v in full],
        'negative_omitted_pressure_commutator':'REJECTED',
        'decomposition':'c*f_loc+c_t*u_loc-(Delta c)*u_loc-2 sum_i c_i partial_i u_loc+w_t-Delta w+(c^2-c)(u_loc dot grad)u_loc+c*(u_loc dot grad c)*u_loc+c*(u_loc dot grad)w+c*(w dot grad)u_loc+(w dot grad c)*u_loc+(w dot grad)w+p_loc*grad c; w=grad c cross A',
        'actual_field_values_evaluated':False,'identity_applies_to_same_named_final_A_B_p':True}

def source_window(J=3,m=1):
    require(J>=max(1,m),'Lemma5.4 requires J>=max(1,m)')
    M=J+2
    return {'fixed_comparison_stage':J,'derivative_order':m,'first_inactive_stage':M,
        'q_window':{'lower':f'exp(-L_{M})','upper':f'2*exp(-L_{M})','closed':True},
        'possibly_active_correction_indices':list(range(1,M)),
        'initialization':'Z0/base retained separately, not counted as a correction index',
        'cutoffs_exactly_one':list(range(1,J+1)),
        'possibly_transition_indices':[J+1],
        'all_indices_ge_M_exactly_zero':True,
        'proof':['L_M-L_J>=2; e>2 gives 2*exp(L_J-L_M)<1/2, so the first J cutoffs are one.',
            'q>=exp(-L_M) and increasing L imply a_j*q>=1 for all j>=M, including endpoint chi(1)=0.',
            'L_M>=1+log(1/qbig); e>2 gives qmax=2*exp(-L_M)<qbig.',
            'For m<=j, source cutoff bounds give 2^-j*q^(g_j/2-ellPrime_m); sum over j>J gives2^-J*q^(g_(J+1)/2-ellPrime_m).'],
        'tail':{'coefficient':str(Q(1,2**J)),'exponent':f'h*{J+1}/20-ellPrime_{m}',
            'comparison':'same ONE fixed uncut U^[J]','all_flat_residuals_summed':False},
        'multiplier_integer_requirement':'None: original Lemma5.4 asks a_(j+1)>=2*a_j, not integer a_j.',
        'cutoff_norm_family':'actual C-hat_(j,m),P-hat_(j,m) from Z_j with all cutoff/curl derivatives, m<=j',
        'scale_recursion':'L_j=max(1,L_(j-1)+1,1+log(1/qbig),max_(0<=m<=j)(2*P-hat_(j,m)/(h*j/20))^2,max_(0<=m<=j)2*(C-hat_(j,m)+j)/(h*j/20)); a_j=exp(L_j)',
        'analytical_hypothesis':'Actual finite C-hat,P-hat bounds guaranteed by stage theorem and product rule; to evaluate this selector one must produce those source-specific constants.',
        'symbolic_window_and_tail_proved':True,'endpoints_numerically_evaluated':False,
        'existing_finite_source_constant_dispatcher_complete':False,
        'not_a_generic_rational_fixture':True,'whole_N608_closed_here':False}

def terminal_choice(j):
    require(isinstance(j,int) and j>=0,'nonnegative terminal order needed')
    pairs=[(a,m) for a in range(j//2+1) for m in range(j//2-a+1)] if j else []
    require(all(j-m>0 for a,m in pairs),'differentiated tail power is not negative')
    return {'j':j,'all_required_pairs':pairs,
        'actual_norm_functionals':[{'a':a,'meaning':f'N_({j},{a})=||F_{j}||_C^{a}(K)',
            'field':'same force R(curl(c A)+c B e_theta,c p_loc)',
            'finite_by':'Lemma10.2 plus compact K','numerical_value':None} for a in range(j//2+1)],
        'choice':'b0=1' if not j else f'b_{j}=min{{b in N: b>b_{j-1} and C_({j},m)*b^(m-{j})*N_({j},a)<=2^-{j} for every listed(a,m)}}',
        'explicit_sufficient_upper_choice':None if not j else f'ceil(max(b_{j-1}+1,max_(a,m) exp(log(2^{j}*C_({j},m)*(1+N_({j},a)^2))/({j}-m))))',
        'integer_set_nonempty':True,'norms_not_replaced_by_sample_maxima':True,'integer_numerical_value':None}

def build():
    x=json.loads(INITIAL.read_text()); r=json.loads(REPLAY.read_text())
    initial_checks=bind_initial(x)
    family_pin=x['source_manifest']['family'];family_path=ROOT/family_pin['path']
    require(manifest(family_path)['sha256']==family_pin['sha256'],'actual normFamily hash mismatch')
    actual_roots=json.loads(family_path.read_text())['source']['actualRoots']
    family=SourceFamily(x['full_final_tuple'],manifest(INITIAL)['sha256'],actual_roots)
    for j in range(5):family.successor(j)
    scales=family.schedule(5);recursive=family.export()
    recursive['concrete_window_scale_nodes']=scales
    recursive['source_norm_family']=manifest(family_path)
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json').write_text(json.dumps(recursive,ensure_ascii=False,indent=2)+'\n')
    # Changing actual predecessor data, even while retaining old descriptor ID,
    # must fail. The public graph is a recipe, not an original private seal.
    bad=copy.deepcopy(family)
    target=next(n for n in bad.nodes if n['operation']=='OriginalSignedMap')
    target['data']['input_current']=bad.stages[0]
    try:bad.validate()
    except ValueError:recursive_negative='REJECTED'
    else:raise AssertionError('stale actual successor source accepted')
    require(r['sourceBinding']['paper']['sha256']==PAPER and r['sourceBinding']['parameterExpressionSHA256']==PROFILE,'domain uses another source')
    require(all(c['pass'] for c in r['checks']),'recorded source-domain replay failed')
    affine=[]
    for row in r['program']['algebra']['checks']:
        c=Q(row['margin']['constant']);a=Q(row['margin']['slope'])
        require(a>=0 and (c>0 if row['strict'] else c>=0),'all-stage affine exponent failed')
        affine.append({'id':row['id'],'intercept':str(c),'slope':str(a),'strict':row['strict'],'all_j_ge_zero':True})
    # Only actual input mutations; no replacement mathematical scenario.
    negatives={}
    for name,change in [('stale_pressure',lambda a:a['full_final_tuple'].__setitem__('full_mean_pressure',3614793)),
        ('missing_full_flat_term',lambda a:a['proof_applications'].pop('retained_full_flat_residual')),
        ('wrong_initial_wave',lambda a:a['seven_norm_groups'][0].__setitem__('actual_roots',[0,0,0]))]:
        bad=copy.deepcopy(x);change(bad)
        try:bind_initial(bad)
        except (ValueError,KeyError):negatives[name]='REJECTED'
        else:raise AssertionError(name)
    files=['source-global-current.mjs','source-global-forced-current.mjs','source-global-signed.mjs','source-global-class.mjs','source-forced-class-majorants.mjs','source-global-temporal.mjs','source-global-initial-mean.mjs','source-iteration-decay.mjs','source-localization.mjs','source-exterior-force-jets.mjs','shrinking-cutoff-summation.mjs','final-summation/source-final-summation.mjs','terminal-extension/source-terminal-cutoff-schedule.mjs']
    output={'schema':'MathScope.ActualRemainingChainAnalyticApplicationCandidate/1',
        'status':'ANALYTICAL_SOURCE_APPLICATION_AWAITING_INDEPENDENT_REVIEW',
        'initial_source':manifest(INITIAL),'source_program_replay':manifest(REPLAY),
        'source_files':[manifest(ROOT/'work/remaining_chain/source'/f) for f in files],
        'initial_tuple':x['full_final_tuple'],'initial_root_and_exponent_checks':initial_checks,
        'source_domain':r['sourceDomain'],'same_parameter_expression_SHA256':PROFILE,
        'domain_binding_scope':'Identical original paper/profile and common family, with original qbig witness. No claim that node IDs in different source graphs are interchangeable.',
        'N607':{'proof_status':'ANALYTIC_INDUCTION_CANDIDATE',
            'state_definition':'State(j) is Definition9.4 with complete original background+all prior corrections, (9.8),(9.9),(9.10), supported/flat decomposition of Prop9.3 and complete pressure. State(0) is the exact source tuple listed above.',
            'successor':'State(j+1)=Refresh(Five(Refresh(Temporal(Refresh(Signed(Refresh(Forced(State(j)))))))))',
            'refresh':'Recompute full gr by(8.3), P=int Haar(gr)dR, pm=T0(gr-rho*P); compute every next residual/defect from latest fields. Preserve background, pulse and radial flat remainders.',
            'generic_operator_applications':[
                {'name':'forced','references':['Prop7.2','Prop9.6 step1 p108','Lemma9.7 pp111-112'],
                 'input':'every grouped supported nonzero residual coefficient of current state, all generated harmonics and conjugates',
                 'output':'zero entrance data inverse on fixed path, full curl and complete inhomogeneous pressure',
                 'domain':'fixed original coefficients; harmonic damping exp(-(m^2-1) int d)<=1; no derivative/harmonic/stage domain shrink'},
                {'name':'signed','references':['(7.35)-(7.41)','Prop9.6 step2 pp108-110'],
                 'input':'physical Haar averaged current tangential residual after subtracting its actual weighted moments',
                 'output':'compact primitive Sigma, original fixed H and 2sqrt(y_sigma) division, homogeneous pressure, all three covariance remainders',
                 'invariants':'no new covariance square root; zero total weighted moments make primitive supported; physical construction agrees across charts'},
                {'name':'temporal','references':['Lemma8.6','(8.20)','Prop9.6 step3 p110'],
                 'input':'current exact Etheta/Ez minus their full auxiliary Haar averages',
                 'output':'zero mean torus inverse; axial potential realization; actual axial increment and Fax both retained'},
                {'name':'five','references':['(8.25)-(8.27)','Prop9.6 step4 p111'],
                 'input':'new P,Jtheta,Jz after temporal pressure refresh',
                 'output':'fixed five-map preserving two homogeneous moments; actual nonlinear defect remainders; pressure refreshed again'}],
            'closing_argument':'Prop9.3 applies to each updated supported smooth state, hence supplies next-cycle supported source and flat decomposition. Prop9.6 preserves Definition9.4; Lemma9.7 provides the common domain for arbitrary source size and finite derivative demands. Lemma9.8 then applies to this recursively defined same-source sequence.',
            'affine_exponent_checks':affine,'sigma_j':'1/5+j/10','g_j':'h*j/10',
            'ell_m':'2A+(m+1)*(1+3h/2)',
            'K_m':'stage-independent sufficient loss of Lemma9.8; existing conservative choice2A+1/2+(m+2)*(1+3h/2) retains its source-amplitude premises',
            'C_jm_and_log_powers':'For each finite j,m, finite source-dependent C_(j,m),P_(j,m) follow by finite compositions of these class estimates. They are never set to1 or0; an existing implemented recurrence producing their actual scalar roots for every successor was not found.',
            'numerical_state_evaluator_constructed':False,'no_infinite_array_requirement':True,
            'mathematical_dependency':'Acceptance of the source-bound N601 application and generic original theorem applications above; not acceptance of a historical boolean.'},
        'N608':source_window(),
        'localized_force_identity':localization_identity(),
        'N704':{'proof_status':'CONDITIONAL_ACTUAL_FAMILY_APPLICATION',
            'required_identification':'Use exactly the final A,B,p defined by the same recursive state and a_j schedule; match source-localization original cutoff/domain constants. This final-family adapter is not supplied by existing scalar/field consumers.',
            'same_field_formula':'f=R(curl(c*A)+c*B*e_theta,c*p_loc)',
            'whole_K_argument':['Away from the origin where q has positive lower bound: local finiteness and fixed-label all-order endpoint bounds on closed eta interval give uniform one-sided derivative limits by one further time derivative and FTC.',
                'Where r>0 and q is small: A=0 and exact exterior heat K(r,tau) and pressure integral give all-order dominated convergence at tau=0, including all cutoff terms.',
                'Near origin c=1. Residual flatness for X<=Xext and exact zero exterior residual yield |partial_x^alpha partial_t^j f|<=C_(alpha,j,N)*(tau+|z|^(1/D))^N.',
                'Choose small ball then late time; finite cover of remaining compact K gives uniform convergence on allR3. Spatial/time FTC identifies compatible Fj and every derivative; all vanish at origin.'],
            'actual_F_j':'uniform limit as t increases to1 of partial_t^j of the same localized force',
            'origin_derivatives':'partial_x^alpha F_j(0)=0 for all alpha,j, by original flat estimate, never assigned sample zero',
            'finite_numerical_jets_computed':False,'whole_K_norm_values_evaluated':False,
            'unresolved':'Same final cutoff family must be completely selected and identified; no claim from exterior-only jet data or toy maxima.'},
        'N705':{'proof_status':'CONDITIONAL_ON_SAME_ACTUAL_F_J_FROM_N704',
            'all_order_choice':'Use original min-integer rule(10.12) for actual finite C^a(K) norms, not finite sample maxima.',
            'finite_prefix_formula_records':[terminal_choice(j) for j in range(7)],
            'all_order_proof':'For each fixed(a,m), every j>=2(a+m) has differentiated term<=2^-j. Uniform convergence of every differentiated tail follows; at sigma=0 only j=m contributes F_m. Each term keeps compact K and vanishes for sigma>=1. Thus force alone extends smoothly through1 and has support Kx[0,2].',
            'norm_functionals_are_not_evaluated_source_constants':True,'velocity_extended':False},
        'N706':{'analytic_energy_identity':'Compact support, divergence-free u and f=R(u,p) yield d(||u||2^2/2)/dt+||grad u||2^2=<f,u>; initial u=0 gives(10.13).',
            'unresolved_original_clause':'WholeK independent spatial/time numerical refinement and normalized defect table require actual localized field/force evaluator and quadrature+tail bounds. No such table is produced here.','closed':False},
        'N805':{'unresolved_original_clause':'Actual final field at chosen positive source tau with independently doubled spatial grid, Fourier cutoff, coefficient order and precision, complete active selectors and separate tails. Existing initial/inner ray data do not evaluate that field.',
            'last_resolved_actual_tau':None,'closed':False},
        'implementation_obstructions':[
            {'source':'source-global-forced-current.mjs:152-170','fact':'accepts only privately sealed GlobalInitializedAngular; explicitly iterates positive m in[1,2], not arbitrary later harmonics'},
            {'source':'source-global-current.mjs:95-119','fact':'buildGlobalMeanState initializes beta,v,gamma to zero; cannot be used unchanged as general updated-mean reconstruction'},
            {'source':'source-global-signed.mjs:164 and source-global-current.mjs:269','fact':'signed expects original GlobalCurrentState private seal, which actual forced successor does not own'},
            {'source':'source-global-class.mjs:64-67','fact':'signed degree program starts W=wave.curl and E=wave.curl from primary data; not a proved producer for arbitrary updated-current seminorm inputs'},
            {'source':'source-forced-class-majorants.mjs:38-120','fact':'genuine generic forced recurrence preserves inputW seminorm/S degree; caller must supply correctly pulled actual current input bounds'},
            {'source':'final-summation/source-final-summation.mjs; terminal-extension/source-terminal-cutoff-schedule.mjs','fact':'source-compatible exact consumers are ready; their supplied norm/field provenance remains a mathematical input, not numeric values automatically authenticated by scalar-root shape'}],
        'negative_controls':{**negatives,'stale_successor_current':recursive_negative},
        'evidence_scope':'New analytic source application and exact algebra only; no kernel theorem claim, original code edits, private seal import, numerical global evaluator or ledger count change.'}
    output['actual_recursive_functionals']=manifest(OUT/'ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json')
    inner_source=(ROOT/'work/remaining_chain/source/source-inner-growth.mjs').read_text()
    current_source=(ROOT/'work/remaining_chain/source/source-global-current.mjs').read_text()
    require('sourceQStar/64, since ell0=ellMinimum+6' in inner_source,'domain defining formula changed')
    require('G.add(band.family.constants.ell0,q(4))' in current_source,'N601 domain defining formula changed')
    require(r['sourceDomain']['domainRatio']=='1/64','recorded common domain ratio changed')
    output['domain_formula_join']={
        'common_source_qstar':'2^(-(ellMinimum+4))',
        'ell0':'ellMinimum+6',
        'recorded_qbig':'common_source_qstar/64=2^(-(ellMinimum+10))',
        'N601_qGlobalStar':'2^(-(ell0+4))=2^(-(ellMinimum+10))',
        'localization_qstar':'source-inner-growth.mjs118,146-149:2^(-(ell0+4))=sourceQStar/64',
        'proof':'64=2^6 and ell0=ellMinimum+6 give literal equality of all three defining expressions on the same fixed common family. Different graph node numbers are not identified.',
        'same_domain':True,
        'source_pins':[manifest(ROOT/'work/remaining_chain/source/source-inner-growth.mjs'),manifest(ROOT/'work/remaining_chain/source/source-global-current.mjs')],
        'source_cutoff_constants':'tau0=qbig/32,z0=tau0^D,r0=1,C0=4; entire spatial/time support has q<=4(tau0+z0^(1/D))=qbig/4<qbig/2'}
    output['N607']['C_jm_and_log_powers']={
        'increment':'For each actual Z_j and m define S_(j,m,p)=sup_D q^(ell_m-gj)(|Z_j|_m+|curl A_j+B_j e_theta|_m)/Lambda^p; P=min nonnegative integer with finite S, C=1+ceil S. Lemma9.8 proves the set nonempty on the same domain.',
        'finite_state_and_residual':'Let k_m be the least nonnegative integer k such that, for every finite j, some nonnegative integer p makes BOTH sup_D q^k |U[j]|_m/Lambda^p and sup_D q^(k-h*sigma_j)|R(U[j])-Flat[j]|_m/Lambda^p finite. Lemma9.8 makes this set nonempty. Set K_m=max_(r<=m) k_r. For each actual j,m choose the least common p making these two suprema finite and C=1+ceil(max of the suprema). Thus K_m is stage independent and nondecreasing; all actual logarithmic powers and constants are uniquely source defined, not set to zero/one.',
        'flat_norm':'For every fixed j,m,N define C_flat(j,m,N)=1+ceil(sup_D q^-N |Flat[j]|_m), finite by the actual Prop9.3 decomposition. This is never summed over j.',
        'stage_independence':'ell_m and K_m fixed before j; C/P may depend on j,m. No numerical monotonicity or smallness inferred.',
        'meaning':'Exact source-bound functionals with unique mathematical values; not evaluated floating-point constants or an effective supremum algorithm.'}
    output['N607']['actual_recursion_fully_defined_mathematically']=True
    output['N607']['K_m']='Canonical stage-independent integer functional K_m defined in C_jm_and_log_powers, with existence from Lemma9.8; no unproved particular numerical formula imposed.'
    output['N608']['tail']['comparison']='U_prime^[3] with fixed cutoff initialization; equals original S_3 on this saved window'
    output['N608'].update({
        'proof_status':'SOURCE_DEFINED_SYMBOLIC_FINAL_FIELD_AND_WINDOW_CANDIDATE',
        'actual_norm_family':{'bound_to':'actual recursive functionals file; each ActualCutoffCurlBound points to the actual canonical Z_j',
            'supremum':'S_hat_(j,m,p)=sup_(a>=1,(x,t)inD) q^(ellPrime_m-gj)*|T_a Z_j|_m/Lambda^p',
            'P_hat':'least nonnegative integer p making this supremum finite',
            'C_hat':'1+ceil(S_hat at that p)',
            'finiteness':'Use the actual Z_j bound through m+1. Complete product/chain rules and aq in[1/2,1] on derivative support are uniform in a. Since D<1, each physical cutoff derivative costs<=one q power; ellPrime_m=ell_(m+1)+(m+1) dominates all terms. No circular dependence on selected a_j.'},
        'initialization_choice':'Define U0_prime=Ubase+T_chi_init(initialization increments), chi_init=chi(2q/qbig). Multiply ONLY the exact finite initialization correction potentials/direct swirl/pressure by chi_init before curl; leave the realized slow base and its exterior heat/centrifugal pressure unchanged. This agrees with the N601 state for q<=qbig/4. Keep its supported-away-from-zero errors in each fixed-stage flat remainder.',
        'fixed_stage_identity':'Let S_J denote original uncut recursive state and U_prime^[J]=U0_prime+sum_(1..J) original uncut increments. Their difference and its full residual difference are supported q>=qbig/4 and are flat as q tends to0. Lemma5.4 compares with U_prime^[J]. On saved J=3/M=5 window, qmax<=2e^-5*qbig<qbig/4, so U_prime^[3]=S_3 exactly. Its initialization cutoff is one there.',
        'A0_gauge_binding':'Fixed base Stokes potential plus original primary raw/shared potentials, original temporal realized psi and actual five psi root3614778, all with original physical rescalings/cover; no potential chosen merely by its curl.',
        'final_field':'A=A0+sum_j>=1 chi(a_j q)A_j; B e_theta=B0 e_theta+sum chi(a_j q)B_j e_theta; p=p0+sum chi(a_j q)p_j; u_loc=curl A+B e_theta.',
        'field_uniqueness_for_recipe':'Canonical actual Z_j, least-integer P_hat, positive ceil C_hat and max L recursion fix one mathematical family. It is a permitted constructive choice in Lemma5.4, not an assertion that old source consumers had evaluated it.',
        'complete_source_defined_cutoff_recipe':True,
        'flat_residual_fixed_stage_choice':{'target':'any fixed derivative m and decay N',
            'J':'ceil(max(m+2,20*(N+K_(m+2)+1+ellPrime_(m+2))/h,10*(N+K_m+1)/h))',
            'proof':'For h>0 this is finite. The first clause permits full second-order NS comparison; the second gives tail exponent>N+K_(m+2)+1 and the third gives h*(1/5+J/10)-K_m>N+1. After this ONE J is fixed, absorb its actual constants/logarithms into one q^-1 and restrict below its cutoff plateau. Add only its actual flat remainder. This proves(9.20) for every fixedm,N.',
            'C_jm_available_mathematically':'actual weighted supremum functionals above; not numerical evaluations'},
        'analytic_premises_discharged':'N601 actual Definition9.4 base plus Prop9.6/Lem9.7/9.8; original q geometry; original flat support and canonical potentials. Lem5.4 gives local finiteness and (9.20), comparing to one fixed U^[J].',
        'symbolic_source_window_active_inventory_and_tail_saved':True,
        'whole_N608_closed_here':False,
        'closure_note':'Mathematical candidate ready for independent review; existing numeric JS dispatcher still not claimed complete.'})
    output['N704'].update({
        'proof_status':'SOURCE_DEFINED_ACTUAL_FAMILY_JETS_CANDIDATE',
        'required_identification':'The final A,B,p are NOW fixed by the exact recursive source functionals and canonical a_j choice above. Apply the original source-localization cutoff with the equal qbig verified above.',
        'actual_F_j':'F_j(x)=lim_(t up to1) partial_t^j R(curl(c*A)+c*B*e_theta,c*p_loc), with A/B/p the uniquely selected preceding family',
        'unresolved_original_mathematical_hypotheses':[],
        'unresolved':'Independent review of this complete mathematical source application; numeric values remain unevaluated, a separate implementation limit.'})
    output['N705'].update({
        'proof_status':'SOURCE_DEFINED_ACTUAL_FORCE_EXTENSION_CANDIDATE',
        'actual_norms':'N_(j,a)=||F_j||_C^a(K) for the preceding unique actual localized force; smooth compact support from wholeK Lem10.2 proves finiteness.',
        'complete_actual_source_choice':'b0=1; choose exact min integer b>b_previous satisfying every original(10.12) actual norm constraint; this is a definite nonempty set, not an arbitrary supplied norm.',
        'unresolved_original_mathematical_hypotheses':[],
        'actual_infinite_extension':'same original chi0(b_j*sigma)*sigma^j*F_j/j! family, allorders derivative-tail and(10.10) joining proof above',
        'norm_functionals_are_not_evaluated_source_constants':True})
    output['mathematical_vs_computational_scope']={
        'analytic_candidates':['N6-07','N6-08','N7-04','N7-05'],
        'requires_independent_review':True,
        'defined_functional_constants_are_actual_source_quantities':True,
        'effective_numerical_supremum_or_finalfield_evaluator_implemented':False,
        'remaining_numerical_original_clauses':['N7-06 independent wholeK space/time refinements','N8-05 four independent refinement tables plus actual tail/budget/lasttau'],
        'no_dummy_constant_or_model_to_actual_conversion':True}
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'ACTUAL_REMAINING_CHAIN_APPLICATION.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    return output

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=ROOT,help='Root containing the pinned relative input tree')
    parser.add_argument('--output-dir',type=Path,default=None,help='Write fresh evidence here; default is ROOT/work/remaining_chain/evidence')
    args=parser.parse_args()
    ROOT=args.root.resolve()
    OUT=args.output_dir.resolve() if args.output_dir else ROOT/'work/remaining_chain/evidence'
    INITIAL=ROOT/'work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json'
    REPLAY=ROOT/'work/remaining_chain/EXISTING_ITERATION_PROGRAM_REPLAY.json'
    x=build()
    print(json.dumps({'schema':x['schema'],'initial_groups':len(x['initial_root_and_exponent_checks']),
        'all_stage_affine_checks':len(x['N607']['affine_exponent_checks']),
        'localization_components_checked':3,'negative_controls':x['negative_controls'],
        'N608_symbolic_window':x['N608']['q_window'],'numerical_field_evaluator':False,'last_resolved_actual_tau':None},indent=2))
