package md.groma.scanner

import scala.meta.*

case class OutlineMember(name: String, line: Int, visibility: String)
case class OutlineDecl(kind: String, name: String, line: Int, visibility: String, members: List[OutlineMember])

object Outline {
  def fromSource(source: Source): List[OutlineDecl] = source.stats.flatMap(declaration)

  private def declaration(stat: Stat): List[OutlineDecl] = stat match {
    case pkg: Pkg => pkg.body.stats.flatMap(declaration)
    case pkg: Pkg.Object => pkg.templ.stats.flatMap(declaration)
    case extension: Defn.ExtensionGroup => Stats.extensionStats(extension).flatMap(declaration)
    case obj: Defn.Object => List(namedType(obj.name, obj.mods, obj.templ.stats))
    case cls: Defn.Class =>
      val constructor = OutlineMember(cls.name.value, line(cls.name), Visibility.outline(cls.ctor.mods))
      val declared = namedType(cls.name, cls.mods, cls.templ.stats)
      List(declared.copy(members = constructor :: declared.members))
    case trt: Defn.Trait => List(namedType(trt.name, trt.mods, trt.templ.stats))
    case enm: Defn.Enum => List(namedType(enm.name, enm.mods, enm.templ.stats))
    case defn: Defn.Def =>
      List(OutlineDecl("function", defn.name.value, line(defn.name), Visibility.outline(defn.mods), Nil))
    case value: Defn.Val if Stats.functionValueRhs(value.rhs) =>
      value.pats.collect { case Pat.Var(name) =>
        OutlineDecl("function", name.value, line(name), Visibility.outline(value.mods), Nil)
      }
    case _ => Nil
  }

  private def namedType(name: Name, mods: List[Mod], stats: List[Stat]): OutlineDecl =
    OutlineDecl("type", name.value, line(name), Visibility.outline(mods), stats.flatMap(member))

  private def member(stat: Stat): List[OutlineMember] = stat match {
    case extension: Defn.ExtensionGroup => Stats.extensionStats(extension).flatMap(member)
    case defn: Defn.Def =>
      List(OutlineMember(defn.name.value, line(defn.name), Visibility.outline(defn.mods)))
    case decl: Decl.Def =>
      List(OutlineMember(decl.name.value, line(decl.name), Visibility.outline(decl.mods)))
    case ctor: Ctor.Secondary =>
      List(OutlineMember("this", line(ctor), Visibility.outline(ctor.mods)))
    case _ => Nil
  }

  private def line(tree: Tree): Int = tree.pos.startLine + 1
}
