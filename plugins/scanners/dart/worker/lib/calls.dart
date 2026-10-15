import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/ast/visitor.dart';
import 'package:analyzer/source/line_info.dart';

/// Calls owned by one executable body. A nested function has a different caller;
/// without callback binding evidence its body must not leak into this operation.
class Calls extends RecursiveAstVisitor<void> {
  final String operation;
  final LineInfo lines;
  final List<Map<String, Object?>> result = [];
  Calls(this.operation, this.lines);

  void add(AstNode node, String? member) {
    result.add({
      'source': operation, 'targets': <String>[], 'unresolved': true,
      'position': node.offset, 'line': lines.getLocation(node.offset).lineNumber,
      if (member != null) 'member': member,
    });
  }

  @override
  void visitFunctionExpression(FunctionExpression node) {}
  @override
  void visitFunctionDeclaration(FunctionDeclaration node) {}
  @override
  void visitAnnotation(Annotation node) {}

  @override
  void visitMethodInvocation(MethodInvocation node) {
    add(node, node.methodName.name);
    super.visitMethodInvocation(node);
  }

  @override
  void visitInstanceCreationExpression(InstanceCreationExpression node) {
    add(node, node.constructorName.toSource());
    super.visitInstanceCreationExpression(node);
  }

  @override
  void visitFunctionExpressionInvocation(FunctionExpressionInvocation node) {
    add(node, null);
    super.visitFunctionExpressionInvocation(node);
  }

  @override
  void visitSuperConstructorInvocation(SuperConstructorInvocation node) {
    add(node, node.constructorName?.name ?? 'super');
    super.visitSuperConstructorInvocation(node);
  }

  @override
  void visitRedirectingConstructorInvocation(RedirectingConstructorInvocation node) {
    add(node, node.constructorName?.name ?? 'this');
    super.visitRedirectingConstructorInvocation(node);
  }
}
