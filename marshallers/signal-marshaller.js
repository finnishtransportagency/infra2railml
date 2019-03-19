const _ = require('lodash');

module.exports = {
    marshall: (trackId, opastin) => {
        
        const dir = opastin.opastin.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(opastin.ratakmsijainnit, { ratanumero: trackId });
        const absPos = (sijainti.ratakm * 1000.0) + sijainti.etaisyys;

        return `<signal id="${opastin.tunniste}" name="${opastin.nimi}" pos="${sijainti.etaisyys}" absPos="${absPos}" dir="${dir}">`;        
    }
};
