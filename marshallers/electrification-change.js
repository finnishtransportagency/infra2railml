const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');


const Direction = {
    UP: 'up',
    DOWN: 'down'
};

const DIRECTIONS = {
    'nouseva': Direction.UP,
    'laskeva': Direction.DOWN
};

module.exports = {
    marshall: (trackId, absPos, erotusjakso) => {

        const sijainti = elementUtils.getPosition(trackId, erotusjakso);

        const id = `${erotusjakso.tunniste}`;
        const name = `Erotusjakso ${sijainti.ratanumero} ${sijainti.ratakm}+${sijainti.etaisyys}`;
        const dir = DIRECTIONS[erotusjakso.suunnattu] || Direction.UP;
        const max = _.max(_.map(erotusjakso.nopeusrajoitukset, 'nopeus'));
        const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

        const a = cheerio.load('<electrificationChange/>', config.cheerio);
        a('electrificationChange').attr('id', id);
        a('electrificationChange').attr('name', name);
        a('electrificationChange').attr('pos', pos);
        a('electrificationChange').attr('absPos', absPos + pos);
        a('electrificationChange').attr('dir', dir);
        a('electrificationChange').attr('vMax', max);

        return a.xml();
    }
};
