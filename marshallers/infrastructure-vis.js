const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (model) => {
        const $ = cheerio.load('<infrastructureVisualization><!-- TODO --></infrastructureVisualization>', config.cheerio);
        return $.html();
    }
}