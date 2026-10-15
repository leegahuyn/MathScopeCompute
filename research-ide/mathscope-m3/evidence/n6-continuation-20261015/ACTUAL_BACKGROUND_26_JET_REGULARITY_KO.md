# 원본의 네 배경 함수와 26개 순서 미분

대상은 원래 등록 함수 `expression:688/689/690/691`의 원본 미분 요청 8+8+8+2개다. 함수는 각각 `M3GlobalBandSlow_F/G/b/pressure`이며, 공통 인자는 [R622802,Z622803,T622804,ell622791]이다. ell은 원래 고정 정수 band다. 이 결과는 이 네 실제 유한 본문의 정칙성·미분에 관한 것이다. 모든 band의 무한 배경과의 동등성, 전체 g 또는 PDE를 이 결과로 선언하지 않는다.

`actual_background_jet_regularity.py`는 같은 고정 Stage3로 신선하게 인증한 원본 캐시와 gzip header를 사용한다. 실제 완료 leading 정리, 여섯 order-one 함수 정리와 같은 실제 원시함수 결속, 원래 P0 해석 정리를 정확한 입력 SHA와 원본 body ID로 연결한다. source header는 detached record SHA `f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1`, 고정 정의는 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b`다. 클라우드의 새 전체 실행 전에는 이 문서나 작은 단위시험을 26개 소거 영수증으로 읽으면 안 된다.

## 원래 영역과 끝점 관례

동일한 원본 `source-global-current.mjs`는 reference chart를 T>=0, q=Q_ref s>0, 1/2<=s<=2로 정한다. 동일한 `actual-residual-order-induction-background.mjs`는 `timeEndpoint:'T=0 one-sided'`를 지정한다. 이 두 파일의 바이트 SHA를 변경 없이 검사한다. 양의 반지름 R>0와 원래 admitted chart를 보존한다. 거대한 매개변수 T와 물리 좌표 T622804를 구별한다.

실제 원래 식은 s-Z²s^(2h)-T_physical=0, X=R²/(2s), eta=Zs^(-D), D=1/2-h다. 같은 근에서 eta²=1-T_physical/s이므로 물리 영역에서 |eta|<=1, 양의 시간 내부에서는 |eta|<1이다. 근에서 s 미분은 1-2h eta²>1/2다. 따라서 같은 분기는 물리 내부에서 보통 C∞이며, 원래 닫힌 chart 경계의 jet은 같은 내부 분기의 연속 극한이다. T=0에서는 원래 한쪽 시간 미분만 사용한다. 원래 heat를 음의 T로 평가하거나 양의 R annulus를 축 R=0까지 넓히지 않는다.

## 유한 실제 본문을 비교하는 정확한 식

q0=617438, X=4756, eta=2라 하고 b1은 원래 고정 selector scale이다. 검사기는 b1을 임의 상수로 받지 않는다. 원래 node를 읽고 모든 상수 조상의 inverse/log/sqrt/negative-power 인수를 검사하여 유한한 양수임을 증명한다. 미검토 native 연산이나 0 분모가 하나라도 나오면 OPEN으로 남긴다. 거대한 상수를 부동소수점으로 만들지 않는다.

원래 chi는 `expression:680`이며 u=2sigma-1에서 다음 문자 그대로의 flat 식이다.

```
chi(sigma)=1                              (sigma<=1/2)
          = exp(-1/(1-u))/(exp(-1/u)+exp(-1/(1-u)))  (1/2<sigma<1)
          =0                              (sigma>=1).
```

안쪽 분모는 양수이고, 양 끝의 exp(-1/u), exp(-1/(1-u))는 모든 차수의 0 jet을 갖는다. 따라서 chi와 chi'는 실제 평탄한 연장으로 C∞다. 원래 lazy 분기 밖의 1/u를 먼저 계산하지 않는다.

w=q0^(2h), sigma=b1 q0, extra=sigma chi'(sigma)라 쓰면 원본 normalized 정의681..685 전체가 다음 식과 같은지 비교한다.

```
Fnorm = F0 + w chi F1
Gnorm = U0 + w chi U1
Mnorm = M0 + w chi M1
Pnorm = P0 + Cp + w chi Pi1
bnorm = [X v0 + w(chi X v1 - 2eta extra M1/L)]/sqrt(2X)
L=1-2h eta².
```

여기의 F0/U0/v0는 실제 완료 leading 함수2/3/4이고 F1/U1/v1/M1/Pi1은 실제 원본5/6/7/8/10이다. 원본 함수의 인자 순서와 미분 차수도 그대로 비교한다. bnorm의 extra 항을 삭제하거나 원시함수 M1을 0으로 바꾸지 않는다.

Cp는 실제 helper677의 `int_0^X F0(t,eta)^2 dt` 전체와 binder 이름에 무관하게 같아야 한다. P0는 실제 core3451이며 같은 원본 287-node 압력 식의 해석 정리에 연결한다. Cp의 끝점이 유한하므로 완료 leading의 축까지 C∞와 유한 구간 미분-적분 교환으로 충분하다. 무한 꼬리를 0으로 놓는 규칙을 사용하지 않는다.

q0=Q(ell)s, Q(ell)=exp(-ell log2)>0를 대입한 실제688..691 본문은 각각

```
s^(-A-1/2) Fnorm,   s^(-A) Gnorm,
epsilon s^(-1/2) bnorm,   s^(-2A) Pnorm
```

인지 전체 비교한다. epsilon=Q(ell)^h>0다. s>0, X>0, L>=1-2h>7/8이므로 모든 추가 log/power/sqrt/inverse 인수가 유효하다. 완료 leading과 실제 여섯 order-one 함수의 C∞ 정리를 합성하면 이 네 함수는 원래 물리 chart에서 모든 고정 미분을 갖는다. 이 명제에는 covariance H, Volterra 해 또는 양의 covariance weight가 필요하지 않다.

## 원래 26개 ID의 미분과 별도 장부

F/G/b의 각 여덟 요청은 R,T,Z,RR,ZZ와 순서 [R,Y1], [R,Y2], [R,theta]다. pressure의 두 요청은 R,Z다. 앞의 C∞가 실제 R 미분의 존재를 먼저 제공한다. 그 뒤 같은 함수와 R 미분은 Y1/Y2/theta를 인자로 갖지 않으므로 아홉 혼합 요청은 정확히 0이다. 요청 순서를 바꾸어서 첫 미분의 존재를 건너뛰지 않는다. 나머지 열일곱 요청은 같은 원본 registered partial이다.

검사기는 compact의 전체230개 (원본ID,source node,순서 좌표) 목록을 독립 고정 SHA로 비교한다. 입력 역사 장부는 최신 인증본 SHA `2e854cc1c7ee577a4451dc9e93849212ae055dcccc705599ee109b7d10bbcf21`이며 절대로 덮어쓰지 않는다. 모든 body·분모·입력 연결이 통과했을 때만 별도 새 장부에 26개를 PROVED, 나머지204개를 OPEN으로 기록한다. 하나라도 body 정의역이 남으면 26개 전부 OPEN, 새 소거0이다. Guard10과 PDE1020, 원래14개 universal requirements는 그대로 유지한다. 따라서 성공 시에도 전체 N6 증명이 완료되는 것은 아니다.

## 첫 fresh 실행에서 발견한 실제 상수 적분239의 보완

첫 인증 실행38725792575는 원래 node239의 `definite_integral`을 미검토 연산으로 남겨 **26개 모두 OPEN**으로 기록했다. 이 실패 기록은 보존한다. 새 규칙은 유한 적분을 값으로 치환하지 않는다. 원본 실제 graph의 integrand, binder 및 두 endpoint를 모두 읽고 endpoint는 바깥 scope, body는 새 binder scope에서 검사한다. memo key에도 scope를 포함한다. 모든 inverse/log/sqrt 인수가 닫힌 적분 구간 전체에서 유효하고 integrand가 연속임을 증명한 뒤에만 유한성을 사용한다. 미검토 integrand나 극점, 바인딩되지 않은 좌표, binder-dependent ceiling은 실패한다.

실제 source-step의 전역 C∞ square-seed 정의는 별도의 원본 파일 `actual-global-source-expressions.mjs` SHA cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3로 인증한다. `sigma=exp(-1/x²)/(exp(-1/x²)+exp(-1/(1-x)²))`의 lazy 상수 exterior를 사용한다. 따라서 0<=sigma<=1, sigma'>=0이고 0<x<1에서는 sigma'>0이다. 유한한 고정 차수의 모든 미분은 전역 연속이다. 알 수 없는 차수나 native 연산을 허용하지 않는다.

실제239의 integrand는 `exp((1-lambda)*(x-S(x)))*(lambda-h+(1-lambda)*sigma(x))`, S(x)=int_0^x sigma이며 0<=x<=1이다. literal h/lambda=exp(-7002*T)<1이므로 lambda-h>0이고 나머지 항은 비음수다. 따라서239는 유한한 양수다. Qb root259는 이 양수와 `(1-h)*(-4 log h)>0` 및 비음수 flatten 적분의 양의 결합이어서 양수다. Qp root275는 1..3에서 양의 인자 곱과 sigma'((x-1)/2)를 적분한다. 끝점에서 sigma'가0이어도 x=2에서 양수이고 전 구간 비음수이므로 Qp>0이다. 이는 유리수 내부 점과 연속성을 이용한 정확한 존재 증명이며 수치 구적 추정이 아니다. 따라서 실제 wait root280의 log(Qb/Qp)는 유한하다. 이 단계는 wait의 양수성이나 적분의 근삿값을 주장하지 않는다.

실제 full fixed의239/259/275/280에 대한 작은 로컬 재검사는 이 사실들을 확인했다. 전체 selector617466의 모든 조상 및 26개 본문의 최종 합성은 다음 fresh full-cache 실행이 수행해야 한다. 여기까지의 로컬 재검사나20개 작은 fixture 통과로26개를 먼저 소거하지 않는다.
