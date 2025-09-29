import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

const PaymentModal = ({ showPaymentDialog, newEvents, hourlyRate, grandTotalTime, grandTotalBill, onCancel, onProceed }) => {

    console.log(newEvents);
    return (
        <Dialog open={showPaymentDialog} onClose={onCancel} aria-labelledby="payment-dialog-title" fullWidth>
            <DialogTitle id="payment-dialog-title">Payment Summary</DialogTitle>
            <DialogContent>
                This will be your total based on the hourly rate of ${hourlyRate}/hr:
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Total Time (hrs)</TableCell>
                            <TableCell>Total Bill ($)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {newEvents.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{entry.title}</TableCell>
                                <TableCell>{entry.totalTime}</TableCell>
                                <TableCell>${(entry.totalTime * hourlyRate).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow style={{ fontWeight: "bold" }}>
                            <TableCell>Grand Total</TableCell>
                            <TableCell>{grandTotalTime}</TableCell>
                            <TableCell>${grandTotalBill.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </DialogContent>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                <button onClick={onCancel} style={{ marginRight: '8px' }}>Cancel</button>
                <button onClick={onProceed} style={{ backgroundColor: '#4caf50', color: 'white' }}>Proceed to Payment</button>
            </div>
        </Dialog>
    );
};

export default PaymentModal;
