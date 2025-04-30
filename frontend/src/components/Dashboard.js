import React, { useState, useEffect } from 'react';
import {
  Container, AppBar, Toolbar, Typography, Button, Box, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/GetApp';
import axios from 'axios';
import Papa from 'papaparse';
import dayjs from 'dayjs';

function Dashboard({ token, role, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', estimated_cost: '',
    advance_paid: '', amount_remaining: '', work_reason: '', payment_method: ''
  });

  const fetchCustomers = async () => {
    try {
      const params = { filter };
      if (startDate && endDate) {
        params.start_date = startDate.format('YYYY-MM-DD');
        params.end_date = endDate.format('YYYY-MM-DD');
      }
      const response = await axios.get('http://localhost:8080/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setCustomers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter, startDate, endDate]);

  const handleFormChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    const estimatedCost = parseFloat(updatedFormData.estimated_cost) || 0;
    const advancePaid = parseFloat(updatedFormData.advance_paid) || 0;
    updatedFormData.amount_remaining = (estimatedCost - advancePaid).toFixed(2);
    setFormData(updatedFormData);
  };

  const handleAddEdit = async () => {
    try {
      const payload = { ...formData };
      payload.amount_remaining = parseFloat(payload.amount_remaining);
      if (currentCustomer) {
        await axios.put(`http://localhost:8080/api/customers/${currentCustomer.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:8080/api/customers', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDialog = (customer = null) => {
    setCurrentCustomer(customer);
    if (customer) {
      const estimatedCost = parseFloat(customer.estimated_cost) || 0;
      const advancePaid = parseFloat(customer.advance_paid) || 0;
      setFormData({
        ...customer,
        amount_remaining: (estimatedCost - advancePaid).toFixed(2)
      });
    } else {
      setFormData({
        name: '', phone: '', address: '', estimated_cost: '',
        advance_paid: '', amount_remaining: '', work_reason: '', payment_method: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer(null);
  };

  const handlePrint = (customer = null) => {
    const printWindow = window.open('', '_blank');
    const title = customer ? `Customer Details: ${customer.name}` : `Customer List (${filter})`;
    const data = customer ? [customer] : customers;

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Estimated Cost</th>
                <th>Advance Paid</th>
                <th>Amount Remaining</th>
                <th>Work Reason</th>
                <th>Payment Method</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.phone || ''}</td>
                  <td>${c.address || ''}</td>
                  <td>${c.estimated_cost}</td>
                  <td>${c.advance_paid}</td>
                  <td>${c.amount_remaining}</td>
                  <td>${c.work_reason || ''}</td>
                  <td>${c.payment_method || ''}</td>
                  <td>${new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportExcel = (customer = null) => {
    const data = customer ? [customer] : customers;
    const csvData = data.map(c => ({
      Name: c.name,
      Phone: c.phone || '',
      Address: c.address || '',
      'Estimated Cost': c.estimated_cost,
      'Advance Paid': c.advance_paid,
      'Amount Remaining': c.amount_remaining,
      'Work Reason': c.work_reason || '',
      'Payment Method': c.payment_method || '',
      'Created At': new Date(c.created_at).toLocaleDateString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const date = new Date().toISOString().slice(0, 10);
    const filename = customer
      ? `customer_${customer.id}_${date}.csv`
      : `customers_${filter}_${date}.csv`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <Container>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Customer Management System
          </Typography>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Role: {role}
          </Typography>
          <Button color="inherit" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Tabs value={filter} onChange={(e, val) => setFilter(val)}>
            <Tab label="All" value="all" />
            <Tab label="Day" value="day" />
            <Tab label="Week" value="week" />
            <Tab label="Month" value="month" />
            <Tab label="Year" value="year" />
          </Tabs>
          <Box>
            <DatePicker
              label="From"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              renderInput={(params) => <TextField {...params} sx={{ mr: 2 }} />}
            />
            <DatePicker
              label="To"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        </Box>
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Customer
          </Button>
          {(role === 'admin' || role === 'superadmin') && (
            <>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrint()}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportExcel()}
              >
                Export to Excel
              </Button>
            </>
          )}
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Estimated Cost</TableCell>
              <TableCell>Advance Paid</TableCell>
              <TableCell>Amount Remaining</TableCell>
              <TableCell>Work Reason</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell>{customer.estimated_cost}</TableCell>
                <TableCell>{customer.advance_paid}</TableCell>
                <TableCell>{customer.amount_remaining}</TableCell>
                <TableCell>{customer.work_reason}</TableCell>
                <TableCell>{customer.payment_method}</TableCell>
                <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(customer)}>
                    <EditIcon />
                  </IconButton>
                  {role === 'superadmin' && (
                    <IconButton onClick={() => handleDelete(customer.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                  {(role === 'admin' || role === 'superadmin') && (
                    <>
                      <IconButton onClick={() => handlePrint(customer)}>
                        <PrintIcon />
                      </IconButton>
                      <IconButton onClick={() => handleExportExcel(customer)}>
                        <DownloadIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
          />
          <TextField
            label="Phone"
            fullWidth
            margin="normal"
            value={formData.phone}
            onChange={(e) => handleFormChange('phone', e.target.value)}
          />
          <TextField
            label="Address"
            fullWidth
            margin="normal"
            value={formData.address}
            onChange={(e) => handleFormChange('address', e.target.value)}
          />
          <TextField
            label="Estimated Cost"
            type="number"
            fullWidth
            margin="normal"
            value={formData.estimated_cost}
            onChange={(e) => handleFormChange('estimated_cost', e.target.value)}
            inputProps={{ step: '0.01' }}
          />
          <TextField
            label="Advance Paid"
            type="number"
            fullWidth
            margin="normal"
            value={formData.advance_paid}
            onChange={(e) => handleFormChange('advance_paid', e.target.value)}
            inputProps={{ step: '0.01' }}
          />
          <TextField
            label="Amount Remaining"
            type="number"
            fullWidth
            margin="normal"
            value={formData.amount_remaining}
            InputProps={{ readOnly: true }}
            sx={{ backgroundColor: '#f5f5f5' }}
          />
          <TextField
            label="Work Reason"
            fullWidth
            margin="normal"
            value={formData.work_reason}
            onChange={(e) => handleFormChange('work_reason', e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData.payment_method}
              onChange={(e) => handleFormChange('payment_method', e.target.value)}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="Online">Online</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddEdit} variant="contained">
            {currentCustomer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Dashboard;