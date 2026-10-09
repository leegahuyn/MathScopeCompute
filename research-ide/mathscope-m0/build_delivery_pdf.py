from pathlib import Path
import re, html, hashlib, json
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fontTools.ttLib import TTFont as FontToolsFont

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'mathscope-m0/docs/M0_Delivery_Report_KO.md'
OUTPUT=ROOT/'output/pdf/MathScope_M0_Implementation_Checklist_KO.pdf'
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
FONT=ROOT/'tmp/pdfs/fonts'
pdfmetrics.registerFont(TTFont('Nanum',str(FONT/'NanumGothic-Regular.ttf')))
pdfmetrics.registerFont(TTFont('NanumBold',str(FONT/'NanumGothic-Bold.ttf')))
pdfmetrics.registerFontFamily('Nanum',normal='Nanum',bold='NanumBold',italic='Nanum',boldItalic='NanumBold')
pdfmetrics.registerFont(TTFont('Fallback','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('Mono','/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
CMAP=FontToolsFont(str(FONT/'NanumGothic-Regular.ttf')).getBestCmap()
INK=colors.HexColor('#172b40');TEAL=colors.HexColor('#087d87');MUTED=colors.HexColor('#526274');LINE=colors.HexColor('#d8e2e9')
styles={
 'body':ParagraphStyle('body',fontName='Nanum',fontSize=9.2,leading=13.7,textColor=INK,spaceAfter=7,wordWrap='CJK',splitLongWords=1),
 'h1':ParagraphStyle('h1',fontName='NanumBold',fontSize=23,leading=30,textColor=INK,spaceAfter=15,wordWrap='CJK'),
 'h2':ParagraphStyle('h2',fontName='NanumBold',fontSize=15.7,leading=23,textColor=TEAL,spaceBefore=1,spaceAfter=12,wordWrap='CJK'),
 'h3':ParagraphStyle('h3',fontName='NanumBold',fontSize=10.7,leading=16,textColor=INK,spaceBefore=8,spaceAfter=6,wordWrap='CJK'),
 'cell':ParagraphStyle('cell',fontName='Nanum',fontSize=8.45,leading=12.2,textColor=INK,wordWrap='CJK',splitLongWords=1),
 'head':ParagraphStyle('head',fontName='NanumBold',fontSize=8.6,leading=12.5,textColor=colors.white,wordWrap='CJK',splitLongWords=1),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=8.1,leading=12,textColor=INK,spaceAfter=8,backColor=colors.HexColor('#eef3f6'),borderPadding=7,splitLongWords=1),
 'bullet':ParagraphStyle('bullet',fontName='Nanum',fontSize=9.2,leading=13.7,textColor=INK,spaceAfter=6,wordWrap='CJK',leftIndent=12,firstLineIndent=-9,splitLongWords=1),
}

def escape(text):
    text=text.replace('\u2011','-').replace('–','-').replace('—','-')
    result=[]
    for c in text:
        e=html.escape(c,quote=False)
        result.append(e if ord(c) in CMAP or c in '\n\t' else '<font name="Fallback">'+e+'</font>')
    return ''.join(result)

def inline(text):
    # Protect links, then apply simple report-specific inline formatting.
    stash=[]
    def link(m):
        stash.append('<link href="'+html.escape(m[2],quote=True)+'" color="#087d87">'+escape(m[1])+'</link>')
        return 'ZZLINKTOKEN'+str(len(stash)-1)+'ZZ'
    text=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,text)
    text=escape(text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
    text=re.sub(r'`([^`]+)`',r'<font name="Mono">\1</font>',text)
    for i,value in enumerate(stash):text=text.replace('ZZLINKTOKEN'+str(i)+'ZZ',value)
    return text

class ReportDoc(SimpleDocTemplate):
    def afterFlowable(self,flowable):
        if isinstance(flowable,Paragraph) and flowable.style.name=='h2':
            title=flowable.getPlainText();key='section-'+str(self.page)
            self.canv.bookmarkPage(key);self.canv.addOutlineEntry(title,key,level=0)

class NumberedCanvas(canvas.Canvas):
    def __init__(self,*a,**kw):super().__init__(*a,**kw);self.saved=[]
    def showPage(self):self.saved.append(dict(self.__dict__));self._startPage()
    def save(self):
        count=len(self.saved)
        for state in self.saved:
            self.__dict__.update(state);self.decorate(count);super().showPage()
        super().save()
    def decorate(self,total):
        w,h=A4;self.setStrokeColor(LINE);self.setLineWidth(.5);self.line(42,h-34,w-42,h-34);self.line(42,37,w-42,37)
        self.setFont('NanumBold',7.5);self.setFillColor(TEAL);self.drawString(42,h-25,'MATHSCOPE  /  RESEARCH FOUNDATION M0')
        self.setFont('Nanum',7.2);self.setFillColor(MUTED);self.drawString(42,25,'구현·검증 보고서  |  2026-10-09  |  version 44')
        self.drawRightString(w-42,25,f'{self._pageNumber} / {total}')

def table(rows,width):
    count=len(rows[0]);header=rows[0]
    if count==2:widths=[width*.30,width*.70]
    elif any('항목' in c for c in header):widths=[width*.29,width*.16,width*.55]
    elif '정리' in header:widths=[width*.35,width*.47,width*.18]
    elif '검사 묶음' in header:widths=[width*.28,width*.24,width*.48]
    else:widths=[width*.25,width*.31,width*.44]
    data=[]
    for i,row in enumerate(rows):
        cells=[]
        for j,c in enumerate(row):
            value=inline(c)
            if j==0 and c.startswith('Conditional.selected_'):value=value.replace('Conditional.','Conditional.<br/>',1)
            if j==0 and 'I3-08' in c:value=value.replace('교육용 설명과 전문가 감사 동기화','교육용 설명과<br/>전문가 감사 동기화')
            cells.append(Paragraph(value,styles['head'] if i==0 else styles['cell']))
        data.append(cells)
    obj=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    commands=[('BACKGROUND',(0,0),(-1,0),INK),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),.7,TEAL),('LINEBELOW',(0,1),(-1,-1),.4,LINE)]
    for i,row in enumerate(rows[1:],1):
        if i%2==0:commands.append(('BACKGROUND',(0,i),(-1,i),colors.HexColor('#f4f7fa')))
        if any('일부 / 후속 도메인' in c for c in row):commands.append(('BACKGROUND',(1,i),(1,i),colors.HexColor('#fff1d7')))
    obj.setStyle(TableStyle(commands));return obj

def parse(source):
    flow=[];width=A4[0]-84
    for block_no,block in enumerate(source.split('<!-- PAGEBREAK -->')):
        if block_no:flow.append(PageBreak())
        lines=block.strip().splitlines();i=0
        while i<len(lines):
            line=lines[i].strip()
            if not line:i+=1;continue
            if line.startswith('|'):
                rows=[]
                while i<len(lines) and lines[i].strip().startswith('|'):
                    row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                    if not all(re.fullmatch(r':?-+:?',c or ' ') for c in row):rows.append(row)
                    i+=1
                flow.extend([table(rows,width),Spacer(1,10)]);continue
            if line.startswith('```'):
                code=[];i+=1
                while i<len(lines) and not lines[i].strip().startswith('```'):code.append(lines[i]);i+=1
                flow.append(Paragraph('<br/>'.join(html.escape(s) for s in code),styles['code']));i+=1;continue
            match=re.match(r'^(#{1,3})\s+(.+)',line)
            if match:flow.append(Paragraph(inline(match[2]),styles['h'+str(len(match[1]))]));i+=1;continue
            if line.startswith('- '):flow.append(Paragraph('• '+inline(line[2:]),styles['bullet']));i+=1;continue
            if re.match(r'^\d+\. ',line):flow.append(Paragraph(inline(line),styles['bullet']));i+=1;continue
            paragraph=[line];i+=1
            while i<len(lines) and lines[i].strip() and not re.match(r'^(\||#|```|- |\d+\. )',lines[i].strip()):paragraph.append(lines[i].strip());i+=1
            flow.append(Paragraph(inline(' '.join(paragraph)),styles['body']))
    return flow

source=SOURCE.read_text()
assert '{{' not in source
doc=ReportDoc(str(OUTPUT),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=48,bottomMargin=49,title='MathScope M0 구현·검증 체크리스트',author='MathScope · 이가현',subject='M0 실제 구현 범위, 단계별 체크리스트 및 검증 기록',allowSplitting=1)
doc.build(parse(source),canvasmaker=NumberedCanvas)
print(json.dumps({'pdf':str(OUTPUT),'bytes':OUTPUT.stat().st_size,'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest()},ensure_ascii=False))
