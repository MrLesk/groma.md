package md.groma.scanner

import org.jetbrains.kotlin.lexer.KtTokens
import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtConstructor
import org.jetbrains.kotlin.psi.KtDeclaration
import org.jetbrains.kotlin.psi.KtModifierListOwner
import org.jetbrains.kotlin.psi.KtNamedDeclaration
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtObjectDeclaration
import org.jetbrains.kotlin.psi.KtProperty
import org.jetbrains.kotlin.psi.KtSecondaryConstructor

class OutlineMember(val name: String, val line: Int, val visibility: String)
class OutlineDecl(val kind: String, val name: String, val line: Int, val visibility: String, val members: List<OutlineMember>)

/** Top-level types with their functions and constructors, and top-level functions, in source order. */
object Outline {
    fun fromSource(source: Source): List<OutlineDecl> = source.file.declarations.mapNotNull { declaration ->
        when (declaration) {
            is KtClassOrObject -> named(source, declaration)?.let { OutlineDecl("type", it.name, it.line, it.visibility, members(source, declaration)) }
            is KtNamedFunction -> function(source, declaration)
            is KtProperty -> if (declaration.isFunctionValue()) function(source, declaration) else null
            else -> null
        }
    }

    private fun function(source: Source, declaration: KtNamedDeclaration): OutlineDecl? =
        named(source, declaration)?.let { OutlineDecl("function", it.name, it.line, it.visibility, emptyList()) }

    private fun members(source: Source, type: KtClassOrObject): List<OutlineMember> =
        listOfNotNull(type.primaryConstructor?.let { constructor(source, it) }) + type.declarations.flatMap { member(source, it) }

    private fun member(source: Source, declaration: KtDeclaration): List<OutlineMember> = when (declaration) {
        is KtNamedFunction -> listOfNotNull(named(source, declaration))
        is KtSecondaryConstructor -> listOf(constructor(source, declaration))
        // Companion functions are the enclosing type's static functions; other nested types are not listed.
        is KtObjectDeclaration ->
            if (declaration.isCompanion()) declaration.declarations.filterIsInstance<KtNamedFunction>().mapNotNull { named(source, it) }
            else emptyList()
        else -> emptyList()
    }

    /** The name as scans report it: a backticked identifier loses its backticks. */
    private fun named(source: Source, declaration: KtNamedDeclaration): OutlineMember? {
        val name = declaration.name ?: return null
        return declaration.nameIdentifier?.let { OutlineMember(name, source.line(it.textOffset), visibility(declaration)) }
    }

    /** A primary constructor may omit its keyword; its line is then the line of its parameter list. */
    private fun constructor(source: Source, declaration: KtConstructor<*>): OutlineMember {
        val keyword = declaration.getConstructorKeyword() ?: declaration
        return OutlineMember("constructor", source.line(keyword.textOffset), visibility(declaration))
    }

    /** Kotlin's own rule from the modifier written in source; no modifier means public. */
    private fun visibility(declaration: KtModifierListOwner): String = when {
        declaration.hasModifier(KtTokens.PRIVATE_KEYWORD) -> "private"
        declaration.hasModifier(KtTokens.PROTECTED_KEYWORD) -> "protected"
        declaration.hasModifier(KtTokens.INTERNAL_KEYWORD) -> "internal"
        else -> "public"
    }
}
