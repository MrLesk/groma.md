package md.groma.scanner

import scala.meta.*

object Stats {
  def givenName(stat: Defn.GivenAlias): Option[String] =
    Option(stat.name.value).filter(name => name.nonEmpty && name != "_")

  def functionValueRhs(rhs: Tree): Boolean = rhs match {
    case _: Term.AnonymousFunction => true
    case _: Term.Function => true
    case _ => false
  }
}
