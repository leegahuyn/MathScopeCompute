from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


EvidenceGrade = Literal[
    "NUMERICAL INDICATOR",
    "CERTIFIED NUMERICAL",
    "UNKNOWN",
    "FAILED",
]


class RunRequest(BaseModel):
    adapter: str = Field(min_length=1, max_length=128)
    inputSpec: dict[str, Any]
    environment: dict[str, Any] = Field(default_factory=dict)


class Diagnostic(BaseModel):
    level: Literal["info", "warning", "error"]
    code: str
    message: str


class EvidenceRecord(BaseModel):
    id: str
    grade: EvidenceGrade
    claimRef: str
    method: str
    inputsHash: str
    environmentHash: str
    residuals: dict[str, Any] | None = None
    errorBounds: dict[str, Any] | None = None
    assumptions: list[str] = Field(default_factory=list)
    generatedAt: str
    adapterVersion: str
    upstreamRevisions: list[str] = Field(default_factory=list)
    stale: bool = False
    scope: str


class AdapterResult(BaseModel):
    adapter: str
    adapterVersion: str
    status: Literal["completed", "failed"]
    outputRepresentations: list[dict[str, Any]] = Field(default_factory=list)
    evidenceRecords: list[EvidenceRecord] = Field(default_factory=list)
    diagnostics: list[Diagnostic] = Field(default_factory=list)
    residuals: dict[str, Any] | None = None
    errorBounds: dict[str, Any] | None = None
    provenanceEdges: list[dict[str, Any]] = Field(default_factory=list)
    reproducibilityHash: str
    environment: dict[str, Any]
