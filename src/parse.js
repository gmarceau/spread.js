
var _ = require('underscore'),
    jsonParseRaw = require('./json_parse_raw');

var Marker = '//->'
var MarkerRegExp = /\/\/-> *\n?/;


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
