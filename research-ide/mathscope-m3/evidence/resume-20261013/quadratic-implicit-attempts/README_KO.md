# 저장된 2차 방정식의 독립 암시적 미분 기록

대상은 실제 저장 노드 `5029 = actual_quadratic_root(0,4,2)`이다. `ActualSameN3B8`, `ActualSameN3C2I1`, `ActualSameN3C2I2Heat`의 전체 연속 행렬, 2차 계수, RHS, scale, preconditioner, 원래 zero seed, radius, Lipschitz 피연산자를 유지했다. 원래 registry SHA-256은 `4ff6ff3c28e8dac8b6feebad4e0a88dc59d9ff64e464116eca05cce407240171`이다.

독립 reader가 다음 조건부 미분식을 재구성한다. 모든 계수와 RHS의 실제 인수·캡처 도함수를 포함하며, 반복 미분은 이 식의 일반 곱·역수 규칙으로 수행한다.

```text
F(z) = A z + scale Qdiag(z²) - rhs = 0
J = A + 2 scale Qdiag diag(z)
J D(z) = D(rhs) - D(A) z - D(scale) Qdiag(z²) - scale D(Qdiag)(z²)
```

식의 유효성에는 원래 선택된 branch의 존재·미분 가능성, `F(z)=0`, 연속 Jacobian의 비특이성이 필요하다. 이 의무는 명시적인 미검증 domain 조건으로 남는다. 정확히 0인 determinant는 거부한다. 독립 연속 Jacobian으로 Cramer 식을 구성하며, 저장된 preconditioner로 교체하지 않는다. 원래 미분 함수, 역사적 PASS bit, 수치 root 또는 유한 iterate를 증명으로 쓰지 않는다.

| 실행 | 결과 | 실제 수학 상태 |
|---|---|---|
| attempt1 | 9/10, exit 1; 마지막 공격 테스트가 frozen reader에 대입하며 TypeError 발생 | natural-series 노드 4483에서 UNRESOLVED |
| primitive-attempt2 | 30초 TIME_LIMIT; Node partial TAP 보존 실패를 명시 | 선택된 실제 테스트는 확인 불가 |
| primitive-attempt3 | 선택된 primitive 8/8, exit 0 | source 인수 검수는 별도 실행 필요 |
| full-attempt4 | 10/10, exit 0; source/test bytes 고정 | natural-series 노드 4483에서 UNRESOLVED; alpha-capture 수정 이전 실행 |
| primitive-attempt5 | alpha-capture 대조를 포함한 primitive 10/10, exit 0 | source 인수 검수는 별도 실행 필요 |
| full-attempt6 | 11/12, exit 1; identity eta→eta 치환 중 work 200000 초과 | RESOURCE_LIMIT |
| full-attempt7 | **12/12, exit 0, skipped 0; 48.172초** | **natural-series 노드 4483에서 UNRESOLVED** |

독립 검토가 찾아낸 integral binder 캡처는 공유 reader의 alpha-renaming으로 수정했다. 실제 인수가 binder와 같을 때의 RHS import, 이후 root 치환 두 대조가 모두 `integral u exp(u t) du`의 정확한 비영 도함수를 확인한다. 최종 helper는 동일한 formal/actual eta 치환을 정확한 identity로 처리하여 work budget을 200000으로 유지한다.

최종 실행은 현재 Navier 모듈 118개와 이 테스트의 전후 bytes 및 모듈 membership이 동일함을 기록했다. 캡처된 원본 source 155개는 실제 private source open에서 검증한다. 최종 actual artifact는 `full-attempt7/quadratic-implicit-20261013100034897.json`이며 SHA-256은 `94c02014d17e0e24134e0004e8ad0955860deccabad49fa96bfb198cc8ee292e`이다. 전체 복사본 23개의 bytes/hash는 `ARCHIVE_INDEX.json`에 기록했다.

source/body/branch 및 private reader가 결속된 연속 5×5 Jacobian까지 구성했다. 완전 RHS 도함수에는 `actual_natural_series` 노드 `4483`의 별도 독립 규칙이 아직 필요하다. 원래 N6-01/N6-02, 전체 N6, M3, M4, domain/class, 비특이성, all-order class, Lean kernel 완료 필드는 모두 false를 유지한다. M3 56/64와 M4 인수 상태는 변경하지 않았다.

저장된 성공·실패·TIME_LIMIT 자료는 다시 작성하지 않았다. 최종 source는 `source-saved-quadratic-implicit-derivatives.mjs` SHA-256 `b8b137688d33a19f66de7c2e6215a1e54698ad3ff5b9a2d565edaedb8f17e126`, 테스트는 `saved-quadratic-implicit-derivatives.test.mjs` SHA-256 `f713ff687ad1ece6b07940344a69b7569aa06b82cab8dc61532d8861a79b7da8`이며 둘 다 LF이다. 공유 direct audit에 이 adapter를 추가하는 다음 통합 실행은 별도 검수 대상으로 남는다.
