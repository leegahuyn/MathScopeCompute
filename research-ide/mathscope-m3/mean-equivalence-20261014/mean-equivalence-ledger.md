# 실제 저장 Temporal/Moments mean 동등성의 범위

이번 코드는 기존 producer, certification 코드, 원본 수학 가정 및 56/64를 변경하지 않는다. 원본 `maximum` 값을 모두 유지한 새로운 private source replay를 입력으로 사용한다.

## 실제 남은 식

기존 원본 replay는 두 단계의 `Etheta`, `gr`를 이미 정확 유리식으로 일치시켰고, `pressureZ`, `Ez`에서 각각 8개 단항식을 남겼다. 압력 차이는

\[
\Delta P_Z=(s-2hZ^2s^{2h})[(I_{\rm rebuilt}-I_{\rm source})-\chi(J_{\rm rebuilt}-J_{\rm source})]
\]

이며 `Ez` 차이는 이 식의 \(\epsilon\)배이다. 수치 치환 없이 실제 남은 모든 단항식을 다시 계산한다.

| 단계 | I: 재구성/저장 checkpoint | J: 재구성/저장 checkpoint | 적분 body: 재구성/저장 | 실제 저장 I/J source |
|---|---|---|---|---|
| Temporal | 52145 / 52581 | 52151 / 52584 | 52144 / 52580 | 3614628 / 3614629 |
| Moments | 52827 / 53067 | 52829 / 53070 | 52826 / 53066 | 3615355 / 3615356 |

현재의 compact 원본 checkpoint에서 각 body는 적분 bound coordinate를 de Bruijn 거리로 바꾸고, 합/곱의 결합·교환·유리상수를 정규화하면 **완전한 constructor 키가 일치**한다. 해시 비교나 같은 이름을 갖는 함수를 하나로 취급하지 않는다. 적분 endpoint는 binder scope 밖에 유지한다.

Temporal의 원본 named partial은 registry `m3_aux_expression_partial:-14`, 정의 body `3613993`, formal `[622791,622802,622803,622804,635044,635045]`, order `[0,0,1,0,0,0]`이다. Moments는 registry `-22`, body `3614891`, 동일 formal/order이다. 각각의 전체 registry 기록, body ID, formal ID, derivative 방향·order, 실제 argument, explicit capture tuple을 동등성 키에 포함한다. `P` partial도 실제 registry `-16`/`-24`와 body `3614333`/`3615054`로 묶는다. `s`는 실제 source call `622820`, system 2의 전체 정의와 argument tuple로 구별한다.

이 계산의 `8/8`은 **동일한 실제 defining operator가 정의되어 있고 capture tuple이 완전하다는 전제에서의 식 동등성**이다. 소스 함수의 존재·smoothness, 적분의 Leibniz 법칙, 모든 분모의 nonzero, implicit branch domain, natural limit의 Banach norm, 모든 support/cover/class 조건을 증명했다는 뜻이 아니다. 결과는 `actualMathematicalIdentitiesCertified:false`, N6-01/N6-02/completeN6 및 기존 진도 변경을 false로 둔다.

## 실제 정의 확장 및 검증

`mean-equivalence-run.mjs`는 cloud에서 source를 한 번 열고, private source가 발급한 원본 whole mean replay를 만든다. 같은 source provider로 named body, nested expression, indexed cover의 실제 local body/guard/coefficient/map, inverse body, monotone·quadratic defining operand까지 확장한다. 500,000 node / 2,000,000 work의 상한과 정확한 unknown operator node를 기록한다. 허용된 structural natural-core capture rule도 private source authority로 발급받는다. Unknown profile/limit body는 `HIDDEN_DEFINITION_CAPTURE_OPEN`으로 남긴다. 이 단계는 syntax/capture 검증이며 무한 limit convergence를 증명하지 않는다.

실행:

```sh
node --max-old-space-size=8192 research-ide/mathscope-m3/mean-equivalence-20261014/mean-equivalence-run.mjs --output mean-equivalence-evidence
node --test research-ide/mathscope-m3/mean-equivalence-20261014/alpha-functional-equivalence.test.mjs research-ide/mathscope-m3/mean-equivalence-20261014/mean-functional-equivalence.test.mjs
```

아티팩트는 `original-mean-result.json`, `mean-functional-equivalence.json`, 그리고 원본 source의 5개 finite arithmetic row를 내보낸 `initial-finite-witness.json`이다. 실패하면 `implementation-failure.json`에 실제 code/stack/source node를 기록한다. Serialized checkpoint나 복사한 capability는 private source 권한을 얻지 못한다.

작은 독립 tests 17개는 같은 이름의 다른 free coordinate/정의, 잘못된 derivative order/capture/endpoint/implicit branch·argument, 누락된 정의·operator·numerator, 변조된 coefficient, 복사 capability, completion override 및 자원 상한을 검사한다. Fixture 성공을 actual source proof로 승격시키지 않는다.
