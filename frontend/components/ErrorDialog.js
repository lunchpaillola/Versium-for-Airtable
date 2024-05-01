import React from "react";
import { Dialog, Text } from "@airtable/blocks/ui";

const ErrorDialog = ({ error, clearError }) => (
  <Dialog onClose={clearError} width="100%">
    <Text style={{ color: "red" }}>{error}</Text>
  </Dialog>
);

export default ErrorDialog;
