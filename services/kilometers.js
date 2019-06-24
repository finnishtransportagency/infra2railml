const _ = require('lodash');
const c = require('../config.js');
const http = require('./http-client');

/**
 * Find track kilometer by id.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/kilometrimerkit/${id}.json`;
    
    const options = {
        params: { srsName: 'crs:84' },
        transformResponse: (data) => _.first(JSON.parse(data))
    };

    return http.get(url, options)
        .then((res) => {
            console.log(`${res.status}: ${url}`);
            return res.data;
        })
        .catch((err) => {
            console.error(`${err.message}: ${url}`);
            return {};
        });
}

module.exports = {
    findById
};