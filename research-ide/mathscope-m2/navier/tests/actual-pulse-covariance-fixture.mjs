import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {actualMeanPulseCovariance} from '../actual-pulse-covariance-integrals.mjs';
const source=new URL('../actual-pulse-covariance-integrals.mjs',import.meta.url),coarse=actualMeanPulseCovariance({cells:64}),fine=actualMeanPulseCovariance({cells:512});
const data={schema:'MathScope.ActualPulseCovarianceIndependentInput/1',runtimeSHA256:createHash('sha256').update(await readFile(source)).digest('hex'),sourceProfile:fine.profileId,sourceAssemblySHA256:fine.sourceHash,
  center:fine.centerAmplitude,coarseIntegrals:coarse.integrals,fineIntegrals:fine.integrals,observations:coarse.rows,
  transverseMass:{...fine.transverseMass,rows:undefined},haar:fine.haar,covariance:fine.covariance,scope:fine.scope,checks:fine.checks,
  independentProbeScope:'The pi/Gaussian limit and finite cutoff function verify arithmetic independently. They do not replace the pinned positive parameters of the actual source solution.'};
const path=new URL('./actual-pulse-covariance-independent.json',import.meta.url);await writeFile(path,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({fixture:path.pathname,sourceChecks:data.checks.length,coarseObservationCells:data.observations.length,finalCovarianceCells:512}));
