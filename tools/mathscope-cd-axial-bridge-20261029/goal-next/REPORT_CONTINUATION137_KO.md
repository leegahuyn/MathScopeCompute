# MathScope C137 검증 결과

**M3 62/64 (96.875%). 남은 승인 0/2. 최종 jets 0/67. RELEASE HOLD.** 이동 열 방정식의 외부 67개 구간은 검증됐습니다. 동일 최종 전체장의 네 독립 비교는 0/4이므로 남은 작업량을 백분율로 산정할 근거는 없습니다.

## VERIFIED

- 원본 Primary 공분산의 횡방향 $L^9$·$L^{10}$ 입력 35개를 양쪽 부호에서 대조했습니다. 원본 $L v=0$ 때문에 해당 미분은 $\chi$와 $\chi'$의 인수들에만 작용하며, 필요한 cutoff 미분은 최대 11차입니다. 이 확인으로 축소한 일반 평균 원본 경로의 미결 입력 19개를 모두 결속했습니다.
- 원고 (5.20)–(5.21)과 원본 #672/#117047의 라이브 $X_-$·$X_+$ 적분 구조, 정의역 guard 및 formal에서 actual/native로의 대응은 $n=1,\ldots,12$에서 검증했습니다. $n=1$의 선도 질량과 원래 각방향 $X_b$는 별도로 유지했습니다. 조건부 다섯 모멘트 소거 Lean 정리 16개는 소스 대조와 독립적입니다. [기존 GitHub Lean 실행](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44692315167)
- 실제 radial 거리와 Gaussian 상계가 주어졌을 때 값과 차분 몫의 소거를 주는 Lean 정리 두 개를 GitHub에서 실제 컴파일했습니다. 전체 원본 재생은 원본 노드 22,380,596개와 보호된 앞부분을 대조했습니다. [새 Lean 실행](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44700362074), [원본 전체 재생](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44682703381)

## CONDITIONAL

- 실제 Repeat의 240개 스칼라에 대해 반경 양쪽 $X_a,X_b$의 $C^1$ 접합을 얻었습니다. 적용 범위는 양쪽 좌표계가 허용되고 다른 guard가 내부에 있는 고정 라벨입니다. 원본 wave/pressure, 평균 60방향, $TT$ 120개, $TN$, $N^2$, 네 차감 계열과 실제 lazy zero를 같은 원본에 연결했습니다. $X_a,X_b$는 #672의 축방향 적분 끝점과 별개의 반경 guard입니다.
- 각 고정 $n\ge2$에 대한 구조적 적용에는 질량·압력의 실제 경계 접합, cutoff 평탄성 및 고정 끝점의 보통 $\eta$ 미분이 필요합니다. 기본 wrapper는 3차 $\eta$에서 제한에 걸렸고 원본 본문 유지 경로에서는 검증한 12개 모두 3차 $\eta$를 재현했습니다.

## OPEN

- 실제 네 indexed 필드 등록의 GitHub 전체 실행 및 독립 판독, 경계가 동시에 만나는 곳의 접합, 모든 물리점에서의 양쪽 차트 허용, 전체 후속 보정장과 보존 잔차가 남았습니다. [GitHub 등록 실행](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44698543085)
- 참조 차트의 실제 원본 구간은 닫혀 있습니다. $Z_{\rm ref}=0$, $T_{\rm ref}=s_{\rm ref}=1/2$, $\ell_{\rm own}=\ell_{\rm ref}+1$이면 own 차트는 $s_{\rm own}=1$인 밴드 중심에서 활성이고, 참조 차트의 strict 조건은 등호로 실패합니다. 이는 원본 밴드 창이 허용하는 라벨의 수학적 경계 예이며, 보조 torus 사각형에서 파동이 비영인지를 판정하지 않습니다.
- N7-06은 같은 전체장의 에너지 결손을 독립 공간·시간 세분화에서 확인해야 합니다. N8-05는 같은 최종 전체장의 격자, Fourier cutoff, 계수 차수, 정밀도와 별도 꼬리 상계 및 마지막으로 분해되는 $\tau$를 요구합니다.
- M4 격리 후보는 16/16이며, 운영 R1-08의 인증 편집 본문은 기존 두 읽기 경로 모두 연결이 종료됐습니다. Y 원본 N1의 명시적 슬롯 523/523을 검증했고 일반 native 판정은 OPEN입니다. 두 보호 브랜치와 운영 공개본은 읽기 전용으로 대조했습니다.
