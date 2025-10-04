import React from 'react';
import { 
  TextField, 
  MenuItem, 
  Select, 
  InputLabel, 
  OutlinedInput, 
  FormControl, 
  Checkbox, 
  FormControlLabel 
} from '@mui/material';

const FormStep = ({ 
  formData, 
  setFormData, 
  errors, 
  children, 
  onFieldChange, 
  onValidation 
}) => {
  const childrenOptions = children.map(child => 
    Object.fromEntries([["id", child.id], ["name", child.Name]])
  );

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updatedFormData);
    onFieldChange(updatedFormData, name);
  };

  return (
    <form>
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
            onFieldChange(updatedFormData, 'selectedChild');
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
