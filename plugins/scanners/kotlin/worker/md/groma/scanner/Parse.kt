package md.groma.scanner

import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import org.jetbrains.kotlin.cli.extensionsStorage
import org.jetbrains.kotlin.cli.jvm.compiler.EnvironmentConfigFiles
import org.jetbrains.kotlin.cli.jvm.compiler.KotlinCoreEnvironment
import org.jetbrains.kotlin.com.intellij.openapi.Disposable
import org.jetbrains.kotlin.com.intellij.psi.PsiErrorElement
import org.jetbrains.kotlin.com.intellij.psi.util.PsiTreeUtil
import org.jetbrains.kotlin.compiler.plugin.CompilerPluginRegistrar
import org.jetbrains.kotlin.config.CompilerConfiguration
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtPsiFactory

/** One parsed file. Offsets are UTF-16 offsets into the file as it is on disk. */
class Source(val relative: String, val file: KtFile) {
    private val text = file.text
    private val lineBreaks = text.indices.filter { text[it] == '\n' }

    /** The 1-based line holding an offset. */
    fun line(offset: Int): Int {
        val index = lineBreaks.binarySearch(offset)
        return (if (index < 0) -index - 1 else index) + 1
    }
}

/** The compiler's parser alone: no analysis, classpath, or build model. */
class Parser(private val root: Path, disposable: Disposable) {
    private val factory: KtPsiFactory

    init {
        val configuration = CompilerConfiguration()
        configuration.extensionsStorage = CompilerPluginRegistrar.ExtensionStorage()
        val environment = KotlinCoreEnvironment.createForProduction(disposable, configuration, EnvironmentConfigFiles.JVM_CONFIG_FILES)
        factory = KtPsiFactory(environment.project, markGenerated = false)
    }

    fun read(relative: String): Source {
        val text = try { Files.readString(root.resolve(relative)) }
        catch (error: IOException) { throw IllegalArgumentException("$relative: cannot be read as UTF-8 text: $error") }
        // The parser rejects the carriage returns of CRLF files and a leading byte order mark. Same-length
        // replacements keep every offset and line.
        val source = Source(relative, factory.createFile(relative, text.replace('\r', ' ').replaceFirst(Regex("^\uFEFF"), " ")))
        val error = PsiTreeUtil.findChildOfType(source.file, PsiErrorElement::class.java) ?: return source
        throw IllegalArgumentException("$relative:${source.line(error.textOffset)}: ${error.errorDescription}")
    }
}
