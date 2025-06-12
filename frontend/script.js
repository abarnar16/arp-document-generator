document.getElementById("add-row").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "row g-2 mb-2";
  row.innerHTML = `
    <div class="col-md-4">
      <input type="text" class="form-control name" placeholder="Item Name" />
    </div>
    <div class="col-md-3">
      <input type="number" class="form-control quantity" placeholder="Quantity" />
    </div>
  `;
  document.getElementById("do-form").appendChild(row);
});

document.getElementById("submit").addEventListener("click", async () => {
  const names = document.querySelectorAll(".name");
  const quantities = document.querySelectorAll(".quantity");

  const items = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim();
    const quantity = parseInt(quantities[i].value);

    if (name && !isNaN(quantity)) {
      items.push({ name, quantity });
    }
  }

  let toName = document.getElementById("to-name").value.trim().replace(/\r\n|\r|\n/g, '\n');
// Check for "palfinger" (case-insensitive)
if (toName.toLowerCase() === "palfinger") {
  toName = "PALFINGER ASIA PACIFIC PTE LTD\nNO 4, TUAS LOOP\nSINGAPORE 637342\nPALMS230082/ KA5405653 / OA1952633\nBONGKOT FIELD/ BU :SVC/LSA";
}

  const doNumber = document.getElementById("do-number").value.trim();
  const poNumber = document.getElementById("po-number").value.trim();

  const response = await fetch("http://localhost:3000/generate-do", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      toName,
      doNumber,
      poNumber,
    }),
  });

  if (response.ok) {
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "delivery_order.pdf";
    link.click();
  } else {
    alert("Error generating DO PDF");
  }
});

  const navButtons = document.querySelectorAll('.nav-button');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // Optional: Mark current page as active based on URL
  const current = window.location.pathname;
  navButtons.forEach(btn => {
    if (btn.getAttribute('href') === current) {
      btn.classList.add('active');
    }
  });

