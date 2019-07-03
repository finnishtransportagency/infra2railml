const _ = require('lodash');
const canvasUtils = require('../utils/canvas-utils');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');
/**
 * Calculates the shape of a axis-aligned bounding box
 * for given track visual elements list.
 */
function getBoundingBox(visualElements) {

    let minX = 90; // Max value for latitude
    let minY = 180; // Max value for longitude

    let maxX = -90; // Min value for latitude
    let maxY = -180; // Min value for longitude

    // Gather all coordinates
    let coordinates = [];
    _.forEach(visualElements, (track) => {
        coordinates.push(track.coordinates.start);
        coordinates.push(track.coordinates.end);
        const elementsList = track.elements;

        _.forEach(elementsList, function (element) {
            coordinates.push(element.coordinates);
        });
    });

    // Determine bounding box
    _.forEach(coordinates, (coordinate) => {
        let x = coordinate.x;
        let y = coordinate.y;
        if(x < minX) minX = x;
        if(y < minY) minY = y;
        if(x > maxX) maxX = x;
        if(y > maxY) maxY = y;
    });

    const boundingBox = {
        "min" : {
            "x" : minX,
            "y" : minY
        },
        "max" : {
            "x" : maxX,
            "y" : maxY
        },
        "height" : (maxY - minY),
        "width" : (maxX - minX)
    };

    return boundingBox;
}

/**
 *  Returns the coordinates of an element.
 */
function getElementCoordinates(element) {

    let coordinates = {
        "start" : null,
        "end" : null
    };

    // Elements only have one coordinate
    if(element.geometria.length === 2 && !Array.isArray(element.geometria[0])) {
        coordinates.start = {
            "x" : element.geometria[0],
            "y" : element.geometria[1]
        }
    }
    // Tracks have an array with one array of coordinates
    else if(element.geometria.length > 0 && Array.isArray(element.geometria[0])) {
        coordinates.start = {
            "x" : element.geometria[0][0][0],
            "y" : element.geometria[0][0][1]
        };
        const lastElementIndex = element.geometria[0].length - 1;
        coordinates.end = {
            "x" : element.geometria[0][lastElementIndex][0],
            "y" : element.geometria[0][lastElementIndex][1]
        }
    }

    return coordinates;
}

/**
 * Returns canvas position for given coordinates defined by a
 * geometry bounding box and canvas dimensions.
 */
function getCanvasPositionForCoordinates(coordinates, geometryBoundingBox, canvasWidth, canvasHeight) {

    // Don't distort coordinates, expand bounding box into a square
    let drawAreaEdgeSize = Math.max(geometryBoundingBox.width, geometryBoundingBox.height);

    // Convert X and Y coordinates to values between 0 - 1
    const normalizedX = (coordinates.x - geometryBoundingBox.min.x) / drawAreaEdgeSize;
    const normalizedY = (coordinates.y - geometryBoundingBox.min.y) / drawAreaEdgeSize;

    // Return position on canvas
    return {
        "x" : normalizedX * canvasWidth,
        "y" : normalizedY * canvasHeight
    }

}

/**
 * Create a HTML write with a canvas visualization of tracks visual
 * elements.
 */
function createHTMLCanvasVisualization(fileNamePrefix, canvas, trackVisualElements, boundingBox) {

    canvasUtils.clearBackground(canvas);

    _.forEach(trackVisualElements, (trackVisualData) => {

        // Track start
        const trackCanvasStartPosition = getCanvasPositionForCoordinates(
            trackVisualData.coordinates.start,
            boundingBox,
            canvas.width,
            canvas.height
        );

        // Track end
        const trackCanvasEndPosition = getCanvasPositionForCoordinates(
            trackVisualData.coordinates.end,
            boundingBox,
            canvas.width,
            canvas.height
        );

        // If track has no elements, draw line from start to end.
        if(trackVisualData.elements.length === 0) {
            canvasUtils.drawLine(canvas, trackCanvasStartPosition, trackCanvasEndPosition, "#ff0008");
            return;
        }

        // Else, start by drawing a line from track start to first element
        const canvasFirstElementPosition = getCanvasPositionForCoordinates(
            trackVisualData.elements[0].coordinates,boundingBox, canvas.width, canvas.height);

        canvasUtils.drawLine(canvas, trackCanvasStartPosition, canvasFirstElementPosition, "#ffe009");

        // Draw connections between elements if there are more than one
        if(trackVisualData.elements.length > 1) {
            for(let i = 0; i <= trackVisualData.elements.length - 2; i++) {

                const coordinatesStart = {
                    "x": trackVisualData.elements[i].coordinates.x,
                    "y": trackVisualData.elements[i].coordinates.y
                };

                const coordinatesEnd = {
                    "x": trackVisualData.elements[i + 1].coordinates.x,
                    "y": trackVisualData.elements[i + 1].coordinates.y
                };

                const canvasPositionStart = getCanvasPositionForCoordinates(coordinatesStart,boundingBox, canvas.width, canvas.height);
                const canvasPositionEnd = getCanvasPositionForCoordinates(coordinatesEnd,boundingBox, canvas.width, canvas.height);

                canvasUtils.writeLabel(canvas, canvasPositionStart, trackVisualData.elements[i].type, "#0011ff");
                canvasUtils.drawLine(canvas, canvasPositionStart, canvasPositionEnd, "#0011ff");
                canvasUtils.drawABox(canvas, canvasPositionStart, "#00ffe3");
            }
        }

        // Draw a line from the last (or only) track element to the end of track
        const lastElementPos = {
            "x" : trackVisualData.elements[trackVisualData.elements.length-1].coordinates.x,
            "y" : trackVisualData.elements[trackVisualData.elements.length-1].coordinates.y
        };
        const lastElementCanvasPos = getCanvasPositionForCoordinates(lastElementPos,boundingBox, canvas.width, canvas.height);

        canvasUtils.drawLine(canvas, lastElementCanvasPos, trackCanvasEndPosition, "#00ff3c");
    });

    canvasUtils.createDebugImage(canvas, fileNamePrefix);
}

/**
 * Assemble tracks visualization information
 */
function getTracksVisualizationData(ratanumero, raide, trackElements) {

    const raideCoordinates = getElementCoordinates(raide);

    // Sort elements according to their position on track
    trackElements = _.sortBy(
        trackElements,
        (element) => {
            // Special case for mileposts
            if(element.ratakm)
                return (element.ratakm) + (element.pituus / 1100);
            else {
                const position = elementUtils.getPosition(ratanumero, element);
                return position.ratakm + (position.etaisyys / 1100); // The etaisyys can sometimes go over 1000m
            }
        });

    let elementsVisualData = [];
    // Only add necessary information
    for(let i = 0; i <= trackElements.length - 1; i++) {
        const element = trackElements[i];
        /*
        if(element.tyyppi == "milepost") {
            let previousCoordinate = null;
            let nextCoordinate = null;
            let previousAbsolutePosition = null;
            let nextAbsolutePosition = null;
            if(i == 0) {
                previousCoordinate = raideCoordinates.start;
                previousAbsolutePosition = positionUtils.getAbsolutePosition(raide.ratakmvalit[0].alku);
            }
            else {
                let previousNonMilePostElement = getPreviousNonMilepostElement(trackElements, i - 1);
                if(previousNonMilePostElement == null) {
                    console.log("Got null");
                    previousCoordinate = raideCoordinates.start;
                    previousAbsolutePosition = positionUtils.getAbsolutePosition(raide.ratakmvalit[0].alku);
                    console.log(previousAbsolutePosition);
                }
                else {
                    console.log("Not null");
                    console.log(previousNonMilePostElement);
                    previousCoordinate = getElementCoordinates(previousNonMilePostElement).start;
                    previousAbsolutePosition = positionUtils.getAbsolutePosition(previousNonMilePostElement.ratakmsijainnit[0]);
                }

            }

            if(i == trackElements.length - 1) {
                nextCoordinate = raideCoordinates.end;
                nextAbsolutePosition = positionUtils.getAbsolutePosition(raide.ratakmvalit[0].loppu);
            }
            else {
                let nextNonMilePostElement = getNextNonMilepostElement(trackElements, i + 1);
                if(nextNonMilePostElement == null) {

                    nextCoordinate = raideCoordinates.end;
                    nextAbsolutePosition = positionUtils.getAbsolutePosition(raide.ratakmvalit[0].loppu);

                } else {
                    nextCoordinate = getElementCoordinates(nextNonMilePostElement).start;
                    nextAbsolutePosition = positionUtils.getAbsolutePosition(nextNonMilePostElement.ratakmsijainnit[0]);
                }


            }

            element.geometria = getMilepostGeometria(element, previousCoordinate, nextCoordinate, previousAbsolutePosition, nextAbsolutePosition);
            console.log(i, element, previousCoordinate, nextCoordinate, previousAbsolutePosition, nextAbsolutePosition);
        }
        */
        const elementId = element.tunniste;
        const elementRefId = element.ratakm || elementId;
        const coordinates = getElementCoordinates(element);
        elementsVisualData.push({
            "id" : elementRefId,
            "coordinates" : coordinates.start,
            "type" : element.tyyppi
        });
    };


    return  {
        "id" : raide.tunniste,
        "coordinates" : raideCoordinates,
        "elements" : elementsVisualData
    }

}

function getNextNonMilepostElement(elements, startingIndex) {
    let nonMilepostElement = null;
    for(let i = startingIndex; i <= elements.length - 1; i++) {
        if(elements[i].tyyppi !== "milepost") {
            nonMilepostElement = elements[i];
            break;
        }
    }
    return nonMilepostElement;
}

function getPreviousNonMilepostElement(elements, startingIndex) {
    let nonMilepostElement = null;
    for(let i = startingIndex; i >= 0; i--) {
        if(elements[i].tyyppi !== "milepost") {
            nonMilepostElement = elements[i];
            break;
        }
    }
    return nonMilepostElement;
}

function getMilepostGeometria(milepost, previousCoordinates, nextCoordinates, previousAbsolutePosition, nextAbsolutePosition) {

    const trackLength = (nextAbsolutePosition - previousAbsolutePosition);
    const milepostPosition = positionUtils.getAbsolutePosition(milepost) - previousAbsolutePosition;
    const deltaX = nextCoordinates.x - previousCoordinates.x;
    const deltaY = nextCoordinates.y - previousCoordinates.y;
    const relativePositionOnTrack = milepostPosition / trackLength;
    const geometria = [
        previousCoordinates.x + (deltaX * relativePositionOnTrack),
        previousCoordinates.y + (deltaY * relativePositionOnTrack)
        ];

    return  geometria;


}

module.exports = {
    getBoundingBox, getCanvasPositionForCoordinates, createHTMLCanvasVisualization, getTracksVisualizationData, getElementCoordinates
};
