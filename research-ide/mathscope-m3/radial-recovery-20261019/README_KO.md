# 현재 복원된 A.13 적분과 기존 양의 구간 소비자 연결

이번 ChatGPT 작업에서 새로 작성한 것은 **현재 복원된 원 A.13 노드에 대한 출처
결속과 정규화된 역수의 전달**입니다. 기존 A.13 증명·소비자가 없었다고 취급하지
않습니다. M3 완료 수는62/64, N7-06·N8-05 OPEN, 실제 global last-resolved tau는
null을 유지합니다. 원 외부 장, 현재 indexed caller, M4 인수 조건을 완료로 올리지
않았습니다.

## 기존 결과와 새 작업

기존 `mathscope-m2/navier/actual-original-a13-numerical-enclosure.mjs`는 세 원 적분의
literal body·적분 변수·끝점·양의 원 매개변수를 확인하고, 다음 구간을 반환합니다.
기존 `actual-common-positive-scale-enclosure.mjs`는 그 결과를 별도 private physical
point에 연결하는 코드도 갖고 있습니다. 그 코드의 `globalAllLabelsNumericallyEvaluated`
및 `wholeGNUMComplete`는 false입니다. 이 단위에서는 그 큰 physical-point producer를
재실행하지 않았습니다.

| 적분 | 기존 엄밀한 구간 | 이번 연결 |
|---|---|---|
|239, steep|[1/4,3]|원 body238·변수226·끝점0/1 및 nested229를 확인|
|257, flatten|[1/4,3/2]|원 body256·변수246·끝점0/1 및 nested249를 확인|
|275, terminal Qp|[rho,54rho], rho=h/256|원 body274·변수262·끝점1/3 및 인자 미분267을 확인|
|276, Qp 역수|기존 양의 Qp 구간에서 역수 계산|실제 `inverse(275)`에 대응하는 양의 closed exponential endpoint와 h를 공통 인수로 보존한 배율 전달|

`SOURCE_BOUND_INPUTS.json`의 완전한 SHA-256을 새 모듈에 고정했습니다. 이 파일은
기존 실행 모듈과 그 정적 import 의존성, 원 코드 참고 파일을 합한13개 파일의
SHA-256·baseline Git blob을 담습니다. 실제 source capsule와 그 원 기록 파일들의
SHA도 결속합니다. 원 A.13 및 역수의 닫힌 의존 부분77개 기록을 읽고, capsule 각
기록을 실제 원 record map과 직접 비교한 다음에 기존 source audit·소비자를 호출합니다.

기존 source-form audit의 `sourceAuthenticated=false`와
`parentGraphAuthenticationRequired=true`는 보존했습니다. 새 결과의
`sourceAuthenticated=true`는 **저장된 해당 A.13 부분 그래프의 정확한 원본 발생 위치**에
한정합니다. 현재 indexed frame, 현재 physical point 또는 whole-K에 대한 권한은
부여하지 않습니다. 이 제한은 `sourceAuthenticationScope`와 `scope`에 들어 있습니다.

## 원 식과 정의역

원 논문 PDF129쪽(A.5)의 step은 다음 sigma_2입니다.

$$
\sigma(u)=\frac{e^{-1/u^2}}{e^{-1/u^2}+e^{-1/(1-u)^2}},\quad0<u<1.
$$

u<=0에서는0, u>=1에서는1이며 양쪽 접합은 flat입니다. 이는 이번 세션의 다른
outer cutoff에서 쓰는 sigma_1과 다릅니다. 서로 바꾸지 않았습니다.

S(x)=적분(0부터x까지 sigma)라 놓으면 두 nested 적분229/249는 같은 원 primitive를
서로 다른 lexical 변수에서 호출합니다. 0<=x<=1에서

$$
S(1)=\tfrac12,\qquad S(1-x)=S(x)+\tfrac12-x.
$$

이는 sigma(1-u)=1-sigma(u)와 원 끝점에서 따릅니다. 새 primitive 수치 적분을
수행했다고 표시하지 않습니다. 변수226/227과246/247은 별도 binder이며 node ID만으로
입력과 관계없이 전역 memoization해서는 안 됩니다.

원 고정 매개변수는 T=exp(1048576)+10, lambda=exp(-1000T), h=exp(-8002T), co=1/256입니다.
T>128, 0<h<lambda<1/16이므로 a=1-lambda, b=1-h는(1/2,1), rho=h/256은(0,1/4096)에
속합니다. 여기의 T는 원 `source_parameter` 노드6이며 slow coordinate622804와 다릅니다.

세 적분의 원 식은

$$
I_{239}=\int_0^1e^{a(x-S(x))}\big[(\lambda-h)+a\sigma(x)\big]\,dx,
$$

$$
I_{257}=\int_0^1e^{bS(x)}b(1-\sigma(x))\,dx,
$$

$$
Q_p=I_{275}=\frac{\rho}{2(1-\rho)}
\int_1^3e^{bs}\sigma'((s-1)/2)\,ds.
$$

노드267의 `source_step_derivative(...,1)`는 **step 인자에 대한 미분**입니다.
바깥 s 미분의1/2를 이미 포함한 값이 아닙니다. 원 분모 노드272가 따로 보존하는2와,
u=(s-1)/2 치환의 ds=2du가 상쇄되어

$$
Q_p=hK(h),\qquad
K(h)=\frac1{256-h}\int_0^1e^{(1-h)(1+2u)}\sigma'(u)\,du.
$$

sigma'는 비음수이고 전체 적분은1입니다. 이 사실과 원 양의 h가 node275의 양의
하계를 정당화합니다. 새 adapter는 기존 소비자의 factor54를 그대로 재사용하므로

$$
\frac1{256}\le K(h)\le\frac{27}{128},\qquad
\frac{128}{27}\le\frac{h}{Q_p}\le256.
$$

정규화는 **원 동일한 h 공통 인수를 먼저 약분**합니다. 서로 독립적인 h 구간 두 개를
나눠 상관관계를 버리는 계산이 아닙니다. 실제 node275와 node276에는 기존256비트
directed exponential arithmetic이 생성한, 유리 상수와 exp/neg만으로 이루어진 양의
닫힌 수치 endpoint도 반환합니다. h라는 미해결 이름을 endpoint에 남기거나 h=0을
대입하지 않았습니다. binary64 점수치나 원 적분의 상대 오차 목표를 달성했다는
주장도 하지 않습니다.

## 실행과 회귀 검사

외부 패키지를 설치하지 않고 Node.js로 실행합니다.

```sh
node research-ide/mathscope-m3/radial-recovery-20261019/verify_binding.mjs
```

기본값은 stdout 요약만 출력하며 파일을 쓰지 않습니다. 별도 결과를 보존하려면
새 결과 폴더를 지정합니다.

```sh
node research-ide/mathscope-m3/radial-recovery-20261019/verify_binding.mjs --output-dir /tmp/mathscope-radial-ci
```

그 폴더에 두 결과 파일 중 하나라도 있으면 **검증 실행 전에 거절**합니다. 새로운
경로를 사용해야 하며 기존 기록을 삭제할 필요는 없습니다. 기본 모드에서 파일을
쓰지 않는 점과 기존 결과 거절은 실제 별도 실행으로 확인했습니다.

최종 `validation-attempt3`은27개 검사와13개 거절 대조군 PASS입니다. 원77개 기록,
기존10개 source check, 매개변수·상수·인자 미분·factor54·정규화 역수·닫힌 endpoint,
출처 적용 범위 및 코드 바이트 안정성을 검사했습니다. 별도 검토자는 수정 후
9개 독립 연결·변조 대조군을 통과했습니다.

실패 기록도 보존했습니다. 최초 smoke 호출은 기존 산술기가 허용하지 않는128비트
설정에서 중단됐고, 허용 범위의256비트로 바꿨습니다. 첫 verifier는 독립 유리수
보조 함수의 BigInt 기본값 오류로 중단됐고 해당 verifier만 고쳤습니다. 그 다음
독립 검토는 mutable report를 검증 후 다시 읽는 projection 결함을 찾았습니다.
getter가 두 번째 읽기에서 완료 플래그를 바꿀 수 있었으므로, projection을 private
serialized snapshot에서만 생성하도록 수정했습니다. 실패 코드·증거와 수정 후
getter 대조군을 모두 보존했으며 원 A.13 수학 코드·식은 바뀌지 않았습니다.

## 다음으로 필요한 실제 작업

이번 연결 후에는 node275의 양성 자체나 기존 A.13 상계를 모두 새 누락으로
취급할 이유가 없습니다. 남은 의무는 그 구간을 필요한 실제 소비자에 적용하고,
필요한 범위와 정확도를 충족하는 것입니다.

1. 원 Qb259와 wait280 및 log radius319를 기존 A.13 구간과 닫힌 원 매개변수로
   소비해야 합니다. 원 식은 Qb=exp(-b/2)[exp(-a/2)((lambda-h)/a+I239)+bL+I257],
   L=-4log(h)=32008T, wait=log(Qb/Qp)/b입니다. 이 단위는 전체 Xb를 수치 평가하지 않았습니다.
2. 원 node319는 `13*exp(1000T)+122009T+135+node280`로 정확히 축약됩니다.
   별도 symbolic 진단이 원 AST로 이 항등식을 검사했습니다. 이는 log(Xb/XR)이며,
   Xb의 숫자 또는 새 대체 cutoff가 아닙니다.
3. 실제 global R/Z/T/ell frame, 원 ell>=ell0와 coefficient window, 실제 mesh ceilings,
   같은 원 box의 비어 있지 않은 active intersection과 대표점 선택은 여전히 필요합니다.
   이 단계에는 이번과 다른 소비자·정의역 증거가 필요합니다.
4. N7-06의 독립 공간·시간 에너지 비교와 N8-05의 grid/Fourier cutoff/coefficient order/
   arithmetic precision 비교 및 각 tail bound는 수행하지 않았습니다.

`diagnosis/`는 이러한 선행·후행 관계와 별도15개 symbolic/rational 검사를 담습니다.
그 진단에서 얻은 더 날카로운 K<9/85 부등식은 참고 진단으로만 분리했습니다.
runtime이 승계한 원 factor54를 그 값으로 몰래 변경하지 않았습니다.

원 논문 SHA-256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이며,
`original-excerpts/`에 실제 PDF129·130·132쪽과 추출 해시를 보존했습니다.
원 B0=0.7, C0*=1.2 및 원 장의 정의역을 변경하지 않았습니다.
