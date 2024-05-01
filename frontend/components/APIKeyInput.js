import React from "react";
import { Box, Heading, Text, Link, Input, Label } from "@airtable/blocks/ui";
import PrimaryButton from "./PrimaryButton";

const APIKeyInput = ({ apiKey, updateState, handleComplete }) => (
  <Box Display="flex" flexDirection="column" padding={3}>
    <Heading style={{ fontWeight: "bold", marginBottom: "16px" }}>
      Enter API key
    </Heading>
    <Text style={{ textAlign: "left", marginBottom: "16px" }}>
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
      onChange={(e) => updateState({ apiKey: e.target.value })}
      placeholder="Versium API Key"
      required={true}
    />
    <Label size="small" paddingTop={2}>
      ⚠️Note: the API key will be visible to all collaborators
    </Label>
    <PrimaryButton onClick={handleComplete} disabled={!apiKey}>
      Next: configure settings
    </PrimaryButton>
  </Box>
);

export default APIKeyInput;
