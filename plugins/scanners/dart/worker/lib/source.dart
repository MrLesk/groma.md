import 'package:analyzer/dart/analysis/results.dart';
import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/ast/token.dart';
import 'calls.dart';

/// One physical file owns its declarations and source locations. Part links are
/// resolved later, using only the complete set of selected files.
class SourceEvidence {
  final String file;
  final ParseStringResult parsed;
  final declarations = <Map<String, Object?>>[];
  final symbols = <Map<String, Object?>>[];
  final operations = <Map<String, Object?>>[];
  final invocations = <Map<String, Object?>>[];
  bool main = false;
  SourceEvidence(this.file, this.parsed);

  Map<String, Object?> read() {
    for (final node in parsed.unit.declarations) {
      switch (node) {
        case FunctionDeclaration(): function(node);
        case TopLevelVariableDeclaration(): variables(node);
        case ClassDeclaration(): type(node.namePart, node.body.members, 'class');
        case EnumDeclaration(): type(node.namePart, node.body.members, 'enum');
        case ExtensionTypeDeclaration(): type(node.namePart, node.body.members, 'extension type');
        case MixinDeclaration(): namedType(node.name, node.body.members, 'mixin');
        case ExtensionDeclaration(): extension(node);
      }
    }
    final parts = parsed.unit.directives.whereType<PartDirective>().map((node) => node.uri.stringValue).toList();
    final partOf = parsed.unit.directives.whereType<PartOfDirective>().firstOrNull;
    final library = parsed.unit.directives.whereType<LibraryDirective>().firstOrNull;
    return {
      'file': file, 'symbols': symbols, 'declarations': declarations,
      'operations': operations, 'invocations': invocations, 'main': main,
      'parts': parts, 'isPart': partOf != null,
      'partOfUri': partOf?.uri?.stringValue, 'partOfName': partOf?.libraryName?.toSource(),
      'library': library?.name?.toSource(),
    };
  }

  Map<String, Object?> outline(Token token, {String? name, String? visibility}) => {
    'name': name ?? token.lexeme, 'line': parsed.lineInfo.getLocation(token.offset).lineNumber,
    'visibility': visibility ?? access(token.lexeme),
  };

  String access(String name) => name.startsWith('_') ? 'private' : 'public';

  void symbol(Token token, String kind) {
    symbols.add({'id': '$file:${token.offset}', 'name': token.lexeme, 'kind': kind});
  }

  void function(FunctionDeclaration node) {
    if (node.isGetter || node.isSetter) return;
    symbol(node.name, 'function');
    declarations.add({'kind': 'function', ...outline(node.name)});
    final body = node.functionExpression.body;
    if (body is EmptyFunctionBody) return;
    operation(node, node.name.lexeme, [body]);
    if (node.name.lexeme == 'main') main = true;
  }

  void variables(TopLevelVariableDeclaration node) {
    for (final variable in node.variables.variables) {
      final initializer = variable.initializer;
      if (initializer is! FunctionExpression) continue;
      symbol(variable.name, 'function');
      declarations.add({'kind': 'function', ...outline(variable.name)});
      operation(variable, variable.name.lexeme, [initializer.body]);
    }
  }

  void type(ClassNamePart name, Iterable<ClassMember> body, String kind) {
    final members = <Map<String, Object?>>[];
    if (name is PrimaryConstructorDeclaration) {
      final constructor = name.constructorName?.name;
      final spelling = constructor == null ? name.typeName.lexeme : '${name.typeName.lexeme}.${constructor.lexeme}';
      members.add(outline(constructor ?? name.typeName, name: spelling,
          visibility: access(constructor?.lexeme ?? name.typeName.lexeme)));
      final implementation = name.body;
      if (implementation != null) operation(name, spelling, [...implementation.initializers, implementation.body]);
    }
    namedType(name.typeName, body, kind, members);
  }

  void namedType(Token name, Iterable<ClassMember> body, String kind,
      [List<Map<String, Object?>>? initial]) {
    symbol(name, kind);
    final members = initial ?? <Map<String, Object?>>[];
    readMembers(name.lexeme, body, members);
    declarations.add({'kind': 'type', ...outline(name), 'members': members});
  }

  void readMembers(String owner, Iterable<ClassMember> body, List<Map<String, Object?>> members) {
    for (final member in body) {
      switch (member) {
        case MethodDeclaration():
          if (member.isGetter || member.isSetter) continue;
          members.add(outline(member.name));
          if (member.body is! EmptyFunctionBody) operation(member, '$owner.${member.name.lexeme}', [member.body]);
        case ConstructorDeclaration():
          constructor(owner, member, members);
        default: break;
      }
    }
  }

  void constructor(String owner, ConstructorDeclaration node, List<Map<String, Object?>> members) {
    final name = node.name;
    final spelling = name == null ? owner : '$owner.${name.lexeme}';
    // The pinned analyzer names the physical type token through this public experimental API.
    // ignore: experimental_member_use
    members.add(outline(name ?? node.typeName2 ?? node.newKeyword ?? node.factoryKeyword!,
        name: spelling, visibility: access(name?.lexeme ?? owner)));
    if (node.externalKeyword != null) return;
    operation(node, spelling, [...node.initializers, node.body]);
  }

  // Extensions introduce methods, not a new type. Keep operation evidence but
  // do not invent an outline type or assign methods to their receiver's file.
  void extension(ExtensionDeclaration node) {
    final name = node.name;
    if (name != null) symbol(name, 'extension');
    readMembers(name?.lexeme ?? '<extension@${node.offset}>', node.body.members, []);
  }

  void operation(AstNode node, String name, Iterable<AstNode> bodies) {
    final id = '$file:${node.offset}';
    operations.add({'id': id, 'file': file, 'name': name, 'position': node.offset});
    final visitor = Calls(id, parsed.lineInfo);
    for (final body in bodies) { body.accept(visitor); }
    invocations.addAll(visitor.result);
  }
}
