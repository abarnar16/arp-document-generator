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

  // Optional: log total to browser for verification
  console.log("Grand Total:", grandTotal.toFixed(2));

  let toName = document.getElementById("to-name").value.trim().replace(/\r\n|\r|\n/g, '\n');
  // Check for "palfinger" (case-insensitive)
if (toName.toLowerCase() === "palfinger") {
  toName = "PALFINGER ASIA PACIFIC PTE LTD\nNO 4, TUAS LOOP\nSINGAPORE 637342\nPALMS230082/ KA5405653 / OA1952633\nBONGKOT FIELD/ BU :SVC/LSA";
}
  const doNumber = document.getElementById("do-number").value.trim();
  const poNumber = document.getElementById("po-number").value.trim();

  const response = await fetch("http://localhost:3000/generate-invoice", {
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

  if (response.ok) {
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "invoice.pdf";
    link.click();
  } else {
    alert("Error generating PDF");
  }
});
