import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  TextField,
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
  Close,
  Visibility
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import Papa from 'papaparse';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import '../styles/Dashboard.css';
import { fieldTranslations } from '../constants/translations';


function Dashboard({ token, role, onLogout }) {
  const navigate = useNavigate();
  
  // Helper function to get unique customer entries based on document number only
  const getUniqueCustomerEntries = (customerList, filterActive = true) => {
    const uniqueEntries = {};
    customerList.forEach(customer => {
      if (!filterActive || customer.mark === 'active') {
        const docNum = customer.document_number || '';
        const key = docNum || `${customer.name}_${customer.created_at}`;
        
        if (!uniqueEntries[key] || new Date(customer.created_at) > new Date(uniqueEntries[key].created_at)) {
          uniqueEntries[key] = customer;
        }
      }
    });
    return Object.values(uniqueEntries);
  };
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
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
    payment_method: '',
    created_date: '',
    status: 'pending'
  });
  const [error, setError] = useState(null);
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);


  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [token, startDate, endDate]);



  // No need for chart data fetching useEffect as we're using the customers data directly

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
        payment_method: customer.payment_method,
        created_date: customer.created_at ? dayjs(customer.created_at).format('YYYY-MM-DD') : '',
        status: customer.status || 'pending'
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
        payment_method: '',
        created_date: '',
        status: 'pending'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer(null);
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
      payment_method: '',
      created_date: ''
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
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await axios.delete(`${API_URL}/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        // Refresh the customer list from server
        const refreshResponse = await axios.get(`${API_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            start_date: startDate?.format('YYYY-MM-DD') || '',
            end_date: endDate?.format('YYYY-MM-DD') || ''
          }
        });
        setCustomers(refreshResponse.data);
        alert('Customer deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      if (err.response?.status === 404) {
        alert('Customer not found');
      } else {
        alert(`Error deleting customer: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const handlePrint = async (customer = null) => {
    const printWindow = window.open('', '_blank');
    
    let data;
    if (customer) {
      // For single customer print, get all entries for that customer
      data = customers.filter(c => c.name === customer.name && c.mark === 'active');
    } else {
      // For all customers print, use the filtered customers (latest active only)
      data = filteredCustomers;
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
    const csvData = filteredCustomers.map((c, index) => ({
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

  // Update filtered customers to show unique entries based on document number and work reason
  useEffect(() => {
    const uniqueCustomers = getUniqueCustomerEntries(customers);
    
    // Apply search filter
    const filtered = uniqueCustomers.filter(customer => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = (customer.name || '').toLowerCase().includes(searchLower);
      const workReasonMatch = (customer.work_reason || '').toLowerCase().includes(searchLower);
      const phoneMatch = (customer.phone || '').toLowerCase().includes(searchLower);
      const villageMatch = (customer.village || '').toLowerCase().includes(searchLower);
      const docMatch = (customer.document_number || '').toLowerCase().includes(searchLower);
      return nameMatch || workReasonMatch || phoneMatch || villageMatch || docMatch;
    });
    
    setFilteredCustomers(filtered);
  }, [customers, searchQuery]);

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

  /* eslint-disable no-unused-vars */
  const chartData = processChartData();
  /* eslint-enable no-unused-vars */

  return (
    <Fade in timeout={800}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {error && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: '#fdeded',
              color: '#5f2120',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography>{error}</Typography>
            <IconButton size="small" onClick={() => setError(null)} sx={{ ml: 2 }}>
              <Close />
            </IconButton>
          </Paper>
        )}
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
                <Button 
                  variant="contained" 
                  onClick={() => setShowMonthlyChart(true)} 
                  className="uniform-button" 
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Show Charts
                </Button>
                <Button variant="contained" startIcon={<Logout />} onClick={onLogout} className="uniform-button" sx={{ width: { xs: '100%', sm: 'auto' } }}>Logout</Button>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* This section was replaced by the Dialog component */}

        {/* Table Section - make container responsive */}
        {/* Only render the main customer table when showCharts is false */}
        {!showMonthlyChart && (
          <Paper elevation={3} className="table-container" sx={{ width: '100%', overflowX: 'auto', borderRadius: 0 }}>
            <Table sx={{ minWidth: 800, width: '100%', tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Sr.<br/>No<br/>क्रमांक<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>1</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{fieldTranslations.name.en}<br/>{fieldTranslations.name.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>2</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{fieldTranslations.phone.en}<br/>{fieldTranslations.phone.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>3</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>{fieldTranslations.village.en}<br/>{fieldTranslations.village.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>4</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>CTS/Plot/GAT<br/>सीटीएस/प्लॉट/गट<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>5</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Document<br/>Number<br/>{fieldTranslations.document_number.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>6</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Submitted<br/>By<br/>{fieldTranslations.submitted_by.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>7</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Estimated<br/>Cost<br/>{fieldTranslations.cost.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>8</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Advance<br/>{fieldTranslations.advance.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>9</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Remaining<br/>{fieldTranslations.remaining.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>10</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Work<br/>Reason<br/>{fieldTranslations.reason.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>11</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Payment<br/>Method<br/>{fieldTranslations.payment.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>12</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Modified<br/>Date<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>13</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Created<br/>Date<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>14</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Status<br/>स्थिती<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>15</div></TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>Action<br/>{fieldTranslations.actions.mr}<br/><div style={{fontSize: '0.75rem', color: '#fff', fontWeight: 'bold'}}>16</div></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={17} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <TableRow 
                      key={customer.id} 
                      onClick={() => navigate(`/customer/${customer.id}?docNumber=${encodeURIComponent(customer.document_number || '')}&name=${encodeURIComponent(customer.name)}`)} 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {customer.name}<br/>{customer.name_mr}
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        {customer.village}<br/>{customer.village_mr}
                      </TableCell>
                      <TableCell>
                        {customer.cts_number && `CTS: ${customer.cts_number.replace(/^CTS-?/i, '')}`}
                        {customer.plot_number && customer.cts_number && <br/>}
                        {customer.plot_number && `Plot: ${customer.plot_number.replace(/^Plot-?/i, '')}`}
                        {(customer.cts_number || customer.plot_number) && customer.gat_number && <br/>}
                        {customer.gat_number && `GAT: ${customer.gat_number.replace(/^GAT-?/i, '')}`}
                      </TableCell>
                      <TableCell>{customer.document_number}</TableCell>
                      <TableCell>{customer.submitted_by}</TableCell>
                      <TableCell className="amount-cell">₹{Number(customer.estimated_cost).toLocaleString()}</TableCell>
                      <TableCell className="amount-cell">₹{Number(customer.advance_paid).toLocaleString()}</TableCell>
                      <TableCell className="amount-cell remaining-amount">₹{Number(customer.amount_remaining).toLocaleString()}</TableCell>
                      <TableCell>
                        {customer.work_reason}<br/>{customer.work_reason_mr}
                      </TableCell>
                      <TableCell>{customer.payment_method}</TableCell>
                      <TableCell>{customer.modified_at ? new Date(customer.modified_at).toLocaleString() : ''}</TableCell>
                      <TableCell>{customer.created_at ? new Date(customer.created_at).toLocaleString() : ''}</TableCell>
                      <TableCell>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: customer.status === 'done' ? '#4caf50' : '#ff9800',
                          color: 'white'
                        }}>
                          {customer.status || 'pending'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => { e.stopPropagation(); navigate(`/customer/${customer.id}?docNumber=${encodeURIComponent(customer.document_number || '')}&name=${encodeURIComponent(customer.name)}`); }} title="View document payment history">
                          <Visibility />
                        </IconButton>
                        <IconButton onClick={(e) => { e.stopPropagation(); handlePrint(customer); }} title="Print all entries for this customer">
                          <Print />
                        </IconButton>
                        <IconButton onClick={(e) => { e.stopPropagation(); handleOpenDialog(customer); }} title="Edit customer">
                          <Edit />
                        </IconButton>
                        {role === 'superadmin' && (
                          <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }} title="Delete customer">
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
                  value={formData.estimated_cost}
                  onChange={(e) => handleFormChange('estimated_cost', e.target.value)}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
                  value={formData.advance_paid}
                  onChange={(e) => handleFormChange('advance_paid', e.target.value)}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  fullWidth
                  margin="normal"
                  disabled={currentCustomer && role !== 'superadmin'}
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
                  disabled
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

              {/* Status Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  Work Status / कामाची स्थिती
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Work Status / कामाची स्थिती</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    label="Work Status / कामाची स्थिती"
                  >
                    <MenuItem value="pending">Pending / प्रलंबित</MenuItem>
                    <MenuItem value="done">Done / पूर्ण</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Created Date Section */}
              <Box className="field-section">
                <Typography variant="subtitle1" gutterBottom>
                  Created Date / तयार केल्याची तारीख
                </Typography>
                <TextField
                  label="Created Date / तयार केल्याची तारीख"
                  type="date"
                  value={formData.created_date}
                  onChange={(e) => handleFormChange('created_date', e.target.value)}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
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

        {showMonthlyChart && (
          <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            bgcolor: '#f6f8fa', 
            zIndex: 9999,
            overflow: 'auto'
          }}>
            <AppBar position="static" sx={{ mb: 3, boxShadow: '0 8px 32px 0 rgba(35, 69, 103, 0.22)' }}>
              <Toolbar sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                minHeight: 80,
                px: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Analytics Dashboard - Customer Manager
                </Typography>
                <Button 
                  variant="contained"
                  onClick={() => setShowMonthlyChart(false)}
                  startIcon={<Close />}
                  className="uniform-button"
                >
                  Back to Dashboard
                </Button>
              </Toolbar>
            </AppBar>
            <Box sx={{ p: 3, maxWidth: '100%' }}>
            {/* Outstanding Amounts Table - Full Width */}
            <Paper elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: '#1976d2', color: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Outstanding Amounts by Customer
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {filteredCustomers.filter(c => c.amount_remaining > 0).length} Customers with Pending Amounts
                  </Typography>
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: '400px', overflow: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Sr. No.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Work Reason</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Phone Number</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Document Number</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Estimated Cost (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Advance Paid (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Remaining Amount (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', textAlign: 'center', padding: '8px 16px' }}>Created Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers
                      .filter(c => c.amount_remaining > 0)
                      .sort((a, b) => b.amount_remaining - a.amount_remaining)
                      .map((customer, index) => (
                        <TableRow 
                          key={index} 
                          hover 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                          }}
                          onClick={() => navigate(`/customer/${customer.id}?docNumber=${encodeURIComponent(customer.document_number || '')}&name=${encodeURIComponent(customer.name)}`)}
                        >
                          <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{customer.name}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{customer.work_reason}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{customer.phone}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{customer.document_number}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>₹{Number(customer.estimated_cost).toLocaleString('en-IN')}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>₹{Number(customer.advance_paid).toLocaleString('en-IN')}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#f44336', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            ₹{Number(customer.amount_remaining).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Work Status Distribution - Full Width */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: '#1976d2', color: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Work Status Distribution
                </Typography>
              </Box>
              <Grid container>

                {/* Pending Customers */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 'bold' }}>Pending Work ({filteredCustomers.filter(c => c.status === 'pending').length})</Typography>
                    <TableContainer sx={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', textAlign: 'center', padding: '8px 16px' }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', textAlign: 'center', padding: '8px 16px' }}>Customer Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', textAlign: 'center', padding: '8px 16px' }}>Work Reason</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', textAlign: 'center', padding: '8px 16px' }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', textAlign: 'center', padding: '8px 16px' }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCustomers.filter(c => c.status === 'pending').map((customer, index) => (
                            <TableRow 
                              key={index} 
                              hover 
                              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#fff8e1' } }}
                              onClick={() => navigate(`/customer/${customer.id}?docNumber=${encodeURIComponent(customer.document_number || '')}&name=${encodeURIComponent(customer.name)}`)}
                            >
                              <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{customer.name}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{customer.work_reason}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{customer.phone}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Grid>
                
                {/* Done Customers */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 'bold' }}>Completed Work ({filteredCustomers.filter(c => c.status === 'done').length})</Typography>
                    <TableContainer sx={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e8f5e8', textAlign: 'center', padding: '8px 16px' }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e8f5e8', textAlign: 'center', padding: '8px 16px' }}>Customer Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e8f5e8', textAlign: 'center', padding: '8px 16px' }}>Work Reason</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e8f5e8', textAlign: 'center', padding: '8px 16px' }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e8f5e8', textAlign: 'center', padding: '8px 16px' }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCustomers.filter(c => c.status === 'done').map((customer, index) => (
                            <TableRow 
                              key={index} 
                              hover 
                              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f1f8e9' } }}
                              onClick={() => navigate(`/customer/${customer.id}?docNumber=${encodeURIComponent(customer.document_number || '')}&name=${encodeURIComponent(customer.name)}`)}
                            >
                              <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{customer.name}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{customer.work_reason}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{customer.phone}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            </Box>
          </Box>
        )}

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


// -------------------------------------------------------------------------------------------------------------------------------

