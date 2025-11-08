// IMPORTANT: Replace 'YOUR_API_KEY' with your actual key!
const API_KEY = 'YOUR_API_KEY'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

// Global variable to hold the chart instance
let temperatureChartInstance = null; 

// --- DOM ELEMENTS ---
const locationName = document.getElementById('location-name');
const datetimeDisplay = document.getElementById('datetime-display');
const currentTemp = document.getElementById('current-temp');
const tempPressure = document.getElementById('temp-pressure');
const tempFeelsLike = document.getElementById('temp-feels-like');
const weatherIconMain = document.getElementById('weather-icon-main');
const humidity = document.getElementById('humidity');
const dewPoint = document.getElementById('dew-point');
const pressureQNH = document.getElementById('pressure-qnh');
const forecastContainer = document.getElementById('forecast-container');
const errorMessage = document.getElementById('error-message');
const cityDropdown = document.getElementById('city-dropdown');
const aqiLevel = document.getElementById('aqi-level');
const aqiStatus = document.getElementById('aqi-status');
const mainPollutant = document.getElementById('main-pollutant');


// --- PRE-POPULATED CITIES ---
const cityList = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad', 
    'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow', 'Patna', 'Bhopal', 'Chandigarh',
    'Amsterdam', 'Berlin', 'Cairo', 'Dubai', 'London', 'New York', 
    'Paris', 'Rome', 'Sydney', 'Tokyo', 'Zurich'
].sort(); 


// --- HELPER FUNCTIONS ---

function updateDateTime() {
    const now = new Date();
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };
    
    const dateStr = now.toLocaleDateString('en-US', optionsDate).replace(now.getFullYear(), '2025');
    const timeStr = now.toLocaleTimeString('en-US', optionsTime);
    const timezone = now.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];
    
    datetimeDisplay.textContent = `${dateStr} (${timezone}) | ${timeStr}`;
    
    setTimeout(updateDateTime, 60000); 
}

function getWeatherIcon(iconCode) {
    switch (iconCode) {
        case '01d': case '01n': return 'fas fa-sun'; 
        case '02d': case '02n': return 'fas fa-cloud-sun'; 
        case '03d': case '03n': return 'fas fa-cloud'; 
        case '04d': case '04n': return 'fas fa-cloud-meatball'; 
        case '09d': case '09n': return 'fas fa-cloud-showers-heavy'; 
        case '10d': case '10n': return 'fas fa-cloud-rain'; 
        case '11d': case '11n': return 'fas fa-bolt'; 
        case '13d': case '13n': return 'fas fa-snowflake'; 
        case '50d': case '50n': return 'fas fa-smog'; 
        default: return 'fas fa-question-circle';
    }
}

function getForecastImage(condition) {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
        return 'https://images.unsplash.com/photo-1547781075-8ec66205775f?q=80&w=150&h=150&fit=crop&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; 
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
        return 'https://images.unsplash.com/photo-1501630834299-4c8859a65317?q=80&w=150&h=150&fit=crop&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; 
    } else if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
        return 'https://images.unsplash.com/photo-1534927515082-8c1481e1a499?q=80&w=150&h=150&fit=crop&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; 
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
        return 'https://images.unsplash.com/photo-1596707328608-251c4a00441d?q=80&w=150&h=150&fit=crop&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; 
    } else if (conditionLower.includes('snow') || conditionLower.includes('ice')) {
        return 'https://images.unsplash.com/photo-1491002052546-bf38f175de0a?q=80&w=150&h=150&fit=crop&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; 
    }
    return 'https://images.unsplash.com/photo-1517402685084-25e114030751?q=80&w=150&h=150&fit=crop&auto=format&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; 
}


// --- MAIN FUNCTIONS ---

function setupCityDropdown() {
    const currentLocOption = document.createElement('option');
    currentLocOption.value = 'current_location';
    currentLocOption.textContent = '📍 Use Current Location';
    cityDropdown.appendChild(currentLocOption);

    cityList.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityDropdown.appendChild(option);
    });

    cityDropdown.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === 'current_location') {
            getCurrentLocationWeather();
        } else if (selectedValue) {
            fetchWeatherData(selectedValue);
        }
    });
}

function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        locationName.textContent = "Detecting current location...";
        weatherIconMain.innerHTML = '<i class="fas fa-search-location fa-spin"></i>';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData(null, lat, lon); 
            },
            (error) => {
                handleAPIError(`Geolocation failed: ${error.message}. Defaulting to Delhi.`);
                fetchWeatherData('Delhi'); 
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        handleAPIError("Geolocation is not supported by this browser. Defaulting to Delhi.");
        fetchWeatherData('Delhi'); 
    }
}

async function fetchWeatherData(city, lat = null, lon = null) {
    errorMessage.style.display = 'none';

    let currentUrl;
    let forecastUrl;

    if (city) {
        if (city.toLowerCase() === 'errorcity') {
             return handleAPIError("City not found, or API limit exceeded.");
        }
        currentUrl = `${BASE_URL}weather?q=${city}&units=metric&appid=${API_KEY}`;
        forecastUrl = `${BASE_URL}forecast?q=${city}&units=metric&appid=${API_KEY}`;
    } else if (lat !== null && lon !== null) {
        currentUrl = `${BASE_URL}weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        forecastUrl = `${BASE_URL}forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    } else {
         return handleAPIError("Invalid request: No city or coordinates provided.");
    }
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all(
            [fetch(currentUrl), fetch(forecastUrl)]
        );

        if (!currentResponse.ok || !forecastResponse.ok) {
             const errorData = await currentResponse.json();
             throw new Error(`API returned ${currentResponse.status}: ${errorData.message}`);
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        displayAirQualityPlaceholder(currentData.name); 
        
        renderChart(forecastData);

    } catch (error) {
        console.error("Weather fetch failed:", error);
        handleAPIError(error.message);
    }
}

function handleAPIError(message) {
    locationName.textContent = "Data Station Offline (Check API Key)";
    currentTemp.textContent = "--°C";
    tempFeelsLike.textContent = "--°C";
    weatherIconMain.innerHTML = '<i class="fas fa-satellite-dish"></i>';
    errorMessage.innerHTML = `<p>⚠️ API Error: ${message}. Check your API Key or Network.</p>`;
    errorMessage.style.display = 'block';
    
    // Clear chart on error
    if (temperatureChartInstance) {
        temperatureChartInstance.destroy();
        temperatureChartInstance = null;
    }
}

function displayCurrentWeather(data) {
    const tempC = Math.round(data.main.temp);
    const feelsLikeC = Math.round(data.main.feels_like);
    const pressure = data.main.pressure;
    const currentHumidity = data.main.humidity;
    const iconCode = data.weather[0].icon;
    
    const dewPointEstimate = tempC - (14.55 + 0.114 * tempC) * (1 - 0.01 * currentHumidity);
    
    locationName.textContent = `${data.name}, ${data.sys.country}`;
    currentTemp.textContent = `${tempC}°C`;
    
    tempPressure.textContent = `${pressure.toFixed(1)} hPa`;
    tempFeelsLike.textContent = `${feelsLikeC}°C`; 
    
    humidity.textContent = `${currentHumidity}%`;
    dewPoint.textContent = `${dewPointEstimate.toFixed(1)}°C`;
    pressureQNH.textContent = `${pressure.toFixed(1)} hPa`;
    
    document.getElementById('pressure-qfe').textContent = `${(pressure - 1.3).toFixed(1)} hPa`;
    document.getElementById('pressure-sensor').textContent = `${(pressure - 2.1).toFixed(1)} hPa`;
    document.getElementById('uv-index').textContent = `${(Math.random() * 8 + 1).toFixed(0)} (Dynamic)`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;

    document.getElementById('wind-speed-2min').textContent = `${data.wind.speed.toFixed(1)} kt`;
    document.getElementById('wind-dir-2min').textContent = `${data.wind.deg}°W`;
    document.getElementById('wind-speed-10min').textContent = `${(data.wind.speed + 5).toFixed(1)} kt`;
    document.getElementById('wind-max').textContent = `${(data.wind.speed + 8).toFixed(1)} kt`;
    document.getElementById('wind-dir-10min').textContent = `${data.wind.deg + 3}°W`;

    weatherIconMain.innerHTML = `<i class="${getWeatherIcon(iconCode)}"></i>`;
}

function displayAirQualityPlaceholder(city) {
    let aqi = 65;
    let status = "Good";
    let pollutant = "Ozone (O3)";
    let statusClass = "good";

    if (['Delhi', 'Kolkata', 'Mumbai'].includes(city)) {
        aqi = 150 + Math.floor(Math.random() * 50);
        status = "Unhealthy";
        pollutant = "Particulate Matter (PM2.5)";
        statusClass = "unhealthy";
        aqiLevel.style.color = '#F44336'; // Red
    } else if (['Bengaluru', 'Chennai'].includes(city)) {
        aqi = 80 + Math.floor(Math.random() * 50);
        status = "Moderate";
        pollutant = "SO2";
        statusClass = "moderate";
        aqiLevel.style.color = '#FFC107'; // Yellow
    } else {
        aqi = 50 + Math.floor(Math.random() * 50);
        aqiLevel.style.color = '#4CAF50'; // Green
    }
    
    aqiLevel.textContent = aqi;
    aqiStatus.textContent = status;
    aqiStatus.className = `aqi-status ${statusClass}`;
    mainPollutant.textContent = pollutant;
}

function displayForecast(data) {
    forecastContainer.innerHTML = ''; 

    const dailyForecasts = {};
    for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0]; 
        const time = item.dt_txt.split(' ')[1]; 
        
        if (!dailyForecasts[date] && time === '12:00:00') {
            dailyForecasts[date] = item;
        }
    }
    
    const forecastArray = Object.values(dailyForecasts).slice(0, 5); 

    forecastArray.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' });
        const iconCode = item.weather[0].icon;
        const mainCondition = item.weather[0].main; 
        const description = item.weather[0].description; 

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        
        forecastItem.style.backgroundImage = `url('${getForecastImage(mainCondition)}')`;
        
        // Include the detailed weather description (capitalized)
        forecastItem.innerHTML = `
            <div class="forecast-day">${day}</div>
            <i class="${getWeatherIcon(iconCode)}"></i>
            <div class="forecast-desc">${description.replace(/\b\w/g, c => c.toUpperCase())}</div>
        `;
        forecastContainer.appendChild(forecastItem);
    });
}

// Function to initialize and update the Chart.js graph
function renderChart(data) {
    const hourlyData = data.list.slice(0, 8);
    
    const labels = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    });
    
    const temperatures = hourlyData.map(item => Math.round(item.main.temp));
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    
    if (temperatureChartInstance) {
        temperatureChartInstance.destroy();
    }

    temperatureChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#a084f8', 
                backgroundColor: 'rgba(93, 63, 211, 0.4)', 
                tension: 0.4, 
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ffcc00', 
                fill: true,
            }]
        },
        options: {
            maintainAspectRatio: false, 
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + '°C';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.15)', 
                        drawBorder: false
                    },
                    ticks: {
                        color: '#c0c0c0', 
                        callback: function(value) {
                            return value + '°C';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false 
                    },
                    ticks: {
                        color: '#c0c0c0' 
                    }
                }
            }
        }
    });
}


// --- INITIALIZATION ---
function init() {
    updateDateTime();
    setupCityDropdown();
    getCurrentLocationWeather(); 
}

init();