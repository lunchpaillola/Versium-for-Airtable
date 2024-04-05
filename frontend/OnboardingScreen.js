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
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={3}
    >
      <h1>Welcome to Data Enrichment!</h1>
      <Text>Enter your API key to get started:</Text>
      <Input
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your API Key"
      />
      {isLoading ? (
        <Loader />
      ) : (
        <Button onClick={handleComplete} marginTop={3}>
          Complete Setup
        </Button>
      )}
      {error && (
        <Dialog onClose={() => setError("")} width="320px">
          <Text>{error}</Text>
        </Dialog>
      )}
    </Box>
  );
}

export default OnboardingScreen;
