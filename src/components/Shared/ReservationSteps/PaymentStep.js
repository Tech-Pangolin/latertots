import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Button,
  Alert
} from '@mui/material';
import { DEPOSIT_TYPES } from '../../../Helpers/constants';

const PaymentStep = ({ 
  reservations, 
  hourlyRate, 
  grandTotalTime, 
  grandTotalBill, 
  onPaymentTypeSelect, 
  isProcessingPayment,
  error 
}) => {
  return (
    <div>
      {error && (
        <Alert severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      
      <p>This will be your total based on the hourly rate of ${hourlyRate}/hr:</p>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Total Time (hrs)</TableCell>
            <TableCell>Total Bill ($)</TableCell>
            <TableCell>Group Activity?</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.title}</TableCell>
              <TableCell>{entry.totalTime}</TableCell>
              <TableCell>${(entry.totalTime * hourlyRate).toFixed(2)}</TableCell>
              <TableCell>{entry.groupActivity ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
          <TableRow style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
            <TableCell><strong>Grand Total</strong></TableCell>
            <TableCell><strong>{grandTotalTime}</strong></TableCell>
            <TableCell><strong>${grandTotalBill.toFixed(2)}</strong></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <p className='mt-5'>Please proceed to payment with Stripe to confirm your reservations.</p>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', gap: '8px' }}>
        <Button 
          onClick={() => onPaymentTypeSelect(DEPOSIT_TYPES.MINIMUM)} 
          variant="outlined"
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? 'Processing...' : 'Pay Minimum Deposit'}
        </Button>
        <Button 
          onClick={() => onPaymentTypeSelect(DEPOSIT_TYPES.FULL)} 
          variant="contained"
          color="success"
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? 'Processing...' : 'Pay Full Amount'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentStep;
