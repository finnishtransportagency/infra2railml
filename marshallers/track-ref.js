const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (obj) => {
        const $ = cheerio.load('<trackRef/>', config.cheerio);
        $('trackRef').attr('ref', obj.tunniste || obj.kilometrimerkki.tunniste);
        return $.xml();
    }
};
