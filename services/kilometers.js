const _ = require('lodash');
const c = require('../config.js');
const http = require('./http-client');

/**
 * Find track kilometer by id.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/kilometrimerkit/${id}.json`;
    
    const options = {
        params: { srsName: 'crs:84', presentation: 'diagram' },
    };

    return http.get(url, options)
        .then((res) => {
            process.stdout.write(`\r\x1b[K${res.status}: ${url}`);
            return _.first(res.data);
        })
        .catch((err) => {
            console.error(`\r\x1b[K${err.response.status}: ${url}`);
            return {};
        });
}

module.exports = {
    findById
};