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

  // === HEADER SECTION ===
  function drawHeader() {
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
    doc.image("frontend/images/bizsafe.png", pageWidth - 80 - 10, marginTop, { width: 70 });

    const imageWidth = 80;
    const xRight = doc.page.width - imageWidth - 20;
    doc.image("frontend/images/bqc_cert.png", xRight, 50, { width: imageWidth });

    doc.fillColor("black").fontSize(10).font('Helvetica')
      .text("No.5, Soon Lee Street, Pioneer Point, #05-60, Singapore - 627 607", { align: "center" })
      .text("Tel & Fax: 62535529  Mobile: +65 9239 7825", { align: "center" })
      .text("E-mail: arp.engg@yahoo.com.sg", { align: "center" })
      .text("- Co. Regn.No : 201822438E", { align: "center" });

    doc.moveDown(0.6).strokeColor('black').lineWidth(1).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();

    // CUSTOMER INFO
    doc.font("Helvetica");
    doc.fontSize(10).text("TO:", 50, 150);
    doc.text(toName || "N/A", 80, 150, { width: 300 });

    let jobStartY = doc.y + 10;
    if (jobName) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#000080");
      doc.text(jobName, 50, jobStartY, { width: 300 });
      doc.fillColor("black");
      jobStartY = doc.y + 5;
    }

    const rightStartX = 400;
    doc.text("Date: " + new Date().toLocaleDateString(), rightStartX, 150)
      .text("Invoice No.: " + (invoiceNumber || "N/A"), rightStartX)
      .text("PO No.: " + (poNumber || "N/A"), rightStartX)
      .text("DO No.: " + (doNumber || "N/A"), rightStartX);
  }

  // === TABLE SECTION ===
  const tableTop = 230;
  const itemX = 50;
  const descX = 90;
  const qtyX = 320;
  const unitX = 390;
  const totalX = 480;
  const tableRight = 550;
  const rowHeight = 20;
  const tableHeight = doc.page.height * 0.55;

  function drawTableHeader(yStart) {
    doc.rect(itemX, yStart, tableRight - itemX, tableHeight).stroke();
    doc.moveTo(descX, yStart).lineTo(descX, yStart + tableHeight).stroke();
    doc.moveTo(qtyX, yStart).lineTo(qtyX, yStart + tableHeight).stroke();
    doc.moveTo(unitX, yStart).lineTo(unitX, yStart + tableHeight).stroke();
    doc.moveTo(totalX, yStart).lineTo(totalX, yStart + tableHeight).stroke();
    doc.moveTo(itemX, yStart + rowHeight).lineTo(tableRight, yStart + rowHeight).stroke();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text("Sl. No", itemX + 5, yStart + 5);
    doc.text("Description", descX + 5, yStart + 5);
    doc.text("Qty", qtyX + 5, yStart + 5);
    doc.text("Unit Price (S$)", unitX + 5, yStart + 5);
    doc.text("Total (S$)", totalX + 5, yStart + 5);
  }

  // Start first page
  drawHeader();
  drawTableHeader(tableTop);
  let y = tableTop + rowHeight;
  let index = 0;

  while (index < items.length) {
    const { name, unitPrice, quantity, total } = items[index];
    const options = { width: qtyX - descX - 10, align: 'left' };
    const descHeight = doc.heightOfString(name, options);
    const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

    if (y + effectiveRowHeight > tableTop + tableHeight - rowHeight) {
      // New page + reset layout
      doc.addPage();
      drawHeader();
      drawTableHeader(tableTop);
      y = tableTop + rowHeight;
    }

    doc.font('Helvetica');
    doc.text(index + 1, itemX + 5, y + 5);
    doc.text(name, descX + 5, y + 5, options);
    doc.text(quantity, qtyX + 5, y + 5);
    doc.text(unitPrice.toFixed(2), unitX + 5, y + 5);
    doc.text(total.toFixed(2), totalX + 5, y + 5);
    y += effectiveRowHeight;
    index++;
  }

  // === FOOTER SECTION === (Only on last page)
  const grandTotalRowY = tableTop + tableHeight - rowHeight;
  doc.moveTo(itemX, grandTotalRowY).lineTo(tableRight, grandTotalRowY).stroke();
  doc.rect(itemX, grandTotalRowY, tableRight - itemX, rowHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(grandTotal.toFixed(2), totalX + 5, grandTotalRowY + 5);

  const footerY = tableTop + tableHeight + 30;
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

  // === HEADER FUNCTION ===
  function drawHeader() {
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
    doc.image("frontend/images/bizsafe.png", pageWidth - 80 - 10, marginTop, { width: 70 });

    const imageWidth = 80;
    const xRight = doc.page.width - imageWidth - 20;
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
      doc.fillColor("black");
    }

    const rightStartX = 400;
    doc.text("Date: " + new Date().toLocaleDateString(), rightStartX, 150)
      .text("DO No.: " + (doNumber || "N/A"), rightStartX)
      .text("PO No.: " + (poNumber || "N/A"), rightStartX);
  }

  // === TABLE CONFIG ===
  const tableTop = 230;
  const itemX = 60, descX = 100, qtyX = 480;
  const tableRight = 550;
  const rowHeight = 20;
  const tableHeight = doc.page.height * 0.55;

  function drawTableHeader(yStart) {
    doc.rect(itemX, yStart, tableRight - itemX, tableHeight).stroke();
    doc.moveTo(descX, yStart).lineTo(descX, yStart + tableHeight).stroke();
    doc.moveTo(qtyX, yStart).lineTo(qtyX, yStart + tableHeight).stroke();
    doc.moveTo(itemX, yStart + rowHeight).lineTo(tableRight, yStart + rowHeight).stroke();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text("Sl. No", itemX + 5, yStart + 5);
    doc.text("Description", descX + 5, yStart + 5);
    doc.text("Qty", qtyX + 5, yStart + 5);
  }

  // === PAGE INIT ===
  drawHeader();
  drawTableHeader(tableTop);
  let y = tableTop + rowHeight;
  let index = 0;

  while (index < items.length) {
    const { name, quantity } = items[index];
    const options = { width: qtyX - descX - 10, align: 'left' };
    const descHeight = doc.heightOfString(name, options);
    const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

    if (y + effectiveRowHeight > tableTop + tableHeight - rowHeight) {
      doc.addPage();
      drawHeader();
      drawTableHeader(tableTop);
      y = tableTop + rowHeight;
    }

    doc.font('Helvetica');
    doc.text(index + 1, itemX + 5, y + 5);
    doc.text(name, descX + 5, y + 5, options);
    doc.text(quantity, qtyX + 5, y + 5);
    y += effectiveRowHeight;
    index++;
  }

  // === FOOTER (Only on final page) ===
  const footerY = tableTop + tableHeight + 30;

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

  res.setHeader("Content-Disposition", `attachment; filename=quotation_${quotationNumber || "no-num"}.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const imageWidth = 80;
  const itemX = 50, descX = 90, qtyX = 320, unitX = 390, totalX = 480, tableRight = 550;
  const rowHeight = 20;
  const fixedTableHeight = doc.page.height * 0.45;
  const rowsPerPage = Math.floor((fixedTableHeight - rowHeight) / rowHeight);
  const totalPages = Math.ceil(items.length / rowsPerPage);

  // Variables to hold Y positions across pages
  let introStartYGlobal = 0;
  let toTextYGlobal = 0;

  const drawStaticContent = () => {
    const shorter = doc.page.width * 0.3;
    const longer = doc.page.width - shorter;
    const height1 = 30, height2 = 45, radius = 15;

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

    doc.image("frontend/images/bizsafe.png", pageWidth - 80 - 10, 1, { width: 70 });
    doc.image("frontend/images/bqc_cert.png", pageWidth - imageWidth - 20, 50, { width: imageWidth });

    doc.fillColor("black").fontSize(10).font('Helvetica')
      .text("No.5, Soon Lee Street, Pioneer Point, #05-60, Singapore - 627 607", { align: "center" })
      .text("Tel & Fax: 62535529  Mobile: +65 9239 7825", { align: "center" })
      .text("E-mail: arp.engg@yahoo.com.sg", { align: "center" })
      .text("- Co. Regn.No : 201822438E", { align: "center" });

    doc.moveDown(0.6).strokeColor('black').lineWidth(1).moveTo(0, doc.y).lineTo(doc.page.width, doc.y).stroke();

    doc.font("Helvetica").fontSize(10).text("TO:", 50, 150);
    doc.text(toName || "N/A", 80, 150, { width: 300, lineBreak: true });
    toTextYGlobal = 150;

    // Store Y of after TO text
    introStartYGlobal = doc.y + 10;

    // Dear Sir/Madam text block
    doc.text(`Dear Sir/Madam,

We would like to thank you for inviting us to quote the below mentioned job. We are submitting our quotation for your consideration.

Attn: ${attn || "N/A"}`, 50, introStartYGlobal, { width: 350 });

    let jobStartY = doc.y + 10;
    if (jobName) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#000080");
      doc.text(jobName, 50, jobStartY, { width: 350 });
      doc.fillColor("black");
    }

    doc.text("Date: " + new Date().toLocaleDateString(), 420, 150)
       .text("Quotation No.: " + (quotationNumber || "N/A"), 420);
  };

  const drawTableHeader = (y) => {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text("Sl. No", itemX + 5, y + 5);
    doc.text("Description", descX + 5, y + 5);
    doc.text("Qty", qtyX + 5, y + 5);
    doc.text("Unit Price (S$)", unitX + 5, y + 5);
    doc.text("Total (S$)", totalX + 5, y + 5);
    doc.moveTo(itemX, y + rowHeight).lineTo(tableRight, y + rowHeight).stroke();
  };

  const drawTableBox = (yStart) => {
    doc.rect(itemX, yStart, tableRight - itemX, fixedTableHeight).stroke();
    doc.moveTo(descX, yStart).lineTo(descX, yStart + fixedTableHeight).stroke();
    doc.moveTo(qtyX, yStart).lineTo(qtyX, yStart + fixedTableHeight).stroke();
    doc.moveTo(unitX, yStart).lineTo(unitX, yStart + fixedTableHeight).stroke();
    doc.moveTo(totalX, yStart).lineTo(totalX, yStart + fixedTableHeight).stroke();
  };

  let currentItemIndex = 0;
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) doc.addPage();

    drawStaticContent();

    // Use fixed tableTop as introStartYGlobal + 110 (same as your original)
    const tableTop = introStartYGlobal + 110;
    drawTableBox(tableTop);
    drawTableHeader(tableTop);

    let y = tableTop + rowHeight;
    doc.font('Helvetica');

    const pageItems = items.slice(currentItemIndex, currentItemIndex + rowsPerPage);
    pageItems.forEach((item, index) => {
      const { name, unitPrice, quantity, total } = item;
      const options = { width: qtyX - descX - 10, align: 'left' };
      const descHeight = doc.heightOfString(name, options);
      const effectiveRowHeight = Math.max(rowHeight, descHeight + 10);

      doc.text(currentItemIndex + index + 1, itemX + 5, y + 5);
      doc.text(name, descX + 5, y + 5, options);
      doc.text(quantity, qtyX + 5, y + 5);
      doc.text(unitPrice.toFixed(2), unitX + 5, y + 5);
      doc.text(total.toFixed(2), totalX + 5, y + 5);
      y += effectiveRowHeight;
    });

    currentItemIndex += rowsPerPage;

    if (pageIndex === totalPages - 1) {
      // Draw last row - total
      const grandTotalRowY = tableTop + fixedTableHeight - rowHeight;

      doc.moveTo(unitX, grandTotalRowY).lineTo(unitX, grandTotalRowY + rowHeight).stroke();
      doc.moveTo(totalX, grandTotalRowY).lineTo(totalX, grandTotalRowY + rowHeight).stroke();
      doc.moveTo(unitX, grandTotalRowY).lineTo(tableRight, grandTotalRowY).stroke();
      doc.moveTo(totalX - (unitX - qtyX), grandTotalRowY + rowHeight).lineTo(tableRight, grandTotalRowY + rowHeight).stroke();

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text("Total", totalX - (unitX - qtyX) + 5, grandTotalRowY + 5);
      doc.text(grandTotal.toFixed(2), totalX + 5, grandTotalRowY + 5);

      // Payment & Delivery
      const termsText = `PAYMENT: ${paymentDays || "30"} DAYS\nDELIVERY: ${deliveryDays || "N/A"} DAYS`;
      const termsX = itemX + 5;
      const termsY = tableTop + fixedTableHeight + 5;
      doc.font('Helvetica').fontSize(10).text(termsText, termsX, termsY);

      // Footer
      const footerY = tableTop + fixedTableHeight + 30;
      doc.fontSize(10).text("For ARP Engineering Pte. Ltd", 380, footerY + 10);

      const rajaText = "Raja";
      const rajaX = 380;
      const rajaY = footerY + 30;
      doc.fillColor('#000080');
      doc.font('Helvetica-Bold').fontSize(10).text(rajaText, rajaX, rajaY);
      const textWidth = doc.widthOfString(rajaText);
      doc.moveTo(rajaX, rajaY + 12).lineTo(rajaX + textWidth, rajaY + 12).stroke();
      doc.fillColor('black');
    }
  }

  doc.end();
});




// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});