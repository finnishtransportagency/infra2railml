const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const positionUtils = require('../utils/position-utils');

module.exports = {
    marshall: (raideId, raideAlku, kilometrit, liikennepaikanRaide) => {
        
        if (!liikennepaikanRaide || _.isEmpty(liikennepaikanRaide.liikennepaikka)) {
            return undefined;
        }

        const { tunnus, liikennepaikka } = liikennepaikanRaide;
        const { tunniste, nimi, virallinenRatakmsijainti, muutRatakmsijainnit } = liikennepaikka;
        const sijainti = virallinenRatakmsijainti || _.first(muutRatakmsijainnit);

        if (!sijainti) {
            console.error(`Error: station ${tunniste} has no position (${tunnus})`);
            return undefined;
        }

        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        if (pos < 0) {
            // likely a rail related to station, but located a bit off from the station
            return undefined;
        }

        const $ = cheerio.load('<platformEdge/>', config.cheerio);
        $('platformEdge').attr('id', `pe_${raideId}`);
        $('platformEdge').attr('name', nimi);
        $('platformEdge').attr('description', `${tunnus} - ${nimi}`)
        $('platformEdge').attr('pos', pos);
        $('platformEdge').attr('absPos', absPos);
        $('platformEdge').attr('ocpRef', tunniste);

        return $.xml();        
    }
};
