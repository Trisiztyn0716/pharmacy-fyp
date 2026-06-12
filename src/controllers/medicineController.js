const medicineModel = require("../models/medicineModel");
const externalInfoModel = require("../models/externalInfoModel");
const dailyMedService = require("../services/dailyMedService");
const medicineImageService = require("../services/medicineImageService");

function dashboardNotice(status) {
  if (status === "created") {
    return "Medicine added to inventory.";
  }

  if (status === "updated") {
    return "Medicine updated successfully.";
  }

  if (status === "deleted") {
    return "Medicine removed from inventory.";
  }

  return null;
}

function medicineId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateImageSelection(data) {
  const imageUrl = String(data.image_url || "").trim();

  if (imageUrl && !medicineImageService.isAvailableMedicineImage(imageUrl)) {
    return "Choose an image from the available medicine image list.";
  }

  data.image_url = imageUrl || null;
  return null;
}

function applyUploadedImage(req) {
  if (req.uploadError) {
    return req.uploadError;
  }

  const uploadedImageUrl = medicineImageService.publicUrlForUploadedFile(req.file);

  if (uploadedImageUrl) {
    req.body.image_url = uploadedImageUrl;
  }

  return validateImageSelection(req.body);
}

function prepareMedicineForForm(medicine) {
  if (!medicine || !medicine.expiry_date || typeof medicine.expiry_date === "string") {
    return medicine;
  }

  return {
    ...medicine,
    expiry_date: medicine.expiry_date.toISOString().slice(0, 10)
  };
}

async function renderDashboard(req, res, { error = null, message = null, status = 200 } = {}) {
  const medicines = await medicineModel.getAllMedicines();
  const imageChoices = medicineImageService.getMedicineImageChoices();

  return res.status(status).render("index", {
    pageTitle: "Staff Dashboard | Pharmacy Management System",
    medicines,
    imageChoices,
    message,
    error,
    user: req.user
  });
}

async function homePage(req, res) {
  try {
    return await renderDashboard(req, res, {
      message: dashboardNotice(req.query.status)
    });
  } catch (error) {
    res.status(500).send(`Database error: ${error.message}`);
  }
}

async function createMedicine(req, res) {
  try {
    const validationError = applyUploadedImage(req);

    if (validationError) {
      return await renderDashboard(req, res, { error: validationError, status: 400 });
    }

    await medicineModel.createMedicine(req.body);
    res.redirect("/staff?status=created");
  } catch (error) {
    res.status(500).send(`Cannot create medicine: ${error.message}`);
  }
}

async function editMedicinePage(req, res) {
  const id = medicineId(req.params.id);

  if (!id) {
    return res.status(404).send("Medicine not found");
  }

  try {
    const medicine = await medicineModel.getMedicineById(id);

    if (!medicine) {
      return res.status(404).send("Medicine not found");
    }

    res.render("edit-medicine", {
      pageTitle: "Edit Medicine | Staff Dashboard",
      medicine: prepareMedicineForForm(medicine),
      imageChoices: medicineImageService.getMedicineImageChoices(),
      error: null,
      user: req.user
    });
  } catch (error) {
    res.status(500).send(`Cannot load medicine: ${error.message}`);
  }
}

async function updateMedicine(req, res) {
  const id = medicineId(req.params.id);

  if (!id) {
    return res.status(404).send("Medicine not found");
  }

  try {
    const validationError = applyUploadedImage(req);

    if (validationError) {
      return res.status(400).render("edit-medicine", {
        pageTitle: "Edit Medicine | Staff Dashboard",
        medicine: { id, ...req.body, image_url: null },
        imageChoices: medicineImageService.getMedicineImageChoices(),
        error: validationError,
        user: req.user
      });
    }

    const updatedMedicine = await medicineModel.updateMedicine(id, req.body);

    if (!updatedMedicine) {
      return res.status(404).send("Medicine not found");
    }

    res.redirect("/staff?status=updated");
  } catch (error) {
    res.status(500).send(`Cannot update medicine: ${error.message}`);
  }
}

async function deleteMedicine(req, res) {
  const id = medicineId(req.params.id);

  if (!id) {
    return res.status(404).send("Medicine not found");
  }

  try {
    const deletedMedicine = await medicineModel.deleteMedicine(id);

    if (!deletedMedicine) {
      return res.status(404).send("Medicine not found");
    }

    res.redirect("/staff?status=deleted");
  } catch (error) {
    res.status(500).send(`Cannot delete medicine: ${error.message}`);
  }
}

async function getMedicineInfoApi(req, res) {
  const medicineName = req.params.name;

  try {
    const cached = await externalInfoModel.findCachedInfoByName(medicineName);

    if (cached) {
      return res.json({
        from_cache: true,
        data: cached
      });
    }

    const dailyMedInfo = await dailyMedService.searchDailyMedByName(medicineName);

    if (!dailyMedInfo) {
      return res.status(404).json({
        message: "No medicine information found from DailyMed.",
        suggestion: "Try a generic medicine name such as ibuprofen, acetaminophen, or amoxicillin."
      });
    }

    const savedInfo = await externalInfoModel.saveExternalInfo(dailyMedInfo);

    res.json({
      from_cache: false,
      data: savedInfo
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve medicine information.",
      error: error.message
    });
  }
}

async function searchMedicinePage(req, res) {
  const medicineName = req.query.name;

  if (!medicineName) {
    return res.redirect("/staff");
  }

  try {
    let info = await externalInfoModel.findCachedInfoByName(medicineName);
    let fromCache = true;

    if (!info) {
      const dailyMedInfo = await dailyMedService.searchDailyMedByName(medicineName);

      if (dailyMedInfo) {
        info = await externalInfoModel.saveExternalInfo(dailyMedInfo);
        fromCache = false;
      }
    }

    const medicines = await medicineModel.getAllMedicines();

    res.render("search-result", {
      pageTitle: "Medicine Information Search",
      medicineName,
      info,
      fromCache,
      medicines
    });
  } catch (error) {
    res.status(500).send(`Search failed: ${error.message}`);
  }
}

module.exports = {
  homePage,
  createMedicine,
  editMedicinePage,
  updateMedicine,
  deleteMedicine,
  getMedicineInfoApi,
  searchMedicinePage
};
