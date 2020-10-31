var Service, Characteristic, HomebridgeAPI, UUIDGen, FakeGatoHistoryService;
var inherits = require('util').inherits;
var os = require("os");
var hostname = os.hostname();
const fs = require('fs');
const moment = require('moment');

module.exports = function (homebridge) {
	
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    UUIDGen = homebridge.hap.uuid;
    FakeGatoHistoryService = require("fakegato-history")(homebridge);

    homebridge.registerAccessory("homebridge-weather", "Wetter", Weather);
};

function Weather(log, config) {

    var that = this;
    this.log = log;
    this.name = config.name;
    this.displayName = this.name;
    this.deviceId = config.deviceId;

    this.config = config;

    this.setUpServices();
};

Weather.prototype.setUpServices = function () {

    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
        .setCharacteristic(Characteristic.Model, "Wetter")
        .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
    this.informationService.getCharacteristic(Characteristic.FirmwareRevision)
        .on('get', this.getFirmwareRevision.bind(this));
        
    this.tempService = new Service.TemperatureSensor("Temperatur");
    this.tempService.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({minValue: -50})
        .on('get', this.getCurrentTemperature.bind(this));
    this.tempService.getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getStatusLowBattery.bind(this));
    this.tempService.getCharacteristic(Characteristic.StatusActive)
        .on('get', this.getStatusActive.bind(this));

    this.fakeGatoHistoryService = new FakeGatoHistoryService("weather", this, { storage: 'fs' });
};

Weather.prototype.getServices = function () {
    var services = [this.informationService, 
    				this.tempService, 
					this.fakeGatoHistoryService];
    return services;
};
