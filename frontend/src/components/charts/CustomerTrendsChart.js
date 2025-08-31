import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fieldTranslations } from '../../constants/translations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CustomerTrendsChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: "'Noto Sans Devanagari', Roboto, sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: `${fieldTranslations.documentChart.en} Type Distribution / ${fieldTranslations.documentChart.mr} प्रकार वितरण`,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Noto Sans Devanagari', Roboto, sans-serif"
        },
        padding: 20
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const chartData = {
    labels: [
      `${fieldTranslations.reason.en} (Domicile) / ${fieldTranslations.reason.mr} (निवास)`,
      `${fieldTranslations.reason.en} (Validity) / ${fieldTranslations.reason.mr} (वैधता)`,
      `${fieldTranslations.reason.en} (Caste) / ${fieldTranslations.reason.mr} (जात)`
    ],
    datasets: [
      {
        label: `${fieldTranslations.reason.en} (Domicile Certificate) / ${fieldTranslations.reason.mr} (निवास प्रमाणपत्र)`,
        data: [data.domicile],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 4
      },
      {
        label: `${fieldTranslations.reason.en} (Validity Certificate) / ${fieldTranslations.reason.mr} (वैधता प्रमाणपत्र)`,
        data: [data.validity],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        borderRadius: 4
      },
      {
        label: `${fieldTranslations.reason.en} (Caste Certificate) / ${fieldTranslations.reason.mr} (जात प्रमाणपत्र)`,
        data: [data.caste],
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px' }} aria-label="Bar chart showing document type distribution">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default CustomerTrendsChart;