import React from "react";
import { Dialog, Text, Button, Heading } from "@airtable/blocks/ui";

/**
 * A custom dialog component that can display a variety of content.
 *
 * @param {object} props - The props for the component.
 * @param {React.ReactNode} props.children - The content to display inside the dialog.
 * @param {string} [props.title] - An optional title for the dialog.
 * @param {Function} props.onClose - The function to call when the dialog needs to be closed.
 * @param {string} [props.color] - Optional text color, default is 'black'.
 * @returns {JSX.Element} The rendered component.
 */
const CustomDialog = ({ children, title, onClose, color = "black" }) => (
  <Dialog onClose={onClose} width="320px">
    {title && <Heading style={{ marginBottom: "12px" }}>{title}</Heading>}
    <Text style={{ color }}>{children}</Text>
    <Button marginTop={3} onClick={onClose}>
      Close
    </Button>
  </Dialog>
);

export default CustomDialog;
