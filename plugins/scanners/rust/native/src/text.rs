use std::path::Path;

use ra_ap_hir::{Local, Semantics};
use ra_ap_ide_db::RootDatabase;
use ra_ap_syntax::ast::{self, HasName};
use ra_ap_syntax::{AstNode, NodeOrToken, SyntaxKind, SyntaxNode, SyntaxToken, T, TextRange, TextSize};

/// The text of one Rust file as the Rust compiler reads it: every `\r\n` line ending is one `\n`.
/// A file checked out with Windows line endings then means what its `\n` copy means. In the raw
/// file, the `\` that continues a string literal on the next line is followed by `\r`, which is
/// not an escape Rust knows.
///
/// The worker parses only `normalized()`, so an offset in a syntax tree is an offset in that text.
/// The other methods turn such an offset into the place in the file on disk that the worker reports.
pub struct SourceText {
    normalized: String,
    /// The offset in `normalized` of each `\n` that is `\r\n` in the file.
    removed_carriage_returns: Vec<TextSize>,
}

impl SourceText {
    pub fn read(file: &Path) -> std::io::Result<Self> {
        let on_disk = std::fs::read_to_string(file)?;
        let mut normalized = String::with_capacity(on_disk.len());
        let mut removed_carriage_returns = Vec::new();
        let mut rest = on_disk.as_str();
        while let Some(carriage_return) = rest.find("\r\n") {
            normalized.push_str(&rest[..carriage_return]);
            removed_carriage_returns.push(TextSize::of(normalized.as_str()));
            rest = &rest[carriage_return + 1..];
        }
        normalized.push_str(rest);
        Ok(Self { normalized, removed_carriage_returns })
    }

    /// The text to parse.
    pub fn normalized(&self) -> &str {
        &self.normalized
    }

    /// Zero-based UTF-16 offset in the file on disk, the unit the observation contract counts.
    pub fn position(&self, offset: TextSize) -> usize {
        // A carriage return is one UTF-16 unit.
        self.normalized[..usize::from(offset)].encode_utf16().count() + self.carriage_returns_before(offset)
    }

    /// One-based line, which is the same line in the file on disk.
    pub fn line(&self, offset: TextSize) -> usize {
        self.normalized[..usize::from(offset)].bytes().filter(|byte| *byte == b'\n').count() + 1
    }

    /// The byte range in the file on disk.
    pub fn on_disk_range(&self, range: TextRange) -> TextRange {
        let on_disk = |offset| offset + TextSize::new(self.carriage_returns_before(offset) as u32);
        TextRange::new(on_disk(range.start()), on_disk(range.end()))
    }

    fn carriage_returns_before(&self, offset: TextSize) -> usize {
        self.removed_carriage_returns.iter().filter(|line_end| **line_end < offset).count()
    }
}

/// The text of a string literal, without escape sequences.
pub fn string_value(literal: &ast::Literal) -> Option<String> {
    match literal.kind() {
        ast::LiteralKind::String(text) => text.value().ok().map(|value| value.to_string()),
        _ => None,
    }
}

/// The text of an expression that is a plain string literal.
pub fn literal_string(expression: &ast::Expr) -> Option<String> {
    match expression {
        ast::Expr::Literal(literal) => string_value(literal),
        _ => None,
    }
}

/// The last segment name of a path expression, such as `GET` in `Method::GET`.
pub fn path_tail(expression: &ast::Expr) -> Option<String> {
    let ast::Expr::PathExpr(path) = expression else { return None };
    Some(path.path()?.segment()?.name_ref()?.text().to_string())
}

/// Identifier tokens of a macro call's token tree, such as `routes![show, create]`.
pub fn macro_identifiers(call: &ast::MacroCall) -> Vec<String> {
    let Some(tree) = call.token_tree() else { return Vec::new() };
    tree.syntax()
        .descendants_with_tokens()
        .filter_map(|element| element.into_token())
        .filter(|token| token.kind() == SyntaxKind::IDENT)
        .map(|token| token.text().to_string())
        .collect()
}

/// The first argument of a macro or attribute token tree, when it is a string literal.
pub fn first_string(tree: &ast::TokenTree) -> Option<String> {
    token_string(macro_arguments(tree.syntax()).first()?)
}

/// Comma-separated argument token groups of a macro call. A nested group keeps its tokens,
/// delimiters included, so `self.base()` still shows its call.
pub fn macro_arguments(tree: &SyntaxNode) -> Vec<Vec<SyntaxToken>> {
    let mut arguments: Vec<Vec<SyntaxToken>> = vec![Vec::new()];
    for element in tree.children_with_tokens() {
        let group = arguments.last_mut().expect("one group is always open");
        match element {
            // The outer delimiters are this node's own tokens.
            NodeOrToken::Token(token) if token.kind().is_trivia() || delimiter(token.kind()) => {}
            NodeOrToken::Token(token) if token.kind() == T![,] => arguments.push(Vec::new()),
            NodeOrToken::Token(token) => group.push(token),
            NodeOrToken::Node(nested) => {
                let tokens = nested.descendants_with_tokens().filter_map(|element| element.into_token());
                group.extend(tokens.filter(|token| !token.kind().is_trivia()));
            }
        }
    }
    arguments
}

fn delimiter(kind: SyntaxKind) -> bool {
    matches!(kind, T!['('] | T![')'] | T!['['] | T![']'] | T!['{'] | T!['}'])
}

/// The text of a string literal token group, without escape sequences.
pub fn token_string(tokens: &[SyntaxToken]) -> Option<String> {
    let [single] = tokens else { return None };
    if single.kind() != SyntaxKind::STRING {
        return None;
    }
    let text = single.text();
    let plain = text.strip_prefix('"').and_then(|text| text.strip_suffix('"'));
    let raw = text.strip_prefix("r\"").and_then(|text| text.strip_suffix('"'));
    let value = plain.or(raw)?;
    (!value.contains('\\')).then(|| value.to_owned())
}

/// Names the function around a node binds, which shadow a crate constant of the same name.
pub fn bound_names(node: &SyntaxNode) -> std::collections::HashSet<String> {
    let Some(function) = node.ancestors().find_map(ast::Fn::cast) else { return std::collections::HashSet::new() };
    function
        .syntax()
        .descendants()
        .filter_map(ast::IdentPat::cast)
        .filter_map(|pattern| pattern.name())
        .map(|name| name.text().to_string())
        .collect()
}

/// The first argument of a call.
pub fn first_argument(arguments: Option<ast::ArgList>) -> Option<ast::Expr> {
    arguments?.args().next()
}

/// The segment names of the path a call names, such as `["web", "scope"]` for `web::scope(..)`.
pub fn callee(call: &ast::CallExpr) -> Vec<String> {
    let Some(ast::Expr::PathExpr(path)) = call.expr() else { return Vec::new() };
    let segments = path.path().into_iter().flat_map(|path| path.segments().collect::<Vec<_>>());
    segments.filter_map(|segment| Some(segment.name_ref()?.text().to_string())).collect()
}

/// The value an immutable `let` binds to a local; `None` for a `mut` local, a parameter, or a
/// binding without a value.
pub fn let_value(sema: &Semantics<'_, RootDatabase>, local: Local) -> Option<ast::Expr> {
    if local.is_mut(sema.db) {
        return None;
    }
    let pattern = local.primary_source(sema.db).as_ident_pat()?.clone();
    ast::LetStmt::cast(pattern.syntax().parent()?)?.initializer()
}

/// The value a method chain starts from, such as `Client::builder()` in
/// `Client::builder().timeout(t).build()`, seen through `await`, `?` and parentheses.
pub fn receiver_start(call: &ast::MethodCallExpr) -> Option<ast::Expr> {
    let mut current = call.receiver()?;
    loop {
        current = match &current {
            ast::Expr::MethodCallExpr(inner) => inner.receiver()?,
            ast::Expr::AwaitExpr(pending) => pending.expr()?,
            ast::Expr::TryExpr(attempt) => attempt.expr()?,
            ast::Expr::ParenExpr(paren) => paren.expr()?,
            _ => return Some(current),
        };
    }
}

/// An RFC 3986 path character, which the observation contract requires of names and literals.
pub fn path_character(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || b"-._~!$&'()*+,;=:@%".contains(&byte)
}
