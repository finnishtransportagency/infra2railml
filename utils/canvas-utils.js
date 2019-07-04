const fs = require("fs");

function writeToFile(data, fileName) {
    console.log(`Writing visualization preview in ${fileName} ..`);
    fs.writeFile(fileName, data, (err) => {
        if (err) console.log(err);
    });
}

function createDebugImage(canvas, fileNamePrefix) {
    const html = '<html><body><img src=\"' + canvas.toDataURL() + '\" /></body></html>';
    writeToFile(html, fileNamePrefix + "_visualization.html");
}

function clearBackground(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fill();
}

function drawLine(canvas, startPosition, endPosition, color) {
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(startPosition.x, canvas.height - startPosition.y);
    ctx.lineTo(endPosition.x, canvas.height - endPosition.y);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
}

function drawABox(canvas, position, color) {
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(
        (position.x) -1,
        (canvas.height - position.y) -1,
        2,
        2);

}

function writeLabel(canvas, startPosition, text, color) {
    const ctx = canvas.getContext('2d');

    ctx.font = "10px Verdana";
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.fillText(text, (startPosition.x) + 10, (canvas.height - startPosition.y) + 5);

}

module.exports = {
    createDebugImage, clearBackground, drawLine, drawABox, writeLabel
};

