const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');
const kilometers = require('./kilometers');
const elements = require('./elements');
const rails = require('./rails');
const http = require('./http-client');

/**
 * Fetch plain track kilometer object.
 */
function fetchKilometer(trackId, km) {
    
    const url = `${c.infraApi.baseUrl}/radat/${trackId}/${km}.json`;

    const options = {
        params: { srsName: 'crs:84' },
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

    return Promise.all(
        _.times(length, (i) => getKilometer(trackNumber, from + i))
    ).then((kilometers) =>
        _.reject(kilometers, _.isEmpty)
    );
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
        return Promise.all(_.map(kilometer.elementit, elements.findById))
          .then((elements) => {
              return Promise.all(_.map(elements, (e) => {
                return rails.findAllById(e.raiteet).then((rails) => {
                    e.raiteet = rails;
                    return e;
                  })
              }));
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
