const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// https://wiki.railml.org/index.php?title=IS:trackEnd

module.exports = {
    marshall: (raideId, alku, loppu, kilometrit, elementit) => {
        
        const pos = positionUtils.getPosition(alku, loppu, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(loppu);

        const $ = cheerio.load('<trackEnd/>', config.cheerio);
        $('trackEnd').attr('id', `te_${raideId}`);
        $('trackEnd').attr('pos', pos);
        $('trackEnd').attr('absPos', absPos);

        // find the end element of rail, typically a switch or buffer stop
        const loppuElementti = elementUtils.getConnectingElement(loppu, elementit);
        const ref = elementUtils.getReference(raideId, 'end', loppuElementti);
    
        if (loppuElementti && ref && loppuElementti.tyyppi === 'vaihde') {
            $('trackEnd').append(`<connection id="tec_${raideId}" ref="${ref}" />`);
        } else if (loppuElementti && loppuElementti.tyyppi === 'puskin') {
            $('trackEnd').append(`<bufferStop id="${loppuElementti.tunniste}" />`);
        } else {
            $('trackEnd').append(`<openEnd id="teoe_${raideId}" name="${raideId}" />`);
        }

        return $.xml();
    }
}