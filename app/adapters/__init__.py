from .index_elliptic import EllipticIndexReferenceAdapter
from .ode_ivp import ODEIVPAdapter
from .optimization_poisson import PoissonAmplitudeOptimizationAdapter
from .poisson_fd import PoissonFDAdapter
from .resolvent_matrix import ResolventMatrixAdapter
from .spectrum_laplacian import LaplacianSpectrumAdapter
from .topology_gudhi import GUDHITopologyAdapter
from .topology_ripser import RipserTopologyAdapter

ADAPTERS = {
    ODEIVPAdapter.name: ODEIVPAdapter(),
    PoissonAmplitudeOptimizationAdapter.name: PoissonAmplitudeOptimizationAdapter(),
    PoissonFDAdapter.name: PoissonFDAdapter(),
    LaplacianSpectrumAdapter.name: LaplacianSpectrumAdapter(),
    ResolventMatrixAdapter.name: ResolventMatrixAdapter(),
    GUDHITopologyAdapter.name: GUDHITopologyAdapter(),
    RipserTopologyAdapter.name: RipserTopologyAdapter(),
    EllipticIndexReferenceAdapter.name: EllipticIndexReferenceAdapter(),
}
