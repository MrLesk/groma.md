package md.groma.scanner

import java.nio.file.Path

object Scan {
  def scanRoot(root: Path, relatives: List[String]): Map[String, Any] = {
    val files = List.newBuilder[Map[String, Any]]
    val operations = List.newBuilder[Map[String, Any]]
    val invocations = List.newBuilder[Map[String, Any]]
    val rootId = "scan"

    for (relative <- relatives if relative.nonEmpty) {
      val source = Parse.read(root, relative)
      val symbols = Symbols.fromSource(relative, source).map(symbol =>
        Map("id" -> symbol.id, "name" -> symbol.name, "kind" -> symbol.kind),
      )
      files += Map("file" -> relative, "roots" -> List(rootId), "symbols" -> symbols)
      val fileOperations = Operations.fromSource(relative, source)
      fileOperations.foreach { operation =>
        operations += Map(
          "id" -> operation.id,
          "file" -> operation.file,
          "name" -> operation.name,
          "position" -> operation.position,
        )
      }
      Calls.fromOperations(fileOperations).foreach { call =>
        invocations += Map(
          "source" -> call.source,
          "targets" -> List.empty[String],
          "position" -> call.position,
          "line" -> call.line,
          "unresolved" -> true,
        ) ++ call.member.map(name => Map("member" -> name)).getOrElse(Map.empty)
      }
    }

    Map(
      "schemaVersion" -> 1,
      "scanner" -> Map("id" -> "scala", "technology" -> "scala",
        "engine" -> "scalameta", "engineVersion" -> "4.13.4"),
      "roots" -> List(Map("id" -> rootId, "kind" -> "source", "name" -> "Scala source")),
      "files" -> files.result(),
      "operations" -> operations.result(),
      "invocations" -> invocations.result(),
      "diagnostics" -> List.empty[Map[String, Any]],
    )
  }

  def outlineRoot(root: Path, relatives: List[String]): List[Map[String, Any]] =
    relatives.filter(_.nonEmpty).map { relative =>
      val declarations = Outline.fromSource(Parse.read(root, relative)).map { decl =>
        Map(
          "kind" -> decl.kind,
          "name" -> decl.name,
          "line" -> decl.line,
          "visibility" -> decl.visibility,
          "members" -> decl.members.map(member =>
            Map("name" -> member.name, "line" -> member.line, "visibility" -> member.visibility)),
        )
      }
      Map("file" -> relative, "declarations" -> declarations)
    }
}
