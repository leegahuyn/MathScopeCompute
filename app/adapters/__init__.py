from .ode_ivp import ODEIVPAdapter
from .optimization_poisson import PoissonAmplitudeOptimizationAdapter
from .poisson_fd import PoissonFDAdapter
from .resolvent_matrix import ResolventMatrixAdapter
from .spectrum_laplacian import LaplacianSpectrumAdapter

ADAPTERS = {
    ODEIVPAdapter.name: ODEIVPAdapter(),
    PoissonAmplitudeOptimizationAdapter.name: PoissonAmplitudeOptimizationAdapter(),
    PoissonFDAdapter.name: PoissonFDAdapter(),
    LaplacianSpectrumAdapter.name: LaplacianSpectrumAdapter(),
    ResolventMatrixAdapter.name: ResolventMatrixAdapter(),
}
