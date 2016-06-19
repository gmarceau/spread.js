var should = require('should'),
    _ = require('underscore'),
    parse = require('./parse');
    spread = require('./spread');

var code =
    ' 1 + 5                           ;0,0\n' +
    '\n' +
    '"asd" + "qwe"                   ;0,0\n' +
    '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        ;0,  {"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}\n' +
    '\nvar x = 5\n'

describe('spread.js', function () {
    describe('prettyPrint', function () {
        it('preserves the original text', function () {
            var parsed = parse.text(code);
            var strings = spread.prettyPrint(parsed)
                .should.be.eql(code);
        })
    })


    describe('run', function () {
        var input =
            [ '1 + 5                           //-> 0',
              '',
              '"asd" + "qwe"                   //-> 0',
              '',
              '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])} //-> {"x": [1, 2, 3, { "a": 4, "b": 5}, 6]}',
              '',
              'var x = 5      //-> 0',
              '',
              ''].join('\n');

        var expected =
            [
                '1 + 5                           //-> 6',
                '',
                '"asd" + "qwe"                   //-> "asdqwe"',
                '',
                '{x:[1, 2, 3, { a:4, b: 5} ].concat([6])} //->',
                '                                              [',
                '                                                1,',
                '                                                2,',
                '                                                3,',
                '                                                {',
                '                                                  "a": 4,',
                '                                                  "b": 5',
                '                                                },',
                '                                                6',
                '                                              ]',
                '',
                'var x = 5      //-> {}',
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
