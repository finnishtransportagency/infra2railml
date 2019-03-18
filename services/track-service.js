const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');
const kmService = require('./km-service');
const elementService = require('./element-service');


const TRACK_PROPERTIES = [
    'ratanumero', 'ratakm', 'kilometrimerkki', 'elementit' //, 'toimialueet'
];

/**
 * Fetch specified track kilometers.
 * 
 * @param {*} trackId Track ID
 * @param {*} from First track kilometer to fetch
 * @param {*} length Number of following kilometers to fetch
 */
function fetchTrack(trackId, from, length) {
    return Promise.all(_.times(length+1, (i) => {
        const url = `${c.BASE_URL}/radat/${trackId}/${from + i}.json`;
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
        },
        transformResponse: (body) => _.first(JSON.parse(body)) // rid unnecessary array
    };

    return axios.get(url, options)
      .then((res) => {
          console.info(`GET ${url} (${res.status})`);
          return res.data;
      })
      .then((trackKm) => {
          return kmService.fetchKm(trackKm.kilometrimerkki).then((mark) => {
             trackKm.kilometrimerkki = mark;
             return trackKm; 
          });
      })
      .then((trackKm) => {
          console.log(trackKm);
          return Promise.all(_.map(trackKm.elementit, elementService.fetchElement))
            .then((elements) => {
                console.info(elements);
                trackKm.elementit = elements; // TODO filter by type
                return trackKm;
            });
      })
      .catch((err) => {
          console.error(`GET ${url} (${err.message})`);
          process.exit(err.status);
      });    

}

module.exports = {
    fetchTrack
};
