const _ = require('lodash');
const c = require('../config');
const http = require('./http-client');
const stations = require('./stations');

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
        .then((rail) => {
            return new Promise((resolve, reject) => {
                if (!rail.liikennepaikanRaide || _.isObject(rail.liikennepaikanRaide.liikennepaikka)) {
                    resolve(rail);
                } else {
                    return stations.findById(rail.liikennepaikanRaide.liikennepaikka)
                        .then((station) => {
                            rail.liikennepaikanRaide.liikennepaikka = station;
                            return rail;
                        })
                        .then(resolve)
                        .catch(reject);
                }
            });
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