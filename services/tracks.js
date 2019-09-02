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
const config = require('../config.js');
const kilometers = require('./kilometers');
const elements = require('./elements');
const rails = require('./rails');
const http = require('./http-client');
const Promise = require('bluebird');

/**
 * Fetch plain track kilometer object.
 */
function fetchKilometer(trackId, km) {
    
    const url = `${config.infraApi.baseUrl}/radat/${trackId}/${km}.json`;

    const options = {
        params: { srsName: 'crs:84', presentation: 'diagram' },
    };

    return http.get(url, options)
      .then((res) => {
        process.stdout.write(`\r\x1b[K${res.status}: ${url} (${res.duration}ms)`);
        return _.first(res.data);
      })
      .catch((err) => {
        console.error(`\r\x1b[K${err}: ${url}`);
        throw err;
      });
}

/**
 * Fetch specified track kilometers.
 * 
 * @param {*} trackNumber Track ID
 * @param {*} from First track kilometer to fetch
 * @param {*} length Number of kilometers to fetch
 */
function getKilometers(trackNumber, from, length) {

    console.info(`Loading track ${trackNumber} [${from}..${from+length-1} km] ..`);

    const n = _.times(length, (i) => i);
    const opts = { concurrency: config.http.concurrency };

    return Promise.map(n, (i) => getKilometer(trackNumber, from + i), opts)
        .then((kilometers) => _.reject(kilometers, _.isEmpty));
}

/**
 * Fetch single track kilometer, complemented with child objects.
 */
function getKilometer(trackId, km) {

    return fetchKilometer(trackId, km)
      .then((kilometer) => {
          return kilometers.findById(kilometer.kilometrimerkki)
            .then((mark) => {
                kilometer.kilometrimerkki = mark;
                return kilometer; 
            });
      })
      .then((kilometer) => {
        const opts = { concurrency: config.http.concurrency };
        return Promise.map(kilometer.elementit, elements.findById, opts)
          .then((elements) => {
              return Promise.map(elements, (element) => {
                // Elements often refer to same rails over and over again so the rails may
                // have been loaded already, hence checking if the list contains objects or ids.
                const railIds = _.map(element.raiteet, (r) => _.isObject(r) ? r.tunniste : r);
                return rails.findAllById(railIds).then((rails) => {
                    element.raiteet = rails;
                    return element;
                  });
              });
          })
          .then((elements) => {
              kilometer.elementit = elements;
              return kilometer;
          });
        })
      .catch((err) => {
          // console.error(`\r\x1b[K${err.message}`);
          return {};
      });
}

module.exports = {
    getKilometer, getKilometers
};
