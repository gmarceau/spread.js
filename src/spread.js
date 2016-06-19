
var fs = require('fs'),
    util = require('util'),
    _ = require('underscore'),
    vm = require('vm'),
    path = require('path'),
    child = require('child_process'),
    shell = require('shelljs'),
    jsonParseRaw = require('./json_parse_raw'),
    parse = require('./parse'),
    windows = require('./windows');

var prettyPrintCell = function (cell) {
    if (cell.marker) {
        var dataStr;
        try {
            jsonParseRaw(cell.data)
        } catch (e) {
            dataStr = '"spread.js error, cannot reparse the json output: ' + e.message + '"'
        }

        return cell.code + cell.marker + cell.data
    } else {
        return cell.code
    }
}

var prettyPrint = function (AST) {
    var strings = _.map(AST, prettyPrintCell);
    return strings.join('');
}

var runCell = function (cell, context, filename, lineOffset, columnOffset) {
    var script = new vm.Script(cell.code, {
        filename: filename,
        lineOffset: lineOffset,
        columnOffset: columnOffset
    });
    return script.runInContext(context)
}

var prettyPrintData = function (cell, newData) {
    var lines = JSON.stringify(newData, null, 2).split('\n');

    if (! cell.marker) {
        return { data: lines.join('\n') };
    }

    // There are three cases
    // 1. single-line values, which need nothing special
    // 2. multi-lines arrays, which need a newline
    // 3. multi-lines objects, which need a newline and a bump
    var needsNewline = lines.length > 1;
    var needsBump = lines[0].match(/^\s*{/) && lines.length > 1;

    var marker;
    if (! needsBump) {
        // remove bump, if any
        marker = cell.marker.replace(/\s*(0,)?\s*$/, "")
            + (needsNewline ? '\n' : ' ')

    } else if (! cell.marker.match(/0,\s*$/)) {
        // add the missing bump since it's needed
        var bump = '\n' + ' '.repeat(cell.indentation + 2) + '0, ';
        marker = cell.marker.replace(/\s*$/, bump)
    }

    for(i in lines) {
        if (i != 0 || (needsNewline && ! needsBump))
            lines[i] = ' '.repeat(cell.indentation + 5) + lines[i]
    }
    return {
        marker: marker,
        data: lines.join('\n')
    }
}

var runAST = function (AST, filename, onCellDone) {
    var context = {};
    vm.createContext(context);

    var lineOffset = 0;
    var columnOffset = 0;

    for (cell of AST) {
        var cellResult = runCell(cell, context, filename, lineOffset, columnOffset);
        if (cellResult === undefined) {
            cellResult = {};
        }

        if (! _.isEqual(cellResult, jsonParseRaw(cell.data)[0])) {
            _.extend(cell, prettyPrintData(cell, cellResult));
            cell.changed = true;
        }

        var cellText = prettyPrintCell(cell)
        var cellLines = parse.countLines(cellText)
        lineOffset += cellLines;
        columnOffset = cellLines == 1 ?
            columnOffset + cellText.length :
            parse.tailLength(cellText)


        if (onCellDone)
            onCellDone(cell);
    }
    return AST;
}

var run = function (text, filename) {
    return prettyPrint(runAST(parse.text(text, filename), filename));
}

var runFile = function (filename, onCellDone) {
    var ast = parse.text(fs.readFileSync(filename).toString(), filename);

    runAST(ast, filename, function (cell) {
        if (cell.changed) {
            fs.writeFileSync(filename, prettyPrint(ast))
        }
        if (onCellDone)
            onCellDone(cell)
    })
}

var notifyEmacs = function (filename) {
    var lispTemplate =
        '(progn (set-buffer (find-buffer-visiting "%s")) (revert-buffer nil t))'

    var lisp = util.format(
        lispTemplate,
        path.resolve(filename).replace(/\\/g, '/'))

    var emacsclient;
    if (windows.isWin) {
        emacsclient = windows.emacsclient
    } else {
        emacsclient = shell.which('emacsclient').stdout
    }
    var s = child.spawnSync(emacsclient, ['-n', '--eval', lisp])
    if (s.status != 0) {
        throw new Error('emacsclient failed: ' + (s.stderr && s.stderr.toString()))
    }
}

var main = function () {
    var filename = process.argv[2]
    if (fs.existsSync(filename)) {
        runFile(filename, function (cell) {
            if (cell.changed) {
                notifyEmacs(filename)
            }
        })
    } else {
        console.log(util.format("file %s doesn't exists", filename))
    }

}

module.exports = {
    parse: parse,
    prettyPrint: prettyPrint,
    runCell: runCell,
    prettyPrintData: prettyPrintData,
    runAST: runAST,
    run: run,
    runFile: runFile,
    main: main
};
