package scopes
fun outer(value: Int = defaultValue()) {
    fun neverCalled() { hidden() }
    val later = { delayed() }
    val anonymous = fun() { anonymousWork() }
    class Local { fun work() { classWork() } }
    val callback = object {
        val ready = prepareObject()
        var lazy: Int
            get() = getterWork()
            set(value) { setterWork(value) }
        fun work() { objectWork() }
    }
    schedule { deferred() }
    now(value)
}
val namedLambda = { directLambda(); { innerLambda() } }
val namedFunction = fun() { directFunction(); fun nested() { innerFunction() } }
