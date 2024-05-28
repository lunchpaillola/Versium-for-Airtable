import {
  initializeBlock,
  useBase,
  useRecords,
  Loader,
  Button,
  Box,
  Text,
  Heading,
  useGlobalConfig,
} from "@airtable/blocks/ui";
import React, { Fragment, useState } from "react";
import OnboardingScreen from "./OnboardingScreen";
import { CustomDialog } from "./components";

/** Constants */
const MAX_RECORDS_PER_UPDATE = 50; // Airtable SDK limit: we can only update 50 records at a time.
const API_ENDPOINT = "https://api.versium.com/v2";

/**
 * Main React component for the Airtable Extension, handling the configuration and interaction logic for data enrichment using Versium's API.
 */

function VersiumEnrichment() {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recordUpdates, setRecordUpdates] = useState(false);

  const apiKey = globalConfig.get("API Key");
  const tableId = globalConfig.get("Table");
  const viewId = globalConfig.get("View");
  const LinkedinFieldId = globalConfig.get("LinkedIn");
  const currentStep = globalConfig.get("CurrentStep");
  const fieldMappings = globalConfig.get("fieldMappings") || {};
  const table = base && base.getTableByIdIfExists(tableId);
  const view = table && table.getViewByIdIfExists(viewId);

  const {
    firstName: FIRST_NAME_OUTPUT_FIELD_NAME,
    lastName: LAST_NAME_OUTPUT_FIELD_NAME,
    email: EMAIL_OUTPUT_FIELD_NAME,
    title: TITLE_OUTPUT_FIELD_NAME,
    business: BUSINESS_OUTPUT_FIELD_NAME,
    domain: COMPANY_DOMAIN_FIELD_NAME,
  } = fieldMappings;

  const tableName = table && table.name;
  const viewName = view && view.name;

  const records = useRecords(view, { fields: [LinkedinFieldId] });
  const recordCount = records && records.length;

  if (
    !apiKey ||
    !tableId ||
    !viewId ||
    !LinkedinFieldId ||
    !currentStep ||
    !fieldMappings ||
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

  /**
   * Handles click event for the button that triggers the enrichment process.
   */

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

  /**
   * Resets configuration steps and opens onboarding screen for reconfiguration.
   */
  async function onReconfigureClick() {
    await globalConfig.setAsync("CurrentStep", 1);
    return <OnboardingScreen />;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      maxWidth="640px"
      padding={3}
      margin="auto"
    >
      <Heading style={{ fontWeight: "bold", marginBottom: "16px" }}>
        Enrich {recordCount} Records in the {tableName} table
      </Heading>
      <Text style={{ marginBottom: "24px" }}>
        Based on the settings configured there are
        <span style={{ fontWeight: "bold" }}> {recordCount} </span>
        records that you want to enrich from view:
        <span style={{ fontWeight: "bold" }}> {viewName} </span>
        in table:
        <span style={{ fontWeight: "bold" }}> {tableName} </span>.
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
            size="large"
            onClick={onButtonClick}
            disabled={!permissionCheck.hasPermission}
            marginBottom={1}
          >
            Begin enrichment
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
            Reselect records
          </Button>
          {!permissionCheck.hasPermission && (
            <p style={{ color: "red", marginTop: "10px", textAlign: "center" }}>
              {permissionCheck.reasonDisplayString}
            </p>
          )}
        </Fragment>
      )}
      {isDialogOpen && (
        <CustomDialog
          title="Enrichment Completed"
          onClose={() => setIsDialogOpen(false)}
        >
          The extension found matches and enriched {recordUpdates.length} out of{" "}
          {recordCount} total records.
        </CustomDialog>
      )}
    </Box>
  );
}

/**
 * Fetches enrichment data from the Versium API for each LinkedIn URL and updates Airtable records.
 * @param {string} LinkedinFieldId - Field ID for LinkedIn URL.
 * @param {Array} records - Array of records to be updated.
 * @param {string} apiKey - API key for Versium API.
 * @param {...string} fieldNames - Output field names for updating records.
 * @returns {Array} - Array of record updates.
 */

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
    const linkedinUrl = record.getCellValueAsString(LinkedinFieldId);
    const requestUrl = `${API_ENDPOINT}/c2b?li_url=${encodeURIComponent(
      linkedinUrl
    )}`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "X-Versium-Api-Key": apiKey,
      },
    });

    const responseJson = await response.json();

    if (
      responseJson.versium &&
      responseJson.versium.results &&
      responseJson.versium.results.length > 0
    ) {
      const result = responseJson.versium.results[0];

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

    await delayAsync(50);
  }
  return recordUpdates;
}

/**
 * Updates Airtable records in batches, adhering to API limits.
 * @param {object} table - Airtable table object.
 * @param {Array} recordUpdates - Array of updates to be processed.
 */

async function updateRecordsInBatchesAsync(table, recordUpdates) {
  let i = 0;
  while (i < recordUpdates.length) {
    const updateBatch = recordUpdates.slice(i, i + MAX_RECORDS_PER_UPDATE);
    await table.updateRecordsAsync(updateBatch);
    i += MAX_RECORDS_PER_UPDATE;
  }
}

/**
 * Delays execution by a specified number of milliseconds.
 * @param {number} ms - Milliseconds to delay.
 * @returns {Promise} - A promise that resolves after the delay.
 */
function delayAsync(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

initializeBlock(() => <VersiumEnrichment />);
