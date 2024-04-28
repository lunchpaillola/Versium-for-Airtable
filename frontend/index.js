import {
  initializeBlock,
  useBase,
  useRecords,
  Loader,
  Button,
  Box,
  Text,
  Heading,
  Dialog,
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

  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recordUpdates, setRecordUpdates] = useState(false);
  const globalConfig = useGlobalConfig();
  const apiKey = globalConfig.get("API Key");
  const tableId = globalConfig.get("Table");
  const viewId = globalConfig.get("View");
  const LinkedinFieldId = globalConfig.get("LinkedIn");
  const currentStep = globalConfig.get("CurrentStep");
  const fieldMappings = globalConfig.get("fieldMappings") || {};

  const table = base.getTableByIdIfExists(tableId);
  const view = table.getViewByIdIfExists(viewId);
  const tableName = table?.name;
  const viewName = view?.name;

  const records = useRecords(view, { fields: [LinkedinFieldId] });
  const recordCount = records.length;

  // Safe access with optional chaining and default values
  const FIRST_NAME_OUTPUT_FIELD_NAME = fieldMappings?.firstName || null;
  const LAST_NAME_OUTPUT_FIELD_NAME = fieldMappings?.lastName || null;
  const EMAIL_OUTPUT_FIELD_NAME = fieldMappings?.email || null;
  const TITLE_OUTPUT_FIELD_NAME = fieldMappings?.title || null;
  const BUSINESS_OUTPUT_FIELD_NAME = fieldMappings?.business || null;
  const COMPANY_DOMAIN_FIELD_NAME = fieldMappings?.domain || null;

  if (
    !apiKey ||
    !table ||
    !LinkedinFieldId ||
    !EMAIL_OUTPUT_FIELD_NAME ||
    !TITLE_OUTPUT_FIELD_NAME ||
    !BUSINESS_OUTPUT_FIELD_NAME ||
    !COMPANY_DOMAIN_FIELD_NAME ||
    currentStep !== 2
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
      LinkedinFieldId,
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
    setRecordUpdates(recordUpdates);
    setIsUpdateInProgress(false);
    setIsDialogOpen(true);
  }

  async function onReconfigureClick() {
    await globalConfig.setAsync("CurrentStep", 1);
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
      padding={3}
    >
      <Heading style={{ fontWeight: "bold", marginBottom: "16px" }}>
        Enrich {recordCount} Records in the {tableName} table
      </Heading>
      <Text style={{ marginBottom: "24px" }}>
        Based on the settings you've configured there are
        <span style={{ fontWeight: "bold" }}> {recordCount} </span>
        records that you want to enrich from view:
        <span style={{ fontWeight: "bold" }}> {viewName} </span>
        in table:
        <span style={{ fontWeight: "bold" }}> {tableName} </span>. To start
        enriching with Versium's API select the button below. To reconfigure
        records, select the "reconfigure" button below.
      </Text>
      {isUpdateInProgress ? (
        <Loader
          scale={0.8}
          style={{ alignItems: "center", justifyContent: "center" }}
        />
      ) : (
        <Fragment>
          <Button
            style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
            size="large" // Make the button larger
            onClick={onButtonClick}
            disabled={!permissionCheck.hasPermission}
            icon="plus" // Add an icon to the button (Assuming Airtable Blocks support button icons)
            marginBottom={1}
          >
            Enrich {recordCount} records
          </Button>
          <Button
            variant="default"
            size="small"
            onClick={onReconfigureClick}
            style={{
              background: "transparent",
              color: "#6C57C0",
              border: "none",
              boxShadow: "none",
            }}
          >
            Reconfigure selection
          </Button>
          {!permissionCheck.hasPermission && (
            <p style={{ color: "red", marginTop: "10px", textAlign: "center" }}>
              {permissionCheck.reasonDisplayString}
            </p>
          )}
        </Fragment>
      )}
      {isDialogOpen && (
        <Dialog onClose={() => setIsDialogOpen(false)}>
          <Heading>Enrichment completed</Heading>
          <Text>
            The extension found matches and enriched {recordUpdates.length} out
            of {recordCount} total records. Reconfigure settings to enrich a
            different set of records.
          </Text>
          <Button marginTop={3} onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </Dialog>
      )}
    </Box>
  );
}

async function getEnrichment(
  LinkedinFieldId,
  records,
  apiKey,
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
    const linkedinUrl = record.getCellValueAsString(LinkedinFieldId);
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
