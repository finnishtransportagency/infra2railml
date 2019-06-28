const _ = require('lodash');
const c = require('../config.js');
const http = require('./http-client');

/**
 * List all stations (liikennepaikat)
 */
function list() {
    
    const url = `${c.infraApi.baseUrl}/rautatieliikennepaikat.json`;

    const options = {
        params: { srsName: 'crs:84', presentation: 'diagram' }
    };

    return http.get(url, options)
        .then((res) => {
            process.stdout.write(`\x1b[0G${res.status}: ${url}\x1b[K`);
            return _.sortBy(_.flatMap(res.data, (v, k) => v), 'nimi');
        })
        .catch((err) => {
            console.error(`\r\x1b[K${err.message}: ${url}`);
            return {};
        });
}

/**
 * Find station by ID.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/rautatieliikennepaikat/${id}.json`;

    const options = {
        params: { srsName: 'crs:84' }
    };

    return http.get(url, options)
        .then((res) => {
            process.stdout.write(`\r\x1b[K${res.status}: ${url}`);
            return _.first(res.data);
        })
        .catch((err) => {
            console.error(`\r\x1b[K${err.message}: ${url}`);
            return {};
        });
}

module.exports = {
    list, findById
}