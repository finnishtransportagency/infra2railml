const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');
const rails = require('./rails');

/**
 * Find track element by ID.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/elementit/${id}.json`;

    const options = {
        params: { srsName: 'crs:84' },
        transformResponse: (data) => _.first(JSON.parse(data))
    };

    return axios.get(url, options)
        .then((res) => {
            console.info(`${res.status}: ${url}`);
            return res.data;
        })
        .then(fetchRails)
        .catch((err) => {
            console.error(`${err.message}: ${url}`);
            return {};
        });
}

function fetchRails(element) {
    return Promise.all(_.map(element.raiteet, rails.findById)).then((rails) => {
        element.raiteet = rails;
        return element;
    });
}

module.exports = {
    findById
}