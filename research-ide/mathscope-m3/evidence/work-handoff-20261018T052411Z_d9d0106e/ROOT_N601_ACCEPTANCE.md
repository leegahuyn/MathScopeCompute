# N6-01 주 에이전트 판정

판정: **CLOSED — 원래 j=0 초기 구성 범위**.

검토한 공동 적용 증거의 SHA-256은 `5e32f8e32b95f319b681d4e92b7c01befba54bb2600af9655ace21562de689b9`이다. 두 독립 검토가 이 동일한 바이트를 승인했다. 초기 배경/M2 정리의 승계 범위는 사용자가 지정한 원래 범위를 따른다.

최종 속도 `[3825006,3825007,3825008]`, 전체 압력 `3825009`, 후속 five 교정 뒤의 mean pressure `3615361`를 동일한 원본 구성에 결합했다. temporal pressure `3614634`를 최종 압력으로 대체하지 않았다. 실제 잔차 세 성분 `[3825348,3825349,3825350]`의 함수 동일성과 별도로 검증된 매 고정 차수의 smoothness를 함께 사용했다.

원문 (9.8)의 `B0=7/10`, `C0*=6/5`, (9.9)의 `1/2, 17/25, 9/10, 19/10` 및 두 (9.10) 모멘트가 적용 표의 정확한 지수와 root로 충족된다. 모멘트 기록의 `weightPower=24`는 지수 24가 아니라 값 2인 표현식 노드 ID이며, 다른 노드 1은 값 1이다. 따라서 실제 가중치는 원문의 R²와 R이다.

전차수 transport는 유한 차수 검사에서 외삽한 것이 아니다. 기존 same-source continuation, 실제 두 fast-coordinate affine map, primary/mean/pressure 클래스 정리, 정확한 세 성분 함수 동일성을 결합했다. 고정 label에서의 체인 규칙은 유한 상수와 S의 거듭제곱을 늘리며 ε 지수를 추가로 잃지 않는다. 원래 selector의 유한 저차 블록과 기하급수 tail이 prefix에 무관한 상수를 제공하고, 겹치는 유효 prefix들은 cutoff-zero 및 ODE 유일성으로 일치한다. 단일 N=1 prefix의 영역을 임의로 넓히지 않았다.

`G_wave`와 `F_pulse`를 분리한다. 후자는 실제 Gaussian 경계 감쇠와 매 고정 물리 미분에 대한 상계로 flat하다. 원래 background flat residual, A0 및 다른 radial-integral remainder도 유지한다. 새로운 P/J 결함을 0으로 두지 않고 실제 비선형 remainder로 추적한다.

기존 네 조건부 wave 가정은 공동 적용 증거의 구체적인 원문 정리·source/root 연결로 해소되었다. 원본 TARGET 파일의 미회수는 별도의 재현 문제로 남으며 이 초기 구성의 수학적 판정을 뒤집는 근거로 사용하지 않는다. 유한 native projection이나 파일 해시 일치만으로 이 판정을 내리지 않았다.

이 판정은 이후 signed/forced cycle, 최종 cutoff 합성, terminal force, whole-K energy 또는 네 축 evaluator를 승인하지 않는다. 그 의무는 개별 ID ledger에서 별도로 판정한다. 기존 56개 완료 항목을 승계하고 N6-01 한 항목을 추가하여 현재 M3 완료 수는 57/64이다. 초기 1260개 의무와는 합산하지 않는다.

독립 검토:

- `work/derivative_fix/evidence/n601_crossreview/INDEPENDENT_REVIEW.md`
- `work/derivative_fix/evidence/n601_crossreview/REVIEW_DECISION.json`
- `pdf_criteria/n601_candidate_review.md`
- `pdf_criteria/n601_candidate_review.json`

후속 적용 증거: `work/theorem_connection/N601_JOINT_PROOF.md`, `work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json`.
