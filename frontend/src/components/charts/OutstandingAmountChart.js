import React from 'react';
import ReactECharts from 'echarts-for-react';

const OutstandingAmountChart = ({ data }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ₹{c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      top: 0,
      left: 'center',
      type: 'scroll',
      itemWidth: 18,
      itemHeight: 14,
      textStyle: {
        fontSize: 14,
        overflow: 'truncate',
        width: 180
      },
      padding: [16, 8, 8, 8],
    },
    series: [
      {
        name: 'Outstanding Amount',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.amount,
          name: item.name
        }))
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '480px', width: '100%', minWidth: 320, maxWidth: 600 }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default OutstandingAmountChart; 