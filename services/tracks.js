const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');
const kilometers = require('./kilometers');
const elements = require('./elements');


/**
 * Fetch specified track kilometers.
 * 
 * @param {*} trackId Track ID
 * @param {*} from First track kilometer to fetch
 * @param {*} length Number of following kilometers to fetch
 */
function getTrack(trackId, from, length) {
    return Promise.all(
        _.times(length, (i) => getKilometer(trackId, from + i))
    ).then((kilometers) => _.filter(kilometers, (km) => !_.isEmpty(km)));
}

/**
 * Fetch single track kilometer.
 */
function getKilometer(trackId, km) {

    const url = `${c.infraApi.baseUrl}/radat/${trackId}/${km}.json`;

    const options = {
        params: { srsName: 'crs:84' },
        transformResponse: (body) => _.first(JSON.parse(body))
    };

    return axios.get(url, options)
      .then((res) => {
          console.info(`${res.status}: ${url}`);
          return res.data;
      })
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
              kilometer.elementit = elements;
              return kilometer;
          });
        })
      .catch((err) => {
          console.error(`${err.message}: ${url}`);
          //process.exit(err.status);
          return {};
      });

}

module.exports = {
    getTrack, getKilometer
};
