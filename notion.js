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
    throw new Error("Invalid pipeDealId format");
  }

  const database_id = process.env.NOTION_DATABASE_ID;
  const response = await notion.databases.query({
    database_id: database_id,
    filter: {
      property: "PipeDealId",
      rich_text: {
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
async function createNotionPage(pipeDealId) {
  console.log("importedDealIds:", importedDealIds); // Debug: Print the imported deal IDs

  const dealData = await getPipedriveDeals(); // Wait for getPipedriveDeals to complete

  for (let deal of dealsArray) {
    console.log("Processing deal ID:", deal.dealId); // Debug: Print the current deal ID

    // Check if a page with the same "PipeDealId" exists in Notion
    const existingPage = await findNotionPageByPipeDealId(deal.pipeDealId);

    for (let deal of dealsArray) {
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
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: deal.pipeDealId,
                  },
                },
              ],
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
  }
}
module.exports = { getPipedriveDeals, createNotionPage };
