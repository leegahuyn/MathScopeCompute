# MathScope M3 N6 — Picard 원본 계수·복소 정의역 후속 결과

이번 결과는 연결이 끊긴 PR #31 작업을 실제 저장소에서 이어받아 GitHub-hosted Actions로 실행한 결과다. **원본 N6-01은 OPEN, N6-02는 PARTIAL, M3는 56/64로 유지한다.** 전체 Navier–Stokes 수학 증명 또는 실제 Picard 계수 노름의 무조건부 인증이 아니다.

## 실행과 소스 범위

- 기존 baseline PR #30: `26e51d2c2c92169b6416c2af246aacd9ac1330c3`
- 새 작업 Draft PR #31: https://github.com/leegahuyn/MathScopeCompute/pull/31
- 실제 source 검산·음성 대조 GitHub Actions: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38533774006 — `bridge`, `native` **SUCCESS**
- Bridge 원시 결과: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38533774006/artifacts/11878952410
- Native 원시 결과: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38533774006/artifacts/11879551692
- Bridge에서 M2 source 입력 14개 file SHA-256·bytes를 대조하고 실제 `n=1` 증거를 재검사함. 기호적 `A1` 배열을 source 함수의 허용 범위 `n=1..8`에서 비교함. 이것은 `n>=2`의 실제 완성 RHS와 해의 인증이 아님.
- Native에서 보호 입력 230개 파일을 검증하고 원본 archival ZIP 6개의 SHA/멤버를 확인했으며, 그중 source-input checkpoint 1개를 임시 러너에서 추출함. 원본 source header/SQLite와 PDF 해시, producer 155개 바이트 사본도 검사함.
- Bridge 음성 대조 6개, native 복소 분모 음성 대조 6개 통과. 아티팩트에는 로그·환경·결과·해시가 저장됨.

## 실제 원본 n=1 Picard coefficient DAG 감사

| 원본 범위 | 실제 수치 |
|---|---:|
| `A0/A1/forcing` 합집합 원본 노드 | **3,679** |
| 원본 함수 호출 총계 | **216** |
| `inverse` | **33** |
| `log_positive` | **21** |
| `sqrt_positive` | **5** |
| `actual_natural_series` | **157** |
| 원본에서 복소 분모 상계를 직접 대응한 역원 | **1** (node `1953`) |
| 나머지 inverse/log/sqrt 원본 호출 | **58** |
| 실제 `eta`에 의존하는 조사 대상 호출 | **169** |

**호출 216개는 독립적인 미증명 정리 216개가 아니며, source DAG 표현의 연산 노드 수다.** 특히 자연급수의 함수 정의·수렴·branch는 호출 AST를 찾았다는 사실만으로 증명되지 않는다.

### 실제 증명한 국소 해석적 분모 정리

원본 source node `1953`은 정확한 다항식 `L=1-2*h*eta^2`의 역원으로 식별됐다.
원본의 `0<h<1/100` 조건을 사용하고 `dist(eta,[-1,1])<1/4`인 복소 `eta`에서 `|eta|<5/4`이므로,

```text
|2h eta^2| < 1/32,
|L| > 31/32,
|1/L| < 32/31.
```

따라서 **source node 1953 자체**의 역원은 해당 영역에서 well-defined·holomorphic이고 노름 상계가 있다. 이는 `h`의 원본 상한을 전제로 한 고전 복소해석 추론이며, 아직 `A0/A1/f`의 모든 다른 호출·원본 변수 변경·밴드 범위에 대한 공통 holomorphic 노름 증명은 아니다.

### Picard 꼬리 계산량의 정확한 대수적 상계

M2의 `n=1` coefficient majorant가 요구하는 충분조건은

```text
K >= ceil(72(C1*a)^2 / Delta)
  = ceil(9*2^140*Lambda^8*Q^17*a^2/(t1^4*rho^5))
a^2 = Xa*exp(t1/16)
```

이다. 이 식은 **정확한 기호 산술 검사**를 통과했다. `C1`이 실제 native 전체 source의 공통 strip 계수 노름을 제어한다는 선행조건은 별도로 닫혀 있지 않다. 따라서 실제 계산한 항수도, 최소 필요 (K)도 아니다.

## 그대로 남는 선행 수학 의무

1. Native `A0/A1/f`의 나머지 58 inverse/log/sqrt 호출과 자연급수 157 호출에 대해 실제 branch·복소 영역·유계 노름·tail를 확보하고, 전 원본 계수의 `eta` 해석성을 증명한다.
2. M2 `n=1`의 원본 소스 함수와 N6 actual native coefficient/integral/capture의 정확한 의미상 동일성을 증명한다.
3. `n>=2`의 실제 완성 이전 차수, 모멘트 및 forcing 전체 노름·공통 radial collar를 증명한다.
4. N6의 모든 band/label/copy/Cartesian input 정의역과 W/M/S, Haar moments, Rayleigh 양의 경계 및 PDE exact identity를 결속한다.

Jet **230개**, 전역 Guard **38개**, PDE 잔여항 **1,020개**의 기존 판정은 **그대로** 유지한다. 이번 상계 하나를 기존 원래 94 Guard의 특정 항목에 확인 없이 재귀적으로 연결하거나, 전체 N6 완료율에 반영하지 않는다.

## 기타 CI 정보

N6 전용 클라우드 검증은 성공했다. 반면 별도 `MathScope research IDE checks`의 PR 검사에서는 `verify_english_release.py`가 새 파일을 반영하지 않은 기존 영문 릴리스 매니페스트에 대해 오류를 보고했다. 이는 Picard 해석 증명의 성공·실패와 분리한 **릴리스 메타데이터 통합 관문**이며, 원래 릴리스 매니페스트를 무단 재작성하지 않았다.

**원본 producer, main, M3 56/64, 운영 웹은 변경하지 않았다.**
