
var _ = require('underscore'),
    util = require('util'),
    jsonParseRaw = require('./json_parse_raw');

var Marker = '//->'
var MarkerRegExp = /\/\/->\s*(0,)?/g;



var parse = module.exports = {
    countLines: function (str) {
        var m = str.match(/\n/g)
        return m ? m.length : 0
    },

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

    cells: function (splits, filename) {
        var result = [];
        var lineNumber = 0;
        var columnNumber = 0;

        function advance(txt) {
            var lines = parse.countLines(txt);
            lineNumber += lines
            columnNumber = lines > 1 ? parse.tailLength(txt) : columnNumber + txt.length
        }

        while(splits.length > 0) {
            var code = splits.shift();
            advance(code);

            if (splits.length == 0) {
                result.push({
                    code: code,
                    marker: false,
                    data: '',
                    changed: false,
                    indentation: 0,
                })
                return result;
            }

            var marker = splits.shift();
            advance(marker);

            var d;
            try {
                d = parse.splitData(splits.shift());
            } catch (e) {
                var msg = util.format('%s\n    at %s:%d:%d', e.message, filename, lineNumber, columnNumber)
                throw new Error(msg)
            }
            var data = d[0];
            advance(data);

            result.push({
                code: code,
                marker: marker,
                data: data,
                changed: false,
                indentation: parse.tailLength(code),
            })

            if (d[1] !== "") {
                splits.unshift(d[1])
            }
        }

        return result;
    },

    splitMarkers: function (txt) {
        var rg = new RegExp(MarkerRegExp);
        var result = [];
        var current = 0;
        while (match = rg.exec(txt)) {
            result.push(txt.substring(current, match.index))
            result.push(match[0])
            current = match.index + match[0].length
        }
        result.push(txt.substring(current))
        return result;
    },

    text: function (txt, filename) {
        return parse.cells(parse.splitMarkers(txt), filename);
    }
}
