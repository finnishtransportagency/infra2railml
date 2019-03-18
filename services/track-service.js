const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');

const BASE_URL = `${c.INFRA_API_URL}/${c.INFRA_API_VERSION}`
const TRACK_PROPERTIES = [
    'ratanumero', 'ratakm', 'kilometrimerkki' //, 'toimialueet', 'elementit', 
];

/**
 * Fetch specified track kilometers.
 * 
 * @param {*} trackId Track ID
 * @param {*} from First track kilometer to fetch
 * @param {*} length Number of following kilometers to fetch
 */
function fetchTrack(trackId, from, length) {
    return Promise.all(_.times(1 + length, (i) => {
        const url = `${BASE_URL}/radat/${trackId}/${from + i}.json`;
        return fetchKilometer(url);
    }));
}

/**
 * Fetch single track kilometer.
 */
function fetchKilometer(url) {

    const options = {
        params: {
            srsName: 'crs:84',
            propertyName: _.join(TRACK_PROPERTIES, ',')
        }
    };

    return axios.get(url, options)
      .then((res) => {
          console.info(`GET ${url} (${res.status})`);
          // TODO complement with child objects
          return _.first(res.data);
      })
      .catch((err) => {
          console.error(`Error: ${err.message}`);
          process.exit(err.status);
      });    

}

module.exports = {
    fetchTrack
};
