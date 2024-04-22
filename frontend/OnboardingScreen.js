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

function OnboardingScreen({ onComplete }) {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const [state, setState] = useState({
    apiKey: "",
    isLoading: false,
    error: "",
    currentStep: "API_KEY", // Steps: 'API_KEY', 'TABLE_VIEW_SELECTION', 'INPUT_FIELD_SELECTION', 'OUTPUT_FIELD_SELECTION'
    selectedTableId: null,
    selectedViewId: null,
    selectedLinkedinId: null,
    selectedEmailId: null,
    selectedTitleId: null,
    selectedBusinessId: null,
    selectedDomainId: null,
  });

  const updateState = (updates) =>
    setState((prev) => ({ ...prev, ...updates }));

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
      updateState({ currentStep: "TABLE_SELECTION" });
      await globalConfig.setAsync("API Key", { apiKey });
      return true; // API key is valid
    } catch (err) {
      console.error("Error validating API key:", err);
      return false; // Assume the API key is invalid in case of an error
    }
  };

  const handleComplete = async () => {
    updateState({ isLoading: true });

    switch (currentStep) {
      case "API_KEY":
        break;

      case "TABLE_SELECTION":
        if (!selectedTableId) {
          updateState({ error: "Please select a table.", isLoading: false });
          return;
        }
        try {
          await globalConfig.setAsync("Table", { selectedTableId });
          updateState({
            currentStep: "VIEW_SELECTION",
          });
        } catch (error) {
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
          });
        }
        break;

      case "VIEW_SELECTION":
        if (!selectedViewId) {
          updateState({
            error: "Please select a view.",
            isLoading: false,
          });
          return;
        }
        try {
          await globalConfig.setAsync("View", { selectedViewId });
          updateState({
            currentStep: "INPUT_FIELD_MAPPING",
          });
        } catch (error) {
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
          });
        }
        break;

      case "INPUT_FIELD_MAPPING":
        if (!selectedLinkedinId) {
          updateState({
            error: "Please select a field to provide LinkedIn.",
            isLoading: false,
          });
          return;
        }
        try {
          await globalConfig.setAsync("LinkedIn", {
            linkedin: selectedLinkedinId,
          });
          updateState({
            currentStep: "OUTPUT_FIELD_MAPPING",
          });
        } catch (error) {
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
          });
        }
        break;

      case "OUTPUT_FIELD_MAPPING":
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
            fieldMappings: {
              email: selectedEmailId,
              title: selectedTitleId,
              business: selectedBusinessId,
              domain: selectedDomainId,
            },
          });
          onComplete();
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
      {currentStep === "API_KEY" && (
        <>
          {/* API Key Input Step */}
          <h1
            style={{
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: "16px",
            }}
          >
            Versium Extension
          </h1>
          <Text style={{ paddingBottom: "12px" }}>
            Enter your API key to get started:
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

      {currentStep === "TABLE_SELECTION" && (
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
            width="320px"
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

      {currentStep === "VIEW_SELECTION" && selectedTableId && (
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
            width="320px"
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

      {currentStep === "INPUT_FIELD_MAPPING" && selectedTableId && (
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
            width="320px"
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

      {currentStep === "OUTPUT_FIELD_MAPPING" && selectedTableId && (
        <>
          {/* Field Mapping Step */}
          <Text paddingBottom={3}>Map Output fields:</Text>

          {/* Email Field Mapping */}
          <Select
            options={fields.filter(
              (field) =>
                field.id !== selectedLinkedinId &&
                field.id !== selectedTitleId &&
                field.id !== selectedBusinessId &&
                field.id !== selectedDomainId
            )}
            value={selectedEmailId}
            onChange={(newValue) =>
              updateState({
                selectedEmailId: newValue,
              })
            }
            width="320px"
            placeholder="Email Field"
          />

          {/* Title Field Mapping */}
          <Select
            options={fields.filter(
              (field) =>
                field.id !== selectedLinkedinId &&
                field.id !== selectedEmailId &&
                field.id !== selectedBusinessId &&
                field.id !== selectedDomainId
            )}
            value={selectedTitleId}
            onChange={(newValue) =>
              updateState({
                selectedTitleId: newValue,
              })
            }
            width="320px"
            placeholder="Title Field"
          />

          {/* Business Field Mapping */}
          <Select
            options={fields.filter(
              (field) =>
                field.id !== selectedLinkedinId &&
                field.id !== selectedEmailId &&
                field.id !== selectedTitleId &&
                field.id !== selectedDomainId
            )}
            value={selectedBusinessId}
            onChange={(newValue) =>
              updateState({
                selectedBusinessId: newValue,
              })
            }
            width="320px"
            placeholder="Business Field"
          />

          {/* Domain Field Mapping */}
          <Select
            options={fields.filter(
              (field) =>
                field.id !== selectedLinkedinId &&
                field.id !== selectedEmailId &&
                field.id !== selectedTitleId &&
                field.id !== selectedBusinessId
            )}
            value={selectedDomainId}
            onChange={(newValue) =>
              updateState({
                selectedDomainId: newValue,
              })
            }
            width="320px"
            placeholder="Domain Field"
          />

          <Button
            onClick={handleComplete}
            disabled={
              !(
                selectedEmailId &&
                selectedTitleId &&
                selectedDomainId &&
                selectedBusinessId
              )
            }
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
          width="320px"
        >
          <Text style={{ color: "red" }}>{error}</Text>
        </Dialog>
      )}

      {isLoading ? <Loader /> : null}
    </Box>
  );
}

export default OnboardingScreen;
