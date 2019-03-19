const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');

const KM_POLE_PROPERTIES = [ 'tunniste', 'geometria', ]

function fetchKm(id) {
    
    const url = `${c.BASE_URL}/kilometrimerkit/${id}.json`;
    
    const options = {
        params: {
            srsName: 'crs:84',
            propertyName: _.join(KM_POLE_PROPERTIES, ',')
        },
        transformResponse: (data) => _.first(JSON.parse(data))
    };

    return axios.get(url, options)
        .then((res) => {
            return res.data;
        })
        .catch((err) => {
            console.error(`${err.message}: ${url}`);
            return {};
        });
}

module.exports = {
    fetchKm
}