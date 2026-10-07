from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.models import AdapterResult


class Adapter(ABC):
    name: str
    version: str

    @abstractmethod
    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        raise NotImplementedError
