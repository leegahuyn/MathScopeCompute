#!/usr/bin/env python3
"""Independent NumPy and closed-form checks of the actual selected N8 flow.

The saved adaptive times are inputs to a separate exact CN modal recurrence.
The finite solution, spatial synthesis and energy are checked independently;
this does not turn finite periodic energy into original compact-K energy.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import math
import platform
import sys
import numpy as np


def verify(record):
    record = record.get('record', record)
    result = record['result']
    run, observed = result['results'], result['observations']
    if (result['operation'] != 'galerkin' or run['input']['fixture'] != 'Taylor-Green'
            or run['branch'] != 'GENERIC_FOURIER_GALERKIN'
            or observed['energy']['originalPaperWholeSpaceEnergy'] is not False):
        raise ValueError('This independent reference verifies the stated periodic Taylor-Green selected run only.')
    checks, measurements = [], {}

    def check(name, error, tolerance):
        value = float(error)
        checks.append({'id': name, 'absoluteError': value, 'absoluteTolerance': tolerance,
                       'pass': math.isfinite(value) and value <= tolerance})

    modes = np.asarray(run['modes'], dtype=int)
    initial = np.asarray(run['initial']).reshape((-1, 3, 2))
    initial = initial[:, :, 0] + 1j*initial[:, :, 1]
    final = np.asarray(run['final']).reshape((-1, 3, 2))
    final = final[:, :, 0] + 1j*final[:, :, 1]
    mode_index = {tuple(k): j for j, k in enumerate(modes)}
    exact_initial = np.zeros_like(initial)
    for x in (-1, 1):
        for y in (-1, 1):
            j = mode_index[(x, y, 0)]
            exact_initial[j, 0], exact_initial[j, 1] = -1j*x/4, 1j*y/4
    check('independent-original-Taylor-Green-Fourier-coefficients', np.max(np.abs(initial-exact_initial)), 0)

    # Projected convection is a pressure gradient for this field, and every
    # nonzero mode has |k|^2=2. Each accepted adaptive step uses two half CN
    # steps. The exact rational stability function applies independently of
    # the JS implementation's coefficient and invariant loops.
    nu, amplitude, amplitude_rows = run['input']['viscosity'], 1.0, [(0.0, 1.0)]
    for step in run['steps']:
        if step['accepted']:
            dt = step['dt']
            factor = (1-nu*dt)/(1+nu*dt) if run['input']['fixedStep'] else ((1-nu*dt/2)/(1+nu*dt/2))**2
            amplitude *= factor
            amplitude_rows.append((step['time']+dt, amplitude))
    check('independent-CN-mode-recurrence-at-selected-time', np.max(np.abs(final-amplitude*exact_initial)), 2e-12)
    history_errors, time_errors = [], []
    if len(amplitude_rows) != len(run['history']):
        raise ValueError('An accepted state or its energy history is missing.')
    for (time, a), row in zip(amplitude_rows, run['history']):
        time_errors.append(abs(time-row['time']))
        history_errors.append(abs(a*a/4-row['energy']))
    check('independent-accepted-time-history', max(time_errors), 2e-14)
    check('independent-full-selected-energy-history', max(history_errors), 2e-12)

    samples = observed['samples']
    coordinates = np.asarray([row['position'] for row in samples])
    phases = np.exp(1j*(coordinates @ modes.T))
    synthesis = phases @ final
    values = np.asarray([row['velocity'] for row in samples])
    check('independent-complex-Fourier-synthesis-of-every-visible-point', np.max(np.abs(synthesis.real-values)), 2e-12)
    check('independent-Hermitian-imaginary-remainder', np.max(np.abs(synthesis.imag)), 2e-12)
    check('independent-speed-observable', np.max(np.abs(np.linalg.norm(synthesis.real, axis=1)-[row['speed'] for row in samples])), 2e-12)
    exact_field = np.stack([amplitude*np.sin(coordinates[:, 0])*np.cos(coordinates[:, 1]),
                           -amplitude*np.cos(coordinates[:, 0])*np.sin(coordinates[:, 1]),
                           np.zeros(len(samples))], axis=1)
    check('independent-trigonometric-selected-field', np.max(np.abs(values-exact_field)), 2e-12)
    angular_errors, undefined_axis = [], 0
    for row, velocity in zip(samples, synthesis.real):
        angular = row['angularVelocity']
        x, y = np.asarray(row['position'])[:2]-np.asarray(angular['origin'])[:2]
        if x*x+y*y == 0:
            if angular['value'] is not None or angular['status'] != 'UNDEFINED_ON_AXIS':
                raise ValueError('Undefined axial angular velocity was replaced by a number.')
            undefined_axis += 1
        else:
            angular_errors.append(abs((x*velocity[1]-y*velocity[0])/(x*x+y*y)-angular['value']))
    check('independent-angular-velocity-of-all-defined-points', max(angular_errors), 2e-12)

    energy = observed['energy']
    global_energy = float(np.sum(np.abs(final)**2)/2)*(2*math.pi)**3
    check('independent-Parseval-whole-periodic-integral', abs(global_energy-energy['global']['integral']), 2e-11)

    def integrate_box(bounds, counts):
        axes = [np.linspace(lo, hi, n, endpoint=False)+(hi-lo)/(2*n) for (lo, hi), n in zip(bounds, counts)]
        grid = np.stack(np.meshgrid(*axes, indexing='ij'), axis=-1).reshape((-1, 3))
        field = (np.exp(1j*(grid @ modes.T)) @ final).real
        volume = math.prod(hi-lo for lo, hi in bounds)
        return float(np.mean(np.sum(field**2, axis=1)/2)*volume)

    references = {'whole-periodic-midpoint': (energy['global']['bounds'], energy['global']['independentMidpoint']),
                  'selected-core-coarse-midpoint': (energy['core']['bounds'], energy['core']['coarse']),
                  'selected-core-fine-midpoint': (energy['core']['bounds'], energy['core']['fine'])}
    for name, (bounds, quad) in references.items():
        check('independent-'+name, abs(integrate_box(bounds, quad['grid'])-quad['integral']), 2e-11)
    continuous_energy = math.exp(-4*nu*run['lastResolvedTime'])/4
    check('closed-form-continuous-Taylor-Green-reference-with-stated-discretization-tolerance',
          abs(continuous_energy-run['history'][-1]['energy']), 1e-5)
    measurements.update({'modalAmplitudeAtSelectedTime': amplitude, 'visiblePointCount': len(samples),
                         'undefinedAxisCount': undefined_axis, 'independentWholePeriodicEnergy': global_energy,
                         'continuousReferenceMeanEnergy': continuous_energy,
                         'selectedDiscreteMeanEnergy': run['history'][-1]['energy']})
    return {'schema': 'MathScope.N8.IndependentSelectedRunReference/1',
            'environment': {'python': platform.python_version(), 'numpy': np.__version__, 'platform': platform.platform()},
            'checks': checks, 'checkCount': len(checks), 'measurements': measurements,
            'pass': all(row['pass'] for row in checks),
            'scope': 'Fresh NumPy, trigonometric, modal-recurrence and Parseval checks of this finite periodic selected run.',
            'originalPaperWholeSpaceEnergy': False, 'continuumErrorEnclosureIssued': False, 'wholeM3Complete': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('record', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Preserve prior observations; choose a new output path.')
    raw = args.record.read_bytes()
    record = verify(json.loads(raw))
    record['recordedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    record['input'] = {'path': str(args.record), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    source = Path(__file__).read_bytes()
    record['verifier'] = {'path': Path(__file__).name, 'bytes': len(source), 'sha256': hashlib.sha256(source).hexdigest()}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps({'pass': record['pass'], 'checks': record['checkCount'], 'output': str(args.output),
                      'measurements': record['measurements']}))
    return 0 if record['pass'] else 1


if __name__ == '__main__':
    sys.exit(main())
