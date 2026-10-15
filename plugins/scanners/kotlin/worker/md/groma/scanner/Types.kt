package md.groma.scanner

import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtDeclaration
import org.jetbrains.kotlin.psi.KtUserType

/** The types declared in the given sources, found by the name a file writes. There is no classpath behind it. */
class Types(sources: List<Source>) {
    private val declared = sources.flatMap { typesIn(it.file.declarations) }
        .filter { it.fqName != null }.groupBy { it.fqName!!.asString() }

    /**
     * The declaration a type name written inside `owner` refers to, or null when the sources do not hold exactly one.
     * It follows enclosing types, explicit imports (including aliases), the file's package and qualified names, but
     * not wildcard imports or type aliases.
     */
    fun resolve(type: KtUserType, owner: KtClassOrObject): KtClassOrObject? {
        val name = generateSequence(type) { it.qualifier }.mapNotNull { it.referencedName }.toList().reversed().joinToString(".")
        val file = owner.containingKtFile
        for (scope in generateSequence(owner.parent) { it.parent }.filterIsInstance<KtClassOrObject>()) {
            declared["${scope.fqName?.asString()}.$name"]?.let { return it.singleOrNull() }
        }
        val first = name.substringBefore('.')
        val imports = file.importDirectives.filter { !it.isAllUnder && it.importedName?.asString() == first }
        if (imports.isNotEmpty()) {
            return imports.flatMap { declared[it.importedFqName!!.asString() + name.removePrefix(first)].orEmpty() }.singleOrNull()
        }
        val local = listOf(file.packageFqName.asString(), name).filter { it.isNotEmpty() }.joinToString(".")
        declared[local]?.let { return it.singleOrNull() }
        return if ('.' in name) declared[name]?.singleOrNull() else null
    }

    private fun typesIn(declarations: List<KtDeclaration>): List<KtClassOrObject> =
        declarations.filterIsInstance<KtClassOrObject>().flatMap { listOf(it) + typesIn(it.declarations) }
}
