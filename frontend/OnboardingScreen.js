import {
  Box,
  Button,
  Loader,
  useGlobalConfig,
  useBase,
} from "@airtable/blocks/ui";
import { APIKeyInput, CustomDialog, SettingsComponent } from "./components";
import React, { useState, useEffect } from "react";

function OnboardingScreen() {
  const globalConfig = useGlobalConfig();
  const base = useBase();

  const [state, setState] = useState({});
  const {
    apiKey,
    isLoading,
    error,
    currentStep,
    selectedTable,
    selectedView,
    selectedLinkedin,
    selectedEmail,
    selectedTitle,
    selectedBusiness,
    selectedDomain,
    selectedFirstName,
    selectedLastName,
  } = state || {};

  useEffect(() => {
    const fetchInitialState = async () => {
      const tableId = globalConfig.get("Table");
      const selectedTable = base.getTableIfExists(tableId);
      console.log("selectedTable", selectedTable);
      let initialState = {
        apiKey: globalConfig.get("API Key") || null,
        isLoading: false,
        error: "",
        currentStep: globalConfig.get("CurrentStep") || 0,
        selectedTable: selectedTable,
      };

      if (selectedTable) {
        initialState = {
          ...initialState,
          selectedView:
            selectedTable.getViewByIdIfExists(globalConfig.get("View")) || null,
          selectedLinkedin:
            selectedTable.getFieldByIdIfExists(globalConfig.get("LinkedIn")) ||
            null,
        };

        const fieldMappings = globalConfig.get("fieldMappings");

        if (fieldMappings) {
          initialState = {
            ...initialState,
            selectedEmail:
              selectedTable.getFieldByIdIfExists(fieldMappings.email) || null,
            selectedTitle:
              selectedTable.getFieldByIdIfExists(fieldMappings.title) || null,
            selectedBusiness:
              selectedTable.getFieldByIdIfExists(fieldMappings.business) ||
              null,
            selectedDomain:
              selectedTable.getFieldByIdIfExists(fieldMappings.domain) || null,
            selectedFirstName:
              selectedTable.getFieldByIdIfExists(fieldMappings.firstName) ||
              null,
            selectedLastName:
              selectedTable.getFieldByIdIfExists(fieldMappings.lastName) ||
              null,
          };
        }
      }

      setState(initialState);
    };

    fetchInitialState();
  }, [base, globalConfig]);

  /**
   * Update state with new values.
   * @param {Object} updates - New values to update the state.
   */
  const updateState = (updates) =>
    setState((prev) => ({ ...prev, ...updates }));

  /**
   * Navigates to the specified step by changing the current step in both the local state and global configuration.
   *
   * @param {number} stepChange - The increment or decrement to apply to the current step.
   * @returns {Promise<void>} - Resolves when the step change is successfully saved to the global configuration.
   */

  const navigateSteps = async (newStep) => {
    await globalConfig.setAsync("CurrentStep", newStep);
    updateState({ currentStep: newStep });
  };

  /**
   * Checks if the current user has permission to set any keys in the global configuration.
   * Updates the UI state with an error message if permission is denied.
   *
   * @async
   * @function checkGlobalConfigPermissions
   * @returns {Promise<boolean>} Returns `true` if the user has permission to set global configuration keys, otherwise `false`.
   */
  async function checkGlobalConfigPermissions() {
    const setUnknownKeyCheckResult = globalConfig.checkPermissionsForSet();
    console.log("setUnknownKeyCheckResult", setUnknownKeyCheckResult);
    if (!setUnknownKeyCheckResult.hasPermission) {
      // Display the reason and halt further execution if permission is denied
      updateState({
        error: setUnknownKeyCheckResult.reasonDisplayString,
      });
      return false; // Indicate permission denial
    }
    return true; // Indicate permission granted
  }

  /**
   * Validates the provided API key by making a request to the API.
   * If the API key is valid, updates the UI and global configuration.
   *
   * @return {Promise<boolean>} - Returns `true` if the API key is valid, otherwise `false`.
   */
  const validateApiKey = async () => {
    updateState({ isLoading: true });
    // Check global configuration permissions before making any changes
    if (!(await checkGlobalConfigPermissions())) {
      console.log("Insufficient permissions to set global configuration.");
      return false;
    }
    const testUrl = "https://api.versium.com/v2/contact";
    console.log("Validating apiKey:", apiKey);

    try {
      const response = await fetch(testUrl, {
        method: "GET",
        headers: { "x-versium-api-key": apiKey },
      });

      const data = await response.json();

      if (
        response.status === 401 ||
        (data.versium &&
          data.versium.errors &&
          data.versium.errors.includes("Invalid api key provided."))
      ) {
        console.error(
          "Invalid API Key provided. Please check your key and try again."
        );
        updateState({
          error:
            "Invalid API Key provided. Please check your key and try again.",
        });
        return false;
      }

      // If validation is successful, update the global configuration and UI
      await globalConfig.setAsync("API Key", apiKey);
      await navigateSteps(1);
      updateState({ isLoading: false });
      return true;
    } catch (err) {
      console.error("Error validating API key:", err);
      updateState({
        error: "Error validating API key. Please try again.",
        isLoading: false,
      });
      return false;
    }
  };

  /**
   * Handles the completion of the current onboarding step and progresses to the next step.
   * It performs validation checks and updates global configuration based on the current step.
   * Handles different cases like table selection, view selection, LinkedIn field selection, and field mappings.
   *
   * @returns {Promise<void>} - Executes asynchronous operations based on the current onboarding step.
   */
  const handleComplete = async () => {
    updateState({ isLoading: true });

    try {
      if (currentStep === 1) {
        if (!(await checkGlobalConfigPermissions())) {
          console.log("Insufficient permissions to set global configuration.");
          updateState({
            error: "Insufficient permissions to modify the configuration.",
          });
          return;
        }

        await globalConfig.setPathsAsync([
          { path: ["Table"], value: selectedTable.id },
          { path: ["View"], value: selectedView.id },
          { path: ["LinkedIn"], value: selectedLinkedin.id },
          { path: ["fieldMappings", "firstName"], value: selectedFirstName.id },
          { path: ["fieldMappings", "lastName"], value: selectedLastName.id },
          { path: ["fieldMappings", "email"], value: selectedEmail.id },
          { path: ["fieldMappings", "title"], value: selectedTitle.id },
          { path: ["fieldMappings", "business"], value: selectedBusiness.id },
          { path: ["fieldMappings", "domain"], value: selectedDomain.id },
        ]);

        await navigateSteps(2);
      } else if (currentStep === 0) {
        // If currentStep is 0, validate API key and navigate steps
        await validateApiKey();
      }
    } catch (error) {
      console.error("Error updating globalConfig:", error);
      updateState({
        error: "An error occurred while updating the configuration.",
        isLoading: false,
      });
    } finally {
      // Ensure the loading state is updated in all scenarios
      updateState({ isLoading: false });
    }
  };

  return (
    <Box display="flex" flexDirection="column" padding={3}>
      {(currentStep === 0 || !apiKey) && (
        <APIKeyInput
          apiKey={apiKey}
          updateState={updateState}
          handleComplete={handleComplete}
        />
      )}

      {currentStep === 1 && (
        <>
          <SettingsComponent
            selectedTable={selectedTable}
            selectedView={selectedView}
            selectedLinkedin={selectedLinkedin}
            selectedEmail={selectedEmail}
            selectedTitle={selectedTitle}
            selectedBusiness={selectedBusiness}
            selectedDomain={selectedDomain}
            selectedFirstName={selectedFirstName}
            selectedLastName={selectedLastName}
            updateState={updateState}
            handleComplete={handleComplete}
          />
          <Button
            variant="default"
            size="small"
            onClick={() => navigateSteps(0)}
            style={{
              background: "transparent",
              color: "#6C57C0",
              border: "none",
              boxShadow: "none",
            }}
          >
            Reconnect API Key
          </Button>
        </>
      )}

      {error && (
        <CustomDialog
          title="Error"
          onClose={() => updateState({ error: "" })}
          color="red"
        >
          {error}
        </CustomDialog>
      )}

      {isLoading && <Loader />}
    </Box>
  );
}

export default OnboardingScreen;
