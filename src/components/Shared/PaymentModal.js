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
                            <TableCell>Group Activity?</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {newEvents.map((entry) => (
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
                        </TableRow>
                    </TableBody>
                </Table>
                <p className='mt-5'>Please proceed to payment with Stripe to confirm your reservations.</p>
            </DialogContent>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                <button onClick={onCancel} className='btn btn-secondary' style={{ marginRight: '8px' }}>Cancel</button>
                <button onClick={onProceed} className='btn btn-success' style={{ backgroundColor: '#4caf50', color: 'white' }}>Pay with Stripe</button>
            </div>
        </Dialog>
    );
};

export default PaymentModal;
