'use strict';

import BinaryMatrix from './binary_matrix.js';


/**
 * State class.
 * Represents internal state of game field cells.
 */
let State = function (...args) {
    BinaryMatrix.call(this, ...args);
};

export default State;

State.prototype = Object.create(BinaryMatrix.prototype);

/**
 * @param i
 * @param j
 * @return {boolean}
 */
State.prototype.getSum = function (i, j) {
    let m = this.items;
    let size = this.size;
    let result = false;

    result ^= m[i][j];
    if (i > 0) result ^= m[i-1][j];
    if (i < (size - 1)) result ^= m[i+1][j];
    if (j > 0) result ^= m[i][j-1];
    if (j < (size - 1)) result ^= m[i][j+1];

    return Boolean(result);
};

/**
 * @param size
 * @param {function} valueFactory
 * @constructor
 */
State.MakeNew = function (size, valueFactory) {
    let items = [];
    for (let i = 0; i < size; i++) {
        items.push([]);
        for (let j = 0; j < size; j++) {
            items[i].push(valueFactory(i, j));
        }
    }
    return new State(size, items);
};
