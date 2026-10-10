#!/usr/bin/env python3
"""Reproduce the 15-page Korean MathScope follow-up PDF.

Written interpretation is kept in this producer; numerical values, hashes,
gate criteria, observations, and the formal progress page use actual saved
receipts. The program fails on overflowing content rather than clipping it.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from decimal import Decimal, localcontext
from fractions import Fraction
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle

sys.set_int_max_str_digits(1000000)
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
NAVIER = HERE.parents[1]
OUTER = NAVIER / "followup-20261010-outer-reselection"
AXIS = NAVIER / "followup-20261010-same-datum-axis"
GLUE = NAVIER / "followup-20261010-symbolic-gluing"
AUDIT = HERE.parent
N1 = NAVIER / "followup-20261010-n1-final"

INK = colors.HexColor("#172D40")
TEAL = colors.HexColor("#146B69")
MUTED = colors.HexColor("#526879")
PALE = colors.HexColor("#EDF5F4")
RULE = colors.HexColor("#D5DFE5")
AMBER = colors.HexColor("#8A5318")
W, H = A4
LEFT, RIGHT, BOTTOM = 43, 43, 51
WIDTH = W - LEFT - RIGHT
INPUTS = {}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    path = path.resolve()
    content = path.read_bytes()
    INPUTS[str(path)] = hashlib.sha256(content).hexdigest()
    return json.loads(content)


def decimal(value, digits=24):
    number = Fraction(value)
    with localcontext() as context:
        context.prec = digits
        return str(Decimal(number.numerator) / Decimal(number.denominator))


def clean(text):
    return (text.replace("\u2011", "-").replace("\u2013", "-")
            .replace("\u2014", "-").replace("κ", "kappa"))


def shortsha(value):
    return value[:16] + "..."


def P(text): return ("p", text)
def S(text): return ("small", text)
def H2(text): return ("h", text)
def EQ(text): return ("eq", text)
def BOX(title, text): return ("box", title, text)
def T(headers, rows, widths): return ("table", headers, rows, widths)
def CODE(text): return ("code", text)


def make_styles():
    return {
        "p": ParagraphStyle("body", fontName="Nanum", fontSize=10.1,
                            leading=16.1, textColor=INK, wordWrap="CJK",
                            spaceAfter=9),
        "small": ParagraphStyle("small", fontName="Nanum", fontSize=8.5,
                                leading=13.1, textColor=MUTED, wordWrap="CJK",
                                spaceAfter=7),
        "h": ParagraphStyle("subhead", fontName="NanumBold", fontSize=12,
                            leading=17, textColor=TEAL, spaceBefore=5,
                            spaceAfter=8, wordWrap="CJK"),
        "eq": ParagraphStyle("equation", fontName="Nanum", fontSize=11.2,
                             leading=19, textColor=INK, leftIndent=12,
                             spaceBefore=4, spaceAfter=12, wordWrap="CJK"),
        "table": ParagraphStyle("cell", fontName="Nanum", fontSize=9.05,
                                leading=13.8, textColor=INK, wordWrap="CJK"),
        "thead": ParagraphStyle("thead", fontName="NanumBold", fontSize=9.0,
                                leading=13.5, textColor=colors.white, wordWrap="CJK"),
        "box": ParagraphStyle("box", fontName="Nanum", fontSize=10,
                              leading=16, textColor=INK, wordWrap="CJK"),
        "code": ParagraphStyle("code", fontName="Courier", fontSize=7.8,
                               leading=11.4, textColor=INK, wordWrap="CJK"),
        "title": ParagraphStyle("title", fontName="NanumBold", fontSize=23,
                                leading=32, textColor=INK, wordWrap="CJK"),
        "deck": ParagraphStyle("deck", fontName="Nanum", fontSize=10.5,
                               leading=17, textColor=MUTED, wordWrap="CJK"),
    }


class Report:
    def __init__(self, output, styles):
        self.canvas = canvas.Canvas(str(output), pagesize=A4, invariant=1,
                                    pageCompression=1)
        self.canvas.setTitle("MathScope M0/M1 후속 검증 보고서 | 2026-10-10")
        self.canvas.setAuthor("MathScope Research IDE")
        self.canvas.setSubject("동일 최종 프로파일, 원래 9조건, 해석·구간·커널 증거 범위")
        self.styles = styles
        self.page_number = 0
        self.lowest = []

    def put(self, flowable, gap=0):
        width, height = flowable.wrap(WIDTH, H)
        if self.y - height < BOTTOM:
            raise RuntimeError(f"Page {self.page_number} overflow: y={self.y:.1f}, h={height:.1f}")
        flowable.drawOn(self.canvas, LEFT, self.y - height)
        self.y -= height + gap

    def paragraph(self, text, style="p"):
        style_object = self.styles[style]
        self.y -= style_object.spaceBefore
        self.put(Paragraph(clean(text), style_object), style_object.spaceAfter)

    def table(self, headers, rows, fractions):
        styles = self.styles
        cells = [[Paragraph(escape(clean(str(value))), styles["thead"]) for value in headers]]
        cells += [[Paragraph(escape(clean(str(value))).replace("\n", "<br/>"),
                             styles["table"]) for value in row] for row in rows]
        table = Table(cells, colWidths=[WIDTH * f for f in fractions], hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LINEBELOW", (0, 0), (-1, 0), .5, INK),
            ("LINEBELOW", (0, 1), (-1, -1), .35, RULE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F7F9")]),
        ]))
        self.put(table, 12)

    def box(self, title, text):
        para = Paragraph("<b>" + clean(title) + "</b><br/>" + clean(text), self.styles["box"])
        table = Table([[para]], colWidths=[WIDTH])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE),
            ("BOX", (0, 0), (-1, -1), .5, colors.HexColor("#BCD4D0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 11),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ]))
        self.put(table, 12)

    def page(self, title, deck, elements, citation):
        self.page_number += 1
        c = self.canvas
        c.setFillColor(TEAL)
        c.rect(0, H - 10, W, 10, fill=1, stroke=0)
        c.setFont("NanumBold", 9)
        c.drawString(LEFT, H - 34, "MATHSCOPE  /  M0 · M1  /  후속 검증")
        c.setFillColor(MUTED)
        c.setFont("Nanum", 8.4)
        c.drawRightString(W - RIGHT, H - 34, "2026-10-10 KST")
        c.setStrokeColor(RULE)
        c.line(LEFT, H - 46, W - RIGHT, H - 46)
        self.y = H - 65
        self.put(Paragraph(clean(title), self.styles["title"]), 10)
        self.put(Paragraph(clean(deck), self.styles["deck"]), 17)
        for element in elements:
            kind = element[0]
            if kind in ("p", "small", "h", "eq"):
                self.paragraph(element[1], kind)
            elif kind == "table":
                self.table(*element[1:])
            elif kind == "box":
                self.box(*element[1:])
            elif kind == "code":
                lines = escape(element[1]).replace("\n", "<br/>")
                self.paragraph(lines, "code")
            else:
                raise ValueError(kind)
        self.lowest.append(round(self.y, 2))
        c.setStrokeColor(RULE)
        c.line(LEFT, 40, W - RIGHT, 40)
        c.setFillColor(MUTED)
        c.setFont("Nanum", 7)
        c.drawString(LEFT, 27, clean(citation))
        c.setFont("NanumBold", 8)
        c.drawRightString(W - RIGHT, 27, f"{self.page_number:02d} / 15")
        c.showPage()

    def save(self):
        if self.page_number != 15:
            raise RuntimeError("The report must have exactly 15 reviewed pages")
        self.canvas.save()


def build_pages(data, publication_url):
    assessment, assembly, review, prefix, core, mixed, formal, observation = data
    paramsha = assembly["parameterExpressionSHA256"]
    profile_sha = assembly["profileEvidenceSHA256"]
    observation_time = observation["receivedUTC"].replace("T", " ").replace("Z", " UTC")
    gate_rows = []
    summaries = {
        "N1-05": "원문 전체 기본 build 실제 exit 0와 보존된 전체 로그·환경",
        "N1-06": "보호 Comparator 최종 artifact 미확인",
        "N3-01": "같은 C, 전이 폭, 실제 S/R와 한 유한 N",
        "N3-02": "같은 A.21 datum과 모든 eta의 heat·moment 보상",
        "N3-03": "실제 Lean 입력·고정점·전 차수 jet·양방향 오차 연결",
        "N3-04": "같은 무한 core 항등식과 실제 배열의 오차 포위",
        "N3-05": "실제 debt와 all-eta 연속 5×5 비선형 포함",
        "N3-06": "최종 장 전체의 strict κ와 I1 균일 복원",
        "N3-07": "최종 stress support·flat 하한·끝점 극한",
    }
    display_titles = {
        "N1-06": "정리 의존성과\nComparator 검사",
        "N3-01": "상수의 선택 순서\n실행 명세",
        "N3-02": "외곽 radial schedule\n압력 datum",
        "N3-04": "실제 core 압력·\n방사 속도 복원",
        "N3-05": "Inner continuation\n다섯 모멘트 접합",
        "N3-06": "Cone의 radial\nmodulation",
        "N3-07": "지지·끝점·예약\npatch 검사",
    }
    for row in assessment["gates"]:
        status = "충족" if row["currentStatus"] == "PASS" else "미완료"
        gate_rows.append([row["id"], display_titles.get(row["id"], row["title"]),
                          status, summaries[row["id"]]])
    c_p = decimal(prefix["pressureCoefficient"]["lower"], 33)
    c_width = decimal(prefix["pressureCoefficient"]["width"], 12)
    core_rows = []
    for y in ["0", "1", "2", "4", "41/10"]:
        selected = [next(v for v in core["evaluations"] if
                         v["quantity"] == "CE_over_sqrt_2X" and v["Y"] == y and
                         v["radialDerivativeOrder"] == k) for k in range(3)]
        core_rows.append(["4.1" if y == "41/10" else y] +
                         [format(v["decimalDisplayOnly"][0], ".12g") for v in selected])
    formal_rows = [[part["title"], part["resultLabel"], part["proved"],
                    part["scope"]] for part in formal["parts"]]
    publication = ("발행 주소: " + escape(publication_url)) if publication_url else (
        "2026.10.10.3 판본의 공개 발행은 별도 작업이다. 이 보고서는 아직 발행되지 않은 주소를 성공한 공개 링크로 표시하지 않는다.")

    return [
        ("동일 프로파일로 연결한<br/>M0 / M1 후속 결과",
         "원래 완료 기준을 유지한 2026-10-10 검증 보고서", [
            BOX("원래 9개 잔여 조건 중 8개 충족", "같은 최종 프로파일의 7개 N3 조건과 원문 전체 빌드가 충족되었다. <b>실제 Lean 입력·무한 고정점·유한 jet의 연결도 완료했다. N1-06 보호 Comparator의 최종 결과만 남아 있다.</b>"),
            T(["판정 층위", "이번 기록"], [
                ["원래 9개 잔여 조건", "8 충족 / 1 미완료"],
                ["원래 70개 항목의 별도 후속 집계", "69 PASS / 1 PARTIAL / 0 BLOCKED"],
                ["보존한 원래 기준표", "61 PASS / 7 PARTIAL / 2 BLOCKED"],
                ["전체 profile / 9조건 완료 flag", "false - 남은 조건을 자동 승격하지 않음"],
            ], [.46, .54]),
            H2("무엇이 같은 대상이 되었는가"),
            P("새 외곽과 A.21 압력, 유일한 무한 axis, 실제 continuation과 B.8 접합, heat/I2 보상, C.12 변조와 I1 복원, 마지막 stress가 <b>하나의 정확 매개변수와 함수 정의</b> 아래 연결되었다."),
            P("결합본은 정확 식 63개와 입력 사본 137개를 보존한다. 작성자 결합 검사 292/292와 별도 독립 결합 검사 295/295가 실제 종료했다. 이 수치는 산술·출처 검사의 결과이며 수학 정리의 개수나 전체 형식화율이 아니다."),
            H2("보고서 읽기"),
            T(["범위", "페이지"], [
                ["원래 기준·동일 입력·상수", "2-4"],
                ["압력·무한 core·실제 배열·접합", "5-8"],
                ["실제 source·유한 N·최종 stress", "9-11"],
                ["원문 실행·Lean 범위·실패 이력·재현", "12-15"],
            ], [.78, .22]),
            S("대상은 원문 Theorem 4.6의 leading profile과 annular stress다. 전체 시간 의존 Navier-Stokes 해 또는 원문 force를 제거한 새로운 정리의 완료를 주장하지 않는다."),
         ], "근거: 설계도 pp.55-56; 인수인계 pp.1,4,10; dated gate assessment"),

        ("01  원래 9개 조건의 재판정",
         "원래 조건을 바꾸지 않고 실제 충족 범위와 남은 한 조건을 구분한다.", [
            T(["ID", "원래 항목", "판정", "결정적 근거 / 남은 조건"], gate_rows,
              [.105, .225, .105, .565]),
            H2("판정 원칙"),
            P("원래 criterion과 detail은 그대로 새 JSON에 옮겼다. 기존 61/7/2 기준표, 역사적 68/2 판정과 모든 실패·조건부 receipt를 보존한다. 새 69/1 판정은 2026-10-10 00:21:48 UTC의 실제 증거에 근거한다."),
            P("새 N3-03은 실제 analytic/norm 입력과 원래 고정점 정리, 모든 n,m의 정확 recurrence, 실제 배열과 절단·반올림을 연결했다. 125개 interval 연산 전부를 Lean 안에서 반복하는 새 조건을 추가하지 않았으며, 실제 커널 항등식과 정확 유리수 계산의 범위를 구분했다."),
            S("원래 NS_GATES는 항목별 정리·가정·정의역·출처·수치 방법·실제 formal receipt를 구분하도록 한다. full profile 인증은 남은 원래 조건이 모두 충족될 때만 가능하다."),
         ], "원래 기준: 설계도 p.52, pp.55-56; 인수인계 p.4; NS_GATES_EN.md"),

        ("02  하나의 프로파일과 증거 사슬",
         "결합본 one-profile-0002의 함수 정의와 입력 바이트를 따로 확인했다.", [
            T(["단계", "같은 객체를 유지하는 연결"], [
                ["외곽 → datum", "새 outer의 정확한 작은 근과 A.21 전체 적분으로 Pi0를 정의"],
                ["datum → 무한 core", "그 Pi0·h·j0·C를 사용한 원래 Banach 계수공간의 유일한 고정점"],
                ["core → B.8", "같은 continuation의 실제 다섯 debt를 새 연속 비선형 근으로 상쇄"],
                ["heat → I2", "실제 heat 적분식과 세 E 모멘트 보상; M/J는 그대로 0"],
                ["C.12 → I1", "같은 source와 한 N의 실제 변조 debt를 같은 C.2 연산자로 복원"],
                ["최종 장 → stress", "최종 E/U의 누적 적분으로 pressure·stock·T0를 다시 정의"],
            ], [.24, .76]),
            H2("서로 다른 후보를 합치지 않았다는 검증"),
            P("독립 감사는 producer를 import하지 않고 137개 snapshot 각각의 길이·SHA-256·실제 현재 소스 일치를 대조했다. 29개 accepted role, 63개 식의 순환 없는 의존성, actual B.8 debt, heat/C.2, source/gap, core/datum 연결을 별도로 검사했다."),
            P("조건부 loop·frequency·stress receipt의 actual-input=false는 과거 시점의 정확한 한계로 보존된다. 새 결합본이 각각의 실제 전제를 공급한다. 문서 해시의 일치만으로 해석 정리를 증명했다고 간주하지 않는다."),
            S("매개변수 SHA-256"),
            CODE(paramsha),
            S("프로파일 입력 증거 SHA-256"),
            CODE(profile_sha),
            S("실행: 결합 292/292; 독립 결합 295/295. 독립 검토는 출처·범위 검증과 별도의 연속 해석 증명을 함께 요구한다."),
         ], "근거: ONE_PROFILE_SPECIFICATION; one-profile-0002; assembly-review/0001"),

        ("03  상수의 선택 순서를 닫다",
         "정확한 양수·큰 지수·유한 정수 식을 유지한 하나의 선택이다.", [
            T(["순서", "정확한 선택"], [
                ["외곽 크기", "Md=2^20; T=exp(Md)+10; P*=exp(2T)"],
                ["작은 지수", "lambda=exp(-1000T); h=exp(-8002T)"],
                ["matching", "epsilonMoment=h^3; j0=h^4; muMoment=h^2"],
                ["axis separation", "delta*=j0/10; sigma*=j0/2000; rho=sigma*^2/65536"],
                ["무한 axis", "Q=2^260 P*^2/sigma*^2; Lambda=Q^64"],
                ["reference / shift", "BRefUpper=Q^300; Bk=Q^80; Tsh=Q^90"],
                ["최종 C와 XR", "C=(1+Q^300)^10 exp(Q^200); XR=110(CP*)^10"],
                ["네 전이 폭", "t1=kappa0=omega1=omega2=C^-120"],
                ["실제 source", "S=C^100000"],
                ["원래 C.1 loop", "d0=1/(8S); muLoopMax=S^12; deltaLoop=exp(-S^16)"],
                ["C.12 envelope", "R=exp(S^256)"],
                ["한 N와 margin", "N=1+ceil(R^50); kappa=R^-10"],
            ], [.27, .73]),
            P("reference의 실제 도함수 표는 모든 전이 폭이 허용 임계값보다 작음을 증명한다. 실제 source 표와 별도 양의 gap ledger가 S/R를 공급하므로, 미지의 compact supremum이나 '충분히 큰 N'이라는 빈 선택을 남기지 않는다."),
            S("설계도 p.56은 명시적 상하계 또는 증명된 선택 조건을 허용한다. 유한 N의 정확한 식을 십진 정수 전체로 출력하는 것은 원래 기준에 없다. C를 바꾼 뒤 이전 고정점을 그대로 유지하지 않고, 선택된 같은 C의 해를 사용한다."),
         ], "근거: 설계도 p.56; axis/reference/continuation/source bounds; C.12 contract"),

        ("04  실제 A.21 압력의 연속 포위",
         "근사식을 pressure의 정의로 바꾸지 않고 정확 적분에 오차를 붙였다.", [
            EQ("Pi0 / P*<super>2</super> = -cP / (1+eta<super>2</super>)<super>2</super> + analyticError"),
            BOX("실제 계산된 계수", "cP ≈ " + c_p + "<br/>포위 폭 ≈ " + c_width +
                ", 정확 유리수 끝점의 폭은 2<super>-279</super>보다 작다. 십진수는 표시용이다."),
            T(["연속 적분 설정", "accepted pressure-prefix-0002"], [
                ["산술", "384-bit directed integer intervals"],
                ["Taylor / 격자", "96차 / step=1/2048 / body 1792 cells"],
                ["복소 Cauchy 정보", "반경 1/256; 비교 함수의 복소 상계 2"],
                ["양끝 collar", "[0,1/16], [15/16,1]; flat 기여를 별도 양의 포위"],
                ["반올림", "모든 정수 연산을 바깥쪽으로 반올림; Float64 포위 사용 없음"],
            ], [.32, .68]),
            H2("무한 tail과 정확 datum"),
            P("원문 axial interval은 정확히 E=P1 f(eta) exp(-s/2), angular exponent=1이다. 모든 미수정 post-axial 단계는 amplitude의 log derivative가 -1/2 이하이다. |Im eta|≤1/16에서 angular square를 2로 묶어, 생략 axial tail과 실제 post-axial tail의 합을 2 exp(-T) &lt; 2^-1400으로 포위한다."),
            P("B.8·heat/I2·modulation/I1은 각각의 실제 모멘트 차이를 정확한 작은 근으로 상쇄한다. 이 정확 동일성이 최종 압력을 같은 A.21 datum에 연결한다. 선택한 eta 값에서만 수치가 가깝다는 논증이 아니다."),
            S("pressure-prefix-0001은 flat collar multiplier를 점으로 처리한 문제로 거부되었고 보존된다. accepted 0002의 연속 포위와 별도 tail 증명만 현재 입력으로 사용한다."),
         ], "근거: 원문 A.2 p.129, A.21; PRESSURE_DATUM_INTERVAL; PRESSURE_TAIL_REVIEW"),

        ("05  같은 무한 axis와 정확 core",
         "유한 residual의 작음이 아니라 무한 방정식의 항등식으로 복원했다.", [
            P("실제 새 Pi0, U*=4eta+j0, h와 C로 원래 B-rho 계수공간의 자연 remainder와 resolvent를 정의한다. invariant ball과 contraction은 같은 연산자에 대해 적용된다. 원래 coefficient norm, radial tail, eta 미분 가중치를 그대로 유지한다."),
            EQ("|| (Phi,u) - (f0(Y chi),u_ref) ||<sub>rho</sub> ≤ 29 Q<super>-53</super>"),
            T(["무한 객체의 조건", "확보한 내용"], [
                ["공간과 norm", "원래 complete coefficient space와 모든 n,m 가중 계수 경계"],
                ["해의 정의", "전체 natural remainder를 사용하는 유일한 Picard limit"],
                ["유한 jet 식", "고정점에서 유도한 coefficient recurrence; 다른 fixture의 계수 아님"],
                ["positivity", "0≤Y≤4.1에서 실제 Phi>1/4; 원래 f0 fixture도 별도 확인"],
                ["같은 continuation", "해의 endpoint와 도함수 경계가 실제 B.26/B.34 입력으로 전달됨"],
            ], [.3, .7]),
            H2("core 복원 식"),
            EQ("E = sqrt(2X) varphi/C,    Pi<sub>X</sub> = E<super>2</super>/(2X)"),
            EQ("V0 = (X/L) [2eta U - 2D eta A<sub>X</sub>(U) - d d<sub>eta</sub>A<sub>X</sub>(U)]"),
            P("평균 연산의 항등식과 정칙 integrating-factor 해의 유일성이 복원 Qs/Ns를 정확히 식별한다. Cartesian axis regularity, div u0=0, (4.13)의 leading tangential 항등식은 이 무한해에 대해 성립한다. axial viscosity와 나머지 PDE 항은 별도 잔차로 남는다."),
            BOX("실제 무한 객체와 형식 입력의 동일성", "실제 pressure·amplitude·operator 전제를 원래 정리에 넣어 같은 유일한 고정점을 선택했다. 새 커널 consumer의 all-order 오차와 정확 recurrence가 N3-03을 닫고, 같은 해의 core 항등식이 N3-04를 충족한다."),
         ], "근거: 원문 Appendix B; SAME_DATUM_ANALYTIC_AXIS §§7-9; 설계도 pp.56,81"),

        ("06  실제 배열과 오차의 범위",
         "계산된 범위와 전칭 해석 증명을 구분해 같은 nonlinear Phi에 연결했다.", [
            T(["산출물", "실제 범위"], [
                ["core 75개 값", "eta=0; Y=0,1,2,4,4.1; radial 0-2차와 지정 실제 eta 미분"],
                ["혼합 Phi 125계수", "radial 0-24차 × 정규화 eta 0-4차"],
                ["혼합 Phi 75개 값", "5 radial 점 × radial 0-2차 × 정규화 eta 0-4차"],
                ["실제 finite eta chart", "|eta|≤rho/4; xi=eta/j0"],
                ["comparison 전용 복소 disk", "|xi|≤1/16; nonlinear domain을 이 반경으로 확대하지 않음"],
            ], [.3, .7]),
            S("eta=0에서 CE/sqrt(2X)=Phi의 표시값. 아래 십진수는 구간 끝점을 대체하지 않는다."),
            T(["Y", "Phi", "dY Phi", "dYY Phi"], core_rows, [.1, .3, .3, .3]),
            P("core는 256-bit directed 연산 2280회와 독립 Fraction 구간 평가를 사용했다. mixed Phi는 4534회 directed 연산과 별도 exact oracle을 사용한다. 각각의 실제 포위가 독립 수치 검토에도 연결된다."),
            P("기존 mixed 평가의 analytic/tail budget은 2^-90 미만이다. 새 실제 125개 중점 다항식 M은 0≤Y≤4.1, |eta|≤rho/4의 연속 영역에서 |Phi-M|&lt;2^-118이다. nonlinear value, eta tail, radial tail, finite-block 차이와 실제 rounding을 따로 합한 정확 오차는 2^-119보다 작다."),
            BOX("두 값을 혼동하지 않는다", "fixture f0(4.1)≈0.2711140554와 실제 eta=0 Phi(4.1)≈0.271114175782는 다른 값이다. 실제 chi=4000000/4000001 및 양의 nonlinear 오차를 유지한다."),
            S("전체 [-1,1]의 nonlinear recurrence graph를 직접 수치 전개했다는 주장은 없다. N3-04의 정확 항등식은 all-eta 무한 방정식에서 증명하며, 위 유한 chart를 전역 chart로 부르지 않는다."),
         ], "근거: CORE_INTERVAL_EVALUATION; EVALUATED_MIXED_PHI; core/mixed independent receipts"),

        ("07  실제 다섯 모멘트 접합",
         "같은 incoming field의 연속 debt가 허용된 작은 근 상자에 들어간다.", [
            EQ("M, I, J, S, Cp  -  2개의 U bump + 3개의 E bump"),
            T(["검사 대상", "새 B.8", "새 C.2"], [
                ["기본 작은 척도", "mu=h^2", "lambda∈(0,2^-200]"],
                ["실제 용도", "core/continuation → outer", "heat I2 및 modulation I1 복원"],
                ["구간 산술", "88-bit directed; 1024 panels", "88-bit directed; 1024 panels"],
                ["연속 cells", "support당 whole cells 898", "support당 whole cells 898"],
                ["근의 정규화 반경", "10^-6", "10^-6"],
                ["허용 preconditioned debt", "eta 미분 0-2 각각 10^-8", "eta 미분 0-2 각각 10^-8"],
            ], [.3, .35, .35]),
            P("모든 선형 적분, quadratic diagonal, Jacobian, preconditioner 및 작은 근 포함을 연속 영역에서 포위했다. 각 eta의 sampled determinant만 검사한 것이 아니다. C.2의 두 번째 U 행은 divided difference를 쓰며 실제 lambda^-2 정규화 비용을 유지한다."),
            H2("임의의 debt가 아닌 실제 debt"),
            P("B.26/B.34 continuation, 초기 amplitude와 U 복원의 연속 적분 및 eta 미분을 직접 묶었다. mu로 나눈 실제 preconditioned debt가 10^-8보다 작다는 조건을 모든 eta∈[-1,1]에서 충족한다. 180개 scalar·다항식 검사는 이 실제 연속 증명에 붙어 있다."),
            P("부분 적분 구간에서는 같은 원시 모멘트의 변화를 XR가 소거된 stock 식에 넣는다. 작은 mu P*=exp(-16002T)가 positivity와 relaxed cone을 보존한다. 큰 C의 거친 norm bound를 이 작은 perturbation bound 대신 사용하지 않는다."),
            S("C.2 unit-mass bump: beta≤18, |beta'|≤404. B.8은 폭 1/4096의 다른 정규화이며 beta≤9, |beta'|≤4096·128이다. 두 스케일을 혼동했던 값은 수정·기록했다."),
         ], "근거: CONTINUATION_AND_NEW_DEBT; B8/C2 certificates; B8_AND_PRELOOP_GAPS"),

        ("08  전체 source 상계와 gap 하계",
         "실제 도함수 상계와 실제 strictness 전제를 각각 증명했다.", [
            T(["연속 source 영역", "명시한 하한 / 상계"], [
                ["actual mixed jets", "최대 C 지수 29004; 공통 S=C^100000 안에 포함"],
                ["X, E, a 양성", "X≥C^-1; E≥C^-3; a≥C^-122"],
                ["전체 relaxed raw gaps", "a, c-2, c-v, Hq ≥ C^-1000 > S^-1"],
                ["B.8 부분 stock", "Qs>1; 실제 a∈(0.7,0.9); v<1; relaxed gaps>1/2"],
                ["바깥 방향 margin", "min(exp(-16T)/24, 1/(16·2260^2)) > C^-2"],
            ], [.36, .64]),
            H2("영역의 정확한 배치"),
            T(["구간 / 위치", "정확 정의"], [
                ["Xa와 Xc", "Xa=4/Lambda; Xc=XR exp(T+2)"],
                ["J 왼쪽 / I 왼쪽", "Xa exp(t1/16) / Xa exp(t1/8)"],
                ["I 오른쪽", "Xc exp(1)=XR exp(T+3)"],
                ["오른쪽 constant-loop collar", "Xc exp([1/2,1]); v=2+2lambda"],
                ["J 오른쪽", "16 X0(25), 모든 I1 bump 이후"],
                ["예약 patches", "X0(b)=Xc exp(60000T-b), b=25,20,14,8"],
            ], [.36, .64]),
            P("안쪽에서는 y/t1≥1/16에서 실제 activation factor를 포위한다. loop가 시작한 뒤에도 Xa exp(t1/4)까지 v≥2.1이므로 원래 loop는 정확히 상수다. 양쪽 collar에서 A=B=0이 되어 inner flat factorization과 outer 접합을 보존한다."),
            S("잘못된 대안인 I 오른쪽=2XR는 쓰지 않는다. 그 위치는 v≤2가 가능한 첫 transition이어서 원래 C.1 경계 전제를 공급하지 못한다. 현재 geometry와 독립 gap 75/75 검토는 이 점을 반영한다."),
         ], "근거: GLOBAL_SOURCE_DERIVATIVE_BOUNDS; activation/gap proofs; independent source179/gap75"),

        ("09  한 유한 N의 전역 cone",
         "원래 C.1 loop와 C.12 변조를 실제 source에 적용했다.", [
            EQ("S=C<super>100000</super>,   R=exp(S<super>256</super>)"),
            EQ("N=1+ceil(R<super>50</super>),   kappa=R<super>-10</super> &gt; 0"),
            P("원래 C.1의 implicit root, variance의 removable quotient, circle 재매개변수화와 zero-mean primitive를 같은 source에 적용한다. 0이 될 수 있는 분모는 정확한 적분 확장으로 처리하며 표본에서 떨어져 있다는 가정으로 나누지 않는다."),
            T(["C.12에서 구분한 양", "연속 bound / 실제 처리"], [
                ["E/U 값 변화", "factorial C_eta^2 norm에서 ≤4R^2/N"],
                ["radial 미분 변화", "order-one loop shear를 유지; 값 오차처럼 작다고 가정하지 않음"],
                ["실제 preconditioned moment debt", "≤R^14/N; ordinary 2차 미분 변환 factor 2 유지"],
                ["U divided-difference 행", "lambda^-2 비용을 끝까지 유지"],
                ["I1 복원", "같은 C.2 small-root branch; 부분 모멘트와 E+deltaE 분모 포함"],
                ["복원 뒤 네 raw gap", "J 전체에서 ≥1/(2R)"],
            ], [.37, .63]),
            P("복원 support가 끝나면 다섯 모멘트와 장이 정확히 일치한다. 원문 Lemma 4.4에 의해 이후 pressure와 두 stock 성분도 같아지므로 I2 heat 보상과 Ipos/Imean은 유지된다."),
            BOX("전 영역 양화", "J의 연속 cone bound, 보존된 inner collar, 변화 없는 외곽, terminal collar와 양끝 방향 극한을 결합해 같은 kappa=R^-10을 쓴다. 샘플 개수를 늘려 얻은 margin이 아니다."),
            S("한 N을 고정한 이후 모든 필요한 고정 차수 미분은 유한하다. N→∞일 때 모든 radial 미분이 균일하게 작다는 주장을 하지 않는다."),
         ], "근거: QUANTITATIVE_LOOP_SELECTION; LOOP_DERIVATIVE_ENVELOPE; C12_FREQUENCY_CONTRACT"),

        ("10  최종 stress와 끝점",
         "모든 보정 뒤 같은 최종 장으로 계산한 T0의 정확한 지지와 하한이다.", [
            EQ("T0=0  (X≤Xa 또는 X≥Xb)"),
            EQ("|T0| ≥ min(C<super>-11</super>,R<super>-8</super>) zeta &gt; 0  (Xa&lt;X&lt;Xb)"),
            EQ("zeta = exp[-t1<super>2</super>/log<super>2</super>(X/Xa) - 4/log<super>2</super>(Xb/X)]"),
            T(["같은 최종 장의 영역", "stress lower bound"], [
                ["inner activation/flat collar", "C^-11 · zeta"],
                ["J, 변조와 I1 복원 전체", "R^-8 · zeta"],
                ["J 이후 보존 외곽", "C^-8 · zeta"],
                ["terminal 중간", "C^-4 · zeta"],
                ["마지막 outer flat collar", "C^-10 · zeta"],
            ], [.62, .38]),
            H2("0/0을 계산하지 않는 방향 극한"),
            P("안쪽은 T0=e_a B0이고 B0는 끝점에서 매끄럽고 0이 아니다. n의 극한은 실제 shear 방향과 평행하다. 이 collar에서 C.12 primitive가 정확히 0이므로 factorization은 보정 전뿐 아니라 최종 장에도 적용된다."),
            EQ("T0,theta=e<super>-4/delta²</super> delta<super>-3</super> b_theta<br/>T0,z=e<super>-4/delta²</super> delta<super>3</super> b_z"),
            P("바깥쪽에서 b_theta의 양의 하한과 두 smooth coefficient가 n의 극한 (1,0)을 준다. 지수 flat factor의 고정 차수 미분에 생기는 유한 inverse power도 제어한다. Ipos와 Imean은 모든 correction 이후에도 원래 power law다."),
            S("stress의 전방 pressure는 같은 Pi0에서 시작하며, 모든 정확한 모멘트 보존을 통해 무한대에서 정규화한 후방 pressure와 일치한다."),
         ], "근거: 원문 Theorem 4.6 pp.32-34, A.8-A.10; GLOBAL_STRESS_ASSEMBLY; heat proof"),

        ("11  원문 Lean 실행과 Comparator",
         "빌드 성공과 보호된 독립 검사의 최종 성공을 구분한다.", [
            BOX("N1-05: 원래 전체 기본 빌드 실제 성공", "2026-10-09 20:59:06.787843 UTC, exit 0.<br/>전체 로그: Build completed successfully (11424 jobs)."),
            T(["보존 / 재검토한 대상", "실제 결과"], [
                ["원래 source commit", "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"],
                ["원래 toolchain", "Lean 4.34.0-rc2; 선택된 lockfile과 kernel 고정"],
                ["실제 tracked source", "2669개 파일이 독립 GitHub hash dictionary와 일치"],
                ["전체 default-target inventory", "NavierStokes 817; Euler 1840; ComparatorChallenges 2"],
                ["새 portable / runtime 감사", "22/22 / 36/36; portable에 별도 원래 artifact43/43 포함"],
            ], [.38, .62]),
            H2("N1-06: 보호 실행의 실제 관측"),
            P("관측 시각: " + escape(observation_time) + ". run 37979127351의 Comparator job 113984853927은 <b>in_progress / conclusion null</b>이다. '모든 보호 조건을 유지한 원문 검증' 단계가 진행 중이며 최종 Comparator artifact는 없다. 수정 run 37992645347에도 이 관측에서 job이 할당되지 않았다."),
            P("필요한 최종 결과는 원래 격리·채널 조건, mandatory nanoda, 실제 Comparator/kernel outcome, 제출 C/D의 axiom 검사와 before/after 소스·커널 보존을 함께 담아야 한다. 기존 #print axioms 및 일반 Lean 빌드만으로 이 검사를 대체할 수 없다."),
            S("과거 GitHub default-build wrapper job 실패는 실패로 남긴다. 그 하위 원문 cache/build 명령이 각각 exit 0인 사실은 별도로 보존한다. 이 보고서는 완료한 빌드를 새로 처음부터 수행했다고 쓰지 않는다."),
         ], "근거: handoff pp.1,4; n105-portable/runtime audits; saved GitHub observation"),

        ("12  실제 Lean·유한 jet 연결 완료",
         "원래 N3-03의 여섯 연결 조건을 실제 입력으로 충족했다.", [
            S("13개 fresh source의 컴파일 후 같은 prefix에 1개를 추가했다. 아래 6개 묶음은 총 14개 모듈, 110개 감사 선언이다. 정리 수나 전체 형식화율로 환산하지 않는다."),
            T(["구성", "실제 결과", "증명한 부분", "실제 대상"], formal_rows,
              [.17, .13, .47, .23]),
            P("모든 actual compile이 원래 rc2에서 exit 0이고, 각 선언의 공리는 propext·Classical.choice·Quot.sound뿐이다. 원문 2669개 파일과 커널은 그대로다. extension이 앞의 13개를 다시 컴파일했다고 쓰지 않는다."),
            BOX("실제 입력에서 실제 배열까지", "343/343 독립 import 감사는 모든 custom object의 실제 fresh 경로·SHA를 확인했다. 812/812 consumer는 실제 125개 배열과 양방향 tail·rounding을 연결했고, 별도 883/883 검토가 원래 criterion·f0·실제 Phi&gt;1/4까지 확인했다."),
            P("f0는 정확 40개 유리수 항과 alternating tail로 다시 포위했다. 비교함수의 cubic 하한은 305719/1152000이고 nonlinear 오차는 2^-100 미만이므로 실제 Phi&gt;1/4이다. 실제 pressure·operator·amplitude 전제를 가정으로 남기지 않았다."),
            S("N3-03 connection complete=true. 125개 numeric row 전부를 kernel 재평가했다는 주장과 최종 외곽·stress 전체 Lean 형식화 주장은 false다. 전역 연속 증명의 별도 범위를 유지한다."),
         ], "근거: fresh13+extension1; actual mixed812; imports343; independent final connection883"),

        ("13  보존한 실패와 출처",
         "실패 이력을 숨기지 않고 어떤 입력이 채택되었는지 명확히 남겼다.", [
            T(["보존한 기록", "현재 처리"], [
                ["원래 보호 환경 systemd/DBus 실패", "격리 설정을 제거하지 않음; 적절한 실제 보호 실행의 최종 결과를 기다림"],
                ["이전 default-build 중단/진행 snapshot", "완료 receipt와 구분해 그대로 보존"],
                ["GitHub audit wrapper 실패", "job failure 유지; 하위 원문 명령 exit와 분리"],
                ["pressure prefix 0001", "flat collar multiplier 점 처리 문제로 거부; 0002 사용"],
                ["C.2 bump scaling 수정", "unit-mass beta≤18, |beta'|≤404로 실제 폭 반영"],
                ["과거 후보·small-N cone 실패", "같은 새 profile의 연속 margin으로 대체; 과거 실패 삭제 없음"],
                ["canonical/new pressure 혼동 위험", "canonicalTail을 새 datum으로 승격하지 않고 새 schedule을 별도 정의"],
            ], [.43, .57]),
            H2("이 보고서가 의존하는 문서"),
            P("[B] MathScope Research IDE Blueprint v1: 원래 N1 기준 p.52, N3 목표 p.55, 세부 항목 p.56, 수치 계약 p.78, 무한 급수·norm·tail 구분 p.81."),
            P("[H] 2026-10-10 인수인계: 기존 결론 p.1, 원래 9조건 p.4, 같은 입력부터 최종 stress까지의 실행 순서 p.10, 실패·검사 결과 해석 p.13."),
            P("[P] 제공된 166쪽 원문: Theorem 4.6 pp.32-34, moment 보존 Lemma 4.4, Appendices A/B/C. 새 exact field는 이 범위의 leading profile이다."),
            S("모든 입력의 전체 SHA 및 original criterionText는 날짜별 gate JSON과 one-profile-0002 안에 있다. 반올림된 십진 표시값, 그림, 체크 개수 또는 편집된 요약이 원래 proof/evidence 파일을 대신하지 않는다."),
         ], "근거: original gate JSON; handoff pp.10,13; retained attempts and source manifests"),

        ("14  핵심 해시와 재현 경로",
         "원문·선택된 파라미터·증거·해석 수준을 함께 전달한다.", [
            S("원문 PDF SHA-256"),
            CODE(assembly["sourcePaperSHA256"]),
            S("설계도 PDF SHA-256"),
            CODE(assessment["blueprintPDF"]["sha256"]),
            S("인수인계 PDF SHA-256"),
            CODE(assessment["handoffPDF"]["sha256"]),
            S("정확 매개변수 / profile evidence SHA-256"),
            CODE(paramsha + "\n" + profile_sha),
            S("새 69/1 판정 / 최종 formal 연결 독립 감사 SHA-256"),
            CODE(formal["assessment"]["receiptSHA256"] + "\n" +
                 formal["receipts"]["independentFinalConnection"]["receiptSHA256"]),
            H2("재현 순서"),
            P("저장소 research-ide에서 실행한다. 아래 $N은 shell용 보조 경로이며 모든 receipt는 새 output 경로로 작성한다. 기존 성공·실패 파일을 덮어쓰지 않는다."),
            CODE("N=mathscope-m1/navier\nA=$N/followup-20261010-final-stress-audit\nG=$N/followup-20261010-symbolic-gluing\npython -B \"$A/check_one_profile_assembly_review.py\" \\\n  --assembly \"$G/attempts/one-profile-0002/receipt.json\" \\\n  --output /tmp/new-independent-review/receipt.json"),
            CODE("python -B \"$A/report/build_report.py\" \\\n  --font-dir /path/to/NanumGothic \\\n  --formal-progress \"$A/report/formal_progress.json\" \\\n  --output /tmp/MathScope_Followup_KO.pdf"),
            P("개별 continuous operator·axis·source·N1 검증 명령과 출력 경로는 각 디렉터리의 README 및 producer에 있다. 원문 전체 빌드나 오랜 continuous quadrature를 이유 없이 재실행할 필요는 없다. 결합 해시가 다르면 먼저 어느 입력이 바뀌었는지 확인한다."),
            BOX("남은 완료 조건", "N1-06 보호 Comparator의 실제 최종 결과와 mandatory nanoda·보호 설정·원문 보존을 담은 artifact가 남아 있다. 새 N3-03 완료와 역사적 68/2 보존은 별도 새 판정에 기록했다."),
            S(publication),
         ], "재현 producer: final-stress-audit/report/build_report.py; 전체 입력은 build manifest 참조"),
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--font-dir", required=True, type=Path)
    parser.add_argument("--formal-progress", type=Path, default=HERE / "formal_progress.json")
    parser.add_argument("--assessment", type=Path,
                        default=AUDIT / "ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json")
    parser.add_argument("--observation", type=Path, default=N1 / "github-observation-013.json")
    parser.add_argument("--publication-url")
    args = parser.parse_args()
    for file, name in [("NanumGothic-Regular.ttf", "Nanum"),
                       ("NanumGothic-Bold.ttf", "NanumBold")]:
        path = args.font_dir / file
        pdfmetrics.registerFont(TTFont(name, str(path)))
        INPUTS[str(path.resolve())] = sha(path)
    pdfmetrics.registerFontFamily("Nanum", normal="Nanum", bold="NanumBold",
                                 italic="Nanum", boldItalic="NanumBold")
    rl_config.warnOnMissingFontGlyphs = 1
    assessment = load(args.assessment)
    assembly = load(GLUE / "attempts/one-profile-0002/receipt.json")
    review = load(AUDIT / "assembly-review/0001/receipt.json")
    prefix = load(GLUE / "attempts/pressure-prefix-0002/receipt.json")
    core = load(GLUE / "attempts/core-intervals-0002/receipt.json")
    mixed = load(AXIS / "evaluated-phi-mixed-comparison.json")
    formal = load(args.formal_progress)
    observation = load(args.observation)
    assert sha(GLUE / "attempts/one-profile-0002/receipt.json") == assessment["assemblyReceipt"]["sha256"] == review["assemblyReceiptSHA256"]
    assert sha(AUDIT / "assembly-review/0001/receipt.json") == assessment["independentAssemblyReview"]["sha256"]
    for role, path in [("pressurePrefix", GLUE / "attempts/pressure-prefix-0002/receipt.json"),
                       ("core", GLUE / "attempts/core-intervals-0002/receipt.json"),
                       ("mixedPhi", AXIS / "evaluated-phi-mixed-comparison.json")]:
        assert sha(path) == assembly["acceptedEvidence"][role]["sha256"]
    assert assessment["remainingGateIds"] == ["N1-06"]
    assert assessment["separateDatedDeltaCounts"] == {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0, "total": 70}
    assert assessment["actualN303FormalAndFiniteConnectionComplete"] is True
    assert assembly["passed"] == assembly["total"] == 292
    assert review["passed"] == review["total"] == 295
    assert Fraction(prefix["pressureCoefficient"]["width"]) < Fraction(1, 2**279)
    assert formal["schema"] == "MathScope.KoreanReportFormalProgress/2"
    assert formal["fullOriginalN303Completion"] is True
    assert formal["fullAnalyticInputProducerCompleted"] is True
    assert formal["entireFinalProfileLeanFormalized"] is False
    assert formal["all125NumericalRowsReevaluatedByLeanKernel"] is False
    assert sha(args.assessment) == formal["assessment"]["receiptSHA256"]
    recorded = {}
    for role, reference in formal["receipts"].items():
        path = REPO / reference["receiptPath"]
        item = load(path)
        assert sha(path) == reference["receiptSHA256"]
        assert item["status"] == "PASS"
        recorded[role] = item
    fresh, extension = recorded["freshPrefix"], recorded["freshExtension"]
    assert fresh["moduleCount"] == 13 and fresh["initialCustomOleanCount"] == 0
    assert fresh["existingCustomObjectsImported"] is False
    assert extension["freshPrefixReceiptSHA256"] == formal["receipts"]["freshPrefix"]["receiptSHA256"]
    assert extension["previousComponentAttemptObjectsImported"] is False
    assert extension["combinedAuditedDeclarationCount"] == 110
    kernel_sha = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
    for item in (fresh, extension):
        assert item["originalTrackedFilesPreserved"] is True
        assert item["originalTrackedFileCount"] == 2669
        assert item["kernelSHA256Before"] == item["kernelSHA256After"] == kernel_sha
    modules = fresh["modules"] + [extension]
    assert len(modules) == len(formal["compiledModules"]) == 14
    total = 0
    for module, pin in zip(modules, formal["compiledModules"]):
        assert module["module"] == pin["module"]
        assert module["status"] == "PASS" and module["exitCode"] == 0
        assert len(module["printedAxioms"]) == pin["auditedDeclarations"]
        total += len(module["printedAxioms"])
        assert all(set(value) <= {"propext", "Classical.choice", "Quot.sound"}
                   for value in module["printedAxioms"].values())
        source = Path(module["command"][-1])
        for path, key in ((source, "sourceSHA256"), (source.with_suffix(".olean"), "oleanSHA256"),
                          (source.with_suffix(".log"), "logSHA256")):
            assert sha(path) == module[key] == pin[key]
            INPUTS[str(path)] = sha(path)
        log_text = source.with_suffix(".log").read_text()
        assert "sorryAx" not in log_text and ": error:" not in log_text
    assert total == formal["auditedDeclarations"] == 110
    groups = [name for part in formal["parts"] for name in part["modules"]]
    assert len(groups) == len(set(groups)) == 14
    assert set(groups) == {m["module"] for m in modules}
    for part in formal["parts"]:
        count = sum(len(m["printedAxioms"]) for m in modules if m["module"] in part["modules"])
        assert part["auditedDeclarations"] == count
        assert part["resultLabel"] == "PASS\n" + str(count) + "개"
    imports, binding, final = (recorded[k] for k in ("independentImports", "actualMixedArray", "independentFinalConnection"))
    assert imports["checksPassed"] == imports["checksTotal"] == 343
    assert imports["allModuleObjectsResolvedFromFreshOutputs"] is True
    assert binding["passed"] == binding["total"] == 812
    assert binding["actualNumericalRoundingPremisesResolved"] is True
    assert binding["actualChart"] == formal["actualMixedChart"]
    assert final["passed"] == final["total"] == 883
    assert final["originalN303ConditionsSatisfied"] is True
    assert final["exactParameterExpressionSHA256"] == assembly["parameterExpressionSHA256"]
    assert formal["receipts"]["independentFinalConnection"]["receiptSHA256"] == assessment["formalCompletionReview"]["sha256"]
    for label, value in final["inputsSHA256"].items():
        path = Path(label)
        path = path if path.is_absolute() else REPO / path
        assert sha(path) == value, label
        INPUTS[str(path.resolve())] = value
    jobs = [j for entry in observation["results"]
            for j in entry.get("structuredContent", {}).get("jobs", [])]
    job = next(j for j in jobs if j["id"] == 113984853927)
    assert job["status"] == "in_progress" and job["conclusion"] is None
    args.output.parent.mkdir(parents=True, exist_ok=True)
    report = Report(args.output, make_styles())
    pages = build_pages((assessment, assembly, review, prefix, core, mixed, formal, observation),
                       args.publication_url)
    for page in pages:
        report.page(*page)
    report.save()
    from pypdf import PdfReader
    reader = PdfReader(args.output)
    assert len(reader.pages) == 15
    text = "\n".join(page.extract_text() for page in reader.pages)
    assert "\x00" not in text, "A missing Korean-font glyph was emitted"
    for required in ["69 PASS", "295/295", "384-bit", "N3-03", "3.314622730014332",
                     "in_progress", "883/883", "2^-118", "2^-90"]:
        assert required in text, required
    INPUTS[str(Path(__file__).resolve())] = sha(Path(__file__))
    manifest = {
        "schema": "MathScope.KoreanFollowupReportBuild/1",
        "builtUTC": datetime.now(timezone.utc).isoformat(),
        "output": str(args.output.resolve()),
        "outputSHA256": sha(args.output),
        "pages": len(reader.pages),
        "lowestBodyYPerPagePoints": report.lowest,
        "bodyBottomLimitPoints": BOTTOM,
        "allBodyContentAboveFooter": all(y >= BOTTOM for y in report.lowest),
        "formalProgressSource": str(args.formal_progress),
        "assessmentSource": str(args.assessment),
        "comparatorObservationUTC": observation["receivedUTC"],
        "formalCompletionClaimed": False,
        "actualN303ConnectionComplete": True,
        "entireFinalProfileLeanFormalized": False,
        "freshPrefixModules": 13, "freshExtensionModules": 1, "auditedDeclarations": 110,
        "publicationURL": args.publication_url,
        "inputsSHA256": INPUTS,
        "renderedVisualReviewRequired": True,
    }
    manifest_path = args.output.with_suffix(".build.json")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pdf": str(args.output), "pages": 15, "sha256": sha(args.output),
                      "buildManifest": str(manifest_path), "lowestY": min(report.lowest)},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
