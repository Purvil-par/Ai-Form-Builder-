// Drag-and-drop handlers for CanvasFormEditor

export const useDragAndDrop = (fields: any[], setFields: (fields: any[]) => void, setFormSchema: (schema: any) => void, formSchema: any) => {
  const handleFieldDragStart = (index: number) => {
    return (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('fieldIndex', index.toString());
    };
  };

  const handleFieldDragOver = (index: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };
  };

  const handleFieldDrop = (dropIndex: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData('fieldIndex'));
      
      if (dragIndex === dropIndex) return;

      const newFields = [...fields];
      const [draggedField] = newFields.splice(dragIndex, 1);
      newFields.splice(dropIndex, 0, draggedField);

      // Update order property
      const reorderedFields = newFields.map((field, idx) => ({
        ...field,
        order: idx,
      }));

      setFields(reorderedFields);
      setFormSchema({
        ...formSchema,
        fields: reorderedFields,
      });
    };
  };

  const handleDuplicateField = (fieldId: string) => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
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

    setFields(newFields);
    setFormSchema({
      ...formSchema,
      fields: newFields,
    });
  };

  return {
    handleFieldDragStart,
    handleFieldDragOver,
    handleFieldDrop,
    handleDuplicateField,
  };
};
