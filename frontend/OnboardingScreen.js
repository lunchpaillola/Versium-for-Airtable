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
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState("API_KEY"); // Steps: 'API_KEY', 'TABLE_VIEW_SELECTION' , 'INPUT_FIELD_SELECTION', 'OUTPUT_FIELD_SELECTION'
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedViewId, setSelectedViewId] = useState(null);

  //States for field mapping
  const [selectedLinkedinId, setLinkedinId] = useState(null);
  const [selectedEmailId, setEmailId] = useState(null);
  const [selectedTitleId, setTitleId] = useState(null);
  const [selectedBusinessId, setBusinessId] = useState(null);
  const [selectedDomainId, setDomainId] = useState(null);

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

  const validateApiKey = async (apiKey) => {
    const testUrl = "https://api.versium.com/v2/contact?";
    console.log("testing apikey");
    try {
      const response = await fetch(testUrl, {
        headers: {
          "x-versium-api-key": apiKey,
        },
      });
      const data = await response.json();
      if (
        data.versium.errors &&
        data.versium.errors.includes("Invalid api key provided.")
      ) {
        setError(
          "Invalid API Key provided. Please check your key and try again."
        );
        return false; // API key is invalid
      }
      setCurrentStep("TABLE_SELECTION");
      return true; // API key is valid
    } catch (err) {
      console.error("Error validating API key:", err);
      return false; // Assume invalid on error
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    switch (currentStep) {
      case "API_KEY":
        break;

      case "TABLE_SELECTION":
        if (!selectedTableId) {
          setError("Please select a table.");
          setIsLoading(false);
          return;
        }
        setCurrentStep("VIEW_SELECTION");
        break;

      case "VIEW_SELECTION":
        if (!selectedViewId) {
          setError("Please select a view.");
          setIsLoading(false);
          return;
        }
        setCurrentStep("FIELD_MAPPING");
        break;

      case "FIELD_MAPPING":
        // You should validate field selections here as well, similar to the API key validation
        if (
          !selectedLinkedinId ||
          !selectedEmailId /* include other fields as needed */
        ) {
          setError("Please complete all field mappings.");
          setIsLoading(false);
          return;
        }

        // Finalize setup and save configurations
        try {
          await globalConfig.setAsync("onboardingConfig", {
            apiKey,
            selectedTableId,
            selectedViewId,
            fieldMappings: {
              linkedin: selectedLinkedinId,
              email: selectedEmailId,
              title: selectedTitleId,
              business: selectedBusinessId,
              domain: selectedDomainId,
            },
          });
          onComplete();
        } catch (error) {
          console.error("Error saving onboarding configuration:", error);
          setError("Failed to save onboarding configuration.");
        }
        break;

      default:
        setError("Unexpected step encountered.");
        break;
    }

    setIsLoading(false); // Move loading state change here to ensure it's always executed at the end
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
            onChange={(e) => setApiKey(e.target.value)}
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
              setSelectedTableId(newValue);
              setSelectedViewId(null); // Reset view selection when table changes
            }}
            width="320px"
          />
          <Button
            onClick={() => setCurrentStep("VIEW_SELECTION")}
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
            onChange={(newValue) => setSelectedViewId(newValue)}
            width="320px"
          />
          <Button
            onClick={() => setCurrentStep("FIELD_MAPPING")}
            disabled={!selectedViewId}
            marginTop={3}
            style={{ backgroundColor: "#007bff", color: "#ffffff" }}
          >
            Next: Map Fields
          </Button>
        </>
      )}

      {currentStep === "FIELD_MAPPING" && selectedTableId && (
        <>
          {/* Field Mapping Step */}
          <Text paddingBottom={3}>Map the fields:</Text>

          {/* LinkedIn ID Field Mapping */}
          <Select
            options={fields}
            value={selectedLinkedinId}
            onChange={(newValue) => setLinkedinId(newValue)}
            width="320px"
            placeholder="LinkedIn ID Field"
          />

          {/* Email Field Mapping */}
          <Select
            options={fields}
            value={selectedEmailId}
            onChange={(newValue) => setEmailId(newValue)}
            width="320px"
            placeholder="Email Field"
          />

          {/* Title Field Mapping */}
          <Select
            options={fields}
            value={selectedTitleId}
            onChange={(newValue) => setTitleId(newValue)}
            width="320px"
            placeholder="Title Field"
          />

          {/* Business Field Mapping */}
          <Select
            options={fields}
            value={selectedBusinessId}
            onChange={(newValue) => setBusinessId(newValue)}
            width="320px"
            placeholder="Business Field"
          />

          {/* Domain Field Mapping */}
          <Select
            options={fields}
            value={selectedDomainId}
            onChange={(newValue) => setDomainId(newValue)}
            width="320px"
            placeholder="Domain Field"
          />

          {/* Title, Business, Domain Field Mappings */}

          <Button
            onClick={handleComplete}
            disabled={
              !(
                (
                  selectedLinkedinId &&
                  selectedEmailId &&
                  selectedTitleId &&
                  selectedDomainId &&
                  selectedBusinessId
                ) /* Check other fields similarly */
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
        <Dialog onClose={() => setError("")} width="320px">
          <Text style={{ color: "red" }}>{error}</Text>
        </Dialog>
      )}

      {isLoading ? <Loader /> : null}
    </Box>
  );
}

export default OnboardingScreen;
