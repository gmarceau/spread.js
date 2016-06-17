//#!/usr/bin/env node

var fs = require('fs'),
    util = require('util'),
    _ = require('underscore'),
    vm = require('vm'),
    path = require('path'),
    child = require('child_process'),
    jsonParseRaw = require('./json_parse_raw');

var Marker = '//->'
var MarkerRegExp = /\/\/-> *\n?/;

var parse = {

    tailLength: function (code) {
        return _.last(code.split('\n')).length;
    },

    splitData: function (split) {
        var endIndex = jsonParseRaw(split)[1];

        var dataPart = split.substring(0, endIndex);
        var tailPart = split.substring(endIndex);

        var whitespaceMatch = dataPart.match(/[ \n]+$/)
        if (whitespaceMatch) {
            tailPart = whitespaceMatch[0] + tailPart;
            dataPart = dataPart.substring(0, whitespaceMatch.index)
        }
        return [dataPart, tailPart]
    },

    cells: function (splits) {
        var result = [];

        var code = splits[0]

        for (split of _.rest(splits)) {
            var d = parse.splitData(split);
            var data = d[0];

            result.push({
                code: code,
                marker: Marker,
                data: data,
                indentation: parse.tailLength(code),
            })

            code = d[1];
        }

        result.push({
            code: code,
            marker: false,
            data: '',
            indentation: 0,
        })

        return result;
    },

    text: function (txt) {
        return parse.cells(txt.split(MarkerRegExp));
    }
}

var prettyPrintCell = function (cell) {
    if (cell.marker) {
        var dataStr;
        try {
            jsonParseRaw(cell.data)
        } catch (e) {
            dataStr = '"spread.js error, non-json: ' + e.message + '"'
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

var countLines = function (str) {
    var m = str.match(/\n/g)
    return m ? m.length : 0
}

var prettyPrintData = function (data, indent) {
    if (data === undefined) {
        return ''
    } else {
        var lines = JSON.stringify(data, null, 2).split('\n');

        if (lines.length == 1)
            return lines[0]
        else {
            for(i in lines)
                lines[i] = ' '.repeat(indent) + lines[i]

            return '\n' + lines.join('\n');
        }
    }
}

var runAST = function (AST, filename, onCellDone) {
    var context = {};
    vm.createContext(context);

    var lineOffset = 0;
    var columnOffset = 0;

    for (cell of AST) {
        var cellResult = runCell(cell, context, filename, lineOffset, columnOffset);
        var cellText = prettyPrintCell(cell)
        var cellLines = countLines(cellText)

        lineOffset += cellLines;
        columnOffset = cellLines == 1 ?
            columnOffset + cellText.length :
            parse.tailLength(cellText)

        cell.data = ' ' + prettyPrintData(cellResult, cell.indentation + cell.marker.length + 1);

        if (onCellDone)
            onCellDone(cell);
    }
    return AST;
}

var run = function (text, filename) {
    return prettyPrint(runAST(parse.text(text), filename));
}

var runFile = function (filename, onCellDone) {
    var ast = parse.text(fs.readFileSync(filename).toString());

    runAST(ast, filename, function (cell) {
        fs.writeFileSync(filename, prettyPrint(ast))
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
            notifyEmacs(filename)
        })
    } else {
        console.log(util.format("file %s doesn't exists", filename))
    }

}

if (process.argv[2]) {
    main()
}

module.exports = {
    parse: parse,
    prettyPrint: prettyPrint,
    runCell: runCell,
    countLines: countLines,
    prettyPrintData: prettyPrintData,
    runAST: runAST,
    run: run,
    runFile: runFile
};
