const _ = require('lodash');

module.exports = {
    marshall: (trackId, baliisi) => {
        
        const dir = baliisi.baliisi.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(baliisi.ratakmsijainnit, { ratanumero: trackId });
        const absPos = (sijainti.ratakm * 1000.0) + sijainti.etaisyys;

        return `<balise id="${baliisi.tunniste}" name="${baliisi.nimi}" pos="${sijainti.etaisyys}" absPos="${absPos}" dir="${dir}">`;        
    }
};
