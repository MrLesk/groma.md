package md.groma.scanner

import org.jetbrains.kotlin.psi.KtNamedFunction

/**
 * Execution entries: a file with a top-level `main`, with the Kotlin files of its build unit. A unit is a directory
 * holding a Maven or Gradle build declaration. Only the declaration's path is used; the build is never read.
 */
object Entries {
    private val BUILD_DECLARATIONS = setOf("pom.xml", "build.gradle", "build.gradle.kts")

    fun isBuildDeclaration(relative: String): Boolean = relative.substringAfterLast('/') in BUILD_DECLARATIONS

    /** Whether the file declares the function the JVM starts: a top-level `main` taking nothing or the arguments. */
    fun declaresMain(source: Source): Boolean = source.file.declarations.any { declaration ->
        declaration is KtNamedFunction && declaration.name == "main" && declaration.hasBody()
            && declaration.receiverTypeReference == null && takesArguments(declaration)
    }

    private fun takesArguments(main: KtNamedFunction): Boolean {
        val parameter = main.valueParameters.singleOrNull() ?: return main.valueParameters.isEmpty()
        val type = parameter.typeReference?.text?.filterNot { it.isWhitespace() }
        return if (parameter.isVarArg) type == "String" else type == "Array<String>"
    }

    /**
     * One entry per file in `mains`, with the `sources` of its own unit. A main under no build declaration reports no
     * entry, because nothing bounds the files that run with it.
     */
    fun of(mains: List<String>, sources: List<String>, declarations: List<String>): List<Map<String, Any?>> {
        val units = declarations.map(::directory).toSet()
        val members = sources.groupBy { unitOf(it, units) }
        return mains.mapNotNull { main ->
            val unit = unitOf(main, units) ?: return@mapNotNull null
            mapOf("file" to main, "declaration" to main, "name" to main.substringAfterLast('/').removeSuffix(".kt"),
                "files" to members.getValue(unit))
        }
    }

    /** The nearest directory above the file that holds a build declaration, so a nested unit keeps its own files. */
    private fun unitOf(relative: String, units: Set<String>): String? =
        generateSequence(directory(relative)) { if (it.isEmpty()) null else directory(it) }.firstOrNull { it in units }

    /** The repository root is the empty directory. */
    private fun directory(relative: String): String = relative.substringBeforeLast('/', "")
}
