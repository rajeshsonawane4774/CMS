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
  const role = localStorage.getItem('role');
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [settlementDate, setSettlementDate] = useState('');

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
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
    setSettlementAmount('');
    setPaymentMethod('');
    setSettlementDate('');
  };

  const handleSettlement = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      await axios.put(
        `${API_URL}/api/customers/${currentRecord.id}`,
        {
          advance_paid: settlementAmount,
          payment_method: paymentMethod,
          created_date: settlementDate
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
            @media print {
              body { margin: 0.5in; }
            }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 20px; 
              color: #000;
              background: white;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 12px;
            }
            th, td { 
              border: 2px solid #333; 
              padding: 8px 12px; 
              text-align: center;
              vertical-align: middle;
            }
            th { 
              background-color: #1976d2 !important; 
              color: white !important; 
              font-weight: bold;
              font-size: 11px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            td {
              background-color: white !important;
              color: #000 !important;
              font-weight: 500;
            }
            tr:nth-child(even) td { 
              background-color: #f8f9fa !important;
            }
            .amount-cell {
              font-family: 'Courier New', monospace;
              font-weight: bold;
              text-align: right;
              color: #000 !important;
              font-size: 13px;
            }
            .remaining-amount {
              color: #d32f2f !important;
              font-weight: bold;
            }
            h2 { 
              color: #1976d2; 
              margin-bottom: 10px;
              text-align: center;
              font-size: 24px;
            }
            .print-info { 
              color: #666; 
              font-size: 12px; 
              margin-bottom: 20px;
              text-align: center;
            }
            .sr-no { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Customer History - ${customerName}</h2>
          <div class="print-info">Generated on: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Sr. No.<br/>क्रमांक</th>
                <th>Date<br/>तारीख</th>
                <th>Work Reason<br/>कामाचे कारण</th>
                <th>Document Number<br/>दस्तऐवज क्रमांक</th>
                <th>Estimated Cost<br/>अंदाजे किंमत</th>
                <th>Advance Paid<br/>आगाऊ रक्कम</th>
                <th>Remaining Amount<br/>बाकी रक्कम</th>
                <th>Payment Method<br/>पैसे भरण्याची पद्धत</th>
              </tr>
            </thead>
            <tbody>
              ${customerHistory.map((record, index) => `
                <tr>
                  <td class="sr-no">${index + 1}</td>
                  <td>${new Date(record.created_at).toLocaleDateString()}</td>
                  <td>${record.work_reason || ''}</td>
                  <td>${record.document_number || ''}</td>
                  <td class="amount-cell">₹${Number(record.estimated_cost || 0).toLocaleString()}</td>
                  <td class="amount-cell">₹${Number(record.advance_paid || 0).toLocaleString()}</td>
                  <td class="amount-cell remaining-amount">₹${Number(record.amount_remaining || 0).toLocaleString()}</td>
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
    printWindow.print();
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
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Sr. No.<br/>क्रमांक<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>1</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Date<br/>तारीख<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>2</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Work Reason<br/>कामाचे कारण<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>3</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Document Number<br/>दस्तऐवज क्रमांक<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>4</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Estimated Cost<br/>अंदाजे किंमत<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>5</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Advance Paid<br/>आगाऊ रक्कम<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>6</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Remaining Amount<br/>बाकी रक्कम<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>7</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Payment Method<br/>पैसे भरण्याची पद्धत<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>8</div></TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Actions<br/>क्रिया<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>9</div></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customerHistory.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
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
                    {record.mark === 'active' && record.amount_remaining > 0 && role === 'superadmin' && (
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
            <TextField
              label="Settlement Date"
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Select the date for this settlement"
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
            disabled={!settlementAmount || !paymentMethod || !settlementDate}
          >
            Settle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerDetails;