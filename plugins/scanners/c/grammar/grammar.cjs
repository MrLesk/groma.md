const c = require('tree-sitter-c/grammar')
// Parse macro candidates without expanding them. The scanner accepts them only with selected-source evidence.
module.exports = grammar(c, {
  name: 'c',
  conflicts: ($, original) => [...original,
    [$._declarator, $.type_specifier, $.macro_type_specifier, $.macro_annotation],
    [$.function_declarator],
    [$._declarator, $.macro_annotation],
    [$._field_declarator, $.macro_specifier],
    [$.type_specifier, $.macro_type_specifier, $.macro_field],
    [$._declarator, $.type_specifier, $.macro_specifier],
    [$.sized_type_specifier, $.macro_specifier],
    [$.type_specifier, $.macro_specifier],
  ],
  rules: {
    // Quoted tokens can occur anywhere in a replacement; outside comments keep the original grammar.
    preproc_arg: _ => {
      const quoted = /"(?:\\(?:\r?\n|[^\r\n])|[^"\\\r\n])*"|'(?:\\(?:\r?\n|[^\r\n])|[^'\\\r\n])*'/
      return token(prec(-1, seq(choice(quoted, /[^\s"']/),
        repeat(choice(quoted, /[^/"'\n]/, seq('/', choice(quoted, /[^*/"']/)), seq(/\/\*([^*]|\*+[^*/])*\*+\//, /[ \t]*\\\r?\n/), /\\\r?\n/)))))
    },
    // Version annotations belong to the following declarator; normal parameter clauses remain unchanged.
    function_declarator: ($, original) => seq(repeat($.macro_annotation), original),
    _function_declaration_declarator: ($, original) => seq(repeat($.macro_annotation), original),
    macro_annotation: $ => prec.dynamic(-2, seq(field('name', $.identifier), field('arguments', $.macro_arguments))),
    macro_arguments: $ => seq('(', $.macro_version, optional(seq(',', $.string_literal)), ')'),
    macro_version: $ => token(prec(-1, /[0-9][0-9A-Za-z_.]*/)),
    parenthesized_field_declarator: ($, original) => choice(original, seq('(', $.macro_specifier, $._field_declarator, ')')),
    macro_statement: $ => seq(field('name', $.identifier), /\r?\n/),
    _non_case_statement: ($, original) => choice(original, $.macro_statement),
    macro_field: $ => seq(field('name', $.identifier), optional($.argument_list), token.immediate(/[ 	]*\r?\n/)),
    _field_declaration_list_item: ($, original) => choice(original, $.macro_field),
    macro_specifier: $ => prec.dynamic(-1, $.identifier),
    // Macro candidates may mix with ordinary prefix modifiers, never with suffix declarator names.
    _declaration_specifiers: $ => prec.right(seq(repeat(choice($.macro_specifier, $._declaration_modifiers)),
      field('type', $.type_specifier), repeat($._declaration_modifiers))),
  },
})
