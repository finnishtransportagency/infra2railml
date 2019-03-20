const _ = require('lodash');

module.exports = {
    marshall: (trackId, trackAbsPos, baliisi) => {
        
        const dir = baliisi.baliisi.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(baliisi.ratakmsijainnit, { ratanumero: trackId });
        const absPos = trackAbsPos + sijainti.etaisyys;

        return `<balise id="${baliisi.tunniste}" name="${baliisi.nimi}" pos="${sijainti.etaisyys}" absPos="${absPos}" dir="${dir}">`;        
    }
};
