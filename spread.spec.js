var should = require('should'),
    _ = require('underscore'),
    spread = require('./spread');

describe('parser', function () {

    describe('tailLength', function () {
        it('works on short strings', function () {
            spread.parse.tailLength('123\n\123\n123456').should.be.eql(6);
        })
    });

    describe('splitData', function () {
        it('works on simple example', function () {
            spread.parse.splitData('{ "a": { "b": 4 } }    xsdqwe ').should.be.deepEqual(
                [ '{ "a": { "b": 4 } }', '    xsdqwe ']);
        });
    });


    var code =
        ' 1 + 5                           ;0,0\n' +
        '\n' +
        '"asd" + "qwe"                   ;0,0\n' +
        '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        ;0,  {"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}\n' +
        '\nvar x = 5\n'

    describe('text', function () {
        it('works on a small example', function () {
            var actual = spread.parse.text(code);
            var expected = [
                { code: ' 1 + 5                           ',
                  data: '0',
                  marker: ';0,',
                  indentation: 33
                },
                { code: '\n\n"asd" + "qwe"                   ',
                  data: '0',
                  marker: ';0,',
                  indentation: 32
                },
                { code: '\n{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        ',
                  data: '  {"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}',
                  marker: ';0,',
                  indentation: 48
                },
                {
                    code: '\n\nvar x = 5\n',
                    data: '',
                    marker: false,
                    indentation: 0
                }
            ];
            actual.length.should.be.eql(expected.length);
            _.forEach(_.zip(actual, expected), function (pair) {
                pair[0].should.be.deepEqual(pair[1])
            })
        })
    })

    describe('prettyPrint', function () {
        it('preserves the original text', function () {
            var parsed = spread.parse.text(code);
            var strings = spread.prettyPrint(parsed)
                .should.be.eql(code);
        })
    })


    describe('run', function () {
        var input =
            [ '1 + 5                           ;0,0',
              '',
              '"asd" + "qwe"                   ;0,0',
              '',
              '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        ;0, {"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}',
              '',
              'var x = 5      ;0,0',
              '',
              ''].join('\n');

        var expected =
            [
                '1 + 5                           ;0, 6',
                '',
                '"asd" + "qwe"                   ;0, "asdqwe"',
                '',
                '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        ;0, [',
                '                                                      1,',
                '                                                      2,',
                '                                                      3,',
                '                                                      {',
                '                                                        "a": 4,',
                '                                                        "b": 5',
                '                                                      },',
                '                                                      6',
                '                                                    ]',
                '',
                'var x = 5      ;0,00.00',
                '',
                ''
            ].join('\n');

        it('runs once correctly', function () {
            var actual = spread.run(input, 'foo.js')
            actual.split('\n').should.be.deepEqual(
                expected.split('\n')
            )
        })

        it('finds a fixed point in two runs', function () {
            var actual = spread.run(spread.run(input, 'foo.js'), 'foo.js')
            actual.split('\n').should.be.deepEqual(
                expected.split('\n')
            )
        })
    })
})
