const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = require('docx');

// Test the margins fix
function testMargins() {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Test", bold: true, size: 22 })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: {
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0
                    }
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    console.log("✅ Margins test passed - no errors with margin values as numbers");
    return true;
  } catch (error) {
    console.error("❌ Margins test failed:", error.message);
    return false;
  }
}

// Test the old margins format that was causing the error
function testOldMargins() {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Test", bold: true, size: 22 })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: {
                      top: { size: 0 },
                      bottom: { size: 0 },
                      left: { size: 0 },
                      right: { size: 0 }
                    }
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    console.log("❌ Old margins test should have failed but didn't");
    return false;
  } catch (error) {
    console.log("✅ Old margins test correctly failed with error:", error.message);
    return true;
  }
}

console.log("Testing Word export margins fix...");
console.log("");

const test1 = testMargins();
const test2 = testOldMargins();

console.log("");
if (test1 && test2) {
  console.log("🎉 All tests passed! The margins fix should work correctly.");
} else {
  console.log("⚠️ Some tests failed. Please check the implementation.");
}
