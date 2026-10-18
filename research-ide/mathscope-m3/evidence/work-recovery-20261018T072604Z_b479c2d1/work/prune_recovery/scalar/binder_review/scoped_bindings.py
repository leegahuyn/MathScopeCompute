"""Lexical binding plans for recovered scalar source expressions.

This is a binding adapter, not a scalar evaluator or numerical integrator.
It never mutates source records and never materializes a derivative. Source
authentication and registry resolution remain the caller's responsibility.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
from typing import Callable, Mapping


class BindingError(ValueError):
    """Malformed source or an unresolved required binding."""


class DerivativeBodyRequired(BindingError):
    """The native call needs the original formal derivative materializer."""


def require(condition, message):
    if not condition:
        raise BindingError(message)


def source_id(value):
    require(type(value) is int and value >= 0, "Expected a nonnegative source node ID")
    return value


@dataclass(frozen=True, eq=False)
class BoundSymbol:
    """Opaque scoped binding token; carries no numerical value."""
    label: str


@dataclass(frozen=True, eq=False)
class Scope:
    """Immutable frame. Identity is part of any evaluation cache key.

    Keeping immutable frame identity avoids caching a node under another
    integral sample or native application. A caller may additionally intern
    equivalent frames, but source ID alone is never a valid value cache key.
    """
    bindings: tuple = ()

    def __post_init__(self):
        require(type(self.bindings) is tuple, "Scope bindings must be immutable")
        keys = []
        for item in self.bindings:
            require(type(item) is tuple and len(item) == 2, "Malformed scope entry")
            key, value = item
            source_id(key)
            require(isinstance(value, (ScopedRef, BoundSymbol)), "Unscoped binding value")
            keys.append(key)
        require(len(keys) == len(set(keys)), "Duplicate formal coordinate")

    def lookup(self, coordinate):
        source_id(coordinate)
        for key, value in self.bindings:
            if key == coordinate:
                return value
        raise BindingError(f"Unbound coordinate {coordinate}; no global fallback")

    def shadow(self, coordinate, value):
        source_id(coordinate)
        return Scope(tuple((key, old) for key, old in self.bindings if key != coordinate)
                     + ((coordinate, value),))


@dataclass(frozen=True)
class ScopedRef:
    root: int
    scope: Scope

    def __post_init__(self):
        source_id(self.root)
        require(isinstance(self.scope, Scope), "A source root requires its lexical scope")

    @property
    def cache_key(self):
        return self.root, self.scope


@dataclass(frozen=True)
class IntegralPlan:
    source: ScopedRef
    body_root: int
    binder: int
    left: ScopedRef
    right: ScopedRef

    def integrand_at(self, binding: BoundSymbol):
        require(isinstance(binding, BoundSymbol), "Integral sample requires an explicit binding token")
        return ScopedRef(self.body_root, self.source.scope.shadow(self.binder, binding))


@dataclass(frozen=True)
class ExpressionPlan:
    source: ScopedRef
    registry_key: str
    definition_sha256: str
    formal_body: int
    parameters: tuple[int, ...]
    orders: tuple[int, ...]
    derivative_limits: tuple[int, ...]
    arguments: tuple[ScopedRef, ...]

    @property
    def materialization_required(self):
        return any(self.orders)

    @property
    def formal_derivative_sequence(self):
        # Original materializers differentiate in parameter order, before
        # applying the complete simultaneous tuple.
        return tuple(p for p, order in zip(self.parameters, self.orders) for _ in range(order))

    def zero_order_body(self):
        if self.materialization_required:
            raise DerivativeBodyRequired(
                "Differentiate the retained formal body before simultaneous application; "
                "the unmodified body cannot stand in for this native derivative")
        # A callee gets only its explicit formals. Argument closures retain
        # their caller environment, making swaps and binder collisions safe.
        return ScopedRef(self.formal_body, Scope(tuple(zip(self.parameters, self.arguments))))


EXPRESSION_OPS = frozenset({"actual_expression_partial", "m3_aux_expression_partial",
                          "m3_coupled_expression_partial", "m3_forced_expression_partial"})


class BindingAdapter:
    def __init__(self, get_node: Callable[[int], Mapping]):
        self.get_node = get_node

    def node(self, root):
        source_id(root)
        try:
            node = self.get_node(root)
        except (KeyError, IndexError, TypeError) as error:
            raise BindingError(f"Missing source record {root}") from error
        require(isinstance(node, Mapping) and set(node) == {"op", "args"}
                and type(node["op"]) is str and type(node["args"]) is list,
                f"Malformed source record {root}")
        return node

    def coordinate(self, root):
        require(self.node(root)["op"] == "coordinate", "A binder/formal must be a coordinate")
        return root

    def resolve_coordinate(self, reference):
        self.coordinate(reference.root)
        return reference.scope.lookup(reference.root)

    def integral(self, reference):
        node = self.node(reference.root)
        require(node["op"] == "definite_integral" and len(node["args"]) == 4,
                "Expected definite_integral [body,binder,left,right]")
        body, binder, left, right = node["args"]
        for root in (body, left, right):
            self.node(root)
        self.coordinate(binder)
        # The binder has no scope in either endpoint.
        return IntegralPlan(reference, body, binder, ScopedRef(left, reference.scope),
                            ScopedRef(right, reference.scope))

    def expression(self, reference, registry_key, definition, *, maximum_total_order=None):
        node = self.node(reference.root)
        require(node["op"] in EXPRESSION_OPS and len(node["args"]) == 3,
                "Only reviewed expression-native calls have this binding rule")
        require(type(registry_key) is str and registry_key, "Missing resolved registry key")
        require(isinstance(definition, Mapping), "Missing resolved source definition")
        parameters = definition.get("parameters")
        limits = definition.get("derivativeLimits")
        require(type(parameters) is list and type(limits) is list
                and len(parameters) == len(limits), "Missing complete formal/limit tuple")
        for coordinate in parameters:
            self.coordinate(coordinate)
        require(len(set(parameters)) == len(parameters), "Duplicate formal coordinates")
        require(all(type(n) is int and n >= 0 for n in limits), "Malformed derivative limits")
        body = definition.get("body")
        self.node(body)
        _, values, orders = node["args"]
        require(type(values) is list and type(orders) is list
                and len(values) == len(orders) == len(parameters), "Incomplete actual argument/order tuple")
        for root in values:
            self.node(root)
        require(all(type(n) is int and 0 <= n <= limit for n, limit in zip(orders, limits)),
                "Unsupported formal derivative order; no omitted derivative is zero")
        if node["op"] != "actual_expression_partial":
            require(type(maximum_total_order) is int and maximum_total_order >= 0,
                    "Facade maximumOrder must come from the pinned owning header")
        if maximum_total_order is not None:
            require(type(maximum_total_order) is int and maximum_total_order >= 0
                    and sum(orders) <= maximum_total_order, "Facade total derivative budget exhausted")
        digest = hashlib.sha256(json.dumps(dict(definition), ensure_ascii=False,
                                          separators=(",", ":")).encode()).hexdigest()
        return ExpressionPlan(reference, registry_key, digest, body, tuple(parameters), tuple(orders),
                              tuple(limits), tuple(ScopedRef(root, reference.scope) for root in values))
