# MathScope: 원래 기준 62/64에서 수행한 복구·연결 작업

현재 M3는 **62/64**이며 N7-06과 N8-05는 OPEN입니다. 초기1260/1260은 초기 구성 범위에서만 승계합니다. B0=0.7, C0*=1.2 및 원래 도메인·정규화·기준은 유지합니다. 초기 Guard/Jet/PDE0의 [0,0]을 후속 실제 전역장 의무까지 확대하지 않습니다.

## 실제로 보존·회수한 근거

기준은 PR30의 `1d4449517ac1217415e67e39c822aeea97325c21`과 이전 최종 ZIP입니다. ZIP 39,956,341바이트, SHA256 `350c0bd1c889d1002ad240cce549fede2c4fc20893a398172ba6f22755fd1424`를 다시 회수했고, CRC와 인덱스989개 파일의 해시가 모두 일치했습니다. 기존 1,700.657초 finite-cycle 실행과 Windows Python3.12.10의 이미 완료된 실행은 재실행하지 않았습니다.

작업 중 Work의 자동 scratch 정리로 새 로컬 코드·증거와 진행 중이던 업로드 세션이 소실됐습니다. 해당 시점의 PR30 head는 여전히 위 기준 커밋이었고 새 커밋·최종 ZIP 저장은 완료되지 않았습니다. 따라서 이전에 관측한 18개 n=1 tower 상계, nonlinear core 96개 비교와12단계 재현 성공을 현재 회수한 파일인 것처럼 첨부하지 않습니다. 그 관측과 파일 미회수는 WORKSPACE_RECOVERY_RECEIPT.json에 따로 남겼습니다. 현재 `work/prune_recovery`의 구현은 보존된 원문에서 다시 작성·검증한 **새 복구 구현**입니다.

원본 스트림은 기존 Git의4개 조각에서 회수했습니다. 압축32,688,149바이트 및 비압축209,857,208바이트,3,892,594개 노드와 헤더의 원래 해시가 일치합니다. 과거 header helper의 차이는 Git의 LF 정규화였으며, 원래 CRLF 바이트를 복원한 결과 기존 afec61db… 해시와 일치했습니다. 원본 논리나 수학적 정의를 재구성한 것이 아닙니다.

## 이번에 확인한 결과와 범위

1. **누락 scalar700개 → 0개.** 기존92,722개 기록을 원본에 대조했고700개를 회수했습니다. 134개는 적분 결합 좌표,566개는 다른 피연산자입니다. 원본128,555개 raw dependency record를 보존했습니다. 독립 검토는 원본 스트림에서 baseline/export의 합집합160,573개를 직접 대조하고 동일 closure를 별도 재구성했습니다.
2. **결합 변수와 native의 의미를 구분했습니다.** 적분4,212개·binder876개와 expression 호출1,013개를 대조했습니다. 이 중202개는0차이고811개는 실제 미분 backend가 필요합니다. 계수 closure의 semantic native589개는 bodyless572개와 implicit equation14개, inverse forcing3개를 구분한 수입니다. 이 수는 전역장 평가 완료 수나 M3 항목 수가 아닙니다. 원래138개는 natural69·Picard18·quadratic13·covariance4·indexed34이며 모두 현재589개 집합의 같은 source ID에 연결됩니다. 그138개의 전체 수치 kernel은 아직 모두 OPEN이고, 이번 완료는 각각의 원문 상계·recipe 등 부분 작업입니다. 정확한 대응은 ORIGINAL_138_CROSSWALK.json에 저장했습니다.
3. **원문에 연결된 일부 native adapter를 재작성했습니다.** 실제 quadratic13개 source-domain 구간, slow inverse2개의 조건부 bracket, indexed34개·원래5,184행의 유한 미분 recipe 및 실제 natural norm/tail recipe를 저장했습니다. source-domain 상계와 실제 caller 좌표에 적용한 수치값은 구분합니다. 정리 인용만으로 caller 적용을 완료 처리하지 않습니다. 직접 indexed 피연산자453개 중 기존 closure 밖429개 원문도 회수했지만, 그 다음418개 즉시 의존성과 재귀 수치 평가는 아직 남아 있습니다. 이는 앞서 해결한 원래 scalar700개와 다른 범위입니다. 현재 eta 미분차수5를 포함한 해당 natural 상계는 exp(exp(1048599))까지이며, 이 상계를 수치 평가 완료나 최적 상계로 해석하지 않습니다.
4. **실제 localization/force의 소비 부분을 연결했습니다.** 원래 captured localization 식을 다시 읽어 `curl(cA)+cb(-y,x,0)`, 전체 Cartesian gradient, `-∂τu-Δu+(u·∇)u+∇(cp)`를 연결했습니다. 구간 계산기는 일반 입력의 계산이며, 실제 최종장으로 인증하지 않습니다. 실제 요청은 frozen family에 연결된67개 A/b/p jet과13개 cutoff jet을 명시합니다. 누락값을0으로 대체하지 않습니다.

실제 초기 potential·전체 pressure에 대한4개 constituent cone에서 추가 원문142개를 회수했고, 기존589 semantic native 중584개와 추가 pressure 호출1개를 연결했습니다. 압력 recipe162행과 원래 norm-root28개도 대조했습니다. 이는 초기 constituent 연결이며 최종 correction 합의 수치값이 아닙니다. 에너지 검사54개와 별도 독립540항·82atom 대조가 통과했습니다. 각 검토·실행의 정확한 수치, 입력 해시와 종료코드는 해당 그룹의 JSON/로그가 기준입니다. SQLite는 재생성 가능한 cache이며 전달에서 제외합니다. 첫 cache의 비정상 상태는 숨기지 않고 기록했고, 새 경로의 전체 인증과 두 프로세스 재개방 및 별도 gzip 직접 검토로 source/export를 확인했습니다.

## 남은 원래 의무

| ID | 현재 판정 | 남은 실제 작업 |
|---|---|---|
| N6-01, N6-02, N6-07, N6-08, N7-04, N7-05 | CLOSED 승계 | 기존 source-bound 증거와 원래 범위 유지 |
| N7-06 | OPEN | 같은 최종 A/b/p와 실제 selector를 수치 jet 평가기로 연결하고, whole-K에서 force·work·에너지·dissipation을 적분해 독립 공간/시간 세분화의 정규화 defect 감소와 ν=1의(10.13)을 확인 |
| N8-05 | OPEN | 같은 실제 최종장에서 core·axial·pulse·active-cutoff를 함께 해결하고 grid/Fourier/계수차수/정밀도를 각각2배 한 비교표와 별도 꼬리를 저장 |

원본 parent stream의 ID 범위는[0,3892593]입니다. 과거 finite-cycle의 최종 velocity `[4311535,4311537,4311539]` 및 pressure `4311541`은 다른 실행 그래프의 live root입니다. 이를 parent stream에서 조회하거나 초기 tuple로 대체할 수 없습니다. 기존 실제 생성 코드·영수증의 유한 검증은 유지하지만, 그것이 최종 무한합의 수치 evaluator를 제공하지는 않습니다. frozen family의 exact supremum/minimum selector도 아직 수치 평가기가 아닙니다. `actual_global_last_resolved_tau=null`을 유지합니다. 다른 알고리즘의 가능성을 배제하거나 수학적 불가능이라고 판정하지 않습니다.

M4는 원래 I3 확장8개와 R1의8개, 합계16조건입니다. 기존 대응표를 보존했으며 현재 릴리스의 완료 수를 새로 확정하지 않았습니다. 사용자의 M3→M4→3D 게시 순서에 따라 M4 완료·웹사이트 업데이트·상호작용·모바일 검수는 이번에 완료 처리하지 않습니다. main 병합·유료 변경·기존 자산 삭제도 수행하지 않습니다.

## 환경과 재현

같은 ChatGPT Work 작업 경로에서 자동 정리 후 자료를 복구했습니다. 다른 로컬 Codex 환경으로 대체하지 않았습니다. 작업자는 `gpt-6-astra`/`ultra`로 요청해 생성됐고 하위 작업자가 이를 상속했습니다. 주 에이전트의 실제 내부 모델과 잔여 사용량을 독립 확인하는 API는 제공되지 않았습니다. 기존 Browser 플러그인의 접근은 이전 기록의 장애를 승계하며, 별도 CUA로 대체 검수하지 않았습니다.

최종 ZIP의 `REPRO_RECOVERY.py` 및 `reproPS_RECOVERY.ps1`은 해시 검증 후 새 사본에서 이번 복구 코드만 실행하도록 구성됩니다. Python3.12와 Node가 필요합니다. 이번 실제 실행은 Work의 Linux 환경이며 Windows에서 실행했다고 주장하지 않습니다. 과거 원본 TARGET_SOURCE_NODES.ndjson 자체는 여전히 미회수이며, 인증된 projection과 구별합니다.

이번 최종 전달 전 새 사본 재현은22단계 전부 EXIT0,48.074초였으며1,148개 입력 파일의 실행 전후 해시가 일치했습니다. 이22는 재현 작업 수로 M3 항목과 합산하지 않습니다. 출력 해시와 변경된 생성 결과는 portable_verification 아래에 보존했습니다. Windows 실행은 수행하지 않았습니다.
