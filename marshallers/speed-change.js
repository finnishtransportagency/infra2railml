const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

const Direction = {
    UP: 'up',
    DOWN: 'down'
};

const DIRECTIONS = {
    'nouseva': Direction.UP,
    'laskeva': Direction.DOWN
};

module.exports = {
    marshall: (absPos, limits) => {

        const { ratanumero, alku } = limits.ratakmvali;

        const id = `sc_${alku.ratakm}_${alku.etaisyys}`;
        const name = `${ratanumero} ${alku.ratakm}+${alku.etaisyys}`;
        const profileRef = `sppr_${ratanumero}_${alku.ratakm}_${alku.etaisyys}`;        
        const dir = DIRECTIONS[limits.suunnattu] || Direction.UP;
        const max = _.max(_.map(limits.nopeusrajoitukset, 'nopeus'));

        const pos = ((alku.ratakm * 1000) + alku.etaisyys) - absPos;

        const a = cheerio.load('<speedChange/>', config.cheerio);
        a('speedChange').attr('id', id);
        a('speedChange').attr('name', name);
        a('speedChange').attr('pos', pos);
        a('speedChange').attr('absPos', absPos + pos);
        a('speedChange').attr('dir', dir);
        a('speedChange').attr('profileRef', profileRef);
        a('speedChange').attr('vMax', max);

        return a.xml();
    }
};
