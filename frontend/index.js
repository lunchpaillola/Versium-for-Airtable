import {
  initializeBlock,
  useBase,
  useRecords,
  Loader,
  Button,
  Box,
} from "@airtable/blocks/ui";
import React, { Fragment, useState } from "react";

const TABLE_NAME = "Leads";
const LINKEDIN_FIELD_NAME = "Linkedin";
const FIRST_NAME_OUTPUT_FIELD_NAME = "First Name";
const LAST_NAME_OUTPUT_FIELD_NAME = "Last Name";
const EMAIL_OUTPUT_FIELD_NAME = "Email";
const TITLE_OUTPUT_FIELD_NAME = "Title";
const BUSINESS_OUTPUT_FIELD_NAME = "Business";
const COMPANY_DOMAIN_FIELD_NAME = "Company Domain";

// Airtable SDK limit: we can only update 50 records at a time. For more details, see
// https://support.airtable.com/docs/managing-api-call-limits-in-airtable#:~:text=Airtable%20enforces%20a%20rate%20limit,given%20user%20or%20service%20account.
const MAX_RECORDS_PER_UPDATE = 50;

const API_ENDPOINT = "https://api.versium.com/v2";

function VersiumEnrichment() {
  const base = useBase();

  const table = base.getTableByName(TABLE_NAME);
  const LinkedinField = table.getFieldByName(LINKEDIN_FIELD_NAME);

  // load the records ready to be updated
  // we only need to load the word field - the others don't get read, only written to.
  const records = useRecords(table, { fields: [LinkedinField] });

  // keep track of whether we have up update currently in progress - if there is, we want to hide
  // the update button so you can't have two updates running at once.
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);

  // check whether we have permission to update our records or not. Any time we do a permissions
  // check like this, we can pass in undefined for values we don't yet know. Here, as we want to
  // make sure we can update the Output field, we make sure to include them even
  // though we don't know the values we want to use for them yet.
  const permissionCheck = table.checkPermissionsForUpdateRecord(undefined, {
    [FIRST_NAME_OUTPUT_FIELD_NAME]: undefined,
    [LAST_NAME_OUTPUT_FIELD_NAME]: undefined,
    [EMAIL_OUTPUT_FIELD_NAME]: undefined,
    [TITLE_OUTPUT_FIELD_NAME]: undefined,
    [BUSINESS_OUTPUT_FIELD_NAME]: undefined,
    [COMPANY_DOMAIN_FIELD_NAME]: undefined,
  });

  async function onButtonClick() {
    setIsUpdateInProgress(true);
    const recordUpdates = await getEnrichment(table, LinkedinField, records);
    await updateRecordsInBatchesAsync(table, recordUpdates);
    setIsUpdateInProgress(false);
  }

  return (
    <Box
      // Center the content horizontally and vertically
      position="absolute"
      top="0"
      bottom="0"
      left="0"
      right="0"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={3} // Add some padding around the content
    >
      <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
        🌟Data Enrichment
      </h2>
      <p style={{ textAlign: "center", marginBottom: "40px", maxWidth: "80%" }}>
        Enrich your leads with business information, insights, emails and more.
      </p>
      {isUpdateInProgress ? (
        <Loader />
      ) : (
        <Fragment>
          <Button
            variant="primary"
            size="large" // Make the button larger
            onClick={onButtonClick}
            disabled={!permissionCheck.hasPermission}
            icon="plus" // Add an icon to the button (Assuming Airtable Blocks support button icons)
            marginBottom={3}
          >
           Start enriching
          </Button>
          {!permissionCheck.hasPermission && (
            <p style={{ color: "red", marginTop: "10px", textAlign: "center" }}>
              {permissionCheck.reasonDisplayString}
            </p>
          )}
        </Fragment>
      )}
    </Box>
  );
}

async function getEnrichment(table, LinkedinField, records) {
  const recordUpdates = [];
  for (const record of records) {
    // For each record, we take the email address and make an API request to Versium:
    const linkedinUrl = record.getCellValueAsString(LinkedinField); // Ensure `emailField` is defined and corresponds to the field in your records containing the email addresses.
    const requestUrl = `${API_ENDPOINT}/c2b?li_url=${encodeURIComponent(
      linkedinUrl
    )}`;

    const response = await fetch(requestUrl, {
      method: "GET", // The Versium API requires a GET request.
      headers: {
        "X-Versium-Api-Key": "<versium api key>", // Make sure to replace '<Your Versium API Key Here>' with your actual API key.
      },
    });

    const responseJson = await response.json();

    // Check if there are results and extract the needed information
    if (
      responseJson.versium &&
      responseJson.versium.results &&
      responseJson.versium.results.length > 0
    ) {
      const result = responseJson.versium.results[0]; // Assuming we're only interested in the first result

      // Update the record with the Business and Email Address from Versium's response
      recordUpdates.push({
        id: record.id,
        fields: {
          [FIRST_NAME_OUTPUT_FIELD_NAME]: result["First Name"],
          [LAST_NAME_OUTPUT_FIELD_NAME]: result["Last Name"],
          [EMAIL_OUTPUT_FIELD_NAME]: result["Email Address"],
          [TITLE_OUTPUT_FIELD_NAME]: result["Title"],
          [BUSINESS_OUTPUT_FIELD_NAME]: result["Business"],
          [COMPANY_DOMAIN_FIELD_NAME]: result["Domain"],
        },
      });
    }

    // Wait a short time between requests to avoid rate limiting
    await delayAsync(50);
  }
  return recordUpdates;
}

async function updateRecordsInBatchesAsync(table, recordUpdates) {
  // Fetches & saves the updates in batches of MAX_RECORDS_PER_UPDATE to stay under size limits.
  let i = 0;
  while (i < recordUpdates.length) {
    const updateBatch = recordUpdates.slice(i, i + MAX_RECORDS_PER_UPDATE);
    // await is used to wait for the update to finish saving to Airtable servers before
    // continuing. This means we'll stay under the rate limit for writes.
    await table.updateRecordsAsync(updateBatch);
    i += MAX_RECORDS_PER_UPDATE;
  }
}

function delayAsync(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

initializeBlock(() => <VersiumEnrichment />);
