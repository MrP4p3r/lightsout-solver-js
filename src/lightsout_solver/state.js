'use strict';

/**
 * State class.
 * Represents internal state of game field cells.
 */

import BinaryMatrix from './binary_matrix';

let State = function (...args) {
    BinaryMatrix.call(this, ...args);
};

export default State;

State.prototype = Object.create(BinaryMatrix.prototype);

State.prototype.getSum = function (i, j) {
    let m = this.items;
    let size = this.size;
    let result = false;

    result ^= m[i][j];
    if (i > 0) result ^= m[i-1][j];
    if (i < (size - 1)) result ^= m[i+1][j];
    if (j > 0) result ^= m[i][j-1];
    if (j < (size - 1)) result ^= m[i][j+1];

    return result;
};