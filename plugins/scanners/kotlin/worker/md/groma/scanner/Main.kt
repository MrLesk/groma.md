package md.groma.scanner

import java.io.PrintStream
import java.nio.file.Path
import kotlin.system.exitProcess
import org.jetbrains.kotlin.com.intellij.openapi.util.Disposer

/** `scan <root>` or `outline <root>`: repository-relative paths arrive on stdin, one JSON document leaves on stdout. */
fun main(args: Array<String>) {
    val disposable = Disposer.newDisposable()
    try {
        require(args.size == 2 && args[0] in setOf("scan", "outline")) { "Expected scan <root> or outline <root>" }
        val parser = Parser(Path.of(args[1]).toRealPath(), disposable)
        val relatives = System.`in`.bufferedReader(Charsets.UTF_8).readLines().filter { it.isNotEmpty() }
        val result = if (args[0] == "scan") Scan.scanRoot(parser, relatives) else Scan.outlineRoot(parser, relatives)
        PrintStream(System.out, true, Charsets.UTF_8).println(Json.encode(result))
    } catch (error: Exception) {
        System.err.println("KOTLIN_SCAN_FAILED: ${error.message}")
        exitProcess(2)
    } finally {
        Disposer.dispose(disposable)
    }
}
