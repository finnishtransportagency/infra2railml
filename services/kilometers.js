const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');

/**
 * Find track kilometer by id.
 */
function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/kilometrimerkit/${id}.json`;
    
    const options = {
        params: { srsName: 'crs:84' },
        transformResponse: (data) => _.first(JSON.parse(data))
    };

    return axios.get(url, options)
        .then((res) => res.data)
        .catch((err) => {
            console.error(`${err.message}: ${url}`);
            return {};
        });
}

module.exports = {
    findById
};