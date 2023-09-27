const express = require("express");
const { getPipedriveDeals, createNotionPage } = require("./notion");

const app = express();

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// Route to get Pipedrive deals
app.get("/pipedrive-deals", async (req, res) => {
  try {
    // Retrieve Pipedrive deals
    const deals = await getPipedriveDeals();

    // Create a Notion page (assuming createNotionPage returns a Promise)
    await createNotionPage();

    // Send the Pipedrive deals as a response (or modify the response as needed)
    res.json(deals);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
