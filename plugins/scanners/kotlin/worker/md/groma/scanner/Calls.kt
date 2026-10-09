package md.groma.scanner

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
