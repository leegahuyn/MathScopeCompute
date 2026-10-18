# 원 A.13 적분에서 Qb·wait·로그 반경으로 이어지는 계산

이 폴더는 현재 ChatGPT 작업에서 새로 작성한 **저장된 원 scalar 계산 경로의 연결
단위**입니다. 기존 A.13 적분 증명·소비자, 복원된 source binding, directed numerical
exponential arithmetic, sparse traced evaluator를 재사용합니다. 기존 caller 및 radial
복구 폴더는 수정하지 않았습니다.

원 `239/257/275`의 구간을 소비하여 `259 → 277/278 → 280 → 319`를 실제로
실행했습니다. `Qb`, `Qb/Qp`, 그 로그, `1/(1-h)`, `wait`, `log(Xb/XR)`의 여섯
결과에는 유리 상수와 exp/neg만으로 이루어진 양의 닫힌 수치 구간이 있습니다.
미해결 이름을 endpoint에 남기거나 h=0을 대입하지 않았습니다.

M3는 기존62/64, N7-06·N8-05 OPEN, actual global last-resolved tau=null을 유지합니다.
이번 결과는 원 M3 인수 조건의 완료 수를 올리지 않습니다. M4 원16개 인수 조건도
이 단위에서 검증하지 않았습니다.

## 기존 근거와 새 연결의 범위

|구분|재사용한 실제 근거|이번에 추가한 실행·인증|
|---|---|---|
|원 적분239|기존 `[1/4,3]` 구간과 원 body·nested primitive229 검증|그 구간을 Qb259에 전달|
|원 적분257|기존 `[1/4,3/2]` 구간과 원 body·nested primitive249 검증|같은 Qb259의 flatten 항에 전달|
|원 Qp275|기존 `[h/256,54h/256]` 구간 및 radial binding의 원275·역수276 인증|277의 분모와278의 양의 로그 인자로 전달|
|원 매개변수|고정 source profile의 원 정확한 정의|T/BOuter/lambda/h/Tf를 실제 닫힌 산술로 평가|
|원 실행 경로|복원된 원 scalar record map과 caller capsule|57개 arithmetic trace 기록을 직접 비교하고 실행; 기존77개 A.13 기록 밖의 추가21개 기록 인증|
|Xb 해석|원 node28825=`exp(319)`, node28826=`XR*28825`|3개 link 기록까지 추가 인증; XR·28825·28826의 수치 실행은 이 단위 밖|

`SOURCE_BOUND_INPUTS.json` 전체 SHA-256은 새 모듈 안에 고정되어 있습니다. 원 코드와
그 import 의존성 및 참고 파일14개, 동결된 radial 모듈·입력 manifest, caller capsule와
실제 복원 source 파일들의 바이트를 검증합니다. 실행57개 및 해석용3개 기록은
capsule뿐 아니라 원 `RAW_INITIALIZED_SCALAR_CLOSURE.json` record map과 직접
비교합니다. source pin은 await 및 계산 전후에 재검사합니다.

새 `sourceAuthenticated=true`는 **저장된 해당 scalar 부분 그래프와 기존 원 A.13
전제의 연결**에 한정합니다. generic traced evaluator 자체의
`sourceAuthenticated=false`, `boundaryPremisesProvedHere=false`는 그대로 남습니다.
다른 값으로 만든 boundary나 JSON의 pass 플래그가 새 private authority를 얻을 수
없습니다. 새 보고서는 재귀적으로 동결하고 private seal로 소유권을 확인합니다.
projection은 private serialized snapshot에서 생성하며 다시 mutable 필드를 읽지
않습니다. projection·직렬화 결과는 관찰용 자료이고 재사용 가능한 인증 객체가 아닙니다.

## 원 식과 부호·유한성

원 논문 PDF129쪽(A.5),130쪽(A.12–A.13),132쪽의 wait 논증과 원
`actual-global-source-outer.mjs`의 원 stage·A.13 식을 사용합니다. 해당 원 PDF SHA와
실제 발췌는 기존 `../radial-recovery-20261019/original-excerpts/`에 보존되어 있습니다.
원 step은 square-seed sigma_2이며 이 폴더에서 다른 cutoff를 새로 정하지 않았습니다.

고정 매개변수와 약자는

$$
T=e^{1048576}+10>128,\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad
a=1-\lambda,\quad b=1-h,\quad L=-4\log h=32008T.
$$

따라서 `0<h<lambda<1/16`, `1/2<a,b<1`입니다. 이 T는 원 source parameter
node6입니다. 실제 slow coordinate622804 또는 외부 시간 좌표를 대신하지 않습니다.
위 네 가지 수치적 분리는 실행에서 확인했으며 원 양의 h를 보존했습니다.

$$
Q_0=\frac{\lambda-h}{1-\lambda},\qquad
Q_{\rm steep}=e^{-a/2}(Q_0+I_{239}),
$$

$$
Q_b=e^{-b/2}\left(Q_{\rm steep}+bL+I_{257}\right),\qquad
W=\frac{\log(Q_b/Q_p)}{b}.
$$

기존 A.13 부등식에서 `0<Q0<1/15`, `1/4<I239<3`, `1/4<I257<3/2`를
사용합니다. `e^(-b/2)>1/2`이고 `b>1/2`이므로

$$
\frac L4<Q_b<L+\frac{137}{30}.
$$

이는 이전 radial 진단의 부호 상계를 재사용한 것입니다. `Qp<=54h/256<27/2048<1`
이고 `Qb>L/4>1`이므로 실제 비율277은1보다 크고, 로그278 및 wait280은 양의
유한 값입니다. 이 부호·유한성은 whole-K 장 평가 또는 원 적분의 정밀 수치 평가와
구분합니다.

원 node319의 전체 affine wrapper는 정확히

$$
319=T+90B_{\rm Outer}+13/\lambda+T_f-4\log h+7+W
   =13e^{1000T}+122009T+135+W.
$$

원 `BOuter=1000T`, `Tf=128`을 대입한 계수와 상수를 독립 유리수 대수로
검사했습니다. 이는 원 source link에서 `log(Xb/XR)`입니다. Xb를 다른 숫자나
표시용 cutoff로 치환한 식이 아닙니다.

## 정밀도와 오차를 읽는 방법

기존 공통 h를 보존한 정규화는

$$
Q_p=hK,\qquad K\in[1/256,27/128],\qquad
W=\frac{8002T+\log Q_b-\log K}{1-h}.
$$

K에 대한 기존 구간의 상·하단 비율은54이고 `log(K)` 구간 폭은 `log(54)`입니다.
이 폭은 기존 적분 enclosure에서 온 것이며 arithmetic precision만 올려서 자동으로
줄어들지 않습니다. 실제 닫힌 수치 endpoint에는 그 외의 산술 rounding 확대도
포함됩니다. 결과에서 `inheritedNormalizedLogWidth`와
`additionalNumericalEndpointInflationRetained`를 구분했습니다.

각 결과의 `coordinateObservation`은 값에 로그를 반복 적용하여 얻은 실제 유리수
좌표 구간과 폭을 기록합니다. 예를 들어 이번319 출력의 유리 좌표는
`log^2(node319)`이며 `node319` 자체가 이미 `log(Xb/XR)`입니다. 이를 Xb의 절대오차
또는 상대오차로 읽으면 안 됩니다. `acceptanceThreshold=null`, `toleranceClaim=false`
이고 새 완료 임계값을 만들지 않았습니다. 닫힌 구간에 exp를 적용할 때에는 전체
구간을 전달해야 하며 작은 로그 반복 좌표 폭만으로 Xb 상대오차를 보장할 수 없습니다.

512비트 독립 순서의 recurrence와256비트 원 AST 실행 구간의 교집합을 확인했습니다.
이는 이 연결의 수식·실행 회귀 검사입니다. N8-05의 원 네 축 독립 비교나 tail bound,
N7-06의 실제 전역장 에너지 공간·시간 비교를 수행한 것이 아닙니다.

## 실행 방법과 결과

외부 패키지 설치 없이 Node.js만 필요합니다. 저장소 루트에서 실행합니다.

```sh
node research-ide/mathscope-m3/logradius-recovery-20261019/verify_logradius.mjs
```

기본 명령은 stdout 요약만 출력합니다. 결과 파일을 보존하려면 새 폴더를 지정합니다.

```sh
node research-ide/mathscope-m3/logradius-recovery-20261019/verify_logradius.mjs --output-dir /tmp/mathscope-logradius-ci
```

그 폴더에 `BOUND_LOGRADIUS.json` 또는 `LOGRADIUS_VALIDATION.json`이 있으면
binding을 실행하기 전에 거절합니다. 기존 결과를 지우지 말고 다른 새 경로를 쓰면
됩니다. 기본 모드의 파일 무변경 및 기존 결과 거절은 `evidence/output-policy/`에서
별도로 실행해 확인했습니다.

`evidence/validation-attempt1/`은35개 검사와25개 부정 대조가 PASS입니다. 첫
검증 명령은 약0.59초에 종료코드0으로 끝났습니다. 57개 원 trace와 기존 세 적분
경계, 원 매개변수, 독립319 계수, 독립512비트 recurrence, 양의 폐구간, 공통 h
정규화 wait, 소유권·동결·변조·projection·파일 무변경을 검사합니다. 전체700개 또는
추가3407개 생산 계산은 재실행하지 않았습니다.

첫 smoke도 성공했습니다. smoke 이후 오차 필드의 설명을 `log(54)`의 정규화 기여와
추가 수치 확대가 구분되도록 명확히 했습니다. 그 최초 소스와 입력·출력 SHA를
`evidence/smoke-attempt1/`에 보존했습니다. 기존 결과를 덮어쓰지 않았습니다.

## 정확한 다음 재개 지점

이번 연결 이후 `Qp의 양성`, `Qb/wait/로그 반경 scalar 경로`를 다시 모두 누락으로
분류하면 안 됩니다. 아래 의무는 여전히 별도입니다.

1. **전체 Xb 전달:** XR의 원 정의는 `110*(CSelected*Pstar)^10`입니다. 원 profile에서
   XR을 포함한13개 이름의 닫힌 산술 의존성이 모두 존재하고 미확인 ref는 없습니다.
   여기서는 그 실행을 요청하지 않았으므로 XR·28825·28826은 미실행입니다. 이후
   같은 source-bound 산술로 원 XR과 node319 구간을 연결할 수 있지만, 원 상대오차
   의무를 충족했다는 별도 판단은 필요합니다.
2. **실제 외부 frame:** formal622802/622803/622804(R/Z/T),622791(ell)에 대응하는
   실제 전역 점과 원 `ell>=ell0`, coefficient window 소속 증거가 아직 없습니다.
   이는 AST 기록이 없다는 뜻이 아니라 실제 caller의 값과 membership 인증이
   필요하다는 뜻입니다.
3. **정수 mesh·대표점:** 623855/623856/623857의 원 ceiling 연결과 동일한 ell/box에서
   active 교집합의 비공집합성, negativeWidth623914의 부호 분리 후에 대표 입력
   623921/623934를 실행해야 합니다. 교차 경계나 부호 미분리를 반올림으로 결정할
   수 없습니다.
4. **정밀 적분과 전체 전역장:** 현재의 고정 A.13 구간을 더 줄여야 하는 소비자는
   원 sigma nested primitive229/249와 세 적분의 별도 엄밀 오차 계산을 요구합니다.
   그 뒤에도 실제 whole-K 장, A/b/p와 필요한 미분, force·pressure·에너지·오차 및
   N7-06/N8-05 원 인수 조건은 별도 OPEN 의무입니다.

원 B0=0.7, C0*=1.2와 원 장의 정의역·정칙성·상수는 변경하지 않았습니다. 원 위치는
논문 PDF106–107쪽 및 blueprint PDF62쪽이며 이전 caller 증거에 연결되어 있습니다.
다음 재개 평가의 짧은 JSON/Markdown은 `diagnosis/`에 함께 보존합니다.
