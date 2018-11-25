'use strict';

/*!
 * GUI application code
 */

import * as LightsOutSolver from './lightsout_solver/index.js';

/**
 * Application state;
 */
let state = new Reef(null, {
    lagoon: true,
    data: {
        size: 0,
        items: [],
        tips: [],
        showSolution: false,
        solverSucceed: null,
        playMode: false,
    },
});

/**
 * Root component.
 */
let root = new Reef('#app_root', {
    data: state.data,
    template: function (props) {
        let size = props.size;
        let rows = props.items;
        let tips = props.tips;

        let html = '';
        html += renderHeader();
        html += renderControls(props.playMode);
        html += renderGameField(size, rows, tips, props.showSolution);
        html += renderNote(props.solverSucceed);
        return html;
    },
    attachTo: [state],
});

/**
 * Header renderer;
 */
let renderHeader = function() {
    return '<header><div class="title"><span>Lights Out Playground</span></div></header>';
};

/**
 * Controls renderer.
 */
let renderControls = function (playModeEnabled) {
    let html = '';
    html += '<div id="field-controls">';
    html += '<a id="button-solve" class="button main">Solve!</a>';
    html += `<a id="button-play-mode" class="button ${playModeEnabled ? 'active' : ''}">Play</a>`;
    html += '<a id="button-randomize" class="button">Randomize</a>';
    html += '<a id="button-clean" class="button">Clean</a>';
    html += '<a id="button-dec-size" class="button">Size--</a>';
    html += '<a id="button-inc-size" class="button">Size++</a>';
    html += '</div>';
    return html
};

/**
 * Note renderer.
 * @param {boolean} solverSucceed
 */
let renderNote = function (solverSucceed) {
    let html = '';
    if (solverSucceed === false) {
        html += '<div class="note"><p>It seems this field presentation is not valid.</p></div>'
    }
    return html;
};

/**
 * Game field renderer.
 */
let renderGameField = (function () {
    let renderer = {
        render: function (size, rows, tipRows, highlight) {
            let html = '<div class="game-field">';
            for (let i = 0; i < size; i++) {
                html += this._renderRow(size, i, rows[i], tipRows[i], highlight);
            }
            html += '</div>';
            return html
        },
        _renderRow: function (size, i, values, tips, highlight) {
            let html = '<div class="cells-row">';
            for (let j = 0; j < size; j++) {
                html += this._renderCell(i, j, values[j], tips[j], highlight);
            }
            html += '</div>';
            return html
        },
        _renderCell: function (i, j, value, tipValue, highlight) {
            let html = '';
            html += `<div class="cell-wrapper" data-cell-highlight="${highlight ? tipValue : false}"> `;
            html += '<div ';
            html += 'class="cell" ';
            html += `data-cell-activated=${value} `;
            html += `data-cell-i=${i} `;
            html += `data-cell-j=${j} `;
            html += '></div></div>';
            return html
        },
    };
    return renderer.render.bind(renderer);
})();


let controller = {

    initialize: function () {
        state.setData(this._makeNewField(3, null));
    },

    _makeNewField: function (size, fillDirective) {
        let request = new LightsOutSolver.GenerateRequest(size, fillDirective);
        let items = LightsOutSolver.generate(request).presentationMatrix;

        let tips = [];
        for (let i = 0; i < size; i++) {
            tips.push([]);
            for (let j = 0; j < size; j++) {
                tips[i].push(false);
            }
        }
        
        return {
            size: size,
            items: items,
            tips: tips,
            solverSucceed: null,
            showSolution: false,
        };
    },

    /**
     * @return {Number}
     */
    getFieldSize: function () {
        return state.getData().size;
    },

    /**
     * @param {Number} newSize
     */
    setFieldSize: function (newSize) {
        if (newSize < 2 || newSize > 12) {
            // This hardcode does not allow too big and too small fields
            return;
        }
        state.setData(this._makeNewField(newSize, null));
    },

    solve: function () {
        let data = state.getData();

        if (data.showSolution) {
            data.showSolution = false;
            state.setData(data);
        } else {
            let request = new LightsOutSolver.FindSolutionRequest(data.size, data.items);
            let response = LightsOutSolver.findSolution(request);
            let update = {solverSucceed: response.success};
            if (response.success) {
                update.tips = response.diffMatrix;
                update.showSolution = true;
            }
            state.setData(update)
        }
    },

    /**
     * @param {Number} i
     * @param {Number} j
     */
    clickCell: function (i, j) {
        let data = state.getData();
        if (!data.playMode) {
            /* Edit mode */
            data.items[i][j] = !data.items[i][j];
            state.setData({items: data.items, showSolution: false});
        } else {
            /* Play mode */
            let request = new LightsOutSolver.SwitchCellRequest(data.size, data.items, i, j);
            let response = LightsOutSolver.switchCell(request);
            data.items = response.newPresentationMatrix;
            if (data.solverSucceed) {
                data.tips[i][j] = data.tips[i][j] !== true;
            }
            state.setData(data);
        }
    },

    /**
     * @return {boolean}
     */
    getPlayMode: function () {
        return state.getData().playMode;
    },

    /**
     * @param {boolean} enabled
     */
    setPlayMode: function (enabled) {
        let data = state.getData();
        data.playMode = enabled;
        state.setData(data);
    },

    randomizeField: function () {
        state.setData(this._makeNewField(state.getData().size, null));
    },

    cleanField: function () {
        let data = state.getData();
        let sum = data.items.reduce((a, v) => (a + v.reduce((a, v) => (a + v), false)), false);

        let fillDirective;
        if (sum === 0) fillDirective = true;
        else if (sum === (data.size * data.size)) fillDirective = false;
        else fillDirective = false;

        state.setData(this._makeNewField(data.size, fillDirective));
    },

};

document.addEventListener('click', function (event) {
    let elem = event.target;
    if (elem.classList.contains('cell')) {
        let i = Number.parseInt(elem.getAttribute('data-cell-i'));
        let j = Number.parseInt(elem.getAttribute('data-cell-j'));
        controller.clickCell(i, j);
    } else if (elem.id === 'button-solve') {
        controller.solve();
    } else if (elem.id === 'button-inc-size' || elem.id === 'button-dec-size') {
        let sizeDelta = (elem.id === 'button-inc-size' ? 1 : -1);
        let newSize = controller.getFieldSize() + sizeDelta;
        controller.setFieldSize(newSize);
    } else if (elem.id === 'button-play-mode') {
        controller.setPlayMode(!controller.getPlayMode());
    } else if (elem.id === 'button-randomize') {
        controller.randomizeField();
    } else if (elem.id === 'button-clean') {
        controller.cleanField();
    }
});

controller.initialize();
