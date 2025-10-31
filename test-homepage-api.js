// Simple test script to check the homepage API with different months
const axios = require('axios');

// Replace with your actual API URL and auth token
const API_URL = 'http://localhost:3000/api/homepage/dashboard';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN';

async function testMonthlyData() {
  try {
    console.log('Testing homepage API with different months...');
    
    // Test current month (no params)
    const currentMonthResponse = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    console.log('Current month data:', JSON.stringify(currentMonthResponse.data.data.selectedMonthDebug, null, 2));
    console.log('Current month stats:', {
      totalProfit: currentMonthResponse.data.data.totalProfit,
      totalInterventions: currentMonthResponse.data.data.totalInterventions,
      totalExpenses: currentMonthResponse.data.data.totalExpenses
    });
    
    // Test January
    const janResponse = await axios.get(`${API_URL}?month=Jan`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    console.log('\nJanuary data:', JSON.stringify(janResponse.data.data.selectedMonthDebug, null, 2));
    console.log('January stats:', {
      totalProfit: janResponse.data.data.totalProfit,
      totalInterventions: janResponse.data.data.totalInterventions,
      totalExpenses: janResponse.data.data.totalExpenses
    });
    
    // Test June
    const juneResponse = await axios.get(`${API_URL}?month=Jun`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    console.log('\nJune data:', JSON.stringify(juneResponse.data.data.selectedMonthDebug, null, 2));
    console.log('June stats:', {
      totalProfit: juneResponse.data.data.totalProfit,
      totalInterventions: juneResponse.data.data.totalInterventions,
      totalExpenses: juneResponse.data.data.totalExpenses
    });
    
  } catch (error) {
    console.error('Error testing API:', error.response ? error.response.data : error.message);
  }
}

testMonthlyData();
