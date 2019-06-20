const _ = require('lodash');
const operationControlPoint = require('./operation-control-point');

// transformer function for stations/OCPs
module.exports = {
    marshall: (acc, liikennepaikka) => {
        console.log(`Marhalling station ${liikennepaikka.nimi}`);
        const ocp = operationControlPoint.marshall(liikennepaikka);
        acc.stations = _.concat(acc.stations, ocp);
        return acc;
    }
}