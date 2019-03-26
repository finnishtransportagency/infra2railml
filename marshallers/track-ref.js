const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (km) => {
        const $ = cheerio.load('<trackRef/>', config.cheerio);
        $('trackRef').attr('id', km.kilometrimerkki.tunniste);
        return $.html();
    }
};
