const axios = require('axios');
const { cacheAdapterEnhancer, throttleAdapterEnhancer } = require('axios-extensions');
const config = require('../config');

const cacheAdapter = cacheAdapterEnhancer(axios.defaults.adapter);
const throttleAdapter = throttleAdapterEnhancer(cacheAdapter, config.http.throttle);

const opts = {
    adapter: throttleAdapter,
    timeout: config.http.timeout
};

module.exports = axios.create(opts);