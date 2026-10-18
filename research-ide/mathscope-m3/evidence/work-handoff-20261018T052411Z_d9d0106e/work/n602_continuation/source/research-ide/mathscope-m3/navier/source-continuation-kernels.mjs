/** Additive algebra helpers for the separately sealed finite successor.
 * completeSourceField is copied exactly from the pinned forced constructor
 * except its export and recipe label. decomposedUpdate is the independently
 * reviewed full tensor product rule. These helpers issue no source authority.
 */
import {guardGlobalLocalBody} from './source-global-current.mjs';
import {exactRealCylindricalPDE,originalCylindricalDifferentialOperators} from './source-harmonic-assembly.mjs';
export function completeSourceField(source,templates,name,bodyAt,{kind,angular=true}={}){
  const G=source.G,pressure=source.mean.temporal.pressure,current=pressure.current,band=current.band,{R,Z,T,theta,ell,Xrep,etaRep,sRep}=band.coordinates,
    {A,D}=band.constants,{r0,Ls}=band.geometry,{levelDifference}=source.coordinates,
    parameters=angular?source.coordinates.localParameters:source.coordinates.localParameters.filter(x=>x!==theta),
    fieldParameters=angular?[...pressure.cover.parameters,theta]:pressure.cover.parameters,
    directions=angular?[...pressure.cover.directions,theta]:pressure.cover.directions,
    ratio=source.reference.ratio,power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    exponent=kind==='velocity'?A:kind==='residual'?G.add(G.mul(G.q(2),A),G.q(1,2)):G.mul(G.q(2),A),
    choose=values=>{let out=G.zero;for(let j=4;j>=0;j--)out=G.choose(levelDifference,G.q(2*j-1,2),G.q(2*j+1,2),out,values[j],out);return out;},
    systems=[0,1].map(signIndex=>{
      const selected=templates.filter(t=>t.signIndex===signIndex).sort((a,b)=>a.levelDifference-b.levelDifference),
        guardedLifts=selected.map(t=>G.choose(t.lift.xi,G.neg(r0),r0,G.zero,G.choose(t.lift.v,G.zero,Ls,G.zero,bodyAt(t),G.zero),G.zero)),
        own=guardGlobalLocalBody(G,current.geometry,current.local.slowCutoff,choose(guardedLifts),{auxiliary:false}),
        fixed=G.simultaneousSubstitute(own.body,[Xrep,etaRep,sRep],[current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s]),
        ownSystem=G.defineExpressionFunction({name:name+'_own_'+signIndex,parameters,body:fixed}),
        referenceValues=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...parameters.slice(3)],
        referenceBody=G.mul(power(ratio,exponent),G.expressionValue(ownSystem,referenceValues)),
        system=G.defineExpressionFunction({name:name+'_reference_'+signIndex,parameters,body:referenceBody});
      return {system,ownSystem,ownBody:fixed,referenceBody,referenceValues,guards:own,allScaleFactorsInsideDifferentiatedBody:true};
    }),rows=[];
  for(const row of pressure.cover.rows){const b=pressure.cover.bands[row.relativeBand+1];for(const sign of row.signs){
    const values=[R,Z,T,row.label.ell,...row.label.grid,ell,...pressure.geometry.Y,...sign.rectangle.center,...sign.rectangle.copy,...(angular?[theta]:[]),b.delta],
      derivativeMaps=[...[0,1,2,8,9].map(parameter=>[{parameter,coefficient:G.one}]),...(angular?[[{parameter:14,coefficient:G.one}]]:[])];
    rows.push({localSystem:systems[sign.sourceLocalRow].system,values,derivativeMaps,coefficient:G.one,guards:row.guards,
      label:{key:row.key,ell:row.label.ell,grid:row.label.grid,sign:sign.sign,fixedDifference:b.delta,countBoxOnce:true}});
  }}
  const field=G.definePeriodicIndexedField({name,parameters:fieldParameters,directions,rows,sourceRecipe:{actualFiniteSuccessorSubstep:true,
    all81Boxes:true,bothSigns:true,everyFixedDifferenceRetained:true,originalNearestCopyAndLabelsFrozen:true,
    allScaleAndChainFactorsInsideActualLocalBody:true,physicalScale:kind,sourceCover:pressure.cover.proof}});
  return {field,root:G.periodicIndexedValue(field,fieldParameters),systems,parameters:fieldParameters,directions,contributions:rows.length,
    originalSourceLabelsAndCopiesFrozenBeforeDerivative:true};
}

export function decomposedUpdate(G,geometry,oldVelocity,oldPressure,velocity,pressure,oldFlat){
  const D=originalCylindricalDifferentialOperators(G,geometry),{R,epsilon}=D;
  const increment=velocity.map((x,j)=>G.sub(x,oldVelocity[j]));
  const pressureIncrement=G.sub(pressure,oldPressure);
  const tensorDiv=(a,b)=>{
    const tensor=a.map(x=>b.map(y=>G.mul(x,y)));
    const value=tensor.map(row=>G.add(D.Dr(row[0]),G.div(row[0],R),D.angular(row[1]),D.Dz(row[2])));
    value[0]=G.sub(value[0],G.div(tensor[1][1],R));
    value[1]=G.add(value[1],G.div(tensor[0][1],R));
    return value;
  };
  const r2=G.pow(R,2),lap=[
    G.sub(G.sub(D.lap(increment[0]),G.div(increment[0],r2)),G.div(G.mul(G.q(2),D.thetaDerivative(increment[1])),r2)),
    G.add(G.sub(D.lap(increment[1]),G.div(increment[1],r2)),G.div(G.mul(G.q(2),D.thetaDerivative(increment[0])),r2)),
    D.lap(increment[2])];
  const gradient=[D.Dr(pressureIncrement),D.angular(pressureIncrement),D.Dz(pressureIncrement)];
  const linear=increment.map((x,j)=>G.add(D.time(x),G.neg(G.mul(epsilon,lap[j])),gradient[j]));
  const left=tensorDiv(oldVelocity,increment),right=tensorDiv(increment,oldVelocity),quadratic=tensorDiv(increment,increment);
  const old=exactRealCylindricalPDE(G,{geometry,velocity:oldVelocity,pressure:oldPressure});
  const oldRegular=old.conservativeResidual.map((x,j)=>G.sub(x,oldFlat[j]));
  const residual=oldRegular.map((x,j)=>G.add(x,oldFlat[j],linear[j],left[j],right[j],quadratic[j]));
  return {increment,pressureIncrement,oldResidual:old.conservativeResidual,oldRegular,
    oldFlatResidual:oldFlat,linear,orderedCrossTerms:[left,right],newQuadraticRemainder:quadratic,residual};
}
