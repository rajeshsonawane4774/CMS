import React from 'react';
import ReactECharts from 'echarts-for-react';

const MonthlyRemainingChart = ({ data }) => {
  const months = data.map(item => item.month);
  const totals = data.map(item => item.total);

  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', name: 'Remaining (₹)' },
    series: [
      {
        data: totals,
        type: 'bar',
        name: 'Remaining',
        itemStyle: { color: '#1976d2' }
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '400px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default MonthlyRemainingChart; 