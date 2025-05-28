import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Divider, Typography } from '@mui/material';

export default function ReservationStatusDialog(props) {
  const { onClose, value: valueProp, open, options, title, reservationContext, ...other } = props;
  const [value, setValue] = React.useState(valueProp);
  const radioGroupRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setValue(valueProp);
    }
  }, [valueProp, open]);

  const handleEntering = () => {
    if (radioGroupRef.current != null) {
      radioGroupRef.current.focus();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleOk = () => {
    onClose(value);
  };

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const formatTimes = () => {
    if (!reservationContext) return 'Not Available';
    const localeOptions = {
      hour: 'numeric',
      minute: 'numeric'
    }
    return `${new Date(reservationContext.startStr).toLocaleTimeString([],localeOptions)} - ${new Date(reservationContext.endStr).toLocaleTimeString([], localeOptions)}`;
  }

  return (
    <Dialog
      sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
      maxWidth="xs"
      TransitionProps={{ onEntering: handleEntering }}
      open={open}
      {...other}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {reservationContext && <>
        <Typography variant='subtitle1'>
          Name: {reservationContext.title || 'No Name'}
        </Typography>
        <Typography variant='subtitle1'>
          Times: {formatTimes()}
        </Typography>
        <Divider sx={{ mb: 2, mt: 1, borderWidth: 1, borderColor: 'darkgrey' }}/>
        </>}
        <RadioGroup
          ref={radioGroupRef}
          value={value}
          onChange={handleChange}
        >
          {Object.keys(options).map((option) => (
            <FormControlLabel
              value={options[option]}
              key={option}
              control={<Radio />}
              label={option}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleOk} disabled={value === valueProp}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

ReservationStatusDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  value: PropTypes.string,
};