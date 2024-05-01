import { Box, Label, Icon, FieldPicker } from "@airtable/blocks/ui";
import React from "react";

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
    marginBottom="16px"
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

export default FieldMapping;
