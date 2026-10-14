# 원본 전체 잔차의 항별 감사와 독립 Cartesian 계산

이 추가 감사는 원본 전체 속도 `3825006/3825007/3825008`, 압력 `3825009`, direct 보존형 잔차 `3825257/3825259/3825261`과 assembled 잔차 `3825348/3825349/3825350`을 그대로 사용한다. 이전 rational 비교의 175/203/690항, 합계 1068항을 모두 내보낸다. 유리식 비교에서 0으로 소거되지 않았다는 사실은 PDE 반례도, 실제 함수가 서로 다르다는 증명도 아니다. 불투명 연산자의 정의와 실제 함수 관계가 아직 적용되지 않았기 때문이다.

`residual-source.mjs`는 원본 parent 3,892,594개 노드를 한 번만 읽고 raw 노드 SHA-256, 압축 snapshot manifest, 원본 angular record, 원본 producer 155개 및 그 당시 저장본을 전후 검증한다. 외부에서 새 graph, PASS, branch, root를 주입할 수 없다. 원본 definition의 `sourceAuthenticated`, `checks.pass` 등 기존 비트는 수학 증명으로 사용하지 않는다. 따라서 `SOURCE_VERIFIED`는 저장된 바이트의 동일성만 뜻한다.

`residual-rational-verifier.mjs`는 고정 원본 `forced-rational-identity.mjs`의 exact fraction 및 다항식 계산을 복사하고 출력만 확장했다. 분자 전체, 실제 atomic source ID 전체, 분모 factor 다항식 전체를 보존한다. 원본 175/203/690항과 다른 결과가 나오면 감사를 중단한다. 분모가 실제 영역에서 0이 아니라는 가정은 별도 미해결 조건이다.

`residual-frontier.mjs`는 각 항의 정확한 계수, source ID와 지수, syntax 및 정의 본문 도달성으로 결정되는 여러 label을 기록한다. actual expression, auxiliary/indexed/inverse, coupled namespace 5개 원본 registry group, natural/quadratic/monotone, Picard, covariance 및 forced Volterra 정의의 본문과 SHA-256을 보존한다. indexed 행의 local body, parameter, guards, coefficient, derivative map을 모두 추적한다. index, 미분 차수, component 번호를 scalar source ID로 해석하지 않는다. 검토하지 못한 연산자는 literal operand를 온전히 기록한 실제 frontier에서 멈춘다. label은 지지집합의 분리나 함수의 소거를 증명하지 않는다.

`residual-trig.mjs`는 source argument ID가 정확히 같은 sine/cosine에 대해서만 `sin(t)^2+cos(t)^2=1`을 적용한다. 복소수에도 성립하는 entire identity이므로 별도 새 수학 가정은 필요하지 않지만 실제 argument의 정의 가능성은 여전히 필요하다. `cos(t)^(2k)`를 정확한 이항식 `(1-sin(t)^2)^k`로 바꿔 모든 분자 항을 다시 합친다. 같은 이름의 별도 coordinate나 다른 phase는 합치지 않는다. 이 추가 소거의 실제 항수는 클라우드 원본 실행 artifact에 기록한다. 분모 조건이나 전체 PDE 상태를 통과로 바꾸지 않는다.

`residual-cartesian.mjs`는 원본 derivative/PDE helper를 호출하지 않고 primitive calculus를 새로 구현한다. `V=(cos(theta)Ur-sin(theta)Ut, sin(theta)Ur+cos(theta)Ut, Uz)`를 미분하고 radial fast chain, torus fast time, angular frame, axial scale, 모든 압력 성분, 세 방향 Laplacian 및 보존형 `V div(V)`를 유지한다. 실제 indexed/implicit/infinite-limit leaf의 독립 미분을 끝내지 못하면 `unresolved_total_source_jet`로 요청 자체를 기록하고 그 부분을 0으로 바꾸지 않는다. 이는 계산된 함수 jet이나 derivative oracle가 아니라 명시적인 계산 중단 지점이다. 원본 source derivative root를 재사용해 독립성이라고 주장하지 않는다. 자원 한도에 도달해도 이미 확보한 source binding, 조건, 미해결 요청을 남긴다.

남은 실제 증명은 모든 162행 angular/common-torus cover와 81행 global mean cover의 정확한 map/flat join/지지집합, same-body Fourier 및 forced solution의 실제 mixed jet, nonzero divisor/활성 영역의 square-root/log/integral 조건, source j=0 원본 class bounds이다. 이 감사만으로 N6-01 또는 N6-02를 완료로 바꿀 수 없다. 기존 flat local residual와 full stress-divergence tail도 원본 ID 그대로 유지한다.

저장소 루트에서의 실행:

```sh
node --test research-ide/mathscope-m3/mean-equivalence-20261014/residual-audit.test.mjs
node --max-old-space-size=8192 research-ide/mathscope-m3/mean-equivalence-20261014/residual-audit.mjs --output evidence/full-residual-frontier
```

출력은 component별 전체 항 JSON 3개, 실제 atom/definition/frontier JSON, 독립 Cartesian scalar program과 미해결 jet JSON, summary, 실행 소스/artifact SHA-256 receipt이다. 이미 존재하는 출력 파일을 덮어쓰지 않는다. 작은 검증은 25항 출력 확장, 실제 registry index 해석, 정확한 coupled/forced namespace binding, rigid angular velocity의 원심 connection, opaque jet 비영 처리, source coordinate 식별 보존, copied authority 거부, same-phase 고차 trig 소거 및 distinct-phase 부정 검사를 포함한다. fixture 통과는 원본 source의 PDE 증명으로 집계하지 않는다.
