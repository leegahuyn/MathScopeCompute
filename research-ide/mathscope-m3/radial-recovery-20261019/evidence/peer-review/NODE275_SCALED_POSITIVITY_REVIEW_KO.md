# 원 node275의 정규화 양성·역수 상계 독립 검토

**판정: 원 식·chain factor·정규화 상계가 확인됐다.** 실제 `Qp`의 수치, terminal wait, 나머지 radial 적분이나 M3 완료를 계산한 결과는 아니다.

## 원 자료와 24개 기록

원 논문 SHA256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. PDF129쪽의 식(A.5),130쪽(A.12)–(A.13),132쪽의 양성 논의와 현재 원 source compiler를 대조했다. 이 폴더의 페이지 텍스트는 기존 pdftotext 결과에서 페이지 단위로 그대로 분리했다. OCR이나 수식 재작성은 하지 않았다.

Node275의 원 AST closure는 다음 **24개 ID**이며 각 기록을 capsule의 원본 파일 위치에서 직접 대조했다.

`1, 9, 14, 19, 20, 21, 24, 207, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275`

원 파일의 크기·SHA와 각 record의 원 위치는 JSON 영수증에 있다. `node276=inverse(node275)`는 별도 소비자이므로 24개 closure 수에는 넣지 않았다.

## Chain factor와 정확한 정규화

원 node267은 `source_step_derivative((s−1)/2,1)`이다. 원 expression compiler의 미분 규칙은 argument derivative와 바깥 argument의 미분을 별도로 곱한다. 원 node275에는 다음 `1/2`가 이미 명시돼 있다.

$$
Q_p=\frac{\rho}{2(1-\rho)}\int_1^3 e^{(1-h)s}\sigma'\!\left(\frac{s-1}{2}\right)ds,
\qquad \rho=\frac h{256}.
$$

$u=(s-1)/2$에서 $ds=2du$이므로 정확히

$$
Q_p=hK(h),\qquad K(h)=\frac{I(h)}{256-h},\qquad
I(h)=\int_0^1e^{(1-h)(1+2u)}\sigma'(u)du
$$

가 된다. Jacobian과 원 `1/2`가 한 번 상쇄되며 추가 chain factor는 없다.

## 양성과 유리 상계

원 step은 $0<u<1$에서

$$
\sigma(u)=\frac{e^{-1/u^2}}{e^{-1/u^2}+e^{-1/(1-u)^2}}
$$

이고 바깥에서는 원래의 flat0/1 확장을 따른다. Logit의 미분은 $2/u^3+2/(1-u)^3>0$이므로 $\sigma'>0$, 총 미분 질량은1이다. 원 $0<h<1$에서 $1<I(h)<e^3<27$이고 $255<256-h<256$이므로

$$
\frac1{256}<K(h)<\frac9{85},\qquad
\frac{85}{9}<\frac h{Q_p}<256.
$$

$e<3$은 factorial series의 기하 tail로 증명할 수 있어 부동소수점 지수 비교가 필요 없다. 원 $h=\exp[-8002(\exp(1048576)+10)]$을0 또는 다른 매개변수로 대체하지 않았다.

또한 $\sigma(1-u)=1-\sigma(u)$를 적분하면

$$
S(1)=\frac12,\qquad S(1-x)=S(x)+\frac12-x,
\qquad S(x)=\int_0^x\sigma(u)du
$$

를 얻는다. 두 번째 식은 $x\in[0,1]$에서 성립하며 원 flat 확장과 방향 적분을 사용하면 모든 실수 $x$에서도 성립한다.

## 기존 A13 증거와 이번 진단의 구분

`actual-original-a13-numerical-enclosure.mjs`에는 이미 원239/257/275의 source-form audit 및 $Q_p\in[\rho,54\rho]$ 소비자가 있다. 여기에서 $h/Q_p\in[128/27,256]$를 얻는다. 이 기존 감사는 `sourceAuthenticated=false`, `parentGraphAuthenticationRequired=true`를 명시한다. 별도 `actual-common-positive-scale-enclosure.mjs`에는 private parent authority를 통한 연결이 이미 있으나 `globalAllLabelsNumericallyEvaluated=false`, `wholeGNUMComplete=false`다.

따라서 이번 검토를 이전에 양성 증명이 없었다는 주장으로 사용하면 안 된다. 더 좁은 $(1/256,9/85)$는 독립 진단으로 보존하며 기존 consumer를 자동 교체하지 않는다. 이번 검토에서는 기존 consumer를 재실행하지 않았다.

현재 새 adapter의 바이트는 아직 결속하지 않았다. 새 모듈이 고정되면 해당 SHA를 별도 영수증으로 연결하고 원 source binding과 제한된 음성 대조만 검사할 수 있다. 실제 `Qp`·그 역수·terminal wait의 수치, 원 radial 적분 전체, 실제 외부 frame, whole-K 장은 미확인이다. **N7-06·N8-05 OPEN, M3 신규 완료0, tau=null**을 유지한다.
