const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');





const app = express();
app.use(express.static(path.join(__dirname, 'frontend')));

// For any other route not handled, send index.html (optional, useful if SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

// === ROUTE 1: Generate INVOICE PDF ===
// === ROUTE 1: Generate INVOICE PDF ===
app.post("/generate-invoice", (req, res) => {
  const { items, toName, doNumber, poNumber, grandTotal } = req.body;
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
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

  const rightStartX = 400;
  doc.text("Date: " + new Date().toLocaleDateString(), rightStartX, 150)
    .text("DO No.: " + (doNumber || "N/A"), rightStartX)
    .text("PO No.: " + (poNumber || "N/A"), rightStartX);

  // === TABLE ===
  const tableTop = 230;
  const itemX = 50;      // Sl. No start
  const descX = 90;      // Description start (smaller width than before)
  const qtyX = 320;      // Quantity start (shifted left)
  const unitX = 390;     // Unit Price wider (more space)
  const totalX = 480;    // Total start (after Unit Price)
  const tableRight = 550;  // total width same
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

  let y = tableTop + rowHeight;  // start below header row
  doc.font('Helvetica');

  // Print items, stop before grand total row
  items.forEach((item, index) => {
    const { name, unitPrice, quantity, total } = item;
    const options = { width: qtyX - descX - 10, align: 'left' };
    const descHeight = doc.heightOfString(name, options);
    const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

    // Stop if next row would overlap grand total row at bottom
    if (y + effectiveRowHeight > tableTop + fixedTableHeight - rowHeight) return;

    doc.text(index + 1, itemX + 5, y + 5);
    doc.text(name, descX + 5, y + 5, options);
    doc.text(quantity, qtyX + 5, y + 5);
    doc.text(unitPrice.toFixed(2), unitX + 5, y + 5);
    doc.text(total.toFixed(2), totalX + 5, y + 5);
    y += effectiveRowHeight;
  });

  // Draw line above grand total row
  const grandTotalRowY = tableTop + fixedTableHeight - rowHeight;
  doc.moveTo(itemX, grandTotalRowY).lineTo(tableRight, grandTotalRowY).stroke();

  // Draw grand total row rectangle
  doc.rect(itemX, grandTotalRowY, tableRight - itemX, rowHeight).stroke();

  // Draw grand total number only in Total column cell, vertically centered
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(grandTotal.toFixed(2), totalX + 5, grandTotalRowY + 5);

  // === FOOTER ===
 const footerY = tableTop + fixedTableHeight + 30;
doc.lineTo(550, footerY - 10).stroke();

doc.fontSize(10).font('Helvetica')
  .text("Received items in good condition", 60, footerY)
  .text("For ARP Engineering Pte. Ltd", 380, footerY + 10); // shifted right

  doc.end();
});



// === ROUTE 2: Generate DO/PO-Style PDF ===
app.post("/generate-do", (req, res) => {
  const { items, toName, doNumber, poNumber } = req.body;
  const doc = new PDFDocument({ margin: 50 });

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

  doc.fillColor("black").fontSize(10).font('Helvetica')
    .text("No.5, Soon Lee Street, Pioneer Point, #05-60, Singapore - 627 607", { align: "center" })
    .text("Tel & Fax: 62535529  Mobile: +65 9239 7825", { align: "center" })
    .text("E-mail: arp.engg@yahoo.com.sg", { align: "center" })
    .text("- Co. Regn.No : 201822438E", { align: "center" });

  doc.moveDown(0.6).strokeColor('black').lineWidth(1).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();

  doc.font("Helvetica");
  doc.fontSize(10).text("TO:", 50, 150);
  doc.text(toName || "N/A", 80, 150, { width: 300 });

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

// === START SERVER ===
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
