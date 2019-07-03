const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const visualizationUtils = require('../utils/visualization-utils');


module.exports = {
    marshall: (trackVisualData, boundingBox) => {

        let CANVAS_WIDTH = 30000 * boundingBox.width / 0.2;
        let CANVAS_HEIGHT = CANVAS_WIDTH;

        const refId = trackVisualData.id;
        const $ = cheerio.load(`<trackVis ref="${refId}">`, config.cheerio);

        // Track start
        const trackCanvasStartPosition = visualizationUtils.getCanvasPositionForCoordinates(
            trackVisualData.coordinates.start,
            boundingBox,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );
        $('trackVis').append(`<trackElementVis ref="tb_${refId}">
                            <position x="${trackCanvasStartPosition.x}" y="${trackCanvasStartPosition.y}"/>
                            </trackElementVis>`);

        // Track elements
        _.forEach(trackVisualData.elements, (elementVisualData)  => {
            const trackElementCanvasPosition = visualizationUtils.getCanvasPositionForCoordinates(
                elementVisualData.coordinates,
                boundingBox,
                CANVAS_WIDTH,
                CANVAS_HEIGHT
            );
            $('trackVis').append(`<trackElementVis ref="${elementVisualData.id}">
                                <position x="${trackElementCanvasPosition.x}" y="${trackElementCanvasPosition.y}"/>
                                </trackElementVis>`);
        });

        // Track end
        const trackCanvasEndPosition = visualizationUtils.getCanvasPositionForCoordinates(
            trackVisualData.coordinates.end,
            boundingBox,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );
        $('trackVis').append(`<trackElementVis ref="te_${refId}">
                            <position x="${trackCanvasEndPosition.x}" y="${trackCanvasEndPosition.y}"/>
                            </trackElementVis>`);

        return $.xml();
    }
};
