var should = require('should'),
    _ = require('underscore'),
    parse = require('./parse');

describe('parser', function () {

    describe('splitMarkers', function () {
        it('work on short strings', function () {
            var actual = parse.splitMarkers('asd //-> {}  qwe //->qw');
            actual.should.be.deepEqual(['asd ', '//-> ', '{}  qwe ', '//->', 'qw']);
        })
    })

    describe('tailLength', function () {
        it('works on short strings', function () {
            parse.tailLength('123\n\123\n123456').should.be.eql(6);
        })
    });

    describe('splitData', function () {
        it('works on simple example', function () {
            parse.splitData('{ "a": { "b": 4 } }    xsdqwe ').should.be.deepEqual(
                [ '{ "a": { "b": 4 } }', '    xsdqwe ']);
        });
    });


    var code =
        ' 1 + 5                           //-> 0\n' +
        '\n' +
        '"asd" + "qwe"                   //->0\n' +
        '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        //->  {"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}\n' +
        '\nvar x = 5\n'

    describe('text', function () {
        it('works on a small example', function () {
            var actual = parse.text(code);
            var expected = [
                { code: ' 1 + 5                           ',
                  data: '0',
                  marker: '//-> ',
                  changed: false,
                  indentation: 33
                },
                { code: '\n\n"asd" + "qwe"                   ',
                  data: '0',
                  marker: '//->',
                  changed: false,
                  indentation: 32
                },
                { code: '\n{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        ',
                  data: '{"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}',
                  marker: '//->  ',
                  changed: false,
                  indentation: 48
                },
                {
                    code: '\n\nvar x = 5\n',
                    data: '',
                    marker: false,
                    changed: false,
                    indentation: 0
                }
            ];

            actual.length.should.be.eql(expected.length);
            _.forEach(_.zip(actual, expected), function (pair) {
                pair[0].should.be.deepEqual(pair[1])
            })
        })
    })

})
