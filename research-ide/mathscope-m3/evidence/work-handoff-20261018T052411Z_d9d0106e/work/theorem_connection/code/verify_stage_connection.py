#!/usr/bin/env python3
"""Source-bound N6-02 connection, without executing or altering original producers.

The independent algebra is a polynomial identity over arbitrary cylindrical
field jets. Source bindings are checked separately: symbolic equality alone
does not establish a missing full-pressure construction.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from collections import defaultdict
from fractions import Fraction
from pathlib import Path


class Poly:
    """Exact commutative polynomial ring with a formal radial inverse."""
    def __init__(self, terms=None):
        self.terms = {k: Fraction(v) for k, v in (terms or {}).items() if v}

    @staticmethod
    def atom(name):
        return Poly({(name,): 1})

    @staticmethod
    def coerce(x):
        return x if isinstance(x, Poly) else Poly({(): x})

    def __add__(self, other):
        d = defaultdict(Fraction, self.terms)
        for k, v in self.coerce(other).terms.items():
            d[k] += v
        return Poly(d)
    __radd__ = __add__

    def __neg__(self):
        return Poly({k: -v for k, v in self.terms.items()})

    def __sub__(self, other):
        return self + -self.coerce(other)

    def __mul__(self, other):
        d = defaultdict(Fraction)
        for k, v in self.terms.items():
            for l, w in self.coerce(other).terms.items():
                d[tuple(sorted(k+l))] += v*w
        return Poly(d)
    __rmul__ = __mul__

    def derivative(self, axis):
        out = Poly()
        for monomial, coeff in self.terms.items():
            for i, name in enumerate(monomial):
                if name == 'nu':
                    continue
                if name == 'rho':
                    if axis != 'r':
                        continue
                    factor, replacement = -1, ('rho', 'rho')
                else:
                    stem, _, derivatives = name.partition(':')
                    factor, replacement = 1, (stem+':'+''.join(sorted(derivatives+axis)),)
                out += Poly({tuple(sorted(monomial[:i]+monomial[i+1:]+replacement)): coeff*factor})
        return out

    def zero(self):
        return not self.terms


def cylindrical_identity():
    rho, nu = Poly.atom('rho'), Poly.atom('nu')
    u = [Poly.atom('u'+str(j)) for j in range(3)]
    w = [Poly.atom('w'+str(j)) for j in range(3)]
    p, pi = Poly.atom('p'), Poly.atom('pi')
    flat = [Poly.atom('F'+str(j)) for j in range(3)]
    def D(f, a): return f.derivative(a)
    def grad(f): return [D(f,'r'),rho*D(f,'h'),D(f,'z')]
    def div(v): return D(v[0],'r')+rho*v[0]+rho*D(v[1],'h')+D(v[2],'z')
    def lap(f): return D(D(f,'r'),'r')+rho*D(f,'r')+rho*rho*D(D(f,'h'),'h')+D(D(f,'z'),'z')
    def vector_lap(v):
        return [lap(v[0])-rho*rho*v[0]-2*rho*rho*D(v[1],'h'),
                lap(v[1])-rho*rho*v[1]+2*rho*rho*D(v[0],'h'),lap(v[2])]
    def linear(v, pressure):
        vl, gp = vector_lap(v), grad(pressure)
        return [D(v[j],'t')-nu*vl[j]+gp[j] for j in range(3)]
    def tensor_div(a,b):
        # (a dot grad)b+b div(a), including rotation of cylindrical basis.
        out = [a[0]*D(b[j],'r')+rho*a[1]*D(b[j],'h')+a[2]*D(b[j],'z')+b[j]*div(a) for j in range(3)]
        out[0] -= rho*a[1]*b[1]
        out[1] += rho*a[1]*b[0]
        return out
    def residual(v, pressure):
        L, B = linear(v,pressure), tensor_div(v,v)
        return [L[j]+B[j] for j in range(3)]
    direct = residual([u[j]+w[j] for j in range(3)],p+pi)
    old, L, uw, wu, ww = residual(u,p),linear(w,pi),tensor_div(u,w),tensor_div(w,u),tensor_div(w,w)
    old_regular = [old[j]-flat[j] for j in range(3)]
    decomposed = [old_regular[j]+flat[j]+L[j]+uw[j]+wu[j]+ww[j] for j in range(3)]
    defects = [direct[j]-decomposed[j] for j in range(3)]
    controls = {
        'omit_latest_pressure_increment': [direct[j]-(decomposed[j]-grad(pi)[j]) for j in range(3)],
        'omit_new_quadratic_remainder': [direct[j]-(decomposed[j]-ww[j]) for j in range(3)],
        'omit_old_flat_residual': [direct[j]-(decomposed[j]-flat[j]) for j in range(3)],
    }
    assert all(x.zero() for x in defects)
    assert all(all(not x.zero() for x in v) for v in controls.values())
    return {
        'ring':'exact rational polynomials in arbitrary commuting field jets and rho=1/r; d_r rho=-rho^2',
        'identity':'R(u+w,p+pi)=(R(u,p)-F)+F+L(w,pi)+div(u tensor w+w tensor u)+div(w tensor w)',
        'components':['radial','angular','axial'],
        'exact_defect_monomial_counts':[len(x.terms) for x in defects],
        'difference_enclosures':[[0,0]]*3,
        'full_cylindrical_vector_laplacian_and_basis_connections':True,
        'incompressibility_not_required_for_conservative_identity':True,
        'negative_controls':{k:{'nonzero_component_monomial_counts':[len(x.terms) for x in v],'rejected':all(not x.zero() for x in v)} for k,v in controls.items()},
        'scope':'Universal differential identity; actual construction and pressure binding remain independent obligations.'}


def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def run(root):
    base = root/'analysis/base/PR30-primary67-continuation'
    nav = base/'MathScopeCompute/research-ide/mathscope-m3/navier'
    family_path = nav/'evidence/saved-initialized-norm-family-20261012/attempt1/saved-initialized-norm-family.json'
    initialized_path = nav/'evidence/global-forced-current-20261012/attempt382884203291/initialized-angular-construction.json'
    comparison_path = base/'pressure-proof/cartesian-universal-closure/E_ACTUAL_CARTESIAN_RESIDUAL_SOURCE_APPLICATION.json'
    paths = {
        'forced':root/'recovered/github-pr30/source-global-forced-current.mjs',
        'signed':root/'recovered/github-pr30/source-global-signed.mjs',
        'harmonic':nav/'source-harmonic-assembly.mjs',
        'mean':nav/'source-global-initial-mean.mjs',
        'pressure':nav/'source-updated-mean-pressure.mjs',
        'family':family_path,'initialized':initialized_path,'full3_comparison':comparison_path}
    pins=json.loads((root/'work/theorem_connection/evidence/STAGE_INPUT_PINS.json').read_text())
    assert set(pins)==set(paths)
    for key,path in paths.items():
        assert digest(path)==pins[key]['sha256'] and path.stat().st_size==pins[key]['bytes'], 'Input changed '+key
    expected = {
        'forced':'b41f298702238cf6170c16f31362e9429ebc659ca2a999d8d85cf2159ae01be3',
        'signed':'4078e65989da153d57a36672645bad13ac0b4f2894c5c77b88208fc1fc25ceb1',
        'harmonic':'339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
        'mean':'513779930558d044076318f39396060465b6518184b952482a0d973ac16bd411'}
    for k,h in expected.items():
        assert digest(paths[k]) == h, 'Changed source '+k
    texts = {k:p.read_text() for k,p in paths.items() if p.suffix == '.mjs'}
    required = {
      'forced':[
        'assertGlobalInitializedAngular(source);',
        "exponent=kind==='velocity'?A:kind==='residual'?G.add(G.mul(G.q(2),A),G.q(1,2)):G.mul(G.q(2),A)",
        'referenceValues=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...parameters.slice(3)]',
        'referenceBody=G.mul(power(ratio,exponent),G.expressionValue(ownSystem,referenceValues))',
        'newLocalMeanPressure=G.mul(power(source.reference.ratio,G.neg(G.mul(G.q(2),band.constants.A)))',
        "latestMean=reconstructUpdatedFullMeanPressure(G,{geometry:pressure.geometry,background,",
        "velocity:source.mean.stages.moments.velocity,covariance,stress:pressure.residual.fullOriginalStress,",
        'pressureDifference=G.sub(latestMean.pressure.value,source.mean.stages.moments.pressure.value)',
        'pressure:C.value(localPressureDifference)',
        'previous:newMean,increment:t.waveRows,oldFlatResidual:t.oldFlatResidual',
        'fullPressure=G.add(band.fields.pressure,latestMean.pressure.value,angularPressureField.root)',
        'direct=exactRealCylindricalPDE(G,{geometry,velocity,pressure:fullPressure})',
        'assembledResidual=meanDirect.conservativeResidual.map((x,j)=>G.add(x,residualFields[j].root))',
        't.update.newQuadraticRemainderRetained&&t.update.oldFlatResidualRetained',
        'f.contributions===162'],
      'mean':[
        'afterTemporal=reconstructUpdatedFullMeanPressure(G,{...input,velocity:temporal.potential.velocity',
        'actualInputDefects={P:afterTemporal.mean.P,Jtheta:afterTemporal.mean.Jtheta,Jz:afterTemporal.mean.Jz}',
        'afterMoments=reconstructUpdatedFullMeanPressure(G,{...input,velocity:updated',
        "allCorrectionsRemainDivergenceFree:true"],
      'harmonic':['oldRegular=kernel.result.conservative.map((M,j)=>S.sub(M,flat[j]))',
        'decomposed=oldRegular.map((M,j)=>S.add(M,flat[j],linearized[j],quadratic[j]))'],
      'signed':['W=registered.after.roots,mean=buildGlobalMeanState(G,band,W',
        'updated:{fullAuxiliaryMean:W,mean}', 'fullAuxiliaryPressureConstructed:false']}
    source_checks=[]
    for k, snippets in required.items():
        for snippet in snippets:
            passed=snippet in texts[k]
            assert passed, 'Source dataflow mismatch: '+snippet
            source_checks.append({'file':k,'literal':snippet,'line':texts[k][:texts[k].index(snippet)].count('\n')+1,'pass':passed})
    family=json.loads(family_path.read_text())
    roots=family['source']['actualRoots']
    initial=json.loads(initialized_path.read_text())
    comparison=json.loads(comparison_path.read_text())
    g=initial['global']
    assert g['velocity']==[3825006,3825007,3825008] and g['pressure']==3825009
    assert roots['initializedVelocity']=={'beta':3614790,'v':3614791,'gamma':3614792}
    assert roots['initializedPressure']['value']==3615361
    assert roots['temporalPressure']['value']==3614634
    for row in comparison['literalRootEqualities']:
        j=row['component']
        assert row['directRoot']==g['direct']['conservativeResidual'][j]
        assert row['decomposedRoot']==g['assembledResidual'][j]
        assert row['differenceEnclosure']==[0,0]
    algebra=cylindrical_identity()
    return {
      'schema':'MathScope.ActualStagePressureResidualConnection/1',
      'source_manifest':{k:{'path':str(p.relative_to(root)),'sha256':digest(p),'bytes':p.stat().st_size} for k,p in paths.items()},
      'source_dataflow_checks':source_checks,'independent_algebra':algebra,
      'stages':[
        {'id':'initialized-temporal','operation':'temporal-8.20 then full-pressure-8.12',
         'actual_velocity_roots':roots['temporalVelocity'],'latest_mean_pressure_root':3614634,
         'fresh_defect_roots':roots['freshInputDefects'],
         'proof_application':'The universal conservative identity applies to the literal temporal velocity increment and complete refreshed pressure. Latest pressure includes T0, A0 and full covariance; no discarded zero mode.',
         'independent_frozen_whole3_stage_comparison':'not supplied separately; endpoint comparison follows after the five step',
         'status':'SOURCE_BOUND_OPERATOR_IDENTITY_WITH_FULL_PRESSURE'},
        {'id':'initialized-five','operation':'five-8.25 on fresh P/J then full-pressure-8.12',
         'actual_velocity_roots':roots['initializedVelocity'],'latest_mean_pressure_root':3615361,
         'proof_application':'Same universal identity, actual fresh targets, complete five increments and complete pressure difference; retained nonlinear defect remainder is not set to zero.',
         'status':'SOURCE_BOUND_OPERATOR_IDENTITY_WITH_FULL_PRESSURE'},
        {'id':'initialized-full3','actual_velocity_roots':g['velocity'],'latest_full_pressure_root':g['pressure'],
         'direct_roots':g['direct']['conservativeResidual'],'assembled_roots':g['assembledResidual'],
         'comparison':comparison['literalRootEqualities'],
         'status':'INHERITED_EXACT_INDEPENDENT_WHOLE3_SOURCE_COMPARISON'},
        {'id':'implemented-forced-angular','operation':'all20 positive systems, conjugate routes, full covariance, refreshed pressure, all162 fields',
         'actual_input_source':initial['source'],'source_constructor':paths['forced'].name,
         'full_pressure_expression':'background pressure + latestMean.pressure.value + all angular pressure',
         'direct_expression':'exactRealCylindricalPDE(complete velocity, fullPressure)',
         'assembled_expression':'meanDirect.conservativeResidual + actual all162 waveResidual fields',
         'proof_application':'Universal update identity applies to each retained complete old state and increment including the new mean pressure difference. Exact finite Fourier reconstruction commutes with the same cylindrical differential operator. The unchanged fixed-label physical normalization and support-disjoint assembly transport all three components. This is an operator theorem on the actual constructor expressions, not a flag or a numerical sample.',
         'symbolic_source_application':'APPLIES_TO_COMPLETE_CONSTRUCTOR_OUTPUT',
         'frozen_output_graph_replayed_this_run':False,
         'snapshot_recovery':'11 forced-stage checkpoints were not found in searched recovered archives; this is a replay-provenance issue, not an extra mathematical hypothesis',
         'post_forced_class_bounds':'not inferred from finite residual identity',
         'status':'SOURCE_BOUND_COMPLETE_CONSTRUCTOR_OPERATOR_APPLICATION'},
        {'id':'implemented-signed-covariance','operation':'fixed-primary signed update',
         'mean_pressure_available':True,'complete_auxiliary_pressure_available':False,
         'obstruction':'Local full covariance is integrated over both auxiliary coordinates before registerGlobalMeanFields; updated.fullAuxiliaryMean and buildGlobalMeanState do not determine its discarded nonzero auxiliary modes. No full-pressure/direct/assembled output is constructed for this update.',
         'smallest_next_implementation':'Retain pre-Haar local after covariance; assemble it on the unchanged full162 cover, reconstruct gr -> Haar P -> full shifted pm and A0, add complete updated angular pressure and velocity, then bind both whole3 residual paths. Do not transplant a private seal or replace fullY covariance by its mean.',
         'status':'OPEN_ACTUAL_FULL_AUXILIARY_PRESSURE_CONSTRUCTION'}],
      'N6_02':'OPEN_SIGNED_FULL_PRESSURE_STAGE_UNRESOLVED',
      'original_1260_reexecuted':False,'originals_modified':False,
      'all_finite_correction_cycle_certified':False,
      'scoped_connection_checks_passed':True}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3])
    parser.add_argument('--out',type=Path)
    args=parser.parse_args()
    out=args.out or args.root/'work/theorem_connection/evidence/STAGE_SOURCE_APPLICATION.json'
    result=run(args.root.resolve());out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'source_checks':len(result['source_dataflow_checks']),'algebra':result['independent_algebra']['exact_defect_monomial_counts'],'negative_controls':3,'N6_02':result['N6_02'],'output':str(out)}))

if __name__=='__main__': main()
