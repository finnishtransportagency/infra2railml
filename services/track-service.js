const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');
const kilometerService = require('./kilometer-service');
const elementService = require('./element-service');


const TRACK_PROPERTIES = [
    'ratanumero', 'ratakm', 'pituus', 'paalu', 'kilometrimerkki', 'elementit' //, 'toimialueet'
];

/**
 * Fetch specified track kilometers.
 * 
 * @param {*} trackId Track ID
 * @param {*} from First track kilometer to fetch
 * @param {*} length Number of following kilometers to fetch
 */
function getTrack(trackId, from, length) {
    return Promise.all(_.times(length + 1, (i) => {
        const url = `${c.BASE_URL}/radat/${trackId}/${from + i}.json`;
        return _fetchKilometer(url);
    }));
}

/**
 * Fetch single track kilometer.
 */
function _fetchKilometer(url) {

    const options = {
        params: {
            srsName: 'crs:84',
            propertyName: _.join(TRACK_PROPERTIES, ',')
        },
        transformResponse: (body) => _.first(JSON.parse(body)) // rid unnecessary array
    };

    return axios.get(url, options)
      .then((res) => {
          console.info(`${res.status}: ${url}`);
          return res.data;
      })
      .then((kilometer) => {
          return kilometerService.findById(kilometer.kilometrimerkki).then((mark) => {
             kilometer.kilometrimerkki = mark;
             return kilometer; 
          });
      })
      .then((kilometer) => {
          return Promise.all(_.map(kilometer.elementit, elementService.findById))
            .then((elements) => {
                kilometer.elementit = elements;
                return kilometer;
            });
      })
      .catch((err) => {
          console.error(`${err.message}: ${url}`);
          process.exit(err.status);
      });

}

module.exports = {
    getTrack
};
