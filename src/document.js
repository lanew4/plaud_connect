const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

function parseAnalysis(text) {
  return text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return new Paragraph({});

    if (/^\d+\.\s+[A-Z ]+$/.test(trimmed)) {
      return new Paragraph({
        text: trimmed,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      });
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return new Paragraph({
        children: [new TextRun({ text: trimmed.slice(2), size: 24 })],
        bullet: { level: 0 },
        spacing: { after: 60 },
      });
    }

    return new Paragraph({
      children: [new TextRun({ text: trimmed, size: 24 })],
      spacing: { after: 80 },
    });
  });
}

async function createWordDoc(summaries, analysis) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLabel = weekAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Weekly Meeting Thread Analysis', bold: true, size: 40 })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `${weekLabel} – ${dateLabel}`, size: 24, color: '666666' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: `Meetings Analyzed (${summaries.length})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
          ...summaries.map(
            (s) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${s.name}`, bold: true, size: 24 }),
                  new TextRun({ text: `  —  ${s.date}`, size: 22, color: '888888' }),
                ],
                bullet: { level: 0 },
                spacing: { after: 60 },
              })
          ),

          new Paragraph({
            text: 'Analysis',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...parseAnalysis(analysis),
        ],
      },
    ],
  });

  const filename = `plaud_threads_${now.toISOString().slice(0, 10)}.docx`;
  const outPath = path.join(process.cwd(), filename);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

module.exports = { createWordDoc };
