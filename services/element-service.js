const _ = require('lodash');
const axios = require('axios');
const c = require('../config.js');

//const ELEMENT_PROPERTIES = [ 'tunniste', 'tyyppi', 'geometria', ]

function fetchElement(id) {
    

    const url = `${c.BASE_URL}/elementit/${id}.json`;
    
    const options = {
        params: {
            srsName: 'crs:84',
            //propertyName: _.join(ELEMENT_PROPERTIES, ',')
        },
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
    fetchElement
}