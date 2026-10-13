package md.groma.scanner

import org.jetbrains.kotlin.config.KotlinCompilerVersion

object Scan {
    private const val ROOT = "scan"

    /**
     * One complete observation for the selected paths; a file that fails to parse fails the whole scan. Kotlin files
     * are parsed. The build declarations among the paths are not read: they only bound the unit of an execution entry.
     */
    fun scanRoot(parser: Parser, selected: List<String>): Map<String, Any?> {
        val (declarations, relatives) = selected.partition(Entries::isBuildDeclaration)
        val files = mutableListOf<Map<String, Any?>>()
        val mains = mutableListOf<String>()
        val operations = mutableListOf<Map<String, Any?>>()
        val invocations = mutableListOf<Map<String, Any?>>()
        val endpoints = mutableListOf<Map<String, Any?>>()
        for (relative in relatives) withinStack(relative) {
            val source = parser.read(relative)
            if (Entries.declaresMain(source)) mains += relative
            val symbols = Symbols.fromSource(source).map { mapOf("id" to it.id, "name" to it.name, "kind" to it.kind) }
            files += mapOf("file" to relative, "roots" to listOf(ROOT), "symbols" to symbols)
            val declared = Operations.fromSource(source)
            endpoints += Endpoints.fromSource(source, declared)
            for (operation in declared) {
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
            "entryPoints" to Entries.of(mains, relatives, declarations),
            "operations" to operations,
            "invocations" to invocations,
            "httpEndpoints" to endpoints,
            "diagnostics" to emptyList<Any>(),
        )
    }

    fun outlineRoot(parser: Parser, relatives: List<String>): List<Map<String, Any?>> {
        val sources = relatives.map { relative -> withinStack(relative) { parser.read(relative) } }
        val visibility = Visibility(sources)
        return sources.map { source -> withinStack(source.relative) {
            mapOf("file" to source.relative, "declarations" to Outline(source, visibility).declarations().map { declaration ->
                mapOf("kind" to declaration.kind, "name" to declaration.name, "line" to declaration.line,
                    "visibility" to declaration.visibility,
                    "members" to declaration.members.map { mapOf("name" to it.name, "line" to it.line, "visibility" to it.visibility) })
            })
        } }
    }

    /**
     * The parser and the call walk recurse once per nested expression. The adapter starts the worker with a large
     * stack; a file nested deeper than that fails by name like any other file the worker cannot read.
     */
    private fun <T> withinStack(relative: String, work: () -> T): T =
        try { work() }
        catch (error: StackOverflowError) { throw IllegalArgumentException("$relative: expressions are nested too deeply to scan") }
}
