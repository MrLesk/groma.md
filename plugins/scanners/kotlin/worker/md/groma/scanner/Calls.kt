package md.groma.scanner

import org.jetbrains.kotlin.psi.KtClass
import org.jetbrains.kotlin.psi.KtLambdaExpression
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtPropertyAccessor
import org.jetbrains.kotlin.psi.KtObjectDeclaration
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtQualifiedExpression
import org.jetbrains.kotlin.psi.KtSimpleNameExpression
import org.jetbrains.kotlin.psi.KtTreeVisitorVoid

class InvocationDecl(val source: String, val position: Int, val member: String?)

/** Syntax identifies a call site, not the function or constructor being called. */
object Calls {
    fun fromOperation(operation: OperationDecl): List<InvocationDecl> {
        val calls = mutableListOf<InvocationDecl>()
        operation.body.accept(object : KtTreeVisitorVoid() {
            // A declaration can contain deferred executable bodies without calling them.
            // Only the function or lambda that defines this operation owns its calls.
            override fun visitNamedFunction(function: KtNamedFunction) {
                if (function == operation.body) super.visitNamedFunction(function)
            }
            override fun visitLambdaExpression(lambda: KtLambdaExpression) {
                if (lambda == operation.body) super.visitLambdaExpression(lambda)
            }
            override fun visitClass(klass: KtClass) {}
            override fun visitPropertyAccessor(accessor: KtPropertyAccessor) {}
            override fun visitObjectDeclaration(declaration: KtObjectDeclaration) {
                // An object expression initializes here, but its functions are still separate bodies.
                if (declaration.isObjectLiteral()) super.visitObjectDeclaration(declaration)
            }

            override fun visitCallExpression(expression: KtCallExpression) {
                // `store.load(id)` is a call selected from a receiver; the call site starts at the receiver.
                val receiver = expression.parent as? KtQualifiedExpression
                val site = if (receiver?.selectorExpression == expression) receiver else expression
                val callee = expression.calleeExpression as? KtSimpleNameExpression
                calls += InvocationDecl(operation.id, site.textRange.startOffset, callee?.getReferencedName())
                super.visitCallExpression(expression)
            }
        })
        return calls
    }
}
