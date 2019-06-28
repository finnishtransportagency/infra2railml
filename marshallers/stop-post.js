const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

module.exports = {
    marshall: (raideId, raideAlku, kilometrit, liikennepaikanRaide) => {
        
        if (!liikennepaikanRaide || _.isEmpty(liikennepaikanRaide.liikennepaikka)) {
            return [];
        }

        return [
            getStopPost(raideId, raideAlku, kilometrit, liikennepaikanRaide, 'up'),
            getStopPost(raideId, raideAlku, kilometrit, liikennepaikanRaide, 'down')
        ];
    }
};

const getStopPost = (raideId, raideAlku, kilometrit, liikennepaikanRaide, dir) => {

    const { tunnus, liikennepaikka } = liikennepaikanRaide;
    const { tunniste, nimi, virallinenRatakmsijainti, muutRatakmsijainnit } = liikennepaikka;
    const sijainti = virallinenRatakmsijainti || _.first(muutRatakmsijainnit);

    if (!sijainti) {
        console.error(`Error: station ${tunniste} has no position (${tunnus})`);
        return undefined;
    }

    const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
    const absPos = positionUtils.getAbsolutePosition(sijainti);

    const $ = cheerio.load('<stopPost/>', config.cheerio);
    $('stopPost').attr('id', `stp_${raideId}_${pos}_${dir}`);
    $('stopPost').attr('name', nimi);
    $('stopPost').attr('code', 21);
    $('stopPost').attr('description', `${tunnus} - ${nimi}`);
    $('stopPost').attr('pos', pos);
    $('stopPost').attr('absPos', absPos);
    $('stopPost').attr('dir', dir);
    $('stopPost').attr('platformEdgeRef', `pe_${raideId}`);
    $('stopPost').attr('ocpRef', tunniste);

    return $.xml();
};
