document.getElementById("add-row").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "row g-2 mb-2";
  row.innerHTML = `
    <div class="col-md-4">
      <input type="text" class="form-control name" placeholder="Item Name" />
    </div>
    <div class="col-md-3">
      <input type="number" class="form-control unit-price" placeholder="Unit Price" />
    </div>
    <div class="col-md-3">
      <input type="number" class="form-control quantity" placeholder="Quantity" />
    </div>
  `;
  document.getElementById("quotation-form").appendChild(row);
});

document.getElementById("submit").addEventListener("click", async (e) => {
  e.preventDefault();

  const names = document.querySelectorAll(".name");
  const prices = document.querySelectorAll(".unit-price");
  const quantities = document.querySelectorAll(".quantity");

  const items = [];
  let grandTotal = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim();
    const unitPrice = parseFloat(prices[i].value);
    const quantity = parseInt(quantities[i].value);

    if (name && !isNaN(unitPrice) && !isNaN(quantity)) {
      const total = unitPrice * quantity;
      grandTotal += total;
      items.push({ name, unitPrice, quantity, total });
    }
  }

  let toName = document.getElementById("to-name").value.trim();
  if (toName.toLowerCase() === "palfinger") {
    toName = `PALFINGER ASIA PACIFIC PTE LTD
33 Gul Circle
SINGAPORE 629570`;
  }

  const quotationNumber = document.getElementById("quotation-number").value.trim();
  const attn = document.getElementById("attn").value.trim();
  const jobName = document.getElementById("job-name").value.trim();
  const deliveryDays = document.getElementById("delivery-days").value.trim();

  // ✅ ADD THIS: manual date from HTML
  const docDate = document.getElementById("doc-date")?.value || "";

  try {
    const response = await fetch("/generate-quotation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        toName,
        quotationNumber,
        attn,
        jobName,
        deliveryDays,
        grandTotal,
        docDate, // ✅ SEND THIS
      }),
    });

    if (!response.ok) throw new Error("Quotation generation failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotation_${quotationNumber || "no-num"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Error generating quotation PDF: " + err.message);
  }
});
