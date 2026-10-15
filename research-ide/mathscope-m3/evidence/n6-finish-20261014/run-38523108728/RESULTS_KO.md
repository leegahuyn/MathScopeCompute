# 남은 원본 의무 전담 계산 결과

**전부 완료 또는 무조건부 인증을 주장하지 않습니다. N6-01 OPEN / N6-02 PARTIAL, M3 56/64입니다.**

실제 실행: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38523108728  
코드: `a5b636416ad9bda7230ab9e08031ae5191d9785c`  
이전 검증된 입력: run38519593971, matrix SHA256 `c4b45294a1214602c1e42c0881443e5c95dd2bc51b85d715d0929464d97bb394`.

| 원본 의무 | 이번 실제 시도 | 이번 증명 | 남은 의무 |
|---|---:|---:|---:|
| Jet: 이전128개는 보존 | 237/237 | 7개, 원본 leaf 정의역 범위 | 230 |
| Global guard: 이전35개는 보존 | 59/59 | 17개 전역 증명 | 42 |
| PDE 원본 분자항 | 1020/1020 | 원본 해석적 항등식 인증0개 | 원본 전체 인증 미완료 |

PDE의 조건부 미분 대수 정규화 항 수는 미완료/미완료/미완료입니다. source leaf가 정의된 영역에서 정확히 zero로 도출한 원본 입력항은 0개입니다. 원본 등록 함수 존재성·미분 교환·전역 정의역을 증명하지 않은 형식 대수 결과는 원본 해석적 PDE 인증으로 승격하지 않습니다. 정규화로 단항식 수가 늘거나 줄어도 모든 원본1020항·계수·남은 단항식·실패 이유를 보존합니다.

새 jet의 정확한 미분식·실제 원본 Cartesian 대입 overlay는 jet 작업 아티팩트에 보존합니다. 전역 image/공통 support/전체 W/M/S/Haar/Picard holomorphic 계수 노름과 전체 3D PDE/정의역·오차 enclosure는 별도의 원본 의존성으로 남아 있습니다.

계산 작업 9/9 성공. 성공은 수학적 완전 인증과 별개입니다. 누락·실패: [].

사용자 노트북에 저장소·ZIP·계산 아티팩트를 받지 않았습니다. 표준 Ubuntu hosted runner, Python3.12/Node24, 프로세스별 주소공간5GiB/840CPU초 상한, PDE 대수 하위 프로세스420초 제한, 계산 작업18분 제한을 설정했습니다. Git의 검증된 원본 체크포인트를 재사용하고 이미 닫힌 jet128개·guard35개는 새 계산 대상에서 제외했습니다. Artifacts 보존90일, 실제 만료시각과 artifact digest는 GITHUB_OBSERVATION.json, 모든 결과/로그의 해시는 CERTIFICATE_HASHES.json에 기록합니다. main·원본 producer·원본 기준·56/64·공개 사이트는 보호하며 병합·배포하지 않았습니다.
