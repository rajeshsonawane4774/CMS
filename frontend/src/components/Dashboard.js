import React, { useState, useEffect } from 'react';
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
  IconButton,
  Paper,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Fade,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Print,
  Download,
  Logout,
  Search,
  Person,
  PieChart,
  BarChart
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import Papa from 'papaparse';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import '../styles/Dashboard.css';
import { fieldTranslations } from '../constants/translations';
import PaymentMethodChart from './charts/PaymentMethodChart';
import OutstandingAmountChart from './charts/OutstandingAmountChart';
import MonthlyRemainingChart from './charts/MonthlyRemainingChart';


function Dashboard({ token, role, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null); // Default: no start date
  const [endDate, setEndDate] = useState(null); // Default: no end date
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_mr: '',
    phone: '',
    village: '',
    village_mr: '',
    cts_number: '',
    plot_number: '',
    gat_number: '',
    document_number: '',
    submitted_by: '',
    estimated_cost: '',
    advance_paid: '',
    amount_remaining: '',
    work_reason: '',
    work_reason_mr: '',
    payment_method: ''
  });
  const [viewMode, setViewMode] = useState('table');
  const [error, setError] = useState('');
  const [outstandingData, setOutstandingData] = useState([]);
  const [outstandingNames, setOutstandingNames] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
  const [selectedCustomerForChart, setSelectedCustomerForChart] = useState(null);
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);


  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const params = { all_entries: true }; // Always fetch all entries
        if (startDate) {
          params.start_date = startDate.format('YYYY-MM-DD');
        }
        if (endDate) {
          params.end_date = endDate.format('YYYY-MM-DD');
        }
        const response = await axios.get(`${API_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        setCustomers(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch customers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [token, startDate, endDate]);

  useEffect(() => {
    const fetchOutstandingData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const response = await axios.get(`${API_URL}/api/customers/monthly-outstanding`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOutstandingData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch outstanding data');
        console.error(err);
      }
    };

    if (viewMode === 'outstanding') {
      fetchOutstandingData();
    }
  }, [token, viewMode]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        console.log('Fetching chart data...');
        console.log('Token:', token); // Debug log
        
        // First, try to fetch payment stats
        console.log('Fetching payment stats...');
        const paymentResponse = await axios.get(`${API_URL}/api/customers/payment-stats`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('Payment stats response:', paymentResponse.data);

        // Then fetch outstanding names
        console.log('Fetching outstanding names...');
        const outstandingResponse = await axios.get(`${API_URL}/api/customers/outstanding-names`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('Outstanding names response:', outstandingResponse.data);

        // Process payment stats data
        if (paymentResponse.data && Array.isArray(paymentResponse.data)) {
          console.log('Setting payment data:', paymentResponse.data);
          setPaymentData(paymentResponse.data);
        } else {
          console.error('Invalid payment stats data format:', paymentResponse.data);
          setError('Invalid payment stats data format');
        }

        // Process outstanding names data
        if (outstandingResponse.data && Array.isArray(outstandingResponse.data)) {
          console.log('Setting outstanding names:', outstandingResponse.data);
          setOutstandingNames(outstandingResponse.data);
        } else {
          console.error('Invalid outstanding names data format:', outstandingResponse.data);
          setError('Invalid outstanding names data format');
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response:', err.response.data);
          console.error('Error status:', err.response.status);
          console.error('Error headers:', err.response.headers);
          setError(err.response.data.error || 'Failed to fetch chart data');
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received:', err.request);
          setError('No response from server. Please check if the backend is running.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', err.message);
          setError('Failed to fetch chart data: ' + err.message);
        }
      }
    };

    if (showCharts) {
      console.log('Charts are visible, fetching data...');
      fetchChartData();
    }
  }, [token, showCharts]);

  const handleFormChange = (field, value) => {
    const updatedFormData = { ...formData };
    
    if (field === 'work_reason') {
      updatedFormData[field] = value.replace(/["']/g, '');
    } else {
      updatedFormData[field] = value;
    }

    if (field === 'estimated_cost' || field === 'advance_paid') {
      const estimatedCost = parseFloat(field === 'estimated_cost' ? value : updatedFormData.estimated_cost) || 0;
      const advancePaid = parseFloat(field === 'advance_paid' ? value : updatedFormData.advance_paid) || 0;
      updatedFormData.amount_remaining = (estimatedCost - advancePaid).toFixed(2);
    }

    setFormData(updatedFormData);
  };

  const handleOpenDialog = (customer = null) => {
    setCurrentCustomer(customer);
    if (customer) {
      setFormData({
        name: customer.name,
        name_mr: customer.name_mr || '',
        phone: customer.phone || '',
        village: customer.village || '',
        village_mr: customer.village_mr || '',
        cts_number: customer.cts_number || '',
        plot_number: customer.plot_number || '',
        gat_number: customer.gat_number || '',
        document_number: customer.document_number || '',
        submitted_by: customer.submitted_by || '',
        estimated_cost: customer.estimated_cost,
        advance_paid: customer.advance_paid,
        amount_remaining: customer.amount_remaining,
        work_reason: customer.work_reason,
        work_reason_mr: customer.work_reason_mr || '',
        payment_method: customer.payment_method
      });
    } else {
      setFormData({
        name: '',
        name_mr: '',
        phone: '',
        village: '',
        village_mr: '',
        cts_number: '',
        plot_number: '',
        gat_number: '',
        document_number: '',
        submitted_by: '',
        estimated_cost: '',
        advance_paid: '',
        amount_remaining: '',
        work_reason: '',
        work_reason_mr: '',
        payment_method: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer(null);
    setFormData({
      name: '',
      phone: '',
      village: '',
      cts_number: '',
      plot_number: '',
      gat_number: '',
      document_number: '',
      submitted_by: '',
      estimated_cost: '',
      advance_paid: '',
      amount_remaining: '',
      work_reason: '',
      payment_method: ''
    });
  };

  const handleAddEdit = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const payload = { ...formData };
      payload.amount_remaining = parseFloat(payload.amount_remaining);
      
      if (currentCustomer) {
        await axios.put(
          `${API_URL}/api/customers/${currentCustomer.id}`, 
          payload, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          `${API_URL}/api/customers`, 
          payload, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      const refreshResponse = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: startDate?.format('YYYY-MM-DD') || '',
          end_date: endDate?.format('YYYY-MM-DD') || ''
        }
      });
      setCustomers(refreshResponse.data);
      
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save customer');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      await axios.delete(`${API_URL}/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete customer');
      console.error(err);
    }
  };

  const handlePrint = async (customer = null) => {
    const printWindow = window.open('', '_blank');
    
    let data;
    if (customer) {
      // For single customer print, get latest active entry for each work
      const customerEntries = customers.filter(c => c.name === customer.name);
      
      // Group by work key and get latest active entry
      const latestByWork = {};
      customerEntries.forEach(entry => {
        const key = [
          entry.work_reason,
          entry.cts_number,
          entry.plot_number,
          entry.gat_number,
          entry.document_number
        ].join('|');
        if (!latestByWork[key] || new Date(entry.created_at) > new Date(latestByWork[key].created_at)) {
          latestByWork[key] = entry;
        }
      });
      data = Object.values(latestByWork);
    } else {
      // For all customers, get latest active entry for each unique work
      const latestByWork = {};
      customers.forEach(entry => {
        // Only include active entries
        if (entry.mark !== 'active') return;
        
        const key = [
          entry.name,
          entry.work_reason,
          entry.cts_number,
          entry.plot_number,
          entry.gat_number,
          entry.document_number
        ].join('|');
        if (!latestByWork[key] || new Date(entry.created_at) > new Date(latestByWork[key].created_at)) {
          latestByWork[key] = entry;
        }
      });
      data = Object.values(latestByWork);
    }
    
    const htmlContent = `
      <html>
        <head>
          <title>Customer ${customer ? 'Details' : 'List'}</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1976d2; color: white; }
          </style>
        </head>
        <body>
          <h2>Customer ${customer ? 'Details' : 'List'}</h2>
          ${data.length === 0 ? 
            `<p style="color: red; font-size: 18px;">No entries found for ${customer ? customer.name : 'customers'}</p>` :
            `<p style="color: green; font-size: 14px;">Found ${data.length} entries</p>`
          }
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>${fieldTranslations.name.en}</th>
                <th>${fieldTranslations.phone.en}</th>
                <th>${fieldTranslations.village.en}</th>
                <th>CTS/Plot/GAT</th>
                <th>${fieldTranslations.document_number.en}</th>
                <th>${fieldTranslations.submitted_by.en}</th>
                <th>${fieldTranslations.cost.en}</th>
                <th>${fieldTranslations.advance.en}</th>
                <th>${fieldTranslations.remaining.en}</th>
                <th>${fieldTranslations.reason.en}</th>
                <th>${fieldTranslations.payment.en}</th>
                <th>${fieldTranslations.date.en}</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((c, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${c.name}</td>
                  <td>${c.phone || ''}</td>
                  <td>${c.village || ''}</td>
                  <td>${c.cts_number ? `CTS: ${c.cts_number}` : ''}${c.plot_number ? (c.cts_number ? '<br/>' : '') + `Plot: ${c.plot_number}` : ''}${c.gat_number ? ((c.cts_number || c.plot_number) ? '<br/>' : '') + `GAT: ${c.gat_number}` : ''}</td>
                  <td>${c.document_number || ''}</td>
                  <td>${c.submitted_by || ''}</td>
                  <td>${parseFloat(c.estimated_cost).toFixed(2)}</td>
                  <td>${parseFloat(c.advance_paid).toFixed(2)}</td>
                  <td>${parseFloat(c.amount_remaining).toFixed(2)}</td>
                  <td>${c.work_reason || ''}</td>
                  <td>${c.payment_method || ''}</td>
                  <td>${new Date(c.created_at).toLocaleDateString()}</td>
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

  const handleExportExcel = () => {
    // Get latest active entry for each unique work
    const latestByWork = {};
    customers.forEach(entry => {
      // Only include active entries
      if (entry.mark !== 'active') return;
      
      const key = [
        entry.name,
        entry.work_reason,
        entry.cts_number,
        entry.plot_number,
        entry.gat_number,
        entry.document_number
      ].join('|');
      if (!latestByWork[key] || new Date(entry.created_at) > new Date(latestByWork[key].created_at)) {
        latestByWork[key] = entry;
      }
    });
    
    const csvData = Object.values(latestByWork).map((c, index) => ({
      'Sr. No.': index + 1,
      [fieldTranslations.name.en]: c.name,
      [fieldTranslations.phone.en]: c.phone || '',
      [fieldTranslations.village.en]: c.village || '',
      'CTS/Plot/GAT': `${c.cts_number ? `CTS: ${c.cts_number}` : ''}${c.plot_number ? (c.cts_number ? '; ' : '') + `Plot: ${c.plot_number}` : ''}${c.gat_number ? ((c.cts_number || c.plot_number) ? '; ' : '') + `GAT: ${c.gat_number}` : ''}`,
      [fieldTranslations.document_number.en]: c.document_number || '',
      [fieldTranslations.submitted_by.en]: c.submitted_by || '',
      [fieldTranslations.cost.en]: parseFloat(c.estimated_cost).toFixed(2),
      [fieldTranslations.advance.en]: parseFloat(c.advance_paid).toFixed(2),
      [fieldTranslations.remaining.en]: parseFloat(c.amount_remaining).toFixed(2),
      [fieldTranslations.reason.en]: c.work_reason || '',
      [fieldTranslations.payment.en]: c.payment_method || '',
      [fieldTranslations.date.en]: new Date(c.created_at).toLocaleDateString()
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = (customer.name || '').toLowerCase().includes(searchLower);
    const workReasonMatch = (customer.work_reason || '').toLowerCase().includes(searchLower);
    return nameMatch || workReasonMatch;
  });

  const processChartData = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) return null;
    
    const paymentMethods = {
      card: filteredCustomers.filter(c => c.payment_method === 'Card').length || 0,
      online: filteredCustomers.filter(c => c.payment_method === 'Online').length || 0,
      cash: filteredCustomers.filter(c => c.payment_method === 'Cash').length || 0,
    };

    if (Object.values(paymentMethods).some(v => v > 0)) {
      return { paymentMethods };
    }
    return null;
  };

  const chartData = processChartData();



  function getMonthlyRemainingCostForCustomer(customerName) {
    // Filter all entries for the selected customer
    const customerEntries = customers.filter(c => c.name === customerName);

    // Get all months present in the data
    const allMonths = [
      ...new Set(
        customerEntries.map(entry => {
          const date = new Date(entry.created_at);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
      ),
    ].sort();

    // Group entries by work (using a composite key)
    function getWorkKey(entry) {
      return [
        entry.work_reason,
        entry.cts_number,
        entry.plot_number,
        entry.document_number,
        entry.gat_number,
      ].join('|');
    }

    // For each month, calculate the total remaining
    const monthlyTotals = allMonths.map(month => {
      // For each work, find the latest entry up to and including this month
      const latestByWork = {};
      customerEntries.forEach(entry => {
        const date = new Date(entry.created_at);
        const entryMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (entryMonth > month) return; // Only consider entries up to this month
        const key = getWorkKey(entry);
        if (!latestByWork[key] || new Date(entry.created_at) > new Date(latestByWork[key].created_at)) {
          latestByWork[key] = entry;
        }
      });
      // Sum the remaining for all works
      const total = Object.values(latestByWork).reduce(
        (sum, entry) => sum + (Number(entry.amount_remaining) || 0),
        0
      );
      return { month, total };
    });

    return monthlyTotals;
  }

  // Utility to get total remaining (latest per work)
  function getTotalRemaining(customers) {
    const latestByWork = {};
    customers.forEach(entry => {
      const key = [
        entry.name,
        entry.work_reason,
        entry.cts_number,
        entry.plot_number,
        entry.gat_number,
        entry.document_number
      ].join('|');
      if (!latestByWork[key] || new Date(entry.created_at) > new Date(latestByWork[key].created_at)) {
        latestByWork[key] = entry;
      }
    });
    return Object.values(latestByWork).reduce(
      (sum, entry) => sum + (Number(entry.amount_remaining) || 0),
      0
    );
  }

  return (
    <Fade in timeout={800}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <AppBar position="static" sx={{ mb: 3, boxShadow: '0 8px 32px 0 rgba(35, 69, 103, 0.22)' }}>
          <Toolbar
            sx={{
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
              minHeight: 80,
              px: 2,
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 180 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Customer Manager
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.5,
                flexGrow: 1,
                justifyContent: { xs: 'flex-start', md: 'center' },
                minWidth: 220,
                mt: { xs: 2, md: 0 },
              }}
            >
              {/* Responsive search and filters */}
              <TextField
                label="Search Customers"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  width: { xs: '100%', sm: 180 },
                  background: 'white',
                  borderRadius: 1,
                  mb: { xs: 1, sm: 0 },
                }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
              <DatePicker
                label={`${fieldTranslations.dateRange.start.en} / ${fieldTranslations.dateRange.start.mr}`}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                maxDate={endDate}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    size: 'small',
                    sx: {
                      width: { xs: '100%', sm: 140 },
                      background: 'white',
                      borderRadius: 1,
                      mb: { xs: 1, sm: 0 },
                    },
                    InputLabelProps: { shrink: true },
                  },
                }}
              />
              <DatePicker
                label={`${fieldTranslations.dateRange.end.en} / ${fieldTranslations.dateRange.end.mr}`}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate}
                maxDate={dayjs()}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    size: 'small',
                    sx: {
                      width: { xs: '100%', sm: 140 },
                      background: 'white',
                      borderRadius: 1,
                      mb: { xs: 1, sm: 0 },
                    },
                    InputLabelProps: { shrink: true },
                  },
                }}
              />
              {/* Responsive action buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} className="uniform-button" sx={{ width: { xs: '100%', sm: 'auto' } }}>New</Button>
                <Button variant="contained" startIcon={<Print />} onClick={() => handlePrint()} className="uniform-button" sx={{ width: { xs: '100%', sm: 'auto' } }}>Print</Button>
                <Button variant="contained" startIcon={<Download />} onClick={handleExportExcel} className="uniform-button" sx={{ width: { xs: '100%', sm: 'auto' } }}>Export</Button>
                <Button variant="contained" startIcon={<PieChart />} onClick={() => setShowCharts(!showCharts)} className="uniform-button" sx={{ width: { xs: '100%', sm: 'auto' } }}>{showCharts ? 'Hide Charts' : 'Show Charts'}</Button>
                <Button variant="contained" startIcon={<Logout />} onClick={onLogout} className="uniform-button" sx={{ width: { xs: '100%', sm: 'auto' } }}>Logout</Button>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Charts Section - use Grid for responsive layout */}
        {showCharts && (
          <Box sx={{ boxShadow: 4, borderRadius: 2, p: 3, background: '#fff', mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Analytics
            </Typography>
            <Grid container spacing={3}>
              {/* Outstanding Table Section */}
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ width: '100%', p: { xs: 1, sm: 2 } }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Outstanding Amounts by Customer
                  </Typography>
                  {outstandingNames.length > 0 ? (
                    <Box className="analytics-table-flex" sx={{ maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', overscrollBehavior: 'contain' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Work Reason</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Phone Number</TableCell>
                            <TableCell>Remaining Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(() => {
                            // Group by person name + work reason, get latest entry for each
                            const latestByPersonWork = {};
                            outstandingNames.forEach(entry => {
                              if (entry.mark !== 'active') return;
                              const key = `${entry.name} - ${entry.work_reason}`;
                              if (!latestByPersonWork[key] || new Date(entry.created_at) > new Date(latestByPersonWork[key].created_at)) {
                                latestByPersonWork[key] = entry;
                              }
                            });
                            const tableData = Object.values(latestByPersonWork)
                              .filter(entry => Number(entry.amount_remaining) > 0);
                            return tableData.map((entry, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{entry.work_reason}</TableCell>
                                <TableCell>{entry.name}</TableCell>
                                <TableCell>{entry.phone}</TableCell>
                                <TableCell>{entry.amount_remaining}</TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography variant="body1" color="textSecondary">
                        No outstanding amounts found
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              {/* Summary Statistics Section */}
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ width: '100%', p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Work-wise Totals
                  </Typography>
                  {outstandingNames.length > 0 ? (
                    <>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', overscrollBehavior: 'contain' }}>
                        {/* Total Amount by Person's Given Work */} 
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Work Reason</TableCell>
                              <TableCell>Total Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              // Group by work reason, sum estimated_cost
                              const totals = {};
                              outstandingNames.forEach(entry => {
                                if (entry.mark !== 'active') return;
                                if (!totals[entry.work_reason]) totals[entry.work_reason] = 0;
                                totals[entry.work_reason] += Number(entry.estimated_cost) || 0;
                              });
                              return Object.entries(totals).map(([reason, total], idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{reason}</TableCell>
                                  <TableCell>{total}</TableCell>
                                </TableRow>
                              ));
                            })()}
                          </TableBody>
                        </Table>
                      </Box>
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        <b>Total Remaining Amount (Outstanding):</b> {
                          (() => {
                            // Sum of outstanding amounts for people with remaining cost
                            const latestByPersonWork = {};
                            outstandingNames.forEach(entry => {
                              if (entry.mark !== 'active') return;
                              const key = `${entry.name} - ${entry.work_reason}`;
                              if (!latestByPersonWork[key] || new Date(entry.created_at) > new Date(latestByPersonWork[key].created_at)) {
                                latestByPersonWork[key] = entry;
                              }
                            });
                            return Object.values(latestByPersonWork)
                              .filter(entry => Number(entry.amount_remaining) > 0)
                              .reduce((sum, entry) => sum + (Number(entry.amount_remaining) || 0), 0);
                          })()
                        }
                      </Typography>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography variant="body1" color="textSecondary">
                        No data found
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Table Section - make container responsive */}
        {/* Only render the main customer table when showCharts is false */}
        {!showCharts && (
          <Paper elevation={3} className="table-container" sx={{ width: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800, width: '100%', tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Sr. No.<br/>क्रमांक</TableCell>
                  <TableCell>{fieldTranslations.name.en}<br/>{fieldTranslations.name.mr}</TableCell>
                  <TableCell>{fieldTranslations.phone.en}<br/>{fieldTranslations.phone.mr}</TableCell>
                  <TableCell>{fieldTranslations.village.en}<br/>{fieldTranslations.village.mr}</TableCell>
                  <TableCell>CTS/Plot/GAT<br/>सीटीएस/प्लॉट/गट</TableCell>
                  <TableCell>{fieldTranslations.document_number.en}<br/>{fieldTranslations.document_number.mr}</TableCell>
                  <TableCell>{fieldTranslations.submitted_by.en}<br/>{fieldTranslations.submitted_by.mr}</TableCell>
                  <TableCell>{fieldTranslations.cost.en}<br/>{fieldTranslations.cost.mr}</TableCell>
                  <TableCell>{fieldTranslations.advance.en}<br/>{fieldTranslations.advance.mr}</TableCell>
                  <TableCell>{fieldTranslations.remaining.en}<br/>{fieldTranslations.remaining.mr}</TableCell>
                  <TableCell>{fieldTranslations.reason.en}<br/>{fieldTranslations.reason.mr}</TableCell>
                  <TableCell>{fieldTranslations.payment.en}<br/>{fieldTranslations.payment.mr}</TableCell>
                  <TableCell>{fieldTranslations.date.en}<br/>{fieldTranslations.date.mr}</TableCell>
                  <TableCell>{fieldTranslations.actions.en}<br/>{fieldTranslations.actions.mr}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {customer.name}<br/>{customer.name_mr}
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        {customer.village}<br/>{customer.village_mr}
                      </TableCell>
                      <TableCell>
                        {customer.cts_number && `CTS: ${customer.cts_number}`}
                        {customer.plot_number && customer.cts_number && <br/>}
                        {customer.plot_number && `Plot: ${customer.plot_number}`}
                        {(customer.cts_number || customer.plot_number) && customer.gat_number && <br/>}
                        {customer.gat_number && `GAT: ${customer.gat_number}`}
                      </TableCell>
                      <TableCell>{customer.document_number}</TableCell>
                      <TableCell>{customer.submitted_by}</TableCell>
                      <TableCell>{customer.estimated_cost}</TableCell>
                      <TableCell>{customer.advance_paid}</TableCell>
                      <TableCell>{customer.amount_remaining}</TableCell>
                      <TableCell>
                        {customer.work_reason}<br/>{customer.work_reason_mr}
                      </TableCell>
                      <TableCell>{customer.payment_method}</TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handlePrint(customer)} title="Print all entries for this customer">
                          <Print />
                        </IconButton>
                        <IconButton onClick={() => handleOpenDialog(customer)} title="Edit customer">
                          <Edit />
                        </IconButton>
                        {role === 'superadmin' && (
                          <IconButton onClick={() => handleDelete(customer.id)} title="Delete customer">
                            <Delete />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Dialogs - ensure forms are responsive */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{currentCustomer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Name Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.name.en} / ${fieldTranslations.name.mr}`}
                </Typography>
                <Box className="bilingual-field">
                  <TextField
                    label={fieldTranslations.language.english.en}
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label={fieldTranslations.language.marathi.en}
                    value={formData.name_mr}
                    onChange={(e) => handleFormChange('name_mr', e.target.value)}
                    InputProps={{
                      style: { fontFamily: 'Noto Sans Devanagari' }
                    }}
                    fullWidth
                    margin="normal"
                  />
                </Box>
              </Box>

              {/* Phone Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.phone.en} / ${fieldTranslations.phone.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.phone.en} / ${fieldTranslations.phone.mr}`}
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* Village Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.village.en} / ${fieldTranslations.village.mr}`}
                </Typography>
                <Box className="bilingual-field">
                  <TextField
                    label={fieldTranslations.language.english.en}
                    value={formData.village}
                    onChange={(e) => handleFormChange('village', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label={fieldTranslations.language.marathi.en}
                    value={formData.village_mr}
                    onChange={(e) => handleFormChange('village_mr', e.target.value)}
                    InputProps={{
                      style: { fontFamily: 'Noto Sans Devanagari' }
                    }}
                    fullWidth
                    margin="normal"
                  />
                </Box>
              </Box>

              {/* CTS Number Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.cts_number.en} / ${fieldTranslations.cts_number.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.cts_number.en} / ${fieldTranslations.cts_number.mr}`}
                  value={formData.cts_number}
                  onChange={(e) => handleFormChange('cts_number', e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* Plot Number Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.plot_number.en} / ${fieldTranslations.plot_number.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.plot_number.en} / ${fieldTranslations.plot_number.mr}`}
                  value={formData.plot_number}
                  onChange={(e) => handleFormChange('plot_number', e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* GAT Number Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.gat_number.en} / ${fieldTranslations.gat_number.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.gat_number.en} / ${fieldTranslations.gat_number.mr}`}
                  value={formData.gat_number}
                  onChange={(e) => handleFormChange('gat_number', e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* Document Number Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.document_number.en} / ${fieldTranslations.document_number.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.document_number.en} / ${fieldTranslations.document_number.mr}`}
                  value={formData.document_number}
                  onChange={(e) => handleFormChange('document_number', e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* Submitted By Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.submitted_by.en} / ${fieldTranslations.submitted_by.mr}`}
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{fieldTranslations.submitted_by.en}</InputLabel>
                  <Select
                    value={formData.submitted_by}
                    onChange={(e) => handleFormChange('submitted_by', e.target.value)}
                    label={fieldTranslations.submitted_by.en}
                  >
                    <MenuItem value="">Select an option</MenuItem>
                    <MenuItem value="Self">Self</MenuItem>
                    <MenuItem value="Suresh Patil">Suresh Patil</MenuItem>
                    <MenuItem value="Sapna Chaudhari">Sapna Chaudhari</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Work Reason Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.reason.en} / ${fieldTranslations.reason.mr}`}
                </Typography>
                <Box className="bilingual-field">
                  <TextField
                    label={fieldTranslations.language.english.en}
                    value={formData.work_reason}
                    onChange={(e) => handleFormChange('work_reason', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label={fieldTranslations.language.marathi.en}
                    value={formData.work_reason_mr}
                    onChange={(e) => handleFormChange('work_reason_mr', e.target.value)}
                    InputProps={{
                      style: { fontFamily: 'Noto Sans Devanagari' }
                    }}
                    fullWidth
                    margin="normal"
                  />
                </Box>
              </Box>

              {/* Estimated Cost Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.cost.en} / ${fieldTranslations.cost.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.cost.en} / ${fieldTranslations.cost.mr}`}
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => handleFormChange('estimated_cost', e.target.value)}
                  fullWidth
                  margin="normal"
                  disabled={role !== 'superadmin' && currentCustomer}
                />
              </Box>

              {/* Advance Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.advance.en} / ${fieldTranslations.advance.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.advance.en} / ${fieldTranslations.advance.mr}`}
                  type="number"
                  value={formData.advance_paid}
                  onChange={(e) => handleFormChange('advance_paid', e.target.value)}
                  fullWidth
                  margin="normal"
                  disabled={role !== 'superadmin' && currentCustomer}
                />
              </Box>

              {/* Remaining Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.remaining.en} / ${fieldTranslations.remaining.mr}`}
                </Typography>
                <TextField
                  label={`${fieldTranslations.remaining.en} / ${fieldTranslations.remaining.mr}`}
                  value={formData.amount_remaining}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  margin="normal"
                  disabled={role !== 'superadmin' && currentCustomer}
                />
              </Box>

              {/* Payment Method Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  {`${fieldTranslations.payment.en} / ${fieldTranslations.payment.mr}`}
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{`${fieldTranslations.payment.en} / ${fieldTranslations.payment.mr}`}</InputLabel>
                  <Select
                    value={formData.payment_method}
                    onChange={(e) => handleFormChange('payment_method', e.target.value)}
                    label={`${fieldTranslations.payment.en} / ${fieldTranslations.payment.mr}`}
                  >
                    <MenuItem value="Cash">{`Cash / ${fieldTranslations.payment.mr} (रोख)`}</MenuItem>
                    <MenuItem value="Card">{`Card / ${fieldTranslations.payment.mr} (कार्ड)`}</MenuItem>
                    <MenuItem value="Online">{`Online / ${fieldTranslations.payment.mr} (ऑनलाइन)`}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleAddEdit} variant="contained">
              {currentCustomer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showMonthlyChart} onClose={() => setShowMonthlyChart(false)} maxWidth="md" fullWidth>
          <DialogTitle>Outstanding Amount by Work Reason for {selectedCustomerForChart}</DialogTitle>
          <DialogContent>
            <Box sx={{ width: '100%' }}>
              {/* Prepare data for OutstandingAmountChart */}
              {selectedCustomerForChart && (
                <OutstandingAmountChart
                  data={(() => {
                    // Get all entries for the selected customer
                    const customerEntries = customers.filter(c => c.name === selectedCustomerForChart);
                    // Group by work reason and get latest entry
                    const latestByReason = {};
                    customerEntries.forEach(entry => {
                      const key = entry.work_reason;
                      if (!latestByReason[key] || new Date(entry.created_at) > new Date(latestByReason[key].created_at)) {
                        latestByReason[key] = entry;
                      }
                    });
                    // Prepare data for chart: name = work reason, amount = remaining
                    return Object.values(latestByReason).map(entry => ({
                      name: entry.work_reason,
                      amount: Number(entry.amount_remaining) || 0
                    })).filter(item => item.amount > 0);
                  })()}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMonthlyChart(false)}>Close</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Fade>
  );
}

Dashboard.propTypes = {
  token: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default Dashboard;