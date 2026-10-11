package md.groma.scanner

import org.jetbrains.kotlin.psi.KtClass
import org.jetbrains.kotlin.psi.KtDeclaration
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtObjectDeclaration
import org.jetbrains.kotlin.psi.KtProperty

class FileSymbol(val id: String, val name: String, val kind: String)

/** The top-level declarations Code links can name. */
object Symbols {
    fun fromSource(source: Source): List<FileSymbol> = source.file.declarations.mapNotNull { declaration ->
        val kind = kind(declaration)
        val name = declaration.name
        if (kind == null || name == null) null
        else FileSymbol("${source.relative}#$name@${declaration.textOffset}", name, kind)
    }

    private fun kind(declaration: KtDeclaration): String? = when (declaration) {
        is KtClass -> if (declaration.isInterface()) "interface" else if (declaration.isEnum()) "enum" else "class"
        is KtObjectDeclaration -> "object"
        is KtNamedFunction -> "function"
        is KtProperty -> if (declaration.isFunctionValue()) "function" else null
        else -> null
    }
}
