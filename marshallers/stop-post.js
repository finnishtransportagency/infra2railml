const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

module.exports = {
    marshall: (raideId, raideAlku, kilometrit, liikennepaikanRaide) => {
        
        if (!liikennepaikanRaide || _.isEmpty(liikennepaikanRaide.liikennepaikka)) {
            return undefined;
        }

        const { tunnus, liikennepaikka } = liikennepaikanRaide;
        const { tunniste, nimi, virallinenRatakmsijainti, muutRatakmsijainnit } = _.first(liikennepaikka);
        const sijainti = virallinenRatakmsijainti || _.first(muutRatakmsijainnit);

        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<stopPost/>', config.cheerio);
        $('stopPost').attr('id', `stp_${raideId}`);
        $('stopPost').attr('name', nimi);
        $('stopPost').attr('code', 21);
        $('stopPost').attr('description', `${tunnus} - ${nimi}`);
        $('stopPost').attr('pos', pos);
        $('stopPost').attr('absPos', absPos);
        $('stopPost').attr('virtual', false);
        $('stopPost').attr('platformEdgeRef', `pe_${raideId}`);
        $('stopPost').attr('ocpRef', tunniste);

        return $.xml();        
    }
};
