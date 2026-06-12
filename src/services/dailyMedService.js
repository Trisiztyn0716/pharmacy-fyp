const axios = require("axios");

const DAILYMED_BASE_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2";

/**
 * Search DailyMed by drug name.
 * This service returns the first matching SPL result.
 *
 * DailyMed is a U.S.-based drug label database, so generic names such as
 * "ibuprofen", "acetaminophen", or "amoxicillin" usually work better than
 * local brand names.
 */
async function searchDailyMedByName(medicineName) {
  const searchUrl = `${DAILYMED_BASE_URL}/spls.json?drug_name=${encodeURIComponent(medicineName)}`;

  const response = await axios.get(searchUrl, {
    timeout: 10000
  });

  const payload = response.data;

  const results = payload.data || [];

  if (!results.length) {
    return null;
  }

  const first = results[0];

  const setId = first.setid || first.set_id || first.SETID;

  return {
    medicine_name: medicineName,
    set_id: setId,
    title: first.title || first.spl_product_data_elements || medicineName,
    source_name: "DailyMed",
    source_url: setId
      ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`
      : "https://dailymed.nlm.nih.gov/dailymed/",
    raw_json: payload
  };
}

module.exports = {
  searchDailyMedByName
};
