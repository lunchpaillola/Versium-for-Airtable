import {
  initializeBlock,
  useBase,
  useRecords,
  Loader,
  Button,
  Box,
  useGlobalConfig,
} from "@airtable/blocks/ui";
import React, { Fragment, useState } from "react";
import OnboardingScreen from "./OnboardingScreen";

// Airtable SDK limit: we can only update 50 records at a time. For more details, see
// https://support.airtable.com/docs/managing-api-call-limits-in-airtable#:~:text=Airtable%20enforces%20a%20rate%20limit,given%20user%20or%20service%20account.
const MAX_RECORDS_PER_UPDATE = 50;

const API_ENDPOINT = "https://api.versium.com/v2";

function VersiumEnrichment() {
  const base = useBase();

  // load the records ready to be updated
  // we only need to load the word field - the others don't get read, only written to.
  const records = useRecords(table, { fields: [LinkedinField] });

  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const globalConfig = useGlobalConfig();
  const apiKey = globalConfig.get("API Key");
  const tableId = globalConfig.get("Table");
  const LinkedinFieldId = globalConfig.get("LinkedIn");
  const currentStep = globalConfig.get("CurrentStep");

  const fieldMappings = globalConfig.get("fieldMappings") || {};

  const table = base.getTableByIdIfExists(tableId);
  const LinkedinField = table.getFieldByIdIfExists(LinkedinFieldId);

  // Safe access with optional chaining and default values
  const FIRST_NAME_OUTPUT_FIELD_NAME = "First Name";
  const LAST_NAME_OUTPUT_FIELD_NAME = "Last Name";
  const EMAIL_OUTPUT_FIELD_NAME = fieldMappings.email || null;
  const TITLE_OUTPUT_FIELD_NAME = fieldMappings.title || null;
  const BUSINESS_OUTPUT_FIELD_NAME = fieldMappings.business || null;
  const COMPANY_DOMAIN_FIELD_NAME = fieldMappings.domain || null;

  if (
    !apiKey ||
    !table ||
    !LinkedinField ||
    !EMAIL_OUTPUT_FIELD_NAME ||
    !TITLE_OUTPUT_FIELD_NAME ||
    !BUSINESS_OUTPUT_FIELD_NAME ||
    !COMPANY_DOMAIN_FIELD_NAME ||
    currentStep !== 5
  ) {
    return <OnboardingScreen />;
  }

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
    const recordUpdates = await getEnrichment(
      table,
      LinkedinField,
      records,
      apiKey,
      FIRST_NAME_OUTPUT_FIELD_NAME,
      LAST_NAME_OUTPUT_FIELD_NAME,
      EMAIL_OUTPUT_FIELD_NAME,
      TITLE_OUTPUT_FIELD_NAME,
      BUSINESS_OUTPUT_FIELD_NAME,
      COMPANY_DOMAIN_FIELD_NAME
    );
    await updateRecordsInBatchesAsync(table, recordUpdates);
    setIsUpdateInProgress(false);
  }

  async function onReconfigureClick() {
    await globalConfig.setAsync("CurrentStep", 0);
    return <OnboardingScreen />;
  }

  return (
    <Box
      position="absolute"
      top="0"
      bottom="0"
      left="0"
      right="0"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={3}
    >
      <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
        🌟 Versium for Airtable
      </h2>
      <p style={{ textAlign: "center", marginBottom: "40px", maxWidth: "80%" }}>
        Transform your marketing data with Versium for Airtable, a suite of
        powerful data enrichment and cleansing tools seamlessly integrated into
        your Airtable workflow.
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
          <Button
            variant="default"
            size="small"
            onClick={onReconfigureClick}
            style={{
              marginTop: "10px",
              background: "transparent", // No background color
              color: "#0070f3", // Optional: choose a color that fits your design
              border: "none", // No border
              boxShadow: "none", // No shadow
            }}
          >
            Reconfigure fields
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

async function getEnrichment(
  apiKey,
  LinkedinField,
  records,
  FIRST_NAME_OUTPUT_FIELD_NAME,
  LAST_NAME_OUTPUT_FIELD_NAME,
  EMAIL_OUTPUT_FIELD_NAME,
  TITLE_OUTPUT_FIELD_NAME,
  BUSINESS_OUTPUT_FIELD_NAME,
  COMPANY_DOMAIN_FIELD_NAME
) {
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
        "X-Versium-Api-Key": apiKey,
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
