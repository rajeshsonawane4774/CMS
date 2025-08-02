import React from 'react';
import ReactECharts from 'echarts-for-react';

const CertificateTypeChart = ({ data }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.month),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Certificates'
    },
    series: [
      {
        name: 'Certificates',
        type: 'line',
        smooth: true,
        data: data.map(item => item.count),
        areaStyle: {
          opacity: 0.3
        },
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderWidth: 2
        }
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

export default CertificateTypeChart; 