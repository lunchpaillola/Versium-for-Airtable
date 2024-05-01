import React from "react";
import {
  Box,
  Label,
  TablePicker,
  ViewPicker,
  FieldPicker,
  Heading,
} from "@airtable/blocks/ui";
import PrimaryButton from "./PrimaryButton";
import FieldMapping from "./FieldMapping";

const SettingsComponent = ({
  selectedTable,
  selectedView,
  selectedLinkedin,
  selectedEmail,
  selectedTitle,
  selectedBusiness,
  selectedDomain,
  selectedFirstName,
  selectedLastName,
  updateState,
  handleComplete,
}) => (
  <Box>
    <Heading style={{ fontWeight: "bold", marginBottom: "16px" }}>
      Settings
    </Heading>
    <Label>Select the table with the records you want to enrich:</Label>
    <TablePicker
      table={selectedTable}
      onChange={(newValue) => updateState({ selectedTable: newValue })}
      width="100%"
      shouldAllowPickingNone={true}
    />
    {selectedTable && (
      <>
        <Label style={{ textAlign: "left", marginTop: "16px" }}>
          Select the view:
        </Label>
        <ViewPicker
          table={selectedTable}
          view={selectedView}
          onChange={(newValue) => updateState({ selectedView: newValue })}
          width="100%"
          shouldAllowPickingNone={false}
        />
        <Label style={{ textAlign: "left", marginTop: "16px" }}>
          Select the field with the LinkedIn URL that the extension should
          enrich:
        </Label>
        <FieldPicker
          table={selectedTable}
          field={selectedLinkedin}
          onChange={(newValue) => updateState({ selectedLinkedin: newValue })}
          width="100%"
          shouldAllowPickingNone={false}
        />
        <Label paddingTop={3} style={{ textAlign: "left", marginTop: "16px" }}>
          Map extension outputs to fields in your table:
        </Label>
        <Box
          width="100%"
          paddingTop={3}
          style={{
            borderTop: "1px solid #E8E8E8",
            borderBottom: "1px solid #E8E8E8",
          }}
        >
          <FieldMapping
            label="First name"
            table={selectedTable}
            selectedField={selectedFirstName}
            updateState={updateState}
            fieldKey="selectedFirstName"
          />
          <FieldMapping
            label="Last name"
            table={selectedTable}
            selectedField={selectedLastName}
            updateState={updateState}
            fieldKey="selectedLastName"
          />
          <FieldMapping
            label="Email"
            table={selectedTable}
            selectedField={selectedEmail}
            updateState={updateState}
            fieldKey="selectedEmail"
          />
          <FieldMapping
            label="Title"
            table={selectedTable}
            selectedField={selectedTitle}
            updateState={updateState}
            fieldKey="selectedTitle"
          />
          <FieldMapping
            label="Business"
            table={selectedTable}
            selectedField={selectedBusiness}
            updateState={updateState}
            fieldKey="selectedBusiness"
          />
          <FieldMapping
            label="Domain"
            table={selectedTable}
            selectedField={selectedDomain}
            updateState={updateState}
            fieldKey="selectedDomain"
          />
        </Box>
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
  </Box>
);

export default SettingsComponent;
