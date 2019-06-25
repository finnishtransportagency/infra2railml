const _ = require('lodash');
const c = require('../config.js');
const http = require('./http-client');

/**
 * Find track element by ID.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/elementit/${id}.json`;

    const options = {
        params: { srsName: 'crs:84', presentation: 'diagram' },
        transformResponse: (data) => _.first(JSON.parse(data))
    };

    return http.get(url, options)
        .then((res) => {
            console.info(`${res.status}: ${url}`);
            return res.data;
        })
        .catch((err) => {
            console.error(`${err.message}: ${url}`);
            return {};
        });
}

module.exports = {
    findById
}