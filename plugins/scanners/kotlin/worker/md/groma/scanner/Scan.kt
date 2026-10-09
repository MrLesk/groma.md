package md.groma.scanner

import org.jetbrains.kotlin.config.KotlinCompilerVersion

object Scan {
    private const val ROOT = "scan"

    /** One complete observation for the selected files; a file that fails to parse fails the whole scan. */
    fun scanRoot(parser: Parser, relatives: List<String>): Map<String, Any?> {
        val files = mutableListOf<Map<String, Any?>>()
        val operations = mutableListOf<Map<String, Any?>>()
        val invocations = mutableListOf<Map<String, Any?>>()
        for (relative in relatives) {
            val source = parser.read(relative)
            val symbols = Symbols.fromSource(source).map { mapOf("id" to it.id, "name" to it.name, "kind" to it.kind) }
            files += mapOf("file" to relative, "roots" to listOf(ROOT), "symbols" to symbols)
            for (operation in Operations.fromSource(source)) {
                operations += mapOf("id" to operation.id, "file" to operation.file, "name" to operation.name, "position" to operation.position)
                for (call in Calls.fromOperation(operation)) {
                    invocations += mapOf("source" to call.source, "targets" to emptyList<String>(), "position" to call.position,
                        "line" to source.line(call.position), "unresolved" to true) +
                        (call.member?.let { mapOf("member" to it) } ?: emptyMap())
                }
            }
        }
        return mapOf(
            "schemaVersion" to 1,
            "scanner" to mapOf("id" to "kotlin", "technology" to "kotlin",
                "engine" to "kotlin-compiler-embeddable", "engineVersion" to KotlinCompilerVersion.VERSION),
            "roots" to listOf(mapOf("id" to ROOT, "kind" to "source", "name" to "Kotlin source")),
            "files" to files,
            "operations" to operations,
            "invocations" to invocations,
            "diagnostics" to emptyList<Any>(),
        )
    }

    fun outlineRoot(parser: Parser, relatives: List<String>): List<Map<String, Any?>> = relatives.map { relative ->
        val source = parser.read(relative)
        mapOf("file" to relative, "declarations" to Outline.fromSource(source).map { declaration ->
            mapOf("kind" to declaration.kind, "name" to declaration.name, "line" to declaration.line,
                "visibility" to declaration.visibility,
                "members" to declaration.members.map { mapOf("name" to it.name, "line" to it.line, "visibility" to it.visibility) })
        })
    }
}
