"""Independent FFT and exact-reference checks of exported JS calculations."""
from pathlib import Path
import json
import math
import platform
import numpy as np

BASE = Path(__file__).resolve().parents[1]


def main():
    fixture = json.loads((BASE / 'evidence/numpy-input.json').read_text())
    modes = np.asarray(fixture['modes'], dtype=int)
    uv = np.asarray(fixture['initial']).reshape((-1, 3, 2))
    u = uv[:, :, 0] + 1j * uv[:, :, 1]
    n = fixture['fftGrid']
    spectrum = np.zeros((n, n, n, 3), dtype=complex)
    for mode, value in zip(modes, u):
        spectrum[tuple(mode % n)] = value
    physical = np.fft.ifftn(spectrum, axes=(0, 1, 2)) * n**3
    adv = np.zeros_like(spectrum)
    for component in range(3):
        for axis in range(3):
            derivative = np.zeros((n, n, n), dtype=complex)
            for mode, value in zip(modes, u):
                derivative[tuple(mode % n)] = 1j * mode[axis] * value[component]
            derivative = np.fft.ifftn(derivative) * n**3
            adv[:, :, :, component] += physical[:, :, :, axis] * derivative
    transformed = np.fft.fftn(adv, axes=(0, 1, 2)) / n**3
    selected = np.asarray([transformed[tuple(k % n)] for k in modes])
    packed = np.stack([selected.real, selected.imag], axis=-1).reshape(-1)
    direct = np.asarray(fixture['direct'])
    fft = np.asarray(fixture['fft'])
    direct_error = float(np.linalg.norm(packed-direct)/max(1, np.linalg.norm(packed)))
    fft_error = float(np.linalg.norm(packed-fft)/max(1, np.linalg.norm(packed)))
    tg = json.loads((BASE / 'evidence/N8-TG.json').read_text())['results']
    exact_energy = math.exp(-4*tg['input']['viscosity']*tg['lastResolvedTime'])/4
    observed_energy = tg['history'][-1]['energy']
    energy_error = abs(observed_energy-exact_energy)
    mean_energy_initial = float(np.sum(np.abs(u)**2)/2)
    energy_cancel = float(abs(np.vdot(u, selected).real))
    checks = [
        {'id': 'numpy-vs-JS-direct-convolution', 'pass': direct_error < 1e-11},
        {'id': 'numpy-vs-JS-padded-FFT', 'pass': fft_error < 1e-11},
        {'id': 'numpy-finite-convection-energy-cancellation', 'pass': energy_cancel < 1e-12},
        {'id': 'Taylor-Green-independent-exact-energy', 'pass': energy_error < 1e-5},
    ]
    record = {'schema': 'MathScope.NavierM3.IndependentNumpy/1',
              'environment': {'python': platform.python_version(), 'numpy': np.__version__},
              'checks': checks, 'pass': all(x['pass'] for x in checks),
              'measurements': {'directError': direct_error, 'fftError': fft_error,
                               'initialMeanEnergy': mean_energy_initial,
                               'energyCancellation': energy_cancel, 'TGExactEnergy': exact_energy,
                               'TGObservedEnergy': observed_energy, 'TGEnergyError': energy_error},
              'scope': 'Independent binary64 selected finite calculation; no rigorous PDE error enclosure.'}
    (BASE / 'evidence/independent-numpy.json').write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps(record, indent=2))
    if not record['pass']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
