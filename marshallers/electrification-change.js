const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

const Direction = {
    UP: 'up',
    DOWN: 'down'
};

const DIRECTIONS = {
    'nouseva': Direction.UP,
    'laskeva': Direction.DOWN
};

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, erotusjakso) => {

        const sijainti = elementUtils.getPosition(trackId, erotusjakso);

        const id = `${erotusjakso.tunniste}`;
        const name = `Erotusjakso ${sijainti.ratanumero} ${sijainti.ratakm}+${sijainti.etaisyys}`;
        const dir = DIRECTIONS[erotusjakso.suunnattu] || Direction.UP;
        const max = _.max(_.map(erotusjakso.nopeusrajoitukset, 'nopeus'));
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<electrificationChange/>', config.cheerio);
        $('electrificationChange').attr('id', id);
        $('electrificationChange').attr('name', name);
        $('electrificationChange').attr('pos', pos);
        $('electrificationChange').attr('absPos', absPos);
        $('electrificationChange').attr('dir', dir);
        $('electrificationChange').attr('vMax', max);

        return $.xml();
    }
};
