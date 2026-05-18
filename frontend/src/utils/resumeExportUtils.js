import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export const exportToDocx = async (data) => {
  const { personalInfo: info, experiences, education, skills, achievements } = data;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: info.name, bold: true, size: 32 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `${info.title} | ${info.email} | ${info.phone}`, size: 20 }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),

        // Summary
        ...(info.summary ? [
          new Paragraph({ text: "SUMMARY", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: info.summary, spacing: { after: 200 } }),
        ] : []),

        // Experience
        new Paragraph({ text: "EXPERIENCE", heading: HeadingLevel.HEADING_1 }),
        ...experiences.flatMap(exp => [
          new Paragraph({
            children: [
              new TextRun({ text: exp.title, bold: true }),
              new TextRun({ text: ` at ${exp.company}`, bold: true }),
              new TextRun({ text: `\t${exp.period}`, bold: false }),
            ],
          }),
          new Paragraph({ text: exp.desc, spacing: { after: 150 } }),
        ]),

        // Education
        new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_1 }),
        ...education.flatMap(edu => [
          new Paragraph({
            children: [
              new TextRun({ text: edu.institution, bold: true }),
              new TextRun({ text: `\t${edu.year}`, bold: false }),
            ],
          }),
          new Paragraph({ text: edu.degree, spacing: { after: 150 } }),
        ]),

        // Skills
        new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: skills.join(", "), spacing: { after: 150 } }),

        // Achievements
        ...(achievements && achievements.length > 0 ? [
          new Paragraph({ text: "ACHIEVEMENTS", heading: HeadingLevel.HEADING_1 }),
          ...achievements.map(ach => new Paragraph({ text: `• ${ach}`, bullet: { level: 0 } })),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${info.name.replace(/\s+/g, '_')}_Resume.docx`);
};
