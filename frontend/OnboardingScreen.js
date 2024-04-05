import {
  Box,
  Button,
  Input,
  Text,
  useGlobalConfig,
  Loader,
  Dialog,
} from "@airtable/blocks/ui";
import React, { useState } from "react";

function OnboardingScreen({ onComplete }) {
  const globalConfig = useGlobalConfig();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateApiKey = async (key) => {
    const testUrl = "https://api.versium.com/v2/contact?";
    try {
      const response = await fetch(testUrl, {
        headers: {
          "x-versium-api-key": key,
        },
      });
      const data = await response.json();
      if (
        data.versium.errors &&
        data.versium.errors.includes("Invalid api key provided.")
      ) {
        return false; // API key is invalid
      }
      return true; // API key is valid
    } catch (err) {
      console.error("Error validating API key:", err);
      return false; // Assume invalid on error
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError("");

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      setError(
        "Invalid API Key provided. Please check your key and try again."
      );
      setIsLoading(false);
      return;
    }

    if (globalConfig.hasPermissionToSetPaths([{ path: ["apiKey"] }])) {
      try {
        await globalConfig.setAsync("apiKey", apiKey);
        onComplete();
      } catch (error) {
        console.error("Error setting API key in globalConfig:", error);
        setError(
          "An error occurred while saving your API key. Please try again."
        );
      }
    } else {
      setError("You do not have permission to set the API key.");
    }
    setIsLoading(false);
  };

  return (
    <Box display="flex" flexDirection="column" padding={3}>
      {/* Centered Title with more emphasis */}
      <h1
        style={{
          textAlign: "center",
          fontWeight: "bold",
          marginBottom: "16px",
        }}
      >
        Versium Extension
      </h1>

      {/* Clear instruction */}
      <Text style={{ paddingBottom: "12px" }}>
        Enter your API key to get started:
      </Text>

      {/* Input field with clear action */}
      <Input
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your API Key"
        style={{ marginBottom: "24px" }} // Adds space before the button
      />

      {/* Conditional Loading or Action Button */}
      {isLoading ? (
        <Loader />
      ) : (
        <Button
          onClick={handleComplete}
          style={{ backgroundColor: "#007bff", color: "#ffffff" }} // Style the button with a distinct color for primary action
        >
          Complete Setup
        </Button>
      )}

      {/* Error handling with improved UX */}
      {error && (
        <Dialog
          onClose={() => setError("")}
          width="320px"
          style={{ marginTop: "12px" }}
        >
          <Text style={{ color: "red" }}>{error}</Text>{" "}
          {/* Error message in red for immediate attention */}
        </Dialog>
      )}
    </Box>
  );
}

export default OnboardingScreen;
