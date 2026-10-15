# 사용자가 제공한 OpenAI 논문의 실제 원본 적용

이 기록은 사용자의 요청에 따라 논문의 구성을 현재 MathScope 원본에 적용한다. 첨부 문서의 설계 예시와 실행 지시 문장은 참고 자료이며 사용자의 별도 명령으로 승격하지 않았다. 원본 producer, 상수, 원래 전칭 요구사항, main 및 공개 사이트는 이 기록으로 바뀌지 않는다.

## 1. 같은 논문과 같은 공식 참조

직접 읽은 166쪽 논문의 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 실제 직렬화 source의 `sourcePaperSHA256`과 일치한다. 제목은 **Finite Time Blowup for Navier–Stokes**, 저자는 OpenAI다. 정리 1.1의 계약은 매끄럽고 compact한 강제력, 영 초기 데이터, 유계 에너지 및 유한 시간 속도 발산에 관한 C/D 구성이다. 강제력이 없는 다른 명제를 이번 결과로 바꾸어 주장하지 않는다.

공식 발표: https://openai.com/index/navier-stokes-solution/

공식 논문: https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf

공식 Lean 저장소의 고정 commit: https://github.com/openai/NavierStokesAndEuler/commit/f9e8bc5b38b6e212696e8a30e3e91517af887bbd

위 commit은 기존 MathScope source의 Lean 참조와 같다. 이 기록을 위해 필요한 다섯 Lean 파일만 읽었으며, 파일별 hash와 blob ID는 `OFFICIAL_LEAN_SOURCE_INDEX.json`에 보존했다. upstream Lean build를 재실행하지 않았고, 공식 Lean의 함수와 현재 직렬화된 g21의 동치가 증명되었다고 표시하지 않았다.

## 2. 논문의 순서에 따른 원본 적용표

쪽수는 첨부 PDF의 1부터 시작하는 물리 쪽수이며 인쇄 쪽수와 일치한다.

| 논문의 단계 | 현재 실제 원본에 적용한 내용 | 아직 필요한 전체 적용 |
|---|---|---|
| Appendix B, 자연 해 및 4절 선행 구성 | 같은 자연 계수의 Banach 정상 수렴, 실제 B.26/B.34/B.8의 양성성과 다섯 moment, 실제 연속 행렬을 이용한 B.8 root | 모든 호출자의 실제 X/η 영역 및 완성 선행장의 전체 접합 |
| Appendix C, (C.9)–(C.13), pp160–161 | 실제 C1 variance/circle 역함수와 endpoint collar, 변하지 않은 유한 N의 C.12 및 엄밀한 shear gap | I1/I2와 바깥 구간을 포함한 완성 선행장에 조합 |
| Appendix A, (A.10)–(A.13), p130 및 (A.15), p131 | 실제 angular 작은 quadratic branch와 pulse 두 affine moment, 양의 amplitude branch의 독립 부등식 | 새 native gate의 실제 hash/본문 검증 및 frozen 대표점에 적용 |
| Appendix A, (A.19)–(A.23), pp133–134, (A.32)–(A.38), p138, (A.39)–(A.43), pp139–140 | 전체 Laplace heat를 유지한 실제 I2 무한 적분, 원래 반경 안의 contraction, terminal heat E>0 및 성장 gap | physical η∈[-1,1]와 원래 호출자 영역을 명시하여 전체 조합 |
| (4.7), p26 및 (5.5)–(5.6), p46 | 실제 M0 원시함수와 continuity로 Omega prefix의 미분 오차가 정확히 0임을 유도 | 완성 선행 U0/M0/v0의 C∞ 전제와 source 본문 결속 |
| Lemma 5.1/5.2, pp47–52, (5.15)–(5.16) | 실제 Picard0 정상 수렴/parity, 같은 축 상수, 원래 다섯 moment 및 Pi1의 마지막 영 분기 접합 | 모든 order-one 전역 함수, 공통 J 및 필요한 모든 후속 primitive 조합 |
| 6절 및 Proposition 9.3, pp103–105 | 162개 label의 지지/affine 미분과 전체 local velocity normalization을 보존하는 조건부 대수 검사 | 원래 모든 230 Jet의 실제 함수 정칙성과 영 연장 |
| Propositions 7.5/7.6 | 실제 carrier 분모의 양성성, frozen frame 및 signed stress의 가정 구분 | 실제 완성 선행 cone/대표점, Volterra와 covariance의 모든 실제 입력 |
| 8절과 Definition 9.4, p106 | 압력 재계산을 독립 의무로 유지하고 전체 curl, 모든 자기항/교차항 및 cutoff 도함수를 보존 | `-χ′(R)∫H`를 포함한 원래 1,020개 PDE 항의 실제 증명 |
| Propositions 9.5/9.6, pp106–110 | j=0 초기화와 네 보정의 순서, 매 단계 전체 residual/pressure/moment 재계산 및 원래 W/M/S norm 요구 유지 | 모든 원래 label·band·고정 미분 차수와 보편 N6-01/N6-02 요구 |

## 3. 그대로 유지해야 하는 보정 계약

106–107쪽은 저해상도 두 장만 렌더하여 수식과 본문을 확인했다. Definition 9.4의 순서는 `B_j=1/2+σ_j`, `C*_j=1+σ_j`, `σ_j=1/5+j/10`이다. Proposition 9.5는 temporal mean과 다섯 방정식 보정의 **전후**에 압력을 재구성하고 `B_0=0.7`, `C*_0=1.2`를 얻는다. 다음 단계는 supported nonzero harmonic inverse, signed auxiliary-independent stress, temporal zero-mean inverse, 현재 결함의 다섯 방정식 보정 순서다. Proposition 9.6의 한 cycle 증가량은 두 잔여 차수 모두 `1/10`이다.

이는 유한 표본에서 residual을 작게 만들거나 새 상수로 허용 오차를 바꾸는 규칙이 아니다. 매 단계의 완전한 속도와 압력으로 다시 계산해야 한다. (9.11)의 covariance 상쇄에도 분할 함수의 도함수와 curl 보정 교차항이 포함된다. 현재 모든 원본 의무는 이 계약으로 평가한다.

## 4. 증거와 장부

이번 논문 확인 직전 head `42866f8001d266024ec09660f6b221bc3a1ac61d`의 cloud run `38720796745`는 실제 source 단계와 22개 독립 scoped gate를 모두 통과했다. 원본 12개 CI check도 모두 성공했다. raw 결과와 실패 이력은 같은 PR #30에 저장한다. 이 성공은 각 부분 정리의 검증이며 원본 1,260개 전칭 의무의 완료 표지가 아니다.

이번 후속 gate는 실제 I2, 단일 metadata 과포착 분류, angular/pulse/terminal heat, 실제 order-one 압력 원시함수를 추가한다. 새 gate가 아직 실행되지 않은 시점의 문서·대수 검산을 cloud 검증 결과와 섞지 않는다. 최종 새 원본 소거 수는 모든 해당 선행 조건과 원래 row 검사가 충족된 경우에만 올린다. 현재 원본 잔여는 **Guard 10 / Jet 230 / PDE 1,020 = 1,260**, 미증명은 OPEN이다.

첨부 Blueprint의 64개 NS 항목과 원본 잔여 의무 1,260개는 별도 장부다. 해당 99쪽 Blueprint의 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이며 항목별 연결은 `BLUEPRINT_NS_REQUIREMENTS_KO.md`와 `blueprint_ns_requirements.json`에 보존한다.

큰 PDF, 원본 graph/SQLite, full Lean checkout 및 `.lake`는 노트북에 새로 저장하지 않았다. cloud 원본 결과는 메모리에서 hash를 확인하여 GitHub에 직접 저장한다.
