# MathScope 재연결 후 추가 실행 전달본

M3는 **62/64**입니다. N7-06·N8-05는 OPEN이며, 초기1260/1260은 초기 구성 범위에서만 승계합니다. M4의 원래16조건 완료와 사이트 게시·모바일 검수는 수행하지 않았습니다. B0=0.7,C0*=1.2와 원래 인수 조건을 유지했습니다.

이 묶음은 검증·저장된74MB 체크포인트 ZIP을 baseline/ 아래에 원래 바이트 그대로 보존하고, 이후 실제 source에 적용한 추가 코드·증거·장부·로그·해시를 포함합니다. 내부 ZIP의1,230개 인덱스와 외부 CONTINUATION_FILE_INDEX.json을 각각 검증할 수 있습니다. 기존 장시간 실행과22단계 재현은 재사용합니다.

추가 성과는 indexed 의존성 원문3,407개와 실제 local derivative 조립, 원래 continuous matrix25성분의 엄밀한 구간, 실제I1/heat8호출의C2상계, Picard4호출의 실제 collar상계, 원래 정규화된 natural33호출의 구간, 그리고 양의 시간 slab에서 원래 stage j>=5 꼬리가 정확히0이라는 적용입니다. 조건부/형식변수/실제상계/미평가 native 값을 각 proof와JSON에서 구분합니다. 이것은138개 전체 kernel이나 전역장 수치 검증 완료가 아닙니다.

남은 것은 같은 최종장의 실제 native jet·cutoff값·stage1..4 및 slow-base 평가, whole-K 에너지 적분과 독립 공간/시간 defect 감소, 원래 네 축2배 비교와 별도 tail입니다. 현재 actual global last-resolved tau는null입니다. 현재 exact-min selector는 선택된 구현의 정의이며 다른 원래 조건 충족 구성을 불가능하다고 주장하지 않습니다.

Python3.12+와Node가 필요합니다. 짧은 Windows 경로(C:\mspkg,C:\msw 등)를 사용하세요.

    python REPRO_RESUMED.py --work-dir ../MathScope_resumed_new --report-dir ../MathScope_resumed_reports

또는 reproPS_RESUMED.ps1에 -WorkDir,-ReportDir,-PythonExecutable를 지정합니다. 새 작업 폴더만 허용하며, 기존22단계가 아닌 추가12단계만 실행합니다. 실제 실행 환경은Work Linux이며 PowerShell은Windows에서 실행했다고 주장하지 않습니다.

Git에는 baselineZIP을 중복 저장하지 않습니다. 체크포인트 커밋 ed7d7ca8의 work-recovery-20261018T072604Z_b479c2d1 디렉터리에서 RESTORE_GIT_TRANSPORT.py로 원문2개를 복원한 별도 작업 사본을 --base-directory로 지정할 수 있습니다. 같은 baseline 인덱스와1,230개 파일 바이트를 검증한 뒤 추가 작업을 실행합니다.

브라우저 재확인은 originating browser context 오류로 실패했습니다. 모델 UI·운영페이지·모바일을 확인하지 않았고 다른 브라우저나모델로 대체하지 않았습니다. 작업자는gpt-6-astra/ultra로 지정됐으며 주모델 내부 상태와잔여량은독립확인API가 없습니다. environment/ 기록에서 실제 관측 범위를 확인하세요.

실제 추가 재현 결과: 새 Work Linux 사본에서12단계 전부 EXIT0, 16.385초. 기존 baseline1,230파일과 외부입력114파일이 실행 전후 일치했습니다. 기존22단계·Windows실행·1700초 실행은 반복하지 않았습니다. 출력해시와 변경된 생성결과는 delivery_tools/portable_verification 아래에 보존했습니다.
