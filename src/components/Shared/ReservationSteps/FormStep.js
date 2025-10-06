import React, { useState, useCallback, useEffect } from 'react';
import { 
  TextField, 
  MenuItem, 
  Select, 
  InputLabel, 
  OutlinedInput, 
  FormControl, 
  Checkbox, 
  FormControlLabel,
  FormHelperText
} from '@mui/material';
import { MIN_RESERVATION_DURATION_MS } from '../../../Helpers/constants.mjs';

const FormStep = ({ 
  formData, 
  setFormData, 
  children, 
  onSubmit,
  onValidationChange
}) => {
  const [errors, setErrors] = useState({});
  const childrenOptions = children.map(child => 
    Object.fromEntries([["id", child.id], ["name", child.Name]])
  );

  // Validation function
  const validateField = useCallback((data, field) => {
    const newErrors = {};
    
    if (field === 'selectedChild' || field === 'all') {
      if (!data.selectedChild?.length) {
        newErrors.selectedChild = 'At least one child must be selected.';
      }
    }
    
    if (field === 'date' || field === 'all') {
      const selectedDate = new Date(`${data.date}T00:00:00`);
      const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
      if (selectedDate < today) {
        newErrors.date = 'Date must be today or in the future.';
      }
    }
    
    if (field === 'start' || field === 'all') {
      const start = new Date(`${data.date}T${data.start}`);
      const now = new Date();
      if (start <= now) {
        newErrors.start = 'Dropoff time must be in the future.';
      }
    }
    
    if (field === 'end' || field === 'all') {
      const start = new Date(`${data.date}T${data.start}`);
      const end = new Date(`${data.date}T${data.end}`);
      const durationMs = end - start;
      const maxDurationMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
      
      if (durationMs < MIN_RESERVATION_DURATION_MS) {
        newErrors.end = 'Pickup time must be at least 2 hours after dropoff time.';
      } else if (durationMs > maxDurationMs) {
        newErrors.end = 'Pickup time cannot be more than 4 hours after dropoff time.';
      }
    }
    
    return newErrors;
  }, []);

  // Debounced validation
  const debouncedValidate = useCallback((() => {
    let timeout;
    return (data, field) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const newErrors = validateField(data, field);
        setErrors(prev => {
          const updated = { ...prev };
          // Clear the field's error if it's now valid
          if (!newErrors[field]) {
            delete updated[field];
          }
          // Add new errors
          Object.assign(updated, newErrors);
          return updated;
        });
      }, 500);
    };
  })(), [validateField]);

  // Check if form is valid (for button state)
  const isFormValid = useCallback(() => {
    const allErrors = validateField(formData, 'all');
    return Object.keys(allErrors).length === 0;
  }, [formData, validateField]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid());
    }
  }, [isFormValid, onValidationChange]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updatedFormData);
    debouncedValidate(updatedFormData, name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const allErrors = validateField(formData, 'all');
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }
    
    // Clear errors and submit
    setErrors({});
    // Ensure selectedChild is an array before submitting
    const safeFormData = {
      ...formData,
      selectedChild: formData.selectedChild || []
    };
    onSubmit(safeFormData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl fullWidth style={{ marginTop: '1rem' }}>
        <InputLabel id="multiselect-child-label">Name</InputLabel>
        <Select
          labelId="multiselect-child-label"
          name="selectedChild"
          multiple
          value={formData.selectedChild.map(child => child.id) || []}
          onChange={(e) => {
            const { value } = e.target;
            const selectedChildren = value.map(id =>
              childrenOptions.find(child => child.id === id)
            );
            const updatedFormData = { ...formData, selectedChild: selectedChildren };
            setFormData(updatedFormData);
            debouncedValidate(updatedFormData, 'selectedChild');
          }}
          input={<OutlinedInput label="Name" />}
          required
          error={!!errors.selectedChild}
        >
          {childrenOptions.map((child) => (
            <MenuItem key={child.id} value={child.id}>
              {child.name}
            </MenuItem>
          ))}
        </Select>
        {errors.selectedChild && (
          <FormHelperText error>{errors.selectedChild}</FormHelperText>
        )}
      </FormControl>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.groupActivity}
            onChange={handleChange}
            name="groupActivity"
          />
        }
        label="Show me group activities if available during my child's reservation. (Additional fees apply)"
      />
      
      <TextField
        name="date"
        label="Date"
        type="date"
        value={formData.date}
        onChange={handleChange}
        required
        fullWidth
        style={{ marginTop: '1rem' }}
        error={!!errors.date}
        helperText={errors.date}
      />
      
      <TextField
        name="start"
        label="Dropoff Time"
        type="time"
        value={formData.start}
        onChange={handleChange}
        required
        fullWidth
        style={{ marginTop: '1rem' }}
        error={!!errors.start}
        helperText={errors.start}
      />
      
      <TextField
        name="end"
        label="Pickup Time"
        type="time"
        value={formData.end}
        onChange={handleChange}
        required
        fullWidth
        style={{ marginTop: '1rem' }}
        error={!!errors.end}
        helperText={errors.end}
      />
    </form>
  );
};

export default FormStep;
