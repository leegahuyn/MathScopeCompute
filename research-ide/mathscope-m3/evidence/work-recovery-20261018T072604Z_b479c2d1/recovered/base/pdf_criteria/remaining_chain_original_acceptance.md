# 후속 네 항목의 원래 인수 범위

이 메모는 원래 기준의 해석이며 새 후보를 닫는 판정은 아니다. 인증된 Blueprint pp62,64와 논문 pp57–59,103–116,118–120을 직접 대조했다.

| ID | 원래 기준에 충분할 수 있는 수학적 산출물 | 실제로 연결해야 하는 입력 |
|---|---|---|
| N6-07 | 모든 finite j의 같은 도메인에서 정의된 재귀 구성과9.17/9.18 증명 | 같은 j0, fixed background/primary/support/inverse, 네 순서 있는 실제 map, 매번 complete pressure, 다음 cycle source hypotheses |
| N6-08 | 같은 increments의 cutoff-potential 합, 단일 finite-stage 비교, 정확한 symbolic window/active set/tail | 실제 source-bound cutoff sequence, curl commutator, Cartesian/support 조건, fixed-stage residual 및 flat remainder |
| N7-04 | 같은 최종 localized force의 모든 terminal jets와10.6–10.10 증명 | 원래 localization, q-positive endpoint, positive-radius exterior heat/pressure, originflatness |
| N7-05 | 같은 jets의10.11 extension와10.12 정수 schedule 및 모든 mixed-jet 접합 | 실제 compactK jets/norms,10.10, differentiated uniform tails |

원문은 무한한 stage graph 배열, 모든 derivative 배열, runtime dispatcher, decimal cutoff endpoints를 요구하지 않는다. 그러한 요구를 새로 추가하면 안 된다. 반대로 초기 상태의 sealed producer나 generic supplied-jet consumer를 실제 재귀 state/최종 force와 연결하지 않은 채 정리 이름만 인용해서는 충분하지 않다. 수학적으로 정의된 구성과 실제 수치 evaluator/refinement가 수행한 범위를 명시적으로 나눈다.

## N6-08의 정확한 기호 구간

같은 source schedule이 a1^(-1)<qbig, a_(j+1)>=e*a_j 및 실제5.37을 만족하고 J>=max(1,m)라 하자. 구간 `[1/a_(J+2), 2/a_(J+2)]`는 양의 구간이며 전체가 q<qbig 안에 있다. `2/a_(J+2)<=2e^(-2)/a_J<1/(2a_J)`이므로 첫 J correction cutoff는 모두1이다. j>=J+2이면 a_j q>=1이라 cutoff와 모든 derivative가0이다. base0과 correction1..J+1을 저장하면 가능한 active set이 완전하며 J+1만 transition 가능하다.

따라서 이 구간에서 생략한 미래 cutoff terms의 tail은 정확히0이다. 별도로 uncut finite state U^[J]와의 차이는 `2^(-J) q^(h(J+1)/20−ell_prime_m)`으로 제한된다. 두 tail 계약을 섞으면 안 된다. Lemma5.4의 a_j는 양의 실수이며 정수 조건은 없다. N7-05의 b_j에는 정수 조건이 있다.

## 상수와 정수 선택

C_hat/P_hat는 실제 단계 함수를 적용한 class/physical derivative 추정에서 정의되어야 한다. 그 유한성 및 source dependence가 증명되면 실제 부등식을 만족하도록 scale을 재귀 선택할 수 있다. 모든 상수의 decimal 값을 출력할 필요는 없다. 실제 함수와 연결되지 않은 임의 C_j,m 기호를 넣는 것은 다르다.

N7-05 원문 자체는 `||F_j||_(C^a)`와 최소 정수 선택으로 b_j를 정의한다. 여기서 F_j를 같은 최종 localized force의 실제 uniform terminal limit로 정의하고 그 norm의 유한성을 위 세 영역의 증명으로 확보했다면 해당 norm은 완전히 정해진 source quantity다. numerical supremum evaluator를 추가 인수 관문으로 만들지 않는다. 그 경우 b0=1, b_j>b_(j−1), 모든 a+m<=floor(j/2)의10.12와10.10을 써서 모든 mixed jets의 접합 및 K×[0,2] support를 증명한다.

이는 N6-02의 implemented-substep 독립 PDE 비교, N7-06의 independent space/time energy refinement, N8-05의 네 축 numerical comparison table을 대신하지 않는다.
