const axios = require('axios');
const { cacheAdapterEnhancer, throttleAdapterEnhancer } = require('axios-extensions');
const config = require('../config');

const cacheAdapter = cacheAdapterEnhancer(axios.defaults.adapter);
const throttleAdapter = throttleAdapterEnhancer(cacheAdapter, config.http.throttle);

const opts = {
    adapter: throttleAdapter,
    timeout: config.http.timeout
};

const client = axios.create(opts)

client.interceptors.request.use(
    (conf) => {
        conf.metadata = { startTime: new Date() };
        return conf;
    },
    (error) => Promise.reject(error)
);

client.interceptors.response.use(
    (res) => {
        res.config.metadata.endTime = new Date();
        res.duration = res.config.metadata.endTime - res.config.metadata.startTime;
        return res;
    },
    (error) => {
        error.config.metadata.endTime = new Date();
        error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
        return Promise.reject(error);
    }
);


module.exports = client;