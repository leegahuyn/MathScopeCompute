# M3 N6 원본 클라우드 계산: 최종 엄격 판정

**전부 해결되지는 않았습니다. N6-01 OPEN / N6-02 PARTIAL, M3 56/64를 유지합니다.**

| 대상 | 작업 시작 시 남은 수 | 현재 남은 수 | 실제 계산 결과 |
|---|---:|---:|---|
| 원본 leaf-domain jet |365|230|128+7개를 정확히 증명하고 원본 Cartesian 식에 적용 |
| 전역 guard |59|38|추가17+4개 원본 의무 증명; 전체94개 중56개 |
| 원본 PDE 잔여항 |1020|1020|전 항 계수·원본 node를 독립 검산; 해석적 소거0개 |

PDE 전 성분의 정확한 조건부 유리식 정규화를 완료했습니다. 독립 검산한 분자 단항식은 **7492/11428/32312**, 모두 0이 아닙니다. 이는 원본1020항과 같은 세 잔여식을 다른 형태로 쓴 결과이며, PDE 해결 수로 집계하지 않았습니다. 원본 implicit root 정의식 `F=S−Z²E−T`에 대해 제3성분의 `N−Nrem=FQ`도 독립 검산했습니다. 입력654항 중327항에 S가 있고, 나머지는838항이며 역시 0이 아닙니다. 원본 계수·분모를 삭제하거나 강제로0으로 만들지 않았습니다.

유효한 원본 slow-root image에서 모든 차수 Cauchy 상계 `|∂Z^a∂T^b S|≤3 a!b!1024^(a+b)`를 도출했습니다. 원본 step 상계, 열 함수의 임의 고정 차수 미분 및 tail 상계, Qp/Qb의 전역 양수 경계, 원본 P0/g 및 Zstar 함수 동일성도 증명했습니다. 다만 원본 전체 Cartesian/Fourier/적분 인수가 그 image/공통 strip에 들어간다는 전역 증명은 남았습니다. 유효한 국소 정리의 적용 범위를 전역 인증으로 확대하지 않았습니다.

최종 guard 실행 상태: **SUCCESS**, 엄격 입력검사: **PASSED**. native Picard `radialDomain=[0,a]`의 목록형 양 끝점과 indexed `derivativeScales`까지 실제 source를 다시 열어 capture를 검사합니다. 성공하고 모든 추가 조건을 통과한 새 증명만 채택하여 이전의 얕은 domain 검사를 대체합니다. 동일한 내용의 PDE·jet 계산은 반복하지 않았습니다. 모든 변이 검사·원본 실패 시도·남은 의무 ID/전제/증거는 기계 판정표 및 영수증에 남깁니다.

실제 native 계수 전 차수/저장 미분/limit 의미를 선택된 해석적 fixed point와 연결하는 원본 증명이 아직 완결되지 않았으므로 Picard B_rho 노름 상계를 인증하지 않았습니다. 원본 Prop9.5 j0(B0=0.7,C0*=1.2)의 전체 W/M/S, Haar 모멘트, 공통 full-field support·changing-label joins, 실제 Rayleigh 양수 envelope, 전체3D PDE 및 정의역/rounding-tail enclosure도 미해결입니다.

## 재현 및 보존

- 자식 branch: `mathscope-m3-n6-cloud-20261014`. Draft PR30: https://github.com/leegahuyn/MathScopeCompute/pull/30
- 원본 미분/jet/guard17 증명 성공: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38523108728 (12/12,56검사)
- 정확한 PDE 전 성분 검산 성공: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38527630069 (4/4,39검사)
- 최종 guard 정의역 재검사: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38529033425; 코드 `adde1a9ec4fc86fadd7d7ff2e3746d7043abfe02`
- 보존된 초기 strict 입력검사 실패: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38521462859
- 보존된 정확대수 자원 중단: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38525128679

main/원본 producer155개/기준56/64/공개 사이트를 변경하거나 병합·배포하지 않았습니다. 표준 Ubuntu24.04 hosted runner,Python3.12.10/Node24.19.0만 사용했습니다. 로컬 노트북에 저장소·ZIP·대형 아티팩트를 내려받지 않았습니다. runtime 바이너리/소스/출력 SHA256와 실제 image version을 기록했고, 제공되지 않는 전체 runner image 암호학적 digest를 있다고 주장하지 않았습니다. 큰 출력과 stdout/stderr는 GitHub Artifacts90일 보존이며, 만료 후 Git 소스/체크포인트로 재현해야 합니다. 요약·판정표·증명 영수증·certificate hash는 Git에 보존합니다.

실행 완료 후 별도 Git tree 대조에서 보호 대상 원본/검증 입력236개의 blob이 PR29와 모두 동일했고, 변경151개 파일은 새 pipeline/증거/manifest 범위에만 있었습니다. 최종 실제 Actions 상태·아티팩트 만료시각·digest는 FINAL_STATUS.json에 보존합니다.
