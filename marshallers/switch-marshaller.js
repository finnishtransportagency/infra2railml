const _ = require('lodash');

module.exports = {
    marshall: (trackId, trackAbsPos, vaihde) => {
        
        const sijainti = _.find(vaihde.ratakmsijainnit, { ratanumero: trackId });
        const absPos = trackAbsPos + sijainti.etaisyys;

        return `<switch id="${vaihde.tunniste}" name="${vaihde.nimi}" pos="${sijainti.etaisyys}" absPos="${absPos}" dir="" />`;        
    }
};
