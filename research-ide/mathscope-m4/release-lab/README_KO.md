# 실제 계산 릴리스 실험실

13개 지원 fixture를 기존 M1/M2 소스와 **새 isolated Worker**에서 각각 실행한다. Worker의 수학 코드 바이트는 실제 브라우저에 설치된 `core/worker-data.mjs`의 번들이며 Node에서는 메시지 운송만 `worker_threads`로 연결한다. 입력 hash와 전체 수학 결과 hash를 대조한다. 기존 엔진의 hash 정책은 최상위 `executionMetrics`만 제외한다. 실행마다 새 Worker를 만들고 종료한다.

점/P¹/E의 정확 점계수 1/4/8, SU2/SU3/G2의 실제 차원 3/8/14와 정확 Jacobi 검사, heat 구간과 ODE, 축 제외 외곽 표본, 국소 축 contraction/tail, 별도 Taylor–Green 에너지 관계를 독립 확인한다. prism 비교는 외부 비교정리 참조와 새 Lean 실행을 구별하며, Δ는 실제 선언한 classical generator를 실행한다.

```powershell
node --test research-ide/mathscope-m4/release-lab/verify-fixtures.test.mjs
node research-ide/mathscope-m4/release-lab/verify-fixtures.mjs
```

CLI는 사용하지 않은 timestamp 디렉터리에 compact `manifest.json`을 저장한다. 각 fixture의 실제 request, 입력/출력/수학 hash, Worker SHA, 상태, 독립 불변량, 실행시간, source path를 남긴다. 전체 큰 결과 대신 필수 관측과 hash를 저장하며, UI에서 같은 catalog 입력을 새로 실행할 수 있다. 실패는 성공으로 재분류하지 않는다.

정밀도 N=4/8, 축 tail degree=8/16, 외곽 radialCount=3/6, 고정 Ns의 lattice a=0.5/0.25, 고정 a의 Ns=2/3, Δ grid=3/5를 각각 독립 변화시킨다. 국소 축의 정확 유리수 생략 tail만 감소 상계로 판정한다. 외곽과 Δ는 결정론적 표시 표본 검사이고, identity 격자는 정확히 평평한 유한 대조다. 이 행들에서 일반 수치 오차 상계, quantum continuum/infinite-volume theorem 또는 전체 NS 해를 발급하지 않는다. lattice a 변화에서는 실제 물리 부피도 변한다는 점을 표에 보존한다.

## 네 walkthrough

1. **학생 계수체:** 점과 P¹을 실행하여 p=3, N=4와 N=8을 비교한다. 화면의 1/4 점계수, Frobenius eigenvalues, 정확 잔여류와 원식을 선택한다. 서로 다른 p의 숫자가 서로 다른 환에 속한다는 조건을 확인한다.
2. **연구 Frobenius/local-factor:** E/F₅를 실행한다. #E=8과 a₅=−2, `1+2T+5T²`를 독립 점계수와 연결한다. prism 비교를 선택하여 실제 유한 모델, 적용된 외부 reference, 새 커널 실행 부재를 각각 확인한다.
3. **Δ 상태족:** 같은 `CLASSICAL_SCALE` generator에서 Δ=1/2와 grid=3/5를 실행한다. rho와 물리장 hash, 표본 좌표, 관측 방법을 선택한다. classical trial과 continuum quantum gap의 열린 조건을 확인한다.
4. **NS 근사/잔차:** heat 외곽의 r>0 계약과 국소 축 해의 명시적 rational-pressure datum을 확인한다. tail degree=8/16의 정확 생략 tail과 radialCount=3/6의 표본 변화의 증거 등급 차이를 읽는다. 별도 Taylor–Green 기준 PDE의 평균 에너지 관계를 확인하고 전체 M3 NS 구성과 구별한다.

다른 사람이 이 문서만 보고 네 시나리오를 재현하는 R1-07 외부 검수는 아직 미확인이다. 이 실행과 UI 존재만으로 모든 R1-01/R1-02, M3 잔여 8개, M4 전체 인수나 최종 freeze를 승인하지 않는다. M3 기존 56/64와 M4 `UNCONFIRMED`를 보존한다.
