const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// https://wiki.railml.org/index.php?title=IS:trackBegin

module.exports = {
    marshall: (raideId, alku, elementit) => {
        
        const absPos = positionUtils.getAbsolutePosition(alku);

        const $ = cheerio.load('<trackBegin/>', config.cheerio);
        $('trackBegin').attr('id', `tb_${raideId}`);
        $('trackBegin').attr('pos', '0.0000');
        $('trackBegin').attr('absPos', absPos);

        // find the beginning element of rail, typically a switch or buffer stop
        const alkuElementti = elementUtils.getConnectingElement(alku, elementit);
        const ref = elementUtils.getReference(raideId, 'begin', alkuElementti);

        if (alkuElementti && ref && alkuElementti.tyyppi === 'vaihde') {
            $('trackBegin').append(`<connection id="tbc_${raideId}" ref="${ref}" />`);
        } else if (alkuElementti && alkuElementti.tyyppi === 'puskin') {
            $('trackBegin').append(`<bufferStop id="${alkuElementti.tunniste}" />`);
        } else {
            $('trackBegin').append(`<openEnd id="tboe_${raideId}" name="${raideId}" />`);
        }

        return $.xml();
    }
}