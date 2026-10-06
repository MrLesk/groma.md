package md.groma.scanner

import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Path}
import scala.meta.*
import scala.meta.dialects.Scala3
import scala.meta.parsers.Parsed

object Parse {
  private given dialect: Dialect = Scala3

  def read(root: Path, relative: String): Source = {
    val text = Files.readString(root.resolve(relative), StandardCharsets.UTF_8)
    Input.VirtualFile(relative, text).parse[Source] match {
      case Parsed.Success(source) => source
      case error: Parsed.Error =>
        throw new IllegalArgumentException(s"$relative:${error.pos.startLine + 1}: ${error.message}")
    }
  }
}
