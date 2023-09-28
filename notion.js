require("dotenv").config();
const fs = require("fs");

const { Client } = require("@notionhq/client");
const pipedrive = require("pipedrive");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const defaultClient = new pipedrive.ApiClient();

// Configure API key authorization: apiToken
let apiToken = defaultClient.authentications.api_key;
apiToken.apiKey = process.env.PIPEDRIVE_API_KEY;

const dealsArray = [];

let importedDealIds = [];

// Timestamp of the last poll (initialize as 0 or a specific timestamp)
// This is for checking is there new deals in Pipedrive used by fetchNewDeals()
let lastPollTimestamp = 0;

// Function for retrieving Pipedrive deal values
async function getPipedriveDeals() {
  const api = new pipedrive.DealsApi(defaultClient);
  try {
    const dealsFilter = {
      filterId: 215, // Deal's filter ID created in Pipedrive
    };

    const orgFilter = {
      filterId: 219, // Organisations filter ID created in Pipedrive
    };

    const dealsResponse = await api.getDeals(dealsFilter);

    if (!dealsResponse.data || dealsResponse.data.length === 0) {
      // Handle the case where the response data is empty or undefined
      console.log("No deals found in Pipedrive API response.");
      return [];
    }

    // Instationatiion of Pipedrive OrganisationsApi
    const apiOrganisations = new pipedrive.OrganizationsApi(defaultClient);
    const organizations = await apiOrganisations.getOrganizations(orgFilter);

    // Extract the needed data from Pipedrive's organisation api response
    const organisationsData = organizations.data.map((org) => ({
      organisationId: org.id,
      organisationName: org.name,
      ownerName: org.owner_id.name,
      organisationRoute: org.address_route,
      organisatonCity: org.address_locality,
      unitsNumber: org.cd5e541b0ffc8d0f57765c73552d3b13bd206c21,
    }));

    // Create a mapping object for organisationId to unitsNumber
    const organisationIdToUnitsMapping = {};
    organisationsData.forEach((orgData) => {
      organisationIdToUnitsMapping[orgData.organisationId] =
        orgData.unitsNumber;
    });

    // Create a mapping object for organisationId to address
    const organisationIdToAddressMapping = {};
    organisationsData.forEach((orgData) => {
      organisationIdToAddressMapping[orgData.organisationId] =
        orgData.organisationRoute; // Use orgData.organisationRoute instead of orgData.address_route
    });

    const dealData = await Promise.all(
      dealsResponse.data.map(async (deal) => {
        // If person has multiple email addresses then get all
        const emailArray = deal.person_id
          ? deal.person_id.email.map((emailObj) => emailObj.value)
          : ["N/A"];

        // Use the mapping to get unitsNumber for the current deal
        const unitsNumber =
          organisationIdToUnitsMapping[deal.org_id.value] || null;

        // Use the mapping to get the address for the current deal
        const organisationAddress =
          organisationIdToAddressMapping[deal.org_id.value] || null;

        // Extract the needed data from Pipedrive's Deal api response
        const extractedDeal = {
          dealId: deal.id,
          dealTitle: deal.title,
          personName: deal.person_id ? deal.person_id.name : "N/A", // Check if person_id exists
          personEmail: emailArray,
          organisationId: deal.org_id.value,
          organisationName: deal.org_id.name,
          organisationAddress: organisationAddress,
          dealOwner: deal.user_id.name,
          value: deal.value,
          unitsNumber: unitsNumber,
        };
        dealsArray.push(extractedDeal);
        console.log("dealsArray:", dealsArray);
        console.log(`Fetching ${extractedDeal.dealTitle}`);
        return extractedDeal;
      })
    );

    return Promise.all(dealData); // Await all the promises here
  } catch (error) {
    console.log("Error retrieving deals from Pipedrive API:", error);
    throw error;
  }
}

async function findNotionPageByPipeDealId(pipeDealId) {
  // Check if pipeDealId is a valid number (you can adjust the regex as needed)
  const isValidPipeDealId = /^\d+$/.test(pipeDealId);

  if (!isValidPipeDealId) {
    // Handle the case where pipeDealId is not a valid number
    console.log("Invalid pipeDealId format");
    return null; // or throw an error or handle it in some other way
  }

  const database_id = process.env.NOTION_DATABASE_ID;
  const response = await notion.databases.query({
    database_id: database_id,
    filter: {
      property: "PipeDealId",
      number: {
        equals: pipeDealId,
      },
    },
  });
  if (response.results.length > 0) {
    return response.results[0]; // Assuming you found the page
  } else {
    return null; // Page not found
  }
}

// Create new Notion page for each Pipedrive deal
async function createNotionPage(deal) {
  console.log("importedDealIds:", importedDealIds); // Debug: Print the imported deal IDs

  console.log("Processing deal ID:", deal.dealId); // Debug: Print the current deal ID

  // Check if a page with the same "PipeDealId" exists in Notion
  const existingPage = await findNotionPageByPipeDealId(deal.dealId);

  if (!existingPage) {
    console.log("Sending data to Notion");
    const response = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        Name: {
          title: [
            {
              type: "text",
              text: {
                content: deal.dealTitle,
              },
            },
          ],
        },
        PipeDealId: {
          number: deal.dealId,
        },
        Units: {
          number: deal.unitsNumber,
        },
        Value: {
          number: deal.value,
        },
      },
    });
    console.log(response);
  } else {
    console.log(
      `Deal with PipeDealId ${deal.pipeDealId} already exists in Notion. Skipping import.`
    );
  }
}

// Fetch Pipedrive deals and process them
async function fetchAndProcessDeals() {
  const dealData = await getPipedriveDeals(); // Wait for getPipedriveDeals to complete

  for (let deal of dealData) {
    await createNotionPage(deal); // Call createNotionPage for each deal
  }
}

// Call the function to fetch and process deals
//fetchAndProcessDeals();

// Function to fetch new deals from Pipedrive every fifteen minutes
async function fetchNewDealsPeriodically() {
  try {
    // Fetch and process deals initially
    await fetchAndProcessDeals();

    const intervalMinutes = 5;
    setInterval(async () => {
      console.log(`Fetching new deals every ${intervalMinutes} minutes...`);
      await fetchAndProcessDeals();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  } catch (error) {
    console.log("Error fetching and processing deals:", error);
  }
}

// Call the function to start fetching new deals periodically
//fetchNewDealsPeriodically();

// Function to check for changes in deal data every fifteen minutes
async function checkForDealChanges() {
  try {
    const intervalMinutes = 15;

    setInterval(async () => {
      console.log(
        `Checking for deal changes every ${intervalMinutes} minutes...`
      );

      const dealData = await getPipedriveDeals(); // Fetch Pipedrive deals

      for (let deal of dealData) {
        // Compare deal.value and unitsNumber with existing data
        const existingDeal = dealsArray.find(
          (existing) => existing.dealId === deal.dealId
        );

        if (
          existingDeal &&
          (existingDeal.value !== deal.value ||
            existingDeal.unitsNumber !== deal.unitsNumber)
        ) {
          // Deal data has changed, update Notion
          console.log(
            `Deal data has changed for deal ID ${deal.dealId}. Updating Notion...`
          );
          await createNotionPage(deal);
        }
      }
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  } catch (error) {
    console.error("Error checking for deal changes:", error);
  }
}

// Call the function to start periodically checking for deal changes
//checkForDealChanges();

module.exports = { getPipedriveDeals, createNotionPage };
