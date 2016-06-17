
var fs = require('fs'),
    util = require('util'),
    _ = require('underscore'),
    vm = require('vm'),
    path = require('path'),
    child = require('child_process'),
    jsonParseRaw = require('./json_parse_raw'),
    parse = require('./parse');

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

var prettyPrintData = function (data, indent) {
    var lines = JSON.stringify(data, null, 2).split('\n');

    if (lines.length == 1)
        return lines[0]
    else {
        for(i in lines)
            lines[i] = ' '.repeat(indent) + lines[i]

        return '\n' + lines.join('\n');
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
            cell.data = prettyPrintData(cellResult, cell.indentation + cell.marker.length + 1);
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
        '(progn (set-buffer (get-file-buffer "%s")) (revert-buffer nil t))'

    var lisp = util.format(lispTemplate, path.resolve(filename))

    child.execSync(util.format("emacsclient -n --eval '%s'", lisp))
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
