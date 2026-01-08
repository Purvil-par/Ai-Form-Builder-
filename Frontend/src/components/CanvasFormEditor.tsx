/**
 * Canvas Form Editor - Main Canva-style Editor Component
 * White background, drag-and-drop, full customization
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Save,
  Download,
  Undo,
  Redo,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Palette,
  Layout,
  Plus,
  FileText,
  Upload,
  ImageIcon,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react";
import FieldsPalette from "./editor/FieldsPalette";
import StylePanel from "./editor/StylePanel";
import FieldPropertiesPanel from "./editor/FieldPropertiesPanel";
import TemplateGallery from "./editor/TemplateGallery";
import GlobalStylesPanel from "./editor/GlobalStylesPanel";
import DraggableField from "./editor/DraggableField";
import CTAButton, { type CTAButtonData } from "./editor/CTAButton";
import CTAStylePanel from "./editor/CTAStylePanel";
import RichContentEditor from "./editor/RichContentEditor";
import ConfirmDialog from "./ui/ConfirmDialog";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { useAuth } from "../contexts/AuthContext";
import type {
  FormSchema,
  FormFieldData,
  FieldStyle,
  GlobalStyles,
} from "../types/editorTypes";
import * as formsService from "../api/formsService";
import "../styles/canvasEditor.css";

interface CanvasFormEditorProps {
  initialFormData: FormSchema;
  onSave: (schema: FormSchema) => void | Promise<void>;
  onClose: () => void;
  formId?: string; // Optional: if provided, update existing form instead of creating new
  sourceFile?: string; // Optional: Base64 source file/image that was uploaded to generate this form
}

const CanvasFormEditor: React.FC<CanvasFormEditorProps> = ({
  initialFormData,
  onSave,
  onClose,
  formId, // Get formId prop
  sourceFile, // Source file/image used to generate this form
}) => {
  // Debug: Log formId on component mount
  React.useEffect(() => {
    console.log("🎨 CanvasFormEditor MOUNTED");
    console.log("📝 formId prop received:", formId);
    console.log("📝 formId type:", typeof formId);
    console.log("📝 formId is truthy?", !!formId);
  }, [formId]);
  // Ensure initialFormData has all required fields with defaults
  const safeInitialData = {
    title: initialFormData?.title || "Untitled Form",
    description: initialFormData?.description || "",
    fields: initialFormData?.fields || [],
    globalStyles: initialFormData?.globalStyles || {
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      defaultSpacing: "16px",
      defaultBorderRadius: "6px",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
    },
  };

  const {
    state: formSchema,
    setState: setFormSchema,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<FormSchema>(safeInitialData);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"field" | "cta" | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"properties" | "styles">(
    "properties"
  );
  const [canvasMode, setCanvasMode] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGlobalStyles, setShowGlobalStyles] = useState(false);
  const [ctaButton, setCTAButton] = useState<CTAButtonData | null>(
    (initialFormData as any)?.ctaButton || null
  );
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(
    safeInitialData.globalStyles
  );

  // Rich Content Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState<string>(
    initialFormData?.editorContent || ""
  );

  // Background Image state
  const [backgroundImage, setBackgroundImage] = useState<string>(
    (initialFormData as any)?.backgroundImage || ""
  );

  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  // Close confirmation dialog state
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // View dropdown and Source modal states
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Get current user for ownership check
  const { user } = useAuth();

  // Check if current user is the form owner (admin)
  const isOwner = useMemo(() => {
    if (!formId || !user) return true; // For new forms, assume owner
    // Will be checked against form.owner_id when form is loaded
    return true; // TODO: Add proper ownership check when form data is available
  }, [formId, user]);

  // Debounced auto-save for editor content
  const debouncedSaveEditorContent = useCallback(
    (() => {
      let timeoutId: number;
      return (content: string) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          console.log("🔄 Auto-saving editor content...");
          console.log("📝 Content length:", content.length);
          console.log("🖼️ Has images:", content.includes("<img"));
          setEditorContent(content);
        }, 500); // 500ms debounce
      };
    })(),
    []
  );

  // Convert old schema format to new format with styles
  const convertToStyledFields = (fields: any[]): FormFieldData[] => {
    return fields.map((field, index) => ({
      ...field,
      style: field.style || {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "1.5",
        letterSpacing: "0",
        textAlign: "left" as const,
        color: "#1f2937",
        backgroundColor: "#ffffff",
        borderWidth: "1px",
        borderStyle: "solid" as const,
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
      },
      width: field.width || "100%",
      order: field.order ?? index,
    }));
  };

  // Convert and use fields directly from formSchema
  const fields = React.useMemo(
    () => convertToStyledFields(formSchema.fields || []),
    [formSchema.fields]
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleFieldDragStart = (fieldType: string) => {
    setDraggedFieldType(fieldType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedFieldType) return;

    // Initialize options for select/radio/checkbox fields
    const needsOptions = ["select", "radio", "checkbox"].includes(
      draggedFieldType
    );
    const defaultOptions = needsOptions
      ? ["Option 1", "Option 2", "Option 3"]
      : undefined;

    const newField: FormFieldData = {
      id: `field_${Date.now()}`,
      type: draggedFieldType as any,
      label: `${
        draggedFieldType.charAt(0).toUpperCase() + draggedFieldType.slice(1)
      } Field`,
      placeholder: `Enter ${draggedFieldType}`,
      required: false,
      options: defaultOptions,
      style: {
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
      },
      width: "100%",
      order: fields.length,
    };

    const updatedFields = [...fields, newField];
    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
    setSelectedFieldId(newField.id);
    setSelectedType("field");
    setDraggedFieldType(null);
  };

  const handleStyleChange = (styleChanges: Partial<FieldStyle>) => {
    if (!selectedFieldId) return;

    const updatedFields = fields.map((field) =>
      field.id === selectedFieldId
        ? { ...field, style: { ...field.style, ...styleChanges } }
        : field
    );

    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
  };

  const handleFieldUpdate = (updates: Partial<FormFieldData>) => {
    if (!selectedFieldId) return;

    const updatedFields = fields.map((field) =>
      field.id === selectedFieldId ? { ...field, ...updates } : field
    );

    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
  };

  const handleFieldClick = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedType("field");
    setActiveTab("properties"); // Default to properties tab
  };

  // Drag-and-drop handlers
  const handleFieldDragStartReorder =
    (index: number) => (e: React.DragEvent) => {
      setDraggedFieldIndex(index);
      e.dataTransfer.effectAllowed = "move";
    };

  const handleFieldDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleFieldDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedFieldIndex === null || draggedFieldIndex === dropIndex) {
      setDraggedFieldIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Create new array and reorder
    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedFieldIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    // Update order property for all fields
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));

    // Update both states
    const updatedSchema = {
      ...formSchema,
      fields: reorderedFields,
    };
    setFormSchema(updatedSchema);

    // Clear drag state
    setDraggedFieldIndex(null);
    setDragOverIndex(null);
  };

  const handleFieldDragEnd = () => {
    setDraggedFieldIndex(null);
    setDragOverIndex(null);
  };

  const handleDuplicateField = (fieldId: string) => {
    const fieldIndex = fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return;

    const fieldToDuplicate = fields[fieldIndex];
    const newField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Copy)`,
    };

    const newFields = [
      ...fields.slice(0, fieldIndex + 1),
      newField,
      ...fields.slice(fieldIndex + 1),
    ].map((field, idx) => ({ ...field, order: idx }));

    setFormSchema({
      ...formSchema,
      fields: newFields,
    });
    setSelectedFieldId(newField.id);
    setSelectedType("field");
  };

  // Add File Upload field handler
  const handleAddFileUpload = () => {
    const newField: FormFieldData = {
      id: `field_${Date.now()}`,
      type: 'file' as any,
      label: 'Upload File',
      placeholder: 'Choose a file to upload',
      required: false,
      accept: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
        textAlign: 'left',
        color: '#1f2937',
        backgroundColor: '#f9fafb',
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: '#d1d5db',
        borderRadius: '8px',
        paddingTop: '16px',
        paddingRight: '16px',
        paddingBottom: '16px',
        paddingLeft: '16px',
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '16px',
        marginLeft: '0px',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
      },
      width: '100%',
      order: fields.length,
    };

    const updatedFields = [...fields, newField];
    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
    setSelectedFieldId(newField.id);
    setSelectedType('field');
  };

  // CTA Button handlers
  const handleAddCTA = () => {
    setCTAButton({
      id: "cta_button",
      text: "Submit",
      style: {
        backgroundColor: globalStyles.primaryColor,
        textColor: "#ffffff",
        fontSize: "16px",
        fontWeight: "600",
        borderRadius: globalStyles.defaultBorderRadius,
        paddingTop: "12px",
        paddingRight: "24px",
        paddingBottom: "12px",
        paddingLeft: "24px",
        width: "100%",
        hoverBackgroundColor: globalStyles.secondaryColor,
      },
      order: fields.length,
    });
    setSelectedFieldId(null);
    setSelectedType("cta");
  };

  const handleRemoveCTA = () => {
    setCTAButton(null);
    setSelectedType(null);
  };

  const handleCTAStyleChange = (changes: Partial<CTAButtonData>) => {
    if (!ctaButton) return;
    setCTAButton({ ...ctaButton, ...changes });
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter((f) => f.id !== fieldId);
    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
      setSelectedType(null);
    }
  };

  const handleSave = async () => {
    try {
      console.log("\n=== 💾 SAVE FORM CLICKED ===");
      console.log("formId prop value:", formId);
      console.log("formId type:", typeof formId);
      console.log("formId is truthy?", !!formId);
      console.log("formSchema:", formSchema);
      console.log("fields count:", fields.length);
      console.log("editorContent length:", editorContent.length);

      // Check if editor content is too large (MongoDB 16MB limit)
      // Estimate: 1 char ≈ 1 byte, keep under 10MB to be safe
      const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB
      if (editorContent.length > MAX_CONTENT_SIZE) {
        const sizeMB = (editorContent.length / (1024 * 1024)).toFixed(2);
        toast.error(
          `Editor content is too large (${sizeMB}MB). Please reduce image sizes or remove some images. Max: 10MB`
        );
        return;
      }

      if (formId) {
        console.log("\n✅ UPDATE PATH - formId exists:", formId);
        // Update existing form
        const updateData = {
          title: formSchema.title,
          description: formSchema.description,
          fields: fields,
          globalStyles: globalStyles,
          ctaButton: ctaButton || undefined,
          editorContent: editorContent || undefined, // Include rich content
          // IMPORTANT: Send null explicitly when background is removed, not undefined
          // undefined gets excluded by backend's exclude_unset, but null triggers actual removal
          backgroundImage: backgroundImage === '' ? null : (backgroundImage || undefined),
        };
        console.log("Calling updateForm API with:", updateData);
        await formsService.updateForm(formId, updateData);
        console.log("✅ Form updated successfully");
      } else {
        console.log("\n❌ CREATE PATH - formId is missing/falsy!");
        console.log("⚠️ WARNING: This will create a DUPLICATE form!");
        // Create new form
        const createData = {
          title: formSchema.title,
          description: formSchema.description,
          fields: fields,
          globalStyles: globalStyles,
          ctaButton: ctaButton || undefined,
          editorContent: editorContent || undefined, // Include rich content
          backgroundImage: backgroundImage || undefined, // Include background image
          status: "draft" as const,
        };
        console.log("Calling createForm API with:", createData);
        const savedForm = await formsService.createForm(createData);
        console.log("❌ New form created (DUPLICATE!):", savedForm);
      }

      // Show success notification and stay on editor page
      console.log("✅ Form saved successfully - staying on editor page");
      setShowSuccessNotification(true);

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
    } catch (err) {
      console.error("❌ Failed to save form:", err);

      // Check if it's a document size error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes("too large") ||
        errorMessage.includes("document size")
      ) {
        toast.error(
          "Failed to save: Content is too large. Please reduce image sizes or remove some images."
        );
      } else {
        toast.error("Failed to save form: " + errorMessage);
      }
    }
  };

  const getCanvasWidth = () => {
    switch (canvasMode) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      default:
        return "100%";
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-[100] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Changes saved successfully!</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Form Editor</h1>
          <span className="text-sm text-gray-500">{formSchema.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="toolbar-button"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="toolbar-button"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
          </div>

          {/* Canvas Mode Dropdown + Source Preview */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            {/* View Mode Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="canvas-mode-button active flex items-center gap-1"
                title="Change View Mode"
              >
                {canvasMode === "desktop" && <Monitor size={18} />}
                {canvasMode === "tablet" && <Tablet size={18} />}
                {canvasMode === "mobile" && <Smartphone size={18} />}
                <ChevronDown size={14} />
              </button>
              
              {showViewDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                  <button
                    onClick={() => { setCanvasMode("desktop"); setShowViewDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${canvasMode === "desktop" ? "bg-blue-50 text-blue-600" : ""}`}
                  >
                    <Monitor size={16} />
                    Desktop
                  </button>
                  <button
                    onClick={() => { setCanvasMode("tablet"); setShowViewDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${canvasMode === "tablet" ? "bg-blue-50 text-blue-600" : ""}`}
                  >
                    <Tablet size={16} />
                    Tablet
                  </button>
                  <button
                    onClick={() => { setCanvasMode("mobile"); setShowViewDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${canvasMode === "mobile" ? "bg-blue-50 text-blue-600" : ""}`}
                  >
                    <Smartphone size={16} />
                    Mobile
                  </button>
                </div>
              )}
            </div>

            {/* Source File Preview Button - only show if sourceFile exists */}
            {sourceFile && (
              <button
                onClick={() => setShowSourceModal(true)}
                className="canvas-mode-button"
                title="View Source File/Image"
              >
                <Eye size={18} />
              </button>
            )}
          </div>

          {/* Actions */}
          {/* Upload File Button */}
          <button
            onClick={handleAddFileUpload}
            className="toolbar-button"
            title="Add File Upload Field"
          >
            <Upload size={18} className="mr-2" />
            Upload File
          </button>
          
          {/* Editor Button */}
          {isOwner && (
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`toolbar-button ${
                showEditor ? "bg-blue-50 text-blue-600 border-blue-600" : ""
              }`}
              title="Toggle Rich Content Editor"
            >
              <FileText size={18} className="mr-2" />
              Editor
            </button>
          )}
          
          {/* Background Image Button */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Check file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Background image must be less than 5MB');
                    return;
                  }
                  // Convert to Base64
                  const reader = new FileReader();
                  reader.onload = () => {
                    setBackgroundImage(reader.result as string);
                    toast.success('Background image added!');
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="background-image-upload"
            />
            {backgroundImage ? (
              <button
                onClick={() => {
                  setBackgroundImage('');
                  toast.success('Background image removed!');
                }}
                className="toolbar-button text-red-600 hover:bg-red-50"
                title="Remove Background Image"
              >
                <Trash2 size={18} className="mr-2" />
                Remove BG
              </button>
            ) : (
              <label
                htmlFor="background-image-upload"
                className="toolbar-button cursor-pointer"
                title="Add Background Image"
              >
                <ImageIcon size={18} className="mr-2" />
                Background
              </label>
            )}
          </div>
          
          {!ctaButton && (
            <button onClick={handleAddCTA} className="toolbar-button">
              <Plus size={18} className="mr-2" />
              Add CTA
            </button>
          )}
          <button
            onClick={handleSave}
            className="toolbar-button bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
          >
            <Save size={18} className="mr-2" />
            Save Form
          </button>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="toolbar-button"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Fields Palette */}
        <FieldsPalette
          onFieldDragStart={handleFieldDragStart}
          fieldCount={fields.length}
        />

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto custom-scrollbar canvas-grid p-8">
          <div
            className={`mx-auto bg-white shadow-lg rounded-lg transition-all duration-300 relative overflow-hidden`}
            style={{ 
              width: getCanvasWidth(), 
              minHeight: "600px",
              ...(backgroundImage && {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              })
            }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
          >
            {/* Light Overlay for slight text readability - mostly transparent */}
            {backgroundImage && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.2) 100%)',
                }}
              />
            )}
            {/* Form Header */}
            <div className="p-8 border-b border-gray-200 relative z-10">
              <input
                type="text"
                value={formSchema.title}
                onChange={(e) =>
                  setFormSchema({ ...formSchema, title: e.target.value })
                }
                className="text-3xl font-bold text-gray-900 w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 bg-transparent"
                placeholder="Form Title"
              />
              {formSchema.description && (
                <textarea
                  value={formSchema.description}
                  onChange={(e) =>
                    setFormSchema({
                      ...formSchema,
                      description: e.target.value,
                    })
                  }
                  className="mt-2 text-gray-600 w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 bg-transparent"
                  placeholder="Form Description"
                  rows={2}
                />
              )}
            </div>

            {/* Form Fields */}
            <div className="p-8 space-y-4 relative z-10">
              {fields.length === 0 ? (
                <div className="drop-zone-active py-16">
                  <p>Drag and drop fields here to start building your form</p>
                </div>
              ) : (
                fields.map((field, index) => {
                  // Calculate question number for ALL fields sequentially
                  const questionNumber = index + 1;
                  
                  return (
                    <DraggableField
                      key={field.id}
                      field={field}
                      index={index}
                      isSelected={
                        selectedFieldId === field.id && selectedType === "field"
                      }
                      isDragging={draggedFieldIndex === index}
                      onSelect={() => handleFieldClick(field.id)}
                      onDelete={() => handleDeleteField(field.id)}
                      onDuplicate={() => handleDuplicateField(field.id)}
                      onDragStart={handleFieldDragStartReorder(index)}
                      onDragEnd={handleFieldDragEnd}
                      onDragOver={handleFieldDragOver(index)}
                      onDrop={handleFieldDrop(index)}
                      onResize={(width) => {
                        // Update field width when resized
                        const updatedFields = fields.map((f) =>
                          f.id === field.id ? { ...f, width } : f
                        );
                        setFormSchema({
                          ...formSchema,
                          fields: updatedFields,
                        });
                      }}
                    >
                      {/* Field Label */}
                      <label
                        className="block mb-2"
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: "500",
                          color: field.style.color,
                        }}
                      >
                        {questionNumber !== null && (
                          <span className="font-semibold mr-1" style={{ color: field.style.color }}>
                            Q{questionNumber}.
                          </span>
                        )}
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>

                    {/* Field Input */}
                    {field.type === "textarea" ? (
                      <textarea
                        placeholder={field.placeholder}
                        className="w-full outline-none"
                        rows={4}
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: field.style.fontWeight,
                          lineHeight: field.style.lineHeight,
                          letterSpacing: field.style.letterSpacing,
                          textAlign: field.style.textAlign as any,
                          color: field.style.color,
                          backgroundColor: field.style.backgroundColor,
                          borderWidth: field.style.borderWidth,
                          borderStyle: field.style.borderStyle,
                          borderColor: field.style.borderColor,
                          borderRadius: field.style.borderRadius,
                          padding: `${field.style.paddingTop} ${field.style.paddingRight} ${field.style.paddingBottom} ${field.style.paddingLeft}`,
                          marginTop: field.style.marginTop,
                          marginRight: field.style.marginRight,
                          marginLeft: field.style.marginLeft,
                          boxShadow: field.style.boxShadow,
                          transition: field.style.transition,
                        }}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="w-full outline-none"
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: field.style.fontWeight,
                          lineHeight: field.style.lineHeight,
                          letterSpacing: field.style.letterSpacing,
                          textAlign: field.style.textAlign as any,
                          color: field.style.color,
                          backgroundColor: field.style.backgroundColor,
                          borderWidth: field.style.borderWidth,
                          borderStyle: field.style.borderStyle,
                          borderColor: field.style.borderColor,
                          borderRadius: field.style.borderRadius,
                          padding: `${field.style.paddingTop} ${field.style.paddingRight} ${field.style.paddingBottom} ${field.style.paddingLeft}`,
                          marginTop: field.style.marginTop,
                          marginRight: field.style.marginRight,
                          marginLeft: field.style.marginLeft,
                          boxShadow: field.style.boxShadow,
                          transition: field.style.transition,
                        }}
                      >
                        <option>Select an option</option>
                        {field.options?.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "radio" ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              style={{
                                accentColor: field.style.color,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: field.style.fontFamily,
                                fontSize: field.style.fontSize,
                                color: field.style.color,
                              }}
                            >
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === "checkbox" ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={opt}
                              style={{
                                accentColor: field.style.color,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: field.style.fontFamily,
                                fontSize: field.style.fontSize,
                                color: field.style.color,
                              }}
                            >
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full outline-none"
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: field.style.fontWeight,
                          lineHeight: field.style.lineHeight,
                          letterSpacing: field.style.letterSpacing,
                          textAlign: field.style.textAlign as any,
                          color: field.style.color,
                          backgroundColor: field.style.backgroundColor,
                          borderWidth: field.style.borderWidth,
                          borderStyle: field.style.borderStyle,
                          borderColor: field.style.borderColor,
                          borderRadius: field.style.borderRadius,
                          padding: `${field.style.paddingTop} ${field.style.paddingRight} ${field.style.paddingBottom} ${field.style.paddingLeft}`,
                          marginTop: field.style.marginTop,
                          marginRight: field.style.marginRight,
                          marginLeft: field.style.marginLeft,
                          boxShadow: field.style.boxShadow,
                          transition: field.style.transition,
                        }}
                      />
                    )}
                  </DraggableField>
                  );
                })
              )}

              {/* CTA Button */}
              {ctaButton && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <CTAButton
                    button={ctaButton}
                    isSelected={selectedType === "cta"}
                    onClick={() => {
                      setSelectedFieldId(null);
                      setSelectedType("cta");
                    }}
                  />
                  {selectedType === "cta" && (
                    <button
                      onClick={handleRemoveCTA}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove CTA Button
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Rich Content Editor Section (below form) */}
            {showEditor && isOwner && (
              <div className="border-t border-gray-200 mt-8">
                <div className="p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rich Content Editor
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add additional content below your form (text, images, links,
                    etc.)
                  </p>
                  <RichContentEditor
                    content={editorContent}
                    onChange={debouncedSaveEditorContent}
                    isReadOnly={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Tabbed Panel */}
        {selectedType === "field" && selectedField ? (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("properties")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "properties"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveTab("styles")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "styles"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Styles
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === "properties" ? (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Field Properties
                  </h3>
                  <FieldPropertiesPanel
                    field={selectedField}
                    onFieldUpdate={handleFieldUpdate}
                    onDelete={() => handleDeleteField(selectedField.id)}
                    onDuplicate={() => handleDuplicateField(selectedField.id)}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Field Styles
                  </h3>
                  <StylePanel
                    selectedFieldStyle={selectedField.style}
                    onStyleChange={handleStyleChange}
                    selectedFieldLabel={selectedField.label}
                  />
                </div>
              )}
            </div>
          </div>
        ) : selectedType === "cta" && ctaButton ? (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                CTA Button Settings
              </h2>
            </div>
            <CTAStylePanel
              button={ctaButton}
              onStyleChange={handleCTAStyleChange}
            />
          </div>
        ) : (
          <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Click on a field or CTA button to edit its properties
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Close Editor Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Close Editor"
        message="Are you sure you want to close the editor? Any unsaved changes will be lost."
        confirmText="Close"
        cancelText="Keep Editing"
        type="warning"
        onConfirm={() => {
          window.location.href = "/dashboard";
        }}
        onCancel={() => setShowCloseConfirm(false)}
      />

      {/* Source File Preview Modal */}
      {showSourceModal && sourceFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSourceModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Source File Preview</h3>
              <button
                onClick={() => setShowSourceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <p className="text-sm text-gray-500 mb-4">
                This is the file/image you uploaded to generate this form. Use it to verify the generated questions match the source.
              </p>
              {sourceFile.startsWith('data:image') ? (
                <img 
                  src={sourceFile} 
                  alt="Source file preview" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                    {sourceFile.length > 5000 ? sourceFile.substring(0, 5000) + '\n\n... [Content truncated]' : sourceFile}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasFormEditor;
