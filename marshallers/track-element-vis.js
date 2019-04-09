const cheerio = require('cheerio');
const config = require('../config');

const MARGIN = 150;
const COLUMN_WIDTH = 1000;
const ROW_HEIGHT = 750;

module.exports = {
    marshall: (obj, i) => {

        const col = Math.round(10 * ((i / 10) % 1));
        const row = Math.floor(i / 10);

        const x = MARGIN + (col * COLUMN_WIDTH);
        const y = MARGIN + (row * ROW_HEIGHT);
        const dx = x + COLUMN_WIDTH;

        const id = obj.tunniste || obj.kilometrimerkki.tunniste;
        const refId = obj.ratakm || id;

        const $ = cheerio.load(`<trackVis ref="${id}">`, config.cheerio);
        $('trackVis').append(`<trackElementVis ref="tb_${refId}"><position x="${x}" y="${y}"/></trackElementVis>`);
        $('trackVis').append(`<trackElementVis ref="te_${refId}"><position x="${dx}" y="${y}"/></trackElementVis>`);

        return $.xml();
    }
};
