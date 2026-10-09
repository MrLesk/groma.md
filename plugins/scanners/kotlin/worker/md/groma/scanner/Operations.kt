package md.groma.scanner

import org.jetbrains.kotlin.com.intellij.psi.PsiComment
import org.jetbrains.kotlin.com.intellij.psi.PsiWhiteSpace
import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtDeclaration
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtObjectDeclaration
import org.jetbrains.kotlin.psi.KtProperty
import org.jetbrains.kotlin.psi.KtSecondaryConstructor

class OperationDecl(val id: String, val file: String, val name: String, val position: Int, val body: KtElement)

/** Executable work: functions with a body, secondary constructors, and function values, named by their owning types. */
object Operations {
    fun fromSource(source: Source): List<OperationDecl> {
        val operations = mutableListOf<OperationDecl>()
        walk(source.relative, source.file.declarations, null, operations)
        return operations
    }

    private fun walk(file: String, declarations: List<KtDeclaration>, owner: String?, operations: MutableList<OperationDecl>) {
        for (declaration in declarations) when (declaration) {
            is KtClassOrObject -> walk(file, declaration.declarations, typeOwner(declaration, owner), operations)
            is KtNamedFunction -> {
                val name = declaration.name
                val body = declaration.bodyExpression
                if (name != null && body != null) operations += operation(file, qualified(owner, name), declaration, body)
            }
            is KtSecondaryConstructor -> operations += operation(file, qualified(owner, "constructor"), declaration, declaration)
            is KtProperty -> {
                val name = declaration.name
                val value = declaration.initializer
                if (name != null && value != null && declaration.isFunctionValue()) {
                    operations += operation(file, qualified(owner, name), declaration, value)
                }
            }
        }
    }

    /** A companion object holds its enclosing type's static functions, so it adds no owner of its own. */
    private fun typeOwner(type: KtClassOrObject, owner: String?): String? =
        if (type is KtObjectDeclaration && type.isCompanion()) owner
        else type.name?.let { qualified(owner, it) }

    private fun qualified(owner: String?, name: String): String = if (owner == null) name else "$owner.$name"

    /** An operation starts after its KDoc and comments, which the parser keeps inside the declaration. */
    private fun operation(file: String, name: String, declaration: KtDeclaration, body: KtElement): OperationDecl {
        val position = generateSequence(declaration.firstChild) { it.nextSibling }
            .first { it !is PsiComment && it !is PsiWhiteSpace }.textRange.startOffset
        return OperationDecl("$file#$name@$position", file, name, position, body)
    }
}
