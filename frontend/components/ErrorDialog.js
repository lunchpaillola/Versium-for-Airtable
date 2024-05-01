import React from "react";
import { Dialog, Text } from "@airtable/blocks/ui";

const ErrorDialog = ({ error, clearError }) =>
  error ? (
    <Dialog onClose={clearError} width="100%">
      <Text style={{ color: "red" }}>{error}</Text>
    </Dialog>
  ) : null;

export default ErrorDialog;
