const _ = require('lodash');

module.exports = {
    marshall: (trackId, vaihde) => {
        
        const sijainti = _.find(vaihde.ratakmsijainnit, { ratanumero: trackId });
        const absPos = (sijainti.ratakm * 1000.0) + sijainti.etaisyys;

        return `<switch id="${vaihde.tunniste}" name="${vaihde.nimi}" pos="${sijainti.etaisyys}" absPos="${absPos}" dir="" />`;        
    }
};
