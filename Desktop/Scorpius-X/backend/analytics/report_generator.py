
from fpdf import FPDF

def generate(findings, filename="report.pdf"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Scorpius Security Report", ln=1, align='C')
    for f in findings:
        pdf.multi_cell(0, 10, txt=f"{f.title} ({f.severity})\n{f.description}")
    pdf.output(filename)
    return filename
