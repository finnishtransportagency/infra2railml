/*
 * Copyright 2019 FINNISH TRANSPORT INFRASTRUCTURE AGENCY
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission – subsequent versions of the EUPL (the "License");
 * You may not use this work except in compliance with the License.
 * 
 * You may obtain a copy of the License at:
 * https://joinup.ec.europa.eu/software/page/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
const axios = require('axios');
const { cacheAdapterEnhancer, throttleAdapterEnhancer } = require('axios-extensions');
const config = require('../config');
const https = require('https');

const cacheAdapter = cacheAdapterEnhancer(axios.defaults.adapter);
const throttleAdapter = throttleAdapterEnhancer(cacheAdapter, config.http.throttle);

const opts = {
    adapter: throttleAdapter,
    timeout: config.http.timeout,
    httpsAgent = new https.Agent({ keepAlive: true }),
    headers: {'accept-encoding': 'gzip'}
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