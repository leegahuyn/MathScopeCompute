"""A mathematical term graph for the ACTUAL original recursive field family.

This is not a GlobalSourceExpressions graph and does not impersonate a private
runtime seal. Functional suprema are exact source-defined mathematical objects;
their numerical evaluation is deliberately a different, unimplemented API.
"""
from dataclasses import dataclass
from fractions import Fraction
import hashlib, json

def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()

class SourceFamily:
    def __init__(self,initial,source_hash,actual_roots):
        self.initial=initial; self.source_hash=source_hash; self.nodes=[];self.lookup={};self.stages=[]
        assert actual_roots['background']=={'b':622934,'V':634588,'G':622933}
        assert actual_roots['originalStress']==[633815,633863]
        assert actual_roots['potential']['psi']==3614778
        self.fixed=self.node('FixedOriginalSource',[],{
            'paper':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
            'parameters':'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152',
            'background_roots':actual_roots['background'],'stress_roots':actual_roots['originalStress'],
            'original_fixed_data':['primary positive a_plus/a_minus','Hcov and its inverse','primary fundamental propagator','original path and palette','rho','five normalized profiles and their fixed inverse','Diophantine torus frequency','original smooth cutoffs and q geometry'],
            'source':'same initialized normFamily actualRoots; Definition9.4',
            'qbig':'2^(-(ellMinimum+10))','h':'exp(-8002*(exp(1048576)+10))'})
        seed=self.node('ActualInitializedState',[self.fixed],{'source_application_sha256':source_hash,
            'actual_tuple':initial,'potentials':{'base':'original Stokes A_base=(S/r)e_theta, S=sum chi(b_n*q) q^(1-A+2nh) M_n, n0 uncut',
            'primary':'source-global-current.mjs attachGlobalCurrentState rows[].rawPotential and rows[].potential BEFORE exactCylindricalHarmonicCurl, with original physical scaling/cover',
            'temporal':'source-global-temporal.mjs attachGlobalTemporalInverse: original realizeOriginalTemporalPotential(...).psi, not a gauge reconstructed from velocity',
            'five':'source-global-initial-mean.mjs attachGlobalInitializedMean: emitted psi=(int_inner^R Rprime*gammaDesired dRprime)/R, actual root3614778',
            'actual_five_psi':actual_roots['potential']['psi'],'actual_five_compact_psi':actual_roots['potential']['compactPsi'],
            'gauge_choice':'Use precisely these emitted physical potentials, with original scalar rescalings and cover. No alternative gauge permitted.'},
            'max_wave_harmonic':1,'sigma':'1/5','two_moments':[0,0],
            'flat_decomposition':'E_background + actual pulse cutoff + actual modified radial inverse remainders, retained as Prop9.3 prescribes'})
        self.stages.append(seed)
    def node(self,op,inputs,data):
        if op in ['OriginalForcedMap','OriginalSignedMap','OriginalTemporalMap','OriginalFiveMap']:
            data={**data,
                'returned_complete_state':'input_current plus the actual realized velocity increment; retain all previous wave/mean components and all previous angular pressure plus actual new angular pressure coefficient',
                'all_cross_terms':'Form complete updated full auxiliary covariance BEFORE any Haar averaging; do not replace it by its average for pressure or direct PDE.',
                'next_action':'FullPressureAndResidualRefresh on this complete state before any subsequent source projection'}
        assert all(i in self.lookup for i in inputs)
        record={'operation':op,'inputs':inputs,'data':data}
        key='f_'+digest(record)[:24]
        if key not in self.lookup:
            record={'id':key,**record};self.nodes.append(record);self.lookup[key]=record
        return key
    def projection(self,field,name):return self.node('ActualProjection',[field],{'name':name})
    def refresh(self,current,tag):
        return self.node('FullPressureAndResidualRefresh',[current,self.fixed],{
            'tag':tag,'full_current':current,
            'gr':'complete (8.3) from every current wave and beta,v,gamma; no zero-mean-velocity substitution',
            'P':'whole radial integral of full auxiliary Haar(gr)',
            'pm':'T0(gr-rho*P), retaining radial cutoff remainder A0',
            'angular_pressure':'all old + actual new homogeneous/inhomogeneous angular coefficients retained',
            'full_pressure':'background + latest pm + complete angular pressure',
            'residual':'direct R(u,p) with same complete latest pressure; supported and flat parts per Prop9.3',
            'current_defects':'P,Jtheta,Jz of complete updated fields, c_rho*P inside axial derivative',
            'references':['(8.3)','(8.12)','(8.15)-(8.16)','Prop9.6 p108']})
    def successor(self,j):
        assert j==len(self.stages)-1 and j>=0
        before=self.stages[j]
        # Residual components are always read from this exact predecessor.
        supported=self.node('GroupedSupportedNonzeroResidual',[before],{
            'full_current':before,'all_generated_harmonics':f'0<|m|<=2^{j+1}',
            'all_conjugate_pairs':True,'flat_terms':'retained separately, never sent to supported pulse source',
            'physical_labels':'all original cover labels with fixed path/copies; no sampling'})
        forced=self.node('OriginalForcedMap',[before,supported,self.fixed],{
            'input_current':before,'source':supported,'equation':'L_m(t_m,pi_m)=-f_m for EACH nonzero grouped supported source',
            'initial_data':'zero at entrance to same fixed path','velocity':'cut off potential then full curl','pressure':'inhomogeneous coefficient including n dot f',
            'reference':'Prop7.2, Prop9.6 step1','norm_theorem':'generic stable forced class recurrence; input seminorm remains that of supported above'})
        postforced=self.refresh(forced,f'cycle{j}:after-forced')
        pair=self.node('ActualPhysicalHaarTangentialResidual',[postforced],{
            'full_current':postforced,'physical_pair':'F2=Q^(-2A-1/2) Haar(Etheta),F1=Q^(-2A-1/2) Haar(Ez)',
            'moments':'Me=int_0^infinity r^e Fe dr, with z,t fixed',
            'zero_moment_source':'Fe-be*Me with SAME fixed normalized be',
            'Sigma':'Q^(2A)*(-r^-2 int_0^r rprime^2(F2-b2*M2), -r^-1 int_0^r rprime(F1-b1*M1))',
            'support':'zero full weighted moments imply compact outer extension; actual Haar makes source independent of all auxiliary coordinates'})
        signed=self.node('OriginalSignedMap',[postforced,pair,self.fixed],{
            'input_current':postforced,'source':pair,'delta_amplitude':'(Hcov^-1(Sigma/epsilon))/(2*a_primary)',
            'primary_reselected':False,'velocity':'original signed potentials full curl','pressure':'homogeneous amplitude coefficient on same fixed background',
            'covariance':'B(wtan0,ts)+B(w-wtan0,ts)+B(w,rs)+Haar_theta,Y(s tensor s)',
            'every_remainder_retained':True,'reference':'(7.35)-(7.41), Prop9.6 step2'})
        postsigned=self.refresh(signed,f'cycle{j}:after-signed')
        zero=self.node('ActualZeroAuxiliaryMeanResidual',[postsigned],{
            'full_current':postsigned,'source':'(Etheta-Haar Etheta, Ez-Haar Ez)','projection':'complete normalized common torus, both columns'})
        temporal=self.node('OriginalTemporalMap',[postsigned,zero,self.fixed],{
            'input_current':postsigned,'source':zero,'prescribed':'Delta v=-ci^-1 N^-1 Etheta0; gamma_desired=-ci^-1 N^-1 Ez0',
            'actual_axial':'Psi=T1 gamma_desired; Delta beta=-epsilon partial_Z Psi; Delta gamma=(Dr+1/R)Psi',
            'flat':'Fax=ci*N(Delta gamma-gamma_desired) retained','reference':'Lemma8.6,(8.20), Prop9.6 step3'})
        posttemporal=self.refresh(temporal,f'cycle{j}:after-temporal')
        targets=self.node('FreshFiveTargets',[posttemporal],{
            'full_current':posttemporal,'targets':'two homogeneous conservation rows + current P,Jtheta,Jz',
            'source':'full fresh pressure/defects, never pre-temporal targets'})
        five=self.node('OriginalFiveMap',[posttemporal,targets,self.fixed],{
            'input_current':posttemporal,'source':targets,'linear_map':'same fixed original five normalized profiles/inverse',
            'velocity':'full supported potentials and direct azimuthal mean','two_moments':[0,0],
            'new_defects':'actual nonlinear remainders(8.26)-(8.27), not zero','reference':'Prop9.6 step4'})
        final=self.refresh(five,f'cycle{j}:after-five')
        state=self.node('CompletedActualStage',[final,self.fixed],{
            'j':j+1,'sigma':str(Fraction(1,5)+Fraction(j+1,10)),
            'max_wave_harmonic':2**(j+1),'max_residual_harmonic':2**(j+2),
            'full_refreshed_current':final,'complete_cycle_predecessor':before,
            'Z_increment':'sum of every actual potential/direct swirl increment in this cycle; pressure difference new minus old',
            'invariant_proof':'Prop9.6 preserves all Definition9.4 clauses; Prop9.3 supplies exact next residual decomposition; Lem9.7 fixed domain',
            'two_moments':[0,0],'fixed_source':self.fixed})
        self.stages.append(state);return state
    def norm(self,j,m):
        assert 1<=j<len(self.stages) and m>=0
        state=self.stages[j]
        Z=self.node('ActualCorrectionPotentials',[self.stages[j-1],state],{
            'j':j,'definition':'A_j,B_j are sums of returned cycle potentials/direct azimuthal increments; p_j is complete pressure difference',
            'velocity_identity':'delta u_j=curl A_j+B_j e_theta',
            'original_recipe_retained':True})
        return self.node('ExactSourceFunctionalBound',[Z,self.fixed],{
            'derivative_order':m,'g_j':f'h*{j}/10','ell_m':f'2A+({m}+1)*(1+3h/2)',
            'domain':'original 0<q<qbig, all physical points on that domain',
            'weighted_supremum':'S_(j,m,p)=sup_D q^(ell_m-g_j)*(|Z_j|_m+|curl A_j+B_j e_theta|_m)/(1+|log q|)^p',
            'P_choice':'P_(j,m)=min{p in nonnegative integers:S_(j,m,p)<infinity}',
            'C_choice':'C_(j,m)=1+ceil(S_(j,m,P_(j,m)))',
            'nonempty_and_finite_by':'same actual Prop9.6 recursion + Lemma9.8(9.17); integer log power enlargement is valid because Lambda>=1',
            'source_bound':True,'arbitrary_caller_constant':False,
            'effective_numerical_evaluation':False,'mathematical_value_unique':True})
    def cutoff_bounds(self,j,m):
        norm=self.norm(j,m+1)
        return self.node('ActualCutoffCurlBound',[norm,self.fixed],{
            'j':j,'m':m,'ellPrime':f'ell_({m+1})+{m+1}',
            'increment_operator':'T_a Z_j=(curl(chi(aq)*A_j)+chi(aq)*B_j*e_theta,chi(aq)*p_j)',
            'uniform_scale_domain':'ALL a>=1 and ALL original physical points with0<q<qbig, BEFORE choosing any a_j',
            'S_hat':'S_hat_(j,m,p)=sup_(a>=1,(x,t) in D) q^(ellPrime_m-g_j)*|T_a Z_j|_m/(1+|log q|)^p',
            'P_hat':'min{p in nonnegative integers:S_hat_(j,m,p)<infinity}',
            'C_hat':'1+ceil(S_hat_(j,m,P_hat_(j,m)))',
            'finiteness':'Finite product/chain rules use derivatives of Z_j through m+1. On every positive cutoff derivative support aq in[1/2,1], a factors cancel q. Each q derivative costs at most one since0<D<1. With nondecreasing ell, loss ell_(m+1)+(m+1) suffices, uniformly in a. Thus at least the integer P_(j,m+1) is admissible.',
            'no_scale_selection_cycle':True,'actual_potential_and_cutoff_source_bound':True,'numeric_value':None})

    def schedule(self,upto=5):
        assert upto<len(self.stages)
        rows=[]
        for j in range(1,upto+1):
            norms=[self.cutoff_bounds(j,m) for m in range(j+1)]
            row=self.node('ActualShrinkingScale',[self.fixed]+([rows[-1]] if rows else [])+norms,{
                'j':j,'gamma':f'h*{j}/20','previous':'L_(j-1)' if j>1 else 'log(1/qbig)',
                'L':'max(1,1+L_previous,1+log(1/qbig),max_m(2*P_hat/gamma)^2,max_m2*(C_hat+j)/gamma)',
                'a':'exp(L)','original_cutoff':'chi=1 on(-infinity,1/2],chi=0 on[1,infinity)',
                'norm_inputs':norms,'every_m_le_j':True,
                'all_order_rule':'same rule for every finite j; these are source functionals, not supplied dummy values'})
            rows.append(row)
        return rows
    def validate(self):
        seen=set()
        for node in self.nodes:
            if any(i not in seen for i in node['inputs']):raise ValueError('future or missing actual source input')
            d=node['data'];op=node['operation']
            expected='f_'+digest({k:v for k,v in node.items() if k!='id'})[:24]
            if node['id']!=expected:raise ValueError('source descriptor content hash changed')
            if op in ['OriginalForcedMap','OriginalSignedMap','OriginalTemporalMap','OriginalFiveMap']:
                if d['input_current']!=node['inputs'][0] or d['source']!=node['inputs'][1]:raise ValueError('stale current binding')
                source=self.lookup[d['source']]
                if source['data']['full_current']!=d['input_current']:raise ValueError('source does not belong to updated current')
            if op=='FullPressureAndResidualRefresh' and d['full_current']!=node['inputs'][0]:raise ValueError('pressure uses stale state')
            seen.add(node['id'])
        return True
    def export(self):
        self.validate()
        return {'schema':'MathScope.ActualRecursiveSourceFunctionals/1','initial_source_application_sha256':self.source_hash,
            'representation':'mathematical function/operator term graph; not original numeric SourceExpressions node IDs',
            'fixed_source':self.fixed,'actual_stages':self.stages,'nodes':self.nodes,
            'all_finite_rule':'The successor method is the same four original maps for each j; finite prefixes illustrate its serialization, not prove allj by samples.',
            'induction_theorem':'Prop9.6 plus Lem9.7 on actual State0; exponent proof and full Definition9.4 invariants carried separately',
            'numerical_field_evaluator':False,'numerical_supremum_evaluator':False,
            'private_original_seals_reused':False,'proof_status':'SOURCE_BOUND_ANALYTIC_CONSTRUCTION_CANDIDATE'}
