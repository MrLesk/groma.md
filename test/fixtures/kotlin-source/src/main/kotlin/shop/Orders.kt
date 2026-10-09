package shop
// UTF-16 location check: 🧭
/** Places orders. */
class Orders(private val store: Store) {
    constructor() : this(Registry.store())
    /** Trimmed. */ fun place(id: Int): String = store.load(id).trim()
    private fun audit() {}
    protected fun first() {}
    internal fun count() {}
    class Nested
    companion object { fun create() = Orders() }
}
interface Store { fun load(id: Int): String }
object Registry { fun store(): Store = TODO() }
enum class Status { OPEN; fun label() = "open" }
fun String.shout() = uppercase()
private fun hidden(store: Store = Registry.store()) {}
val transform = { n: Int -> n + 1 }
typealias Id = Int
val total = 1
fun `quoted name`() {}
var handler = { n: Int -> n }
