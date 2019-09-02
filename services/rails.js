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
const config = require('../config');
const http = require('./http-client');
const stations = require('./stations');
const Promise = require('bluebird');

function findById(id) {
    
    const url = `${config.infraApi.baseUrl}/raiteet/${id}.json`;

    const options = {
        params: { srsName: 'crs:84', presentation: 'diagram' },
    };

    return http.get(url, options)
        .then((res) => {
            process.stdout.write(`\r\x1b[K${res.status}: ${url} (${res.duration}ms)`);
            return _.first(res.data);
        })
        .then((rail) => {
            return new Promise((resolve, reject) => {
                if (!rail.liikennepaikanRaide || _.isObject(rail.liikennepaikanRaide.liikennepaikka)) {
                    resolve(rail);
                } else {
                    return stations.findById(rail.liikennepaikanRaide.liikennepaikka)
                        .then((station) => {
                            rail.liikennepaikanRaide.liikennepaikka = station;
                            return rail;
                        })
                        .then(resolve)
                        .catch(reject);
                }
            });
        })
        .catch((err) => {
            console.error(`\r\x1b[K${err.message}: ${url}`);
            return {};
        });
}

function findAllById(ids) {
    const opts = { concurrency: config.http.concurrency }
    return Promise.map(ids, findById, opts);
}

module.exports = {
    findById, findAllById
}