var Service, Characteristic, HomebridgeAPI, UUIDGen, FakeGatoHistoryService;
var inherits = require('util').inherits;
var os = require("os");
var hostname = os.hostname();
var request = require("request");
const fs = require('fs');
const moment = require('moment');

var lastData = "";
var data = "";
var success = false;

var temperature;
var tempMin;
var tempMax;
var airPressure;
var humidity;
var p25;
var p10;
var airQuality;
var light;
var uvLevel;
var rainToday;
var rain1h;
var avgWind;
var maxWind;
var storm;
var raining;

module.exports = function (homebridge) {
	
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    UUIDGen = homebridge.hap.uuid;
    FakeGatoHistoryService = require("fakegato-history")(homebridge);

    homebridge.registerAccessory("homebridge-weather", "Weather", Weather);
};

function read() {
	
    request(url, function (error, response, body) {

			lastData = data;
			data = body.substr(20);
			
			var str = body.substr(20, 5);
			for (i = 0; i < 6; i++)
				if (str[i] != ' ') break;
			if (i) str = str.substr(i);
			temperature = parseFloat(str);
			
			str = body.substr(26, 5);
			for (i = 0; i < 6; i++)
				if (str[i] != ' ') break;
			if (i) str = str.substr(i);
			tempMin = parseFloat(str);
			
			str = body.substr(32, 5);
			for (i = 0; i < 6; i++)
				if (str[i] != ' ') break;
			if (i) str = str.substr(i);
			tempMax = parseFloat(str);
			
			str = body.substr(38, 2);
			humidity = parseFloat(str);
	
			str = body.substr(41, 4);
			airPressure = parseFloat(str);

			str = body.substr(46, 4);
			p25 = parseFloat(str);
			
			str = body.substr(51, 4);
			p10 = parseFloat(str);

			str = body.substr(56, 1);
			airQuality = parseFloat(str);

			str = body.substr(58, 6);
			light = parseFloat(str);

			str = body.substr(65, 4);
			uv = parseFloat(str);

			str = body.substr(70, 3);
			rainToday = parseFloat(str);

			str = body.substr(74, 3);
			rain1h = parseFloat(str);

			str = body.substr(78, 4);
			avgWind = parseFloat(str);

			str = body.substr(83, 4);
			maxWind = parseFloat(str);

			storm = (body.substr(88, 1) == '1');

			raining = (body.substr(90, 1) == '1');
	});	
}; 

function Weather(log, config) {

    var that = this;
    this.log = log;
    this.name = config.name;
    this.displayName = this.name;
    this.deviceId = config.deviceId;

	url = "http://wetterstation/data";

    this.config = config;

    this.setUpServices();
    
    read();
    
    setInterval(function() {
    		read();
    		if (data == lastData) // data.localeCompare(lastData))
    			that.log("unchanged");
    		else {
	    		that.log(data);
    			//that.log("Temperatur: " + temperature + "°C Luftfeuchtigkeit: " + humidity + "% Luftdruck: " + airPressure + "hPa P25: " + p25 + " P10: " + p10 + " Licht: " + light + "lux UV: " + uv + " Regen letzte Stunde: " + rain1h + "mm Regen heute: " + rainToday + "mm Wind: " + avgWind + "km/h Böen: " + maxWind + "km/h Sturm: " + storm + " Regen: " + raining);
				that.fakeGatoHistoryService.addEntry({time: moment().unix(), temp: temperature, pressure: airPressure, humidity: humidity});
				that.fakeGatoHistoryService.addEntry({time: moment().unix(), status: storm});
    			}
			}, 15000); // 15s
};

Weather.prototype.getFirmwareRevision = function (callback) {
    return callback(null, '1.0');
};

Weather.prototype.getCurrentTemperature = function (callback) {
    return callback(null, temperature);
};

Weather.prototype.getCurrentHumidity = function (callback) {
    return callback(null, humidity);
};

Weather.prototype.getCurrentAirPressure = function (callback) {
    return callback(null, airPressure);
};

Weather.prototype.getCurrentAirQuality25 = function (callback) {
    return callback(null, p25);
};

Weather.prototype.getCurrentAirQualitySize = function (callback) {
    return callback(null, 0);
};

Weather.prototype.getCurrentAirQuality = function (callback) {
    return callback(null, airQuality);
};

Weather.prototype.getStatusActive = function (callback) {
    return callback(null, true);
};

Weather.prototype.getCurrentAmbientLightLevel = function (callback) {
    return callback(null, light);
};

Weather.prototype.getCurrentUVlevel = function (callback) {
    return callback(null, uvLevel);
};

Weather.prototype.getRain1h = function (callback) {
    return callback(null, rain1h);
};

Weather.prototype.getRainToday = function (callback) {
    return callback(null, rainToday);
};

Weather.prototype.getAvgWind = function (callback) {
    return callback(null, avgWind);
};

Weather.prototype.getMaxWind = function (callback) {
    return callback(null, maxWind);
};

Weather.prototype.getStorm = function (callback) {
    return callback(null, storm);
};

Weather.prototype.getRaining = function (callback) {
    return callback(null, raining);
};

Weather.prototype.setUpServices = function () {

    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
        .setCharacteristic(Characteristic.Model, "Wetter")
        .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
    this.informationService.getCharacteristic(Characteristic.FirmwareRevision)
        .on('get', this.getFirmwareRevision.bind(this));
        
    this.tempService = new Service.TemperatureSensor("Wetter");
    this.tempService.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({minValue: -50})
        .on('get', this.getCurrentTemperature.bind(this));
    this.tempService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getCurrentHumidity.bind(this));
    this.tempService.getCharacteristic(Characteristic.StatusActive)
        .on('get', this.getStatusActive.bind(this));
    this.tempService.getCharacteristic(Characteristic.MotionDetected)
        .on('get', this.getStorm.bind(this));
 
    this.fakeGatoHistoryService = new FakeGatoHistoryService("weather", this, { storage: 'fs' });

   	var CustomCharacteristic = {};
   
    CustomCharacteristic.AirPressure = function () {
		Characteristic.call(this, 'Air Pressure', 'E863F10F-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: "hPa",
            maxValue: 1100,
            minValue: 700,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.AirPressure, Characteristic);
    CustomCharacteristic.AirPressure.UUID = 'E863F10F-079E-48FF-8F27-9C2605A29F52';

    CustomCharacteristic.AirQuality = function () {
		Characteristic.call(this, 'Quality', '00000095-0000-1000-8000-0026BB765291');
        this.setProps({
            format: Characteristic.Formats.UINT8,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.AirQuality, Characteristic);
    CustomCharacteristic.AirQuality.UUID = '00000095-0000-1000-8000-0026BB765291';

    CustomCharacteristic.AirParticulateSize = function () {
		Characteristic.call(this, 'Size', '00000065-0000-1000-8000-0026BB765291');
        this.setProps({
            format: Characteristic.Formats.UINT8,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.AirParticulateSize, Characteristic);
    CustomCharacteristic.AirParticulateSize.UUID = '00000065-0000-1000-8000-0026BB765291';

    CustomCharacteristic.AirParticulateDensity = function () {
		Characteristic.call(this, 'P25', '00000064-0000-1000-8000-0026BB765291');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.AirParticulateDensity, Characteristic);
    CustomCharacteristic.AirParticulateDensity.UUID = '00000064-0000-1000-8000-0026BB765291';

    CustomCharacteristic.UVlevel = function () {
		Characteristic.call(this, 'UV', '05ba0fe0-b848-4226-906d-5b64272e05ce');
        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: "W/m2",
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.UVlevel, Characteristic);
    CustomCharacteristic.UVlevel.UUID = '05ba0fe0-b848-4226-906d-5b64272e05ce';

    CustomCharacteristic.Rain1h = function () {
		Characteristic.call(this, 'Rain today', '10c88f40-7ec4-478c-8d5a-bd0c3cce14b7');
        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: "mm",
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.Rain1h, Characteristic);
    CustomCharacteristic.Rain1h.UUID = '10c88f40-7ec4-478c-8d5a-bd0c3cce14b7';

    CustomCharacteristic.RainToday = function () {
		Characteristic.call(this, 'Rain 1h', 'ccc04890-565b-4376-b39a-3113341d9e0f');
        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: "mm",
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.RainToday, Characteristic);
    CustomCharacteristic.RainToday.UUID = 'ccc04890-565b-4376-b39a-3113341d9e0f';

    CustomCharacteristic.avgWind = function () {
		Characteristic.call(this, 'Wind', '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: "km/h",
            maxValue: 300,
            minValue: 0,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.avgWind, Characteristic);
    CustomCharacteristic.avgWind.UUID = '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41';

    CustomCharacteristic.Raining = function () {
		Characteristic.call(this, 'Regen', 'f14eb1ad-e000-4ef4-a54f-0cf07b2e7be7');
        this.setProps({
            format: Characteristic.Formats.BOOL,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(CustomCharacteristic.Raining, Characteristic);
    CustomCharacteristic.Raining.UUID = 'f14eb1ad-e000-4ef4-a54f-0cf07b2e7be7';

    
    this.tempService.getCharacteristic(CustomCharacteristic.AirPressure)
		.on('get', this.getCurrentAirPressure.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.AirQuality)
		.on('get', this.getCurrentAirQuality.bind(this));
    
    this.tempService.getCharacteristic(CustomCharacteristic.AirParticulateSize)
		.on('get', this.getCurrentAirQualitySize.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.AirParticulateDensity)
		.on('get', this.getCurrentAirQuality25.bind(this));
		
    this.tempService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on('get', this.getCurrentAmbientLightLevel.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.UVlevel)
        .on('get', this.getCurrentUVlevel.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.Rain1h)
        .on('get', this.getRain1h.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.RainToday)
        .on('get', this.getRainToday.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.avgWind)
        .on('get', this.getAvgWind.bind(this));

    this.tempService.getCharacteristic(CustomCharacteristic.Raining)
        .on('get', this.getRaining.bind(this));
};
    
Weather.prototype.getServices = function () {
    var services = [this.informationService, 
    				this.tempService, 
					this.fakeGatoHistoryService];
    return services;
};
