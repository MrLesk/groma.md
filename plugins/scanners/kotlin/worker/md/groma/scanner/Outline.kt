package md.groma.scanner

import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtConstructor
import org.jetbrains.kotlin.psi.KtDeclaration
import org.jetbrains.kotlin.psi.KtNamedDeclaration
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtObjectDeclaration
import org.jetbrains.kotlin.psi.KtProperty
import org.jetbrains.kotlin.psi.KtSecondaryConstructor

class OutlineMember(val name: String, val line: Int, val visibility: String)
class OutlineDecl(val kind: String, val name: String, val line: Int, val visibility: String, val members: List<OutlineMember>)

/** Top-level declarations for one file; context contributes inherited visibility, never extra Code files. */
class Outline(private val source: Source, private val visibility: Visibility) {
    fun declarations(): List<OutlineDecl> = source.file.declarations.mapNotNull { declaration ->
        when (declaration) {
            is KtClassOrObject -> named(declaration)?.let { OutlineDecl("type", it.name, it.line, it.visibility, members(declaration)) }
            is KtNamedFunction -> function(declaration)
            is KtProperty -> if (declaration.isFunctionValue()) function(declaration) else null
            else -> null
        }
    }

    private fun function(declaration: KtNamedDeclaration): OutlineDecl? =
        named(declaration)?.let { OutlineDecl("function", it.name, it.line, it.visibility, emptyList()) }

    private fun members(type: KtClassOrObject): List<OutlineMember> =
        listOfNotNull(type.primaryConstructor?.let { constructor(it) }) + type.declarations.flatMap { member(it) }

    private fun member(declaration: KtDeclaration): List<OutlineMember> = when (declaration) {
        is KtNamedFunction -> listOfNotNull(named(declaration))
        is KtSecondaryConstructor -> listOfNotNull(constructor(declaration))
        // Companion functions are listed under the enclosing type; other nested types are not listed.
        is KtObjectDeclaration ->
            if (declaration.isCompanion()) declaration.declarations.filterIsInstance<KtNamedFunction>().mapNotNull { named(it) }
            else emptyList()
        else -> emptyList()
    }

    /** No modifier can mean inherited access. Omit a member when supplied source cannot establish that access. */
    private fun named(declaration: KtNamedDeclaration): OutlineMember? {
        val name = declaration.name ?: return null
        val access = visibility.of(declaration) ?: return null
        return declaration.nameIdentifier?.let { OutlineMember(name, source.line(it.textOffset), access) }
    }

    /** A primary constructor may omit its keyword; its line is then the line of its parameter list. */
    private fun constructor(declaration: KtConstructor<*>): OutlineMember? {
        val keyword = declaration.getConstructorKeyword() ?: declaration
        val access = visibility.of(declaration) ?: return null
        return OutlineMember("constructor", source.line(keyword.textOffset), access)
    }
}
