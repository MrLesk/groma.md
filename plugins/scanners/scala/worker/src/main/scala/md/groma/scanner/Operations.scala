package md.groma.scanner

import scala.collection.mutable
import scala.meta.*

case class OperationDecl(
  id: String,
  file: String,
  name: String,
  position: Int,
  body: Tree,
)

object Operations {
  def fromSource(file: String, source: Source): List[OperationDecl] = {
    val buffer = mutable.ListBuffer.empty[OperationDecl]
    walkStats(file, source.stats, owner = None, buffer)
    buffer.toList
  }

  private def walkStats(file: String, stats: List[Stat], owner: Option[String], buffer: mutable.ListBuffer[OperationDecl]): Unit =
    stats.foreach(stat => walkStat(file, stat, owner, buffer))

  private def walkStat(file: String, stat: Stat, owner: Option[String], buffer: mutable.ListBuffer[OperationDecl]): Unit = stat match {
    case pkg: Pkg =>
      walkStats(file, pkg.body.stats, owner, buffer)
    case pkgObj: Pkg.Object =>
      walkStats(file, pkgObj.templ.stats, owner, buffer)
    case extension: Defn.ExtensionGroup =>
      walkStats(file, Stats.extensionStats(extension), owner, buffer)
    case obj: Defn.Object =>
      walkStats(file, obj.templ.stats, owner = Some(obj.name.value), buffer)
    case cls: Defn.Class =>
      walkStats(file, cls.templ.stats, owner = Some(cls.name.value), buffer)
    case trt: Defn.Trait =>
      walkStats(file, trt.templ.stats, owner = Some(trt.name.value), buffer)
    case enm: Defn.Enum =>
      walkStats(file, enm.templ.stats, owner = Some(enm.name.value), buffer)
    case defn: Defn.Def =>
      addOperation(file, qualified(owner, defn.name.value), defn, defn.body, buffer)
    case ctor: Ctor.Secondary =>
      addOperation(file, qualified(owner, "this"), ctor, ctor.body, buffer)
    case ga: Defn.GivenAlias =>
      Stats.givenName(ga).foreach { name =>
        addOperation(file, qualified(owner, name), ga, ga.body, buffer)
      }
    case valDefn: Defn.Val if Stats.functionValueRhs(valDefn.rhs) =>
      valNames(valDefn).foreach { name =>
        addOperation(file, qualified(owner, name), valDefn, valDefn.rhs, buffer)
      }
    case _ => ()
  }

  private def addOperation(file: String, name: String, tree: Tree, body: Tree, buffer: mutable.ListBuffer[OperationDecl]): Unit = {
    val position = tree.pos.start
    // The names of `val a, b = ...` share the start of that one definition, so the name keeps their ids distinct.
    val id = s"$file#$name@$position"
    buffer += OperationDecl(id, file, name, position, body)
  }

  private def qualified(owner: Option[String], name: String): String =
    owner.fold(name)(typeName => s"$typeName.$name")

  /** `val a, b = x => x` evaluates its right side once for each name, so each name is its own function value. */
  private def valNames(valDefn: Defn.Val): List[String] =
    valDefn.pats.collect { case Pat.Var(term: Term.Name) => term.value }
}
