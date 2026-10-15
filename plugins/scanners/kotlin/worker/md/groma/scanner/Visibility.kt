package md.groma.scanner

import org.jetbrains.kotlin.lexer.KtTokens
import org.jetbrains.kotlin.psi.KtClass
import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtConstructor
import org.jetbrains.kotlin.psi.KtModifierListOwner
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtUserType

/** Resolves access from the selected source only. Null means the source does not prove one visibility. */
class Visibility(sources: List<Source>) {
    private val types = Types(sources)

    fun of(declaration: KtModifierListOwner): String? {
        explicit(declaration)?.let { return it }
        if (declaration is KtConstructor<*>) return constructor(declaration)
        if (declaration !is KtNamedFunction || !declaration.hasModifier(KtTokens.OVERRIDE_KEYWORD)) return "public"
        val owner = generateSequence(declaration.parent) { it.parent }.filterIsInstance<KtClassOrObject>().firstOrNull()
            ?: return null
        val inherited = inherited(owner, declaration, emptySet())
        return inherited.distinct().singleOrNull()
    }

    private fun explicit(declaration: KtModifierListOwner): String? = when {
        declaration.hasModifier(KtTokens.PRIVATE_KEYWORD) -> "private"
        declaration.hasModifier(KtTokens.PROTECTED_KEYWORD) -> "protected"
        declaration.hasModifier(KtTokens.INTERNAL_KEYWORD) -> "internal"
        declaration.hasModifier(KtTokens.PUBLIC_KEYWORD) -> "public"
        else -> null
    }

    private fun constructor(declaration: KtConstructor<*>): String {
        val owner = declaration.getContainingClassOrObject()
        return when {
            owner is KtClass && owner.isEnum() -> "private"
            owner.hasModifier(KtTokens.SEALED_KEYWORD) -> "protected"
            else -> "public"
        }
    }

    private fun inherited(
        owner: KtClassOrObject, function: KtNamedFunction, parents: Set<KtClassOrObject>,
    ): List<String?> {
        if (owner in parents) return listOf(null)
        return owner.superTypeListEntries.flatMap { entry ->
            val type = entry.typeReference?.typeElement as? KtUserType
            val base = type?.let { types.resolve(it, owner) }
            if (base == null) listOf(null)
            else members(base, function, parents + owner)
        }
    }

    private fun members(
        owner: KtClassOrObject, function: KtNamedFunction, parents: Set<KtClassOrObject>,
    ): List<String?> {
        // No overload resolution without a classpath. All plausible declarations must agree on access.
        val candidates = owner.declarations.filterIsInstance<KtNamedFunction>().filter {
            it.name == function.name && it.valueParameters.size == function.valueParameters.size &&
                (it.receiverTypeReference == null) == (function.receiverTypeReference == null)
        }
        // A same-arity overload here does not hide another overload inherited from an ancestor.
        // Unmodified overrides inherit through the same ancestor walk; do not resolve that chain twice.
        val declared = candidates.mapNotNull {
            explicit(it) ?: if (it.hasModifier(KtTokens.OVERRIDE_KEYWORD)) null else "public"
        }
        return declared + inherited(owner, function, parents)
    }
}
