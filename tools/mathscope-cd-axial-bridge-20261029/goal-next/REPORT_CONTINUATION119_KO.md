# MathScope C119 검증 결과

**M3 62/64 (96.875%), 전체 jets 0/67, 전체장 수렴 비교 0/4, RELEASE HOLD.** 격리 M4 후보 16/16이며 운영 R1-08은 OPEN입니다.

## VERIFIED

- 두 실제 Signed 입력 #22001223과 #22001224에 필요한 순수·혼합 시간 공분산 35개를 결속했습니다. 원본 $W_{rz,ZZZT}$, 중심화 압력 #22000443의 $\beta_{ZZTT}$, 고정 끝점 및 실제 두 교차항을 유지했습니다. compact $\beta_{ZZTT}$의 입력 267개는 기존 원본 공분산 범위에 들어갑니다.
- 실제 Signed의 반경 미분 계수 두 개는 고정 라벨에서 $T$에 독립입니다. 잠재장 6개는 원래 횡 cutoff를 정확히 한 번 갖습니다. 이를 원본 물리 curl의 반경·시간 및 축방향·시간 항에 결속했습니다.
- 원본 $\eta$ 계수를 미분할 때 생기는 교환자와 양의 차수 cutoff의 두 번째 로그 미분을 Lean으로 확인했습니다. 두 정리는 GitHub에서 컴파일을 통과했습니다. [GitHub Lean 검증](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44680001259)

## CONDITIONAL

- 원본 해석 가정 아래 혼합 Signed 입력의 경계 상계는 $\varepsilon\zeta S^{107/2}c^{-33}\exp(H/2^{108})$입니다. 원래 위상 계수 $+i\varepsilon k vH_T$를 포함한 물리 느린 시간 성분은 $\varepsilon\sqrt{\zeta} S^{315/4}c^{-54}\exp(H/2^{106})$로 제어됩니다. 가운데 구간에는 경계 극점이 없습니다. 독립 재현 두 번의 결과가 일치했습니다.

## OPEN

- 실제 둘째 보정의 전체 가드와 빠른 펄스 성분, 후속 보정 및 M3 N7-06의 전체 에너지와 N8-05의 전체장 수렴, 최종 67 jets가 남았습니다. 둘째 보정 원본 전체 기록 생성은 이 검증 시점에 진행 중입니다. [GitHub 원본 생성](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44668251828)
- 모든 고정 $n\ge2$의 보존형 소거는 원본 해석 가정 아래 성립합니다. 공통 무한 급수의 정량 수렴과 운영 M4 R1-08은 OPEN입니다.

검증 전용 브랜치에만 커밋했고 두 보호 브랜치와 운영 공개본을 읽기 전용으로 확인했습니다.
