# Comparator 보호 실행 환경: 독립 조사

**판정: `BLOCKED_ENVIRONMENT` — 현재 컨테이너와 도구 실행 프로파일에서 원래 보호 호출을 시작할 정상 실행 환경을 찾지 못했다.**

2026-10-09에 읽기 전용으로 조사했다. 정확한 명령·Python 조회 스크립트·관측값·원문 및 기존 로그의 SHA-256은 동명의 JSON에 기록했다. 초기 관측의 초 단위 시각은 별도 수집하지 않았으며, 출처 해시는 16:00:25 UTC에 채취했다. 기존 Comparator 실패를 재실행한 결과가 아니다.

## 원래 요구와 실제 환경

원래 Comparator는 `leanprover/comparator`의 커밋 `19e111e2141cf333c7daff0f64c5f24acc91dd2e`로 고정되어 있다. 직접 읽은 `repo/.lake/packages/Comparator/README.md`의 보장 조건 6은 **비특권 사용자**를 요구하고, 이어지는 보호 호출은 다음 옵션을 포함한다.

```text
systemd-run --property=RestrictAddressFamilies=~AF_UNIX --user --pty ...
```

원래 Challenge·import·빌드 설정의 신뢰성, 실제 Landrun 및 커널에 관한 나머지 조건도 유지해야 한다. 이번 조사는 그 조건 전체를 새로 인증하지 않는다.

| 읽은 항목 | 실제 관측 | 판단에 미치는 영향 |
|---|---|---|
| 현재 신원·기존 계정 | UID/GID 0. `vscode`(1000), `oai`(1001)의 홈과 Bash 셸은 존재 | 계정 부재가 원인은 아니지만 현재 호출은 비특권 사용자가 아니다. |
| PID 1·사용자 세션 | PID 1은 `supervisord`. `/run/user`, systemd users/sessions가 비어 있고 `/run/systemd/system`이 없다. | 재사용할 활성 user manager/login 세션을 찾지 못했다. |
| DBus | 관련 데몬과 Unix socket을 관측하지 못함. `/run/dbus`에는 `containers`만 있으며 user/system bus 환경변수가 없다. | 기존 정상 bus에 연결할 경로가 없다. |
| cgroup | v2는 존재하지만 현재 `/sys/fs/cgroup` 마운트는 `ro`; `user.slice`와 활성 `subtree_control`이 없다. | 현재 제공된 사용자 cgroup 위임을 찾지 못했다. |
| 실행 프로파일 | `uid_map`/`gid_map`은 `0 0 1`. `CapEff=0`, `CapBnd=0`, `NoNewPrivs=1`, `Seccomp=2` | 이 프로파일에는 UID 1000/1001 매핑 및 사용자 전환·호스트 관리 capability가 없다. |
| 실제 상태 조회 | `/usr/bin/systemctl --user is-system-running` → `offline`, 종료 1 | 서비스 시작 없이 실제 바이너리로 user manager 가용성을 조회했다. |
| 설치와 커널 | systemd `255.4-1ubuntu8.17`, `+SECCOMP`; 커널 `6.18.44` | 바이너리 설치는 활성 manager나 guard 성공을 뜻하지 않는다. |

PATH의 `/usr/local/bin/systemctl`은 systemd가 실행 중이 아니라는 안내를 출력하는 셸 래퍼이다. 그 래퍼의 성공 종료를 가용성 증거로 사용하지 않았고, 위 조회에는 실제 `/usr/bin/systemctl`을 사용했다.

## 기존 실패와의 연결

`comparator-pinned-guarded.json` 및 로그에는 15:14:32 UTC의 원래 보호 호출이 `Failed to connect to bus: No medium found`, 종료 1로 기록되어 있다. 이번 직접 관측은 user bus 연결 단계의 실패 원인과 일치한다. Comparator 본체에는 도달하지 않았으므로 **정리의 거짓, 증명 거부, 외부 커널 검사 결과를 의미하지 않는다.**

## 필요한 실행 환경과 판정 범위

원래 guard를 보존하려면 **비특권 로그인 사용자, 정상 user systemd/DBus 세션과 필요한 cgroup 위임이 제공되는 별도 실행 환경**이 필요하다. 플랫폼이 그러한 환경을 제공한 뒤 고정된 원문·설정·실제 도구와 동일한 `RestrictAddressFamilies=~AF_UNIX` 호출을 사용해야 한다. 계정 이름이나 환경변수 설정만으로 관측된 결손이 해소되지는 않는다.

이 결론은 현재 가시 컨테이너와 실행 프로파일에 한정한다. 외부 환경이 이미 마련되었다고 주장하지 않으며, 커널 자체가 Landrun이나 모든 sandbox 기능을 지원하지 않는다는 판정도 하지 않는다.

조사 중 계정·서비스·권한·cgroup·namespace·원문·기존 보고서·NS 빌드 프로세스를 변경하지 않았다. guard를 대체하거나 완화하지 않았고 fake-landrun을 사용하지 않았다. 이번 저장 작업은 이 Markdown과 동명의 JSON, **새 보고서 두 파일만** 만든다.
