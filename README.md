
`spread.js` is a small command line program that combines `Node.js`,
`Emacs` and `emacsclient` into a minimalist's worksheet interface

`spread.js` evaluates the entire file with `node`. For each top-level
expression, `spread.js` looks for a `//->` marker. If it finds one, it
inserts the result of that expression after the maker _in the source
file itself_. Then it notifies `Emacs` via `emacsclient` to revert the
buffer visiting the file.

This means the result value of each top-level expression will appear
in place, on the screen, in real time, just like they would in a
spreadsheet or a worksheet interface.

The data is inserted into the source file in JSON syntax in such a way
that the file continues to evaluates normally with `Node.js`.

If the following content is in `foo.js`


```javascript

1 + 5                           //-> 0

"asd" + "qwe"                   //-> 0

{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        //-> 0

var x = 5      //-> 0

```

After running `spread.js foo.js` the new content of the file will be

```javascript

1 + 5                           //-> 6

"asd" + "qwe"                   //-> "asdqwe"

{x:[1, 2, 3, { a:4, b: 5} ].concat([6])}        //->
                                                     [
                                                       1,
                                                       2,
                                                       3,
                                                       {
                                                         "a": 4,
                                                         "b": 5
                                                       },
                                                       6
                                                     ]

var x = 5      //-> {}
```

and the corresponding Emacs buffer is updated.

Two things to note:

* Single line JSON values are placed inside the marker
  comment; multiple line values are placed on the line below, indented.
  Since top-level object and arrays are valid javascript, they do not
  interfere with the evaluation of the file

* Since `undefined` is not a valid JSON value, undefined is output as
  as the empty object instead, `{}`.

Known Bug
---------------

* Any text to the right of the value but inside of a comment will be evaluated.
