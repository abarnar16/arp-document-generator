const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// === ROUTE 1: Generate INVOICE PDF ===
app.post("/generate-invoice", (req, res) => {
  const { items, toName, doNumber, poNumber, invoiceNumber, jobName, grandTotal } = req.body;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });


  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice_${invoiceNumber || "no-num"}.pdf`
  );
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  // === HEADER ===
  const shorter = doc.page.width * 0.3;
  const longer = doc.page.width - shorter;
  const height1 = 30;
  const height2 = 45;
  const radius = 15;

  doc.rect(0, 0, longer, height1).fill("#889e3e");
  doc.moveTo(longer, 0)
    .lineTo(longer + longer, 0)
    .lineTo(longer + longer, height2)
    .lineTo(longer + radius, height2)
    .lineTo(longer, height2 - radius)
    .lineTo(longer, 0)
    .closePath()
    .fill("#889e3e");

  doc.image("frontend/images/navbar_logo.png", 38, 30, { width: 95 });

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#8B0000')
    .text("ARP ENGINEERING PTE. LTD.", { align: "center" });

const marginTop = 1;
const pageWidth = doc.page.width;

doc.image("frontend/images/bizsafe.png", pageWidth - 80 - 10, marginTop, {
  width: 80



});
const imageWidth = 80;
const xRight = doc.page.width - imageWidth - 20; // 38 is your current left margin, reused as right margin
doc.image("frontend/images/bqc_cert.png", xRight, 50, { width: imageWidth });


  doc.fillColor("black").fontSize(10).font('Helvetica')
    .text("No.5, Soon Lee Street, Pioneer Point, #05-60, Singapore - 627 607", { align: "center" })
    .text("Tel & Fax: 62535529  Mobile: +65 9239 7825", { align: "center" })
    .text("E-mail: arp.engg@yahoo.com.sg", { align: "center" })
    .text("- Co. Regn.No : 201822438E", { align: "center" });

  doc.moveDown(0.6).strokeColor('black').lineWidth(1).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();

  // === CUSTOMER INFO ===
  doc.font("Helvetica");
  doc.fontSize(10).text("TO:", 50, 150);
  doc.text(toName || "N/A", 80, 150, { width: 300, lineBreak: true });


let jobStartY = doc.y + 10;

if (jobName) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000080");
  doc.text(jobName, 50, jobStartY, { width: 300 });
  doc.fillColor("black"); // Reset to default
  jobStartY = doc.y + 5;
}


  const rightStartX = 400;
  doc.text("Date: " + new Date().toLocaleDateString(), rightStartX, 150)
      .text("Invoice No.: " + (invoiceNumber || "N/A"), rightStartX)
          .text("PO No.: " + (poNumber || "N/A"), rightStartX)
    .text("DO No.: " + (doNumber || "N/A"), rightStartX)
;

  // === TABLE ===
  const tableTop = 230;
  const itemX = 50;
  const descX = 90;
  const qtyX = 320;
  const unitX = 390;
  const totalX = 480;
  const tableRight = 550;
  const rowHeight = 20;
  const fixedTableHeight = doc.page.height * 0.55;

  doc.rect(itemX, tableTop, tableRight - itemX, fixedTableHeight).stroke();
  doc.moveTo(descX, tableTop).lineTo(descX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(qtyX, tableTop).lineTo(qtyX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(unitX, tableTop).lineTo(unitX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(totalX, tableTop).lineTo(totalX, tableTop + fixedTableHeight).stroke();

  doc.moveTo(itemX, tableTop + rowHeight).lineTo(tableRight, tableTop + rowHeight).stroke();
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text("Sl. No", itemX + 5, tableTop + 5);
  doc.text("Description", descX + 5, tableTop + 5);
  doc.text("Qty", qtyX + 5, tableTop + 5);
  doc.text("Unit Price (S$)", unitX + 5, tableTop + 5);
  doc.text("Total (S$)", totalX + 5, tableTop + 5);

  let y = tableTop + rowHeight;
  doc.font('Helvetica');

  items.forEach((item, index) => {
    const { name, unitPrice, quantity, total } = item;
    const options = { width: qtyX - descX - 10, align: 'left' };
    const descHeight = doc.heightOfString(name, options);
    const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

    if (y + effectiveRowHeight > tableTop + fixedTableHeight - rowHeight) return;

    doc.text(index + 1, itemX + 5, y + 5);
    doc.text(name, descX + 5, y + 5, options);
    doc.text(quantity, qtyX + 5, y + 5);
    doc.text(unitPrice.toFixed(2), unitX + 5, y + 5);
    doc.text(total.toFixed(2), totalX + 5, y + 5);
    y += effectiveRowHeight;
  });

  const grandTotalRowY = tableTop + fixedTableHeight - rowHeight;
  doc.moveTo(itemX, grandTotalRowY).lineTo(tableRight, grandTotalRowY).stroke();
  doc.rect(itemX, grandTotalRowY, tableRight - itemX, rowHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(grandTotal.toFixed(2), totalX + 5, grandTotalRowY + 5);

  // === FOOTER ===
  const footerY = tableTop + fixedTableHeight + 30;
  doc.lineTo(550, footerY - 10).stroke();

  doc.fontSize(10).font('Helvetica')
    .text("For ARP Engineering Pte. Ltd", 380, footerY + 10);

  doc.end();
});




// === ROUTE 2: Generate DO/PO-Style PDF ===
app.post("/generate-do", (req, res) => {
  const { items, toName, doNumber, poNumber, jobName } = req.body;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });


  res.setHeader("Content-Disposition", "attachment; filename=delivery.pdf");
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  // Same header
  const shorter = doc.page.width * 0.3;
  const longer = doc.page.width - shorter;
  const height1 = 30;
  const height2 = 45;
  const radius = 15;

  doc.rect(0, 0, longer, height1).fill("#889e3e");
  doc.moveTo(longer, 0)
    .lineTo(longer + longer, 0)
    .lineTo(longer + longer, height2)
    .lineTo(longer + radius, height2)
    .lineTo(longer, height2 - radius)
    .lineTo(longer, 0)
    .closePath()
    .fill("#889e3e");

  doc.image("frontend/images/navbar_logo.png", 38, 30, { width: 95 });

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#8B0000')
    .text("ARP ENGINEERING PTE. LTD.", { align: "center" });

const marginTop = 1;
const pageWidth = doc.page.width;

doc.image("frontend/images/bizsafe.png", pageWidth - 80 - 10, marginTop, {
  width: 80



});
const imageWidth = 80;
const xRight = doc.page.width - imageWidth - 20; // 38 is your current left margin, reused as right margin
doc.image("frontend/images/bqc_cert.png", xRight, 50, { width: imageWidth });


  doc.fillColor("black").fontSize(10).font('Helvetica')
    .text("No.5, Soon Lee Street, Pioneer Point, #05-60, Singapore - 627 607", { align: "center" })
    .text("Tel & Fax: 62535529  Mobile: +65 9239 7825", { align: "center" })
    .text("E-mail: arp.engg@yahoo.com.sg", { align: "center" })
    .text("- Co. Regn.No : 201822438E", { align: "center" });

  doc.moveDown(0.6).strokeColor('black').lineWidth(1).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();

  doc.font("Helvetica");
  doc.fontSize(10).text("TO:", 50, 150);
  doc.text(toName || "N/A", 80, 150, { width: 300 });

 let jobStartY = doc.y + 10;

if (jobName) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000080");
  doc.text(jobName, 60, jobStartY, { width: 300 });
  doc.fillColor("black"); // Reset to default
  jobStartY = doc.y + 5;
}

  const rightStartX = 400;
  doc.text("Date: " + new Date().toLocaleDateString(), rightStartX, 150)
    .text("DO No.: " + (doNumber || "N/A"), rightStartX)
    .text("PO No.: " + (poNumber || "N/A"), rightStartX);

  // Table with simpler layout
  const tableTop = 230;
  const itemX = 60, descX = 100, qtyX = 480;
  const tableRight = 550;
  const rowHeight = 20;
  const fixedTableHeight = doc.page.height * 0.55;

  doc.rect(itemX, tableTop, tableRight - itemX, fixedTableHeight).stroke();
  doc.moveTo(descX, tableTop).lineTo(descX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(qtyX, tableTop).lineTo(qtyX, tableTop + fixedTableHeight).stroke();

  doc.moveTo(itemX, tableTop + rowHeight).lineTo(tableRight, tableTop + rowHeight).stroke();
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text("Sl. No", itemX + 5, tableTop + 5);
  doc.text("Description", descX + 5, tableTop + 5);
  doc.text("Qty", qtyX + 5, tableTop + 5);

  let y = tableTop + rowHeight;
  doc.font('Helvetica');

  items.forEach((item, index) => {
    const { name, quantity } = item;
    const options = { width: qtyX - descX - 10, align: 'left' };
    const descHeight = doc.heightOfString(name, options);
    const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

    if (y + effectiveRowHeight > tableTop + fixedTableHeight) return;

    doc.text(index + 1, itemX + 5, y + 5);
    doc.text(name, descX + 5, y + 5, options);
    doc.text(quantity, qtyX + 5, y + 5);
    y += effectiveRowHeight;
  });

  const footerY = tableTop + fixedTableHeight + 30;
  doc.lineTo(550, footerY - 10).stroke();
  doc.fontSize(10)
    .text("Received items in good condition", 60, footerY)
    .text("For ARP Engineering Pte. Ltd", qtyX - 100, footerY + 10);

  doc.end();
});
// Optional SPA fallback route - serve index.html for any unknown GET route
// Place this AFTER API routes, otherwise it will block POST routes
app.post("/generate-quotation", (req, res) => {
  const { items, toName, attn, quotationNumber, jobName, grandTotal, deliveryDays, paymentDays } = req.body;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });


  res.setHeader(
    "Content-Disposition",
    `attachment; filename=quotation_${quotationNumber || "no-num"}.pdf`
  );
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  // === HEADER ===
  const shorter = doc.page.width * 0.3;
  const longer = doc.page.width - shorter;
  const height1 = 30;
  const height2 = 45;
  const radius = 15;

  doc.rect(0, 0, longer, height1).fill("#889e3e");
  doc.moveTo(longer, 0)
    .lineTo(longer + longer, 0)
    .lineTo(longer + longer, height2)
    .lineTo(longer + radius, height2)
    .lineTo(longer, height2 - radius)
    .lineTo(longer, 0)
    .closePath()
    .fill("#889e3e");

  doc.image("frontend/images/navbar_logo.png", 38, 30, { width: 95 });

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#8B0000')
    .text("ARP ENGINEERING PTE. LTD.", { align: "center" });


    const marginTop = 1;
const pageWidth = doc.page.width;

doc.image("frontend/images/bizsafe.png", pageWidth - 80 - 10, marginTop, {
  width: 80



});
const imageWidth = 80;
const xRight = doc.page.width - imageWidth - 20; // 38 is your current left margin, reused as right margin
doc.image("frontend/images/bqc_cert.png", xRight, 50, { width: imageWidth });

  doc.fillColor("black").fontSize(10).font('Helvetica')
    .text("No.5, Soon Lee Street, Pioneer Point, #05-60, Singapore - 627 607", { align: "center" })
    .text("Tel & Fax: 62535529  Mobile: +65 9239 7825", { align: "center" })
    .text("E-mail: arp.engg@yahoo.com.sg", { align: "center" })
    .text("- Co. Regn.No : 201822438E", { align: "center" });

  doc.moveDown(0.6).strokeColor('black').lineWidth(1).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();

  // === CUSTOMER INFO ===
  doc.font("Helvetica");
  doc.fontSize(10).text("TO:", 50, 150);
  doc.text(toName || "N/A", 80, 150, { width: 300, lineBreak: true });

 let introStartY = doc.y + 10;
doc.font("Helvetica").fontSize(10).text(`Dear Sir/Madam,

We would like to thank you for inviting us to quote the below mentioned job. We are submitting our quotation for your consideration.

Attn: ${attn || "N/A"}`, 50, introStartY, { width: 350 });

let jobStartY = doc.y + 10; // position below the above multiline text

if (jobName) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000080");
  doc.text(jobName, 50, jobStartY, { width: 350 });
  doc.fillColor("black"); // Reset fill color after
  jobStartY = doc.y + 5;
}

  // Right side info: Date and Quotation No
  const rightStartX = 420;
  doc.text("Date: " + new Date().toLocaleDateString(), rightStartX, 150)
    .text("Quotation No.: " + (quotationNumber || "N/A"), rightStartX);

  // === TABLE ===
  const tableTop = introStartY + 110; // Adjusted to fit text above
  const itemX = 50;
  const descX = 90;
  const qtyX = 320;
  const unitX = 390;
  const totalX = 480;
  const tableRight = 550;
  const rowHeight = 20;
  const fixedTableHeight = doc.page.height * 0.45; // Smaller height

  // Draw outer rectangle for table
  doc.rect(itemX, tableTop, tableRight - itemX, fixedTableHeight).stroke();

  // Draw vertical lines for columns
  doc.moveTo(descX, tableTop).lineTo(descX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(qtyX, tableTop).lineTo(qtyX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(unitX, tableTop).lineTo(unitX, tableTop + fixedTableHeight).stroke();
  doc.moveTo(totalX, tableTop).lineTo(totalX, tableTop + fixedTableHeight).stroke();

  // Draw header row horizontal line
  doc.moveTo(itemX, tableTop + rowHeight).lineTo(tableRight, tableTop + rowHeight).stroke();

  // Header text
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text("Sl. No", itemX + 5, tableTop + 5);
  doc.text("Description", descX + 5, tableTop + 5);
  doc.text("Qty", qtyX + 5, tableTop + 5);
  doc.text("Unit Price (S$)", unitX + 5, tableTop + 5);
  doc.text("Total (S$)", totalX + 5, tableTop + 5);

  let y = tableTop + rowHeight;
  doc.font('Helvetica');

  items.forEach((item, index) => {
    const { name, unitPrice, quantity, total } = item;
    const options = { width: qtyX - descX - 10, align: 'left' };
    const descHeight = doc.heightOfString(name, options);
    const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

    if (y + effectiveRowHeight > tableTop + fixedTableHeight - rowHeight) return;

    doc.text(index + 1, itemX + 5, y + 5);
    doc.text(name, descX + 5, y + 5, options);
    doc.text(quantity, qtyX + 5, y + 5);
    doc.text(unitPrice.toFixed(2), unitX + 5, y + 5);
    doc.text(total.toFixed(2), totalX + 5, y + 5);
    y += effectiveRowHeight;
  });

  // Draw last row - only last two cells with borders
  const grandTotalRowY = tableTop + fixedTableHeight - rowHeight;

doc.moveTo(unitX, grandTotalRowY).lineTo(unitX, grandTotalRowY + rowHeight).stroke();
doc.moveTo(totalX, grandTotalRowY).lineTo(totalX, grandTotalRowY + rowHeight).stroke();

  // Horizontal lines for last row
 doc.moveTo(unitX, grandTotalRowY).lineTo(tableRight, grandTotalRowY).stroke();

  doc.moveTo(totalX - (unitX - qtyX), grandTotalRowY + rowHeight).lineTo(tableRight, grandTotalRowY + rowHeight).stroke();

  // Write "Total" label in the second last cell
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text("Total", totalX - (unitX - qtyX) + 5, grandTotalRowY + 5);

  // Write grand total in the last cell
  doc.text(grandTotal.toFixed(2), totalX + 5, grandTotalRowY + 5);
  // === PAYMENT AND DELIVERY TERMS ===
doc.font('Helvetica').fontSize(10);

const termsText = `PAYMENT: 30 DAYS\nDELIVERY: ${deliveryDays || "N/A"} DAYS`;
const termsX = itemX + 5;
const termsY = tableTop + fixedTableHeight + 5;

doc.text(termsText, termsX, termsY);

  // === FOOTER ===
  const footerY = tableTop + fixedTableHeight + 30;

  doc.fontSize(10).font('Helvetica')
    .text("For ARP Engineering Pte. Ltd", 380, footerY + 10);

  // Underlined "RAJA"
const rajaText = "Raja";
const rajaX = 380;
const rajaY = footerY + 30;

// Set the text color for "Raja"
doc.fillColor('#000080'); // Navy-ish dark blue
doc.font('Helvetica-Bold').fontSize(10).text(rajaText, rajaX, rajaY);

// Underline "Raja"
const textWidth = doc.widthOfString(rajaText);
doc.moveTo(rajaX, rajaY + 12).lineTo(rajaX + textWidth, rajaY + 12).stroke();

// Optional: reset color if needed afterward
doc.fillColor('black');

  doc.end();
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});