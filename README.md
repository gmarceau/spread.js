
`spread.js` is a small command line program that combines Node.js,
Emacs and `emacsclient` into a minimalist's worksheet interface

`spread.js` evaluates the entire file with `node`. For each top-level
expression, `spread.js` looks for a `//->` marker. If it finds one, it
inserts the result of that expression after the maker _in the source
file itself_, replacing the previous value. Then it notifies Emacs via
`emacsclient` to revert the buffer visiting the file.

This means that the result value of each top-level expression will
appear in place, on the screen, in real time, just like they would in
a spreadsheet or a worksheet interface.

The data is inserted into the source file in JSON syntax in such a way
that the file continues to evaluates normally with Node.js.

If the following content is in `foo.js`


```javascript

1 + 5                           //-> 0

"asd" + "qwe"                   //-> 0

var obj = { x: 10 }
obj.y = [1, 2, 3, { a:4, b: 2} ]
obj  //-> 0

var x = 5      //-> 0
```

After running `spread.js foo.js` the new content of the file will be

```javascript

1 + 5                           //-> 6

"foo" + "bar"                   //-> "foobar"

var obj = { x: 10 }
obj.y = [1, 2, 3, { a:4, b: 2} ]
obj  //->
       0, {
            "x": 10,
            "y": [
              1,
              2,
              3,
              {
                "a": 4,
                "b": 2
              }
            ]
          }

var x = 5      //-> {}
```

and the corresponding Emacs buffer is updated.

Four things to note:

* A JSON values must appear to the right of the `//->` maker. When
  writing an empty cell the first time, write `//-> 0` or some other
  placeholder value.

* Single line JSON values are placed inside the marker
  comment; multiple line values are placed on the line below, indented.
  Since most top-level JSON values are valid javascript they do not
  interfere with the evaluation of the file

* However, since top-level object literals are not allowed on the top-level
  in Javascript, when outputing multi-line object literals
  `spread,js` prefixes them with a `0,` to promote them to an
  expression. This maintains compatibility with normal evaluation with
  `node`.

* Since `undefined` is not a valid JSON value, `undefined` is output as
  as the empty object instead, `{}`.


Suggestions
-----------

In Javascript mode, bind `C-c >` to inserting a marker:

```lisp
(define-key js-mode-map
  "\C-c>"
  (lambda () (interactive)
    (progn
      (end-of-line)
      (insert " //-> 0 "))))
```

Then configure Emacs to run `spread.js` on the `after-save-hook` for
every files that ends in `.spread.js`

```lisp
(add-hook
 'after-save-hook
 (lambda ()
   (when (string-match
          "[.]spread[.]js$"
          (buffer-file-name))
     (shell-command (concat "spread.js " (buffer-file-name) " &")))))
```



Known Bug
---------------

* Any text to the right of the value but inside of the marker comment will be evaluated.
