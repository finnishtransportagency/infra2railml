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
const _ = require('lodash');
const c = require('../config.js');
const http = require('./http-client');

/**
 * List all stations (liikennepaikat)
 */
function list() {
    
    const url = `${c.infraApi.baseUrl}/rautatieliikennepaikat.json`;

    const options = {
        params: { srsName: 'crs:84', presentation: 'diagram' }
    };

    return http.get(url, options)
        .then((res) => {
            process.stdout.write(`\r\x1b[K${res.status}: ${url} (${res.duration}ms)`);
            return _.sortBy(_.flatMap(res.data, (v, k) => v), 'nimi');
        })
        .catch((err) => {
            console.error(`\r\x1b[K${err.message}: ${url}`);
            return {};
        });
}

/**
 * Find station by ID.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/rautatieliikennepaikat/${id}.json`;

    const options = {
        params: { srsName: 'crs:84' }
    };

    return http.get(url, options)
        .then((res) => {
            process.stdout.write(`\r\x1b[K${res.status}: ${url}`);
            return _.first(res.data);
        })
        .catch((err) => {
            console.error(`\r\x1b[K${err.message}: ${url}`);
            return {};
        });
}

module.exports = {
    list, findById
}