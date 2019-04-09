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
    marshall: (absPos, erotusjakso) => {


        console.log(erotusjakso.tunniste);
        
        const { ratanumero, alku } = erotusjakso.ratakmvali;

        const id = `sc_${alku.ratakm}_${alku.etaisyys}`;
        const name = `${ratanumero} ${alku.ratakm}+${alku.etaisyys}`;

        const dir = DIRECTIONS[erotusjakso.suunnattu] || Direction.UP;
        const max = _.max(_.map(erotusjakso.nopeusrajoitukset, 'nopeus'));

        const pos = ((alku.ratakm * 1000) + alku.etaisyys) - absPos;

        const a = cheerio.load('<electrificationChange/>', config.cheerio);
        a('eletricficationChange').attr('id', id);
        a('eletricficationChange').attr('name', name);
        a('eletricficationChange').attr('pos', pos);
        a('eletricficationChange').attr('absPos', absPos + pos);
        a('eletricficationChange').attr('dir', dir);
        a('eletricficationChange').attr('vMax', max);

        return a.xml();
    }
};
