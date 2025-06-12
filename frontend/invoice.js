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
  document.getElementById("invoice-form").appendChild(row);
});

document.getElementById("submit").addEventListener("click", async () => {
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

  console.log("Grand Total:", grandTotal.toFixed(2));

  let toName = document.getElementById("to-name").value.trim().replace(/\r\n|\r|\n/g, '\n');
  if (toName.toLowerCase() === "palfinger") {
    toName = `PALFINGER ASIA PACIFIC PTE LTD
NO 4, TUAS LOOP
SINGAPORE 637342
PALMS230082/ KA5405653 / OA1952633
BONGKOT FIELD/ BU :SVC/LSA`;
  }

  const doNumber = document.getElementById("do-number").value.trim();
  const poNumber = document.getElementById("po-number").value.trim();

  try {
    const response = await fetch("/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        toName,
        doNumber,
        poNumber,
        grandTotal,
      }),
    });

    if (!response.ok) throw new Error("Invoice generation failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Error generating invoice PDF: " + err.message);
  }
});
