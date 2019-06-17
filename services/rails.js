const _ = require('lodash');
const c = require('../config');
const http = require('./http-client');

function findById(id) {
    
    const url = `${c.infraApi.baseUrl}/raiteet/${id}.json`;

    const options = {
        params: { srsName: 'crs:84' }
        //transformResponse: (data) => _.first(JSON.parse(data))
    };

    return http.get(url, options)
        .then((res) => {
            console.log(`${res.status}: ${url}`);
            return _.first(res.data);
        })
        .catch((err) => {
            console.error(`${err.message}: ${url}`);
            return {};
        });
}

function findAllById(ids) {
    return Promise.all(_.map(ids, findById));
}

module.exports = {
    findById, findAllById
}