# 실제 background 688–691의 물리 정의역과 원본 혼합 미분 9개 검토

독립 검토 판정은 **과학적 범위와 합성 논리가 타당함**이다. 아래 결론은 같은 원본의 완료 leading/order-one 정리, 실제 selector의 유한 양수성, 그리고 상쇄 전 전체 원시 연산의 정의역 인증을 소비한다. 이 문서만으로 원본 ID 26개를 소거하지 않는다. fresh 실행에서 이 입력 연결과 원시 연산 인증이 통과해야 한다.

## 1. 원본 생성식과 실제 등록 본문의 일치

인증된 `source-global-band.mjs` 70–97줄은 다음과 같이 만든다. `h>0`, `A=1/2+h`, `D=1/2-h`, `Q=exp(-ell log 2)`이고 `ell`은 고정된 원본 정수 label이다.

\[
s-Z^2s^{2h}-T=0,\quad X=R^2/(2s),\quad \eta=Zs^{-D},\quad q=Qs.
\]

원본 정의 688/689/690/691은 각각

\[
s^{-A-1/2}F_{\rm norm},\quad s^{-A}G_{\rm norm},\quad
Q^h s^{-1/2}b_{\rm norm},\quad s^{-2A}P_{\rm norm}
\]

이고 normalized 함수의 실제 인자는 모두 `(q,X,eta)`이다. compact의 실제 node와 등록 정의를 읽어 네 물리 본문 및 monotone system 2의 식을 독립 재비교했으며 모두 일치했다. 물리 본문 root는 차례대로 `622901,622911,622921,622931`이고 실제 호출 node는 `622932..622935`다.

원본 생성기의 n=1 항은 `w=q^(2h)`, `sigma=b1*q`, `extra=sigma*chi'(sigma)`를 사용하여

\[
\begin{aligned}
F_n&=F_0+w\chi F_1,\\
G_n&=U_0+w\chi U_1,\\
P_n&=P_0+C_p+w\chi\Pi_1,\\
b_n&=(Xv_0+w(\chi Xv_1-2\eta\,\mathrm{extra}\,M_1/L))/\sqrt{2X},\quad
L=1-2h\eta^2.
\end{aligned}
\]

`actualLeadingTargetOnSensitivityGraph`의 `Cp`는 원본 그대로 `int_0^X F0(t,eta)^2 dt`다. radial 식의 `extra*M1/L` 항은 필요하며 삭제할 수 없다. 정규형 기대식은 이 항과 압력 상수·유한 적분을 모두 보존한다. normalized pressure 정의 684의 전체 등록 본문은 작은 compact에 없으므로, 그 최종 AST 연결은 full-cache 검증의 별도 의무다. 원본 생성 파일의 식을 읽었다는 사실을 해당 full AST 검증의 대체물로 삼지 않는다.

## 2. 실제 물리 영역의 합성

원래 admitted chart는 `R>0`, `T>=0`, `1/2<=s<=2`다. 같은 근에서

\[
\eta^2=1-T/s\le1,\qquad \partial_s(s-Z^2s^{2h}-T)=1-2h\eta^2>7/8
\]

이다. 따라서 같은 근 분기는 국소적으로 매끄럽다. `T>0`에서는 `|eta|<1`; `T=0`에서는 원본 관례대로 시간 미분을 한쪽에서 취한다. leading/order-one의 모든 고정 `X,eta` 혼합 jet이 닫힌 물리 영역으로 연속 연장된다는 정리는 합성 jet의 경계 극한을 준다. 이 과정은 원본 heat나 profile을 `|eta|>1` 또는 음의 시간에서 평가하지 않는다. s-bracket 경계에서도 원래 admitted 영역에 대한 상대적 jet을 사용한다.

`R>0`이므로 `X>0`이다. 따라서 `sqrt(2X)`와 그 역수는 유효하다. `0<h<1/16`, `|eta|<=1`에서 `L>7/8`. 고정된 유한 정수 ell에 대하여 `Q>0`, `q=Qs>0`이므로 모든 표시된 실수 거듭제곱과 로그가 매끄럽다. ell의 불연속적인 변경에 대한 미분이나 모든 band에 균일한 도함수 상계는 주장하지 않는다.

원래 chi는 양 끝에서 평탄하게 연장된 exp quotient다. selector b1의 모든 실제 상수 조상이 유효하고 b1이 유한 양수이면 q에 관한 chi와 chi'의 합성도 매끄럽다. `Cp`의 임의 유한 X 근방에서는 leading의 축까지의 정칙성과 유한 구간 미분-적분 교환만 필요하다. 무한 적분이나 전역 균일 norm으로 바꿀 이유가 없다.

따라서 실제 원시 연산의 정의역 인증과 위 입력 정리가 연결되면, 이 네 **유한 n=1 등록 함수**는 원래 물리 영역에서 필요한 모든 고정 미분을 갖는다. `R=0` 확장, 무한 background와의 동일성, complete_gr의 공통 압력 구간 J 정칙성은 이 결론에 포함되지 않는다.

## 3. 원본 순서를 보존한 9개 정확한 영 미분

compact의 원본 26개 요청을 독립 확인했다. 영 미분 후보 9개는 모두 `[622802,635044]`, `[622802,635045]`, `[622802,622806]`, 즉 **먼저 R, 그 다음 실제로 부재하는 좌표**의 순서다. 세 경우가 F/G/b 각각에 한 번씩 있다. pressure에는 이 영 미분 후보가 없다.

위 합성 정리로 먼저 `partial_R`의 존재와 연속성이 보장된다. 네 등록 함수와 그 R 미분은 부재 좌표 Y1/Y2/theta를 사용하지 않는다. 그러므로 그 뒤의 해당 좌표 미분은 정확히 0이다. 미분 순서를 바꾸거나 첫 미분의 존재를 생략하지 않는다. 나머지 17개 요청은 같은 함수의 실제 원본 1·2차 partial이다.

영 미분 원본 ID는 `742,918,1099,2182,2300,2422,732,908,1088`이며 모두 `cartesian-result:` 접두사를 갖는다. 이 목록은 재고 확인이며 별도 소거 영수증은 아니다.

## 4. 정규형 상쇄에 관한 필수 제한

가령 `f*(1/f)`의 정규형이 1이어도 원래 AST가 f=0에서 정의됐다는 결론은 성립하지 않는다. 따라서 BodyNormal 비교에 더해 **상쇄하기 전 실제 AST의 모든 inverse/log/sqrt/음의 power와 lazy guard**를 검사해야 한다. 다른 native 몸체는 해당 실제 입력 정리와 정확히 연결된 경우에만 정칙성 leaf로 사용한다. 새 full primitive certificate가 이 역할을 해야 한다. 이 검토는 이러한 인증을 건너뛰는 importer를 승인하지 않는다.

검토 범위 밖인 covariance H/weight, Volterra 해, 전체 Fourier mode, 전체 PDE 재결합은 그대로 열린 별도 의무다. 웹사이트와 역사 장부는 이 검토에서 수정하지 않았다.
