from .poisson_fd import PoissonFDAdapter
from .resolvent_matrix import ResolventMatrixAdapter
from .spectrum_laplacian import LaplacianSpectrumAdapter

ADAPTERS = {
    PoissonFDAdapter.name: PoissonFDAdapter(),
    LaplacianSpectrumAdapter.name: LaplacianSpectrumAdapter(),
    ResolventMatrixAdapter.name: ResolventMatrixAdapter(),
}
