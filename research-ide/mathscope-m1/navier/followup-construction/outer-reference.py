#!/usr/bin/env python3
"""Independent source-outer reintegration. No frozen implementation is changed.

The reference uses 70 decimal digits and fixed Gauss--Legendre quadrature, not
the JavaScript adaptive Simpson / RK4 solver. It tests finite fixtures, not the
whole-eta theorem. Install mpmath, or use the existing arithmetic vendored copy.
"""
import hashlib
import json
import math
import pathlib
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
try:
    import mpmath as mp
except ImportError:
    sys.path.insert(0, str(HERE.parents[1] / 'arithmetic' / 'vendor'))
    import mpmath as mp

mp.mp.dps = 70
fixture_path = HERE / 'outer-fixture.json'
fixture = json.loads(fixture_path.read_text())
p = {k: mp.mpf(str(v)) for k, v in fixture['normalizedInput']['parameters'].items()}
lam, h, Md, Tf, co = (p[k] for k in ['lambda', 'h', 'Md', 'Tf', 'co'])
Td = mp.exp(Md) + 10
rho = co * h
nodes, weights = mp.gauss_quadrature(96, 'legendre')
calls = 0

def sig(t):
    if t <= 0: return mp.mpf(0)
    if t >= 1: return mp.mpf(1)
    z = -1 / t**2 + 1 / (1 - t)**2
    return 1 / (1 + mp.exp(-z))

def sigp(t):
    if t <= 0 or t >= 1: return mp.mpf(0)
    # Compute both factors independently: 1-sig(t) may round to zero.
    z = -1 / t**2 + 1 / (1 - t)**2
    return (2/t**3 + 2/(1-t)**3) / ((1+mp.exp(z)) * (1+mp.exp(-z)))

def q(fun, a, b):
    global calls
    a, b = mp.mpf(a), mp.mpf(b)
    calls += len(nodes)
    mid, half = (a+b)/2, (b-a)/2
    return half * mp.fsum(weights[k] * fun(mid+half*nodes[k]) for k in range(len(nodes)))

primitive_cache = {}
def primitive(t):
    if t <= 0: return mp.mpf(0)
    if t >= 1: return t-mp.mpf('.5')
    if t not in primitive_cache: primitive_cache[t] = q(sig, 0, t)
    return primitive_cache[t]

def val(x):
    return mp.mpf(x['sign']) * mp.exp(mp.mpf(str(x['logAbs']))) if x['sign'] else mp.mpf(0)

def record_mp(x):
    if not x: return {'sign': 0, 'logAbs': None, 'decimal': '0'}
    return {'sign': int(mp.sign(x)), 'logAbs': float(mp.log(abs(x))), 'decimal': mp.nstr(x, 40)}

checks=[]
def check(name, observed, expected, tolerance, scale=1):
    error = abs(mp.mpf(observed)-mp.mpf(expected))/mp.mpf(scale)
    checks.append({'id': name, 'pass': bool(error <= tolerance), 'error': float(error),
                   'tolerance': float(tolerance), 'observed': mp.nstr(observed, 25),
                   'expected': mp.nstr(expected, 25)})

def check_true(name, condition, detail):
    checks.append({'id': name, 'pass': bool(condition), 'detail': detail})

started=time.monotonic()
# Terminal ODE: direct integrating factors, independently of JavaScript RK4.
q0=(lam-h)/(1-lam)
aint1=lambda t:(1-lam)*(t-primitive(t))
q1=mp.exp(-aint1(1))*(q0+q(lambda t:mp.exp(aint1(t))*(lam+(1-lam)*sig(t)-h),0,1))
q2=q1+(1-h)*4*mp.log(1/h)
aint2=lambda t:(1-h)*primitive(t)
q_before=mp.exp(-aint2(1))*(q2+q(lambda t:mp.exp(aint2(t))*(1-h)*(1-sig(t)),0,1))
qp=rho/(1-rho)*q(lambda t:mp.exp((1-h)*t)*sigp((t-1)/2)/2,1,3)
wait=mp.log(q_before/qp)/(1-h)
check('terminal-Q-integrating-factor',fixture['terminal']['QBeforeWait'],q_before,mp.mpf('2e-10'))
check('terminal-Qp-independent-integral',fixture['terminal']['Qp'],qp,mp.mpf('2e-9'),abs(qp))
check('terminal-wait',fixture['terminal']['wait'],wait,mp.mpf('2e-8'))

# Reconstruct the original stage functions directly from the prescribed l.
stages=[]; y=mp.mpf(0); loge=mp.mpf(0); energy=mp.mpf(0)
def add(name,length,delta,edelta,theta=1,constant=None):
    global y,loge,energy
    length=mp.mpf(length)
    stages.append({'name':name,'start':y,'length':length,'loge':loge,'energy':energy,
                   'delta':delta,'edelta':edelta,'theta':theta,'constant':constant})
    y+=length;loge+=delta(length);energy+=edelta(length)
add('initial',1,lambda t:t/10-3*primitive(t)/5,lambda t:6*t/5-6*primitive(t)/5)
add('decay',Td,lambda t:-t/2,lambda t:mp.mpf(0),constant=-mp.mpf('.5'))
add('entry',1,lambda t:-t/2-lam*primitive(t),lambda t:-2*lam*primitive(t))
add('power',60*mp.log(1/lam),lambda t:(-mp.mpf('.5')-lam)*t,lambda t:-2*lam*t,constant=-mp.mpf('.5')-lam)
pulse_start=y; pulse_loge=loge;pulse_energy=energy
add('pulse',13/lam,lambda t:(-mp.mpf('.5')-lam)*t,lambda t:-2*lam*t,constant=-mp.mpf('.5')-lam)
interp_loge=loge
add('interpolation',Tf,lambda t:(-mp.mpf('.5')-lam)*t-mp.log(2)*sig(t/Tf),lambda t:-2*lam*t-2*mp.log(2)*sig(t/Tf),theta='interpolation')
add('angular',30*mp.log(1/lam),lambda t:(-mp.mpf('.5')-lam)*t,lambda t:-2*lam*t,theta=0,constant=-mp.mpf('.5')-lam)
add('steepen',1,lambda t:(-mp.mpf('.5')-lam)*t-(1-lam)*primitive(t),lambda t:-2*lam*t-2*(1-lam)*primitive(t),theta=0)
add('hold',4*mp.log(1/h),lambda t:-3*t/2,lambda t:-2*t,theta=0,constant=-mp.mpf('1.5'))
add('flatten',1,lambda t:-3*t/2+(1-h)*primitive(t),lambda t:-2*t+2*(1-h)*primitive(t),theta=0)
add('wait',wait,lambda t:(-mp.mpf('.5')-h)*t,lambda t:-2*h*t,theta=0,constant=-mp.mpf('.5')-h)
tail_y=y; log_epow=p['logP']+loge-mp.log(1-rho); log_xtail=p['logXR']+y
fo=lambda t:1-rho*(1-sig((t-1)/2))
add('terminal',3,lambda t:(-mp.mpf('.5')-h)*t+mp.log(fo(t)/(1-rho)),lambda t:-2*h*t+2*mp.log(fo(t)/(1-rho)),theta=0)
end_loge=loge;end_energy=energy
check('independent-logXtail',fixture['terminal']['logXtail'],log_xtail,mp.mpf('3e-8'))
check('independent-logEPow-tail',fixture['terminal']['logEPowAtTail'],log_epow,mp.mpf('3e-8'))

def phi(x):
    if x<=0:return mp.mpf(0)
    if x>=mp.mpf('.02'):return x-mp.mpf('.01')
    return mp.mpf('.02')*q(sig,0,x/mp.mpf('.02'))
def r0(x):
    if x<=0 or x>=11:return mp.mpf(0)
    t=x-10
    cutoff=1 if t<=0 else 1/(1+mp.exp(-1/t**2+1/(1-t)**2))
    return phi(x)*cutoff
kb=q(lambda x:mp.exp(-2*x)*r0(x)**2,0,'.02')+q(lambda x:mp.exp(-2*x)*r0(x)**2,'.02',10)+q(lambda x:mp.exp(-2*x)*r0(x)**2,10,11)
check('Kb-source-reintegration',fixture['slices'][0]['amplitude']['Kb'],kb,mp.mpf('2e-9'))

def beta(x,c,w):return sigp((x-c)/w+mp.mpf('.5'))/w
def log_r0(x):
    t=x-10;z=-1/t**2+1/(1-t)**2
    return mp.log(x-mp.mpf('.01'))-mp.log1p(mp.exp(z))
def pulse_integral(a):
    center=13/lam-3
    first=q(lambda x:mp.exp(a*(x/lam-center))*r0(x)/lam,0,'.02')
    anti=lambda x:mp.exp(a*(x/lam-center))*((x-mp.mpf('.01'))/a-lam/a**2)
    middle=anti(10)-anti(mp.mpf('.02'))
    root=lambda x:a/lam+1/(x-mp.mpf('.01'))-sig(x-10)*(2/(x-10)**3+2/(11-x)**3)
    guess=11-(2*lam/a)**(mp.mpf(1)/3)
    peak=mp.findroot(root,(guess-mp.mpf('.005'),guess+mp.mpf('.005')))
    logpeak=a*(peak/lam-center)+log_r0(peak)-mp.log(lam)
    mesh=[mp.mpf(10),peak,mp.mpf(11)]
    for k in range(1,14):
        step=mp.mpf(2)**(-k)
        if peak-step>10:mesh.append(peak-step)
        if peak+step<11:mesh.append(peak+step)
    mesh=sorted(set(mesh))
    last=mp.exp(logpeak)*mp.fsum(q(lambda x:mp.exp(a*(x/lam-center)+log_r0(x)-mp.log(lam)-logpeak),u,v) for u,v in zip(mesh,mesh[1:]))
    return first+middle+last
pulse_slopes=[mp.mpf('.5')-lam,mp.mpf('.5')-2*lam]
pulse_main=[pulse_integral(a) for a in pulse_slopes]
pulse_centers=[13/lam-3,13/lam-1]
pulse_matrix=mp.matrix([[q(lambda t:mp.exp(a*(t+c-pulse_centers[0]))*beta(t,0,mp.mpf('.3')),-mp.mpf('.15'),mp.mpf('.15')) for c in pulse_centers] for a in pulse_slopes])
source_k=lambda t:4*(1-sig(mp.log(1+t)/Md))
k1=q(lambda t:source_k(t)*mp.exp(t),0,mp.exp(Md)-1)
mshape=4*mp.e+mp.e*k1
jshape=mp.mpf('2.5')+4*q(lambda t:mp.exp(mp.mpf('1.6')*t-mp.mpf('.6')*primitive(t)),0,1)+mp.exp(mp.mpf('1.3'))*k1
r_initial=mp.exp(-mp.mpf('1.3'))*(mp.mpf(1)/mp.mpf('1.6')+q(lambda t:mp.exp(mp.mpf('1.6')*t-mp.mpf('.6')*primitive(t)),0,1))
r_decay=1+(r_initial-1)*mp.exp(-Td)
r_entry=mp.exp(-1+lam/2)*(r_decay+q(lambda t:mp.exp(t-lam*primitive(t)),0,1))
def theta(g,t):return 1-sig(t/Tf) if g['theta']=='interpolation' else mp.mpf(g['theta'])
def stage_pressure(g,eta):
    f=1/(1+eta**2)
    if g['constant'] is not None:
        a=2*g['constant'];return mp.exp(2*g['loge'])*mp.expm1(a*g['length'])/a*f**(2*g['theta'])
    cuts=[0,g['length']]
    if g['name']=='interpolation':cuts=[0,1,4,16,32,Tf]
    return mp.exp(2*g['loge'])*mp.fsum(q(lambda t:mp.exp(2*g['delta'](t))*f**(2*theta(g,t)),a,b) for a,b in zip(cuts,cuts[1:]))
def stage_energy(g,eta):
    f=1/(1+eta**2)
    if g['constant'] is not None:
        a=2*g['constant']+1;v=g['length'] if a==0 else mp.expm1(a*g['length'])/a
        return mp.exp(g['energy'])*v*f**(2*g['theta'])
    cuts=[0,g['length']]
    if g['name']=='terminal':cuts=[0,1,3]
    return mp.exp(g['energy'])*mp.fsum(q(lambda t:mp.exp(g['edelta'](t))*f**(2*theta(g,t)),a,b) for a,b in zip(cuts,cuts[1:]))

references=[]
for slc in fixture['slices']:
    eta=mp.mpf(str(slc['eta']));f=1/(1+eta**2);a=mp.mpf(str(slc['amplitude']['amplitude']))
    pressure=-mp.mpf('.5')*(5*f*f+mp.fsum(stage_pressure(g,eta) for g in stages)+mp.exp(2*end_loge)/(1+2*h))
    check(f'pressure-A21-eta-{eta}',slc['pressure']['normalizedByPSquared'][0],pressure,mp.mpf('2e-8'))
    jet=mp.taylor(lambda z:(1+z*z)**(-2),eta,4)
    before=5+mp.fsum(stage_pressure(g,eta)/(f*f) for g in stages if g['theta']==1)
    ig=next(g for g in stages if g['name']=='interpolation')
    for n in range(1,5):
        cuts=[0,1,4,16,32,Tf]
        ip=mp.fsum(q(lambda t:mp.exp(2*ig['delta'](t))*mp.taylor(lambda z:(1+z*z)**(-2*theta(ig,t)),eta,4)[n],u,v) for u,v in zip(cuts,cuts[1:]))
        coefficient=-mp.mpf('.5')*(before*jet[n]+mp.exp(2*ig['loge'])*ip)
        check(f'pressure-Taylor-coefficient-{n}-eta-{eta}',slc['pressure']['normalizedByPSquared'][n],coefficient,mp.mpf('2e-8'))
    energy_total=f*f/mp.mpf('1.2')+mp.fsum(stage_energy(g,eta) for g in stages)+mp.exp(end_energy)/(2*h)
    angular=slc['angularReset'];ag=next(g for g in stages if g['name']=='angular')
    rate=1-lam;bpar=mp.log(2*f)
    transient=(r_entry-1/rate)*mp.exp(-rate*(60*mp.log(1/lam)+13/lam+Tf)+bpar)
    forced=bpar/rate*q(lambda z:sigp(z)*mp.exp(-rate*Tf*(1-z)+bpar*(1-sig(z))),0,1) if bpar else mp.mpf(0)
    actual_angular_debt=-(transient+forced)*mp.exp(-rate*(ag['length']-3))
    check(f'A11-source-ODE-debt-log-eta-{eta}',angular['momentAudit'][0]['target']['logAbs'],mp.log(abs(actual_angular_debt)),mp.mpf('2e-8'))
    for i,c0 in enumerate(angular['centers']):
        c=mp.mpf(str(c0));w=mp.mpf('.3');ci=mp.exp(mp.mpf(str(angular['normalizingLogScale'])))*mp.mpf(str(angular['normalizedCoefficients'][i]))
        energy_total+=mp.exp(ag['energy']-2*lam*c)*q(lambda t:mp.exp(-2*lam*t)*(2*ci*beta(t,0,w)+ci**2*beta(t,0,w)**2),-w/2,w/2)
    k=lambda t:4*(1-sig(mp.log(1+t)/Md))
    pre_u2=eta**2*(16*mp.e+mp.e*q(lambda t:k(t)**2*mp.exp(t),0,mp.exp(Md)-1))
    c0=-lam*energy_total/(2*mp.exp(pulse_energy)*f*f)+lam*pre_u2/mp.exp(2*p['logP']+pulse_energy)/(f*f)
    c1=mp.mpf(0);c2=kb
    end=slc['pulseEndCorrection'];
    pre=[-eta*mshape*mp.exp(-pulse_start-p['logP']-pulse_loge-mp.log(f)-pulse_slopes[0]*pulse_centers[0]),
         -eta*jshape*mp.exp(-p['logP']-mp.mpf('1.5')*pulse_start-2*pulse_loge-mp.log(f)-pulse_slopes[1]*pulse_centers[0])]
    moment_debt=[pre[i]-a*pulse_main[i] for i in range(2)]
    evaluated_end=mp.matrix([val(c) for c in end['values']])
    end_increment=pulse_matrix*evaluated_end
    for i in range(2):
        check(f'MJ-independent-pulse-integral-{i}-eta-{eta}',end_increment[i],moment_debt[i],mp.mpf('2e-8'),abs(moment_debt[i]))
    if eta:
        pre_coeff=mp.lu_solve(pulse_matrix,mp.matrix(pre))
        for i in range(2):check(f'MJ-independent-prepulse-affine-log-{i}-eta-{eta}',end['affineConstant'][i]['logAbs'],mp.log(abs(pre_coeff[i])),mp.mpf('2e-6'))
    check_true(f'negative-control-omit-MJ-end-bumps-{eta}',all(z!=0 for z in moment_debt),'Omitting both bumps leaves a relative M and J residual of one, even if an unscaled Float64 value underflows.')
    for i,c in enumerate(end['centers']):
        c=mp.mpf(str(c));ac=val(end['affineConstant'][i]);aa=val(end['affineAmplitude'][i]);w=mp.mpf('.3')
        ew=lam*mp.exp(-2*lam*c)*q(lambda t:mp.exp(-2*lam*t)*beta(t,0,w)**2,-w/2,w/2)
        c0+=ew*ac*ac;c1+=2*ew*ac*aa;c2+=ew*aa*aa
    f_at=c0+c1*a+c2*a*a
    amp_ref=(-c1+mp.sqrt(c1*c1-4*c2*c0))/(2*c2)
    check(f'Amp-independent-energy-root-eta-{eta}',a,amp_ref,mp.mpf('2e-8'))
    check(f'Amp-independent-S-residual-eta-{eta}',f_at,0,mp.mpf('2e-8'))
    check_true(f'negative-control-shifted-Amp-{eta}',abs(c0+c1*(a+mp.mpf('.02'))+c2*(a+mp.mpf('.02'))**2)>mp.mpf('.001'),'Adding .02 to Amp must fail the source S equation.')

    # Reintegrate A.11 in local log-radius, not using the JS matrix values.
    angular_coeff=[mp.mpf(str(z)) for z in angular['normalizedCoefficients']]
    angular_scale=mp.mpf(str(angular['normalizingLogScale']));eps=mp.exp(angular_scale)
    ra=1-lam;rp=-1-2*lam;ac=[mp.mpf(str(z)) for z in angular['centers']];aw=mp.mpf('.3')
    rows=[mp.mpf(0),mp.mpf(0)]
    for i,c in enumerate(ac):
        rows[0]+=q(lambda t:mp.exp(ra*(t+c-ac[0]))*angular_coeff[i]*beta(t,0,aw),-aw/2,aw/2)
        rows[1]+=q(lambda t:mp.exp(rp*(t+c-ac[0]))*(2*angular_coeff[i]*beta(t,0,aw)+eps*angular_coeff[i]**2*beta(t,0,aw)**2),-aw/2,aw/2)
    # Compare the declared normalized debt; this checks the actual bumps rather
    # than recomputing the same linear solver. The ODE debt is independently
    # addressed by the terminal integrating-factor check above.
    for i,row in enumerate(rows):
        target=val(angular['momentAudit'][i]['target'])/eps
        check(f'A11-reintegrated-row-{i}-eta-{eta}',row,target,mp.mpf('2e-8'))

    heat=slc['heatCompensation'];hs=mp.mpf(str(heat['normalizingLogScale']));heps=mp.exp(hs)
    hc=[mp.mpf(str(z)) for z in heat['normalizedCoefficients']]
    centers=[mp.mpf(str(z)) for z in heat['centers']];widths=[mp.mpf(str(z)) for z in heat['widths']]
    alpha=-mp.mpf('.5')-lam
    heat_rows=[mp.mpf(0),mp.mpf(0),mp.mpf(0)];altered=[mp.mpf(0),mp.mpf(0),mp.mpf(0)]
    for j,(c,w) in enumerate(zip(centers,widths)):
        def increment(x, i, cj):
            z=cj*beta(x,c,w)
            return [f*x**(alpha-1)*z+heps*z*z/(2*x),-f*x**alpha*z-heps*z*z/2,mp.sqrt(2*x)*z][i]
        # Change variables x=exp(u); JS integrated directly in x.
        for i in range(3):
            heat_rows[i]+=q(lambda u:increment(mp.exp(u),i,hc[j])*mp.exp(u),mp.log(c-w/2),mp.log(c+w/2))
            altered[i]+=q(lambda u:increment(mp.exp(u),i,hc[j]*(mp.mpf('1.01') if j==0 else 1))*mp.exp(u),mp.log(c-w/2),mp.log(c+w/2))
    for i,row in enumerate(heat_rows):
        target=val(heat['heatChanges'][i])/-heps
        check(f'A7-independent-compensation-row-{i}-eta-{eta}',row,target,mp.mpf('2e-8'))
    if abs(eta)<1:
        check_true(f'negative-control-heat-bump-coefficient-{eta}',max(abs(altered[i]+val(heat['heatChanges'][i])/heps) for i in range(3))>mp.mpf('1e-5'),'A one-percent change in the first nonzero bump coefficient must fail the normalized moment equations.')

    # Independently integrate the leading actual heat changes. Higher finite
    # Taylor terms are smaller than exp(logZ) times a fixed coefficient here.
    d=1-eta*eta
    hchanges=[]
    if d:
        logz=mp.log(2*d)-log_xtail;astar=-h*(1+h)
        ps=[2+2*h,1+2*h,h]
        multipliers=[1,-1,mp.sqrt(2)]
        powers=[2,2,1]
        normal=[mp.mpf(str(z)) for z in heat['normalizationLogs']]
        exponents=[2*log_epow+logz,log_xtail+2*log_epow+logz,mp.mpf('1.5')*log_xtail+log_epow+logz]
        for i in range(3):
            rate=ps[i];power=powers[i]
            integrand=lambda t:mp.exp(-rate*t)*fo(t)**power*sig((t-mp.mpf('.2'))/mp.mpf('.3'))
            itg=q(integrand,'.2','.5')+q(integrand,'.5',1)+q(integrand,1,3)+mp.exp(-3*rate)/rate
            change=astar*multipliers[i]*mp.exp(exponents[i]-normal[i])*itg
            hchanges.append(record_mp(change))
            check(f'A7-heat-debt-log-{i}-eta-{eta}',heat['heatChanges'][i]['logAbs'],mp.log(abs(change)),mp.mpf('3e-6'))
        check_true(f'nonzero-heat-beyond-float64-eta-{eta}',heat['heatChanges'][0]['sign']!=0 and heat['heatChanges'][0]['float64'] is None,'Tiny pressure change is retained, not declared zero.')
    references.append({'eta':float(eta),'pressureNormalized':mp.nstr(pressure,40),'amplitude':mp.nstr(amp_ref,40),
                       'sourceSMomentAtComputedAmplitude':record_mp(f_at),'heatLeadingChanges':hchanges,
                       'A11ReintegratedRows':[mp.nstr(z,35) for z in rows],
                       'A7ReintegratedRowsInCommonScale':[mp.nstr(z,35) for z in heat_rows]})

out={'schema':'MathScope.SourceOuterIndependentReference/1','status':'PASS' if all(c['pass'] for c in checks) else 'FAIL',
     'fixtureSha256':hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
     'scriptSha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
     'method':{'precisionDecimalDigits':mp.mp.dps,'quadrature':'96-point Gauss--Legendre with source-aware subintervals',
               'terminal':'Independent integrating-factor integrals, not RK4','heat':'Reintegrated moment increments in log(x), not the implementation x quadrature',
               'intervalCertified':False,'referenceEvaluations':calls},
     'counts':{'total':len(checks),'passed':sum(c['pass'] for c in checks),'failed':sum(not c['pass'] for c in checks)},
     'checks':checks,'referenceValues':references,'elapsedSeconds':time.monotonic()-started,
     'scope':'Finite source fixture and numerical independent checks. Neither all-eta certification nor exact moment equality is claimed.'}
(HERE/'outer-independent-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'status':out['status'],'counts':out['counts'],'elapsedSeconds':out['elapsedSeconds'],
                  'failures':[c for c in checks if not c['pass']]}))
sys.exit(0 if out['status']=='PASS' else 1)
