import './App.css';
import { Navbar, Container, Row, Col, Button } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import * as Utils from './utils';
import * as Data from './data';
import { useRef } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Nav() {
  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand href="#home">
          Wikipedia Visits
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
}

const nixtlaURL = 'http://app.nixtla.io';

// Get token here: http://18.235.133.135:3000/login
// Add token in .env (copy .env.example)
const bearerToken = process.env.REACT_APP_NIXTLA_BEARER_TOKEN;
const headers = {
  'accept': 'application/json',
  'authorization': `Bearer ${bearerToken}`,
  'content-type': 'application/json',
};

async function forecast(data) {

	const options = {
	  method: 'POST',
	  headers: {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: `Bearer ${bearerToken}` 
	  },
	  body: JSON.stringify({
		fh: 12,
		seasonality: 12,
		cv: false,
		timestamp: data.timestamp,
		value: data.value,
        model: 'arima'
	  })
	};

	const response = await fetch('http://app.nixtla.io/forecast', options)
	const responseData = await response.json();

	return responseData
}

const makeForecast = async (data, chartRef) => {
  const fcast = await forecast(data);
  const parsedData = Utils.parseResponse(fcast);

  const chart = chartRef.current;
  chart.data.labels = [...data.timestamp, ...parsedData.timestamp]
  chart.data.datasets[0].data = [...chart.data.datasets[0].data, ...parsedData.value];

  chart.update();
};


// Anomaly Detection
async function anomalyDetection(data) {
	const options = {
	  method: 'POST',
	  headers: {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: `Bearer ${bearerToken}` 
	  },
	  body: JSON.stringify({
		level: 90,
		seasonality: 1,
		timestamp: data.timestamp,
		value: data.value, 
		fh: 7
	  })
	};

	const response = await fetch('http://app.nixtla.io/anomaly_detector', options)
	const responseData = await response.json()

	return responseData
}

const detectAnomalies = async (data, chartRef) => {
  const anomalies = await anomalyDetection(data);
  const parsedData = Utils.parseResponse(anomalies);

  // Search data by value. update it's point radius
  const chart = chartRef.current;
  const dataset = chart.data.datasets[0];

  parsedData.value
    .map(value => dataset.data.indexOf(value))
    .forEach(idx => dataset.pointRadius[idx] = 5);

  chart.update();
}

function App() {
  const chartRef = useRef();

  return (
    <div>
      <Nav></Nav>
      <Container>
        <h1 className='text-center'>Peyton Manning visits on Wikipedia</h1>

        <Row className='mt-1'>
          <Col md={12}>
            <h2 className='text-center'>Forecasting and Anomaly Detection</h2>
            <Line ref={chartRef} options={Utils.chartOpts} data={Data.chartData} />
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Button className='w-100' onClick={() => makeForecast(Data.manningData, chartRef)}>Forecast Data</Button>
          </Col>
          <Col md={6}>
            <Button variant='warning' className='w-100' onClick={() => detectAnomalies(Data.manningData, chartRef)}>Detect Anomalies</Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
