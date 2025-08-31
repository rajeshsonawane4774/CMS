import React from 'react';
import ReactECharts from 'echarts-for-react';

const PaymentMethodChart = ({ data }) => {
  console.log('PaymentMethodChart received data:', data); // Debug log

  if (!data || data.length === 0) {
    console.log('No data available for PaymentMethodChart'); // Debug log
    return (
      <div style={{ 
        height: '400px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        color: '#666'
      }}>
        No payment data available
      </div>
    );
  }

  // Process data to group by month and payment method
  const months = [...new Set(data.map(item => item.month))];
  const paymentMethods = [...new Set(data.map(item => item.payment_method))];
  
  console.log('Processed months:', months); // Debug log
  console.log('Processed payment methods:', paymentMethods); // Debug log
  
  const series = paymentMethods.map(method => ({
    name: method,
    type: 'line',
    smooth: true,
    data: months.map(month => {
      const item = data.find(d => d.month === month && d.payment_method === method);
      return item ? item.count : 0;
    }),
    areaStyle: {
      opacity: 0.3
    },
    lineStyle: {
      width: 3
    },
    itemStyle: {
      borderWidth: 2
    }
  }));

  console.log('Generated series:', series); // Debug log

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: paymentMethods,
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Transactions'
    },
    series: series
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '400px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default PaymentMethodChart;