import { Button } from "@airtable/blocks/ui";
import React from "react";

const PrimaryButton = ({ children, onClick, disabled }) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    marginTop={3}
    style={{ backgroundColor: "#6C57C0", color: "#ffffff", width: "100%" }}
  >
    {children}
  </Button>
);

export default PrimaryButton;
