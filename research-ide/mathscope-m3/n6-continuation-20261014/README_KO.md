# 연결 중단 후 실제 N6 연구의 연속 검증

시작점은 PR #28의 `ba87dc9c09567c9a486d424ffb3e63a7eb04a12d`, 브랜치는
`mathscope-m3-mean-equivalence-20261014`이다. 최초 Actions 실행
[38500114302](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38500114302)의
성공한 6개 작업과 원본 식의 8/8 기호적 일치, 초기 5/5 정확 산술을 이어받는다.
그 대규모 mean producer를 처음부터 다시 계산하지 않는다.

## 새 계산과 증명의 범위

- `mean_capture_run.mjs`: 실제 남은 네 numerator만 재검사하고 Picard/Volterra의
  원래 정의를 펼쳐 새 적분 binder 네 개의 캡처 경계를 닫는다. 함수의 존재·미분과
  임의 좌표의 완전한 closure는 별도 의무다. 전체 실제 domain operand를 저장한다.
- `initial_source_lemmas.py`: 원본 node stream을 한 번 인증해 실제 bump, 다섯
  양의 적분, 15개 비영 분모, 세 source 복사와 weighted increment moments를 연결한다.
  전체 Prop. 9.5 W/M/S는 모든 고정 차수에 대한 균일 source 상계를 요구한다.
- `pde_replay.py`: 175/203/690은 direct-minus-assembled 분자의 항수임을 명시하고
  원본 `sqrt_positive(2)^2=2`만 추가해 169/197/654로 줄인다. 모든 항과 원래 분모,
  직접 미분 방향·registry, defining closure 및 393개 미계산 Cartesian jet을 보존한다.
- `analytic_initial_source.py`: 실제 root 622820과 eta 622829의 원래 compact image
  전체에서 존재·유일성을 증명하고 하나의 고정 collar로 모든 고정 차수 C∞ extension을
  얻는다. 전체 양의 root에 대한 별도 전역 정리는 원본 finite bracket을 변경하지 않는다.
- `analytic_primitives.py`: 실제 sigma 함수는 모든 실수에서 정의되고 C∞이다.
  모든 고정 차수에 대한 flat endpoint와 유한 전역 supremum을 귀납적으로 증명한다.
  529개 실제 step 호출에 연결하되 각 argument의 정의역을 자동 인증하지 않는다.
- `analytic_mean_run.py`: 실제 frame/Volterra/Picard 정의에서 가능한 전역 존재·미분
  정리를 증명하고, source background·고정 carrier·eta 수송식의 남은 전제를 분리한다.
- `analytic_pde_cutoff.py`: 실제 radial cutoff·정규화 적분의 정의와 전역 flat extension을
  source에 연결한다. 전체 target·PDE의 인증과 분리한다.

각 `.md` 증명은 고전적 해석학 논증이다. 새 Lean kernel 인증으로 표시하지 않는다.
유한 차수 테스트를 모든 차수 증명으로 사용하거나 불투명 jet을 0으로 치환하지 않는다.
8/8 symbolic check는 unconditional mathematical proof가 아니다.

## 원문과 재현 입력

사용자가 다시 첨부한 두 PDF는 기존 저장소 파일과 바이트가 일치한다.
Navier-Stokes 원문 SHA-256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
Blueprint는 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다.
기존 `research-ide/reference-documents/` 파일을 재사용하며 중복 PDF를 만들지 않는다.

원본 6개 ZIP은 `../evidence/mean-equivalence-20261014/cloud-38500114302/`에
영구 저장한다. `ARCHIVE_LOCK.json`은 모든 ZIP의 길이·SHA-256과 원본 producer 및
progress 파일 230개의 해시를 고정한다. 각 ZIP member receipt도 재확인한다.
증거의 바이트 인증은 수학적 인증이 아니다.

## 클라우드 실행

`.github/workflows/m3-n6-continuation.yml`은 표준 `ubuntu-24.04`, Python 3.12.10,
Node 24.19.0을 사용한다. prepare와 네 independent audit 뒤 같은 run의 mean
receipt를 확인한 analytic job을 실행한다. 명령 전체 deadline은 job별 1,200초,
Node heap은 8,192 MiB이며 유료 larger runner는 사용하지 않는다. 실패와 timeout도
실제 환경·source SHA·입출력 해시·로그·receipt로 보존한다.

```sh
python -B research-ide/mathscope-m3/n6-continuation-20261014/run_job.py --kind prepare --output FRESH_DIR
python -B research-ide/mathscope-m3/n6-continuation-20261014/run_job.py --kind controls --output FRESH_DIR
python -B research-ide/mathscope-m3/n6-continuation-20261014/run_job.py --kind mean --output FRESH_DIR
python -B research-ide/mathscope-m3/n6-continuation-20261014/run_job.py --kind initial --output FRESH_DIR
python -B research-ide/mathscope-m3/n6-continuation-20261014/run_job.py --kind pde --output FRESH_DIR
python -B research-ide/mathscope-m3/n6-continuation-20261014/run_job.py --kind analytic --mean-output SAME_RUN_MEAN_DIR --output FRESH_DIR
```

모든 cloud ZIP은 `archive_cloud.py RUN_ID OUTPUT_DIR`로 GitHub에서 다운로드하고
전체 member receipt를 검증해 저장할 수 있다. GitHub CLI의 현재 인증을 사용한다.
token은 출력하거나 저장하지 않는다. 완성된 한국어 결과와 후속 run 아카이브는
`../evidence/n6-continuation-20261014/RESULTS_KO.md`에 기록한다.

원본 producer, main, original 56/64, 공개 사이트 및 기존 성공/실패 기록은 유지한다.
N6-01/N6-02는 원래 전체 클래스·정의역·PDE의 모든 의무가 실제 증명되기 전까지 열려 있다.
