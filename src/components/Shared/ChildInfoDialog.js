import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, Typography } from '@mui/material';

const ChildInfoDialog = ({ selectedChild, open, handleClose }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Detailed Information:</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {selectedChild && <>
            {selectedChild.Name && <Typography>Name: {selectedChild.Name}</Typography>}
            {selectedChild.DOB && <Typography>DOB: {selectedChild.DOB}</Typography>}
            {selectedChild.Allergies && <Typography>Allergies: {selectedChild.Allergies}</Typography>}
            {selectedChild.Medications && <Typography>Medications: {selectedChild.Medications}</Typography>}
            {selectedChild.Notes && <Typography>Notes: {selectedChild.Notes}</Typography>}
          </>}
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default ChildInfoDialog;