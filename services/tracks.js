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
        transformResponse: (body) => _.first(JSON.parse(body))
    };

    return http.get(url, options)
      .then((res) => {
          console.info(`${res.status}: ${url}`);
          return res.data;
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
                return rails.findAllById(element.raiteet).then((rails) => {
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
          console.error(`${err.message}`);
          return {};
      });
}

module.exports = {
    getKilometer, getKilometers
};
