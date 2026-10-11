package scopes
import base.Parent as ImportedParent
sealed class Message(val text: String) {
    constructor() : this("")
}
enum class State(val code: Int) { READY(1) }
open class Base {
    protected open fun hidden() {}
    internal open fun local() {}
    open fun visible() {}
}
open class Middle : Base()
class Derived : Middle() {
    override fun hidden() {}
    override fun local() {}
    override fun visible() {}
}
class CrossFile : ImportedParent() { override fun remote() {} }
class Unknown : missing.ExternalBase() {
    override fun unseen() {}
    public override fun visible() {}
    fun local() {}
}
open class Overloaded {
    protected open fun choose(value: Int) {}
    public open fun choose(value: String) {}
}
class Ambiguous : Overloaded() { override fun choose(value: Int) {} }
open class OverloadRoot { public open fun choose(value: String) {} }
open class OverloadMiddle : OverloadRoot() { protected open fun choose(value: Int) {} }
class InheritedOverload : OverloadMiddle() { override fun choose(value: String) {} }
