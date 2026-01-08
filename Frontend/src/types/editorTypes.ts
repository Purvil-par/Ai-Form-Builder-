/**
 * TypeScript types and interfaces for the Canva-style Form Editor
 */

export interface FieldStyle {
  // Typography
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: "left" | "center" | "right";
  color: string;

  // Background
  backgroundColor: string;

  // Border
  borderWidth: string;
  borderStyle: "solid" | "dashed" | "dotted" | "none";
  borderColor: string;
  borderRadius: string;

  // Spacing
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;

  // Effects
  boxShadow: string;
  transition: string;

  // Hover effects
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
  hoverTransform?: string;
}

export interface FormFieldData {
  id: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "date"
    | "time"
    | "file"
    | "url";
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: string;
  options?: string[];
  accept?: string[];
  min?: number;
  max?: number;

  // Visual properties
  style: FieldStyle;
  labelStyle?: Partial<FieldStyle>;

  // Layout
  width: string;
  height?: string;
  order: number;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: string;
  defaultSpacing: string;
  defaultBorderRadius: string;
  backgroundColor: string;
  textColor: string;
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormFieldData[];
  globalStyles?: GlobalStyles;
  customCSS?: string;
  editorContent?: string;  // Rich content below form (Jodit Editor HTML)
  backgroundImage?: string; // Base64 data URL for form background
}

export interface EditorState {
  formSchema: FormSchema;
  selectedFieldId: string | null;
  history: FormSchema[];
  historyIndex: number;
  canvasMode: "desktop" | "tablet" | "mobile";
  zoom: number;
  showGrid: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  schema: FormSchema;
  category:
    | "application"
    | "registration"
    | "feedback"
    | "survey"
    | "contact"
    | "custom";
}

export const DEFAULT_FIELD_STYLE: FieldStyle = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "14px",
  fontWeight: "400",
  lineHeight: "1.5",
  letterSpacing: "0",
  textAlign: "left",
  color: "#1f2937",
  backgroundColor: "#ffffff",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#d1d5db",
  borderRadius: "6px",
  paddingTop: "10px",
  paddingRight: "12px",
  paddingBottom: "10px",
  paddingLeft: "12px",
  marginTop: "0px",
  marginRight: "0px",
  marginBottom: "16px",
  marginLeft: "0px",
  boxShadow: "none",
  transition: "all 0.2s ease",
  hoverBorderColor: "#9ca3af",
};

export const DEFAULT_LABEL_STYLE: Partial<FieldStyle> = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "14px",
  fontWeight: "500",
  color: "#374151",
  marginBottom: "6px",
};

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "14px",
  defaultSpacing: "16px",
  defaultBorderRadius: "6px",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
};
