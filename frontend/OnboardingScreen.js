import {
  Box,
  Button,
  Input,
  TablePicker,
  ViewPicker,
  FieldPicker,
  Loader,
  Text,
  Label,
  Dialog,
  useGlobalConfig,
  Link,
  Heading,
  Icon,
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
   * @return {Promise<boolean>} - Returns `true` if the API key is valid, otherwise `false`.
   */
  const validateApiKey = async () => {
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
          await globalConfig.setAsync("View", selectedView.id);
          await globalConfig.setAsync("LinkedIn", selectedLinkedin.id);
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
          console.error("Error updating globalConfig:", error);
          updateState({
            error: "An error occurred while updating the configuration.",
            isLoading: false,
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

  //UI components

  const FieldMapping = ({
    label,
    table,
    selectedField,
    updateState,
    fieldKey,
  }) => (
    <Box
      width="100%"
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom="16px" // Or any desired margin
    >
      <Label width="33%">{label}</Label>
      <Icon name="right" size={16} />
      <FieldPicker
        table={table}
        field={selectedField}
        onChange={(newValue) => updateState({ [fieldKey]: newValue })}
        width="50%"
        shouldAllowPickingNone={false}
      />
    </Box>
  );

  const PrimaryButton = ({ children, onClick, disabled }) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      marginTop={3}
      style={{ backgroundColor: "#6C57C0", color: "#ffffff" }}
    >
      {children}
    </Button>
  );

  return (
    <Box display="flex" flexDirection="column" padding={3}>
      {currentStep === 0 && (
        <>
          {/* API Key Input Step */}
          <Heading
            style={{
              fontWeight: "bold",
              marginBottom: "16px",
            }}
          >
            Enter API key
          </Heading>
          <Text
            style={{
              textAlign: "left",
              marginBottom: "16px",
            }}
          >
            To use this extension, you need a Versium API key. Sign up at{" "}
            <Link
              href="https://app.versium.com/create-account"
              target="_blank"
              rel="noreferrer"
            >
              Versium
            </Link>
            , log in, and retrieve your API key from{" "}
            <Link
              href="https://app.versium.com/account/manage-api-keys"
              target="_blank"
              rel="noreferrer"
            >
              Manage API Keys
            </Link>{" "}
            in your account settings.
          </Text>
          <Input
            value={apiKey}
            onChange={(e) =>
              updateState({
                apiKey: e.target.value,
              })
            }
            placeholder="Versium API Key"
            required={true}
          />
          <Label size="small" paddingTop={2}>
            ⚠️Note: the API key will be visible to all collaborators
          </Label>
          <PrimaryButton onClick={validateApiKey} disabled={!apiKey}>
            Next: Configure Settings
          </PrimaryButton>
        </>
      )}

      {currentStep === 1 && (
        <>
          <Heading
            style={{
              fontWeight: "bold",
              marginBottom: "16px",
            }}
          >
            Settings
          </Heading>
          {/* Table Selection Step */}
          <Label>Select the table with the records you want to enrich:</Label>
          <TablePicker
            table={selectedTable}
            onChange={(newValue) => {
              updateState({
                selectedTable: newValue,
              });
            }}
            width="100%"
            shouldAllowPickingNone={true}
          />
          {selectedTable && (
            <>
              <Label
                style={{
                  textAlign: "left",
                  marginTop: "16px",
                }}
              >
                Select the view:
              </Label>
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
              <Label
                style={{
                  textAlign: "left",
                  marginTop: "16px",
                }}
              >
                Select the field with the Linkedin url that the extension should
                enrich:
              </Label>
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
              <Label
                paddingTop={3}
                style={{
                  textAlign: "left",
                  marginTop: "16px",
                }}
              >
                Map extension ouputs to fields in your table
              </Label>
              <Box
                width="100%"
                paddingTop={3}
                style={{
                  borderTop: "1px solid #E8E8E8",
                  borderBottom: "1px solid #E8E8E8",
                }}
              >
                {/* Field Mapping Step */}

                {/* First name field mapping */}
                <FieldMapping
                  label="First name"
                  table={selectedTable}
                  selectedField={selectedFirstName}
                  updateState={updateState}
                  fieldKey="selectedFirstName"
                />

                {/* Last name field mapping */}
                <FieldMapping
                  label="Last name"
                  table={selectedTable}
                  selectedField={selectedLastName}
                  updateState={updateState}
                  fieldKey="selectedLastName"
                />

                {/* Email Field Mapping */}
                <FieldMapping
                  label="Email"
                  table={selectedTable}
                  selectedField={selectedEmail}
                  updateState={updateState}
                  fieldKey="selectedEmail"
                />

                {/* Title Field Mapping */}
                <FieldMapping
                  label="Title"
                  table={selectedTable}
                  selectedField={selectedTitle}
                  updateState={updateState}
                  fieldKey="selectedTitle"
                />

                {/* Business Field Mapping */}
                <FieldMapping
                  label="Business"
                  table={selectedTable}
                  selectedField={selectedBusiness}
                  updateState={updateState}
                  fieldKey="selectedBusiness"
                />

                {/* Domain Field Mapping */}
                <FieldMapping
                  label="Domain"
                  table={selectedTable}
                  selectedField={selectedDomain}
                  updateState={updateState}
                  fieldKey="selectedDomain"
                />
              </Box>
            </>
          )}
          <PrimaryButton
            onClick={handleComplete}
            disabled={
              !selectedTable ||
              !selectedView ||
              !selectedLinkedin ||
              !selectedDomain ||
              !selectedEmail ||
              !selectedTitle ||
              !selectedBusiness ||
              !selectedFirstName ||
              !selectedLastName
            }
          >
            Save settings
          </PrimaryButton>
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
