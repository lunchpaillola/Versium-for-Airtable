import {
  Box,
  Button,
  Input,
  Select,
  Loader,
  Text,
  Dialog,
  useBase,
  useGlobalConfig,
} from "@airtable/blocks/ui";
import React, { useState } from "react";

function OnboardingScreen() {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const [state, setState] = useState({
    apiKey: "",
    isLoading: false,
    error: "",
    currentStep: 0,
    selectedTableId: null,
    selectedViewId: null,
    selectedLinkedinId: null,
    selectedEmailId: null,
    selectedTitleId: null,
    selectedBusinessId: null,
    selectedDomainId: null,
    selectedFirstNameId: null,
    selectedLastNameId: null,
  });

  const updateState = (updates) =>
    setState((prev) => ({ ...prev, ...updates }));

  /**
   * Navigates to the specified step by changing the current step in both the local state and global configuration.
   *
   * @param {number} stepChange - The increment or decrement to apply to the current step.
   * @returns {Promise<void>} - Resolves when the step change is successfully saved to the global configuration.
   */

  const navigateSteps = async (stepChange) => {
    const newStep = state.currentStep + stepChange;
    await globalConfig.setAsync("CurrentStep", newStep); // Update CurrentStep in global config
    updateState({ currentStep: newStep });
  };

  const {
    apiKey,
    isLoading,
    error,
    currentStep,
    selectedTableId,
    selectedViewId,
    selectedLinkedinId,
    selectedEmailId,
    selectedTitleId,
    selectedBusinessId,
    selectedDomainId,
    selectedFirstNameId,
    selectedLastNameId,
  } = state;

  const tables = base.tables.map((table) => ({
    value: table.id,
    label: table.name,
  }));

  const views = selectedTableId
    ? base.getTableById(selectedTableId).views.map((view) => ({
        value: view.id,
        label: view.name,
      }))
    : [];

  const fields = selectedTableId
    ? base.getTableById(selectedTableId).fields.map((field) => ({
        value: field.id,
        label: field.name,
      }))
    : [];

  /**
   * Validates the provided API key by making a request to the API.
   * If the API key is valid, updates the UI and global configuration.
   *
   * @param {string} apiKey - The API key to validate.
   * @return {Promise<boolean>} - Returns `true` if the API key is valid, otherwise `false`.
   */
  const validateApiKey = async (apiKey) => {
    updateState({ isLoading: true });
    const testUrl = "https://api.versium.com/v2/contact";
    console.log("Validating apiKey:", apiKey);

    try {
      const response = await fetch(testUrl, {
        method: "GET", // Specify the method if needed, usually 'GET' for validation
        headers: {
          "x-versium-api-key": apiKey,
        },
      });

      // Parse the JSON response
      const data = await response.json();

      // Check for unauthorized error or specific API error messages indicating an invalid API key
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
        return false; // API key is invalid
      }

      // If the code reaches here, assume the API key is valid
      await globalConfig.setAsync("API Key", apiKey);
      await navigateSteps(1);
      updateState({ isLoading: false });
      return true; // API key is valid
    } catch (err) {
      console.error("Error validating API key:", err);
      return false; // Assume the API key is invalid in case of an error
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

    switch (currentStep) {
      case 0:
        break;

      case 1:
        // Validate table selection and update global configuration
        if (!selectedTableId) {
          updateState({ error: "Please select a table.", isLoading: false });
          return;
        }
        try {
          await globalConfig.setAsync("Table", selectedTableId);
          await navigateSteps(1);
        } catch (error) {
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
          });
        }
        break;

      case 2:
        // Validate view selection and update global configuration
        // Additional steps for views, LinkedIn field, etc.
        if (!selectedViewId) {
          updateState({
            error: "Please select a view.",
            isLoading: false,
          });
          return;
        }
        try {
          await globalConfig.setAsync("View", selectedViewId);
          await navigateSteps(1);
        } catch (error) {
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
          });
        }
        break;

      case 3:
        if (!selectedLinkedinId) {
          updateState({
            error: "Please select a field to provide LinkedIn.",
            isLoading: false,
          });
          return;
        }
        try {
          await globalConfig.setAsync("LinkedIn", selectedLinkedinId);
          await navigateSteps(1);
        } catch (error) {
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
          });
        }
        break;

      case 4:
        // You should validate field selections here as well, similar to the API key validation
        if (
          !selectedEmailId ||
          !selectedTitleId ||
          !selectedBusinessId ||
          !selectedDomainId
        ) {
          updateState({
            error: "Please complete all field mappings.",
            isLoading: false,
          });
          return;
        }

        // Finalize setup and save configurations
        try {
          await globalConfig.setAsync("fieldMappings", {
            email: selectedEmailId,
            title: selectedTitleId,
            business: selectedBusinessId,
            domain: selectedDomainId,
          });
          await navigateSteps(1);
        } catch (error) {
          console.error("Error saving onboarding configuration:", error);
          updateState({
            error: "Failed to save onboarding configuration.",
          });
        }
        break;

      default:
        updateState({
          error: "Unexpected step encountered.",
        });
        break;
    }

    updateState({
      isLoading: false,
    });
  };

  return (
    <Box display="flex" flexDirection="column" padding={3}>
      {currentStep === 0 && (
        <>
          {/* API Key Input Step */}
          <h1
            style={{
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: "16px",
            }}
          >
            Versium for airtable
          </h1>
          <Text style={{ paddingBottom: "12px" }}>
            Transform your marketing data with Versium for Airtable, a suite of
            powerful data enrichment and cleansing tools seamlessly integrated
            into your Airtable workflow.
          </Text>
          <Text style={{ paddingBottom: "12px" }}>
            Enter your API key then complete configuring your fields to get
            started:
          </Text>
          <Input
            value={apiKey}
            onChange={(e) =>
              updateState({
                apiKey: e.target.value,
              })
            }
            placeholder="Enter your API Key"
            style={{ marginBottom: "24px" }}
          />
          <Button
            onClick={() => validateApiKey(apiKey)}
            disabled={!apiKey}
            marginTop={3}
            style={{ backgroundColor: "#007bff", color: "#ffffff" }}
          >
            Next: Select Table
          </Button>
        </>
      )}

      {currentStep === 1 && (
        <>
          {/* Table Selection Step */}
          <Text paddingBottom={3}>
            Select the table with the records you want to enrich:
          </Text>
          <Select
            options={tables}
            value={selectedTableId}
            onChange={(newValue) => {
              updateState({
                selectedTableId: newValue,
                selectedViewId: null, // Reset view selection when table changes
              });
            }}
            width="100%"
          />
          <Button
            onClick={handleComplete}
            disabled={!selectedTableId}
            marginTop={3}
            style={{ backgroundColor: "#007bff", color: "#ffffff" }}
          >
            Next: Select View
          </Button>
        </>
      )}

      {currentStep === 2 && selectedTableId && (
        <>
          {/* View Selection Step */}
          <Text paddingBottom={3}>Select the view:</Text>
          <Select
            options={views}
            value={selectedViewId}
            onChange={(newValue) =>
              updateState({
                selectedViewId: newValue,
              })
            }
            width="100%"
          />
          <Button
            onClick={handleComplete}
            disabled={!selectedViewId}
            marginTop={3}
            style={{ backgroundColor: "#007bff", color: "#ffffff" }}
          >
            Next: Map Input Field
          </Button>
        </>
      )}

      {currentStep === 3 && selectedTableId && (
        <>
          {/* View Selection Step */}
          <Text paddingBottom={3}>
            Select the LinkedIn url that the extension should enrich:
          </Text>
          {/* LinkedIn ID Field Mapping */}
          <Select
            options={fields}
            value={selectedLinkedinId}
            onChange={(newValue) =>
              updateState({
                selectedLinkedinId: newValue,
              })
            }
            width="100%"
            placeholder="LinkedIn ID Field"
          />
          <Button
            onClick={handleComplete}
            disabled={!selectedViewId}
            marginTop={3}
            style={{ backgroundColor: "#007bff", color: "#ffffff" }}
          >
            Next: Map Output Fields
          </Button>
        </>
      )}

      {currentStep === 4 && selectedTableId && (
        <>
          {/* Field Mapping Step */}
          <Text paddingBottom={3}>Map Output fields:</Text>

          {/* First name field mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            First name field
          </Text>
          <Select
            options={fields}
            value={selectedFirstNameId}
            onChange={(newValue) =>
              updateState({
                selectedFirstNameId: newValue,
              })
            }
            width="100%"
            placeholder="First name field"
          />

          {/* Last name field mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Last name field
          </Text>
          <Select
            options={fields}
            value={selectedLastNameId}
            onChange={(newValue) =>
              updateState({
                selectedLastNameId: newValue,
              })
            }
            width="100%"
            placeholder="Last name field"
          />

          {/* Email Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Email field
          </Text>
          <Select
            options={fields}
            value={selectedEmailId}
            onChange={(newValue) =>
              updateState({
                selectedEmailId: newValue,
              })
            }
            width="100%"
            placeholder="Email Field"
          />

          {/* Title Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Title field
          </Text>
          <Select
            options={fields}
            value={selectedTitleId}
            onChange={(newValue) =>
              updateState({
                selectedTitleId: newValue,
              })
            }
            width="100%"
            placeholder="Title Field"
          />

          {/* Business Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Business field
          </Text>
          <Select
            options={fields}
            value={selectedBusinessId}
            onChange={(newValue) =>
              updateState({
                selectedBusinessId: newValue,
              })
            }
            width="100%"
            placeholder="Business Field"
          />

          {/* Domain Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Domain field
          </Text>
          <Select
            options={fields}
            value={selectedDomainId}
            onChange={(newValue) =>
              updateState({
                selectedDomainId: newValue,
              })
            }
            width="100%"
            placeholder="Domain Field"
          />

          <Button
            onClick={handleComplete}
            marginTop={3}
            style={{ backgroundColor: "#007bff", color: "#ffffff" }}
          >
            Complete Setup
          </Button>
        </>
      )}

      {error && (
        <Dialog
          onClose={() =>
            updateState({
              error: "",
            })
          }
          width="100%"
        >
          <Text style={{ color: "red" }}>{error}</Text>
        </Dialog>
      )}

      {isLoading ? <Loader /> : null}
    </Box>
  );
}

export default OnboardingScreen;
