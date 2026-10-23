#!/usr/bin/env python3
"""Exact source-sign proof for N3 natural-series positive scale parameters.

Positivity of a *declared* coefficient majorant Q does NOT establish
||(Phi,u)||_{B_rho}<=Q. Positivity of rho does NOT prove a common analytic
continuation disk or any actual source Y,eta coordinate interval.
"""
from pinned_n3_parameter_intervals import pinned_profile,UnavailablePinnedSourceParameter

class MissingSourceAnalyticPremise(ValueError):pass

def structural_real_sign(expression,definitions,stack=()):
    """Return strict sign: +1, 0, -1, or None if sign is undecidable.
    Raises instead of inventing signs or accepting unsupported source syntax.
    """
    if not isinstance(expression,dict) or len(expression)!=1:
        raise MissingSourceAnalyticPremise('Source sign expression has unknown shape')
    op,val=next(iter(expression.items()))
    if op=='ref':
        if not isinstance(val,str) or val not in definitions:
            raise MissingSourceAnalyticPremise('Missing declared source reference')
        if val in stack:raise MissingSourceAnalyticPremise('Cyclic parameter dependency')
        return structural_real_sign(definitions[val],definitions,stack+(val,))
    if op=='integer':
        if isinstance(val,bool) or not (isinstance(val,int) or isinstance(val,str) and val.lstrip('-').isdigit()):
            raise MissingSourceAnalyticPremise('Invalid source integer')
        z=int(val);return (z>0)-(z<0)
    if op=='rational':
        from fractions import Fraction
        try:
            if not isinstance(val,str):raise ValueError('not exact')
            z=Fraction(val)
        except Exception as e:raise MissingSourceAnalyticPremise('Invalid source rational') from e
        return (z>0)-(z<0)
    if op=='exp':
        # exp(real-valued finite argument) is always strictly positive.
        structural_real_sign(val,definitions,stack)
        return 1
    if op=='power':
        if not isinstance(val,list) or len(val)!=2:
            raise MissingSourceAnalyticPremise('Invalid source power')
        base,exponent=val
        if not isinstance(exponent,int) or isinstance(exponent,bool):
            raise MissingSourceAnalyticPremise('Only finite integer power')
        sign=structural_real_sign(base,definitions,stack)
        if exponent==0:
            if sign==0:raise MissingSourceAnalyticPremise('0^0 undefined')
            return 1
        if exponent<0 and sign==0:
            raise MissingSourceAnalyticPremise('Division by exact zero in negative power')
        if exponent%2==0:
            return 0 if sign==0 else 1 if sign in (1,-1) else None
        return sign
    if op=='product':
        if not isinstance(val,list) or not val:
            raise MissingSourceAnalyticPremise('Empty product')
        signs=[structural_real_sign(x,definitions,stack) for x in val]
        if 0 in signs:return 0
        if None in signs:return None
        a=1
        for s in signs:a*=s
        return a
    if op=='sum':
        if not isinstance(val,list) or not val:
            raise MissingSourceAnalyticPremise('Empty sum')
        signs=[structural_real_sign(x,definitions,stack) for x in val]
        nz=[s for s in signs if s!=0]
        return 0 if not nz else nz[0] if nz[0] in (-1,1) and all(z==nz[0] for z in nz) else None
    if op=='quotient':
        if not isinstance(val,list) or len(val)!=2:
            raise MissingSourceAnalyticPremise('Invalid source quotient')
        a=structural_real_sign(val[0],definitions,stack)
        b=structural_real_sign(val[1],definitions,stack)
        if b in (None,0):raise MissingSourceAnalyticPremise('Denominator not proven nonzero')
        return None if a is None else a*b
    raise MissingSourceAnalyticPremise('Unsupported sign-inference node: '+str(op))

def original_n3_Q_rho_strict_positivity():
    p=pinned_profile()
    defs=p['parametersExactExpressions']
    # These exact formula shapes are source-byte-pinned; do not silently allow
    # same-named replacements if someone edits the source without re-auditing.
    expected={
      'rho':{'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},
      'Q':{'quotient':[{'product':[{'integer':'1852673427797059126777135760139006525652319754650249024631321344126610074238976'},
                       {'ref':'K'}]},{'power':[{'ref':'sigmaStar'},2]}]},
      'Lambda':{'power':[{'ref':'Q'},64]},
      'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]},
      'j0':{'power':[{'ref':'h'},4]},
      'K':{'power':[{'ref':'Pstar'},2]},
      'Pstar':{'exp':{'ref':'logP'}},
    }
    for name,ast in expected.items():
        if defs.get(name)!=ast:
            raise MissingSourceAnalyticPremise('Original source definition changed: '+name)
    result={k:structural_real_sign({'ref':k},defs) for k in
            ('h','j0','sigmaStar','rho','Pstar','K','Q','Lambda')}
    if any(x!=1 for x in result.values()):
        raise MissingSourceAnalyticPremise('Source positivity derivation incomplete')
    return {'schema':'MathScope.M3.SourcePositiveN3CoefficientScales/1',
      'pinned_source_id':p['id'],
      'pinned_expression_sha256':p['parameterExpressionSHA256'],
      'strictly_positive_declared_parameters':sorted(result),
      'rho_is_strictly_positive':True,'Q_is_strictly_positive':True,
      'Lambda_is_strictly_positive':True,
      'numerical_rho_positive_lower_bound_certified':False,
      'source_coefficient_Brho_norm_le_Q_proven':False,
      'shared_complex_analytic_domain_proven':False,
      'all_56_source_Y_eta_argument_boxes_bounded':False,
      'actual_final_A_b_p_numeric_values':False,
      'actual_final_67_jets_certified':0,'release':'HOLD'}
