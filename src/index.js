/**
 * fruit-weather
 * @description Displays weather on TFT backpack RasPi, in conjunction with drewlustro/weather-proxy.
 * @author Drew Lustro
 * @copyright Maxrelax Inc
 */

'use strict'

const request = require('request')
const chalk = require('chalk');
const log = console.log;

const sysnote = chalk.bold.blue;
const errnote = chalk.bold.red;
const note = chalk.dim.gray;
const success = chalk.green;
const ynote = chalk.yellow;
const black = chalk.black;

let blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    screen = blessed.screen(),
    options = {};

const DISPLAY = {
  PRIMARY: 0,
  NEXT: 1,
  LATER: 2,
  DISTANT: 3
}

const WEATHER_URL = "http://weather-proxy.maxrelax.co/weather.json";
const WEATHER_DATA = require("./fixtures/weather-data-initial");
const ROWS = 20;
const COLS = 30;
const PRIMARY_LCD_HEIGHT = Math.floor(ROWS * 0.62);
const FUTURES_LCD_HEIGHT = ROWS - PRIMARY_LCD_HEIGHT;
const FUTURES_LCD_WIDTH = Math.floor(COLS / 3);

Object.assign(options, {
  elements: 2,
  elementPadding: 2,
  elementSpacing: 2
});
let grid = new contrib.grid({
  rows: ROWS,
  cols: COLS,
  screen: screen /* hideBorder: true, */
});


let lcd0 = grid.set(
  0,
  0,
  PRIMARY_LCD_HEIGHT,
  COLS,
  contrib.lcd,
  Object.assign({}, options, { elementPadding: 4 })
);
let lcd1 = grid.set(
  PRIMARY_LCD_HEIGHT,
  0,
  FUTURES_LCD_HEIGHT,
  FUTURES_LCD_WIDTH,
  contrib.lcd,
  Object.assign({}, options)
);
let lcd2 = grid.set(
  PRIMARY_LCD_HEIGHT,
  FUTURES_LCD_WIDTH,
  FUTURES_LCD_HEIGHT,
  FUTURES_LCD_WIDTH,
  contrib.lcd,
  Object.assign({}, options)
);
let lcd3 = grid.set(
  PRIMARY_LCD_HEIGHT,
  FUTURES_LCD_WIDTH * 2,
  FUTURES_LCD_HEIGHT,
  FUTURES_LCD_WIDTH + 1,
  contrib.lcd,
  Object.assign({}, options)
);

let lcds = [lcd0, lcd1, lcd2, lcd3]

// every 5 min
setInterval(updateWeatherData, (60 * 5) * 1000)
setTimeout(updateWeatherData, 2000)

screen.key(['k'], function (ch, key) {
  lcds.forEach(x => x.increaseWidth())
  updateDisplay()
});
screen.key(['j'], function (ch, key) {
  lcds.forEach(x => x.decreaseWidth())
  updateDisplay()
});
screen.key(['t'], function (ch, key) {
  lcds.forEach(x => x.increaseInterval())
  updateDisplay()
});
screen.key(['y'], function (ch, key) {
  lcds.forEach(x => x.decreaseInterval())
  updateDisplay()
});
screen.key(['b'], function (ch, key) {
  lcds.forEach(x => x.increaseStroke())
  updateDisplay()
});
screen.key(['n'], function (ch, key) {
  lcds.forEach(x => x.decreaseStroke())
  updateDisplay()
});

screen.key(['1'], function (ch, key) {
  updateWeatherData()
});

screen.key(['escape', 'q', 'C-c'], function (ch, key) {
  console.dir(lcd0.segment16)
  return process.exit(0);
});

function updateDisplay() {
  let colors = ['green', 'magenta', 'cyan', 'red', 'blue'];
  let text = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  lcd0.setDisplay(getTemperatureForDisplay(DISPLAY.PRIMARY));
  lcd1.setDisplay(getTemperatureForDisplay(DISPLAY.NEXT));
  lcd2.setDisplay(getTemperatureForDisplay(DISPLAY.LATER));
  lcd3.setDisplay(getTemperatureForDisplay(DISPLAY.DISTANT));
  screen.render();
}

function updateWeatherData() {
  request({
    url: WEATHER_URL,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        digestWeatherData(body)
        updateDisplay()
        return 0
    } else {
      log(error("Error:", error))
      return
    }
  })
}

function digestWeatherData(body) {
  for (let tempReading of body) {
    WEATHER_DATA[`${tempReading.offset}`] = Object.assign({}, tempReading)
  }
}

function getTemperatureForDisplay(displayId) {
  let temperature
  switch (displayId) {
    case 0:
      temperature = WEATHER_DATA['0'].temperature
      break
    case 1:
      temperature = WEATHER_DATA['4'].temperature
      break
    case 2:
      temperature = WEATHER_DATA['8'].temperature
      break
    case 3:
      temperature = WEATHER_DATA['12'].temperature
      break
    default:
      temperature = 0
  }

  temperature = Math.round(temperature)
  let tempStr = String(temperature)
  if (tempStr.length <= 1) return `${temperature}`
  if (tempStr.length <= 2) return `${temperature}`
  if (tempStr.length <= 3) return `${temperature}`
  return `${temperature}`

}

