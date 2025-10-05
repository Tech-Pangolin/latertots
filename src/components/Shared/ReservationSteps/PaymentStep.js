import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Box,
  Tooltip,
  IconButton,
  Checkbox
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { DEPOSIT_TYPES, SERVICE_PRICE_LOOKUP_UIDS } from '../../../Helpers/constants';
import { useServicePricesRQ } from '../../../Hooks/query-related/useServicePricesRQ';

const PaymentStep = ({ 
  reservations, 
  hourlyRate, 
  additionalChildHourlyRate,
  onGroupActivityChange,
  grandTotalTime, 
  grandTotalBill, 
  onPaymentTypeSelect, 
  onEditDetails,
  isProcessingPayment,
  error 
}) => {
  const { getServicePrice, isLoading: pricesLoading } = useServicePricesRQ();
  const [showActivityPrices, setShowActivityPrices] = useState(false);
  
  return (
    <div>
      {error && (
        <Alert severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      
      <p>You should expect your service to cost approximately the following:</p>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Child Name</TableCell>
            <TableCell>Total Time (hrs)</TableCell>
            <TableCell>Rate ($/hr)</TableCell>
            <TableCell>Base Play Total ($)</TableCell>
            <TableCell>
              Group Activity?
              <Tooltip 
                title={
                  <div style={{ maxWidth: '300px' }}>
                    <strong>Group Activity Pricing:</strong><br/>
                    • Activity fees are charged in addition to the base play fee<br/>
                    • Not all activities are priced hourly, some are flat rates<br/>
                    • Activity fees are charged by usage, rather than the maximum time of the activity, and are calculated at time of pickup<br/>
                    • Activities are scheduled by day and are age-restricted. So not every activity may be available to every child on your reservation<br/>
                    • See "View Activity Prices" for current rates
                  </div>
                }
                placement="top"
                arrow
              >
                <IconButton size="small" style={{ marginLeft: '4px', padding: '2px' }}>
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((entry, index) => {
            const rate = index === 0 ? hourlyRate : additionalChildHourlyRate;
            // Simplified: Use reservation's groupActivity directly
            const isGroupActivitySelected = entry.groupActivity;
            
            return (
              <TableRow key={entry.stableId}>
                <TableCell>{entry.title}</TableCell>
                <TableCell>{entry.totalTime}</TableCell>
                <TableCell>${rate.toFixed(2)}</TableCell>
                <TableCell>${(entry.totalTime * rate).toFixed(2)}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={isGroupActivitySelected}
                    onChange={(event) => {
                      onGroupActivityChange(entry.stableId, event.target.checked);
                    }}
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
            <TableCell><strong>Grand Total</strong></TableCell>
            <TableCell><strong>{grandTotalTime}</strong></TableCell>
            <TableCell></TableCell>
            <TableCell><strong>${grandTotalBill.toFixed(2)}</strong></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <Box style={{ marginTop: '16px', marginBottom: '8px' }}>
        <FormControlLabel
          control={
            <Switch
              checked={showActivityPrices}
              onChange={(e) => setShowActivityPrices(e.target.checked)}
              color="primary"
            />
          }
          label="View Activity Prices"
        />
      </Box>
      
      {!pricesLoading && showActivityPrices && (
        <Table size="small" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Tot-Tivity</strong></TableCell>
              <TableCell align="center"><strong>Day of Week</strong></TableCell>
              <TableCell align="center"><strong>First Child</strong></TableCell>
              <TableCell align="center"><strong>Additional Child</strong></TableCell>
              <TableCell align="right"><strong>Duration</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Tots Night In</TableCell>
              <TableCell align="center">{getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_NIGHT_IN_FIRST_CHILD_FLAT)?.metadata?.daysOfWeek || 'TBD'}</TableCell>
              <TableCell align="center">${getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_NIGHT_IN_FIRST_CHILD_FLAT)?.pricePerUnitInCents / 100 || 'TBD'}</TableCell>
              <TableCell align="center">${getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_NIGHT_IN_ADDITIONAL_CHILD_FLAT)?.pricePerUnitInCents / 100 || 'TBD'}</TableCell>
              <TableCell align="right">2hr</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tot-Ally Fun Saturdays!</TableCell>
              <TableCell align="center">{getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_FUN_SATURDAY_HOURLY)?.metadata?.daysOfWeek || 'TBD'}</TableCell>
              <TableCell align="center">${getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_FUN_SATURDAY_HOURLY)?.pricePerUnitInCents / 100 || 'TBD'}/hr</TableCell>
              <TableCell align="center">same</TableCell>
              <TableCell align="right">3hr</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Ready, Set, Pre-K!</TableCell>
              <TableCell align="center">{getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_PRE_K_HOURLY)?.metadata?.daysOfWeek || 'TBD'}</TableCell>
              <TableCell align="center">${getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_PRE_K_HOURLY)?.pricePerUnitInCents / 100 || 'TBD'}/hr</TableCell>
              <TableCell align="center">same</TableCell>
              <TableCell align="right">4hr</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tiny Tot Explorers</TableCell>
              <TableCell align="center">{getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_EXPLORERS_HOURLY)?.metadata?.daysOfWeek || 'TBD'}</TableCell>
              <TableCell align="center">${getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_EXPLORERS_HOURLY)?.pricePerUnitInCents / 100 || 'TBD'}/hr</TableCell>
              <TableCell align="center">same</TableCell>
              <TableCell align="right">4hr</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tot & Me</TableCell>
              <TableCell align="center">{getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_TOT_AND_ME_FLAT)?.metadata?.daysOfWeek || 'TBD'}</TableCell>
              <TableCell align="center">${getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.TOTIVITY_TOT_AND_ME_FLAT)?.pricePerUnitInCents / 100 || 'TBD'}/hr</TableCell>
              <TableCell align="center">same</TableCell>
              <TableCell align="right">2hr</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      
      <p className='mt-5'>Please proceed to payment with Stripe to confirm your reservations.</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', gap: '8px' }}>
        <Button 
          onClick={onEditDetails}
          variant="outlined"
          color="secondary"
        >
          Edit Reservation Details
        </Button>
        
        <div style={{ display: 'flex', gap: '8px' }}>
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
    </div>
  );
};

export default PaymentStep;
