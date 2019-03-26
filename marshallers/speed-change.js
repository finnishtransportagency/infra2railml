const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (absPos, limits) => {

        const id = `sc_${limits.ratakmvali.alku.ratakm}_${limits.ratakmvali.alku.etaisyys}`;
        const name = `${limits.ratakmvali.ratanumero} ${limits.ratakmvali.alku.ratakm}+${limits.ratakmvali.alku.etaisyys}`;
        const profileRef = `sppr_${limits.ratakmvali.ratanumero}_${limits.ratakmvali.alku.ratakm}_${limits.ratakmvali.alku.etaisyys}`;        
        const max = _.max(_.map(limits.nopeusrajoitukset, 'nopeus'));

        const a = cheerio.load('<speedChange/>', config.cheerio);
        a('speedChange').attr('id', id);
        a('speedChange').attr('name', name);
        a('speedChange').attr('pos', limits.ratakmvali.alku.etaisyys);
        a('speedChange').attr('absPos', absPos +  limits.ratakmvali.alku.etaisyys);
        a('speedChange').attr('dir', limits.suunnattu || 'up'); // TODO map values to (up|down)
        a('speedChange').attr('profileRef', profileRef);
        a('speedChange').attr('vMax', max);

        return a.html();
    }
};
