
"use strict";

// =====================================
// 1. SELECT HTML ELEMENTS
// =====================================

var searchForm = document.querySelector("#searchForm");
var cityInput = document.querySelector("#cityInput");
var message = document.querySelector("#message");

var cityName = document.querySelector("#cityName");
var currentDate = document.querySelector("#currentDate");
var weatherIcon = document.querySelector("#weatherIcon");
var temperature = document.querySelector("#temperature");
var weatherDescription = document.querySelector("#weatherDescription");
var feelsLike = document.querySelector("#feelsLike");

var humidity = document.querySelector("#humidity");
var windSpeed = document.querySelector("#windSpeed");
var uvIndex = document.querySelector("#uvIndex");
var uvDescription = document.querySelector("#uvDescription");
var visibility = document.querySelector("#visibility");

var hourlyForecast = document.querySelector("#hourlyForecast");
var weeklyForecast = document.querySelector("#weeklyForecast");


// =====================================
// 2. WEATHER CODE HELPER
// =====================================

function getWeatherInfo(code) {

    if (code === 0) {
        return { text: "Clear sky", icon: "☀️" };
    } else if (code === 1) {
        return { text: "Mainly clear", icon: "🌤️" };
    } else if (code === 2) {
        return { text: "Partly cloudy", icon: "⛅" };
    } else if (code === 3) {
        return { text: "Overcast", icon: "☁️" };
    } else if ([45, 48].includes(code)) {
        return { text: "Foggy", icon: "🌫️" };
    } else if ([51, 53, 55, 56, 57].includes(code)) {
        return { text: "Drizzle", icon: "🌦️" };
    } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return { text: "Rainy", icon: "🌧️" };
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return { text: "Snowy", icon: "❄️" };
    } else if ([95, 96, 99].includes(code)) {
        return { text: "Thunderstorm", icon: "⛈️" };
    }

    return { text: "Unknown conditions", icon: "🌡️" };
}


// =====================================
// 3. UV INDEX DESCRIPTION
// =====================================

function getUVDescription(value) {

    if (value <= 2) {
        return "Low";
    } else if (value <= 5) {
        return "Moderate";
    } else if (value <= 7) {
        return "High";
    } else if (value <= 10) {
        return "Very high";
    }

    return "Extreme";
}


// =====================================
// 4. FORMAT TIME
// =====================================

function formatTime(dateString) {
    var date = new Date(dateString);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true
    });
}


// =====================================
// 5. FORMAT DAY
// =====================================

function formatDay(dateString) {
    var date = new Date(dateString + "T12:00:00");

    return date.toLocaleDateString("en-US", {
        weekday: "short"
    });
}


// =====================================
// 6. FETCH WEATHER DATA
// =====================================

async function getWeather(city) {

    try {
        message.textContent = "Fetching live weather data...";
        hourlyForecast.innerHTML =
            '<p class="empty-state">Loading hourly forecast...</p>';
        weeklyForecast.innerHTML =
            '<p class="empty-state">Loading weekly forecast...</p>';

        // Step A: Find city coordinates
        var geoURL =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(city) +
            "&count=1&language=en&format=json";

        var geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Could not search for this city.");
        }

        var geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Check the spelling and try again.");
        }

        var place = geoData.results[0];

        // Step B: Get current, hourly and daily weather
        var weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + place.latitude +
            "&longitude=" + place.longitude +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,uv_index,visibility" +
            "&hourly=temperature_2m,weather_code,precipitation_probability" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset" +
            "&forecast_days=7" +
            "&temperature_unit=celsius" +
            "&wind_speed_unit=kmh" +
            "&timezone=auto";

        var weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Could not load weather data.");
        }

        var data = await weatherResponse.json();

        // Step C: Display current weather
        var current = data.current;
        var info = getWeatherInfo(current.weather_code);

        cityName.textContent =
            place.name + ", " + (place.country || "Unknown country");

        currentDate.textContent =
            new Date(current.time).toLocaleString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "2-digit"
            });

        weatherIcon.textContent = info.icon;
        temperature.textContent =
            Math.round(current.temperature_2m) + "°C";

        weatherDescription.textContent = info.text;

        feelsLike.textContent =
            Math.round(current.apparent_temperature) + "°C";

        humidity.textContent =
            current.relative_humidity_2m + "%";

        windSpeed.textContent =
            current.wind_speed_10m + " km/h";

        uvIndex.textContent =
            Number(current.uv_index).toFixed(1);

        uvDescription.textContent =
            getUVDescription(current.uv_index);

        visibility.textContent =
            (current.visibility / 1000).toFixed(1) + " km";

        // Step D: Display hourly forecast
        showHourlyForecast(data.hourly, current.time);

        // Step E: Display 7-day forecast
        showWeeklyForecast(data.daily);

        message.textContent =
            "Weather updated successfully for " + place.name + ".";

    } catch (error) {
        message.textContent = error.message ||
            "Something went wrong. Please try again.";

        hourlyForecast.innerHTML =
            '<p class="empty-state">Hourly forecast unavailable.</p>';

        weeklyForecast.innerHTML =
            '<p class="empty-state">Weekly forecast unavailable.</p>';

        console.error("Weather error:", error);
    }
}


// =====================================
// 7. HOURLY FORECAST
// =====================================

function showHourlyForecast(hourly, currentTime) {

    var startIndex = hourly.time.findIndex(function (time) {
        return time >= currentTime;
    });

    if (startIndex === -1) {
        startIndex = 0;
    }

    var nextHours = hourly.time.slice(startIndex, startIndex + 8);

    hourlyForecast.innerHTML = nextHours.map(function (time) {

        var index = hourly.time.indexOf(time);
        var info = getWeatherInfo(hourly.weather_code[index]);

        var label = index === startIndex
            ? "NOW"
            : formatTime(time);

        return `
            <article class="hour-card">
                <p class="hour-time">${label}</p>
                <div class="hour-icon">${info.icon}</div>
                <p class="hour-temp">
                    ${Math.round(hourly.temperature_2m[index])}°
                </p>
                <p class="hour-rain">
                    ${hourly.precipitation_probability[index] ?? 0}% rain
                </p>
                <p class="hour-description">${info.text}</p>
            </article>
        `;

    }).join("");
}


// =====================================
// 8. SEVEN-DAY FORECAST
// =====================================

function showWeeklyForecast(daily) {

    weeklyForecast.innerHTML = daily.time.map(function (date, index) {

        var info = getWeatherInfo(daily.weather_code[index]);

        return `
            <article class="day-card">
                <p class="day-name">${index === 0 ? "Today" : formatDay(date)}</p>
                <p class="day-date">${date.slice(5)}</p>
                <div class="day-icon">${info.icon}</div>
                <p class="day-temps">
                    ${Math.round(daily.temperature_2m_max[index])}° /
                    ${Math.round(daily.temperature_2m_min[index])}°
                </p>
                <p class="day-description">${info.text}</p>
            </article>
        `;

    }).join("");
}


// =====================================
// 9. SEARCH EVENT
// =====================================

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    var city = cityInput.value.trim();

    if (city === "") {
        message.textContent = "Please enter a city name.";
        return;
    }

    getWeather(city);
});


// =====================================
// 10. DEFAULT CITY
// =====================================

getWeather("Karachi");
