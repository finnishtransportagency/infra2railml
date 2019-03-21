const _ = require('lodash');

module.exports = {
    marshall: (trackId, trackAbsPos, opastin) => {
        
        const dir = opastin.opastin.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(opastin.ratakmsijainnit, { ratanumero: trackId });
        const absPos = trackAbsPos + sijainti.etaisyys;

        return `<signal id="${opastin.tunniste}" name="${opastin.nimi}" pos="${sijainti.etaisyys}" absPos="${absPos}" dir="${dir}">`;        
    }
};
