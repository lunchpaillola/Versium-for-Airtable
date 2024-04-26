import {
  Box,
  Button,
  Input,
  TablePicker,
  ViewPicker,
  FieldPicker,
  Loader,
  Text,
  Dialog,
  ProgressBar,
  useGlobalConfig,
} from "@airtable/blocks/ui";
import React, { useState } from "react";

function OnboardingScreen() {
  const globalConfig = useGlobalConfig();

  const [state, setState] = useState({
    apiKey: "",
    isLoading: false,
    error: "",
    currentStep: 0,
    selectedTable: null,
    selectedView: null,
    selectedLinkedin: null,
    selectedEmail: null,
    selectedTitle: null,
    selectedBusiness: null,
    selectedDomain: null,
    selectedFirstName: null,
    selectedLastName: null,
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
    selectedTable,
    selectedView,
    selectedLinkedin,
    selectedEmail,
    selectedTitle,
    selectedBusiness,
    selectedDomain,
    selectedFirstName,
    selectedLastName,
  } = state;

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
        try {
          await globalConfig.setAsync("Table", selectedTable.id);
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
        try {
          await globalConfig.setAsync("View", selectedView.id);
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
        try {
          await globalConfig.setAsync("LinkedIn", selectedLinkedin.id);
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
        try {
          await globalConfig.setAsync("fieldMappings", {
            firstName: selectedFirstName.id,
            lastName: selectedLastName.id,
            email: selectedEmail.id,
            title: selectedTitle.id,
            business: selectedBusiness.id,
            domain: selectedDomain.id,
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
            required={true}
            style={{ marginBottom: "24px" }}
          />
          <Button
            onClick={() => validateApiKey(apiKey)}
            disabled={!apiKey}
            marginTop={3}
            style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
          >
            Next: Select Table
          </Button>
          <ProgressBar progress={0} barColor="#6C57C0" />
        </>
      )}

      {currentStep === 1 && (
        <>
          {/* Table Selection Step */}
          <Text paddingBottom={3}>
            Select the table with the records you want to enrich:
          </Text>
          <TablePicker
            table={selectedTable}
            onChange={(newValue) => {
              updateState({
                selectedTable: newValue,
              });
            }}
            width="100%"
            shouldAllowPickingNone={false}
          />
          <Button
            onClick={handleComplete}
            marginTop={3}
            disabled={!selectedTable}
            style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
          >
            Next: Select View
          </Button>
          <ProgressBar progress={0.2} barColor="#6C57C0" />
        </>
      )}

      {currentStep === 2 && selectedTable && (
        <>
          {/* View Selection Step */}
          <Text paddingBottom={3}>Select the view:</Text>
          <ViewPicker
            table={selectedTable}
            view={selectedView}
            onChange={(newValue) =>
              updateState({
                selectedView: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />
          <Button
            onClick={handleComplete}
            disabled={!selectedView}
            marginTop={3}
            style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
          >
            Next: Map Input Field
          </Button>
          <ProgressBar progress={0.4} barColor="#6C57C0" />
        </>
      )}

      {currentStep === 3 && selectedTable && (
        <>
          {/* View Selection Step */}
          <Text paddingBottom={3}>
            Select the LinkedIn url that the extension should enrich:
          </Text>
          {/* LinkedIn ID Field Mapping */}
          <FieldPicker
            table={selectedTable}
            field={selectedLinkedin}
            onChange={(newValue) =>
              updateState({
                selectedLinkedin: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />
          <Button
            onClick={handleComplete}
            disabled={!selectedView}
            marginTop={3}
            style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
          >
            Next: Map Output Fields
          </Button>
          <ProgressBar progress={0.6} barColor="#6C57C0" />
        </>
      )}

      {currentStep === 4 && selectedTable && (
        <>
          {/* Field Mapping Step */}
          <Text paddingBottom={3}>Map Output fields:</Text>

          {/* First name field mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            First name field
          </Text>
          <FieldPicker
            table={selectedTable}
            field={selectedFirstName}
            onChange={(newValue) =>
              updateState({
                selectedFirstName: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />

          {/* Last name field mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Last name field
          </Text>
          <FieldPicker
            table={selectedTable}
            field={selectedLastName}
            onChange={(newValue) =>
              updateState({
                selectedLastName: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />

          {/* Email Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Email field
          </Text>
          <FieldPicker
            table={selectedTable}
            field={selectedEmail}
            onChange={(newValue) =>
              updateState({
                selectedEmail: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />

          {/* Title Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Title field
          </Text>
          <FieldPicker
            table={selectedTable}
            field={selectedTitle}
            onChange={(newValue) =>
              updateState({
                selectedTitle: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />

          {/* Business Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Business field
          </Text>
          <FieldPicker
            table={selectedTable}
            field={selectedBusiness}
            onChange={(newValue) =>
              updateState({
                selectedBusiness: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />

          {/* Domain Field Mapping */}
          <Text paddingTop={3} paddingBottom={1}>
            Domain field
          </Text>
          <FieldPicker
            table={selectedTable}
            field={selectedDomain}
            onChange={(newValue) =>
              updateState({
                selectedDomain: newValue,
              })
            }
            width="100%"
            shouldAllowPickingNone={false}
          />

          <Button
            onClick={handleComplete}
            disabled={
              !selectedDomain ||
              !selectedEmail ||
              !selectedTitle ||
              !selectedBusiness ||
              !selectedFirstName ||
              !selectedLastName
            }
            marginTop={3}
            style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
          >
            Complete Setup
          </Button>
          <ProgressBar progress={0.8} barColor="#6C57C0" />
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
