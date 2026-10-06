package md.groma.scanner

import scala.collection.mutable
import scala.meta.*

case class InvocationDecl(source: String, position: Int, line: Int, member: Option[String])

/** Syntax identifies a call site, not the runtime value being called. */
object Calls {
  def fromOperations(operations: List[OperationDecl]): List[InvocationDecl] =
    operations.flatMap { operation =>
      val calls = mutable.ListBuffer.empty[InvocationDecl]
      def walk(tree: Tree): Unit = {
        val member = tree match {
          case apply: Term.Apply => Some(calledName(apply.fun))
          case infix: Term.ApplyInfix => Some(Some(infix.op.value))
          case _ => None
        }
        member.foreach(name => calls += InvocationDecl(operation.id, tree.pos.start, tree.pos.startLine + 1, name))
        tree.children.foreach(walk)
      }
      walk(operation.body)
      calls.toList
    }

  private def calledName(tree: Tree): Option[String] = tree match {
    case name: Term.Name => Some(name.value)
    case select: Term.Select => Some(select.name.value)
    case apply: Term.ApplyType => calledName(apply.fun)
    case _ => None
  }
}
