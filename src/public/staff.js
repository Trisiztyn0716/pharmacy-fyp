(function () {
  document.querySelectorAll("[data-drop-zone]").forEach(function (zone) {
    const input = zone.querySelector("input[type='file']");
    const status = zone.querySelector("span");

    function setFileName() {
      if (input.files && input.files.length > 0) {
        status.textContent = input.files[0].name;
      }
    }

    zone.addEventListener("click", function () {
      input.click();
    });

    zone.addEventListener("dragover", function (event) {
      event.preventDefault();
      zone.classList.add("dragging");
    });

    zone.addEventListener("dragleave", function () {
      zone.classList.remove("dragging");
    });

    zone.addEventListener("drop", function (event) {
      event.preventDefault();
      zone.classList.remove("dragging");

      if (event.dataTransfer.files.length > 0) {
        input.files = event.dataTransfer.files;
        setFileName();
      }
    });

    input.addEventListener("change", setFileName);
  });
})();
