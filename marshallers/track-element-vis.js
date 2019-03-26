const cheerio = require('cheerio');
const config = require('../config');

const MARGIN = 150;
const COLUMN_WIDTH = 1000;
const ROW_HEIGHT = 750;

module.exports = {
    marshall: (km, i) => {

        const col = Math.round(10 * ((i / 10) % 1));
        const row = Math.floor(i / 10);

        const x = MARGIN + (col * COLUMN_WIDTH);
        const y = MARGIN + (row * ROW_HEIGHT);
        const dx = x + COLUMN_WIDTH;

        const $ = cheerio.load(`<trackVis ref="${km.kilometrimerkki.tunniste}">`, config.cheerio);
        $('trackVis').append(`<trackElementVis ref="tb_${km.ratakm}"><position x="${x}" y="${y}"/></trackElementVis>`);
        $('trackVis').append(`<trackElementVis ref="te_${km.ratakm}"><position x="${dx}" y="${y}"/></trackElementVis>`);

        return $.html();
    }
};
