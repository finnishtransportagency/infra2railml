const axios = require('axios');
const { cacheAdapterEnhancer, throttleAdapterEnhancer } = require('axios-extensions');
const config = require('../config');

const cacheAdapter = cacheAdapterEnhancer(axios.defaults.adapter);
const throttleAdapter = throttleAdapterEnhancer(cacheAdapter, config.http.throttle);

module.exports = axios.create({ adapter: throttleAdapter });