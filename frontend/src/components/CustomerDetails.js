import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ArrowBack, Print, Edit } from '@mui/icons-material';
import axios from 'axios';

function CustomerDetails({ token }) {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    const fetchCustomerHistory = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const response = await axios.get(`${API_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const docNumberFromUrl = urlParams.get('docNumber');
        const customerNameFromUrl = urlParams.get('name');
        
        console.log('Document Number from URL:', docNumberFromUrl);
        console.log('Customer name from URL:', customerNameFromUrl);
        
        // Find records by document number first, then by customer name and ID
        let customerRecords;
        if (docNumberFromUrl && docNumberFromUrl.trim()) {
          customerRecords = response.data.filter(c => c.document_number === docNumberFromUrl);
          setCustomerName(`${customerNameFromUrl} - ${docNumberFromUrl}`);
        } else {
          // Fallback to name-based filtering for backward compatibility
          customerRecords = response.data.filter(c => c.name === customerNameFromUrl);
          setCustomerName(customerNameFromUrl);
        }
        
        if (customerRecords.length === 0) {
          console.error('No records found for document number:', docNumberFromUrl);
          navigate('/dashboard');
          return;
        }
        
        console.log('Records found:', customerRecords.length);
        
        // Sort by created_at ascending (oldest first)
        customerRecords.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        setCustomerHistory(customerRecords);
      } catch (err) {
        console.error('Error fetching customer history:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerHistory();
  }, [customerId, token, navigate]);

  const handleEditRecord = (record) => {
    setCurrentRecord(record);
    setSettlementAmount('');
    setPaymentMethod(record.payment_method || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
    setSettlementAmount('');
    setPaymentMethod('');
  };

  const handleSettlement = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      await axios.put(
        `${API_URL}/api/customers/${currentRecord.id}`,
        {
          advance_paid: settlementAmount,
          payment_method: paymentMethod
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh customer history
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const urlParams = new URLSearchParams(window.location.search);
      const docNumber = urlParams.get('docNumber');
      const customerRecords = response.data.filter(c => 
        docNumber ? c.document_number === docNumber : c.name === customerName
      );
      customerRecords.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setCustomerHistory(customerRecords);
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error updating settlement:', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Customer History - ${customerName}</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1976d2; color: white; }
          </style>
        </head>
        <body>
          <h2>Customer History - ${customerName}</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Work Reason</th>
                <th>Document Number</th>
                <th>Estimated Cost</th>
                <th>Advance Paid</th>
                <th>Remaining</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${customerHistory.map(record => `
                <tr>
                  <td>${new Date(record.created_at).toLocaleString()}</td>
                  <td>${record.work_reason || ''}</td>
                  <td>${record.document_number || ''}</td>
                  <td>₹${parseFloat(record.estimated_cost || 0).toFixed(2)}</td>
                  <td>₹${parseFloat(record.advance_paid || 0).toFixed(2)}</td>
                  <td>₹${parseFloat(record.amount_remaining || 0).toFixed(2)}</td>
                  <td>${record.payment_method || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Customer History - {customerName}
          </Typography>
          <Button
            color="inherit"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr. No.<br/>क्रमांक</TableCell>
                <TableCell>Date<br/>तारीख</TableCell>
                <TableCell>Work Reason<br/>कामाचे कारण</TableCell>
                <TableCell>Document Number<br/>दस्तऐवज क्रमांक</TableCell>
                <TableCell>Estimated Cost<br/>अंदाजे किंमत</TableCell>
                <TableCell>Advance Paid<br/>आगाऊ रक्कम</TableCell>
                <TableCell>Remaining Amount<br/>बाकी रक्कम</TableCell>
                <TableCell>Payment Method<br/>पैसे भरण्याची पद्धत</TableCell>
                <TableCell>Actions<br/>क्रिया</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customerHistory.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {record.work_reason}<br/>
                    <span style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.7)' }}>
                      {record.work_reason_mr}
                    </span>
                  </TableCell>
                  <TableCell>{record.document_number || ''}</TableCell>
                  <TableCell>₹{Number(record.estimated_cost || 0).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(record.advance_paid || 0).toLocaleString()}</TableCell>
                  <TableCell 
                    sx={{ 
                      color: record.amount_remaining > 0 ? '#f44336' : '#4caf50',
                      fontWeight: 500 
                    }}
                  >
                    ₹{Number(record.amount_remaining || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{record.payment_method || ''}</TableCell>
                  <TableCell>
                    {record.mark === 'active' && record.amount_remaining > 0 && (
                      <IconButton onClick={() => handleEditRecord(record)} title="Settle amount">
                        <Edit />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* Settlement Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Settle Amount - {currentRecord?.work_reason}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Current Remaining: ₹{currentRecord?.amount_remaining || 0}
            </Typography>
            <TextField
              label="Settlement Amount"
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(e.target.value)}
              fullWidth
              helperText="Enter the amount being paid now"
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Online">Online</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSettlement} 
            variant="contained" 
            disabled={!settlementAmount || !paymentMethod}
          >
            Settle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerDetails;