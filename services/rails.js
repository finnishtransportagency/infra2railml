const _ = require('lodash');
const axios = require('axios');
const c = require('../config');

function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/raiteet/${id}.json`;

    const options = {
        params: { srsName: 'crs:84' },
        transformResponse: (data) => _.first(JSON.parse(data))
    };

    return axios.get(url, options)
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
}