
var _ = require('underscore'),
    jsonParseRaw = require('./json_parse_raw');

var Marker = '//->'
var MarkerRegExp = /\/\/-> *\n?/g;


var parse = module.exports = {

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

        while(splits.length > 0) {
            var code = splits.shift();

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

            var d = parse.splitData(splits.shift());
            var data = d[0];

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

    text: function (txt) {
        return parse.cells(parse.splitMarkers(txt));
    }
}
