package md.groma.scanner

import scala.meta.*

case class FileSymbol(id: String, name: String, kind: String)

object Symbols {
  def fromSource(file: String, source: Source): List[FileSymbol] =
    source.stats.flatMap(symbols(file, _))

  private def symbols(file: String, stat: Stat): List[FileSymbol] = stat match {
    case pkg: Pkg => pkg.body.stats.flatMap(symbols(file, _))
    case pkg: Pkg.Object => pkg.templ.stats.flatMap(symbols(file, _))
    case obj: Defn.Object => List(named(file, obj.name, "object"))
    case cls: Defn.Class => List(named(file, cls.name, "class"))
    case trt: Defn.Trait => List(named(file, trt.name, "trait"))
    case enm: Defn.Enum => List(named(file, enm.name, "enum"))
    case defn: Defn.Def => List(named(file, defn.name, "def"))
    case value: Defn.Val if Stats.functionValueRhs(value.rhs) =>
      value.pats.collect { case Pat.Var(name) => named(file, name, "function") }
    case _ => Nil
  }

  private def named(file: String, name: Name, kind: String): FileSymbol =
    FileSymbol(s"$file#${name.value}@${name.pos.start}", name.value, kind)
}
