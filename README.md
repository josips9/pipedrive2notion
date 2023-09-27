# Pipedrive 2 Notion app

Pipedrive to Notion Data Synchronization

## Getting started

- clone this repo
- in your folder, run in terminal run:
  - npm install
  - touch .env file and set your Pipedrive and Notion API's. Set variable for Notion database id
  - npm run devStart
  - open browser localhost:3000/pipedrive-deals

## Overview:

The Pipedrive to Notion Data Synchronization app is a powerful tool that automates the process of importing and updating Pipedrive deal data into Notion databases. This application seamlessly connects two popular platforms, Pipedrive (a customer relationship management tool) and Notion (a versatile productivity and database management tool), allowing businesses to streamline their workflow and centralize their data.

## Key Features:

**Data Retrieval from Pipedrive**: The app retrieves deal data from Pipedrive, including deal titles, associated contact names and email addresses, organization details, deal owner, deal value, and other relevant information.

**Data Transformation**: The retrieved data is transformed into a structured format suitable for Notion databases. This includes formatting email addresses, handling organization details, and enriching deal data.

**Data Validation**: Before importing data into Notion, the app validates the format of the Pipedrive deal ID to ensure it meets the required criteria. Invalid IDs are flagged, and the app provides detailed error messages for easy debugging.

**Notion Integration**: The app seamlessly integrates with Notion, utilizing the Notion API to create, update, or skip records in a specified Notion database.

**Duplicate Handling**: The app checks if a page with the same "PipeDealId" already exists in Notion. If a duplicate is detected, the app skips the import, preventing redundant entries in the database.

## Workflow:

**Authentication**: The app uses API keys to authenticate with both Pipedrive and Notion, ensuring secure data access.

**Data Retrieval**: It fetches deal data from Pipedrive, including associated contact and organization information.

**Data Transformation**: The app processes and enhances the data to ensure compatibility with Notion's database structure.

**Data Validation**: The app verifies the format of Pipedrive deal IDs, ensuring they are in the correct format for use in Notion.

**Data Import**: Validated data is sent to Notion, creating new database entries or updating existing ones as needed.

**Duplicate Handling**: Duplicate Pipedrive deal IDs are identified, and their import is skipped to maintain database integrity.

**Logging and Debugging**: The app provides detailed logging and debugging capabilities, making it easy to monitor the synchronization process and troubleshoot any issues.

## Benefits:

**Efficiency**: Businesses can automate the import process, saving time and reducing manual data entry.

**Data Accuracy**: The app ensures data accuracy by validating and transforming information from Pipedrive to fit Notion's database structure.

**Centralization**: All deal data is centralized in Notion, making it easily accessible and searchable.

**Error Handling**: Detailed error messages help users quickly identify and resolve any issues.

**Customization**: The app's modular design allows for customization to suit unique business needs.

## Use Cases:

**Sales Teams**: Sales teams can use the app to synchronize their Pipedrive deals with Notion databases, ensuring up-to-date and organized customer information.

**Project Management**: Project managers can centralize project-related data from Pipedrive into Notion, enhancing collaboration and project tracking.

**Marketing Campaigns**: Marketing teams can import campaign data and associated contacts from Pipedrive into Notion, facilitating campaign analysis and reporting.

## Requirements:

Pipedrive and Notion accounts with appropriate API access.
Environment variables for API keys and database IDs.

## Conclusion:

The Pipedrive to Notion Data Synchronization app offers a powerful solution for businesses looking to streamline their data management between Pipedrive and Notion. By automating data retrieval, transformation, validation, and import processes, this app empowers teams to work more efficiently, maintain data accuracy, and centralize critical information in Notion databases. Whether you're managing sales, projects, or marketing campaigns, this app can enhance your workflow and data management capabilities.
