(function () {
  const modal = document.querySelector("[data-purchase-modal]");

  if (!modal) {
    return;
  }

  const panel = modal.querySelector(".purchase-modal-panel");
  const closeButton = modal.querySelector("[data-purchase-close]");
  const medicineIdInput = modal.querySelector("[data-purchase-medicine-id]");
  const quantityInput = modal.querySelector("[data-purchase-quantity]");
  const summary = modal.querySelector("[data-purchase-summary]");

  function closeModal() {
    modal.hidden = true;
  }

  document.querySelectorAll("[data-purchase-button]").forEach(function (button) {
    button.addEventListener("click", function () {
      const stock = Number(button.dataset.medicineStock || 1);
      const price = Number(button.dataset.medicinePrice || 0);

      medicineIdInput.value = button.dataset.medicineId;
      quantityInput.max = String(stock);
      quantityInput.value = "1";
      summary.textContent = `${button.dataset.medicineName} - ${price.toLocaleString("vi-VN")} VND each`;
      modal.hidden = false;
    });
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (!panel.contains(event.target)) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
})();
